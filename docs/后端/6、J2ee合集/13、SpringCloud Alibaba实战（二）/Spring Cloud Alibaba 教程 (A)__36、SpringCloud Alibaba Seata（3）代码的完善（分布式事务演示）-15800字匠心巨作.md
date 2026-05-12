# 36、SpringCloud Alibaba Seata（3）代码的完善（分布式事务演示）-15800字匠心巨作
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/2/69.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
## 1.数据库表导入

- 在测试分布式事务之前，我们需要先设计数据库，以及准备测试数据。
- 新建数据库，命名为：seata

创建表（导入 Sql）

```sql
/*
Navicat MySQL Data Transfer
Source Server         : Mysql
Source Server Version : 80019
Source Host           : localhost:3306
Source Database       : seata
Target Server Type    : MYSQL
Target Server Version : 80019
File Encoding         : 65001
Date: 2020-05-21 16:22:26
*/
SET FOREIGN_KEY_CHECKS=0;
-- ----------------------------
-- Table structure for account_tbl
-- ----------------------------
DROP TABLE IF EXISTS account_tbl;
CREATE TABLE account_tbl (
  id int NOT NULL AUTO_INCREMENT,
  user_id varchar(255) DEFAULT NULL,
  money int DEFAULT '0',
  PRIMARY KEY (id)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;
-- ----------------------------
-- Records of account_tbl
-- ----------------------------
INSERT INTO account_tbl VALUES ('1', 'DQCGM_USER_1', '10000');
INSERT INTO account_tbl VALUES ('2', 'DQCGM_USER_2', '10000');
-- ----------------------------
-- Table structure for order_tbl
-- ----------------------------
DROP TABLE IF EXISTS order_tbl;
CREATE TABLE order_tbl (
  id int NOT NULL AUTO_INCREMENT,
  user_id varchar(255) DEFAULT NULL,
  commodity_code varchar(255) DEFAULT NULL,
  count int DEFAULT '0',
  money int DEFAULT '0',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
-- ----------------------------
-- Records of order_tbl
-- ----------------------------
-- ----------------------------
-- Table structure for storage_tbl
-- ----------------------------
DROP TABLE IF EXISTS storage_tbl;
CREATE TABLE storage_tbl (
  id int NOT NULL AUTO_INCREMENT,
  commodity_code varchar(255) DEFAULT NULL,
  count int DEFAULT '0',
  PRIMARY KEY (id),
  UNIQUE KEY commodity_code (commodity_code)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;
-- ----------------------------
-- Records of storage_tbl
-- ----------------------------
INSERT INTO storage_tbl VALUES ('1', 'HUAWEI_0001', '10');
INSERT INTO storage_tbl VALUES ('2', 'XIAOMI_002', '10');
-- ----------------------------
-- Table structure for undo_log
-- ----------------------------
DROP TABLE IF EXISTS undo_log;
CREATE TABLE undo_log (
  id bigint NOT NULL AUTO_INCREMENT,
  branch_id bigint NOT NULL,
  xid varchar(100) NOT NULL,
  context varchar(128) NOT NULL,
  rollback_info longblob NOT NULL,
  log_status int NOT NULL,
  log_created datetime NOT NULL,
  log_modified datetime NOT NULL,
  ext varchar(100) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY ux_undo_log (xid,branch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
-- ----------------------------
-- Records of undo_log
-- ----------------------------
```

- 表有如下：

- account ：用户的账号表
- Order：订单表；
- Stoage：商品的库存表；
- undo_log：回滚事务表，SEATA AT 模式需要 UNDO_LOG 表。

## 2.模型对象和 Mapper 对象生成

使用 IDEA 连接数据库：

成功后，如图所示：

执行代码的生成：

提示：若大家没有安装 mybatis 的代码生成插件，还请自行安装，或者手动编译

Account_tbl:

Order_tbl:

Storage_tbl:

## 3.storage-service 代码的完善

### 3.1 接口设计

- 在 storage-service 里面，主要完成对库存的扣减
- 新建一个接口：

