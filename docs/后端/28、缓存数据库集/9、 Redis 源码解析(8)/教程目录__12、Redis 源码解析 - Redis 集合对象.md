# 12、Redis 源码解析 - Redis 集合对象
- 来源：https://ddkk.com/zhuanlan/db/redis/8/12.html
- 分类：缓存数据库
- 分组：教程目录
### 1. 集合对象的结构

集合对象的编码可以是`intset`或者`hashtable`. 下面分别展示了集合对象分别使用`intset`和`hashtable`编码的结构图：

### 2. 集合对象编码

#### 2.1 编码使用规则

当集合对象可以同时满足以下两个条件时，对象使用`intset`编码：

- 集合对象保存的所有元素都是整数值.
- 集合对象保存的元素数量不超过512个.

不能满足这两个条件的集合对象需要使用`hashtable`编码.

#### 2.2 编码转换

对于使用`intset`编码的集合对象来说，当使用`intset`编码所需的两个条件的任意一个不能被满足时，就会执行对象的编码转换操作，原本保存在整数集合中的所有元素都会被转移并保存到字典里面，并且对象的编码也会从`intset`变为`hashtable`.

### 3. 集合对象命令介绍

命令
描述

SADD key member1 [member2]
将一个或多个成员添加到集合

SCARD key
获取集合中的成员数

SDIFF key1 [key2]
减去多个集合

SDIFFSTORE destination key1 [key2]
减去多个集并将结果集存储在键中

SINTER key1 [key2]
相交多个集合

SINTERSTORE destination key1 [key2]
交叉多个集合并将结果集存储在键中

SISMEMBER key member
判断确定给定值是否是集合的成员

SMOVE source destination member
将成员从一个集合移动到另一个集合

SPOP key
从集合中删除并返回随机成员

SRANDMEMBER key [count]
从集合中获取一个或多个随机成员

SREM key member1 [member2]
从集合中删除一个或多个成员

SUNION key1 [key2]
添加多个集合

SUNIONSTORE destination key1 [key2]
添加多个集并将结果集存储在键中

SSCAN key cursor [MATCH pattern] [COUNT count]
递增地迭代集合中的元素

### 4. 集合对象命令的实现

关于集合对象的源码在`server.h`头文件和`t_set.c`源文件中.

集合对象也实现了自己的迭代器，也是基于字典的迭代器封装的，和哈希对象的迭代器类似，这里不再展示.

集合对象可以进行`交`、`差`和`并`运算，源码中对应的宏如下：

```java
#define SET_OP_UNION 0      // 并集
#define SET_OP_DIFF 1       // 差集
#define SET_OP_INTER 2      // 交集
```

下面展示一下这些命令的实现.

#### 4.1 交集命令实现

**SINTER命令实现**

```java
// SINTER key [key ...]
// SINTER命令实现
void sinterCommand(client *c) {
    sinterGenericCommand(c,c->argv+1,c->argc-1,NULL);
}
```

**SINTERSTORE命令实现**

```java
// SINTERSTORE destination key [key ...]
// 对n个集合做交集，并将结果存到destination集合中
// SINTERSTORE 命令实现
void sinterstoreCommand(client *c) {
    sinterGenericCommand(c,c->argv+2,c->argc-2,c->argv[1]);
}
```

**底层实现**

```java
// SINTER key [key ...]
// SINTERSTORE destination key [key ...]
// SINTER、SINTERSTORE一类命令的底层实现
// setkeys：集合名称；setnum：集合个数；dstkey：将运算结果保存到dstkey中
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
    // 将满足要求的集合都存到sets集合数组中（空的集合会被删除）
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
    // 从小到大排序集合数组中的集合大小，能够提高算法的性能
    qsort(sets,setnum,sizeof(robj*),qsortCompareSetsByCardinality);
    // 首先我们应该输出集合中元素的数量，但是现在不知道交集的大小
    // 因此创建一个空对象的链表，然后保存所有的回复
    if (!dstkey) {
    	// STINER命令创建一个链表
        replylen = addDeferredMultiBulkLength(c);
    } else {
    	// STINERSTORE命令创建要给整数集合对象
        dstset = createIntsetObject();
    }
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

#### 4.2 并集和差集命令实现

**SUNION命令实现**

```java
// SUNION key [key ...]
// SUNION命令实现
void sunionCommand(client *c) {
    sunionDiffGenericCommand(c,c->argv+1,c->argc-1,NULL,SET_OP_UNION);
}
```

**SUNIONSTORE命令实现**

```java
// SUNIONSTORE destination key [key ...]
// SUNIONSTORE命令实现
void sunionstoreCommand(client *c) {
    sunionDiffGenericCommand(c,c->argv+2,c->argc-2,c->argv[1],SET_OP_UNION);
}
```

**SDIFF命令实现**

```java
// SDIFF key [key ...]
// SDIFF命令实现
void sdiffCommand(client *c) {
    sunionDiffGenericCommand(c,c->argv+1,c->argc-1,NULL,SET_OP_DIFF);
}
```

**SDIFFSTORE命令实现**

```java
// SDIFFSTORE destination key [key ...]
// SDIFFSTORE命令实现
void sdiffstoreCommand(client *c) {
    sunionDiffGenericCommand(c,c->argv+2,c->argc-2,c->argv[1],SET_OP_DIFF);
}
```

**底层实现**

```java
// SUNION key [key ...]
// SUNIONSTORE destination key [key ...]
// SDIFF key [key ...]
// SDIFFSTORE destination key [key ...]
// 并集、差集命令的底层实现
// setkeys：集合名称；setnum：集合个数；dstkey：将运算结果保存到dstkey中
void sunionDiffGenericCommand(client *c, robj **setkeys, int setnum,
                              robj *dstkey, int op) {
    // 分配集合数组的空间
    robj **sets = zmalloc(sizeof(robj*)*setnum);
    setTypeIterator *si;
    robj *ele, *dstset = NULL;
    int j, cardinality = 0;
    int diff_algo = 1;
    // 遍历数组中集合键对象
    // 将满足要求的集合都存到sets集合数组中（空的集合会被删除）
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
    // 释放集合数组空间
    zfree(sets);
}
```
