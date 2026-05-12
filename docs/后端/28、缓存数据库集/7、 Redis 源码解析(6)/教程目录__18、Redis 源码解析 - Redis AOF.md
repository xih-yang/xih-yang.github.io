# 18、Redis 源码解析 - Redis AOF
- 来源：https://ddkk.com/zhuanlan/db/redis/6/18.html
- 分类：缓存数据库
- 分组：教程目录
本节看一下另一种持久化方式AOF。

RDB是内存快照，AOF会将每个更新操作都落盘，比RDB具备更高的可靠性，如果Redis运行过程中宕机，通过AOF能恢复出更多的数据，这也是为什么Redis在刚启动时优先加载AOF文件。

### AOF追加

要想开始AOF持久化，需要打开AOF配置：appendonly yes

AOF的追加时机如下：

**1、** 在[Redis 源码解析 - Redis 命令端到端的过程](/zhuanlan/db/redis/6/5.html)中，通过call执行命令完毕后，会通过propagate进行命令传播:；

```java
void call(client *c, int flags) {
	...
	if (propagate_flags != PROPAGATE_NONE && !(c->cmd->flags & CMD_MODULE))
            propagate(c->cmd,c->db->id,c->argv,c->argc,propagate_flags);
    ...
}
```

propagate有两个作用：命令传播到AOF中；命令传播到slave中；

```java
void propagate(struct redisCommand *cmd, int dbid, robj **argv, int argc,
               int flags)
{
	// aof开启，则把命令追加到aof中
    if (server.aof_state != AOF_OFF && flags & PROPAGATE_AOF)
        feedAppendOnlyFile(cmd,dbid,argv,argc);
    // 尝试把命令传播到slave中
    if (flags & PROPAGATE_REPL)
        replicationFeedSlaves(server.slaves,dbid,argv,argc);
}
```

**2、** 过期健删除，内存淘汰等发生时，会删除对应的key，也会把删除命令通过propagate函数传播到AOF中；

**3、** 事务追加传播命令时，会在头和尾加上"multi"和"exec"；

AOF追加的时机知道了，下面就看看如何追加feedAppendOnlyFile:

```java
void feedAppendOnlyFile(struct redisCommand *cmd, int dictid, robj **argv, int argc) {
    sds buf = sdsempty();
    robj *tmpargv[3];
    // 选择合适的db
    if (dictid != server.aof_selected_db) {
        char seldb[64];
        snprintf(seldb,sizeof(seldb),"%d",dictid);
        buf = sdscatprintf(buf,"*2\r\n$6\r\nSELECT\r\n$%lu\r\n%s\r\n",
            (unsigned long)strlen(seldb),seldb);
        server.aof_selected_db = dictid;
    }
	// 如果命令中带有过期时间，把相对时间转化成绝对时间
    if (cmd->proc == expireCommand || cmd->proc == pexpireCommand ||
        cmd->proc == expireatCommand) {
        /* Translate EXPIRE/PEXPIRE/EXPIREAT into PEXPIREAT */
        buf = catAppendOnlyExpireAtCommand(buf,cmd,argv[1],argv[2]);
    } else if (cmd->proc == setexCommand || cmd->proc == psetexCommand) {
        /* Translate SETEX/PSETEX to SET and PEXPIREAT */
        tmpargv[0] = createStringObject("SET",3);
        tmpargv[1] = argv[1];
        tmpargv[2] = argv[3];
        buf = catAppendOnlyGenericCommand(buf,3,tmpargv);
        decrRefCount(tmpargv[0]);
        buf = catAppendOnlyExpireAtCommand(buf,cmd,argv[1],argv[2]);
    } else if (cmd->proc == setCommand && argc > 3) {
        int i;
        robj *exarg = NULL, *pxarg = NULL;
        /* Translate SET [EX seconds][PX milliseconds] to SET and PEXPIREAT */
        buf = catAppendOnlyGenericCommand(buf,3,argv);
        for (i = 3; i < argc; i ++) {
            if (!strcasecmp(argv[i]->ptr, "ex")) exarg = argv[i+1];
            if (!strcasecmp(argv[i]->ptr, "px")) pxarg = argv[i+1];
        }
        serverAssert(!(exarg && pxarg));
        if (exarg)
            buf = catAppendOnlyExpireAtCommand(buf,server.expireCommand,argv[1],
                                               exarg);
        if (pxarg)
            buf = catAppendOnlyExpireAtCommand(buf,server.pexpireCommand,argv[1],
                                               pxarg);
    } else {
        /* All the other commands don't need translation or need the
         * same translation already operated in the command vector
         * for the replication itself. */
        // 按照redis的协议对命令编码
        buf = catAppendOnlyGenericCommand(buf,argc,argv);
    }
    /* Append to the AOF buffer. This will be flushed on disk just before
     * of re-entering the event loop, so before the client will get a
     * positive reply about the operation performed. */
    // 把命令追加到aof缓存中
    if (server.aof_state == AOF_ON)
        server.aof_buf = sdscatlen(server.aof_buf,buf,sdslen(buf));
    /* If a background append only file rewriting is in progress we want to
     * accumulate the differences between the child DB and the current one
     * in a buffer, so that when the child process will do its work we
     * can append the differences to the new append only file. */
    // 如果存在aof重写子进程，则把aof缓存最佳到buffer中
    if (server.aof_child_pid != -1)
        aofRewriteBufferAppend((unsigned char*)buf,sdslen(buf));
    sdsfree(buf);
}
```

