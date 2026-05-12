# 03、分布式事务 实战 - Spring 事务的实现原理
- 来源：https://ddkk.com/zhuanlan/transaction/2/3.html
- 分类：分布式事务
- 分组：教程目录
## 一、Spring 事务原理

Spring 框架中支持对于事务的管理功能，开发人员使用 Spring 框架能够极大地简化对于数据库事务的管理操作

### 1.JDBC 直接操作事务

从本质上讲，Spring 事务是对数据库事务的进一步封装。也就是说，如果数据库不支持事务，Spring 也无法实现事务操作

使用JDBC 通过事务的方式操作数据库的步骤如下：

1）加载 JDBC 驱动：

```java
Class.forName("com.mysql.jdbc.Deiver");
```

2）建立与数据库的连接，后两个参数分别为账号和密码：

```java
Connection conn = DriverManager.getConnection(url, "root", "root");
```

3）开启事务：

```java
conn.setAutoCommit(true/false);
```

4）执行数据库的 CRUD 操作：

```java
PrepareStatement ps = conn.prepareStatement(sql);
//新增、修改、删除
ps.excuteUpdate();
//查询
ps.executeQuery();
```

5）提交或者回滚事务：

```java
//提交事务
conn.commit();
//回滚事务
conn.rollback();
```

6）关闭连接：

```java
ps.close();
conn.close();
```

### 2.使用 Spring 管理事务

如果使用 Spring 的事务功能，则不必手动开启事务、提交事务和回滚事务。而是将开启事务、提交事务和回滚事务的操作全部交由 Spring 框架自动完成，那么 Spring 是如何自动开启事务、提交事务和回滚事务的呢？

简单地说，就是在配置文件或者项目的启动类中配置 Spring 事务相关的注解驱动，在相关的类或者方法上标识 @Transactional 注解，即可开启并使用 Spring 的事务管理功能

Spring 框架在启动的时候会创建相关的 bean 实例对象，并且会扫描标注有相关注解的类和方法，为这些方法生成代理对象。如果扫描到标注有 @Transactional 注解的类或者方法时，会根据 @Transactional 注解的相关参数进行配置注入，在代理对象中会处理相应的事务，对事务进行管理。例如在代理对象中开启事务、提交事务和回滚事务。而这些操作都是 Spring 框架通过 AOP 代理自动完成的，无须开发人员过多关心其中的细节

### 3.Spring 事务分类

通过Spring 管理的事务可以分为逻辑事务和物理事务两大类：

- 逻辑事务：通常指通过 Spring 等框架管理的事务，这种事务是建立在物理事务之上的，比物理事务更加抽象
- 物理事务：通常指的是针对特定数据库的事务

Spring 支持两种事务声明方式，分别是编程式事务和声明式事务：

- 编程式事务：如果系统需要明确的事务，并且需要细粒度地控制各个事务的边界，此时建议使用编程式事务
- 声明式事务：如果系统对于事务的控制粒度较为粗糙，则建议使用声明式事务

### 4.Spring 事务超时

在实际工作中，对于某些性能要求比较高的应用，要求事务执行的时间尽可能短，此时可以给这些事务设置超时时间，一般事务的超时时间以秒为单位。如果事务的超时时间设置得过长，则于事务相关的数据就会被锁住，影响系统的并发性与整体性能。另外，因为检测事务超时的任务是在事务开始时启动的，所以事务超时机制对于程序在执行过程中会创建新事务的传播行为才有意义。需要注意的是，程序在执行过程中可能会创建新事务的传播类型有 REQUIRED、REQUIRES_NEW、NESTED 三种

### 5.Spring 事务回滚规则

使用Spring 管理事务，可以指定在方法抛出异常时，哪些异常能够回滚事务，哪些异常不回滚事务。默认情况下，在方法抛出 RuntimeException 时回滚事务，也可以手动指定回滚事务的异常类型，代码如下：

```java
@Transactional(rollbackFor = Exception.class)
```

