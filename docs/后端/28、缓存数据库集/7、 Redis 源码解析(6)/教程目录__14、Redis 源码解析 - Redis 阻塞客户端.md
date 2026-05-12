# 14、Redis 源码解析 - Redis 阻塞客户端
- 来源：https://ddkk.com/zhuanlan/db/redis/6/14.html
- 分类：缓存数据库
- 分组：教程目录
阻塞客户端的实现在block.c中

Redis的客户端在某种情况下会阻塞，阻塞类型有如下6种：

```java
#define BLOCKED_NONE 0    /* Not blocked, no CLIENT_BLOCKED flag set. */
#define BLOCKED_LIST 1    /* BLPOP & co. */
#define BLOCKED_WAIT 2    /* WAIT for synchronous replication. */
#define BLOCKED_MODULE 3  /* Blocked by a loadable module. */
#define BLOCKED_STREAM 4  /* XREAD. */
#define BLOCKED_ZSET 5    /* BZPOP et al. */
#define BLOCKED_NUM 6     /* Number of blocked states. */
```

BLOCKED_NONE：客户端没有阻塞

BLOCKED_LIST：blpop、brpop、brpoplpush等列表命令的阻塞

BLOCKED_WAIT：等待主从同步阻塞

BLOCKED_MODULE：module阻塞

BLOCKED_STREAM：xread命令阻塞

BLOCKED_ZSET：bzpop命令阻塞

### 客户端何时阻塞

**1、** 等待key中有元素时阻塞，例如blpop、brpop、brpoplpush、bzpop、xread；

```java
void blockingPopGenericCommand(client *c, int where) {
    robj *o;
    mstime_t timeout;
    int j;
	// 解析阻塞的最大时间
    if (getTimeoutFromObjectOrReply(c,c->argv[c->argc-1],&timeout,UNIT_SECONDS)
        != C_OK) return;
    for (j = 1; j < c->argc-1; j++) {
        o = lookupKeyWrite(c->db,c->argv[j]);
        if (o != NULL) {
            ...
        }
    }
    /* If we are inside a MULTI/EXEC and the list is empty the only thing
     * we can do is treating it as a timeout (even with timeout 0). */
    if (c->flags & CLIENT_MULTI) {
        addReply(c,shared.nullmultibulk);
        return;
    }
    /* If the list is empty or the key does not exists we must block */
    // key不存在或者key中没有元素，则阻塞客户端
    blockForKeys(c,BLOCKED_LIST,c->argv + 1,c->argc - 2,timeout,NULL,NULL);
}
```

**2、** 等待足够的slave复制master的key成功而阻塞，例如wait命令；

```java
void waitCommand(client *c) {
 	...
    blockClient(c,BLOCKED_WAIT);
	...
}
```

### 阻塞客户端的实现

在struct client中有两个字段与阻塞有关：阻塞类型和阻塞状态。

blockingState表示客户端的阻塞状态，保存这必要的一些阻塞信息

```java
typedef struct client {
	...
	int btype;              // 阻塞类型，即上面的5种类型
    blockingState bpop;     // 阻塞状态
    ...
}
typedef struct blockingState {
    /* Generic fields. */
    mstime_t timeout;       /* Blocking operation timeout. If UNIX current time
                             * is > timeout then the operation timed out. */
    /* BLOCKED_LIST, BLOCKED_ZSET and BLOCKED_STREAM */
    dict *keys;             /* The keys we are waiting to terminate a blocking
                             * operation such as BLPOP or XREAD. Or NULL. */
    robj *target;           /* The key that should receive the element,
                             * for BRPOPLPUSH. */
    /* BLOCK_STREAM */
    size_t xread_count;     /* XREAD COUNT option. */
    robj *xread_group;      /* XREADGROUP group name. */
    robj *xread_consumer;   /* XREADGROUP consumer name. */
    mstime_t xread_retry_time, xread_retry_ttl;
    int xread_group_noack;
    /* BLOCKED_WAIT */
    int numreplicas;        /* Number of replicas we are waiting for ACK. */
    long long reploffset;   /* Replication offset to reach. */
    /* BLOCKED_MODULE */
    void *module_blocked_handle; /* RedisModuleBlockedClient structure.
                                    which is opaque for the Redis core, only
                                    handled in module.c. */
} blockingState;
```

