# 15、SQL Server 教程 - SQL Server count函数
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/3/15.html
- 分类：缓存数据库
- 分组：教程目录
Count函数能让我们知道表格被选出来的数据的个数

它的语法:

**SELECT COUNT("栏位名")

FROM "表格名"**

以tb_Teachers_info表为例：

tb_Teachers_info

如果我们想得到表中教师的人数

select COUNT(TeachersName) 'count' from tb_Teachers_info;

结果:

也许学到这里，有些同学会问如何在sql server中如何创建表格，索引及视图，别急在下一章中我们将会详细讲解，不过在这之前我想先讲解一下它们的命名规范。

下一节表格，索引，及视图的命名规范
