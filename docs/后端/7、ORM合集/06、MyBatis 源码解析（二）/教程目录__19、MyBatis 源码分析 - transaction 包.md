# 19、MyBatis 源码分析 - transaction 包
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/7/19.html
- 分类：ORM框架
- 分组：教程目录
transaction 包是 MyBatis 中负责进行事务管理的包，这个包中有两个子包，分别代表了两种不同的管理方式，jdbc 子包中包含基于 JDBC 进行事务管理的类，managed 子包中包含基于容器进行事务管理的类。

### transaction 包结构

`Transaction` 是实现事务管理的顶层接口，可以通过其进行事务的管理。

`TransactionFactory` 是生成事务的顶层接口，可以通过其生成事务管理对象。

### jdbc 子包

jdbc 子包代表的是 JDBC 事务，其中存放的也是 JdbcTransaction 类及其工厂类。是通过 JDBC 来实现事务的管理，代码实现如下：

```java
public class JdbcTransaction implements Transaction {
  // 连接
  protected Connection connection;
  // 数据源
  protected DataSource dataSource;
  // 事务隔离级别
  protected TransactionIsolationLevel level;
  // 是否为自动提交
  protected boolean autoCommit;
  public JdbcTransaction(DataSource ds, TransactionIsolationLevel desiredLevel, boolean desiredAutoCommit) {
    dataSource = ds;
    level = desiredLevel;
    autoCommit = desiredAutoCommit;
  }
  public JdbcTransaction(Connection connection) {
    this.connection = connection;
  }
  @Override
  public Connection getConnection() throws SQLException {
    // 如果没有连接，则开启一个新的连接
    if (connection == null) {
      openConnection();
    }
    return connection;
  }
  @Override
  public void commit() throws SQLException {
    // 连接存在并且连接是手动提交方式，则需要提交事务
    if (connection != null && !connection.getAutoCommit()) {
      connection.commit();
    }
  }
  @Override
  public void rollback() throws SQLException {
    // 连接存在并且连接是手动提交方式，则进行回滚事务
    if (connection != null && !connection.getAutoCommit()) {
      connection.rollback();
    }
  }
  @Override
  public void close() throws SQLException {
    if (connection != null) {
      // 在关闭连接前设置 connection 提交方式为自动提交
      // 可能有的小伙伴比较疑惑明明都要关闭连接了，还要修改连接的提交方式干嘛
      // 其实这里是防止 close 被重写过，并不是真正的要关闭连接，而是要放回到连接池中
      // 所以在回收连接前要重置连接的属性
      resetAutoCommit();
      // 关闭连接
      connection.close();
    }
  }
  // 设置连接的提交方式为期待的提交方式
  // 如果提交方式不是期待的方式才进行设置，否则不做修改
  protected void setDesiredAutoCommit(boolean desiredAutoCommit) {
    try {
      if (connection.getAutoCommit() != desiredAutoCommit) {
        connection.setAutoCommit(desiredAutoCommit);
      }
    } catch (SQLException e) {
      throw new TransactionException();
    }
  }
  // 重置自动提交
  // 如果是手动提交就设置为自动提交
  // 如果本身就是自动提交则不做修改
  protected void resetAutoCommit() {
    try {
      if (!connection.getAutoCommit()) {
        connection.setAutoCommit(true);
      }
    } catch (SQLException e) {
    }
  }
  protected void openConnection() throws SQLException {
    // 先通过数据源开启一个连接
    connection = dataSource.getConnection();
    // 这是事务隔离级别
    if (level != null) {
      connection.setTransactionIsolation(level.getLevel());
    }
    // 设置是否开启自动提交
    setDesiredAutoCommit(autoCommit);
  }
  @Override
  public Integer getTimeout() throws SQLException {
    return null;
  }
}
```

JdbcTransactionFactory 是用来创建 JdbcTransaction，代码实现如下：

```java
public class JdbcTransactionFactory implements TransactionFactory {
  @Override
  public Transaction newTransaction(Connection conn) {
    return new JdbcTransaction(conn);
  }
  @Override
  public Transaction newTransaction(DataSource ds, TransactionIsolationLevel level, boolean autoCommit) {
    return new JdbcTransaction(ds, level, autoCommit);
  }
}
```

### managed 子包

容器事务，是将事务操作都交给相应的容器进行管理，所以 MyBatis 自己并不需要做任何的操作。所以可以看到 commit、rollback 其实是空实现。

```java
public class ManagedTransaction implements Transaction {
  // 数据源
  private DataSource dataSource;
  // 事务隔离级别
  private TransactionIsolationLevel level;
  // 连接
  private Connection connection;
  // 是否可关闭连接，默认为 true
  private final boolean closeConnection;
  public ManagedTransaction(Connection connection, boolean closeConnection) {
    this.connection = connection;
    this.closeConnection = closeConnection;
  }
  public ManagedTransaction(DataSource ds, TransactionIsolationLevel level, boolean closeConnection) {
    this.dataSource = ds;
    this.level = level;
    this.closeConnection = closeConnection;
  }
  @Override
  public Connection getConnection() throws SQLException {
    if (this.connection == null) {
      openConnection();
    }
    return this.connection;
  }
  @Override
  public void commit() throws SQLException {
    // 空实现
  }
  @Override
  public void rollback() throws SQLException {
    // 空实现
  }
  @Override
  public void close() throws SQLException {
    if (this.closeConnection && this.connection != null) {
      this.connection.close();
    }
  }
  protected void openConnection() throws SQLException {
    this.connection = this.dataSource.getConnection();
    if (this.level != null) {
this.connection.setTransactionIsolation(this.level.getLevel());
    }
  }
  @Override
  public Integer getTimeout() throws SQLException {
    return null;
  }
}
```

同样的`ManagedTransaction` 也有其对应的工厂类 `ManagedTransactionFactory`。代码实现如下：

```java
public class ManagedTransactionFactory implements TransactionFactory {
  // 是否可被关闭
  private boolean closeConnection = true;
  @Override
  public void setProperties(Properties props) {
    if (props != null) {
      String closeConnectionProperty = props.getProperty("closeConnection");
      if (closeConnectionProperty != null) {
        closeConnection = Boolean.parseBoolean(closeConnectionProperty);
      }
    }
  }
  @Override
  public Transaction newTransaction(Connection conn) {
    return new ManagedTransaction(conn, closeConnection);
  }
  @Override
  public Transaction newTransaction(DataSource ds, TransactionIsolationLevel level, boolean autoCommit) {
    return new ManagedTransaction(ds, level, closeConnection);
  }
}
```

总结：这两种实现方案的代码都比较简单，因为本身的逻辑并不多，更多的都是在调用对应的类来进行事务的管理。这里也暂时不会讲解它们的使用场景，因为这个会留在后面一起学习。
