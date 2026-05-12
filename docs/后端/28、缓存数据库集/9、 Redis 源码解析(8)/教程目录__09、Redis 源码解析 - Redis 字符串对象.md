# 09、Redis 源码解析 - Redis 字符串对象
- 来源：https://ddkk.com/zhuanlan/db/redis/8/9.html
- 分类：缓存数据库
- 分组：教程目录
### 1. 字符串对象的结构

下图展示了字符串对象的结构，首先是一个`redisObject`表头，表头中规定了对象类型以及对象所使用的编码，`ptr`指针则指向了一个`sdshdr`表头，`sdshdr`结构中的`buf`数组保存着实际的字符串.

### 2. 字符串对象编码

#### 2.1 编码使用规则

前面我们说到，Redis中的一种对象有着多种底层数据结构的实现. 而String对象的编码有三种，见下表：

encoding
ptr

OBJ_ENCODING_INT
整数值实现的字符串对象

OBJ_ENCODING_EMBSTR
embstr 编码的简单动态字符串实现的字符串对象

OBJ_ENCODING_RAW
简单动态字符串实现的字符串对象

各种编码的使用规则是这样的：

- 字符串保存的值是整数，并且该整数可以用long类型表示，使用OBJ_ENCODING_INT编码.
- 字符串保存的对象是一个字符串值，并且字符串的长度小于44字节，使用OBJ_ENCODING_EMBSTR编码. （redis使用jemalloc内存分配器，且jemalloc会分配8，16，32，64等字节的内存，一个embstr固定的大小为16+3+1 = 20个字节，因此一个最大的embstr字符串为64-20 = 44字节.）
- 字符串保存的对象是一个字符串值，并且字符串的大于44字节，使用OBJ_ENCODING_RAW编码.

#### 2.2 编码转换

`int`和`embstr`编码的字符串对象满足一定的条件，会被转化为`raw`编码的字符串对象.

- 对int和embstr字符串对象使用APPEND命令，对象会变成raw编码.
- int编码的整数字符串超出long能表示的范围，或者embstr编码的字符串超过44字节，都会变成raw编码.

需要说明的是，`embstr`编码是专门用于保存短字符串的一种优化编码方式，这种编码和`raw`编码是一样的，但`raw`编码会调用两次内存分配函数来分别创建`redisObject`结构和`sdshdr`结构，而`embstr`编码则通过调用一次内存分配函数来分配一块连续的空间，这一块空间中直接就包含了上面的两个部分，如下图所示：

使用`embstr`编码的字符串对象来保存短字符串有以下好处：

- embstr编码将创建字符串对象所需的内存分配次数从raw编码的两次降低为一次.
- 释放embstr编码的字符串对象只需要调用一次内存释放函数，而释放raw编码的字符串对象需要调用两次内存释放函数.
- 因为embstr编码的字符串对象的所有数据都保存在一块连续的内存里面，所以这种编码的字符串对象比起raw编码的字符串对象能够更好地利用缓存带来的优势.

其次，Redis没有为`embstr`编码的字符串编写任何相应的修改程序，所以`embstr`编码的字符串实际上是可读的，任何对它进行修改的操作，都会让它变为`raw`编码.

### 3. 字符串对象命令介绍

命令
描述

SET key value
设置指定 key 的值

GET key
获取指定 key 的值

GETRANGE key start end
返回 key 中字符串值的子字符

GETSET key value
将给定 key 的值设为 value ，并返回 key 的旧值（old value）

GETBIT key offset
对 key 所储存的字符串值，获取指定偏移量上的位（bit）

MGET key1 [key2…]
获取所有（一个或多个）给定 key 的值

SETBIT key offset value
对 key 所储存的字符串值，设置或清除指定偏移量上的位（bit）

SETEX key seconds value
将值 value 关联到 key ，并将 key 的过期时间设为 seconds （以秒为单位）

SETNX key value
只有在 key 不存在时设置 key 的值

SETRANGE key offset value
用 value 参数覆写给定 key 所储存的字符串值，从偏移量 offset 开始

STRLEN key
返回 key 所储存的字符串值的长度

MSET key value [key value …]
同时设置一个或多个 key-value 对

MSETNX key value [key value …]
同时设置一个或多个 key-value 对，当且仅当所有给定 key 都不存在

PSETEX key milliseconds value
这个命令和 SETEX 命令相似，但它以毫秒为单位设置 key 的生存时间，而不是像 SETEX 命令那样，以秒为单位

INCR key
将 key 中储存的数字值增一

