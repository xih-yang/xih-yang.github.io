# 03、MariaDB 创建表
- 来源：https://ddkk.com/zhuanlan/db/mariadb/3.html
- 分类：缓存数据库
- 分组：教程目录
在本章中，我们将学习如何创建表。 在创建表之前，首先确定其名称，字段名称和字段定义。

以下是表创建的一般语法：

```sql
CREATE TABLE table_name (column_name column_type);
```

查看在PRODUCTS数据库中创建表所使用的命令 –

```sql
databaseproducts_ tbl(
   product_id INT NOT NULL AUTO_INCREMENT,
   product_name VARCHAR(100) NOT NULL,
   product_manufacturer VARCHAR(40) NOT NULL,
   submission_date DATE,
   PRIMARY KEY ( product_id )
);
```

上述示例使用“NOT NULL”作为字段属性，以避免由空值导致的错误。 属性“AUTO_INCREMENT”指示MariaDB将下一个可用值添加到ID字段。 关键字主键将列定义为主键。 多个列以逗号分隔可以定义主键。

创建表的两个主要方法是使用命令提示符和PHP脚本。

## 命令提示符

使用CREATE TABLE命令执行任务，如下所示 –

```sql
root@host# mysql -u root -p
Enter password:*******
mysql> use PRODUCTS;
Database changed
mysql> CREATE TABLE products_tbl(
   -> product_id INT NOT NULL AUTO_INCREMENT,
   -> product_name VARCHAR(100) NOT NULL,
   -> product_manufacturer VARCHAR(40) NOT NULL,
   -> submission_date DATE,
   -> PRIMARY KEY ( product_id )
   -> );
mysql> SHOW TABLES;
+------------------------+
| PRODUCTS               |
+------------------------+
| products_tbl           |
+------------------------+
```

确保所有命令都以分号结尾。

## PHP创建表脚本

PHP为表创建提供mysql_query()。 它的第二个参数包含必要的SQL命令 –

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
         if(! $conn ){
            die('Could not connect: ' . mysql_error());
         }
         echo 'Connected successfully<br />';
         $sql = "CREATE TABLE products_tbl( ".
            "product_id INT NOT NULL AUTO_INCREMENT, ".
            "product_name VARCHAR(100) NOT NULL, ".
            "product_manufacturer VARCHAR(40) NOT NULL, ".
            "submission_date DATE, ".
            "PRIMARY KEY ( product_id )); ";
         mysql_select_db( 'PRODUCTS' );
         $retval = mysql_query( $sql, $conn );
         if(! $retval ) {
            die('Could not create table: ' . mysql_error());
         }
         echo "Table created successfully
";
         mysql_close($conn);
      ?>
   </body>
</html>
```

在成功创建表，你会看到下面的输出 –

```sql
mysql> Table created successfully
```
