# 57、SQL LCASE() 函数
- 来源：https://ddkk.com/zhuanlan/db/sql/57.html
- 分类：缓存数据库
- 分组：教程目录
SQL中的 LCASE() 函数把字段列中的小写值转换为小写

```sql
SELECT LCASE(column_name) FROM table_name;
```

它与UCASE 函数是相对的

SQLServer 中没有 LCASE() ， 取而代之的是 LOWER() ，不过用法一样

```sql
SELECT LOWER( column_name ) FROM table_name;
```

> 注意
>
> 一般情况下我们不推荐使用这个函数，因为应用的瓶颈一般在数据库，这两个语句显然会降低数据库的并发能力

## 范例

LCASE() 可以直接转化字符串，比如下面这条语句

```sql
SELECT LCASE('WWW.TWLE.CN');
```

运行结果如下

```sql
mysql> SELECT LCASE('WWW.TWLE.CN');
+----------------------+
| LCASE('WWW.TWLE.CN') |
+----------------------+
| www.ddkk.com          |
+----------------------+
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

## SQL LCASE() 范例

我们可以使用下面的语句将 name 中的小写字母转换为小写

```sql
SELECT name, LCASE(name) FROM lession;
```

运行结果输出如下

```sql
mysql> SELECT name, LCASE(name) FROM lession;
+---------------------+---------------------+
| name                | LCASE(name)         |
+---------------------+---------------------+
| Python DDKK.COM 弟弟快看     | python DDKK.COM 弟弟快看     |
| Scala DDKK.COM 弟弟快看      | scala DDKK.COM 弟弟快看      |
| Ruby DDKK.COM 弟弟快看       | ruby DDKK.COM 弟弟快看       |
+---------------------+---------------------+
```
