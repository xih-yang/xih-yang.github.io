# 13、MariaDB 删除查询
- 来源：https://ddkk.com/zhuanlan/db/mariadb/13.html
- 分类：缓存数据库
- 分组：教程目录
DELETE命令从指定的表中删除表行，并返回已删除的数量。 访问使用ROW_COUNT()函数删除的数量。 WHERE子句指定行，如果没有行，则删除所有行。 LIMIT子句控制删除的行数。

在多行的DELETE语句中，它只删除满足条件的那些行; 并且不允许LIMIT和WHERE子句。 DELETE语句允许从不同数据库中的表中删除行，但不允许从表中删除，然后从子查询中的同一个表中进行选择。

查看以下DELETE语法 –

```sql
DELETE FROM table_name [WHERE …]
```

从命令提示符或使用PHP脚本执行DELETE命令。

## 命令提示符

在命令提示符下，只需使用标准命令 –

```sql
root@host# mysql –u root –p password;
Enter password:*******
mysql> use PRODUCTS;
Database changed
mysql> DELETE FROM products_tbl WHERE product_id=133;
mysql> SELECT * from products_tbl WHERE ID_number='133';
ERROR 1032 (HY000): Can't find record in 'products_tbl'
```

## PHP删除查询脚本

在DELETE命令语句中使用**mysql_query()**函数 –

```php
<?php
   $dbhost = 'localhost:3036';
   $dbuser = 'root';
   $dbpass = 'rootpassword';
   $conn = mysql_connect($dbhost, $dbuser, $dbpass);
   if(! $conn ) {
      die('Could not connect: ' . mysql_error());
   }
   $sql = 'DELETE FROM products_tbl WHERE product_id = 261';
   mysql_select_db('PRODUCTS');
   $retval = mysql_query( $sql, $conn );
   if(! $retval ) {
      die('Could not delete data: ' . mysql_error());
   }
   echo "Deleted data successfully
";
   mysql_close($conn);
?>
```

成功删除数据后，您将看到以下输出 –

```sql
mysql> Deleted data successfully
mysql> SELECT * from products_tbl WHERE ID_number='261';
ERROR 1032 (HY000): Can't find record in 'products_tbl'
```
