# 29、Spring源码分析 - 29-JdbcTemplat的设计与实现
- 来源：https://ddkk.com/zhuanlan/j2ee/spring/7/29.html
- 分类：J2EE框架
- 分组：教程目录
## 1、设计原理

在Spring JDBC中, JdbcTemplate是一个主要的模板类，从类继承关系上来看, JdbcTemplate继承了基类JdbcAccessor和接口类JdbcOperation。在基类 JdbcAccessorl的设计中,对DataSource数据源进行管理和配置。在 JdbcOperation接口中,定义了通过JDBC操作数据库的基本操作方法,而JdbcTemplate提供这些接口方法的实现比如 execute方法、query方法、update方法等。

JdbcOperations中有一系列execute()方法并且要求传入一个Callback函数，此接口的其他方法如query()、update()等方法在JdbcTemplate的实现中都是通过调用execute()方法配合一个Callback实现的。

JdbcAccessor实现了InitializingBean接口，afterPropertiesSet()方法中要求必须要有一个DataSource，实现JdbcAccessor就等于拥有了数据源。

```java
@Override
public void afterPropertiesSet() {
   if (getDataSource() == null) {
      throw new IllegalArgumentException("Property 'dataSource' is required");
   }
   if (!isLazyInit()) {
      getExceptionTranslator();
   }
}
```

## 2、JdbcTemplate的execute实现

下面以JdbcTemplate.execute()为例进一步分析JdbcTemplate中的代码是如何完成使命的。这个方法是在JdbcTemplate中被其他方法调用的基本方法之一,应用程序往往使用这个方法来执行基本的SQL语句。在execute的实现中看到了对数据库进行操作的基本过程,比如需要取得数据库 Connection,根据应用对数据库操作的需要创建数据库的Statement,对数据库操作进行回调,处理数据库异常,最后把数据库 Connection关闭等。这里展示了使用JDBC完成数据库操作的完整过程,熟悉JDBC使用的读者不会感到陌生,只是Springi对这些较为通用的JDBC使用通过 JdbcTemplate进行了一个封装而已。

execute方法的设计时序图。

execute()方法分为执行静态sql和动态sql两种，执行静态sql的execute()方法参数要求传入一个StatementCallback。

```java
@FunctionalInterface
public interface StatementCallback<T> {
   @Nullable
   T doInStatement(Statement stmt) throws SQLException, DataAccessException;
}
```

```java
@Override
public void execute(final String sql) throws DataAccessException {
   if (logger.isDebugEnabled()) {
      logger.debug("Executing SQL statement [" + sql + "]");
   }
   class ExecuteStatementCallback implements StatementCallback<Object>, SqlProvider {
      @Override
      @Nullable
      public Object doInStatement(Statement stmt) throws SQLException {
         stmt.execute(sql);
         return null;
      }
      @Override
      public String getSql() {
         return sql;
      }
   }
   execute(new ExecuteStatementCallback());
}
@Override
@Nullable
public <T> T execute(StatementCallback<T> action) throws DataAccessException {
   Assert.notNull(action, "Callback object must not be null");
   //从给定的数据源获取连接
   Connection con = DataSourceUtils.getConnection(obtainDataSource());
   Statement stmt = null;
   try {
      stmt = con.createStatement();
      //使用自身的成员属性fetchSize、maxRows、queryTimeout设置给定的Statement的获取大小、最大行数和查询超时属性
      applyStatementSettings(stmt);
      //通过stmt获取结果，如stmt.execute(sql);
      T result = action.doInStatement(stmt);
      //默认ignoreWarnings=true忽略数据库警告信息，否则以debug模式打印警告信息
      handleWarnings(stmt);
      return result;
   }
   catch (SQLException ex) {
      //尽早释放连接，以避免在异常转换程序尚未初始化的情况下潜在的连接池死锁。
      String sql = getSql(action);
      JdbcUtils.closeStatement(stmt);
      stmt = null;
      DataSourceUtils.releaseConnection(con, getDataSource());
      con = null;
      throw translateException("StatementCallback", sql, ex);
   }
   finally {
      JdbcUtils.closeStatement(stmt);
      DataSourceUtils.releaseConnection(con, getDataSource());
   }
}
```

