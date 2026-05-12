# 23、Spring Boot 3.x Data(五)-Spring Data JPA(配置，Bootstrap Mode,数据库初始化，命名策略)
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/9/23.html
- 分类：Spring Boot 3.x 实战
- 分组：教程目录
## JPA配置

Spring Data JPA已经提供了一些独立于供应商的配置选项(例如SQL日志)，Spring Boot将这些选项以及一些针对`Hibernate`的选项作为外部配置属性公开。其中一些是根据上下文自动检测的，因此你不应该设置它们。

属性
描述
备注

spring.jpa.database
要操作的目标数据库，默认自动检测
可选配置

spring.jpa.database-platform
要操作的目标数据库的名称，默认情况下是自动检测的
可以使用"Database"枚举

spring.jpa.defer-datasource-initialization
datasource初始化延迟
默认false

spring.jpa.generate-ddl
启动时是否初始化数据库schema
默认false

spring.jpa.show-sql
是否启用SQL语句日志记录
默认false

spring.jpa.mapping-resources
资源映射(等价于persistence.xml中的“mapping-file”条目)

spring.jpa.open-in-view
OpenEntityManagerInViewInterceptor注册,将JPA EntityManager绑定到线程，用于整个请求处理
默认true

spring.jpa.properties
要在JPA提供程序上设置的其他本地属性
例如：spring.jpa.properties.hibernate.connection.autocommit

spring.data.jpa.repositories.enabled
是否启用JPA Repository
默认true

spring.data.jpa.repositories.bootstrap-mode
JPA Repository的引导模式
三种模式:DEFAULT(默认), DEFERRED ,LAZY

spring.jpa.hibernate.ddl-auto
DDL模式
hibernate.hbm2ddl的快捷方式,当使用嵌入式数据库时，默认为create-drop,否则默认值为 none

spring.jpa.hibernate.naming.implicit-strategy
全限定名的隐式命名策略
例如:org.springframework.boot.orm.jpa.hibernate.SpringImplicitNamingStrategy

spring.jpa.hibernate.naming.physical-strategy
物理命名策略的完全限定名

spring.jpa.hibernate.use-new-id-generator-mappings
是否使用Hibernate更新的IdentifierGeneratorAUTO, TABLE和SEQUENCE。
默认true。hibernate.id.new_generator_mappings快捷方式

## Bootstrap Mode

默认情况下，Spring Data JPA Repository是默认的Spring bean。它们是单例作用域，并且是提前初始化的。在启动期间，它们已经与J`PA EntityManager`交互，以进行验证和元数据分析。Spring框架支持在后台线程中初始化`JPA EntityManagerFactory`，因为在Spring应用程序中，这个过程通常会占用大量的启动时间。为了有效地利用后台初始化，我们需要确保JPA Repository的初始化时间越晚越好。

在Spring Data JPA 中，可以使用`spring.data.jpa.repositories.bootstrap-mode`配置`BootstrapMode`:

- DEFAULT (默认) — 默认模式,除非显示的使用@Lazy注解延迟加载，否则Repository在容器启动过程中初始化。
- LAZY — 懒加载模式，启动过程中JPA Respository组件bean并没有真正被初始化。这些JPA Respository组件bean仅在首次调用前才会被初始化，以及进行相应的验证和元数据分析。
- DEFERRED —延迟加载模式，本质上和LAZY操作模式相同，但是触发一个ContextRefreshedEvent事件来通知Respository初始化，这样Respository在应用程序完全启动之前就被验证了。

> 模式选择建议：
>
> 1.如果你不使用异步JPA引导，则坚持使用默认引导模式。
>
> 2.如果你想异步引导JPA, DEFERRED是一个合理的默认值，因为它将确保Spring Data
>
> JPA引导只等待EntityManagerFactory设置，如果EntityManagerFactory设置本身需要比初始化所有其他应用程序组件更长的时间。尽管如此，它确保存储库在应用程序发出启动信号之前得到了正确的初始化和验证。
>
> 3.对于测试场景和本地开发，LAZY是一个不错的选择。

## 命名策略

Hibernate使用两种不同的命名策略将对象模型中的名称映射到相应的数据库名称。

