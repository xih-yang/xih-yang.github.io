# 17、MySQL 教程 - MySQL 查询优化：连接查询优化
- 来源：https://ddkk.com/zhuanlan/db/mysql/6/17.html
- 分类：缓存数据库
- 分组：教程目录
### 1. 连接查询的本质

数据准备：

```java
create table t1(
	m1 int,
	n1 char(1)
);
create table t2(
	m2 int,
	n2 char(1)
);
insert into t1 values(1,'a'),(2,'b'),(3,'c');
insert into t2 values(2,'b'),(3,'c'),(4,'d');
```

```java
mysql> select * from t1,t2;
+------+------+------+------+
| m1   | n1   | m2   | n2   |
+------+------+------+------+
|    3 | c    |    2 | b    |
|    2 | b    |    2 | b    |
|    1 | a    |    2 | b    |
|    3 | c    |    3 | c    |
|    2 | b    |    3 | c    |
|    1 | a    |    3 | c    |
|    3 | c    |    4 | d    |
|    2 | b    |    4 | d    |
|    1 | a    |    4 | d    |
+------+------+------+------+
```

如果连接查询的结果集中包含一个表中的每一条记录和另一表中的每一条记录相互匹配的组合，那么这样的结果集称为笛卡尔积。如果不过滤任何条件，这些表连接起来产生的笛卡尔积可能是非常巨大的，所以连接时过滤掉特定的记录组合是有必要的。

```java
select * from t1,t2 where t1.m1>1 and t1.m1=t2.m2 and t2.n2<'d';
```

步骤1：首先确定第一要要查询的表，这个表称为驱动表：

假设使用t1表作为驱动表，那么就需要查找满足t1.m1>1的记录

```java
mysql> select * from t1 where t1.m1>1;
+------+------+
| m1   | n1   |
+------+------+
|    2 | b    |
|    3 | c    |
+------+------+
```

步骤2：步骤1中从驱动表每获取到一条记录，都需要到t2表中查找匹配的记录：

因为是根据t1表中的记录去查找t2表中的记录，所以t2表被称为被驱动表。步骤1从驱动表中得到了2条记录，也就意味着需要查询2次t2表。

`t1.m1=2`时，到t2表中根据`t2.m2=2，t2.n2ref>ref_or_null>range>index>all`

extra中出现了using index condition，using where，using join buffer

`using index condition`:

搜索条件出现了索引列n2，但是不能充当边界条件来形成扫描区间，也就是不能减少需要扫描的记录数量。

`using where` :

因为回表后将所有的记录返回给server层需要再判断m2列的条件是否成立，所以出现了using where。

`using join buffer` ：

在连接查询的执行过程中，当被驱动表不能有效李立勇索引加快访问速度时，MySQL一般会为其分配一块连接缓冲区join buffer的内存快来加快连接查询速度。

`join buffer`：

如果被驱动表中的数据特别多而且不能使用索引进行访问，那就相当于要从磁盘上读这个表好多次，这个IO的代价就非常大了，驱动表的结果集中有多少条记录就有可能吧被驱动表从磁盘加载到内存中多少次，所以为了尽量减少被驱动表的访问次数，可以直接把被驱动表中的记录加载到内存中，一次性的与驱动表中的多条记录进行匹配，这样就可以大大的减少重复从磁盘上加载被驱动表的代价了，因此就出现了join buffer的概念。

join buffer是在执行连接查询前申请的一块固定大小的内存，先把若干条驱动表结果集中的记录装在这个join buffer中，然后开始执行扫描被驱动表，每一条被驱动表的记录一次性的与join buffer中的多条驱动表记录进行匹配，由于匹配的过程实在内存中完成的，所以这样可以显著减少被驱动表的IO代价。

### 4. 关联查询的优化

数据准备：

```java
create table book(
	bookid int(10) unsinged not null auto_increment,
	card int(10) unsinged not null,
	primary key(bookid)
);
create table type(
	id int(10) unsinged not null auto_increment,
	card int(10) unsinged not null,
	primary key(id)
);
// 执行20次插入
insert into book(card) values(1+(rand()*20));
// 执行20次插入
insert into type(card) values(1+(rand()*20));
```

## 4.1 外连接优化

对于左外连接，左侧的表为驱动表；对于右外连接，选取右侧的表为驱动表。

**1、两个表都没有索引：**

```java
explain select sql_no_cache * from type left join book on type.card=book.card;
```

**2、给被驱动表建立索引：**

```java
create index idx_book on book(card);
explain select sql_no_cache * from type left join book on type.card=book.card;
```

**3、给驱动表也建立索引：**

```java
create index idx_type on type(card);
explain select sql_no_cache * from type left join book on type.card=book.card;
```

连接查询时主要是为了降低被驱动表的查询成本，因此需要尽量在被驱动表的连接列上建立索引，这样就可以使用ref访问方法来降低被驱动表的访问成本了，如果可以，被驱动表的连接列最好是该表的主键或者唯一二级索引列，这样就可以把访问被驱动表的成本降至更低了。

## 4.2 内连接优化

删除索引：

```java
drop index idx_book on book;
drop index idx_type on type;
explain select sql_no_cache * from type inner join book on type.card=book.card;
```

**1、给book表的card列加索引：**

```java
create index idx_book on book(card);
explain select sql_no_cache * from type inner join book on type.card=book.card;
```

对于内连接来说：如果表的连接条件中，只能有一个字段有索引，那么查询优化器会将有索引的字段所在的表作为被驱动表。

**2、给type表的card列加索引：**

```java
create index idx_type on type(card);
explain select sql_no_cache * from type inner join book on type.card=book.card;
```

对于内连接来说：如果表的连接条件中，两个表的字段都有索引，由查询优化器决定哪个表作为被驱动表，从结果可以看出book表作为被驱动表，ref访问方法。

**3、增加type表中的数据：**

```java
// 之前type和book表中都有20条数据，现在type表中有21条数据
insert into type(card) values(1+(rand()*20));
explain select sql_no_cache * from type inner join book on type.card=book.card;
```

对于内连接来说：在两个表的连接条件都存在索引的情况下，会选择表中数据少的表作为驱动表，即小表作为驱动表，小表驱动大表。此时type表时被驱动表。
