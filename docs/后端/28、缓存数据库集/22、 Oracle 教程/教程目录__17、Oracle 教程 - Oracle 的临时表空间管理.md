# 17、Oracle 教程 - Oracle 的临时表空间管理
- 来源：https://ddkk.com/zhuanlan/db/oracle/1/17.html
- 分类：缓存数据库
- 分组：教程目录
临时表空间用来管理数据库排序操作以及用于存储临时表、中间排序结果等临时对象。如果 Oracle 需要执行排序操作时，并且当 PGA 中 sort_area_size 大小不够时，就会把数据放入临时表空间里进行排序。当操作完成后，系统会自动清理临时表空间中的临时对象，自动释放临时段。和永久表空间不同的地方在于它是由临时数据文件（temporary files）组成的。临时表空间不会存储永久类型的对象，因此不需要备份。

此外，对临时数据文件的操作不产生 redo 日志，但会生成 undo 日志。

临时表空间存储大规模排序操作(小规模排序操作会直接在RAM里完成，大规模排序才需要磁盘排序Disk Sort)和散列操作的中间结果.它跟永久表空间不同的地方在于它由临时数据文件（temporary files）组成的,而不是永久数据文件（datafiles）。临时表空间不会存储永久类型的对象，所以它不会也不需要备份。另外，对临时数据文件的操作不产生redo日志，不过会生成undo日志。

## 一、查看临时表空间信息

### 1、查看临时空间及临时文件

```java
SQL> select tablespace_name,contents from dba_tablespaces;
TABLESPACE_NAME                CONTENTS
------------------------------ ---------
SYSTEM                         PERMANENT  --永久表空间
SYSAUX                         PERMANENT  --永久表空间
UNDOTBS1                       UNDO       --undo 表空间
TEMP                           TEMPORARY  --临时表空间
USERS                          PERMANENT  --永久表空间
SQL> select file#, ts#, name from v$tempfile;
     FILE#	  TS#   NAME
---------- ---------- -----------------------------------------------------------
	 1	    3     +DATA/orcl/tempfile/temp.263.1070472029
SQL> select file_id, file_name, tablespace_name from dba_temp_files;
   FILE_ID FILE_NAME							TABLESPACE_NAME
------------------------------------------------------------ --------------------
	 1 +DATA/orcl/tempfile/temp.263.1070472029			TEMP
SQL> select * from v$tablespace;
       TS# NAME 					      INC BIG FLA ENC
---------- -------------------------------------------------- --- --- --- -------
	 0 SYSTEM					      YES NO  YES
	 1 SYSAUX					      YES NO  YES
	 2 UNDOTBS1					      YES NO  YES
	 4 USERS					      YES NO  YES
	 3 TEMP 					      NO  NO  YES    ---临时表空间
	 5 UNDOTBS2					      YES NO  YES
	 6 TS001					      YES NO  YES
7 rows selected.
```

### 2、查看数据库默认的临时表空间

```java
SQL> SELECT PROPERTY_VALUE
     FROM database_properties
     WHERE PROPERTY_NAME = 'DEFAULT_TEMP_TABLESPACE';
PROPERTY_VALUE
----------------------------------------------------------------------------------
TEMP
```

## 二、创建临时表空间

创建临时表空间的语法和永久表空间相似，命令如下：

```java
SQL> create temporary tablespace temp02 tempfile '+DATA/orcl/tempfile/temp02.dbf' 
    size 50M autoextend on next 50M;
Tablespace created.
```

查看永久表空间及其对应的临时文件：

```java
SQL> select file_id, file_name, tablespace_name from dba_temp_files;
   FILE_ID FILE_NAME							TABLESPACE_NAME
---------- ------------------------------------------------------------ --------------------
	 1 +DATA/orcl/tempfile/temp.263.1070472029			TEMP
	 2 +DATA/orcl/tempfile/temp02.dbf				TEMP02
```

此外，为临时表空间添加数据文件、更改数据文件的大小、删除表空间对应的数据文件等操作与永久表空间的对应操作也是基本相同的。

## 三、设置用户默认的临时表空间

默认情况下，用户的默认临时表空间自动继承数据库的默认临时表空间。

### 1、查看数据库的默认临时表空间和用户的默认临时表空间

```java
--查看数据库的默认临时表空间
SQL> select *
     from database_properties
     where property_name like '%TABLESPACE%';
PROPERTY_NAME		       PROPERTY_VALUE	  DESCRIPTION
------------------------------ ------------------------------ ------------------------------
DEFAULT_TEMP_TABLESPACE        TEMP		Name of default temporary tablespace  --数据库默认临时表空间
DEFAULT_PERMANENT_TABLESPACE   USERS	Name of default permanent tablespace  --数据库默认永久表空间
--查看某个用户的默认临时表空间
SQL> select user_id,username,default_tablespace,temporary_tablespace 
     from dba_users where username='JOHN';
   USER_ID USERNAME			  DEFAULT_TABLESPACE		 TEMPORARY_TABLESPACE
----------------------------- ------------------------------ ------------------------------
	88 JOHN 			  USERS 			 TEMP
--用户 john 的默认永久表空间为 users，默认临时表空间为 temp
```

