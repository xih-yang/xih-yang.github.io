# 04、Redis 源码解析 - Redis incr、decr相关命令实现学习
- 来源：https://ddkk.com/zhuanlan/db/redis/5/4.html
- 分类：缓存数据库
- 分组：教程目录
学习完两个常用命令get和set命令，再来看下另外几个命令incr、decr、incrby、decrby的代码实现。

### 1 incrDecrCommand

#### 1.1 方法说明

这个方法是incr、decr、incrby、decrby等命令的基础方法。

#### 1.2 方法源代码

```java
void incrDecrCommand(redisClient *c, long long incr) {
    long long value, oldvalue;
    robj *o, *new;
    o = lookupKeyWrite(c->db,c->argv[1]);
    if (o != NULL && checkType(c,o,REDIS_STRING)) return;
    if (getLongLongFromObjectOrReply(c,o,&value,NULL) != REDIS_OK) return;
    oldvalue = value;
    //判断要递增的值是否超过 long long类型的最大值和最小值
    //LLONG_MAX:9223372036854775807
    //LLONG_MIN:-9223372036854775808
    if ((incr < 0 && oldvalue < 0 && incr < (LLONG_MIN-oldvalue)) ||
        (incr > 0 && oldvalue > 0 && incr > (LLONG_MAX-oldvalue))) {
        addReplyError(c,"increment or decrement would overflow");
        return;
    }
	//递增值
    value += incr;
	//判断递增后的值为共享数据
	//#define REDIS_SHARED_INTEGERS 10000(redis.h)
    if (o && o->refcount == 1 && o->encoding == REDIS_ENCODING_INT &&
        (value < 0 || value >= REDIS_SHARED_INTEGERS) &&
        value >= LONG_MIN && value <= LONG_MAX)
    {
        new = o;
        o->ptr = (void*)((long)value);
    } else {
        new = createStringObjectFromLongLong(value);
        if (o) {
            dbOverwrite(c->db,c->argv[1],new);
        } else {
            dbAdd(c->db,c->argv[1],new);
        }
    }
    //标记键已被修改
    signalModifiedKey(c->db,c->argv[1]);
	//通知事件
    notifyKeyspaceEvent(REDIS_NOTIFY_STRING,"incrby",c->argv[1],c->db->id);
    //变更状态递增
    server.dirty++;
	//响应新的值
    addReply(c,shared.colon);
    addReply(c,new);
    addReply(c,shared.crlf);
}
```

#### 1.3 代码理解

可以看到这个方法主要做了几件事。

**1、** 先拿到键值对象；

**2、** 拿到原来的值；

**3、** 判断接下来的递增是否超过最大值或者最小值；

**4、** 判断新值是否为共享数据，如果是则直接共享值，不是则新建一个值；

**5、** 标记键已被修改；

**6、** 通知事件；

**7、** 响应新的值；

可能我们以为一个简单递增和递减应该就简单的做下加减法就行了，可是没想到Redis内部还是做了还是这么多事，这段代码里相信大家和我一样有很多疑惑，比如下面几个。

- 为什么要判断共享数据
- 为什么要标记键已被修改
- 为什么通知事件，什么是通知事件。
- 响应为什么要连续写好几个方法。

通过学习前两天的学习，我们不难发现这里面大部分的方法都有这些东西，我们先不着急探究他们具体的实现，先大概知道有这个东西，关于每次学习的疑问我们也要总结记录下来，在合适的篇章慢慢揭开它神秘的面纱，目前我们还是先整体再局部、先大局再细节。

### 2 incrCommand

#### 2.1 命令说明

对一个键进行递增

#### 2.2 实践

#### 2.3 命令源代码

```java
void incrCommand(redisClient *c) {
    incrDecrCommand(c,1);
}
```

#### 2.4 代码理解

可以看到这个命令的实现很简单，直接调用了incrDecrCommand这个基础方法，并且传入递增参数1，实现了递增1的逻辑。

### 3 decrCommand

#### 3.1 命令说明

对一个键进行递减

#### 3.2 实践

#### 3.3 命令源代码

```java
void decrCommand(redisClient *c) {
    incrDecrCommand(c,-1);
}
```

#### 3.4 代码理解

可以看到这个命令的实现很简单，和incrCommand大同小异，也是调用了incrDecrCommand这个基础方法，只不过传入的参数不同，这次传入的是-1。

### 4 incrbyCommand

#### 4.1 命令说明

对一个键加一个指定的数字

#### 4.2 实践

#### 4.3 命令源代码

```java
void incrbyCommand(redisClient *c) {
    long long incr;
	//获取要加的数值，并且数值是否为long long型
    if (getLongLongFromObjectOrReply(c, c->argv[2], &incr, NULL) != REDIS_OK) return;
    incrDecrCommand(c,incr);
}
```

#### 4.4 代码理解

因为这个命令可以加指定的数字，所以这里要先获取加的值，并且判断数值的类型是否为Long Long类型，如果符合条件就调用IncrDecrCommand，如果不为Long Long类型就会报错，例如下面。

getLongLongFromObjectOrReply 这个方法我们似乎经常遇到，目前就理解它能获取一个数值并且校验和响应就行，后续会详细地介绍它的具体实现。

### 5 decrbyCommand

#### 5.1 命令说明

对一个键减一个指定的数字

#### 5.2 实践

#### 5.3 命令源代码

```java
void decrbyCommand(redisClient *c) {
    long long incr;
    if (getLongLongFromObjectOrReply(c, c->argv[2], &incr, NULL) != REDIS_OK) return;
    incrDecrCommand(c,-incr);
}
```

#### 5.4 代码理解

这个命令代码实现大体和incrbyCommand相同，也是先获取值，然后调用incrDecrCommand，不同的是这里会在传入参数的时候在参数上加一个负数，以此来达到减法的目的。

### 6 总结

**1、** incr、decr、incrby、decrby几个命令的基础方法都是incrDecrCommand；

**2、** getLongLongFromObjectOrReply可以用来获取数值和校验数值；

**3、** 键被修改的时候会被标记；

**4、** 键被递增之后会触发一个递增的通知事件；

**5、** redis默认1到10000的数字是共享数据，不会重新建立新的空间来存储它们；
