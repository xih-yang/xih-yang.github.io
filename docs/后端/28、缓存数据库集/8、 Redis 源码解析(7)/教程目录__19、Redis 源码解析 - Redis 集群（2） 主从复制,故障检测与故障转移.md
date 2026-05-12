# 19、Redis 源码解析 - Redis 集群[2] 主从复制,故障检测与故障转移
- 来源：https://ddkk.com/zhuanlan/db/redis/7/19.html
- 分类：缓存数据库
- 分组：教程目录
在redis集群中只有所有的槽都有所属节点以后才会被标记为上线,也就是说如果哪怕只有一个槽没有被分配给集群的节点,那么这个集群都是下线的,因为就算有一个槽没有被分配,向集群中插入数据都是不安全的.而集群中一个节点一般都负责多个槽,如果出现宕机下线,那么整个集群都会下线,这是我们一定不希望看到的.所以在redis集群中节点被分为主节点和从节点.其作用和主从复制中是一样的,可以保证主服务器宕机以后数据不丢失且集群仍能够向外提供服务.

### 主从复制

我们可以使用`CLUSTER REPLCATE `这个命令使一个在集群中的节点成为某个节点的从服务器.

我们可以在`clusterCommand`中找到`REPLCATE`命令的实现.

```java
else if (!strcasecmp(c->argv[1]->ptr,"replicate") && c->argc == 3) {
        /* CLUSTER REPLICATE <NODE ID> */
        // 将当前节点设置为 NODE_ID 指定的节点的从节点（复制品）
        // 根据名字查找节点
        clusterNode *n = clusterLookupNode(c->argv[2]->ptr);
        /* Lookup the specified node in our table. */
        if (!n) {
            addReplyErrorFormat(c,"Unknown node %s", (char*)c->argv[2]->ptr);
            return;
        }
        /* I can't replicate myself. */
        // 指定节点是自己，不能进行复制
        if (n == myself) {
            addReplyError(c,"Can't replicate myself");
            return;
        }
        /* Can't replicate a slave. */
        // 不能复制一个从节点
        if (n->slaveof != NULL) {
            addReplyError(c,"I can only replicate a master, not a slave.");
            return;
        }
        /* If the instance is currently a master, it should have no assigned
         * slots nor keys to accept to replicate some other node.
         * Slaves can switch to another master without issues. */
        // 节点必须没有被指派任何槽，并且本数据库必须为空 
        //define nodeIsMaster(n) ((n)->flags & REDIS_NODE_MASTER)
        if (nodeIsMaster(myself) &&
            (myself->numslots != 0 || dictSize(server.db[0].dict) != 0)) {
            addReplyError(c,
                "To set a master the node must be empty and "
                "without assigned slots.");
            return;
        }
        /* Set the master. */
        // 将节点 n 设为本节点的主节点
        clusterSetMaster(n);
        clusterDoBeforeSleep(CLUSTER_TODO_UPDATE_STATE|CLUSTER_TODO_SAVE_CONFIG);
        addReply(c,shared.ok);
    }
	void clusterSetMaster(clusterNode *n) {
	    redisAssert(n != myself);
	    redisAssert(myself->numslots == 0);
	    if (nodeIsMaster(myself)) {
	        myself->flags &= ~REDIS_NODE_MASTER; //flag中去掉master 改为slave
	        myself->flags |= REDIS_NODE_SLAVE;
	        clusterCloseAllSlots();
	    } else {
      // 证明从节点也可成为其他服务器的从节点
	        if (myself->slaveof) //在主节点的slaves数组中找到本节点 然后删除
	            clusterNodeRemoveSlave(myself->slaveof,myself);
	    }
	    // 将 slaveof 属性指向主节点
	    myself->slaveof = n;
	    clusterNodeAddSlave(n,myself);//将myself加入到master的从节点名单中
	    replicationSetMaster(n->ip, n->port); //设置主服务器的ip和port
	    resetManualFailover(); //手动故障转移相关
	}
```

### 故障检测

故障检测中最重要的结构就是`fail_reports`链表,其中存储着`clusterNodeFailReport`的信息,具体如下:

```java
struct clusterNodeFailReport {
    // 报告目标节点已经下线的节点
    struct clusterNode *node;  /* Node reporting the failure condition. */
    // 最后一次从 node 节点收到下线报告的时间
    // 程序使用这个时间戳来检查下线报告是否过期
    mstime_t time;             /* Time of the last report from this node. */
} typedef clusterNodeFailReport;
```

故障检测的具体流程如下

**1、** 集群之间互相发送心跳包,当节点A没有在规定时间内向节点B发送PING的回复的话节点B认为节点A疑似下线(probablefail,PFAIL).；

**2、** 集群之间通过发送心跳包来互相获取信息,可以得到某个节点现在处于上面状态(PFAIL,FAIL),当检测到为PFAIL时会向本节点的fail_reports推入一个clusterNodeFailReport结构,并修改flag.当A节点发现B节点在A这里获得的clusterNodeFailReport已经超过集群总节点/2+1的项,这时会将其标记为FAIL,并广播`FAIL(Gossip)`消息,每个收到这个消息的节点都会修改状态为`FAIL`,此时全部节点就知道这个节点已经下线了.；

我们来看看一般的PING心跳包的发送过程,在`clusterCron`中,我们可以看到`PFAIL`的标记过程

