# 16、Spring Data JPA 实战 - -@Version与@Lock
- 来源：https://ddkk.com/zhuanlan/orm/springdatajpa/1/16.html
- 分类：ORM框架
- 分组：教程目录
### 1、问题场景

以用户账户为例，如果允许同时对某个用户的账户进行修改的话，会导致某些修改被覆盖，使最后的结果不正确。

如：1.1、张三的账户中有100元。

1.2、张三的账户消费了50元。

1.3、张三的账户充值了100元。

我们希望的张三账户最终的结果是150元。如果1.2、1.3是并发执行的，按下面的方式执行的话，回事怎样的呢？

账户实体：

```java
/**
 * 账户实体
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
@Slf4j
@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Builder
@Table(name = "jpa_account")
@NoArgsConstructor
@AllArgsConstructor
public class Account extends AbstractID {
    /**
     *  简单代表一下账户所属人
     */
    private String accountName;
    @Column(columnDefinition = "DECIMAL(19, 2)")
    private BigDecimal balance;
}
```

Repository接口：

```java
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
public interface AccountRepository extends JpaRepositoryImplementation<Account,Long> {
    Account findByAccountName(String accountName);
}
```

Service：

```java
/**
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
@Service
public class AccountServiceImpl implements AccountService {
    @Resource
    private AccountRepository accountRepository;
    @Override
    @Transactional(rollbackFor = Exception.class)
    public String addAccountMoney(String accountName, BigDecimal money){
        System.out.println(Thread.currentThread().getName() + "，addAccountMoney start...");
        try {
            TimeUnit.SECONDS.sleep(1);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        Account account = accountRepository.findByAccountName(accountName);
        System.out.println(Thread.currentThread().getName() + "，find balance : " + account.getBalance());
        account.setBalance(account.getBalance().add(money));
        try {
            TimeUnit.SECONDS.sleep(1);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        Account result = accountRepository.save(account);
        System.out.println(Thread.currentThread().getName() + "， update balance end ,balance : " + result.getBalance());
        System.out.println(Thread.currentThread().getName() + "，addAccountMoney sleep...");
        try {
            TimeUnit.SECONDS.sleep(5);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println(Thread.currentThread().getName() + "，addAccountMoney end...");
        return "success";
    }
}
```

数据库表中数据：

测试用例：

```java
@Test
void addAccountMoney() throws InterruptedException {
    CountDownLatch count = new CountDownLatch(2);
    ExecutorService executorService = Executors.newFixedThreadPool(2);
    executorService.execute(() -> {
        String result = accountService.addAccountMoney("张三的账户", BigDecimal.valueOf(-50));
        System.out.println(Thread.currentThread().getName() + "，result : " + result);
        count.countDown();
    });
    TimeUnit.SECONDS.sleep(1);
    executorService.execute(() -> {
        String result = accountService.addAccountMoney("张三的账户", BigDecimal.valueOf(100));
        System.out.println(Thread.currentThread().getName() + "，result : " + result);
        count.countDown();
    });
    count.await(10, TimeUnit.SECONDS);
    Account endAccount = accountRepository.findByAccountName("张三的账户");
    System.out.println("final balance ：" + endAccount.getBalance());
}
```

控制台打印及数据库结果：

这明显不是我们想要的正确答案，那怎么解决呢？这里提供几个方法，①如果是单JVM的话，可以使用Java的同步机制和Lock（估计这种情况很少见吧...）。②使用JPA为我们提供的乐观锁@Version。

③使用JPA为我们提供的@Lock中的悲观锁。

### 2、@Version

JPA提供的乐观锁，指定实体中的字段或属性作为乐观锁的version，该version用于确保并发操作的正确性。每个实体只能使用一个version属性或字段。version支持（int, Integer, short, Short, long, Long, java.sql.Timestamp）类型的属性或字段。

使用起来非常方便，我们只需要在实体中添加一个字段，并添加@Version注解就可以了。加了@Version后，insert和update的SQL语句都会带上version的操作。当乐观锁更新失败的时候，会抛出异常org.springframework.orm.ObjectOptimisticLockingFailureException。我们自己进行业务处理。

实体修改如下：

