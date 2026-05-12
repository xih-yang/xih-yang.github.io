# 33、Redis 源码解析 - Redis 命令执行过程
- 来源：https://ddkk.com/zhuanlan/db/redis/5/33.html
- 分类：缓存数据库
- 分组：教程目录
经过我们长时间的不懈努力，终于将数据类型和数据结构相关的源代码学习结束，今天开始新一阶段的学习，本节要学习的内容是命令的执行过程，探究我们平常输入的一个 Redis 命令到底是怎么执行的。

### 1 入口函数

我们知道 c 语言一般都会有个入口函数 main 函数，所以我们先从入口函数下手。

#### 1.1 主要代码

该函数在 redis.c 文件中。

```java
int main(int argc, char **argv) {
	...
    initServerConfig();// 初始化配置
    ...
    initServer();// 初始化服务器
    ...
    aeMain(server.el); // 主循环方法
}
```

源代码中 main 函数有很多代码，为了更好研究执行过程，我们先看看主要的几个方法。

### 2 命令加载

```java
    // redis.c 
	void initServerConfig(void) {
	    int j;
	    ...
	    server.commands = dictCreate(&commandTableDictType,NULL);
	    server.orig_commands = dictCreate(&commandTableDictType,NULL);
	    populateCommandTable();
	    ...
    }
```

```java
	 // redis.c 
	void populateCommandTable(void) {
	    int j;
	    int numcommands = sizeof(redisCommandTable)/sizeof(struct redisCommand);
	    for (j = 0; j < numcommands; j++) {
	        struct redisCommand *c = redisCommandTable+j;
	        char *f = c->sflags;
	        int retval1, retval2;
	                retval1 = dictAdd(server.commands, sdsnew(c->name), c);
	        /* Populate an additional dictionary that will be unaffected
	         * by rename-command statements in redis.conf. */
	        retval2 = dictAdd(server.orig_commands, sdsnew(c->name), c);
	        redisAssert(retval1 == DICT_OK && retval2 == DICT_OK);
	    }
	}
```

在初始化配置的时候，redis 会创建两个全局属性用来存储可以执行的命令 server.commands 和 server.orig_commands， 然后通过 populateCommandTable 方法循环将命令全部添加到两个全局属性中。

### 3 创建事件驱动

#### 3.1 创建事件驱动

```java
	// redis.c 
	void initServer(void) {
		...
		// 创建epoll
		server.el = aeCreateEventLoop(server.maxclients+REDIS_EVENTLOOP_FDSET_INCR);
		// 创建事件驱动,绑定事件 acceptTcpHandler
	    for (j = 0; j < server.ipfd_count; j++) {
	        if (aeCreateFileEvent(server.el, server.ipfd[j], AE_READABLE,
	            acceptTcpHandler,NULL) == AE_ERR)
	            {
	                redisPanic(
	                    "Unrecoverable error creating server.ipfd file event.");
	            }
	    }
	}
```

在initServer 方法中，我们可以看到 redis 创建了 epoll 对象用来处理网络 io 事件，并且对每个对象绑定了 acceptTcpHandler 方法。

#### 3.2 acceptTcpHandler

```java
	// networking.c
	void acceptTcpHandler(aeEventLoop *el, int fd, void *privdata, int mask) {
	    int cport, cfd, max = MAX_ACCEPTS_PER_CALL;
	    char cip[REDIS_IP_STR_LEN];
	    REDIS_NOTUSED(el);
	    REDIS_NOTUSED(mask);
	    REDIS_NOTUSED(privdata);
	    while(max--) {
	        cfd = anetTcpAccept(server.neterr, fd, cip, sizeof(cip), &cport);
	        if (cfd == ANET_ERR) {
	            if (errno != EWOULDBLOCK)
	                redisLog(REDIS_WARNING,
	                    "Accepting client connection: %s", server.neterr);
	            return;
	        }
	        redisLog(REDIS_VERBOSE,"Accepted %s:%d", cip, cport);
	        acceptCommonHandler(cfd,0);
	    }
	}
```

#### 3.3 acceptCommonHandler

```java
	// networking.c
	static void acceptCommonHandler(int fd, int flags) {
	    redisClient *c;
	    if ((c = createClient(fd)) == NULL) {
	        redisLog(REDIS_WARNING,
	            "Error registering fd event for the new client: %s (fd=%d)",
	            strerror(errno),fd);
	        close(fd); /* May be already closed, just ignore errors */
	        return;
	    }
	    ...
	}
```

