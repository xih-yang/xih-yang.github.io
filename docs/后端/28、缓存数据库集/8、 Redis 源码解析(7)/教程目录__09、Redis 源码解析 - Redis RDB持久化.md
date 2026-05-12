# 09、Redis 源码解析 - Redis RDB持久化
- 来源：https://ddkk.com/zhuanlan/db/redis/7/9.html
- 分类：缓存数据库
- 分组：教程目录
RDB是redis中的一种持久化方式,以二进制形式存储在文件中,且排列非常紧凑,这也意味着文件更小,我们可以更快的载入数据,但其也有坏处,就是及其容易丢失数据,.因为其会遵循配置文件中默认的配置X秒Y条数据的写入时会执行RDB,但未满足时便一直存在内存中,如果此时服务器宕机甚至断电,距上一次持久化到现在的数据都将丢失.因为其在持久化时会把所有的数据全部写入一个临时文件,然后改名,在后台执行时还会fork,这使得在有大量数据的时候很慢.但它也有好处,就是可以更快的恢复,这使得它在做副本的时候是一个很好的选择.

通过SAVE或者BGSAVE操作可以显式调用RDB.SAVE创建RDB文件的速度会比BGSAVE快,SAVE可以集中资源来创建RDB文件,如果数据库正在上线当中.就要使用BGSAVE,如果数据库需要维护,可以使用SAVE命令.

RDB(后台)基本的执行过程是这样的

**1、** 子进程把数据写入临时文件结束的话向父进程发送信号；

**2、** 父进程接收到信号以后更新属性然后改名覆盖原来的dump.rdb；

### 解析部分

`rdbSave`也是RDB持久化中真正执行写入操作的函数,

```java
/**
 * 下面是RDB文件的格式
 * [五字节REDIS][四字节版本号][数据库信息][一字节EOF][八字节的校验和]
 */
int rdbSave(char *filename) {
    dictIterator *di = NULL;
    dictEntry *de;
    char tmpfile[256];
    char magic[10];
    int j;
    long long now = mstime();
    FILE *fp;
    rio rdb; //相当于一个文件代理 封装一些文件操作
    uint64_t cksum;
    // 创建一个临时文件
    snprintf(tmpfile,256,"temp-%d.rdb", (int) getpid());
    fp = fopen(tmpfile,"w");
    if (!fp) {
        redisLog(REDIS_WARNING, "Failed opening .rdb for saving: %s",
            strerror(errno));
        return REDIS_ERR;
    }
    // 初始化 I/O
    rioInitWithFile(&rdb,fp);
    // 设置校验和函数 位于RDB存储的最末端
    if (server.rdb_checksum) 
        rdb.update_cksum = rioGenericUpdateChecksum;
    // 写入 RDB 版本号 这是文件的开头 REDIS代表这是一个.rdb文件,后面的则是四个字节的版本号
    snprintf(magic,sizeof(magic),"REDIS%04d",REDIS_RDB_VERSION);
    if (rdbWriteRaw(&rdb,magic,9) == -1) goto werr; //把magic这个字符串写入文件中
    // 遍历所有数据库
    for (j = 0; j < server.dbnum; j++) {
        // 指向数据库
        redisDb *db = server.db+j;
        // 指向数据库键空间
        dict *d = db->dict;
        // 跳过空数据库
        if (dictSize(d) == 0) continue;
        // 创建键空间迭代器
        di = dictGetSafeIterator(d);
        if (!di) {
            fclose(fp);
            return REDIS_ERR;
        }
        /* Write the SELECT DB opcode 
         *
         * 写入 DB 选择器
         */
        if (rdbSaveType(&rdb,REDIS_RDB_OPCODE_SELECTDB) == -1) goto werr;
        if (rdbSaveLen(&rdb,j) == -1) goto werr;
        /* Iterate this DB writing every entry 
         *
         * 遍历数据库，并写入每个键值对的数据
         */
        while((de = dictNext(di)) != NULL) {
            sds keystr = dictGetKey(de);
            robj key, *o = dictGetVal(de);
            long long expire;
            // 根据 keystr ，在栈中创建一个 key 对象
            initStaticStringObject(key,keystr);
            // 获取键的过期时间
            expire = getExpire(db,&key);
            // 保存键值对数据
            if (rdbSaveKeyValuePair(&rdb,&key,o,expire,now) == -1) goto werr;
        }
        dictReleaseIterator(di);
    }
    di = NULL; /* So that we don't release it again on error. */
    /* EOF opcode 
     *
     * 写入 EOF 代码 位于校验码之前
     */
    if (rdbSaveType(&rdb,REDIS_RDB_OPCODE_EOF) == -1) goto werr;
    /* CRC64 checksum. It will be zero if checksum computation is disabled, the
     * loading code skips the check in this case. 
     *
     * CRC64 校验和。
     *
     * 如果校验和功能已关闭，那么 rdb.cksum 将为 0 ，
     * 在这种情况下， RDB 载入时会跳过校验和检查。
     */
    cksum = rdb.cksum;
    memrev64ifbe(&cksum);
    rioWrite(&rdb,&cksum,8); //写入校验码
    /* Make sure data will not remain on the OS's output buffers */
    // 冲洗缓存，确保数据已写入磁盘
    if (fflush(fp) == EOF) goto werr;
    if (fsync(fileno(fp)) == -1) goto werr;
    if (fclose(fp) == EOF) goto werr;
    /* Use RENAME to make sure the DB file is changed atomically only
     * if the generate DB file is ok. 
     *
     * 使用 RENAME ，原子性地对临时文件进行改名，覆盖原来的 RDB 文件。
     */
    if (rename(tmpfile,filename) == -1) {
        redisLog(REDIS_WARNING,"Error moving temp DB file on the final destination: %s", strerror(errno));
        unlink(tmpfile);
        return REDIS_ERR;
    }
    // 写入完成，打印日志
    redisLog(REDIS_NOTICE,"DB saved on disk");
    // 清零数据库脏状态
    server.dirty = 0;
    // 记录最后一次完成 SAVE 的时间
    server.lastsave = time(NULL);
    // 记录最后一次执行 SAVE 的状态
    server.lastbgsave_status = REDIS_OK;
    return REDIS_OK;
werr: //有任何错误都返回REDIS_ERR
    // 关闭文件
    fclose(fp);
    // 删除文件
    unlink(tmpfile);
    redisLog(REDIS_WARNING,"Write error saving DB on disk: %s", strerror(errno));
    if (di) dictReleaseIterator(di);
    return REDIS_ERR;
}
```

