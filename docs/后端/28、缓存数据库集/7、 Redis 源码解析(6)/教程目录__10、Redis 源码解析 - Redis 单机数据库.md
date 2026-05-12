# 10、Redis 源码解析 - Redis 单机数据库
- 来源：https://ddkk.com/zhuanlan/db/redis/6/10.html
- 分类：缓存数据库
- 分组：教程目录
在[Redis 源码解析 - Redis 启动流程](/zhuanlan/db/redis/6/3.html)中，启动事件驱动框架之前，会初始化Server，中间有一步会初始化Redis的数据库：

```java
void initServer(void) {
	...
   for (j = 0; j < server.dbnum; j++) {
       server.db[j].dict = dictCreate(&dbDictType,NULL);
       server.db[j].expires = dictCreate(&keyptrDictType,NULL);
       server.db[j].blocking_keys = dictCreate(&keylistDictType,NULL);
       server.db[j].ready_keys = dictCreate(&objectKeyPointerValueDictType,NULL);
       server.db[j].watched_keys = dictCreate(&keylistDictType,NULL);
       server.db[j].id = j;
       server.db[j].avg_ttl = 0;
       server.db[j].defrag_later = listCreate();
    }
    ...
}
struct redisServer {
	...
	redisDb *db;
	...
};
```

db在redisServer中是个redisDb的数组，数组默认大小是16，通过select命令选择不同的db，db初始化之后，就可以存储用户命令发送的KV对了。

### redisDb

redisDb结构：

```java
typedef struct redisDb {
    dict *dict;                 /* The keyspace for this DB */
    dict *expires;              /* Timeout of keys with a timeout set */
    dict *blocking_keys;        /* Keys with clients waiting for data (BLPOP)*/
    dict *ready_keys;           /* Blocked keys that received a PUSH */
    dict *watched_keys;         /* WATCHED keys for MULTI/EXEC CAS */
    int id;                     /* Database ID */
    long long avg_ttl;          /* Average TTL, just for stats */
    list *defrag_later;         /* List of key names to attempt to defrag one by one, gradually. */
} redisDb;
```

本节先看dict、expires和id这三个字段，其他的几个在后面会详细介绍。

dict是db的存储空间，用来存储所有的KV对

expires用来存储所有待过期时间的KV对

id是该redisDb在redisServer的数组下标

### redisObject

dict中存储的key是sds，value是robj*，robj结构如下：

```java
typedef struct redisObject {
    unsigned type:4;
    unsigned encoding:4;
    unsigned lru:LRU_BITS; /* LRU time (relative to global lru_clock) or
                            * LFU data (least significant 8 bits frequency
                            * and most significant 16 bits access time). */
    int refcount;
    void *ptr;
} robj;
```

redisObject采用位域定义：

type：robj类型，也就是我们常说的五种：

```java
#define OBJ_STRING 0    /* String object. */
#define OBJ_LIST 1      /* List object. */
#define OBJ_SET 2       /* Set object. */
#define OBJ_ZSET 3      /* Sorted set object. */
#define OBJ_HASH 4      /* Hash object. */
```

encoding：robj编码方式，同一种类型会有不同的编码方式，五种基本类型对应的编码方式如下：

OBJ_STRING：OBJ_ENCODING_RAW、OBJ_ENCODING_INT、OBJ_ENCODING_EMBSTR

OBJ_LIST：OBJ_ENCODING_ZIPLIST、OBJ_ENCODING_QUICKLIST

OBJ_SET：OBJ_ENCODING_INTSET、OBJ_ENCODING_HT

OBJ_ZSET：OBJ_ENCODING_ZIPLIST、OBJ_ENCODING_SKIPLIST

OBJ_HASH：OBJ_ENCODING_ZIPMAP、OBJ_ENCODING_HT

