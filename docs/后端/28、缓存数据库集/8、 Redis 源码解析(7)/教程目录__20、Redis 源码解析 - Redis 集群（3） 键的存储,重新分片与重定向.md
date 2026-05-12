# 20、Redis 源码解析 - Redis 集群[3] 键的存储,重新分片与重定向
- 来源：https://ddkk.com/zhuanlan/db/redis/7/20.html
- 分类：缓存数据库
- 分组：教程目录
在redis集群中使用哈希槽而不是一致性哈希来作为分布式缓存.

### 基础数据结构

在槽的操作中我们需要使用以下几个成员

```java
clusterNode *slots[16384]; //一个指针数组 表示相应下标代表的槽的负责节点的clusterNode指针
clusterNode *migrating_slots_to[16384]; //这两个结构用于重新分片
clusterNode *importing_slots_from[16384]; 
zskiplist *slots_to_keys; //一个跳跃表 存储槽的键值对信息
struct clusterNode{
	....
	unsigned char slots[16384/8]; //一个位图 表示这个节点负责的槽
	...
}
```

其中值得一提的是为什么有了slots这个指针数组还需要slots位图呢?因为在每次心跳包的传递时其中都需要带着本节点的槽信息,如果没有slots位图的话,每次我们都需要去遍历slots指针数组,相反,如果我们有的话,直接发送位图就可以了.

### 槽指派

集群刚刚建立的时候还没有分配节点,集群处于下线状态,此时我们需要为每个槽知道槽位,这个时候我们需要使用`CLUSTER ADDSLOTS  [slot ...]`命令,处理逻辑实现于`clusterCommand`.

```java
else if ((!strcasecmp(c->argv[1]->ptr,"addslots") ||
               !strcasecmp(c->argv[1]->ptr,"delslots")) && c->argc >= 3)
    {
        /* CLUSTER ADDSLOTS <slot> [slot] ... */
        // 将一个或多个 slot 添加到当前节点
        /* CLUSTER DELSLOTS <slot> [slot] ... */
        // 从当前节点中删除一个或多个 slot
        int j, slot;
        // 一个数组，记录所有要添加或者删除的槽
        unsigned char *slots = zmalloc(REDIS_CLUSTER_SLOTS);
        // 检查这是 delslots 还是 addslots 因为两个命令的处理逻辑比较类似
        int del = !strcasecmp(c->argv[1]->ptr,"delslots");
        // 将 slots 数组的所有值设置为 0
        memset(slots,0,REDIS_CLUSTER_SLOTS);
        /* Check that all the arguments are parsable and that all the
         * slots are not already busy. */
        // 处理所有输入 slot 参数
        for (j = 2; j < c->argc; j++) {
            // 获取 slot 数字
            if ((slot = getSlotOrReply(c,c->argv[j])) == -1) {
                zfree(slots);
                return;
            }
            // 如果这是 delslots 命令，并且指定槽为未指定，那么返回一个错误
            if (del && server.cluster->slots[slot] == NULL) {
                addReplyErrorFormat(c,"Slot %d is already unassigned", slot);
                zfree(slots);
                return;
            // 如果这是 addslots 命令，并且槽已经有节点在负责，那么返回一个错误
            } else if (!del && server.cluster->slots[slot]) {
                addReplyErrorFormat(c,"Slot %d is already busy", slot);
                zfree(slots);
                return;
            }
            // 如果某个槽指定了一次以上，那么返回一个错误
            if (slots[slot]++ == 1) {
                addReplyErrorFormat(c,"Slot %d specified multiple times",
                    (int)slot);
                zfree(slots);
                return;
            }
        }
        // 处理所有输入 slot
        for (j = 0; j < REDIS_CLUSTER_SLOTS; j++) {
            if (slots[j]) {
                int retval;
                /* If this slot was set as importing we can clear this 
                 * state as now we are the real owner of the slot. */
                // 如果指定 slot 之前的状态为载入状态，那么现在可以清除这一状态
                // 因为当前节点现在已经是 slot 的负责人了
                if (server.cluster->importing_slots_from[j])
                    server.cluster->importing_slots_from[j] = NULL;
                // 添加或者删除指定 slot
                retval = del ? clusterDelSlot(j) :
                               clusterAddSlot(myself,j);// 分别修改两个地方的槽信息
                redisAssertWithInfo(c,NULL,retval == REDIS_OK);
            }
        }
        zfree(slots);
        clusterDoBeforeSleep(CLUSTER_TODO_UPDATE_STATE|CLUSTER_TODO_SAVE_CONFIG); // 下次时间循环保存配置
        addReply(c,shared.ok); // 返回一个OK
    }
// 这才是实际分配的操作
int clusterAddSlot(clusterNode *n, int slot) {
    // 槽 slot 已经是节点 n 处理的了
    if (server.cluster->slots[slot]) return REDIS_ERR;
    // 设置位图
    clusterNodeSetSlotBit(n,slot);
    // 更新集群状态
    server.cluster->slots[slot] = n;
    return REDIS_OK;
}
```

