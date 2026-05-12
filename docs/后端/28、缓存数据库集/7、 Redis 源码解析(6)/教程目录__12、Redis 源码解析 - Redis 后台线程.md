# 12、Redis 源码解析 - Redis 后台线程
- 来源：https://ddkk.com/zhuanlan/db/redis/6/12.html
- 分类：缓存数据库
- 分组：教程目录
Redis除了主线程外，还有三个后台线程，在Redis启动时，会调用InitServerLast函数在基本初始化完成之后，做最后的初始化：

```java
void InitServerLast() {
    bioInit();
    server.initial_memory_usage = zmalloc_used_memory();
}
```

bioInit就是用来初始化后台的三个线程

### 后台线程实现

后台线程的实现在bio.h/c中，有三种任务类型，也就对应了三个后台线程：

```java
/* Background job opcodes */
#define BIO_CLOSE_FILE    0 /* Deferred close(2) syscall. */
#define BIO_AOF_FSYNC     1 /* Deferred AOF fsync. */
#define BIO_LAZY_FREE     2 /* Deferred objects freeing. */
#define BIO_NUM_OPS       3
```

BIO_CLOSE_FILE：关闭文件

BIO_AOF_FSYNC：异步fsync持久化aof文件

BIO_LAZY_FREE：KV对的内存懒释放

这三种任务都是比较耗时的任务，同时对于redisDb的正确性没有影响，可以从主线程中剥离出来，交给后台线程执行，避免主线程的阻塞，造成抖动。

在bioInit中，初始化这三个后台任务线程的锁、条件变量、任务队列：

```java
void bioInit(void) {
    pthread_attr_t attr;
    pthread_t thread;
    size_t stacksize;
    int j;
    /* Initialization of state vars and objects */
    // 初始化任务线程的锁、条件变量、任务队列
    for (j = 0; j < BIO_NUM_OPS; j++) {
        pthread_mutex_init(&bio_mutex[j],NULL);
        pthread_cond_init(&bio_newjob_cond[j],NULL);
        pthread_cond_init(&bio_step_cond[j],NULL);
        bio_jobs[j] = listCreate();
        bio_pending[j] = 0;
    }
    /* Set the stack size as by default it may be small in some system */
    pthread_attr_init(&attr);
    pthread_attr_getstacksize(&attr,&stacksize);
    if (!stacksize) stacksize = 1; /* The world is full of Solaris Fixes */
    while (stacksize < REDIS_THREAD_STACK_SIZE) stacksize *= 2;
    pthread_attr_setstacksize(&attr, stacksize);
    /* Ready to spawn our threads. We use the single argument the thread
     * function accepts in order to pass the job ID the thread is
     * responsible of. */
    // 创建并启动后台线程
    for (j = 0; j < BIO_NUM_OPS; j++) {
        void *arg = (void*)(unsigned long) j;
        if (pthread_create(&thread,&attr,bioProcessBackgroundJobs,arg) != 0) {
            serverLog(LL_WARNING,"Fatal: Can't initialize Background Jobs.");
            exit(1);
        }
        bio_threads[j] = thread;
    }
}
```

线程的执行函数为bioProcessBackgroundJobs，不停的从线程任务队列中取出任务，根据任务类型，调用不同的函数处理：

```java
void *bioProcessBackgroundJobs(void *arg) {
	...
    pthread_mutex_lock(&bio_mutex[type]);
    /* Block SIGALRM so we are sure that only the main thread will
     * receive the watchdog signal. */
    sigemptyset(&sigset);
    sigaddset(&sigset, SIGALRM);
    if (pthread_sigmask(SIG_BLOCK, &sigset, NULL))
        serverLog(LL_WARNING,
            "Warning: can't mask SIGALRM in bio.c thread: %s", strerror(errno));
    while(1) {
        listNode *ln;
        /* The loop always starts with the lock hold. */
        if (listLength(bio_jobs[type]) == 0) {
            pthread_cond_wait(&bio_newjob_cond[type],&bio_mutex[type]);
            continue;
        }
        /* Pop the job from the queue. */
        ln = listFirst(bio_jobs[type]);
        job = ln->value;
        /* It is now possible to unlock the background system as we know have
         * a stand alone job structure to process.*/
        pthread_mutex_unlock(&bio_mutex[type]);
        /* Process the job accordingly to its type. */
        // 根据任务类型，调用不同的函数处理
        if (type == BIO_CLOSE_FILE) {
            close((long)job->arg1);
        } else if (type == BIO_AOF_FSYNC) {
            redis_fsync((long)job->arg1);
        } else if (type == BIO_LAZY_FREE) {
            /* What we free changes depending on what arguments are set:
             * arg1 -> free the object at pointer.
             * arg2 & arg3 -> free two dictionaries (a Redis DB).
             * only arg3 -> free the skiplist. */
            if (job->arg1)
                lazyfreeFreeObjectFromBioThread(job->arg1);
            else if (job->arg2 && job->arg3)
                lazyfreeFreeDatabaseFromBioThread(job->arg2,job->arg3);
            else if (job->arg3)
                lazyfreeFreeSlotsMapFromBioThread(job->arg3);
        } else {
            serverPanic("Wrong job type in bioProcessBackgroundJobs().");
        }
        zfree(job);
        /* Lock again before reiterating the loop, if there are no longer
         * jobs to process we'll block again in pthread_cond_wait(). */
        pthread_mutex_lock(&bio_mutex[type]);
        listDelNode(bio_jobs[type],ln);
        bio_pending[type]--;
        /* Unblock threads blocked on bioWaitStepOfType() if any. */
        pthread_cond_broadcast(&bio_step_cond[type]);
    }
}
```

其中lazy free分成三种：

lazyfreeFreeObjectFromBioThread：lazy free一对KV

lazyfreeFreeDatabaseFromBioThread：lazy free一个redisDb

lazyfreeFreeSlotsMapFromBioThread：lazy free一个slot中的所有key

### 后台任务

```java
struct bio_job {
    time_t time; /* Time at which the job was created. */
    /* Job specific arguments pointers. If we need to pass more than three
     * arguments we can just pass a pointer to a structure or alike. */
    void *arg1, *arg2, *arg3;
};
```

后台任务可能包含三个参数，用于后台线程执行

后台任务的创建和提交很简单，初始化一个后台任务并复制，然后加锁提交到后台线程的任务列表中

```java
void bioCreateBackgroundJob(int type, void *arg1, void *arg2, void *arg3) {
    struct bio_job *job = zmalloc(sizeof(*job));
    job->time = time(NULL);
    job->arg1 = arg1;
    job->arg2 = arg2;
    job->arg3 = arg3;
    pthread_mutex_lock(&bio_mutex[type]);
    listAddNodeTail(bio_jobs[type],job);
    bio_pending[type]++;
    pthread_cond_signal(&bio_newjob_cond[type]);
    pthread_mutex_unlock(&bio_mutex[type]);
}
```

后台任务的提交时机主要有以下几种：

**1、** 删除（包括用户删除、过期健清理、内存淘汰）一个key时，如果设置了可以lazyfree，同时value较大，会提交一个lazyfreekey的任务；

**2、** 清空一个DB时，会提交一个lazyfreeDB/Slot的任务；

**3、** 开启aof时，并且可以异步flush，则会提交一个异步flushaof任务；

**4、** 开启aof时，aofrewrite或者切换时，会提交一个异步close文件任务；
