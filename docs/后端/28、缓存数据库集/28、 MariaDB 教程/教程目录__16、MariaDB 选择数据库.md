# 16、MariaDB 选择数据库
- 来源：https://ddkk.com/zhuanlan/db/mariadb/16.html
- 分类：缓存数据库
- 分组：教程目录
连接到MariaDB后，必须选择要使用的数据库，因为许多数据库可能存在。 有两种方法来执行此任务：从命令提示符或通过PHP脚本。

## 命令提示符

在命令提示符下选择数据库时，只需使用SQL命令’**use**‘

```sql
[root@host]# mysql -u root -p
Enter password:******
mysql> use PRODUCTS;
Database changed
mysql> SELECT database();  
+-------------------------+ 
| Database                | 
+-------------------------+ 
| PRODUCTS                | 
+-------------------------+ 
```

一旦选择了数据库，所有后续命令将在选定的数据库上操作。

**注意** - 所有名称（例如，数据库，表，字段）区分大小写。 确保命令符合正确的大小写。

## PHP选择数据库脚本

PHP提供了用于数据库选择的**mysql_select_db**函数。 该函数使用两个参数，一个可选，并在成功选择时返回值“true”，或者在失败时返回false。

### 语法

查看以下select数据库脚本语法。

```sql
bool mysql_select_db( db_name, connection );
```

参数的说明下面给出 –

S.No
参数和说明

1
DB_NAME

这需要参数指定要使用的数据库的名称。

2
连接

如果没有指定，此可选参数使用最近使用的连接。

尝试以下示例代码来选择数据库 –

```php
<html>
   <head>
      <title>Select a MariaDB Database</title>
   </head>
   <body>
      <?php
         $dbhost = 'localhost:3036';
         $dbuser = 'guest1';
         $dbpass = 'guest1a';
         $conn = mysql_connect($dbhost, $dbuser, $dbpass);
         if(! $conn ) {
            die('Could not connect: ' . mysql_error());
         }
         echo 'Connected successfully';
         mysql_select_db( 'PRODUCTS' );
         mysql_close($conn);
      ?>
   </body>
</html>
```

成功选择后，您将看到以下输出 –

```sql
mysql> Connected successfully 
```
