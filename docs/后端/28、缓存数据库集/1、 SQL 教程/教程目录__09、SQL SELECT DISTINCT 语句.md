# 09、SQL SELECT DISTINCT 语句
- 来源：https://ddkk.com/zhuanlan/db/sql/9.html
- 分类：缓存数据库
- 分组：教程目录
SQLSELECT DISTINCT 语句用于返回唯一的不同的记录

一个列可能会包含多个重复值，有时您也许希望仅仅列出不同 ( distinct ) 的值

DISTINCT 关键词用于返回唯一不同的值

```sql
SELECT DISTINCT column_name , column_name FROM table_name;
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
(3, 'Ruby DDKK.COM 弟弟快看',199,'2017-05-01 06:16:14'),
(4, 'Python DDKK.COM 弟弟快看', 533,'2017-05-02 08:13:42');
```

使用SELECT * FROM lession; 运行结果如下

```sql
mysql> SELECT * FROM lession;
+----+---------------------+-------+---------------------+
| id | name                | views | created_at          |
+----+---------------------+-------+---------------------+
|  1 | Python DDKK.COM 弟弟快看     |   981 | 2017-04-18 13:52:03 |
|  2 | Scala DDKK.COM 弟弟快看      |    73 | 2017-04-18 16:03:32 |
|  3 | Ruby DDKK.COM 弟弟快看       |   199 | 2017-05-01 06:16:14 |
|  4 | Python DDKK.COM 弟弟快看     |   533 | 2017-05-02 08:13:42 |
+----+---------------------+-------+---------------------+
```

总共有**4** 条记录

## SELECT DISTINCT 示例

下面的SQL 语句仅从 "lession" 表的 "name" 列中选取唯一不同的值，也就是去掉 "name" 列重复值

```sql
SELECT DISTINCT lession FROM lession;
```

运行以上 SQL 语句，输出结果如下：

```sql
mysql> SELECT DISTINCT name FROM lession;
+---------------------+
| name                |
+---------------------+
| Python DDKK.COM 弟弟快看     |
| Scala DDKK.COM 弟弟快看      |
| Ruby DDKK.COM 弟弟快看       |
+---------------------+
```
