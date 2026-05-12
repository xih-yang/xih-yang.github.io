# 22、Redis 源码解析 - Redis sds学习，sds.c（一）
- 来源：https://ddkk.com/zhuanlan/db/redis/5/22.html
- 分类：缓存数据库
- 分组：教程目录
### 1 sdsnewlen

#### 1.1 方法说明

这个方法主要创建一个新的sds字符串。

#### 1.2 方法源代码

```java
/* Create a new sds string with the content specified by the 'init' pointer
 1. and 'initlen'.
 2. If NULL is used for 'init' the string is initialized with zero bytes.
 3.  4. The string is always null-termined (all the sds strings are, always) so
 4. even if you create an sds string with:
 5.  7. mystring = sdsnewlen("abc",3);
 6.  9. You can print the string with printf() as there is an implicit \0 at the
 7. end of the string. However the string is binary safe and can contain
 8. \0 characters in the middle, as the length is stored in the sds header. */
sds sdsnewlen(const void *init, size_t initlen) {
	//声明一个sds 的指针
    struct sdshdr *sh;
	//如果字符串不为空，则分配内存
    if (init) {
        sh = zmalloc(sizeof(struct sdshdr)+initlen+1);
    } else {
    	//分配内存并初始化
        sh = zcalloc(sizeof(struct sdshdr)+initlen+1);
    }
    if (sh == NULL) return NULL;
	//把字符串的长度赋值给sds的len属性
    sh->len = initlen;
	//将剩余空间分配长度设置为0，代表所有空间分配完
    sh->free = 0;
	//如果字符串和字符串长度都不为空
	//则将字符串内容通过内存复制到sds中字符数组中
    if (initlen && init)
        memcpy(sh->buf, init, initlen);
	//在字符数组末尾添加结束符
    sh->buf[initlen] = '\0';
	//返回字符数组的指针
    return (char*)sh->buf;
}
```

#### 1.3 方法理解

方法流程：

**1、** 声明一个sds结构体的指针；

**2、** 如果字符串不为空，则分配相应的内存空间；

**3、** 把字符串的长度赋值给sds的len属性；

**4、** 将剩余空间分配长度设置为0，代表所有空间分配完；

**5、** 如果字符串和字符串长度都不为空；

**6、** 在字符数组末尾添加结束符；

**7、** 返回字符数组的指针；

注意事项：

- zmalloc与zcalloc有区别一个会初始化，一个不会初始化，并且开辟内存方式也略微不同。
- 这里赋值字符串的时候使用了memcpy，没有使用strcpy因为strcpy遇到’\0‘就会停止。
- 赋值完字符串之后补充’\0’结束符是为了兼容C语言的一些标准库方法。
- 分配内存的时候计算空间长度公式：sds结构体的长度+字符串的长度+一个结束符的长度。

### 2 sdsempty

```java
/* Create an empty (zero length) sds string. Even in this case the string
 * always has an implicit null term. */
sds sdsempty(void) {
    return sdsnewlen("",0);
}
```

#### 2.1 方法说明

创建一个空的(零长度)sds字符串。

#### 2.2 方法源代码

```java
/* Create an empty (zero length) sds string. Even in this case the string
 * always has an implicit null term. */
sds sdsempty(void) {
    return sdsnewlen("",0);
}
```

#### 2.3 方法理解

这个方法直接调用sdsnewlen，传入了空字符和长度0。

### 3 sdsnew

#### 3.1 方法说明

从一个以空结束的C字符串开始创建一个新的sds字符串。

#### 3.2 方法源代码

```java
/* Create a new sds string starting from a null terminated C string. */
sds sdsnew(const char *init) {
    size_t initlen = (init == NULL) ? 0 : strlen(init);
    return sdsnewlen(init, initlen);
}
```

#### 3.3 方法理解

这个方法直接调用sdsnewlen，传入了C字符和字符串的长度。

### 4 sdsfree

#### 4.1 方法说明

释放sds字符串。如果字符串为NULL，则不执行任何操作。

#### 4.2 方法源代码

```java
/* Free an sds string. No operation is performed if 's' is NULL. */
void sdsfree(sds s) {
    if (s == NULL) return;
    zfree(s-sizeof(struct sdshdr));
}
```

#### 4.3 方法理解

调用zfree释放sds字符串

### 5 sdsclear

#### 5.1 方法说明

清空当前的sds结构，保留原先的分配空间。

#### 5.2 方法源代码

```java
/* Modify an sds string in-place to make it empty (zero length).
 * However all the existing buffer is not discarded but set as free space
 * so that next append operations will not require allocations up to the
 * number of bytes previously available. */
void sdsclear(sds s) {
	//获取sds结构体指针
    struct sdshdr *sh = (void*) (s-(sizeof(struct sdshdr)));
    //设置空间长度为字符串长度
    sh->free += sh->len;
	//设置字符串长度为0
    sh->len = 0;
	//设置字符串为结束符
    sh->buf[0] = '\0';
}
```

#### 5.3 方法理解

**1、** 获取sds结构体指针；

**2、** 设置空间长度为字符串长度；

**3、** 设置字符串长度为0；

**4、** 设置字符串为结束符；

### 6 总结

**1、** sdsnew方法和sdsempty都是调用了sdsnewlen方法来创建一个新的sds字符串；

**2、** sds中的字符数组始终会补充一个结束符’\0’，以此兼容C语言的一些字符串方法；

**3、** strcpy和memcpy有所区别，前者遇到’\0’会停止复制；
