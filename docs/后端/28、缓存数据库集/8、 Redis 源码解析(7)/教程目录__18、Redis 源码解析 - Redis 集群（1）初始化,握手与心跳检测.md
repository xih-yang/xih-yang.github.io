# 18、Redis 源码解析 - Redis 集群[1]初始化,握手与心跳检测
- 来源：https://ddkk.com/zhuanlan/db/redis/7/18.html
- 分类：缓存数据库
- 分组：教程目录
所谓的集群,就是通过添加服务器的数量，提供相同的服务，从而让服务器达到一个稳定，高效的状态．Redis集群是Redis提供的分布式数据库方案．它允许在集群中添加从节点，且不需要sentinel就可以保证高可用，在主节点下线时不必使得集群整体下线就可以进行故障转移．使用哈希槽而不是一致性哈希来解决集群分布式缓存问题，使得我们可以向集群中插入一个新节点的时候不必进行不必要的数据迁移．使用Gossip协议来进行节点之间的信息交换，也就是采用Gossip协议执行的心跳包．

### 基础数据结构

首先我们来看看在集群中不可或缺的数据结构．每个集群节点中都会存贮一个`clusterState`结构，均为本节点中的信息．

```java
typedef struct clusterState {
    // 指向当前节点的指针　用于在比较字典中找到的clusterNode是不是自己
    clusterNode *myself;  /* This node */
    // 集群当前的配置纪元，用于实现故障转移
    uint64_t currentEpoch;
    // 集群当前的状态：是在线还是下线
    int state;            /* REDIS_CLUSTER_OK, REDIS_CLUSTER_FAIL, ... */
    // 集群中至少处理着一个槽的节点的数量。
    int size;             /* Num of master nodes with at least one slot */
    // 集群节点名单（包括 myself 节点）
    // 字典的键为节点的名字，字典的值为 clusterNode 结构
    dict *nodes;          /* Hash table of name -> clusterNode structures */
	.......
	// 下面两个结构十分重要　用于槽的转移
    // 记录要从当前节点迁移到目标节点的槽，以及迁移的目标节点
    // migrating_slots_to[i] = NULL 表示槽 i 未被迁移
    // migrating_slots_to[i] = clusterNode_A 表示槽 i 要从本节点迁移至节点 A
    clusterNode *migrating_slots_to[REDIS_CLUSTER_SLOTS];
    // 记录要从源节点迁移到本节点的槽，以及进行迁移的源节点
    // importing_slots_from[i] = NULL 表示槽 i 未进行导入
    // importing_slots_from[i] = clusterNode_A 表示正从节点 A 中导入槽 i
    clusterNode *importing_slots_from[REDIS_CLUSTER_SLOTS];
    // 负责处理各个槽的节点　也就是某个槽的所属的节点是谁
    // 例如 slots[i] = clusterNode_A 表示槽 i 由节点 A 处理
    clusterNode *slots[REDIS_CLUSTER_SLOTS];
    // 跳跃表，表中以槽作为分值，键作为成员，对槽进行有序排序
    // 当需要对某些槽进行区间（range）操作时，这个跳跃表可以提供方便
    // 具体操作定义在 db.c 里面
    // 最重要的结构　其中存储着本节点中所属槽中的键值对
    zskiplist *slots_to_keys;
    /* The following fields are used to take the slave state on elections. */
    // 以下这些域被用于进行故障转移选举
    // 在说到那些的时候我们会提到．
    .................
} clusterState;
```

接下来看看`clusterNode`，其中存储着集群中所有节点具体信息．这些结构存储在clusterState的nodes字典中．

