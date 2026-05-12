# 03、MyBatis源码 - MyBatis全局配置文件详解2
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/5/3.html
- 分类：ORM框架
- 分组：教程目录
### 7. 对象工厂（objectFactory）

**官方描述**：每次 MyBatis 创建结果对象的新实例时，它都会使用一个对象工厂（ObjectFactory）实例来完成实例化工作。 默认的对象工厂需要做的仅仅是实例化目标类，要么通过默认无参构造方法，要么通过存在的参数映射来调用带有参数的构造方法。 如果想覆盖对象工厂的默认行为，可以通过创建自己的对象工厂来实现。

当创建结果集时，MyBatis 会使用一个对象工厂来完成创建这个结果集实例。在默认的情况下，MyBatis 会使用其定义的对象工厂DefaultObjectFactory（org.apache.ibatis.reflection.factory.DefaultObjectFactory）来完成对应的工作。

**自定义对象工厂案例**：

**1、** 继承DefaultObjectFactory来创建自定义对象工厂；

```java
public class ExampleObjectFactory extends DefaultObjectFactory {
    // 处理默认构造方法
    @Override
    public <T> T create(Class<T> type) {
        return super.create(type);
    }
    // 处理有参构造方法
    @Override
    public <T> T create(Class<T> type, List<Class<?>> constructorArgTypes, List<Object> constructorArgs) {
        return super.create(type, constructorArgTypes, constructorArgs);
    }
    // 判断集合类型参数
    @Override
    public <T> boolean isCollection(Class<T> type) {
        return super.isCollection(type);
    }
    /**
     * mybatis核心配置文件中自配置<objectFactory><property></property></objectFactory>
     * 中的property标签的内容，会在加载配置文件后，设置到Properties对象中
     */
    @Override
    public void setProperties(Properties properties) {
        super.setProperties(properties);
        System.out.println(properties.getProperty("userName"));
    }
}
```

**1、** 全局配置添加对象工厂,其子标签property会在加载全局配置文件时通过setProperties方法被初始化到MyObjectFactory中，作为该类的全局参数使用；

```java
    <!--对象工厂-->
    <objectFactory type="org.pearl.mybatis.demo.handler.ExampleObjectFactory">
        <property name="userName" value="zhangsansan"/>
    </objectFactory>
```

**1、** 测试发现，获取到了ObjectFactory设置的属性；

### 8. 插件（plugins）

Mybatis插件又称拦截器，Mybatis采用责任链模式，通过动态代理组织多个插件（拦截器），通过这些插件可以改变Mybatis的默认行为。MyBatis 允许你在已映射语句执行过程中的某一点进行拦截调用。默认情况下，MyBatis允许使用插件来拦截的方法调用包括：

- Executor (update, query, flushStatements, commit, rollback,getTransaction, close, isClosed) 拦截执行器的方法；
- ParameterHandler (getParameterObject, setParameters) 拦截参数的处理；
- ResultSetHandler (handleResultSets, handleOutputParameters) 拦截结果集的处理；
- StatementHandler (prepare, parameterize, batch, update, query) 拦截Sql语法构建的处理；

通过MyBatis 提供的强大机制，使用插件是非常简单的，只需实现 Interceptor 接口，并指定想要拦截的方法签名即可。

**对查询操作添加拦截器案例**：

**1、** 编写拦截器；

```java
@Intercepts({
     @Signature(
        type = Executor.class,
        method = "query",
        args = {
     MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class})})
public class ExamplePlugin implements Interceptor {
    private Properties properties = new Properties();
    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        Object target = invocation.getTarget(); //被代理对象
        Method method = invocation.getMethod(); //代理方法
        Object[] args = invocation.getArgs(); //方法参数
        // do something ...... 方法拦截前执行代码块
        Object result = invocation.proceed();
        // do something .......方法拦截后执行代码块
        return result;
    }
    @Override
    public void setProperties(Properties properties) {
        this.properties = properties;
    }
    @Override
    public Object plugin(Object target) {
        return Plugin.wrap(target, this);
    }
}
```

**1、** 注册拦截器；

```java
    <!--插件-->
    <plugins>
        <plugin interceptor="org.pearl.mybatis.demo.plugins.ExamplePlugin"></plugin>
    </plugins>
```

上面的插件将会拦截在 Executor 实例中所有的 “query” 方法调用， 这里的 Executor 是负责执行底层映射语句的内部对象。

### 9. 环境配置（environments）

在MyBatis 中，运行环境主要的作用是配置数据库信息，它可以配置多个数据库，一般而言只需要配置其中的一个就可以了。

它下面又分为两个可配置的元素：事务管理器（transactionManager）、数据源（dataSource）。

在实际的工作中，大部分情况下会采用 Spring 对数据源和数据库的事务进行管理。

