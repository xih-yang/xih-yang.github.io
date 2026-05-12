# 02、Redis 源码解析 - Redis Set命令实现学习
- 来源：https://ddkk.com/zhuanlan/db/redis/5/2.html
- 分类：缓存数据库
- 分组：教程目录
现在进入Redis源码的学习，首先我们先学习最简单的字符串文件，文件名是t_string.c，该文件在src目录下面，这个文件里面实现了set和get相关一系列命令的方法，今天着重来分析set命令的实现。

### 1 setGenericCommand

#### 1.1 命令说明

这是一个Set命令的通用实现，大部分的和Set类型的命令都是调用这个方法实现的。

#### 1.2 命令注释

学习这个命令代码之前，可以先看下官方注释说明

```java
/* The setGenericCommand() function implements the SET operation with different
 * options and variants. This function is called in order to implement the
 * following commands: SET, SETEX, PSETEX, SETNX.
 *
 * 'flags' changes the behavior of the command (NX or XX, see belove).
 *
 * 'expire' represents an expire to set in form of a Redis object as passed
 * by the user. It is interpreted according to the specified 'unit'.
 *
 * 'ok_reply' and 'abort_reply' is what the function will reply to the client
 * if the operation is performed, or when it is not because of NX or
 * XX flags.
 *
 * If ok_reply is NULL "+OK" is used.
 * If abort_reply is NULL, "$-1" is used. */
setGenericCommand()函数实现了不同的SET操作
*选项和变体。调用此函数是为了实现
*下面的命令:SET, SETEX, SETEX, SETNX。
*
* 'flags'改变命令的行为(NX或XX，见爱)。
*
* 'expire'表示通过Redis对象设置的过期时间
*由用户。它根据指定的“单元”进行解释。
*
* 'ok_reply'和'abort_reply'是函数将回复给客户端的内容
*如果操作被执行，或当它不是因为NX或
* XX标志。
*
*如果ok_reply是NULL，“+OK”被使用。
如果abort_reply为NULL，则使用"$-1"。*／
```

#### 1.2 命令源代码

```java
/**
* c 客户端
* flags 执行的命令类型
* key 键
* val 值
* expire 过期时间
* unit 过期时间的单位
* ok_reply 成功时，回复的内容 
* abort_reply 抛弃时，回复的内容
**/
void setGenericCommand(redisClient *c, int flags, robj *key, robj *val, robj *expire, int unit, robj *ok_reply, robj *abort_reply) {
    long long milliseconds = 0; /* initialized to avoid any harmness warning */
	//判断是否设置过期时间
    if (expire) {
        //获取过期时间，并判断过期时间格式是否正常
    	//将过期时间传入函数，并通过milliseconds拿到值
        if (getLongLongFromObjectOrReply(c, expire, &milliseconds, NULL) != REDIS_OK)
            return;
		//如果时间小于0，则报无效时间
		//in %s 代表当前执行的命令
        if (milliseconds <= 0) {
            addReplyErrorFormat(c,"invalid expire time in %s",c->cmd->name);
            return;
        }
        //如果单位是秒，时间乘以1000
        if (unit == UNIT_SECONDS) milliseconds *= 1000;
    }
	//如果类型是nx，则判断键是否已经存在，如果存在则返回空
	//如果类型是xx，则判断键是否不存在，如果不存在则返回空
    if ((flags & REDIS_SET_NX && lookupKeyWrite(c->db,key) != NULL) ||
        (flags & REDIS_SET_XX && lookupKeyWrite(c->db,key) == NULL))
    {
        addReply(c, abort_reply ? abort_reply : shared.nullbulk);
        return;
    }
    //设置Key
    setKey(c->db,key,val);
	//状态变更次数递增
    server.dirty++;
    //设置过期时间
    if (expire) setExpire(c->db,key,mstime()+milliseconds);
    //通知事件
    notifyKeyspaceEvent(REDIS_NOTIFY_STRING,"set",key,c->db->id);
	//通知事件
    if (expire) notifyKeyspaceEvent(REDIS_NOTIFY_GENERIC,"expire",key,c->db->id);
	//客户端响应内容，默认ok
    addReply(c, ok_reply ? ok_reply : shared.ok);
}
```

#### 1.3 代码理解

刚开始看到这一大段代码的时候是懵逼的，怎么调用了这么多其他的函数，而且也没有详细的注释，只能靠函数名和自己摸索去理解，不过这里我们先不要纠结每一个方法的具体实现，先弄清楚他大概干了什么就可以，后面逐渐深入理解就行。

从上面我标的中文注释可以看出这个方法大概做了下面几件事情。

**1、** 判断是否设置过期时间，如果设置过期时间，校验过期时间并且获取过期时间，设置过期时间单位格式；

**2、** 判断当前命令类型是否为xx或者nx，根据两者判断是否有值来决定能否做写入操作；

