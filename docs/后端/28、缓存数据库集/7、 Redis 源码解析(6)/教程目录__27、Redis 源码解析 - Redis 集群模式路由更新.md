# 27、Redis 源码解析 - Redis 集群模式路由更新
- 来源：https://ddkk.com/zhuanlan/db/redis/6/27.html
- 分类：缓存数据库
- 分组：教程目录
当集群中有信息更新时，比如slave自动failover，slot迁移等，集群中其他节点通过gossip协议能够感知到这些信息，但是其他节点如何判断谁的gossip消息更可信呢，比如以下场景：

**1、** 某个分片中master挂了，slave通过failover成功当选master，假设一段时间之后，原本的master又被拉起了，这时候这个master会通过gossip消息宣称自己是master，并且这些slot由自己负责，集群中的其他节点会按照这个master中的gossip消息更新路由信息吗；

**2、** slot迁移之后，只有迁出节点和迁入节点知道自己负责的slot变更了，集群中其他节点都不知道，这些节点会通过gossip消息传播旧的路由信息；

Redis中是通过currentEpoch和configEpoch来解决这些信息更新问题，epoch的概念与raft协议中的epoch类似，表示逻辑时钟，每次集群状态更新之后，epoch都会+1，谁的epoch大，谁的gossip消息就可信。

```java
typedef struct clusterNode {
	...
	uint64_t configEpoch; /* Last configEpoch observed for this node */
	...
}
typedef struct clusterState {
	...
	uint64_t currentEpoch;
	...
}
```

currentEpoch表示当前集群的epoch，configEpoch表示当前节点看到的其他节点的epoch。

随机gossip消息的传播，集群中所有节点的currentEpoch会一致：

```java
int clusterProcessPacket(clusterLink*link) {
	...
	// 如果currentEpoch比对端节点小，则更新currentEpoch
	if (sender && !nodeInHandshake(sender)) {
        /* Update our curretEpoch if we see a newer epoch in the cluster. */
        senderCurrentEpoch = ntohu64(hdr->currentEpoch);
        senderConfigEpoch = ntohu64(hdr->configEpoch);
        if (senderCurrentEpoch > server.cluster->currentEpoch)
            server.cluster->currentEpoch = senderCurrentEpoch;
        /* Update the sender configEpoch if it is publishing a newer one. */
        if (senderConfigEpoch > sender->configEpoch) {
            sender->configEpoch = senderConfigEpoch;
            clusterDoBeforeSleep(CLUSTER_TODO_SAVE_CONFIG|
                                 CLUSTER_TODO_FSYNC_CONFIG);
        }
    }
    ...
}
```

在slave判断出来master已经宕机，可以发起选举进行failover，slave需要提升自己的currentEpoch，然后在选举消息上带上最新的currentEpoch：

```java
void clusterHandleSlaveFailover(void) {
	...
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
	...
}
```

当slave收到大多数的节点投票时，slave就可以当选master，然后提升自己的configEpoch:

```java
void clusterHandleSlaveFailover(void) {
	...
	/* Check if we reached the quorum. */
    if (server.cluster->failover_auth_count >= needed_quorum) {
        /* We have the quorum, we can finally failover the master. */
        serverLog(LL_WARNING,
            "Failover election won: I'm the new master.");
        /* Update my configEpoch to the epoch of the election. */
        if (myself->configEpoch < server.cluster->failover_auth_epoch) {
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
	...
}
```

这样即使宕机的master节点后来又加入集群，由于自己的configEpoch太小，其他节点不会根据它的gossip消息更新路由。

主从failover之后，其他节点收到主从的gossip消息，对应的处理：

```java
int clusterProcessPacket(clusterLink*link) {
	...
	    /* Check for role switch: slave -> master or master -> slave. */
        if (sender) {
            if (!memcmp(hdr->slaveof,CLUSTER_NODE_NULL_NAME,
                sizeof(hdr->slaveof)))
            {
                /* Node is a master. */
                clusterSetNodeAsMaster(sender);
            } else {
                /* Node is a slave. */
                clusterNode *master = clusterLookupNode(hdr->slaveof);
                if (nodeIsMaster(sender)) {
                    /* Master turned into a slave! Reconfigure the node. */
                    clusterDelNodeSlots(sender);
                    sender->flags &= ~(CLUSTER_NODE_MASTER|
                                       CLUSTER_NODE_MIGRATE_TO);
                    sender->flags |= CLUSTER_NODE_SLAVE;
                    /* Update config and state. */
                    clusterDoBeforeSleep(CLUSTER_TODO_SAVE_CONFIG|
                                         CLUSTER_TODO_UPDATE_STATE);
                }
                /* Master node changed for this slave? */
                if (master && sender->slaveof != master) {
                    if (sender->slaveof)
                        clusterNodeRemoveSlave(sender->slaveof,sender);
                    clusterNodeAddSlave(master,sender);
                    sender->slaveof = master;
                    /* Update config. */
                    clusterDoBeforeSleep(CLUSTER_TODO_SAVE_CONFIG);
                }
            }
        }
	...
}
```

