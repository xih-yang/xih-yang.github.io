# 19、Redis 源码解析 - Redis 主从握手
- 来源：https://ddkk.com/zhuanlan/db/redis/6/19.html
- 分类：缓存数据库
- 分组：教程目录
Redis的单机部分在前面几节讲解完毕，还有诸如Geo、Hyperlog、Stream、Bitmap、Lua、Module、内存整理等部分，这里先埋个坑，以后再介绍，从这节开始，介绍Redis的集群模式，先来看看主从同步。

主从同步是分布式系统中保证系统可用性的常见手段，通过添加冗余副本，当主宕机后，从副本可以接替主，从而使得系统一直可用。同时主从副本上的数据一致，在一定程度上也保证了数据的稳定性。

主从同步的过程分成两个阶段：主从握手阶段、全量/增量同步阶段、增量复制阶段，下面具体来介绍。

### 主从同步开启/关闭

一个replica如何挂到一个master下面呢，有两种方式：

**1、** 在replica的启动配置文件上开启：replicaofmasteripmasterport；

**2、** replica启动之后，发送replicaofmasteripmasterport命令；

Redis从这两种方式中解析出server.masterhost和server.masterport，接下来开始主从同步的一些列操作。

把一个已经挂到某个master的replica，从master上解除的方式：发送replicaof no one命令

### 主从握手

struct redisServer中关于主从同步的字段如下：

```java
struct redisServer {
	/* Replication (master) */
    char replid[CONFIG_RUN_ID_SIZE+1];  /* My current replication ID. */
    char replid2[CONFIG_RUN_ID_SIZE+1]; /* replid inherited from master*/
    long long master_repl_offset;   /* My current replication offset */
    long long second_replid_offset; /* Accept offsets up to this for replid2. */
    int slaveseldb;                 /* Last SELECTed DB in replication output */
    int repl_ping_slave_period;     /* Master pings the slave every N seconds */
    char *repl_backlog;             /* Replication backlog for partial syncs */
    long long repl_backlog_size;    /* Backlog circular buffer size */
    long long repl_backlog_histlen; /* Backlog actual data length */
    long long repl_backlog_idx;     /* Backlog circular buffer current offset,
                                       that is the next byte will'll write to.*/
    long long repl_backlog_off;     /* Replication "master offset" of first
                                       byte in the replication backlog buffer.*/
    time_t repl_backlog_time_limit; /* Time without slaves after the backlog
                                       gets released. */
    time_t repl_no_slaves_since;    /* We have no slaves since that time.
                                       Only valid if server.slaves len is 0. */
    int repl_min_slaves_to_write;   /* Min number of slaves to write. */
    int repl_min_slaves_max_lag;    /* Max lag of <count> slaves to write. */
    int repl_good_slaves_count;     /* Number of slaves with lag <= max_lag. */
    int repl_diskless_sync;         /* Send RDB to slaves sockets directly. */
    int repl_diskless_sync_delay;   /* Delay to start a diskless repl BGSAVE. */
	/* Replication (slave) */
    char *masterauth;               /* AUTH with this password with master */
    char *masterhost;               /* Hostname of master */
    int masterport;                 /* Port of master */
    int repl_timeout;               /* Timeout after N seconds of master idle */
    client *master;     /* Client that is master for this slave */
    client *cached_master; /* Cached master to be reused for PSYNC. */
    int repl_syncio_timeout; /* Timeout for synchronous I/O calls */
    int repl_state;          /* Replication status if the instance is a slave */
    off_t repl_transfer_size; /* Size of RDB to read from master during sync. */
    off_t repl_transfer_read; /* Amount of RDB read from master during sync. */
    off_t repl_transfer_last_fsync_off; /* Offset when we fsync-ed last time. */
    int repl_transfer_s;     /* Slave -> Master SYNC socket */
    int repl_transfer_fd;    /* Slave -> Master SYNC temp file descriptor */
    char *repl_transfer_tmpfile; /* Slave-> master SYNC temp file name */
    time_t repl_transfer_lastio; /* Unix time of the latest read, for timeout */
    int repl_serve_stale_data; /* Serve stale data when link is down? */
    int repl_slave_ro;          /* Slave is read only? */
    int repl_slave_ignore_maxmemory;    /* If true slaves do not evict. */
    time_t repl_down_since; /* Unix time at which link with master went down */
    int repl_disable_tcp_nodelay;   /* Disable TCP_NODELAY after SYNC? */
    int slave_priority;             /* Reported in INFO and used by Sentinel. */
    int slave_announce_port;        /* Give the master this listening port. */
    char *slave_announce_ip;        /* Give the master this ip address. */
    /* The following two fields is where we store master PSYNC replid/offset
     * while the PSYNC is in progress. At the end we'll copy the fields into
     * the server->master client structure. */
    char master_replid[CONFIG_RUN_ID_SIZE+1];  /* Master PSYNC runid. */
    long long master_initial_offset;           /* Master PSYNC offset. */
    int repl_slave_lazy_flush;          /* Lazy FLUSHALL before loading DB? */
    /* Replication script cache. */
    dict *repl_scriptcache_dict;        /* SHA1 all slaves are aware of. */
    list *repl_scriptcache_fifo;        /* First in, first out LRU eviction. */
    unsigned int repl_scriptcache_size; /* Max number of elements. */
};
```