这里需要注意的是，对于 Spring 事务，注解 @Transactional 中的 rollbackFor 属性可以指定 Thrrowable 异常类及其子类

## 二、Spring 事务三大接口

Spring 支持事务的管理功能，最核心的就是 Spring 事务的三大接口：PlatformTransactionManager、TransactionDefinition 和 TransactionStatus

### 1.PlatformTransactionManager 接口

通过Spring 源码可知，Spring 并不是直接管理事务的，而是提供了多种事务管理器。通过这些事务管理器，Spring 将事务管理的职责委托给了 Hibernate、MyBatis、JTA 等持久化框架的事务来实现

PlatformTransactionManager 接口位于 Spring 的 org.springframework.transaction 包下通过 PlatformTransactionManager 接口，Spring 为 Hibernate、MyBatis、JTA 等持久化框架提供了事务管理器，具体的实现由框架自己完成

PlatformTransactionManager 接口的源码如下所示：

```java
public interface PlatformTransactionManager{
	/**
	 *获取事务状态
	 */
	TransactionStatus getTransaction(@Nullable TransactionDefinition definition) throws TransactionException;
	/**
	 *提交事务
	 */
	void commit(TransactionStatus status) throws TransactionException;
	/**
	 *回滚事务
	 */
	void rollback(TransactionStatus status) throws TransactionException;
```

### 2.TransactionDefinition 接口

TransactionDefinition 接口位于 Spring 的 org.springframework.transaction 包下，主要定义了与事务相关的方法，表示事务属性的常量等信息。部分事务属性的常量与 Propagation 枚举类中的事务传播类型相对应

TransactionDefinition 接口的源码如下所示：

```java
public interface TransactionDefinition{
	/**
	 *支持当前事务，若当前没有事务就创建一个新的事务
	 */
	int PROPAGATION_REQUIRED = 0;
	/**
	 *如果当前存在事务，则加入该事务，如果当前没有事务，则以非事务的方式继续运行
	 */
	int PROPAGATION_SUPPORTS = 1;
	/**
	 *如果当前存在事务，则加入该事务，如果当前没有事务，则抛出异常
	 */
	int PROPAGATION_MANDATORY = 2;
	/**
	 *创建一个新的事务，如果当前存在事务，则把当前事务挂起
	 */
	int PROPAGATION_REQUIRES_NEW = 3;
	/**
	 *以非事务方式运行，如果当前存在事务，则把当前事务挂起
	 */
	int PROPAGATION_NOT_SUPPORTED = 4;
	/**
	 *以非事务方式运行，如果当前存在事务，则抛出异常
	 */
	int PROPAGATION_NEVER = 5;
	/**
	 *表示如果当前正有一个事务在运行中，则该方法运行在一个嵌套的事务中，
	  被嵌套的事务可以独立于封装的事务进行提交或者回滚（这里需要事务的保存点），
	  如果封装的事务不存在，后续事务行为同 PROPAGATION_REQUIRES NEW
	 */
	int PROPAGATION_NESTED = 6;
	/**
	 *使用后端数据库默认的隔离级别
	 */
	int ISOLATION_DEFAULT = -1;
	/**
	 *最低的隔离级别
	 */
	int ISOLATION_READ_UNCOMMITTED = Connection.TRANSACTION_READ_UNCOMMITTED;
	/**
	 *阻止脏读，但是可能会产生幻读或不可重复读的问题
	 */
	int ISOLATION_READ_COMMITEED = Connection.TRANSACTION_READ_COMMITTED;
	/**
	 *可以阻止脏读和不可重复读，但是可能会产生幻读
	 */
	int ISOLATION_REPEATABLE_READ = Connection.TRANSACTION_REPEATABLE_READ;
	/**
	 *可以防止脏读、不可重复读以及幻读
	 */
	int ISOLATION_SERIALIZABLE = Connection.TRANSACTION_SERIALIZABLE;
	/**
	 *使用默认的超时时间
	 */
	int TIMEOUT_DEFAULT = -1;
	/**
	 *获取事务的传播行为
	 */
	int getPropagationBehavior();
	/**
	 *获取事务的隔离级别
	 */
	int getIsolationLevel()'
	/**
	 *返回当前是否为只读事务
	 */
	boolean isReadOnly();
	/**
	 *获取事务的名称
	 */
	@Nullable
	String getName();
```

