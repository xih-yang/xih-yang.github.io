# 14、Redis 源码解析 - Redis 哨兵机制[1] 结构与初始化
- 来源：https://ddkk.com/zhuanlan/db/redis/7/14.html
- 分类：缓存数据库
- 分组：教程目录
**sentinel(哨兵)是redis高可用的解决方案,它是一个由多个sentinel节点构成的一个分布式系统.可以监控理论上任意多个主节点以及其从服务器,而且我们在配置的时候也是非常简单,只需要指定sentinel监控的主服务器即可,不需要指定其他sentinel与从服务器,这些可以在运行后的信息交互中得出.其高可用性体现在sentinel系统监控的节点中如果某个主服务器结点宕机,sentinel系统会推选一个从服务器作为主节点,并使其他从服务器与这个刚刚升级的主服务器同步,并会在宕机的主服务器恢复后进行降级,使其成为那个升级的服务器的从服务器.**

这个过程看似简单,实则困难重重

**1、** 如何确定其他sentinel节点,配置文件中并没有指定.；

**2、** 选择哪一个从节点进行升级?；

**3、** sentinel之间如何保证数据的一致性?；

**4、** …；

接下来我们就随着源码去一一解决这些问题吧!

### 结构与初始化

#### 初始化

其实每一个哨兵节点就是一个运行在特殊模式下的redis服务器,所以一个哨兵的启动其实与一个正常服务器的启动差别不大,区别它们的标志就是去判断`server.sentinel_mode`

而`server.sentinel_mode`的判断则是由`checkForSentinelMode`决定的

```java
server.sentinel_mode = checkForSentinelMode(argc,argv);
......................
int checkForSentinelMode(int argc, char **argv) {
    int j;
    if (strstr(argv[0],"redis-sentinel") != NULL) return 1;
    for (j = 1; j < argc; j++)
        if (!strcmp(argv[j],"--sentinel")) return 1;
    return 0;
}
```

我们可以看到其实非常简单,就是两个判断条件,这也是为什么我们执行哨兵的时候可以用两种方法启动

```java
redis-sentinel sentinel_xxx.conf
redis-server sentinel_xxx.conf --sentinel
```

这个时候就可以开始我们的初始化了,与一般的redis服务器一样,都会执行`initServerConfig`这个初始化函数,这个我们就不说了.不同的是sentinel还会去执行`initSentinelConfig`和`initSentinel`这两个初始化函数来初始化.

```java
// 这个函数会用 Sentinel 所属的属性覆盖服务器默认的属性
void initSentinelConfig(void) {
    server.port = REDIS_SENTINEL_PORT;//26379
}
/* Perform the Sentinel mode initialization. */
// 以 Sentinel 模式初始化服务器
void initSentinel(void) {
    int j;
    /* Remove usual Redis commands from the command table, then just add
     * the SENTINEL command. */
    // 清空 Redis 服务器的命令表（该表用于普通模式）
    dictEmpty(server.commands,NULL);
    // 将 SENTINEL 模式所用的命令添加进命令表 
    for (j = 0; j < sizeof(sentinelcmds)/sizeof(sentinelcmds[0]); j++) {
        int retval;
        struct redisCommand *cmd = sentinelcmds+j;
        retval = dictAdd(server.commands, sdsnew(cmd->name), cmd);
        redisAssert(retval == DICT_OK);
    }
    /* Initialize various data structures. */
    /* 初始化 Sentinel 的状态 */
    // 初始化纪元 用于故障转移
    sentinel.current_epoch = 0;
    // 初始化保存主服务器信息的字典
    sentinel.masters = dictCreate(&instancesDictType,NULL);
    // 初始化 TILT 模式的相关选项
    sentinel.tilt = 0;
    sentinel.tilt_start_time = 0;
    sentinel.previous_time = mstime();
    // 初始化脚本相关选项
    sentinel.running_scripts = 0;
    sentinel.scripts_queue = listCreate();
}
//sentinel下可执行的命令
struct redisCommand sentinelcmds[] = {
    {
     "ping",pingCommand,1,"",0,NULL,0,0,0,0,0},
    {
     "sentinel",sentinelCommand,-2,"",0,NULL,0,0,0,0,0},
    {
     "subscribe",subscribeCommand,-2,"",0,NULL,0,0,0,0,0},
    {
     "unsubscribe",unsubscribeCommand,-1,"",0,NULL,0,0,0,0,0},
    {
     "psubscribe",psubscribeCommand,-2,"",0,NULL,0,0,0,0,0},
    {
     "punsubscribe",punsubscribeCommand,-1,"",0,NULL,0,0,0,0,0},
    {
     "publish",sentinelPublishCommand,3,"",0,NULL,0,0,0,0,0},
    {
     "info",sentinelInfoCommand,-1,"",0,NULL,0,0,0,0,0},
    {
     "shutdown",shutdownCommand,-1,"",0,NULL,0,0,0,0,0}
};
```