这样一系列槽我们就分配给集群中的某个节点了,随着心跳包的交换,其他集群节点很快会得到这个节点的槽更新信息,具体逻辑在`clusterProcessPacket`.`clusterUpdateSlotsConfigWith`的分析我们在源码解析(19)的最后提到过,其中还会根据传入的系统纪元来对网络分区这种情况进行容错处理.

```java
        if (sender) {
            sender_master = nodeIsMaster(sender) ? sender : sender->slaveof;
            if (sender_master) {
      //dirty_slots为发送节点锁宣称的槽位于本节点的信息是否相同 不同设置为1
                dirty_slots = memcmp(sender_master->slots,
                        hdr->myslots,sizeof(hdr->myslots)) != 0;
            }
        }
        /* 1) If the sender of the message is a master, and we detected that
         *    the set of slots it claims changed, scan the slots to see if we
         *    need to update our configuration. */
        // 如果 sender 是主节点，并且 sender 的槽布局出现了变动
        // 那么检查当前节点对 sender 的槽布局设置，看是否需要进行更新
        if (sender && nodeIsMaster(sender) && dirty_slots)
            clusterUpdateSlotsConfigWith(sender,senderConfigEpoch,hdr->myslots);
```

#### 重新分片

redis集群的重新分片操作可以将某个已经指派给集群节点的槽指派给另一个集群节点,这其中伴随着数据的转移,这意味着重新分片是可以在线操作的,也就是说集群不必下线,可以在重新分配的过程中先外界提供服务.该过程是需要手动完成的,redis提供了redis-trib这个辅助软件来帮助我们执行,这个软件干的事情其实就是向接收和发送槽的两端发送一些命令而已.

具体操作步骤如下:

**1、** redis-trib向接收槽的节点发送`CLUSTERSETSLOTIMPORTING`,这个时候命令接收方就会初始化`importing_slots_from`结构,准备接收数据.；

**2、** redis-trib向发送槽的节点发送`CLUSTERSETSLOTMIGRATING`,命令接收方初始化`importing_slots_to`结构,准备发送数据.；

**3、** redis-trib向发送槽的节点发送`CLUSTERGETKEYSINSLOT`,从发送方获取count个key；

**4、** 对从槽发送方获取的每一个key都会向发送槽的节点`MIGRATE`,一次原子的转移一个键值对.；

**5、** 接收方收到`RESTORE-ASKING`命令,解析其中的值,在本端进行存储.；

**6、** 重复执行3,4步,直到发送完所有的槽数据；

**7、** redis-trib在槽转移完成以后向集群任意一个节点发送`CLUSTERSETSLOTNODE`,这样这个消息会通过心跳包传遍整个集群.；

我们从第一个步开始一步一步的解析:

##### 1. CLUSTER SETSLOT  IMPORTING

```java
else if (!strcasecmp(c->argv[1]->ptr,"setslot") && c->argc >= 4) {
        int slot;
        clusterNode *n;
        // 取出 slot 值
        if ((slot = getSlotOrReply(c,c->argv[2])) == -1) return;
        // CLUSTER SETSLOT <slot> MIGRATING <node id>
        // 将本节点的槽 slot 迁移至 node id 所指定的节点
        if (!strcasecmp(c->argv[3]->ptr,"migrating") && c->argc == 5) {
        .....................
        } else if (!strcasecmp(c->argv[3]->ptr,"importing") && c->argc == 5) {
            // 如果 slot 槽本身已经由本节点处理，那么无须进行导入
            if (server.cluster->slots[slot] == myself) {
                addReplyErrorFormat(c,
                    "I'm already the owner of hash slot %u",slot);
                return;
            }
            // node id 指定的节点必须是本节点已知的，这样才能从目标节点导入槽
            if ((n = clusterLookupNode(c->argv[4]->ptr)) == NULL) {
                addReplyErrorFormat(c,"I don't know about node %s",
                    (char*)c->argv[3]->ptr);
                return;
            }
            // 为槽设置导入目标节点 其实就是一个初始化
            server.cluster->importing_slots_from[slot] = n;
        } else if (!strcasecmp(c->argv[3]->ptr,"stable") && c->argc == 4) {
		........................
        } else if (!strcasecmp(c->argv[3]->ptr,"node") && c->argc == 5) {
		........................
        } else {
            addReplyError(c,
                "Invalid CLUSTER SETSLOT action or number of arguments");
            return;
        }
        clusterDoBeforeSleep(CLUSTER_TODO_SAVE_CONFIG|CLUSTER_TODO_UPDATE_STATE);
        addReply(c,shared.ok); // 成功回复OK
    }
```

##### 2. CLUSTER SETSLOT  MIGRATING

```java
        if (!strcasecmp(c->argv[3]->ptr,"migrating") && c->argc == 5) {
            // 被迁移的槽必须属于本节点
            if (server.cluster->slots[slot] != myself) {
                addReplyErrorFormat(c,"I'm not the owner of hash slot %u",slot);
                return;
            }
            // 迁移的目标节点必须是本节点已知的
            if ((n = clusterLookupNode(c->argv[4]->ptr)) == NULL) {
                addReplyErrorFormat(c,"I don't know about node %s",
                    (char*)c->argv[4]->ptr);
                return;
            }
            // 为槽设置迁移目标节点 和上面一样 没什么说的
            server.cluster->migrating_slots_to[slot] = n;
        }
```

