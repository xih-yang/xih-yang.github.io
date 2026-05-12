# 26、Redis 源码解析 - Redis 集群模式failover
- 来源：https://ddkk.com/zhuanlan/db/redis/6/26.html
- 分类：缓存数据库
- 分组：教程目录
Redis集群模式不仅提供可扩展性，还提供了高可用性，如果某个分片的master挂了，会自动从这个分片的slave中选取一个slave，接替master继续提供服务，这个选举过程与raft算法里的failover过程很相似。

Redis的failover分为两种，自动failover和手动failover

### 自动failover

在周期性函数ClusterCron中，如果发现给某个节点发送PING消息之后，该节点超过server.cluster_node_timeout的时间还没有回复PONG消息，就会给该节点打上CLUSTER_NODE_PFAIL标志，最后在clusterHandleSlaveFailover中尝试进行slave的failover:

**1、** 首先slave判断master是否已经断联一段时间了；

**2、** 如果本次slave的failover超时，则设置下一次failover的时间，这个时间的设置也很有讲究：首先是固定的500ms+随机的500ms，用随机的500ms是为了避免这个分片的slave同时发送failover的投票请求，最后再加上每个slave的rank，salve的offset越大，也就是说这个slave与master同步的越多，这个slave的rank越大，也就能尽快发出failover投票请求，也就更容易成功当选为新的master；

**3、** 等待发送failover的投票请求；

**4、** 提升自己的currentepoch，并发送投票请求；

**5、** 如果集群中超过半数的master同意选举，则提升自己的configepoch，并设置自己为这个分片的master，继续提供服务；

```java
void clusterHandleSlaveFailover(void) {
	...
	/* Check if our data is recent enough according to the slave validity
     * factor configured by the user.
     *
     * Check bypassed for manual failovers. */
    // 检查master是否已经失联的时间超过阈值
    if (server.cluster_slave_validity_factor &&
        data_age >
        (((mstime_t)server.repl_ping_slave_period * 1000) +
         (server.cluster_node_timeout * server.cluster_slave_validity_factor)))
    {
        if (!manual_failover) {
            clusterLogCantFailover(CLUSTER_CANT_FAILOVER_DATA_AGE);
            return;
        }
    }
	...
	// 设置下一次failover的时间
	 /* If the previous failover attempt timedout and the retry time has
     * elapsed, we can setup a new one. */
    if (auth_age > auth_retry_time) {
        server.cluster->failover_auth_time = mstime() +
            500 + /* Fixed delay of 500 milliseconds, let FAIL msg propagate. */
            random() % 500; /* Random delay between 0 and 500 milliseconds. */
        server.cluster->failover_auth_count = 0;
        server.cluster->failover_auth_sent = 0;
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
	    clusterDoBeforeSleep(CLUSTER_TODO_HANDLE_FAILOVER);
        }
        serverLog(LL_WARNING,
            "Start of election delayed for %lld milliseconds "
            "(rank%d, offset %lld).",
            server.cluster->failover_auth_time - mstime(),
            server.cluster->failover_auth_rank,
            replicationGetSlaveOffset());
        /* Now that we have a scheduled election, broadcast our offset
         * to all the other slaves so that they'll updated their offsets
         * if our offset is better. */
        clusterBroadcastPong(CLUSTER_BROADCAST_LOCAL_SLAVES);
        return;
    }
    ...
    /* Return ASAP if we can't still start the election. */
    // 等待failover请求的发送时间
    if (mstime() < server.cluster->failover_auth_time) {
        clusterLogCantFailover(CLUSTER_CANT_FAILOVER_WAITING_DELAY);
        return;
    }
    /* Return ASAP if the election is too old to be valid. */
    // 如果本次failover超时，则返回，等待下一次机会
    if (auth_age > auth_timeout) {
        clusterLogCantFailover(CLUSTER_CANT_FAILOVER_EXPIRED);
        return;
    }
    ...
    // 提升自己的currentepoch，并发送投票请求
    /* Ask for votes if needed. */
    if (server.cluster->failover_auth_sent == 0) {
        server.cluster->currentEpoch++;
        server.cluster->failover_auth_epoch = server.cluster->currentEpoch;
        serverLog(LL_WARNING,"Starting a failover election for epoch %llu.",
            (unsigned long long) server.cluster->currentEpoch);
        clusterRequestFailoverAuth();
        server.cluster->failover_auth_sent = 1;
        clusterDoBeforeSleep(CLUSTER_TODO_SAVE_CONFIG|
                             CLUSTER_TODO_UPDATE_STATE|
                             CLUSTER_TODO_FSYNC_CONFIG);
        return; /* Wait for replies. */
    }
    // 如果集群中超过半数的master同意选举，则提升自己的configepoch，并设置自己为这个分片的master，继续提供服务
    /* Check if we reached the quorum. */
    if (server.cluster->failover_auth_count >= needed_quorum) {
        /* We have the quorum, we can finally failover the master. */
        serverLog(LL_WARNING,
            "Failover election won: I'm the new master.");
        /* Update my configEpoch to the epoch of the election. */
        if (myself->configEpoch < server.cluster->failover_auth_epoch) {
        	// 提升自己的configepoch
            myself->configEpoch = server.cluster->failover_auth_epoch;
            serverLog(LL_WARNING,
                "configEpoch set to %llu after successful failover",
                (unsigned long long) myself->configEpoch);
        }
        /* Take responsibility for the cluster slots. */
        clusterFailoverReplaceYourMaster();
    } else {
        clusterLogCantFailover(CLUSTER_CANT_FAILOVER_WAITING_VOTES);
    }
}
```

