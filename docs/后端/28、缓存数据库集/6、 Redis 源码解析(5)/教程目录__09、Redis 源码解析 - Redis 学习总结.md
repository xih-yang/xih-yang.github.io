# 09、Redis 源码解析 - Redis 学习总结
- 来源：https://ddkk.com/zhuanlan/db/redis/5/9.html
- 分类：缓存数据库
- 分组：教程目录
时间过的真快呀，一眨眼又过去了好几天，这几天我们学习了t_list.c文件不少方法，趁今天来总结一番。

### 1 方法列表

先看一下这个文件都有哪些方法

```java
/*-----------------------------------------------------------------------------
 * List API
 *----------------------------------------------------------------------------*/
void listTypeTryConversion(robj *subject, robj *value)
void listTypePush(robj *subject, robj *value, int where)
robj *listTypePop(robj *subject, int where)
unsigned long listTypeLength(robj *subject)
listTypeIterator *listTypeInitIterator(robj *subject, long index, unsigned char direction)
int listTypeNext(listTypeIterator *li, listTypeEntry *entry)
robj *listTypeGet(listTypeEntry *entry)
void listTypeInsert(listTypeEntry *entry, robj *value, int where)
int listTypeEqual(listTypeEntry *entry, robj *o)
void listTypeDelete(listTypeEntry *entry)
void listTypeConvert(robj *subject, int enc)
/*-----------------------------------------------------------------------------
 * List Commands
 *----------------------------------------------------------------------------*/
void pushGenericCommand(redisClient *c, int where)
void lpushCommand(redisClient *c)
void rpushCommand(redisClient *c)
void pushxGenericCommand(redisClient *c, robj *refval, robj *val, int where)
void lpushxCommand(redisClient *c)
void rpushxCommand(redisClient *c)
void linsertCommand(redisClient *c)
void llenCommand(redisClient *c)
void lindexCommand(redisClient *c)
void lsetCommand(redisClient *c)
void popGenericCommand(redisClient *c, int where)
void lpopCommand(redisClient *c)
void rpopCommand(redisClient *c)
void lrangeCommand(redisClient *c)
void ltrimCommand(redisClient *c)
void lremCommand(redisClient *c)
void rpoplpushHandlePush(redisClient *c, robj *dstkey, robj *dstobj, robj *value)
void rpoplpushCommand(redisClient *c)
void blockForKeys(redisClient *c, robj **keys, int numkeys, mstime_t timeout, robj *target)
void unblockClientWaitingData(redisClient *c)
void signalListAsReady(redisDb *db, robj *key)
int serveClientBlockedOnList(redisClient *receiver, robj *key, robj *dstkey, redisDb *db, robj *value, int where)
void handleClientsBlockedOnLists(void)
void blockingPopGenericCommand(redisClient *c, int where)
void blpopCommand(redisClient *c)
void brpopCommand(redisClient *c)
void brpoplpushCommand(redisClient *c)
```

### 2 学习回顾

t_list.c实现了很多方法，因为我们是刚开始学习源码，所以没有一下子选择全部阅读学习，而是挑了一些常用的命令先学习，共学习了以下一些方法。

```java
void listTypeTryConversion(robj *subject, robj *value)
void listTypePush(robj *subject, robj *value, int where)
robj *listTypePop(robj *subject, int where)
unsigned long listTypeLength(robj *subject)
void listTypeConvert(robj *subject, int enc)
void pushGenericCommand(redisClient *c, int where)
void lpushCommand(redisClient *c)
void rpushCommand(redisClient *c)
void llenCommand(redisClient *c)
void lindexCommand(redisClient *c)
void popGenericCommand(redisClient *c, int where)
void lpopCommand(redisClient *c)
void rpopCommand(redisClient *c)
void lrangeCommand(redisClient *c)
```

### 3 学习总结

**1、** 列表的底层数据结构由两种实现方式，一种是压缩表，另一种是链表；

**2、** 列表的底层数据结构默认使用压缩表，达到某种条件会触发转换动作；

**3、** 触发数据结构转换的条件有：如果值类型不符合则会转换，如果元素的个数超过配置也会转换意味着每次推入一个元素都会检查是否要转换数据结构；

**4、** lpush和rpush命令都是调用了pushGenericCommand这个方法，只不过通过位置参数控制推入的位置；

**5、** 推入元素会标记列表键被修改，并且触发通知事件；

**6、** server.dirty增加的是推入元素的数量；

**7、** lpop、rpop都会调用popGenericCommand这个方法每次弹出一个元素，先获取元素，然后再删除这个元素；

**8、** 如果整个列表没有元素了，就会把列表删除获取键对象会调用lookupKeyWriteOrReply方法；

**9、** listType前缀的方法都是对核心逻辑的封装方法，表示会被多处调用，例如listTypeLength；

**10、** 如果不需要多处调用，则会直接把核心逻辑写在Command方法里；

**11、** 链表结构查找一个元素比较麻烦；

**12、** 客户端输入的命令放在c->argv这个参数里，例如c->argv[1]、c->argv[2]；

### 4 学习感悟

#### 4.1 数据结构

学习完 t_list.c 代码之后，对比t_string.c发现有很大的不同，在 t_list.c中充分体现了作者用了两种数据结构来实现列表，一种是压缩表，一种是链表，很多命令的方法都做了两者的兼容，使代码看起来颇为复杂，不过存在即合理，作者肯定有这样做的理由。

既然存在两种数据结构，肯定就存在什么时候用压缩表，什么时候用链表，无疑代码是最好的答案，在一些方法里出现了是否要转换数据结构的判断，通过代码我们可以制动在一定数量下列表使用压缩表，超过数量后会触发转换动作，将压缩表转换为链表。

用两种数据结构肯定有作者的理由，可能是为了节省内存亦或是提高性能等等考虑，但是这样做无疑提高了代码的复杂程度，也降低了代码的维护性，等于每次都有可能改变两种数据结构的相关方法，这样做无疑是比较累的，那有没有哪一种数据结构可以实现这两者的优点呢。

#### 4.2 风格习惯

阅读 t_string.c 的时候可以说是一脸懵逼，在阅读的 t_list.c 感觉又是一番新大陆，一下又接触了很多新东西，不过在两个文件中看到很多类似的东西，比如写法、判断、逻辑、判断，就好比天天和一个人说话一样，久而久之你就习惯了他的说话风格，可能都知道接下来他要说什么。

虽然很多东西我们还没有细细的去研究和探索，但是我们已经大概知道做某些事情的时候会做一些什么事情，比如触发通知事件、标记键被修改、响应结果、校验参数、获取键对象、获取参数等等操作，光看类型的方法名字大概也知道他是做什么的，这让后面的代码阅读轻松了不少。

这也给我们平时写代码一个思考，写代码也要养成一个好的风格习惯，让相同类似的事情明显就能看出来，而不是每次命名都是毫不相干。

### 5 疑问点

**1、** 为什么列表要使用两种数据结构来实现？；

**2、** 为什么不直接就用一种数据结构来实现？；

**3、** 两种数据结构的优点和缺点是什么？；

**4、** server.dirty有什么用，为什么每次都要更新这个值？；

**5、** 为什么每次修改键之后，都要标记这个键被修改过；