可以看出通过一个execute()方法就可以取得结果，避免了传统JDBC大量的样板代码。

执行动态sql的execute()方法参数要求传入一个CallableStatementCreator用于创建CallableStatement和一个CallableStatementCallback用于对CallableStatement进行操作的代码的通用回调接口。

```java
@FunctionalInterface
public interface PreparedStatementCreator {
   PreparedStatement createPreparedStatement(Connection con) throws SQLException;
}
@FunctionalInterface
public interface PreparedStatementCallback<T> {
   @Nullable
   T doInPreparedStatement(PreparedStatement ps) throws SQLException, DataAccessException;
}
```

```java
@Override
@Nullable
public <T> T execute(CallableStatementCreator csc, CallableStatementCallback<T> action)
      throws DataAccessException {
   Assert.notNull(csc, "CallableStatementCreator must not be null");
   Assert.notNull(action, "Callback object must not be null");
   if (logger.isDebugEnabled()) {
      String sql = getSql(csc);
      logger.debug("Calling stored procedure" + (sql != null ? " [" + sql  + "]" : ""));
   }
   Connection con = DataSourceUtils.getConnection(obtainDataSource());
   CallableStatement cs = null;
   try {
      cs = csc.createCallableStatement(con);
      applyStatementSettings(cs);
      T result = action.doInCallableStatement(cs);
      handleWarnings(cs);
      return result;
   }
   catch (SQLException ex) {
      // Release Connection early, to avoid potential connection pool deadlock
      // in the case when the exception translator hasn't been initialized yet.
      if (csc instanceof ParameterDisposer) {
         ((ParameterDisposer) csc).cleanupParameters();
      }
      String sql = getSql(csc);
      JdbcUtils.closeStatement(cs);
      cs = null;
      DataSourceUtils.releaseConnection(con, getDataSource());
      con = null;
      throw translateException("CallableStatementCallback", sql, ex);
   }
   finally {
      if (csc instanceof ParameterDisposer) {
         ((ParameterDisposer) csc).cleanupParameters();
      }
      JdbcUtils.closeStatement(cs);
      DataSourceUtils.releaseConnection(con, getDataSource());
   }
}
```

从上面代码可以看出用户可以将执行sql的动态参数封装到CallableStatementCallback中来对CallableStatement进行设置，如query()方法的实现。

## 3、JdbcTemplate的query实现

JdbcTemplate中给出的query、update等常用方法的实现,大多都是依赖于前面提到的execute()方法。

query的设计时序图

```java
@FunctionalInterface
public interface ResultSetExtractor<T> {
   @Nullable
   T extractData(ResultSet rs) throws SQLException, DataAccessException;
}
```

```java
@Nullable
public <T> T query(
      PreparedStatementCreator psc, @Nullable final PreparedStatementSetter pss, final ResultSetExtractor<T> rse)
      throws DataAccessException {
   Assert.notNull(rse, "ResultSetExtractor must not be null");
   logger.debug("Executing prepared SQL query");
   return execute(psc, new PreparedStatementCallback<T>() {
      @Override
      @Nullable
      public T doInPreparedStatement(PreparedStatement ps) throws SQLException {
         ResultSet rs = null;
         try {
            if (pss != null) {
               pss.setValues(ps);
            }
            rs = ps.executeQuery();
            return rse.extractData(rs);
         }
         finally {
            JdbcUtils.closeResultSet(rs);
            if (pss instanceof ParameterDisposer) {
               ((ParameterDisposer) pss).cleanupParameters();
            }
         }
      }
   });
}
```

query方法是通过使用PreparedStatementCallback的回调方法dolnPreparedStatement来实现的。在回调函数中,可以看到 PreparedStatement的执行,以及查询结果的返回等处理。

## 4、DataSourceUtils获取Connection

在以上这些对数据库的操作中,使用了辅助类DataSourceUtils。Spring通过这个辅助类来对数据的Connection进行管理,比如利用它来完成打开和关闭Connection等。在数据库应用中,数据库Connection的使用往往与事务管理有很紧密的联系,这里也可以看到与事务处理相关的操作,比如Connection和当前线程的绑定等。

