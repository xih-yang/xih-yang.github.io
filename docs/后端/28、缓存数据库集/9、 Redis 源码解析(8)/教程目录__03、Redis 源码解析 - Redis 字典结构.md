# 03、Redis 源码解析 - Redis 字典结构
- 来源：https://ddkk.com/zhuanlan/db/redis/8/3.html
- 分类：缓存数据库
- 分组：教程目录
### 1. 介绍

字典还有一个更为通俗的名字：`map（映射）`，是一种用于保存`键值对`的抽象数据结构. 很多语言都内置了字典这种数据结构，像C++中的`unordered_map`、Java中的`HashMap`、Golang中的`map`等等.

但是C语言中却没有内置这种数据结构，因此Redis构建了自己的字典实现. 字典在Redis中的应用相当广泛，比如哈希对象在满足条件的情况下会使用字典作为底层实现，以及Redis中的数据库也是使用字典来作为底层实现的，对数据库的增、删、查、改操作也是构建在对字典的操作之上的.

### 2. 字典的实现

Redis的字典使用哈希表作为底层实现，一个哈希表里面可以有多个哈希表节点，而每个哈希表节点就保存了字典中的一个键值对.

关于字典的源码在源码根目录的`dict.h`和`dict.c`中.

#### 2.1 哈希表

Redis字典所使用的哈希表由dictht结构定义：

```java
typedef struct dictht {
	// 哈希表数组
    dictEntry **table;
    // 哈希表大小
    unsigned long size;
    // 哈希表大小掩码，用于计算索引值
    // 总是等于 size-1
    unsigned long sizemask;
    // 哈希表已有节点的数量
    unsigned long used;
} dictht;
```

table是一个数组，数组中的每个元素都是一个指向哈希表节点的指针：

#### 2.2 哈希表节点

哈希表的table指向的数组存放着`dictEntry`类型的地址.

```java
typedef struct dictEntry {
	// 键
    void *key;
    // 值
    union {
        void *val;
        uint64_t u64;
        int64_t s64;
        double d;
    } v;
    // 指向下一个hash节点，形成链表，用来解决hash键冲突
    struct dictEntry *next;
} dictEntry;
```

- key属性保存着键值对中的键，而v属性则保存着键值对中的值，其中键值对的值可以是一个指针，或者是一个uint64_t整数，又或者是一个int64_t整数.
- next属性是指向另一个哈希表节点的指针，这个指针可以将多个哈希值相同的键值对连接在一起，以此来解决键冲突( collision )的问题.

如下图所示，next指针将两个索引值相同的键k1和k0连接在了一起：

#### 2.3 字典

```java
typedef struct dict {
	// 类型特定函数
    dictType *type;
    // 私有数据
    void *privdata;
    // 两张哈希表
    dictht ht[2];
    // rehash的标记，rehashidx==-1，表示没在进行rehash
    long rehashidx;
    // 正在迭代的迭代器数量
    int iterators;
} dict;
```

`type`属性和`privdata`属性是针对不同类型的键值对，为创建多态字典而设置的：

- type属性是一个指向dictType结构的指针，每个dictType结构保存了一组用于操作特定类型键值对的函数，Redis 会为用途不同的字典设置不同的类型特定函数.
- 而privdata属性则保存了需要传给那些类型特定函数的可选参数.

`dictType`类型保存着 操作字典不同类型key和value的函数指针.

```java
typedef struct dictType {
	// 计算hash值的函数
    unsigned int (*hashFunction)(const void *key);
    // 复制key的函数
    void *(*keyDup)(void *privdata, const void *key);
    // 复制value的函数
    void *(*valDup)(void *privdata, const void *obj);
    // 比较key的函数
    int (*keyCompare)(void *privdata, const void *key1, const void *key2);
    // 销毁key的析构函数
    void (*keyDestructor)(void *privdata, void *key);
    // 销毁value的析构函数
    void (*valDestructor)(void *privdata, void *obj);
} dictType;
```

- ht属性是一个包含两个项的数组，数组中的每个项都是一个dictht哈希表，一般情况字典只使用ht[0]哈希表，ht[1]哈希表只会在对ht[0]哈希表进行rehash时使用.
- 除了ht[1]之外，另一个和rehash有关的属性就是rehashidx，它记录了

