# 22、Redis 源码解析 - Redis 事务
- 来源：https://ddkk.com/zhuanlan/db/redis/7/22.html
- 分类：缓存数据库
- 分组：教程目录
redis通过MULTl,EXEC,WATCH,DISCARD来实现事务.

因为redis本身是一个单线程的服务器,所有的请求会在IO多路复用处变为串行请求,这其实意味着事务的隔离性是天然的,相比于关系型数据库中复杂的隔离性,redis中就显得尤为简洁.然后持久性又是由配置决定的.所以重点讨论的其实就是原子性和一致性.

那么原子性是如何实现的呢,其实redis中的一个事务处理过程是这样的:

**1、** 客户端发送`MULTl`,开始一次事务,所做的事情其实是打开`REDIS_MULTI`标识；

**2、** 客户端发送此次事务中的命令,服务器把所有的命令组成一个队列,暂不执行；

**3、** 客户端执行`EXEC`,服务器执行所有的命令.一次事务完成；

用这种打包命令的方式,我们可以很容易的实现事务的原子性,**这种原子性是要么都执行要么都不执行,而不是要么都执行成功,要么都不执行**,因为redis不支持回滚,也就是单条数据支持原子性,事务不支持原子性.那么一致性呢?一致性就是在执行事务之前数据库是一致的,在事务完成以后,数据库也是一致的,这里的一致用关系型数据库的的名词来说就是满足一致性约束,也就是数据满足数据库要求,这里其实对输入的命令进行检查就可以了.但是redis事务真的能做到数据一致性吗?其实非也,不管是是事务也好,普通语句也好其实在整个redis的分布式系统中都只是满足`最终一致性`罢了,毕竟redis的设计初衷就是满足AP而已.这样事务的ACID特性中隔离性就达到了,而持久性取决于设置.

但是有一点值得一谈,就是我们都知道关系型数据库使用redo日志来进行事务回滚,而redis是不支持事务回滚的,这也意味着在一次事务执行中如果某个语句失败我们是不会进行回滚的,那么为什么redis不支持回滚呢?

> 只有当被调用的Redis命令有语法错误时，这条命令才会执行失败（在将这个命令放入事务队列期间，Redis能够发现此类问题），或者对某个键执行不符合其数据类型的操作：实际上，这就意味着只有程序错误才会导致Redis命令执行失败，这种错误很有可能在程序开发期间发现，一般很少在生产环境发现。
>
> Redis已经在系统内部进行功能简化，这样可以确保更快的运行速度，因为Redis不需要事务回滚的能力。对于Redis事务的这种行为，有一个普遍的反对观点，那就是程序有可能会有缺陷（bug）。但是，你应当注意到：事务回滚并不能解决任何程序错误。例如，如果某个查询会将一个键的值递增2，而不是1，或者递增错误的键，那么事务回滚机制是没有办法解决这些程序问题的。

### 基础数据结构

```java
typedef struct redisClient {
    ..........
    multiState mstate;      /* MULTI/EXEC state */ // 用于记录每个客户端的事务信息
    ..........
} redisClient;
```

```java
typedef struct multiState {
    // 事务队列,FIFO顺序,记录所有的命令
    multiCmd *commands;     /* Array of MULTI commands */
    // 已入队命令计数
    int count;              /* Total number of MULTI commands */
    int minreplicas;        /* MINREPLICAS for synchronous replication */
    time_t minreplicas_timeout; /* MINREPLICAS timeout as unixtime. */
} multiState;
typedef struct multiCmd {
      // 相当于一个命令的全部参数
    // 参数
    robj **argv;
    // 参数数量
    int argc;
    // 命令指针
    struct redisCommand *cmd;
} multiCmd;
```

### MULTl

我们来看看`MULTl`的实现,

```java
void multiCommand(redisClient *c) {
    // 不能在事务中嵌套事务
    if (c->flags & REDIS_MULTI) {
        addReplyError(c,"MULTI calls can not be nested");
        return;
    }
    // 打开事务 FLAG
    c->flags |= REDIS_MULTI;
	// 返回OK
    addReply(c,shared.ok);
}
```

当`REDIS_MULTI`设置在客户端时,后面这个客户端发送的信息就会在进行合法性判断以后加入链表,处理逻辑在`processCommand`中.

