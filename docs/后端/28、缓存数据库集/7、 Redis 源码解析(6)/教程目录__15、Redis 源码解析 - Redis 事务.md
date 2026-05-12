# 15、Redis 源码解析 - Redis 事务
- 来源：https://ddkk.com/zhuanlan/db/redis/6/15.html
- 分类：缓存数据库
- 分组：教程目录
通常的事务概念是指数据库的事务，具有acid四个特性，Redis的事务只具备原子写，即：一组命令原子的执行，但是不保证全部成功，如果中间有命令失败，直接返回，不会回退已经成功的命令。与事务有关的命令：

Exec：执行所有事务块内的命令。

Watch：监视一个(或多个) key ，如果在事务执行之前这个(或这些) key 被其他命令所改动，那么事务将被打断。

Discard：取消事务，放弃执行事务块内的所有命令。

Unwatch：取消 WATCH 命令对所有 key 的监视。

Multi：标记一个事务块的开始

与事务有关的代码都在multi.c中

### 事务的设计

struct client中有2个字段与事务有关：

```java
struct client {
	...
	int flags;              /* Client flags: CLIENT_* macros. */
	...
	multiState mstate;      /* MULTI/EXEC state */
	...
}
```

如果客户端处于事务中，client.flags中会有CLIENT_MULTI标志

multiState：事务的状态

```java
/* Client MULTI/EXEC state */
typedef struct multiCmd {
    robj **argv;
    int argc;
    struct redisCommand *cmd;
} multiCmd;
typedef struct multiState {
    multiCmd *commands;     /* Array of MULTI commands */
    int count;              /* Total number of MULTI commands */
    int cmd_flags;          /* The accumulated command flags OR-ed together.
                               So if at least a command has a given flag, it
                               will be set in this field. */
    int minreplicas;        /* MINREPLICAS for synchronous replication */
    time_t minreplicas_timeout; /* MINREPLICAS timeout as unixtime. */
} multiState;
```

redisDb中dict *watched_keys保存正在被watch的keys，其中value为一个list，这个list保存着正在watch这些key的客户端

```java
typedef struct redisDb {
   	...
    dict *watched_keys;         /* WATCHED keys for MULTI/EXEC CAS */
    ...
} redisDb;
```

下面具体看看各个命令的实现：

#### multi

给client.flags设置上CLIENT_MULTI标志

```java
void multiCommand(client *c) {
    if (c->flags & CLIENT_MULTI) {
        addReplyError(c,"MULTI calls can not be nested");
        return;
    }
    c->flags |= CLIENT_MULTI;
    addReply(c,shared.ok);
}
```

#### discard

给client.flags消除CLIENT_MULTI标志

```java
void discardCommand(client *c) {
    if (!(c->flags & CLIENT_MULTI)) {
        addReplyError(c,"DISCARD without MULTI");
        return;
    }
    discardTransaction(c);
    addReply(c,shared.ok);
}
```

#### exec

用户命令执行函数processCommand在执行命令之前，判断该客户端如果带有CLIENT_MULTI标志，不会立即执行命令，而是把命令放入客户端的事务命令列表中：

```java
int processCommand(client *c) {
	...
	 /* Exec the command */
    if (c->flags & CLIENT_MULTI &&
        c->cmd->proc != execCommand && c->cmd->proc != discardCommand &&
        c->cmd->proc != multiCommand && c->cmd->proc != watchCommand)
    {
        queueMultiCommand(c);
        addReply(c,shared.queued);
    } else {
        call(c,CMD_CALL_FULL);
        c->woff = server.master_repl_offset;
        if (listLength(server.ready_keys))
            handleClientsBlockedOnKeys();
    }
    ...
}
void queueMultiCommand(client *c) {
    multiCmd *mc;
    int j;
    c->mstate.commands = zrealloc(c->mstate.commands,
            sizeof(multiCmd)*(c->mstate.count+1));
    mc = c->mstate.commands+c->mstate.count;
    mc->cmd = c->cmd;
    mc->argc = c->argc;
    mc->argv = zmalloc(sizeof(robj*)*c->argc);
    memcpy(mc->argv,c->argv,sizeof(robj*)*c->argc);
    for (j = 0; j < c->argc; j++)
        incrRefCount(mc->argv[j]);
    c->mstate.count++;
    c->mstate.cmd_flags |= c->cmd->flags;
}
```

最终用户调用exec命令执行这一组命令：

