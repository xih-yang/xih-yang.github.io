# 06、MySQL 教程 - MySQL 服务端和客户端交互过程
- 来源：https://ddkk.com/zhuanlan/db/mysql/5/6.html
- 分类：缓存数据库
- 分组：教程目录
上一篇介绍了几个关键字，下面继续介绍几个SQL常见的简写。然后介绍下Mysql中服务端和客户端的交互过程，了解下这个交互过程的具体细节过程。

## 一．几个单词简写

**SQL**：Structured QueryLanguage, 结构化查询语言（数据以查询为主）

SQL分为三个部分

**DDL**： Data Definition Language, 数据定义语言，用来维护存储数据的结构（数据库，表），代表指 令：create, drop, alter等。

**DML**：Data Manipulation Language, 数据操作语言，用来对数据的操作（数据表中内容），代表指令：insert, delete, update等：其中DML内部又单独进行了一个分类：DQL(Data Query Language:数据查询语言，例如 select)

**DCL**：Data Control Language, 数据控制语言，主要是复制权限管理（用户），代表指令：grant, revoke等。

为什么叫结构化查询语言呢，因为数据库操作中，查询操作占百分之99，剩下的就是其他指令的操作。SQL是关系数据库的操作指令，是一种约束，但不强制的标准。所以，在不同数据库产品中，可以存在SQL语句有细微的差别。例如，在SQL Server中，我们可以使用top关键字来查询某一个列前面几项数据，但是在Mysql中我们得用limit关键字，不能使用top。

## 二．Mysql服务端和客户端的交互过程

Mysql是一个c/s架构的软件，所以有服务端和客户端，服务端一般在机房长期运行，客户端在需要使用的时候才启动，想要访问服务器必须要在客户端进行连接和授权认证过程。具体服务端和客户端的交互过程如下。

**1、** 客户端连接服务端并认证，mysql.exe–hPup；

这里如果想要实现下面图的cmd输入命令，需要提前把mysql安装位置添加到系统path这个环境变量。

**2、** 客户端发送SQL指令；

**3、** 服务端接收指SQL指令，处理指令，发送结果；

**4、** 客户端接收结果，显示结果；

上面数据指令是 show databases; 分号后面的“—查看所有数据库”这个字符串是我写的注释。

**5、** 断开连接，释放资源（服务器并发限制）；

在cmd窗口退出数据库连接有三种方法，命令分别是 eixt, quit, \q

在Mysql中服务端和客户端交互的过程就是上面介绍的这样，处了在cmd里输入操作指令，我们还可以在mysql提供的Workbench这个工具，或者网络上其他的好用客户端，例如SQLyogEnt.exe，图标是一个小海豚，很多人应该用过。