```java
struct clusterNode {
    // 创建节点的时间
    mstime_t ctime; /* Node object creation time. */
    // 节点的名字，由 40 个十六进制字符组成
    // 例如 68eef66df23420a5862208ef5b1a7005b806f2ff
    char name[REDIS_CLUSTER_NAMELEN]; /* Node name, hex string, sha1-size */
    // 节点标识
    // 使用各种不同的标识值记录节点的角色（比如主节点或者从节点），
    // 以及节点目前所处的状态（比如在线或者下线）。
    int flags;      /* REDIS_NODE_... */
    // 节点当前的配置纪元，用于实现故障转移
    uint64_t configEpoch; /* Last configEpoch observed for this node */
    // 由本节点负责处理的槽
    // 一共有 REDIS_CLUSTER_SLOTS / 8 个字节长
    // 这个结构其实就是一个位图　每个位上只有两种可能　是或否　所以可以用位图来存储
    // 每个字节8位　所以除以8
    unsigned char slots[REDIS_CLUSTER_SLOTS/8]; /* slots handled by this node */
    // 该节点负责处理的槽数量
    int numslots;   /* Number of slots handled by this node */
    // 如果本节点是主节点，那么用这个属性记录从节点的数量
    int numslaves;  /* Number of slave nodes, if this is a master */
    // 指针数组，指向各个从节点
    struct clusterNode **slaves; /* pointers to slave nodes */
    // 如果这是一个从节点，那么指向主节点
    struct clusterNode *slaveof; /* pointer to the master node */
    // 最后一次发送 PING 命令的时间
    mstime_t ping_sent;      /* Unix time we sent latest ping */
    // 最后一次接收 PONG 回复的时间戳
    mstime_t pong_received;  /* Unix time we received the pong */
    // 最后一次被设置为 FAIL 状态的时间
    mstime_t fail_time;      /* Unix time when FAIL flag was set */
    // 最后一次给某个从节点投票的时间
    mstime_t voted_time;     /* Last time we voted for a slave of this master */
    // 最后一次从这个节点接收到复制偏移量的时间
    mstime_t repl_offset_time;  /* Unix time we received offset for this node */
    // 这个节点的复制偏移量
    long long repl_offset;      /* Last known repl offset for this node. */
    // 节点的 IP 地址
    char ip[REDIS_IP_STR_LEN];  /* Latest known IP address of this node */
    // 节点的端口号
    int port;                   /* Latest known port of this node */
    // 保存连接节点所需的有关信息　这是握手阶段核心成员
    clusterLink*link;          /* TCP/IP link with this node */
    // 一个链表，记录了所有其他节点对该节点的下线报告
    list *fail_reports;         /* List of nodes signaling this as failing */
};
```

### 初始化

Redis实例启动时，会根据根据配置文件中的"cluster-enabled"选项，决定该Redis实例是否处于集群模式。如果该选项值为”yes”，则Redis实例中的server.cluster_enabled被置为1，表示当前处于集群模式。然后调用`clusterInit`进行初始化．