#### 3.4 createClient

```java
	redisClient *createClient(int fd) {
	    redisClient *c = zmalloc(sizeof(redisClient));
		// 绑定读事件 readQueryFromClient
        if (aeCreateFileEvent(server.el,fd,AE_READABLE,
            readQueryFromClient, c) == AE_ERR)
        {
            close(fd);
            zfree(c);
            return NULL;
        }
    }
```

#### 3.5 小结

熟悉 epoll 的知道一般连接有 3 种类型的事件，连接事件、读事件、写事件，在结合上面的代码我们可以总结出以下知识点。

**1、** redis在初始化的时候会给每个连接事件绑定一个acceptTcpHandler方法；

**2、** acceptTcpHandler方法用来初始化连接，并且调用createClient来创建一个客户端信息；

**3、** createClient方法会给这个客户端的连接套接字绑定readQueryFromClient方法用来专门处理读信息；

### 4 主循环

#### 4.1 aeMain

```java
	// ae.c
	void aeMain(aeEventLoop *eventLoop) {
	    eventLoop->stop = 0;
	    while (!eventLoop->stop) {
	        if (eventLoop->beforesleep != NULL)
	            eventLoop->beforesleep(eventLoop);
	        aeProcessEvents(eventLoop, AE_ALL_EVENTS);
	    }
	}
```

初始化全部结束之后，会进入 aeMain 方法进行主循环逻辑中，调用 aeProcessEvents 处理事件。

#### 4.2 aeProcessEvents

```java
int aeProcessEvents(aeEventLoop *eventLoop, int flags)
{
	...
	 // 如果是读事件，则调用读事件绑定方法
     if (fe->mask & mask & AE_READABLE) {
          rfired = 1;
          fe->rfileProc(eventLoop,fd,fe->clientData,mask);
      }
      // 若果是写事件，则调用写事件绑定方法
      if (fe->mask & mask & AE_WRITABLE) {
          if (!rfired || fe->wfileProc != fe->rfileProc)
              fe->wfileProc(eventLoop,fd,fe->clientData,mask);
      }
      ...
}
```

在主循环中，主要是调用 aeProcessEvents 来处理各种事件，里面关于每个连接的事件绑定的事件是通过 aeCreateFileEvent 方法来绑定的。

### 5 执行命令

#### 5.1 获取输入内容

```java
	// networking.c
	void readQueryFromClient(aeEventLoop *el, int fd, void *privdata, int mask) {
		...
		// 处理输入 buffer
		processInputBuffer(c);
		...
	}
```

```java
	// networking.c
	void processInputBuffer(redisClient *c) {
		/* Keep processing while there is something in the input buffer */
	    while(sdslen(c->querybuf)) {
	        /* Multibulk processing could see a <= 0 length. */
	        if (c->argc == 0) {
	            resetClient(c);
	        } else {
	            /* Only reset the client when the command was executed. */
	            if (processCommand(c) == REDIS_OK)
	                resetClient(c);
	            /* freeMemoryIfNeeded may flush slave output buffers. This may result
	             * into a slave, that may be the active client, to be freed. */
	            if (server.current_client == NULL) break;
	        }
	    }
	}
```

#### 5.2 处理命令

```java
	// redis.c
	int processCommand(redisClient *c) {
		...
		// 获取命令
		c->cmd = c->lastcmd = lookupCommand(c->argv[0]->ptr);
		...
		// 执行命令
		call(c,REDIS_CALL_FULL);
	}
```

```java
	// redis.c
	void call(redisClient *c, int flags) {
		...
		c->cmd->proc(c);
		...
	}
```

### 6 总结

**1、** 函数入口在redis.c的main方法中；

**2、** 命令存储在server.command中；

**3、** 连接事件会绑定acceptTcpHandler方法；

**4、** 读事件会绑定readQueryFromClient方法；

**5、** 整体流程：绑定连接事件、绑定读事件、触发读事件、分析输入内容、获取命令、找到命令对应执行方法、执行命令；

### 7 补充

本节主要是学习一个命令如何完整执行的，所以里面涉及的代码和方法比较多，里面还涉及了 epoll ，所以一时可能无法全部理解，不过具体的方法可以在后面慢慢细研究，今天主要是学习一个大概的流程。
