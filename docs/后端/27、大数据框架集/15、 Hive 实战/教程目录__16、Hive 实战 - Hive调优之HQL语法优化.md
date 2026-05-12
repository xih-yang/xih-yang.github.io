# 16、Hive 实战 - Hive调优之HQL语法优化
- 来源：https://ddkk.com/zhuanlan/bigdata/hive/1/16.html
- 分类：大数据框架
- 分组：教程目录
## 1. 列裁剪与分区裁剪

列裁剪就是在查询时只读取需要的列，分区裁剪就是只读取需要的分区。当列很多或者数据量很大时，如果 select * 或者不指定分区，全列扫描和全表扫描效率都很低。

Hive 在读数据的时候，可以只读取查询中所需要用到的列，而忽略其他的列。这样做可以节省读取开销：中间表存储开销和数据整合开销。

## 2. Group By

默认情况下，Map阶段同一Key数据分发给一个Reduce，当一个key数据过大时就倾斜了。

并不是所有的聚合操作都需要在Reduce端完成，很多聚合操作都可以先在Map端进行部分聚合，最后在Reduce端得出最终结果。

☆开启Map端聚合参数设置如下所示

> （1）是否在Map端进行聚合，默认为True

```java
set hive.map.aggr = true;
```

> （2）在Map端进行聚合操作的条目数目

```java
set hive.groupby.mapaggr.checkinterval = 100000;
```

> （3）有数据倾斜的时候进行负载均衡（默认是false）

```java
set hive.groupby.skewindata = true;
```

> 当上述数据倾斜负载均衡选项设定为 true，生成的查询计划会有两个MR Job：
>
> 第一个MR Job中，Map的输出结果会随机分布到Reduce中，每个Reduce做部分聚合操作，并输出结果，这样处理的结果是相同的Group By Key有可能被分发到不同的Reduce中，从而达到负载均衡的目的；
> 第二个MR Job再根据预处理的数据结果按照Group By Key分布到后续的Reduce中
>
> 优化以后代码如下：

```java
hive (default)> set hive.groupby.skewindata = true;
hive (default)> select deptno from emp group by deptno;
Stage-Stage-1: Map: 1  Reduce: 5   Cumulative CPU: 28.53 sec   HDFS Read: 18209 HDFS Write: 534 SUCCESS
Stage-Stage-2: Map: 1  Reduce: 5   Cumulative CPU: 38.32 sec   HDFS Read: 15014 HDFS Write: 9 SUCCESS
Total MapReduce CPU Time Spent: 1 minutes 6 seconds 850 msec
OK
deptno
10
20
```

## 3. Vectorization

vectorization : 矢量计算的技术，在计算类似scan, filter, aggregation的时候， vectorization技术以设置批处理的增量大小为 1024 行单次来达到比单条记录单次获得更高的效率。

```java
set hive.vectorized.execution.enabled = true;
set hive.vectorized.execution.reduce.enabled = true;
```

## 4. 多重模式

如果你碰到一堆SQL，并且这一堆SQL的模式还一样。都是从同一个表进行扫描，做不同的逻辑。有可优化的地方：如果有n条SQL，每个SQL执行都会扫描一次这张表。

```java
insert .... select id,name,sex, age from student where age > 17;
insert .... select id,name,sex, age from student where age > 18;
insert .... select id,name,sex, age from student where age > 19;
```

隐藏了一个问题：这种类型的SQL有多少个，那么最终。这张表就被全表扫描了多少次

```java
insert into t_ptn partition(city=A). select id,name,sex, age from student where city= A;
insert into t_ptn partition(city=B). select id,name,sex, age from student where city= B;
insert into t_ptn partition(city=c). select id,name,sex, age from student where city= c;
-- 重点：修改为如下代码
from student
insert into t_ptn partition(city=A) select id,name,sex, age where city= A
insert into t_ptn partition(city=B) select id,name,sex, age where city= B
```

如果一个 HQL 底层要执行 10 个 Job，那么能优化成 8 个一般来说，肯定能有所提高，多重插入就是一个非常实用的技能。一次读取，多次插入，有些场景是从一张表读取数据后，要多次利用。

## 5. in/exists语句

在Hive的早期版本中，in/exists语法是不被支持的，但是从 hive-0.8x 以后就开始支持这个语法。但是不推荐使用这个语法。虽然经过测验，Hive-2.3.6 也支持 in/exists 操作，但还是推荐使用 Hive 的一个高效替代方案：left semi join

比如说：-- in / exists 实现

```java
select a.id, a.name from a where a.id in (select b.id from b);
select a.id, a.name from a where exists (select id from b where a.id = b.id);
```

可以使用join来改写：

```java
select a.id, a.name from a join b on a.id = b.id;
```

应该转换成： -- left semi join 实现

```java
select a.id, a.name from a left semi join b on a.id = b.id;
```

## 6. CBO优化

join的时候表的顺序的关系：前面的表都会被加载到内存中。后面的表进行磁盘扫描

```java
select a.*, b.*, c.* from a join b on a.id = b.id join c on a.id = c.id;
```

Hive 自 0.14.0 开始，加入了一项 "Cost based Optimizer" 来对 HQL 执行计划进行优化，这个功能通过 "hive.cbo.enable" 来开启。在 Hive 1.1.0 之后，这个 feature 是默认开启的，它可以 自动优化 HQL中多个 Join 的顺序，并选择合适的 Join 算法。

CBO，成本优化器，代价最小的执行计划就是最好的执行计划。传统的数据库，成本优化器做出最优化的执行计划是依据统计信息来计算的。

