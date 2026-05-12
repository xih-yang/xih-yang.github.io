# 08、Redis 源码解析 - Redis 基本类型dict
- 来源：https://ddkk.com/zhuanlan/db/redis/6/8.html
- 分类：缓存数据库
- 分组：教程目录
### dict设计与实现

dict是Redis中使用最多的数据结构，比如：RedisDb中存储KV对，Set、Dict等类型的底层数据结构等等都是用的dict。Redis中的dict采用开链法解决hash冲突，从三个方面看dict的设计：节点、hash表、迭代器：

```java
typedef struct dictEntry {
    void *key;
    union {
        void *val;
        uint64_t u64;
        int64_t s64;
        double d;
    } v;
    struct dictEntry *next;
} dictEntry;
typedef struct dictType {
    uint64_t (*hashFunction)(const void *key);
    void *(*keyDup)(void *privdata, const void *key);
    void *(*valDup)(void *privdata, const void *obj);
    int (*keyCompare)(void *privdata, const void *key1, const void *key2);
    void (*keyDestructor)(void *privdata, void *key);
    void (*valDestructor)(void *privdata, void *obj);
} dictType;
typedef struct dictht {
    dictEntry **table;
    unsigned long size;
    unsigned long sizemask;
    unsigned long used;
} dictht;
typedef struct dict {
    dictType *type;
    void *privdata;
    dictht ht[2];
    long rehashidx; /* rehashing not in progress if rehashidx == -1 */
    unsigned long iterators; /* number of iterators currently running */
} dict;
typedef struct dictIterator {
    dict *d;
    long index;
    int table, safe;
    dictEntry *entry, *nextEntry;
    /* unsafe iterator fingerprint for misuse detection. */
    long long fingerprint;
} dictIterator;
```

struct dict有5个字段：

**1、** type：名义上是dict类型，实际上定义了dict所需要的6个函数：；

hashFunction： hash函数，用户计算key的hash值

keyDup：key复制函数

valDup：value复制函数

keyCompare：key比较函数

keyDestructor：key释放函数

valDestructor：value释放函数

在server.c中定义了很多dictType，用来生成不同用途的dict，比如用来存储KV的dict，key的类型是sds，value的类型是object*：

```java
/* Db->dict, keys are sds strings, vals are Redis objects. */
dictType dbDictType = {
    dictSdsHash,                /* hash function */
    NULL,                       /* key dup */
    NULL,                       /* val dup */
    dictSdsKeyCompare,          /* key compare */
    dictSdsDestructor,          /* key destructor */
    dictObjectDestructor   /* val destructor */
};
```

**1、** privdata：dict的私有变量，上面dictType有些函数的第一个参数；

**2、** ht[2]：大小为2的hash表数组，2个hash表是为了渐进式rehash做准备，下面会详细介绍；

**3、** rehashidx：rehash时hash表中正在rehash的链表数组下标；

**4、** iterators：正在对该dict进行遍历的安全迭代器个数这个字段的作用是为了解决对在通过迭代器遍历dict时，如果dict有添加、删除等更新操作的冲突问题dict提供了如下两个创建迭代器的函数，区别是创建出来的迭代器的safe字段是否为1，如果为1，说明该迭代器在迭代期间允许dict添加、删除、查找节点，否则，不允许上述操作，只允许迭代器的Next()操作；

```java
dictIterator *dictGetIterator(dict *d);
dictIterator *dictGetSafeIterator(dict *d);
```

下面看一下hash表结构，有4个字段：

**1、** table：dictEntry的二级指针，开链法解决hash冲突；

**2、** size：dictEntry的数组大小；

**3、** sizemask：数据掩码，方便进行位运算；

**4、** used：hash表中KV对个数；

最后是节点dictEntry结构，有三个字段：

**1、** key：key的指针，需要表示多种类型，所以是void*；

**2、** v：是个union，union中每中类型都是64位，方便表示不同类型的value；

**3、** next：dictEntry指针，单向链表；

### dict相关API实现

有了上面数据结构的实现，API的实现就很明显了，以添加KV对为例：dictAdd

