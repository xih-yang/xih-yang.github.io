# 13、Redis 源码解析 - Redis 主从复制
- 来源：https://ddkk.com/zhuanlan/db/redis/7/13.html
- 分类：缓存数据库
- 分组：教程目录
主从复制是redis原生提供的一种建立一个辅助数据库,其数据与主服务器保证一定程度的数据一致性,可以水平扩展数据库的负载能力,容错,高可用,数据备份.基本的操作就是建立N个从服务器,称为slave,负责数据的读.一个主服务器,称为master,负责数据的写.这样可以使得服务器的处理请求能力线性扩展.

### 源码解析

redis主从复制在主从节点以及部署好以后其实可说的不多,就是把每次改变服务器状态(发布订阅也算)的命令发送给从服务器,**也就是把主服务器作为从服务器的客户端**,从服务器在接收到命令后执行即可.所以我们把重点放在如何部署主从节点与恢复上,主要操作分为三个函数.

**1、**`replicationSetMaster`将服务器设为指定地址的从服务器主要操作就是改变一些属性.；

**2、**`connectWithMaster`非阻塞创建一个套接字连接并设置读处理器(syncWithMaster)当连接成功时执行.；

**3、**`syncWithMaster`其中操作均为同步会进行一系列验证并决定进行部分重同步还是完整重同步.；

#### replicationSetMaster

```java
// 将服务器设为指定地址的从服务器
// 因为指定为某个服务器的从服务器是在从服务器上指定的 所以需要改变状态
void replicationSetMaster(char *ip, int port) {
    // 清除原有的主服务器地址（如果有的话）
    sdsfree(server.masterhost);
    // 设置主服务器IP
    server.masterhost = sdsnew(ip);
    // 端口
    server.masterport = port;
    // 清除原来可能有的主服务器信息
    // 如果之前有其他地址，那么释放它 这里释放的是客户端,你可能会有些疑惑
    // 这里是因为主服务器最后会成为从服务器的客户端,主服务器要向从服务器发送消息呀
    if (server.master) freeClient(server.master);
    // 断开所有从服务器的连接
    disconnectSlaves(); /* Force our slaves to resync with us as well. */
    // 清空可能有的 master 缓存,因为已经不会执行 PSYNC 了,已经成为另一个主服务器的slave,当然缓存失效啦
    replicationDiscardCachedMaster(); /* Don't try a PSYNC. */
    // 释放backlog,同理,PSYNC目前已经不会执行了,backblog就是复制积压缓冲区,用于部分重同步,结构为char*
    freeReplicationBacklog(); /* Don't allow our chained slaves to PSYNC. */
    // 取消之前的复制进程（如果有的话）
    cancelReplicationHandshake();
    // 进入连接状态（重点）
    server.repl_state = REDIS_REPL_CONNECT; //改变状态 这是分布式中非常重要的一点
    server.master_repl_offset = 0;
    server.repl_down_since = 0;
}
```

我们看到`replicationSetMaster`所做的事情其实就是把从服务器自身的状态初始化.

#### connectWithMaster

```java
// 以非阻塞方式连接主服务器
int connectWithMaster(void) {
    int fd;
    // 连接主服务器
    fd = anetTcpNonBlockConnect(NULL,server.masterhost,server.masterport);
    if (fd == -1) {
        redisLog(REDIS_WARNING,"Unable to connect to MASTER: %s",
            strerror(errno));
        return REDIS_ERR;
    }
    // 监听主服务器 fd 的读和写事件，并绑定文件事件处理器             //设置为回调 当epoll中收到连接信息时调用
    if (aeCreateFileEvent(server.el,fd,AE_READABLE|AE_WRITABLE,syncWithMaster,NULL) ==
            AE_ERR)
    {
        close(fd);
        redisLog(REDIS_WARNING,"Can't create readable event for SYNC");
        return REDIS_ERR;
    }
    // 初始化统计变量
    server.repl_transfer_lastio = server.unixtime;//最近一次读入RDB内容的时间 
    server.repl_transfer_s = fd; //主服务器的套接字
    // 将状态改为已连接
    server.repl_state = REDIS_REPL_CONNECTING; //状态转移
    return REDIS_OK;
}
```

