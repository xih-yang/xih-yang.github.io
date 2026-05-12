# 06、Redis 源码解析 - Redis 键的过期处理策略
- 来源：https://ddkk.com/zhuanlan/db/redis/7/6.html
- 分类：缓存数据库
- 分组：教程目录
EXPIRE,PEXPARE,EXPIREAT,PEXPAREAT四个命令可以使我们在redis中对某个键进行定时删除,其实内部都是由PEXPAREAT这个命令背后的函数来实现的,因为前三个其实都可以经过简单的转化变成第四个命令.还有就是所有过期的键其实也都存在一个字典中,就是redisdb.expires这个字典中,key为原来的键,值为超时时间,这些专门存在一个字典中,是redis中非常重要的两个字典.我们可以考虑在键删除时的一些问题

**1. 如何使得删除不在一个时间点进行,从而不会在服务器正忙时再火上浇油.

2、** 主从复制中如何处理定时时间,单一的方法可行吗?；

redis中使用`惰性删除和定期删除`两个策略来避免上述问题

#### 惰性删除

**也就是在我们对某个设置过期时间的键被操作时去检查是否超时,如果超时就删除.这样在一定程度上避免了我们上面说到的第一个问题,可以把在同一时间点要删除的数据都分散开,防止流量太大导致服务器宕机.但是如果单单使用这一种情况的话问题是显然的**

**1. 如果过期的键未被操作就会一直存在于内存中,而内存对于redis来说是非常宝贵的.

2、** 如果用主从复制实现读写分离,那样可能主服务器永远无法被"读"到,那样会导致多个服务器内大量的数据冗余；

虽然能够解决一些问题,但似乎带来了更多的问题,以上问题的解决方案就是使用定期删除.

#### 定期删除

在惰性删除的基础上,我们可以在每个时间周期里面执行一个定期删除,这样便可以解决上面的问题,但是定期删除的实现也是很有意思的.**在每次执行定期删除时都会记录执行时间,根据处理时间来判断当前过期的键与未过期的键的疏密程度**,这样可以最大程度的节省资源.

#### 聊聊其他 为什么不是定时器

**从删除策略上来讲其实我们最容易想到的不应该是上面的两种方法,而是使用定时器,在超时时执行回调,在使用时间轮的情况下,我们可以做到O(1)删除超时的元素,最大程度的节省内存.但是可能我们的服务器在当前并不缺少内存,没有必要去节省,所以此时CPU时间应该优先处理请求.而且对于内存数据库这样要求高性能的场合来讲,使用定时器导致的多次系统调用可能也是问题之一(并没有测试),这也许就是redis没有采用定时器来实现超时,而是采用惰性删除和定期删除相结合的方式来实现超时的原因吧.**

#### 惰性删除实现

```java
//在数据库中获取某个键的过期时间
long long getExpire(redisDb *db, robj *key) {
    dictEntry *de; //储存字典中返回的项
    /* No expire? return ASAP */
    // 在expire字典中获取键的过期时间
    // 如果过期时间不存在，那么直接返回
    if (dictSize(db->expires) == 0 ||
       (de = dictFind(db->expires,key->ptr)) == NULL) return -1;
    //这里其实是一个安全检查,如果键在expire字典中,那么肯定是存在在主字典中的
    redisAssertWithInfo(NULL,key,dictFind(db->dict,key->ptr) != NULL);
    // 返回过期时间
    return dictGetSignedIntegerVal(de); 
}
```

基本的执行思路就是先从expire中获取超时的时间点,与现在的时间点进行对比,如果已经超时的话删除键,否则退出.

```java
int expireIfNeeded(redisDb *db, robj *key) {
    // 取出键的过期时间 expire中键不存在返回-1
    mstime_t when = getExpire(db,key);
    mstime_t now;
    // 没有过期时间
    if (when < 0) return 0; /* No expire for this key */
    /* Don't expire anything while loading. It will be done later. */
    // 如果服务器正在进行载入，那么不进行任何过期检查
    if (server.loading) return 0;
    /* If we are in the context of a Lua script, we claim that time is
     * blocked to when the Lua script started. This way a key can expire
     * only the first time it is accessed and not in the middle of the
     * script execution, making propagation to slaves / AOF consistent.
     * See issue1525 on Github for more information. */
    now = server.lua_caller ? server.lua_time_start : mstime();
    /* If we are running in the context of a slave, return ASAP:
     * the slave key expiration is controlled by the master that will
     * send us synthesized DEL operations for expired keys.
     *
     * Still we try to return the right information to the caller, 
     * that is, 0 if we think the key should be still valid, 1 if
     * we think the key is expired at this time. */
    // 当服务器运行在 replication 模式时
    // 附属节点并不主动删除 key
    // 它只返回一个逻辑上正确的返回值
    // 真正的删除操作要等待主节点发来删除命令时才执行
    // 从而保证数据的同步
    if (server.masterhost != NULL) return now > when;
    // 运行到这里，表示键带有过期时间，并且服务器为主节点
    /* Return when this key has not expired */
    // 如果未过期，返回 0
    if (now <= when) return 0;
    //保证这个键存在且过期 我们需要删除且
    /* Delete the key */
    server.stat_expiredkeys++;
    // 向 AOF 文件和附属节点传播过期信息
    propagateExpire(db,key);
    // 发送事件通知
    notifyKeyspaceEvent(REDIS_NOTIFY_EXPIRED,
        "expired",key,db->id);
    // 将过期键从数据库(expire和主字典)中删除
    return dbDelete(db,key);
}
```