```java
	.............
    if (!(iteration % 10)) {
        int j;
        /* Check a few random nodes and ping the one with the oldest
         * pong_received time. */
        // 随机 5 个节点，选出其中一个
        for (j = 0; j < 5; j++) {
            // 随机在集群中挑选节点
            de = dictGetRandomKey(server.cluster->nodes);
            clusterNode *this = dictGetVal(de);
            /* Don't ping nodes disconnected or with a ping currently active. */
            // 不要 PING 连接断开的节点，也不要 PING 最近已经 PING 过的节点
            if (this->link == NULL || this->ping_sent != 0) continue;
            if (this->flags & (REDIS_NODE_MYSELF|REDIS_NODE_HANDSHAKE))
                continue;
            // 选出 5 个随机节点中最近一次接收 PONG 回复距离现在最旧的节点
            if (min_pong_node == NULL || min_pong > this->pong_received) {
                min_pong_node = this;
                min_pong = this->pong_received;
            }
        }
        // 向最久没有收到 PONG 回复的节点发送 PING 命令
        if (min_pong_node) {
            redisLog(REDIS_DEBUG,"Pinging node %.40s", min_pong_node->name);
            clusterSendPing(min_pong_node->link, CLUSTERMSG_TYPE_PING);
        }
    }
    .........
    di = dictGetSafeIterator(server.cluster->nodes); //获取迭代器
    while((de = dictNext(di)) != NULL) {
        clusterNode *node = dictGetVal(de);
        now = mstime(); /* Use an updated time at every iteration. */
        mstime_t delay;
        // 跳过节点本身、无地址节点、HANDSHAKE 状态的节点 剩下的就是连接正常的节点喽
        if (node->flags &
            (REDIS_NODE_MYSELF|REDIS_NODE_NOADDR|REDIS_NODE_HANDSHAKE))
                continue;
        /* Orphaned master check, useful only if the current instance
         * is a slave that may migrate to another master. */
        if (nodeIsSlave(myself) && nodeIsMaster(node) && !nodeFailed(node)) {
            int okslaves = clusterCountNonFailingSlaves(node);//计算状态正常的从节点数
            if (okslaves == 0 && node->numslots > 0) orphaned_masters++;//记录有多少主节点没有从节点
            if (okslaves > max_slaves) max_slaves = okslaves;//更新最大从节点数
            if (nodeIsSlave(myself) && myself->slaveof == node)
                this_slaves = okslaves;
        }
        /* If we are waiting for the PONG more than half the cluster
         * timeout, reconnect the link: maybe there is a connection
         * issue even if the node is alive. */
        // 如果等到 PONG 到达的时间超过了 node timeout 一半的连接
        // 因为尽管节点依然正常，但连接可能已经出问题了
        if (node->link && /* is connected */
            now - node->link->ctime >//连接创建的时间
            server.cluster_node_timeout && /* was not already reconnected */
            node->ping_sent && /* we already sent a ping */
            node->pong_received < node->ping_sent && /* still waiting pong */
            // 最后一次接收pong时间小于最后一次发ping的时间
            /* and we are waiting for the pong more than timeout/2 */
            now - node->ping_sent > server.cluster_node_timeout/2) //
            //距离上次发送ping已经过去了cluster_node_timeout的一半
        {
            /* Disconnect the link, it will be reconnected automatically. */
            // 释放连接，下次 clusterCron() 会自动重连
            freeClusterLink(node->link);
        }
        /* If we have currently no active ping in this instance, and the
         * received PONG is older than half the cluster timeout, send
         * a new ping now, to ensure all the nodes are pinged without
         * a too big delay. */
        // 如果目前没有在 PING 节点
        // 并且已经有 node timeout 一半的时间没有从节点那里收到 PONG 回复
        // 那么向节点发送一个 PING ，确保节点的信息不会太旧
        // （因为一部分节点可能一直没有被随机中）
        if (node->link &&
            node->ping_sent == 0 &&
            (now - node->pong_received) > server.cluster_node_timeout/2)
        {
            clusterSendPing(node->link, CLUSTERMSG_TYPE_PING);
            continue;
        }
        /* If we are a master and one of the slaves requested a manual
         * failover, ping it continuously. */
        // 如果这是一个主节点，并且有一个从服务器请求进行手动故障转移
        // 那么向从服务器发送 PING 。
        if (server.cluster->mf_end &&
            nodeIsMaster(myself) &&
            server.cluster->mf_slave == node &&
            node->link)
        {
            clusterSendPing(node->link, CLUSTERMSG_TYPE_PING);
            continue;
        }
        /* Check only if we have an active ping for this instance. */
        // 以下代码只在节点发送了 PING 命令的情况下执行
        if (node->ping_sent == 0) continue;
        /* Compute the delay of the PONG. Note that if we already received
         * the PONG, then node->ping_sent is zero, so can't reach this
         * code at all. */
        // 计算等待 PONG 回复的时长
        delay = now - node->ping_sent;
        // 等待 PONG 回复的时长超过了限制值，将目标节点标记为 PFAIL （疑似下线）
        if (delay > server.cluster_node_timeout) {
            /* Timeout reached. Set the node as possibly failing if it is
             * not already in this state. */
            if (!(node->flags & (REDIS_NODE_PFAIL|REDIS_NODE_FAIL))) {
                redisLog(REDIS_DEBUG,"*** NODE %.40s possibly failing",
                    node->name);
                // 打开疑似下线标记
                node->flags |= REDIS_NODE_PFAIL;
                update_state = 1;
            }
        }
    }
```

那么当某个节点中出现了被标记为`FAIL`的节点以后会发发生什么呢?答案在PING命令的处理函数`clusterProcessGossipSection`中