INCRBY key increment将 key
所储存的值加上给定的增量值（increment）

INCRBYFLOAT key increment
将 key 所储存的值加上给定的浮点增量值（increment）

DECR key
将 key 中储存的数字值减一

DECRBY key decrementkey
所储存的值减去给定的减量值（decrement）

APPEND key value
如果 key 已经存在并且是一个字符串， APPEND 命令将 value 追加到 key 原来的值的末尾

### 4. 字符串对象命令的实现

字符串对象命令的实现代码在`t_string.c`源文件中.

#### 4.1 SET命令

```java
#define OBJ_SET_NO_FLAGS 0
// 在key不存在的情况下才会设置
#define OBJ_SET_NX (1<<0)
// 在key存在的情况下才会设置
#define OBJ_SET_XX (1<<1)
// 以秒(s)为单位设置键的key过期时间
#define OBJ_SET_EX (1<<2)
// 以毫秒(ms)为单位设置键的key过期时间
#define OBJ_SET_PX (1<<3)
// setGenericCommand() 函数是以下命令: SET, SETEX, PSETEX, SETNX 的最底层实现
// flags 可以是NX或XX，由上面的宏提供
// expire 定义key的过期时间，格式由unit指定
// ok_reply和abort_reply保存着回复client的内容，NX和XX也会改变回复
// 如果ok_reply为空，则使用 "+OK"
// 如果abort_reply为空，则使用 "$-1"
void setGenericCommand(client *c, int flags, robj *key, robj *val, robj *expire, int unit, robj *ok_reply, robj *abort_reply) {
	// 初始化，避免错误
    long long milliseconds = 0;
    // 如果定义了key的过期时间
    if (expire) {
        // 从expire对象中取出值，保存在milliseconds中，如果出错发送默认的信息给client
        if (getLongLongFromObjectOrReply(c, expire, &milliseconds, NULL) != C_OK)
            return;
        // 如果过期时间小于等于0，则发送错误信息给client
        if (milliseconds <= 0) {
            addReplyErrorFormat(c,"invalid expire time in %s",c->cmd->name);
            return;
        }
        // 如果unit的单位是秒，则需要转换为毫秒保存
        if (unit == UNIT_SECONDS) milliseconds *= 1000;
    }
    // lookupKeyWrite函数是为执行写操作而取出key的值对象
    // 如果设置了NX(不存在)，但是在数据库中 可以找到 该key
    // 或者设置了XX(存在)，但是在数据库中 不可以找到 该key
    // 回复abort_reply给client
    if ((flags & OBJ_SET_NX && lookupKeyWrite(c->db,key) != NULL) ||
        (flags & OBJ_SET_XX && lookupKeyWrite(c->db,key) == NULL))
    {
        addReply(c, abort_reply ? abort_reply : shared.nullbulk);
        return;
    }
    // db.c文件中的函数，在当前db设置键为key的值为val
    setKey(c->db,key,val);
    // 设置数据库为脏(dirty)，服务器每次修改一个key后，都会对脏键(dirty)增1
    server.dirty++;
    // 设置key的过期时间
    // mstime()返回毫秒为单位的格林威治时间
    if (expire) setExpire(c->db,key,mstime()+milliseconds);
    // 发送"set"事件的通知，用于发布订阅模式，通知客户端接受发生的事件
    notifyKeyspaceEvent(NOTIFY_STRING,"set",key,c->db->id);
    // 发送"expire"事件通知
    if (expire) notifyKeyspaceEvent(NOTIFY_GENERIC,
        "expire",key,c->db->id);
    // 设置成功，则向客户端发送ok_reply
    addReply(c, ok_reply ? ok_reply : shared.ok);
}
```

#### 4.2 GET命令

```java
// GET 命令的底层实现
int getGenericCommand(client *c) {
    robj *o;
    // lookupKeyReadOrReply函数是为执行读操作而返回key的值对象，找到返回该对象，找不到会发送信息给client
    // 如果key不存在直接，返回0表示GET命令执行成功
    if ((o = lookupKeyReadOrReply(c,c->argv[1],shared.nullbulk)) == NULL)
        return C_OK;
    // 如果key的值的编码类型不是字符串对象
    if (o->type != OBJ_STRING) {
        addReply(c,shared.wrongtypeerr);    //返回类型错误的信息给client，返回-1表示GET命令执行失败
        return C_ERR;
    } else {
        addReplyBulk(c,o);  //返回之前找到的对象作为回复给client，返回0表示GET命令执行成功
        return C_OK;
    }
}
```

