# 17、Redis 源码解析 - Redis 事件处理
- 来源：https://ddkk.com/zhuanlan/db/redis/8/17.html
- 分类：缓存数据库
- 分组：教程目录
### 1. Redis事件介绍

Redis服务器是一个`事件驱动程序`，所谓事件驱动就是输入一条命令并且按下回车，然后消息被组装成`Redis`协议的格式发送给`Redis`服务器，这个时候就会产生一个事件，`Redis`服务器会接收改命令，处理该命令和发送回复，而当我们没有与服务器进行交互时，服务器就会处于阻塞等待状态，它会让出CPU然后进入睡眠状态，当事件触发时，就会被操作系统唤醒.

而Redis服务器需要处理以下两类事件：

- 文件事件：Redis 服务器通过套接字与客户端（或者其他Redis服务器）进行连接，而文件事件就是服务器对套接字操作的抽象. 服务器与客户端（或者其他服务器）的通信会产生相应的文件事件，而服务器则通过监听并处理这些事件来完成一系列网络通信操作.
- 时间事件：Redis 服务器中的一些操作（比如serverCron函数）需要在给定的时间点执行，而时间事件就是服务器对这类定时操作的抽象.

### 2. 事件的抽象

Redis把`文件事件`和`时间事件`分别抽象成一个数据结构来管理.

#### 2.1 文件事件结构

```java
typedef struct aeFileEvent {
    // 文件时间类型：AE_NONE，AE_READABLE，AE_WRITABLE
    int mask;
    // 可读处理函数
    aeFileProc *rfileProc;
    // 可写处理函数
    aeFileProc *wfileProc;
    // 客户端传入的数据
    void *clientData;
} aeFileEvent;  //文件事件
```

其中`rfileProc`和`wfileProc`成员分别为两个函数指针，他们的原型为：

```java
typedef void aeFileProc(struct aeEventLoop *eventLoop, int fd, void *clientData, int mask);
```

该函数是`回调函数`，如果当前文件事件所指定的事件类型发生时，则会调用对应的`回调函数`来处理该事件.

当事件就绪的时候，我们需要知道文件事件的文件描述符还有事件类型才能对于锁定该事件，因此定义了`aeFiredEvent`结构统一管理：

```java
typedef struct aeFiredEvent {
    // 就绪事件的文件描述符
    int fd;
    // 就绪事件类型：AE_NONE，AE_READABLE，AE_WRITABLE
    int mask;
} aeFiredEvent; //就绪事件
```

文件事件的类型：

```java
#define AE_NONE 0           //未设置
#define AE_READABLE 1       //事件可读
#define AE_WRITABLE 2       //事件可写
```

#### 2.2 时间事件结构

```java
typedef struct aeTimeEvent {
    // 时间事件的id
    long long id;
    // 时间事件到达的时间的秒数
    long when_sec; /* seconds */
    // 时间事件到达的时间的毫秒数
    long when_ms; /* milliseconds */
    // 时间事件处理函数
    aeTimeProc *timeProc;
    // 时间事件终结函数
    aeEventFinalizerProc *finalizerProc;
    // 客户端传入的数据
    void *clientData;
    // 指向下一个时间事件
    struct aeTimeEvent *next;
} aeTimeEvent;  //时间事件
```

可以看出，时间事件的结构就是一个链表的节点，因为`struct aeTimeEvent *next`是指向下一个时间事件的指针.

和文件事件一样，当时间事件所指定的事件发生时，也会调用对应的`回调函数`，结构成员`timeProc`和`finalizerProc`都是回调函数，函数原型如下：

```java
typedef int aeTimeProc(struct aeEventLoop *eventLoop, long long id, void *clientData);
typedef void aeEventFinalizerProc(struct aeEventLoop *eventLoop, void *clientData);
```

虽然对文件事件和时间事件都做了抽象，`Redis`仍然需要对事件做一个整体的抽象，用来描述一个事件的状态. 也就是下面要介绍的事件状态结构：`aeEventLoop`.

#### 2.3 事件状态结构

