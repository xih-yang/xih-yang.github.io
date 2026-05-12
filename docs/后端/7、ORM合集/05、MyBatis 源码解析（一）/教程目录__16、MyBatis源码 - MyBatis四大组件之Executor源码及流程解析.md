# 16、MyBatis源码 - MyBatis四大组件之Executor源码及流程解析
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/5/16.html
- 分类：ORM框架
- 分组：教程目录
### 简介

之前的文档提过，MyBatis有四大组件，这些核心组件，贯穿了整个MyBatis的生命周期，下面分析下源码，深入了解下他们的工作机制及功能。

- Executor：SQL执行器
- StatementHandler：Statement处理器
- ParameterHandler：参数处理器
- ResultSetHandler：结果处理器

### Executor

#### 源码

##### Executor接口

Executor执行器，是一个接口，位于 org.apache.ibatis.executor包下，其实现类如下：

Executor接口定义了数据库操作及事务管理的众多方法，源码如下：

```java
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * 执行器
 */
public interface Executor {
    // 不需要ResultHandler
    ResultHandler NO_RESULT_HANDLER = null;
    // 更新
    int update(MappedStatement ms, Object parameter) throws SQLException;
    // 查询，带分页，带缓存，BoundSql
    <E> List<E> query(MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, CacheKey cacheKey, BoundSql boundSql) throws SQLException;
    // 查询，带分页
    <E> List<E> query(MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler) throws SQLException;
    // 游标查询
    <E> Cursor<E> queryCursor(MappedStatement ms, Object parameter, RowBounds rowBounds) throws SQLException;
    // 刷新批处理语句
    List<BatchResult> flushStatements() throws SQLException;
    // 提交和回滚，参数是是否要强制
    void commit(boolean required) throws SQLException;
    // 事务回滚，参数是是否要强制
    void rollback(boolean required) throws SQLException;
    // 创建缓存的键对象
    CacheKey createCacheKey(MappedStatement ms, Object parameterObject, RowBounds rowBounds, BoundSql boundSql);
    // 判断是否缓存了
    boolean isCached(MappedStatement ms, CacheKey key);
    // 清空缓存
    void clearLocalCache();
    // 延迟加载
    void deferLoad(MappedStatement ms, MetaObject resultObject, String property, CacheKey key, Class<?> targetType);
    // 事务管理器
    Transaction getTransaction();
    // 关闭
    void close(boolean forceRollback);
    // 是否关闭
    boolean isClosed();
    // 包装执行器
    void setExecutorWrapper(Executor executor);
}
```

##### BaseExecutor

BaseExecutor是一个抽象类，实现了Executor接口，并重写了一部分方法，比如一级缓存处理、基础查询等。

