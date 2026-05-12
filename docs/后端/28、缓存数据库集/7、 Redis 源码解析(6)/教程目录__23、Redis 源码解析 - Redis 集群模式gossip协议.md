# 23、Redis 源码解析 - Redis 集群模式gossip协议
- 来源：https://ddkk.com/zhuanlan/db/redis/6/23.html
- 分类：缓存数据库
- 分组：教程目录
Redis的集群模式是去中心化架构，采用gossip协议实现集群中节点间信息同步。

gossip过程是由种子节点发起，当一个种子节点有状态需要更新到网络中的其他节点时，它会随机的选择周围几个节点散播消息，收到消息的节点也会重复该过程，直至最终网络中所有的节点都收到了消息。这个过程可能需要一定的时间，由于不能保证某个时刻所有的节点都收到消息，但是能够保证最终所有节点都会收到消息，因此它是一个最终一致性协议。

本节介绍下Redis中如何通过gossip协议达到节点间信息的最终一致性

### 消息

Redis集群中通过消息来传递各个节点间的信息，消息由消息头+消息体组成：

```java
typedef struct {
    char sig[4];        /* Signature "RCmb" (Redis Cluster message bus). */
    uint32_t totlen;    /* Total length of this message */
    uint16_t ver;       /* Protocol version, currently set to 1. */
    uint16_t port;      /* TCP base port number. */
    uint16_t type;      /* Message type */
    uint16_t count;     /* Only used for some kind of messages. */
    uint64_t currentEpoch;  /* The epoch accordingly to the sending node. */
    uint64_t configEpoch;   /* The config epoch if it's a master, or the last
                               epoch advertised by its master if it is a
                               slave. */
    uint64_t offset;    /* Master replication offset if node is a master or
                           processed replication offset if node is a slave. */
    char sender[CLUSTER_NAMELEN]; /* Name of the sender node */
    unsigned char myslots[CLUSTER_SLOTS/8];
    char slaveof[CLUSTER_NAMELEN];
    char myip[NET_IP_STR_LEN];    /* Sender IP, if not all zeroed. */
    char notused1[34];  /* 34 bytes reserved for future usage. */
    uint16_t cport;      /* Sender TCP cluster bus port */
    uint16_t flags;      /* Sender node flags */
    unsigned char state; /* Cluster state from the POV of the sender */
    unsigned char mflags[3]; /* Message flags: CLUSTERMSG_FLAG[012]_... */
    union clusterMsgData data;
} clusterMsg;
```

消息头部分包含了port、epoch、分配的slot、master等信息，消息体为clusterMsgData，根据不同的消息类型，有不同的结构：

```java
union clusterMsgData {
    /* PING, MEET and PONG */
    struct {
        /* Array of N clusterMsgDataGossip structures */
        clusterMsgDataGossip gossip[1];
    } ping;
    /* FAIL */
    struct {
        clusterMsgDataFail about;
    } fail;
    /* PUBLISH */
    struct {
        clusterMsgDataPublish msg;
    } publish;
    /* UPDATE */
    struct {
        clusterMsgDataUpdate nodecfg;
    } update;
    /* MODULE */
    struct {
        clusterMsgModule msg;
    } module;
};
```

gossip协议使用PING、PONG类型的消息：

```java
typedef struct {
    char nodename[CLUSTER_NAMELEN];
    uint32_t ping_sent;
    uint32_t pong_received;
    char ip[NET_IP_STR_LEN];  /* IP address last time it was seen */
    uint16_t port;              /* base port last time it was seen */
    uint16_t cport;             /* cluster port last time it was seen */
    uint16_t flags;             /* node->flags copy */
    uint32_t notused1;
} clusterMsgDataGossip;
```

包含了以自身视角看，对应节点的发送PING消息时间、接受PONG消息时间、port已经对应的状态

### gossip过程

集群中每个节点在一定时间内向其他节点发送PING消息，收到PING消息的节点回复PONG消息，每个节点通过PING/PONG消息感知其他节点状态，进行状态更新，最终使得集群中每个节点状态达到一致。

何时发送PIONG消息，PING消息都包含哪些节点信息呢，这部分在ClusterCron这个集群模式下的周期性函数实现：

**1、** 随机选择5个节点，如果该节点还没有发送PING消息，选择最迟收到PONG消息的节点，向该节点发送PING消息；

