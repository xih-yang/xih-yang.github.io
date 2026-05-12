# 06、MySQL 调优 - 索引优化
- 来源：https://ddkk.com/zhuanlan/db/mysql/3/6.html
- 分类：缓存数据库
- 分组：教程目录
备注:测试数据库版本为MySQL 8.0

## 一.索引介绍

要理解MySQL中索引是如何工作的，最简单的方法就是去看看一本书的“索引”部分：如果想在一本书中找到某个特定主题，一般会先看书的“索引”，找到对应的页码。

考虑现在MySQL的存储引擎都是InnoDB，其它引擎很少使用，下面的讨论都是围绕InnoDB存储引擎展开。

在MySQL中，存储引擎用类似的方法使用索引，其先在索引中找到对应值，然后根据匹配的索引记录找到对应的数据行。。假如要运行下面的查询：

```java
mysql> SELECT first_name FROM sakila.actor WHERE actor_id=5;
```

如果在actor_id列上建有索引，则MySQL将使用该索引找到actor_id为5的行，也就是说，MySQL先在索引上按值进行查找，然后返回所有包含该值的数据行。

索引可以包含一个或多个列的值。如果索引包含多个列，那么列的顺序也十分重要，因为MySQL只能高效地使用索引的最左前缀列。

**索引的优点:**

**1、** 索引大大减少了服务器需要扫描的数据量；

**2、** 索引可以帮助服务器避免排序和临时表；

**3、** 索引可以将随机I/O变为顺序I/O；

如果表的数量特别多，可以建立一个元数据信息表，用来查询需要用到的某些特性。例如执行那些需要聚合多个应用分布在多个表的数据的查询，则需要记录“哪个用户的信息存储在哪个表中”的元数据，这样在查询时就可以直接忽略那些不包含指定用户信息的表。对于大型系统，这是一个常用的技巧。事实上，Infobright就是使用类似的实现。对于TB级别的数据，定位单条记录的意义不大，所以经常会使用块级别元数据技术来替代索引。

### 1.1 索引的类型

#### 1.1.1 B-Tree索引

B树（B-tree）是一种树状数据结构，它能够存储数据、对其进行排序并允许以O(log n)的时间复杂度运行进行查找、顺序读取、插入和删除的数据结构。B树，概括来说是一个节点可以拥有多于2个子节点的二叉查找树。与自平衡二叉查找树不同，B-树为系统最优化大块数据的读和写操作。B-tree算法减少定位记录时所经历的中间过程，从而加快存取速度。普遍运用在数据库和文件系统。”

定义:

**1、** 根节点至少有两个子节点；

**2、** 每个节点有M-1个key，并且以升序排列；

**3、** 位于M-1和Mkey的子节点的值位于M-1和Mkey对应的Value之间；

**4、** 其它节点至少有M/2个子节点；

下面是一个M=3的B树:

#### 1.1.2 B+Tree索引

B+树是对B树的一种变形树，它与B树的差异在于：

**1、** 有k个子结点的结点必然有k个关键码；

**2、** 非叶结点仅具有索引作用，跟记录有关的信息均存放在叶结点中；

**3、** 树的所有叶结点构成一个有序链表，可以按照关键码排序的次序遍历全部记录；

**B+树和B树的区别**

B+树的非叶子结点只包含导航信息，不包含实际的值，所有的叶子结点和相连的节点使用链表相连，便于区间查找和遍历。

**1、** IO次数更少：由于B+树在内部节点上不包含数据信息，因此在内存页中能够存放更多的key数据存放的更加紧密，具有更好的空间局部性因此访问叶子节点上关联的数据也具有更好的缓存命中率；

**2、** 遍历更加方便：B+树的叶子结点都是相链的，因此对整棵树的遍历只需要一次线性遍历叶子结点即可而且由于数据顺序排列并且相连，所以便于区间查找和搜索而B树则需要进行每一层的递归遍历相邻的元素可能在内存中不相邻，所以缓存命中性没有B+树好；

**MySQL的InnoDB存储引擎采用的就是B+Tree索引。**

#### 1.2.3 B*Tree索引

B*树是B+树的变体，在B+树的非根和非叶子结点再增加指向兄弟的指针；

**Oracle采用的的是B*Tree索引**

#### 1.1.4 哈希索引

哈希索引（hash index）基于哈希表实现，只有精确匹配索引所有列的查询才有效(4)。对于每一行数据，存储引擎都会对所有的索引列计算一个哈希码（hash code），哈希码是一个较小的值，并且不同键值的行计算出来的哈希码也不一样。哈希索引将所有的哈希码存储在索引中，同时在哈希表中保存指向每个数据行的指针。

在MySQL中，只有Memory引擎显式支持哈希索引。这也是Memory引擎表的默认

索引类型，Memory引擎同时也支持B-Tree索引。

#### 1.1.5 空间数据索引

空间索引使用场景不多，此处略过。

#### 1.1.6 全文索引

全文索引是一种特殊类型的索引，它查找的是文本中的关键词，而不是直接比较索引中的值。全文搜索和其他几类索引的匹配方式完全不一样。它有许多需要注意的细节，如停用词、词干和复数、布尔搜索等。全文索引更类似于搜索引擎做的事情，而不是简单的WHERE条件匹配。

在相同的列上同时创建全文索引和基于值的B-Tree索引不会有冲突，全文索引适用于MATCH AGAINST操作，而不是普通的WHERE条件操作。

## 二.如何创建高性能的索引

正确地创建和使用索引是实现高性能查询的基础。

