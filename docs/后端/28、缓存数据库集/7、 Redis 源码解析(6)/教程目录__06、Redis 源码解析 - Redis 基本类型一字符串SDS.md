# 06、Redis 源码解析 - Redis 基本类型一字符串SDS
- 来源：https://ddkk.com/zhuanlan/db/redis/6/6.html
- 分类：缓存数据库
- 分组：教程目录
在[Redis 源码解析 - Redis 命令端到端的过程](/zhuanlan/db/redis/6/5.html)中，一个命令最终执行时，调用processCommand函数从server.commands中找到对应命令的处理函数，比如set命令的处理函数为setCommand，而setCommand处理的key和value就是基本类型之一的字符串SDS，其他命令处理函数也类似操作其他的基本类型，从这节起，解析下各个基本类型的实现，本节先分析字符串SDS的实现。

### SDS与C字符串的区别

SDS的实现在sds.h/c中

```java
typedef char *sds;
```

可以看出，sds就是C字符串char*，为何不直接使用C字符串，主要有两点：

**1、** 操作效率；

C字符串以’\0’为结束标志，strlen、strcat等函数的时间复杂度是O(n)，SDS中专门有个字段表示SDS的长度，所以类似的字符串操作复杂度为O(1)；同时SDS在申请内存时，一般会预分配一段内存，这样对于strcat等操作的，一定程度上可以避免重新申请内存。
**2、** 支持字符串中含有’\0’；

用户set key value时，key和value的字符都不可控，有可能含有’\0’，这样原生的C字符串就无法处理了。

### SDS实现

按照上面的分析，一个简单的SDS结构实现为：

```java
struct my_SDS {
	uint64_t len;
	uint64_t alloc;
	char buf[];
};
```

但是Redis中的SDS实现为：

```java
struct __attribute__ ((__packed__)) sdshdr5 {
    unsigned char flags; /* 3 lsb of type, and 5 msb of string length */
    char buf[];
};
struct __attribute__ ((__packed__)) sdshdr8 {
    uint8_t len; /* used */
    uint8_t alloc; /* excluding the header and null terminator */
    unsigned char flags; /* 3 lsb of type, 5 unused bits */
    char buf[];
};
struct __attribute__ ((__packed__)) sdshdr16 {
    uint16_t len; /* used */
    uint16_t alloc; /* excluding the header and null terminator */
    unsigned char flags; /* 3 lsb of type, 5 unused bits */
    char buf[];
};
struct __attribute__ ((__packed__)) sdshdr32 {
    uint32_t len; /* used */
    uint32_t alloc; /* excluding the header and null terminator */
    unsigned char flags; /* 3 lsb of type, 5 unused bits */
    char buf[];
};
struct __attribute__ ((__packed__)) sdshdr64 {
    uint64_t len; /* used */
    uint64_t alloc; /* excluding the header and null terminator */
    unsigned char flags; /* 3 lsb of type, 5 unused bits */
    char buf[];
};
```

除了len、alloc、buf，还有一个字段flags：SDS类型。

Redis作为内存KV存储服务，对于内存的使用要求极为严苛，如果按照my_SDS的方式实现，len、alloc字段各占用64bit，然后实际使用过程中，绝大部分情况下key和value的长度用不了这么大，造成内存浪费，所以作者按照字符串长度进一步将SDS细分为sdshdr5、sdshdr8、sdshdr16、sdshdr32、sdshdr64，flags的高3bit用来表示具体的SDS类型。以sdshdr8为例，可以节省14byte的内存。

另外，采用__attribute__ ((**packed**))来提示编译器不要进行默认的内存对齐，以sdshdr8为例，在64位机器上，不适用内存对齐可以节省5byte的内存。

数据结构明确了，与SDS相关的API实现都很简单

sdslen：根据偏移量找到struct的头部，然后获取len字段

```java
static inline size_t sdslen(const sds s) {
    unsigned char flags = s[-1];
    switch(flags&SDS_TYPE_MASK) {
        case SDS_TYPE_5:
            return SDS_TYPE_5_LEN(flags);
        case SDS_TYPE_8:
            return SDS_HDR(8,s)->len;
        case SDS_TYPE_16:
            return SDS_HDR(16,s)->len;
        case SDS_TYPE_32:
            return SDS_HDR(32,s)->len;
        case SDS_TYPE_64:
            return SDS_HDR(64,s)->len;
    }
    return 0;
}
```

sdsnewlen：创建一个SDS，根据长度计算该SDS的类型，再根据类型给SDS的各个字段复制，最后memcpy拷贝init中的C字符串内容

```java
sds sdsnewlen(const void *init, size_t initlen) {
    void *sh;
    sds s;
    char type = sdsReqType(initlen);
    /* Empty strings are usually created in order to append. Use type 8
     * since type 5 is not good at this. */
    if (type == SDS_TYPE_5 && initlen == 0) type = SDS_TYPE_8;
    int hdrlen = sdsHdrSize(type);
    unsigned char *fp; /* flags pointer. */
    sh = s_malloc(hdrlen+initlen+1);
    if (init==SDS_NOINIT)
        init = NULL;
    else if (!init)
        memset(sh, 0, hdrlen+initlen+1);
    if (sh == NULL) return NULL;
    s = (char*)sh+hdrlen;
    fp = ((unsigned char*)s)-1;
    switch(type) {
        case SDS_TYPE_5: {
            *fp = type | (initlen << SDS_TYPE_BITS);
            break;
        }
        case SDS_TYPE_8: {
            SDS_HDR_VAR(8,s);
            sh->len = initlen;
            sh->alloc = initlen;
            *fp = type;
            break;
        }
        case SDS_TYPE_16: {
            SDS_HDR_VAR(16,s);
            sh->len = initlen;
            sh->alloc = initlen;
            *fp = type;
            break;
        }
        case SDS_TYPE_32: {
            SDS_HDR_VAR(32,s);
            sh->len = initlen;
            sh->alloc = initlen;
            *fp = type;
            break;
        }
        case SDS_TYPE_64: {
            SDS_HDR_VAR(64,s);
            sh->len = initlen;
            sh->alloc = initlen;
            *fp = type;
            break;
        }
    }
    if (initlen && init)
        memcpy(s, init, initlen);
    s[initlen] = '\0';
    return s;
}
```
