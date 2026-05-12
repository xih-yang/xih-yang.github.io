# 21、SQL Server 教程 - SQL Server 触发器的创建
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/3/21.html
- 分类：缓存数据库
- 分组：教程目录
上面一节中已经对存储过程作了一个初步的讲解，在这一节我们将学习触发器。在这之前我相信同学们都已经听过这个名字吧，其实触发器在sql server中也是比较常见的。之所以把它放置于存储过程之后讲解，主要是它与存储过程有一定的关联性。

触发器(trigger)是个特殊的存储过程，它的执行不是由程序调用，也不是由手工启动，而是由某个特定的事件来触发，这个事件可以是insert,delete,update等，它是由创建触发器本人来规定的。只要这个指定的事件一执行，它就会自动的激活执行。

语法：

DELIMITER |

CREATE TRIGGER ``.``

ON
FOREACH ROW

AS
--do something

GO|

假如我要创建一个触发器，一旦执行插入操作时它就会在tb_Teachers_info中插入一条信息

SQL语句：

create trigger tri_insertData on tb_Teachers_info

forinsert

as

insert into tb_Teachers_info(TeachersId,TeachersName,TeachersSex,TeachersAge,City)values('1009','Jeff','man','30','China');

go

一旦我们执行插入操作时，就会自动在tb_Teachers_info中插入一条(TeachersId:’1009’,TeachersName:’Jeff’,TeachersSex:’man’,TeachersAge:’30’,City:’China’)数据

学习到这里，我们已经把sql server中的基础知识都已经讲完了，从下一节起，我们将深入sql server学习，期待我们一起共同进步。

下一节Sql server中like的使用
