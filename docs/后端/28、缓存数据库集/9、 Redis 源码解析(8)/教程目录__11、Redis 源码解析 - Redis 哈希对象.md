# 11、Redis 源码解析 - Redis 哈希对象
- 来源：https://ddkk.com/zhuanlan/db/redis/8/11.html
- 分类：缓存数据库
- 分组：教程目录
### 1. 列表对象的结构

哈希对象的编码可以是`ziplist`或者`字典`.

当使用`ziplist`作为底层实现时，每当有新的键值对要加人到哈希对象时，程序会先将保存了键的压缩列表节点推入到压缩列表表尾，然后再将保存了值的压缩列表节点推入到压缩列表表尾，因此：

- 保存了同一键值对的两个节点总是紧挨在一起，保存键的节点在前，保存值的节点在后.
- 先添加到哈希对象中的键值对会被放在压缩列表的表头方向，而后来添加到哈希对象中的键值对会被放在压缩列表的表尾方向.

如下图所示：

而当使用`字典`作为底层实现时，哈希对象中的每个键值对都使用一个字典键值对来保存：

- 字典的每个键都是一个字符串对象，对象中保存了键值对的键.
- 字典的每个值都是一个字符串对象，对象中保存了键值对的值.

如下图所示：

### 2. 哈希对象编码

#### 2.1 编码使用规则

当哈希对象可以同时满足以下两个条件的时，哈希对象使用`ziplist`编码：

- 哈希对象保存的所有键值对的键和值的字符串长度都小于64字节.
- 哈希对象保存的键值对数量小于512个.

不能满足上述任何一个条件的哈希对象都需要使用`hashtable`编码.

#### 2.2 编码转换

当哈希对象使用的是`ziplist`编码时，当保存的键值对发生改变而不满足上诉的任意一个条件时，对象的编码转换操作就会被执行，原本保存在压缩列表里的所有键值对都会被转移并保存到字典里面，对象的编码也会从`ziplist`变为`hashtable`.

### 3. 哈希对象命令介绍

命令
描述

HDEL key field2 [field2]
删除一个或多个哈希表字段

HEXISTS key field
查看哈希表 key 中，指定的字段是否存在

HGET key field
获取存储在哈希表中指定字段的值

HGETALL key
获取在哈希表中指定 key 的所有字段和值

HINCRBY key field increment
为哈希表 key 中的指定字段的整数值加上增量 increment

HINCRBYFLOAT key field increment
为哈希表 key 中的指定字段的浮点数值加上增量 increment

HKEYS key
获取所有哈希表中的字段

HLEN key
获取哈希表中字段的数量

HMGET key field1 [field2]
获取所有给定字段的值

HMSET key field1 value1 [field2 value2 ]
同时将多个 field-value (域-值)对设置到哈希表 key 中

HSET key field value
将哈希表 key 中的字段 field 的值设为 value

HSETNX key field value
只有在字段 field 不存在时，设置哈希表字段的值

HVALS key
获取哈希表中所有值

HSCAN key cursor [MATCH pattern][COUNT count]
迭代哈希表中的键值对

### 4. 哈希对象命令的实现

字符串对象命令的实现代码在`t_hash.c`源文件中.

哈希对象的默认编码是`ziplist`，当元素长度或者元素长度到达一个阈值的时候，才会转化为`字典`编码.

转换的阈值（在`server.h`文件中）如下所示：

```java
#define OBJ_HASH_MAX_ZIPLIST_ENTRIES 512
#define OBJ_HASH_MAX_ZIPLIST_VALUE 64
```

#### 4.1 HSET命令

