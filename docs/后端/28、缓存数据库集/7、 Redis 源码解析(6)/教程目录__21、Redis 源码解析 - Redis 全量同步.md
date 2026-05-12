# 21、Redis 源码解析 - Redis 全量同步
- 来源：https://ddkk.com/zhuanlan/db/redis/6/21.html
- 分类：缓存数据库
- 分组：教程目录
当master根据replica的PSYNC命令判断不能进行增量同步时，下面就需要进行全量同步。

### replica接受全量数据

对于replica来说，会向事件循环中注册可读事件readSyncBulkPayload，用来接受从master传过来的全量数据：

```java
void syncWithMaster(aeEventLoop *el, int fd, void *privdata, int mask) {
	...
	// 下面进行全量同步
	* PSYNC failed or is not supported: we want our slaves to resync with us
     * as well, if we have any sub-slaves. The master may transfer us an
     * entirely different data set and we have no way to incrementally feed
     * our slaves after that. */
    disconnectSlaves(); /* Force our slaves to resync with us as well. */
    freeReplicationBacklog(); /* Don't allow our chained slaves to PSYNC. */
   	...
    /* Prepare a suitable temp file for bulk transfer */
    while(maxtries--) {
        snprintf(tmpfile,256,
            "temp-%d.%ld.rdb",(int)server.unixtime,(long int)getpid());
        dfd = open(tmpfile,O_CREAT|O_WRONLY|O_EXCL,0644);
        if (dfd != -1) break;
        sleep(1);
    }
    if (dfd == -1) {
        serverLog(LL_WARNING,"Opening the temp file needed for MASTER <-> REPLICA synchronization: %s",strerror(errno));
        goto error;
    }
    /* Setup the non blocking download of the bulk file. */
    if (aeCreateFileEvent(server.el,fd, AE_READABLE,readSyncBulkPayload,NULL)
            == AE_ERR)
    {
        serverLog(LL_WARNING,
            "Can't create readable event for SYNC: %s (fd=%d)",
            strerror(errno),fd);
        goto error;
    }
    server.repl_state = REPL_STATE_TRANSFER;
    server.repl_transfer_size = -1;
    server.repl_transfer_read = 0;
    server.repl_transfer_last_fsync_off = 0;
    server.repl_transfer_fd = dfd;
    server.repl_transfer_lastio = server.unixtime;
    server.repl_transfer_tmpfile = zstrdup(tmpfile);
    return;
}
```

master根据之前replica在握手阶段发送过来的能力，选择发送给replica的全量数据格式，主要有两种：落盘RDB和非落盘RDB。

落盘RDB指的是master自己先生成RDB文件到磁盘上，然后把RDB文件通过网络发送给replica，格式为：

$ + data

非落盘RDB指的是master在生成RDB时，不会把RDB文件写到磁盘上，而是直接一边生成RDB文件一边通过网络发送给replica，格式为：

$EOF: + data +

这个格式也很好理解，由于非落盘的方式一开始master并不知道最终要生成的RDB文件总大小，所以用一个标志符来代表传输流的开始和结束，非落盘的方式节省一次磁盘IO

readSyncBulkPayload根据上面所述的两种格式，从网络中读取数据，然后把数据写到磁盘上，形成RDB文件，然后把文件加载到内存中，这一切昨晚之后，会把主从同步状态设置为REPL_STATE_CONNECTED，表示主从同步状态结束。

### master发送全量数据

对于master来说，需要发送全量数据时，会先生成一次RDB，此时有下面三种情况：

**1、** 当前master正在进行RDB生成，那么等待下一次RDB生成；

**2、** 当前master正在进行RDB生成，并且这个RDB是用来向其他的replica发送全量数据的，那么该replica可以共用这个RDB文件，该replica直接进入下一状态SLAVE_STATE_WAIT_BGSAVE_END；

**3、** 当前master正在进行RDB生成，并且这个RDB是非落盘的，那么等待下一次RDB生成；

**4、** 当前master没有RDB生成，则调用startBgsaveForReplication开始生成RDB为全量发送数据做准备；

