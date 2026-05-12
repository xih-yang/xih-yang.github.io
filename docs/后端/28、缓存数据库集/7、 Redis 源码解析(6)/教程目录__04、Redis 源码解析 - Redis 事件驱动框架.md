# 04、Redis 源码解析 - Redis 事件驱动框架
- 来源：https://ddkk.com/zhuanlan/db/redis/6/4.html
- 分类：缓存数据库
- 分组：教程目录
作为一个服务端节点，首先要能够处理客户端的连接请求，然后从套接字中读取命令并解析处理，这部分由Redis的事件驱动框架处理，事件驱动框架分为两部分：IO事件和时间事件，分别负责处理客户端的网络请求和Redis自身的周期性操作。

IO事件部分是典型的Reactor网络模型，在单线程下，非阻塞IO+IO多路复用的基于事件驱动基本就可以应对海量的连接、读写，同时在集群模式下，尤其是大集群，还用来处理集群间的消息传递。

时间事件与IO事件集成到一起，通过设置epoll_wait的阻塞等待时间来触发。

### 事件驱动启动

在[Redis 源码解析 - Redis 启动流程](/zhuanlan/db/redis/6/3.html)中，与事件驱动框架有关的部分有两处：

**1、** 事件驱动框架的初始化以及套接字监听、时间事件注册：；

```java
void initServer(void) {
	...
	// 事件驱动初始化
	server.el = aeCreateEventLoop(server.maxclients+CONFIG_FDSET_INCR);
    if (server.el == NULL) {
        serverLog(LL_WARNING,
            "Failed creating the event loop. Error message: '%s'",
            strerror(errno));
        exit(1);
    }
	...
	// 时间事件注册:serverCron是要运行的周期性事件
	if (aeCreateTimeEvent(server.el, 1, serverCron, NULL, NULL) == AE_ERR) {
        serverPanic("Can't create event loop timers.");
        exit(1);
    }
    // 套接字监听事件注册：server.ipfd[j]是被监听的套接字
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
}
```

其中server.el是redisServer中的aeEventLoop结构

```java
struct redisServer {
	...
	aeEventLoop *el;
	...
}
```

#### aeEventLoop

aeEventLoop是Reactor模型的具体抽象，将网络事件和时间时间统一到一起处理。

- events以数组的方式管理注册的IO事件，个数为setsize，其中events的下标就是具体的套接字fd。
- fired是发生读写事件的网络事件数组。
- timeEventHead以链表的形式管理已经注册的时间事件。

```java
typedef struct aeEventLoop {
    int maxfd;   /* highest file descriptor currently registered */
    int setsize; /* max number of file descriptors tracked */
    long long timeEventNextId;
    time_t lastTime;     /* Used to detect system clock skew */
    aeFileEvent *events; /* Registered events */
    aeFiredEvent *fired; /* Fired events */
    aeTimeEvent *timeEventHead;
    // 事件循环停止标志
    int stop;
    // 回调函数的执行参数
    void *apidata; /* This is used for polling API specific data */
    aeBeforeSleepProc *beforesleep;
    aeBeforeSleepProc *aftersleep;
} aeEventLoop;
```

aeFileEvent用来管理要注册的IO事件

- mask是事件类型，包括E_READABLE、AE_WRITABLE和AE_BARRIER三种类型事件
- rfileProc和wfileProce分别是指向AE_READABLE和AE_WRITABLE的处理函数
- clientData是对应处理函数的参数

```java
typedef struct aeFileEvent {
    int mask; /* one of AE_(READABLE|WRITABLE|BARRIER) */
    aeFileProc *rfileProc;
    aeFileProc *wfileProc;
    void *clientData;
} aeFileEvent;
```

aeFiredEvent用来管理已经发生的IO事件

- fd是对于事件的套接字句柄
- mast是对于发生的事件类型

```java
typedef struct aeFiredEvent {
    int fd;
    int mask;
} aeFiredEvent;
```

timeEventHead是注册的时间事件列表

