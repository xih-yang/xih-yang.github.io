# 23、MariaDB 备份加载方法
- 来源：https://ddkk.com/zhuanlan/db/mariadb/23.html
- 分类：缓存数据库
- 分组：教程目录
在本章中，我们将了解各种备份加载方法。 从备份还原数据库是一个简单，有时非常长的过程。

加载数据有三个选项：LOAD DATA语句，mysqlimport和一个简单的mysqldump还原。

## 使用LOAD DATA

LOAD DATA语句用作批量加载器。 查看加载文本文件的使用示例 –

```sql
mysql> LOAD DATA LOCAL INFILE 'products_copy.txt' INTO TABLE empty_tbl;
```

请注意LOAD DATA语句的以下质量：

- 使用LOCAL关键字可防止MariaDB对主机执行深层搜索，并使用非常具体的路径。
- 语句假定一种格式，包括由换行符（换行符）终止的行和用制表符分隔的数据值。
- 使用FIELDS子句可以明确指定行上字段的格式。 使用LINES子句指定行尾。 查看下面的示例。

```sql
mysql> LOAD DATA LOCAL INFILE 'products_copy.txt' INTO TABLE empty_tbl
   FIELDS TERMINATED BY '|'
   LINES TERMINATED BY '
';
```

- 该语句假定数据文件中的列使用表的相同顺序。 如果您需要设置不同的顺序，您可以加载文件如下 –

```sql
mysql> LOAD DATA LOCAL INFILE 'products_copy.txt' INTO TABLE empty_tbl (c, b, a);
```

## 使用MYSQLIMPORT

mysqlimport工具用作LOAD DATA包装器，允许从命令行进行相同的操作。

加载数据如下 –

```sql
$ mysqlimport -u root -p --local database_name source_file.txt
```

指定格式如下 –

```sql
$ mysqlimport -u root -p --local --fields-terminated-by="|" 
   --lines-terminated-by="
" database_name source_file.txt
```

使用–columns选项指定列顺序 –

```sql
$ mysqlimport -u root -p --local --columns=c,b,a 
   database_name source_file.txt
```

## 使用MYSQLDUMP

使用**mysqldump**还原需要这个简单的语句将转储文件加载回主机 –

```sql
shell> mysql database_name < source_file.sql
```

### 特殊字符和报价

在LOAD DATA语句中，引号和特殊字符可能无法正确解释。 语句采用不带引号的值，并将反斜线视为转义字符。 使用FIELDS子句指定格式。 指向带有“ENCLOSED BY BY”的引号，这将导致从数据值中去除引号。 使用“ESCAPED BY”更改转义。