```java
public static Connection doGetConnection(DataSource dataSource) throws SQLException {
   Assert.notNull(dataSource, "No DataSource specified");
   /*把对数据库的Connection放到事务管理中进行管理,这里使用在TransactionSynchronizationManager中定义的ThreadLocal变量来和线程绑定数据库连接*/
   /*如果在TransactionSynchronizationManager中巳经有了与当煎线程绑定的数据库连接,那就直接取出来使用*/
   ConnectionHolder conHolder = (ConnectionHolder) TransactionSynchronizationManager.getResource(dataSource);
   if (conHolder != null && (conHolder.hasConnection() || conHolder.isSynchronizedWithTransaction())) {
      conHolder.requested();
      if (!conHolder.hasConnection()) {
         logger.debug("Fetching resumed JDBC Connection from DataSource");
         conHolder.setConnection(fetchConnection(dataSource));
      }
      return conHolder.getConnection();
   }
   // Else we either got no holder or an empty thread-bound holder here.
   logger.debug("Fetching JDBC Connection from DataSource");
   Connection con = fetchConnection(dataSource);
   //当Spring应用使用了PlatformTransactionManager来进行事物管理，
   //会在AbstractPlatformTransactionManager.prepareSynchronization()方法中激活synchronizations
   if (TransactionSynchronizationManager.isSynchronizationActive()) {
      try {
         //对事务中的其他JDBC操作使用相同的连接
         //线程绑定的对象将在事务完成时通过同步删除。
         ConnectionHolder holderToUse = conHolder;
         if (holderToUse == null) {
            holderToUse = new ConnectionHolder(con);
         }
         else {
            holderToUse.setConnection(con);
         }
         //同一个Connection使用计数
         holderToUse.requested();
         TransactionSynchronizationManager.registerSynchronization(
               new ConnectionSynchronization(holderToUse, dataSource));
         holderToUse.setSynchronizedWithTransaction(true);
         if (holderToUse != conHolder) {
            //当前线程与Connection绑定，同一线程使用相同的连接
            TransactionSynchronizationManager.bindResource(dataSource, holderToUse);
         }
      }
      catch (RuntimeException ex) {
         // Unexpected exception from external delegation call -> close Connection and rethrow.
         releaseConnection(con, dataSource);
         throw ex;
      }
   }
   return con;
}
```

## 5、异常转换处理

在execute方法catch块中，调用translateException方法对于抛出SQLException类型的异常会做一层异常转换，来屏蔽因不同据库厂商错误码不相同导致异常类型不相同。

```java
protected DataAccessException translateException(String task, @Nullable String sql, SQLException ex) {
   DataAccessException dae = getExceptionTranslator().translate(task, sql, ex);
   return (dae != null ? dae : new UncategorizedSQLException(task, sql, ex));
}
```

异常转换实际交由一个SQLExceptionTranslator对象完成，getExceptionTranslator()方法定义在JdbcAccessor中，根据是否配置数据源来决定使用SQLErrorCodeSQLExceptionTranslator还是SQLStateSQLExceptionTranslator，默认情况下JdbcTemplate是JdbcAccessor的唯一实现，且afterPropertiesSet方法要求datasource不为空，所以默认情况下此方法返回SQLErrorCodeSQLExceptionTranslator。

```java
public SQLExceptionTranslator getExceptionTranslator() {
   SQLExceptionTranslator exceptionTranslator = this.exceptionTranslator;
   if (exceptionTranslator != null) {
      return exceptionTranslator;
   }
   synchronized (this) {
      exceptionTranslator = this.exceptionTranslator;
      if (exceptionTranslator == null) {
         DataSource dataSource = getDataSource();
         if (dataSource != null) {
            exceptionTranslator = new SQLErrorCodeSQLExceptionTranslator(dataSource);
         }
         else {
            exceptionTranslator = new SQLStateSQLExceptionTranslator();
         }
         this.exceptionTranslator = exceptionTranslator;
      }
      return exceptionTranslator;
   }
}
```

AbstractFallbackSQLExceptionTranslator实现了translate方法，并定义了一个模板方法doTranslate，交由子类实现具体的处理逻辑，如果不能处理则调用getFallbackTranslator()获取一个兜底的转换器在做尝试，如果都不能处理就返回一个UncategorizedSQLException。

