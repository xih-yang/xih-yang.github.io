# 25、Redis 源码解析 - Redis 在线增量内存碎片处理
- 来源：https://ddkk.com/zhuanlan/db/redis/7/25.html
- 分类：缓存数据库
- 分组：教程目录
源码版本为6.2.3

这是个非常有意思的特性，因为Redis本身的内存申请借助于jemalloc与自己封装的zmalloc系接口，所以可以很好的实现全局的内存统计与内存池化的功能，但是池化的问题也接踵而至，即内存碎片。这里的碎片概念其实不是我们心中那个经典的碎片的概念，而是有多少内存已分配给Redis进程，但是没有分配给数据，经典的概念是这部分内存由于频繁的分配导致无法被分配，而现在讨论的是可以被分配，但是现在需要存储的数据不需要那么多内存。

使用`info memory`可以看到目前Redis实例的内存碎片有关的信息，所有显示信息中与碎片有关的变量如下：

```java
mem_fragmentation_ratio:1.30
mem_fragmentation_bytes:307584
```

**1、**`mem_fragmentation_ratio`减去1代表碎片比例；

**2、**`mem_fragmentation_bytes`代表已有碎片的字节数；

这里的碎片比例是这样计算的：

```java
// 注释很重要，我留了最有用的一句话
// It is critical to do that by comparing only heap maps that
// belong to jemalloc, and skip ones the jemalloc keeps as spare.
float getAllocatorFragmentation(size_t *out_frag_bytes) {
    size_t resident, active, allocated;
    zmalloc_get_allocator_info(&allocated, &active, &resident);
    float frag_pct = ((float)active / allocated)*100 - 100;
    size_t frag_bytes = active - allocated;
    float rss_pct = ((float)resident / allocated)*100 - 100;
    size_t rss_bytes = resident - allocated;
    if(out_frag_bytes)
        *out_frag_bytes = frag_bytes;
    serverLog(LL_DEBUG,
        "allocated=%zu, active=%zu, resident=%zu, frag=%.0f%% (%.0f%% rss), frag_bytes=%zu (%zu rss)",
        allocated, active, resident, frag_pct, rss_pct, frag_bytes, rss_bytes);
    return frag_pct;
}
```

`frag_pct`就是内存碎片率，`frag_bytes`代表率内存碎片的代销

其中resident, active, allocated三个变量的意义至关重要：

**1、**`resident`：实际使用的物理内存数，但是与OS的RSS不同，这里不包含共享库和othernonheapmappings（这里的我的理解是一般的page分为`Anonymouspage`和`File-backedPages`，前者映射我们熟悉的堆栈，后者一般用于文件缓存，所以这里拿到的其实是进程实际的RSS减去共享库和`File-backedPages`[1]）；

**2、**`active`：与resident不同，这不包括jemalloc保留以供重用的页面(purgewillcleanthat)；

**3、**`allocated`：与zmalloc_used_memory不同，它通过考虑此进程完成的所有分配（不仅是zmalloc）来匹配stats.residentzmalloc的内存计算中**AOFbuffers**以及**slavesoutputbuffers**不被计算在内；

接下里我们来一起来看看Redis增量内存处理的具体实现吧。

### 源码分析

配置中与内存增量碎片处理相关的配置项如下：

```java
# 开启自动内存碎片整理(总开关)
activedefrag yes
# 当碎片达到 100mb 时，开启内存碎片整理
active-defrag-ignore-bytes 100mb
# 当碎片超过 10% 时，开启内存碎片整理
active-defrag-threshold-lower 10
# 内存碎片超过 100%，则尽最大努力整理
active-defrag-threshold-upper 100
# 内存自动整理占用资源最小百分比
active-defrag-cycle-min 25
# 内存自动整理占用资源最大百分比
active-defrag-cycle-max 75
# 要从字典扫描中处理的 set/hash/zset/list 的最大Entry数，
# 大于以后调用defragLater把key加入db.defrag_later这个list
active-defrag-max-scan-fields 1000
```

### activeDefragCycle

实际执行在线增量内存碎片处理的函数是`activeDefragCycle`，在`serverCron`中被调用。

方便大家掌握代码，列出几个变量的含义：

