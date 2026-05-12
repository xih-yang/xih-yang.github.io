# 28、Redis 源码解析 - Redis 压缩列表学习，ziplist.c（一）
- 来源：https://ddkk.com/zhuanlan/db/redis/5/28.html
- 分类：缓存数据库
- 分组：教程目录
经过我们的不懈努力终于把SDS和双端链表搞定之后，现在要进入压缩列表数据结构的学习，ziplist是列表、hash、有序集合的数据结构之一。

压缩列表听名字是经过压缩的一种列表，是用提高内存使用率的一种数据结构，下面我们就来看看它究竟是什么样的数据结构。

### 1 介绍

#### 1.1 ziplist

虽然网上有很多关于Redis中ziplist介绍，不过我们最好还是阅读作者的说明更加准确点。

```java
/* The ziplist is a specially encoded dually linked list that is designed
 * to be very memory efficient. It stores both strings and integer values,
 * where integers are encoded as actual integers instead of a series of
 * characters. It allows push and pop operations on either side of the list
 * in O(1) time. However, because every operation requires a reallocation of
 * the memory used by the ziplist, the actual complexity is related to the
 * amount of memory used by the ziplist.
```

大概翻译，ziplist是一个特殊编码的双向链表是非常有效的内存。 它同时存储字符串和整数值， 其中整数被编码为实际整数，而不是一系列 字符。 它允许在列表的任意一边进行推送和弹出操作 时间复杂度 O(1)。 但是，因为每个操作都需要重新分配由ziplist使用的内存，实际的复杂性与ziplist使用的内存数量。

可以看到作者的意思是构建了一种比双向链表更加节省内存的结构，也可以在列表的两端进入推入和弹出的操作。

#### 1.2 结构分布

```java
 * ZIPLIST OVERALL LAYOUT:
 * The general layout of the ziplist is as follows:
 * <zlbytes><zltail><zllen><entry><entry><zlend>
 *
 * <zlbytes> is an unsigned integer to hold the number of bytes that the
 * ziplist occupies. This value needs to be stored to be able to resize the
 * entire structure without the need to traverse it first.
 *
 * <zltail> is the offset to the last entry in the list. This allows a pop
 * operation on the far side of the list without the need for full traversal.
 *
 * <zllen> is the number of entries.When this value is larger than 2**16-2,
 * we need to traverse the entire list to know how many items it holds.
 *
 * <zlend> is a single byte special value, equal to 255, which indicates the
 * end of the list.
```

大致翻译

- ziplist的结构分布由以下几个元素组成：zlbytes、zltail、zllen 、entry、 entry、zlend
- zlbytes：一个无符号整数，用来保存的 ziplist总共占用的字节数 。存储此值以便能够调整节点不需要先遍历整个结构。
- zltail：到列表中最后一项的偏移量。 这允许在列表的远端执行弹出操作，而不需要进行完整的遍历。
- zllen：节点的数量。 当该值大于2*16-2时， 我们需要遍历整个列表，以知道它包含多少项。
- zlend：是一个单字节的特殊值，等于255，表示压缩列表的结束。

#### 1.3 entry

在压缩列表的结构分布中，可以把前面的3个属性zlbytes、zltail、zllen理解为表头，zlend理解为表尾，entry理解为节点，所以表头和表尾中间会有多个entry节点，下面来看下作者如何介绍节点的。

```java
 * ZIPLIST ENTRIES:
 * Every entry in the ziplist is prefixed by a header that contains two pieces
 * of information. First, the length of the previous entry is stored to be
 * able to traverse the list from back to front. Second, the encoding with an
 * optional string length of the entry itself is stored.
 *
 * The length of the previous entry is encoded in the following way:
 * If this length is smaller than 254 bytes, it will only consume a single
 * byte that takes the length as value. When the length is greater than or
 * equal to 254, it will consume 5 bytes. The first byte is set to 254 to
 * indicate a larger value is following. The remaining 4 bytes take the
 * length of the previous entry as value.
 * 
 * The other header field of the entry itself depends on the contents of the
 * entry. When the entry is a string, the first 2 bits of this header will hold
 * the type of encoding used to store the length of the string, followed by the
 * actual length of the string. When the entry is an integer the first 2 bits
 * are both set to 1. The following 2 bits are used to specify what kind of
 * integer will be stored after this header. An overview of the different
 * types and encodings is as follows:
```

大致翻译：

ziplist中的每个节点头部都包含两个部分信息。首先，将前一个节点的长度存储为能够从后到前遍历列表。二是编码用可选的字符串长度的条目本身被存储。

