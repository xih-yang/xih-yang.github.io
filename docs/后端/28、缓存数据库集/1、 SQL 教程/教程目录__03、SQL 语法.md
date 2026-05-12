# 03、SQL 语法
- 来源：https://ddkk.com/zhuanlan/db/sql/3.html
- 分类：缓存数据库
- 分组：教程目录
本节课程我们将介绍 SQL 日常使用涉及到的各种概念

## 数据库表

一个数据库通常包含一个或多个表

每个表由一个名字标识（例如:"lession"）,表包含带有数据的记录行

本章节我们会创建一个测试数据库 ddkk ，和多张表 lession 和 lession_views

可以用下面的命令查看 "lession" 表的数据：

```sql
mysql> use ddkk_sql;
Database changed
mysql> set names utf8;
Query OK, 0 rows affected (0.00 sec)
mysql> SELECT * FROM lession;
+----+---------------------+-------+---------------------+
| id | name                | views | created_at          |
+----+---------------------+-------+---------------------+
|  1 | Python DDKK.COM 弟弟快看     |   981 | 2017-04-18 13:52:03 |
|  2 | Scala DDKK.COM 弟弟快看      |    73 | 2017-04-18 16:03:32 |
|  3 | Ruby DDKK.COM 弟弟快看       |   199 | 2017-05-01 06:16:14 |
|  4 | SQL DDKK.COM 弟弟快看        |   533 | 2017-05-02 08:13:42 |
+----+---------------------+-------+---------------------+
```

### 命令分析

命令
说明

use ddkk_sql;
用于选择数据库

set names utf8;
用于设置使用的字符集

SELECT * FROM comps;
读取数据表的信息

上面的表包含 4 条记录（每一条对应一个课程）和 4 列 (id、name、views、created_at)

## SQL 语句

对数据库的操作一般都由 SQL 语句完成

下面的SQL 语句从 "lession" 表中选取所有记录

```sql
SELECT * FROM lession;
```

本课程接下来的学习中，我们会着重讲解各种不同的 SQL 语句

## SQL 的大小写不敏感

SQL对大小写不敏感，SELECT 与 select 是相同的

但本课程中，对于 SQL 的关键字，我们都使用大写

### 最佳实战

长期的SQL 编程实战表明，SQL 关键字大写是一种良好的编程行为

## SQL 语句结尾的分号(;)

分号是在数据库系统中分隔每条 SQL 语句的标准方法。 利用分号(;)，可以在对服务器的请求中执行多条 SQL 语句

虽然某些数据库系统不要求在每条 SQL 语句的末端使用分号

但本课程中，我们会在每条 SQL 语句的末端使用分号

### 最佳实战

在每条SQL 语句的结尾使用分号，是 SQL 最佳实战中最重要的一条

## 最重要也是最常用的的 SQL 命令

SQL 命令
说明

SELECT
从数据库中提取数据

UPDATE
更新数据库中的数据

DELETE
从数据库中删除数据

INSERT INTO
向数据库中插入新数据

CREATE DATABASE
创建新数据库

ALTER DATABASE
修改数据库

CREATE TABLE
创建新表

ALTER TABLE
变更（改变）数据库表

DROP TABLE
删除表

CREATE INDEX
创建索引（搜索键）

DROP INDEX
删除索引