### AOF持久化

feedAppendOnlyFile只是把命令追加到AOF缓存，server.aof_buf中，这部分缓存还是在内存中，那么合适把server.aof_buf中的内存flush时到磁盘上呢？flush由flushAppendOnlyFile函数实现，这个函数在以下情况下调用：

**1、** 在周期性函数serverCron中调用：；

```java
int serverCron(struct aeEventLoop *eventLoop, long long id, void *clientData) {
	...
	/* AOF postponed flush: Try at every cron cycle if the slow fsync
     * completed. */
    if (server.aof_flush_postponed_start) flushAppendOnlyFile(0);
    ...
}
```

server.aof_flush_postponed_start指的是上次有flush因为后台的fsync AOF文件任务而被推迟

**2、** 在beforeSleep中被调用：；

```java
void beforeSleep(struct aeEventLoop *eventLoop) {
	...
	 flushAppendOnlyFile(0);
	...
}
```

**3、** 在准备退出Redis时候被调用：；

```java
int prepareForShutdown(int flags) {
	...
	    if (server.aof_state != AOF_OFF) {
        ...
        serverLog(LL_NOTICE,"Calling fsync() on the AOF file.");
        flushAppendOnlyFile(1);
        redis_fsync(server.aof_fd);
    }
    ...
}
```

flushAppendOnlyFile不止会把AOF缓存server.aof_buf写入文件，还会根据AOF文件的sync策略尝试fsync aof文件：

```java
void flushAppendOnlyFile(int force) {
	...
	nwritten = aofWrite(server.aof_fd,server.aof_buf,sdslen(server.aof_buf));
	...
try_fsync:
    /* Perform the fsync if needed. */
    if (server.aof_fsync == AOF_FSYNC_ALWAYS) {
    	// 每次写完aof文件都会fsync
        redis_fsync(server.aof_fd); /* Let's try to get this data on the disk */
        server.aof_fsync_offset = server.aof_current_size;
        server.aof_last_fsync = server.unixtime;
    } else if ((server.aof_fsync == AOF_FSYNC_EVERYSEC &&
                server.unixtime > server.aof_last_fsync)) {
        // 每秒fsync一次
        if (!sync_in_progress) {
            aof_background_fsync(server.aof_fd);
            server.aof_fsync_offset = server.aof_current_size;
        }
        server.aof_last_fsync = server.unixtime;
    }
}
```

### AOF重写

随着用户的写操作增多，AOF文件越来越大，为了避免AOF过大，Redis会按照一定策略对AOF文件重写，即：重写每个KV的插入操作，不再记录历史追加操作了，这样AOF文件就减少了。

AOF重写由rewriteAppendOnlyFileBackground实现，这个函数在以下情况被调用：

**1、** 在bgrewriteaofCommand函数中被调用，bgrewriteaofCommand在收到用户bgrewriteaof会被调用；

**2、** 在周期性函数serverCron中判断，如果aof文件增大到一定阈值，则进行一次aof重写：；

