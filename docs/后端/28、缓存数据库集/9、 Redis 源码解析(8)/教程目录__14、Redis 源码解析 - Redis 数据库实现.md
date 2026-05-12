# 14、Redis 源码解析 - Redis 数据库实现
- 来源：https://ddkk.com/zhuanlan/db/redis/8/14.html
- 分类：缓存数据库
- 分组：教程目录
### 1. 数据库命令

数据库有一些常用的管理命令.

命令
描述

FLUSHDB
清空当前数据库的所有key

FLUSHALL
清空整个Redis服务器的所有key

DBSIZE
返回当前数据库的key的个数

DEL key [key …]
删除一个或多个键

EXISTS key
检查给定key是否存在

SELECT id
切换到指定的数据库

RANDOMKEY
从当前数据库中随机返回(不删除)一个 key

KEYS pattern
查找所有符合给定模式pattern的key

SCAN cursor [MATCH pattern] [COUNT count]
增量式迭代当前数据库键

LASTSAVE
返回最近一次成功将数据保存到磁盘上的时间，以 UNIX 时间戳格式表示

TYPE key
返回指定键的对象类型

SHUTDOWN
停止所有客户端，关闭 redis 服务器（server）

RENAME key newkey
重命名指定的key，newkey存在时覆盖

RENAMENX key newkey
重命名指定的key，当且仅当newkey不存在时操作

MOVE key db
移动key到指定数据库

EXPIREAT key timestamp
为 key 设置生存时间，EXPIREAT 命令接受的时间参数是 UNIX 时间戳

EXPIRE key seconds
以秒为单位设置 key 的生存时间

PEXPIRE key milliseconds
以毫秒为单位设置 key 的生存时间

PEXPIREAT key milliseconds-timestamp
以毫秒为单位设置 key 的过期 unix 时间戳

TTL key
以秒为单位返回 key 的剩余生存时间

PTTL key
以毫秒为单位返回 key 的剩余生存时间

### 2. 数据库的实现

Redis服务器将所有数据库都保存在服务器状态`redis.h/redisServer`结构的`db`数组中，`db`数组的每个项都是一个`server.h/ redisDb`结构，每个`redisDb`结构代表一个数据库.

在初始化服务器时，程序会根据服务器状态的`dbnum`属性来决定应该创建多少个数据库.

`dbnum`属性的值由服务器配置的`database`选项决定，默认情况下，该选项的值为`16`，所以Redis服务器默认会创建16个数据库，如图：

```java
struct redisServer {
	// ...
	// 一个数组，保存着服务器中的所有数据库
	redisDb *db;
	// 创建的数据库数量
	int dbnum;
	// ...
};
```

在服务器内部，客户端状态`client`结构的`db`属性记录了客户端当前的目标数据库，这个属性是一个指向`redisDb`结构的指针：

```java
typedef struct client {
	// ...
	// 指向当前的数据库
	redisDb *db;
	// ...
}
```

`client.db`指针指向`redisServer.db`数组的其中一个元素，而被指向的元素就是客户端的目标数据库. 比如某个客户端的目标数据库为1号数据库，如下图所示：

#### 2.1 切换数据库

每个Redis客户端都有自己的目标数据库，默认情况下客户端的默认目标数据库为`0号`数据库，但是客户端可以执行`SELECT`命令来切换数据库.

该命令的实现过程很简单，只需要改变`client.db`指针向`redisServer.db`数组的元素即可：

```java
// 切换数据库
int selectDb(client *c, int id) {
    // id非法，返回错误
    if (id < 0 || id >= server.dbnum)
        return C_ERR;
    // 设置当前client的数据库
    c->db = &server.db[id];
    return C_OK;
}
```

#### 2.2 数据库键空间

Redis是一个键值对（key-value pair）数据库服务器，服务器中的每个数据库都由一个`server.h/redisDb`结构表示，其中，redisDb结构的`dict`字典保存了数据库中所有键值对，我们将这个字典称为`键空间（key space）`：

```java
typedef struct redisDb {
	// ...
	// 数据库键空间，保存着数据库中的所有键值对
	dict *dict;
	// ...
} redisDb;
```

键空间的键就是数据库的键，每个见都是一个`字符串对象`.

键空间的值就是数据库的值，每个值可以是`字符串对象`、`列表对象`、`哈希对象`、`集合对象`或者`有序集合对象`.

比如数据库中现在有列表键`alphabet`、哈希键`book`以及字符串键`message`，如下图所示：

