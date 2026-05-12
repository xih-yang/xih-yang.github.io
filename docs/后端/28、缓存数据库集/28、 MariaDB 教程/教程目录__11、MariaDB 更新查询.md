# 11、MariaDB 更新查询
- 来源：https://ddkk.com/zhuanlan/db/mariadb/11.html
- 分类：缓存数据库
- 分组：教程目录
**UPDATE**命令通过更改值来修改现有字段。 它使用SET子句指定要修改的列，并指定分配的新值。 这些值可以是字段的表达式或默认值。 设置默认值需要使用DEFAULT关键字。 该命令还可以使用WHERE子句来指定更新的条件和/或ORDER BY子句以特定顺序更新。

查看以下一般语法 –

```sql
UPDATE table_name SET field=new_value, field2=new_value2,...
[WHERE ...]
```

从命令提示符或使用PHP脚本执行UPDATE命令。

## 命令提示符

在命令提示符下，只需使用标准commandroot –

```sql
root@host# mysql -u root -p password;
Enter password:*******
mysql> use PRODUCTS;
Database changed
mysql> UPDATE products_tbl
   SET nomenclature = 'Fiber Blaster 300Z'
      WHERE ID_number = 112;
mysql> SELECT * from products_tbl WHERE ID_number='112';
+-------------+---------------------+----------------------+
| ID_number   | Nomenclature        | product_manufacturer |
+-------------+---------------------+----------------------+
| 112         | Fiber Blaster 300Z  | XYZ Corp             |
+-------------+---------------------+----------------------+      
```

## PHP更新查询脚本

在UPDATE命令语句中使用**mysql_query()**函数 –

```php
<?php
   $dbhost = ‘localhost:3036’;
   $dbuser = ‘root’;
   $dbpass = ‘rootpassword’;
   $conn = mysql_connect($dbhost, $dbuser, $dbpass);
   if(! $conn ) {
      die(‘Could not connect: ‘ . mysql_error());
   }
   $sql = ‘UPDATE products_tbl
      SET product_name = ”Fiber Blaster 300z”
      WHERE product_id = 112’;
   mysql_select_db(‘PRODUCTS’);
   $retval = mysql_query( $sql, $conn );
   if(! $retval ) {
      die(‘Could not update data: ‘ . mysql_error());
   }
   echo “Updated data successfully
”;
   mysql_close($conn);
?>
```

成功数据更新后，您将看到以下输出 –

```sql
mysql> Updated data successfully
```
