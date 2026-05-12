# 11、Redis 源码解析 - Redis 过期策略
- 来源：https://ddkk.com/zhuanlan/db/redis/6/11.html
- 分类：缓存数据库
- 分组：教程目录
### 过期策略

先看一下redisDb的结构：

```java
typedef struct redisDb {
    dict *dict;                 /* The keyspace for this DB */
    dict *expires;              /* Timeout of keys with a timeout set */
    dict *blocking_keys;        /* Keys with clients waiting for data (BLPOP)*/
    dict *ready_keys;           /* Blocked keys that received a PUSH */
    dict *watched_keys;         /* WATCHED keys for MULTI/EXEC CAS */
    int id;                     /* Database ID */
    long long avg_ttl;          /* Average TTL, just for stats */
    list *defrag_later;         /* List of key names to attempt to defrag one by one, gradually. */
} redisDb;
```

第一个字段dict在[Redis 源码解析 - Redis 单机数据库一](/zhuanlan/db/redis/6/10.html)中详细介绍过了，这节看第二个字段expires，如果用户存储KV对时设置了Key的过期时间，就会向expires中添加一组KV，其中value存储的就是该key的过期时间。

#### 过期时间设置

SETEX、PSETEX可以给字符串设置value的时候带上过期时间，PEXPIREAT、EXPIREAT可以单独给某个key设置过期时间，TTL命令查询某个key的过期时间。

与过期时间相关的实现都在expire.c中

```java
// 设置key的过期时间
void setExpire(client *c, redisDb *db, robj *key, long long when) {
    dictEntry *kde, *de;
    /* Reuse the sds from the main dict in the expire dict */
    kde = dictFind(db->dict,key->ptr);
    serverAssertWithInfo(NULL,key,kde != NULL);
    // 重写key的过期时间
    de = dictAddOrFind(db->expires,dictGetKey(kde));
    dictSetSignedIntegerVal(de,when);
	...
}
// 与set命令有关的过期时间设置
void setGenericCommand(client *c, int flags, robj *key, robj *val, robj *expire, int unit, robj *ok_reply, robj *abort_reply) {
    long long milliseconds = 0; /* initialized to avoid any harmness warning */
    if (expire) {
        if (getLongLongFromObjectOrReply(c, expire, &milliseconds, NULL) != C_OK)
            return;
        if (milliseconds <= 0) {
            addReplyErrorFormat(c,"invalid expire time in %s",c->cmd->name);
            return;
        }
        if (unit == UNIT_SECONDS) milliseconds *= 1000;
    }
	...
	// 设置过期时间
    if (expire) setExpire(c,c->db,key,mstime()+milliseconds);
    ...
    addReply(c, ok_reply ? ok_reply : shared.ok);
}
// 直接设置key的过期时间
void expireGenericCommand(client *c, long long basetime, int unit) {
    robj *key = c->argv[1], *param = c->argv[2];
    long long when; /* unix time in milliseconds when the key will expire. */
    if (getLongLongFromObjectOrReply(c, param, &when, NULL) != C_OK)
        return;
    if (unit == UNIT_SECONDS) when *= 1000;
    when += basetime;
    /* No key, return zero. */
    // key不存在或者已经过期
    if (lookupKeyWrite(c->db,key) == NULL) {
        addReply(c,shared.czero);
        return;
    }
	// 检查要设置的过期时间是否是一个过去的时间
    if (checkAlreadyExpired(when)) {
    	// 如果是过去时间，直接删除key
        robj *aux;
        int deleted = server.lazyfree_lazy_expire ? dbAsyncDelete(c->db,key) :
                                                    dbSyncDelete(c->db,key);
        serverAssertWithInfo(c,key,deleted);
        server.dirty++;
        /* Replicate/AOF this as an explicit DEL or UNLINK. */
        aux = server.lazyfree_lazy_expire ? shared.unlink : shared.del;
        rewriteClientCommandVector(c,2,aux,key);
        signalModifiedKey(c->db,key);
        notifyKeyspaceEvent(NOTIFY_GENERIC,"del",key,c->db->id);
        addReply(c, shared.cone);
        return;
    } else {
    	// 向expire中插入过期时间
        setExpire(c,c->db,key,when);
        addReply(c,shared.cone);
        signalModifiedKey(c->db,key);
        notifyKeyspaceEvent(NOTIFY_GENERIC,"expire",key,c->db->id);
        server.dirty++;
        return;
    }
}
```

#### 过期健的清理

当key被设置了过期时间之后，时间到达之后，key是如何被删除的呢，主要在三个时机清理：

**1、** 用户操作key的时候，一般都会先向DB中查询这个key是否存在，在这个过程中会向expire中查询这个key是否过期，如果过期了，就删除；

```java
robj *lookupKeyWrite(redisDb *db, robj *key) {
	// 先尝试删除过期健
    expireIfNeeded(db,key);
    return lookupKey(db,key,LOOKUP_NONE);
}
int expireIfNeeded(redisDb *db, robj *key) {
	// 判断健是否过期
    if (!keyIsExpired(db,key)) return 0;
	// slave不主动删除过期key
    if (server.masterhost != NULL) return 1;
    /* Delete the key */
    // 删除key
    server.stat_expiredkeys++;
    propagateExpire(db,key,server.lazyfree_lazy_expire);
    notifyKeyspaceEvent(NOTIFY_EXPIRED,
        "expired",key,db->id);
    return server.lazyfree_lazy_expire ? dbAsyncDelete(db,key) :
                                         dbSyncDelete(db,key);
}
```

