# 25、SQL Server 教程 - SQL Server join的使用方法
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/3/25.html
- 分类：缓存数据库
- 分组：教程目录
这一节讲解下sql中join的使用，join指令来用来多表查询，它可以实现将多个表格连接起来，有如下几种使用方法：

**1、** 左连接leftjoin或leftouterjoin；

**2、** 右连接rightjoin或rightouterjoin；

**3、** 全连接fulljoin或fullouterjoin；

**4、** 内连接innerjoin；

**5、** 交叉连接crossjoin；

**6、** 自连接；

下面举例一一说明

假如我们有tb_employeeInfo和tb_employeeSalary表

tb_employeeInfo

tb_employeeSalary

Left join(左连接)是由左向外连接的结果集包括left join子句指定 的左表的所有行，如果左表的某行在右表没有相匹配的行，则在右表 相关联结果集行中的所有选择列表为null

例：SQL 语句：select *from tb_employeeInfo i left outer join tb_employeeSalary s on i.employeeId=s.employeeId;

输出结果：

Right join(右连接)是由右向外连接，它刚好与left join相反，如果右表的某行在左表没有相匹配的行，则在左表相关联结果集行中的所有选择列表为null

SQL语句：select *from tb_employeeInfo i right outer join tb_employeeSalary s on i.employeeId=s.employeeId;

输出结果：

Full join(全连接)是外部连接返回左表和右表的所有行。如果某行在另一表没有匹配的值，则为null

SQL语句：select i.employeeId, s.employeeSalary from tb_employeeInfo i full join tb_employeeSalary s on i.employeeId=s.employeeId;

输出结果：

Inner join(内连接)匹配左表和右表共有的列，才显示出来，否则不显示，即取它们的交集

SQL语句：select i.employeeId, s.employeeSalary from tb_employeeInfo i inner join tb_employeeSalary s on i.employeeId=s.employeeId;

输出结果:

Cross join(交叉连接)返回左表的所有行，即左表的每一行与右表的所有行进行连接组合。也就是所谓的称笛卡尔积(值为table1*table2，这是笛卡尔积的计算方法)。

SQL语句：select i.employeeName, s.employeeSalary from tb_employeeInfo i cross join tb_employeeSalary s where s.employeeSalary is not null;

输出结果：

Self join(自连接)是使用自身表当作另一个表来连接，即是自己连接自己

SQL语句:select *from tb_employeeInfo;

这就是一个简单的 自连接

输出结果：
