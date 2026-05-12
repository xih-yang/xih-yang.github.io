# 18、Redis 源码解析 - Redis 网络连接库分析
- 来源：https://ddkk.com/zhuanlan/db/redis/8/18.html
- 分类：缓存数据库
- 分组：教程目录
### 1. Redis网络连接库介绍

Redis网络连接库对应的文件是`networking.c`，这个文件主要负责：

- 客户端的创建与释放.
- 命令接收与命令回复.
- Redis通信协议分析.
- CLIENT 命令的实现.

### 2. 客户端的创建与释放

#### 2.1 客户端的创建

Redis服务器是一个同时与多个客户端建立连接的程序. 当客户端连接上服务器时，服务器会建立一个`server.h/client`结构来保存客户端的状态信息.

`server.h/client`结构如下所示：

```java
typedef struct client {
    // client独一无二的ID
    uint64_t id;            /* Client incremental unique ID. */
    // client的套接字
    int fd;                 /* Client socket. */
    // 指向当前的数据库
    redisDb *db;            /* Pointer to currently SELECTed DB. */
    // 保存指向数据库的ID
    int dictid;             /* ID of the currently SELECTed DB. */
    // client的名字
    robj *name;             /* As set by CLIENT SETNAME. */
    // 输入缓冲区
    sds querybuf;           /* Buffer we use to accumulate client queries. */
    // 输入缓存的峰值
    size_t querybuf_peak;   /* Recent (100ms or more) peak of querybuf size. */
    // client输入命令时，参数的数量
    int argc;               /* Num of arguments of current command. */
    // client输入命令的参数列表
    robj **argv;            /* Arguments of current command. */
    // 保存客户端执行命令的历史记录
    struct redisCommand *cmd, *lastcmd;  /* Last command executed. */
    // 请求协议类型，内联或者多条命令
    int reqtype;            /* Request protocol type: PROTO_REQ_* */
    // 参数列表中未读取命令参数的数量，读取一个，该值减1
    int multibulklen;       /* Number of multi bulk arguments left to read. */
    // 命令内容的长度
    long bulklen;           /* Length of bulk argument in multi bulk request. */
    // 回复缓存列表，用于发送大于固定回复缓冲区的回复
    list *reply;            /* List of reply objects to send to the client. */
    // 回复缓存列表对象的总字节数
    unsigned long long reply_bytes; /* Tot bytes of objects in reply list. */
    // 已发送的字节数或对象的字节数
    size_t sentlen;         /* Amount of bytes already sent in the current
                               buffer or object being sent. */
    // client创建所需时间
    time_t ctime;           /* Client creation time. */
    // 最后一次和服务器交互的时间
    time_t lastinteraction; /* Time of the last interaction, used for timeout */
    // 客户端的输出缓冲区超过软性限制的时间，记录输出缓冲区第一次到达软性限制的时间
    time_t obuf_soft_limit_reached_time;
    // client状态的标志
    int flags;              /* Client flags: CLIENT_* macros. */
    // 认证标志，0表示未认证，1表示已认证
    int authenticated;      /* When requirepass is non-NULL. */
    // 从节点的复制状态
    int replstate;          /* Replication state if this is a slave. */
    // 在ack上设置从节点的写处理器，是否在slave向master发送ack，
    int repl_put_online_on_ack; /* Install slave write handler on ACK. */
    // 保存主服务器传来的RDB文件的文件描述符
    int repldbfd;           /* Replication DB file descriptor. */
    // 读取主服务器传来的RDB文件的偏移量
    off_t repldboff;        /* Replication DB file offset. */
    // 主服务器传来的RDB文件的大小
    off_t repldbsize;       /* Replication DB file size. */
    // 主服务器传来的RDB文件的大小，符合协议的字符串形式
    sds replpreamble;       /* Replication DB preamble. */
    // replication复制的偏移量
    long long reploff;      /* Replication offset if this is our master. */
    // 通过ack命令接收到的偏移量
    long long repl_ack_off; /* Replication ack offset, if this is a slave. */
    // 通过ack命令接收到的偏移量所用的时间
    long long repl_ack_time;/* Replication ack time, if this is a slave. */
    // FULLRESYNC回复给从节点的offset
    long long psync_initial_offset; /* FULLRESYNC reply offset other slaves
                                       copying this slave output buffer
                                       should use. */
    char replrunid[CONFIG_RUN_ID_SIZE+1]; /* Master run id if is a master. */
    // 从节点的端口号
    int slave_listening_port; /* As configured with: REPLCONF listening-port */
    // 从节点IP地址
    char slave_ip[NET_IP_STR_LEN]; /* Optionally given by REPLCONF ip-address */
    // 从节点的功能
    int slave_capa;         /* Slave capabilities: SLAVE_CAPA_* bitwise OR. */
    // 事物状态
    multiState mstate;      /* MULTI/EXEC state */
    // 阻塞类型
    int btype;              /* Type of blocking op if CLIENT_BLOCKED. */
    // 阻塞的状态
    blockingState bpop;     /* blocking state */
    // 最近一个写全局的复制偏移量
    long long woff;         /* Last write global replication offset. */
    // 监控列表
    list *watched_keys;     /* Keys WATCHED for MULTI/EXEC CAS */
    // 订阅频道
    dict *pubsub_channels;  /* channels a client is interested in (SUBSCRIBE) */
    // 订阅的模式
    list *pubsub_patterns;  /* patterns a client is interested in (SUBSCRIBE) */
    // 被缓存的ID
    sds peerid;             /* Cached peer ID. */
    /* Response buffer */
    // 回复固定缓冲区的偏移量
    int bufpos;
    // 回复固定缓冲区
    char buf[PROTO_REPLY_CHUNK_BYTES];
} client;
```