MyBatis 可以配置成适应多种环境，这种机制有助于将 SQL 映射应用于多种数据库之中， 现实情况下有多种理由需要这么做。例如，开发、测试和生产环境需要有不同的配置；或者想在具有相同 Schema 的多个生产数据库中使用相同的 SQL 映射。还有许多类似的使用场景。

**不过要记住：尽管可以配置多个环境，但每个 SqlSessionFactory 实例只能选择一种环境。**

所以，如果你想连接两个数据库，就需要创建两个 SqlSessionFactory 实例，每个数据库对应一个。而如果是三个数据库，就需要三个实例，依此类推，记起来很简单：

- ***每个数据库对应一个 SqlSessionFactory 实例***

**多环境切换案例演示**：

**1、** 添加配置文件，配置多个环境；

```java
    <!--多环境配置-->
    <!--default默认使用的环境ID，此处表示默认使用开发环境配置-->
    <environments default="development">
        <!--开发环境配置-->
        <!--id：指定当前环境的唯一标识-->
        <environment id="development">
            <!--事务管理器的配置（比如：type="JDBC"）-->
            <transactionManager type="JDBC"/>
            <!--数据源的配置（比如：type="POOLED"）-->
            <dataSource type="POOLED">
                <!--驱动名-->
                <property name="driver" value="${db.driver:com.mysql.cj.jdbc.Driver}"/>
                <!--数据库地址-->
                <property name="url"
                          value="${db.url:jdbc:mysql://127.0.0.1:3306/angel_admin?serverTimezone=Asia/Shanghai}"/>
                <!--用户名-->
                <property name="username" value="${db.username:root}"/>
                <!--密码-->
                <property name="password" value="${db.password:123456}"/>
            </dataSource>
        </environment>
        <!--测试环境配置-->
        <environment id="test">
            <transactionManager type="JDBC"/>
            <dataSource type="POOLED">
                <property name="driver" value="${db.driver:com.mysql.cj.jdbc.Driver}"/>
                <property name="url"
                          value="${db.url:jdbc:mysql://192.168.17.1:3306/angel_admin?serverTimezone=Asia/Shanghai}"/>
                <property name="username" value="${db.username:root}"/>
                <property name="password" value="${db.password:123456}"/>
            </dataSource>
        </environment>
```

**1、** 根据不同的环境创建SqlSessionFactory，执行SQL；

```java
public class Test002 {
    public static void main(String[] args) throws IOException {
        // 开发环境
        String resource = "mybatis-config.xml";
        InputStream inputStream = Resources.getResourceAsStream(resource);
        SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream,"development");
        SqlSession sqlSession = sqlSessionFactory.openSession();
        UserMapper mapper = sqlSession.getMapper(UserMapper.class);
        User user = mapper.selectOneById(1L);
        System.out.println(user);
        // 测试环境
        String resourceTest = "mybatis-config.xml";
        InputStream inputStreamTest = Resources.getResourceAsStream(resourceTest);
        SqlSessionFactory sqlSessionFactoryTest = new SqlSessionFactoryBuilder().build(inputStreamTest,"test");
        SqlSession sqlSessionTest = sqlSessionFactoryTest.openSession();
        UserMapper mapperTest = sqlSessionTest.getMapper(UserMapper.class);
        User userTest = mapperTest.selectOneById(1L);
        System.out.println(userTest);
    }
}
```

#### 事务管理器（transactionManager）

在MyBatis 中有两种类型的事务管理器（也就是 type="[JDBC|MANAGED]"）：

- JDBC – 这个配置直接使用了 JDBC 的提交和回滚设施，它依赖从数据源获得的连接来管理事务作用域。
- MANAGED – 这个配置几乎没做什么。它从不提交或回滚一个连接，而是让容器来管理事务的整个生命周期（比如 JEE 应用服务器的上下文）。 默认情况下它会关闭连接。然而一些容器并不希望连接被关闭，因此需要将 closeConnection 属性设置为 false 来阻止默认的关闭行为。

如果你正在使用 Spring + MyBatis，则没有必要配置事务管理器，因为 Spring 模块会使用自带的管理器来覆盖前面的配置。

这两种事务管理器类型都不需要设置任何属性。它们其实是类型别名，换句话说，你可以用 TransactionFactory 接口实现类的全限定名或类型别名代替它们。

```java
public interface TransactionFactory {
  default void setProperties(Properties props) {
      // 从 3.5.2 开始，该方法为默认方法
    // 空实现
  }
  Transaction newTransaction(Connection conn);
  Transaction newTransaction(DataSource dataSource, TransactionIsolationLevel level, boolean autoCommit);
}
```

在事务管理器实例化后，所有在 XML 中配置的属性将会被传递给 setProperties() 方法。你的实现还需要创建一个 Transaction 接口的实现类，这个接口也很简单，使用这两个接口，你可以完全自定义 MyBatis 对事务的处理。

