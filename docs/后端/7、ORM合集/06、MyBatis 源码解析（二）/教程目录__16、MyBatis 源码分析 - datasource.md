# 16、MyBatis 源码分析 - datasource
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/7/16.html
- 分类：ORM框架
- 分组：教程目录
> 终于是来到了配置解析包中的最后一个包了，虽然时间跨度比较长，但是坚持下去，还是有很大收获的。

MyBatis 作为 ORM 框架，向上连接着 Java 业务层，向下连接着数据库。而 datasource 包就是用来管理数据库连接的包，是 MyBatis 和数据库交互时涉及的最为主要的包。

### java.sql 和 javax.sql 包

Java 提供的与数据库操作相关的包住要有两个，分别是 java.sql 包和 javax.sql 包。

**java.sql**

java.sql 通常被称为 JDBC 核心 API 包，它为 Java 提供了访问数据源中数据的基本功能。基于该包能实现激昂 SQL 语句传递给数据库、从数据库中以表格的形式读写数据等功能。

java.sql 提供了一个 `Driver` 接口作为数据库厂商驱动的接口。不同的数据库厂商只需要实现这个接口，并通过 `DriverManager` 进行注册即可。

除了这些，java.sql 还为数据库连接、SQL 语句、结果集等提供了众多的类，如表示数据库连接的 Connection 类、表示数据库操作语句的 Statement 类、表示数据库操作结果的 ResultSet 类等。

基于java.sql 包，Java 程序就能完整的实现数据库操作流程。

**javax.sql**

既然java.sql 已经能够能完整的实现数据库操作流程，那么为什么还有 javax.sql 呢？javax.sql 通常被称为 JDBC 扩展 API 包，它扩展了 JDBC 核心 API 包的功能。

例如，在 javax.sql 中提供了 `DataSource`，通过它可以获取面向数据源的 `Connection` 对象，与 java.sql 中直接获取 `DriverManager` 建立连接的方法相对更为灵活，虽然底层也是通过 `DriverManager` 获取的 `Connection` 对象。除此之外，javax.sql 还提供了连接池、语句池、分布式事务等方面的诸多特性。

#### DriverManager

`DriverManager` 是 JDBC 驱动程序管理器，可以用来管理 JDBC 驱动程序。

核心方法如下：

```java
void registerDriver：向 DriverManager 中注册给定的驱动程序
void deregisterDriver：从 DriverManager 中删除给定的驱动程序
Driver getDriver：查找能匹配给定 URL 路径的驱动程序。
Enumeration getDrivers：获取当前调用者可以访问的所有已加载的 JDBC 驱动程序
Connection getConnection：建立到给定数据库的连接
```

注：这些方法都是静态的，所以不需要创建对象就能使用。

#### DataSource

`DataSource` 是 javax.sql 的一个接口，用来代表数据库厂商的数据源，可以得到数据库的连接。

核心方法：

```java
Connection getConnection()：从当前的数据源中建立一个连接
Connection getConnection(String, String)：从当前的数据源中建立一个连接，输入的参数为数据源的用户名和密码
```

javax.sql 中的 `DataSource` 仅仅只是一个接口，不同的数据库可以为其提供多种实现。常见的实现有以下几种。

- 基本实现：生成基本的到数据库的连接对象Connection。
- 连接池实现：生成的 Connection 对象能够自动加到连接池中。
- 分布式事务实现：生成的 Connection 对象能够参与分布式事务。

正因为`DataSource` 接口可以有多种实现，与直接使用 `DriverManager` 获得连接对象 `Connection` 的方式相对更为灵活。

#### Connection

Connection 接口位于 java.sql 中，它代表对某个数据库连接。基于这个连接，可以完成 SQL 语句的执行和结果的获取等工作。

