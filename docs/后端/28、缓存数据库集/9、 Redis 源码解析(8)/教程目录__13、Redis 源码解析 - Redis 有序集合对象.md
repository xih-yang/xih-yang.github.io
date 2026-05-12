# 13、Redis 源码解析 - Redis 有序集合对象
- 来源：https://ddkk.com/zhuanlan/db/redis/8/13.html
- 分类：缓存数据库
- 分组：教程目录
### 1. 有序集合对象的结构

有序集合的编码可以是`ziplist`或者`skiplist`.

当使用`ziplist`编码时，每个集合元素使用两个紧挨在一起的压缩列表节点来保存，第一个节点保存元素的成员，而第二个元素则保存元素的分值，压缩列表内的集合元素按分值从小到大进行排序. 分值小的元素靠近表头，分值大的元素靠近表尾. 如下图：

当使用`skiplist`编码时，有序集合对象的`ptr`指针会指向一个`zset`结构，该结构同时包含一个字典和一个跳跃表：

```java
// 有序集合类型
typedef struct zset {
    dict *dict;
    zskiplist *zsl;
} zset;
```

如图：

但为什么要使用两种数据结构，而不直接使用跳跃表或者字典任意一种呢？

当对有序集合对象要根据成员查找分值时，将使用字典来实现，时间复杂度为`O(1)`，而如果单单使用跳跃表的话，这一复杂度将会是`O(log(n))`.

而当有序集合对象要执行范围型操作时，比如`ZRANK`、`ZRANGE`等命令时，将使用跳跃表来实现，而如果单单使用字典来实现的话，每次都要将找出来的元素重新进行排序，完成排序的时间复杂度至少为`O(NlogN)`，以及额外的`O(N)`空间复杂度（保存排序结果）.

所以Redis选择了同时使用字典和跳跃表两种数据结构来实现有序集合. 但是这两种数据结构都会通过指针来共享相同元素的成员和分值，所以同时使用跳跃表和字典来保存集合元素不会产生任何重复成员或者分值，也不会因此而浪费额外的空间.

可以参考下面的结构图，为了方便展示，在字典和跳跃表中重复展示了各个元素的成员和分值，但在实际中，字典和跳跃表会共享元素的成员和分值，所以并不会造成任何数据重复，也不会因此而浪费任何空间.

### 2. 有序集合对象编码

#### 2.1 编码使用规则

当有序集合对象可以同时满足以下两个条件时，对象使用`ziplist`编码:

- 有序集合保存的元素数量小于128个.
- 有序集合保存的所有元素成员的长度都小于64字节.

不能满足以上两个条件的有序集合对象将使用`skiplist`编码.

#### 2.2 编码转换

对于使用`ziplist`编码的有序集合对象来说，当使用`ziplist`编码所需的两个条件中的任意一个不能被满足时，就会执行对象的编码转换操作，原本保存在压缩列表里的所有集合元素都会被转移并保存到`zset`结构里面，对象的编码也会从`ziplist`变为`skiplist`.

### 3. 有序集合对象命令介绍

命令
描述

ZADD key score1 member1 [score2 member2]
向有序集合添加一个或多个成员，或者更新已存在成员的分数

ZCARD key
获取有序集合的成员数

ZCOUNT key min max
计算在有序集合中指定区间分数的成员数

ZINCRBY key increment member
有序集合中对指定成员的分数加上增量 increment

ZINTERSTORE destination numkeys key [key …]
计算给定的一个或多个有序集的交集并将结果集存储在新的有序集合 key 中

ZLEXCOUNT key min max
在有序集合中计算指定字典区间内成员数量

ZRANGE key start stop [WITHSCORES]
通过索引区间返回有序集合成指定区间内的成员

ZRANGEBYLEX key min max [LIMIT offset count]
通过字典区间返回有序集合的成员

ZRANGEBYSCORE key min max [WITHSCORES] [LIMIT]
通过分数返回有序集合指定区间内的成员

ZRANK key member
返回有序集合中指定成员的索引

ZREM key member [member …]
移除有序集合中的一个或多个成员

ZREMRANGEBYLEX key min max
移除有序集合中给定的字典区间的所有成员

ZREMRANGEBYRANK key start stop
移除有序集合中给定的排名区间的所有成员

ZREMRANGEBYSCORE key min max
移除有序集合中给定的分数区间的所有成员

ZREVRANGE key start stop [WITHSCORES]
返回有序集中指定区间内的成员，通过索引，分数从高到底