```java
/* This is executed 10 times every second */
void clusterCron(void) {
	...
    if (!(iteration % 10)) {
        int j;
        /* Check a few random nodes and ping the one with the oldest
         * pong_received time. */
        // 随机选择5个节点
        for (j = 0; j < 5; j++) {
            de = dictGetRandomKey(server.cluster->nodes);
            clusterNode *this = dictGetVal(de);
            /* Don't ping nodes disconnected or with a ping currently active. */
            // 该节点还没有发送PING消息
            if (this->link == NULL || this->ping_sent != 0) continue;
            // 排除自己和CLUSTER_NODE_HANDSHAKE的节点
            if (this->flags & (CLUSTER_NODE_MYSELF|CLUSTER_NODE_HANDSHAKE))
                continue;
            // 选择最迟收到PONG消息的节点
            if (min_pong_node == NULL || min_pong > this->pong_received) {
                min_pong_node = this;
                min_pong = this->pong_received;
            }
        }
        // 发送PING消息
        if (min_pong_node) {
            serverLog(LL_DEBUG,"Pinging node %.40s", min_pong_node->name);
            clusterSendPing(min_pong_node->link, CLUSTERMSG_TYPE_PING);
        }
    }
    ...
}
```

**2、** 遍历所有节点，如果有节点长时间内没有发送过PING消息，则发送：；

```java
/* This is executed 10 times every second */
void clusterCron(void) {
	...
    di = dictGetSafeIterator(server.cluster->nodes);
    while((de = dictNext(di)) != NULL) {
          /* If we have currently no active ping in this instance, and the
         * received PONG is older than half the cluster timeout, send
         * a new ping now, to ensure all the nodes are pinged without
         * a too big delay. */
        if (node->link &&
            node->ping_sent == 0 &&
            (now - node->pong_received) > server.cluster_node_timeout/2)
        {
            clusterSendPing(node->link, CLUSTERMSG_TYPE_PING);
            continue;
        }
    }
    ...
}
```

这里面设置的时间阈值为server.cluster_node_timeout/2，在集群模式下，如果节点A向节点B发送PING消息后，超过server.cluster_node_timeout时间内，节点A没有收到节点B的PONG消息，那么节点A就会把节点B设置为PFAIL状态，所以这里判断发送PING消息的时间为server.cluster_node_timeout/2，还要考虑一个回复PONG消息的网络来回时间。

当节点A决定向节点B发送PING消息时，节点A需要构造gossip消息体，会选择集群中的一部分节点，将这部分节点的信息一并发送给节点B，节点B根据这些信息，看情况更新自身的集群信息。

那么节点A需要选取多少个节点，以及选取哪些节点呢，这就需要考虑到消息传播的时效性以及集群规模的折中了。选取的节点过少，集群中各个节点的状态达到最终一致性的时间就边长，选取的节点过多，网络传输量就多大，同时集群中传播的冗余信息就变多，节点对于消息的处理的代价就变大，注意到Redis是单线程模型，集群模式下对于消息的处理是与用户命令处理是同一个线程，过大的消息体的处理必然会占用更多的CPU，这将严重限制集群的规模。按照当前的Redis gossip协议策略，一般可以支持400个左右的节点集群，节点数在增加，就会对用户的命令处理带来较明显的影响。

gossip消息体节点的选取策略在clusterSendPing中实现：

```java
void clusterSendPing(clusterLink*link, int type) {
	...
	int freshnodes = dictSize(server.cluster->nodes)-2;
	wanted = floor(dictSize(server.cluster->nodes)/10);
    if (wanted < 3) wanted = 3;
    if (wanted > freshnodes) wanted = freshnodes;
    ...
    int pfail_wanted = server.cluster->stats_pfail_nodes;
    totlen = sizeof(clusterMsg)-sizeof(union clusterMsgData);
    totlen += (sizeof(clusterMsgDataGossip)*(wanted+pfail_wanted));
}
```

包含两部分：1/10的总节点数、PFAIL状态的节点数。PFAIL状态的节点需要尽快通知其他节点，以便进行slave的failover。那么集群正常状态下为什么要选取1/10的节点数呢，作者在clusterSendPing中的注释解释了这个问题：按照上面介绍的gossip协议发送时间，每隔server.cluster_node_timeout/2的时间内会向对端节点发送一个PING消息，对端节点会回复一个PONG消息，那么在server.cluster_node_timeout时间内，会处理4个gossip协议，由于PFAIL标志的有效时间是server.cluster_node_timeout*2，在这段时间内，共会处理8个gossip协议，假设此时集群中有个节点A宕机，这个宕机节点被另外节点B检测到，节点B将其标志位PFAIL状态，在server.cluster_node_timeout*2时间内，节点B可以将发送8次gossip协议，每次带有1/10的节点，那么就有80%的概率将节点A的宕机信息传播给集群中其他节点，同时将PFAIL状态标志位FAIL状态只需要过半的节点数即可，从概率上将，80%的概率足够集群中其他节点标志位PFAIL状态，从而不影响正常的failover。

选取好节点数之和，就是构造并发送gossip协议了，这部分代码较繁琐，直接看代码即可。
