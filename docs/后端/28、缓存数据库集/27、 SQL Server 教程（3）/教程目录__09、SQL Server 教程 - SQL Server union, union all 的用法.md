# 09、SQL Server 教程 - SQL Server union, union all 的用法
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/3/9.html
- 分类：缓存数据库
- 分组：教程目录
在上一节中我们了解了intersect, minus的用法，在这一节我们学习union, union all这

两个关键字，因为与intersect有相似之处，故我将其放于一起，便于读者们能够更好的掌握。现

在先看下union这个指令,union指令的目的是将两个SQL语句的结果合并起来，它的语法如下:

**[SQL 语句 1]

UNION

[SQL 语句 2]**

假设我们有两个表格:

tb_Teachers_info

tb_City_info

而我们要找到所有的TeachersName,要达到这样的目的，我们可以用SQL语句:

select TeachersName from tb_Teachers_info union select TeachersName from tb_City_info;

结果:

Union all这个指令的目的也是将两个SQL语句的结果合并起来，不过它与union的不同之处在

Union all会将所有的结果都列出来，包括重复的结果，这是它与union的不同之处。

它的用法:

**[SQL 语句 1]

UNION ALL

[SQL 语句 2]**

看下面这个SQL语句: select TeachersName from tb_Teachers_info union all select TeachersName from tb_City_info;

结果:

看了这两个例子，相信你一定知道了union与union all的区别了，也对sql server有一定的了解了，不过接下来我们还有很多要学的哦。

下一节.Sql server中in的用法