**在initSentinelConfig中我们可以看到使用26379这个新端口覆盖了原来的端口.有意思的是initSentinel,其中我们可以看到清空了命令表,并加上了一些sentinel专有的命令.我们可以看到很多在普通redis下的命令在sentinel下都不能使用**.

#### 结构

sentinel中最重要的有两个结构,`sentinelState`记录了sentinel本身的状态.`sentinelRedisInstance`则表示了此sentinel节点监控的所有的节点(主服务器,从服务器,其他sentinel节点)的所有状态与信息.

```java
struct sentinelState {
    // 当前纪元 用做故障转移
    uint64_t current_epoch;     /* Current epoch. */
    // 保存了所有被这个 sentinel 监视的主服务器
    // 字典的键是主服务器的名字
    // 字典的值则是一个指向 sentinelRedisInstance 结构的指针,可以是主服务器,从服务器或者其他sentinel节点
    dict *masters;      /* Dictionary of master sentinelRedisInstances.
                           Key is the instance name, value is the
                           sentinelRedisInstance structure pointer. */
    // 是否进入了 TILT 模式？
    int tilt;           /* Are we in TILT mode? */
    // 目前正在执行的脚本的数量
    int running_scripts;    /* Number of scripts in execution right now. */
    // 进入 TILT 模式的时间
    mstime_t tilt_start_time;   /* When TITL started. */
    // 最后一次执行时间处理器的时间
    mstime_t previous_time;     /* Last time we ran the time handler. */
    // 一个 FIFO 队列，包含了所有需要执行的用户脚本
    list *scripts_queue;    /* Queue of user scripts to execute. */
} sentinel;
```

