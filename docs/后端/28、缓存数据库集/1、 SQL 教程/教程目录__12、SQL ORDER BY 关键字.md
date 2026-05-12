# 12、SQL ORDER BY 关键字
- 来源：https://ddkk.com/zhuanlan/db/sql/12.html
- 分类：缓存数据库
- 分组：教程目录
SQLORDER BY 关键字用于对结果集按照一个列或者多个列进行排序

```sql
SELECT column_name(s) FROM table_name ORDER BY column_name [ASC|DESC] [, column_name [ASC|DESC]];
```

SQL排序有几个重点：

**1、** ORDERBY关键字默认按照升序对记录进行排序；

如需要按照降序对记录进行排序，可以使用 **DESC** 关键字
**2、** 如果没有ORDERBY语句，结果集会以**主键**升序排序；

一般情况下，主键都是 id

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

## SQL ORDER BY

**1、** 默认升序排序；

下面的 SQL 语句从 "lession" 表中选取所有的课程，并按照 "views" 列升序排序：

```sql
SELECT * FROM lession ORDER BY views;
```

运行以上 SQL 语句，输出结果如下

```sql
mysql> SELECT * FROM lession ORDER BY views;
+----+---------------------+-------+---------------------+
| id | name                | views | created_at          |
+----+---------------------+-------+---------------------+
|  2 | Scala DDKK.COM 弟弟快看      |    73 | 2017-04-18 16:03:32 |
|  3 | Ruby DDKK.COM 弟弟快看       |   199 | 2017-05-01 06:16:14 |
|  4 | SQL DDKK.COM 弟弟快看        |   533 | 2017-05-02 08:13:42 |
|  1 | Python DDKK.COM 弟弟快看     |   981 | 2017-04-18 13:52:03 |
+----+---------------------+-------+---------------------+
```

**2、** 如果要降序排序，可以使用DESC关键字；

下面的 SQL 语句从 "lession" 表中选取所有课程，并按照 "views" 列降序排序

```sql
SELECT * FROM lession ORDER BY views DESC;
```

运行以上 SQL 语句，输出结果如下：

```sql
mysql> SELECT * FROM lession ORDER BY views DESC;
+----+---------------------+-------+---------------------+
| id | name                | views | created_at          |
+----+---------------------+-------+---------------------+
|  1 | Python DDKK.COM 弟弟快看     |   981 | 2017-04-18 13:52:03 |
|  4 | SQL DDKK.COM 弟弟快看        |   533 | 2017-05-02 08:13:42 |
|  3 | Ruby DDKK.COM 弟弟快看       |   199 | 2017-05-01 06:16:14 |
|  2 | Scala DDKK.COM 弟弟快看      |    73 | 2017-04-18 16:03:32 |
+----+---------------------+-------+---------------------+
```

**3、** 如果要多列排序，那么每个排序字段使用逗号(,)分隔；

下面的 SQL 语句从 "lession" 表中选取所有课程，并按照 "views" 和 "id" 列排序

```sql
SELECT * FROM lession ORDER BY views, id;
```

运行以上 SQL 语句，输出结果如下：

```sql
mysql> SELECT * FROM lession ORDER BY views, id;
+----+---------------------+-------+---------------------+
| id | name                | views | created_at          |
+----+---------------------+-------+---------------------+
|  2 | Scala DDKK.COM 弟弟快看       |    73 | 2017-04-18 16:03:32 |
|  3 | Ruby DDKK.COM 弟弟快看        |   199 | 2017-05-01 06:16:14 |
|  4 | SQL DDKK.COM 弟弟快看         |   533 | 2017-05-02 08:13:42 |
|  1 | Python DDKK.COM 弟弟快看      |   981 | 2017-04-18 13:52:03 |
+----+---------------------+-------+---------------------+
```

## 多列排序说明

多列排序是怎么排序的呢？

假设我们的 SQL 语句如下

```sql
SELECT * FROM lession ORDER BY views, id;
```

按照排序字段从左往右 ( views, id )

**1、** 如果第一个排序字段(views)的值不一样，则按照第一个排序字段的值排序；

**2、** 如果第一个排序字段(views)的值一样，则按照第二个排序字段(id)的值排序；

**3、** 以此类推；
