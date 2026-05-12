# 26、Redis 源码解析 - Redis listpack 源码解析
- 来源：https://ddkk.com/zhuanlan/db/redis/7/26.html
- 分类：缓存数据库
- 分组：教程目录
listpack是Redis5.0引入的一个全新的数据结构，看起来它更像是ziplist的替代品，因为保证了和ziplist一样的功能且避免了级联更新，但是可能是因为zipkist现在在hash和set结构中内嵌过于麻烦（猜的），这两个地方还没有被替换掉，倒是`stream`中用`listpack`来作为`radix tree`节点中存储前缀的压缩方式，倒也非常的合理，因为目前`radix tree`在Redis中只有两处使用，分别为**在集群模式下存储slot对应的的所有key信息以及stream中ID为key的数据的存储**，可以看到key均为数字，而在`listpack`这种压缩方式下短数字的存储非常节省内存。所以我们有必要了解这种奇巧的数据结构，以后在一些地方也可以直接用这种方式存储数据。

看git log这部分代码绝大多数是`antirez`大哥亲自写的，而且很多地方四年也没有改了，如此至少有两个好处，一点是我们这些凡人也可以看看这等高手的写代码方式；一点是说不定还能蹭一两个MR。

就我目前来看，网上应该还没有对这个结构的源码解析，所以对于文中的内容都是自己摸爬滚打，错误是难免的，还是希望大家多多包容并提出意见。

## 源码解析

### 结构体

图片来源于[1]，我看着很不错，就借来一用。

这张图片使得我们可以很好的看出listpack的组织形式：

**1、**`total_bytes`：结构所占的字节数固定**四个字节**；

**2、**`size`：entrys长度固定**两个字节**；

**3、**`entrys`：存储一般意义上的数据项；

**4、**`end`：占一个字节，永远为0xFF，固定**一个字节**；

`entry`结构的解释下：

**1、**`encoding`：content实际对应的编码方式；

**2、**`content`：实际的内容存储点；

**3、**`length`：此entry的实际长度；

可以看到 listpack 跟 ziplist 的结构除了zltail_offset以外几乎一摸一样，既然没了zltail_offset，该如何定位到最后一位呢？我们在后面的源码解析中见分晓。

### lpNew

```java
// 这里的capacity其实是字节数；lpNew其实就是创建一个entrys为零的listpack
unsigned char *lpNew(size_t capacity) {
    unsigned char *lp = lp_malloc(capacity > LP_HDR_SIZE+1 ? capacity : LP_HDR_SIZE+1);
    if (lp == NULL) return NULL;
    lpSetTotalBytes(lp,LP_HDR_SIZE+1);
    lpSetNumElements(lp,0);
    //define LP_HDR_SIZE 6   注意这里EOF设置的为止，多出来的容量实际都在后面
    lp[LP_HDR_SIZE] = LP_EOF;
    return lp;
}
// 可以看到total_bytes和size字段都是固定大小的。
#define lpSetTotalBytes(p,v) do {
        \
    (p)[0] = (v)&0xff; \
    (p)[1] = ((v)>>8)&0xff; \
    (p)[2] = ((v)>>16)&0xff; \
    (p)[3] = ((v)>>24)&0xff; \
} while(0)
#define lpSetNumElements(p,v) do {
        \
    (p)[4] = (v)&0xff; \
    (p)[5] = ((v)>>8)&0xff; \
} while(0)
```

### lpFirst，lpLast，lpNext，lpPrev，lpSkip

这五个函数其实就是提取数据项辅助函数，放在一起看好了。

要提的是`lpNext，lpPrev`都有两个参数，第二个参数代表了prev和next那个base点。