创建客户端的源码：

```java
// 创建一个新的client
client *createClient(int fd) {
    client *c = zmalloc(sizeof(client));    //分配空间
    // 如果fd为-1，表示创建的是一个无网络连接的伪客户端，用于执行lua脚本的时候
    // 如果fd不等于-1，表示创建一个有网络连接的客户端
    if (fd != -1) {
        // 设置fd为非阻塞模式
        anetNonBlock(NULL,fd);
        // 禁止使用 Nagle 算法，client向内核递交的每个数据包都会立即发送给server出去，TCP_NODELAY
        anetEnableTcpNoDelay(NULL,fd);
        // 如果开启了tcpkeepalive，则设置 SO_KEEPALIVE
        if (server.tcpkeepalive)
            // 设置tcp连接的keep alive选项
            anetKeepAlive(NULL,fd,server.tcpkeepalive);
        // 创建一个文件事件状态el，且监听读事件，开始接受命令的输入
        if (aeCreateFileEvent(server.el,fd,AE_READABLE,
            readQueryFromClient, c) == AE_ERR)
        {
            close(fd);
            zfree(c);
            return NULL;
        }
    }
    // 默认选0号数据库
    selectDb(c,0);
    // 设置client的ID
    c->id = server.next_client_id++;
    // client的套接字
    c->fd = fd;
    // client的名字
    c->name = NULL;
    // 回复固定(静态)缓冲区的偏移量
    c->bufpos = 0;
    // 输入缓存区
    c->querybuf = sdsempty();
    // 输入缓存区的峰值
    c->querybuf_peak = 0;
    // 请求协议类型，内联或者多条命令，初始化为0
    c->reqtype = 0;
    // 参数个数
    c->argc = 0;
    // 参数列表
    c->argv = NULL;
    // 当前执行的命令和最近一次执行的命令
    c->cmd = c->lastcmd = NULL;
    // 查询缓冲区剩余未读取命令的数量
    c->multibulklen = 0;
    // 读入参数的长度
    c->bulklen = -1;
    // 已发的字节数
    c->sentlen = 0;
    // client的状态
    c->flags = 0;
    // 设置创建client的时间和最后一次互动的时间
    c->ctime = c->lastinteraction = server.unixtime;
    // 认证状态
    c->authenticated = 0;
    // replication复制的状态，初始为无
    c->replstate = REPL_STATE_NONE;
    // 设置从节点的写处理器为ack，是否在slave向master发送ack
    c->repl_put_online_on_ack = 0;
    // replication复制的偏移量
    c->reploff = 0;
    // 通过ack命令接收到的偏移量
    c->repl_ack_off = 0;
    // 通过ack命令接收到的偏移量所用的时间
    c->repl_ack_time = 0;
    // 从节点的端口号
    c->slave_listening_port = 0;
    // 从节点IP地址
    c->slave_ip[0] = '\0';
    // 从节点的功能
    c->slave_capa = SLAVE_CAPA_NONE;
    // 回复链表
    c->reply = listCreate();
    // 回复链表的字节数
    c->reply_bytes = 0;
    // 回复缓冲区的内存大小软限制
    c->obuf_soft_limit_reached_time = 0;
    // 回复链表的释放和复制方法
    listSetFreeMethod(c->reply,decrRefCountVoid);
    listSetDupMethod(c->reply,dupClientReplyValue);
    // 阻塞类型
    c->btype = BLOCKED_NONE;
    // 阻塞超过时间
    c->bpop.timeout = 0;
    // 造成阻塞的键字典
    c->bpop.keys = dictCreate(&setDictType,NULL);
    // 存储解除阻塞的键，用于保存PUSH入元素的键，也就是dstkey
    c->bpop.target = NULL;
    // 阻塞状态
    c->bpop.numreplicas = 0;
    // 要达到的复制偏移量
    c->bpop.reploffset = 0;
    // 全局的复制偏移量
    c->woff = 0;
    // 监控的键
    c->watched_keys = listCreate();
    // 订阅频道
    c->pubsub_channels = dictCreate(&setDictType,NULL);
    // 订阅模式
    c->pubsub_patterns = listCreate();
    // 被缓存的peerid，peerid就是 ip:port
    c->peerid = NULL;
    // 订阅发布模式的释放和比较方法
    listSetFreeMethod(c->pubsub_patterns,decrRefCountVoid);
    listSetMatchMethod(c->pubsub_patterns,listMatchObjects);
    // 将真正的client放在服务器的客户端链表中
    if (fd != -1) listAddNodeTail(server.clients,c);
    // 初始化client的事物状态
    initClientMultiState(c);
    return c;
}
```

