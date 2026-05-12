# 16、Redis 源码解析 - Redis AOF持久化机制
- 来源：https://ddkk.com/zhuanlan/db/redis/8/16.html
- 分类：缓存数据库
- 分组：教程目录
### 1. AOF 介绍

除了RDB持久化功能之外，Redis 还提供了`AOF ( Append Only File )`持久化功能。与RDB持久化通过保存数据库中的键值对来记录数据库状态不同，AOF持久化是以日志的方式记录Redis服务器所执行的`写命令`来记录数据库状态的，重启时再重新执行AOF文件中的命令达到恢复数据的目的，如下图所示：

#### 1.1 AOF的优缺点

**优点**

- 该机制可以带来更高的数据安全性，即数据持久性.
- 由于该机制对日志文件的写入操作采用的是append模式，因此在写入过程中即使出现宕机现象，也不会破坏日志文件中已经存在的内容.
- AOF包含一个格式清晰、易于理解的日志文件用于记录所有的修改操作. 事实上，我们也可以通过该文件完成数据的重建.

**缺点**

- 相对于RDB，AOF远大于RDB，修复速度也比RDB慢.
- AOF运行效率也比RDB慢，因此默认RDB操作.

### 2. AOF持久化的实现

#### 2.1 命令写入磁盘

##### 2.1.1 命令追加

当AOF持久化功能处于打开状态时，服务器在执行完一个写命令之后，会以协议格式将被执行的写命令追加到服务器状态的`aof_buf`缓冲区的末尾：

缓冲区由`SDS`实现，如下：

```java
struct redisServer {
	// AOF缓冲区
	// 在进入事件循环之前写入
	sds aof_buf;
};
```

在执行`AOF`文件写入的时候，Redis会直接向这个`SDS`类型的缓冲区中写入`文本协议格式`，如下所示：

```java
*2\r\n$6\r\nSELECT\r\n$1\r\n0\r\n*5\r\n$4\r\nSADD\r\n$3\r\nkey\r\n$2\r\nm3\r\n$2\r\nm2\r\n$2\r\nm1\r\n
```

命令解读：

- *2表示接下来是一行新的命令，该命令由2个单词组成； `$`6表示第一个单词有6个字符，即SELECT； `$`1表示第二个单词有1个字符，即0。
- *5表示接下来是一行新的命令，该命令由5个单词组成； `$`4表示第一个单词有4个字符，即SADD； `$`3表示第二个单词有3个字符，即key； `$`2表示第三个单词有2个字符，即m3； `$`2表示第四个单词有2个字符，即m2； `$`2表示第四个单词有2个字符，即m1。

所以这两条命令就是：

```java
SELECT 0
SADD key m3 m2 m1
```

文本协议具有很高的可读性，可以直接进行修改。而且，文本协议还具有很好的兼容性，而且协议采用了`\r\n`换行符，所以每次写入命令只需执行追加操作.

**追加命令到缓冲区中**

源码中使用`catAppendOnlyGenericCommand()`函数实现了追加命令到缓冲区中。

```java
// 根据传入的命令和命令参数，将他们还原成协议格式
// 每次传入一行命令
// 参数： 缓冲区 命令单词数 命令
sds catAppendOnlyGenericCommand(sds dst, int argc, robj **argv) {
		// 临时缓冲区
    char buf[32];
    int len, j;
    robj *o;
    // 格式："*<argc>\r\n"
    buf[0] = '*';
    // long long类型转C字符串，成功返回转换后字符串长度，失败返回0
    //这里是将命令的单词个数存入buf中，然后返回len，len作为临时缓冲区buf的下标
    len = 1+ll2string(buf+1,sizeof(buf)-1,argc);
    buf[len++] = '\r';
    buf[len++] = '\n';
    // 拼接到dst的后面
    dst = sdscatlen(dst,buf,len);
    // 遍历所有的参数，建立命令的格式：$<command_len>\r\n<command>\r\n
    for (j = 0; j < argc; j++) {
        o = getDecodedObject(argv[j]);  //解码成字符串对象
        buf[0] = '$';
        // 表示每个单词的长度
        len = 1+ll2string(buf+1,sizeof(buf)-1,sdslen(o->ptr));
        buf[len++] = '\r';
        buf[len++] = '\n';
        // 长度
        dst = sdscatlen(dst,buf,len);
        // 命令本体
        dst = sdscatlen(dst,o->ptr,sdslen(o->ptr));
        dst = sdscatlen(dst,"\r\n",2);
        // 引用计数减一
        // 当引用对象等于1时，在操作引用计数减1，直接释放对象的ptr和对象空间
        decrRefCount(o);
    }
    return dst; //返回还原后的协议内容
}
```

**追加过期命令的键**

`catAppendOnlyGenericCommand()`函数只是追加一个普通的键，然而一个过期命令的键，需要全部转换为`PEXPIREAT`，因为必须将相对时间设置为绝对时间，否则还原数据库时，就无法得知该键是否过期，Redis的`catAppendOnlyExpireAtCommand()`函数实现了这个功能。

