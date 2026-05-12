# 03、SQL Server 教程 - SQL Server 插入语句
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/3/3.html
- 分类：缓存数据库
- 分组：教程目录
上节我们学习了select语句，这一节主要讲解下insert(插入)语句，还是以tb_Students_info表为例：

现在我要在表中插入学生名:kety,学号:009,性别:woman的这行数据

Sql语句:insert into tb_Students_info(StudentsName,StudentsId,StudentsSex) values(‘kety’,’009’,’woman’);

再次查看插入语句后的表格:select *from tb_Students_info;

输出结果:

好了这一节就讲到这里，

下一节Sql server 修改语句
