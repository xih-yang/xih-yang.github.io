# 23、Redis 源码解析 - Redis SCAN命令实现
- 来源：https://ddkk.com/zhuanlan/db/redis/7/23.html
- 分类：缓存数据库
- 分组：教程目录
`KEYS`与`SCAN`的区别可以说是老生常谈的一个问题了,本来打算写一篇名为>的博客来阐述它们之间的关系,但在我完成了源码分析以后就发现完全没有那个必要了,`KEYS`本就没什么可说的地方,想来想去,上面那个存在在于幻想中的博客的究其本质其实就是>.所以便有了这篇文章.

### 基础用法介绍

我们先来看看`SCAN`的基础用法,只列出语句的调用方式,剩下的请大家自行查阅文档.[文档](http://doc.redisfans.com/key/scan.html)

```java
 0      1      2      3       4     5   
SCAN cursor [MATCH pattern] [COUNT count]
 0     1    2       3      4        5     6
SSCAN KEY cursor [MATCH pattern] [COUNT count]
HSCAN  KEY cursor [MATCH pattern] [COUNT count]
ZSCAN KEY cursor [MATCH pattern] [COUNT count]
```

### 命令实现

`SCAN`类命令由`XscanCommand`命令实现,其实其他几个`SCAN类`命令也都是最后调用`scanGenericCommand`,就不细看了.

```java
void scanCommand(redisClient *c) {
    unsigned long cursor;
    if (parseScanCursorOrReply(c,c->argv[1],&cursor) == REDIS_ERR) return; // 取出游标
    scanGenericCommand(c,NULL,cursor); // 全部的操作在这里
}
```

```java
void scanGenericCommand(redisClient *c, robj *o, unsigned long cursor) {
    int rv;
    int i, j;
    char buf[REDIS_LONGSTR_SIZE];
    list *keys = listCreate();
    listNode *node, *nextnode;
    long count = 10;
    sds pat;
    int patlen, use_pattern = 0;
    dict *ht;
    /* Object must be NULL (to iterate keys names), or the type of the object
     * must be Set, Sorted Set, or Hash. */
    // 输入类型检查
    redisAssert(o == NULL || o->type == REDIS_SET || o->type == REDIS_HASH ||
                o->type == REDIS_ZSET);
    /* Set i to the first option argument. The previous one is the cursor. */
    // 设置第一个选项参数的索引位置
    // 0      1       2     3  
    // SCAN OPTION <op_arg>         SCAN 命令的选项值从索引 2 开始
    // HSCAN <key> OPTION <op_arg>  而其他 *SCAN 命令的选项值从索引 3 开始
    // o == NULL 证明这是一个SCAN命令 否则就是SSCAN,HSCAN,ZSCAN
    i = (o == NULL) ? 2 : 3; /* Skip the key argument if needed. */
    // 开始解析可选参数count和match的值
    /* Step 1: Parse options. */
    // 分析选项参数
    while (i < c->argc) {
        j = c->argc - i;
        // COUNT <number>
        if (!strcasecmp(c->argv[i]->ptr, "count") && j >= 2) {
            if (getLongFromObjectOrReply(c, c->argv[i+1], &count, NULL)
                != REDIS_OK)
            {
                goto cleanup;
            }
            if (count < 1) {
                addReply(c,shared.syntaxerr);
                goto cleanup;
            }
            i += 2;
        // MATCH <pattern>
        } else if (!strcasecmp(c->argv[i]->ptr, "match") && j >= 2) {
            pat = c->argv[i+1]->ptr;
            patlen = sdslen(pat);
            /* The pattern always matches if it is exactly "*", so it is
             * equivalent to disabling it. */
            use_pattern = !(pat[0] == '*' && patlen == 1); // 如果pattern为权值匹配就不需要进行过滤了
            i += 2;
        // error
        } else {
            addReply(c,shared.syntaxerr);
            goto cleanup;
        }
    }
    /* Step 2: Iterate the collection.
     *
     * Note that if the object is encoded with a ziplist, intset, or any other
     * representation that is not a hash table, we are sure that it is also
     * composed of a small number of elements. So to avoid taking state we
     * just return everything inside the object in a single call, setting the
     * cursor to zero to signal the end of the iteration. */
     // 如果对象的底层实现为 ziplist 、intset 而不是哈希表，
     // 那么这些对象应该只包含了少量元素，
     // 为了保持不让服务器记录迭代状态的设计
     // 我们将 ziplist 或者 intset 里面的所有元素都一次返回给调用者
     // 并向调用者返回游标（cursor） 0
    /* Handle the case of a hash table. */
    ht = NULL;
    if (o == NULL) {
        // 迭代目标为数据库
        ht = c->db->dict;
    } else if (o->type == REDIS_SET && o->encoding == REDIS_ENCODING_HT) {
        // 迭代目标为 HT 编码的集合
        ht = o->ptr;
    } else if (o->type == REDIS_HASH && o->encoding == REDIS_ENCODING_HT) {
        // 迭代目标为 HT 编码的哈希
        ht = o->ptr;
        count *= 2; /* We return key / value for this type. */
    } else if (o->type == REDIS_ZSET && o->encoding == REDIS_ENCODING_SKIPLIST) {
        // 迭代目标为 HT 编码的跳跃表
        zset *zs = o->ptr;
        ht = zs->dict;
        count *= 2; /* We return key / value for this type. */
    }
    if (ht) {
      // 不满足这个判断的话证明要遍历的数据库实现为压缩列表或者整数集合
        void *privdata[2];
        /* We pass two pointers to the callback: the list to which it will
         * add new elements, and the object containing the dictionary so that
         * it is possible to fetch more data in a type-dependent way. */
        // 我们向回调函数传入两个指针：
        // 一个是用于记录被迭代元素的列表
        // 另一个是字典对象
        // 从而实现类型无关的数据提取操作
        privdata[0] = keys;
        privdata[1] = o;
        do {
            cursor = dictScan(ht, cursor, scanCallback, privdata);
        } while (cursor && listLength(keys) < count); 
        // 在这个判断中此时count是有效的  
        // 因为后面还会根据pattern进行筛选,所以count是返回的最大值,这也意味着我们没办法精确控制返回值
    } else if (o->type == REDIS_SET) {
        int pos = 0;
        int64_t ll;
        while(intsetGet(o->ptr,pos++,&ll)) // 遍历全部
            listAddNodeTail(keys,createStringObjectFromLongLong(ll));
        cursor = 0; //遍历了全部 当然游标设置为零
    } else if (o->type == REDIS_HASH || o->type == REDIS_ZSET) {
        unsigned char *p = ziplistIndex(o->ptr,0);
        unsigned char *vstr;
        unsigned int vlen;
        long long vll;
        while(p) {
            ziplistGet(p,&vstr,&vlen,&vll);
            listAddNodeTail(keys, // 向keys中添加元素
                (vstr != NULL) ? createStringObject((char*)vstr,vlen) :
                                 createStringObjectFromLongLong(vll));
            p = ziplistNext(o->ptr,p);
        }
        cursor = 0;
    } else {
        redisPanic("Not handled encoding in SCAN.");
    }
    /* Step 3: Filter elements. */
    // 根据传入的pattern来筛选元素
    node = listFirst(keys);
    while (node) {
        robj *kobj = listNodeValue(node);
        nextnode = listNextNode(node);
        int filter = 0;
        /* Filter element if it does not match the pattern. */
        if (!filter && use_pattern) {
            if (sdsEncodedObject(kobj)) {
      // 是sds对象的话直接使用stringmatchlen匹配
                if (!stringmatchlen(pat, patlen, kobj->ptr, sdslen(kobj->ptr), 0))
                    filter = 1; //匹配不成功
            } else {
      // 否则需要进行一个转换 把数字转化为字符串
                char buf[REDIS_LONGSTR_SIZE];
                int len;
                redisAssert(kobj->encoding == REDIS_ENCODING_INT);
                len = ll2string(buf,sizeof(buf),(long)kobj->ptr);
                if (!stringmatchlen(pat, patlen, buf, len, 0)) filter = 1;
            }
        }
        /* Filter element if it is an expired key. */
        // 判断是否因为键过期而去删除
        if (!filter && o == NULL && expireIfNeeded(c->db, kobj)) filter = 1;
        /* Remove the element and its associted value if needed. */
        if (filter) {
      // filter设置为1代表要删除这个键
            decrRefCount(kobj); // 减去引用计数
            listDelNode(keys, node);
        }
        /* If this is a hash or a sorted set, we have a flat list of
         * key-value elements, so if this element was filtered, remove the
         * value, or skip it if it was not filtered: we only match keys. */
        // 当SCAN的对象为哈希表或者有序列表的时候 上面我们只是删除了键而已 这里还需要把值删了
        if (o && (o->type == REDIS_ZSET || o->type == REDIS_HASH)) {
            node = nextnode;
            nextnode = listNextNode(node);
            if (filter) {
                kobj = listNodeValue(node);
                decrRefCount(kobj);
                listDelNode(keys, node);
            }
        }
        node = nextnode;
    }
    /* Step 4: Reply to the client. */
    addReplyMultiBulkLen(c, 2);
    rv = snprintf(buf, sizeof(buf), "%lu", cursor); //
    redisAssert(rv < sizeof(buf));
    addReplyBulkCBuffer(c, buf, rv); // 把游标值写入返回数据中
    addReplyMultiBulkLen(c, listLength(keys)); // 循环把列表中的数据放入返回数据中
    while ((node = listFirst(keys)) != NULL) {
        robj *kobj = listNodeValue(node);
        addReplyBulk(c, kobj);
        decrRefCount(kobj);
        listDelNode(keys, node);
    }
cleanup:
    listSetFreeMethod(keys,decrRefCountVoid);
    listRelease(keys);
}
```

`scanGenericCommand`中阐明了`SCAN`命令的调用过程,我们会从客户端得到一条SCAN命令,当存在key选项的时候证明需要遍历某个集合(哈希表,有序集合)中的数据,不存在即为遍历数据库中的所有键.然后可以通过传入的`cursor`来遍历整个数据结构,当返回0时意味着遍历结束.有以下几点需要注意:

**1、** 当所遍历的数据结构为整数集合或者压缩列表的时候意味着元素较少,此时会忽略count参数,返回全部的数据.这个时候count这个参数是无效的.；

**2、** count参数在底层编码为字典或者有序集合的实现为跳跃表和哈希表时count有效,表示返回的最大数据量,因为在遍历过程中会根据游标取出count个值,但还是要根据`pattern`筛选掉一些值,这个过程是不确定的.所以**count代表的是返回的最大数据量**(返回键值对时数量乘以2).其实这里的说法还不正确,细看第五条.；

**3、** 游标的底层实现不是简单的递增,而是使用**二进制翻转**这种特殊的算法进行遍历.因为一次迭代可能会分N次进行,而这个过程中可能出现rehash,而redis中rehash是渐进式的,这使得一般的迭代可能会出现漏值.这种特殊的算法可以保证在不漏值的基础上最少重复.(**可能会返回重复值,但一定不会丢失**)；

**4、** 游标一个巨大的优点就是它是无状态的,意味着我们可以不需要任何额外的数据结构存储迭代的过程,仅使用`unsignedlong`类型的游标即可分多轮迭代.；

**5、** 游标有一个缺点,就是为了不错过任何元素,迭代器需要返回给定桶上的所有键,这意味着一次迭代中必须返回桶中的所有数据,这样就可能超过我们给定的count值,所以count返回的也不是**最大数据量**,而是**可能的最大数据量**.；

### 结论

因为redis是单线程服务器,`KEYS`命令会一次遍历此数据库中全部的键,而在数据库大了以后可能会阻塞长达数秒,这段时间redis是无法提供服务的,所以在数据量较大时不可使用,而`SCAN`命令一次

因为这篇文章没有说什么是**二进制翻转**算法,所以也就不细说`dictScan`这个函数了,其实逻辑非常简单,就相当于换种方法迭代,搞清楚迭代逻辑源码并不是问题.

那么游标的**二进制翻转**算法到底是什么呢?其实是建立在rehash是2倍递增的,直接看参考中的第二篇吧,就算我再写一篇文章专门长篇大论的说这个问题也不会有那篇文章那么详细了,所以就干脆直接享受前辈的劳动成果喽~