### 3.TransactionStatus 接口

TransactionStatus 接口主要用来存储事务执行的状态，并且定义了一组方法，用来判断或者读取事务的状态信息

TransactionStatus 接口的源码如下所示：

```java
public interface TransactionStatus extends SavepointManager, Flushable {
	/**
	 *判断是否是新事务
	 */
	boolean isNewTransaction();
	/**
	 *是否有保存点
	 */
	boolean hasSavePoint();
	/**
	 *设置为只回滚
	 */
	void setRollbackOnly();
	/**
	 *将事务涉及的数据刷新到磁盘
	 */
	@Override
	void flush();
	/**
	 *判断当前事务是否已经完成
	 */
	boolean isCompleted();
}
```

## 三、Spring 事务隔离级别

Spring 中存在 5 中隔离级别，分别为 ISOLATION_DEFAULT、ISOLATION_READ_UNCOMMITTED、ISOLATION_READ_COMMITTED、ISOLATION_REPEATABLE_READ、ISOLATION_SERIALIZABLE

### 1.ISOLATION_DEFAULT 隔离级别

ISOLATION_DEFAULT 隔离级别是 Spring 中 PlatformTransactionManager 默认的事务隔离级别。也就是说，将 Spring 的事务隔离级别设置为 ISOLATION_DEFAULT 时，Spring 不做事务隔离级别的处理，会直接使用数据库默认的事务隔离级别

### 2.ISOLATION_READ_UNCOMMITTED 隔离级别

ISOLATION_READ_UNCOMMITTED 隔离级别是 Spring 中最低的隔离级别。当 Spring 中的隔离级别设置为 ISOLATION_READ_UNCOMMITTED 时，事务 A 能够读取到事务 B 未提交的数据。在这种隔离级别下，虽然脏读的问题解决了，但是可能会产生不可重复读和幻读的问题。相当于 MySQL 中的已提交读隔离级别

### 3.ISOLATION_READ_COMMITTED 隔离级别

ISOLATION_READ_COMMITTED 隔离级别能够保证事务 A 修改的数据提交之后才能被事务 B 读取，事务 B 不能读取事务 A 未提交的数据。在这种隔离级别下，虽然脏读的问题解决了，但是可能会产生不可重复读和幻读的问题。相当于 MySQL 中的已提交读隔离级别

### 4.ISOLATION_REPEATABLE_READ 隔离级别

ISOLATION_REPEATABLE_READ 隔离级别能够保证不会产生脏读和不可重复读的问题，但是可能会产生幻读的问题。事务 A 第一次按照一定的查询条件从数据表中查询出数据后，事务 B 向同一个数据表中插入了符合事务 A 查询条件的数据，事务 A 再次从数据表中查询数据时，会将事务 B 插入的数据查询出来。相当于 MySQL 中的可重复读隔离级别

### 5.ISOLATION_SERIALIZABLE 隔离级别

在ISOLATION_SERIALIZABLE 隔离级别下，事务只能够按照特定的顺序执行，也就是多个事务之间只能够按照串行化的顺序执行。这时最可靠的隔离级别，然而这种可靠性付出了极大的代价，也就是牺牲了并发性，相当于 MySQL 中的串行化隔离级别

## 四、Spring 事务传播机制

Spring 事务传播机制主要定义了 7 种类型，分别是 REQUIRED、SUPPORTS、MANDATORY、REQUIRES_NEW、NOT_SUPPORTED、NEVER、NESTED，如下表所示：

### 1.7 种事务传播机制类型

Spring 种事务传播机制的类型是通过枚举的方式定义的，源码在 org.springframework.transaction.annotation.Propagation 枚举类中，如下所示：

