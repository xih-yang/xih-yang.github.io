# 10、SQL Server 教程 - SQL Server in的用法
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/3/10.html
- 分类：缓存数据库
- 分组：教程目录
In这个指令在sql中也是时常可见的,我们这里还是以实例为主进行讲解，它的语法格式：

**SELECT "栏位名"

FROM "表格名"

WHERE "栏位名" IN('值一', '值二', ...)**

假设我们有两个表格：

tb_Teachers_info

tb_City_info

然而我们要在tb_Teachers_info中找出所有来自American的教师姓名

SQL语句: select TeachersName from tb_Teachers_info whereCity in('American');

结果:

如果我们要从tb_Teachers_info中找出与tb_City_info中同名教师的TeachersId

SQL语句: select TeachersId from tb_Teachers_info whereTeachersName in(selectTeachersName from tb_City_info);

结果:

下一节SQL SERVER中order by的用法
