# 17、Redis 源码解析 - Redis RDB
- 来源：https://ddkk.com/zhuanlan/db/redis/6/17.html
- 分类：缓存数据库
- 分组：教程目录
RDB、AOF是Redis中数据持久化的两个机制，是数据可靠性的重要保证。其中RDB是以内存快照的形式将数据落盘。本节介绍RDB机制，相关实现在rdb.h/c中。

### RDB的触发时机

**1、** 用户主动调用save/bgsave命令，Redis借到命令之后，会做一次RDB快照；

**2、** Redis启动时候，配置文件中会规定达到某些条件时，触发一个RDB，比如：过去一段时间内，DB做了多少次修改；

**3、** 当有slave向master发出全量复制命令时，master会做一次RDB快照；

**4、** Redis接收到用户的退出命令时，进程退出之前，会主动做一次RDB快照；

### RDB文件生成

首先看一下后台启动生成RDB: rdbSaveBackground

```java
int rdbSaveBackground(char *filename, rdbSaveInfo *rsi) {
    pid_t childpid;
    long long start;
	// 已经有后台子进程了
    if (server.aof_child_pid != -1 || server.rdb_child_pid != -1) return C_ERR;
    server.dirty_before_bgsave = server.dirty;
    server.lastbgsave_try = time(NULL);
    openChildInfoPipe();
    start = ustime();
    // 采用fork方式做内存快照
    if ((childpid = fork()) == 0) {
        int retval;
        /* Child */
        // RDB子进程
        closeListeningSockets(0);
        redisSetProcTitle("redis-rdb-bgsave");
        // 生成RDB文件
        retval = rdbSave(filename,rsi);
        if (retval == C_OK) {
            size_t private_dirty = zmalloc_get_private_dirty(-1);
            if (private_dirty) {
                serverLog(LL_NOTICE,
                    "RDB: %zu MB of memory used by copy-on-write",
                    private_dirty/(1024*1024));
            }
            server.child_info_data.cow_size = private_dirty;
            // 子进程通过pipe通知父进程，RDB文件生成完毕
            sendChildInfo(CHILD_INFO_TYPE_RDB);
        }
        exitFromChild((retval == C_OK) ? 0 : 1);
    } else {
        /* Parent */
        // 父进程更新相关变量
        server.stat_fork_time = ustime()-start;
        server.stat_fork_rate = (double) zmalloc_used_memory() * 1000000 / server.stat_fork_time / (1024*1024*1024); /* GB per second. */
        latencyAddSampleIfNeeded("fork",server.stat_fork_time/1000);
        if (childpid == -1) {
            closeChildInfoPipe();
            server.lastbgsave_status = C_ERR;
            serverLog(LL_WARNING,"Can't save in background: fork: %s",
                strerror(errno));
            return C_ERR;
        }
        serverLog(LL_NOTICE,"Background saving started by pid %d",childpid);
        server.rdb_save_time_start = time(NULL);
        server.rdb_child_pid = childpid;
        server.rdb_child_type = RDB_CHILD_TYPE_DISK;
        // 关闭dict的扩容和rehash，防止fork下COW增大
        updateDictResizePolicy();
        return C_OK;
    }
    return C_OK; /* unreached */
}
```

在fork前调用openChildInfoPipe打开一个pipe，用来父子进程间通信，RDB子进程完成后通过sendChildInfo通知父进程，父进程在serverCron里面会不停的通过wait3系统调用等待子进程完成，然后做相应的处理：

```java
int serverCron(struct aeEventLoop *eventLoop, long long id, void *clientData) {
	...
	if (server.rdb_child_pid != -1 || server.aof_child_pid != -1 ||
        ldbPendingChildren())
    {
        int statloc;
        pid_t pid;
		// 等待子进程完成
        if ((pid = wait3(&statloc,WNOHANG,NULL)) != 0) {
            int exitcode = WEXITSTATUS(statloc);
            int bysignal = 0;
            if (WIFSIGNALED(statloc)) bysignal = WTERMSIG(statloc);
            if (pid == -1) {
                serverLog(LL_WARNING,"wait3() returned an error: %s. "
                    "rdb_child_pid = %d, aof_child_pid = %d",
                    strerror(errno),
                    (int) server.rdb_child_pid,
                    (int) server.aof_child_pid);
            } else if (pid == server.rdb_child_pid) {
            	// RDB子进程调用backgroundSaveDoneHandler
                backgroundSaveDoneHandler(exitcode,bysignal);
                if (!bysignal && exitcode == 0) receiveChildInfo();
            } else if (pid == server.aof_child_pid) {
            	// AOF子进程调用backgroundRewriteDoneHandler
                backgroundRewriteDoneHandler(exitcode,bysignal);
                if (!bysignal && exitcode == 0) receiveChildInfo();
            } else {
                if (!ldbRemoveChild(pid)) {
                    serverLog(LL_WARNING,
                        "Warning, detected child with unmatched pid: %ld",
                        (long)pid);
                }
            }
            // 回复dict的扩容以及rehash
            updateDictResizePolicy();
            closeChildInfoPipe();
        }
	...
}
```

