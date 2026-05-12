# 17、Mybatis-Plus入门 - 多租户插件TenantLineInnerInterceptor源码解析
- 来源：https://ddkk.com/zhuanlan/orm/mybatisplus/5/17.html
- 分类：ORM框架
- 分组：教程目录
### 核心类

#### InnerInterceptor接口

InnerInterceptor内置插件接口，是MP提供的插件功能顶级接口。

定义了一些Slelect查询，Update更新时，进行前置处理的一些方法。

实现了此接口的实现类，可以添加到Mybatis插件中，最终实现拦截器功能，实际还是调用的Mybatis插件。

```java
public interface InnerInterceptor {
    /**
     * 判断是否执行 {@link Executor#query(MappedStatement, Object, RowBounds, ResultHandler, CacheKey, BoundSql)}
     * <p>
     * 如果不执行query操作,则返回 {@link Collections#emptyList()}
     */
    default boolean willDoQuery(Executor executor, MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, BoundSql boundSql) throws SQLException {
        return true;
    }
    /**
     * {@link Executor#query(MappedStatement, Object, RowBounds, ResultHandler, CacheKey, BoundSql)} 操作前置处理
     * <p>
     * 改改sql啥的
     */
    default void beforeQuery(Executor executor, MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, BoundSql boundSql) throws SQLException {
        // do nothing
    }
    /**
     * 判断是否执行 {@link Executor#update(MappedStatement, Object)}
     * <p>
     * 如果不执行update操作,则影响行数的值为 -1
     */
    default boolean willDoUpdate(Executor executor, MappedStatement ms, Object parameter) throws SQLException {
        return true;
    }
    /**
     * {@link Executor#update(MappedStatement, Object)} 操作前置处理
     * <p>
     * 改改sql啥的
     */
    default void beforeUpdate(Executor executor, MappedStatement ms, Object parameter) throws SQLException {
        // do nothing
    }
    /**
     * {@link StatementHandler#prepare(Connection, Integer)} 操作前置处理
     * <p>
     * 改改sql啥的
     */
    default void beforePrepare(StatementHandler sh, Connection connection, Integer transactionTimeout) {
        // do nothing
    }
    /**
     * {@link StatementHandler#getBoundSql()} 操作前置处理
     * <p>
     * 只有 {@link BatchExecutor} 和 {@link ReuseExecutor} 才会调用到这个方法
     *
     * @param sh StatementHandler(可能是代理对象)
     */
    default void beforeGetBoundSql(StatementHandler sh) {
        // do nothing
    }
    default void setProperties(Properties properties) {
        // do nothing
    }
```

#### MybatisPlusInterceptor

MybatisPlusInterceptor类实现了原生Mybatis的Interceptor接口。

从它的Intercepts中，可以看到对执行器对象Executor的query和update进行了拦截。

```java
@Intercepts(
    {
        @Signature(type = StatementHandler.class, method = "prepare", args = {
     Connection.class, Integer.class}),
        @Signature(type = StatementHandler.class, method = "getBoundSql", args = {
     }),
        @Signature(type = Executor.class, method = "update", args = {
     MappedStatement.class, Object.class}),
        @Signature(type = Executor.class, method = "query", args = {
     MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class}),
        @Signature(type = Executor.class, method = "query", args = {
     MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class, CacheKey.class, BoundSql.class}),
    }
)
```

其内部维护了一个InnerInterceptor数组，我们可以在MybatisPlusConfig配置类中，添加这些拦截器。

```java
    @Setter
    private List<InnerInterceptor> interceptors = new ArrayList<>();
```

在拦截逻辑中，可以看到，对Executor执行时，循环调用每个InnerInterceptor实现类的beforeQuery或者beforeUpdate方法。

#### JsqlParserSupport

JsqlParserSupport是一个抽象类，可以理解为JsqlParser框架的工具类，定义了一些处理Insert、Delete、Update、Select对象，执行 SQL 解析等方法。

