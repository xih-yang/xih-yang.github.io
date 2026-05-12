# 17、Redis 源码解析 - Redis zrem、zrange 命令学习
- 来源：https://ddkk.com/zhuanlan/db/redis/5/17.html
- 分类：缓存数据库
- 分组：教程目录
### 1 zremCommand

#### 1.1 方法说明

从有序集合中移出一些成员，成功返回移出成员的数量。

#### 1.2 命令实践

#### 1.3 方法源代码

```java
void zremCommand(redisClient *c) {
	//获取键值
    robj *key = c->argv[1];
    robj *zobj;
    int deleted = 0, keyremoved = 0, j;
	//获取有序集合对象，并判断对象类型
    if ((zobj = lookupKeyWriteOrReply(c,key,shared.czero)) == NULL ||
        checkType(c,zobj,REDIS_ZSET)) return;
	//如果数据结构是压缩表
    if (zobj->encoding == REDIS_ENCODING_ZIPLIST) {
        unsigned char *eptr;
		//遍历需要移出的元素
        for (j = 2; j < c->argc; j++) {
            if ((eptr = zzlFind(zobj->ptr,c->argv[j],NULL)) != NULL) {
                deleted++;
                //从压缩表删除成员
                zobj->ptr = zzlDelete(zobj->ptr,eptr);
				//如果成员数量为0，则删除这个有序集合
                if (zzlLength(zobj->ptr) == 0) {
                    dbDelete(c->db,key);
                    keyremoved = 1;
                    break;
                }
            }
        }
    }
    //如果数据结构是跳跃表 
    else if (zobj->encoding == REDIS_ENCODING_SKIPLIST) {
        zset *zs = zobj->ptr;
        dictEntry *de;
        double score;
		//遍历需要移出的成员
        for (j = 2; j < c->argc; j++) {
            de = dictFind(zs->dict,c->argv[j]);
            if (de != NULL) {
                deleted++;
                /* Delete from the skiplist */
                score = *(double*)dictGetVal(de);
                //从跳跃表中
                redisAssertWithInfo(c,c->argv[j],zslDelete(zs->zsl,score,c->argv[j]));
                /* Delete from the hash table */
                //从哈希表中删除这个元素
                dictDelete(zs->dict,c->argv[j]);
                if (htNeedsResize(zs->dict)) dictResize(zs->dict);
				//如果成员数量为0，则删除这个有序集合
                if (dictSize(zs->dict) == 0) {
                    dbDelete(c->db,key);
                    keyremoved = 1;
                    break;
                }
            }
        }
    } else {
        redisPanic("Unknown sorted set encoding");
    }
	//如果删除了成员，则触发zrem和del通知事件。
	//标记键被修改
    if (deleted) {
        notifyKeyspaceEvent(REDIS_NOTIFY_ZSET,"zrem",key,c->db->id);
        if (keyremoved)
            notifyKeyspaceEvent(REDIS_NOTIFY_GENERIC,"del",key,c->db->id);
        signalModifiedKey(c->db,key);
        server.dirty += deleted;
    }	
	//响应删除成员的数量
    addReplyLongLong(c,deleted);
}
```

#### 1.4 代码理解

**1、** 获取有序集合对象，并判断对象类型；

**2、** 判断数据结构，如果是压缩表的话，则调用压缩表相关方法移除成员；

**3、** 如果是跳跃表的话，则调用跳跃表相关方法移除成员，并且从字典中移除成员；

**4、** 如果所有成员都被移除了，则有序集合本身也要被删除掉；

**5、** 如果删除了成员，则触发zrem通知事件；

**6、** 如果有序集合被删除了，则触发del通知事件；

**7、** 返回删除成员的数量；

### 2 zrangeCommand

#### 2.1 方法说明

遍历有序集合某位置到某位置的成员，可选参数 withscores 显示分数。

#### 2.2 命令实践

#### 2.3 方法源代码