```java
// 处理gossip部分 在上一篇中说过
void clusterProcessGossipSection(clusterMsg *hdr, clusterLink*link) {
	................
    // 遍历所有节点的信息
    while(count--) {
	...............
        node = clusterLookupNode(g->nodename);
        // 节点已经存在于当前节点
        if (node) {
            /* We already know this node.
               Handle failure reports, only when the sender is a master. */
            // 如果 sender 是一个主节点，那么我们需要处理下线报告
            if (sender && nodeIsMaster(sender) && node != myself) {
                // 节点处于 FAIL 或者 PFAIL 状态
                if (flags & (REDIS_NODE_FAIL|REDIS_NODE_PFAIL)) {
                    // 当检测状态为以上两个的时候添加下线报告
                    if (clusterNodeAddFailureReport(node,sender)) {
                        redisLog(REDIS_VERBOSE,
                            "Node %.40s reported node %.40s as not reachable.",
                            sender->name, node->name);
                    }
                    // 尝试将 node 标记为 FAIL 关键
                    markNodeAsFailingIfNeeded(node);
                // 节点处于正常状态
                } else {
                    // 如果 sender 曾经发送过对 node 的下线报告
                    // 那么清除该报告
                    if (clusterNodeDelFailureReport(node,sender)) {
                        redisLog(REDIS_VERBOSE,
                            "Node %.40s reported node %.40s is back online.",
                            sender->name, node->name);
                    }
                }
            }
		...............
}
```

```java
void markNodeAsFailingIfNeeded(clusterNode *node) {
    int failures;
    // 标记为 FAIL 所需的节点数量，需要超过集群节点数量的一半
    int needed_quorum = (server.cluster->size / 2) + 1;
    if (!nodeTimedOut(node)) return; /* We can reach it. */
    if (nodeFailed(node)) return; /* Already FAILing. */
    // 统计将 node 标记为 PFAIL 或者 FAIL 的节点数量（不包括当前节点）
    failures = clusterNodeFailureReportsCount(node);
    /* Also count myself as a voter if I'm a master. */
    // 如果当前节点是主节点，那么将当前节点也算在 failures 之内
    if (nodeIsMaster(myself)) failures++;
    // 报告下线节点的数量不足节点总数的一半，不能将节点判断为 FAIL ，返回
    if (failures < needed_quorum) return; /* No weak agreement from masters. */
    redisLog(REDIS_NOTICE,
        "Marking node %.40s as failing (quorum reached).", node->name);
    /* Mark the node as failing. */
    // 将 node 标记为 FAIL
    node->flags &= ~REDIS_NODE_PFAIL;
    node->flags |= REDIS_NODE_FAIL;
    node->fail_time = mstime();
    /* Broadcast the failing node name to everybody, forcing all the other
     * reachable nodes to flag the node as FAIL. */
    // 如果当前节点是主节点的话，那么广播FAIL信息
    if (nodeIsMaster(myself)) clusterSendFail(node->name);
    clusterDoBeforeSleep(CLUSTER_TODO_UPDATE_STATE|CLUSTER_TODO_SAVE_CONFIG);
}
```

那么其他节点在接收到FAIL信息以后会干些什么呢?来看看消息的处理函数`clusterProcessPacket`

```java
		// 这是一条 FAIL 消息： sender 告知当前节点，某个节点已经进入 FAIL 状态。
	 else if (type == CLUSTERMSG_TYPE_FAIL) {
        clusterNode *failing;
        if (sender) {
            // 获取下线节点的消息
            failing = clusterLookupNode(hdr->data.fail.about.nodename);
            // 下线的节点既不是当前节点，也没有处于 FAIL 状态
            if (failing &&
                !(failing->flags & (REDIS_NODE_FAIL|REDIS_NODE_MYSELF)))
            {
                redisLog(REDIS_NOTICE,
                    "FAIL message received from %.40s about %.40s",
                    hdr->sender, hdr->data.fail.about.nodename);
                // 打开 FAIL 状态
                failing->flags |= REDIS_NODE_FAIL;
                failing->fail_time = mstime();
                // 关闭 PFAIL 状态
                failing->flags &= ~REDIS_NODE_PFAIL;
                clusterDoBeforeSleep(CLUSTER_TODO_SAVE_CONFIG|
                                     CLUSTER_TODO_UPDATE_STATE);
            }
        } else {
            redisLog(REDIS_NOTICE,
                "Ignoring FAIL message from unknonw node %.40s about %.40s",
                hdr->sender, hdr->data.fail.about.nodename);
        }
    }
```

到这里,从节点就可以从某个主节点哪里得到自己的主节点已经下线的事实.

### 故障转移

**接着上面来说,一个主节点认为某个主服务器已经下线,并将状态设置为FAIL的时候,会进行一次FAIL消息的广播,那么从服务器也一定可以收到.这是所有的从服务器中会进行一次选举,选出一个leader作为主服务器,选举的过程其实类似与sentinel中的选举,都是raft算法的选举部分.就是向其他集群中的其他主服务器发送CLUSTERMSG_TYPE_FAILOVER_AUTH_REQUEST消息,当一个主节点收到这条消息且当前纪元内为投票就会返回一个CLUSTERMSG_TYPE_FAILOVER_AUTH_ACK消息,代表这个同意这次"拉票",当一个从节点票数多于全部主节点的一半加1的时候,这个从节点会执行slaveof no one升级为主节点,并广播一个PONG消息,其实也就是发一个心跳包,告知其他节点它的状态已经发生改变.如果一个纪元内投票失败的话就会等待下次选举.这其中比较有意思的是从节点在发现其主节点下线时，并不是立即发起故障转移流程,而是会设置一个执行故障转移时间,到了那个时间才可以进行,计算公式如下**:

```java
mstime() + 500ms + random()%500ms + rank*1000ms
```

那么为什么要设置一个随机的开始时间呢?其实和sentinel中的改变时间事件的频率一样,是为了减小此次选举不出现leader的可能性.

从节点执行投票和广播的函数为`clusterHandleSlaveFailover`

#### 从节点请求投票

```java
void clusterHandleSlaveFailover(void) {
    mstime_t data_age;
    // failover_auth_time为可以开始执行选举的时间
    // 集群初始化时该属性置为0,一旦满足开始故障转移的条件后,该属性就置为未来的某个时间点
    mstime_t auth_age = mstime() - server.cluster->failover_auth_time;
    int needed_quorum = (server.cluster->size / 2) + 1; //选举成功需要的票数
    int manual_failover = server.cluster->mf_end != 0 &&
                          server.cluster->mf_can_start; //判断是否为手动故障转移
    int j;
    mstime_t auth_timeout, auth_retry_time;
    server.cluster->todo_before_sleep &= ~CLUSTER_TODO_HANDLE_FAILOVER;
    /* Compute the failover timeout (the max time we have to send votes
     * and wait for replies), and the failover retry time (the time to wait
     * before waiting again.
     *
     * Timeout is MIN(NODE_TIMEOUT*2,2000) milliseconds.
     * Retry is two times the Timeout.
     */
    auth_timeout = server.cluster_node_timeout*2; //故障转移的超时时间
    if (auth_timeout < 2000) auth_timeout = 2000; //至少两秒
    auth_retry_time = auth_timeout*2; //auth_retry_time为下一次故障转移的时间
    /* Pre conditions to run the function, that must be met both in case
     * of an automatic or manual failover:
     * 1) We are a slave.
     * 2) Our master is flagged as FAIL, or this is a manual failover.
     * 3) It is serving slots. */
    // 判断能否进行故障转移 满足以下条件直接退出
    // 1.主节点
    // 2.不存在主节点
    // 3.主节点flag不是FAIL
    // 4.主服务器没有负责的slot
    if (nodeIsMaster(myself) ||
        myself->slaveof == NULL ||
        (!nodeFailed(myself->slaveof) && !manual_failover) ||
        myself->slaveof->numslots == 0) return;
    /* Set data_age to the number of seconds we are disconnected from
     * the master. */
    // 将 data_age 设置为从节点与主节点的断开秒数
    if (server.repl_state == REDIS_REPL_CONNECTED) {
     //当前时间减去最后一次互动的时间
        data_age = (mstime_t)(server.unixtime - server.master->lastinteraction) 
                   * 1000;
    } else {
     //当前时间减去断开的时间
        data_age = (mstime_t)(server.unixtime - server.repl_down_since) * 1000;
    }
    /* Remove the node timeout from the data age as it is fine that we are
     * disconnected from our master at least for the time it was down to be
     * flagged as FAIL, that's the baseline. */
    // node timeout 的时间不计入断线时间之内
    if (data_age > server.cluster_node_timeout)
        data_age -= server.cluster_node_timeout;
        // 减去cluster_node_timeout的原因为 在cluster_node_timeout时间没有收到PING的信息算是下线
        // 我们需要的是判断下线之前的信息
    /* Check if our data is recent enough. For now we just use a fixed
     * constant of ten times the node timeout since the cluster should
     * react much faster to a master down.
     *
     * Check bypassed for manual failovers. */
    // 检查这个从节点的数据是否足够新：
    // 目前的检测办法是断线时间不能超过 node timeout 的十倍
    if (data_age >
        ((mstime_t)server.repl_ping_slave_period * 1000) +
        (server.cluster_node_timeout * REDIS_CLUSTER_SLAVE_VALIDITY_MULT))
    {
        if (!manual_failover) return;
    }
    /* If the previous failover attempt timedout and the retry time has
     * elapsed, we can setup a new one. */
    if (auth_age > auth_retry_time) {
      //表示可以进行下一次故障转移
        // 首先更新下一次故障转移开始的最新时间
        // 计算公式为mstime() + 500 +random()%500 + rank*1000 
        // rank由clusterGetSlaveRank函数得到
        server.cluster->failover_auth_time = mstime() +
            500 + /* Fixed delay of 500 milliseconds, let FAIL msg propagate. */
            random() % 500; /* Random delay between 0 and 500 milliseconds. */
        server.cluster->failover_auth_count = 0; //获得的票数
        server.cluster->failover_auth_sent = 0; //此节点是否已经发送投票请求
        server.cluster->failover_auth_rank = clusterGetSlaveRank();
        /* We add another delay that is proportional to the slave rank.
         * Specifically 1 second * rank. This way slaves that have a probably
         * less updated replication offset, are penalized. */
        server.cluster->failover_auth_time +=
            server.cluster->failover_auth_rank * 1000;
        /* However if this is a manual failover, no delay is needed. */
        if (server.cluster->mf_end) {
            server.cluster->failover_auth_time = mstime();
            server.cluster->failover_auth_rank = 0;
        }
        redisLog(REDIS_WARNING,
            "Start of election delayed for %lld milliseconds "
            "(rank%d, offset %lld).",
            server.cluster->failover_auth_time - mstime(), //打印下次可能开始选举的时间
            server.cluster->failover_auth_rank,
            replicationGetSlaveOffset());
        /* Now that we have a scheduled election, broadcast our offset
         * to all the other slaves so that they'll updated their offsets
         * if our offset is better. */
        clusterBroadcastPong(CLUSTER_BROADCAST_LOCAL_SLAVES);
        return;
    }
    /* It is possible that we received more updated offsets from other
     * slaves for the same master since we computed our election delay.
     * Update the delay if our rank changed.
     *
     * Not performed if this is a manual failover. */
    if (server.cluster->failover_auth_sent == 0 &&
        server.cluster->mf_end == 0)
    {
        int newrank = clusterGetSlaveRank(); //更新rank
        if (newrank > server.cluster->failover_auth_rank) {
            long long added_delay =
                (newrank - server.cluster->failover_auth_rank) * 1000;
            server.cluster->failover_auth_time += added_delay;
            server.cluster->failover_auth_rank = newrank;
            redisLog(REDIS_WARNING,
                "Slave rank updated to%d, added %lld milliseconds of delay.",
                newrank, added_delay);
        }
    }
    /* Return ASAP if we can't still start the election. */
    // 如果执行故障转移的时间未到，先返回
    if (mstime() < server.cluster->failover_auth_time) return;
    /* Return ASAP if the election is too old to be valid. */
    // 如果距离应该执行故障转移的时间已经过了很久
    // 那么不应该再执行故障转移了（因为可能已经没有需要了）
    // 超时直接返回
    if (auth_age > auth_timeout) return;
    /* Ask for votes if needed. */
    // 向其他节点发送故障转移请求
    if (server.cluster->failover_auth_sent == 0) {
        // 增加配置纪元
        server.cluster->currentEpoch++;
        // 记录发起故障转移的配置纪元
        server.cluster->failover_auth_epoch = server.cluster->currentEpoch;
        redisLog(REDIS_WARNING,"Starting a failover election for epoch %llu.",
            (unsigned long long) server.cluster->currentEpoch);
        // 广播，看它们是否支持由本节点来对下线主节点进行故障转移
        clusterRequestFailoverAuth();
        // 打开标识，表示已发送信息 下次就不会进入这里
        server.cluster->failover_auth_sent = 1;
        // TODO:
        // 在进入下个事件循环之前，执行：
        // 1）保存配置文件
        // 2）更新节点状态
        // 3）同步配置
        clusterDoBeforeSleep(CLUSTER_TODO_SAVE_CONFIG|
                             CLUSTER_TODO_UPDATE_STATE|
                             CLUSTER_TODO_FSYNC_CONFIG);
        return; /* Wait for replies. */
    }
    /* Check if we reached the quorum. */
    // 如果当前节点获得了足够多的投票，那么对下线主节点进行故障转移
    if (server.cluster->failover_auth_count >= needed_quorum) {
        // 旧主节点
        clusterNode *oldmaster = myself->slaveof;
        redisLog(REDIS_WARNING,
            "Failover election won: I'm the new master.");
        /* We have the quorum, perform all the steps to correctly promote
         * this slave to a master.
         *
         * 1) Turn this node into a master. 
         *    将当前节点的身份由从节点改为主节点
         */
        clusterSetNodeAsMaster(myself);
        // 让从节点取消复制，成为新的主节点
        replicationUnsetMaster();
        /* 2) Claim all the slots assigned to our master. */
        // 接收所有主节点负责处理的槽
        for (j = 0; j < REDIS_CLUSTER_SLOTS; j++) {
            if (clusterNodeGetSlotBit(oldmaster,j)) {
                // 将槽设置为未分配的
                clusterDelSlot(j);
                // 将槽的负责人设置为当前节点
                clusterAddSlot(myself,j);
            }
        }
        /* 3) Update my configEpoch to the epoch of the election. */
        // 更新集群配置纪元
        myself->configEpoch = server.cluster->failover_auth_epoch;
        /* 4) Update state and save config. */
        // 更新节点状态
        clusterUpdateState();
        // 并保存配置文件
        clusterSaveConfigOrDie(1);
        /* 5) Pong all the other nodes so that they can update the state
         *    accordingly and detect that we switched to master role. */
        // 向所有节点发送 PONG 信息
        // 让它们可以知道当前节点已经升级为主节点了
        clusterBroadcastPong(CLUSTER_BROADCAST_ALL);
        /* 6) If there was a manual failover in progress, clear the state. */
        // 如果有手动故障转移正在执行，那么清理和它有关的状态
        resetManualFailover();
    }
}
```