```java
public abstract class JsqlParserSupport {
    /**
     * 日志
     */
    protected final Log logger = LogFactory.getLog(this.getClass());
    public String parserSingle(String sql, Object obj) {
        if (logger.isDebugEnabled()) {
            logger.debug("original SQL: " + sql);
        }
        try {
            Statement statement = CCJSqlParserUtil.parse(sql);
            return processParser(statement, 0, sql, obj);
        } catch (JSQLParserException e) {
            throw ExceptionUtils.mpe("Failed to process, Error SQL: %s", e.getCause(), sql);
        }
    }
    public String parserMulti(String sql, Object obj) {
        if (logger.isDebugEnabled()) {
            logger.debug("original SQL: " + sql);
        }
        try {
            // fixed github pull/295
            StringBuilder sb = new StringBuilder();
            Statements statements = CCJSqlParserUtil.parseStatements(sql);
            int i = 0;
            for (Statement statement : statements.getStatements()) {
                if (i > 0) {
                    sb.append(StringPool.SEMICOLON);
                }
                sb.append(processParser(statement, i, sql, obj));
                i++;
            }
            return sb.toString();
        } catch (JSQLParserException e) {
            throw ExceptionUtils.mpe("Failed to process, Error SQL: %s", e.getCause(), sql);
        }
    }
    /**
     * 执行 SQL 解析
     *
     * @param statement JsqlParser Statement
     * @return sql
     */
    protected String processParser(Statement statement, int index, String sql, Object obj) {
        if (logger.isDebugEnabled()) {
            logger.debug("SQL to parse, SQL: " + sql);
        }
        if (statement instanceof Insert) {
            this.processInsert((Insert) statement, index, sql, obj);
        } else if (statement instanceof Select) {
            this.processSelect((Select) statement, index, sql, obj);
        } else if (statement instanceof Update) {
            this.processUpdate((Update) statement, index, sql, obj);
        } else if (statement instanceof Delete) {
            this.processDelete((Delete) statement, index, sql, obj);
        }
        sql = statement.toString();
        if (logger.isDebugEnabled()) {
            logger.debug("parse the finished SQL: " + sql);
        }
        return sql;
    }
    /**
     * 新增
     */
    protected void processInsert(Insert insert, int index, String sql, Object obj) {
        throw new UnsupportedOperationException();
    }
    /**
     * 删除
     */
    protected void processDelete(Delete delete, int index, String sql, Object obj) {
        throw new UnsupportedOperationException();
    }
    /**
     * 更新
     */
    protected void processUpdate(Update update, int index, String sql, Object obj) {
        throw new UnsupportedOperationException();
    }
    /**
     * 查询
     */
    protected void processSelect(Select select, int index, String sql, Object obj) {
        throw new UnsupportedOperationException();
    }
}
```

#### TenantLineHandler

租户处理器是一个接口，提供了TenantId 行级处理租户的功能，定义了一些获取租户 ID、获取租户字段名、忽略表的一些方法，这个接口需要用户自己去实现。

```java
public interface TenantLineHandler {
    /**
     * 获取租户 ID 值表达式，只支持单个 ID 值
     * <p>
     *
     * @return 租户 ID 值表达式
     */
    Expression getTenantId();
    /**
     * 获取租户字段名
     * <p>
     * 默认字段名叫: tenant_id
     *
     * @return 租户字段名
     */
    default String getTenantIdColumn() {
        return "tenant_id";
    }
    /**
     * 根据表名判断是否忽略拼接多租户条件
     * <p>
     * 默认都要进行解析并拼接多租户条件
     *
     * @param tableName 表名
     * @return 是否忽略, true:表示忽略，false:需要解析并拼接多租户条件
     */
    default boolean ignoreTable(String tableName) {
        return false;
    }
}
```

#### TenantLineInnerInterceptor

TenantLineInnerInterceptor就是实现多租户的插件了，其继承了JsqlParserSupport类，实现了InnerInterceptor接口。

内部维护了一个租户处理器。

```java
private TenantLineHandler tenantLineHandler;
```

也提供了很多，执行SQL时，对SQL语句进行处理的方法。具体方法功能，流程分析的时候介绍。

### Select流程分析

#### 1. 进入MybatisPlusInterceptor

Executor执行时，会进入MybatisPlusInterceptor插件，获取我们需要的参数，然后进入TenantLineInnerInterceptor的beforeQuery方法。

beforeQuery方法的形参说明如下：

