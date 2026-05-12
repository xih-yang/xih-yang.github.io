# 10、Redis 源码解析 - Redis hset、hmset 命令学习
- 来源：https://ddkk.com/zhuanlan/db/redis/5/10.html
- 分类：缓存数据库
- 分组：教程目录
学习完 t_string.c、t_list.c文件后，现在开始学习 t_hash.c 的代码，从文件名可以看到是相关hash的相关命令代码。

### 1 hsetCommand

#### 1.1 方法说明

对一个hash键，设置一个键值对。

#### 1.2 命令实践

新增成功返回1，修改返回0

#### 1.3 方法源代码

```java
void hsetCommand(redisClient *c) {
    int update;
    robj *o;
	//获取键对象，如果不存在就创建一个
    if ((o = hashTypeLookupWriteOrCreate(c,c->argv[1])) == NULL) return;
	//判断数据结构是否要转换
    hashTypeTryConversion(o,c->argv,2,3);
	//判断是否需要编码转换
    hashTypeTryObjectEncoding(o,&c->argv[2], &c->argv[3]);
	//设置键值对
    update = hashTypeSet(o,c->argv[2],c->argv[3]);
    //响应结果
    addReply(c, update ? shared.czero : shared.cone);
    //标记键被修改
    signalModifiedKey(c->db,c->argv[1]);
	//通知事件
    notifyKeyspaceEvent(REDIS_NOTIFY_HASH,"hset",c->argv[1],c->db->id);
	//状态变更值递增
    server.dirty++;
}
```

#### 1.4 相关方法代码

##### 1.4.1 hashTypeLookupWriteOrCreate

获取键对象或者创建一个对象

```java
robj *hashTypeLookupWriteOrCreate(redisClient *c, robj *key) {
	//获取键对象
    robj *o = lookupKeyWrite(c->db,key);
	//如果不在创建一个对象，并将键值加入库中
    if (o == NULL) {
        o = createHashObject();
        dbAdd(c->db,key,o);
    }
    //如果对象类型不是Hash类型，则返回类型错误 
    else {
        if (o->type != REDIS_HASH) {
            addReply(c,shared.wrongtypeerr);
            return NULL;
        }
    }
	//返回键对象
    return o;
}
```

##### 1.4.2 hashTypeTryConversion

判断数据结构是否要转变

```java
/* Check the length of a number of objects to see if we need to convert a
 * ziplist to a real hash. Note that we only check string encoded objects
 * as their string length can be queried in constant time. */
void hashTypeTryConversion(robj *o, robj **argv, int start, int end) {
    int i;
	//如果不是压缩表直接返回
    if (o->encoding != REDIS_ENCODING_ZIPLIST) return;
	//遍历键和值
	//如果是字符串，并且长度超过配置，则进行数据结构幻化
    for (i = start; i <= end; i++) {
        if (sdsEncodedObject(argv[i]) &&
            sdslen(argv[i]->ptr) > server.hash_max_ziplist_value)
        {
            hashTypeConvert(o, REDIS_ENCODING_HT);
            break;
        }
    }
}
```

##### 1.4.3 hashTypeTryObjectEncoding

对参数进行编码

```java
/* Encode given objects in-place when the hash uses a dict. */
void hashTypeTryObjectEncoding(robj *subject, robj **o1, robj **o2) {
	//如果数据结构是哈希表，则需要进行对象编码
    if (subject->encoding == REDIS_ENCODING_HT) {
        if (o1) *o1 = tryObjectEncoding(*o1);
        if (o2) *o2 = tryObjectEncoding(*o2);
    }
}
```

##### 1.4.4 hashTypeSet

设置键值对

```java
/* Add an element, discard the old if the key already exists.
 * Return 0 on insert and 1 on update.
 * This function will take care of incrementing the reference count of the
 * retained fields and value objects. */
int hashTypeSet(robj *o, robj *field, robj *value) {
	//更新标记
    int update = 0;
	//如果数据结构是压缩表
    if (o->encoding == REDIS_ENCODING_ZIPLIST) {
        unsigned char *zl, *fptr, *vptr;
		//获取键和值
        field = getDecodedObject(field);
        value = getDecodedObject(value);
        zl = o->ptr;
        //获取压缩表头部位置
        fptr = ziplistIndex(zl, ZIPLIST_HEAD);
        if (fptr != NULL) {
            fptr = ziplistFind(fptr, field->ptr, sdslen(field->ptr), 1);
            if (fptr != NULL) {
                /* Grab pointer to the value (fptr points to the field) */
                vptr = ziplistNext(zl, fptr);
                redisAssert(vptr != NULL);
				//标记为更新状态
                update = 1;
                /* Delete value */
                //删除原来的值
                zl = ziplistDelete(zl, &vptr);
                /* Insert new value */
                //插入新的值
                zl = ziplistInsert(zl, vptr, value->ptr, sdslen(value->ptr));
            }
        }
		//如果是新增
        if (!update) {
            /* Push new field/value pair onto the tail of the ziplist */
            //插入键和值
            zl = ziplistPush(zl, field->ptr, sdslen(field->ptr), ZIPLIST_TAIL);
            zl = ziplistPush(zl, value->ptr, sdslen(value->ptr), ZIPLIST_TAIL);
        }
        o->ptr = zl;
        decrRefCount(field);
        decrRefCount(value);
        /* Check if the ziplist needs to be converted to a hash table */
        //检查hash的元素个数是否超过配置，如果超过则转换数据结构为哈希表
        if (hashTypeLength(o) > server.hash_max_ziplist_entries)
            hashTypeConvert(o, REDIS_ENCODING_HT);
    } else if (o->encoding == REDIS_ENCODING_HT) {
        if (dictReplace(o->ptr, field, value)) {
      /* Insert */
            incrRefCount(field);
        } else {
      /* Update */
            update = 1;
        }
        incrRefCount(value);
    } else {
        redisPanic("Unknown hash encoding");
    }
    return update;
}
```