- 每个时间事件都有一个事件id，timeEventNextId是下一个要注册的时间事件id。
- when_sec、when_ms是下次事件的发生时间
- timeProc是时间事件的处理函数
- finalizerProc是时间事件注册时的处理函数

```java
typedef struct aeTimeEvent {
    long long id; /* time event identifier. */
    long when_sec; /* seconds */
    long when_ms; /* milliseconds */
    aeTimeProc *timeProc;
    aeEventFinalizerProc *finalizerProc;
    void *clientData;
    struct aeTimeEvent *prev;
    struct aeTimeEvent *next;
} aeTimeEvent;
```

beforesleep和aftersleep是每次事件循坏之前和之后需要执行的函数，apidata封装来具体的IO多路复用的系统调用，linux主要有select、poll、epoll，在Redis代码文件中分别对应ae.select.cc、ae_evport.cc、ae_epoll.cc。在Redis代码文件中还存在ae.kqueue.cc，对应着MacOs下的事件驱动。

下面以epoll为例分析aeEventLoop。

### 事件驱动初始化

aeCreateEventLoop主要对aeEventLoop结构中的各个字段设置，分配

```java
aeEventLoop *aeCreateEventLoop(int setsize) {
    aeEventLoop *eventLoop;
    int i;
    if ((eventLoop = zmalloc(sizeof(*eventLoop))) == NULL) goto err;
    eventLoop->events = zmalloc(sizeof(aeFileEvent)*setsize);
    eventLoop->fired = zmalloc(sizeof(aeFiredEvent)*setsize);
    if (eventLoop->events == NULL || eventLoop->fired == NULL) goto err;
    eventLoop->setsize = setsize;
    eventLoop->lastTime = time(NULL);
    eventLoop->timeEventHead = NULL;
    eventLoop->timeEventNextId = 0;
    eventLoop->stop = 0;
    eventLoop->maxfd = -1;
    eventLoop->beforesleep = NULL;
    eventLoop->aftersleep = NULL;
    if (aeApiCreate(eventLoop) == -1) goto err;
    /* Events with mask == AE_NONE are not set. So let's initialize the
     * vector with it. */
    for (i = 0; i < setsize; i++)
        eventLoop->events[i].mask = AE_NONE;
    return eventLoop;
err:
    if (eventLoop) {
        zfree(eventLoop->events);
        zfree(eventLoop->fired);
        zfree(eventLoop);
    }
    return NULL;
}
```

其中aeApiCreate在epoll中初始化如下：

aeEventLoop中的apidata在epoll中表示为aeApiState，id为epoll的根id，events表示接受事件循环epoll_wait返回的触发读写的网络事件。

```java
typedef struct aeApiState {
    int epfd;
    struct epoll_event *events;
} aeApiState;
```

```java
static int aeApiCreate(aeEventLoop *eventLoop) {
    aeApiState *state = zmalloc(sizeof(aeApiState));
	...
    state->events = zmalloc(sizeof(struct epoll_event)*eventLoop->setsize);
	...
    state->epfd = epoll_create(1024); /* 1024 is just a hint for the kernel */
    ...
	eventLoop->apidata = state;
    return 0;
}
```

### 事件注册

事件注册分为两类：

- IO事件注册与删除：aeCreateFileEvent，aeDeleteFileEvent
- 时间事件注册与删除：aeCreateTimeEvent，aeDeleteTimeEvent

IO事件的注册通过aeApiAddEvent函数将套接字及其事件处理函数注册到epoll中，aeEventLoop中的读写标志AE_READABLE、AE_WRITABLE映射为epoll中的EPOLLIN、EPOLLOUT。