- 命名为：StorageService，代码如下：

代码如下：

```java
public interface StorageService {
	/**
	* 扣减商品的库存 
	* @param commodityCode 
	* 商品的编码 
	* @param count 
	* 扣减商品的数量 
	*/ 
	void deduct(String commodityCode, int count); 
}
```

### 3.2 实现该接口

名称为：impl.StorageService，代码的实现如下：

```java
@Service 
public class StorageServiceImpl implements StorageService {
	private static Logger logger = LoggerFactory.getLogger(StorageServiceImpl.class);
	@Autowired 
	private StorageTblMapper storageTblMapper;
	@Override 
	public void deduct(String commodityCode, int count) {
		logger.info("开始扣减库存，商品编码：{}，数量：{}", commodityCode, count);
		StorageTbl storageTbl = storageTblMapper.selectOne(new LambdaQueryWrapper<StorageTbl>().eq(StorageTbl::getCommodityCode, commodityCode));
		int idleCount = storageTbl.getCount() - count;
		if (idleCount < 0) {
			throw new RuntimeException("库存不足"); 
		}
		storageTbl.setCount(idleCount);
		storageTblMapper.updateById(storageTbl);
		logger.info("库存扣减成功，商品编码：{}，剩余数量：{}", commodityCode, idleCount);
	}
}
```

### 3.3 使用 Restful 暴露此接口

添加一个 Controller

代码如下：

```java
@RestController 
public class StorageController {
	private static Logger logger = LoggerFactory.getLogger(StorageController.class) ;
	@Autowired 
	private StorageService storageService ;
	/**
	* 扣减商品的库存 
	* @param commodityCode 商品的编码 
	* @param count 商品的数量 
	* @return 
	*/
	@GetMapping("/deduct/{commodityCode}/{count}") 
	public ResponseEntity<Void> deduct(@PathVariable("commodityCode") String commodityCode, @PathVariable("count") Integer count){
		logger.info("Account Service ... xid: " + RootContext.getXID());
		// 开始扣减库存
		storageService.deduct(commodityCode , count);
		return ResponseEntity.ok().build() ;
	}
}
```

### 3.4 添加配置文件

内容如下：

```sh
server: 
	port: 18084
spring: 
	application: 
		name: storage-service
	cloud: 
		alibaba: 
			seata: 
				tx-service-group: storage-service
		nacos: 
			discovery: 
				server-addr: localhost:8848
	datasource:
		name: storageDataSource 
		type: com.alibaba.druid.pool.DruidDataSource 
		username: root 
		password: root 
		driver-class-name: com.mysql.cj.jdbc.Driver
		url: jdbc:mysql://localhost:3306/seata?useSSL=false&serverTimezone=UTC
		druid:
			max-active: 20 
			min-idle: 2 
			initial-size: 2
seata: 
	service: 
		vgroup-mapping: 
			account-service: default
		grouplist: 
			default: 127.0.0.1:8091
		disable-global-transaction: false
	enabled: true 
mybatis-plus:
	mapper-locations: classpath:/mapper/*.xml
```

### 3.5 添加启动类

```java
@SpringBootApplication 
@EnableDiscoveryClient 
@MapperScan("com.dqcgm.mapper") 
public class StorageServiceApplication {
	public static void main(String[] args) {
		SpringApplication.run(StorageServiceApplication.class ,args) ; 
	} 
}
```

### 3.6 启动项目测试

启动项目后，打印该日志，说明连接 seata-server 成功。

## 4.account-service 代码的完善

### 4.1 接口设计

- 在 account-service 里面，主要完成对用户余扣减
- 新建一个接口：

命名为：AccountService，代码如下：

代码如下：

```java
public interface AccountService {
	/**
	* 从用户的账号扣减金额 
	* @param userId 
	* 用户的 Id 
	* @param money 
	* 金额 
	*/ 
	void debit(String userId, int money); 
}
```

### 4.2 实现该接口

名称为：impl.StorageService，代码的实现如下：

