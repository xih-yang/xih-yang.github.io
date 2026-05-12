# 10、MySQL 调优 - MySQL的并行介绍
- 来源：https://ddkk.com/zhuanlan/db/mysql/3/10.html
- 分类：缓存数据库
- 分组：教程目录
备注:测试数据库版本为MySQL 8.0

## 一.MySQL InnoDB并行查询介绍

MySQL经过多年的发展已然成为最流行的数据库，广泛用于互联网行业，并逐步向各个传统行业渗透。之所以流行，一方面是其优秀的高并发事务处理的能力，另一方面也得益于MySQL丰富的生态。MySQL在处理OLTP场景下的短查询效果很好，但对于复杂大查询则能力有限。最直接一点就是，对于一个SQL语句，MySQL最多只能使用一个CPU核来处理，在这种场景下无法发挥主机CPU多核的能力。MySQL没有停滞不前，一直在发展，新推出的8.0.14版本第一次引入了并行查询特性，使得check table和select count(*)类型的语句性能成倍提升。虽然目前使用场景还比较有限，但后续的发展值得期待。

InnoDB并行是通过设置参数innodb_parallel_read_threads来控制的。

官网innodb_parallel_read_threads参数的介绍:

## 二.MySQL 并行查询案例

因为我本地测试环境cpu只有4个，所以我分别测试1,2,4三个值。

测试记录:

```java
mysql> set local innodb_parallel_read_threads = 1;
Query OK, 0 rows affected (0.01 sec)
mysql> select count(*) from fact_sale;
+-----------+
| count(*)  |
+-----------+
| 767830001 |
+-----------+
1 row in set (2 min 20.05 sec)
mysql> set local innodb_parallel_read_threads = 2;
Query OK, 0 rows affected (0.01 sec)
mysql> select count(*) from fact_sale;
+-----------+
| count(*)  |
+-----------+
| 767830001 |
+-----------+
1 row in set (1 min 33.54 sec)
mysql> set local innodb_parallel_read_threads = 4;
Query OK, 0 rows affected (0.00 sec)
mysql> select count(*) from fact_sale;
+-----------+
| count(*)  |
+-----------+
| 767830001 |
+-----------+
1 row in set (1 min 2.12 sec)
```
