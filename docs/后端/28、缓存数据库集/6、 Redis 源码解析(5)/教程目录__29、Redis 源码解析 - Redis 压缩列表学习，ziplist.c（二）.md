# 29、Redis 源码解析 - Redis 压缩列表学习，ziplist.c（二）
- 来源：https://ddkk.com/zhuanlan/db/redis/5/29.html
- 分类：缓存数据库
- 分组：教程目录
大家好久不见，前面2个月因为一些事情耽误了 Redis 源码的学习，处理掉这些琐碎的事情之后我又回来了，我们不能因为中途的放下而一直放下，我们做事要有始有终、要坚持到底，所以我们继续学习 Redis 源码，一直把他学习完为止，可能会花很长时间，也有可能中途又因为一些事情暂时离开，不过只要一直往前走，终有一天我们会翻过这座大山。

### 1 ziplistIndex

#### 1.1 方法说明

返回压缩列表指定索引位置的指针。

#### 1.2 方法源码

```java
	unsigned char *ziplistIndex(unsigned char *zl, int index) {
	    unsigned char *p;
	    unsigned int prevlensize, prevlen = 0;
	    // 如果索引小于 0
	    if (index < 0) {
	        index = (-index)-1;
	        // 获取压缩列表尾部节点的指针
	        p = ZIPLIST_ENTRY_TAIL(zl);
			// 如果尾部节点不是结束标志
	        if (p[0] != ZIP_END) {
	            // 获取上一个节点长度大小、长度
	            ZIP_DECODE_PREVLEN(p, prevlensize, prevlen);
	            //一直向前遍历
	            while (prevlen > 0 && index--) {
	                p -= prevlen;
	                ZIP_DECODE_PREVLEN(p, prevlensize, prevlen);
	            }
	        }
	    } else {
	        //获取压缩列表头部的指针
	        p = ZIPLIST_ENTRY_HEAD(zl);
	        //从前向后遍历，每次指针移动当前节点的长度
	        while (p[0] != ZIP_END && index--) {
	            p += zipRawEntryLength(p);
	        }
	    }
		//返回索引位置的指针
	    return (p[0] == ZIP_END || index > 0) ? NULL : p;
	}
```

#### 1.3 相关代码

##### 1.3.1 ZIP_DECODE_PREVLENSIZE

```java
	/* Decode the number of bytes required to store the length of the previous
	 * element, from the perspective of the entry pointed to by 'ptr'. */
	#define ZIP_DECODE_PREVLENSIZE(ptr, prevlensize) do {
                                 \
	    if ((ptr)[0] < ZIP_BIGLEN) {
                                                      \
	        (prevlensize) = 1;                                                     \
	    } else {
                                                                          \
	        (prevlensize) = 5;                                                     \
	    }                                                                          \
	} while(0);
```

##### 1.3.2 ZIP_DECODE_PREVLEN

```java
	/* Decode the length of the previous element, from the perspective of the entry
	 * pointed to by 'ptr'. */
	#define ZIP_DECODE_PREVLEN(ptr, prevlensize, prevlen) do {
                            \
	    ZIP_DECODE_PREVLENSIZE(ptr, prevlensize);                                  \
	    if ((prevlensize) == 1) {
                                                         \
	        (prevlen) = (ptr)[0];                                                  \
	    } else if ((prevlensize) == 5) {
                                                  \
	        assert(sizeof((prevlensize)) == 4);                                    \
	        memcpy(&(prevlen), ((char*)(ptr)) + 1, 4);                             \
	        memrev32ifbe(&prevlen);                                                \
	    }                                                                          \
	} while(0);
```

##### 1.3.3 zipRawEntryLength

```java
	/* Return the total number of bytes used by the entry pointed to by 'p'. */
	static unsigned int zipRawEntryLength(unsigned char *p) {
	    unsigned int prevlensize, encoding, lensize, len;
	    ZIP_DECODE_PREVLENSIZE(p, prevlensize);
	    ZIP_DECODE_LENGTH(p + prevlensize, encoding, lensize, len);
	    return prevlensize + lensize + len;
	}
```

#### 1.4 代码理解

##### 1.4.1 遍历方法

