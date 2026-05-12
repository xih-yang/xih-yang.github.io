# 20、Redis 源码解析 - Redis 增量同步
- 来源：https://ddkk.com/zhuanlan/db/redis/6/20.html
- 分类：缓存数据库
- 分组：教程目录
接着[Redis 源码解析 - Redis 主从同步一](/zhuanlan/db/redis/6/19.html)，此时

replica处于REPL_STATE_SEND_PSYNC这个状态开始，真正的开始向master拉取数据。

主从同步时，replica向master拉数据有两种方式：全量同步、增量同步。全量同步需要replica向master拉取全量的数据，而增量同步只需要拉取增量数据，增量数据量远小于全量数据量，所以增量同步效率更高，也更节省带宽。

首先replica优先尝试向master进行增量同步，即：如果这个replica之前已经挂在这master之下，但是由于某些原因失联了，主从同步断了之后，此时这个replica的server.repl_state必然是REPL_STATE_CONNECT状态，现在replica想重新连接上master，就会不停的调用syncWithMaster尝试，一旦走到了REPL_STATE_SEND_PSYNC状态，由于replica中之前已经有了部分master的数据，有可能不需要拉取master的全量数据，只需要拉取在失联的这段时间master接收到的增量请求即可。所以增量同步适用于replica与master短暂失联的场景，这也是线上最有可能发生的场景。

那么replica以及master如何判断能否进行增量同步呢？很明显要满足两点：replica之前挂在这个master之下；失联这段时间内，master产生的数据量不能太多。

### 增量同步条件

**1、** 如何判断这个master之前是否连接过呢？；

```java
struct redisServer {
	...
    char replid[CONFIG_RUN_ID_SIZE+1];  /* My current replication ID. */
    char replid2[CONFIG_RUN_ID_SIZE+1]; /* replid inherited from master*/
    ...
    client *cached_master; /* Cached master to be reused for PSYNC. */
	...
};
```

replid是当前节点的复制id；如果节点是replica，之后通过replicaof no one变成master，replid2表示之前master的复制id，在[Redis启动流程](/zhuanlan/db/redis/6/3.html)中，会调用initServerConfig来初始化节点，其中就会设置这两个字段：

```java
void initServerConfig(void) {
	...
	changeReplicationId();
    clearReplicationId2();
	...
}
void changeReplicationId(void) {
    getRandomHexChars(server.replid,CONFIG_RUN_ID_SIZE);
    server.replid[CONFIG_RUN_ID_SIZE] = '\0';
}
void clearReplicationId2(void) {
    memset(server.replid2,'0',sizeof(server.replid));
    server.replid2[CONFIG_RUN_ID_SIZE] = '\0';
    server.second_replid_offset = -1;
}
```

同时master在有了第一个replica，或者去掉所有replica时，也会调用changeReplicationId更改server.replid，为了避免重启时丢失server.replid，server.replid还会被持久化到RDB文件中，在重启时从磁盘加载数据后，会根据RDB文件重置server.replid。

cached_master表示该节点是replica，在与master失联之前，会缓存之前的master:

```java
void freeClient(client *c) {
    if (server.master && c->flags & CLIENT_MASTER) {
        serverLog(LL_WARNING,"Connection with master lost.");
        if (!(c->flags & (CLIENT_CLOSE_AFTER_REPLY|
                          CLIENT_CLOSE_ASAP|
                          CLIENT_BLOCKED)))
        {
            replicationCacheMaster(c);
            return;
        }
    }
}
```

在replica失联之后，再次与master连接上，会根据cached_master中的信息发送replid给master，master对比自己的replid，如果相同，那么说明该replica之前是挂在自己下面，可以尝试增量同步。

**2、** 如何确定在replica失联这段时间，master没有接受过多的数据？；

在master在有了第一个replica，或者去掉所有replica时，会打开或者关闭repl_backlog，这是个char*指针，默认为256M，保存的是master最近时间内的增量数据。

```java
struct redisServer {
	...
    char *repl_backlog;             /* Replication backlog for partial syncs */
    long long repl_backlog_size;    /* Backlog circular buffer size */
    long long repl_backlog_histlen; /* Backlog actual data length */
    long long repl_backlog_idx;     /* Backlog circular buffer current offset,
                                       that is the next byte will'll write to.*/
	...
};
```

