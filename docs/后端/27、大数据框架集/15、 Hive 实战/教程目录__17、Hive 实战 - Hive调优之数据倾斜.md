# 17、Hive 实战 - Hive调优之数据倾斜
- 来源：https://ddkk.com/zhuanlan/bigdata/hive/1/17.html
- 分类：大数据框架
- 分组：教程目录
## 1. 什么是数据倾斜

绝大部分任务都很快完成，只有一个或者少数几个任务执行的很慢甚至最终执行失败，这样的现象为数据倾斜现象。

一定要和数据过量导致的现象区分开，数据过量的表现为所有任务都执行的很慢，这个时候只有提高执行资源才可以优化HQL的执行效率。

综合来看，导致数据倾斜的原因在于按照Key分组以后，少量的任务负责绝大部分数据的计算，也就是说产生数据倾斜的HQL中一定存在分组操作，那么从HQL的角度，我们可以将数据倾斜分为单表携带了GroupBy字段的查询和两表（或者多表）Join的查询。

## 2. 单表数据倾斜优化

### 2.1. 使用参数

当任务中存在GroupBy操作同时聚合函数为count或者sum可以设置参数来处理数据倾斜问题。

```java
-- 是否在Map端进行聚合，默认为True
set hive.map.aggr = true;
-- 在Map端进行聚合操作的条目数目
set hive.groupby.mapaggr.checkinterval = 100000;
```

有数据倾斜的时候进行负载均衡（默认是false），当选项设定为 true，生成的查询计划会有两个MR Job

```java
set hive.groupby.skewindata = true;
```

### 2.2. 增加Reduce数量（多个Key同时导致数据倾斜）

1）调整reduce个数方法一

> 每个Reduce处理的数据量默认是256MB

```java
set hive.exec.reducers.bytes.per.reducer = 256000000
```

> 每个任务最大的reduce数，默认为1009

```java
set hive.exec.reducers.max = 1009
```

> 计算reducer数的公式

```java
N=min(参数2，总输入数据量/参数1)(参数2 指的是上面的1009，参数1值得是256M)
```

2）调整reduce个数方法二

> 在hadoop的mapred-default.xml文件中修改
>
> 设置每个job的Reduce个数

```java
set mapreduce.job.reduces = 15;
```

## 3. Join数据倾斜优化

### 3.1. 使用参数

在编写Join 查询语句时，如果确定是由于 join 出现的数据倾斜，那么请做如下设置：

```java
-- join的键对应的记录条数超过这个值则会进行分拆，值根据具体数据量设置
set hive.skewjoin.key=100000;
-- 如果是join过程出现倾斜应该设置为true
set hive.optimize.skewjoin=false;
```

如果开启了，在Join过程中Hive会将计数超过阈值hive.skewjoin.key（默认100000）的倾斜key对应的行临时写进文件中，然后再启动另一个job做map join生成结果。通过hive.skewjoin.mapjoin.map.tasks参数还可以控制第二个job的mapper数量，默认10000。

```java
set hive.skewjoin.mapjoin.map.tasks=10000;
```

### 3.2. MapJoin

博主另一篇博文 [Hive（16）：Hive调优之HQL语法优化](https://blog.csdn.net/yang_shibiao/article/details/126568658) 中第9节有介绍。