ziplistIndex 主要是根据索引返回指针位置，方便其他方法来获取索引的节点，核心思路就是通过移动指针位置，移动的距离是节点的长度。

如果是向前移动，则每次移动指针的时候要获取上一个节点的长度；

如果是向后移动，则每次移动指针的时候要获取当前节点的长度；

##### 1.4.2 ZIP_DECODE_PREVLENSIZE

在ziplistIndex 方法中有两个宏定义的方法 ZIP_DECODE_PREVLENSIZE 和 ZIP_DECODE_PREVLEN，这里先讲 ZIP_DECODE_PREVLENSIZE 这个方法，这个方法主要为了计算上一个节点长度占用了几个字节。

从源代码中可以看到，只是做了一个简单的判断，判断节点第一个字节的数据是否小于 ZIP_BIGLEN ，如果小于就将 prevlensize 设置为 1，否则就设置为 5 。

```java
	#define ZIP_BIGLEN 254
 * The length of the previous entry is encoded in the following way:
 * If this length is smaller than 254 bytes, it will only consume a single
 * byte that takes the length as value. When the length is greater than or
 * equal to 254, it will consume 5 bytes. The first byte is set to 254 to
 * indicate a larger value is following. The remaining 4 bytes take the
 * length of the previous entry as value.
 * 
	/* Decode the number of bytes required to store the length of the previous
	 * element, from the perspective of the entry pointed to by 'ptr'. */
	#define ZIP_DECODE_PREVLENSIZE(ptr, prevlensize) do {
                                 \
	    if ((ptr)[0] < ZIP_BIGLEN) {
                                                      \
	        (prevlensize) = 1;                                                     \
	    } else {
                                                                          \
	        (prevlensize) = 5;                                                     \
	    }                                                                          \
	} while(0);
```

单纯地看这段代码可能不了解，所以我把压缩列表对节点中存储上一个节点长度的说明重新贴了出来，从说明中可以看到，如果上一个节点的长度小于 254 个字节 ，那么就需要 1 个字节就能存储这个长度。

如果大于或者等于 254 个字节，那么就会使用 5 个字节来存储上一个节点的长度，并且首个字节会存储 254 来标记使用了 5 个字节，剩下 4 个字节记录上一个节点长度的值。

通过这些说明就不难理解这个方法做什么事了，就是判断下当前节点使用了几个字节来存储上一个节点的长度。

最后补充一点，可能很多小伙伴和我一样刚开始看这个宏定义和方法调用这个宏定义的时候有一些疑惑。

**疑惑点：**

**1、** 为什么函数调用这个宏定义的时候可以直接改变变量的值？；

因为宏定义相当于代码替换，所以这里不能看做成调用成另外一个方法，而是将这个宏定义原原本本替换到被调用处，相当于变量的作用域还是在被调用函数里，而不是到新的函数里。

**2、** 为什么宏定义要用dowhile()包起来？；

如果不用 do while 包起来可能会引起替换之后的逻辑错误特别时碰到一些控制语句的时候，使用这种写法可以很好地将宏定义的代码片段当成一个整体。

##### 1.4.3 ZIP_DECODE_PREVLEN

```java
	/* Decode the length of the previous element, from the perspective of the entry
	 * pointed to by 'ptr'. */
	#define ZIP_DECODE_PREVLEN(ptr, prevlensize, prevlen) do {
                            \
	    //计算上一个节点占用的字节数量
	    ZIP_DECODE_PREVLENSIZE(ptr, prevlensize);                                  \
		//如果占用 1 个字节，那么上一个节点长度直接等于节点第一个字节存储的值
	    if ((prevlensize) == 1) {
                                                       \
	        (prevlen) = (ptr)[0];                                                  \
	    } 
	    //如果占用的是 5 个字节，那么上一个节点长度等于后面4个字节存储的值
		else if ((prevlensize) == 5) {
                                                \
	        assert(sizeof((prevlensize)) == 4);                                    \
	        memcpy(&(prevlen), ((char*)(ptr)) + 1, 4);                             \
	        memrev32ifbe(&prevlen);                                                \
	    }                                                                          \
	} while(0);
```