`物理策略`和`隐式策略`实现的完全限定类名，可以通过分别设置`spring.jpa.hibernate.naming.physical-strategy`和`spring.jpa.hibernate.naming.implicit-strategy`属性来配置。如果`ImplicitNamingStrategy`或`PhysicalNamingStrategy` bean在应用程序上下文中可用，Hibernate将自动配置使用它们。

默认情况下，Spring Boot使用`CamelCaseToUnderscoresNamingStrategy`配置物理命名策略。使用这种策略，所有的`点都被下划线取代`，`驼峰大小写也被下划线取代`。另外，默认情况下，所有表名都是小写的。例如，`TelephoneNumber`实体被映射到`telephone_number`表。如果你的模式需要混合大小写标识符，定义一个自定义`CamelCaseToUnderscoresNamingStrategy` bean，如下面的示例所示:

```java
@Configuration(proxyBeanMethods = false)
public class MyHibernateConfiguration {
    @Bean
    public CamelCaseToUnderscoresNamingStrategy caseSensitivePhysicalNamingStrategy() {
        return new CamelCaseToUnderscoresNamingStrategy() {
            @Override
            protected boolean isCaseInsensitive(JdbcEnvironment jdbcEnvironment) {
                return false;
            }
        };
    }
}
```

## 数据库初始化

一个`SQL`数据库可以用不同的方式初始化，这取决于你的技术栈是什么。

### 使用JPA初始化数据库

JPA具有用于DDL生成的特性，可以将这些特性设置为在启动时针对数据库运行。这是通过两个外部属性控制的:

`spring.jpa.generate-ddl (boolean)` : 开启和关闭该特性，并且与厂商无关。

`spring.jpa.hibernate.ddl-auto (enum)` :是以更细粒度的方式控制行为的Hibernate特性。

> ddl-auto 枚举：
>
> none(默认):禁用DDL处理
>
> validate：验证schema,不对数据库做任何操作
>
> update： 更新schema
>
> create： 创建schema，并销毁之前数据
>
> create-drop： 会话创建时创建schema，会话关闭时销毁schema

### 使用Hibernate初始化数据库

你可以显式地设置`spring.jpa.hibernate.ddl-auto`，标准的Hibernate属性值为`none`、`validate`、`update`、`create`和`create-drop`。 根据Spring Boot是否认为数据库是嵌入式的，它会为你选择一个默认值。如果没有检测到schema管理器，或者在所有其他情况下都没有检测到`schema`管理器，则默认为`create-drop`。通过查看Connection类型和JDBC url来检测嵌入式数据库(`Hsqldb`、`h2`和`Derby`是候选项)。从内存数据库切换到“真正的”数据库时要小心，不要假设新平台中存在表和数据。你要么必须显式地设置`ddl-auto`，要么使用其他机制之一来初始化数据库。

> 你可以通过启用org.hibernate.SQL日志记录器来输出模式创建。如果你启用调试模式，这将自动完成。

另外，在`classpath`根目录命名为`import.sql`的文件，Hibernate在启动时执行此文件(如果将`ddl-auto`属性设置为`create`或`create-drop`)。这个是Hibernate的特性。

**新建实体类：**

```java
@Entity
public class Blog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    private String content;
    //get set
    }
```

**配置：**

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
  jpa:
    hibernate:
      ddl-auto: create
logging:
  level:
    org.hibernate.SQL: debug
```

**启动程序:**

```java
HHH000400: Using dialect: org.hibernate.dialect.MySQL57Dialect
 org.hibernate.SQL : drop table if exists blog
