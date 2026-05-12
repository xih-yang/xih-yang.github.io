# 08、Redis 源码解析 - Redis 对象系统
- 来源：https://ddkk.com/zhuanlan/db/redis/8/8.html
- 分类：缓存数据库
- 分组：教程目录
### 1. 介绍

在前面的章节中，我们介绍了Redis中用到的所有底层数据结构，包括：`SDS`、`双端链表`、`字典`、`跳表`、`压缩列表`、`整数集合`、`快速列表`.

Redis并没有直接使用这些数据结构来实现键值对数据库，而是基于这些数据结构创建了一个对象系统，这个系统包含`字符串对象`、`列表对象`、`哈希对象`、`集合对象`和`有序集合对象`这五种类型的对象，每种对象都用到了至少一种我们前面所介绍的数据结构.

**使用对象系统的优点：**

- Redis可以在执行命令之前，根据对象的类型来判断一个对象是否可以执行给定的命令.
- 可以针对不同的使用场景，为对象设置多种不同的数据结构实现，从而优化对象在不同场景下的使用效率.

除此之外，对象系统还实现了一些比较实用的机制：

**内存回收机制：**

基于引用计数技术，当程序不再使用某个对象的时候，这个对象所占用的内存就会被自动释放.

**对象共享机制**

Redis同样通过引用计数技术实现了对象共享机制，这一机制可以在适当的条件下，通过让多个数据库键共享同一个对象来节约内存.

**过期键自动删除**

Redis的对象带有访问时间记录信息，该信息可以用于计算数据库键的空转时长，在服务器启用了`maxmemory`功能的情况下，空转时长较大的那些键可能会优先被服务器删除.

### 2. 对象的结构

我们在Redis数据库中新创建一个键值对的时候，我们至少会创建两个对象，一个对象用作键值对的键（键对象），另一个对象用作键值对的值（值对象）. 其中键对象固定是一个字符串对象，而值对象则是由`redisObject`结构保存的数据，该结构中和保存数据有关的三个属性分别是：`type`属性、`encoding`属性和`ptr`属性. 而`lru`和`refcount`分别是用于对象删除和对象引用的字段，我们后面再解释.

Redis对象相关的源码在`server.h`和`object.c`文件中.

```java
typedef struct redisObject {
    // 对象的数据类型，占4bits，共5种类型
    unsigned type:4;
    // 对象的编码，占4bits，共10种类型
    unsigned encoding:4;
    // 实用LRU算法计算相对server.lruclock的LRU时间
    unsigned lru:LRU_BITS;
    // 引用计数
    int refcount;
    // 指向底层数据实现的指针
    void *ptr;
} robj;
```

#### 2.1 对象类型

对象的`type`属性记录了对象的类型，Redis一共有5个对象类型，见下表：

类型常量
对象的名称

REDIS_STRING
字符串对象

REDIS_LIST
列表对象

REDIS_HASH
哈希对象

REDIS_SET
集合对象

REDIS_ZSET
有序集合对象

当我们对一个数据库键执行`TYPE KEY`命令时，命令会返回该数据库键对应的`值对象的类型`，下表列出了`TYPE KEY`命令在面对不同类型的值对象所产生的输出：

对象
对象 type 属性的值
TYPE 命令的输出

字符串对象
REDIS_STRING
“string”

列表对象
REDIS_LIST
“list”

哈希对象
REDIS_HASH
“hash”

集合对象
REDIS_SET
“set”

有序集合对象
REDIS_ZSET
“zset”

`type`属性会被设置为对应类型的宏：

```java
// 字符串对象
#define OBJ_STRING 0
// 列表对象
#define OBJ_LIST 1
// 集合对象
#define OBJ_SET 2
// 有序集合对象
#define OBJ_ZSET 3
// 哈希对象
#define OBJ_HASH 4
```

#### 2.2 对象编码和底层类型

一种对象在保存不同大小数据的时候，可能使用不同的编码类型，而编码类型由`encoding`属性来记录. 使用命令`OBJECT ENCODING KEY`可以得到该数据库键对应值所使用的编码.

下表记录了每种对象会使用的编码类型：

encoding
ptr

OBJ_ENCODING_INT
整数值实现的字符串对象

OBJ_ENCODING_EMBSTR
embstr 编码的简单动态字符串实现的字符串对象

OBJ_ENCODING_RAW
简单动态字符串实现的字符串对象

OBJ_ENCODING_QUICKLIST
快速列表实现的列表对象

OBJ_ENCODING_HT
字典实现的集合对象

OBJ_ENCODING_INTSET
整数集合实现的集合对象

OBJ_ENCODING_ZIPLIST
压缩列表实现的哈希对象

OBJ_ENCODING_HT
字典实现的哈希对象

