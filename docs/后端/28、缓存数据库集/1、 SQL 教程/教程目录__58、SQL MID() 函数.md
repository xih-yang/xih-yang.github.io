# 58、SQL MID() 函数
- 来源：https://ddkk.com/zhuanlan/db/sql/58.html
- 分类：缓存数据库
- 分组：教程目录
SQL中的 MID() 函数用于从文本字段中提取字符

```sql
SELECT MID( column_name ,start[,length]) FROM table_name;
```

参数
描述

column_name
必需。要提取字符的字段

start
必需。设置开始位置 ( 起始值是 1 )，这个一定要注意

length
可选。要返回的字符数。如果省略，则 MID() 函数返回剩余文本

> 注意
>
> 一般情况下我们不推荐使用这个函数，因为应用的瓶颈一般在数据库，这两个语句显然会降低数据库的并发能力

## 范例

MID() 可以直接从字符串中截取子串，比如下面这条语句

```sql
SELECT MID('www.ddkk.com',3,4);
```

运行结果如下

```sql
mysql> SELECT MID('www.ddkk.com',3,4);
+------------------------+
| MID('www.ddkk.com',3,4) |
+------------------------+
| w.tw                   |
+------------------------+
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

## SQL MID() 范例

我们可以使用下面的语句提取 name 中的前 6 个字符

```sql
SELECT name, MID(name,1,6) FROM lession;
```

运行结果输出如下

```sql
mysql> SELECT name, MID(name,1,6) FROM lession;
+---------------------+---------------+
| name                | MID(name,1,6) |
+---------------------+---------------+
| Python DDKK.COM 弟弟快看      | Python        |
| Scala DDKK.COM 弟弟快看       | Scala         |
| Ruby DDKK.COM 弟弟快看        | Ruby 基       |
+---------------------+---------------+
```
