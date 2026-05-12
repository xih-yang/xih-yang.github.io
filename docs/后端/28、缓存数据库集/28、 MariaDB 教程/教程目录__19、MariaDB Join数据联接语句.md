# 19、MariaDB Join数据联接语句
- 来源：https://ddkk.com/zhuanlan/db/mariadb/19.html
- 分类：缓存数据库
- 分组：教程目录
在之前的讨论和示例中，我们检查了从单个表中检索，或从多个来源检索多个值。 大多数现实世界的数据操作要复杂得多，需要从多个表进行聚合，比较和检索。

JOIN允许将两个或多个表合并到单个对象中。 它们通过SELECT，UPDATE和DELETE语句使用。

使用JOIN查看语句的一般语法如下所示 –

```sql
SELECT column
FROM table_name1
INNER JOIN table_name2
ON table_name1.column = table_name2.column;
```

注意JOINS的旧语法使用隐式连接和没有关键字。 可以使用WHERE子句来实现联接，但关键字最适合可读性，维护和最佳实践。

JOIN有许多形式，如左连接，右连接或内连接。 各种连接类型基于共享值或特性提供不同类型的聚合。

在命令提示符或PHP脚本中使用JOIN。

## 命令提示符

在命令提示符下，只需使用标准语句 –

```sql
root@host# mysql -u root -p password;
Enter password:*******
mysql> use PRODUCTS;
Database changed
mysql> SELECT products.ID_number, products.Nomenclature, inventory.inventory_ct
   FROM products
   INNER JOIN inventory
   ON products.ID_numbeer = inventory.ID_number;
+-------------+----------------+-----------------+
| ID_number   | Nomenclature   | Inventory Count |
+-------------+----------------+-----------------+
| 12345       | Orbitron 4000  | 150             |
+-------------+----------------+-----------------+
| 12346       | Orbitron 3000  | 200             |
+-------------+----------------+-----------------+
| 12347       | Orbitron 1000  | 0               |
+-------------+----------------+-----------------+
```

## PHP脚本使用JOIN

使用**mysql_query()**函数执行连接操作 –

```php
<?php
   $dbhost = 'localhost:3036';
   $dbuser = 'root';
   $dbpass = 'rootpassword';
   $conn = mysql_connect($dbhost, $dbuser, $dbpass);
   if(! $conn ) {
      die('Could not connect: ' . mysql_error());
   }
   $sql = 'SELECT a.product_id, a.product_manufacturer, b.product_count   
      FROM products_tbl a, pcount_tbl b 
      WHERE a.product_manufacturer = b.product_manufacturer';
   mysql_select_db('PRODUCTS');
   $retval = mysql_query( $sql, $conn );
   if(! $retval ) {
      die('Could not get data: ' . mysql_error());
   }
   while($row = mysql_fetch_array($retval, MYSQL_ASSOC)) {
      echo "Manufacturer:{$row['product_manufacturer']} <br> ".
         "Count: {$row['product_count']} <br> ".
         "Product ID: {$row['product_id']} <br> ".
         "--------------------------------<br>";
   }
   echo "Fetched data successfully
";
   mysql_close($conn);
?>
```

成功的数据检索后，您将看到以下输出 –

```sql
ID Number: 12345
Nomenclature: Orbitron 4000
Inventory Count: 150
--------------------------------------
ID Number: 12346
Nomenclature: Orbitron 3000
Inventory Count: 200
--------------------------------------
ID Number: 12347
Nomenclature: Orbitron 1000
Inventory Count: 0
--------------------------------------
mysql> Fetched data successfully
```
