# 05、Redis 源码解析 - Redis 学习总结
- 来源：https://ddkk.com/zhuanlan/db/redis/5/5.html
- 分类：缓存数据库
- 分组：教程目录
经过几天的学习，我们差不多把t_string.c这个文件的一些方法都学习了一遍，也有了不少的收获，我们今天简单的总结一下我们究竟学到了哪些东西或者了解了哪些东西。

### 1 方法列表

我们先回顾下这个文件的方法列表

```java
//set相关方法
void setGenericCommand(redisClient *c, int flags, robj *key, robj *val, robj *expire, int unit, robj *ok_reply, robj *abort_reply)
void setCommand(redisClient *c)
void setnxCommand(redisClient *c)
void setexCommand(redisClient *c)
void psetexCommand(redisClient *c)
//get相关方法    
int getGenericCommand(redisClient *c)
void getCommand(redisClient *c)
void getsetCommand(redisClient *c)
void setrangeCommand(redisClient *c)
void getrangeCommand(redisClient *c)
void mgetCommand(redisClient *c)
void msetGenericCommand(redisClient *c, int nx)
void msetCommand(redisClient *c)
void msetnxCommand(redisClient *c)
//incr、decr相关方法
void incrDecrCommand(redisClient *c, long long incr)
void incrCommand(redisClient *c)
void decrCommand(redisClient *c)
void incrbyCommand(redisClient *c)
void decrbyCommand(redisClient *c)
void incrbyfloatCommand(redisClient *c)
void appendCommand(redisClient *c)
void strlenCommand(redisClient *c)
```

可以看到这些方法中，我们已经学习了大部分，相信带着之前的学习经验，剩下的方法再去逐一攻破也不是难点。

### 2 发现规律

根据我们几天的学习，我们可以简单总结下发现的规律。

**1、** 方法名包含Command的是命令的实现方法，所以以后看到哪个方法名中包含Command，那么这个一定是某个命令，比如setCommand、getCommand；

**2、** set相关的命令都是调用setGenericCommand这个通用方法；

**3、** incr、decr相关的命令都是调用incrDecrCommand这个通用方法；

**4、** 基本很多方法里都会有通知事件，调用notifyKeyspaceEvent，其中事件类型包括set、expire、setrange、incrby、incrbyfloat、append，可见redis中会有各种各样的通知事件；

**5、** 响应方法大多数是addReply，也有其他类似的方法，比如addReplyBulk、addReplyError、addReplyLongLong、addReplyBulkCBuffer、addReplyMultiBulkLen，可见光响应函数Redis都有好多种，每种方法略微不同但又分工明确；

**6、** 基本所有的方法都包含有一个参数redisClient，Redis客户端似乎这个参数中维护很多内容；

**7、** Redis中获取整数对象多次使用getLongLongFromObjectOrReply这个方法；

### 3 学习感悟

总结完规律，再总结下我的一些学习感悟。

#### 3.1 方法复用性

通过观察，可以发现Redis的代码复用性还是很高的，很多方法拆的很细，即使只有略微的差异也会是两个方法，非常符合单一原则，一个方法只做一件事情，这样非常利于扩展和维护。

例如下面两个方法，基本没有什么差距，只是参数不同。

```java
void incrCommand(redisClient *c) {
    incrDecrCommand(c,1);
}
void decrCommand(redisClient *c) {
    incrDecrCommand(c,-1);
}
```

所以我们平常在写代码的时候，尽量也要遵守单一原则，一个方法最好只做一件事情。

#### 3.2 方法命名

经过一番阅读，可以看到Redis里面的一些方法命名大多数都比较简明明了、简短，不过也有一些方法也比较长，但是不多。这样的好处是阅读起来比较轻松一点，如果全是一堆又臭又长的方法名变量名混在一起就像一篇乱七八糟的文章一样难以阅读。

#### 3.3 段落感

仔细阅读代码的朋友不难发现，Redis的代码基本保持了段落感，一段逻辑与另外一段逻辑之间会有一行的间距，这样既不会显得过于拥挤，也不会显得过于分散，恰当好处，可以看下面一个片段的例子。

```java
void getrangeCommand(redisClient *c) {
    robj *o;
    long long start, end;
    char *str, llbuf[32];
    size_t strlen;
    if (getLongLongFromObjectOrReply(c,c->argv[2],&start,NULL) != REDIS_OK)
        return;
    if (getLongLongFromObjectOrReply(c,c->argv[3],&end,NULL) != REDIS_OK)
        return;
    if ((o = lookupKeyReadOrReply(c,c->argv[1],shared.emptybulk)) == NULL ||
        checkType(c,o,REDIS_STRING)) return;
    if (o->encoding == REDIS_ENCODING_INT) {
        str = llbuf;
        strlen = ll2string(llbuf,sizeof(llbuf),(long)o->ptr);
    } else {
        str = o->ptr;
        strlen = sdslen(str);
    }
    /* Convert negative indexes */
    if (start < 0) start = strlen+start;
    if (end < 0) end = strlen+end;
    if (start < 0) start = 0;
    if (end < 0) end = 0;
    if ((unsigned long long)end >= strlen) end = strlen-1;
    /* Precondition: end >= 0 && end < strlen, so the only condition where
     * nothing can be returned is: start > end. */
    if (start > end || strlen == 0) {
        addReply(c,shared.emptybulk);
    } else {
        addReplyBulkCBuffer(c,(char*)str+start,end-start+1);
    }
}
```

#### 4 疑问点

学习了一个源文件，了解了不少命令的实现方式，但也只是大概的了解了下大方向，还有很多细节我们没有深究，这里整理下我在学习中遇到的一些疑问点，方便日后逐个攻破。

**1、** redisClient这个参数是干什么的，具体内容是什么？；

**2、** 为什么每个方法都要传redisClient这个参数？；

**3、** addReply是怎么将信息响应到客户端的？；

**4、** getLongLongFromObjectOrReply这个方法的具体实现是什么？；

**5、** 通知事件有什么用，在哪里用到？；

**6、** 这个文件中的这些命令又在哪里被调用？；

这些问题，都要慢慢解决并了解，但因为这些问题涉及的文件比较多，我们还是写按部就班一步步学习，等待实在需要了解它们了，再来一个个的探究。