```java
// HSET key field value
// HSET命令实现
void hsetCommand(client *c) {
    int update;
    robj *o;
    // 以写方式取出哈希对象，失败则直接返回
    if ((o = hashTypeLookupWriteOrCreate(c,c->argv[1])) == NULL) return;
    // 是否需要进行哈希对象的编码类型转换，是存储在ziplist或字典中
    hashTypeTryConversion(o,c->argv,2,3);
    // 将键和值对象的编码进行优化，以节省空间，是以embstr或raw或整型存储
    hashTypeTryObjectEncoding(o,&c->argv[2], &c->argv[3]);
    // 设置field-value对，update为1则是更新，为0则是替换
    update = hashTypeSet(o,c->argv[2],c->argv[3]);
    // 发送更新或替换的信息给client
    addReply(c, update ? shared.czero : shared.cone);
    // 修改数据库的键则发送信号
    signalModifiedKey(c->db,c->argv[1]);
    // 发送"hset"事件通知
    notifyKeyspaceEvent(NOTIFY_HASH,"hset",c->argv[1],c->db->id);
    // 更新脏键
    server.dirty++;
}
```

**创建哈希对象**

```java
// 以写操作在数据库中查找对应key的哈希对象，如果不存在则创建
robj *hashTypeLookupWriteOrCreate(client *c, robj *key) {
    robj *o = lookupKeyWrite(c->db,key);    //以写操作在数据库中查找对应key的哈希对象
    // 如果key不存在，则创建一个哈希对象，并加入到数据库中
    if (o == NULL) {
        o = createHashObject();
        dbAdd(c->db,key,o);
    } else {
        // 如果key存在于数据库中，检查其类型是否是哈希类型对象
        if (o->type != OBJ_HASH) {
            addReply(c,shared.wrongtypeerr);
            return NULL;
        }
    }
    return o;
}
```

**判断是否需要编码转换**

```java
// 检查一个数字对象的长度判断是否需要进行类型的转换，从ziplist转换到ht类型
// 只检查一个字符串类型长度，因为他的长度可以在常数时间内获取
void hashTypeTryConversion(robj *o, robj **argv, int start, int end) {
    int i;
    // 只从OBJ_ENCODING_ZIPLIST类型转换为OBJ_ENCODING_HT
    if (o->encoding != OBJ_ENCODING_ZIPLIST) return;
    // 遍历所有的数字对象
    for (i = start; i <= end; i++) {
        // 如果当前对象是字符串对象的编码且字符串长度大于了配置文件规定的ziplist最大的长度
        if (sdsEncodedObject(argv[i]) &&
            sdslen(argv[i]->ptr) > server.hash_max_ziplist_value)
        {
            // 将该对象编码转换为OBJ_ENCODING_HT
            hashTypeConvert(o, OBJ_ENCODING_HT);
            break;
        }
    }
}
```

**优化对象编码**

```java
// 对键和值的对象尝试进行优化编码以节约内存
void hashTypeTryObjectEncoding(robj *subject, robj **o1, robj **o2) {
    // 如果当前subject对象的编码为OBJ_ENCODING_HT，则对o1对象和o2对象进行尝试优化编码
    if (subject->encoding == OBJ_ENCODING_HT) {
        if (o1) *o1 = tryObjectEncoding(*o1);
        if (o2) *o2 = tryObjectEncoding(*o2);
    }
}
```

**将键值对添加到哈希对象中**

