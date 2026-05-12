# 08、SQL Server 教程 - 修改表结构的语法
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/2/8.html
- 分类：缓存数据库
- 分组：教程目录
1．添加字段的语法

ALTER

ADD
column_name datatype [(length)] ;

2．修改字段的语法

ALTER TABLE table_name

ALTER COLUMN

column_name datatype[ (length) ] ;

3．删除字段的语法

ALTER TABLE

DROP COLUMN column_name

**示例1** 给学生信息表（STUINFO）添加一个备注(STUREMARKS)字段。

ALTER TABLE STUINFO

ADDSTUREMARKS VARCHAR( 50);

**示例2** 修改表STUINFO中的STUREMARKS字段，将其长度修改成20。

ALTER TABLE STUINFO

ALTER COLUMN STUREMARKS VARCHAR (20) ;

**示例3** 删除表STULNFO中的STUREMARKS字段。

ALTER TABLE STUINFO

DROP COLUMN STUREMARKS;