```java
#define OBJ_ENCODING_RAW 0     /* Raw representation */
#define OBJ_ENCODING_INT 1     /* Encoded as integer */
#define OBJ_ENCODING_HT 2      /* Encoded as hash table */
#define OBJ_ENCODING_ZIPMAP 3  /* Encoded as zipmap */
#define OBJ_ENCODING_LINKEDLIST 4 /* No longer used: old list encoding. */
#define OBJ_ENCODING_ZIPLIST 5 /* Encoded as ziplist */
#define OBJ_ENCODING_INTSET 6  /* Encoded as intset */
#define OBJ_ENCODING_SKIPLIST 7  /* Encoded as skiplist */
#define OBJ_ENCODING_EMBSTR 8  /* Embedded sds string encoding */
#define OBJ_ENCODING_QUICKLIST 9 /* Encoded as linked list of ziplists */
#define OBJ_ENCODING_STREAM 10 /* Encoded as a radix tree of listpacks */
```

lru：24bit，为了支持键的淘汰，本节先不讲

refcount：robj的引用计数，控制robj的生命周期，当refcount减少到0时，就可以释放robj：

```java
void incrRefCount(robj *o) {
    if (o->refcount != OBJ_SHARED_REFCOUNT) o->refcount++;
}
void decrRefCount(robj *o) {
    if (o->refcount == 1) {
        switch(o->type) {
        case OBJ_STRING: freeStringObject(o); break;
        case OBJ_LIST: freeListObject(o); break;
        case OBJ_SET: freeSetObject(o); break;
        case OBJ_ZSET: freeZsetObject(o); break;
        case OBJ_HASH: freeHashObject(o); break;
        case OBJ_MODULE: freeModuleObject(o); break;
        case OBJ_STREAM: freeStreamObject(o); break;
        default: serverPanic("Unknown object type"); break;
        }
        zfree(o);
    } else {
        if (o->refcount <= 0) serverPanic("decrRefCount against refcount <= 0");
        if (o->refcount != OBJ_SHARED_REFCOUNT) o->refcount--;
    }
}
```

ptr：是一个void*指针，指向robj中的value

### 单机数据库的实现

redisDb相关的API实现都在db.c中，提供给各个命令的API使用，在[Redis 源码解析 - Redis 命令端到端的过程](/zhuanlan/db/redis/6/5.html)中，用户的命令会解析成token存在client中，然后查找到命令对应的处理函数之后，就会调用命令处理函数对db进行操作，下面就介绍五种基本类型的实现。

Redis所有的命令：https://www.redis.net.cn/order/。本节先介绍与数据库有关的命令，每个命令的处理函数可以参考server.c中的redisCommandTable命令数组。

#### 字符串命令实现

与字符串有关的命令实现在t_string.c中，这里解析两个：set、get，其他的命令实现都大差不差。

set:

```java
void setCommand(client *c) {
    int j;
    robj *expire = NULL;
    int unit = UNIT_SECONDS;
    int flags = OBJ_SET_NO_FLAGS;
	// 对set命令待的参数进行解析，比如nx、ex、px等key过期时间
    for (j = 3; j < c->argc; j++) {
        char *a = c->argv[j]->ptr;
        robj *next = (j == c->argc-1) ? NULL : c->argv[j+1];
        if ((a[0] == 'n' || a[0] == 'N') &&
            (a[1] == 'x' || a[1] == 'X') && a[2] == '\0' &&
            !(flags & OBJ_SET_XX))
        {
            flags |= OBJ_SET_NX;
        } else if ((a[0] == 'x' || a[0] == 'X') &&
                   (a[1] == 'x' || a[1] == 'X') && a[2] == '\0' &&
                   !(flags & OBJ_SET_NX))
        {
            flags |= OBJ_SET_XX;
        } else if ((a[0] == 'e' || a[0] == 'E') &&
                   (a[1] == 'x' || a[1] == 'X') && a[2] == '\0' &&
                   !(flags & OBJ_SET_PX) && next)
        {
            flags |= OBJ_SET_EX;
            unit = UNIT_SECONDS;
            expire = next;
            j++;
        } else if ((a[0] == 'p' || a[0] == 'P') &&
                   (a[1] == 'x' || a[1] == 'X') && a[2] == '\0' &&
                   !(flags & OBJ_SET_EX) && next)
        {
            flags |= OBJ_SET_PX;
            unit = UNIT_MILLISECONDS;
            expire = next;
            j++;
        } else {
            addReply(c,shared.syntaxerr);
            return;
        }
    }
    c->argv[2] = tryObjectEncoding(c->argv[2]);
    setGenericCommand(c,flags,c->argv[1],c->argv[2],expire,unit,NULL,NULL);
}
```