```java
typedef struct sentinelRedisInstance {
    // 标识值，记录了实例的类型，以及该实例的当前状态 这很重要 
    // sentinel中状态转移是重点中的重点
    int flags;      /* See SRI_... defines */
    // 实例的名字
    // 主服务器的名字由用户在配置文件中设置
    // 从服务器以及 Sentinel 的名字由 Sentinel 自动设置
    // 格式为 ip:port ，例如 "127.0.0.1:26379"
    char *name;     /* Master name from the point of view of this sentinel. */
    // 实例的运行 ID
    char *runid;    /* run ID of this instance. */
    // 配置纪元，用于实现故障转移
    uint64_t config_epoch;  /* Configuration epoch. */
    // 实例的地址
    sentinelAddr *addr; /* Master host. */ //IP和端口 
    // 用于发送命令的异步连接
    redisAsyncContext *cc; /* Hiredis context for commands. */
    // 用于执行 SUBSCRIBE 命令、接收频道信息的异步连接
    // 仅在实例为主服务器时使用 用于构成sentinel集群,根据主服务器得到其他监控这个主服务器的sentinel节点
    redisAsyncContext *pc; /* Hiredis context for Pub / Sub. */
    // 已发送但尚未回复的命令数量
    int pending_commands;   /* Number of commands sent waiting for a reply. */
    // cc 连接的创建时间
    mstime_t cc_conn_time; /* cc connection time. */
    // pc 连接的创建时间
    mstime_t pc_conn_time; /* pc connection time. */
    // 最后一次从这个实例接收信息的时间
    mstime_t pc_last_activity; /* Last time we received any message. */
    // 实例最后一次返回正确的 PING 命令回复的时间
    mstime_t last_avail_time; /* Last time the instance replied to ping with
                                 a reply we consider valid. */
    // 实例最后一次发送 PING 命令的时间
    mstime_t last_ping_time;  /* Last time a pending ping was sent in the
                                 context of the current command connection
                                 with the instance. 0 if still not sent or
                                 if pong already received. */
    // 实例最后一次返回 PING 命令的时间，无论内容正确与否
    mstime_t last_pong_time;  /* Last time the instance replied to ping,
                                 whatever the reply was. That's used to check
                                 if the link is idle and must be reconnected. */
    // 最后一次向频道发送问候信息的时间
    // 只在当前实例为 sentinel 时使用
    mstime_t last_pub_time;   /* Last time we sent hello via Pub/Sub. */
    // 最后一次接收到这个 sentinel 发来的问候信息的时间
    // 只在当前实例为 sentinel 时使用
    mstime_t last_hello_time; /* Only used if SRI_SENTINEL is set. Last time
                                 we received a hello from this Sentinel
                                 via Pub/Sub. */
    // 最后一次回复 SENTINEL is-master-down-by-addr 命令的时间
    // 只在当前实例为 sentinel 时使用
    mstime_t last_master_down_reply_time; /* Time of last reply to
                                             SENTINEL is-master-down command. */
    // 实例被判断为 SDOWN 状态的时间
    mstime_t s_down_since_time; /* Subjectively down since time. */
    // 实例被判断为 ODOWN 状态的时间
    mstime_t o_down_since_time; /* Objectively down since time. */
    // SENTINEL down-after-milliseconds 选项所设定的值
    // 实例无响应多少毫秒之后才会被判断为主观下线（subjectively down）
    mstime_t down_after_period; /* Consider it down after that period. */
    // 从实例获取 INFO 命令的回复的时间
    mstime_t info_refresh;  /* Time at which we received INFO output from it. */
    /* Role and the first time we observed it.
     * This is useful in order to delay replacing what the instance reports
     * with our own configuration. We need to always wait some time in order
     * to give a chance to the leader to report the new configuration before
     * we do silly things. */
    // 实例的角色
    int role_reported;
    // 角色的更新时间
    mstime_t role_reported_time;
    // 最后一次从服务器的主服务器地址变更的时间
    mstime_t slave_conf_change_time; /* Last time slave master addr changed. */
    /* Master specific. */
    /* 主服务器实例特有的属性 -------------------------------------------------------------*/
    // 其他同样监控这个主服务器的所有 sentinel 不包含本身 
    dict *sentinels;    /* Other sentinels monitoring the same master. */
    // 如果这个实例代表的是一个主服务器
    // 那么这个字典保存着主服务器属下的从服务器
    // 字典的键是从服务器的名字，字典的值是从服务器对应的 sentinelRedisInstance 结构
    dict *slaves;       /* Slaves for this master instance. */
    // SENTINEL monitor <master-name> <IP> <port> <quorum> 选项中的 quorum 参数
    // 判断这个实例为客观下线（objectively down）所需的支持投票数量
    int quorum;         /* Number of sentinels that need to agree on failure. */
    // SENTINEL parallel-syncs <master-name> <number> 选项的值
    // 在执行故障转移操作时，可以同时对新的主服务器进行同步的从服务器数量
    int parallel_syncs; /* How many slaves to reconfigure at same time. */
    // 连接主服务器和从服务器所需的密码
    char *auth_pass;    /* Password to use for AUTH against master & slaves. */
    /* Slave specific. */
    /* 从服务器实例特有的属性 -------------------------------------------------------------*/
    // 主从服务器连接断开的时间
    mstime_t master_link_down_time; /* Slave replication link down time. */
    // 从服务器优先级
    int slave_priority; /* Slave priority according to its INFO output. */
    // 执行故障转移操作时，从服务器发送 SLAVEOF <new-master> 命令的时间
    mstime_t slave_reconf_sent_time; /* Time at which we sent SLAVE OF <new> */
    // 主服务器的实例（在本实例为从服务器时使用）
    struct sentinelRedisInstance *master; /* Master instance if it's slave. */
    // INFO 命令的回复中记录的主服务器 IP
    char *slave_master_host;    /* Master host as reported by INFO */
    // INFO 命令的回复中记录的主服务器端口号
    int slave_master_port;      /* Master port as reported by INFO */
    // INFO 命令的回复中记录的主从服务器连接状态
    int slave_master_link_status; /* Master link status as reported by INFO */
    // 从服务器的复制偏移量
    unsigned long long slave_repl_offset; /* Slave replication offset. */
    /* Failover */
    /* 故障转移相关属性 -------------------------------------------------------------------*/
    // 如果这是一个主服务器实例，那么 leader 将是负责进行故障转移的 Sentinel 的运行 ID 。
    // 如果这是一个 Sentinel 实例，那么 leader 就是被选举出来的领头 Sentinel 。
    // 这个域只在 Sentinel 实例的 flags 属性的 SRI_MASTER_DOWN 标志处于打开状态时才有效。
    char *leader;       /* If this is a master instance, this is the runid of
                           the Sentinel that should perform the failover. If
                           this is a Sentinel, this is the runid of the Sentinel
                           that this Sentinel voted as leader. */
    // 领头的纪元
    uint64_t leader_epoch; /* Epoch of the 'leader' field. */
    // 当前执行中的故障转移的纪元
    uint64_t failover_epoch; /* Epoch of the currently started failover. */
    // 故障转移操作的当前状态
    int failover_state; /* See SENTINEL_FAILOVER_STATE_* defines. */
    // 状态改变的时间
    mstime_t failover_state_change_time;
    // 最后一次进行故障迁移的时间
    mstime_t failover_start_time;   /* Last failover attempt start time. */
    // SENTINEL failover-timeout <master-name> <ms> 选项的值
    // 刷新故障迁移状态的最大时限
    mstime_t failover_timeout;      /* Max time to refresh failover state. */
    mstime_t failover_delay_logged; /* For what failover_start_time value we
                                       logged the failover delay. */
    // 指向被提升为新主服务器的从服务器的指针
    struct sentinelRedisInstance *promoted_slave; /* Promoted slave instance. */
	.......................
} sentinelRedisInstance;
```

