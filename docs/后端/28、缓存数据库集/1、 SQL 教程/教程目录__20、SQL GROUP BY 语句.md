# 20、SQL GROUP BY 语句
- 来源：https://ddkk.com/zhuanlan/db/sql/20.html
- 分类：缓存数据库
- 分组：教程目录
SQL中的 GROUP BY 语句根据一个或多个列对结果集进行分组，一般配合聚合函数使用

```sql
SELECT column_name, aggregate_function(column_name) FROM table_name WHERE column_name operator value GROUP BY column_name;
```

## 演示数据

先在 **MySQL** 数据库运行下面的语句创建测试数据

```sql
CREATE DATABASE IF NOT EXISTS ddkk default character set utf8mb4 collate utf8mb4_unicode_ci;
USE ddkk;
DROP TABLE IF EXISTS lession_views;
CREATE TABLE lession_views (
    uniq bigint(20) primary key NOT NULL default '0' ,
    lession_name varchar(32) NOT NULL default '',
    lession_id int(11) NOT NULL default '0',
    date_at  int(11) NOT NULL default '0',
    views int(11) NOT NULL default '0'
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
(20170513000003,'Ruby DDKK.COM 弟弟快看',3,20170513,87);
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
| 20170513000003 | Ruby DDKK.COM 弟弟快看       |          3 | 20170513 |    87 |
+----------------+---------------------+------------+----------+-------+
```

## 范例

**1、** 统计各个课程的总访问量；

```sql
SELECT lession_name, SUM(views) FROM lession_views GROUP BY lession_name;
```

运行结果输出如下

```sql
mysql> SELECT lession_name, SUM(views) FROM lession_views GROUP BY lession_name; 
+---------------------+------------+
| lession_name        | SUM(views) |
+---------------------+------------+
| Python DDKK.COM 弟弟快看      |        981 |
| Ruby DDKK.COM 弟弟快看        |        199 |
| Scala DDKK.COM 弟弟快看       |         73 |
+---------------------+------------+
```

## SQL GROUP BY 多表连接

GROUP BY 也可以用在多表连接上

我们先运行下面的语句创建一张 lession 表

```sql
DROP TABLE lession;
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

然后我们就可以使用下面的 SQL 语句查看每门课的 **总访问量**

```sql
SELECT lession.name,SUM(lession_views.views) FROM lession,lession_views  WHERE lession.id=lession_views.lession_id GROUP BY lession.name;
```

运行结果如下

```sql
mysql> SELECT lession.name,SUM(lession_views.views) FROM lession,lession_views  WHERE lession.id=lession_views.lession_id GROUP BY lession.name;
+---------------------+--------------------------+
| name                | SUM(lession_views.views) |
+---------------------+--------------------------+
| Python DDKK.COM 弟弟快看      |                      981 |
| Ruby DDKK.COM 弟弟快看        |                      199 |
| Scala DDKK.COM 弟弟快看       |                       73 |
+---------------------+--------------------------+
```
