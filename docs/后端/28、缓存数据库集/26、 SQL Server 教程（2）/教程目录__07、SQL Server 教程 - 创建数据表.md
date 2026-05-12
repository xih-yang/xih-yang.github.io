# 07、SQL Server 教程 - 创建数据表
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/2/7.html
- 分类：缓存数据库
- 分组：教程目录
## CREATE TABLE

[https://docs.microsoft.com/zh-cn/sql/t-sql/statements/create-table-transact-sql?view=sql-server-ver15](https://docs.microsoft.com/zh-cn/sql/t-sql/statements/create-table-transact-sql?view=sql-server-ver15)

create table table_name

（
[not null]{default},

[not null]{default},

...
[not null]{default}

）;

- table name:数据表的名称，一般以英文字母开头，并且不能使用数据库中的关键字命名。
- columnname:列名，列名的命名方法与表名的命名方法相同。最好起有实际意义的名称。
- datatype:指定列的数据类型。
- NOT NULL:为可选项，如果在某字段后加上该项，则向表添加数据时，必须给该字段输入内容，即不能为空。
- DEFAULT:为可选项，如果在某字段后加上该项，则向表添加数据时，如果不向该字段添加数据，系统就会自动用默认值填充该字段。

例创建学生信息表STUINFO。学生信息表的结构如表所示。

序号
字段名
数据类型
允许NULL
字段说明

1
stuno
int
不允许
学号

2
stuname
varchar(20)
不允许
姓名

3
stusex
varchar(2)
允许
性别

4
stumajor
varchar(30)
允许
专业

5
stutel
varchar(20)
允许
联系方式

```java
create table stuinfo
(
	stuno int not null,
	stuname varchar(20) not null,
	stusex varchar(2),
	stumajor varchar(30),
	stutel varchar(20)
)
```

如果设置主键则需要改为

```java
use student
create table stuinfo
(
	stuno		int			primary key,
	stuname		varchar(20) not null,
	stusex		varchar(2),
	stumajor	varchar(30),
	stutel		varchar(20)
)
```