ZREVRANGEBYSCORE key max min [WITHSCORES]
返回有序集中指定分数区间内的成员，分数从高到低排序

ZREVRANK key member
返回有序集合中指定成员的排名，有序集成员按分数值递减(从大到小)排序

ZSCORE key member
返回有序集中，成员的分数值

ZUNIONSTORE destination numkeys key [key …]
计算给定的一个或多个有序集的并集，并存储在新的 key 中

ZSCAN key cursor [MATCH pattern] [COUNT count]
迭代有序集合中的元素（包括元素成员和元素分值）

### 4. 有序集合对象命令的实现

关于有序集合对象的源码在`server.h`头文件和`t_zset.c`源文件中.

#### 4.1 有序集合的范围限定方式

我们可以发现有序集合有三个主要的关于范围操作的命令：

命令
描述

ZRANGE key start stop [WITHSCORES]
通过索引区间返回有序集合成指定区间内的成员

ZRANGEBYLEX key min max [LIMIT offset count]
通过字典区间返回有序集合的成员

ZRANGEBYSCORE key min max [WITHSCORES] [LIMIT]
通过分数返回有序集合指定区间内的成员

所以Redis有序集合有三种范围限定：

- 根据字典区间
- 根据排位（索引）区间
- 根据分值区间

以上三种主要依赖两种排序方式：

- 分值序
- 字典序

以上两种排序所表示的范围，依赖于两个结构，一个规定分值序的范围和边界，一个规定字典序的范围和边界：

以下结构体定义在`server.h`头文件中.

```java
/* Struct to hold a inclusive/exclusive range spec by score comparison. */
typedef struct {
	// 最小值和最大值
    double min, max;
    // minex表示最小值是否包含在这个范围，1表示不包含，0表示包含
    // 同理maxex表示最大值
    int minex, maxex; /* are min or max exclusive? */
} zrangespec;
/* Struct to hold an inclusive/exclusive range spec by lexicographic comparison. */
typedef struct {
    robj *min, *max;  /* May be set to shared.(minstring|maxstring) *///最小值和最大值
    // minex表示最小值是否包含在这个范围，1表示不包含，0表示包含
    // 同理maxex表示最大值
    int minex, maxex; /* are min or max exclusive? */
} zlexrangespec;
```

#### 4.2 有序集合的范围操作

##### 4.2.1 ZRANGE

```java
// ZRANGE key start stop [WITHSCORES]
// ZRANGE命令实现
void zrangeCommand(client *c) {
    zrangeGenericCommand(c,0);
}
// ZREVRANGE key start stop [WITHSCORES]
// ZREVRANGE命令实现
void zrevrangeCommand(client *c) {
    zrangeGenericCommand(c,1);
}
```

**底层实现**