**3、** 设置Key,并递增变更数量，触发相关通知事件（后续会专门讨论，这里先知道有这个东西）；

**4、** 设置过期时间，触发相关通知事件（后续会专门讨论，这里先知道有这个东西）；

**5、** 客户端响应；

总结了这个方法实现的几件事情，大概就知道这个方法做得事了，有了初步了解相信大家和我一样有了不少信心，原来也没有那么难懂吗，后面不理解的地方我们就可以慢慢的逐步攻破。

上面的那个方法学习的差不多了，好奇的小伙伴肯定会问那个方法在哪里被调用到呢，不着急我们现在就来看看有哪个几个方法调用了它，我们知道redis命令有set、setnx、setex、psetex，这几个命令都有对应的方法，让我们来看看吧。其中set命令稍微有点复杂，我们先看其他几个简单的，最后面再介绍set命令。

### 2 setnxCommand

如果一个键不存在的时候才能设置成功，这个命令相信大家用过，我们先实践下这个命令。

#### 2.1 实践

可以看到成功的时候的是1，失败的时候返回的是0。

#### 2.2 命令源代码

```java
void setnxCommand(client *c) {
	//获取第三个参数
    c->argv[2] = tryObjectEncoding(c->argv[2]);
    setGenericCommand(c,OBJ_SET_NX,c->argv[1],c->argv[2],NULL,0,shared.cone,shared.czero);
}
```

#### 2.3 代码理解

这个方法先获取了我们输入命令的第三个参数就是要设置的值，对于这个tryObjectEncoding方法暂时我们先不讨论，可以大概理解他对我们的参数做了一些处理，最后拿到了这个值，然后将一系列参数传入了setGenericCommand这个方法。

我们可以把这个方法的入参拿过来比对一下，就知道他传了一些什么值，为什么传这些值进去。

```java
/**
* c 客户端
* flags 执行的命令类型
* key 键
* val 值
* expire 过期时间
* unit 过期时间的单位
* ok_reply 成功，回复内容 
* abort_reply 抛弃，回复内容
**/
void setGenericCommand(
client *c, int flags, robj *key, robj *val, robj *expire, int unit, robj *ok_reply, robj *abort_reply
) {
     }
setGenericCommand(c,OBJ_SET_NX,c->argv[1],c->argv[2],NULL,0,shared.cone,shared.czero);
```

形参
实参
说明

c
c
客户端

flags
OBJ_SET_NX
代表命令的类型，这里表示的是nx

key
c->argv[1]
输入命令的第二个参数，键，对应实践例子中的name

value
c->argv[2]
输入命令的第三个参数，值，对应实践例子中的rain

expire
NULL
过期时间，这里没有设置，故传NULL

unit
0
没有设置过期时间，故传0

ok_reply
shared.cone
成功返回值，这里传入的是1,

abort_reply
shared.czero
失败返回值，这里传入的是0

通过实参和形参的比较，我们可以理解setnxCommand和setGenericCommand的关系，也进一步理解了setGenericCommand的作用，

shared.cone和shared.czero这两个值在server.c里有定义，我这里可以先放出一部分定义的代码。

```java
void createSharedObjects(void) {
    int j;
    shared.crlf = createObject(OBJ_STRING,sdsnew("\r\n"));
    shared.ok = createObject(OBJ_STRING,sdsnew("+OK\r\n"));
    shared.err = createObject(OBJ_STRING,sdsnew("-ERR\r\n"));
    shared.emptybulk = createObject(OBJ_STRING,sdsnew("$0\r\n\r\n"));
    shared.czero = createObject(OBJ_STRING,sdsnew(":0\r\n"));
    shared.cone = createObject(OBJ_STRING,sdsnew(":1\r\n"));
    shared.cnegone = createObject(OBJ_STRING,sdsnew(":-1\r\n"));
}
```

### 3 setexCommand

设置一个字符串的时候，并且设置过期时间，单位是秒

#### 3.1 实践

可以看到第三个参数为过期时间，第四个参数为值，设置成功返回ok

#### 3.2 命令源代码

```java
void setexCommand(client *c) {
    c->argv[3] = tryObjectEncoding(c->argv[3]);
    setGenericCommand(c,OBJ_SET_NO_FLAGS,c->argv[1],c->argv[3],c->argv[2],UNIT_SECONDS,NULL,NULL);
}
```

#### 3.3 代码理解

参数对比

形参
实参
说明

c
c
客户端

flags
OBJ_SET_NO_FLAGS
代表命令的类型，这里代表没有类型

key
c->argv[1]
输入命令的第二个参数，键，对应实践例子中的name

value
c->argv[3]
输入命令的第四个参数，值，对应实践例子中的rain

expire
NULL
输入命令的第三个参数，值，对应实践例子中的200

unit
0
这里单位是秒，故传UNIT_SECONDS

ok_reply
NULL
成功返回值，这里没有传，则返回默认值OK