```java
// 用sds表示一个 PEXPIREAT 命令，seconds为生存时间，cmd为指定转换的指令
// 这个函数用来转换 EXPIRE and PEXPIRE 命令成 PEXPIREAT ，以便在AOF时，时间总是一个绝对值
sds catAppendOnlyExpireAtCommand(sds buf, struct redisCommand *cmd, robj *key, robj *seconds) {
    long long when;
    robj *argv[3];
    /* Make sure we can use strtoll */
    // 解码成字符串对象，以便使用strtoll函数
    seconds = getDecodedObject(seconds);
    // 取出过期值，long long类型
    when = strtoll(seconds->ptr,NULL,10);
    /* Convert argument into milliseconds for EXPIRE, SETEX, EXPIREAT */
    // 将 EXPIRE, SETEX, EXPIREAT 参数的秒转换成毫秒
    if (cmd->proc == expireCommand || cmd->proc == setexCommand ||
        cmd->proc == expireatCommand)
    {
        when *= 1000;
    }
    /* Convert into absolute time for EXPIRE, PEXPIRE, SETEX, PSETEX */
    // 将 EXPIRE, PEXPIRE, SETEX, PSETEX 命令的参数，从相对时间设置为绝对时间
    if (cmd->proc == expireCommand || cmd->proc == pexpireCommand ||
        cmd->proc == setexCommand || cmd->proc == psetexCommand)
    {
        when += mstime();
    }
    decrRefCount(seconds);
    // 创建一个 PEXPIREAT 命令对象
    argv[0] = createStringObject("PEXPIREAT",9);
    argv[1] = key;
    argv[2] = createStringObjectFromLongLong(when);
    // 将命令还原成协议格式，追加到buf
    buf = catAppendOnlyGenericCommand(buf, 3, argv);
    decrRefCount(argv[0]);
    decrRefCount(argv[2]);
    // 返回buf
    return buf;
}
```

这两个函数都是实现的底层功能，最后它们都会被`feedAppendOnlyFile()`函数调用.

##### 2.1.2 AOF文件写入

`feedAppendOnlyFile()`函数会创建一个空的简单`动态字符串（sds）`，将当前所有追加命令操作都追加到这个sds中，最终将这个sds追加到`server.aof_buf`. 还有就是，这个函数在写入键之前，需要显式的写入一个`SELECT`命令，以正确的将所有键还原到正确的数据库中.

```java
// 将命令追加到AOF文件中
void feedAppendOnlyFile(struct redisCommand *cmd, int dictid, robj **argv, int argc) {
    sds buf = sdsempty();   //设置一个空sds
    robj *tmpargv[3];
    // 使用SELECT命令，显式的设置当前数据库
    if (dictid != server.aof_selected_db) {
        char seldb[64];
        snprintf(seldb,sizeof(seldb),"%d",dictid);
        // 构造SELECT命令的协议格式
        buf = sdscatprintf(buf,"*2\r\n$6\r\nSELECT\r\n$%lu\r\n%s\r\n",
            (unsigned long)strlen(seldb),seldb);
        // 执行AOF时，当前的数据库ID
        server.aof_selected_db = dictid;
    }
    // 如果是 EXPIRE/PEXPIRE/EXPIREAT 三个命令，则要转换成 PEXPIREAT 命令
    if (cmd->proc == expireCommand || cmd->proc == pexpireCommand ||
        cmd->proc == expireatCommand) {
        /* Translate EXPIRE/PEXPIRE/EXPIREAT into PEXPIREAT */
        buf = catAppendOnlyExpireAtCommand(buf,cmd,argv[1],argv[2]);
    // 如果是 SETEX/PSETEX 命令，则转换成 SET and PEXPIREAT
    } else if (cmd->proc == setexCommand || cmd->proc == psetexCommand) {
        /* Translate SETEX/PSETEX to SET and PEXPIREAT */
        // SETEX key seconds value
        // 构建SET命令对象
        tmpargv[0] = createStringObject("SET",3);
        tmpargv[1] = argv[1];
        tmpargv[2] = argv[3];
        // 将SET命令按协议格式追加到buf中
        buf = catAppendOnlyGenericCommand(buf,3,tmpargv);
        decrRefCount(tmpargv[0]);
        // 将SETEX/PSETEX命令和键对象按协议格式追加到buf中
        buf = catAppendOnlyExpireAtCommand(buf,cmd,argv[1],argv[2]);
    // 其他命令直接按协议格式转换，然后追加到buf中
    } else {
        buf = catAppendOnlyGenericCommand(buf,argc,argv);
    }
    // 如果正在进行AOF，则将命令追加到AOF的缓存中，在重新进入事件循环之前，这些命令会被冲洗到磁盘上，并向client回复
    if (server.aof_state == AOF_ON)
        server.aof_buf = sdscatlen(server.aof_buf,buf,sdslen(buf));
    // 如果后台正在进行重写，那么将命令追加到重写缓存区中，以便我们记录重写的AOF文件于当前数据库的差异
    if (server.aof_child_pid != -1)
        aofRewriteBufferAppend((unsigned char*)buf,sdslen(buf));
    sdsfree(buf);
}
```

##### 2.1.3 AOF文件同步

Redis的服务器进程就是一一个`事件循环（loop）`，这个循环中的文件事件负责接收客户端的命令请求，以及向客户端发送命令回复，而时间事件则负责执行像`serverCron()`函数这样需要定时运行的函数.

因为服务器在处理文件事件时可能会执行写命令，使得一些内容被追加到`aof_buf`缓冲区里面，所以在服务器每次结束一个事件循环之前，它都会调用`flushAppendOnlyFile()`函数，考虑是否需要将`aof_buf`缓冲区中的内容写入和保存到AOF文件里面.

`flushAppendOnlyFile()`函数的行为由服务器配置的`appendfsync`选项的值来决定，各个不同值产生的行为如下表所示：

appendfsync选项的值
flushAppendOnlyFile函数的行为

AOF_FSYNC_ALWAYS
命令写入aof_buf后调用系统fsync和操作同步到AOF文件，fsync完成后进程程返回

AOF_FSYNC_EVERYSEC
命令写入aof_buf后调用系统write操作，write完成后线程返回。fsync同步文件操作由进程每秒调用一次

AOF_FSYNC_NO
命令写入aof_buf后调用系统write操作，不对AOF文件做fsync同步，同步硬盘由操作由操作系统负责

如果用户没有主动为appendfsync选项设置值,那么appendfsync选项的默认值为everysec。

