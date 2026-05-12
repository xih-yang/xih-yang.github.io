# 01、Redis 源码解析 - Redis 简单动态字符串
- 来源：https://ddkk.com/zhuanlan/db/redis/8/1.html
- 分类：缓存数据库
- 分组：教程目录
### 1.介绍

Redis没有直接使用C语言传统的字符串表示（以空字符结尾的字符数组，以下简称C字符串），而是自己构建了一种名为简单动态字符串（simple dynamic string，`SDS` ）的抽象类型，并将`SDS`用作Redis的默认字符串表示.

比如Redis的字符串对象，当字符串对象保存的是一个字符串值，并且这个字符串值的长度大于32字节，那么字符串对象将使用`SDS`来保存这个字符串值.

### 2.SDS的定义

SDS定义在`redis`源码根目录下的`sds.h`中：

```java
typedef char *sds;
```

`SDS`有一个表头`header`用于存放`SDS`的信息，其中在`redis-3.2.0`版本之前是这样的：

```java
struct sdshdr {
    unsigned int len;   //buf中已占用空间的长度
    unsigned int free;  //buf中剩余可用空间的长度
    char buf[];         //初始化sds分配的数据空间
};
```

结构体中有三个字段，分别是buf中已占用空间的长度、buf中剩余可用的长度以及存储字符串的数组，注意字符串数组末尾的`'\0'`不计算在SDS的`len`属性里面. 其中buf数组是一个`柔性数组`. 关于柔性数组可以看一下这篇博客：[C语言结构体里的成员数组和指针](https://coolshell.cn/articles/11377.html).

根据这个结构体，我们展示一个`SDS`示例：

- free属性的值为0，表示这个SDS没有分配任何未使用的空间.
- len属性的值为5，表示这个SDS保存了一个五字节长的字符串.
- buf属性是一个char类型的数组，数组的前五个字节分别保存了'R'、'e'、'd'、'i'、's'五个字符，而最后一个字节则保存了空字符'\0'.

从`redis-3.2.0`版本之后（包括3.2.0），关于SDS表头的定义是这样的：

```java
/* Note: sdshdr5 is never used, we just access the flags byte directly.
 * However is here to document the layout of type 5 SDS strings. */
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

表头的大体思路是一样的，但是高版本一共有五种关于`Header`的定义，目的是为不同长度的字符串提供不同大小的`Header`，以节省内存. 以 `sdshdr8` 为例，其 `len` 属性为 `uint8_t` 类型，占用内存大小为 1 字节，则存储的字符串最大长度为256.

`Header`主要包含了四个字段：

- len：字符串的长度，不包含终止字符.
- alloc：除去表头和'\0'的buf数组长度.
- flags：标志header的类型.
- buf：储存字符串的数组.

### 3. SDS的优点

#### 3.1 兼容C的部分函数

`SDS`字符串采用`'\0'`结尾，兼容传统的C风格字符串，因此可以直接使用C的部分字符串函数.

#### 3.2 常数复杂度获取字符串长度

`SDS`在表头的`len`属性中记录了`SDS`本身的长度，所以获取一个SDS长度的复杂度仅为`O(1)`.

#### 3.3 杜绝缓冲区溢出

`SDS`字符串表头的`free`成员记录着buf字符数组中未使用空间的字节数，所以在追加字符串的时候，如果不够用会进行内存扩展，再进行追加.

#### 3.4 二进制安全

传统的C风格字符串的特点是`遇零则止`，如果保存的二进制数据（图片、视频等）中含有`'\0'`，相关操作在这里就会被截断.

而SDS表头的buf字段是一个字节数组，判断是否到达字符串结尾的依据是表头的len成员，因此可以存放任何二进制数据和文本数据不被截断，如下图：

### 4. 部分源码剖析

#### 4.1 空间预分配策略

- 如果对SDS进行修改后，SDS表头的len成员小于1MB，那么就会分配和len长度相同的未使用空间，free和len成员大小相等.
- 如果对SDS进行修改后，SDS的长度大于等于1MB，那么就会分配1MB的未使用空间

通过空间预分配策略，Redis可以减少连续执行字符串增长操作所需的内存重分配次数.

```java
sds sdsMakeRoomFor(sds s, size_t addlen)   // addlen 需要增加的空间长度
{
    struct sdshdr *sh, *newsh;
    // 获得s的未使用空间的长度
    size_t free = sdsavail(s);
    size_t len, newlen;
    // 剩余空间可以满足需求，无须扩展
    if (free >= addlen) return s;
		// 获取表头地址
    sh = (void*) (s-(sizeof(struct sdshdr)));
    // 目前 buf 长度
    len = sdslen(s);
    // 新 buf 长度
    newlen = (len+addlen);
    // 如果新 buf 长度小于 SDS_MAX_PREALLOC（1024*1024）长度
    // 那么将 buf 的长度设为新 buf 长度的两倍
    if (newlen < SDS_MAX_PREALLOC)
        newlen *= 2;
    else
        newlen += SDS_MAX_PREALLOC;
    // 获得新扩展空间的地址
    newsh = zrealloc(sh, sizeof(struct sdshdr)+newlen+1);
    if (newsh == NULL) return NULL;
		// 更新free
    newsh->free = newlen - len;
    return newsh->buf;
}
```

#### 4.2 惰性空间释放

惰性空间释放用于优化SDS的字符串缩短操作，当SDS的API需要缩短SDS保存的字符串时，程序并不立即使用内存重分配来回收缩短后多出来的字节，而是使用free属性将这些字节的数量记录起来，并等待将来使用.

```java
void sdsclear(sds s) {
	// 获取表头地址
    struct sdshdr *sh = (void*) (s-(sizeof(struct sdshdr)));
    // 表头free成员+已使用空间的长度len = 新的free
    sh->free += sh->len;
    // 已使用的空间变为0
    sh->len = 0;
    // 字符串置为空
    sh->buf[0] = '\0';
}
```

#### 4.3 其它部分源码

Redis为`SDS`提供了非常丰富的API，这里只展示一小部分.

##### 4.3.1 获取SDS的长度

`sdslen`是一个定义在`sds.h`中的内联函数，获取字符串的长度其实就是获取SDS表头的`len`字段.

而在`sds.c`中，几乎所有的函数传参都是sds类型，而不是表头`sdshdr`的地址，所以需要使用指针运算来获取表头的地址，表头结构体中一共有三个字段，最后一个buf成员是一个柔性数组，起一个占位符的作用，并不占用该结构体的大小，所以`struct sdshdr`的大小是固定的，为`8`字节.

```java
static inline size_t sdslen(const sds s) {
    struct sdshdr *sh = (void*)(s-(sizeof(struct sdshdr)));
    return sh->len;
}
```

##### 4.3.2 获取SDS的剩余长度

该函数同样是一个定义在`sds.h`中的内联函数.

```java
static inline size_t sdsavail(const sds s) {
    struct sdshdr *sh = (void*)(s-(sizeof(struct sdshdr)));
    return sh->free;
}
```

##### 4.3.3 创建SDS

```java
// 创建一个长度为initlen的字符串,并保存init字符串中的值
sds sdsnewlen(const void *init, size_t initlen) {
    struct sdshdr *sh;
    if (init) {
        sh = zmalloc(sizeof(struct sdshdr)+initlen+1);  //申请空间：表头+initlen长度+'\0'
    } else {
        sh = zcalloc(sizeof(struct sdshdr)+initlen+1);  //如果init为空，则将申请的空间初始化为0
    }
    if (sh == NULL) return NULL;
    sh->len = initlen;      //设置表头的len成员
    sh->free = 0;           //设置free，新的sds不预留任何空间
    if (initlen && init)
        memcpy(sh->buf, init, initlen); //将指定的字符串init拷贝到表头的buf中
    sh->buf[initlen] = '\0';    //以'\0'结尾
    return (char*)sh->buf;
}
// 建立一个只有表头，字符串为空"\0"的sds
sds sdsempty(void) {
    return sdsnewlen("",0);
}
// 根据字符串init，创建一个与init一样长度字符串的sds（表头+buf）
sds sdsnew(const char *init) {
    size_t initlen = (init == NULL) ? 0 : strlen(init);
    return sdsnewlen(init, initlen);
}
// 拷贝一份s的副本
sds sdsdup(const sds s) {
    return sdsnewlen(s, sdslen(s));
}
```

##### 4.3.4 销毁SDS

```java
// 释放字符串和表头
void sdsfree(sds s) {
    if (s == NULL) return;
    zfree(s-sizeof(struct sdshdr));
}
```

##### 4.3.5 SDS的追加

```java
// 将字符串t追加到s表头的buf末尾，追加len个字节
sds sdscatlen(sds s, const void *t, size_t len) {
    struct sdshdr *sh;
    size_t curlen = sdslen(s);  //原有的长度
    s = sdsMakeRoomFor(s,len);  //扩展空间
    if (s == NULL) return NULL;
    sh = (void*) (s-(sizeof(struct sdshdr)));
    memcpy(s+curlen, t, len);   //字符串拼接
    //更新属性
    sh->len = curlen+len;
    sh->free = sh->free-len;
    s[curlen+len] = '\0';
    return s;
}
// 将t字符串拼接到s的末尾
sds sdscat(sds s, const char *t) {
    return sdscatlen(s, t, strlen(t));
}
// 将sds追加到s末尾
sds sdscatsds(sds s, const sds t) {
    return sdscatlen(s, t, sdslen(t));
}
// 将字符串t覆盖到s表头的buf中，拷贝len个字节
sds sdscpylen(sds s, const char *t, size_t len) {
    struct sdshdr *sh = (void*) (s-(sizeof(struct sdshdr)));
    size_t totlen = sh->free+sh->len;   //获得总长度
    if (totlen < len) {
              //总长度小于len
        s = sdsMakeRoomFor(s,len-sh->len);  //扩展l空间
        if (s == NULL) return NULL;
        sh = (void*) (s-(sizeof(struct sdshdr)));
        totlen = sh->free+sh->len;  //更新总长度
    }
    memcpy(s, t, len);  //拷贝字符串t覆盖s原有的字符串
    //更新表头
    s[len] = '\0';
    sh->len = len;
    sh->free = totlen-len;
    return s;
}
// 将字符串覆盖到s表头的buf中
sds sdscpy(sds s, const char *t) {
    return sdscpylen(s, t, strlen(t));
}
```

##### 4.3.6 SDS的删除

```java
// 去除sds中包含有cset字符串的部分
sds sdstrim(sds s, const char *cset) {
    struct sdshdr *sh = (void*) (s-(sizeof(struct sdshdr)));
    char *start, *end, *sp, *ep;
    size_t len;
    //设置和备份指针位置
    sp = start = s;
    ep = end = s+sdslen(s)-1;
    //strchr()函数功能：查找cset中首次出现*sp字符的位置，成功返回第一次出现的位置
    while(sp <= end && strchr(cset, *sp)) sp++;         //从左开始修剪，sp为目标串的左边界
    while(ep > start && strchr(cset, *ep)) ep--;        //从右开始修剪，ep为目标串的右边界
    len = (sp > ep) ? 0 : ((ep-sp)+1);  //目标串的长度
    if (sh->buf != sp) memmove(sh->buf, sp, len);   //将字符串的位置前移到buf开头
    //更新表头
    sh->buf[len] = '\0';
    sh->free = sh->free+(sh->len-len);
    sh->len = len;
    return s;
}
```