通过clusterRequestFailoverAuth发起选举：

```java
void clusterRequestFailoverAuth(void) {
    unsigned char buf[sizeof(clusterMsg)];
    clusterMsg *hdr = (clusterMsg*) buf;
    uint32_t totlen;
	// 构造选举消息，注意此时的curccurentepech已经++
    clusterBuildMessageHdr(hdr,CLUSTERMSG_TYPE_FAILOVER_AUTH_REQUEST);
    /* If this is a manual failover, set the CLUSTERMSG_FLAG0_FORCEACK bit
     * in the header to communicate the nodes receiving the message that
     * they should authorized the failover even if the master is working. */
    if (server.cluster->mf_end) hdr->mflags[0] |= CLUSTERMSG_FLAG0_FORCEACK;
    totlen = sizeof(clusterMsg)-sizeof(union clusterMsgData);
    hdr->totlen = htonl(totlen);
    // 向集群中所有节点广播消息
    clusterBroadcastMessage(buf,totlen);
}
```

集群其他节点中收到这个slave的选取请求时，通过clusterSendFailoverAuthIfNeeded函数来判断是否给这个slave投票：

**1、** 节点必须为master，且必须负责一定数量的slot；

**2、** 投票消息中的currentEpoch要大于该节点的currentEpoch；

**3、** 当前节点还没有投过票；

**4、** 对端节点必须是slave，并且对端节点的master在本节点看来是FAIL状态；

**5、** 该节点看来，对应的master达到了需要failover的时间；

**6、** 该节点的configepoch要小于等于对端节点的configepoch；