我们再来了解一下，`write`和`fsync`操作，在系统中都做了哪些事：

**write**

会触发`延迟写（delayed write）机制`。Linux在内核提供`页缓冲`区用来提高IO性能，因此，write操作在将数据写入操作系统的缓冲区后就直接返回，而不一定触发同步到磁盘的操作。只有在页空间写满，或者达到特定的时间周期，才会同步到磁盘。因此单纯的write操作也是有数据丢失的风险。

**fsync 和 fdatasync**

为此，系统提供了fsync 和fdatasync两个同步函数，它们可以强制让操作系统立即将缓冲区中的数据写入到硬盘里面，从而确保写入数据的安全性。

接下来看看同步的源码实现：

```java
// 将AOF缓存写到磁盘中
// 因为我们需要在回复client之前对AOF执行写操作，唯一的机会是在事件loop中，因此累计所有的AOF到缓存中，在下一次重新进入事件loop之前将缓存写到AOF文件中
// 关于force参数
// 当fsync被设置为每秒执行一次，如果后台仍有线程正在执行fsync操作，我们可能会延迟flush操作，因为write操作可能会被阻塞，当发生这种情况时，说明需要尽快的执行flush操作，会调用 serverCron() 函数。
// 然而如果force被设置为1，我们会无视后台的fsync，直接进行写入操作
#define AOF_WRITE_LOG_ERROR_RATE 30
// 将AOF缓存冲洗到磁盘中
void flushAppendOnlyFile(int force) {
    ssize_t nwritten;
    int sync_in_progress = 0;
    mstime_t latency;
    // 如果缓冲区中没有数据，直接返回
    if (sdslen(server.aof_buf) == 0) return;
    // 同步策略是每秒同步一次
    if (server.aof_fsync == AOF_FSYNC_EVERYSEC)
        // AOF同步操作是否在后台正在运行
        sync_in_progress = bioPendingJobsOfType(BIO_AOF_FSYNC) != 0;
    // 同步策略是每秒同步一次，且不是强制同步的
    if (server.aof_fsync == AOF_FSYNC_EVERYSEC && !force) {
        // 根据这个同步策略，且没有设置强制执行，我们在后台执行同步
        // 如果同步已经在后台执行，那么可以延迟两秒，如果设置了force，那么服务器会阻塞在write操作上
        // 如果后台正在执行同步
        if (sync_in_progress) {
            // 延迟执行flush操作的开始时间为0，表示之前没有延迟过write
            if (server.aof_flush_postponed_start == 0) {
                // 之前没有延迟过write操作，那么将延迟write操作的开始时间保存下来，然后就直接返回
                server.aof_flush_postponed_start = server.unixtime;
                return;
            // 如果之前延迟过write操作，如果没到2秒，直接返回，不执行write
            } else if (server.unixtime - server.aof_flush_postponed_start < 2) {
                return;
            }
            // 执行到这里，表示后台正在执行fsync，但是延迟时间已经超过2秒
            // 那么执行write操作，此时write会被阻塞
            server.aof_delayed_fsync++;
            serverLog(LL_NOTICE,"Asynchronous AOF fsync is taking too long (disk is busy?). Writing the AOF buffer without waiting for fsync to complete, this may slow down Redis.");
        }
    }
    // 执行write操作，保证写操作是原子操作
    // 设置延迟检测开始的时间
    latencyStartMonitor(latency);
    // 将缓冲区的内容写到AOF文件中
    nwritten = write(server.aof_fd,server.aof_buf,sdslen(server.aof_buf));
    // 设置延迟的时间 = 当前的时间 - 开始的时间
    latencyEndMonitor(latency);
    // 捕获不同造成延迟write的事件
    // 如果正在后台执行同步fsync
    if (sync_in_progress) {
        // 将latency和"aof-write-pending-fsync"关联到延迟诊断字典中
        latencyAddSampleIfNeeded("aof-write-pending-fsync",latency);
    // 如果正在执行AOF或正在执行RDB
    } else if (server.aof_child_pid != -1 || server.rdb_child_pid != -1) {
        // 将latency和"aof-write-active-child"关联到延迟诊断字典中
        latencyAddSampleIfNeeded("aof-write-active-child",latency);
    } else {
        // 将latency和"aof-write-alone"关联到延迟诊断字典中
        latencyAddSampleIfNeeded("aof-write-alone",latency);
    }
    // 将latency和"aof-write"关联到延迟诊断字典中
    latencyAddSampleIfNeeded("aof-write",latency);
    // 执行了write，所以清零延迟flush的时间
    server.aof_flush_postponed_start = 0;
    // 如果写入的字节数不等于缓存的字节数，发生异常错误
    if (nwritten != (signed)sdslen(server.aof_buf)) {
        static time_t last_write_error_log = 0;
        int can_log = 0;
        // 限制日志的频率每行30秒
        if ((server.unixtime - last_write_error_log) > AOF_WRITE_LOG_ERROR_RATE) {
            can_log = 1;
            last_write_error_log = server.unixtime;
        }
        // 如果写入错误，写errno到日志
        if (nwritten == -1) {
            if (can_log) {
                serverLog(LL_WARNING,"Error writing to the AOF file: %s",
                    strerror(errno));
                server.aof_last_write_errno = errno;
            }
        // 如果是写了一部分，发生错误
        } else {
            if (can_log) {
                serverLog(LL_WARNING,"Short write while writing to "
                                       "the AOF file: (nwritten=%lld, "
                                       "expected=%lld)",
                                       (long long)nwritten,
                                       (long long)sdslen(server.aof_buf));
            }
            // 将追加的内容截断，删除了追加的内容，恢复成原来的文件
            if (ftruncate(server.aof_fd, server.aof_current_size) == -1) {
                if (can_log) {
                    serverLog(LL_WARNING, "Could not remove short write "
                             "from the append-only file.  Redis may refuse "
                             "to load the AOF the next time it starts.  "
                             "ftruncate: %s", strerror(errno));
                }
            } else {
                nwritten = -1;
            }
            server.aof_last_write_errno = ENOSPC;
        }
        // 如果是写入的策略为每次写入就同步，无法恢复这种策略的写，因为我们已经告知使用者，已经将写的数据同步到磁盘了，因此直接退出程序
        if (server.aof_fsync == AOF_FSYNC_ALWAYS) {
            serverLog(LL_WARNING,"Can't recover from AOF write error when the AOF fsync policy is 'always'. Exiting...");
            exit(1);
        } else {
            //设置执行write操作的状态
            server.aof_last_write_status = C_ERR;
            // 如果只写入了局部，没有办法用ftruncate()函数去恢复原来的AOF文件
            if (nwritten > 0) {
                // 只能更新当前的AOF文件的大小
                server.aof_current_size += nwritten;
                // 删除AOF缓冲区写入的字节数
                sdsrange(server.aof_buf,nwritten,-1);
            }
            return; /* We'll try again on the next call... */
        }
    // nwritten == (signed)sdslen(server.aof_buf
    // 执行write写入成功
    } else {
        /* Successful write(2). If AOF was in error state, restore the
         * OK state and log the event. */
        // 更新最近一次写的状态为 C_OK
        if (server.aof_last_write_status == C_ERR) {
            serverLog(LL_WARNING,
                "AOF write error looks solved, Redis can write again.");
            server.aof_last_write_status = C_OK;
        }
    }
    // 只能更新当前的AOF文件的大小
    server.aof_current_size += nwritten;
    // 如果这个缓存足够小，小于4K，那么重用这个缓存，否则释放AOF缓存
    if ((sdslen(server.aof_buf)+sdsavail(server.aof_buf)) < 4000) {
        sdsclear(server.aof_buf);   //将缓存内容清空，重用
    } else {
        sdsfree(server.aof_buf);    //释放缓存空间
        server.aof_buf = sdsempty();//创建一个新缓存
    }
    // 如果no-appendfsync-on-rewrite被设置为yes，表示正在执行重写，则不执行fsync
    // 或者正在执行 BGSAVE 或 BGWRITEAOF，也不执行
    if (server.aof_no_fsync_on_rewrite &&
        (server.aof_child_pid != -1 || server.rdb_child_pid != -1))
            return;
    // 执行fsync进行同步，每次写入都同步
    if (server.aof_fsync == AOF_FSYNC_ALWAYS) {
        // 设置延迟检测开始的时间
        latencyStartMonitor(latency);
        // Linux下调用fdatasync()函数更高效的执行同步
        aof_fsync(server.aof_fd); /* Let's try to get this data on the disk */
        // 设置延迟的时间 = 当前的时间 - 开始的时间
        latencyEndMonitor(latency);
        // 将latency和"aof-fsync-always"关联到延迟诊断字典中
        latencyAddSampleIfNeeded("aof-fsync-always",latency);
        // 更新最近一次执行同步的时间
        server.aof_last_fsync = server.unixtime;
    // 每秒执行一次同步，当前时间大于上一次执行同步的时间
    } else if ((server.aof_fsync == AOF_FSYNC_EVERYSEC &&
                server.unixtime > server.aof_last_fsync)) {
        // 如果没有正在执行同步，那么在后台开一个线程执行同步
        if (!sync_in_progress) aof_background_fsync(server.aof_fd);
        // 更新最近一次执行同步的时间
        server.aof_last_fsync = server.unixtime;
    }
}
```

