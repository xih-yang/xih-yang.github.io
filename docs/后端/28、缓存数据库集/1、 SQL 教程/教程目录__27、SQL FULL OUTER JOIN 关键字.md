# 27、SQL FULL OUTER JOIN 关键字
- 来源：https://ddkk.com/zhuanlan/db/sql/27.html
- 分类：缓存数据库
- 分组：教程目录
SQLFULL OUTER JOIN 关键字只要左表 ( table1 )和右表 ( table2 ) 其中一个表中存在匹配，则返回行

也就是说，FULL OUTER JOIN 关键字结合了 LEFT JOIN 和 RIGHT JOIN 的结果

> 注意 : MySQL 不支持 FULL OUTER JOIN

如果还不理解，那么就看图解

假设我们有两张表 A 和 B

可以看到每个表的最后一条记录是不匹配的，那么 FULL OUTER JOIN 的结果就是

### SQL FULL OUTER JOIN 语法

```sql
SELECT column_name(s) FROM table1 FULL OUTER JOIN table2 ON table1.column_name = table2.column_name ;
```

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
    lession_name varchar(32) default '',
    lession_id int(11) default '0',
    date_at  int(11) NOT NULL default '0',
    views int(11) NOT NULL default '0'
);
INSERT INTO lession(id,name,views,created_at) VALUES
(1, 'Python DDKK.COM 弟弟快看',981,'2017-04-18 13:52:03'),
(3, 'Ruby DDKK.COM 弟弟快看',199,'2017-05-01 06:16:14'),
(4, 'SQL DDKK.COM 弟弟快看', 300,'2017-05-02 08:13:16');
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

## SQL FULL OUTER JOIN 范例

假设我们要查看所有课程每天的访问量，那么可以使用下面的 SQL 语句

```sql
SELECT lession.id,lession.name,lession_views.date_at, lession_views.views FROM lession FULL OUTER JOIN lession_views ON lession.id=lession_views.lession_id ORDER BY lession.id DESC;
```

因为MySQL 中不支持 **FULL OUTER JOIN**，但你可以在 SQL Server 测试一下
