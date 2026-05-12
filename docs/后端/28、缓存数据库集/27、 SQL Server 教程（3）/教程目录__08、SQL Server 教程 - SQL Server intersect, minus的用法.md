# 08、SQL Server 教程 - SQL Server intersect, minus的用法
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/3/8.html
- 分类：缓存数据库
- 分组：教程目录
在这一节中我们主要讲解下intersect,和minus用法：

Intersect常用来选择两个表格中相关联的事物，它是对两个SQL语句所产生的结果作处理的.

它的作用有点像and的用法，就是说所选择的这个值要存在于第一句和第二句才会被选择出，上面

这样讲，是不是有点难以理解阿，下面我们还是举例来加以说明吧。

现在有两个表一个是教师信息表(tb_Teachers_info),另一个是tb_City_info:

tb_Teachers_info

tb_City_info

现在要选择两个表中都含有的TeachersName:

SQL语句: select TeachersName from tb_Teachers_info intersect select TeachersName from tb_City_info;

输出结果:

Minus指令是运用在两个SQL语句上，它先找出第一个SQL语句所产生的结果，然后看这些结果

有没有在第二个sql语句的结果中，如果有的话就去除。还有一点就是如果第二个sql语句所产生

的结果没有在第一个sql语句所产生的结果内，那么这个数据也去除。

如下例子：选择在教师信息表中有的TeachersName但又没有在第二个表中出现的教师姓名

SQL语句: select TeachersName from tb_Teachers_info minus select TeachersName from tb_City_info;

上面这句sql语句的含义是先从第一个表(即tb_Teachers_info)查找出教师姓名(我给它命名a1)，然后再从第二个表(tb_City_info)选择出教师姓名(命名a2)，再找到两者间相同的教师姓名(a3)，那么上面这句sql语句的结果就是a1-a3.

下一节Sql server中union, union all 的用法
