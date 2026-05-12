# 25、Redis 源码解析 - Redis 集群模式添加/删除节点
- 来源：https://ddkk.com/zhuanlan/db/redis/6/25.html
- 分类：缓存数据库
- 分组：教程目录
当集群模式中需要扩缩容时，需要向集群中添加/删除节点，本节就来介绍下这个过程。

### 添加节点

当把节点A加入集群时，需要运维工具redis-cli向集群中任意节点发送Cluster meet   命令：

```java
void clusterCommand(client *c) {
	...
	if (!strcasecmp(c->argv[1]->ptr,"meet") && (c->argc == 4 || c->argc == 5)) {
        /* CLUSTER MEET <ip> <port> [cport] */
        long long port, cport;
        if (getLongLongFromObject(c->argv[3], &port) != C_OK) {
            addReplyErrorFormat(c,"Invalid TCP base port specified: %s",
                                (char*)c->argv[3]->ptr);
            return;
        }
        if (c->argc == 5) {
            if (getLongLongFromObject(c->argv[4], &cport) != C_OK) {
                addReplyErrorFormat(c,"Invalid TCP bus port specified: %s",
                                    (char*)c->argv[4]->ptr);
                return;
            }
        } else {
            cport = port + CLUSTER_PORT_INCR;
        }
		// 创建一个CLUSTER_NODE_HANDSHAKE标志的节点，并加入集群
        if (clusterStartHandshake(c->argv[2]->ptr,port,cport) == 0 &&
            errno == EINVAL)
        {
            addReplyErrorFormat(c,"Invalid node address specified: %s:%s",
                            (char*)c->argv[2]->ptr, (char*)c->argv[3]->ptr);
        } else {
            addReply(c,shared.ok);
        }
    }
    ...
}
```

然后在ClusterCron中对这个新加入的节点发送PING消息：

```java
void clusterCron(void) {
	...
	di = dictGetSafeIterator(server.cluster->nodes);
    server.cluster->stats_pfail_nodes = 0;
    while((de = dictNext(di)) != NULL) {
        clusterNode *node = dictGetVal(de);
        /* Not interested in reconnecting the link with myself or nodes
         * for which we have no address. */
        if (node->flags & (CLUSTER_NODE_MYSELF|CLUSTER_NODE_NOADDR)) continue;
        if (node->flags & CLUSTER_NODE_PFAIL)
            server.cluster->stats_pfail_nodes++;
        /* A Node in HANDSHAKE state has a limited lifespan equal to the
         * configured node timeout. */
        if (nodeInHandshake(node) && now - node->ctime > handshake_timeout) {
            clusterDelNode(node);
            continue;
        }
        // 由meet命令或者其他节点的gossip协议带来的新节点
        if (node->link == NULL) {
            int fd;
            mstime_t old_ping_sent;
            clusterLink*link;
            fd = anetTcpNonBlockBindConnect(server.neterr, node->ip,
                node->cport, NET_FIRST_BIND_ADDR);
            if (fd == -1) {
                /* We got a synchronous error from connect before
                 * clusterSendPing() had a chance to be called.
                 * If node->ping_sent is zero, failure detection can't work,
                 * so we claim we actually sent a ping now (that will
                 * be really sent as soon as the link is obtained). */
                if (node->ping_sent == 0) node->ping_sent = mstime();
                serverLog(LL_DEBUG, "Unable to connect to "
                    "Cluster Node [%s]:%d -> %s", node->ip,
                    node->cport, server.neterr);
                continue;
            }
            link = createClusterLink(node);
            link->fd = fd;
            node->link = link;
            aeCreateFileEvent(server.el,link->fd,AE_READABLE,
                    clusterReadHandler,link);
            /* Queue a PING in the new connection ASAP: this is crucial
             * to avoid false positives in failure detection.
             *
             * If the node is flagged as MEET, we send a MEET message instead
             * of a PING one, to force the receiver to add us in its node
             * table. */
            old_ping_sent = node->ping_sent;
            // 向meet的节点发送CLUSTER_NODE_MEET消息
            clusterSendPing(link, node->flags & CLUSTER_NODE_MEET ?
                    CLUSTERMSG_TYPE_MEET : CLUSTERMSG_TYPE_PING);
            if (old_ping_sent) {
                /* If there was an active ping before the link was
                 * disconnected, we want to restore the ping time, otherwise
                 * replaced by the clusterSendPing() call. */
                node->ping_sent = old_ping_sent;
            }
            /* We can clear the flag after the first packet is sent.
             * If we'll never receive a PONG, we'll never send new packets
             * to this node. Instead after the PONG is received and we
             * are no longer in meet/handshake status, we want to send
             * normal PING packets. */
            node->flags &= ~CLUSTER_NODE_MEET;
            serverLog(LL_DEBUG,"Connecting with Node %.40s at %s:%d",
                    node->name, node->ip, node->cport);
        }
    }
    dictReleaseIterator(di);
    ...
}
```

要加入的节点收到PING消息之后，调用clusterProcessPacket函数，并回复PONG消息：

