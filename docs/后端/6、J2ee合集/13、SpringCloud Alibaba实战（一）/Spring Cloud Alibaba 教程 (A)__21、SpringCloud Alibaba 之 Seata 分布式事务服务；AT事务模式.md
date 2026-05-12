# 21、SpringCloud Alibaba 之 Seata 分布式事务服务；AT事务模式
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/1/21.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
## AT 模式

[Seata AT 模式](http://seata.io/zh-cn/docs/dev/mode/at-mode.html)

### 前提

**1、** 基于支持本地ACID事务的关系型数据库；

**2、** Java应用，通过JDBC访问数据库；

### 整体机制

两阶段提交协议的演变：

**1、** 一阶段：业务数据和回滚日志记录在同一个本地事务中提交，释放本地锁和连接资源；

**2、** 二阶段：

（1）提交异步化，非常快速地完成

（2）回滚通过一阶段的回滚日志进行反向补偿

### 写隔离

**1、** 一阶段本地事务提交前，需要确保先拿到**全局锁**；

**2、** 拿不到**全局锁**，不能提交本地事务；

**3、** 拿**全局锁**的尝试被限制在一定范围内，超出范围将放弃，并回滚本地事务，释放本地锁；

### 读隔离

在数据库本地事务隔离级别 **读已提交（Read Committed）** 或以上的基础上，Seata（AT 模式）的默认全局隔离级别是 **读未提交（Read Uncommitted）** 。

如果应用在特定场景下，必需要求全局的 **读已提交** ，目前 Seata 的方式是通过 SELECT FOR UPDATE 语句的代理。

## 一、AT事务模式：SpringBoot单体应用多数据源AT分布式事务

在Spring Boot单体项目中，使用了多数据源，就要保证多个数据源的数据一致性，即产生了分布式事务的问题，采用Seata的AT事务模式来解决该分布式事务问题

以下图购物下单为例

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

### 2、创建 SpringBoot单体应用

**1、** 创建一个springboot应用，命名springcloud-alibaba-2-seata-distributed-transaction；

**2、** 添加依赖（非SpringCLoud微服务项目，没有SpringCLoud依赖）；

```xml
<groupId>com.company</groupId>
<artifactId>springcloud-alibaba-2-seata-distributed-transaction</artifactId>
<version>1.0.0</version>
<name>springcloud-alibaba-2-seata-distributed-transaction</name>
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
        <version>1.3.0</version>
    </dependency>
    <!-- dynamic-datasource-spring-boot-starter动态数据源 -->
    <dependency>
        <groupId>com.baomidou</groupId>
        <artifactId>dynamic-datasource-spring-boot-starter</artifactId>
        <version>3.2.0</version>
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
    </resources>
</build>
```

**3、** application.properties配置文件；

```bash
#内嵌服务器端口
server.port=8081
#应用服务名称
spring.application.name=springcloud-alibaba-2-seata-distributed-transaction
# 设置默认的数据源或者数据源组，默认值即为master
spring.datasource.dynamic.primary=order-ds
# 订单order数据源配置
spring.datasource.dynamic.datasource.order-ds.url=jdbc:mysql://localhost:3306/orderdb?serverTimezone=GMT%2B8&useUnicode=true&characterEncoding=utf8&rewriteBatchedStatements=true&useSSL=false
spring.datasource.dynamic.datasource.order-ds.driver-class-name=com.mysql.cj.jdbc.Driver
spring.datasource.dynamic.datasource.order-ds.username=root
spring.datasource.dynamic.datasource.order-ds.password=admin123456
# 商品product数据源配置
spring.datasource.dynamic.datasource.product-ds.url=jdbc:mysql://localhost:3306/productdb?serverTimezone=GMT%2B8&useUnicode=true&characterEncoding=utf8&rewriteBatchedStatements=true&useSSL=false
spring.datasource.dynamic.datasource.product-ds.driver-class-name=com.mysql.cj.jdbc.Driver
spring.datasource.dynamic.datasource.product-ds.username=root
spring.datasource.dynamic.datasource.product-ds.password=admin123456
# 账户account数据源配置
spring.datasource.dynamic.datasource.account-ds.url=jdbc:mysql://localhost:3306/accountdb?serverTimezone=GMT%2B8&useUnicode=true&characterEncoding=utf8&rewriteBatchedStatements=true&useSSL=false
spring.datasource.dynamic.datasource.account-ds.driver-class-name=com.mysql.cj.jdbc.Driver
spring.datasource.dynamic.datasource.account-ds.username=root
spring.datasource.dynamic.datasource.account-ds.password=admin123456
# 是否启动对Seata的集成
spring.datasource.dynamic.seata=true
#-----------------------------------------------------------
#单机版 tc server 配置
# Seata应用编号，默认为 ${spring.application.name}
seata.application-id=springboot-seata
# Seata事务组编号，用于TC集群名，一般格式为：${spring.application.name}-group
seata.tx-service-group=springboot-seata-group
# 虚拟组和分组的映射 seata.service.vgroup-mapping.${seata.tx-service-group}=default
seata.service.vgroup-mapping.springboot-seata-group=default
# 分组和Seata服务的映射，此处default指上面 seata.service.vgroup-mapping.springboot-seata-group 的值 default
seata.service.grouplist.default=192.168.133.129:8091
# 存储模式 默认 file模式
seata.config.type=file
# 默认为 file
seata.registry.type=file
#------------------------------------------------------------
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
```

order逻辑类

注：

（1）** @DS**注解；多数据源切换

（2）** @GlobalTransactional**注解；seata全局事务注解

**主服务加上@GlobalTransactional注解即可，被调用服务不用加@GlobalTransactional和@Transactional**

```java
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
    /**
     * MyBatis-Plus 使用 @DS注解 做多数据源切换
     * 语法：@DS(value = "数据源名称")
     * 1、依赖：
     *         <dependency>
     *             <groupId>com.baomidou</groupId>
     *             <artifactId>dynamic-datasource-spring-boot-starter</artifactId>
     *             <version>3.0.0</version>
     *         </dependency>
     * 2、yml 或 properties 配置
     * 设置默认的数据源或者数据源组，默认值即为master
     * spring.datasource.dynamic.primary=order-ds
     *
     * 订单order数据源配置
     * spring.datasource.dynamic.datasource.order-ds.url=jdbc:mysql://localhost:3306/orderdb?serverTimezone=GMT%2B8&useUnicode=true&characterEncoding=utf8&rewriteBatchedStatements=true&useSSL=false
     * spring.datasource.dynamic.datasource.order-ds.driver-class-name=com.mysql.cj.jdbc.Driver
     * spring.datasource.dynamic.datasource.order-ds.username=root
     * spring.datasource.dynamic.datasource.order-ds.password=admin123456
     *
     * 商品product数据源配置
     * spring.datasource.dynamic.datasource.product-ds.url=jdbc:mysql://localhost:3306/productdb?serverTimezone=GMT%2B8&useUnicode=true&characterEncoding=utf8&rewriteBatchedStatements=true&useSSL=false
     * spring.datasource.dynamic.datasource.product-ds.driver-class-name=com.mysql.cj.jdbc.Driver
     * spring.datasource.dynamic.datasource.product-ds.username=root
     * spring.datasource.dynamic.datasource.product-ds.password=admin123456
     * 3、@DS注解到实现类或者实现类的方法上才可以
     * 当注解添加到类上，意味着此类里的方法都使用此数据源；
     * 当注解添加到方法上时，意味着此方法上使用的数据源优先级高于其他一切配置
     * 注：
     * （1）注解添加在dao.mapper上无效
     * （2）注解添加到interface Service类上无效
     * （3）注解添加到interface Service方法上无效
     */
    @DS(value = "order-ds")
    @GlobalTransactional //seata全局事务注解
    public Integer createOrder(Integer userId, Integer productId) throws Exception {
        Integer amount = 1; // 购买数量暂时设置为 1
        log.info("当前 XID: {}", RootContext.getXID());
        //1、减库存
        Product product = productService.reduceStock(productId, amount);
        //2、减余额
        accountService.reduceBalance(userId, product.getPrice());
        //3、下订单
        Orders order = new Orders();
        order.setUserId(userId);
        order.setProductId(productId);
        order.setPayAmount(product.getPrice().multiply(new BigDecimal(amount)));
        order.setAddTime(new Date());
        ordersMapper.insertSelective(order);
        //造成异常，测试是否回滚
        //int a = 10/0;
        log.info("下订单: {}", order.getId());
        // 返回订单编号
        return order.getId();
    }
}
```

product逻辑类

```java
@Slf4j
@Service
public class ProductServiceImpl implements ProductService {
    @Autowired
    private ProductMapper productMapper;
    @Override
    @DS(value = "product-ds")
    public Product reduceStock(Integer productId, Integer amount) throws Exception {
        log.info("当前 XID: {}", RootContext.getXID());
        // 检查库存
        Product product = productMapper.selectByPrimaryKey(productId);
        if (product.getStock() < amount) {
            throw new Exception("库存不足");
        }
        // 扣减库存
        int updateCount = productMapper.reduceStock(productId, amount);
        // 扣除成功
        if (updateCount == 0) {
            throw new Exception("库存不足");
        }
        //造成异常，测试是否回滚
        //int a = 10/0;
        // 扣除成功
        log.info("扣除 {} 库存成功", productId);
        return product;
    }
}
```

account逻辑类

```java
@Slf4j
@Service
public class AccountServiceImpl implements AccountService {
    @Autowired
    private AccountMapper accountMapper;
    @Override
    @DS(value = "account-ds")
    public void reduceBalance(Integer userId, BigDecimal money) throws Exception {
        log.info("当前 XID: {}", RootContext.getXID());
        // 检查余额
        Account account = accountMapper.selectAccountByUserId(userId);
        if (account.getBalance().doubleValue() < money.doubleValue()) {
            throw new Exception("余额不足");
        }
        // 扣除余额
        int updateCount = accountMapper.reduceBalance(userId, money);
        // 扣除成功
        if (updateCount == 0) {
            throw new Exception("余额不足");
        }
        //造成异常，测试是否回滚
        //int a = 10/0;
        log.info("扣除用户 {} 余额成功", userId);
    }
}
```

**5、** 启动seata-server；浏览器输入访问[http://localhost:8081/order?userId=1&productId=1](http://localhost:8081/order?userId=1&productId=1)；

可分别在 OrderServiceImpl、ProductServiceImpl、AccountServiceImpl 实现类中 写入如下代码进行事务回滚测试

```java
//造成异常，测试是否回滚
int a = 10/0;
```

## @DS注解

MyBatis-Plus 使用 @DS注解 做多数据源切换

语法：

> @DS(value = "数据源名称")

**1、** 依赖：

```xml
<!-- dynamic-datasource-spring-boot-starter动态数据源 -->
<dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>dynamic-datasource-spring-boot-starter</artifactId>
    <version>3.2.0</version>
</dependency>
```

**2、** yml或properties配置；

```bash
# 设置默认的数据源或者数据源组，默认值即为master
spring.datasource.dynamic.primary=order-ds
# 订单order数据源配置
spring.datasource.dynamic.datasource.order-ds.url=jdbc:mysql://localhost:3306/orderdb?serverTimezone=GMT%2B8&useUnicode=true&characterEncoding=utf8&rewriteBatchedStatements=true&useSSL=false
spring.datasource.dynamic.datasource.order-ds.driver-class-name=com.mysql.cj.jdbc.Driver
spring.datasource.dynamic.datasource.order-ds.username=root
spring.datasource.dynamic.datasource.order-ds.password=admin123456
# 商品product数据源配置
spring.datasource.dynamic.datasource.product-ds.url=jdbc:mysql://localhost:3306/productdb?serverTimezone=GMT%2B8&useUnicode=true&characterEncoding=utf8&rewriteBatchedStatements=true&useSSL=false
spring.datasource.dynamic.datasource.product-ds.driver-class-name=com.mysql.cj.jdbc.Driver
spring.datasource.dynamic.datasource.product-ds.username=root
spring.datasource.dynamic.datasource.product-ds.password=admin123456
# 账户account数据源配置
spring.datasource.dynamic.datasource.account-ds.url=jdbc:mysql://localhost:3306/accountdb?serverTimezone=GMT%2B8&useUnicode=true&characterEncoding=utf8&rewriteBatchedStatements=true&useSSL=false
spring.datasource.dynamic.datasource.account-ds.driver-class-name=com.mysql.cj.jdbc.Driver
spring.datasource.dynamic.datasource.account-ds.username=root
spring.datasource.dynamic.datasource.account-ds.password=admin123456
```

**3、** @DS注解到实现类或者实现类的方法上才可以；

当注解添加到类上，意味着此类里的方法都使用此数据源；

当注解添加到方法上时，意味着此方法上使用的数据源优先级高于其他一切配置

注：

（1）注解添加在dao.mapper上无效

（2）注解添加到interface Service类上无效

（3）注解添加到interface Service方法上无效

> 注：
>
> 如果try catch 异常 则不会回滚事务

## 二、AT事务模式：Spring Cloud Alibaba微服务AT分布式事务

**1、** 临时关闭Linux上防火墙，或者设置端口访问权限；

```bash
systemctl stop firewalld
```

**2、** 因Nacos使用mysql持久化，需要先开启mysql服务（手动安装或者docker启动，docker启动需要先启动docker和挂载mysql服务，不然重启docker或者mysql导致mysql数据丢失）；

**3、** 首先启动nacos服务；

```bash
sh startup.sh -m standalone
```

> 单机环境必须带-m standalone参数启动；不带参数启动的是集群环境

**4、** 因Seataserver使用的Nacos注册中心，需要配置conf/registry.conf文件，选择nacos；

Seata Server 配置

在Seata Server 安装目录下的 config/registry.conf 中，将配置方式（config.type）修改为 Nacos，并对 Nacos 配置中心的相关信息进行配置

如果使用了 注册中心 ，如 type="nacos"等要检查nacos的 应用名application、服务注册地址serverAddr、分组group、命名空间namespace、集群cluster、用户名username、密码password是否正确等

```bash
config {
  Seata 支持 file、nacos 、apollo、zk、consul、etcd3 等多种配置中心
 配置方式修改为 nacos
  type = "nacos"
  nacos {
   修改为使用的 nacos 服务器地址
    serverAddr = "127.0.0.1:8848"
   配置中心的命名空间
    namespace = ""
   配置中心所在的分组
    group = "SEATA_GROUP"
   Nacos 配置中心的用户名
    username = "nacos"
   Nacos 配置中心的密码
    password = "nacos"
  }
}
```

不然报错：

```bash
no available service found in cluster 'default', please make sure registry config correct and keep your seata server running
```

**Seata Client 配置**

在Seata Client（即微服务架构中的服务）中，通过 application.yml 等配置文件对 Nacos 配置中心进行配置

```bash
#-----------------------------------------------------------
#单机版 tc server 配置
# Seata应用编号，默认为 ${spring.application.name}
seata.application-id=springcloud-order-seata
# Seata事务组编号，用于TC集群名，一般格式为：${spring.application.name}-group
seata.tx-service-group=springcloud-order-seata-group
# 注：虚拟组和分组的映射要写对，不然报错：
# no available service 'null' found, please make sure registry config correct
# 虚拟组和分组的映射 seata.service.vgroup-mapping.${seata.tx-service-group}=default
seata.service.vgroup-mapping.springcloud-order-seata-group=default
# 分组和Seata服务的映射，此处default指上面 seata.service.vgroup-mapping.springboot-seata-group 的值 default
#seata.service.grouplist.default=192.168.133.129:8091
# 存储模式 默认 file模式
seata.config.type=file
# 默认为 file
#seata.registry.type=file
#------------------------------------------------------------
#设置使用注册中心
#seata-spring-boot-starter 1.1版本少一些配置项
seata.enabled=true
seata.registry.type=nacos
# 集群
seata.registry.nacos.cluster=default
# 分组
seata.registry.nacos.group=SEATA_GROUP
# 应用名
seata.registry.nacos.application=seata-server
# 服务注册地址
seata.registry.nacos.server-addr=192.168.133.129:8848
```

注：！！！

Seata应用编号 seata.application-id，默认为 ${spring.application.name}

Seata事务组编号 seata.tx-service-group，用于TC集群名，一般格式为：${spring.application.name}-group

Seata虚拟组和分组的映射 seata.service.vgroup-mapping.${seata.tx-service-group}=default

三者对应关系要写对，不然会报错：

```bash
no available service 'null' found, please make sure registry config correct
```

## 测试应用

**1、** 创建4个SpringBoot模块；

### （1）springcloud-alibaba-2-seata-distributed-commons

```xml
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
@FeignClient(name = "springcloud-alibaba-2-seata-distributed-account")
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
@FeignClient(name = "springcloud-alibaba-2-seata-distributed-order")
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
@FeignClient(name = "springcloud-alibaba-2-seata-distributed-product")
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

### （2）springcloud-alibaba-2-seata-distributed-order

注意：

**1、** 异常需要层层往上抛，如果你在子服务将异常处理的话（比如全局异常处理GlobalExceptionHandler），seata会认为你已经手动处理了异常；

**2、** 出现事务失效的情况下，优先检查RootContext.getXID()，xid是否传递且一致；

**3、** 主服务加上@GlobalTransactional注解即可，被调用服务不用加@GlobalTransactional和@Transactional；

**4、** @GlobalTransactional(rollbackFor=Exception.class)最好加上rollbackFor=Exception.class，表示遇到Exception都回滚，不然遇到有些异常（如自定义异常）则不会回滚；

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
    private FeignAccountService accountService;
    @Autowired
    private FeignProductService productService;
    @Override
    @GlobalTransactional //seata全局事务注解
    public Integer createOrder(Integer userId, Integer productId) {
        Integer amount = 1; // 购买数量暂时设置为 1
        log.info("当前 XID: {}", RootContext.getXID());
        //1、减库存
        Product product = productService.reduceStock(productId, amount);
        //2、减余额
        accountService.reduceBalance(userId, product.getPrice());
        //3、下订单
        Orders order = new Orders();
        order.setUserId(userId);
        order.setProductId(productId);
        order.setPayAmount(product.getPrice().multiply(new BigDecimal(amount)));
        order.setAddTime(new Date());
        ordersMapper.insertSelective(order);
        //造成异常，测试是否回滚
        int a = 10/0;
        log.info("下订单: {}", order.getId());
        // 返回订单编号
        return order.getId();
    }
}
```

```xml
<groupId>com.company</groupId>
    <artifactId>springcloud-alibaba-2-seata-distributed-order</artifactId>
    <version>1.0.0</version>
    <name>springcloud-alibaba-2-seata-distributed-order</name>
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
            <artifactId>springcloud-alibaba-2-seata-distributed-commons</artifactId>
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

注：！！！

seata-spring-boot-starter 服务端和客户端版本要一致，不然报错：

```bash
no available service 'default' found, please make sure registry config correct
```

```bash
server.port=8081
spring.application.name=springcloud-alibaba-2-seata-distributed-order
spring.datasource.url=jdbc:mysql://192.168.133.129:3306/orderdb?serverTimezone=GMT%2B8&useUnicode=true&characterEncoding=utf8&rewriteBatchedStatements=true&useSSL=false
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.datasource.username=root
spring.datasource.password=123456
#nacos服务的注册与发现
spring.cloud.nacos.discovery.server-addr=192.168.133.129:8848
# 用户名、密码为默认时，测试发现不写 用户名、密码也可以
spring.cloud.nacos.username=nacos
spring.cloud.nacos.password=nacos
#-----------------------------------------------------------
#单机版 tc server 配置
# Seata应用编号，默认为 ${spring.application.name}
seata.application-id=springcloud-order-seata
# Seata事务组编号，用于TC集群名，一般格式为：${spring.application.name}-group
seata.tx-service-group=springcloud-order-seata-group
# 注：虚拟组和分组的映射要写对，不然报错：
# no available service 'null' found, please make sure registry config correct
# 虚拟组和分组的映射 seata.service.vgroup-mapping.${seata.tx-service-group}=default
seata.service.vgroup-mapping.springcloud-order-seata-group=default
# 分组和Seata服务的映射，此处default指上面 seata.service.vgroup-mapping.springboot-seata-group 的值 default
#seata.service.grouplist.default=192.168.133.129:8091
# 存储模式 默认 file模式
seata.config.type=file
# 默认为 file
#seata.registry.type=file
#------------------------------------------------------------
#设置使用注册中心
#seata-spring-boot-starter 1.1版本少一些配置项
seata.enabled=true
seata.registry.type=nacos
# 集群
seata.registry.nacos.cluster=default
# 分组
seata.registry.nacos.group=SEATA_GROUP
# 应用名
seata.registry.nacos.application=seata-server
# 服务注册地址
seata.registry.nacos.server-addr=192.168.133.129:8848
#feign超时时间设置
feign.client.config.default.connect-timeout=60000
feign.client.config.default.read-timeout=60000
```

### （3）springcloud-alibaba-2-seata-distributed-product

```java
@Slf4j
@Service
public class ProductServiceImpl implements ProductService {
    @Autowired
    private ProductMapper productMapper;
    @Override
    public Product reduceStock(Integer productId, Integer amount) throws Exception {
        log.info("当前 XID: {}", RootContext.getXID());
        // 检查库存
        Product product = productMapper.selectByPrimaryKey(productId);
        if (product.getStock() < amount) {
            throw new Exception("库存不足");
        }
        // 扣减库存
        int updateCount = productMapper.reduceStock(productId, amount);
        // 扣除成功
        if (updateCount == 0) {
            throw new Exception("库存不足");
        }
        //造成异常，测试是否回滚
        //int a = 10/0;
        // 扣除成功
        log.info("扣除 {} 库存成功", productId);
        return product;
    }
}
```

### （4）springcloud-alibaba-2-seata-distributed-account

```java
@Slf4j
@Service
public class AccountServiceImpl implements AccountService {
    @Autowired
    private AccountMapper accountMapper;
    @Override
    public void reduceBalance(Integer userId, BigDecimal money) throws Exception {
        log.info("当前 XID: {}", RootContext.getXID());
        // 检查余额
        Account account = accountMapper.selectAccountByUserId(userId);
        if (account.getBalance().doubleValue() < money.doubleValue()) {
            throw new Exception("余额不足");
        }
        // 扣除余额
        int updateCount = accountMapper.reduceBalance(userId, money);
        // 扣除成功
        if (updateCount == 0) {
            throw new Exception("余额不足");
        }
        //造成异常，测试是否回滚
        //int a = 10/0;
        log.info("扣除用户 {} 余额成功", userId);
    }
}
```

**2、** 先启动Nacos，再启动Seata-Server；

Nacos中注册服务列表如下：

> 注：
>
> 如果try catch 异常 则不会回滚事务

## 三、遇到问题

## 1、启动seata server遇到问题

报错如下：

```bash
Failed to retry rollbacking [192.168.133.129:8091:702852926242021399] Unknown java.lang.RuntimeException: rm client is not connected.
dbkey:jdbc:mysql://localhost:3306/orderdb,clientId:springboot-seata:192.168.133.1:64279
```

因之前博主测试 AT事务模式：单体应用多数据源分布式事务，导致 /bin/sessionStore/root.data 中含有回滚数据 ，但是连接的 数据库url是错误的，将其修改掉或者直接删除

rm-rf root.data

重新启动即可

启动seata server 报错也可参考

[https://blog.csdn.net/MinggeQingchun/article/details/126172351](https://blog.csdn.net/MinggeQingchun/article/details/126172351)

## 2、 no available service 'null' found, please make sure registry config correct

no available service 'default' found, please make sure registry config correct

no available service found in cluster 'default', please make sure registry config correct and keep your seata server running

启动项目时因为 Seata 服务注册到Nacos 出现过如下三种错误：

### （1） no available service 'null' found, please make sure registry config correct

Seata应用编号 seata.application-id，默认为 ${spring.application.name}

Seata事务组编号 seata.tx-service-group，用于TC集群名，一般格式为：${spring.application.name}-group

Seata虚拟组和分组的映射 seata.service.vgroup-mapping.${seata.tx-service-group}=default

三者对应关系要写对，不然会报错：

```bash
no available service 'null' found, please make sure registry config correct
```

### （2）no available service 'default' found, please make sure registry config correct

博主Seata Server 使用 1.4.2 版本

```xml
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
    <version>1.4.2/version>
</dependency>
<dependency>
    <groupId>com.alibaba.nacos</groupId>
    <artifactId>nacos-client</artifactId>
    <version>1.2.0及以上版本</version>
</dependency>
```

seata-spring-boot-starter 服务端和客户端版本要一致，不然报错：

```java
no available service 'default' found, please make sure registry config correct
```

### （3）no available service found in cluster 'default', please make sure registry config correct and keep your seata server running

使用了注册中心 ，如 type="nacos"等要检查nacos的 应用名application、服务注册地址serverAddr、分组group、命名空间namespace、集群cluster、用户名username、密码password是否正确等

```bash
config {
  Seata 支持 file、nacos 、apollo、zk、consul、etcd3 等多种配置中心
 配置方式修改为 nacos
  type = "nacos"
  nacos {
   修改为使用的 nacos 服务器地址
    serverAddr = "127.0.0.1:8848"
   配置中心的命名空间
    namespace = ""
   配置中心所在的分组
    group = "SEATA_GROUP"
   Nacos 配置中心的用户名
    username = "nacos"
   Nacos 配置中心的密码
    password = "nacos"
  }
}
```

不然报错：

```bash
no available service found in cluster 'default', please make sure registry config correct and keep your seata server running
```
