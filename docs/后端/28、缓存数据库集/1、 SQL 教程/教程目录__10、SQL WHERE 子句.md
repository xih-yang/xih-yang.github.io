# 10、SQL WHERE 子句
- 来源：https://ddkk.com/zhuanlan/db/sql/10.html
- 分类：缓存数据库
- 分组：教程目录
SQLWHERE 子句用于筛选出那些满足指定条件的记录

```sql
SELECT column_name(s) FROM table_name WHERE column_name operator value;
```

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

## WHERE 子句

下面的SQL 语句从 "lession" 表中选取 id 为 "1" 的所有课程

```sql
SELECT * FROM lession WHERE id=1;
```

运行以上 SQL 语句，输出结果如下：

```sql
mysql> SELECT * FROM lession WHERE id=1;
+----+---------------------+-------+---------------------+
| id | name                | views | created_at          |
+----+---------------------+-------+---------------------+
|  1 | Python DDKK.COM 弟弟快看     |   981 | 2017-04-18 13:52:03 |
+----+---------------------+-------+---------------------+
```

下面的SQL 语句从 "lession" 表中选取 name 为 "Pyhon DDKK.COM 弟弟快看" 的所有课程

```sql
SELECT * FROM lession WHERE name = 'Python DDKK.COM 弟弟快看';
```

运行以上 SQL 语句，输出结果如下：

```sql
mysql> SELECT * FROM lession WHERE name = 'Python DDKK.COM 弟弟快看';
+----+---------------------+-------+---------------------+
| id | name                | views | created_at          |
+----+---------------------+-------+---------------------+
|  1 | Python DDKK.COM 弟弟快看     |   981 | 2017-04-18 13:52:03 |
+----+---------------------+-------+---------------------+
```

## 文本字段 vs 数值字段

SQL使用单引号来环绕文本值

> 虽然大部分数据库系统也接受双引号，但我们极力反对使用双引号

上面的范例中 'name' 文本字段使用了单引号

如果是数值字段，请不要使用引号

> 虽然使用数值字段也可以使用单引号，但数据库系统要经过一次数据类型转换，增加了数据库系统的开销

数值字段使用单引号 极力不推荐

```sql
SELECT * FROM lession WHERE id = '1';
```

运行以上 SQL 语句，输出结果如下：

```sql
mysql> SELECT * FROM lession WHERE id = '1';
+----+---------------------+-------+---------------------+
| id | name                | views | created_at          |
+----+---------------------+-------+---------------------+
|  1 | Python DDKK.COM 弟弟快看     |   981 | 2017-04-18 13:52:03 |
+----+---------------------+-------+---------------------+
```

## WHERE 子句中的运算符

下表中的运算符可以在 WHERE 子句中使用

运算符
描述

=
等于

<>
不等于 1

>
大于

=
大于等于

**1、** 在SQL的一些版本中，该操作符可被写成**!=**↩；