所以所有针对数据库的CRUD操作实际上都是在对键空间字典进行操作.

数据库每次根据键名找到值对象时，是分为以`读操作 lookupKeyRead()`或`写操作 lookupKeyWrite()`的方式取出的，两种函数有一定的区别.

**lookupKey()函数**

`读操作 lookupKeyRead()`或`写操作 lookupKeyWrite()`都会调用这个底层的函数，这个函数非常简单，就是从键值对字典中先找到键名对应的键对象，然后取出值对象.

```java
// 该函数被lookupKeyRead()和lookupKeyWrite()和lookupKeyReadWithFlags()调用
// 从数据库db中取出key的值对象，如果存在返回该对象，否则返回NULL
// 返回key对象的值对象
robj *lookupKey(redisDb *db, robj *key, int flags) {
    // 在数据库中查找key对象，返回保存该key的节点地址
    dictEntry *de = dictFind(db->dict,key->ptr);
    if (de) {
    	// 如果找到
    	// 取出键对应的值对象
        robj *val = dictGetVal(de);
        // 更新键的使用时间
        if (server.rdb_child_pid == -1 &&
            server.aof_child_pid == -1 &&
            !(flags & LOOKUP_NOTOUCH))
        {
            val->lru = LRU_CLOCK();
        }
        // 返回值对象
        return val;
    } else {
        return NULL;
    }
}
```

**lookupKeyRead()函数**

`lookupKeyRead()`函数调用了`lookupKeyReadWithFlags()`函数，后者其实就判断了一下当前键是否过期，如果没有过期，更新`misses`和`hits`信息，然后就返回值对象.

```java
// 以读操作取出key的值对象，会更新是否命中的信息
robj *lookupKeyRead(redisDb *db, robj *key) {
    return lookupKeyReadWithFlags(db,key,LOOKUP_NONE);
}
```

```java
// 以读操作取出key的值对象，没找到返回NULL
// 调用该函数的副作用如下：
// 1.如果一个键的到达过期时间TTL，该键被设置为过期的
// 2.键的使用时间信息被更新
// 3.全局键 hits/misses 状态被更新
// 注意：如果键在逻辑上已经过期但是仍然存在，函数返回NULL
robj *lookupKeyReadWithFlags(redisDb *db, robj *key, int flags) {
    robj *val;
    // 如果键已经过期且被删除
    if (expireIfNeeded(db,key) == 1) {
        // 键已过期，如果是主节点环境，表示key已经绝对被删除，如果是从节点，
        if (server.masterhost == NULL) return NULL;
        // 如果我们在从节点环境， expireIfNeeded()函数不会删除过期的键，它返回的仅仅是键是否被删除的逻辑值
        // 过期的键由主节点负责，为了保证主从节点数据的一致
        if (server.current_client &&
            server.current_client != server.master &&
            server.current_client->cmd &&
            server.current_client->cmd->flags & CMD_READONLY)
        {
            return NULL;
        }
    }
    // 键没有过期，则返回键的值对象
    val = lookupKey(db,key,flags);
    // 更新 是否命中 的信息
    if (val == NULL)
        server.stat_keyspace_misses++;
    else
        server.stat_keyspace_hits++;
    return val;
}
```

**lookupKeyWrite()函数**

`lookupKeyWrite()`函数则先判断键是否过期，然后直接调用最底层的 `lookupKey()`函数，和`lookupKeyRead()`函数 相比，少了一步更新`misses`和`hits`信息的过程.

```java
// 以写操作取出key的值对象，不更新是否命中的信息
robj *lookupKeyWrite(redisDb *db, robj *key) {
    expireIfNeeded(db,key);
    return lookupKey(db,key,LOOKUP_NONE);
}
```

#### 2.3 键的过期时间

##### 2.3.1 保存过期时间

命令
描述

EXPIREAT key timestamp
为 key 设置生存时间，EXPIREAT 命令接受的时间参数是 UNIX 时间戳

EXPIRE key seconds
以秒为单位设置 key 的生存时间

PEXPIRE key milliseconds
以毫秒为单位设置 key 的生存时间

PEXPIREAT key milliseconds-timestamp
以毫秒为单位设置 key 的过期 unix 时间戳

以上四个命令都是用来设置键的过期时间的，但在执行时，其它三个命令都会转化成`PEXPIREAT`命令来执行.

