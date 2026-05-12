# 01、Mybatis-Plus入门 - MybatisPlus插件简介
- 来源：https://ddkk.com/zhuanlan/orm/mybatisplus/5/1.html
- 分类：ORM框架
- 分组：教程目录
### Mybatis插件

Mybatis插件，实际上就是一个拦截器，应用代理模式，在方法级别上进行拦截。可以实现分页、SQL打印监控、公共字段赋值等功能，基本上可以控制SQL执行的各个阶段，如执行阶段，参数处理阶段，语法构建阶段，结果集处理阶段，具体可以根据项目业务来实现对应业务逻辑。

```java
public interface Interceptor {
	// 可从Invocation参数中拿到执行方法的对象，方法，方法参数，从而实现各种业务逻辑
  Object intercept(Invocation invocation) throws Throwable;
	// 生成代理对象
  default Object plugin(Object target) {
    return Plugin.wrap(target, this);
  }
  // 设置一些属性变量
  default void setProperties(Properties properties) {
    // NOP
  }
}
```

### MybatisPlus插件

plus提供了InnerInterceptor来实现插件功能，已经提供了很多插件使用，我们可以通过添加直接使用，也可以自己实现InnerInterceptor，然后通过MybatisPlusInterceptor添加插件来使用。

目前已有的功能:

- 自动分页: PaginationInnerInterceptor
- 多租户: TenantLineInnerInterceptor
- 动态表名: DynamicTableNameInnerInterceptor
- 乐观锁: OptimisticLockerInnerInterceptor
- sql性能规范: IllegalSQLInnerInterceptor
- 防止全表更新与删除: BlockAttackInnerInterceptor
- 数据权限：DataPermissionInterceptor

```java
@SuppressWarnings({
     "rawtypes"})
public interface InnerInterceptor {
    /**
     * 判断是否执行 {@link Executor#query(MappedStatement, Object, RowBounds, ResultHandler, CacheKey, BoundSql)}
     * <p>
     * 如果不执行query操作,则返回 {@link Collections#emptyList()}
     *
     * @param executor      Executor(可能是代理对象)
     * @param ms            MappedStatement
     * @param parameter     parameter
     * @param rowBounds     rowBounds
     * @param resultHandler resultHandler
     * @param boundSql      boundSql
     * @return 新的 boundSql
     */
    default boolean willDoQuery(Executor executor, MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, BoundSql boundSql) throws SQLException {
        return true;
    }
    /**
     * {@link Executor#query(MappedStatement, Object, RowBounds, ResultHandler, CacheKey, BoundSql)} 操作前置处理
     * <p>
     * 改改sql啥的
     *
     * @param executor      Executor(可能是代理对象)
     * @param ms            MappedStatement
     * @param parameter     parameter
     * @param rowBounds     rowBounds
     * @param resultHandler resultHandler
     * @param boundSql      boundSql
     */
    default void beforeQuery(Executor executor, MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, BoundSql boundSql) throws SQLException {
        // do nothing
    }
    /**
     * 判断是否执行 {@link Executor#update(MappedStatement, Object)}
     * <p>
     * 如果不执行update操作,则影响行数的值为 -1
     *
     * @param executor  Executor(可能是代理对象)
     * @param ms        MappedStatement
     * @param parameter parameter
     */
    default boolean willDoUpdate(Executor executor, MappedStatement ms, Object parameter) throws SQLException {
        return true;
    }
    /**
     * {@link Executor#update(MappedStatement, Object)} 操作前置处理
     * <p>
     * 改改sql啥的
     *
     * @param executor  Executor(可能是代理对象)
     * @param ms        MappedStatement
     * @param parameter parameter
     */
    default void beforeUpdate(Executor executor, MappedStatement ms, Object parameter) throws SQLException {
        // do nothing
    }
    /**
     * {@link StatementHandler#prepare(Connection, Integer)} 操作前置处理
     * <p>
     * 改改sql啥的
     *
     * @param sh                 StatementHandler(可能是代理对象)
     * @param connection         Connection
     * @param transactionTimeout transactionTimeout
     */
    default void beforePrepare(StatementHandler sh, Connection connection, Integer transactionTimeout) {
        // do nothing
    }
    default void setProperties(Properties properties) {
        // do nothing
    }
}
```

