# 16、SQL LIKE 子句
- 来源：https://ddkk.com/zhuanlan/db/sql/16.html
- 分类：缓存数据库
- 分组：教程目录
SQL中的 LIKE 子句用于在 WHERE 子句中搜索列中的指定模式

```sql
SELECT column_name(s) FROM table_name WHERE column_name LIKE pattern;
```

pattern 是一个合法的模式字符串，有很多种 模式，但最常用的也是最容易记住的就是百分号 ( % ) 可以代替任意字符

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

### SQL LIKE 操作符

**1、** 如果我们不使用任何通配符，那么LIKE的效果相当于=操作符；

下面的 SQL 语句选取 name 为 Python DDKK.COM 弟弟快看 的课程

```sql
SELECT * FROM lession WHERE name LIKE 'Python DDKK.COM 弟弟快看';
```

输出结果如下

```sql
mysql> SELECT * FROM lession WHERE name LIKE 'Python DDKK.COM 弟弟快看';
+----+---------------------+-------+---------------------+
| id | name                | views | created_at          |
+----+---------------------+-------+---------------------+
|  1 | Python DDKK.COM 弟弟快看     |   981 | 2017-04-18 13:52:03 |
+----+---------------------+-------+---------------------+
```

**2、** 因为百分号(%)可以代替任何任意数量的字符，所以下面的SQL语句选取name以S开头的课程；

```sql
SELECT * FROM lession WHERE name LIKE 'S%';
```

运行结果如下

```sql
mysql> SELECT * FROM lession WHERE name LIKE 'S%';
+----+--------------------+-------+---------------------+
| id | name               | views | created_at          |
+----+--------------------+-------+---------------------+
|  2 | Scala DDKK.COM 弟弟快看     |    73 | 2017-04-18 16:03:32 |
|  4 | SQL DDKK.COM 弟弟快看       |   533 | 2017-05-02 08:13:42 |
+----+--------------------+-------+---------------------+
```

**3、** 下面的SQL语句选取name以字符串 程序员编程资料站结尾的所有课程；

```sql
SELECT * FROM lession WHERE name LIKE '%教程';
```

输出结果如下

```sql
mysql> SELECT * FROM lession WHERE name LIKE '%教程';
+----+---------------------+-------+---------------------+
| id | name                | views | created_at          |
+----+---------------------+-------+---------------------+
|  1 | Python DDKK.COM 弟弟快看     |   981 | 2017-04-18 13:52:03 |
|  2 | Scala DDKK.COM 弟弟快看      |    73 | 2017-04-18 16:03:32 |
|  3 | Ruby DDKK.COM 弟弟快看       |   199 | 2017-05-01 06:16:14 |
|  4 | SQL DDKK.COM 弟弟快看        |   533 | 2017-05-02 08:13:42 |
+----+---------------------+-------+---------------------+
```

**4、** 下面的SQL语句选取name包含y字母的课程；

```sql
SELECT * FROM lession WHERE name LIKE '%y%';
```

输出结果如下

```sql
mysql> SELECT * FROM lession WHERE name LIKE '%y%';
+----+---------------------+-------+---------------------+
| id | name                | views | created_at          |
+----+---------------------+-------+---------------------+
|  1 | Python DDKK.COM 弟弟快看     |   981 | 2017-04-18 13:52:03 |
|  3 | Ruby DDKK.COM 弟弟快看       |   199 | 2017-05-01 06:16:14 |
+----+---------------------+-------+---------------------+
```

**5、** 通过使用NOT关键字，我们可以选取不匹配模式的记录；

下面的 SQL 语句选取 name 不包含 "y" 的所有课程

```sql
SELECT * FROM lession WHERE name NOT LIKE '%y%';
```

运行结果如下

```sql
mysql> SELECT * FROM lession WHERE name NOT LIKE '%y%';
+----+--------------------+-------+---------------------+
| id | name               | views | created_at          |
+----+--------------------+-------+---------------------+
|  2 | Scala DDKK.COM 弟弟快看     |    73 | 2017-04-18 16:03:32 |
|  4 | SQL DDKK.COM 弟弟快看       |   533 | 2017-05-02 08:13:42 |
+----+--------------------+-------+---------------------+
```