```java
void execCommand(client *c) {
    int j;
    robj **orig_argv;
    int orig_argc;
    struct redisCommand *orig_cmd;
    int must_propagate = 0; /* Need to propagate MULTI/EXEC to AOF / slaves? */
    int was_master = server.masterhost == NULL;
    if (!(c->flags & CLIENT_MULTI)) {
        addReplyError(c,"EXEC without MULTI");
        return;
    }
    // 判断事务能否执行：
    // 1、CLIENT_DIRTY_CAS：watched的key是否被改变
    // 2、CLIENT_DIRTY_EXEC：命令加入事务列表中是否出错
    if (c->flags & (CLIENT_DIRTY_CAS|CLIENT_DIRTY_EXEC)) {
        addReply(c, c->flags & CLIENT_DIRTY_EXEC ? shared.execaborterr :
                                                  shared.nullmultibulk);
        discardTransaction(c);
        goto handle_monitor;
    }
    // 判断是否能否执行
    if (!server.loading && server.masterhost && server.repl_slave_ro &&
        !(c->flags & CLIENT_MASTER) && c->mstate.cmd_flags & CMD_WRITE)
    {
        addReplyError(c,
            "Transaction contains write commands but instance "
            "is now a read-only slave. EXEC aborted.");
        discardTransaction(c);
        goto handle_monitor;
    }
    /* Exec all the queued commands */
    unwatchAllKeys(c); /* Unwatch ASAP otherwise we'll waste CPU cycles */
    orig_argv = c->argv;
    orig_argc = c->argc;
    orig_cmd = c->cmd;
    addReplyMultiBulkLen(c,c->mstate.count);
    // 把命令从命令数组中逐个取出执行
    for (j = 0; j < c->mstate.count; j++) {
        c->argc = c->mstate.commands[j].argc;
        c->argv = c->mstate.commands[j].argv;
        c->cmd = c->mstate.commands[j].cmd;
        ...
        call(c,server.loading ? CMD_CALL_NONE : CMD_CALL_FULL);
    }
    c->argv = orig_argv;
    c->argc = orig_argc;
    c->cmd = orig_cmd;
    discardTransaction(c);
    ...
}
```

其中事务在以下两种情况下执行失败：

**1、** watched的key在事务执行过程中被更新了；

**2、** 命令在加入事务时出错；

这里先看下第二种：会调用flagTransaction给客户端设置CLIENT_DIRTY_EXEC标志

flagTransaction在以下情况下被调用：

**1、** 用户命令在命令列表中没查到或者命令参数个数不对；

**2、** 集群模式下，事务中的所有命令不在一个slot中；

**3、** 满容；

**4、** 写磁盘出错，同时命令需要落盘；

**5、** 在只读的slave上调用写命令；

可以看出，上面这些判断条件与判断一个正常命令能否执行时一样的

#### watch

将客户端加入到redisDb.watched_keys列表中：

```java
void watchCommand(client *c) {
    int j;
    if (c->flags & CLIENT_MULTI) {
        addReplyError(c,"WATCH inside MULTI is not allowed");
        return;
    }
    for (j = 1; j < c->argc; j++)
        watchForKey(c,c->argv[j]);
    addReply(c,shared.ok);
}
void watchForKey(client *c, robj *key) {
    list *clients = NULL;
    listIter li;
    listNode *ln;
    watchedKey *wk;
    /* Check if we are already watching for this key */
    listRewind(c->watched_keys,&li);
    while((ln = listNext(&li))) {
        wk = listNodeValue(ln);
        if (wk->db == c->db && equalStringObjects(key,wk->key))
            return; /* Key already watched */
    }
    /* This key is not already watched in this DB. Let's add it */
    clients = dictFetchValue(c->db->watched_keys,key);
    if (!clients) {
        clients = listCreate();
        dictAdd(c->db->watched_keys,key,clients);
        incrRefCount(key);
    }
    listAddNodeTail(clients,c);
    /* Add the new key to the list of keys watched by this client */
    wk = zmalloc(sizeof(*wk));
    wk->key = key;
    wk->db = c->db;
    incrRefCount(key);
    listAddNodeTail(c->watched_keys,wk);
}
```

基本上每次修改DB中数据时，都会调用signalModifiedKey，从而调用touchWatchedKey，告知正在watch这个key的客户端，key被修改了，把这个客户端打上CLIENT_DIRTY_CAS标志，这样在执行exec命令时，会给这个客户端返回错误。

```java
void touchWatchedKey(redisDb *db, robj *key) {
    list *clients;
    listIter li;
    listNode *ln;
	// 从redisDb->watched_keys中查找key和对应的客户端
    if (dictSize(db->watched_keys) == 0) return;
    clients = dictFetchValue(db->watched_keys, key);
    if (!clients) return;
    /* Mark all the clients watching this key as CLIENT_DIRTY_CAS */
    /* Check if we are already watching for this key */
    listRewind(clients,&li);
    while((ln = listNext(&li))) {
        client *c = listNodeValue(ln);
		// 如果这道，设置CLIENT_DIRTY_CAS标志
        c->flags |= CLIENT_DIRTY_CAS;
    }
}
```