```java
// ZRANGE key start stop [WITHSCORES]
// ZREVRANGE key start stop [WITHSCORES]
// ZRANGE、ZREVRANGE命令底层实现
void zrangeGenericCommand(client *c, int reverse) {
    robj *key = c->argv[1];
    robj *zobj;
    int withscores = 0;
    long start;
    long end;
    int llen;
    int rangelen;
    // 取出起始位置start和结束位置end
    if ((getLongFromObjectOrReply(c, c->argv[2], &start, NULL) != C_OK) ||
        (getLongFromObjectOrReply(c, c->argv[3], &end, NULL) != C_OK)) return;
    // 如果有WITHSCORES参数，设置标志
    if (c->argc == 5 && !strcasecmp(c->argv[4]->ptr,"withscores")) {
        withscores = 1;
    // 参数太多发送语法错误信息
    } else if (c->argc >= 5) {
        addReply(c,shared.syntaxerr);
        return;
    }
    // 以读操作取出key有序集合并检查集合的数据类型
    if ((zobj = lookupKeyReadOrReply(c,key,shared.emptymultibulk)) == NULL
         || checkType(c,zobj,OBJ_ZSET)) return;
    /* Sanitize indexes. */
    // 获得有序集合的下标范围
    llen = zsetLength(zobj);
    // 处理负数下标
    if (start < 0) start = llen+start;
    if (end < 0) end = llen+end;
    if (start < 0) start = 0;
    /* Invariant: start >= 0, so this test will be true when end < 0.
     * The range is empty when start > end or start >= length. */
    // 修剪调整下标
    if (start > end || start >= llen) {
        addReply(c,shared.emptymultibulk);
        return;
    }
    if (end >= llen) end = llen-1;
    rangelen = (end-start)+1;       //范围长度
    /* Return the result in form of a multi-bulk reply */
    // 发送回复的行数信息给client
    addReplyMultiBulkLen(c, withscores ? (rangelen*2) : rangelen);
    // 如果是ziplist
    if (zobj->encoding == OBJ_ENCODING_ZIPLIST) {
        unsigned char *zl = zobj->ptr;
        unsigned char *eptr, *sptr;
        unsigned char *vstr;
        unsigned int vlen;
        long long vlong;
        // 根据reverse决定遍历的头或尾元素节点地址eptr
        if (reverse)
            eptr = ziplistIndex(zl,-2-(2*start));
        else
            eptr = ziplistIndex(zl,2*start);
        serverAssertWithInfo(c,zobj,eptr != NULL);
        // 获得分值节点地址
        sptr = ziplistNext(zl,eptr);
        //取出rangelen个元素
        while (rangelen--) {
            serverAssertWithInfo(c,zobj,eptr != NULL && sptr != NULL);
            serverAssertWithInfo(c,zobj,ziplistGet(eptr,&vstr,&vlen,&vlong));   //讲元素信息保存在参数中
            // 元素的类型不同，发送不同类型的回复信息
            if (vstr == NULL)
                addReplyBulkLongLong(c,vlong);
            else
                addReplyBulkCBuffer(c,vstr,vlen);
            // 设置了withscores，发送分值
            if (withscores)
                addReplyDouble(c,zzlGetScore(sptr));
            // 根据reverse，指向下一个元素和分值的节点
            if (reverse)
                zzlPrev(zl,&eptr,&sptr);
            else
                zzlNext(zl,&eptr,&sptr);
        }
    // 如果是跳跃表
    } else if (zobj->encoding == OBJ_ENCODING_SKIPLIST) {
        zset *zs = zobj->ptr;
        zskiplist *zsl = zs->zsl;
        zskiplistNode *ln;
        robj *ele;
        /* Check if starting point is trivial, before doing log(N) lookup. */
        // 根据reverse决定，遍历的头或尾元素节点地址
        if (reverse) {
            ln = zsl->tail;
            if (start > 0)
                ln = zslGetElementByRank(zsl,llen-start);
        } else {
            ln = zsl->header->level[0].forward;
            if (start > 0)
                ln = zslGetElementByRank(zsl,start+1);
        }
        // 取出rangelen个元素
        while(rangelen--) {
            serverAssertWithInfo(c,zobj,ln != NULL);
            ele = ln->obj;
            addReplyBulk(c,ele);    //发送元素
            if (withscores)
                addReplyDouble(c,ln->score);    //发送分值
            // 指向下一个节点
            ln = reverse ? ln->backward : ln->level[0].forward;
        }
    } else {
        serverPanic("Unknown sorted set encoding");
    }
}
```

##### 4.2.2 ZRANGEBYSCORE

```java
// ZRANGEBYSCORE key max min [WITHSCORES] [LIMIT offset count]
// ZRANGEBYSCORE 命令实现
void zrangebyscoreCommand(client *c) {
    genericZrangebyscoreCommand(c,0);
}
// ZREVRANGEBYSCORE key max min [WITHSCORES] [LIMIT offset count]
// ZREVRANGEBYSCORE 命令实现
void zrevrangebyscoreCommand(client *c) {
    genericZrangebyscoreCommand(c,1);
}
```

**底层实现**

