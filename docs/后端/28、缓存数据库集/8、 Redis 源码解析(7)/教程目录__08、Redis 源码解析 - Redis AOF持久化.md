# 08、Redis 源码解析 - Redis AOF持久化
- 来源：https://ddkk.com/zhuanlan/db/redis/7/8.html
- 分类：缓存数据库
- 分组：教程目录
**AOF持久化是为了弥补RDB持久化中数据丢失的不可控性和在执行RDB时消耗的大量资源(需要把所有数据库的所有键值都拷贝到RDB文件中)而存在的一种持久化.AOF非常类似与MySQL中的redo日志,它们都是记录每条使得服务器状态做出改变的命令,以顺序IO插入到AOF文件(mysql中当然不是这个)中.**

### AOF策略

在说清楚AOF持久化的策略之前,我觉得我们得清楚数据在数据库中到底经历了哪些事情

**1、** 由write类系统调用写入内核,但内核中为了减少磁盘IO的次数,其实是维护了缓冲区的,即我们的数据进入内核缓冲区；

**2、** 由内核缓冲区写入磁盘驱动程序,其中可能会有磁盘的缓存；

**3、** 数据真正的写入到物理介质上(磁盘)；

那么数据的丢失又有哪些情况呢?

**1、** 服务器这个进程宕机,但是操作系统没有挂,也就是说上面三步只要执行了第一步就可以,操作系统就可以确保数据写回磁盘.；

**2、** 断电等不可控因素,就算写到内核缓冲或者磁盘缓冲还是没用,得真正写入到磁盘上才可以.即我们得执行第三步；

这里我们不讨论磁盘上的缓存,那有专门的人操心,我们只需要保证数据能够发给磁盘即可.由上面我们举的数据进入磁盘的三步,操作系统为前两部提供了API,使得我们可以更好的让程序按照我们想要的那样运行,即`write`和(`fsync`/`fdatasync`).

AOF的策略保证了我们能够在断电的情况下不丢失超过一秒的数据(其实是两秒,下面会说),分为三种策略,这里不详细讨论,网上说这个的博客多如牛毛.我们只说它们的区别,就是**多长时间进行一次fsync,即把数据从内核缓冲刷入磁盘**.因为如果数据已经写入磁盘,我们就可以认为数据已经持久化了,所以fsync的间隔是保证redis数据安全的最重要的要素.

下面说下为什么会丢失超过两秒的数据,可以参考flushAppendOnlyFile中的代码解析.**因为fsync这个操作可能执行时间比较长,如果在下一次执行flush的时候上一次fsync还未完成且此次flush距上次间隔在两秒之内的话,此次flush的不会执行,会直接退出,这些数据就会只存在在内存中,这样就会导致在有些情况下两秒的数据丢失.**

首先列出在我们执行AOF时redisserver中我们需要使用的参数

```java
struct rediserver{
    // AOF 文件的当前字节大小
    off_t aof_current_size;         /* AOF current size. */
    int aof_rewrite_scheduled;      /* Rewrite once BGSAVE terminates. */
    // 负责进行 AOF 重写的子进程 ID
    pid_t aof_child_pid;            /* PID if rewriting process */
    // AOF 重写缓存链表，链接着多个缓存块 用于在AOF执行时缓存到来的命令
    list *aof_rewrite_buf_blocks;   /* Hold changes during an AOF rewrite. */
    // AOF 缓冲区
    sds aof_buf;      /* AOF buffer, written before entering the event loop */
    // AOF 文件的描述符
    int aof_fd;       /* File descriptor of currently selected AOF file */
    // AOF 的当前目标数据库
    int aof_selected_db; /* Currently selected DB in AOF */
	.......
    // 推迟 write 操作的时间
    time_t aof_flush_postponed_start; /* UNIX time of postponed AOF flush */
    // 最后一直执行 fsync 的时间
    time_t aof_last_fsync;            /* UNIX time of last fsync() */
    time_t aof_rewrite_time_last;   /* Time used by last AOF rewrite run. */
    // AOF 重写的开始时间
    time_t aof_rewrite_time_start;  /* Current AOF rewrite start time. */
	..........
}
```