高效地选择和使用索引有很多种方式，其中有些是针对特殊案例的优化方法，有些则是针对特定行为的优化。使用哪个索引，以及如何评估选择不同索引的性能影响的技巧，则需要持续不断地学习。接下来的几个小节将帮助读者理解如何高效地使用索引。

#### 2.1 独立的列

对列进行了运算是无法使用到索引的，例如:

```java
mysql> SELECT actor_id FROM sakila.actor WHERE actor_id + 1 = 5;
mysql> SELECT ... WHERE TO_DAYS(CURRENT_DATE) - TO_DAYS(date_col) <= 10;
```

需要修正为:

```java
mysql> SELECT actor_id FROM sakila.actor WHERE actor_id  = 5 - 1;
mysql> SELECT ... WHERE TO_DAYS(date_col) >= TO_DAYS(CURRENT_DATE) - 10;
```

### 2.2 前缀索引和索引选择性

有时候需要索引很长的字符列，这会让索引变得大且慢。一个策略是前面提到过的模拟哈希索引。但有时候这样做还不够，还可以做些什么呢？

通常可以索引开始的部分字符，这样可以大大节约索引空间，从而提高索引效率。但这样也会降低索引的选择性。索引的选择性是指，不重复的索引值（也称为基数，cardinality）和数据表的记录总数（#T）的比值，范围从1/#T到1之间。索引的选择性越高则查询效率越高，因为选择性高的索引可以让MySQL在查找时过滤掉更多的行。唯一索引的选择性是1，这是最好的索引选择性，性能也是最好的。

一般情况下某个列前缀的选择性也是足够高的，足以满足查询性能。对于BLOB、TEXT或者很长的VARCHAR类型的列，必须使用前缀索引，因为MySQL不允许索引这些列的完整长度。

**在进行前缀索引的时候，要计算cardinality，来选择合适的前缀长度，例如对比count(distinct str1(10))/count(*) count(distinct str1(20))/count(*) count(distinct str1(30))/count(*) 等的前缀索引的cardinality，选择一个最合适的。**

下面是一个给varchar、text、blob列创建前缀索引的例子:

```java
mysql> create table t2 (id int,str1 varchar(4000),str2 text,str3 blob);
Query OK, 0 rows affected (0.02 sec)
mysql> 
mysql> insert into t2 select 1,repeat('abc',100),repeat('wxy',100),repeat('dxx',100);
Query OK, 1 row affected (0.00 sec)
Records: 1  Duplicates: 0  Warnings: 0
mysql> create index i_001 on t2(str1(10));
Query OK, 0 rows affected (0.01 sec)
Records: 0  Duplicates: 0  Warnings: 0
mysql> create index i_002 on t2(str2(20));
Query OK, 0 rows affected (0.01 sec)
Records: 0  Duplicates: 0  Warnings: 0
mysql> create index i_003 on t2(str3(30));
Query OK, 0 rows affected (0.01 sec)
Records: 0  Duplicates: 0  Warnings: 0
mysql> explain select * from t2 where str1 = 'abcabc%';
+----+-------------+-------+------------+------+---------------+-------+---------+-------+------+----------+-------------+
| id | select_type | table | partitions | type | possible_keys | key   | key_len | ref   | rows | filtered | Extra       |
+----+-------------+-------+------------+------+---------------+-------+---------+-------+------+----------+-------------+
|  1 | SIMPLE      | t2    | NULL       | ref  | i_001         | i_001 | 33      | const |    1 |   100.00 | Using where |
+----+-------------+-------+------------+------+---------------+-------+---------+-------+------+----------+-------------+
1 row in set, 1 warning (0.00 sec)
mysql> explain select * from t2 where str1 = 'abcabcabcabc%';
+----+-------------+-------+------------+------+---------------+-------+---------+-------+------+----------+-------------+
| id | select_type | table | partitions | type | possible_keys | key   | key_len | ref   | rows | filtered | Extra       |
+----+-------------+-------+------------+------+---------------+-------+---------+-------+------+----------+-------------+
|  1 | SIMPLE      | t2    | NULL       | ref  | i_001         | i_001 | 33      | const |    1 |   100.00 | Using where |
+----+-------------+-------+------------+------+---------------+-------+---------+-------+------+----------+-------------+
1 row in set, 1 warning (0.00 sec)
mysql> 
mysql> explain select * from t2 where str2 = 'wxywxy%';
+----+-------------+-------+------------+------+---------------+-------+---------+-------+------+----------+-------------+
| id | select_type | table | partitions | type | possible_keys | key   | key_len | ref   | rows | filtered | Extra       |
+----+-------------+-------+------------+------+---------------+-------+---------+-------+------+----------+-------------+
|  1 | SIMPLE      | t2    | NULL       | ref  | i_002         | i_002 | 63      | const |    1 |   100.00 | Using where |
+----+-------------+-------+------------+------+---------------+-------+---------+-------+------+----------+-------------+
1 row in set, 1 warning (0.00 sec)
mysql> explain select * from t2 where str2 = 'wxywxywxywxywxy%';
+----+-------------+-------+------------+------+---------------+-------+---------+-------+------+----------+-------------+
| id | select_type | table | partitions | type | possible_keys | key   | key_len | ref   | rows | filtered | Extra       |
+----+-------------+-------+------------+------+---------------+-------+---------+-------+------+----------+-------------+
|  1 | SIMPLE      | t2    | NULL       | ref  | i_002         | i_002 | 63      | const |    1 |   100.00 | Using where |
+----+-------------+-------+------------+------+---------------+-------+---------+-------+------+----------+-------------+
1 row in set, 1 warning (0.00 sec)
mysql> 
mysql> 
mysql> explain select * from t2 where str3 = 'dxxdxx%';
+----+-------------+-------+------------+------+---------------+-------+---------+-------+------+----------+-------------+
| id | select_type | table | partitions | type | possible_keys | key   | key_len | ref   | rows | filtered | Extra       |
+----+-------------+-------+------------+------+---------------+-------+---------+-------+------+----------+-------------+
|  1 | SIMPLE      | t2    | NULL       | ref  | i_003         | i_003 | 33      | const |    1 |   100.00 | Using where |
+----+-------------+-------+------------+------+---------------+-------+---------+-------+------+----------+-------------+
1 row in set, 1 warning (0.00 sec)
mysql> explain select * from t2 where str3 = 'dxxdxxdxxdxxdxx%';
+----+-------------+-------+------------+------+---------------+-------+---------+-------+------+----------+-------------+
| id | select_type | table | partitions | type | possible_keys | key   | key_len | ref   | rows | filtered | Extra       |
+----+-------------+-------+------------+------+---------------+-------+---------+-------+------+----------+-------------+
|  1 | SIMPLE      | t2    | NULL       | ref  | i_003         | i_003 | 33      | const |    1 |   100.00 | Using where |
+----+-------------+-------+------------+------+---------------+-------+---------+-------+------+----------+-------------+
1 row in set, 1 warning (0.00 sec)
```

