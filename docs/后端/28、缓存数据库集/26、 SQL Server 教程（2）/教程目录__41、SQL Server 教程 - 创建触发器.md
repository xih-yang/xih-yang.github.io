# 41、SQL Server 教程 - 创建触发器
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/2/41.html
- 分类：缓存数据库
- 分组：教程目录
## 1.触发器工作原理

触发器的原理涉及两张虚拟的表，这两张虚拟的表分别是INSERTED表和DELETED表。

- INSERT操作的触发器。当增加数据时，会在数据表和INSERTED表中同时放入数据。利用INSERTED表，可以得到已经插入的数据；可以利用该数据库进行业务对比操作。
- DELETE操作的触发器。当从数据表中删除数据时，数据首先被放到DELETED表中。该表是一张存放了已经删除的数据的虚拟表。在触发器中可以调用该表中的数据。
- UPDATE操作的触发器。该类型触发器和其他两种不一样，当对触发器所在的表执行UPDATE语句时，原数据会被转移到DELETED表中，而修改后的数据则被插入到INSERTED表中。最后触发器检查这两个表的数据，并更新数据表。

## 2.触发器语法结构

## CREATE TRIGGER (Transact-SQL)

[https://docs.microsoft.com/zh-cn/sql/t-sql/statements/create-trigger-transact-sql?view=sql-server-ver15](https://docs.microsoft.com/zh-cn/sql/t-sql/statements/create-trigger-transact-sql?view=sql-server-ver15)

### (1)数据操纵语言(DMI)触发器语法。

```java
CREATE [ OR ALTER ] TRIGGER [ schema_name . ]trigger_name   
ON { table | view }   
[ WITH <dml_trigger_option> [ ,...n ] ]  
{ FOR | AFTER | INSTEAD OF }   
{ [ INSERT ] [ , ] [ UPDATE ] [ , ] [ DELETE ] }   
[ WITH APPEND ]  
[ NOT FOR REPLICATION ]   
AS { sql_statement  [ ; ] [ ,...n ] | EXTERNAL NAME <method specifier [ ; ] > }  
<dml_trigger_option> ::=  
    [ ENCRYPTION ]  
    [ EXECUTE AS Clause ]  
<method_specifier> ::=  
    assembly_name.class_name.method_name
```

- CREATE TRIGGER项：表示创建触发器的关键词。
- schema_name项：表示触发器所属的架构名称。在SQL Server中触发器作用域是以架构为单位的。
- trigger项：触发器的名称。
- ON{ tablelview l项：触发器所作用的表或视图。DML类型触发器不能作用在局部或全局临时表上。
- FOR I AFTER项：AFTER表示触发器被激发的时机。它在SQL所有的操作都完成，并且约束检查完成后被激发。默认是AFTER。
- INSTEAD OF项：表示替换类型的触发器。对每个INSERT、UPDATE或DELETE语句只能定义一个INSTEAD OF触发器。
- 【INSERT】【UPDATE】【DELETE】项：激发触发器的操作，这里可以选取任意的组合。
- WITH APPEND项：指定添加一个已有类型的触发器。但如果显式声明了AFTER类型触发器，或触发器类型是INSTEAD OF时，则不能使用该项。
- NOT FOR REPLICATION项：当复制代理修改涉及触发器的表时，不应执行触发器。
- sql_statement项：可以足确定触发器具体操作的判断条件和操作。
- EXTERNAL NAME assembly_name.class_name.method_name[；]项：针对CLR触发器，指定程序集与触发器绑定的方法。
- ENCRYPTION项：表示对创建触发器语句进行模糊处理。
- EXECUTE AS项：指定用于执行该触发器的安全上下文。

### (2)数据定义语言(DDL)触发器语法结构。

```java
CREATE [ OR ALTER ] TRIGGER trigger_name   
ON { ALL SERVER | DATABASE }   
[ WITH <ddl_trigger_option> [ ,...n ] ]  
{ FOR | AFTER } { event_type | event_group } [ ,...n ]  
AS { sql_statement  [ ; ] [ ,...n ] | EXTERNAL NAME < method specifier >  [ ; ] }  
<ddl_trigger_option> ::=  
    [ ENCRYPTION ]  
    [ EXECUTE AS Clause ]
```

- CREATE TRIGGER项：表示创建触发器的关键词。
- trigger项：触发器的名称．
- ON ALL SER'VER项：表示触发器作用范围是整个服务器。
- ON DATABASE项：表示触发器的作用范围是当前的数据库。
- FOR|AFTER项：AFTER表示触发器被激发的时机，默认是AFTER。
- event_type项：激发触发器的DDL事件名称。
- evcrn_group项：预定义T-SQL语言事件分组名称。
- sql_statement项：可以是确定触发器具体操作的判断条件和操作。
- EXTERNAL NAME assembly_name.class_name.method_name[；]项：针对CLR触发器，指定程序集与触发器绑定的方法。
- ENCRYPTION项：表示对创建触发器语句进行模糊处理。
- EXECUTE AS项：指定用于执行该触发器的安全上下文。

### (3)登录触发器语法结构。

```java
CREATE [ OR ALTER ] TRIGGER trigger_name   
ON ALL SERVER   
[ WITH <logon_trigger_option> [ ,...n ] ]  
{ FOR| AFTER } LOGON    
AS { sql_statement  [ ; ] [ ,...n ] | EXTERNAL NAME < method specifier >  [ ; ] }  
<logon_trigger_option> ::=  
    [ ENCRYPTION ]  
    [ EXECUTE AS Clause ]
```

- CREATE TRJGGER项：表示创建触发器的关键词。
- trigger项：触发器的名称。
- ON ALL SERVER项：表示触发器作用范围是整个服务器。
- FOR I AFTER项：默认是AFTER，这里表示登录后被激发。
- sqLstatement项：可以是确定触发器具体操作的判断条件和操作。
- EXTERNAL NAME assembly_name.class_ name.method_name[：]项I针对CLR触发器，指定程序集与触发器绑定的方法。
- ENCRYPTION项：表示对创建触发器语句进行模糊处理。
- EXECUTE AS项：指定用于执行该触发器的安全上下文。

## 3.使用T-SQL创建DML触发器

例创建可存入日志的触发器。

### (1)设计ATriStudent表

字段名

中文释义

数据类型

STUNUM

学号，主键

int

NAME

姓名

nvarchar(20)

AGE

年龄

numeric(3,0)

SEX

性别

char (1)

### (2) 设计ATri_Log日志表

字段名

中文释义

数槲类孽l

ID

记录ID．主键，自增长

int

OPER_TABLE

被操作的表名

nvarchar(20)

OPER_TABLE_PRK

控操作表的主键

nvarchar(20)

OPER_KD

操作类型

nvarchar(10)

OPER_DATE

操作时问

date

### (3)创建触发器

```java
CREATE TRIGGER  trg_ATriStudent_ud
ON ATriStudent
AFTER update,delete
AS
DECLARE @stunum Int;
SELECT  @stunum=min(stunum) FROM deleted
WHILE @stunum is not null
BEGIN
    SELECT @stunum=stunum FROM deleted WHERE stunum=@stunum
	INSERT INTO  ATri_Log(oper_table,OPER_TABLE_PRK,OPER_DATE)
	VALUES('ATriStudent',@stunum. getdate()) ;
	SELECT @stunum = min(stunum) FROM deleted WHERE stunum > @stunum
END
```

### (4)验证触发器

当触发器成功执行完成后，利用SQL语句可以对其进行验证。验证步骤如下：

①在ATriStudent表中增加数据，打开查询编辑器，输入具体脚本如下：

INSERT INTO ATriStudent(NAME,AGE,SEX) VALUES('张三',16,'1')

执行该脚本，为表ATriStudent增加数据。

②对增加的数据进行删除，脚本如下：

delete from ATriStudent

③分别查询表ATriStudent和表ATri_Log。发现被删除数据的主键操作时间等已经存入日志表中

select * from Atri_Log

select * from ATriStudent
