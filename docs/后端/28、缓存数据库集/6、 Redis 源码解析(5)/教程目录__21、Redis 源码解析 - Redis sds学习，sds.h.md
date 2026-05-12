# 21、Redis 源码解析 - Redis sds学习，sds.h
- 来源：https://ddkk.com/zhuanlan/db/redis/5/21.html
- 分类：缓存数据库
- 分组：教程目录
### 前言

前面学习了五种数据类型的源代码，今天开始学习他们对应的数据结构源代码，首先出场的是实现字符串的数据结构，简单动态字符串（Simple Dynamic String，SDS）,如果大家是第一次听到这个东西应该会有点懵，不过不要紧我会尽量用简单的方式来介绍它。

这里要重新强调一下，本次源码学习针对的是Redis源码3.0版本，因为不同版本代码是不一样的，免得大家到时看半天发现自己的阅读的代码和我讲不一样。

### 1 SDS是什么

SDS 是动态字符串的缩写，是Redis专门设计的一种字符串结构，为了弥补C语言本身字符串的一些不足而设计的数据结构。

我们知道C语言字符串其实是字符数组，并且以’\0’结尾，这样一看其实没有啥大的毛病，但是仔细研究可以发现获取这个字符串的长度需要遍历一遍字符串，并且这种结构不能存储’\0’，那么对Redis而言肯定是不友好的，为此Redis自己设计了SDS来解决这些问题。

### 2 SDS结构体

sds相关的一些结构定义和方法定义放在sds.h、sds.c文件中,先来看下sds结构体的定义。

```java
struct sdshdr {
    unsigned int len;
    unsigned int free;
    char buf[];
};
```

可以看到sdshdr结构体有3个属性，len、free、buf，它们的用途是：

- len:当前字符串的长度
- free:剩余空间的长度
- buf:字符数组

可以发现SDS这样定义有以下的好处：

**1、** 获取字符串长度不需要遍历字符数组，所以时间复杂度是O(1)；

**2、** 有了free属性，在修改字符串的时候可以避免多次分配内存，毕竟频繁分配内存开销是很大；

### 3 sds.h学习

#### 3.1 sds.h 源码

先来看下源代码有哪些内容。

```java
#ifndef __SDS_H
#define __SDS_H
//SDS字符数组的最大长度为1M
#define SDS_MAX_PREALLOC (1024*1024)
#include <sys/types.h>
#include <stdarg.h>
typedef char *sds;
struct sdshdr {
    unsigned int len;
    unsigned int free;
    char buf[];
};
static inline size_t sdslen(const sds s) {
    struct sdshdr *sh = (void*)(s-(sizeof(struct sdshdr)));
    return sh->len;
}
static inline size_t sdsavail(const sds s) {
    struct sdshdr *sh = (void*)(s-(sizeof(struct sdshdr)));
    return sh->free;
}
//下面是一些有关sds方法签名
sds sdsnewlen(const void *init, size_t initlen);
sds sdsnew(const char *init);
sds sdsempty(void);
size_t sdslen(const sds s);
sds sdsdup(const sds s);
void sdsfree(sds s);
size_t sdsavail(const sds s);
sds sdsgrowzero(sds s, size_t len);
sds sdscatlen(sds s, const void *t, size_t len);
sds sdscat(sds s, const char *t);
sds sdscatsds(sds s, const sds t);
sds sdscpylen(sds s, const char *t, size_t len);
sds sdscpy(sds s, const char *t);
sds sdscatvprintf(sds s, const char *fmt, va_list ap);
#ifdef __GNUC__
sds sdscatprintf(sds s, const char *fmt, ...)
    __attribute__((format(printf, 2, 3)));
#else
sds sdscatprintf(sds s, const char *fmt, ...);
#endif
sds sdscatfmt(sds s, char const *fmt, ...);
sds sdstrim(sds s, const char *cset);
void sdsrange(sds s, int start, int end);
void sdsupdatelen(sds s);
void sdsclear(sds s);
int sdscmp(const sds s1, const sds s2);
sds *sdssplitlen(const char *s, int len, const char *sep, int seplen, int *count);
void sdsfreesplitres(sds *tokens, int count);
void sdstolower(sds s);
void sdstoupper(sds s);
sds sdsfromlonglong(long long value);
sds sdscatrepr(sds s, const char *p, size_t len);
sds *sdssplitargs(const char *line, int *argc);
sds sdsmapchars(sds s, const char *from, const char *to, size_t setlen);
sds sdsjoin(char **argv, int argc, char *sep);
/* Low level functions exposed to the user API */
sds sdsMakeRoomFor(sds s, size_t addlen);
void sdsIncrLen(sds s, int incr);
sds sdsRemoveFreeSpace(sds s);
size_t sdsAllocSize(sds s);
#endif
```

#### 3.2 sdslen

```java
//获取sds的字符长度
static inline size_t sdslen(const sds s) {
	//获取该字符串的sds结构体的指针
	//使用当前地址减去sds结构体占用的空间
    struct sdshdr *sh = (void*)(s-(sizeof(struct sdshdr)));
	//访问sds的Len属性
    return sh->len;
}
```

这个方法的功能是获取SDS的字符长度。

虽然这个方法只有两行代码，但第一行代码着实不太好理解，我也是费老大劲回顾了下C语言知识，才搞清楚它的作用，它的主要作用是通过当前的字符串指针来获取他的sds结构体的指针，获取方法就是通过他自己本身指针的位置减去sds结构体所占的空间，等于sds结构体的头指针。

获取到SDS的指针之后，就拿这个指针去访问属性len，就能拿到SDS的字符长度。

#### 3.3 sdsavail

```java
//获取sds的剩余可分配空间长度
//大体逻辑和sdslen差不多，区别是访问的属性不同
static inline size_t sdsavail(const sds s) {
    struct sdshdr *sh = (void*)(s-(sizeof(struct sdshdr)));
    return sh->free;
}
```

这个方法的功能是获取SDS的剩余可分配空间长度。

这个方法的第一行与sdslen一样，都是获取sds结构体的指针，通过这个指针来访问属性。

### 4 总结

**1、** 动态字符串（SimpleDynamicString，SDS）是Redis专门设计的一种字符串数据结构；

**2、** SDS结构包含len、free、buf三个属性，分别代表字符串长度、可分配空间、字符数组；

**3、** SDS通过访问len属性可以快速得到字符串的长度，而不是需要遍历字符串每个字符到结尾；

**4、** SDS通过记录free属性，可以查询当前sds还有多少分配空间，这样可以避免反复分配内存空间；

**5、** sds.h头文件里定义sds的结构体定义，还有sdslen、sdsavail方法，还有一些方法签名；