```java
/**
 * 账户实体
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
@Slf4j
@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Builder
@Table(name = "jpa_account")
@NoArgsConstructor
@AllArgsConstructor
public class Account extends AbstractID {
    /**
     *  简单代表一下账户所属人
     */
    private String accountName;
    @Column(columnDefinition = "DECIMAL(19, 2)")
    private BigDecimal balance;
    /**
     * 乐观锁version
     */
    @Version
    private Integer version;
}
```

重新插入一条数据，可以看到数据库中如下

修改Service方法如下：

```java
@Override
@Transactional(rollbackFor = Exception.class)
public String addAccountMoney(String accountName, BigDecimal money){
    try {
        updateAccount(accountName, money);
        return "success";
    }catch (ObjectOptimisticLockingFailureException e){
        //记录日志，重新操作...
        return "fail";
    }
}
@Transactional(propagation = Propagation.REQUIRES_NEW,rollbackFor = Exception.class)
public void updateAccount(String accountName, BigDecimal money) {
    System.out.println(Thread.currentThread().getName() + "，addAccountMoney start...");
    try {
        TimeUnit.SECONDS.sleep(1);
    } catch (InterruptedException e) {
        e.printStackTrace();
    }
    Account account = accountRepository.findByAccountName(accountName);
    System.out.println(Thread.currentThread().getName() + "，find balance : " + account.getBalance());
    account.setBalance(account.getBalance().add(money));
    try {
        TimeUnit.SECONDS.sleep(1);
    } catch (InterruptedException e) {
        e.printStackTrace();
    }
    Account result = accountRepository.save(account);
    System.out.println(Thread.currentThread().getName() + "， update balance end ,balance : " + result.getBalance());
    System.out.println(Thread.currentThread().getName() + "，addAccountMoney sleep...");
    try {
        TimeUnit.SECONDS.sleep(5);
    } catch (InterruptedException e) {
        e.printStackTrace();
    }
    System.out.println(Thread.currentThread().getName() + "，addAccountMoney end...");
}
```

重新运行测试用例：

这样只有和我们上次版本一样的时候才会更新，就不会出现互相覆盖的问题，保证了数据的原子性。但是如果我们的业务就是需要让两次都必须成功，那么可以使用下面的悲观锁来实现。

### 3、@Lock

spring-data-jpa为我们提供了@Lock注解，指定查询方法要使用的锁定模式。可以添加在派生查询上，也可以重写父类CRUD的方法，添加该注解。@Lock只有一个value属性，为LockModeType枚举类型，我们主要看以下里面的悲观锁PESSIMISTIC_WRITE。

修改Repository如下：

```java
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
public interface AccountRepository extends JpaRepositoryImplementation<Account,Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Account findByAccountName(String accountName);
}
```

恢复数据库表数据为100，并将@Version注解去掉，运行测试用例控制台打印如下：