第二个结构体可以说看的人头皮发麻,但是确实每一个都是不可缺少的.我们可以看到其中有很多记录时间的成员,这在我们平时的代码中可能出现较少,这里大量出现是为了保证分布式系统的稳定,使得任何一个实例出现问题的时候能够快速发现,从而做出补救.几乎每一个操作前都要记录时间.

接下来我们看看如果创建一个`sentinelRedisInstance`,就是使用`createsentinelRedisInstance`函数

```java
//这里根据flags判断其是一个主服务器,从服务器还是一个sentinel结点
sentinelRedisInstance *createSentinelRedisInstance(char *name, int flags, char *hostname, int port, int quorum, sentinelRedisInstance *master) {
    sentinelRedisInstance *ri;
    sentinelAddr *addr;
    dict *table = NULL;
    char slavename[128], *sdsname;
    redisAssert(flags & (SRI_MASTER|SRI_SLAVE|SRI_SENTINEL));
    redisAssert((flags & SRI_MASTER) || master != NULL);
    /* Check address validity. */
    // 保存 IP 地址和端口号到 addr
    addr = createSentinelAddr(hostname,port);
    if (addr == NULL) return NULL;
    /* For slaves and sentinel we use ip:port as name. */
    // 如果实例是从服务器或者 sentinel ，那么使用 ip:port 格式为实例设置名字
    if (flags & (SRI_SLAVE|SRI_SENTINEL)) {
        snprintf(slavename,sizeof(slavename),
            strchr(hostname,':') ? "[%s]:%d" : "%s:%d",
            hostname,port);
        name = slavename;
    }
    /* Make sure the entry is not duplicated. This may happen when the same
     * name for a master is used multiple times inside the configuration or
     * if we try to add multiple times a slave or sentinel with same ip/port
     * to a master. */
    // 配置文件中添加了重复的主服务器配置
    // 或者尝试添加一个相同 ip 或者端口号的从服务器或者 sentinel 时
    // 就可能出现重复添加同一个实例的情况
    // 为了避免这种现象，程序在添加新实例之前，需要先检查实例是否已存在
    // 只有不存在的实例会被添加
    // 选择要添加的表
    // 注意主服务会被添加到 sentinel.masters 表
    // 而从服务器和 sentinel 则会被添加到 master 所属的 slaves 表和 sentinels 表中
    if (flags & SRI_MASTER) table = sentinel.masters;
    else if (flags & SRI_SLAVE) table = master->slaves;
    else if (flags & SRI_SENTINEL) table = master->sentinels;
    sdsname = sdsnew(name);
    if (dictFind(table,sdsname)) {
        // 实例已存在，函数直接返回
        sdsfree(sdsname);
        errno = EBUSY;
        return NULL;
    }
    /* Create the instance object. */
    // 创建实例对象
    ri = zmalloc(sizeof(*ri));
    /* Note that all the instances are started in the disconnected state,
     * the event loop will take care of connecting them. */
    // 所有连接都已断线为起始状态，sentinel 会在需要时自动为它创建连接
    ri->flags = flags | SRI_DISCONNECTED; 
    ri->name = sdsname;
    ri->runid = NULL;
    ri->config_epoch = 0;
    ri->addr = addr;
	..................
    /* Add into the right table. */
    // 将实例添加到适当的表中
    dictAdd(table, ri->name, ri);
    // 返回实例
    return ri;
}
```

