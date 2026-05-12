# 24、SQL INNER JOIN 关键字
- 来源：https://ddkk.com/zhuanlan/db/sql/24.html
- 分类：缓存数据库
- 分组：教程目录
SQLINNER JOIN 关键字只会返回两个表中匹配的行，不匹配的行会被忽略

```sql
SELECT column_name(s) FROM table1 INNER JOIN table2 ON table1.column_name = table2.column_name;
```

在有些数据库中，INNER JOIN 又称之为 JOIN

```sql
SELECT column_name(s) FROM table1 JOIN table2 ON table1.column_name = table2.column_name ;
```

在很多数据库中，有一种更加简单的写法

```sql
SELECT column_name(s) FROM table1,table2 WHERE table1.column_name = table2.column_name ;
```

## 图示

如果不理解，那么就看图解

假设我们有两张表 A 和 B

可以看到每个表的最后一条记录是不匹配的，那么 INNER JOIN 的结果就是

## 演示数据

先在 **MySQL** 数据库运行下面的语句创建测试数据

```sql
CREATE DATABASE IF NOT EXISTS ddkk default character set utf8mb4 collate utf8mb4_unicode_ci;
USE ddkk;
DROP TABLE IF EXISTS lession;
DROP TABLE IF EXISTS lession_views;
CREATE TABLE lession (
    id int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name varchar(32) default '',
    views int(11) NOT NULL default '0',
    created_at DATETIME
);
CREATE TABLE lession_views (
    uniq bigint(20) primary key NOT NULL default '0' ,
    lession_id int(11) default '0',
    date_at  int(11) NOT NULL default '0',
    views int(11) NOT NULL default '0'
);
INSERT INTO lession(id,name,views,created_at) VALUES
(1, 'Python DDKK.COM 弟弟快看',981,'2017-04-18 13:52:03'),
(3, 'Ruby DDKK.COM 弟弟快看',199,'2017-05-01 06:16:14'),
(4, 'SQL DDKK.COM 弟弟快看', 300,'2017-05-02 08:13:16');
INSERT INTO lession_views(uniq,lession_id,date_at,views) VALUES
(20170511000001,1,20170511,320),
(20170511000002,2,20170511,22),
(20170511000003,3, 20170511,49),
(20170512000001,1,20170512,220),
(20170512000002,2,20170512,12),
(20170512000003,3,20170512,63),
(20170513000001,1,20170513,441),
(20170513000002,2,20170513,39),
(20170513000003,3,20170513,87);
```

使用SELECT * FROM lession; 运行结果如下

```sql
mysql> SELECT * FROM lession;
+----+---------------------+-------+---------------------+
| id | name                | views | created_at          |
+----+---------------------+-------+---------------------+
|  1 | Python DDKK.COM 弟弟快看     |   981 | 2017-04-18 13:52:03 |
|  3 | Ruby DDKK.COM 弟弟快看       |   199 | 2017-05-01 06:16:14 |
|  4 | SQL DDKK.COM 弟弟快看        |   300 | 2017-05-02 08:13:16 |
+----+---------------------+-------+---------------------+
```

使用SELECT * FROM lession_views; 运行结果如下

```sql
mysql> SELECT * FROM lession_views;
+----------------+------------+----------+-------+
| uniq           | lession_id | date_at  | views |
+----------------+------------+----------+-------+
| 20170511000001 |          1 | 20170511 |   320 |
| 20170511000002 |          2 | 20170511 |    22 |
| 20170511000003 |          3 | 20170511 |    49 |
| 20170512000001 |          1 | 20170512 |   220 |
| 20170512000002 |          2 | 20170512 |    12 |
| 20170512000003 |          3 | 20170512 |    63 |
| 20170513000001 |          1 | 20170513 |   441 |
| 20170513000002 |          2 | 20170513 |    39 |
| 20170513000003 |          3 | 20170513 |    87 |
+----------------+------------+----------+-------+
```

## SQL LEFT JOIN 范例

假如我们只想查看 lession 和 lession_views 都有记录的数据，那么可以使用下面的 SQL 语句

```sql
SELECT lession.id,lession.name,lession_views.date_at, lession_views.views FROM lession INNER JOIN lession_views ON lession.id=lession_views.lession_id ORDER BY lession.id DESC;
```

输出结果如下

```sql
mysql> SELECT lession.id,lession.name,lession_views.date_at, lession_views.views FROM lession INNER JOIN lession_views ON lession.id=lession_views.lession_id ORDER BY lession.id DESC;
+----+---------------------+----------+-------+
| id | name                | date_at  | views |
+----+---------------------+----------+-------+
|  3 | Ruby DDKK.COM 弟弟快看       | 20170511 |    49 |
|  3 | Ruby DDKK.COM 弟弟快看       | 20170512 |    63 |
|  3 | Ruby DDKK.COM 弟弟快看       | 20170513 |    87 |
|  1 | Python DDKK.COM 弟弟快看     | 20170511 |   320 |
|  1 | Python DDKK.COM 弟弟快看     | 20170512 |   220 |
|  1 | Python DDKK.COM 弟弟快看     | 20170513 |   441 |
+----+---------------------+----------+-------+
```