```java
// 将field-value添加到哈希对象中，返回1
// 如果field存在更新新的值，返回0
int hashTypeSet(robj *o, robj *field, robj *value) {
    int update = 0;
    // 如果是ziplist类型
    if (o->encoding == OBJ_ENCODING_ZIPLIST) {
        unsigned char *zl, *fptr, *vptr;
        // 如果field-value是整数，则解码为字符串类型
        field = getDecodedObject(field);
        value = getDecodedObject(value);
        zl = o->ptr;
        // 遍历整个ziplist，得到头entry节点的地址
        fptr = ziplistIndex(zl, ZIPLIST_HEAD);
        if (fptr != NULL) {
            // 在ziplist中查找并返回和field相等的entry节点
            fptr = ziplistFind(fptr, field->ptr, sdslen(field->ptr), 1);
            // 如果field存在
            if (fptr != NULL) {
                /* Grab pointer to the value (fptr points to the field) */
                // 返回当value的entry地址，也就是field的下一个entry
                vptr = ziplistNext(zl, fptr);
                serverAssert(vptr != NULL);
                update = 1; // 设置更新的标志
                /* Delete value */
                // 将找到的value删除
                zl = ziplistDelete(zl, &vptr);
                /* Insert new value */
                // 插入新的value节点
                zl = ziplistInsert(zl, vptr, value->ptr, sdslen(value->ptr));
            }
        }
        // 如果没有找到field
        if (!update) {
            /* Push new field/value pair onto the tail of the ziplist */
            // 讲field和value按序压入到ziplist中
            zl = ziplistPush(zl, field->ptr, sdslen(field->ptr), ZIPLIST_TAIL);
            zl = ziplistPush(zl, value->ptr, sdslen(value->ptr), ZIPLIST_TAIL);
        }
        // 更新哈希对象
        o->ptr = zl;
        // 释放临时的field-value
        decrRefCount(field);
        decrRefCount(value);
        /* Check if the ziplist needs to be converted to a hash table */
        // 在配置的条件下，如果能进行优化编码以便节约内存
        if (hashTypeLength(o) > server.hash_max_ziplist_entries)
            hashTypeConvert(o, OBJ_ENCODING_HT);
    // 如果是添加到字典
    } else if (o->encoding == OBJ_ENCODING_HT) {
        // 插入或替换字典的field-value对，插入返回1，替换返回0
        if (dictReplace(o->ptr, field, value)) {
      /* Insert */
            incrRefCount(field);    //如果是插入成功，则释放field
        } else {
      /* Update */
            update = 1;     //设置更新的标志
        }
        incrRefCount(value);    //释放value对象
    } else {
        serverPanic("Unknown hash encoding");
    }
    return update;  //更新返回1，替换返回0
}
```

#### 4.2 HMSET命令

```java
// HMSET key field value [field value ...]
// HMSET的实现
void hmsetCommand(client *c) {
    int i;
    robj *o;
    // 参数必须为奇数，键值对必须成对出现
    if ((c->argc % 2) == 1) {
        addReplyError(c,"wrong number of arguments for HMSET");
        return;
    }
    // 以写方式取出哈希对象，失败则直接返回
    if ((o = hashTypeLookupWriteOrCreate(c,c->argv[1])) == NULL) return;
    // 是否需要进行哈希对象的编码类型转换，是存储在ziplist或字典中
    hashTypeTryConversion(o,c->argv,2,c->argc-1);
    // 遍历所有键值对
    for (i = 2; i < c->argc; i += 2) {
        // 将键和值对象的编码进行优化，以节省空间，是以embstr或raw或整型存储
        hashTypeTryObjectEncoding(o,&c->argv[i], &c->argv[i+1]);
        // 设置field-value对
        hashTypeSet(o,c->argv[i],c->argv[i+1]);
    }
    // 发送设置ok给client
    addReply(c, shared.ok);
    // 修改数据库的键则发送信号，发送"hset"事件通知，更新脏键
    signalModifiedKey(c->db,c->argv[1]);
    notifyKeyspaceEvent(NOTIFY_HASH,"hset",c->argv[1],c->db->id);
    server.dirty++;
}
```

#### 4.3 HGET命令

```java
// HGET key field
// HGET命令实现
void hgetCommand(client *c) {
    robj *o;
    // 以读操作取出哈希对象，若失败，或取出的对象不是哈希类型的对象，则直接返回
    if ((o = lookupKeyReadOrReply(c,c->argv[1],shared.nullbulk)) == NULL ||
        checkType(c,o,OBJ_HASH)) return;
    addHashFieldToReply(c, o, c->argv[2]);  //发送相应的值给client
}
```

#### 4.4 HDEL命令