```java
void syncCommand(client *c) {
	...
	// 下面进行全量同步
	/* Setup the slave as one waiting for BGSAVE to start. The following code
     * paths will change the state if we handle the slave differently. */
    // 设置replica的全量同步状态为SLAVE_STATE_WAIT_BGSAVE_START
    c->replstate = SLAVE_STATE_WAIT_BGSAVE_START;
    if (server.repl_disable_tcp_nodelay)
        anetDisableTcpNoDelay(NULL, c->fd); /* Non critical if it fails. */
    c->repldbfd = -1;
    c->flags |= CLIENT_SLAVE;
    listAddNodeTail(server.slaves,c);
    /* Create the replication backlog if needed. */
    if (listLength(server.slaves) == 1 && server.repl_backlog == NULL) {
        /* When we create the backlog from scratch, we always use a new
         * replication ID and clear the ID2, since there is no valid
         * past history. */
        changeReplicationId();
        clearReplicationId2();
        createReplicationBacklog();
    }
    /* CASE 1: BGSAVE is in progress, with disk target. */
    // 尝试共用落盘RDB
    if (server.rdb_child_pid != -1 &&
        server.rdb_child_type == RDB_CHILD_TYPE_DISK)
    {
        /* Ok a background save is in progress. Let's check if it is a good
         * one for replication, i.e. if there is another slave that is
         * registering differences since the server forked to save. */
        client *slave;
        listNode *ln;
        listIter li;
        listRewind(server.slaves,&li);
        while((ln = listNext(&li))) {
            slave = ln->value;
            if (slave->replstate == SLAVE_STATE_WAIT_BGSAVE_END) break;
        }
        /* To attach this slave, we check that it has at least all the
         * capabilities of the slave that triggered the current BGSAVE. */
        if (ln && ((c->slave_capa & slave->slave_capa) == slave->slave_capa)) {
            /* Perfect, the server is already registering differences for
             * another slave. Set the right state, and copy the buffer. */
            copyClientOutputBuffer(c,slave);
            replicationSetupSlaveForFullResync(c,slave->psync_initial_offset);
            serverLog(LL_NOTICE,"Waiting for end of BGSAVE for SYNC");
        } else {
            /* No way, we need to wait for the next BGSAVE in order to
             * register differences. */
            serverLog(LL_NOTICE,"Can't attach the replica to the current BGSAVE. Waiting for next BGSAVE for SYNC");
        }
    /* CASE 2: BGSAVE is in progress, with socket target. */
    } else if (server.rdb_child_pid != -1 &&
               server.rdb_child_type == RDB_CHILD_TYPE_SOCKET)
    {
        /* There is an RDB child process but it is writing directly to
         * children sockets. We need to wait for the next BGSAVE
         * in order to synchronize. */
        serverLog(LL_NOTICE,"Current BGSAVE has socket target. Waiting for next BGSAVE for SYNC");
    /* CASE 3: There is no BGSAVE is progress. */
    } else {
        if (server.repl_diskless_sync && (c->slave_capa & SLAVE_CAPA_EOF)) {
            /* Diskless replication RDB child is created inside
             * replicationCron() since we want to delay its start a
             * few seconds to wait for more slaves to arrive. */
            if (server.repl_diskless_sync_delay)
                serverLog(LL_NOTICE,"Delay next BGSAVE for diskless SYNC");
        } else {
            /* Target is disk (or the slave is not capable of supporting
             * diskless replication) and we don't have a BGSAVE in progress,
             * let's start one. */
            if (server.aof_child_pid == -1) {
                startBgsaveForReplication(c->slave_capa);
            } else {
                serverLog(LL_NOTICE,
                    "No BGSAVE in progress, but an AOF rewrite is active. "
                    "BGSAVE for replication delayed");
            }
        }
    }
    return;
}
```

下面介绍第四种情况，即startBgsaveForReplication函数，根据replica的能力选择落盘RDB传输或者非落盘RDB传输：

