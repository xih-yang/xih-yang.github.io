# 06、Redis 源码解析 - Redis 压缩列表
- 来源：https://ddkk.com/zhuanlan/db/redis/8/6.html
- 分类：缓存数据库
- 分组：教程目录
### 1. 介绍

`压缩列表（ziplist）`是列表键和哈希键的底层实现之一. 当一个列表键只包含少量列表项，并且每个列表项要么就是小整数值，要么就是长度比较短的字符串,那么Redis就会使用压缩列表来做列表键的底层实现.

当一个哈希键只包含少量键值对，并且每个键值对的键和值要么就是小整数值，要么就是长度比较短的字符串，那么Redis就会使用压缩列表来做哈希键的底层实现.

压缩列表是Redis为了节约内存而开发的，是由一系列特殊编码的连续内存块组成的顺序型数据结构. 一个压缩列表可以包含任意多个节点（entry），每个节点可以保存一个字节数组或者一个整数值.

### 2. 压缩列表的实现

#### 2.1 压缩列表结构

下图展示了压缩列表的各个组成部分：

下表是上图中各个部分的作用：

其中关于压缩列表的源码在`ziplist.h`和`ziplist.c`文件中.

Redis没有提供一个结构体来保存压缩列表的信息，而是提供了一组宏来定位每个成员的地址.

由于压缩列表对数据的信息访问都是以字节为单位的，所以参数`zl`的类型是`char *`类型的，因此对`zl`指针进行系列的强制类型转换， 以便对不同长度成员的访问：

```java
// 将zl定位到前4个字节的bytes成员，记录这整个压缩列表的内存字节数
#define ZIPLIST_BYTES(zl)       (*((uint32_t*)(zl)))
// 将zl定位到4字节到8字节的offset成员，记录着压缩列表尾节点距离列表的起始地址的偏移字节量
#define ZIPLIST_TAIL_OFFSET(zl) (*((uint32_t*)((zl)+sizeof(uint32_t))))
// 将zl定位到8字节到10字节的length成员，记录着压缩列表的节点数量
#define ZIPLIST_LENGTH(zl)      (*((uint16_t*)((zl)+sizeof(uint32_t)*2)))
// 压缩列表表头（以上三个属性）的大小10个字节
#define ZIPLIST_HEADER_SIZE     (sizeof(uint32_t)*2+sizeof(uint16_t))
// 返回压缩列表首节点的地址
#define ZIPLIST_ENTRY_HEAD(zl)  ((zl)+ZIPLIST_HEADER_SIZE)
// 返回压缩列表尾节点的地址
#define ZIPLIST_ENTRY_TAIL(zl)  ((zl)+intrev32ifbe(ZIPLIST_TAIL_OFFSET(zl)))
// 返回end成员的地址，一个字节
#define ZIPLIST_ENTRY_END(zl)   ((zl)+intrev32ifbe(ZIPLIST_BYTES(zl))-1)
// 压缩列表的末尾end成员的值
#define ZIP_END 255
// 压缩列表的最多节点数
#define ZIP_BIGLEN 254
```

**创建一个空的压缩列表**

```java
// 创建并返回一个新的压缩列表
unsigned char *ziplistNew(void) {
    // ZIPLIST_HEADER_SIZE是压缩列表的表头大小，1字节是末端的end大小
    unsigned int bytes = ZIPLIST_HEADER_SIZE+1;
	// 为表头和表尾end成员分配空间
    unsigned char *zl = zmalloc(bytes);
    // 将zlbytes属性设置为小端字节
    ZIPLIST_BYTES(zl) = intrev32ifbe(bytes);
    // 将zltail属性设置为小端字节
    ZIPLIST_TAIL_OFFSET(zl) = intrev32ifbe(ZIPLIST_HEADER_SIZE);
    // 空列表的节点数量为0
    ZIPLIST_LENGTH(zl) = 0;
    //将表尾end成员设置成默认的255
    zl[bytes-1] = ZIP_END;
    return zl;
}
```

#### 2.2 压缩列表节点

`ziplist.c`文件中定义了如下所示的压缩列表节点结构体，但实际上Redis并不使用这个结构体来储存压缩列表节点的数据.

```java
/* We use this function to receive information about a ziplist entry.
 * Note that this is not how the data is actually encoded, is just what we
 * get filled by a function in order to operate more easily. */
typedef struct zlentry {
    unsigned int prevrawlensize; /* Bytes used to encode the previous entry len*/
    unsigned int prevrawlen;     /* Previous entry len. */
    unsigned int lensize;        /* Bytes used to encode this entry type/len.
                                    For example strings have a 1, 2 or 5 bytes
                                    header. Integers always use a single byte.*/
    unsigned int len;            /* Bytes used to represent the actual entry.
                                    For strings this is just the string length
                                    while for integers it is 1, 2, 3, 4, 8 or
                                    0 (for 4 bit immediate) depending on the
                                    number range. */
    unsigned int headersize;     /* prevrawlensize + lensize. */
    unsigned char encoding;      /* Set to ZIP_STR_* or ZIP_INT_* depending on
                                    the entry encoding. However for 4 bits
                                    immediate integers this can assume a range
                                    of values and must be range-checked. */
    unsigned char *p;            /* Pointer to the very start of the entry, that
                                    is, this points to prev-entry-len field. */
} zlentry;
```

压缩列表节点的真实结构是这样的：

