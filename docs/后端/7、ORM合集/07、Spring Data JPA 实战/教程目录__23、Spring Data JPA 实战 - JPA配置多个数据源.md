# 23、Spring Data JPA 实战 - JPA配置多个数据源
- 来源：https://ddkk.com/zhuanlan/orm/springdatajpa/1/23.html
- 分类：ORM框架
- 分组：教程目录
使用之前配置的两个DataSource，配置类如下：

MultiDataSourceApplication：

```java
/**
 * 启动类
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
@EnableAsync
@SpringBootApplication
@EnableTransactionManagement
public class MultiDataSourceApplication{
    public static void main(String[] args) {
        SpringApplication.run(MultiDataSourceApplication.class, args);
    }
}
```

JpaDataSourceOneConfig：

```java
/**
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
@Configuration
@Profile("multi-datasource")
@AutoConfigureAfter(MultiDataSourceConfig.class)
@EnableJpaAuditing(auditorAwareRef = "idAuditorAwareImpl")
@EnableJpaRepositories(basePackages = "cn.caofanqi.study.studyspringdatajpa.repository",
        entityManagerFactoryRef = "entityManagerFactoryOne",
        transactionManagerRef = "transactionManagerOne")
public class JpaDataSourceOneConfig {
    @Resource
    private DataSource dataSourceOne;
    @Bean
    @Primary
    PlatformTransactionManager transactionManagerOne() {
        return new JpaTransactionManager(entityManagerFactoryOne().getObject());
    }
    @Bean
    @Primary
    LocalContainerEntityManagerFactoryBean entityManagerFactoryOne() {
        HibernateJpaVendorAdapter vendorAdapter = new HibernateJpaVendorAdapter();
        vendorAdapter.setGenerateDdl(true);
        vendorAdapter.setShowSql(true);
        LocalContainerEntityManagerFactoryBean factoryBean = new LocalContainerEntityManagerFactoryBean();
        factoryBean.setDataSource(dataSourceOne);
        factoryBean.setJpaVendorAdapter(vendorAdapter);
        factoryBean.setPackagesToScan("cn.caofanqi.study.studyspringdatajpa.pojo.domain");
        return factoryBean;
    }
    @Bean(name = "idAuditorAwareImpl")
    public AuditorAware<Long> idAuditorAwareImpl() {
        return new IdAuditorAwareImpl();
    }
}
```

JpaDataSourceTwoConfig：

```java
/**
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
@Configuration
@Profile("multi-datasource")
@AutoConfigureAfter(MultiDataSourceConfig.class)
@EnableJpaRepositories(basePackages = "cn.caofanqi.study.studyspringdatajpa.multijpa",
        entityManagerFactoryRef = "entityManagerFactoryTwo",
        transactionManagerRef = "transactionManagerTwo")
public class JpaDataSourceTwoConfig {
    @Resource
    private DataSource dataSourceTwo;
    @Bean
    PlatformTransactionManager transactionManagerTwo() {
        return new JpaTransactionManager(entityManagerFactoryTwo().getObject());
    }
    @Bean
    LocalContainerEntityManagerFactoryBean entityManagerFactoryTwo() {
        HibernateJpaVendorAdapter vendorAdapter = new HibernateJpaVendorAdapter();
        vendorAdapter.setGenerateDdl(true);
        vendorAdapter.setShowSql(true);
        LocalContainerEntityManagerFactoryBean factoryBean = new LocalContainerEntityManagerFactoryBean();
        factoryBean.setDataSource(dataSourceTwo);
        factoryBean.setJpaVendorAdapter(vendorAdapter);
        factoryBean.setPackagesToScan("cn.caofanqi.study.studyspringdatajpa.pojo.domain2");
        return factoryBean;
    }
}
```

测试用例类：

```java
@Rollback(false)
@SpringBootTest(classes = MultiDataSourceApplication.class)
@ActiveProfiles("multi-datasource")
class UserOrderRepositoryTest {
    @Resource
    private UserRepository userRepository;
    @Resource
    private UserOrderRepository userOrderRepository;
    @Resource
    private PlatformTransactionManager transactionManagerOne;
    @Resource
    private PlatformTransactionManager transactionManagerTwo;
    @Test
    @Transactional
    void testSaveUser() {
        User user = new User();
        user.setUsername("张三");
        user.setAge(23);
        user.setPhone("13656785678");
        userRepository.save(user);
    }
    @Test
    @Transactional
    void testSaveUserOrder() {
        User user = userRepository.findByUsername("张三");
        UserOrder userOrder = new UserOrder();
        userOrder.setOrderName(user.getUsername() + "的订单");
        userOrder.setUserId(user.getId());
        userOrder.setCreateTime(LocalDate.now());
        userOrderRepository.save(userOrder);
    }
    @Test
    @Transactional
    void testSave() {
        TransactionStatus statusOne = transactionManagerOne.getTransaction(new DefaultTransactionDefinition());
        TransactionStatus statusTwo = transactionManagerTwo.getTransaction(new DefaultTransactionDefinition());
        try {
            User user = new User();
            user.setUsername("李四");
            user.setAge(23);
            user.setPhone("123456");
            Long userId = userRepository.save(user).getId();
            int i = 1 / 0 ;
            UserOrder userOrder = new UserOrder();
            userOrder.setOrderName(user.getUsername() + "的订单");
            userOrder.setUserId(userId);
            userOrder.setCreateTime(LocalDate.now());
            userOrderRepository.save(userOrder);
            transactionManagerOne.commit(statusOne);
            transactionManagerTwo.commit(statusTwo);
        }catch (Exception e){
            transactionManagerOne.rollback(statusOne);
            transactionManagerTwo.rollback(statusTwo);
        }
    }
}
```

源码地址：https://github.com/caofanqi/study-spring-data-jpa