```java
    /* Exec the command */
    if (c->flags & REDIS_MULTI && // 标记为REDIS_MULTI
    	// 命令不为MULTl,EXEC,WATCH,DISCARD
        c->cmd->proc != execCommand && c->cmd->proc != discardCommand &&
        c->cmd->proc != multiCommand && c->cmd->proc != watchCommand)
    {
        // 除了上面四个命令以外所有命令都会被入队到事务队列中
        queueMultiCommand(c);
        addReply(c,shared.queued);
    } else {
		..........
    }
void queueMultiCommand(redisClient *c) {
    multiCmd *mc;
    int j;
    // 为新数组元素分配空间
    c->mstate.commands = zrealloc(c->mstate.commands,
            sizeof(multiCmd)*(c->mstate.count+1));
    // 指向新元素
    mc = c->mstate.commands+c->mstate.count;
    // 设置事务的命令、命令参数数量，以及命令的参数
    mc->cmd = c->cmd;
    mc->argc = c->argc;
    mc->argv = zmalloc(sizeof(robj*)*c->argc);
    memcpy(mc->argv,c->argv,sizeof(robj*)*c->argc);
    for (j = 0; j < c->argc; j++)
        incrRefCount(mc->argv[j]);
    // 事务命令数量计数器增一
    c->mstate.count++;
}
```

### EXEC

```java
void execCommand(redisClient *c) {
    int j;
    robj **orig_argv;
    int orig_argc;
    struct redisCommand *orig_cmd;
    int must_propagate = 0; /* Need to propagate MULTI/EXEC to AOF / slaves? */
    // 客户端没有执行事务
    if (!(c->flags & REDIS_MULTI)) {
        addReplyError(c,"EXEC without MULTI");
        return;
    }
    /* Check if we need to abort the EXEC because:
     *
     * 检查是否需要阻止事务执行，因为：
     *
     * 1) Some WATCHed key was touched.
     *    有被监视的键已经被修改了
     *
     * 2) There was a previous error while queueing commands.
     *    命令在入队时发生错误
     *    （注意这个行为是 2.6.4 以后才修改的，之前是静默处理入队出错命令）
     *
     * A failed EXEC in the first case returns a multi bulk nil object
     * (technically it is not an error but a special behavior), while
     * in the second an EXECABORT error is returned. 
     *
     * 第一种情况返回多个批量回复的空对象
     * 而第二种情况则返回一个 EXECABORT 错误
     */
    if (c->flags & (REDIS_DIRTY_CAS|REDIS_DIRTY_EXEC)) {
      // 键在watch时被修改
        // 判断到底是命令入队时错误还是被监视的键被修改
        addReply(c, c->flags & REDIS_DIRTY_EXEC ? shared.execaborterr :
                                                  shared.nullmultibulk);
        // 取消事务
        discardTransaction(c);
        goto handle_monitor;
    }
    /* Exec all the queued commands */
    // 已经可以保证安全性了，取消客户端对所有键的监视
    unwatchAllKeys(c); /* Unwatch ASAP otherwise we'll waste CPU cycles */
    // 因为事务中的命令在执行时可能会修改命令和命令的参数
    // 所以为了正确地传播命令，需要现备份这些命令和参数
    orig_argv = c->argv;
    orig_argc = c->argc;
    orig_cmd = c->cmd;
    addReplyMultiBulkLen(c,c->mstate.count);
    // 执行事务中的命令
    for (j = 0; j < c->mstate.count; j++) {
        // 因为 Redis 的命令必须在客户端的上下文中执行
        // 所以要将事务队列中的命令、命令参数等设置给客户端
        c->argc = c->mstate.commands[j].argc;
        c->argv = c->mstate.commands[j].argv;
        c->cmd = c->mstate.commands[j].cmd;
        /* Propagate a MULTI request once we encounter the first write op.
         *
         * 当遇上第一个写命令时，传播 MULTI 命令。
         *
         * This way we'll deliver the MULTI/..../EXEC block as a whole and
         * both the AOF and the replication link will have the same consistency
         * and atomicity guarantees. 
         *
         * 这可以确保服务器和 AOF 文件以及附属节点的数据一致性。
         */                                     //不是只读的 也就是说需要保证一致性
        if (!must_propagate && !(c->cmd->flags & REDIS_CMD_READONLY)) {
            // 向从节点和AOF文件追加一个MULTI命令
            execCommandPropagateMulti(c);
            // 计数器，只发送一次
            must_propagate = 1;
        }
        // 执行命令 会转移到从节点和AOF文件中
        call(c,REDIS_CALL_FULL);
        /* Commands may alter argc/argv, restore mstate. */
        // 因为执行后命令、命令参数可能会被改变
        // 比如 SPOP 会被改写为 SREM
        // 其中SPOP是随机删除 SREM为定向删除 这是为了保证主从中状态一致
        // 所以这里需要更新事务队列中的命令和参数
        // 确保附属节点和 AOF 的数据一致性
        c->mstate.commands[j].argc = c->argc;
        c->mstate.commands[j].argv = c->argv;
        c->mstate.commands[j].cmd = c->cmd;
    }
    // 还原命令、命令参数
    c->argv = orig_argv;
    c->argc = orig_argc;
    c->cmd = orig_cmd;
    // 清理事务状态
    discardTransaction(c);
    /* Make sure the EXEC command will be propagated as well if MULTI
     * was already propagated. */
    // 将服务器设为脏，确保 EXEC 命令也会被传播
    if (must_propagate) server.dirty++;
handle_monitor:
    /* Send EXEC to clients waiting data from MONITOR. We do it here
     * since the natural order of commands execution is actually:
     * MUTLI, EXEC, ... commands inside transaction ...
     * Instead EXEC is flagged as REDIS_CMD_SKIP_MONITOR in the command
     * table, and we do it here with correct ordering. */
    if (listLength(server.monitors) && !server.loading)
        replicationFeedMonitors(c,server.monitors,c->db->id,c->argv,c->argc);
}
```