这里都是比较正常的操作,有可能有朋友不知道为什么要使用非阻塞connect.这是因为一般的网络连接中阻塞connect成功意味着客户端已经收到了三次握手的最后一个ack,而这在广域网中可能长达数秒,这对于一个高性能的服务器来说是不可忍受的,所以我们一般在网络程序中使用非阻塞connect,它会立即返回,可以在error为EINPROGRESS,EISCONN,EINTR时认为成功,等待IO多路复用返回事件时判断是否连接成功,**需要注意的是就算出现可写事件也不能简单的认为连接成功,原因是连接错误的时候仍会触发可读可写事件,成功只会触发可写事件,此时可以用getsockopt来判断是否成功.其实在muduo网路库中采用了两种判断套接字是否正确的方法,一个是getsockopt,除此之外还要判断自连接.**

#### syncWithMaster

这个其实是一个事件处理器,也就是在非阻塞connect被响应的时候要执行的函数.

```java
// 从服务器用于同步主服务器的回调函数
void syncWithMaster(aeEventLoop *el, int fd, void *privdata, int mask) {
    char tmpfile[256], *err;
    int dfd, maxtries = 5;
    int sockerr = 0, psync_result;
    socklen_t errlen = sizeof(sockerr);
    REDIS_NOTUSED(el);
    REDIS_NOTUSED(privdata);
    REDIS_NOTUSED(mask);
    /* If this event fired after the user turned the instance into a master
     * with SLAVEOF NO ONE we must just return ASAP. */
    // 如果处于 SLAVEOF NO ONE 模式，那么关闭 fd 证明与不希望成为一个从服务器了
    if (server.repl_state == REDIS_REPL_NONE) {
        close(fd);
        return;
    }
    /* Check for errors in the socket. */
    //非阻塞连接 需要检查套接字错误
    if (getsockopt(fd, SOL_SOCKET, SO_ERROR, &sockerr, &errlen) == -1)
        sockerr = errno;
    if (sockerr) {
        aeDeleteFileEvent(server.el,fd,AE_READABLE|AE_WRITABLE);
        redisLog(REDIS_WARNING,"Error condition on socket for SYNC: %s",
            strerror(sockerr));
        goto error;
    }
    /* If we were connecting, it's time to send a non blocking PING, we want to
     * make sure the master is able to reply before going into the actual
     * replication process where we have long timeouts in the order of
     * seconds (in the meantime the slave would block). */
    // 如果状态为 REDIS_REPL_CONNECTING,证明这是第一次进入这个函数,
    // 因为后面还要PING一下,所以需要用状态转移使得下次不进入这个if判断
    // 向主服务器发送一个非阻塞的 PING 
    // 因为接下来的 RDB 文件发送非常耗时，所以我们想确认主服务器真的能访问
    if (server.repl_state == REDIS_REPL_CONNECTING) {
        redisLog(REDIS_NOTICE,"Non blocking connect for SYNC fired the event.");
        /* Delete the writable event so that the readable event remains
         * registered and we can wait for the PONG reply. */
        // 手动发送同步 PING ，暂时取消监听写事件
        aeDeleteFileEvent(server.el,fd,AE_WRITABLE);
        // 更新状态
        server.repl_state = REDIS_REPL_RECEIVE_PONG;
        /* Send the PING, don't check for errors at all, we have the timeout
         * that will take care about this. */
        // 同步发送 PING 这里可能会很耗时间
        syncWrite(fd,"PING\r\n",6,100);
        // 返回,等待 PONG 到达
        // 如果PONG到达因为状态为REDIS_REPL_RECEIVE_PONG会直接去执行下面 用状态确保代码不会重复执行
        return; 
    }
    /* Receive the PONG command. */
    // 接收 PONG 命令
    if (server.repl_state == REDIS_REPL_RECEIVE_PONG) {
        char buf[1024];
        /* Delete the readable event, we no longer need it now that there is
         * the PING reply to read. */
        // 手动同步接收 PONG,暂时取消监听读事件,此时读写事件均被删掉 
        aeDeleteFileEvent(server.el,fd,AE_READABLE);
        /* Read the reply with explicit timeout. */
        // 尝试在指定时间限制内读取 PONG
        buf[0] = '\0';
        // 同步接收 PONG
        if (syncReadLine(fd,buf,sizeof(buf),
            server.repl_syncio_timeout*1000) == -1) //超时后者read错误进入判断 会与服务器断开并重新连接
        {
            redisLog(REDIS_WARNING,
                "I/O error reading PING reply from master: %s",
                strerror(errno));
            goto error;
        }
        /* We accept only two replies as valid, a positive +PONG reply
         * (we just check for "+") or an authentication error.
         * Note that older versions of Redis replied with "operation not
         * permitted" instead of using a proper error code, so we test
         * both. */
        // 接收到的数据只有两种可能：
        // 第一种是 +PONG ，第二种是因为未验证而出现的 -NOAUTH 错误
        if (buf[0] != '+' &&
            strncmp(buf,"-NOAUTH",7) != 0 &&
            strncmp(buf,"-ERR operation not permitted",28) != 0)
        {
            // 接收到未验证错误
            redisLog(REDIS_WARNING,"Error reply to PING from master: '%s'",buf);
            goto error;
        } else {
            // 接收到 PONG
            redisLog(REDIS_NOTICE,
                "Master replied to PING, replication can continue...");
        }
    }
    /* AUTH with the master if required. */
    // 进行身份验证
    if(server.masterauth) {
      //注意这里的发送消息是同步的 意味着服务器此时会阻塞在这里
        // err是由从主服务器接收到的回复字符串
        err = sendSynchronousCommand(fd,"AUTH",server.masterauth,NULL);
        if (err[0] == '-') {
      //err是从主服务器接收到的信息
            redisLog(REDIS_WARNING,"Unable to AUTH to MASTER: %s",err);
            sdsfree(err);
            goto error;
        }
        sdsfree(err);//好像
    }
    /* Set the slave port, so that Master's INFO command can list the
     * slave listening port correctly. */
    // 将从服务器的端口发送给主服务器,还是同步的
    // 使得主服务器的 INFO 命令可以显示从服务器正在监听的端口
    {
        sds port = sdsfromlonglong(server.port);
        err = sendSynchronousCommand(fd,"REPLCONF","listening-port",port,
                                         NULL);
        sdsfree(port);
        /* Ignore the error if any, not all the Redis versions support
         * REPLCONF listening-port. */
        if (err[0] == '-') {
            redisLog(REDIS_NOTICE,"(Non critical) Master does not understand REPLCONF listening-port: %s", err);
        }
        sdsfree(err);
    }
    /* Try a partial resynchonization. If we don't have a cached master
     * slaveTryPartialResynchronization() will at least try to use PSYNC
     * to start a full resynchronization so that we get the master run id
     * and the global offset, to try a partial resync at the next
     * reconnection attempt. */
    // 根据返回的结果决定是执行部分 resync ，还是 full-resync
    // 这个函数做的事情就是根据当前服务器的状态向主服务器发送psync,根据返回值判断进行部分重同步函数完整重同步
    // 共有三种返回值 将进行部分重同步,将进行完整重同步,主服务器不支持psync
    psync_result = slaveTryPartialResynchronization(fd);
    // 进行部分重同步 接下来会发送命令过来 收到后执行即可
    // 有心的朋友可能会发现这里好像并没有指定读处理器 上面我们已经删除了读写事件了
    // 原因是这里是不可能先执行了,肯定会先进行一次完整重同步以后才有可能进行这里 所以我们先看下面
    if (psync_result == PSYNC_CONTINUE) {
        redisLog(REDIS_NOTICE, "MASTER <-> SLAVE sync: Master accepted a Partial Resynchronization.");
        // 返回
        return;
    }
    /* Fall back to SYNC if needed. Otherwise psync_result == PSYNC_FULLRESYNC
     * and the server.repl_master_runid and repl_master_initial_offset are
     * already populated. */
    // 主服务器不支持 PSYNC ,发送 SYNC
    if (psync_result == PSYNC_NOT_SUPPORTED) {
        redisLog(REDIS_NOTICE,"Retrying with SYNC...");
        // 向主服务器发送 SYNC 命令
        if (syncWrite(fd,"SYNC\r\n",6,server.repl_syncio_timeout*1000) == -1) {
            redisLog(REDIS_WARNING,"I/O error writing to MASTER: %s",
                strerror(errno));
            goto error;
        }
    }
    // 如果执行到这里,
    // 那么 psync_result == PSYNC_FULLRESYNC 或 PSYNC_NOT_SUPPORTED
    /* Prepare a suitable temp file for bulk transfer */
    // 打开一个临时文件，用于写入和保存接下来从主服务器传来的 RDB 文件数据
    while(maxtries--) {
      //可能打开失败(文件描述符不足) 默认执行五次 不清楚为什么,
        snprintf(tmpfile,256,
            "temp-%d.%ld.rdb",(int)server.unixtime,(long int)getpid());
        dfd = open(tmpfile,O_CREAT|O_WRONLY|O_EXCL,0644);
        if (dfd != -1) break;
        sleep(1);
    }
    if (dfd == -1) {
     //多次尝试创建文件失败
        redisLog(REDIS_WARNING,"Opening the temp file needed for MASTER <-> SLAVE synchronization: %s",strerror(errno));
        goto error;
    }
    /* Setup the non blocking download of the bulk file. */
    // 设置一个读事件处理器,来读取主服务器的 RDB 文件,这个读处理器我们在前几篇文章中讲过
    if (aeCreateFileEvent(server.el,fd, AE_READABLE,readSyncBulkPayload,NULL)
            == AE_ERR)
    {
        redisLog(REDIS_WARNING,
            "Can't create readable event for SYNC: %s (fd=%d)",
            strerror(errno),fd);
        goto error;
    }
    // 设置状态
    server.repl_state = REDIS_REPL_TRANSFER; //开始接收RDB
    // 更新统计信息
    server.repl_transfer_size = -1; //RDB文件大小
    server.repl_transfer_read = 0; //已读字节数
    server.repl_transfer_last_fsync_off = 0; //fsync偏移
    server.repl_transfer_fd = dfd; //临时RDB文件的描述符
    server.repl_transfer_lastio = server.unixtime; //最近一次读入RDB内容的时间 这里不清楚为什么更新
    server.repl_transfer_tmpfile = zstrdup(tmpfile); //保存临时文件名
    return;
error:
    close(fd);
    server.repl_transfer_s = -1; //清空主服务器套接字
    server.repl_state = REDIS_REPL_CONNECT; //回退状态到连接时,重新执行以上函数
    return;
}
```

