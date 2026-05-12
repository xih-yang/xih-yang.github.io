# 12、SQL Server 基础 - 用SQL创建和扩大数据库空间
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/1/12.html
- 分类：缓存数据库
- 分组：教程目录
## 创建只有一个文件组的数据库

name逻辑文件名，filename物理文件名，size初始大小，maxsize最大值，filegrowth增长量。后面这三个量默认单位都是MB。

```java
create database MyNewDB
on
    (name=Lzh_dat1,
    filename='E:\Source Program\CreatTest\Lzh_dat1.mdf',
    size=10MB,
    maxsize=30MB,
    filegrowth=5MB)
log on
    (name=lzh_log1,
    filename='E:\Source Program\CreatTest\lzh_log1.ldf',
    size=3MB,
    maxsize=unlimited,
    filegrowth=3MB)
```

这里on后就是这个文件组中的各个文件，log on后就是日志文件(日志空间与数据空间是分开管理的)。用这种方式时，因为只有一个文件组，所以其中的第一个文件就被认定为主要数据文件。

注意，主要数据文件.mdf，次要数据文件.ndf，日志文件.ldf都只是推荐的扩展名，可以使用其它扩展名，所以到底是什么文件还是要看在创建语句中的位置。

## 创建多个文件组的数据库

语法类似，这时候on primary块是主文件组，其中的第一个文件是主要数据文件。注意多个数据文件或多个日志文件之间要有逗号分隔。

```java
create database MyNewDB
on primary
    (name=Lzh_dat1,
    filename='E:\Source Program\CreatTest\Lzh_dat1.mdf',
    size=10MB,
    maxsize=30MB,
    filegrowth=5MB),
    (name=Lzh_dat2,
    filename='E:\Source Program\CreatTest\Lzh_dat2.ndf',
    size=5MB,
    maxsize=20MB,
    filegrowth=4MB),
filegroup LzhGroup2
    (name=Lzh_dat3,
    filename='E:\Source Program\CreatTest\Lzh_dat3.ndf',
    size=7MB,
    maxsize=20MB,
    filegrowth=3MB),
filegroup LzhGroup3
    (name=Lzh_dat4,
    filename='E:\Source Program\CreatTest\Lzh_dat4.ndf',
    size=10MB,
    maxsize=30MB,
    filegrowth=5MB),
    (name=Lzh_dat5,
    filename='E:\Source Program\CreatTest\Lzh_dat5.ndf',
    size=20MB,
    maxsize=30MB,
    filegrowth=2MB)
log on
    (name=lzh_log1,
    filename='E:\Source Program\CreatTest\lzh_log1.ldf',
    size=3MB,
    maxsize=unlimited,
    filegrowth=3MB)
```

## 扩大数据库空间

如果数据空间不够则不能再插入数据，如果日志空间不够则不能再对数据库修改操作(因为需要写入日志文件)。扩大数据库空间有两种方式：为数据库添加新文件、扩大数据库中已有文件的大小。

**①为数据库添加新文件**

```java
ALTER DATABASE 数据库名
ADD [LOG] FILE
    (文件参数表)
[TO FILEGROUP 已存在的文件组名或DEFAULT表示默认文件组]
```

例如：

```java
alter database MyNewDB
add file(
    name=newlzh_dat1,
    filename='E:\Source Program\CreatTest\newlzh_dat1.ndf',
    size=6mb,
    filegrowth=0)
to filegroup LzhGroup2
```

**②扩大已有文件大小**

这时候ADD就要改成MODIFY了，注意这里的文件名是用来寻找你要扩大的那个文件的，而不是去修改文件名。

```java
alter database MyNewDB
modify file(
    name=newlzh_dat1,
    size=8MB
    )
```