#### 主节点投票

其实就是对于CLUSTERMSG_TYPE_FAILOVER_AUTH_REQUEST消息的回复信息.在`clusterProcessPacket`中,其他主服务器判断收到的是CLUSTERMSG_TYPE_FAILOVER_AUTH_REQUEST包后就会调用`clusterSendFailoverAuthIfNeeded`函数.

```java
// 在条件满足的情况下，为请求进行故障转移的节点 node 进行投票，支持它进行故障转移 request为收到的消息正文
void clusterSendFailoverAuthIfNeeded(clusterNode *node, clusterMsg *request) {
    // 请求节点的主节点
    clusterNode *master = node->slaveof;
    // 请求节点的当前配置纪元
    uint64_t requestCurrentEpoch = ntohu64(request->currentEpoch);
    // 请求节点想要获得投票的纪元
    uint64_t requestConfigEpoch = ntohu64(request->configEpoch);
    // 请求节点的槽布局
    unsigned char *claimed_slots = request->myslots;
    int force_ack = request->mflags[0] & CLUSTERMSG_FLAG0_FORCEACK;
    int j;
    /* IF we are not a master serving at least 1 slot, we don't have the
     * right to vote, as the cluster size in Redis Cluster is the number
     * of masters serving at least one slot, and quorum is the cluster
     * size + 1 */
    // 如果节点为从节点，或者是一个没有处理任何槽的主节点，
    // 那么它没有投票权
    if (nodeIsSlave(myself) || myself->numslots == 0) return;
    /* Request epoch must be >= our currentEpoch. */
    // 请求的配置纪元必须大于等于当前节点的配置纪元 这样当前节点才有资格投票
    if (requestCurrentEpoch < server.cluster->currentEpoch) return;
    /* I already voted for this epoch? Return ASAP. */
    // 已经投过票了
    if (server.cluster->lastVoteEpoch == server.cluster->currentEpoch) return;
    /* Node must be a slave and its master down.
     * The master can be non failing if the request is flagged
     * with CLUSTERMSG_FLAG0_FORCEACK (manual failover). */
    // 目标节点必须为从节点且其主节点下线
    if (nodeIsMaster(node) || master == NULL || 
        (!nodeFailed(master) && !force_ack)) return;
    /* We did not voted for a slave about this master for two
     * times the node timeout. This is not strictly needed for correctness
     * of the algorithm but makes the base case more linear. */
    // 如果之前一段时间已经对请求节点进行过投票，那么不进行投票
    if (mstime() - node->slaveof->voted_time < server.cluster_node_timeout * 2)
        return;
    /* The slave requesting the vote must have a configEpoch for the claimed
     * slots that is >= the one of the masters currently serving the same
     * slots in the current configuration. */
    for (j = 0; j < REDIS_CLUSTER_SLOTS; j++) {
        // 跳过未指派节点
        if (bitmapTestBit(claimed_slots, j) == 0) continue;
        // 查找是否有某个槽的配置纪元大于节点请求的纪元
        if (server.cluster->slots[j] == NULL ||
            server.cluster->slots[j]->configEpoch <= requestConfigEpoch)
        {
            continue;
        }
        // 如果有的话，说明节点请求的纪元已经过期，没有必要进行投票
        /* If we reached this point we found a slot that in our current slots
         * is served by a master with a greater configEpoch than the one claimed
         * by the slave requesting our vote. Refuse to vote for this slave. */
        return;
    }
    // 以上就是判断本节点是否有资格进行投票
    /* We can vote for this slave. */
    // 为节点投票 即发送CLUSTERMSG_TYPE_FAILOVER_AUTH_ASK
    clusterSendFailoverAuth(node);
    // 更新时间值
    server.cluster->lastVoteEpoch = server.cluster->currentEpoch;
    node->slaveof->voted_time = mstime();
}
```