我们可以简单把`syncWithMaster`分为两个阶段来看,因为这个函数最少会被执行两次,它们的间隔点就是`PING`的执行

主要有以下几个步骤:

**1、** 因为是非阻塞套接字所以检查套接字是否正确.；

**2、** 执行PING,检查读写状态是否正常,如果超时或者读错误的话,就会断开并重新连接.返回值有三种情况.；

**3、** 进行身份验证默认未配置(requirepass选项),有四种情况,一端设置而另一端未设置的话,就会失败.；

**4、** 将从服务器的端口发送给主服务器.；

**5、** 通过从服务器缓存和主服务器复制积压缓冲区判断进行部分重同步还是完整重同步.；

**6、** 得到主服务器节点回复后如果是部分重同步直接退出,等待接收命令.如果是完整重同步需要初始化一些信息,比如打开临时文件,设置读处理器,更改一些配置信息等.；

**值得注意的是除了第一步和第二步以外其它都是同步进行的**.接下来我们来看看`slaveTryPartialResynchronization`和`readSyncBulkPayload`.

**1、**`slaveTryPartialResynchronization`做的事情是根据本端是否有缓存决定向主服务器请求部分重同步还是完整重同步,如果是部分重同步的话主服务器会根据从服务器的offset是否还存在在复制积压缓冲区(默认1M,可改)中来判断执行哪一个.函数返回值为执行的策略.；

