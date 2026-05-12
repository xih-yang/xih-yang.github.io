# 12、SQL Server 教程 - SQL Server sum函数
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/3/12.html
- 分类：缓存数据库
- 分组：教程目录
从这一节开始我们将进入sql server学习的新阶段-sql 函数，在sql server中为我们提供了一些基本的函数包括sum(求和),avg(平均数),max(最大值),min(最小值),count(计数),在实际操作中有了这些函数会为我们的操作提供更大的便捷。

还是以tb_Teachers_info表为例:

tb_Teachers_info

假如我们想得到所有教师的总年龄，可以通过SQL语句:

select SUM(TeachersAge) 'Total ages' from tb_Teachers_info;

结果:

自己体验了一下sql server函数，你将会发现它的魅力所在，在下一节中让我们进一步深入它。

下一节Sql server avg函数