`redisDb`结构中的`expires`字典保存这设置了过期时间的键和过期的时间，我们称这个字典为过期字典.

- 过期字典的键是一个指针，这个指针指向键空间中的某个键对象（也即是某个数据库键）.
- 过期字典的值是一个long long类型的整数，这个整数保存了键所指向的数据库键的过期时间，一个毫秒精度的UNIX时间戳.

```java
typedef struct redisDb {
	// ...
	// 数据库键空间，保存着数据库中的所有键值对
	dict *dict;
	// 过期字典，保存着设置过期的键和键的过期时间
    dict *expires;  
	// ...
} redisDb;
```

如下图所示，是一个带有过期字典的数据库例子：

注意在实际中，键空间的键和过期字典的键都指向同一个键对象（只是增加引用计数），所以不会出现任何重复对象，也不会浪费任何空间.

##### 2.3.2 过期键的删除策略

Redis采用的过期键删除策略是`惰性删除`和`定期删除`.

- 惰性删除：当客户度读出带有超时属性的键时，如果已经超过键设置的过期时间，会执行删除并返回空.
- 定期删除：每隔一段时间，程序就对数据库进行一次检查，删除里面的过期键. 至于要删除多少过期键，以及要检查多少个数据库，则由算法决定.

**惰性删除**

惰性删除由`expireIfNeeded()`函数实现，所有读写数据库的Redis命令在执行前都会调用，删除过期键.

```java
// 检查键是否过期，如果过期，从数据库中删除
// 返回0表示没有过期或没有过期时间，返回1 表示键被删除
int expireIfNeeded(redisDb *db, robj *key) {
    //得到过期时间，单位毫秒
    mstime_t when = getExpire(db,key);
    mstime_t now;
    // 没有过期时间，直接返回
    if (when < 0) return 0; /* No expire for this key */
    // 服务器正在载入，那么不进行过期检查
    if (server.loading) return 0;
    // 返回一个Unix时间，单位毫秒
    now = server.lua_caller ? server.lua_time_start : mstime();
    // 如果服务器正在进行主从节点的复制，从节点的过期键应该被主节点发送同步删除的操作 删除，而自己不主动删除
    // 从节点只返回正确的逻辑信息，0表示key仍然没有过期，1表示key过期。
    if (server.masterhost != NULL) return now > when;
    // 当键还没有过期时，直接返回0
    if (now <= when) return 0;
    // 键已经过期，删除键
    // 过期键的数量加1
    server.stat_expiredkeys++;
    // 将过期键key传播给AOF文件和从节点
    propagateExpire(db,key);
    // 发送"expired"事件通知
    notifyKeyspaceEvent(NOTIFY_EXPIRED,
        "expired",key,db->id);
    // 从数据库中删除key
    return dbDelete(db,key);
}
```

**定期删除**

过期键的定期删除策略由`server.c/activeExpireCycle`函数实现，每当Redis的服务器周期性操作`server.c/serverCron`函数执行时，`activeExpireCycle`函数就会被调用，它在规定的时间内，分多次遍历服务器中的各个数据库，从数据库的`expires`字典中随机检查一部分键的过期时间，并删除其中的过期键.

