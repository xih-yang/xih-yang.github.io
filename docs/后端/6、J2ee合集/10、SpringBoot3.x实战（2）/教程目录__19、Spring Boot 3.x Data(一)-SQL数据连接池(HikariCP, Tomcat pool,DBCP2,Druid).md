# 19、Spring Boot 3.x Data(一)-SQL数据连接池(HikariCP, Tomcat pool,DBCP2,Druid)
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/9/19.html
- 分类：Spring Boot 3.x 实战
- 分组：教程目录
数据库连接池负责分配、管理和释放数据库连接，它允许应用程序重复使用一个现有的数据库连接，而不是再重新建立一个；释放空闲时间超过最大空闲时间的数据库连接来避免因为没有释放数据库连接而引起的数据库连接遗漏。这项技术能明显提高对数据库操作的性能。

Spring Boot 3.x支持以下连接池：

- HikariCP
- Tomcat pooling Datasource
- Commons DBCP2
- Oracle UCP & OracleDataSource
- Spring Framework’s SimpleDriverDataSource
- H2 JdbcDataSource
- PostgreSQL
- PGSimpleDataSource

默认情况下Spring Boot有一套默认的算法来选择连接次：

**1、** 如果`HikariCP`可用，默认直接选择它；

**2、** 否则，如果`Tomcat`连接池可用,就使用它；

**3、** 否则，如果`CommonsDBCP2`可用，就使用它；

**4、** 如果`HikariCP`、`Tomcat`和`DBCP2`不可用，如果`OracleUCP`可用，就使用它；

如果使用`spring-boot-starter-jdbc`或`spring-boot-starter-data-jpa` Starter，将自动获得对`HikariCP`的依赖。

如果想手动指定某个数据源修改默认的配置，可以使用`spring.datasource.type`属性配置。

例如：

```java
spring:
  datasource:
    type: org.springframework.jdbc.datasource.SingleConnectionDataSource
```

## 一、HikariCP

### 什么是HikariCP

快速、简单、可靠。`HikariCP`是一个“零开销”的生产`JDBC`连接池。这个库大约是`130Kb`，非常轻。

与其他`JDBC`连接池操作相比，`HikariCP`连接池`getConnection()`操作的数量很少。对包装`Connection`、`Statement`等的“委托”的优化带来了大量的性能提升。

HikariCP包含许多单独的微优化，它们几乎无法测量，但结合在一起可以提高整体性能。其中一些优化可以在数百万次调用中以毫秒为单位进行计算。

- **FastList 替代ArrayList:**

**1、** 避免`ArrayList`每次`get()`调用都要进行范围检查，而`FastList`不需要，在能确保范围的合法性的情况下，可以省去范围检查的.开销；

**2、** 避免`ArrayList`调用`remove(Object)`时的从头到尾的扫描，然而`JDBC`编程中的常见模式是在使用完语句后立即关闭语句或者以相反的顺序打开对于这些情况，从尾部开始的扫描将会表现得更好,FastList就是使用次方式；

- **ConcurrentBag**

HikariCP包含一个自定义无锁集合，称为ConcurrentBag。这个想法是从c# .net的ConcurrentBag类中借鉴来的，但是内部实现完全不同。 ConcurrentBag提供…
- 无锁设计
- ThreadLocal缓存
- Queue-stealing
- 直接 hand-off 优化

支持快速插入和删除，特别是在同一线程既添加又删除项时，提高并发读写的效率。这将导致高度的并发性、极低的延迟和最小化错误共享的发生。

- **CPU的时间片算法进行优化**

尽可能在一个时间片里面完成各种操作

### Spring Boot 3.x集成HikariCP

**1、****引入依赖**；

```java
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jdbc</artifactId>
        </dependency>
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <scope>runtime</scope>
        </dependency>
```

`spring-boot-starter-data-jdbc`模块已经包含`HikariCP`依赖，并且自动配置成默认连接池。还提供了`spring.datasource.hikari.*`的连接池属性配置。

**2.启动**

如下常用的配置：