```java
public enum Propagation{
	REQUIRED(TransactionDefinition.PROPAGATION_REQUIRED),
	SUPPORTS(TransactionDefinition.PROPAGATION_SUPPORTS),
	MANDATORY(TransactionDefinition.PROPAGATION_MANDATORY),
	REQUIRES_NEW(TransactionDefinition.PROPAGATION_REQUIRES_NEW),
	NOT_SUPPORTED(TransactionDefinition.PROPAGATION_NOT_SUPPORTED),
	NEVER(TransactionDefinition.PROPAGATION_NEVER),
	NESTED(TransactionDefinition.PROPAGATION_NESTED);
	private final int value;
	Propagation(int value){
		this.value = value;
	}
	public int value(){
		return this.value;
	}
}
```

通过枚举类 Propagation 的源码可以看出，Propagation 类中的每个枚举项都与 TransactionDefinition 接口中定义的常量相对应

这里需要说明的是，枚举类 Propation 结合 @Transactional 注解使用，枚举类中定义的事务传播行为类型与 TransactionDefinition 接口中定义的事务传播类型相对应。在使用 @Transactional 注解时，使用的是 Propagation 枚举类中的事务传播类型，而不是直接使用 TransactionDefinition 接口中定义的事务传播类型

**REQUIRED 事务传播类型**

REQUIRED 事务传播类型表示如果当前没有事务，就创建一个事务，如果已经存在一个事务，就加入这个事务。这是最常见的事务传播类型，也是 Spring 中默认的事务传播类型。外部不存在事务时，开启新的事务，外部存在事务时，将其加入外部事务中。如果调用端发生异常，则调用端和被调用端的事务都将回滚

在这种事务传播类型下，当前操作必须在一个事务中执行

**REQUIRES_NEW 事务传播类型**

REQUIRES_NEW 事务传播类型表示如果当前存在事务，则把当前事务挂起，并重新创建新的事务并执行，直到新的事务提交或者回滚，才会恢复执行原来的事务。这种事务传播类型具备隔离性，将原有事务和新创建的事务隔离，原有事务和新创建的事务的提交和回滚互不影响。新创建的事务和被挂起的事务没有任何关系，它们是两个不相干的独立事务。外部事务执行失败后回滚，不会回滚内部事务的执行结果。内部事务执行失败抛出异常，被外部事务捕获到时，外部事务可以不处理内部事务的回滚操作

**SUPPORTS 事务传播类型**

SUPPORTS 事务传播类型表示支持当前事务，如果当前没有事务，就以非事务的方式执行。外部不存在事务时，不会开启新的事务，外部存在事务时，将其加入外部事务

**MANDATORY 事务传播类型**

MANDATORY 事务传播类型表示支持当前事务，这种事务传播类型具备强制性，当前操作必须存在事务，如果不存在，则抛出异常

**NOT_SUPPORTED 事务传播类型**

NOT_SUPPORTED 事务传播类型表示以非事务方式执行，如果当前操作在一个事务中，则把当前事务挂起，直到当前操作完成再恢复事务的执行。如果当前操作存在事务，则把事务挂起，以非事务的方式运行

**NEVER 事务传播类型**

NEVER 事务传播类型表示以非事务的方式执行，如果当前操作存在事务，则抛出异常

NEVER 事务传播类型和 NOT_SUPPORTED 事务传播类型的区别是如果当前存在事务，则 NEVER 事务传播类型会抛出异常，而 NOT_SUPPORTED 事务传播类型会把当前事务挂起，以非事务的方式执行。NEVER 事务传播类型与 MANDATORY 事务传播类型的区别是 NEVER 事务传播类型表示如果当前操作存在事务，则抛出异常，而 MANDATORY 事务传播类型表示如果当前操作不存在事务，则抛出异常

**NESTED 事务传播类型**

NESTED 事务传播类型表示如果当前方法有一个事务正在运行，则这个方法应该运行在一个嵌套事务中，被嵌套的事务可以独立于被封装的事务进行提交或者回滚。如果没有活动事务，则按照 REQUIRED 事务传播类型执行