**总结**

**1、** 直接创建完成索引，但是会比较占空间；

**2、** 创建前缀索引，节省空间，但是会增加查询扫描的时间，并且不能使用覆盖索引；

**3、** 倒叙存储，再创建前缀索引，用于绕过字符串本身前缀的区分度不高的情况；

**4、** 创建hash索引，有额外的计算开销，只支持等值查询；

### 2.3 多列索引

多列索引也叫组合索引，组合索引可以这样理解，比如（a,b,c），abc都是排好序的，在任意一段a的下面b都是排好序的，任何一段b下面c都是排好序的；

组合索引的生效原则是 从前往后依次使用生效，如果中间某个索引没有使用，那么断点前面的索引部分起作用，断点后面的索引没有起作用；

```java
where a=3 and b=45 and c=5 .... 这种三个索引顺序使用中间没有断点，全部发挥作用；
where a=3 and c=5... 这种情况下b就是断点，a发挥了效果，c没有效果
where b=3 and c=4... 这种情况下a就是断点，在a后面的索引都没有发挥作用，这种写法联合索引没有发挥任何效果；
where b=45 and a=3 and c=5 .... 这个跟第一个一样，全部发挥作用，abc只要用上了就行，跟写的顺序无关
```

### 2.4 选择合适的索引列顺序

在一个多列B-Tree索引中，索引列的顺序意味着索引首先按照最左列进行排序，其次是第二列，等等。所以，索引可以按照升序或者降序进行扫描，以满足精确符合列顺序的ORDER BY、GROUP BY和DISTINCT等子句的查询需求。

对于如何选择索引的列顺序有一个经验法则：将选择性最高的列放到索引最前列。这个建议有用吗?在某些场景可能有帮助，但通常不如避免随机IO和排序那么重要，考虑问题需要更全面（场景不同则选择不同，没有一个放之四海皆准的法则。这里只是说明，这个经验法则可能没有你想象的重要）。

当不需要考虑排序和分组时，将选择性最高的列放在前面通常是很好的。这时候索引的作用只是用于优化WHERE条件的查找。在这种情况下，这样设计的索引确实能够最快地过滤出需要的行，对于在WHERE子句中只使用了索引部分前缀列的查询来说选择性也更高。然而，性能不只是依赖于所有索引列的选择性（整体基数），也和查询条件的具体值有关，也就是和值的分布有关。这和前面介绍的选择前缀的长度需要考虑的地方一样。可能需要根据那些运行频率最高的查询来调整索引列的顺序，让这种情况下索引的选择性最高。

```java
mysql> SELECT COUNT(DISTINCT staff_id)/COUNT(*) AS staff_id_selectivity,
> COUNT(DISTINCT customer_id)/COUNT(*) AS customer_id_selectivity,
> COUNT(*)
> FROM payment\G
*************************** 1. row ***************************
staff_id_selectivity: 0.0001
customer_id_selectivity: 0.0373
COUNT(*): 16049
```

customer_id的选择性更高，所以答案是将其作为索引列的第一列：

```java
mysql> ALTER TABLE payment ADD KEY(customer_id, staff_id);
```

### 2.5 聚簇索引

聚簇索引并不是一种单独的索引类型，而是一种数据存储方式。。具体的细节依赖于其实现方式，但InnoDB的聚簇索引实际上在同一个结构中保存了B-Tree索引和数据行。当表有聚簇索引时，它的数据行实际上存放在索引的叶子页（leaf page）中。术语“聚簇”表示数据行和相邻的键值紧凑地存储在一起。因为无法同时把数据行存放在两个不同的地方，所以一个表只能有一个聚簇索引.

聚簇索引中的记录是如何存放：

InnoDB将通过主键聚集数据，这也就是说上图的“被索引的列”就是主键列。

如果没有定义主键，InnoDB会选择一个唯一的非空索引代替。如果没有这样的索引，InnoDB会隐式定义一个主键来作为聚簇索引。InnoDB只聚集在同一个页面中的记录。包含相邻键值的页面可能会相距甚远。

聚簇主键可能对性能有帮助，但也可能导致严重的性能问题。所以需要仔细地考虑聚簇索引，尤其是将表的存储引擎从InnoDB改成其他引擎的时候（反过来也一样）。

聚集的数据有一些重要的优点：

