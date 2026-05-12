# 14、MariaDB 删除数据库
- 来源：https://ddkk.com/zhuanlan/db/mariadb/14.html
- 分类：缓存数据库
- 分组：教程目录
在MariaDB中创建或删除数据库需要特权，通常仅授予root用户或管理员。 在这些帐户下，您有两个删除数据库的选项：mysqladmin二进制文件和PHP脚本。

请注意，删除的数据库是不可恢复的，因此请谨慎执行此操作。 此外，用于删除的PHP脚本不会提示您在删除之前的确认。

## mysqladmin脚本

以下示例演示如何使用mysqladmin脚本删除现有数据库 –

```php
[root@host]# mysqladmin -u root -p drop PRODUCTS
Enter password:******
mysql> DROP PRODUCTS
ERROR 1008 (HY000): Can't drop database 'PRODUCTS'; database doesn't exist
```

## PHP删除数据库脚本

PHP在删除MariaDB数据库时使用mysql_query函数。 该函数使用两个参数，一个可选，并在成功时返回值“true”，否则返回“false”。

### 语法

查看以下删除数据库脚本语法 –

```sql
bool mysql_query( sql, connection );
```

参数的说明下面给出 –

S.No
参数和说明

1
SQL

此必需参数由执行操作所需的SQL查询组成。

2
connection

未指定时，此可选参数使用最近使用的连接。

尝试下面的示例代码删除数据库 –

```php
<html>
   <head>
      <title>Delete a MariaDB Database</title>
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
         $sql = 'DROP DATABASE PRODUCTS';
         $retval = mysql_query( $sql, $conn );
         if(! $retval ){
            die('Could not delete database: ' . mysql_error());
         }
         echo "Database PRODUCTS deleted successfully
";
         mysql_close($conn);
      ?>
   </body>
</html>
```

成功删除后，您将看到以下输出 –

```sql
mysql> Database PRODUCTS deleted successfully 
```