```java
int serverCron(struct aeEventLoop *eventLoop, long long id, void *clientData) {
	...
    /* Trigger an AOF rewrite if needed. */
    if (server.aof_state == AOF_ON &&
         server.rdb_child_pid == -1 &&
         server.aof_child_pid == -1 &&
         server.aof_rewrite_perc &&
         server.aof_current_size > server.aof_rewrite_min_size)
     {
         long long base = server.aof_rewrite_base_size ?
             server.aof_rewrite_base_size : 1;
         long long growth = (server.aof_current_size*100/base) - 100;
         if (growth >= server.aof_rewrite_perc) {
             serverLog(LL_NOTICE,"Starting automatic rewriting of AOF on %lld%% growth",growth);
             rewriteAppendOnlyFileBackground();
         }
     }
    ...
}
```

**3、** 在重新开始aofenable时，会调用startAppendOnly来开启命令追加，在这个函数中会进行一次AOF重写：；

```java
int startAppendOnly(void) {
	...
	if (rewriteAppendOnlyFileBackground() == C_ERR) {
		...
	}
	...
}
```

下面具体看看rewriteAppendOnlyFileBackground的实现，与RDB生成相似，通过fork()系统调用创建一个子进程，子进程调用rewriteAppendOnlyFile负责重写生成AOF文件：

```java
int rewriteAppendOnlyFileBackground(void) {
    pid_t childpid;
    long long start;
    if (server.aof_child_pid != -1 || server.rdb_child_pid != -1) return C_ERR;
    if (aofCreatePipes() != C_OK) return C_ERR;
    // 创建父子进程间通信的管道pipe
    openChildInfoPipe();
    start = ustime();
    if ((childpid = fork()) == 0) {
        char tmpfile[256];
        /* Child */
        closeListeningSockets(0);
        redisSetProcTitle("redis-aof-rewrite");
        snprintf(tmpfile,256,"temp-rewriteaof-bg-%d.aof", (int) getpid());
        // 子进程调用rewriteAppendOnlyFile重新生成新的AOF文件
        if (rewriteAppendOnlyFile(tmpfile) == C_OK) {
            size_t private_dirty = zmalloc_get_private_dirty(-1);
            if (private_dirty) {
                serverLog(LL_NOTICE,
                    "AOF rewrite: %zu MB of memory used by copy-on-write",
                    private_dirty/(1024*1024));
            }
            server.child_info_data.cow_size = private_dirty;
            // AOF重写完成之后，通知父进程做后续处理
            sendChildInfo(CHILD_INFO_TYPE_AOF);
            exitFromChild(0);
        } else {
            exitFromChild(1);
        }
    } else {
        /* Parent */
        // 父进程更新相关变量
        server.stat_fork_time = ustime()-start;
        server.stat_fork_rate = (double) zmalloc_used_memory() * 1000000 / server.stat_fork_time / (1024*1024*1024); /* GB per second. */
        latencyAddSampleIfNeeded("fork",server.stat_fork_time/1000);
        if (childpid == -1) {
            closeChildInfoPipe();
            serverLog(LL_WARNING,
                "Can't rewrite append only file in background: fork: %s",
                strerror(errno));
            aofClosePipes();
            return C_ERR;
        }
        serverLog(LL_NOTICE,
            "Background append only file rewriting started by pid %d",childpid);
        server.aof_rewrite_scheduled = 0;
        server.aof_rewrite_time_start = time(NULL);
        server.aof_child_pid = childpid;
        updateDictResizePolicy();
        /* We set appendseldb to -1 in order to force the next call to the
         * feedAppendOnlyFile() to issue a SELECT command, so the differences
         * accumulated by the parent into server.aof_rewrite_buf will start
         * with a SELECT statement and it will be safe to merge. */
        server.aof_selected_db = -1;
        replicationScriptCacheFlush();
        return C_OK;
    }
    return C_OK; /* unreached */
}
```

rewriteAppendOnlyFile用来子进程重写AOF文件，AOF文件是通过命令的形式重新，RDB文件直接做内存快照，所以RDB文件比AOF文件更加节省内存，所以Redis这里做了优化，优先通过生成RDB的头部来填充AOF文件：