```java
// HDEL key field [field ...]
// HDEL命令实现
void hdelCommand(client *c) {
    robj *o;
    int j, deleted = 0, keyremoved = 0;
    // 以写操作取出哈希对象，若失败，或取出的对象不是哈希类型的对象，则发送0后直接返回
    if ((o = lookupKeyWriteOrReply(c,c->argv[1],shared.czero)) == NULL ||
        checkType(c,o,OBJ_HASH)) return;
    // 遍历所有的字段field
    for (j = 2; j < c->argc; j++) {
        // 从哈希对象中删除当前字段
        if (hashTypeDelete(o,c->argv[j])) {
            deleted++;  //更新删除的个数
            // 如果哈希对象为空，则删除该对象
            if (hashTypeLength(o) == 0) {
                dbDelete(c->db,c->argv[1]);
                keyremoved = 1; //设置删除标志
                break;
            }
        }
    }
    // 只要删除了字段
    if (deleted) {
        // 发送信号表示键被改变
        signalModifiedKey(c->db,c->argv[1]);
        // 发送"hdel"事件通知
        notifyKeyspaceEvent(NOTIFY_HASH,"hdel",c->argv[1],c->db->id);
        // 如果哈希对象被删除
        if (keyremoved)
            // 发送"hdel"事件通知
            notifyKeyspaceEvent(NOTIFY_GENERIC,"del",c->argv[1],
                                c->db->id);
        server.dirty += deleted;    // 更新脏键
    }
    addReplyLongLong(c,deleted);    //发送删除的个数给client
}
```

**从字典对象中删除值**

```java
// 从一个哈希对象中删除field，成功返回1，没找到field返回0
int hashTypeDelete(robj *o, robj *field) {
    int deleted = 0;
    // 从ziplist中删除
    if (o->encoding == OBJ_ENCODING_ZIPLIST) {
        unsigned char *zl, *fptr;
        // 得到字符串类型的field
        field = getDecodedObject(field);
        zl = o->ptr;
        // 遍历整个ziplist，得到头entry地址
        fptr = ziplistIndex(zl, ZIPLIST_HEAD);
        if (fptr != NULL) {
            // 查找到对应field的entry
            fptr = ziplistFind(fptr, field->ptr, sdslen(field->ptr), 1);
            if (fptr != NULL) {
                // 删除field和后一个对应value的entry
                zl = ziplistDelete(zl,&fptr);
                zl = ziplistDelete(zl,&fptr);
                // 更新哈希对象的值
                o->ptr = zl;
                deleted = 1;    //设置删除成功标志
            }
        }
        decrRefCount(field);    //释放field空间
    // 从字典中删除
    } else if (o->encoding == OBJ_ENCODING_HT) {
        // 删除成功，设置删除标志
        if (dictDelete((dict*)o->ptr, field) == C_OK) {
            deleted = 1;
            /* Always check if the dictionary needs a resize after a delete. */
            // 删除成功，则按需收缩字典大小
            if (htNeedsResize(o->ptr)) dictResize(o->ptr);
        }
    } else {
        serverPanic("Unknown hash encoding");
    }
    return deleted;
}
```

#### 4.5 HLEN命令

```java
// HLEN key
// HLEN命令实现
void hlenCommand(client *c) {
    robj *o;
    // 以写操作取出哈希对象，若失败，或取出的对象不是哈希类型的对象，则发送0后直接返回
    if ((o = lookupKeyReadOrReply(c,c->argv[1],shared.czero)) == NULL ||
        checkType(c,o,OBJ_HASH)) return;
    // 发送哈希对象的字段数给client
    addReplyLongLong(c,hashTypeLength(o));
}
```

**返回哈希对象的键值对个数**

```java
// 返回哈希对象中的键值对个数
unsigned long hashTypeLength(robj *o) {
    unsigned long length = ULONG_MAX;
    // 返回ziplist的entry节点个数的一半，则为一对field-value的个数
    if (o->encoding == OBJ_ENCODING_ZIPLIST) {
        length = ziplistLen(o->ptr) / 2;
    // 返回字典的大小
    } else if (o->encoding == OBJ_ENCODING_HT) {
        length = dictSize((dict*)o->ptr);
    } else {
        serverPanic("Unknown hash encoding");
    }
    return length;
}
```

#### 4.6 哈希迭代器

哈希类型也实现了自己的迭代器：

