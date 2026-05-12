# 17、SQL 通配符
- 来源：https://ddkk.com/zhuanlan/db/sql/17.html
- 分类：缓存数据库
- 分组：教程目录
SQL中，通配符与 SQL LIKE 操作符一起使用，可用于替代字符串中的任何其他字符

SQL中规定可以使用以下通配符

通配符
描述

%
替代 0 个或多个字符

_
替代一个字符

[charlist]
字符列中的任何单一字符

[^charlist]或[!charlist]
不在字符列中的任何单一字符

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

## 使用 SQL % 通配符

下面的SQL 语句选取 name 以字母 "S" 开始的课程

```sql
SELECT * FROM lession WHERE name LIKE 'S%'; 
```

运行结果输出如下

```sql
mysql> SELECT * FROM lession WHERE name LIKE 'S%';
+----+--------------------+-------+---------------------+
| id | name               | views | created_at          |
+----+--------------------+-------+---------------------+
|  2 | Scala DDKK.COM 弟弟快看     |    73 | 2017-04-18 16:03:32 |
|  4 | SQL DDKK.COM 弟弟快看       |   533 | 2017-05-02 08:13:42 |
+----+--------------------+-------+---------------------+
```

下面的SQL 语句选取 name 包含模式 "y" 的课程

```sql
SELECT * FROM lession WHERE name LIKE '%y%';
```

运行结果输出如下

```sql
mysql> SELECT * FROM lession WHERE name LIKE '%y%';
+----+---------------------+-------+---------------------+
| id | name                | views | created_at          |
+----+---------------------+-------+---------------------+
|  1 | Python DDKK.COM 弟弟快看     |   981 | 2017-04-18 13:52:03 |
|  3 | Ruby DDKK.COM 弟弟快看       |   199 | 2017-05-01 06:16:14 |
+----+---------------------+-------+---------------------+
```

## 使用 SQL _ 通配符

下面的SQL 语句选取 name 以一个任意字符开始，然后是 "ython" 的所有课程

```sql
SELECT * FROM lession WHERE name LIKE '_ython%';
```

运行结果如下

```sql
mysql> SELECT * FROM lession WHERE name LIKE '_ython%';
+----+---------------------+-------+---------------------+
| id | name                | views | created_at          |
+----+---------------------+-------+---------------------+
|  1 | Python DDKK.COM 弟弟快看     |   981 | 2017-04-18 13:52:03 |
+----+---------------------+-------+---------------------+
```

下面的SQL 语句选取 name 以 "S" 开始，然后是一个任意字符，然后是 "a"，然后是一个任意字符，然后是 "a" 的所有课程：

```sql
SELECT * FROM lession WHERE name LIKE 'S_a_a%';
```

运行结果如下

```sql
mysql> SELECT * FROM lession WHERE name LIKE 'S_a_a%';
+----+--------------------+-------+---------------------+
| id | name               | views | created_at          |
+----+--------------------+-------+---------------------+
|  2 | Scala DDKK.COM 弟弟快看     |    73 | 2017-04-18 16:03:32 |
+----+--------------------+-------+---------------------+
```

## 使用 SQL [charlist] 通配符

MySQL 中使用 **REGEXP** 或 **NOT REGEXP** 运算符 (或 RLIKE 和 NOT RLIKE) 来操作正则表达式

下面的SQL 语句选取 name 以 "P"、"S" 开始的课程

```sql
SELECT * FROM lession WHERE name REGEXP '^[PS]';
```

运行结果如下

```sql
mysql> SELECT * FROM lession WHERE name REGEXP '^[PS]';
+----+---------------------+-------+---------------------+
| id | name                | views | created_at          |
+----+---------------------+-------+---------------------+
|  1 | Python DDKK.COM 弟弟快看     |   981 | 2017-04-18 13:52:03 |
|  2 | Scala DDKK.COM 弟弟快看      |    73 | 2017-04-18 16:03:32 |
|  4 | SQL DDKK.COM 弟弟快看        |   533 | 2017-05-02 08:13:42 |
+----+---------------------+-------+---------------------+
```

下面的SQL 语句选取 id 以 1 到 3 开头课程

```sql
SELECT * FROM lession WHERE id REGEXP '^[2-3]';
```

运行结果输出如下

```sql
mysql> SELECT * FROM lession WHERE id REGEXP '^[2-3]';
+----+--------------------+-------+---------------------+
| id | name               | views | created_at          |
+----+--------------------+-------+---------------------+
|  2 | Scala DDKK.COM 弟弟快看     |    73 | 2017-04-18 16:03:32 |
|  3 | Ruby DDKK.COM 弟弟快看      |   199 | 2017-05-01 06:16:14 |
+----+--------------------+-------+---------------------+
```

下面的SQL 语句选取 id 不以 2 到 3 开头的课程

```sql
SELECT * FROM lession WHERE id REGEXP '^[^2-3]';
```

输出结果如下

```sql
mysql> SELECT * FROM lession WHERE id REGEXP '^[^2-3]';
+----+---------------------+-------+---------------------+
| id | name                | views | created_at          |
+----+---------------------+-------+---------------------+
|  1 | Python DDKK.COM 弟弟快看     |   981 | 2017-04-18 13:52:03 |
|  4 | SQL DDKK.COM 弟弟快看        |   533 | 2017-05-02 08:13:42 |
+----+---------------------+-------+---------------------+
```
