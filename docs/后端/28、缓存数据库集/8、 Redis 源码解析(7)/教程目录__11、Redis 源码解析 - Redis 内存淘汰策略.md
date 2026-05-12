# 11、Redis 源码解析 - Redis 内存淘汰策略
- 来源：https://ddkk.com/zhuanlan/db/redis/7/11.html
- 分类：缓存数据库
- 分组：教程目录
内存淘汰策略是在存储数据较多,内存不够用时极其必要的一种释放内存的策略,可以使得在大量数据到来的时候服务器不至于宕机.redis中内置了六种内存淘汰机制,实现的功能都是一样的,通过某种手段找到需要删除的键,然后进行删除.**一般在要执行从客户端发送来的命令且此时redis已使用内存超限时执行**.

**1、** volatile-lru:从过期字典中挑选最近最少使用的数据淘汰；

**2、** volatile-ttl:从过期字典中挑选将要过期的数据淘汰(一般解释),其实源码中的实现是:在字典中随机挑选maxmemory_samples个键,寻找其中过期时间最小的那一个(每一次循环中).；

**3、** volatile-random:从过期字典中任意选择数据淘汰；

**4、** allkeys-lru:从主字典中挑选最近最少使用的数据淘汰；

**5、** allkeys-random:从主字典中随机挑选数据淘汰；

**6、** no-enviction:禁止驱逐数据；

其中LRU算法还使用了一个辅助结构eviction_pool,是一个存储着16个evictionPoolEntry元素的数组,里面以LRU时间升序存储,方便每次LRU从中取出最大的那一个.

### 对redis内存淘汰策略的看法

对于redis的内存淘汰策略来看,我个人的看法是随机性太大,在要求较高的地方可能会成为瓶颈,因为不管是LRU还是Random,都是从键中随机选择,再这个基础上进行删除的.举个例子,我们来说说LRU实际干了什么.

**1、** 在目标字典中的两个哈希表(可能正在rehash)中**随机**选择一个元素,以此作为起点,把后面小于16个元素(取决于eviction_pool中当前存在多少个元素)插入eviction_pool中.；

**2、** 删除其中LRU时间最高的一个,也即是最"空闲的那一个"；

我们可以看到这个随机使得这里的效率是有很大变数的,尤其是内存回收策略实在内存超过限制的时候才会使用,此时字典重点的键可能更多,删除最应该删除的键的几率也更低了.而且内存淘汰实在确定某个键以后直接删除!这就意味着可能删除某些我们很需要的键,如果里面存储的是你的的存款,你当然不会乐意.

所以在某些需要高精度,高可靠性的地方,我们可能并不能使用redis自带的这些内存淘汰策略,一方面随机性太高,其次代价太大,因为会直接删除键,数据就丢失了,这个时候我们可能需要一个辅助服务器,去专门存储要删除的键,保证可靠性.

也许因为上面的这些原因,redis的默认内存淘汰策略为**no-enviction**,如果我们想使用其他的策略的话,在配置文件中修改`maxmemory-policy`即可,修改的方法是maxmemory-policy

### 最大容量究竟是多少?

这个问题其实比较有意思,因为我们的默认设置是**no-enviction**,这意味着当内存真的超限时候会宕机,这是我们不希望看到的情况.redis是基于内存的,这显然是一个重要的问题,那么最大内存是多少呢?

