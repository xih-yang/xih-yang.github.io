# 19、Redis 源码解析 - Redis 数据类型源代码，学习总结
- 来源：https://ddkk.com/zhuanlan/db/redis/5/19.html
- 分类：缓存数据库
- 分组：教程目录
经过将近半个月的学习，终于将五种数据类型的源代码都学习了一遍，虽然不是全部阅读，但是大部分的代码都已经学习到了，趁五一假期好好整理和总结一下近期我们学习的内容。

### 1 数据类型介绍

在Redis中有五种数据类型，分别是字符串、列表、集合、有序集合、哈希，在源代码 redis.h 头文件中，有对应他们的常量定义，每次判断对象类型的时候会使用到这几个常量。

```java
/* Object types */
#define REDIS_STRING 0
#define REDIS_LIST 1
#define REDIS_SET 2
#define REDIS_ZSET 3
#define REDIS_HASH 4
```

Redis中，对应五种的数据类型的源代码有五个文件，分别是：

- t_string.c => 字符串
- t_list.c => 列表
- t_set.c => 集合
- t_zset.c => 有序集合
- t_hash.c => 哈希

### 2 redisObject

#### 2.1 代码回顾

这几天我们学习源代码的时候能经常碰到 redisObject 这个东西，在代码中常常是使用 robj 这个名称来表示一个redisObject，下面选一些代码片段来回忆一下。

```java
robj *expire = NULL;
robj *next = (j == c->argc-1) ? NULL : c->argv[j+1];
robj *o;
robj *o, *new, *aux;
robj *key = lookupKeyWrite(c->db, c->argv[1]);
robj *value = listTypePop(o,where);
```

#### 2.2 结构体定义

在代码里随便一搜就能找到很多使用 robj 的地方，说明redisObject使用的非常多，接下来看下他的结构体定义都有些啥。

```java
/* A redis object, that is a type able to hold a string / list / set */
//一个redis object,可以保存字符串、列表、集合等数据。
/* The actual Redis Object */
#define REDIS_LRU_BITS 24
#define REDIS_LRU_CLOCK_MAX ((1<<REDIS_LRU_BITS)-1) /* Max value of obj->lru */
#define REDIS_LRU_CLOCK_RESOLUTION 1000 /* LRU clock resolution in ms */
typedef struct redisObject {
    unsigned type:4;
    unsigned encoding:4;
    unsigned lru:REDIS_LRU_BITS; /* lru time (relative to server.lruclock) */
    int refcount;
    void *ptr;
} robj;
```

可以发现 redisObject 的属性并不多，分别是：

- type ：数据类型
- encoding：数据编码
- lru：最近访问时间
- refcount：对象引用数量
- *ptr：值的指针

这五个属性除了lru,我们还没有遇到过，其他几个属性在以往我们学习的代码中，其实有遇到过很多次，下面找几段代码来回忆。

#### 2.3 type 属性实例

```java
   
   robj *o;
    if ((o = lookupKeyReadOrReply(c,c->argv[1],shared.nullbulk)) == NULL)
        return REDIS_OK;
    if (o->type != REDIS_STRING) {
        addReply(c,shared.wrongtypeerr);
        return REDIS_ERR;
    } 
```

这一段代码先是获取一个 redisObject，然后通过访问这个结构体的 type 属性，用来判断对象类型是否为字符串，现在我们了解了 redisObject 的内部构造之后，再来看这一段代码就十分清楚，他在做什么。

redisObject 的 type属性是用来保存一个redis对象的数据类型，常量值就是上面我们说过的那几个值。

#### 2.3 encoding 属性实例

```java
void listTypeTryConversion(robj *subject, robj *value) {
    if (subject->encoding != REDIS_ENCODING_ZIPLIST) return;
    if (sdsEncodedObject(value) &&
        sdslen(value->ptr) > server.list_max_ziplist_value)
            listTypeConvert(subject,REDIS_ENCODING_LINKEDLIST);
}
```

这一段代码通过传入的 robj类型的 subject，获取这个结构体的 encoding 属性，来判断他的对象编码是否压缩表，因为一个数据类型可能会使用不同的数据编码来实现，比如列表可以使用压缩表或者链表，对象编码常量也定义在redis.h中。