```java
int aeCreateFileEvent(aeEventLoop *eventLoop, int fd, int mask,
        aeFileProc *proc, void *clientData)
{
    if (fd >= eventLoop->setsize) {
        errno = ERANGE;
        return AE_ERR;
    }
    aeFileEvent *fe = &eventLoop->events[fd];
    if (aeApiAddEvent(eventLoop, fd, mask) == -1)
        return AE_ERR;
    fe->mask |= mask;
    if (mask & AE_READABLE) fe->rfileProc = proc;
    if (mask & AE_WRITABLE) fe->wfileProc = proc;
    fe->clientData = clientData;
    if (fd > eventLoop->maxfd)
        eventLoop->maxfd = fd;
    return AE_OK;
}
static int aeApiAddEvent(aeEventLoop *eventLoop, int fd, int mask) {
    aeApiState *state = eventLoop->apidata;
    struct epoll_event ee = {
     0}; /* avoid valgrind warning */
    /* If the fd was already monitored for some event, we need a MOD
     * operation. Otherwise we need an ADD operation. */
    int op = eventLoop->events[fd].mask == AE_NONE ?
            EPOLL_CTL_ADD : EPOLL_CTL_MOD;
    ee.events = 0;
    mask |= eventLoop->events[fd].mask; /* Merge old events */
    if (mask & AE_READABLE) ee.events |= EPOLLIN;
    if (mask & AE_WRITABLE) ee.events |= EPOLLOUT;
    ee.data.fd = fd;
    if (epoll_ctl(state->epfd,op,fd,&ee) == -1) return -1;
    return 0;
}
```

在aeApiAddEvent中，在进行事件注册时，设置：ee.data.fd = fd；大部分的reactor模型的epoll编程都大同小异，最主要的差别就是对epoll_event.data这个union的设置，对于较复杂的网络模型，可以设置data=ptr，这样事件的数据更加丰富，灵活性大大增加。

```java
typedef union epoll_data
{
  void        *ptr;
  int          fd;
  __uint32_t   u32;
  __uint64_t   u64;
} epoll_data_t;
struct epoll_event {
__uint32_t events; /* Epoll events */
epoll_data_t data; /* User data variable */
};
```

IO事件的删除或者更改事件通过aeApiDelEvent更改epoll中的fd事件监听类型

```java
void aeDeleteFileEvent(aeEventLoop *eventLoop, int fd, int mask)
{
    if (fd >= eventLoop->setsize) return;
    aeFileEvent *fe = &eventLoop->events[fd];
    if (fe->mask == AE_NONE) return;
    /* We want to always remove AE_BARRIER if set when AE_WRITABLE
     * is removed. */
    if (mask & AE_WRITABLE) mask |= AE_BARRIER;
    aeApiDelEvent(eventLoop, fd, mask);
    fe->mask = fe->mask & (~mask);
    if (fd == eventLoop->maxfd && fe->mask == AE_NONE) {
        /* Update the max fd */
        int j;
        for (j = eventLoop->maxfd-1; j >= 0; j--)
            if (eventLoop->events[j].mask != AE_NONE) break;
        eventLoop->maxfd = j;
    }
}
static void aeApiDelEvent(aeEventLoop *eventLoop, int fd, int delmask) {
    aeApiState *state = eventLoop->apidata;
    struct epoll_event ee = {
     0}; /* avoid valgrind warning */
    int mask = eventLoop->events[fd].mask & (~delmask);
    ee.events = 0;
    if (mask & AE_READABLE) ee.events |= EPOLLIN;
    if (mask & AE_WRITABLE) ee.events |= EPOLLOUT;
    ee.data.fd = fd;
    if (mask != AE_NONE) {
        epoll_ctl(state->epfd,EPOLL_CTL_MOD,fd,&ee);
    } else {
        /* Note, Kernel < 2.6.9 requires a non null event pointer even for
         * EPOLL_CTL_DEL. */
        epoll_ctl(state->epfd,EPOLL_CTL_DEL,fd,&ee);
    }
}
```

时间事件注册是初始化aeTimeEvent并设置该事件下一次发生的时间，并把aeTimeEvent设置到时间事件列表中。删除则直接从时间事件列表中删除即可。

### 事件循环

