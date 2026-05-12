# 13、Redis 源码解析 - Redis sadd，srem 命令学习
- 来源：https://ddkk.com/zhuanlan/db/redis/5/13.html
- 分类：缓存数据库
- 分组：教程目录
学习完 t_string.c、t_list.c、t_hash.c文件后，现在开始学习 t_set.c 的代码，从文件名可以看到是相关集合相关命令的代码文件。总共5种数据结构，我们已经学习到第4个了，离成功不远了，再加一把劲加油。

### 1 saddCommand

#### 1.1 方法说明

向一个集合中添加元素。

#### 1.2 命令实践

添加成功返回添加元素的个数。

#### 1.3 命令源代码

```java
void saddCommand(redisClient *c) {
    robj *set;
    int j, added = 0;
	//获取集合键对象
    set = lookupKeyWrite(c->db,c->argv[1]);
	//如果集合为Null，则创建一个集合
    if (set == NULL) {
        set = setTypeCreate(c->argv[2]);
		//将集合对象加入字典中
        dbAdd(c->db,c->argv[1],set);
    } else {
        if (set->type != REDIS_SET) {
            addReply(c,shared.wrongtypeerr);
            return;
        }
    }
	//遍历需要加入集合的元素中
    for (j = 2; j < c->argc; j++) {
        c->argv[j] = tryObjectEncoding(c->argv[j]);
		// 将元素加入集合中
        if (setTypeAdd(set,c->argv[j])) added++;
    }
	//如果成功加入了元素，则标记键被修改，并且触发通知事件。
    if (added) {
        signalModifiedKey(c->db,c->argv[1]);
        notifyKeyspaceEvent(REDIS_NOTIFY_SET,"sadd",c->argv[1],c->db->id);
    }
	//状态变更值增加元素的个数
    server.dirty += added;
	//响应成功加入元素的数量
    addReplyLongLong(c,added);
}
```

#### 1.4 相关源代码

##### 1.4.1 setTypeCreate

```java
/* Factory method to return a set that *can* hold "value". When the object has
 * an integer-encodable value, an intset will be returned. Otherwise a regular
 * hash table. */
robj *setTypeCreate(robj *value) {
	//如果是是数字，则优先创建整数集合对象
    if (isObjectRepresentableAsLongLong(value,NULL) == REDIS_OK)
        return createIntsetObject();
	//否则创建集合对象
    return createSetObject();
}
```

##### 1.4.2 setTypeAdd

```java
int setTypeAdd(robj *subject, robj *value) {
    long long llval;
	//如果数据结构是哈希表
    if (subject->encoding == REDIS_ENCODING_HT) {
    	//向集合中添加一个键值对
        if (dictAdd(subject->ptr,value,NULL) == DICT_OK) {
            incrRefCount(value);
            return 1;
        }
    }
    //如果数据结构是整数集合 
    else if (subject->encoding == REDIS_ENCODING_INTSET) {
        if (isObjectRepresentableAsLongLong(value,&llval) == REDIS_OK) {
            uint8_t success = 0;
            //向整数集合中添加一个元素
            subject->ptr = intsetAdd(subject->ptr,llval,&success);
            if (success) {
                /* Convert to regular set when the intset contains
                 * too many entries. */
                if (intsetLen(subject->ptr) > server.set_max_intset_entries)
                    setTypeConvert(subject,REDIS_ENCODING_HT);
                return 1;
            }
        } else {
            /* Failed to get integer from object, convert to regular set. */
            //转换集合的数据结构为哈希表
            setTypeConvert(subject,REDIS_ENCODING_HT);
            /* The set *was* an intset and this value is not integer
             * encodable, so dictAdd should always work. */
            redisAssertWithInfo(NULL,value,dictAdd(subject->ptr,value,NULL) == DICT_OK);
            incrRefCount(value);
            return 1;
        }
    } else {
        redisPanic("Unknown set encoding");
    }
    return 0;
}
```

##### 1.4.3 setTypeConvert

```java
/* Convert the set to specified encoding. The resulting dict (when converting
 * to a hash table) is presized to hold the number of elements in the original
 * set. */
void setTypeConvert(robj *setobj, int enc) {
    setTypeIterator *si;
    redisAssertWithInfo(NULL,setobj,setobj->type == REDIS_SET &&
                             setobj->encoding == REDIS_ENCODING_INTSET);
    if (enc == REDIS_ENCODING_HT) {
        int64_t intele;
        dict *d = dictCreate(&setDictType,NULL);
        robj *element;
        /* Presize the dict to avoid rehashing */
        dictExpand(d,intsetLen(setobj->ptr));
        /* To add the elements we extract integers and create redis objects */
        si = setTypeInitIterator(setobj);
        while (setTypeNext(si,NULL,&intele) != -1) {
            element = createStringObjectFromLongLong(intele);
            redisAssertWithInfo(NULL,element,dictAdd(d,element,NULL) == DICT_OK);
        }
        setTypeReleaseIterator(si);
        setobj->encoding = REDIS_ENCODING_HT;
        zfree(setobj->ptr);
        setobj->ptr = d;
    } else {
        redisPanic("Unsupported set conversion");
    }
}
```

#### 1.5 代码理解

**1、** 先获取获取集合键对象；

**2、** 判断集合是否存在；

**3、** 集合如果不存在，则创建一个集合；

**4、** 集合如果存在，则判断对象类型是否集合；

**5、** 遍历需要加入集合的元素，循环调用setTypeAdd方法将元素加入集合中；

