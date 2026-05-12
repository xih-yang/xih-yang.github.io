# 42、SQL 视图 ( Views )
- 来源：https://ddkk.com/zhuanlan/db/sql/42.html
- 分类：缓存数据库
- 分组：教程目录
视图是什么？ 视图是基于 SQL 语句的结果集的可视化的表

视图包含行和列，就像一个真实的表。视图中的字段就是来自一个或多个数据库中的真实的表中的字段

可以向视图添加 SQL 函数、 WHERE 以及 JOIN 语句，也可以呈现数据，就像这些数据来自于某个单一的表一样

## 视图的特征

**1、** 视图总是显示最新的数据；

**2、** 每当用户查询视图时，数据库引擎通过使用视图的SQL语句重建数据；

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

总共有**9** 条记录

## SQL CREATE VIEW 创建视图

创建视图需要使用 CREATE VIEW 语句

```sql
CREATE VIEW view_name AS SELECT column_name(s) FROM table_name WHERE condition;
```

AS 关键字后面的 SQL 语句可以是任何合法的 SQL SELECT 语句

例如我们要创建一视图，用于统计所有课程的访问量，可以使用下面的 SQL 语句

```sql
CREATE VIEW lession_total_view AS SELECT lession_name, SUM(views) AS views FROM lession_views GROUP BY lession_name;
```

运行结果如下

```sql
mysql> CREATE VIEW lession_total_view AS SELECT lession_name, SUM(views) AS views FROM lession_views GROUP BY lession_name;
Query OK, 0 rows affected (0.02 sec)
```

## 从视图中创建视图

非常有意思的是，可以从一个视图中创建另一个视图，比如 SQL 语句

```sql
CREATE VIEW lession_all_views AS SELECT sum(views) as views FROM lession_total_view;
```

运行结果如下

```sql
mysql> CREATE VIEW lession_all_views AS SELECT sum(views) as views FROM lession_total_view;
Query OK, 0 rows affected (0.03 sec)
```

## 查看当前数据库中所有的视图

视图在数据库中类似于表的存在，所以，可以使用 show tables; 语句查看所有的视图

```sql
mysql> show tables;
+--------------------+
| Tables_in_ddkk     |
+--------------------+
| lession            |
| lession_all_views  |
| lession_total_view |
| lession_views      |
+--------------------+
```

可以看到我们刚刚创建的视图 lession_total_view 和 lession_all_views

如果我们使用 desc view_name; 命令，可以看到视图类似于表的存在

```sql
mysql> desc lession_total_view;
+--------------+---------------+------+-----+---------+-------+
| Field        | Type          | Null | Key | Default | Extra |
+--------------+---------------+------+-----+---------+-------+
| lession_name | varchar(32)   | YES  |     |         |       |
| views        | decimal(32,0) | YES  |     | NULL    |       |
+--------------+---------------+------+-----+---------+-------+
```

## 查看视图的创建语句

我们还可以像查看 **表** 的创建语句一样，使用 show create table view_name; 查看视图的创建语句

```sql
mysql> show create table lession_total_view\G
*************************** 1. row ***************************
                View: lession_total_view
         Create View: CREATE ALGORITHM=UNDEFINED DEFINER=root@localhost SQL SECURITY DEFINER VIEW lession_total_view AS select lession_views.lession_name AS lession_name,sum(lession_views.views) AS views from lession_views group by lession_views.lession_name
character_set_client: utf8
collation_connection: utf8_general_ci
```

## 使用视图

因为视图类似于一张表，所以我们可以像查询表那样使用 SELECT 语句查询视图

**1、** 列出视图lession_total_view中所有的数据；

```sql
mysql> SELECT * FROM lession_total_view;
+---------------------+-------+
| lession_name        | views |
+---------------------+-------+
| Python DDKK.COM 弟弟快看     |   981 |
| Ruby DDKK.COM 弟弟快看       |   199 |
| Scala DDKK.COM 弟弟快看      |    73 |
+---------------------+-------+
```

**2、** 列出视图中views大于100的数据；

```sql
mysql> SELECT * FROM lession_total_view WHERE views > 100;
+---------------------+-------+
| lession_name        | views |
+---------------------+-------+
| Python DDKK.COM 弟弟快看     |   981 |
| Ruby DDKK.COM 弟弟快看       |   199 |
+---------------------+-------+
```

**3、** 统计所有课程的访问量；

```sql
mysql> SELECT sum(views)  FROM lession_total_view;
+------------+
| sum(views) |
+------------+
|       1253 |
+------------+
```

**4、** 直接从lession_all_views中查看全部课程的访问量；

```sql
mysql> SELECT * FROM lession_all_views;
+-------+
| views |
+-------+
|  1253 |
+-------+
```

## SQL 修改视图

很多人都会把这个翻译成 **更新视图**，我觉得吧，有点不妥，因为很容易和 **更新表** 联系起来

修改视图的意思，其实只能修改 AS 后面的 SQL 查询语句

如果要修改一个视图，可以使用 CREATE OR REPLACE VIEW 关键字

```sql
CREATE OR REPLACE VIEW view_name AS SELECT column_name(s) FROM table_name WHERE condition
```

比如我们想要向视图 lession_total_view 中添加 lession_id 这列，我们可以使用下面的 SQL 语句

```sql
CREATE OR REPLACE VIEW lession_total_view AS SELECT lession_id,lession_name,SUM( views ) FROM lession_views GROUP BY lession_name,lession_id;
```

运行结果如下

```sql
mysql> CREATE OR REPLACE VIEW lession_total_view AS SELECT lession_id,lession_name,SUM( views ) FROM lession_views GROUP BY lession_name,lession_id;
Query OK, 0 rows affected (0.03 sec)
```

然后我们就可以使用 SELECT * FROM lession_total_view; 查看到 lession_id 列了

```sql
+------------+---------------------+--------------+
| lession_id | lession_name        | SUM( views ) |
+------------+---------------------+--------------+
|          1 | Python DDKK.COM 弟弟快看     |          981 |
|          3 | Ruby DDKK.COM 弟弟快看       |          199 |
|          2 | Scala DDKK.COM 弟弟快看      |           73 |
+------------+---------------------+--------------+
```

### SQL Server 中修改视图

SQLServer 中没有 CREATE OR REPLACE VIEW 关键字，但是可以使用 ALTER VIEW 达到同样的效果

```sql
ALTER VIEW [ schema_name . ] view_name [ ( column [ ,...n ] ) ] 
[ WITH <view_attribute> [ ,...n ] ] 
AS select_statement 
[ WITH CHECK OPTION ] [ ; ]
<view_attribute> ::= 
{ 
    [ ENCRYPTION ]
    [ SCHEMABINDING ]
    [ VIEW_METADATA ]     
}
```

参数
说明

schema_name
视图所属架构的名称

view_name
要更改的视图

column
将成为指定视图的一部分的一个或多个列的名称 ( 以逗号分隔 )

## SQL 删除视图

如果要删除一个视图，可以使用 DROP VIEW 命令

```sql
DROP VIEW view_name;
```

比如要删除刚刚创建的视图 lession_total_view 和 lession_all_views ，可以使用下面的语句

```sql
DROP VIEW lession_total_view;
DROP VIEW lession_all_views;
```
