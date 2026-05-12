# 13、SQL Server 基础 - 用SQL做分离DB、附加DB、架构、分区表
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/1/13.html
- 分类：缓存数据库
- 分组：教程目录
## 分离数据库

表示将数据库从SQL Server实例中去除，但不是物理性的删除。

使用的是sp_detach_db系统存储过程。

```java
sp_detach_db '数据库名','是否跳过更新统计信息'
```

例如：

```java
sp_detach_db 'MyNewDB','true'
```

## 附加数据库

表示将分离的数据库重新附加到DBMS中。在这之前，应该确保全部数据文件和日志文件在合适的位置。

例如添加刚刚分离的数据库MyNewDB：

```java
create database MyNewDB
    on (filename='E:\Source Program\CreatTest\Lzh_dat1.mdf')
for attach
```

根据主要数据文件就可以找到其它文件的位置，如果在分离之后，某些数据文件的位置进行了移动，则要在ON块中指明这些数据文件移动之后的位置：

```java
create database MyNewDB
    on (filename='E:\Source Program\CreatTest\Lzh_dat1.mdf'),
        (filename='E:\Source Program\CreatTest\Lzh_dat4.ndf'),
        (filename='E:\Source Program\CreatTest\lzh_log1.ldf')
for attach
```

## 架构

架构(Schema)是用来存放数据库对象的容器，相当于给它们包了一个文件夹。架构名可以自定义，也可以由DBMS提供默认，必须是唯一的。

**定义架构**

```java
CREATE SCHEMA [架构名] AUTHORIZATION 数据库用户名
```

例如：

```java
create schema Mysch authorization dbo
```

表示为数据库用户dbo建立了一个名为Mysch的架构。

注：定义架构时还可以定义表(CREATE TABLE)，定义视图(CREATE VIEW)，为用户授权(GRANT)等，直接接在CREATE SCHEMA语句后面就行了。

**删除架构**

SQLServer中，删除架构只能删除不包含任何对象的架构，如果架构中有对象则拒绝删除之(需要先删除对象)。

```java
DROP SCHEMA 架构名
```

例如：

```java
drop schema Mysch
```

## 分区表

分区表将一个表中的数据按水平方式划分到不同的子集中去，这些数据子集可以放到数据库的多个**文件组**中去。

如果数据量大，而且是分段的，而且对不同段的操作不太相同，有些段操作的多，有些段操作的少，那么适合创建分区表。

注：从物理上这个大表会分成多个小表放到多个文件组中去，但是逻辑上还是一个大表，对用户而言它就是一个大表(可直接对其操作)，而由DBMS去思考实际操作的是哪个小表。

**创建分区函数**

分为左侧分区函数和右侧分区函数，左侧分区函数就是左开右闭区间(…]，右侧分区函数就是左闭右开区间[…)。

```java
CREATE PATITION FUNCTION 分区函数名(分区依据列的数据类型)
AS RANGE [LEFT/RIGHT]
FOR VALUES(值列表)
```

例如：

```java
create partition function myfun(int)
as range right --注意默认是左，这里是右
for values(15,17,20)
```

即对int型的**分区依据列**，根据其值<15，<17，<20，<∞作这样的分区函数。

注：具体的分区依据列是在CREATE TABLE或CREATE INDEX语句中指定的。

**利用分区函数创建分区方案**

```java
CREATE PARTITION SCHEME 唯一的分区方案名
AS PARTITION 分区函数名
[ALL] TO (文件组名[表])
```

例如：

```java
create partition scheme FenQuName
as partition myfun
to (LzhGroup2,LzhGroup3,LzhGroup2,LzhGroup3)
```

如果要全部分到一个文件组中去，可以：

```java
create partition scheme FenQuName
as partition myfun
all to (LzhGroup2)
```

我觉得在DB中创建文件组的好处是，我们创建表什么的可以直接在文件组中作，而不用去关心创建在了哪个盘或者哪个数据文件中，这是一种**抽象意义上的操作**。而且因为文件组中的数据文件是可以在不同盘中的，所以使用文件组有机会增加访问速度。同样地，使用分区表将一个表物理性地拆分到不同的文件组中去，但是我们对这个表的操作却还是之前的那样(抽象意义上的操作)整表操作，而不用关心到底操作的是哪个文件组中的子表，我认为这是**保留了用户操作便捷性的同时优化了访问模式**。
