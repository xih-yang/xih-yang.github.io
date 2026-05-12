# 05、SQL Server 教程 - 创建数据库练习
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/2/5.html
- 分类：缓存数据库
- 分组：教程目录
使用SQL语句创建一个数据库DBTest，指定数据库的数据文件所在位置为“D:\MyDB"，初始容量为8MB，最大容量为16MB，文件增长的数量为5%0。

```java
create database DBtest
on
(
    name='DBtest',
    filename='d:\mydb\DBtest.mdf',
    size=8MB,
    maxsize=16MB,
    filegrowth=5%
)
```

首先要确保文件夹“d:\mydb”存在。

2．为“DBTest"数据库增加一个名为“DBTest201”的日志文件卓，指定文件所在位置为“D:\MyDB“，初始容量为2MB，最大容量为50MB，文件增长的数量为10%。

```java
alter database DBTest
	add log file
	(
		name=DBtest201,
		filename='d:\mydb\DBTest201.ldf',
		size=2mb,
		maxsize=50mb,
		filegrowth=10%		
	)
```