**6、** 标记键被修改，并触发通知事件；

**7、** 变更server.dirty值，变更数量为增加的元素数量；

通过观察sadd方法，我们可以发现集合的底层数据结构也是有两种类型，一种是整数集合，一种是哈希表，并且在每次插入元素的时候，也会判断当前插入的值是否会引起数据结构转型,如果需要转变数据结构则会调用 setTypeConvert 方法转变底层数据结构。

sadd可以向集合中添加多个元素，得益于使用了遍历的方式来添加元素，每次添加元素都会调用 setTypeAdd 方法。

和以前代码类型，带有setType前缀的方法，里面也是包含两种数据结构逻辑的方法。

### 2 sremCommand

#### 2.1 方法说明

从一个集合中移出元素。

#### 2.2 命令实践

#### 2.3 方法源代码

```java
void sremCommand(redisClient *c) {
    robj *set;
    int j, deleted = 0, keyremoved = 0;
	//获取键对象，并检查对象类型是否为集合类型
    if ((set = lookupKeyWriteOrReply(c,c->argv[1],shared.czero)) == NULL ||
        checkType(c,set,REDIS_SET)) return;
	//遍历需要移出的元素
    for (j = 2; j < c->argc; j++) {
        if (setTypeRemove(set,c->argv[j])) {
            deleted++;
            //判断当前集合的长度是否为0，是的话则删除集合
            if (setTypeSize(set) == 0) {
                dbDelete(c->db,c->argv[1]);
                keyremoved = 1;
                break;
            }
        }
    }
	//标记键修改，并触发通知事件
    if (deleted) {
        signalModifiedKey(c->db,c->argv[1]);
        notifyKeyspaceEvent(REDIS_NOTIFY_SET,"srem",c->argv[1],c->db->id);
        if (keyremoved)
            notifyKeyspaceEvent(REDIS_NOTIFY_GENERIC,"del",c->argv[1],
                                c->db->id);
        server.dirty += deleted;
    }
	//返回被删除元素的个数
    addReplyLongLong(c,deleted);
}
```

#### 2.4 相关源代码

##### 2.4.1 checkType

```java
//redis.h
/* Object types */
#define REDIS_STRING 0
#define REDIS_LIST 1
#define REDIS_SET 2
#define REDIS_ZSET 3
#define REDIS_HASH 4
//object.c
int checkType(redisClient *c, robj *o, int type) {
    if (o->type != type) {
        addReply(c,shared.wrongtypeerr);
        return 1;
    }
    return 0;
}
```

##### 2.4.2 setTypeRemove

```java
int setTypeRemove(robj *setobj, robj *value) {
    long long llval;
    //如果数据结构是哈希表
    if (setobj->encoding == REDIS_ENCODING_HT) {
        if (dictDelete(setobj->ptr,value) == DICT_OK) {
            if (htNeedsResize(setobj->ptr)) dictResize(setobj->ptr);
            return 1;
        }
    }
    //如果数据结构整数集合 
    else if (setobj->encoding == REDIS_ENCODING_INTSET) {
        if (isObjectRepresentableAsLongLong(value,&llval) == REDIS_OK) {
            int success;
            setobj->ptr = intsetRemove(setobj->ptr,llval,&success);
            if (success) return 1;
        }
    } else {
        redisPanic("Unknown set encoding");
    }
    return 0;
}
```

##### 2.4.3 setTypeSize

```java
unsigned long setTypeSize(robj *subject) {
	//如果数据结构是哈希表，则调用字典相关方法
    if (subject->encoding == REDIS_ENCODING_HT) {
        return dictSize((dict*)subject->ptr);
    }
    //如果数据结构是整数集合，则调用整数集合 
    else if (subject->encoding == REDIS_ENCODING_INTSET) {
        return intsetLen((intset*)subject->ptr);
    } else {
        redisPanic("Unknown set encoding");
    }
}
```

##### 2.5 代码理解

**1、** 获取键对象，并检查对象类型是否为集合类型；

**2、** 遍历需要移出的元素，循环调用setTypeRemove方法移出元素；

**3、** 如果集合的元素个数为0时，则需要删除这个集合，用setTypeSize获取集合长度；

**4、** 标记键修改，并触发通知事件；

**5、** 返回被删除元素的个数；

整体的思路其实和 sadd差不多，一个是添加元素，一个是移出元素，都是先拿到集合对象，然后遍历元素在调用相应的方法。

这次相关源代码中，添加了一个我们经常见到的 checkType ，虽然它定义在object.c文件中，不过先拿出来阅读下，也不是不可以，免得每次遇到它也不知道葫芦里到底卖的什么药，可以看到方法里其实并没有什么逻辑，就是单纯判断当前对象的类型和传入的类型是否相等，不相等的就报错并返回0，相等的话返回1。

并且可以看到宏定义刚好有5个,是我们熟悉的5个数据类型。

```java
#define REDIS_STRING 0
#define REDIS_LIST 1
#define REDIS_SET 2
#define REDIS_ZSET 3
#define REDIS_HASH 4
```

### 3 总结

**1、** 集合类型有两种底层数据结构，一种是整数集合，一种是哈希表；

**2、** 集合类型再添加元素的时候，会判断是否要转变数据结构；

**3、** 是否要转变数据结构判断标准是，集合长度是否超过配置，集合元素类型是否不为数字；

**4、** sadd和srem都可以同时操作多个元素；

**5、** checkType方法定义在object.c中，主要逻辑时判断对象的类型和传入的类型是否相等；
