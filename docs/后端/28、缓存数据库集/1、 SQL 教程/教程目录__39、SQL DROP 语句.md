# 39、SQL DROP 语句
- 来源：https://ddkk.com/zhuanlan/db/sql/39.html
- 分类：缓存数据库
- 分组：教程目录
SQLDROP 语句可以用于删除索引 、删除表 和 删除数据库

**1、** 删除索引；

删除索引使用 DROP INDEX 语句

```plaintext
### MS Access ###
```

```sql
DROP INDEX index_name ON table_name
```

```plaintext
### SQL Server ###
```

```sql
DROP INDEX table_name.index_name
```

```plaintext
### DB2/Oracle ###
```

```sql
DROP INDEX index_name
```

```plaintext
### MySQL ###
```

```sql
ALTER TABLE table_name DROP INDEX index_name
```

**2、** 删除表；

删除表使用 DROP TABLE 语句

这一点上，几乎主流数据库系统出奇的一致

```sql
DROP TABLE table_name
```

**3、** 删除数据库；

删除数据库使用 DROP DATABASE 语句

```sql
DROP DATABASE database_name
```

## TRUNCATE TABLE 语句

如果仅仅需要删除表内的数据，并复原表，但并不删除表本身，那么可以使用 TRUNCATE TABLE 语句

```sql
TRUNCATE TABLE table_name;
```
