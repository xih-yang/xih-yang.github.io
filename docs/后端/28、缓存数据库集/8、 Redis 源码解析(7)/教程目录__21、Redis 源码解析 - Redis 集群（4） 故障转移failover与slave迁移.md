# 21、Redis 源码解析 - Redis 集群[4] 故障转移failover与slave迁移
- 来源：https://ddkk.com/zhuanlan/db/redis/7/21.html
- 分类：缓存数据库
- 分组：教程目录
在redis集群中一般来说我们需要给每个负责至少一个槽位的主节点都配置从节点,因为主节点加入出现某些不可控情况宕机,它的槽上数据就没办法转移了,也就是说这几个槽现在是没有人负责的,这是整个集群就处于下线状态了.所以redis给我们提供了failover和slave晋升这两种方法来改变这种情况.

**1、****failover**:向集群中一个从节点发送`CLUSTERFAILOVER`,此时这个从节点升级为主节点,原主节点降级为从节点.；

**2、****slave迁移**:集群中如果发现某个主节点是孤立的主节点,那么某个主节点的从节点就会进行转移,变成这个孤立主节点的从节点.；

### failover

我们更加详细的讨论下这个命令,具体过程如下

**1、** 选择一个从节点发送`CLUSTERFAILOVER`.；

**2、** 从节点收到命令后,向主节点发送`CLUSTERMSG_TYPE_MFSTART`；

**3、** 主节点收到以后会将其所有客户端置于阻塞状态,在10秒以内不再处理客户端发来的命令.并且在其发送的心跳包中,会带有`CLUSTERMSG_FLAG0_PAUSED`标记.；

**4、** 从节点收到主节点发来的带`CLUSTERMSG_FLAG0_PAUSED`标记的心跳包后,从中得到主节点最新的复制偏移量.等到这个节点的偏移量到达此值的时候开始进行故障转移的正常流程.；

其实`failover`支持两个选项:

**1、**`FORCE`:从节点不会与主节点进行交互,直接进行故障转移流程.；

**2、**`TAKEOVER`:故障转移正常流程也不遵循,即不发起选举,直接升级为主节点.；

我这个版本中貌似是不支持`TAKEOVER`的.

因为`FORCE`和`TAKEOVER`不需要和主节点进行数据交互,所以可以在主节点已经下线的情况下进行,而`CLUSTER FAILOVER`只能在主节点在线情况 下使用.

#### CLUSTER FAILOVER

`CLUSTER FAILOVER`命令的具体处理逻辑在`clusterCommand`中.

```java
else if (!strcasecmp(c->argv[1]->ptr,"failover") &&
               (c->argc == 2 || c->argc == 3))
    {
        /* CLUSTER FAILOVER [FORCE] */
        // 执行手动故障转移
        int force = 0;
        if (c->argc == 3) {
      //判断是否加了[FORCE]参数
            if (!strcasecmp(c->argv[2]->ptr,"force")) {
                force = 1;
            } else {
                addReply(c,shared.syntaxerr);
                return;
            }
        }
        // 命令只能发送给从节点
        if (nodeIsMaster(myself)) {
            addReplyError(c,"You should send CLUSTER FAILOVER to a slave");
            return;
        } else if (!force &&
                   (myself->slaveof == NULL || nodeFailed(myself->slaveof) ||
                   myself->slaveof->link == NULL))
        {
            // 如果主节点已下线或者处于失效状态
            // 并且命令没有给定 force 参数，那么命令执行失败
            addReplyError(c,"Master is down or failed, "
                            "please use CLUSTER FAILOVER FORCE");
            return;
        }
        // 重置手动故障转移的有关属性
        resetManualFailover();
        // 设定手动故障转移的最大执行时限
        server.cluster->mf_end = mstime() + REDIS_CLUSTER_MF_TIMEOUT;//(5秒)
        /* If this is a forced failover, we don't need to talk with our master
         * to agree about the offset. We just failover taking over it without
         * coordination. */
        // 如果这是强制的手动 failover ，那么直接开始 failover ，
        // 无须向其他 master 沟通偏移量。
        if (force) {
            // 如果这是强制的手动故障转移,那么直接开始执行故障转移操作
            server.cluster->mf_can_start = 1;
        } else {
            // 如果不是强制的话,那么需要和主节点比对相互的偏移量是否一致,即向主节点发送CLUSTERMSG_TYPE_MFSTART包
            clusterSendMFStart(myself->slaveof);
        }
        redisLog(REDIS_WARNING,"Manual failover user request accepted.");
        addReply(c,shared.ok);
    }
```

#### CLUSTERMSG_TYPE_MFSTART

在`clusterProcessPacket`中我们可以看到`CLUSTERMSG_TYPE_MFSTART`的处理过程.

