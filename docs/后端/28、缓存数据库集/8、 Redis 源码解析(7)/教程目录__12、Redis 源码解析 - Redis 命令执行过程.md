# 12、Redis 源码解析 - Redis 命令执行过程
- 来源：https://ddkk.com/zhuanlan/db/redis/7/12.html
- 分类：缓存数据库
- 分组：教程目录
了解redis中命令的执行过程有助于我们更加清楚很多redis的子模块是什么时候执行的.

简单来说命令的执行过程是这样的,首先它在网络框架中的读处理器中被调用,即`readQueryFromClient`,我们在读处理器得到了此次从客户端收到的信息,如果可以解析成正确的命令和参数且此时缓冲区内无空余,认为此次解析成功,然后根据key在命令字典中查找对应的回调函数,找到后执行命令,接着返回其应有的返回值,中间还需要做很多的检查,至此,一次命令的执行过程就结束了.

`processInputBuffer`出现在`readQueryFromClient`读处理器的最后,它所做的事情就是对此次read的所有内容进行解析.

```java
// 处理客户端输入的命令内容
void processInputBuffer(redisClient *c) {
    /* Keep processing while there is something in the input buffer */
    // 尽可能地处理查询缓冲区中的内容
    // 如果读取出现 short read ，那么可能会有内容滞留在读取缓冲区里面
    // 这些滞留内容也许不能完整构成一个符合协议的命令，
    // 需要等待下次读事件的就绪
    // query为读入缓冲区
    while(sdslen(c->querybuf)) {
        /* Return if clients are paused. */
        // 如果客户端正处于暂停状态，那么直接返回
        if (!(c->flags & REDIS_SLAVE) && clientsArePaused()) return;
        /* Immediately abort if the client is in the middle of something. */
        // REDIS_BLOCKED 状态表示客户端正在被阻塞
        if (c->flags & REDIS_BLOCKED) return;
        /* REDIS_CLOSE_AFTER_REPLY closes the connection once the reply is
         * written to the client. Make sure to not let the reply grow after
         * this flag has been set (i.e. don't process more commands). */
        // 客户端已经设置了关闭 FLAG ，没有必要处理命令了
        if (c->flags & REDIS_CLOSE_AFTER_REPLY) return;
        /* Determine request type when unknown. */
        // 多条查询是一般客户端发送来的，
        // 而内联查询则是 TELNET 发送来的
        if (!c->reqtype) {
            if (c->querybuf[0] == '*') {
                // 多条查询
                c->reqtype = REDIS_REQ_MULTIBULK;
            } else {
                // 内联查询
                c->reqtype = REDIS_REQ_INLINE;
            }
        }
        // 将缓冲区中的内容转换成命令,以及命令参数
        // 我们可以看到当解析错误的时候会直接break出循环 进而退出函数
        // 而在函数内部
        if (c->reqtype == REDIS_REQ_INLINE) {
            if (processInlineBuffer(c) != REDIS_OK) break;
        } else if (c->reqtype == REDIS_REQ_MULTIBULK) {
            if (processMultibulkBuffer(c) != REDIS_OK) break;
        } else {
            redisPanic("Unknown request type");
        }
        /* Multibulk processing could see a <= 0 length. */
        if (c->argc == 0) {
            resetClient(c); //重置客户端 即初始化其中的参数 并释放上一次解析中的argv
        } else {
            /* Only reset the client when the command was executed. */
            // 执行命令的话就重置客户端
            if (processCommand(c) == REDIS_OK)
                resetClient(c);
        }
    }
}
```

从这里我们可以看到有两个函数是至关重要的,即`processMultibulkBuffer`和`processCommand`,一个用于解析命令,一个用于执行命令,我们一个一个看.先来看看processMultibulkBuffer吧.其作用为把判断输入缓冲区中的命令是否符合协议,符合的话放入argv并返回OK,否则返回error.

