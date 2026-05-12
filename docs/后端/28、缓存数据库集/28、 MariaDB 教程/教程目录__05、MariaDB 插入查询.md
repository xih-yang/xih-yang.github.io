# 05、MariaDB 插入查询
- 来源：https://ddkk.com/zhuanlan/db/mariadb/5.html
- 分类：缓存数据库
- 分组：教程目录
在本章中，我们将学习如何在表中插入数据。

将数据插入表需要INSERT命令。 该命令的一般语法是INSERT，后跟表名，字段和值。

查看下面给出的一般语法 –

```sql
INSERT INTO tablename (field,field2,...) VALUES (value, value2,...);
```

该语句需要对字符串值使用单引号或双引号。 语句的其他选项包括“INSERT … SET”语句，“INSERT … SELECT”语句和其他几个选项。

**注意** - 出现在语句中的VALUES（）函数仅适用于INSERT语句，如果在其他位置使用，则返回NULL。

存在两种执行操作的选项：使用命令行或使用PHP脚本。

## 命令提示符

在提示时，有许多方法来执行选择操作。 下面给出标准语句 –

```sql
belowmysql>
INSERT INTO products_tbl (ID_number, Nomenclature) VALUES (12345,
“Orbitron 4000”);
mysql> SHOW COLUMNS FROM products_tbl;
+-------------+-------------+------+-----+---------+-------+
| Field       | Type        | Null | Key | Default | Extra |
+-------------+-------------+------+-----+---------+-------+
| ID_number   | int(5)      |      |     |         |       |
| Nomenclature| char(13)    |      |     |         |       |
+-------------+-------------+------+-----+---------+-------+
```

您可以插入多行 –

```sql
INSERT INTO products VALUES (1, “first row”), (2, “second row”);
```

您还可以使用SET子句 –

```sql
INSERT INTO products SELECT * FROM inventory WHERE status = 'available';
```

## PHP插入脚本

在PHP函数中使用相同的“INSERT INTO …”语句来执行操作。 您将再次使用**mysql_query()**函数。

查看下面给出的示例 –

```php
<?php
   if(isset($_POST['add'])) {
      $dbhost = 'localhost:3036';
      $dbuser = 'root';
      $dbpass = 'rootpassword';
      $conn = mysql_connect($dbhost, $dbuser, $dbpass);
      if(! $conn ) {
         die('Could not connect: ' . mysql_error());
      }
      if(! get_magic_quotes_gpc() ) {
         $product_name = addslashes ($_POST['product_name']);
         $product_manufacturer = addslashes ($_POST['product_name']);
      } else {
         $product_name = $_POST['product_name'];
         $product_manufacturer = $_POST['product_manufacturer'];
      }
      $ship_date = $_POST['ship_date'];
      $sql = "INSERT INTO products_tbl ".
         "(product_name,product_manufacturer, ship_date) ".
         "VALUES"."('$product_name','$product_manufacturer','$ship_date')";
      mysql_select_db('PRODUCTS');
      $retval = mysql_query( $sql, $conn );
      if(! $retval ) {
         die('Could not enter data: ' . mysql_error());
      }
      echo "Entered data successfully
";
      mysql_close($conn);
   }
?>
```

成功插入数据后，您将看到以下输出 –

```sql
mysql> Entered data successfully
```

您还将使用insert语句来合作验证语句，例如检查以确保正确的数据输入。 MariaDB包括许多选项，其中一些是自动的。
