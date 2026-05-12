# 08、SQL INSERT INTO 语句
- 来源：https://ddkk.com/zhuanlan/db/sql/8.html
- 分类：缓存数据库
- 分组：教程目录
SQL中的 INSERT INTO 语句用于向表中插入新记录

INSERT INTO 语句可以有两种语句形式

**1、** 第一种形式无需指定要插入数据的列名，只需提供被插入的值即可；

```sql
INSERT INTO table_name VALUES (value1, value2 ,...);
```

这种语句要求插入的数据要按照创建表时字段的顺序排列数据
**2、** 第二种形式需要指定列名及被插入的值；

```sql
INSERT INTO table_name ( column1, column2,...)VALUES (value1, value2 ,...);
```

这种语句形式不要求 column1 、column2 与表结构创建的顺序一致，但要求 column 与 value 要一一对应

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
```

## SQL INSERT INTO 语句

假设我们要向 "lession" 表中插入一个新的行

可以使用下面的 SQL 语句插入 **Python DDKK.COM 弟弟快看** 课程

```sql
INSERT INTO lession VALUES(1, 'Python DDKK.COM 弟弟快看',981,'2017-04-18 13:52:03');
```

运行以上 SQL 语句，输出结果如下

```sql
mysql> INSERT INTO lession VALUES(1, 'Python DDKK.COM 弟弟快看',981,'2017-04-18 13:52:03');
Query OK, 1 row affected (0.01 sec)
```

使用SQL 中的 SELECT 语句 查看 **lession** 表，显示如下

```sql
mysql> SELECT * FROM lession;
+----+---------------------+-------+---------------------+
| id | name                | views | created_at          |
+----+---------------------+-------+---------------------+
|  1 | Python DDKK.COM 弟弟快看      |   981 | 2017-04-18 13:52:03 |
+----+---------------------+-------+---------------------+
```

## 在指定的列插入数据

使用INSERT INTO 语句的时候也可以指定列名

下面的SQL 语句将插入一个新行，但是只在 "name"、"views"、"created_at" 列插入数据（id 字段会自动更新）

```sql
INSERT INTO lession (name,views,created_at) VALUES('Scala DDKK.COM 弟弟快看',73,'2017-04-18 16:03:32');
```

运行以上 SQL 语句，输出结果如下

```sql
mysql> INSERT INTO lession (name,views,created_at) VALUES('Scala DDKK.COM 弟弟快看',73,'2017-04-18 16:03:32');
Query OK, 1 row affected (0.01 sec)
```

使用SQL 中的 SELECT 语句 查看 **lession** 表，显示如下

```sql
mysql> SELECT * FROM lession;
+----+---------------------+-------+---------------------+
| id | name                | views | created_at          |
+----+---------------------+-------+---------------------+
|  1 | Python DDKK.COM 弟弟快看      |   981 | 2017-04-18 13:52:03 |
|  2 | Scala DDKK.COM 弟弟快看       |    73 | 2017-04-18 16:03:32 |
+----+---------------------+-------+---------------------+
```

你应该注意到，我们没有向 id 字段插入任何数字

id列是 AUTO INCREMENT ,会自动更新的，表中的每条记录都有一个唯一的数字

## 插入多条数据

如果需要插入多条记录，可以在 VALUES 关键字后跟上多个记录，每个记录之间使用逗号分隔

下面的SQL 语句向表 lession 中插入 Ruby DDKK.COM 弟弟快看 和 SQL DDKK.COM 弟弟快看

```sql
INSERT INTO lession(id,name,views,created_at) VALUES
(3, 'Ruby DDKK.COM 弟弟快看',199,'2017-05-01 06:16:14'),
(4, 'SQL DDKK.COM 弟弟快看', 533,'2017-05-02 08:13:42');
```

运行以上 SQL 语句，输出结果如下

```sql
mysql> INSERT INTO lession(id,name,views,created_at) VALUES
    -> (3, 'Ruby DDKK.COM 弟弟快看',199,'2017-05-01 06:16:14'),
    -> (4, 'SQL DDKK.COM 弟弟快看', 533,'2017-05-02 08:13:42');
Query OK, 2 rows affected (0.01 sec)
Records: 2  Duplicates: 0  Warnings: 0
```

使用SQL 中的 SELECT 语句 查看 **lession** 表，显示如下

```sql
mysql> SELECT * FROM lession;
+----+---------------------+-------+---------------------+
| id | name                | views | created_at          |
+----+---------------------+-------+---------------------+
|  1 | Python DDKK.COM 弟弟快看      |   981 | 2017-04-18 13:52:03 |
|  2 | Scala DDKK.COM 弟弟快看       |    73 | 2017-04-18 16:03:32 |
|  3 | Ruby DDKK.COM 弟弟快看        |   199 | 2017-05-01 06:16:14 |
|  4 | SQL DDKK.COM 弟弟快看         |   533 | 2017-05-02 08:13:42 |
+----+---------------------+-------+---------------------+
```