##### 3. CLUSTER GETKEYSINSLOT

```java
// 只是发送key而已 最大发送数为为参数中的count
else if (!strcasecmp(c->argv[1]->ptr,"getkeysinslot") && c->argc == 4) {
        /* CLUSTER GETKEYSINSLOT <slot> <count> */
        // 准备发送 count 个属于 slot 槽的键
        long long maxkeys, slot;
        unsigned int numkeys, j;
        robj **keys;
        // 取出slot参数
        if (getLongLongFromObjectOrReply(c,c->argv[2],&slot,NULL) != REDIS_OK)
            return;
        // 取出count参数,放到maxkeys中
        if (getLongLongFromObjectOrReply(c,c->argv[3],&maxkeys,NULL)
            != REDIS_OK)
            return;
        // 检查参数的合法性          16384
        if (slot < 0 || slot >= REDIS_CLUSTER_SLOTS || maxkeys < 0) {
            addReplyError(c,"Invalid slot or number of keys");
            return;
        }
        // 分配一个保存键的数组
        keys = zmalloc(sizeof(robj*)*maxkeys);
        // 将键记录到keys数组 从跳跃表中取一个区间
        numkeys = getKeysInSlot(slot, keys, maxkeys);
        // 将获得的键加入备用缓冲区 准备发往客户端,可能固定缓冲区太小
        addReplyMultiBulkLen(c,numkeys);
        for (j = 0; j < numkeys; j++) addReplyBulk(c,keys[j]);
        zfree(keys);
    }
```

##### 4. MIGRATE

redis-trib会向迁出节点发送该命令,用于将上一步获取到的某个`key`迁出到目标节点的`target_database`数据库中,迁出过程的超时时间为`timeout`,一旦超时,则回复客户端错误信息.其实这个命令不一定要在集群中使用,也可以在一般数据库中使用,对于redis-trib来说.那两个节点不就是两个普通节点嘛.

MIGRATE标准命令的格式为:`MIGRATE      [COPY |REPLACE]`,如果最后一个参数是REPLACE，则发送成功之后,还要在当前实例中删除该key,如果是COPY,则无需删除key.默认参数就是REPLACE.

具体的实现在`migrateCommand`中.