**2、** 在Redis启动的时候，会向事件循环中注册一个周期性事件serverCron，这个函数包含databasesCron；

```java
int serverCron(struct aeEventLoop *eventLoop, long long id, void *clientData) {
	...
	/* Handle background operations on Redis databases. */
    databasesCron();
    ...
}
```

databasesCron的功能之一就是定期清理过期健：

```java
void databasesCron(void) {
    /* Expire keys by random sampling. Not required for slaves
     * as master will synthesize DELs for us. */
    if (server.active_expire_enabled) {
        if (server.masterhost == NULL) {
        	// 如果是master，则尝试清理过期key
            activeExpireCycle(ACTIVE_EXPIRE_CYCLE_SLOW);
        } else {
            expireSlaveKeys();
        }
    }
    ...
}
```

**3、** Redis时间循环在陷入wait之前，会调用beforeSleep，在这个函数中也会清理过期健；

```java
void beforeSleep(struct aeEventLoop *eventLoop) {
    UNUSED(eventLoop);
	...
    /* Run a fast expire cycle (the called function will return
     * ASAP if a fast cycle is not needed). */
    if (server.active_expire_enabled && server.masterhost == NULL)
        activeExpireCycle(ACTIVE_EXPIRE_CYCLE_FAST);
    ...
}
```

#### activeExpireCycle定期清理过期健

为了避免过期健占用大量的内存，activeExpireCycle用来清理过期健，由于Redis的单线程模型，如果过期key很多，扫描一次会很耗时，这样可能会阻塞服务端，所以activeExpireCycle就不可能占用太多时间，所以Redis对于activeExpireCycle的执行时间控制就很精确了，对这个函数的要求是既要执行时间可控，又要尽可能多的清理过期健，减少内存占用。

```java
void activeExpireCycle(int type) {
	...
	if (type == ACTIVE_EXPIRE_CYCLE_FAST) {
		// ACTIVE_EXPIRE_CYCLE_FAST类型，并且上次该函数运行没有超时
        /* Don't start a fast cycle if the previous cycle did not exit
         * for time limit. Also don't repeat a fast cycle for the same period
         * as the fast cycle total duration itself. */
        if (!timelimit_exit) return;
        if (start < last_fast_cycle + ACTIVE_EXPIRE_CYCLE_FAST_DURATION*2) return;
        last_fast_cycle = start;
    }
    ...
    // 计算本次运行的时间：
    // 1、ACTIVE_EXPIRE_CYCLE_SLOW类型：在databasesCron中调用，运行时间由ACTIVE_EXPIRE_CYCLE_SLOW_TIME_PERC控制，该值是一次事件循环框架的运行时间百分比，一次事件循环框架的时间由server.hz控制，为1000000/server.hz ms
    // 2、ACTIVE_EXPIRE_CYCLE_FAST类型：在beforeSleep中调用，运行时间为ACTIVE_EXPIRE_CYCLE_FAST_DURATIONms
    timelimit = 1000000*ACTIVE_EXPIRE_CYCLE_SLOW_TIME_PERC/server.hz/100;
    timelimit_exit = 0;
    if (timelimit <= 0) timelimit = 1;
    if (type == ACTIVE_EXPIRE_CYCLE_FAST)
        timelimit = ACTIVE_EXPIRE_CYCLE_FAST_DURATION; /* in microseconds. */
    // 逐个db开始清理
    for (j = 0; j < dbs_per_call && timelimit_exit == 0; j++) {
        int expired;
        redisDb *db = server.db+(current_db % server.dbnum);
        /* Increment the DB now so we are sure if we run out of time
         * in the current DB we'll restart from the next. This allows to
         * distribute the time evenly across DBs. */
        current_db++;
        /* Continue to expire if at the end of the cycle more than 25%
         * of the keys were expired. */
        do {
        	...
        	/* If there is nothing to expire try next DB ASAP. */
        	// 计算db中需要检查清理的key个数
            if ((num = dictSize(db->expires)) == 0) {
                db->avg_ttl = 0;
                break;
            }
            slots = dictSlots(db->expires);
            now = mstime();
            /* When there are less than 1% filled slots getting random
             * keys is expensive, so stop here waiting for better times...
             * The dictionary will be resized asap. */
            if (num && slots > DICT_HT_INITIAL_SIZE &&
                (num*100/slots < 1)) break;
            ...
            while (num--) {
                dictEntry *de;
                long long ttl;
				// 选择一个随机key
                if ((de = dictGetRandomKey(db->expires)) == NULL) break;
                ttl = dictGetSignedIntegerVal(de)-now;
                // 判断key是否过期，如果过期，则删除
                if (activeExpireCycleTryExpire(db,de,now)) expired++;
                ...
                total_sampled++;
            }
            ...
        }while (expired > ACTIVE_EXPIRE_CYCLE_LOOKUPS_PER_LOOP/4);
    ...
}
```

activeExpireCycle的运行中存在诸多条件的限制，主要还是因为Redis单线程、内存服务的模型权衡。