```java
//一般协议是这样的 *3\r\n$3\r\nSET\r\n$3\r\nMSG\r\n$5\r\nHELLO\r\n
// * 代表此次命令为REDIS_REQ_MULTIBULK
// \r\n 间隔符
// $n 后面字符串的长度
int processMultibulkBuffer(redisClient *c) {
    char *newline = NULL;
    int pos = 0, ok;
    long long ll;
    // 读入命令的参数个数
    // 比如 *3\r\n$3\r\nSET\r\n... 将令 c->multibulklen = 3
    if (c->multibulklen == 0) {
        /* The client should have been reset */
        redisAssertWithInfo(c,NULL,c->argc == 0);
        /* Multi bulk length cannot be read without a \r\n */
        // 检查缓冲区的内容第一个 "\r\n"
        newline = strchr(c->querybuf,'\r');
        if (newline == NULL) {
            if (sdslen(c->querybuf) > REDIS_INLINE_MAX_SIZE) {
                addReplyError(c,"Protocol error: too big mbulk count string");
                setProtocolError(c,0); //解析错误 设置flag 在servercron中关闭客户端
            }
            return REDIS_ERR;
        }
        /* Buffer should also contain \n */
        if (newline-(c->querybuf) > ((signed)sdslen(c->querybuf)-2))
            return REDIS_ERR;
        /* We know for sure there is a whole line since newline != NULL,
         * so go ahead and find out the multi bulk length. */
        // 协议的第一个字符必须是 '*'
        redisAssertWithInfo(c,NULL,c->querybuf[0] == '*');
        // 将参数个数，也即是 * 之后， \r\n 之前的数字取出并保存到 ll 中
        // 比如对于 *3\r\n ，那么 ll 将等于 3
        ok = string2ll(c->querybuf+1,newline-(c->querybuf+1),&ll);
        // 参数的数量超出限制
        if (!ok || ll > 1024*1024) {
            addReplyError(c,"Protocol error: invalid multibulk length");
            setProtocolError(c,pos); //
            return REDIS_ERR;
        }
        // 参数数量之后的位置
        // 比如对于 *3\r\n$3\r\n$SET\r\n... 来说，
        // pos 指向 *3\r\n$3\r\n$SET\r\n...
        //                ^
        //                |
        //               pos
        pos = (newline-c->querybuf)+2;
        // 如果 ll <= 0 ，那么这个命令是一个空白命令
        // 那么将这段内容从查询缓冲区中删除，只保留未阅读的那部分内容
        // 为什么参数可以是空的呢？
        // processInputBuffer 中有注释到 "Multibulk processing could see a <= 0 length"
        // 但并没有详细说明原因
        if (ll <= 0) {
            sdsrange(c->querybuf,pos,-1);
            return REDIS_OK;
        }
        // 设置参数数量
        c->multibulklen = ll;
        /* Setup argv array on client structure */
        // 根据参数数量，为各个参数对象分配空间
        if (c->argv) zfree(c->argv);
        c->argv = zmalloc(sizeof(robj*)*c->multibulklen);
    }
    redisAssertWithInfo(c,NULL,c->multibulklen > 0);
    // 从 c->querybuf 中读入参数，并创建各个参数对象到 c->argv
    while(c->multibulklen) {
        /* Read bulk length if unknown */
        // 读入参数长度
        if (c->bulklen == -1) {
            // 确保 "\r\n" 存在
            newline = strchr(c->querybuf+pos,'\r');
            if (newline == NULL) {
                if (sdslen(c->querybuf) > REDIS_INLINE_MAX_SIZE) {
                    addReplyError(c,
                        "Protocol error: too big bulk count string");
                    setProtocolError(c,0);
                    return REDIS_ERR;
                }
                break;
            }
            /* Buffer should also contain \n */ 
            if (newline-(c->querybuf) > ((signed)sdslen(c->querybuf)-2))
                break;
            // 确保协议符合参数格式，检查其中的 $...
            // 比如 $3\r\nSET\r\n
            if (c->querybuf[pos] != '$') {
                addReplyErrorFormat(c,
                    "Protocol error: expected '$', got '%c'",
                    c->querybuf[pos]);
                setProtocolError(c,pos);
                return REDIS_ERR;
            }
            // 读取长度
            // 比如 $3\r\nSET\r\n 将会让 ll 的值设置 3 $后面数字的意思是后面字符串的长度
            ok = string2ll(c->querybuf+pos+1,newline-(c->querybuf+pos+1),&ll);
            if (!ok || ll < 0 || ll > 512*1024*1024) {
     //一个参数的长度不能超过512MB
                addReplyError(c,"Protocol error: invalid bulk length");
                setProtocolError(c,pos);
                return REDIS_ERR;
            }
            // 定位到参数的开头
            // 比如 
            // $3\r\nSET\r\n...
            //       ^
            //       |
            //      pos
            pos += newline-(c->querybuf+pos)+2; //移动两位/r/n
            // 如果参数非常长，那么做一些预备措施来优化接下来的参数复制操作
            if (ll >= REDIS_MBULK_BIG_ARG)/*32MB*/ {
                size_t qblen;
                /* If we are going to read a large object from network
                 * try to make it likely that it will start at c->querybuf
                 * boundary so that we can optimize object creation
                 * avoiding a large copy of data. */
                sdsrange(c->querybuf,pos,-1);
                pos = 0;
                qblen = sdslen(c->querybuf);
                /* Hint the sds library about the amount of bytes this string is
                 * going to contain. */
                if (qblen < ll+2)
                    c->querybuf = sdsMakeRoomFor(c->querybuf,ll+2-qblen);
            }
            // 参数的长度
            c->bulklen = ll;
        }
        /* Read bulk argument */
        // 读入参数 缓冲区剩下的数据不能小于参数中的值
        if (sdslen(c->querybuf)-pos < (unsigned)(c->bulklen+2)) {
            // 确保内容符合协议格式
            // 比如 $3\r\nSET\r\n 就检查 SET 之后的 \r\n
            /* Not enough data (+2 == trailing \r\n) */
            break;
        } else {
      //符合协议要求 创建一个argv的项
            // 为参数创建字符串对象  
            /* Optimization: if the buffer contains JUST our bulk element
             * instead of creating a new object by *copying* the sds we
             * just use the current sds string. */
            // 一个小优化 如果当前缓冲区仅包含我们需要使用的元素,那就不把它复制出来,而是使用当前的sds字符串
            if (pos == 0 &&
                c->bulklen >= REDIS_MBULK_BIG_ARG &&
                (signed) sdslen(c->querybuf) == c->bulklen+2)
            {
                c->argv[c->argc++] = createObject(REDIS_STRING,c->querybuf);
                sdsIncrLen(c->querybuf,-2); /* remove CRLF */
                c->querybuf = sdsempty();
                /* Assume that if we saw a fat argument we'll see another one
                 * likely... */
                c->querybuf = sdsMakeRoomFor(c->querybuf,c->bulklen+2); //扩容到此次命令长度.
                pos = 0;
            } else {
      //不优化 pos向后移动(命令长度+CRLF)
                c->argv[c->argc++] =
                    createStringObject(c->querybuf+pos,c->bulklen);
                pos += c->bulklen+2;
            }
            // 清空参数长度
            c->bulklen = -1;
            // 减少还需读入的参数个数
            c->multibulklen--;
        }
    }
    /* Trim to pos */
    // 从 querybuf 中删除已被读取的内容
    if (pos) sdsrange(c->querybuf,pos,-1);
    /* We're done when c->multibulk == 0 */
    // 如果本条命令的所有参数都已读取完，那么返回
    if (c->multibulklen == 0) return REDIS_OK;
    /* Still not read to process the command */
    // 如果还有参数未读取完，那么就协议内容有错
    return REDIS_ERR;
}
```