```java
int dictAdd(dict *d, void *key, void *val)
{
    dictEntry *entry = dictAddRaw(d,key,NULL);
    if (!entry) return DICT_ERR;
    dictSetVal(d, entry, val);
    return DICT_OK;
}
dictEntry *dictAddRaw(dict *d, void *key, dictEntry **existing)
{
    long index;
    dictEntry *entry;
    dictht *ht;
	// 尝试进行rehash
    if (dictIsRehashing(d)) _dictRehashStep(d);
    /* Get the index of the new element, or -1 if
     * the element already exists. */
    // 查找key是否存在对应的value，如果存在，返回-1
    if ((index = _dictKeyIndex(d, key, dictHashKey(d,key), existing)) == -1)
        return NULL;
    /* Allocate the memory and store the new entry.
     * Insert the element in top, with the assumption that in a database
     * system it is more likely that recently added entries are accessed
     * more frequently. */
    ht = dictIsRehashing(d) ? &d->ht[1] : &d->ht[0];
    entry = zmalloc(sizeof(*entry));
    entry->next = ht->table[index];
    ht->table[index] = entry;
    ht->used++;
    /* Set the hash entry fields. */
    dictSetKey(d, entry, key);
    return entry;
}
```

根据key调用dictAddRaw获取要添加的dictEntry，如果dictEntry==NULL，说明dict中已经存在该key对应的value中，否则创建新的dictEntry，插入到该数组中列表对于的头部，然后设置dictEntry的key和value。

dictHashKey(d,key)正是根据之前dict的type中设置的hash计算函数，计算key的hash值。_dictKeyIndex根据key的hash值作为hash表数组的下标，取出数组中对应的key，与传入的key做比较，其中dictCompareKeys也是根据之前dict的type中设置的compare比较函数来比较key的值：

```java
static long _dictKeyIndex(dict *d, const void *key, uint64_t hash, dictEntry **existing)
{
    unsigned long idx, table;
    dictEntry *he;
    if (existing) *existing = NULL;
    /* Expand the hash table if needed */
    // 尝试进行dict扩容
    if (_dictExpandIfNeeded(d) == DICT_ERR)
        return -1;
    // dict可能正在rehash，所以要遍历两张hash表
    for (table = 0; table <= 1; table++) {
        idx = hash & d->ht[table].sizemask;
        /* Search if this slot does not already contain the given key */
        he = d->ht[table].table[idx];
        while(he) {
            if (key==he->key || dictCompareKeys(d, key, he->key)) {
                if (existing) *existing = he;
                return -1;
            }
            he = he->next;
        }
        if (!dictIsRehashing(d)) break;
    }
    return idx;
}
```

下面再看看删除：dictDelete

```java
int dictDelete(dict *ht, const void *key) {
    return dictGenericDelete(ht,key,0) ? DICT_OK : DICT_ERR;
}
static dictEntry *dictGenericDelete(dict *d, const void *key, int nofree) {
    uint64_t h, idx;
    dictEntry *he, *prevHe;
    int table;
	// dict中没有元素
    if (d->ht[0].used == 0 && d->ht[1].used == 0) return NULL;
	// 尝试rehash
    if (dictIsRehashing(d)) _dictRehashStep(d);
    // 计算key的hash值
    h = dictHashKey(d, key);
	// 从两张hash表中分别查找
    for (table = 0; table <= 1; table++) {
        idx = h & d->ht[table].sizemask;
        he = d->ht[table].table[idx];
        prevHe = NULL;
        while(he) {
            if (key==he->key || dictCompareKeys(d, key, he->key)) {
                /* Unlink the element from the list */
                // 如果找到从链表中移除该KV对
                if (prevHe)
                    prevHe->next = he->next;
                else
                    d->ht[table].table[idx] = he->next;
                if (!nofree) {
                    dictFreeKey(d, he);
                    dictFreeVal(d, he);
                    zfree(he);
                }
                d->ht[table].used--;
                return he;
            }
            prevHe = he;
            he = he->next;
        }
        if (!dictIsRehashing(d)) break;
    }
    return NULL; /* not found */
}
```

删除操作，也是先通过计算key的hash值找到key可能存在的链表数组下标，从链表中逐个查找，如果删除相同的key，则删除。