```java
void clusterInit(void) {
    int saveconf = 0;
    // 初始化配置
    server.cluster = zmalloc(sizeof(clusterState));
    server.cluster->myself = NULL;
    server.cluster->currentEpoch = 0;
    server.cluster->state = REDIS_CLUSTER_FAIL;
    server.cluster->size = 1;
    server.cluster->todo_before_sleep = 0;
    server.cluster->nodes = dictCreate(&clusterNodesDictType,NULL);
    server.cluster->nodes_black_list =
        dictCreate(&clusterNodesBlackListDictType,NULL);
    server.cluster->failover_auth_time = 0;
    server.cluster->failover_auth_count = 0;
    server.cluster->failover_auth_rank = 0;
    server.cluster->failover_auth_epoch = 0;
    server.cluster->lastVoteEpoch = 0;
    server.cluster->stats_bus_messages_sent = 0;
    server.cluster->stats_bus_messages_received = 0;
    memset(server.cluster->slots,0, sizeof(server.cluster->slots));
    // 清理所有槽的迁移和导入状态　也就是清空importing_slots_from和migrating_slots_to这两个结构
    clusterCloseAllSlots();
    /* Lock the cluster config file to make sure every node uses
     * its own nodes.conf. */
    if (clusterLockConfig(server.cluster_configfile) == REDIS_ERR)
        exit(1);
    /* Load or create a new nodes configuration. */
    if (clusterLoadConfig(server.cluster_configfile) == REDIS_ERR) {
        /* No configuration found. We will just use the random name provided
         * by the createClusterNode() function. */
        myself = server.cluster->myself =
            createClusterNode(NULL,REDIS_NODE_MYSELF|REDIS_NODE_MASTER); //根据初始化信息创建一个clusterNode结构
        redisLog(REDIS_NOTICE,"No cluster configuration found, I'm %.40s",
            myself->name);
        clusterAddNode(myself);　//向主字典中插入myself
        saveconf = 1;
    }
    // 保存 nodes.conf 文件
    if (saveconf) clusterSaveConfigOrDie(1);
    /* We need a listening TCP port for our cluster messaging needs. */
    // 监听 TCP 端口
    server.cfd_count = 0;
    /* Port sanity check II
     * The other handshake port check is triggered too late to stop
     * us from trying to use a too-high cluster port number. */
    if (server.port > (65535-REDIS_CLUSTER_PORT_INCR)) {
        redisLog(REDIS_WARNING, "Redis port number too high. "
                   "Cluster communication port is 10,000 port "
                   "numbers higher than your Redis port. "
                   "Your Redis port number must be "
                   "lower than 55535.");
        exit(1);
    }
	// 该监听端口用于接收其他集群节点的TCP建链，集群中的每个节点，都会与其他节点进行建链，因此整个集群就形成了一个强连通网状图
	// 虾米函数根据地址数量进行监听
    if (listenToPort(server.port+REDIS_CLUSTER_PORT_INCR,
        server.cfd,&server.cfd_count) == REDIS_ERR)
    {
        exit(1);
    } else {
        int j;
        for (j = 0; j < server.cfd_count; j++) {
            // 为每一个套接字关联监听事件处理器
            if (aeCreateFileEvent(server.el, server.cfd[j], AE_READABLE,
                clusterAcceptHandler, NULL) == AE_ERR)
                    redisPanic("Unrecoverable error creating Redis Cluster "
                                "file event.");
        }
    }
    /* The slots -> keys map is a sorted set. Init it. */
    // slots -> keys 映射是一个有序集合 是一个跳跃表　可以使我们logn找到需要的槽
    server.cluster->slots_to_keys = zslCreate();
    resetManualFailover();
}
```

此时，一个集群中的节点就初始化成功了．

### 握手

**CLUSTER MEET**

简答说说握手的基本步骤

**1、** 节点A收到一条`CLUSTERMEET`命令．其中ip和port为需要添加到A所属集群的节点的ip和port．；

**2、** 节点A为这个节点创建一个`clusternode`结构,但其中link为NULL.；

**3、** 在`clusterCron`函数中发现主字典中某个`clusternode`结构的link为NULL，对其所属结构进行TCP连接，link此时被赋值，不为NULL.并发送MEET消息(Gossip协议)．；

**4、** 将加入的节点收到节点A发送的MEET信息，其同样会创建`clusternode`结构，代表节点A,使用其中Gossip部分进行更新，并回复一个PONG信息；

**5、** 节点Ａ收到PONG后回复一条PING，代表自己已经知道其确定自己的存在．(书上是这样说的,但我在源码中并没有看到)；

其中除了第一条`CLUSTER MEET`命令，剩下的三个命令都遵循Gossip协议（下面会说）．

接下来我们看看`CLUSTER MEET`的处理函数．

```java
void clusterCommand(redisClient *c) {
    // 不能在非集群模式下使用该命令
    if (server.cluster_enabled == 0) {
        addReplyError(c,"This instance has cluster support disabled");
        return;
    }
	// cluster　meet命令处理函数
    if (!strcasecmp(c->argv[1]->ptr,"meet") && c->argc == 4) {
        /* CLUSTER MEET <ip> <port> */
        // 将给定地址的节点添加到当前节点所处的集群里面
        long long port;
        // 检查 port 参数的合法性
        if (getLongLongFromObject(c->argv[3], &port) != REDIS_OK) {
            addReplyErrorFormat(c,"Invalid TCP port specified: %s",
                                (char*)c->argv[3]->ptr);
            return;
        }
        // 尝试与给定地址的节点进行连接 也就是进行握手
        if (clusterStartHandshake(c->argv[2]->ptr,port) == 0 &&
            errno == EINVAL)
        {
            // 连接失败
            addReplyErrorFormat(c,"Invalid node address specified: %s:%s",
                            (char*)c->argv[2]->ptr, (char*)c->argv[3]->ptr);
        } else {
            // 连接成功
            addReply(c,shared.ok); //把shared.ok发送给客户端
        }
    }
    ...................
}
```

