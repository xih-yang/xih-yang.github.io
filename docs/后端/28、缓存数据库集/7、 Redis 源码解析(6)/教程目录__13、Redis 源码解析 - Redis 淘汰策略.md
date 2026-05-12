# 13、Redis 源码解析 - Redis 淘汰策略
- 来源：https://ddkk.com/zhuanlan/db/redis/6/13.html
- 分类：缓存数据库
- 分组：教程目录
### 键何时被淘汰

健的淘汰实现在evic.c中

在[Redis 源码解析 - Redis 命令端到端的过程](/zhuanlan/db/redis/6/5.html)中，processCommand命令处理函数从命令表中查找对应的命令之后，做的第一件事就是调用freeMemoryIfNeededAndSafe函数尝试对淘汰对应的键，进行内存释放：

```java
int processCommand(client *c) {
	...
	c->cmd = c->lastcmd = lookupCommand(c->argv[0]->ptr);
	...
	//内存管理
    if (server.maxmemory && !server.lua_timedout) {
        int out_of_memory = freeMemoryIfNeededAndSafe() == C_ERR;
        if (server.current_client == NULL) return C_ERR;
        if (out_of_memory &&
            (c->cmd->flags & CMD_DENYOOM ||
             (c->flags & CLIENT_MULTI && c->cmd->proc != execCommand))) {
            flagTransaction(c);
            addReply(c, shared.oomerr);
            return C_OK;
        }
    }
    ...
}
```

当满足以下三个条件时，键需要被淘汰：

**1、** server设置来最大最大内存使用量；

**2、** 内存使用阈值达到最大值；

**3、** server目前没有执行lua脚本；

freeMemoryIfNeededAndSafe函数的另一个调用地方是在客户端发送config set maxmemory xxx时，进行一次键的淘汰。

### 淘汰策略

```java
//缓存淘汰策略
#define MAXMEMORY_VOLATILE_LRU ((0<<8)|MAXMEMORY_FLAG_LRU)
#define MAXMEMORY_VOLATILE_LFU ((1<<8)|MAXMEMORY_FLAG_LFU)
#define MAXMEMORY_VOLATILE_TTL (2<<8)
#define MAXMEMORY_VOLATILE_RANDOM (3<<8)
#define MAXMEMORY_ALLKEYS_LRU ((4<<8)|MAXMEMORY_FLAG_LRU|MAXMEMORY_FLAG_ALLKEYS)
#define MAXMEMORY_ALLKEYS_LFU ((5<<8)|MAXMEMORY_FLAG_LFU|MAXMEMORY_FLAG_ALLKEYS)
#define MAXMEMORY_ALLKEYS_RANDOM ((6<<8)|MAXMEMORY_FLAG_ALLKEYS)
#define MAXMEMORY_NO_EVICTION (7<<8)
```

一共有8种：

**1、** MAXMEMORY_VOLATILE_LRU：从设置了过期时间的键中根据LRU淘汰；

**2、** MAXMEMORY_VOLATILE_LFU：从设置了过期时间的键中根据LFU淘汰；

**3、** MAXMEMORY_VOLATILE_TTL：从设置了过期时间的键中根据最长生存时间淘汰；

**4、** MAXMEMORY_VOLATILE_RANDOM：从设置了过期时间的键中任意选择键淘汰；

**5、** MAXMEMORY_FLAG_LRU：从所有键中根据LRU淘汰；

**6、** MAXMEMORY_FLAG_LFU：从所有键中根据LFU淘汰；

**7、** MAXMEMORY_ALLKEYS_RANDOM：从所有键中任意选择键淘汰；

**8、** MAXMEMORY_NO_EVICTION：不进行键淘汰，如果内存不够，直接OOM；

### 淘汰算法

在对象结构体中，lru字段表示键的访问时间（频率），这是一个24位的无符号数，在redis.conf中设置maxmemory_policy（即上面的8中策略，默认为不淘汰）后，lru可以表示键的访问时间或者访问频率，对应lru（最近最少使用算法）和lfu（最近最不经常使用算法）。

```java
typedef struct redisObject {
    unsigned type:4;
    unsigned encoding:4;
    unsigned lru:LRU_BITS;
    int refcount;
    void *ptr;
} robj;
```

一般来说，lru字段在以下情况下被更新：

**1、** 创建对象的时候，给对象的lru字段初始化：；

```java
robj *createObject(int type, void *ptr) {
	...
	if (server.maxmemory_policy & MAXMEMORY_FLAG_LFU) {
        o->lru = (LFUGetTimeInMinutes()<<8) | LFU_INIT_VAL;
    } else {
        o->lru = LRU_CLOCK();
    }
    ...
}
```

