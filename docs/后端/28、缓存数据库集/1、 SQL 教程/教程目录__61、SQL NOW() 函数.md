# 61、SQL NOW() 函数
- 来源：https://ddkk.com/zhuanlan/db/sql/61.html
- 分类：缓存数据库
- 分组：教程目录
SQLNOW() 函数返回当前系统的日期和时间

```sql
SELECT NOW() FROM table_name;
```

## 范例

NOW() 函数可以独立于表或数据库而使用

比如我们可以使用下面的 SQL 语句直接返回当前时间

```sql
SELECT NOW();
```

运行结果如下

```sql
mysql> SELECT NOW();
+---------------------+
| NOW()               |
+---------------------+
| 2017-05-19 08:28:45 |
+---------------------+
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
(3, 'Ruby DDKK.COM 弟弟快看',199,'2017-05-01 06:16:14');
```

使用SELECT * FROM lession; 运行结果如下

```sql
+----+---------------------+-------+--------------------+
| id | name               | views | created_at          |
+----+---------------------+-------+--------------------+
|  1 | Python DDKK.COM 弟弟快看     |   981 | 2017-04-18 13:52:03 |
|  2 | Scala DDKK.COM 弟弟快看      |    73 | 2017-04-18 16:03:32 |
|  3 | Ruby DDKK.COM 弟弟快看       |   199 | 2017-05-01 06:16:14 |
+----+---------------------+-------+--------------------+
```

总共有**3** 条记录

## SQL NOW() 范例

在插入新课程的时候我们可以直接使用 NOW() 函数给 created_at 赋值

比如下面的 SQL 语句插入了一条新的课程

```sql
INSERT INTO lession(name,views,created_at)VALUES('SQL DDKK.COM 弟弟快看',0,NOW());
```

运行结果如下

```sql
mysql> INSERT INTO lession(name,views,created_at)VALUES('SQL DDKK.COM 弟弟快看',0,NOW()); 
Query OK, 1 row affected (0.01 sec)
```

然后我们使用 SELECT * FROM lession; 看一下表中的记录

```sql
mysql> SELECT * FROM lession;
+----+---------------------+-------+---------------------+
| id | name                | views | created_at          |
+----+---------------------+-------+---------------------+
|  1 | Python DDKK.COM 弟弟快看     |   981 | 2017-04-18 13:52:03 |
|  2 | Scala DDKK.COM 弟弟快看      |    73 | 2017-04-18 16:03:32 |
|  3 | Ruby DDKK.COM 弟弟快看       |   199 | 2017-05-01 06:16:14 |
|  4 | SQL DDKK.COM 弟弟快看        |     0 | 2017-05-19 08:32:11 |
+----+---------------------+-------+---------------------+
```