根据创建的文件描述符`fd`，可以创建用于不同场景下的`client`. 这个`fd`就是服务器接收客户端`connect`后所返回的文件描述符.

- fd == -1，表示创建一个无网络连接的客户端。主要用于执行 lua 脚本时.
- fd != -1，表示接收到一个正常的客户端连接，则会创建一个有网络连接的客户端，也就是创建一个文件事件，来监听这个fd是否可读，当客户端发送数据，则事件被触发.

创建客户端的过程，会将`server.h/client`结构的所有成员初始化，接下里会介绍部分重点的成员.

`int id`：服务器对于每一个连接进来的都会创建一个ID，客户端的ID从1开始。每次重启服务器会刷新.

`int fd`：当前客户端状态描述符。分为无网络连接的客户端和有网络连接的客户端.

`int flags`：客户端状态的标志.

`robj *name`：默认创建的客户端是没有名字的，可以通过`CLIENT SETNAME`命令设置名字. 后面会介绍该命令的实现.

`int reqtype`：请求协议的类型. 因为Redis服务器支持`Telnet`的连接，因此Telnet命令请求协议类型是`PROTO_REQ_INLINE`，而`redis-cli`命令请求的协议类型是`PROTO_REQ_MULTIBULK`.

用于保存服务器接受客户端命令的成员：

`sds querybuf`：保存客户端发来命令请求的输入缓冲区. 以Redis通信协议的方式保存.

`size_t querybuf_peak`：保存输入缓冲区的峰值.

`int argc`：命令参数个数.

`robj *argv`：命令参数列表.

用于保存服务器给客户端回复的成员：

`char buf[16*1024]`：保存执行完命令所得命令回复信息的静态缓冲区，它的大小是固定的，所以主要保存的是一些比较短的回复. 分配`client`结构空间时，就会分配一个`16K`的大小.

`int bufpos`：记录静态缓冲区的偏移量，也就是buf数组已经使用的字节数.

`list *reply`：保存命令回复的链表. 因为静态缓冲区大小固定，主要保存固定长度的命令回复，当处理一些返回大量回复的命令，则会将命令回复以链表的形式连接起来.

`unsigned long long reply_bytes`：保存回复链表的字节数.

`size_t sentlen`：已发送回复的字节数.

#### 2.2 客户端的释放

客户端释放的函数是`freeClient()`，主要就是释放各种数据结构和清空一些缓冲区等操作，这里就不再列出源码.

我们可以重点关注一下异步释放客户端，源码如下：

```java
// 异步释放client
void freeClientAsync(client *c) {
    // 如果是已经即将关闭或者是lua脚本的伪client，则直接返回
    if (c->flags & CLIENT_CLOSE_ASAP || c->flags & CLIENT_LUA) return;
    c->flags |= CLIENT_CLOSE_ASAP;
    // 将client加入到即将关闭的client链表中
    // server.clients_to_close 中保存着服务器中所有待关闭的链表
    listAddNodeTail(server.clients_to_close,c);
}
```

设置异步释放客户端的目的主要是：防止底层函数正在向客户端的输出缓冲区写数据的时候，关闭客户端，这样是不安全的. Redis会安排客户端在`serverCron()`函数的安全时间释放它.

当然也可以取消异步释放，那么就会调用`freeClient()`函数立即释放，源码如下：

```java
// 取消设置异步释放的client
void freeClientsInAsyncFreeQueue(void) {
    // 遍历所有即将关闭的client
    while (listLength(server.clients_to_close)) {
        listNode *ln = listFirst(server.clients_to_close);
        client *c = listNodeValue(ln);
        // 取消立即关闭的标志
        c->flags &= ~CLIENT_CLOSE_ASAP;
        freeClient(c);
        // 从即将关闭的client链表中删除
        listDelNode(server.clients_to_close,ln);
    }
}
```

### 3. 命令接收与命令回复

#### 3.1 命令接收

当客户端连接上Redis服务器后，服务器会得到一个文件描述符`fd`，而且服务器会监听该文件描述符的读事件，这些在`createClient()`函数中. 那么当客户端发送了命令，触发了`AE_READABLE`事件，那么就会调用回调函数`readQueryFromClient()`来从文件描述符fd中读发来的命令，并保存在输入缓冲区`querybuf`中. 而这个回调函数就是我们在Redis事件处理一文中所提到的指向回调函数的指针`rfileProc`和`wfileProc`. 那么，我们先来分析`readQueryFromClient`函数.

