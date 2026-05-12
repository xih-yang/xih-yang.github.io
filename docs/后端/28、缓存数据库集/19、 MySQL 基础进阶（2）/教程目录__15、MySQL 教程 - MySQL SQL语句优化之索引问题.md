# 15、MySQL 教程 - MySQL SQL语句优化之索引问题
- 来源：https://ddkk.com/zhuanlan/db/mysql/7/15.html
- 分类：缓存数据库
- 分组：教程目录
索引是数据库优化中最常用也是最重要的手段之一，通过索引通常可以解决大多数的SQL性能问题。

## 一、索引的存储分类

索引是在MySQL的存储引擎层中实现的，因此，每种存储引擎的索引都不一定完全相同，也不是所有的存储引擎都支持所有的索引类型。目前MySQL提供了以下4种索引：

- B-Tree索引：最常见的索引类型，大部分存储引擎都支持B树索引；
- HASH索引：只有Memory引擎支持，使用场景简单；
- R-Tree索引（空间索引）：是MyISAM的一个特殊索引类型，主要用于空间数据类型，使用较少；
- Full-text（全文索引）：MyISA版本M的一个特殊索引类型，主要用于全文索引，InnoDB从MySQL5.6版本开始支持。

MySQL暂不支持函数索引，但是可以对列的前面某一部分进行索引，这称为前缀索引，这个特性可以大大缩小索引文件的大小，但是缺点是在排序ORDER BY 和分组GROUP BY 操作的时候无法使用。

```java
这是一个创建前缀索引的例子
create index idx_title on film(title(10));
```

HASH索引相对较简单，主要适用于Key-Value查询，通常它要比B树索引快；但是HASH索引不适用于范围查询，像不等符号、between等之类的。B-Tree索引相对较复杂一点，下面主要介绍的就是这种索引。

## 二、MySQL如何使用索引

B-Tree索引是最常见的索引，构造类似于二叉树，能根据键值提供一行或者一个行集的快速访问，通常只需要很少的读操作就可以找到正确的行。可以利用B-Tree索引进行全关键字、关键字范围和关键字前缀查询。

```java
为避免混淆，将表rental上的索引rental_date重命名为idx_rental_date
mysql> alter table rental drop index rental_date;
Query OK, 0 rows affected (0.02 sec)
Records: 0  Duplicates: 0  Warnings: 0
mysql> alter table rental add index idx_rental_date (rental_date,inventory_id,customer_id);
Query OK, 0 rows affected (0.05 sec)
Records: 0  Duplicates: 0  Warnings: 0
```

#### 2.1 MySQL种能够使用索引的典型场景

**1. 匹配全值**

对索引中所有列都指定具体值，即对索引中的所有列都有等值匹配的条件。例如下面的例子指定表rental中三个字段的具体条件：

```java
mysql> explain select * from rental where rental_date='2005-05-25 17:22:10' and inventory_id = 373 and customer_id = 343 \G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: rental
   partitions: NULL
         type: ref
possible_keys: idx_fk_inventory_id,idx_fk_customer_id,idx_rental_date
          key: idx_rental_date
      key_len: 10
          ref: const,const,const
         rows: 1
     filtered: 100.00
        Extra: NULL
1 row in set, 1 warning (0.00 sec)
```

可以看到，优化器选择了复合索引idx_rental_date准确的进行了查找。

**2. 匹配值的范围查询**

对索引的值能够进行范围查找，例如下面的例子指定customer_id的范围：

```java
mysql> explain select * from rental where customer_id >= 373 and customer_id <= 400 \G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: rental
   partitions: NULL
         type: range
possible_keys: idx_fk_customer_id
          key: idx_fk_customer_id
      key_len: 2
          ref: NULL
         rows: 746
     filtered: 100.00
        Extra: Using index condition
1 row in set, 1 warning (0.00 sec)
```

从上面的例子可以看出，range表示优化器选择范围查询，idx_fk_customer_id表示优化器选择该索引来加速访问；

**3. 最左匹配原则**

使用索引查找时包含到最左边的列，比如在col1、col2、col3三个列字段上有个联合索引，当你想使用这个索引进行查找时你的等值查询条件必须包含col1（最左边的那一列），否则就无法用到该联合索引，像col2、（col2+col3）就无法用到该索引。请看下面的例子：

```java
给三列payment_date,amount,last_update创建一个联合索引idx_payment_date
mysql> alter table payment add index idx_payment_date(payment_date,amount,last_update);
Query OK, 0 rows affected (0.09 sec)
Records: 0  Duplicates: 0  Warnings: 0
当等值条件包含最左列payment_date时可以用到索引idx_payment_date
mysql> explain select * from payment where payment_date = '2006-02-14 15:16:03' and last_update = '2006-02-15 22:12:32' \G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: payment
   partitions: NULL
         type: ref
possible_keys: idx_payment_date
          key: idx_payment_date
      key_len: 5
          ref: const
         rows: 182
     filtered: 10.00
        Extra: Using index condition
1 row in set, 1 warning (0.00 sec)
当等值条件不包含最左列payment_date时无法用到索引idx_payment_date
mysql> explain select * from payment where amount = 3.98 and last_update = '2006-02-15 22:12:32' \G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: payment
   partitions: NULL
         type: ALL
possible_keys: NULL
          key: NULL
      key_len: NULL
          ref: NULL
         rows: 16125
     filtered: 1.00
        Extra: Using where
1 row in set, 1 warning (0.00 sec)
```

