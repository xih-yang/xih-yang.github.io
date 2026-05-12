# 14、Redis 源码解析 - Redis sismember，scard，spop 命令学习
- 来源：https://ddkk.com/zhuanlan/db/redis/5/14.html
- 分类：缓存数据库
- 分组：教程目录
### 1 sismemberCommand

#### 1.1 方法说明

判断一个值是否属于集合的成员，成功返回1，失败返回0。

#### 1.2 命令实践

#### 1.3 方法源代码

```java
void sismemberCommand(redisClient *c) {
    robj *set;
	//获取集合键对象
    if ((set = lookupKeyReadOrReply(c,c->argv[1],shared.czero)) == NULL ||
        checkType(c,set,REDIS_SET)) return;
    c->argv[2] = tryObjectEncoding(c->argv[2]);
	//判断一个元素是否属于对象
    if (setTypeIsMember(set,c->argv[2]))
        addReply(c,shared.cone);
    else
        addReply(c,shared.czero);
}
```

```java
int setTypeIsMember(robj *subject, robj *value) {
    long long llval;
    //如果是哈希表
    if (subject->encoding == REDIS_ENCODING_HT) {
        return dictFind((dict*)subject->ptr,value) != NULL;
    }
    //如果是整数集合 
    else if (subject->encoding == REDIS_ENCODING_INTSET) {
        if (isObjectRepresentableAsLongLong(value,&llval) == REDIS_OK) {
            return intsetFind((intset*)subject->ptr,llval);
        }
    } else {
        redisPanic("Unknown set encoding");
    }
    return 0;
}
```

#### 1.4 代码理解

**1、** 先获取集合键对象，并检查对象类型；

**2、** 调用setTypeIsMember判断元素是否属于集合中；

### 2 scardCommand

#### 2.1 方法说明

获取集合元素的个数。

#### 2.2 命令实践

#### 2.3 方法源代码

```java
void scardCommand(redisClient *c) {
    robj *o;
	//获取键，并判断键类型
    if ((o = lookupKeyReadOrReply(c,c->argv[1],shared.czero)) == NULL ||
        checkType(c,o,REDIS_SET)) return;
	//获取集合的长度
    addReplyLongLong(c,setTypeSize(o));
}
```

```java
unsigned long setTypeSize(robj *subject) {
	//如果是哈希表
    if (subject->encoding == REDIS_ENCODING_HT) {
        return dictSize((dict*)subject->ptr);
    } 
    //如果是整数集合
    else if (subject->encoding == REDIS_ENCODING_INTSET) {
        return intsetLen((intset*)subject->ptr);
    } else {
        redisPanic("Unknown set encoding");
    }
}
```

#### 2.4 代码理解

**1、** 先获取集合键对象，并检查对象类型；

**2、** 调用setTypeIsMember判断元素是否属于集合中；

### 3 spopCommand

#### 3.1 方法说明

从集合中随机弹出一个元素，成功返回弹出的元素。

#### 3.2 命令实践

#### 3.3 方法源代码

```java
void spopCommand(redisClient *c) {
    robj *set, *ele, *aux;
    int64_t llele;
    int encoding;
	//获取集合键对象，并判断类型
    if ((set = lookupKeyWriteOrReply(c,c->argv[1],shared.nullbulk)) == NULL ||
        checkType(c,set,REDIS_SET)) return;
	//随机获取集合中的一个元素
    encoding = setTypeRandomElement(set,&ele,&llele);
	//从集合中删除这个元素
    if (encoding == REDIS_ENCODING_INTSET) {
        ele = createStringObjectFromLongLong(llele);
        set->ptr = intsetRemove(set->ptr,llele,NULL);
    } else {
        incrRefCount(ele);
        setTypeRemove(set,ele);
    }
	//触发通知事件
    notifyKeyspaceEvent(REDIS_NOTIFY_SET,"spop",c->argv[1],c->db->id);
    /* Replicate/AOF this command as an SREM operation */
    aux = createStringObject("SREM",4);
    rewriteClientCommandVector(c,3,aux,c->argv[1],ele);
    decrRefCount(ele);
    decrRefCount(aux);
    addReplyBulk(c,ele);
	//如果集合中没有元素，则删除集合键
    if (setTypeSize(set) == 0) {
        dbDelete(c->db,c->argv[1]);
        notifyKeyspaceEvent(REDIS_NOTIFY_GENERIC,"del",c->argv[1],c->db->id);
    }
	//标记键被修改
    signalModifiedKey(c->db,c->argv[1]);
    server.dirty++;
}
```

```java
/* Return random element from a non empty set.
 * The returned element can be a int64_t value if the set is encoded
 * as an "intset" blob of integers, or a redis object if the set
 * is a regular set.
 *
 * The caller provides both pointers to be populated with the right
 * object. The return value of the function is the object->encoding
 * field of the object and is used by the caller to check if the
 * int64_t pointer or the redis object pointer was populated.
 *
 * When an object is returned (the set was a real set) the ref count
 * of the object is not incremented so this function can be considered
 * copy on write friendly. */
int setTypeRandomElement(robj *setobj, robj **objele, int64_t *llele) {
    if (setobj->encoding == REDIS_ENCODING_HT) {
        dictEntry *de = dictGetRandomKey(setobj->ptr);
        *objele = dictGetKey(de);
    } else if (setobj->encoding == REDIS_ENCODING_INTSET) {
        *llele = intsetRandom(setobj->ptr);
    } else {
        redisPanic("Unknown set encoding");
    }
    return setobj->encoding;
}
```

#### 3.4 代码理解

**1、** 获取集合键对象，并判断类型；

**2、** 调用setTypeRandomElement方法随机获取集合中的一个元素；

**3、** 根据数据结构调用相应的方法，删除这个元素；

**4、** 触发spop类型触发事件；

**5、** 如果集合中没有元素的话，则需要将集合删除，并触发del类型触发事件；

**6、** 标记键被修改；

### 4 总结

**1、** spop是从集合中随机弹出一个元素；