先对set命令携带的额外参数解析，主要是key的过期时间，然后调用tryObjectEncoding尝试对value进行编码，即设置robj中的encoding字段：

```java
robj *tryObjectEncoding(robj *o) {
	...
	// 尝试OBJ_ENCODING_INT编码
    if (len <= 20 && string2l(s,len,&value)) {
        /* This object is encodable as a long. Try to use a shared object.
         * Note that we avoid using shared integers when maxmemory is used
         * because every object needs to have a private LRU field for the LRU
         * algorithm to work well. */
        if ((server.maxmemory == 0 ||
            !(server.maxmemory_policy & MAXMEMORY_FLAG_NO_SHARED_INTEGERS)) &&
            value >= 0 &&
            value < OBJ_SHARED_INTEGERS)
        {
            decrRefCount(o);
            incrRefCount(shared.integers[value]);
            return shared.integers[value];
        } else {
            if (o->encoding == OBJ_ENCODING_RAW) {
                sdsfree(o->ptr);
                o->encoding = OBJ_ENCODING_INT;
                o->ptr = (void*) value;
                return o;
            } else if (o->encoding == OBJ_ENCODING_EMBSTR) {
                decrRefCount(o);
                return createStringObjectFromLongLongForValue(value);
            }
        }
    }
     /* If the string is small and is still RAW encoded,
     * try the EMBSTR encoding which is more efficient.
     * In this representation the object and the SDS string are allocated
     * in the same chunk of memory to save space and cache misses. */
     // 尝试OBJ_ENCODING_EMBSTR编码
    if (len <= OBJ_ENCODING_EMBSTR_SIZE_LIMIT) {
        robj *emb;
        if (o->encoding == OBJ_ENCODING_EMBSTR) return o;
        emb = createEmbeddedStringObject(s,sdslen(s));
        decrRefCount(o);
        return emb;
    }
    /* We can't encode the object...
     *
     * Do the last try, and at least optimize the SDS string inside
     * the string object to require little space, in case there
     * is more than 10% of free space at the end of the SDS string.
     *
     * We do that only for relatively large strings as this branch
     * is only entered if the length of the string is greater than
     * OBJ_ENCODING_EMBSTR_SIZE_LIMIT. */
    // 最后只能OBJ_ENCODING_RAW编码，但是最终再尝试压缩数据
    trimStringObjectIfNeeded(o);
    /* Return the original object. */
    return o;
}
```

从上面这段代码中，再次可以看出Redis对于内存的严格使用，OBJ_STRING类型的编码有三种：OBJ_ENCODING_RAW、OBJ_ENCODING_INT、OBJ_ENCODING_EMBSTR，这三种方式对于内存的需求是不一样的，OBJ_ENCODING_INT和OBJ_ENCODING_EMBSTR不需要额外的内存，OBJ_ENCODING_RAW需要一个void *指针的空间。

在tryObjectEncoding中，首先尝试编码为OBJ_ENCODING_INT，即如果value的长度<20并且可以转化为int类型，那么直接把void * ptr赋值为转化之后的整数值；然后如果value的长度不大，则编码为OBJ_ENCODING_EMBSTR，这样value的内存和robj的内存是连续的；最后才尝试OBJ_ENCODING_RAW编码，void* ptr指针value的真实地址，此时还会调用trimStringObjectIfNeeded尽可能的压缩value生成的sds内存。

最后调用setGenericCommand处理：