```java
//按照分值升序
void zrangeCommand(redisClient *c) {
    zrangeGenericCommand(c,0);
}
//按照分值降序
void zrevrangeCommand(redisClient *c) {
    zrangeGenericCommand(c,1);
}
//zrange通用方法
void zrangeGenericCommand(redisClient *c, int reverse) {
	//获取键值
    robj *key = c->argv[1];
    robj *zobj;
    int withscores = 0;
    long start;
    long end;
    int llen;
    int rangelen;	
	//获取开始位置和结束位置
    if ((getLongFromObjectOrReply(c, c->argv[2], &start, NULL) != REDIS_OK) ||
        (getLongFromObjectOrReply(c, c->argv[3], &end, NULL) != REDIS_OK)) return;
	//校验参是否为5个，并且是否包含可选参数withscores
	//如果参数超过5个，则报错
    if (c->argc == 5 && !strcasecmp(c->argv[4]->ptr,"withscores")) {
        withscores = 1;
    } else if (c->argc >= 5) {
        addReply(c,shared.syntaxerr);
        return;
    }
	//获取有序集合对象，并判断对象类型是否有序集合
    if ((zobj = lookupKeyReadOrReply(c,key,shared.emptymultibulk)) == NULL
         || checkType(c,zobj,REDIS_ZSET)) return;
    /* Sanitize indexes. */
    //获取有序集合成员数量
    llen = zsetLength(zobj);
	//位置负数处理
    if (start < 0) start = llen+start;
    if (end < 0) end = llen+end;
    if (start < 0) start = 0;
    /* Invariant: start >= 0, so this test will be true when end < 0.
     * The range is empty when start > end or start >= length. */
    if (start > end || start >= llen) {
        addReply(c,shared.emptymultibulk);
        return;
    }
    if (end >= llen) end = llen-1;
	//计算遍历数量
    rangelen = (end-start)+1;
    /* Return the result in form of a multi-bulk reply */
    addReplyMultiBulkLen(c, withscores ? (rangelen*2) : rangelen);
	//如果数据结构是压缩表
    if (zobj->encoding == REDIS_ENCODING_ZIPLIST) {
        unsigned char *zl = zobj->ptr;
        unsigned char *eptr, *sptr;
        unsigned char *vstr;
        unsigned int vlen;
        long long vlong;
        if (reverse)
            eptr = ziplistIndex(zl,-2-(2*start));
        else
            eptr = ziplistIndex(zl,2*start);
        redisAssertWithInfo(c,zobj,eptr != NULL);
        sptr = ziplistNext(zl,eptr);
		//按照起始位置遍历
        while (rangelen--) {
            redisAssertWithInfo(c,zobj,eptr != NULL && sptr != NULL);
            redisAssertWithInfo(c,zobj,ziplistGet(eptr,&vstr,&vlen,&vlong));
            if (vstr == NULL)
                addReplyBulkLongLong(c,vlong);
            else
                addReplyBulkCBuffer(c,vstr,vlen);
			//如果使用了可选分数，则返回分数
            if (withscores)
                addReplyDouble(c,zzlGetScore(sptr));
            if (reverse)
                zzlPrev(zl,&eptr,&sptr);
            else
                zzlNext(zl,&eptr,&sptr);
        }
    }
    //如果是跳跃表
     else if (zobj->encoding == REDIS_ENCODING_SKIPLIST) {
        zset *zs = zobj->ptr;
        zskiplist *zsl = zs->zsl;
        zskiplistNode *ln;
        robj *ele;
        /* Check if starting point is trivial, before doing log(N) lookup. */
        if (reverse) {
            ln = zsl->tail;
            if (start > 0)
                ln = zslGetElementByRank(zsl,llen-start);
        } else {
            ln = zsl->header->level[0].forward;
            if (start > 0)
                ln = zslGetElementByRank(zsl,start+1);
        }
        while(rangelen--) {
            redisAssertWithInfo(c,zobj,ln != NULL);
            ele = ln->obj;
            addReplyBulk(c,ele);
            if (withscores)
                addReplyDouble(c,ln->score);
            ln = reverse ? ln->backward : ln->level[0].forward;
        }
    } else {
        redisPanic("Unknown sorted set encoding");
    }
}
```

#### 2.4 代码理解

**1、** 获取开始位置和结束位置，并校验参数类型；

**2、** 校验参是否为5个，并且是否包含可选参数withscores；

**3、** 获取有序集合成员数量；

**4、** 计算需要遍历成员的数量；

**5、** 判断数据结构，如果是压缩表，则调用压缩表相关方法遍历成员；

**6、** 如果是跳跃表，则调用跳跃表相关方法遍历成员；

**7、** 如果使用了withsocres，则遍历的时候会显示分数；

通过代码可以看到，zrangeCommand 和 zrevrangeCommand 两个方法都调用了 zrangeGenericCommand 这个方法，只不过通过传入第二个参数不同来控制遍历的顺序。

读过 t_list.c 和 t_string.c 源代码的同学可以发现 lrangeCommand 、getrangeCommand 和 现在我们学习的这个 zrangeGenericCommand 遍历成员的时候的逻辑大部分都是相同的，只不过读取不同数据结构的方法不同，但是遍历的思想是一样的，值得我们借鉴和学习。

### 3 总结

**1、** zrangeCommand和zrevrangeCommand两个方法都调用了zrangeGenericCommand这个方法；

**2、** getrangeCommand、lrangeCommand、zrangeCommand三者的遍历逻辑相同；

**3、** zremCommand在移出元素的时候，如果使用了跳跃表也会将在哈希表中移出响应的成员；
