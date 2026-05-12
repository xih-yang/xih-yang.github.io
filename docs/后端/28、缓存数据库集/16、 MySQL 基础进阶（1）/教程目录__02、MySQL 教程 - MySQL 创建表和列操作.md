# 02、MySQL 教程 - MySQL 创建表和列操作
- 来源：https://ddkk.com/zhuanlan/db/mysql/5/2.html
- 分类：缓存数据库
- 分组：教程目录
本文来介绍MySQL数据库中创建表和列操作，我们知道有两种方式可以做这件事情，一个是图形化界面，第二个是命令行SQL语句。这里我们分别用图形化界面和命令行去创建表和列，先看看图形化界面的操作。

**1、** 我们找到前面在workbench里创建的数据库db1,右键选择新建表；

**2、** 在Query1这个面板里，我们设置表名称和相关列；

1)修改表名称为results

2)点击箭头，让列表显示出来

3)第一列，命名为id，数据类型为VARCHAR，长度改为255，勾选PK（主键），勾选NN（not null）,勾选AI（auto-increment）

4)第二列，名称为test_suite，数据类型为VARCHAR，长度改为255

5)第三列，名称为test_name，数据类型为VARCHAR，长度改为255，勾选NN（not null）

6)第四列，名称为test_status，数据类型为VARCHAR，长度改为10（标记pass or fail），勾选NN（not null）

检查没有问题后，点击Apply,在弹出界面，点击Apply。

**3、** 查看我们创建的表；

点击db1-Tables-results右键，选择查看表格数据

对比是否和刚刚创建的一致。

GUI的创建过程就到这里结束，下面看看我们用命令行如何创建上面这个过程。

**1、** 打开sql命令行界面；

在电脑上开始菜单-所有程序-MySQL-MySQL Server 5.7-Command Line Client Unicode，界面如下

输入root这个密码。

**2、** 查看数据库，可以看到db1；

注意命令结尾是分号。

**3、** 创建数据库和表；

1)用命令create database dbname来创建一个qa的数据库

2)命令use qa，进入qa这个数据库

3)这段命令就创建表，并创建id这个主键，规则和图形化界面一样，自己对比下

**4、** 创建其他列；

关于MySQL的图形化和命令行创建数据库、表和列就介绍到这里。