`rehash`目前的进度，如果目前没有在进行`rehash`，那么它的值为-1.

下图是一个没有在进行rehash的字典：

### 3. 哈希算法

当要将一个新的键值对添加到字典里面时，程序需要先根据键值对的键计算出哈希值和索引值，然后再根据索引值，将包含新键值对的哈希表节点放到哈希表数组的指定索引上面.

Redis的字典计算哈希值有两个步骤：

```java
// 计算key的哈希值
hash = dict->type->hashFunction(key);
// 使用sizemask属性和哈希值，计算出索引值
index = hash & dict->ht[x].sizemask;
```

当字典被用作数据库的底层实现，或者哈希对象的底层实现时，Redis使用`MurmurHash2`算法来计算键的哈希值.

#### 3.1 用于计算int型哈希值的函数

```java
// 用于计算int整型哈希值的哈希函数
unsigned int dictIntHashFunction(unsigned int key) {
    key += ~(key << 15);
    key ^=  (key >> 10);
    key +=  (key << 3);
    key ^=  (key >> 6);
    key += ~(key << 11);
    key ^=  (key >> 16);
    return key;
}
```

#### 3.2 MurmurHash2 算法

```java
// 用于计算字符串的哈希值的哈希函数
unsigned int dictGenHashFunction(const void *key, int len) {
    // m和r这两个值用于计算哈希值，只是因为效果好
    uint32_t seed = dict_hash_function_seed;
    const uint32_t m = 0x5bd1e995;
    const int r = 24;
	// 初始化
    uint32_t h = seed ^ len;    
    // 一次将 4 个字节混合到哈希中
    const unsigned char *data = (const unsigned char *)key;
    // 将字符串key每四个一组看成uint32_t类型，进行运算的到h
    while(len >= 4) {
        uint32_t k = *(uint32_t*)data;
        k *= m;
        k ^= k >> r;
        k *= m;
        h *= m;
        h ^= k;
        data += 4;
        len -= 4;
    }
    // 处理输入数组的最后几个字节
    switch(len) {
    case 3: h ^= data[2] << 16;
    case 2: h ^= data[1] << 8;
    case 1: h ^= data[0]; h *= m;
    };
    // 确保最后几个字节被更好的合并
    h ^= h >> 13;
    h *= m;
    h ^= h >> 15;
    return (unsigned int)h;
}
```

### 4. rehash

随着操作的不断执行，哈希表保存的键值对会逐渐地增多或者减少，为了让哈希表的`负载因子`维持在一个合理的范围之内，当哈希表保存的键值对数量太多或者太少时，程序需要对哈希表的大小进行相应的扩展或者收缩.

扩展和收缩哈希表的工作可以通过执行`rehash （重新散列）`操作来完成，Redis 对字典的哈希表执行rehash的步骤如下：

**1、** 为字典的`ht[1]`哈希表分配空间，这个哈希表的空间大小取决于要执行的操作，以及`ht[0]`当前包含的键值对数量（也即是`ht[0].used`属性的值）：；

(1) 扩容操作：`ht[1]`的大小为第一个大于等于`ht[0].used * 2`的`2 ^ n`.

(2) 收缩操作：`ht[1]`的大小为第一个大于等于`ht[0].used`的`2 ^ n`.
**2、** 将保存在`ht[0]`中的所有键值对`rehash`到`ht[1]`上面：rehash指的是重新计算键的哈希值和索引值，然后将键值对放置到`ht[1]`哈希表的指定位置上.；

**3、** 当`ht[0]`包含的所有键值对都迁移到了`ht[1]`之后（ht[0]变为空表），释放；

`ht[0]`，将`ht[1]`设置为`ht[0]`，并在`ht[1]`新创建一个空白哈希表，为下一次`rehash`做准备.

#### 4.1 哈希表扩容与收缩的规则

**扩容**

当以下条件中的任意一个被满足时，程序会自动开始对哈希表执行扩展操作：

- 服务器目前没有在执行BGSAVE命令或者BGREWRITEAOF命令，并且哈希表的负载因子大于等于1.
- 服务器目前正在执行BGSAVE命令或者BGREWRITEAOF命令，并且哈希表的负载因子大于等于5.

负载因子计算公式：

