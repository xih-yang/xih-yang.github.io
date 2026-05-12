# 14、Oracle 教程 - Oracle 的数据文件（Data files）与表空间管理
- 来源：https://ddkk.com/zhuanlan/db/oracle/1/14.html
- 分类：缓存数据库
- 分组：教程目录
Oracle 的表空间是一个逻辑概念，Oracle数据库是由若干个表空间构成的。数据库对象在存储时必须存储在某个表空间中。一个表空间对应若干个数据文件，即一个表空间由一个或多个数据文件构成，但一个数据文件只能属于一个表空间。

表空间可以理解为操作系统中的文件夹，是 Oracle 数据库逻辑结构与物理文件之间的一个映射。数据库的存储空间在物理上表现为数据文件，在逻辑上表现为表空间。表空间的大小等于所有从属于它的数据文件大小的总和。

## 一、表空间的概念

Oarcle 数据库真正存放数据的是数据文件，表空间（tablespaces）实际上是一个逻辑的概念，在物理上并不存在。表空间具有如下特点：

（1）一个数据库可以包含多个表空间，一个表空间只能属于一个数据库；

（2）一个表空间包含多个数据文件，一个数据文件只能属于一个表空间。

表空间分为系统表空间（system 表空间、sysaux 表空间）和非系统表空间（undo 表空间，temp 表空间，users 表空间，自定义表空间）。查看表空间：

```java
SQL> select * from v$tablespace;
       TS# NAME 			  INC BIG FLA ENC
---------- ------------------------------ --- --- --- ---
	 0 SYSTEM			  YES NO  YES       -- system 表空间
	 1 SYSAUX			  YES NO  YES       -- systemaux 表空间
	 2 UNDOTBS1			  YES NO  YES       -- undo 表空间
	 4 USERS			  YES NO  YES       -- users 表空间
	 3 TEMP 			  NO  NO  YES       -- temp 表空间
	 5 UNDOTBS2			  YES NO  YES       -- undo 表空间
6 rows selected.
```

各种表空间的作用如下：

（1）system 表空间：用来存储整个数据库的数据字典表（data dictionary table），该表空间一旦损坏，数据库将无法打开。

（2）sysaux 表空间：Oracle 将工具放到 sysaux 表空间，以减轻 system 表空间的压力。

（3）undo 表空间：用来保存事务中的 DML 语句的 undo 信息，保存的是数据在被修改之前的值。undo 表空间用于：事务的回滚；实例恢复（回滚）；一致性读时需要构造 CR 块。

（4）temp 表空间：即临时表空间，用来存放用户排序，分组等操作时的数据信息。

（5）users 表空间：存放用户数据。

（6）自定义表空间：用户创建的表空间。

查看表空间对应的数据文件：

```java
SQL> select tablespace_name,file_id,file_name from dba_data_files;
TABLESPACE_NAME 		  FILE_ID FILE_NAME
----------------- ---------- ------------------------------------------------------------
USERS					4 +DATA/orcl/datafile/users.259.1070471891
UNDOTBS1				3 +DATA/orcl/datafile/undotbs1.258.1070471891
SYSAUX					2 +DATA/orcl/datafile/sysaux.257.1070471889
SYSTEM					1 +DATA/orcl/datafile/system.256.1070471889
UNDOTBS2				5 +DATA/orcl/datafile/undotbs2.264.1070472143
SQL> select file#,vd.ts#,vt.name tablespace_name,vd.name datafile_name 
     from v$datafile vd, v$tablespace vt 
     where vd.ts#=vt.ts#;
     FILE#	  TS# TABLESPACE_NAME		     DATAFILE_NAME
---------- ---------- ------------------------------ ------------------------------------
	 1	    0 SYSTEM			     +DATA/orcl/datafile/system.256.1070471889
	 2	    1 SYSAUX			     +DATA/orcl/datafile/sysaux.257.1070471889
	 3	    2 UNDOTBS1			     +DATA/orcl/datafile/undotbs1.258.1070471891
	 4	    4 USERS			         +DATA/orcl/datafile/users.259.1070471891
	 5	    5 UNDOTBS2			     +DATA/orcl/datafile/undotbs2.264.1070472143
```