**1、**`stat_active_defrag_hits`：实际执行defrag的obj的命中数（可能某个obj不值得被defrag，由`je_get_defrag_hint`判断）；

**2、**`stat_active_defrag_misses`：；

**3、**`stat_active_defrag_key_hits`：实际执行的db的键的命中数；

**4、**`stat_active_defrag_key_misses`：；

**5、**`stat_active_defrag_scanned`：表示所有键的循环总数，不等于前两者相加，如果key对应的val为hash，key_hit只会增加一次，scann增加hash.size，可以看**defragLaterStep**部分代码；

**6、** ``；

```java
void activeDefragCycle(void) {
    static int current_db = -1;
    static unsigned long cursor = 0;
    static redisDb *db = NULL;
    static long long start_scan, start_stat;
    unsigned int iterations = 0;
    // 记录上一次记录的分配指针数
    unsigned long long prev_defragged = server.stat_active_defrag_hits;
    // 记录上一次执行的defrag数，包括所有成功的和失败的 
    unsigned long long prev_scanned = server.stat_active_defrag_scanned;
    long long start, timelimit, endtime;
    mstime_t latency;
    int quit = 0;
	// 显然如果我们已经通过config把active_defrag_enabled关了。这个过程就不该继续了。
    if (!server.active_defrag_enabled) {
     	// 总开关
        if (server.active_defrag_running) {
     	// 碎片处理过程是否正在进行
            /* if active defrag was disabled mid-run, start from fresh next time. */
            server.active_defrag_running = 0;
            if (db)
                listEmpty(db->defrag_later);
            defrag_later_current_key = NULL;
            defrag_later_cursor = 0;
            current_db = -1;
            cursor = 0;
            db = NULL;
        }
        return;
    }
	// 不管是AOF重写，RDB save还是子进程载入module都不能执行增量内存处理
    if (hasActiveChildProcess())
        return; /* Defragging memory while there's a fork will just do damage. */
	// 每秒执行一次，检测是否需要进行内存增量处理，修改active_defrag_running，其表示CPU预期利用率
    run_with_period(1000) {
        computeDefragCycles();
    }
    // 上面如果没改active_defrag_running，证明算出来的frag_pct低于初始我们设置的阈值
    if (!server.active_defrag_running)
        return;
    /* See activeExpireCycle for how timelimit is handled. */
    start = ustime();
    // 用上面算出来的CPU利用率算一个一秒之内可以用于碎片处理的时间，个人认为下面的式子这样写更直观
    timelimit = 1000000*server.active_defrag_running/server.hz/100;
    if (timelimit <= 0) timelimit = 1;
    endtime = start + timelimit;
    // 用于Redis Latency Monitoring，有兴趣的同学可以了解下这个破玩意，这篇文章不讨论。
    latencyStartMonitor(latency);
    do {
        /* if we're not continuing a scan from the last call or loop, start a new one */
        if (!cursor) {
            // defragLaterStep实际在defrag db.defrag_later中的大key
            if (db && defragLaterStep(db, endtime)) {
                quit = 1; /* time is up, we didn't finish all the work */
                break; /* this will exit the function and we'll continue on the next cycle */
            }
			// 每超时的话继续scan正常的数据库
            /* Move on to next database, and stop if we reached the last one. */
            if (++current_db >= server.dbnum) {
                /* defrag other items not part of the db / keys */
                // 去defrag一些除了data数据以外的meta数据，比如server.lua_scripts，server.repl_scriptcache_fifo，module等，
                // 注意这里并没有记录endtime，所以实际执行时间可能比timelimit大不少
                defragOtherGlobals();
                long long now = ustime();
                size_t frag_bytes;
                // 重新计算碎片率，
                float frag_pct = getAllocatorFragmentation(&frag_bytes);
                serverLog(LL_VERBOSE,
                    "Active defrag done in %dms, reallocated=%d, frag=%.0f%%, frag_bytes=%zu",
                    (int)((now - start_scan)/1000), (int)(server.stat_active_defrag_hits - start_stat), frag_pct, frag_bytes);
                start_scan = now;
                current_db = -1;
                cursor = 0;
                db = NULL;
                server.active_defrag_running = 0;
                computeDefragCycles(); /* if another scan is needed, start it right away */
                // 碎片率如果够的话继续执行defrag，所以有一种可能，就是阈值设置的比较低，defrag会一直进行，导致CPU占比很高
                if (server.active_defrag_running != 0 && ustime() < endtime)
                    continue;
                break;
            }
            else if (current_db==0) {
                /* Start a scan from the first database. */
                // 第一次进来其实到这，更新下初始状态
                start_scan = ustime();
                start_stat = server.stat_active_defrag_hits;
            }
            db = &server.db[current_db];
            cursor = 0;
        }
        do {
     	// 这里如果break出去也会跳出外面的循环，因为一定会修改quit
            /* before scanning the next bucket, see if we have big keys left from the previous bucket to scan */
            if (defragLaterStep(db, endtime)) {
                quit = 1; /* time is up, we didn't finish all the work */
                break; /* this will exit the function and we'll continue on the next cycle */
            }
			// 执行增量删除的关键，传入defragScanCallback回调，在遍历字典时进行增量删除
            cursor = dictScan(db->dict, cursor, defragScanCallback, defragDictBucketCallback, db);
            // 当16 scan iterations, 512 pointer reallocations or 64 keys这三个条件满足时判断一下时间
            if (!cursor || (++iterations > 16 ||
                            server.stat_active_defrag_hits - prev_defragged > 512 ||
                            server.stat_active_defrag_scanned - prev_scanned > 64)) {
                if (!cursor || ustime() > endtime) {
                    quit = 1;
                    break;
                }
                // 一轮迭代完成，进行下一轮迭代，足以看出时间是很宽松的限制在endtime内，粒度为一个循环
                iterations = 0;
                prev_defragged = server.stat_active_defrag_hits;
                prev_scanned = server.stat_active_defrag_scanned;
            }
        } while(cursor && !quit);
    } while(!quit);
    latencyEndMonitor(latency);
    latencyAddSampleIfNeeded("active-defrag-cycle",latency);
}
```

