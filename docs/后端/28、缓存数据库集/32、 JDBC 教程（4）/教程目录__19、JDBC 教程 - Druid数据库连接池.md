# 19、JDBC 教程 - Druid数据库连接池
- 来源：https://ddkk.com/zhuanlan/db/jdbc/4/19.html
- 分类：缓存数据库
- 分组：教程目录
## JDBC连接池

### Druid数据库连接池

#### 1. Druid简介

- Druid首先是一个数据库连接池。Druid是目前最好的数据库连接池，在功能、性能、扩展性方面，都超过其他数据库连接池，包括DBCP、C3P0、BoneCP、Proxool、JBoss DataSource。
- Druid已经在阿里巴巴部署了超过600个应用，经过一年多生产环境大规模部署的严苛考验。
- Druid是一个JDBC组件，它包括三个部分：

**1、** 基于Filter－Chain模式的插件体系；

**2、** DruidDataSource高效可管理的数据库连接池；

**3、** SQLParser；

- Druid支持所有JDBC兼容的数据库，包括Oracle、MySql、Derby、Postgresql、SQL Server、H2等等，并且Druid针对Oracle和MySql做了特别优化，比如Oracle的PS Cache内存占用优化，MySql的ping检测优化。
- 通过Druid提供的监控功能，监控SQL的执行时间、ResultSet持有时间、返回行数、更新行数、错误次数、错误堆栈信息，可以清楚知道连接池和SQL的工作情况，能够详细统计SQL的执行性能，这对于线上分析数据库访问性能有帮助。
- DruidDataSource大部分属性都是参考DBCP的，如果你原来就是使用DBCP，迁移是十分方便的。