## 二、创建表空间

Oracle 使用 create tablespace 命令创建表空间，该命令的语法格式如下：

```java
create [TEMPORARY] tablespace tablespace_name  ----- 表空间的名称
TEMPFILE | datafile '.../*.dbf'               ----- 数据文件的路径和名称
size x M|G                         ----- 数据文件的初始大小
autoextend on next x M|G           ----- 数据文件每次自动扩展多少
maxsize unlimited | x M|G;         ----- 数据文件的最大尺寸
-- 说明：TEMPORARY 选项用于创建临时表空间，同时使用 TEMPFILE 指定文件名。
```

举例：

```java
SQL> create tablespace ts001 
     datafile '+DATA/orcl/datafile/ts001.DBF' 
     size 100M 
     autoextend on next 100M 
     maxsize 2G;
Tablespace created.
SQL> select tablespace_name,file_id,file_name from dba_data_files;
TABLESPACE_NAME 		  FILE_ID FILE_NAME
------ ---------- ------------------------------------------------------------
USERS					4 +DATA/orcl/datafile/users.259.1070471891
UNDOTBS1				3 +DATA/orcl/datafile/undotbs1.258.1070471891
SYSAUX					2 +DATA/orcl/datafile/sysaux.257.1070471889
SYSTEM					1 +DATA/orcl/datafile/system.256.1070471889
UNDOTBS2				5 +DATA/orcl/datafile/undotbs2.264.1070472143
TS001					6 +DATA/orcl/datafile/ts001.dbf
6 rows selected.
```

创建用户 hmj 并指定临时表空间和默认表空间：

```java
-- 创建用户 hmj
create user hmj identified by hmj
default tablespace TS001
temporary tablespace TEMP;
-- 给用户 hmj 授权
SQL> grant connect, resource to hmj;
Grant succeeded.
```

## 三、数据文件的管理

### 1、为表空间添加数据文件

```java
SQL> alter tablespace ts001 
     add datafile '+DATA/orcl/datafile/ts001_2.dbf' 
     size 100M 
     autoextend on next 50m;
Tablespace altered.
SQL> select tablespace_name,file_id,file_name from dba_data_files;
TABLESPACE_NAME 		  FILE_ID FILE_NAME
---------------------------------------------------------------------------------
USERS					4 +DATA/orcl/datafile/users.259.1070471891
UNDOTBS1				3 +DATA/orcl/datafile/undotbs1.258.1070471891
SYSAUX					2 +DATA/orcl/datafile/sysaux.257.1070471889
SYSTEM					1 +DATA/orcl/datafile/system.256.1070471889
UNDOTBS2				5 +DATA/orcl/datafile/undotbs2.264.1070472143
TS001					6 +DATA/orcl/datafile/ts001.dbf
TMP002					7 +DATA/orcl/datafile/tmp002.dbf
TS001					8 +DATA/orcl/datafile/ts001_2.dbf
8 rows selected.
```

### 2、修改数据文件大小

```java
SQL> alter database orcl
     datafile '+DATA/orcl/datafile/ts001_2.dbf' 
     resize 200M;
Database altered.
```

### 3、重命名数据文件

### （1）使用 alter tablespace 命令——不需要停库

```java
-- 数据库在 open 状态
--1、设置表空间为 offline 状态
SQL> alter tablespace ts001 offline;
Tablespace altered.
--2、在操作系统下修改文件名
ASMCMD> cp +DATA/orcl/datafile/ts001.dbf +DATA/orcl/datafile/ts001_1.dbf
copying +DATA/orcl/datafile/ts001.dbf -> +DATA/orcl/datafile/ts001_1.dbf
ASMCMD> rm +DATA/orcl/datafile/ts001.dbf
--3、更新控制文件中的数据文件信息
SQL> alter tablespace rename file '+DATA/orcl/datafile/ts001.dbf' to '+DATA/orcl/datafile/ts001_1.dbf';
Tablespace altered.
--4、设置表空间为 online 状态
SQL> alter tablespace ts001 online;
Tablespace altered.
```

