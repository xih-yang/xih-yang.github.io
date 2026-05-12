# 50、SQL COUNT() 函数
- 来源：https://ddkk.com/zhuanlan/db/sql/50.html
- 分类：缓存数据库
- 分组：教程目录
SQL中的 COUNT() 函数返回匹配指定条件的行数

根据参数的不同，COUNT() 大致有三种用法

**1、****COUNT(column_name)**；

COUNT(column_name) 函数返回指定列的值的数目，NULL 值除外

```sql
SELECT COUNT(column_name) FROM table_name;
```

**2、****COUNT(*)**；

COUNT(*) 函数返回表中的记录数，包括 NULL 值

```sql
SELECT COUNT(*) FROM table_name;
```

**3、****COUNT(DISTINCTcolumn_name)**；

COUNT(DISTINCT column_name) 函数返回指定列的不同值的数目

```sql
SELECT COUNT(DISTINCT column_name) FROM table_name;
```

> COUNT(DISTINCT) 不能在 Microsoft Access 中使用

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

## 范例

我们使用 COUNT() 函数的三种形式统计一下 lession_views 表中的 lession_name 数量，顺便看看三种形式的不同之处

**1、****COUNT(lession_name)**；

```sql
mysql> SELECT COUNT(lession_name) FROM lession_views;
+---------------------+
| COUNT(lession_name) |
+---------------------+
|                   9 |
+---------------------+
```

**2、****COUNT(*)**；

```sql
mysql> SELECT COUNT(*) FROM lession_views;
+----------+
| COUNT(*) |
+----------+
|       10 |
+----------+
```

**3、** **COUNT(DISTINCTlession_name)；

```sql
mysql> SELECT COUNT(DISTINCT lession_name) FROM lession_views;
+------------------------------+
| COUNT(DISTINCT lession_name) |
+------------------------------+
|                            3 |
+------------------------------+
```