#### 4.3 DECR 和 INCR 命令

```java
// DECR key 将 key 中储存的数字值减一
// INCR key 将 key 中储存的数字值增一
//INCR和DECR命令的底层实现
void incrDecrCommand(client *c, long long incr) {
    long long value, oldvalue;
    robj *o, *new;
    o = lookupKeyWrite(c->db,c->argv[1]);   //以写操作获取key的value对象
    // 找到了value对象但是value对象不是字符串类型，直接返回
    if (o != NULL && checkType(c,o,OBJ_STRING)) return;
    // 将字符串类型的value转换为long long类型保存在value中
    if (getLongLongFromObjectOrReply(c,o,&value,NULL) != C_OK) return;
	// 备份旧的value
    oldvalue = value;
    // 如果incr超出long long类型所能表示的范围，发送错误信息
    if ((incr < 0 && oldvalue < 0 && incr < (LLONG_MIN-oldvalue)) ||
        (incr > 0 && oldvalue > 0 && incr > (LLONG_MAX-oldvalue))) {
        addReplyError(c,"increment or decrement would overflow");
        return;
    }
    value += incr;  //计算新的value值
    // value对象目前非共享，编码为整型类型，且新value值不在共享范围，且value处于long类型所表示的范围内
    if (o && o->refcount == 1 && o->encoding == OBJ_ENCODING_INT &&
        (value < 0 || value >= OBJ_SHARED_INTEGERS) &&
        value >= LONG_MIN && value <= LONG_MAX)
    {
        new = o;
        // 设置vlaue对象的值
        o->ptr = (void*)((long)value);
    } else {
        // 当不满足以上任意条件，则新创建一个字符串对象
        new = createStringObjectFromLongLong(value);
        // 如果之前的value对象存在
        if (o) {
        	// 用new对象去重写key的值
            dbOverwrite(c->db,c->argv[1],new);
        } else {
        	// 如果之前的value不存在，将key和new组成新的key-value对
            dbAdd(c->db,c->argv[1],new);
        }
    }
    // 当数据库的键被改动，则会调用该函数发送信号
    signalModifiedKey(c->db,c->argv[1]);
    // 发送"incrby"事件通知
    notifyKeyspaceEvent(NOTIFY_STRING,"incrby",c->argv[1],c->db->id);
    // 设置脏键
    server.dirty++;
    // 回复信息给client
    addReply(c,shared.colon);
    addReply(c,new);
    addReply(c,shared.crlf);
}
```

#### 4.4 APPEND 命令

```java
// APPEND key value 追加字符串
// APPEND命令的实现
void appendCommand(client *c) {
    size_t totlen;
    robj *o, *append;
	// 以写操作获取key的value对象
    o = lookupKeyWrite(c->db,c->argv[1]);
    // 如果没有获取到vlaue，则要创建一个
    if (o == NULL) {
		// 对参数value进行优化编码
        c->argv[2] = tryObjectEncoding(c->argv[2]);
        // 将key和value组成新的key-value对
        dbAdd(c->db,c->argv[1],c->argv[2]); 
        // 增加value的引用计数
        incrRefCount(c->argv[2]);
        // 返回vlaue的长度
        totlen = stringObjectLen(c->argv[2]);
    } else {
		// 获取到value
		// 如果value不是字符串类型的对象直接返回
        if (checkType(c,o,OBJ_STRING))
            return;
        /* "append" is an argument, so always an sds */
        // 获得追加的值对象
        append = c->argv[2];
        // 计算追加后的长度
        totlen = stringObjectLen(o)+sdslen(append->ptr);
        // 如果追加后的长度超出范围，则返回
        if (checkStringLength(c,totlen) != C_OK)
            return;
        // 因为要根据value修改key的值，因此如果key原来的值是共享的，需要解除共享，新创建一个值对象与key组对
        o = dbUnshareStringValue(c->db,c->argv[1],o);
        // 将vlaue对象的值后面追加上append的值
        o->ptr = sdscatlen(o->ptr,append->ptr,sdslen(append->ptr));
        // 计算出追加后值的长度
        totlen = sdslen(o->ptr);
    }
    // 当数据库的键被改动，则会调用该函数发送信号
    signalModifiedKey(c->db,c->argv[1]);
    // 发送"append"事件通知
    notifyKeyspaceEvent(NOTIFY_STRING,"append",c->argv[1],c->db->id);
    // 设置脏键
    server.dirty++;
    // 发送追加后value的长度给client
    addReplyLongLong(c,totlen);
}
```
