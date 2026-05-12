# 24、分布式事务 Seata 教程 - Seata集成Mybatis-Plus多数据源
- 来源：https://ddkk.com/zhuanlan/transaction/5/24.html
- 分类：分布式事务
- 分组：教程目录
### 前言

在使用单个服务，多数据源时，也存在分布式事务问题。

当单体系统需要访问多个数据库（实例）时就会产生分布式事务。 比如：用户信 息和订单信息分别在两个MySQL实例存储，用户管理系统删除用户信息，需要分别删除用户信息及用户的订单信 息，由于数据分布在不同的数据实例，需要通过不同的数据库链接去操作数据，此时产生分布式事务。 简言之：跨 数据库实例产生分布式事务。

### 问题场景

参考此文档搭建一个多数据源项目[19、Mybatis-Plus入门 - 多数据源使用详解](/zhuanlan/orm/mybatisplus/5/19.html)。

在插入订单数据时，模拟一个异常：

```java
    @Override
    @DS("db_order")
    @Transactional
    public void insertOrder() {
        // 插入订单
        OrderTbl orderTbl = new OrderTbl();
        orderTbl.setUserId("12");
        orderTbl.setCommodityCode("IPHONE 13");
        orderTbl.setCount(1);
        orderTblMapper.insert(orderTbl);
        int i = 5 / 0;
    }
```

当进行业务操作时，订单发生异常 ，进行了回滚操作，因为在不同的数据库实例中，余额却扣除成功，此时发现数据不一致问题。

### 使用Seata 解决多数据源事务问题

#### 1. 集成Nacos Seata

参考该系列，给当前服务添加Nacos Seata 相关依赖，并启动Nacos Seata 。

#### 2. 多数据源集成Seata

多数据源集成Seata 时，主要是需要修改一下几个配置即可。

多数据源中，开启分布式事务，设置事务模式：

```java
  datasource:
    多数据源
    dynamic:
      省略其他 
      开启分布式事务
      seata: true
      事务模式 为AT
      seata-mode: AT
```

seata 中，关闭数据源自动代理

```java
seata:
  是否开启spring-boot自动装配，默认true，包括数据源的自动代理以及GlobalTransactionScanner初始化
  enabled: true
  是否开启数据源自动代理，默认开启
  enable-auto-data-source-proxy: false
```

#### 3. 测试

添加`@GlobalTransactional`注解。

```java
    @GlobalTransactional
    @GetMapping("/test")
    public Object test() throws InterruptedException {
        accountTblService.reduceMoney();
        orderTblService.insertOrder();
        return "执行完毕！";
    }
```

测试发现，异常时，余额和订单服务都进行了回滚，集成成功。