这里先关注下repl_state这个字段，表示主从同步的状态，Redis主从同步的建立正是基于状态机实现，这个字段有如下状态：

```java
/* Slave replication state. Used in server.repl_state for slaves to remember
 * what to do next. */
#define REPL_STATE_NONE 0 /* No active replication */
#define REPL_STATE_CONNECT 1 /* Must connect to master */
#define REPL_STATE_CONNECTING 2 /* Connecting to master */
/* --- Handshake states, must be ordered --- */
#define REPL_STATE_RECEIVE_PONG 3 /* Wait for PING reply */
#define REPL_STATE_SEND_AUTH 4 /* Send AUTH to master */
#define REPL_STATE_RECEIVE_AUTH 5 /* Wait for AUTH reply */
#define REPL_STATE_SEND_PORT 6 /* Send REPLCONF listening-port */
#define REPL_STATE_RECEIVE_PORT 7 /* Wait for REPLCONF reply */
#define REPL_STATE_SEND_IP 8 /* Send REPLCONF ip-address */
#define REPL_STATE_RECEIVE_IP 9 /* Wait for REPLCONF reply */
#define REPL_STATE_SEND_CAPA 10 /* Send REPLCONF capa */
#define REPL_STATE_RECEIVE_CAPA 11 /* Wait for REPLCONF reply */
#define REPL_STATE_SEND_PSYNC 12 /* Send PSYNC */
#define REPL_STATE_RECEIVE_PSYNC 13 /* Wait for PSYNC reply */
/* --- End of handshake states --- */
#define REPL_STATE_TRANSFER 14 /* Receiving .rdb from master */
#define REPL_STATE_CONNECTED 15 /* Connected to master */
```

下面根据状态流转来介绍全量/增量同步的整个过程。

#### REPL_STATE_CONNECT

上一小节介绍过主从同步开启的两种方式，第一种配置文件方式，解析出来server.masterhost和server.masterport，并把主从同步状态server.repl_state设置为REPL_STATE_CONNECT，表示接下来需要向master建立连接

```java
void loadServerConfigFromString(char *config) {
	...
 	if ((!strcasecmp(argv[0],"slaveof") ||
            !strcasecmp(argv[0],"replicaof")) && argc == 3) {
        slaveof_linenum = linenum;
        server.masterhost = sdsnew(argv[1]);
        server.masterport = atoi(argv[2]);
        server.repl_state = REPL_STATE_CONNECT;
    }
    ...
```

第二种方式，用户命令方式

```java
void replicaofCommand(client *c) {
    ...
    // replicaof no one命令处理
    if (!strcasecmp(c->argv[1]->ptr,"no") &&
        !strcasecmp(c->argv[2]->ptr,"one")) {
        if (server.masterhost) {
            replicationUnsetMaster();
            sds client = catClientInfoString(sdsempty(),c);
            serverLog(LL_NOTICE,"MASTER MODE enabled (user request from '%s')",
                client);
            sdsfree(client);
        }
    } else {
     	... 
     	// 解析server.masterhost、server.masterport
     	// 设置master
        replicationSetMaster(c->argv[1]->ptr, port);
        ...
    }
    addReply(c,shared.ok);
}
/* Set replication to the specified master address and port. */
void replicationSetMaster(char *ip, int port) {
    int was_master = server.masterhost == NULL;
    sdsfree(server.masterhost);
    server.masterhost = sdsnew(ip);
    server.masterport = port;
    // 如果该节点之前已经是个replica，那么断开与之前master的连接
    if (server.master) {
        freeClient(server.master);
    }
    // 断开所有处于阻塞中的客户端，因为这之后要重新加载新的master数据，之前所有阻塞在数据上的客户端没有意义
    disconnectAllBlockedClients(); /* Clients blocked in master, now slave. */
    /* Force our slaves to resync with us as well. They may hopefully be able
     * to partially resync with us, but we can notify the replid change. */
    // 如果该节点之前是个master，那么断开所有replica的连接
    disconnectSlaves();
    // 如果该节点之前是个replica，并且与之前的master处于handshake阶段，则断开
    cancelReplicationHandshake();
    /* Before destroying our master state, create a cached master using
     * our own parameters, to later PSYNC with the new master. */
    // 设置cached_master
    if (was_master) {
        replicationDiscardCachedMaster();
        replicationCacheMasterUsingMyself();
    }
    // 最后设置server.repl_state为REPL_STATE_CONNECT
    server.repl_state = REPL_STATE_CONNECT;
}
```

