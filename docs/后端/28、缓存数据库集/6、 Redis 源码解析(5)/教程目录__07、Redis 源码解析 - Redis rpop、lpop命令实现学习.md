# 07、Redis 源码解析 - Redis rpop、lpop命令实现学习
- 来源：https://ddkk.com/zhuanlan/db/redis/5/7.html
- 分类：缓存数据库
- 分组：教程目录
### 1 popGenericCommand

#### 1.1 方法说明

这是一个lpop、rpop命令的基础方法，两个命令都会调用这个方法。

#### 1.2 方法源代码

```java
void popGenericCommand(redisClient *c, int where) {
	//获取列表键对象
    robj *o = lookupKeyWriteOrReply(c,c->argv[1],shared.nullbulk);
	//检查对象
    if (o == NULL || checkType(c,o,REDIS_LIST)) return;
	//获取弹出的值
    robj *value = listTypePop(o,where);
	//如果值为null，响应空
    if (value == NULL) {
        addReply(c,shared.nullbulk);
    } 
	//如果值不为null
	else {
		//判断事件
        char *event = (where == REDIS_HEAD) ? "lpop" : "rpop";
		//响应弹出的值
        addReplyBulk(c,value);
		//减少值得引用
        decrRefCount(value);
		//通知事件
        notifyKeyspaceEvent(REDIS_NOTIFY_LIST,event,c->argv[1],c->db->id);
        //如果列表键长度为0 ，则触发删除通知事件，并且删除这个键
		if (listTypeLength(o) == 0) {
            notifyKeyspaceEvent(REDIS_NOTIFY_GENERIC,"del",
                                c->argv[1],c->db->id);
            dbDelete(c->db,c->argv[1]);
        }
		//标记键被修改
        signalModifiedKey(c->db,c->argv[1]);
		//修改状态值递增
        server.dirty++;
    }
}
```

#### 1.3 代码理解

这个方法总共做了这几件事

**1、** 获取列表键对象；

**2、** 检查对象是否为Null,或者类型是否为列表类型；

**3、** 调用listTypePop方法，获取弹出的值；

**4、** 如果值为Null,则响应null；

**5、** 判断事件类型，触发通知事件；

**6、** 如果列表全部弹出，则要删除列表键，并且触发删除通知事件；

**7、** 标记列表键被修改；

**8、** 修改状态值递增；

### 2 listTypePop

#### 2.1 方法说明

这个方法可以说是实现pop命令的核心方法了，根据列表的底层数据结构调用不同的方法来弹出元素。

#### 2.2 方法源代码

```java
robj *listTypePop(robj *subject, int where) {
    robj *value = NULL;
    //如果数据结构是压缩表
    if (subject->encoding == REDIS_ENCODING_ZIPLIST) {
        unsigned char *p;
        unsigned char *vstr;
        unsigned int vlen;
        long long vlong;
        int pos = (where == REDIS_HEAD) ? 0 : -1;
        p = ziplistIndex(subject->ptr,pos);
        if (ziplistGet(p,&vstr,&vlen,&vlong)) {
            if (vstr) {
                value = createStringObject((char*)vstr,vlen);
            } else {
                value = createStringObjectFromLongLong(vlong);
            }
            /* We only need to delete an element when it exists */
            subject->ptr = ziplistDelete(subject->ptr,&p);
        }
    }
    // 如果数据结构是链表
	else if (subject->encoding == REDIS_ENCODING_LINKEDLIST) {
        list *list = subject->ptr;
        listNode *ln;
        //获取链表头/尾指针
        if (where == REDIS_HEAD) {
            ln = listFirst(list);
        } else {
            ln = listLast(list);
        }
        //如果指针不为空，则获取链表节点
        //增加值得引用
        //删除该节点
        if (ln != NULL) {
            value = listNodeValue(ln);
            incrRefCount(value);
            listDelNode(list,ln);
        }
    } else {
        redisPanic("Unknown list encoding");
    }
    return value;
}
```

#### 2.3 代码理解

这个方法做了以下几件事情

**1、** 判断当前列表的数据结构类型；

**2、** 如果是压缩表，则调用压缩表相关方法弹出一个值；

**3、** 如果是链表，则调用链表的香瓜方法弹出一个值；

**4、** 弹出值之后都会调用各自的删除方法，删除该元素；

### 3 lpopCommand

#### 3.1 命令说明

从列表的头部弹出一个元素，成功后，返回弹出的元素。

#### 3.2 命令实践

#### 3.3 命令源代码

```java
void lpopCommand(redisClient *c) {
    popGenericCommand(c,REDIS_HEAD);
}
```

#### 3.4 代码理解

lpopCommand调用了popGenericCommand，并传入了REDIS_HEAD，代表从头部方向弹出元素。

### 4 rpopCommand

#### 4.1 命令说明

从列表的头部弹出一个元素，成功后，返回弹出的元素。

#### 4.2 命令实践

#### 4.3 命令源代码

```java
void rpopCommand(redisClient *c) {
    popGenericCommand(c,REDIS_TAIL);
}
```

#### 4.4 代码理解

rpopCommand调用了popGenericCommand，并传入了REDIS_TAIL，代表从尾部方向弹出元素。

### 5 总结

**1、** lpop、rpop都会调用popGenericCommand这个方法；

**2、** 每次弹出一个元素，先获取元素，然后再删除这个元素；

**3、** 如果整个列表没有元素了，就会把列表删除；

**4、** 获取键对象会调用lookupKeyWriteOrReply方法；