```java
// 过期键周期性删除
void activeExpireCycle(int type) {
    // 函数的全局状态为了每次调用都持续增加
    static unsigned int current_db = 0;
    static int timelimit_exit = 0;
    // 最近一个快速模式执行的时间
    static long long last_fast_cycle = 0;
    int j, iteration = 0;
    // 每次测试16个数据库
    int dbs_per_call = CRON_DBS_PER_CALL;
    long long start = ustime(), timelimit;
    // 快速模式
    if (type == ACTIVE_EXPIRE_CYCLE_FAST) {
        // 如果上一个周期没有激活时间限制，不要开始快速循环。不要在与快速循环总持续时间本身相同的时间段内重复快速循环
        if (!timelimit_exit) return;
        // 快速模式相隔的时间太短
        if (start < last_fast_cycle + ACTIVE_EXPIRE_CYCLE_FAST_DURATION*2) return;
        last_fast_cycle = start;
    }
    // 通常情况我们每次迭代测试16个数据库，有两个例外：
    //      1. 数据库数量小于16个
    //      2. 如果上一次触发了时间限制，那么这次会扫描所有的数据库，避免过期键占用空间
    // 更新测试的数据库数量
    if (dbs_per_call > server.dbnum || timelimit_exit)
        dbs_per_call = server.dbnum;
    // 计算时间限制25ms
    timelimit = 1000000*ACTIVE_EXPIRE_CYCLE_SLOW_TIME_PERC/server.hz/100;
    timelimit_exit = 0;
    if (timelimit <= 0) timelimit = 1;
    // 快速模式，更新时间限制
    if (type == ACTIVE_EXPIRE_CYCLE_FAST)
        // 1000微秒=1ms
        timelimit = ACTIVE_EXPIRE_CYCLE_FAST_DURATION;
    // 遍历所有的数据库
    for (j = 0; j < dbs_per_call; j++) {
        int expired;
        // 循环数据库指针
        redisDb *db = server.db+(current_db % server.dbnum);
        // 当前数据库标记加1，下次进入循环直接从当前数据库开始处理
        current_db++;
        /* Continue to expire if at the end of the cycle more than 25%
         * of the keys were expired. */
        do {
            unsigned long num, slots;
            long long now, ttl_sum;
            int ttl_samples;
            // 数据库过期字典的键数量为0，跳过这个数据库
            if ((num = dictSize(db->expires)) == 0) {
                db->avg_ttl = 0;
                break;
            }
            // 获取数据库过期字典的槽位数量
            slots = dictSlots(db->expires);
            // 当期时间
            now = mstime();
            // 过期键的占比小于1%，直接跳出循环，等待resize
            if (num && slots > DICT_HT_INITIAL_SIZE &&
                (num*100/slots < 1)) break;
            expired = 0;        // 已删除的过期键数量
            ttl_sum = 0;        // 键的总生存时间
            ttl_samples = 0;    // 没过期键的数量
            // 每次最多处理20个
            if (num > ACTIVE_EXPIRE_CYCLE_LOOKUPS_PER_LOOP)
                num = ACTIVE_EXPIRE_CYCLE_LOOKUPS_PER_LOOP;
            // 遍历过期字典
            while (num--) {
                dictEntry *de;
                long long ttl;
                // 随机取出一个带过期时间的键
                if ((de = dictGetRandomKey(db->expires)) == NULL) break;
                // 计算生存时间
                ttl = dictGetSignedIntegerVal(de)-now;
                // 如果键过期，则删除，更新计数器
                if (activeExpireCycleTryExpire(db,de,now)) expired++;
                // 键没过期
                if (ttl > 0) {
                    // 累计键的总生存时间
                    ttl_sum += ttl;
                    // 更新没过期键个数
                    ttl_samples++;
                }
            }
            // 更新数据库的平均生存时间的状态
            if (ttl_samples) {
                long long avg_ttl = ttl_sum/ttl_samples;
                // 设置平均过期时间
                if (db->avg_ttl == 0) db->avg_ttl = avg_ttl;
                // 这一次的占2%的比重，之前的占98%比重
                db->avg_ttl = (db->avg_ttl/50)*49 + (avg_ttl/50);
            }
            // 迭代次数
            iteration++;
            // 遍历一轮16次，执行一次
            if ((iteration & 0xf) == 0) {
      /* check once every 16 iterations. */
                // 计算这一轮执行的时间
                long long elapsed = ustime()-start;
                // 将"expire-cycle"和执行时间加入到延迟诊断字典中
                latencyAddSampleIfNeeded("expire-cycle",elapsed/1000);
                // 如果超过时间限制，那么设置超过退出的标志
                if (elapsed > timelimit) timelimit_exit = 1;
            }
            // 超时则退出
            if (timelimit_exit) return;
        // 如果过期删除的键超过25%，那么继续遍历，直到timelimit到达才会退出
        } while (expired > ACTIVE_EXPIRE_CYCLE_LOOKUPS_PER_LOOP / 4);
    }
}
```

### 3. 数据库相关命令的底层实现

#### 3.1 键空间命令

**RENAME**