#### REPL_STATE_CONNECTING

REPL_STATE_CONNECT会流转到REPL_STATE_CONNECTING状态，在serverCron中调用replicationCron来处理主从同步：

```java
int serverCron(struct aeEventLoop *eventLoop, long long id, void *clientData) {
	...
	run_with_period(1000) replicationCron();
	...
}
```

replicationCron会根据当前server.repl_state来采取不同的动作，处于REPL_STATE_CONNECT状态会调用connectWithMaster函数：

```java
void replicationCron(void) {
	...
	/* Check if we should connect to a MASTER */
    if (server.repl_state == REPL_STATE_CONNECT) {
        serverLog(LL_NOTICE,"Connecting to MASTER %s:%d",
            server.masterhost, server.masterport);
        if (connectWithMaster() == C_OK) {
            serverLog(LL_NOTICE,"MASTER <-> REPLICA sync started");
        }
    }
	...
}
```

connectWithMaster会尝试向master发起连接，并向事件循环中注册可读可写事件函数syncWithMaster，最后把状态设置为REPL_STATE_CONNECTING：

```java
int connectWithMaster(void) {
    int fd;
	// 向master发起连接
    fd = anetTcpNonBlockBestEffortBindConnect(NULL,
        server.masterhost,server.masterport,NET_FIRST_BIND_ADDR);
    if (fd == -1) {
        serverLog(LL_WARNING,"Unable to connect to MASTER: %s",
            strerror(errno));
        return C_ERR;
    }
	// 注册syncWithMaster，
    if (aeCreateFileEvent(server.el,fd,AE_READABLE|AE_WRITABLE,syncWithMaster,NULL) ==
            AE_ERR)
    {
        close(fd);
        serverLog(LL_WARNING,"Can't create readable event for SYNC");
        return C_ERR;
    }
    server.repl_transfer_lastio = server.unixtime;
    server.repl_transfer_s = fd;
    // 把状态设置为REPL_STATE_CONNECTING
    server.repl_state = REPL_STATE_CONNECTING;
    return C_OK;
}
```

#### REPL_STATE_RECEIVE_PONG

注册完可读可写事件之后，会立即出发syncWithMaster一次，判断当前状态，并采取相应操作，对于REPL_STATE_CONNECTING状态，会向master发送"PING"，然后把状态设置为REPL_STATE_RECEIVE_PONG

```java
void syncWithMaster(aeEventLoop *el, int fd, void *privdata, int mask) {
	...
	/* Send a PING to check the master is able to reply without errors. */
    if (server.repl_state == REPL_STATE_CONNECTING) {
        serverLog(LL_NOTICE,"Non blocking connect for SYNC fired the event.");
        /* Delete the writable event so that the readable event remains
         * registered and we can wait for the PONG reply. */
        aeDeleteFileEvent(server.el,fd,AE_WRITABLE);
        server.repl_state = REPL_STATE_RECEIVE_PONG;
        /* Send the PING, don't check for errors at all, we have the timeout
         * that will take care about this. */
        err = sendSynchronousCommand(SYNC_CMD_WRITE,fd,"PING",NULL);
        if (err) goto write_error;
        return;
    }
    ...
}
```

对于master来说，收到PING之后，master会向replica回复"PONG"：

```java
/* The PING command. It works in a different way if the client is in
 * in Pub/Sub mode. */
void pingCommand(client *c) {
    ...
    if (c->argc == 1)
        addReply(c,shared.pong);
    else
        addReplyBulk(c,c->argv[1]);
}
```

#### REPL_STATE_RECEIVE_PONG

replica收到master的"PONG"之后，会再次触发可读事件syncWithMaster，当前replica的状态是REPL_STATE_RECEIVE_PONG：

