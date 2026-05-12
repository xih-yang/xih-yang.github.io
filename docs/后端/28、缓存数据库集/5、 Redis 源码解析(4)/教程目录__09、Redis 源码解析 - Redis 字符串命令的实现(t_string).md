# 09、Redis 源码解析 - Redis 字符串命令的实现(t_string)
- 来源：https://ddkk.com/zhuanlan/db/redis/4/9.html
- 分类：缓存数据库
- 分组：教程目录
## Redis 字符串键的实现(t_string)

### 1. 字符串命令介绍

redis中的所有字符串命令如下：[字符串类型命令详解](http://blog.csdn.net/men_wen/article/details/60783300)

序号
命令及描述

1
SET key value：设置指定 key 的值

2
GET key： 获取指定 key 的值。

3
GETRANGE key start end： 返回 key 中字符串值的子字符

4
GETSET key value：将给定 key 的值设为 value ，并返回 key 的旧值(old value)。

5
GETBIT key offset：对 key 所储存的字符串值，获取指定偏移量上的位(bit)。

6
MGET key1 [key2..]：获取所有(一个或多个)给定 key 的值。

7
SETBIT key offset value：对 key 所储存的字符串值，设置或清除指定偏移量上的位(bit)。

8
SETEX key seconds value：将值 value 关联到 key ，并将 key 的过期时间设为 seconds (以秒为单位)。

9
SETNX key value：只有在 key 不存在时设置 key 的值。

10
SETRANGE key offset value：用 value 参数覆写给定 key 所储存的字符串值，从偏移量 offset 开始。

11
STRLEN key：返回 key 所储存的字符串值的长度。

12
MSET key value [key value …]：同时设置一个或多个 key-value 对。

13
MSETNX key value [key value …]：同时设置一个或多个 key-value 对，当且仅当所有给定 key 都不存在。

14
PSETEX key milliseconds value：这个命令和 SETEX 命令相似，但它以毫秒为单位设置 key 的生存时间，而不是像 SETEX 命令那样，以秒为单位。

15
INCR key：将 key 中储存的数字值增一。

16
INCRBY key increment将 key： 所储存的值加上给定的增量值（increment） 。

17
INCRBYFLOAT key increment：将 key 所储存的值加上给定的浮点增量值（increment） 。

18
DECR key：将 key 中储存的数字值减一。

19
DECRBY key decrementkey： 所储存的值减去给定的减量值（decrement） 。

20
APPEND key value：如果 key 已经存在并且是一个字符串， APPEND 命令将 value 追加到 key 原来的值的末尾。

### 2. 字符串命令的实现

字符串命令底层数据结构为 [简单动态字符串SDS](/zhuanlan/db/redis/4/2.html) 。**对于字符串命令，无论是命令本身还是参数，都是作为成一个对象对待的。**关于redis的对象系统，请参考文章：[redis对象系统源码剖析和注释](/zhuanlan/db/redis/4/8.html)。

在redis的对象系统中，字符串对象的底层实现类型有如下三种：

编码—encoding
对象—ptr

OBJ_ENCODING_RAW
简单动态字符串实现的字符串对象

OBJ_ENCODING_INT
整数值实现的字符串对象

OBJ_ENCODING_EMBSTR
embstr编码的简单动态字符串实现的字符串对象

因此，一个字符串对象的结构定义如下：

```java
typedef struct redisObject {
    //对象的数据类型，字符串对象应该为 OBJ_STRING
    unsigned type:4;        
    //对象的编码类型，分别为OBJ_STRING、OBJ_ENCODING_INT或OBJ_ENCODING_EMBSTR
    unsigned encoding:4;
    //暂且不关心该成员
    unsigned lru:LRU_BITS; /* lru time (relative to server.lruclock) */
    //引用计数
    int refcount;
    //指向底层数据实现的指针
    void *ptr;
} robj;
```

我们假设一个key的值为”Hello World” ，因此它的空间结构如图所示：

### 3. 字符串命令源码注释

所有命令详细实现可以上github下载：[t_string.c注释](https://github.com/menwengit/redis_source_annotation/blob/master/t_string.c)。这里列出重要的命令。

#### 3.1 SET 一类命令的最底层实现

```java
#define OBJ_SET_NO_FLAGS 0
#define OBJ_SET_NX (1<<0)     /* Set if key not exists. */          //在key不存在的情况下才会设置
#define OBJ_SET_XX (1<<1)     /* Set if key exists. */              //在key存在的情况下才会设置
#define OBJ_SET_EX (1<<2)     /* Set if time in seconds is given */ //以秒(s)为单位设置键的key过期时间
#define OBJ_SET_PX (1<<3)     /* Set if time in ms in given */      //以毫秒(ms)为单位设置键的key过期时间
//setGenericCommand()函数是以下命令: SET, SETEX, PSETEX, SETNX.的最底层实现
//flags 可以是NX或XX，由上面的宏提供
//expire 定义key的过期时间，格式由unit指定
//ok_reply和abort_reply保存着回复client的内容，NX和XX也会改变回复
//如果ok_reply为空，则使用 "+OK"
//如果abort_reply为空，则使用 "$-1"
void setGenericCommand(client *c, int flags, robj *key, robj *val, robj *expire, int unit, robj *ok_reply, robj *abort_reply) {
    long long milliseconds = 0; /* initialized to avoid any harmness warning */ //初始化，避免错误
    //如果定义了key的过期时间
    if (expire) {
        //从expire对象中取出值，保存在milliseconds中，如果出错发送默认的信息给client
        if (getLongLongFromObjectOrReply(c, expire, &milliseconds, NULL) != C_OK)
            return;
        // 如果过期时间小于等于0，则发送错误信息给client
        if (milliseconds <= 0) {
            addReplyErrorFormat(c,"invalid expire time in %s",c->cmd->name);
            return;
        }
        //如果unit的单位是秒，则需要转换为毫秒保存
        if (unit == UNIT_SECONDS) milliseconds *= 1000;
    }
    //lookupKeyWrite函数是为执行写操作而取出key的值对象
    //如果设置了NX(不存在)，并且在数据库中 找到 该key，或者
    //设置了XX(存在)，并且在数据库中 没有找到 该key
    //回复abort_reply给client
    if ((flags & OBJ_SET_NX && lookupKeyWrite(c->db,key) != NULL) ||
        (flags & OBJ_SET_XX && lookupKeyWrite(c->db,key) == NULL))
    {
        addReply(c, abort_reply ? abort_reply : shared.nullbulk);
        return;
    }
    //在当前db设置键为key的值为val
    setKey(c->db,key,val);
    //设置数据库为脏(dirty)，服务器每次修改一个key后，都会对脏键(dirty)增1
    server.dirty++;
    //设置key的过期时间
    //mstime()返回毫秒为单位的格林威治时间
    if (expire) setExpire(c->db,key,mstime()+milliseconds);
    //发送"set"事件的通知，用于发布订阅模式，通知客户端接受发生的事件
    notifyKeyspaceEvent(NOTIFY_STRING,"set",key,c->db->id);
    //发送"expire"事件通知
    if (expire) notifyKeyspaceEvent(NOTIFY_GENERIC,
        "expire",key,c->db->id);
    //设置成功，则向客户端发送ok_reply
    addReply(c, ok_reply ? ok_reply : shared.ok);
}
```

#### 3.2 GET 一类命令的最底层实现

```java
//GET 命令的底层实现
int getGenericCommand(client *c) {
    robj *o;
    //lookupKeyReadOrReply函数是为执行读操作而返回key的值对象，找到返回该对象，找不到会发送信息给client
    //如果key不存在直接，返回0表示GET命令执行成功
    if ((o = lookupKeyReadOrReply(c,c->argv[1],shared.nullbulk)) == NULL)
        return C_OK;
    //如果key的值的编码类型不是字符串对象
    if (o->type != OBJ_STRING) {
        addReply(c,shared.wrongtypeerr);    //返回类型错误的信息给client，返回-1表示GET命令执行失败
        return C_ERR;
    } else {
        addReplyBulk(c,o);  //返回之前找到的对象作为回复给client，返回0表示GET命令执行成功
        return C_OK;
    }
}
```

#### 3.3 DECR 和 INCR 底层实现

```java
// DECR key
// INCR key
//INCR和DECR命令的底层实现
void incrDecrCommand(client *c, long long incr) {
    long long value, oldvalue;
    robj *o, *new;
    o = lookupKeyWrite(c->db,c->argv[1]);   //以写操作获取key的value对象
    //找到了value对象但是value对象不是字符串类型，直接返回
    if (o != NULL && checkType(c,o,OBJ_STRING)) return;
    //将字符串类型的value转换为longlong类型保存在value中
    if (getLongLongFromObjectOrReply(c,o,&value,NULL) != C_OK) return;
    oldvalue = value;   //备份旧的value
    //如果incr超出longlong类型所能表示的范围，发送错误信息
    if ((incr < 0 && oldvalue < 0 && incr < (LLONG_MIN-oldvalue)) ||
        (incr > 0 && oldvalue > 0 && incr > (LLONG_MAX-oldvalue))) {
        addReplyError(c,"increment or decrement would overflow");
        return;
    }
    value += incr;  //计算新的value值
    //value对象目前非共享，编码为整型类型，且新value值不在共享范围，且value处于long类型所表示的范围内
    if (o && o->refcount == 1 && o->encoding == OBJ_ENCODING_INT &&
        (value < 0 || value >= OBJ_SHARED_INTEGERS) &&
        value >= LONG_MIN && value <= LONG_MAX)
    {
        new = o;
        o->ptr = (void*)((long)value);  //设置vlaue对象的值
    } else {
        //当不满足以上任意条件，则新创建一个字符串对象
        new = createStringObjectFromLongLong(value);
        //如果之前的value对象存在
        if (o) {
            dbOverwrite(c->db,c->argv[1],new);  //用new对象去重写key的值
        } else {
            dbAdd(c->db,c->argv[1],new);        //如果之前的value不存在，将key和new组成新的key-value对
        }
    }
    signalModifiedKey(c->db,c->argv[1]);    //当数据库的键被改动，则会调用该函数发送信号
    //发送"incrby"事件通知
    notifyKeyspaceEvent(NOTIFY_STRING,"incrby",c->argv[1],c->db->id);
    //设置脏键
    server.dirty++;
    //回复信息给client
    addReply(c,shared.colon);
    addReply(c,new);
    addReply(c,shared.crlf);
}
```

#### 3.4 APPEND 实现

```java
// APPEND key value
// APPEND命令的实现
void appendCommand(client *c) {
    size_t totlen;
    robj *o, *append;
    o = lookupKeyWrite(c->db,c->argv[1]);   //以写操作获取key的value对象
    //如果没有获取到vlaue，则要创建一个
    if (o == NULL) {
        /* Create the key */
        c->argv[2] = tryObjectEncoding(c->argv[2]); //对参数value进行优化编码
        dbAdd(c->db,c->argv[1],c->argv[2]); //将key和value组成新的key-value对
        incrRefCount(c->argv[2]);           //增加value的引用计数
        totlen = stringObjectLen(c->argv[2]);   //返回vlaue的长度
    } else {    //获取到value
        /* Key exists, check type */
        if (checkType(c,o,OBJ_STRING))  //如果value不是字符串类型的对象直接返回
            return;
        /* "append" is an argument, so always an sds */
        //获得追加的值对象
        append = c->argv[2];
        //计算追加后的长度
        totlen = stringObjectLen(o)+sdslen(append->ptr);
        //如果追加后的长度超出范围，则返回
        if (checkStringLength(c,totlen) != C_OK)
            return;
        /* Append the value */
        //因为要根据value修改key的值，因此如果key原来的值是共享的，需要解除共享，新创建一个值对象与key组对
        o = dbUnshareStringValue(c->db,c->argv[1],o);
        //将vlaue对象的值后面追加上append的值
        o->ptr = sdscatlen(o->ptr,append->ptr,sdslen(append->ptr));
        //计算出追加后值的长度
        totlen = sdslen(o->ptr);
    }
    signalModifiedKey(c->db,c->argv[1]);//当数据库的键被改动，则会调用该函数发送信号
    //发送"append"事件通知
    notifyKeyspaceEvent(NOTIFY_STRING,"append",c->argv[1],c->db->id);
    //设置脏键
    server.dirty++;
    //发送追加后value的长度给client
    addReplyLongLong(c,totlen);
}
```