**1、** 可以把相关数据保存在一起例如实现电子邮箱时，可以根据用户ID来聚集数据，这样只需要从磁盘读取少数的数据页就能获取某个用户的全部邮件如果没有使用聚簇索引，则每封邮件都可能导致一次磁盘I/O；

**2、** 数据访问更快聚簇索引将索引和数据保存在同一个B-Tree中，因此从聚簇索引中获取数据通常比在非聚簇索引中查找要快；

**3、** 使用覆盖索引扫描的查询可以直接使用页节点中的主键值；

如果在设计表和查询时能充分利用上面的优点，那就能极大地提升性能。同时，聚簇索引也有一些缺点：

**1、** 聚簇数据最大限度地提高了I/O密集型应用的性能，但如果数据全部都放在内存中，则访问的顺序就没那么重要了，聚簇索引也就没什么优势了；

**2、** 插入速度严重依赖于插入顺序按照主键的顺序插入是加载数据到InnoDB表中速度最快的方式但如果不是按照主键顺序加载数据，那么在加载完成后最好使用OPTIMIZETABLE命令重新组织一下表；

**3、** 更新聚簇索引列的代价很高，因为会强制InnoDB将每个被更新的行移动到新的位置；

**4、** 基于聚簇索引的表在插入新行，或者主键被更新导致需要移动行的时候，可能面临“页分裂（pagesplit）”的问题当行的主键值要求必须将这一行插入到某个已满的页中时，存储引擎会将该页分裂成两个页面来容纳该行，这就是一次页分裂操作页分裂会导致表占用更多的磁盘空间；

**5、** 聚簇索引可能导致全表扫描变慢，尤其是行比较稀疏，或者由于页分裂导致数据存储不连续的时候；

**6、** 二级索引（非聚簇索引）可能比想象的要更大，因为在二级索引的叶子节点包含了引用行的主键列；

**7、** 二级索引访问需要两次索引查找，而不是一次；

最后一点可能让人有些疑惑，为什么二级索引需要两次索引查找？答案在于二级索引中保存的“行指针”的实质。要记住，二级索引叶子节点保存的不是指向行的物理位置的指针，而是行的主键值。

这意味着通过二级索引查找行，存储引擎需要找到二级索引的叶子节点获得对应的主键值，然后根据这个值去聚簇索引中查找到对应的行。这里做了重复的工作：两次B-Tree查找而不是一次。对于InnoDB，自适应哈希索引能够减少这样的重复工作。

### 2.6 覆盖索引

通常大家都会根据查询的WHERE条件来创建合适的索引，不过这只是索引优化的一个方面。设计优秀的索引应该考虑到整个查询，而不单单是WHERE条件部分。索引确实是一种查找数据的高效方式，但是MySQL也可以使用索引来直接获取列的数据，这样就不再需要读取数据行。如果索引的叶子节点中已经包含要查询的数据，那么还有什么必要再回表查询呢?如果一个索引包含（或者说覆盖）所有需要查询的字段的值，我们就称之为“覆盖索引”。

覆盖索引是非常有用的工具，能够极大地提高性能。考虑一下如果查询只需要扫描索引而无须回表，会带来多少好处：

**1、** 索引条目通常远小于数据行大小，所以如果只需要读取索引，那MySQL就会极大地减少数据访问量这对缓存的负载非常重要，因为这种情况下响应时间大部分花费在数据拷贝上覆盖索引对于I/O密集型的应用也有帮助，因为索引比数据更小，更容易全部放入内存中（这对于MyISAM尤其正确，因为MyISAM能压缩索引以变得更小）；

**2、** 因为索引是按照列值顺序存储的（至少在单个页内是如此），所以对于I/O密集型的范围查询会比随机从磁盘读取每一行数据的I/O要少得多对于某些存储引擎，例如MyISAM和PerconaXtraDB，甚至可以通过OPTIMIZE命令使得索引完全顺序排列，这让简单的范围查询能使用完全顺序的索引访问；

**3、** 一些存储引擎如MyISAM在内存中只缓存索引，数据则依赖于操作系统来缓存，因此要访问数据需要一次系统调用这可能会导致严重的性能问题，尤其是那些系统调用占了数据访问中的最大开销的场景；

**4、** 由于InnoDB的聚簇索引，覆盖索引对InnoDB表特别有用InnoDB的二级索引在叶子节点中保存了行的主键值，所以如果二级主键能够覆盖查询，则可以避免对主键索引的二次查询；

在所有这些场景中，在索引中满足查询的成本一般比查询行要小得多。

MySQL只能使用BTree索引做覆盖索引。

表sakila.inventory有一个多列索引（store_id，flm_id）。MySQL如果只需访问这两列，就可以使用这个索引做覆盖索引，如下所示：

```java
mysql> EXPLAIN SELECT store_id, film_id FROM sakila.inventory\G
*************************** 1. row ***************************
id: 1
select_type: SIMPLE
table: inventory
type: index
possible_keys: NULL
key: idx_store_id_film_id
key_len: 3
ref: NULL
rows: 4673
Extra: Using index
```

### 2.7 使用索引扫描来做排序

MySQL有两种方式可以生成有序的结果：通过排序操作；或者按索引顺序扫描；如果EXPLAIN出来的type列的值为“index”，则说明MySQL使用了索引扫描来做排序（不要和Extra列的“Using index”搞混淆了）。

扫描索引本身是很快的，因为只需要从一条索引记录移动到紧接着的下一条记录。但如果索引不能覆盖查询所需的全部列，那就不得不每扫描一条索引记录就都回表查询一次对应的行。这基本上都是随机I/O，因此按索引顺序读取数据的速度通常要比顺序地全表扫描慢，尤其是在I/O密集型的工作负载时。