```java
public interface Transaction {
  Connection getConnection() throws SQLException;
  void commit() throws SQLException;
  void rollback() throws SQLException;
  void close() throws SQLException;
  Integer getTimeout() throws SQLException;
}
```

#### 数据源（dataSource）

dataSource 元素使用标准的 JDBC 数据源接口来配置 JDBC 连接对象的资源。

- 大多数 MyBatis 应用程序会按示例中的例子来配置数据源。虽然数据源配置是可选的，但如果要启用延迟加载特性，就必须配置数据源。

有三种内建的数据源类型（也就是 type="[UNPOOLED|POOLED|JNDI]"）：

***UNPOOLED***– 这个数据源的实现会每次请求时打开和关闭连接。虽然有点慢，但对那些数据库连接可用性要求不高的简单应用程序来说，是一个很好的选择。 性能表现则依赖于使用的数据库，对某些数据库来说，使用连接池并不重要，这个配置就很适合这种情形。UNPOOLED 类型的数据源仅仅需要配置以下 5 种属性：

- driver – 这是 JDBC 驱动的 Java 类全限定名（并不是 JDBC 驱动中可能包含的数据源类）。
- url – 这是数据库的 JDBC URL 地址。
- username – 登录数据库的用户名。
- password – 登录数据库的密码。
- defaultTransactionIsolationLevel – 默认的连接事务隔离级别。
- defaultNetworkTimeout – 等待数据库操作完成的默认网络超时时间（单位：毫秒）。查看 java.sql.Connection#setNetworkTimeout() 的 API 文档以获取更多信息。

作为可选项，你也可以传递属性给数据库驱动。只需在属性名加上“driver.”前缀即可，例如：

- driver.encoding=UTF8

这将通过 DriverManager.getConnection(url, driverProperties) 方法传递值为 UTF8 的 encoding 属性给数据库驱动。

***POOLED***– 这种数据源的实现利用“池”的概念将 JDBC 连接对象组织起来，避免了创建新的连接实例时所必需的初始化和认证时间。 这种处理方式很流行，能使并发 Web 应用快速响应请求。

除了上述提到 UNPOOLED 下的属性外，还有更多属性用来配置 POOLED 的数据源：

- poolMaximumActiveConnections – 在任意时间可存在的活动（正在使用）连接数量，默认值：10
- poolMaximumIdleConnections – 任意时间可能存在的空闲连接数。
- poolMaximumCheckoutTime – 在被强制返回之前，池中连接被检出（checked out）时间，默认值：20000 毫秒（即 20 秒）

poolTimeToWait – 这是一个底层设置，如果获取连接花费了相当长的时间，连接池会打印状态日志并重新尝试获取一个连接（避免在误配置的情况下一直失败且不打印日志），默认值：20000 毫秒（即 20 秒）。
- poolMaximumLocalBadConnectionTolerance – 这是一个关于坏连接容忍度的底层设置， 作用于每一个尝试从缓存池获取连接的线程。 如果这个线程获取到的是一个坏的连接，那么这个数据源允许这个线程尝试重新获取一个新的连接，但是这个重新尝试的次数不应该超过
- poolMaximumIdleConnections 与 poolMaximumLocalBadConnectionTolerance 之和。 默认值：3（新增于 3.4.5）

poolPingQuery – 发送到数据库的侦测查询，用来检验连接是否正常工作并准备接受请求。默认是“NO PING QUERY SET”，这会导致多数数据库驱动出错时返回恰当的错误消息。
- poolPingEnabled – 是否启用侦测查询。若开启，需要设置 poolPingQuery 属性为一个可执行的 SQL 语句（最好是一个速度非常快的 SQL 语句），默认值：false。
- poolPingConnectionsNotUsedFor – 配置 poolPingQuery 的频率。可以被设置为和数据库连接超时时间一样，来避免不必要的侦测，默认值：0（即所有连接每一时刻都被侦测 — 当然仅当 - poolPingEnabled 为 true 时适用）。

***JNDI*** – 这个数据源实现是为了能在如 EJB 或应用服务器这类容器中使用，容器可以集中或在外部配置数据源，然后放置一个 JNDI 上下文的数据源引用。这种数据源配置只需要两个属性：

- initial_context – 这个属性用来在 InitialContext 中寻找上下文（即，initialContext.lookup(initial_context)）。这是个可选属性，如果忽略，那么将会直接从 InitialContext 中寻找 data_source 属性。
- data_source – 这是引用数据源实例位置的上下文路径。提供了 initial_context 配置时会在其返回的上下文中进行查找，没有提供时则直接在 InitialContext 中查找。
-

和其他数据源配置类似，可以通过添加前缀“env.”直接把属性传递给 InitialContext。比如：

- env.encoding=UTF8

