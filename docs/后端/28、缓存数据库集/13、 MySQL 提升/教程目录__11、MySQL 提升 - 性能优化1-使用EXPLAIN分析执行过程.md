# 11、MySQL 提升 - 性能优化1-使用EXPLAIN分析执行过程
- 来源：https://ddkk.com/zhuanlan/db/mysql/1/11.html
- 分类：缓存数据库
- 分组：教程目录
### 一、概述

mysql中有专门负责优化查询语句的模块。通过计算分析系统中收集到的统计信息，为客户端请求的查询提供最优的执行计划。

使用explain关键字可以模拟优化器执行sql查询语句，从而知道mysql是如果处理sql语句的，分析出查询语句或是表结构的性能拼劲。

### 二、EXPLAIN使用

#### 1.用法

语法：`explain sql语句`

```java
mysql> explain select * from student_info s,teacher_info t where s.class = t.class \G $
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: s
   partitions: NULL
         type: ALL
possible_keys: NULL
          key: NULL
      key_len: NULL
          ref: NULL
         rows: 1
     filtered: 100.00
        Extra: NULL
*************************** 2. row ***************************
           id: 1
  select_type: SIMPLE
        table: t
   partitions: NULL
         type: ALL
possible_keys: NULL
          key: NULL
      key_len: NULL
          ref: NULL
         rows: 2
     filtered: 50.00
        Extra: Using where; Using join buffer (Block Nested Loop)
2 rows in set, 1 warning (0.00 sec)
```

可以看到输出的信息有如下字段：

```java
| id | select_type | table | partitions | type | possible_keys | key  | key_len | ref  | rows | filtered | Extra
```

#### 2.字段说明

##### 1，id字段

select查询的序列号，表示查询中执行select子句或操作表的顺序

分为三种情况：

- id相同，执行顺序由上至下读取加载
- id不同：如果是子查询，id的序号会递增，id值越大执行优先级越高
- id有相同和不同：相同的顺序执行，不同的id值越大执行优先级越高

##### 2，select_type字段

表示查询类型

常见的值：

SIMPLE,PRIMARY,SUBQUERY,DERIVED,UNION,UNION RESULT

- SIMPLE：简单的查询，查询中不包含子查询或者UNION
- PRIMARY：表示最外层查询
- SUBQUERY：表示子查询
- DERIVED：在from列表中包含的子查询被标记为DERIVED，mysql会递归执行这些子查询，把结果放在临时表中。
- UNION：若第二个select出现在union之后，则会被标记为union。
- UNION RESULT：表示从UNION表获取结果的select

##### 3，table字段

标示这行数据是哪张表的。

##### 4，type字段：

常见的值：ALL,index,range,ref,eq_ref,cost,system,NULL

性能从高到低：

system > const > eq_ref > ref > fange > index > ALL

- system：表里只有一行数据（等于系统表），这是const类型的特性，平时不会出现这个，可以忽略不计。
- const：表示通过索引一次就可以找到，const用于比较primary key或者unique索引。因为只匹配一行数据，所以很快，如果将主键置于where条件中，mysql就能将该查询转换为一个常量。
- eq_ref：唯一行索引扫描，对于每个索引键，表中只有一条记录与之匹配，常见于主键或唯一索引扫描。
- ref：非唯一索引扫描，返回匹配某个单独值的所在行。
- range：只检索给定范围的行，使用一个索引来选择。开始于索引的某个点，结束于另一个点，不用全表扫描。
- index：Full Index Scan，index于all的区别在于index只遍历索引树。也就是说虽然all和index都是读全表，但index是从索引中读，而all是从硬盘中读。
- all：full table scan，遍厉全表匹配行。

一般来说，需要保证查询至少能达到range级别，最好能到ref。

##### 5，possible_keys字段

显示可能应用在这张表中的索引，一个或多个。查询涉及到的字段上若存在索引，则该索引将被列出，但不一定被查询实际使用。

##### 6，key字段

实际使用的索引。如果为NULL，则表示没有使用索引。查询中若使用了覆盖索引则该索引仅出现在key列表中。

##### 7，key_len字段

表示索引中使用的字节数，可通过该列计算查询中使用的索引的长度。在不损失精确性的情况下，长度越短越好。key_len显示的值为索引字段的最大可能长度，并非实际使用长度，即key_len是根据表定义计算得到的，不是通过表内检索出来的。

##### 8，ref字段

显示索引的哪一列被使用了，如果可能的话，是一个常数。

哪些列或常量被用于查找索引列的值。

##### 9，rows字段

根据表统计信息及索引选用情况，大致估算出找到所需的记录所需要的行数。

##### 10，extre字段

包含不适合在其他列中显示但十分重要的额外信息：

- Using filesort：说明mysql会对数据使用一个外部的索引排序，而不是按照表内的索引顺序进行读取。mysql中无法利用索引完成的排序操作称为“文件排序”。
- Using temporary：使用了临时表保存中间结果，mysql在对查询结果排序时使用临时表。常见于排序order by。
- Using index：表示相应的select操作中使用了覆盖索引，避免访问了表的数据行。如果同时出现using where，表明索引被用来执行索引键值查找。

如果没有同时出现using where，表明索引用来读取数据而非执行查找动作。
- Using where：表示是用了where过滤
- Using join buffer：使用了连接缓存。
- impossible where：where子句的值总是false，不能用来获取任何数据。例如where id=1 and id =2;。
- select tables optimized away：在没有group by的情况下，基于索引优化min/max操作或者对于MyISAM存储引擎优化count(*)操作，不许等执行阶段再进行计算，查询执行计划生成的阶段即完成优化。
- distinct：优化distinct操作，在找到第一匹配的数据后即停止找同样值的动作。
