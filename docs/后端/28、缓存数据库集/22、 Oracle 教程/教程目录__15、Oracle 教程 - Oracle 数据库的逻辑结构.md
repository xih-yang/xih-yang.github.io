# 15、Oracle 教程 - Oracle 数据库的逻辑结构
- 来源：https://ddkk.com/zhuanlan/db/oracle/1/15.html
- 分类：缓存数据库
- 分组：教程目录
数据库的物理结构定义了数据库包含的实际存在的数据文件。而数据文件中的数据之间存在一定的逻辑关系，所有数据之间的对应关系称为数据库的逻辑结构。数据库从逻辑上可以划分为以下几个层次：

（1）表空间（Tablespace）：Oracle 数据库逻辑上由一个或多个表空间组成。表空间物理上由一个或多个数据文件构成。

（2）段（Segment）：一个或多个段组成一个表空间。通过为各种不同的数据库对象分配不同的段，来保存数据。比如：student 表中的所有数据会存放在 student 段中。

（3）区（Extent）：由一个或多个区组成一个段。

（4）数据块（Data Block）：若干个连续存储的数据块组成一个区。数据块是数据库 I/O 最小的单位。数据块的大小是操作系统块大小的整数倍。

Oracle 数据库的逻辑结构与物理结构的对应关系如下图所示：

## 一、表空间（Tablespace）

Oracle 数据库是由若干个表空间构成的。任何数据库对象在存储时都必须存储在某个表空间中。表空间对应若干个磁盘文件，即表空间是由一个或多个磁盘文件构成的。表空间相当于操作系统中的文件夹，也是数据库逻辑结构与物理文件之间的一个映射。表空间的大小等于所有从属于它的数据文件大小的总和。Oracle 数据库一般包含以下几种类型的表空间：

（1）系统表空间（system tablespace）：系统表空间中存放诸如表空间名称、表空间所含的数据文件等数据库管理所需的信息。系统表空间必须在任何时候都处于可用状态，也是数据库运行的必要条件。因此，系统表空间不能脱机。系统表空间包括数据字典、存储过程、触发器和系统回滚段。

（2）SYSAUX 表空间（SYSAUX tablespace）：充当 SYSTEM 的辅助表空间，主要存储除数据字典以外的其他对象。以降低 SYSTEM 表空间的负荷。

（3）临时表空间（temp tablespace）：用于存储 Oracle 数据库运行期间所产生的临时数据。一个数据库可以创建多个临时表空间。当数据库关闭后，临时表空间中所有数据将全部被清除。

（4）undo 空间（undo tablespace）：用来保存事务中的 DML 语句的 undo 信息，保存的是数据在被修改之前的值。undo 表空间用于：事务的回滚；实例恢复（回滚）；一致性读时需要构造 CR 块。

一个数据库一般包含以下几个表空间：SYSTEM 表空间、临时表空间（用于存放临时数据）、UNDO（存放 undo 信息）、用户自定义的表空间（存放用户数据）。

查询数据库包含的表空间信息：

```java
SQL> SELECT name FROM V$TABLESPACE;
NAME
------------------------------
SYSTEM
SYSAUX
UNDOTBS1
USERS
TEMP
UNDOTBS2
TS001
TMP002
8 rows selected.
```

查看表空间对应的数据文件：

```java
 SQL> SELECT TABLESPACE_NAME,FILE_NAME FROM DBA_DATA_FILES;
TABLESPACE_NAME 	       FILE_NAME
------------------------------ --------------------------------------------------------
USERS			       +DATA/orcl/datafile/users.259.1070471891
UNDOTBS1		       +DATA/orcl/datafile/undotbs1.258.1070471891
SYSAUX			       +DATA/orcl/datafile/sysaux.257.1070471889
SYSTEM			       +DATA/orcl/datafile/system.256.1070471889
UNDOTBS2		       +DATA/orcl/datafile/undotbs2.264.1070472143
TS001			       +DATA/orcl/datafile/ts1_001.dbf
TMP002			       +DATA/orcl/datafile/tmp002.dbf
TS001			       +DATA/orcl/datafile/ts1_002.dbf
8 rows selected.
```