```java
// 其实就是lpNext的辅助函数，在lpinsert中也用到了
unsigned char *lpSkip(unsigned char *p) {
	// lpCurrentEncodedSizeUnsafe可以求出p所指entry的encoding和content
    unsigned long entrylen = lpCurrentEncodedSizeUnsafe(p);
    // lpEncodeBacklen可以根据前两项的长度求出第三项；
    // 这个函数的实现可以看到length的结构其实为了方便解析是倒序的，后面我们再仔细分析
    entrylen += lpEncodeBacklen(NULL,entrylen);
    // 指针一加就得到下一项的地址了
    p += entrylen;
    return p;
}
// 相比于lpSkip做了越界检查
unsigned char *lpNext(unsigned char *lp, unsigned char *p) {
    assert(p);
    p = lpSkip(p);
    ASSERT_INTEGRITY(lp, p);
    if (p[0] == LP_EOF) return NULL;
    return p;
}
/* If 'p' points to an element of the listpack, calling lpPrev() will return
 * the pointer to the previous element (the one on the left), or NULL if 'p'
 * already pointed to the first element of the listpack. */
unsigned char *lpPrev(unsigned char *lp, unsigned char *p) {
    assert(p);
    // entry长度为零，前面没啥了，直接退出
    if (p-lp == LP_HDR_SIZE) return NULL;
    p--; /* Seek the first backlen byte of the last element. */
    uint64_t prevlen = lpDecodeBacklen(p);
    prevlen += lpEncodeBacklen(NULL,prevlen);
    p -= prevlen-1; /* Seek the first byte of the previous entry. */
    ASSERT_INTEGRITY(lp, p);
    return p;
}
// 通过指向length最后一个字节的指针解析出此entry的length，这里的设计还是非常巧妙的
uint64_t lpDecodeBacklen(unsigned char *p) {
    uint64_t val = 0;
    uint64_t shift = 0;
    do {
        val |= (uint64_t)(p[0] & 127) << shift;
        // 这里是不是很奇怪，为什要与第八位&一下，等于0就退出了
        // 原因在lpEncodeBacklen中，length的编码是逐字节倒序的
        // 而且最高字节最高位一定会设置为零（length为5以下），以此划分length的边界
        if (!(p[0] & 128)) break;
        shift += 7;
        p--;
        // 这里就是length等于5的情况，在lpEncodeBacklen可以看到在length等于5时有一个截断的情况出现
 		// 看起来大哥嫌麻烦不想处理这里了，行为比较奇怪，可以交个PR：#9087
        if (shift > 28) return UINT64_MAX;
    } while(1);
    return val;
}
unsigned char *lpFirst(unsigned char *lp) {
    lp += LP_HDR_SIZE; /* Skip the header. */
    if (lp[0] == LP_EOF) return NULL;
    return lp;
}
// 这下知道怎么定位最后一个元素了吧，还是length的编码比较六带来的便利
unsigned char *lpLast(unsigned char *lp) {
	// 定位到EOF前面
    unsigned char *p = lp+lpGetTotalBytes(lp)-1;
    return lpPrev(lp,p); /* Will return NULL if EOF is the only element. */
}
```

### lpEncodeBacklen

用于解码`entry`的`length`字段

```java
// 用最高位字节为零来当作边界，这样显然是有精度损失的
// 前四个字节7比特有效，第五个字节8比特有效
unsigned long lpEncodeBacklen(unsigned char *buf, uint64_t l) {
    if (l <= 127) {
      // 2^7 - 1
        if (buf) buf[0] = l;
        return 1;
    } else if (l < 16383) {
     //2^{14} - 1
        if (buf) {
            buf[0] = l>>7;
            buf[1] = (l&127)|128;
        }
        return 2;
    } else if (l < 2097151) {
      //2^{21} - 1
        if (buf) {
            buf[0] = l>>14;
            buf[1] = ((l>>7)&127)|128;
            buf[2] = (l&127)|128;
        }
        return 3;
    } else if (l < 268435455) {
      // 2^{28} - 1
        if (buf) {
            buf[0] = l>>21;
            buf[1] = ((l>>14)&127)|128;
            buf[2] = ((l>>7)&127)|128;
            buf[3] = (l&127)|128;
        }
        return 4;
    } else {
        if (buf) {
     	// 传入类型是uint64_t，显然是有精度损失的
            buf[0] = l>>28;
            buf[1] = ((l>>21)&127)|128;
            buf[2] = ((l>>14)&127)|128;
            buf[3] = ((l>>7)&127)|128;
            buf[4] = (l&127)|128;
        }
        return 5;
    }
}
```

### lpInsert