**首先是在每次事件循环结束时要执行的flush操作flushAppendOnlyFile**,它的作用是把我们写入在`aof_buf`中的缓冲数据通过write写入系统缓冲区,然后通过系统中的配置`appendfsync`来决定`fsync`的频率.上面已经提到了.接下来我们就来看看源码吧

#### 事件循环中的flush操作

```java
void flushAppendOnlyFile(int force) {
    ssize_t nwritten;
    int sync_in_progress = 0; //是否正在进行fsync 如果正在进行需要判断是否已经进行了两秒
    // 缓冲区中没有任何内容，直接返回
    if (sdslen(server.aof_buf) == 0) return;
    // 策略为每秒 FSYNC 
    if (server.aof_fsync == AOF_FSYNC_EVERYSEC)
        // 是否有 SYNC 正在后台进行?
        // 避免write和fsync同时操作同一个文件描述符 write阻塞主线程
        sync_in_progress = bioPendingJobsOfType(REDIS_BIO_AOF_FSYNC) != 0;
    // 每秒 fsync,并且强制写入为假
    if (server.aof_fsync == AOF_FSYNC_EVERYSEC && !force) {
        /* With this append fsync policy we do background fsyncing.
         *
         * 当 fsync 策略为每秒钟一次时， fsync 在后台执行。
         *
         * If the fsync is still in progress we can try to delay
         * the write for a couple of seconds. 
         *
         * 如果后台仍在执行 FSYNC ，那么我们可以延迟写操作一两秒
         * （如果强制执行 write 的话，服务器主线程将阻塞在 write 上面）
         */
        if (sync_in_progress) {
            // 有 fsync 正在后台进行 。。。
            if (server.aof_flush_postponed_start == 0) {
                /* No previous write postponinig, remember that we are
                 * postponing the flush and return. 
                 *
                 * 前面没有推迟过 write 操作，这里将推迟写操作的时间记录下来
                 * 然后就返回，不执行 write 或者 fsync 
                 */
                server.aof_flush_postponed_start = server.unixtime;
                return;
            } else if (server.unixtime - server.aof_flush_postponed_start < 2) {
                /* We were already waiting for fsync to finish, but for less
                 * than two seconds this is still ok. Postpone again. 
                 *
                 * 如果之前已经因为 fsync 而推迟了 write 操作
                 * 但是推迟的时间不超过 2 秒，那么直接返回
                 * 不执行 write 或者 fsync
                 * 防止write阻塞主线程
                 */
                return;
            }
            /* Otherwise fall trough, and go write since we can't wait
             * over two seconds. 
             *
             * 如果后台还有 fsync 在执行，并且 write 已经推迟 >= 2 秒
             * 那么执行写操作（write 将被阻塞）
             */
            server.aof_delayed_fsync++;
            redisLog(REDIS_NOTICE,"Asynchronous AOF fsync is taking too long (disk is busy?). Writing the AOF buffer without waiting for fsync to complete, this may slow down Redis.");
        }
    }
    /* If you are following this code path, then we are going to write so
     * set reset the postponed flush sentinel to zero. 
     *
     * 执行到这里，程序会对 AOF 文件进行写入。
     *
     * 清零延迟 write 的时间记录
     */
    server.aof_flush_postponed_start = 0;
    /* We want to perform a single write. This should be guaranteed atomic
     * at least if the filesystem we are writing is a real physical one.
     *
     * 执行单个 write 操作，如果写入设备是物理的话，那么这个操作应该是原子的
     *
     * While this will save us against the server being killed I don't think
     * there is much to do about the whole server stopping for power problems
     * or alike 
     *
     * 当然，如果出现像电源中断这样的不可抗现象，那么 AOF 文件也是可能会出现问题的
     * 这时就要用 redis-check-aof 程序来进行修复。
     * 下面的write向aof文件写存储在aof_buf中的数据
     */
    nwritten = write(server.aof_fd,server.aof_buf,sdslen(server.aof_buf));
    //可能磁盘缓冲不足 导致写入数据不够 或其他原因导致写入失败
    if (nwritten != (signed)sdslen(server.aof_buf)) {
        static time_t last_write_error_log = 0;
        int can_log = 0;
        /* Limit logging rate to 1 line per AOF_WRITE_LOG_ERROR_RATE seconds. */
        // 将日志的记录频率限制在每行 AOF_WRITE_LOG_ERROR_RATE 秒
        if ((server.unixtime - last_write_error_log) > AOF_WRITE_LOG_ERROR_RATE) {
            can_log = 1;
            last_write_error_log = server.unixtime;
        }
        /* Lof the AOF write error and record the error code. */
        // 如果写入出错，那么尝试将该情况写入到日志里面
        if (nwritten == -1) {
            if (can_log) {
                redisLog(REDIS_WARNING,"Error writing to the AOF file: %s",
                    strerror(errno));
                server.aof_last_write_errno = errno;
            }
        } else {
            if (can_log) {
                redisLog(REDIS_WARNING,"Short write while writing to "
                                       "the AOF file: (nwritten=%lld, "
                                       "expected=%lld)",
                                       (long long)nwritten,
                                       (long long)sdslen(server.aof_buf));
            }
            // 我们不希望数据不完整 所以尝试移除新追加的不完整内容 
            if (ftruncate(server.aof_fd, server.aof_current_size) == -1) {
                if (can_log) {
                    redisLog(REDIS_WARNING, "Could not remove short write "
                             "from the append-only file.  Redis may refuse "
                             "to load the AOF the next time it starts.  "
                             "ftruncate: %s", strerror(errno));
                }
            } else {
                /* If the ftrunacate() succeeded we can set nwritten to
                 * -1 since there is no longer partial data into the AOF. */
                nwritten = -1;
            }
            //ENOSPC -> /* No space left on device */
            server.aof_last_write_errno = ENOSPC; //磁盘缓冲空间不足
        }
        /* Handle the AOF write error. */
        // 处理写入 AOF 文件时出现的错误 
        // 当模式为ALWAYS是 写入错误时无法处理 直接结束进程 
        if (server.aof_fsync == AOF_FSYNC_ALWAYS) {
            /* We can't recover when the fsync policy is ALWAYS since the
             * reply for the client is already in the output buffers, and we
             * have the contract with the user that on acknowledged write data
             * is synched on disk. */
            redisLog(REDIS_WARNING,"Can't recover from AOF write error when the AOF fsync policy is 'always'. Exiting...");
            exit(1);
        } else {
            /* Recover from failed write leaving data into the buffer. However
             * set an error to stop accepting writes as long as the error
             * condition is not cleared. */
            server.aof_last_write_status = REDIS_ERR;
            /* Trim the sds buffer if there was a partial write, and there
             * was no way to undo it with ftruncate(2). */
            if (nwritten > 0) {
                server.aof_current_size += nwritten;
                sdsrange(server.aof_buf,nwritten,-1); //把缓冲区中读指针向后移动 下次再尝试写入
            }
            return; /* We'll try again on the next call... */
        }
    } else {
        /* Successful write(2). If AOF was in error state, restore the
         * OK state and log the event. */
        // 写入成功，更新最后写入状态
        if (server.aof_last_write_status == REDIS_ERR) {
            redisLog(REDIS_WARNING,
                "AOF write error looks solved, Redis can write again.");
            server.aof_last_write_status = REDIS_OK;
        }
    }
    // 更新写入后的 AOF 文件大小
    server.aof_current_size += nwritten;
    /* Re-use AOF buffer when it is small enough. The maximum comes from the
     * arena size of 4k minus some overhead (but is otherwise arbitrary). 
     *
     * 如果 AOF 缓存的大小足够小的话，那么重用这个缓存，
     * 否则的话，释放 AOF 缓存。
     */
        //这个式子加起来是缓冲区的大小
    if ((sdslen(server.aof_buf)+sdsavail(server.aof_buf)) < 4000) {
        // 清空缓存中的内容，等待重用
        sdsclear(server.aof_buf);
    } else {
        // 释放缓存
        sdsfree(server.aof_buf);
        server.aof_buf = sdsempty(); //防止缓存过大 在后面的存储中存不满 导致碎片 重新分配
    }
    /* Don't fsync if no-appendfsync-on-rewrite is set to yes and there are
     * children doing I/O in the background. 
     *
     * 如果 no-appendfsync-on-rewrite 选项为开启状态，
     * 并且有 BGSAVE 或者 BGREWRITEAOF 正在进行的话，
     * 那么不执行 fsync 
     */
    if (server.aof_no_fsync_on_rewrite &&
        (server.aof_child_pid != -1 || server.rdb_child_pid != -1))
            return;
    /* Perform the fsync if needed. */
    // 下面就是将数据从内核缓冲区刷到磁盘驱动最重要的一步
    // 总是执行 fsnyc
    if (server.aof_fsync == AOF_FSYNC_ALWAYS) {
        /* aof_fsync is defined as fdatasync() for Linux in order to avoid
         * flushing metadata. */
        aof_fsync(server.aof_fd); /* Let's try to get this data on the disk */
        // 更新最后一次执行 fsnyc 的时间
        server.aof_last_fsync = server.unixtime;
    // 策略为每秒 fsnyc ，并且距离上次 fsync 已经超过 1 秒
    } else if ((server.aof_fsync == AOF_FSYNC_EVERYSEC &&
                server.unixtime > server.aof_last_fsync)) {
        // 放到后台执行
        if (!sync_in_progress) aof_background_fsync(server.aof_fd);
        // 更新最后一次执行 fsync 的时间
        server.aof_last_fsync = server.unixtime;
    }
}
```

