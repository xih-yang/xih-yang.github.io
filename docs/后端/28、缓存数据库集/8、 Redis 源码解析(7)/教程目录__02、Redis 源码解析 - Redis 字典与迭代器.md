# 02、Redis 源码解析 - Redis 字典与迭代器
- 来源：https://ddkk.com/zhuanlan/db/redis/7/2.html
- 分类：缓存数据库
- 分组：教程目录
字典这个结构是redis中非常重要的一种结构,其不仅可以作为数据库的结构,还可以作为哈希表的结构,是一个非常重要的数据结构,这篇文章先列出其中重要的数据结构,然后重点分析dictAdd,由此推出扩容策略与渐进式rehash.

```java
//哈希表结点
typedef struct dictEntry {
    // 键 用于哈希冲突的时候进行比较 
    void *key;
    // 存储值 很巧妙 使得哈希表中的值可以存任何类型,其十分节省内存
    union {
        void *val;
        uint64_t u64;
        int64_t s64;
    } v;
    // 指向下个哈希表节点，形成链表 防止哈希冲突
    struct dictEntry *next;
} dictEntry;
//哈希表
typedef struct dictht {
    // 哈希表数组  一个指针数组
    dictEntry table;
    // 哈希表大小
    unsigned long size;
    // 哈希表大小掩码，用于计算索引值
    // 总是等于 size - 1
    unsigned long sizemask;
    // 该哈希表已有节点的数量 用于O(1)计算size与计算负载因子
    unsigned long used;
} dictht;
/*
 * 字典
 */
typedef struct dict {
    // 类型特定函数
    dictType *type;
    // 私有数据
    void *privdata;
    // 哈希表 两个的原因是用作在扩容和减少容量的时候rehash
    dictht ht[2];
    // 判断rehash是否进行 当 rehash 不在进行时，值为 -1
    int rehashidx; /* rehashing not in progress if rehashidx == -1 */
    // 目前正在运行的安全迭代器的数量 文章后面会详细说说这个
    int iterators; /* number of iterators currently running */
} dict;
```

```java
int dictAdd(dict *d, void *key, void *val)
{
	//把键插入到字典中 其中可能会扩容(rehash) 这是重中之重
    dictEntry *entry = dictAddRaw(d,key);
	//键已经存在 插入失败 返回错误
    if (!entry) return DICT_ERR;
	//键插入好了 当然需要值啦
    dictSetVal(d, entry, val);
    return DICT_OK;
}
```

```java
dictEntry *dictAddRaw(dict *d, void *key)
{
    int index;
    dictEntry *entry;
    dictht *ht;
    //如果运行的安全 安全迭代器数量为零的话才会进行单步rehash,其中会跳过为NULL的entry
    //为什么安全迭代器数量为零的话才会进行单步rehash呢?原因是为了保证安全迭代器的安全性,
    //防止一次迭代器遍历中一个entry被遍历了两次 当迭代器遍历和rehash同时进行时就会有这种情况
    if (dictIsRehashing(d)) _dictRehashStep(d);
    /* Get the index of the new element, or -1 if
     * the element already exists. */
    // 计算键在哈希表中的索引值
    // 如果值为 -1 ，那么表示键已经存在
    // 如果正在进行rehash 返回的index是ht[1]中需要插入的下标 否则返回ht[0]中的索引
    if ((index = _dictKeyIndex(d, key)) == -1)
        return NULL;
    /* Allocate the memory and store the new entry */
    //因为上面我们根据现在是否进行rehash返回的索引不同,所以这里要判断返回的所以是ht[0]上的还是ht[1]上的.
    ht = dictIsRehashing(d) ? &d->ht[1] : &d->ht[0];
    // 为新节点分配空间
    entry = zmalloc(sizeof(*entry));
    // 将新节点插入到链表表头 原因是我们并没有维护尾部结点 这样可以保证O(1)的插入,而且和尾插是一样的(硬要说局部性那就没办法了)
    entry->next = ht->table[index]; 
    ht->table[index] = entry;
    // 更新哈希表已使用节点数量
    ht->used++;
	//entry中肯定是要保存key的 不然没办法处理哈希冲突 每一个key在哈希冲突以后需要在对应的桶中比较嘛
    dictSetKey(d, entry, key); 
	//返回分配好的entry
    return entry;
}
```