```java
// 读取client的输入缓冲区的内容
void readQueryFromClient(aeEventLoop *el, int fd, void *privdata, int mask) {
    client *c = (client*) privdata;
    int nread, readlen;
    size_t qblen;
    UNUSED(el);
    UNUSED(mask);
    // 读入的长度，默认16MB
    readlen = PROTO_IOBUF_LEN;
    // 如果是多条请求，根据请求的大小，设置读入的长度readlen
    if (c->reqtype == PROTO_REQ_MULTIBULK && c->multibulklen && c->bulklen != -1
        && c->bulklen >= PROTO_MBULK_BIG_ARG)
    {
        int remaining = (unsigned)(c->bulklen+2)-sdslen(c->querybuf);
        if (remaining < readlen) readlen = remaining;
    }
    // 输入缓冲区的长度
    qblen = sdslen(c->querybuf);
    // 更新缓冲区的峰值
    if (c->querybuf_peak < qblen) c->querybuf_peak = qblen;
    // 扩展缓冲区的大小
    c->querybuf = sdsMakeRoomFor(c->querybuf, readlen);
    // 将client发来的命令，读入到输入缓冲区中
    nread = read(fd, c->querybuf+qblen, readlen);
    // 读操作出错
    if (nread == -1) {
        if (errno == EAGAIN) {
            return;
        } else {
            serverLog(LL_VERBOSE, "Reading from client: %s",strerror(errno));
            freeClient(c);
            return;
        }
    // 读操作完成
    } else if (nread == 0) {
        serverLog(LL_VERBOSE, "Client closed connection");
        freeClient(c);
        return;
    }
    // 更新输入缓冲区的已用大小和未用大小。
    sdsIncrLen(c->querybuf,nread);
    // 设置最后一次服务器和client交互的时间
    c->lastinteraction = server.unixtime;
    // 如果是主节点，则更新复制操作的偏移量
    if (c->flags & CLIENT_MASTER) c->reploff += nread;
    // 更新从网络输入的字节数
    server.stat_net_input_bytes += nread;
    // 如果输入缓冲区长度超过服务器设置的最大缓冲区长度
    if (sdslen(c->querybuf) > server.client_max_querybuf_len) {
        // 将client信息转换为sds
        sds ci = catClientInfoString(sdsempty(),c), bytes = sdsempty();
        // 输入缓冲区保存在bytes中
        bytes = sdscatrepr(bytes,c->querybuf,64);
        // 打印到日志
        serverLog(LL_WARNING,"Closing client that reached max query buffer length: %s (qbuf initial bytes: %s)", ci, bytes);
        // 释放空间
        sdsfree(ci);
        sdsfree(bytes);
        freeClient(c);
        return;
    }
    // 处理client输入的命令内容
    processInputBuffer(c);
}
```

实际上，这个`readQueryFromClient()`函数是read函数的封装，从文件描述符`fd`中读出数据到输入缓冲区`querybuf`中，并更新输入缓冲区的峰值`querybuf_peak`，而且会检查读的长度，如果大于了`server.client_max_querybuf_len`则会退出，而这个阀值在服务器初始化为`PROTO_MAX_QUERYBUF_LEN (1024*1024*1024)`也就是`1G`大小.

回忆之前的各种命令实现，都是通过client的argv和argc这两个成员来处理的. 因此，服务器还需要将输入缓冲区`querybuf`中的数据，处理成参数列表的对象，也就是上面的`processInputBuffer()`函数. 源码如下：

```java
// 处理client输入的命令内容
void processInputBuffer(client *c) {
    server.current_client = c;
    // 一直读输入缓冲区的内容
    while(sdslen(c->querybuf)) {
        // 如果处于暂停状态，直接返回
        if (!(c->flags & CLIENT_SLAVE) && clientsArePaused()) break;
        // 如果client处于被阻塞状态，直接返回
        if (c->flags & CLIENT_BLOCKED) break;
        // 如果client处于关闭状态，则直接返回
        if (c->flags & (CLIENT_CLOSE_AFTER_REPLY|CLIENT_CLOSE_ASAP)) break;
        // 如果是未知的请求类型，则判定请求类型
        if (!c->reqtype) {
            // 如果是"*"开头，则是多条请求，是client发来的
            if (c->querybuf[0] == '*') {
                c->reqtype = PROTO_REQ_MULTIBULK;
            // 否则就是内联请求，是Telnet发来的
            } else {
                c->reqtype = PROTO_REQ_INLINE;
            }
        }
        // 如果是内联请求
        if (c->reqtype == PROTO_REQ_INLINE) {
            // 处理Telnet发来的内联命令，并创建成对象，保存在client的参数列表中
            if (processInlineBuffer(c) != C_OK) break;
        // 如果是多条请求
        } else if (c->reqtype == PROTO_REQ_MULTIBULK) {
            // 将client的querybuf中的协议内容转换为client的参数列表中的对象
            if (processMultibulkBuffer(c) != C_OK) break;
        } else {
            serverPanic("Unknown request type");
        }
        // 如果参数为0，则重置client
        if (c->argc == 0) {
            resetClient(c);
        } else {
            /* Only reset the client when the command was executed. */
            // 执行命令成功后重置client
            if (processCommand(c) == C_OK)
                resetClient(c);
            if (server.current_client == NULL) break;
        }
    }
    // 执行成功，则将用于崩溃报告的client设置为NULL
    server.current_client = NULL;
}
```

`redis-cli`命令请求的协议类型是`PROTO_REQ_MULTIBULK`，进而调用`processMultibulkBuffer()`函数来处理：