```java
typedef struct aeEventLoop {
    // 当前已注册的最大的文件描述符
    int maxfd;   /* highest file descriptor currently registered */
    // 文件描述符监听集合的大小
    int setsize; /* max number of file descriptors tracked */
    // 下一个时间事件的ID
    long long timeEventNextId;
    // 最后一次执行事件的时间
    time_t lastTime;     /* Used to detect system clock skew */
    // 注册的文件事件表
    aeFileEvent *events; /* Registered events */
    // 已就绪的文件事件表
    aeFiredEvent *fired; /* Fired events */
    // 时间事件的头节点指针
    aeTimeEvent *timeEventHead;
    // 事件处理开关
    int stop;
    // 多路复用库的事件状态数据
    void *apidata; /* This is used for polling API specific data */
    // 执行处理事件之前的函数
    aeBeforeSleepProc *beforesleep;
} aeEventLoop;  //事件轮询的状态结构
```

`aeEventLoop`结构保存了一个`void *`类型的万能指针`apidata`，用来保存轮询事件的状态，也就是保存底层调用的多路复用库的事件状态.

`Redis`的 `I/O`多路复用程序的所有功能都是通过包装常见的`select`、`epoll`、`evport`和`kqueue`这些`I/O`多路复用函数库来实现的，每个I/O多路复用函数库在Redis源码中都对应着一个单独的文件，比如`ae_select.c`、`ae_epoll.c`等等.

他们在编译阶段，会根据不同的系统选择性能最高的一个多路复用库作为`Redis`的多路复用程序实现，而且所有库的API都是相同的，这就可以让Redis多路复用程序的底层可以互换.

下面是具体选择库的源码：

```java
// IO复用的选择，性能依次下降，Linux支持 "ae_epoll.c" 和 "ae_select.c"
#ifdef HAVE_EVPORT
#include "ae_evport.c"
#else
   ifdef HAVE_EPOLL
   include "ae_epoll.c"
   else
       ifdef HAVE_KQUEUE
       include "ae_kqueue.c"
       else
       include "ae_select.c"
       endif
   endif
#endif
```

也可以通过命令`INFO server`来查看当前使用的是哪个多路复用库：

可以看到Linux下默认使用的是`epoll`多路复用库，那么`apidata`保存的就是`epoll`模型的事件状态结构，它在`ae_epoll.c`源文件中：

```java
typedef struct aeApiState {
    // epoll事件的文件描述符
    int epfd;
    // 事件表
    struct epoll_event *events;
} aeApiState;   // 事件的状态
```

`epoll`模型的`struct epoll_event`结构中定义着epoll事件的类型，比如`EPOLLIN`、`EPOLLOUT`等等，但是Redis的文件结构`aeFileEvent`中也在`mask`中定义了自己的事件类型，例如：`AE_READABLE`、`AE_WRITABLE`等等，于是就需要实现一个中间层将两者的事件类型相联系起来，这就是之前提到的`ae_epoll.c`文件中实现的相同的API：

```java
// 创建一个epoll实例，保存到eventLoop中
static int aeApiCreate(aeEventLoop *eventLoop)
// 调整事件表的大小
static int aeApiResize(aeEventLoop *eventLoop, int setsize)  
// 释放epoll实例和事件表空间
static void aeApiFree(aeEventLoop *eventLoop)
// 在epfd标识的事件表上注册fd的事件
static int aeApiAddEvent(aeEventLoop *eventLoop, int fd, int mask)
// 在epfd标识的事件表上注删除fd的事件
static void aeApiDelEvent(aeEventLoop *eventLoop, int fd, int delmask)
// 等待所监听文件描述符上有事件发生
static int aeApiPoll(aeEventLoop *eventLoop, struct timeval *tvp)
// 返回正在使用的IO多路复用库的名字
static char *aeApiName(void)
```

这些API会讲`epoll`的底层函数封装起来，Redis实现事件时，只需要调用这些接口即可.

我们以下面两个API的源码举例：

`aeApiAddEvent`

该函数会向Redis事件状态结构`aeEventLoop`的事件表`event`注册一个事件，对应的是`epoll_ctl`函数.