```java
void syncWithMaster(aeEventLoop *el, int fd, void *privdata, int mask) {
	...
	/* Receive the PONG command. */
    if (server.repl_state == REPL_STATE_RECEIVE_PONG) {
        err = sendSynchronousCommand(SYNC_CMD_READ,fd,NULL);
        /* We accept only two replies as valid, a positive +PONG reply
         * (we just check for "+") or an authentication error.
         * Note that older versions of Redis replied with "operation not
         * permitted" instead of using a proper error code, so we test
         * both. */
        if (err[0] != '+' &&
            strncmp(err,"-NOAUTH",7) != 0 &&
            strncmp(err,"-ERR operation not permitted",28) != 0)
        {
            serverLog(LL_WARNING,"Error reply to PING from master: '%s'",err);
            sdsfree(err);
            goto error;
        } else {
            serverLog(LL_NOTICE,
                "Master replied to PING, replication can continue...");
        }
        sdsfree(err);
        server.repl_state = REPL_STATE_SEND_AUTH;
    }
    ...
}
```

接下来replica进入REPL_STATE_SEND_AUTH状态

#### REPL_STATE_SEND_AUTH

从REPL_STATE_RECEIVE_PONG进入REPL_STATE_SEND_AUTH状态之后，syncWithMaster函数会继续往下走，尝试向master发送auth命令，然后进入REPL_STATE_RECEIVE_AUTH状态，如果没有鉴权，直接进入REPL_STATE_SEND_PORT状态：

```java
void syncWithMaster(aeEventLoop *el, int fd, void *privdata, int mask) {
	...
    /* AUTH with the master if required. */
    if (server.repl_state == REPL_STATE_SEND_AUTH) {
        if (server.masterauth) {
            err = sendSynchronousCommand(SYNC_CMD_WRITE,fd,"AUTH",server.masterauth,NULL);
            if (err) goto write_error;
            server.repl_state = REPL_STATE_RECEIVE_AUTH;
            return;
        } else {
            server.repl_state = REPL_STATE_SEND_PORT;
        }
    }
    ...
}
```

master收到auth命令，会对密码进行鉴权，然后回复

#### REPL_STATE_RECEIVE_AUTH

收到master的auth回复之后，触发可读事件函数syncWithMaster，replica会读取master对于auth命令的返回值，然后进入REPL_STATE_SEND_PORT状态：

```java
void syncWithMaster(aeEventLoop *el, int fd, void *privdata, int mask) {
	...
    /* Receive AUTH reply. */
    if (server.repl_state == REPL_STATE_RECEIVE_AUTH) {
        err = sendSynchronousCommand(SYNC_CMD_READ,fd,NULL);
        if (err[0] == '-') {
            serverLog(LL_WARNING,"Unable to AUTH to MASTER: %s",err);
            sdsfree(err);
            goto error;
        }
        sdsfree(err);
        server.repl_state = REPL_STATE_SEND_PORT;
    }
    ...
}
```

#### REPL_STATE_SEND_PORT

从REPL_STATE_SEND_PORT状态，syncWithMaster函数继续往下走，replica向master发送自己的port，然后进入REPL_STATE_RECEIVE_PORT状态

```java
void syncWithMaster(aeEventLoop *el, int fd, void *privdata, int mask) {
	...
    /* Set the slave port, so that Master's INFO command can list the
     * slave listening port correctly. */
    if (server.repl_state == REPL_STATE_SEND_PORT) {
        sds port = sdsfromlonglong(server.slave_announce_port ?
            server.slave_announce_port : server.port);
        err = sendSynchronousCommand(SYNC_CMD_WRITE,fd,"REPLCONF",
                "listening-port",port, NULL);
        sdsfree(port);
        if (err) goto write_error;
        sdsfree(err);
        server.repl_state = REPL_STATE_RECEIVE_PORT;
        return;
    }
    ...
}
```

master收到replica的listening-port命令，会设置replica的slave_listening_port，然后回复：

```java
void replconfCommand(client *c) {
	...
	if (!strcasecmp(c->argv[j]->ptr,"listening-port")) {
            long port;
            if ((getLongFromObjectOrReply(c,c->argv[j+1],
                    &port,NULL) != C_OK))
                return;
            c->slave_listening_port = port;
    }
    addReply(c,shared.ok);
}
```

#### REPL_STATE_RECEIVE_PORT

replica在REPL_STATE_RECEIVE_PORT收到master的回复之后，继续触发可读事件syncWithMaster，进入REPL_STATE_SEND_IP状态：