#### 2.2 AOF文件重写

为了解决AOF文件体积膨胀的问题，Redis 提供了AOF文件重写（rewrite）功能. 通过该功能，Redis服务器可以创建一个新的AOF文件来替代现有的AOF文件.

新文件有以下特性：

- 进程内已经超时的数据不在写入文件.
- 无效命令不在写入文件.
- 多条写的命令合并成一个.

**触发机制**

- 手动触发：BGREWRITEAOF 命令.
- 自动触发：根据redis.conf的两个参数确定触发的时机.
- auto-aof-rewrite-percentage.

100：当前AOF的文件空间`（aof_current_size）`和上一次重写后AOF文件空间`（aof_base_size）`的比值.
- auto-aof-rewrite-min-size 64mb：表示运行AOF重写时文件最小的体积.
- 自动触发时机 = (aof_current_size > auto-aof-rewrite-min-size && (aof_current_size - aof_base_size) / aof_base_size >= auto-aof-rewrite-percentage).

**重写的实现**

AOF重写操作可能会进行大量的写入操作，可能造成长时间阻塞,这时候服务器将无法处理客户端发来的命令请求.

所以Redis决定`fork()`一个子进程在后台执行。这样做可以达到两个目的：

- 子进程进行AOF重写期间，服务器进程（父进程）可以继续处理命令请求.
- 子进程带有服务器进程的数据副本，使用子进程而不是线程，可以在避免使用锁的情况下，保证数据的安全性.

不过，使用子进程也有一个问题需要解决： 因为子进程在进行 AOF 重写期间， 主进程还需要继续处理命令， 而新的命令可能对现有的数据进行修改， 这会让当前数据库的数据和重写后的 AOF 文件中的数据不一致.

为了解决这个问题， Redis 增加了一个 AOF 重写缓存， 这个缓存在 fork 出子进程之后开始启用， Redis 主进程在接到新的写命令之后， 除了会将这个写命令的协议内容追加到现有的 AOF 文件之外， 还会追加到这个缓存中：

接下来我们来看源码实现：

首先是AOF重写缓冲区的结构：

