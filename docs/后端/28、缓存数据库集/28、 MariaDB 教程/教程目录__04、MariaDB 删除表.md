# 04、MariaDB 删除表
- 来源：https://ddkk.com/zhuanlan/db/mariadb/4.html
- 分类：缓存数据库
- 分组：教程目录
在本章中，我们将学习删除表。

表删除很容易，但记住所有删除的表是不可恢复的。 表删除的一般语法如下 –

```sql
DROP TABLE table_name ;
```

存在执行表删除的两个选项：使用命令提示符或PHP脚本。

## 命令提示符

在命令提示符下，只需使用DROP TABLE SQL命令 –

```sql
root@host# mysql -u root -p
Enter password:*******
mysql> use PRODUCTS;
Database changed
mysql> DROP TABLE products_tbl
mysql> SELECT * from products_tbl
ERROR 1146 (42S02): Table 'products_tbl' doesn't exist
```

## PHP 删除表脚本

PHP提供**mysql_query()**用于删除表。 简单地传递它的第二个参数适当的SQL命令 –

```html
<html>
   <head>
      <title>Create a MariaDB Table</title>
   </head>
   <body>
      <?php
         $dbhost = 'localhost:3036';
         $dbuser = 'root';
         $dbpass = 'rootpassword';
         $conn = mysql_connect($dbhost, $dbuser, $dbpass);
         if(! $conn ) {
            die('Could not connect: ' . mysql_error());
         }
         echo 'Connected successfully<br />';
         $sql = "DROP TABLE products_tbl";
         mysql_select_db( 'PRODUCTS' );
         $retval = mysql_query( $sql, $conn );
         if(! $retval ) {
            die('Could not delete table: ' . mysql_error());
         }
         echo "Table deleted successfully
";
         mysql_close($conn);
      ?>
   </body>
</html>
```

成功删除表后，您将看到以下输出 –

```sql
mysql> Table deleted successfully
```
