# 08、MariaDB PHP语法
- 来源：https://ddkk.com/zhuanlan/db/mariadb/8.html
- 分类：缓存数据库
- 分组：教程目录
MariaDB与各种编程语言和框架（如PHP，C＃，JavaScript，Ruby on Rails，Django等）合作良好。 PHP仍然是所有可用语言中最受欢迎的语言，因为它的简单性和历史足迹。 本指南将重点介绍与MariaDB合作的PHP。

PHP提供了使用MySQL数据库的一系列功能。 这些函数执行类似访问它或执行操作的任务，它们与MariaDB完全兼容。 只需调用这些函数，就像调用任何其他PHP函数。

您将用于MariaDB的PHP函数符合以下格式 –

```sql
mysql_function(value,value,...);
```

函数的第二部分指定其操作。 本指南中使用的两个功能如下 –

```sql
mysqli_connect($connect);
mysqli_query($connect,"SQL statement");
```

以下示例演示了对MariaDB函数的PHP调用的一般语法 –

```php
<html>
   <head>
      <title>PHP and MariaDB</title>
   </head>
   <body>
      <?php
         $retval = mysql_function(value, [value,...]);
         if( !$retval ) {
            die ( "Error: Error message here" );
         }
         // MariaDB or PHP Statements
      ?>
   </body>
</html>
```

在下一节中，我们将使用PHP函数来检查MariaDB的基本任务。
