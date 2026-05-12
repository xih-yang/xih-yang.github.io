# 09、MySQL 调优 - MySQL控制查询优化器Hints
- 来源：https://ddkk.com/zhuanlan/db/mysql/3/9.html
- 分类：缓存数据库
- 分组：教程目录
备注:测试数据库版本为MySQL 8.0

## 一.控制查询计划评估

查询优化器的任务是找到执行SQL查询的最佳计划。因为“好”和“坏”计划之间的性能差异可能是数量级的(即秒、小时甚至是天)，大多数查询优化器，包括MySQL，在所有可能的查询评估计划中执行或多或少详尽的搜索，以寻找最优计划。对于连接查询，MySQL优化器调查的可能计划的数量会随着查询中引用的表的数量呈指数级增长。对于少量的表(通常少于7到10个)，这不是问题。然而，当提交较大的查询时，花费在查询优化上的时间很容易成为服务器性能的主要瓶颈。

一种更灵活的查询优化方法使用户能够控制优化器在搜索最优查询评估计划时的穷尽程度。一般的想法是，优化器调查的计划越少，它在编译查询上花费的时间就越少。另一方面，因为优化器跳过一些计划，它可能会错过找到一个最优计划。

优化器的行为与它评估的计划数量有关，可以使用两个系统变量来控制:

**1、** optimizer_prune_level变量告诉优化器根据对每个表访问的行数的估计跳过某些计划我们的经验表明，这种“有根据的猜测”很少会错过最佳计划，并且可以显著减少查询编译时间这就是为什么这个选项在默认情况下是开启的(optimizer_prune_level=1)但是，如果您认为优化器遗漏了一个更好的查询计划，那么可以关闭这个选项(optimizer_prune_level=0)，这样做的风险是，查询编译可能花费更长的时间请注意，即使使用了这种启发式方法，优化器仍然在探索大致呈指数级数量的计划；

**2、** optimizer_search_depth变量告诉优化器应该查看每个不完整计划的“未来”，以评估它是否应该进一步扩展较小的optimizer_search_depth值可能会导致较小的查询编译时间例如，如果optimizer_search_depth接近查询中表的数量，那么包含12、13或更多表的查询可能很容易需要数小时甚至数天的编译同时，如果在optimizer_search_depth等于3或4的情况下编译，那么对于同一个查询，优化器可能只需要不到一分钟的时间如果您不确定optimizer_search_depth的合理值是多少，可以将该变量设置为0，以告诉优化器自动确定该值；

## 二. 可切换的优化

optimizer_switch系统变量可以控制优化器行为。它的值是一组标志，每个标志都有一个on或off值，用于指示相应的优化器行为是启用还是禁用。此变量具有全局值和会话值，可以在运行时更改。全局默认值可以在服务器启动时设置。

要查看当前的优化器标志集，请选择变量值:

```java
mysql> SELECT @@optimizer_switch\G
*************************** 1. row ***************************
@@optimizer_switch: index_merge=on,index_merge_union=on,
                    index_merge_sort_union=on,index_merge_intersection=on,
                    engine_condition_pushdown=on,index_condition_pushdown=on,
                    mrr=on,mrr_cost_based=on,block_nested_loop=on,
                    batched_key_access=off,materialization=on,semijoin=on,
                    loosescan=on,firstmatch=on,duplicateweedout=on,
                    subquery_materialization_cost_based=on,
                    use_index_extensions=on,condition_fanout_filter=on,
                    derived_merge=on,use_invisible_indexes=off,skip_scan=on,
                    hash_join=on,subquery_to_derived=off,
                    prefer_ordering_index=on,hypergraph_optimizer=off,
                    derived_condition_pushdown=on
1 row in set (0.00 sec)
```

要修改optimizer_switch的值，指定一个由一个或多个命令组成的逗号分隔的值:

```java
SET [GLOBAL|SESSION] optimizer_switch='command[,command]...';
```

每个命令值应该具有下表所示的形式之一：

该值中命令的顺序并不重要，但如果存在，默认命令将首先执行。将opt_name标志设置为default将其设置为on或off中的任意一个为其默认值。不允许在值中多次指定任何给定的opt_name，这会导致错误。该值中的任何错误都会导致赋值失败，并导致optimizer_switch的值保持不变。

## 三. 优化器的Hints

控制优化器策略的一种方法是设置optimizer_switch系统变量。对该变量的更改将影响所有后续查询的执行;为了对不同的查询产生不同的影响，必须在每个查询之前更改optimizer_switch。

控制优化器的另一种方法是使用优化器提示，这些提示可以在单独的语句中指定。因为优化器提示是针对每条语句应用的，所以它们对语句执行计划提供了比使用optimizer_switch更精细的控制。例如，可以对语句中的一个表启用优化，而对另一个表禁用优化。语句中的提示优先于optimizer_switch标志。

例子:

```java
SELECT /*+ NO_RANGE_OPTIMIZATION(t3 PRIMARY, f2_idx) */ f1
  FROM t3 WHERE f1 > 30 AND f1 < 33;
SELECT /*+ BKA(t1) NO_BKA(t2) */ * FROM t1 INNER JOIN t2 WHERE ...;
SELECT /*+ NO_ICP(t1, t2) */ * FROM t1 INNER JOIN t2 WHERE ...;
SELECT /*+ SEMIJOIN(FIRSTMATCH, LOOSESCAN) */ * FROM t1 ...;
EXPLAIN SELECT /*+ NO_ICP(t1) */ * FROM t1 WHERE ...;
SELECT /*+ MERGE(dt) */ * FROM (SELECT * FROM t1) AS dt;
INSERT /*+ SET_VAR(foreign_key_checks=OFF) */ INTO t2 VALUES(2);
```

### 3.1 优化器Hints概述

优化提示适用于不同的范围级别:

**1、** Global:提示影响整个语句；

**2、** 查询块:提示影响语句中的特定查询块；

**3、** 表级:提示影响查询块中的特定表；