MySQL可以使用同一个索引既满足排序，又用于查找行。因此，如果可能，设计索引时应该尽可能地同时满足这两种任务，这样是最好的。

只有当索引的列顺序和ORDER BY子句的顺序完全一致，并且所有列的排序方向（倒序或正序）都一样时，MySQL才能够使用索引来对结果做排序。如果查询需要关联多张表，则只有当ORDER BY子句引用的字段全部为第一个表时，才能使用索引做排序。ORDER BY子句和查找型查询的限制是一样的：需要满足索引的最左前缀的要求；否则，MySQL都需要执行排序操作，而无法利用索引排序。

### 2.8 压缩（前缀压缩）索引

MyISAM使用前缀压缩来减少索引的大小，从而让更多的索引可以放入内存中，这在某些情况下能极大地提高性能。默认只压缩字符串，但通过参数设置也可以对整数做压缩。MyISAM压缩每个索引块的方法是，先完全保存索引块中的第一个值，然后将其他值和第一个值进行比较得到相同前缀的字节数和剩余的不同后缀部分，把这部分存储起来即可。例如，索引块中的第一个是“perform”，第二个值是“performance”，那么第二个值的前缀压缩后存储的是类似“7,ance”这样的形式。MyISAM对行指针也采用类似的前缀压缩方式。

压缩块使用更少的空间，代价是某些操作可能更慢。因为每个值的压缩前缀都依赖前面的值，所以MyISAM查找时无法在索引块使用二分查找而只能从头开始扫描。正序的扫描速度还不错，但是如果是倒序扫描——例如ORDER BY DESC——就不是很好了。所有在块中查找某一行的操作平均都需要扫描半个索引块。

测试表明，对于CPU密集型应用，因为扫描需要随机查找，压缩索引使得MyISAM在索引查找上要慢好几倍。压缩索引的倒序扫描就更慢了。压缩索引需要在CPU内存资源与磁盘之间做权衡。压缩索引可能只需要十分之一大小的磁盘空间，如果是I/O密集型应用，对某些查询带来的好处会比成本多很多。

可以在CREATE TABLE语句中指定PACK_KEYS参数来控制索引压缩的方式。

### 2.9 冗余和重复索引

MySQL允许在相同列上创建多个索引，无论是有意的还是无意的。MySQL需要单独维护重复的索引，并且优化器在优化查询的时候也需要逐个地进行考虑，这会影响性能。

重复索引是指在相同的列上按照相同的顺序创建的相同类型的索引。应该避免这样创建重复索引，发现以后也应该立即移除。

```java
CREATE TABLE test (
ID INT NOT NULL PRIMARY KEY,
A INT NOT NULL,
B INT NOT NULL,
UNIQUE(ID),
INDEX(ID)
) ENGINE=InnoDB;
```

一个经验不足的用户可能是想创建一个主键，先加上唯一限制，然后再加上索引以供查询使用。事实上，MySQL的唯一限制和主键限制都是通过索引实现的，因此，上面的写法实际上在相同的列上创建了三个重复的索引。通常并没有理由这样做，除非是在同一列上创建不同类型的索引来满足不同的查询需求。

冗余索引和重复索引有一些不同。如果创建了索引（A，B），再创建索引（A）就是冗余索引，因为这只是前一个索引的前缀索引。因此索引（A，B）也可以当作索引（A）来使用（这种冗余只是对B-Tree索引来说的）。但是如果再创建索引（B，A），则不是冗余索引，索引（B）也不是，因为B不是索引（A，B）的最左前缀列。另外，其他不同类型的索引（例如哈希索引或者全文索引）也不会是B-Tree索引的冗余索引，而无论覆盖的索引列是什么。

冗余索引通常发生在为表添加新索引的时候。例如，有人可能会增加一个新的索引（A，B）而不是扩展已有的索引（A）。还有一种情况是将一个索引扩展为（A，ID），其中ID是主键，对于InnoDB来说主键列已经包含在二级索引中了，所以这也是冗余的。

大多数情况下都不需要冗余索引，应该尽量扩展已有的索引而不是创建新索引。但也有时候出于性能方面的考虑需要冗余索引，因为扩展已有的索引会导致其变得太大，从而影响其他使用该索引的查询的性能。

### 2.10 未使用的索引

除了冗余索引和重复索引，可能还会有一些服务器永远不用的索引。这样的索引完全是累赘，建议考虑删除。有两个工具可以帮助定位未使用的索引。最简单有效的办法是在Percona Server或者MariaDB中先打开userstates服务器变量（默认是关闭的），然后让服务器正常运行一段时间，再通过查询INFORMATION_SCHEMA.INDEX_STATISTICS就能查到每个索引的使用频率。

另外，还可以使用Percona Toolkit中的pt-index-usage，该工具可以读取查询日志，并对日志中的每条查询进行EXPLAIN操作，然后打印出关于索引和查询的报告。这个工具不仅可以找出哪些索引是未使用的，还可以了解查询的执行计划——例如在某些情况有些类似的查询的执行方式不一样，这可以帮助你定位到那些偶尔服务质量差的查询，优化它们以得到一致的性能表现。该工具也可以将结果写入到MySQL的表中，方便查询结果。

### 2.11 索引和锁

索引可以让查询锁定更少的行。如果你的查询从不访问那些不需要的行，那么就会锁定更少的行，从两个方面来看这对性能都有好处。首先，虽然InnoDB的行锁效率很高，内存使用也很少，但是锁定行的时候仍然会带来额外开销；其次，锁定超过需要的行会增加锁争用并减少并发性。