```java
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * 执行器基类
 */
public abstract class BaseExecutor implements Executor {
    private static final Log log = LogFactory.getLog(BaseExecutor.class);
    protected Transaction transaction;
    protected Executor wrapper;
    // 延迟加载队列（线程安全）
    protected ConcurrentLinkedQueue<DeferredLoad> deferredLoads;
    //本地缓存机制（Local Cache）防止循环引用（circular references）和加速重复嵌套查询(一级缓存)
    //本地缓存
    protected PerpetualCache localCache;
    //本地输出参数缓存
    protected PerpetualCache localOutputParameterCache;
    protected Configuration configuration;
    //查询堆栈
    protected int queryStack;
    private boolean closed;
    protected BaseExecutor(Configuration configuration, Transaction transaction) {
        this.transaction = transaction;
        this.deferredLoads = new ConcurrentLinkedQueue<DeferredLoad>();
        this.localCache = new PerpetualCache("LocalCache");
        this.localOutputParameterCache = new PerpetualCache("LocalOutputParameterCache");
        this.closed = false;
        this.configuration = configuration;
        this.wrapper = this;
    }
    @Override
    public Transaction getTransaction() {
        if (closed) {
            throw new ExecutorException("Executor was closed.");
        }
        return transaction;
    }
    @Override
    public void close(boolean forceRollback) {
        try {
            try {
                rollback(forceRollback);
            } finally {
                if (transaction != null) {
                    transaction.close();
                }
            }
        } catch (SQLException e) {
            // Ignore.  There's nothing that can be done at this point.
            log.warn("Unexpected exception on closing transaction.  Cause: " + e);
        } finally {
            transaction = null;
            deferredLoads = null;
            localCache = null;
            localOutputParameterCache = null;
            closed = true;
        }
    }
    @Override
    public boolean isClosed() {
        return closed;
    }
    //SqlSession.update/insert/delete会调用此方法
    @Override
    public int update(MappedStatement ms, Object parameter) throws SQLException {
        ErrorContext.instance().resource(ms.getResource()).activity("executing an update").object(ms.getId());
        if (closed) {
            throw new ExecutorException("Executor was closed.");
        }
        //先清局部缓存，再更新，如何更新交由子类，模板方法模式
        clearLocalCache();
        return doUpdate(ms, parameter);
    }
    //刷新语句，Batch用
    @Override
    public List<BatchResult> flushStatements() throws SQLException {
        return flushStatements(false);
    }
    public List<BatchResult> flushStatements(boolean isRollBack) throws SQLException {
        if (closed) {
            throw new ExecutorException("Executor was closed.");
        }
        return doFlushStatements(isRollBack);
    }
    //SqlSession.selectList会调用此方法
    @Override
    public <E> List<E> query(MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler) throws SQLException {
        //得到绑定sql
        BoundSql boundSql = ms.getBoundSql(parameter);
        //创建缓存Key
        CacheKey key = createCacheKey(ms, parameter, rowBounds, boundSql);
        //查询
        return query(ms, parameter, rowBounds, resultHandler, key, boundSql);
    }
    @SuppressWarnings("unchecked")
    @Override
    public <E> List<E> query(MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, CacheKey key, BoundSql boundSql) throws SQLException {
        ErrorContext.instance().resource(ms.getResource()).activity("executing a query").object(ms.getId());
        //如果已经关闭，报错
        if (closed) {
            throw new ExecutorException("Executor was closed.");
        }
        //先清局部缓存，再查询.但仅查询堆栈为0，才清。为了处理递归调用
        if (queryStack == 0 && ms.isFlushCacheRequired()) {
            clearLocalCache();
        }
        List<E> list;
        try {
            //加一,这样递归调用到上面的时候就不会再清局部缓存了
            queryStack++;
            //先根据cachekey从localCache去查
            list = resultHandler == null ? (List<E>) localCache.getObject(key) : null;
            if (list != null) {
                //若查到localCache缓存，处理localOutputParameterCache
                handleLocallyCachedOutputParameters(ms, key, parameter, boundSql);
            } else {
                //从数据库查
                list = queryFromDatabase(ms, parameter, rowBounds, resultHandler, key, boundSql);
            }
        } finally {
            //清空堆栈
            queryStack--;
        }
        if (queryStack == 0) {
            //延迟加载队列中所有元素
            for (DeferredLoad deferredLoad : deferredLoads) {
                deferredLoad.load();
            }
            // issue601
            //清空延迟加载队列
            deferredLoads.clear();
            if (configuration.getLocalCacheScope() == LocalCacheScope.STATEMENT) {
                // issue482
                //如果是STATEMENT，清本地缓存
                clearLocalCache();
            }
        }
        return list;
    }
    @Override
    public <E> Cursor<E> queryCursor(MappedStatement ms, Object parameter, RowBounds rowBounds) throws SQLException {
        BoundSql boundSql = ms.getBoundSql(parameter);
        return doQueryCursor(ms, parameter, rowBounds, boundSql);
    }
    //延迟加载，DefaultResultSetHandler.getNestedQueryMappingValue调用.属于嵌套查询，比较高级.
    @Override
    public void deferLoad(MappedStatement ms, MetaObject resultObject, String property, CacheKey key, Class<?> targetType) {
        if (closed) {
            throw new ExecutorException("Executor was closed.");
        }
        DeferredLoad deferredLoad = new DeferredLoad(resultObject, property, key, localCache, configuration, targetType);
        //如果能加载，则立刻加载，否则加入到延迟加载队列中
        if (deferredLoad.canLoad()) {
            deferredLoad.load();
        } else {
            //这里怎么又new了一个新的，性能有点问题
            deferredLoads.add(new DeferredLoad(resultObject, property, key, localCache, configuration, targetType));
        }
    }
    //创建缓存Key
    @Override
    public CacheKey createCacheKey(MappedStatement ms, Object parameterObject, RowBounds rowBounds, BoundSql boundSql) {
        if (closed) {
            throw new ExecutorException("Executor was closed.");
        }
        //MyBatis 对于其 Key 的生成采取规则为：[mappedStementId + offset + limit + SQL + queryParams + environment]生成一个哈希码
        CacheKey cacheKey = new CacheKey();
        cacheKey.update(ms.getId());
        cacheKey.update(rowBounds.getOffset());
        cacheKey.update(rowBounds.getLimit());
        cacheKey.update(boundSql.getSql());
        List<ParameterMapping> parameterMappings = boundSql.getParameterMappings();
        TypeHandlerRegistry typeHandlerRegistry = ms.getConfiguration().getTypeHandlerRegistry();
        // mimic DefaultParameterHandler logic
        //模仿DefaultParameterHandler的逻辑,不再重复，请参考DefaultParameterHandler
        for (ParameterMapping parameterMapping : parameterMappings) {
            if (parameterMapping.getMode() != ParameterMode.OUT) {
                Object value;
                String propertyName = parameterMapping.getProperty();
                if (boundSql.hasAdditionalParameter(propertyName)) {
                    value = boundSql.getAdditionalParameter(propertyName);
                } else if (parameterObject == null) {
                    value = null;
                } else if (typeHandlerRegistry.hasTypeHandler(parameterObject.getClass())) {
                    value = parameterObject;
                } else {
                    MetaObject metaObject = configuration.newMetaObject(parameterObject);
                    value = metaObject.getValue(propertyName);
                }
                cacheKey.update(value);
            }
        }
        if (configuration.getEnvironment() != null) {
            // issue176
            cacheKey.update(configuration.getEnvironment().getId());
        }
        return cacheKey;
    }
    @Override
    public boolean isCached(MappedStatement ms, CacheKey key) {
        return localCache.getObject(key) != null;
    }
    @Override
    public void commit(boolean required) throws SQLException {
        if (closed) {
            throw new ExecutorException("Cannot commit, transaction is already closed");
        }
        clearLocalCache();
        flushStatements();
        if (required) {
            transaction.commit();
        }
    }
    @Override
    public void rollback(boolean required) throws SQLException {
        if (!closed) {
            try {
                clearLocalCache();
                flushStatements(true);
            } finally {
                if (required) {
                    transaction.rollback();
                }
            }
        }
    }
    @Override
    public void clearLocalCache() {
        if (!closed) {
            localCache.clear();
            localOutputParameterCache.clear();
        }
    }
    protected abstract int doUpdate(MappedStatement ms, Object parameter)
            throws SQLException;
    protected abstract List<BatchResult> doFlushStatements(boolean isRollback)
            throws SQLException;
    protected abstract <E> List<E> doQuery(MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, BoundSql boundSql)
            throws SQLException;
    protected abstract <E> Cursor<E> doQueryCursor(MappedStatement ms, Object parameter, RowBounds rowBounds, BoundSql boundSql)
            throws SQLException;
    protected void closeStatement(Statement statement) {
        if (statement != null) {
            try {
                statement.close();
            } catch (SQLException e) {
                // ignore
            }
        }
    }
    /**
     * Apply a transaction timeout.
     *
     * @param statement a current statement
     * @throws SQLException if a database access error occurs, this method is called on a closed <code>Statement</code>
     * @see StatementUtil#applyTransactionTimeout(Statement, Integer, Integer)
     * @since 3.4.0
     */
    protected void applyTransactionTimeout(Statement statement) throws SQLException {
        StatementUtil.applyTransactionTimeout(statement, statement.getQueryTimeout(), transaction.getTimeout());
    }
    private void handleLocallyCachedOutputParameters(MappedStatement ms, CacheKey key, Object parameter, BoundSql boundSql) {
        //处理存储过程的OUT参数
        if (ms.getStatementType() == StatementType.CALLABLE) {
            final Object cachedParameter = localOutputParameterCache.getObject(key);
            if (cachedParameter != null && parameter != null) {
                final MetaObject metaCachedParameter = configuration.newMetaObject(cachedParameter);
                final MetaObject metaParameter = configuration.newMetaObject(parameter);
                for (ParameterMapping parameterMapping : boundSql.getParameterMappings()) {
                    if (parameterMapping.getMode() != ParameterMode.IN) {
                        final String parameterName = parameterMapping.getProperty();
                        final Object cachedValue = metaCachedParameter.getValue(parameterName);
                        metaParameter.setValue(parameterName, cachedValue);
                    }
                }
            }
        }
    }
    //从数据库查
    private <E> List<E> queryFromDatabase(MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, CacheKey key, BoundSql boundSql) throws SQLException {
        List<E> list;
        //先向缓存中放入占位符？？？
        localCache.putObject(key, EXECUTION_PLACEHOLDER);
        try {
            list = doQuery(ms, parameter, rowBounds, resultHandler, boundSql);
        } finally {
            //最后删除占位符
            localCache.removeObject(key);
        }
        //加入缓存
        localCache.putObject(key, list);
        //如果是存储过程，OUT参数也加入缓存
        if (ms.getStatementType() == StatementType.CALLABLE) {
            localOutputParameterCache.putObject(key, parameter);
        }
        return list;
    }
    protected Connection getConnection(Log statementLog) throws SQLException {
        Connection connection = transaction.getConnection();
        if (statementLog.isDebugEnabled()) {
            //如果需要打印Connection的日志，返回一个ConnectionLogger(代理模式, AOP思想)
            return ConnectionLogger.newInstance(connection, statementLog, queryStack);
        } else {
            return connection;
        }
    }
    @Override
    public void setExecutorWrapper(Executor wrapper) {
        this.wrapper = wrapper;
    }
    //延迟加载
    private static class DeferredLoad {
        private final MetaObject resultObject;
        private final String property;
        private final Class<?> targetType;
        private final CacheKey key;
        private final PerpetualCache localCache;
        private final ObjectFactory objectFactory;
        private final ResultExtractor resultExtractor;
        // issue781
        public DeferredLoad(MetaObject resultObject,
                            String property,
                            CacheKey key,
                            PerpetualCache localCache,
                            Configuration configuration,
                            Class<?> targetType) {
            this.resultObject = resultObject;
            this.property = property;
            this.key = key;
            this.localCache = localCache;
            this.objectFactory = configuration.getObjectFactory();
            this.resultExtractor = new ResultExtractor(configuration, objectFactory);
            this.targetType = targetType;
        }
        public boolean canLoad() {
            //缓存中找到，且不为占位符，代表可以加载
            return localCache.getObject(key) != null && localCache.getObject(key) != EXECUTION_PLACEHOLDER;
        }
        //加载
        public void load() {
            @SuppressWarnings("unchecked")
            // we suppose we get back a List
                    List<Object> list = (List<Object>) localCache.getObject(key);
            //调用ResultExtractor.extractObjectFromList
            Object value = resultExtractor.extractObjectFromList(list, targetType);
            resultObject.setValue(property, value);
        }
    }
}
```