```java
pool-1-thread-1，addAccountMoney start...
pool-1-thread-2，addAccountMoney start...
Hibernate: select account0_.id as id1_0_, account0_.account_name as account_2_0_, account0_.balance as balance3_0_, account0_.version as version4_0_ from cfq_jpa_account account0_ where account0_.account_name=? for update
pool-1-thread-1，find balance : 100.00
Hibernate: select account0_.id as id1_0_, account0_.account_name as account_2_0_, account0_.balance as balance3_0_, account0_.version as version4_0_ from cfq_jpa_account account0_ where account0_.account_name=? for update
pool-1-thread-1， update balance end ,balance : 50.00
pool-1-thread-1，addAccountMoney sleep...
pool-1-thread-1，addAccountMoney end...
Hibernate: update cfq_jpa_account set account_name=?, balance=?, version=? where id=?
pool-1-thread-2，find balance : 50.00
pool-1-thread-1，result : success
pool-1-thread-2， update balance end ,balance : 150.00
pool-1-thread-2，addAccountMoney sleep...
Hibernate: select account0_.id as id1_0_, account0_.account_name as account_2_0_, account0_.balance as balance3_0_, account0_.version as version4_0_ from cfq_jpa_account account0_ where account0_.account_name=? for update
pool-1-thread-2，addAccountMoney end...
Hibernate: update cfq_jpa_account set account_name=?, balance=?, version=? where id=?
final balance ：150.00
2019-12-08 17:20:43.915  INFO 4160 --- [           main] o.s.t.c.transaction.TransactionContext   : Committed transaction for test: [DefaultTestContext@7674f035 testClass = AccountServiceImplTest, testInstance = cn.caofanqi.study.studyspringdatajpa.service.impl.AccountServiceImplTest@46d69ca4, testMethod = addAccountMoney@AccountServiceImplTest, testException = [null], mergedContextConfiguration = [WebMergedContextConfiguration@69e153c5 testClass = AccountServiceImplTest, locations = '{}', classes = '{class cn.caofanqi.study.studyspringdatajpa.StudySpringDataJpaApplication}', contextInitializerClasses = '[]', activeProfiles = '{}', propertySourceLocations = '{}', propertySourceProperties = '{org.springframework.boot.test.context.SpringBootTestContextBootstrapper=true}', contextCustomizers = set[org.springframework.boot.test.context.filter.ExcludeFilterContextCustomizer@9353778, org.springframework.boot.test.json.DuplicateJsonObjectContextCustomizerFactory$DuplicateJsonObjectContextCustomizer@1700915, org.springframework.boot.test.mock.mockito.MockitoContextCustomizer@0, org.springframework.boot.test.web.client.TestRestTemplateContextCustomizer@31c88ec8, org.springframework.boot.test.autoconfigure.properties.PropertyMappingContextCustomizer@0, org.springframework.boot.test.autoconfigure.web.servlet.WebDriverContextCustomizerFactory$Customizer@20ce78ec], resourceBasePath = 'src/main/webapp', contextLoader = 'org.springframework.boot.test.context.SpringBootContextLoader', parent = [null]], attributes = map['org.springframework.test.context.web.ServletTestExecutionListener.activateListener' -> true, 'org.springframework.test.context.web.ServletTestExecutionListener.populatedRequestContextHolder' -> true, 'org.springframework.test.context.web.ServletTestExecutionListener.resetRequestContextHolder' -> true]]
```

可以看到查询语句通过for update进行加锁。得到了我们想要的150结果。

注意：for update ，如果不通过索引条件检索数据，那么InnoDB将对表中的所有记录加锁，实际效果跟锁表一样。我们进行测试，在数据库中在添加一条记录，如下：

执行下面测试用例：

```java
    /**
     *  for update ，如果不通过索引条件检索数据，那么InnoDB将对表中的所有记录加锁，实际效果跟锁表一样
     */
    @Test
    void addAccountMoney2() throws InterruptedException {
        CountDownLatch count = new CountDownLatch(2);
        ExecutorService executorService = Executors.newFixedThreadPool(2);
        executorService.execute(() -> {
            String result = accountService.addAccountMoney("张三的账户", BigDecimal.valueOf(-50));
            System.out.println(Thread.currentThread().getName() + "，result : " + result);
            count.countDown();
        });
        TimeUnit.SECONDS.sleep(1);
        executorService.execute(() -> {
            String result = accountService.addAccountMoney("李四的账户", BigDecimal.valueOf(100));
            System.out.println(Thread.currentThread().getName() + "，result : " + result);
            count.countDown();
        });
        count.await(20, TimeUnit.SECONDS);
    }
```

控制台打印结果：

可以看到并不是并行进行的更新，我们就该实体类，重新生成数据库表，并插入数据（或直接修改数据库）

```java
/**
 * 账户实体
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
@Slf4j
@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Builder
@Table(name = "jpa_account")
@NoArgsConstructor
@AllArgsConstructor
public class Account extends AbstractID {
    /**
     *  简单代表一下账户所属人
     */
    @Column(unique = true,nullable = false)
    private String accountName;
    @Column(columnDefinition = "DECIMAL(19, 2)")
    private BigDecimal balance;
    /**
     * 乐观锁version
     */
//    @Version
    private Integer version;
}
```

重新运行测试用例：

我们在使用的过程中要根据自己的业务进行选择。

源码地址：https://github.com/caofanqi/study-spring-data-jpa