```java
// lp：listpack结构
// ele：插入的数据
// size：插入数据的长度
// p：这是一个指向某个元素的指针，由lpFirst(), lpLast(), lpNext(), lpPrev() or lpSeek()得到
// where：插入时是before还是after；LP_REPLACE也是有效的
// newp：新插入的指针以后，这个元素的指针下标
unsigned char *lpInsert(unsigned char *lp, unsigned char *ele, uint32_t size, unsigned char *p, int where, unsigned char **newp) {
	// 存储解码的entry的encoding与content（string的话不算content）字段
    unsigned char intenc[LP_MAX_INT_ENCODING_LEN];
    // 存储解码的length字段
    unsigned char backlen[LP_MAX_BACKLEN_SIZE];
    uint64_t enclen; /* The length of the encoded element. */
    // ele为null是认为行为为删除掉p位置的数据，所以改op为LP_REPLACE
    if (ele == NULL) where = LP_REPLACE;
	// 统一after和before的行为，下面好处理一点
    if (where == LP_AFTER) {
        p = lpSkip(p);
        where = LP_BEFORE;
        ASSERT_INTEGRITY(lp, p);
    }
	// 记录p前面的长度，这部分relloc以后偏移也不变
    unsigned long poff = p-lp;
	// 调用lpEncoGetType来决定ele的实际encoding是什么
	// 可能是int（五种）也可能是str，返回值为类型，是int的话写入到intenc
	// enclen记录encoding实际长度，只有int类型有效
    int enctype;
    if (ele) {
        enctype = lpEncodeGetType(ele,size,intenc,&enclen);
    } else {
        enctype = -1;
        enclen = 0;
    }
	// 通过enclen解码length的长度，虽然str还没写入，但是size已经记录了
    unsigned long backlen_size = ele ? lpEncodeBacklen(backlen,enclen) : 0;
    uint64_t old_listpack_bytes = lpGetTotalBytes(lp);
    uint32_t replaced_len  = 0;
    if (where == LP_REPLACE) {
        replaced_len = lpCurrentEncodedSizeUnsafe(p);
        replaced_len += lpEncodeBacklen(NULL,replaced_len);
        ASSERT_INTEGRITY_LEN(lp, p, replaced_len);
    }
	// 新listpack需要的字节数
    uint64_t new_listpack_bytes = old_listpack_bytes + enclen + backlen_size
                                  - replaced_len;
	// 可以看到listpack长度不允许超过UINT32_MAX，可以看出那里返回uint64_max是有问题的
    if (new_listpack_bytes > UINT32_MAX) return NULL;
    unsigned char *dst = lp + poff; /* May be updated after reallocation. */
    // 很有意思的判断条件，lp_malloc_size实际返回的是malloc族函数实际分配的内存大小
   	// 一定大于等于我们传进去的参数。一个我们代码中可以使用的小trick
    if (new_listpack_bytes > old_listpack_bytes &&
        new_listpack_bytes > lp_malloc_size(lp)) {
        if ((lp = lp_realloc(lp,new_listpack_bytes)) == NULL) return NULL;
        dst = lp + poff;
    }
	// 不同的op决定不同的行为
    if (where == LP_BEFORE) {
        memmove(dst+enclen+backlen_size,dst,old_listpack_bytes-poff);
    } else {
      /* LP_REPLACE. */
        long lendiff = (enclen+backlen_size)-replaced_len;
        memmove(dst+replaced_len+lendiff,
                dst+replaced_len,
                old_listpack_bytes-poff-replaced_len);
    }
   	// 不仅需要扩大，replace的情况同样需要缩小
    if (new_listpack_bytes < old_listpack_bytes) {
        if ((lp = lp_realloc(lp,new_listpack_bytes)) == NULL) return NULL;
        dst = lp + poff;
    }
    /* Store the entry. */
    if (newp) {
        *newp = dst;
        /* In case of deletion, set 'newp' to NULL if the next element is
         * the EOF element. */
        if (!ele && dst[0] == LP_EOF) *newp = NULL;
    }
    if (ele) {
        if (enctype == LP_ENCODING_INT) {
            memcpy(dst,intenc,enclen);
        } else {
        	// 把string编码后插入到dst中
            lpEncodeString(dst,ele,size);
        }
        dst += enclen;
        memcpy(dst,backlen,backlen_size);
        dst += backlen_size;
    }
	// 更新头部的信息
    if (where != LP_REPLACE || ele == NULL) {
        uint32_t num_elements = lpGetNumElements(lp);
        if (num_elements != LP_HDR_NUMELE_UNKNOWN) {
            if (ele)
                lpSetNumElements(lp,num_elements+1);
            else
                lpSetNumElements(lp,num_elements-1);
        }
    }
    lpSetTotalBytes(lp,new_listpack_bytes);
// 不得不说这里还是挺丑陋的，封成另外一个函数也许是个更好的选择
#if 0
    /* This code path is normally disabled: what it does is to force listpack
     * to return *always* a new pointer after performing some modification to
     * the listpack, even if the previous allocation was enough. This is useful
     * in order to spot bugs in code using listpacks: by doing so we can find
     * if the caller forgets to set the new pointer where the listpack reference
     * is stored, after an update. */
    unsigned char *oldlp = lp;
    lp = lp_malloc(new_listpack_bytes);
    memcpy(lp,oldlp,new_listpack_bytes);
    if (newp) {
        unsigned long offset = (*newp)-oldlp;
        *newp = lp + offset;
    }
    /* Make sure the old allocation contains garbage. */
    memset(oldlp,'A',new_listpack_bytes);
    lp_free(oldlp);
#endif
    return lp;
}
```

