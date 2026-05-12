# 10、MariaDB 建立连接
- 来源：https://ddkk.com/zhuanlan/db/mariadb/10.html
- 分类：缓存数据库
- 分组：教程目录
与MariaDB建立连接的一种方法是在命令提示符下使用mysql二进制文件。

## MySQL脚本

查看下面给出的示例。

```sql
[root@host]# mysql -u root -p
Enter password:******
```

上面给出的代码连接到MariaDB并提供一个命令提示符来执行SQL命令。 输入代码后，将显示一条欢迎消息，指示连接成功，并显示版本号。

```sql
Welcome to the MariaDB monitor. Commands end with ; or g. 
Your MariaDB connection id is 122323232 
Server version: 5.5.40-MariaDB-log
Type 'help;' or 'h' for help. Type 'c' to clear the current input statement.  
mysql> 
```

该示例使用根访问权限，但任何具有权限的用户当然可以访问MariaDB提示并执行操作。

通过exit命令断开与**MariaDB**的连接，如下所示 –

```sql
mysql> exit
```

## PHP连接脚本

连接到MariaDB并与之断开连接的另一种方法是使用PHP脚本。 PHP提供了用于打开数据库连接的**mysql_connect()**函数。 它使用五个可选参数，并在成功连接后返回MariaDB链接标识符，或在失败的连接上返回false。 它还提供了用于关闭数据库连接的**mysql_close()**函数，它使用单个参数。

### 语法

查看以下PHP连接脚本语法 –

```sql
connection mysql_connect(server,user,passwd,new_link,client_flag);
```

参数的描述如下 –

S.No
参数和说明

1
server

此可选参数指定运行数据库服务器的主机名。 其默认值为“localhost：.3036”。

2
user

此可选参数指定访问数据库的用户名。 其默认值是服务器的所有者。

3

**passwd**

此可选参数指定用户的密码。 其默认值为空。

4

**new_link**

此可选参数指定在使用相同参数的第二次调用**mysql_connect()**时，而不是新连接，将返回当前连接的标识符。

5

**client flags – 客户端的标志**

此可选参数使用以下常量值的组合 –

- MYSQL_CLIENT_SSL – 它使用ssl加密。
- MYSQL_CLIENT_COMPRESS – 它使用压缩协议。
- MYSQL_CLIENT_IGNORE_SPACE – 它允许函数名后的空格。
- MYSQL_CLIENT_INTERACTIVE – 它允许在关闭连接之前交互式超时秒数不活动。

请查看下面给出的PHP断开脚本语法 –

```sql
bool mysql_close ( resource $link_identifier );
```

如果省略资源，则最近打开的资源将关闭。 它在成功关闭时返回true，或false。

尝试下面的示例代码连接MariaDB服务器 –

```php
<html>
   <head>
      <title>Connect to MariaDB Server</title>
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
         mysql_close($conn);
      ?>
   </body>
</html>
```

成功连接后，你会看到下面的输出 –

```sql
mysql> Connected successfully
```
