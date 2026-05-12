# 14、SQL DELETE 语句
- 来源：https://ddkk.com/zhuanlan/db/sql/14.html
- 分类：缓存数据库
- 分组：教程目录
SQLDELETE 语句用于删除表中的记录

```sql
DELETE FROM table_name [WHERE some_column = some_value];
```

WHERE 子句是可选的，如果没有 WHERE 子句，那么将删除所有的记录

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

### SQL DELETE

下面的SQL 从 lession 表中删除 id 大于等于 2 且 views 小于 100 的课程

```sql
DELETE FROM lession WHERE id >= 2 AND views < 100;
```

运行结果如下

```sql
mysql> DELETE FROM lession WHERE id >= 2 AND views < 100;
Query OK, 1 row affected (0.01 sec)
```

然后使用 SQL 中的 SELECT 语句 查看 **lession** 表，显示如下

```sql
mysql> SELECT * FROM lession;
+----+---------------------+-------+---------------------+
| id | name                | views | created_at          |
+----+---------------------+-------+---------------------+
|  1 | Python DDKK.COM 弟弟快看     |   981 | 2017-04-18 13:52:03 |
|  3 | Ruby DDKK.COM 弟弟快看       |   199 | 2017-05-01 06:16:14 |
|  4 | SQL DDKK.COM 弟弟快看        |   533 | 2017-05-02 08:13:42 |
+----+---------------------+-------+---------------------+
```

### 删除表中所有数据

SQLDELETE 语句如果没有 **WHERE** 语句，那么可以实现在不删除表的情况下，删除表中所有的行

```sql
DELETE FROM table_name;
```

SQLDELETE 语句会保持表中的结构、属性、索引、自增计数不变

> 注意：在删除记录时要格外小心！因为删除的数据没法恢复，没有后退机制

使用以下 SQL 语句删除表 **lession** 中所有的行

```sql
DELETE FROM lession;
```

运行结果如下

```sql
mysql> DELETE FROM lession;
Query OK, 3 rows affected (0.01 sec)
```

使用SQL 中的 SELECT 语句 查看 **lession** 表，显示如下

```sql
mysql> SELECT * FROM lession;
Empty set (0.00 sec)
```

说明数据已经被删除了

在MySQL 中我们可以使用 DESC table_name 查看表结构

```sql
mysql> desc lession;
+------------+-------------+------+-----+---------+----------------+
| Field      | Type        | Null | Key | Default | Extra          |
+------------+-------------+------+-----+---------+----------------+
| id         | int(11)     | NO   | PRI | NULL    | auto_increment |
| name       | varchar(32) | YES  |     |         |                |
| views      | int(11)     | NO   |     | 0       |                |
| created_at | datetime    | YES  |     | NULL    |                |
+------------+-------------+------+-----+---------+----------------+
```

我们发现虽然删除了表中所有的数据，但表结构还在

## 最佳实战

使用SQL DELETE 语句一定要附加 WHERE 子句，如果删除所有记录，也要用 WHERE 1=1;
