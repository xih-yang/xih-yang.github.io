# 15、Spring Data JPA 实战 - Auditing与@MappedSuperclass
- 来源：https://ddkk.com/zhuanlan/orm/springdatajpa/1/15.html
- 分类：ORM框架
- 分组：教程目录
### 1、Auditing

一般我们针对一张表的操作需要记录下来，是谁修改的，修改时间是什么，Spring-Data为我们提供了支持。

1.1、在实体类中使用Spring-Data为我们提供的四个注解（也可以选择实现Auditable接口或继承AbstractAuditable类，推荐使用注解）

1.2、在实体上添加@EntityListeners(value = AuditingEntityListener.class)启动对当前实体的监听。

```java
/**
 *  测试spring-data为我们提供的审计功能
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
@Data
@Entity
@Builder
@Table(name = "jpa_audit_user")
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(value = AuditingEntityListener.class)
public class AuditUser {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true)
    private String name;
    @CreatedDate
    private LocalDateTime createdDate;
    @LastModifiedDate
    private LocalDateTime lastModifiedDate;
    @CreatedBy
    @ManyToOne
    private AuditUser createdBy;
    @LastModifiedBy
    @ManyToOne
    private AuditUser lastModifiedBy;
}
```

1.3、如果在实体中使用了@CreatedBy或者@LastModifiedBy需要实现AuditorAware接口，告诉Spring-Data当前审计用户是谁。（一般项目中从spring security或token中获取）

```java
/**
 * 获取当前的审计人,实际项目中可以从Spring Security中或Token/{session}中获取，这里只是举个例子进行模拟。
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
public class AuditorAwareImpl implements AuditorAware<AuditUser> {
    private Optional<AuditUser> currentUser = Optional.empty();
    public void setCurrentUser(AuditUser currentUser){
        this.currentUser = Optional.of(currentUser);
    }
    @Override
    public Optional<AuditUser> getCurrentAuditor() {
        //要使用的当前用户
        return currentUser;
    }
}
```

1.4、在启动类上添加@EnableJpaAuditing启动审计功能。

1.5、如果ApplicationContext中只有一个AuditorAware类型的bean，Spring-Date会自动选择，如果又多个，需要通过@EnableJpaAuditing注解的auditorAwareRef属性进行设置。

```java
/**
 * 启动类
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
@SpringBootApplication
@EnableAsync
@EnableJpaRepositories(
        /*queryLookupStrategy = QueryLookupStrategy.Key.CREATE_IF_NOT_FOUND*/
     /*   ,repositoryImplementationPostfix = "MyPostfix",*/
        /*repositoryBaseClass = MyRepositoryImpl.class*/)
@EnableJpaAuditing
public class StudySpringDataJpaApplication {
    public static void main(String[] args) {
        SpringApplication.run(StudySpringDataJpaApplication.class, args);
    }
    /**
     * 如果ApplicationContext中只有一个AuditorAware类型的bean，Spring-Date会自动选择，
     * 如果又多个，需要通过@EnableJpaAuditing注解的auditorAwareRef属性进行设置。
     */
    @Bean
    public AuditorAware<AuditUser> auditorProvider() {
        return new AuditorAwareImpl();
    }
}
```

1.6、测试用例，及生成的表

```java
@SpringBootTest
class AuditUserRepositoryTest {
    @Resource
    private AuditUserRepository auditUserRepository;
    @Resource
    private AuditorAwareImpl auditorAware;
    @Test
    void testAuditDate(){
        /*
         *不设置创建和修改时间，由springl-data替我们完成
         */
        AuditUser audit = AuditUser.builder().name("张三").build();
        AuditUser save = auditUserRepository.save(audit);
        System.out.println(save);
    }
    @Test
    void testAuditUser(){
        /*
         * 模拟当前用户
         */
        auditorAware.setCurrentUser(auditUserRepository.findByName("张三"));
        /*
         * 这里不设置是谁保存的，看spring-data是否会为我们完成
         */
        AuditUser audit = AuditUser.builder().name("李四").build();
        AuditUser save = auditUserRepository.save(audit);
        System.out.println(save);
    }
}
```

testAuditDate控制台打印：

testAuditUser控制台打印：

数据库表：

### 2、@MappedSuperclass

指定其映射信息应用于从其继承的实体的类。映射的超类没有为其定义单独的表。与MappedSuperclass注释指定的类可以以与实体相同的方式映射，除了映射仅适用于它的子类之外，因为映射超类本身不存在表。当应用于子类时，继承的映射将应用于子类表的上下文中。（说白了，就是将各实体中相同的属性提取到一个添加该注解的父类中，父类不会生成对应的表，但是各子实体类生成的对应表不变。）

这样我们就可以将通用的ID和Auditing相关的属性提取出来。

2.1、id抽象类

```java
/**
 * 抽象id父类
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
@Getter
@Setter
@ToString
@MappedSuperclass
public abstract class AbstractID {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
}
```

2.2、审计功能抽象类

```java
/**
 * 审计功能抽象类
 * @author caofnqi
 */
@Getter
@Setter
@ToString(callSuper = true)
@MappedSuperclass
@EntityListeners(value = AuditingEntityListener.class)
public abstract class AbstractAuditDomain extends AbstractID {
    @CreatedDate
    private LocalDateTime createdDate;
    @LastModifiedDate
    private LocalDateTime lastModifiedDate;
    @CreatedBy
    @Column(name = "create_by_user_id")
    private Long createdByUserId;
    @LastModifiedBy
    @Column(name = "last_modified_by_user_id")
    private Long lastModifiedUserBy;
}
```