#### 从节点接收投票

当从节点收到CLUSTERMSG_TYPE_FAILOVER_AUTH_ASK就是收到了一个投票,处理函数在`clusterProcessPacket`

```java
else if (type == CLUSTERMSG_TYPE_FAILOVER_AUTH_ACK) {
		// 发送者在此集群中不存在当然要退出 
        if (!sender) return 1;  /* We don't know that node. */
        /* We consider this vote only if the sender is a master serving
         * a non zero number of slots, and its currentEpoch is greater or
         * equal to epoch where this node started the election. */
        // 只有正在处理至少一个槽的主节点的投票会被视为是有效投票
        // 只有符合以下条件， sender 的投票才算有效：
        // 1） sender 是主节点
        // 2） sender 正在处理至少一个槽
        // 3） sender 的配置纪元大于等于当前节点的配置纪元
        if (nodeIsMaster(sender) && sender->numslots > 0 &&
            senderCurrentEpoch >= server.cluster->failover_auth_epoch)
        {
            // 增加支持票数
            server.cluster->failover_auth_count++;
            /* Maybe we reached a quorum here, set a flag to make sure
             * we check ASAP. */
            clusterDoBeforeSleep(CLUSTER_TODO_HANDLE_FAILOVER);
        }
    }
```

这样在再次进入`clusterHandleSlaveFailover`的时候就可以判断此次投票是否成功了.

#### 更新配置

当从节点确定自己为主节点的时候会进行PONG消息的广播,其中带着自己的最新槽位信息,其他节点收到后要进行修改,此部分在`clusterProcessPacket`中处理.

