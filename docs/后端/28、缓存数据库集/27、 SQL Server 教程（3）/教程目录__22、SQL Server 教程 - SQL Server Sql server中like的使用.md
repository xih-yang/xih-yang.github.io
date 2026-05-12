# 22、SQL Server 教程 - SQL Server Sql server中like的使用
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/3/22.html
- 分类：缓存数据库
- 分组：教程目录
在这一节讲解下like指令，其实这个方法在sql server中功能还是比较强大的，它有时在查询sql语句中能给我们带来很大便捷。Like指令一般可用于where字句后面可用于对所查的语句进行条件设置，like指令有三种使用方法：

·ABC%': 所有以 'ABC' 起头的字串

·'% ABC ': 所有以 'ABC ' 结尾的字串

·'% ABC %': 所有含有' ABC '这个套式的字串

**LIKE**的语法如下：

**SELECT "栏位名"

FROM "表格名"

WHERE "栏位名"LIKE { 套式}**

假如有tb_Teachers_info表

查询TeachersName中以y结尾的信息

SQL语句：select *from tb_Teachers_infowhere TeachersName like'%y';

假如要查询TeachersName中以a开头的信息

SQL语句：select *from tb_Teachers_infowhere TeachersName like'a%';

假如要查询TeachersName中含有m的信息

SQL语句：select*from tb_Teachers_info where TeachersName like'%m%';

下一节： Sql server中substr的使用