```java
void migrateCommand(redisClient *c) {
    int fd, copy, replace, j;
    long timeout;
    long dbid;
    long long ttl, expireat;
    robj *o;
    rio cmd, payload;
    int retry_num = 0;
try_again:
    /* Initialization */
    copy = 0;
    replace = 0;
    ttl = 0;
    /* Parse additional options */
    // 读入 COPY 或者 REPLACE 选项
    for (j = 6; j < c->argc; j++) {
        if (!strcasecmp(c->argv[j]->ptr,"copy")) {
            copy = 1;
        } else if (!strcasecmp(c->argv[j]->ptr,"replace")) {
            replace = 1;
        } else {
            addReply(c,shared.syntaxerr); // 返回错误信息
            return;
        }
    }
    /* Sanity check */
    // 检查输入参数的正确性
    if (getLongFromObjectOrReply(c,c->argv[5],&timeout,NULL) != REDIS_OK)
        return;
    if (getLongFromObjectOrReply(c,c->argv[4],&dbid,NULL) != REDIS_OK)
        return;
    if (timeout <= 0) timeout = 1000;
    /* Check if the key is here. If not we reply with success as there is
     * nothing to migrate (for instance the key expired in the meantime), but
     * we include such information in the reply string. */
    // 取出键的值对象
    // MIGRATE <target_host> <target_port> <key> <target_database> <timeout>  [COPY |REPLACE]
    // argv[3]为key
    if ((o = lookupKeyRead(c->db,c->argv[3])) == NULL) {
        addReplySds(c,sdsnew("+NOKEY\r\n"));
        return;
    }
    /* Connect */
    // 获取套接字连接 这里涉及到一个缓存套接字的问题 我们说完MIGRATE命令再说
    // 这里可以简单的理解为得到一个与发送方连接的套接字
    fd = migrateGetSocket(c,c->argv[1],c->argv[2],timeout);
    if (fd == -1) return; /* error sent to the client by migrateGetSocket() */
    /* Create RESTORE payload and generate the protocol to call the command. */
    // 创建用于指定数据库的 SELECT 命令，以免键值对被还原到了错误的地方
    rioInitWithBuffer(&cmd,sdsempty());
    redisAssertWithInfo(c,NULL,rioWriteBulkCount(&cmd,'*',2));
    redisAssertWithInfo(c,NULL,rioWriteBulkString(&cmd,"SELECT",6));
    redisAssertWithInfo(c,NULL,rioWriteBulkLongLong(&cmd,dbid));
    // 取出键的过期时间戳
    expireat = getExpire(c->db,c->argv[3]);
    if (expireat != -1) {
        ttl = expireat-mstime();
        if (ttl < 1) ttl = 1;
    }
    redisAssertWithInfo(c,NULL,rioWriteBulkCount(&cmd,'*',replace ? 5 : 4));
    // 如果运行在集群模式下，那么发送的命令为 RESTORE-ASKING
    // 如果运行在非集群模式下，那么发送的命令为 RESTORE
    if (server.cluster_enabled)
        redisAssertWithInfo(c,NULL,
            rioWriteBulkString(&cmd,"RESTORE-ASKING",14));
    else
        redisAssertWithInfo(c,NULL,rioWriteBulkString(&cmd,"RESTORE",7));
    // 写入键名和过期时间
    redisAssertWithInfo(c,NULL,sdsEncodedObject(c->argv[3]));
    redisAssertWithInfo(c,NULL,rioWriteBulkString(&cmd,c->argv[3]->ptr,
            sdslen(c->argv[3]->ptr)));
    redisAssertWithInfo(c,NULL,rioWriteBulkLongLong(&cmd,ttl));
    /* Emit the payload argument, that is the serialized object using
     * the DUMP format. */
    // 将值对象进行序列化为RDB格式 因为比起AOF更简短,载入更快
    createDumpPayload(&payload,o);
    // 写入序列化对象
    redisAssertWithInfo(c,NULL,rioWriteBulkString(&cmd,payload.io.buffer.ptr,
                                sdslen(payload.io.buffer.ptr)));
    sdsfree(payload.io.buffer.ptr);
    /* Add the REPLACE option to the RESTORE command if it was specified
     * as a MIGRATE option. */
    // 是否设置了 REPLACE 命令？
    if (replace)
        // 写入 REPLACE 参数
        redisAssertWithInfo(c,NULL,rioWriteBulkString(&cmd,"REPLACE",7));
    /* Transfer the query to the other node in 64K chunks. */
    // 以 64 kb 每次的大小向对方发送数据 注意这里是同步的
    errno = 0;
    {
        sds buf = cmd.io.buffer.ptr;
        size_t pos = 0, towrite;
        int nwritten = 0;
        while ((towrite = sdslen(buf)-pos) > 0) {
            towrite = (towrite > (64*1024) ? (64*1024) : towrite);
            nwritten = syncWrite(fd,buf+pos,towrite,timeout);
            if (nwritten != (signed)towrite) goto socket_wr_err;
            pos += nwritten;
        }
    }
    /* Read back the reply. */
    // 读取命令的回复
    {
        char buf1[1024];
        char buf2[1024];
        /* Read the two replies */
        if (syncReadLine(fd, buf1, sizeof(buf1), timeout) <= 0)
            goto socket_rd_err;
        if (syncReadLine(fd, buf2, sizeof(buf2), timeout) <= 0)
            goto socket_rd_err;
        // 检查 RESTORE 命令执行是否成功
        if (buf1[0] == '-' || buf2[0] == '-') {
            // 执行出错
            addReplyErrorFormat(c,"Target instance replied with error: %s",
                (buf1[0] == '-') ? buf1+1 : buf2+1);
        } else {
            // 执行成功
            robj *aux;
            // 如果没有指定 COPY 选项，那么删除本机数据库中的键
            if (!copy) {
                /* No COPY option: remove the local key, signal the change. */
                dbDelete(c->db,c->argv[3]);
                signalModifiedKey(c->db,c->argv[3]); // 事务相关
            }
            addReply(c,shared.ok); // 返回OK
            server.dirty++; // 自从上次SAVE执行以来,数据库被修改的次数增加
            /* Translate MIGRATE as DEL for replication/AOF. */
            // 向 AOF 文件和从服务器/节点发送一个 DEL 命令
            aux = createStringObject("DEL",3);
            // 就是修改cmd,这里就是向redis-trib返回信息 因为c就是redis-trib
            rewriteClientCommandVector(c,2,aux,c->argv[3]); 
            decrRefCount(aux);
        }
    }
    sdsfree(cmd.io.buffer.ptr);
    return;
socket_wr_err:
    sdsfree(cmd.io.buffer.ptr);
    migrateCloseSocket(c->argv[1],c->argv[2]); // 关闭缓存
    if (errno != ETIMEDOUT && retry_num++ == 0) goto try_again;
    addReplySds(c,
        sdsnew("-IOERR error or timeout writing to target instance\r\n"));
    return;
socket_rd_err:
    sdsfree(cmd.io.buffer.ptr);
    migrateCloseSocket(c->argv[1],c->argv[2]);
    if (errno != ETIMEDOUT && retry_num++ == 0) goto try_again;
    addReplySds(c,
        sdsnew("-IOERR error or timeout reading from target node\r\n"));
    return;
}
```

我们上面提到了缓存套接字,这其实是重新分片中的一个策略,就是不必每次传送键值对都进行连接,那太浪费了.所以在第一次连接以后,后面的键值对都可以使用前面的TCP连接,这样就起到了缓存的作用,缓存套接字以一个字典存储,键为`:`格式,值为`struct migrateCachedSocket`结构,

```java
typedef struct migrateCachedSocket {
    // 套接字描述符
    int fd;
    // 最后一次使用的时间
    time_t last_use_time;
} migrateCachedSocket;
```