```java
// 负载因子 = 哈希表已保存的节点数量 / 哈希表大小
load_factor = ht[0].used / ht[0].size
```

扩容源码：

```java
// 返回字典d是否正在rehash
#define dictIsRehashing(d) ((d)->rehashidx != -1)
// 表示字典是否启用rehash，dictEnableResize()和dictDisableResize()可以修改该变量
static int dict_can_resize = 1;
// 强制进行rehash的比例 used/size 如果大于dict_force_resize_ratio就会强制触发rehash进行扩大哈希表的操作
static unsigned int dict_force_resize_ratio = 5;
// 扩展d字典，并初始化
static int _dictExpandIfNeeded(dict *d) {
	// 正在进行rehash，直接返回
    if (dictIsRehashing(d)) return DICT_OK;
	// 如果字典（的 0 号哈希表）为空，那么创建并返回初始化大小的 0 号哈希表
    if (d->ht[0].size == 0) return dictExpand(d, DICT_HT_INITIAL_SIZE);
	// 字典已使用节点数和字典大小之间的比率接近 1：1
	// 能够扩展的标志为真 或者 已使用节点数和字典大小之间的比率超过 dict_force_resize_ratio（默认为5）
    if (d->ht[0].used >= d->ht[0].size && (dict_can_resize || d->ht[0].used / d->ht[0].size > dict_force_resize_ratio)) 
    {
    	// 扩展为节点个数的2倍
        return dictExpand(d, d->ht[0].used * 2);
    }
    return DICT_OK;
}
```

扩容或者收缩的操作都靠下面这个函数来执行：

```java
// 根据size调整或创建字典d的哈希表
int dictExpand(dict *d, unsigned long size) {
	// 新的hash表
    dictht n;
    // 获得一个最接近2的倍数的realsize
    unsigned long realsize = _dictNextPower(size);
    // 正在rehash或size不够大返回出错标志
    if (dictIsRehashing(d) || d->ht[0].used > size)
        return DICT_ERR;
	// 如果新的realsize和原本的size一样则返回出错标志
    if (realsize == d->ht[0].size) return DICT_ERR; 
    // 分配新的哈希表并将所有指针初始化为 NULL
    n.size = realsize;
    n.sizemask = realsize-1;
    n.table = zcalloc(realsize*sizeof(dictEntry*));
    n.used = 0;
	// 如果ht[0]哈希表为空，则将新的哈希表n设置为ht[0]
    if (d->ht[0].table == NULL) {
        d->ht[0] = n;
        return DICT_OK;
    }
    // 为重新散列准备第二个散列表
    // 如果ht[0]非空，则需要rehash
    d->ht[1] = n;    
	// 设置rehash标志位为0，开始渐进式rehash（incremental rehashing）       
    d->rehashidx = 0;
    return DICT_OK;
}
```

下面的函数用于计算hash表扩容或者收缩后的大小：

```java
// __LONG_MAX__是long_int类型的最大值
#define LONG_MAX  __LONG_MAX__
// 初始化的哈希表大小为4
#define DICT_HT_INITIAL_SIZE     4      
// 计算第一个大于等于 size 的 2 ^ N ，用作哈希表的值
static unsigned long _dictNextPower(unsigned long size) {
	// 先让i等于hash的初始大小
    unsigned long i = DICT_HT_INITIAL_SIZE;
	// size最大为LONG_MAX
    if (size >= LONG_MAX) return LONG_MAX;
    // 返回大于等于第一个大于哈希表初始大小的2的n次幂
    while(1) {
        if (i >= size)
            return i;
        i *= 2;
    }
}
```

**收缩**

当哈希表的负载因子小于`0.1`时，程序自动开始对哈希表执行收缩操作.

```java
// 缩小字典d
int dictResize(dict *d) {
    int minimal;
    // 如果dict_can_resize被设置成0，表示不能进行rehash，或正在进行rehash，返回出错标志DICT_ERR
    if (!dict_can_resize || dictIsRehashing(d)) return DICT_ERR;
	// 获得已经有的节点数量作为最小限度minimal
    minimal = d->ht[0].used;
    // 但是minimal不能小于最低值DICT_HT_INITIAL_SIZE（4）
    if (minimal < DICT_HT_INITIAL_SIZE)
        minimal = DICT_HT_INITIAL_SIZE;
    // 用minimal调整字典d的大小
    return dictExpand(d, minimal);
}
```

