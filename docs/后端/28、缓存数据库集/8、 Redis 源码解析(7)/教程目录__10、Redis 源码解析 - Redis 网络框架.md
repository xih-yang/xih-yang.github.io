# 10、Redis 源码解析 - Redis 网络框架
- 来源：https://ddkk.com/zhuanlan/db/redis/7/10.html
- 分类：缓存数据库
- 分组：教程目录
**redis网络部分是一个单线程,事件驱动,基于reactor模式实现的网络框架.**

redis把所有的事件分为两类,**文件事件与时间事件**.文件事件其实就是套接字事件,也就是服务器accept了一个fd以后,这个fd上到来的事件.而时间事件我们可以简单的看为定时时间,**redis中这里的实现很有意思,不同于以前看过的网络框架中定时时间采用事件驱动来保证执行,这里则是为IO multiplex指定一个超时时间,这个时间是所有定时时间距现在最短的那一个,这样也可以保证在没有文件事件到来的情况下定时事件可以执行**,具体可以看下面的源码解析.

这篇文章将会以以下顺序来解析,这些基本可以把redis网络部分说清楚

**1、** 两种事件的结构与事件循环结构`aeTimeEvent,aeFileEvent,aeEventLoop`；

**2、** 创建两种事件的函数`aeCreateEventLoop,aeCreateTimeEvent`；

**3、** IO多路复用的事件循环主体`aeProcessEvents`；

**4、** 事件处理器,即各种对于各种情况的回调函数`acceptTcpHandler,readQueryFromClient,sendReplyToClient`,分别是对accept,read,write的封装；

