# 41、SQL AUTO INCREMENT 关键词
- 来源：https://ddkk.com/zhuanlan/db/sql/41.html
- 分类：缓存数据库
- 分组：教程目录
AUTO INCREMENT 会在新记录插入表中时生成一个唯一的数字

AUTO INCREMENT 一般用在 CREATE TABLE 语句中，指定某一列的值会自动自增

但是，不同的数据库系统对于 AUTO INCREMENT 实现各不相同，我们先拿最熟悉的 MySQL 来说吧

## 演示数据

先在 **MySQL** 数据库运行下面的语句创建测试数据

```sql
CREATE DATABASE IF NOT EXISTS ddkk default character set utf8mb4 collate utf8mb4_unicode_ci;
USE ddkk;
DROP TABLE IF EXISTS lession;
```

## 创建表时指定某列自增

比如我们之前创建 lession 表时的语句

```sql
CREATE TABLE lession (
    id int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name varchar(32) default '',
    views int(11) NOT NULL default '0',
    created_at DATETIME
);
```

它指定了 id 列会自动自增，自动从 1 开始自增

比如我们可以使用下面的语句插入两条记录

```sql
INSERT INTO lession(name,views,created_at) VALUES
('Python DDKK.COM 弟弟快看',981,'2017-04-18 13:52:03'),
('Scala DDKK.COM 弟弟快看',73,'2017-04-18 16:03:32');
```

然后我们可以使用 SELECT * FROM lession; 查看表中的数据

```sql
mysql> SELECT * FROM lession;
+----+---------------------+-------+---------------------+
| id | name                | views | created_at          |
+----+---------------------+-------+---------------------+
|  1 | Python DDKK.COM 弟弟快看      |   981 | 2017-04-18 13:52:03 |
|  2 | Scala DDKK.COM 弟弟快看       |    73 | 2017-04-18 16:03:32 |
+----+---------------------+-------+---------------------+
```

我们可以看到，第一次插入，id 值被赋值为 1 ，第二次插入的时候自动自增了 1

如果想要让 AUTO INCREMENT 序列以其它的值起始，可以使用下面的 SQL 语句修改表

```sql
ALTER TABLE lession AUTO_INCREMENT=80;
```

运行结果如下

```sql
mysql> ALTER TABLE lession AUTO_INCREMENT=80;
Query OK, 0 rows affected (0.04 sec)
Records: 0  Duplicates: 0  Warnings: 0
```

这时候我们再插入一条数据

```sql
INSERT INTO lession(name,views,created_at) VALUES
('Ruby DDKK.COM 弟弟快看',199,'2017-05-01 06:16:14');
```

表中的数据就会时这样的

```sql
mysql> SELECT * FROM lession;
+----+---------------------+-------+---------------------+
| id | name                | views | created_at          |
+----+---------------------+-------+---------------------+
|  1 | Python DDKK.COM 弟弟快看     |   981 | 2017-04-18 13:52:03 |
|  2 | Scala DDKK.COM 弟弟快看      |    73 | 2017-04-18 16:03:32 |
| 80 | Ruby DDKK.COM 弟弟快看       |   199 | 2017-05-01 06:16:14 |
+----+---------------------+-------+---------------------+
```

当然了，我们可以在创建表时就修改自增的起始值

```sql
DROP TABLE IF EXISTS lession;
CREATE TABLE lession (
    id int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name varchar(32) default '',
    views int(11) NOT NULL default '0',
    created_at DATETIME
)AUTO_INCREMENT=80;
INSERT INTO lession(name,views,created_at) VALUES
('Python DDKK.COM 弟弟快看',981,'2017-04-18 13:52:03'),
('Scala DDKK.COM 弟弟快看',73,'2017-04-18 16:03:32'),
('Ruby DDKK.COM 弟弟快看',199,'2017-05-01 06:16:14');
```

使用SELECT * FROM lession; 运行结果如下

```sql
mysql> SELECT * FROM lession;
+----+---------------------+-------+---------------------+
| id | name                | views | created_at          |
+----+---------------------+-------+---------------------+
| 80 | Python DDKK.COM 弟弟快看     |   981 | 2017-04-18 13:52:03 |
| 81 | Scala DDKK.COM 弟弟快看      |    73 | 2017-04-18 16:03:32 |
| 82 | Ruby DDKK.COM 弟弟快看       |   199 | 2017-05-01 06:16:14 |
+----+---------------------+-------+---------------------+
```

## SQL Server 中的 AUTO INCREMENT

**SQL Server** 中没有 AUTO INCREMENT 关键字，取而代之的是 IDENTITY() 函数

IDENTITY() 函数的原型是

```sql
IDENTITY(start,step)
```

参数
说明

start
自增时的初始值

step
自增步长

比如我们可以使用下面的 SQL 语句创建 lession 表，指定 id 列从 1 开始，每次自增 1

```sql
CREATE TABLE lession (
    id int(11) NOT NULL IDENTITY(1,1) PRIMARY KEY ,
    name varchar(32) default '',
    views int(11) NOT NULL default '0',
    created_at DATETIME
);
```

## Access 中的 AUTO INCREMENT

**Access** 中没有 AUTO INCREMENT 关键字，取而代之的是 AUTOINCREMENT() 函数

AUTOINCREMENT() 函数的原型是

```sql
AUTOINCREMENT(start=1,step=1)
```

参数
说明

start
自增时的初始值，默认为 1

step
自增步长，默认为 1

比如我们可以使用下面的 SQL 语句创建 lession 表，指定 id 列从 1 开始，每次自增 1

```sql
CREATE TABLE lession (
    id int(11) NOT NULL AUTOINCREMENT PRIMARY KEY ,
    name varchar(32) default '',
    views int(11) NOT NULL default '0',
    created_at DATETIME
);
```

更有趣的，如果使用默认值，就连括号 () 都可以省略，就像上面一样

## Oracle 中的 AUTO INCREMENT

**Access** 中没有 AUTO INCREMENT 关键字，取而代之的是 sequence 对象

sequence 对象用于生成数字序列

Oracle 中实现一个字段的自增需要以下几步:

**1、** 使用CREATESEQUENCE创建自增序列；

```sql
CREATE SEQUENCE seq_lession MINVALUE 1 START WITH 1 INCREMENT BY 1 CACHE 10
```

上面的代码创建一个名为 seq_lession 的 sequence 对象，它以 1 起始且以 1 递增

该对象缓存 10 个值以提高性能

cache 选项规定了为了提高访问速度要存储多少个序列值
**2、** 使用nextval()函数从seq_lession序列中取回下一个值，然后插入数据到表中；

```sql
INSERT INTO lession (id,name,views, created_at)VALUES
(seq_lession.nextval,'Python DDKK.COM 弟弟快看',981,'2017-04-18 13:52:03');
```

上面的 SQL 语句会在 "lession" 表中插入一条新记录

"id" 列会被赋值为来自 seq_person 序列的下一个数字
