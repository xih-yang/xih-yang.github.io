# 13、MyBatis源码 - MyBatis运行原理之获取SqlSession源码分析
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/5/13.html
- 分类：ORM框架
- 分组：教程目录
### 获取SqlSession

创建了SqlSessionFactory后，调用openSession方法获取SqlSession对象。

```java
SqlSession sqlSession = sqlSessionFactory.openSession();
```

#### 大致流程

#### 源码分析

##### 1. openSession()

SqlSessionFactory是接口，实际是DefaultSqlSessionFactory对象调用openSession()方法。

DefaultSqlSessionFactory提供了很多重载openSession方法获取SqlSession对象：

```java
 /**
     * @param autoCommit 是否自动提交
     * @return SqlSession
     */
    @Override
    public SqlSession openSession(boolean autoCommit) {
        return openSessionFromDataSource(configuration.getDefaultExecutorType(), null, autoCommit);
    }
    /**
     * @param execType
     * @return
     */
    @Override
    public SqlSession openSession(ExecutorType execType) {
        return openSessionFromDataSource(execType, null, false);
    }
    @Override
    public SqlSession openSession(TransactionIsolationLevel level) {
        return openSessionFromDataSource(configuration.getDefaultExecutorType(), level, false);
    }
    @Override
    public SqlSession openSession(ExecutorType execType, TransactionIsolationLevel level) {
        return openSessionFromDataSource(execType, level, false);
    }
    @Override
    public SqlSession openSession(ExecutorType execType, boolean autoCommit) {
        return openSessionFromDataSource(execType, null, autoCommit);
    }
    @Override
    public SqlSession openSession(Connection connection) {
        return openSessionFromConnection(configuration.getDefaultExecutorType(), connection);
    }
    @Override
    public SqlSession openSession(ExecutorType execType, Connection connection) {
        return openSessionFromConnection(execType, connection);
    }
```

openSession()实际调用的是openSessionFromDataSource()方法获取SqlSession：

```java
    /**
     * 从数据源创建SqlSession
     *
     * @param execType   ExecutorType：执行器类型 SIMPLE, REUSE, BATCH
     * @param level      事务级别
     * @param autoCommit 是否自动提交
     * @return SqlSession
     */
    private SqlSession openSessionFromDataSource(ExecutorType execType, TransactionIsolationLevel level, boolean autoCommit) {
        Transaction tx = null;
        try {
            // 环境
            final Environment environment = configuration.getEnvironment();
            // 事务管理器
            final TransactionFactory transactionFactory = getTransactionFactoryFromEnvironment(environment);
            tx = transactionFactory.newTransaction(environment.getDataSource(), level, autoCommit);
            // 创建Executor执行器
            final Executor executor = configuration.newExecutor(tx, execType);
            // 创建并返回DefaultSqlSession
            return new DefaultSqlSession(configuration, executor, autoCommit);
        } catch (Exception e) {
            closeTransaction(tx); // may have fetched a connection so lets call close()
            throw ExceptionFactory.wrapException("Error opening session.  Cause: " + e, e);
        } finally {
            ErrorContext.instance().reset();
        }
    }
```

##### 2. newExecutor(tx, execType)

openSessionFromDataSource方法获取了环境和事务管理器后，执行newExecutor方法获取Executor 执行器。

Executor执行器是MyBatis四大组件之一，每一个SqlSession都会拥有一个Executor对象，SqlSession执行增删改查都是委托给Executor完成的。

**MyBatis四大组件：**

- Executor：sql执行器
- StatementHandler：JDBC与SQL语句执行的两大主流对象：java.sql.Statement、java.sql.PrepareStatement对象，对象的execute方法就是执行SQL语句的入口，通过java.sql.Connection对象创建Statement对象。Mybatis的StatementHandler，是Mybatis创建Statement对象的处理器，即StatementHandler会接管Statement对象的创建。
- ParameterHandler：参数处理器
- ResultSetHandler：结果处理器

Executor接口，有主要四个实现类，对应每个不同类型执行器。

- SimpleExecutor：最简单的执行器，根据对应的sql直接执行即可，不会做一些额外的操作；拼接完SQL之后，直接交给 StatementHandler 去执行
- BatchExecutor：通过批量操作来优化性能。通常需要注意的是批量更新操作，由于内部有缓存的实现，使用完成后记得调用flushStatements来清除缓存。
- ReuseExecutor ：可重用的执行器，重用的对象是Statement，也就是说该执行器会缓存同一个sql的Statement，省去Statement的重新创建，优化性能。内部的实现是通过一个HashMap来维护Statement对象的。由于当前Map只在该session中有效，所以使用完成后记得调用flushStatements来清除Map。
- CachingExecutor：启用于二级缓存时的执行器；采用静态代理；代理一个 Executor 对象。执行 update 方法前判断是否清空二级缓存；执行 query 方法前先在二级缓存中查询，命中失败再通过被代理类查询。

Executor接口源码如下：

