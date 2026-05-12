# 08、Redis 源码解析 - Redis llen、lindex、lrange 命令实现学习
- 来源：https://ddkk.com/zhuanlan/db/redis/5/8.html
- 分类：缓存数据库
- 分组：教程目录
### 1 llenCommand

#### 1.1 方法说明

获取一个列表元素的个数

#### 1.2 命令实践

#### 1.3 方法源代码

```java
void llenCommand(redisClient *c) {
    robj *o = lookupKeyReadOrReply(c,c->argv[1],shared.czero);
    if (o == NULL || checkType(c,o,REDIS_LIST)) return;
    addReplyLongLong(c,listTypeLength(o));
}
```

#### 1.4 代码理解

**1、** 先获取键的对象；

**2、** 检查对象类型是否为列表类型；

**3、** 调用listTypeLength这个方法获取列表元素的个数；

### 2 listTypeLength

#### 2.1 方法说明

可以获取列表建的元素个数，在多处被调用。

#### 2.2 方法源代码

```java
unsigned long listTypeLength(robj *subject) {
    if (subject->encoding == REDIS_ENCODING_ZIPLIST) {
        return ziplistLen(subject->ptr);
    } else if (subject->encoding == REDIS_ENCODING_LINKEDLIST) {
        return listLength((list*)subject->ptr);
    } else {
        redisPanic("Unknown list encoding");
    }
}
```

#### 2.3 代码理解

**1、** 判断列表数据结构类型；

**2、** 如果是压缩表，则调用压缩表获取长度的方法；

**3、** 如果是链表，则调用链表获取长度的方法；

### 3 lindexCommand

#### 3.1 方法说明

获取列表某个位置的元素，成功返回元素的值。

#### 3.2 命令实践

#### 3.2 方法源代码

```java
void lindexCommand(redisClient *c) {
	//获取键的对象，并判断键对象类型是否为列表
    robj *o = lookupKeyReadOrReply(c,c->argv[1],shared.nullbulk);
    if (o == NULL || checkType(c,o,REDIS_LIST)) return;
    long index;
    robj *value = NULL;
	//获取索引位置参数
    if ((getLongFromObjectOrReply(c, c->argv[2], &index, NULL) != REDIS_OK))
        return;
	//如果是压缩表
    if (o->encoding == REDIS_ENCODING_ZIPLIST) {
        unsigned char *p;
        unsigned char *vstr;
        unsigned int vlen;
        long long vlong;
       	//获取指定位置的指针
        p = ziplistIndex(o->ptr,index);
        if (ziplistGet(p,&vstr,&vlen,&vlong)) {
            if (vstr) {
                value = createStringObject((char*)vstr,vlen);
            } else {
                value = createStringObjectFromLongLong(vlong);
            }
            addReplyBulk(c,value);
            decrRefCount(value);
        } else {
            addReply(c,shared.nullbulk);
        }
    }
    //如果是链表 
    else if (o->encoding == REDIS_ENCODING_LINKEDLIST) {
        listNode *ln = listIndex(o->ptr,index);
        if (ln != NULL) {
            value = listNodeValue(ln);
            addReplyBulk(c,value);
        } else {
            addReply(c,shared.nullbulk);
        }
    } else {
        redisPanic("Unknown list encoding");
    }
}
```

#### 3.4 代码理解

**1、** 先获取键的对象，并判断键对象类型是否为列表；

**2、** 获取索引位置参数；

**3、** 判断数据结构类型；

**4、** 如果是压缩表，则调用压缩表相关方法，获取指定位置的元素；

**5、** 如果是链表，则调用链表相关方法，获取指定位置的元素；

### 4 lrangeCommand

#### 4.1 方法说明

获取指定索引位置到另一个位置之间的所有元素。

#### 4.2 命令实践

#### 4.3 方法源代码

