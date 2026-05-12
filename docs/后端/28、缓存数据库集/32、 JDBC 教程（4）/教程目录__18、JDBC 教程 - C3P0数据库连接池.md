# 18、JDBC 教程 - C3P0数据库连接池
- 来源：https://ddkk.com/zhuanlan/db/jdbc/4/18.html
- 分类：缓存数据库
- 分组：教程目录
## JDBC连接池

### C3P0数据库连接池

#### 1. DBCP简介

C3P0是一个开源的JDBC连接池，它实现了数据源和JNDI绑定，支持JDBC3规范和JDBC2的标准扩展。目前使用它的开源项目有Hibernate、Spring等。如果需要使用该连接池实现，应在系统中添加如下一个jar文件：

- c3p0.jar：连接池的实现(比如：c3p0-0.9.1.2.jar)

#### 2. 使用C3P0的步骤

**1、** 加入jar包：c3p0.jar；

**2、** 创建C3P0数据源：newComboPooledDataSource();；

**3、** 设置数据源必须的属性；

**4、** 从数据源获取连接；

#### 3. 一个简易的测试范例

##### pom.xml

```java
<dependency>
    <groupId>c3p0</groupId>
    <artifactId>c3p0</artifactId>
    <version>0.9.1.2</version>
</dependency>
```

##### 测试类

```java
package com.tqazy.test;
import com.mchange.v2.c3p0.ComboPooledDataSource;
import org.junit.Test;
import java.sql.Connection;
public class TestC3p0 {
    @Test
    public void testC3p0() throws Exception {
        // 1. 创建C3P0数据源
        ComboPooledDataSource cpds = new ComboPooledDataSource();
        // 2. 设置数据源必须的属性
        cpds.setDriverClass("com.mysql.jdbc.Driver");
        cpds.setJdbcUrl("jdbc:mysql://localhost:3306/test?useUnicode=true&characterEncoding=UTF-8");
        cpds.setUser("root");
        cpds.setPassword("admin123");
        // 3. 从数据源获取连接
        Connection connection = cpds.getConnection();
        // 打印连接
        System.out.println(connection.getClass());
    }
}
```

##### 结果

#### 4. 读取配置文件创建数据源

我们是否可以像DBCP一样从文件中读取配置信息呢？

当然可以，C3P0是从xml中读取的配置文件，我们可以在resources资源文件夹下创建文件[c3p0-config.xml]文件，文件名不可变。

步骤：

**1、** 创建c3p0-config.xml文件；

**2、** 创建ComboPooledDataSource实例：`DataSourcedataSource=newComboPooledDataSource("helloc3p0");`；

**3、** 从`DataSource`实例中获取数据库连接；

下面是我的配置文件代码：

最上面的`name="helloc3p0"`是表示这个配置块的名字为`helloc3p0`。我们可以配置不同的配置快，然后在引用时选择。

上面的四个配置表示的是必须配置的属性，其他的可选配置的全部配置在第5小节可查询

```java
<c3p0-config>
    <named-config name="helloc3p0">
        <!-- 指定连接数据源的基本属性 -->
        <property name="driverClassName">com.mysql.jdbc.Driver</property>
        <property name="jdbcUrl">jdbc:mysql://localhost:3306/test</property>
        <property name="user">root</property>
        <property name="password">admin123</property>
        <!-- 当C3P0数据源中的连接池耗尽时，一次同时获取的连接数 -->
        <property name="acquireIncrement">3</property>
        <!-- 初始化数据库连接池时连接的数量 -->
        <property name="initialPoolSize">5</property>
        <!-- 数据库连接池中的最小的数据库连接数 -->
        <property name="minPoolSize">5</property>
        <!-- 数据库连接池中的最大的数据库连接数 -->
        <property name="maxPoolSize">13</property>
        <!-- C3P0数据库连接池可以维护的Statement的个数 -->
        <property name="maxStatements">20</property>
        <!-- 每一个连接同时可以使用的Statement对象个数 -->
        <property name="maxStatementsPerConnection">5</property>
    </named-config>
</c3p0-config>
```

测试方法

其实很简单，我们在正常创建C3P0实例时，选择重载方法，传入我们配置的配置块的名字，即可自动读取并使用

```java
@Test
public void testC3p0WithConfigFile() throws SQLException {
    // helloc3p0是配置文件里named-config的name的值
    DataSource dataSource = new ComboPooledDataSource("helloc3p0");
    System.out.println(dataSource.getConnection().getClass());
    ComboPooledDataSource comboPooledDataSource = (ComboPooledDataSource) dataSource;
    System.out.println(comboPooledDataSource.getAcquireIncrement());
    System.out.println(comboPooledDataSource.getMaxPoolSize());
}
```

结果

#### 5. C3P0属性说明

这里是图片，下面有表格(一模一样)，可以复制Ctrl+F查询意思

声明：[点击此处查询本数据截图来源][Link1]

**表格**：

属性名
注释

acquireIncrement
默认值为3，表示当C3P0数据源中的连接池耗尽时，一次同时获取的连接数。

acquireRetryAttempts
默认值为30，表示从数据库中获取新连接失败后，重复尝试的次数。如果将其设置为0或者小于0的数值，则C3P0将一直进行尝试获取连接。

