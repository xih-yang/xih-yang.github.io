# 16、Redis 源码解析 - Redis 发布订阅
- 来源：https://ddkk.com/zhuanlan/db/redis/6/16.html
- 分类：缓存数据库
- 分组：教程目录
Redis支持发布订阅功能，即一个客户端可以向channel中publish发布一条消息，订阅这个channel的客户端就能收到这条消息，本节解析发布订阅功能的实现。

发布订阅的实现在pubsub.c中

相关命令如下：

Unsubscribe：指退订给定的频道。

Subscribe：订阅给定的一个或多个频道的信息。

Pubsub：查看订阅与发布系统状态。

Punsubscribe：退订所有给定模式的频道。

Publish：将信息发送到指定的频道。

Psubscribe：订阅一个或多个符合给定模式的频道。

### 发布订阅数据结构

在struct Server中与发布订阅有关的字段：

```java
struct Server {
	...
	/* Pubsub */
    dict *pubsub_channels;  /* Map channels to list of subscribed clients */
    list *pubsub_patterns;  /* A list of pubsub_patterns */
    int notify_keyspace_events; /* Events to propagate via Pub/Sub. This is an
                                   xor of NOTIFY_... flags. */
    ...
};
```

dict *pubsub_channels的key是robj指针，保存channel，value是个list，保存订阅该channel的所有client。

list *pubsub_patterns保存所有给定模式的channel，具体如下：

```java
typedef struct pubsubPattern {
    client *client;
    robj *pattern;
} pubsubPattern;
```

同时struct client也有两个与发布订阅有关的字段：

```java
struct client{
	...
	dict *pubsub_channels;  /* channels a client is interested in (SUBSCRIBE) */
    list *pubsub_patterns;  /* patterns a client is interested in (SUBSCRIBE) */
    ...
};
```

dict *pubsub_channels该客户端订阅的channel

list *pubsub_patterns该客户端订阅的所有模式channel

### 发布订阅实现

订阅一个channel:

```java
void subscribeCommand(client *c) {
    int j;
	// 客户端订阅每个channel
    for (j = 1; j < c->argc; j++)
        pubsubSubscribeChannel(c,c->argv[j]);
    // 打上CLIENT_PUBSUB标志
    c->flags |= CLIENT_PUBSUB;
}
int pubsubSubscribeChannel(client *c, robj *channel) {
    dictEntry *de;
    list *clients = NULL;
    int retval = 0;
    /* Add the channel to the client -> channels hash table */
    // 向客户端的pubsub_channels添加channel
    if (dictAdd(c->pubsub_channels,channel,NULL) == DICT_OK) {
        retval = 1;
        incrRefCount(channel);
        /* Add the client to the channel -> list of clients hash table */
        // 向server的pubsub_channels添加channel和该客户端
        de = dictFind(server.pubsub_channels,channel);
        if (de == NULL) {
        	// 当前该channel不存在，则新建
            clients = listCreate();
            dictAdd(server.pubsub_channels,channel,clients);
            incrRefCount(channel);
        } else {
            clients = dictGetVal(de);
        }
        listAddNodeTail(clients,c);
    }
    /* Notify the client */
    addReply(c,shared.mbulkhdr[3]);
    addReply(c,shared.subscribebulk);
    addReplyBulk(c,channel);
    addReplyLongLong(c,clientSubscriptionsCount(c));
    return retval;
}
```

订阅一组模式：

```java
void psubscribeCommand(client *c) {
    int j;
	// 逐个添加模式
    for (j = 1; j < c->argc; j++)
        pubsubSubscribePattern(c,c->argv[j]);
    // 打上CLIENT_PUBSUB标识
    c->flags |= CLIENT_PUBSUB;
}
int pubsubSubscribePattern(client *c, robj *pattern) {
    int retval = 0;
	// 向client的pubsub_patterns添加模式
    if (listSearchKey(c->pubsub_patterns,pattern) == NULL) {
        retval = 1;
        pubsubPattern *pat;
        listAddNodeTail(c->pubsub_patterns,pattern);
        incrRefCount(pattern);
        pat = zmalloc(sizeof(*pat));
        pat->pattern = getDecodedObject(pattern);
        pat->client = c;
        // 向server的pubsub_patterns添加模式
        listAddNodeTail(server.pubsub_patterns,pat);
    }
    /* Notify the client */
    addReply(c,shared.mbulkhdr[3]);
    addReply(c,shared.psubscribebulk);
    addReplyBulk(c,pattern);
    addReplyLongLong(c,clientSubscriptionsCount(c));
    return retval;
}
```

在订阅channel和模式的时候都要给该client打上CLIENT_PUBSUB标识，这个标识的作用在于：在Redis执行一个用户命令之前，前面会有一系列条件判断该命令是否可以执行，其中一条就是有关subpub命令：

