# 10、Sharding-JDBC 实战 - Sharding-JDBC 核心之归并引擎
- 来源：https://ddkk.com/zhuanlan/sharding/shardingjdbc/1/10.html
- 分类：分库分表
- 分组：教程目录
将从各个数据节点获取的多数据结果集，组合成为一个结果集并正确的返回至请求客户端，称为结果归并。也是Sharding 执行过程 SQL解析 => 执行器优化 => SQL路由 => SQL改写 => SQL执行 => 结果归并 的最后一步。

ShardingSphere支持的结果归并从功能上分为遍历、排序、分组、分页和聚合5种类型，它们是组合而非互斥的关系。 从结构划分，可分为流式归并、内存归并和装饰者归并。流式归并和内存归并是互斥的，装饰者归并可以在流式归并和内存归并之上做进一步的处理。

- 流式归并是指每一次从结果集中获取到的数据，都能够通过逐条获取的方式返回正确的单条数据，它与数据库原生的返回结果集的方式最为契合。遍历、排序以及流式分组都属于流式归并的一种。
- 内存归并则是需要将结果集的所有数据都遍历并存储在内存中，再通过统一的分组、排序以及聚合等计算之后，再将其封装成为逐条访问的数据结果集返回。
- 装饰者归并是对所有的结果集归并进行统一的功能增强，目前装饰者归并有分页归并和聚合归并这2种类型。

**归并引擎主要源码如下**

**MergeEngineFactory-归并引擎工厂类：**

```java
//创建归并引擎的实例 ，根据SQL语句的类型不同，创建DQLMergeEngine或者DALMergeEngine
 public static MergeEngine newInstance(final DatabaseType databaseType, final ShardingRule shardingRule, 
                                          final SQLStatement sqlStatement, final ShardingTableMetaData shardingTableMetaData, final List<QueryResult> queryResults) throws SQLException {
        if (sqlStatement instanceof SelectStatement) {
        //	创建DQLMergeEngine实例
            return new DQLMergeEngine(databaseType, (SelectStatement) sqlStatement, queryResults);
        } 
        if (sqlStatement instanceof DALStatement) {
            return new DALMergeEngine(shardingRule, queryResults, (DALStatement) sqlStatement, shardingTableMetaData);
        }
        throw new UnsupportedOperationException(String.format("Cannot support type '%s'", sqlStatement.getType()));
    }
```

**DQLMergeEngine引擎：**

```java
public MergedResult merge() throws SQLException {
    if (1 == this.queryResults.size()) {
        // 如果只有一个归并的结果集，使用遍历归并（方法内部也只是调用了List.iterator()方法和将返回的结果集赋值给变量）
        return new IteratorStreamMergedResult(this.queryResults);
    } else {
        this.selectStatement.setIndexForItems(this.columnLabelIndexMap);
        return this.decorate(this.build());
    }
}
private MergedResult build() throws SQLException {
    // 判断原生sql 中是否 包含分组语句 + 聚合函数
    if (this.selectStatement.getGroupByItems().isEmpty() && this.selectStatement.getAggregationSelectItems().isEmpty()) {
        //原生sql 含有排序语句，则使用排序归并，否则使用遍历归并，因为最终返回客户端的结构不需要排序，所以只需多个结果集组合起来
        return (MergedResult)(!this.selectStatement.getOrderByItems().isEmpty() ? new OrderByStreamMergedResult(this.queryResults, this.selectStatement.getOrderByItems()) : new IteratorStreamMergedResult(this.queryResults));
    } else {
        // 分组排序又分为流式分组排序 和 内存分组排序 2种
        return this.getGroupByMergedResult();
    }
}
private MergedResult getGroupByMergedResult() throws SQLException {
    // isSameGroupByAndOrderByItems()方法： retrun !this.getGroupByItems().isEmpty() && this.getGroupByItems().equals(this.getOrderByItems());
    return (MergedResult)(this.selectStatement.isSameGroupByAndOrderByItems() ? new GroupByStreamMergedResult(this.columnLabelIndexMap, this.queryResults, this.selectStatement) : new GroupByMemoryMergedResult(this.columnLabelIndexMap, this.queryResults, this.selectStatement));
}
//使用装饰器模式对结果集进行分页归并
private MergedResult decorate(MergedResult mergedResult) throws SQLException {
    Limit limit = this.selectStatement.getLimit();
    if (null != limit && 1 != this.queryResults.size()) {
        //根据数据库类型的不同执行相应的分页结果集归并
        if (DatabaseType.MySQL != this.databaseType && DatabaseType.PostgreSQL != this.databaseType && DatabaseType.H2 != this.databaseType) {
            if (DatabaseType.Oracle == this.databaseType) {
                return new RowNumberDecoratorMergedResult(mergedResult, this.selectStatement.getLimit());
            } else {
                return (MergedResult)(DatabaseType.SQLServer == this.databaseType ? new TopAndRowNumberDecoratorMergedResult(mergedResult, this.selectStatement.getLimit()) : mergedResult);
            }
        } else {
            return new LimitDecoratorMergedResult(mergedResult, this.selectStatement.getLimit());
        }
    } else {
        return mergedResult;
    }
}
```