在replica失联之后，再次与master连接上，会根据cached_master中上一次同步成功的offset发送给master，master判断offset是否落在repl_backlog内，如果是，则尝试增量同步。

### 增量同步状态机

#### REPL_STATE_SEND_PSYNC

当replica处于REPL_STATE_SEND_PSYNC时，开始拉取master数据，首先尝试增量同步，然后进入REPL_STATE_RECEIVE_PSYNC状态：

```java
void syncWithMaster(aeEventLoop *el, int fd, void *privdata, int mask) {
	...
	/* Try a partial resynchonization. If we don't have a cached master
     * slaveTryPartialResynchronization() will at least try to use PSYNC
     * to start a full resynchronization so that we get the master run id
     * and the global offset, to try a partial resync at the next
     * reconnection attempt. */
    if (server.repl_state == REPL_STATE_SEND_PSYNC) {
        if (slaveTryPartialResynchronization(fd,0) == PSYNC_WRITE_ERROR) {
            err = sdsnew("Write error sending the PSYNC command.");
            goto write_error;
        }
        server.repl_state = REPL_STATE_RECEIVE_PSYNC;
        return;
    }
    ...
}
int slaveTryPartialResynchronization(int fd, int read_reply) {
	...
	/* Writing half */
    if (!read_reply) {
        /* Initially set master_initial_offset to -1 to mark the current
         * master run_id and offset as not valid. Later if we'll be able to do
         * a FULL resync using the PSYNC command we'll set the offset at the
         * right value, so that this information will be propagated to the
         * client structure representing the master into server.master. */
        server.master_initial_offset = -1;
        if (server.cached_master) {
            psync_replid = server.cached_master->replid;
            snprintf(psync_offset,sizeof(psync_offset),"%lld", server.cached_master->reploff+1);
            serverLog(LL_NOTICE,"Trying a partial resynchronization (request %s:%s).", psync_replid, psync_offset);
        } else {
            serverLog(LL_NOTICE,"Partial resynchronization not possible (no cached master)");
            psync_replid = "?";
            memcpy(psync_offset,"-1",3);
        }
        /* Issue the PSYNC command */
        reply = sendSynchronousCommand(SYNC_CMD_WRITE,fd,"PSYNC",psync_replid,psync_offset,NULL);
        if (reply != NULL) {
            serverLog(LL_WARNING,"Unable to send PSYNC to master: %s",reply);
            sdsfree(reply);
            aeDeleteFileEvent(server.el,fd,AE_READABLE);
            return PSYNC_WRITE_ERROR;
        }
        return PSYNC_WAIT_REPLY;
    }
    ...
}
```

replica尝试用cached_master的replid和reploff发送PSYNC命令，如果没有cached_master，则发送PSYNC ? -1，表示要全量同步。

master接受到PSYNC命令之后，根据上面介绍的增量同步条件判断是否可以进行增量同步，如果可以进行增量同步，则回复+CONTINUE replid backlog

