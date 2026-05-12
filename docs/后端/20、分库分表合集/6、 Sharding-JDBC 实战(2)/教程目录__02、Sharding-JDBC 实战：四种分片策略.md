# 02、Sharding-JDBC 实战：四种分片策略
- 来源：https://ddkk.com/zhuanlan/sharding/shardingjdbc/2/2.html
- 分类：分库分表
- 分组：教程目录
## 准备工作

### 1.SQL

```java
-- ------------------------------
-- 用户表
-- ------------------------------
CREATE TABLE t_user (
  id bigint(16) NOT NULL AUTO_INCREMENT COMMENT '主键',
  username varchar(64) NOT NULL COMMENT '用户名',
  password varchar(64) NOT NULL COMMENT '密码',
  age int(8) NOT NULL COMMENT '年龄',
  salary int(8) NOT NULL COMMENT '工资',
  create_time timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户表';
-- ------------------------------
-- 用户表1
-- ------------------------------
CREATE TABLE t_user_1 (
  id bigint(16) NOT NULL AUTO_INCREMENT COMMENT '主键',
  username varchar(64) NOT NULL COMMENT '用户名',
  password varchar(64) NOT NULL COMMENT '密码',
  age int(8) NOT NULL COMMENT '年龄',
  salary int(8) NOT NULL COMMENT '工资',
  create_time timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户表1';
-- ------------------------------
-- 用户表2
-- ------------------------------
CREATE TABLE t_user_2 (
  id bigint(16) NOT NULL AUTO_INCREMENT COMMENT '主键',
  username varchar(64) NOT NULL COMMENT '用户名',
  password varchar(64) NOT NULL COMMENT '密码',
  age int(8) NOT NULL COMMENT '年龄',
  salary int(8) NOT NULL COMMENT '工资',
  create_time timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户表2';
```

### 2.数据源配置

注意：数据库命名不能使用下划线，会报错：mydb_0 invalid

```java
spring:
  shardingsphere:
    打印sql
    props:
      sql:
        show: true
    datasource:
      names: mydb-1,mydb-2
      mydb-1:
        type: com.alibaba.druid.pool.DruidDataSource
        url: jdbc:mysql://localhost:3306/mydb-1?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Shanghai
        driver-class-name: com.mysql.cj.jdbc.Driver
        username: root
        password: root
        数据源其他配置
        initialSize: 5
        minIdle: 5
        maxActive: 20
        maxWait: 60000
        timeBetweenEvictionRunsMillis: 60000
        minEvictableIdleTimeMillis: 300000
        validationQuery: SELECT 1 FROM DUAL
        testWhileIdle: true
        testOnBorrow: false
        testOnReturn: false
        poolPreparedStatements: true
        配置监控统计拦截的filters，去掉后监控界面sql无法统计，'wall'用于防火墙
       filters: stat,wall,log4j
        maxPoolPreparedStatementPerConnectionSize: 20
        useGlobalDataSourceStat: true
        connectionProperties: druid.stat.mergeSql=true;druid.stat.slowSqlMillis=500
      mydb-2:
        type: com.alibaba.druid.pool.DruidDataSource
        url: jdbc:mysql://localhost:3306/mydb-2?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Shanghai
        driver-class-name: com.mysql.cj.jdbc.Driver
        username: root
        password: root
        数据源其他配置
        initialSize: 5
        minIdle: 5
        maxActive: 20
        maxWait: 60000
        timeBetweenEvictionRunsMillis: 60000
        minEvictableIdleTimeMillis: 300000
        validationQuery: SELECT 1 FROM DUAL
        testWhileIdle: true
        testOnBorrow: false
        testOnReturn: false
        poolPreparedStatements: true
        配置监控统计拦截的filters，去掉后监控界面sql无法统计，'wall'用于防火墙
       filters: stat,wall,log4j
        maxPoolPreparedStatementPerConnectionSize: 20
        useGlobalDataSourceStat: true
        connectionProperties: druid.stat.mergeSql=true;druid.stat.slowSqlMillis=500
```

## 一、标准分片策略

> 标准分片策略（StandardShardingStrategy）： 只支持对单个分片键为依据的分库分表，并提供了两种分片算法：
>
>
> PreciseShardingAlgorithm（精准分片）：在使用标准分片策略时，精准分片算法时必须实现的算法，用于SQL含有 = 和 IN 的分片处理；
> RangeShardingAlgorithm（范围分片）：非必选的，用于处理含有 BETWEEN AND 的分片处理。
>
> 注意： 一旦我们没配置范围分片算法，而SQL中又用到 BETWEEN AND 或者 LIKE 等，那么 SQL 将按全库、表路由的方式逐一执行，查询性能会很差。

**使用方法：**

使用四种分片策略的方式大致相同，都要实现相应的 `ShardingAlgorithm` 接口，并重写 doSharding() 方法，只是配置稍有不同，doSharding() 方法本身只是个空方法，需要我们自行处理分库、分表逻辑。

### 1.精准分片算法