```java
@Override
@NonNull
public DataAccessException translate(String task, @Nullable String sql, SQLException ex) {
   Assert.notNull(ex, "Cannot translate a null SQLException");
   DataAccessException dae = doTranslate(task, sql, ex);
   if (dae != null) {
      // Specific exception match found.
      return dae;
   }
   // Looking for a fallback...
   SQLExceptionTranslator fallback = getFallbackTranslator();
   if (fallback != null) {
      dae = fallback.translate(task, sql, ex);
      if (dae != null) {
         // Fallback exception match found.
         return dae;
      }
   }
   // We couldn't identify it more precisely.
   return new UncategorizedSQLException(task, sql, ex);
}
```

以SQLErrorCodeSQLExceptionTranslator为起点，下面各个SQLExceptionTranslator的兜底SQLExceptionTranslator如下：

```java
public SQLErrorCodeSQLExceptionTranslator() {
   setFallbackTranslator(new SQLExceptionSubclassTranslator());
}
public SQLExceptionSubclassTranslator() {
   setFallbackTranslator(new SQLStateSQLExceptionTranslator());
}
```

所以对错误码的处理顺序为：SQLErrorCodeSQLExceptionTranslator->SQLExceptionSubclassTranslator->SQLStateSQLExceptionTranslator

这样每个SQLExceptionTranslator的异常处理都由自己的 doTranslate()方法完成，根据上层抛出的SQLException异常，返回一个DataAccessException。

下面具体看一下这三个异常转换的处理逻辑

### 5.1、SQLErrorCodeSQLExceptionTranslator

SQLErrorCodeSQLExceptionTranslator 转换器主要根据 SQLException.getErrorCode 进行判断，如果该错误码被包含在sqlErrorCodes中，则返回一个相应的DataAccessException，关键代码如下

```java
if (Arrays.binarySearch(this.sqlErrorCodes.getBadSqlGrammarCodes(), errorCode) >= 0) {
   logTranslation(task, sql, sqlEx, false);
   return new BadSqlGrammarException(task, (sql != null ? sql : ""), sqlEx);
}
else if (Arrays.binarySearch(this.sqlErrorCodes.getInvalidResultSetAccessCodes(), errorCode) >= 0) {
   logTranslation(task, sql, sqlEx, false);
   return new InvalidResultSetAccessException(task, (sql != null ? sql : ""), sqlEx);
}
else if 
...
return null;
```

实例化sqlErrorCodes的代码如下，

```java
this.sqlErrorCodes = SQLErrorCodesFactory.getInstance().getErrorCodes(dataSource);
```

Spring 默认在 org/springframework/jdbc/support/sql-error-codes.xml 归纳不同数据库厂商相关错误码。

```java
<beans>
   <bean id="DB2" name="Db2" class="org.springframework.jdbc.support.SQLErrorCodes">
      <property name="databaseProductName">
         <value>DB2*</value>
      </property>
      <property name="badSqlGrammarCodes">
         <value>-007,-029,-097,-104,-109,-115,-128,-199,-204,-206,-301,-408,-441,-491</value>
      </property>
      <property name="duplicateKeyCodes">
         <value>-803</value>
      </property>
      <property name="dataIntegrityViolationCodes">
         <value>-407,-530,-531,-532,-543,-544,-545,-603,-667</value>
      </property>
      <property name="dataAccessResourceFailureCodes">
         <value>-904,-971</value>
      </property>
      <property name="transientDataAccessResourceCodes">
         <value>-1035,-1218,-30080,-30081</value>
      </property>
      <property name="deadlockLoserCodes">
         <value>-911,-913</value>
      </property>
   </bean>
   ...
</beans>
```

该配置文件在SQLErrorCodesFactory构造方法中进行加载，最后生成 SQLErrorCodes缓存在Map中。SQLErrorCodesFactory允许在类路径下提供一个sql-error-codes.xml，来扩展或覆盖某些SQLErrorCodes。