删除操作还有一个dictUnlink，这两个函数的区别是，dictDelete会释放对应KV的内存，而dictUnlink不会。

最后再看看查找dictFind，上面dictAdd和dictDelete都包含了查找的过程，直接看代码即可：

```java
dictEntry *dictFind(dict *d, const void *key)
{
    dictEntry *he;
    uint64_t h, idx, table;
    if (d->ht[0].used + d->ht[1].used == 0) return NULL; /* dict is empty */
    if (dictIsRehashing(d)) _dictRehashStep(d);
    h = dictHashKey(d, key);
    for (table = 0; table <= 1; table++) {
        idx = h & d->ht[table].sizemask;
        he = d->ht[table].table[idx];
        while(he) {
            if (key==he->key || dictCompareKeys(d, key, he->key))
                return he;
            he = he->next;
        }
        if (!dictIsRehashing(d)) return NULL;
    }
    return NULL;
}
```

### 渐进式rehash

dictAdd、dictDelete、dictFind中都有这两个函数，_dictRehashStep和_dictExpandIfNeeded，这两个步骤都是为dict扩容服务。当dict中元素达到一定阈值时，Redis中规定的阈值是数组大小，为了避免dict的查询效率下降，就需要扩容。对于Redis来说，由于其单线程的模型，使得任何操作都不能占用大多时间，从而造成服务抖动，同时如果dict过大时，一次扩容有可能消耗较长时间。所以Redis中采用了渐进式rehash进行扩容的做法。

首先来看一下扩容触发条件，主要有两个参数控制：

- dict_can_resize，控制是否可以进行扩容，Redis在做持久化RDB/AOF时，会设置dict_can_resize为0，禁止内部的dict结构扩容。为什么呢？在进行RDB/AOF时，Redis通过fork()系统调用创建子进程来复制一份内存做快照，而fork()的原理是Copy On Write，如果系统内存在子进程存在这段时间持续变化的话，会严重放大COW。
- dict_force_resize_ratio，dict的使用率，默认为1，避免内存元素过多造成的查询性能下降

```java
/* Expand the hash table if needed */
static int _dictExpandIfNeeded(dict *d)
{
    /* Incremental rehashing already in progress. Return. */
    // 已经在扩容中
    if (dictIsRehashing(d)) return DICT_OK;
    /* If the hash table is empty expand it to the initial size. */
    // 此时dict中还没有KV对
    if (d->ht[0].size == 0) return dictExpand(d, DICT_HT_INITIAL_SIZE);
    /* If we reached the 1:1 ratio, and we are allowed to resize the hash
     * table (global setting) or we should avoid it but the ratio between
     * elements/buckets is over the "safe" threshold, we resize doubling
     * the number of buckets. */
    // 根据dict_can_resize和dict_force_resize_ratio确定是否扩容
    if (d->ht[0].used >= d->ht[0].size &&
        (dict_can_resize ||
         d->ht[0].used/d->ht[0].size > dict_force_resize_ratio))
    {
        return dictExpand(d, d->ht[0].used*2);
    }
    return DICT_OK;
}
```

再看下扩容的实现：确定新的hash表容量，新建一张hash表，设置rehashidx为0，表示rehash扩容开始

```java
int dictExpand(dict *d, unsigned long size)
{
    /* the size is invalid if it is smaller than the number of
     * elements already inside the hash table */
    if (dictIsRehashing(d) || d->ht[0].used > size)
        return DICT_ERR;
	// 新建一个hash表，表的容量为距离当前元素个数最近的2的次方数
    dictht n; /* the new hash table */
    unsigned long realsize = _dictNextPower(size);
    /* Rehashing to the same table size is not useful. */
    if (realsize == d->ht[0].size) return DICT_ERR;
    /* Allocate the new hash table and initialize all pointers to NULL */
    n.size = realsize;
    n.sizemask = realsize-1;
    n.table = zcalloc(realsize*sizeof(dictEntry*));
    n.used = 0;
    /* Is this the first initialization? If so it's not really a rehashing
     * we just set the first hash table so that it can accept keys. */
    if (d->ht[0].table == NULL) {
        d->ht[0] = n;
        return DICT_OK;
    }
    /* Prepare a second hash table for incremental rehashing */
    d->ht[1] = n;
    d->rehashidx = 0;
    return DICT_OK;
}
```

