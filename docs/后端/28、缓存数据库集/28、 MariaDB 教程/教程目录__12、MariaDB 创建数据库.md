# 12、MariaDB 创建数据库
- 来源：https://ddkk.com/zhuanlan/db/mariadb/12.html
- 分类：缓存数据库
- 分组：教程目录
在MariaDB中创建或删除数据库需要通常只授予root用户或管理员的权限。 在这些帐户下，您有两个选项来创建数据库 – mysqladmin二进制文件和PHP脚本。

## mysqladmin脚本

以下示例演示如何使用mysqladmin脚本创建名为Products的数据库 –

```sql
[root@host]# mysqladmin -u root -p create PRODUCTS
Enter password:******
```

## PHP创建数据库脚本

PHP在创建MariaDB数据库时使用mysql_query函数。 该函数使用两个参数，一个可选，并在成功时返回值“true”，否则返回“false”。

### 语法

查看以下**创建数据库**脚本语法 –

```sql
bool mysql_query( sql, connection );
```

参数的描述如下 –

S.No
参数和说明

1
SQL

该参数必须由所要执行操作的SQL查询组成。

2
connection

未指定时，此可选参数使用最近使用的连接。

尝试下面的示例代码来创建数据库 –

```php
<html>
   <head>
      <title>Create a MariaDB Database</title>
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
         $sql = 'CREATE DATABASE PRODUCTS';
         $retval = mysql_query( $sql, $conn );
         if(! $retval ) {
            die('Could not create database: ' . mysql_error());
         }
         echo "Database PRODUCTS created successfully
";
         mysql_close($conn);
      ?>
   </body>
</html>
```

成功删除后，您将看到以下输出 –

```sql
mysql> Database PRODUCTS created successfully 
mysql> SHOW DATABASES; 
+-----------------------+ 
| Database              | 
+-----------------------+ 
| PRODUCTS              | 
+-----------------------+  
```
