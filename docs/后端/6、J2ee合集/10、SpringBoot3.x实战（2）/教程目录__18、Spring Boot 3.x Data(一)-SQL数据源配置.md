# 18、Spring Boot 3.x Data(一)-SQL数据源配置
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/9/18.html
- 分类：Spring Boot 3.x 实战
- 分组：教程目录
Spring Boot集成了许多数据技术，包括`SQL`和`NoSQL`。

## 一、SQL数据库

`Spring`框架为使用SQL数据库提供了广泛的支持，从使用`JdbcTemplate`的直接JDBC访问到完成“对象关系映射”技术(如`Hibernate`)。

`Spring Data`提供了一个额外的功能:`直接从接口创建Repository，并使用约定从方法名生成查询。`

### 配置数据源

Java中`javax.sql.DataSource`接口提供了处理数据库连接的标准方法。“`DataSource`”使用`URL`和一些凭证来建立数据库连接。

#### 嵌入式数据库支持

使用内存内嵌入式数据库开发应用程序通常很方便。显然，内存中的数据库不提供持久存储。您需要在应用程序启动时填充数据库，并准备在应用程序结束时丢弃数据。

Spring Boot可以自动配置嵌入式的H2、HSQL和Derby数据库。你不需要提供任何连接url。你只需要包含要使用的嵌入式数据库的构建依赖项。如果类路径上有多个嵌入式数据库，则设置`spring.datasource.embedded-database-connection` 配置属性，用于控制使用哪一个。将该属性设置为`none`将禁用嵌入式数据库的自动配置。

> 如果你在测试中使用此特性，你可能会注意到，无论你使用多少应用程序上下文，整个测试套件都会重用相同的数据库。
>
> 如果你想确保每个上下文都有一个单独的嵌入式数据库，你应该设置spring.datasource.generate-unique-name为true。

要自动配置嵌入式数据库，需要依赖`spring-jdbc`。例如，典型的POM依赖如下:

```java
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-jdbc</artifactId>
        </dependency>
        <dependency>
            <groupId>org.hsqldb</groupId>
            <artifactId>hsqldb</artifactId>
            <scope>runtime</scope>
        </dependency>
```

> 如果出于某种原因，为嵌入式数据库配置了连接URL，请注意确保禁用了数据库的自动关闭功能。 如果你使用H2，你应该使用DB_CLOSE_ON_EXIT=FALSE来完成，如果使用HSQLDB，应该确保没有使用shutdown=true。禁用数据库的自动关闭功能可以让Spring Boot在数据库关闭时控制，从而确保一旦不再需要对数据库的访问就会发生这种情况。

`hsqldb url` 配置示例：

```java
spring:
  datasource:
    username: hsqldb
    password: hsqldb
    url: jdbc:hsqldb:mem://localhost/test;shutdown=true
    driver-class-name: org.hsqldb.jdbcDriver
    schema: classpath:schema.sql
    data: classpath:data.sql
    initialization-mode: always
    continue-on-error: true
```

### DataSource配置

数据源配置由`spring.datasource.*`中的外部配置属性控制。例如，你可以在`application.properties`中声明以下部分:

```java
spring:
  datasource:
    url: "jdbc:mysql://localhost/test"
    username: "dbuser"
    password: "dbpass"
```

> 你至少应该通过设置spring.datasource.url属性来指定URL。否则，Spring Boot会尝试自动配置嵌入式数据库。

Spring Boot可以从`URL`推导出大多数数据库的`JDBC`驱动程序类， 如果需要指定特定的类，可以使用`spring.datasource.driver-class-name`属性。

要创建一个`DataSource`池，我们需要能够验证一个有效的`Driver`类是否可用，因此我们在做任何事情之前要检查这个类。换句话说，如果你设置了`spring.datasource.driver-class-name=com.mysql.jdbc.Driver`，那么这个类必须是可加载的。

