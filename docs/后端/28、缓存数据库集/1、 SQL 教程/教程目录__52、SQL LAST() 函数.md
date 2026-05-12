# 52、SQL LAST() 函数
- 来源：https://ddkk.com/zhuanlan/db/sql/52.html
- 分类：缓存数据库
- 分组：教程目录
SQL中的 LAST() 函数返回指定的列中最后一个记录的值

```sql
SELECT LAST(column_name) FROM table_name;
```

> 注意
>
> 只有 MS Access 支持 LAST() 函数

虽然其它数据库中没有实现该函数，不过我们我们可以使用 LIMIT 语句达到同样的效果

## SQL Server 、MySQL 和 Oracle 中的 SQL LAST() 实现

假设原本我们要获取的是根据 column_name 列升序排列的最后一项数据

这是什么意思呢？

其实不就是根据 column_name 降序排列的第一条数据吗!!!

所以实现起来不是就是 SQL First() 函数

**1、** SQLServer；

```sql
SELECT TOP 1 column_name FROM table_name ORDER BY column_name DESC;
```

例如

```sql
SELECT TOP 1 name FROM lession ORDER BY views DESC;
```

**2、** MySQL；

```sql
SELECT column_name FROM table_name ORDER BY column_name DESC LIMIT 1;
```

例如

```sql
SELECT name FROM lession ORDER BY views DESC LIMIT 1;
```

**3、** Oracle；

```sql
SELECT column_name FROM table_name ORDER BY column_name DESC WHERE ROWNUM <=1;
```

例如

```sql
SELECT name FROM lession ORDER BY views DESC WHERE ROWNUM <=1;
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

## MySQL 范例

下面的SQL 语句选取 **访问量( views )** 最少的课程名

```sql
SELECT name FROM lession ORDER BY views ASC LIMIT 1;
```

运行结果如下

```sql
mysql> SELECT name FROM lession ORDER BY views ASC LIMIT 1;
+--------------------+
| name               |
+--------------------+
| Scala DDKK.COM 弟弟快看     |
+--------------------+
```
