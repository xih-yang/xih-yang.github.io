# 19、Mybatis-Plus入门 - 多数据源使用详解
- 来源：https://ddkk.com/zhuanlan/orm/mybatisplus/5/19.html
- 分类：ORM框架
- 分组：教程目录
### 简介

`dynamic-datasource-spring-boot-starter` 是一个基于`spring boot`的快速集成多数据源的启动器。

其支持Jdk 1.7+, SpringBoot 1.4.x 1.5.x 2.x.x。

这是一个第三方 mybatis 扩展库，与 mybatis-plus 本身无关，属于组织参与者小锅盖个人发起的项目，任何行为与 baomidou 组织其它成员无关。

### 特性

- 支持 数据源分组 ，适用于多种场景 纯粹多库 读写分离 一主多从 混合模式。
- 支持数据库敏感配置信息 加密 ENC()。
- 支持每个数据库独立初始化表结构schema和数据库database。
- 支持无数据源启动，支持懒加载数据源（需要的时候再创建连接）。
- 支持 自定义注解 ，需继承DS(3.2.0+)。
- 提供并简化对Druid，HikariCp，BeeCp，Dbcp2的快速集成。
- 提供对Mybatis-Plus，Quartz，ShardingJdbc，P6sy，Jndi等组件的集成方案。
- 提供 自定义数据源来源 方案（如全从数据库加载）。
- 提供项目启动后 动态增加移除数据源 方案。
- 提供Mybatis环境下的 纯读写分离 方案。
- 提供使用 spel动态参数 解析数据源方案。内置spel，session，header，支持自定义。
- 支持 多层数据源嵌套切换 。（ServiceA >>> ServiceB >>> ServiceC）。
- 提供 基于seata的分布式事务方案。
- 提供 本地多数据源事务方案。 附：不能和原生spring事务混用。

### 约定

- 本框架只做 切换数据源 这件核心的事情，并不限制你的具体操作，切换了数据源可以做任何CRUD。
- 配置文件所有以下划线 _ 分割的数据源 首部 即为组的名称，相同组名称的数据源会放在一个组下。
- 切换数据源可以是组名，也可以是具体数据源名称。组名则切换时采用负载均衡算法切换。
- 默认的数据源名称为 master ，你可以通过 spring.datasource.dynamic.primary 修改。
- 方法上的注解优先于类上注解。
- DS支持继承抽象类上的DS，暂不支持继承接口上的DS。

### 使用案例

#### 1. 创建项目，引入依赖

创建了两个数据库，一个账户、一个订单：

创建一个Spring Boot工程，使用Mybatis-Plus 的代码生成工具生成MVC 三层代码：

引入多数据源依赖：

```java
        <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>mybatis-plus-boot-starter</artifactId>
            <version>3.4.2</version>
        </dependency>
        <!-- https://mvnrepository.com/artifact/com.baomidou/dynamic-datasource-spring-boot-starter -->
        <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>dynamic-datasource-spring-boot-starter</artifactId>
            <version>3.5.1</version>
        </dependency>
```

配置MP:

```java
mybatis-plus:
  typeAliasesPackage: org.pearl.mp.danamic.**.entity
  mapperLocations: classpath:org.pearl.mp.danamic.dao.mapper/*.xml
  global-config:
    db-config:
      id-type: auto
  configuration:
    map-underscore-to-camel-case: true
    call-setters-on-nulls: true
```

#### 2. 添加hikari 数据源

添加hikari 数据源、多个数据库配置信息，注意hikari 的格式需要按照如下配置，不然是不生效的：

```java
spring:
  application:
    name: dynamic-datasource-seata-demo
  datasource:
    多数据源
    dynamic:
      连接池配置，同理使用[druid]时也需要配置在当前位置，否则会配置无法生效或报错，hikari地址：https://github.com/brettwooldridge/HikariCP
      hikari:
        从池返回的连接的默认自动提交行为，默认值：true
        is-auto-commit: true
        一个连接idle（闲置）状态的最大时长（毫秒），超时则被释放（retired），缺省:10分钟
        idle-timeout: 600000
        等待连接池分配连接的最大时长（毫秒），超过这个时长还没可用的连接则发生SQLException，最低可接受的连接超时为250 ms。 缺省:30秒
        connection-timeout: 30000
        控制池中连接的最长存活时间，默认值:1800000 (30分钟)
        max-lifetime: 1800000
        最小数量的空闲连接，如果空闲连接数低于此值，并且池中的总连接数小于maximumPoolSize，HikariCP将尽最大努力快速高效地添加额外的连接。
        为了获得最佳性能和对峰值需求的响应能力，我们建议不设置该值，默认值:与maxPoolSize相同
        min-idle: 20
         池中最大连接数，包括闲置和使用中的连接，默认为10，实际配置需要根据环境，推荐公式 connections = ((core_count * 2) + effective_spindle_count)
        max-pool-size: 20
      设置默认的数据源或者数据源组,默认值即为account
      primary: db_account
      严格匹配数据源,默认false. true未匹配到指定数据源时抛异常,false使用默认数据源
      strict: false
      数据源
      datasource:
        名称
        db_account:
          类型=》Hikari
          type: com.zaxxer.hikari.HikariDataSource
          驱动名称
          driver-class-name: com.mysql.cj.jdbc.Driver
          地址
          url: jdbc:mysql://127.0.0.1/db_account?serverTimezone=GMT%2B8&useUnicode=true&characterEncoding=utf8&useSSL=false&allowMultiQueries=true
          连接用户名
          username: root
          连接密码
          password: 123456
        db_order:
          type: com.zaxxer.hikari.HikariDataSource
          driver-class-name: com.mysql.cj.jdbc.Driver
          url: jdbc:mysql://127.0.0.1/db_order?serverTimezone=GMT%2B8&useUnicode=true&characterEncoding=utf8&useSSL=false&allowMultiQueries=true
          username: root
          password: 123456
```

#### 3. 编写业务逻辑

账户数据库扣除账户余额：

```java
    @Override
    public void reduceMoney() {
        // 扣除账户余额
        AccountTbl accountTbl = accountTblMapper.selectById(12);
        AccountTbl accountTbl1 = accountTbl.setMoney(accountTbl.getMoney() - 1);
        accountTblMapper.updateById(accountTbl1);
    }
```

订单数据库插入订单，使用`@DS` 注解标记在业务方法上，`@DS`可以注解在方法上或类上，同时存在就近原则 方法上注解 优先于 类上注解。

```java
    @Override
    @DS("db_order")
    public void insertOrder() {
        // 插入订单
        OrderTbl orderTbl = new OrderTbl();
        orderTbl.setUserId("12");
        orderTbl.setCommodityCode("IPHONE 13");
        orderTbl.setCount(1);
        orderTblMapper.insert(orderTbl);
    }
```

注解
结果

没有@DS
默认数据源

@DS(“dsName”)
dsName可以为组名也可以为具体某个库的名称

#### 4. 测试

编写一个访问接口，调用两个数据源进行操作：

```java
    @GetMapping("/test")
    public Object test() throws InterruptedException {
        accountTblService.reduceMoney();
        orderTblService.insertOrder();
        return "执行完毕！";
    }
```

检查数据库，查看账户余额已被扣除，订单也已成功插入，集成成功。