前一项的长度按以下方式编码:如果这个长度小于254字节，它将只消耗一个字节以长度为值的字节。当长度大于或时等于254，它将消耗5个字节。第一个字节设置为254表示后面有一个更大的值。剩下的4个字节采用前一项的长度作为值。

节点的另一头部信息取决于节点的内容本身。当节点内容是字符串时，头2位保存用于存储字符串长度的编码类型，后跟字符串的实际长度。如果节点内容是整数，则为前2位均为1。下面的2位用来指定哪integer将存储在此头文件之后。

刚开始看可能会看的一头雾水，先大概理解每个节点存储了以下信息就可以。

- 头部
- 上一个节点的长度
- 当前节点内容编码
- 内容
- 指向数据的指针

#### 1.4 entry结构体

```java
typedef struct zlentry {
    unsigned int prevrawlensize, prevrawlen;
    unsigned int lensize, len;
    unsigned int headersize;
    unsigned char encoding;
    unsigned char *p;
} zlentry;
```

- prevrawlensize:记录前一个节点的长度占据需要使用的字节大小。
- prevrawlen：记录前一个节点的长度。
- lensize：记录当前节点长度需要使用的字节大小。
- len：记录当前节点的长度。
- headersize：记录头部总长度的需要的字节大小。
- encoding：记录编码格式。
- *p：记录数据的指针。

#### 1.5 宏定义

```java
/* Utility macros */
//压缩列表总长度
#define ZIPLIST_BYTES(zl)       (*((uint32_t*)(zl)))
//压缩列表距离尾部偏移量
#define ZIPLIST_TAIL_OFFSET(zl) (*((uint32_t*)((zl)+sizeof(uint32_t))))
//压缩列表节点数量
#define ZIPLIST_LENGTH(zl)      (*((uint16_t*)((zl)+sizeof(uint32_t)*2)))
//ziplist头部长度，分别记录zlbytes、zltail、zlen
#define ZIPLIST_HEADER_SIZE     (sizeof(uint32_t)*2+sizeof(uint16_t))
//压缩列表头节点位置
#define ZIPLIST_ENTRY_HEAD(zl)  ((zl)+ZIPLIST_HEADER_SIZE)
//压缩列表尾节点位置
#define ZIPLIST_ENTRY_TAIL(zl)  ((zl)+intrev32ifbe(ZIPLIST_TAIL_OFFSET(zl)))
//压缩列表结束位置
#define ZIPLIST_ENTRY_END(zl)   ((zl)+intrev32ifbe(ZIPLIST_BYTES(zl))-1)
```

### 2 ziplistNew

#### 2.1 方法说明

#### 2.2 方法源代码

```java
/* Create a new empty ziplist. */
unsigned char *ziplistNew(void) {
	//计算空压缩列表的总长度，头部长度加一个尾部标志
    unsigned int bytes = ZIPLIST_HEADER_SIZE+1;
	//根据计算出的长度，分配内存
    unsigned char *zl = zmalloc(bytes);
	//记录总长度
    ZIPLIST_BYTES(zl) = intrev32ifbe(bytes);
	//记录偏移量
    ZIPLIST_TAIL_OFFSET(zl) = intrev32ifbe(ZIPLIST_HEADER_SIZE);
	//记录节点数量
    ZIPLIST_LENGTH(zl) = 0;
	//压缩列表结尾设置特殊值
    zl[bytes-1] = ZIP_END;
    return zl;
}
```

#### 2.3 方法理解

- 先计算空压缩列表需要的字节大小
- 根据计算的长度分配内存
- 记录压缩列表总长度
- 记录偏移量
- 记录压缩列表的节点数量为0
- 压缩列表结尾设置特殊值
- 返回压缩列表的指针

这个方法创建了一个空的压缩列表，但是可以发现很奇怪并没有使用任何结构体，只是单纯地开辟了一些内存空间，直接把需要记录的值存到指定的内存位置里。这也体现出压缩列表的意义，直接使用一系列连续的内存空间来存储值，避免了内存碎片也节省了结构体的内存开销。

### 3 __ziplistInsert

#### 3.1 方法说明

__ziplistInsert 这个方法是向压缩列表中插入一个节点

#### 3.2 方法源代码

t_list.c 片段

