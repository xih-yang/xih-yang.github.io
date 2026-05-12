# 02、Sharding-JDBC 实战；开始使用
- 来源：https://ddkk.com/zhuanlan/sharding/shardingjdbc/3/2.html
- 分类：分库分表
- 分组：教程目录
以springboot 来开始使用shardingjdbc

**1、** 引入shardingjdbcstarter依赖；

```java
  <dependency>
            <groupId>org.apache.shardingsphere</groupId>
            <artifactId>shardingsphere-jdbc-core-spring-boot-starter</artifactId>
            <version>${shardingsphere.version}</version>
        </dependency>
```

其他的比如数据库连接驱动，mybaytis，等引入，完整pom如下

```java
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.6.2</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>
    <groupId>com.example</groupId>
    <artifactId>shardingjdbcDemo</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>shardingjdbcDemo</name>
    <description>Demo project for shardingJdbc</description>
    <properties>
        <java.version>1.8</java.version>
        <shardingsphere.version>5.0.0</shardingsphere.version>
        <hikaricp.version>3.4.5</hikaricp.version>
        <mybatisplus-version>3.4.3.1</mybatisplus-version>
        <mysql-connector-version>8.0.27</mysql-connector-version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-devtools</artifactId>
            <scope>runtime</scope>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.apache.shardingsphere</groupId>
            <artifactId>shardingsphere-jdbc-core-spring-boot-starter</artifactId>
            <version>${shardingsphere.version}</version>
        </dependency>
        <dependency>
            <groupId>com.zaxxer</groupId>
            <artifactId>HikariCP</artifactId>
            <version>${hikaricp.version}</version>
        </dependency>
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <version>${mysql-connector-version}</version>
        </dependency>
        <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>mybatis-plus-boot-starter</artifactId>
            <version>${mybatisplus-version}</version>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

**2、** 配置数据库连接池，因为要达到sql改写的目的，所以需要将数据库连接池交给shardingjdbc来管理;；

shardingjdbc 的连接池 是 ShardingSphereDataSource ，在初始化的时候将各个连接池交给它来管理，以达到执行sql后重写和查询结果归并的目的。所以配置连接池的时候是不需要配置**spring.datasource** 而是 **spring.shardingsphere.datasource。**

这个配置多个库所以配置多个数据源

**3、** 写对应的实体类以订单为例；

```java
//实体类
@TableName(value = "t_order")
@Data
public class Order {
    @TableId(type=IdType.INPUT)
    private Long orderId;
    @TableField
    private Long userId;
    @TableField
    private BigDecimal orderPrice;
}
//mapper
public interface IOrderMapper extends BaseMapper<Order> {
}
```

**4、** 建立数据库表,分别建立名称为db1和db2的数据库（名称随意，只要能和数据库连接信息对应就行）；

分别执行建表语句

```java
CREATE TABLE t_order_0 (
  order_id bigint(20) NOT NULL,
  user_id bigint(20) DEFAULT NULL,
  order_price decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE t_order_1 (
  order_id bigint(20) NOT NULL,
  user_id bigint(20) DEFAULT NULL,
  order_price decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

达到如上图的效果

**5、** 添加完整配置；

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
     名称为dbsource-1的数据源
      dbsource-1:
        type: com.zaxxer.hikari.HikariDataSource
        driver-class-name: com.mysql.cj.jdbc.Driver
        jdbc-url: jdbc:mysql://127.0.0.1:3306/db2?serverTimezone=Asia/Shanghai&useUnicode=true&characterEncoding=utf8&useSSL=false
        username: root
        password: 123456
      names: dbsource-0,dbsource-1
   规则的配置
    rules:
      sharding:
        tables:
         配置表的规则
          t_order:
            actual-data-nodes: dbsource-$->{0..1}.t_order_$->{0..1}
           分库策略
            database-strategy:
              standard: 用于单分片键的标准分片场景
                sharding-column: user_id
                sharding-algorithm-name: db-inline
           分表策略
            table-strategy:
             标准策略
              standard:
                sharding-column: user_id
                sharding-algorithm-name: table-inline
       分片算法
        sharding-algorithms:
          db-inline:
            type: INLINE
            props:
              algorithm-expression: dbsource-$->{user_id % 2}
          table-inline:
            type: INLINE
            props:
              algorithm-expression: t_order_$->{((user_id+1) % 4).intdiv(2)}
    props:
      sql-show: true
      sql-comment-parse-enabled: true
```

**6、** 执行测试方法；

```java
 @Test
    void batchInsert(){
        for (int i = 0; i < 100; i++) {
            Order order = new Order();
            order.setOrderId(Long.valueOf(i+""));
            order.setUserId(Long.valueOf(i+""));
            order.setOrderPrice(new BigDecimal("1"));
            orderMapper.insert(order);
        }
    }
```

**7、** 如果不出现意外的话，已经向数据库中插入了100条数据，并且分散到了2个库的4个表中；

通过这个例子，看下配置了那些东西

### 数据源配置

节点spring.shardingsphere.datasource

这个节点下可配置多个不同名称的数据源，在初始化的时候会由解析到shardingsphere数据源中；

详情可查看 ShardingSphereAutoConfiguration 类;

```java
注意:datasource.name 需要列出所有的数据源
```

### 规则配置

节点spring.shardingsphere.rules

这里需要定义一个逻辑表 的分表策略，分库策略，分片键，分片算法。通过这些信息才能知道你需要以一种什么样的规则来分表或分库

```java
actual-data-nodes：此配置需要表达出所有的节点的信息。这里使用Groovy  表达式来定义能够出现的所有的数据节点。比如 dbsource-$->{0..1}.t_order_$->{0..1} 可以通过排列组合得到4种结果dbsource-0.t_order_0 
dbsource-0.t_order_1
dbsource-1.t_order_0
dbsource-1.t_order_1
详细说明链接: 行表达式 :: ShardingSphere
```

```java
database-strategy  分库的策略
table-strategy     分表的策略
```

分表算法需要在下面进行指定

### 其他个性化配置

```java
props 一些其他的配置属性
```

```java
sql-show: 展示sql
```

名称
数据类型
说明
默认值

sql-show (?)
boolean
是否在日志中打印 SQL。
 打印 SQL 可以帮助开发者快速定位系统问题。日志内容包含：逻辑 SQL，真实 SQL 和 SQL 解析结果。
 如果开启配置，日志将使用 Topic ShardingSphere-SQL，日志级别是 INFO。
false

sql-simple (?)
boolean
是否在日志中打印简单风格的 SQL。
false

kernel-executor-size (?)
int
用于设置任务处理线程池的大小。每个 ShardingSphereDataSource 使用一个独立的线程池，同一个 JVM 的不同数据源不共享线程池。
infinite

max-connections-size-per-query (?)
int
一次查询请求在每个数据库实例中所能使用的最大连接数。
1

check-table-metadata-enabled (?)
boolean
在程序启动和更新时，是否检查分片元数据的结构一致性。
false

check-duplicate-table-enabled (?)
boolean
在程序启动和更新时，是否检查重复表。
false

sql-comment-parse-enabled (?)
boolean
是否解析 SQL 注释。
false

sql-federation-enabled (?)
boolean
是否开启 federation 查询。
false

数据来源:[属性配置 :: ShardingSpherehttps://shardingsphere.apache.org/document/5.0.0/cn/user-manual/shardingsphere-jdbc/configuration/props/][_ ShardingSphere_nbsp_nbsp 4_https_shardingsphere.apache.org_document_5.0.0_cn_user-manual_shardingsphere-jdbc_configuration_props]

官网配置链接:[YAML 配置 :: ShardingSphere](https://shardingsphere.apache.org/document/5.0.0/cn/user-manual/shardingsphere-jdbc/configuration/yaml/)
