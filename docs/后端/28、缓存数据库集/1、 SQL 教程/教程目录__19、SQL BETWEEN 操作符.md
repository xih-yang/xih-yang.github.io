# 19、SQL BETWEEN 操作符
- 来源：https://ddkk.com/zhuanlan/db/sql/19.html
- 分类：缓存数据库
- 分组：教程目录
SQLBETWEEN 操作符选取介于两个值之间的数据范围内的值。这些值可以是数值、文本或者日期

```sql
SELECT column_name FROM table_name WHERE column_name BETWEEN value1 AND value2;
```

> 注意
>
> 不同的数据库中，BETWEEN 操作符会产生不同的结果
>
>
> 在某些数据库中，BETWEEN 选取介于两个值之间但不包括两个测试值的字段
> 在某些数据库中，BETWEEN 选取介于两个值之间且包括两个测试值的字段
> 在某些数据库中，BETWEEN 选取介于两个值之间且包括第一个测试值但不包括最后一个测试值的字段
>
> 因此，请检查你的数据库系统是如何处理 BETWEEN 操作符

## 演示数据

先在 **MySQL** 数据库运行下面的语句创建测试数据

```sql
CREATE DATABASE IF NOT EXISTS ddkk default character set utf8mb4 collate utf8mb4_unicode_ci;
USE ddkk;
DROP TABLE IF EXISTS lession;
CREATE TABLE lession (
    id int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name varchar(32) default '',
    views int(11) NOT NULL default '0',
    created_at DATETIME
);
INSERT INTO lession(id,name,views,created_at) VALUES
(1, 'Python DDKK.COM 弟弟快看',981,'2017-04-18 13:52:03'),
(2, 'Scala DDKK.COM 弟弟快看',73,'2017-04-18 16:03:32'),
(3, 'Ruby DDKK.COM 弟弟快看',199,'2017-05-01 06:16:14'),
(4, 'SQL DDKK.COM 弟弟快看', 533,'2017-05-02 08:13:42');
```

使用SELECT * FROM lession; 运行结果如下

```sql
mysql> select * from lession;
+----+---------------------+-------+---------------------+
| id | name                | views | created_at          |
+----+---------------------+-------+---------------------+
|  1 | Python DDKK.COM 弟弟快看     |   981 | 2017-04-18 13:52:03 |
|  2 | Scala DDKK.COM 弟弟快看      |    73 | 2017-04-18 16:03:32 |
|  3 | Ruby DDKK.COM 弟弟快看       |   199 | 2017-05-01 06:16:14 |
|  4 | SQL DDKK.COM 弟弟快看        |   533 | 2017-05-02 08:13:42 |
+----+---------------------+-------+---------------------+
```

总共有**4** 条记录

## BETWEEN 操作符

下面的SQL 语句选取 id 介于 1 和 3 之间的所有课程

```sql
SELECT * FROM lession WHERE id BETWEEN 1 AND 3;
```

运行结果如下

```sql
mysql> SELECT * FROM lession WHERE id BETWEEN 1 AND 3;
+----+---------------------+-------+---------------------+
| id | name                | views | created_at          |
+----+---------------------+-------+---------------------+
|  1 | Python DDKK.COM 弟弟快看     |   981 | 2017-04-18 13:52:03 |
|  2 | Scala DDKK.COM 弟弟快看      |    73 | 2017-04-18 16:03:32 |
|  3 | Ruby DDKK.COM 弟弟快看       |   199 | 2017-05-01 06:16:14 |
+----+---------------------+-------+---------------------+
```

## NOT BETWEEN 操作符

如果想要选取不在某个区间的数据，可以使用 NOT BETWEEN

下面的SQL 语句选取 id 不在 1 和 3 之间的所有课程

```sql
SELECT * FROM lession WHERE id NOT BETWEEN 1 AND 3;
```

运行结果如下