```java
     * @param executor      Executor(可能是代理对象)
     * @param ms            MappedStatement
     * @param parameter     parameter
     * @param rowBounds     rowBounds
     * @param resultHandler resultHandler
     * @param boundSql      boundSql
```

#### 2. 进入TenantLineInnerInterceptor

首先进入beforeQuery，对SQL进行前置处理。

```java
    @Override
    public void beforeQuery(Executor executor, MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, BoundSql boundSql) throws SQLException {
        // 1. 缓存中查询该方法是不是配置了忽略此插件
        if (InterceptorIgnoreHelper.willIgnoreTenantLine(ms.getId())) {
            return;
        }
        // 2. 获取BoundSql
        PluginUtils.MPBoundSql mpBs = PluginUtils.mpBoundSql(boundSql);
        // 3. 重新装载SQL，并设置到BoundSql中
        mpBs.sql(parserSingle(mpBs.sql(), null));
    }
```

对SQL进行前置处理，调用的是JsqlParserSupport的parserSingle方法，使用工具类解析SQL。

```java
// 1. 调用JSqlParser工具类解析SQL为Statement
Statement statement = CCJSqlParserUtil.parse(sql);
// 2. 处理Statement
return processParser(statement, 0, sql, obj);
```

然后继续进入processParser方法，会对当前SQL的类型进行判断，然后处理。

```java
        if (statement instanceof Insert) {
            this.processInsert((Insert)statement, index, sql, obj);
        } else if (statement instanceof Select) {
            this.processSelect((Select)statement, index, sql, obj);
        } else if (statement instanceof Update) {
            this.processUpdate((Update)statement, index, sql, obj);
        } else if (statement instanceof Delete) {
            this.processDelete((Delete)statement, index, sql, obj);
        }
        sql = statement.toString();
        if (this.logger.isDebugEnabled()) {
            this.logger.debug("parse the finished SQL: " + sql);
        }
		// 返回SQL
        return sql;
```

因为我们是Select类型，所以进入TenantLineInnerInterceptor的processSelect方法。

```java
    @Override
    protected void processSelect(Select select, int index, String sql, Object obj) {
        // 1. 处理Select
        processSelectBody(select.getSelectBody());
        // 2. 处理 WithItem
        List<WithItem> withItemsList = select.getWithItemsList();
        if (!CollectionUtils.isEmpty(withItemsList)) {
            withItemsList.forEach(this::processSelectBody);
        }
    }
```

processSelectBody方法会根据SelectBody实际类型，执行不同的处理方法。

```java
    protected void processSelectBody(SelectBody selectBody) {
        if (selectBody == null) {
            return;
        }
        if (selectBody instanceof PlainSelect) {
            processPlainSelect((PlainSelect) selectBody);
        } else if (selectBody instanceof WithItem) {
            WithItem withItem = (WithItem) selectBody;
            processSelectBody(withItem.getSelectBody());
        } else {
            SetOperationList operationList = (SetOperationList) selectBody;
            List<SelectBody> selectBodys = operationList.getSelects();
            if (CollectionUtils.isNotEmpty(selectBodys)) {
                selectBodys.forEach(this::processSelectBody);
            }
        }
    }
```

然后调用processPlainSelect方法处理 PlainSelect。

```java
    /**
     * 处理 PlainSelect
     */
    protected void processPlainSelect(PlainSelect plainSelect) {
        // 1. 获取From 后面的元素（第一个）user u
        FromItem fromItem = plainSelect.getFromItem();
        // 2. 获取Where 条件 u.user_name = ?
        Expression where = plainSelect.getWhere();
        // 3. 添加 租户过滤SQL   AND u.tenant_id = '0001'
        processWhereSubSelect(where);
        if (fromItem instanceof Table) {
            Table fromTable = (Table) fromItem;
            if (!tenantLineHandler.ignoreTable(fromTable.getName())) {
                //#1186 github
                // 调用tenantLineHandler 添加Where表达式。
                plainSelect.setWhere(builderExpression(where, fromTable));
            }
        } else {
            processFromItem(fromItem);
        }
        //#3087 github
        List<SelectItem> selectItems = plainSelect.getSelectItems();
        if (CollectionUtils.isNotEmpty(selectItems)) {
            selectItems.forEach(this::processSelectItem);
        }
        // 4. 处理Join 语句 LEFT JOIN user_role ur ON u.user_id = ur.user_id
        List<Join> joins = plainSelect.getJoins();
        if (CollectionUtils.isNotEmpty(joins)) {
            joins.forEach(j -> {
                processJoin(j);
                processFromItem(j.getRightItem());
            });
        }
    }
```