##### SimpleExecutor类

之前我们分析过，全局配置中，可以自定义执行器的类型。

```java
mybatis: 
  执行器类型
  executor-type: simple
```

mybatis提供了枚举类ExecutorType来配置执行器类型。

```java
public enum ExecutorType {
    SIMPLE,
    REUSE,
    BATCH;
    private ExecutorType() {
    }
}
```

SimpleExecutor就是默认的简单执行器，继承自BaseExecutor抽象类，并重写了doUpdate、doQuery、doQueryCursor、doFlushStatements方法。SimpleExecutor执行器，每执行一次 update 或 select，就开启一个 Statement 对象，用完就直接关闭 Statement了对象。

```java
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * 简单执行器
 */
public class SimpleExecutor extends BaseExecutor {
    public SimpleExecutor(Configuration configuration, Transaction transaction) {
        super(configuration, transaction);
    }
    // update
    @Override
    public int doUpdate(MappedStatement ms, Object parameter) throws SQLException {
        // java.sql.Statement
        Statement stmt = null;
        try {
            Configuration configuration = ms.getConfiguration();
            // 新建一个StatementHandler
            StatementHandler handler = configuration.newStatementHandler(this, ms, parameter, RowBounds.DEFAULT, null, null);
            // 准备语句
            stmt = prepareStatement(handler, ms.getStatementLog());
            // StatementHandler.update
            return handler.update(stmt);
        } finally {
            closeStatement(stmt);
        }
    }
    // select
    @Override
    public <E> List<E> doQuery(MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, BoundSql boundSql) throws SQLException {
        Statement stmt = null;
        try {
            Configuration configuration = ms.getConfiguration();
            StatementHandler handler = configuration.newStatementHandler(wrapper, ms, parameter, rowBounds, resultHandler, boundSql);
            stmt = prepareStatement(handler, ms.getStatementLog());
            return handler.<E>query(stmt, resultHandler);
        } finally {
            closeStatement(stmt);
        }
    }
    @Override
    protected <E> Cursor<E> doQueryCursor(MappedStatement ms, Object parameter, RowBounds rowBounds, BoundSql boundSql) throws SQLException {
        Configuration configuration = ms.getConfiguration();
        StatementHandler handler = configuration.newStatementHandler(wrapper, ms, parameter, rowBounds, null, boundSql);
        Statement stmt = prepareStatement(handler, ms.getStatementLog());
        return handler.<E>queryCursor(stmt);
    }
    @Override
    public List<BatchResult> doFlushStatements(boolean isRollback) throws SQLException {
        return Collections.emptyList();
    }
    // 准备语句
    private Statement prepareStatement(StatementHandler handler, Log statementLog) throws SQLException {
        Statement stmt;
        Connection connection = getConnection(statementLog);
        // 调用StatementHandler.prepare
        stmt = handler.prepare(connection, transaction.getTimeout());
        // 调用StatementHandler.parameterize
        handler.parameterize(stmt);
        return stmt;
    }
}
```

