# 06、Redis 源码解析 - Redis rpush、lpush命令实现学习
- 来源：https://ddkk.com/zhuanlan/db/redis/5/6.html
- 分类：缓存数据库
- 分组：教程目录
### 前言

大体学习完t_string.c的代码，我们正式进入下一个文件的学习，这一次我们学习的是t_list.c文件，从文件名我们可以知道这是一个关于列表的相关命令的源代码。

在学习列表命令之前，这里要介绍一下，在Redis中列表的底层数据结构由压缩表和链表实现，所以在今天的学习中会发现大量的底层数据结构判断，根据不同的数据结构使用不同的方法。不过这里要注意的是，这里是基于3.0版本的源代码，3.2版本之后发生了变化，3.2版本之后使用了快速表来实现。

### 1 pushGenericCommand

#### 1.1 方法说明

这是一个lpush、rpush命令的基础方法，两个命令都会调用这个方法。

#### 1.2 方法源代码

```java
void pushGenericCommand(redisClient *c, int where) {
    int j, waiting = 0, pushed = 0;
	//获取列表对象
    robj *lobj = lookupKeyWrite(c->db,c->argv[1]);
	//如果对象的类型不为列表，报类型错误
    if (lobj && lobj->type != REDIS_LIST) {
        addReply(c,shared.wrongtypeerr);
        return;
    }
	//遍历推入的元素
    for (j = 2; j < c->argc; j++) {
        c->argv[j] = tryObjectEncoding(c->argv[j]);
		//如果列表不存在，则创建一个压缩表对象
        if (!lobj) {
            lobj = createZiplistObject();
            dbAdd(c->db,c->argv[1],lobj);
        }
		//调用列表推入元素方法
        listTypePush(lobj,c->argv[j],where);
        pushed++;
    }
	//返回列表的元素总个数
    addReplyLongLong(c, waiting + (lobj ? listTypeLength(lobj) : 0));
    //如果推入了元素
    //标记键被修改，并发送通知事件
    if (pushed) {
    	//判断事件类型
        char *event = (where == REDIS_HEAD) ? "lpush" : "rpush";
		//标记键被修改	
        signalModifiedKey(c->db,c->argv[1]);
		//通知事件
        notifyKeyspaceEvent(REDIS_NOTIFY_LIST,event,c->argv[1],c->db->id);
    }
	//改变状态值增加
    server.dirty += pushed;
}
```

#### 1.3 代码理解

可以看到pushGenericCommand总共做了以下几件事情

**1、** 获取键对象；

**2、** 判断键对象的类型是否为列表类型；

**3、** 遍历推入的元素，一个个的推入列表中；

**4、** 如果列表不存在，则创建一个压缩表对象，可以看到列表默认会使用压缩表作为底层数据结构；

**5、** 调用listTypePush将元素推入列表中；

**6、** 返回列表的总数量；

**7、** 如果推入了元素，则标记键已被修改，并且触发通知事件；

**8、** 记录更改状态值；

这里个人有一点不太明白的是，不知道为什么这里判断列表对象不存在的逻辑要写在循环里，而不是写在外面，可能作者有其他的考量。

### 2 listTypePush

#### 2.1 方法说明

这个方法可以说是实现push命令的核心方法了，根据列表的底层数据结构调用不同的方法来推入元素。

#### 2.2 方法源代码

```java
void listTypePush(robj *subject, robj *value, int where) {
    /* Check if we need to convert the ziplist */
	//检查该值是否会引起数据结构变化
    listTypeTryConversion(subject,value);
	//检查列表的长度是否超过等于压缩表最大值
	//如果是的话，需要转变数据结构为链表
    if (subject->encoding == REDIS_ENCODING_ZIPLIST &&
        ziplistLen(subject->ptr) >= server.list_max_ziplist_entries)
            listTypeConvert(subject,REDIS_ENCODING_LINKEDLIST);
	//如果数据结构是压缩表
	//则调用压缩表相关方法推入元素
    if (subject->encoding == REDIS_ENCODING_ZIPLIST) {
        int pos = (where == REDIS_HEAD) ? ZIPLIST_HEAD : ZIPLIST_TAIL;
        value = getDecodedObject(value);
        subject->ptr = ziplistPush(subject->ptr,value->ptr,sdslen(value->ptr),pos);
        decrRefCount(value);
    }
    //如果数据结构是链表 
    //则调用链表相关方法推入元素
    else if (subject->encoding == REDIS_ENCODING_LINKEDLIST) {
        if (where == REDIS_HEAD) {
            listAddNodeHead(subject->ptr,value);
        } else {
            listAddNodeTail(subject->ptr,value);
        }
        incrRefCount(value);
    } else {
        redisPanic("Unknown list encoding");
    }
}
```

#### 2.3 代码理解

这个方法做了以下几件事情

**1、** 判断当前值的类型，是否会引起底层数据结构变化；

**2、** 判断当前压缩列表的元素个数是否超过了配置，如果超过了配置则要转变底层数据结构为链表；

**3、** 如果当前数据结构为压缩表，则调用压缩表相关方法推入元素；

**4、** 如果当前数据结构为链表，则调用链表相关方法推入元素；

### 3 lpushCommand

#### 3.1 命令说明

向列表的头部插入一个元素，成功返回列表元素的个数

#### 3.2 命令实践

#### 3.3 命令源代码

```java
void lpushCommand(redisClient *c) {
    pushGenericCommand(c,REDIS_HEAD);
}
```

#### 3.4 代码理解

可以看到lpushCommand没有过多其他的代码，直接调用了pushGenericCommand这个方法，并传入了一个参数REDIS_HEAD表示是从头部推入元素，这个参数在redis.h文件里有定义。

```java
#define REDIS_HEAD 0
#define REDIS_TAIL 1
```

### 4 rpushCommand

#### 4.1 命令说明

向列表的尾部插入一个元素，成功返回列表元素的个数

#### 4.2 命令实践

#### 4.3 命令源代码

```java
void rpushCommand(redisClient *c) {
    pushGenericCommand(c,REDIS_TAIL);
}
```

#### 4.4 代码理解

可以看到rpushCommand也是直接调用了pushGenericCommand这个方法，并传入了一个参数REDIS_TAIL表示是从尾部推入元素。

### 5 总结

**1、** 列表的底层数据结构由两种实现方式，一种是压缩表，另一种是链表；

**2、** 列表的底层数据结构默认使用压缩表，达到某种条件会触发转换动作；

**3、** 触发数据结构转换的条件有：如果值类型不符合则会转换，如果元素的个数超过配置也会转换；

**4、** 意味着每次推入一个元素都会检查是否要转换数据结构；

**5、** lpush和rpush命令都是调用了pushGenericCommand这个方法，只不过通过位置参数控制推入的位置；

**6、** 推入元素会标记列表键被修改，并且触发通知事件；

**7、** server.dirty增加的是推入元素的数量；
