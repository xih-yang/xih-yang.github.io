# 15、Redis 源码解析 - Redis RDB持久化机制
- 来源：https://ddkk.com/zhuanlan/db/redis/8/15.html
- 分类：缓存数据库
- 分组：教程目录
### 1. RDB 介绍

因为Redis是内存数据库，它将自己的数据库状态储存在内存里面，所以如果不想办法将储存在内存中的数据库状态保存到磁盘里面，那么一旦服务器进程退出，服务器中的数据库状态也会消失不见.

为了解决这个问题，Redis 提供了`RDB`持久化功能，它会生成一个压缩的二进制文件，通过该文件可以还原生成的`RDB`文件时的数据库状态.

#### 1.1 RDB的优缺点

**优点**

- RDB是一个紧凑压缩的二进制文件，代表Redis在某个时间点上的数据快照. 非常适用于备份，全景复制，大规模的数据恢复等场景.
- Redis加载RDB恢复数据远远快于AOF的方式.

**缺点**

- BGSAVE命令每次运行要调用fork()创建子进程，这属于重量级操作，会占用一定的内存空间.
- 由于RDB是每隔一段时间进行持久化操作，假如Redis意外宕机，可能会造成最后一次数据没有来得及做持久化.
- RDB文件使用特定的二进制格式保存，Redis版本演进的过程中，有多个RDB版本，这导致版本兼容的问题.

### 2. RDB 触发机制

RDB分为自动触发和手动触发.

**手动触发**

手动触发有两个命令：

- SAVE：阻塞当前Redis服务器，直到RDB过程完成为止.
- BGSAVE：Redis进程执行fork()操作创建出一个子进程，在后台完成RDB持久化操作的过程（主要用这个）.

**自动触发**

以下三行配置在Redis的配置文件中：

```java
save 900 1  服务器在900秒之内，对数据库进行了至少1次修改
save 300 10 服务器在300秒之内，对数据库进行了至少10次修改
save 60 10000 服务器在60秒之内，对数据库进行了至少10000次修改
```

只要满足以上三个条件中的任意一个，`BGSAVE`命令就会被执行.

### 3. RDB 的实现

关于RDB的实现在`rdb.h`头文件和`rdb.c`源文件中.

`BGSAVE`命令的实现如下所示：

```java
/* BGSAVE [SCHEDULE] */
// BGSAVE 命令实现
void bgsaveCommand(client *c) {
	// SCHEDULE控制BGSAVE的执行，避免和AOF重写进程冲突
    int schedule = 0;
    if (c->argc > 1) {
        // 设置schedule标志
        if (c->argc == 2 && !strcasecmp(c->argv[1]->ptr,"schedule")) {
            schedule = 1;
        } else {
            addReply(c,shared.syntaxerr);
            return;
        }
    }
    // 如果正在执行RDB持久化操作，则退出
    if (server.rdb_child_pid != -1) {
        addReplyError(c,"Background save already in progress");
    // 如果正在执行AOF持久化操作，需要将BGSAVE提上日程，然后退出
    } else if (server.aof_child_pid != -1) {
        // 如果schedule为真，设置rdb_bgsave_scheduled为1
        if (schedule) {
            server.rdb_bgsave_scheduled = 1;
            addReplyStatus(c,"Background saving scheduled");
        } else {
            addReplyError(c,
                "An AOF log rewriting in progress: can't BGSAVE right now. "
                "Use BGSAVE SCHEDULE in order to schedule a BGSAVE whenver "
                "possible.");
        }
    // 执行BGSAVE
    } else if (rdbSaveBackground(server.rdb_filename) == C_OK) {
        addReplyStatus(c,"Background saving started");
    } else {
        addReply(c,shared.err);
    }
}
```

我们可以发现，当可以执行`BGSAVE`操作的时候，程序调用了一个`rdbSaveBackground`函数，该函数会`fork()`一个子进程，然后这个子进程调用`rdbSave()`进行`RDB`持久化，同时父进程会设置一些状态信息以及更新一些日志信息.