##### ReuseExecutor类

ReuseExecutor，可重用的执行器，也是继承自BaseExecutor抽象类。

这里的重用指的是重复使用 Statement，它会在内部使用一个 Map 把创建的 Statement 都缓存起来，每次执行 SQL 命令的时候，都会去判断是否存在基于该 SQL 的 Statement 对象，如果存在 Statement 对象并且对应的 connection 还没有关闭的情况下就继续使用之前的 Statement 对象，并将其缓存起来。每个SqlSession 都有一个新的 Executor 对象，所以我们缓存在 ReuseExecutor 上的Statement 作用域是同一个 SqlSession。

```java
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * 可重用的执行器
 */
public class ReuseExecutor extends BaseExecutor {
    // 可重用的执行器内部用了一个map，用来缓存SQL语句对应的Statement
    private final Map<String, Statement> statementMap = new HashMap<String, Statement>();
    public ReuseExecutor(Configuration configuration, Transaction transaction) {
        super(configuration, transaction);
    }
    @Override
    public int doUpdate(MappedStatement ms, Object parameter) throws SQLException {
        Configuration configuration = ms.getConfiguration();
        // 和SimpleExecutor一样，新建一个StatementHandler
        StatementHandler handler = configuration.newStatementHandler(this, ms, parameter, RowBounds.DEFAULT, null, null);
        // 准备语句
        Statement stmt = prepareStatement(handler, ms.getStatementLog());
        return handler.update(stmt);
    }
    @Override
    public <E> List<E> doQuery(MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, BoundSql boundSql) throws SQLException {
        Configuration configuration = ms.getConfiguration();
        StatementHandler handler = configuration.newStatementHandler(wrapper, ms, parameter, rowBounds, resultHandler, boundSql);
        Statement stmt = prepareStatement(handler, ms.getStatementLog());
        return handler.<E>query(stmt, resultHandler);
    }
    @Override
    protected <E> Cursor<E> doQueryCursor(MappedStatement ms, Object parameter, RowBounds rowBounds, BoundSql boundSql) throws SQLException {
        Configuration configuration = ms.getConfiguration();
        StatementHandler handler = configuration.newStatementHandler(wrapper, ms, parameter, rowBounds, null, boundSql);
        Statement stmt = prepareStatement(handler, ms.getStatementLog());
        return handler.<E>queryCursor(stmt);
    }
    @Override
    public List<BatchResult> doFlushStatements(boolean isRollback) throws SQLException {
        for (Statement stmt : statementMap.values()) {
            closeStatement(stmt);
        }
        statementMap.clear();
        return Collections.emptyList();
    }
    private Statement prepareStatement(StatementHandler handler, Log statementLog) throws SQLException {
        Statement stmt;
        // 得到绑定的SQL语句
        BoundSql boundSql = handler.getBoundSql();
        // 如果缓存中已经有了，直接得到Statement
        String sql = boundSql.getSql();
        if (hasStatementFor(sql)) {
            stmt = getStatement(sql);
            applyTransactionTimeout(stmt);
        } else {
            // 如果缓存没有找到，则和SimpleExecutor处理完全一样，然后加入缓存
            Connection connection = getConnection(statementLog);
            stmt = handler.prepare(connection, transaction.getTimeout());
            putStatement(sql, stmt);
        }
        handler.parameterize(stmt);
        return stmt;
    }
    private boolean hasStatementFor(String sql) {
        try {
            return statementMap.keySet().contains(sql) && !statementMap.get(sql).getConnection().isClosed();
        } catch (SQLException e) {
            return false;
        }
    }
    private Statement getStatement(String s) {
        return statementMap.get(s);
    }
    private void putStatement(String sql, Statement stmt) {
        statementMap.put(sql, stmt);
    }
}
```