InnoDB只有在访问行的时候才会对其加锁，而索引能够减少InnoDB访问的行数，从而减少锁的数量。但这只有当InnoDB在存储引擎层能够过滤掉所有不需要的行时才有效。如果索引无法过滤掉无效的行，那么在InnoDB检索到数据并返回给服务器层以后，MySQL服务器才能应用WHERE子句。这时已经无法避免锁定行了：InnoDB已经锁住了这些行，到适当的时候才释放。在MySQL 5.1和更新的版本中，InnoDB可以在服务器端过滤掉行后就释放锁，但是在早期的MySQL版本中，InnoDB只有在事务提交后才能释放锁。

关于InnoDB、索引和锁有一些很少有人知道的细节：InnoDB在二级索引上使用共享（读）锁，但访问主键索引需要排他（写）锁。这消除了使用覆盖索引的可能性，并且使得SELECT FOR UPDATE比LOCK IN SHARE MODE或非锁定查询要慢很多。

### 2.12 索引下推

索引下推（index condition pushdown ）简称ICP，在Mysql5.6的版本上推出，用于优化查询。

在不使用ICP的情况下，在使用非主键索引（又叫普通索引或者二级索引）进行查询时，存储引擎通过索引检索到数据，然后返回给MySQL服务器，服务器然后判断数据是否符合条件 。

在使用ICP的情况下，如果存在某些被索引的列的判断条件时，MySQL服务器将这一部分判断条件传递给存储引擎，然后由存储引擎通过判断索引是否符合MySQL服务器传递的条件，只有当索引符合条件时才会将数据检索出来返回给MySQL服务器 。

索引条件下推优化可以减少存储引擎查询基础表的次数，也可以减少MySQL服务器从存储引擎接收数据的次数。

**测试开始:**

在开始之前先先准备一张用户表(user)，其中主要几个字段有：id、name、age、address。建立联合索引（name，age）。

假设有一个需求，要求匹配姓名第一个为陈的所有用户，sql语句如下：

```java
SELECT * from user where  name like '陈%'
```

根据“最佳左前缀” 的原则，这里使用了联合索引（name，age）进行了查询，性能要比全表扫描肯定要高。

问题来了，如果有其他的条件呢？假设又有一个需求，要求匹配姓名第一个字为陈，年龄为20岁的用户，此时的sql语句如下：

```java
SELECT * from user where  name like '陈%' and age=20
```

这条sql语句应该如何执行呢？下面对Mysql5.6之前版本和之后版本进行分析。

**Mysql5.6之前的版本：**

**1、** 5.6之前的版本是没有索引下推这个优化的，因此执行的过程如下图：；

**2、** 会忽略age这个字段，直接通过name进行查询，在(name,age)这课树上查找到了两个结果，id分别为2,1，然后拿着取到的id值一次次的回表查询，因此这个过程需要回表两次；

**Mysql5.6及之后版本：**

**1、** 5.6版本添加了索引下推这个优化，执行的过程如下图：；

InnoDB并没有忽略age这个字段，而是在索引内部就判断了age是否等于20，对于不等于20的记录直接跳过，因此在(name,age)这棵索引树中只匹配到了一个记录，此时拿着这个id去主键索引树中回表查询全部数据，这个过程只需要回表一次。

**实践**

**1、** 当然上述的分析只是原理上的，我们可以实战分析一下，因此陈某装了Mysql5.6版本的Mysql，解析了上述的语句，如下图：；

**2、** 根据explain解析结果可以看出Extra的值为Usingindexcondition，表示已经使用了索引下推；

### 2.13 不可见索引

MySQL支持不可见索引;也就是说，优化器不使用的索引。该特性适用于主键以外的索引(显式或隐式)。

大表的索引的维护是非常耗时的，如果我们想判断一个索引对查询的影响，而又不想删除索引，因为重建耗时太久，此时，我们可以将索引设置为不可见，这样优化器就用不到索引了。

```java
CREATE TABLE t1 (
  i INT,
  j INT,
  k INT,
  INDEX i_idx (i) INVISIBLE
) ENGINE = InnoDB;
CREATE INDEX j_idx ON t1 (j) INVISIBLE;
ALTER TABLE t1 ADD INDEX k_idx (k) INVISIBLE;
```

要改变现有索引的可见性，请在alter TABLE…ALTER INDEX操作:

```java
ALTER TABLE t1 ALTER INDEX i_idx INVISIBLE;
ALTER TABLE t1 ALTER INDEX i_idx VISIBLE;
```

关于索引是可见还是不可见的信息可以从INFORMATION_SCHEMA中获得。统计表或SHOW索引输出。例如:

```java
mysql> SELECT INDEX_NAME, IS_VISIBLE
       FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = 'db1' AND TABLE_NAME = 't1';
+------------+------------+
| INDEX_NAME | IS_VISIBLE |
+------------+------------+
| i_idx      | YES        |
| j_idx      | NO         |
| k_idx      | NO         |
+------------+------------+
```

不可见的索引使测试删除索引对查询性能的影响成为可能，而不需要进行破坏性的更改(如果需要索引就必须撤消)。对于大型表来说，删除和重新添加索引的开销可能很大，而让它不可见和可见是快速的原位操作。

如果优化器确实需要或使用不可见的索引，有几种方法可以注意到它的缺失对查询表的影响:

**1、** 对于包含引用不可见索引的索引提示的查询，将发生错误；

**2、** 性能模式数据显示受影响查询的工作负载增加；