```java
// 后台进行RDB持久化BGSAVE操作
int rdbSaveBackground(char *filename) {
    pid_t childpid;
    long long start;
    // 当前没有正在进行AOF和RDB操作，否则返回C_ERR
    if (server.aof_child_pid != -1 || server.rdb_child_pid != -1) return C_ERR;
    // 备份当前数据库的脏键值
    server.dirty_before_bgsave = server.dirty;
    // 最近一个执行BGSAVE的时间
    server.lastbgsave_try = time(NULL);
    // fork函数开始时间，记录fork函数的耗时
    start = ustime();
    // 创建子进程
    if ((childpid = fork()) == 0) {
        int retval;
        // 子进程执行的代码
        // 关闭监听的套接字
        closeListeningSockets(0);
        // 设置进程标题，方便识别
        redisSetProcTitle("redis-rdb-bgsave");
        // 执行保存操作，将数据库的写到filename文件中
        retval = rdbSave(filename);
        if (retval == C_OK) {
            // 得到子进程进程的脏私有虚拟页面大小，如果做RDB的同时父进程正在写入的数据，那么子进程就会拷贝一个份父进程的内存，而不是和父进程共享一份内存。
            size_t private_dirty = zmalloc_get_private_dirty();
            // 将子进程分配的内容写日志
            if (private_dirty) {
                serverLog(LL_NOTICE,
                    "RDB: %zu MB of memory used by copy-on-write",
                    private_dirty/(1024*1024));
            }
        }
        // 子进程退出，发送信号给父进程，发送0表示BGSAVE成功，1表示失败
        exitFromChild((retval == C_OK) ? 0 : 1);
    } else {
        // 父进程执行的代码
        /* Parent */
        // 计算出fork的执行时间
        server.stat_fork_time = ustime()-start;
        // 计算fork的速率，GB/每秒
        server.stat_fork_rate = (double) zmalloc_used_memory() * 1000000 / server.stat_fork_time / (1024*1024*1024); /* GB per second. */
        //如果fork执行时长，超过设置的阀值，则要将其加入到一个字典中，与传入"fork"关联，以便进行延迟诊断
        latencyAddSampleIfNeeded("fork",server.stat_fork_time/1000);
        // 如果fork出错
        if (childpid == -1) {
            server.lastbgsave_status = C_ERR;   //设置BGSAVE错误
            // 更新日志信息
            serverLog(LL_WARNING,"Can't save in background: fork: %s",
                strerror(errno));
            return C_ERR;
        }
        // 更新日志信息
        serverLog(LL_NOTICE,"Background saving started by pid %d",childpid);
        server.rdb_save_time_start = time(NULL);    //设置BGSAVE开始的时间
        server.rdb_child_pid = childpid;            //设置负责执行BGSAVE操作的子进程id
        server.rdb_child_type = RDB_CHILD_TYPE_DISK;//设置BGSAVE的类型，往磁盘中写入
        //关闭哈希表的resize，因为resize过程中会有复制拷贝动作
        updateDictResizePolicy();
        return C_OK;
    }
    return C_OK; /* unreached */
}
```

子进程调用的`rdbSave()`函数会进行`RDB`文件的初始化操作，刚开始生成一个临时的`RDB`文件，只有在执行成功后，才会进行`rename`操作，然后以写权限打开文件，接着调用`rdbSaveRio()`函数将数据库的内容写到临时的`RDB`文件，之后进行刷新缓冲区和同步操作，最后关闭文件进行`rename`操作和更新服务器状态.

