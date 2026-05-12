# 12、Redis 源码解析 - Redis 集合类型键实现(t_set)
- 来源：https://ddkk.com/zhuanlan/db/redis/4/12.html
- 分类：缓存数据库
- 分组：教程目录
## Redis 集合类型键实现(t_set)

### 1. 集合命令介绍

redis中所有的集合命令如下：[Redis集合命令详解](http://blog.csdn.net/men_wen/article/details/61916268)

序号
命令
说明

1
SADD key member1 [member2]
将一个或多个成员添加到集合

2
SCARD key
获取集合中的成员数

3
SDIFF key1 [key2]
减去多个集合

4
SDIFFSTORE destination key1 [key2]
减去多个集并将结果集存储在键中

5
SINTER key1 [key2]
相交多个集合

6
SINTERSTORE destination key1 [key2]
交叉多个集合并将结果集存储在键中

7
SISMEMBER key member
判断确定给定值是否是集合的成员

8
SMOVE source destination member
将成员从一个集合移动到另一个集合

9
SPOP key
从集合中删除并返回随机成员

10
SRANDMEMBER key [count]
从集合中获取一个或多个随机成员

11
SREM key member1 [member2]
从集合中删除一个或多个成员

12
SUNION key1 [key2]
添加多个集合

13
SUNIONSTORE destination key1 [key2]
添加多个集并将结果集存储在键中

14
SSCAN key cursor [MATCH pattern] [COUNT count]
递增地迭代集合中的元素

### 2. 集合类型的实现

之前在[redis对象系统源码剖析和注释](http://blog.csdn.net/men_wen/article/details/61916268)中提到，一个集合类型的对象的编码有两种，分别是OBJ_ENCODING_HT和OBJ_ENCODING_INTSET。

编码—encoding
对象—ptr

OBJ_ENCODING_HT
字典实现的集合对象

OBJ_ENCODING_INTSET
整数集合实现的集合对象

关于集合类型底层的两种数据结构的源码剖析和注释，请看下面的博文。

> Redis 字典结构源码剖析和注释
>
> Redis 整数集合源码剖析和注释

从OBJ_ENCODING_INTSET转换到OBJ_ENCODING_HT的条件如下：

- redis的配置文件中的选项：如果数据编码为整数集合的集合对象的元素数量超过 set-max-intset-entries 阈值，则会转换编码

```java
set-max-intset-entries  512
```

- 如果向数据编码为整数集合的集合对象插入字符串类型的对象，则会转换编码

集合对象的数据编码转换的源码如下：

```java
// 将集合对象的INTSET编码类型转换为enc类型
void setTypeConvert(robj *setobj, int enc) {
    setTypeIterator *si;
    serverAssertWithInfo(NULL,setobj,setobj->type == OBJ_SET &&
                             setobj->encoding == OBJ_ENCODING_INTSET);
    // 转换成OBJ_ENCODING_HT字典类型的编码
    if (enc == OBJ_ENCODING_HT) {
        int64_t intele;
        // 创建一个字典
        dict *d = dictCreate(&setDictType,NULL);
        robj *element;
        /* Presize the dict to avoid rehashing */
        // 扩展字典的大小
        dictExpand(d,intsetLen(setobj->ptr));
        /* To add the elements we extract integers and create redis objects */
        // 创建并初始化一个集合类型的迭代器
        si = setTypeInitIterator(setobj);
        // 迭代器整数集合
        while (setTypeNext(si,&element,&intele) != -1) {
            element = createStringObjectFromLongLong(intele);   //将当前集合中的元素转换为字符串类型对象
            serverAssertWithInfo(NULL,element,
                                dictAdd(d,element,NULL) == DICT_OK);
        }
        // 释放迭代器空间
        setTypeReleaseIterator(si);
        // 设置转换后的集合对象的编码类型
        setobj->encoding = OBJ_ENCODING_HT;
        // 更新集合对象的值对象
        zfree(setobj->ptr);
        setobj->ptr = d;
    } else {
        serverPanic("Unsupported set conversion");
    }
}
```

一个集合对象的结构定义如下：

```java
typedef struct redisObject {
    //对象的数据类型，集合对象应该为 OBJ_SET
    unsigned type:4;        
    //对象的编码类型，分别为 OBJ_ENCODING_INTSET 或 OBJ_ENCODING_HT
    unsigned encoding:4;
    //暂且不关心该成员
    unsigned lru:LRU_BITS; /* lru time (relative to server.lruclock) */
    //引用计数
    int refcount;
    //指向底层数据实现的指针，指向一个dict的字典结构或整数集合结构
    void *ptr;
} robj;
```

我们假设一个集合保存的是年龄的标签，有1995、1996、1997、1994

```java
127.0.0.1:6379> SADD tags:age 1997 1995 1994 1996
(integer) 4
127.0.0.1:6379> OBJECT ENCODING tags:age
"intset"
127.0.0.1:6379> SMEMBERS tags:age
1) "1994"
2) "1995"
3) "1996"
4) "1997"
```

这个tags:age 集合对象的空间结构可能如下图：

假设一个集合保存的是运动的标签，有basketball，football，volleyball

```java
127.0.0.1:6379> SADD tags:sport basketball football volleyball
(integer) 3
127.0.0.1:6379> OBJECT ENCODING tags:sport
"hashtable"
127.0.0.1:6379> SMEMBERS tags:sport
1) "volleyball"
2) "basketball"
3) "football"
```

这个tags:sport 集合对象的空间结构可能如下图：

集合类型封装的API

```java
/* Set data type */
// 创建一个保存value的集合
robj *setTypeCreate(robj *value);
// 向subject集合中添加value，添加成功返回1，如果已经存在返回0
int setTypeAdd(robj *subject, robj *value);
// 从集合对象中删除一个值为value的元素，删除成功返回1，失败返回0
int setTypeRemove(robj *subject, robj *value);
// 集合中是否存在值为value的元素，存在返回1，否则返回0
int setTypeIsMember(robj *subject, robj *value);
// 创建并初始化一个集合类型的迭代器
setTypeIterator *setTypeInitIterator(robj *subject);
// 释放迭代器空间
void setTypeReleaseIterator(setTypeIterator *si);
// 将当前迭代器指向的元素保存在objele或llele中，迭代完毕返回-1
// 返回的对象的引用技术不增加，支持 读时共享写时复制
int setTypeNext(setTypeIterator *si, robj **objele, int64_t *llele);
// 返回迭代器当前指向的元素对象的地址，需要手动释放返回的对象
robj *setTypeNextObject(setTypeIterator *si);
// 从集合中随机取出一个对象，保存在参数中
int setTypeRandomElement(robj *setobj, robj **objele, int64_t *llele);
unsigned long setTypeRandomElements(robj *set, unsigned long count, robj *aux_set);
// 返回集合的元素数量
unsigned long setTypeSize(robj *subject);
// 将集合对象的INTSET编码类型转换为enc类型
void setTypeConvert(robj *subject, int enc);
```

所有API注释：[集合类型实现源码注释](https://github.com/menwengit/redis_source_annotation)

集合类型实现了自己的迭代器，也基于字典的迭代器封装的

```java
/* Structure to hold set iteration abstraction. */
typedef struct {
    robj *subject;                  //所属的集合对象
    int encoding;                   //集合对象编码类型
    int ii; /* intset iterator */   //整数集合的迭代器，编码为INTSET使用
    dictIterator *di;               //字典的迭代器，编码为HT使用
} setTypeIterator;
```

集合类型的迭代器的操作：

- 创建并初始化一个集合类型的迭代器

```java
// 创建并初始化一个集合类型的迭代器
setTypeIterator *setTypeInitIterator(robj *subject) {
    // 分配空间并初始化成员
    setTypeIterator *si = zmalloc(sizeof(setTypeIterator));
    si->subject = subject;
    si->encoding = subject->encoding;
    // 初始化字典的迭代器
    if (si->encoding == OBJ_ENCODING_HT) {
        si->di = dictGetIterator(subject->ptr);
    // 初始化集合的迭代器，该成员为集合的下标
    } else if (si->encoding == OBJ_ENCODING_INTSET) {
        si->ii = 0;
    } else {
        serverPanic("Unknown set encoding");
    }
    return si;
}
```

- 释放集合类型的迭代器

```java
// 释放迭代器空间
void setTypeReleaseIterator(setTypeIterator *si) {
    // 如果是字典类型，需要先释放字典类型的迭代器
    if (si->encoding == OBJ_ENCODING_HT)
        dictReleaseIterator(si->di);
    zfree(si);
}
```

- 迭代操作分为两种
- 将当前迭代器指向的对象保存在参数中，支持读时共享写时复制：setTypeNext()函数
- 将当前迭代器指向的对象作为返回值，不支持读时共享写时复制，需要释放返回的对象：setTypeNextObject()函数

```java
// 将当前迭代器指向的元素保存在objele或llele中，迭代完毕返回-1
// 返回的对象的引用计数不增加，支持 读时共享写时复制
int setTypeNext(setTypeIterator *si, robj **objele, int64_t *llele) {
    // 迭代字典
    if (si->encoding == OBJ_ENCODING_HT) {
        // 得到下一个节点地址，更新迭代器
        dictEntry *de = dictNext(si->di);
        if (de == NULL) return -1;
        // 保存元素
        *objele = dictGetKey(de);
        *llele = -123456789; /* Not needed. Defensive. */
    // 迭代整数集合
    } else if (si->encoding == OBJ_ENCODING_INTSET) {
        // 从intset中保存元素到llele中
        if (!intsetGet(si->subject->ptr,si->ii++,llele))
            return -1;
        *objele = NULL; /* Not needed. Defensive. */
    } else {
        serverPanic("Wrong set encoding in setTypeNext");
    }
    return si->encoding;    //返回编码类型
}
// 返回迭代器当前指向的元素对象的地址，需要手动释放返回的对象
robj *setTypeNextObject(setTypeIterator *si) {
    int64_t intele;
    robj *objele;
    int encoding;
    // 得到当前集合对象的编码类型
    encoding = setTypeNext(si,&objele,&intele);
    switch(encoding) {
        case -1:    return NULL;    //迭代完成
        case OBJ_ENCODING_INTSET:   //整数集合返回一个字符串类型的对象
            return createStringObjectFromLongLong(intele);
        case OBJ_ENCODING_HT:       //字典集合，返回共享的该对象
            incrRefCount(objele);
            return objele;
        default:
            serverPanic("Unsupported encoding");
    }
    return NULL; /* just to suppress warnings */
}
```

### 3. 集合键命令的实现

集合键的命令大部分根据编码判断出数据类型，然后调用相对应数据结构的API就可以实现，但是集合键命令有几个我们重点分析，其他没有分析的请上github上查看源码的注释：[redis 集合键命令源码注释](https://github.com/menwengit/redis_source_annotation)

- 交集命令底层实现

```java
// SINTER key [key ...]
// SINTERSTORE destination key [key ...]
// SINTER、SINTERSTORE一类命令的底层实现
void sinterGenericCommand(client *c, robj **setkeys,
                          unsigned long setnum, robj *dstkey) {
    // 分配存储集合的数组
    robj **sets = zmalloc(sizeof(robj*)*setnum);
    setTypeIterator *si;
    robj *eleobj, *dstset = NULL;
    int64_t intobj;
    void *replylen = NULL;
    unsigned long j, cardinality = 0;
    int encoding;
    // 遍历集合数组
    for (j = 0; j < setnum; j++) {
        // 如果dstkey为空，则是SINTER命令，不为空则是SINTERSTORE命令
        // 如果是SINTER命令，则以读操作读取出集合对象，否则以写操作读取出集合对象
        robj *setobj = dstkey ?
            lookupKeyWrite(c->db,setkeys[j]) :
            lookupKeyRead(c->db,setkeys[j]);
        // 读取的集合对象不存在，执行清理操作
        if (!setobj) {
            zfree(sets);    //释放集合数组空间
            // 如果是SINTERSTORE命令
            if (dstkey) {
                // 从数据库中删除存储的目标集合对象dstkey
                if (dbDelete(c->db,dstkey)) {
                    // 发送信号表示数据库键被修改，并更新脏键
                    signalModifiedKey(c->db,dstkey);
                    server.dirty++;
                }
                addReply(c,shared.czero);   //发送0给client
            // 如果是SINTER命令，发送空回复
            } else {
                addReply(c,shared.emptymultibulk);
            }
            return;
        }
        // 读取集合对象成功，检查其数据类型
        if (checkType(c,setobj,OBJ_SET)) {
            zfree(sets);
            return;
        }
        // 将读取出的对象保存在集合数组中
        sets[j] = setobj;
    }
    /* Sort sets from the smallest to largest, this will improve our
     * algorithm's performance */
    // 从小到大排序集合数组中的集合大小，能够提高算法的性能
    qsort(sets,setnum,sizeof(robj*),qsortCompareSetsByCardinality);
    /* The first thing we should output is the total number of elements...
     * since this is a multi-bulk write, but at this stage we don't know
     * the intersection set size, so we use a trick, append an empty object
     * to the output list and save the pointer to later modify it with the
     * right length */
    // 首先我们应该输出集合中元素的数量，但是现在不知道交集的大小
    // 因此创建一个空对象的链表，然后保存所有的回复
    if (!dstkey) {
        replylen = addDeferredMultiBulkLength(c);   // STINER命令创建一个链表
    } else {
        /* If we have a target key where to store the resulting set
         * create this key with an empty set inside */
        dstset = createIntsetObject();              //STINERSTORE命令创建要给整数集合对象
    }
    /* Iterate all the elements of the first (smallest) set, and test
     * the element against all the other sets, if at least one set does
     * not include the element it is discarded */
    // 迭代第一个也是集合元素数量最小的集合的每一个元素，将该集合中的所有元素和其他集合作比较
    // 如果至少有一个集合不包括该元素，则该元素不属于交集
    si = setTypeInitIterator(sets[0]);
    // 创建集合类型的迭代器并迭代器集合数组中的第一个集合的所有元素
    while((encoding = setTypeNext(si,&eleobj,&intobj)) != -1) {
        // 遍历其他集合
        for (j = 1; j < setnum; j++) {
            // 跳过与第一个集合相等的集合，没有必要比较两个相同集合的元素，而且第一个集合作为结果的交集
            if (sets[j] == sets[0]) continue;
            // 当前元素为INTSET类型
            if (encoding == OBJ_ENCODING_INTSET) {
                /* intset with intset is simple... and fast */
                // 如果在当前intset集合中没有找到该元素则直接跳过当前元素，操作下一个元素
                if (sets[j]->encoding == OBJ_ENCODING_INTSET &&
                    !intsetFind((intset*)sets[j]->ptr,intobj))
                {
                    break;
                /* in order to compare an integer with an object we
                 * have to use the generic function, creating an object
                 * for this */
                // 在字典中查找
                } else if (sets[j]->encoding == OBJ_ENCODING_HT) {
                    // 创建字符串对象
                    eleobj = createStringObjectFromLongLong(intobj);
                    // 如果当前元素不是当前集合中的元素，则释放字符串对象跳过for循环体，操作下一个元素
                    if (!setTypeIsMember(sets[j],eleobj)) {
                        decrRefCount(eleobj);
                        break;
                    }
                    decrRefCount(eleobj);
                }
            // 当前元素为HT字典类型
            } else if (encoding == OBJ_ENCODING_HT) {
                /* Optimization... if the source object is integer
                 * encoded AND the target set is an intset, we can get
                 * a much faster path. */
                // 当前元素的编码是int类型且当前集合为整数集合，如果该集合不包含该元素，则跳过循环
                if (eleobj->encoding == OBJ_ENCODING_INT &&
                    sets[j]->encoding == OBJ_ENCODING_INTSET &&
                    !intsetFind((intset*)sets[j]->ptr,(long)eleobj->ptr))
                {
                    break;
                /* else... object to object check is easy as we use the
                 * type agnostic API here. */
                // 其他类型，在当前集合中查找该元素是否存在
                } else if (!setTypeIsMember(sets[j],eleobj)) {
                    break;
                }
            }
        }
        /* Only take action when all sets contain the member */
        // 执行到这里，该元素为结果集合中的元素
        if (j == setnum) {
            // 如果是SINTER命令，回复集合
            if (!dstkey) {
                if (encoding == OBJ_ENCODING_HT)
                    addReplyBulk(c,eleobj);
                else
                    addReplyBulkLongLong(c,intobj);
                cardinality++;
            // 如果是SINTERSTORE命令，先将结果添加到集合中，因为还要store到数据库中
            } else {
                if (encoding == OBJ_ENCODING_INTSET) {
                    eleobj = createStringObjectFromLongLong(intobj);
                    setTypeAdd(dstset,eleobj);
                    decrRefCount(eleobj);
                } else {
                    setTypeAdd(dstset,eleobj);
                }
            }
        }
    }
    setTypeReleaseIterator(si); //释放迭代器
    // SINTERSTORE命令，要将结果的集合添加到数据库中
    if (dstkey) {
        /* Store the resulting set into the target, if the intersection
         * is not an empty set. */
        // 如果之前存在该集合则先删除
        int deleted = dbDelete(c->db,dstkey);
        // 结果集大小非空，则将其添加到数据库中
        if (setTypeSize(dstset) > 0) {
            dbAdd(c->db,dstkey,dstset);
            // 回复结果集的大小
            addReplyLongLong(c,setTypeSize(dstset));
            // 发送"sinterstore"事件通知
            notifyKeyspaceEvent(NOTIFY_SET,"sinterstore",
                dstkey,c->db->id);
        // 结果集为空，释放空间
        } else {
            decrRefCount(dstset);
            // 发送0给client
            addReply(c,shared.czero);
            // 发送"del"事件通知
            if (deleted)
                notifyKeyspaceEvent(NOTIFY_GENERIC,"del",
                    dstkey,c->db->id);
        }
        // 键被修改，发送信号。更新脏键
        signalModifiedKey(c->db,dstkey);
        server.dirty++;
    // SINTER命令，回复结果集合给client
    } else {
        setDeferredMultiBulkLength(c,replylen,cardinality);
    }
    zfree(sets);    //释放集合数组空间
}
```

- 差集和并集命令的底层实现

计算差集给出了两个算法，使用于不同的场景。

**1、** 时间复杂度O(N*M)，N是第一个集合中元素的总个数，M是集合的总个数；

**2、** 时间复杂度O(N)，N是所有集合中元素的总个数；

```java
#define SET_OP_UNION 0      //并集
#define SET_OP_DIFF 1       //差集
#define SET_OP_INTER 2      //交集
// SUNION key [key ...]
// SUNIONSTORE destination key [key ...]
// SDIFF key [key ...]
// SDIFFSTORE destination key [key ...]
// 并集、差集命令的底层实现
void sunionDiffGenericCommand(client *c, robj **setkeys, int setnum,
                              robj *dstkey, int op) {
    //分配集合数组的空间
    robj **sets = zmalloc(sizeof(robj*)*setnum);
    setTypeIterator *si;
    robj *ele, *dstset = NULL;
    int j, cardinality = 0;
    int diff_algo = 1;
    // 遍历数组中集合键对象
    for (j = 0; j < setnum; j++) {
        // 如果dstkey为空，则是SUNION或SDIFF命令，不为空则是SUNIONSTORE或SDIFFSTORE命令
        // 如果是SUNION或SDIFF命令，则以读操作读取出集合对象，否则以写操作读取出集合对象
        robj *setobj = dstkey ?
            lookupKeyWrite(c->db,setkeys[j]) :
            lookupKeyRead(c->db,setkeys[j]);
        // 不存在的集合键设置为空
        if (!setobj) {
            sets[j] = NULL;
            continue;
        }
        // 检查存在的集合键是否是集合对象，不是则释放空间
        if (checkType(c,setobj,OBJ_SET)) {
            zfree(sets);
            return;
        }
        sets[j] = setobj;   //保存到集合数组中
    }
    /* Select what DIFF algorithm to use.
     *
     * Algorithm 1 is O(N*M) where N is the size of the element first set
     * and M the total number of sets.
     *
     * Algorithm 2 is O(N) where N is the total number of elements in all
     * the sets.
     *
     * We compute what is the best bet with the current input here. */
    // 计算差集共有两种算法
    // 1.时间复杂度O(N*M)，N是第一个集合中元素的总个数，M是集合的总个数
    // 2.时间复杂度O(N)，N是所有集合中元素的总个数
    if (op == SET_OP_DIFF && sets[0]) {
        long long algo_one_work = 0, algo_two_work = 0;
        // 遍历集合数组
        for (j = 0; j < setnum; j++) {
            if (sets[j] == NULL) continue;
            // 计算sets[0] × setnum的值
            algo_one_work += setTypeSize(sets[0]);
            // 计算所有集合的元素总个数
            algo_two_work += setTypeSize(sets[j]);
        }
        /* Algorithm 1 has better constant times and performs less operations
         * if there are elements in common. Give it some advantage. */
        algo_one_work /= 2;
        //根据algo_one_work和algo_two_work选择不同算法
        diff_algo = (algo_one_work <= algo_two_work) ? 1 : 2;
        // 如果是算法1，M较小，执行操作少
        if (diff_algo == 1 && setnum > 1) {
            /* With algorithm 1 it is better to order the sets to subtract
             * by decreasing size, so that we are more likely to find
             * duplicated elements ASAP. */
            // 将集合数组除第一个集合以外的所有集合，按照集合的元素排序
            qsort(sets+1,setnum-1,sizeof(robj*),
                qsortCompareSetsByRevCardinality);
        }
    }
    /* We need a temp set object to store our union. If the dstkey
     * is not NULL (that is, we are inside an SUNIONSTORE operation) then
     * this set object will be the resulting object to set into the target key*/
    // 创建一个临时集合对象作为结果集
    dstset = createIntsetObject();
    // 执行并集操作
    if (op == SET_OP_UNION) {
        /* Union is trivial, just add every element of every set to the
         * temporary set. */
        // 仅仅讲每一个集合中的每一个元素加入到结果集中
        // 遍历每一个集合
        for (j = 0; j < setnum; j++) {
            if (!sets[j]) continue; /* non existing keys are like empty sets */
            // 创建一个集合类型的迭代器
            si = setTypeInitIterator(sets[j]);
            // 遍历当前集合中的所有元素
            while((ele = setTypeNextObject(si)) != NULL) {
                // 讲迭代器指向的当前元素对象加入到结果集中
                if (setTypeAdd(dstset,ele)) cardinality++;  //如果结果集中不存在新加入的元素，则更新结果集的元素个数计数器
                decrRefCount(ele);  //否则直接释放元素对象空间
            }
            setTypeReleaseIterator(si);     //释放迭代器空间
        }
    // 执行差集操作并且使用算法1
    } else if (op == SET_OP_DIFF && sets[0] && diff_algo == 1) {
        /* DIFF Algorithm 1:
         *
         * We perform the diff by iterating all the elements of the first set,
         * and only adding it to the target set if the element does not exist
         * into all the other sets.
         *
         * This way we perform at max N*M operations, where N is the size of
         * the first set, and M the number of sets. */
        // 我们执行差集操作通过遍历第一个集合中的所有元素，并且将其他集合中不存在元素加入到结果集中
        // 时间复杂度O(N*M)，N是第一个集合中元素的总个数，M是集合的总个数
        si = setTypeInitIterator(sets[0]);
        // 创建集合类型迭代器遍历第一个集合中的所有元素
        while((ele = setTypeNextObject(si)) != NULL) {
            // 遍历集合数组中的除了第一个的所有集合，检查元素是否存在在每一个集合
            for (j = 1; j < setnum; j++) {
                if (!sets[j]) continue; /* no key is an empty set. */   //集合键不存在跳过本次循环
                if (sets[j] == sets[0]) break; /* same set! */          //相同的集合没必要比较
                if (setTypeIsMember(sets[j],ele)) break;                //如果元素存在后面的集合中，遍历下一个元素
            }
            // 执行到这里，说明当前元素不存在于 除了第一个的所有集合
            if (j == setnum) {
                /* There is no other set with this element. Add it. */
                // 因此将当前元素添加到结果集合中，更新计数器
                setTypeAdd(dstset,ele);
                cardinality++;
            }
            decrRefCount(ele);  //释放元素对象空间
        }
        setTypeReleaseIterator(si); //释放迭代器空间
    // 执行差集操作并且使用算法2
    } else if (op == SET_OP_DIFF && sets[0] && diff_algo == 2) {
        /* DIFF Algorithm 2:
         *
         * Add all the elements of the first set to the auxiliary set.
         * Then remove all the elements of all the next sets from it.
         *
         * This is O(N) where N is the sum of all the elements in every
         * set. */
        // 将第一个集合的所有元素加入到结果集中，然后遍历其后的所有集合，将有交集的元素从结果集中删除
        // 2.时间复杂度O(N)，N是所有集合中元素的总个数
        // 遍历所有的集合
        for (j = 0; j < setnum; j++) {
            if (!sets[j]) continue; /* non existing keys are like empty sets */
            si = setTypeInitIterator(sets[j]);
            // 创建集合类型迭代器遍历每一个集合中的所有元素
            while((ele = setTypeNextObject(si)) != NULL) {
                // 如果是第一个集合，将每一个元素加入到结果集中
                if (j == 0) {
                    if (setTypeAdd(dstset,ele)) cardinality++;
                // 如果是其后的集合，将当前元素从结果集中删除，如结果集中有的话
                } else {
                    if (setTypeRemove(dstset,ele)) cardinality--;
                }
                decrRefCount(ele);
            }
            setTypeReleaseIterator(si);//释放迭代器空间
            /* Exit if result set is empty as any additional removal
             * of elements will have no effect. */
            // 只要结果集为空，那么差集结果就为空，不用比较后续的集合
            if (cardinality == 0) break;
        }
    }
    /* Output the content of the resulting set, if not in STORE mode */
    // 如果不是STORE一类的命令，输出所有的结果
    if (!dstkey) {
        // 发送结果集的元素个数给client
        addReplyMultiBulkLen(c,cardinality);
        // 遍历结果集中的每一个元素，并发送给client
        si = setTypeInitIterator(dstset);
        while((ele = setTypeNextObject(si)) != NULL) {
            addReplyBulk(c,ele);
            decrRefCount(ele);  //发送完要释放空间
        }
        setTypeReleaseIterator(si); //释放迭代器
        decrRefCount(dstset);       //发送集合后要释放结果集的空间
    // STORE一类的命令，输出所有的结果
    } else {
        /* If we have a target key where to store the resulting set
         * create this key with the result set inside */
        // 先将目标集合从数据库中删除，如果存在的话
        int deleted = dbDelete(c->db,dstkey);
        // 如果结果集合非空
        if (setTypeSize(dstset) > 0) {
            dbAdd(c->db,dstkey,dstset); //将结果集加入到数据库中
            addReplyLongLong(c,setTypeSize(dstset));    //发送结果集的元素个数给client
            // 发送对应的事件通知
            notifyKeyspaceEvent(NOTIFY_SET,
                op == SET_OP_UNION ? "sunionstore" : "sdiffstore",
                dstkey,c->db->id);
        // 结果集为空，则释放空间
        } else {
            decrRefCount(dstset);
            addReply(c,shared.czero);   //发送0给client
            // 发送"del"事件通知
            if (deleted)
                notifyKeyspaceEvent(NOTIFY_GENERIC,"del",
                    dstkey,c->db->id);
        }
        // 键被修改，发送信号通知，更新脏键
        signalModifiedKey(c->db,dstkey);
        server.dirty++;
    }
    zfree(sets);    //释放集合数组空间
}
```