#### 重写操作

我们再来看看在执行**BGREWRITEAOF**进行后台重写的时候的实现`rewriteAppendOnlyFileBackground`,其中当然也包括了重写的真正实现函数`rewriteAppendOnlyFile`

```java
/*
 *    父进程会捕捉子进程的退出信号，
 *    如果子进程的退出状态是 OK 的话，
 *    那么父进程将新输入命令的缓存追加到临时文件，
 *    然后使用 rename(2) 对临时文件改名，用它代替旧的 AOF 文件，
 *    至此，后台 AOF 重写完成。
 */
int rewriteAppendOnlyFileBackground(void) {
    pid_t childpid; //子进程进程号
    long long start; //记录fork开始前的时间,计算fork耗时用
    // 已经有进程在进行 AOF 重写了
    if (server.aof_child_pid != -1) return REDIS_ERR;
    start = ustime();
    //我们可以看到在重写时并没有把资源池化 而是使用很笨重的操作fork
    if ((childpid = fork()) == 0) {
        char tmpfile[256]; //保存重写使用的临时文件名
        /* Child */
        // 关闭网络连接 fd 这一步为什么?
        closeListeningSockets(0);
        // 为进程设置名字，方便记认
        redisSetProcTitle("redis-aof-rewrite");
        // 创建临时文件，并进行 AOF 重写
        snprintf(tmpfile,256,"temp-rewriteaof-bg-%d.aof", (int) getpid());
        if (rewriteAppendOnlyFile(tmpfile) == REDIS_OK) {
      //重写返回OK 完成重写操作 并没有exec 当然也没有必要
            size_t private_dirty = zmalloc_get_private_dirty();
            if (private_dirty) {
                redisLog(REDIS_NOTICE,
                    "AOF rewrite: %zu MB of memory used by copy-on-write",
                    private_dirty/(1024*1024));
            }
            // 通知父进程
            // 发送重写成功信号
            exitFromChild(0);
        } else {
            // 发送重写失败信号
            exitFromChild(1);
        }
    } else {
        /* Parent */
        // 记录执行 fork 所消耗的时间
        server.stat_fork_time = ustime()-start;
        if (childpid == -1) {
      //fork失败
            redisLog(REDIS_WARNING,
                "Can't rewrite append only file in background: fork: %s",
                strerror(errno));
            return REDIS_ERR;
        }
        redisLog(REDIS_NOTICE,
            "Background append only file rewriting started by pid %d",childpid);
        // 记录 AOF 重写的信息 
        server.aof_rewrite_scheduled = 0;
        server.aof_rewrite_time_start = time(NULL);
        server.aof_child_pid = childpid;
        // 关闭字典自动 rehash
        updateDictResizePolicy();
        /* We set appendseldb to -1 in order to force the next call to the
         * feedAppendOnlyFile() to issue a SELECT command, so the differences
         * accumulated by the parent into server.aof_rewrite_buf will start
         * with a SELECT statement and it will be safe to merge. 
         *
         * 将 aof_selected_db 设为 -1 ，
         * 强制让 feedAppendOnlyFile() 下次执行时引发一个 SELECT 命令，
         * 从而确保之后新添加的命令会设置到正确的数据库中
         */
        server.aof_selected_db = -1;
        replicationScriptCacheFlush();
        return REDIS_OK;
    }
    return REDIS_OK; /* unreached */
}
int rewriteAppendOnlyFile(char *filename) {
      //子进程执行的重写函数,
    dictIterator *di = NULL; //遍历字典时要使用的迭代器
    dictEntry *de;  //得到的每一项
    rio aof; //
    FILE *fp; //临时文件的文件指针
    char tmpfile[256];
    int j;
    long long now = mstime(); //当前时间
    /* Note that we have to use a different temp name here compared to the
     * one used by rewriteAppendOnlyFileBackground() function. 
     *
     * 创建临时文件
     *
     * 注意这里创建的文件名和 rewriteAppendOnlyFileBackground() 创建的文件名稍有不同
     */
    snprintf(tmpfile,256,"temp-rewriteaof-%d.aof", (int) getpid());
    fp = fopen(tmpfile,"w");
    if (!fp) {
        redisLog(REDIS_WARNING, "Opening the temp file for AOF rewrite in rewriteAppendOnlyFile(): %s", strerror(errno));
        return REDIS_ERR;
    }
    // 初始化文件 io
    rioInitWithFile(&aof,fp);
    // 设置每写入 REDIS_AOF_AUTOSYNC_BYTES 字节
    // 就执行一次 FSYNC 
    // 防止缓存中积累太多命令内容，造成 I/O 阻塞时间过长
    if (server.aof_rewrite_incremental_fsync)
        rioSetAutoSync(&aof,REDIS_AOF_AUTOSYNC_BYTES);
    // 遍历所有数据库   dbnum是数据库的总数
    for (j = 0; j < server.dbnum; j++) {
        char selectcmd[] = "*2\r\n$6\r\nSELECT\r\n";
        redisDb *db = server.db+j;
        // 指向键空间
        dict *d = db->dict;
        if (dictSize(d) == 0) continue;
        // 创建键空间迭代器
        di = dictGetSafeIterator(d); //是一个安全迭代器 安全迭代器存在的时候不进行rehash
        if (!di) {
            fclose(fp);
            return REDIS_ERR;
        }
        /* SELECT the new DB 
         *
         * 每个数据库记录的开头首先写入SELECT命令,确保之后的数据会被插入到正确的数据库上
         */
        if (rioWrite(&aof,selectcmd,sizeof(selectcmd)-1) == 0) goto werr;
        if (rioWriteBulkLongLong(&aof,j) == 0) goto werr;
        /* Iterate this DB writing every entry 
         *
         * 遍历数据库所有键,并通过命令将它们的当前状态（值）记录到新 AOF 文件中
         */
        while((de = dictNext(di)) != NULL) {
            sds keystr;
            robj key, *o;
            long long expiretime;
            // 取出键
            keystr = dictGetKey(de);
            // 取出值
            o = dictGetVal(de);
            initStaticStringObject(key,keystr);
            // 取出过期时间
            expiretime = getExpire(db,&key);
            /* If this key is already expired skip it 
             *
             * 如果键已经过期,那么跳过它,不保存 这也是使得文件变小的很重要的一点
             */
            if (expiretime != -1 && expiretime < now) continue;
            /* Save the key and associated value 
             *
             * 根据值的类型，选择适当的命令来保存值
             * 值得一提的是每个支持多参数的命令不会使得参数超过64个 防止客户端缓存溢出
             * 每一种类型对应的写入方法都是不一样的 这里不解析每种写入方法 有兴趣可以看看
             */
            if (o->type == REDIS_STRING) {
                /* Emit a SET command */
                char cmd[]="*3\r\n$3\r\nSET\r\n";
                if (rioWrite(&aof,cmd,sizeof(cmd)-1) == 0) goto werr;
                /* Key and value */
                if (rioWriteBulkObject(&aof,&key) == 0) goto werr;
                if (rioWriteBulkObject(&aof,o) == 0) goto werr;
            } else if (o->type == REDIS_LIST) {
                if (rewriteListObject(&aof,&key,o) == 0) goto werr;
            } else if (o->type == REDIS_SET) {
                if (rewriteSetObject(&aof,&key,o) == 0) goto werr;
            } else if (o->type == REDIS_ZSET) {
                if (rewriteSortedSetObject(&aof,&key,o) == 0) goto werr;
            } else if (o->type == REDIS_HASH) {
                if (rewriteHashObject(&aof,&key,o) == 0) goto werr;
            } else {
                redisPanic("Unknown object type");
            }
            /* Save the expire time 
             *
             * 保存键的过期时间
             */
            if (expiretime != -1) {
                char cmd[]="*3\r\n$9\r\nPEXPIREAT\r\n";
                // 写入 PEXPIREAT expiretime 命令
                if (rioWrite(&aof,cmd,sizeof(cmd)-1) == 0) goto werr;
                if (rioWriteBulkObject(&aof,&key) == 0) goto werr;
                if (rioWriteBulkLongLong(&aof,expiretime) == 0) goto werr;
            }
        }
        // 释放迭代器
        dictReleaseIterator(di);
    }
    /* Make sure data will not remain on the OS's output buffers */
    // 冲洗并关闭新 AOF 文件
    if (fflush(fp) == EOF) goto werr;
    if (aof_fsync(fileno(fp)) == -1) goto werr;
    if (fclose(fp) == EOF) goto werr;
    /* Use RENAME to make sure the DB file is changed atomically only
     * if the generate DB file is ok. 
     *
     * 原子地改名，用重写后的新 AOF 文件覆盖旧 AOF 文件
     */
    if (rename(tmpfile,filename) == -1) {
        redisLog(REDIS_WARNING,"Error moving temp append only file on the final destination: %s", strerror(errno));
        unlink(tmpfile); //减少这个文件的引用计数 也是remove删除文件的时候调用的函数
        return REDIS_ERR;
    }
    redisLog(REDIS_NOTICE,"SYNC append only file rewrite performed");
    return REDIS_OK;
werr: //当有任何错误的时候都会goto到这里来
    fclose(fp);
    unlink(tmpfile);
    redisLog(REDIS_WARNING,"Write error writing append only file on disk: %s", strerror(errno));
    if (di) dictReleaseIterator(di);
    return REDIS_ERR;
}
```