```java
    if (subject->encoding == REDIS_ENCODING_ZIPLIST) {
        int pos = (where == REDIS_HEAD) ? ZIPLIST_HEAD : ZIPLIST_TAIL;
        value = getDecodedObject(value);
        subject->ptr = ziplistPush(subject->ptr,value->ptr,sdslen(value->ptr),pos);
        decrRefCount(value);
    } 
```

```java
unsigned char *ziplistPush(unsigned char *zl, unsigned char *s, unsigned int slen, int where) {
    unsigned char *p;
    p = (where == ZIPLIST_HEAD) ? ZIPLIST_ENTRY_HEAD(zl) : ZIPLIST_ENTRY_END(zl);
    return __ziplistInsert(zl,p,s,slen);
}
```

```java
static unsigned char *__ziplistInsert(unsigned char *zl, unsigned char *p, unsigned char *s, unsigned int slen) {
    size_t curlen = intrev32ifbe(ZIPLIST_BYTES(zl)), reqlen;
    unsigned int prevlensize, prevlen = 0;
    size_t offset;
    int nextdiff = 0;
    unsigned char encoding = 0;
    long long value = 123456789; /* initialized to avoid warning. Using a value
                                    that is easy to see if for some reason
                                   we use it uninitialized. */ 
    zlentry tail;
    /* Find out prevlen for the entry that is inserted. */
    //根据上一个节点长度计算prevlensize,prevlen。
    if (p[0] != ZIP_END) {
        ZIP_DECODE_PREVLEN(p, prevlensize, prevlen);
    } else {
        unsigned char *ptail = ZIPLIST_ENTRY_TAIL(zl);
        if (ptail[0] != ZIP_END) {
            prevlen = zipRawEntryLength(ptail);
        }
    }
    /* See if the entry can be encoded */
    //对当前内容进行编码
    if (zipTryEncoding(s,slen,&value,&encoding)) {
        /* 'encoding' is set to the appropriate integer encoding */
        reqlen = zipIntSize(encoding);
    } else {
        /* 'encoding' is untouched, however zipEncodeLength will use the
         * string length to figure out how to encode it. */
        reqlen = slen;
    }
    /* We need space for both the length of the previous entry and
     * the length of the payload. */
	//计算需要的长度
    reqlen += zipPrevEncodeLength(NULL,prevlen);
    reqlen += zipEncodeLength(NULL,encoding,slen);
    /* When the insert position is not equal to the tail, we need to
     * make sure that the next entry can hold this entry's length in
     * its prevlen field. */
    //判断下一个节点的能否存下当前新增节点的长度
    int forcelarge = 0;
    nextdiff = (p[0] != ZIP_END) ? zipPrevLenByteDiff(p,reqlen) : 0;
    if (nextdiff == -4 && reqlen < 4) {
        nextdiff = 0;
        forcelarge = 1;
    }
    /* Store offset because a realloc may change the address of zl. */
    //内存重新分配
    offset = p-zl;
    zl = ziplistResize(zl,curlen+reqlen+nextdiff);
    p = zl+offset;
    /* Apply memory move when necessary and update tail offset. */
    //如果添加的节点不在尾部，则需要进行内存移动
    if (p[0] != ZIP_END) {
        /* Subtract one because of the ZIP_END bytes */
        memmove(p+reqlen,p-nextdiff,curlen-offset-1+nextdiff);
        /* Encode this entry's raw length in the next entry. */
        if (forcelarge)
            zipPrevEncodeLengthForceLarge(p+reqlen,reqlen);
        else
            zipPrevEncodeLength(p+reqlen,reqlen);
        /* Update offset for tail */
        //更新偏移量
        ZIPLIST_TAIL_OFFSET(zl) =
            intrev32ifbe(intrev32ifbe(ZIPLIST_TAIL_OFFSET(zl))+reqlen);
        /* When the tail contains more than one entry, we need to take
         * "nextdiff" in account as well. Otherwise, a change in the
         * size of prevlen doesn't have an effect on the *tail* offset. */
        tail = zipEntry(p+reqlen);
        if (p[reqlen+tail.headersize+tail.len] != ZIP_END) {
            ZIPLIST_TAIL_OFFSET(zl) =
                intrev32ifbe(intrev32ifbe(ZIPLIST_TAIL_OFFSET(zl))+nextdiff);
        }
    } else {
        /* This element will be the new tail. */
        ZIPLIST_TAIL_OFFSET(zl) = intrev32ifbe(p-zl);
    }
    /* When nextdiff != 0, the raw length of the next entry has changed, so
     * we need to cascade the update throughout the ziplist */
     //如果下一个节点记录上一个节点长度引起变化，则需要对所有的节点进行重新计算。
    if (nextdiff != 0) {
        offset = p-zl;
        zl = __ziplistCascadeUpdate(zl,p+reqlen);
        p = zl+offset;
    }
    /* Write the entry */
    //插入新的节点
    p += zipPrevEncodeLength(p,prevlen);
    p += zipEncodeLength(p,encoding,slen);
    if (ZIP_IS_STR(encoding)) {
        memcpy(p,s,slen);
    } else {
        zipSaveInteger(p,value,encoding);
    }	
	//压缩列表长度加1
    ZIPLIST_INCR_LENGTH(zl,1);
    return zl;
}
```