```java
@Service 
public class AccountServiceImpl implements AccountService {
	@Autowired 
	private AccountTblMapper accountTblMapper;
	private static Logger logger = LoggerFactory.getLogger(AccountServiceImpl.class);
	@Override 
	public void debit(String userId, int money) {
		logger.info("准备扣减用户：{} 余额，扣减的数目为：{}", userId, money);
		AccountTbl accountTbl = accountTblMapper.selectOne(new LambdaQueryWrapper<AccountTbl>().eq(AccountTbl::getUserId, userId));
		int idleMoney = accountTbl.getMoney() - money;
		if (idleMoney < 0) {
			throw new RuntimeException("用户余额不足"); 
		}
		accountTbl.setMoney(idleMoney);
		accountTblMapper.updateById(accountTbl);
		logger.info("扣减用户{}金额成功，剩余金额为{}", userId, money);
	}
}
```

### 4.3 使用 Restful 暴露此接口

添加一个 Controller

- 名称为：
- 代码如下：

```java
@RestController 
public class AccountController {
	@Autowired 
	private AccountService accountService ;
	private static Logger logger = LoggerFactory.getLogger(AccountController.class) ;
	@GetMapping("/debit/{userId}/{money}") 
	public ResponseEntity<Void> debit( @PathVariable("userId") String userId, @PathVariable("money") Integer money){
		logger.info("Account Service ... xid: " + RootContext.getXID());
		// 开始扣减余额 
		accountService.debit(userId , money); 
		return ResponseEntity.ok().build() ;
	}
}
```

### 4.4 添加配置文件

在 resource 目录里面新建配置文件：

内容如下：

```sh
server: 
	port: 18085
spring: 
	application: 
		name: account-service
	cloud: 
		alibaba: 
			seata: 
				tx-service-group: account-service
		nacos: 
			discovery: 
				server-addr: localhost:8848
	datasource:
		type: com.alibaba.druid.pool.DruidDataSource
		username: root
		password: root
		driver-class-name: com.mysql.cj.jdbc.Driver
		url: jdbc:mysql://localhost:3306/seata?useSSL=false&serverTimezone=UTC
		druid:
			max-active: 20
			min-idle: 2
			initial-size: 2
seata: 
	service: 
		vgroup-mapping: 
			account-service: default
		grouplist: 
			default: 127.0.0.1:8091
		disable-global-transaction: false
	enabled: true
mybatis-plus:
	mapper-locations: classpath:/mapper/*.xml
```

### 4.5 添加启动类

命名为 AccountServiceApplication ，代码如下：

```java
@SpringBootApplication 
@EnableDiscoveryClient 
@MapperScan("com.dqcgm.mapper") 
public class AccoutServiceApplication {
	public static void main(String[] args) {
		SpringApplication.run(AccoutServiceApplication.class ,args) ; 
	} 
}
```

### 4.6 启动项目测试

启动项目后，打印该日志，说明连接 seata-server 成功

## 5.order-service 代码的完善

### 5.1 接口设计

- 在 order-service 里面，主要完成保存用户订单的操作。
- 新建一个接口：

命名为：OrderService，代码如下：

代码如下：

```java
public interface OrderService {
	/**
	* 创建一个订单 
	* @param userId 用户 id 
	* @param commodityCode 商品的编号 
	* @param orderCount 商品的数量 
	* @return OrderTbl 
	*/
	OrderTbl create(String userId, String commodityCode, int orderCount) ;
}
```

### 5.2 实现该接口

名称为：impl.OrderService，代码的实现如下：