### defragScanCallback

我们来看看`defragScanCallback`，其是在游标遍历当时候执行的回调，他其实是一个wrapper，`defragKey`才是实际执行碎片处理的函数。

```java
void defragScanCallback(void *privdata, const dictEntry *de) {
	// 大boss
    long defragged = defragKey((redisDb*)privdata, (dictEntry*)de);
    // 下面就是更新上面控制循环的那三个指标
    // defragged为pointer reallocations的总数
    server.stat_active_defrag_hits += defragged;
    if(defragged)	// 这个是实际执行碎片处理的键的总数
        server.stat_active_defrag_key_hits++;
    else			// 执行了defragKey，但是没有一个指针被移动，算一次miss
        server.stat_active_defrag_key_misses++;
    // 共遍历了多少个键
    server.stat_active_defrag_scanned++;
}
```

`defragKey`具体就不看了，其中根据不同的编码执行不同的`activeDefrag`族函数，举个简单的例子看看，即更新每个Entry的key的时候。

```java
// 执行键的增量碎片处理，可以看到activeDefragAlloc是大大boss
sds activeDefragSds(sds sdsptr) {
    void* ptr = sdsAllocPtr(sdsptr);
    void* newptr = activeDefragAlloc(ptr);
    if (newptr) {
        size_t offset = sdsptr - (char*)ptr;
        sdsptr = (char*)newptr + offset;
        return sdsptr;
    }
    return NULL;
}
```

实际执行碎片处理的函数

```java
void* activeDefragAlloc(void *ptr) {
    size_t size;
    void *newptr;
    // jemalloc提供的函数，可以让我们了解哪些指针值得移动，哪些不值得
    if(!je_get_defrag_hint(ptr)) {
        server.stat_active_defrag_misses++;
        return NULL;
    }
    /* move this allocation to a new allocation.
     * make sure not to use the thread cache. so that we don't get back the same
     * pointers we try to free */
    size = zmalloc_size(ptr);
    newptr = zmalloc_no_tcache(size);
    memcpy(newptr, ptr, size);
    zfree_no_tcache(ptr);
    return newptr;
}
```

### defragLaterStep

我们来看看前面遗漏的函数`defragLaterStep`和`defragOtherGlobals`，分别用于清除`db.defrag_later`中的数据和defrag一些除了data数据以外的meta数据，比如server.lua_scripts，server.repl_scriptcache_fifo，module等。