```java
int clusterStartHandshake(char *ip, int port) {
    clusterNode *n;
    char norm_ip[REDIS_IP_STR_LEN];
    struct sockaddr_storage sa;
    // ip和port的合法性检查
	.........
    // 检查节点是否已经发送握手请求，如果是的话，那么直接返回，防止出现重复握手　比较ip/port
    if (clusterHandshakeInProgress(norm_ip,port)) {
        errno = EAGAIN;
        return 0;
    }
    /* Add the node with a random address (NULL as first argument to
     * createClusterNode()). Everything will be fixed during the
     * handskake. */
    // 对给定地址的节点设置一个随机名字
    // 当 HANDSHAKE 完成时，当前节点会取得给定地址节点的真正名字
    // 到时会用真名替换随机名
    // 这里设置为REDIS_NODE_MEET 在clusterCron中会进行TCP连接 且发送一条MEET信息
    // 这里为Cluster握手的准备期
    n = createClusterNode(NULL,REDIS_NODE_HANDSHAKE|REDIS_NODE_MEET); // 其中link为NULL 
    memcpy(n->ip,norm_ip,sizeof(n->ip));
    n->port = port;
    // 将节点添加到集群当中
    clusterAddNode(n);
    return 1;
}
```

以上其实就是我们所说的第一步与第二步，这个时候此节点只是知道有一个想要加入集群的节点存在，但还没有与其建立连接，在`clusterCron`函数中进行TCP连接．

```java
void clusterCron(void) {
		........
        if (node->link == NULL) {
      //检测到某个节点还未进行连接
            int fd;
            mstime_t old_ping_sent;
            clusterLink*link;
			／／进行非阻塞连接
            fd = anetTcpNonBlockBindConnect(server.neterr, node->ip,
                node->port+REDIS_CLUSTER_PORT_INCR, //集群端口号加10000
                    server.bindaddr_count ? server.bindaddr[0] : NULL);
            if (fd == -1) {
                redisLog(REDIS_DEBUG, "Unable to connect to "
                    "Cluster Node [%s]:%d -> %s", node->ip,
                    node->port+REDIS_CLUSTER_PORT_INCR,
                    server.neterr);
                continue;
            }
            link = createClusterLink(node);　//　创建一个link
            link->fd = fd;
            node->link = link;
            aeCreateFileEvent(server.el,link->fd,AE_READABLE,
                    clusterReadHandler,link); //上面是异步连接 注册一个读处理器 等待了连接成功
            /* Queue a PING in the new connection ASAP: this is crucial
             * to avoid false positives in failure detection.
             *
             * If the node is flagged as MEET, we send a MEET message instead
             * of a PING one, to force the receiver to add us in its node
             * table. */
            // 向新连接的节点发送 PING 命令，防止节点被识进入下线
            // 在
            // 如果节点被标记为 MEET ，那么发送 MEET 命令，否则发送 PING 命令
            old_ping_sent = node->ping_sent;
            // MEET为请求握手
            // 我们可以在clusterStartHandshake中createClusterNode参数中看到初始为MEET
            // 当目标节点收到这条meet以后 两端都互相知道了对方的存在  
            clusterSendPing(link, node->flags & REDIS_NODE_MEET ?
                    CLUSTERMSG_TYPE_MEET : CLUSTERMSG_TYPE_PING);
            // 这不是第一次发送 PING 信息，所以可以还原这个时间
            // 等 clusterSendPing() 函数来更新它
            if (old_ping_sent) {
                /* If there was an active ping before the link was
                 * disconnected, we want to restore the ping time, otherwise
                 * replaced by the clusterSendPing() call. */
                node->ping_sent = old_ping_sent;
            }
            /* We can clear the flag after the first packet is sent.
             *
             * 在发送 MEET 信息之后，清除节点的 MEET 标识。
             *
             * If we'll never receive a PONG, we'll never send new packets
             * to this node. Instead after the PONG is received and we
             * are no longer in meet/handshake status, we want to send
             * normal PING packets. 
             *
             * 如果当前节点（发送者）没能收到 MEET 信息的回复，
             * 那么它将不再向目标节点发送命令。
             *
             * 如果接收到回复的话，那么节点将不再处于 HANDSHAKE 状态，
             * 并继续向目标节点发送普通 PING 命令。
             */
            node->flags &= ~REDIS_NODE_MEET;
            redisLog(REDIS_DEBUG,"Connecting with Node %.40s at %s:%d",
                    node->name, node->ip, node->port+REDIS_CLUSTER_PORT_INCR);
        }
    }
    dictReleaseIterator(di);
}
		...........
```