```java
// RENAME key newkey
// RENAMENX key newkey
// RENAME、RENAMENX命令底层实现
void renameGenericCommand(client *c, int nx) {
    robj *o;
    long long expire;
    int samekey = 0;
    // key和newkey相同的话，设置samekey标志
    if (sdscmp(c->argv[1]->ptr,c->argv[2]->ptr) == 0) samekey = 1;
    // 以写操作读取key的值对象
    if ((o = lookupKeyWriteOrReply(c,c->argv[1],shared.nokeyerr)) == NULL)
        return;
    // 如果key和newkey相同，nx为1发送0，否则为ok
    if (samekey) {
        addReply(c,nx ? shared.czero : shared.ok);
        return;
    }
    // 增加值对象的引用计数，保护起来，用于关联newkey，以防删除了key顺带将值对象也删除
    incrRefCount(o);
    // 备份key的过期时间，将来作为newkey的过期时间
    expire = getExpire(c->db,c->argv[1]);
    // 判断newkey的值对象是否存在
    if (lookupKeyWrite(c->db,c->argv[2]) != NULL) {
        // 设置nx标志，则不符合已存在的条件，发送0
        if (nx) {
            decrRefCount(o);
            addReply(c,shared.czero);
            return;
        }
		// 将旧的newkey对象删除
        dbDelete(c->db,c->argv[2]);
    }
    // 将newkey和key的值对象关联
    dbAdd(c->db,c->argv[2],o);
    // 如果newkey设置过过期时间，则为newkey设置过期时间
    if (expire != -1) setExpire(c->db,c->argv[2],expire);
    // 删除key
    dbDelete(c->db,c->argv[1]);
    // 发送这两个键被修改的信号
    signalModifiedKey(c->db,c->argv[1]);
    signalModifiedKey(c->db,c->argv[2]);
    // 发送不同命令的事件通知
    notifyKeyspaceEvent(NOTIFY_GENERIC,"rename_from",
        c->argv[1],c->db->id);
    notifyKeyspaceEvent(NOTIFY_GENERIC,"rename_to",
        c->argv[2],c->db->id);
    // 更新脏键
    server.dirty++;
    addReply(c,nx ? shared.cone : shared.ok);
}
// RENAME key newkey
// RENAME 命令实现
void renameCommand(client *c) {
    renameGenericCommand(c,0);
}
// RENAMENX key newkey
// RENAMENX 命令实现
void renamenxCommand(client *c) {
    renameGenericCommand(c,1);
}
```

**MOVE**

```java
// MOVE key db 将当前数据库的 key 移动到给定的数据库 db 当中
// MOVE 命令实现
void moveCommand(client *c) {
    robj *o;
    redisDb *src, *dst;
    int srcid;
    long long dbid, expire;
    // 服务器处于集群模式，不支持多数据库
    if (server.cluster_enabled) {
        addReplyError(c,"MOVE is not allowed in cluster mode");
        return;
    }
    // 获得源数据库和源数据库的id
    src = c->db;
    srcid = c->db->id;
    // 将参数db的值保存到dbid，并且切换到该数据库中
    if (getLongLongFromObject(c->argv[2],&dbid) == C_ERR ||
        dbid < INT_MIN || dbid > INT_MAX ||
        selectDb(c,dbid) == C_ERR)
    {
        addReply(c,shared.outofrangeerr);
        return;
    }
    // 目标数据库
    dst = c->db;
    // 切换回源数据库
    selectDb(c,srcid);
    // 如果前后切换的数据库相同，则返回有关错误
    if (src == dst) {
        addReply(c,shared.sameobjecterr);
        return;
    }
    // 以写操作取出源数据库的对象
    o = lookupKeyWrite(c->db,c->argv[1]);
    if (!o) {
    	// 不存在发送0
        addReply(c,shared.czero);
        return;
    }
    // 备份key的过期时间
    expire = getExpire(c->db,c->argv[1]);
    // 判断当前key是否存在于目标数据库，存在直接返回，发送0
    if (lookupKeyWrite(dst,c->argv[1]) != NULL) {
        addReply(c,shared.czero);
        return;
    }
    // 将key-value对象添加到目标数据库中
    dbAdd(dst,c->argv[1],o);
    // 设置移动后key的过期时间
    if (expire != -1) setExpire(dst,c->argv[1],expire);
    incrRefCount(o);    //增加引用计数
    // 从源数据库中将key和关联的值对象删除
    dbDelete(src,c->argv[1]);
    server.dirty++; //更新脏键
    addReply(c,shared.cone);    //回复1
}
```

#### 3.2 过期命令

**EXPIRE、PEXPIRE、EXPIREAT和PEXPIREAT**