### 5. 渐进式rehash

为了避免`rehash`对服务器性能造成影响，服务器不是一次性将`ht[0]`里面的所有键值对全部`rehash`到`ht[1]`，而是分多次、渐进式地将`ht[0]`里面的键值对慢慢地`rehash`到`ht[1]`.

下面是哈希表渐进式`rehash`的步骤：

**1、** 为`ht[1]`分配空间，让字典同时持有`ht[0]`和`ht[1]`两个哈希表.；

**2、** 在字典中维持一个索引计数器变量`rehashidx`，并将它的值设置为0，表示`rehash`工作正式开始.；

**3、** 在`rehash`进行期间，每次对字典执行添加、删除、查找或者更新操作时，程序除了执行指定的操作以外，还会顺带将`ht[0]`哈希表在`rehashidx`索引上的所有键值对`rehash`到`ht[1]`，当`rehash`工作完成之后，程序将`rehashidx`属性的值增一.；

**4、** 随着字典操作的不断执行，最终在某个时间点上，`ht[0]`的所有键值对都会被`rehash`至`ht[1]`，这时程序将`rehashidx`属性的值设为`-1`，表示`rehash`操作已完成.；

**渐进式rehash执行期间的哈希表操作**

渐进式rehash期间，如果要在字典里面查找一个键，程序会先在`ht[0]`里面进行查找，如果没有找到，就会在`ht[1]`里面进行查找.

另外，新添加到字典的键值对会被直接保存到`ht[1]`里面.

```java
// n步进行渐进式rehash
int dictRehash(dict *d, int n) {
	// rehashidx每次增加的上限
    int empty_visits = n * 10;
    // 只有rehashidx不等于-1时，才表示正在进行rehash，否则返回0
    if (!dictIsRehashing(d)) return 0;
	// 分n步，而且ht[0]上还有没有移动的节点
    while(n-- && d->ht[0].used != 0) {
        dictEntry *de, *nextde;
        // 确保rehashidx没有越界，因为rehashidx是从-1开始，0表示已经移动1个节点，它总是小于hash表的size
        assert(d->ht[0].size > (unsigned long)d->rehashidx);
        // 第一个循环用来更新 rehashidx 的值，因为有些桶为空，所以 rehashidx并非每次都比原来前进一个位置，而是有可能前进几个位置，但最多不超过 10。
        // 将rehashidx移动到ht[0]有节点的下标，也就是table[d->rehashidx]非空
        while(d->ht[0].table[d->rehashidx] == NULL) {
            d->rehashidx++;
            if (--empty_visits == 0) return 1;
        }
        // ht[0]下标为rehashidx有节点，得到该节点的地址
        de = d->ht[0].table[d->rehashidx];
        // 第二个循环用来将ht[0]表中每次找到的非空桶中的链表（或者就是单个节点）拷贝到ht[1]中
        while(de) {
            unsigned int h;
			// 备份下一个节点的地址
            nextde = de->next;  
			// 获得计算哈希值并得到哈希表中的下标h
            h = dictHashKey(d, de->key) & d->ht[1].sizemask;    
            // 将该节点插入到下标为h的位置
            de->next = d->ht[1].table[h];
            d->ht[1].table[h] = de;
            // 更新两个表节点数目计数器
            d->ht[0].used--;
            d->ht[1].used++;
            // 将de指向以一个处理的节点
            de = nextde;
        }
        // 迁移过后将该下标的指针置为空
        d->ht[0].table[d->rehashidx] = NULL;
        // 更新rehashidx
        d->rehashidx++;
    }
    // 检测是否已经将整张表rehash
    // ht[0]上已经没有节点了，说明已经迁移完成
    if (d->ht[0].used == 0) {
    	// 释放hash表内存
        zfree(d->ht[0].table);          
        // 将迁移过的1号哈希表设置为0号哈希表
        d->ht[0] = d->ht[1];
        // 重置ht[1]哈希表
        _dictReset(&d->ht[1]);
        // rehash标志关闭
        d->rehashidx = -1;
        // 表示已完成
        return 0;
    }
	// 表示还有节点等待迁移
    return 1;
}
```

\
