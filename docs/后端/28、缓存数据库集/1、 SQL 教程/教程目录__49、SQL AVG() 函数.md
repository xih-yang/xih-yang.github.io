# 49、SQL AVG() 函数
- 来源：https://ddkk.com/zhuanlan/db/sql/49.html
- 分类：缓存数据库
- 分组：教程目录
SQLAVG() 函数返回数值列的平均值

```sql
SELECT AVG(column_name) FROM table_name;
```

## 演示数据

先在 **MySQL** 数据库运行下面的语句创建测试数据

```sql
CREATE DATABASE IF NOT EXISTS ddkk default character set utf8mb4 collate utf8mb4_unicode_ci;
USE ddkk;
CREATE TABLE IF NOT EXISTS lession_views (
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

**1、** 如果我们想要知道总的平均访问数，可以使用下面的SQL语句；

```sql
SELECT AVG(views) FROM lession_views;
```

运行结果如下

```sql
+------------+
| AVG(views) |
+------------+
|   139.2222 |
+------------+
```

**2、** 如果想要知道每门课程的平均访问数，则需要用到GROUPBY语句；

```sql
SELECT lession_name, AVG(views) FROM lession_views GROUP BY lession_name;
```

运行结果如下

```sql
+---------------------+------------+
| lession_name        | AVG(views) |
+---------------------+------------+
| Python DDKK.COM 弟弟快看     |   327.0000 |
| Ruby DDKK.COM 弟弟快看       |    66.3333 |
| Scala DDKK.COM 弟弟快看      |    24.3333 |
+---------------------+------------+
```

**3、** 如果想要知道平均每天的访问数，则可以使用下面的SQL语句；

```sql
SELECT date_at, AVG(views) FROM lession_views GROUP BY date_at;
```

运行结果如下

```sql
+----------+------------+
| date_at  | AVG(views) |
+----------+------------+
| 20170511 |   130.3333 |
| 20170512 |    98.3333 |
| 20170513 |   189.0000 |
```
