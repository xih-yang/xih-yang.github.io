# 22、SQL 别名 ( AS )
- 来源：https://ddkk.com/zhuanlan/db/sql/22.html
- 分类：缓存数据库
- 分组：教程目录
SQL中允许临时给表名或列名称指定别名，创建别名是为了让列名称的可读性更强

别名只是当前 SQL 语句执行过程中临时的改变，在数据库中实际的表的名称不会改变

SQL中创建别名使用 AS 关键字

如果列名称包含空格，要求使用双引号或方括号

**1、** 列的SQL别名；

```sql
SELECT column_name AS alias_name FROM table_name;
```

**2、** 表的别名；

```sql
SELECT column_name(s) FROM table_name AS alias_name;
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
(20170513000003,'Ruby DDKK.COM 弟弟快看',3,20170513,87),
(20170513000004,NULL,NULL,20170513,441);
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
| 20170513000004 | NULL                |       NULL | 20170513 |   441 |
+----------------+---------------------+------------+----------+-------+
```

总共有**10** 条记录

## 列的别名 范例

下面的SQL 语句为 lession_name 和 lession_id 指定别名 name 和 lid

```sql
SELECT lession_id as lid, lession_name as name, date_at, views FROM lession_views;
```

运行结果如下

```sql
mysql> SELECT lession_id as lid, lession_name as name, date_at, views FROM lession_views;
+------+---------------------+----------+-------+
| lid  | name                | date_at  | views |
+------+---------------------+----------+-------+
|    1 | Python DDKK.COM 弟弟快看     | 20170511 |   320 |
|    2 | Scala DDKK.COM 弟弟快看      | 20170511 |    22 |
|    3 | Ruby DDKK.COM 弟弟快看       | 20170511 |    49 |
|    1 | Python DDKK.COM 弟弟快看     | 20170512 |   220 |
|    2 | Scala DDKK.COM 弟弟快看      | 20170512 |    12 |
|    3 | Ruby DDKK.COM 弟弟快看       | 20170512 |    63 |
|    1 | Python DDKK.COM 弟弟快看     | 20170513 |   441 |
|    2 | Scala DDKK.COM 弟弟快看      | 20170513 |    39 |
|    3 | Ruby DDKK.COM 弟弟快看       | 20170513 |    87 |
| NULL | NULL                | 20170513 |   441 |
+------+---------------------+----------+-------+
```

对于聚合函数等，我们也可以使用别名，例如下面的 SQL 语句为 SUM(views) 指定别名 total_view

```sql
SELECT lession_name as name,SUM(views) AS total_view FROM lession_views GROUP BY lession_name;
```

运行结果如下

```sql
mysql> SELECT lession_name as name,SUM(views) AS total_view FROM lession_views GROUP BY lession_name;
+---------------------+------------+
| name                | total_view |
+---------------------+------------+
| NULL                |        441 |
| Python DDKK.COM 弟弟快看     |        981 |
| Ruby DDKK.COM 弟弟快看       |        199 |
| Scala DDKK.COM 弟弟快看      |         73 |
+---------------------+------------+
```

## 表的别名

AS 关键词还可以用于给 表名 取一个别名，例如下面的 SQL 语句为 lession_views 取个别名 lv

```sql
SELECT * FROM lession_views as lv WHERE lv.lession_id = 2;
```

运行结果如下

```sql
mysql> SELECT * FROM lession_views as lv WHERE lv.lession_id = 2;               +----------------+--------------------+------------+----------+-------+
| uniq           | lession_name       | lession_id | date_at  | views |
+----------------+--------------------+------------+----------+-------+
| 20170511000002 | Scala DDKK.COM 弟弟快看     |          2 | 20170511 |    22 |
| 20170512000002 | Scala DDKK.COM 弟弟快看     |          2 | 20170512 |    12 |
| 20170513000002 | Scala DDKK.COM 弟弟快看     |          2 | 20170513 |    39 |
+----------------+--------------------+------------+----------+-------+
```

## 最佳实战

如果出现以下几种情况之一，使用别名很有用：

**1、** 在查询中涉及超过一个表；

**2、** 在查询中使用了函数；

**3、** 列名称很长或者可读性差；

**4、** 需要把两个列或者多个列结合在一起；