**3、** 查询有不同的EXPLAIN执行计划；

**4、** 查询出现在之前没有出现的慢查询日志中；

**5、** 索引在默认情况下是可见的要显式地控制新索引的可见性，可以在CREATETABLE、CREATEindex或ALTERTABLE的索引定义中使用VISIBLE或INVISIBLE关键字:；

optimizer_switch系统变量的use_invisible_indexes标志控制优化器是否使用不可见的索引来构建查询执行计划。如果该标志是关闭的(默认值)，优化器将忽略不可见的索引(与引入该标志之前的行为相同)。如果标志是打开的，不可见的索引仍然是不可见的，但是优化器会在构建执行计划时考虑它们。

使用SET_VAR优化器提示临时更新optimizer_switch的值，你可以只在单个查询期间启用不可见索引，如下所示:

```java
mysql> EXPLAIN SELECT /*+ SET_VAR(optimizer_switch = 'use_invisible_indexes=on') */
     >     i, j FROM t1 WHERE j >= 50\G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: t1
   partitions: NULL
         type: range
possible_keys: j_idx
          key: j_idx
      key_len: 5
          ref: NULL
         rows: 2
     filtered: 100.00
        Extra: Using index condition
mysql> EXPLAIN SELECT i, j FROM t1 WHERE j >= 50\G
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
         rows: 5
     filtered: 33.33
        Extra: Using where
```

索引可见性不影响索引维护。例如，每次对表行进行更改，索引就会继续更新，而惟一索引会防止向列中插入重复项，无论索引是可见的还是不可见的。

如果一个没有显式主键的表在NOT NULL列上有任何UNIQUE索引，那么它仍然可能有一个有效的隐式主键。在这种情况下，第一个这样的索引将相同的约束作为显式主键放在表行上，并且不能使索引不可见。考虑下表定义:

```java
CREATE TABLE t2 (
  i INT NOT NULL,
  j INT NOT NULL,
  UNIQUE j_idx (j)
) ENGINE = InnoDB;
```

该定义不包含显式的主键，但是NOT NULL列j上的索引将主键设置为相同的约束，并且不能使其不可见:

```java
mysql> ALTER TABLE t2 ALTER INDEX j_idx INVISIBLE;
ERROR 3522 (HY000): A primary key index cannot be invisible.
```

现在假设一个显式的主键被添加到表中:

```java
ALTER TABLE t2 ADD PRIMARY KEY (i);
```

显式主键不能变为不可见。此外，j上的唯一索引不再充当隐含的主键，因此可以使其不可见:

```java
mysql> ALTER TABLE t2 ALTER INDEX j_idx INVISIBLE;
Query OK, 0 rows affected (0.03 sec)
```

### 2.14 降序索引

MySQL支持降序索引:索引定义中的DESC不再被忽略，而是导致按降序存储键值。以前，可以以相反的顺序扫描索引，但会造成性能损失。降序索引可以按正向顺序扫描，这样效率更高。降序索引还可以让优化器使用多列索引，当最有效的扫描顺序混合了一些列的升序和其他列的降序。

考虑下面的表定义，它包含两个列和四个两列索引定义，用于列上的升序和降序索引的各种组合:

```java
CREATE TABLE t (
  c1 INT, c2 INT,
  INDEX idx1 (c1 ASC, c2 ASC),
  INDEX idx2 (c1 ASC, c2 DESC),
  INDEX idx3 (c1 DESC, c2 ASC),
  INDEX idx4 (c1 DESC, c2 DESC)
);
```

表定义产生四个不同的索引。优化器可以对每个ORDER BY子句执行正向索引扫描，不需要使用filesort操作:

```java
ORDER BY c1 ASC, c2 ASC    -- optimizer can use idx1
ORDER BY c1 DESC, c2 DESC  -- optimizer can use idx4
ORDER BY c1 ASC, c2 DESC   -- optimizer can use idx2
ORDER BY c1 DESC, c2 ASC   -- optimizer can use idx3
```

降序索引的使用要符合以下条件:

**1、** 降序索引只支持InnoDB存储引擎，有以下限制:；

**1、** 1如果次要索引包含降序索引键列，或者主键包含降序索引列，则不支持更改缓冲；

**1、** 2InnoDBSQL解析器不使用降序索引对于InnoDB全文搜索，这意味着索引表的FTS_DOC_ID列上的索引不能定义为降序索引要了解更多信息，请参见15.6.2.4节“InnoDB全文索引”；

**2、** 所有可用升序索引的数据类型都支持降序索引；

**3、** 普通(非生成的)列和生成的列(VIRTUAL和STORED)都支持降序索引；

**4、** DISTINCT可以使用任何包含匹配列的索引，包括降序键部分；

**5、** 具有降序关键部分的索引不用于调用聚合函数但没有GROUPBY子句的查询的MIN()/MAX()优化；

**6、** BTREE支持降序索引，但不支持HASH索引FULLTEXT或SPATIAL索引不支持降序索引；

**7、** 为HASH、FULLTEXT和SPATIAL索引显式指定ASC和DESC指示符会导致错误；

你可以在EXPLAIN输出的Extra列中看到优化器可以使用降序索引，如下所示:

```java
mysql> CREATE TABLE t1 (
    -> a INT, 
    -> b INT, 
    -> INDEX a_desc_b_asc (a DESC, b ASC)
    -> );
mysql> EXPLAIN SELECT * FROM t1 ORDER BY a ASC\G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: t1
   partitions: NULL
         type: index
possible_keys: NULL
          key: a_desc_b_asc
      key_len: 10
          ref: NULL
         rows: 1
     filtered: 100.00
        Extra: Backward index scan; Using index
```