以上就相当于是握手过程的第三步．由`clusterSendPing`发送MEET信息，这个函数我们在说心跳检测的时候详说，别看它的名字是sendPing，但其实是根据参数发送信息的．接下来的步骤的操作实际发生在要加入集群的节点服务器上．也就是收到MEET命令以后的做法．要加入集群的节点服务器在集群端口上收到其他集群节点发来的消息之后，触发其监听端口上的可读事件，事件回调函数clusterReadHandler中，调用read读取其他节点发来的数据。当收齐一个包的所有数据后，调用clusterProcessPacket函数处理该包。我们来看看MEET的实际处理部分

```java
	...
	sender = clusterLookupNode(hdr->sender); // 从主字典中查找发送这条消息的节点是否存在
	...
    if (type == CLUSTERMSG_TYPE_PING || type == CLUSTERMSG_TYPE_MEET) {
        redisLog(REDIS_DEBUG,"Ping packet received: %p", (void*)link->node);
        /* Add this node if it is new for us and the msg type is MEET.
         *
         * 如果当前节点是第一次遇见这个节点，并且对方发来的是 MEET 信息，
         * 那么将这个节点添加到集群的节点列表里面。
         *
         * In this stage we don't try to add the node with the right
         * flags, slaveof pointer, and so forth, as this details will be
         * resolved when we'll receive PONGs from the node. 
         *
         * 节点目前的 flag 、 slaveof 等属性的值都是未设置的，
         * 等当前节点向对方发送 PING 命令之后，
         * 这些信息可以从对方回复的 PONG 信息中取得。
         */
        if (!sender && type == CLUSTERMSG_TYPE_MEET) {
      //节点不存在且为MEET
            clusterNode *node;
            // 创建 HANDSHAKE 状态的新节点 REDIS_NODE_HANDSHAKE很重要 注意与对端中设置MEET不同 因为这里没必要再发送MEET了
            // 意味着在flag中不包含REDIS_NODE_MEET 到时候会发送PING
            // 但是link仍然为NULL 在ClusterCron中仍然会再次进行TCP连接 也就是一对结点之间进行两个全双工的TCP连接
            node = createClusterNode(NULL,REDIS_NODE_HANDSHAKE);
            // 设置 IP 和端口
            nodeIp2String(node->ip,link);
            node->port = ntohs(hdr->port);
            // 将新节点添加到集群
            clusterAddNode(node);
            clusterDoBeforeSleep(CLUSTER_TODO_SAVE_CONFIG);
        }
        /* Get info from the gossip section */
        // 分析并取出消息中的 gossip 节点信息
        clusterProcessGossipSection(hdr,link);
        /* Anyway reply with a PONG */
        // 向目标节点返回一个 PONG
        clusterSendPing(link,CLUSTERMSG_TYPE_PONG);
    }
```

以上第四部就已经完成了，两端都知道对方存在，然后nodeA会收到PONG信息，也会调用以上信息进行回复，但是执行不同的部分 ,根据link是否存在和flag的状态来决定执行哪一部分.

