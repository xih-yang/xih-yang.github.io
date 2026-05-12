# 40、SQL ALTER TABLE 语句
- 来源：https://ddkk.com/zhuanlan/db/sql/40.html
- 分类：缓存数据库
- 分组：教程目录
SQLALTER TABLE 语句用于向已有的表中添加、删除或修改列 ( 字段 )

**1、** 向表中添加列；

```sql
ALTER TABLE table_name ADD column_name data_type
```

**2、** 删除表中的列；

```sql
ALTER TABLE table_name DROP COLUMN column_name
```

> 有些数据库系统不支持这种方式删除表中的列
> 3、 修改表中列的数据类型；

**SQL Server / MS Access**

```sql
ALTER TABLE table_name ALTER COLUMN column_name data_type
```

**MySQL / Oracle**

```sql
ALTER TABLE table_name MODIFY COLUMN column_name data_type
```

Oracle 10G 之后版本:

```sql
ALTER TABLE table_name MODIFY column_name data_type;
```

> 注意： 修改字段需要给出全部定义，不然会使用数据库系统的默认值

data_type 用于设置列中可以存放的数据的类型

如果想要了解更多 Oracle 、MySQL 和 SQL Server 中可用的数据类型，可以访问 数据类型参考手册 章节

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

## SQL ALTER TABLE 范例

**1、** 添加列；

如果我们想给表添加一列 slug varchar(128) 用于表示课程的路径，可以使用下面的 SQL 语句

```sql
ALTER TABLE lession ADD slug VARCHAR(128) NOT NULL DEFAULT '';
```

然后我们使用 desc lession; 看一下 lession 的表结构

```sql
mysql> desc lession;
+------------+--------------+------+-----+---------+----------------+
| Field      | Type         | Null | Key | Default | Extra          |
+------------+--------------+------+-----+---------+----------------+
| id         | int(11)      | NO   | PRI | NULL    | auto_increment |
| name       | varchar(32)  | YES  |     |         |                |
| views      | int(11)      | NO   |     | 0       |                |
| created_at | datetime     | YES  |     | NULL    |                |
| slug       | varchar(128) | NO   |     |         |                |
+------------+--------------+------+-----+---------+----------------+
```

顺带看一下数据

```sql
mysql> SELECT * FROM lession;
+----+---------------------+-------+---------------------+------+
| id | name                | views | created_at          | slug |
+----+---------------------+-------+---------------------+------+
|  1 | Python DDKK.COM 弟弟快看     |   981 | 2017-04-18 13:52:03  |      |
|  2 | Scala DDKK.COM 弟弟快看      |    73 | 2017-04-18 16:03:32  |      |
|  3 | Ruby DDKK.COM 弟弟快看       |   199 | 2017-05-01 06:16:14  |      |
+----+---------------------+-------+---------------------+------+
```

**2、** 修改字段；

一般情况下 slug 32 个字符足够了，所以我们可以使用下面的 SQL 语句更改下

```sql
ALTER TABLE lession MODIFY COLUMN slug VARCHAR(32) NOT NULL DEFAULT '';
```

然后使用 desc lession; 看一下表结构

```sql
mysql> desc lession;
+------------+-------------+------+-----+---------+----------------+
| Field      | Type        | Null | Key | Default | Extra          |
+------------+-------------+------+-----+---------+----------------+
| id         | int(11)     | NO   | PRI | NULL    | auto_increment |
| name       | varchar(32) | YES  |     |         |                |
| views      | int(11)     | NO   |     | 0       |                |
| created_at | datetime    | YES  |     | NULL    |                |
| slug       | varchar(32) | NO   |     |         |                |
+------------+-------------+------+-----+---------+----------------+
```

如果我们少定义了一些项，它会使用数据库系统的默认设置，而不是表中的原先定义

```sql
ALTER TABLE lession MODIFY COLUMN slug VARCHAR(16);
```

使用 desc lession; 可以看到这点不同

```sql
mysql> desc lession;
+------------+-------------+------+-----+---------+----------------+
| Field      | Type        | Null | Key | Default | Extra          |
+------------+-------------+------+-----+---------+----------------+
| id         | int(11)     | NO   | PRI | NULL    | auto_increment |
| name       | varchar(32) | YES  |     |         |                |
| views      | int(11)     | NO   |     | 0       |                |
| created_at | datetime    | YES  |     | NULL    |                |
| slug       | varchar(16) | YES  |     | NULL    |                |
+------------+-------------+------+-----+---------+----------------+
```

**3、** 删除列；

如果要删除 slug 列，可以使用下面的 SQL 语句

```sql
ALTER TABLE lession DROP COLUMN slug;
```

使用 desc lession; 命令可以看到结果如下

```sql
mysql> desc lession;
+------------+-------------+------+-----+---------+----------------+
| Field      | Type        | Null | Key | Default | Extra          |
+------------+-------------+------+-----+---------+----------------+
| id         | int(11)     | NO   | PRI | NULL    | auto_increment |
| name       | varchar(32) | YES  |     |         |                |
| views      | int(11)     | NO   |     | 0       |                |
| created_at | datetime    | YES  |     | NULL    |                |
+------------+-------------+------+-----+---------+----------------+
```