```java
void syncWithMaster(aeEventLoop *el, int fd, void *privdata, int mask) {
	...
    /* Receive REPLCONF listening-port reply. */
    if (server.repl_state == REPL_STATE_RECEIVE_PORT) {
        err = sendSynchronousCommand(SYNC_CMD_READ,fd,NULL);
        /* Ignore the error if any, not all the Redis versions support
         * REPLCONF listening-port. */
        if (err[0] == '-') {
            serverLog(LL_NOTICE,"(Non critical) Master does not understand "
                                "REPLCONF listening-port: %s", err);
        }
        sdsfree(err);
        server.repl_state = REPL_STATE_SEND_IP;
    }
    ...
}
```

#### REPL_STATE_SEND_IP

syncWithMaster继续往下走，replica向master发送自己的ip，并进入REPL_STATE_RECEIVE_IP状态

```java
void syncWithMaster(aeEventLoop *el, int fd, void *privdata, int mask) {
	...
    /* Set the slave ip, so that Master's INFO command can list the
     * slave IP address port correctly in case of port forwarding or NAT. */
    if (server.repl_state == REPL_STATE_SEND_IP) {
        err = sendSynchronousCommand(SYNC_CMD_WRITE,fd,"REPLCONF",
                "ip-address",server.slave_announce_ip, NULL);
        if (err) goto write_error;
        sdsfree(err);
        server.repl_state = REPL_STATE_RECEIVE_IP;
        return;
    }
    ...
}
```

master收到replica的REPLCONF ip-address之后，会设置client的slave_ip并回复：

```java
void replconfCommand(client *c) {
	...
	if (!strcasecmp(c->argv[j]->ptr,"ip-address")) {
	      sds ip = c->argv[j+1]->ptr;
	       if (sdslen(ip) < sizeof(c->slave_ip)) {
	           memcpy(c->slave_ip,ip,sdslen(ip)+1);
	       } else {
	           addReplyErrorFormat(c,"REPLCONF ip-address provided by "
	               "replica instance is too long: %zd bytes", sdslen(ip));
	           return;
	       }
    }
    addReply(c,shared.ok);
}
```

#### REPL_STATE_RECEIVE_IP

replica触发可读事件syncWithMaster，向master发送自己具备的能力，并进入REPL_STATE_SEND_CAPA状态：

```java
void syncWithMaster(aeEventLoop *el, int fd, void *privdata, int mask) {
	...
     /* Inform the master of our (slave) capabilities.
     *
     * EOF: supports EOF-style RDB transfer for diskless replication.
     * PSYNC2: supports PSYNC v2, so understands +CONTINUE <new repl ID>.
     *
     * The master will ignore capabilities it does not understand. */
    if (server.repl_state == REPL_STATE_SEND_CAPA) {
        err = sendSynchronousCommand(SYNC_CMD_WRITE,fd,"REPLCONF",
                "capa","eof","capa","psync2",NULL);
        if (err) goto write_error;
        sdsfree(err);
        server.repl_state = REPL_STATE_RECEIVE_CAPA;
        return;
    }
    ...
}
```

这个能力目前有两个：

**1、** eof，表示replica可以非落盘的加载master的RDB文件；

**2、** psync2，表示replica支持PSYNCv2；

master收到REPLCONF capa之后，继续设置replica的能力，并返回：

```java
```c
void replconfCommand(client *c) {
	...
	if(!strcasecmp(c->argv[j]->ptr,"capa")) {
        /* Ignore capabilities not understood by this master. */
        if (!strcasecmp(c->argv[j+1]->ptr,"eof"))
            c->slave_capa |= SLAVE_CAPA_EOF;
        else if (!strcasecmp(c->argv[j+1]->ptr,"psync2"))
            c->slave_capa |= SLAVE_CAPA_PSYNC2;
 }
addReply(c,shared.ok);
}
#### REPL\_STATE\_RECEIVE\_CAPA
replica收到master的回复之后，触发syncWithMaster函数，进入REPL\_STATE\_SEND\_PSYNC状态：
```java 
void syncWithMaster(aeEventLoop *el, int fd, void *privdata, int mask) {
	...
    /* Receive CAPA reply. */
    if (server.repl_state == REPL_STATE_RECEIVE_CAPA) {
        err = sendSynchronousCommand(SYNC_CMD_READ,fd,NULL);
        /* Ignore the error if any, not all the Redis versions support
         * REPLCONF capa. */
        if (err[0] == '-') {
            serverLog(LL_NOTICE,"(Non critical) Master does not understand "
                                  "REPLCONF capa: %s", err);
        }
        sdsfree(err);
        server.repl_state = REPL_STATE_SEND_PSYNC;
    }
    ...
}
```

replica从REPL_STATE_SEND_PSYNC这个状态开始，某种意义上，主从握手阶段结束，replica真正的开始向master拉取数据。
