# 30、SQL INSERT INTO SELECT 语句
- 来源：https://ddkk.com/zhuanlan/db/sql/30.html
- 分类：缓存数据库
- 分组：教程目录
SQLINSERT INTO SELECT 语句可以将 SELECT 查询出来的数据插入到另一张已经存在的表中

目标表中任何已存在的行都不会受影响

INSERT INTO SELECT 和 SELECT INTO 作用几乎一模一样

它们之间最大的区别就是：

**SELECT INTO 会自动创建表，而 INSERT INTO SELECT 不会**

## INSERT INTO SELECT

我们可以使用这个命令复制一张表

**1、** 将一张表里的数据全部复制到另一张表，两张表的字段必须相同；

```sql
INSERT INTO table_name_2 SELECT * FROM table_name_1;
```

**2、** 如果只希望复制某些列到另一张表中，则可以使用下面的SQL语句；

```sql
INSERT INTO table_name_2(column_name(s)) SELECT column_name(s) FROM table_name_1;
```

**3、** SELECT语句还可以设置一些查询条件；

```sql
INSERT INTO table_name_2(column_name(s)) SELECT column_name(s) FROM table_name_1 WHERE condition;
```

## 演示数据

先在 **MySQL** 数据库运行下面的语句创建测试数据

```sql
CREATE DATABASE IF NOT EXISTS ddkk default character set utf8mb4 collate utf8mb4_unicode_ci;
USE ddkk;
DROP TABLE IF EXISTS lession;
DROP TABLE IF EXISTS lession2;
CREATE TABLE lession (
    id int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name varchar(32) default '',
    views int(11) NOT NULL default '0',
    created_at DATETIME
);
CREATE TABLE lession2 (
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

## SQL INSERT INTO SELECT 范例

**1、** 复制lession中的全部数据到lession2中；

```sql
INSERT INTO lession2 SELECT * FROM lession;
```

我们使用 SELECT * FROM lession2; 语句查看下表 lession2 中的数据

```sql
mysql> SELECT * FROM lession2;
+----+---------------------+-------+---------------------+
| id | name                | views | created_at          |
+----+---------------------+-------+---------------------+
|  1 | Python DDKK.COM 弟弟快看     |   981 | 2017-04-18 13:52:03 |
|  2 | Scala DDKK.COM 弟弟快看      |    73 | 2017-04-18 16:03:32 |
|  3 | Ruby DDKK.COM 弟弟快看       |   199 | 2017-05-01 06:16:14 |
+----+---------------------+-------+---------------------+
```

**2、** 插入部分字段；

使用下面的 SQL 语句创建 lession3 ，删掉了 created_at 和 views 字段

```sql
CREATE TABLE lession3 (
    id int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name varchar(32) default ''
);
```

然后使用下面的 SQL 语句选择 lession 的部分列插入到 lession3 中

```sql
INSERT INTO lession3(id,name) SELECT id,name FROM lession;
```

最后使用 SELECT * FROM lession3; 语句查看下表 lession3 中的数据

```sql
mysql> SELECT * FROM lession3;
+----+---------------------+
| id | name                |
+----+---------------------+
|  1 | Python DDKK.COM 弟弟快看     |
|  2 | Scala DDKK.COM 弟弟快看      |
|  3 | Ruby DDKK.COM 弟弟快看       |
+----+---------------------+
```

**3、** 插入部分数据；

使用下面的 SQL 语句创建 lession4 ，删掉了 created_at 和 views 字段

```sql
CREATE TABLE lession4 (
    id int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name varchar(32) default ''
);
```

然后使用下面的 SQL 语句选择 lession 的部分列插入到 lession3 中

```sql
INSERT INTO lession4(id,name) SELECT id,name FROM lession WHERE views > 100;
```

最后使用 SELECT * FROM lession4; 语句查看下表 lession4 中的数据

```sql
mysql> SELECT * FROM lession4;
+----+---------------------+
| id | name                |
+----+---------------------+
|  1 | Python DDKK.COM 弟弟快看     |
|  3 | Ruby DDKK.COM 弟弟快看       |
+----+---------------------+
```

### 删除表 lession2 、lession3 、lession4

我有强迫症啊，用完即删，可以使用下面的语句删除这些表

```sql
DROP TABLE IF EXISTS lession2;
DROP TABLE IF EXISTS lession3;
DROP TABLE IF EXISTS lession4;
```
