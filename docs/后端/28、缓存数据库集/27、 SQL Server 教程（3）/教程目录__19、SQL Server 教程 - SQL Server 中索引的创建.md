# 19、SQL Server 教程 - SQL Server 中索引的创建
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/3/19.html
- 分类：缓存数据库
- 分组：教程目录
大家好，这一节我们开始学习index(索引)的创建。熟练的掌握索引相关的知识，能够使你快速的从表格中查找到你所以需要的相关信息。为了更好的理解index,我们可以举个例子:

假如我们手里有一本书，有了索引我们就能快速的定位你要看到的地方，没有它的话，你就得一页一页的翻阅你想浏览的地方。有些同学可能已经猜到索引是什么了，是的，index就相当于该书的目录。如果一本书没有目录的话，我想肯定是糟糕极了。因此，index是非常重要的对一个table而言。

index的创建语法:

**CREATE INDEX"INDEX_NAME" ON "TABLE_NAME" (COLUMN_NAME)**

假如我们创建了一个tb_Teachers_info表

create table tb_Teachers_info(

TeachersId char(10)primary key,

TeachersName char(10),

TeachersSex char(10),

TeachersAge integer,

City char(20)

)

现在我们想要为TeachersName创建一个index

SQL语句:

create index ix_TeachersName

ontb_Teachers_info(TeachersName);

假如我们想为TeachersName和TeachersSex创建index

create index ix_TeachersName_TeachersSex

ontb_Teachers_info(TeachersName,TeachersSex);

下一节 存储过程的创建
