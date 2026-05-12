# 23、MyBatis源码 - MyBatis-Spring核心之事务管理器
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/5/23.html
- 分类：ORM框架
- 分组：教程目录
### Spring 事务

MyBatis-Spring允许 MyBatis 参与到 Spring 的事务管理中。而不是给 MyBatis 创建一个新的专用事务管理器，MyBatis-Spring 借助了 Spring 中的 DataSourceTransactionManager 来实现事务管理。

一旦配置好了 Spring 的事务管理器，你就可以在 Spring 中按你平时的方式来配置事务。并且支持 @Transactional 注解和 AOP 风格的配置。在事务处理期间，一个单独的 SqlSession 对象将会被创建和使用。当事务完成时，这个 session 会以合适的方式提交或回滚。

事务配置好了以后，MyBatis-Spring 将会透明地管理事务。这样在你的 DAO 类中就不需要额外的代码了。

### 配置事务管理器

要开启Spring 的事务处理功能，在 Spring 的配置文件中创建一个 DataSourceTransactionManager 对象：

```xml
<bean id="transactionManager" class="org.springframework.jdbc.datasource.DataSourceTransactionManager">
  <constructor-arg ref="dataSource" />
</bean>
```

```java
@Configuration
public class DataSourceConfig {
  @Bean
  public DataSourceTransactionManager transactionManager() {
    return new DataSourceTransactionManager(dataSource());
  }
}
```

**注意**：为事务管理器指定的 DataSource 必须和用来创建 SqlSessionFactoryBean 的是同一个数据源，否则事务管理器就无法工作了。

### 编程式事务管理

**编程式事务**：通过编程代码在业务逻辑时需要时自行实现，粒度更小。

MyBatis 的 SqlSession 提供几个方法来在代码中处理事务。但是当使用 MyBatis-Spring 时，你的 bean 将会注入由 Spring 管理的 SqlSession 或映射器。也就是说，Spring 总是为你处理了事务。

你不能在 Spring 管理的 SqlSession 上调用 SqlSession.commit()，SqlSession.rollback() 或 SqlSession.close() 方法。如果这样做了，就会抛出 UnsupportedOperationException 异常。在使用注入的映射器时，这些方法也不会暴露出来。

Spring Framework 提供了两种编程事务管理的方法，通过使用：

- TransactionTemplate或TransactionalOperator。
- TransactionManager实现类。

首先我们注入PlatformTransactionManager

```java
    /**
     * PlatformTransactionManager 编程式事务管理器
     */
    @Bean
    public PlatformTransactionManager platformTransactionManager(DataSource dataSource) {
        return new DataSourceTransactionManager(dataSource);
    }
```

然后在执行SQL的代码中加入手动事务管理：

```java
    @Autowired
    PlatformTransactionManager transactionManager;
    public void test(String address) {
        TransactionStatus txStatus = transactionManager.getTransaction(new DefaultTransactionDefinition());
        try {
           userMapper.update(address);
            int i = 5 / 0;
        } catch (Exception e) {
            // 发生异常回滚事务
            transactionManager.rollback(txStatus);
            throw e;
        }
        // 没有异常，提交事务
        transactionManager.commit(txStatus);
    }
```

执行操作，发生异常，发现数据没有变化，事务回滚成功。

### 声明式事务管理

大多数Spring Framework 用户选择声明式事务管理。此选项对应用程序代码的影响最小，因此最符合非侵入式轻量级容器的理想。

只需要添加@EnableTransactionManagement开启事务管理，然后在方法上添加@Transactional注解，就可以开启声明式事务管理。

首先在配置类加上@EnableTransactionManagement注解，并声明DataSourceTransactionManager的Bean对象。

```java
@Configuration
@MapperScan(basePackages = {
     "org.pearl.spring.mybatis.demo.dao"})
@EnableTransactionManagement
public class MyBatisConfig {
    /**
     * 注入SqlSessionFactoryBean
     */
    @Bean
    public SqlSessionFactory sqlSessionFactory() throws Exception {
        SqlSessionFactoryBean factoryBean = new SqlSessionFactoryBean();
        factoryBean.setDataSource(dataSource());
        return factoryBean.getObject();
    }
    /**
     * 设置Druid数据源，配置相关属性
     */
    @Bean
    public DataSource dataSource() {
        DruidDataSource druidDataSource = new DruidDataSource();
        druidDataSource.setUrl("jdbc:mysql://127.0.0.1:3306/angel_admin?serverTimezone=Asia/Shanghai");
        druidDataSource.setDriverClassName("com.mysql.cj.jdbc.Driver");
        druidDataSource.setUsername("root");
        druidDataSource.setPassword("123456");
        return druidDataSource;
    }
    @Bean
    public DataSourceTransactionManager transactionManager() {
        return new DataSourceTransactionManager(dataSource());
    }
}
```

然后直接在业务方法上加上 @Transactional注解。

```java
    @Transactional
    public void test(String address) {
        userMapper.update(address);
        int i = 5 / 0;
    }
```

执行操作，发生异常，发现数据没有变化，事务回滚成功。可以看到报错信息，有AOP和拦截器相关的类，说明@Transactional注解用到了AOP代理。