事件循环通过aeMain函数实现，在[Redis 源码解析 - Redis 启动流程](/zhuanlan/db/redis/6/3.html)中，启动一个Redis节点的最后一步就是启动aeMain函数阻塞等待事件发生，并处理。函数逻辑很简单，如果有前置回调函数beforesleep，则处理前置回调，否则直接进入到aeProcessEvents中，阻塞等待事件发生。

```java
void aeMain(aeEventLoop *eventLoop) {
    eventLoop->stop = 0;
    while (!eventLoop->stop) {
        if (eventLoop->beforesleep != NULL)
            eventLoop->beforesleep(eventLoop);
        aeProcessEvents(eventLoop, AE_ALL_EVENTS|AE_CALL_AFTER_SLEEP);
    }
}
```

下面注重来看下aeProcessEvents，第一个参数是要处理的事件驱动框架，第二个参数是要处理的事件类型，在aeMain中表示处理包括IO事件和时间事件在内的所有事件以及回调后置函数aftersleep。

```java
int aeProcessEvents(aeEventLoop *eventLoop, int flags) {
	...
	//确定epoll_wait的超时时间
    //1、如果设置AE_DONT_WAIT标志，则需要立即返回，设置超时时间为0
    //2、如果需要处理时间事件，则设置超时时间为距离现在最近的时间事件的时间
	if (eventLoop->maxfd != -1 ||
        ((flags & AE_TIME_EVENTS) && !(flags & AE_DONT_WAIT))) {
        int j;
        aeTimeEvent *shortest = NULL;
        struct timeval tv, *tvp;
        if (flags & AE_TIME_EVENTS && !(flags & AE_DONT_WAIT))
            shortest = aeSearchNearestTimer(eventLoop);
        if (shortest) {
            long now_sec, now_ms;
            aeGetTime(&now_sec, &now_ms);
            tvp = &tv;
            /* How many milliseconds we need to wait for the next
             * time event to fire? */
            long long ms =
                (shortest->when_sec - now_sec)*1000 +
                shortest->when_ms - now_ms;
            if (ms > 0) {
                tvp->tv_sec = ms/1000;
                tvp->tv_usec = (ms % 1000)*1000;
            } else {
                tvp->tv_sec = 0;
                tvp->tv_usec = 0;
            }
        } else {
            /* If we have to check for events but need to return
             * ASAP because of AE_DONT_WAIT we need to set the timeout
             * to zero */
            if (flags & AE_DONT_WAIT) {
                tv.tv_sec = tv.tv_usec = 0;
                tvp = &tv;
            } else {
                /* Otherwise we can block */
                tvp = NULL; /* wait forever */
            }
        }
        numevents = aeApiPoll(eventLoop, tvp);
        // 如果设置了后置函数aftersleep，则调用
        if (eventLoop->aftersleep != NULL && flags & AE_CALL_AFTER_SLEEP)
            eventLoop->aftersleep(eventLoop);
        //对发生的事件进行处理
        for (j = 0; j < numevents; j++) {
        	// 获取发生事件的信息
            aeFileEvent *fe = &eventLoop->events[eventLoop->fired[j].fd];
            int mask = eventLoop->fired[j].mask;
            int fd = eventLoop->fired[j].fd;
            int fired = 0;
            int invert = fe->mask & AE_BARRIER;
            // 根据事件类型，调用对应的函数进行处理：
            // AE_READABLE类型调用rfileProc
            // AE_WRITABLE类型调用wfileProc
            if (!invert && fe->mask & mask & AE_READABLE) {
                fe->rfileProc(eventLoop,fd,fe->clientData,mask);
                fired++;
            }
            if (fe->mask & mask & AE_WRITABLE) {
                if (!fired || fe->wfileProc != fe->rfileProc) {
                    fe->wfileProc(eventLoop,fd,fe->clientData,mask);
                    fired++;
                }
            }
            if (invert && fe->mask & mask & AE_READABLE) {
                if (!fired || fe->wfileProc != fe->rfileProc) {
                    fe->rfileProc(eventLoop,fd,fe->clientData,mask);
                    fired++;
                }
            }
            processed++;
		}
	}
	//最后处理时间事件
    if (flags & AE_TIME_EVENTS)
        processed += processTimeEvents(eventLoop);
    return processed;    
}
```

