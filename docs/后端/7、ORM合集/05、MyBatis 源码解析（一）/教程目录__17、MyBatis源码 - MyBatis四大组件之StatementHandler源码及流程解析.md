# 17、MyBatis源码 - MyBatis四大组件之StatementHandler源码及流程解析
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/5/17.html
- 分类：ORM框架
- 分组：教程目录
### 前言

上篇文档我们分析了Executor源码及流程解析，我们了解到，Executor是SQL方法的执行器，是SQL方法执行的入口，配合其他组件，完成整个SQL的生命周期。Executor最后执行是由StatementHandler调用Statement去处理的，那么现在，就需要了解下MyBatis另外一个重要组件StatementHandler。

StatementHandler字面上来看，是Statement的处理器。那么什么是Statement呢？

### Statement

MyBatis中用的Statement是引入的java.sql.Statement，我们先看下使用原生JDBC操作数据库的部分代码。

```java
		Connection conn = null;
		Statement stmt = null;
		ResultSet rs = null;
		try
		{
			Class.forName(driver);
			conn = DriverManager.getConnection(url,user,password);
			String sql = "SELECT sNo,sName,sex,age FROM "
					+ "Student WHERE dept = '计算机'";
			stmt = conn.createStatement();
			rs = stmt.executeQuery(sql);
			while(rs.next())
			{
				String no = rs.getString("sNo");
				String name = rs.getString("sName");
				String sex = rs.getString("sex");
				int age = rs.getInt("age");
				System.out.println(no + " " + name + " " + sex + "   " + age);
			}
		}
```

从以上代码可以看出，Statement是用来查询SQL及返回结果处理的。

Statement官方定义：用于执行静态 SQL 语句并返回它产生的结果的对象。

Statement接口定义了很多增删改查的方法。

Statement是通过Connection连接对象创建的，Connection也是接口，提供了很多创建Statement及提交回滚的方法，可以看出，Connection可以创建三种Statement对象。

**Statement**：用于发送简单的SQL语句（不带参数的），如果要使用变量以及其他参数的时候，需要使用+号进行拼接，Statement接口是不安全的，很容易注入数据，将数据丢失或者被人恶意修改！

**PreparedStatement**：表示预编译 SQL 语句的对象，继承自statement接口，由preparedStatement创建，用于发送一个或多个输入参数的sql语句。prepareedStatement对象的效率更高，并且可以防止SQL注入。一般推荐使用preparedStatement。

**CallableStatement**：支持调用存储过程,提供了对输出和输入/输出参数(INOUT)的支持。

mybatis底层使用PreparedStatement，过程是先将带有占位符（即”?”）的sql模板发送至mysql服务器，由服务器对此无参数的sql进行编译后，将编译结果缓存，然后直接执行带有真实参数的sql。核心是通过#{ } 实现的。

### StatementHandler

#### StatementHandler接口

StatementHandler是一个接口，继承结构如下：

StatementHandler也定义了使用Statement 进行CRUD的相关方法。

```java
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * Statement 处理器
 */
public interface StatementHandler {
    // 用于创建一个具体的 Statement 对象的实现类或者是 Statement 对象
    Statement prepare(Connection connection, Integer transactionTimeout)
            throws SQLException;
    // 用于初始化 Statement 对象以及对sql的占位符进行赋值
    void parameterize(Statement statement)
            throws SQLException;
    // 用于通知 Statement 对象将进行批量操作
    void batch(Statement statement)
            throws SQLException;
    // 用于通知 Statement 对象将 insert、update、delete 操作推送到数据库
    int update(Statement statement)
            throws SQLException;
    //  用于通知 Statement 对象将 select 操作推送数据库并返回对应的查询结果
    <E> List<E> query(Statement statement, ResultHandler resultHandler)
            throws SQLException;
    // 游标查询
    <E> Cursor<E> queryCursor(Statement statement)
            throws SQLException;
    // 获取BoundSql对象
    BoundSql getBoundSql();
    // 获取ParameterHandler
    ParameterHandler getParameterHandler();
}
```

#### RoutingStatementHandler