```java
Statement createStatement()：创建一个Statement对象，通过它能将 SQL语句发送到数据库。
CallableStatement prepareCall()：创建一个CallableStatement对象，通过它能调用存储过程。
PreparedStatement prepareStatement()：创建一个 PreparedStatement对象，通过它能将参数化的 SQL语句发送到数据库。
String nativeSQL：将输入的 SQL语句转换成本地可用的 SQL语句。
void commit：提交当前事务。
void rollback：回滚当前事务。
void close：关闭当前的 Connection对象。
boolean isClosed：查询当前 Connection对象是否关闭。
boolean isValid：查询当前 Connection是否有效。
void setAutoCommit：根据输入参数设定当前Connection对象的自动提交模式。
int getTransactionIsolation：获取当前Connection对象的事务隔离级别。
void setTransactionIsolation：设定当前Connection对象的事务隔离级别。
DatabaseMetaData getMetaData：获取当前Connection 对象所连接的数据库的所有元数据信息。
```

`Connection` 存在事务管理的方法，如 commit、rollback 等。调用这些事务管理方法可以控制数据库完成相应的事务操作。

#### Statement

Statement 能用来执行 SQL 语句并返回结果。通常返回的都是 ResultSet。

核心方法：

```java
void addBatch：将给定的 SQL 命令批量添加到 Statement 对象的 SQL 命令执行列表。
void clearBatch：清空 Statement 对象的 SQL 命令列表。
int executeBatch：让数据库批量执行多个命令。如果执行成功，则返回一个数组。数组中的每个元素都代表了某个命令影响数据库记录的数目。
boolean execute：执行一条 SQL 语句。
ResultSet executeQuery：执行一条 SQL 语句，并返回结果集 ResultSet 对象。
int executeUpdate：执行给定 SQL 语句，该语句可能为 INSERT、UPDATE、DELETE或 DDL 语句。
ResultSet getResultSet：获取当前结果集 ResultSet 对象。
ResultSet getGeneratedKeys：获取当前操作自增生成的主键。
boolean isClosed：获取是否已关闭此 Statement 对象。
void close：关闭此 Statement 对象，释放相关资源。
Connection getConnection：获取此 Statement 对象的 Connection 对象。
```

### 数据源工厂

`datasource` 采用的是工厂模式。`DataSourceFactory` 的是所有工厂的接口，`DateSource` 作为工厂产品的接口。类图如下：

既然是工厂模式，那么就需要一个具体的工厂实现类，而选用哪个工厂实现类是从配置文件中获取到的。在 `XMLConfigBuilder` 会解析这个配置项。

```java
  private DataSourceFactory dataSourceElement(XNode context) throws Exception {
    if (context != null) {
      // 这里会得到数据源类型，例如：POOLED、UNPOOLED、JNDI
      String type = context.getStringAttribute("type");
      Properties props = context.getChildrenAsProperties();
      // 根据数据源类型得到具体的数据源工厂实现类
      DataSourceFactory factory = (DataSourceFactory) resolveClass(type).getDeclaredConstructor().newInstance();
      factory.setProperties(props);
      return factory;
    }
    throw new BuilderException("Environment declaration requires a DataSourceFactory.");
  }
```

在`DataSourceFactory` 中只有两个抽象方法。

```java
void setProperties：设置数据源的属性
DataSource getDataSource：得到数据源
```

#### UNPOOLED

UNPOOLED 代表普通的数据源，每次使用都会创建一个新的 `Connection` 连接。

**获取连接的关键代码**

```java
  private Connection doGetConnection(Properties properties) throws SQLException {
    // 初始化数据库驱动，数据库驱动是可以自动装载，但是有些数据库驱动不支持自动装载
    // 所以就需要手动装载，这步的作用如果注册表中没有需要的驱动，则需要手动装载驱动
    initializeDriver();
    // 获取数据库连接，虽然通过 DataSource 封装了一层，但是底层还是通过 DriverManger 获取的连接
    Connection connection = DriverManager.getConnection(url, properties);
    // 配置连接参数
    configureConnection(connection);
    return connection;
  }
```

#### POOLED

POOLED 基于 UNPOOLED 之上实现了 `Connection` 的复用，而不是使用完就将它丢弃掉，是通过构建连接池来实现 `Connection` 的管理。

#### 连接池

在MyBatis 中连接池的实现为 `PoolState`，其中存储了所有连接和连接池的运行情况，通过这些成员变量可以推断出连接池参数配置是否合理。

**关键成员变量**