```java
// AOF缓冲区大小
#define AOF_RW_BUF_BLOCK_SIZE (1024*1024*10)    /* 10 MB per block */
// AOF块缓冲区结构
typedef struct aofrwblock {
    // 当前已经使用的和可用的字节数
    unsigned long used, free;
    // 缓冲区
    char buf[AOF_RW_BUF_BLOCK_SIZE];
} aofrwblock;
```

重写缓冲区并不是一个大块的内存空间，而是一些内存块的链表，每个内存块的大小为10MB，这样就组成了一个重写缓冲区.

因此当客户端发来命令时，会执行以下操作：

**1、** 执行客户端的命令.；

**2、** 将执行后的写命令追加到AOF缓冲区`（server.aof_buf）`中.；

**3、** 将执行后的写命令追加到AOF重写缓冲区`（server.aof_rewrite_buf_blocks）`中.；

后台执行重写的操作源码：

```java
// 以下是BGREWRITEAOF的工作步骤
// 1. 用户调用BGREWRITEAOF
// 2. Redis调用这个函数，它执行fork()
//      2.1 子进程在临时文件中执行重写操作
//      2.2 父进程将累计的差异数据追加到server.aof_rewrite_buf中
// 3. 当子进程完成2.1
// 4. 父进程会捕捉到子进程的退出码，如果是OK，那么追加累计的差异数据到临时文件，并且对临时文件rename，用它代替旧的AOF文件，然后就完成AOF的重写。
int rewriteAppendOnlyFileBackground(void) {
    pid_t childpid;
    long long start;
    // 如果正在进行重写或正在进行RDB持久化操作，则返回C_ERR
    if (server.aof_child_pid != -1 || server.rdb_child_pid != -1) return C_ERR;
    // 创建父子进程间通信的管道
    if (aofCreatePipes() != C_OK) return C_ERR;
    // 记录fork()开始时间
    start = ustime();
    // 子进程
    if ((childpid = fork()) == 0) {
        char tmpfile[256];
        /* Child */
        // 关闭监听的套接字
        closeListeningSockets(0);
        // 设置进程名字
        redisSetProcTitle("redis-aof-rewrite");
        // 创建临时文件
        snprintf(tmpfile,256,"temp-rewriteaof-bg-%d.aof", (int) getpid());
        // 对临时文件进行AOF重写
        if (rewriteAppendOnlyFile(tmpfile) == C_OK) {
            // 获取子进程使用的内存空间大小
            size_t private_dirty = zmalloc_get_private_dirty();
            if (private_dirty) {
                serverLog(LL_NOTICE,
                    "AOF rewrite: %zu MB of memory used by copy-on-write",
                    private_dirty/(1024*1024));
            }
            // 成功退出子进程
            exitFromChild(0);
        } else {
            // 异常退出子进程
            exitFromChild(1);
        }
    // 父进程
    } else {
        /* Parent */
        // 设置fork()函数消耗的时间
        server.stat_fork_time = ustime()-start;
        // 计算fork的速率，GB/每秒
        server.stat_fork_rate = (double) zmalloc_used_memory() * 1000000 / server.stat_fork_time / (1024*1024*1024); /* GB per second. */
        // 将"fork"和fork消耗的时间关联到延迟诊断字典中
        latencyAddSampleIfNeeded("fork",server.stat_fork_time/1000);
        if (childpid == -1) {
            serverLog(LL_WARNING,
                "Can't rewrite append only file in background: fork: %s",
                strerror(errno));
            return C_ERR;
        }
        // 打印日志
        serverLog(LL_NOTICE,
            "Background append only file rewriting started by pid %d",childpid);
        // 将AOF日程标志清零
        server.aof_rewrite_scheduled = 0;
        // AOF开始的时间
        server.aof_rewrite_time_start = time(NULL);
        // 设置AOF重写的子进程pid
        server.aof_child_pid = childpid;
        // 在AOF或RDB期间，不能对哈希表进行resize操作
        updateDictResizePolicy();
        // 将aof_selected_db设置为-1，强制让feedAppendOnlyFile函数执行时，执行一个select命令
        server.aof_selected_db = -1;
        // 清空脚本缓存
        replicationScriptCacheFlush();
        return C_OK;
    }
    return C_OK; /* unreached */
}
```

服务器主进程执行了`fork`操作生成一个子进程执行`rewriteAppendOnlyFile()`函数进行对临时文件的重写操作。

`rewriteAppendOnlyFile()`函数源码如下：