这个方法也是一个宏定义方法，主要用途是用来计算上一个节点的使用长度，首先根据上个方法计算出占用的字节数量，来读取不同字节的值。

如果占用了 1 个字节，那么直接读取第 1 个字节的值。

如果占用了 4 个字节，那么读取后面 4 个字节的值。

##### 1.4.4 zipRawEntryLength

```java
	/* Return the total number of bytes used by the entry pointed to by 'p'. */
	static unsigned int zipRawEntryLength(unsigned char *p) {
	    unsigned int prevlensize, encoding, lensize, len;
	    ZIP_DECODE_PREVLENSIZE(p, prevlensize);
	    ZIP_DECODE_LENGTH(p + prevlensize, encoding, lensize, len);
	    return prevlensize + lensize + len;
	}
```

这个方法用来返回节点的长度，先计算上一个节点长度占用的字节数，然后再计算当前节点编码所占用的字节数，再计算实际数据的长度，通过相加得到整体节点的长度。

### 2 ziplistNext

#### 2.1 方法说明

返回压缩列表某一节点的下一个节点的指针。

#### 2.2 方法源码

```java
	unsigned char *ziplistNext(unsigned char *zl, unsigned char *p) {
	    ((void) zl);
	    /* "p" could be equal to ZIP_END, caused by ziplistDelete,
	     * and we should return NULL. Otherwise, we should return NULL
	     * when the *next* element is ZIP_END (there is no next entry). */
	    if (p[0] == ZIP_END) {
	        return NULL;
	    }
	    p += zipRawEntryLength(p);
	    if (p[0] == ZIP_END) {
	        return NULL;
	    }
	    return p;
	}
```

#### 2.3 代码理解

有了上面那个方法的理解，对压缩列表指针的移动肯定有了不少理解，主要就是通过移动一个节点的长度来达到访问下一个节点的目的，那么可以看到 ziplistNext 方法里没有太多的代码，先判断是不是压缩列表的尾部，如果不是就获取当前节点的长度，然后移动这些距离，最后将最新的指针位置返回出去，达到访问下一个节点的目的。

### 3 ziplistPrev

#### 3.1 方法说明

返回压缩列表某一节点的上一个节点的指针。

#### 3.2 方法源码

```java
	/* Return pointer to previous entry in ziplist. */
	unsigned char *ziplistPrev(unsigned char *zl, unsigned char *p) {
	    unsigned int prevlensize, prevlen = 0;
	    /* Iterating backwards from ZIP_END should return the tail. When "p" is
	     * equal to the first element of the list, we're already at the head,
	     * and should return NULL. */
	    if (p[0] == ZIP_END) {
	        p = ZIPLIST_ENTRY_TAIL(zl);
	        return (p[0] == ZIP_END) ? NULL : p;
	    } else if (p == ZIPLIST_ENTRY_HEAD(zl)) {
	        return NULL;
	    } else {
	        ZIP_DECODE_PREVLEN(p, prevlensize, prevlen);
	        assert(prevlen > 0);
	        return p-prevlen;
	    }
	}
```

#### 3.3 代码理解

可以从方法代码里看到，比起移动到下一个节点，移动到上一个节点还是有点复杂的。

如果指针是结束符，则返回尾部节点。

如果指针是头部节点，则返回 NULL。

都不是的话，则获取上一个节点的长度，通过当前指针减去上一节点的长度，来达到移动上一个节点的目的。

### 4 总结

**1、** 本节学习内容主要学习了压缩节点的遍历方法，包含了ziplistIndex、ziplistNext、ziplistPrev；

**2、** 遍历节点的主要思想是计算节点的长度，通过移动一个节点的长度来移动到上一个或者下一个节点上；

**3、** ZIP_DECODE_PREVLEN可以计算上一个节点的长度；

**4、** zipRawEntryLength可以计算当前节点的长度；

**5、** 每个节点头部用于存储上一个节点的长度；

**6、** 如果上一个节点长度小于254个字节，那么节点头部只会使用1个字节来存储上一个节点的长度；

**7、** 如果上一个节点长度大于254个字节，那么节点头部会使用5个字节来存储上一个节点的长度，并且第一个字节会储存254表示使用了5个字节来存储长度，剩下4个字节存储上一个节点的长度；