org.hibernate.SQL : create table blog (id bigint not null auto_increment, content varchar(255), title varchar(255), primary key (id)) engine=InnoDB
```

### 使用SQL脚本初始化

Spring Boot可以自动创建 `JDBC DataSource Schema` (`DDL` 脚本)或`R2DBC ConnectionFactory`并初始化它(`DML`脚本)。 它从标准`classpath`的根路径位置:分别加载`schema.sql` 和 `data.sql`。

另外，Spring Boot还自动处理`schema-${platform}.sql` 和 `data-${platform}.sql` (如果存在)文件，`platform`的值来自`spring.sql.init.platform`变量。这允许你在必要时切换到特定于数据库的脚本。例如，你可以选择将其设置为数据库(`hsqldb`、`h2`、`oracle`、`mysql`、`postgresql`等)的供应商名称。

默认情况下，只有在使用嵌入式内存数据库时才执行`SQL`数据库初始化。 要始终初始化一个`SQL`数据库，不管它是什么类型，请将`spring.sql.init.mode`设置为`always`。类似地，要禁用初始化，可以将`spring.sql.init.mode`设置为`never`。默认情况下，Spring Boot启用其基于脚本的数据库初始化器的快速失败特性。这意味着，如果脚本导致异常，应用程序将无法启动。你可以通过设置`spring.sql.init.continue-on-error`来调整该行为。

默认情况下，在创建JPA EntityManagerFactory bean之前执行基于脚本的数据源初始化。`schema.sql`可用于为JPA-managed的实体创建`schema`，`data.sql`可以填充它。

不建议使用多个数据源初始化技术，如果你希望基于脚本的数据源初始化能够构建在Hibernate执行的schema创建之上，请将`spring.jpa.defer-datasource-initialization`设置为`true`。这将推迟数据源初始化，直到创建并初始化任何EntityManagerFactory bean之后。

如果你正在使用高级数据库迁移工具，如`Flyway`或`Liquibase`，你应该单独使用它们来创建和初始化`schema`。不建议在`Flyway`或`Liquibase`一起使用`schema.sql` 和 `data.sql`，并且在未来的版本中将删除支持。

**新建resources/schema.sql和data.sql**

```java
//schema.sql
create table blog_always (id bigint not null auto_increment, content varchar(255), title varchar(255), primary key (id)) engine=InnoDB;
//data.sql
INSERT INTO blog_always(title,content)
VALUES('hello word',"content");
```

**application.yaml配置**

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
  jpa:
    hibernate:
      ddl-auto: create
  sql:
    init:
      mode: always
      continue-on-error: false
logging:
  level:
    org.hibernate.SQL: debug
```

**启动程序：**

### 使用Spring Batch初始化数据库

如果你使用Spring Batch，那么它已经预先打包了用于大多数流行数据库平台的`SQL`初始化脚本。 Spring Boot可以检测你的数据库类型，并在启动时执行这些脚本。如果使用嵌入式数据库，默认情况下会发生这种情况。你也可以为任何数据库类型启用它，如下所示的示例:

```java
spring:
  batch:
    jdbc:
      initialize-schema: "always"
```

你还可以通过设置`spring.batch.jdbc.initialize-schema=never`显式地关闭初始化。

## 数据库初始化依赖

数据库初始化是在应用程序启动时作为应用程序上下文刷新的一部分执行的。为了允许在启动期间访问已初始化的数据库，将自动检测充当数据库初始化器的bean和要求对数据库进行初始化的bean。其初始化依赖于已初始化的数据库的bean被配置为依赖于那些初始化数据库的bean。如果在启动期间，应用程序试图访问数据库，而数据库还没有初始化，则可以配置对初始化数据库并要求初始化数据库的bean的额外检测

### 检测数据库初始化器

Spring Boot将自动检测以下类型的bean来初始化SQL数据库:

- DataSourceScriptDatabaseInitializer
- EntityManagerFactory
- Flyway
- FlywayMigrationInitializer
- R2dbcScriptDatabaseInitializer
- SpringLiquibase

如果你正在为数据库初始化库使用第三方启动器，那么它可能会提供一个检测器，以便自动检测其他类型的`bean`。要检测其他`bean`，请在`META-INF/spring-factories`中注册一个`DatabaseInitializerDetector`实现。

### 检测依赖于数据库初始化的Bean

Spring Boot将自动检测以下类型的依赖于数据库初始化的`bean`:

- AbstractEntityManagerFactoryBean (除非spring.jpa.defer-datasource-initialization设置为true)
- DSLContext (jOOQ)
- EntityManagerFactory (除非 spring.jpa.defer-datasource-initialization 设置为true)
- JdbcOperations
- NamedParameterJdbcOperations

如果你正在使用第三方`starter`数据访问库，它可能会提供一个检测器，以便自动检测其他类型的bean。要检测其他bean，请在`META-INF/spring-factories`中注册一个`DependsOnDatabaseInitializationDetector`实现。或者，用`@DependsOnDatabaseInitialization`注解的bean的类或它的`@Bean`方法。