##### BatchExecutor类

BatchExecutor，批处理执行器，主要是用于做批量更新操作的 ,底层会调用Statement的 executeBatch()方法实现批量操作。

```java
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * 批量处理执行器
 */
public class BatchExecutor extends BaseExecutor {
    public static final int BATCH_UPDATE_RETURN_VALUE = Integer.MIN_VALUE + 1002;
    // Statement集合
    private final List<Statement> statementList = new ArrayList<Statement>();
    // batch结果集合
    private final List<BatchResult> batchResultList = new ArrayList<BatchResult>();
    private String currentSql;
    private MappedStatement currentStatement;
    public BatchExecutor(Configuration configuration, Transaction transaction) {
        super(configuration, transaction);
    }
    @Override
    public int doUpdate(MappedStatement ms, Object parameterObject) throws SQLException {
        // 获得配置信息
        final Configuration configuration = ms.getConfiguration();
        // 获得StatementHandler
        final StatementHandler handler = configuration.newStatementHandler(this, ms, parameterObject, RowBounds.DEFAULT, null, null);
        // 获得Sql语句
        final BoundSql boundSql = handler.getBoundSql();
        final String sql = boundSql.getSql();
        final Statement stmt;
        // 如果sql语句等于当前sql MappedStatement 等于当前Map碰到Statement
        if (sql.equals(currentSql) && ms.equals(currentStatement)) {
            int last = statementList.size() - 1;
            // 获得最后一个
            stmt = statementList.get(last);
            applyTransactionTimeout(stmt);
            handler.parameterize(stmt);//fix Issues 322
            BatchResult batchResult = batchResultList.get(last);
            batchResult.addParameterObject(parameterObject);
        } else {
            // 如果不存在就创建一个批处理操作
            Connection connection = getConnection(ms.getStatementLog());
            stmt = handler.prepare(connection, transaction.getTimeout());
            handler.parameterize(stmt);    //fix Issues 322
            currentSql = sql;
            currentStatement = ms;
            // 添加批量处理操作
            statementList.add(stmt);
            batchResultList.add(new BatchResult(ms, sql, parameterObject));
        }
        // 最终是调用jdbc的批处理操作
        handler.batch(stmt);
        return BATCH_UPDATE_RETURN_VALUE;
    }
    @Override
    public <E> List<E> doQuery(MappedStatement ms, Object parameterObject, RowBounds rowBounds, ResultHandler resultHandler, BoundSql boundSql)
            throws SQLException {
        Statement stmt = null;
        try {
            flushStatements();
            Configuration configuration = ms.getConfiguration();
            StatementHandler handler = configuration.newStatementHandler(wrapper, ms, parameterObject, rowBounds, resultHandler, boundSql);
            Connection connection = getConnection(ms.getStatementLog());
            stmt = handler.prepare(connection, transaction.getTimeout());
            handler.parameterize(stmt);
            return handler.<E>query(stmt, resultHandler);
        } finally {
            closeStatement(stmt);
        }
    }
    @Override
    protected <E> Cursor<E> doQueryCursor(MappedStatement ms, Object parameter, RowBounds rowBounds, BoundSql boundSql) throws SQLException {
        flushStatements();
        Configuration configuration = ms.getConfiguration();
        StatementHandler handler = configuration.newStatementHandler(wrapper, ms, parameter, rowBounds, null, boundSql);
        Connection connection = getConnection(ms.getStatementLog());
        Statement stmt = handler.prepare(connection, transaction.getTimeout());
        handler.parameterize(stmt);
        return handler.<E>queryCursor(stmt);
    }
    // 刷新Statement，记录执行次数
    @Override
    public List<BatchResult> doFlushStatements(boolean isRollback) throws SQLException {
        try {
            List<BatchResult> results = new ArrayList<BatchResult>();
            if (isRollback) {
                return Collections.emptyList();
            }
            for (int i = 0, n = statementList.size(); i < n; i++) {
                Statement stmt = statementList.get(i);
                applyTransactionTimeout(stmt);
                // 记录批量处理执行操作的条数
                BatchResult batchResult = batchResultList.get(i);
                try {
                    batchResult.setUpdateCounts(stmt.executeBatch());
                    MappedStatement ms = batchResult.getMappedStatement();
                    // 参数对象集合
                    List<Object> parameterObjects = batchResult.getParameterObjects();
                    KeyGenerator keyGenerator = ms.getKeyGenerator();
                    if (Jdbc3KeyGenerator.class.equals(keyGenerator.getClass())) {
                        Jdbc3KeyGenerator jdbc3KeyGenerator = (Jdbc3KeyGenerator) keyGenerator;
                        jdbc3KeyGenerator.processBatch(ms, stmt, parameterObjects);
                    } else if (!NoKeyGenerator.class.equals(keyGenerator.getClass())) {
      //issue141
                        for (Object parameter : parameterObjects) {
                            keyGenerator.processAfter(this, ms, stmt, parameter);
                        }
                    }
                    // Close statement to close cursor1109
                    closeStatement(stmt);
                } catch (BatchUpdateException e) {
                    StringBuilder message = new StringBuilder();
                    message.append(batchResult.getMappedStatement().getId())
                            .append(" (batch index")
                            .append(i + 1)
                            .append(")")
                            .append(" failed.");
                    if (i > 0) {
                        message.append(" ")
                                .append(i)
                                .append(" prior sub executor(s) completed successfully, but will be rolled back.");
                    }
                    throw new BatchExecutorException(message.toString(), e, results, batchResult);
                }
                // 记录操作
                results.add(batchResult);
            }
            return results;
        } finally {
            for (Statement stmt : statementList) {
                closeStatement(stmt);
            }
            currentSql = null;
            statementList.clear();
            batchResultList.clear();
        }
    }
}
```