```java
// 将client的querybuf中的协议内容转换为client的参数列表中的对象
int processMultibulkBuffer(client *c) {
    char *newline = NULL;
    int pos = 0, ok;
    long long ll;
    // 参数列表中命令数量为0，因此先分配空间
    if (c->multibulklen == 0) {
        /* The client should have been reset */
        serverAssertWithInfo(c,NULL,c->argc == 0);
        /* Multi bulk length cannot be read without a \r\n */
        // 查询第一个换行符
        newline = strchr(c->querybuf,'\r');
        // 没有找到\r\n，表示不符合协议，返回错误
        if (newline == NULL) {
            if (sdslen(c->querybuf) > PROTO_INLINE_MAX_SIZE) {
                addReplyError(c,"Protocol error: too big mbulk count string");
                setProtocolError(c,0);
            }
            return C_ERR;
        }
        /* Buffer should also contain \n */
        // 检查格式
        if (newline-(c->querybuf) > ((signed)sdslen(c->querybuf)-2))
            return C_ERR;
        /* We know for sure there is a whole line since newline != NULL,
         * so go ahead and find out the multi bulk length. */
        // 保证第一个字符为'*'
        serverAssertWithInfo(c,NULL,c->querybuf[0] == '*');
        // 将'*'之后的数字转换为整数。*3\r\n
        ok = string2ll(c->querybuf+1,newline-(c->querybuf+1),&ll);
        if (!ok || ll > 1024*1024) {
            addReplyError(c,"Protocol error: invalid multibulk length");
            setProtocolError(c,pos);
            return C_ERR;
        }
        // 指向"*3\r\n"的"\r\n"之后的位置
        pos = (newline-c->querybuf)+2;
        // 空白命令，则将之前的删除，保留未阅读的部分
        if (ll <= 0) {
            sdsrange(c->querybuf,pos,-1);
            return C_OK;
        }
        // 参数数量
        c->multibulklen = ll;
        /* Setup argv array on client structure */
        // 分配client参数列表的空间
        if (c->argv) zfree(c->argv);
        c->argv = zmalloc(sizeof(robj*)*c->multibulklen);
    }
    serverAssertWithInfo(c,NULL,c->multibulklen > 0);
    // 读入multibulklen个参数，并创建对象保存在参数列表中
    while(c->multibulklen) {
        /* Read bulk length if unknown */
        // 读入参数的长度
        if (c->bulklen == -1) {
            // 找到换行符，确保"\r\n"存在
            newline = strchr(c->querybuf+pos,'\r');
            if (newline == NULL) {
                if (sdslen(c->querybuf) > PROTO_INLINE_MAX_SIZE) {
                    addReplyError(c,
                        "Protocol error: too big bulk count string");
                    setProtocolError(c,0);
                    return C_ERR;
                }
                break;
            }
            /* Buffer should also contain \n */
            // 检查格式
            if (newline-(c->querybuf) > ((signed)sdslen(c->querybuf)-2))
                break;
            // $3\r\nSET\r\n...，确保是'$'字符，保证格式
            if (c->querybuf[pos] != '$') {
                addReplyErrorFormat(c,
                    "Protocol error: expected '$', got '%c'",
                    c->querybuf[pos]);
                setProtocolError(c,pos);
                return C_ERR;
            }
            // 将参数长度保存到ll。
            ok = string2ll(c->querybuf+pos+1,newline-(c->querybuf+pos+1),&ll);
            if (!ok || ll < 0 || ll > 512*1024*1024) {
                addReplyError(c,"Protocol error: invalid bulk length");
                setProtocolError(c,pos);
                return C_ERR;
            }
            // 定位第一个参数的位置，也就是SET的S
            pos += newline-(c->querybuf+pos)+2;
            // 参数长度太长，进行优化
            if (ll >= PROTO_MBULK_BIG_ARG) {
                size_t qblen;
                /* If we are going to read a large object from network
                 * try to make it likely that it will start at c->querybuf
                 * boundary so that we can optimize object creation
                 * avoiding a large copy of data. */
                // 如果我们要从网络中读取一个大的对象，尝试使它可能从c-> querybuf边界开始，以便我们可以优化对象创建，避免大量的数据副本
                // 保存未读取的部分
                sdsrange(c->querybuf,pos,-1);
                // 重置偏移量
                pos = 0;
                // 获取querybuf中已使用的长度
                qblen = sdslen(c->querybuf);
                /* Hint the sds library about the amount of bytes this string is
                 * going to contain. */
                // 扩展querybuf的大小
                if (qblen < (size_t)ll+2)
                    c->querybuf = sdsMakeRoomFor(c->querybuf,ll+2-qblen);
            }
            // 保存参数的长度
            c->bulklen = ll;
        }
        /* Read bulk argument */
        // 因为只读了multibulklen字节的数据，读到的数据不够，则直接跳出循环，执行processInputBuffer()函数循环读取
        if (sdslen(c->querybuf)-pos < (unsigned)(c->bulklen+2)) {
            /* Not enough data (+2 == trailing \r\n) */
            break;
        // 为参数创建了对象
        } else {
            /* Optimization: if the buffer contains JUST our bulk element
             * instead of creating a new object by *copying* the sds we
             * just use the current sds string. */
            // 如果读入的长度大于32k
            if (pos == 0 &&
                c->bulklen >= PROTO_MBULK_BIG_ARG &&
                (signed) sdslen(c->querybuf) == c->bulklen+2)
            {
                c->argv[c->argc++] = createObject(OBJ_STRING,c->querybuf);
                // 跳过换行
                sdsIncrLen(c->querybuf,-2); /* remove CRLF */
                /* Assume that if we saw a fat argument we'll see another one
                 * likely... */
                // 设置一个新长度
                c->querybuf = sdsnewlen(NULL,c->bulklen+2);
                sdsclear(c->querybuf);
                pos = 0;
            // 创建对象保存在client的参数列表中
            } else {
                c->argv[c->argc++] =
                    createStringObject(c->querybuf+pos,c->bulklen);
                pos += c->bulklen+2;
            }
            // 清空命令内容的长度
            c->bulklen = -1;
            // 未读取命令参数的数量，读取一个，该值减1
            c->multibulklen--;
        }
    }
    /* Trim to pos */
    // 删除已经读取的，保留未读取的
    if (pos) sdsrange(c->querybuf,pos,-1);
    /* We're done when c->multibulk == 0 */
    // 命令的参数全部被读取完
    if (c->multibulklen == 0) return C_OK;
    /* Still not read to process the command */
    return C_ERR;
}
```

