# 30、Redis 源码解析 - Redis 字典学习，dict.h
- 来源：https://ddkk.com/zhuanlan/db/redis/5/30.html
- 分类：缓存数据库
- 分组：教程目录
### 前言

经过我们不懈的努力，终于将复杂的压缩列表学习完了，虽然学习完了，但还是要经常复习才行，温故而知新可以为师矣，否则岂不是走马观花学习了一遍，之后就忘记的光光。

今天开始学习一个新的数据结构，字典，字典在 Redis 中有很多应用场景，和其他数据结构一样我们先来学习一下他的头文件 dict.h 。

### 1 字典

在Redis 中，字典是由哈希表组成，哈希表又是由许多个哈希节点组成，每个哈希节点的位置会根据键值计算一个哈希值来确定在哈希表中的位置。

### 2 结构体定义

#### 2.1 dictEntry

```java
typedef struct dictEntry {
    void *key;//键值
    union {
        void *val;
        uint64_t u64;
        int64_t s64;
        double d;
    } v;//值
    struct dictEntry *next;//一个哈希桶中下一个节点
} dictEntry;
```

这个结构体是哈希节点的定义，里面有 3 个主要的属性，key、v、next，分别代表键、值、相同哈希值的下一个哈希节点，在哈希表中哈希节点可能会计算出相同的索引位置，也叫哈希冲突，这个时候就需要将这些相同位置的哈希节点链接起来。

#### 2.2 dictType

```java
typedef struct dictType {
    unsigned int (*hashFunction)(const void *key);//计算 hash 值
    void *(*keyDup)(void *privdata, const void *key);//复制键
    void *(*valDup)(void *privdata, const void *obj);//复制值
    int (*keyCompare)(void *privdata, const void *key1, const void *key2);//比较键值
    void (*keyDestructor)(void *privdata, void *key);//键删除
    void (*valDestructor)(void *privdata, void *obj);//值删除
} dictType;
```

这个结构体是哈希表的一些方法定义

#### 2.3 dictht

```java
typedef struct dictht {
    dictEntry **table;//哈希节点指针数组
    unsigned long size;//哈希表的长度
    unsigned long sizemask;//哈希表长度的掩码，一般等于 size -1
    unsigned long used;//哈希节点的数量
} dictht;
```

这个结构体是哈希表的定义，里面有 4 个属性 table 、size、sizemask、used，其中 size 表示哈希表的长度，sizemask 是用来计算哈希节点索引值的时候使用到，used 表示哈希表中哈希节点的数量。

#### 2.4 dict

```java
typedef struct dict {
    dictType *type; // 类型函数结构体指针
    void *privdata;// 私有数据
    dictht ht[2]; //哈希表，2 个
    long rehashidx; /* rehashing not in progress if rehashidx == -1 */ //rehashidx 进度
    int iterators; /* number of iterators currently running */ //当前运行的迭代器数量
} dict;
```

这个接头体是字典的定义，结构体有5个属性。

可以看到 dict 里面定义两个 dictht，两个哈希表的作用是为了更好解决哈希冲突对哈希表进行扩容或者收缩，进行 rehash 动作，就是将第一个哈希表的哈希节点重新计算索引放到新的哈希表中。

rehashidx 这个属性表示当前 rehash 的进度。

### 3 宏定义

```java
#define dictFreeVal(d, entry) \
    if ((d)->type->valDestructor) \
        (d)->type->valDestructor((d)->privdata, (entry)->v.val)
#define dictSetVal(d, entry, _val_) do {
        \
    if ((d)->type->valDup) \
        entry->v.val = (d)->type->valDup((d)->privdata, _val_); \
    else \
        entry->v.val = (_val_); \
} while(0)
#define dictSetSignedIntegerVal(entry, _val_) \
    do {
        entry->v.s64 = _val_; } while(0)
#define dictSetUnsignedIntegerVal(entry, _val_) \
    do {
        entry->v.u64 = _val_; } while(0)
#define dictSetDoubleVal(entry, _val_) \
    do {
        entry->v.d = _val_; } while(0)
#define dictFreeKey(d, entry) \
    if ((d)->type->keyDestructor) \
        (d)->type->keyDestructor((d)->privdata, (entry)->key)
#define dictSetKey(d, entry, _key_) do {
        \
    if ((d)->type->keyDup) \
        entry->key = (d)->type->keyDup((d)->privdata, _key_); \
    else \
        entry->key = (_key_); \
} while(0)
#define dictCompareKeys(d, key1, key2) \
    (((d)->type->keyCompare) ? \
        (d)->type->keyCompare((d)->privdata, key1, key2) : \
        (key1) == (key2))
#define dictHashKey(d, key) (d)->type->hashFunction(key)
#define dictGetKey(he) ((he)->key)
#define dictGetVal(he) ((he)->v.val)
#define dictGetSignedIntegerVal(he) ((he)->v.s64)
#define dictGetUnsignedIntegerVal(he) ((he)->v.u64)
#define dictGetDoubleVal(he) ((he)->v.d)
#define dictSlots(d) ((d)->ht[0].size+(d)->ht[1].size)
#define dictSize(d) ((d)->ht[0].used+(d)->ht[1].used)
#define dictIsRehashing(d) ((d)->rehashidx != -1)
```

### 4 API

```java
dict *dictCreate(dictType *type, void *privDataPtr);
int dictExpand(dict *d, unsigned long size);
int dictAdd(dict *d, void *key, void *val);
dictEntry *dictAddRaw(dict *d, void *key);
int dictReplace(dict *d, void *key, void *val);
dictEntry *dictReplaceRaw(dict *d, void *key);
int dictDelete(dict *d, const void *key);
int dictDeleteNoFree(dict *d, const void *key);
void dictRelease(dict *d);
dictEntry * dictFind(dict *d, const void *key);
void *dictFetchValue(dict *d, const void *key);
int dictResize(dict *d);
dictIterator *dictGetIterator(dict *d);
dictIterator *dictGetSafeIterator(dict *d);
dictEntry *dictNext(dictIterator *iter);
void dictReleaseIterator(dictIterator *iter);
dictEntry *dictGetRandomKey(dict *d);
unsigned int dictGetSomeKeys(dict *d, dictEntry **des, unsigned int count);
void dictPrintStats(dict *d);
unsigned int dictGenHashFunction(const void *key, int len);
unsigned int dictGenCaseHashFunction(const unsigned char *buf, int len);
void dictEmpty(dict *d, void(callback)(void*));
void dictEnableResize(void);
void dictDisableResize(void);
int dictRehash(dict *d, int n);
int dictRehashMilliseconds(dict *d, int ms);
void dictSetHashFunctionSeed(unsigned int initval);
unsigned int dictGetHashFunctionSeed(void);
unsigned long dictScan(dict *d, unsigned long v, dictScanFunction *fn, void *privdata);
```

### 5 学习总结

**1、** Redis中字典有两个哈希表；

**2、** Redis为了更好解决哈希冲突会进行rehash动作，重新计算哈希节点的哈希值；

**3、** 哈希节点dictEntry中记录了相同索引位置的下一个哈希节点的指针，方便查找和遍历；

**4、** 字典涉及的几个结构体有dict、dictht、dictEntry分别代表字典、哈希表、哈希节点；

**5、** dictht中包含了哈希节点的数组；
