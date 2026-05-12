# 07、SQL Server 教程 - SQL Server alias(别名)的用法
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/3/7.html
- 分类：缓存数据库
- 分组：教程目录
在这一节里主要alias在sql中的用法 ，最常见的alias有两种：栏位别名和表格别名。

简单而言栏位别名的目的是为了让SQL产生的结果易读，我们先看下栏位别名和表格

别名的语法:

**SELECT "表格别名"."栏位1" "栏位别名"

FROM "表格名""表格别名"**

我们继续以tb_Teachers_info教师信息表为例:

SQL语句:select A1.TeachersName'教师姓名'fromtb_Teachers_infoA1;

输出结果：

现在来解释下上面SQL语句的含义，由栏别名和表别名的使用语法不难看出’教师姓名’是

栏别名，而’A1’是表别名，细心的同学不难发现在SQL语句中使用了A1.TeachersName

而不是TeachersName，因为这里定义了表别名A1，这样可以直接为TeachersName定位，

说明它是在表A1下，不会让人误解。也许现在你没有发现alias的优势，但在选择多个表格

的时候就会体现出来。输出结果中的标题部门由原来的’TeachesName’变为栏别名’教师姓名’。

别名已经学习完了，你是否感触到它强大的优势呢......

下一节:Sql server中intersect, minus的用法