RoutingStatementHandler，路由Statement处理器，在XML编写SQL的时候，我们可以在标签中定义statementType，可以取值为STATEMENT，PREPARED，CALLABLE。这几个就对应了JDK中的三种常用Statement。

```xml
<select  id="selectDynamicUserList" statementType="PREPARED">
```

RoutingStatementHandler的作用，就是根据statementType，生成不同的代理对象，可以在源码中看出：

```java
    // 根据MappedStatement配置的StatementType，生成不同的StatementHandler
    public RoutingStatementHandler(Executor executor, MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, BoundSql boundSql) {
        switch (ms.getStatementType()) {
            case STATEMENT:
                delegate = new SimpleStatementHandler(executor, ms, parameter, rowBounds, resultHandler, boundSql);
                break;
            case PREPARED:
                delegate = new PreparedStatementHandler(executor, ms, parameter, rowBounds, resultHandler, boundSql);
                break;
            case CALLABLE:
                delegate = new CallableStatementHandler(executor, ms, parameter, rowBounds, resultHandler, boundSql);
                break;
            default:
                throw new ExecutorException("Unknown statement type: " + ms.getStatementType());
        }
    }
```

#### BaseStatementHandler

BaseStatementHandler是一个抽象类，实现了StatementHandler接口，用于简化StatementHandler 接口实现的难度,属于适配器设计模式体现。本身并没有实现和CURD相关操作，更多的是设置了一些参数相关。它主要有三个实现类：

- SimpleStatementHandler: 管理 Statement 对象并向数据库中推送不需要预编译的SQL语句
- PreparedStatementHandler: 管理 Statement 对象并向数据中推送需要预编译的SQL语句，
- CallableStatementHandler：管理 Statement 对象并调用数据库中的存储过程

```java
public abstract class BaseStatementHandler implements StatementHandler {
    // 全局配置
    protected final Configuration configuration;
    // 对象工厂
    protected final ObjectFactory objectFactory;
    // 类型处理器
    protected final TypeHandlerRegistry typeHandlerRegistry;
    // 结果集处理器
    protected final ResultSetHandler resultSetHandler;
    // 参数处理器
    protected final ParameterHandler parameterHandler;
    // 执行器
    protected final Executor executor;
    // mapper的SQL对象
    protected final MappedStatement mappedStatement;
    // 分页参数
    protected final RowBounds rowBounds;
    // 绑定SQL对象
    protected BoundSql boundSql;
    // 构造方法
    protected BaseStatementHandler(Executor executor, MappedStatement mappedStatement, Object parameterObject, RowBounds rowBounds, ResultHandler resultHandler, BoundSql boundSql) {
        this.configuration = mappedStatement.getConfiguration();
        this.executor = executor;
        this.mappedStatement = mappedStatement;
        this.rowBounds = rowBounds;
        this.typeHandlerRegistry = configuration.getTypeHandlerRegistry();
        this.objectFactory = configuration.getObjectFactory();
        if (boundSql == null) {
      // issue435, get the key before calculating the statement
            generateKeys(parameterObject);
            boundSql = mappedStatement.getBoundSql(parameterObject);
        }
        this.boundSql = boundSql;
        this.parameterHandler = configuration.newParameterHandler(mappedStatement, parameterObject, boundSql);
        this.resultSetHandler = configuration.newResultSetHandler(executor, mappedStatement, rowBounds, parameterHandler, resultHandler, boundSql);
    }
    @Override
    public BoundSql getBoundSql() {
        return boundSql;
    }
    @Override
    public ParameterHandler getParameterHandler() {
        return parameterHandler;
    }
    // 预编译SQL语句
    @Override
    public Statement prepare(Connection connection, Integer transactionTimeout) throws SQLException {
        ErrorContext.instance().sql(boundSql.getSql());
        Statement statement = null;
        try {
            statement = instantiateStatement(connection);
            // //设置statement超时时间
            setStatementTimeout(statement, transactionTimeout);
            // //设置statement的fetchSize
            setFetchSize(statement);
            return statement;
        } catch (SQLException e) {
            closeStatement(statement);
            throw e;
        } catch (Exception e) {
            closeStatement(statement);
            throw new ExecutorException("Error preparing statement.  Cause: " + e, e);
        }
    }
    // 调用抽象方法构建statement对象是，但是没有具体实现，而是交给其子类去实现
    protected abstract Statement instantiateStatement(Connection connection) throws SQLException;
    // 给statement对象设置timeout
    protected void setStatementTimeout(Statement stmt, Integer transactionTimeout) throws SQLException {
        Integer queryTimeout = null;
        if (mappedStatement.getTimeout() != null) {
            queryTimeout = mappedStatement.getTimeout();
        } else if (configuration.getDefaultStatementTimeout() != null) {
            queryTimeout = configuration.getDefaultStatementTimeout();
        }
        if (queryTimeout != null) {
            stmt.setQueryTimeout(queryTimeout);
        }
        StatementUtil.applyTransactionTimeout(stmt, queryTimeout, transactionTimeout);
    }
    // 给statement对象设置fetchSize
    protected void setFetchSize(Statement stmt) throws SQLException {
        Integer fetchSize = mappedStatement.getFetchSize();
        if (fetchSize != null) {
            stmt.setFetchSize(fetchSize);
            return;
        }
        Integer defaultFetchSize = configuration.getDefaultFetchSize();
        if (defaultFetchSize != null) {
            stmt.setFetchSize(defaultFetchSize);
        }
    }
    // 关闭Statement
    protected void closeStatement(Statement statement) {
        try {
            if (statement != null) {
                statement.close();
            }
        } catch (SQLException e) {
            //ignore
        }
    }
    // 主键生成
    protected void generateKeys(Object parameter) {
        KeyGenerator keyGenerator = mappedStatement.getKeyGenerator();
        ErrorContext.instance().store();
        keyGenerator.processBefore(executor, mappedStatement, null, parameter);
        ErrorContext.instance().recall();
    }
}
```

