# 07、SQL SELECT 语句
- 来源：https://ddkk.com/zhuanlan/db/sql/7.html
- 分类：缓存数据库
- 分组：教程目录
SQL中的 SELECT 语句用于从数据库表中选取数据

```sql
SELECT column_name, column_name FROM table_name;
```

或

```sql
SELECT * FROM table_name;
```

SELECT 语句运行的结果会被存储在一个临时的结果表中，这个表称为结果集

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

## SELECT Column

下面的SQL 语句从 "lession" 表中选取 "name" 和 "views" 列：

```sql
SELECT name,views FROM lession;
```

运行以上 SQL 语句，输出结果为:

```sql
mysql> SELECT name,views FROM lession;
+---------------------+-------+
| name                | views |
+---------------------+-------+
| Python DDKK.COM 弟弟快看     |   981 |
| Scala DDKK.COM 弟弟快看      |    73 |
| Ruby DDKK.COM 弟弟快看       |   199 |
| SQL DDKK.COM 弟弟快看        |   533 |
+---------------------+-------+
```

## SELECT *

下面的SQL 语句从 "lession" 表中选取所有列

```sql
SELECT * FROM lession;
```

运行以上 SQL 语句，输出结果为:

```sql
mysql> SELECT * FROM lession;
+----+---------------------+-------+---------------------+
| id | name                | views | created_at          |
+----+---------------------+-------+---------------------+
|  1 | Python DDKK.COM 弟弟快看     |   981 | 2017-04-18 13:52:03 |
|  2 | Scala DDKK.COM 弟弟快看      |    73 | 2017-04-18 16:03:32 |
|  3 | Ruby DDKK.COM 弟弟快看       |   199 | 2017-05-01 06:16:14 |
|  4 | SQL DDKK.COM 弟弟快看        |   533 | 2017-05-02 08:13:42 |
+----+---------------------+-------+---------------------+
```

## 在 SELECT 结果集中的导航

大多数数据库系统都允许使用编程函数在结果集中进行导航，比如：Move-To-First-Record、Get-Record-Content、Move-To-Next-Record 等等

类似这些编程函数不在本教程讲解之列。如需学习通过函数调用访问数据的知识，请访问我们的 PHP DDKK.COM 弟弟快看
