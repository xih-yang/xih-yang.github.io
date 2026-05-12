# 02、SQL Server 教程 - SQL Server 选择语句
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/3/2.html
- 分类：缓存数据库
- 分组：教程目录
在这一节中我们将正式开始学习Sqlserver,下面开始学习select语句：

Select语句在sql中是比较复杂的，下面我们开始最简单的select语句,在数据库的深入和扩展中我会继续深入讲解select语句，这里只是讲解了一些最基本的select语句。

下面有个tb_Students_info(学生信息表)

现在对这个表作一些操作

**1、** 将这个表的全部信息显示出来；

你只需要写入:select *from tb_Students_info;就ok，呵呵，是不是挺容易的阿，下面我们增加点难度。

**2、** 选择学生信息表的前两行打印出来；

Sql语句:select top 2 *from tb_Students_info;

输出结果:

刚开始学时，好奇的你可能会对*的含义表示不理解，这个*表示选择所有的表的默认的列，既表中有多少列 它都会显示出来，那么要仅选择某一列该怎么办呢，看下面这个例子

**3、** 选择学生信息表的StudentsName；

Sql语句:select StudentsName from tb_Students_info;

输出结果:

看了这些相信你对选择语句有了一定的了解吧，

下一节Sql server 插入语句