有关更多支持的选项，请参阅[DataSourceProperties](https://github.com/spring-projects/spring-boot/blob/v3.0.0-M2/spring-boot-project/spring-boot-autoconfigure/src/main/java/org/springframework/boot/autoconfigure/jdbc/DataSourceProperties.java)。对于特定的数据连接池，可以使用`spring.datasource.hikari.*`, `spring.datasource.tomcat.*`, `spring.datasource.dbcp2.*`, 和 `spring.datasource.oracleucp.*` 配置进行微调。

例如，如果你使用`Tomcat`连接池，你可以自定义许多附加设置，如下面的示例所示:

```java
spring:
  datasource:
    tomcat:
      max-wait: 10000
      max-active: 50
      test-on-borrow: true
```

### 支持的连接池

Spring Boot使用以下算法来选择特定的实现:

**1、** 我们更喜欢HikariCP的性能和并发性如果HikariCP可用，我们总是选择它；

**2、** 否则，如果Tomcat池数据源可用，我们就使用它；

**3、** 否则，如果CommonsDBCP2可用，我们就使用它；

**4、** 如果没有HikariCP、Tomcat和DBCP2可用，如果OracleUCP可用，我们使用它；

> 如果你使用spring-boot-starter-jdbc或spring-boot-starter-data-jpa Starter，你将自动获得对HikariCP的依赖。

你可以完全绕过该算法，并通过设置`spring.datasource.type`属性指定要使用的连接池。如果在`Tomcat`容器中运行应用程序，这一点尤其重要，因为默认情况下提供了`tomcat-jdbc`。

可以使用`DataSourceBuilder`手动配置其他连接池。如果你定义了自己的`DataSource` bean，则不会发生自动配置。`DataSourceBuilder`支持以下连接池:

- HikariCP
- Tomcat pooling Datasource
- Commons DBCP2
- Oracle UCP & OracleDataSource
- Spring Framework’s SimpleDriverDataSource
- H2 JdbcDataSource
- PostgreSQL PGSimpleDataSource

### 连接到JNDI数据源

如果你将Spring Boot应用程序部署到应用程序服务器，你可能希望通过使用应用程序服务器的内置特性配置和管理数据源，并通过使用`JNDI`访问它。

spring.datasource.jndi-name属性可以用作spring.datasource.url的替代,`spring.datasource.username`和 `spring.datasource.password` 属性 从特定的`JNDI`位置访问数据源。

下面的例子展示如何访问JBoss定义的数据源:

```java
spring:
  datasource:
    jndi-name: "java:jboss/datasources/customers"
```

### 自定义数据源配置

要配置你自己的数据源，请在你的配置中定义该类型的`@Bean`。 Spring Boot在任何需要的地方重用“`DataSource`”，包括数据库初始化。

下面的例子展示了如何在`bean`中定义数据源:

```java
@Configuration(proxyBeanMethods = false)
public class MyDataSourceConfiguration {
    @Bean
    @ConfigurationProperties(prefix = "app.datasource")
    public SomeDataSource dataSource() {
        return new SomeDataSource();
    }
}
```

下面的例子展示了如何通过设置属性来定义数据源:

```java
app:
  datasource:
    url: "jdbc:h2:mem:mydb"
    username: "sa"
    pool-size: 30
```

假设SomeDataSource具有URL、用户名和连接池大小的常规JavaBean属性，那么在DataSource对其他组件可用之前，这些设置将被自动绑定。Spring Boot还提供了一个实用工具构建类，称为DataSourceBuilder，可用于创建一个标准数据源(如果它在类路径上)。构建器可以根据类路径上可用的内容检测要使用的对象。它还基于JDBC URL自动检测驱动程序。下面的例子展示了如何使用DataSourceBuilder创建一个数据源:

```java
@Configuration(proxyBeanMethods = false)
public class MyDataSourceConfiguration {
    @Bean
    @ConfigurationProperties("app.datasource")
    public DataSource dataSource() {
        return DataSourceBuilder.create().build();
    }
```

下面的例子展示了如何通过设置属性来定义JDBC数据源:

```java
app:
  datasource:
    url: "jdbc:mysql://localhost/test"
    username: "dbuser"
    password: "dbpass"
    pool-size: 30
```

然而，这里有一个陷阱。由于没有公开数据库连接池的实际类型，因此在自定义DataSource的元数据中没有生成键，IDE中也没有可用的键选择，因为DataSource接口没有公开属性。

另外，如果类路径上碰巧有Hikari，这个基本设置就不起作用了，因为Hikari没有url属性(但有一个jdbcUrl属性)。在这种情况下，你必须重写你的配置如下:

```java
app:
  datasource:
    jdbc-url: "jdbc:mysql://localhost/test"
    username: "dbuser"
    password: "dbpass"
    pool-size: 30
```

下面的例子展示了如何使用`DataSourceBuilder`创建`HikariDataSource`:

```java
@Configuration(proxyBeanMethods = false)
public class MyDataSourceConfiguration {
    @Bean
    @ConfigurationProperties("app.datasource")
    public HikariDataSource dataSource() {
        return DataSourceBuilder.create().type(HikariDataSource.class).build();
    }
}
```

你甚至可以进一步利用`DataSourceProperties`为你做的事情—也就是说，如果没有提供URL，则通过提供用户名和密码的默认嵌入式数据库。 你可以很容易地从任何DataSourceProperties对象的状态初始化一个`DataSourceBuilder`，所以你也可以注入Spring Boot自动创建的`DataSource`。 然而，这将把你的配置分成两个名称空间:spring.datasource上的url,username, password, type, 和 driver其余的在你自定义的命名空间上(app.datasource)。 为了避免这种情况，你可以在你的自定义名称空间上重新定义一个自定义`DataSourceProperties`，如下面的示例所示:

```java
@Configuration(proxyBeanMethods = false)
public class MyDataSourceConfiguration {
    @Bean
    @Primary
    @ConfigurationProperties("app.datasource")
    public DataSourceProperties dataSourceProperties() {
        return new DataSourceProperties();
    }
    @Bean
    @ConfigurationProperties("app.datasource.configuration")
    public HikariDataSource dataSource(DataSourceProperties properties) {
        return properties.initializeDataSourceBuilder().type(HikariDataSource.class).build();
    }
}
```

这个设置与Spring Boot默认为你做的配置同步。

```java
app:
  datasource:
    url: "jdbc:mysql://localhost/test"
    username: "dbuser"
    password: "dbpass"
    configuration:
      maximum-pool-size: 30
```

## 总结

数据源自动配置是Spring Boot自带的`DataSourceAutoConfiguration`。