```java
@Service 
public class OrderServiceImpl implements OrderService {
	@Autowired 
	private OrderTblMapper orderTblMapper;
	@Autowired 
	private AccountService accountService;
	private static Logger logger = LoggerFactory.getLogger(OrderServiceImpl.class);
	@Override public OrderTbl create(String userId, String commodityCode, int orderCount){
		logger.info("准备为{}创建一个订单,商品编号为{}，数量为{}", userId,commodityCode, orderCount);
		// 1 计算总金额
		int orderMoney = calculate(commodityCode, orderCount);
		accountService.debit(userId, orderMoney);
		OrderTbl order = new OrderTbl();
		order.setUserId(userId);
		order.setCommodityCode(commodityCode);
		order.setCount(orderCount);
		order.setMoney(orderMoney);
		orderTblMapper.insert(order);
		// INSERT INTO orders ...
		return order;
	}
	private int calculate(String commodityCode, int orderCount) {
		// 我们现在没有商品的表，在此我们把商品的价格定死
		int prodPrice = 0 ;
		if("HUAWEI_0001".equals(commodityCode)){
      // 华为时 100
			prodPrice = 100;
		}else if ("XIAOMI_002".equals(commodityCode)){
      // 小米时 200
			prodPrice = 200 ; 
		}else {
			prodPrice = 1000 ; // 其他为 1000 
		}
		return orderCount * prodPrice ;
	}
}
```

### 5.3 远程调用 account-service 的实现

创建一个 AccountService 的类，该类里面主要完成对 accout-servic 的远程调用

名称为：

```java
//实现对账号服务的远程调用
@Service 
public class AccountService {
	private static Logger logger = LoggerFactory.getLogger(AccountService.class) ;
	//1.ribbon 的方式
	@Autowired 
	private RestTemplate restTemplate ;
	//2.feign 的方式
	public void debit(String userId, int orderMoney) {
		ResponseEntity<Void> entity = restTemplate.getForEntity( "http://accout-service/debit/{userId}/{orderMoney}", Void.class, userId, orderMoney );
		if(entity.getStatusCode()== HttpStatus.OK){
			logger.info("扣减用户{}金额成功，本次扣减的数目为{}",userId,orderMoney);
			return ;
		}
		logger.info("扣减用户{}金额失败",userId);
		throw new RuntimeException("扣减金额失败") ;
	}
}
```

我们在此使用的时 Ribbon 做远程调用，下一博文我也会测试 Feign

### 5.4 Ribbon 集成

创建一个配置类：

代码如下：

```java
@Configuration 
public class HttpUtilConfig {
	@LoadBalanced 
	@Bean 
	public RestTemplate restTemplate(){
		return new RestTemplate() ; 
	} 
}
```

### 5.5 使用 Restful 暴露此接口

添加一个 Controller

命名为：

代码如下：

```java
@RestController 
public class OrderController {
	private static Logger logger = LoggerFactory.getLogger(OrderController.class) ;
	@Autowired 
	private OrderService orderService ;
	/**
	* 创建订单 
	* @param userId 
	* 用户 Id 
	* @param commodityCode 
	* 商品的编号
	* @param orderCount 
	* 商品的数量 
	* @return 
	*/
	@GetMapping("/create/{userId}/{commodityCode}/{orderCount}") 
	public ResponseEntity<Void> create(@PathVariable("userId") String userId, @PathVariable("commodityCode") String commodityCode, @PathVariable("orderCount") int orderCount){
		logger.info("Order Service ... xid: " + RootContext.getXID());
		orderService.create(userId, commodityCode, orderCount) ;
		return ResponseEntity.ok().build() ;
	}
}
```

### 5.6 添加配置文件

- 在 resource 目录里面新建配置文件：

- 命名为：application.yml
- 内容如下：

```sh
server: 
	port: 18086
spring: 
	application: 
		name: order-service
	cloud: 
		alibaba: 
			seata: 
				tx-service-group: order-service
		nacos:
			discovery: 
				server-addr: localhost:8848
	datasource:
		name: orderDataSource
		type: com.alibaba.druid.pool.DruidDataSource
		username: root
		password: root
		driver-class-name: com.mysql.cj.jdbc.Driver
		url: jdbc:mysql://localhost:3306/seata?useSSL=false&serverTimezone=UTC
		druid:
			max-active: 20 
			min-idle: 2 
			initial-size: 2
seata: 
	service: 
		vgroup-mapping: 
			order-service: default
		grouplist: 
			default: 127.0.0.1:8091
		disable-global-transaction: false
	enabled: true
mybatis-plus:
	mapper-locations: classpath:/mapper/*.xml
```