```java
void setGenericCommand(client *c, int flags, robj *key, robj *val, robj *expire, int unit, robj *ok_reply, robj *abort_reply) {
    long long milliseconds = 0; /* initialized to avoid any harmness warning */
	// 判断过期时间是否是整数
    if (expire) {
        if (getLongLongFromObjectOrReply(c, expire, &milliseconds, NULL) != C_OK)
            return;
        if (milliseconds <= 0) {
            addReplyErrorFormat(c,"invalid expire time in %s",c->cmd->name);
            return;
        }
        if (unit == UNIT_SECONDS) milliseconds *= 1000;
    }
	// 判断是否符合nx的要求
    if ((flags & OBJ_SET_NX && lookupKeyWrite(c->db,key) != NULL) ||
        (flags & OBJ_SET_XX && lookupKeyWrite(c->db,key) == NULL))
    {
        addReply(c, abort_reply ? abort_reply : shared.nullbulk);
        return;
    }
    // 设置KV对
    setKey(c->db,key,val);
    server.dirty++;
    // 如果有过期时间，则设置
    if (expire) setExpire(c,c->db,key,mstime()+milliseconds);
    notifyKeyspaceEvent(NOTIFY_STRING,"set",key,c->db->id);
    if (expire) notifyKeyspaceEvent(NOTIFY_GENERIC,
        "expire",key,c->db->id);
    // 回复客户端
    addReply(c, ok_reply ? ok_reply : shared.ok);
}
```

lookupKeyWrite用来判断key是否在db中已经存在，与之对应的还有一个lookupKeyRead，两者都用来查找key，但是lookupKeyWrite表示查找key之后，可能会对key更新，所以会尝试对key进行过期时间过滤。

接下来向db中添加key和value：如果key存在则覆盖原来的value，否则插入KV对

```java
void setKey(redisDb *db, robj *key, robj *val) {
    if (lookupKeyWrite(db,key) == NULL) {
        dbAdd(db,key,val);
    } else {
        dbOverwrite(db,key,val);
    }
    incrRefCount(val);
    removeExpire(db,key);
    signalModifiedKey(db,key);
}
```

最后如果设置了过期时间，则向redisDb的expires中插入key对应的过期时间。

这里有关函数notifyKeyspaceEvent，用来实现key空间操作的通知，在后面文章中再详细介绍

get:

```java
void getCommand(client *c) {
    getGenericCommand(c);
}
int getGenericCommand(client *c) {
    robj *o;
    if ((o = lookupKeyReadOrReply(c,c->argv[1],shared.nullbulk)) == NULL)
        return C_OK;
    if (o->type != OBJ_STRING) {
        addReply(c,shared.wrongtypeerr);
        return C_ERR;
    } else {
        addReplyBulk(c,o);
        return C_OK;
    }
}
```

get命令比较简单，先查询，如果查到了，并且类型是字符串，则返回成功，否则返回失败。

#### 列表(list)命令实现

与列表有关的命令实现都在t_list.c中，这里主要解析插入、删除、查找三类命令。

插入命令有：rpush、lpush、rpushx、lpushx、linsert、rpoplpush