```java
// 用如下函数检测目标是否存在缓冲 不存在的话创建一个
int migrateGetSocket(redisClient *c, robj *host, robj *port, long timeout) {
    int fd;
    sds name = sdsempty();
    migrateCachedSocket *cs;
    /* Check if we have an already cached socket for this ip:port pair. */
    // 根据 ip 和 port 创建地址名字
    name = sdscatlen(name,host->ptr,sdslen(host->ptr));
    name = sdscatlen(name,":",1);
    name = sdscatlen(name,port->ptr,sdslen(port->ptr));
    // 在套接字缓存中查找套接字是否已经存在
    cs = dictFetchValue(server.migrate_cached_sockets,name);
    // 缓存存在，更新最后一次使用时间，以免它被当作过期套接字而被释放
    if (cs) {
        sdsfree(name);
        cs->last_use_time = server.unixtime;
        return cs->fd;
    }
    /* No cached socket, create one. */
    // 没有缓存，创建一个新的缓存
    if (dictSize(server.migrate_cached_sockets) == MIGRATE_SOCKET_CACHE_ITEMS) {
        // 如果缓存数已经达到上线，那么在创建套接字之前，先随机删除一个连接
        /* Too many items, drop one at random. */
        dictEntry *de = dictGetRandomKey(server.migrate_cached_sockets);
        cs = dictGetVal(de);
        close(cs->fd);
        zfree(cs);
        dictDelete(server.migrate_cached_sockets,dictGetKey(de));
    }
    /* Create the socket */
    // 创建连接
    fd = anetTcpNonBlockConnect(server.neterr,c->argv[1]->ptr,
                atoi(c->argv[2]->ptr));
    if (fd == -1) {
        sdsfree(name);
        addReplyErrorFormat(c,"Can't connect to target node: %s",
            server.neterr);
        return -1;
    }
    anetEnableTcpNoDelay(server.neterr,fd); // 禁用Nagle算法
    /* Check if it connects within the specified timeout. */
    // 其实就是调用poll,在timeout时间内等待连接返回 即的真正连接上对端
    if ((aeWait(fd,AE_WRITABLE,timeout) & AE_WRITABLE) == 0) {
        sdsfree(name);
        addReplySds(c,
            sdsnew("-IOERR error or timeout connecting to the client\r\n"));
        close(fd);
        return -1;
    }
    /* Add to the cache and return it to the caller. */
    // 将连接添加到缓存
    cs = zmalloc(sizeof(*cs));
    cs->fd = fd;
    cs->last_use_time = server.unixtime;
    dictAdd(server.migrate_cached_sockets,name,cs);
    return fd;
}
```

##### 5. RESTORE-ASKING

RESTORE-ASKING与RESTORE只有一点不同,就是在发送方在集群中时为RESTORE-ASKING,否则的话为RESTORE.

```java
// 序列化的格式如下
// |<-- RDB payload  -->|
// 序列化数据 标准的RDB键值对的格式
// 有超时信息的话这前面还应该有一个字节的EXPIRETIME_MS和一个八个字节的Unix时间戳
// +-------------+-----------+ 
// | 1 byte type | key/value |
// +-------------+-----------+
/* Write the footer, this is how it looks like:
 * ----------------+---------------------+---------------+
 * ... RDB payload | 2 bytes RDB version | 8 bytes CRC64 |
 * ----------------+---------------------+---------------+
 * RDB version and CRC are both in little endian.
 */
void restoreCommand(redisClient *c) {
    long long ttl;
    rio payload;
    int j, type, replace = 0;
    robj *obj;
    /* Parse additional options */
    // 是否使用了 REPLACE 选项？
    for (j = 4; j < c->argc; j++) {
        if (!strcasecmp(c->argv[j]->ptr,"replace")) {
            replace = 1;
        } else {
            addReply(c,shared.syntaxerr);
            return;
        }
    }
    /* Make sure this key does not already exist here... */
    // 如果没有给定 REPLACE 选项，并且键已经存在，那么返回错误
    if (!replace && lookupKeyWrite(c->db,c->argv[1]) != NULL) {
        addReply(c,shared.busykeyerr);
        return;
    }
    /* Check if the TTL value makes sense */
    // 取出（可能有的） TTL 值
    if (getLongLongFromObjectOrReply(c,c->argv[2],&ttl,NULL) != REDIS_OK) {
        return;
    } else if (ttl < 0) {
        addReplyError(c,"Invalid TTL value, must be >= 0");
        return;
    }
    /* Verify RDB version and data checksum. */
    // 检查 RDB 版本和校验和
    if (verifyDumpPayload(c->argv[3]->ptr,sdslen(c->argv[3]->ptr)) == REDIS_ERR)
    {
        addReplyError(c,"DUMP payload version or checksum are wrong");
        return;
    }
    // 读取 DUMP 数据，并反序列化出键值对的类型和值
    rioInitWithBuffer(&payload,c->argv[3]->ptr);
    if (((type = rdbLoadObjectType(&payload)) == -1) ||
        ((obj = rdbLoadObject(type,&payload)) == NULL))
    {
        addReplyError(c,"Bad data format");
        return;
    }
    /* Remove the old key if needed. */
    // 如果给定了 REPLACE 选项，那么先删除数据库中已存在的同名键
    if (replace) dbDelete(c->db,c->argv[1]);
    /* Create the key and set the TTL if any */
    // 将键值对添加到数据库
    dbAdd(c->db,c->argv[1],obj);
    // 如果键带有 TTL 的话，设置键的 TTL
    if (ttl) setExpire(c->db,c->argv[1],mstime()+ttl);
    signalModifiedKey(c->db,c->argv[1]);
    addReply(c,shared.ok);
    server.dirty++;
}
```