```java
// 在epfd标识的事件表上注册fd的事件
static int aeApiAddEvent(aeEventLoop *eventLoop, int fd, int mask) {
    aeApiState *state = eventLoop->apidata;
    struct epoll_event ee = {
     0};
    // EPOLL_CTL_ADD，向epfd注册fd的上的event
    // EPOLL_CTL_MOD，修改fd已注册的event
    //define AE_NONE 0           //未设置
    //define AE_READABLE 1       //事件可读
    //define AE_WRITABLE 2       //事件可写
    // 判断fd事件的操作，如果没有设置事件，则进行关联mask类型事件，否则进行修改
    int op = eventLoop->events[fd].mask == AE_NONE ?
            EPOLL_CTL_ADD : EPOLL_CTL_MOD;
    // struct epoll_event {
    //      uint32_t     events;      /* Epoll events */
    //      epoll_data_t data;        /* User data variable */
    // };
    ee.events = 0;
    // 如果是修改事件，合并之前的事件类型
    mask |= eventLoop->events[fd].mask; /* Merge old events */
    // 根据mask映射epoll的事件类型
    if (mask & AE_READABLE) ee.events |= EPOLLIN;   //读事件
    if (mask & AE_WRITABLE) ee.events |= EPOLLOUT;  //写事件
    ee.data.fd = fd;    //设置事件所从属的目标文件描述符
    // 将ee事件注册到epoll中
    if (epoll_ctl(state->epfd,op,fd,&ee) == -1) return -1;
    return 0;
}
```

`aeApiPoll`

等待所监听文件描述符上有事件发生，对应着底层的`epoll_wait`函数.

```java
// 等待所监听文件描述符上有事件发生
static int aeApiPoll(aeEventLoop *eventLoop, struct timeval *tvp) {
    aeApiState *state = eventLoop->apidata;
    int retval, numevents = 0;
    // 监听事件表上是否有事件发生
    retval = epoll_wait(state->epfd,state->events,eventLoop->setsize,
            tvp ? (tvp->tv_sec*1000 + tvp->tv_usec/1000) : -1);
    // 至少有一个就绪的事件
    if (retval > 0) {
        int j;
        numevents = retval;
        // 遍历就绪的事件表，将其加入到eventLoop的就绪事件表中
        for (j = 0; j < numevents; j++) {
            int mask = 0;
            struct epoll_event *e = state->events+j;
            // 根据就绪的事件类型，设置mask
            if (e->events & EPOLLIN) mask |= AE_READABLE;
            if (e->events & EPOLLOUT) mask |= AE_WRITABLE;
            if (e->events & EPOLLERR) mask |= AE_WRITABLE;
            if (e->events & EPOLLHUP) mask |= AE_WRITABLE;
            // 添加到就绪事件表中
            eventLoop->fired[j].fd = e->data.fd;
            eventLoop->fired[j].mask = mask;
        }
    }
    // 返回就绪的事件个数
    return numevents;
}
```

### 3. 事件的实现

事件的所有源码都定义在`ae.c`源文件中，先从`aeMain`函数说起.

```java
// 事件轮询的主函数
void aeMain(aeEventLoop *eventLoop) {
    eventLoop->stop = 0;
    // 一直处理事件
    while (!eventLoop->stop) {
        // 执行处理事件之前的函数
        if (eventLoop->beforesleep != NULL)
            eventLoop->beforesleep(eventLoop);
        //处理到时的时间事件和就绪的文件事件
        aeProcessEvents(eventLoop, AE_ALL_EVENTS);
    }
}
```

可以看到，如果服务器一直处理事件，那么就是一个死循环，而一个最典型的事件驱动，就是一个死循环. 在循环中，程序会调用处理事件的函数`aeProcessEvents()`，它的参数是一个事件状态结构`aeEventLoop`和`AE_ALL_EVENTS`.

事件类型的宏定义，在`ae.h`头文件中：

```java
#define AE_FILE_EVENTS 1                                //文件事件
#define AE_TIME_EVENTS 2                                //时间事件
#define AE_ALL_EVENTS (AE_FILE_EVENTS|AE_TIME_EVENTS)   //文件和时间事件
#define AE_DONT_WAIT 4
```