**2、** 在访问数据库，对键值对进行增删查改时，都会调用底层的lookupKey函数去判断数据库中是否有该键，在这时，对lru字段进行更新；

```java
robj *lookupKey(redisDb *db, robj *key, int flags) {
    dictEntry *de = dictFind(db->dict,key->ptr);
    if (de) {
        robj *val = dictGetVal(de);
        if (server.rdb_child_pid == -1 &&
            server.aof_child_pid == -1 &&
            !(flags & LOOKUP_NOTOUCH))
        {
            //更新lru字段
            if (server.maxmemory_policy & MAXMEMORY_FLAG_LFU) {
                updateLFU(val);
            } else {
                val->lru = LRU_CLOCK();
            }
        }
        return val;
    } else {
        return NULL;
    }
}
```

注意这里再判断如果存在RDB/AOF子进程时，不会更新lru，原因是避免fork的COW放大

#### lru

lru算法中，lru表示上一次访问键的时间，以ms为单位，每次访问到键时，就把键的lru更新为当前的时间。

```java
unsigned int LRU_CLOCK(void) {
    unsigned int lruclock;
    //serverCron()执行周期大于lru精度
    if (1000/server.hz <= LRU_CLOCK_RESOLUTION) {
        atomicGet(server.lruclock,lruclock);
    } else {
        lruclock = getLRUClock();
    }
    return lruclock;
}
unsigned int getLRUClock(void) {
    return (mstime()/LRU_CLOCK_RESOLUTION) & LRU_CLOCK_MAX;
}
```

这里首先判断serverCron的执行周期是否大于lru精度，如果是则直接将server.lruclock返回，省去一次获取系统时间的系统调用，因为server.lruclock在serverCron函数中每次都会被更新。

#### lfu

在lfu算法中，lru字段分为两部分，前16位表示上一次访问时间，单位为分，后8位表示键最近的访问频率。每次访问到键时，其更新方式如下：

**1、** 前16位更新为当前时间；

```java
unsigned long LFUGetTimeInMinutes(void) {
    return (server.unixtime/60) & 65535;
}
```

**2、** 后8位先进行一次塌缩，因为后8位表示最近的访问频率，所以如果最近没有对键访问，随着时间的流逝，键的访问频率应该缩小可以看出，塌缩的值为距离上一次访问时间经过的分钟数；

```java
unsigned long LFUDecrAndReturn(robj *o) {
    unsigned long ldt = o->lru >> 8;
    unsigned long counter = o->lru & 255;
    unsigned long num_periods = server.lfu_decay_time ? LFUTimeElapsed(ldt) / server.lfu_decay_time : 0;
    if (num_periods)
        counter = (num_periods > counter) ? 0 : counter - num_periods;
    return counter;
}
unsigned long LFUTimeElapsed(unsigned long ldt) {
    unsigned long now = LFUGetTimeInMinutes();
    if (now >= ldt) return now-ldt;
    //发生回绕
    return 65535-ldt+now;
}
```

**3、** 然后因为本次访问到键了，要对键的访问频率增加，这里redis用了一个技巧：因为后8位即使最大也是256，用来表示访问次数可能不够，所以“对键的访问频率增加”并不是一定会增大后8位的值，只是发出这个增加的动作，具体是否增加取决于概率，概率与后8位的值有关，值越大，增加的概率越小从代码中看出，概率为1/((counter-LFU_INIT_VAL)*server.lfu_log_factor+1)；

```java
uint8_t LFULogIncr(uint8_t counter) {
    if (counter == 255) return 255;
    double r = (double)rand()/RAND_MAX;
    double baseval = counter - LFU_INIT_VAL;
    if (baseval < 0) baseval = 0;
    double p = 1.0/(baseval*server.lfu_log_factor+1);
    if (r < p) counter++;
    return counter;
}
```

总的lfu更新函数：

```java
void updateLFU(robj *val) {
    unsigned long counter = LFUDecrAndReturn(val);
    counter = LFULogIncr(counter);
    val->lru = (LFUGetTimeInMinutes()<<8) | counter;
}
```

### 键的淘汰步骤

键的具体淘汰在freeMemoryIfNeeded函数中执行，里面重要的一步是要选取出要淘汰的键，如何根据lru或者lfu或者ttl来判断键需要被淘汰呢？这就需要计算键的idle(空闲)时间：