#### SimpleStatementHandler

SimpleStatementHandler就是使用基本的Statement来执行query、batch、update等操作。

```java
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * 简单的StatementHandler
 */
public class SimpleStatementHandler extends BaseStatementHandler {
    public SimpleStatementHandler(Executor executor, MappedStatement mappedStatement, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, BoundSql boundSql) {
        super(executor, mappedStatement, parameter, rowBounds, resultHandler, boundSql);
    }
    // 更新
    @Override
    public int update(Statement statement) throws SQLException {
        // 获得sql语句
        String sql = boundSql.getSql();
        // 获得参数
        Object parameterObject = boundSql.getParameterObject();
        // 获取主键生成
        KeyGenerator keyGenerator = mappedStatement.getKeyGenerator();
        int rows;
        // statement执行sql语句返回更新数目
        if (keyGenerator instanceof Jdbc3KeyGenerator) {
            statement.execute(sql, Statement.RETURN_GENERATED_KEYS);
            rows = statement.getUpdateCount();
            keyGenerator.processAfter(executor, mappedStatement, statement, parameterObject);
        } else if (keyGenerator instanceof SelectKeyGenerator) {
            statement.execute(sql);
            rows = statement.getUpdateCount();
            keyGenerator.processAfter(executor, mappedStatement, statement, parameterObject);
        } else {
            // 如果没有keyGenerator，直接调用Statement.execute和Statement.getUpdateCount
            statement.execute(sql);
            rows = statement.getUpdateCount();
        }
        return rows;
    }
    // 批处理
    @Override
    public void batch(Statement statement) throws SQLException {
        String sql = boundSql.getSql();
        statement.addBatch(sql);
    }
    // statement查询
    @Override
    public <E> List<E> query(Statement statement, ResultHandler resultHandler) throws SQLException {
        String sql = boundSql.getSql();
        statement.execute(sql);
        return resultSetHandler.<E>handleResultSets(statement);
    }
    @Override
    public <E> Cursor<E> queryCursor(Statement statement) throws SQLException {
        String sql = boundSql.getSql();
        statement.execute(sql);
        return resultSetHandler.<E>handleCursorResultSets(statement);
    }
    @Override
    protected Statement instantiateStatement(Connection connection) throws SQLException {
        if (mappedStatement.getResultSetType() != null) {
            return connection.createStatement(mappedStatement.getResultSetType().getValue(), ResultSet.CONCUR_READ_ONLY);
        } else {
            return connection.createStatement();
        }
    }
	 // 由于SimpleStatementHandler是处理没有参数的SQL，所以参数设置的方法无需任何处理
    @Override
    public void parameterize(Statement statement) throws SQLException {
        // N/A
    }
}
```

