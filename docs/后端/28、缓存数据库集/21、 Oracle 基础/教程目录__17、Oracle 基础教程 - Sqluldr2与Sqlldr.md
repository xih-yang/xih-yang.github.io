# 17、Oracle 基础教程 - Sqluldr2与Sqlldr
- 来源：https://ddkk.com/zhuanlan/db/oracle/3/17.html
- 分类：缓存数据库
- 分组：教程目录
## 1. Sqluldr2导出文本

Sqluldr2是灵活与强大的Oracle文本导出程序，主要参数如下：

- user = username/password@tnsname
- sql = SQL file name
- query = select statement
- field = separator string between fields
- record = separator string between records
- rows = print progress for every given rows (default, 1000000)
- file = output file name(default: uldrdata.txt)
- log = log file name, prefix with + to append mode
- fast = auto tuning the session level parameters(YES)
- text = output type (MYSQL, CSV, MYSQLINS, ORACLEINS, FORM, SEARCH).
- charset = character set name of the target database.
- ncharset= national character set name of the target database.
- parfile = read command option from parameter file

使用`sqluldr2 help=yes`可以查看更多参数说明。

**e.g.**

```java
sqluldr2 data/data@orcl 
        query="select * from sx_table" 
        parfile=d:\exp.par 
        file=d:\sx_table.txt
```

exp.par 内容如下：

> head=yes
>
> batch=yes
>
> safe=yes
>
> rows=3000000
>
> record=0x0d0x0a

在当前目录下会生成一个名为”sx_table_sqlldr.ctl”的控制文件，通过该控制文件可以用SQL*Loader将数据加载到sx_table表中。

## 2. Sqlldr导入文本

Sqlldr（SQL*Loader）是Oralce用来将文本文件装载到数据库中的。

```java
sqlldr userid=test/test@orcl 
       readsize=33554432 
       streamsize=33554432
       date_cache=10000000 
       direct=true 
       skip_index_maintenance=true
       skip_unusable_indexes=true 
       multithreading=true 
       errors=10000000 
       skip=1 
       log="d:\load.log" 
       control="d:\sx_table_sqlldr.ctl"
       data="d:\sx_table.txt"
```