**使用场景：**

- SQL 语句中有 >`，>`=，``，>`=，` **行表达式分片策略（InlineShardingStrategy）：**在配置中使用 Groovy 表达式，提供对 SQL 语言中的 = 和 IN 的分片操作支持，它只支持单分片键。

**使用场景：**

- 适用于做简单的分片算法，无需自定义分片算法，省去了繁琐的代码开发，是四种分片策略中最为简单的。

比如：ds-KaTeX parse error: Expected '}', got 'EOF' at end of input: … 表示对 age 做取模计算， 是个通配符，用来承接计算结果，最终计算出分库 ds-0 … ds-n

**yaml配置：**

```java
spring:
  shardingsphere:
    sharding:
      表策略配置
      tables:
        t_user 是逻辑表
        t_user:
          分表节点 可以理解为分表后的那些表 比如 t_user_1 ,t_user_2 ,t_user_3
          actualDataNodes: mydb.t_user_$->{
     1..3}
          tableStrategy:
            inline:
              根据哪列分表
              shardingColumn: age
              分表算法 例如：age为奇数 -> t_user_2； age为偶数 -> t_user_1
              algorithmExpression: t_user_$->{
     age % 2 + 1}
```

## 四、Hint分片策略

> Hint分片策略（HintShardingStrategy）： 相比于其他分片策略稍有不同，这种分片策略无需配置分片键，分片键值也不再从 SQL 中解析，而是由外部指定分片信息，让 SQL 在指定的分库、分表中执行。
>
>
> ShardingSphere 通过 Hint API 实现指定操作，实际上就是把分片规则 tablerule、databaserule 由集中配置变成了个性化配置。

**使用场景：**

- 如果我们希望用户表 t_user 用 age 做分片键进行分库分表，但是 t_user 表中却没有 age 这个字段，这时可以通过 Hint API 在外部手动指定分片键或分片库。

**yaml配置：**

```java
spring:
  shardingsphere:
    sharding:
      表策略配置
      tables:
        t_user 是逻辑表
        t_user:
          分表节点 可以理解为分表后的那些表 比如 t_user_1 ,t_user_2
          actualDataNodes: mydb.t_user_$->{
     1..2}
          tableStrategy:
            hint:
              复合分库算法
              algorithmClassName: com.demo.module.config.MyTableHintShardingAlgorithm
```

**代码实现：**

```java
public class MyTableHintShardingAlgorithm implements HintShardingAlgorithm<Integer> {
    @Override
    public Collection<String> doSharding(Collection<String> tableNames, HintShardingValue<Integer> hintShardingValue) {
        List<String> result = new ArrayList<>();
        for (Integer shardingValue : hintShardingValue.getValues()) {
            result.add(shardingValue < 18 ? "t_user_1" : "t_user_2");
        }
        return result;
    }
}
```

**测试验证1-插入数据：**

```java
    @Test
    void hintSaveTest() {
        // 清除掉上一次的规则，否则会报错
        HintManager.clear();
        // HintManager API 工具类实例
        HintManager hintManager = HintManager.getInstance();
        // 直接指定对应具体的数据库
        hintManager.addDatabaseShardingValue("mydb",0);
        // 设置表的分片键值，自定义操作哪个分片中
        hintManager.addTableShardingValue("t_user" , 18);
        // 在读写分离数据库中，Hint 可以强制读主库
        hintManager.setMasterRouteOnly();
        List<TUser> users = new ArrayList<>(3);
        users.add(new TUser("ACGkaka_1", "123456", 10, 3000));
        users.add(new TUser("ACGkaka_2", "123456", 18, 4000));
        users.add(new TUser("ACGkaka_3", "123456", 15, 6000));
        users.add(new TUser("ACGkaka_4", "123456", 19, 7000));
        userService.saveBatch(users);
    }
```

**操作结果：**

**测试验证2-查询数据：**

```java
    @Test
    void hintListTest() {
        // 清除掉上一次的规则，否则会报错
        HintManager.clear();
        // HintManager API 工具类实例
        HintManager hintManager = HintManager.getInstance();
        // 直接指定对应具体的数据库
        hintManager.addDatabaseShardingValue("mydb",0);
        // 设置表的分片键值，自定义操作哪个分片中
        hintManager.addTableShardingValue("t_user" , 18);
        // 在读写分离数据库中，Hint 可以强制读主库
        hintManager.setMasterRouteOnly();
        QueryWrapper<TUser> wrapper = new QueryWrapper<>();
        List<TUser> users = userService.list(wrapper);
        System.out.println(">>>>>>>>>> 【Result】 <<<<<<<<<< ");
        users.forEach(System.out::println);
    }
```

**操作结果：**

## 五、源码地址

> 地址：https://gitee.com/acgkaka/SpringBootExamples/tree/master/springboot-sharding-jdbc-4types

参考地址：

**1、** 分库分表的4种分片策略，所有SQL都逃不掉的一步，https://blog.51cto.com/u_14787961/3200290；
