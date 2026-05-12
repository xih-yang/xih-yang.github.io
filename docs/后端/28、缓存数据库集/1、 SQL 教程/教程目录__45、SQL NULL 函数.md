# 45、SQL NULL 函数
- 来源：https://ddkk.com/zhuanlan/db/sql/45.html
- 分类：缓存数据库
- 分组：教程目录
SQLISNULL() 、NVL() 、IFNULL() 和 COALESCE() 函数用于处理表中记录的 NULL 值

这些函数都类似，都实现类似的功能，但并不是每个数据库系统中实现了

下表列出了主流数据库系统中实现的函数

数据库系统
实现的函数

MySQL/MariaDB
IFNULL() 、 COALESCE()

Oracle
NVL()

SQL Server / MS Access
ISNULL()

因为都类似，我们就直接拿 ISNULL() 函数来举例吧

ISNULL 函数判断给定的值或字段是否是 NULL，如果是 NULL 则返回传递的默认值，否则返回给定的值或者字段的值

```sql
SELECT IFNULL( column_name, default) FROM table_name;
```

|参数|说明| |column_name|必选, 要判断的值或者字段 |default| 如果为 NULL，要返回的值|

## 范例

这些函数都可以独立于表或者数据库而使用，比如下面的语句

```sql
SELECT IFNULL('www.ddkk.com','ddkk.cn'), IFNULL(NULL,'ddkk.cn');
```

运行结果如下

```sql
mysql> SELECT IFNULL('www.ddkk.com','ddkk.cn'), IFNULL(NULL,'ddkk.cn');
+---------------------------------+------------------------+
| IFNULL('www.ddkk.com','ddkk.cn') | IFNULL(NULL,'ddkk.cn') |
+---------------------------------+------------------------+
| www.ddkk.com                     | ddkk.cn                |
+---------------------------------+------------------------+
```

## 演示数据

先在 **MySQL** 数据库运行下面的语句创建测试数据

```sql
CREATE DATABASE IF NOT EXISTS ddkk default character set utf8mb4 collate utf8mb4_unicode_ci;
USE ddkk;
DROP TABLE IF EXISTS lession_views;
CREATE TABLE lession_views (
    uniq bigint(20) primary key NOT NULL default '0' ,
    lession_name varchar(32) default '',
    lession_id int(11) default '0',
    date_at  int(11) NOT NULL default '0',
    views int(11) default '0'
);
INSERT INTO lession_views(uniq,lession_name,lession_id,date_at,views) VALUES
(20170511000001,'Python DDKK.COM 弟弟快看',1,20170511,320),
(20170511000002,'Scala DDKK.COM 弟弟快看', 2,20170511,22),
(20170511000003,'Ruby DDKK.COM 弟弟快看', 3, 20170511,49),
(20170512000001,'Python DDKK.COM 弟弟快看',1,20170512,220),
(20170512000002,'Scala DDKK.COM 弟弟快看',2,20170512,12),
(20170512000003,'Ruby DDKK.COM 弟弟快看',3,20170512,63),
(20170513000001,'Python DDKK.COM 弟弟快看',1,20170513,441),
(20170513000002,'Scala DDKK.COM 弟弟快看',2,20170513,39),
(20170513000003,'Ruby DDKK.COM 弟弟快看',3,20170513,NULL);
```

使用SELECT * FROM lession_views; 运行结果如下

```sql
+----------------+---------------------+------------+----------+-------+
| uniq           | lession_name        | lession_id | date_at  | views |
+----------------+---------------------+------------+----------+-------+
| 20170511000001 | Python DDKK.COM 弟弟快看     |          1 | 20170511 |   320 |
| 20170511000002 | Scala DDKK.COM 弟弟快看      |          2 | 20170511 |    22 |
| 20170511000003 | Ruby DDKK.COM 弟弟快看       |          3 | 20170511 |    49 |
| 20170512000001 | Python DDKK.COM 弟弟快看     |          1 | 20170512 |   220 |
| 20170512000002 | Scala DDKK.COM 弟弟快看      |          2 | 20170512 |    12 |
| 20170512000003 | Ruby DDKK.COM 弟弟快看       |          3 | 20170512 |    63 |
| 20170513000001 | Python DDKK.COM 弟弟快看     |          1 | 20170513 |   441 |
| 20170513000002 | Scala DDKK.COM 弟弟快看      |          2 | 20170513 |    39 |
| 20170513000003 | Ruby DDKK.COM 弟弟快看       |          3 | 20170513 |  NULL |
+----------------+---------------------+------------+----------+-------+
```