2.3、实体类，可以根据是否需要用到选择继承id抽象类，还是审计抽象类

```java
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
@Getter
@Setter
@Entity
@Builder
@Table(name = "jpa_audit_person")
@NoArgsConstructor
@AllArgsConstructor
@ToString(callSuper = true)
public class AuditPerson extends AbstractAuditDomain {
    private String personName;
}
```

2.4、修改对应的AuditorAware实现，并指定auditorAwareRef

```java
/**
 * AuditorAware实现示例，根据自己业务进行实现
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
public class IdAuditorAwareImpl implements AuditorAware<Long> {
    private Optional<AuditUser> currentUser = Optional.empty();
    public void setCurrentUser(AuditUser currentUser){
        this.currentUser = Optional.of(currentUser);
    }
    @Override
    public Optional<Long> getCurrentAuditor() {
        return currentUser.map(AuditUser::getId);
    }
}
```

测试类似上面，这里就不贴了。

### 3、自定义实体监听

Auditing是通过JPA提供的@EntityListeners和@PrePersist、@PreUpdate来完成的。

@EntityListeners，指定要用于实体或映射超类的回调侦听器类。此注释可以应用于实体类或映射的超类。

属性：value，回调侦听器类。

以下注解为相应的生命周期事件指定回调方法。此注释可以应用于实体类、映射超类或回调侦听器类的方法。都是同步机制使用时要注意，可以在使用时，可以在方法中开启异步线程或消息队列。

@PrePersist，新增之前；@PostPersist，新增之后。

@PreUpdate，更新之前；@PostUpdate，更新之后。

@PreRemove,删除之前；@PostRemove，删除之后。

@PostLoad，加载之后。

我们以订单为例：

```java
/**
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
@Slf4j
@Getter
@Setter
@Entity
@Builder
@Table(name = "jpa_order")
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(value = OrderEntityListener.class)
public class Order extends AbstractAuditDomain{
    @Column(unique = true)
    private String orderNo;
    @Column(nullable = false)
    private OrderStatus orderStatus;
    @Column(nullable = false)
    private BigDecimal price;
    //其他属性....
    /*
     * 以下方法也可以写在监听类中
     */
//    @PrePersist
//    public void prePersist(){
//        this.setOrderStatus(OrderStatus.NEW);
//        log.info("orderNo: {}，status :{},新增之前修改订单状态为NEW",this.getOrderNo(),this.getOrderStatus());
//    }
//
//    @PostPersist
//    public void postPersist(){
//        log.info("orderNo: {}，status :{},新增之后，异步通知仓库进行处理",this.getOrderNo(),this.getOrderStatus());
//    }
//
//    @PostLoad
//    public void postLoad(){
//        log.info("orderNo: {}，status :{},加载之后...",this.getOrderNo(),this.getOrderStatus());
//    }
//
//    @PreUpdate
//    public void preUpdate(){
//        log.info("orderNo: {}，status :{},修改之前.....",this.getOrderNo(),this.getOrderStatus());
//    }
//
//    @PostUpdate
//    public void postUpdate(){
//        log.info("orderNo: {}，status :{},修改之后根据订单状态进行不同的判断",this.getOrderNo(),this.getOrderStatus());
//    }
//
//    @PreRemove
//    public void preRemove(){
//        log.info("orderNo: {}，status :{},删除之前.....",this.getOrderNo(),this.getOrderStatus());
//    }
//
//
//    @PostRemove
//    public void postRemove(){
//        log.info("orderNo: {}，status :{},删除之后.....",this.getOrderNo(),this.getOrderStatus());
//    }
}
```

```java
/**
 * 订单实体监听类
 * @author  caofanqi
 */
@Slf4j
public class OrderEntityListener {
    @PrePersist
    public void prePersist(Order order){
        order.setOrderStatus(OrderStatus.NEW);
        log.info("orderNo: {}，status :{},新增之前修改订单状态为NEW",order.getOrderNo(),order.getOrderStatus());
    }
    @PostPersist
    public void postPersist(Order order){
        log.info("orderNo: {}，status :{},新增之后，异步通知厂库进行处理",order.getOrderNo(),order.getOrderStatus());
    }
    @PostLoad
    public void postLoad(Order order){
        log.info("orderNo: {}，status :{},加载之后...",order.getOrderNo(),order.getOrderStatus());
    }
    @PreUpdate
    public void preUpdate(Order order){
        log.info("orderNo: {}，status :{},修改之前.....",order.getOrderNo(),order.getOrderStatus());
    }
    @PostUpdate
    public void postUpdate(Order order){
        log.info("orderNo: {}，status :{},修改之后根据订单状态进行不同的判断",order.getOrderNo(),order.getOrderStatus());
    }
    @PreRemove
    public void preRemove(Order order){
        log.info("orderNo: {}，status :{},删除之前.....",order.getOrderNo(),order.getOrderStatus());
    }
    @PostRemove
    public void postRemove(Order order){
        log.info("orderNo: {}，status :{},删除之后.....",order.getOrderNo(),order.getOrderStatus());
    }
}
```

测试新增：

测试查询和修改（图中红框中的为jpa save方法更新前自己运行的查询）：

测试查询和删除（图中红框中的为jpa delete方法更新前自己运行的查询）：

源码地址：https://github.com/caofanqi/study-spring-data-jpa
