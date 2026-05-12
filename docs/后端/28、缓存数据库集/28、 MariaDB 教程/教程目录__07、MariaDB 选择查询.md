# 07、MariaDB 选择查询
- 来源：https://ddkk.com/zhuanlan/db/mariadb/7.html
- 分类：缓存数据库
- 分组：教程目录
在本章中，我们将学习如何从表中选择数据。

SELECT语句检索所选行。 它们可以包括UNION语句，排序子句，LIMIT子句，WHERE子句，GROUP BY … HAVING子句和子查询。

查看以下一般语法 –

```sql
SELECT field, field2,... FROM table_name, table_name2,... WHERE...
```

SELECT语句提供了多个选项来指定使用的表 –

- database_name.table_name
- table_name.column_name
- database_name.table_name.column_name

所有select语句必须包含一个或多个select表达式。 选择表达式由以下选项之一组成 –

- 列名。
- 使用运算符和函数的表达式。
- 规范”table_name.*”以选择给定表中的所有列。
- 字符”*”用于从FROM子句中指定的所有表中选择所有列。

可以在执行select语句时使用命令提示符或PHP脚本。

## 命令提示符

在命令提示符下，执行如下语句：

```sql
root@host# mysql -u root -p password;
Enter password:*******
mysql> use PRODUCTS;
Database changed
mysql> SELECT * from products_tbl
+-------------+---------------+
| ID_number   | Nomenclature  |
+-------------+---------------+
| 12345       | Orbitron 4000 |
+-------------+---------------+
```

## PHP选择脚本

在PHP函数中使用相同的SELECT语句来执行操作。 您将再次使用**mysql_query()**函数。 查看下面给出的示例 –

```php
<?php
   $dbhost = 'localhost:3036';
   $dbuser = 'root';
   $dbpass = 'rootpassword';
   $conn = mysql_connect($dbhost, $dbuser, $dbpass);
   if(! $conn ) {
      die('Could not connect: ' . mysql_error());
   }
   $sql = 'SELECT product_id, product_name,product_manufacturer, ship_date 
      FROM products_tbl';
   mysql_select_db('PRODUCTS');
   $retval = mysql_query( $sql, $conn );
   if(! $retval ) {
      die('Could not get data: ' . mysql_error());
   }
   while($row = mysql_fetch_array($retval, MYSQL_ASSOC)) {
      echo "Product ID :{$row['product_id']} <br> ".
         "Name: {$row['product_name']} <br> ".
         "Manufacturer: {$row['product_manufacturer']} <br> ".
         "Ship Date : {$row['ship_date']} <br>".
         "--------------------------------<br>";
   }
   echo "Fetched data successfully
";
   mysql_close($conn);
?>
```

在成功的数据检索，你会看到下面的输出 –

```sql
Product ID: 12345
Nomenclature: Orbitron 4000
Manufacturer: XYZ Corp
Ship Date: 01/01/17
----------------------------------------------
Product ID: 12346
Nomenclature: Orbitron 3000
Manufacturer: XYZ Corp
Ship Date: 01/02/17
----------------------------------------------
mysql> Fetched data successfully
```

最佳实践建议在每个SELECT语句之后释放游标内存。 PHP为此提供了**mysql_free_result()**函数。 审查其使用如下所示 –

```sql
<?php
   $dbhost = 'localhost:3036';
   $dbuser = 'root';
   $dbpass = 'rootpassword';
   $conn = mysql_connect($dbhost, $dbuser, $dbpass);
   if(! $conn ) {
      die('Could not connect: ' . mysql_error());
   }
   $sql = 'SELECT product_id, product_name, product_manufacturer, ship_date
      FROM products_tbl';
   mysql_select_db('PRODUCTS');
   $retval = mysql_query( $sql, $conn );
   if(! $retval ) {
      die('Could not get data: ' . mysql_error());
   }
   while($row = mysql_fetch_array($retval, MYSQL_NUM)) {
      echo "Product ID :{$row[0]} <br> ".
         "Name: {$row[1]} <br> ".
         "Manufacturer: {$row[2]} <br> ".
         "Ship Date : {$row[3]} <br> ".
         "--------------------------------<br>";
   }
   mysql_free_result($retval);
   echo "Fetched data successfully
";
   mysql_close($conn);
?>
```