redisDb中dict* blocking_keys用来保存该db中所有被阻塞的客户端，这个dict的key表示被阻塞的key，value是一个list，保存这所有在该key上阻塞的客户端。

dict *ready_keys保存该db中满足唤醒被阻塞客户端的key

```java
typedef struct redisDb {
   	...
    dict *blocking_keys;        /* Keys with clients waiting for data (BLPOP)*/
    dict *ready_keys;           /* Blocked keys that received a PUSH */
    ...
} redisDb;
```

在struct Server中也有一个与阻塞有关的字段list* ready_keys，里面保存的是readyList

```java
struct redisServer {
	...
	 /* Blocked clients */
    unsigned int blocked_clients;   /* of clients executing a blocking cmd.*/
    unsigned int blocked_clients_by_type[BLOCKED_NUM];
    list *unblocked_clients; /* list of clients to unblock before next loop */
    list *ready_keys;        /* List of readyList structures for BLPOP & co */
	...
}
```

有了上面三个数据结构，下面看看具体如何实现阻塞客户端：

```java
void blockForKeys(client *c, int btype, robj **keys, int numkeys, mstime_t timeout, robj *target, streamID *ids) {
    dictEntry *de;
    list *l;
    int j;
	// 给client.bpop赋值
    c->bpop.timeout = timeout;
    c->bpop.target = target;
    if (target != NULL) incrRefCount(target);
    for (j = 0; j < numkeys; j++) {
        /* Allocate our bkinfo structure, associated to each key the client
         * is blocked for. */
        bkinfo *bki = zmalloc(sizeof(*bki));
        if (btype == BLOCKED_STREAM)
            bki->stream_id = ids[j];
        /* If the key already exists in the dictionary ignore it. */
        // 向client.bpop插入要阻塞的key
        if (dictAdd(c->bpop.keys,keys[j],bki) != DICT_OK) {
            zfree(bki);
            continue;
        }
        incrRefCount(keys[j]);
        /* And in the other "side", to map keys -> clients */
        // 向db的blocking_keys插入这个客户端
        de = dictFind(c->db->blocking_keys,keys[j]);
        if (de == NULL) {
        	// db->blocking_keys没有这个key，则新建
            int retval;
            /* For every key we take a list of clients blocked for it */
            l = listCreate();
            retval = dictAdd(c->db->blocking_keys,keys[j],l);
            incrRefCount(keys[j]);
            serverAssertWithInfo(c,keys[j],retval == DICT_OK);
        } else {
            l = dictGetVal(de);
        }
        listAddNodeTail(l,c);
        // 同时在client中也保存这个阻塞列表的地址
        bki->listnode = listLast(l);
    }
    blockClient(c,btype);
}
void blockClient(client *c, int btype) {
    c->flags |= CLIENT_BLOCKED;
    c->btype = btype;
    server.blocked_clients++;
    server.blocked_clients_by_type[btype]++;
}
```

### 被阻塞的客户端何时唤醒

**1、** 当有key被添加到redisDb中时，会调用signalKeyAsReady把对应key加入到ready_keys中：；