OBJ_ENCODING_SKIPLIST
跳跃表和字典实现的有序集合对象

OBJ_ENCODING_ZIPLIST
压缩列表实现的有序集合对象

下面是`enconding`属性会用到的宏：

```java
#define OBJ_ENCODING_RAW 0     /* Raw representation */
#define OBJ_ENCODING_INT 1     /* Encoded as integer */
#define OBJ_ENCODING_HT 2      /* Encoded as hash table */
#define OBJ_ENCODING_ZIPMAP 3  /* Encoded as zipmap */
#define OBJ_ENCODING_LINKEDLIST 4 /* No longer used: old list encoding. */
#define OBJ_ENCODING_ZIPLIST 5 /* Encoded as ziplist */
#define OBJ_ENCODING_INTSET 6  /* Encoded as intset */
#define OBJ_ENCODING_SKIPLIST 7  /* Encoded as skiplist */
#define OBJ_ENCODING_EMBSTR 8  /* Embedded sds string encoding */
#define OBJ_ENCODING_QUICKLIST 9 /* Encoded as linked list of ziplists */
// redis 5.0添加，用于消息队列的数据类型
#define OBJ_ENCODING_STREAM 10 /* Encoded as a radix tree of listpacks */
```

#### 2.3 指向底层类型的指针

`ptr`是一个万能指针，它会指向对象的底层实现数据类型. 我们后面会逐一介绍这些类型.

### 3. 对象系统的重要操作

Redis为对象系统定义了丰富的API，以下函数定义在`server.h`头文件中，实现在`server.c`源文件中：

```java
/* Redis object implementation */
void decrRefCount(robj *o);
void decrRefCountVoid(void *o);
void incrRefCount(robj *o);
robj *resetRefCount(robj *obj);
void freeStringObject(robj *o);
void freeListObject(robj *o);
void freeSetObject(robj *o);
void freeZsetObject(robj *o);
void freeHashObject(robj *o);
robj *createObject(int type, void *ptr);
robj *createStringObject(const char *ptr, size_t len);
robj *createRawStringObject(const char *ptr, size_t len);
robj *createEmbeddedStringObject(const char *ptr, size_t len);
robj *dupStringObject(robj *o);
int isObjectRepresentableAsLongLong(robj *o, long long *llongval);
robj *tryObjectEncoding(robj *o);
robj *getDecodedObject(robj *o);
size_t stringObjectLen(robj *o);
robj *createStringObjectFromLongLong(long long value);
robj *createStringObjectFromLongDouble(long double value, int humanfriendly);
robj *createQuicklistObject(void);
robj *createZiplistObject(void);
robj *createSetObject(void);
robj *createIntsetObject(void);
robj *createHashObject(void);
robj *createZsetObject(void);
robj *createZsetZiplistObject(void);
int getLongFromObjectOrReply(client *c, robj *o, long *target, const char *msg);
int checkType(client *c, robj *o, int type);
int getLongLongFromObjectOrReply(client *c, robj *o, long long *target, const char *msg);
int getDoubleFromObjectOrReply(client *c, robj *o, double *target, const char *msg);
int getLongLongFromObject(robj *o, long long *target);
int getLongDoubleFromObject(robj *o, long double *target);
int getLongDoubleFromObjectOrReply(client *c, robj *o, long double *target, const char *msg);
char *strEncoding(int encoding);
int compareStringObjects(robj *a, robj *b);
int collateStringObjects(robj *a, robj *b);
int equalStringObjects(robj *a, robj *b);
unsigned long long estimateObjectIdleTime(robj *o);
```

我们挑选几个进行研究.

#### 3.1 创建字符串对象

```java
// 创建一个默认的对象
robj *createObject(int type, void *ptr) {
	// 分配空间
    robj *o = zmalloc(sizeof(*o));
    // 设置对象类型
    o->type = type;
    // 设置默认的编码方式
    o->encoding = OBJ_ENCODING_RAW;
    // 设置对象
    o->ptr = ptr;
    // 引用计数为1
    o->refcount = 1;
    /* Set the LRU to the current lruclock (minutes resolution). */
    // 计算设置当前LRU时间
    o->lru = LRU_CLOCK();
    return o;
}
```

**创建一个编码为 OBJ_ENCODING_RAW 的字符串对象**

```java
// 创建一个字符串对象，编码默认为 OBJ_ENCODING_RAW，指向的数据为一个sds
robj *createRawStringObject(const char *ptr, size_t len) {
    return createObject(OBJ_STRING,sdsnewlen(ptr,len));
}
```

**创建一个编码为 OBJ_ENCODING_EMBSTR 的字符串对象**