在EXPLAIN FORMAT=TREE输出中，降序索引的使用是通过在索引名后面加(反向)来表示的，如下所示:

```java
mysql> EXPLAIN FORMAT=TREE SELECT * FROM t1 ORDER BY a ASC\G 
*************************** 1. row ***************************
EXPLAIN: -> Index scan on t1 using a_desc_b_asc (reverse)  (cost=0.35 rows=1)
```

## 三.减少索引和数据的碎片

B-Tree索引可能会碎片化，这会降低查询的效率。碎片化的索引可能会以很差或者无序的方式存储在磁盘上。

根据设计，B-Tree需要随机磁盘访问才能定位到叶子页，所以随机访问是不可避免的。然而，如果叶子页在物理分布上是顺序且紧密的，那么查询的性能就会更好。否则，对于范围查询、索引覆盖扫描等操作来说，速度可能会降低很多倍；对于索引覆盖扫描这一点更加明显。

表的数据存储也可能碎片化。然而，数据存储的碎片化比索引更加复杂。有三种类型的数据碎片。

**1、** 行碎片（Rowfragmentation）；

这种碎片指的是数据行被存储为多个地方的多个片段中。即使查询只从索引中访问一行记录，行碎片也会导致性能下降。
**2、** 行间碎片（Intra-rowfragmentation）；

行间碎片是指逻辑上顺序的页，或者行在磁盘上不是顺序存储的。行间碎片对诸如全表扫描和聚簇索引扫描之类的操作有很大的影响，因为这些操作原本能够从磁盘上顺序存储的数据中获益。
**3、** 剩余空间碎片（Freespacefragmentation）；

剩余空间碎片是指数据页中有大量的空余空间。这会导致服务器读取大量不需要的数据，从而造成浪费。

InnoDB不会出现短小的行碎片，InnoDB会移动短小的行并重写到一个片段中。

那么如何整理表的碎片呢?

一般有optimize table tabname 和 alter table tabname engine=InnoDB 这两个命令。

对于InnoDB存储引擎，optimize命令会报如下信息:

```java
mysql> optimize table fact_sale;
+----------------+----------+----------+-------------------------------------------------------------------+
| Table          | Op       | Msg_type | Msg_text                                                          |
+----------------+----------+----------+-------------------------------------------------------------------+
| test.fact_sale | optimize | note     | Table does not support optimize, doing recreate + analyze instead |
| test.fact_sale | optimize | status   | OK                                                                |
+----------------+----------+----------+-------------------------------------------------------------------+
2 rows in set (17 min 24.96 sec)
```

所以一般使用 alter table tabname engine=InnoDB这个命令

```java
mysql> select count(*) from fact_sale_skew;
+----------+
| count(*) |
+----------+
| 99999000 |
+----------+
1 row in set (29.66 sec)
mysql> show table status from test like 'fact_sale_skew'\G
*************************** 1. row ***************************
           Name: fact_sale_skew
         Engine: InnoDB
        Version: 10
     Row_format: Dynamic
           Rows: 94816780
 Avg_row_length: 44
    Data_length: 4262461440
Max_data_length: 0
   Index_length: 0
      Data_free: 7340032
 Auto_increment: 99999001
    Create_time: 2021-01-22 17:34:23
    Update_time: NULL
     Check_time: NULL
      Collation: utf8_general_ci
       Checksum: NULL
 Create_options: 
        Comment: 
1 row in set (0.00 sec)
mysql> 
mysql> alter table fact_sale_skew engine=innodb;
Query OK, 0 rows affected (2 min 42.15 sec)
Records: 0  Duplicates: 0  Warnings: 0
mysql> show table status from test like 'fact_sale_skew'\G
*************************** 1. row ***************************
           Name: fact_sale_skew
         Engine: InnoDB
        Version: 10
     Row_format: Dynamic
           Rows: 99726030
 Avg_row_length: 51
    Data_length: 5123325952
Max_data_length: 0
   Index_length: 0
      Data_free: 3145728
 Auto_increment: 99999001
    Create_time: 2021-06-01 15:26:14
    Update_time: NULL
     Check_time: NULL
      Collation: utf8_general_ci
       Checksum: NULL
 Create_options: 
        Comment: 
1 row in set (0.04 sec)
mysql> 
```

Data_free显示的是表占的存储空间，可以看到存储空间由 7340032 缩减到 3145728，大大的减少了。

## 四.索引案例学习

### 4.1 支持多种过滤条件

有一个表，我们创建了一个组合索引 （sex，country），sex只有两个值 ‘f’和‘m’，country虽然唯一值不多，但是经常出现在where语句后面，所以这个地方创建了这样的一个 （sex，country）。

```java
select * from tabname where country = 'China';
```

如上的sql，因为不满足组合索引的左前原则，所以是用不到组合索引的。

```java
select * from tabname where sex in ('f','m') where country = 'China';
```

将第一个sql改为第二个sql就可以使用到索引了，虽然 sex in (‘f’,‘m’) 没有过滤任何数据行，但是却可以优化这个sql，让sql用到索引。

### 4.2 优化排序

有这么一个sql,既有order by也有limit，如果表数据量大，且没办法使用到索引的情况下，这个查询会比较慢。

```java
SELECT<cols> FROM profiles WHERE sex='M' ORDER BY rating LIMIT 10;
```

那么如何使这个查询用上索引呢？ sex这一列区分度不高，即便使用了也对这个查询帮助不大。

此时可以使用到我们的组合索引（sex,rating），索引本身是有序的，所以可以快速定位到10行数据。