```java
@Intercepts(
    {
        @Signature(type = StatementHandler.class, method = "prepare", args = {
     Connection.class, Integer.class}),
        @Signature(type = Executor.class, method = "update", args = {
     MappedStatement.class, Object.class}),
        @Signature(type = Executor.class, method = "query", args = {
     MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class}),
        @Signature(type = Executor.class, method = "query", args = {
     MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class, CacheKey.class, BoundSql.class}),
    }
)
public class MybatisPlusInterceptor implements Interceptor {
    @Setter
    private List<InnerInterceptor> interceptors = new ArrayList<>();
    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        Object target = invocation.getTarget();
        Object[] args = invocation.getArgs();
        if (target instanceof Executor) {
            final Executor executor = (Executor) target;
            Object parameter = args[1];
            boolean isUpdate = args.length == 2;
            MappedStatement ms = (MappedStatement) args[0];
            if (!isUpdate && ms.getSqlCommandType() == SqlCommandType.SELECT) {
                RowBounds rowBounds = (RowBounds) args[2];
                ResultHandler resultHandler = (ResultHandler) args[3];
                BoundSql boundSql;
                if (args.length == 4) {
                    boundSql = ms.getBoundSql(parameter);
                } else {
                    // 几乎不可能走进这里面,除非使用Executor的代理对象调用query[args[6]]
                    boundSql = (BoundSql) args[5];
                }
                for (InnerInterceptor query : interceptors) {
                    if (!query.willDoQuery(executor, ms, parameter, rowBounds, resultHandler, boundSql)) {
                        return Collections.emptyList();
                    }
                    query.beforeQuery(executor, ms, parameter, rowBounds, resultHandler, boundSql);
                }
                CacheKey cacheKey = executor.createCacheKey(ms, parameter, rowBounds, boundSql);
                return executor.query(ms, parameter, rowBounds, resultHandler, cacheKey, boundSql);
            } else if (isUpdate) {
                for (InnerInterceptor update : interceptors) {
                    if (!update.willDoUpdate(executor, ms, parameter)) {
                        return -1;
                    }
                    update.beforeUpdate(executor, ms, parameter);
                }
            }
        } else {
            // StatementHandler
            final StatementHandler sh = (StatementHandler) target;
            Connection connections = (Connection) args[0];
            Integer transactionTimeout = (Integer) args[1];
            for (InnerInterceptor innerInterceptor : interceptors) {
                innerInterceptor.beforePrepare(sh, connections, transactionTimeout);
            }
        }
        return invocation.proceed();
    }
    @Override
    public Object plugin(Object target) {
        if (target instanceof Executor || target instanceof StatementHandler) {
            return Plugin.wrap(target, this);
        }
        return target;
    }
    public void addInnerInterceptor(InnerInterceptor innerInterceptor) {
        this.interceptors.add(innerInterceptor);
    }
    public List<InnerInterceptor> getInterceptors() {
        return Collections.unmodifiableList(interceptors);
    }
    /**
     * 使用内部规则,拿分页插件举个栗子:
     * <p>
     * - key: "@page" ,value: "com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor"
     * - key: "page:limit" ,value: "100"
     * <p>
     * 解读1: key 以 "@" 开头定义了这是一个需要组装的 InnerInterceptor, 以 "page" 结尾表示别名
     * value 是 InnerInterceptor 的具体的 class 全名
     * 解读2: key 以上面定义的 "别名 + ':'" 开头指这个 value 是定义的该 InnerInterceptor 属性需要设置的值
     * <p>
     * 如果这个 InnerInterceptor 不需要配置属性也要加别名
     */
    @Override
    public void setProperties(Properties properties) {
        PropertyMapper pm = PropertyMapper.newInstance(properties);
        Map<String, Properties> group = pm.group("@");
        group.forEach((k, v) -> {
            InnerInterceptor innerInterceptor = ClassUtils.newInstance(k);
            innerInterceptor.setProperties(v);
            addInnerInterceptor(innerInterceptor);
        });
    }
}
```
