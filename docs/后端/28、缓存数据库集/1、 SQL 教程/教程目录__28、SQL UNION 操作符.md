# 28、SQL UNION 操作符
- 来源：https://ddkk.com/zhuanlan/db/sql/28.html
- 分类：缓存数据库
- 分组：教程目录
SQLUNION 操作符合并两个或多个 SELECT 语句的结果

UNION 结果集中的列名总是等于 UNION 中第一个 SELECT 语句中的列名

**1、** 不允许重复；

SELECT column_name(s) FROM table1 UNION SELECT column_name(s) FROM table2;
**2、** 允许重复值；

SELECT column_name(s) FROM table1 UNION ALL SELECT column_name(s) FROM table2;

但这些SELECT 语句 的结果集必须符合一定的要求：

**1、** 每个SELECT语句必须拥有相同数量的列；

**2、** 列也必须拥有相似的数据类型；

**3、** 每个SELECT语句中的列的顺序必须相同；

## 演示数据

先在 **MySQL** 数据库运行下面的语句创建测试数据

```sql
CREATE DATABASE IF NOT EXISTS ddkk default character set utf8mb4 collate utf8mb4_unicode_ci;
USE ddkk;
DROP TABLE IF EXISTS lession;
DROP TABLE IF EXISTS lession2;
CREATE TABLE lession (
    id int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name varchar(32) default '',
    views int(11) NOT NULL default '0',
    created_at DATETIME
);
INSERT INTO lession(id,name,views,created_at) VALUES
(1, 'Python DDKK.COM 弟弟快看',981,'2017-04-18 13:52:03'),
(2, 'Scala DDKK.COM 弟弟快看',73,'2017-04-18 16:03:32');
CREATE TABLE lession2 (
    id int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name varchar(32) default '',
    views int(11) NOT NULL default '0',
    created_at DATETIME
);
INSERT INTO lession2(id,name,views,created_at) VALUES
(1, 'Scala DDKK.COM 弟弟快看',73,'2017-04-18 16:03:32'),
(2, 'Ruby DDKK.COM 弟弟快看',199,'2017-05-01 06:16:14');
```

使用SELECT * FROM lession; 运行结果如下

```sql
+----+---------------------+-------+---------------------+
| id | name                | views | created_at          |
+----+---------------------+-------+---------------------+
|  1 | Python DDKK.COM 弟弟快看     |   981 | 2017-04-18 13:52:03 |
|  2 | Scala DDKK.COM 弟弟快看      |    73 | 2017-04-18 16:03:32 |
+----+---------------------+-------+---------------------+
```

使用SELECT * FROM lession2; 运行结果如下

```sql
+----+--------------------+-------+---------------------+
| id | name               | views | created_at          |
+----+--------------------+-------+---------------------+
|  1 | Scala DDKK.COM 弟弟快看     |    73 | 2017-04-18 16:03:32 |
|  2 | Ruby DDKK.COM 弟弟快看      |   199 | 2017-05-01 06:16:14 |
+----+--------------------+-------+---------------------+
```

## SQL UNION 范例

下面的SQL 语句从 lession 和 lession2 表中选取 **不同的** name

```sql
SELECT name,views FROM lession UNION SELECT name,views FROM lession2;
```

运行结果如下

```sql
mysql> SELECT name,views FROM lession UNION SELECT name,views FROM lession2;
+---------------------+-------+
| name                | views |
+---------------------+-------+
| Python DDKK.COM 弟弟快看     |   981 |
| Scala DDKK.COM 弟弟快看      |    73 |
| Ruby DDKK.COM 弟弟快看       |   199 |
+---------------------+-------+
```

## SQL UNION ALL 范例

下面的SQL 语句从 lession 和 lession2 表中选取所有的 name

```sql
SELECT name,views FROM lession UNION ALL SELECT name,views FROM lession2;
```

运行结果如下

```sql
mysql> SELECT name,views FROM lession UNION ALL SELECT name,views FROM lession2; 
+---------------------+-------+
| name                | views |
+---------------------+-------+
| Python DDKK.COM 弟弟快看     |   981 |
| Scala DDKK.COM 弟弟快看      |    73 |
| Scala DDKK.COM 弟弟快看      |    73 |
| Ruby DDKK.COM 弟弟快看       |   199 |
+---------------------+-------+
```

## 带有 WHERE 的 SQL UNION ALL

任何一个 SELECT 语句都可以有 WHERE 和 LIMIT 等子句

例如下面的 SQL 语句从 lession 中选取所有的 name 和 从 lession2 中选取 views 大于 100 的 name

```sql
SELECT name,views FROM lession UNION ALL SELECT name,views FROM lession2 WHERE views > 100;
```

运行结果如下

```sql
mysql> SELECT name,views FROM lession UNION ALL SELECT name,views FROM lession2 WHERE views > 100;
+---------------------+-------+
| name                | views |
+---------------------+-------+
| Python DDKK.COM 弟弟快看     |   981 |
| Scala DDKK.COM 弟弟快看      |    73 |
| Ruby DDKK.COM 弟弟快看       |   199 |
+---------------------+-------+
```