如果封装事务存在，并且外层事务抛出异常回滚，那么内层事务必须回滚。如果内层事务回滚，则并不影响外层事务的提交和回滚。如果封装事务不存在，则按照 REQUIRED 事务传播类型执行

### 2.常用的事务传播类型

虽然Spring 提供了 7 种事务传播机制类型，但是在日常工作中经常使用的只有 REQUIRED、NOT_SUPPORTED 和 REQUIRES_NEW 这 3 种

## 五、Spring 事务嵌套的场景

电商场景中一个典型的操作就是下单减库存，本小节将以下单减库存的场景为例，说明 Spring 事务传播机制的使用方法。共有两个事务，外部事务为提交订单，内部事务为减库存，并且在内部方法末尾添加异常代码（int i = 1 / 0;）

**场景一：外部方法无事务注解，内部方法添加 REQUIRED 事务传播类型**

当内部方法执行出现异常时，外部方法不受影响，将向数据库保存订单信息，而内部方法将执行失败抛出异常，并且不会扣减库存

**场景二：外部方法添加 REQUIRED 事务传播类型，内部方法无事务注解**

当内部方法执行出现异常时，会影响外部方法，即使外部方法正常执行，也会导致外部方法的事务回滚，订单信息不会保存，库存也不会扣减

**场景三：外部方法添加 REQUIRED 事务传播类型，内部方法添加 REQUIRED 事务传播类型**

当内部方法执行出现异常时，会影响外部方法，即使外部方法正常执行，也会导致外部方法的事务回滚，订单信息不会保存，库存也不会扣减

**场景四：外部方法添加 REQUIRED 事务传播类型，内部方法添加 NOT_SUPPORTED 事务传播类型**

当内部方法执行出现异常时，由于内部方法是 NOT_SUPPORTED 事务传播类型，且数据库操作合法，因此内部事务不会回滚，库存正常扣减。外部方法会执行失败，外部事务会回滚，订单信息不会保存

**场景五：外部方法添加 REQUIRED 事务传播类型，内部方法添加 REQUIRES_NEW 事务传播类型**

当内部方法执行出现异常时，会影响外部方法，即使外部方法正常执行，也会导致外部方法的事务回滚，订单信息不会保存，库存也不会扣减

**场景六：外部方法添加 REQUIRED 事务传播类型，内部方法添加 REQUIRES_NEW 事务传播类型，并且把异常代码移动到外部方法的末尾**

内部方法正常执行，并且内部事务正常提交，库存扣减，外部方法执行出现异常，外部事务回滚，订单信息不会保存

**场景七：外部方法添加 REQUIRED 事务传播类型，内部方法添加 REQUIRES_NEW 事务传播类型，并且把异常代码移动到外部方法的末尾，同时外部方法和内部方法在同一个类中（正常情况下，提交订单应该在 OrderServer 类中，扣减库存应该在 ProductService 类中）**

内部方法正常执行，外部方法执行出现异常，外部事务回滚，订单信息不会保存，且库存也不会扣减，这是由于内部事务失效造成的

Spring 在扫描 Bean 的时候，会扫描方法上的 @Transaction 注解，并生成一个包含代理方法的代理类。当一个方法被调用时，会检测该方法上是否有 @Transaction 注解，如果有就调用代理类的代理方法，如果没有就直接调用该方法。但是有一个特殊情况，如果调用方法和被调用方法在同一个类中，那么调用时不会调用代理方法，而是直接调用，这就导致了 Spring 无法对事务的传播行为做处理

解决方案是在当前类中注入代理类对象，并直接使用代理类调用内部方法：

```java
OrderService proxyObj = (OrderService)AopContext.currentProxy();
proxy.updateProductStockCountById(stockCount, id);
```

但是需要在 SpringBoot 启动类上添加注解：

```java
@EnableAspectJAutoProxy(exposeProxy = true)
```

## 六、Spring 事务失效的场景

在日常工作中，如果 Spring 的事务管理功能使用不当，会造成 Spring 事务不生效的问题

### 1.数据库不支持事务