#### PreparedStatementHandler

PreparedStatementHandler是我们最常用的Statement处理器，主要是创建PrepareStatement来执行CRUD，虽然初次创建PrepareStatement时开销比较大，但在多次处理SQL时只需要初始化一次，可以有效提高性能。

源码和SimpleStatementHandler差不多，只是使用的Statement是PrepareStatement。

```java
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
/* 使用PrepareStatement**/
public class PreparedStatementHandler extends BaseStatementHandler {
  public PreparedStatementHandler(Executor executor, MappedStatement mappedStatement, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, BoundSql boundSql) {
    super(executor, mappedStatement, parameter, rowBounds, resultHandler, boundSql);
  }
  //
  public int update(Statement statement) throws SQLException {
	//使用PrepareStatement
    PreparedStatement ps = (PreparedStatement) statement;
    ps.execute();
    int rows = ps.getUpdateCount();
    Object parameterObject = boundSql.getParameterObject();
    KeyGenerator keyGenerator = mappedStatement.getKeyGenerator();
	//keyGenerator在执行之后运行
    keyGenerator.processAfter(executor, mappedStatement, ps, parameterObject);
    return rows;
  }
  //使用PrepareStatement的批处理
  public void batch(Statement statement) throws SQLException {
    PreparedStatement ps = (PreparedStatement) statement;
    ps.addBatch();
  }
  //使用PrepareStatement的execute操作
  public <E> List<E> query(Statement statement, ResultHandler resultHandler) throws SQLException {
    PreparedStatement ps = (PreparedStatement) statement;
    ps.execute();
	//操作结果在ResultHandler中处理
    return resultSetHandler.<E> handleResultSets(ps);
  }
  //获得Statement
  protected Statement instantiateStatement(Connection connection) throws SQLException {
    String sql = boundSql.getSql();
	//根据KeyGenerator设置值的返回key的名称
    if (mappedStatement.getKeyGenerator() instanceof Jdbc3KeyGenerator) {
      String[] keyColumnNames = mappedStatement.getKeyColumns();
      if (keyColumnNames == null) {
        return connection.prepareStatement(sql, PreparedStatement.RETURN_GENERATED_KEYS);
      } else {
        return connection.prepareStatement(sql, keyColumnNames);
      }
    } else if (mappedStatement.getResultSetType() != null) {
      return connection.prepareStatement(sql, mappedStatement.getResultSetType().getValue(), ResultSet.CONCUR_READ_ONLY);
    } else {
      return connection.prepareStatement(sql);
    }
  }
  public void parameterize(Statement statement) throws SQLException {
    parameterHandler.setParameters((PreparedStatement) statement);
  }
}
```

#### CallableStatementHandler

CallableStatementHandler实际就是使用CallableStatement来执行SQL语句，当然它执行的是存储过程。一般也很少使用。