```java
int rewriteAppendOnlyFile(char *filename) {
    rio aof;
    FILE *fp;
    char tmpfile[256];
    char byte;
    /* Note that we have to use a different temp name here compared to the
     * one used by rewriteAppendOnlyFileBackground() function. */
    // 打开AOF文件
    snprintf(tmpfile,256,"temp-rewriteaof-%d.aof", (int) getpid());
    fp = fopen(tmpfile,"w");
    if (!fp) {
        serverLog(LL_WARNING, "Opening the temp file for AOF rewrite in rewriteAppendOnlyFile(): %s", strerror(errno));
        return C_ERR;
    }
    server.aof_child_diff = sdsempty();
    rioInitWithFile(&aof,fp);
	// 设置自动fsync
    if (server.aof_rewrite_incremental_fsync)
        rioSetAutoSync(&aof,REDIS_AUTOSYNC_BYTES);
    if (server.aof_use_rdb_preamble) {
    	// 优先生成RDB文件
        int error;
        if (rdbSaveRio(&aof,&error,RDB_SAVE_AOF_PREAMBLE,NULL) == C_ERR) {
            errno = error;
            goto werr;
        }
    } else {
        if (rewriteAppendOnlyFileRio(&aof) == C_ERR) goto werr;
    }
    /* Do an initial slow fsync here while the parent is still sending
     * data, in order to make the next final fsync faster. */
    // flush和fsync AOF文件
    if (fflush(fp) == EOF) goto werr;
    if (fsync(fileno(fp)) == -1) goto werr;
    ... 
}
```

### 父子进程间通信

在[Redis 源码解析 - Redis RDB](/zhuanlan/db/redis/6/17.html)中，在RDB文件生成之后，flush、fsync之后就结束了，但是在AOF文件生成过程中，这之后还有一大段逻辑，这部分逻辑是干什么的呢？

无论RDB还是AOF，都是通过fork方式去产生，子进程在生成的时候，父进程仍然继续处理用户请求，RDB是内存快照，不用关心这些后续请求，但是AOF是命令追加，需要保证任何时刻都要把命令写入AOF文件中。

Redis中通过父子进程间通信的方式，把父进程这段时间内接受到写命令通过管道传递给子进程，子进程在重写完AOF文件之后，会尝试从管道中读取这些命令，然后再次把这些命令追加到重写好的AOF文件中。

父进程把命令追加到管道中：

```java
void feedAppendOnlyFile(struct redisCommand *cmd, int dictid, robj **argv, int argc) {
	...
	// 前面把命令写入server.aof_buf中
	...
	// 如果此时有子进程正在重写AOF，则把命令同样追加到aof rewrite缓存中
	if (server.aof_child_pid != -1)
        aofRewriteBufferAppend((unsigned char*)buf,sdslen(buf));
}
/* Append data to the AOF rewrite buffer, allocating new blocks if needed. */
void aofRewriteBufferAppend(unsigned char *s, unsigned long len) {
    listNode *ln = listLast(server.aof_rewrite_buf_blocks);
    aofrwblock *block = ln ? ln->value : NULL;
    while(len) {
        /* If we already got at least an allocated block, try appending
         * at least some piece into it. */
        if (block) {
        	// 追加到当前block中
            unsigned long thislen = (block->free < len) ? block->free : len;
            if (thislen) {
       /* The current block is not already full. */
                memcpy(block->buf+block->used, s, thislen);
                block->used += thislen;
                block->free -= thislen;
                s += thislen;
                len -= thislen;
            }
        }
		// 没有block，则新建
        if (len) {
      /* First block to allocate, or need another block. */
            int numblocks;
            block = zmalloc(sizeof(*block));
            block->free = AOF_RW_BUF_BLOCK_SIZE;
            block->used = 0;
            listAddNodeTail(server.aof_rewrite_buf_blocks,block);
            /* Log every time we cross more 10 or 100 blocks, respectively
             * as a notice or warning. */
            numblocks = listLength(server.aof_rewrite_buf_blocks);
            if (((numblocks+1) % 10) == 0) {
                int level = ((numblocks+1) % 100) == 0 ? LL_WARNING :
                                                         LL_NOTICE;
                serverLog(level,"Background AOF buffer size: %lu MB",
                    aofRewriteBufferSize()/(1024*1024));
            }
        }
    }
    /* Install a file event to send data to the rewrite child if there is
     * not one already. */
    // 向事件循环中的管道fd添加写事件aofChildWriteDiffData
    if (aeGetFileEvents(server.el,server.aof_pipe_write_data_to_child) == 0) {
        aeCreateFileEvent(server.el, server.aof_pipe_write_data_to_child,
            AE_WRITABLE, aofChildWriteDiffData, NULL);
    }
}
// 把server.aof_rewrite_buf_blocks缓存中的命令全部写入管道中
void aofChildWriteDiffData(aeEventLoop *el, int fd, void *privdata, int mask) {
    listNode *ln;
    aofrwblock *block;
    ssize_t nwritten;
    UNUSED(el);
    UNUSED(fd);
    UNUSED(privdata);
    UNUSED(mask);
    while(1) {
        ln = listFirst(server.aof_rewrite_buf_blocks);
        block = ln ? ln->value : NULL;
        if (server.aof_stop_sending_diff || !block) {
            aeDeleteFileEvent(server.el,server.aof_pipe_write_data_to_child,
                              AE_WRITABLE);
            return;
        }
        if (block->used > 0) {
            nwritten = write(server.aof_pipe_write_data_to_child,
                             block->buf,block->used);
            if (nwritten <= 0) return;
            memmove(block->buf,block->buf+nwritten,block->used-nwritten);
            block->used -= nwritten;
            block->free += nwritten;
        }
        if (block->used == 0) listDelNode(server.aof_rewrite_buf_blocks,ln);
    }
}
```