```java
        if (link->node) {
            // link存在 且节点处于 HANDSHAKE 状态
            if (nodeInHandshake(link->node)) {
                /* If we already have this node, try to change the
                 * IP/port of the node with the new one. */
                if (sender) {
                    redisLog(REDIS_VERBOSE,
                        "Handshake: we already know node %.40s, "
                        "updating the address if needed.", sender->name);
                    // 如果有需要的话，更新节点的地址
                    if (nodeUpdateAddressIfNeeded(sender,link,ntohs(hdr->port)))
                    {
                        clusterDoBeforeSleep(CLUSTER_TODO_SAVE_CONFIG|
                                             CLUSTER_TODO_UPDATE_STATE);
                    }
                    /* Free this node as we alrady have it. This will
                     * cause the link to be freed as well. */
                    // 释放节点
                    freeClusterNode(link->node);
                    return 0;
                }
                /* First thing to do is replacing the random name with the
                 * right node name if this was a handshake stage. */
                // 用节点的真名替换在 HANDSHAKE 时创建的随机名字
                clusterRenameNode(link->node, hdr->sender);
                redisLog(REDIS_DEBUG,"Handshake with node %.40s completed.",
                    link->node->name);
                // 关闭HANDSHAKE状态 此时握手完成
                link->node->flags &= ~REDIS_NODE_HANDSHAKE;
                // 设置节点的角色
                link->node->flags |= flags&(REDIS_NODE_MASTER|REDIS_NODE_SLAVE);
                clusterDoBeforeSleep(CLUSTER_TODO_SAVE_CONFIG);
            }
		｝
```

这样一次握手的过程就完成了，值得一提的是在请求加入集群的节点中Link此时认为NULL，也就是说在其`clusterCron`中仍然会再次发起一个TCP连接．

### 心跳检测

在集群中心跳检测不仅仅是为了进行故障检测，其还有向其他节点发送集群其他节点的责任，这使得我们可能在新加入一个节点的时候我们不必去广播．这里我们就不得不谈谈`Gossip协议`了．

Gossip protocol 也叫 Epidemic Protocol （流行病协议），实际上它还有很多别名，比如：“流言算法”、“疫情传播算法”等。

Gossip的特点是：在一个有界网络中，每个节点都随机地与其他节点通信，经过一番杂乱无章的通信，最终所有节点的状态都会达成一致。每个节点可能知道所有其他节点，也可能仅知道几个邻居节点，只要这些节可以通过网络连通，最终他们的状态都是一致的，当然这也是疫情传播的特点。

Gossip是一个最终一致性算法。虽然无法保证在某个时刻所有节点状态一致，但可以保证在”最终“所有节点一致，”最终“是一个现实中存在，但理论上无法证明的时间点。但Gossip的缺点也很明显，就是有可能会有大量的冗余，因为每次选择的过程的都是随机的，冗余通信会对网路带宽、CPU资源造成很大的负载。还有就是消息的延迟，因为它是通过每个节点向其他已连接节点随机更新，这一意味着实时性无法保证，这会不可避免的造成消息延迟，故不适用与对实时性要求极高的场景．

但其优点也是非常明显的，就是：

**1、** 天然的容错性，无论哪个节点宕机都不影响传播；

**2、** Gossip协议中每一个节点都是平等的，任意一个节点得到信息，因为网络的连通性，最终所有的节点都会得到信息．；

**3、** 传播速度快，可以达到logN；

**4、** 实现简单；

在我们的心跳检测中的命令都是基于Gossip协议的．现在问题来了，在nodeA知道一个节点加入集群时如何使得集群中全部节点知道它的存在呢？就是使用心跳包．举个简答的例子，当前我们有一个集群A,B,C,D．A知道有F进入集群，在一次心跳中它会向B,C发送Ｆ，D的信息，BC在收到消息后进行更新连接，同样在第二轮心跳中，ABC中可能会有一个节点向Ｄ发送F的信息，此时整个集群都知道了F的存在，且在接收消息的回调中建立`clusternode`结构，并在`servercron`中进行TCP连接．

核心函数`clusterSendPing`向其他集群节点发送心跳包或MEET包，心跳包可以是PING、PONG包。