```java
void lpushCommand(client *c) {
	// 头部插入
    pushGenericCommand(c,LIST_HEAD);
}
void rpushCommand(client *c) {
	// 尾部插入
    pushGenericCommand(c,LIST_TAIL);
}
void pushGenericCommand(client *c, int where) {
    int j, pushed = 0;
    // 判断key是否存在
    robj *lobj = lookupKeyWrite(c->db,c->argv[1]);
	// 如果key存在，判断key的类型是不是OBJ_LIST
    if (lobj && lobj->type != OBJ_LIST) {
        addReply(c,shared.wrongtypeerr);
        return;
    }
    for (j = 2; j < c->argc; j++) {
        if (!lobj) {
        	// 如果key不存在，则创建
            lobj = createQuicklistObject();
            quicklistSetOptions(lobj->ptr, server.list_max_ziplist_size,
                                server.list_compress_depth);
            dbAdd(c->db,c->argv[1],lobj);
        }
        // 最终调用quicklistPush向列表中插入元素
        listTypePush(lobj,c->argv[j],where);
        pushed++;
    }
    // 向用户返回列表总长度
    addReplyLongLong(c, (lobj ? listTypeLength(lobj) : 0));
    if (pushed) {
        char *event = (where == LIST_HEAD) ? "lpush" : "rpush";
        signalModifiedKey(c->db,c->argv[1]);
        notifyKeyspaceEvent(NOTIFY_LIST,event,c->argv[1],c->db->id);
    }
    server.dirty += pushed;
}
void linsertCommand(client *c) {
    int where;
    robj *subject;
    listTypeIterator *iter;
    listTypeEntry entry;
    int inserted = 0;
    if (strcasecmp(c->argv[2]->ptr,"after") == 0) {
        where = LIST_TAIL;
    } else if (strcasecmp(c->argv[2]->ptr,"before") == 0) {
        where = LIST_HEAD;
    } else {
        addReply(c,shared.syntaxerr);
        return;
    }
	// 先查找，没有key或者key的类型不对，就返回错误
    if ((subject = lookupKeyWriteOrReply(c,c->argv[1],shared.czero)) == NULL ||
        checkType(c,subject,OBJ_LIST)) return;
    /* Seek pivot from head to tail */
    // 寻找要插入的位置，找到就插入
    iter = listTypeInitIterator(subject,0,LIST_TAIL);
    while (listTypeNext(iter,&entry)) {
        if (listTypeEqual(&entry,c->argv[3])) {
            listTypeInsert(&entry,c->argv[4],where);
            inserted = 1;
            break;
        }
    }
    listTypeReleaseIterator(iter);
    if (inserted) {
        signalModifiedKey(c->db,c->argv[1]);
        notifyKeyspaceEvent(NOTIFY_LIST,"linsert",
                            c->argv[1],c->db->id);
        server.dirty++;
    } else {
        /* Notify client of a failed insert */
        addReply(c,shared.cnegone);
        return;
    }
    addReplyLongLong(c,listTypeLength(subject));
}
```

删除命令有：rpop、lpop、brpoplpush、blpop、blpush、lrem、ltrim

```java
void lpopCommand(client *c) {
	// 头部删除
    popGenericCommand(c,LIST_HEAD);
}
void rpopCommand(client *c) {
	// 尾部删除
    popGenericCommand(c,LIST_TAIL);
}
void popGenericCommand(client *c, int where) {
	// 查找key并判断key类型
    robj *o = lookupKeyWriteOrReply(c,c->argv[1],shared.nullbulk);
    if (o == NULL || checkType(c,o,OBJ_LIST)) return;
    robj *value = listTypePop(o,where);
    if (value == NULL) {
    	// list中没有元素，则错误返回
        addReply(c,shared.nullbulk);
    } else {
        char *event = (where == LIST_HEAD) ? "lpop" : "rpop";
        addReplyBulk(c,value);
        decrRefCount(value);
        notifyKeyspaceEvent(NOTIFY_LIST,event,c->argv[1],c->db->id);
        // 删除元素后，如果列表为空，则删除列表，释放内存
        if (listTypeLength(o) == 0) {
            notifyKeyspaceEvent(NOTIFY_GENERIC,"del",
                                c->argv[1],c->db->id);
            dbDelete(c->db,c->argv[1]);
        }
        signalModifiedKey(c->db,c->argv[1]);
        server.dirty++;
    }
}
```

查询命令有：lindex

```java
void lindexCommand(client *c) {
	// 查找key并判断key类型
    robj *o = lookupKeyReadOrReply(c,c->argv[1],shared.nullbulk);
    if (o == NULL || checkType(c,o,OBJ_LIST)) return;
    long index;
    robj *value = NULL;
    if ((getLongFromObjectOrReply(c, c->argv[2], &index, NULL) != C_OK))
        return;
    if (o->encoding == OBJ_ENCODING_QUICKLIST) {
        quicklistEntry entry;
        // 通过qucklist的api查找指定位置的元素
        if (quicklistIndex(o->ptr, index, &entry)) {
            if (entry.value) {
                value = createStringObject((char*)entry.value,entry.sz);
            } else {
                value = createStringObjectFromLongLong(entry.longval);
            }
            addReplyBulk(c,value);
            decrRefCount(value);
        } else {
            addReply(c,shared.nullbulk);
        }
    } else {
        serverPanic("Unknown list encoding");
    }
}
```