## 二、 段（Segment）

当建立数据对象（表、索引、簇等）时，Oracle 会自动给这些数据对象分配相应的存储空间，以存放它们的数据信息，这些为数据对象所分配的存储空间被称为段。

一个段只能存放在一个表空间中，但是可分布在属于这个表空间中的多个数据文件中。段由多个区组成，用于保存特定的数据库对象，每种数据对象都具有相应的段。段可分为以下几种类型：

（1）数据段：也称为表段，当创建一张表时，系统自动创建一个以该表的名字命名的数据段。

（2）索引段：包含索引信息。创建索引时，系统自动创建一个以该索引的名字命名的索引段。

（3）回滚段：当一个事务开启（DML 会自动开启事务）时，系统会自动为之分配回滚段。当修改表中数据的时候，该数据修改前的值会存放在回滚段中，当用户回滚（rollback）事务时，Oracle 将利用回滚段中保存的数据来恢复到原来的值。提交事务之后，系统会自动释放相应回滚段的数据。

（4）临时段：是 Oracle 在运行过程中自行创建的段。当一个 SQL 语句需要临时工作区时，由 Oracle 建立临时段。一旦语句执行完毕，临时段将自动消除。

（5）LOB 段：如果表中含有 CLOB 和 BLOB 等大型对象类型数据时，系统将创建 LOB 段以存储相应的大型对象数据。

查看scott 用户所有的段及类型：

```java
SQL> select segment_name,segment_type,owner 
     from dba_segments 
     where owner='SCOTT';
SEGMENT_NAME				  SEGMENT_TYPE	     OWNER
------------------------------------- ------------------ ------------------------------
PK_EMP						  INDEX 	     SCOTT
PK_DEPT 					  INDEX 	     SCOTT
E02							  TABLE 	     SCOTT
E01							  TABLE 	     SCOTT
SALGRADE					  TABLE 	     SCOTT
EMP							  TABLE 	     SCOTT
DEPT						  TABLE 	     SCOTT
7 rows selected.
```

## 三、区（extent）

区是由一组连续的数据块（data block）构成的数据库逻辑存储分配单位。用于保存特定数据类型的数据，区不可跨越多个数据文件。

当用户创建表时，Oracle 为此表的数据段分配一个包含若干数据块的初始区（initial extent）。如果一个段的初始区中的数据块已满，且有新数据插入时，Oracle 自动为这个段分配一个增量区（incremental extent）。为了管理的需要，每个段的段头（header block）包含一个记录此段所有区（extent）的目录。

段的定义中包含了区（extent）的存储参数，存储参数适用于各种类型的段。该参数控制 Oracle 如何为段分配可用空间。如：在 CREATE TABLE 语句中使用 STORAGE 子句设定存储参数，决定创建表时为段分配多少初始空间，或限定一个表最多可以包含多少区。如果没有指定存储参数，创建表时使用所在表空间的默认存储参数。

## 四、数据块（data block）

数据块是 Oracle 逻辑存储结构中最小的一个逻辑单元，也是执行数据库输入输出操作的最小存储单元。

Oracle 数据块的大小是操作系统数据块的整数倍。

Oracle 数据库支持同一个数据库中使用多种大小的块，初始化参数 DB_BLOCK_SIZE 确定数据块的标准大小，与标准块大小不同的块就是非标准块。

一个Oracle block 由三个部分组成，分别是：数据块头、自由空间、实际数据。

查看数据块大小：

```java
SQL> show parameter db_block_size
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
db_block_size			     integer	 8192
SQL> select name,value 
     from v$parameter 
     where name = 'db_block_size';
NAME		     VALUE
-------------------- ------------------------------
db_block_size	     8192
```