我们结合一个多条批量回复进行分析。一个多条批量回复以 `*\r\n`为前缀，后跟多条不同的批量回复，其中 `argc`为这些批量回复的数量. 那么`SET nmykey nmyvalue`命令转换为Redis协议内容如下：

```java
"*3\r\n$3\r\nSET\r\n$5\r\nmykey\r\n$7\r\nmyvalue\r\n"
```

当进入`processMultibulkBuffer()`函数之后，如果是第一次执行该函数，那么`argv`中未读取的命令数量为0，也就是说参数列表为空，那么会执行`if (c->multibulklen == 0)`的代码，这里的代码会解析`*3\r\n`，将`3`保存到`multibulklen`中，表示后面的参数个数，然后根据参数个数，为`argv`分配空间.

接着，执行`multibulklen`次while循环，每次读一个参数，例如`$3\r\nSET\r\n`，也是先读出参数长度，保存在`bulklen`中，然后将参数`SET`保存构建成对象保存到参数列表中. 每次读一个参数，`multibulklen`就会减1，当等于0时，就表示命令的参数全部读取到参数列表完毕.

于是命令接收的整个过程完成.

#### 3.2 命令回复

命令回复的函数，也是事件处理程序的回调函数之一. 当服务器的client的回复缓冲区有数据，那么就会调用`aeCreateFileEvent(server.el, c->fd, AE_WRITABLE,sendReplyToClient, c)`函数，将`文件描述符fd`和`AE_WRITABLE`事件关联起来，当客户端可写时，就会触发事件，调用`sendReplyToClient()`函数，执行写事件. 我们重点看这个函数的代码：

```java
// 写事件处理程序，只是发送回复给client
void sendReplyToClient(aeEventLoop *el, int fd, void *privdata, int mask) {
    UNUSED(el);
    UNUSED(mask);
    // 发送完数据会删除fd的可读事件
    writeToClient(fd,privdata,1);
}
```

这个函数直接调用了`writeToClient()`函数：

```java
// 将输出缓冲区的数据写给client，如果client被释放则返回C_ERR，没被释放则返回C_OK
int writeToClient(int fd, client *c, int handler_installed) {
    ssize_t nwritten = 0, totwritten = 0;
    size_t objlen;
    size_t objmem;
    robj *o;
    // 如果指定的client的回复缓冲区中还有数据，则返回真，表示可以写socket
    while(clientHasPendingReplies(c)) {
        // 固定缓冲区发送未完成
        if (c->bufpos > 0) {
            // 将缓冲区的数据写到fd中
            nwritten = write(fd,c->buf+c->sentlen,c->bufpos-c->sentlen);
            // 写失败跳出循环
            if (nwritten <= 0) break;
            // 更新发送的数据计数器
            c->sentlen += nwritten;
            totwritten += nwritten;
            // 如果发送的数据等于buf的偏移量，表示发送完成
            if ((int)c->sentlen == c->bufpos) {
                // 则将其重置
                c->bufpos = 0;
                c->sentlen = 0;
            }
        // 固定缓冲区发送完成，发送回复链表的内容
        } else {
            // 回复链表的第一条回复对象，和对象值的长度和所占的内存
            o = listNodeValue(listFirst(c->reply));
            objlen = sdslen(o->ptr);
            objmem = getStringObjectSdsUsedMemory(o);
            // 跳过空对象，并删除这个对象
            if (objlen == 0) {
                listDelNode(c->reply,listFirst(c->reply));
                c->reply_bytes -= objmem;
                continue;
            }
            // 将当前节点的值写到fd中
            nwritten = write(fd, ((char*)o->ptr)+c->sentlen,objlen-c->sentlen);
            // 写失败跳出循环
            if (nwritten <= 0) break;
            // 更新发送的数据计数器
            c->sentlen += nwritten;
            totwritten += nwritten;
            // 发送完成，则删除该节点，重置发送的数据长度，更新回复链表的总字节数
            if (c->sentlen == objlen) {
                listDelNode(c->reply,listFirst(c->reply));
                c->sentlen = 0;
                c->reply_bytes -= objmem;
            }
        }
        // 更新写到网络的字节数
        server.stat_net_output_bytes += totwritten;
        // 如果这次写的总量大于NET_MAX_WRITES_PER_EVENT的限制，则会中断本次的写操作，将处理时间让给其他的client，以免一个非常的回复独占服务器，剩余的数据下次继续在写
        // 但是，如果当服务器的内存数已经超过maxmemory，即使超过最大写NET_MAX_WRITES_PER_EVENT的限制，也会继续执行写入操作，是为了尽快写入给客户端
        if (totwritten > NET_MAX_WRITES_PER_EVENT &&
            (server.maxmemory == 0 ||
             zmalloc_used_memory() < server.maxmemory)) break;
    }
    // 处理写入失败
    if (nwritten == -1) {
        if (errno == EAGAIN) {
            nwritten = 0;
        } else {
            serverLog(LL_VERBOSE,
                "Error writing to client: %s", strerror(errno));
            freeClient(c);
            return C_ERR;
        }
    }
    // 写入成功
    if (totwritten > 0) {
        // 如果不是主节点服务器，则更新最近和服务器交互的时间
        if (!(c->flags & CLIENT_MASTER)) c->lastinteraction = server.unixtime;
    }
    // 如果指定的client的回复缓冲区中已经没有数据，发送完成
    if (!clientHasPendingReplies(c)) {
        c->sentlen = 0;
        // 删除当前client的可读事件的监听
        if (handler_installed) aeDeleteFileEvent(server.el,c->fd,AE_WRITABLE);
        /* Close connection after entire reply has been sent. */
        // 如果指定了写入按成之后立即关闭的标志，则释放client
        if (c->flags & CLIENT_CLOSE_AFTER_REPLY) {
            freeClient(c);
            return C_ERR;
        }
    }
    return C_OK;
}
```