该函数的主要步骤如下：

**1、** 如果需要处理时间事件，则通过aeSearchNearestTimer函数寻找距离现在最近的一个时间事件，得到其触发时间aeSearchNearestTimer逻辑很简单，遍历时间事件列表，找到最小值；

**2、** 根据第一步中找到的最小触发时间，设置阻塞时间（如果没有时间事件，则设置阻塞时间为无限大），然后调用aeApiPoll等待事件发生或者阻塞时间超时；

**3、** 如果设置后置函数aftersleep，则调用；

**4、** 处理发生的IO事件，根据发生的事件类型，如果是AE_READABLE类型调用rfileProc，如果是AE_WRITABLE类型调用wfileProc一般来说，先处理AE_READABLE类型事件，该类事件一般为客户端连接或者命令，然后处理AE_WRITABLE类型事件向客户端发送响应对于客户端的回复，一般在beforesleep中就会执行完成），但是如果1、如果客户端回复buf中较多，无法在beforesleep中全部发送，同时aof开启且持久化方式为always，那么需要立即发送回复；2、在集群模式下，调用clusterSendMessage函数发送消息时，也需要将消息立即发送到套接字中；

**5、** 最后通过processTimeEvents处理时间事件；

事件循坏时，epoll把发生读写的事件注册到aeEventLoop的fired数组中，其中eventLoop->fired[j].fd = e->data.fd;确定了事件的套接字。

```java
static int aeApiPoll(aeEventLoop *eventLoop, struct timeval *tvp) {
    aeApiState *state = eventLoop->apidata;
    int retval, numevents = 0;
    retval = epoll_wait(state->epfd,state->events,eventLoop->setsize,
            tvp ? (tvp->tv_sec*1000 + tvp->tv_usec/1000) : -1);
    if (retval > 0) {
        int j;
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
    return numevents;
}
```

最后是时间事件的处理processTimeEvents

```java
static int processTimeEvents(aeEventLoop *eventLoop) {
	int processed = 0;
    aeTimeEvent *te;
    long long maxId;
    time_t now = time(NULL);
    // 如果时钟抖动，则对aeEventLoop中的所有时间事件全部执行
    //（根据作者的说法，时间事件提前执行比延后执行造成的影响小）
    if (now < eventLoop->lastTime) {
        te = eventLoop->timeEventHead;
        while(te) {
            te->when_sec = 0;
            te = te->next;
        }
    }
    eventLoop->lastTime = now;
    te = eventLoop->timeEventHead;
    maxId = eventLoop->timeEventNextId-1;
    while(te) {
        long now_sec, now_ms;
        long long id;
        // 清除删除的时间事件
        if (te->id == AE_DELETED_EVENT_ID) {
            aeTimeEvent *next = te->next;
            if (te->prev)
                te->prev->next = te->next;
            else
                eventLoop->timeEventHead = te->next;
            if (te->next)
                te->next->prev = te->prev;
            if (te->finalizerProc)
                te->finalizerProc(eventLoop, te->clientData);
            zfree(te);
            te = next;
            continue;
        }
        aeGetTime(&now_sec, &now_ms);
        if (now_sec > te->when_sec ||
            (now_sec == te->when_sec && now_ms >= te->when_ms))
        {
            int retval;
            id = te->id;
            retval = te->timeProc(eventLoop, id, te->clientData);
            processed++;
            // 通过返回值判断是否是周期行时间事件
            if (retval != AE_NOMORE) {
                aeAddMillisecondsToNow(retval,&te->when_sec,&te->when_ms);
            } else {
                te->id = AE_DELETED_EVENT_ID;
            }
        }
        te = te->next;
    }
    return processed;
}
```