```java
// 向指定节点发送一条 MEET 、 PING 或者 PONG 消息
void clusterSendPing(clusterLink*link, int type) {
    unsigned char buf[sizeof(clusterMsg)];
    clusterMsg *hdr = (clusterMsg*) buf;
    int gossipcount = 0, totlen;
    /* freshnodes is the number of nodes we can still use to populate the
     * gossip section of the ping packet. Basically we start with the nodes
     * we have in memory minus two (ourself and the node we are sending the
     * message to). Every time we add a node we decrement the counter, so when
     * it will drop to <= zero we know there is no more gossip info we can
     * send. */
    // freshnodes 是用于发送 gossip 信息的计数器
    // 每次发送一条信息时，程序将 freshnodes 的值减一
    // 当 freshnodes 的数值小于等于 0 时，程序停止发送 gossip 信息
    // freshnodes 的数量是节点目前的 nodes 表中的节点数量减去 2 
    // 这里的 2 指两个节点，一个是 myself 节点（也即是发送信息的这个节点）
    // 另一个是接受 gossip 信息的节点
    int freshnodes = dictSize(server.cluster->nodes)-2;
    // 如果发送的信息是 PING ，那么更新最后一次发送 PING 命令的时间戳
    if (link->node && type == CLUSTERMSG_TYPE_PING)
        link->node->ping_sent = mstime();
    // 将当前节点的信息（比如名字、地址、端口号、负责处理的槽）记录到消息里面
    // 心跳包仍然携带数据
    clusterBuildMessageHdr(hdr,type);
    /* Populate the gossip fields */
    // 从当前节点已知的节点中随机选出最大三个节点
    // 并通过这条消息捎带给目标节点，从而实现 gossip 协议
    // 每个节点有 freshnodes 次发送 gossip 信息的机会
    // freshnodes的判断感觉更像集群数量小于５时的判断
    // 每次向目标节点发送最大三个被选中节点的 gossip 信息（gossipcount 计数）
    while(freshnodes > 0 && gossipcount < 3) {
      //最大三个
        // 从 nodes 字典中随机选出一个节点（被选中节点）
        dictEntry *de = dictGetRandomKey(server.cluster->nodes);
        clusterNode *this = dictGetVal(de);
        clusterMsgDataGossip *gossip;
        int j;
        /* In the gossip section don't include:
         * 以下节点不能作为被选中节点：
         * 1) Myself.
         *    节点本身。
         * 2) Nodes in HANDSHAKE state.
         *    处于 HANDSHAKE 状态的节点。
         * 3) Nodes with the NOADDR flag set.
         *    带有 NOADDR 标识的节点
         * 4) Disconnected nodes if they don't have configured slots.
         *    因为不处理任何槽而被断开连接的节点 
         */
        if (this == myself ||
            this->flags & (REDIS_NODE_HANDSHAKE|REDIS_NODE_NOADDR) ||
            (this->link == NULL && this->numslots == 0))
        {
                freshnodes--; /* otherwise we may loop forever. */
                continue;
        }
        /* Check if we already added this node */
        // 检查被选中节点是否已经在 hdr->data.ping.gossip 数组里面
        // 其中存储着此次已经选择的node　重复时当然要跳过
        for (j = 0; j < gossipcount; j++) {
            if (memcmp(hdr->data.ping.gossip[j].nodename,this->name,
                    REDIS_CLUSTER_NAMELEN) == 0) break;
        }
        if (j != gossipcount) continue;
        /* Add it */
        // 这个被选中节点有效，计数器减一
        freshnodes--;
        // 指向 gossip 信息结构
        gossip = &(hdr->data.ping.gossip[gossipcount]);
        // 将被选中节点的名字记录到 gossip 信息
        memcpy(gossip->nodename,this->name,REDIS_CLUSTER_NAMELEN);
        // 将被选中节点的 PING 命令发送时间戳记录到 gossip 信息
        gossip->ping_sent = htonl(this->ping_sent);
        // 将被选中节点的 PING 命令回复的时间戳记录到 gossip 信息
        gossip->pong_received = htonl(this->pong_received);
        // 将被选中节点的 IP 记录到 gossip 信息
        memcpy(gossip->ip,this->ip,sizeof(this->ip));
        // 将被选中节点的端口号记录到 gossip 信息
        gossip->port = htons(this->port);
        // 将被选中节点的标识值记录到 gossip 信息
        gossip->flags = htons(this->flags);
        // 这个被选中节点有效，计数器增一
        gossipcount++;
    }
    // 计算信息长度
    totlen = sizeof(clusterMsg)-sizeof(union clusterMsgData);
    totlen += (sizeof(clusterMsgDataGossip)*gossipcount);
    // 将被选中节点的数量（gossip 信息中包含了多少个节点的信息）
    // 记录在 count 属性里面
    hdr->count = htons(gossipcount);
    // 将信息的长度记录到信息里面
    hdr->totlen = htonl(totlen);
    // 发送信息
    clusterSendMessage(link,buf,totlen);
    // 一个心跳包结构由本身信息＋多个节点信息
}
```

