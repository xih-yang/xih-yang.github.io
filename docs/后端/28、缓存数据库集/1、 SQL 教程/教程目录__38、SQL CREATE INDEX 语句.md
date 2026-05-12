# 38、SQL CREATE INDEX 语句
- 来源：https://ddkk.com/zhuanlan/db/sql/38.html
- 分类：缓存数据库
- 分组：教程目录
SQLCREATE INDEX 语句用于在表中创建索引

为什么使用索引：

在不读取整个表的情况下，索引使数据库应用程序可以更快地查找数据

索引有什么副作用：

索引会减慢数据插入和更新的速度

## 索引

创建索引的目的，也是唯一目的，就是加快数据的查询速度

用户无法看到索引，它们只能被用来加速搜索/查询

虽然索引有很多好处，但也是坏处多多

更新一个包含索引的表需要比更新一个没有索引的表花费更多的时间，这是由于索引本身也需要更新

因此，理想的做法是仅仅在常常被搜索的列 ( 以及表 ) 上面创建索引

## 索引分类

索引一般分为几大类： 主键索引、唯一索引、普通索引

**1、** 普通索引允许重复的值，就是两个记录的索引字段的值可以重复；

**2、** 唯一索引不允许重复的值，两个记录的索引字段不允许重复，其实**主键索引**也是一种特殊的唯一索引；

> 组合索引？ 组合索引不属于它们，如果三个索引中包含了两个及以上字段，其实就是组合索引，不如组合主键索引

索引一般分为两大类： 聚集索引 和 非聚集索引

**1、****聚集索引**就是表记录的排列顺序和索引的排列顺序一模一样；

聚集索引，不会有单独的空间存储索引数据，而是在存储数据的时候就已经根据索引排好序

主键索引就属于 **聚合索引**
**2、****非聚集索引**用另外的空间存储了记录的顺序，但是记录本身的物理顺序可以和索引不一样；

**唯一索引** 和 **普通索引** 都是非聚集索引

## SQL 创建索引

**1、** 创建普通索引；

普通索引允许重复值，可以使用下面的 SQL 语句创建

```sql
CREATE INDEX index_name ON table_name (column_name)
```

**2、** 创建唯一索引；

唯一索引不允许重复值，可以使用下面的 SQL 语句创建唯一索引

```sql
CREATE UNIQUE INDEX index_name ON table_name (column_name)
```

> 注意：用于创建索引的语法在不同的数据库中不一样。使用前先检查你的数据库系统是否支持

## 演示数据

先在 **MySQL** 数据库运行下面的语句创建测试数据

```sql
CREATE DATABASE IF NOT EXISTS ddkk default character set utf8mb4 collate utf8mb4_unicode_ci;
USE ddkk;
DROP TABLE IF EXISTS lession_views;
CREATE TABLE lession_views (
    uniq bigint(20) primary key NOT NULL default '0' ,
    lession_name varchar(32) default '',
    lession_id int(11) default '0',
    date_at  int(11) NOT NULL default '0',
    views int(11) NOT NULL default '0'
);
INSERT INTO lession_views(uniq,lession_name,lession_id,date_at,views) VALUES
(20170511000001,'Python DDKK.COM 弟弟快看',1,20170511,320),
(20170511000002,'Scala DDKK.COM 弟弟快看', 2,20170511,22),
(20170511000003,'Ruby DDKK.COM 弟弟快看', 3, 20170511,49),
(20170512000001,'Python DDKK.COM 弟弟快看',1,20170512,220),
(20170512000002,'Scala DDKK.COM 弟弟快看',2,20170512,12),
(20170512000003,'Ruby DDKK.COM 弟弟快看',3,20170512,63),
(20170513000001,'Python DDKK.COM 弟弟快看',1,20170513,441),
(20170513000002,'Scala DDKK.COM 弟弟快看',2,20170513,39),
(20170513000003,'Ruby DDKK.COM 弟弟快看',3,20170513,87);
```

使用SELECT * FROM lession_views; 运行结果如下

```sql
+----------------+---------------------+------------+----------+-------+
| uniq           | lession_name        | lession_id | date_at  | views |
+----------------+---------------------+------------+----------+-------+
| 20170511000001 | Python DDKK.COM 弟弟快看     |          1 | 20170511 |   320 |
| 20170511000002 | Scala DDKK.COM 弟弟快看      |          2 | 20170511 |    22 |
| 20170511000003 | Ruby DDKK.COM 弟弟快看       |          3 | 20170511 |    49 |
| 20170512000001 | Python DDKK.COM 弟弟快看     |          1 | 20170512 |   220 |
| 20170512000002 | Scala DDKK.COM 弟弟快看      |          2 | 20170512 |    12 |
| 20170512000003 | Ruby DDKK.COM 弟弟快看       |          3 | 20170512 |    63 |
| 20170513000001 | Python DDKK.COM 弟弟快看     |          1 | 20170513 |   441 |
| 20170513000002 | Scala DDKK.COM 弟弟快看      |          2 | 20170513 |    39 |
| 20170513000003 | Ruby DDKK.COM 弟弟快看       |          3 | 20170513 |    87 |
+----------------+---------------------+------------+----------+-------+
```

总共有**9** 条记录

因为我们经常要根据 date_at 查询某天全部课程的访问量，所以我们可以在 date_at 上创建普通的索引

```sql
CREATE INDEX idx_lession_views_date_at ON lession_views (date_at);
```

如果想要创建的索引不只一列，也就是想要创建组合索引，那么只需要在 **括号()** 内添加其它列即可，列与列之间使用逗号 (,) 分隔

```sql
CREATE INDEX idx_lession_views_date_at ON lession_views (date_at,lession_id);
```