abort_reply
NULL
失败返回值，这里没有传，则返回默认值0

可以看出来和上面setnxCommand大同小异。

### 4 psetexCommand

设置一个字符串的时候，并且设置过期时间，单位是毫秒

#### 4.1 实践

可以看到第三个参数为过期时间，第四个参数为值，设置成功返ok。

#### 4.2 命令源代码

```java
void psetexCommand(client *c) {
    c->argv[3] = tryObjectEncoding(c->argv[3]);
    setGenericCommand(c,OBJ_SET_NO_FLAGS,c->argv[1],c->argv[3],c->argv[2],UNIT_MILLISECONDS,NULL,NULL);
}
```

#### 4.3 代码理解

对比两个方法，我们可以看到 psetexCommand 与 setexCommand 基本没有区别，唯一的区别就是单位不同，一个是UNIT_MILLISECONDS，一个是UNIT_SECONDS，setGenericCommand通过这个参数来设置具体的过期时间。

### 5 setCommand

**Redis版本：3.0**

可以设置一个字符串，不过这个命令比较灵活，可以有多种输入命令的方式，所以放到最后面来讲。

在3.0中，这个命令可以将 [nx]、[ex]、[px]相互组合，且重复也没有关系，如果都设置了过期时间，最后面的会覆盖前面的过期时间。

在3.2后面，nx和ex会互斥，ex和px会互斥。

```java
set name rain
set name rain nx
set name rain xx
set name rain ex 100
set name rain px 10000
set name rain nx ex 100
set name rain nx px 1000
set name rain ex 100 px 10000
set name rain nx ex 100 px 10000
set name rain ex 100 px 10000 ex 5
```

#### 5.1 实践

这里有个注意事项，需要注意，我们研究的Redis源码一定要和当前我们运行的Redis版本要一致，要不然就会出现理论和实际不一致的情况，上面这些我是运行在3.0版本上的，但是刚开始我研究的源代码是3.2的，3.2的里面nx和xx，px和ex是互斥的，但是我运行的时候又没事，浪费我不少时间我还以为是代码有问题，所以后来我就把源代码换成3.0的，后续都以3.0的来研究。

#### 5.2 命令源代码

##### 5.2.1 3.0 版本

```java
void setCommand(client *c) {
    int j;
    robj *expire = NULL;
    int unit = UNIT_SECONDS;
    int flags = REDIS_SET_NO_FLAGS;
    for (j = 3; j < c->argc; j++) {
        char *a = c->argv[j]->ptr;
        robj *next = (j == c->argc-1) ? NULL : c->argv[j+1];
        if ((a[0] == 'n' || a[0] == 'N') &&
            (a[1] == 'x' || a[1] == 'X') && a[2] == '\0') {
            flags |= REDIS_SET_NX;
        } else if ((a[0] == 'x' || a[0] == 'X') &&
                   (a[1] == 'x' || a[1] == 'X') && a[2] == '\0') {
            flags |= REDIS_SET_XX;
        } else if ((a[0] == 'e' || a[0] == 'E') &&
                   (a[1] == 'x' || a[1] == 'X') && a[2] == '\0' && next) {
            unit = UNIT_SECONDS;
            expire = next;
            j++;
        } else if ((a[0] == 'p' || a[0] == 'P') &&
                   (a[1] == 'x' || a[1] == 'X') && a[2] == '\0' && next) {
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
```

##### 5.2.2 3.2版本

```java
void setCommand(client *c) {
    int j;
    robj *expire = NULL;
    int unit = UNIT_SECONDS;
    int flags = OBJ_SET_NO_FLAGS;
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

##### 5.2.3 两者差异

可以看到3.0版本是没有互斥校验的，意味着nx和xx可以同时输入，ex和px也可以同时输入，就导致了后面px会覆盖前面的ex，所以研究源码也要一定运行相同版本的Redis要不然容易翻车。

#### 5.3 代码理解

这个set命令看起来比之前的setnxCommand、setexCommand、psetexCommand要复杂得多，不过也不要害怕，核心逻辑还是差不多，之所以看起复杂，是因为前面大部分逻辑用来判断set的flags，也正是因为这样set命令才能灵活多变，可以支持nx、ex、 px灵活组合和重复组合。

可以看下几个标记的常量定义

```java
#define REDIS_SET_NO_FLAGS 0
#define REDIS_SET_NX (1<<0)     /* Set if key not exists. */
#define REDIS_SET_XX (1<<1)     /* Set if key exists. */
```

### 6 总结

#### 6.1 方法汇总

这一次我们总共学习了5个方法，分别是

- setGenericCommand ：set命令通用方法
- setCommand ：set命令实现方法
- setnxCommand ：setnx命令实现方法
- setexCommand ：setex命令实现方法
- psetexCommand：psetex命令实现方法

#### 6.2 调用路径
