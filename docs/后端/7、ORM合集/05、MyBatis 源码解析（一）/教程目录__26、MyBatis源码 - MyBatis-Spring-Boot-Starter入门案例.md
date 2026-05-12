# 26、MyBatis源码 - MyBatis-Spring-Boot-Starter入门案例
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/5/26.html
- 分类：ORM框架
- 分组：教程目录
### 前言

mybatis除了继承了Spring以外，还集成了Spring Boot的自动配置及自动装配，开发更加简化。

MyBatis-Spring-Boot-Starter 帮助您在Spring Boot之上快速构建 MyBatis 应用程序。

通过使用此模块，您将实现：

- 构建独立的应用程序
- 将样板文件减少到几乎为零
- 更少的 XML 配置

### 要求

MyBatis-Spring-Boot-Starter 需要以下版本：

### 入门案例

首先使用Spring Initializr创建一个Spring Boot Web项目

#### 1. 添加依赖

如果您使用 Maven，只需将以下依赖项添加到您的pom.xml：

```java
        <dependency>
            <groupId>org.mybatis.spring.boot</groupId>
            <artifactId>mybatis-spring-boot-starter</artifactId>
            <version>2.2.0</version>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <version>8.0.25</version>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <version>1.18.20</version>
        </dependency>
```

#### 2. 添加yml配置

在yml中，添加数据源配置

```java
server:
  port: 8080
spring:
  application:
    name: spring-mybatis-demo
  datasource:
    type: com.zaxxer.hikari.HikariDataSource
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://127.0.0.1:3306/demo?useUnicode=true&characterEncoding=utf8&serverTimezone=GMT%2B8&useSSL=false
    username: root
    password: 123456
    hikari:
      minimum-idle: 5
      idle-timeout: 600000
      maximum-pool-size: 10
      auto-commit: true
      pool-name: MyHikariCP
      max-lifetime: 1800000
      connection-timeout: 30000
      connection-test-query: SELECT 1
mybatis:
  mapper-locations: classpath:org/pearl/spring/mybatis/demo/dao/*Mapper.xml
```

#### 3. 启动类

添加启动类，配置@MapperScan扫描。

```java
@SpringBootApplication
@MapperScan(basePackages = {
     "org.pearl.spring.mybatis.demo.dao"})
@EnableTransactionManagement
public class SampleMybatisApplication {
    public static void main(String[] args) {
        SpringApplication.run(SampleMybatisApplication.class, args);
    }
}
```

#### 4. 添加映射器

添加Mapper接口

```java
public interface UserMapper {
    @Select("SELECT * FROM base_user WHERE user_id ={userId}")
    User getUser(@Param("userId") Long userId);
    @Update("UPDATE base_user SET base_user.address=#{address} WHERE base_user.user_id= 1")
    int update(String address);
}
```

