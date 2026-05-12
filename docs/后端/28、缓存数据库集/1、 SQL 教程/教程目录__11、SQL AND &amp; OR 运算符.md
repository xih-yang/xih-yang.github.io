# 11、SQL AND &amp; OR 运算符
- 来源：https://ddkk.com/zhuanlan/db/sql/11.html
- 分类：缓存数据库
- 分组：教程目录
SQL中的 AND 或 OR 运算符用于基于一个以上的条件对记录进行过滤

**1、** 如果第一个条件和第二个条件都成立，则AND运算符显示一条记录；

**2、** 如果第一个条件和第二个条件中只要有一个成立，则OR运算符显示一条记录；

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

## AND 运算符

下面的SQL 语句从 "lession" 表中选取 views 大于 200 且 id 大于 2 的所有课程

```sql
SELECT * FROM lession WHERE views >= 200 AND id > 2;
```

运行以上 SQL 语句，输出结果如下

```sql
mysql> SELECT * FROM lession WHERE views >= 200 AND id > 2;
+----+------------------+-------+---------------------+
| id | name             | views | created_at          |
+----+------------------+-------+---------------------+
|  4 | SQL DDKK.COM 弟弟快看      |   533 | 2017-05-02 08:13:42 |
+----+------------------+-------+---------------------+
```

## OR 运算符

下面的SQL 语句从 "lession" 表中选取 views 大于 200 或 id 大于 2 的所有课程

```sql
SELECT * FROM lession WHERE views >= 200 or id > 2;
```

运行以上 SQL 语句，输出结果如下

```sql
mysql> SELECT * FROM lession WHERE views >= 200 or id > 2;
+----+---------------------+-------+---------------------+
| id | name                | views | created_at          |
+----+---------------------+-------+---------------------+
|  1 | Python DDKK.COM 弟弟快看      |   981 | 2017-04-18 13:52:03 |
|  3 | Ruby DDKK.COM 弟弟快看        |   199 | 2017-05-01 06:16:14 |
|  4 | SQL DDKK.COM 弟弟快看         |   533 | 2017-05-02 08:13:42 |
+----+---------------------+-------+---------------------+
```

## 结合 AND 和 OR

可以把AND 和 OR 结合起来 (使用圆括号来组成复杂的表达式)

下面的SQL 语句从 "lession" 表中选取 views 大于 200 且 id 等于 1 或 id 等于 3 的课程

```sql
SELECT * FROM lession WHERE  views > 200 AND ( id = 1 OR id = 3 );
```

运行以上 SQL ,输出结果如下：

```sql
mysql> SELECT * FROM lession WHERE  views > 200 AND ( id = 1 OR id = 3 );
+----+---------------------+-------+---------------------+
| id | name                | views | created_at          |
+----+---------------------+-------+---------------------+
|  1 | Python DDKK.COM 弟弟快看      |   981 | 2017-04-18 13:52:03 |
+----+---------------------+-------+---------------------+
```
