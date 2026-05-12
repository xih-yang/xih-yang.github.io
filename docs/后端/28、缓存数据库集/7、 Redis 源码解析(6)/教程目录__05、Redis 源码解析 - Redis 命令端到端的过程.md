# 05、Redis 源码解析 - Redis 命令端到端的过程
- 来源：https://ddkk.com/zhuanlan/db/redis/6/5.html
- 分类：缓存数据库
- 分组：教程目录
在[Redis 源码解析 - Redis 启动流程](/zhuanlan/db/redis/6/3.html)中，一个Redis节点启动的最后一步是启动事件驱动框架，来等待可读事件发生。客户端发出的一条命令的端到端过程大体如下：

**1、** 客户端连接服务端，触发节点读事件，创建客户端Client，注册该客户端的读事件；

**2、** 客户端发送命令，触发节点的读事件，服务端开始读取客户端套接字，放入客户端缓存中；

**3、** 从客户端缓存中根据Redis协议解析命令；

**4、** 处理命令；

**5、** 触发写事件，给客户端发送响应；

**6、** 销毁客户端；

下面逐步解析这6个步骤。

### 客户端创建

在客户端发起对服务端的连接请求时，会在服务端的事件循环中触发读事件，在[Redis 源码解析 - Redis 启动流程](/zhuanlan/db/redis/6/3.html)启动节点之前，会初始化Server，其中有一步是初始化网络框架，注册监听端口事件：

```java
void initServer(void) {
	...
	// 网络框架初始化
    server.el = aeCreateEventLoop(server.maxclients+CONFIG_FDSET_INCR);
    ...
    // 监听accept事件
    for (j = 0; j < server.ipfd_count; j++) {
        if (aeCreateFileEvent(server.el, server.ipfd[j], AE_READABLE,
            acceptTcpHandler,NULL) == AE_ERR)
            {
                serverPanic(
                    "Unrecoverable error creating server.ipfd file event.");
            }
    }
```

在[Redis 源码解析 - Redis 事件驱动框架](/zhuanlan/db/redis/6/4.html)中，当该套接字上发生读事件时，会根据注册的事件处理函数acceptTcpHandler来处理

redis作为一个单进程单线程的KV存储服务，工作流程如下：在main函数中，前面做了一些初始化操作之后，在一个while循坏中不停的调用aeMain进行事件处理：

```java
void acceptTcpHandler(aeEventLoop *el, int fd, void *privdata, int mask) {
    int cport, cfd, max = MAX_ACCEPTS_PER_CALL;
    char cip[NET_IP_STR_LEN];
    while(max--) {
        cfd = anetTcpAccept(server.neterr, fd, cip, sizeof(cip), &cport);
        if (cfd == ANET_ERR) {
            if (errno != EWOULDBLOCK)
                serverLog(LL_WARNING,
                    "Accepting client connection: %s", server.neterr);
            return;
        }
        serverLog(LL_VERBOSE,"Accepted %s:%d", cip, cport);
        acceptCommonHandler(cfd,0,cip);
    }
}
```

acceptTcpHandler主要做了两件事：

**1、** anetTcpAccept：从监听端口创建连接，anetTcpAccept是对linuxaccept的简单封装，在networking.cc中；

**2、** acceptCommonHandler：对创建好的连接套接字处理；

```java
static void acceptCommonHandler(int fd, int flags, char *ip) {
	    client *c;
    if ((c = createClient(fd)) == NULL) {
        serverLog(LL_WARNING,
            "Error registering fd event for the new client: %s (fd=%d)",
            strerror(errno),fd);
        close(fd); /* May be already closed, just ignore errors */
        return;
    }
}
```

acceptCommonHandler就做了一件事，就是调用createClient创建客户端：

```java
client *createClient(int fd) {
    client *c = zmalloc(sizeof(client));
    if (fd != -1) {
    	// 设置client的套接字非阻塞，noDelay属性
        anetNonBlock(NULL,fd);
        anetEnableTcpNoDelay(NULL,fd);
        // 设置client套接字keepalive属性
        if (server.tcpkeepalive)
            anetKeepAlive(NULL,fd,server.tcpkeepalive);
        // 注册事件，设置事件处理函数readQueryFromClient
        if (aeCreateFileEvent(server.el,fd,AE_READABLE,
            readQueryFromClient, c) == AE_ERR)
        {
            close(fd);
            zfree(c);
            return NULL;
        }
    }
    //客户端属性初始化
    ...
```

