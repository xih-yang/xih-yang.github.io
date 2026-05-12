# 25、SpringCloud Alibaba 之 Seata 分布式事务服务；TCC事务模式机制
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/1/25.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
## Seata TCC 事务模式

AT模式基本上能满足我们使用分布式事务大部分需求，但涉及非关系型数据库与中间件的操作、跨公司服务的调用、跨语言的应用调用就需要结合TCC模式

[http://seata.io/zh-cn/docs/dev/mode/tcc-mode.html](http://seata.io/zh-cn/docs/dev/mode/tcc-mode.html)

一个分布式的全局事务，整体是两阶段提交（Try - [Comfirm/Cancel]）的模型

根据两阶段行为模式的不同，我们将分支事务划分为 **Automatic (Branch) Transaction Mode** 和 **TCC (Branch) Transaction Mode**

AT模式（[参考链接 TBD](http://seata.io/zh-cn/docs/dev/mode/tcc-mode.html)）基于 **支持本地 ACID 事务** 的 **关系型数据库**：

- 一阶段 prepare 行为：在本地事务中，一并提交业务数据更新和相应回滚日志记录
- 二阶段 commit 行为：马上成功结束，**自动** 异步批量清理回滚日志
- 二阶段 rollback 行为：通过回滚日志，**自动** 生成补偿操作，完成数据回滚

TCC模式，不依赖于底层数据资源的事务支持（需要程序员编写代码实现提交和回滚）：

- 一阶段 prepare 行为：调用 **自定义** 的 prepare 逻辑
- 二阶段 commit 行为：调用 **自定义** 的 commit 逻辑
- 二阶段 rollback 行为：调用 **自定义** 的 rollback 逻辑

TCC模式，是指支持把 **自定义** 的分支事务纳入到全局事务的管理中

通俗来说，Seata的TCC模式就是手工版本的AT模式，它允许你自定义两阶段的处理逻辑而不需要依赖AT模式的undo_log回滚表

### 1、创建数据库、表、插入数据等

（1）accountdb账户库、account账户表

```sql
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
-- ----------------------------
-- Table structure for account
-- ----------------------------
DROP TABLE IF EXISTS account;
CREATE TABLE account  (
  id int(20) NOT NULL AUTO_INCREMENT,
  user_id int(20) NULL DEFAULT NULL,
  balance decimal(20, 0) NULL DEFAULT NULL,
  update_time datetime(6) NULL DEFAULT NULL,
  PRIMARY KEY (id) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;
SET FOREIGN_KEY_CHECKS = 1;
```

（2）productdb产品库、product产品表

```sql
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
-- ----------------------------
-- Table structure for product
-- ----------------------------
DROP TABLE IF EXISTS product;
CREATE TABLE product  (
  id int(20) NOT NULL AUTO_INCREMENT,
  name varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  price decimal(10, 2) NULL DEFAULT NULL,
  stock varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  add_time datetime(6) NULL DEFAULT NULL,
  update_time datetime(6) NULL DEFAULT NULL,
  PRIMARY KEY (id) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;
SET FOREIGN_KEY_CHECKS = 1;
```

（3）orderdb订单库、orders 订单表

```sql
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
-- ----------------------------
-- Table structure for orders
-- ----------------------------
DROP TABLE IF EXISTS orders;
CREATE TABLE orders  (
  id int(20) NOT NULL AUTO_INCREMENT,
  user_id int(20) NULL DEFAULT NULL,
  product_id int(20) NULL DEFAULT NULL,
  pay_amount decimal(20, 0) NULL DEFAULT NULL,
  add_time datetime(6) NULL DEFAULT NULL,
  update_time datetime(6) NULL DEFAULT NULL,
  PRIMARY KEY (id) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;
SET FOREIGN_KEY_CHECKS = 1;
```

（4）undo_log表

[Seata AT 模式](http://seata.io/zh-cn/docs/dev/mode/at-mode.html)

```sql
-- 注意此处0.7.0+ 增加字段 context
CREATE TABLE undo_log (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  branch_id bigint(20) NOT NULL,
  xid varchar(100) NOT NULL,
  context varchar(128) NOT NULL,
  rollback_info longblob NOT NULL,
  log_status int(11) NOT NULL,
  log_created datetime NOT NULL,
  log_modified datetime NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY ux_undo_log (xid,branch_id)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
```

注：

每个库必须创建 undo_log 表，是 Seata AT模式必须创建的表，主要用于分支事务的回滚

[Seata AT 模式](http://seata.io/zh-cn/docs/dev/mode/at-mode.html)

## 一、SpringBoot单体应用多数据源TCC事务

在Spring Boot单体项目中，使用了多数据源，就要保证多个数据源的数据一致性，即产生了分布式事务的问题，采用Seata的AT事务模式来解决该分布式事务问题

以下图购物下单为例

**1、** 创建一个springboot应用，命名springcloud-alibaba-3-seata-tcc-transaction；

**2、** 添加依赖；

```xml
<groupId>com.company</groupId>
<artifactId>springcloud-alibaba-3-seata-tcc-transaction</artifactId>
<version>1.0.0</version>
<name>springcloud-alibaba-3-seata-tcc-transaction</name>
<description>Demo project for Spring Boot</description>
<properties>
    <java.version>1.8</java.version>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
    <spring-boot.version>2.3.12.RELEASE</spring-boot.version>
    <spring-cloud-alibaba.version>2.2.7.RELEASE</spring-cloud-alibaba.version>
</properties>
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
        <exclusions>
            <exclusion>
                <groupId>org.junit.vintage</groupId>
                <artifactId>junit-vintage-engine</artifactId>
            </exclusion>
        </exclusions>
    </dependency>
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
    </dependency>
    <!-- mysql-connector-java -->
    <dependency>
        <groupId>mysql</groupId>
        <artifactId>mysql-connector-java</artifactId>
        <!--            <version>8.0.28</version>-->
    </dependency>
    <!-- mybatis-spring-boot-starter -->
    <dependency>
        <groupId>org.mybatis.spring.boot</groupId>
        <artifactId>mybatis-spring-boot-starter</artifactId>
        <version>2.1.3</version>
    </dependency>
    <!-- seata-spring-boot-starter -->
    <dependency>
        <groupId>io.seata</groupId>
        <artifactId>seata-spring-boot-starter</artifactId>
        <version>1.4.2</version>
    </dependency>
    <!-- dynamic-datasource-spring-boot-starter动态数据源 -->
    <dependency>
        <groupId>com.baomidou</groupId>
        <artifactId>dynamic-datasource-spring-boot-starter</artifactId>
        <version>3.2.0</version>
    </dependency>
    <!-- nacos-client -->
    <dependency>
        <groupId>com.alibaba.nacos</groupId>
        <artifactId>nacos-client</artifactId>
        <version>2.1.0</version>
    </dependency>
</dependencies>
<!-- dependencyManagement标签 通常适用于多模块环境下定义一个top module来专门管理公共依赖的情况
    在子项目中不写该依赖项，那么子项目仍然会从父项目depenManagement中继承该artifactId和groupId依赖项（全部继承）
    若子项目 中dependencies中的dependency声明了version，则父项目中dependencyManagement中的声明无效
    Spring Cloud、Spring Cloud Alibaba 以及 Spring Boot 之间版本依赖参考官网
    https://github.com/alibaba/spring-cloud-alibaba/wiki/%E7%89%88%E6%9C%AC%E8%AF%B4%E6%98%8E
-->
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-alibaba-dependencies</artifactId>
            <version>${spring-cloud-alibaba.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
        <!-- spring-cloud-dependencies -->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-dependencies</artifactId>
            <version>Hoxton.SR12</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-dependencies</artifactId>
            <version>${spring-boot.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <configuration>
                <source>1.8</source>
                <target>1.8</target>
                <encoding>UTF-8</encoding>
            </configuration>
        </plugin>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
        </plugin>
        <!--mybatis代码自动生成插件-->
        <plugin>
            <groupId>org.mybatis.generator</groupId>
            <artifactId>mybatis-generator-maven-plugin</artifactId>
            <version>1.4.0</version>
            <configuration>
                <!--配置文件的位置-->
                <configurationFile>src/main/resources/generatorConfig.xml</configurationFile>
                <!--生成代码过程中是否打印日志-->
                <verbose>true</verbose>
                <!--生成时是否覆盖java文件，xml文件总是合并-->
                <overwrite>true</overwrite>
            </configuration>
        </plugin>
    </plugins>
    <resources>
        <resource>
            <directory>src/main/java</directory>
            <includes>
                <include>**/*.xml</include>
            </includes>
        </resource>
        <resource>
            <directory>src/main/resources</directory>
            <includes>
                <include>**/*.*</include>
            </includes>
        </resource>
        <!--src/main/webapp下的jsp页面编译到META-INF/resources下才能访问-->
        <resource>
            <directory>src/main/webapp</directory>
            <targetPath>META-INF/services</targetPath>
            <includes>
                <include>**/*.*</include>
            </includes>
        </resource>
    </resources>
</build>
```

**3、** application.properties配置文件；

```java
#内嵌服务器端口
server.port=8081
#应用服务名称
spring.application.name=springcloud-alibaba-3-seata-tcc-transaction
# 设置默认的数据源或者数据源组，默认值即为master
spring.datasource.dynamic.primary=order-ds
# 订单order数据源配置
spring.datasource.dynamic.datasource.order-ds.url=jdbc:mysql://192.168.133.129:3306/orderdb?serverTimezone=GMT%2B8&useUnicode=true&characterEncoding=utf8&rewriteBatchedStatements=true&useSSL=false
spring.datasource.dynamic.datasource.order-ds.driver-class-name=com.mysql.cj.jdbc.Driver
spring.datasource.dynamic.datasource.order-ds.username=root
spring.datasource.dynamic.datasource.order-ds.password=123456
# 商品product数据源配置
spring.datasource.dynamic.datasource.product-ds.url=jdbc:mysql://192.168.133.129:3306/productdb?serverTimezone=GMT%2B8&useUnicode=true&characterEncoding=utf8&rewriteBatchedStatements=true&useSSL=false
spring.datasource.dynamic.datasource.product-ds.driver-class-name=com.mysql.cj.jdbc.Driver
spring.datasource.dynamic.datasource.product-ds.username=root
spring.datasource.dynamic.datasource.product-ds.password=123456
# 账户account数据源配置
spring.datasource.dynamic.datasource.account-ds.url=jdbc:mysql://192.168.133.129:3306/accountdb?serverTimezone=GMT%2B8&useUnicode=true&characterEncoding=utf8&rewriteBatchedStatements=true&useSSL=false
spring.datasource.dynamic.datasource.account-ds.driver-class-name=com.mysql.cj.jdbc.Driver
spring.datasource.dynamic.datasource.account-ds.username=root
spring.datasource.dynamic.datasource.account-ds.password=123456
# 是否启动对Seata的集成
spring.datasource.dynamic.seata=true
#-----------------------------------------------------------
#单机版 tc server 配置
# Seata应用编号，默认为 ${spring.application.name}
seata.application-id=springboot-tcc-seata
# Seata事务组编号，用于TC集群名，一般格式为：${spring.application.name}-group
seata.tx-service-group=springboot-tcc-seata-group
# 虚拟组和分组的映射 seata.service.vgroup-mapping.${seata.tx-service-group}=default
seata.service.vgroup-mapping.springboot-tcc-seata-group=default
# 分组和Seata服务的映射，此处default指上面 seata.service.vgroup-mapping.springboot-seata-group 的值 default
seata.service.grouplist.default=192.168.133.129:8091
# 存储模式 默认 file模式
seata.config.type=file
# 默认为 file
seata.registry.type=file
#------------------------------------------------------------
#------------------------------------------------------------
##集群版 tc server 配置
## Seata应用编号，默认为 ${spring.application.name}
#seata.application-id=springboot-tcc-seata
## Seata事务组编号，用于TC集群名，一般格式为：${spring.application.name}-group
#seata.tx-service-group=springboot-tcc-seata-group
## 虚拟组和分组的映射 seata.service.vgroup-mapping.${seata.tx-service-group}=default
#seata.service.vgroup-mapping.springboot-tcc-seata-group=default
#------------------------------------------------------------
#设置使用注册中心
#seata.registry.type=nacos
#seata.registry.nacos.cluster=default
#seata.registry.nacos.application=seata-server
#seata.registry.nacos.group=SEATA_GROUP
#seata.registry.nacos.server-addr=192.168.133.129:8848
#
#seata.enable-auto-data-source-proxy=false
#seata.client.rm.lock.retry-policy-branch-rollback-on-conflict=false
#配置 undo_log 的解析方式
seata.client.undo.log-serialization=myJackson
```

**4、** 编写相应的controller、model、mapper、service类，这里只给出调用顺序相关的类；

controller测试类

```java
@Slf4j //lombok
@RestController
public class OrderController {
    @Autowired
    private OrderService orderService;
    @RequestMapping("/order")
    public Integer createOrder(@RequestParam("userId") Integer userId,
                               @RequestParam("productId") Integer productId) throws Exception {
        log.info("请求下单, 用户:{}, 商品:{}", userId, productId);
        return orderService.createOrder(userId, productId);
    }
}
@Slf4j
@Service
public class OrderServiceImpl implements OrderService {
    @Autowired
    private OrdersMapper ordersMapper;
    @Autowired
    private AccountService accountService;
    @Autowired
    private ProductService productService;
    @Override
    @DS(value = "order-ds")
    @GlobalTransactional //seata全局事务注解， TM 事务发起方
    public Integer createOrder(Integer userId, Integer productId) throws Exception {
        Integer amount = 1; // 购买数量暂时设置为 1
        log.info("当前 XID: {}", RootContext.getXID());
        // 减库存
        Product product = productService.reduceStock(productId, amount);
        // 减余额
        accountService.reduceBalance(userId, product.getPrice());
        // 下订单
        Orders order = new Orders();
        order.setUserId(userId);
        order.setProductId(productId);
        order.setPayAmount(product.getPrice().multiply(new BigDecimal(amount)));
        ordersMapper.insertSelective(order);
        log.info("下订单: {}", order.getId());
        int a = 10 / 0;
        // 返回订单编号
        return order.getId();
    }
}
```

AccountService

```java
@LocalTCC
public interface AccountService {
    /**
     * 扣除余额
     * 定义两阶段提交
     * name = reduceStock为一阶段try方法
     * commitMethod = commitTcc 为二阶段确认方法
     * rollbackMethod = cancel 为二阶段取消方法
     * BusinessActionContextParameter注解 可传递参数到二阶段方法
     *
     * @param userId 用户ID
     * @param money  扣减金额
     * @throws Exception 失败时抛出异常
     */
    @TwoPhaseBusinessAction(name = "reduceBalance", commitMethod = "commitTcc", rollbackMethod = "cancelTcc")
    void reduceBalance(@BusinessActionContextParameter(paramName = "userId") Integer userId,
                       @BusinessActionContextParameter(paramName = "money") BigDecimal money);
    /**
     * 确认方法、可以另命名，但要保证与commitMethod一致
     * context可以传递try方法的参数
     *
     * @param context 上下文
     * @return boolean
     */
    boolean commitTcc(BusinessActionContext context);
    /**
     * 二阶段取消方法
     *
     * @param context 上下文
     * @return boolean
     */
    boolean cancelTcc(BusinessActionContext context);
}
@Slf4j
@Service
public class AccountServiceImpl implements AccountService {
    @Autowired
    private AccountMapper accountMapper;
    @DS(value = "account-ds")
    @Override
    public void reduceBalance(Integer userId, BigDecimal money) {
        log.info("当前 XID: {}", RootContext.getXID());
        // 检查余额
        Account account = accountMapper.selectAccountByUserId(userId);
        if (account.getBalance().doubleValue() < money.doubleValue()) {
            throw new RuntimeException("余额不足");
        }
        // 扣除余额
        int updateCount = accountMapper.reduceBalance(userId, money);
        // 扣除成功
        if (updateCount == 0) {
            throw new RuntimeException("余额不足");
        }
        log.info("扣除用户 {} 余额成功", userId);
        //int a = 10 / 0;
    }
    /**
     * tcc服务（confirm）方法
     * 可以空确认
     *
     * @param context 上下文
     * @return boolean
     */
    @DS(value = "account-ds")
    @Override
    public boolean commitTcc(BusinessActionContext context) {
        log.info("Confirm阶段，AccountServiceImpl, commitTcc --> xid = {}", context.getXid() + ", commitTcc提交成功");
        return true;
    }
    /**
     * tcc服务（cancel）方法
     * 实现中间件、非关系型数据库的回滚操作
     * @param context 上下文
     * @return boolean
     */
    @DS(value = "account-ds")
    @Override
    public boolean cancelTcc(BusinessActionContext context) {
        log.info("Cancel阶段，AccountServiceImpl, cancelTcc --> xid = " + context.getXid() + ", cancelTcc提交失败");
        //可以实现中间件、非关系型数据库的回滚操作
        log.info("Cancel阶段，AccountServiceImpl, cancelTcc this data: userId= {}, money = {}", context.getActionContext("userId"), context.getActionContext("money"));
        //进行数据库回滚处理
        Integer userId = (Integer)context.getActionContext("userId");
        BigDecimal money = (BigDecimal)context.getActionContext("money");
        //把余额再加回去
        accountMapper.increaseBalance(userId, money);
        return true;
    }
}
```

ProductService

```java
@LocalTCC
public interface ProductService {
    /**
     * 减库存
     *
     * 定义两阶段提交
     * name = reduceStock为一阶段try方法
     * commitMethod = commitTcc 为二阶段确认方法
     * rollbackMethod = cancel 为二阶段取消方法
     * BusinessActionContextParameter注解 可传递参数到二阶段方法
     *
     * @param productId 商品ID
     * @param amount    扣减数量
     * @throws Exception 扣减失败时抛出异常
     */
    @TwoPhaseBusinessAction(name = "reduceStock", commitMethod = "commitTcc", rollbackMethod = "cancelTcc")
    Product reduceStock(@BusinessActionContextParameter(paramName = "productId") Integer productId,
                        @BusinessActionContextParameter(paramName = "amount") Integer amount);
    /**
     * 二阶段提交方法
     *
     * 确认方法、可以另命名，但要保证与commitMethod一致
     * context可以传递try方法的参数
     *
     * @param context 上下文
     * @return boolean
     */
    boolean commitTcc(BusinessActionContext context);
    /**
     * 二阶段回滚方法
     *
     * @param context 上下文
     * @return boolean
     */
    boolean cancelTcc(BusinessActionContext context);
}
@Slf4j
@Service
public class ProductServiceImpl implements ProductService {
    @Autowired
    private AccountService accountService;
    @Autowired
    private ProductMapper productMapper;
    @DS(value = "product-ds")
    @Override
    public Product reduceStock(Integer productId, Integer amount) {
        log.info("当前 XID: {}", RootContext.getXID());
        // 检查库存
        Product product = productMapper.selectByPrimaryKey(productId);
        if (product.getStock() < amount) {
            throw new RuntimeException("库存不足");
        }
        // 扣减库存
        int updateCount = productMapper.reduceStock(productId, amount);
        // 扣除成功
        if (updateCount == 0) {
            throw new RuntimeException("库存不足");
        }
        // 扣除成功
        log.info("扣除 {} 库存成功", productId);
        return product;
    }
    /**
     * tcc服务（confirm）方法
     * 可以空确认
     *
     * @param context 上下文
     * @return boolean
     */
    @DS(value = "product-ds")
    @Override
    public boolean commitTcc(BusinessActionContext context) {
        log.info("Confirm阶段，ProductServiceImpl, commitTcc --> xid = " + context.getXid() + ", commitTcc提交成功");
        return true;
    }
    /**
     * tcc服务（cancel）方法
     *
     * @param context 上下文
     * @return boolean
     */
    @DS(value = "product-ds")
    @Override
    public boolean cancelTcc(BusinessActionContext context) {
        log.info("Cancel阶段，ProductServiceImpl, cancelTcc --> xid = " + context.getXid() + ", cancelTcc提交失败");
        //实现中间件、非关系型数据库的回滚操作
        log.info("Cancel阶段，ProductServiceImpl, cancelTcc this data: {}, {}", context.getActionContext("productId"), context.getActionContext("amount"));
        //进行数据库回滚处理
        Integer productId = (Integer)context.getActionContext("productId");
        Integer amount = (Integer)context.getActionContext("amount");
        //把库存再加回去 (避免数据出问题，加个锁，分布式环境下就需要分布式锁)
        productMapper.increaseStock(productId, amount);
        return true;
    }
}
```

### @LocalTCC注解

标识此TCC为本地模式，即该事务是本地调用，非RPC调用

@LocalTCC一定需要注解在接口上，此接口可以是寻常的业务接口，只要实现了TCC的两阶段提交对应方法即可

### @TwoPhaseBusinessAction注解

标识为TCC模式，注解try方法，其中name为当前tcc方法的bean名称，写方法名便可（全局唯一），commitMethod指提交方法，rollbackMethod指事务回滚方法，指定好三个方法之后，Seata会根据事务的成功或失败，通过动态代理去帮我们自动调用提交或者回滚

### @BusinessActionContextParameter 注解

将参数传递到二阶段（commitMethod/rollbackMethod）的方法

### BusinessActionContext

指TCC事务上下文，携带了业务方法的参数

## 二、Spring Cloud Alibaba的TCC分布式事务

## 测试应用

**1、** 创建4个SpringBoot模块；

### （1）springcloud-alibaba-3-seata-tcc-commons

```xml
<groupId>com.company</groupId>
<artifactId>springcloud-alibaba-3-seata-tcc-commons</artifactId>
<version>1.0.0</version>
<dependencies>
    <!--lombok-->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <version>1.18.16</version>
    </dependency>
    <!--spring-cloud-starter-openfeign-->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-openfeign</artifactId>
        <version>3.0.0</version>
    </dependency>
</dependencies>
```

```java
@FeignClient(name = "springcloud-alibaba-3-seata-tcc-account")
public interface FeignAccountService {
    /**
     * 扣除余额
     *
     * @param userId 用户ID
     * @param money  扣减金额
     * @throws Exception 失败时抛出异常
     */
    @PostMapping("/account/reduceBalance")
    void reduceBalance(@RequestParam("userId") Integer userId, @RequestParam("money") BigDecimal money);
}
@FeignClient(name = "springcloud-alibaba-3-seata-tcc-order")
public interface FeignOrderService {
    /**
     * 创建订单
     *
     * @param userId 用户ID
     * @param productId 产品ID
     * @return 订单编号
     * @throws Exception 创建订单失败，抛出异常
     */
    Integer createOrder(Integer userId, Integer productId) throws Exception;
}
@FeignClient(name = "springcloud-alibaba-3-seata-tcc-product")
public interface FeignProductService {
    /**
     * 减库存
     *
     * @param productId 商品ID
     * @param amount    扣减数量
     * @throws Exception 扣减失败时抛出异常
     */
    @PostMapping("/product/reduceStock")
    Product reduceStock(@RequestParam("productId") Integer productId, @RequestParam("amount") Integer amount);
}
```

### （2）springcloud-alibaba-3-seata-tcc-order

```xml
<groupId>com.company</groupId>
<artifactId>springcloud-alibaba-3-seata-tcc-order</artifactId>
<version>1.0.0</version>
<name>springcloud-alibaba-3-seata-tcc-order</name>
<description>Demo project for Spring Boot</description>
<properties>
    <java.version>1.8</java.version>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
    <spring-boot.version>2.3.12.RELEASE</spring-boot.version>
    <spring-cloud-alibaba.version>2.2.7.RELEASE</spring-cloud-alibaba.version>
</properties>
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <!--spring-cloud-starter-alibaba-sentinel-->
    <dependency>
        <groupId>com.alibaba.cloud</groupId>
        <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
        <exclusions>
            <exclusion>
                <groupId>org.junit.vintage</groupId>
                <artifactId>junit-vintage-engine</artifactId>
            </exclusion>
        </exclusions>
    </dependency>
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
    </dependency>
    <!-- mysql-connector-java -->
    <dependency>
        <groupId>mysql</groupId>
        <artifactId>mysql-connector-java</artifactId>
    </dependency>
    <!-- mybatis-spring-boot-starter -->
    <dependency>
        <groupId>org.mybatis.spring.boot</groupId>
        <artifactId>mybatis-spring-boot-starter</artifactId>
        <version>2.1.3</version>
    </dependency>
    <!-- spring-cloud-starter-alibaba-seata
        在 Spring Cloud 项目中，spring-cloud依赖 也会引入 seata-spring-boot-starter 依赖，在此排除
     -->
    <dependency>
        <groupId>com.alibaba.cloud</groupId>
        <artifactId>spring-cloud-starter-alibaba-seata</artifactId>
        <exclusions>
            <exclusion>
                <groupId>io.seata</groupId>
                <artifactId>seata-spring-boot-starter</artifactId>
            </exclusion>
        </exclusions>
    </dependency>
    <!-- seata-spring-boot-starter
        注：服务端和客户端版本要一致，不然报错：
        no available service 'default' found, please make sure registry config correct
     -->
    <dependency>
        <groupId>io.seata</groupId>
        <artifactId>seata-spring-boot-starter</artifactId>
        <version>1.4.2</version>
    </dependency>
    <!--统一通用项目，model类、openfeign接口-->
    <dependency>
        <groupId>com.company</groupId>
        <artifactId>springcloud-alibaba-3-seata-tcc-commons</artifactId>
        <version>1.0.0</version>
    </dependency>
</dependencies>
<!-- dependencyManagement标签 通常适用于多模块环境下定义一个top module来专门管理公共依赖的情况
    在子项目中不写该依赖项，那么子项目仍然会从父项目depenManagement中继承该artifactId和groupId依赖项（全部继承）
    若子项目 中dependencies中的dependency声明了version，则父项目中dependencyManagement中的声明无效
    Spring Cloud、Spring Cloud Alibaba 以及 Spring Boot 之间版本依赖参考官网
    https://github.com/alibaba/spring-cloud-alibaba/wiki/%E7%89%88%E6%9C%AC%E8%AF%B4%E6%98%8E
-->
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-alibaba-dependencies</artifactId>
            <version>${spring-cloud-alibaba.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
        <!-- spring-cloud-dependencies -->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-dependencies</artifactId>
            <version>Hoxton.SR12</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-dependencies</artifactId>
            <version>${spring-boot.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <version>3.8.1</version>
            <configuration>
                <source>1.8</source>
                <target>1.8</target>
                <encoding>UTF-8</encoding>
            </configuration>
        </plugin>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
        </plugin>
    </plugins>
    <resources>
        <resource>
            <directory>src/main/java</directory>
            <includes>
                <include>**/*.xml</include>
            </includes>
        </resource>
        <resource>
            <directory>src/main/resources</directory>
            <includes>
                <include>**/*.*</include>
            </includes>
        </resource>
    </resources>
</build>
```

```java
@Slf4j
@RestController
public class OrderController {
    @Autowired
    private OrderService orderService;
    /**
     * 下单操作，发起分布式事务
     *
     * @param userId
     * @param productId
     * @return
     * @throws Exception
     */
    @RequestMapping("/order")
    public Integer createOrder(@RequestParam("userId") Integer userId,
                               @RequestParam("productId") Integer productId) throws Exception {
        log.info("[createOrder] 请求下单, 用户:{}, 商品:{}", userId, productId);
        return orderService.createOrder(userId, productId);
    }
}
@Slf4j
@Service
public class OrderServiceImpl implements OrderService {
    @Autowired
    private OrdersMapper ordersMapper;
    @Autowired
    private FeignProductService feignProductService;
    @Autowired
    private FeignAccountService feignAccountService;
    @Override
    @GlobalTransactional //seata全局事务注解， TM 分布式全局事务发起者
    public Integer createOrder(Integer userId, Integer productId) {
        Integer amount = 1; // 购买数量，暂时设为 1
        log.info("[createOrder] 当前 XID: {}", RootContext.getXID());
        // 减库存 （feign的调用） http远程调用
        Product product = feignProductService.reduceStock(productId, amount);
        // 减余额
        feignAccountService.reduceBalance(userId, product.getPrice());
        // 下订单
        Orders order = new Orders();
        order.setUserId(userId);
        order.setProductId(productId);
        order.setPayAmount(product.getPrice().multiply(new BigDecimal(amount)));
        ordersMapper.insertSelective(order);
        log.info("[createOrder] 下订单: {}", order.getId());
        int a = 10 / 0;
        // 返回订单编号
        return order.getId();
    }
}
```

### （3）springcloud-alibaba-3-seata-tcc-product

```java
@LocalTCC
public interface ProductService {
    /**
     * 减库存
     *
     * 定义两阶段提交
     * name = reduceStock为一阶段try方法
     * commitMethod = commitTcc 为二阶段确认方法
     * rollbackMethod = cancel 为二阶段取消方法
     * BusinessActionContextParameter注解 可传递参数到二阶段方法
     *
     * @param productId 商品ID
     * @param amount    扣减数量
     * @throws Exception 扣减失败时抛出异常
     */
    @TwoPhaseBusinessAction(name = "reduceStock", commitMethod = "commitTcc", rollbackMethod = "cancelTcc")
    Product reduceStock(@BusinessActionContextParameter(paramName = "productId") Integer productId,
                        @BusinessActionContextParameter(paramName = "amount") Integer amount);
    /**
     * 确认方法、可以另命名，但要保证与commitMethod一致
     * context可以传递try方法的参数
     *
     * @param context 上下文
     * @return boolean
     */
    boolean commitTcc(BusinessActionContext context);
    /**
     * 二阶段取消方法
     *
     * @param context 上下文
     * @return boolean
     */
    boolean cancelTcc(BusinessActionContext context);
}
@Slf4j
@Service
public class ProductServiceImpl implements ProductService {
    @Autowired
    private ProductMapper productMapper;
    /**
     * tcc服务（try）方法
     * 也是实际业务方法
     *
     * @param productId 商品ID
     * @param amount    扣减数量
     * @return
     */
    @Override
    public Product reduceStock(Integer productId, Integer amount) {
        log.info("[reduceStock] 当前 XID: {}", RootContext.getXID());
        // 检查库存
        Product product = productMapper.selectByPrimaryKey(productId);
        if (product.getStock() < amount) {
            throw new RuntimeException("库存不足");
        }
        // 减库存
        int updateCount = productMapper.reduceStock(productId, amount);
        // 减库存失败
        if (updateCount == 0) {
            throw new RuntimeException("库存不足");
        }
        // 减库存成功
        log.info("减库存 {} 库存成功", productId);
        return product;
    }
    /**
     * tcc服务（confirm）方法
     * 可以空确认
     *
     * @param context 上下文
     * @return boolean
     */
    @Override
    public boolean commitTcc(BusinessActionContext context) {
        log.info("Confirm阶段，ProductServiceImpl, commitTcc --> xid = " + context.getXid() + ", commitTcc提交成功");
        return true;
    }
    /**
     * tcc服务（cancel）方法
     *
     * @param context 上下文
     * @return boolean
     */
    @Override
    public boolean cancelTcc(BusinessActionContext context) {
        log.info("Cancel阶段，ProductServiceImpl, cancelTcc --> xid = " + context.getXid() + ", cancelTcc提交失败");
        //TODO 这里可以实现中间件、非关系型数据库的回滚操作
        log.info("Cancel阶段，ProductServiceImpl, cancelTcc this data: {}, {}", context.getActionContext("productId"), context.getActionContext("amount"));
        //进行数据库回滚处理
        Integer productId = (Integer)context.getActionContext("productId");
        Integer amount = (Integer)context.getActionContext("amount");
        //把库存再加回去
        productMapper.increaseStock(productId, amount);
        return true;
    }
}
```

### （4）springcloud-alibaba-3-seata-tcc-account

```java
@LocalTCC
public interface AccountService {
    /**
     * 扣除余额
     * 定义两阶段提交
     * name = reduceStock为一阶段try方法
     * commitMethod = commitTcc 为二阶段确认方法
     * rollbackMethod = cancel 为二阶段取消方法
     * BusinessActionContextParameter注解 可传递参数到二阶段方法
     *
     * @param userId 用户ID
     * @param money  扣减金额
     * @throws Exception 失败时抛出异常
     */
    @TwoPhaseBusinessAction(name = "reduceBalance", commitMethod = "commitTcc", rollbackMethod = "cancelTcc")
    void reduceBalance(@BusinessActionContextParameter(paramName = "userId") Integer userId,
                       @BusinessActionContextParameter(paramName = "money") BigDecimal money);
    /**
     * 确认方法、可以另命名，但要保证与commitMethod一致
     * context可以传递try方法的参数
     *
     * @param context 上下文
     * @return boolean
     */
    boolean commitTcc(BusinessActionContext context);
    /**
     * 二阶段取消方法
     *
     * @param context 上下文
     * @return boolean
     */
    boolean cancelTcc(BusinessActionContext context);
}
@Slf4j
@Service
public class AccountServiceImpl implements AccountService {
    @Autowired
    private AccountMapper accountMapper;
    @Override
    public void reduceBalance(Integer userId, BigDecimal money) {
        log.info("[reduceBalance] 当前 XID: {}", RootContext.getXID());
        // 检查余额
        Account account = accountMapper.selectAccountByUserId(userId);
        if (account.getBalance().doubleValue() < money.doubleValue()) {
            throw new RuntimeException("余额不足");
        }
        // 扣除余额
        int updateCount = accountMapper.reduceBalance(userId, money);
        // 扣除成功
        if (updateCount == 0) {
            throw new RuntimeException("余额不足");
        }
        log.info("[reduceBalance] 扣除用户 {} 余额成功", userId);
    }
    /**
     * tcc服务（confirm）方法
     * 可以空确认
     *
     * @param context 上下文
     * @return boolean
     */
    @Override
    public boolean commitTcc(BusinessActionContext context) {
        log.info("Confirm阶段，AccountServiceImpl, commitTcc --> xid = {}", context.getXid() + ", commitTcc提交成功");
        return true;
    }
    /**
     * tcc服务（cancel）方法
     *
     * @param context 上下文
     * @return boolean
     */
    @Override
    public boolean cancelTcc(BusinessActionContext context) {
        log.info("Cancel阶段，AccountServiceImpl, cancelTcc --> xid = " + context.getXid() + ", cancelTcc提交失败");
        //TODO 这里可以实现中间件、非关系型数据库的回滚操作
        log.info("Cancel阶段，AccountServiceImpl, cancelTcc this data: userId= {}, money = {}", context.getActionContext("userId"), context.getActionContext("money"));
        //进行数据库回滚处理
        Integer userId = (Integer)context.getActionContext("userId");
        BigDecimal money = (BigDecimal)context.getActionContext("money");
        //幂等性问题
        //把余额再加回去
        accountMapper.increaseBalance(userId, money);
        return true;
    }
}
```