```java
/* Objects encoding. Some kind of objects like Strings and Hashes can be
 * internally represented in multiple ways. The 'encoding' field of the object
 * is set to one of this fields for this object. */
#define REDIS_ENCODING_RAW 0     /* Raw representation */
#define REDIS_ENCODING_INT 1     /* Encoded as integer */
#define REDIS_ENCODING_HT 2      /* Encoded as hash table */
#define REDIS_ENCODING_ZIPMAP 3  /* Encoded as zipmap */
#define REDIS_ENCODING_LINKEDLIST 4 /* Encoded as regular linked list */
#define REDIS_ENCODING_ZIPLIST 5 /* Encoded as ziplist */
#define REDIS_ENCODING_INTSET 6  /* Encoded as intset */
#define REDIS_ENCODING_SKIPLIST 7  /* Encoded as skiplist */
#define REDIS_ENCODING_EMBSTR 8  /* Embedded sds string encoding */
```

#### 2.4 refcount 属性实例

```java
	//t_string.c
    o = lookupKeyWrite(c->db,c->argv[1]);
    if (o == NULL) {
        /* Create the key */
        c->argv[2] = tryObjectEncoding(c->argv[2]);
        dbAdd(c->db,c->argv[1],c->argv[2]);
        incrRefCount(c->argv[2]);
        totlen = stringObjectLen(c->argv[2]);
	}
	//object.c
	void incrRefCount(robj *o) {
    	o->refcount++;
    }
}
```

这一段代码使用 incrRefCount 增加 引用值，这个方法里的代码很简单就直接对 这个结构体的 refcount 属性进行自增。

#### 2.5 ptr 实例

```java
	//t_string.c
	sds value = c->argv[3]->ptr;
	//t_list.c
	ln = listIndex(o->ptr,start);
	//t_hash.c
	zl = o->ptr;
```

从不同几个源代码文件里找了几个片段，可以看到不同数据类型的ptr指针代表的是不同的东西，是指向他们真正的数据的指针。

### 3 数据结构

#### 3.1 对应关系

学习完五种数据类型的代码我们可以发现，他们的编码属性可以是多种可能，下面看下他们都对应着哪些编码类型。

type
encoding

REDIS_STRING
REDIS_ENCODING_RAW 、REDIS_ENCODING_EMBSTR 、REDIS_ENCODING_INT

REDIS_LIST
REDIS_ENCODING_ZIPLIST 、REDIS_ENCODING_LINKEDLIST

REDIS_HASH
REDIS_ENCODING_ZIPLIST 、REDIS_ENCODING_HT

REDIS_SET
REDIS_ENCODING_INTSET 、REDIS_ENCODING_HT

REDIS_ZSET
REDIS_ENCODING_ZIPLIST 、REDIS_ENCODING_SKIPLIST

type 与 encoding之间的关系，肯能一时看过去比较复杂，但其实也没有必要尝试去硬记住他们，因为只有理解了他们才能更好的知道为什么是这样，而不是单纯地记他们是这样的。

#### 3.2 encoding 转换

一个数据类型如果使用了多种数据类型，那一般都会有一个默认的数据类型，并且在新增的时候一般都会判断是否要转换数据类型。

```java
void listTypeTryConversion(robj *subject, robj *value) {
    if (subject->encoding != REDIS_ENCODING_ZIPLIST) return;
    if (sdsEncodedObject(value) &&
        sdslen(value->ptr) > server.list_max_ziplist_value)
            listTypeConvert(subject,REDIS_ENCODING_LINKEDLIST);
}
```

比如上面一个代码片段，如果值的长度超过压缩表的相关配置，那么就会进行数据结构的转换，这些配置定义在redis.h中。

```java
#define REDIS_HASH_MAX_ZIPLIST_ENTRIES 512
#define REDIS_HASH_MAX_ZIPLIST_VALUE 64
#define REDIS_LIST_MAX_ZIPLIST_ENTRIES 512
#define REDIS_LIST_MAX_ZIPLIST_VALUE 64
#define REDIS_SET_MAX_INTSET_ENTRIES 512
#define REDIS_ZSET_MAX_ZIPLIST_ENTRIES 128
#define REDIS_ZSET_MAX_ZIPLIST_VALUE 64
```

### 4 方法与命名

很多代码中的方法命名都有规律，通过了解这些规律我们能大概知道这些方法是干什么的，增加阅读代码的速度。

#### 4.1 包含 Command的方法

方法名出现Command的方法，代表这是一个命令方法，并且Commnd前面的部分就是命令本身，比如:

```java
	void setCommand(redisClient *c)
	void setnxCommand(redisClient *c)
	void setexCommand(redisClient *c)
	void lpushCommand(redisClient *c)
	void rpushCommand(redisClient *c)
```

#### 4.2 包含 Generic 的方法

方法名出现Generic的方法，代表这是一个通用方法，会被多个方法调用，比如:

```java
void setnxCommand(redisClient *c) {
    c->argv[2] = tryObjectEncoding(c->argv[2]);
    setGenericCommand(c,REDIS_SET_NX,c->argv[1],c->argv[2],NULL,0,shared.cone,shared.czero);
}
void setexCommand(redisClient *c) {
    c->argv[3] = tryObjectEncoding(c->argv[3]);
    setGenericCommand(c,REDIS_SET_NO_FLAGS,c->argv[1],c->argv[3],c->argv[2],UNIT_SECONDS,NULL,NULL);
}
void psetexCommand(redisClient *c) {
    c->argv[3] = tryObjectEncoding(c->argv[3]);
    setGenericCommand(c,REDIS_SET_NO_FLAGS,c->argv[1],c->argv[3],c->argv[2],UNIT_MILLISECONDS,NULL,NULL);
}
```

上面代码中 setnxCommand、setexCommand、psetexCommand 都调用了 setGenericCommand 这个方法。

```java
void lpushCommand(redisClient *c) {
    pushGenericCommand(c,REDIS_HEAD);
}
void rpushCommand(redisClient *c) {
    pushGenericCommand(c,REDIS_TAIL);
}
```

上面代码中 lpushCommand、rpushCommand 都调用了 pushGenericCommand 这个方法。

#### 4.3 包含 Type 的方法

```java
void listTypeInsert(listTypeEntry *entry, robj *value, int where)
robj *listTypeGet(listTypeEntry *entry)
int listTypeNext(listTypeIterator *li, listTypeEntry *entry)
void hashTypeTryObjectEncoding(robj *subject, robj **o1, robj **o2)
void hashTypeTryConversion(robj *o, robj **argv, int start, int end)
unsigned long setTypeSize(robj *subject)
int setTypeIsMember(robj *subject, robj *value)
```

除了t_string.c，其他的几个源代码中，都很明显的把方法分成两大类，一类是API，一类是Command，这种一般带Type的方法都是属于API一类的，带Command的是属于Command一类的，而且一般都是Command方法来调用这些Type的方法。

#### 4.4 包含 addReply 的方法

方法名出现 addReply 的方法，代表这是响应客户端的方法，比如:

```java
 	addReply(c, abort_reply ? abort_reply : shared.nullbulk);
	addReplyLongLong(c,olen);
	addReplyBulk(c,o);
	addReplyError(c,"offset is out of range");
	addReplyErrorFormat(c,"invalid expire time in %s",c->cmd->name);
	addReplyBulkCBuffer(c,(char*)str+start,end-start+1);
	addReplyMultiBulkLen(c,c->argc-1);
	...
```

在redis代码中，出现大量这种包含 addReply 的方法，虽然他们都是响应客户端，但是有很多变种的方法，他们定义在networking.c文件中，后续等我们学习到了再详细研究，这里暂且知道他们是用来响应客户端的就可以，就是我们平常输入命令得到的结果。

#### 4.5 包含 lookupKey 的方法

方法名出现 lookupKey 的方法，代表查询某个键的redis对象的方法，比如:

```java
o = lookupKeyWrite(c->db,c->argv[1]);
robj *o = lookupKeyRead(c->db,c->argv[j]);
o = lookupKeyReadOrReply(c,c->argv[1],shared.emptybulk)
```

在redis代码中，出现大量这种包含 lookupKey 的方法，通过名称大概能知道是查询键的意思，他们集中定义在 db.c 文件当中，后续我们回详细研究，目前先暂且知道他们是根据某个键值查询redis对象的就可以，通常传入的参数都是客户端或者db和键值。

### 5 redisClient

在很多Command方法的参数中，我们能够看到 redisClient 这个结构体的熟客，现在就稍微简单的了解一下它，要不然总是会感到很陌生，它的结构体定义在 redis.h 中。

#### 5.1 结构体定义