这个函数实际上是对`write()`函数的封装，将静态回复缓冲区`buf`或回复链表`reply`中的数据循环写到文件描述符`fd`中. 如果写完了，则将当前客户端的`AE_WRITABLE`事件删除.

### 4. CLIENT命令的实现

`CLIENT`相关的命令大致有6条：

```java
CLIENT KILL [ip:port] [ID client-id] [TYPE normal|master|slave|pubsub] [ADDR ip:port] [SKIPME yes/no] 
CLIENT GETNAME
CLIENT LIST
CLIENT PAUSE timeout 
CLIENT REPLY ON|OFF|SKIP 
CLIENT SETNAME connection-name 
```

下面是`client`命令的实现：

```java
// client 命令的实现
void clientCommand(client *c) {
    listNode *ln;
    listIter li;
    client *client;
    //  CLIENT LIST 的实现
    if (!strcasecmp(c->argv[1]->ptr,"list") && c->argc == 2) {
        /* CLIENT LIST */
        // 获取所有的client信息
        sds o = getAllClientsInfoString();
        // 添加到到输入缓冲区中
        addReplyBulkCBuffer(c,o,sdslen(o));
        sdsfree(o);
    // CLIENT REPLY ON|OFF|SKIP 命令实现
    } else if (!strcasecmp(c->argv[1]->ptr,"reply") && c->argc == 3) {
        /* CLIENT REPLY ON|OFF|SKIP */
        // 如果是 ON
        if (!strcasecmp(c->argv[2]->ptr,"on")) {
            // 取消 off 和 skip 的标志
            c->flags &= ~(CLIENT_REPLY_SKIP|CLIENT_REPLY_OFF);
            // 回复 +OK
            addReply(c,shared.ok);
        // 如果是 OFF
        } else if (!strcasecmp(c->argv[2]->ptr,"off")) {
            // 打开 OFF标志
            c->flags |= CLIENT_REPLY_OFF;
        // 如果是 SKIP
        } else if (!strcasecmp(c->argv[2]->ptr,"skip")) {
            // 没有设置 OFF 则设置 SKIP 标志
            if (!(c->flags & CLIENT_REPLY_OFF))
                c->flags |= CLIENT_REPLY_SKIP_NEXT;
        } else {
            addReply(c,shared.syntaxerr);
            return;
        }
    //  CLIENT KILL [ip:port] [ID client-id] [TYPE normal | master | slave | pubsub] [ADDR ip:port] [SKIPME yes / no]
    } else if (!strcasecmp(c->argv[1]->ptr,"kill")) {
        /* CLIENT KILL <ip:port>
         * CLIENT KILL <option> [value] ... <option> [value] */
        char *addr = NULL;
        int type = -1;
        uint64_t id = 0;
        int skipme = 1;
        int killed = 0, close_this_client = 0;
        // CLIENT KILL addr:port只能通过地址杀死client，旧版本兼容
        if (c->argc == 3) {
            /* Old style syntax: CLIENT KILL <addr> */
            addr = c->argv[2]->ptr;
            skipme = 0; /* With the old form, you can kill yourself. */
        // 新版本可以根据[ID client-id] [master|normal|slave|pubsub] [ADDR ip:port] [SKIPME yes/no]杀死client
        } else if (c->argc > 3) {
            int i = 2; /* Next option index. */
            /* New style syntax: parse options. */
            // 解析语法
            while(i < c->argc) {
                int moreargs = c->argc > i+1;
                // CLIENT KILL [ID client-id]
                if (!strcasecmp(c->argv[i]->ptr,"id") && moreargs) {
                    long long tmp;
                    // 获取client的ID
                    if (getLongLongFromObjectOrReply(c,c->argv[i+1],&tmp,NULL)
                        != C_OK) return;
                    id = tmp;
                // CLIENT KILL TYPE type, 这里的 type 可以是 [master|normal|slave|pubsub]
                } else if (!strcasecmp(c->argv[i]->ptr,"type") && moreargs) {
                    // 获取client的类型，[master|normal|slave|pubsub]四种之一
                    type = getClientTypeByName(c->argv[i+1]->ptr);
                    if (type == -1) {
                        addReplyErrorFormat(c,"Unknown client type '%s'",
                            (char*) c->argv[i+1]->ptr);
                        return;
                    }
                // CLIENT KILL [ADDR ip:port]
                } else if (!strcasecmp(c->argv[i]->ptr,"addr") && moreargs) {
                    // 获取ip:port
                    addr = c->argv[i+1]->ptr;
                // CLIENT KILL [SKIPME yes/no]
                } else if (!strcasecmp(c->argv[i]->ptr,"skipme") && moreargs) {
                    // 如果是yes，设置设置skipme，调用该命令的客户端将不会被杀死
                    if (!strcasecmp(c->argv[i+1]->ptr,"yes")) {
                        skipme = 1;
                    // 设置为no会影响到还会杀死调用该命令的客户端。
                    } else if (!strcasecmp(c->argv[i+1]->ptr,"no")) {
                        skipme = 0;
                    } else {
                        addReply(c,shared.syntaxerr);
                        return;
                    }
                } else {
                    addReply(c,shared.syntaxerr);
                    return;
                }
                i += 2;
            }
        } else {
            addReply(c,shared.syntaxerr);
            return;
        }
        /* Iterate clients killing all the matching clients. */
        listRewind(server.clients,&li);
        // 迭代所有的client节点
        while ((ln = listNext(&li)) != NULL) {
            client = listNodeValue(ln);
            // 比较当前client和这四类信息，如果有一个不符合就跳过本层循环，否则就比较下一个信息
            if (addr && strcmp(getClientPeerId(client),addr) != 0) continue;
            if (type != -1 && getClientType(client) != type) continue;
            if (id != 0 && client->id != id) continue;
            if (c == client && skipme) continue;
            /* Kill it. */
            // 杀死当前的client
            if (c == client) {
                close_this_client = 1;
            } else {
                freeClient(client);
            }
            // 计算杀死client的个数
            killed++;
        }
        /* Reply according to old/new format. */
        // 回复client信息
        if (c->argc == 3) {
            // 没找到符合信息的
            if (killed == 0)
                addReplyError(c,"No such client");
            else
                addReply(c,shared.ok);
        } else {
            // 发送杀死的个数
            addReplyLongLong(c,killed);
        }
        /* If this client has to be closed, flag it as CLOSE_AFTER_REPLY
         * only after we queued the reply to its output buffers. */
        if (close_this_client) c->flags |= CLIENT_CLOSE_AFTER_REPLY;
    //  CLIENT SETNAME connection-name
    } else if (!strcasecmp(c->argv[1]->ptr,"setname") && c->argc == 3) {
        int j, len = sdslen(c->argv[2]->ptr);
        char *p = c->argv[2]->ptr;
        /* Setting the client name to an empty string actually removes
         * the current name. */
        // 设置名字为空
        if (len == 0) {
            // 先释放掉原来的名字
            if (c->name) decrRefCount(c->name);
            c->name = NULL;
            addReply(c,shared.ok);
            return;
        }
        /* Otherwise check if the charset is ok. We need to do this otherwise
         * CLIENT LIST format will break. You should always be able to
         * split by space to get the different fields. */
        // 检查名字格式是否正确
        for (j = 0; j < len; j++) {
            if (p[j] < '!' || p[j] > '~') {
      /* ASCII is assumed. */
                addReplyError(c,
                    "Client names cannot contain spaces, "
                    "newlines or special characters.");
                return;
            }
        }
        // 释放原来的名字
        if (c->name) decrRefCount(c->name);
        // 设置新名字
        c->name = c->argv[2];
        incrRefCount(c->name);
        addReply(c,shared.ok);
    //  CLIENT GETNAME
    } else if (!strcasecmp(c->argv[1]->ptr,"getname") && c->argc == 2) {
        // 回复名字
        if (c->name)
            addReplyBulk(c,c->name);
        else
            addReply(c,shared.nullbulk);
    //  CLIENT PAUSE timeout
    } else if (!strcasecmp(c->argv[1]->ptr,"pause") && c->argc == 3) {
        long long duration;
        // 以毫秒为单位将等待时间保存在duration中
        if (getTimeoutFromObjectOrReply(c,c->argv[2],&duration,UNIT_MILLISECONDS)
                                        != C_OK) return;
        // 暂停client
        pauseClients(duration);
        addReply(c,shared.ok);
    } else {
        addReplyError(c, "Syntax error, try CLIENT (LIST | KILL | GETNAME | SETNAME | PAUSE | REPLY)");
    }
}
```
