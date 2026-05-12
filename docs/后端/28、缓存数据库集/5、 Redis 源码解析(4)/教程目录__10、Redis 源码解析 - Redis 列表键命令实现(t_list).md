# 10、Redis 源码解析 - Redis 列表键命令实现(t_list)
- 来源：https://ddkk.com/zhuanlan/db/redis/4/10.html
- 分类：缓存数据库
- 分组：教程目录
## Redis 列表类型命令实现(t_list)

### 1.列表类型命令介绍

redis中所有列表类型的命令如下：[列表类型命令详解](http://blog.csdn.net/men_wen/article/details/61429145)

序号
命令及描述

1
BLPOP key1 [key2 ] timeout：移出并获取列表的第一个元素， 如果列表没有元素会阻塞列表直到等待超时或发现可弹出元素为止。

2
BRPOP key1 [key2 ] timeout：移出并获取列表的最后一个元素， 如果列表没有元素会阻塞列表直到等待超时或发现可弹出元素为止。

3
BRPOPLPUSH source destination timeout：从列表中弹出一个值，将弹出的元素插入到另外一个列表中并返回它；如但果列表没有元素会阻塞列表直到等待超时或发现可弹出元素为止。

4
LINDEX key index：通过索引获取列表中的元素

5
LINSERT key BEFORE|AFTER pivot value：在列表的元素前或者后插入元素

6
LLEN key：获取列表长度

7
LPOP key：移出并获取列表的第一个元素

8
LPUSH key value1 [value2]：将一个或多个值插入到列表头部

9
LPUSHX key value：将一个或多个值插入到已存在的列表头部

10
LRANGE key start stop：获取列表指定范围内的元素

11
LREM key count value：移除列表元素

12
LSET key index value：通过索引设置列表元素的值

13
LTRIM key start stop：对一个列表进行修剪(trim)，就是说，让列表只保留指定区间内的元素，不在指定区间之内的元素都将被删除。

14
RPOP key：移除并获取列表最后一个元素

15
RPOPLPUSH source destination：移除列表的最后一个元素，并将该元素添加到另一个列表并返回

16
RPUSH key value1 [value2]：在列表中添加一个或多个值

17
RPUSHX key value：为已存在的列表添加值

### 2. 列表类型的实现

#### 2.1 列表类型

之前在剖析redis对象系统（3.2 版本）的实现时，我们得出列表类型的对象的底层实现的数据结构是**快速列表(OBJ_ENCODING_QUICKLIST)和压缩列表(OBJ_ENCODING_ZIPLIST)**。但是**quicklist本质上就是以ziplist为节点的双向链表**，因此列表类型的命令的底层编码只对OBJ_ENCODING_QUICKLIST类型进行操作。

在redis中，列表类型封装了一层自己的接口，当然是基于quicklist的接口进行封装。

这些函数的注释请上github查看：[列表命令实现代码注释](https://github.com/menwengit/redis_source_annotation/blob/master/t_list.c)

```java
/* List data type */
void listTypeTryConversion(robj *subject, robj *value);
// 列表类型的从where插入一个value，PUSH命令的底层实现
void listTypePush(robj *subject, robj *value, int where);
// 列表类型的从where弹出一个value，POP命令底层实现
robj *listTypePop(robj *subject, int where);
// 返回对象的长度，entry节点个数
unsigned long listTypeLength(robj *subject);
// 初始化列表类型的迭代器为一个指定的下标
listTypeIterator *listTypeInitIterator(robj *subject, long index, unsigned char direction);
// 释放迭代器空间
void listTypeReleaseIterator(listTypeIterator *li);
// 将列表类型的迭代器指向的entry保存在提供的listTypeEntry结构中，并且更新迭代器，1表示成功，0失败
int listTypeNext(listTypeIterator *li, listTypeEntry *entry);
// 返回一个节点的value对象，根据当前的迭代器
robj *listTypeGet(listTypeEntry *entry);
// 列表类型的插入操作，将value对象插到where
void listTypeInsert(listTypeEntry *entry, robj *value, int where);
// 比较列表类型的entry结构与对象的entry节点的值是否等，相等返回1
int listTypeEqual(listTypeEntry *entry, robj *o);
// 删除迭代器指向的entry
void listTypeDelete(listTypeIterator *iter, listTypeEntry *entry);
// 转换ZIPLIST编码类型为quicklist类型，enc指定OBJ_ENCODING_QUICKLIST
void listTypeConvert(robj *subject, int enc);
```

由于这些接口都是调用的quicklist的实现，因此各个操作都非常简单，例如：

- 列表类型的PUSH操作

```java
//列表类型的从where插入一个value，PUSH命令的底层实现
void listTypePush(robj *subject, robj *value, int where) {
    //对列表对象编码为quicklist类型操作
    if (subject->encoding == OBJ_ENCODING_QUICKLIST) {
        //根据where保存quicklist的头节点地址或尾节点地址
        int pos = (where == LIST_HEAD) ? QUICKLIST_HEAD : QUICKLIST_TAIL;
        //获得value编码为RAW的字符串对象
        value = getDecodedObject(value);
        //保存value的长度
        size_t len = sdslen(value->ptr);
        //PUSH value的值到quicklist的头或尾
        quicklistPush(subject->ptr, value->ptr, len, pos);
        //value的引用计数减1
        decrRefCount(value);
    } else {
        serverPanic("Unknown list encoding");   //不是quicklist类型的编码则发送错误信息
    }
}
```

在比如：

- 列表类型的POP操作

```java
//拷贝对象类型的方法，用于listTypePop函数的调用
void *listPopSaver(unsigned char *data, unsigned int sz) {
    return createStringObject((char*)data,sz);
}
//列表类型的从where弹出一个value，POP命令底层实现
robj *listTypePop(robj *subject, int where) {
    long long vlong;
    robj *value = NULL;
    //获得POP的位置，quicklist的头部或尾部
    int ql_where = where == LIST_HEAD ? QUICKLIST_HEAD : QUICKLIST_TAIL;
    //对列表对象编码为quicklist类型操作
    if (subject->encoding == OBJ_ENCODING_QUICKLIST) {
        //从ql_where位置POP出一个entry节点，保存在value或vlong中
        if (quicklistPopCustom(subject->ptr, ql_where, (unsigned char **)&value,
                               NULL, &vlong, listPopSaver)) {
            if (!value) //如果弹出的entry节点是整型的
                //则根据整型值创建一个字符串对象
                value = createStringObjectFromLongLong(vlong);
        }
    } else {
        serverPanic("Unknown list encoding");
    }
    return value;   //返回弹出entry节点的value值
}
```

这里，我们只简单分析这两个操作的过程，其他的可以上[列表命令实现代码注释](https://github.com/menwengit/redis_source_annotation/blob/master/t_list.c)查看所有的注释。

#### 2.2 列表对象

因为**redis实现了自己的对象系统，因此所有的操作也都是基于对象的**，**列表类型的对象结构**如下：

```java
//这里分析列表类型的对象
typedef struct redisObject {
    //对象的数据类型，只对 OBJ_LIST 类型进行操作
    unsigned type:4;        
    //对象的编码类型，只对 OBJ_ENCODING_QUICKLIST 编码类型进行操作。因为，底层实现就只有这一种。
    unsigned encoding:4;
    //least recently used
    //实用LRU算法计算相对server.lruclock的LRU时间
    unsigned lru:LRU_BITS; /* lru time (relative to server.lruclock) */
    //引用计数
    int refcount;
    //指向底层数据实现的指针，指向的一定是一个列表
    void *ptr;
} robj;
```

我们大致描绘出一个列表对象的样子，如下图：

#### 2.3 列表类型的迭代器

redis定义了列表类型自己的迭代器和管理节点信息的结构。

```java
/* Structure to hold list iteration abstraction. */
typedef struct {
    robj *subject;          //迭代器指向的对象
    unsigned char encoding; //迭代器指向对象的编码类型
    unsigned char direction;//迭代器的方向
    quicklistIter *iter;    //quicklist的迭代器
} listTypeIterator; //列表类型迭代器
/* Structure for an entry while iterating over a list. */
//管理列表节点信息的结构
typedef struct {
    listTypeIterator *li;   //所属的列表类型迭代器
    quicklistEntry entry;   //quicklist中的quicklistEntry结构，该结构是quicklist用来管理entry的所定义的结构
} listTypeEntry;    //列表类型的entry结构
```

迭代器的操作，我们分析两个。正**因为定义了迭代器，所以在遍历列表的代码看起来非常像C++代码，而且更方便阅读。**

- 初始化迭代器

```java
/* Initialize an iterator at the specified index. */
//初始化列表类型的迭代器为一个指定的下标
listTypeIterator *listTypeInitIterator(robj *subject, long index,
                                       unsigned char direction) {
    listTypeIterator *li = zmalloc(sizeof(listTypeIterator));   //分配空间
    //设置迭代器的各个成员的初始值
    li->subject = subject;
    li->encoding = subject->encoding;
    li->direction = direction;
    li->iter = NULL;    //quicklist迭代器为空
    /* LIST_HEAD means start at TAIL and move *towards* head.
     * LIST_TAIL means start at HEAD and move *towards tail. */
    //获得迭代方向
    int iter_direction =
        direction == LIST_HEAD ? AL_START_TAIL : AL_START_HEAD;
    //对列表对象编码为quicklist类型操作
    if (li->encoding == OBJ_ENCODING_QUICKLIST) {
        //将迭代器和下标为index的quicklistNode结合，迭代器指向该节点
        li->iter = quicklistGetIteratorAtIdx(li->subject->ptr,
                                             iter_direction, index);
    } else {
        serverPanic("Unknown list encoding");
    }
    return li;
}
```

- 迭代器的迭代

```java
//将列表类型的迭代器指向的entry保存在提供的listTypeEntry结构中，并且更新迭代器，1表示成功，0失败
int listTypeNext(listTypeIterator *li, listTypeEntry *entry) {
    /* Protect from converting when iterating */
    //确保对象编码类型和迭代器中encoding成员相等
    serverAssert(li->subject->encoding == li->encoding);
    //设置listTypeEntry的entry成员关联到当前列表类型的迭代器
    entry->li = li;
    //对列表对象编码为quicklist类型操作
    if (li->encoding == OBJ_ENCODING_QUICKLIST) {
        //保存当前的entry到listTypeEntry的entry成员，并更新迭代器
        return quicklistNext(li->iter, &entry->entry);
    } else {
        serverPanic("Unknown list encoding");
    }
    return 0;
}
```

### 3. 列表类型命令实现

列表类型命令与其他类型命令的不同是，**列表命令实现了阻塞命令，例如：BLPOP、BRPOP、BLPOPRPUSH。**

查看下载所有函数的注释：[列表命令实现代码注释](https://github.com/menwengit/redis_source_annotation/blob/master/t_list.c)

#### 3.1 非阻塞命令

我们只分析一类命令的最底层实现，如果PUSH一类、POP一类。

- PUSH一类命令的底层实现

```java
//PUSH命令的底层实现，where保存push的位置
void pushGenericCommand(client *c, int where) {
    int j, waiting = 0, pushed = 0;
    robj *lobj = lookupKeyWrite(c->db,c->argv[1]);  //以写操作读取key对象的value
    //如果value对象不是列表类型则发送错误信息，返回
    if (lobj && lobj->type != OBJ_LIST) {
        addReply(c,shared.wrongtypeerr);
        return;
    }
    //从第一个value开始遍历
    for (j = 2; j < c->argc; j++) {
        c->argv[j] = tryObjectEncoding(c->argv[j]);     //将value对象优化编码
        //如果没有找到key对象
        if (!lobj) {
            //创建一个quicklist类型的对象
            lobj = createQuicklistObject();
            //设置ziplist最大的长度和压缩程度，配置文件指定
            quicklistSetOptions(lobj->ptr, server.list_max_ziplist_size,
                                server.list_compress_depth);
            //将新的key对象和优化编码过的value对象进行组成键值对
            dbAdd(c->db,c->argv[1],lobj);
        }
        //在where推入一个value对象
        listTypePush(lobj,c->argv[j],where);
        pushed++;   //更新计数器
    }
    //发送当前列表中元素的个数
    addReplyLongLong(c, waiting + (lobj ? listTypeLength(lobj) : 0));
    //如果推入元素成功
    if (pushed) {
        char *event = (where == LIST_HEAD) ? "lpush" : "rpush";
        //当数据库的键被改动，则会调用该函数发送信号
        signalModifiedKey(c->db,c->argv[1]);
        //发送"lpush"或"rpush"事件通知
        notifyKeyspaceEvent(NOTIFY_LIST,event,c->argv[1],c->db->id);
    }
    server.dirty += pushed; //更新脏键
}
```

- POP一类命令的底层实现

```java
//POP命令的底层实现，where保存pop的位置
void popGenericCommand(client *c, int where) {
    //以写操作取出key对象的value值
    robj *o = lookupKeyWriteOrReply(c,c->argv[1],shared.nullbulk);
    // 如果key没找到或value对象不是列表类型则直接返回
    if (o == NULL || checkType(c,o,OBJ_LIST)) return;
    //从where 弹出一个value
    robj *value = listTypePop(o,where);
    //如果value为空，则发送空信息
    if (value == NULL) {
        addReply(c,shared.nullbulk);
    } else {
        //保存时间名称
        char *event = (where == LIST_HEAD) ? "lpop" : "rpop";
        //发送value给client
        addReplyBulk(c,value);
        //释放value对象
        decrRefCount(value);
        //发送事件通知
        notifyKeyspaceEvent(NOTIFY_LIST,event,c->argv[1],c->db->id);
        //如果弹出一个元素后，列表为空
        if (listTypeLength(o) == 0) {
            //发送"del"时间通知
            notifyKeyspaceEvent(NOTIFY_GENERIC,"del",
                                c->argv[1],c->db->id);
            //从数据库中删除当前的key
            dbDelete(c->db,c->argv[1]);
        }
        //当数据库的键被改动，则会调用该函数发送信号
        signalModifiedKey(c->db,c->argv[1]);
        //更新脏键
        server.dirty++;
    }
}
```

- PUSHX、INSERT命令的底层实现

```java
//当key存在时则push，PUSHX，INSERT命令的底层实现
void pushxGenericCommand(client *c, robj *refval, robj *val, int where) {
    robj *subject;
    listTypeIterator *iter;
    listTypeEntry entry;
    int inserted = 0;
    //以写操作读取key对象的value
    //如果读取失败或读取的value对象不是列表类型则返回
    if ((subject = lookupKeyWriteOrReply(c,c->argv[1],shared.czero)) == NULL ||
        checkType(c,subject,OBJ_LIST)) return;
    //寻找基准值refval
    if (refval != NULL) {
        /* Seek refval from head to tail */
        //创建一个列表的迭代器
        iter = listTypeInitIterator(subject,0,LIST_TAIL);
        //将指向当前的entry节点保存到列表类型的entry中，然后指向下一个entry节点
        while (listTypeNext(iter,&entry)) {
            //当前的entry节点的值与基准值refval是否相等
            if (listTypeEqual(&entry,refval)) {
                //如果相等，根据where插入val对象
                listTypeInsert(&entry,val,where);
                inserted = 1;   //设置插入的标识，跳出循环
                break;
            }
        }
        //事项迭代器
        listTypeReleaseIterator(iter);
        //如果插入成功，键值被修改，则发送信号并且发送"linsert"时间通知
        if (inserted) {
            signalModifiedKey(c->db,c->argv[1]);
            notifyKeyspaceEvent(NOTIFY_LIST,"linsert",
                                c->argv[1],c->db->id);
            server.dirty++; //更新脏键
        } else {
            /* Notify client of a failed insert */
            //如果没有插入，则发送插入失败的信息
            addReply(c,shared.cnegone);
            return;
        }
    //如果基准值为空
    } else {
        //根据where判断出事件名称
        char *event = (where == LIST_HEAD) ? "lpush" : "rpush";
        //将val对象推入到列表的头部或尾部
        listTypePush(subject,val,where);
        //当数据库的键被改动，则会调用该函数发送信号
        signalModifiedKey(c->db,c->argv[1]);
        //发送事件通知
        notifyKeyspaceEvent(NOTIFY_LIST,event,c->argv[1],c->db->id);
        server.dirty++; //更新脏键
    }
    //将插入val后的列表的元素个数发送给client
    addReplyLongLong(c,listTypeLength(subject));
}
```

#### 3.2 阻塞命令

阻塞命令一共有三个，分别是：BLPOP，BRPOP，BLPOPRPUSH。命令格式如下：

```java
 BLPOP key [key ...] timeout 
 BRPOP key [key ...] timeout
 BRPOPLPUSH source destination timeout 
 //timeout 参数表示的是一个指定阻塞的最大秒数的整型值。当 timeout 为 0 是表示阻塞时间无限制。
```

首先我们介绍阻塞命令的两种行为。

##### 3.2.1 非阻塞行为

假如BLPOP 或 BLPOP 命令被执行，当给定的所有个key内，

- 至少有1个是非空列表，那么就会直接将结果和信息返回给调用者。
- 有多个非空列表，按照key的先后顺序，依次检查各个列表。

##### 3.2.2 阻塞行为

如果所有给定的key中不存在，或者key中包含的是空列表，那么 BLPOP 或 BLPOP 命令将会被阻塞连接，直到另一个client对这些key中执行 [LR]PUSH 命令将一个新数据出现在任意key的列表中，那么这个命令会解除调用BLPOP 或 BLPOP 命令的client的阻塞状态。

##### 3.2.3 阻塞命令的实现

其实阻塞命令实现就是在非阻塞命令的基础上，只需要进行判断了相应的阻塞操作即可。

- BRPOP BLPOP 命令的底层实现

```java
/* Blocking RPOP/LPOP */
// BRPOP BLPOP 命令的底层实现
//  BLPOP key [key ...] timeout
void blockingPopGenericCommand(client *c, int where) {
    robj *o;
    mstime_t timeout;
    int j;
    // 以秒为单位保存timeout值
    if (getTimeoutFromObjectOrReply(c,c->argv[c->argc-1],&timeout,UNIT_SECONDS)
        != C_OK) return;
    //非阻塞行为
    //遍历所有的key，如果key中列表有值，则执行完这个循环一定能直接返回
    for (j = 1; j < c->argc-1; j++) {
        //以写操作取出当前key的值
        o = lookupKeyWrite(c->db,c->argv[j]);
        // value对象不为空
        if (o != NULL) {
            // 如果value对象的类型不是列表类型，发送类型错误信息，直接返回
            if (o->type != OBJ_LIST) {
                addReply(c,shared.wrongtypeerr);
                return;
            } else {
                // 列表长度不为0
                if (listTypeLength(o) != 0) {
                    /* Non empty list, this is like a non normal [LR]POP. */
                    // 保存事件名称
                    char *event = (where == LIST_HEAD) ? "lpop" : "rpop";
                    // 保存弹出的value对象
                    robj *value = listTypePop(o,where);
                    serverAssert(value != NULL);
                    // 发送回复给client
                    addReplyMultiBulkLen(c,2);
                    addReplyBulk(c,c->argv[j]);
                    addReplyBulk(c,value);
                    // 释放value
                    decrRefCount(value);
                    // 发送事件通知
                    notifyKeyspaceEvent(NOTIFY_LIST,event,
                                        c->argv[j],c->db->id);
                    //如果弹出元素后列表为空
                    if (listTypeLength(o) == 0) {
                        //从数据库中删除当前的key
                        dbDelete(c->db,c->argv[j]);
                        // 发送"del"的事件通知
                        notifyKeyspaceEvent(NOTIFY_GENERIC,"del",
                                            c->argv[j],c->db->id);
                    }
                    //数据库的键被修改，发送信号
                    signalModifiedKey(c->db,c->argv[j]);
                    //更新脏键
                    server.dirty++;
                    /* Replicate it as an [LR]POP instead of B[LR]POP. */
                    // 传播一个[LR]POP 而不是B[LR]POP，修改client原来的命令参数
                    rewriteClientCommandVector(c,2,
                        (where == LIST_HEAD) ? shared.lpop : shared.rpop,
                        c->argv[j]);
                    return;
                }
            }
        }
    }
    //非阻塞行为
    /* If we are inside a MULTI/EXEC and the list is empty the only thing
     * we can do is treating it as a timeout (even with timeout 0). */
    // 如果命令在一个事务中执行，则发送一个空回复以避免死等待，因为要执行完整个事务块。
    if (c->flags & CLIENT_MULTI) {
        addReply(c,shared.nullmultibulk);
        return;
    }
    /* If the list is empty or the key does not exists we must block */
    // 参数中的所有键都不存在，则阻塞这些键
    blockForKeys(c, c->argv + 1, c->argc - 2, timeout, NULL);
}
```

我们可以看到阻塞命令其实很容易理解，但是我们需要分析阻塞的过程，也就是blockForKeys()函数。

```java
// keys是一个key的数组，个数为numkeys个
// timeout保存超时时间
// target保存PUSH入元素的键，也就是dstkey，用于BRPOPLPUSH函数
// 根据给定的key将client阻塞
void blockForKeys(client *c, robj **keys, int numkeys, mstime_t timeout, robj *target) {
    dictEntry *de;
    list *l;
    int j;
    //设置超时时间和target，该结构在下面列出
    c->bpop.timeout = timeout;
    c->bpop.target = target;
    //增加target的引用计数
    if (target != NULL) incrRefCount(target);
    //将当前client与numkeys个key关联起来，结果也就是造成client阻塞的键是给定的numkeys个key
    for (j = 0; j < numkeys; j++) {
        /* If the key already exists in the dict ignore it. */
        //bpop.keys记录所有造成client阻塞的键，该结构在下面列出
        //将要阻塞的键放入bpop.keys字典中
        if (dictAdd(c->bpop.keys,keys[j],NULL) != DICT_OK) continue;
        //当前的key引用计数加1
        incrRefCount(keys[j]);
        /* And in the other "side", to map keys -> clients */
        //db->blocking_keys是一个字典，字典的键为造成client阻塞的一个键，值是一个链表，保存着所有被该键阻塞的client
        //当前造成client被阻塞的键有没有当前的key，如果没有则要进行关联
        de = dictFind(c->db->blocking_keys,keys[j]);
        if (de == NULL) {   //没有当前的key，添加进去
            int retval;
            /* For every key we take a list of clients blocked for it */
            //创建一个列表
            l = listCreate();
            //将造成阻塞的键和列表添加到db->blocking_keys字典中
            retval = dictAdd(c->db->blocking_keys,keys[j],l);
            incrRefCount(keys[j]);
            serverAssertWithInfo(c,keys[j],retval == DICT_OK);
        } else {    //如果已经有了，则当前key的值保存起来，值是一个列表
            l = dictGetVal(de);
        }
        listAddNodeTail(l,c);   //将当前client加入到阻塞的client的列表
    }
    blockClient(c,BLOCKED_LIST);    //阻塞client
}
```

从上面的代码中，使用了client结构的一些成员分别是c->bpop.xxxx 和 c->db->blocking_keys。我们分别查看一下其定义：

```java
// server.h
typedef struct client {
    //client当前使用的数据库
    redisDb *db;   /* Pointer to currently SELECTed DB. */
    //阻塞状态
    blockingState bpop;     /* blocking state */
    //其他成员省略
} client;
```

我们先来分析blockingState结构。

```java
// server.h
typedef struct blockingState {
    /* Generic fields. */
    //阻塞的时间
    mstime_t timeout;       /* Blocking operation timeout. If UNIX current time
                             * is > timeout then the operation timed out. */
    /* BLOCKED_LIST */
    //造成阻塞的键
    dict *keys;             /* The keys we are waiting to terminate a blocking
                             * operation such as BLPOP. Otherwise NULL. */
    //用于BRPOPLPUSH命令
    //用于保存PUSH入元素的键，也就是dstkey
    robj *target;           /* The key that should receive the element,
                             * for BRPOPLPUSH. */
    /* BLOCKED_WAIT */
    int numreplicas;        /* Number of replicas we are waiting for ACK. */
    long long reploffset;   /* Replication offset to reach. */
} blockingState;
```

再来看一下 redisDb 结构

```java
typedef struct redisDb {
    //正处于阻塞状态的键
    dict *blocking_keys;        /* Keys with clients waiting for data (BLPOP) */
    //可以解除阻塞的键
    dict *ready_keys;           /* Blocked keys that received a PUSH */
} redisDb;
```

接下来，我们分析blockForKeys()代码。刚开始将timeout和target分别读入blockingState中。然后遍历所有传过来的key，这些key都是造成当前client阻塞的键，我们需要将这些键**添加记录**，因此，将这些键加入到 c->bpop.keys 中。我们从上面的blockingState结构看出 c->bpop.keys 这个成员是一个字典结构，这个词典记录着所有造成客户端阻塞的键。而且加入字典中的键为传入的所有key，而值则为NULL。

如果之前 c->bpop.keys 中已经记录当前key，则跳过本层循环。

我们不光记录所有造成客户端阻塞的键，还要**这些所有键和造成阻塞的客户端添加对应的映射关系**。首先，我们介绍 blocking_keys 成员，这是一个字典，该字典的键是造成客户端阻塞的键，而字典的值则为一个链表，链表中包含着所有被阻塞的客户端，找到当前key的节点，将节点的值，这个值保存的是被阻塞的client，将这个值添加到被阻塞客户端链表中。然后调用blockClient()阻塞客户端。

看懂了这些，对应的解阻塞的代码就很容易看懂。解阻塞就是从记录中删除对应key并且解除key和client的映射。

```java
//解阻塞一个正在阻塞中的client
void unblockClientWaitingData(client *c) {
    dictEntry *de;
    dictIterator *di;
    list *l;
    serverAssertWithInfo(c,NULL,dictSize(c->bpop.keys) != 0);
    //创建一个字典的迭代器，指向的是造成client阻塞的键所组成的字典
    di = dictGetIterator(c->bpop.keys);
    /* The client may wait for multiple keys, so unblock it for every key. */
    //因为client可能被多个key所阻塞，所以要遍历所有的键
    while((de = dictNext(di)) != NULL) {
        robj *key = dictGetKey(de); //获得key对象
        /* Remove this client from the list of clients waiting for this key. */
        //根据key找到对应的列表类型值，值保存着被阻塞的client，从中找c->db->blocking_keys中寻找
        l = dictFetchValue(c->db->blocking_keys,key);
        serverAssertWithInfo(c,key,l != NULL);
        // 将阻塞的client从列表中移除
        listDelNode(l,listSearchKey(l,c));
        /* If the list is empty we need to remove it to avoid wasting memory */
        //如果当前列表为空了，则从c->db->blocking_keys中将key删除
        if (listLength(l) == 0)
            dictDelete(c->db->blocking_keys,key);
    }
    dictReleaseIterator(di);    //释放迭代器
    /* Cleanup the client structure */
    //清空bpop.keys的所有节点
    dictEmpty(c->bpop.keys,NULL);
    //如果保存有新添加的元素，则应该释放
    if (c->bpop.target) {
        decrRefCount(c->bpop.target);
        c->bpop.target = NULL;
    }
}
```

- BRPOPLPUSH 命令的实现

```java
//  BRPOPLPUSH source destination timeout
// BRPOPLPUSH命令的实现
void brpoplpushCommand(client *c) {
    mstime_t timeout;
    //以秒为单位取出超时时间
    if (getTimeoutFromObjectOrReply(c,c->argv[3],&timeout,UNIT_SECONDS)
        != C_OK) return;
    //以写操作读取出 source的值
    robj *key = lookupKeyWrite(c->db, c->argv[1]);
    //如果键为空，阻塞行为
    if (key == NULL) {
        // 如果命令在一个事务中执行，则发送一个空回复以避免死等待
        if (c->flags & CLIENT_MULTI) {
            /* Blocking against an empty list in a multi state
             * returns immediately. */
            addReply(c, shared.nullbulk);
        } else {
            /* The list is empty and the client blocks. */
            // 列表为空，则将client阻塞
            blockForKeys(c, c->argv + 1, 1, timeout, c->argv[2]);
        }
    //非阻塞行为
    //如果键不为空，执行RPOPLPUSH
    } else {
        //判断取出的value对象是否为列表类型，不是的话发送类型错误信息
        if (key->type != OBJ_LIST) {
            addReply(c, shared.wrongtypeerr);
        } else {
            /* The list exists and has elements, so
             * the regular rpoplpushCommand is executed. */
            // value对象的列表存在且有元素，所以调用普通的rpoplpush命令
            serverAssertWithInfo(c,key,listTypeLength(key) > 0);
            rpoplpushCommand(c);
        }
    }
}
```