```java
void clusterSendFailoverAuthIfNeeded(clusterNode *node, clusterMsg *request) {
	...
	// 节点必须为master，且必须负责一定数量的slot
	if (nodeIsSlave(myself) || myself->numslots == 0) return;
	// 投票消息中的currentEpoch要大于该节点的currentEpoch
	if (requestCurrentEpoch < server.cluster->currentEpoch) {
        serverLog(LL_WARNING,
            "Failover auth denied to %.40s: reqEpoch (%llu) < curEpoch(%llu)",
            node->name,
            (unsigned long long) requestCurrentEpoch,
            (unsigned long long) server.cluster->currentEpoch);
        return;
    }
    /* I already voted for this epoch? Return ASAP. */
    // 当前节点还没有投过票
    if (server.cluster->lastVoteEpoch == server.cluster->currentEpoch) {
        serverLog(LL_WARNING,
                "Failover auth denied to %.40s: already voted for epoch %llu",
                node->name,
                (unsigned long long) server.cluster->currentEpoch);
        return;
    }
    // 对端节点必须是slave，并且对端节点的master在本节点看来是FAIL状态
     /* Node must be a slave and its master down.
     * The master can be non failing if the request is flagged
     * with CLUSTERMSG_FLAG0_FORCEACK (manual failover). */
    if (nodeIsMaster(node) || master == NULL ||
        (!nodeFailed(master) && !force_ack))
    {
        if (nodeIsMaster(node)) {
            serverLog(LL_WARNING,
                    "Failover auth denied to %.40s: it is a master node",
                    node->name);
        } else if (master == NULL) {
            serverLog(LL_WARNING,
                    "Failover auth denied to %.40s: I don't know its master",
                    node->name);
        } else if (!nodeFailed(master)) {
            serverLog(LL_WARNING,
                    "Failover auth denied to %.40s: its master is up",
                    node->name);
        }
        return;
    }
    // 该节点看来，对应的master达到了需要failover的时间
    /* We did not voted for a slave about this master for two
     * times the node timeout. This is not strictly needed for correctness
     * of the algorithm but makes the base case more linear. */
    if (mstime() - node->slaveof->voted_time < server.cluster_node_timeout * 2)
    {
        serverLog(LL_WARNING,
                "Failover auth denied to %.40s: "
                "can't vote about this master before %lld milliseconds",
                node->name,
                (long long) ((server.cluster_node_timeout*2)-
                             (mstime() - node->slaveof->voted_time)));
        return;
    }
    // 该节点的configepoch要小于等于对端节点的configepoch
    /* The slave requesting the vote must have a configEpoch for the claimed
     * slots that is >= the one of the masters currently serving the same
     * slots in the current configuration. */
    for (j = 0; j < CLUSTER_SLOTS; j++) {
        if (bitmapTestBit(claimed_slots, j) == 0) continue;
        if (server.cluster->slots[j] == NULL ||
            server.cluster->slots[j]->configEpoch <= requestConfigEpoch)
        {
            continue;
        }
        /* If we reached this point we found a slot that in our current slots
         * is served by a master with a greater configEpoch than the one claimed
         * by the slave requesting our vote. Refuse to vote for this slave. */
        serverLog(LL_WARNING,
                "Failover auth denied to %.40s: "
                "slot %d epoch (%llu) > reqEpoch (%llu)",
                node->name, j,
                (unsigned long long) server.cluster->slots[j]->configEpoch,
                (unsigned long long) requestConfigEpoch);
        return;
    }
    // 最后为该节点投票
    /* We can vote for this slave. */
    server.cluster->lastVoteEpoch = server.cluster->currentEpoch;
    node->slaveof->voted_time = mstime();
    clusterDoBeforeSleep(CLUSTER_TODO_SAVE_CONFIG|CLUSTER_TODO_FSYNC_CONFIG);
    clusterSendFailoverAuth(node);
    serverLog(LL_WARNING, "Failover auth granted to %.40s for epoch %llu",
        node->name, (unsigned long long) server.cluster->currentEpoch);
    ...
}
```

最后如果slave选举成功，通过clusterFailoverReplaceYourMaster函数来向集群中其他节点标明，自己已经成功当选master了，并且将会负责之前master的slot，继续提供服务：

```java
void clusterFailoverReplaceYourMaster(void) {
    int j;
    clusterNode *oldmaster = myself->slaveof;
    if (nodeIsMaster(myself) || oldmaster == NULL) return;
    /* 1) Turn this node into a master. */
    clusterSetNodeAsMaster(myself);
    replicationUnsetMaster();
    /* 2) Claim all the slots assigned to our master. */
    for (j = 0; j < CLUSTER_SLOTS; j++) {
        if (clusterNodeGetSlotBit(oldmaster,j)) {
            clusterDelSlot(j);
            clusterAddSlot(myself,j);
        }
    }
    /* 3) Update state and save config. */
    clusterUpdateState();
    clusterSaveConfigOrDie(1);
    /* 4) Pong all the other nodes so that they can update the state
     *    accordingly and detect that we switched to master role. */
    // 广播一条消息，标明自己当选master
    clusterBroadcastPong(CLUSTER_BROADCAST_ALL);
    /* 5) If there was a manual failover in progress, clear the state. */
    resetManualFailover();
}
```

