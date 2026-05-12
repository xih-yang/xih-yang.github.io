# 21、MySQL 调优 - MySQL 5.6忘记root密码
- 来源：https://ddkk.com/zhuanlan/db/mysql/3/21.html
- 分类：缓存数据库
- 分组：教程目录
## 一. 修改配置文件

首先找到mysql的配置文件，如: /etc/my.cnf

在[mysqld]字段下新增如下内容，然后保存退出。

```java
skip-grant-tables
```

然后重启mysql服务

```java
service mysqld restart
```

## 二. 修改root密码

使用空密码登陆mysql

```java
 mysql -uroot -p   -- 不输入密码直接回车
 USE mysql;
 UPDATE user SET Password = password('YourPassword') where user = 'root';
 flush privileges;
 exit
```

测试记录:

```java
[root@******~]# mysql -uroot -p
Enter password: 
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 1
Server version: 5.6.16-log MySQL Community Server (GPL)
Copyright (c) 2000, 2014, Oracle and/or its affiliates. All rights reserved.
Oracle is a registered trademark of Oracle Corporation and/or its
affiliates. Other names may be trademarks of their respective
owners.
Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.
mysql [(none)]> 
mysql [(none)]> USE mysql;
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A
Database changed
mysql [mysql]> UPDATE user SET Password = password('abc123') where user = 'root';
Query OK, 5 rows affected (0.00 sec)
Rows matched: 5  Changed: 5  Warnings: 0
mysql [mysql]> flush privileges;
Query OK, 0 rows affected (0.00 sec)
mysql [mysql]> exit
Bye
```

首先找到mysql的配置文件，如: /etc/my.cnf

在[mysqld]字段下删除如下内容，然后保存退出。

```java
skip-grant-tables
```

然后重启mysql服务

```java
service mysqld restart
```

最后就可以用修改的密码登陆mysql了。