##### 1.4.5 hashTypeLength

获取哈希的元素个数

```java
/* Return the number of elements in a hash. */
unsigned long hashTypeLength(robj *o) {
    unsigned long length = ULONG_MAX;
	//如果是压缩表
    if (o->encoding == REDIS_ENCODING_ZIPLIST) {
        length = ziplistLen(o->ptr) / 2;
    }
    //如果是哈希表 
    else if (o->encoding == REDIS_ENCODING_HT) {
        length = dictSize((dict*)o->ptr);
    } else {
        redisPanic("Unknown hash encoding");
    }
    return length;
}
```

#### 1.5 代码理解

这次没有和之前一样，一个方法一个方法的来介绍，而是围绕hsetCommand这个方法，从头到尾介绍了下里面出现的方法，这样就能串联在一起知道这个方法整体的细节，先来看下整体的流程。

**1、** 获取键对象，如果不存在就创建一个；

**2、** 根据键和值的数据长度来判断数据结构是否要转换；

**3、** 判断键和值两个参数是否要进行编码动作；

**4、** 调用hashTypeSet这个方法来设置键值对，并返回更新状态；

**5、** 响应更新新增状态结果；

**6、** 标记键被修改；

**7、** 变更状态递增；

通过源代码我们可以知道，hash也是由两种数据结构实现的，一种是我们之前了解过的压缩表，另一种是哈希表。

默认也是用压缩表来实现哈希表，在设置键值对的时候会检查是否要进行转换，判断条件有两个，一个是判断键和值的字符长度是否超过一定长度，一个是判断hash元素的个数是否超过一定的数量。

在使用压缩表插入键值对的时候，可以看到键和值都是被当成一个压缩表节点先后从尾部插入进去。

### 2 hmsetCommand

#### 2.1 方法说明

对一个hash键，一次设置多个键值对。

#### 2.2 命令实践

#### 2.3 方法源代码

```java
void hmsetCommand(redisClient *c) {
    int i;
    robj *o;
	//校验参数数量是否为偶数
    if ((c->argc % 2) == 1) {
        addReplyError(c,"wrong number of arguments for HMSET");
        return;
    }
	//获取hash键对象
    if ((o = hashTypeLookupWriteOrCreate(c,c->argv[1])) == NULL) return;
	//根据所有键和值，判断是否进行数据结构转换
    hashTypeTryConversion(o,c->argv,2,c->argc-1);
	//遍历所有键和值，进行键值对写入
    for (i = 2; i < c->argc; i += 2) {
        hashTypeTryObjectEncoding(o,&c->argv[i], &c->argv[i+1]);
        hashTypeSet(o,c->argv[i],c->argv[i+1]);
    }
	//响应ok
    addReply(c, shared.ok);
	//标记键被修改
    signalModifiedKey(c->db,c->argv[1]);
	//通知事件
    notifyKeyspaceEvent(REDIS_NOTIFY_HASH,"hset",c->argv[1],c->db->id);
    server.dirty++;
}
```

#### 2.4 代码理解

**1、** 校验参数数量是否为偶数；

**2、** 获取hash键对象；

**3、** 根据所有键和值，判断是否进行数据结构转换；

**4、** 遍历所有键和值，调用hashTypeSet进行键值对写入；

**5、** 响应ok；

**6、** 标记键被修改，触发通知事件；

### 3 总结

**1、** Redis中hash是两种数据结构实现的，一种是压缩表，一种是哈希表；

**2、** hset、hmset命令会判断每次设置的值是否会引起数据结构转换；

**3、** hset在设置键值对的时候，如果没有会先新建一个键值对；

**4、** hset新建和更新的时候返回值不同；