父进程写完这些命令之后，再看看子进程如何读取并追加这些命令，还是在rewriteAppendOnlyFile函数中，重写完AOF文件之后，就开始读取，把从管道中读取的数据都放入server.aof_child_diff中

```java
int rewriteAppendOnlyFile(char *filename) {
	...
	int nodata = 0;
    mstime_t start = mstime();
    while(mstime()-start < 1000 && nodata < 20) {
        if (aeWait(server.aof_pipe_read_data_from_parent, AE_READABLE, 1) <= 0)
        {
            nodata++;
            continue;
        }
        nodata = 0; /* Start counting from zero, we stop on N *contiguous*
                       timeouts. */
        // 把从管道中读取的数据都放入server.aof_child_diff中
        aofReadDiffFromParent();
    }
    ...
}
```

用户有可能一直发送命令，父进程也会一直把命令发送给子进程，如果这个过程不加控制，会一直持续下去，何时终止这个过程呢？Redis在上面那段注释中给出了答案：

**1、** AOF文件重写完毕之后，最多持续1000ms来读取父进程命令，如果父进程这时候比较繁忙，这个过程可以尽可能的读取到父进程的命令；

**2、** 如果20ms内，父进程都没有数据发过来，说明父进程此时比较清闲，直接可以停止读取；

满足上面两个条件之后，子进程会向父进程发送一个’!‘字符，通知父进程停止向子进程发送命令，然后读取管道中的数据，确定父进程收到这个’!'字符，这个时间内可能父进程又接收到一部分命令了，所以子进程再次调用aofReadDiffFromParent来读取这个时间内的命令。

```java
int rewriteAppendOnlyFile(char *filename) {
	...
	 /* Ask the master to stop sending diffs. */
    if (write(server.aof_pipe_write_ack_to_parent,"!",1) != 1) goto werr;
    if (anetNonBlock(NULL,server.aof_pipe_read_ack_from_parent) != ANET_OK)
        goto werr;
    /* We read the ACK from the server using a 10 seconds timeout. Normally
     * it should reply ASAP, but just in case we lose its reply, we are sure
     * the child will eventually get terminated. */
    if (syncRead(server.aof_pipe_read_ack_from_parent,&byte,1,5000) != 1 ||
        byte != '!') goto werr;
    serverLog(LL_NOTICE,"Parent agreed to stop sending diffs. Finalizing AOF...");
    /* Read the final diff if any. */
    aofReadDiffFromParent();
    ...
}
```

至此，可以去确保在子进程生成AOF这段时间内，父进程所有接受到写命令都发送给子进程了，子进程接下来可以放心的将server.aof_child_diff中的内容追加到AOF中，并进行flush和fsync：

```java
int rewriteAppendOnlyFile(char *filename) {
	...
	/* Read the final diff if any. */
    aofReadDiffFromParent();
    /* Write the received diff to the file. */
    serverLog(LL_NOTICE,
        "Concatenating %.2f MB of AOF diff received from parent.",
        (double) sdslen(server.aof_child_diff) / (1024*1024));
    if (rioWrite(&aof,server.aof_child_diff,sdslen(server.aof_child_diff)) == 0)
        goto werr;
    /* Make sure data will not remain on the OS's output buffers */
    if (fflush(fp) == EOF) goto werr;
    if (fsync(fileno(fp)) == -1) goto werr;
    if (fclose(fp) == EOF) goto werr;
    /* Use RENAME to make sure the DB file is changed atomically only
     * if the generate DB file is ok. */
    if (rename(tmpfile,filename) == -1) {
        serverLog(LL_WARNING,"Error moving temp append only file on the final destination: %s", strerror(errno));
        unlink(tmpfile);
        return C_ERR;
    }
    serverLog(LL_NOTICE,"SYNC append only file rewrite performed");
    return C_OK;
}
	...
```