```java
void dbAdd(redisDb *db, robj *key, robj *val) {
    sds copy = sdsdup(key->ptr);
    int retval = dictAdd(db->dict, copy, val);
    serverAssertWithInfo(NULL,key,retval == DICT_OK);
    if (val->type == OBJ_LIST ||
        val->type == OBJ_ZSET)
        signalKeyAsReady(db, key);
    if (server.cluster_enabled) slotToKeyAdd(key);
}
void signalKeyAsReady(redisDb *db, robj *key) {
    readyList *rl;
    /* No clients blocking for this key? No need to queue it. */
    if (dictFind(db->blocking_keys,key) == NULL) return;
    /* Key was already signaled? No need to queue it again. */
    if (dictFind(db->ready_keys,key) != NULL) return;
    /* Ok, we need to queue this key into server.ready_keys. */
    rl = zmalloc(sizeof(*rl));
    rl->key = key;
    rl->db = db;
    incrRefCount(key);
    listAddNodeTail(server.ready_keys,rl);
    /* We also add the key in the db->ready_keys dictionary in order
     * to avoid adding it multiple times into a list with a simple O(1)
     * check. */
    incrRefCount(key);
    serverAssert(dictAdd(db->ready_keys,key,NULL) == DICT_OK);
}
```

在processCommand中，处理完一个用户命令之后，如果有ready_keys，就会调用handleClientsBlockedOnKeys唤醒被阻塞的客户端：

```java
void handleClientsBlockedOnKeys(void) {
	// brpoplpush命令可能使得被清空的ready_keys再次有key
	while(listLength(server.ready_keys) != 0) {
		l = server.ready_keys;
        server.ready_keys = listCreate();
        while(listLength(l) != 0) {
        	listNode *ln = listFirst(l);
            readyList *rl = ln->value;
            /* First of all remove this key from db->ready_keys so that
             * we can safely call signalKeyAsReady() against this key. */
            // 从db的ready_keys删除该key
            dictDelete(rl->db->ready_keys,rl->key);
            robj *o = lookupKeyWrite(rl->db,rl->key);
            if (o != NULL && o->type == OBJ_LIST) {
            	// 唤醒在LIST上阻塞的客户端
            	...
            	unblockClient(receiver);
            }
            else if (o != NULL && o->type == OBJ_ZSET) {
            	// 唤醒在ZSET上阻塞的客户端
            	...
            	unblockClient(receiver);
            }
            else if (o != NULL && o->type == OBJ_STREAM) {
            	// 唤醒在STREAM上阻塞的客户端
            	...
            	unblockClient(receiver);
            }
            /* Free this item. */
            decrRefCount(rl->key);
            zfree(rl);
            listDelNode(l,ln);
        }
        listRelease(l); /* We have the new list on place at this point. */
	}
}
```

被阻塞的客户端最终调用unblockClient被唤醒之后，如果该客户端之前的缓冲区还有命令要处理，那么需要接着处理，调用queueClientForReprocessing把客户端加入server.unblocked_clients中，等待处理：

```java
void unblockClient(client *c) {
    if (c->btype == BLOCKED_LIST ||
        c->btype == BLOCKED_ZSET ||
        c->btype == BLOCKED_STREAM) {
        unblockClientWaitingData(c);
    } else if (c->btype == BLOCKED_WAIT) {
        unblockClientWaitingReplicas(c);
    } else if (c->btype == BLOCKED_MODULE) {
        unblockClientFromModule(c);
    } else {
        serverPanic("Unknown btype in unblockClient().");
    }
    /* Clear the flags, and put the client in the unblocked list so that
     * we'll process new commands in its query buffer ASAP. */
    server.blocked_clients--;
    server.blocked_clients_by_type[c->btype]--;
    c->flags &= ~CLIENT_BLOCKED;
    c->btype = BLOCKED_NONE;
    queueClientForReprocessing(c);
}
void queueClientForReprocessing(client *c) {
    /* The client may already be into the unblocked list because of a previous
     * blocking operation, don't add back it into the list multiple times. */
    if (!(c->flags & CLIENT_UNBLOCKED)) {
        c->flags |= CLIENT_UNBLOCKED;
        listAddNodeTail(server.unblocked_clients,c);
    }
}
void beforeSleep(struct aeEventLoop *eventLoop) {
	...
    if (listLength(server.unblocked_clients))
        processUnblockedClients();
    ...
}
void processUnblockedClients(void) {
    listNode *ln;
    client *c;
    while (listLength(server.unblocked_clients)) {
        ln = listFirst(server.unblocked_clients);
        serverAssert(ln != NULL);
        c = ln->value;
        listDelNode(server.unblocked_clients,ln);
        c->flags &= ~CLIENT_UNBLOCKED;
        /* Process remaining data in the input buffer, unless the client
         * is blocked again. Actually processInputBuffer() checks that the
         * client is not blocked before to proceed, but things may change and
         * the code is conceptually more correct this way. */
        if (!(c->flags & CLIENT_BLOCKED)) {
            if (c->querybuf && sdslen(c->querybuf) > 0) {
            	// 继续处理客户端的输入缓冲区
                processInputBufferAndReplicate(c);
            }
        }
    }
}
```