```java
public class CallableStatementHandler extends BaseStatementHandler {
  public CallableStatementHandler(Executor executor, MappedStatement mappedStatement, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, BoundSql boundSql) {
    super(executor, mappedStatement, parameter, rowBounds, resultHandler, boundSql);
  }
  @Override
  public int update(Statement statement) throws SQLException {
    //用来调用存储过程,它提供了对输出和输入/输出参数的支持
    CallableStatement cs = (CallableStatement) statement;
    cs.execute();
    int rows = cs.getUpdateCount();
    Object parameterObject = boundSql.getParameterObject();
    KeyGenerator keyGenerator = mappedStatement.getKeyGenerator();
    keyGenerator.processAfter(executor, mappedStatement, cs, parameterObject);
    resultSetHandler.handleOutputParameters(cs);
    return rows;
  }
  @Override
  public void batch(Statement statement) throws SQLException {
    CallableStatement cs = (CallableStatement) statement;
    cs.addBatch();
  }
  @Override
  public <E> List<E> query(Statement statement, ResultHandler resultHandler) throws SQLException {
    CallableStatement cs = (CallableStatement) statement;
    cs.execute();
    List<E> resultList = resultSetHandler.<E>handleResultSets(cs);
    resultSetHandler.handleOutputParameters(cs);
    return resultList;
  }
  @Override
  public <E> Cursor<E> queryCursor(Statement statement) throws SQLException {
    CallableStatement cs = (CallableStatement) statement;
    cs.execute();
    Cursor<E> resultList = resultSetHandler.<E>handleCursorResultSets(cs);
    resultSetHandler.handleOutputParameters(cs);
    return resultList;
  }
  @Override
  protected Statement instantiateStatement(Connection connection) throws SQLException {
    String sql = boundSql.getSql();
    if (mappedStatement.getResultSetType() != null) {
      return connection.prepareCall(sql, mappedStatement.getResultSetType().getValue(), ResultSet.CONCUR_READ_ONLY);
    } else {
      return connection.prepareCall(sql);
    }
  }
  @Override
  public void parameterize(Statement statement) throws SQLException {
    //注册out参数
    registerOutputParameters((CallableStatement) statement);
    parameterHandler.setParameters((CallableStatement) statement);
  }
  private void registerOutputParameters(CallableStatement cs) throws SQLException {
    List<ParameterMapping> parameterMappings = boundSql.getParameterMappings();
    for (int i = 0, n = parameterMappings.size(); i < n; i++) {
      ParameterMapping parameterMapping = parameterMappings.get(i);
      //处理存储过程的INOUT和OUT  
      if (parameterMapping.getMode() == ParameterMode.OUT || parameterMapping.getMode() == ParameterMode.INOUT) {
        if (null == parameterMapping.getJdbcType()) {
          throw new ExecutorException("The JDBC Type must be specified for output parameter.  Parameter: " + parameterMapping.getProperty());
        } else {
          if (parameterMapping.getNumericScale() != null && (parameterMapping.getJdbcType() == JdbcType.NUMERIC || parameterMapping.getJdbcType() == JdbcType.DECIMAL)) {
            cs.registerOutParameter(i + 1, parameterMapping.getJdbcType().TYPE_CODE, parameterMapping.getNumericScale());
          } else {
            if (parameterMapping.getJdbcTypeName() == null) {
              cs.registerOutParameter(i + 1, parameterMapping.getJdbcType().TYPE_CODE);
            } else {
              cs.registerOutParameter(i + 1, parameterMapping.getJdbcType().TYPE_CODE, parameterMapping.getJdbcTypeName());
            }
          }
        }
      }
    }
  }
}
```

### StatementHandler流程分析

#### 执行流程

##### 1. 创建StatementHandler

StatementHandler是在Executor执行器进行CRUD的时候进行创建的。比如在SimpleExecutor进行查询doQuery的时候：

```java
    // select
    @Override
    public <E> List<E> doQuery(MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, BoundSql boundSql) throws SQLException {
        //  Statement
        Statement stmt = null;
        try {
            // 获取配置
            Configuration configuration = ms.getConfiguration();
            // 创建StatementHandler
            StatementHandler handler = configuration.newStatementHandler(wrapper, ms, parameter, rowBounds, resultHandler, boundSql);
            // 准备Statement
            stmt = prepareStatement(handler, ms.getStatementLog());
            return handler.<E>query(stmt, resultHandler);
        } finally {
            closeStatement(stmt);
        }
    }
```

执行器会调用配置对象的newStatementHandler方法进行创建StatementHandler。

```java
    /**
     * 创建 StatementHandler
     *
     * @param executor        执行器
     * @param mappedStatement MS
     * @param parameterObject 参数
     * @param rowBounds       分页
     * @param resultHandler   结果处理器
     * @param boundSql        绑定SQL 对象
     * @return
     */
    public StatementHandler newStatementHandler(Executor executor, MappedStatement mappedStatement, Object parameterObject, RowBounds rowBounds, ResultHandler resultHandler, BoundSql boundSql) {
        // 创建RoutingStatementHandler
        StatementHandler statementHandler = new RoutingStatementHandler(executor, mappedStatement, parameterObject, rowBounds, resultHandler, boundSql);
        // 所有拦截器进行包装
        statementHandler = (StatementHandler) interceptorChain.pluginAll(statementHandler);
        return statementHandler;
    }
```

