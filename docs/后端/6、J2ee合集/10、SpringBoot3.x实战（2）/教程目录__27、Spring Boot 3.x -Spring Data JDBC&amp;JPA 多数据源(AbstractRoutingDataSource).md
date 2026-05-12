# 27、Spring Boot 3.x -Spring Data JDBC&amp;JPA 多数据源(AbstractRoutingDataSource)
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/9/27.html
- 分类：Spring Boot 3.x 实战
- 分组：教程目录
[Spring Boot 3.x-Spring Data JPA多数据源-分包模式](/zhuanlan/j2ee/springboot/9/26.html)此文中介绍的是多数据源，每个数据源的表不同，接下来需要解决的是多数据源，每个数据源的表结构一致，这种情况最常见的是数据库主从，查询读从库，新增删除修改走主库。

上述方案，需要一个动态切换的`datasource`根据不同的条件，切换不同的数据源。Spring从2.0版本开始就提供方案`AbstractRoutingDataSource`。

`AbstractRoutingDataSource`：抽象`DataSource`实现，基于查找键(`determineCurrentLookupKey()`)将`getConnection()`调用路由到目标数据源之一。

数据库准备：

主库：`mulit-ds1`

从库：`mulit-ds2`

```java
DROP TABLE IF EXISTS user;
CREATE TABLE user (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  age int(11) DEFAULT NULL,
  name varchar(255) DEFAULT NULL,
  sex varchar(255) DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
```

## 一、数据源定义

**1、** 数据源类型定义：；

`first`->主库(`mulit-ds1`)

`second`->从库(`mulit-ds2`)

```java
public class DataSourceType {
    public final static String FIRST = "first";
    public final static String SECOND = "second";
}
```

**2、** 自定义动态数据源继承`AbstractRoutingDataSource`；

```java
public class DynamicDataSource extends AbstractRoutingDataSource {
    /**
     * ThreadLocal 用于提供线程局部变量，在多线程环境可以保证各个线程里的变量独立于其它线程里的变量。
     */
    private static final ThreadLocal<String> CONTEXT_HOLDER = new ThreadLocal<>();
    public DynamicDataSource(DataSource defaultTargetDataSource, Map<Object, Object> targetDataSources) {
        //默认目标数据源
        super.setDefaultTargetDataSource(defaultTargetDataSource);
        //目标数据源集合。数据源切换时从此列表选择
        super.setTargetDataSources(targetDataSources);
        //属性设置
        super.afterPropertiesSet();
    }
    @Override
    protected Object determineCurrentLookupKey() {
        //关键：更具数据源key。获取选择的数据源。
        return getDataSource();
    }
    public static void setDataSource(String dataSource) {
        CONTEXT_HOLDER.set(dataSource);
    }
    public static String getDataSource() {
        return CONTEXT_HOLDER.get();
    }
    public static void clearDataSource() {
        CONTEXT_HOLDER.remove();
    }
}
```

**3、** 数据源注入；

```java
@Configuration
public class DynamicDataSourceConfig {
    //创建第一个主库数据源
    @Bean(name = "firstDataSource")
    @ConfigurationProperties(prefix = "app.datasource.first")
    public DataSource userDataSource() {
        return DataSourceBuilder.create().build();
    }
    //创建第二个从库数据源
    @Bean(name = "secondDataSource")
    @ConfigurationProperties(prefix = "app.datasource.second")
    public DataSource secondDataSource() {
        return DataSourceBuilder.create().build();
    }
    //动态数据源，实际使用的数据源时数据源路由根据key 选择的。默认数据源为第一个数据源(主库)
    @Bean(name = "dynamicDataSource")
    //主数据源，使用的是此数据源
    @Primary
    public DynamicDataSource dataSource(DataSource firstDataSource, DataSource secondDataSource) {
        Map<Object, Object> targetDataSources = new HashMap<>(2);
        targetDataSources.put(DataSourceType.FIRST, firstDataSource);
        targetDataSources.put(DataSourceType.SECOND, secondDataSource);
        //默认返回的也是一个datasource
        return new DynamicDataSource(firstDataSource, targetDataSources);
    }
}
```

**4、** 数据连接属性配置；