#### 哈希(hash)命令实现

hash命令的实现在t_hash.c中，hash的底层编码有两种OBJ_ENCODING_ZIPLIST、OBJ_ENCODING_HT，实现相对来说复杂点，这里看看hset、hget、hdel三个命令的实现。

hset:

```java
void hsetCommand(client *c) {
    int i, created = 0;
    robj *o;
    if ((c->argc % 2) == 1) {
        addReplyError(c,"wrong number of arguments for HMSET");
        return;
    }
	// 查找key，没有就新建
    if ((o = hashTypeLookupWriteOrCreate(c,c->argv[1])) == NULL) return;
    // 尝试转化hash底层的编码方式
    hashTypeTryConversion(o,c->argv,2,c->argc-1);
	// 逐一设置hash中对应field的value
    for (i = 2; i < c->argc; i += 2)
        created += !hashTypeSet(o,c->argv[i]->ptr,c->argv[i+1]->ptr,HASH_SET_COPY);
    /* HMSET (deprecated) and HSET return value is different. */
    char *cmdname = c->argv[0]->ptr;
    if (cmdname[1] == 's' || cmdname[1] == 'S') {
        /* HSET */
        addReplyLongLong(c, created);
    } else {
        /* HMSET */
        addReply(c, shared.ok);
    }
    signalModifiedKey(c->db,c->argv[1]);
    notifyKeyspaceEvent(NOTIFY_HASH,"hset",c->argv[1],c->db->id);
    server.dirty++;
}
```

hashTypeTryConversion函数尝试进行底层编码转化，hash新建时，为了节省内存，底层编码方式为OBJ_ENCODING_ZIPLIST，随着内部KV的添加，在达到一定条件时，会转化为OBJ_ENCODING_HT，这个条件如下：1、filed所对应的value的字符串长度达到一定阈值；2、ziplist中元素个数达到一定阈值。

来看下编码转化的实现：

```java
void hashTypeConvert(robj *o, int enc) {
    if (o->encoding == OBJ_ENCODING_ZIPLIST) {
    	// 只有OBJ_ENCODING_ZIPLIST才能转化成OBJ_ENCODING_HT
        hashTypeConvertZiplist(o, enc);
    } else if (o->encoding == OBJ_ENCODING_HT) {
        serverPanic("Not implemented");
    } else {
        serverPanic("Unknown hash encoding");
    }
}
void hashTypeConvertZiplist(robj *o, int enc) {
    serverAssert(o->encoding == OBJ_ENCODING_ZIPLIST);
    if (enc == OBJ_ENCODING_ZIPLIST) {
        /* Nothing to do... */
    } else if (enc == OBJ_ENCODING_HT) {
        hashTypeIterator *hi;
        dict *dict;
        int ret;
		// 创建ziplist的迭代器
        hi = hashTypeInitIterator(o);
        // 创建编码方式为OBJ_ENCODING_HT的dict
        dict = dictCreate(&hashDictType, NULL);
		// 逐个KV迭代
        while (hashTypeNext(hi) != C_ERR) {
            sds key, value;
            key = hashTypeCurrentObjectNewSds(hi,OBJ_HASH_KEY);
            value = hashTypeCurrentObjectNewSds(hi,OBJ_HASH_VALUE);
            // 将ziplist中的KV对添加到dict中
            ret = dictAdd(dict, key, value);
            if (ret != DICT_OK) {
                serverLogHexDump(LL_WARNING,"ziplist with dup elements dump",
                    o->ptr,ziplistBlobLen(o->ptr));
                serverPanic("Ziplist corruption detected");
            }
        }
        hashTypeReleaseIterator(hi);
        zfree(o->ptr);
        // 最后更改编码方式，设置新的指针指向
        o->encoding = OBJ_ENCODING_HT;
        o->ptr = dict;
    } else {
        serverPanic("Unknown hash encoding");
    }
}
```

hashTypeSet函数用来向hash设置KV，也是根据编码类型做不同的操作，如果最初编码是OBJ_ENCODING_ZIPLIST，那么插入KV对之后，尝试更改底层编码方式