```java
else if (type == CLUSTERMSG_TYPE_MFSTART) {
        /* This message is acceptable only if I'm a master and the sender
         * is one of my slaves. */
        // 本端中找不到发送消息的客户端 或者发送者不是本节点的从节点
        if (!sender || sender->slaveof != myself) return 1;
        /* Manual failover requested from slaves. Initialize the state
         * accordingly. */
        resetManualFailover();
        server.cluster->mf_end = mstime() + REDIS_CLUSTER_MF_TIMEOUT;//(5秒)
        server.cluster->mf_slave = sender;
        pauseClients(mstime()+(REDIS_CLUSTER_MF_TIMEOUT*2)); //阻塞客户端10秒 不接受消息 用于与从服务器对齐偏移量
        redisLog(REDIS_WARNING,"Manual failover requested by slave %.40s.",
            sender->name);
    }
void pauseClients(mstime_t end) {
    // 设置暂停时间
    if (!server.clients_paused || end > server.clients_pause_end_time)
        server.clients_pause_end_time = end;
    // 打开客户端的“已被暂停”标志 后面发送的心跳包都会带有CLUSTERMSG_FLAG0_PAUSED标志
    server.clients_paused = 1;
}
```

#### CLUSTERMSG_FLAG0_PAUSED

在构建消息包的时候如果发现了当前节点正在处于手动状态转移时,会在消息包(心跳包)中加上`CLUSTERMSG_FLAG0_PAUSED`标记,其他项还是一样.具体逻辑处理在`clusterBuildMessageHdr`中

```java
    if (nodeIsMaster(myself) && server.cluster->mf_end)
        hdr->mflags[0] |= CLUSTERMSG_FLAG0_PAUSED;
```

当从服务器发现来的包中带有`CLUSTERMSG_FLAG0_PAUSED`状态的时候会做如下处理,其实也就是更新下最新的偏移量,等到偏移量为这个值时开始故障转移.具体逻辑处理在`clusterProcessPacket`中

```java
sender->repl_offset = ntohu64(hdr->offset); //这个节点的目前偏移量
sender->repl_offset_time = mstime(); //更新最后一次更新偏移量的时间
/* If we are a slave performing a manual failover and our master
 * sent its offset while already paused, populate the MF state. */
if (server.cluster->mf_end && // 处于手动转移故障状态
    nodeIsSlave(myself) && // 本节点为从节点
    myself->slaveof == sender && //sender为本节点主节点
    hdr->mflags[0] & CLUSTERMSG_FLAG0_PAUSED &&
    server.cluster->mf_master_offset == 0) //手动故障转移收到的第一个更新包
{
    server.cluster->mf_master_offset = sender->repl_offset; //更新主服务器的偏移
    redisLog(REDIS_WARNING,
        "Received replication offset for paused "
        "master manual failover: %lld",
        server.cluster->mf_master_offset);
}
```

接下来的工作就是看什么时候能够到达这个主服务器发来的最新偏移量.那个时候就可以开始故障转移了.具体处理逻辑在`clusterCron`中,其实就是在判断了当前节点为从节点以后执行`clusterHandleManualFailover`函数,所以基本逻辑都在`clusterHandleManualFailover`中.

```java
void clusterHandleManualFailover(void) {
    /* Return ASAP if no manual failover is in progress. */
    if (server.cluster->mf_end == 0) return; // 未处于手动故障转移状态
    /* If mf_can_start is non-zero, the failover was alrady triggered so the
     * next steps are performed by clusterHandleSlaveFailover(). */
    // 不为零证明要么为force选项,要么已经完成便宜来那个对齐,开始下一阶段的操作了,即执行clusterHandleSlaveFailover
    if (server.cluster->mf_can_start) return;
    // 还未接收到主服务器发来的最新偏移量
    if (server.cluster->mf_master_offset == 0) return; /* Wait for offset... */
    // 将目标偏移量与本服务器偏移量作对比
    if (server.cluster->mf_master_offset == replicationGetSlaveOffset()) {
        /* Our replication offset matches the master replication offset
         * announced after clients were paused. We can start the failover. */
        server.cluster->mf_can_start = 1; //证明已经完成对齐
        redisLog(REDIS_WARNING,
            "All master replication stream processed, "
            "manual failover can start.");
    }
}
```

`clusterHandleSlaveFailover`函数其实在前面文章中我们已经说过了,其中的`manual_failover`代表了手动故障转移部分,如果手动故障转移已经开始但是偏移量还没有对齐直接退出.