```java
/* With multiplexing we need to take per-client state.
 * Clients are taken in a linked list. */
typedef struct redisClient {
    uint64_t id;            /* Client incremental unique ID. */
    int fd;
    redisDb *db;
    int dictid;
    robj *name;             /* As set by CLIENT SETNAME */
    sds querybuf;
    size_t querybuf_peak;   /* Recent (100ms or more) peak of querybuf size */
    int argc;
    robj **argv;
    struct redisCommand *cmd, *lastcmd;
    int reqtype;
    int multibulklen;       /* number of multi bulk arguments left to read */
    long bulklen;           /* length of bulk argument in multi bulk request */
    list *reply;
    unsigned long reply_bytes; /* Tot bytes of objects in reply list */
    int sentlen;            /* Amount of bytes already sent in the current
                               buffer or object being sent. */
    time_t ctime;           /* Client creation time */
    time_t lastinteraction; /* time of the last interaction, used for timeout */
    time_t obuf_soft_limit_reached_time;
    int flags;              /* REDIS_SLAVE | REDIS_MONITOR | REDIS_MULTI ... */
    int authenticated;      /* when requirepass is non-NULL */
    int replstate;          /* replication state if this is a slave */
    int repl_put_online_on_ack; /* Install slave write handler on ACK. */
    int repldbfd;           /* replication DB file descriptor */
    off_t repldboff;        /* replication DB file offset */
    off_t repldbsize;       /* replication DB file size */
    sds replpreamble;       /* replication DB preamble. */
    long long reploff;      /* replication offset if this is our master */
    long long repl_ack_off; /* replication ack offset, if this is a slave */
    long long repl_ack_time;/* replication ack time, if this is a slave */
    long long psync_initial_offset; /* FULLRESYNC reply offset other slaves
                                       copying this slave output buffer
                                       should use. */
    char replrunid[REDIS_RUN_ID_SIZE+1]; /* master run id if this is a master */
    int slave_listening_port; /* As configured with: SLAVECONF listening-port */
    int slave_capa;         /* Slave capabilities: SLAVE_CAPA_* bitwise OR. */
    multiState mstate;      /* MULTI/EXEC state */
    int btype;              /* Type of blocking op if REDIS_BLOCKED. */
    blockingState bpop;     /* blocking state */
    long long woff;         /* Last write global replication offset. */
    list *watched_keys;     /* Keys WATCHED for MULTI/EXEC CAS */
    dict *pubsub_channels;  /* channels a client is interested in (SUBSCRIBE) */
    list *pubsub_patterns;  /* patterns a client is interested in (SUBSCRIBE) */
    sds peerid;             /* Cached peer ID. */
    /* Response buffer */
    int bufpos;
    char buf[REDIS_REPLY_CHUNK_BYTES];
} redisClient;
```

乍一看，我的天怎么这么多属性，感到害怕，不要惊慌也不要害怕，我们这里先简单了解下两个我们经常碰到的属性就可以，它们分别是argv、argc。

argv 用来保存客户端输入的所有参数，包括命令本身。

argc 用来保存参数的数量。

#### 5.2 代码实例

下面来看一些代码实例加深一下印象。

```java
	//获取第二个参数，一般是键值
	o = lookupKeyWrite(c->db,c->argv[1]);
	//获取第三个参数
	getLongLongFromObjectOrReply(c,c->argv[2],&start,NULL)
	//获取第四个参数
	getLongLongFromObjectOrReply(c,c->argv[3],&end,NULL)
	//从第二个参数遍历所有的参数
    for (j = 1; j < c->argc; j++) {
            robj *o = lookupKeyRead(c->db,c->argv[j]);
        if (o == NULL) {
            addReply(c,shared.nullbulk);
        } else {
            if (o->type != REDIS_STRING) {
                addReply(c,shared.nullbulk);
            } else {
                addReplyBulk(c,o);
            }
        }
    }
```

### 6 事件通知

在很多方法的结尾，我们能看到 notifyKeyspaceEvent 这个方法，这个方法定义在notify.c文件中，主要功能就是做一个事件通知，告知客户端一些信息，等到后面学习这个文件的时候我们再详细研究，这里先看下我们学习的几个文件都做了哪些通知。

#### 6.1 t_string.c

```java
	notifyKeyspaceEvent(REDIS_NOTIFY_STRING,"set",key,c->db->id);
	notifyKeyspaceEvent(REDIS_NOTIFY_STRING,"setrange",c->argv[1],c->db->id);
	notifyKeyspaceEvent(REDIS_NOTIFY_STRING,"incrby",c->argv[1],c->db->id);
	notifyKeyspaceEvent(REDIS_NOTIFY_STRING,"incrbyfloat",c->argv[1],c->db->id);
	notifyKeyspaceEvent(REDIS_NOTIFY_STRING,"append",c->argv[1],c->db->id);
	notifyKeyspaceEvent(REDIS_NOTIFY_GENERIC, "expire",key,c->db->id);
```

#### 6.2 t_list.c