```sql
mysql> SELECT * FROM lession WHERE id NOT BETWEEN 1 AND 3;
+----+------------------+-------+---------------------+
| id | name             | views | created_at          |
+----+------------------+-------+---------------------+
|  4 | SQL DDKK.COM 弟弟快看      |   533 | 2017-05-02 08:13:42 |
+----+------------------+-------+---------------------+
```

## 在 VARCHAR 等文本类型上使用 BETWEEN 操作符

下面的SQL 语句选取 name 以介于 'O' 和 'S' 之间字母开始的所有课程

```sql
SELECT * FROM lession WHERE name BETWEEN 'O' AND 'S';
```

运行结果如下

```sql
mysql> SELECT * FROM lession WHERE name BETWEEN 'O' AND 'S';
+----+---------------------+-------+---------------------+
| id | name                | views | created_at          |
+----+---------------------+-------+---------------------+
|  1 | Python DDKK.COM 弟弟快看     |   981 | 2017-04-18 13:52:03 |
|  3 | Ruby DDKK.COM 弟弟快看       |   199 | 2017-05-01 06:16:14 |
+----+---------------------+-------+---------------------+
```

## 在 VARCHAR 等文本类型上使用 NOT BETWEEN 操作符

下面的SQL 语句选取 name 不介于 'O' 和 'S' 之间字母开始的所有课程

```sql
SELECT * FROM lession WHERE name NOT BETWEEN 'O' AND 'S';
```

运行结果如下

```sql
mysql> SELECT * FROM lession WHERE name NOT BETWEEN 'O' AND 'S';
+----+--------------------+-------+---------------------+
| id | name               | views | created_at          |
+----+--------------------+-------+---------------------+
|  2 | Scala DDKK.COM 弟弟快看     |    73 | 2017-04-18 16:03:32 |
|  4 | SQL DDKK.COM 弟弟快看       |   533 | 2017-05-02 08:13:42 |
+----+--------------------+-------+---------------------+
```

## 在 DATETIME 等日期类型列上使用 BETWEEN 操作符

下面的SQL 语句选取 created_at 介于 2017-04-18 16:03:32 和 2017-05-01 06:16:14 之间的数据

```sql
SELECT * FROM lession WHERE created_at BETWEEN '2017-04-18 16:03:32' AND '2017-05-01 06:16:14';
```

运行结果如下

```sql
mysql> SELECT * FROM lession WHERE created_at BETWEEN '2017-04-18 16:03:32' AND '2017-05-01 06:16:14';
+----+--------------------+-------+---------------------+
| id | name               | views | created_at          |
+----+--------------------+-------+---------------------+
|  2 | Scala DDKK.COM 弟弟快看      |    73 | 2017-04-18 16:03:32 |
|  3 | Ruby DDKK.COM 弟弟快看       |   199 | 2017-05-01 06:16:14 |
+----+--------------------+-------+---------------------+
```

## 最佳实战

一般情况下，我们不推荐使用 BETWEEN

为什么呢？

因为BETWEEN 并不是所有开发者都熟悉，而且不同数据库实现有不一样的实现

那我们可以用什么代替呢？

我们可以用 >`或`< 代替，比如下面的 SQL 语句选取 id 介于 1 和 3 之间的所有课程

```sql
SELECT * FROM lession WHERE id >=1 AND id <=3;
```

运行结果如下

```sql
mysql> SELECT * FROM lession WHERE id BETWEEN 1 AND 3;
+----+---------------------+-------+---------------------+
| id | name                | views | created_at          |
+----+---------------------+-------+---------------------+
|  1 | Python DDKK.COM 弟弟快看     |   981 | 2017-04-18 13:52:03 |
|  2 | Scala DDKK.COM 弟弟快看      |    73 | 2017-04-18 16:03:32 |
|  3 | Ruby DDKK.COM 弟弟快看       |   199 | 2017-05-01 06:16:14 |
+----+---------------------+-------+---------------------+
```

效果是一样的，而且简单易懂