```java
    int manual_failover = server.cluster->mf_end != 0 &&
                          server.cluster->mf_can_start;
	..................
    if (nodeIsMaster(myself) ||
        myself->slaveof == NULL ||
        (!nodeFailed(myself->slaveof) && !manual_failover) ||
        myself->slaveof->numslots == 0) return;
```

当然也会去检查此次转移是否超时,即`manualFailoverCheckTimeout`函数,在`clusterCron`中调用.

```java
void manualFailoverCheckTimeout(void) {
	// 现在时间超过预定的超时时间以后直接重置故障转移信息 也就是终止此次故障转移 因为mf_end为0
    if (server.cluster->mf_end && server.cluster->mf_end < mstime()) {
        redisLog(REDIS_WARNING,"Manual failover timed out.");
        resetManualFailover();
    }
}
```

### slave迁移

其实slave晋升就是为了增强整个集群的可用性,防止一个节点宕机使得集群整体下线这种事情发生.其实就是从其他主节点的从节点取出一个从节点给这个孤立的主节点当做从节点,设取从节点的主节点为节点A,该节点A满足以下要求去:

**1、** 节点A的主节点具有最多的附属从节点,从节点数大于2,且大于规定的`cluster_migration_barrier`,默认为1.；

**2、** 节点A在这些附属从节点中，节点ID(name)是最小的；

具体处理逻辑在`clusterCron`中,其中`clusterHandleSlaveMigration`为主要执行函数:

```java
if (nodeIsSlave(myself)) {
    clusterHandleManualFailover(); // 手动故障转移相关
    clusterHandleSlaveFailover(); // 故障转移开始
    /* If there are orphaned slaves, and we are a slave among the masters
     * with the max number of non-failing slaves, consider migrating to
     * the orphaned masters. Note that it does not make sense to try
     * a migration if there is no master with at least *two* working
     * slaves. */          //最大从节点大于2       这个节点的节点数为最大
    if (orphaned_masters && max_slaves >= 2 && this_slaves == max_slaves)
        clusterHandleSlaveMigration(max_slaves);
}
```

```java
void clusterHandleSlaveMigration(int max_slaves) {
    int j, okslaves = 0;
    clusterNode *mymaster = myself->slaveof, *target = NULL, *candidate = NULL;
    dictIterator *di;
    dictEntry *de;
    /* Step 1: Don't migrate if the cluster state is not ok. */
    // 集群状态OK不进行迁移
    if (server.cluster->state != REDIS_CLUSTER_OK) return;
    /* Step 2: Don't migrate if my master will not be left with at least
     *         'migration-barrier' slaves after my migration. */
    if (mymaster == NULL) return;
    for (j = 0; j < mymaster->numslaves; j++)
        if (!nodeFailed(mymaster->slaves[j]) &&
            !nodeTimedOut(mymaster->slaves[j])) okslaves++;
    // 如果可用的从服务器小于cluster_migration_barrier不可迁移 就是至少保证可以迁移的从节点数
    if (okslaves <= server.cluster_migration_barrier) return;
    /* Step 3: Idenitfy a candidate for migration, and check if among the
     * masters with the greatest number of ok slaves, I'm the one with the
     * smaller node ID.
     * 确定要进行迁移的候选者,看看是否是拥有最多从节点的主节点中从节点ID最小的那一个
     *
     * Note that this means that eventually a replica migration will occurr
     * since slaves that are reachable again always have their FAIL flag
     * cleared. At the same time this does not mean that there are no
     * race conditions possible (two slaves migrating at the same time), but
     * this is extremely unlikely to happen, and harmless. */
    candidate = myself;
    di = dictGetSafeIterator(server.cluster->nodes);
    while((de = dictNext(di)) != NULL) {
        clusterNode *node = dictGetVal(de);
        int okslaves;
        /* Only iterate over working masters. */
        if (nodeIsSlave(node) || nodeFailed(node)) continue;
        okslaves = clusterCountNonFailingSlaves(node); //检查该主节点可用的从节点数
        if (okslaves == 0 && target == NULL && node->numslots > 0)
            target = node; // 无从节点的主节点
        if (okslaves == max_slaves) {
      // 这个主节点可用于从节点迁移
            for (j = 0; j < node->numslaves; j++) {
                if (memcmp(node->slaves[j]->name,
                           candidate->name,
                           REDIS_CLUSTER_NAMELEN) < 0) //比较前40位名字的长度中最小的那个
                {
                    candidate = node->slaves[j];
                }
            }
        }
    }
    /* Step 4: perform the migration if there is a target, and if I'm the
     * candidate. */
    if (target && candidate == myself) {
        redisLog(REDIS_WARNING,"Migrating to orphaned master %.40s",
            target->name);
        clusterSetMaster(target); //将选出来的从节点设置为target的从节点
    }
}
```
