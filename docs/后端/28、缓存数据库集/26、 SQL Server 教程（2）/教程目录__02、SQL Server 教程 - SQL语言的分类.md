# 02、SQL Server 教程 - SQL语言的分类
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/2/2.html
- 分类：缓存数据库
- 分组：教程目录
SQL（Structured Query Language，结构化查询语言）是用于数据库查询和设计的语言。

1．数据定义语言(DDL)

数据定义语言( DDL)，即Data Definition Language。所谓数据定义语言，就是指对数据表定义的语言。在数据定义语言中主要有CREATE、ALTER、DROP及TRUNCATE 4个关键字。其中，

- CREATE: 完成创建表的操作。
- ALTER：完成修改表的操作。
- DROP： 完成删除表的操作。：
- TRUNCATE： 使用它可以完成删除表中全部数据的操作。但是如果使用TRUNCATE删除数据，数据是不能恢复的，所以使用IRUNCATE删除表中数据的效率是比较高的。

2．数据操纵语言(DML)

数据操纵语言(DML)，即Data Manipulation Language。所谓数据操纵语言，是指对数据表中数据的操作。在数据操纵语言中主要有INSERT、UPDATE、DELETE 3个关键字。具体的相关含义如下。

- INSERT：完成向数据表中添加数据的操作。
- UPDATE：完成更新数据表中的数据。
- DELETE： 完成删除数据表中的数据。

3．数据控制语言(DCL)

数据控制语言(DCL)，即 Data Control Languge。所谓数据控制语言，是指对数据库中的用户进行权限的控制。在数据控制语言中主要有GRANT、DENY，REVOKE 3个关键字。它们的含义如下。

- GRANT：可以为数据库中用户授予权限。
- DEN Y： 可以限制数据库中用户的权限。
- REVOKE：可以撤销数据库中用户的权限。

4．数据查询语言(DQL)|

数据查询语言(DQL)，即Data Query Language。在有的书上也把DQL语言归到DML语言中。在数据查询语言中只有一个关键字，就是SELECT，主要用于查询数据表中的数据。查询可以说是数据表操作中最常用的一种操作，经常用于统计。