当节点收到其他节点发来的PING、PONG或MEET包后，会调用`clusterProcessPacket`去处理包，其中的`clusterProcessGossipSection`函数会处理包中的gossip部分.这三个信息的包结构都是相同的，由消息头中的type判断是哪一个信息．

```java
void clusterProcessGossipSection(clusterMsg *hdr, clusterLink*link) {
    // 记录这条消息中包含了多少个节点的信息
    uint16_t count = ntohs(hdr->count);
    // 指向第一个节点的信息
    clusterMsgDataGossip *g = (clusterMsgDataGossip*) hdr->data.ping.gossip;
    // 取出发送者
    clusterNode *sender = link->node ? link->node : clusterLookupNode(hdr->sender);
    // 遍历所有节点的信息
    while(count--) {
        sds ci = sdsempty();
        // 分析节点的 flag
        uint16_t flags = ntohs(g->flags);
        // 信息节点
        clusterNode *node;
        // 取出节点的flag打印日志
		.........
        /* Update our state accordingly to the gossip sections */
        // 使用消息中的信息对节点进行更新　这点很重要
        node = clusterLookupNode(g->nodename);
        // 节点已经存在于当前节点
        if (node) {
            /* We already know this node.
               Handle failure reports, only when the sender is a master. */
            // 如果 sender 是一个主节点，那么我们需要处理下线报告，这里是在进行下线检测，
            // 当fail_reports中数量超过集群全部节点的一半加一时视为下线，广播fail信息
            if (sender && nodeIsMaster(sender) && node != myself) {
                // 节点处于 FAIL 或者 PFAIL 状态
                if (flags & (REDIS_NODE_FAIL|REDIS_NODE_PFAIL)) {
                    // 添加 sender 对 node 的下线报告
                    if (clusterNodeAddFailureReport(node,sender)) {
                        redisLog(REDIS_VERBOSE,
                            "Node %.40s reported node %.40s as not reachable.",
                            sender->name, node->name);
                    }
                    // 尝试将 node 标记为 FAIL
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
            /* If we already know this node, but it is not reachable, and
             * we see a different address in the gossip section, start an
             * handshake with the (possibly) new address: this will result
             * into a node address update if the handshake will be
             * successful. */
            // 如果节点之前处于 PFAIL 或者 FAIL 状态
            // 并且该节点的 IP 或者端口号已经发生变化
            // 那么可能是节点换了新地址，尝试对它进行握手
            if (node->flags & (REDIS_NODE_FAIL|REDIS_NODE_PFAIL) &&
                (strcasecmp(node->ip,g->ip) || node->port != ntohs(g->port)))
            {
                clusterStartHandshake(g->ip,ntohs(g->port));
            }
        // 当前节点不认识 node
        } else {
            /* If it's not in NOADDR state and we don't have it, we
             * start a handshake process against this IP/PORT pairs.
             *
             * 如果 node 不在 NOADDR 状态，并且当前节点不认识 node 
             * 那么向 node 发送 HANDSHAKE 消息。 
             *
             * Note that we require that the sender of this gossip message
             * is a well known node in our cluster, otherwise we risk
             * joining another cluster.
             *
             * 注意，当前节点必须保证 sender 是本集群的节点，
             * 否则我们将有加入了另一个集群的风险。
             */
             // 这里就相当于是加入不认识的节点了
            if (sender &&
                !(flags & REDIS_NODE_NOADDR) &&
                !clusterBlacklistExists(g->nodename))
            {
                clusterStartHandshake(g->ip,ntohs(g->port));
            }
        }
        /* Next node */
        // 处理下个节点的信息
        g++;
    }
}
```

到了这，心跳检测我们也就聊完了．