```java
/* This command implements ZRANGEBYSCORE, ZREVRANGEBYSCORE. */
// ZRANGEBYSCORE key min max [WITHSCORES] [LIMIT offset count]
// ZREVRANGEBYSCORE key max min [WITHSCORES] [LIMIT offset count]
// ZRANGEBYSCORE ZREVRANGEBYSCORE命令的底层实现
void genericZrangebyscoreCommand(client *c, int reverse) {
    zrangespec range;
    robj *key = c->argv[1];
    robj *zobj;
    long offset = 0, limit = -1;
    int withscores = 0;
    unsigned long rangelen = 0;
    void *replylen = NULL;
    int minidx, maxidx;
    /* Parse the range arguments. */
    // 解析min和max范围的参数的下标
    if (reverse) {
        /* Range is given as [max,min] */
        maxidx = 2; minidx = 3;
    } else {
        /* Range is given as [min,max] */
        minidx = 2; maxidx = 3;
    }
    // 解析min和max范围参数，保存到zrangespec中，默认是包含[]临界值
    if (zslParseRange(c->argv[minidx],c->argv[maxidx],&range) != C_OK) {
        addReplyError(c,"min or max is not a float");
        return;
    }
    /* Parse optional extra arguments. Note that ZCOUNT will exactly have
     * 4 arguments, so we'll never enter the following code path. */
    // 解析其他的参数
    if (c->argc > 4) {
        int remaining = c->argc - 4;    //其他参数个数
        int pos = 4;
        while (remaining) {
            // 如果有WITHSCORES，设置标志
            if (remaining >= 1 && !strcasecmp(c->argv[pos]->ptr,"withscores")) {
                pos++; remaining--;
                withscores = 1;
            // 如果有LIMIT，取出offset和count值 保存在offset和limit中
            } else if (remaining >= 3 && !strcasecmp(c->argv[pos]->ptr,"limit")) {
                if ((getLongFromObjectOrReply(c, c->argv[pos+1], &offset, NULL) != C_OK) ||
                    (getLongFromObjectOrReply(c, c->argv[pos+2], &limit, NULL) != C_OK)) return;
                pos += 3; remaining -= 3;
            } else {
                addReply(c,shared.syntaxerr);
                return;
            }
        }
    }
    /* Ok, lookup the key and get the range */
    // 以读操作取出有序集合对象
    if ((zobj = lookupKeyReadOrReply(c,key,shared.emptymultibulk)) == NULL ||
        checkType(c,zobj,OBJ_ZSET)) return;
    // ziplist
    if (zobj->encoding == OBJ_ENCODING_ZIPLIST) {
        unsigned char *zl = zobj->ptr;
        unsigned char *eptr, *sptr;
        unsigned char *vstr;
        unsigned int vlen;
        long long vlong;
        double score;
        /* If reversed, get the last node in range as starting point. */
        // 获得range范围内的起始元素节点地址
        if (reverse) {
            eptr = zzlLastInRange(zl,&range);
        } else {
            eptr = zzlFirstInRange(zl,&range);
        }
        /* No "first" element in the specified interval. */
        // 没有元素在range里，发送空回复
        if (eptr == NULL) {
            addReply(c, shared.emptymultibulk);
            return;
        }
        /* Get score pointer for the first element. */
        serverAssertWithInfo(c,zobj,eptr != NULL);
        // 分值节点地址
        sptr = ziplistNext(zl,eptr);
        /* We don't know in advance how many matching elements there are in the
         * list, so we push this object that will represent the multi-bulk
         * length in the output buffer, and will "fix" it later */
        // 回复长度
        replylen = addDeferredMultiBulkLength(c);
        /* If there is an offset, just traverse the number of elements without
         * checking the score because that is done in the next loop. */
        // 跳过offset设定的长度
        while (eptr && offset--) {
            if (reverse) {
                zzlPrev(zl,&eptr,&sptr);
            } else {
                zzlNext(zl,&eptr,&sptr);
            }
        }
        // 遍历所有符合范围的节点
        while (eptr && limit--) {
            score = zzlGetScore(sptr);  //获取分值
            /* Abort when the node is no longer in range. */
            // 检查分值是否符合范围内的分值
            if (reverse) {
                if (!zslValueGteMin(score,&range)) break;
            } else {
                if (!zslValueLteMax(score,&range)) break;
            }
            /* We know the element exists, so ziplistGet should always succeed */
            serverAssertWithInfo(c,zobj,ziplistGet(eptr,&vstr,&vlen,&vlong));   //保存当前元素的值到参数中
            rangelen++;
            // 不同元素类型，发送不同的类型的值给client
            if (vstr == NULL) {
                addReplyBulkLongLong(c,vlong);
            } else {
                addReplyBulkCBuffer(c,vstr,vlen);
            }
            if (withscores) {
                addReplyDouble(c,score);    //发送分值
            }
            /* Move to next node */
            // 指向下一个元素和分值节点
            if (reverse) {
                zzlPrev(zl,&eptr,&sptr);
            } else {
                zzlNext(zl,&eptr,&sptr);
            }
        }
    // 跳跃表
    } else if (zobj->encoding == OBJ_ENCODING_SKIPLIST) {
        zset *zs = zobj->ptr;
        zskiplist *zsl = zs->zsl;
        zskiplistNode *ln;
        /* If reversed, get the last node in range as starting point. */
        // 获得range范围内的起始节点地址
        if (reverse) {
            ln = zslLastInRange(zsl,&range);
        } else {
            ln = zslFirstInRange(zsl,&range);
        }
        /* No "first" element in the specified interval. */
        // 没有元素存在在制定的范围内
        if (ln == NULL) {
            addReply(c, shared.emptymultibulk);
            return;
        }
        /* We don't know in advance how many matching elements there are in the
         * list, so we push this object that will represent the multi-bulk
         * length in the output buffer, and will "fix" it later */
        // 回复长度
        replylen = addDeferredMultiBulkLength(c);
        /* If there is an offset, just traverse the number of elements without
         * checking the score because that is done in the next loop. */
        // 跳过offset个节点
        while (ln && offset--) {
            if (reverse) {
                ln = ln->backward;
            } else {
                ln = ln->level[0].forward;
            }
        }
        // 遍历所有符合范围的节点
        while (ln && limit--) {
            /* Abort when the node is no longer in range. */
            // 检查分值是否符合
            if (reverse) {
                if (!zslValueGteMin(ln->score,&range)) break;
            } else {
                if (!zslValueLteMax(ln->score,&range)) break;
            }
            rangelen++;
            addReplyBulk(c,ln->obj);    //发送元素
            if (withscores) {
                addReplyDouble(c,ln->score);    //发送分值
            }
            /* Move to next node */
            // 指向下一个节点
            if (reverse) {
                ln = ln->backward;
            } else {
                ln = ln->level[0].forward;
            }
        }
    } else {
        serverPanic("Unknown sorted set encoding");
    }
    if (withscores) {
        //更新回复长度
        rangelen *= 2;
    }
    setDeferredMultiBulkLength(c, replylen, rangelen);  //发送范围的长度
}
```

