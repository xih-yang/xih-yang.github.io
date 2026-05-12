# 26、Spring Boot 3.x -Spring Data JPA多数据源-分包模式
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/9/26.html
- 分类：Spring Boot 3.x 实战
- 分组：教程目录
多数据源：一个项目中注入多个自定义`datasource`。参见：[自定义数据源配置](/zhuanlan/j2ee/springboot/8/18.html)。根据不同的业务场景多数据源的模式也不一样，比如一个项目中不同的业务表分布在不同的库，本节的例子：

按照如上的业务场景，如果存在多个数据源，数据表分布在不同的库，那么`JPA`中`Entity``Repository`，需要在不同的包，方便扫描。

## 一、包结构

## 二、创建多个DataSource

```java
@Configuration
public class DataSourceConfig {
    @Primary
    @Bean(name = "userDataSource")
    @ConfigurationProperties(prefix = "app.datasource.user")
    public DataSource userDataSource() {
        return DataSourceBuilder.create().build();
    }
    @Bean(name = "blogDataSource")
    @ConfigurationProperties(prefix = "app.datasource.blog")
    public DataSource secondDataSource() {
        return DataSourceBuilder.create().build();
    }
}
```

多`datasource`配置需要注意以下几点：

**1、** 需要将其中一个数据源设置为`@Primary`，默认主数据源；

**2、** 不同数据源注入不同的配置；

```java
app:
  datasource:
    user:
     数据库驱动完整类名
      driver-class-name: com.mysql.jdbc.Driver
     数据库连接url
      jdbc-url: jdbc:mysql://127.0.0.1:3306/mulit-user
     数据库用户名
      username: root
     数据库密码
      password: 123456
    blog:
     数据库驱动完整类名
      driver-class-name: com.mysql.jdbc.Driver
     数据库连接url
      jdbc-url: jdbc:mysql://127.0.0.1:3306/mulit-blog
     数据库用户名
      username: root
     数据库密码
      password: 123456
debug: true
spring:
  jpa:
    hibernate:
      ddl-auto: update
```

## 三、创建EntityManagerFactory，TransactionManager

由于是注入了2个数据源，那么对应的数据源的`EntityManagerFactory`，和`TransactionManager`也许要自定义分开。

**user相关**

```java
@Configuration
@EnableTransactionManagement
@EnableJpaRepositories(basePackages = {
     "com.example.multidssplitpackage.user.repository"},
        entityManagerFactoryRef =
        "userEntityManagerFactory", transactionManagerRef = "userTransactionManager")
public class UserDataSourceConfig {
    @Autowired
    @Qualifier("userDataSource")
    private DataSource userDataSource;
    @Primary
    @Bean(name = "userEntityManager")
    public EntityManager userEntityManager(EntityManagerFactoryBuilder builder) {
        return userEntityManagerFactory(builder).getObject().createEntityManager();
    }
    @Primary
    @Bean(name = "userEntityManagerFactory")
    public LocalContainerEntityManagerFactoryBean userEntityManagerFactory(EntityManagerFactoryBuilder builder) {
        Map<String, String> map = new HashMap<>();
        map.put("hibernate.hbm2ddl.auto", "update");
        map.put("hibernate.show_sql", "true");
        return builder.dataSource(userDataSource).packages("com.example.multidssplitpackage.user").properties(map).persistenceUnit("userUnit").build();
    }
    @Primary
    @Bean(name = "userTransactionManager")
    public PlatformTransactionManager userTransactionManager(EntityManagerFactoryBuilder builder) {
        return new JpaTransactionManager(userEntityManagerFactory(builder).getObject());
    }
}
```

```java
builder.dataSource(userDataSource).packages("com.example.multidssplitpackage.user").properties(map).persistenceUnit("userUnit").build();
```

针对`user entity`的管理，自定义`userEntityManagerFactory`，包只扫描`user`相关。`blog`以此类推。事物的管理，因为存在多个数据源，那么事物管理也是独立分开。

**blog相关**