```java
// 创建一个embstr编码的字符串对象
robj *createEmbeddedStringObject(const char *ptr, size_t len) {
	// 分配空间
    robj *o = zmalloc(sizeof(robj)+sizeof(struct sdshdr8)+len+1);
    // o+1刚好就是struct sdshdr8的地址
    struct sdshdr8 *sh = (void*)(o+1);
	// 类型为字符串对象
    o->type = OBJ_STRING;
    // 设置编码类型
    o->encoding = OBJ_ENCODING_EMBSTR;
    // 指向分配的sds对象，分配的len+1的空间首地址
    o->ptr = sh+1;
    // 设置引用计数
    o->refcount = 1;
    // 计算设置当前LRU时间
    o->lru = LRU_CLOCK();
	// 设置字符串长度
    sh->len = len;
    // 设置最大容量
    sh->alloc = len;
    // 设置sds的类型
    sh->flags = SDS_TYPE_8;
    // 如果传了字符串参数
    if (ptr) {
   		// 将传进来的ptr保存到对象中
        memcpy(sh->buf,ptr,len);
        // 结束符标志
        sh->buf[len] = '\0';
    } else {
    	// 否则将对象的空间初始化为0
        memset(sh->buf,0,len+1);
    }
    return o;
}
```

**创建一个编码为 OBJ_ENCODING_INT 的字符串对象**

```java
// 创建字符串对象，根据整数值
robj *createStringObjectFromLongLong(long long value) {
    robj *o;
    // redis中[0, 10000)内的整数是共享的
    // 如果value属于redis共享整数的范围
    if (value >= 0 && value < OBJ_SHARED_INTEGERS) {
    	// 引用计数加1
        incrRefCount(shared.integers[value]);
        // 返回一个编码类型为OBJ_ENCODING_INT的字符串对象
        o = shared.integers[value];
    // 如果不在共享整数的范围
    } else {
    	// value在long类型所表示的范围内
        if (value >= LONG_MIN && value <= LONG_MAX) {
        	// 创建对象
            o = createObject(OBJ_STRING, NULL);
            // 编码类型为OBJ_ENCODING_INT
            o->encoding = OBJ_ENCODING_INT;
            // 指向这个value值
            o->ptr = (void*)((long)value);
        } else {
            // value不在long类型所表示的范围内，将long long类型的整数转换为字符串
            // 编码类型为OBJ_ENCODING_RAW
            o = createObject(OBJ_STRING,sdsfromlonglong(value));
        }
    }
    return o;
}
```

**根据不同的长度使用不同的编码**

```java
// sdshdr8的大小为3个字节，加上1个结束符共4个字节
// redisObject的大小为16个字节
// redis使用jemalloc内存分配器，且jemalloc会分配8，16，32，64等字节的内存
// 一个embstr固定的大小为16+3+1 = 20个字节，因此一个最大的embstr字符串为64-20 = 44字节
#define OBJ_ENCODING_EMBSTR_SIZE_LIMIT 44
// 创建字符串对象，根据长度使用不同的编码类型
// createRawStringObject和createEmbeddedStringObject的区别是：
// createRawStringObject是当字符串长度大于44字节时，robj结构和sdshdr结构在内存上是分开的
// createEmbeddedStringObject是当字符串长度小于等于44字节时，robj结构和sdshdr结构在内存上是连续的
robj *createStringObject(const char *ptr, size_t len) {
    if (len <= OBJ_ENCODING_EMBSTR_SIZE_LIMIT)
        return createEmbeddedStringObject(ptr,len);
    else
        return createRawStringObject(ptr,len);
}
```

#### 3.2 复制字符串对象

```java
// 返回 复制的o对象的副本的地址，且创建的对象非共享
robj *dupStringObject(robj *o) {
    robj *d;
	// 一定是OBJ_STRING类型
    serverAssert(o->type == OBJ_STRING);
	// 根据不同的编码类型
    switch(o->encoding) {
    case OBJ_ENCODING_RAW:
    	// 创建的对象非共享
        return createRawStringObject(o->ptr,sdslen(o->ptr));        
    case OBJ_ENCODING_EMBSTR:
        return createEmbeddedStringObject(o->ptr,sdslen(o->ptr));
    case OBJ_ENCODING_INT:
    	// 即使是共享整数范围内的整数，创建的对象也是非共享的
        d = createObject(OBJ_STRING, NULL);
        d->encoding = OBJ_ENCODING_INT;
        d->ptr = o->ptr;
        return d;
    default:
        serverPanic("Wrong encoding.");
        break;
    }
}
```

#### 3.3 销毁字符串对象

```java
// 销毁字符串对象ptr指向的对象
void freeStringObject(robj *o) {
    if (o->encoding == OBJ_ENCODING_RAW) {
        sdsfree(o->ptr);
    }
}
```