```java
// EXPIRE key seconds
// EXPIREAT key timestamp
// PEXPIRE key milliseconds
// PEXPIREAT key milliseconds-timestamp
// EXPIRE, PEXPIRE, EXPIREAT,PEXPIREAT命令的底层实现
// basetime参数可能是绝对值，可能是相对值。执行AT命令时basetime为0，否则保存的是当前的绝对时间
// unit 是UNIT_SECONDS 或者 UNIT_MILLISECONDS，但是basetime总是以毫秒为单位的
void expireGenericCommand(client *c, long long basetime, int unit) {
    robj *key = c->argv[1], *param = c->argv[2];
    long long when;
    // 取出时间参数保存到when中
    if (getLongLongFromObjectOrReply(c, param, &when, NULL) != C_OK)
        return;
    // 如果过期时间是以秒为单位，则转换为毫秒值
    if (unit == UNIT_SECONDS) when *= 1000;
    // 绝对时间
    when += basetime;
    // 判断key是否在数据库中，不在返回0
    if (lookupKeyWrite(c->db,key) == NULL) {
        addReply(c,shared.czero);
        return;
    }
    // 如果当前正在载入AOF数据或者在从节点环境中，即使EXPIRE的TTL为负数，或者EXPIREAT的时间戳已经过期
    // 服务器都不会执行DEL命令，且将过期TTL设置为键的过期时间，等待主节点发来的DEL命令
    // 如果when已经过时，服务器为主节点且没有载入AOF数据
    if (when <= mstime() && !server.loading && !server.masterhost) {
        robj *aux;
        // 将key从数据库中删除
        serverAssertWithInfo(c,key,dbDelete(c->db,key));
        // 更新脏键
        server.dirty++;
        // 创建一个"DEL"命令
        aux = createStringObject("DEL",3);
        rewriteClientCommandVector(c,2,aux,key);    //修改客户端的参数列表为DEL命令
        decrRefCount(aux);
        // 发送键被修改的信号
        signalModifiedKey(c->db,key);
        // 发送"del"的事件通知
        notifyKeyspaceEvent(NOTIFY_GENERIC,"del",key,c->db->id);
        addReply(c, shared.cone);
        return;
    // 如果当前服务器是从节点，或者服务器正在载入AOF数据
    // 不管when有没有过时，都设置为过期时间
    } else {
        // 设置过期时间
        setExpire(c->db,key,when);
        addReply(c,shared.cone);
        // 发送键被修改的信号
        signalModifiedKey(c->db,key);
        // 发送"expire"的事件通知
        notifyKeyspaceEvent(NOTIFY_GENERIC,"expire",key,c->db->id);
        // 更新脏键
        server.dirty++;
        return;
    }
}
// EXPIRE key seconds
// EXPIRE 命令实现
void expireCommand(client *c) {
    expireGenericCommand(c,mstime(),UNIT_SECONDS);
}
// EXPIREAT key timestamp
// EXPIREAT 命令实现
void expireatCommand(client *c) {
    expireGenericCommand(c,0,UNIT_SECONDS);
}
// PEXPIRE key milliseconds
// PEXPIRE 命令实现
void pexpireCommand(client *c) {
    expireGenericCommand(c,mstime(),UNIT_MILLISECONDS);
}
// PEXPIREAT key milliseconds-timestamp
// PEXPIREAT 命令实现
void pexpireatCommand(client *c) {
    expireGenericCommand(c,0,UNIT_MILLISECONDS);
}
```

**TTL、PTTL**

```java
// TTL key
// PTTL key
// TTL、PTTL命令底层实现，output_ms为1，返回毫秒，为0返回秒
void ttlGenericCommand(client *c, int output_ms) {
    long long expire, ttl = -1;
    // 判断key是否存在于数据库，并且不修改键的使用时间
    if (lookupKeyReadWithFlags(c->db,c->argv[1],LOOKUP_NOTOUCH) == NULL) {
        addReplyLongLong(c,-2);
        return;
    }
    // 如果key存在，则备份当前key的过期时间
    expire = getExpire(c->db,c->argv[1]);
    // 如果设置了过期时间
    if (expire != -1) {
    	// 计算生存时间
        ttl = expire-mstime();
        if (ttl < 0) ttl = 0;
    }
    // 如果键是永久的
    if (ttl == -1) {
    	// 发送-1
        addReplyLongLong(c,-1);
    } else {
    	// 发送生存时间
        addReplyLongLong(c,output_ms ? ttl : ((ttl+500)/1000));
    }
}
// TTL key
// TTL 命令实现
void ttlCommand(client *c) {
    ttlGenericCommand(c, 0);
}
// PTTL key
// PTTL 命令实现
void pttlCommand(client *c) {
    ttlGenericCommand(c, 1);
}
```