```java
typedef struct {
	// 哈希类型迭代器所属的哈希对象
    robj *subject;
    // 哈希对象的编码类型
    int encoding;
    // ziplist
    // 指向当前的key和value节点的地址，ziplist类型编码时使用
    unsigned char *fptr, *vptr; 
    // 字典
    // 迭代HT类型的哈希对象时的字典迭代器
    dictIterator *di;
    // 指向当前的哈希表节点
    dictEntry *de;
} hashTypeIterator;
```

**初始化一个哈希对象的迭代器**

```java
// 返回一个初始化的哈希类型的迭代器
hashTypeIterator *hashTypeInitIterator(robj *subject) {
    // 分配空间初始化成员
    hashTypeIterator *hi = zmalloc(sizeof(hashTypeIterator));
    hi->subject = subject;
    hi->encoding = subject->encoding;
    // 根据不同的编码设置不同的成员
    if (hi->encoding == OBJ_ENCODING_ZIPLIST) {
        hi->fptr = NULL;
        hi->vptr = NULL;
    } else if (hi->encoding == OBJ_ENCODING_HT) {
        // 初始化一个字典迭代器返回给di成员
        hi->di = dictGetIterator(subject->ptr);
    } else {
        serverPanic("Unknown hash encoding");
    }
    return hi;
}
```

**销毁迭代器**

```java
// 释放哈希类型迭代器空间
void hashTypeReleaseIterator(hashTypeIterator *hi) {
    // 如果是字典，则需要先释放字典迭代器的空间
    if (hi->encoding == OBJ_ENCODING_HT) {
        dictReleaseIterator(hi->di);
    }
    zfree(hi);
}
```

**迭代**

```java
// 将哈希类型迭代器指向哈希对象中的下一个节点
int hashTypeNext(hashTypeIterator *hi) {
    // 迭代ziplist
    if (hi->encoding == OBJ_ENCODING_ZIPLIST) {
        unsigned char *zl;
        unsigned char *fptr, *vptr;
        // 备份迭代器的成员信息
        zl = hi->subject->ptr;
        fptr = hi->fptr;
        vptr = hi->vptr;
        // field的指针为空，则指向第一个entry，只在第一次执行时，初始化指针
        if (fptr == NULL) {
            /* Initialize cursor */
            serverAssert(vptr == NULL);
            fptr = ziplistIndex(zl, 0);
        } else {
            /* Advance cursor */
            // 获取value节点的下一个entry地址，即为下一个field的地址
            serverAssert(vptr != NULL);
            fptr = ziplistNext(zl, vptr);
        }
        // 迭代完毕或返回C_ERR
        if (fptr == NULL) return C_ERR;
        /* Grab pointer to the value (fptr points to the field) */
        // 保存下一个value的地址
        vptr = ziplistNext(zl, fptr);
        serverAssert(vptr != NULL);
        /* fptr, vptr now point to the first or next pair */
        // 更新迭代器的成员信息
        hi->fptr = fptr;
        hi->vptr = vptr;
    // 如果是迭代字典
    } else if (hi->encoding == OBJ_ENCODING_HT) {
        // 得到下一个字典节点的地址
        if ((hi->de = dictNext(hi->di)) == NULL) return C_ERR;
    } else {
        serverPanic("Unknown hash encoding");
    }
    return C_OK;
}
```

#### 4.7 HSCAN命令

```java
// HSCAN key cursor [MATCH pattern] [COUNT count]
// HSCAN 命令实现
void hscanCommand(client *c) {
    robj *o;
    unsigned long cursor;
    // 获取scan命令的游标cursor
    if (parseScanCursorOrReply(c,c->argv[2],&cursor) == C_ERR) return;
    // 以写操作取出哈希对象，若失败，或取出的对象不是哈希类型的对象，则发送0后直接返回
    if ((o = lookupKeyReadOrReply(c,c->argv[1],shared.emptyscan)) == NULL ||
        checkType(c,o,OBJ_HASH)) return;
    // 调用底层实现
    scanGenericCommand(c,o,cursor);
}
```