**4、** 索引级:提示影响表中的特定索引；

下表总结了可用的优化器提示、它们影响的优化器策略以及它们应用的范围。稍后将提供更多细节：

Hints名
描述
应用范围

BKA, NO_BKA
影响批密钥接入连接处理
Query block, table

BNL, NO_BNL
MySQL 8.0.20之前:影响块嵌套循环连接处理;MySQL 8.0.18及以后版本:也影响哈希连接优化;MySQL 8.0.20及以后版本:只影响哈希连接优化
Query block, table

DERIVED_CONDITION_PUSHDOWN, NO_DERIVED_CONDITION_PUSHDOWN
使用或忽略派生表的派生条件下推优化(MySQL 8.0.22新增)
Query block, table

GROUP_INDEX, NO_GROUP_INDEX
在GROUP BY操作中使用或忽略指定的索引或索引(MySQL 8.0.20中新增)
Index

HASH_JOIN, NO_HASH_JOIN
影响哈希连接优化(仅MySQL 8.0.18
Query block, table

INDEX, NO_INDEX
作为JOIN_INDEX、GROUP_INDEX和ORDER_INDEX的组合，或者作为NO_JOIN_INDEX、NO_GROUP_INDEX和NO_ORDER_INDEX的组合(在MySQL 8.0.20中添加)
Index

INDEX_MERGE, NO_INDEX_MERGE
影响索引合并优化
Table, index

JOIN_FIXED_ORDER
使用FROM子句中指定的表顺序作为连接顺序
Query block

JOIN_INDEX, NO_JOIN_INDEX
使用或忽略任何访问方法的指定索引或索引(在MySQL 8.0.20中添加)
Index

JOIN_ORDER
使用提示中指定的表顺序作为连接顺序
Query block

JOIN_PREFIX
对于连接顺序的第一个表使用提示中指定的表顺序
Query block

JOIN_SUFFIX
对于连接顺序的最后一个表使用提示中指定的表顺序
Query block

MAX_EXECUTION_TIME
限制语句执行时间
Global

MERGE, NO_MERGE
影响将派生表/视图合并到外部查询块
Table

MRR, NO_MRR
影响多段读优化
Table, index

NO_ICP
影响索引条件下推优化
Table, index

NO_RANGE_OPTIMIZATION
影响范围的优化
Table, index

ORDER_INDEX, NO_ORDER_INDEX
使用或忽略指定的索引或索引来排序行(在MySQL 8.0.20中添加)
Index

QB_NAME
将名称分配给查询块
Query block

RESOURCE_GROUP
语句执行时设置资源组
Global

SEMIJOIN, NO_SEMIJOIN
影响semijoin策略;从MySQL 8.0.17开始，这也适用于反连接
Query block

SKIP_SCAN, NO_SKIP_SCAN
影响跳过扫描优化
Table, index

SET_VAR
语句执行时设置变量
Global

SUBQUERY
影响物化、IN-to-EXISTS子查询策略
Query block

禁用优化将阻止优化器使用它。启用优化意味着如果该策略适用于语句执行，则优化器可以自由使用该策略，而不是优化器一定要使用它。

### 3.2 优化器Hints语法

优化器提示必须在/*+…* /注释。也就是说，优化器提示使用/*…*/ c风格的注释语法，在/*注释开始序列后面有一个+字符。例子:

```java
/*+ BKA(t1) */
/*+ BNL(t1, t2) */
/*+ NO_RANGE_OPTIMIZATION(t4 PRIMARY) */
/*+ QB_NAME(qb2) */
```

+字符后面允许有空格。

解析器识别SELECT、UPDATE、INSERT、REPLACE和DELETE语句的初始关键字之后的优化器提示注释。在以下情况下允许提示:

**1、** 在查询和数据更改语句的开头:；

```java
SELECT /*+ ... */ ...
INSERT /*+ ... */ ...
REPLACE /*+ ... */ ...
UPDATE /*+ ... */ ...
DELETE /*+ ... */ ...
```

**1、** 在查询块的开头:；

```java
(SELECT /*+ ... */ ... )
(SELECT ... ) UNION (SELECT /*+ ... */ ... )
(SELECT /*+ ... */ ... ) UNION (SELECT /*+ ... */ ... )
UPDATE ... WHERE x IN (SELECT /*+ ... */ ...)
INSERT ... SELECT /*+ ... */ ...
```

在以EXPLAIN开头的提示语句中。例如:

```java
EXPLAIN SELECT /*+ ... */ ...
EXPLAIN UPDATE ... WHERE x IN (SELECT /*+ ... */ ...)
```

这意味着您可以使用EXPLAIN来查看优化器提示如何影响执行计划。在EXPLAIN之后立即使用SHOW WARNINGS来查看提示是如何使用的。下面的SHOW WARNINGS显示的扩展的EXPLAIN输出表明使用了哪些提示。不显示被忽略的提示。

一个提示注释可以包含多个提示，但是一个查询块不能包含多个提示注释。这是有效的:

```java
SELECT /*+ BNL(t1) BKA(t2) */ ...
```

但这是无效的:

```java
SELECT /*+ BNL(t1) */ /* BKA(t2) */ ...
```

当一个提示注释包含多个提示时，可能存在重复和冲突。以下是适用的一般准则。对于特定的提示类型，可以应用其他规则，如提示描述中所示:

**1、** 重复提示:对于类似/*+MRR(idx1)MRR(idx1)*/这样的提示，MySQL使用第一个提示并发出关于重复提示的警告；

**2、** 冲突提示:对于像/*+MRR(idx1)NO_MRR(idx1)*/这样的提示，MySQL使用第一个提示，并对第二个冲突提示发出警告；

查询块名称是标识符，并且遵循关于哪些名称有效以及如何引用它们的常规规则。

提示名称、查询块名称和策略名称不区分大小写。对表和索引名的引用遵循通常的标识符区分大小写规则。

### 3.3 连接顺序优化器Hints

连接顺序提示会影响优化器连接表的顺序。

JOIN_FIXED_ORDER提示的语法:

```java
hint_name([@query_block_name])
```

其他连接顺序提示的语法:

```java
hint_name([@query_block_name] tbl_name [, tbl_name] ...)
hint_name(tbl_name[@query_block_name] [, tbl_name[@query_block_name]] ...)
```

语法指的是这些术语:

**1、** 这些提示名称是允许的:；

1)JOIN_FIXED_ORDER:强制优化器使用表在FROM子句中出现的顺序连接表。这与指定SELECT STRAIGHT_JOIN是一样的。

2)JOIN_ORDER:指示优化器使用指定的表顺序连接表。这个提示适用于已命名的表。优化器可以将没有按联接顺序命名的表放置在任何位置，包括指定的表之间。

3)JOIN_PREFIX:指示优化器使用连接执行计划的第一个表的指定表顺序连接表。这个提示适用于已命名的表。优化器将所有其他表放在已命名表之后。

4)JOIN_SUFFIX:指示优化器使用连接执行计划最后一个表的指定表顺序连接表。这个提示适用于已命名的表。优化器将所有其他表放在命名表之前。

**2、** tbl_name:语句中使用的表名命名表的提示适用于它命名的所有表JOIN_FIXED_ORDER提示不命名表，并应用于查询块的FROM子句中的所有表；

如果表有别名，则提示必须引用别名，而不是表名。

提示中的表名不能用模式名限定。

**3、** query_block_name:提示应用的查询块如果提示不包含前导@query_block_name，则提示适用于出现该提示的查询块对于tbl_name@query_block_name语法，提示应用于已命名查询块中的已命名表要给查询块分配一个名称；

例子:

```java
SELECT
/*+ JOIN_PREFIX(t2, t5@subq2, t4@subq1)
    JOIN_ORDER(t4@subq1, t3)
    JOIN_SUFFIX(t1) */
COUNT(*) FROM t1 JOIN t2 JOIN t3
           WHERE t1.f1 IN (SELECT /*+ QB_NAME(subq1) */ f1 FROM t4)
             AND t2.f1 IN (SELECT /*+ QB_NAME(subq2) */ f1 FROM t5);
```

提示控制合并到外部查询块的半连接表的行为。如果子查询subq1和subq2被转换为半连接，表t4@subq1和t5@subq2被合并到外部查询块。在这种情况下，外部查询块中指定的提示控制t4@subq1、t5@subq2表的行为。

优化器根据以下原则解析连接顺序提示:

**1、** 多个Hints实例；

每种类型只应用一个JOIN_PREFIX和JOIN_SUFFIX提示。后面任何相同类型的提示都将被忽略，并发出警告。JOIN_ORDER可以被指定多次。

例子:

```java
/*+ JOIN_PREFIX(t1) JOIN_PREFIX(t2) */
```

第二个JOIN_PREFIX提示会被一个警告忽略。

```java
/*+ JOIN_PREFIX(t1) JOIN_SUFFIX(t2) */
```

这两种提示都适用。没有警告。

```java
/*+ JOIN_ORDER(t1, t2) JOIN_ORDER(t2, t3) */
```

这两种提示都适用。没有警告。

**1、** 冲突的Hints；

在某些情况下，提示可能会发生冲突，例如当JOIN_ORDER和JOIN_PREFIX的表订单不可能同时应用时:

```java
SELECT /*+ JOIN_ORDER(t1, t2) JOIN_PREFIX(t2, t1) */ ... FROM t1, t2;
```

在这种情况下，第一个指定的提示将被应用，后续的冲突提示将被忽略，没有任何警告。不可能应用的有效提示会被无声地忽略，没有任何警告。

**1、** 忽略的Hints；

如果提示中指定的表具有循环依赖关系，则提示将被忽略。

```java
/*+ JOIN_ORDER(t1, t2) JOIN_PREFIX(t2, t1) */
```

JOIN_ORDER提示根据t1设置表t2。JOIN_PREFIX提示被忽略，因为表t1不能依赖于t2。被忽略的提示不会显示在扩展的EXPLAIN输出中。

**1、** 与const表的交互；

MySQL优化器将const表放在连接顺序的第一位，const表的位置不会受到提示的影响。在连接顺序提示中对const表的引用将被忽略，尽管该提示仍然适用。例如，它们是等价的:

```java
JOIN_ORDER(t1, const_tbl, t2)
JOIN_ORDER(t1, t2)
```

在扩展的EXPLAIN输出中显示的可接受的提示包括指定的const表。

**1、** 与连接操作类型的交互；

MySQL支持几种类型的连接:LEFT, RIGHT, INNER, CROSS, STRAIGHT_JOIN。与指定联接类型冲突的提示将被忽略，不会发出警告。

```java
SELECT /*+ JOIN_PREFIX(t1, t2) */FROM t2 LEFT JOIN t1;
```

这里提示中请求的连接顺序与LEFT join所需的顺序发生冲突。提示将被忽略，没有任何警告。

### 3.4 表级别的优化器Hints

表级提示影响:

**1、** 使用块嵌套环(BNL)和BatchedKeyAccess(BKA)联合处理算法；

**2、** 派生表、视图引用或公共表表达式应该合并到外部查询块中，还是使用内部临时表进行物化；

**3、** 使用派生表条件下推优化；

这些提示类型适用于特定的表，或查询块中的所有表。

表级提示的语法:

```java
hint_name([@query_block_name] [tbl_name [, tbl_name] ...])
hint_name([tbl_name@query_block_name [, tbl_name@query_block_name] ...])
```

语法指的是这些术语:

**1、** 这些提示名称是允许的:；

1)BKA, NO_BKA:启用或禁用指定表的bacthize键访问。

2)BNL、NO_BNL:启用或禁用指定表的块嵌套循环。在MySQL 8.0.18及以后版本中，这些提示也启用和禁用散列连接优化。

3)DERIVED_CONDITION_PUSHDOWN, NO_DERIVED_CONDITION_PUSHDOWN:对指定的表启用或禁用派生表条件下推(在MySQL 8.0.22中添加)。

4)HASH_JOIN, NO_HASH_JOIN:启用或禁用指定表的哈希连接(仅MySQL 8.0.18;在MySQL 8.0.19或更高版本中没有效果)。

5)MERGE, NO_MERGE:启用指定表、视图引用或通用表表达式的合并;或者禁用合并而使用物化。

**2、** tbl_name:语句中使用的表名这个提示适用于它命名的所有表如果提示没有命名表，它将应用于它出现的查询块的所有表；

如果表有别名，则提示必须引用别名，而不是表名。

提示中的表名不能用模式名限定。

**3、** query_block_name:提示应用的查询块如果提示不包含前导@query_block_name，则提示适用于出现该提示的查询块对于tbl_name@query_block_name语法，提示应用于已命名查询块中的已命名表要给查询块分配一个名称；

例子:

```java
SELECT /*+ NO_BKA(t1, t2) */ t1.* FROM t1 INNER JOIN t2 INNER JOIN t3;
SELECT /*+ NO_BNL() BKA(t1) */ t1.* FROM t1 INNER JOIN t2 INNER JOIN t3;
SELECT /*+ NO_MERGE(dt) */ * FROM (SELECT * FROM t1) AS dt;
```

表级提示适用于从以前的表接收记录的表，而不是发送者表。考虑一下这句话:

```java
SELECT /*+ BNL(t2) */ FROM t1, t2;
```

如果优化器选择先处理t1，那么它将对t2应用Block Nested-Loop连接，在开始从t2读取之前缓冲t1中的行。如果优化器选择先处理t2，则提示无效，因为t2是发送表。

对于MERGE和NO_MERGE提示，这些优先级规则适用:

**1、** 提示优先于不是技术约束的任何优化器启发式(如果将提示作为建议提供没有效果，那么优化器就有理由忽略它)；

**2、** 提示优先于optimizer_switch系统变量的derived_merge标志；

**3、** 对于视图引用，视图定义中的ALGORITHM={MERGE|TEMPTABLE}子句优先于引用视图的查询中指定的提示；

### 3.5 索引级别优化器Hints

索引级提示会影响优化器对特定表或索引使用的索引处理策略。这些提示类型会影响使用索引条件下推(ICP)、多范围读取(MRR)、索引合并和范围优化。

索引级提示的语法:

```java
hint_name([@query_block_name] tbl_name [index_name [, index_name] ...])
hint_name(tbl_name@query_block_name [index_name [, index_name] ...])
```

**1、** 这些提示名称是允许的:；

1)GROUP_INDEX、NO_GROUP_INDEX:启用或禁用groupby操作的索引扫描的指定索引或索引。相当于索引提示FORCE index FOR GROUP BY，忽略index FOR GROUP BY。在MySQL 8.0.20及更高版本中可用。

2)指数,NO_INDEX:充当JOIN_INDEX的结合,GROUP_INDEX, ORDER_INDEX,迫使服务器使用指定的索引或索引所有范围,或NO_JOIN_INDEX的结合,NO_GROUP_INDEX NO_ORDER_INDEX,导致服务器忽略任何和所有的指定索引或索引范围。等同于强制索引，忽略索引。从MySQL 8.0.20开始可用。

3)INDEX_MERGE、NO_INDEX_MERGE:启用或禁用指定表或索引的索引合并访问方法。

INDEX_MERGE提示强制优化器使用指定的索引集对指定的表使用Index Merge。如果没有指定索引，优化器将考虑所有可能的索引组合，并选择开销最小的索引。如果索引组合不适用于给定语句，则可能忽略该提示。

NO_INDEX_MERGE提示禁用包含任何指定索引的索引合并组合。如果提示没有指定索引，则该表不允许索引合并。

4)JOIN_INDEX, NO_JOIN_INDEX:强制MySQL为任何访问方法使用或忽略指定的索引，如ref、range、index_merge等。相当于FORCE INDEX FOR JOIN，忽略INDEX FOR JOIN。在MySQL 8.0.20及更高版本中可用。

5)MRR、NO_MRR:使能或禁用指定表或索引的MRR。MRR提示只适用于InnoDB和MyISAM表。

6)NO_ICP:对指定的表或索引禁用ICP。默认情况下，ICP是一种候选优化策略，因此没有启用它的提示。

7)NO_RANGE_OPTIMIZATION:禁用指定表或索引的索引范围访问。此提示还禁用了表或索引的索引合并和松散索引扫描。默认情况下，范围访问是一种候选优化策略，因此没有启用它的提示。

当范围的数量很高并且范围优化需要很多资源时，此提示可能很有用。

8)ORDER_INDEX, NO_ORDER_INDEX:导致MySQL使用或忽略指定的索引或索引来排序行。相当于FORCE INDEX FOR ORDER BY，忽略INDEX FOR ORDER BY。从MySQL 8.0.20开始可用。

9)SKIP_SCAN、NO_SKIP_SCAN:启用或禁用指定表或索引的Skip Scan访问方法。有关此访问方法的信息，请参见跳过扫描范围访问方法。这些提示从MySQL 8.0.13开始提供。

SKIP_SCAN提示强制优化器使用指定的索引集对指定的表使用Skip Scan。如果没有指定索引，优化器将考虑所有可能的索引并选择开销最小的索引。如果索引不适用于给定语句，则提示可能被忽略。

NO_SKIP_SCAN提示禁用指定索引的跳过扫描。如果提示没有指定索引，则该表不允许跳过扫描。

**2、** tbl_name:提示应用的表；

**3、** index_name:命名表中索引的名称该提示适用于它命名的所有索引如果提示没有命名索引，它将应用于表中的所有索引；

要引用主键，请使用名称primary。要查看表的索引名称，请使用SHOW index。

**4、** query_block_name:提示应用的查询块如果提示不包含前导@query_block_name，则提示适用于出现该提示的查询块对于tbl_name@query_block_name语法，提示应用于已命名查询块中的已命名表要给查询块分配一个名称；

例子:

```java
SELECT /*+ INDEX_MERGE(t1 f3, PRIMARY) */ f2 FROM t1
  WHERE f1 = 'o' AND f2 = f3 AND f3 <= 4;
SELECT /*+ MRR(t1) */ * FROM t1 WHERE f2 <= 3 AND 3 <= f3;
SELECT /*+ NO_RANGE_OPTIMIZATION(t3 PRIMARY, f2_idx) */ f1
  FROM t3 WHERE f1 > 30 AND f1 < 33;
INSERT INTO t3(f1, f2, f3)
  (SELECT /*+ NO_ICP(t2) */ t2.f1, t2.f2, t2.f3 FROM t1,t2
   WHERE t1.f1=t2.f1 AND t2.f2 BETWEEN t1.f1
   AND t1.f2 AND t2.f2 + 1 >= t1.f1 + 1);
SELECT /*+ SKIP_SCAN(t1 PRIMARY) */ f1, f2
  FROM t1 WHERE f2 > 40;
```

下面的示例使用了Index Merge提示，但是其他索引级别的提示遵循相同的原则，即忽略提示和优化器提示相对于optimizer_switch系统变量或索引提示的优先级。

假设表t1有列a、b、c和d;并且在a、b和c上分别存在名为i_a、i_b和i_c的索引:

```java
SELECT /*+ INDEX_MERGE(t1 i_a, i_b, i_c)*/ * FROM t1
  WHERE a = 1 AND b = 2 AND c = 3 AND d = 4;
```

在本例中，索引合并用于(i_a, i_b, i_c).

```java
SELECT /*+ INDEX_MERGE(t1 i_a, i_b, i_c)*/ * FROM t1
  WHERE b = 1 AND c = 2 AND d = 3;
```

在本例中，索引合并用于(i_b, i_c).

```java
/*+ INDEX_MERGE(t1 i_a, i_b) NO_INDEX_MERGE(t1 i_b) */
```

NO_INDEX_MERGE将被忽略，因为前面对同一个表有一个提示.

```java
/*+ NO_INDEX_MERGE(t1 i_a, i_b) INDEX_MERGE(t1 i_b) */
```

INDEX_MERGE会被忽略，因为前面有同一个表的提示.

对于INDEX_MERGE和NO_INDEX_MERGE优化提示，这些优先规则适用:

**1、** 如果指定了一个优化器提示并适用，它将优先于optimizer_switch系统变量的Indexmerge相关标志；

```java
SET optimizer_switch='index_merge_intersection=off';
SELECT /*+ INDEX_MERGE(t1 i_b, i_c) */ * FROM t1
WHERE b = 1 AND c = 2 AND d = 3;
```

提示优先于optimizer_switch。在本例中，索引合并用于(i_b, i_c)。

```java
SET optimizer_switch='index_merge_intersection=on';
SELECT /*+ INDEX_MERGE(t1 i_b) */ * FROM t1
WHERE b = 1 AND c = 2 AND d = 3;
```

提示只指定了一个索引，因此不适用，并应用optimizer_switch标志(on)。如果优化器认为索引合并具有成本效率，就使用它。

```java
SET optimizer_switch='index_merge_intersection=off';
SELECT /*+ INDEX_MERGE(t1 i_b) */ * FROM t1
WHERE b = 1 AND c = 2 AND d = 3;
```

该提示只指定了一个索引，因此不适用，并应用optimizer_switch标志(off)。没有使用索引合并

**1、** 索引级优化器提示GROUP_INDEX、INDEX、JOIN_INDEX和ORDER_INDEX都优先于等效的FORCEINDEX提示;也就是说，它们导致FORCEINDEX提示被忽略同样，NO_GROUP_INDEX、NO_INDEX、NO_JOIN_INDEX和NO_ORDER_INDEX提示它们都优先于任何IGNOREINDEX等价项，这也导致它们被忽略；

索引级优化器提示GROUP_INDEX、NO_GROUP_INDEX、INDEX、NO_INDEX、JOIN_INDEX、NO_JOIN_INDEX、ORDER_INDEX和NO_ORDER_INDEX提示都优先于所有其他优化器提示，包括其他索引级优化器提示。任何其他优化器提示只应用于这些优化器允许的索引。

GROUP_INDEX、INDEX、JOIN_INDEX和ORDER_INDEX提示都等同于FORCE INDEX而不是USE INDEX。这是因为使用一个或多个这样的提示意味着只有在无法使用其中一个命名索引查找表中的行时才会使用表扫描。要使MySQL使用与给定的use index实例相同的索引或索引集，您可以使用NO_INDEX、NO_JOIN_INDEX、NO_GROUP_INDEX、NO_ORDER_INDEX或它们的某种组合。

为了复制USE INDEX查询SELECT a,c FROM t1 USE INDEX FOR ORDER BY (i_a) ORDER BY a的效果，你可以使用NO_ORDER_INDEX优化提示覆盖表上的所有索引，除了需要的索引，如下所示:

```java
SELECT /*+ NO_ORDER_INDEX(t1 i_b,i_c) */ a,c
    FROM t1
    ORDER BY a;
```

尝试将表的NO_ORDER_INDEX与USE INDEX for ORDER BY结合在一起是不能做到这一点的，因为NO_ORDER_BY会导致USE INDEX被忽略，如下所示:

```java
mysql> EXPLAIN SELECT /*+ NO_ORDER_INDEX(t1) */ a,c FROM t1
    ->     USE INDEX FOR ORDER BY (i_a) ORDER BY a\G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: t1
   partitions: NULL
         type: ALL
possible_keys: NULL
          key: NULL
      key_len: NULL
          ref: NULL
         rows: 256
     filtered: 100.00
        Extra: Using filesort
```

USEINDEX、FORCE INDEX和IGNORE INDEX索引提示比INDEX_MERGE和NO_INDEX_MERGE优化提示具有更高的优先级。

```java
/*+ INDEX_MERGE(t1 i_a, i_b, i_c) */ ... IGNORE INDEX i_a
```

IGNORE INDEX优先于INDEX_MERGE，因此索引i_a被排除在索引合并的可能范围之外。

```java
/*+ NO_INDEX_MERGE(t1 i_a, i_b) */ ... FORCE INDEX i_a, i_b
```

由于FORCE Index, i_a, i_b不允许索引合并，但是优化器被迫使用i_a或i_b来进行范围或ref访问。没有冲突;这两种提示都适用。

**1、** 如果IGNOREINDEX提示命名多个索引，这些索引对于索引合并是不可用的；

**2、** FORCEINDEX和USEINDEX提示只对已命名的索引进行索引合并；

```java
SELECT /*+ INDEX_MERGE(t1 i_a, i_b, i_c) */ a FROM t1
FORCE INDEX (i_a, i_b) WHERE c = 'h' AND a = 2 AND b = 'b';
```

索引合并交集访问算法用于(i_a, i_b)。如果将FORCE INDEX更改为USE INDEX，也同样适用。

### 3.6 子查询相关优化器的Hints

子查询提示影响是否使用半连接转换以及允许哪些半连接策略，以及在不使用半连接时，是否使用子查询具体化或IN-to-EXISTS转换。

影响半连接策略的提示语法:

```java
hint_name([@query_block_name] [strategy [, strategy] ...])
```

语法指的是这些术语:

**1、** 这些提示名称是允许的:；

1)SEMIJOIN、NO_SEMIJOIN:启用或禁用命名的SEMIJOIN策略。

**2、** strategy:启用或禁用的半连接策略这些策略名称是允许的:DUPSWEEDOUT,FIRSTMATCH,LOOSESCAN,MATERIALIZATION；

对于SEMIJOIN提示，如果没有指定策略，则根据optimizer_switch系统变量启用的策略尽可能使用SEMIJOIN。如果指定了策略但不适用于语句，则使用DUPSWEEDOUT。

对于NO_SEMIJOIN提示，如果没有指定策略，则不使用semijoin。如果指定的策略排除了语句中所有适用的策略，则使用DUPSWEEDOUT。

如果一个子查询嵌套在另一个子查询中，并且两者合并为外部查询的半连接，则最内层查询的任何半连接策略规范都会被忽略。SEMIJOIN和NO_SEMIJOIN提示仍然可以用于启用或禁用此类嵌套子查询的半连接转换。

如果禁用了DUPSWEEDOUT，有时优化器可能会生成一个远非最优的查询计划。这是由于贪婪搜索期间的启发式剪枝，可以通过设置optimizer_prune_level=0来避免。

例子:

```java
SELECT /*+ NO_SEMIJOIN(@subq1 FIRSTMATCH, LOOSESCAN) */ * FROM t2
  WHERE t2.a IN (SELECT /*+ QB_NAME(subq1) */ a FROM t3);
SELECT /*+ SEMIJOIN(@subq1 MATERIALIZATION, DUPSWEEDOUT) */ * FROM t2
  WHERE t2.a IN (SELECT /*+ QB_NAME(subq1) */ a FROM t3);
```

影响是否使用子查询物化或IN-to-EXISTS转换的提示语法:

```java
SUBQUERY([@query_block_name] strategy)
```

提示名称总是SUBQUERY。

对于子查询提示，这些策略值是允许的:INTOEXISTS, MATERIALIZATION。

例子:

```java
SELECT id, a IN (SELECT /*+ SUBQUERY(MATERIALIZATION) */ a FROM t1) FROM t2;
SELECT * FROM t2 WHERE t2.a IN (SELECT /*+ SUBQUERY(INTOEXISTS) */ a FROM t1);
```

对于semijoin和SUBQUERY提示，前导的@query_block_name指定该提示应用的查询块。如果提示不包含前导@query_block_name，则提示适用于出现该提示的查询块。要为查询块分配名称，请参见命名查询块的优化提示。

如果一个提示注释包含多个子查询提示，则使用第一个。如果有其他类似的提示，它们会产生警告。其他类型的后续提示将被默默地忽略。

### 3.7 语句执行时间优化器Hints

MAX_EXECUTION_TIME提示只允许用于SELECT语句。它设置了一个限制N(一个超时值，单位是毫秒)，说明在服务器终止一个语句之前，它允许执行多长时间:

```java
MAX_EXECUTION_TIME(N)
```

超时时间为1秒(1000毫秒):

```java
SELECT /*+ MAX_EXECUTION_TIME(1000) */ * FROM t1 INNER JOIN t2 WHERE ...
```

MAX_EXECUTION_TIME(N)提示设置语句执行超时为N毫秒。如果没有此选项或N为0，将应用由max_execution_time系统变量建立的语句超时。

MAX_EXECUTION_TIME提示如下所示:

**1、** 对于具有多个SELECT关键字的语句，例如union或带有子查询的语句，MAX_EXECUTION_TIME应用于整个语句，必须出现在第一个SELECT之后；

**2、** 它适用于只读SELECT语句非只读语句是那些调用了附带修改数据的存储函数的语句；

**3、** 它不适用于存储程序中的SELECT语句，会被忽略；

### 3.8 可变设定Hints语法

SET_VAR提示临时设置系统变量的会话值(在单个语句期间)。例子:

```java
SELECT /*+ SET_VAR(sort_buffer_size = 16M) */ name FROM people ORDER BY name;
INSERT /*+ SET_VAR(foreign_key_checks=OFF) */ INTO t2 VALUES(2);
SELECT /*+ SET_VAR(optimizer_switch = 'mrr_cost_based=off') */ 1;
```

SET_VAR　Hints的语法:

```java
SET_VAR(var_name = value)
```

Var_name命名具有会话值的系统变量(尽管不能命名所有这些变量，稍后将解释)。Value是要赋给变量的值;该值必须是标量。

SET_VAR进行临时变量更改，如下语句所示:

```java
mysql> SELECT @@unique_checks;
+-----------------+
| @@unique_checks |
+-----------------+
|               1 |
+-----------------+
mysql> SELECT /*+ SET_VAR(unique_checks=OFF) */ @@unique_checks;
+-----------------+
| @@unique_checks |
+-----------------+
|               0 |
+-----------------+
mysql> SELECT @@unique_checks;
+-----------------+
| @@unique_checks |
+-----------------+
|               1 |
+-----------------+
```

使用SET_VAR，不需要保存和恢复变量值。这使您能够用一条语句替换多个语句。考虑以下语句序列:

```java
SET @saved_val = @@SESSION.var_name;
SET @@SESSION.var_name = value;
SELECT ...
SET @@SESSION.var_name = @saved_val;
```

这个序列可以用下面的语句替换:

```java
SELECT /*+ SET_VAR(var_name = value) ...
```

独立的SET语句允许使用以下任何一种语法命名会话变量:

```java
SET SESSION var_name = value;
SET @@SESSION.var_name = value;
SET @@.var_name = value;
```

因为SET_VAR提示只应用于会话变量，所以会话作用域是隐式的，而session， @@SESSION。，和@@既不需要也不允许。包含显式的会话指示符语法会导致忽略SET_VAR提示并发出警告。

并不是所有的会话变量都允许与SET_VAR一起使用。单个系统变量描述表明每个变量是否可提示。您还可以在运行时通过尝试将系统变量与SET_VAR一起使用来检查系统变量。如果变量不能提示，则会出现警告:

```java
mysql> SELECT /*+ SET_VAR(collation_server = 'utf8') */ 1;
+---+
| 1 |
+---+
| 1 |
+---+
1 row in set, 1 warning (0.00 sec)
mysql> SHOW WARNINGS\G
*************************** 1. row ***************************
  Level: Warning
   Code: 4537
Message: Variable 'collation_server' cannot be set using SET_VAR hint.
```

SET_VAR语法允许只设置一个变量，但是可以给出多个提示来设置多个变量:

```java
SELECT /*+ SET_VAR(optimizer_switch = 'mrr_cost_based=off')
           SET_VAR(max_heap_table_size = 1G) */ 1;
```

如果在同一个语句中出现了几个具有相同变量名的提示，则应用第一个提示，而忽略其他提示，并发出警告:

```java
SELECT /*+ SET_VAR(max_heap_table_size = 1G)
           SET_VAR(max_heap_table_size = 3G) */ 1;
```

在本例中，将忽略第二个提示，并警告它是冲突的。

如果没有系统变量具有指定的名称或变量值不正确，SET_VAR提示将被忽略并发出警告:

```java
SELECT /*+ SET_VAR(max_size = 1G) */ 1;
SELECT /*+ SET_VAR(optimizer_switch = 'mrr_cost_based=yes') */ 1;
```

对于第一个语句，没有max_size变量。对于第二个语句，mrr_cost_based接受on或off的值，因此尝试将其设置为yes是不正确的。在每一种情况下，提示都会被一个警告忽略。

SET_VAR提示只允许在语句级别。如果在子查询中使用，该提示将被忽略并发出警告。

复制忽略复制语句中的SET_VAR提示，以避免潜在的安全问题。

### 3.9 资源组 Hint 语法

RESOURCE_GROUP优化器提示用于资源组管理。此提示将执行语句的线程临时分配给指定的资源组(在语句执行期间)。它需要RESOURCE_GROUP_ADMIN或RESOURCE_GROUP_USER权限。

例子:

```java
SELECT /*+ RESOURCE_GROUP(USR_default) */ name FROM people ORDER BY name;
INSERT /*+ RESOURCE_GROUP(Batch) */ INTO t2 VALUES(2);
```

RESOURCE_GROUP提示的语法:

```java
RESOURCE_GROUP(group_name)
```

Group_name表示在语句执行期间应该将线程分配给的资源组。如果组不存在，则会出现警告并忽略提示。

RESOURCE_GROUP提示必须出现在初始语句关键字(SELECT、INSERT、REPLACE、UPDATE或DELETE)之后。

RESOURCE_GROUP的另一个替代方法是SET RESOURCE GROUP语句，该语句将线程非临时地分配给资源组。

### 3.10 命名查询块的优化器Hints

表级、索引级和子查询优化器提示允许将特定的查询块命名为其参数语法的一部分。要创建这些名称，使用QB_NAME提示，它会给出现名称的查询块分配一个名称:

```java
QB_NAME(name)
```

QB_NAME提示可用于以一种清晰的方式显式显示，查询阻塞了适用于其他提示。它们还允许在单个提示注释中指定所有非查询块名称提示，以便更容易理解复杂语句。考虑以下陈述:

```java
SELECT ...
  FROM (SELECT ...
  FROM (SELECT ... FROM ...)) ...
```

QB_NAME提示在语句中为查询块分配名称:

```java
SELECT /*+ QB_NAME(qb1) */ ...
  FROM (SELECT /*+ QB_NAME(qb2) */ ...
  FROM (SELECT /*+ QB_NAME(qb3) */ ... FROM ...)) ...
```

然后其他提示可以使用这些名称来引用适当的查询块:

```java
SELECT /*+ QB_NAME(qb1) MRR(@qb1 t1) BKA(@qb2) NO_MRR(@qb3t1 idx1, id2) */ ...
  FROM (SELECT /*+ QB_NAME(qb2) */ ...
  FROM (SELECT /*+ QB_NAME(qb3) */ ... FROM ...)) ...
```

由此产生的效果如下:

**1、** MRR(@qb1t1)适用于查询块qb1中的表t1；

**2、** BKA(@qb2)适用于查询块qb2；

**3、** NO_MRR(@qb3t1idx1,id2)适用于查询块qb3中表t1中的索引idx1和idx2；

查询块名称是标识符，并且遵循关于哪些名称有效以及如何引用它们的常规规则。例如，包含空格的查询块名称必须用引号括起来，可以使用反引号:

```java
SELECT /*+ BKA(@my hint name) */ ...
  FROM (SELECT /*+ QB_NAME(my hint name) */ ...) ...
```

如果启用了ANSI_QUOTES SQL模式，也可以在双引号中引用查询块名称:

```java
SELECT /*+ BKA(@"my hint name") */ ...
  FROM (SELECT /*+ QB_NAME("my hint name") */ ...) ...
```

## 四.索引Hints

索引提示为优化器提供关于在查询处理期间如何选择索引的信息。索引和优化器提示可以单独使用，也可以同时使用。

索引提示只适用于SELECT和UPDATE语句。

索引提示在表名之后指定。引用单个表的语法(包括索引提示)如下所示:

```java
tbl_name [[AS] alias] [index_hint_list]
index_hint_list:
    index_hint [index_hint] ...
index_hint:
    USE {
    INDEX|KEY}
      [FOR {
    JOIN|ORDER BY|GROUP BY}] ([index_list])
  | {
    IGNORE|FORCE} {
    INDEX|KEY}
      [FOR {
    JOIN|ORDER BY|GROUP BY}] (index_list)
index_list:
    index_name [, index_name] ...
```

USEINDEX (index_list)提示告诉MySQL只使用其中一个命名索引来查找表中的行。另一种语法IGNORE INDEX (index_list)告诉MySQL不要使用某些特定的索引。如果EXPLAIN显示MySQL在可能的索引列表中使用了错误的索引，那么这些提示是有用的。

FORCE INDEX提示的作用类似于USE INDEX (index_list)，只是假设表扫描的开销非常大。换句话说，只有在无法使用某个命名索引查找表中的行时，才会使用表扫描。

每个提示都需要索引名，而不是列名。要引用主键，请使用名称primary。要查看表的索引名称，可以使用SHOW index语句或INFORMATION_SCHEMA。统计数据表。

index_name值不需要是完整的索引名称。它可以是索引名的明确前缀。如果前缀有二义性，就会发生错误。

例子:

```java
SELECT * FROM table1 USE INDEX (col1_index,col2_index)
  WHERE col1=1 AND col2=2 AND col3=3;
SELECT * FROM table1 IGNORE INDEX (col3_index)
  WHERE col1=1 AND col2=2 AND col3=3;
```

索引提示的语法具有以下特征:

**1、** 在USEINDEX中省略index_list在语法上是有效的，这意味着“不使用索引”在FORCEINDEX或IGNOREINDEX中省略index_list是语法错误；

**2、** 可以通过向提示添加FOR子句来指定索引提示的范围这为查询处理的各个阶段提供了对执行计划的优化器选择的更细粒度控制当MySQL决定如何在表中查找行以及如何处理连接时，要只影响索引，使用FORJOIN若要影响用于对行进行排序或分组的索引使用，请使用forORDERBY或forGROUPBY；

**3、** 你可以指定多个索引提示:；

```java
SELECT * FROM t1 USE INDEX (i1) IGNORE INDEX FOR ORDER BY (i2) ORDER BY a;
```

在几个提示中(甚至在同一个提示中)命名同一个索引不是错误:

```java
SELECT * FROM t1 USE INDEX (i1) USE INDEX (i1,i1);
```

但是，对于同一个表混合使用INDEX和FORCE INDEX是错误的:

```java
SELECT * FROM t1 USE INDEX FOR JOIN (i1) FORCE INDEX FOR JOIN (i2);
```

如果索引提示不包含FOR子句，则该提示的作用域将应用于语句的所有部分。例如，这个提示:

```java
IGNORE INDEX (i1)
```

等价于以下提示的组合:

```java
IGNORE INDEX FOR JOIN (i1)
IGNORE INDEX FOR ORDER BY (i1)
IGNORE INDEX FOR GROUP BY (i1)
```

在MySQL 5.0中，没有FOR子句的提示作用域只适用于行检索。要使服务器在没有FOR子句时使用这种旧的行为，请在服务器启动时启用旧的系统变量。注意在复制设置中启用这个变量。对于基于语句的二进制日志记录，使用源和副本的不同模式可能会导致复制错误。

在处理索引提示时，它们将按类型(USE、FORCE、IGNORE)和范围(FOR JOIN、FOR ORDER by、FOR GROUP by)收集在一个列表中。例如:

```java
SELECT * FROM t1
  USE INDEX () IGNORE INDEX (i2) USE INDEX (i1) USE INDEX (i2);
```

等同于:

```java
SELECT * FROM t1
   USE INDEX (i1,i2) IGNORE INDEX (i2);
```

然后索引提示按以下顺序应用于每个作用域:

**1、** {USE|FORCE}如果存在，则应用索引(如果不是，则使用优化器确定的索引集)；

**2、** IGNOREINDEX应用于上一步的结果例如，下面两个查询是等价的:；

```java
SELECT * FROM t1 USE INDEX (i1) IGNORE INDEX (i2) USE INDEX (i2);
SELECT * FROM t1 USE INDEX (i1);
```

对于FULLTEXT搜索，索引提示的作用如下:

**1、** 对于自然语言模式的搜索，索引提示会被静默地忽略例如，IGNOREINDEX(i1)被忽略，没有任何警告，索引仍然被使用；

**2、** 对于布尔模式搜索，带有ForORDERBY或ForGROUPBY的索引提示将被静默忽略使用FORJOIN或不使用FOR修饰符的索引提示是被尊重的与用于非fulltext搜索的提示不同，提示用于查询执行的所有阶段(查找行和检索、分组和排序)即使提示是非fulltext索引，也是如此；

例如，下面两个查询是等价的:

```java
SELECT * FROM t
  USE INDEX (index1)
  IGNORE INDEX (index1) FOR ORDER BY
  IGNORE INDEX (index1) FOR GROUP BY
  WHERE ... IN BOOLEAN MODE ... ;
SELECT * FROM t
  USE INDEX (index1)
  WHERE ... IN BOOLEAN MODE ... ;
```
