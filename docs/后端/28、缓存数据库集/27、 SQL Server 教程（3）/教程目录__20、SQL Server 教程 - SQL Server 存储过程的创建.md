# 20、SQL Server 教程 - SQL Server 存储过程的创建
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/3/20.html
- 分类：缓存数据库
- 分组：教程目录
在这一节，我们要学习sql server的核心部分**存储过程**

存储过程(stored procedure)是一组为了完成特定功能的SQL语句集，经编译后存储在数据库中。用户通过指定存储过程的名字并给出参数来执行它。

存储过程是数据库中非常重要的一个对象，它在实际用途中非常广泛。存储过程具有执行速度快，便于控制，保证数据的安全性和完整性，以及灵活性等特点。

先看下的创建语法:

**CREATE PROC [ EDURE ] procedure_name[ ; number ]

[{ @parameter data_type }

[VARYING ] [ = default ] [ OUTPUT ]

][ ,...n ]**

**[ WITH

{RECOMPILE | ENCRYPTION | RECOMPILE , ENCRYPTION } ]**

**[ FOR REPLICATION ]**

**AS sql_statement [ ...n ]**

假如有tb_Teachers_info表：

tb_Teachers_info

现在我想创建一个存储过程，需要查找出TeachersAge为24的教师姓名

create procedure sp_techersName

as

select TeachersName from tb_Teachers_infowhere TeachersAge='24';

一个简单的存储过程已经创建好了，现在让我来执行它把

SQL语句: exec sp_techersName

结果：

exec是excute的简写，为了书写方便所以使用了简写，其实两者都可以用来执行存储过程。

这里我们已经知道了创建一些简单的存储过程，在最后一章中我们会深入研究它，谢谢关注哦。

下一节触发器的创建