```java
int startBgsaveForReplication(int mincapa) {
    int retval;
    int socket_target = server.repl_diskless_sync && (mincapa & SLAVE_CAPA_EOF);
    listIter li;
    listNode *ln;
    serverLog(LL_NOTICE,"Starting BGSAVE for SYNC with target: %s",
        socket_target ? "replicas sockets" : "disk");
    rdbSaveInfo rsi, *rsiptr;
    rsiptr = rdbPopulateSaveInfo(&rsi);
    /* Only do rdbSave* when rsiptr is not NULL,
     * otherwise slave will miss repl-stream-db. */
    if (rsiptr) {
        if (socket_target)
        	// 非落盘RDB传输
            retval = rdbSaveToSlavesSockets(rsiptr);
        else
        	// 落盘RDB传输
            retval = rdbSaveBackground(server.rdb_filename,rsiptr);
    } else {
        serverLog(LL_WARNING,"BGSAVE for replication: replication information not available, can't generate the RDB file right now. Try later.");
        retval = C_ERR;
    }
    /* If we failed to BGSAVE, remove the slaves waiting for a full
     * resynchorinization from the list of salves, inform them with
     * an error about what happened, close the connection ASAP. */
    // 如果失败，则断开replica的连接，破势replica重新开启主从同步过程
    if (retval == C_ERR) {
        serverLog(LL_WARNING,"BGSAVE for replication failed");
        listRewind(server.slaves,&li);
        while((ln = listNext(&li))) {
            client *slave = ln->value;
            if (slave->replstate == SLAVE_STATE_WAIT_BGSAVE_START) {
                slave->replstate = REPL_STATE_NONE;
                slave->flags &= ~CLIENT_SLAVE;
                listDelNode(server.slaves,ln);
                addReplyError(slave,
                    "BGSAVE failed, replication can't continue");
                slave->flags |= CLIENT_CLOSE_AFTER_REPLY;
            }
        }
        return retval;
    }
    /* If the target is socket, rdbSaveToSlavesSockets() already setup
     * the salves for a full resync. Otherwise for disk target do it now.*/
    // 对于落盘RDB，向replica回复+FULLRESYNC replid offset
    // 并且把replica的主从同步状态置为：SLAVE_STATE_WAIT_BGSAVE_END
    if (!socket_target) {
        listRewind(server.slaves,&li);
        while((ln = listNext(&li))) {
            client *slave = ln->value;
            if (slave->replstate == SLAVE_STATE_WAIT_BGSAVE_START) {
                    replicationSetupSlaveForFullResync(slave,
                            getPsyncInitialOffset());
            }
        }
    }
    /* Flush the script cache, since we need that slave differences are
     * accumulated without requiring slaves to match our cached scripts. */
    if (retval == C_OK) replicationScriptCacheFlush();
    return retval;
}
```

无论是rdbSaveToSlavesSockets还是rdbSaveBackground，都是通过fork开始一个子进程做RDB，这个子进程结束之后，会触发父进程的backgroundSaveDoneHandler:

```java
void backgroundSaveDoneHandler(int exitcode, int bysignal) {
    switch(server.rdb_child_type) {
    case RDB_CHILD_TYPE_DISK:
        backgroundSaveDoneHandlerDisk(exitcode,bysignal);
        break;
    case RDB_CHILD_TYPE_SOCKET:
        backgroundSaveDoneHandlerSocket(exitcode,bysignal);
        break;
    default:
        serverPanic("Unknown RDB child type.");
        break;
    }
}
```

backgroundSaveDoneHandlerDisk和backgroundSaveDoneHandlerSocket在最后都会调用updateSlavesWaitingBgsave方法，这个方法就是用来因对上面说的第一、第三种主从同步RDB被推迟的情况：

