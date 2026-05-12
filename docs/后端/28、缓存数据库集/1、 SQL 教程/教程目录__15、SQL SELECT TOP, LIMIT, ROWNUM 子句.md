# 15、SQL SELECT TOP, LIMIT, ROWNUM 子句
- 来源：https://ddkk.com/zhuanlan/db/sql/15.html
- 分类：缓存数据库
- 分组：教程目录
TOP 、 LIMIT 、 ROWNUM 三个关键字都用于限制返回结果集的条数

对于从上百万条记录的大型表中选择几条数据来说，是非常有用的

但为什么会有这么多关键字实现同样的效果 ？

因为每一个数据库使用的关键字都不同

**1、** SQLServer/MSAccess；

SQL Server / MS Access 只支持 TOP 关键字

```sql
SELECT TOP number [PERCENT]  column_name(s) FROM table_name;
```

**2、** MySQL和Oracle；

MySQL 只支持 LIMIT 关键字，Oracle 也支持 LIMIT 关键字

```sql
SELECT column_name(s) FROM table_name LIMIT number;
```

**3、** Oracle；

Oracle 还支持 ROWNUM 关键字

```sql
SELECT column_name(s) FROM table_name WHERE ROWNUM <= number;
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

### SQL SELECT TOP

下面的SQL 语句从 "lession" 表中选取前 2 条记录：

```sql
SELECT * FROM lession LIMIT 2;
```

运行结果如下

```sql
mysql> SELECT * FROM lession LIMIT 2;
+----+---------------------+-------+---------------------+
| id | name                | views | created_at          |
+----+---------------------+-------+---------------------+
|  1 | Python DDKK.COM 弟弟快看     |   981 | 2017-04-18 13:52:03 |
|  2 | Scala DDKK.COM 弟弟快看      |    73 | 2017-04-18 16:03:32 |
+----+---------------------+-------+---------------------+
```

## SQL SELECT TOP PERCENT

**Microsoft SQL Server** 还可以使用百分比作为参数

下面的SQL 语句从 lession 表中选取前一半的数据

```sql
SELECT TOP 50 PERCENT * FROM lession;
```