```java
// 将数据库保存在磁盘上，返回C_OK成功，否则返回C_ERR
int rdbSave(char *filename) {
    char tmpfile[256];
    char cwd[MAXPATHLEN]; /* Current working dir path for error messages. */
    FILE *fp;
    rio rdb;
    int error = 0;
    // 创建临时文件
    snprintf(tmpfile,256,"temp-%d.rdb", (int) getpid());
    // 以写方式打开该文件
    fp = fopen(tmpfile,"w");
    // 打开失败，获取文件目录，写入日志
    if (!fp) {
        char *cwdp = getcwd(cwd,MAXPATHLEN);
        // 写日志信息到logfile
        serverLog(LL_WARNING,
            "Failed opening the RDB file %s (in server root dir %s) "
            "for saving: %s",
            filename,
            cwdp ? cwdp : "unknown",
            strerror(errno));
        return C_ERR;
    }
    // 初始化一个rio对象，该对象是一个文件对象IO
    rioInitWithFile(&rdb,fp);
    // 将数据库的内容写到rio中
    if (rdbSaveRio(&rdb,&error) == C_ERR) {
        errno = error;
        goto werr;
    }
    /* Make sure data will not remain on the OS's output buffers */
    // 冲洗缓冲区，确保所有的数据都写入磁盘
    if (fflush(fp) == EOF) goto werr;
    // 将fp指向的文件同步到磁盘中
    if (fsync(fileno(fp)) == -1) goto werr;
    // 关闭文件
    if (fclose(fp) == EOF) goto werr;
    /* Use RENAME to make sure the DB file is changed atomically only
     * if the generate DB file is ok. */
    // 原子性改变rdb文件的名字
    if (rename(tmpfile,filename) == -1) {
        // 改变名字失败，则获得当前目录路径，发送日志信息，删除临时文件
        char *cwdp = getcwd(cwd,MAXPATHLEN);
        serverLog(LL_WARNING,
            "Error moving temp DB file %s on the final "
            "destination %s (in server root dir %s): %s",
            tmpfile,
            filename,
            cwdp ? cwdp : "unknown",
            strerror(errno));
        unlink(tmpfile);
        return C_ERR;
    }
    // 写日志文件
    serverLog(LL_NOTICE,"DB saved on disk");
    // 重置服务器的脏键
    server.dirty = 0;
    // 更新上一次SAVE操作的时间
    server.lastsave = time(NULL);
    // 更新SAVE操作的状态
    server.lastbgsave_status = C_OK;
    return C_OK;
// rdbSaveRio()函数写错误处理，写日志，关闭文件，删除临时文件，发送C_ERR
werr:
    serverLog(LL_WARNING,"Write error saving DB on disk: %s", strerror(errno));
    fclose(fp);
    unlink(tmpfile);
    return C_ERR;
}
```

上述的`rdbSave()`函数打开文件之后，接着会调用`rdbSaveRio()`函数，该函数会将往`RDB`文件中写上固定格式的内容：

- REDIS是一个固定的字符串标识，占5字节.
- db_version是RDB版本，占4字节.
- 默认信息：在db_version与databases之间还有默认信息，由rdbSaveInfoAuxFields()函数写入，包括Redis版本、Redis位数、当前时间喝Redis当前使用的内存数.
- database部分包含着零个或任意个数据库，以及各个数据库中的键值对数据.
- EOF常量占1字节，表示文件结束.
- check_sum是校验和，占8字节.

`rdbSaveRio()`函数会遍历所有数据库，然后进行RDB写入.