### 手动failover

手动failover指的是主动发送命令强制某个分片的slave替换为master，命令为: Cluster FAILOVER [force|takeover]，其中takeover会立即执行failover，slave替换master提供服务，force表示slave可以立即发起选取，等集群中大多数master同意之后，就可以替换master提供服务，如果没有这两个选项，那么slave要等待offset追上master，然后再发起选举：

```java
void clusterCommand(client *c) {
	if (!strcasecmp(c->argv[1]->ptr,"failover") &&
               (c->argc == 2 || c->argc == 3))
    {
    	if (takeover) {
            /* A takeover does not perform any initial check. It just
             * generates a new configuration epoch for this node without
             * consensus, claims the master's slots, and broadcast the new
             * configuration. */
            serverLog(LL_WARNING,"Taking over the master (user request).");
            // 提升configepech
            clusterBumpConfigEpochWithoutConsensus();
            // 强制提升自己为master
            clusterFailoverReplaceYourMaster();
        } else if (force) {
            /* If this is a forced failover, we don't need to talk with our
             * master to agree about the offset. We just failover taking over
             * it without coordination. */
            serverLog(LL_WARNING,"Forced failover user request accepted.");
            // 设置manualFailover开始
            server.cluster->mf_can_start = 1;
        } else {
            serverLog(LL_WARNING,"Manual failover user request accepted.");
            clusterSendMFStart(myself->slaveof);
        }
        addReply(c,shared.ok);
    }
}
```

节点收到命令之后，在周期性函数ClusterCron中执行manualfailover:

```java
void clusterCron(void) {
	...
	// 检查manualfailover是否超时
	manualFailoverCheckTimeout();
	if (nodeIsSlave(myself)) {
        clusterHandleManualFailover();
        if (!(server.cluster_module_flags & CLUSTER_MODULE_FLAG_NO_FAILOVER))
            clusterHandleSlaveFailover();
        /* If there are orphaned slaves, and we are a slave among the masters
         * with the max number of non-failing slaves, consider migrating to
         * the orphaned masters. Note that it does not make sense to try
         * a migration if there is no master with at least *two* working
         * slaves. */
        if (orphaned_masters && max_slaves >= 2 && this_slaves == max_slaves)
            clusterHandleSlaveMigration(max_slaves);
    }
    ...
}
```

在clusterHandleManualFailover中，如果发现slave的offset已经追上master了，就可以进行failover：

```java
void clusterHandleManualFailover(void) {
    /* Return ASAP if no manual failover is in progress. */
    // 没有manualfailover需求
    if (server.cluster->mf_end == 0) return;
    /* If mf_can_start is non-zero, the failover was already triggered so the
     * next steps are performed by clusterHandleSlaveFailover(). */
    // 已经进行manualfailover了
    if (server.cluster->mf_can_start) return;
    if (server.cluster->mf_master_offset == 0) return; /* Wait for offset... */
	// offset追上master之后，设置server.cluster->mf_can_start为1，进行manualfailover
    if (server.cluster->mf_master_offset == replicationGetSlaveOffset()) {
        /* Our replication offset matches the master replication offset
         * announced after clients were paused. We can start the failover. */
        server.cluster->mf_can_start = 1;
        serverLog(LL_WARNING,
            "All master replication stream processed, "
            "manual failover can start.");
    }
}
```

具体的failover流程同样在clusterHandleSlaveFailover中实现，如果此时可以进行manualfailover，则进行failover：

```java
void clusterHandleSlaveFailover(void) {
	...
	if (nodeIsMaster(myself) ||
        myself->slaveof == NULL ||
        (!nodeFailed(myself->slaveof) && !manual_failover) ||
        (server.cluster_slave_no_failover && !manual_failover) ||
        myself->slaveof->numslots == 0)
    {
        /* There are no reasons to failover, so we set the reason why we
         * are returning without failing over to NONE. */
        server.cluster->cant_failover_reason = CLUSTER_CANT_FAILOVER_NONE;
        return;
    }
    ...
}
```
