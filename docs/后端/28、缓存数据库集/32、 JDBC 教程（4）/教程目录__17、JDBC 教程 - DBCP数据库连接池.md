# 17、JDBC 教程 - DBCP数据库连接池
- 来源：https://ddkk.com/zhuanlan/db/jdbc/4/17.html
- 分类：缓存数据库
- 分组：教程目录
## JDBC连接池

### DBCP数据库连接池

#### 1. DBCP简介

DBCP是Apache软件基金组织下的开源连接池实现，该连接池依赖该组织下的另一个开源系统：Common-pool。如果需要使用该连接池实现，应在系统中添加如下两个jar文件：

- Commons-dbcp.jar：连接池的实现
- Commons-pool.jar：连接池实现的依赖库

Tomcat的连接池正是采用该连接池来实现的。该数据库连接池既可以与应用服务器整合使用，也可以有应用程序独立使用。

#### 2. 使用DBCP的步骤

**1、** 加入jar包依赖(两个)：Commons-dbcp.jar、Commons-pool.jar；

**2、** 创建数据库连接池实例(数据源)；

**3、** 为数据源实例指定必须的属性(指定可选属性)；

**4、** 从数据源中获取数据库连接；

#### 3. 一个简易的测试范例

##### pom.xml

```java
<!-- DBCP依赖 -->
<dependency>
    <groupId>commons-dbcp</groupId>
    <artifactId>commons-dbcp</artifactId>
    <version>1.4</version>
</dependency>
<dependency>
    <groupId>commons-pool</groupId>
    <artifactId>commons-pool</artifactId>
    <version>1.6</version>
</dependency>
```

##### 测试类：

```java
package com.tqazy.test;
import org.apache.commons.dbcp.BasicDataSource;
import org.junit.Test;
import java.sql.Connection;
import java.sql.SQLException;
public class TestDbcp {
    @Test
    public void testDbcp() throws SQLException {
        // 1. 创建DBCP数据源实例
        BasicDataSource dataSource = new BasicDataSource();
        // 2. 为数据源实例指定必须的属性
        dataSource.setDriverClassName("com.mysql.jdbc.Driver");
        dataSource.setUrl("jdbc:mysql://localhost:3306/test?useUnicode=true&characterEncoding=UTF-8");
        dataSource.setUsername("root");
        dataSource.setPassword("admin123");
        // 3. 从数据源中获取数据库连接
        Connection connection = dataSource.getConnection();
        System.out.println(connection);
    }
}
```

##### 结果：

#### 4. 设置数据源的可选属性

下面代码是在上述测试代码的第2步之后的

此处的属性参数和上面的必须的属性参数都可以通过读取Porperties文件的方式传入

```java
// 连接池初始化时默认创建的连接数
// (举例：此处设置10，在连接池被创建完毕后，连接池中将会有10个空闲连接存在)
dataSource.setInitialSize(10);
// 指定最大活动连接数：在不释放的情况下可以获取的最大活动连接数,如果是负数表示无限制
// (举例：此处设置20，也就是说此连接池最多提供20个连接被使用，如果同时来了21个请求连接，将会有1个请求需要排队等待连接释放)
dataSource.setMaxActive(20);
// 指定最大空闲连接数：在数据库连接池中保存的最多的空闲连接数量
// (举例：这里设置10，假设连接池中已经有3个正被使用的连接，此时还剩下的存在的空闲连接最多不能超过10个)
dataSource.setMaxIdle(10);
// 指定最小空闲连接数：在数据库连接池中保存的最少的空闲连接数量
// (举例：这里设置5，假设连接池中已经有10个正被使用的连接，此时最少还要再有5个空闲连接的存在)
dataSource.setMinIdle(5);
// 指定最大的等待时间：等待数据库连接池为请求分配连接的最长等待时间，超过这个时间请求将会抛异常，单位：毫秒
// (举例：此处等待60s)
dataSource.setMaxWait(60000);
// 指定连接超时时间，默认300s(当一个连接在此时间范围内都没被使用过，那么此连接便是超时连接，在ResultSet中被使用时在这里算被使用)
dataSource.setRemoveAbandonedTimeout(300);
// 指定是否开启收回超时连接，如果开启，那么当当前的活动连接数即将达到最大活动连接数(默认当前连接数=最大连接数-2)时，将会启动回收机制，回收超时连接
// 如果开启，如果连接被认为泄露时，也会被收回。触发机制：当前空闲连接数<2 and (当前活动连接数 > 最大活动连接数-3)
dataSource.setRemoveAbandoned(true);
// 指定将是否开启打印。如果是true，在回收事件后，在log中打印出回收Connection的错误信息，包括在哪个地方用了Connection却忘记关闭了，在调试的时候很有用
dataSource.setLogAbandoned(true);
```

#### 5. 使用数据源工厂获取数据源

此时我们把刚才的参数全部写在一个properties文件里，数据源工厂类`BasicDataSourceFactory`直接从properties文件里读取参数，然后我们就可以得到一个数据源了

**注意**：此时我们在properties里的参数名就不是可以随意命名的了，必要按照指定的参数名命名(参数名参考，就是上面的set方法名用驼峰命名法反推出属性名)，否则将无法被读到。

**范例**：

##### dbcp.properties

```java
driverClassName=com.mysql.jdbc.Driver
url=jdbc:mysql://localhost:3306/test?useUnicode=true&characterEncoding=UTF-8
username=root
password=admin123
# 连接池初始化时默认创建的连接数
initialSize=10
# 指定最大活动连接数
maxActive=20
# 指定最大空闲连接数
maxIdle=10
# 指定最小空闲连接数
minIdle=5
# 指定最大的等待时间
maxWait=60000
# 指定超时时间
removeAbandonedTimeout=300
# 指定是否开启超时回收机制
removeAbandoned=true
# 指定是否开启打印异常日志
logAbandoned=true
```

##### 测试方法

此方法包含在测试类`TestDbcp`里

```java
@Test
public void testDbcpWithDataSourceFactory() throws Exception {
    // 1. 创建一个Properties实例
    Properties properties = new Properties();
    // 2. 读取配置文件转变为输入流
    InputStream inputStream = TestDbcp.class.getClassLoader().getResourceAsStream("dbcp.properties");
    // 3. 将输入流注入到properties实例中
    properties.load(inputStream);
    // 4. 调用BasicDataSourceFactory类的createDataSource()方法获取数据源DataSource实例
    DataSource dataSource = BasicDataSourceFactory.createDataSource(properties);
    // 输出获取到的连接和设置的数据源属性
    System.out.println(dataSource.getConnection());
    BasicDataSource basicDataSource = (BasicDataSource) dataSource;
    System.out.println(basicDataSource.getInitialSize());
    System.out.println(basicDataSource.getMaxActive());
    System.out.println(basicDataSource.getMaxIdle());
    System.out.println(basicDataSource.getMinIdle());
    System.out.println(basicDataSource.getMaxWait());
}
```

##### 结果