```java
void updateSlavesWaitingBgsave(int bgsaveerr, int type) {
    listNode *ln;
    int startbgsave = 0;
    int mincapa = -1;
    listIter li;
    listRewind(server.slaves,&li);
    while((ln = listNext(&li))) {
        client *slave = ln->value;
        if (slave->replstate == SLAVE_STATE_WAIT_BGSAVE_START) {
        	// 处于SLAVE_STATE_WAIT_BGSAVE_START状态的接下来会被唤醒继续做一次startBgsaveForReplication
            startbgsave = 1;
            mincapa = (mincapa == -1) ? slave->slave_capa :
                                        (mincapa & slave->slave_capa);
        } else if (slave->replstate == SLAVE_STATE_WAIT_BGSAVE_END) {
            struct redis_stat buf;
            /* If this was an RDB on disk save, we have to prepare to send
             * the RDB from disk to the slave socket. Otherwise if this was
             * already an RDB -> Slaves socket transfer, used in the case of
             * diskless replication, our work is trivial, we can just put
             * the slave online. */
            if (type == RDB_CHILD_TYPE_SOCKET) {
                serverLog(LL_NOTICE,
                    "Streamed RDB transfer with replica %s succeeded (socket). Waiting for REPLCONF ACK from slave to enable streaming",
                        replicationGetSlaveName(slave));
                /* Note: we wait for a REPLCONF ACK message from the replica in
                 * order to really put it online (install the write handler
                 * so that the accumulated data can be transferred). However
                 * we change the replication state ASAP, since our slave
                 * is technically online now.
                 *
                 * So things work like that:
                 *
                 * 1. We end trasnferring the RDB file via socket.
                 * 2. The replica is put ONLINE but the write handler
                 *    is not installed.
                 * 3. The replica however goes really online, and pings us
                 *    back via REPLCONF ACK commands.
                 * 4. Now we finally install the write handler, and send
                 *    the buffers accumulated so far to the replica.
                 *
                 * But why we do that? Because the replica, when we stream
                 * the RDB directly via the socket, must detect the RDB
                 * EOF (end of file), that is a special random string at the
                 * end of the RDB (for streamed RDBs we don't know the length
                 * in advance). Detecting such final EOF string is much
                 * simpler and less CPU intensive if no more data is sent
                 * after such final EOF. So we don't want to glue the end of
                 * the RDB trasfer with the start of the other replication
                 * data. */
                // 对于非落盘方式，此时replica已经接受全部的RDB文件，主从同步进入SLAVE_STATE_ONLINE状态
                slave->replstate = SLAVE_STATE_ONLINE;
                slave->repl_put_online_on_ack = 1;
                slave->repl_ack_time = server.unixtime; /* Timeout otherwise. */
            } else {
            	// 落盘方式，生成RDB之后，需要发送RDB文件，主从同步进入SLAVE_STATE_SEND_BULK状态
            	// 并且创建可写事件sendBulkToSlave，发送RDB
                if (bgsaveerr != C_OK) {
                    freeClient(slave);
                    serverLog(LL_WARNING,"SYNC failed. BGSAVE child returned an error");
                    continue;
                }
                if ((slave->repldbfd = open(server.rdb_filename,O_RDONLY)) == -1 ||
                    redis_fstat(slave->repldbfd,&buf) == -1) {
                    freeClient(slave);
                    serverLog(LL_WARNING,"SYNC failed. Can't open/stat DB after BGSAVE: %s", strerror(errno));
                    continue;
                }
                slave->repldboff = 0;
                slave->repldbsize = buf.st_size;
                slave->replstate = SLAVE_STATE_SEND_BULK;
                slave->replpreamble = sdscatprintf(sdsempty(),"$%lld\r\n",
                    (unsigned long long) slave->repldbsize);
                aeDeleteFileEvent(server.el,slave->fd,AE_WRITABLE);
                if (aeCreateFileEvent(server.el, slave->fd, AE_WRITABLE, sendBulkToSlave, slave) == AE_ERR) {
                    freeClient(slave);
                    continue;
                }
            }
        }
    }
    // SLAVE_STATE_WAIT_BGSAVE_START需要重新做一次SLAVE_STATE_WAIT_BGSAVE_START
    if (startbgsave) startBgsaveForReplication(mincapa);
}
```

对于落盘RDB方式传输全量数据，注册可写事件sendBulkToSlave，来发送刚刚生成的RDB文件，发送完成之后，设置replica的主从同步状态为SLAVE_STATE_ONLINE。

至此，master的全量RDB文件已经全部发送给replica了。

### 增量数据传输

在master发送全量数据的过程中，有个和AOF重写类似的问题，在调用fork产生子进程生成RDB那一刻之后，有可能master又接受了大量的用户请求，这部分请求并没有在全量RDB里面，那么这部分请求如何传输给replica呢？

当master处理完一个写请求之后，会调用propagate来进行命令传播，这函数由两个作用：命令传播到AOF；命令传播到replicas：

```java
void propagate(struct redisCommand *cmd, int dbid, robj **argv, int argc,
               int flags)
{
    if (server.aof_state != AOF_OFF && flags & PROPAGATE_AOF)
        feedAppendOnlyFile(cmd,dbid,argv,argc);
    if (flags & PROPAGATE_REPL)
        replicationFeedSlaves(server.slaves,dbid,argv,argc);
}
```

对于replicas的命令传播replicationFeedSlaves，会把命令写到各个replicas的输出缓存区，master在生成主从同步RDB期间产生的增量数据，就是这样发送给各个replicas的缓存区，但是由于此时各个replicas还未处于SLAVE_STATE_ONLINE状态，事件循环中还没有注册发送命令给各个replicas的可写事件，这些命令就会积攒在replicas的缓存区中。