Spring 事务生效的前提是连接的数据库支持事务，如果底层的数据库不支持事务，则 Spring 的事务肯定会失效。例如，使用的数据库为 MySQL，并且选用了 MyISAM 存储引擎，则 Spring 的事务就会失效

### 2.事务方法未被 Spring 管理

如果事务方法所在的类没有加载到 Spring IOC 容器中，也就是说，事务方法所在的类没有被 Spring 管理，则 Spring 事务会失效，示例如下：

```java
public class ProductService{
	@Autowired
	private ProductDao productDao;
	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public void updateProductStockCountById(Integer stockCount, Long id){
		productDao.updateProductStockCountById(stockCount, id);
	}
}
```

ProductService 类上没有添加 @Service 注解，Product 的实例也没有加载到 Spring IOC 容器中，就会造成 updateProductStockCountById() 方法的事务在 Spring 中失效

### 3.方法没有被 public 修饰

如果事务所在的方法没有被 public 修饰，此时 Spring 的事务会失效，示例如下：

```java
@Service
public class ProductService{
	@Autowired
	private ProductDao productDao;
	@Transactional(propagation = Propagation.REQUIRES_NEW)
	private void updateProductStockCountById(Integer stockCount, Long id){
		productDao.updateProductStockCountById(stockCount, id);
	}
}
```

Spring 在扫描 Bean 的时候，会扫描方法上的 @Transaction 注解，并生成一个包含代理方法的代理类。当一个方法被调用时，会检测该方法上是否有 @Transaction 注解，如果有就调用代理类的代理方法，如果没有就直接调用该方法。代理类实际上是被代理类的子类，因此无法继承私有方法，进而导致该方法的事务在 Spring 中失效

### 4.同一类中的方法调用

如果同一个类中的两个方法 A 和 B 上均添加了事务注解，方法 A 调用方法 B，则方法 B 的事务会失效，失效原因在上文已经详细阐述，这里不再重复

### 5.未配置事务管理器

如果在项目中没有配置 Spring 的事务管理器，即使使用了 Spring 的事务管理功能，Spring 的事务也不会生效，例如没有在项目的配置类中配置如下代码：

```java
@Bean
public PlatformTransactionManager transactionManager(DataSource dataSource){
	return new DataSourceTransactionManager(dataSource);
}
```

### 6.方法的事务传播类型不支持事务

如果内部方法的事务传播类型为 NOT_SUPPORTED，则内部方法的事务在 Spring 中就会失效

### 7.不正确地捕获异常

在内部方法中使用 try-catch 代码块捕获了异常，即使内部方法抛出异常，也会被 catch 代码块捕获，此时内部方法的事务会提交而不会回滚，外部方法的事务自然也不会受到影响，这就造成了 Spring 事务回滚失效的问题

### 8.标注错误的异常类型

如果在@Transactional 注解中标注了错误的异常类型，则 Spring 事务的回滚会失效，示例如下：

```java
@Transactional(propagation = Propagation.REQUIRED)
public void updateProductStockCountById(Integer stokcCount, Long id){
	try{
		productDao.updateProductStockCountById(stockCount, id);
	}catch(Excption e){
		logger.error("扣减库存异常：", e.getMessage());
		throw new Exception("扣减库存异常");
	}
}
```

在updateProductStockCountById() 方法中捕获了异常，并且在异常中抛出了 Exception 类型的异常，此时 updateProductStockCountById() 方法事务的回滚会失效。为何会失效呢？这是因为 Spring 中默认回滚的事务异常类型为 RuntimeException，而上述代码抛出的是 Exception 异常。默认情况下，Spring 事务中无法捕获到 Exception 异常，此时 updateProductStockCountById() 方法事务的回滚会失效

此时可以手动指定 updateProductStockCountById() 方法标注的事务异常类型，如下所示：

```java
@Transactional(propagation = Pagation.REQUIRED, rollbackFor = Exception.class)
```

这里需要注意的是，Spring 事务注解 @Transactional 中的 rollbackFor 属性可以指定 Throwable 异常类及其子类