子进程最终通过rdbSave来生成RDB文件，这个函数有两个参数：1、要生成的RDB文件名称；2、RDB额外需要保存的参数。第二个字段与主从同步有关，在后面文章中再详细介绍

在介绍rdbSave先看一下rio，这个结构体是读写文件、套接字、缓存的一个抽象：

```java
struct _rio {
    /* Backend functions.
     * Since this functions do not tolerate short writes or reads the return
     * value is simplified to: zero on error, non zero on complete success. */
    // 读、写、定位、flush的函数抽象
    size_t (*read)(struct _rio *, void *buf, size_t len);
    size_t (*write)(struct _rio *, const void *buf, size_t len);
    off_t (*tell)(struct _rio *);
    int (*flush)(struct _rio *);
    /* The update_cksum method if not NULL is used to compute the checksum of
     * all the data that was read or written so far. The method should be
     * designed so that can be called with the current checksum, and the buf
     * and len fields pointing to the new block of data to add to the checksum
     * computation. */
    void (*update_cksum)(struct _rio *, const void *buf, size_t len);
    /* The current checksum */
    uint64_t cksum;
    /* number of bytes read or written */
    size_t processed_bytes;
    /* maximum single read or write chunk size */
    size_t max_processing_chunk;
    /* Backend-specific vars. */
    // union是三种类型：sds、文件File、套接字fds的抽象
    union {
        /* In-memory buffer target. */
        struct {
            sds ptr;
            off_t pos;
        } buffer;
        /* Stdio file pointer target. */
        struct {
            FILE *fp;
            off_t buffered; /* Bytes written since last fsync. */
            off_t autosync; /* fsync after 'autosync' bytes written. */
        } file;
        /* Multiple FDs target (used to write to N sockets). */
        struct {
            int *fds;       /* File descriptors. */
            int *state;     /* Error state of each fd. 0 (if ok) or errno. */
            int numfds;
            off_t pos;
            sds buf;
        } fdset;
    } io;
};
```

最后来看rdbSave这个函数：

```java
/* Save the DB on disk. Return C_ERR on error, C_OK on success. */
int rdbSave(char *filename, rdbSaveInfo *rsi) {
    char tmpfile[256];
    char cwd[MAXPATHLEN]; /* Current working dir path for error messages. */
    FILE *fp;
    rio rdb;
    int error = 0;
	// 打开文件
    snprintf(tmpfile,256,"temp-%d.rdb", (int) getpid());
    fp = fopen(tmpfile,"w");
	...
	// 初始化rio
    rioInitWithFile(&rdb,fp);
	// 设置自动fsync时机
    if (server.rdb_save_incremental_fsync)
        rioSetAutoSync(&rdb,REDIS_AUTOSYNC_BYTES);
	// 开始保存RDB
    if (rdbSaveRio(&rdb,&error,RDB_SAVE_NONE,rsi) == C_ERR) {
        errno = error;
        goto werr;
    }
    /* Make sure data will not remain on the OS's output buffers */
    // RDB完成后开始fsync、fclose文件
    if (fflush(fp) == EOF) goto werr;
    if (fsync(fileno(fp)) == -1) goto werr;
    if (fclose(fp) == EOF) goto werr;
    /* Use RENAME to make sure the DB file is changed atomically only
     * if the generate DB file is ok. */
    // 重命名文件
    if (rename(tmpfile,filename) == -1) {
       ...
    }
    serverLog(LL_NOTICE,"DB saved on disk");
    server.dirty = 0;
    server.lastsave = time(NULL);
    server.lastbgsave_status = C_OK;
    return C_OK;
	...
}
```

最终调用rdbSaveRio形成RDB文件，可以看出RDB文件以下部分组成：

**1、** magic魔数：REDISxxx；

**2、** 元数据部分：redis-ver；redis-bits；ctime；used-mem；repl-stream-db；repl-id；repl-offset；aof-preamble；

**3、** 每个redisDb的KV对；

**4、** lua脚本；

**5、** 结束符以及checksum；

### RDB文件加载

RDB在以下情况下被加载：

**1、** Redis启动的时候，会调用loadDataFromDisk从磁盘上加载文件，会优先加载AOF，如果没有AOF，则加载RDB；

**2、** 主从同步的时候，slave需要全量同步，从master接受到全量的RDB文件后，开始加载RDB；

加载RDB通过rdbLoad实现，代码很长，实际上就rdbSave的逆过程，这里就不贴代码了
