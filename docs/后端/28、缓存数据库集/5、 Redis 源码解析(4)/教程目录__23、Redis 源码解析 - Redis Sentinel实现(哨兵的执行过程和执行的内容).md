# 23、Redis 源码解析 - Redis Sentinel实现(哨兵的执行过程和执行的内容)
- 来源：https://ddkk.com/zhuanlan/db/redis/4/23.html
- 分类：缓存数据库
- 分组：教程目录
## Redis Sentinel实现（上）

### 1. Redis Sentinel 介绍和部署

请参考[Redis Sentinel 介绍与部署](http://blog.csdn.net/men_wen/article/details/72724406)

`sentinel.c`文件详细注释：[Redis Sentinel详细注释](https://github.com/menwengit/redis_source_annotation)

本文会分为两篇分别接受`Redis Sentinel`的实现，本篇主要将`Redis`哨兵的执行过程和执行的内容。

`标题4`将会在[Redis Sentinel实现（下）](/zhuanlan/db/redis/4/24.html)中详细剖析。

### 2. Redis Sentinel 的执行过程和初始化

`Sentinel`本质上是一个运行在特殊模式下的`Redis`服务器，无论如何，都是执行服务器的`main`来启动。主函数中关于`Sentinel`启动的代码如下：

```java
int main(int argc, char **argv) {
    // 1. 检查开启哨兵模式的两种方式
    server.sentinel_mode = checkForSentinelMode(argc,argv);
    // 2. 如果已开启哨兵模式，初始化哨兵的配置
    if (server.sentinel_mode) {
        initSentinelConfig();
        initSentinel();
    }
    // 3. 载入配置文件
    loadServerConfig(configfile,options);
    // 开启哨兵模式，哨兵模式和集群模式只能开启一种
    if (!server.sentinel_mode) {
        // 在不是哨兵模式下，会载入AOF文件和RDB文件，打印内存警告，集群模式载入数据等等操作。
    } else { 
        sentinelIsRunning();
    }
}
```

以上过程可以分为四步：

- 检查是否开启哨兵模式
- 初始化哨兵的配置
- 载入配置文件
- 开启哨兵模式

#### 2.1 检查是否开启哨兵模式

在[Redis Sentinel 介绍与部署](http://blog.csdn.net/men_wen/article/details/72724406)文章中，介绍了两种开启的方法：

- redis-sentinel sentinel.conf
- redis-server sentinel.conf --sentinel

主函数中调用了`checkForSentinelMode()`函数来判断是否开启哨兵模式。

```java
int checkForSentinelMode(int argc, char **argv) {
    int j;
    if (strstr(argv[0],"redis-sentinel") != NULL) return 1;
    for (j = 1; j < argc; j++)
        if (!strcmp(argv[j],"--sentinel")) return 1;
    return 0;
}
```

如果开启了哨兵模式，就会将`server.sentinel_mode`设置为`1`。

#### 2.2 初始化哨兵的配置

在主函数中调用了两个函数`initSentinelConfig()`和`initSentinel()`，前者用来初始化`Sentinel`节点的默认配置，后者用来初始化`Sentinel`节点的状态。`sentinel.c`文件详细注释：[Redis Sentinel详细注释](https://github.com/menwengit/redis_source_annotation)

在`sentinel.c`文件中定义了一个全局变量`sentinel`，它是`struct sentinelState`类型的，用于保存当前`Sentinel`的状态。

- initSentinelConfig()，初始化哨兵节点的默认端口为26379。

```java
// 设置Sentinel的默认端口，覆盖服务器的默认属性
void initSentinelConfig(void) {
    server.port = REDIS_SENTINEL_PORT;
}
```

- initSentinel()，初始化哨兵节点的状态

```java
// 执行Sentinel模式的初始化操作
void initSentinel(void) {
    unsigned int j;
    /* Remove usual Redis commands from the command table, then just add
     * the SENTINEL command. */
    // 将服务器的命令表清空
    dictEmpty(server.commands,NULL);
    // 只添加Sentinel模式的相关命令，Sentinel模式下一共11个命令
    for (j = 0; j < sizeof(sentinelcmds)/sizeof(sentinelcmds[0]); j++) {
        int retval;
        struct redisCommand *cmd = sentinelcmds+j;
        retval = dictAdd(server.commands, sdsnew(cmd->name), cmd);
        serverAssert(retval == DICT_OK);
    }
    /* Initialize various data structures. */
    // 初始化各种Sentinel状态的数据结构
    // 当前纪元，用于实现故障转移操作
    sentinel.current_epoch = 0;
    // 监控的主节点信息的字典
    sentinel.masters = dictCreate(&instancesDictType,NULL);
    // TILT模式
    sentinel.tilt = 0;
    sentinel.tilt_start_time = 0;
    // 最后执行时间处理程序的时间
    sentinel.previous_time = mstime();
    // 正在执行的脚本数量
    sentinel.running_scripts = 0;
    // 用户脚本的队列
    sentinel.scripts_queue = listCreate();
    // Sentinel通过流言协议接收关于主服务器的ip和port
    sentinel.announce_ip = NULL;
    sentinel.announce_port = 0;
    // 故障模拟
    sentinel.simfailure_flags = SENTINEL_SIMFAILURE_NONE;
    // Sentinel的ID置为0
    memset(sentinel.myid,0,sizeof(sentinel.myid));
}
```

在哨兵模式下，只有11条命令可以使用，因此要用哨兵模式的命令表来代替Redis原来的命令表。

之后就是初始化`sentinel`的成员变量。我们重点关注这几个成员：

- **dict *masters** ：当前哨兵节点监控的主节点字典。字典的键是主节点实例的名字，字典的值是一个指针，指向一个sentinelRedisInstance类型的结构。
- **int running_scripts**： 当前正在执行的脚本的数量。
- **list *scripts_queue**：保存要执行用户脚本的队列。

#### 2.3 载入配置文件

在启动哨兵节点时，要指定一个`.conf`配置文件，配置文件可以将配置项分为两类。

> Sentinel配置说明

- sentinel monitor \ \ \ \
- 例如：`sentinel monitor mymaster 127.0.0.1 6379 2`
- 当前Sentinel节点监控 127.0.0.1:6379 这个主节点
- 2 代表判断主节点失败至少需要2个Sentinel节点节点同意
- mymaster 是主节点的别名
- sentinel xxxxxx \ xxxxxx
- 例如：`sentinel down-after-milliseconds mymaster 30000`
- 每个Sentinel节点都要定期PING命令来判断Redis数据节点和其余Sentinel节点是否可达，如果超过30000毫秒且没有回复，则判定不可达。
- 例如：`sentinel parallel-syncs mymaster 1`
- 当Sentinel节点集合对主节点故障判定达成一致时，Sentinel领导者节点会做故障转移操作，选出新的主节点，原来的从节点会向新的主节点发起复制操作，限制每次向新的主节点发起复制操作的从节点个数为1。

配置文件以这样的格式告诉哨兵节点，监控的主节点是谁，有什么样的限制条件。如果想要监控多个主节点，只需按照此格式在配置文件中多写几份。

既然配置文件都是如此，那么处理的函数也是如此处理，由于配置项很多，但是大体相似，所以我们列举处理示例的代码块：

```java
    sentinelRedisInstance *ri;
    // SENTINEL monitor选项
    if (!strcasecmp(argv[0],"monitor") && argc == 5) {
        /* monitor <name> <host> <port> <quorum> */
        int quorum = atoi(argv[4]); //获取投票数
        // 投票数必须大于等于1
        if (quorum <= 0) return "Quorum must be 1 or greater.";
        // 创建一个主节点实例，并加入到Sentinel所监控的master字典中
        if (createSentinelRedisInstance(argv[1],SRI_MASTER,argv[2],
                                        atoi(argv[3]),quorum,NULL) == NULL)
        {
            switch(errno) {
            case EBUSY: return "Duplicated master name.";
            case ENOENT: return "Can't resolve master instance hostname.";
            case EINVAL: return "Invalid port number";
            }
        }
    // sentinel down-after-milliseconds选项
    } else if (!strcasecmp(argv[0],"down-after-milliseconds") && argc == 3) {
        /* down-after-milliseconds <name> <milliseconds> */
        // 获取根据name查找主节点实例
        ri = sentinelGetMasterByName(argv[1]);
        if (!ri) return "No such master with specified name.";
        // 设置主节点实例的主观下线的判断时间
        ri->down_after_period = atoi(argv[2]);
        if (ri->down_after_period <= 0)
            return "negative or zero time parameter.";
        // 根据ri主节点的down_after_period字段的值设置所有连接该主节点的从节点和Sentinel实例的主观下线的判断时间
        sentinelPropagateDownAfterPeriod(ri);
```

载入配置文件主要使用了两个函数`createSentinelRedisInstance()`和`sentinelGetMasterByName()`。前者用来根据指定监控的主节点来创建实例，而后者则要根据名字找到对应的主节点实例来设置配置的参数。

##### 2.3.1 创建实例

调用`createSentinelRedisInstance()`函数创建被该哨兵节点所监控的主节点实例，然后将新创建的主节点实例保存到`sentinel.masters`字典中，也就是初始化时创建的字典。该函数是一个通用的函数，根据参数`flags`不同创建不同类型的实例，并且将实例保存到不同的字典中：

- SRI_MASTER：创建一个主节点实例，保存到当前哨兵节点监控的主节点字典中。
- SRI_SLAVE：创建一个从节点实例，保存到主节点实例的从节点字典中。
- SRI_SENTINE：创建一个哨兵节点实例，保存到其他监控该主节点实例的哨兵节点的字典中。

我们先列出函数的原型：

```java
sentinelRedisInstance *createSentinelRedisInstance(char *name, int flags, char *hostname, int port, int quorum, sentinelRedisInstance *master)
```

- 如果flags设置了SRI_MASTER，该实例被添加进sentinel.masters表中
- 如果flags设置了SRI_SLAVE 或者 SRI_SENTINEL，master**一定不为空**并且该实例被添加到master->`slaves或master->`sentinels中
- 如果该实例是从节点或者是哨兵节点，name参数被忽略，并且被自动设置为hostname:port

当根据`flags`能够获取实例的类型后，就会初始化一个`sentinelRedisInstance`类型的实例，添加到对应的字典中。

```java
typedef struct sentinelRedisInstance {
    // 标识值，记录了当前Redis实例的类型和状态
    int flags;      /* See SRI_... defines */
    // 实例的名字
    // 主节点的名字由用户在配置文件中设置
    // 从节点以及Sentinel节点的名字由Sentinel自动设置，格式为：ip:port
    char *name;     /* Master name from the point of view of this sentinel. */
    // 实例运行的独一无二ID
    char *runid;    /* Run ID of this instance, or unique ID if is a Sentinel.*/
    // 配置纪元，用于实现故障转移
    uint64_t config_epoch;  /* Configuration epoch. */
    // 实例地址：ip和port
    sentinelAddr *addr; /* Master host. */
    // 实例的连接，有可能是被Sentinel共享的
    instanceLink*link; /* Linkto the instance, may be shared for Sentinels. */
    // 最近一次通过 Pub/Sub 发送信息的时间
    mstime_t last_pub_time;   /* Last time we sent hello via Pub/Sub. */
    // 只有被Sentinel实例使用
    // 最近一次接收到从Sentinel发送来hello的时间
    mstime_t last_hello_time; 
    // 最近一次回复SENTINEL is-master-down的时间
    mstime_t last_master_down_reply_time; /* Time of last reply to
                                             SENTINEL is-master-down command. */
    // 实例被判断为主观下线的时间
    mstime_t s_down_since_time; /* Subjectively down since time. */
    // 实例被判断为客观下线的时间
    mstime_t o_down_since_time; /* Objectively down since time. */
    // 实例无响应多少毫秒之后被判断为主观下线
    // 由SENTINEL down-after-millisenconds配置设定
    mstime_t down_after_period; /* Consider it down after that period. */
    // 从实例获取INFO命令回复的时间
    mstime_t info_refresh;  /* Time at which we received INFO output from it. */
    // 实例的角色
    int role_reported;
    // 角色更新的时间
    mstime_t role_reported_time;
    // 最近一次从节点的主节点地址变更的时间
    mstime_t slave_conf_change_time; /* Last time slave master addr changed. */
    /* Master specific. */
    /*----------------------------------主节点特有的属性----------------------------------*/
    // 其他监控相同主节点的Sentinel
    dict *sentinels;    /* Other sentinels monitoring the same master. */
    // 如果当前实例是主节点，那么slaves保存着该主节点的所有从节点实例
    // 键是从节点命令，值是从节点服务器对应的sentinelRedisInstance
    dict *slaves;       /* Slaves for this master instance. */
    // 判定该主节点客观下线的投票数
    // 由SENTINEL monitor <master-name> <ip> <port> <quorum>配置
    unsigned int quorum;/* Number of sentinels that need to agree on failure. */
    // 在故障转移时，可以同时对新的主节点进行同步的从节点数量
    // 由sentinel parallel-syncs <master-name> <number>配置
    int parallel_syncs; /* How many slaves to reconfigure at same time. */
    // 连接主节点和从节点的认证密码
    char *auth_pass;    /* Password to use for AUTH against master & slaves. */
    /*----------------------------------从节点特有的属性----------------------------------*/
    // 从节点复制操作断开时间
    mstime_t master_link_down_time; /* Slave replication link down time. */
    // 按照INFO命令输出的从节点优先级
    int slave_priority; /* Slave priority according to its INFO output. */
    // 故障转移时，从节点发送SLAVEOF <new>命令的时间
    mstime_t slave_reconf_sent_time; /* Time at which we sent SLAVE OF <new> */
    // 如果当前实例是从节点，那么保存该从节点连接的主节点实例
    struct sentinelRedisInstance *master; /* Master instance if it's slave. */
    // INFO命令的回复中记录的主节点的IP
    char *slave_master_host;    /* Master host as reported by INFO */
    // INFO命令的回复中记录的主节点的port
    int slave_master_port;      /* Master port as reported by INFO */
    // INFO命令的回复中记录的主从服务器连接的状态
    int slave_master_link_status; /* Master link status as reported by INFO */
    // 从节点复制偏移量
    unsigned long long slave_repl_offset; /* Slave replication offset. */
    /*----------------------------------故障转移的属性----------------------------------*/
    // 如果这是一个主节点实例，那么leader保存的是执行故障转移的Sentinel的runid
    // 如果这是一个Sentinel实例，那么leader保存的是当前这个Sentinel实例选举出来的领头的runid
    char *leader; 
    // leader字段的纪元
    uint64_t leader_epoch; /* Epoch of the 'leader' field. */
    // 当前执行故障转移的纪元
    uint64_t failover_epoch; /* Epoch of the currently started failover. */
    // 故障转移操作的状态
    int failover_state; /* See SENTINEL_FAILOVER_STATE_* defines. */
    // 故障转移操作状态改变的时间
    mstime_t failover_state_change_time;
    // 最近一次故障转移尝试开始的时间
    mstime_t failover_start_time;   /* Last failover attempt start time. */
    // 更新故障转移状态的最大超时时间
    mstime_t failover_timeout;      /* Max time to refresh failover state. */
    // 记录故障转移延迟的时间
    mstime_t failover_delay_logged; 
    // 晋升为新主节点的从节点实例
    struct sentinelRedisInstance *promoted_slave; 
    // 通知admin的可执行脚本的地址，如果设置为空，则没有执行的脚本
    char *notification_script;
    // 通知配置的client的可执行脚本的地址，如果设置为空，则没有执行的脚本
    char *client_reconfig_script;
    // 缓存INFO命令的输出
    sds info; /* cached INFO output */
} sentinelRedisInstance;
```

该实例用来抽象描述一个节点，可以是主节点、从节点或者是哨兵节点。

##### 2.3.2 查找主节点

在配置文件中分的那两个部分，第一部分是创建上面给出的结构实例，另一部分则是配置其中的一部分成员。因此，第一步要根据名字在**哨兵节点的主节点字典**中找到主节点实例。

```java
sentinelRedisInstance *sentinelGetMasterByName(char *name) {
    sentinelRedisInstance *ri;
    sds sdsname = sdsnew(name);
    // 从Sentinel所监视的所有主节点中寻找名字为name的主节点，找到返回
    ri = dictFetchValue(sentinel.masters,sdsname);
    sdsfree(sdsname);
    return ri;
}
```

当找到并返回主节点实例后，就可以配置其变量了。例如：`ri->down_after_period = atoi(argv[2])`

#### 2.4 开启 Sentinel

载入完配置文件，就会调用`sentinelIsRunning()`函数开启`Sentinel`。该函数主要干了这几个事：

- 检查配置文件是否可写，因为要重写配置文件。
- 为没有runid的哨兵节点分配 ID，并重写到配置文件中，并且打印到日志中。
- 生成一个+monitor事件通知。

所以在启动一个哨兵节点时，查看日志会发现：

```java
12775:X 28 May 15:14:34.953 Sentinel ID is a4dce0267abdb89f7422c9a42960e6cb6e4
d565a
12775:X 28 May 15:14:34.953 +monitor master mymaster 127.0.0.1 6379 quorum 2
```

至此，就正式启动了哨兵节点。我们用图片的方式来描述一下一个哨兵节点监控两个主节点的情况：

### 3. Redis Sentinel 的所有操作

`Redis`哨兵的操作，都是放在时间处理器中执行。服务器在初始化时会创建时间事件，并安装执行时间事件的处理函数`serverCron()`，在该函数调用`sentinelTimer()`函数（如下代码所示）来每`100ms`执行一次哨兵的定时中断，或者叫执行哨兵的任务。`sentinel.c`文件详细注释：[Redis Sentinel详细注释](https://github.com/menwengit/redis_source_annotation)

```java
run_with_period(100) {
        if (server.sentinel_mode) sentinelTimer();
    }
```

`sentinelTimer()`函数就是`Sentinel`的主函数，他的执行过程非常清晰，我们直接给出代码：

```java
void sentinelTimer(void) {
    // 先检查Sentinel是否需要进入TITL模式，更新最近一次执行Sentinel模式的周期函数的时间
    sentinelCheckTiltCondition();
    // 对Sentinel监控的所有主节点进行递归式的执行周期性操作
    sentinelHandleDictOfRedisInstances(sentinel.masters);
    // 运行在队列中等待的脚本
    sentinelRunPendingScripts();
    // 清理已成功执行的脚本，重试执行错误的脚本
    sentinelCollectTerminatedScripts();
    // 杀死执行超时的脚本，等到下个周期在sentinelCollectTerminatedScripts()函数中重试执行
    sentinelKillTimedoutScripts();
    /* We continuously change the frequency of the Redis "timer interrupt"
     * in order to desynchronize every Sentinel from every other.
     * This non-determinism avoids that Sentinels started at the same time
     * exactly continue to stay synchronized asking to be voted at the
     * same time again and again (resulting in nobody likely winning the
     * election because of split brain voting). */
    // 我们不断改变Redis定期任务的执行频率，以便使每个Sentinel节点都不同步，这种不确定性可以避免Sentinel在同一时间开始完全继续保持同步，当被要求进行投票时，一次又一次在同一时间进行投票，因为脑裂导致有可能没有胜选者
    server.hz = CONFIG_DEFAULT_HZ + rand() % CONFIG_DEFAULT_HZ;
}
```

我们可以将哨兵的任务按顺序分为四部分：

- TILT 模式判断
- 执行周期性任务。例如：定期发送PING、hello信息等等。
- 执行脚本任务
- 脑裂

接下来，依次分析

#### 3.1 TILT 模式判断

TILT 模式是一种特殊的保护模式：当 Sentinel 发现系统有些不对劲时，Sentinel 就会进入 TILT 模式。

因为Sentinel 的时间中断器默认每秒执行 10 次，所以我们预期时间中断器的两次执行之间的间隔为 100 毫秒左右。但是出现以下情况会出现异常：

- Sentinel进程在某时被阻塞，有很多种原因，负载过大，IO任务密集，进程被信号停止等等。
- 系统时钟发送明显变化

Sentinel 的做法是（如下`sentinelCheckTiltCondition()`函数所示），记录上一次时间中断器执行时的时间，并将它和这一次时间中断器执行的时间进行对比：

- 如果两次调用时间之间的差距为负值，或者非常大（超过 2 秒钟），那么 Sentinel 进入 TILT 模式。
- 如果 Sentinel 已经进入 TILT 模式，那么 Sentinel 延迟退出 TILT 模式的时间。

```java
void sentinelCheckTiltCondition(void) {
    mstime_t now = mstime();
    // 最后一次执行Sentinel时间处理程序的时间过去了过久
    mstime_t delta = now - sentinel.previous_time;
    // 差为负数，或者大于2秒
    if (delta < 0 || delta > SENTINEL_TILT_TRIGGER) {
        // 设置Sentinel进入TILT状态
        sentinel.tilt = 1;
        // 设置进入TILT状态的开始时间
        sentinel.tilt_start_time = mstime();
        sentinelEvent(LL_WARNING,"+tilt",NULL,"#tilt mode entered");
    }
    // 设置最近一次执行Sentinel时间处理程序的时间
    sentinel.previous_time = mstime();
}
```

当Sentinel 进入 TILT 模式时，它仍然会继续监视所有目标，但是：

- 它不再执行任何操作，比如故障转移。
- 当有实例向这个 Sentinel 发送 SENTINEL is-master-down-by-addr 命令时，Sentinel 返回负值：因为这个 Sentinel 所进行的下线判断已经不再准确。

**如果 TILT 可以正常维持 30 秒钟，那么 Sentinel 退出 TILT 模式。**

#### 3.2 执行周期性任务

我们先来看看在执行周期性任务的函数`sentinelHandleDictOfRedisInstances()`

```java
void sentinelHandleDictOfRedisInstances(dict *instances) {
    dictIterator *di;
    dictEntry *de;
    sentinelRedisInstance *switch_to_promoted = NULL;
    /* There are a number of things we need to perform against every master. */
    di = dictGetIterator(instances);
    // 遍历字典中所有的实例
    while((de = dictNext(di)) != NULL) {
        sentinelRedisInstance *ri = dictGetVal(de);
        // 对指定的ri实例执行周期性操作
        sentinelHandleRedisInstance(ri);
        // 如果ri实例是主节点
        if (ri->flags & SRI_MASTER) {
            // 递归的对主节点从属的从节点执行周期性操作
            sentinelHandleDictOfRedisInstances(ri->slaves);
            // 递归的对监控主节点的Sentinel节点执行周期性操作
            sentinelHandleDictOfRedisInstances(ri->sentinels);
            // 如果ri实例处于完成故障转移操作的状态，所有从节点已经完成对新主节点的同步
            if (ri->failover_state == SENTINEL_FAILOVER_STATE_UPDATE_CONFIG) {
                // 设置主从转换的标识
                switch_to_promoted = ri;
            }
        }
    }
    // 如果主从节点发生了转换
    if (switch_to_promoted)
        // 将原来的主节点从主节点表中删除，并用晋升的主节点替代
        // 意味着已经用新晋升的主节点代替旧的主节点，包括所有从节点和旧的主节点从属当前新的主节点
        sentinelFailoverSwitchToPromotedSlave(switch_to_promoted);
    dictReleaseIterator(di);
}
```

该函数可以分为两部分：

- 递归的对当前哨兵所监控的所有主节点sentinel.masters，和所有主节点的所有从节点ri->`slaves，和所有监控该主节点的其他所有哨兵节点ri->`sentinels执行周期性操作。也就是sentinelHandleRedisInstance()函数。
- 在执行操作的过程中，可能发生主从切换的情况，因此要给所有原来主节点的从节点（除了被选为当做晋升的从节点）发送slaveof命令去复制新的主节点（晋升为主节点的从节点）。对应sentinelFailoverSwitchToPromotedSlave()函数。

由于这里的操作过多，因此先跳过，单独在`标题4`进行剖析。

#### 3.3 执行脚本任务

在`Sentinel`的定时任务分为三步，也就是`sentinelTimer()`哨兵模式主函数中的三个函数：

- sentinelRunPendingScripts()：运行在队列中等待的脚本。
- sentinelCollectTerminatedScripts()：清理已成功执行的脚本，重试执行错误的脚本。
- sentinelKillTimedoutScripts()：杀死执行超时的脚本，等到下个周期在sentinelCollectTerminatedScripts()函数中重试执行。

##### 3.3.1 准备脚本

我们先来说明脚本任务是如何加入到`sentinel.scripts_queue`中的。

首先在`Sentinel`中有两种脚本，分别是，都定义在`sentinelRedisInstance结构中`

- 通知admin的脚本。char *notification_script
- 重配置client的脚本。char *client_reconfig_script

在发生主从切换后，会调用`sentinelCallClientReconfScript()`函数，将**重配置client的脚本**放入脚本队列中。

在发生`LL_WARNING`级别的事件通知时，会调用`sentinelEvent()`函数，将**通知admin的脚本**放入脚本队列中。

然而这两个函数，都会调用最底层的`sentinelScheduleScriptExecution()`函数将脚本添加到脚本链表队列中。该函数源码如下：

```java
#define SENTINEL_SCRIPT_MAX_ARGS 16
// 将给定参数和脚本放入用户脚本队列中
void sentinelScheduleScriptExecution(char *path, ...) {
    va_list ap;
    char *argv[SENTINEL_SCRIPT_MAX_ARGS+1];
    int argc = 1;
    sentinelScriptJob *sj;
    va_start(ap, path);
    // 将参数保存到argv中
    while(argc < SENTINEL_SCRIPT_MAX_ARGS) {
        argv[argc] = va_arg(ap,char*);
        if (!argv[argc]) break;
        argv[argc] = sdsnew(argv[argc]); /* Copy the string. */
        argc++;
    }
    va_end(ap);
    // 第一个参数是脚本的路径
    argv[0] = sdsnew(path);
    // 分配脚本任务结构的空间
    sj = zmalloc(sizeof(*sj));
    sj->flags = SENTINEL_SCRIPT_NONE;           //脚本限制
    sj->retry_num = 0;                          //执行次数
    sj->argv = zmalloc(sizeof(char*)*(argc+1)); //参数列表
    sj->start_time = 0;                         //开始时间
    sj->pid = 0;                                //执行脚本子进程的pid
    // 设置脚本的参数列表
    memcpy(sj->argv,argv,sizeof(char*)*(argc+1));
    // 添加到脚本队列中
    listAddNodeTail(sentinel.scripts_queue,sj);
    /* Remove the oldest non running script if we already hit the limit. */
    // 如果队列长度大于256个，那么删除最旧的脚本，只保留255个
    if (listLength(sentinel.scripts_queue) > SENTINEL_SCRIPT_MAX_QUEUE) {
        listNode *ln;
        listIter li;
        listRewind(sentinel.scripts_queue,&li);
        // 遍历脚本链表队列
        while ((ln = listNext(&li)) != NULL) {
            sj = ln->value;
            // 跳过正在执行的脚本
            if (sj->flags & SENTINEL_SCRIPT_RUNNING) continue;
            /* The first node is the oldest as we add on tail. */
            // 删除最旧的脚本
            listDelNode(sentinel.scripts_queue,ln);
            // 释放一个脚本任务结构和所有关联的数据
            sentinelReleaseScriptJob(sj);
            break;
        }
        serverAssert(listLength(sentinel.scripts_queue) <=
                    SENTINEL_SCRIPT_MAX_QUEUE);
    }
}
```

`Redis`使用了`sentinelScriptJob`结构来管理脚本的一些信息，正如上述代码初始化那一部分。

而且当前哨兵维护的哨兵队列最多只能保留最新的255个脚本，如果脚本过多就会从队列中删除对旧的脚本。

##### 3.3.2 执行脚本

当要执行脚本放入了队列中，等到周期性函数`sentinelTimer()`时，就会执行。我们来执行脚本的函数`sentinelRunPendingScripts()`代码：

```java
void sentinelRunPendingScripts(void) {
    listNode *ln;
    listIter li;
    mstime_t now = mstime();
    /* Find jobs that are not running and run them, from the top to the
     * tail of the queue, so we run older jobs first. */
    listRewind(sentinel.scripts_queue,&li);
    // 遍历脚本链表队列，如果没有超过同一时刻最多运行脚本的数量，找到没有正在运行的脚本
    while (sentinel.running_scripts < SENTINEL_SCRIPT_MAX_RUNNING &&
           (ln = listNext(&li)) != NULL)
    {
        sentinelScriptJob *sj = ln->value;
        pid_t pid;
        /* Skip if already running. */
        // 跳过正在运行的脚本
        if (sj->flags & SENTINEL_SCRIPT_RUNNING) continue;
        /* Skip if it's a retry, but not enough time has elapsed. */
        // 该脚本没有到达重新执行的时间，跳过
        if (sj->start_time && sj->start_time > now) continue;
        // 设置正在执行标志
        sj->flags |= SENTINEL_SCRIPT_RUNNING;
        // 开始执行时间
        sj->start_time = mstime();
        // 执行次数加1
        sj->retry_num++;
        // 创建子进程执行
        pid = fork();
        // fork()失败，报告错误
        if (pid == -1) {
            sentinelEvent(LL_WARNING,"-script-error",NULL,
                          "%s %d %d", sj->argv[0], 99, 0);
            sj->flags &= ~SENTINEL_SCRIPT_RUNNING;
            sj->pid = 0;
        // 子进程执行的代码
        } else if (pid == 0) {
            /* Child */
            // 执行该脚本
            execve(sj->argv[0],sj->argv,environ);
            /* If we are here an error occurred. */
            // 如果执行_exit(2)，表示发生了错误，不能重新执行
            _exit(2); /* Don't retry execution. */
        // 父进程，更新脚本的pid，和同时执行脚本的个数
        } else {
            sentinel.running_scripts++;
            sj->pid = pid;
            // 并且通知事件
            sentinelEvent(LL_DEBUG,"+script-child",NULL,"%ld",(long)pid);
        }
    }
}
```

因为`Redis`是单线程架构的，所以和持久化一样，执行脚本需要创建一个子进程。

- 子进程：执行没有正在执行和已经到了执行时间的脚本任务。
- 父进程：更新脚本的信息。例如：正在执行的个数和执行脚本的子进程的pid等等。

父进程更新完脚本的信息后就会继续执行下一个`sentinelCollectTerminatedScripts()`函数

##### 3.3.3 脚本清理工作

- 如果在子进程执行的脚本已经执行完成，则可以从脚本队列中将其删除。
- 如果在子进程执行的脚本执行出错，但是可以在规定时间后重新执行，那么设置其执行的时间，下个周期重新执行。
- 如果在子进程执行的脚本执行出错，但是无法在执行，那么也会脚本队里中将其删除。

函数`sentinelCollectTerminatedScripts()`源码如下：

```java
void sentinelCollectTerminatedScripts(void) {
    int statloc;
    pid_t pid;
    // 接受子进程退出码
    // WNOHANG：如果没有子进程退出，则立刻返回
    while ((pid = wait3(&statloc,WNOHANG,NULL)) > 0) {
        int exitcode = WEXITSTATUS(statloc);
        int bysignal = 0;
        listNode *ln;
        sentinelScriptJob *sj;
        // 获取造成脚本终止的信号
        if (WIFSIGNALED(statloc)) bysignal = WTERMSIG(statloc);
        sentinelEvent(LL_DEBUG,"-script-child",NULL,"%ld %d %d",
            (long)pid, exitcode, bysignal);
        // 根据pid查找并返回正在运行的脚本节点
        ln = sentinelGetScriptListNodeByPid(pid);
        if (ln == NULL) {
            serverLog(LL_WARNING,"wait3() returned a pid (%ld) we can't find in our scripts execution queue!", (long)pid);
            continue;
        }
        sj = ln->value;
        // 如果退出码是1并且没到脚本最大的重试数量
        if ((bysignal || exitcode == 1) &&
            sj->retry_num != SENTINEL_SCRIPT_MAX_RETRY)
        {   // 取消正在执行的标志
            sj->flags &= ~SENTINEL_SCRIPT_RUNNING;
            sj->pid = 0;
            // 设置下次执行脚本的时间
            sj->start_time = mstime() +
                             sentinelScriptRetryDelay(sj->retry_num);
        // 脚本不能重新执行
        } else {
            // 发送脚本错误的事件通知
            if (bysignal || exitcode != 0) {
                sentinelEvent(LL_WARNING,"-script-error",NULL,
                              "%s %d %d", sj->argv[0], bysignal, exitcode);
            }
            // 从脚本队列中删除脚本
            listDelNode(sentinel.scripts_queue,ln);
            // 释放一个脚本任务结构和所有关联的数据
            sentinelReleaseScriptJob(sj);
            // 目前正在执行脚本的数量减1
            sentinel.running_scripts--;
        }
    }
}
```

##### 3.3.4 杀死超时脚本

`Sentinel`规定一个脚本最多执行`60s`，如果执行超时，则会杀死正在执行的脚本。

```java
void sentinelKillTimedoutScripts(void) {
    listNode *ln;
    listIter li;
    mstime_t now = mstime();
    listRewind(sentinel.scripts_queue,&li);
    // 遍历脚本队列
    while ((ln = listNext(&li)) != NULL) {
        sentinelScriptJob *sj = ln->value;
        // 如果当前脚本正在执行且执行，且脚本执行的时间超过60s
        if (sj->flags & SENTINEL_SCRIPT_RUNNING &&
            (now - sj->start_time) > SENTINEL_SCRIPT_MAX_RUNTIME)
        {   // 发送脚本超时的事件
            sentinelEvent(LL_WARNING,"-script-timeout",NULL,"%s %ld",
                sj->argv[0], (long)sj->pid);
            // 杀死执行脚本的子进程
            kill(sj->pid,SIGKILL);
        }
    }
}
```

#### 3.4 脑裂

在`Redis`的[官方Sentinel文档](https://redis.io/topics/sentinel)中给出了一种关于脑裂的场景。

```java
+----+         +----+
| M1 |---------| R1 |
| S1 |         | S2 |
+----+         +----+
Configuration: quorum = 1
// M1是主节点
// R1是从节点
// S1、S2是哨兵节点
```

在此种情况中，如果主节点M1出现故障，那么R1将被晋升为主节点，因为两个`Sentinel`节点可以就配置的`quorum = 1`达成一致，并且会执行故障转移操作。如下图所示：

```java
+----+           +------+
| M1 |----//-----| [M1] |
| S1 |           | S2   |
+----+           +------+
```

如果执行了故障转移之后，就会完全以对称的方式创建了两个主节点。客户端可能会不明确的写入数据到两个主节点，这就可能造成很多严重的后果，例如：争抢服务器的资源，争抢应用服务，数据损坏等等。

因此，最好不要进行这样的部署。

在哨兵模式的主函数`sentinelTimer()`，为了防止这样的部署造成的一些后果，所以每次执行后都会更改服务器的周期任务执行频率，如下所述：

```java
server.hz = CONFIG_DEFAULT_HZ + rand() % CONFIG_DEFAULT_HZ;
```

不断改变`Redis`定期任务的执行频率，以便使每个Sentinel节点都不同步，这种不确定性可以避免Sentinel在同一时间开始完全继续保持同步，当被要求进行投票时，一次又一次在同一时间进行投票，因为脑裂导致有可能没有胜选者。

### 4. 哨兵的使命

`sentinel.c`文件详细注释：[Redis Sentinel详细注释](https://github.com/menwengit/redis_source_annotation)

该部分在[Redis Sentinel实现（下）](/zhuanlan/db/redis/4/24.html)中单独剖析。