- previous_entry_length属性以字节为单位，记录了压缩列表中前一个节点的长度，该属性的长度可以是1字节或者5字节. 根据这个属性，我们可以直接通过指针运算得到前一个节点的起始地址.
- 如果前一节点的长度小于`254`字节，那么`previous_entry_length`属性的长度为1字节，前一节点的长度就保存在这一个字节里面.
- 如果前一节点的长度大于等于254字节，那么`previous_entry_length`属性的长度为5字节，其中属性的第一字节会被设置为`0xFE (十进制值254 )`，而之后的四个字节则用于保存前一节点的长度.

```plaintext
```java 
// 对p指向的当前节点的前驱节点的长度len成员进行编码，并写入p中，如果p为空，则仅仅返回编码len所需要的字节数
static unsigned int zipPrevEncodeLength(unsigned char *p, unsigned int len) {
    if (p == NULL) {
    	// 如果前驱节点的长度len字节小于254则返回1个字节，否则返回5个
        return (len < ZIP_BIGLEN) ? 1 : sizeof(len)+1; 
    } else {
   		// 如果前驱节点的长度len字节小于254
        if (len < ZIP_BIGLEN) {
      	    // 将len保存在p[0]中
            p[0] = len;
            // 返回所需的编码数1字节
            return 1;
        } else {
       		// 前驱节点的长度len大于254字节
       		// 添加5字节的标示，0xFE（254）
            p[0] = ZIP_BIGLEN;
            // 从p+1的起始地址开始拷贝len
            memcpy(p+1,&len,sizeof(len));
            memrev32ifbe(p+1);
            // 返回所需的编码数5字节
            return 1+sizeof(len); 
        }
    }
}
```

```plaintext
 *  encoding属性记录了节点的content属性所保存数据的类型以及长度：
 *  `1`、`2`或者`5`字节长值的最高位为`00`、`01`或者`10`的是字节数组编码，这种编码表示节点的`content`属性保存着`字节数组`，数组的长度由编码除去最高两位之后的其他位记录.
 *  `1`字节长，值的最高位以`11`开头的是`整数编码`，这种编码表示节点的`content`属性保存着整数值，整数值的类型和长度由编码除去最高两位之后的其他位记录.
    相关宏定义：
```java 
	// 字节数组
	#define ZIP_STR_MASK 0xc0               //1100 0000
	#define ZIP_STR_06B (0 << 6)            //0000 0000
	#define ZIP_STR_14B (1 << 6)            //0100 0000
	#define ZIP_STR_32B (2 << 6)            //1000 0000
	// 整数
	#define ZIP_INT_MASK 0x30               //0011 0000
	#define ZIP_INT_16B (0xc0 | 0<<4)       //1100 0000
	#define ZIP_INT_32B (0xc0 | 1<<4)       //1101 0000
	#define ZIP_INT_64B (0xc0 | 2<<4)       //1110 0000
	#define ZIP_INT_24B (0xc0 | 3<<4)       //1111 0000
	#define ZIP_INT_8B 0xfe                 //1111 1110
```

- content属性负责保存节点的值，节点值可以是一个字节数组或者整数，值的类型和长度由节点的encoding属性决定.
- 每个压缩列表节点可以保存一个字节数组或者一个整数值：

字节数组：

长度小于等于`63 * (2 ^ 6 - 1)`字节的字节数组
- 长度小于等于`16383 * (2 ^ 14 - 1)`字节的字节数组
- 长度小于等于`4 294 967 295 * (2 ^ 32 - 1)`字节的字节数组

整数

- 4位长，介于0至12之间的无符号整数
- 1字节长的有符号整数
- 3字节长的有符号整数
- `int16_t`类型整数
- `int32_t`类型整数
- `int64_t`类型整数

### 3. 连锁更新

前面说过，每个节点的`previous_entry_length`属性都记录了前一个节点的长度：

- 如果前一节点的长度小于254字节，那么previous_entry_length属性的长度为1字节，前一节点的长度就保存在这一个字节里面.
- 如果前一节点的长度大于等于254字节，那么previous_entry_length属性的长度为5字节，其中属性的第一字节会被设置为0xFE (十进制值254 )，而之后的四个字节则用于保存前一节点的长度.

现在，考虑这样一种情况：在一个压缩列表中，有多个连续的、长度介于`250`字节到`253`字节之间的节点`e1`至`eN`，如下图所示：

因为`e1`至`eN`的所有节点的长度都小于`254`字节，所以记录这些节点的长度只需要`1`字节长的`previous_entry_length`属性.

这时，如果我们将一个长度大于等于`254`字节的新节点`new`设置为压缩列表的表头节点，那么`new`将成为`el`的前置节点，如下图所示：

因为`e1`的`previous_entry_length`属性仅长`1`字节，它没办法保存新节点new的长度，所以程序将对压缩列表执行空间重分配操作，并将`e1`节点的`previous_entry_length`属性从原来的`1`字节长扩展为`5`字节长.

接着程序会不断的对压缩列表执行空间重分配操作，直到`eN`为止.

Redis将这种在特殊情况下产生的连续多次空间扩展操作称之为`"连锁更新"`. 出了添加节点可能引发连锁更新以外，删除节点也可能引发连锁更新.

因为连锁更新在最坏情况下需要对压缩列表执行`N`次空间重分配操作，而每次空间重分配的最坏复杂度为`O(N)`，所以连锁更新的最坏复杂度为`O(N)`.

但其实我们可以不用担心连锁更新的问题，因为连锁更新在Redis中发生的概率比较低：

- 首先，压缩列表里要恰好有多个连续的、长度介于250字节至253字节之间的节点，连锁更新才有可能被引发，在实际中，这种情况并不多见.
- 其次，即使出现连锁更新，但只要被更新的节点数量不多，就不会对性能造成任何影响：比如说，对三五个节点进行连锁更新是绝对不会影响性能的.（一旦存储的数据量变大，Redis一般就不会使用压缩列表了）.