我们可以通过上面的这些话看出redis中的网络模块确实说不上复杂,就是一个语义很明确的单线程reactor模型,服务器帮我们做了accept,read,write,我们只需要在其中注册接收了数据以后的回调即可,剩下的事情网络框架就可以帮我们了.redis每个部分都是很独立的模块,我们甚至可以把这部分单独拿出去当做一个单线程的网络框架来使用,本来想单独拿出来玩玩,看看如何把他当做一个网络库使用,但是[刘欢学长](https://github.com/hurley25/ANet)已经做了这件事情,他完成了应用层buffer以及应用层协议的编写,用redis网络部分完成了一个简单的聊天小程序.然后又发现[杨博东学长](https://blog.csdn.net/yangbodong22011/article/details/65444273)也完成了对于这个程序的分析,那我就沾沾前人的光,学习一下他们的成果,不另起炉灶了重新写了.

说回正题,现在开始解析源码了

#### aeTimeEvent, aeFileEvent, aeEventLoop

这里其实就是起一个介绍,具体其中的功能不用细究,由后面的函数反推这里的功能,这样印象可以更加深刻.

```java
typedef struct aeFileEvent {
    // 监听事件类型掩码，
    // 值可以是 AE_READABLE 或 AE_WRITABLE ，
    // 或者 AE_READABLE | AE_WRITABLE
    int mask; /* one of AE_(READABLE|WRITABLE) */
//typedef void aeFileProc(struct aeEventLoop *eventLoop, int fd, void *clientData, int mask);
    // 读事件处理器 一般设置为readQueryFromClient
    aeFileProc *rfileProc;
    // 写事件处理器 一般设置为sendReplyToClient
    aeFileProc *wfileProc;
    // 多路复用库的私有数据 一般为redisClient(redis.h) 为客户端维护一个状态
    void *clientData;
} aeFileEvent;
/* Time event structure
 *
 * 时间事件结构
 */
typedef struct aeTimeEvent {
    // 时间事件的唯一标识符
    long long id; /* time event identifier. */
    // 事件的到达时间
    long when_sec; /* seconds */
    long when_ms; /* milliseconds */
    // 事件处理函数
    aeTimeProc *timeProc;
    // 事件释放函数
    aeEventFinalizerProc *finalizerProc;
    // 多路复用库的私有数据
    void *clientData;
    // 指向下个时间事件结构 形成链表 实现为无序链表 但是其中事件一般不多 
    struct aeTimeEvent *next;
} aeTimeEvent;
/* A fired event
 *
 * 已就绪事件 就是epoll_wait接收到的所有事件的fd以及此次触发的mask
 */
typedef struct aeFiredEvent {
    // 已就绪文件描述符
    int fd;
    // 事件类型掩码，
    // 值可以是 AE_READABLE 或 AE_WRITABLE
    // 或者是两者的或
    int mask;
} aeFiredEvent;
/* State of an event based program 
 *
 * 事件处理器的状态
 */
typedef struct aeEventLoop {
    // 目前已注册的最大描述符
    int maxfd;   /* highest file descriptor currently registered */
    // 目前已追踪的最大描述符
    int setsize; /* max number of file descriptors tracked */
    // 用于生成时间事件 id 用于定时事件
    long long timeEventNextId;
    // 最后一次执行时间事件的时间
    time_t lastTime;     /* Used to detect system clock skew */
    // 已注册的文件事件 这样的设计可以使我们可以用fdO(1)找到结构体
    aeFileEvent *events; /* Registered events */
    // 放置epoll_wait中已就绪的文件事件
    aeFiredEvent *fired; /* Fired events */
    // 时间事件
    aeTimeEvent *timeEventHead;
    // 事件处理器的开关
    int stop;
    // 多路复用库的私有数据 存放epoll的数据结构,当然还可以是其他 结构为aeApiState(ae_epoll.c)
    // redis中对于IO多路复用的使用其实是一个可拔插式的设计,也可以使用其他的方法 机器里存在epoll便优先使用
    void *apidata; /* This is used for polling API specific data */
    // 在处理事件前要执行的函数
    aeBeforeSleepProc *beforesleep;
} aeEventLoop;
```

#### aeCreateEventLoop,aeCreateTimeEvent

这两个函数分别在Eventloop中插入一个文件事件和时间事件

```java
//这里可以看到参数中是有一个fd的,也就是说其实此时fd已经被accept了,所以这个函数也会封装的accept回调中出现
int aeCreateFileEvent(aeEventLoop *eventLoop, int fd, int mask,
        aeFileProc *proc, void *clientData)
{
    if (fd >= eventLoop->setsize) {
      //eventLoop->setsize为事件数组的大小
        errno = ERANGE;
        return AE_ERR;
    }
    //if (fd >= eventLoop->setsize) return AE_ERR;
    // O(1)取出文件事件结构
    aeFileEvent *fe = &eventLoop->events[fd];
    // 即把fd关联到epoll中 根据mask注册事件类型 其实就是调用epoll_ctl
    if (aeApiAddEvent(eventLoop, fd, mask) == -1)
        return AE_ERR;
    // 设置文件事件类型，以及事件的处理器
    fe->mask |= mask;
    if (mask & AE_READABLE) fe->rfileProc = proc;
    if (mask & AE_WRITABLE) fe->wfileProc = proc;
    // 私有数据
    fe->clientData = clientData;
    // 如果有需要，更新事件处理器的最大 fd
    if (fd > eventLoop->maxfd)
        eventLoop->maxfd = fd;
    return AE_OK;
}
```

```java
long long aeCreateTimeEvent(aeEventLoop *eventLoop, long long milliseconds,
        aeTimeProc *proc, void *clientData,
        aeEventFinalizerProc *finalizerProc)
{
    // 更新ID记录
    long long id = eventLoop->timeEventNextId++;
    // 创建时间事件结构
    aeTimeEvent *te;
    te = zmalloc(sizeof(*te));
    if (te == NULL) return AE_ERR;
    // 设置 ID
    te->id = id;
    // 设定处理事件的时间 milliseconds后触发
    aeAddMillisecondsToNow(milliseconds,&te->when_sec,&te->when_ms);
    // 设置事件处理器
    te->timeProc = proc;
    te->finalizerProc = finalizerProc;
    // 设置私有数据
    te->clientData = clientData;
    // 将新事件放入表头
    te->next = eventLoop->timeEventHead;
    eventLoop->timeEventHead = te;
    //返回此事件的ID
    return id;
}
```

对于定时事件这里要说一点,就是其实redis中定时事件是很少的,一般情况下只使用`serverCron`这个定时事件来定期对自身资源与状态进行检查.

#### aeProcessEvents

```java
int aeProcessEvents(aeEventLoop *eventLoop, int flags)
{
    int processed = 0, numevents;
    /* Nothing to do? return ASAP */ //所触发事件类型我们并没有注册
    if (!(flags & AE_TIME_EVENTS) && !(flags & AE_FILE_EVENTS)) return 0;
    /* Note that we want call select() even if there are no
     * file events to process as long as we want to process time
     * events, in order to sleep until the next time event is ready
     * to fire. */
        //不等于-1代表当前存在正在监听的套接字
    if (eventLoop->maxfd != -1 ||
        ((flags & AE_TIME_EVENTS) && !(flags & AE_DONT_WAIT))) {
        int j;
        aeTimeEvent *shortest = NULL;
        struct timeval tv, *tvp;
        // 获取距离现在时间戳最近的时间事件
        if (flags & AE_TIME_EVENTS && !(flags & AE_DONT_WAIT))
            shortest = aeSearchNearestTimer(eventLoop);
        if (shortest) {
            // 如果时间事件存在的话
            // 那么根据最近可执行时间事件和现在时间的时间差来决定文件事件的阻塞时间
            long now_sec, now_ms;
            /* Calculate the time missing for the nearest
             * timer to fire. */
            // 计算距今最近的时间事件还要多久才能达到
            // 并将该时间距保存在 tv 结构中
            aeGetTime(&now_sec, &now_ms);
            tvp = &tv;
            tvp->tv_sec = shortest->when_sec - now_sec;
            if (shortest->when_ms < now_ms) {
                tvp->tv_usec = ((shortest->when_ms+1000) - now_ms)*1000;
                tvp->tv_sec --;
            } else {
                tvp->tv_usec = (shortest->when_ms - now_ms)*1000;
            }
            // 时间差小于 0 ，说明事件已经可以执行了，将秒和毫秒设为 0 （不阻塞）
            if (tvp->tv_sec < 0) tvp->tv_sec = 0;
            if (tvp->tv_usec < 0) tvp->tv_usec = 0;
        } else {
            // 执行到这一步，说明没有时间事件
            // 那么根据 AE_DONT_WAIT 是否设置来决定是否阻塞，以及阻塞的时间长度
            /* If we have to check for events but need to return
             * ASAP because of AE_DONT_WAIT we need to set the timeout
             * to zero */
            if (flags & AE_DONT_WAIT) {
                // 设置文件事件不阻塞
                tv.tv_sec = tv.tv_usec = 0;
                tvp = &tv;
            } else {
                /* Otherwise we can block */
                // 文件事件可以阻塞直到有事件到达为止
                tvp = NULL; /* wait forever */
            }
        }
        // 处理文件事件,执行epoll_wait,就绪链表存在fired中 阻塞时间由 tvp 决定
        // 这样也可以保证epoll_wait不会阻塞太长时间
        // 且在一段时间没有来文件事件的话也可以正常进行时间事件,
        // 这里redis的实现就非常巧妙,以前的见过网络框架的做法是时间事件由定时器驱动 触发epoll去执行
        // redis的这样实现显然提高了效率  就算是大量的定时事件换个数据结构(时间轮)也完全hold得住
        numevents = aeApiPoll(eventLoop, tvp); //下面细说 做的事情就是把epoll_wait中就绪事件放到fired中
        for (j = 0; j < numevents; j++) {
            // 从已就绪数组中获取事件
            aeFileEvent *fe = &eventLoop->events[eventLoop->fired[j].fd];
            int mask = eventLoop->fired[j].mask;
            int fd = eventLoop->fired[j].fd;
            int rfired = 0;
           /* note the fe->mask & mask & ... code: maybe an already processed
             * event removed an element that fired and we still didn't
             * processed, so we check if the event is still valid. */
            // 读事件
            if (fe->mask & mask & AE_READABLE) {
                // rfired 确保读/写事件只能执行其中一个
                rfired = 1;
                fe->rfileProc(eventLoop,fd,fe->clientData,mask);
            }
            // 写事件
            if (fe->mask & mask & AE_WRITABLE) {
                if (!rfired || fe->wfileProc != fe->rfileProc)
                    fe->wfileProc(eventLoop,fd,fe->clientData,mask);
            }
            processed++;
        }
    }
    /* Check time events */
    // 执行时间事件 一般也就是serverCron
    if (flags & AE_TIME_EVENTS)
        processed += processTimeEvents(eventLoop);
    return processed; /* return the number of processed file/time events */
}
static int aeApiPoll(aeEventLoop *eventLoop, struct timeval *tvp) {
    aeApiState *state = eventLoop->apidata;
    int retval, numevents = 0;
    // 等待就绪时间 超时时间为tvp 当定时时间已经OK的时候不阻塞
    retval = epoll_wait(state->epfd,state->events,eventLoop->setsize,
            tvp ? (tvp->tv_sec*1000 + tvp->tv_usec/1000) : -1);
    // 有至少一个事件就绪就把事件的fd与mask放入fired中
    if (retval > 0) {
        int j;
        // 为已就绪事件设置相应的模式
        // 并加入到 eventLoop 的 fired 数组中
        numevents = retval;
        for (j = 0; j < numevents; j++) {
            int mask = 0;
            struct epoll_event *e = state->events+j;
            if (e->events & EPOLLIN) mask |= AE_READABLE;
            if (e->events & EPOLLOUT) mask |= AE_WRITABLE;
            if (e->events & EPOLLERR) mask |= AE_WRITABLE;
            if (e->events & EPOLLHUP) mask |= AE_WRITABLE;
            eventLoop->fired[j].fd = e->data.fd;
            eventLoop->fired[j].mask = mask;
        }
    }
    // 返回已就绪事件个数
    return numevents;
}
```

#### acceptTcpHandler

```java
//我们可以看到这个函数的参数列表和aeFileEvent中回调aeFileProc的类型相同 这个函数也一般放在哪里
void acceptTcpHandler(aeEventLoop *el, int fd, void *privdata, int mask) {
    int cport, cfd, max = MAX_ACCEPTS_PER_CALL; //max = 1000
    char cip[REDIS_IP_STR_LEN];//记录IP
    REDIS_NOTUSED(el);
    REDIS_NOTUSED(mask);
    REDIS_NOTUSED(privdata);
    while(max--) {
      //最多一次接收1000个连接 这里防止一个accept占用太多时间 因为redis是单线程的 需要给后面的事件让出时间
        // 内部使用accept接收新连接 然后填充cip和端口 返回fd 
        cfd = anetTcpAccept(server.neterr, fd, cip, sizeof(cip), &cport);
        if (cfd == ANET_ERR) {
            if (errno != EWOULDBLOCK)
                redisLog(REDIS_WARNING,
                    "Accepting client connection: %s", server.neterr);
            return;
        }
        redisLog(REDIS_VERBOSE,"Accepted %s:%d", cip, cport);
        // 为客户端创建客户端状态（redisClient）
        acceptCommonHandler(cfd,0); //把fd变为一个文件事件 并注册回调 回调为把fd中数据取出 放入到clientData中
    }
}
static void acceptCommonHandler(int fd, int flags) {
    // 创建客户端
    redisClient *c; //createClient是核心 负责向eventloop中注册一个文件事件 即调用aeCreateFileEvent
    if ((c = createClient(fd)) == NULL) {
        redisLog(REDIS_WARNING,
            "Error registering fd event for the new client: %s (fd=%d)",
            strerror(errno),fd);
        close(fd); /* May be already closed, just ignore errors */
        return;
    }
    /* If maxclient directive is set and this is one client more... close the
     * connection. Note that we create the client instead to check before
     * for this condition, since now the socket is already set in non-blocking
     * mode and we can send an error for free using the Kernel I/O */
    // 如果新添加的客户端令服务器的最大客户端数量达到了
    // 那么向新客户端写入错误信息，并关闭新客户端
    // 先创建客户端，再进行数量检查是为了方便地进行错误信息写入
    // 其实就是对busyloop的处理
    // 一般处理busyloop有两种方法
    // 1.连接数超过某个数后拒绝连接,也是redis的做法
    // 2.服务器中创建一个fd,用在accept失败原因为文件描述符不足时,把原来的 fd close,再accept一遍,然后close,
    //   让客户端接收到断开的信息,这样做在多线程中会发生竞态条件.解决方法是每一个线程都打开一个文件描述符.
    if (listLength(server.clients) > server.maxclients) {
        char *err = "-ERR max number of clients reached\r\n";
        /* That's a best effort error message, don't check write errors */
        if (write(c->fd,err,strlen(err)) == -1) {
            /* Nothing to do, Just to avoid the warning... */
        }
        // 更新拒绝连接数
        server.stat_rejected_conn++;
        freeClient(c); //释放客户端
        return;
    }
    // 更新连接次数
    server.stat_numconnections++;
    // 设置 FLAG
    c->flags |= flags;
}
redisClient *createClient(int fd) {
    // 分配空间
    redisClient *c = zmalloc(sizeof(redisClient));
    /* passing -1 as fd it is possible to create a non connected client.
     * This is useful since all the Redis commands needs to be executed
     * in the context of a client. When commands are executed in other
     * contexts (for instance a Lua script) we need a non connected client. */
    // 当 fd 不为 -1 时，创建带网络连接的客户端
    // 如果 fd 为 -1 ，那么创建无网络连接的伪客户端
    // 因为 Redis 的命令必须在客户端的上下文中使用，所以在执行 Lua 环境中的命令时
    // 需要用到这种伪终端
    if (fd != -1) {
        // 非阻塞
        anetNonBlock(NULL,fd); 
        // 禁用 Nagle 算法 因为服务器这个需要高性能的地方不需要禁止小包 Nagle还可能导致网络上的死锁 使得时延增加
        anetEnableTcpNoDelay(NULL,fd);
        // 设置 keep alive
        if (server.tcpkeepalive) //协议层保活机制
            anetKeepAlive(NULL,fd,server.tcpkeepalive);
        // 绑定读事件到事件 loop （开始接收命令请求）
        if (aeCreateFileEvent(server.el,fd,AE_READABLE,
            readQueryFromClient, c) == AE_ERR) //我们可以看到redisClient放入了aeFileEvent.clientData
        {
            close(fd);
            zfree(c);
            return NULL;
        }
    }
    // 初始化各个属性
........................
	// 如果不是伪客户端，那么添加到服务器的客户端链表中
    if (fd != -1) listAddNodeTail(server.clients,c);
    // 初始化客户端的事务状态
    initClientMultiState(c);
    // 返回客户端
    return c;
}
```

#### readQueryFromClient

其中有两个问题值得注意

**1、** read一次没读完时的策略与其他网络框架的处理不太相同其他网络框架会循环读取但redis会在读取一次后把缓冲区转为命令和命令参数转换失败的话会在下次事件循环中重新读取,在`processInputBuffer`中可以看到；

**2、** 为了一次读取不会阻塞服务器会在read超过server.client_max_querybuf_len时停止读取.但在服务器内存不足的时候,会继续,为了能尽快释放内存.；

```java
void readQueryFromClient(aeEventLoop *el, int fd, void *privdata, int mask) {
    redisClient *c = (redisClient*) privdata;//privdate为client链表中的客户信息
    int nread, readlen;
    size_t qblen;
    REDIS_NOTUSED(el);
    REDIS_NOTUSED(mask);
    // 设置服务器的当前客户端
    server.current_client = c;
    // 读入长度（默认为 16 MB）
    readlen = REDIS_IOBUF_LEN;
    /* If this is a multi bulk request, and we are processing a bulk reply
     * that is large enough, try to maximize the probability that the query
     * buffer contains exactly the SDS string representing the object, even
     * at the risk of requiring more read(2) calls. This way the function
     * processMultiBulkBuffer() can avoid copying buffers to create the
     * Redis Object representing the argument. */
    if (c->reqtype == REDIS_REQ_MULTIBULK && c->multibulklen && c->bulklen != -1
        && c->bulklen >= REDIS_MBULK_BIG_ARG)
    {
        int remaining = (unsigned)(c->bulklen+2)-sdslen(c->querybuf);
        if (remaining < readlen) readlen = remaining;
    }
    // 获取查询缓冲区当前内容的长度
    // 如果读取出现 short read ，那么可能会有内容滞留在读取缓冲区里面
    // 这些滞留内容也许不能完整构成一个符合协议的命令，
    qblen = sdslen(c->querybuf);
    // 如果有需要，更新缓冲区内容长度的峰值（peak）
    if (c->querybuf_peak < qblen) c->querybuf_peak = qblen;
    // 为查询缓冲区分配空间
    c->querybuf = sdsMakeRoomFor(c->querybuf, readlen);
    // 读入内容到查询缓存
    nread = read(fd, c->querybuf+qblen, readlen);
    // 读入出错
    if (nread == -1) {
        if (errno == EAGAIN) {
            nread = 0;
        } else {
            redisLog(REDIS_VERBOSE, "Reading from client: %s",strerror(errno));
            freeClient(c);
            return;
        }
    // 遇到 EOF
    } else if (nread == 0) {
        redisLog(REDIS_VERBOSE, "Client closed connection");
        freeClient(c); //正常的客户端断开连接
        return;
    }
    if (nread) {
        // 根据内容，更新查询缓冲区（SDS） free 和 len 属性
        // 并将 '\0' 正确地放到内容的最后
        sdsIncrLen(c->querybuf,nread);
        // 记录服务器和客户端最后一次互动的时间
        c->lastinteraction = server.unixtime;
        // 如果客户端是 master 的话,更新它的复制偏移量,便于进行部分重同步,增加从服务器重启的效率
        if (c->flags & REDIS_MASTER) c->reploff += nread;
    } else {
        // 在 nread == -1 且 errno == EAGAIN 时运行
        server.current_client = NULL;
        return;
    }
    // 当写入大于数据大于client_max_querybuf_len的时候会关闭客户端
    if (sdslen(c->querybuf) > server.client_max_querybuf_len) {
        sds ci = catClientInfoString(sdsempty(),c), bytes = sdsempty();
        bytes = sdscatrepr(bytes,c->querybuf,64);
        redisLog(REDIS_WARNING,"Closing client that reached max query buffer length: %s (qbuf initial bytes: %s)", ci, bytes);
        sdsfree(ci);
        sdsfree(bytes);
        freeClient(c);
        return;
    }
    // 从查询缓存重读取内容，创建参数，并执行命令 转换失败的话会在下次事件循环中再次读取 成功的话执行processCommand
    // 函数会执行到缓存中的所有内容都被处理完为止
    // 这里单独放一篇文章来说说 这篇就不细谈了
    processInputBuffer(c);
    server.current_client = NULL;
}
```

#### sendReplyToClient

```java
void sendReplyToClient(aeEventLoop *el, int fd, void *privdata, int mask) {
    redisClient *c = privdata;
    int nwritten = 0, totwritten = 0, objlen;
    size_t objmem;
    robj *o;
    REDIS_NOTUSED(el);
    REDIS_NOTUSED(mask);
    // 一直循环，直到回复缓冲区为空
    // 或者指定条件满足为止
    while(c->bufpos > 0 || listLength(c->reply)) {
        if (c->bufpos > 0) {
      //数据存在固定缓冲区中 16KB
            // c->bufpos > 0
            // 写入内容到套接字
            // c->sentlen 是用来处理 short write 的
            // 当出现 short write ，导致写入未能一次完成时，
            // c->buf+c->sentlen 就会偏移到正确（未写入）内容的位置上。
            nwritten = write(fd,c->buf+c->sentlen,c->bufpos-c->sentlen);
            // 出错则跳出
            if (nwritten <= 0) break;
            // 成功写入则更新写入计数器变量
            c->sentlen += nwritten;
            totwritten += nwritten;
            /* If the buffer was sent, set bufpos to zero to continue with
             * the remainder of the reply. */
            // 如果缓冲区中的内容已经全部写入完毕
            // 那么清空客户端的两个计数器变量
            if (c->sentlen == c->bufpos) {
                c->bufpos = 0;
                c->sentlen = 0;
            }
        } else {
      //数据存在可变缓冲中 redisclient.reply 数据结构为字符串链表
            // listLength(c->reply) != 0
            // 取出位于链表最前面的对象
            o = listNodeValue(listFirst(c->reply));
            objlen = sdslen(o->ptr);
            objmem = getStringObjectSdsUsedMemory(o);
            // 略过空对象
            if (objlen == 0) {
                listDelNode(c->reply,listFirst(c->reply));
                c->reply_bytes -= objmem;
                continue;
            }
            // 写入内容到套接字
            // c->sentlen 是用来处理 short write 的
            // 当出现 short write ，导致写入未能一次完成时，
            // c->buf+c->sentlen 就会偏移到正确（未写入）内容的位置上。
            nwritten = write(fd, ((char*)o->ptr)+c->sentlen,objlen-c->sentlen);
            // 写入出错则跳出
            if (nwritten <= 0) break;
            // 成功写入则更新写入计数器变量
            c->sentlen += nwritten;
            totwritten += nwritten;
            /* If we fully sent the object on head go to the next one */
            // 如果缓冲区内容全部写入完毕，那么删除已写入完毕的节点
            if (c->sentlen == objlen) {
                listDelNode(c->reply,listFirst(c->reply));
                c->sentlen = 0;
                c->reply_bytes -= objmem;
            }
        }
        /* Note that we avoid to send more than REDIS_MAX_WRITE_PER_EVENT
         * bytes, in a single threaded server it's a good idea to serve
         * other clients as well, even if a very large request comes from
         * super fast link that is always able to accept data (in real world
         * scenario think about 'KEYS *' against the loopback interface).
         *
         * 为了避免一个非常大的回复独占服务器，
         * 当写入的总数量大于 REDIS_MAX_WRITE_PER_EVENT ，
         * 临时中断写入，将处理时间让给其他客户端，
         * 剩余的内容等下次写入就绪再继续写入
         *
         * However if we are over the maxmemory limit we ignore that and
         * just deliver as much data as it is possible to deliver. 
         *
         * 不过，如果服务器的内存占用已经超过了限制，
         * 那么为了将回复缓冲区中的内容尽快写入给客户端，
         * 然后释放回复缓冲区的空间来回收内存，
         * 这时即使写入量超过了 REDIS_MAX_WRITE_PER_EVENT ，
         * 程序也继续进行写入
         */
        // 与read时的策略一致
        if (totwritten > REDIS_MAX_WRITE_PER_EVENT &&
            (server.maxmemory == 0 ||
             zmalloc_used_memory() < server.maxmemory)) break;
    }
    // 写入出错检查
    if (nwritten == -1) {
        if (errno == EAGAIN) {
            nwritten = 0;
        } else {
            redisLog(REDIS_VERBOSE,
                "Error writing to client: %s", strerror(errno));
            freeClient(c);
            return;
        }
    }
    if (totwritten > 0) {
        /* For clients representing masters we don't count sending data
         * as an interaction, since we always send REPLCONF ACK commands
         * that take some time to just fill the socket output buffer.
         * We just rely on data / pings received for timeout detection. */
        if (!(c->flags & REDIS_MASTER)) c->lastinteraction = server.unixtime;
    }
    if (c->bufpos == 0 && listLength(c->reply) == 0) {
        c->sentlen = 0;
        // 删除 write handler
        aeDeleteFileEvent(server.el,c->fd,AE_WRITABLE);
        /* Close connection after entire reply has been sent. */
        // 如果指定了写入之后关闭客户端 FLAG ，那么关闭客户端
        if (c->flags & REDIS_CLOSE_AFTER_REPLY) freeClient(c);
    }
}
```

我们再说说关闭客户端的事情,其实就是调用`freeClient`,在以下时候会调用

**1、** 网络连接关闭,因为redis会把从epoll接收到的EPOLLHUP转化为可写事件,所以事件循环的中的判断需要改为读入字节为0.(readQueryFromClient)；

**2、** 读入的字节超过server.client_max_querybuf_len时关闭客户端.(readQueryFromClient)；

**3、** 执行CLIENTKILL命令的时候(networking.clientCommand)；

**4、** 把缓冲区的数据写回客户端失败的时候(sendReplyToClient)；

**5、** 某个客户端空转时间超时的时候；
