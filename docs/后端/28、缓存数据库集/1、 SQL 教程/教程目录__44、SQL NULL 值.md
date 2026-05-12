# 44、SQL NULL 值
- 来源：https://ddkk.com/zhuanlan/db/sql/44.html
- 分类：缓存数据库
- 分组：教程目录
SQL中, NULL 与 **空字符串**, **零** 都不相同。是指为未定义或是未知的值

默认地，表的列可以存放 NULL 值

SQL中的 NULL 值只有两种操作：IS NULL 和 IS NOT NULL 操作符

## SQL NULL 值构成原因

造成某一列成为 NULL 的因素可能是:

**1、** 值不存在；

**2、** 值未知；

**3、** 列不可用；

## SQL NULL 值

如果表中的某个列是可选的，那么我们可以在不向该列添加值的情况下插入新记录或更新已有的记录

SQL数据库会自动将该该字段将以 NULL 值保存

NULL 值的处理方式与其它值不同： **无法比较 NULL 和 0；它们是不等价的**

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
(4, NULL, 105,'2017-05-02 18:03:16');
```

使用SELECT * FROM lession; 运行结果如下

```sql
+----+---------------------+-------+---------------------+
| id | name                | views | created_at          |
+----+---------------------+-------+---------------------+
|  1 | Python DDKK.COM 弟弟快看     |   981 | 2017-04-18 13:52:03 |
|  2 | Scala DDKK.COM 弟弟快看      |    73 | 2017-04-18 16:03:32 |
|  3 | Ruby DDKK.COM 弟弟快看       |   199 | 2017-05-01 06:16:14 |
|  4 | NULL               |   105 | 2017-05-02 18:03:16 |
+----+---------------------+-------+---------------------+
```

总共有**4** 条记录

## SQL 的 NULL 值处理

假定我们在设计表 lession 时将 name 字段设置成可选的

也就是说如果在 name 列插入一条不带值的记录，name 列会使用 NULL 值

现在问题来了，我们如何测试 NULL 值呢？

NULL 值无法使用比较运算符来测试 NULL 值，比如 = 、``

NULL 值的测试必须使用 IS NULL 和 IS NOT NULL 操作符

## SQL IS NULL 操作符

我们要如何选择那些 name 列中带有 NULL 值的记录呢？

这时候IS NULL 操作符就可以派上用场了，它用于判断某个值或列为 NULL 值

```sql
SELECT * FROM lession WHERE name IS NULL;
```

运行结果如下

```sql
mysql> SELECT * FROM lession WHERE name IS NULL;
+----+------+-------+---------------------+
| id | name | views | created_at          |
+----+------+-------+---------------------+
|  4 | NULL |   105 | 2017-05-02 18:03:16 |
+----+------+-------+---------------------+
```

### 最佳实战

在SQL 中，始终使用 IS NULL 来查找 NULL 值

## SQL IS NOT NULL

那我们又要如何选择那些 name 字段不为 NULL 值的记录呢？

ISNOT NULL 操作符就派上用场了，它用于判断那些值或者字段列不为 NULL 值

```sql
SELECT * FROM lession WHERE name IS NOT NULL;
```

运行结果如下

```sql
mysql> SELECT * FROM lession WHERE name IS NOT NULL;
+----+---------------------+-------+---------------------+
| id | name                | views | created_at          |
+----+---------------------+-------+---------------------+
|  1 | Python DDKK.COM 弟弟快看     |   981 | 2017-04-18 13:52:03 |
|  2 | Scala DDKK.COM 弟弟快看      |    73 | 2017-04-18 16:03:32 |
|  3 | Ruby DDKK.COM 弟弟快看       |   199 | 2017-05-01 06:16:14 |
+----+---------------------+-------+---------------------+
```

## NULL 值最佳实战

如非必要，设计表时不要将某个字段设置为 NULL
