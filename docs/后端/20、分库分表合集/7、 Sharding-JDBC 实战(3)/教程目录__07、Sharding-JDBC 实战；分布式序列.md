# 07、Sharding-JDBC 实战；分布式序列
- 来源：https://ddkk.com/zhuanlan/sharding/shardingjdbc/3/7.html
- 分类：分库分表
- 分组：教程目录
### 分片带来的主键唯一问题

当一个表的数据被切分到多个表的时候，那么单表的唯一主键就无法通过数据库来控制了，因为需要保证同一个表在多个真实表的主键id的唯一性。

> 注意：5.x 版本和4.x版本在配置上有略微的差别

### 内置解决方案

shardingjdbc内置了2种主键算法来供选择;

#### uuid

uuid 就是利用了jdk生成的uuid 字符串，来保证主键id 的不重复的特点

内置算法类是 UUIDKeyGenerateAlgorithm

使用方式也很简单

```java
keyGenerateStrategy:
  column: order_id
  keyGeneratorName: uuid
```

```java
keyGenerators:
  uuid:
    type: UUID
```

缺点：1.主键必须是 字符串类型;

**2、** 主键非连续的，对于b-tree索引插入数据时，建立索引的性能比连续数据的性能比较差;；

优点:比较简单

不是很推荐的一种方式;

#### 雪花算法

雪花算法是Twitter 开源的一种分布式序列算法。生成的是一个64bit的整数。并且生成的是根据时间连续的;

整体结构 是 时间戳 + workid 机器id + 毫秒的序列化

具体的详细介绍这里不在赘述，请自行百度或google

**使用方式:**

配置主键id 列，配置类型，配置属性可以配置一个work-id 也就是中间的机器id能够有效的避免重复;

```java
keyGenerateStrategy:
  column: order_id
  keyGeneratorName: snowflak
```

在最后面定义snowflow

```java

```

优点:生成的序列 是根据时间有序的;

缺点:依赖时钟，如果时钟回拨可能会导致重复;

> 注意生成的id 是64位的整数，在返给前端的时候记得做一些处理方案。 比如处理json序列化将long 按照string来序列化

#### 自定义算法

当然如果内置的2种算法无法满足需求，shardingjdbc支持spi拓展分布式序列算法;

**1、** 首先定义一个序列算法类,这里仅仅使用AtomicLong做一个全局自增的操作，当然实际业务中可自定扩展;；

**实现getType 方法，返回此算法的类型名称**

```java
package com.example.shardingjdbcdemo.spi;
import org.apache.shardingsphere.sharding.spi.KeyGenerateAlgorithm;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;
import java.util.Properties;
import java.util.concurrent.atomic.AtomicLong;
@Component
public final class IncrementKeyGenerate implements KeyGenerateAlgorithm {
    private AtomicLong atomicLong;
    @Override
    public Properties getProps() {
        return KeyGenerateAlgorithm.super.getProps();
    }
    @Override
    public void setProps(Properties props) {
        KeyGenerateAlgorithm.super.setProps(props);
    }
    @Override
    public String getType() {
        return "INCREMENT";
    }
    @Override
    public Comparable<?> generateKey() {
        return atomicLong.getAndIncrement();
    }
    @Override
    public void init() {
        atomicLong = new AtomicLong(1);
    }
    @Override
    public boolean isDefault() {
        return true;
    }
}
```

**2、** 定义spi使自定义的类能被扫描到;；

resoruce 下创建 META-INF 文件夹，下面再创建services 文件夹，严格安装java spi 标准来定义。

文件名称为来实现的接口名称 org.apache.shardingsphere.sharding.spi.KeyGenerateAlgorithm

内部写入具体实现类

**3、** 接下来在定义主键算法的类型的时候就可以使用自己定义的类型了；

完整配置如下

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
            keyGenerateStrategy:
              column: order_id
              keyGeneratorName: order-incr
         user表的配置
          t_user:
            actual-data-nodes: dbsource-0.t_user_$->{0..1}
            table-strategy:
             标准策略
              standard:
                sharding-column: user_id
                sharding-algorithm-name: user-alg
            keyGenerateStrategy:
              column: user_id
              keyGeneratorName: user-incr
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
        binding-tables:
          - t_order,t_user
        keyGenerators:
          user-incr:
            type: INCREMENT
          order-incr:
            type: INCREMENT
    props:
      sql-show: true
      sql-comment-parse-enabled: true
```

简单说明：在 keyGenerators 中定义算法名称 和算法类型和一些属性信息;

然后在具体的表的 keyGenerateStrategy 中使用 keyGeneratorName 来写入定义的名称，就完成了一个主键生成算法的关联定义;

插入数据后，就会安装顺序递增的方式对每个表写入id;

> 注意：这里在下面定义2个算法是为了不同的表使用不同的实例类，避免不同的表使用一个自增id

> 注意：如果使用mybatis-plus 的时候要指定id 的type = IdType.AUTO 才能生效;

```java
@TableId(type = IdType.AUTO)
```

#### 一些其他的分布式序列方案

- redis全局自增，使用redis 的incr命令维护全局自增顺序
- mysql维护自增，使用一个单独的数据表记录每个业务表的自增位置等信息;
- leaf 算法,美团的自增算法