当master调用addxxx命令向replica写增量数据时，由于replica还未满足条件c->replstate == SLAVE_STATE_ONLINE && !c->repl_put_online_on_ack，这些数据只会在缓冲区，而不会被发送：

```java
void clientInstallWriteHandler(client *c) {
    /* Schedule the client to write the output buffers to the socket only
     * if not already done and, for slaves, if the slave can actually receive
     * writes at this stage. */
    if (!(c->flags & CLIENT_PENDING_WRITE) &&
        (c->replstate == REPL_STATE_NONE ||
         (c->replstate == SLAVE_STATE_ONLINE && !c->repl_put_online_on_ack)))
    {
        /* Here instead of installing the write handler, we just flag the
         * client and put it into a list of clients that have something
         * to write to the socket. This way before re-entering the event
         * loop, we can try to directly write to the client sockets avoiding
         * a system call. We'll only really install the write handler if
         * we'll not be able to write the whole reply at once. */
        c->flags |= CLIENT_PENDING_WRITE;
        listAddNodeHead(server.clients_pending_write,c);
    }
}
```

master发送完全量数据之后，就会把replica的主从同步状态置为SLAVE_STATE_ONLINE，那么repl_put_online_on_ack何时置为0呢？

为了防止replica在拉取master的数据期间replica意外失联，要求replica定期向master发送REPLCONF ACK命令，对于replica来说，在replicationCron中发送：

```java
void replicationCron(void) {
	...
	 /* Send ACK to master from time to time.
     * Note that we do not send periodic acks to masters that don't
     * support PSYNC and replication offsets. */
    if (server.masterhost && server.master &&
        !(server.master->flags & CLIENT_PRE_PSYNC))
        replicationSendAck();
    ...
}
void replicationSendAck(void) {
    client *c = server.master;
    if (c != NULL) {
        c->flags |= CLIENT_MASTER_FORCE_REPLY;
        addReplyMultiBulkLen(c,3);
        addReplyBulkCString(c,"REPLCONF");
        addReplyBulkCString(c,"ACK");
        addReplyBulkLongLong(c,c->reploff);
        c->flags &= ~CLIENT_MASTER_FORCE_REPLY;
    }
}
```

master在收到replica的REPLCONF ACK命令之后，如果发现replica的状态已经是SLAVE_STATE_ONLINE，就会把replica的repl_put_online_on_ack置为0：

```java
void replconfCommand(client *c) {
	...
	if (!strcasecmp(c->argv[j]->ptr,"ack")) {
        /* REPLCONF ACK is used by slave to inform the master the amount
          * of replication stream that it processed so far. It is an
          * internal only command that normal clients should never use. */
         long long offset;
         if (!(c->flags & CLIENT_SLAVE)) return;
         if ((getLongLongFromObject(c->argv[j+1], &offset) != C_OK))
             return;
         if (offset > c->repl_ack_off)
             c->repl_ack_off = offset;
         c->repl_ack_time = server.unixtime;
         /* If this was a diskless replication, we need to really put
          * the slave online when the first ACK is received (which
          * confirms slave is online and ready to get more data). This
          * allows for simpler and less CPU intensive EOF detection
          * when streaming RDB files. */
         if (c->repl_put_online_on_ack && c->replstate == SLAVE_STATE_ONLINE)
             putSlaveOnline(c);
         /* Note: this command does not reply anything! */
         return;
     }
	...
}
void putSlaveOnline(client *slave) {
    slave->replstate = SLAVE_STATE_ONLINE;
    slave->repl_put_online_on_ack = 0;
    slave->repl_ack_time = server.unixtime; /* Prevent false timeout. */
    if (aeCreateFileEvent(server.el, slave->fd, AE_WRITABLE,
        sendReplyToClient, slave) == AE_ERR) {
        serverLog(LL_WARNING,"Unable to register writable event for replica bulk transfer: %s", strerror(errno));
        freeClient(slave);
        return;
    }
    refreshGoodSlavesCount();
    serverLog(LL_NOTICE,"Synchronization with replica %s succeeded",
        replicationGetSlaveName(slave));
}
```

同时还会向事件循环中注册这个replica的可写事件sendReplyToClient，之后，积压在replica的缓冲区中的增量命令就可以通过网络发送给各个replica了。
