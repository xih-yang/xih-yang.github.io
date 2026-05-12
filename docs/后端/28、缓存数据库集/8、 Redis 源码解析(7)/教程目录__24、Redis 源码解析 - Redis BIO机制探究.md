# 24、Redis 源码解析 - Redis BIO机制探究
- 来源：https://ddkk.com/zhuanlan/db/redis/7/24.html
- 分类：缓存数据库
- 分组：教程目录
时隔十个月再次提笔去探究Redis相关的东西，心中还是有一点激动的。最近打算用两到三篇文章来再过一下Redis相关的东西，不但是对以前遗漏知识点的一点补充，也是对最近这一段时间复习Redis画上一个句号。

这篇文章主要是想说一个问题，**Redis到底是单线程还是多线程**？简单在各大平台搜索了一下这个问题，发现至少百分之七十的文章基本上是没有一丝价值，但是其中也不乏不少好文章。本篇文章就基于前人的讨论，再加上自己的理解，来探讨一下这个问题。不过因为看的源码版本太低，一些部分的讨论没办法附以代码。

### 单线程 or 多线程

我们到底什么时候该使用多线程呢？在[1]中描述的很清楚，使用多线程有两个原因，即利用**多核效率**和**关注点分离**。与此相反不使用多线程的原因就是**受益比不上回报**的时候。

