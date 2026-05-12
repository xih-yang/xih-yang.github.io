# 17、SQL Server 教程 - SQL Server 表格的创建
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/3/17.html
- 分类：缓存数据库
- 分组：教程目录
表格是数据库中资料存储的载体，在绝大多数情况下，由于数据库厂商不可能知道您表格的存储内容，所以通常需要自己创建表格。虽然现在有许多可视化的工具，可以使你不需要什么数据库知识就能轻易的创建表格，但表格是数据库中的基本框架，所以我们还是要掌握用指令方法去创建表格。

表格的创建语法

**CREATE TABLE"表格名"

("栏位 1""栏位 1资料种类",

"栏位2""栏位 2资料种类",

...)**

在这里我想告诉大家，sql server中是不分大小写的，这与c#，java等编成语言不同，所以不一定都需按照上面格式中用大写字母来创建表格。

假如我们想指令来创建tb_Teachers_info表

create table tb_Teachers_info(

TeachersId char(10) primary key,

TeachersName char(10),

TeachersSex char(10),

TeachersAge integer,

City char(20)

)

在这个表格中，将TeachersId设为主键，字符为10，只有TeachersAge设为integer类型，其余都设为字符型，就这样几句指令就可以把你需要的表格创建出来，感觉挺神奇的吧，大家可以尝试着用指令去创建表格哦。

下一节[Sql server](http://blog.csdn.net/kiqinie/article/details/8136502)[视图的创建](http://blog.csdn.net/kiqinie/article/details/8136502)