这就会在 InitialContext 实例化时往它的构造方法传递值为 UTF8 的 encoding 属性。

可以通过实现接口 org.apache.ibatis.datasource.DataSourceFactory 来使用第三方数据源实现：

```java
public interface DataSourceFactory {
  void setProperties(Properties props);
  DataSource getDataSource();
}
```

org.apache.ibatis.datasource.unpooled.UnpooledDataSourceFactory 可被用作父类来构建新的数据源适配器，比如下面这段插入 C3P0 数据源所必需的代码：

```java
import org.apache.ibatis.datasource.unpooled.UnpooledDataSourceFactory;
import com.mchange.v2.c3p0.ComboPooledDataSource;
public class C3P0DataSourceFactory extends UnpooledDataSourceFactory {
  public C3P0DataSourceFactory() {
    this.dataSource = new ComboPooledDataSource();
  }
}
```

### 10. 数据库厂商标识（databaseIdProvider）

数据库种类很多，虽然大多都是基于SQL标准，但是每个数据库都有自己的方言，或者函数。

Mybatis也做了多数据库支持，只需要告诉框架用的是什么数据库，MyBatis 可以根据不同的数据库厂商执行不同的语句。

**适配Mysql及Oracle数据库案例**：

**1、** 添加配置；

```java
    <!--数据库厂商标识-->
    <!--DB_VENDOR: 使用MyBatis提供的VendorDatabaseIdProvider解析数据库厂商标识。也可以实现DatabaseIdProvider接口来自定义-->
    <databaseIdProvider type="DB_VENDOR">
        <!--添加两个数据库厂商别名-->
        <!--name：数据库厂商标识-->
        <!--value：为标识起一个别名，方便SQL语句使用databaseId属性引用-->
        <property name="Oracle" value="oracle"/>
        <property name="MySQL" value="mysql"/>
    </databaseIdProvider>
```

**1、** xml中指定databaseId为响应的数据库；

```xml
<mapper namespace="org.pearl.mybatis.demo.dao.UserMapper">
    <select id="selectOneById" resultType="org.pearl.mybatis.demo.pojo.entity.User" databaseId="mysql">
    select * from base_user where user_id ={
     id}
  </select>
</mapper>
```

**1、** 测试，查看当前的数据库厂商；

```java
public class Test001 {
    public static void main(String[] args) throws IOException {
        // 根据xml配置文件（全局配置文件）创建一个SqlSessionFactory对象
        String resource = "mybatis-config.xml";
        InputStream inputStream = Resources.getResourceAsStream(resource);
        SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
        String databaseId = sqlSessionFactory.getConfiguration().getDatabaseId();
        System.out.println(databaseId+"数据库");
        }
}
```

**匹配规则**:

- 如果没有配置databaseIdProvider标签，那么databaseId=null
- 如果配置了databaseIdProvider标签，使用标签配置的name去匹配数据库信息，匹配上设置databaseId=配置指定的值，否则依旧为null
- 如果databaseId不为null，他只会找到配置databaseId的sql语句
- MyBatis 会加载不带 databaseId 属性和带有匹配当前数据库databaseId 属性的所有语句。如果同时找到带有 databaseId 和不带databaseId 的相同语句，则后者会被舍弃。

### 11. 映射器（mappers）

既然MyBatis 的行为已经由上述元素配置完了，我们现在就要来定义 SQL 映射语句了。 但首先，我们需要告诉 MyBatis 到哪里去找到这些语句。 在自动查找资源方面，Java 并没有提供一个很好的解决方案，所以最好的办法是直接告诉 MyBatis 到哪里去找映射文件。 你可以使用相对于类路径的资源引用，或完全限定资源定位符（包括 file:/// 形式的 URL），或类名和包名等。例如：

```xml
<!-- 使用相对于类路径的资源引用 -->
<mappers>
  <mapper resource="org/mybatis/builder/AuthorMapper.xml"/>
  <mapper resource="org/mybatis/builder/BlogMapper.xml"/>
  <mapper resource="org/mybatis/builder/PostMapper.xml"/>
</mappers>
```

```xml
<!-- 使用完全限定资源定位符（URL） -->
<mappers>
  <mapper url="file:///var/mappers/AuthorMapper.xml"/>
  <mapper url="file:///var/mappers/BlogMapper.xml"/>
  <mapper url="file:///var/mappers/PostMapper.xml"/>
</mappers>
```

```xml
<!-- 使用映射器接口实现类的完全限定类名 -->
<mappers>
  <mapper class="org.mybatis.builder.AuthorMapper"/>
  <mapper class="org.mybatis.builder.BlogMapper"/>
  <mapper class="org.mybatis.builder.PostMapper"/>
</mappers>
```

```xml
<!-- 将包内的映射器接口实现全部注册为映射器 -->
<mappers>
  <package name="org.mybatis.builder"/>
</mappers>
```