添加UserMapper.xml

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.pearl.spring.mybatis.demo.dao.UserMapper">
</mapper>
```

#### 5. 测试

添加一个访问接口，自动注入UserMapper 执行Dao操作

```java
@RestController
@RequestMapping("/user")
public class UserController {
    @Autowired
    UserMapper userMapper;
    @GetMapping("/test")
    public Object test() {
        return userMapper.getUser(1L);
    }
}
```

访问测试接口，成功返回数据库信息，测试通过：

### 配置

在之前我们了解到Configuration是Mybatis 核心配置对象，在使用时，可以在XML中配置，有了Spring Boot ,我们可以直接在YML中添加这些配置就可以了。

与任何其他 Spring Boot 应用程序一样，MyBatis-Spring-Boot-Application 配置参数存储在application.properties（或application.yml）中。

MyBatis 使用前缀mybatis作为其属性。

```java
mybatis:
  XML文件路径，可配置多个，逗号分隔
  mapper-locations: classpath:org/pearl/spring/mybatis/demo/dao/*Mapper.xml
  对应Configuration配置类所有属性
  configuration:
    全局性地开启或关闭所有映射器配置文件中已配置的任何缓存。
    cache-enabled: false
    指定 MyBatis 所用日志的具体实现，未指定时将自动查找。
    log-impl: org.apache.ibatis.logging.slf4j.Slf4jImpl
    驼峰命名 自动将数据库字段下划线转为驼峰
    map-underscore-to-camel-case: true
    指定 VFS 的实现,自定义 VFS 的实现的类全限定名，以逗号分隔。
    vfs-impl: org.mybatis.spring.boot.autoconfigure.SpringBootVFS
    引入外部属性及自定义属性，然后其他配置引入属性使用。
    variables:
    允许 JDBC 支持自动生成主键，需要数据库驱动支持。如果设置为 true，将强制使用自动生成主键。尽管一些数据库驱动不支持此特性，但仍可正常工作（如 Derby）。
    use-generated-keys: false
    使用列标签代替列名。实际表现依赖于数据库驱动，具体可参考数据库驱动的相关文档，或通过对比测试来观察。
    use-column-label: false
    允许使用方法签名中的名称作为语句参数名称。 为了使用该特性，你的项目必须采用 Java 8 编译，并且加上 -parameters 选项。（新增于 3.4.1）
    use-actual-param-name: false
    从SQL中删除多余的空格字符。请注意，这也会影响SQL中的文字字符串。 (新增于 3.5.5)
    shrink-whitespaces-in-sql: false
    是否允许在嵌套语句中使用分页（RowBounds）。如果允许使用则设置为 false。
    safe-row-bounds-enabled: false
    是否允许在嵌套语句中使用结果处理器（ResultHandler）。如果允许使用则设置为 false。
    safe-result-handler-enabled: false
    当返回行的所有列都是空时，MyBatis默认返回 null。 当开启这个设置时，MyBatis会返回一个空实例。 请注意，它也适用于嵌套的结果集（如集合或关联）。（新增于 3.4.2）
    return-instance-for-empty-row: false
    反射工厂
    reflector-factory:
    指定 Mybatis 创建可延迟加载对象所用到的代理工具
    proxy-factory:
    对象包装工厂
    object-wrapper-factory:
    对象工厂 , MyBatis 创建结果对象的新实例时，它都会使用一个对象工厂（ObjectFactory）实例来完成实例化工作。
    object-factory:
    是否允许单个语句返回多结果集（需要数据库驱动支持）。
    multiple-result-sets-enabled: false
    指定 MyBatis 增加到日志名称的前缀。
    log-prefix:
    MyBatis 利用本地缓存机制（Local Cache）防止循环引用和加速重复的嵌套查询。 默认值为 SESSION，会缓存一个会话中执行的所有查询。 若设置值为 STATEMENT，本地缓存将仅用于执行语句，对相同 SqlSession 的不同查询将不会进行缓存
    local-cache-scope: session
    延迟加载的全局开关。当开启时，所有关联对象都会延迟加载。 特定关联关系中可通过设置 fetchType 属性来覆盖该项的开关状态。
    lazy-loading-enabled: false
    指定对象的哪些方法触发一次延迟加载。
    lazy-load-trigger-methods:
    当没有为参数指定特定的 JDBC 类型时，空值的默认 JDBC 类型。 某些数据库驱动需要指定列的 JDBC 类型，多数情况直接用一般类型即可，比如 NULL、VARCHAR 或 OTHER。 JdbcType 常量，常用值：NULL、VARCHAR 或 OTHER。
    jdbc-type-for-null: array
    设置超时时间，它决定数据库驱动等待数据库响应的秒数。
    default-statement-timeout:
    指定保存提供程序方法的sql提供程序类（自3.5.6起）。当省略这些属性时，此类将应用于sql提供程序批注（例如@SelectProvider）上的type（或value）属性.
    default-sql-provider-type:
    指定语句默认的滚动策略。（新增于 3.5.2）
    default-result-set-type: default
    为驱动的结果集获取数量（fetchSize）设置一个建议值。此参数只可以在查询设置中被覆盖。
    default-fetch-size:
    配置默认的执行器。SIMPLE 就是普通的执行器；REUSE 执行器会重用预处理语句（PreparedStatement）； BATCH 执行器不仅重用语句还会执行批量更新。
    default-executor-type: simple
    指定 Enum 使用的默认 TypeHandler 。
    default-enum-type-handler: org.apache.ibatis.type.ArrayTypeHandler
    数据库厂商标识
    database-id:
    指定一个提供 Configuration 实例的类。 这个被返回的 Configuration 实例用来加载被反序列化对象的延迟加载属性值。 这个类必须包含一个签名为static Configuration getConfiguration() 的方法
    configuration-factory: java.lang.Object
    设置不忽略null字段
    call-setters-on-nulls: false
    指定发现自动映射目标未知列（或未知属性类型）的行为。
    auto-mapping-unknown-column-behavior: none
    指定 MyBatis 应如何自动映射列到字段或属性。 NONE 表示关闭自动映射；PARTIAL 只会自动映射没有定义嵌套结果映射的字段。 FULL 会自动映射任何复杂的结果集（无论是否嵌套）。
    auto-mapping-behavior: none
    开启时，任一方法的调用都会加载该对象的所有延迟加载属性。 否则，每个延迟加载属性会按需加载（参考 lazyLoadTriggerMethods)
    aggressive-lazy-loading: false
  执行器类型
  executor-type: simple
  类型处理器包路径
  type-handlers-package:
  mapper接口生成对象的作用域范围
  mapper-default-scope:
  延迟初始化
  lazy-initialization: false
  别名父类
  type-aliases-super-type: java.lang.Object
  别名扫描的包路径
  type-aliases-package:
  默认的脚本解析语言驱动
  default-scripting-language-driver: org.apache.ibatis.scripting.defaults.RawLanguageDriver
  配置属性
  configuration-properties:
  配置文件路径
  config-location:
  是否检查配置文件
  check-config-location: false
  脚本语言驱动配置 
  scripting-language-driver:
    velocity:
      velocity-settings:
      additional-context-attributes:
```
