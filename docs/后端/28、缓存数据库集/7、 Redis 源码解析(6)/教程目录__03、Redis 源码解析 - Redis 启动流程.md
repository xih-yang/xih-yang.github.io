# 03、Redis 源码解析 - Redis 启动流程
- 来源：https://ddkk.com/zhuanlan/db/redis/6/3.html
- 分类：缓存数据库
- 分组：教程目录
Redis是典型的Client-Server架构，Server端通常以Proxy或者集群的方式部署，当编译完Redis代码之后，目录下会有以下几个可执行文件:

- redis-server：Server端
- redis-cli：访问Server的命令行工具，在5.0版本之后集成了redis-trib.rb的功能，可以用来部署和检查集群
- redis-benchmark：Server端的压测工具
- redis-check-rdb：rdb文件有效性的检查工具
- redis-check-aof：aof文件有效性的检查工具

命令行中输入./redis-server，就会启动一个Server端节点，Redis的启动流程在server.c中，从main函数开始，依次执行了以下5个步骤。

### 基本初始化

基本初始化包括：设置时区、OOM时处理函数、产生随机数种子、设置Server端默认配置、Module配置

```java
// 设置时区
setlocale(LC_COLLATE,"");
tzset(); /* Populates 'timezone' global. */
// 设置OOM时的处理函数
zmalloc_set_oom_handler(redisOutOfMemoryHandler);
// 根据当前时间产生随机数种子
srand(time(NULL)^getpid());
gettimeofday(&tv,NULL);
// 设置dict结构的随机数种子
char hashseed[16];
getRandomHexChars(hashseed,sizeof(hashseed));
dictSetHashFunctionSeed((uint8_t*)hashseed);
// Server端的默认配置
initServerConfig();
// Module的初始化
moduleInitModulesSystem();
/* Store the executable path and arguments in a safe place in order
 * to be able to restart the server later. */
server.executable = getAbsolutePath(argv[0]);
server.exec_argv = zmalloc(sizeof(char*)*(argc+1));
server.exec_argv[argc] = NULL;
for (j = 0; j < argc; j++) server.exec_argv[j] = zstrdup(argv[j]);
```

OOM时的处理流程：先打印一条OOM日志，然后打印当前堆栈，最后退出

```java
void redisOutOfMemoryHandler(size_t allocation_size) {
    serverLog(LL_WARNING,"Out Of Memory allocating %zu bytes!",
        allocation_size);
    serverPanic("Redis aborting for OUT OF MEMORY");
}
```

Server端默认配置：有一个全局的struct redisServer结构体，里面定义了一个Redis节点的所有设置以及在各种模式下运行所需要的资源，这个结构体很复杂，几乎涉及到了Redis所有的功能模块，在后面的文章中逐步解析。

```java
/* Global vars */
struct redisServer server; /* Server global state */
```

把redisServer中的字段都用默认参数初始化，比如

```java
void initServerConfig(void) {
    int j;
    pthread_mutex_init(&server.next_client_id_mutex,NULL);
    pthread_mutex_init(&server.lruclock_mutex,NULL);
    pthread_mutex_init(&server.unixtime_mutex,NULL);
    updateCachedTime(1);
    getRandomHexChars(server.runid,CONFIG_RUN_ID_SIZE);
    server.runid[CONFIG_RUN_ID_SIZE] = '\0';
    changeReplicationId();
    clearReplicationId2();
    server.timezone = getTimeZone(); /* Initialized by tzset(). */
    server.configfile = NULL;
    server.executable = NULL;
    server.hz = server.config_hz = CONFIG_DEFAULT_HZ;
    ...
}
```

### 参数解析

基本初始化完成以后，对命令行参数进行解析

- 如果是RDB/AOF有效性检查，则运行redis-check-rdb或redis-check-aof

```java
if (strstr(argv[0],"redis-check-rdb") != NULL)
    redis_check_rdb_main(argc,argv,NULL);
else if (strstr(argv[0],"redis-check-aof") != NULL)
    redis_check_aof_main(argc,argv);
```

- 根据命令行中-c参数获取到配置文件，并进行配置文件的加载，加载完配置文件以后，基本初始化中的默认参数就会被覆盖。

```java
	loadServerConfig(configfile,options);
```

### 初始化Server

所有的配置参数都被赋值以后，调用initServer()对服务运行时的所有资源即全局的redisServer结构体进行初始化，主要包括：各种数据结构初始化、数据库初始化、网络框架初始化

```java
void initServer(void) {
	int j;
	// 初始化信号处理函数
    signal(SIGHUP, SIG_IGN);
    signal(SIGPIPE, SIG_IGN);
    setupSignalHandlers();
    // 各种数据结构初始化
    ...
    server.clients = listCreate();
    server.clients_index = raxNew();
    server.clients_to_close = listCreate();
    server.slaves = listCreate();
    ...
    // 创建共享对象
    createSharedObjects();
    // 根据操作系统调整打开套接字的上限阈值
    adjustOpenFilesLimit();
    // 数据库初始化
    ...
    server.db = zmalloc(sizeof(redisDb)*server.dbnum);
     for (j = 0; j < server.dbnum; j++) {
        server.db[j].dict = dictCreate(&dbDictType,NULL);
        server.db[j].expires = dictCreate(&keyptrDictType,NULL);
        server.db[j].blocking_keys = dictCreate(&keylistDictType,NULL);
        server.db[j].ready_keys = dictCreate(&objectKeyPointerValueDictType,NULL);
        server.db[j].watched_keys = dictCreate(&keylistDictType,NULL);
        server.db[j].id = j;
        server.db[j].avg_ttl = 0;
        server.db[j].defrag_later = listCreate();
    }
    evictionPoolAlloc(); /* Initialize the LRU keys pool. */
    ...
    // 网络框架初始化
    server.el = aeCreateEventLoop(server.maxclients+CONFIG_FDSET_INCR);
    ...
    if (aeCreateTimeEvent(server.el, 1, serverCron, NULL, NULL) == AE_ERR) {
        serverPanic("Can't create event loop timers.");
        exit(1);
    }
    // 监听accept事件
    for (j = 0; j < server.ipfd_count; j++) {
        if (aeCreateFileEvent(server.el, server.ipfd[j], AE_READABLE,
            acceptTcpHandler,NULL) == AE_ERR)
            {
                serverPanic(
                    "Unrecoverable error creating server.ipfd file event.");
            }
    }
    if (server.sofd > 0 && aeCreateFileEvent(server.el,server.sofd,AE_READABLE,
        acceptUnixHandler,NULL) == AE_ERR) serverPanic("Unrecoverable error creating server.sofd file event.");
	...
}
```

Server完了之后，就会从磁盘上加载数据loadDataFromDisk()。

### 启动事件驱动框架

在initServer()中的初始化网络驱动框架，会创建监听句柄，并注册监听accept事件，完了之后就可以启动事件驱动框架，事件驱动框架会监听客户端的连接事件、读事件已经周期性的处理时间事件。

```java
// 注册前后置事件
aeSetBeforeSleepProc(server.el,beforeSleep);
aeSetAfterSleepProc(server.el,afterSleep);
// 启动时间驱动框架
aeMain(server.el);
aeDeleteEventLoop(server.el);
```

至此，一个Redis服务端节点就启动起来了。