```java
// 写一系列的命令，用来完全重建数据集到filename文件中，被 REWRITEAOF and BGREWRITEAOF调用
// 为了使重建数据集的命令数量最小，Redis会使用 可变参的命令，例如RPUSH, SADD 和 ZADD。
// 然而每次单个命令的元素数量不能超过AOF_REWRITE_ITEMS_PER_CMD
int rewriteAppendOnlyFile(char *filename) {
    dictIterator *di = NULL;
    dictEntry *de;
    rio aof;
    FILE *fp;
    char tmpfile[256];
    int j;
    long long now = mstime();
    char byte;
    size_t processed = 0;
    // 创建临时文件的名字保存到tmpfile中
    snprintf(tmpfile,256,"temp-rewriteaof-%d.aof", (int) getpid());
    // 打开文件
    fp = fopen(tmpfile,"w");
    if (!fp) {
        serverLog(LL_WARNING, "Opening the temp file for AOF rewrite in rewriteAppendOnlyFile(): %s", strerror(errno));
        return C_ERR;
    }
    // 设置一个空sds给 保存子进程AOF时差异累计数据的sds
    server.aof_child_diff = sdsempty();
    // 初始化rio为文件io对象
    rioInitWithFile(&aof,fp);
    // 如果开启了增量时同步，防止在缓存中累计太多命令，造成写入时IO阻塞时间过长
    if (server.aof_rewrite_incremental_fsync)
        // 设置自动同步的字节数限制为AOF_AUTOSYNC_BYTES = 32MB
        rioSetAutoSync(&aof,AOF_AUTOSYNC_BYTES);
    // 遍历所有的数据库
    for (j = 0; j < server.dbnum; j++) {
        // 按照格式构建 SELECT 命令内容
        char selectcmd[] = "*2\r\n$6\r\nSELECT\r\n";
        // 当前数据库指针
        redisDb *db = server.db+j;
        // 数据库的键值对字典
        dict *d = db->dict;
        // 如果数据库中没有键值对则跳过当前数据库
        if (dictSize(d) == 0) continue;
        // 创建一个安全的字典迭代器
        di = dictGetSafeIterator(d);
        if (!di) {
            // 创建失败返回C_ERR
            fclose(fp);
            return C_ERR;
        }
        // 将SELECT 命令写入AOF文件，确保后面的命令能正确载入到数据库
        if (rioWrite(&aof,selectcmd,sizeof(selectcmd)-1) == 0) goto werr;
        // 将数据库的ID吸入AOF文件
        if (rioWriteBulkLongLong(&aof,j) == 0) goto werr;
        // 遍历保存当前数据的键值对的字典
        while((de = dictNext(di)) != NULL) {
            sds keystr;
            robj key, *o;
            long long expiretime;
            // 当前节点保存的键值
            keystr = dictGetKey(de);
            // 当前节点保存的值对象
            o = dictGetVal(de);
            // 初始化一个在栈中分配的键对象
            initStaticStringObject(key,keystr);
            // 获取该键值对的过期时间
            expiretime = getExpire(db,&key);
            // 如果当前键已经过期，则跳过该键
            if (expiretime != -1 && expiretime < now) continue;
            // 根据值的对象类型，将键值对写到AOF文件中
            // 值为字符串类型对象
            if (o->type == OBJ_STRING) {
                char cmd[]="*3\r\n$3\r\nSET\r\n";
                // 按格式写入SET命令
                if (rioWrite(&aof,cmd,sizeof(cmd)-1) == 0) goto werr;
                /* Key and value */
                // 按格式写入键值对对象
                if (rioWriteBulkObject(&aof,&key) == 0) goto werr;
                if (rioWriteBulkObject(&aof,o) == 0) goto werr;
            // 值为列表类型对象
            } else if (o->type == OBJ_LIST) {
                // 重建一个列表对象命令，将键值对按格式写入
                if (rewriteListObject(&aof,&key,o) == 0) goto werr;
            // 值为集合类型对象
            } else if (o->type == OBJ_SET) {
                // 重建一个集合对象命令，将键值对按格式写入
                if (rewriteSetObject(&aof,&key,o) == 0) goto werr;
            // 值为有序集合类型对象
            } else if (o->type == OBJ_ZSET) {
                // 重建一个有序集合对象命令，将键值对按格式写入
                if (rewriteSortedSetObject(&aof,&key,o) == 0) goto werr;
            // 值为哈希类型对象
            } else if (o->type == OBJ_HASH) {
                // 重建一个哈希对象命令，将键值对按格式写入
                if (rewriteHashObject(&aof,&key,o) == 0) goto werr;
            } else {
                serverPanic("Unknown object type");
            }
            // 如果该键有过期时间，且没过期，写入过期时间
            if (expiretime != -1) {
                char cmd[]="*3\r\n$9\r\nPEXPIREAT\r\n";
                // 将过期键时间全都以Unix时间写入
                if (rioWrite(&aof,cmd,sizeof(cmd)-1) == 0) goto werr;
                if (rioWriteBulkObject(&aof,&key) == 0) goto werr;
                if (rioWriteBulkLongLong(&aof,expiretime) == 0) goto werr;
            }
            // 在rio的缓存中每次写了10M，就从父进程读累计的差异，保存到子进程的aof_child_diff中
            if (aof.processed_bytes > processed+1024*10) {
                // 更新已写的字节数
                processed = aof.processed_bytes;
                // 从父进程读累计写入的缓冲区的差异，在重写结束时链接到文件的结尾
                aofReadDiffFromParent();
            }
        }
        dictReleaseIterator(di);    //释放字典迭代器
        di = NULL;
    }
    // 当父进程仍然在发送数据时，先执行一个缓慢的同步，以便下一次最中的同步更快
    if (fflush(fp) == EOF) goto werr;
    if (fsync(fileno(fp)) == -1) goto werr;
    // 再次从父进程读取几次数据，以获得更多的数据，我们无法一直读取，因为服务器从client接受的数据总是比发送给子进程要快，所以当数据来临的时候，我们尝试从在循环中多次读取。
    // 如果在20ms之内没有新的数据到来，那么我们终止读取
    int nodata = 0;
    mstime_t start = mstime();  //读取的开始时间
    // 在20ms之内等待数据到来
    while(mstime()-start < 1000 && nodata < 20) {
        // 在1ms之内，查看从父进程读数据的fd是否变成可读的，若不可读则aeWait()函数返回0
        if (aeWait(server.aof_pipe_read_data_from_parent, AE_READABLE, 1) <= 0)
        {
            nodata++;   //更新新数据到来的时间，超过20ms则退出while循环
            continue;
        }
        // 当管道的读端可读时，清零nodata
        nodata = 0; /* Start counting from zero, we stop on N *contiguous* timeouts. */
        // 从父进程读累计写入的缓冲区的差异，在重写结束时链接到文件的结尾
        aofReadDiffFromParent();
    }
    // 请求父进程停止发送累计差异数据
    if (write(server.aof_pipe_write_ack_to_parent,"!",1) != 1) goto werr;
    // 将从父进程读ack的fd设置为非阻塞模式
    if (anetNonBlock(NULL,server.aof_pipe_read_ack_from_parent) != ANET_OK)
        goto werr;
    // 在5000ms之内，从fd读1个字节的数据保存在byte中，查看byte是否是'!'
    if (syncRead(server.aof_pipe_read_ack_from_parent,&byte,1,5000) != 1 ||
        byte != '!') goto werr;
    // 如果收到的是父进程发来的'!'，则打印日志
    serverLog(LL_NOTICE,"Parent agreed to stop sending diffs. Finalizing AOF...");
    // 最后一次从父进程读累计写入的缓冲区的差异
    aofReadDiffFromParent();
    serverLog(LL_NOTICE,
        "Concatenating %.2f MB of AOF diff received from parent.",
        (double) sdslen(server.aof_child_diff) / (1024*1024));
    // 将子进程aof_child_diff中保存的差异数据写到AOF文件中
    if (rioWrite(&aof,server.aof_child_diff,sdslen(server.aof_child_diff)) == 0)
        goto werr;
    // 再次冲洗文件缓冲区，执行同步操作
    if (fflush(fp) == EOF) goto werr;
    if (fsync(fileno(fp)) == -1) goto werr;
    if (fclose(fp) == EOF) goto werr;   //关闭文件
    // 原子性的将临时文件的名字，改成appendonly.aof
    if (rename(tmpfile,filename) == -1) {
        serverLog(LL_WARNING,"Error moving temp append only file on the final destination: %s", strerror(errno));
        unlink(tmpfile);
        return C_ERR;
    }
    // 打印日志
    serverLog(LL_NOTICE,"SYNC append only file rewrite performed");
    return C_OK;
// 写错误处理
werr:
    serverLog(LL_WARNING,"Write error writing append only file on disk: %s", strerror(errno));
    fclose(fp);
    unlink(tmpfile);
    if (di) dictReleaseIterator(di);
    return C_ERR;
}
```