这样多次循环执行,一个槽的迁移就完成了.

##### 7. CLUSTER SETSLOT  NODE

在键都发送完毕以后,redis-trib会向集群中任意一个叫节点发送以上命令,即将槽slot指派给NODE_id.逻辑处理部分在`clusterCommand`

```java
else if (!strcasecmp(c->argv[3]->ptr,"node") && c->argc == 5) {
            /* CLUSTER SETSLOT <SLOT> NODE <NODE_ID> */
            // 在键迁移完成后广播
            // 指派 slot 给 node id 指定的节点
            // 查找目标节点
            clusterNode *n = clusterLookupNode(c->argv[4]->ptr);
            // 目标节点必须已存在
            if (!n) {
                addReplyErrorFormat(c,"Unknown node %s",
                    (char*)c->argv[4]->ptr);
                return;
            }
            /* If this hash slot was served by 'myself' before to switch
             * make sure there are no longer local keys for this hash slot. */
            // 如果这个槽之前由当前节点负责处理,那么必须保证槽里面没有键存在,
            // 证明恰好是转移槽的那个节点
            if (server.cluster->slots[slot] == myself && n != myself) {
                if (countKeysInSlot(slot) != 0) {
                    addReplyErrorFormat(c,
                        "Can't assign hashslot %d to a different node "
                        "while I still hold keys for this hash slot.", slot);
                    return;
                }
            }
            /* If this slot is in migrating status but we have no keys
             * for it assigning the slot to another node will clear
             * the migratig status. */
            /* 如果该插槽处于迁移状态，但是我们没有用于为其分配密钥的插槽
               则将该插槽分配给另一个节点将清除迁移状态*/
            if (countKeysInSlot(slot) == 0 &&
                server.cluster->migrating_slots_to[slot])
                server.cluster->migrating_slots_to[slot] = NULL;
            /* If this node was importing this slot, assigning the slot to
             * itself also clears the importing status. */
            // 撤销本节点对slot的导入计划
            if (n == myself &&  //没太看懂为什么会发生这种情况
                server.cluster->importing_slots_from[slot])
            {
                /* This slot was manually migrated, set this node configEpoch
                 * to a new epoch so that the new version can be propagated
                 * by the cluster.
                 *
                 * Note that if this ever results in a collision with another
                 * node getting the same configEpoch, for example because a
                 * failover happens at the same time we close the slot, the
                 * configEpoch collision resolution will fix it assigning
                 * a different epoch to each node. */
                // 选出当前集群中最大的纪元
                uint64_t maxEpoch = clusterGetMaxEpoch();
                if (myself->configEpoch == 0 ||
                    myself->configEpoch != maxEpoch)
                {
                    server.cluster->currentEpoch++;
                    myself->configEpoch = server.cluster->currentEpoch;
                    clusterDoBeforeSleep(CLUSTER_TODO_FSYNC_CONFIG);
                    redisLog(REDIS_WARNING,
                        "configEpoch set to %llu after importing slot %d",
                        (unsigned long long) myself->configEpoch, slot);
                }
                server.cluster->importing_slots_from[slot] = NULL;
            }
            // 将槽设置为未指派
            clusterDelSlot(slot);
            // 将槽指派给目标节点
            clusterAddSlot(n,slot);
			// 稍后这些消息将通过心跳传递给其他集群节点
        }
```

### 重定向: MOVED与ASK

因为在redis集群中16384个槽中的数据是分别存储于不同的数据库中的,而我们的客户端可以向任意节点发送请求,都可以得到回复,这就是我们平时所说的`重定向`,而这里的重定向有两种情况,即`MOVED重定向`与`ASK重定向`,

**1、** 某个集群节点收到客户端发来的命令后,会判断命令中的key是否由本节点负责,若是,则直接处理命令,若不是,则反馈给客户端MOVED重定向错误,错误中指明了该key真正的负责节点.客户端收到MOVED重定向错误之后.需要重新向真正的负责节点再次发送命令,而这个错误对于客户端来说是透明的,客户端只会把请求成功后的消息返回,并打印`Redirectedtoslot[XXX]locatedatIP:port`.；

**2、** ASK错误只是两个节点在迁移槽的过程中使用的一种临时措施:客户端收到关于槽位i的ASK错误之后,客户端只会在接下来的**一次命令**请求中将关于槽位i的命令请求发送至ASK错误所指示的节点,但在这之前会发送一个`ASKING`命令,它会打开对端中的`REDIS_ASKING`标识,这个标识在一次请求后会消耗掉.这种重定向不会对客户端今后发送关于槽位i的命令请求产生任何影响,客户端之后仍然会将关于槽位i的命令请求发送至目前负责处理该槽位的节点,除非ASK错误再次出现.；

在redis集群中实际执行命令处理函数之前,需要判断当前节点是否能处理该命令中的key,若本节点不能处理该命令，则回复给客户端重定向错误,处理逻辑在`processCommand`中.

