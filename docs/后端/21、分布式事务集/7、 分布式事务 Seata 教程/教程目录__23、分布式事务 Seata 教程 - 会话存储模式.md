# 23、分布式事务 Seata 教程 - 会话存储模式
- 来源：https://ddkk.com/zhuanlan/transaction/5/23.html
- 分类：分布式事务
- 分组：教程目录
### 前言

之前我们了解到`TC (Transaction Coordinator)` - 事务协调者，负责维护全局和分支事务的状态，驱动全局事务提交或回滚。

也了解到Seata 中[undo_log、global_table、branch_table、lock_table表字段及作用详解](https://blog.csdn.net/qq_43437874/article/details/122686850)

### 会话存储模式

在服务端，需要存储事务会话信息，支持以下几种方式：

- file本地文件(不支持HA)，
- db数据库(支持HA)
- redis(支持HA)

#### 文件

我们采用的是file 作为配置中心，所以会话存储模式在`file.conf`配置文件中修改，如果使用其他方式，在对应的配置中心中修改即可。

在`file.conf`文件中修改`mode`为`file`，然后添加相关配置即可，全部配置参数如下所示：

```java
## 事务日志存储，仅在seata服务器中使用
store {
  存储模式： file、db、redis
  mode = "file"
  rsa解密公钥
  publicKey = ""
  文件存储配置
  file {
    file模式文件存储文件夹名，默认sessionStore
    dir = "sessionStore"
    分支会话最大值，如果超出抛出异常
    maxBranchSessionSize = 16384
    全局事务最大值，如果超出抛出异常
    maxGlobalSessionSize = 512
    文件缓冲区大小，如果超过，请分配新缓冲区
    fileWriteBufferCacheSize = 16384
    恢复批读取大小
    sessionReloadReadSize = 100
    刷新文件夹异步或同步
    flushDiskMode = async
  }
}
```

可以看到，在执行全局事务后，会在`sessionStore`文件夹下生成一个`root.data`文件，打开文件后可读性很差。

**优点**：

- 速度快

**缺点**：

- 无法实现会话共享，所以不支持集群模式
- 可读性差，无法查询事务及全局锁信息

**总结**： 不推荐使用，其重要原因是，一旦发现报错，需要手动处理时，无法查看到具体的事务信息。

#### 数据库

db模式，采用数据库存储会话信息，支持mysql、oracle、db2、sqlserver、sybaee、h2、sqlite、access、postgresql、oceanbase。

使用的使用需要同步以下三张表：

- global_table：全局事务
- branch_table：分支事务
- lock_table：全局锁

然后在`file.conf`文件中添加数据库信息：

```java
store {
  store mode: file、db、redis
  mode = "db"
  rsa decryption public key
  publicKey = ""
  database store property
  db {
    db模式数据源类型,dbcp、druid、hikari；无默认值，store.mode=db时必须指定。
    datasource = "druid"
    db模式数据库类型 mysql/oracle/postgresql/h2/oceanbase etc.
    dbType = "mysql"
    driverClassName = "com.mysql.jdbc.Driver"
    数据库地址，在使用mysql作为数据源时，建议在连接参数中加上rewriteBatchedStatements=true
    url = "jdbc:mysql://127.0.0.1:3306/t_seata?rewriteBatchedStatements=true"
	## 数据库账户
    user = "root"
	## 数据库账户密码
    password = "123456"
    minConn = 5
    maxConn = 100
    globalTable = "global_table"
    branchTable = "branch_table"
    lockTable = "lock_table"
    queryLimit = 100
    maxWait = 5000
  }
}
```

**优点**：

- 支持集群
- 事务信息可视化，可读性高

**缺点**：

- 需要同步数据结构
- 依赖数据库，效率不太高

#### Redis

redis 模式，采用redis 会话信息，Seata 1.4 以后支持的新模式。

在`file.conf`文件中修改`mode`为`redis`，然后添加相关配置即可，全部配置参数如下所示：

```java
  redis store property
  redis {
    redis 模式： 单机 、哨兵
    mode = "single"
    单机配置
    single {
      host = "127.0.0.1"
      port = "6379"
    }
    哨兵模式配置
    sentinel {
      masterName = ""
      such as "10.28.235.65:26379,10.28.235.65:26380,10.28.235.65:26381"
      sentinelHosts = ""
    }
    Redis密码
    password = "123456"
    database = "0"
    minConn = 1
    maxConn = 10
    maxTotal = 100
    queryLimit = 100
  }
```

可以在Redis 中看到存储的会话信息：

**优点**：

- 支持集群
- 事务信息可视化，可读性高
- 效率较快
- 无需要同步数据结构

**缺点**：

- 依赖Redis

### 怎么选择？

从操作性、效率、功能性综合考虑，肯定是使用Redis 了。

### 会话管理器SessionManager

在Seata 中，实现会话增删改查，是通过`SessionManager`的实现类来处理的，它的三个实现类就对应了三个存储方式：

`SessionManager` 接口源码如下：

```java
/**
 * The interface Session manager.
 *
 * @author sharajava
 */
public interface SessionManager extends SessionLifecycleListener, Disposable {
    /**
     * Add global session.
     *
     * @param session the session
     * @throws TransactionException the transaction exception
     */
    void addGlobalSession(GlobalSession session) throws TransactionException;
    /**
     * Find global session global session.
     *
     * @param xid the xid
     * @return the global session
     */
    GlobalSession findGlobalSession(String xid) ;
    /**
     * Find global session global session.
     *
     * @param xid the xid
     * @param withBranchSessions the withBranchSessions
     * @return the global session
     */
    GlobalSession findGlobalSession(String xid, boolean withBranchSessions);
    /**
     * Update global session status.
     *
     * @param session the session
     * @param status  the status
     * @throws TransactionException the transaction exception
     */
    void updateGlobalSessionStatus(GlobalSession session, GlobalStatus status) throws TransactionException;
    /**
     * Remove global session.
     *
     * @param session the session
     * @throws TransactionException the transaction exception
     */
    void removeGlobalSession(GlobalSession session) throws TransactionException;
    /**
     * Add branch session.
     *
     * @param globalSession the global session
     * @param session       the session
     * @throws TransactionException the transaction exception
     */
    void addBranchSession(GlobalSession globalSession, BranchSession session) throws TransactionException;
    /**
     * Update branch session status.
     *
     * @param session the session
     * @param status  the status
     * @throws TransactionException the transaction exception
     */
    void updateBranchSessionStatus(BranchSession session, BranchStatus status) throws TransactionException;
    /**
     * Remove branch session.
     *
     * @param globalSession the global session
     * @param session       the session
     * @throws TransactionException the transaction exception
     */
    void removeBranchSession(GlobalSession globalSession, BranchSession session) throws TransactionException;
    /**
     * All sessions collection.
     *
     * @return the collection
     */
    Collection<GlobalSession> allSessions();
    /**
     * Find global sessions list.
     *
     * @param condition the condition
     * @return the list
     */
    List<GlobalSession> findGlobalSessions(SessionCondition condition);
    /**
     * lock and execute
     *
     * @param globalSession the global session
     * @param lockCallable the lock Callable
     * @return the value
     */
    <T> T lockAndExecute(GlobalSession globalSession, GlobalSession.LockCallable<T> lockCallable)
            throws TransactionException;
    /**
     * scheduled lock
     *
     * @param key the lock key
     * @return the boolean
     */
    default boolean scheduledLock(String key) {
        return true;
    }
    /**
     * un scheduled lock
     *
     * @param key the lock key
     * @return the boolean
     */
    default boolean unScheduledLock(String key) {
        return true;
    }
}
```