```java
// 处理到时的时间事件和就绪的文件事件
// 如果flags = 0，函数什么都不做，直接返回
// 如果flags设置了 AE_ALL_EVENTS ，则执行所有类型的事件
// 如果flags设置了 AE_FILE_EVENTS ，则执行文件事件
// 如果flags设置了 AE_TIME_EVENTS ，则执行时间事件
// 如果flags设置了 AE_DONT_WAIT ，那么函数处理完事件后直接返回，不阻塞等待
// 函数返回执行的事件个数
int aeProcessEvents(aeEventLoop *eventLoop, int flags)
{
    int processed = 0, numevents;
    // 如果什么事件都没有设置则直接返回
    if (!(flags & AE_TIME_EVENTS) && !(flags & AE_FILE_EVENTS)) return 0;
    // 请注意，既然我们要处理时间事件，即使没有要处理的文件事件，我们仍要调用select（），以便在下一次事件准备启动之前进行休眠
    // 当前还没有要处理的文件事件，或者设置了时间事件但是没有设置不阻塞标识
    if (eventLoop->maxfd != -1 ||
        ((flags & AE_TIME_EVENTS) && !(flags & AE_DONT_WAIT))) {
        int j;
        aeTimeEvent *shortest = NULL;
        struct timeval tv, *tvp;
        // 如果设置了时间事件而没有设置不阻塞标识
        if (flags & AE_TIME_EVENTS && !(flags & AE_DONT_WAIT))
            // 获取最近到时的时间事件
            shortest = aeSearchNearestTimer(eventLoop);
        // 获取到了最早到时的时间事件
        if (shortest) {
            long now_sec, now_ms;
            // 获取当前时间
            aeGetTime(&now_sec, &now_ms);
            tvp = &tv;
            // 等待该时间事件到时所需要的时长
            long long ms =
                (shortest->when_sec - now_sec)*1000 +
                shortest->when_ms - now_ms;
            // 如果没到时
            if (ms > 0) {
                // 保存时长到tvp中
                tvp->tv_sec = ms/1000;
                tvp->tv_usec = (ms % 1000)*1000;
            // 如果已经到时，则将tvp的时间设置为0
            } else {
                tvp->tv_sec = 0;
                tvp->tv_usec = 0;
            }
        // 没有获取到了最早到时的时间事件，时间事件链表为空
        } else {
            // 如果设置了不阻塞标识
            if (flags & AE_DONT_WAIT) {
                // 将tvp的时间设置为0，就不会阻塞
                tv.tv_sec = tv.tv_usec = 0;
                tvp = &tv;
            } else {
                // 阻塞到第一个时间事件的到来
                /* Otherwise we can block */
                tvp = NULL; /* wait forever */
            }
        }
        // 等待所监听文件描述符上有事件发生
        // 如果tvp为NULL，则阻塞在此，否则等待tvp设置阻塞的时间，就会有时间事件到时
        // 返回了就绪文件事件的个数
        numevents = aeApiPoll(eventLoop, tvp);
        // 遍历就绪文件事件表
        for (j = 0; j < numevents; j++) {
            // 获取就绪文件事件的地址
            aeFileEvent *fe = &eventLoop->events[eventLoop->fired[j].fd];
            // 获取就绪文件事件的类型，文件描述符
            int mask = eventLoop->fired[j].mask;
            int fd = eventLoop->fired[j].fd;
            int rfired = 0;
            // 如果是文件可读事件发生
            if (fe->mask & mask & AE_READABLE) {
                // 设置读事件标识 且 调用读事件方法处理读事件
                rfired = 1;
                fe->rfileProc(eventLoop,fd,fe->clientData,mask);
            }
            // 如果是文件可写事件发生
            if (fe->mask & mask & AE_WRITABLE) {
                // 读写事件的执行发法不同，则执行写事件，避免重复执行相同的方法
                if (!rfired || fe->wfileProc != fe->rfileProc)
                    fe->wfileProc(eventLoop,fd,fe->clientData,mask);
            }
            processed++;    //执行的事件次数加1
        }
    }
    /* Check time events */
    // 执行时间事件
    if (flags & AE_TIME_EVENTS)
        processed += processTimeEvents(eventLoop);
    return processed; /* return the number of processed file/time events */
}
```

Redis服务器在没有被事件触发时，如果没有设置`AE_DONT_WAIT`标识，就会开始阻塞等待. 但是它不会死等待，因为还需要处理时间事件，所以在调用`aeApiPoll`进行监听之前，会先从时间事件表中获取一个最近到达的时间，根据需要等待的时间构建一个`struct timeval tv, *tvp`结构的变量，这个变量保存着服务器阻塞等待文件事件的最长时间，一旦时间到达而没有触发文件事件`aeApiPoll`函数就会停止阻塞，进而调用`processTimeEvents`函数处理时间事件.

如果在阻塞等待的最长时间之间，触发了文件事件，就会先执行文件事件，后执行时间事件，因此处理时间事件通常比预设的会晚一点.

而执行文件事件`rfileProc`和`wfileProc`也是调用了回调函数，Redis将文件事件的处理分为了好几种，用于处理不同的网络通信需求：