### 5.7 添加启动类

- 命名为：OrderServiceApplication
- 代码如下：

```java
@SpringBootApplication
@EnableDiscoveryClient 
@MapperScan("com.dqcgm.mapper") 
public class OrderServiceApplication {
	public static void main(String[] args) {
		SpringApplication.run(OrderServiceApplication.class ,args) ; 
	} 
}
```

### 5.8 启动项目测试

启动项目后，打印该日志，说明连接 seata-server 成功。

## 6.business-service 代码的完善

### 6.1 接口设计

在 business-service 里面，主要完成下单的逻辑，包含 2 个主要的步骤，就是对库存服务和订单服务的远程调用

- 新建一个接口：

命名为：com.dqcgm.service.BusinessService

代码如下：

```java
public interface BusinessService {
	/**
	* 采购/下单的过程 
	* @param userId 
	* 用户的 Id 
	* @param commodityCode 
	* 商品的编码 
	* @param orderCount 
	* 商品的数量 
	*/
	void purchase(String userId, String commodityCode, int orderCount) ;
}
```

### 6.2 实现该接口

名称为：impl.BusinessServiceImpl，代码的实现如下：

```java
@Service 
public class BusinessServiceImpl implements BusinessService {
	private static Logger logger = LoggerFactory.getLogger(BusinessServiceImpl.class) ;
	@Autowired 
	private StorageService storageService;
	@Autowired 
	private OrderService orderService;
	@Override 
	public void purchase(String userId, String commodityCode, int orderCount) {
		logger.info("准备下单，用户：{}，商品：{}，数量： {}",userId,commodityCode,orderCount);
		storageService.deduct(commodityCode, orderCount);
		orderService.create(userId, commodityCode, orderCount) ;
		logger.info("下单完成");
	}
}
```

### 6.3 远程调用 storage-service 的实现

创建一个 StorageService 的类，该类里面主要完成对 storage-servic 的远程调用

名称为：

```java
@Service 
public class StorageService {
	private static Logger logger = LoggerFactory.getLogger(StorageService.class) ;
	//1.采用 Ribbon 的形式
	@Autowired 
	private RestTemplate restTemplate ;
	//2.采用 Feign 的形式
	public void deduct(String commodityCode, int orderCount) {
		ResponseEntity<Void> entity = restTemplate. getForEntity( "http://storage-service/debut/{commodityCode}/{orderCount}", Void.class, commodityCode, orderCount );
		if (entity.getStatusCode()== HttpStatus.OK){
			logger.info("扣减库存成功，商品编号为{}，本次扣减的数量为{}",commodityCode,orderCount); 
			return; 
		}
		throw new RuntimeException("扣减库存失败") ;
	}
}
```

我们在此使用的时 Ribbon 做远程调用，下一博文我也会测试 Feign 。

### 6.4 远程调用 order-service 的实现

新建一个类：

代码如下：

```java
@Service 
public class OrderService {
	private static Logger logger = LoggerFactory.getLogger(StorageService.class) ;
	//1.采用 Ribbon 的形式
	@Autowired 
	private RestTemplate restTemplate ;
	//2.采用 Feign 的形式
	public void create(String userId, String commodityCode, int orderCount) {
		ResponseEntity<Void> entity = restTemplate. getForEntity( "http://order-service/create/{userId}/{commodityCode}/{orderCount}", Void.class, userId , commodityCode, orderCount );
		if (entity.getStatusCode()== HttpStatus.OK){
			logger.info("订单创建成功，用户为{} ，商品编号为{}，本次扣减的数量为{}",userId , commodityCode,orderCount);
			return;
		}
		throw new RuntimeException("订单创建失败") ;
	}
}
```

### 6.5 集成 Ribbon

添加一个 HttpUtilConfig 的配置类：

代码如下：

```java
@Configuration 
public class HttpUtilConfig {
	@LoadBalanced 
	@Bean 
	public RestTemplate restTemplate(){
		return new RestTemplate() ; 
	}
}
```