**Druid的技术文档地址**：[点击此处](https://github.com/alibaba/druid/wiki/%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98)

#### 2. Druid可以做什么?

- 替换DBCP和C3P0。Druid提供了一个高效、功能强大、可扩展性好的数据库连接池。
- 可以监控数据库访问性能，Druid内置提供了一个功能强大的StatFilter插件，能够详细统计SQL的执行性能，这对于线上分析数据库访问性能有帮助。
- 数据库密码加密。直接把数据库密码写在配置文件中，这是不好的行为，容易导致安全问题。DruidDriver和DruidDataSource都支持PasswordCallback。
- SQL执行日志，Druid提供了不同的LogFilter，能够支持Common-Logging、Log4j和JdkLog，你可以按需要选择相应的LogFilter，监控你应用的数据库访问情况。
- 扩展JDBC，如果你要对JDBC层有编程的需求，可以通过Druid提供的Filter机制，很方便编写JDBC层的扩展插件。

#### 3. 如何快速使用druid

其实快速使用的方法和前面那两个连接池一样简单

步骤：

**1、** 加入druid.jar依赖包；

**2、** 创建数据源实例：`DruidDataSource`；

**3、** 配置数据源必须的属性；

**4、** 获取连接；

#### 4. 一个简易的测试范例

##### pom.xml

```java
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>druid</artifactId>
    <version>1.1.12</version>
</dependency>
```

##### 测试类

```java
package com.tqazy.test;
import com.alibaba.druid.pool.DruidDataSource;
import org.junit.Test;
import java.sql.Connection;
import java.sql.SQLException;
public class TestDruid {
    @Test
    public void testDruid() throws SQLException {
        // 1. 创建DruidDataSource数据源
        DruidDataSource druidDataSource = new DruidDataSource();
        // 2. 配置数据源必须的属性
        druidDataSource.setDriverClassName("com.mysql.jdbc.Driver");
        druidDataSource.setUrl("jdbc:mysql://localhost:3306/test?useUnicode=true&characterEncoding=UTF-8");
        druidDataSource.setUsername("root");
        druidDataSource.setPassword("admin123");
        // 3. 获取连接
        Connection connection = druidDataSource.getConnection();
        System.out.println(connection.getClass());
    }
}
```

##### 结果

是不是感觉Druid也很简单？嗯，确实应用起来很简单，但是复杂的功能还在后面呢，需要结合实际场景一一讲解。

#### 5. 如何结合配置文件获取数据源

这和dbcp的方式很像

##### 配置文件：druid.properties

```java
driverClassName=com.mysql.jdbc.Driver
url=jdbc:mysql://localhost:3306/test?useUnicode=true&characterEncoding=UTF-8
username=root
password=admin123
```

##### 测试方法

属于`TestDruid`测试类

```java
@Test
public void testDruidWithConfig() throws Exception {
    Properties properties = new Properties();
    InputStream inputStream = TestDruid.class.getClassLoader().getResourceAsStream("druid.properties");
    properties.load(inputStream);
    DataSource dataSource = DruidDataSourceFactory.createDataSource(properties);
    Connection connection = dataSource.getConnection();
    System.out.println(connection.getClass());
}
```

##### 执行结果

是不是发现和dbcp的方法一样？没错，druid本来就大量借鉴了dbcp的方式

#### 6. 配置属性列表

配置
缺省值
说明

name

配置这个属性的意义在于，如果存在多个数据源，监控的时候可以通过名字来区分开来。如果没有配置，将会生成一个名字，格式是：“DataSource-” + System.identityHashCode(this). 另外配置此属性至少在1.0.5版本中是不起作用的，强行设置name会出错。详情-点此处。

url

连接数据库的url，不同数据库不一样。例如：
mysql : jdbc:mysql://10.20.153.104:3306/druid2
oracle : jdbc:oracle:thin:@10.20.149.85:1521:ocnauto

username

连接数据库的用户名

password

连接数据库的密码。如果你不希望密码直接写在配置文件中，可以使用ConfigFilter。详细看这里

driverClassName
根据url自动识别
这一项可配可不配，如果不配置druid会根据url自动识别dbType，然后选择相应的driverClassName

initialSize
0
初始化时建立物理连接的个数。初始化发生在显示调用init方法，或者第一次getConnection时

maxActive
8
最大连接池数量

maxIdle
8
已经不再使用，配置了也没效果

minIdle

最小连接池数量

maxWait

获取连接时最大等待时间，单位毫秒。配置了maxWait之后，缺省启用公平锁，并发效率会有所下降，如果需要可以通过配置useUnfairLock属性为true使用非公平锁。

poolPreparedStatements
false
是否缓存preparedStatement，也就是PSCache。PSCache对支持游标的数据库性能提升巨大，比如说oracle。在mysql下建议关闭。

maxPoolPreparedStatementPerConnectionSize
-1
要启用PSCache，必须配置大于0，当大于0时，poolPreparedStatements自动触发修改为true。在Druid中，不会存在Oracle下PSCache占用内存过多的问题，可以把这个数值配置大一些，比如说100

validationQuery

用来检测连接是否有效的sql，要求是一个查询语句，常用select ‘x’。如果validationQuery为null，testOnBorrow、testOnReturn、testWhileIdle都不会起作用。

validationQueryTimeout

单位：秒，检测连接是否有效的超时时间。底层调用jdbc Statement对象的void setQueryTimeout(int seconds)方法

testOnBorrow
true
申请连接时执行validationQuery检测连接是否有效，做了这个配置会降低性能。

testOnReturn
false
归还连接时执行validationQuery检测连接是否有效，做了这个配置会降低性能。

testWhileIdle
false
建议配置为true，不影响性能，并且保证安全性。申请连接的时候检测，如果空闲时间大于timeBetweenEvictionRunsMillis，执行validationQuery检测连接是否有效。

keepAlive
false (1.0.28)
连接池中的minIdle数量以内的连接，空闲时间超过minEvictableIdleTimeMillis，则会执行keepAlive操作。

timeBetweenEvictionRunsMillis
1分钟(1.0.14)
有两个含义：
1) Destroy线程会检测连接的间隔时间，如果连接空闲时间大于等于minEvictableIdleTimeMillis则关闭物理连接。
2) testWhileIdle的判断依据，详细看testWhileIdle属性的说明

numTestsPerEvictionRun
30分钟(1.0.14)
不再使用，一个DruidDataSource只支持一个EvictionRun

minEvictableIdleTimeMillis

连接保持空闲而不被驱逐的最小时间

connectionInitSqls

物理连接初始化的时候执行的sql

exceptionSorter

根据dbType自动识别 当数据库抛出一些不可恢复的异常时，抛弃连接

filters

属性类型是字符串，通过别名的方式配置扩展插件，常用的插件有：
监控统计用的filter:stat
日志用的filter:log4j
防御sql注入的filter:wall

proxyFilters

类型是List，如果同时配置了filters和proxyFilters，是组合关系，并非替换关系

这里我目前仅作快速使用的介绍，等到后面开始使用时，再逐渐补充使用心得