```java
  // 数据源
  protected PooledDataSource dataSource;
  // 空闲连接
  protected final List<PooledConnection> idleConnections = new ArrayList<>();
  // 正在活动的连接
  protected final List<PooledConnection> activeConnections = new ArrayList<>();
  // 成功获取到连接的次数
  protected long requestCount = 0;
  // 累积的成功获取连接所花的时间
  protected long accumulatedRequestTime = 0;
  // 累积的连接使用时间
  protected long accumulatedCheckoutTime = 0;
  // 单次，连接使用时间超时的次数
  protected long claimedOverdueConnectionCount = 0;
  // 累积的超时连接的使用时间
  protected long accumulatedCheckoutTimeOfOverdueConnections = 0;
  // 累积的等待空闲连接的时间
  protected long accumulatedWaitTime = 0;
  // 等待空闲连接的次数，一次请求只算一次
  protected long hadToWaitCount = 0;
  // 坏连接的数量
  /*
    什么连接会被认为是坏连接或者说产生坏连接的可能途径：
    1. 超时连接主动关闭连接的时候
    2. 连接 PING 失败，可能原因包含 url、username、password 变更等
    ...
   */
  protected long badConnectionCount = 0;
```

##### 获取连接

搭配流程图食用更佳哟～

```java
  private PooledConnection popConnection(String username, String password) throws SQLException {
    boolean countedWait = false;
    PooledConnection conn = null;
    long t = System.currentTimeMillis();
    int localBadConnectionCount = 0;
    while (conn == null) {
      synchronized (state) {
        // 如果有空闲连接，则取出第一个空闲连接
        if (!state.idleConnections.isEmpty()) {
          // Pool has available connection
          conn = state.idleConnections.remove(0);
        }
        // 如果没有空闲连接
        else {
          // 当前有效的连接还没有到达设置的最大值，说明还可以创建新的连接
          if (state.activeConnections.size() < poolMaximumActiveConnections) {
            // 创建新的连接
            conn = new PooledConnection(dataSource.getConnection(), this);
          }
          // 当前有效的连接数已经 >= 设置的最大值，已经不能再创建连接了
          // 必须要等到其他的线程归还数据库连接后才能再次尝试获取。
          else {
            // 得到最早借出去的连接
            PooledConnection oldestActiveConnection = state.activeConnections.get(0);
            // 得到连接已经使用的时间
            long longestCheckoutTime = oldestActiveConnection.getCheckoutTime();
            // 如果连接使用的时间已经超过了连接池设置的最长时间，说明当前连接超时了
            if (longestCheckoutTime > poolMaximumCheckoutTime) {
              // 声明超时连接数量
              state.claimedOverdueConnectionCount++;
              // 统计超时连接的时间
              state.accumulatedCheckoutTimeOfOverdueConnections += longestCheckoutTime;
              // 统计连接的使用时间
              state.accumulatedCheckoutTime += longestCheckoutTime;
              // 将超时的连接从连接池中删除
              state.activeConnections.remove(oldestActiveConnection);
              // 如果是手动提交的方式的话，则进行回滚
              if (!oldestActiveConnection.getRealConnection().getAutoCommit()) {
                try {
                  oldestActiveConnection.getRealConnection().rollback();
                } catch (SQLException e) {
                  log.debug("Bad connection. Could not roll back");
                }
              }
              // 创建一个新的连接，但是实际上还是复用的原来的连接信息
              conn = new PooledConnection(oldestActiveConnection.getRealConnection(), this);
              conn.setCreatedTimestamp(oldestActiveConnection.getCreatedTimestamp());
              conn.setLastUsedTimestamp(oldestActiveConnection.getLastUsedTimestamp());
              // 设置原来的连接为无效连接
              oldestActiveConnection.invalidate();
            } else {
              // 必须等待有空闲连接，或者有连接超时
              try {
                if (!countedWait) {
                  // 统计等待连接的次数
                  state.hadToWaitCount++;
                  countedWait = true;
                }
                long wt = System.currentTimeMillis();
                // 等待固定时间
                state.wait(poolTimeToWait);
                // 统计等待时间
                state.accumulatedWaitTime += System.currentTimeMillis() - wt;
              } catch (InterruptedException e) {
                break;
              }
            }
          }
        }
        if (conn != null) {
          // 当前连接有效
          if (conn.isValid()) {
            // 如果是手动提交的方式，在交给下一个使用前要回滚当前连接中的事务
            if (!conn.getRealConnection().getAutoCommit()) {
              conn.getRealConnection().rollback();
            }
            // 初始化参数
            conn.setConnectionTypeCode(assembleConnectionTypeCode(dataSource.getUrl(), username, password));
            conn.setCheckoutTimestamp(System.currentTimeMillis());
            conn.setLastUsedTimestamp(System.currentTimeMillis());
            // 将当前连接添加到正在被使用的表中
            state.activeConnections.add(conn);
            // 连接获取成功次数自增
            state.requestCount++;
            // 统计连接获取的时间
            state.accumulatedRequestTime += System.currentTimeMillis() - t;
          } else {
            // 坏连接次数自增
            state.badConnectionCount++;
            localBadConnectionCount++;
            conn = null;
            // 如果多次拿不到一个有效的连接，则直接抛出异常
            if (localBadConnectionCount > (poolMaximumIdleConnections + poolMaximumLocalBadConnectionTolerance)) {
              throw new SQLException("PooledDataSource: Could not get a good connection to the database.");
            }
          }
        }
      }
    }
    // 如果最后都没有获取到连接，则直接抛出异常
    // 目前只有在等待有空闲连接，但是被打断才会出现 conn == null 的情况
    if (conn == null) {
      throw new SQLException("PooledDataSource: Unknown severe error condition.  The connection pool returned a null connection.");
    }
    return conn;
  }
```

