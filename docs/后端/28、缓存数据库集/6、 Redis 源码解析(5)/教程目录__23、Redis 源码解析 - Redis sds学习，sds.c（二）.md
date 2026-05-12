# 23、Redis 源码解析 - Redis sds学习，sds.c（二）
- 来源：https://ddkk.com/zhuanlan/db/redis/5/23.html
- 分类：缓存数据库
- 分组：教程目录
### 1 sdsMakeRoomFor

#### 1.1 方法说明

扩容方法，扩大sds字符串末尾的空闲空间

#### 1.2 方法源代码

```java
/* Enlarge the free space at the end of the sds string so that the caller
 1. is sure that after calling this function can overwrite up to addlen
 2. bytes after the end of the string, plus one more byte for nul term.
 3.  4. Note: this does not change the *length* of the sds string as returned
 5. by sdslen(), but only the free buffer space we have. */
sds sdsMakeRoomFor(sds s, size_t addlen) {
    struct sdshdr *sh, *newsh;
	//获取sds空闲空间
    size_t free = sdsavail(s);
    size_t len, newlen;
	//如果空闲空间大于要增加的空间，则直接返回
    if (free >= addlen) return s;
	//获取sds的长度
    len = sdslen(s);
	//获取sds的指针
    sh = (void*) (s-(sizeof(struct sdshdr)));
	//计算新的字符串长度
    newlen = (len+addlen);
	//如果新的长度小于SDS最大预分配长度，则新的长度翻倍
    if (newlen < SDS_MAX_PREALLOC)
        newlen *= 2;
	//如果大于最大最大预分配，则加上着最大预分配长度
    else
        newlen += SDS_MAX_PREALLOC;
	//重新分配内存
    newsh = zrealloc(sh, sizeof(struct sdshdr)+newlen+1);
    if (newsh == NULL) return NULL;
	//计算新的空闲空间
    newsh->free = newlen - len;
	//返回新的字符串
    return newsh->buf;
}
//sds.h
#define SDS_MAX_PREALLOC (1024*1024)
```

#### 1.3方法理解

**1、** 先获取原先sds的空闲空间；

**2、** 判断空间空间是否足够需要增加的空间，如果空闲空间大于要增加的空间，则直接返回；

**3、** 获取原先sds的长度和指针；

**4、** 计算新的字符空间；

**5、** 判断新的字的字符长度是否大于预分配配置，这个值在sds.h中定义，值为1M；

**6、** 如果新的长度小于1M，则这次分配的空间为新长度的两倍；

**7、** 如果新的长度大于1M，则在新长度的基础上加上1M；

**8、** 分配新的sds空间；

**9、** 计算新sds的空闲空间；

**10、** 10.返回新的字符串指针；

这个方法核心功能是对SDS动态扩容，如何扩容取决于新增的长度多少，如果没有超过1M则翻倍，超过了1M则加上1M。

### 2 sdsIncrLen

#### 2.1 方法说明

增加sds的字符长度，并减少相应的空闲空间，并在字符结尾设置结束符。

#### 2.2 方法源代码

```java
void sdsIncrLen(sds s, int incr) {
	//获取sds指针
    struct sdshdr *sh = (void*) (s-(sizeof(struct sdshdr)));
	//断言空间空间 是否大于新增的长度
    if (incr >= 0)
        assert(sh->free >= (unsigned int)incr);
    else
        assert(sh->len >= (unsigned int)(-incr));
	//字符长度 增加 
    sh->len += incr;
	//空间空间 减少
    sh->free -= incr;
	//字符结尾增加结束符
    s[sh->len] = '\0';
}
```

#### 2.3 方法理解

这个方法主要是对sds结构体中的len和free属性进行设置，增加了指定的字符长度，就要减少相应的空闲空间，并在字符结尾设置结束符。

### 3 sdscatlen

#### 3.1 方法说明

将字符串添加到sds字符串的结尾。

#### 3.2 方法源代码

```java
/* Append the specified binary-safe string pointed by 't' of 'len' bytes to the
 * end of the specified sds string 's'.
 *
 * After the call, the passed sds string is no longer valid and all the
 * references must be substituted with the new pointer returned by the call. */
sds sdscatlen(sds s, const void *t, size_t len) {
    struct sdshdr *sh;
    size_t curlen = sdslen(s);
	//根据添加的字符串，进行动态扩容
    s = sdsMakeRoomFor(s,len);
    if (s == NULL) return NULL;
    sh = (void*) (s-(sizeof(struct sdshdr)));
	//将字符串复制到sds字符数组的结尾
    memcpy(s+curlen, t, len);
	//重新计算字符长度
    sh->len = curlen+len;
	//重新计算空闲空间
    sh->free = sh->free-len;
	//字符数组结尾设置结束符
    s[curlen+len] = '\0';
    return s;
}
/* Append the specified null termianted C string to the sds string 's'.
 *
 * After the call, the passed sds string is no longer valid and all the
 * references must be substituted with the new pointer returned by the call. */
sds sdscat(sds s, const char *t) {
    return sdscatlen(s, t, strlen(t));
}
/* Append the specified sds 't' to the existing sds 's'.
 *
 * After the call, the modified sds string is no longer valid and all the
 * references must be substituted with the new pointer returned by the call. */
sds sdscatsds(sds s, const sds t) {
    return sdscatlen(s, t, sdslen(t));
}
```

#### 3.3 方法理解

**1、** 根据添加的字符串，调用sdsMakeRoomFor方法进行动态扩容；

**2、** 将字符串复制到sds字符数组的结尾；

**3、** 重新计算sds的len和free属性；

**4、** 结尾设置结束符，返回字符串指针；

### 4 总结

**1、** sds结构需要增加字符串长度的时候会先调用sdsMakeRoomFor方法进行动态扩容；

**2、** 一般操作了字符串都会变动sds的len和free属性，两者一般是一加一减的关系；

**3、** 每次变更sds都会在字符尾部设置结束符；