##### CachingExecutor类

CachingExecutor，缓存执行器，主要是处理二级缓存，当开启了二级缓存配置后，上面的执行器，就被包装为CachingExecutor，默认的数据库查询工作，还是由CachingExecutor中的delegate（实际的执行器）进行操作。

```java
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @author Eduardo Macarron
 * 二级缓存执行器
 */
public class CachingExecutor implements Executor {
    private final Executor delegate;
    private final TransactionalCacheManager tcm = new TransactionalCacheManager();
    // 包装一个执行器
    public CachingExecutor(Executor delegate) {
        this.delegate = delegate;
        delegate.setExecutorWrapper(this);
    }
    @Override
    public Transaction getTransaction() {
        return delegate.getTransaction();
    }
    @Override
    public void close(boolean forceRollback) {
        try {
            //issues499,524 and573
            if (forceRollback) {
                tcm.rollback();
            } else {
                tcm.commit();
            }
        } finally {
            delegate.close(forceRollback);
        }
    }
    @Override
    public boolean isClosed() {
        return delegate.isClosed();
    }
    @Override
    public int update(MappedStatement ms, Object parameterObject) throws SQLException {
        // 刷新缓存完再update
        flushCacheIfRequired(ms);
        return delegate.update(ms, parameterObject);
    }
    @Override
    public <E> List<E> query(MappedStatement ms, Object parameterObject, RowBounds rowBounds, ResultHandler resultHandler) throws SQLException {
        BoundSql boundSql = ms.getBoundSql(parameterObject);
        // query时传入一个缓存key参数
        CacheKey key = createCacheKey(ms, parameterObject, rowBounds, boundSql);
        return query(ms, parameterObject, rowBounds, resultHandler, key, boundSql);
    }
    @Override
    public <E> Cursor<E> queryCursor(MappedStatement ms, Object parameter, RowBounds rowBounds) throws SQLException {
        flushCacheIfRequired(ms);
        return delegate.queryCursor(ms, parameter, rowBounds);
    }
    @Override
    public <E> List<E> query(MappedStatement ms, Object parameterObject, RowBounds rowBounds, ResultHandler resultHandler, CacheKey key, BoundSql boundSql)
            throws SQLException {
        Cache cache = ms.getCache();
        // 默认情况下是没有开启缓存的(二级缓存).要开启二级缓存,你需要在你的 SQL 映射文件中添加一行: <cache/>
        // 简单的说，就是先查CacheKey，查不到再委托给实际的执行器去查
        if (cache != null) {
            flushCacheIfRequired(ms);
            if (ms.isUseCache() && resultHandler == null) {
                ensureNoOutParams(ms, boundSql);
                @SuppressWarnings("unchecked")
                List<E> list = (List<E>) tcm.getObject(cache, key);
                if (list == null) {
                    list = delegate.<E>query(ms, parameterObject, rowBounds, resultHandler, key, boundSql);
                    tcm.putObject(cache, key, list); // issue578 and116
                }
                return list;
            }
        }
        return delegate.<E>query(ms, parameterObject, rowBounds, resultHandler, key, boundSql);
    }
    @Override
    public List<BatchResult> flushStatements() throws SQLException {
        return delegate.flushStatements();
    }
    @Override
    public void commit(boolean required) throws SQLException {
        delegate.commit(required);
        tcm.commit();
    }
    @Override
    public void rollback(boolean required) throws SQLException {
        try {
            delegate.rollback(required);
        } finally {
            if (required) {
                tcm.rollback();
            }
        }
    }
    private void ensureNoOutParams(MappedStatement ms, BoundSql boundSql) {
        if (ms.getStatementType() == StatementType.CALLABLE) {
            for (ParameterMapping parameterMapping : boundSql.getParameterMappings()) {
                if (parameterMapping.getMode() != ParameterMode.IN) {
                    throw new ExecutorException("Caching stored procedures with OUT params is not supported.  Please configure useCache=false in " + ms.getId() + " statement.");
                }
            }
        }
    }
    @Override
    public CacheKey createCacheKey(MappedStatement ms, Object parameterObject, RowBounds rowBounds, BoundSql boundSql) {
        return delegate.createCacheKey(ms, parameterObject, rowBounds, boundSql);
    }
    @Override
    public boolean isCached(MappedStatement ms, CacheKey key) {
        return delegate.isCached(ms, key);
    }
    @Override
    public void deferLoad(MappedStatement ms, MetaObject resultObject, String property, CacheKey key, Class<?> targetType) {
        delegate.deferLoad(ms, resultObject, property, key, targetType);
    }
    @Override
    public void clearLocalCache() {
        delegate.clearLocalCache();
    }
    private void flushCacheIfRequired(MappedStatement ms) {
        Cache cache = ms.getCache();
        if (cache != null && ms.isFlushCacheRequired()) {
            tcm.clear(cache);
        }
    }
    @Override
    public void setExecutorWrapper(Executor executor) {
        throw new UnsupportedOperationException("This method should not be called");
    }
}
```