在Redis中，客户端用struct client表示，createClient先注册客户端的套接字事件，设置套接字非阻塞属性，回调函数readQueryFromClient，然后就是大量的客户端属性初始化，至此，一个客户端被创建。

### 命令的读取

客户端连接上服务端以后，当客户端发送命令时，会触发服务端createClient时创建好的套接字读事件，调用readQueryFromClient从套接字中读取数据，存储到client的缓冲区

querybuf中，有两点需要注意：

**1、** 命令的类型分为PROTO_REQ_MULTIBULK和PROTO_REQ_INLINE，分别对应redis-cli和telnet发送过来的命令，两者发送命令的协议不同；

**2、** 在命令读取阶段为主从同步做了很多准备；

读取完命令之后，就调用processInputBufferAndReplicate函数对命令进一步处理

```java
//读取客户端命令
void readQueryFromClient(aeEventLoop *el, int fd, void *privdata, int mask) {
    client *c = (client*) privdata;
    int nread, readlen;
    size_t qblen;
    UNUSED(el);
    UNUSED(mask);
    readlen = PROTO_IOBUF_LEN;
    //确定要读取的字节长度
    //下面这种情况主要防止设置的单个参数的长度不够（比如：set的字符串过长），发生第二次调用read
    if (c->reqtype == PROTO_REQ_MULTIBULK && c->multibulklen && c->bulklen != -1
        && c->bulklen >= PROTO_MBULK_BIG_ARG)
    {
        ssize_t remaining = (size_t)(c->bulklen+2)-sdslen(c->querybuf);
        if (remaining > 0 && remaining < readlen) readlen = remaining;
    }
    qblen = sdslen(c->querybuf);
    if (c->querybuf_peak < qblen) c->querybuf_peak = qblen;
    //准备输入缓冲区
    c->querybuf = sdsMakeRoomFor(c->querybuf, readlen);
    //网络读取
    nread = read(fd, c->querybuf+qblen, readlen);
    if (nread == -1) {
    	// 读出错
        if (errno == EAGAIN) {
            return;
        } else {
            serverLog(LL_VERBOSE, "Reading from client: %s",strerror(errno));
            freeClient(c);
            return;
        }
    } else if (nread == 0) {
    	// 客户端关闭
        serverLog(LL_VERBOSE, "Client closed connection");
        freeClient(c);
        return;
    } else if (c->flags & CLIENT_MASTER) {
        //对于master传来的命令，将命令追加到pending_querybuf中
        c->pending_querybuf = sdscatlen(c->pending_querybuf,
                                        c->querybuf+qblen,nread);
    }
    sdsIncrLen(c->querybuf,nread);
    c->lastinteraction = server.unixtime;
    if (c->flags & CLIENT_MASTER) c->read_reploff += nread;
    server.stat_net_input_bytes += nread;
    // 读取的长度超过设置的最大缓存值
    if (sdslen(c->querybuf) > server.client_max_querybuf_len) {
        sds ci = catClientInfoString(sdsempty(),c), bytes = sdsempty();
        bytes = sdscatrepr(bytes,c->querybuf,64);
        serverLog(LL_WARNING,"Closing client that reached max query buffer length: %s (qbuf initial bytes: %s)", ci, bytes);
        sdsfree(ci);
        sdsfree(bytes);
        freeClient(c);
        return;
    }
	//命令处理
    processInputBufferAndReplicate(c);
}
```

### 命令的解析与处理

命令处理在processInputBufferAndReplicate中进行，processInputBufferAndReplicate对processInputBuffer进行封装，对主从同步的情况做了些处理，进一步向slave传播master的命令。processInputBuffer主要在以下情况被调用：

**1、** 从客户端套接字中读取到更多的字符；

**2、** 当一个阻塞客户端被激活时，例如multi命令；

processInputBuffer主要做了两件事：

**1、** processMultibulkBuffer：对输入缓冲区中的内容进行解析，并将解析出的命令和参数填入客户端结构中；

**2、** processCommand：处理命令；