渐进式rehash是redis中哈希表的一大特色,这样可以避免同一时间服务器的压力过大,如果服务器中的键值对有上千万个或者更多,如果在同一时间进行转移,服务器将会有巨大的压力,所以有了渐进式rehash这么个东西,我们来看看其实现,

```java
int dictRehash(dict *d, int n) {
    // 只可以在rehash进行中时执行 这没什么毛病 相当于一个检测了
    if (!dictIsRehashing(d)) return 0;
	//传入的n的意思是把n个有值的项从ht[0]转移到ht[1].
    while(n--) {
        dictEntry *de, *nextde;
        /* Check if we already rehashed the whole table... */
        //如果发现ht[0]中值存在的元素为0,代表我们已经完成了这次rehash,释放ht[0]的资源
        if (d->ht[0].used == 0) {
            zfree(d->ht[0].table);
            // 将ht[1]设置为ht[0]
            d->ht[0] = d->ht[1];
            // 重置旧的 1 号哈希表
            _dictReset(&d->ht[1]);
            // 关闭 rehash 标识
            d->rehashidx = -1;
            //只有两个返回值 0代表此次rehash已经完成 1代表未完成(返回1的时候可能已经完成,但外界不知道而已) 
            return 0;
        }
        /* Note that rehashidx can't overflow as we are sure there are more
         * elements because ht[0].used != 0 */
        // 确保 rehashidx 没有越界
        assert(d->ht[0].size > (unsigned)d->rehashidx);
       	 //找到一个非空就退出 不然可能会有多次单步rehash是无效的 这也意味着有效值在rehash时存在在两张表中
        while(d->ht[0].table[d->rehashidx] == NULL) d->rehashidx++;
        // 指向该索引的链表表头节点
        de = d->ht[0].table[d->rehashidx];
        /* Move all the keys in this bucket from the old to the new hash HT */
        // 将链表中的所有节点迁移到新哈希表
        while(de) {
            unsigned int h;
            // 保存下个节点的指针
            nextde = de->next;
            /* Get the index in the new hash table */
            // 计算新哈希表的哈希值，以及节点插入的索引位置
            h = dictHashKey(d, de->key) & d->ht[1].sizemask;
            // 插入节点到新哈希表
            de->next = d->ht[1].table[h];
            d->ht[1].table[h] = de;
            // 更新计数器
            d->ht[0].used--;
            d->ht[1].used++;
            // 继续处理下个节点
            de = nextde;
        }
        // 将刚迁移完的哈希表索引的指针设为空
        d->ht[0].table[d->rehashidx] = NULL;
        // 更新 rehash 索引
        d->rehashidx++;
    }
    return 1;
}
```

这里是dictAddRaw中涉及到的rehash部分,我们看到其实就是在每次add时如何正在rehash就进行一次单步rehash,这样做的话有效值会分配在两张表中.那么可以每次只转移我们需要的部分吗?因为我们只需要用key计算出哈希值以后对ht[1]计算索引很容易就可以由是否为null判断是否已经被转移,而且也是O(1)的.这样是有问题的,问题在于如果每次只操作某个固定区间的值,回导致rehash永远不结束,而下面rehash在进行中的时候是不能进行扩容的,这样就会导致负载因子变得很大,从而降低哈希表的效率,最差情况就会变成O(n),丧失了哈希表的优点.我们来看看dictKeyIndex

```java
static int _dictKeyIndex(dict *d, const void *key)
{
    unsigned int h, idx, table;
    dictEntry *he;
    /* Expand the hash table if needed */
    // 单步 rehash
    // T = O(N)
    //如果需要扩容 会为ht[1]分配资源 默认为目前已使用节点数的两倍 并设置d->rehashidx为0 也就是开始扩容
    //当然其中还有一种情况 就是默认其实没有为ht[0]分配内存,当第一次add时 只会为ht[0]分配资源
    if (_dictExpandIfNeeded(d) == DICT_ERR)
        return -1;
    /* Compute the key hash value */
    // 计算 key 的哈希值
    h = dictHashKey(d, key);
    // T = O(1)
    for (table = 0; table <= 1; table++) {
        // 由掩码计算索引值
        idx = h & d->ht[table].sizemask;
        /* Search if this slot does not already contain the given key */
        // 查找 key 是否存在        he = d->ht[table].table[idx];
        while(he) {
            if (dictCompareKeys(d, key, he->key))
                return -1; //找到相同的key 
            he = he->next;
        }
        // 如果运行到这里时，说明 0 号哈希表中所有节点都不包含 key
        // 上面提到rehash在进行时,有效的值是分布在两张表中的,所以需要在两张表中查找
        if (!dictIsRehashing(d)) break;
    }
    // 返回索引值 方便O(1)键与值进行关联
    return idx;
}
```