#### 3.3 方法理解

**1、** 计算上一个节点的长度，并赋值给prevlensize,prevlen；

**2、** 针对当前内容类型进行编码；

**3、** 如果新增节点不是最后一个节点，则需要判断下一个节点的能否存下当前新增节点的长度；

**4、** 重新分配压缩列表的内存；

**5、** 如果新增节点不是最后一个节点，则需要进行内存移动，腾出位置给新节点；

**6、** 如果下一个节点记录上一个节点长度引起变化，则需要对所有的节点进行重新计算上一个节点的长度；

**7、** 插入新的节点；

**8、** 压缩列表长度加1；

可以看到压缩列表插入一个新的节点涉及到大量内存的操作，所以整个方法看起来比较复杂，而且方法里面很多方法也很复杂，如果对压缩列表结构不了解并且对C语言内存操作也不是很熟悉的话，一时半会很难理解这个方法到底在干些啥，我这里先简单介绍下这个方法大体做了一些什么。

##### 3.3.1 计算新的长度

每次新插入一个节点，都需要重新分配内存，那么在分配内存之前需要计算新的总体长度。

首先计算新节点的长度，这个好计算，内容的长度，上一个节点的长度和这个长度本身占据的长度，还有编码的长度。

计算差值，这里需要判断当前新节点的总体长度是否会引起下一个节点记录头部记录的变化，比如之前下一个节点记录上一个节点的长度小于254只用了1个字节，然后新节点超过254，则需要4个字节，这个时候就需要补上这4个差值。

所以最后可以在代码里看到新长度等于：目前长度+新节点长度+差值

```java
	zl = ziplistResize(zl,curlen+reqlen+nextdiff);
```

##### 3.3.2 重新分配内存

计算出新的长度之后，就是要拿着新长度去重新分配内存，这里重新分配内存是对整体的压缩列表重新分配内存，相当于把之前的压缩列表干掉复制到一块新的连续内存上。

因为压缩列表是一个连续内存数据结构，又无法做到在之前内存上加一块，所以新增节点需要重新整体分配内存。

##### 3.3.3 内存移动

新的长度也计算了，内存也重新分配了，该插入新节点了，这个时候就要看插入新节点的位置了，如果是插入到末尾那就很方便直接插入就好，但如果插入的位置是头部就比较麻烦了，要将之前所有的节点都整体往后移，腾出位置给新的节点，所以能看得出来向压缩列表头部插入元素是一个非常费劲的事。

##### 3.3.4 连锁更新

前面讲到过计算差值，如果引起下一个节点的变化，可能会导致下一个节点的整体长度也发生变化，从而导致下下个节点也需要计算差值，然后又进行重新分配内存，补差值一直遍历下去到没有引起变化为止，所以这是一个比较耗性能的事情，不过一般发生的这种情况的概率比较小。

进行连锁更新的动作都在这个方法 __ziplistCascadeUpdate 里执行。

### 4 总结

**1、** 压缩列表使用一系列连续的内存来储存数据；

**2、** 压缩列表整体结构包含元素有zlbytes、zltail、zllen、entry、entry、zlend；

**3、** 压缩列表表头部分包括zlbytes、zltail、zllen；

**4、** 压缩列表表尾部分包括zlend，是一个特殊值255；

**5、** 压缩列表节点entry包括上个节点的长度、当前节点内容编码、指向值的指针；

**6、** 压缩列表新增节点需要对整体压缩列表重新分配；

**7、** 压缩列表新增节点可能会引起连锁更新；

**8、** 压缩列表只要不是从尾部增加节点，代价都比较高；

### 5 End

压缩列表整体复杂度比较高，需要掌握很多C语言指针、内存相关知识才能比较好的消化这些东西，所以一时半会整不明白也不要灰心，慢慢逐个攻破就好，后续我会补充一些关于C语言的知识，这样可以加强我们阅读Redis源码的质量。
