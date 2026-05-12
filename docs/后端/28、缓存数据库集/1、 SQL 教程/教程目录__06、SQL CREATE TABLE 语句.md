# 06、SQL CREATE TABLE 语句
- 来源：https://ddkk.com/zhuanlan/db/sql/6.html
- 分类：缓存数据库
- 分组：教程目录
SQLCREATE TABLE 语句用于在数据库中添加表，表由行和列组成，每个表都必须有个表名

```sql
CREATE TABLE table_name (
    column_name1 data_type ( size ) constraint_name ,
    column_name2 data_type ( size ) constraint_name ,
    column_name3 data_type ( size ) constraint_name ,
    ....
);
```

参数
说明

table_name
表名

column_name
表中列的名称

data_type
设定列的数据类型 (例如 varchar、integer、decimal、date 等等)

size
规定表中列的最大长度

constraint_name
数据约束，用于设置列的数据规则

**1、** 如果想要学习MSAccess、MySQL和SQLServer中可用的数据类型请访问我们的完整的SQL数据类型参考手册；

**2、** 如果想要学习MSAccess、MySQL和SQLServer中可用的数据约束，可以访问SQL约束；

## SQL CREATE TABLE 范例

现在我们在数据库 ddkk 中创建一张表 lession 用户表示所有的课程

这个lession 表包含 4 个字段 id 、name 、 views 、created

我们可以使用下面的 SQL 语句来创建这张表

```sql
CREATE TABLE lession (
    id int(11),
    name varchar(32),
    views int(11),
    created_at DATETIME
);
```

- id 和 views 列的数据类型是 int，可以存储整数
- name 列的数据类型是 varchar，可以存储字符串，且这些字段的最大长度为 255 个字符
- created_at 列的数据类型是 datetime, 用于存储日期时间

运行上面的 SQL 语句，输出结果如下

```sql
mysql> use ddkk
Database changed
mysql>` CREATE TABLE lession (
    ->     id int(11),
    ->     name varchar(32),
    ->     views int(11),
    ->     created_at DATETIME
    -> );
Query OK, 0 rows affected (0.02 sec)
```

## MySQL 查看创建的表结构

我们可以使用 MySQL 中的 DESC table_name; 查看刚刚我们创建的表

```sql
mysql> DESC lession;
+------------+-------------+------+-----+---------+-------+
| Field      | Type        | Null | Key | Default | Extra |
+------------+-------------+------+-----+---------+-------+
| id         | int(11)     | YES  |     | NULL    |       |
| name       | varchar(32) | YES  |     | NULL    |       |
| views      | int(11)     | YES  |     | NULL    |       |
| created_at | datetime    | YES  |     | NULL    |       |
+------------+-------------+------+-----+---------+-------+
```

空的"lession" 表如下所示

id
name
views
created_at

### 提示

可以使用 SQL INSERT INTO 语句向空表写入数据