```java
static int _dictExpandIfNeeded(dict *d)
{
    /* Incremental rehashing already in progress. Return. */
    // 渐进式 rehash 已经在进行了，直接返回 这也是上面那一大段话中提到的问题,当rehash正在进行时不会再次扩容了
    if (dictIsRehashing(d)) return DICT_OK;
    /* If the hash table is empty expand it to the initial size. */
    // 如果字典（的 0 号哈希表）为空,为ht[0]分配空间
    if (d->ht[0].size == 0) return dictExpand(d, DICT_HT_INITIAL_SIZE);
    /* If we reached the 1:1 ratio, and we are allowed to resize the hash
     * table (global setting) or we should avoid it but the ratio between
     * elements/buckets is over the "safe" threshold, we resize doubling
     * the number of buckets. */
    // 一下两个条件之一为真时，对字典进行扩展
    // 1）字典已使用节点数和字典大小之间的比率接近 1：1
    //    并且 dict_can_resize 为真 当我们进行后台持久化的时候会设置这个值 此时会产生子进程 不希望此时进行扩容 
    	//这里有疑问 当子进程exec以后与父进程就没关系了呀,为什么要在子进程存在的时候节约内存而把ratio设置成5呢?
    // 2）已使用节点数和字典大小之间的比率超过 dict_force_resize_ratio 5
    if (d->ht[0].used >= d->ht[0].size &&
        (dict_can_resize ||
         d->ht[0].used/d->ht[0].size > dict_force_resize_ratio))
    {
        // 新哈希表的大小至少是目前已使用节点数的两倍
        return dictExpand(d, d->ht[0].used*2);
    }
    return DICT_OK;
}
```

我们再来看看dictExpand这个扩容的本尊,值得一提的是它不仅可以扩容,也可以减小容量,此时也会触发rehash,减小容量的函数是dictResize,其实就是计算了让扩容因子接近1的最小节点 (大于等于4),然后对这个新的小表进行rehash.

```java
int dictExpand(dict *d, unsigned long size)
{
    // 新哈希表
    dictht n; /* the new hash table */
    // 根据 size 参数 计算哈希表的大小 其实就是大于等于size的第一个2的幂
    unsigned long realsize = _dictNextPower(size);
    /* the size is invalid if it is smaller than the number of
     * elements already inside the hash table */
    // 不能在字典正在 rehash 时进行
    // size 的值也不能小于 0 号哈希表的当前已使用节点
    if (dictIsRehashing(d) || d->ht[0].used > size)
        return DICT_ERR;
    /* Allocate the new hash table and initialize all pointers to NULL */
    // 为哈希表分配空间，并将所有指针指向 NULL
    n.size = realsize;
    n.sizemask = realsize-1;
    // T = O(N)
    n.table = zcalloc(realsize*sizeof(dictEntry*));
    n.used = 0;
    /* Is this the first initialization? If so it's not really a rehashing
     * we just set the first hash table so that it can accept keys. */
    // 如果 0 号哈希表为空，那么这是一次初始化：
    // 程序将新哈希表赋给 0 号哈希表的指针，然后字典就可以开始处理键值对了。
    if (d->ht[0].table == NULL) {
      //这也是我们在_dictExpandIfNeeded是提到的问题 第一次操作时进行初始化
        d->ht[0] = n;
        return DICT_OK;
    }
    /* Prepare a second hash table for incremental rehashing */
    // 如果 0 号哈希表非空，那么这是一次 rehash ：
    // 程序将新哈希表设置为ht[1]
    // 设置字典的rehash rehash开始
    d->ht[1] = n;
    d->rehashidx = 0;
    return DICT_OK;
}
```

dictAdd说完了,我们可以看到其实其中的重点就在于渐进式rehash,这是一个很重要的特性.为了更加好好理解其含义.我们再来看看dictFind这个函数,这其中也会涉及到渐进式rehash

