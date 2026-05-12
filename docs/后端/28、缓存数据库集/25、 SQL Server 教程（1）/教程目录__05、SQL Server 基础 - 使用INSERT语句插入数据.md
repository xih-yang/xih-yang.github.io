# 05、SQL Server 基础 - 使用INSERT语句插入数据
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/1/5.html
- 分类：缓存数据库
- 分组：教程目录
使用SQL语句的意义是，要开发的DBAS应用程序不能像人一样通过SSMS工具来操作数据，SQL语句是应用程序和数据库通信的桥梁。而且相比手动图形化操作，SQL语句更加方便和强大。

## SQL(结构化查询语言)的组成

①DML(数据操作语言)

插入、删除和修改数据库中的数据

```java
INSERT、UPDATE、DELETE等
```

②DCL(数据控制语言)

用来控制存储许可，存取权限等

```java
GRANT、REVOKE等
```

③DQL(数据查询语言)

用来查询数据库中的数据

```java
SELECT等
```

④DDL(数据定义语言)

用来建立数据库、数据库对象和定义表的列

```java
CREATE TABLE、DROP TABLE等
```

## INSERT语句向表中插入一行数据

```java
INSERT [INTO] 表名 [(列名表)] VALUES(值列表)
```

本节新建一个数据库和表作为测试：

点击新建查询，并确认是在要查的数据库下：

SCode列作为标识列，是在列入数据时数据库自动赋值的，在INSERT时就不用写它了：

```java
insert into students (SName,SAddress,SGrade,SEmail,SSex)
values ('刘知昊','China','3','no@no.com','1')
```

选中并执行(不选中的话会执行所有的，在这个例子里也一样)：

查看那张表：

注意用INSERT语句插入行时，每个列的数据类型、精度等必须与相应的列匹配，而且应符合各个约束的要求。

如果在设计表时设计了某列不能为空，就必须插入数据。

具有缺省值(默认约束)的列，可以用关键字DEFAULT来选择使用默认值。

## INSERT-SELECT-FROM语句将存在表中的列插入到其它存在表的存在列中去

```java
INSERT INTO 目标表(目标表列名表)
SELECT 源表列名表
FROM 源表
```

如在原来表中有这些数据：

新建一个有三个列(名字，地址，电子邮件的列)，并执行下面语句：

```java
insert into Test(名字,地址,电子邮件)
select SName,SAddress,SEmail
from students
```

查看一下新表：

## SELECT-INTO-FROM语句将现有表中的数据插入到新表中

```java
SELECT 源表列名表
INTO 目标表
FROM 源表
```

如执行：

```java
select SName,SEmail
into newTab
from students
```

刷新一下，查看新产生的表：

因为表名不能重复，所以这条语句只能成功执行一次。

## INSERT-SELECT-UNION语句合并数据进行多行插入

```java
INSERT INTO 目标表(目标表列名表)
SELECT 列名表1 UNION
SELECT 列名表2 UNION
......
SELECT 列名表n
```

如执行：

```java
insert into students(SName,SAddress,SGrade,SEmail,SSex)
select 'AROLF','China','7','fo@lo.com','0' union
select '随便名字','US','2','ao@lo.com','1' union
select '大傻','地球','8','fp@lo.com','1'
```

刷新一下，查看students表：

此外，这些写入Query的语句可以保存为文件，以便以后查看和使用。