**2、**`readSyncBulkPayload`是一个回调,用于接收RDB文件.；

##### slaveTryPartialResynchronization

```java
#define PSYNC_CONTINUE 0
#define PSYNC_FULLRESYNC 1
#define PSYNC_NOT_SUPPORTED 2
int slaveTryPartialResynchronization(int fd) {
    char *psync_runid;
    char psync_offset[32];
    sds reply;
    /* Initially set repl_master_initial_offset to -1 to mark the current
     * master run_id and offset as not valid. Later if we'll be able to do
     * a FULL resync using the PSYNC command we'll set the offset at the
     * right value, so that this information will be propagated to the
     * client structure representing the master into server.master. */
    server.repl_master_initial_offset = -1;
    if (server.cached_master) {
      //cached_master很重要 下面说
        // 缓存存在，尝试部分重同步
        // 命令为 [PSYNC <master_run_id> <repl_offset>]
        psync_runid = server.cached_master->replrunid;
        snprintf(psync_offset,sizeof(psync_offset),"%lld", server.cached_master->reploff+1);
        redisLog(REDIS_NOTICE,"Trying a partial resynchronization (request %s:%s).", psync_runid, psync_offset);
    } else {
        // 缓存不存在
        // 发送 [PSYNC ? -1] ，要求完整重同步
        redisLog(REDIS_NOTICE,"Partial resynchronization not possible (no cached master)");
        psync_runid = "?";
        memcpy(psync_offset,"-1",3);
    }
    /* Issue the PSYNC command */
    // 向主服务器发送 PSYNC 命令
    // reply为从主服务器的回复
    reply = sendSynchronousCommand(fd,"PSYNC",psync_runid,psync_offset,NULL);
    // 接收到 FULLRESYNC ，进行 full-resync
    // 回复格式为 [+FULLRESYNC <master_run_id> <offset>]
    // offset作为初始偏移量 同时记录runid
    if (!strncmp(reply,"+FULLRESYNC",11)) {
        char *runid = NULL, *offset = NULL;
        /* FULL RESYNC, parse the reply in order to extract the run id
         * and the replication offset. */
        // 分析并记录主服务器的 runid与offset
        runid = strchr(reply,' ');
        if (runid) {
            runid++;
            offset = strchr(runid,' ');
            if (offset) offset++;
        }
        // 检查 run id 的合法性      runid长度为40个字节 用offset指针减去runid指针即可得出长度
        if (!runid || !offset || (offset-runid-1) != REDIS_RUN_ID_SIZE) {
            redisLog(REDIS_WARNING,
                "Master replied with wrong +FULLRESYNC syntax.");
            /* This is an unexpected condition, actually the +FULLRESYNC
             * reply means that the master supports PSYNC, but the reply
             * format seems wrong. To stay safe we blank the master
             * runid to make sure next PSYNCs will fail. */
            // 主服务器支持 PSYNC ，但是却发来了异常的 run id
            // 只好将 run id 设为 0 ，让下次 PSYNC 时失败
            memset(server.repl_master_runid,0,REDIS_RUN_ID_SIZE+1);
        } else {
            // 保存 run id
            memcpy(server.repl_master_runid, runid, offset-runid-1);
            server.repl_master_runid[REDIS_RUN_ID_SIZE] = '\0';
            // 以及 initial offset
            server.repl_master_initial_offset = strtoll(offset,NULL,10);
            // 打印日志，这是一个 FULL resync
            redisLog(REDIS_NOTICE,"Full resync from master: %s:%lld",
                server.repl_master_runid,
                server.repl_master_initial_offset);
        }
        /* We are going to full resync, discard the cached master structure. */
        // 要开始完整重同步，缓存中的 master 已经没用了，清除它
        replicationDiscardCachedMaster();
        sdsfree(reply);
        // 返回状态
        return PSYNC_FULLRESYNC;
    }
    // 接收到 CONTINUE ，进行 partial resync
    if (!strncmp(reply,"+CONTINUE",9)) {
        /* Partial resync was accepted, set the replication state accordingly */
        redisLog(REDIS_NOTICE,
            "Successful partial resynchronization with master.");
        sdsfree(reply);
        // 将缓存中的 master 设为当前 master,master 断开之前遗留下来的数据可以继续使用 主要是redisClient结构内的数据
        replicationResurrectCachedMaster(fd);
        // 返回状态
        return PSYNC_CONTINUE;
    }
    /* If we reach this point we receied either an error since the master does
     * not understand PSYNC, or an unexpected reply from the master.
     * Return PSYNC_NOT_SUPPORTED to the caller in both cases. */
    // 接收到错误
    if (strncmp(reply,"-ERR",4)) {
        /* If it's not an error, log the unexpected event. */
        redisLog(REDIS_WARNING,
            "Unexpected reply to PSYNC from master: %s", reply);
    } else {
        redisLog(REDIS_NOTICE,
            "Master does not support PSYNC or is in "
            "error state (reply: %s)", reply);
    }
    sdsfree(reply);
    replicationDiscardCachedMaster(); //清空master缓存
    // 主服务器不支持 PSYNC
    return PSYNC_NOT_SUPPORTED;
}
```