#### sentinelTimer

这个函数是一个时间在serverCron中调用的函数,这是sentinel的一个最重要的函数,是除了上面说的功能以外其他所有函数的集合.我们在这一篇文章中先简单的介绍下它.

```java
    run_with_period(100) {
        if (server.sentinel_mode) sentinelTimer();
    }
```

我们可以看到在serverCron中其100ms调用一次.

```java
void sentinelTimer(void) {
    // 记录本次 sentinel 调用的事件，
    // 并判断是否需要进入 TITL 模式 还会更新最后一次操作时间
    sentinelCheckTiltCondition();
    // 执行定期操作
    // 1. 先其他实例发送PING命令、分析主服务器和从服务器的INFO命令
    // 2. 向主服务器发送PUBLISH,检测其他sentinel
    // 3. 进行故障转移的全部操作
    // 4. 接收其他sentinel发来的PING和sentinel信息
    sentinelHandleDictOfRedisInstances(sentinel.masters);
    // 运行等待执行的脚本
    sentinelRunPendingScripts();
    // 清理已执行完毕的脚本，并重试出错的脚本
    sentinelCollectTerminatedScripts();
    // 杀死运行超时的脚本
    sentinelKillTimedoutScripts();
    /* We continuously change the frequency of the Redis "timer interrupt"
     * in order to desynchronize every Sentinel from every other.
     * This non-determinism avoids that Sentinels started at the same time
     * exactly continue to stay synchronized asking to be voted at the
     * same time again and again (resulting in nobody likely winning the
     * election because of split brain voting). */
     // 用一个巧妙的操作降低选举sentinel时重新选举的概率
    server.hz = REDIS_DEFAULT_HZ + rand() % REDIS_DEFAULT_HZ;
}
```