##### 4.2.3 ZRANGEBYLEX

```java
// ZRANGEBYLEX key min max [LIMIT offset count]
// ZRANGEBYLEX 命令实现
void zrangebylexCommand(client *c) {
    genericZrangebylexCommand(c,0);
}
// ZREVRANGEBYLEX key min max [LIMIT offset count]
// ZREVRANGEBYLEX命令实现
void zrevrangebylexCommand(client *c) {
    genericZrangebylexCommand(c,1);
}
```

**底层实现**

```java
/* This command implements ZRANGEBYLEX, ZREVRANGEBYLEX. */
// ZRANGEBYLEX key min max [LIMIT offset count]
// ZRANGEBYLEX 命令实现
void genericZrangebylexCommand(client *c, int reverse) {
    zlexrangespec range;
    robj *key = c->argv[1];
    robj *zobj;
    long offset = 0, limit = -1;
    unsigned long rangelen = 0;
    void *replylen = NULL;
    int minidx, maxidx;
    /* Parse the range arguments. */
    // 解析min和max范围的参数的下标
    if (reverse) {
        /* Range is given as [max,min] */
        maxidx = 2; minidx = 3;
    } else {
        /* Range is given as [min,max] */
        minidx = 2; maxidx = 3;
    }
    // 解析min和max范围的参数，保存到range
    if (zslParseLexRange(c->argv[minidx],c->argv[maxidx],&range) != C_OK) {
        addReplyError(c,"min or max not valid string range item");
        return;
    }
    /* Parse optional extra arguments. Note that ZCOUNT will exactly have
     * 4 arguments, so we'll never enter the following code path. */
    // 解析其他参数
    if (c->argc > 4) {
        int remaining = c->argc - 4;    //其他参数的个数
        int pos = 4;
        while (remaining) {
            // 如果有LIMIT，取出offset和count保存在offset和limit
            if (remaining >= 3 && !strcasecmp(c->argv[pos]->ptr,"limit")) {
                if ((getLongFromObjectOrReply(c, c->argv[pos+1], &offset, NULL) != C_OK) ||
                    (getLongFromObjectOrReply(c, c->argv[pos+2], &limit, NULL) != C_OK)) return;
                pos += 3; remaining -= 3;
            } else {
                zslFreeLexRange(&range);
                addReply(c,shared.syntaxerr);
                return;
            }
        }
    }
    /* Ok, lookup the key and get the range */
    // 以读操作取出有序集合对象
    if ((zobj = lookupKeyReadOrReply(c,key,shared.emptymultibulk)) == NULL ||
        checkType(c,zobj,OBJ_ZSET))
    {
        zslFreeLexRange(&range);
        return;
    }
    // ziplist
    if (zobj->encoding == OBJ_ENCODING_ZIPLIST) {
        unsigned char *zl = zobj->ptr;
        unsigned char *eptr, *sptr;
        unsigned char *vstr;
        unsigned int vlen;
        long long vlong;
        /* If reversed, get the last node in range as starting point. */
        // 获得range范围内的起始元素节点地址
        if (reverse) {
            eptr = zzlLastInLexRange(zl,&range);
        } else {
            eptr = zzlFirstInLexRange(zl,&range);
        }
        /* No "first" element in the specified interval. */
        // 没有元素在范围内
        if (eptr == NULL) {
            addReply(c, shared.emptymultibulk);
            zslFreeLexRange(&range);
            return;
        }
        /* Get score pointer for the first element. */
        serverAssertWithInfo(c,zobj,eptr != NULL);
        // 分数节点的地址
        sptr = ziplistNext(zl,eptr);
        /* We don't know in advance how many matching elements there are in the
         * list, so we push this object that will represent the multi-bulk
         * length in the output buffer, and will "fix" it later */
        // 回复长度
        replylen = addDeferredMultiBulkLength(c);
        /* If there is an offset, just traverse the number of elements without
         * checking the score because that is done in the next loop. */
        // 跳过offset设定的长度
        while (eptr && offset--) {
            if (reverse) {
                zzlPrev(zl,&eptr,&sptr);
            } else {
                zzlNext(zl,&eptr,&sptr);
            }
        }
        // 遍历所有符合范围的节点
        while (eptr && limit--) {
            /* Abort when the node is no longer in range. */
            // 检查分值是否符合范围内的分值
            if (reverse) {
                if (!zzlLexValueGteMin(eptr,&range)) break;
            } else {
                if (!zzlLexValueLteMax(eptr,&range)) break;
            }
            /* We know the element exists, so ziplistGet should always
             * succeed. */
            serverAssertWithInfo(c,zobj,ziplistGet(eptr,&vstr,&vlen,&vlong));   //保存当前元素的值到参数中
            rangelen++;
            // 不同元素值类型，发送不同类型的值client
            if (vstr == NULL) {
                addReplyBulkLongLong(c,vlong);
            } else {
                addReplyBulkCBuffer(c,vstr,vlen);
            }
            /* Move to next node */
            // 指向下一个元素和分值节点
            if (reverse) {
                zzlPrev(zl,&eptr,&sptr);
            } else {
                zzlNext(zl,&eptr,&sptr);
            }
        }
    // skiplist
    } else if (zobj->encoding == OBJ_ENCODING_SKIPLIST) {
        zset *zs = zobj->ptr;
        zskiplist *zsl = zs->zsl;
        zskiplistNode *ln;
        /* If reversed, get the last node in range as starting point. */
        // 获得range范围内的起始节点地址
        if (reverse) {
            ln = zslLastInLexRange(zsl,&range);
        } else {
            ln = zslFirstInLexRange(zsl,&range);
        }
        /* No "first" element in the specified interval. */
        // 没有节点符合范围
        if (ln == NULL) {
            addReply(c, shared.emptymultibulk);
            zslFreeLexRange(&range);
            return;
        }
        /* We don't know in advance how many matching elements there are in the
         * list, so we push this object that will represent the multi-bulk
         * length in the output buffer, and will "fix" it later */
        // 回复长度
        replylen = addDeferredMultiBulkLength(c);
        /* If there is an offset, just traverse the number of elements without
         * checking the score because that is done in the next loop. */
        // 跳过offset个节点
        while (ln && offset--) {
            if (reverse) {
                ln = ln->backward;
            } else {
                ln = ln->level[0].forward;
            }
        }
        // 遍历所有符合范围的节点
        while (ln && limit--) {
            /* Abort when the node is no longer in range. */
            if (reverse) {
       //检查分值是否符合
                if (!zslLexValueGteMin(ln->obj,&range)) break;
            } else {
                if (!zslLexValueLteMax(ln->obj,&range)) break;
            }
            rangelen++;
            addReplyBulk(c,ln->obj);    //发送元素
            /* Move to next node */
            // 指向下一个节点
            if (reverse) {
                ln = ln->backward;
            } else {
                ln = ln->level[0].forward;
            }
        }
    } else {
        serverPanic("Unknown sorted set encoding");
    }
    zslFreeLexRange(&range);    //释放字典序范围
    setDeferredMultiBulkLength(c, replylen, rangelen);  //发送回复长度值
}
```