**我们可以看到当返回REDIS_ERR的时候一般都已经设置了setProtocolError,会异步的断开客户端.还有一些情况则会记录已经读取的记录,原因是有可能一次没有接受完毕所有数据,先解析一部分,剩下的等下次再接收.返回OK的话就证明在argv中已经设置好了命令,argv[0]中存着key 后面则是参数.我们再来看看执行函数processCommand**

```java
int processCommand(redisClient *c) {
    /* The QUIT command is handled separately. Normal command procs will
     * go through checking for replication and QUIT will cause trouble
     * when FORCE_REPLICATION is enabled and would be implemented in
     * a regular command proc. */
    // 特别处理 quit 命令
    if (!strcasecmp(c->argv[0]->ptr,"quit")) {
        addReply(c,shared.ok);
        c->flags |= REDIS_CLOSE_AFTER_REPLY;
        return REDIS_ERR;
    }
    /* Now lookup the command and check ASAP about trivial error conditions
     * such as wrong arity, bad command name and so forth. */
    // 根据argv[0]在字典中查找当前命令,并进行命令合法性检查,以及命令参数个数检查 字典名为commands
    // c->cmd为当前要执行的命令 同时更新lastcmd loopupcommand其实就是在字典重根据键查找值而已
    c->cmd = c->lastcmd = lookupCommand(c->argv[0]->ptr);
    if (!c->cmd) {
        // 没找到指定的命令
        flagTransaction(c);
        addReplyErrorFormat(c,"unknown command '%s'",
            (char*)c->argv[0]->ptr);
        return REDIS_OK;
    } else if ((c->cmd->arity > 0 && c->cmd->arity != c->argc) ||
               (c->argc < -c->cmd->arity)) {
      //检查参数个数是否正确 错误的话进入
        flagTransaction(c); //修改flag
        addReplyErrorFormat(c,"wrong number of arguments for '%s' command",
            c->cmd->name);
        return REDIS_OK;
    }
    /* Check if the user is authenticated */
    // 检查认证信息 默认未开启 在redis.conf中修改requirepass打开
    if (server.requirepass && !c->authenticated && c->cmd->proc != authCommand)
    {
        flagTransaction(c);
        addReply(c,shared.noautherr);
        return REDIS_OK;
    }
	//集群方面的检查 现在知识水平还没到
   .................
    /* Handle the maxmemory directive.
     *
     * First we try to free some memory if possible (if there are volatile
     * keys in the dataset). If there are not the only thing we can do
     * is returning an error. */
    // 如果设置了最大内存，那么检查内存是否超过限制，并做相应的操作
    // 在源码解析(11) 中详尽介绍了这个函数 包括六种处理策略
    if (server.maxmemory) {
        // 如果内存已超过限制，那么尝试通过删除过期键来释放内存 
        int retval = freeMemoryIfNeeded();
        // 如果即将要执行的命令可能占用大量内存（REDIS_CMD_DENYOOM）
        // 并且前面的内存释放失败的话
        // 那么向客户端返回内存错误
        if ((c->cmd->flags & REDIS_CMD_DENYOOM) && retval == REDIS_ERR) {
            flagTransaction(c);
            addReply(c, shared.oomerr);
            return REDIS_OK;
        }
    }
	//主从复制相关 分布式学完回来补上
   ..............
    /* Only allow SUBSCRIBE and UNSUBSCRIBE in the context of Pub/Sub */
    // 在订阅于发布模式的上下文中，只能执行订阅和退订相关的命令
    if ((dictSize(c->pubsub_channels) > 0 || listLength(c->pubsub_patterns) > 0)
        &&
        c->cmd->proc != subscribeCommand &&
        c->cmd->proc != unsubscribeCommand &&
        c->cmd->proc != psubscribeCommand &&
        c->cmd->proc != punsubscribeCommand) {
        addReplyError(c,"only (P)SUBSCRIBE / (P)UNSUBSCRIBE / QUIT allowed in this context");
        return REDIS_OK;
    }
	............................
	//Lua脚本相关 
	......
    /* Exec the command */
    if (c->flags & REDIS_MULTI &&
        c->cmd->proc != execCommand && c->cmd->proc != discardCommand &&
        c->cmd->proc != multiCommand && c->cmd->proc != watchCommand)
    {
        // 在事务上下文中
        // 除 EXEC 、 DISCARD 、 MULTI 和 WATCH 命令之外
        // 其他所有命令都会被入队到事务队列中
        queueMultiCommand(c);
        addReply(c,shared.queued);
    } else {
        // 执行命令 其中也会写入AOF和慢查询日志,以及更新此次命令持续时间和一些客户端信息.
        call(c,REDIS_CALL_FULL);
        c->woff = server.master_repl_offset;
        // 处理那些解除了阻塞的键
        if (listLength(server.ready_keys))
            handleClientsBlockedOnLists();
    }
    return REDIS_OK;
}
```

在执行命令的时候,返回内容就会被写入到定长缓冲区或者边长缓冲链表中,在写处理器重全部返回给客户端.这样,一次命令的调用就结束了.