```java
/* SYNC and PSYNC command implemenation. */
void syncCommand(client *c) {
	...
	/* Try a partial resynchronization if this is a PSYNC command.
     * If it fails, we continue with usual full resynchronization, however
     * when this happens masterTryPartialResynchronization() already
     * replied with:
     *
     * +FULLRESYNC <replid> <offset>
     *
     * So the slave knows the new replid and offset to try a PSYNC later
     * if the connection with the master is lost. */
    if (!strcasecmp(c->argv[0]->ptr,"psync")) {
        if (masterTryPartialResynchronization(c) == C_OK) {
            server.stat_sync_partial_ok++;
            return; /* No full resync needed, return. */
        } else {
            char *master_replid = c->argv[1]->ptr;
            /* Increment stats for failed PSYNCs, but only if the
             * replid is not "?", as this is used by slaves to force a full
             * resync on purpose when they are not albe to partially
             * resync. */
            if (master_replid[0] != '?') server.stat_sync_partial_err++;
        }
    }
    ...
}
int masterTryPartialResynchronization(client *c) {
	...
	// 判断命令中的replid是否对的上
	if (strcasecmp(master_replid, server.replid) &&
        (strcasecmp(master_replid, server.replid2) ||
         psync_offset > server.second_replid_offset))
    {
        /* Run id "?" is used by slaves that want to force a full resync. */
        if (master_replid[0] != '?') {
            if (strcasecmp(master_replid, server.replid) &&
                strcasecmp(master_replid, server.replid2))
            {
                serverLog(LL_NOTICE,"Partial resynchronization not accepted: "
                    "Replication ID mismatch (Replica asked for '%s', my "
                    "replication IDs are '%s' and '%s')",
                    master_replid, server.replid, server.replid2);
            } else {
                serverLog(LL_NOTICE,"Partial resynchronization not accepted: "
                    "Requested offset for second ID was %lld, but I can reply "
                    "up to %lld", psync_offset, server.second_replid_offset);
            }
        } else {
            serverLog(LL_NOTICE,"Full resync requested by replica %s",
                replicationGetSlaveName(c));
        }
        goto need_full_resync;
    }
    // 判断replica的offset是否落在repl_backlog中
    if (!server.repl_backlog ||
        psync_offset < server.repl_backlog_off ||
        psync_offset > (server.repl_backlog_off + server.repl_backlog_histlen))
    {
        serverLog(LL_NOTICE,
            "Unable to partial resync with replica %s for lack of backlog (Replica request was: %lld).", replicationGetSlaveName(c), psync_offset);
        if (psync_offset > server.master_repl_offset) {
            serverLog(LL_WARNING,
                "Warning: replica %s tried to PSYNC with an offset that is greater than the master replication offset.", replicationGetSlaveName(c));
        }
        goto need_full_resync;
    }
     // 接下来进入增量同步
     /* If we reached this point, we are able to perform a partial resync:
     * 1) Set client state to make it a slave.
     * 2) Inform the client we can continue with +CONTINUE
     * 3) Send the backlog data (from the offset to the end) to the slave. */
     // 把该replica加入server.slaves管理
    c->flags |= CLIENT_SLAVE;
    c->replstate = SLAVE_STATE_ONLINE;
    c->repl_ack_time = server.unixtime;
    c->repl_put_online_on_ack = 0;
    listAddNodeTail(server.slaves,c);
    /* We can't use the connection buffers since they are used to accumulate
     * new commands at this stage. But we are sure the socket send buffer is
     * empty so this write will never fail actually. */
    // 回复+CONTINUE replid backlog
    if (c->slave_capa & SLAVE_CAPA_PSYNC2) {
        buflen = snprintf(buf,sizeof(buf),"+CONTINUE %s\r\n", server.replid);
    } else {
        buflen = snprintf(buf,sizeof(buf),"+CONTINUE\r\n");
    }
    if (write(c->fd,buf,buflen) != buflen) {
        freeClientAsync(c);
        return C_OK;
    }
    psync_len = addReplyReplicationBacklog(c,psync_offset);
    serverLog(LL_NOTICE,
        "Partial resynchronization request from %s accepted. Sending %lld bytes of backlog starting from offset %lld.",
            replicationGetSlaveName(c),
            psync_len, psync_offset);
    /* Note that we don't need to set the selected DB at server.slaveseldb
     * to -1 to force the master to emit SELECT, since the slave already
     * has this state from the previous connection with the master. */
    refreshGoodSlavesCount();
    return C_OK; /* The caller can return, no full resync needed. */
need_full_resync:
    /* We need a full resync for some reason... Note that we can't
     * reply to PSYNC right now if a full SYNC is needed. The reply
     * must include the master offset at the time the RDB file we transfer
     * is generated, so we need to delay the reply to that moment. */
    return C_ERR;
}
```

#### REPL_STATE_RECEIVE_PSYNC

replica处于REPL_STATE_RECEIVE_PSYNC，收到master的回复，触发syncWithMaster函数：