```java
	/* If cluster is enabled perform the cluster redirection here.
     *
     * 如果开启了集群模式，那么在这里进行转向操作。
     *
     * However we don't perform the redirection if:
     *
     * 不过，如果有以下情况出现，那么节点不进行转向：
     *
     * 1) The sender of this command is our master.
     *    命令的发送者是本节点的主节点
     *
     * 2) The command has no key arguments. 
     *    命令没有 key 参数
     */
    if (server.cluster_enabled &&
        !(c->flags & REDIS_MASTER) &&
        !(c->cmd->getkeys_proc == NULL && c->cmd->firstkey == 0))
    {
        int hashslot;
        // 集群已下线
        if (server.cluster->state != REDIS_CLUSTER_OK) {
            flagTransaction(c);
            addReplySds(c,sdsnew("-CLUSTERDOWN The cluster is down. Use CLUSTER INFO for more information\r\n"));
            return REDIS_OK;
        // 集群运作正常
        } else {
            int error_code;
            clusterNode *n = getNodeByQuery(c,c->cmd,c->argv,c->argc,&hashslot,&error_code); //下面细说这个函数
            // error_code中会设置此次的查询状态
            // 不能执行多键处理命令 因为多键可能存储于不同的服务器
            if (n == NULL) {
                flagTransaction(c);
                if (error_code == REDIS_CLUSTER_REDIR_CROSS_SLOT) {
                    addReplySds(c,sdsnew("-CROSSSLOT Keys in request don't hash to the same slot\r\n"));
                } else if (error_code == REDIS_CLUSTER_REDIR_UNSTABLE) {
                    /* The request spawns mutliple keys in the same slot,
                     * but the slot is not "stable" currently as there is
                     * a migration or import in progress. */
                    addReplySds(c,sdsnew("-TRYAGAIN Multiple keys request during rehashing of slot\r\n"));
                } else {
                    redisPanic("getNodeByQuery() unknown error.");
                }
                return REDIS_OK;
            // 命令针对的槽和键不是本节点处理的，进行转向
            } else if (n != server.cluster->myself) {
                flagTransaction(c);
                // -<ASK or MOVED> <slot> <ip>:<port>
                // 例如 -ASK 10086 127.0.0.1:12345
                addReplySds(c,sdscatprintf(sdsempty(),
                    "-%s %d %s:%d\r\n",
                    (error_code == REDIS_CLUSTER_REDIR_ASK) ? "ASK" : "MOVED",
                    hashslot,n->ip,n->port));
                return REDIS_OK;
            }
            // 如果执行到这里，说明键 key 所在的槽由本节点处理
            // 或者客户端执行的是无参数命令
        }
    }
```