slot迁移之后，会在迁移最后一步提升自己的configEpoch:

```java
void clusterCommand(client *c) {
	...
			/* If this node was importing this slot, assigning the slot to
             * itself also clears the importing status. */
            if (n == myself &&
                server.cluster->importing_slots_from[slot])
            {
                /* This slot was manually migrated, set this node configEpoch
                 * to a new epoch so that the new version can be propagated
                 * by the cluster.
                 *
                 * Note that if this ever results in a collision with another
                 * node getting the same configEpoch, for example because a
                 * failover happens at the same time we close the slot, the
                 * configEpoch collision resolution will fix it assigning
                 * a different epoch to each node. */
                if (clusterBumpConfigEpochWithoutConsensus() == C_OK) {
                    serverLog(LL_WARNING,
                        "configEpoch updated after importing slot %d", slot);
                }
                server.cluster->importing_slots_from[slot] = NULL;
            }
	...
}
int clusterBumpConfigEpochWithoutConsensus(void) {
    uint64_t maxEpoch = clusterGetMaxEpoch();
    if (myself->configEpoch == 0 ||
        myself->configEpoch != maxEpoch)
    {
        server.cluster->currentEpoch++;
        myself->configEpoch = server.cluster->currentEpoch;
        clusterDoBeforeSleep(CLUSTER_TODO_SAVE_CONFIG|
                             CLUSTER_TODO_FSYNC_CONFIG);
        serverLog(LL_WARNING,
            "New configEpoch set to %llu",
            (unsigned long long) myself->configEpoch);
        return C_OK;
    } else {
        return C_ERR;
    }
}
```

这样下次该节点gossip消息传播时，该节点的configEpoch就是最大的，标明节点的信息时最新的，就可以更新路由：

```java
int clusterProcessPacket(clusterLink*link) {
	...
		/* Many checks are only needed if the set of served slots this
         * instance claims is different compared to the set of slots we have
         * for it. Check this ASAP to avoid other computational expansive
         * checks later. */
        clusterNode *sender_master = NULL; /* Sender or its master if slave. */
        int dirty_slots = 0; /* Sender claimed slots don't match my view? */
        if (sender) {
            sender_master = nodeIsMaster(sender) ? sender : sender->slaveof;
            if (sender_master) {
                dirty_slots = memcmp(sender_master->slots,
                        hdr->myslots,sizeof(hdr->myslots)) != 0;
            }
        }
        /* 1) If the sender of the message is a master, and we detected that
         *    the set of slots it claims changed, scan the slots to see if we
         *    need to update our configuration. */
        // 如果所属slot发生变更，则尝试更新slot
        if (sender && nodeIsMaster(sender) && dirty_slots)
            clusterUpdateSlotsConfigWith(sender,senderConfigEpoch,hdr->myslots);
	...
}
void clusterUpdateSlotsConfigWith(clusterNode *sender, uint64_t senderConfigEpoch, unsigned char *slots) {
	...
	    for (j = 0; j < CLUSTER_SLOTS; j++) {
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
            // configEpoch大，才能更新
            if (server.cluster->slots[j] == NULL ||
                server.cluster->slots[j]->configEpoch < senderConfigEpoch)
            {
                /* Was this slot mine, and still contains keys? Mark it as
                 * a dirty slot. */
                if (server.cluster->slots[j] == myself &&
                    countKeysInSlot(j) &&
                    sender != myself)
                {
                    dirty_slots[dirty_slots_count] = j;
                    dirty_slots_count++;
                }
                if (server.cluster->slots[j] == curmaster)
                    newmaster = sender;
                clusterDelSlot(j);
                clusterAddSlot(sender,j);
                clusterDoBeforeSleep(CLUSTER_TODO_SAVE_CONFIG|
                                     CLUSTER_TODO_UPDATE_STATE|
                                     CLUSTER_TODO_FSYNC_CONFIG);
            }
        }
    }
	...
}
```

如果有节点发送了滞后的消息，比如宕机后的master重新接入集群，configEpoch就小，则节点会主动发送update消息，让对端节点更新自己的信息：

```java
int clusterProcessPacket(clusterLink*link) {
	...
	        if (sender && dirty_slots) {
            int j;
            for (j = 0; j < CLUSTER_SLOTS; j++) {
                if (bitmapTestBit(hdr->myslots,j)) {
                    if (server.cluster->slots[j] == sender ||
                        server.cluster->slots[j] == NULL) continue;
                     // 对端节点的信息滞后
                    if (server.cluster->slots[j]->configEpoch >
                        senderConfigEpoch)
                    {
                        serverLog(LL_VERBOSE,
                            "Node %.40s has old slots configuration, sending "
                            "an UPDATE message about %.40s",
                                sender->name, server.cluster->slots[j]->name);
                        // 主动发送update消息
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
	...
}
```