Hive 的成本优化器也一样，Hive 在提供最终执行前，优化每个查询的执行逻辑和物理执行计划。这些优化工作是交给底层来完成的。根据查询成本执行进一步的优化，从而产生潜在的不同决策：如何排序连接，执行哪种类型的连接，并行度等等。

要使用基于成本的优化（也称为 CBO），请在查询开始设置以下参数：

```java
set hive.cbo.enable=true;
set hive.compute.query.using.stats=true;
set hive.stats.fetch.column.stats=true;
set hive.stats.fetch.partition.stats=true;
```

## 7. 谓词下推

将SQL 语句中的 where 谓词逻辑都尽可能提前执行，减少下游处理的数据量。对应逻辑优化器是 PredicatePushDown，配置项为hive.optimize.ppd，默认为true。

1）打开谓词下推优化属性

```java
hive (default)> set hive.optimize.ppd = true;谓词下推，默认是true
```

2）查看先关联两张表，再用where条件过滤的执行计划

```java
hive (default)> explain select o.id from bigtable b join bigtable o  on o.id = b.id where o.id <= 10;
```

3）查看子查询后，再关联表的执行计划

```java
hive (default)> explain select b.id from bigtable b join (select id from bigtable where id <= 10) o on b.id = o.id;
```

## 8. MapJoin

MapJoin 是将 Join 双方比较小的表直接分发到各个 Map 进程的内存中，在 Map 进程中进行 Join 操 作，这样就不用进行 Reduce 步骤，从而提高了速度。如果不指定MapJoin或者不符合MapJoin的条件，那么Hive解析器会将Join操作转换成Common Join，即：在Reduce阶段完成Join。容易发生数据倾斜。可以用MapJoin把小表全部加载到内存在Map端进行Join，避免Reducer处理。

1）开启MapJoin参数设置

> 设置自动选择MapJoin

```java
set hive.auto.convert.join=true;默认为true
```

> 大表小表的阈值设置（默认25M以下认为是小表）：

```java
set hive.mapjoin.smalltable.filesize=25000000;
```

2）MapJoin工作机制

> MapJoin 是将 Join 双方比较小的表直接分发到各个 Map 进程的内存中，在 Map 进程中进行 Join 操作，这样就不用进行 Reduce 步骤，从而提高了速度。

3）案例实操：

> 开启MapJoin功能

```java
set hive.auto.convert.join = true; 默认为true
```

> 执行小表JOIN大表语句

```java
-- 注意：此时小表(左连接)作为主表，所有数据都要写出去，因此此时会走reduce，mapjoin失效
Explain insert overwrite table jointable
select b.id, b.t, b.uid, b.keyword, b.url_rank, b.click_num, b.click_url
from smalltable s
left join bigtable  b
on s.id = b.id;
Time taken: 24.594 seconds
```

> 执行大表JOIN小表语句

```java
Explain insert overwrite table jointable
select b.id, b.t, b.uid, b.keyword, b.url_rank, b.click_num, b.click_url
from bigtable b
left  join smalltable s
on s.id = b.id;
Time taken: 24.315 seconds
```

## 9. 大表、大表SMB Join

SMBJoin ：Sort Merge Bucket Join

1）创建第二张大表

```java
create table bigtable2(
    id bigint,
    t bigint,
    uid string,
    keyword string,
    url_rank int,
    click_num int,
    click_url string)
row format delimited fields terminated by '\t';
load data local inpath '/opt/module/data/bigtable' into table bigtable2;
```

2）测试大表直接JOIN

```java
insert overwrite table jointable
select b.id, b.t, b.uid, b.keyword, b.url_rank, b.click_num, b.click_url
from bigtable a
join bigtable2 b
on a.id = b.id;
-- 测试结果：Time taken: 72.289 seconds
insert overwrite table jointable
select b.id, b.t, b.uid, b.keyword, b.url_rank, b.click_num, b.click_url
from bigtable a
join bigtable2 b
on a.id = b.id;
```

3）创建分通表1

```java
create table bigtable_buck1(
    id bigint,
    t bigint,
    uid string,
    keyword string,
    url_rank int,
    click_num int,
    click_url string)
clustered by(id)
sorted by(id)
into 6 buckets
row format delimited fields terminated by '\t';
load data local inpath '/opt/module/data/bigtable' into table bigtable_buck1;
```

4）创建分通表2，分桶数和第一张表的分桶数为倍数关系

```java
create table bigtable_buck2(
    id bigint,
    t bigint,
    uid string,
    keyword string,
    url_rank int,
    click_num int,
    click_url string)
clustered by(id)
sorted by(id)
into 6 buckets
row format delimited fields terminated by '\t';
load data local inpath '/opt/module/data/bigtable' into table bigtable_buck2;
```

5）设置参数

```java
set hive.optimize.bucketmapjoin = true;
set hive.optimize.bucketmapjoin.sortedmerge = true;
set hive.input.format=org.apache.hadoop.hive.ql.io.BucketizedHiveInputFormat;
```

6）测试 Time taken: 34.685 seconds

```java
insert overwrite table jointable
select b.id, b.t, b.uid, b.keyword, b.url_rank, b.click_num, b.click_url
from bigtable_buck1 s
join bigtable_buck2 b
on b.id = s.id;
```

## 10. 笛卡尔积

Join的时候不加on条件，或者无效的on条件，因为找不到 Join key，Hive 只能使用1个 Reducer 来完成笛卡尔积。当 Hive 设定为严格模式（hive.mapred.mode=strict，nonstrict）时，不允许在 HQL 语句中出现笛卡尔积。