```java
dictEntry *dictFind(dict *d, const void *key)
{
    dictEntry *he;
    unsigned int h, idx, table;
    // 字典（的哈希表）为空
    if (d->ht[0].size == 0) return NULL; /* We don't have a table at all */
    // 进行单步rehash 上面已经说过这个问题
    if (dictIsRehashing(d)) _dictRehashStep(d);
    // 计算键的哈希值
    h = dictHashKey(d, key);
    // 在字典的哈希表中查找这个键
    // T = O(1)
    for (table = 0; table <= 1; table++) {
        // 计算索引值
        idx = h & d->ht[table].sizemask;
        // 遍历给定索引上的链表的所有节点，查找 key
        he = d->ht[table].table[idx];
        while(he) {
            if (dictCompareKeys(d, key, he->key))
                return he;
            he = he->next;
        }
		//如果找完ht[0],没有找到且正在进行rehash的话,我们需要再去找ht[1]
		//上面已经说过 此时有效值是存在两张表中的
        if (!dictIsRehashing(d)) return NULL;
    }
    // 进行到这里时，说明两个哈希表都没找到
    return NULL;
}
```

其实删除操作和查询操作逻辑上来说基本是一样的,都需要在开始时判断是否进行单步rehash,然后找到对应的值,一个返回一个删除罢了.接下来我们看看迭代器,我们首先来看看结构

```java
typedef struct dictIterator {
    // 被迭代的字典
    dict *d;
    int table, index, safe;
	//table取值只有两种结果 即0或1
	//index是当前遍历到的哈希桶的序号
	//这个迭代器是否是安全的 下面会说
    // entry ：当前迭代到的节点的指针
    // nextEntry ：当前迭代节点的下一个节点
    //             因为在安全迭代器运作时， entry 所指向的节点可能会被修改，
    //             所以需要一个额外的指针来保存下一节点的位置，
    //             从而防止指针丢失
    dictEntry *entry, *nextEntry;
    long long fingerprint; /* unsafe iterator fingerprint for misuse detection */
	//非安全迭代器要使用的验证机制 指纹 原理是通过比较指纹来判断迭代器遍历时是否会出现重复遍历的情况 下面会说
} dictIterator;
```

上面提到了一个概念,就是安全迭代器与非安全迭代器,这两者间有什么差别呢,我们知道redis的rehash是渐进式的,也就是说在rehash的时候有效的值是分配在两张表上的,如果不对迭代器做什么的话,有可能刚把第一张表遍历完,遍历过的entry又被转移到第二张表上了,这样就会有问题,所以当redis的某个字典中存在安全迭代器的时候,是无法进行rehash的,看一个示例 dictRehashStep

```java
static void _dictRehashStep(dict *d) {
    if (d->iterators == 0) dictRehash(d,1);
}
```

我们看到在进行单步rehash的时候会对当前字典中安全迭代器的数量进行判断,有一个也不能进行rehash.

安全迭代器和非安全迭代器之间到底有什么区别呢?我们来看看构造函数

```java
dictIterator *dictGetIterator(dict *d)
{
    dictIterator *iter = zmalloc(sizeof(*iter));
    iter->d = d;
    iter->table = 0; //默认ht[0]
    iter->index = -1;
    iter->safe = 0; //非安全迭代器
    iter->entry = NULL;
    iter->nextEntry = NULL;
    return iter;
}
dictIterator *dictGetSafeIterator(dict *d) {
    dictIterator *i = dictGetIterator(d);
    // 设置安全迭代器标识
    i->safe = 1;
    return i;
}
```

很显然在构造上来说区别只有safe而已,安全为1,非安全为0.

我们在来看看这种迭代器怎么进行遍历