最后一步设置rehashidx为0，表示rehash开始，之后就会把旧的hash表中的元素一个个拿出来，放到新的hash表中

```java
#define dictIsRehashing(d) ((d)->rehashidx != -1)
```

rehash的代码由_dictRehashStep实现，散落在dictAdd、dictDelete、dictFind的各个函数内存，所谓的渐进式rehash就是在对dict做操作时，顺便做一次rehash，避免集成rehash消耗过多的时间，每次rehash的KV对数量有一定的限制：每次最多rehash n个bucket桶中的数据，同时为了防止某个bucket中的数据过多，每次rehash的数量不能超过n*10，过程很简单，直接看代码注释：

```java
static void _dictRehashStep(dict *d) {
	// 如果没有不安全的迭代器，则做一个rehahs
    if (d->iterators == 0) dictRehash(d,1);
}
int dictRehash(dict *d, int n) {
    int empty_visits = n*10; /* Max number of empty buckets to visit. */
    if (!dictIsRehashing(d)) return 0;
	// 从ht[0]中取出一定数量的KV对，再插入到新建的ht[1]中
    while(n-- && d->ht[0].used != 0) {
        dictEntry *de, *nextde;
        /* Note that rehashidx can't overflow as we are sure there are more
         * elements because ht[0].used != 0 */
        assert(d->ht[0].size > (unsigned long)d->rehashidx);
        while(d->ht[0].table[d->rehashidx] == NULL) {
            d->rehashidx++;
            if (--empty_visits == 0) return 1;
        }
        de = d->ht[0].table[d->rehashidx];
        /* Move all the keys in this bucket from the old to the new hash HT */
        while(de) {
            uint64_t h;
            nextde = de->next;
            /* Get the index in the new hash table */
            h = dictHashKey(d, de->key) & d->ht[1].sizemask;
            de->next = d->ht[1].table[h];
            d->ht[1].table[h] = de;
            d->ht[0].used--;
            d->ht[1].used++;
            de = nextde;
        }
        d->ht[0].table[d->rehashidx] = NULL;
        d->rehashidx++;
    }
    /* Check if we already rehashed the whole table... */
    if (d->ht[0].used == 0) {
        zfree(d->ht[0].table);
        d->ht[0] = d->ht[1];
        _dictReset(&d->ht[1]);
        d->rehashidx = -1;
        return 0;
    }
    /* More to rehash... */
    return 1;
}
```

### scan操作

最后看看dict的遍历即dictScan操作，这个函数主要为了scan命令服务，同样由于Redis的单线程模型，如果DB中存储的key较多，scan一次DB会消耗较长时间，造成服务抖动，所以Redis提供了这种分批次scan操作，即每次scan一批数据，下一次scan从上一次scan的结束点接着scan。

对于dict来说，只要每次scan hash表中一个bucket的数据，下次再scan时，从下一个bucket开始即可，这样两张dict中的hash表都可以被scan到，如果bucket的布局不变，理论上可以scan到收到scan这个命令时间点之前所有的数据，但是由于两次scan之间存在渐进式rehash的存在，bucket的布局可能发生变化，这就存在两个问题：

**1、** 在ht[0]中被scan过的bucket可能被rehash到ht[1]中，造成重复scan；

**2、** 在scanht[1]时，如果下一次rehash结束，ht[1]被赋值为ht[0]，这样ht[1]之后的数据就没办法被scan到，造成scan遗漏；

Redis中采用了一个非常巧妙的算法，该方法的实现方案就在dictScan函数之前的大段注释中，作者称其为：reverse binary iteration，反向二进制迭代法？该方法解决了上面第二个问题，给出了如下保证：

**1、** scan结果允许重复，即之前scan过的元素有可能再次被scan到；

**2、** 在scan开始之后，所有没有变化过的key（新增和删除）都能够被scan到；

算法解释起来很麻烦，但是实现起来很简单，不在这里赘述了，可以参考：[dictScan实现](http://chenzhenianqing.com/articles/1101.html)