```java
void syncWithMaster(aeEventLoop *el, int fd, void *privdata, int mask) {
	...
	psync_result = slaveTryPartialResynchronization(fd,1);
    if (psync_result == PSYNC_WAIT_REPLY) return; /* Try again later... */
    /* If the master is in an transient error, we should try to PSYNC
     * from scratch later, so go to the error path. This happens when
     * the server is loading the dataset or is not connected with its
     * master and so forth. */
    if (psync_result == PSYNC_TRY_LATER) goto error;
    /* Note: if PSYNC does not return WAIT_REPLY, it will take care of
     * uninstalling the read handler from the file descriptor. */
    if (psync_result == PSYNC_CONTINUE) {
        serverLog(LL_NOTICE, "MASTER <-> REPLICA sync: Master accepted a Partial Resynchronization.");
        return;
    }
    ...
}
int slaveTryPartialResynchronization(int fd, int read_reply) {
	...
	 /* Reading half */
    reply = sendSynchronousCommand(SYNC_CMD_READ,fd,NULL);
    ...
    if (!strncmp(reply,"+FULLRESYNC",11)) {
    	// master要求全量同步
    	...
    }
	if (!strncmp(reply,"+CONTINUE",9)) {
		// master可以增量同步
        /* Partial resync was accepted. */
        serverLog(LL_NOTICE,
            "Successful partial resynchronization with master.");
        /* Check the new replication ID advertised by the master. If it
         * changed, we need to set the new ID as primary ID, and set or
         * secondary ID as the old master ID up to the current offset, so
         * that our sub-slaves will be able to PSYNC with us after a
         * disconnection. */
        char *start = reply+10;
        char *end = reply+9;
        while(end[0] != '\r' && end[0] != '\n' && end[0] != '\0') end++;
        if (end-start == CONFIG_RUN_ID_SIZE) {
            char new[CONFIG_RUN_ID_SIZE+1];
            memcpy(new,start,CONFIG_RUN_ID_SIZE);
            new[CONFIG_RUN_ID_SIZE] = '\0';
			// master的replid发生改变
            if (strcmp(new,server.cached_master->replid)) {
                /* Master ID changed. */
                serverLog(LL_WARNING,"Master replication ID changed to %s",new);
                /* Set the old ID as our ID2, up to the current offset+1. */
                memcpy(server.replid2,server.cached_master->replid,
                    sizeof(server.replid2));
                server.second_replid_offset = server.master_repl_offset+1;
                /* Update the cached master ID and our own primary ID to the
                 * new one. */
                memcpy(server.replid,new,sizeof(server.replid));
                memcpy(server.cached_master->replid,new,sizeof(server.replid));
                /* Disconnect all the sub-slaves: they need to be notified. */
                disconnectSlaves();
            }
        }
        /* Setup the replication to continue. */
        sdsfree(reply);
        replicationResurrectCachedMaster(fd);
        /* If this instance was restarted and we read the metadata to
         * PSYNC from the persistence file, our replication backlog could
         * be still not initialized. Create it. */
        if (server.repl_backlog == NULL) createReplicationBacklog();
        return PSYNC_CONTINUE;
    }
	...
}
```

可以看到，如果replica增量同步成功，就从syncWithMaster函数中返回了，接下来就调用replicationResurrectCachedMaster注册可读事件readQueryFromClient，这个函数在[Redis 源码解析 - Redis 命令端到端的过程](/zhuanlan/db/redis/6/5.html)中介绍过，用来读取并处理客户端的命令，只不过此时的客户端是个master:

```java
void replicationResurrectCachedMaster(int newfd) {
	// 更新master信息
    server.master = server.cached_master;
    server.cached_master = NULL;
    server.master->fd = newfd;
    server.master->flags &= ~(CLIENT_CLOSE_AFTER_REPLY|CLIENT_CLOSE_ASAP);
    server.master->authenticated = 1;
    server.master->lastinteraction = server.unixtime;
    server.repl_state = REPL_STATE_CONNECTED;
    server.repl_down_since = 0;
    /* Re-add to the list of clients. */
    linkClient(server.master);
    // 注册可读事件readQueryFromClient
    if (aeCreateFileEvent(server.el, newfd, AE_READABLE,
                          readQueryFromClient, server.master)) {
        serverLog(LL_WARNING,"Error resurrecting the cached master, impossible to add the readable handler: %s", strerror(errno));
        freeClientAsync(server.master); /* Close ASAP. */
    }
    /* We may also need to install the write handler as well if there is
     * pending data in the write buffers. */
    if (clientHasPendingReplies(server.master)) {
        if (aeCreateFileEvent(server.el, newfd, AE_WRITABLE,
                          sendReplyToClient, server.master)) {
            serverLog(LL_WARNING,"Error resurrecting the cached master, impossible to add the writable handler: %s", strerror(errno));
            freeClientAsync(server.master); /* Close ASAP. */
        }
    }
}
```

这样master跟随+CONTINUE发送过来的增量命令就可以被replica读取并应用到DB中。