**这个原则是MySQL中B-Tree索引使用的首要原则。**

**4. 仅仅对索引进行查询**

当查询的列都包含在联合索引的字段中时（且这时候要满足最左原则能够使用到该联合索引），能够直接根据索引获取到所需的数据，而不需要通过索引回到表中再去找关联数据。

```java
mysql> explain select last_update from payment where payment_date = '2006-02-14 15:16:03' and amount=3.98 \G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: payment
   partitions: NULL
         type: ref
possible_keys: idx_payment_date
          key: idx_payment_date
      key_len: 8
          ref: const,const
         rows: 8
     filtered: 100.00
        Extra: Using index
1 row in set, 1 warning (0.00 sec)
```

从例子中可以看到，last_update在联合索引idx_payment_date的字段中，因此此处可以通过该索引直接获得数据，Extra显示Using index表明是覆盖索引扫描，不需要回表，直接通过索引就能得到想要的数据，减少了不必要的访问加快了速度。

**5. 匹配列前缀**

仅仅使用索引中的第一列，并且只包含索引第一列的开头一部分进行查找。比如下面的例子

```java
创建联合前缀索引
mysql> create index idx_title_desc_part on film_text (title(10), description(20));
Query OK, 0 rows affected (0.04 sec)
Records: 0  Duplicates: 0  Warnings: 0
当要查找以AFRICAN开头的电影时，使用到该索引
mysql> explain select title from film_text where title like 'AFRICAN%' \G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: film_text
   partitions: NULL
         type: range
possible_keys: idx_title_desc_part,idx_title_description
          key: idx_title_desc_part
      key_len: 32
          ref: NULL
         rows: 1
     filtered: 100.00
        Extra: Using where
1 row in set, 1 warning (0.00 sec)
```

需要满足一定的条件才能使用到该索引，Using where表示优化器需要通过索引回表查询数据。

**6. 索引匹配部分精确查找，部分范围查找**

例如下面的例子，查找条件一个精确一个范围

```java
mysql> explain select inventory_id from rental where rental_date = '2006-02-14 15:16:03' and customer_id >= 300 and customer_id <= 400 \G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: rental
   partitions: NULL
         type: ref
possible_keys: idx_fk_customer_id,idx_rental_date
          key: idx_rental_date
      key_len: 5
          ref: const
         rows: 182
     filtered: 16.85
        Extra: Using where; Using index
1 row in set, 1 warning (0.00 sec)
```

可以看到使用了联合索引，使用了覆盖索引扫描，而且还需要回表查询数据。

**7. 如果列名是索引，那么使用“ 列名 is null ” 就会使用该索引**

看下面的例子，rental_id这个列名就是索引

```java
mysql> explain select * from payment where rental_id is null \G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: payment
   partitions: NULL
         type: ref
possible_keys: fk_payment_rental
          key: fk_payment_rental
      key_len: 5
          ref: const
         rows: 5
     filtered: 100.00
        Extra: Using index condition
1 row in set, 1 warning (0.00 sec)
```

**8. Index Condition Pushdown 特性**

ICP特性在MySQL5.6以后引入，pushdown表示操作下放，某些情况下的条件过滤操作下放到存储引擎；这进一步优化了查询。比如前面举的例子中Extra字段的值为Using index condition，就表明使用了ICP来进行优化查询。

比如下面这条例子：

```java
explain select inventory_id from rental where rental_date = '2006-02-14 15:16:03' and customer_id >= 300 and customer_id <= 400 \G
```

**在之前版本中没有使用ICP特性时，它的执行计划是这样的：** 优化器首先根据复合索引idx_rental_date的首字段rental_date过滤出符合条件rental_date = '2006-02-14 15:15:03' 的记录，然后根据复合索引回表获取记录，最终再根据customer_id的条件过滤出最后的查询结果（extra字段显示为using where）。

在5.6版本之后使用了ICP特性，它的执行计划是这样的：优化器首先根据复合索引idx_rental_date的首字段rental_date过滤出符合条件rental_date = '2006-02-14 15:15:03' 的记录（key字段显示为idx_rental_date），然后把条件customer_id的过滤操作下推到存储引擎来完成，在回表查询记录之前，不符合customer_id的记录已经被过滤掉了，因此不必再访问表中这些记录，直接可以查询到最终的结果（extra字段显示为using index condition）。

```java
mysql> explain select inventory_id from rental where rental_date = '2006-02-14 15:16:03' and customer_id >= 300 and customer_id <= 400 \G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: rental
   partitions: NULL
         type: ref
possible_keys: idx_fk_customer_id,idx_rental_date
          key: idx_rental_date
      key_len: 5
          ref: const
         rows: 182
     filtered: 16.85
        Extra: Using where; Using index
1 row in set, 1 warning (0.00 sec)
```

