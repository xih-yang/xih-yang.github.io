# 06、Sharding-JDBC 实战；广播表和绑定表
- 来源：https://ddkk.com/zhuanlan/sharding/shardingjdbc/3/6.html
- 分类：分库分表
- 分组：教程目录
### 广播表配置

广播的特点是所有的接收端就能收到。所以对于这里的广播表的概念就是插入数据所有的节点都能获取到同样的数据;

一般用到比如数据字典等数据量不到，但是所有数据源都需要有相同的数据的场景

一个表配置成广播表是一定不分片的

**插入时，向所有数据源广播发送sql语句**

**查询时，只查询其中的一个数据源**

配置:只需要在broadcastTables 下可增加多个需要广播的表信息

```java
broadcastTables:
  - t_user
  - t_auth
```

### 绑定表

有这么一个场景，order 和 user 都是分片的,并且2个表是有对应的关联关系的，那么在通过连接查询2个分片的表的时候，默认的最怎么查呢?

假设有4张数据表，每个表都分片2个。

完整配置如下;

```java
spring:
  application:
    name: shardingjdbcDemo
  main:
    allow-bean-definition-overriding: true
  shardingsphere:
   数据源信息
    datasource:
     名称为dbsource-0的数据源
      dbsource-0:
        type: com.zaxxer.hikari.HikariDataSource
        driver-class-name: com.mysql.cj.jdbc.Driver
        jdbc-url: jdbc:mysql://127.0.0.1:3306/db1?serverTimezone=Asia/Shanghai&useUnicode=true&characterEncoding=utf8&useSSL=false
        username: root
        password: 123456
      names: dbsource-0
   规则的配置
    rules:
      sharding:
        tables:
         order表的规则
          t_order:
            actual-data-nodes: dbsource-0.t_order_$->{0..1}
           分表策略
            table-strategy:
             标准策略
              standard:
                sharding-column: user_id
                sharding-algorithm-name: order-alg
         user表的配置
          t_user:
            actual-data-nodes: dbsource-0.t_user_$->{0..1}
            table-strategy:
             标准策略
              standard:
                sharding-column: user_id
                sharding-algorithm-name: user-alg
       分片算法
        sharding-algorithms:
          order-alg:
            type: INLINE
            props:
              algorithm-expression: t_order_$->{user_id % 2}
          user-alg:
            type: INLINE
            props:
              algorithm-expression: t_user_$->{user_id % 2}
    props:
      sql-show: true
      sql-comment-parse-enabled: true
```

2张表都基于user_id 来分片;

插入数据

```java
    @Test
    void saveUserAndOrder() {
        List<User> users = new ArrayList<>();
        User user1 = new User();
        user1.setUserId(1L);
        user1.setUserName("张三");
        User user2 = new User();
        user2.setUserId(2L);
        user2.setUserName("李四");
        users.add(user1);
        users.add(user2);
        userMapper.insert(user1);
        userMapper.insert(user2);
        String[] citys = {"北京","上海","成都","石家庄","太原","广州","海口"};
        for (int i = 0; i < 10; i++) {
            Order order = new Order();
            order.setOrderId(Long.valueOf(i+""));
            order.setUserId((i % 2) + 1L);
            order.setOrderPrice(new BigDecimal("1"));
            order.setCity(citys[i % citys.length]);
            order.setOrderTime(LocalDateTime.now());
            orderMapper.insert(order);
        }
    }
```

order 和user 分散到不同的表中;

执行一个关联查询;

```java
  @Select(value = "select * from t_order order left join t_user user on order.user_id = user.user_id where order.user_id =#{userId}")
    List<Map<Object,Object>> queryOrderAndUserInfoByOrderId(@Param(value = "userId") Long userId);
```

使用order 上的user_id 来执行查询order 和管理的user的信息;

最终能够查到对应的结果；但是会发现会发生2条sql;

```java
 INFO 7200 --- [           main] ShardingSphere-SQL                       : Logic SQL: select * from t_order order left join t_user user on order.user_id = user.user_id where order.user_id =?
 INFO 7200 --- [           main] ShardingSphere-SQL                       : SQLStatement: MySQLSelectStatement(limit=Optional.empty, lock=Optional.empty, window=Optional.empty)
 INFO 7200 --- [           main] ShardingSphere-SQL                       : Actual SQL: dbsource-0 ::: select * from t_order_0 order left join t_user_0 user on order.user_id = user.user_id where order.user_id =? ::: [2]
 INFO 7200 --- [           main] ShardingSphere-SQL                       : Actual SQL: dbsource-0 ::: select * from t_order_0 order left join t_user_1 user on order.user_id = user.user_id where order.user_id =? ::: [2]
```

这是因为在解析对应的分片的时候，参数中是order 的user_id 所以能够知道从那个oder 中查询，而对于管理的user ，是不知道从那个真实表中查的，所以只能全部依次关联查询下;

这样的查询效率是比较低的，为了提高这个查询性能，需要配置下绑定表，将2张表具有相同的分片键的表做一个绑定，知道其中一个表的分片键，另一个关联查询的表也可以用这个表的分片键的数据查询具体分片表;

增加配置如下

这样就做了一个表的绑定，再次查询，将只发一个sql

```java
 INFO 8348 --- [           main] ShardingSphere-SQL                       : Logic SQL: select * from t_order order left join t_user user on order.user_id = user.user_id where order.user_id =?
  INFO 8348 --- [           main] ShardingSphere-SQL                       : SQLStatement: MySQLSelectStatement(limit=Optional.empty, lock=Optional.empty, window=Optional.empty)
2022-01-16 15:54:32.869  INFO 8348 --- [           main] ShardingSphere-SQL                       : Actual SQL: dbsource-0 ::: select * from t_order_0 order left join t_user_0 user on order.user_id = user.user_id where order.user_id =? ::: [2]
```