后台执行时调用`rdbSaveBackground`,其中进行fork,使用子进程执行`rdbSave`,完成时发送信号给父进程

```java
int rdbSaveBackground(char *filename) {
    pid_t childpid;
    long long start;
    // 如果 BGSAVE 已经在执行，那么出错
    if (server.rdb_child_pid != -1) return REDIS_ERR;
    // 记录 BGSAVE 执行前的数据库被修改次数 
    // server.dirty的存在是为了根据配置文件自动执行后台RDB
    server.dirty_before_bgsave = server.dirty;
    // 最近一次尝试执行 BGSAVE 的时间 也是为了根据配置文件自动执行后台RDB
    server.lastbgsave_try = time(NULL);
    // fork() 开始前的时间，记录 fork() 返回耗时用
    start = ustime();
    if ((childpid = fork()) == 0) {
      //执行fork 子进程执行rdbSave 结束向父进程发送信号
        int retval;
        /* Child */
        // 关闭网络连接 fd
        closeListeningSockets(0);
        // 设置进程的标题，方便识别
        redisSetProcTitle("redis-rdb-bgsave");
        // 执行保存操作 把所有数据库中的信息存入文件
        retval = rdbSave(filename);
        // 打印 copy-on-write 时使用的内存数
        if (retval == REDIS_OK) {
            size_t private_dirty = zmalloc_get_private_dirty();
            if (private_dirty) {
                redisLog(REDIS_NOTICE,
                    "RDB: %zu MB of memory used by copy-on-write",
                    private_dirty/(1024*1024));
            }
        }
        // 向父进程发送信号
        exitFromChild((retval == REDIS_OK) ? 0 : 1);
    } else {
        /* Parent */
        // 计算 fork() 执行的时间
        server.stat_fork_time = ustime()-start;
        // 如果 fork() 出错，那么报告错误
        if (childpid == -1) {
            server.lastbgsave_status = REDIS_ERR;
            redisLog(REDIS_WARNING,"Can't save in background: fork: %s",
                strerror(errno));
            return REDIS_ERR;
        }
        // 打印 BGSAVE 开始的日志
        redisLog(REDIS_NOTICE,"Background saving started by pid %d",childpid);
        // 记录数据库开始 BGSAVE 的时间
        server.rdb_save_time_start = time(NULL);
        // 记录负责执行 BGSAVE 的子进程 ID
        server.rdb_child_pid = childpid;
        // 关闭自动 rehash
        updateDictResizePolicy();
        return REDIS_OK;
    }
    return REDIS_OK; /* unreached */
}
```

父进程接收到信号以后执行的函数`backgroundSaveDoneHandler`

```java
void backgroundSaveDoneHandler(int exitcode, int bysignal) {
    // BGSAVE 成功
    if (!bysignal && exitcode == 0) {
        redisLog(REDIS_NOTICE,
            "Background saving terminated with success");
        server.dirty = server.dirty - server.dirty_before_bgsave; //记录在RDB期间的操作数
        server.lastsave = time(NULL); //记录上一次RDB的时间 
        //上面两个变量都与自动执行后台EDB有关 可在redis.conf中配置
        server.lastbgsave_status = REDIS_OK;
    // BGSAVE 出错
    } else if (!bysignal && exitcode != 0) {
        redisLog(REDIS_WARNING, "Background saving error");
        server.lastbgsave_status = REDIS_ERR;
    // BGSAVE 被中断
    } else {
        redisLog(REDIS_WARNING,
            "Background saving terminated by signal %d", bysignal);
        // 移除临时文件
        rdbRemoveTempFile(server.rdb_child_pid);
        /* SIGUSR1 is whitelisted, so we have a way to kill a child without
         * tirggering an error conditon. */
        if (bysignal != SIGUSR1)
            server.lastbgsave_status = REDIS_ERR;
    }
    // 更新服务器状态
    server.rdb_child_pid = -1;
    server.rdb_save_time_last = time(NULL)-server.rdb_save_time_start;
    server.rdb_save_time_start = -1;
    /* Possibly there are slaves waiting for a BGSAVE in order to be served
     * (the first stage of SYNC is a bulk transfer of dump.rdb) */
    // 处理正在等待 BGSAVE 完成的那些 slave
    updateSlavesWaitingBgsave(exitcode == 0 ? REDIS_OK : REDIS_ERR);
}
```