#### 重写结束后主线程操作

我们在`rewriteAppendOnlyFileBackground`中看到在子进程在执行完毕后会发出信号,那么父进程在接收到信号后会干些什么呢?

其实简单来说就是把重写缓存中的数据写入临时AOF文件以后再改个名字,然后再在`redisserver`中把相关的状态改变,比如AOF文件大小,AOF文件fd,文件指针等.当然我们再进行完重写以后也要释放重写缓冲中的资源,和移除临时文件.这样的话所有的状态就恢复到重写之前了.

```java
//当子线程完成 AOF 重写时,即接父进程收到信号的时候调用这个函数
void backgroundRewriteDoneHandler(int exitcode, int bysignal) {
    if (!bysignal && exitcode == 0) {
        int newfd, oldfd;
        char tmpfile[256];
        long long now = ustime();
        redisLog(REDIS_NOTICE, //首先记录日志 重写完成
            "Background AOF rewrite terminated with success");
        /* Flush the differences accumulated by the parent to the
         * rewritten AOF. */
        // 打开保存新 AOF 文件内容的临时文件
        snprintf(tmpfile,256,"temp-rewriteaof-bg-%d.aof",
            (int)server.aof_child_pid);
        newfd = open(tmpfile,O_WRONLY|O_APPEND);//o_app是因为我们还需要添加缓存信息
        if (newfd == -1) {
            redisLog(REDIS_WARNING,
                "Unable to open the temporary AOF produced by the child: %s", strerror(errno));
            goto cleanup;
        }
        // 将累积的重写缓存写入到临时文件中
        // 这个函数调用的 write 操作会阻塞主进程
        // 重写缓存的组织方式为缓存链表
        if (aofRewriteBufferWrite(newfd) == -1) {
            redisLog(REDIS_WARNING,
                "Error trying to flush the parent diff to the rewritten AOF: %s", strerror(errno));
            close(newfd);
            goto cleanup;
        }
        redisLog(REDIS_NOTICE,
            "Parent diff successfully flushed to the rewritten AOF (%lu bytes)", aofRewriteBufferSize());
        /* The only remaining thing to do is to rename the temporary file to
         * the configured file and switch the file descriptor used to do AOF
         * writes. We don't want close(2) or rename(2) calls to block the
         * server on old file deletion.
         *
         * 剩下的工作就是将临时文件改名为 AOF 程序指定的文件名，
         * 并将新文件的 fd 设为 AOF 程序的写目标。
         *
         * 不过这里有一个问题 ——
         * 我们不想 close(2) 或者 rename(2) 在删除旧文件时阻塞。
         *
         * There are two possible scenarios:
         *
         * 以下是两个可能的场景：
         *
         * 1) AOF is DISABLED and this was a one time rewrite. The temporary
         * file will be renamed to the configured file. When this file already
         * exists, it will be unlinked, which may block the server.
         *
         * AOF 被关闭，这个是一次单次的写操作。
         * 临时文件会被改名为 AOF 文件。
         * 本来已经存在的 AOF 文件会被 unlink ，这可能会阻塞服务器。
         *
         * 2) AOF is ENABLED and the rewritten AOF will immediately start
         * receiving writes. After the temporary file is renamed to the
         * configured file, the original AOF file descriptor will be closed.
         * Since this will be the last reference to that file, closing it
         * causes the underlying file to be unlinked, which may block the
         * server.
         *
         * AOF 被开启，并且重写后的 AOF 文件会立即被用于接收新的写入命令。
         * 当临时文件被改名为 AOF 文件时，原来的 AOF 文件描述符会被关闭。
         * 因为 Redis 会是最后一个引用这个文件的进程，
         * 所以关闭这个文件会引起 unlink ，这可能会阻塞服务器。
         *
         * To mitigate the blocking effect of the unlink operation (either
         * caused by rename(2) in scenario 1, or by close(2) in scenario 2), we
         * use a background thread to take care of this. First, we
         * make scenario 1 identical to scenario 2 by opening the target file
         * when it exists. The unlink operation after the rename(2) will then
         * be executed upon calling close(2) for its descriptor. Everything to
         * guarantee atomicity for this switch has already happened by then, so
         * we don't care what the outcome or duration of that close operation
         * is, as long as the file descriptor is released again. 
         *
         * 为了避免出现阻塞现象，程序会将 close(2) 放到后台线程执行，
         * 这样服务器就可以持续处理请求，不会被中断。
         */
        if (server.aof_fd == -1) {
            /* AOF disabled */
             /* Don't care if this fails: oldfd will be -1 and we handle that.
              * One notable case of -1 return is if the old file does
              * not exist. */
             oldfd = open(server.aof_filename,O_RDONLY|O_NONBLOCK);
        } else {
            /* AOF enabled */
            oldfd = -1; /* We'll set this to the current AOF filedes later. */
        }
        /* Rename the temporary file. This will not unlink the target file if
         * it exists, because we reference it with "oldfd". 
         *
         * 对临时文件进行改名，替换现有的 AOF 文件。
         *
         * 旧的 AOF 文件不会在这里被 unlink ，因为 oldfd 引用了它。
         */
        if (rename(tmpfile,server.aof_filename) == -1) {
            redisLog(REDIS_WARNING,
                "Error trying to rename the temporary AOF file: %s", strerror(errno));
            close(newfd);
            if (oldfd != -1) close(oldfd);
            goto cleanup;
        }
        if (server.aof_fd == -1) {
            /* AOF disabled, we don't need to set the AOF file descriptor
             * to this new file, so we can close it. 
             *
             * AOF 被关闭，直接关闭 AOF 文件，
             * 因为关闭 AOF 本来就会引起阻塞，所以这里就算 close 被阻塞也无所谓
             */
            close(newfd);
        } else {
            /* AOF enabled, replace the old fd with the new one. 
             *
             * 用新 AOF 文件的 fd 替换原来 AOF 文件的 fd
             */
            oldfd = server.aof_fd;
            server.aof_fd = newfd;
            // 因为前面进行了 AOF 重写缓存追加，所以这里立即 fsync 一次
            if (server.aof_fsync == AOF_FSYNC_ALWAYS)
                aof_fsync(newfd);
            else if (server.aof_fsync == AOF_FSYNC_EVERYSEC)
                aof_background_fsync(newfd);
            // 强制引发 SELECT
            server.aof_selected_db = -1; /* Make sure SELECT is re-issued */
            // 更新 AOF 文件的大小
            aofUpdateCurrentSize();
            // 记录前一次重写时的大小
            server.aof_rewrite_base_size = server.aof_current_size;
            /* Clear regular AOF buffer since its contents was just written to
             * the new AOF from the background rewrite buffer. 
             *
             * 清空 AOF 缓存，因为它的内容已经被写入过了，没用了
             */
            sdsfree(server.aof_buf);
            server.aof_buf = sdsempty();
        }
        server.aof_lastbgrewrite_status = REDIS_OK;
        redisLog(REDIS_NOTICE, "Background AOF rewrite finished successfully");
        /* Change state from WAIT_REWRITE to ON if needed 
         *
         * 如果是第一次创建 AOF 文件，那么更新 AOF 状态
         */
        if (server.aof_state == REDIS_AOF_WAIT_REWRITE)
            server.aof_state = REDIS_AOF_ON;
        /* Asynchronously close the overwritten AOF. 
         *
         * 异步关闭旧 AOF 文件
         */
        if (oldfd != -1) bioCreateBackgroundJob(REDIS_BIO_CLOSE_FILE,(void*)(long)oldfd,NULL,NULL);
        redisLog(REDIS_VERBOSE,
            "Background AOF rewrite signal handler took %lldus", ustime()-now);
    // BGREWRITEAOF 重写出错
    } else if (!bysignal && exitcode != 0) {
        server.aof_lastbgrewrite_status = REDIS_ERR;
        redisLog(REDIS_WARNING,
            "Background AOF rewrite terminated with error");
    // 未知错误
    } else {
        server.aof_lastbgrewrite_status = REDIS_ERR;
        redisLog(REDIS_WARNING,
            "Background AOF rewrite terminated by signal %d", bysignal);
    }
cleanup:
    // 清空 AOF 缓冲区
    aofRewriteBufferReset();
    // 移除临时文件
    aofRemoveTempFile(server.aof_child_pid);
    // 重置默认属性
    server.aof_child_pid = -1;
    server.aof_rewrite_time_last = time(NULL)-server.aof_rewrite_time_start;
    server.aof_rewrite_time_start = -1;
    /* Schedule a new rewrite if we are waiting for it to switch the AOF ON. */
    if (server.aof_state == REDIS_AOF_WAIT_REWRITE)
        server.aof_rewrite_scheduled = 1;
}
```