## 一、遍历归并

它是最为简单的归并方式。在返回的结果集只有一个或者没有使用到排序条件的场景中使用，因为不涉及到排序， 只需将多个数据结果集合并为一个单向链表即可。在遍历完成链表中当前数据结果集之后，将链表元素后移一位，继续遍历下一个数据结果集即可。

## 二、排序归并

在查询SQL中，使用order by 但是没有group by + 聚合函数 的情况下使用，由于在SQL中存在ORDER BY语句，因此每个数据结果集自身是有序的，但各个数据结果集之间是无序的。因此只需要将数据结果集当前游标指向的数据值进行排序即可。 这相当于对多个有序的数组进行排序，归并排序是最适合此场景的排序算法。

ShardingSphere在对排序的查询进行归并时，将每个结果集的当前数据值进行比较（通过实现Java的Comparable接口完成），并将其放入优先级队列。 每次获取下一条数据时，只需将队列顶端结果集的游标下移，并根据新游标重新进入优先级排序队列找到自己的位置即可。

**例如当前有三个数据结果集，如下所示：**

- 将各个数据结果集的当前游标指向的数据值进行排序，并放入优先级队列。t_score_0的第一个数据值最大，t_score_2的第一个数据值次之，t_score_1的第一个数据值最小，因此优先级队列根据t_score_0，t_score_2和t_score_1的方式排序队列。结果如下所示：

- 调用next()方法，排在优先级队列首位的t_score_0将会被弹出队列，并且将当前游标指向的数据值返回至查询客户端，并且将游标下移一位之后重新放入优先级队列从新进行优先级队列排序

可以看到，对于每个数据结果集中的数据有序，而多数据结果集整体无序的情况下，ShardingSphere无需将所有的数据都加载至内存即可排序。 它使用的是流式归并的方式，每次next仅获取唯一正确的一条数据，极大的节省了内存的消耗。

从另一个角度来说，ShardingSphere的排序归并，是在维护数据结果集的纵轴和横轴这两个维度的有序性。 纵轴是指每个数据结果集本身，它是天然有序的，它通过包含ORDER BY的SQL所获取。 横轴是指每个数据结果集当前游标所指向的值，它需要通过优先级队列来维护其正确顺序。 每一次数据结果集当前游标的下移，都需要将该数据结果集重新放入优先级队列排序，而只有排列在队列首位的数据结果集才可能发生游标下移的操作。

## 三、分组归并

分组归并的情况最为复杂，它分为流式分组归并和内存分组归并。 流式分组归并要求SQL的排序项与分组项的字段以及排序类型（ASC或DESC）必须保持一致，否则只能通过内存归并才能保证其数据的正确性。

```java
    private MergedResult getGroupByMergedResult() throws SQLException {
        return (MergedResult)(this.selectStatement.isSameGroupByAndOrderByItems() ? new GroupByStreamMergedResult(this.columnLabelIndexMap, this.queryResults, this.selectStatement) : new GroupByMemoryMergedResult(this.columnLabelIndexMap, this.queryResults, this.selectStatement));
    }
    public boolean isSameGroupByAndOrderByItems() {
        return !this.getGroupByItems().isEmpty() && this.getGroupByItems().equals(this.getOrderByItems());
    }
```