上面我们提到了`cached_master`,这个参数可以说是是否进行部分重同步的关键,其实也可以想到,上次丢失的已持久化的数据还在,如何知道上次连接的主服务器是什么呢?slave需要一个cache来在master断线时将master保存到cache上,这就是`cached_master`.设置`cached_master`的函数是`freeclient`,其中会调用`replicationCacheMaster`进行设置.还有两个和cached_master相关的函数

**1、**`replicationResurrectCachedMaster`在PSYNC成功时将缓存中的master提取出来.；

**2、**`replicationDiscardCachedMaster`确认清空整个master,不对它进行缓存.；

这里其实还有一个问题,在源码中可以看出其实部分重同步只是解决**断线重连**,而不是**断电重连**,这其实是两种情况,就是前者是redis没有崩,后者服务器直接宕机了.原因是它在判断部分重同步的时候需要查看`cached_master`,而这个的设置需要master存在才能设置,而master在初始化redis服务器的时候是设置为NULL的(redis.c initServerConfig()).也就是说重新启动以后只会执行完整重同步.只有在master已经被设置也就是此服务器运行期间已经做过一次从服务器才有可能进行部分重同步.这一点需要注意.

##### readSyncBulkPayload

```java
// 事件循环中调用的读处理器
#define REPL_MAX_WRITTEN_BEFORE_FSYNC (1024*1024*8) /* 8 MB */
void readSyncBulkPayload(aeEventLoop *el, int fd, void *privdata, int mask) {
    char buf[4096]; 
    ssize_t nread, readlen;
    off_t left;
    REDIS_NOTUSED(el);
    REDIS_NOTUSED(privdata);
    REDIS_NOTUSED(mask);
    /* If repl_transfer_size == -1 we still have to read the bulk length
     * from the master reply. */
    // 读取 RDB 文件的大小
    if (server.repl_transfer_size == -1) {
        // 调用读函数 读取1024个字节
        if (syncReadLine(fd,buf,1024,server.repl_syncio_timeout*1000) == -1) {
            redisLog(REDIS_WARNING,
                "I/O error reading bulk count from MASTER: %s",
                strerror(errno));
            goto error;
        }
        // 出错？
        if (buf[0] == '-') {
            redisLog(REDIS_WARNING,
                "MASTER aborted replication with an error: %s",
                buf+1);
            goto error;
        } else if (buf[0] == '\0') {
            /* At this stage just a newline works as a PING in order to take
             * the connection live. So we refresh our last interaction
             * timestamp. */
            // 只接到了一个作用和 PING 一样的 '\0'
            // 更新最后互动时间
            server.repl_transfer_lastio = server.unixtime;
            return;
        } else if (buf[0] != '$') {
            // 读入的内容出错，和协议格式不符
            redisLog(REDIS_WARNING,"Bad protocol from MASTER, the first byte is not '$' (we received '%s'), are you sure the host and port are right?", buf);
            goto error;
        }
        // 分析 RDB 文件大小
        // long int strtol(const char* str, char** endptr,int base);
        // str 为要转换的字符串,endstr为第一个不能转换的字符的指针,base为字符串str所采用的进制。
        server.repl_transfer_size = strtol(buf+1,NULL,10);
        redisLog(REDIS_NOTICE,
            "MASTER <-> SLAVE sync: receiving %lld bytes from master",
            (long long) server.repl_transfer_size);
        return;
    }
    /* Read bulk data */
    // 读数据
    // 还有多少字节未读
    left = server.repl_transfer_size - server.repl_transfer_read;
    // 最大读取值 最大为(signed)sizeof(buf) 显然数据大了以后这个值是不够的 
    // 这里我觉得是有可改的余地的,
    // 1.首先这里的静态buffer是有问题的,当超过以后根本没办法处理
    // 解决方案是动态缓冲区+多次读取 缓冲区的写法可参见muduo中的实现
    // 2.其次这里把数据从内核态拿到用户态,什么也没有做又放到文件中,不如直接零拷贝来的方便
    readlen = (left < (signed)sizeof(buf)) ? left : (signed)sizeof(buf);
    // 读取
    nread = read(fd,buf,readlen);
    if (nread <= 0) {
        redisLog(REDIS_WARNING,"I/O error trying to sync with MASTER: %s",
            (nread == -1) ? strerror(errno) : "connection lost");
        replicationAbortSyncTransfer();
        return;
    }
    // 更新最后 RDB 产生的 IO 时间
    server.repl_transfer_lastio = server.unixtime;
    if (write(server.repl_transfer_fd,buf,nread) != nread) {
        redisLog(REDIS_WARNING,"Write error or short write writing to the DB dump file needed for MASTER <-> SLAVE synchronization: %s", strerror(errno));
        goto error;
    }
    // 加上刚读取好的字节数
    server.repl_transfer_read += nread;
    /* Sync data on disk from time to time, otherwise at the end of the transfer
     * we may suffer a big delay as the memory buffers are copied into the
     * actual disk. */
    // 定期将读入的文件 fsync 到磁盘,以免 buffer 太多,一下子写入时撑爆 IO
    // 这里就是判断现在的值和上次刷入磁盘之间数据是否超过8MB
    if (server.repl_transfer_read >=                        //8MB
        server.repl_transfer_last_fsync_off + REPL_MAX_WRITTEN_BEFORE_FSYNC)
    {
        off_t sync_size = server.repl_transfer_read -
                          server.repl_transfer_last_fsync_off;
        //内部调用sync_file_range,相比于fsync使得累计数据一次刷入磁盘效率更高
        rdb_fsync_range(server.repl_transfer_fd,
            server.repl_transfer_last_fsync_off, sync_size);
        server.repl_transfer_last_fsync_off += sync_size;
    }
    /* Check if the transfer is now complete */
    // 检查 RDB 是否已经传送完毕
    if (server.repl_transfer_read == server.repl_transfer_size) {
        // 完毕,将临时文件改名为 dump.rdb
        if (rename(server.repl_transfer_tmpfile,server.rdb_filename) == -1) {
            redisLog(REDIS_WARNING,"Failed trying to rename the temp DB into dump.rdb in MASTER <-> SLAVE synchronization: %s", strerror(errno));
            replicationAbortSyncTransfer();
            return;
        }
        // 先清空旧数据库
        redisLog(REDIS_NOTICE, "MASTER <-> SLAVE sync: Flushing old data");
        signalFlushedDb(-1); //这个操作没太看懂是干什么,
        emptyDb(replicationEmptyDbCallback); //清空所有数据库中的键值对
        /* Before loading the DB into memory we need to delete the readable
         * handler, otherwise it will get called recursively since
         * rdbLoad() will call the event loop to process events from time to
         * time for non blocking loading. */
        // 先删除主服务器的读事件监听，因为 rdbLoad() 函数也会监听读事件
        aeDeleteFileEvent(server.el,server.repl_transfer_s,AE_READABLE);
        // 载入RDB
        if (rdbLoad(server.rdb_filename) != REDIS_OK) {
            redisLog(REDIS_WARNING,"Failed trying to load the MASTER synchronization DB from disk");
            replicationAbortSyncTransfer();
            return;
        }
        /* Final setup of the connected slave <- master link */
        // 关闭临时文件
        zfree(server.repl_transfer_tmpfile);
        close(server.repl_transfer_fd);
        // 将主服务器设置成一个 redis client
        // 注意createClient会为主服务器绑定事件,为接下来接收命令做好准备,其中当然也指定了读处理器,也就是说RDB接收完毕
        server.master = createClient(server.repl_transfer_s);
        // 标记这个客户端为主服务器
        server.master->flags |= REDIS_MASTER;
        // 标记它为已验证身份
        server.master->authenticated = 1;
        // 更新复制状态
        server.repl_state = REDIS_REPL_CONNECTED;
        // 设置主服务器的复制偏移量
        server.master->reploff = server.repl_master_initial_offset;
        // 保存主服务器的 RUN ID
        memcpy(server.master->replrunid, server.repl_master_runid,
            sizeof(server.repl_master_runid));
        /* If master offset is set to -1, this master is old and is not
         * PSYNC capable, so we flag it accordingly. */
        // 如果 offset 被设置为 -1 ，那么表示主服务器的版本低于 2.8 
        // 无法使用 PSYNC ，所以需要设置相应的标识值
        if (server.master->reploff == -1)
            server.master->flags |= REDIS_PRE_PSYNC;
        redisLog(REDIS_NOTICE, "MASTER <-> SLAVE sync: Finished with success");
        /* Restart the AOF subsystem now that we finished the sync. This
         * will trigger an AOF rewrite, and when done will start appending
         * to the new file. */
        // 如果有开启 AOF 持久化，那么重启 AOF 功能，并强制生成新数据库的 AOF 文件
        if (server.aof_state != REDIS_AOF_OFF) {
            int retry = 10;
            // 关闭
            stopAppendOnly();
            // 再重启
            while (retry-- && startAppendOnly() == REDIS_ERR) {
                redisLog(REDIS_WARNING,"Failed enabling the AOF after successful master synchronization! Trying it again in one second.");
                sleep(1);
            }
            if (!retry) {
                redisLog(REDIS_WARNING,"FATAL: this slave instance finished the synchronization with its master, but the AOF can't be turned on. Exiting now.");
                exit(1);
            }
        }
    }
    //如果没读完,或者大于静态缓冲区的大小好像也没什么额外操作了
    return;
error:
    replicationAbortSyncTransfer(); //删除所有使用的资源 并更新状态
    return;
}
```

在`readSyncBulkPayload`函数中其实有些地方我个人认为是有修改余地的.注释中已经提到了,这里再说说

**1、** 读取RDB文件的buffer为静态buffer,而且很小,可能是为了节省内存.且在数据大于buffer大小以后选择"鸵鸟算法",这一点是可以修改的,策略为封装一个动态buffer,多次读取,动态扩容,且不浪费内存.然后再设置一个高水位线,RDB文件大于某个值以后断开连接即可.；

**2、** 从主服务器第二次接收消息时什么也没干又写回文件了,零拷贝它不香吗?；
