# 26、MariaDB 表更改命令
- 来源：https://ddkk.com/zhuanlan/db/mariadb/26.html
- 分类：缓存数据库
- 分组：教程目录
ALTER命令提供了一种方法来更改现有表的结构，这意味着删除或添加列，修改索引，更改数据类型或更改名称等修改。 ALTER还会在元数据锁定处于活动状态时等待应用更改。

## 使用ALTER修改列

ALTER与DROP配对会删除现有列。 但是，如果列是唯一的剩余列，它将失败。

查看下面给出的示例 –

```sql
mysql> ALTER TABLE products_tbl DROP version_num;
```

使用ALTER … ADD语句添加列 –

```sql
mysql> ALTER TABLE products_tbl ADD discontinued CHAR(1);
```

使用关键字FIRST和AFTER指定列的位置 –

```sql
ALTER TABLE products_tbl ADD discontinued CHAR(1) FIRST;
ALTER TABLE products_tbl ADD discontinued CHAR(1) AFTER quantity;
```

注意FIRST和AFTER关键字只适用于ALTER … ADD语句。 此外，您必须删除一个表，然后添加它，以重新定位它。

使用ALTER语句中的MODIFY或CHANGE子句更改列定义或名称。 这些子句具有类似的效果，但是使用明显不同的语法。

查看下面给出的CHANGE示例 –

```sql
mysql> ALTER TABLE products_tbl CHANGE discontinued status CHAR(4);
```

在使用CHANGE的语句中，指定原始列，然后指定将替换它的新列。 查看下面的MODIFY示例 –

```sql
mysql> ALTER TABLE products_tbl MODIFY discontinued CHAR(4);
```

ALTER命令还允许更改默认值。 查看示例 –

```sql
mysql> ALTER TABLE products_tbl ALTER discontinued SET DEFAULT N;
```

您还可以使用它通过将其与DROP子句配对来删除默认约束 –

```sql
mysql> ALTER TABLE products_tbl ALTER discontinued DROP DEFAULT;
```

## 使用ALTER修改表

使用TYPE子句更改表类型 –

```sql
mysql> ALTER TABLE products_tbl TYPE = INNODB;
```

重命名具有RENAME关键字的表 –

```sql
mysql> ALTER TABLE products_tbl RENAME TO products2016_tbl;
```