#### 定期删除实现

```java
void activeExpireCycle(int type) {
    /* This function has some global state in order to continue the work
     * incrementally across calls. */
    // 静态变量，用来累积函数连续执行时的数据
    static unsigned int current_db = 0; /* Last DB tested. */ //一个计数器
    static int timelimit_exit = 0;      /* Time limit hit in previous call? */ 
    //用于上一次删除是正常退出还是超时退出
    static long long last_fast_cycle = 0; /* When last fast cycle ran. */
    //记录上一次执行这个函数开始的时间
    unsigned int j, iteration = 0;
    // 默认每次处理的数据库数量
    unsigned int dbs_per_call = REDIS_DBCRON_DBS_PER_CALL;
    // 函数开始的时间
    long long start = ustime(), timelimit;
    // 快速模式
    if (type == ACTIVE_EXPIRE_CYCLE_FAST) {
        /* Don't start a fast cycle if the previous cycle did not exited
         * for time limt. Also don't repeat a fast cycle for the same period
         * as the fast cycle total duration itself. */
        // 如果上次函数没有触发 timelimit_exit ，那么不执行处理
        if (!timelimit_exit) return;
        // 如果距离上次执行未够一定时间，那么不执行处理
        if (start < last_fast_cycle + ACTIVE_EXPIRE_CYCLE_FAST_DURATION*2) return;
        // 运行到这里，说明执行快速处理，记录当前时间,方便下次上面那一步的检查
        last_fast_cycle = start; 
    }
    /* We usually should test REDIS_DBCRON_DBS_PER_CALL per iteration, with
     * two exceptions:
     *
     * 一般情况下，函数只处理 REDIS_DBCRON_DBS_PER_CALL 个数据库，
     * 除非：
     *
     * 1) Don't test more DBs than we have.
     *    当前数据库的数量小于 REDIS_DBCRON_DBS_PER_CALL
     * 2) If last time we hit the time limit, we want to scan all DBs
     * in this iteration, as there is work to do in some DB and we don't want
     * expired keys to use memory for too much time. 
     *     如果上次处理遇到了时间上限，那么这次需要对所有数据库进行扫描，
     *     这可以避免过多的过期键占用空间
     */
    if (dbs_per_call > server.dbnum || timelimit_exit)
        dbs_per_call = server.dbnum;
    /* We can use at max ACTIVE_EXPIRE_CYCLE_SLOW_TIME_PERC percentage of CPU time
     * per iteration. Since this function gets called with a frequency of
     * server.hz times per second, the following is the max amount of
     * microseconds we can spend in this function. */
    // 函数处理的微秒时间上限
    // ACTIVE_EXPIRE_CYCLE_SLOW_TIME_PERC 默认为 25 ，也即是 25 % 的 CPU 时间
    timelimit = 1000000*ACTIVE_EXPIRE_CYCLE_SLOW_TIME_PERC/server.hz/100;
    //上面这个式子其实就是timelimit不能超过serverCron()期望运行时间的百分之25
    //式子也可以写成这样 (1000000/server.hz)*(ACTIVE_EXPIRE_CYCLE_SLOW_TIME_PERC/100)
    timelimit_exit = 0;
    if (timelimit <= 0) timelimit = 1; //只有可能是server.hz为负数 此时超时时间设置为一微妙
    // 如果是运行在快速模式之下
    // 那么最多只能运行 FAST_DURATION 微秒 
    // 默认值为 1000 （微秒）
    if (type == ACTIVE_EXPIRE_CYCLE_FAST)
        timelimit = ACTIVE_EXPIRE_CYCLE_FAST_DURATION; /* in microseconds. */
    // 遍历数据库
    for (j = 0; j < dbs_per_call; j++) {
        int expired;
        // 指向要处理的数据库 current_db其实就是一个计数器 每检查一个数据库就加1
        redisDb *db = server.db+(current_db % server.dbnum);
        /* Increment the DB now so we are sure if we run out of time
         * in the current DB we'll restart from the next. This allows to
         * distribute the time evenly across DBs. */
        // 为 DB 计数器加一，如果进入 do 循环之后因为超时而跳出
        // 那么下次会直接从下个 DB 开始处理
        current_db++;
        /* Continue to expire if at the end of the cycle more than 25%
         * of the keys were expired. */
        do {
      //数据库已经选择完毕 在其中查找超时键
            unsigned long num, slots;
            long long now, ttl_sum;
            int ttl_samples;
            /* If there is nothing to expire try next DB ASAP. */
            // 获取数据库中带过期时间的键的数量
            // 如果该数量为 0 ，直接跳过这个数据库
            if ((num = dictSize(db->expires)) == 0) {
                db->avg_ttl = 0;
                break;
            }
            // 获取数据库中键值对的数量
            slots = dictSlots(db->expires);
            // 当前时间
            now = mstime();
            /* When there are less than 1% filled slots getting random
             * keys is expensive, so stop here waiting for better times...
             * The dictionary will be resized asap. */
            // 这个数据库的使用率低于 1% ，也就是字典基本是空的 
            // 跳过，等待字典收缩程序运行 即进行容量减小的rehash
            if (num && slots > DICT_HT_INITIAL_SIZE &&
                (num*100/slots < 1)) break;
            /* The main collection cycle. Sample random keys among keys
             * with an expire set, checking for expired ones. 
             *
             * 样本计数器
             */
            // 已处理过期键计数器
            expired = 0;
            // 键的总 TTL 计数器
            ttl_sum = 0;
            // 总共处理的键计数器
            ttl_samples = 0;
            // 每次最多只能检查 LOOKUPS_PER_LOOP 个键
            if (num > ACTIVE_EXPIRE_CYCLE_LOOKUPS_PER_LOOP)
                num = ACTIVE_EXPIRE_CYCLE_LOOKUPS_PER_LOOP;
            // 开始遍历数据库
            while (num--) {
                dictEntry *de;
                long long ttl;
                // 从 expires 中随机取出一个带过期时间的键
                if ((de = dictGetRandomKey(db->expires)) == NULL) break;
                // 计算 TTL
                ttl = dictGetSignedIntegerVal(de)-now;
                // 如果键已经过期，那么删除它，并将 expired 计数器增一
                if (activeExpireCycleTryExpire(db,de,now)) expired++;
                if (ttl < 0) ttl = 0;
                // 累积键的 TTL
                ttl_sum += ttl;
                // 累积处理键的个数
                ttl_samples++;
            }
            /* Update the average TTL stats for this database. */
            // 为这个数据库更新平均 TTL 统计数据
            if (ttl_samples) {
                // 计算当前平均值
                long long avg_ttl = ttl_sum/ttl_samples;
                // 如果这是第一次设置数据库平均 TTL ，那么进行初始化
                if (db->avg_ttl == 0) db->avg_ttl = avg_ttl;
                /* Smooth the value averaging with the previous one. */
                // 取数据库的上次平均 TTL 和今次平均 TTL 的平均值
                db->avg_ttl = (db->avg_ttl+avg_ttl)/2;
            }
            /* We can't block forever here even if there are many keys to
             * expire. So after a given amount of milliseconds return to the
             * caller waiting for the other active expire cycle. */
            // 我们不能用太长时间处理过期键，超时时间是timelimit
            // 所以这个函数执行一定时间之后就要返回
            // 更新遍历次数
            iteration++;
            // 就算timelimit再小 每遍历 16 次执行一次 
            if ((iteration & 0xf) == 0 && /* check once every 16 iterations. */
                (ustime()-start) > timelimit)
            {
                // 如果遍历次数正好是 16 的倍数
                // 并且遍历的时间超过了 timelimit
                // 设置timelimit_exit为1,这样就代表过期键是很多的 下次还需要再次遍历删除,
                // 如果在这次activeExpireCycle执行期间timelimit_exit为0代表在限定时间内就把指定键删除完了
                // 也就是说超时的键较少 那下次serverCron执行时因为timelimit_exit为0就可以不进行删除了 从而节省时间
                timelimit_exit = 1;
            }
            // 已经超时了，返回
            if (timelimit_exit) return;
            /* We don't repeat the cycle if there are less than 25% of keys
             * found expired in the current DB. */
            // 如果已删除的过期键占我们此次期望检测键的百分之二十五,就不再遍历
        } while (expired > ACTIVE_EXPIRE_CYCLE_LOOKUPS_PER_LOOP/4);
    }
}
```