```java
        if (sender) {
            // 发送消息的节点的 slaveof 为 REDIS_NODE_NULL_NAME
            // 那么 sender 就是一个主节点
            if (!memcmp(hdr->slaveof,REDIS_NODE_NULL_NAME,
                sizeof(hdr->slaveof)))
            {
                /* Node is a master. */
                // 设置 sender 为主节点
                clusterSetNodeAsMaster(sender);
            }
         }
         .................
if (sender) {
            sender_master = nodeIsMaster(sender) ? sender : sender->slaveof;
            if (sender_master) {
      //dirty_slots为发送节点锁宣称的槽位于本节点的信息是否相同 不同设置为1
                dirty_slots = memcmp(sender_master->slots,
                        hdr->myslots,sizeof(hdr->myslots)) != 0;
            }
        }
        /* 1) If the sender of the message is a master, and we detected that
         *    the set of slots it claims changed, scan the slots to see if we
         *    need to update our configuration. */
        // 如果 sender 是主节点，并且 sender 的槽布局出现了变动
        // 那么检查当前节点对 sender 的槽布局设置，看是否需要进行更新
        if (sender && nodeIsMaster(sender) && dirty_slots)
            clusterUpdateSlotsConfigWith(sender,senderConfigEpoch,hdr->myslots); //更新槽
        /* 2) We also check for the reverse condition, that is, the sender
         *    claims to serve slots we know are served by a master with a
         *    greater configEpoch. If this happens we inform the sender.
         *
         *    检测和条件 1 的相反条件，也即是，
         *    sender 处理的槽的配置纪元比当前节点已知的某个节点的配置纪元要低，
         *    如果是这样的话，通知 sender 。
         *
         * This is useful because sometimes after a partition heals, a
         * reappearing master may be the last one to claim a given set of
         * hash slots, but with a configuration that other instances know to
         * be deprecated. Example:
         *
         * 这种情况可能会出现在网络分裂中，
         * 一个重新上线的主节点可能会带有已经过时的槽布局。
         *
         * 比如说：
         *
         * A and B are master and slave for slots 1,2,3.
         * A 负责槽 1 、 2 、 3 ，而 B 是 A 的从节点。
         *
         * A is partitioned away, B gets promoted.
         * A 从网络中分裂出去，B 被提升为主节点。
         *
         * B is partitioned away, and A returns available.
         * B 从网络中分裂出去， A 重新上线（但是它所使用的槽布局是旧的）。
         *
         * Usually B would PING A publishing its set of served slots and its
         * configEpoch, but because of the partition B can't inform A of the
         * new configuration, so other nodes that have an updated table must
         * do it. In this way A will stop to act as a master (or can try to
         * failover if there are the conditions to win the election).
         *
         * 在正常情况下， B 应该向 A 发送 PING 消息，告知 A ，自己（B）已经接替了
         * 槽 1、 2、 3 ，并且带有更更的配置纪元，但因为网络分裂的缘故，
         * 节点 B 没办法通知节点 A ，
         * 所以通知节点 A 它带有的槽布局已经更新的工作就交给其他知道 B 带有更高配置纪元的节点来做。
         * 当 A 接到其他节点关于节点 B 的消息时，
         * 节点 A 就会停止自己的主节点工作，又或者重新进行故障转移。
         */
        if (sender && dirty_slots) {
            int j;
            for (j = 0; j < REDIS_CLUSTER_SLOTS; j++) {
                // 检测 slots 中的槽 j 是否已经被指派
                if (bitmapTestBit(hdr->myslots,j)) {
                    // 当前节点认为槽 j 由 sender 负责处理，
                    // 或者当前节点认为该槽未指派，那么跳过该槽
                    if (server.cluster->slots[j] == sender ||
                        server.cluster->slots[j] == NULL) continue;
                    // 当前节点槽 j 的配置纪元比 sender 的配置纪元要大
                    if (server.cluster->slots[j]->configEpoch >
                        senderConfigEpoch)
                    {
                        redisLog(REDIS_VERBOSE,
                            "Node %.40s has old slots configuration, sending "
                            "an UPDATE message about %.40s",
                                sender->name, server.cluster->slots[j]->name);
                        // 向 sender 发送关于槽 j 的更新信息
                        clusterSendUpdate(sender->link,
                            server.cluster->slots[j]);
                        /* TODO: instead of exiting the loop send every other
                         * UPDATE packet for other nodes that are the new owner
                         * of sender's slots. */
                        break;
                    }
                }
            }
        }
```

这里面比较有意思的就是去发来的消息的配置纪元低于本端中某一项的配置纪元,代表这个节点可以前面可能处于网络分区中,需要对其发送一个更新消息,即调用`clusterSendUpdate`.我们来看看`UPDATE`信息如何被处理,在`clusterProcessPacket`函数中

```java
else if (type == CLUSTERMSG_TYPE_UPDATE) {
        clusterNode *n; /* The node the update is about. */
        uint64_t reportedConfigEpoch =
                    ntohu64(hdr->data.update.nodecfg.configEpoch);
        if (!sender) return 1;  /* We don't know the sender. */
        // 获取需要更新的节点
        n = clusterLookupNode(hdr->data.update.nodecfg.nodename);
        if (!n) return 1;   /* We don't know the reported node. */
        // 消息的纪元并不大于节点 n 所处的配置纪元
        // 无须更新
        if (n->configEpoch >= reportedConfigEpoch) return 1; /* Nothing new. */
        /* If in our current config the node is a slave, set it as a master. */
        // 如果节点 n 为从节点，但它的槽配置更新了
        // 那么说明这个节点已经变为主节点，将它设置为主节点
        if (nodeIsSlave(n)) clusterSetNodeAsMaster(n);
        /* Update the node's configEpoch. */
        n->configEpoch = reportedConfigEpoch; //更新配置纪元为新主节点的配置纪元
        clusterDoBeforeSleep(CLUSTER_TODO_SAVE_CONFIG|
                             CLUSTER_TODO_FSYNC_CONFIG);
        /* Check the bitmap of served slots and udpate our
         * config accordingly. */
        // 将消息中对 n 的槽布局与当前节点对 n 的槽布局进行对比
        // 在有需要时更新当前节点对 n 的槽布局的认识
        clusterUpdateSlotsConfigWith(n,reportedConfigEpoch,
            hdr->data.update.nodecfg.slots);
    }
```