首先在配置文件中并没有找到这一个选项,然后我发现在客户端执行[INFO](https://redis.io/commands/info)命令我们可以得到内存相关的参数,但是依然没有maxmemory这个参数.最终解决方案是使用`config get maxmemory`命令查询,但最终查询的结果竟然是0!

或者在`initserverconfig`中也可以发现`server.maxmemory`被初始化为0.

这也难怪,因为默认策略是no-enviction,这也说明当我们要改这两个参数的时候需要同步修改,不然就会出现十分奇怪的问题，虽然修改了策略，但是没有作用，我们可以在`processCommand`中找到答案，只有`maxmemory`不等于零的时候才会执行`freeMemoryIfNeeded`：

```java
if (server.maxmemory) {
    // 如果内存已超过限制，那么尝试通过删除过期键来释放内存
    int retval = freeMemoryIfNeeded();
    // 如果即将要执行的命令可能占用大量内存（REDIS_CMD_DENYOOM）
    // 并且前面的内存释放失败的话
    // 那么向客户端返回内存错误
    if ((c->cmd->flags & REDIS_CMD_DENYOOM) && retval == REDIS_ERR) {
        flagTransaction(c);
        addReply(c, shared.oomerr);
        return REDIS_OK;
    }
}
```

所以得出结论:**当数据量较大的时候我们需要内存淘汰策略,此时应该同步修改maxmemory和maxmemory-policy参数**.

[这里是知乎上对于这个问题的讨论](https://www.zhihu.com/question/31102463)

### 源码解析部分

#### freeMemoryIfNeeded

```java
int freeMemoryIfNeeded(void) {
    size_t mem_used, mem_tofree, mem_freed;
    int slaves = listLength(server.slaves);
    /* Remove the size of slaves output buffers and AOF buffer from the
     * count of used memory. */
    // 计算出 Redis 目前占用的内存总数，但有两个方面的内存不会计算在内：
    // 1）从服务器的输出缓冲区的内存
    // 2）AOF 缓冲区的内存
    mem_used = zmalloc_used_memory();
    if (slaves) {
        listIter li;
        listNode *ln;
        listRewind(server.slaves,&li);
        while((ln = listNext(&li))) {
            redisClient *slave = listNodeValue(ln);
            unsigned long obuf_bytes = getClientOutputBufferMemoryUsage(slave);
            if (obuf_bytes > mem_used)
                mem_used = 0;
            else
                mem_used -= obuf_bytes;
        }
    }
    if (server.aof_state != REDIS_AOF_OFF) {
        mem_used -= sdslen(server.aof_buf);
        mem_used -= aofRewriteBufferSize();
    }
    /* Check if we are over the memory limit. */
    // 如果目前使用的内存大小比设置的 maxmemory 要小,那么无须执行进一步操作
    // 所以所有的内存置换策略都是在超过内存限制的时候才会调用 而超过内存闲置判断则是在服务器接收到客户端发来的要执行的命令时进行
    if (mem_used <= server.maxmemory) return REDIS_OK;
    // 如果占用内存比 maxmemory 要大，但是 maxmemory 策略为不淘汰，那么直接返回
    if (server.maxmemory_policy == REDIS_MAXMEMORY_NO_EVICTION)
        return REDIS_ERR; /* We need to free memory, but policy forbids. */
    /* Compute how much memory we need to free. */
    // 计算需要释放多少字节的内存
    mem_tofree = mem_used - server.maxmemory;
    // 初始化已释放内存的字节数为 0
    mem_freed = 0;
    // 根据 maxmemory 策略 可配置 共六种
    // 遍历字典，释放内存并记录被释放内存的字节数
    while (mem_freed < mem_tofree) {
      //每次循环删除一个节点 循环直到达到水位线以下
        int j, k, keys_freed = 0;
        // 遍历所有字典       dbnum为字典总数
        for (j = 0; j < server.dbnum; j++) {
            long bestval = 0; /* just to prevent warning */
            sds bestkey = NULL;
            dictEntry *de;
            redisDb *db = server.db+j;
            dict *dict;
			//这里我们需要先指定要进行删除的字典是超时字典还是主字典
            if (server.maxmemory_policy == REDIS_MAXMEMORY_ALLKEYS_LRU ||
                server.maxmemory_policy == REDIS_MAXMEMORY_ALLKEYS_RANDOM)
            {
                // 如果策略是 allkeys-lru 或者 allkeys-random 
                // 那么淘汰的目标为所有数据库键 
                dict = server.db[j].dict;
            } else {
                // 如果策略是 volatile-lru 、 volatile-random 或者 volatile-ttl 
                // 那么淘汰的目标为带过期时间的数据库键
                dict = server.db[j].expires;
            }
            // 跳过空字典
            if (dictSize(dict) == 0) continue;
            /* volatile-random and allkeys-random policy */
            // 如果使用的是随机策略，那么从目标字典中随机选出键
            if (server.maxmemory_policy == REDIS_MAXMEMORY_ALLKEYS_RANDOM ||
                server.maxmemory_policy == REDIS_MAXMEMORY_VOLATILE_RANDOM)
            {
                de = dictGetRandomKey(dict);
                bestkey = dictGetKey(de);
            }
            /* volatile-lru and allkeys-lru policy */
            // 如果使用的是 LRU 策略，
            // 我们会从要删除的字典中找到EVICTION_SAMPLES_ARRAY_SIZE(默认16)个元素放入到eviction_pool中
            // eviction_pool是LRU的辅助结构,其中以LRU升序存储节点
            else if (server.maxmemory_policy == REDIS_MAXMEMORY_ALLKEYS_LRU ||
                server.maxmemory_policy == REDIS_MAXMEMORY_VOLATILE_LRU)
            {
                struct evictionPoolEntry *pool = db->eviction_pool;
                while(bestkey == NULL) {
                    // 首先从dict中随机挑选键填充eviction_pool eviction_pool中以LRU时间升序排列
                    // 我觉得每次删除一个以后都要重新调用应该就是因为其随机性吧
                    // 这个函数我们下面再细究
                    evictionPoolPopulate(dict, db->dict, db->eviction_pool);
                    /* Go backward from best to worst element to evict. */
                    //在eviction_pool找到一个可以删除的的节点 即退出 
                    for (k = REDIS_EVICTION_POOL_SIZE-1; k >= 0; k--) {
                        if (pool[k].key == NULL) continue;
                        de = dictFind(dict,pool[k].key);
                        /* Remove the entry from the pool. */
                        sdsfree(pool[k].key);
                        /* Shift all elements on its right to left. */
                        memmove(pool+k,pool+k+1,
                            sizeof(pool[0])*(REDIS_EVICTION_POOL_SIZE-k-1));
                        /* Clear the element on the right which is empty
                         * since we shifted one position to the left.  */
                        pool[REDIS_EVICTION_POOL_SIZE-1].key = NULL;
                        pool[REDIS_EVICTION_POOL_SIZE-1].idle = 0;
                        /* If the key exists, is our pick. Otherwise it is
                         * a ghost and we need to try the next element. */ //显然优先删除LRU时间最长的
                        if (de) {
      //此时bestkey使我们要删除的元素
                            bestkey = dictGetKey(de);
                            break;
                        } else {
                            /* Ghost... */
                            continue;
                        }
                    }
                }
            }
            /* volatile-ttl */
            // 策略为 volatile-ttl 选出过期时间距离当前时间最接近的键(一般解释)
            // 可是我们从源码中可以看到策略其实是在过期字典中随机挑选 找到一个所有随机选择中过期时间最小的键
            else if (server.maxmemory_policy == REDIS_MAXMEMORY_VOLATILE_TTL) {
                for (k = 0; k < server.maxmemory_samples; k++) {
                    sds thiskey;
                    long thisval;
                    de = dictGetRandomKey(dict);
                    thiskey = dictGetKey(de);
                    thisval = (long) dictGetVal(de); //在过期字典中键为key,值为过期时间
                    /* Expire sooner (minor expire unix timestamp) is better
                     * candidate for deletion */
                    if (bestkey == NULL || thisval < bestval) {
                        bestkey = thiskey;
                        bestval = thisval;
                    }
                }
            }
            /* Finally remove the selected key. */
            // 删除被选中的键
            if (bestkey) {
                long long delta;
                robj *keyobj = createStringObject(bestkey,sdslen(bestkey));
                propagateExpire(db,keyobj);
                /* We compute the amount of memory freed by dbDelete() alone.
                 * It is possible that actually the memory needed to propagate
                 * the DEL in AOF and replication link is greater than the one
                 * we are freeing removing the key, but we can't account for
                 * that otherwise we would never exit the loop.
                 *
                 * AOF and Output buffer memory will be freed eventually so
                 * we only care about memory used by the key space. */
                // 计算删除键所释放的内存数量
                delta = (long long) zmalloc_used_memory();
                dbDelete(db,keyobj);
                delta -= (long long) zmalloc_used_memory();
                mem_freed += delta;
                // 对淘汰键的计数器增一
                server.stat_evictedkeys++;
                notifyKeyspaceEvent(REDIS_NOTIFY_EVICTED, "evicted",
                    keyobj, db->id);
                decrRefCount(keyobj);
                keys_freed++;
                /* When the memory to free starts to be big enough, we may
                 * start spending so much time here that is impossible to
                 * deliver data to the slaves fast enough, so we force the
                 * transmission here inside the loop. */
                if (slaves) flushSlavesOutputBuffers();
            }
        }
        if (!keys_freed) return REDIS_ERR; /* nothing to free... */
    }
    return REDIS_OK;
}
```

#### evictionPoolPopulate

我们来看看向`eviction_pool`中填充数据的函数`evictionPoolPopulate`,这里我想大家对于eviction_pool是什么一定很疑惑,我们来看看源码中对于`eviction_pool(struct evictionPoolEntry)`的解释

```java
/* To improve the quality of the LRU approximation we take a set of keys
 * that are good candidate for eviction across freeMemoryIfNeeded() calls.
 *
 * Entries inside the eviciton pool are taken ordered by idle time, putting
 * greater idle times to the right (ascending order).
 *
 * Empty entries have the key pointer set to NULL. */
#define REDIS_EVICTION_POOL_SIZE 16
struct evictionPoolEntry {
    unsigned long long idle;    /* Object idle time. */
    sds key;                    /* Key name. */
};
```

> 为了提升近似LRU算法的效率,我们设置了一个键的集合,其是一个很好的驱逐元素的候选集合,被freeMemoryIfNeeded调用.
>
> 每一个在eviciton pool中的元素按idle排序,更大的元素放在右边.

这样我们其实就知道了eviction_pool的作用,就是存放按idle升序排列的元素,用于使用LRU策略是时删除.

```java
#define EVICTION_SAMPLES_ARRAY_SIZE 16
//以下函数所做的事情就是在sampledict中随机挑选元素,计算LRU,以升序插入pool中
                            //进行删除的字典    存储全部键值的字典   
void evictionPoolPopulate(dict *sampledict, dict *keydict, struct evictionPoolEntry *pool) {
    int j, k, count;
    dictEntry *_samples[EVICTION_SAMPLES_ARRAY_SIZE];
    dictEntry **samples;
    /* Try to use a static buffer: this function is a big hit...
     * Note: it was actually measured that this helps. */
    if (server.maxmemory_samples <= EVICTION_SAMPLES_ARRAY_SIZE) {
        samples = _samples;
    } else {
        samples = zmalloc(sizeof(samples[0])*server.maxmemory_samples);
    }
#if 1 /* Use bulk get by default. */                
	// 在sampledict中随机挑选maxmemory_samples个元素放入samples中 返回实际填充数(其中可能本来存在值 不必重新加入)
	// 后面细说
    count = dictGetRandomKeys(sampledict,samples,server.maxmemory_samples);
#else
    count = server.maxmemory_samples;
    for (j = 0; j < count; j++) samples[j] = dictGetRandomKey(sampledict);
#endif
    for (j = 0; j < count; j++) {
        unsigned long long idle;
        sds key;
        robj *o;
        dictEntry *de;
        de = samples[j];
        key = dictGetKey(de);
        /* If the dictionary we are sampling from is not the main
         * dictionary (but the expires one) we need to lookup the key
         * again in the key dictionary to obtain the value object. */
        //如果我们要从中采样的字典不是主字典(而是过期的字典),则需要在密钥字典中再次查找该密钥以获得值对象
        if (sampledict != keydict) de = dictFind(keydict, key);
        o = dictGetVal(de);
        idle = estimateObjectIdleTime(o); //计算给定对象的闲置时长
        /* Insert the element inside the pool.
         * First, find the first empty bucket or the first populated
         * bucket that has an idle time smaller than our idle time. */
        k = 0;
        while (k < REDIS_EVICTION_POOL_SIZE &&
               pool[k].key &&
               pool[k].idle < idle) k++; //找到一个可以插入的位置 保证以LRU时间升序排列
        if (k == 0 && pool[REDIS_EVICTION_POOL_SIZE-1].key != NULL) {
      //不需要插入 LRU时间比里面最小的还大
            /* Can't insert if the element is < the worst element we have
             * and there are no empty buckets. */
            continue;
        } else if (k < REDIS_EVICTION_POOL_SIZE && pool[k].key == NULL) {
            // 插入的地方为空
            /* Inserting into empty position. No setup needed before insert. */
        } else {
            /* Inserting in the middle. Now k points to the first element
             * greater than the element to insert.  */
            // 插入的地方不为空 插入以后我们需要向后移动元素
            if (pool[REDIS_EVICTION_POOL_SIZE-1].key == NULL) {
                /* Free space on the right? Insert at k shifting
                 * all the elements from k to end to the right. */
                memmove(pool+k+1,pool+k,
                    sizeof(pool[0])*(REDIS_EVICTION_POOL_SIZE-k-1));
            } else {
                /* No free space on right? Insert at k-1 */
                k--;
                /* Shift all elements on the left of k (included) to the
                 * left, so we discard the element with smaller idle time. */
                sdsfree(pool[0].key);
                memmove(pool,pool+1,sizeof(pool[0])*k);
            }
        }
        pool[k].key = sdsdup(key);
        pool[k].idle = idle;
    }
    if (samples != _samples) zfree(samples);
}
```

#### dictGetRandomKeys

```java
/*
 * 请注意,此功能仅在需要“采样”给定数量的连续元素以运行某种算法或生成统计信息时才适用,
 * 当您需要很好地分配返回的项目时，此功能不适用.
 * 比dictGetRandomKey()产生N个元素,并且保证这些元素不会重复.
 */
// 第一次看到实现的时候就觉得有点草率,元素多了以后这样的效率就很低,只能导致外层函数freeMemoryIfNeeded不停的循环,效率相对来说不高
// 后来看到看源码的解释 对这一点源码解释中也说的很清楚 因为是随机选择 当你需要高精度控制内存的时候并不适用
// 功能: 从d中取出count项放到des中
int dictGetRandomKeys(dict *d, dictEntry **des, int count) {
    int j; /* internal hash table id, 0 or 1. */
    int stored = 0;
    if (dictSize(d) < count) count = dictSize(d);
    while(stored < count) {
        for (j = 0; j < 2; j++) {
            /* Pick a random point inside the hash table 0 or 1. */
            unsigned int i = random() & d->ht[j].sizemask;
            int size = d->ht[j].size;
            /* Make sure to visit every bucket by iterating 'size' times. */
            while(size--) {
                dictEntry *he = d->ht[j].table[i]; //随机在字典里获取一项
                while (he) {
                    /* Collect all the elements of the buckets found non
                     * empty while iterating. */
                    *des = he;
                    des++;
                    he = he->next;
                    stored++;
                    if (stored == count) return stored;
                }
                i = (i+1) & d->ht[j].sizemask; //我们可以看到是连续的
            }
            /* If there is only one table and we iterated it all, we should
             * already have 'count' elements. Assert this condition. */
            assert(dictIsRehashing(d) != 0);
        }
    }
    return stored; /* Never reached. */
}
```