```java
void evictionPoolPopulate(int dbid, dict *sampledict, dict *keydict, struct evictionPoolEntry *pool) {
    int j, k, count;
    dictEntry *samples[server.maxmemory_samples];
    //随机选取count个键
    count = dictGetSomeKeys(sampledict,samples,server.maxmemory_samples);
    for (j = 0; j < count; j++) {
        unsigned long long idle;
        sds key;
        robj *o;
        dictEntry *de;
        de = samples[j];
        key = dictGetKey(de);
        //MAXMEMORY_VOLATILE_TTL策略只需要知道键的过期时间即可
        if (server.maxmemory_policy != MAXMEMORY_VOLATILE_TTL) {
            if (sampledict != keydict) de = dictFind(keydict, key);
            o = dictGetVal(de);
        }
        //对于lru，就是上一次访问时间到现在的经历时间
        if (server.maxmemory_policy & MAXMEMORY_FLAG_LRU) {
            idle = estimateObjectIdleTime(o);
        } else if (server.maxmemory_policy & MAXMEMORY_FLAG_LFU) {
        	//对于lfu策略，用255-访问频率来表示空闲时间
            idle = 255-LFUDecrAndReturn(o);
        else if (server.maxmemory_policy == MAXMEMORY_VOLATILE_TTL) {
            //MAXMEMORY_VOLATILE_TTL策略下，看对象最大生存时间ttl
            idle = ULLONG_MAX - (long)dictGetVal(de);
        } else {
            serverPanic("Unknown eviction policy in evictionPoolPopulate()");
        }
        //按照idle的升序将key插入pool中
        k = 0;
        while (k < EVPOOL_SIZE &&
               pool[k].key &&
               pool[k].idle < idle) k++;
        if (k == 0 && pool[EVPOOL_SIZE-1].key != NULL) {
        	//idle最小，不插入
        	continue;
        } else if (k < EVPOOL_SIZE && pool[k].key == NULL) {
            //要插入的位置刚好空闲
        } else {
            if (pool[EVPOOL_SIZE-1].key == NULL) {
                //要插入的位置不为空，且pool中还有位置
                //为要插入的key空出位置并缓存前一个key
                sds cached = pool[EVPOOL_SIZE-1].cached;
                memmove(pool+k+1,pool+k,
                    sizeof(pool[0])*(EVPOOL_SIZE-k-1));
                pool[k].cached = cached;
            } else {
                //pool中没有空闲位置，则把第一个位置上的key移除
                k--;
                sds cached = pool[0].cached; /* Save SDS before overwriting. */
                if (pool[0].key != pool[0].cached) sdsfree(pool[0].key);
                memmove(pool,pool+1,sizeof(pool[0])*k);
                pool[k].cached = cached;
            }
        }
        //插入元素
        int klen = sdslen(key);
        if (klen > EVPOOL_CACHED_SDS_SIZE) {
            pool[k].key = sdsdup(key);
        } else {
            memcpy(pool[k].cached,key,klen+1);
            sdssetlen(pool[k].cached,klen);
            pool[k].key = pool[k].cached;
        }
        pool[k].idle = idle;
        pool[k].dbid = dbid;
    }
}
```

evictionPoolPopulate函数每次随机选取count个键，并尝试插入pool中等待删除，pool数组是一个按照idle生序的数组。

当选出要被淘汰的键之后，接下来执行具体的键释放。