```java
//一次只迭代一次 但会指向的当前entry
dictEntry *dictNext(dictIterator *iter)
{
    while (1) {
        // 进入这个if判断有两种可能：
        // 1) 这是迭代器第一次运行
        // 2) 当前索引链表中的节点已经迭代完（NULL 为链表的表尾）
        //    也就是说当表一结束的时候也会进入这个值切换表
        if (iter->entry == NULL) {
            // 指向被迭代的哈希表
            dictht *ht = &iter->d->ht[iter->table];
            // 初次迭代时执行
            if (iter->index == -1 && iter->table == 0) {
                // 如果是安全迭代器，那么更新安全迭代器计数器
                if (iter->safe)
                    iter->d->iterators++;
                // 如果是不安全迭代器，那么计算指纹
                else
                    iter->fingerprint = dictFingerprint(iter->d);
            }
            // 更新索引
            iter->index++;
            // 如果迭代器的当前索引大于当前被迭代的哈希表的大小
            // 那么说明当前这个哈希表已经迭代完毕
            if (iter->index >= (signed) ht->size) {
                // 如果正在 rehash 的话，那么说明ht[1]也正在使用中
                if (dictIsRehashing(iter->d) && iter->table == 0) {
                    iter->table++;
                    iter->index = 0;
                    ht = &iter->d->ht[1];
                // 如果没有 rehash ，那么说明迭代已经完成
                } else {
                    break;
                }
            }
            // 如果进行到这里，说明这个哈希表并未迭代完
            // 更新节点指针，指向下个索引链表的表头节点
            iter->entry = ht->table[iter->index];
        } else {
            // 执行到这里，说明程序正在迭代某个链表
            // 将节点指针指向链表的下个节点
            iter->entry = iter->nextEntry;
        }
        // 如果当前节点不为空，那么也记录下该节点的下个节点
        // 因为安全迭代器有可能会将迭代器返回的当前节点删除
        if (iter->entry) {
            /* We need to save the 'next' here, the iterator user
             * may delete the entry we are returning. */
            iter->nextEntry = iter->entry->next;
            return iter->entry; //结束的时候也会return NULL
        }
    }
    // 进行到这里说明迭代完成了 直接退出
    return NULL;
}
```

我们再来看看计算指纹的函数

```java
long long dictFingerprint(dict *d) {
    long long integers[6], hash = 0;
    int j;
    integers[0] = (long) d->ht[0].table;
    integers[1] = d->ht[0].size;
    integers[2] = d->ht[0].used;
    integers[3] = (long) d->ht[1].table;
    integers[4] = d->ht[1].size;
    integers[5] = d->ht[1].used;
    /* We hash N integers by summing every successive integer with the integer
     * hashing of the previous sum. Basically:
     *
     * Result = hash(hash(hash(int1)+int2)+int3) ...
     *
     * This way the same set of integers in a different order will (likely) hash
     * to a different number. */
    for (j = 0; j < 6; j++) {
        hash += integers[j];
        /* For the hashing step we use Tomas Wang's 64 bit integer hash. */
        hash = (~hash) + (hash << 21); // hash = (hash << 21) - hash - 1;
        hash = hash ^ (hash >> 24);
        hash = (hash + (hash << 3)) + (hash << 8); // hash * 265
        hash = hash ^ (hash >> 14);
        hash = (hash + (hash << 2)) + (hash << 4); // hash * 21
        hash = hash ^ (hash >> 28);
        hash = hash + (hash << 31);
    }
    return hash;
}
```

可以看到其实就是一个计算哈希的过程,它使用到了两张表的table,size和used字段,也就是如果发生修改或者rehash,这个指纹就会改变,如果发生改变,就可能对我们的遍历的结果造成影响.所以说指纹的存在可以很好的发现是否进行了rehash.

我们可以看看Redis源码中对指纹的描述

> Afingerprint is a 64 bit number that represents the state of the dictionary at a given time, it’s just a few dict properties xored together.When an unsafe iterator is initialized, we get the dict fingerprint, and check the fingerprint again when the iterator is released.If the two fingerprints are different it means that the user of the iterator performed forbidden operations against the dictionary while iterating.

> 指纹是一个64位的数字代表了当前时间字典的状态,这只是将几个字典的属性亦或在一起,当一个不安全的迭代器被初始化的时候,我们会得到字典的指纹,而且会在其被释放时检查它,如果两个指纹不同的话就意味着在迭代器迭代的时候执行了被禁止的操作.

我们可以看到只有在迭代器被释放时才会检查,也就是说在实际操作过程中其实与安全迭代器除了安全迭代器会禁止rehash以外就没什么区别了.显然安全迭代器是一个非常粗暴的方法,这会使得在进行一个很大的字典的遍历的时候服务器巨慢无比,典型的例子就是keys,这也许就是Twemproxy禁止了这个命令的原因吧.我们当然有更优秀的遍历方法,就是SCAN.