```java
void clusterUpdateSlotsConfigWith(clusterNode *sender, uint64_t senderConfigEpoch, unsigned char *slots) {
    int j;
    clusterNode *curmaster, *newmaster = NULL;
    /* The dirty slots list is a list of slots for which we lose the ownership
     * while having still keys inside. This usually happens after a failover
     * or after a manual cluster reconfiguration operated by the admin.
     *
     * If the update message is not able to demote a master to slave (in this
     * case we'll resync with the master updating the whole key space), we
     * need to delete all the keys in the slots we lost ownership. */
    uint16_t dirty_slots[REDIS_CLUSTER_SLOTS];
    int dirty_slots_count = 0;
    /* Here we set curmaster to this node or the node this node
     * replicates to if it's a slave. In the for loop we are
     * interested to check if slots are taken away from curmaster. */
    // 1）如果当前节点是主节点，那么将 curmaster 设置为当前节点
    // 2）如果当前节点是从节点，那么将 curmaster 设置为当前节点正在复制的主节点
    // 稍后在 for 循环中我们将使用 curmaster 检查与当前节点有关的槽是否发生了变动
    curmaster = nodeIsMaster(myself) ? myself : myself->slaveof;
    if (sender == myself) {
        redisLog(REDIS_WARNING,"Discarding UPDATE message about myself.");
        return;
    }
    // 更新槽布局
    for (j = 0; j < REDIS_CLUSTER_SLOTS; j++) {
        // 如果 slots 中的槽 j 已经被指派，那么执行以下代码
        if (bitmapTestBit(slots,j)) {
            /* The slot is already bound to the sender of this message. */
            if (server.cluster->slots[j] == sender) continue;
            /* The slot is in importing state, it should be modified only
             * manually via redis-trib (example: a resharding is in progress
             * and the migrating side slot was already closed and is advertising
             * a new config. We still want the slot to be closed manually). */
            if (server.cluster->importing_slots_from[j]) continue;
            /* We rebind the slot to the new node claiming it if:
             * 1) The slot was unassigned or the new node claims it with a
             *    greater configEpoch.
             * 2) We are not currently importing the slot. */
            if (server.cluster->slots[j] == NULL || //集群刚刚建立
                server.cluster->slots[j]->configEpoch < senderConfigEpoch)//或者纪元小于sender的纪元
            {
                /* Was this slot mine, and still contains keys? Mark it as
                 * a dirty slot. */
                if (server.cluster->slots[j] == myself &&
                    countKeysInSlot(j) && //指定槽中有键
                    sender != myself) //发送者的最新信息和槽在本节点的信息不同
                {
                    dirty_slots[dirty_slots_count] = j;
                    dirty_slots_count++;
                }
                // 负责槽 j 的原节点是当前节点的主节点？
                // 如果是的话，说明故障转移发生了，将当前节点的复制对象设置为新的主节点
                if (server.cluster->slots[j] == curmaster)
                    newmaster = sender;
                // 将槽 j 设为未指派
                clusterDelSlot(j);
                // 将槽 j 指派给 sender
                clusterAddSlot(sender,j);
                clusterDoBeforeSleep(CLUSTER_TODO_SAVE_CONFIG|
                                     CLUSTER_TODO_UPDATE_STATE|
                                     CLUSTER_TODO_FSYNC_CONFIG);
            }
        }
    }
    /* If at least one slot was reassigned from a node to another node
     * with a greater configEpoch, it is possible that:
     *
     * 如果当前节点（或者当前节点的主节点）有至少一个槽被指派到了 sender
     * 并且 sender 的 configEpoch 比当前节点的纪元要大，
     * 那么可能发生了：
     *
     * 1) We are a master left without slots. This means that we were
     *    failed over and we should turn into a replica of the new
     *    master.
     *    当前节点是一个不再处理任何槽的主节点，
     *    这时应该将当前节点设置为新主节点的从节点。
     * 2) We are a slave and our master is left without slots. We need
     *    to replicate to the new slots owner. 
     *    当前节点是一个从节点，
     *    并且当前节点的主节点已经不再处理任何槽，
     *    这时应该将当前节点设置为新主节点的从节点。
     */
    if (newmaster && curmaster->numslots == 0) {
      //此节点为从节点
        redisLog(REDIS_WARNING,
            "Configuration change detected. Reconfiguring myself "
            "as a replica of %.40s", sender->name);
        // 将 sender 设置为当前节点的主节点
        clusterSetMaster(sender);
        clusterDoBeforeSleep(CLUSTER_TODO_SAVE_CONFIG|
                             CLUSTER_TODO_UPDATE_STATE|
                             CLUSTER_TODO_FSYNC_CONFIG);
    } else if (dirty_slots_count) {
     //跑到着一般是上面的第二个条件不满足
    	//能到这说明还是主节点,只不过删除了一些键 
        /* If we are here, we received an update message which removed
         * ownership for certain slots we still have keys about, but still
         * we are serving some slots, so this master node was not demoted to
         * a slave.
         *
         * In order to maintain a consistent state between keys and slots
         * we need to remove all the keys from the slots we lost. */
        for (j = 0; j < dirty_slots_count; j++)
            delKeysInSlot(dirty_slots[j]);
    }
```

这个函数会由很多种角色的节点执行，比如是**之前下线的主节点**，经过一段时间后，又重新上线了，该重新上线主节点会收到其他节点发来的UPDATE包，会通过该函数更新自己的配置信息，并成为其他节点的从节点；也可以是**已下线主节点的其他从节点**，收到新主节点发来的心跳包之后，通过该函数更新自己的配置信息，并成为新上任主节点的从节点；**又可以是集群中的其他节点**，收到新主节点发来的心跳包后，仅仅更新自己的配置信息；**或者是集群刚建立时**，当前节点收到其他节点宣称负责某些槽位的包后，更新自己的配置信息.
