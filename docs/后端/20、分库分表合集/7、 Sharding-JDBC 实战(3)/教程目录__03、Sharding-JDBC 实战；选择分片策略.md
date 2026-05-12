# 03、Sharding-JDBC 实战；选择分片策略
- 来源：https://ddkk.com/zhuanlan/sharding/shardingjdbc/3/3.html
- 分类：分库分表
- 分组：教程目录
shardingjdbc 通过分片策略 + 分片算法完成数据分片;

shardingjdbc 为我们提供了4种分片策略，我们可以根据自己的需求选择合适的策略配置，当然如果提供的都不能满足需求，也可以自定义策略，自定义策略会在后面的章节介绍。

分片策略的接口是

```java
org.apache.shardingsphere.sharding.route.strategy.ShardingStrategy
```

### 内置分片策略

分片策略
配置key
对应的实现类
适用场景
说明

不分片
none
不分片
不需要分片的时候配置此策略

标准分片
standard
单个分片键
只有一个分片键的时候使用此策略

组合分片
complex
多个分片键
表有多个分片键的时候使用此策略

命中分片
hint
非固定分片键
比较灵活的分片场景

所以在选择分表或分库的策略的时候，主要是针对分片键来决定的。根据分片键的一个或多个或不固定就可以选择配置对应的策略