子进程说完了，来看看父进程接收到子进程发送的停止命令’!'之后的逻辑：在AOF重写fork之前，会创建父子进程间通信的管道，并且把管道加入到事件循环中，通过aofChildPipeReadable读取子进程发送过来的停止命令

```java
int aofCreatePipes(void) {
    int fds[6] = {
     -1, -1, -1, -1, -1, -1};
    int j;
    if (pipe(fds) == -1) goto error; /* parent -> children data. */
    if (pipe(fds+2) == -1) goto error; /* children -> parent ack. */
    if (pipe(fds+4) == -1) goto error; /* parent -> children ack. */
    /* Parent -> children data is non blocking. */
    if (anetNonBlock(NULL,fds[0]) != ANET_OK) goto error;
    if (anetNonBlock(NULL,fds[1]) != ANET_OK) goto error;
    if (aeCreateFileEvent(server.el, fds[2], AE_READABLE, aofChildPipeReadable, NULL) == AE_ERR) goto error;
	...
}
void aofChildPipeReadable(aeEventLoop *el, int fd, void *privdata, int mask) {
    char byte;
    UNUSED(el);
    UNUSED(privdata);
    UNUSED(mask);
    if (read(fd,&byte,1) == 1 && byte == '!') {
        serverLog(LL_NOTICE,"AOF rewrite child asks to stop sending diffs.");
        // 读取到'!'之后，设置server.aof_stop_sending_diff为1
        server.aof_stop_sending_diff = 1;
        // 同时向子进程发送确认信息
        if (write(server.aof_pipe_write_ack_to_child,"!",1) != 1) {
            /* If we can't send the ack, inform the user, but don't try again
             * since in the other side the children will use a timeout if the
             * kernel can't buffer our write, or, the children was
             * terminated. */
            serverLog(LL_WARNING,"Can't send ACK to AOF child: %s",
                strerror(errno));
        }
    }
    /* Remove the handler since this can be called only one time during a
     * rewrite. */
    aeDeleteFileEvent(server.el,server.aof_pipe_read_ack_from_child,AE_READABLE);
}
```

当父进程收到子进程的停止发送命令信息之后，会设置server.aof_stop_sending_diff为1，有了这个标志之后，父进程不会再向子进程发送追加命令了：

```java
void aofChildWriteDiffData(aeEventLoop *el, int fd, void *privdata, int mask) {
	...
    while(1) {
        ln = listFirst(server.aof_rewrite_buf_blocks);
        block = ln ? ln->value : NULL;
        // 如果设置了server.aof_stop_sending_diff，则不再发送
        if (server.aof_stop_sending_diff || !block) {
            aeDeleteFileEvent(server.el,server.aof_pipe_write_data_to_child,
                              AE_WRITABLE);
            return;
        }
        ...
    }
}
```

到目前为止，仔细分析下父子进程间通信的过程，真的能确保父进程接受到的所有写命令都追加发送给子进程了吗？

首先Redis是个单线程模型，上面父进程所进行的操作都是串行执行的，同时在事件循环中被唤醒的事件顺序也都是不确定的，有可能子进程的停止发送信息到来之后，父进程仍然受到用户的写请求，需要把这部分的命令继续追加写入刚刚生成的AOF文件中。

父进程wait子进程结束，然后通过backgroundRewriteDoneHandler处理

```java
void backgroundRewriteDoneHandler(int exitcode, int bysignal) {
	...
	if (aofRewriteBufferWrite(newfd) == -1) {
		// 继续追加
		...
	}
	...
	// rename AOF文件，用新生成的AOF文件替换旧的
	rename(tmpfile,server.aof_filename)
	// 释放旧的aof缓存
	sdsfree(server.aof_buf);
	...
	// 异步删除旧的aof文件
	if (oldfd != -1) bioCreateBackgroundJob(BIO_CLOSE_FILE,(void*)(long)oldfd,NULL,NULL);
}
```

至此，新来的命令可以追加到新的AOF文件中，AOF重写完毕。
