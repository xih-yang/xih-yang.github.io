# 18、SQL Server 教程 - SQL Server 视图的创建
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/3/18.html
- 分类：缓存数据库
- 分组：教程目录
视图可以其实可以把它当作虚拟表格。然而它与比表格不同之处是，在表格中可以存储实际的数据资料，而视图则不能，它只是基于表格之上的一个架构，本身不能存储任何资料。

创建语法如下:

**CREATE VIEW"VIEW_NAME" AS "SQL 语句"**

假设我们有tb_Teachers_info表，现在要在其上面创建一个含有TeachersId,TeachersName,TeachersAge的视图表。

SQL语句创建视图：

create view vi_teachersInfo

as

select TeachersId,TeachersName,TeachersAge from tb_Teachers_info;

现在我们可以在这个视图插入一个数据

insert into vi_teachersInfo(TeachersAge,TeachersId,TeachersName) values('38','1009','Raru');

查看视图结果：

select *from vi_teachersInfo;

其实视图和表格就类似于虚拟机与电脑之间的关系，你可以想象一下虚拟机在电脑上的功能，就可以知道views在table中的作用了，用这个例子作比较，相信你一定更好的理解并灵活的使用视图。

下一节sql server 中索引的创建
