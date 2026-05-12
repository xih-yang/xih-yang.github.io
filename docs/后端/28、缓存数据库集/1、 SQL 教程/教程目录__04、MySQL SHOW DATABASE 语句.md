# 04、MySQL SHOW DATABASE 语句
- 来源：https://ddkk.com/zhuanlan/db/sql/4.html
- 分类：缓存数据库
- 分组：教程目录
MySQL SHOW DATABASE 语句用于列出数据库系统中所有的数据库

```sql
SHOW DATABASE;
```

## MySQL SHOW DATABASE 范例

我们可以使用 SHOW DATABASES; SQL 语句来查看我们 MySQL 数据库系统中所有的数据库

```sql
mysql> SHOW DATABASES;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| performance_schema |
| test               |
| ddkk               |
+--------------------+
```

如果当前数据库系统中没有你想要的数据库，那么可以通过 CREATE DATABASE 语句来创建
