# 59、SQL LEN() 函数
- 来源：https://ddkk.com/zhuanlan/db/sql/59.html
- 分类：缓存数据库
- 分组：教程目录
SQL中的 LEN() 函数返回文本字段中值的长度

```sql
SELECT LEN( column_name ) FROM table_name;
```

> LEN() 返回的是数据库服务器编码下的字符串长度，如果数据库服务器的编码是 UTF-8，那么 '中国' 将返回 6

不过MySQL 中没有 LEN() 函数，取而代之的是 LENGTH() 函数，但用法都一样

```sql
SELECT LENGTH( column_name ) FROM table_name;
```

> 注意
>
> 一般情况下我们不推荐使用这个函数，因为应用的瓶颈一般在数据库，这两个语句显然会降低数据库的并发能力

## 范例

LEN() 可以直接返回字符串的长度，比如下面这条语句

```sql
 SELECT LENGTH('www.ddkk.com DDKK.COM 弟弟快看');
```

运行结果如下

```sql
mysql> SELECT LENGTH('www.ddkk.com DDKK.COM 弟弟快看');
+------------------------------------+
| LENGTH('www.ddkk.com DDKK.COM 弟弟快看')     |
+------------------------------------+
|                                 24 |
+------------------------------------+
```

## 演示数据

先在 **MySQL** 数据库运行下面的语句创建测试数据

```sql
CREATE DATABASE IF NOT EXISTS ddkk default character set utf8mb4 collate utf8mb4_unicode_ci;
USE ddkk;
DROP TABLE IF EXISTS lession;
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

## SQL LEN() 范例

我们可以使用下面的语句返回 name 列中的长度

```sql
SELECT name, LENGTH(name) FROM lession;
```

运行结果输出如下

```sql
mysql> SELECT name, LENGTH(name) FROM lession;
+---------------------+--------------+
| name                | LENGTH(name) |
+---------------------+--------------+
| Python DDKK.COM 弟弟快看     |           19 |
| Scala DDKK.COM 弟弟快看      |           18 |
| Ruby DDKK.COM 弟弟快看       |           17 |
+---------------------+--------------+
```
