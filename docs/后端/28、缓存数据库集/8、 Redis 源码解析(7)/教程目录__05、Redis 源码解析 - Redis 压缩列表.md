# 05、Redis 源码解析 - Redis 压缩列表
- 来源：https://ddkk.com/zhuanlan/db/redis/7/5.html
- 分类：缓存数据库
- 分组：教程目录
**压缩列表是在列表中元素较少的时候作为列表和哈希键的底层实现之一,它最大程度的节省了内存,且为顺序存储,可以更快的被加载到内存中来,但却增加的各种操作的时间复杂度,在元素较少的时候是一种优秀的数据结构,因为此时的操作带来的时间损耗是可以忽略不计的.**

**压缩列表确实是一种神奇的数据结构,每一项的大小都不相同,且不使用指针却能把所有的数据巧妙的连接起来.但因为其操作时间复杂度的原因,它的适用场景实在是不多,redis这样对内存要求及其严格的地方就是一个典型的场景.**

我们先来看看两个插入的操作ziplistInsert和ziplistPush,ziplistInsert会指定一个结点以插入,而ziplistPush则是固定由末尾或者列表头进行插入,它们内部其实都是调用了一个函数,就是`__ziplistInsert`

```java
//把长度为slen的元素s插入到zl列表的p处 指定p我们就可以完成ziplistInsert和ziplistPush了
static unsigned char *__ziplistInsert(unsigned char *zl, unsigned char *p, unsigned char *s, unsigned int slen) {
    // 记录当前 ziplist 的长度
    size_t curlen = intrev32ifbe(ZIPLIST_BYTES(zl)), reqlen, prevlen = 0;
    size_t offset;
    int nextdiff = 0;
    unsigned char encoding = 0;
    long long value = 123456789; /* initialized to avoid warning. Using a value
                                    that is easy to see if for some reason
                                    we use it uninitialized. */
    zlentry entry, tail;
    /* Find out prevlen for the entry that is inserted. */
    if (p[0] != ZIP_END) {
      //previous_entry_length前两位最大为0xFE 结尾标志为0xFF
        // 说明我们插入的时候是从左边插入的
        // 取出 p 所指向节点的信息，并将它保存到 entry 结构中
        // 然后用 prevlen 变量记录前置节点的长度
        // （当插入新节点之后 p 所指向的节点就成了新节点的前置节点）
        // T = O(1)
        entry = zipEntry(p);
        prevlen = entry.prevrawlen;
    } else {
        // 如果 p 指向表尾末端，那么程序需要检查列表是否为：
        // 1)如果 ptail 也指向 ZIP_END ，那么列表为空；
        // 2)如果列表不为空，那么 ptail 将指向列表的最后一个节点。
        unsigned char *ptail = ZIPLIST_ENTRY_TAIL(zl);
        if (ptail[0] != ZIP_END) {
      //直接传一个ptail不好吗?
            // 表尾节点为新节点的前置节点
            // 取出表尾节点的长度(全部的长度 包括三部分)
            prevlen = zipRawEntryLength(ptail);
        }
    }
    /* See if the entry can be encoded */
    // 尝试看能否将输入字符串转换为整数，如果成功的话：
    // 1)value 将保存转换后的整数值
    // 2)encoding 则保存适用于 value 的编码方式
    // 无论使用什么编码， reqlen 都保存节点值的长度
    // 下面的if else 用于计算新节点的值的长度
    if (zipTryEncoding(s,slen,&value,&encoding)) {
      //计算content的值 整数的话进入if
        /* 'encoding' is set to the appropriate integer encoding */
        reqlen = zipIntSize(encoding); //encoding中保存了数字合理的存储空间
    } else {
        /* 'encoding' is untouched, however zipEncodeLength will use the
         * string length to figure out how to encode it. */
        reqlen = slen; //如果是字符串的话当然直接为其长度啦
    }
    /* We need space for both the length of the previous entry and
     * the length of the payload. */
    // 计算编码前置节点的长度所需的大小
    reqlen += zipPrevEncodeLength(NULL,prevlen); //preclen是上一个entry中占有的字节总数
    // 计算编码当前节点值所需的大小
    reqlen += zipEncodeLength(NULL,encoding,slen);
    //至此 reqlen为我们新加入entry的长度 由三部分组成
    /* When the insert position is not equal to the tail, we need to
     * make sure that the next entry can hold this entry's length in
     * its prevlen field. */
    // 只要新节点不是被添加到列表末端，
    // 那么程序就需要检查看 p 所指向的节点（的 header）能否编码新节点的长度。
    // nextdiff 保存了新旧编码之间的字节大小差，如果这个值大于 0 
    // 那么说明需要对 p 所指向的节点（的 header ）进行扩展
    // 下面的语句中如果p的前置长度为五个字节当然也就没必要更新了 
    //          前置长度为一个字节       新结点编码的长度减去下一个节点的前缀长度 
    nextdiff = (p[0] != ZIP_END) ? zipPrevLenByteDiff(p,reqlen) : 0;
    //当nextdiff大于0的时候我们需要扩容 也就是等于4的时候
    /* Store offset because a realloc may change the address of zl. */
    // 因为重分配空间可能会改变 zl 的地址
    // 所以在分配之前，需要记录 zl 到 p 的偏移量，然后在分配之后依靠偏移量还原 p 
    offset = p-zl;
    // curlen 是 ziplist 原来的长度
    // reqlen 是整个新节点的长度
    // nextdiff 是新节点的后继节点扩展 header 的长度（要么 0 字节，要么 4 个字节）
    // T = O(N)
    zl = ziplistResize(zl,curlen+reqlen+nextdiff);//原列表长度 新节点的长度 下一个节点中如果需要更新加入的长度 
    p = zl+offset; 
    /* Apply memory move when necessary and update tail offset. */
    //下面这一步主要是为了给要插入的元素移出空位
    if (p[0] != ZIP_END) {
      //也就是没插入到表尾 我们需要向后移动元素        
    	// 新元素之后还有节点，因为新元素的加入，需要对这些原有节点进行调整
        /* Subtract one because of the ZIP_END bytes */
        // 移动现有元素，为新元素的插入空间腾出位置
        // T = O(N)
        memmove(p+reqlen,p-nextdiff,curlen-offset-1+nextdiff);
        /* Encode this entry's raw length in the next entry. */
        // 将新节点的长度编码至后置节点
        // p+reqlen 定位到后置节点
        // reqlen 是新节点的长度
        // T = O(1)
        zipPrevEncodeLength(p+reqlen,reqlen);
        /* Update offset for tail */
        // 更新到达表尾的偏移量，将新节点的长度也算上
        ZIPLIST_TAIL_OFFSET(zl) =
            intrev32ifbe(intrev32ifbe(ZIPLIST_TAIL_OFFSET(zl))+reqlen);
        /* When the tail contains more than one entry, we need to take
         * "nextdiff" in account as well. Otherwise, a change in the
         * size of prevlen doesn't have an effect on the *tail* offset. */
        // 如果新节点的后面有多于一个节点
        // 那么程序需要将 nextdiff 记录的字节数也计算到表尾偏移量中
        // 这样才能让表尾偏移量正确对齐表尾节点
        // T = O(1)
        tail = zipEntry(p+reqlen);
        if (p[reqlen+tail.headersize+tail.len] != ZIP_END) {
            ZIPLIST_TAIL_OFFSET(zl) =
                intrev32ifbe(intrev32ifbe(ZIPLIST_TAIL_OFFSET(zl))+nextdiff);
        }
    } else {
        /* This element will be the new tail. */
        // 新元素是新的表尾节点
        ZIPLIST_TAIL_OFFSET(zl) = intrev32ifbe(p-zl);
    }
    /* When nextdiff != 0, the raw length of the next entry has changed, so
     * we need to cascade the update throughout the ziplist */
	//nextdiff如果不为零就以为着我们更新了新节点后面的节点 也就是说后面有可能也会更新
    if (nextdiff != 0) {
        offset = p-zl;
        // T  = O(N^2)
        zl = __ziplistCascadeUpdate(zl,p+reqlen);//p为我们插入的地方 加上reqlen以后为下一个节点的位置
        p = zl+offset; //
    }
    /* Write the entry */
    // 一切搞定，将前置节点的长度写入新节点的 header
    p += zipPrevEncodeLength(p,prevlen);
    // 将节点值的长度写入新节点的 header
    p += zipEncodeLength(p,encoding,slen);
    // 写入节点值 会根据encoding判断写入的值是数字还是字符串
    if (ZIP_IS_STR(encoding)) {
        // T = O(N)
        memcpy(p,s,slen);
    } else {
        // T = O(1)
        zipSaveInteger(p,value,encoding);
    }
    // 更新列表的节点数量计数器
    ZIPLIST_INCR_LENGTH(zl,1);
    return zl;
}
```