### lpseek

我们再来看看如何再`listpack`中定位一个`element`。

```java
// 查找指定元素并返回指向查找元素的指针
// 正索引指定从头到尾查找的从零开始的元素，负索引指定从尾部开始的元素
// 其中 -1 表示最后一个元素，-2 表示倒数第二个，依此类推。 如果索引超出范围，则返回 NULL。
// 这部分代码不难，但是写的简介明了很看功力，显然antirez是个大佬，代码很清晰
unsigned char *lpSeek(unsigned char *lp, long index) {
    int forward = 1; /* Seek forward by default. */
	// 得到总元素数
    uint32_t numele = lpGetNumElements(lp);
    if (numele != LP_HDR_NUMELE_UNKNOWN) {
    	// 把索引先搞成正数
        if (index < 0) index = (long)numele+index;
        if (index < 0) return NULL; /* Index still < 0 means out of range. */
        if (index >= (long)numele) return NULL; /* Out of range the other side. */
		// 找个最近的边开始遍历
        if (index > (long)numele/2) {
            forward = 0;
            /* Right to left scanning always expects a negative index. Convert
             * our index to negative form. */
            index -= numele;
        }
    } else {
        /* If the listpack length is unspecified, for negative indexes we
         * want to always scan right-to-left. */
        if (index < 0) forward = 0;
    }
    /* Forward and backward scanning is trivially based on lpNext()/lpPrev(). */
    if (forward) {
        unsigned char *ele = lpFirst(lp);
        while (index > 0 && ele) {
            ele = lpNext(lp,ele);
            index--;
        }
        return ele;
    } else {
        unsigned char *ele = lpLast(lp);
        while (index < -1 && ele) {
            ele = lpPrev(lp,ele);
            index++;
        }
        return ele;
    }
}
```

### lpShrinkToFit

很重要的函数，但是经过前面的代码的摧残，它的逻辑就很简单了。

```java
unsigned char* lpShrinkToFit(unsigned char *lp) {
	// 总字节数
    size_t size = lpGetTotalBytes(lp);
    // 小于malloc_size时执行realloc
    if (size < lp_malloc_size(lp)) {
        return lp_realloc(lp, size);
    } else {
        return lp;
    }
}
```

## 总结

好了，基本的逻辑点我们都看完了，剩下的就是一些基于位运算和`lpinsert`的封装了，可以看出来逻辑还是比较简单的。那么我们是否可以把这种数据类型运用到我们平时代码中呢？

我想是可以的，这种结构十分适合少量数据下变长数据存储，或者纯数字（数字越小约省内存）的存储。或者说这是一种时间换内存的方式更为合适，因为`listpack`其实可以作为一个通用结构，极其省内存，缺点就是额外的操作以及O（N）的查找。一些存储引擎的键结构我想可以参考这种方式（这里与O（N）的查找没啥关系），动辄数亿的键确实可以省不少内存资源的。