### 6.6 添加配置文件

在 resource 目录里面新建配置文件：

命名为：application.yml

内容如下：

```sh
server: 
	port: 18087
spring: 
	application: 
		name: business-service
	cloud: 
		alibaba: 
			seata: 
				tx-service-group: business-service
		nacos: 
			discovery: 
				server-addr: localhost:8848
seata: 
	service: 
		vgroup-mapping: 
			business-service: default
		grouplist: 
			default: 127.0.0.1:8091
		disable-global-transaction: false
	enabled: true
```

### 6.7 添加启动类

命名为：BusinessServiceApplication

代码如下：

```java
@SpringBootApplication 
@EnableDiscoveryClient 
public class BusinessServiceApplication {
	public static void main(String[] args) {
		SpringApplication.run(BusinessServiceApplication.class ,args) ; 
	} 
}
```

### 6.8 暴露下单接口

继续改造启动类：

```java
@SpringBootApplication 
@EnableDiscoveryClient 
@RestController 
public class BusinessServiceApplication {
	@Autowired 
	private BusinessService businessService ;
	public static void main(String[] args) {
		SpringApplication.run(BusinessServiceApplication.class ,args) ; 
	}
	/**
	* 开始下单 
	* @param userId 
	* 用户的 Id 
	* @param commodityCode 
	* 商品的编号 
	* @param orderCount 
	* 商品的数量 
	* @return 
	*/
	@GetMapping("/purchase/{userId}/{commodityCode}/{orderCount}")
	public ResponseEntity<Void> purchase( @PathVariable("userId") String userId, @PathVariable("commodityCode")String commodityCode, @PathVariable("orderCount")Integer orderCount){
		businessService.purchase(userId,commodityCode,orderCount);
		return ResponseEntity.ok().build() ;
	}
}
```

### 6.9 启动项目测试

启动项目后，打印该日志，说明连接 seata-server 成功

## 7.总体的调用流程如下

都启动完成后：

Nacos-Server：

## 8.正常下单测试

在浏览器里面访问：

http://localhost:18087/purchase/DQCGM_USER_1/HUAWEI_0001/1

- 代表 DQCGM_USER_1购买 HUAWEI_0001 产品 1 件
- 数据库里面：
- Accout_tbl 里面，DQCGM_USER_1 用户的金额减少 100；

Storage_tbl 里面，HUAWEI_0001 的库存减少了 1；

Order_Tbl 里面，创建了一条订单记录；

说明，此时远程调用时正常的。

## 9.分布式事务的演示

我们演示如图的异常：

我们可以发现，远程调用共有 3 处

### 9.1 在 accout-service 服务扣减余额触发异常

### 9.2 重启 accout-service

### 9.3 还原数据库里面的数据

Account_Tbl:

Storage_Tbl:

### 9.4 重新下单测试

http://localhost:18087/purchase/DQCGM_USER_1/HUAWEI_0001/1

数据库的数据：

Account_Tbl:

Storage_Tbl:

我们发现，分布式事务产生了，accout-service 内部的异常，导致 accout_tbl 表数据回滚了。但是，在 storage_tbl :位于 stoage-service 的事务却没有回滚

## 10.使用 Seata 解决分布式问题

### 10.1 改造 accout-service 里面的 AccountServiceImpl

当用户的 ID 为：DQCGM_USER_2 时，我们抛出异常，当为其他用户时，我们正常的下单

### 10.2 改造 BusinessServiceImpl

添加一个注解，看他是否能解决分布式事务的问题

### 10.3 重启测试

- 重启 accout-service，business-service 测试
- 使用 DQCGM_USER_1 正常的下单测试：

- Stoage_tbl：库存正常
- Accout_Tbl：余额正常
- 使用 DQCGM_USER_2 下单测试：

- 发现发生异常后，
- stoage_tbl 里面的没有发生改变，数据正常
- Accout_tbl 里面的数据也没有发生改变，数据正常
- 分布式事务测试成功了