**简单说一下压缩列表插入的基本流程:**

**1. 根据插入值的类型计算新插入字段的长度

2、** 在原列表的基础上进行扩展为新字段空出位置因为有可能插入到原列表的中间；

**3、** 如果插入到原列表的中间需要考虑是否会造成更新现象并判断是否会连续更新；

**4、** 更新新字段的每一个值；

**我们可以看到压缩列表的插入确实是非常复杂的,因为是在字节数组上进行这些操作,所以这其中就涉及大量的宏函数,位运算,需要在每一个时刻清楚的知道某个指针是干什么的,确实很麻烦,但这带来的好处也是无与伦比的,就是相同的功能可以以极小的内存来完成,对于redis这样一个及其依赖于缓存的数据库来说这是极为重要的,这意味着相同的内存我们可以让更多的元素的收益,但带来的缺点是每次插入都需要使用zrmalloc进行内存分配.**

我们再来看一看删除的函数ziplistDelete和ziplistDeleteRange,它们内部都调用了`__ziplistDelete`

```java
static unsigned char *__ziplistDelete(unsigned char *zl, unsigned char *p, unsigned int num) {
    unsigned int i, totlen, deleted = 0;
    size_t offset;
    int nextdiff = 0;
    zlentry first, tail;
    // 计算被删除节点总共占用的内存字节数
    // 以及被删除节点的总个数
    first = zipEntry(p);
    for (i = 0; p[0] != ZIP_END && i < num; i++) {
        p += zipRawEntryLength(p); //p加上当前这个节点的字节总数不就是下一个节点的起点吗
        deleted++;
    }
    // totlen 是所有被删除节点总共占用的内存字节数
    totlen = p-first.p;
    if (totlen > 0) {
        if (p[0] != ZIP_END) {
      //证明p并不是末尾 也就是我们需要移动数据
            // 执行这里，表示被删除节点之后仍然有节点存在
            /* Storing prevrawlen in this entry may increase or decrease the
             * number of bytes required compare to the current prevrawlen.
             * There always is room to store this, because it was previously
             * stored by an entry that is now being deleted. */
            // 因为位于被删除范围之后的第一个节点的 header 部分的大小
            // 可能容纳不了新的前置节点，所以需要计算新旧前置节点之间的字节数差
            // T = O(1)
            nextdiff = zipPrevLenByteDiff(p,first.prevrawlen);
            // 如果有需要的话，将指针 p 后退 nextdiff 字节，为新 header 空出空间
            p -= nextdiff;
            // 将 first 的前置节点的长度编码至 p 中
            // T = O(1)
            zipPrevEncodeLength(p,first.prevrawlen);
            /* Update offset for tail */
            // 更新到达表尾的偏移量
            // T = O(1)
            ZIPLIST_TAIL_OFFSET(zl) =
                intrev32ifbe(intrev32ifbe(ZIPLIST_TAIL_OFFSET(zl))-totlen);
            /* When the tail contains more than one entry, we need to take
             * "nextdiff" in account as well. Otherwise, a change in the
             * size of prevlen doesn't have an effect on the *tail* offset. */
            // 如果被删除节点之后，有多于一个节点
            // 那么程序需要将 nextdiff 记录的字节数也计算到表尾偏移量中
            // 这样才能让表尾偏移量正确对齐表尾节点
            // T = O(1)
            tail = zipEntry(p);
            if (p[tail.headersize+tail.len] != ZIP_END) {
                ZIPLIST_TAIL_OFFSET(zl) =  
            //因为从中间删除可能会更改后面的列的数据 也就是发生更新现象 所以要把中间删除和后面删除的更新tail写成两个语句
                   intrev32ifbe(intrev32ifbe(ZIPLIST_TAIL_OFFSET(zl))+nextdiff);
            }
            /* Move tail to the front of the ziplist */
            // 从表尾向表头移动数据，覆盖被删除节点的数据
            // T = O(N)
            memmove(first.p,p,    //zl的总字节数  删除的节点后面的节点的数据总量
                intrev32ifbe(ZIPLIST_BYTES(zl))-(p-zl)-1);
        } else {
            // 执行这里，表示被删除节点之后已经没有其他节点了
            /* The entire tail was deleted. No need to move memory. */
            // T = O(1)
            ZIPLIST_TAIL_OFFSET(zl) =
                intrev32ifbe((first.p-zl)-first.prevrawlen);
        }
        /* Resize and update length */
        // 缩小并更新 ziplist 的长度
        offset = first.p-zl;
        zl = ziplistResize(zl, intrev32ifbe(ZIPLIST_BYTES(zl))-totlen+nextdiff);
        ZIPLIST_INCR_LENGTH(zl,-deleted);
        p = zl+offset;
        /* When nextdiff != 0, the raw length of the next entry has changed, so
         * we need to cascade the update throughout the ziplist */
        // 如果 p 所指向的节点的大小已经变更，那么进行级联更新
        // 检查 p 之后的所有节点是否符合 ziplist 的编码要求
        // T = O(N^2)
        if (nextdiff != 0)
            zl = __ziplistCascadeUpdate(zl,p);
    }
    return zl;
}
```

其基本步骤为

**1. 计算删除的节点总数与数据总数

2、** 移动被删除的数据后面还存在的数据到前面来减小容量；

**3、** 判断是否会出先连锁更新的情况；

**这里我们不需要计算插入的节点的长度,比起insert来稍微看起来简单一些**

其实压缩列表我们可以把看看成一个双向链表,因为每一项的长度不确定,我们没办法通过下标来确定某一项的位置,但这也很好的降低了内存碎片,使得内存利用率十分优秀.这意味着我们的每个插入删除操作其实都可能导致O(N)的时间复杂度,最差情况下还可能会发生连锁更新,使得复杂度到达O(N2),所以这只在列表的元素较少的时候才会被作为底层的数据结构.
