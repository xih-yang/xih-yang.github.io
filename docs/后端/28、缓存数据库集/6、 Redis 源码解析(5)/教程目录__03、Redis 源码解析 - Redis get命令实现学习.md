# 03、Redis 源码解析 - Redis get命令实现学习
- 来源：https://ddkk.com/zhuanlan/db/redis/5/3.html
- 分类：缓存数据库
- 分组：教程目录
昨天我们学习了t_string.c代码文件中 get 的相关方法，相信大家已经熟悉不了少 redis 代码的风格和结构，所以今天趁热打铁继续学习剩下的一些方法，由于方法还是比较多的，我们就先学习主要并且我们常用的一个命令 get ，刚好和昨天 set 相对应起来。

### 1 getGenericCommand

#### 1.1 方法说明

这是get方法的一个通用方法，get命令通过调用这个方法来获取值

#### 1.2 命令源代码

```java
int getGenericCommand(redisClient *c) {
    robj *o;
	//获取当前值的对象，如果为空，响应空
    if ((o = lookupKeyReadOrReply(c,c->argv[1],shared.nullbulk)) == NULL)
        return REDIS_OK;
	//如果值的对象不是string类型，则报错
    if (o->type != REDIS_STRING) {
        addReply(c,shared.wrongtypeerr);
        return REDIS_ERR;
    }
	//响应值，并返回Ok 
    else {
        addReplyBulk(c,o);
        return REDIS_OK;
    }
}
```

#### 1.3 代码理解

可以看到这个getGenericCommand方法明显没有setGenericCommand方法复杂，从代码里大概可以看到这个方法主要做了下面几件事情。

**1、** 先获取值的对象，如果为空，直接返回空；

**2、** 如果获取到值，则判断值得类型是否为字符串，不是字符串则报错；

**3、** 如果是字符串，则传入响应函数中，响应值出来；

### 2 getCommand

#### 1.1 命令说明

获取一个字符串键的值。

#### 1.2 实践

#### 1.3 命令源代码

```java
void getCommand(redisClient *c) {
    getGenericCommand(c);
}
```

#### 1.4 代码理解

没有花里胡哨的东西，就直接调用了getGenericCommand命令。

### 3 总结

get命令主要就是这2个方法，看到这里是不是觉得太简单，好像理解了这两个方法也没有啥样，还是不知道Redis是如何具体运作的。

不急，我们要慢慢学习、慢慢消化、先把一些大方向的东西学习了，再慢慢学习一些难以攻克的方法，最后再串联在一起，犹如拼图一样，我们现在的状态就像刚开始拼图一样，才东拼西凑拼了两块碎片，离拼完一整张地图还很遥远呢。