我们可以看到在关闭文件之前，多次执行了从重写缓冲区做读操作的`aofReadDiffFromParent()`. 在最后执行了`rioWrite(&aof,server.aof_child_diff,sdslen(server.aof_child_diff)`操作，这就是把AOF重写缓冲区保存服务器主进程新命令追加写到AOF文件中，以此保证了AOF文件的数据状态和数据库的状态一致.

**父子进程之间的通信**

整个重写的过程中，父子进行通信的地方只有一个，那就是最后父进程在子进程做重写操作完成时，把子进程重写操作期间所执行的新命令发送给子进程的重写缓冲区，子进程然后将重写缓冲区的数据追加到AOF文件中.

而父进程是如何将差异数据发送给子进程呢？Redis中使用的是管道技术.

#### 2.3 AOF文件载入

因为Redis命令总是在一个客户端中执行，因此，为了载入AOF文件，需要创建一个关闭监听套接字的伪客户端.

```java
// 执行AOF文件中的命令
// 成功返回C_OK，出现非致命错误返回C_ERR，例如AOF文件长度为0，出现致命错误打印日志退出
int loadAppendOnlyFile(char *filename) {
    struct client *fakeClient;
    FILE *fp = fopen(filename,"r"); //以读打开AOF文件
    struct redis_stat sb;
    int old_aof_state = server.aof_state;   //备份当前AOF的状态
    long loops = 0;
    off_t valid_up_to = 0; /* Offset of the latest well-formed command loaded. */
    // 如果文件打开，但是大小为0，则返回C_ERR
    if (fp && redis_fstat(fileno(fp),&sb) != -1 && sb.st_size == 0) {
        server.aof_current_size = 0;
        fclose(fp);
        return C_ERR;
    }
    // 如果文件打开失败，打印日志，退出
    if (fp == NULL) {
        serverLog(LL_WARNING,"Fatal error: can't open the append log file for reading: %s",strerror(errno));
        exit(1);
    }
    /* Temporarily disable AOF, to prevent EXEC from feeding a MULTI
     * to the same file we're about to read. */
    // 暂时关闭AOF，防止在执行MULTI时，EXEC命令被传播到AOF文件中
    server.aof_state = AOF_OFF;
    // 生成一个伪client
    fakeClient = createFakeClient();
    // 设置载入的状态信息
    startLoading(fp);
    while(1) {
        int argc, j;
        unsigned long len;
        robj **argv;
        char buf[128];
        sds argsds;
        struct redisCommand *cmd;
        /* Serve the clients from time to time */
        // 间隔性的处理client请求
        if (!(loops++ % 1000)) {
            // ftello(fp)返回当前文件载入的偏移量
            // 设置载入时server的状态信息，更新当前载入的进度
            loadingProgress(ftello(fp));
            // 在服务器被阻塞的状态下，仍然能处理请求
            // 因为当前处于载入状态，当client的请求到来时，总是返回loading的状态错误
            processEventsWhileBlocked();
        }
        // 将一行文件内容读到buf中，遇到"\r\n"停止
        if (fgets(buf,sizeof(buf),fp) == NULL) {
            if (feof(fp))   //如果文件已经读完了或数据库为空，则跳出while循环
                break;
            else
                goto readerr;
        }
        // 检查文件格式 "*<argc>\r\n"
        if (buf[0] != '*') goto fmterr;
        if (buf[1] == '\0') goto readerr;
        // 取出命令参数个数
        argc = atoi(buf+1);
        if (argc < 1) goto fmterr;  //至少一个参数，就是当前命令
        // 分配参数列表空间
        argv = zmalloc(sizeof(robj*)*argc);
        // 设置伪client的参数列表
        fakeClient->argc = argc;
        fakeClient->argv = argv;
        // 遍历参数列表
        // "$<command_len>\r\n<command>\r\n"
        for (j = 0; j < argc; j++) {
            // 读一行内容到buf中，遇到"\r\n"停止
            if (fgets(buf,sizeof(buf),fp) == NULL) {
                fakeClient->argc = j; /* Free up to j-1. */
                freeFakeClientArgv(fakeClient);
                goto readerr;
            }
            // 检查格式
            if (buf[0] != '$') goto fmterr;
            // 读出参数的长度len
            len = strtol(buf+1,NULL,10);
            // 初始化一个len长度的sds
            argsds = sdsnewlen(NULL,len);
            // 从文件中读出一个len字节长度，将值保存到argsds中
            if (len && fread(argsds,len,1,fp) == 0) {
                sdsfree(argsds);
                fakeClient->argc = j; /* Free up to j-1. */
                freeFakeClientArgv(fakeClient);
                goto readerr;
            }
            // 创建一个字符串对象保存读出的参数argsds
            argv[j] = createObject(OBJ_STRING,argsds);
            // 读两个字节，跳过"\r\n"
            if (fread(buf,2,1,fp) == 0) {
                fakeClient->argc = j+1; /* Free up to j. */
                freeFakeClientArgv(fakeClient);
                goto readerr; /* discard CRLF */
            }
        }
        /* Command lookup */
        // 查找命令
        cmd = lookupCommand(argv[0]->ptr);
        if (!cmd) {
            serverLog(LL_WARNING,"Unknown command '%s' reading the append only file", (char*)argv[0]->ptr);
            exit(1);
        }
        /* Run the command in the context of a fake client */
        // 调用伪client执行命令
        cmd->proc(fakeClient);
        /* The fake client should not have a reply */
        // 伪client不应该有回复
        serverAssert(fakeClient->bufpos == 0 && listLength(fakeClient->reply) == 0);
        /* The fake client should never get blocked */
        // 伪client不应该是阻塞的
        serverAssert((fakeClient->flags & CLIENT_BLOCKED) == 0);
        /* Clean up. Command code may have changed argv/argc so we use the
         * argv/argc of the client instead of the local variables. */
        // 释放伪client的参数列表
        freeFakeClientArgv(fakeClient);
        // 更新已载入且命令合法的当前文件的偏移量
        if (server.aof_load_truncated) valid_up_to = ftello(fp);
    }
    /* This point can only be reached when EOF is reached without errors.
     * If the client is in the middle of a MULTI/EXEC, log error and quit. */
    // 执行到这里，说明AOF文件的所有内容都被正确的读取
    // 如果伪client处于 MULTI/EXEC 的环境中，还有检测文件是否包含正确事物的结束，调到uxeof
    if (fakeClient->flags & CLIENT_MULTI) goto uxeof;
// 载入成功
loaded_ok: /* DB loaded, cleanup and return C_OK to the caller. */
    fclose(fp); //关闭文件
    freeFakeClient(fakeClient); //释放伪client
    server.aof_state = old_aof_state;   //还原AOF状态
    stopLoading();  //设置载入完成的状态
    aofUpdateCurrentSize(); //更新服务器状态，当前AOF文件的大小
    server.aof_rewrite_base_size = server.aof_current_size; //更新重写的大小
    return C_OK;
// 载入时读错误，如果feof(fp)为真，则直接执行 uxeof
readerr: /* Read error. If feof(fp) is true, fall through to unexpected EOF. */
    if (!feof(fp)) {
        // 退出前释放伪client的空间
        if (fakeClient) freeFakeClient(fakeClient); /* avoid valgrind warning */
        serverLog(LL_WARNING,"Unrecoverable error reading the append only file: %s", strerror(errno));
        exit(1);
    }
// 不被预期的AOF文件结束格式
uxeof: /* Unexpected AOF end of file. */
    // 如果发现末尾结束格式不完整则自动截掉,成功加载前面正确的数据。
    if (server.aof_load_truncated) {
        serverLog(LL_WARNING,"!!! Warning: short read while loading the AOF file !!!");
        serverLog(LL_WARNING,"!!! Truncating the AOF at offset %llu !!!",
            (unsigned long long) valid_up_to);
        // 截断文件到正确加载的位置
        if (valid_up_to == -1 || truncate(filename,valid_up_to) == -1) {
            if (valid_up_to == -1) {
                serverLog(LL_WARNING,"Last valid command offset is invalid");
            } else {
                serverLog(LL_WARNING,"Error truncating the AOF file: %s",
                    strerror(errno));
            }
        } else {
            /* Make sure the AOF file descriptor points to the end of the
             * file after the truncate call. */
            // 确保截断后的文件指针指向文件的末尾
            if (server.aof_fd != -1 && lseek(server.aof_fd,0,SEEK_END) == -1) {
                serverLog(LL_WARNING,"Can't seek the end of the AOF file: %s",
                    strerror(errno));
            } else {
                serverLog(LL_WARNING,
                    "AOF loaded anyway because aof-load-truncated is enabled");
                goto loaded_ok; //跳转到loaded_ok，表截断成功，成功加载前面正确的数据。
            }
        }
    }
    // 退出前释放伪client的空间
    if (fakeClient) freeFakeClient(fakeClient); /* avoid valgrind warning */
    serverLog(LL_WARNING,"Unexpected end of file reading the append only file. You can: 1) Make a backup of your AOF file, then use ./redis-check-aof --fix <filename>. 2) Alternatively you can set the 'aof-load-truncated' configuration option to yes and restart the server.");
    exit(1);
// 格式错误
fmterr: /* Format error. */
    // 退出前释放伪client的空间
    if (fakeClient) freeFakeClient(fakeClient); /* avoid valgrind warning */
    serverLog(LL_WARNING,"Bad file format reading the append only file: make a backup of your AOF file, then use ./redis-check-aof --fix <filename>");
    exit(1);
}
```