```java
@Configuration
@EnableTransactionManagement
@EnableJpaRepositories(basePackages = {
     "com.example.multidssplitpackage.blog"},
        entityManagerFactoryRef =
        "blogEntityManagerFactory", transactionManagerRef = "blogTransactionManager")
public class BlogDataSourceConfig {
    @Autowired
    @Qualifier("blogDataSource")
    private DataSource blogDataSource;
    @Bean(name = "blogEntityManager")
    public EntityManager blogEntityManager(EntityManagerFactoryBuilder builder) {
        return blogEntityManagerFactory(builder).getObject().createEntityManager();
    }
    @Bean(name = "blogEntityManagerFactory")
    public LocalContainerEntityManagerFactoryBean blogEntityManagerFactory(EntityManagerFactoryBuilder builder) {
        Map<String, String> map = new HashMap<>();
        map.put("hibernate.hbm2ddl.auto", "update");
        map.put("hibernate.show_sql", "true");
        return builder.dataSource(blogDataSource).packages("com.example.multidssplitpackage.blog").properties(map).persistenceUnit("userUnit").build();
    }
    @Bean(name = "blogTransactionManager")
    public PlatformTransactionManager blogTransactionManager(EntityManagerFactoryBuilder builder) {
        return new JpaTransactionManager(blogEntityManagerFactory(builder).getObject());
    }
}
```

接下来主要是对`repository`的管理配置：

```java
@EnableTransactionManagement
@EnableJpaRepositories(basePackages = {
     "com.example.multidssplitpackage.blog"},
        entityManagerFactoryRef =
        "blogEntityManagerFactory", transactionManagerRef = "blogTransactionManager")
```

不同包的`repositories`扫描设置成自己的包。

## 四、创建Entity，Repository

`Entity`和`Respository`跟正常单数据源配置一样。

```java
@Data
@Entity
@ToString
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private Integer age;
    private String sex;
}
@Data
@Entity
public class Blog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    private String content;
    private Long authorId;
}
```

`Respoistory`针对事物注解，需要注入对应自己数据源的事物管理器。

```java
@Transactional(value = "userTransactionManager", readOnly = true)
public interface UserRespoistory extends JpaRepository<User, Long> {
}
@Transactional(transactionManager = "blogTransactionManager", readOnly = true)
public interface BlogRepository extends JpaRepository<Blog, Long> {
}
```

## 五、测试

```java
@SpringBootTest
class MultiDsSplitPackageApplicationTests {
    @Autowired
    private UserRespoistory userRespoistory;
    @Autowired
    private BlogRepository blogRepository;
    @Test
    void testMultiDS() {
        User user = new User();
        user.setName("才可夫斯基"+Math.random());
        user.setAge(100);
        user.setSex("男");
        User result = userRespoistory.save(user);
        System.out.println(result);
        Blog blog = new Blog();
        blog.setTitle("jpa 多数据源");
        blog.setContent("分包模式实现");
        blog.setAuthorId(user.getId());
        blogRepository.save(blog);
    }
}
```

运行测试后，发现一个问题，JPA naming strategy失效了，表名直接变成了类名，并没有将第一个字母转换成小写，驼峰的authorId，并没有转换成下划线格式。

## 六、命名策略失效问题

针对上述问题，需要手动设置命名策略，`hibernate.implicit_naming_strategy`（隐式），`hibernate.physical_naming_strategy`（物理显示）

```java
 @Bean(name = "blogEntityManagerFactory")
    public LocalContainerEntityManagerFactoryBean blogEntityManagerFactory(EntityManagerFactoryBuilder builder) {
        Map<String, String> map = new HashMap<>();
        map.put("hibernate.hbm2ddl.auto", "update");
        map.put("hibernate.show_sql", "true");
        map.put("hibernate.physical_naming_strategy", CamelCaseToUnderscoresNamingStrategy.class.getName());
        map.put("hibernate.implicit_naming_strategy", SpringImplicitNamingStrategy.class.getName());
        return builder.dataSource(blogDataSource).packages("com.example.multidssplitpackage.blog").properties(map).persistenceUnit("userUnit").build();
    }
```

`user`设置同上。

再次运行程序正常：

## 总结

本周介绍的多数据场景，正常业务情况下，使用的非常少，针对目前微服务流行，肯定是需要分服务，而不是分不同的数据库。并且上述多数据源场景，事物是完全隔开的，因此局限性非常的大。一般真多多数据源情况，多租户的场景应该使用的非常多。下一章节介绍。