```java
spring:
  datasource:
   数据库驱动完整类名
    driver-class-name: com.mysql.jdbc.Driver
   数据库连接url
    url: jdbc:mysql://127.0.0.1:3306/spring-boot-data-learn
   数据库用户名
    username: root
   数据库密码
    password: 123456
    hikari:
     连接超时时间：毫秒，小于250毫秒，否则被重置为默认值30秒
      connection-timeout: 2000
     最小空闲连接，默认值10，小于0或大于maximum-pool-size，都会重置为maximum-pool-size
      minimum-idle: 5
     最大连接数，小于等于0会被重置为默认值10；大于零小于1会被重置为minimum-idle的值
      maximum-pool-size: 20
     空闲连接最大存活时间，默认值600000（10分钟），大于等于max-lifetime且max-lifetime>0，会被重置为0；不等于0且小于10秒，会被重置为10秒。
      idle-timeout: 200000
     连接池返回的连接默认自动提交，默认只 true
      auto-commit: true
      连接最大存活时间，不等于0且小于30秒，会被重置为默认值30分钟.设置应该比mysql设置的超时时间短
      max-lifetime: 1800000
     用于测试连接是否可用的查询语句
      connection-test-query: select 1
logging:
  level:
    org.springframework.jdbc.core.JdbcTemplate: DEBUG
```

启动应用看到如下日志，`HikariCP`默认自动配置成功：

### HikariCP详细配置