```java
// 将一个RDB格式文件内容写入到rio中，成功返回C_OK，否则C_ERR和一部分或所有的出错信息
// 当函数返回C_ERR，并且error不是NULL，那么error被设置为一个错误码errno
int rdbSaveRio(rio *rdb, int *error) {
    dictIterator *di = NULL;
    dictEntry *de;
    char magic[10];
    int j;
    long long now = mstime();
    uint64_t cksum;
    // 开启了校验和选项
    if (server.rdb_checksum)
        // 设置校验和的函数
        rdb->update_cksum = rioGenericUpdateChecksum;
    // 将Redis版本信息保存到magic中
    snprintf(magic,sizeof(magic),"REDIS%04d",RDB_VERSION);
    // 将magic写到rio中
    if (rdbWriteRaw(rdb,magic,9) == -1) goto werr;
    // 将rdb文件的默认信息写到rio中
    if (rdbSaveInfoAuxFields(rdb) == -1) goto werr;
    // 遍历所有服务器内的数据库
    for (j = 0; j < server.dbnum; j++) {
    	// 当前的数据库指针
        redisDb *db = server.db+j;
        // 当数据库的键值对字典
        dict *d = db->dict;
        // 跳过为空的数据库
        if (dictSize(d) == 0) continue;
        // 创建一个字典类型的迭代器
        di = dictGetSafeIterator(d);
        if (!di) return C_ERR;
        /* Write the SELECT DB opcode */
        // 写入数据库的选择标识码 RDB_OPCODE_SELECTDB为254
        if (rdbSaveType(rdb,RDB_OPCODE_SELECTDB) == -1) goto werr;
        // 写入数据库的id，占了一个字节的长度
        if (rdbSaveLen(rdb,j) == -1) goto werr;
        // 写入调整数据库的操作码，我们将大小限制在UINT32_MAX以内，这并不代表数据库的实际大小，只是提示去重新调整哈希表的大小
        uint32_t db_size, expires_size;
        // 如果字典的大小大于UINT32_MAX，则设置db_size为最大的UINT32_MAX
        db_size = (dictSize(db->dict) <= UINT32_MAX) ?
                                dictSize(db->dict) :
                                UINT32_MAX;
        // 设置有过期时间键的大小超过UINT32_MAX，则设置expires_size为最大的UINT32_MAX
        expires_size = (dictSize(db->expires) <= UINT32_MAX) ?
                                dictSize(db->expires) :
                                UINT32_MAX;
        // 写入调整哈希表大小的操作码，RDB_OPCODE_RESIZEDB = 251
        if (rdbSaveType(rdb,RDB_OPCODE_RESIZEDB) == -1) goto werr;
        // 写入提示调整哈希表大小的两个值，如果
        if (rdbSaveLen(rdb,db_size) == -1) goto werr;
        if (rdbSaveLen(rdb,expires_size) == -1) goto werr;
        /* Iterate this DB writing every entry */
        // 遍历数据库所有的键值对
        while((de = dictNext(di)) != NULL) {
            sds keystr = dictGetKey(de);        //当前键
            robj key, *o = dictGetVal(de);      //当前键的值
            long long expire;
            // 在栈中创建一个键对象并初始化
            initStaticStringObject(key,keystr);
            // 当前键的过期时间
            expire = getExpire(db,&key);
            // 将键的键对象，值对象，过期时间写到rio中
            if (rdbSaveKeyValuePair(rdb,&key,o,expire,now) == -1) goto werr;
        }
        dictReleaseIterator(di);    //释放迭代器
    }
    di = NULL; 
    // 写入一个EOF码，RDB_OPCODE_EOF = 255
    if (rdbSaveType(rdb,RDB_OPCODE_EOF) == -1) goto werr;
    // CRC64检验和，当校验和计算为0，没有开启是，在载入rdb文件时会跳过
    cksum = rdb->cksum;
    memrev64ifbe(&cksum);
    if (rioWrite(rdb,&cksum,8) == 0) goto werr;
    return C_OK;
// 写入错误
werr:
	// 保存错误码
    if (error) *error = errno;
    // 如果没有释放迭代器，则释放
    if (di) dictReleaseIterator(di);
    return C_ERR;
}
```

上面说到，程序还会调用`rdbSaveInfoAuxFields()`函数写入一些默认的辅助信息：

```java
// 将一个rdb文件的默认信息写入到rio中
int rdbSaveInfoAuxFields(rio *rdb) {
    // 判断主机的总线宽度，是64位还是32位
    int redis_bits = (sizeof(void*) == 8) ? 64 : 32;
    // 添加rdb文件的状态信息：Redis版本，redis位数，当前时间和Redis当前使用的内存数
    if (rdbSaveAuxFieldStrStr(rdb,"redis-ver",REDIS_VERSION) == -1) return -1;
    if (rdbSaveAuxFieldStrInt(rdb,"redis-bits",redis_bits) == -1) return -1;
    if (rdbSaveAuxFieldStrInt(rdb,"ctime",time(NULL)) == -1) return -1;
    if (rdbSaveAuxFieldStrInt(rdb,"used-mem",zmalloc_used_memory()) == -1) return -1;
    return 1;
}
```

我们可以使用`od -cx dump.rdb`命令来查看保存在`dump.rdb`文件中的内容：