### 2、修改数据库的默认临时表空间

```java
SQL> alter database default temporary tablespace temp02;
Database altered.
```

查看数据库的默认临时表空间和 john 用户的默认临时表空间：

```java
--查看数据库的默认临时表空间
SQL> select *
     from database_properties
     where property_name = 'DEFAULT_TEMP_TABLESPACE';
PROPERTY_NAME		       PROPERTY_VALUE		      DESCRIPTION
------------------------------ ------------------------------ ------------------------------
DEFAULT_TEMP_TABLESPACE        TEMP02			      Name of default temporary tablespace
--查看用户 john 的默认临时表空间
SQL> select user_id,username,temporary_tablespace 
     from dba_users where username='JOHN';
   USER_ID USERNAME			  TEMPORARY_TABLESPACE
---------- ------------------------------ ------------------------------
	88 JOHN 			  TEMP02
--说明：可以看到，用户 john 的默认临时表空间自动继承于数据库的默认临时表空间。
--当然，也可以为用户指定一个和数据库默认临时表空间不相同的默认临时表空间。
```

### 3、把数据库的默认临时表空间修改为 temp，把用户 john 的默认临时表空间修改为 temp02

```java
SQL> alter database default temporary tablespace temp;
Database altered.
SQL> alter user john temporary tablespace temp02;
User altered.
```

重新查看数据库的默认临时表空间和 john 用户的默认临时表空间：

```java
--查看数据库的默认临时表空间
SQL> select *
     from database_properties
     where property_name = 'DEFAULT_TEMP_TABLESPACE';
PROPERTY_NAME		       PROPERTY_VALUE		      DESCRIPTION
------------------------------ ------------------------------ ------------------------------
DEFAULT_TEMP_TABLESPACE        TEMP			      Name of default temporary tabl
							      espace
--查看用户 john 的默认临时表空间
SQL> select user_id,username,temporary_tablespace 
     from dba_users where username='JOHN';
   USER_ID USERNAME			  TEMPORARY_TABLESPACE
---------- ------------------------------ ------------------------------
	88 JOHN 			  TEMP02
```

## 四、使用临时表空间组

临进表空间组是 Oracle10g 开始引入的一个新特性，它是一个逻辑概念，不需要显示的创建和删除。只要把一个临时表空间分配到一个组中，临时表空间组就自动创建，所有的临时表空间从临时表空间组中移除就自动删除。如果删除一个临时表空间组的所有成员，该组也自动被删除。

临时表空间的名字不能与临时表空间组的名字相同，可以在创建临时表空间是指定表空间组。

临时表空间的作用：可以把用户的默认临时表空间指定为一个临时表空间组，当此用户建立多个连接时如果用到临时表空间，不同的连接将会使用临时表空间组中的不同临时表空间。

### 1、创建临时表空间同时加入临时表空间组

```java
SQL> CREATE TEMPORARY TABLESPACE TEMP03 
     TEMPFILE '+DATA/orcl/tempfile/temp03.dbf' SIZE 10M 
     TABLESPACE GROUP temp_group;
Tablespace created.
```

### 2、查看临时表空间组

```java
SQL> select * from dba_tablespace_groups;
GROUP_NAME		       TABLESPACE_NAME
------------------------------ --------------------
TEMP_GROUP		       TEMP03
```

### 3、把表空间加入临时表空间组

```java
SQL> ALTER TABLESPACE TEMP02 TABLESPACE GROUP TEMP_GROUP;
Tablespace altered.
SQL> select * from dba_tablespace_groups;
GROUP_NAME		       TABLESPACE_NAME
------------------------------ --------------------
TEMP_GROUP		       TEMP02
TEMP_GROUP		       TEMP03
```

### 4、把临时表空间从临时表空间组中移除

```java
SQL> ALTER TABLESPACE TEMP03 TABLESPACE GROUP '';
Tablespace altered.
SQL> select * from dba_tablespace_groups;
GROUP_NAME		       TABLESPACE_NAME
------------------------------ --------------------
TEMP_GROUP		       TEMP02
```

### 5、指定用户的默认临时表空间为临时表空间组

```java
SQL> alter user john temporary tablespace TEMP_GROUP;
User altered.
SQL> select user_id,username,temporary_tablespace 
     from dba_users where username='JOHN';
   USER_ID USERNAME			  TEMPORARY_TABLESPACE
---------- ------------------------------ ------------------------------
	88 JOHN 			  TEMP_GROUP
```