```java
app:
  datasource:
    first:
     数据库驱动完整类名
      driver-class-name: com.mysql.jdbc.Driver
     数据库连接url
      jdbc-url: jdbc:mysql://127.0.0.1:3306/multi-ds1
     数据库用户名
      username: root
     数据库密码
      password: 123456
    second:
     数据库驱动完整类名
      driver-class-name: com.mysql.jdbc.Driver
     数据库连接url
      jdbc-url: jdbc:mysql://127.0.0.1:3306/multi-ds2
     数据库用户名
      username: root
     数据库密码
      password: 123456
```

## 二、Spring Data JPA使用

引入依赖:

```java
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
```

### 1.创建entity

```java
@Data
@ToString
@Entity
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String firstName;
    private String secondName;
}
```

### 2.创建repository

```java
@Transactional(readOnly = true)
public interface UserRepository extends JpaRepository<User, Long> {
    public List<User> findByFirstName(String firstName);
}
```

### 3.测试

```java
public class MultiDsRouteApplication {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private DynamicDataSource dynamicDataSource;
    @Autowired
    private IUserService userService;
    public static void main(String[] args) {
        SpringApplication.run(MultiDsRouteApplication.class, args);
    }
    @Bean
    CommandLineRunner commandLineRunner() {
        return new CommandLineRunner() {
            @Override
            public void run(String... args) throws Exception {
                //查询使用从库
                DynamicDataSource.setDataSource(DataSourceType.SECOND);
                userRepository.findByFirstName("张三");
                log.info("当前使用的数据源是:"+dynamicDataSource.getConnection().getCatalog());
                //新增使用主库
                DynamicDataSource.setDataSource(DataSourceType.FIRST);
                log.info("当前使用的数据源是:"+dynamicDataSource.getConnection().getCatalog());
                User user = new User();
                user.setFirstName("hello");
                user.setSecondName("word");
                userRepository.save(user);
            }
        };
    }
}
```

控制台输出：

### 4.AOP自动选择数据源

按照上述的方法，正式业务开发过程中，肯定是有某个方式触发数据源，不应该每次手动设置：

```java
DynamicDataSource.setDataSource(DataSourceType.SECOND);
```

因为我们模拟的是数据库主从结构，查询走从库，写走主库因此我们从`Repository`方法命名规则建立切面，自动选择数据源。

```java
@Slf4j
@Aspect
@Component
public class DataSourceAspect {
    //此处为了打印数据源引入。
    @Autowired
    private DynamicDataSource dynamicDataSource;
    @Pointcut("execution(* org.springframework.data.repository.CrudRepository.*(..))||execution(* com" +
            ".example.multidsroute.repository.*.*(" +
            "..))")
    private void aspect() {
    }
    @Around("aspect()")
    public Object around(ProceedingJoinPoint joinPoint) throws Throwable {
        String method = joinPoint.getSignature().getName();
        if (method.startsWith("find") || method.startsWith("select") || method.startsWith("query") || method.startsWith("search")) {
            DynamicDataSource.setDataSource("second");
        } else {
            DynamicDataSource.setDataSource("first");
            log.info("switch to first datasource...");
        }
        log.info("aop当前使用的数据源是:" + dynamicDataSource.getConnection().getCatalog());
        try {
            return joinPoint.proceed();
        } finally {
            log.info("清除 datasource router...");
            DynamicDataSource.clearDataSource();
        }
    }
}
```

> @Pointcut(“execution(* org.springframework.data.repository.CrudRepository.(…))||execution( com” +
>
> “.example.multidsroute.repository..(” +
>
> “…))”) 切面一定要把CrudRepository方法加入，这样才能处理所有的Repository方法。

测试：

```java
@Bean
    CommandLineRunner commandLineRunner() {
        return new CommandLineRunner() {
            @Override
            public void run(String... args) throws Exception {
                //查询使用从库
                DynamicDataSource.setDataSource(DataSourceType.SECOND);
                userRepository.findByFirstName("张三");
                //新增使用主库
                DynamicDataSource.setDataSource(DataSourceType.FIRST);
                User user = new User();
                user.setFirstName("hello");
                user.setSecondName("word");
                userRepository.save(user);
            }
        };
    }
```

## 二、Spring Data JDBC使用

Spring Data JDBC只需要把依赖换成如下即可：

```java
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jdbc</artifactId>
</dependency>
```