对Where处理。

```java
    /**
     * 处理where条件内的子查询
     * <p>
     * 支持如下:
     * 1. in
     * 2. =
     * 3. >
     * 4. <
     * 5. >=
     * 6. <=
     * 7. <>
     * 8. EXISTS
     * 9. NOT EXISTS
     * <p>
     * 前提条件:
     * 1. 子查询必须放在小括号中
     * 2. 子查询一般放在比较操作符的右边
     *
     * @param where where 条件
     */
    protected void processWhereSubSelect(Expression where) {
        if (where == null) {
            return;
        }
        if (where instanceof FromItem) {
            processFromItem((FromItem) where);
            return;
        }
        if (where.toString().indexOf("SELECT") > 0) {
            // 有子查询
            if (where instanceof BinaryExpression) {
                // 比较符号 , and , or , 等等
                BinaryExpression expression = (BinaryExpression) where;
                processWhereSubSelect(expression.getLeftExpression());
                processWhereSubSelect(expression.getRightExpression());
            } else if (where instanceof InExpression) {
                // in
                InExpression expression = (InExpression) where;
                ItemsList itemsList = expression.getRightItemsList();
                if (itemsList instanceof SubSelect) {
                    processSelectBody(((SubSelect) itemsList).getSelectBody());
                }
            } else if (where instanceof ExistsExpression) {
                // exists
                ExistsExpression expression = (ExistsExpression) where;
                processWhereSubSelect(expression.getRightExpression());
            } else if (where instanceof NotExpression) {
                // not exists
                NotExpression expression = (NotExpression) where;
                processWhereSubSelect(expression.getExpression());
            } else if (where instanceof Parenthesis) {
                Parenthesis expression = (Parenthesis) where;
                processWhereSubSelect(expression.getExpression());
            }
        }
    }
```

最终返回拼接了租户过滤条件的SQL ，设置到boundSql中，

#### 3. 再次进入MybatisPlusInterceptor

Executor对象在进入MybatisPlusInterceptor获取到租户条件后，直接执行了以下代码，会创建缓存及执行Query。

```java
                CacheKey cacheKey = executor.createCacheKey(ms, parameter, rowBounds, boundSql);
                return executor.query(ms, parameter, rowBounds, resultHandler, cacheKey, boundSql);
```

我们知道Executor会调用StatementHandler去执行SQL，因为MybatisPlusInterceptor对StatementHandler的prepare也进行了拦截，所以会再次进入拦截器中。

会直接进入MybatisPlusInterceptor的以下逻辑。

在这里，会执行InnerInterceptor拦截器的beforePrepare方法。

TenantLineInnerInterceptor的beforePrepare如下所示：

```java
    /**
     *  StatementHandler =》prepare
     * @param sh                 StatementHandler(可能是代理对象)
     * @param connection         Connection
     * @param transactionTimeout transactionTimeout
     */
    @Override
    public void beforePrepare(StatementHandler sh, Connection connection, Integer transactionTimeout) {
        // 1. 转换为MP的 StatementHandler
        PluginUtils.MPStatementHandler mpSh = PluginUtils.mpStatementHandler(sh);
        MappedStatement ms = mpSh.mappedStatement();
        SqlCommandType sct = ms.getSqlCommandType();
        // 2. 不是查询，则会进入
        if (sct == SqlCommandType.INSERT || sct == SqlCommandType.UPDATE || sct == SqlCommandType.DELETE) {
            if (InterceptorIgnoreHelper.willIgnoreTenantLine(ms.getId())) return;
            PluginUtils.MPBoundSql mpBs = mpSh.mPBoundSql();
            mpBs.sql(parserMulti(mpBs.sql(), null));
        }
    }
```

### 更新流程

更新语句直接进入MybatisPlusInterceptor的如下方法执行beforeUpdate。

最终和查询差不多，也会生成携带租户的SQL：