查看表空间对应的数据文件信息：

```java
SQL> select tablespace_name,file_id,file_name from dba_data_files;
TABLESPACE_NAME 		  FILE_ID FILE_NAME
---------------------- ---------- ------------------------------------------------------------
USERS					4 +DATA/orcl/datafile/users.259.1070471891
UNDOTBS1				3 +DATA/orcl/datafile/undotbs1.258.1070471891
SYSAUX					2 +DATA/orcl/datafile/sysaux.257.1070471889
SYSTEM					1 +DATA/orcl/datafile/system.256.1070471889
UNDOTBS2				5 +DATA/orcl/datafile/undotbs2.264.1070472143
TS001					6 +DATA/orcl/datafile/ts001_1.dbf
TMP002					7 +DATA/orcl/datafile/tmp002.dbf
TS001					8 +DATA/orcl/datafile/ts001_2.dbf
8 rows selected.
```

### （2）使用 alter database 命令——需要停库

```java
--1、关闭数据库
SQL> shutdown immediate
Database closed.
Database dismounted.
ORACLE instance shut down.
--2、移动 ts001 表空间对应的数据文件
ASMCMD> cp +DATA/orcl/datafile/ts001_1.dbf +DATA/orcl/datafile/ts1_001.dbf
copying +DATA/orcl/datafile/ts001_1.dbf -> +DATA/orcl/datafile/ts1_001.dbf
ASMCMD> rm +DATA/orcl/datafile/ts001_1.dbf
ASMCMD> cp +DATA/orcl/datafile/ts001_2.dbf +DATA/orcl/datafile/ts1_002.dbf
copying +DATA/orcl/datafile/ts001_2.dbf -> +DATA/orcl/datafile/ts1_002.dbf
ASMCMD> rm +DATA/orcl/datafile/ts001_2.dbf
--3、启动到数据库到 mount 状态
SQL> startup mount
ORACLE instance started.
Total System Global Area  835104768 bytes
Fixed Size		    2257840 bytes
Variable Size		  603982928 bytes
Database Buffers	  226492416 bytes
Redo Buffers		    2371584 bytes
Database mounted.
--4、使用 alter database 命令更改控制文件中数据文件的位置信息
SQL> alter database rename file '+DATA/orcl/datafile/ts001_1.dbf' to '+DATA/orcl/datafile/ts1_001.dbf';
Database altered.
SQL> alter database rename file '+DATA/orcl/datafile/ts001_2.dbf' to '+DATA/orcl/datafile/ts1_002.dbf';
Database altered.
--5、启动数据库到 open 状态
SQL> alter database open;
Database altered.
```

查看表空间对应的数据文件信息：

```java
SQL> select tablespace_name,file_id,file_name from dba_data_files;
TABLESPACE_NAME 		  FILE_ID FILE_NAME
-------------- ---------- ------------------------------------------------------------
USERS					4 +DATA/orcl/datafile/users.259.1070471891
UNDOTBS1				3 +DATA/orcl/datafile/undotbs1.258.1070471891
SYSAUX					2 +DATA/orcl/datafile/sysaux.257.1070471889
SYSTEM					1 +DATA/orcl/datafile/system.256.1070471889
UNDOTBS2				5 +DATA/orcl/datafile/undotbs2.264.1070472143
TS001					6 +DATA/orcl/datafile/ts1_001.dbf
TMP002					7 +DATA/orcl/datafile/tmp002.dbf
TS001					8 +DATA/orcl/datafile/ts1_002.dbf
8 rows selected.
```