```java
int hashTypeSet(robj *o, sds field, sds value, int flags) {
	if (o->encoding == OBJ_ENCODING_ZIPLIST) {
		...
		/* Check if the ziplist needs to be converted to a hash table */
		// 尝试更改底层编码
        if (hashTypeLength(o) > server.hash_max_ziplist_entries)
            hashTypeConvert(o, OBJ_ENCODING_HT);
	} else if (o->encoding == OBJ_ENCODING_HT) {
	}
}
```

hget: 根据编码类型做响应的查找操作

```java
void hgetCommand(client *c) {
    robj *o;
    if ((o = lookupKeyReadOrReply(c,c->argv[1],shared.nullbulk)) == NULL ||
        checkType(c,o,OBJ_HASH)) return;
    addHashFieldToReply(c, o, c->argv[2]->ptr);
}
static void addHashFieldToReply(client *c, robj *o, sds field) {
    int ret;
    if (o == NULL) {
        addReply(c, shared.nullbulk);
        return;
    }
    if (o->encoding == OBJ_ENCODING_ZIPLIST) {
    	...
    } else if (o->encoding == OBJ_ENCODING_HT) {
       ...
    } else {
        serverPanic("Unknown hash encoding");
    }
}
```

hdel: 根据编码类型做响应的删除操作：

```java
void hdelCommand(client *c) {
    robj *o;
    int j, deleted = 0, keyremoved = 0;
	// 查找key，并判断key类型
    if ((o = lookupKeyWriteOrReply(c,c->argv[1],shared.czero)) == NULL ||
        checkType(c,o,OBJ_HASH)) return;
    for (j = 2; j < c->argc; j++) {
    	// 根据编码类型做删除操作
        if (hashTypeDelete(o,c->argv[j]->ptr)) {
            deleted++;
            if (hashTypeLength(o) == 0) {
                dbDelete(c->db,c->argv[1]);
                keyremoved = 1;
                break;
            }
        }
    }
    if (deleted) {
        signalModifiedKey(c->db,c->argv[1]);
        notifyKeyspaceEvent(NOTIFY_HASH,"hdel",c->argv[1],c->db->id);
        if (keyremoved)
            notifyKeyspaceEvent(NOTIFY_GENERIC,"del",c->argv[1],
                                c->db->id);
        server.dirty += deleted;
    }
    addReplyLongLong(c,deleted);
}
```

#### 集合(set)命令实现

set命令的实现在t_set.c中，set的底层编码方式有两种：OBJ_ENCODING_INTSET、OBJ_ENCODING_HT，其中OBJ_ENCODING_INTSET的底层实现是intset

set添加saddCommand：

```java
void saddCommand(client *c) {
    robj *set;
    int j, added = 0;
	// 查找key，没有则创建
    set = lookupKeyWrite(c->db,c->argv[1]);
    if (set == NULL) {
        set = setTypeCreate(c->argv[2]->ptr);
        dbAdd(c->db,c->argv[1],set);
    } else {
        if (set->type != OBJ_SET) {
            addReply(c,shared.wrongtypeerr);
            return;
        }
    }
	// 插入元素
    for (j = 2; j < c->argc; j++) {
        if (setTypeAdd(set,c->argv[j]->ptr)) added++;
    }
    if (added) {
        signalModifiedKey(c->db,c->argv[1]);
        notifyKeyspaceEvent(NOTIFY_SET,"sadd",c->argv[1],c->db->id);
    }
    server.dirty += added;
    addReplyLongLong(c,added);
}
```

插入元素时，如果1、待插入的元素不能编码为整数；2、intset的元素个数超过阈值，就会将set的底层编码从OBJ_ENCODING_INTSET转化为OBJ_ENCODING_HT，下面是转化条件：