`defrag_later`在各类对象的defrag函数中被修改。

```java
int defragLaterStep(redisDb *db, long long endtime) {
    unsigned int iterations = 0;
    // 可以看到合著循环非常像
    unsigned long long prev_defragged = server.stat_active_defrag_hits;
    unsigned long long prev_scanned = server.stat_active_defrag_scanned;
    long long key_defragged;
    do {
        /* if we're not continuing a scan from the last call or loop, start a new one */
        if (!defrag_later_cursor) {
            listNode *head = listFirst(db->defrag_later);
            /* Move on to next key */
            if (defrag_later_current_key) {
                serverAssert(defrag_later_current_key == head->value);
                listDelNode(db->defrag_later, head);
                defrag_later_cursor = 0;
                defrag_later_current_key = NULL;
            }
            /* stop if we reached the last one. */
            head = listFirst(db->defrag_later);
            if (!head)
                return 0;
            /* start a new key */
            defrag_later_current_key = head->value;
            defrag_later_cursor = 0;
        }
        /* each time we enter this function we need to fetch the key from the dict again (if it still exists) */
        dictEntry *de = dictFind(db->dict, defrag_later_current_key);
        key_defragged = server.stat_active_defrag_hits;
        do {
            int quit = 0;
            if (defragLaterItem(de, &defrag_later_cursor, endtime))
                quit = 1; /* time is up, we didn't finish all the work */
            /* Once in 16 scan iterations, 512 pointer reallocations, or 64 fields
             * (if we have a lot of pointers in one hash bucket, or rehashing),
             * check if we reached the time limit. */
            if (quit || (++iterations > 16 ||
                            server.stat_active_defrag_hits - prev_defragged > 512 ||
                            server.stat_active_defrag_scanned - prev_scanned > 64)) {
                if (quit || ustime() > endtime) {
                    if(key_defragged != server.stat_active_defrag_hits)
                        server.stat_active_defrag_key_hits++;
                    else
                        server.stat_active_defrag_key_misses++;
                    return 1;
                }
                iterations = 0;
                prev_defragged = server.stat_active_defrag_hits;
                prev_scanned = server.stat_active_defrag_scanned;
            }
        } while(defrag_later_cursor);
        // 这里可以看到，server.stat_active_defrag_key_hits和erver.stat_active_defrag_key_misses相加不一定等于scan
        if(key_defragged != server.stat_active_defrag_hits)
            server.stat_active_defrag_key_hits++;
        else
            server.stat_active_defrag_key_misses++;
    } while(1);
}
```

```java
long defragOtherGlobals() {
    long defragged = 0;
    /* there are many more pointers to defrag (e.g. client argv, output / aof buffers, etc.
     * but we assume most of these are short lived, we only need to defrag allocations
     * that remain static for a long time */
    // 后面是个会有不少变动的函数
    defragged += activeDefragSdsDict(server.lua_scripts, DEFRAG_SDS_DICT_VAL_IS_STROB);
    defragged += activeDefragSdsListAndDict(server.repl_scriptcache_fifo, server.repl_scriptcache_dict, DEFRAG_SDS_DICT_NO_VAL);
    defragged += moduleDefragGlobals();
    return defragged;
}
```

### 总结

一个非常牛B的功能，但是其实就代码的实现来看这个框架并不复杂，复杂的是为什么判断一下`je_get_defrag_hint`，然后`zmalloc_no_tcache`一下碎片就会减小，这个后面有时间的再写一篇文章吧。

至于为什么不复杂还有这么多代码，一来这个功能已经经过两个版本的迭代，臃肿是必然的；其次每种数据结构的处理都不太一样，导致`defrag_later`这样的功能要实现非常的麻烦。

但是对我们来说懂得其参数怎么调就可以，最好后面自己撸一些个性化板块的时候知道改`defragOtherGlobals`是个很好的减少内存碎片的方法。

还有就是在Redis出现毛刺的时候注意下`defrag`板块，这里的设计导致出现毛刺的概率很大，而且跑的时候很占CPU，而且一时半会还停不下，试问618，双11出现这种情况怎么办？这是没办法想象的。还好`config set activedefrag no`一下可以在最多（1+`defragOtherGlobals`执行时间）秒的执行时间内使得Redis实例从defrag中恢复过来。