```java
	char *event = (where == REDIS_HEAD) ? "lpush" : "rpush";
	notifyKeyspaceEvent(REDIS_NOTIFY_LIST,event,c->argv[1],c->db->id);
	char *event = (where == REDIS_HEAD) ? "lpop" : "rpop";
	notifyKeyspaceEvent(REDIS_NOTIFY_LIST,event,c->argv[1],c->db->id);
	notifyKeyspaceEvent(REDIS_NOTIFY_LIST,"linsert", c->argv[1],c->db->id);
	notifyKeyspaceEvent(REDIS_NOTIFY_LIST,"lset",c->argv[1],c->db->id);
	notifyKeyspaceEvent(REDIS_NOTIFY_LIST,"ltrim",c->argv[1],c->db->id);
	notifyKeyspaceEvent(REDIS_NOTIFY_LIST,"lpush",dstkey,c->db->id);
	notifyKeyspaceEvent(REDIS_NOTIFY_LIST,"rpop",touchedkey,c->db->id);
	//这里的类型其实是有问题的，讲道理应该是REDIS_NOTIFY_LIST。
	//为了验证猜想，特意去看了6.0版本的代码，发现6.0版本果然还是改成了LIST。
	notifyKeyspaceEvent(REDIS_NOTIFY_GENERIC,"lrem",c->argv[1],c->db->id);
	notifyKeyspaceEvent(REDIS_NOTIFY_GENERIC,"del",c->argv[1],c->db->id);
```

#### 6.3 t_hash.c

```java
	notifyKeyspaceEvent(REDIS_NOTIFY_HASH,"hset",c->argv[1],c->db->id);
	notifyKeyspaceEvent(REDIS_NOTIFY_HASH,"hincrby",c->argv[1],c->db->id);
	notifyKeyspaceEvent(REDIS_NOTIFY_HASH,"hincrbyfloat",c->argv[1],c->db->id);
	notifyKeyspaceEvent(REDIS_NOTIFY_HASH,"hdel",c->argv[1],c->db->id);
```

#### 6.4 t_set.c

```java
	notifyKeyspaceEvent(REDIS_NOTIFY_SET,"sadd",c->argv[1],c->db->id);
	notifyKeyspaceEvent(REDIS_NOTIFY_SET,"srem",c->argv[1],c->db->id);
	notifyKeyspaceEvent(REDIS_NOTIFY_SET,"spop",c->argv[1],c->db->id);
	notifyKeyspaceEvent(REDIS_NOTIFY_SET,"sinterstore",dstkey,c->db->id);
```

#### 6.5 t_zset.c

```java
	
	notifyKeyspaceEvent(REDIS_NOTIFY_ZSET,incr ? "zincr" : "zadd", key, c->db->id);
	notifyKeyspaceEvent(REDIS_NOTIFY_ZSET,"zrem",key,c->db->id);
	char *event[3] = {
     "zremrangebyrank","zremrangebyscore","zremrangebylex"};
	notifyKeyspaceEvent(REDIS_NOTIFY_ZSET,event[rangetype],key,c->db->id);
	notifyKeyspaceEvent(REDIS_NOTIFY_ZSET,
            (op == REDIS_OP_UNION) ? "zunionstore" : "zinterstore",
            dstkey,c->db->id);
```

#### 6.6 总结

**1、** notifyKeyspaceEvent传入的参数有类型、事件名称、键值、数据库id；

**2、** notifyKeyspaceEvent顾名思义是键空间事件，在根据传入的参数，可以推测出是针对某个键的操作的通知；

**3、** 一般能触发事件通知的都是一些增删改的操作；

**4、** 不同的数据类型事件通知，传入的第一个类型参数是不同的；

**5、** 通用的命令操作，传入的类型参数是REDIS_NOTIFY_GENERIC，事件有del、expire；

### 7 通用逻辑流程

经过一系列源代码的阅读，其实我们是能够总结出一个方法的通用逻辑流程，基本上大部分的方法都按照这个逻辑流程处理。

**1、** 通过c->argv获取输入参数，并校验参数是否符合相应的类型；

**2、** 通过lookupKey相关方法，根据键值获取相应的redis对象；

**3、** 根据当前命令调用相关的API方法执行具体逻辑；

**4、** 一般API方法里都会包含两种数据结构的处理逻辑，根据当前的数据编码来选择具体的逻辑；

**5、** 根据当前数据编码和操作命令，触发事件通知；

**6、** 调用addReply相关方法返回相应的执行结果；

### 8 总结

**1、** 数据类型有五种，字符串、列表、哈希、集合、有序集合；

**2、** 对应的源代码文件分别是t_string.c、t_list.c、t_hash.c、t_set.c、t_zset.c；

**3、** redisObject可以用来存储以上几种数据类型；

**4、** 这几个源代码一般将方法分为两大类，一类是API，一类是方法；

**5、** 对键做了修改操作，会调用notifyKeyspaceEvent方法触发相应事件的通知；