总共有**10** 条记录，最后一条记录的 views 值为 NULL

## IFNULL() 函数的作用

SQLISNULL()、NVL()、IFNULL() 和 COALESCE() 函数有啥作用呢？

> 注意: 测试数据的最后一条记录的 views 值为 NULL

假设我们现在要给每个访问量加上 1000，那么可以使用下面的语句

```sql
SELECT lession_name,views + 1000  FROM lession_views;
```

运行结果如下

```sql
mysql> SELECT lession_name,views + 1000  FROM lession_views;
+---------------------+--------------+
| lession_name        | views + 1000 |
+---------------------+--------------+
| Python DDKK.COM 弟弟快看     |         1320 |
| Scala DDKK.COM 弟弟快看      |         1022 |
| Ruby DDKK.COM 弟弟快看       |         1049 |
| Python DDKK.COM 弟弟快看     |         1220 |
| Scala DDKK.COM 弟弟快看      |         1012 |
| Ruby DDKK.COM 弟弟快看       |         1063 |
| Python DDKK.COM 弟弟快看     |         1441 |
| Scala DDKK.COM 弟弟快看      |         1039 |
| Ruby DDKK.COM 弟弟快看       |         NULL |
+---------------------+--------------+
```

等等，为啥最后一条记录的值是 NULL 而不是 1000 ？

在这里，我们希望 NULL 值为 0

这是因为，NULL 值只能用于 IS NULL 或者 IS NOT NULL 计算，而不能用于普通的加减乘除运算

如果我们必须要这么做，那么可以使用 ISNULL() 等函数转换为其它值，比如 0

所以，我们将 SQL 语句改改，改成下面这样

```sql
SELECT lession_name,IFNULL( views,0) + 1000  FROM lession_views;
```

运行结果如下

```sql
mysql> SELECT lession_name,IFNULL( views,0) + 1000  FROM lession_views;
+---------------------+-------------------------+
| lession_name        | IFNULL( views,0) + 1000 |
+---------------------+-------------------------+
| Python DDKK.COM 弟弟快看     |                    1320 |
| Scala DDKK.COM 弟弟快看      |                    1022 |
| Ruby DDKK.COM 弟弟快看       |                    1049 |
| Python DDKK.COM 弟弟快看     |                    1220 |
| Scala DDKK.COM 弟弟快看      |                    1012 |
| Ruby DDKK.COM 弟弟快看       |                    1063 |
| Python DDKK.COM 弟弟快看     |                    1441 |
| Scala DDKK.COM 弟弟快看      |                    1039 |
| Ruby DDKK.COM 弟弟快看       |                    1000 |
+---------------------+-------------------------+
```

终于是正确了

> 注意
> 聚合函数会自动忽略 NULL 的值

比如我们要统计每门课程的访问量，可以使用下面的 SQL 语句

```sql
SELECT lession_name, SUM(views) FROM lession_views GROUP BY lession_name;
```

运行结果如下

```sql
mysql> SELECT lession_name, SUM(views) FROM lession_views GROUP BY lession_name; 
+---------------------+------------+
| lession_name        | SUM(views) |
+---------------------+------------+
| Python DDKK.COM 弟弟快看      |        981 |
| Ruby DDKK.COM 弟弟快看        |        112 |
| Scala DDKK.COM 弟弟快看       |         73 |
+---------------------+------------+
```

结果神奇的很正确了