```java
int freeMemoryIfNeeded(void) {
    if (server.masterhost && server.repl_slave_ignore_maxmemory) return C_OK;
    size_t mem_reported, mem_tofree, mem_freed;
    mstime_t latency, eviction_latency;
    long long delta;
    int slaves = listLength(server.slaves);
    //暂停客户端状态下，不进行内存管理
    if (clientsArePaused()) return C_OK;
    //不需要内存清理
    if (getMaxmemoryState(&mem_reported,NULL,&mem_tofree,NULL) == C_OK)
        return C_OK;
    mem_freed = 0;
    if (server.maxmemory_policy == MAXMEMORY_NO_EVICTION)
        goto cant_free; /* We need to free memory, but policy forbids. */
    latencyStartMonitor(latency);
    //需要内存清理
    while (mem_freed < mem_tofree) {
        int j, k, i, keys_freed = 0;
        static unsigned int next_db = 0;
        sds bestkey = NULL;
        int bestdbid;
        redisDb *db;
        dict *dict;
        dictEntry *de;
        //如果使用LRU、LFU或者是volatile-ttl策略清除内存空间，那么使用辅助函数以idle为标准收集需要释放的键
        if (server.maxmemory_policy & (MAXMEMORY_FLAG_LRU|MAXMEMORY_FLAG_LFU) ||
            server.maxmemory_policy == MAXMEMORY_VOLATILE_TTL)
        {
            struct evictionPoolEntry *pool = EvictionPoolLRU;
            //每次选择出一个key进行淘汰
            while(bestkey == NULL) {
                unsigned long total_keys = 0, keys;
                //选取出一定数量的idle最大的key，并填入pool中
                for (i = 0; i < server.dbnum; i++) {
                    db = server.db+i;
                    dict = (server.maxmemory_policy & MAXMEMORY_FLAG_ALLKEYS) ?
                            db->dict : db->expires;
                    if ((keys = dictSize(dict)) != 0) {
                        //选出要淘汰的键
                        evictionPoolPopulate(i, dict, db->dict, pool);
                        total_keys += keys;
                    }
                }
                if (!total_keys) break;
                //选择出目前pool中最适合删除的key，也就是idle时间最大的键
                for (k = EVPOOL_SIZE-1; k >= 0; k--) {
                    if (pool[k].key == NULL) continue;
                    bestdbid = pool[k].dbid;
                    if (server.maxmemory_policy & MAXMEMORY_FLAG_ALLKEYS) {
                        de = dictFind(server.db[pool[k].dbid].dict,
                            pool[k].key);
                    } else {
                        de = dictFind(server.db[pool[k].dbid].expires,
                            pool[k].key);
                    }
                    if (pool[k].key != pool[k].cached)
                        sdsfree(pool[k].key);
                    pool[k].key = NULL;
                    pool[k].idle = 0;
                    if (de) {
                        bestkey = dictGetKey(de);
                        break;
                    } else {
                        /* Ghost... Iterate again. */
                    }
                }
            }
        //任意键删除策略
        else if (server.maxmemory_policy == MAXMEMORY_ALLKEYS_RANDOM ||
                 server.maxmemory_policy == MAXMEMORY_VOLATILE_RANDOM)
        {
            for (i = 0; i < server.dbnum; i++) {
                j = (++next_db) % server.dbnum;
                db = server.db+j;
                dict = (server.maxmemory_policy == MAXMEMORY_ALLKEYS_RANDOM) ?
                        db->dict : db->expires;
                if (dictSize(dict) != 0) {
                    //任意选出一个键即可
                    de = dictGetRandomKey(dict);
                    bestkey = dictGetKey(de);
                    bestdbid = j;
                    break;
                }
            }
        }
        //选出key之后，进行删除
        if (bestkey) {
            db = server.db+bestdbid;
            robj *keyobj = createStringObject(bestkey,sdslen(bestkey));
            //将过期命令传播到slave和aof中
            //propagateExpire() 可能会导致内存的分配，所以在zmalloc_used_memory之前执行
            propagateExpire(db,keyobj,server.lazyfree_lazy_eviction);
            delta = (long long) zmalloc_used_memory();
            latencyStartMonitor(eviction_latency);
            if (server.lazyfree_lazy_eviction)
                dbAsyncDelete(db,keyobj);
            else
                dbSyncDelete(db,keyobj);
            latencyEndMonitor(eviction_latency);
            latencyAddSampleIfNeeded("eviction-del",eviction_latency);
            latencyRemoveNestedEvent(latency,eviction_latency);
            delta -= (long long) zmalloc_used_memory();
            mem_freed += delta;
            server.stat_evictedkeys++;
            notifyKeyspaceEvent(NOTIFY_EVICTED, "evicted",
                keyobj, db->id);
            decrRefCount(keyobj);
            keys_freed++;
            //如果要删除的键比较多，并且把回写slave客户端的动作放到eventloop中做
            //那么可能回造成在eventloop中较长时间的阻塞
            //所以放在这里强制发送客户端
            if (slaves) flushSlavesOutputBuffers();
            //在懒释放情况下，key的释放在其他的线程中，所以需要时不时的检测是否已经达到循坏条件
            if (server.lazyfree_lazy_eviction && !(keys_freed % 16)) {
                if (getMaxmemoryState(NULL,NULL,NULL,NULL) == C_OK) {
                    /* Let's satisfy our stop condition. */
                    mem_freed = mem_tofree;
                }
            }
        }
        if (!keys_freed) {
            latencyEndMonitor(latency);
            latencyAddSampleIfNeeded("eviction-cycle",latency);
            goto cant_free; /* nothing to free... */
        }
    }
    latencyEndMonitor(latency);
    latencyAddSampleIfNeeded("eviction-cycle",latency);
    return C_OK;
cant_free:
    //执行到这里，说明目前数据库中没有可释放的内存，只能尽可能的等待其他懒释放线程中释放内存
    while(bioPendingJobsOfType(BIO_LAZY_FREE)) {
        if (((mem_reported - zmalloc_used_memory()) + mem_freed) >= mem_tofree)
            break;
        usleep(1000);
    }
    return C_ERR;
}
```
