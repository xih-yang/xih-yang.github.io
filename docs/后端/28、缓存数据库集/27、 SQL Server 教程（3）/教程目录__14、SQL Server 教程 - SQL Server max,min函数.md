# 14、SQL Server 教程 - SQL Server max,min函数
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/3/14.html
- 分类：缓存数据库
- 分组：教程目录
这一节将利用sql中的函数来求数据的最大值与最小值

以tb_Teachers_info表为例：

tb_Teachers_info

如果我们想得到表中教师的最大年龄

select MAX(TeachersAge) 'Max age' from tb_Teachers_info;

结果：

如果要得到教师的最小年龄

select Min(TeachersAge) 'Min age' from tb_Teachers_info;

结果:

下一节Sql server count函数