**2、** 如果被阻塞的客户端设置了超时时间，时间到后，会自动被唤醒；

这个操作在时间循环框架的周期性函数中执行serverCron->clientsCron->clientsCronHandleTimeout:

```java
int clientsCronHandleTimeout(client *c, mstime_t now_ms) {
    time_t now = now_ms/1000;
    if (server.maxidletime &&
        !(c->flags & CLIENT_SLAVE) &&    /* no timeout for slaves and monitors */
        !(c->flags & CLIENT_MASTER) &&   /* no timeout for masters */
        !(c->flags & CLIENT_BLOCKED) &&  /* no timeout for BLPOP */
        !(c->flags & CLIENT_PUBSUB) &&   /* no timeout for Pub/Sub clients */
        (now - c->lastinteraction > server.maxidletime))
    {
        serverLog(LL_VERBOSE,"Closing idle client");
        freeClient(c);
        return 1;
    } else if (c->flags & CLIENT_BLOCKED) {
        /* Blocked OPS timeout is handled with milliseconds resolution.
         * However note that the actual resolution is limited by
         * server.hz. */
		// 客户端处于阻塞中，并且阻塞时间已到
        if (c->bpop.timeout != 0 && c->bpop.timeout < now_ms) {
            /* Handle blocking operation specific timeout. */
            // 回复客户端并唤醒客户端
            replyToBlockedClientTimedOut(c);
            unblockClient(c);
        } else if (server.cluster_enabled) {
            /* Cluster: handle unblock & redirect of clients blocked
             * into keys no longer served by this server. */
            if (clusterRedirectBlockedClientIfNeeded(c))
                unblockClient(c);
        }
    }
    return 0;
}
```

**3、** 其他客户端主动调用clientunblock命令唤醒被阻塞的客户端:；

```java
void clientCommand(client *c) {
	...
	else if (!strcasecmp(c->argv[1]->ptr,"unblock") && (c->argc == 3 ||
                                                          c->argc == 4))
    {
        /* CLIENT UNBLOCK <id> [timeout|error] */
        long long id;
        int unblock_error = 0;
        if (c->argc == 4) {
            if (!strcasecmp(c->argv[3]->ptr,"timeout")) {
                unblock_error = 0;
            } else if (!strcasecmp(c->argv[3]->ptr,"error")) {
                unblock_error = 1;
            } else {
                addReplyError(c,
                    "CLIENT UNBLOCK reason should be TIMEOUT or ERROR");
                return;
            }
        }
        if (getLongLongFromObjectOrReply(c,c->argv[2],&id,NULL)
            != C_OK) return;
        struct client *target = lookupClientByID(id);
        // 查找到被阻塞的客户端并唤醒
        if (target && target->flags & CLIENT_BLOCKED) {
            if (unblock_error)
                addReplyError(target,
                    "-UNBLOCKED client unblocked via CLIENT UNBLOCK");
            else
                replyToBlockedClientTimedOut(target);
            unblockClient(target);
            addReply(c,shared.cone);
        } else {
            addReply(c,shared.czero);
        }
    }
    ...
}
```
