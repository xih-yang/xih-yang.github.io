# 13、SQL Server 教程 - SQL Server avg函数
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/3/13.html
- 分类：缓存数据库
- 分组：教程目录
上一节里学习了sum函数，这一节我们学习avg函数。如果你没学这一节以前，我想你肯定还在为如何在sql server中求数据的平均值感到发愁吧。当你学习完这一节后，那些困扰你很久的问题将会变得迎刃而解，先看下avg函数的语法。

**SELECT avg("栏位名")

FROM "表格名"**

以tb_Teachers_info表为例：

tb_Teachers_info

如果我们想得到表中教师的平均年龄

select AVG(TeachersAge) 'Average ages' from tb_Teachers_info;

结果:

下一节sql server max,min函数