```java
int processCommand(client *c) {
	...
	/* Only allow SUBSCRIBE and UNSUBSCRIBE in the context of Pub/Sub */
    if (c->flags & CLIENT_PUBSUB &&
        c->cmd->proc != pingCommand &&
        c->cmd->proc != subscribeCommand &&
        c->cmd->proc != unsubscribeCommand &&
        c->cmd->proc != psubscribeCommand &&
        c->cmd->proc != punsubscribeCommand) {
        addReplyError(c,"only (P)SUBSCRIBE / (P)UNSUBSCRIBE / PING / QUIT allowed in this context");
        return C_OK;
    }
	...
}
```

向channel中发布消息：

```java
void publishCommand(client *c) {
    int receivers = pubsubPublishMessage(c->argv[1],c->argv[2]);
    // 集群模式下处理发布消息
    if (server.cluster_enabled)
        clusterPropagatePublish(c->argv[1],c->argv[2]);
    else
        forceCommandPropagation(c,PROPAGATE_REPL);
    addReplyLongLong(c,receivers);
}
```

关于集群模式下发布消息的传播在后面文章中分析，本节先看pubsubPublishMessage的实现：

```java
/* Publish a message */
int pubsubPublishMessage(robj *channel, robj *message) {
    int receivers = 0;
    dictEntry *de;
    listNode *ln;
    listIter li;
    /* Send to clients listening for that channel */
    // 从server.pubsub_channels查找对应的channel
    de = dictFind(server.pubsub_channels,channel);
    if (de) {
        list *list = dictGetVal(de);
        listNode *ln;
        listIter li;
		// 遍历订阅该channel的每一个client，发送消息
        listRewind(list,&li);
        while ((ln = listNext(&li)) != NULL) {
            client *c = ln->value;
            addReply(c,shared.mbulkhdr[3]);
            addReply(c,shared.messagebulk);
            addReplyBulk(c,channel);
            addReplyBulk(c,message);
            receivers++;
        }
    }
    /* Send to clients listening to matching channels */
    // 遍历server.pubsub_patterns
    if (listLength(server.pubsub_patterns)) {
        listRewind(server.pubsub_patterns,&li);
        channel = getDecodedObject(channel);
        while ((ln = listNext(&li)) != NULL) {
            pubsubPattern *pat = ln->value;
			// 如果发现该模式与该channel匹配
            if (stringmatchlen((char*)pat->pattern->ptr,
                                sdslen(pat->pattern->ptr),
                                (char*)channel->ptr,
                                sdslen(channel->ptr),0)) {
                // 向订阅该模式的客户端发送消息
                addReply(pat->client,shared.mbulkhdr[4]);
                addReply(pat->client,shared.pmessagebulk);
                addReplyBulk(pat->client,pat->pattern);
                addReplyBulk(pat->client,channel);
                addReplyBulk(pat->client,message);
                receivers++;
            }
        }
        decrRefCount(channel);
    }
    return receivers;
}
```

### 更改通知机制

在之前的几章中，经常能在源码上看到notifyKeyspaceEvent这个函数，比如：更新完KV对时；过期健删除时；内存淘汰时等等，这个函数借助于发布订阅机制，向订阅key变更的客户端发布一条消息，能够让这些客户端即使感知到他们所感兴趣的key的改变。

通知机制的实现在notify.c中

```java
void notifyKeyspaceEvent(int type, char *event, robj *key, int dbid) {
    sds chan;
    robj *chanobj, *eventobj;
    int len = -1;
    char buf[24];
    /* If notifications for this class of events are off, return ASAP. */
    if (!(server.notify_keyspace_events & type)) return;
    eventobj = createStringObject(event,strlen(event));
    /* __keyspace@<db>__:<key> <event> notifications. */
    // 健空间通知
    // 发布一条 __keyspace@<db>__:<key> <event> 消息
    if (server.notify_keyspace_events & NOTIFY_KEYSPACE) {
        chan = sdsnewlen("__keyspace@",11);
        len = ll2string(buf,sizeof(buf),dbid);
        chan = sdscatlen(chan, buf, len);
        chan = sdscatlen(chan, "__:", 3);
        chan = sdscatsds(chan, key->ptr);
        chanobj = createObject(OBJ_STRING, chan);
        pubsubPublishMessage(chanobj, eventobj);
        decrRefCount(chanobj);
    }
    /* __keyevent@<db>__:<event> <key> notifications. */
    // db空间通知
    // 发布一条 __keyevent@<db>__:<event> <key> 消息
    if (server.notify_keyspace_events & NOTIFY_KEYEVENT) {
        chan = sdsnewlen("__keyevent@",11);
        if (len == -1) len = ll2string(buf,sizeof(buf),dbid);
        chan = sdscatlen(chan, buf, len);
        chan = sdscatlen(chan, "__:", 3);
        chan = sdscatsds(chan, eventobj->ptr);
        chanobj = createObject(OBJ_STRING, chan);
        pubsubPublishMessage(chanobj, key);
        decrRefCount(chanobj);
    }
    decrRefCount(eventobj);
}
```