```java
public interface Executor {
    ResultHandler NO_RESULT_HANDLER = null;
    // 更新
    int update(MappedStatement ms, Object parameter) throws SQLException;
    // 查询，先查缓存，再查数据库
    <E> List<E> query(MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, CacheKey cacheKey, BoundSql boundSql) throws SQLException;
    // 查询
    <E> List<E> query(MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler) throws SQLException;
    // 游标查询
    <E> Cursor<E> queryCursor(MappedStatement ms, Object parameter, RowBounds rowBounds) throws SQLException;
    // 刷新Statements
    List<BatchResult> flushStatements() throws SQLException;
    // 事务提交
    void commit(boolean required) throws SQLException;
    // 事务回滚
    void rollback(boolean required) throws SQLException;
    // 创建缓存的键对象
    CacheKey createCacheKey(MappedStatement ms, Object parameterObject, RowBounds rowBounds, BoundSql boundSql);
    // 缓存中是否有这个查询的结果
    boolean isCached(MappedStatement ms, CacheKey key);
    // 清空缓存
    void clearLocalCache();
    void deferLoad(MappedStatement ms, MetaObject resultObject, String property, CacheKey key, Class<?> targetType);
    Transaction getTransaction();
    void close(boolean forceRollback);
    boolean isClosed();
    void setExecutorWrapper(Executor executor);
}
```

SimpleExecutor继承自BaseExecutor，该类比较简单。当执行增删改查时，该类获取数据库连接，创建PrepareStatement或者Statement对象，执行SQL语句，最后将数据库返回结果转化为设定的对象。下面以doQuery方法为例：

```java
//父类执行查询时调用该方法
  public <E> List<E> doQuery(MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, BoundSql boundSql) throws SQLException {
    Statement stmt = null;
    try {
      Configuration configuration = ms.getConfiguration();
       //创建StatementHandler对象
      StatementHandler handler = configuration.newStatementHandler(wrapper, ms, parameter, rowBounds, resultHandler, boundSql);
      //获得数据库连接，创建Statement或者PrepareStatement
      stmt = prepareStatement(handler, ms.getStatementLog());
      //执行SQL语句，将数据库返回结果转化为设定的对象，比如List，Map或者是POJO
      return handler.<E>query(stmt, resultHandler);
    } finally {
      //关闭Statement对象
      closeStatement(stmt);
    }
  }
```

newExecutor(tx, execType)方法的作用是创建一个执行器

```java
 final Executor executor = configuration.newExecutor(tx, execType);
```

创建执行器源码如下：

```java
    /**
     * 获取执行器
     *
     * @param transaction  事务管理器
     * @param executorType 执行器类型
     * @return Executor
     */
    public Executor newExecutor(Transaction transaction, ExecutorType executorType) {
        // 根据配置生成不同的执行器  SIMPLE BATCH BATCH
        executorType = executorType == null ? defaultExecutorType : executorType;
        executorType = executorType == null ? ExecutorType.SIMPLE : executorType;
        Executor executor;
        if (ExecutorType.BATCH == executorType) {
            executor = new BatchExecutor(this, transaction);
        } else if (ExecutorType.BATCH == executorType) {
            executor = new ReuseExecutor(this, transaction);
        } else {
            executor = new SimpleExecutor(this, transaction);
        }
        // 如果开启了二级缓存，包装成CachingExecutor 缓存执行器
        if (cacheEnabled) {
            executor = new CachingExecutor(executor);
        }
        // 每个拦截器都重新包装执行器对象
        executor = (Executor) interceptorChain.pluginAll(executor);
        // 返回
        return executor;
    }
```

##### 3. interceptorChain.pluginAll(executor)

在之前的解析中，我们了解到连接器都保存在Configuration类的interceptorChain中，interceptorChain类中保存中所有Interceptor集合组成的拦截器链。

```java
  //Configuration类,添加拦截器
  public void addInterceptor(Interceptor interceptor) {
    interceptorChain.addInterceptor(interceptor);
  }
```

在创建了执行器后，还执行了pluginAll方法会传入当前执行器对象。

```java
 executor = (Executor) interceptorChain.pluginAll(executor);
```

pluginAll()会循环所有的拦截器

```java
    /**
     * 包装执行器
     *
     * @param target
     * @return
     */
    public Object pluginAll(Object target) {
        // 循环所有拦截器，使用拦截器重新包装一个执行器
        for (Interceptor interceptor : interceptors) {
            // 拦截器对每一个执行器，进行层层包装，当前执行器就绑定了所有的拦截器，当执行器运行时，拦截器就会根据规则进行拦截
            target = interceptor.plugin(target);
        }
        // 包装完成后 返回
        return target;
    }
```

在循环中，调用了每个拦截器的plugin方法，当我们自己定义了一个拦截器后，会重写plugin()。这样就为执行器添加了所有的拦截器，执行器进行操作时，插件就会介入

```java
    @Override
    public Object plugin(Object target) {
      return Plugin.wrap(target, this);
    }
```

##### 4. 返回SqlSession对象

最后，返回SqlSession的实现类DefaultsqlSession对象，主要包含了Executor和configuration，整个获取SqlSession流程结束。

```java
            // 创建并返回DefaultSqlSession
            return new DefaultSqlSession(configuration, executor, autoCommit);
```
