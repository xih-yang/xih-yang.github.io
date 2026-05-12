# 27、MariaDB 索引和统计表
- 来源：https://ddkk.com/zhuanlan/db/mariadb/27.html
- 分类：缓存数据库
- 分组：教程目录
索引是用于加速记录检索的工具。 索引为索引列中的每个值生成一个条目。

有四种类型的索引 –

- **Primary**（一条记录表示所有记录）
- **Unique**（一条记录表示多个记录）
- **Plain**
- **Full-Text**（允许文本搜索中的许多选项）。

术语“密钥”和“索引”在该用法中是相同的。

索引与一个或多个列关联，并支持快速搜索和高效的记录组织。 创建索引时，请考虑查询中经常使用的列。 然后在它们上创建一个或多个索引。 此外，将索引视为基本的主键表。

虽然索引加速搜索或SELECT语句，但由于对表和索引执行操作，它们使插入和更新拖动。

## 创建索引

您可以通过CREATE TABLE … INDEX语句或CREATE INDEX语句创建索引。 支持可读性，维护和最佳实践的最佳选项是CREATE INDEX。

查看下面给出的Index的一般语法 –

```sql
CREATE [UNIQUE or FULLTEXT or...] INDEX index_name ON table_name column;
```

回顾一个使用的例子 –

```sql
CREATE UNIQUE INDEX top_sellers ON products_tbl product;
```

## 删除索引

可以使用DROP INDEX或ALTER TABLE … DROP删除索引。 支持可读性，维护和最佳实践的最佳选项是DROP INDEX。

查看下面给出的Drop Index的一般语法 –

```sql
DROP INDEX index_name ON table_name;
```

回顾一个使用的例子 –

```sql
DROP INDEX top_sellers ON product_tbl;
```

## 重命名索引

使用ALTER TABLE语句重命名索引。 查看下面给出的一般语法 –

```sql
ALTER TABLE table_name DROP INDEX index_name, ADD INDEX new_index_name;
```

回顾一个使用的例子 –

```sql
ALTER TABLE products_tbl DROP INDEX top_sellers, ADD INDEX top_2016sellers;
```

## 管理索引

您将需要检查和跟踪所有索引。 使用SHOW INDEX列出与给定表相关联的所有现有索引。 您可以使用诸如“\ G”之类的选项来设置显示内容的格式，该选项指定垂直格式。

查看以下示例 –

```sql
mysql > SHOW INDEX FROM products_tblG
```

## 表统计

索引被大量使用以优化查询，因为更快地访问记录以及提供的统计信息。 然而，许多用户发现索引维护麻烦。 MariaDB 10.0使存储引擎独立统计表可用，它计算每个存储引擎中每个表的数据统计信息，甚至是未编制索引的列的统计信息。