先抛出答案，**Redis使用多线程，而不是单线程**。当然这里的意思与我们平时聊天中默认的想法有一点出入，平时我们去说WebServer单线程还是多线程的时候，我们实际讨论的是worker线程到底是单还多，也就是整体的线程设计中Worker到底是一个还是多个。举个最简单的例子，muduo使用的`one loop per thread`模型就是一个非常经典的半同步半异步模型，是一个多线程的模型，其中一个线程处理连接，剩下线程处理请求。这样的原因是因为WebServer（就[RabbitServer](https://github.com/Super-long/RabbitServer)的性能分析来看）是一个计算密集型的程序，我们需要更好的应用多核带来的算力提升。

而Redis的场景却不是这样，很好看出Redis服务端程序做的计算任务其实非常简单，在epoll的循环中接收数据，然后命令解析，最后执行。因为Redis中的数据结构设计的都非常巧妙，基本上操作这些数据并不会花费太长的时间。在[3]中可以看到如下文字：

**It’s not very frequent that CPU becomes your bottleneck with Redis, as usually Redis is either memory or network bound**. For instance, using pipelining Redis running on an average Linux system can deliver even 1 million requests per second, so if your application mainly uses O(N) or O(log(N)) commands, it is hardly going to use too much CPU.

However, to maximize CPU usage you can start multiple instances of Redis in the same box and treat them as different servers. At some point a single box may not be enough anyway, so if you want to use multiple CPUs you can start thinking of some way to shard earlier.

You can find more information about using multiple Redis instances in the Partitioning page.

**However with Redis 4.0 we started to make Redis more threaded**. For now this is limited to deleting objects in the background, and to blocking commands implemented via Redis modules. For future releases, the plan is to make Redis more and more threaded.

但是数据量如果比较庞大的话磁盘IO和网络IO就可能成了整体的性能瓶颈。因为不管是给客户端传递数据，同步时RDB包的传送，集群中的INFO包，PING/PONG包，主从模型中命令的同步，心跳包等都是很大的网络IO开销，而大数据量下AOF的定期刷缓存对于磁盘IO来说也是压力巨大。

而网络IO的优化方式欢神曾经也和我们提过，目前开源的就是两个路子，一种是`协议栈优化`，代表的就是新浪的[fastsocket](https://github.com/fastos/fastsocket)；另一种就是`by pass kernel`的做法，从网卡驱动到用户态协议栈都用上，代表的就是Intel的[DPDK](https://www.dpdk.org/)。显然这些和数据库怎么玩没太大关系。

但是我们知道一个问题，就是一般千兆网卡的IO是有上限的，一般以太网上一个包的有效负载就是[84, 1538]字节，我们假设每个包都被填充的满满的，即其中1538个字节中数据为1460字节，千兆网卡每秒最大流量就是125MB左右，那么千兆网卡每秒最大能承受的有效数据量就是118MB左右。一个线程去跑网络IO话会出现什么问题呢？有可能这个孤零零的线程遇到了如下几种情况：

- **操作bigkey**：写入一个bigkey在分配内存时需要消耗更多的时间，同样，删除bigkey释放内存同样会产生耗时
- **使用复杂度过高的命令**：例如SORT/SUNION/ZUNIONSTORE/KEYS，或者O(N)命令，而且N很大。像压缩列表还可能出现级联操作。
- **大量key集中过期**：Redis的过期机制也是在主线程中执行的，大量key集中过期会导致处理一个请求时，耗时都在删除过期key，耗时变长
- **淘汰策略**：溜达策略也是在主线程执行的，当内存超过Redis内存上限后，每次写入都需要淘汰一些key，也会造成耗时变长。
- **主从全量同步生成RDB**：虽然采用fork子进程生成数据快照，但fork这一瞬间也是会阻塞整个线程的（写时复制，整个进程数据会拷贝），实例越大，阻塞时间越久。

那么这段时间网络IO是没线程管的，只能等到处理完全部的任务以后下一次在epoll中继续读取，倘若网络IO压力真的很大，那段阻塞的时间可能导致接收缓冲区紧张，从而影响整个应用的吞吐量与后续操作的响应时间。多线程在这个角度优化了网络IO。

虽然我们讨论出了这个结果，但是一个成熟的软件不可能是一步建成的，项目的开发不可能在开始就考虑的面面俱到，总是一个迭代的过程[5]。单线程的处理整个数据库的逻辑带来了易于开发与易于实现的好处，我想这是一个Redis是单线程处理不可忽视的点。

### 异步操作

这里插一嘴的原因是很多人容易把异步和多线程联系在一起，异步一定得是多线程吗？那当然不一定。

而且像这种单线程的处理（worker的单线程也算）必须使用异步操作，不然不是效率低的问题，而是能不能用的问题。试想一个`send/recv`操作让你的这个孤零零的线程阻塞上0.5秒，那还玩个屁。这种操作我们可以扩展到很多地方，比如redis中命令的传递，与新发现的从服务器或者sentinel或者主服务器进行连接（非阻塞可能长达数秒），或者与某个套接字断开连接。

其实本质就是实际的执行不是在命令发出的时候，而是在某个适当的时机进行。

Redis中很多地方都使用了异步操作，但是只有少部分使用了多线程。我个人认为究其原因就是这些操作没办法异步，不管怎样这个CPU时间都是要花的，阻塞都是避免不了的。

### 哪些地方用到了多线程

卖了这么多关子，到底Redis哪里用到了多线程（进程）呢？以下是我基于对3.2版本源码分析和搜索引擎能找到的所有情况。

- **RDB持久化**
- **AOF重写**
- **AOF close操作**
- **AOF 刷新缓存**
- **异步删除对象 lazyfree (4.0)**
- **网络IO与命令解析(6.0)**

其中前两点自然不必多说，通过`BGSAVE`和`BGREWRITEAOF`可以在子进程执行RDB持久化和AOF重写，当然`serverCron`中满足一定条件的时候也会触发，这里不详细解释。

而第三四条就是今天文章的重点讨论对象，即**BIO机制**。我们把对这个问题的描述放在下一节。

至于第五六条则是新版本引入的特性，异步删除对象很好理解[9][10][11]，网络IO我们已经在前面讨论过了。

### BIO机制

第一次注意到这个问题是在看AOF部分的源码实现的时候，发现在`backgroundRewriteDoneHandler`中有`bioCreateBackgroundJob`这样一个奇怪的函数，它的作用是异步关闭刚刚执行完的旧的AOF文件，且真实的运行在另一个线程中。当时我的脑袋里冒出了两个问题：

**1、****为什么要close需要异步操作？**；

**2、****这个线程还能做什么？**；

第一个问题可以在源码的注释中找到蛛丝马迹：

Currently there is only a single operation, that is a background close(2) system call. This is needed as when the process is the last owner of a reference to a file closing it means unlinking it, and the deletion of the file is slow, blocking the server.

目前在后台执行的只有 close(2) 操作：因为当服务器是某个文件的最后一个拥有者时，关闭一个文件代表 unlinking 它， 并且删除文件非常慢，会阻塞系统，所以我们将 close(2) 放到后台进行。

至于第二个问题的答案，也可以看做另一个问题，**BIO到底做了什么**？其实BIO全称为`Background I/O`，而不是代表磁盘IO请求的那个bio[13]，是Redis的后台IO服务，实现了将工作放在后台执行的功能。BIO是多线程执行的。

其实这个东西的实现非常简单，就是一个使用锁和条件变量的生产者消费者模型。

在redis.c/main函数中调用`initServer`，其中调用`bioInit`，这是BIO的初始化函数：

```java
void bioInit(void) {
    pthread_attr_t attr;
    pthread_t thread;
    size_t stacksize;
    int j;
    // 初始化 job 队列，以及线程状态；其实也就是调用标准C库，初始化条件变量和锁，以及初始化队列头
    for (j = 0; j < REDIS_BIO_NUM_OPS; j++) {
        pthread_mutex_init(&bio_mutex[j],NULL);
        pthread_cond_init(&bio_condvar[j],NULL);
        bio_jobs[j] = listCreate();
        bio_pending[j] = 0;
    }
    // 设置栈大小;
    pthread_attr_init(&attr);
    pthread_attr_getstacksize(&attr,&stacksize);	// 默认大小为4294967298
    if (!stacksize) stacksize = 1; /* The world is full of Solaris Fixes */
    while (stacksize < REDIS_THREAD_STACK_SIZE) stacksize *= 2;
    pthread_attr_setstacksize(&attr, stacksize);
    // 创建线程
    for (j = 0; j < REDIS_BIO_NUM_OPS; j++) {
        void *arg = (void*)(unsigned long) j;
        if (pthread_create(&thread,&attr,bioProcessBackgroundJobs,arg) != 0) {
            redisLog(REDIS_WARNING,"Fatal: Can't initialize Background Jobs.");
            exit(1);
        }
        bio_threads[j] = thread;
    }
}
```

我们再来看看如何创建一个任务：

```java
void bioCreateBackgroundJob(int type, void *arg1, void *arg2, void *arg3) {
    struct bio_job *job = zmalloc(sizeof(*job));
    job->time = time(NULL);
    job->arg1 = arg1;
    job->arg2 = arg2;
    job->arg3 = arg3;
    pthread_mutex_lock(&bio_mutex[type]);
    // 将新工作推入队列
    listAddNodeTail(bio_jobs[type],job);
    bio_pending[type]++;
    pthread_cond_signal(&bio_condvar[type]);
    pthread_mutex_unlock(&bio_mutex[type]);
}
```

一个标准的生产者消费者的任务插入，先加锁，然后`signal`一下。

具体的消费者代码在

```java
#define REDIS_BIO_CLOSE_FILE    0 /* Deferred close(2) syscall. */
#define REDIS_BIO_AOF_FSYNC     1 /* Deferred AOF fsync. */
#define REDIS_BIO_NUM_OPS       2
void aof_background_fsync(int fd) {
    bioCreateBackgroundJob(REDIS_BIO_AOF_FSYNC,(void*)(long)fd,NULL,NULL); 
}
if (oldfd != -1) bioCreateBackgroundJob(REDIS_BIO_CLOSE_FILE,(void*)(long)oldfd,NULL,NULL);
```

以上的代码就是创建两个类型的任务；

消费者相关的代码如下：

```java
void *bioProcessBackgroundJobs(void *arg) {
    struct bio_job *job;
    unsigned long type = (unsigned long) arg;
    sigset_t sigset;
    /* Make the thread killable at any time, so that bioKillThreads()
     * can work reliably. */	// 设置线程取消相关的条件[14]
    pthread_setcancelstate(PTHREAD_CANCEL_ENABLE, NULL);
    pthread_setcanceltype(PTHREAD_CANCEL_ASYNCHRONOUS, NULL);
    pthread_mutex_lock(&bio_mutex[type]);
    /* Block SIGALRM so we are sure that only the main thread will
     * receive the watchdog signal. */
    sigemptyset(&sigset);
    sigaddset(&sigset, SIGALRM);
    if (pthread_sigmask(SIG_BLOCK, &sigset, NULL))	// 设置线程掩码
        redisLog(REDIS_WARNING,
            "Warning: can't mask SIGALRM in bio.c thread: %s", strerror(errno));
    while(1) {
        listNode *ln;
        /* The loop always starts with the lock hold. */
        if (listLength(bio_jobs[type]) == 0) {
     	// 没考虑虚假唤醒啊
            pthread_cond_wait(&bio_condvar[type],&bio_mutex[type]);
            continue;
        }
        /* Pop the job from the queue. 
         *
         * 取出（但不删除）队列中的首个任务
         */
        ln = listFirst(bio_jobs[type]);
        job = ln->value;
        /* It is now possible to unlock the background system as we know have
         * a stand alone job structure to process.*/
        pthread_mutex_unlock(&bio_mutex[type]);
        /* Process the job accordingly to its type. */
        // 执行任务
        if (type == REDIS_BIO_CLOSE_FILE) {
     	// 子线程中实际执行任务的代码
            close((long)job->arg1);
        } else if (type == REDIS_BIO_AOF_FSYNC) {
            aof_fsync((long)job->arg1);
        } else {
            redisPanic("Wrong job type in bioProcessBackgroundJobs().");
        }
        zfree(job);
        /* Lock again before reiterating the loop, if there are no longer
         * jobs to process we'll block again in pthread_cond_wait(). */
        pthread_mutex_lock(&bio_mutex[type]);
        // 将执行完成的任务从队列中删除，并减少任务计数器；需要加锁
        listDelNode(bio_jobs[type],ln);
        bio_pending[type]--;
    }
}
```

主线程通过`bioCreateBackgroundJob`把不同类型的任务插入任务链表，所以这实际上就是一个阻塞队列，其中只有两种类型的任务，就是AOF重写时close旧文件与刷新AOF缓存（page cache）。

```java
#define aof_fsync fdatasync
```

值得一提的是在3.2版本刷新缓存使用的是`fdatasync`，这种方法相比与`fsync`不够安全，相比与`sync_file_range`不过高效（但稍安全一点），不知道为什么要使用这个，在更高版本中使用的是`fsync`，不清楚后面版本还会不会更新。

以上就是3.2版本中BIO的原理与实现，抛开其他不说，这个现实生活真实运用生产者消费者的例子就是一个很好的学习资料。

### lazyfree机制

[11]中已经描述的够清楚了，我没必要再写一篇文章来描述这个问题。

我们可以在[11]中看到`lazyfree`其实就是一个新创建的BIO线程，其中支持删除键，字典以及集群中的`key-slot`结构（跳跃表）。

而所做的操作也非常简单，就是在删除键之前查看传入的参数，如果是异步选项的话就调用异步删除版本，所做的事情也就是封一个对象扔到BIO请求队列中去。

当然还有其他情况可能删除键，遂Redis4.0新加了几个配置选项，如下：

- slave-lazy-flush：slave接收完RDB文件后清空数据选项
- lazyfree-lazy-eviction：内存满逐出选项
- lazyfree-lazy-expire：过期key删除选项
- lazyfree-lazy-server-del：内部删除选项，比如rename可能伴随着一次隐式的删除键[15]。

分别代表四种删除情况时是否启动`lazy free`。具体内容可参考[15]。

### 网络IO

下图来源于[8]，基本描述了6.0版本中多线程的应用。

这里的代码解析可以查看[2]中的描述，使用了一种轮询的方式使得整个过程是无锁的，确实很巧妙，但是问题的关键在于IO子线程和主线程都是不停的轮询而不失眠，这样在空闲时候不是会跑满CPU吗？Redis目前的做法是在等待处理连接比较少的时候关闭这些 IO 线程，但是感觉还是治标不治本。

### 总结

确实是个很有意思的问题，牵扯到了很多知识点，后面有机会可以深入看看6.0版本多线程的实现细节，想必是个很有意思的经历。
