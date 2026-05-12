# 04、SQL Server 教程 - SQL Server 修改语句
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/3/4.html
- 分类：缓存数据库
- 分组：教程目录
这一节讲解更新数据库中表的信息

以tb_Students_info表为例：

现在我要修改学生名joe的性别为woman

SQL语句:update tb_Students_info set StudentsSex='woman'where StudentsName='Joe';

查询更改后的数据表:select *from tb_Students_info;

输出结果：

注意这次在sql 语句中用到了where 这个关键字，是用来设定条件的，where后面更随你要设定的条件，这里由于要修改的是’Joe’的性别，所以在where语句后面表明了StudentsName=’Joe’

在增，删，改，查着四个语句中你已经学习了三个，

下一节Sql server删除语句
