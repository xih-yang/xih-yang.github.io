# 42、SQL Server 教程 - 触发器内判断事件操作
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/2/42.html
- 分类：缓存数据库
- 分组：教程目录
例根据不同的DML事件进行不同操作。

要求当对ATriStudent表进行INSERT，UPDATE和DELETE操作时分别做出提示，并记录到日志表ATri_Log中

```java
CREATE TRIGGER trg_ATriStudent_iud
ON  ATriStudent
AFTER  insert,update,delete
AS
IF  EXISTS (SELECT 1 FROM  inserted)  AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
		print '执行的是INSERT操作'
		insert  into  ATri_Log (OPER_TABLE,OPER_KD,OPER_DATE)
		values('ATriStudent','INSERT',getdate());
    END
IF EXISTS (SELECT 1 FROM  inserted)  AND  EXISTS (SELECT 1 FROM deleted)
    BEGIN
		print '执行的是UPDATE操作'
		insert into ATri_Log (OPER_TABLE, OPER_KD,OPER_DATE)
		values('ATriStudent','UPDATE',getdate());
    END
IF NOT EXISTS(SELECT 1 FROM inserted) AND EXISTS(SELECT 1 FROM deleted)
    BEGIN
		print '执行的是DELETE操作'
		insert into ATri_Log(OPER_TABLE,OPER_KD,OPER_DATE)
		values('ATriStudent','DELETE', getdate());
    END
```

验证触发器

当触发器成功执行完成后，利用SQL语句可以对其进行验证。验证步骤如下：

①在ATriStudent表中增加数据，打开查询编辑器，输入具体脚本如下：

INSERT INTO ATriStudent(NAME,AGE,SEX) VALUES('张三',16,'1')

执行该脚本，为表ATriStudent增加数据。

②对增加的数据进行删除，脚本如下：

delete from ATriStudent

③分别查询表ATriStudent和表ATri_Log。发现被删除数据的主键操作时间等已经存入日志表中

select * from Atri_Log

select * from ATriStudent