##### 返还连接

```java
  protected void pushConnection(PooledConnection conn) throws SQLException {
    synchronized (state) {
      // 先从活动连接表中删除当前连接
      state.activeConnections.remove(conn);
      // 当前连接是一个有效连接
      if (conn.isValid()) {
        // 如果空闲表中有空余位置，并且当前连接的连接类型码和当前一致
        // 说明当前连接是可以放回到空闲表中的
        if (state.idleConnections.size() < poolMaximumIdleConnections && conn.getConnectionTypeCode() == expectedConnectionTypeCode) {
          // 统计总的连接使用时间
          state.accumulatedCheckoutTime += conn.getCheckoutTime();
          // 如果是手动提交，则需要在放回到空闲表前将所有待提交的事务回滚
          if (!conn.getRealConnection().getAutoCommit()) {
            conn.getRealConnection().rollback();
          }
          // 创建一个新的连接包装类，但是连接和数据源使用的都是原来的
          PooledConnection newConn = new PooledConnection(conn.getRealConnection(), this);
          // 将新的连接放置到空闲表中
          state.idleConnections.add(newConn);
          // 初始化参数
          newConn.setCreatedTimestamp(conn.getCreatedTimestamp());
          newConn.setLastUsedTimestamp(conn.getLastUsedTimestamp());
          // 设置原来的连接无效
          conn.invalidate();
          // 有新的空闲连接加入到空闲表中了，唤醒那些在等待空闲连接的线程
          state.notifyAll();
        }
        // 如果已经没有位置放下连接了，或者连接类型码已经发生了改变，老的连接需要丢掉
        else {
          // 统计总的连接使用时间
          state.accumulatedCheckoutTime += conn.getCheckoutTime();
          // 如果是手动提交方式，在丢弃连接前需要手动回滚事务
          if (!conn.getRealConnection().getAutoCommit()) {
            conn.getRealConnection().rollback();
          }
          // 关闭连接
          conn.getRealConnection().close();
          // 设置连接无效
          conn.invalidate();
        }
      }
      // 如果当前连接是一个无效连接
      else {
        // 统计坏连接数量
        state.badConnectionCount++;
      }
    }
  }
```

#### JNDI

> JNDI (Java Naming and Directory Interface) 是 Java 命名和目录接口，它能够为 Java 应用程序提供命名和目录访问的接口，我们可以将其理解为一个命名规范。在使用该规范为资源命名并将资源放入环境（Context）中后，可以通过名称从环境中查找（lookup）对应的资源。

JNDI 是一种特殊的数据源类型，它本身并不创建 `DataSource`，但是它可以从环境中找到指定的 `DataSource` 并返回出去。
