# 14、SQL Server 基础 - 三值谓词,范式,主键/唯一/外键/检查/默认约束
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/1/14.html
- 分类：缓存数据库
- 分组：教程目录
找到一本不错的书《Microsoft SQL Server 2008技术内幕：T-SQL语言基础》，读它来学感觉流程更规范。

## 四值谓词和SQL支持的三值谓词

四值谓词：真、假、缺少且仍可用、缺少且不可用。在SQL中实现了三值的谓词逻辑，即TRUE、FALSE、UNKNOWN(用NULL值表示缺少值的概念)。

## 范式

范式是关系模型的规范化规则，以确保每个实体只由一个关系来表示。

第一范式(1NF)：表中的行必须是唯一的，属性应该是原子(不能再拆分)的。

第二范式(2NF)：满足1NF，每个非键属性都必须完全依赖于整个候选键(而不能只依赖于候选键的一部分)。

第三范式(3NF)：满足2NF，所有非键属性都必须非传递依赖于候选键(不能经过任何非键属性)。

2NF和3NF的意思是，每个非键属性都依赖于全部键，除了键没有别的。

## SQL Server实例

一台计算机上安装SQL Server的多个实例与在不同计算机上的实例逻辑上是基本一样的。一台计算机上可以有不超过1个**默认实例**，多个**命名实例**。要连接到默认实例只需指明计算机名称或IP地址，要连接到命名实例需要再接一个""然后指明实例名称(安装时提供的)。

## 系统数据库

master：保存本SQL Server实例的元数据信息、服务器配置、实例中所有数据库的信息、初始化信息。

Resource：所有系统对象。

model：新数据库的模板，每个新创建的数据库最初都是model的副本。对model数据库的修改会影响此后创建的数据库，不影响现有的数据库。

tempdb：保存临时数据，如工作表、排序空间、行版本控制。每次启动SQL Server实例时，会删除这个数据库的内容，并重新创建为model的一个副本，所有当以测试为目的创建对象而用完后就不想要了时可以在这个数据库里创建它们。

msdb：自动化管理服务(SQL Server Agent)保存信息的地方。

## 架构和对象

一个数据库包含多个架构，而每个架构则又包含多个对象。架构(Scheme)是各种对象(如表table、视图view、存储过程stored procedure)的容器。可以加架构级别上控制对象的访问权限(如为一个用户授予某个架构上的SELECT权限)，另外架构也是一个命名空间，应尽量用**架构名.对象名**的方式使用对象。

## 用T-SQL做定义数据完整性的工作

先在临时数据库里创建这样一张表：

```java
USE tempdb; --在tempdb数据库下
IF OBJECT_ID('ok','U') IS NOT NULL --如果这个表已经存在
	DROP TABLE ok; --删除表
CREATE TABLE ok --创建表
(
	myid INT NOT NULL,
	firstname VARCHAR(30) NOT NULL,
	lastname VARCHAR(30) NOT NULL,
	mydate DATE NOT NULL,
	Pid INT NULL,
	num VARCHAR(20) NOT NULL,
	salary MONEY NOT NULL --MONEY数据类型是2008及以后版本才有的
);
```

### 主键约束(Primary Key Constraints)

主键约束实施唯一约束并且不允许取NULL值，只能对一个列做主键约束：

```java
ALTER TABLE dbo.ok --写上"dbo.*"看起来更清楚
	ADD CONSTRAINT PK_ok --约束的名称
	PRIMARY KEY(Pid);
```

而设置了非空的myid列：

```java
ALTER TABLE dbo.ok --写上"dbo.*"看起来更清楚
	ADD CONSTRAINT PK_ok --约束的名称
	PRIMARY KEY(myid);
```

就是可以的。

主键约束保证这一列的值唯一而非空，如果插入或更新一行违反约束的数据，就会拒绝操作并报错。

### 唯一约束(Unique Constraints)

保证数据的一个或一组列数据的唯一：

```java
ALTER TABLE dbo.ok
	ADD CONSTRAINT UNQ_ok_Pid --因为唯一约束可以做多个,不妨记录这是哪个
	UNIQUE(Pid);
```

实现唯一约束或者主键约束(本质也包含了主键约束)都会在幕后创建一个唯一索引(unique index)，作为实施唯一约束的物理机制。

### 外键约束(Foreign Key Constraints)

用于实施引用完整性，在**引用表**的一组属性上进行定义，并指向**被引用表**中的一组候选键(主键或唯一约束)。引用表和被引用表可能是同一个表，外键约束目的是将**外键列**(from引用表)所允许的值限制为**被引用列**(from被引用表)中现有的值。

例如先创建一个okWai的表，并定义其主键列：

```java
USE tempdb; --在tempdb数据库下
IF OBJECT_ID('okWai','U') IS NOT NULL --如果这个表已经存在
	DROP TABLE okWai; --删除表
CREATE TABLE okWai --创建表
(
	W_myid INT NOT NULL,
	W_firstname VARCHAR(30) NOT NULL,
	W_lastname VARCHAR(30) NOT NULL,
	W_mydate DATE NOT NULL,
	W_Pid INT NOT NULL,
	W_num VARCHAR(20) NOT NULL,
	W_salary MONEY NOT NULL,
	CONSTRAINT PK_okWai --设置主键约束列
		PRIMARY KEY(W_Pid)
);
```

如这个新表中的W_myid要来自于ok表中的myid列的现有取值(不同表的外键)：

```java
ALTER TABLE dbo.okWai --在新建的这个表上
	ADD CONSTRAINT FK_okWai_ok --这样命名意思是okWai受制于ok
	FOREIGN KEY(W_myid) --要设置外键约束的列
	REFERENCES dbo.ok(myid); --受制于ok表中的myid这个列
```

又如ok表中的Pid这个列要来自于ok表中的myid列的现有取值(同表的外键)：

```java
ALTER TABLE dbo.ok --在ok表上
	ADD CONSTRAINT FK_ok_ok --这样命名意思是ok受制于ok
	FOREIGN KEY(Pid) --要设置外键约束的列
	REFERENCES dbo.ok(myid); --受制于ok表中的myid这个列
```

ok表的Pid列前面定义了，是可以为空的，这个例子说明了即使被引用的候选键列不允许NULL值，在外键列中也可以设置允许NULL值。

当试图删除被引用表中的行，或更新被引用的候选键时，如果在引用表中使用了相关的行，则这样的操作不能进行，可以定义具有级联操作的外键以补偿这样的操作。

### 检查约束(Check Constraints)

定义一个谓词，当插入或更新数据行时，如果该谓词计算结果为TRUE或UNKNOWN时通过检查约束的检查，否则不通过。

```java
ALTER TABLE dbo.ok
	ADD CONSTRAINT CHK_ok_1
	CHECK(num>0 and Pid>5); --当num>0(或为NULL即返回UNKNOWN)且Pid>5时通过
```

### 默认约束(Default Constraints)

当插入一行数据时如果没有为属性指定明确的值，就可以用默认约束的表达式作为其默认值：

```java
ALTER TABLE dbo.ok
	ADD CONSTRAINT DFT_ok_mydate
	DEFAULT(CURRENT_TIMESTAMP) FOR mydate; --没有指定mydate属性值时会调用这个函数
```

这个函数将返回当前的日期和时间值。