```java
int clusterProcessPacket(clusterLink*link) {
	...
	 /* Initial processing of PING and MEET requests replying with a PONG. */
    if (type == CLUSTERMSG_TYPE_PING || type == CLUSTERMSG_TYPE_MEET) {
     	// 要加入的节点会受到集群中其他节点发送过来的CLUSTERMSG_TYPE_MEET的消息
        if (!sender && type == CLUSTERMSG_TYPE_MEET) {
            clusterNode *node;
            // 将集群中的节点加入自身的集群中
            node = createClusterNode(NULL,CLUSTER_NODE_HANDSHAKE);
            nodeIp2String(node->ip,link,hdr->myip);
            node->port = ntohs(hdr->port);
            node->cport = ntohs(hdr->cport);
            clusterAddNode(node);
            clusterDoBeforeSleep(CLUSTER_TODO_SAVE_CONFIG);
        }
        /* If this is a MEET packet from an unknown node, we still process
         * the gossip section here since we have to trust the sender because
         * of the message type. */
        // 将gossip消息中携带过来的所有节点都加入集群中
        if (!sender && type == CLUSTERMSG_TYPE_MEET)
            clusterProcessGossipSection(hdr,link);
        /* Anyway reply with a PONG */
        clusterSendPing(link,CLUSTERMSG_TYPE_PONG);
    }
}
```

经过clusterProcessPacket函数之后，要加入集群的节点中已经有了一系列节点了，这个节点同样会在ClusterCron中向这些节点发送PING消息，以此让集群中更多的节点感知到自己的存在。

接着会向对端节点发送PONG消息，节点同样通过clusterProcessPacket处理PONG消息，会把要加入节点的CLUSTER_NODE_HANDSHAKE标志清除掉：

```java
int clusterProcessPacket(clusterLink*link) {
	/* PING, PONG, MEET: process config information. */
    if (type == CLUSTERMSG_TYPE_PING || type == CLUSTERMSG_TYPE_PONG ||
        type == CLUSTERMSG_TYPE_MEET)
    {
        serverLog(LL_DEBUG,"%s packet received: %p",
            type == CLUSTERMSG_TYPE_PING ? "ping" : "pong",
            (void*)link->node);
        if (link->node) {
            if (nodeInHandshake(link->node)) {
                /* If we already have this node, try to change the
                 * IP/port of the node with the new one. */
                if (sender) {
                    serverLog(LL_VERBOSE,
                        "Handshake: we already know node %.40s, "
                        "updating the address if needed.", sender->name);
                    if (nodeUpdateAddressIfNeeded(sender,link,hdr))
                    {
                        clusterDoBeforeSleep(CLUSTER_TODO_SAVE_CONFIG|
                                             CLUSTER_TODO_UPDATE_STATE);
                    }
                    /* Free this node as we already have it. This will
                     * cause the link to be freed as well. */
                    clusterDelNode(link->node);
                    return 0;
                }
                /* First thing to do is replacing the random name with the
                 * right node name if this was a handshake stage. */
                // 更新节点配置并去掉握手标志信息
                clusterRenameNode(link->node, hdr->sender);
                serverLog(LL_DEBUG,"Handshake with node %.40s completed.",
                    link->node->name);
                link->node->flags &= ~CLUSTER_NODE_HANDSHAKE;
                link->node->flags |= flags&(CLUSTER_NODE_MASTER|CLUSTER_NODE_SLAVE);
                clusterDoBeforeSleep(CLUSTER_TODO_SAVE_CONFIG);
            }
      }
      ...
}
```

去掉CLUSTER_NODE_HANDSHAKE标志之后，就在ClusterCron函数中会给新加入的节点发送PING消息，节点收到PING消息之后，同样也会把对端节点的CLUSTER_NODE_HANDSHAKE清除掉，至此握手过程结束。

然后随着gossip协议中消息的传播，集群中越来越多节点感知到这个新加入的节点存在，逐步与这个新加入的节点建立网络通信。

### 删除节点

通过Cluster forget nodeid来从集群中删除一个节点：

```java
void clusterCommand(client *c) {
	...
	if (!strcasecmp(c->argv[1]->ptr,"forget") && c->argc == 3) {
        /* CLUSTER FORGET <NODE ID> */
        clusterNode *n = clusterLookupNode(c->argv[2]->ptr);
        if (!n) {
            addReplyErrorFormat(c,"Unknown node %s", (char*)c->argv[2]->ptr);
            return;
        } else if (n == myself) {
            addReplyError(c,"I tried hard but I can't forget myself...");
            return;
        } else if (nodeIsSlave(myself) && myself->slaveof == n) {
            addReplyError(c,"Can't forget my master!");
            return;
        }
        clusterBlacklistAddNode(n);
        clusterDelNode(n);
        clusterDoBeforeSleep(CLUSTER_TODO_UPDATE_STATE|
                             CLUSTER_TODO_SAVE_CONFIG);
        addReply(c,shared.ok);
    } 
	...
}
```

直接从集群状态中删除这个节点