#### 2.2 存在索引但不能使用索引的场景

**1. 使用%开头的LIKE查询不能够使用B-Tree索引**

```java
mysql> explain select * from actor where last_name like '%NI%' \G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: actor
   partitions: NULL
         type: ALL
possible_keys: NULL
          key: NULL
      key_len: NULL
          ref: NULL
         rows: 200
     filtered: 11.11
        Extra: Using where
1 row in set, 1 warning (0.00 sec)
```

上面的关键字key为NULL表示没有使用索引，根据B树索引的结构也能知道以%开头的查询自然没法利用索引，一般推荐使用**全文索引**来解决类似全文索引问题；还有一种解决办法就是通过索引的全扫描来过滤后再关联到表中查询，这通常是利用索引比表小的特性来减少大量的IO操作，比如下面的例子：InnoDB表上二级索引idx_last_name实际上存储了字段lsat_name和actor_id，通过扫描二级索引idx_last_name获得满足条件lsat_name like ‘%NI%’ 的主键 actor_id列表，之后再根据主键回表去检索记录，这样就避免了对全表的扫描。

```java
mysql> explain select * from (select actor_id from actor where last_name like '%NI%' )a, actor b where a.actor_id = b.actor_id \G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: actor
   partitions: NULL
         type: index
possible_keys: PRIMARY
          key: idx_actor_last_name
      key_len: 137
          ref: NULL
         rows: 200
     filtered: 11.11
        Extra: Using where; Using index
*************************** 2. row ***************************
           id: 1
  select_type: SIMPLE
        table: b
   partitions: NULL
         type: eq_ref
possible_keys: PRIMARY
          key: PRIMARY
      key_len: 2
          ref: sakila.actor.actor_id
         rows: 1
     filtered: 100.00
        Extra: NULL
2 rows in set, 1 warning (0.00 sec)
```

**2. 数据类型出现隐式转换的时候也不会使用索引**

特别是当列类型是字符串时这种情况更明显，哪怕这一列有索引也不会使用，比如下面的例子；因此一定记住要用引号将字符常量括起来。

```java
mysql> explain select * from actor where last_name = 1 \G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: actor
   partitions: NULL
         type: ALL
possible_keys: idx_actor_last_name
          key: NULL                          没有使用到索引
      key_len: NULL
          ref: NULL
         rows: 200
     filtered: 10.00
        Extra: Using where
1 row in set, 3 warnings (0.00 sec)
mysql> explain select * from actor where last_name = '1' \G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: actor
   partitions: NULL
         type: ref
possible_keys: idx_actor_last_name
          key: idx_actor_last_name            使用到了索引
      key_len: 137
          ref: const
         rows: 1
     filtered: 100.00
        Extra: NULL
1 row in set, 1 warning (0.00 sec)
```

**3. 不满足最左原则时不会使用索引**

前面提到过，不满足最左原则时不会使用到该索引。

**4. 如果使用索引比全表扫描还慢就不会使用索引**

比如查询某一值时返回的记录比值非常大，这时候全表扫描的效率反而比使用索引的效率更高，因此，mysql优化器就更倾向于使用全表扫描。也就是说在查询时，筛选性越高越容易使用到索引，筛选性越低越不容易使用索引。

**5. 用OR分开的条件中如果有任意一个没法使用到索引那么都不会使用索引**

比如下面的例子中customer_id列有索引可用，而amount无法使用索引，因此amount必定要进行全表扫描，当进行全表扫描时就一并将customer_id列进行扫描了，因此没必要再通过它的索引扫描增加IO访问，一次全表扫描过滤条件就足够。

```java
mysql> explain select * from payment where customer_id = 203 or amount = 3.96 \G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: payment
   partitions: NULL
         type: ALL
possible_keys: idx_fk_customer_id
          key: NULL
      key_len: NULL
          ref: NULL
         rows: 16125
     filtered: 10.15
        Extra: Using where
1 row in set, 1 warning (0.00 sec)
```

## 三、查看索引使用情况

使用相关命令查看数据库的索引情况：

```java
mysql> show status like 'handler_read%';
+-----------------------+-------+
| Variable_name         | Value |
+-----------------------+-------+
| Handler_read_first    | 0     |
| Handler_read_key      | 0     |
| Handler_read_last     | 0     |
| Handler_read_next     | 0     |
| Handler_read_prev     | 0     |
| Handler_read_rnd      | 0     |
| Handler_read_rnd_next | 15    |
+-----------------------+-------+
7 rows in set (0.00 sec)
```

如果索引正在工作，Handler_read_key的值将很高，这个值代表了一个行被索引值读取的次数，很低的值表明增加索引得到的性能改善不高，因为索引并不经常使用。

Handler_read_rnd_next 的值高则意味着查询运行低效，应该建立索引补救。这个值的含义是在数据文件中读下一行的请求数；如果正在进行大量的表扫描，那么它的值就会非常高，这就说明索引不正确或是查询没有利用到索引。