详细的配置如下表[来源](https://www.cnblogs.com/goloving/p/14884802.html)：

## 二、Tomcat数据连接池

### 什么是Tomcat连接池

Tomcat 在 7.0 以前的版本都是使用`commons-dbc`p做为连接池的实现，但是`DBCP`存在一些问题：

- 1.DBCP 是单线程的，为了保证线程安全会锁整个连接池
- 2.DBCP 性能不佳
- 3.DBCP 太复杂，超过60个类，发展滞后

Tomcat 从 7.0 开始引入一个新的模块:`Tomcat Jdbc Pool` 近乎兼容 `DBCP`，性能更高：

- 1.异步方式获取连接
- 2.Tomcat Jdbc Pool是Tomcat的一个模块，日志框架基于Tomcat-Juli
- 3.使用 javax.sql.PooledConnection 接口获取连接
- 4.支持高并发应用环境
- 5.超简单，核心文件只有8个，比 c3p0 还少
- 6.更好的空闲连接处理机制
- 7.支持 JMX
- 8.支持 XA Connection
- 9.Tomcat Jdbc Pool 可在 Tomcat 中直接使用，也可以在独立的应用中使用。

### Spring Boot 3集成Tomcat连接池

**引入依赖**

```java
       <dependency>
            <groupId>org.apache.tomcat</groupId>
            <artifactId>tomcat-jdbc</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jdbc</artifactId>
        </dependency>
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <scope>runtime</scope>
        </dependency>
```

**属性配置**

```java
spring:
  datasource:
   数据库驱动完整类名
    driver-class-name: com.mysql.jdbc.Driver
   数据库连接url
    url: jdbc:mysql://127.0.0.1:3306/spring-boot-data-learn
   数据库用户名
    username: root
   数据库密码
    password: 123456
    type: org.apache.tomcat.jdbc.pool.DataSource
    tomcat:
     连接池启动时创建的初始连接数 默认10
      initial-size: 10
     最大活动连接数：连接池同一时间可以分配的最大活动连接数 默认100 配置小于0 表示不限制
      max-active: 100
     最大空闲连接数 默认值100 配置小于0 不限制
      max-idle: 100
     最小空闲连接数，低于这个数量创建新连接，设置为0不创建,默认10 
      min-idle: 10
     最大等待时间 当没可用连接时，连接池等待连接被归还的最大事件，超过时间抛异常。设置-1 无限等待
      max-wait: 30000
```

`spring.datasource.type:org.apache.tomcat.jdbc.pool.DataSource`手动指定连接池类型为`Tomcat`，因为没排除默认的`HikariCP`。Spring Boot还提供了`spring.datasource.tomcat.*`的属性来配置连接池。

**启动测试**

```java
 @Bean
    public CommandLineRunner pool(DataSource dataSource) {
        return new CommandLineRunner() {
            @Override
            public void run(String... args) throws Exception {
                logger.info("dataSource:" + dataSource.toString());
            }
        };
    }
```

### 详细配置

[数据来源](https://blog.csdn.net/huangjianghong6816/article/details/78270614)

## 三、Commons DBCP2

### 什么是Commons DBCP2

DBCP 2基于Commons Pool 2，与DBCP 1.x相比，它提供了更高的性能、对JMX的支持以及许多其他新特性。

### Spring Boot 3集成DBCP2连接池

**引入依赖**

```java
        <dependency>
            <groupId>org.apache.commons</groupId>
            <artifactId>commons-dbcp2</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jdbc</artifactId>
        </dependency>
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <scope>runtime</scope>
        </dependency>
```

**属性配置**

```java
spring:
  datasource:
   数据库驱动完整类名
    driver-class-name: com.mysql.jdbc.Driver
   数据库连接url
    url: jdbc:mysql://127.0.0.1:3306/spring-boot-data-learn
   数据库用户名
    username: root
   数据库密码
    password: 123456
    type: org.apache.commons.dbcp2.BasicDataSource
    dbcp2:
     最大等待时间:当没有可用连接时,连接池等待连接被归还的最大时间(以毫秒计数),超过时间则抛出异常,如果设置为-1表示无限等待
      max-wait-millis: 30000
#最大空闲连接:连接池中容许保持空闲状态的最大连接数量,超过的空闲连接将被释放,如果设置为负数表示不限制
      min-idle: 5
       初始化连接:连接池启动时创建的初始化连接数量 默认0
      initial-size: 5
     SQL查询,用来验证从连接池取出的连接
      validation-query: select 1
```

`spring.datasource.type:org.apache.commons.dbcp2.BasicDataSource`手动指定连接池类型为`Tomcat`，因为没排除默认的`HikariCP`。Spring Boot还提供了`spring.datasource.dbcp2.*`的属性来配置连接池。

**测试**

```java
    @Bean
    public CommandLineRunner pool(DataSource dataSource) {
        return new CommandLineRunner() {
            @Override
            public void run(String... args) throws Exception {
                logger.info("dataSource:" + dataSource.toString());
            }
        };
    }
```

### 详细配置

[数据来源](https://blog.csdn.net/initphp/article/details/8255793)

## 四、Druid

### 什么是Druid

来自官方的定义：Druid是Java语言中最好的数据库连接池。Druid能够提供强大的监控和扩展功能。[github](https://github.com/alibaba/druid)

### Spring Boot 3 集成 Druid

**项目依赖**

在Spring Boot 项目中加入`druid-spring-boot-starter`依赖

```xml
<dependency>
   <groupId>com.alibaba</groupId>
   <artifactId>druid-spring-boot-starter</artifactId>
   <version>1.2.9</version>
</dependency>
<dependency>
  <groupId>org.springframework.boot</groupId>
   <artifactId>spring-boot-starter-data-jdbc</artifactId>
</dependency>
<dependency>
   <groupId>mysql</groupId>
   <artifactId>mysql-connector-java</artifactId>
   <scope>runtime</scope>
</dependency>
```

**属性配置**

```java
spring:
  datasource:
   数据库驱动完整类名
    driver-class-name: com.mysql.jdbc.Driver
   数据库连接url
    url: jdbc:mysql://127.0.0.1:3306/spring-boot-data-learn
   数据库用户名
    username: root
   数据库密码
    password: 123456
    druid:
      initial-size: 10
      max-active: 10
      min-idle: 5
      max-wait: 30000
      validation-query: select 1
      test-on-borrow: false
      test-while-idle: true
```

由于`druid-spring-boot-starter`提供了自定义数据源并且自动化配置，所有无需在`application.yaml`设置数据源类型。`druid-spring-boot-starter`还提供了`spring.datasource.druid.*`的属性配置数据连接池。

`DruidDataSourceAutoConfigure` 配置，在Spring Boot `DataSourceAutoConfiguration`之前创建了自定义的`datasource`，所以不会走默认的数据连接池算法，而是使用`Druid`自己的数据源以及连接池。

**运行测试**

```java
 @Bean
    public CommandLineRunner pool(DataSource dataSource) {
        return new CommandLineRunner() {
            @Override
            public void run(String... args) throws Exception {
                logger.info("dataSource:" + dataSource.toString());
            }
        };
    }
```

### 详细配置

[DruidDataSource配置属性列表](https://github.com/alibaba/druid/wiki/DruidDataSource%E9%85%8D%E7%BD%AE%E5%B1%9E%E6%80%A7%E5%88%97%E8%A1%A8)

[druid-spring-boot-starter配置](https://github.com/alibaba/druid/tree/master/druid-spring-boot-starter)

### 监控页面

由于监控页面是基于`javax.servlet.Filter`过滤器。Spring Boot 3 Servlet升级到`Jakarta Servlet`。无法启动。
