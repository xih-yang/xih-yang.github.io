# 21、SQL HAVING 子句
- 来源：https://ddkk.com/zhuanlan/db/sql/21.html
- 分类：缓存数据库
- 分组：教程目录
SQL中的 HAVING 子句用于筛选分组 ( GROUP BY ) 后的各组数据，相当于 SELECT 语句中的 WHERE 语句

```sql
SELECT column_name, aggregate_function(column_name) FROM table_name WHERE column_name operator value GROUP BY column_name HAVING aggregate_function(column_name) operator value;
```

HAVING 子句一般跟在 GROUP BY 子句后面

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

## SQL HAVING 范例

我们先使用 GROUP BY 语句统计下所有课程的访问量

```sql
SELECT lession_name, SUM(views) FROM lession_views GROUP BY lession_name;
```

输出结果如下

```sql
mysql> SELECT lession_name, SUM(views) FROM lession_views GROUP BY lession_name; 
+---------------------+------------+
| lession_name        | SUM(views) |
+---------------------+------------+
| Python DDKK.COM 弟弟快看     |        981 |
| Ruby DDKK.COM 弟弟快看       |        199 |
| Scala DDKK.COM 弟弟快看      |         73 |
+---------------------+------------+
```

如果我们需要选择总访问量在 **100** 以内的课程，那么可以使用下面的 SQL 语句

```sql
SELECT lession_name, SUM(views) as total_views FROM lession_views GROUP BY lession_name HAVING total_views < 100;
```

运行结果输出如下

```sql
mysql> SELECT lession_name, SUM(views) as total_views FROM lession_views GROUP BY lession_name HAVING total_views < 100;
+--------------------+-------------+
| lession_name       | total_views |
+--------------------+-------------+
| Scala DDKK.COM 弟弟快看     |          73 |
+--------------------+-------------+
```