```java
clusterNode *getNodeByQuery(redisClient *c, struct redisCommand *cmd, robj **argv, int argc, int *hashslot, int *error_code) {
    // 初始化为 NULL ，
    // 如果输入命令是无参数命令，那么 n 就会继续为 NULL
    clusterNode *n = NULL;
    robj *firstkey = NULL;
    int multiple_keys = 0;
    multiState *ms, _ms;
    multiCmd mc;
    int i, slot = 0, migrating_slot = 0, importing_slot = 0, missing_keys = 0;
    /* Set error code optimistically for the base case. */
    if (error_code) *error_code = REDIS_CLUSTER_REDIR_NONE;
    /* We handle all the cases as if they were EXEC commands, so we have
     * a common code path for everything */
    // 集群可以执行事务，
    // 但必须确保事务中的所有命令都是针对某个相同的键进行的
    // 这个 if 和接下来的 for 进行的就是这一合法性检测
    if (cmd->proc == execCommand) {
        /* If REDIS_MULTI flag is not set EXEC is just going to return an
         * error. */
        if (!(c->flags & REDIS_MULTI)) return myself;
        ms = &c->mstate;
    } else {
        /* In order to have a single codepath create a fake Multi State
         * structure if the client is not in MULTI/EXEC state, this way
         * we have a single codepath below. */
        ms = &_ms;
        _ms.commands = &mc;
        _ms.count = 1;
        mc.argv = argv;
        mc.argc = argc;
        mc.cmd = cmd;
    }
    /* Check that all the keys are in the same hash slot, and obtain this
     * slot and the node associated. */
    for (i = 0; i < ms->count; i++) {
        struct redisCommand *mcmd;
        robj **margv;
        int margc, *keyindex, numkeys, j;
        mcmd = ms->commands[i].cmd;
        margc = ms->commands[i].argc;
        margv = ms->commands[i].argv;
        // 定位命令的键位置 也就是返回所有键和
        keyindex = getKeysFromCommand(mcmd,margv,margc,&numkeys);
        // 遍历命令中的所有键
        for (j = 0; j < numkeys; j++) {
            robj *thiskey = margv[keyindex[j]];
            int thisslot = keyHashSlot((char*)thiskey->ptr, //获取这个键的槽
                                       sdslen(thiskey->ptr));
            if (firstkey == NULL) {
                // 这是事务中第一个被处理的键
                // 获取该键的槽和负责处理该槽的节点
                /* This is the first key we see. Check what is the slot
                 * and node. */
                firstkey = thiskey;
                slot = thisslot; // 在遍历第一个键的时候给slot赋值 方便后面比较键是否在一个槽中
                n = server.cluster->slots[slot]; // 赋值n为第一个遍历键的所属节点
                redisAssertWithInfo(c,firstkey,n != NULL);
                /* If we are migrating or importing this slot, we need to check
                 * if we have all the keys in the request (the only way we
                 * can safely serve the request, otherwise we return a TRYAGAIN
                 * error). To do so we set the importing/migrating state and
                 * increment a counter for every missing key. */
                if (n == myself &&
                    server.cluster->migrating_slots_to[slot] != NULL)
                {
                    migrating_slot = 1; // 正在向其他地方迁移键
                } else if (server.cluster->importing_slots_from[slot] != NULL) {
                    importing_slot = 1; // 正在从其他地方迁移键过来
                }
            } else {
                /* If it is not the first key, make sure it is exactly
                 * the same key as the first we saw. */
                // equalStringObjects:如果两个对象的值在字符串的形式上相等,那么返回1 否则返回0
                // 即只要该key与第一个key内容不同,就比较该key所属的槽位是否相同
                if (!equalStringObjects(firstkey,thiskey)) {
                    if (slot != thisslot) {
      // 键对应槽不相同
                        /* Error: multiple keys from different slots. */
                        getKeysFreeResult(keyindex);
                        if (error_code)
                            *error_code = REDIS_CLUSTER_REDIR_CROSS_SLOT;
                        return NULL;
                    } else {
                        /* Flag this request as one with multiple different
                         * keys. */
                        multiple_keys = 1; // 标记操作涉及多个键 因为firstkey已经不为NULL了
                    }
                }
            }
            /* Migarting / Improrting slot? Count keys we don't have. */
            if ((migrating_slot || importing_slot) &&
                lookupKeyRead(&server.db[0],thiskey) == NULL) //本服务器中没有找到这个键的值
            {
                missing_keys++;
            }
        }
        getKeysFreeResult(keyindex);
    }
    /* No key at all in command? then we can serve the request
     * without redirections or errors. */
    if (n == NULL) return myself;
    /* Return the hashslot by reference. */
    if (hashslot) *hashslot = slot;
    /* This request is about a slot we are migrating into another instance?
     * Then if we have all the keys. */
    /* If we don't have all the keys and we are migrating the slot, send
     * an ASK redirection. */
    if (migrating_slot && missing_keys) {
        // 正在进行迁出槽位 返回一个ask错误
        if (error_code) *error_code = REDIS_CLUSTER_REDIR_ASK;
        return server.cluster->migrating_slots_to[slot];
    }
    /* If we are receiving the slot, and the client correctly flagged the
     * request as "ASKING", we can serve the request. However if the request
     * involves multiple keys and we don't have them all, the only option is
     * to send a TRYAGAIN error. */
    if (importing_slot && // 正在导入槽且状态被设置为ASKING 
        (c->flags & REDIS_ASKING || cmd->flags & REDIS_CMD_ASKING))
    {
        if (multiple_keys && missing_keys) {
      //请求的数据涉及多个机器 没办法处理
            if (error_code) *error_code = REDIS_CLUSTER_REDIR_UNSTABLE;
            return NULL;
        } else {
            return myself; // 否则是可以服务的
        }
    }
    /* Handle the read-only client case reading from a slave: if this
     * node is a slave and the request is about an hash slot our master
     * is serving, we can reply without redirection. */
    if (c->flags & REDIS_READONLY &&
        cmd->flags & REDIS_CMD_READONLY &&
        nodeIsSlave(myself) &&
        myself->slaveof == n) // 从服务器提供查询
    {
        return myself;
    }
    /* Base case: just return the right node. However if this node is not
     * myself, set error_code to MOVED since we need to issue a rediretion. */
    if (n != myself && error_code) *error_code = REDIS_CLUSTER_REDIR_MOVED;
    // 返回负责处理槽 slot 的节点 n
    return n;
}
```

这里我们可以看到在集群中一次请求数据涉及多个机器的时候我们没有办法处理,只会返回错误,如果请求的多个数据在同一个机器上还是可以正常运转的.且在一个`ASKING`请求中可以请求多个键值对,也就是一个`ASKING`是在**一次命令**以后销毁,这里只剩最后一个疑问,ASK和MOVED有什么区别呢?

> MOVED错误代表槽位的负责权已经从一个节点转移到了另一个节点:在客户端收到关于槽位i的MOVED错误之后,会更新槽位i及其负责节点的对应关系,这样下次遇到关于槽位i的命令请求时,就可以直接将命令请求发送新的负责节点.
> ASK错误只是两个节点在迁移槽的过程中使用的一种临时措施:客户端收到关于槽位i的ASK错误之后,客户端只会在接下来的一次命令请求中将关于槽位i的命令请求发送至ASK错误所指示的节点,但这种重定向不会对客户端今后发送关于槽位i的命令请求产生任何影响,客户端之后仍然会将关于槽位i的命令请求发送至目前负责处理该槽位的节点,除非ASK错误再次出现.