```java
void processInputBuffer(client *c) {
	server.current_client = c;
	//读取输入缓冲区中的内容
    while(c->qb_pos < sdslen(c->querybuf)) {
    	//所在客户端被暂停
        if (!(c->flags & CLIENT_SLAVE) && clientsArePaused()) break;
        //客户端被阻塞
        if (c->flags & CLIENT_BLOCKED) break;
        //master发送命令，但是slave现在繁忙
        if (server.lua_timedout && c->flags & CLIENT_MASTER) break;
        //客户端被设置准备关闭标志
        if (c->flags & (CLIENT_CLOSE_AFTER_REPLY|CLIENT_CLOSE_ASAP)) break;
        //识别命令类型
        if (!c->reqtype) {
            if (c->querybuf[c->qb_pos] == '*') {
                c->reqtype = PROTO_REQ_MULTIBULK;
            } else {
                c->reqtype = PROTO_REQ_INLINE;
            }
        }
        //识别出类型之后，对读取的字节进行解析出命令和参数，并封装到c-argv[]数组中
        if (c->reqtype == PROTO_REQ_INLINE) {
            if (processInlineBuffer(c) != C_OK) break;
        } else if (c->reqtype == PROTO_REQ_MULTIBULK) {
            if (processMultibulkBuffer(c) != C_OK) break;
        } else {
            serverPanic("Unknown request type");
        }
        if (c->argc == 0) {
            resetClient(c);
        } else {
            //命令处理
            if (processCommand(c) == C_OK) {
                if (c->flags & CLIENT_MASTER && !(c->flags & CLIENT_MULTI)) {
                    //更新实际的复制偏移量
                    c->reploff = c->read_reploff - sdslen(c->querybuf) + c->qb_pos;
                }
                //对于阻塞中的客户端不要重制
                if (!(c->flags & CLIENT_BLOCKED) || c->btype != BLOCKED_MODULE)
                    resetClient(c);
            }
            //如果在处理命令的过程中，例如阻塞命令，客户端被释放，则不再继续处理
            if (server.current_client == NULL) break;
        }
    }
	//压缩输入缓冲区
    if (server.current_client != NULL && c->qb_pos) {
        sdsrange(c->querybuf,c->qb_pos,-1);
        c->qb_pos = 0;
    }
    server.current_client = NULL;
    }
}
```

