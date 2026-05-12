# 15、MariaDB like子句
- 来源：https://ddkk.com/zhuanlan/db/mariadb/15.html
- 分类：缓存数据库
- 分组：教程目录
WHERE子句提供了一种在操作使用完全匹配时检索数据的方法。 在需要具有共享特征的多个结果的情况下，LIKE子句适应宽模式匹配。

LIKE子句测试模式匹配，返回true或false。 用于比较的模式接受以下通配符：”%”，其匹配字符数（0或更多）; 和”_”，它匹配单个字符。 “_”通配符只匹配其集合中的字符，这意味着当使用另一个集合时，它将忽略拉丁字符。 匹配在默认情况下不区分大小写，需要对大小写敏感的附加设置。

NOTLIKE子句允许测试相反的条件，非常类似于非运算符。

如果语句表达式或模式求值为NULL，则结果为NULL。

查看下面给出的一般LIKE子句语法 –

```sql
SELECT field, field2,... FROM table_name, table_name2,...
WHERE field LIKE condition
```

在命令提示符或PHP脚本中使用LIKE子句。

## 命令提示符

在命令提示符下，只需使用标准命令 –

```sql
root@host# mysql -u root -p password;
Enter password:*******
mysql> use TUTORIALS;
Database changed
mysql> SELECT * from products_tbl
   WHERE product_manufacturer LIKE 'XYZ%';
+-------------+----------------+----------------------+
| ID_number   | Nomenclature   | product_manufacturer |
+-------------+----------------+----------------------+
| 12345       | Orbitron 4000  | XYZ Corp             |
+-------------+----------------+----------------------+
| 12346       | Orbitron 3000  | XYZ Corp             |
+-------------+----------------+----------------------+
| 12347       | Orbitron 1000  | XYZ Corp             |
+-------------+----------------+----------------------+
```

## PHP脚本使用like子句

在使用LIKE子句的语句中使用mysql_query（）函数

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
      FROM products_tbl WHERE product_manufacturer LIKE "xyz%"';
   mysql_select_db('PRODUCTS');
   $retval = mysql_query( $sql, $conn );
   if(! $retval ) {
      die('Could not get data: ' . mysql_error());
   }
   while($row = mysql_fetch_array($retval, MYSQL_ASSOC)) {
      echo "Product ID:{$row['product_id']} <br> ".
         "Name: {$row['product_name']} <br> ".
         "Manufacturer: {$row['product_manufacturer']} <br> ".
         "Ship Date: {$row['ship_date']} <br> ".
         "--------------------------------<br>";
   }
   echo "Fetched data successfully
";
   mysql_close($conn);
?>
```

成功的数据检索后，您将看到以下输出 –

```sh
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
Product ID: 12347
Nomenclature: Orbitron 1000
Manufacturer: XYZ Corp
Ship Date: 01/02/17
----------------------------------------------
mysql> Fetched data successfully
```