```java
void lrangeCommand(redisClient *c) {
    robj *o;
	//定义起始、结束、列表长度、范围长度变量
    long start, end, llen, rangelen;
	//获取起始位置、结束位置
	//并判断他们的类型是否正常
    if ((getLongFromObjectOrReply(c, c->argv[2], &start, NULL) != REDIS_OK) ||
        (getLongFromObjectOrReply(c, c->argv[3], &end, NULL) != REDIS_OK)) return;
	//获取键对象
	//检查键对象类型是否列表类型
    if ((o = lookupKeyReadOrReply(c,c->argv[1],shared.emptymultibulk)) == NULL
         || checkType(c,o,REDIS_LIST)) return;
	//获取列表的长度
    llen = listTypeLength(o);
	//转换负数
    /* convert negative indexes */
    if (start < 0) start = llen+start;
    if (end < 0) end = llen+end;
    if (start < 0) start = 0;
	//校验参数是否合理，不合理直接返回空
    /* Invariant: start >= 0, so this test will be true when end < 0.
     * The range is empty when start > end or start >= length. */
    if (start > end || start >= llen) {
        addReply(c,shared.emptymultibulk);
        return;
    }
    if (end >= llen) end = llen-1;
    //计算遍历长度
    rangelen = (end-start)+1;
    /* Return the result in form of a multi-bulk reply */
    addReplyMultiBulkLen(c,rangelen);
	//如果数据结构是压缩表
    if (o->encoding == REDIS_ENCODING_ZIPLIST) {
    	//获取起始位置的指针
        unsigned char *p = ziplistIndex(o->ptr,start);
        unsigned char *vstr;
        unsigned int vlen;
        long long vlong;
		//从起始位置开始遍历元素
        while(rangelen--) {
            ziplistGet(p,&vstr,&vlen,&vlong);
            if (vstr) {
                addReplyBulkCBuffer(c,vstr,vlen);
            } else {
                addReplyBulkLongLong(c,vlong);
            }
			//获取下一个指针
            p = ziplistNext(o->ptr,p);
        }
    }
    //如果是链表 
    else if (o->encoding == REDIS_ENCODING_LINKEDLIST) {
        listNode *ln;
        /* If we are nearest to the end of the list, reach the element
         * starting from tail and going backward, as it is faster. */
		//这里意思大概是因为链表结构只能从头到尾，或者从尾到头遍历才能拿到一个元素
		//故如果靠近尾部元素的话，从尾部去寻找一个元素就更快
        if (start > llen/2) start -= llen;
        ln = listIndex(o->ptr,start);
		//从起始位置开始遍历元素
        while(rangelen--) {
            addReplyBulk(c,ln->value);
            ln = ln->next;
        }
    } else {
        redisPanic("List encoding is not LINKEDLIST nor ZIPLIST!");
    }
}
```

#### 4.4 代码理解

先看下这个方法大致流程。

**1、** 先定义开始位置、结束位置、列表长度、遍历长度等几个关键变量；

**2、** 获取开始位置、结束位置的值，并判断值的是否为数字；

**3、** 获取键对象，并判断键对象的类型是否列表键；

**4、** 获取列表的长度；

**5、** 判断遍历位置是否为负数，如果为负数则转换为相对应的正数；

**6、** 校验起始位置和结束位置是否合理；

**7、** 计算遍历元素的个数；

**8、** 判断列表的数据结构；

**9、** 如果是压缩表，则调用压缩表相关遍历方法，从开始位置遍历；

**10、** 如果是链表，则调用链表相关遍历方法，从开始位置遍历；

可以看到这个方法不同以往，没有把核心逻辑单独放到某个listType方法里，而是直接写在command方法里，说明没有其他地方调用这一大段逻辑，并且里面大部分代码和 lindex 方法逻辑大同小异，只不过是从拿一个元素变成了拿连续的多个元素，并且这里的负数转换的逻辑和t_string.c里的getrangeCommand基本相似，可见思路是一样的。

方法里出现了大量关于位置的代码，我们可以学习到如何处理从一个数组中截取一段位置的元素，并且在遍历列表的时候，考虑到了链表查找某个元素的特性，做了一点小优化都是我们值得思考的，从这里也能看出来使用这个方法时间复杂度还是挺高的。

### 5 总结

**1、** 这节我们总共学习了llen、lindex、lrange三个命令；

**2、** listType前缀的方法都是对核心逻辑的封装方法，表示会被多处调用，例如listTypeLength；

**3、** 如果不需要多处调用，则会直接把核心逻辑写在Command方法里；

**4、** 链表结构查找一个元素比较麻烦；

**5、** 客户端输入的命令放在c->argv这个参数里，例如c->argv[1]、c->argv[2]；