这里可能会出现两种错误:

**1、** 命令格式错误；

**2、** 命令格式正确,但执行参数错误,；

举两个简单的例子

**1、**`redis>helloworld`helloworld不是命令这在`processCommand`就会检测出来；

**2、**`redis>ZADDmsghello`其中msg并不是一个有序set对象,这只能在执行函数的时候检测出来,也就是`call`中,但是redis只会回复错误,后面的命令还是会继续执行,并返回其应该返回的结果.；

### WATCH

WATCH其实就是一个乐观锁,它会在`EXEC`发送之前监视所有的键,当键被修改的时候就会修改监视这个值的客户端的flag,这样在`EXEC`执行的时候就可以发现哪些值被修改了.基础数据结构如下

```java
typedef struct redisDb {
    ........
    // 键为监视的键的名称 值为客户端链表 代表了现在正在监视这个键的客户端
    dict *watched_keys;         /* WATCHED keys for MULTI/EXEC CAS */
    ........
} redisDb;
```

执行逻辑在`watchCommand`中

```java
// 命令格式为 WATCH  <key1> [<key2> <key3> ...]
void watchCommand(redisClient *c) {
    int j;
    // 不能在事务开始后执行
    if (c->flags & REDIS_MULTI) {
        addReplyError(c,"WATCH inside MULTI is not allowed");
        return;
    }
    // 监视输入的任意个键
    for (j = 1; j < c->argc; j++)
        watchForKey(c,c->argv[j]);
    addReply(c,shared.ok);
}
```

```java
void watchForKey(redisClient *c, robj *key) {
    list *clients = NULL;
    listIter li;
    listNode *ln;
    watchedKey *wk;
    /* Check if we are already watching for this key */
    // 检查 key 是否已经保存在 watched_keys 链表中，
    // 如果是的话，直接返回
    // watched_keys中保存了这个客户端当前监听的键
    listRewind(c->watched_keys,&li);
    while((ln = listNext(&li))) {
        wk = listNodeValue(ln);
        if (wk->db == c->db && equalStringObjects(key,wk->key))
            return; /* Key already watched */
    }
    // 键不存在于 watched_keys ，添加它
    // 以下是一个 key 不存在于字典的例子：
    // before :
    // {
    //  'key-1' : [c1, c2, c3],
    //  'key-2' : [c1, c2],
    // }
    // after c-10086 WATCH key-1 and key-3:
    // {
    //  'key-1' : [c1, c2, c3, c-10086],
    //  'key-2' : [c1, c2],
    //  'key-3' : [c-10086]
    // }
    /* This key is not already watched in this DB. Let's add it */
    // 检查 key 是否存在于数据库的 watched_keys 字典中
    clients = dictFetchValue(c->db->watched_keys,key);
    // 如果不存在的话，添加它
    if (!clients) {
        // 值为链表
        clients = listCreate();
        // 关联键值对到字典
        dictAdd(c->db->watched_keys,key,clients);
        incrRefCount(key);
    }
    // 将客户端添加到链表的末尾
    listAddNodeTail(clients,c);
    /* Add the new key to the list of keys watched by this client */
    // 将新 watchedKey 结构添加到客户端 watched_keys 链表的表尾
    wk = zmalloc(sizeof(*wk));
    wk->key = key;
    wk->db = c->db;
    incrRefCount(key);
    listAddNodeTail(c->watched_keys,wk);
}
```

这样这个键现在就是被监控的了,那么监控的作用是什么呢,就是在监控期间如果这个键被修改,那么在监视这个键的客户端中设置flag为`REDIS_DIRTY_CAS`.具体了处理流程是这样的`signalModifiedKey->touchWatchedKey`

```java
void touchWatchedKey(redisDb *db, robj *key) {
    list *clients;
    listIter li;
    listNode *ln;
    // 字典为空，没有任何键被监视
    if (dictSize(db->watched_keys) == 0) return;
    // 获取所有监视这个键的客户端
    clients = dictFetchValue(db->watched_keys, key);
    if (!clients) return;
    /* Mark all the clients watching this key as REDIS_DIRTY_CAS */
    /* Check if we are already watching for this key */
    // 遍历所有客户端，打开他们的 REDIS_DIRTY_CAS 标识
    listRewind(clients,&li);
    while((ln = listNext(&li))) {
        redisClient *c = listNodeValue(ln);
        c->flags |= REDIS_DIRTY_CAS;
    }
}
```

如果一个被监视的键在事务期间被修改,这次事务就是失败的.
