# 25、Redis 源码解析 - Redis Redis Cluster 的通信流程深入剖析（载入配置文件、节点握手、分配槽）
- 来源：https://ddkk.com/zhuanlan/db/redis/4/25.html
- 分类：缓存数据库
- 分组：教程目录
## Redis Cluster 通信流程深入剖析

### 1. Redis Cluster 介绍和搭建

请查看这篇博客：[Redis Cluster 介绍与搭建](http://blog.csdn.net/men_wen/article/details/72853078)

这篇博客会介绍`Redis Cluster`的**数据分区理论**和一个**三主三从集群**的搭建。

[Redis Cluster文件详细注释](https://github.com/menwengit/redis_source_annotation/blob/master/cluster.c)

本文会详细剖析搭建 Redis Cluster 的通信流程

### 2. Redis Cluster 和 Redis Sentinel

`Redis 2.8`之后正式提供了`Redis Sentinel(哨兵)`架构，而`Redis Cluster(集群)`是在`Redis 3.0`正式加入的功能。

`Redis Cluster` 和 `Redis Sentinel`都可以搭建`Redis`多节点服务，而目的都是解决`Redis`主从复制的问题，但是他们还是有一些不同。

`Redis`主从复制可将主节点数据同步给从节点，从节点此时有两个作用：

- 一旦主节点宕机，从节点作为主节点的备份可以随时顶上来。
- 扩展主节点的读能力，分担主节点读压力。

**但是，会出现以下问题：**

**1、** 一旦主节点宕机，从节点晋升成主节点，同时需要修改应用方的主节点地址，还需要命令所有从节点去复制新的主节点，整个过程需要人工干预；

**2、** 主节点的写能力或存储能力受到单机的限制；

**Redis的解决方案：**

- Redis Sentinel旨在解决第一个问题，即使主节点宕机下线，Redis Sentinel可以自动完成故障检测和故障转移，并通知应用方，真正实现高可用性（HA）。
- Redis Cluster则是Redis分布式的解决方案，解决后两个问题。当单机内存、并发、流量等瓶颈时，可以采用Cluster架构达到负载均衡的目的。

> 关于Redis Sentinel的介绍和分析：
>
> Redis Sentinel 介绍与部署
>
> Redis Sentinel实现（上）（哨兵的执行过程和执行内容）
>
> Redis Sentinel实现（下）（哨兵操作的深入剖析）

### 3. 搭建 Redis Cluster的通信流程深入剖析

在[Redis Cluster 介绍与搭建](http://blog.csdn.net/men_wen/article/details/72853078)一文中介绍了搭建集群的流程，分为三步：

- 准备节点
- 节点握手
- 分配槽位

我们就根据这个流程分析`Redis Cluster`的执行过程。

[Redis Cluster文件详细注释](https://github.com/menwengit/redis_source_annotation/blob/master/cluster.c)

#### 3.1 准备节点

我们首先要准备`6`个节点，并且准备号对应端口号的配置文件，在配置文件中，要打开`cluster-enabled yes`选项，表示该节点以集群模式打开。因为集群节点服务器可以看做一个普通的`Redis`服务器，因此，集群节点开启服务器的流程和普通的相似，只不过打开了一些关于集群的标识。

当我们执行这条命令时，就会执行主函数

```java
sudo redis-server conf/redis-6379.conf
```

在`main()`函数中，我们需要关注这几个函数：

- loadServerConfig(configfile,options)载入配置文件。
- 底层最终调用`loadServerConfigFromString()`函数，会解析到`cluster-`开头的集群的相关配置，并且保存到服务器的状态中。
- initServer()初始化服务器。
- 会为服务器设置时间事件的处理函数`serverCron()`，该函数会每间隔`100ms`执行一次集群的周期性函数`clusterCron()`。
- 之后会执行`clusterInit()`，来初始化`server.cluster`，这是一个`clusterState`类型的结构，保存的是集群的状态信息。
- 接着在`clusterInit()`函数中，如果是第一次创建集群节点，会创建一个随机名字的节点并且会生成一个集群专有的配置文件。如果是重启之前的集群节点，会读取第一次创建的集群专有配置文件，创建与之前相同名字的集群节点。
- verifyClusterConfigWithData()该函数在载入AOF文件或RDB文件后被调用，用来检查载入的数据是否正确和校验配置是否正确。
- aeSetBeforeSleepProc()在进入事件循环之前，为服务器设置每次事件循环之前都要执行的一个函数beforeSleep()，该函数一开始就会执行集群的clusterBeforeSleep()函数。
- aeMain()进入事件循环，一开始就会执行之前设置的beforeSleep()函数，之后就等待事件发生，处理就绪的事件。

以上就是主函数在开启集群节点时会执行到的主要代码。

在第二步初始化时，会创建一个`clusterState`类型的结构来保存**当前节点视角下的集群状态**。我们列出该结构体的代码：

```java
typedef struct clusterState {
    clusterNode *myself;  /* This node */
    // 当前纪元
    uint64_t currentEpoch;
    // 集群的状态
    int state;            /* CLUSTER_OK, CLUSTER_FAIL, ... */
    // 集群中至少负责一个槽的主节点个数
    int size;             /* Num of master nodes with at least one slot */
    // 保存集群节点的字典，键是节点名字，值是clusterNode结构的指针
    dict *nodes;          /* Hash table of name -> clusterNode structures */
    // 防止重复添加节点的黑名单
    dict *nodes_black_list; /* Nodes we don't re-add for a few seconds. */
    // 导入槽数据到目标节点，该数组记录这些节点
    clusterNode *migrating_slots_to[CLUSTER_SLOTS];
    // 导出槽数据到目标节点，该数组记录这些节点
    clusterNode *importing_slots_from[CLUSTER_SLOTS];
    // 槽和负责槽节点的映射
    clusterNode *slots[CLUSTER_SLOTS];
    // 槽映射到键的有序集合
    zskiplist *slots_to_keys;
    /* The following fields are used to take the slave state on elections. */
    // 之前或下一次选举的时间
    mstime_t failover_auth_time; /* Time of previous or next election. */
    // 节点获得支持的票数
    int failover_auth_count;    /* Number of votes received so far. */
    // 如果为真，表示本节点已经向其他节点发送了投票请求
    int failover_auth_sent;     /* True if we already asked for votes. */
    // 该从节点在当前请求中的排名
    int failover_auth_rank;     /* This slave rank for current auth request. */
    // 当前选举的纪元
    uint64_t failover_auth_epoch; /* Epoch of the current election. */
    // 从节点不能执行故障转移的原因
    int cant_failover_reason; 
    /* Manual failover state in common. */
    // 如果为0，表示没有正在进行手动的故障转移。否则表示手动故障转移的时间限制
    mstime_t mf_end;            
    /* Manual failover state of master. */
    // 执行手动孤战转移的从节点
    clusterNode *mf_slave;      /* Slave performing the manual failover. */
    /* Manual failover state of slave. */
    // 从节点记录手动故障转移时的主节点偏移量
    long long mf_master_offset; 
    // 非零值表示手动故障转移能开始
    int mf_can_start;           
    /* The followign fields are used by masters to take state on elections. */
    // 集群最近一次投票的纪元
    uint64_t lastVoteEpoch;     /* Epoch of the last vote granted. */
    // 调用clusterBeforeSleep()所做的一些事
    int todo_before_sleep; /* Things to do in clusterBeforeSleep(). */
    // 发送的字节数
    long long stats_bus_messages_sent;  /* Num of msg sent via cluster bus. */
    // 通过Cluster接收到的消息数量
    long long stats_bus_messages_received; /* Num of msg rcvd via cluster bus.*/
} clusterState;
```

初始化完当前集群状态后，会创建集群节点，执行的代码是这样的：

```java
myself = server.cluster->myself = createClusterNode(NULL,CLUSTER_NODE_MYSELF|CLUSTER_NODE_MASTER);
```

首先`myself`是一个全局变量，定义在`cluster.h`中，它指向当前集群节点，`server.cluster->myself`是集群状态结构中指向当前集群节点的变量，`createClusterNode()`函数用来创建一个集群节点，并设置了两个标识，表明身份状态信息。

该函数会创建一个如下结构来描述集群节点。

```java
typedef struct clusterNode {
    // 节点创建的时间
    mstime_t ctime; /* Node object creation time. */
    // 名字
    char name[CLUSTER_NAMELEN]; /* Node name, hex string, sha1-size */
    // 标识
    int flags;      /* CLUSTER_NODE_... */
    uint64_t configEpoch; /* Last configEpoch observed for this node */
    // 节点的槽位图
    unsigned char slots[CLUSTER_SLOTS/8]; /* slots handled by this node */
    // 当前节点复制槽的数量
    int numslots;   /* Number of slots handled by this node */
    // 从节点的数量
    int numslaves;  /* Number of slave nodes, if this is a master */
    // 从节点指针数组
    struct clusterNode **slaves; /* pointers to slave nodes */
    // 指向主节点，即使是从节点也可以为NULL
    struct clusterNode *slaveof; 
    // 最近一次发送PING的时间
    mstime_t ping_sent;      /* Unix time we sent latest ping */
    // 接收到PONG的时间
    mstime_t pong_received;  /* Unix time we received the pong */
    // 被设置为FAIL的下线时间
    mstime_t fail_time;      /* Unix time when FAIL flag was set */
    // 最近一次为从节点投票的时间
    mstime_t voted_time;     /* Last time we voted for a slave of this master */
    // 更新复制偏移量的时间
    mstime_t repl_offset_time;  /* Unix time we received offset for this node */
    // 孤立的主节点迁移的时间
    mstime_t orphaned_time;     /* Starting time of orphaned master condition */
    // 该节点已知的复制偏移量
    long long repl_offset;      /* Last known repl offset for this node. */
    // ip地址
    char ip[NET_IP_STR_LEN];  /* Latest known IP address of this node */
    // 节点端口号
    int port;                   /* Latest known port of this node */
    // 与该节点关联的连接对象
    clusterLink*link;          /* TCP/IP link with this node */
    // 保存下线报告的链表
    list *fail_reports;         /* List of nodes signaling this as failing */
} clusterNode;
```

初始化该结构时，会创建一个`link`为空的节点，该变量是`clusterLink`的指针，用来描述该节点与一个节点建立的连接。该结构定义如下：

```java
typedef struct clusterLink{
    // 连接创建的时间
    mstime_t ctime;             /* Linkcreation time */
    // TCP连接的文件描述符
    int fd;                     /* TCP socket file descriptor */
    // 输出（发送）缓冲区
    sds sndbuf;                 /* Packet send buffer */
    // 输入（接收）缓冲区
    sds rcvbuf;                 /* Packet reception buffer */
    // 关联该连接的节点
    struct clusterNode *node;   /* Node related to this link if any, or NULL */
} clusterLink;
```

该结构用于集群两个节点之间相互发送消息。如果节点A发送`MEET`消息给节点B，那么节点A会创建一个`clusterLink`结构的连接，`fd`设置为连接后的套节字，`node`设置为节点B，最后将该`clusterLink`结构保存到节点B的`link`中。

#### 3.2 节点握手

当我们创建好了6个节点时，需要通过节点握手来感知到到指定的进程。节点握手是指一批运行在集群模式的节点通过`Gossip`协议彼此通信。节点握手是集群彼此通信的第一步，可以详细分为这几个过程：

- myself节点发送MEET消息给目标节点。
- 目标节点处理MEET消息，并回复一个PONG消息给myself节点。
- myself节点处理PONG消息，回复一个PING消息给目标节点。

这里只列出了握手阶段的通信过程，之后无论什么节点，都会每隔`1s`发送一个`PING`命令给随机筛选出的`5`个节点，以进行故障检测。

接下来会分别以**`myself`节点**和**目标节点**的视角分别剖析这个握手的过程。

[Redis Cluster文件详细注释](https://github.com/menwengit/redis_source_annotation/blob/master/cluster.c)

##### 3.2.1 myself节点发送 MEET 消息

由客户端发起命令：`cluster meet  `

当节点接收到客户端的`cluster meet`命令后会调用对应的函数来处理命令，该命令的执行函数是`clusterCommand()`函数，该函数能够处理所有的`cluster`命令，因此我们列出处理`meet`选项的代码：

```java
    // CLUSTER MEET <ip> <port>命令
    // 与给定地址的节点建立连接
    if (!strcasecmp(c->argv[1]->ptr,"meet") && c->argc == 4) {
        long long port;
        // 获取端口
        if (getLongLongFromObject(c->argv[3], &port) != C_OK) {
            addReplyErrorFormat(c,"Invalid TCP port specified: %s",
                                (char*)c->argv[3]->ptr);
            return;
        }
        // 如果没有正在进行握手，那么根据执行的地址开始进行握手操作
        if (clusterStartHandshake(c->argv[2]->ptr,port) == 0 &&
            errno == EINVAL)
        {
            addReplyErrorFormat(c,"Invalid node address specified: %s:%s",
                            (char*)c->argv[2]->ptr, (char*)c->argv[3]->ptr);
        // 连接成功回复ok
        } else {
            addReply(c,shared.ok);
        }
    }
```

该函数先根据`cluster meet  `命令传入的参数，获取要与目标节点建立连接的节点地址，然后根据节点地址执行`clusterStartHandshake()`函数来开始执行握手操作。该函数代码如下：

```java
int clusterStartHandshake(char *ip, int port) {
    clusterNode *n;
    char norm_ip[NET_IP_STR_LEN];
    struct sockaddr_storage sa;
    // 检查地址是否非法
    if (inet_pton(AF_INET,ip,
            &(((struct sockaddr_in *)&sa)->sin_addr)))
    {
        sa.ss_family = AF_INET;
    } else if (inet_pton(AF_INET6,ip,
            &(((struct sockaddr_in6 *)&sa)->sin6_addr)))
    {
        sa.ss_family = AF_INET6;
    } else {
        errno = EINVAL;
        return 0;
    }
    // 检查端口号是否合法
    if (port <= 0 || port > (65535-CLUSTER_PORT_INCR)) {
        errno = EINVAL;
        return 0;
    }
    // 设置 norm_ip 作为节点地址的标准字符串表示形式
    memset(norm_ip,0,NET_IP_STR_LEN);
    if (sa.ss_family == AF_INET)
        inet_ntop(AF_INET,
            (void*)&(((struct sockaddr_in *)&sa)->sin_addr),
            norm_ip,NET_IP_STR_LEN);
    else
        inet_ntop(AF_INET6,
            (void*)&(((struct sockaddr_in6 *)&sa)->sin6_addr),
            norm_ip,NET_IP_STR_LEN);
    // 判断当前地址是否处于握手状态，如果是，则设置errno并返回，该函数被用来避免重复和相同地址的节点进行握手
    if (clusterHandshakeInProgress(norm_ip,port)) {
        errno = EAGAIN;
        return 0;
    }
    // 为node设置一个随机的地址，当握手完成时会为其设置真正的名字
    // 创建一个随机名字的节点
    n = createClusterNode(NULL,CLUSTER_NODE_HANDSHAKE|CLUSTER_NODE_MEET);
    // 设置地址
    memcpy(n->ip,norm_ip,sizeof(n->ip));
    n->port = port;
    // 添加到集群中
    clusterAddNode(n);
    return 1;
}
```

该函数先判断传入的地址是否非法，如果非法会设置`errno`，然后会调用`clusterHandshakeInProgress()`函数来判断是否要进行握手的节点也处于握手状态，以避免重复和相同地址的目标节点进行握手。然后创建一个随机名字的目标节点，并设置该目标节点的状态，如下：

```java
n = createClusterNode(NULL,CLUSTER_NODE_HANDSHAKE|CLUSTER_NODE_MEET);
```

然后调用`clusterAddNode()`函数将该目标节点添加到集群中，也就是`server.cluster->nodes`字典，该字典的键是节点的名字，值是指向`clusterNode()`结构的指针。

此时`myself`节点并没有将`meet`消息发送给指定地址的目标节点，而是设置集群中目标节点的状态。而发送`meet`消息则是在`clusterCron()`函数中执行。我们列出周期性函数中发送`MEET`消息的代码：

```java
    // 获取握手状态超时的时间，最低为1s
    // 如果一个处于握手状态的节点如果没有在该超时时限内变成一个普通的节点，那么该节点从节点字典中被删除 
    handshake_timeout = server.cluster_node_timeout;
    if (handshake_timeout < 1000) handshake_timeout = 1000;
    // 检查是否当前集群中有断开连接的节点和重新建立连接的节点
    di = dictGetSafeIterator(server.cluster->nodes);
    // 遍历所有集群中的节点，如果有未建立连接的节点，那么发送PING或PONG消息，建立连接
    while((de = dictNext(di)) != NULL) {
        clusterNode *node = dictGetVal(de);
        // 跳过myself节点和处于NOADDR状态的节点
        if (node->flags & (CLUSTER_NODE_MYSELF|CLUSTER_NODE_NOADDR)) continue;
        // 如果仍然node节点处于握手状态，但是从建立连接开始到现在已经超时
        if (nodeInHandshake(node) && now - node->ctime > handshake_timeout) {
            // 从集群中删除该节点，遍历下一个节点
            clusterDelNode(node);
            continue;
        }
        // 如果节点的连接对象为空
        if (node->link == NULL) {
            int fd;
            mstime_t old_ping_sent;
            clusterLink*link;
            // myself节点连接这个node节点
            fd = anetTcpNonBlockBindConnect(server.neterr, node->ip,
                node->port+CLUSTER_PORT_INCR, NET_FIRST_BIND_ADDR);
            // 连接出错，跳过该节点
            if (fd == -1) {
                // 如果ping_sent为0，察觉故障无法执行，因此要设置发送PING的时间，当建立连接后会真正的的发送PING命令
                if (node->ping_sent == 0) node->ping_sent = mstime();
                serverLog(LL_DEBUG, "Unable to connect to "
                    "Cluster Node [%s]:%d -> %s", node->ip,
                    node->port+CLUSTER_PORT_INCR,
                    server.neterr);
                continue;
            }
            // 为node节点创建一个连接对象
            link = createClusterLink(node);
            // 设置连接对象的属性
            link->fd = fd;
            // 为node设置连接对象
            node->link = link;
            // 监听该连接的可读事件，设置可读时间的读处理函数
            aeCreateFileEvent(server.el,link->fd,AE_READABLE,clusterReadHandler,link);    
            // 备份旧的发送PING的时间
            old_ping_sent = node->ping_sent;
            // 如果node节点指定了MEET标识，那么发送MEET命令，否则发送PING命令
            clusterSendPing(link, node->flags & CLUSTER_NODE_MEET ?
                    CLUSTERMSG_TYPE_MEET : CLUSTERMSG_TYPE_PING);
            // 如果不是第一次发送PING命令，要将发送PING的时间还原，等待被clusterSendPing()更新
            if (old_ping_sent) {
                node->ping_sent = old_ping_sent;
            }
            // 发送MEET消息后，清除MEET标识
            // 如果没有接收到PONG回复，那么不会在向该节点发送消息
            // 如果接收到了PONG回复，取消MEET/HANDSHAKE状态，发送一个正常的PING消息。
            node->flags &= ~CLUSTER_NODE_MEET;
            serverLog(LL_DEBUG,"Connecting with Node %.40s at %s:%d",
                    node->name, node->ip, node->port+CLUSTER_PORT_INCR);
        }
    }
    dictReleaseIterator(di);
```

`clusterNode()`函数一开始就会处理集群中**断开连接的节点和重新建立连接的节点**。

**以myself节点的视角**，遍历集群中所有的节点，跳过操作当前`myself`节点和没有指定地址的节点，然后判断处于握手状态的节点是否在建立连接的过程中超时，如果超时则会删除该节点。如果还没有创建连接，那么`myself`节点会与当前这个目标节点建立`TCP`连接，并获取套接字`fd`，根据这个套接字，就可以创建`clusterLink`结构的连接对象，并将这个连接对象保存到当前这个目标节点。

`myself`节点创建完连接后，首先会监听与目标节点建立的`fd`的可读事件，并设置对应的处理程序`clusterReadHandler()`，因为当发送`MEET`消息给目标节点后，要接收目标节点回复的`PING`。

接下来，`myself`节点就调用`clusterSendPing()`函数发送`MEET`消息给目标节点。`MEET`消息是特殊的`PING`消息，只用于通知新节点的加入，而`PING`消息还需要更改一些时间信息，以便进行故障检测。

最后无论如何都要取消`CLUSTER_NODE_MEET`标识，但是没有取消`CLUSTER_NODE_HANDSHAKE`该标识，表示仍处于握手状态，但是已经发送了`MEET`消息了。

##### 3.2.2 目标节点处理 MEET 消息回复 PONG 消息

当`myself`节点将`MEET`消息发送给目标节点之前，就设置了`clusterReadHandler()`函数为处理接收的`PONG`消息。当时目标节点如何接收到`MEET`消息，并且回复`PONG`消息给`myself`节点呢？

在集群模式下，每个节点初始化时调用的`clusterInit`时，会监听节点的端口等待客户端的连接，并且会将该监听的套接字`fd`保存到`server.cfd`数组中，然后创建文件事件，监听该套接字`fd`的可读事件，并设置可读事件处理函数`clusterAcceptHandler()`，等待客户端发送数据。

那么，在`myself`节点在发送`MEET`消息首先会连接目标节点所监听的端口，触发目标节点执行`clusterAcceptHandler()`函数，该函数实际上就是`accept()`函数，接收`myself`节点的连接，然后监听该连接上的可读事件，设置可读事件的处理函数为`clusterReadHandler()`，等待`myself`节点发送数据，当`myself`节点发送`MEET`消息给目标节点时，触发目标节点执行`clusterReadHandler()`函数来处理消息。

接下来，我们以目标节点的视角，来分析处理`MEET`消息的过程。

`clusterReadHandler()`函数底层就是一个`read()`函数，代码如下：

```java
void clusterReadHandler(aeEventLoop *el, int fd, void *privdata, int mask) {
    char buf[sizeof(clusterMsg)];
    ssize_t nread;
    clusterMsg *hdr;
    clusterLink*link = (clusterLink*) privdata;
    unsigned int readlen, rcvbuflen;
    UNUSED(el);
    UNUSED(mask);
    // 循环从fd读取数据
    while(1) { /* Read as long as there is data to read. */
        // 获取连接对象的接收缓冲区的长度，表示一次最多能多大的数据量
        rcvbuflen = sdslen(link->rcvbuf);
        // 如果接收缓冲区的长度小于八字节，就无法读入消息的总长
        if (rcvbuflen < 8) {
            readlen = 8 - rcvbuflen;
        // 能够读入完整数据信息
        } else {
            hdr = (clusterMsg*) link->rcvbuf;
            // 如果是8个字节
            if (rcvbuflen == 8) {
                // 如果前四个字节不是"RCmb"签名，释放连接
                if (memcmp(hdr->sig,"RCmb",4) != 0 ||
                    ntohl(hdr->totlen) < CLUSTERMSG_MIN_LEN)
                {
                    serverLog(LL_WARNING,
                        "Bad message length or signature received "
                        "from Cluster bus.");
                    handleLinkIOError(link);
                    return;
                }
            }
            // 记录已经读入的内容长度
            readlen = ntohl(hdr->totlen) - rcvbuflen;
            if (readlen > sizeof(buf)) readlen = sizeof(buf);
        }
        // 从fd中读数据
        nread = read(fd,buf,readlen);
        // 没有数据可读
        if (nread == -1 && errno == EAGAIN) return; /* No more data ready. */
        // 读错误，释放连接
        if (nread <= 0) {
            serverLog(LL_DEBUG,"I/O error reading from node link: %s",
                (nread == 0) ? "connection closed" : strerror(errno));
            handleLinkIOError(link);
            return;
        } else {
            // 将读到的数据追加到连接对象的接收缓冲区中
            link->rcvbuf = sdscatlen(link->rcvbuf,buf,nread);
            hdr = (clusterMsg*) link->rcvbuf;
            rcvbuflen += nread;
        }
        // 检查接收的数据是否完整
        if (rcvbuflen >= 8 && rcvbuflen == ntohl(hdr->totlen)) {
            // 如果读到的数据有效，处理读到接收缓冲区的数据
            if (clusterProcessPacket(link)) {
                // 处理成功，则设置新的空的接收缓冲区
                sdsfree(link->rcvbuf);
                link->rcvbuf = sdsempty();
            } else {
                return; /* Linkno longer valid. */
            }
        }
    }
}
```

之前在介绍`clusterLink`对象时，每个连接对象都有一个`link->rcvbuf`接收缓冲区和`link->sndbuf`发送缓冲区，因此这个函数就是从`fd`将数据读到`link`的接收缓冲区，然后进行是否读完整的判断，如果完整的读完数据，就调用`clusterProcessPacket()`函数来处理读到的数据，这里会处理`MEET`消息。该函数是一个通用的处理函数，因此能够处理各种类型的消息，所列只列出处理`MEET`消息的重要部分：

```java
    // 从集群中查找sender节点
    sender = clusterLookupNode(hdr->sender);
    // 初始处理PING和MEET请求，用PONG作为回复
    if (type == CLUSTERMSG_TYPE_PING || type == CLUSTERMSG_TYPE_MEET) {
        serverLog(LL_DEBUG,"Ping packet received: %p", (void*)link->node);
        // 我们使用传入的MEET消息来设置当前myself节点的地址，因为只有其他集群中的节点在握手的时会发送MEET消息，当有节点加入集群时，或者如果我们改变地址，这些节点将使用我们公开的地址来连接我们，所以在集群中，通过套接字来获取地址是一个简单的方法去发现或更新我们自己的地址，而不是在配置中的硬设置
        // 但是，如果我们根本没有地址，即使使用正常的PING数据包，我们也会更新该地址。 如果是错误的，那么会被MEET修改
        // 如果是MEET消息
        // 或者是其他消息但是当前集群节点的IP为空
        if (type == CLUSTERMSG_TYPE_MEET || myself->ip[0] == '\0') {
            char ip[NET_IP_STR_LEN];
            // 可以根据fd来获取ip，并设置myself节点的IP
            if (anetSockName(link->fd,ip,sizeof(ip),NULL) != -1 &&
                strcmp(ip,myself->ip))
            {
                memcpy(myself->ip,ip,NET_IP_STR_LEN);
                serverLog(LL_WARNING,"IP address for this node updated to %s",
                    myself->ip);
                clusterDoBeforeSleep(CLUSTER_TODO_SAVE_CONFIG);
            }
        }
        // 如果当前sender节点是一个新的节点，并且消息是MEET消息类型，那么将这个节点添加到集群中
        // 当前该节点的flags、slaveof等等都没有设置，当从其他节点接收到PONG时可以从中获取到信息
        if (!sender && type == CLUSTERMSG_TYPE_MEET) {
            clusterNode *node;
            // 创建一个处于握手状态的节点
            node = createClusterNode(NULL,CLUSTER_NODE_HANDSHAKE);
            // 设置ip和port
            nodeIp2String(node->ip,link);
            node->port = ntohs(hdr->port);
            // 添加到集群中
            clusterAddNode(node);
            clusterDoBeforeSleep(CLUSTER_TODO_SAVE_CONFIG);
        }
        // 如果是从一个未知的节点发送过来MEET包，处理流言信息
        if (!sender && type == CLUSTERMSG_TYPE_MEET)
            // 处理流言中的 PING or PONG 数据包
            clusterProcessGossipSection(hdr,link);
        /* Anyway reply with a PONG */
        // 回复一个PONG消息
        clusterSendPing(link,CLUSTERMSG_TYPE_PONG);
    }
```

在该函数中，首先先会对消息中的签名、版本、消息总大小，消息中包含的节点信息数量等等都进行判断，确保该消息是一个合法的消息，然后就计算消息的总长度，来判断接收到的消息和读到的消息是否一致完整。

**现在，再次强调一遍，当前是以目标节点的视角处理MEET消息。**

目标节点调用`clusterLookupNode()`函数在目标节点视角中的集群查找`MEET`消息的发送节点`hdr->sender`，该节点就是`myself`节点，由于这是第一次两个节点之间的握手，那么`myself`节点一定在目标节点视角中的集群是找不到的，所以`sender`变量为`NULL`。

然后就进入`if`条件判断，首先目标节点会根据`MEET`消息来获取自己的地址并更新自己的地址，因为如果通过从配置文件来设置地址，当节点重新上线，地址就有可能改变，但是配置文件中却没有修改，所用通过套接字获取地址来更新节点地址是一种非常好的办法。

然后继续执行第二个`if`中的代码，第一次`MEET`消息，而且`sender`发送该消息的节点并不存在目标节点视角中的集群，所以会为发送消息的`myself`节点创建一个处于握手状态的节点，并且，将该节点加入到目标节点视角中的集群。这样一来，目标节点就知道了`myself`节点的存在。

最后就是调用`clusterSendPing()`函数，指定回复一个`PONG`消息给`myself`节点。

##### 3.2.3 myself节点处理 PONG 消息回复 PING 消息

`myself`在发送消息`MEET`消息之前，就已经为监听`fd`的可读消息，当目标节点处理完`MEET`消息并回复`PONG`消息之后，触发`myself`节点的可读事件，调用`clusterReadHandler()`函数来处理目标节点发送来的`PONG`消息。

这次是以`myself`节点的视角来分析处理`PONG`消息。

`clusterReadHandler()`函数就是目标节点第一次接收`myself`节点发送`MEET`消息的函数，底层是`read()`函数来将套接字中的数据读取到`link->rcvbuf`接收缓冲区中，代码在`标题3.2.2`。它最后还是调用`clusterProcessPacket()`函数来处理`PONG`消息。

但是这次处理代码的部分不同，因为`myself`节点视角中的集群可以找到目标节点，也就是说，`myself`节点已经“认识”了目标节点。

```java
    if (type == CLUSTERMSG_TYPE_PING || type == CLUSTERMSG_TYPE_PONG ||
        type == CLUSTERMSG_TYPE_MEET)
    {
        serverLog(LL_DEBUG,"%s packet received: %p",
            type == CLUSTERMSG_TYPE_PING ? "ping" : "pong",
            (void*)link->node);
        // 如果关联该连接的节点存在
        if (link->node) {
            // 如果关联该连接的节点处于握手状态
            if (nodeInHandshake(link->node)) {
                // sender节点存在，用该新的连接地址更新sender节点的地址
                if (sender) {
                    serverLog(LL_VERBOSE,
                        "Handshake: we already know node %.40s, "
                        "updating the address if needed.", sender->name);
                    if (nodeUpdateAddressIfNeeded(sender,link,ntohs(hdr->port)))
                    {
                        clusterDoBeforeSleep(CLUSTER_TODO_SAVE_CONFIG|
                                             CLUSTER_TODO_UPDATE_STATE);
                    }
                    // 释放关联该连接的节点
                    clusterDelNode(link->node);
                    return 0;
                }
                // 将关联该连接的节点的名字用sender的名字替代
                clusterRenameNode(link->node, hdr->sender);
                serverLog(LL_DEBUG,"Handshake with node %.40s completed.",
                    link->node->name);
                // 取消握手状态，设置节点的角色
                link->node->flags &= ~CLUSTER_NODE_HANDSHAKE;
                link->node->flags |= flags&(CLUSTER_NODE_MASTER|CLUSTER_NODE_SLAVE);
                clusterDoBeforeSleep(CLUSTER_TODO_SAVE_CONFIG);
            // 如果sender的地址和关联该连接的节点的地址不相同
            } else if (memcmp(link->node->name,hdr->sender,
                        CLUSTER_NAMELEN) != 0)
            {
                serverLog(LL_DEBUG,"PONG contains mismatching sender ID. About node %.40s added %d ms ago, having flags %d",
                    link->node->name,
                    (int)(mstime()-(link->node->ctime)),
                    link->node->flags);
                // 设置NOADDR标识，情况关联连接节点的地址
                link->node->flags |= CLUSTER_NODE_NOADDR;
                link->node->ip[0] = '\0';
                link->node->port = 0;
                // 释放连接对象
                freeClusterLink(link);
                clusterDoBeforeSleep(CLUSTER_TODO_SAVE_CONFIG);
                return 0;
            }
        }
        // 关联该连接的节点存在，且消息类型为PONG
        if (link->node && type == CLUSTERMSG_TYPE_PONG) {
            // 更新接收到PONG的时间
            link->node->pong_received = mstime();
            // 清零最近一次发送PING的时间戳
            link->node->ping_sent = 0;
            // 接收到PONG回复，可以删除PFAIL（疑似下线）标识
            // FAIL标识能否删除，需要clearNodeFailureIfNeeded()来决定
            // 如果关联该连接的节点疑似下线
            if (nodeTimedOut(link->node)) {
                // 取消PFAIL标识
                link->node->flags &= ~CLUSTER_NODE_PFAIL;
                clusterDoBeforeSleep(CLUSTER_TODO_SAVE_CONFIG|
                                     CLUSTER_TODO_UPDATE_STATE);
            // 如果关联该连接的节点已经被判断为下线
            } else if (nodeFailed(link->node)) {
                // 如果一个节点被标识为FAIL，需要检查是否取消该节点的FAIL标识，因为该节点在一定时间内重新上线了
                clearNodeFailureIfNeeded(link->node);
            }
        }
    }
```

和之前处理`MEET`消息一样，首先先会对消息中的签名、版本、消息总大小，消息中包含的节点信息数量等等都进行判断，确保该消息是一个合法的消息，然后就计算消息的总长度，来判断接收到的消息和读到的消息是否一致完整。然后处理上述部分的代码。

由于`myself`节点已经“认识”目标节点，因此`myself`节点在发送`MEET`消息时已经为集群（`myself`节点视角）中的目标节点设置了连接对象，因此会执行判断连接对象是否存在的代码`if (nodeInHandshake(link->node))`，并且在`myself`节点发送完`MEET`消息后，只取消了目标节点的`CLUSTER_NODE_MEET`标识，保留了`CLUSTER_NODE_HANDSHAKE`标识，因此会执行`if (sender)`判断。

目标节点发送过来的`PONG`消息，在消息包的头部会包含`sender`发送节点的信息，但是名字对不上号，这是因为`myself`节点创建目标节点加入集群的时候，随机给他起的名字，因为`myself`节点当时也不知道目标节点的名字，所以在集群中找不到`sender`的名字，因此这个判断会失败，调用`clusterRenameNode()`函数把它的名字改过来，这样`myself`节点就真正的认识了目标节点，重新认识。之后会将目标节点的`CLUSTER_NODE_HANDSHAKE`状态取消，并且设置它的角色状态。

然后就是执行`if (link->node && type == CLUSTERMSG_TYPE_PONG)`判断，更新接收`PONG`的时间戳，清零发送`PING`的时间戳，根据接收`PONG`的时间等信息判断目标节点是否下线，如果下线要进行故障转移等操作。

之后`myself`节点并不会立即向目标节点发送`PING`消息，而是要等待下一次时间事件的发生，在`clusterCron()`函数中，每次执行都需要对集群中所有节点进行故障检测和主从切换等等操作，因此在遍历节点时，会处理以下一种情况：

```java
    while((de = dictNext(di)) != NULL) {
        if (node->flags &
            (CLUSTER_NODE_MYSELF|CLUSTER_NODE_NOADDR|CLUSTER_NODE_HANDSHAKE))
                continue;
        if (node->link && node->ping_sent == 0 &&
            (now - node->pong_received) > server.cluster_node_timeout/2)
        {
            // 给node节点发送一个PING消息
            clusterSendPing(node->link, CLUSTERMSG_TYPE_PING);
            continue;
        }
    }
```

首先跳过操作`myself`节点和处于握手状态的节点，在`myself`节点重新认识目标节点后，就将目标节点的握手状态取消了，因此会对目标节点做下面的判断操作。

当`myself`节点接收到`PONG`就会将目标节点`node->ping_sent`设置为`0`，表示目标节点还没有发送过`PING`消息，因此会发送`PING`消息给目标节点。

当发送了这个`PING`消息之后，节点之间的握手操作就完成了。之后每隔`1s`都会发送`PING`包，来进行故障检测等工作。

##### 3.2.4 Gossip协议

[Redis Cluster文件详细注释](https://github.com/menwengit/redis_source_annotation/blob/master/cluster.c)

搭建`Redis Cluster`时，首先通过`CLUSTER MEET`命令将所有的节点加入到一个集群中，但是并没有在所有节点两两之间都执行`CLUSTER MEET`命令，那么因为节点之间使用`Gossip`协议进行工作。

`Gossip` 翻译过来就是流言，类似与病毒传播一样，只要一个人感染，如果时间足够，那么和被感染的人在一起的所有人都会被感染，因此随着时间推移，集群内的所有节点都会互相知道对方的存在。

> 关于Gossip介绍可以参考：Gossip 算法

在`Redis`中，节点信息是如何传播的呢？答案是通过发送`PING`或`PONG`消息时，会包含节点信息，然后进行传播的。

我们先介绍一下`Redis Cluster`中，消息是如何抽象的。一个消息对象可以是`PING`、`PONG`、`MEET`，也可以是`UPDATE`、`PUBLISH`、`FAIL`等等消息。他们都是`clusterMsg`类型的结构，该类型主要由消息包头部和消息数据组成。

- **消息包头部**包含签名、消息总大小、版本和发送消息节点的信息。
- **消息数据**则是一个联合体union clusterMsgData，联合体中又有不同的结构体来构建不同的消息。

`PING`、`PONG`、`MEET`属于一类，是`clusterMsgDataGossip`类型的数组，可以存放多个节点的信息，该结构如下：

```java
typedef struct {
    // 节点名字
    char nodename[CLUSTER_NAMELEN];
    // 最近一次发送PING的时间戳
    uint32_t ping_sent;
    // 最近一次接收PONG的时间戳
    uint32_t pong_received;
    // 节点的IP地址
    char ip[NET_IP_STR_LEN];  /* IP address last time it was seen */
    // 节点的端口号
    uint16_t port;              /* port last time it was seen */
    // 节点的标识
    uint16_t flags;             /* node->flags copy */
    // 未使用
    uint16_t notused1;          /* Some room for future improvements. */
    uint32_t notused2;
} clusterMsgDataGossip;
```

在`clusterSendPing()`函数中，首先就是会将随机选择的节点的信息加入到消息中。代码如下：

```java
void clusterSendPing(clusterLink*link, int type) {
    unsigned char *buf;
    clusterMsg *hdr;
    int gossipcount = 0; /* Number of gossip sections added so far. */
    int wanted; /* Number of gossip sections we want to append if possible. */
    int totlen; /* Total packet length. */
    // freshnodes 的值是除了当前myself节点和发送消息的两个节点之外，集群中的所有节点
    // freshnodes 表示的意思是gossip协议中可以包含的有关节点信息的最大个数
    int freshnodes = dictSize(server.cluster->nodes)-2;
    // wanted 的值是集群节点的十分之一向下取整，并且最小等于3
    // wanted 表示的意思是gossip中要包含的其他节点信息个数
    wanted = floor(dictSize(server.cluster->nodes)/10);
    if (wanted < 3) wanted = 3;
    // 因此 wanted 最多等于 freshnodes。
    if (wanted > freshnodes) wanted = freshnodes;
    // 计算分配消息的最大空间
    totlen = sizeof(clusterMsg)-sizeof(union clusterMsgData);
    totlen += (sizeof(clusterMsgDataGossip)*wanted);
    // 消息的总长最少为一个消息结构的大小
    if (totlen < (int)sizeof(clusterMsg)) totlen = sizeof(clusterMsg);
    // 分配空间
    buf = zcalloc(totlen);
    hdr = (clusterMsg*) buf;
    // 设置发送PING命令的时间
    if (link->node && type == CLUSTERMSG_TYPE_PING)
        link->node->ping_sent = mstime();
    // 构建消息的头部
    clusterBuildMessageHdr(hdr,type);
    int maxiterations = wanted*3;
    // 构建消息内容
    while(freshnodes > 0 && gossipcount < wanted && maxiterations--) {
        // 随机选择一个集群节点
        dictEntry *de = dictGetRandomKey(server.cluster->nodes);
        clusterNode *this = dictGetVal(de);
        clusterMsgDataGossip *gossip;
        int j;
        // 1. 跳过当前节点，不选myself节点
        if (this == myself) continue;
        // 2. 偏爱选择处于下线状态或疑似下线状态的节点
        if (maxiterations > wanted*2 &&
            !(this->flags & (CLUSTER_NODE_PFAIL|CLUSTER_NODE_FAIL)))
            continue;
        // 以下节点不能作为被选中的节点：
        /*
            1. 处于握手状态的节点
            2. 带有NOADDR标识的节点
            3. 因为不处理任何槽而断开连接的节点
        */
        if (this->flags & (CLUSTER_NODE_HANDSHAKE|CLUSTER_NODE_NOADDR) ||
            (this->link == NULL && this->numslots == 0))
        {
            freshnodes--; /* Tecnically not correct, but saves CPU. */
            continue;
        }
        // 如果已经在gossip的消息中添加过了当前节点，则退出循环
        for (j = 0; j < gossipcount; j++) {
            if (memcmp(hdr->data.ping.gossip[j].nodename,this->name,
                    CLUSTER_NAMELEN) == 0) break;
        }
        // j 一定 == gossipcount
        if (j != gossipcount) continue;
        /* Add it */
        // 这个节点满足条件，则将其添加到gossip消息中
        freshnodes--;
        // 指向添加该节点的那个空间
        gossip = &(hdr->data.ping.gossip[gossipcount]);
        // 添加名字
        memcpy(gossip->nodename,this->name,CLUSTER_NAMELEN);
        // 记录发送PING的时间
        gossip->ping_sent = htonl(this->ping_sent);
        // 接收到PING回复的时间
        gossip->pong_received = htonl(this->pong_received);
        // 设置该节点的IP和port
        memcpy(gossip->ip,this->ip,sizeof(this->ip));
        gossip->port = htons(this->port);
        // 记录标识
        gossip->flags = htons(this->flags);
        gossip->notused1 = 0;
        gossip->notused2 = 0;
        // 已经添加到gossip消息的节点数加1
        gossipcount++;
    }
    // 计算消息的总长度
    totlen = sizeof(clusterMsg)-sizeof(union clusterMsgData);
    totlen += (sizeof(clusterMsgDataGossip)*gossipcount);
    // 记录消息节点的数量到包头
    hdr->count = htons(gossipcount);
    // 记录消息节点的总长到包头
    hdr->totlen = htonl(totlen);
    // 发送消息
    clusterSendMessage(link,buf,totlen);
    zfree(buf);
}
```

重点关注这几个变量：

- freshnodes
- `int freshnodes = dictSize(server.cluster->nodes)-2;`
- `freshnodes`的值是除了当前myself节点和发送消息的两个节点之外，集群中的所有节点。
- `freshnodes` 表示的意思是gossip协议中可以包含的有关节点信息的最大个数
- wanted
- `wanted = floor(dictSize(server.cluster->nodes)/10);`
- `wanted` 的值是集群节点的十分之一向下取整，并且最小等于3。
- `wanted` 表示的意思是`gossip`中要包含的其他节点信息个数。

`Gossip`协议包含的节点信息个数是`wanted`个，`wanted` 的值是集群节点的十分之一向下取整，并且最小等于3。为什么选择**十分之一**，这是因为`Redis Cluster`中计算故障转移超时时间是`server.cluster_node_timeout*2`，因此如果有节点下线，就能够收到大部分集群节点发送来的下线报告。

**十分之一的由来**：如果有`N`个主节点，那么`wanted`就是`N/10`，我们认为，在一个`node_timeout`的时间内，我们会接收到任意一个节点的4个消息包，因为，发送一个消息包，最慢被接收也不过`node_timeout/2`的时间，如果超过这个时间，那么接收回复的消息包就会超时，所以一个`node_timeout`时间内，当前节点会发送两个`PING`包，同理，接收当前节点的`PING`包，也会发送两个`PING`包给当前节点，并且会回复两个`PONG`包，这样一来，在一个`node_timeout`时间内，当前节点就会接收到4个包。

但是`Redis Cluster`中计算故障转移超时时间是`server.cluster_node_timeout*2`，是两倍的`node_timeout`时间，那么当前节点会接收到8个消息包。

因为`N`个主节点，那么`wanted`就是`N/10`，所以收到集群下线报告的概率就是`8*N/10`，也就是`80％`，这样就收到了大部分集群节点发送来的下线报告。

然后计算消息的总的大小，也就是`totlen`变量，消息包头部加上`wanted`个节点信息。

为消息分配空间，并调用`clusterBuildMessageHdr()`函数来构建消息包头部，将发送节点的信息填充进去。

接着使用`while`循环，选择`wanted`个集群节点，选择节点有一下几个特点：

- 当然不会选择myself节点，因为，在包头中已经包含了myself节点也就是发送节点的信息。
- 偏爱选择处于下线状态或疑似下线状态的节点，这样有利于进行故障检测。
- 不选，处于握手状态或没有地址状态的节点，还有就是因为不负责任何槽而断开连接的节点。

如果满足了上述条件，就会将节点的信息加入到`gossip`中，如果节点不够最少的3个，那么重复选择时会提前跳出循环。

最后，更新一下消息的总长度，然后调用`clusterSendMessage()`函数发送消息。

通过`Gossip`协议，每次能够将一些节点信息发送给目标节点，而每个节点都这么干，只要时间足够，理论上集群中所有的节点都会互相认识。

#### 3.3 分配槽位

`Redis Cluster`采用槽分区，所有的键根据哈希函数映射到`0 ～ 16383`，计算公式：`slot = CRC16(key)&16383`。每一个节点负责维护一部分槽位以及槽位所映射的键值数据。

当将所有节点组成集群后，还不能工作，因为集群的节点还没有分配槽位（slot）。

分配槽位的命令`cluster addslots`，假如我们为`6379`端口的`myself`节点指定`{0..5461}`的槽位，命令如下：

```java
redis-cli -h 127.0.0.1 -p 6379 cluster addslots {
    0..5461}
```

[Redis Cluster文件详细注释](https://github.com/menwengit/redis_source_annotation/blob/master/cluster.c)

##### 3.3.1 槽位分配信息管理

就如上面为`6379`端口的`myself`节点指定`{0..5461}`的槽位，在`clusterNode`中，定义了该节点负责的槽位：

```java
typedef struct clusterNode {
    // 节点的槽位图
    unsigned char slots[CLUSTER_SLOTS/8]; /* slots handled by this node */
    // 当前节点复制槽的数量
    int numslots;   /* Number of slots handled by this node */
} clusterNode;
```

因此，`6379`端口的`myself`节点所负责的槽，如图所示：如果节点负责该槽，那么设置为1，否则设置为0

每个节点会维护自己所负责的槽位的信息。那么在管理集群状态`clusterState`的结构中，也有对应的管理槽位的信息：

```java
typedef struct clusterState {
    // 导出槽数据到目标节点，该数组记录这些节点
    clusterNode *migrating_slots_to[CLUSTER_SLOTS];
    // 导入槽数据到目标节点，该数组记录这些节点
    clusterNode *importing_slots_from[CLUSTER_SLOTS];
    // 槽和负责槽节点的映射
    clusterNode *slots[CLUSTER_SLOTS];
    // 槽映射到键的跳跃表
    zskiplist *slots_to_keys;
} clusterState;
```

- migrating_slots_to是一个数组，用于重新分片时保存：从当前节点**导出**的槽位的到负责该槽位的节点的映射关系。
- importing_slots_from是一个数组，用于重新分片时保存：往当前节点**导入**的槽位的到负责该槽位的节点的映射关系。
- slots是一个数组，保存集群中所有主节点和其负责的槽位的映射关系。
- slots_to_keys是一个跳跃表，用于CLUSTER GETKEYSINSLOT命令可以返回多个属于槽位的键，通过遍历跳跃表实现。

##### 3.3.2 分配槽位剖析

由客户端发起命`cluster addslots  [slot ...]`

当节点接收到客户端的`cluster addslots`命令后会调用对应的函数来处理命令，该命令的执行函数是`clusterCommand()`函数，该函数能够处理所有的`cluster`命令，因此我们列出处理`addslots`选项的代码：

```java
    if ((!strcasecmp(c->argv[1]->ptr,"addslots") ||
               !strcasecmp(c->argv[1]->ptr,"delslots")) && c->argc >= 3)
    {
        int j, slot;
        unsigned char *slots = zmalloc(CLUSTER_SLOTS);
        // 删除操作
        int del = !strcasecmp(c->argv[1]->ptr,"delslots");
        memset(slots,0,CLUSTER_SLOTS);
        // 遍历所有指定的槽
        for (j = 2; j < c->argc; j++) {
            // 获取槽位的位置
            if ((slot = getSlotOrReply(c,c->argv[j])) == -1) {
                zfree(slots);
                return;
            }
            // 如果是删除操作，但是槽没有指定负责的节点，回复错误信息
            if (del && server.cluster->slots[slot] == NULL) {
                addReplyErrorFormat(c,"Slot %d is already unassigned", slot);
                zfree(slots);
                return;
            // 如果是添加操作，但是槽已经指定负责的节点，回复错误信息
            } else if (!del && server.cluster->slots[slot]) {
                addReplyErrorFormat(c,"Slot %d is already busy", slot);
                zfree(slots);
                return;
            }
            // 如果某个槽已经指定过多次了（在参数中指定了多次），那么回复错误信息
            if (slots[slot]++ == 1) {
                addReplyErrorFormat(c,"Slot %d specified multiple times",
                    (int)slot);
                zfree(slots);
                return;
            }
        }
        // 上个循环保证了指定的槽的可以处理
        for (j = 0; j < CLUSTER_SLOTS; j++) {
            // 如果当前槽未指定
            if (slots[j]) {
                int retval;
                // 如果这个槽被设置为导入状态，那么取消该状态
                if (server.cluster->importing_slots_from[j])
                    server.cluster->importing_slots_from[j] = NULL;
                // 执行删除或添加操作
                retval = del ? clusterDelSlot(j) :
                               clusterAddSlot(myself,j);
                serverAssertWithInfo(c,NULL,retval == C_OK);
            }
        }
        zfree(slots);
        // 更新集群状态和保存配置
        clusterDoBeforeSleep(CLUSTER_TODO_UPDATE_STATE|CLUSTER_TODO_SAVE_CONFIG);
        addReply(c,shared.ok);
   }
```

首先判断当前操作是删除还是添加。

其次判断指定要加入的槽位值是否合法，符合以下条件：

- 如果是删除操作，但是槽位没有指定负责的节点，回复错误信息。
- 如果是添加操作，但是槽位已经指定负责的节点，回复错误信息。
- 如果某个槽位值已经指定过多次了（在参数中指定了多次），那么回复错误信息。

最后遍历所有参数中指定的槽位值，调用`clusterAddSlot()`将槽位指派给`myself`节点。这个函数比较简单，代码如下：

```java
int clusterAddSlot(clusterNode *n, int slot) {
    // 如果已经指定有节点，则返回C_ERR
    if (server.cluster->slots[slot]) return C_ERR;
    // 设置该槽被指定
    clusterNodeSetSlotBit(n,slot);
    // 设置负责该槽的节点n
    server.cluster->slots[slot] = n;
    return C_OK;
}
```

`clusterNodeSetSlotBit()`会将`myself`节点槽位图中对应参数指定的槽值的那些位，设置为1，表示这些槽位由`myself`节点负责。源码如下：

```java
int clusterNodeSetSlotBit(clusterNode *n, int slot) {
    // 查看slot槽位是否被设置
    int old = bitmapTestBit(n->slots,slot);
    // 将slot槽位设置为1
    bitmapSetBit(n->slots,slot);
    // 如果之前没有被设置
    if (!old) {
        // 那么要更新n节点负责槽的个数
        n->numslots++;
        // 如果主节点是第一次指定槽，即使它没有从节点，也要设置MIGRATE_TO标识
        // 当且仅当，至少有一个其他的主节点有从节点时，主节点就是有效的迁移目标
        if (n->numslots == 1 && clusterMastersHaveSlaves())
            // 设置节点迁移的标识，表示该节点可以迁移
            n->flags |= CLUSTER_NODE_MIGRATE_TO;
    }
    return old;
}
```

##### 3.3.3 广播节点的槽位信息

[Redis Cluster文件详细注释](https://github.com/menwengit/redis_source_annotation/blob/master/cluster.c)

每个节点除了保存自己负责槽位的信息还要维护自己节点视角中，集群中关于槽位分配的全部信息`server.cluster->slots`，因此，需要获取每个主节点负责槽位的信息，这是通过发送消息实现的。

在调用`clusterBuildMessageHdr()`函数构建消息包的头部时，会将发送节点的槽位信息添加进入。

在调用`clusterProcessPacket()`函数处理消息包时，会根据消息包的信息，如果出现槽位分配信息不匹配的情况，会更新当前节点视角的槽位分配的信息。该函数的处理这种情况的代码如下：

```java
        sender = clusterLookupNode(hdr->sender);        
        clusterNode *sender_master = NULL; /* Sender or its master if slave. */
        int dirty_slots = 0; /* Sender claimed slots don't match my view? */
        if (sender) {
            // 如果sender是从节点，那么获取其主节点信息
            // 如果sender是主节点，那么获取sender的信息
            sender_master = nodeIsMaster(sender) ? sender : sender->slaveof;
            if (sender_master) {
                // sender发送的槽信息和主节点的槽信息是否匹配
                dirty_slots = memcmp(sender_master->slots,
                        hdr->myslots,sizeof(hdr->myslots)) != 0;
            }
        }
        // 1. 如果sender是主节点，但是槽信息出现不匹配现象
        if (sender && nodeIsMaster(sender) && dirty_slots)
            // 检查当前节点对sender的槽信息，并且进行更新
            clusterUpdateSlotsConfigWith(sender,senderConfigEpoch,hdr->myslots);
```

`sender`变量是根据消息包中提供的发送节点在`myself`节点视角的集群中查找的节点。因此发送节点负责了一些槽位之后，将这些槽位信息通过发送包发送给`myself`节点，在`myself`节点视角的集群中查找的`sender`节点则是没有设置关于发送节点的槽位信息。所以`dirty_slots`被赋值为1，表示出现了槽位信息不匹配的情况。最终会调用`clusterUpdateSlotsConfigWith()`函数更新`myself`节点视角中，集群关于发送节点的槽位信息。该函数代码如下：

```java
void clusterUpdateSlotsConfigWith(clusterNode *sender, uint64_t senderConfigEpoch, unsigned char *slots) {
    int j;
    clusterNode *curmaster, *newmaster = NULL;
    uint16_t dirty_slots[CLUSTER_SLOTS];
    int dirty_slots_count = 0;
    // 如果当前节点是主节点，那么获取当前节点
    // 如果当前节点是从节点，那么获取当前从节点所从属的主节点
    curmaster = nodeIsMaster(myself) ? myself : myself->slaveof;
    // 如果发送消息的节点就是本节点，则直接返回
    if (sender == myself) {
        serverLog(LL_WARNING,"Discarding UPDATE message about myself.");
        return;
    }
    // 遍历所有槽
    for (j = 0; j < CLUSTER_SLOTS; j++) {
        // 如果当前槽已经被分配
        if (bitmapTestBit(slots,j)) {
            // 如果当前槽是sender负责的，那么跳过当前槽
            if (server.cluster->slots[j] == sender) continue;
            // 如果当前槽处于导入状态，它应该只能通过redis-trib 被手动修改，所以跳过该槽
            if (server.cluster->importing_slots_from[j]) continue;
            // 将槽重新绑定到新的节点，如果满足以下条件
            /*
                1. 该槽没有被指定或者新的节点声称它有一个更大的配置纪元
                2. 当前没有导入该槽
            */
            if (server.cluster->slots[j] == NULL ||
                server.cluster->slots[j]->configEpoch < senderConfigEpoch)
            {
                // 如果当前槽被当前节点所负责，而且槽中有数据，表示该槽发生冲突
                if (server.cluster->slots[j] == myself &&
                    countKeysInSlot(j) &&
                    sender != myself)
                {
                    // 将发生冲突的槽记录到脏槽中
                    dirty_slots[dirty_slots_count] = j;
                    // 脏槽数加1
                    dirty_slots_count++;
                }
                // 如果当前槽属于当前节点的主节点，表示发生了故障转移
                if (server.cluster->slots[j] == curmaster)
                    newmaster = sender;
                // 删除当前被指定的槽
                clusterDelSlot(j);
                // 将槽分配给sender
                clusterAddSlot(sender,j);
                clusterDoBeforeSleep(CLUSTER_TODO_SAVE_CONFIG|
                                     CLUSTER_TODO_UPDATE_STATE|
                                     CLUSTER_TODO_FSYNC_CONFIG);
            }
        }
    }
    // 如果至少一个槽被重新分配，从一个节点到另一个更大配置纪元的节点，那么可能发生了：
    /*
        1. 当前节点是一个不在处理任何槽的主节点，这是应该将当前节点设置为新主节点的从节点
        2. 当前节点是一个从节点，并且当前节点的主节点不在处理任何槽，这是应该将当前节点设置为新主节点的从节点
    */
    if (newmaster && curmaster->numslots == 0) {
        serverLog(LL_WARNING,
            "Configuration change detected. Reconfiguring myself "
            "as a replica of %.40s", sender->name);
        // 将sender设置为当前节点myself的主节点
        clusterSetMaster(sender);
        clusterDoBeforeSleep(CLUSTER_TODO_SAVE_CONFIG|
                             CLUSTER_TODO_UPDATE_STATE|
                             CLUSTER_TODO_FSYNC_CONFIG);
    } else if (dirty_slots_count) {
        // 如果执行到这里，我们接收到一个删除当前我们负责槽的所有者的更新消息，但是我们仍然负责该槽，所以主节点不能被降级为从节点
        // 为了保持键和槽的关系，需要从我们丢失的槽中将键删除
        for (j = 0; j < dirty_slots_count; j++)
            // 遍历所有的脏槽，删除槽中的键-
            delKeysInSlot(dirty_slots[j]);
    }
}
```

该函数会遍历所有槽，然后处理已经被分配的槽（通过消息得知）

- 跳过已经被myself节点视角下集群中的sender节点所负责的槽位，没必要更新。
- 跳过处于myself节点视角中的集群中导入状态的槽位，因为它应该被专门的工具redis-trib修改。

更新槽位信息的两种情况：

- 如果myself节点视角下集群关于该槽没有指定负责的节点，会直接调用函数指派槽位。
- 如果发送节点的配置纪元更大，表示发送节点版本更新。这种情况需要进行两个if判断，判断是否发生了**槽位指派节点冲突和是否检测到了故障**。
- 当前槽是`myself`节点负责，并且槽中还有键，但是消息中确实发送节点负责，这样就发生了槽位指派节点冲突的情况，会将发生冲突的节点保存到`dirty_slots`数组中。
- 这种情况的处理办法是：遍历所有发生冲突的槽位，遍历`dirty_slots`数组，将发生冲突的槽位和`myself`节点解除关系，也就是从`myself`节点负责的槽位中取消负责发生冲突的槽位。因为消息中的信息的最准确的，要以消息中的信息为准。
- 当`myself`节点是从节点，并且当前槽是`myself`从节点的主节点负责，但是消息中显示该槽属于`sender`节点，这样检测到了故障。
- 这种情况的处理办法是：将`sender`节点作为`myself`从节点的新的主节点`newmaster = sender`。调用`clusterSetMaster()`函数将`sender`节点设置为`myself`从节点的新主节点。

两种情况，最后都需要调用`clusterAddSlot()`函数，将当前槽位指派给`myself`节点视角下的集群中的`sender`节点。这样`myself`节点就知道了发送节点的槽分配信息。

如果时间足够，每个主节点都会将自己负责的槽位信息告知给每一个集群中的其他节点，于是，集群中的每一个节点都会知道`16384`个槽分别指派给了集群中的哪个节点。

[Redis Cluster文件详细注释](https://github.com/menwengit/redis_source_annotation/blob/master/cluster.c)
