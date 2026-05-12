# 24、SQL Server 教程 - SQL Server 多表查询
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/3/24.html
- 分类：缓存数据库
- 分组：教程目录
到这里我想大家已经掌握了sql server的基本知识，但是真正在企业中仅仅掌握这些知识还是不够的，这一节将讲解一下多表查询，如果要查询的数据置于两个及两个以上的表中，该如何办呢？

假如每个表都有超过1000条数据，如果有三个表，如果我们直接去查询的话，也许可以达到目的，但是这里我想告诉大家的是，直接查询会造成笛卡儿积非常大(这里的三个表，每个表数据都大于1000,所以直接查询的话它的笛卡儿积就大于1000的立方)，所以查询时尽量少用直接查询。

有人会问了，那用什么方法既可以达到目的，又可以避免笛卡尔积不至于过大呢？

当我们使用关联查询就可以解决这个问题，其实在实际查询中，大家肯定都已经使用了关联查询，那什么是关联查询呢？

关联查询即是将各表中相关联的数据提取出来进行查询，有了它，在多表查询中我们就可以节省不少查询时间和内存了。

假如我们有以下两个表：

tb_Teachers_info

tb_City_info

假如我们要查询出两个表中来China的教师的TeachersName 和City

SQL语句

select t.TeachersName,t.Cityfrom tb_Teachers_info t, tb_City_info c

where t.TeachersName=c.TeachersName;

输出结果：

下一节、Sql server中join的使用方法