### 3.1 流式分组归并

在分组项与排序项完全一致的情况下，取得的数据是连续的，分组所需的数据全数存在于各个数据结果集的当前游标所指向的数据值，因此可以采用流式归并。

举例说明，假设根据科目分片，表结构中包含考生的姓名（为了简单起见，不考虑重名的情况）和分数。通过SQL获取每位考生的总分，可通过如下SQL：

```java
	SELECT name, SUM(score) FROM t_score GROUP BY name ORDER BY name;
```

进行归并时，逻辑与排序归并类似，下图展现了进行next调用的时候，流式分组归并是如何进行的。

通过图中我们可以看到，当进行第一次next调用时，排在队列首位的t_score_java将会被弹出队列，并且将分组值同为“Jetty”的其他结果集中的数据一同弹出队列。 在获取了所有的姓名为“Jetty”的同学的分数之后，进行累加操作，那么，在第一次next调用结束后，取出的结果集是“Jetty”的分数总和。 与此同时，所有的数据结果集中的游标都将下移至数据值“Jetty”的下一个不同的数据值，并且根据数据结果集当前游标指向的值进行重排序。 因此，包含名字顺着第二位的“John”的相关数据结果集则排在的队列的前列。

**流式分组归并与排序归并的区别仅仅在于两点：**

- 它会一次性的将多个数据结果集中的分组项相同的数据全数取出。
- 它需要根据聚合函数的类型进行聚合计算。

### 3.2 内存分组归并

对于分组项与排序项不一致的情况，由于需要获取分组的相关的数据值并非连续的，因此无法使用流式归并，需要将所有的结果集数据加载至内存中进行分组和聚合。 例如，若通过以下SQL获取每位考生的总分并按照分数从高至低排序，是无法进行流式归并的，只能将结果集的所有数据都遍历并存储在内存中，再通过统一的分组、排序以及聚合等计算之后，再将其封装成为逐条访问的数据结果集返回：

```java
	SELECT name, SUM(score) FROM t_score GROUP BY name ORDER BY score DESC;
```

注意：当SQL中只包含分组语句时，根据不同数据库的实现，其排序的顺序不一定与分组顺序一致。 但由于排序语句的缺失，则表示此SQL并不在意排序顺序。 因此，ShardingSphere通过SQL优化的改写，自动增加与分组项一致的排序项，使其能够从消耗内存的内存分组归并方式转化为流式分组归并方案。

## 四、聚合归并

聚合归并是在之前介绍的归并类的之上追加的归并能力，即装饰者模式的一种

无论是流式分组归并还是内存分组归并，对聚合函数的处理都是一致的。 除了分组的SQL之外，不进行分组的SQL也可以使用聚合函数。聚合函数可以归类为比较、累加和求平均值这3种类型

**1、** 比较类型的聚合函数是指MAX和MIN它们需要对每一个同组的结果集数据进行比较，并且直接返回其最大或最小值即可；

**2、** 累加类型的聚合函数是指SUM和COUNT它们需要将每一个同组的结果集数据进行累加；

**3、** 求平均值的聚合函数只有AVG；

## 五、分页归并

上文所述的所有归并类型都可能进行分页。如源码部分所示，merge()归并方法中会调用decorate（）进行分页处理。 分页也是追加在其他归并类型之上的装饰器，ShardingSphere通过装饰者模式来增加对数据结果集进行分页的能力。 分页归并负责将无需获取的数据过滤掉。

ShardingSphere 执行分页的处理是通过对SQL的改写来实现的。例如：

```java
	SELECT id FROM t_user WHERE  age > 18 LIMIT 10000,10
```

为了保证返回数据的准确性，在SQL改写阶段修改为：SELECT id FROM t_user WHERE age > 18 LIMIT 0,10000

**归并引擎的整体结构划分如下图。**