```java
int setTypeAdd(robj *subject, sds value) {
    long long llval;
    if (subject->encoding == OBJ_ENCODING_HT) {
        dict *ht = subject->ptr;
        dictEntry *de = dictAddRaw(ht,value,NULL);
        if (de) {
            dictSetKey(ht,de,sdsdup(value));
            dictSetVal(ht,de,NULL);
            return 1;
        }
    } else if (subject->encoding == OBJ_ENCODING_INTSET) {
        if (isSdsRepresentableAsLongLong(value,&llval) == C_OK) {
   			// value可以被编码为整数
            uint8_t success = 0;
            subject->ptr = intsetAdd(subject->ptr,llval,&success);
            if (success) {
                /* Convert to regular set when the intset contains
                 * too many entries. */
                if (intsetLen(subject->ptr) > server.set_max_intset_entries)
                	// intset大小超过阈值
                    setTypeConvert(subject,OBJ_ENCODING_HT);
                return 1;
            }
        } else {
            /* Failed to get integer from object, convert to regular set. */
            setTypeConvert(subject,OBJ_ENCODING_HT);
            /* The set *was* an intset and this value is not integer
             * encodable, so dictAdd should always work. */
            serverAssert(dictAdd(subject->ptr,sdsdup(value),NULL) == DICT_OK);
            return 1;
        }
    } else {
        serverPanic("Unknown set encoding");
    }
    return 0;
}
```

删除元素的过程也很简单，先查找key，在调用intset或者dict的api逐一删除元数：

```java
void sremCommand(client *c) {
    robj *set;
    int j, deleted = 0, keyremoved = 0;
    if ((set = lookupKeyWriteOrReply(c,c->argv[1],shared.czero)) == NULL ||
        checkType(c,set,OBJ_SET)) return;
    for (j = 2; j < c->argc; j++) {
        if (setTypeRemove(set,c->argv[j]->ptr)) {
            deleted++;
            if (setTypeSize(set) == 0) {
                dbDelete(c->db,c->argv[1]);
                keyremoved = 1;
                break;
            }
        }
    }
    if (deleted) {
        signalModifiedKey(c->db,c->argv[1]);
        notifyKeyspaceEvent(NOTIFY_SET,"srem",c->argv[1],c->db->id);
        if (keyremoved)
            notifyKeyspaceEvent(NOTIFY_GENERIC,"del",c->argv[1],
                                c->db->id);
        server.dirty += deleted;
    }
    addReplyLongLong(c,deleted);
}
```

#### 有序集合（sorted set）命令

有序集合的实现都在t_zset.c中，sorted set的底层编码有OBJ_ENCODING_ZIPLIST、OBJ_ENCODING_SKIPLIST两种

zadd同样先查找key，不存在则创建，然后调用ziplist或者skiplist中的API逐一向key中添加元素，中间达到阈值时，转化底层编码方式

```java
void zaddGenericCommand(client *c, int flags) {
	...
	/* Lookup the key and create the sorted set if does not exist. */
	// 查找key，不存在则创建
    zobj = lookupKeyWrite(c->db,key);
    if (zobj == NULL) {
        if (xx) goto reply_to_client; /* No key + XX option: nothing to do. */
        if (server.zset_max_ziplist_entries == 0 ||
            server.zset_max_ziplist_value < sdslen(c->argv[scoreidx+1]->ptr))
        {
            zobj = createZsetObject();
        } else {
            zobj = createZsetZiplistObject();
        }
        dbAdd(c->db,key,zobj);
    } else {
        if (zobj->type != OBJ_ZSET) {
            addReply(c,shared.wrongtypeerr);
            goto cleanup;
        }
    }
	// 逐个插入元素
    for (j = 0; j < elements; j++) {
        double newscore;
        score = scores[j];
        int retflags = flags;
        ele = c->argv[scoreidx+1+j*2]->ptr;
        int retval = zsetAdd(zobj, score, ele, &retflags, &newscore);
        if (retval == 0) {
            addReplyError(c,nanerr);
            goto cleanup;
        }
        if (retflags & ZADD_ADDED) added++;
        if (retflags & ZADD_UPDATED) updated++;
        if (!(retflags & ZADD_NOP)) processed++;
        score = newscore;
    }
    server.dirty += (added+updated);
    ...
}
```

zrem、zremrangebyscore、zremrangebyrank等删除命令也类似