- acceptTcpHandler：用于accept client的connect.
- acceptUnixHandler：用于accept client的本地connect.
- sendReplyToClient：用于向client发送命令回复.
- readQueryFromClient：用于读入client发送的请求.

然后我们来看一下获取最快达到时间事件的函数`aeSearchNearestTimer`实现：

```java
// 寻找第一个快到时的时间事件
// 这个操作是有用的知道有多少时间可以选择该事件设置为不用推迟任何事件的睡眠中。
// 如果事件链表没有时间将返回NULL。
static aeTimeEvent *aeSearchNearestTimer(aeEventLoop *eventLoop)
{
    // 时间事件头节点地址
    aeTimeEvent *te = eventLoop->timeEventHead;
    aeTimeEvent *nearest = NULL;
    // 遍历所有的时间事件
    while(te) {
        // 寻找第一个快到时的时间事件，保存到nearest中
        if (!nearest || te->when_sec < nearest->when_sec ||
                (te->when_sec == nearest->when_sec &&
                 te->when_ms < nearest->when_ms))
            nearest = te;
        te = te->next;
    }
    return nearest;
}
```

该函数就是遍历时间事件链表，然后找到最小值.

我们重点看执行时间事件的函数`processTimeEvents`函数的实现：

```java
// 执行时间事件
static int processTimeEvents(aeEventLoop *eventLoop) {
    int processed = 0;
    aeTimeEvent *te, *prev;
    long long maxId;
    time_t now = time(NULL);
    // 这里尝试发现时间混乱的情况，上一次处理事件的时间比当前时间还要大
    // 重置最近一次处理事件的时间
    if (now < eventLoop->lastTime) {
        te = eventLoop->timeEventHead;
        while(te) {
            te->when_sec = 0;
            te = te->next;
        }
    }
    // 设置上一次时间事件处理的时间为当前时间
    eventLoop->lastTime = now;
    prev = NULL;
    te = eventLoop->timeEventHead;
    maxId = eventLoop->timeEventNextId-1;   //当前时间事件表中的最大ID
    // 遍历时间事件链表
    while(te) {
        long now_sec, now_ms;
        long long id;
        /* Remove events scheduled for deletion. */
        // 如果时间事件已被删除了
        if (te->id == AE_DELETED_EVENT_ID) {
            aeTimeEvent *next = te->next;
            // 从事件链表中删除事件的节点
            if (prev == NULL)
                eventLoop->timeEventHead = te->next;
            else
                prev->next = te->next;
            // 调用时间事件终结方法清除该事件
            if (te->finalizerProc)
                te->finalizerProc(eventLoop, te->clientData);
            zfree(te);
            te = next;
            continue;
        }
        // 确保我们不处理在此迭代中由时间事件创建的时间事件. 请注意，此检查目前无效：我们总是在头节点添加新的计时器，但是如果我们更改实施细节，则该检查可能会再次有用：我们将其保留在未来的防御
        if (te->id > maxId) {
            te = te->next;
            continue;
        }
        // 获取当前时间
        aeGetTime(&now_sec, &now_ms);
        // 找到已经到时的时间事件
        if (now_sec > te->when_sec ||
            (now_sec == te->when_sec && now_ms >= te->when_ms))
        {
            int retval;
            id = te->id;
            // 调用时间事件处理方法
            retval = te->timeProc(eventLoop, id, te->clientData);
            // 时间事件次数加1
            processed++;
            // 如果不是定时事件，则继续设置它的到时时间
            if (retval != AE_NOMORE) {
                aeAddMillisecondsToNow(retval,&te->when_sec,&te->when_ms);
            // 如果是定时时间，则retval为-1，则将其时间事件删除，惰性删除
            } else {
                te->id = AE_DELETED_EVENT_ID;
            }
        }
        // 更新前驱节点指针和后继节点指针
        prev = te;
        te = te->next;
    }
    return processed;   //返回执行事件的次数
}
```

如果时间事件不存在，则就调用`finalizerProc`指向的回调函数，删除当前的时间事件. 如果存在，就调用`timeProc`指向的回调函数处理时间事件. Redis的时间事件分为两类：

- 定时事件：让一段程序在指定的时间后执行一次.
- 周期性事件：让一段程序每隔指定的时间后执行一次.

如果当前的时间事件是周期性，那么就会在将时间周期添加到周期事件的到时时间中. 如果是定时事件，则将该时间事件删除.
