# 17、MariaDB ORDER BY排序子句
- 来源：https://ddkk.com/zhuanlan/db/mariadb/17.html
- 分类：缓存数据库
- 分组：教程目录
如前面讨论中提到的，ORDER BY子句对语句的结果进行排序。 它指定操作数据的顺序，并包括按升序（ASC）或降序（DESC）顺序排序的选项。 在省略订单规格时，默认顺序为升序。

ORDER BY子句出现在各种各样的语句中，例如DELETE和UPDATE。 它们总是出现在语句的结尾，而不是在子查询中或在set函数之前，因为它们在最终结果表上操作。 您也不能使用整数来标识列。

查看下面给出的ORDER BY子句的一般语法 –

```sql
SELECT field, field2,... [or column] FROM table_name, table_name2,...
ORDER BY field, field2,... ASC[or DESC]
```

在命令提示符处或PHP脚本中使用ORDER BY子句。

## 命令提示符

在命令提示符下，只需使用标准命令 –

```sql
root@ host# mysql -u root -p password;
Enter password:*******
mysql> use PRODUCTS;
Database changed
mysql> SELECT * from products_tbl ORDER BY product_manufacturer ASC
+-------------+----------------+----------------------+
| ID_number   | Nomenclature   | product_manufacturer |
+-------------+----------------+----------------------+
| 56789       | SuperBlast 400 | LMN Corp             |
+-------------+----------------+----------------------+
| 67891       | Zoomzoom 5000  | QFT Corp             |
+-------------+----------------+----------------------+
| 12347       | Orbitron 1000  | XYZ Corp             |
+-------------+----------------+----------------------+
```

## PHP脚本中使用ORDER BY子句

在使用ORDER BY子句的语句中再次使用mysql_query()函数 –

```php
<?php
   $dbhost = 'localhost:3036';
   $dbuser = 'root';
   $dbpass = 'rootpassword';
   $conn = mysql_connect($dbhost, $dbuser, $dbpass);
   if(! $conn ) {
      die('Could not connect: ' . mysql_error());
   }
   $sql = 'SELECT product_id, product_name, product_manufacturer, ship_date 
      FROM products_tbl ORDER BY product_manufacturer DESC';
   mysql_select_db('PRODUCTS');
   $retval = mysql_query( $sql, $conn );
   if(! $retval ) {
      die('Could not get data: ' . mysql_error());
   }
   while($row = mysql_fetch_array($retval, MYSQL_ASSOC)) {
      echo "Product ID :{$row['product_id']} <br> ".
         "Name: {$row['product_name']} <br> ".
         "Manufacturer: {$row['product_manufacturer']} <br> ".
         "Ship Date : {$row['ship_date']} <br> ".
         "--------------------------------<br>";
   }
   echo "Fetched data successfully
";
   mysql_close($conn);
?>
```

成功的数据检索后，您将看到以下输出 –

```sql
Product ID: 12347
Nomenclature: Orbitron 1000
Manufacturer: XYZ Corp
Ship Date: 01/01/17
----------------------------------------------
Product ID: 67891
Nomenclature: Zoomzoom 5000
Manufacturer: QFT Corp
Ship Date: 01/01/17
----------------------------------------------
Product ID: 56789
Nomenclature: SuperBlast 400
Manufacturer: LMN Corp
Ship Date: 01/04/17
----------------------------------------------
mysql> Fetched data successfully
```