命令解析在processMultibulkBuffer中执行，根据[Redis的协议](http://redisdoc.com/topic/protocol.html)，每次解析出来一个命令，如果所读长度不够解析为一个命令，则等待下一次事件循环继续读，代码比较繁琐，就不贴了。

下面来看一下processCommand：

**1、** 首先查找命令lookupCommand，并验证命令合法性；

**2、** 处理鉴权；

**3、** 如果是集群模式，则查找对应key的slot；

**4、** 如果内存快满了，就根据淘汰策略淘汰部分键值；

**5、** 在多种情况下判断命令能否执行：需要持久化之前写磁盘错误；主从模式下slave落后master太多；slave设置只读模式；pubsub命令错误；slave与master断连；节点正在忙于执行lua脚本；事务处理；

```java
int processCommand(client *c) {
	// module模块先忽略
    moduleCallCommandFilters(c);
    //quit命令单独处理
    if (!strcasecmp(c->argv[0]->ptr,"quit")) {
        addReply(c,shared.ok);
        c->flags |= CLIENT_CLOSE_AFTER_REPLY;
        return C_ERR;
    }
    //查找命令
    c->cmd = c->lastcmd = lookupCommand(c->argv[0]->ptr);
    if (!c->cmd) {
        //未找到命令
        flagTransaction(c);
        sds args = sdsempty();
        int i;
        for (i=1; i < c->argc && sdslen(args) < 128; i++)
            args = sdscatprintf(args, "%.*s, ", 128-(int)sdslen(args), (char*)c->`argv[i]->`ptr);
        addReplyErrorFormat(c,"unknown command %s, with args beginning with: %s",
            (char*)c->argv[0]->ptr, args);
        sdsfree(args);
        return C_OK;
    } else if ((c->cmd->arity > 0 && c->cmd->arity != c->argc) ||
               (c->argc < -c->cmd->arity)) {
        //命令格式不对
        flagTransaction(c);
        addReplyErrorFormat(c,"wrong number of arguments for '%s' command",
            c->cmd->name);
        return C_OK;
    }
    //检查授权
    if (server.requirepass && !c->authenticated && c->cmd->proc != authCommand)
    {
        flagTransaction(c);
        addReply(c,shared.noautherr);
        return C_OK;
    }
    //集群模式下的集群跳转
    if (server.cluster_enabled &&
        !(c->flags & CLIENT_MASTER) &&
        !(c->flags & CLIENT_LUA &&
          server.lua_caller->flags & CLIENT_MASTER) &&
        !(c->cmd->getkeys_proc == NULL && c->cmd->firstkey == 0 &&
          c->cmd->proc != execCommand))
    {
        int hashslot;
        int error_code;
        clusterNode *n = getNodeByQuery(c,c->cmd,c->argv,c->argc,
                                        &hashslot,&error_code);
        if (n == NULL || n != server.cluster->myself) {
            if (c->cmd->proc == execCommand) {
                discardTransaction(c);
            } else {
                flagTransaction(c);
            }
            clusterRedirectClient(c,n,hashslot,error_code);
            return C_OK;
        }
    }
    //内存管理
    //在lua脚本执行的时候，不要进行内存管理，防止lua脚本的内容与evict的del命令一起混合传播到aof和slave中
    if (server.maxmemory && !server.lua_timedout) {
        int out_of_memory = freeMemoryIfNeededAndSafe() == C_ERR;
        //freeMemoryIfNeeded中回清空slave的输出缓冲区，如果此时slave网络连接出错
        //同时server.current_client是当前的slave，在往下执行下去就会出错，这里判断之后直接返回
        if (server.current_client == NULL) return C_ERR;
        if (out_of_memory &&
            (c->cmd->flags & CMD_DENYOOM ||
             (c->flags & CLIENT_MULTI && c->cmd->proc != execCommand))) {
            flagTransaction(c);
            addReply(c, shared.oomerr);
            return C_OK;
        }
    }
    int deny_write_type = writeCommandsDeniedByDiskError();
    //如果redis在持久化时出错，并且该命令需要写，则拒绝
    if (deny_write_type != DISK_ERROR_TYPE_NONE &&
        server.masterhost == NULL &&
        (c->cmd->flags & CMD_WRITE ||
         c->cmd->proc == pingCommand))
    {
        flagTransaction(c);
        if (deny_write_type == DISK_ERROR_TYPE_RDB)
            addReply(c, shared.bgsaveerr);
        else
            addReplySds(c,
                sdscatprintf(sdsempty(),
                "-MISCONF Errors writing to the AOF file: %s\r\n",
                strerror(server.aof_last_write_errno)));
        return C_OK;
    }
    //对于master，如果要求必须有repl_min_slaves_to_write个slave上线
    //如果是写命令，不满足条件时，则拒绝
    if (server.masterhost == NULL &&
        server.repl_min_slaves_to_write &&
        server.repl_min_slaves_max_lag &&
        c->cmd->flags & CMD_WRITE &&
        server.repl_good_slaves_count < server.repl_min_slaves_to_write)
    {
        flagTransaction(c);
        addReply(c, shared.noreplicaserr);
        return C_OK;
    }
    //对于只读slave，不接受业务客户端的写命令
    if (server.masterhost && server.repl_slave_ro &&
        !(c->flags & CLIENT_MASTER) &&
        c->cmd->flags & CMD_WRITE)
    {
        addReply(c, shared.roslaveerr);
        return C_OK;
    }
    //不符合pubsub命令
    if (c->flags & CLIENT_PUBSUB &&
        c->cmd->proc != pingCommand &&
        c->cmd->proc != subscribeCommand &&
        c->cmd->proc != unsubscribeCommand &&
        c->cmd->proc != psubscribeCommand &&
        c->cmd->proc != punsubscribeCommand) {
        addReplyError(c,"only (P)SUBSCRIBE / (P)UNSUBSCRIBE / PING / QUIT allowed in this context");
        return C_OK;
    }
    //对于没有上线的slave，只允许接受INFO、SLAVEOF等命令
    if (server.masterhost && server.repl_state != REPL_STATE_CONNECTED &&
        server.repl_serve_stale_data == 0 &&
        !(c->cmd->flags & CMD_STALE))
    {
        flagTransaction(c);
        addReply(c, shared.masterdownerr);
        return C_OK;
    }
	// loading装
    if (server.loading && !(c->cmd->flags & CMD_LOADING)) {
        addReply(c, shared.loadingerr);
        return C_OK;
    }
    //在执行lua脚本时，只允许少数几个命令执行，例如AUTH、REPLCONF、SHUTDOWN
    if (server.lua_timedout &&
          c->cmd->proc != authCommand &&
          c->cmd->proc != replconfCommand &&
        !(c->cmd->proc == shutdownCommand &&
          c->argc == 2 &&
          tolower(((char*)c->argv[1]->ptr)[0]) == 'n') &&
        !(c->cmd->proc == scriptCommand &&
          c->argc == 2 &&
          tolower(((char*)c->argv[1]->ptr)[0]) == 'k'))
    {
        flagTransaction(c);
        addReply(c, shared.slowscripterr);
        return C_OK;
    }
    /* Exec the command */
    //开始执行命令
    if (c->flags & CLIENT_MULTI &&
        c->cmd->proc != execCommand && c->cmd->proc != discardCommand &&
        c->cmd->proc != multiCommand && c->cmd->proc != watchCommand)
    {
        //事务命令
        queueMultiCommand(c);
        addReply(c,shared.queued);
    } else {
        //单条命令
        call(c,CMD_CALL_FULL);
        c->woff = server.master_repl_offset;
        //命令执行完以后，可能会解除某些客户端的阻塞状态
        if (listLength(server.ready_keys))
            handleClientsBlockedOnKeys();
    }
    return C_OK;
}
```

如果命令可以执行，最终会调用call函数执行命令，call函数对于每个命令，会调用命令结构体中的命令处理函数进行处理。

那么redis是如何初始化命令的？redis有个全局的命令列表，保存redis中所有支持的命令：

```java
struct redisCommand redisCommandTable[] = {
    {
     "module",moduleCommand,-2,"as",0,NULL,0,0,0,0,0},
    {
     "get",getCommand,2,"rF",0,NULL,1,1,1,0,0},
    {
     "set",setCommand,-3,"wm",0,NULL,1,1,1,0,0},
    ...
}
```

其中redisCommand结构体的各个字段的含义如下：

```java
struct redisCommand {
    char *name; //命令名称
    redisCommandProc *proc; //命令执行函数
    int arity;  //参数个数
    char *sflags;   //命令字符串形式的标志 
    int flags;    //命令标志
    //从参数列表中获取key，与firstkey、lastkey、keystep配合使用
    redisGetKeysProc *getkeys_proc
    int firstkey; 
    int lastkey;  
    int keystep;  
    long long microseconds, calls;  //命令统计，执行时间，执行次数
};
```

在server结构体中有个dict *commands; 字段表示redis支持的所有命令：

```java
struct redisServer {
	...
	dict *commands; 
	...
}
```

在server启动过程中，会调用initServerConfig函数进行最初的初始化：

```java
void initServerConfig(void) {
	...
	server.commands = dictCreate(&commandTableDictType,NULL);
	populateCommandTable();
	...
}
```

populateCommandTable就是逐个将redisCommandTable中的命令添加到server.commands中。以set命令为例，命令的定义为：

```java
struct redisCommand redisCommandTable[] = {
	...
    {
     "set",setCommand,-3,"wm",0,NULL,1,1,1,0,0},
	...
}
```

从redisCommand结构体的定义中看出：set命令的处理函数为setCommand，有3个参数，有两个属性wm：写命令、内存满时需要被拒绝执行，没去取key函数，第一个key的下标为1，最后一个key的下标为1，每个key之间的间隔为1（也就是说set命令只能有一个key）。

最后再来看看call函数

```java
//命令执行
void call(client *c, int flags) {
    long long dirty;
    ustime_t start, duration;
    int client_old_flags = c->flags;
    struct redisCommand *real_cmd = c->cmd;
    server.fixed_time_expire++;
    //命令传播到monitor中
    if (listLength(server.monitors) &&
        !server.loading &&
        !(c->cmd->flags & (CMD_SKIP_MONITOR|CMD_ADMIN)))
    {
        replicationFeedMonitors(c,server.monitors,c->db->id,c->argv,c->argc);
    }
    //清除上一次的命令传播标志，此标志将会在c->cmd->proc()中重新设定
    c->flags &= ~(CLIENT_FORCE_AOF|CLIENT_FORCE_REPL|CLIENT_PREVENT_PROP);
    redisOpArray prev_also_propagate = server.also_propagate;
    redisOpArrayInit(&server.also_propagate);
    dirty = server.dirty;   //命令执行前统计修改数
    updateCachedTime(0);    //更新时间缓存
    start = server.ustime;
    // 调用命令的proc函数处理命令
    c->cmd->proc(c);
    duration = ustime()-start;
    dirty = server.dirty-dirty; //统计修改量
    if (dirty < 0) dirty = 0;
    //如果server在载入数据，此时不计入slowlog
    if (server.loading && c->flags & CLIENT_LUA)
        flags &= ~(CMD_CALL_SLOWLOG | CMD_CALL_STATS);
    //lua脚本命令强制传播到slave和aof中
    if (c->flags & CLIENT_LUA && server.lua_caller) {
        if (c->flags & CLIENT_FORCE_REPL)
            server.lua_caller->flags |= CLIENT_FORCE_REPL;
        if (c->flags & CLIENT_FORCE_AOF)
            server.lua_caller->flags |= CLIENT_FORCE_AOF;
    }
    //slowlog和latency统计
    if (flags & CMD_CALL_SLOWLOG && c->cmd->proc != execCommand) {
        char *latency_event = (c->cmd->flags & CMD_FAST) ?
                              "fast-command" : "command";
        latencyAddSampleIfNeeded(latency_event,duration/1000);
        slowlogPushEntryIfNeeded(c,c->argv,c->argc,duration);
    }
    //加入命令统计
    if (flags & CMD_CALL_STATS) {
        real_cmd->microseconds += duration;
        real_cmd->calls++;
    }
    //命令传播
    if (flags & CMD_CALL_PROPAGATE &&
        (c->flags & CLIENT_PREVENT_PROP) != CLIENT_PREVENT_PROP)
    {
        int propagate_flags = PROPAGATE_NONE;
        if (dirty) propagate_flags |= (PROPAGATE_AOF|PROPAGATE_REPL);
        if (c->flags & CLIENT_FORCE_REPL) propagate_flags |= PROPAGATE_REPL;
        if (c->flags & CLIENT_FORCE_AOF) propagate_flags |= PROPAGATE_AOF;
        if (c->flags & CLIENT_PREVENT_REPL_PROP ||
            !(flags & CMD_CALL_PROPAGATE_REPL))
                propagate_flags &= ~PROPAGATE_REPL;
        if (c->flags & CLIENT_PREVENT_AOF_PROP ||
            !(flags & CMD_CALL_PROPAGATE_AOF))
                propagate_flags &= ~PROPAGATE_AOF;
        //module命令单独的命令传播
        if (propagate_flags != PROPAGATE_NONE && !(c->cmd->flags & CMD_MODULE))
            propagate(c->cmd,c->db->id,c->argv,c->argc,propagate_flags);
    }
    //恢复客户端的传播状态
    c->flags &= ~(CLIENT_FORCE_AOF|CLIENT_FORCE_REPL|CLIENT_PREVENT_PROP);
    c->flags |= client_old_flags &
        (CLIENT_FORCE_AOF|CLIENT_FORCE_REPL|CLIENT_PREVENT_PROP);
    //传播额外的命令
    if (server.also_propagate.numops) {
        int j;
        redisOp *rop;
        if (flags & CMD_CALL_PROPAGATE) {
            for (j = 0; j < server.also_propagate.numops; j++) {
                rop = &server.also_propagate.ops[j];
                int target = rop->target;
                /* Whatever the command wish is, we honor the call() flags. */
                if (!(flags&CMD_CALL_PROPAGATE_AOF)) target &= ~PROPAGATE_AOF;
                if (!(flags&CMD_CALL_PROPAGATE_REPL)) target &= ~PROPAGATE_REPL;
                if (target)
                    propagate(rop->cmd,rop->dbid,rop->argv,rop->argc,target);
            }
        }
        redisOpArrayFree(&server.also_propagate);
    }
    server.also_propagate = prev_also_propagate;
    server.fixed_time_expire--;
    server.stat_numcommands++;
}
```

在call中，除了命令执行外，最重要的就是命令传播到slaves和aof中，在propagate中实现，在后面持久化和主从传播时再介绍这部分。

### 命令的回复

redis在命令处理完成之后，不会立即将回复发送回客户端，而是采取“异步回复”。在每个client中都有一个输出缓冲，这个缓冲由两部分组成：

```java
typedef struct client {
	...
	list *reply;            /* List of reply objects to send to the client. */
    unsigned long long reply_bytes; /* Tot bytes of objects in reply list. */
    ...
    int bufpos;
    char buf[PROTO_REPLY_CHUNK_BYTES];
} client
```

当redis处理完命令之后，会先将回复写入buf中，buf如果不够，再将回复写入relpy中，以addReply为例：redis将客户端的回复封装成一个对象，并把对象写入输出缓冲中，_addReplyToBuffer负责向buf中写入回复，_addReplyStringToList负责向reply中写入回复，在_addReplyStringToList中，还会检查客户端的回复缓冲区是否达到了缓冲区大小的软硬限制。

```java
void addReply(client *c, robj *obj) {
    if (prepareClientToWrite(c) != C_OK) return;
    if (sdsEncodedObject(obj)) {
        if (_addReplyToBuffer(c,obj->ptr,sdslen(obj->ptr)) != C_OK)
            _addReplyStringToList(c,obj->ptr,sdslen(obj->ptr));
    } else if (obj->encoding == OBJ_ENCODING_INT) {
        char buf[32];
        size_t len = ll2string(buf,sizeof(buf),(long)obj->ptr);
        if (_addReplyToBuffer(c,buf,len) != C_OK)
            _addReplyStringToList(c,buf,len);
    } else {
        serverPanic("Wrong obj->encoding in addReply()");
    }
}
```

addReply先调用prepareClientToWrite准备向客户端缓冲写入回复：

```java
int prepareClientToWrite(client *c) {
    if (c->flags & (CLIENT_LUA|CLIENT_MODULE)) return C_OK;
    if (c->flags & (CLIENT_REPLY_OFF|CLIENT_REPLY_SKIP)) return C_ERR;
    //master客户端一般不需要回复
    if ((c->flags & CLIENT_MASTER) &&
        !(c->flags & CLIENT_MASTER_FORCE_REPLY)) return C_ERR;
    if (c->fd <= 0) return C_ERR; /* Fake client for AOF loading. */
    //如果客户端输出缓冲区中还有回复
    if (!clientHasPendingReplies(c)) clientInstallWriteHandler(c);
    return C_OK;
}
```

prepareClientToWrite中最后会用clientHasPendingReplies判断客户端之前的输出缓冲是否已经发送完，如果没有，则说明客户端还在server.clients_pending_write中，就不需要调用clientInstallWriteHandler，clientInstallWriteHandler主要就是将客户端添加到server.clients_pending_write中。

server.clients_pending_write中的客户端何时处理呢，在redis的每次eventloop循环之前，都会调用beforeSleep进行一些循环之前的处理，其中有个handleClientsWithPendingWrites函数负责向server.clients_pending_write中的客户端发送输出缓冲：

```java
void beforeSleep(struct aeEventLoop *eventLoop) {
	...
	/* Handle writes with pending output buffers. */
    handleClientsWithPendingWrites();
	...
}
```

```java
int handleClientsWithPendingWrites(void) {
    listIter li;
    listNode *ln;
    int processed = listLength(server.clients_pending_write);
	//逐个处理server.clients_pending_write中的客户端
    listRewind(server.clients_pending_write,&li);
    while((ln = listNext(&li))) {
    	//先清除标志
        client *c = listNodeValue(ln);
        c->flags &= ~CLIENT_PENDING_WRITE;
        listDelNode(server.clients_pending_write,ln);
        //PROTECTED模式下不进行回复
        if (c->flags & CLIENT_PROTECTED) continue;
		//发送回复
        if (writeToClient(c->fd,c,0) == C_ERR) continue;
		//如果没有发送完，则放到ServCron中继续发送，并且设置AE_BARRIER
        if (clientHasPendingReplies(c)) {
            int ae_flags = AE_WRITABLE;
            if (server.aof_state == AOF_ON &&
                server.aof_fsync == AOF_FSYNC_ALWAYS)
            {
                ae_flags |= AE_BARRIER;
            }
            if (aeCreateFileEvent(server.el, c->fd, ae_flags,
                sendReplyToClient, c) == AE_ERR)
            {
                    freeClientAsync(c);
            }
        }
    }
    return processed;
}
```

writeToClient负责向客户端的套接字中写入回复，为了避免长时间的阻塞，每次writeToClient都有一个最多写入量，如果客户端缓冲超过这个量，那么将会把剩下的放到ServCron中发送，并且这里设置了AE_BARRIER，AE_BARRIER标志表示在eventloop循环中，先处理写事件，在处理读时间，表明此时客户端中的缓冲需要被优先处理。

### 客户端销毁

客户端通过freeClient函数销毁，该函数主要在以下情况下调用：

**1、** 客户端的个数超过了redis设置的最大客户端个数阈值；

**2、** 保护模式下不允许其他机器客户端访问；

**3、** 需要断开从库时，对从库客户端销毁；

**4、** 网络错误，例如读写客户端套接字时发生错误，客户端关闭等；

**5、** 客户端的输出缓冲区达到了redis设置的限制；

**6、** 主从同步时，在数据同步握手阶段发生错误；

```java
void freeClient(client *c) {
    listNode *ln;
    //保护模式下的异步销毁
    if (c->flags & CLIENT_PROTECTED) {
        freeClientAsync(c);
        return;
    }
    //slave销毁master，缓存master
    if (server.master && c->flags & CLIENT_MASTER) {
        serverLog(LL_WARNING,"Connection with master lost.");
        if (!(c->flags & (CLIENT_CLOSE_AFTER_REPLY|
                          CLIENT_CLOSE_ASAP|
                          CLIENT_BLOCKED)))
        {
            replicationCacheMaster(c);
            return;
        }
    }
    //slave断开
    if ((c->flags & CLIENT_SLAVE) && !(c->flags & CLIENT_MONITOR)) {
        serverLog(LL_WARNING,"Connection with replica %s lost.",
            replicationGetSlaveName(c));
    }
    //释放输入缓冲区
    sdsfree(c->querybuf);
    sdsfree(c->pending_querybuf);
    c->querybuf = NULL;
    //改变阻塞状态
    if (c->flags & CLIENT_BLOCKED) unblockClient(c);
    dictRelease(c->bpop.keys);
    //释放watch的键
    unwatchAllKeys(c);
    listRelease(c->watched_keys);
    //释放订阅发布
    pubsubUnsubscribeAllChannels(c,0);
    pubsubUnsubscribeAllPatterns(c,0);
    dictRelease(c->pubsub_channels);
    listRelease(c->pubsub_patterns);
    //释放输出缓冲
    listRelease(c->reply);
    //释放当前的命令
    freeClientArgv(c);
    //释放客户端的网络连接
    unlinkClient(c);
    //当客户端处于主从同步状态
    if (c->flags & CLIENT_SLAVE) {
        //正在接受rdb，则释放连接和接收到的rdb
        if (c->replstate == SLAVE_STATE_SEND_BULK) {
            if (c->repldbfd != -1) close(c->repldbfd);
            if (c->replpreamble) sdsfree(c->replpreamble);
        }
        //从server的master或者slave列表中移除该客户端
        list *l = (c->flags & CLIENT_MONITOR) ? server.monitors : server.slaves;
        ln = listSearchKey(l,c);
        serverAssert(ln != NULL);
        listDelNode(l,ln);
        //更新server相关属性
        if (c->flags & CLIENT_SLAVE && listLength(server.slaves) == 0)
            server.repl_no_slaves_since = server.unixtime;
        refreshGoodSlavesCount();
    }
    //处理master失联
    if (c->flags & CLIENT_MASTER) replicationHandleMasterDisconnection();
    //客户端立即关闭
    if (c->flags & CLIENT_CLOSE_ASAP) {
        ln = listSearchKey(server.clients_to_close,c);
        serverAssert(ln != NULL);
        listDelNode(server.clients_to_close,ln);
    }
    if (c->name) decrRefCount(c->name);
    zfree(c->argv);
    //释放事务
    freeClientMultiState(c);
    sdsfree(c->peerid);
    zfree(c);
}
```

至此，从客户端与服务端建立连接，接着发送命令，到server处理命令，在将命令的处理结果发送回客户端，最后客户端销毁的整个过程已经完成。