acquireRetryDelay
默认值为1000，单位为毫秒，表示C3P0相邻两次获取连接的时间间隔。

autoCommitOnClose
默认为false，表示在连接关闭时，将所有未提交的操作回滚。设置为true，则在连接关闭时，会将操作进行提交。

automaticTestTable
默认为null，设置该属性后，C3P0会自动创建一张名为该属性值的空表，专门是C3P0用来测试使用者所获取的数据库连接，使用者是没法对该表进行操作的。同时该属性设置后，则忽略preferredTestQuery属性。

preferredTestQuery
默认为null，表示所有连接测试都要执行的测试语句，这一属性的设置能够显著地提高测试速度。注意：该测试语句里的表必须在数据源初始化的时候就已经存在了。

breakAfterAcquireFailure
默认为false，表示在获取数据库连接失败时，会引起所有等待连接池获取连接的线程抛出异常，但是数据源仍然保持有效，并且在下次调用getConnection时继续尝试获取连接。设置为true，表示在获取数据库连接失败时，重复尝试acquireRetryAttempts指定的次数，此时再失败，则声明数据源已经断开并且永久关闭。

driverClass
默认为null，值为全类名，该类是提供数据库连接的JDBC驱动类。默认C3P0会去检测其是否为JDBC驱动程序的实例，如果想跳过这步验证，可设置forceUseNamedDriverClass属性。

forceUseNamedDriverClass
默认为false，设置为true，表示强制指定driverClass属性指定的类为JDBC驱动程序的实例，而让C3P0不再做这一步检测。

dataSourceName
默认为C3P0指定的标识符，表示数据源的名称，便于我们追踪和查找数据源。

jdbcUrl
默认为null，表示数据库的JDBC URL，用来获取数据库连接。

user
默认为null，表示使用数据源时需要的用户名。

password
默认为null，表示使用数据源时需要的密码。

minPoolSize
默认为3，表示连接池中任何时候可以存放的连接最小数量。

maxPoolSize
默认为15，表示连接池中任何时候可以存放的连接最大数量。

initialPoolSize
默认为3，表示初始化连接池时获取的连接个数。该数值在miniPoolSize和maxPoolSize之间。

testConnectionOnCheckin
默认为false，设置为true，表示向连接池中放入连接时测试连接的有效性。

testConnectionOnCheckout
默认为false，设置为true，表示从连接池中取出连接时测试连接的有效性，因为此操作会降低性能，建议使用idleConnectionTestPeriod或者automaticTestTable来提升连接测试的性能。

checkoutTimeout
默认为0，单位为毫秒，表示当连接池中连接用完时，客户端调用getConnection获取连接等待的时间，如果超时，则抛出SQLException异常。特殊值0表示无限期等待。

connectionCustomizerClassName
默认为null，值为全类名，该类必须实现ConnectionCustomizer接口，用来管理Connection的生命周期，例如获取连接时设置Connection的隔离级别，Connection丢弃的时候进行资源关闭等等。一般不配置该属性。

connectionTesterClassName
默认为com.mchange.v2.c3p0.impl.DefaultConnectionTester，值为全类名，该类必须实现ConnectionTester或者QueryConnectionTester，用来测试数据库的连接。

debugUnreturnedConnectionStackTraces
默认为false，只可在debug下设置该属性为true，因为该设置会降低从连接池中获取连接的性能。设置为true，并且UnreturnedConnectionTimeOut设置为非0自然数，则C3P0会追踪所有从连接池中取出的连接，对于超时未归还的，会打印追踪信息。该设置就是为了测试应用对数据库的连接是否忘记归还，从而导致从C3P0连接池中取出的连接越来越多，最终池中连接被耗尽。

extensions
默认为空的Map，用来为C3P0设置自己的配置信息，一般是用来管理Connection生命周期(ConnectionCustomizer)的时候使用。

factoryClassLocation
默认为null，指定C3P0.libraries的路径，如果本地可以获取，则该值设置为null。

forceIgnoreUnresolvedTransactions
默认为false，强烈不推荐，设置为true，将导致出现奇怪的bug出现。

idleConnectionTestPeriod
默认为0，单位为秒，设置为非0自然数，表示每隔指定秒去检测一次连接池中的空闲连接。

maxConnectionAge
默认为0，单位为秒，表示连接超过该属性指定的时间，则被销毁掉，并且从连接池中移除，0则表示没有时间限制。

maxIdleTime
默认为0，单位为秒，表示在连接池中未被使用的连接最长存活多久不被移除。

maxIdleTimeExcessConnections
默认为0，单位为秒，表示在连接池中未被使用的、超出miniPoolSize的那些连接最长存活多久不被移除。

maxStatements
默认为0，表示JDBC的标准参数，控制数据源内缓存的PreparedStatements数量。和maxStatementsPerConnection配合使用，如果二者都为0，则statement不进行缓存。如果该参数为0，而maxStatementsPerConnection为非零自然数，则表示每一个连接缓存的PreparedStatements数量。

maxStatementsPerConnection
默认为0，表示每一个连接缓存的PreparedStatements数量。
