# 08、Sharding-Sphere 实战：分库分表的多种分片策略
- 来源：https://ddkk.com/zhuanlan/sharding/shardingsphere/1/8.html
- 分类：分库分表
- 分组：教程目录
在之前文章《[02、Sharding-Sphere 实战：水平分表，实现分表写入读取](/zhuanlan/sharding/shardingsphere/1/2.html)》中，我们介绍了数据库的水平分表配置，在文章中只介绍了最简单的行表达式分表配置方式，但往往在实际中我们的业务场景单一的行表达式不能满足。Sharding jdbc为我们实际提供了5种的分库分表策略实现方式。如下：

- 标准分片策略 （PreciseShardingAlgorithm、RangeShardingAlgorithm）
- 复合分片策略 （ComplexKeysShardingAlgorithm）
- Hint分片策略 （HintShardingAlgorithm）
- 行表达式分片策略
- 不分片策略

**数据库的分库与分表策略使用方式一致，其中doSharding 方法第一个参数表示可用的表或库，第二个参数为传入的字段参数信息对象，如下文章只对分表进行演示说明。**

**一、标准分片策略**

标准分片策略用于处理单一建（分表字段）作为分表建的场景，包含两种分片算法：

**1、** 精确分片算法，对应实现接口PreciseShardingAlgorithmsql在分表键上执行**=与IN**时触发分表算逻辑，否则不走分表，全表执行；

2、** 范围分片算法，对应实现接口RangeShardingAlgorithmsql在分表键上执行BETWEENAND、>、=、, =, {u_id % 8} 表示t_user表根据u_id模8，而分成8张表，表名称为t_user_0到t_user_7。无需java类实现分片逻辑。

**五、不分片策略**

对应NoneShardingStrategy，将会对所有表进行操作（新增更新查询等）。配置方式如下：

```java
#不分片策略 none后面.任意字符
spring.shardingsphere.sharding.tables.course.table-strategy.none.anystr=
```