```java
protected SQLErrorCodesFactory() {
   Map<String, SQLErrorCodes> errorCodes;
   try {
      DefaultListableBeanFactory lbf = new DefaultListableBeanFactory();
      lbf.setBeanClassLoader(getClass().getClassLoader());
      XmlBeanDefinitionReader bdr = new XmlBeanDefinitionReader(lbf);
      // Load default SQL error codes.
      Resource resource = loadResource(SQL_ERROR_CODE_DEFAULT_PATH);
      if (resource != null && resource.exists()) {
         bdr.loadBeanDefinitions(resource);
      }
      else {
         logger.info("Default sql-error-codes.xml not found (should be included in spring-jdbc jar)");
      }
      // Load custom SQL error codes, overriding defaults.
      resource = loadResource(SQL_ERROR_CODE_OVERRIDE_PATH);
      if (resource != null && resource.exists()) {
         bdr.loadBeanDefinitions(resource);
         logger.debug("Found custom sql-error-codes.xml file at the root of the classpath");
      }
      // Check all beans of type SQLErrorCodes.
      errorCodes = lbf.getBeansOfType(SQLErrorCodes.class, true, false);
      if (logger.isTraceEnabled()) {
         logger.trace("SQLErrorCodes loaded: " + errorCodes.keySet());
      }
   }
   catch (BeansException ex) {
      logger.warn("Error loading SQL error codes from config file", ex);
      errorCodes = Collections.emptyMap();
   }
   this.errorCodesMap = errorCodes;
}
```

key为数据库名称，获取SQLErrorCodes时通过上面代码传入的dataSource获取一个Connection对象获取数据库元信息里的数据库产品名作为调用Map.get()方法的key来找到。

### 5.2、SQLExceptionSubclassTranslator

根据SQLException子类型返回DataAccessException。

```java
if (ex instanceof SQLTransientException) {
   if (ex instanceof SQLTransientConnectionException) {
      return new TransientDataAccessResourceException(buildMessage(task, sql, ex), ex);
   }
   else if (ex instanceof SQLTransactionRollbackException) {
      return new ConcurrencyFailureException(buildMessage(task, sql, ex), ex);
   }
   else if (ex instanceof SQLTimeoutException) {
      return new QueryTimeoutException(buildMessage(task, sql, ex), ex);
   }
}
else if (ex instanceof SQLNonTransientException) {
...
return null;
```

### 5.3、SQLStateSQLExceptionTranslator

基于SqlState前两位数字分析SQLException中的SQL状态。检测标准SQL状态值和已知的特定于供应商的SQL状态。

```java
@Override
@Nullable
protected DataAccessException doTranslate(String task, @Nullable String sql, SQLException ex) {
   // First, the getSQLState check...
   String sqlState = getSqlState(ex);
   if (sqlState != null && sqlState.length() >= 2) {
      String classCode = sqlState.substring(0, 2);
      if (logger.isDebugEnabled()) {
         logger.debug("Extracted SQL state class '" + classCode + "' from value '" + sqlState + "'");
      }
      if (BAD_SQL_GRAMMAR_CODES.contains(classCode)) {
         return new BadSqlGrammarException(task, (sql != null ? sql : ""), ex);
      }
      else if (DATA_INTEGRITY_VIOLATION_CODES.contains(classCode)) {
         return new DataIntegrityViolationException(buildMessage(task, sql, ex), ex);
      }
      else if (DATA_ACCESS_RESOURCE_FAILURE_CODES.contains(classCode)) {
         return new DataAccessResourceFailureException(buildMessage(task, sql, ex), ex);
      }
      else if (TRANSIENT_DATA_ACCESS_RESOURCE_CODES.contains(classCode)) {
         return new TransientDataAccessResourceException(buildMessage(task, sql, ex), ex);
      }
      else if (CONCURRENCY_FAILURE_CODES.contains(classCode)) {
         return new ConcurrencyFailureException(buildMessage(task, sql, ex), ex);
      }
   }
   // For MySQL: exception class name indicating a timeout?
   // (since MySQL doesn't throw the JDBC 4 SQLTimeoutException)
   if (ex.getClass().getName().contains("Timeout")) {
      return new QueryTimeoutException(buildMessage(task, sql, ex), ex);
   }
   // Couldn't resolve anything proper - resort to UncategorizedSQLException.
   return null;
}
```