#### 创建及执行流程分析

之前分析SQL执行流程，简单分析过执行器创建及执行流程，下面详细分析以下，执行器何时创建及执行操作。

环境：spring boot , 关闭二级缓存。

执行代码：

```java
    @Test
    void contextLoads() {
        UserQuery userQuery = new UserQuery();
        userQuery.setLoginName("zhangwei");
        List<User> dynamicUserList = userMapper.selectDynamicUserList(userQuery);
        System.out.println(dynamicUserList);
    }
```

##### 1. 创建执行器

使用了spring后，SqlSessionFactory及MapperProxy就交给容器去创建和管理了，这里不深究。

断点进入下面的代码：

```java
List<User> dynamicUserList = userMapper.selectDynamicUserList(userQuery)
```

首先Mapper代理对象，开始获取SqlSession，此时会执行创建执行器逻辑。调用Configuration对象的newExecutor方法，传入事务管理器及配置的执行器类型。

```java
 Executor executor = this.configuration.newExecutor(tx, execType);
```

然后根据配置，生成不同类型的执行器，因为关闭了缓存，所有这里默认生成的是SimpleExecutor。

根据配置，生成执行器后，有个很重要的步骤，会循环所有拦截器链中的所有拦截器，每个拦截器都会对当前当前执行器进行代理包装。

```java
 Executor executor = (Executor)this.interceptorChain.pluginAll(executor);
```

可以看到插件包装后，返回的执行器就包含了插件信息，具体的代理包装细节，会在插件原理介绍。

最后获取了执行器后，会将当前执行器赋值给SqlSession对象。

##### 2. 执行器执行流程

SqlSession对象创建完成后，就获取到了当前执行器及Configuration对象，接下来就要执行SQL查询操作了。

SqlSession的查询会调用SimpleExecutor的doQuery方法。

doQuery方法会创建StatementHandler对象，StatementHandler又会解析为Statement对象，最后调用对应类型的StatementHandler的query方法进行操作。

最后使用PreparedStatement的execute方法，调用底层JDBC执行数据库操作，获取到结果集后，使用结果处理器进行返回数据处理，这里涉及到其他组件，后续会详细介绍。

#### 总结

通过对源码和流程Debug分析，我们可以了解到：

- Executor在获取SqlSession是会根据不同的环境创建
- 创建的时候会使用插件对其进行包装
- SqlSession执行方法，实际调用的是Executor中的方法
- Executor方法中又包含了其他的组件进行协同处理
- 最后还是调用的JDBC中的方法进行数据库操作
