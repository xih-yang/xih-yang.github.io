# 13、SQL UPDATE 语句
- 来源：https://ddkk.com/zhuanlan/db/sql/13.html
- 分类：缓存数据库
- 分组：教程目录
SQLUPDATE 语句用于更新表中已存在的记录

```sql
UPDATE table_name SET column1 = value1, column2 = value2,... [WHERE some_column = some_value];
```

SQLUPDATE 语句中的 WHERE 子句规定哪条记录或者哪些记录需要更新

如果省略了 WHERE 子句，所有的记录都将被更新

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

## SQL UPDATE

因为Python 3 已经逐渐成为主流，所以我们希望将 Python DDKK.COM 弟弟快看 改成 Python 3 DDKK.COM 弟弟快看

那么可以使用下面的 SQL 语句

```sql
UPDATE lession SET name='Python 3 DDKK.COM 弟弟快看' WHERE name = 'Python DDKK.COM 弟弟快看';
```

运行SQL 语句，输出结果如下

```sql
mysql> UPDATE lession SET name='Python 3 DDKK.COM 弟弟快看' WHERE name = 'Python DDKK.COM 弟弟快看';
Query OK, 1 row affected (0.01 sec)
Rows matched: 1  Changed: 1  Warnings: 0
```

使用SQL 中的 SELECT 语句 查看 **lession** 表，显示如下

```sql
mysql> SELECT * FROM lession;
+----+-----------------------+-------+---------------------+
| id | name                  | views | created_at          |
+----+-----------------------+-------+---------------------+
|  1 | Python 3 DDKK.COM 弟弟快看      |   981 | 2017-04-18 13:52:03 |
|  2 | Scala DDKK.COM 弟弟快看         |    73 | 2017-04-18 16:03:32 |
|  3 | Ruby DDKK.COM 弟弟快看          |   199 | 2017-05-01 06:16:14 |
|  4 | SQL DDKK.COM 弟弟快看           |   533 | 2017-05-02 08:13:42 |
+----+-----------------------+-------+---------------------+
```

### UPDATE 警告

更新记录时要格外小心

在上面的范例中，如果我们省略了 WHERE 子句，如下所示

```sql
UPDATE lession SET name='Python 3 DDKK.COM 弟弟快看';
```

执行以上代码会将 lession 表中所有数据的 name 改为 Python 3 DDKK.COM 弟弟快看

```sql
mysql> UPDATE lession SET name='Python 3 DDKK.COM 弟弟快看';
Query OK, 3 rows affected (0.01 sec)
Rows matched: 4  Changed: 3  Warnings: 0
mysql> SELECT * FROM lession;
+----+-----------------------+-------+---------------------+
| id | name                  | views | created_at          |
+----+-----------------------+-------+---------------------+
|  1 | Python 3 DDKK.COM 弟弟快看     |   981 | 2017-04-18 13:52:03 |
|  2 | Python 3 DDKK.COM 弟弟快看     |    73 | 2017-04-18 16:03:32 |
|  3 | Python 3 DDKK.COM 弟弟快看     |   199 | 2017-05-01 06:16:14 |
|  4 | Python 3 DDKK.COM 弟弟快看     |   533 | 2017-05-02 08:13:42 |
+----+-----------------------+-------+---------------------+
4 rows in set (0.00 sec)
mysql> 
```

执行没有 WHERE 子句的 UPDATE 要慎重，再慎重