创建StatementHandler时，创建的都是RoutingStatementHandler，这是一个包装类，会根据不同的配置，生成不同的StatementHandler实例对象。

```java
    // 根据MappedStatement配置的StatementType，生成不同的StatementHandler
    public RoutingStatementHandler(Executor executor, MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, BoundSql boundSql) {
        switch (ms.getStatementType()) {
            // STATEMENT
            case STATEMENT:
                delegate = new SimpleStatementHandler(executor, ms, parameter, rowBounds, resultHandler, boundSql);
                break;
            case PREPARED:
                delegate = new PreparedStatementHandler(executor, ms, parameter, rowBounds, resultHandler, boundSql);
                break;
            case CALLABLE:
                delegate = new CallableStatementHandler(executor, ms, parameter, rowBounds, resultHandler, boundSql);
                break;
            default:
                throw new ExecutorException("Unknown statement type: " + ms.getStatementType());
        }
    }
```

我们这里使用的是PREPARED，所以会进入new PreparedStatementHandler方法内，PreparedStatementHandler的构造方法又是调用父类的构造，调用的是BaseStatementHandler的构造方法。

构造方法会对当前PreparedStatementHandler设置相关参数，比如configuration、executor、mappedStatement、typeHandlerRegistry等，并会创建重要的另外两个处理器（ParameterHandler、ResultSetHandler），后续介绍。

RoutingStatementHandler创建之后，也会使用所有的拦截器对其进行包装。

##### 2. 准备语句

执行器中的StatementHandler创建之后，就会调用prepareStatement方法，就当前StatementHandler进行解析，准备语句。

```java
        stmt = this.prepareStatement(handler, ms.getStatementLog());
```

```java
    // 准备语句
    private Statement prepareStatement(StatementHandler handler, Log statementLog) throws SQLException {
        Statement stmt;
        // 获取连接
        Connection connection = getConnection(statementLog);
        // 调用StatementHandler.prepare
        stmt = handler.prepare(connection, transaction.getTimeout());
        // 调用StatementHandler.parameterize
        handler.parameterize(stmt);
        return stmt;
    }
```

首先是获取数据库连接，我这里获取到的Hikari连接池中的连接，获取到连接之后，调用handler的prepare方法，实例化statement，及设置相关参数。

```java
    // 预编译SQL语句
    @Override
    public Statement prepare(Connection connection, Integer transactionTimeout) throws SQLException {
        ErrorContext.instance().sql(boundSql.getSql());
        Statement statement = null;
        try {
            statement = instantiateStatement(connection);
            // //设置statement超时时间
            setStatementTimeout(statement, transactionTimeout);
            // //设置statement的fetchSize
            setFetchSize(statement);
            return statement;
        } catch (SQLException e) {
            closeStatement(statement);
            throw e;
        } catch (Exception e) {
            closeStatement(statement);
            throw new ExecutorException("Error preparing statement.  Cause: " + e, e);
        }
    }
```

instantiateStatement方法调用JDK中的Connection接口进行创建Statement。

```java
    // 构造Statement对象
    @Override
    protected Statement instantiateStatement(Connection connection) throws SQLException {
        // 通过Connection来create一个Statement对象
        if (mappedStatement.getResultSetType() != null) {
            return connection.createStatement(mappedStatement.getResultSetType().getValue(), ResultSet.CONCUR_READ_ONLY);
        } else {
            return connection.createStatement();
        }
    }
```

##### 3. JDBC查询

Statement创建成功后，接着调用参数处理器对参数进行处理，Statement彻底完善细节后返回。之后就开始使用处理器执行查询操作了，实际使用的还是JDBC包中的执行方法。

```java
     var9 = handler.query(stmt, resultHandler);
```

##### 4. 结果集处理返回

JDBC操作完成后，返回PreparedStatement，并调用结果处理器进行结果集处理。

结果处理器处理完后，返回查询结果，关闭statement，整个流程也就结束了。
