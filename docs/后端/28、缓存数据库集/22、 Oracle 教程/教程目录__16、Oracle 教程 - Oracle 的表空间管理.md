# 16、Oracle 教程 - Oracle 的表空间管理
- 来源：https://ddkk.com/zhuanlan/db/oracle/1/16.html
- 分类：缓存数据库
- 分组：教程目录
Oracle 的表空间（Tablespace）是一个逻辑概念，Oracle 数据库是由若干个表空间构成的。数据库对象在存储时必须存储在某个表空间中。一个表空间对应若干个数据文件，即一个表空间由一个或多个数据文件构成，但一个数据文件只能属于一个表空间。

表空间可以理解为操作系统中的文件夹，是 Oracle 数据库逻辑结构与物理文件之间的一个映射。数据库的存储空间在物理上表现为数据文件，在逻辑上表现为表空间。表空间的大小等于所有从属于它的数据文件大小的总和。

## 一、表空间的类型

Oracle 数据库一般包含以下几种类型的表空间：

（1）系统表空间（system tablespace）：系统表空间中存放诸如表空间名称、表空间所含的数据文件等数据库管理所需的信息。系统表空间必须在任何时候都处于可用状态，也是数据库运行的必要条件。因此，系统表空间不能脱机。系统表空间包括数据字典、存储过程、触发器和系统回滚段。

（2）SYSAUX 表空间（SYSAUX tablespace）：充当 SYSTEM 的辅助表空间，主要存储除数据字典以外的其他对象。以降低 SYSTEM 表空间的负荷。

（3）临时表空间（temp tablespace）：用于存储 Oracle 数据库运行期间所产生的临时数据。一个数据库可以创建多个临时表空间。当数据库关闭后，临时表空间中所有数据将全部被清除。

（4）undo 空间（undo tablespace）：用来保存事务中的 DML 语句的 undo 信息，保存的是数据在被修改之前的值。undo 表空间用于：事务的回滚；实例恢复（回滚）；一致性读时需要构造 CR 块。

一个数据库一般包含以下几个表空间：SYSTEM 表空间、临时表空间（用于存放临时数据）、UNDO（存放 undo 信息）、用户自定义的表空间（存放用户数据）。

查看表空间：

```java
SQL> select name from v$tablespace;
NAME
--------------------
SYSTEM          --系统表空间：保存数据字典信息
SYSAUX          --SYSAUX表空间
UNDOTBS1        --undo表空间：保存 undo 数据
USERS           --users表空间/用户自定义表空间：保存用户数据
TEMP            --临时表空间：保存排序、分组等操作时产生的临时数据
UNDOTBS2        --undo表空间：保存 undo 数据
6 rows selected.
```

查看表空间对应的数据文件：

```java
SQL> select tablespace_name, file_name from dba_data_files;
TABLESPACE_NAME 	       FILE_NAME
-----------------------------------------------------------------------------
USERS			       +DATA/orcl/datafile/users.259.1070471891
UNDOTBS1		       +DATA/orcl/datafile/undotbs1.258.1070471891
SYSAUX			       +DATA/orcl/datafile/sysaux.257.1070471889
SYSTEM			       +DATA/orcl/datafile/system.256.1070471889
UNDOTBS2		       +DATA/orcl/datafile/undotbs2.264.1070472143
5 rows selected.
```

## 二、与数据文件、临时文件、表空间有关的数据字典

### 1、与表空间相关的数据字典与动态性能视图

（1）V$TABLESPACE

```java
SQL> desc V$TABLESPACE;
 Name							     Null?    Type
 ------------------------------------------------------------------------------- 
 TS#											      NUMBER
 NAME											      VARCHAR2(30)
 INCLUDED_IN_DATABASE_BACKUP						    VARCHAR2(3)
 BIGFILE										      VARCHAR2(3)
 FLASHBACK_ON										  VARCHAR2(3)
 ENCRYPT_IN_BACKUP									  VARCHAR2(3)
 SQL> select ts#, name  from V$TABLESPACE;
       TS# NAME
---------- --------------------------------------------------
	 0 SYSTEM
	 1 SYSAUX
	 2 UNDOTBS1
	 4 USERS
	 3 TEMP
	 5 UNDOTBS2
6 rows selected.
```

（2）DBA_TABLESPACES

```java
SQL> desc DBA_TABLESPACES;
 Name										     Null?    Type
 ----------------------------------------------------------------------------------- 
 TABLESPACE_NAME							     NOT NULL VARCHAR2(30)
 BLOCK_SIZE									     NOT NULL NUMBER
 INITIAL_EXTENT 									      NUMBER
 NEXT_EXTENT										      NUMBER
 MIN_EXTENTS								     NOT NULL NUMBER
 MAX_EXTENTS										      NUMBER
 MAX_SIZE											      NUMBER
 PCT_INCREASE										      NUMBER
 MIN_EXTLEN											      NUMBER
 STATUS 											      VARCHAR2(9)
 CONTENTS										     	 VARCHAR2(9)
 LOGGING											      VARCHAR2(9)
 FORCE_LOGGING										      VARCHAR2(3)
 EXTENT_MANAGEMENT									      VARCHAR2(10)
 ALLOCATION_TYPE									      VARCHAR2(9)
 PLUGGED_IN											      VARCHAR2(3)
 SEGMENT_SPACE_MANAGEMENT							       VARCHAR2(6)
 DEF_TAB_COMPRESSION								       VARCHAR2(8)
 RETENTION										   	      VARCHAR2(11)
 BIGFILE										    	  VARCHAR2(3)
 PREDICATE_EVALUATION									   VARCHAR2(7)
 ENCRYPTED										           VARCHAR2(3)
 COMPRESS_FOR										       VARCHAR2(12)
SQL> select tablespace_name, status, contents, max_size/1024/1024 maxsizeMB
     from dba_tablespaces;
TABLESPACE_NAME      STATUS    CONTENTS   MAXSIZEMB
-------------------- --------- --------- ----------
SYSTEM		     ONLINE    PERMANENT       2048
SYSAUX		     ONLINE    PERMANENT       2048
UNDOTBS1	     ONLINE    UNDO	       	   2048
TEMP		     ONLINE    TEMPORARY       2048
USERS		     ONLINE    PERMANENT       2048
UNDOTBS2	     ONLINE    UNDO	           2048
6 rows selected.
```

### 2、与数据文件相关的数据字典与动态性能视图

（1）V$DATAFILE

```java
SQL> desc V$DATAFILE;
 Name										     Null?    Type
 ----------------------------------------------------------------------------
 FILE#											      NUMBER
 CREATION_CHANGE#									      NUMBER
 CREATION_TIME										      DATE
 TS#											      NUMBER
 RFILE# 										      NUMBER
 STATUS 										      VARCHAR2(7)
 ENABLED										      VARCHAR2(10)
 CHECKPOINT_CHANGE#									      NUMBER
 CHECKPOINT_TIME									      DATE
 UNRECOVERABLE_CHANGE#									      NUMBER
 UNRECOVERABLE_TIME									      DATE
 LAST_CHANGE#										      NUMBER
 LAST_TIME										      DATE
 OFFLINE_CHANGE#									      NUMBER
 ONLINE_CHANGE# 									      NUMBER
 ONLINE_TIME										      DATE
 BYTES											      NUMBER
 BLOCKS 										      NUMBER
 CREATE_BYTES										      NUMBER
 BLOCK_SIZE										      NUMBER
 NAME											      VARCHAR2(513)
 PLUGGED_IN										      NUMBER
 BLOCK1_OFFSET										      NUMBER
 AUX_NAME										      VARCHAR2(513)
 FIRST_NONLOGGED_SCN									      NUMBER
 FIRST_NONLOGGED_TIME									      DATE
 FOREIGN_DBID										      NUMBER
 FOREIGN_CREATION_CHANGE#								      NUMBER
 FOREIGN_CREATION_TIME									      DATE
 PLUGGED_READONLY									      VARCHAR2(3)
 PLUGIN_CHANGE# 									      NUMBER
 PLUGIN_RESETLOGS_CHANGE#								      NUMBER
 PLUGIN_RESETLOGS_TIME									      DATE
SQL> select file#, name, ts#, status from v$datafile;
     FILE# NAME 						     TS# STATUS
---------- -------------------------------------------------- ---------- -------
	 1 +DATA/orcl/datafile/system.256.1070471889		       0 SYSTEM
	 2 +DATA/orcl/datafile/sysaux.257.1070471889		       1 ONLINE
	 3 +DATA/orcl/datafile/undotbs1.258.1070471891		       2 ONLINE
	 4 +DATA/orcl/datafile/users.259.1070471891		           4 ONLINE
	 5 +DATA/orcl/datafile/undotbs2.264.1070472143		       5 ONLINE
```

（2）DBA_DATA_FILES

```java
SQL> desc DBA_DATA_FILES;
 Name										     Null?    Type
 ----------------------------------------------------------------------------------
 FILE_NAME										      VARCHAR2(513)
 FILE_ID										      NUMBER
 TABLESPACE_NAME									      VARCHAR2(30)
 BYTES											      NUMBER
 BLOCKS 										      NUMBER
 STATUS 										      VARCHAR2(9)
 RELATIVE_FNO										      NUMBER
 AUTOEXTENSIBLE 									      VARCHAR2(3)
 MAXBYTES										      NUMBER
 MAXBLOCKS										      NUMBER
 INCREMENT_BY										      NUMBER
 USER_BYTES										      NUMBER
 USER_BLOCKS										      NUMBER
 ONLINE_STATUS										      VARCHAR2(7)
SQL> select file_id, file_name, tablespace_name, maxbytes/1024/1024/1024 maxsizeGB
     from dba_data_files;
   FILE_ID FILE_NAME							TABLESPACE_NAME       MAXSIZEGB
---------- ------------------------------------------------------------ -------------------- 
	 4 +DATA/orcl/datafile/users.259.1070471891			USERS		     31.9999847
	 3 +DATA/orcl/datafile/undotbs1.258.1070471891		UNDOTBS1	     31.9999847
	 2 +DATA/orcl/datafile/sysaux.257.1070471889		SYSAUX		     31.9999847
	 1 +DATA/orcl/datafile/system.256.1070471889		SYSTEM		     31.9999847
	 5 +DATA/orcl/datafile/undotbs2.264.1070472143		UNDOTBS2	     31.9999847
```

### 3、与临时文件相关的数据字典与动态性能视图

（1）V$TEMPFILE

```java
SQL> desc V$TEMPFILE;
 Name										     Null?    Type
 ----------------------------------------------------------------------------------
 FILE#											      NUMBER
 CREATION_CHANGE#									      NUMBER
 CREATION_TIME										      DATE
 TS#											      NUMBER
 RFILE# 										      NUMBER
 STATUS 										      VARCHAR2(7)
 ENABLED										      VARCHAR2(10)
 BYTES											      NUMBER
 BLOCKS 										      NUMBER
 CREATE_BYTES										      NUMBER
 BLOCK_SIZE										      NUMBER
 NAME											      VARCHAR2(513)
SQL> select file#, name, ts# from v$tempfile;
     FILE# NAME 						     TS#
---------- -------------------------------------------------- ----------
	 1 +DATA/orcl/tempfile/temp.263.1070472029		       3
```

（2）DBA_TEMP_FILES

```java
SQL> desc DBA_TEMP_FILES;
 Name										     Null?    Type
 --------------------------------------------------------------------------------
 FILE_NAME										      VARCHAR2(513)
 FILE_ID										      NUMBER
 TABLESPACE_NAME								     NOT NULL VARCHAR2(30)
 BYTES											      NUMBER
 BLOCKS 										      NUMBER
 STATUS 										      VARCHAR2(7)
 RELATIVE_FNO										      NUMBER
 AUTOEXTENSIBLE 									      VARCHAR2(3)
 MAXBYTES										      NUMBER
 MAXBLOCKS										      NUMBER
 INCREMENT_BY										      NUMBER
 USER_BYTES										      NUMBER
 USER_BLOCKS										      NUMBER
SQL> select file_id, file_name, status, maxbytes/1024/1024/1024 maxsizeGB
     from dba_temp_files;
   FILE_ID FILE_NAME							STATUS	 MAXSIZEGB
---------- ------------------------------------------------------------ ------- ----------
	 1 +DATA/orcl/tempfile/temp.263.1070472029			ONLINE	31.9999847
```

## 三、表空间的管理方式

在表空间中区是最小的空间分配单位，对表空间的管理是以区为单位进行的。由于区（extent）是 Oracle 创建对象时的最小分配单元，所以表空间的管理实际上就是针对区的管理。 根据管理方式不同，表空间分为本地管理表空间（Oracle11g 默认采用本地管理方式的表空间）和字典管理表空间：

### 1、字典管理表空间（Dictionary Management Tablespace，DMT）

由数据字典管理区。数据字典的信息存储在 system 表空间中，Oracle 服务器将在分配或回收区时更新数据字典中对应的表。使用数据字典管理存储空间的分配，当表空间分配新的区，或者回收已分配的区时，Oracle 会对数据字典对应的表进行查询、更新，并且会产生回退和重做信息。字典管理方式较为灵活，但效率要低得多。

用于管理表空间的数据字典表分别为：（1）UET （ U s e d E x t e n t s ， 已 使 用 的 空 间 ） ； （ 2 ） F E T （Used Extents，已使用的空间）；（2）FET （UsedExtents，已使用的空间）；（2）FET（Free Extents，空闲空间）。

查看表空间管理方式：

```java
SQL> select tablespace_name,EXTENT_MANAGEMENT from dba_tablespaces;
TABLESPACE_NAME 	       EXTENT_MAN
------------------------------ ----------
SYSTEM			       LOCAL
SYSAUX			       LOCAL
UNDOTBS1		       LOCAL
TEMP			       LOCAL
USERS			       LOCAL
UNDOTBS2		       LOCAL
6 rows selected.
```

EXTENT_MANAGEMENT 如果显示为 DICTIONARY 就是字典管理表空间。

字典管理表空间的工作方式：当建立一个新的段或者段在表空间中请求新的空间时，Oracle 通过执行一系列的 SQL 语句来完成这个工作，这些工作包括从 FET$ 中找到可用的自由空间，移动或增加相应的行到 UET$ 中，并在 FET$ 中删除相应的记录；当删除一个段的时候，Oracle 则移动 UET$ 中相应的行到 FET$。这个过程的发生是连续的、串行的，在繁忙的数据库中，这类操作极可能导致竞争和等待，产生数据字典的争用；另一方面，当数据字典的表的信息被修改时，系统同样要记录 undo 和 redo 信息，频繁的修改又不可避免地对整个数据库的性能产生影响。

字典管理表空间面临的另外一个严重问题是：空间碎片。

### 2、本地管理方式的表空间（Local Management Tablespace，LMT）

从Oracle 8i 开始，Oracle 引入了一种全新的表空间管理方式：本地管理表空间。所谓本地化管理，就是指 Oracle 不再利用数据字典表来记录 Oracle 表空间里面的区间的使用状况，而是在每个表空间的数据文件的头部加入了一个位图区域，在其中记录每个 Extent 的使用状况。每当一个 Extent 被使用，或者被释放以供重新使用时，Oracle 都会更新数据文件头部的这个记录，反映这个变化。

在创建本地管理表空间时，还可以选择更具体的空间分配方式：自动分配（autoallocate）和统一尺寸（uniform）。若为自动分配，则让 Oracle 来决定区块的使用办法，缺省地 Oracle 会按照递增算法来分配空间；如果选择统一尺寸，则还可以详细指定每个区间（Extent）的大小。

在本地管理表空间的空间管理上，Oracle 将存储信息保存在表空间头部的位图中，而不是保存在数据字典中。通过这样的方式，在分配或者回收空间的时候，表空间就可以独立地在数据文件头部完成操作而无需与其他对象打交道。因为仅仅操作数据文件头部的几个数据块，不用操作数据字典，所以 Oracle 在本地管理的表空间中添加、删除段时，效率要比字典管理的表空间快，特别是在并发性很强的空间请求中。

本地管理表空间技术的主要优点：

（1）通过位图代替字典管理。本地管理的表空间用数据文件头部的位图块来记录和管理空间的分配和回收，避免了递归的空间管理操作，从而避免了字典操作以及因为字典操作而带来的性能问题。

（2）避免了碎片问题及空间浪费。本地化管理可以通过 UNIFORM 或 AUTOALLOCATE 的方式进行区间管理，通过对Extent 进行 UNIFORM 约定，传统的空间碎片问题得以解决，进而空间的分配效率也大大提高。

查看表空间管理方式：

```java
SQL> select tablespace_name,EXTENT_MANAGEMENT,allocation_type from dba_tablespaces;
TABLESPACE_NAME 	       EXTENT_MAN ALLOCATIO
------------------------------ ---------- ---------
SYSTEM			       LOCAL	  SYSTEM
SYSAUX			       LOCAL	  SYSTEM
UNDOTBS1		       LOCAL	  SYSTEM
TEMP			       LOCAL	  UNIFORM
USERS			       LOCAL	  SYSTEM
UNDOTBS2		       LOCAL	  SYSTEM
TS001			       LOCAL	  SYSTEM
TEMP02			       LOCAL	  UNIFORM
TEMP03			       LOCAL	  UNIFORM
UNDOTBS11		       LOCAL	  SYSTEM
UNDO_ARCHIVE	       LOCAL	  SYSTEM
```

## 四、创建表空间

在创建表空间时，除考虑空间数量、对应的数据文件的大小等基本因素外，还要考虑表空间的存储管理方式、默认存储参数设置、块大小等问题。创建表空间的基本命令如下：

```java
create [TEMPORARY] tablespace tablespace_name  ----- 表空间的名称
TEMPFILE | datafile '.../*.dbf'                ----- 数据文件的路径和名称
size x M|G                                     ----- 数据文件的初始大小
autoextend off | on next x M|G                 ----- 数据文件是否能自动扩展，每次自动扩展多少
maxsize unlimited | x M|G;                     ----- 数据文件的最大尺寸
```

创建一个表空间 ts001（包含一个数据文件，文件的初始大小 100M、文件大小自动扩充，每次增长 100M，最大不超过 2G），命令如下：

```java
SQL> create tablespace ts001 
     datafile '+DATA/orcl/datafile/ts001.DBF' 
     size 100M 
     autoextend on next 100M 
     maxsize 2G;
Tablespace created.
```

查看表空间对应的数据文件：

```java
SQL> select tablespace_name, file_name,autoextensible,
     maxbytes/1024/1024/1024 maxsizeGB,user_bytes/1024/1024 file_sizeMB
     from dba_data_files;
TABLESPACE_NAME    FILE_NAME						        AUT    MAXSIZEGB    FILE_SIZEMB
-------------------- -------------------------------------------------- --- ---------- -----------
USERS		     +DATA/orcl/datafile/users.259.1070471891		YES 31.9999847	     4
UNDOTBS1	     +DATA/orcl/datafile/undotbs1.258.1070471891	YES 31.9999847		74
SYSAUX		     +DATA/orcl/datafile/sysaux.257.1070471889		YES 31.9999847	   699
SYSTEM		     +DATA/orcl/datafile/system.256.1070471889		YES 31.9999847	   749
UNDOTBS2	     +DATA/orcl/datafile/undotbs2.264.1070472143	YES 31.9999847		24
TS001		     +DATA/orcl/datafile/ts001.dbf			       YES	        2	   99
6 rows selected.
```

## 五、调整表空间的大小

如果数据已经占满了表空间，表空间 不能分配新的区时用户不能插入数据记录。理想情况下，在创建表空间时就应该规划好其尺寸。在表空间容量不足时，DBA 可以改变表空间的尺寸。表空间物理上表现为一个或多个数据文件，表空间的尺寸就是表空间所有数据文件尺寸的总和。表空间的大小由数据文件的个数和数据文件的大小决定，可通过以下方法调整：

（1）使用重置数据文件的大小；

（2）为表空间添加新的数据文件。

### 1、修改数据文件的自动扩展属性（AUTOEXTEND）

当激活了数据文件的自动扩展选项之后，如果数据占满了数据文件的所有空间，系统会自动扩展该数据文件。可以指定数据文件的 AUTOEXTEND 子句启用或禁用数据文件的自动扩展。文件将按指定的增量增加直到达到指定的最大值。使用AUTOEXTEND 子句的优点如下：

（1）当表空间的空间用尽时无需过多的直接干预。

（2）确保应用程序不会由于未能分配区而暂停。

关闭数据文件的自动扩展属性：

```java
SQL> ALTER DATABASE DATAFILE '+DATA/orcl/datafile/ts001.dbf' AUTOEXTEND OFF;
Database altered.
```

查看数据文件的自动扩展属性：

```java
SQL> select tablespace_name, file_name,autoextensible
     from dba_data_files;
TABLESPACE_NAME      FILE_NAME						           AUT
-------------------- -------------------------------------------------- ---
USERS		     +DATA/orcl/datafile/users.259.1070471891		YES
UNDOTBS1	     +DATA/orcl/datafile/undotbs1.258.1070471891	YES
SYSAUX		     +DATA/orcl/datafile/sysaux.257.1070471889		YES
SYSTEM		     +DATA/orcl/datafile/system.256.1070471889		YES
UNDOTBS2	     +DATA/orcl/datafile/undotbs2.264.1070472143	YES
TS001		     +DATA/orcl/datafile/ts001.dbf			       NO
6 rows selected.
```

重新开启数据文件的自动扩展属性：

```java
SQL> ALTER DATABASE DATAFILE '+DATA/orcl/datafile/ts001.dbf' 
     AUTOEXTEND on next 100M;
Database altered.
```

查看数据文件的自动扩展属性：

```java
SQL>select tablespace_name, file_name,autoextensible
    from dba_data_files;
TABLESPACE_NAME      FILE_NAME						AUT
-------------------- -------------------------------------------------- ---
USERS		     +DATA/orcl/datafile/users.259.1070471891		YES
UNDOTBS1	     +DATA/orcl/datafile/undotbs1.258.1070471891	YES
SYSAUX		     +DATA/orcl/datafile/sysaux.257.1070471889		YES
SYSTEM		     +DATA/orcl/datafile/system.256.1070471889		YES
UNDOTBS2	     +DATA/orcl/datafile/undotbs2.264.1070472143	YES
TS001		     +DATA/orcl/datafile/ts001.dbf			       YES
6 rows selected.
```

### 2、为表空间增加数据文件

可以通过 ALTER TABLESPACE ADD DATAFILE 命令，向表空间添加数据文件以增加表空间的容量。命令格式如下：

```java
ALTER TABLESPACE tablespace_name ADD DATAFILE filespec [autoextend_clause];
```

为表空间 ts001 增加一个数据文件：

```java
SQL> ALTER TABLESPACE ts001  
     ADD DATAFILE '+DATA/orcl/datafile/ts001_bak.dbf' SIZE 100M 
     autoextend on next 100M;
Tablespace altered.
```

查看表空间对应的数据文件：

```java
SQL> select tablespace_name, file_name,autoextensible,
     maxbytes/1024/1024/1024 maxsizeGB,user_bytes/1024/1024 file_sizeMB
     from dba_data_files;
TABLESPACE_NAME      FILE_NAME						           AUT  MAXSIZEGB FILE_SIZEMB
-------------------- -------------------------------------------------- --- ---------- -----------
USERS		     +DATA/orcl/datafile/users.259.1070471891		YES 31.9999847		  4
UNDOTBS1	     +DATA/orcl/datafile/undotbs1.258.1070471891	YES 31.9999847		  74
SYSAUX		     +DATA/orcl/datafile/sysaux.257.1070471889		YES 31.9999847	     699
SYSTEM		     +DATA/orcl/datafile/system.256.1070471889		YES 31.9999847	     749
UNDOTBS2	     +DATA/orcl/datafile/undotbs2.264.1070472143	YES 31.9999847		 24
TS001		     +DATA/orcl/datafile/ts001.dbf			       YES 31.9999847		99
TS001		     +DATA/orcl/datafile/ts001_bak.dbf			   YES 31.9999847		99
7 rows selected.
```

### 3、手工修改数据文件大小

尽管指定自动扩展选项可以使得数据文件在数据写满的情况下自动扩展，但自动扩展导 致递归空间操作，从而降低系统性能。可以使用 ALTER DATABASE 命令手动增加或减少数据文件的大小。命令格式如下：

```java
ALTER DATABASE DATAFILE file_name RESIZE x K|M;
```

例：把表空间 ts001 对应的数据文件初始大小修改为 200M，命令如下：

```java
SQL> ALTER DATABASE 
     DATAFILE '+DATA/orcl/datafile/ts001.dbf','+DATA/orcl/datafile/ts001_bak.dbf' RESIZE 200M;
Database altered.
```

查看表空间对应的数据文件：

```java
SQL> select tablespace_name, file_name,autoextensible,
     maxbytes/1024/1024/1024 maxsizeGB,user_bytes/1024/1024 file_sizeMB
     from dba_data_files;
TABLESPACE_NAME      FILE_NAME							  AUT  MAXSIZEGB FILE_SIZEMB
------------------------------------------------------------ --- ---------- -----------
USERS		     +DATA/orcl/datafile/users.259.1070471891			  YES 31.9999847	   4
UNDOTBS1	     +DATA/orcl/datafile/undotbs1.258.1070471891		  YES 31.9999847	  74
SYSAUX		     +DATA/orcl/datafile/sysaux.257.1070471889			  YES 31.9999847	 699
SYSTEM		     +DATA/orcl/datafile/system.256.1070471889			  YES 31.9999847	 749
UNDOTBS2	     +DATA/orcl/datafile/undotbs2.264.1070472143		  YES 31.9999847	  24
TS001		     +DATA/orcl/datafile/ts001.dbf				         YES 31.9999847	     199
TS001		     +DATA/orcl/datafile/ts001_bak.dbf				     YES 31.9999847	     199
7 rows selected.
```

### 4、从表空间中删除数据文件

命令如下：

```java
alter tablespace tablespace_name drop datafile 'file_name';
```

例如：删除表空间 ts001 包含的一个数据文件

（1）查看表空间 ts001 包含的数据文件

```java
SQL> select tablespace_name, file_name from dba_data_files;
TABLESPACE_NAME      FILE_NAME
-------------------- ------------------------------------------------------------
USERS		     +DATA/orcl/datafile/users.259.1070471891
UNDOTBS1	     +DATA/orcl/datafile/undotbs1.258.1070471891
SYSAUX		     +DATA/orcl/datafile/sysaux.257.1070471889
SYSTEM		     +DATA/orcl/datafile/system.256.1070471889
UNDOTBS2	     +DATA/orcl/datafile/undotbs2.264.1070472143
TS001		     +DATA/orcl/datafile/ts001.dbf
TS001		     +DATA/orcl/datafile/ts001_bak.dbf
7 rows selected.
```

（2）删除数据文件：+DATA/orcl/datafile/ts001_bak.dbf（第一个数据文件不能删除）

```java
SQL> alter tablespace ts001 drop datafile '+DATA/orcl/datafile/ts001_bak.dbf';
Tablespace altered.
```

（3）查看表空间 ts001 包含的数据文件

```java
SQL> select tablespace_name, file_name from dba_data_files;
TABLESPACE_NAME      FILE_NAME
-------------------- ------------------------------------------------------------
USERS		     +DATA/orcl/datafile/users.259.1070471891
UNDOTBS1	     +DATA/orcl/datafile/undotbs1.258.1070471891
SYSAUX		     +DATA/orcl/datafile/sysaux.257.1070471889
SYSTEM		     +DATA/orcl/datafile/system.256.1070471889
UNDOTBS2	     +DATA/orcl/datafile/undotbs2.264.1070472143
TS001		     +DATA/orcl/datafile/ts001.dbf
6 rows selected.
```

（5）打开数据库。

## 六、修改表空间的读写属性

如果针对表空间的数据只进行检索操作，而不进行任何的修改操作，可以将表空间设置为只读模式。可以执行以下命令：

```java
ALTER TABLESPACE tablespace_name READ ONLY| READ WRITE; 
/*说明：执行该命令时，与该表空间相关的所有事务会自动回滚，不允许再对该表空间进行任何写入操作。此时，用户只能在该表空间的对象上执行查询操作，而不能执行 DML 或 DDL 操作。但可以执行 DROP TABLE 或 DROP INDEX 删除该表空间上的表或索引。因为 DROP 命令只更新数据字典，数据字典位于 system 表空间，而不更新只读表空间上的物理文件。
*/
```

例如：把表空间 ts001 设置为只读状态：

```java
SQL> alter tablespace ts001 read only;
Tablespace altered.
--查看表空间的状态：
SQL> select tablespace_name,status from dba_tablespaces;
TABLESPACE_NAME      STATUS
-------------------- ---------
SYSTEM		     ONLINE
SYSAUX		     ONLINE
UNDOTBS1	     ONLINE
TEMP		     ONLINE
USERS		     ONLINE
UNDOTBS2	     ONLINE
TS001		     READ ONLY
7 rows selected.
```

重新把表空间 ts001 修改为可读写状态：

```java
SQL> ALTER TABLESPACE TS001 READ WRITE; 
Tablespace altered.
--查看表空间的状态：
SQL> select tablespace_name,status from dba_tablespaces;
TABLESPACE_NAME      STATUS
-------------------- ---------
SYSTEM		     ONLINE
SYSAUX		     ONLINE
UNDOTBS1	     ONLINE
TEMP		     ONLINE
USERS		     ONLINE
UNDOTBS2	     ONLINE
TS001		     ONLINE
7 rows selected.
```

## 七、修改表空间的联机（ONLINE）/脱机（OFFLINE） 属性

### 1、表空间的脱机与联机

通过将表空间设置为联机或脱机状态可以控制表空间的可用性。当表空间处于联机状态时，用户可以访问其中的数据。当表空间处于脱机状态时，用户无法访问它的数据。表空间脱机一般用于以下几种情况：

（1）使数据库的一部分表空间不可用，但允许正常访问数据库的其余表空间；

（2）备份表空间时；

（3）在数据库打开时恢复表空间或数据文件；

（4）在数据库打开时移动数据文件。

使表空间脱机和联机的命令如下：

```java
ALTER TABLESPACE tablespace_name ONLINE | OFFLINE [NORMAL|TEMPORARY|IMMEDIATE|FOR RECOVER]}
/*说明：
（1）NORMAL（默认设置）：将表空间中所有数据文件内的所有块从 SGA 中写入数据文件并将数据文件关闭。在使该表空间重新联机之前，无须对其执行介质恢复。
（2）TEMPORARY：对表空间内的所有联机数据文件执行检查点操作，但是在执行检查点时并不检查数据文件的状态，即使某些文件无法写入检查点，Oracle 也会忽略这些错误。在重新联机之前，所有脱机文件可能都需要进行介质恢复。
（3）IMMEDIATE：不保证表空间文件可用，而且不执行检查点操作。在使表空间重新联机前，必须对其执行介质恢复操作。
（4）FOR RECOVER：使表空间脱机以进行表空间时间点恢复。
（5）SYSTEM 表空间无法设置为脱机状态。
（6）当一个表空间脱机后，Oracle 服务器将使与之相关联的所有数据文件脱机。
*/
```

使表空间 ts001 脱机：

```java
SQL> ALTER TABLESPACE ts001 offline;
Tablespace altered.
SQL> select tablespace_name,status from dba_tablespaces;
TABLESPACE_NAME      STATUS
-------------------- ---------
SYSTEM		     ONLINE
SYSAUX		     ONLINE
UNDOTBS1	     ONLINE
TEMP		     ONLINE
USERS		     ONLINE
UNDOTBS2	     ONLINE
TS001		     OFFLINE
7 rows selected.
```

使表空间 ts001 联机：

```java
SQL> ALTER TABLESPACE ts001 online;
Tablespace altered.
SQL> select tablespace_name,status from dba_tablespaces;
TABLESPACE_NAME      STATUS
-------------------- ---------
SYSTEM		     ONLINE
SYSAUX		     ONLINE
UNDOTBS1	     ONLINE
TEMP		     ONLINE
USERS		     ONLINE
UNDOTBS2	     ONLINE
TS001		     ONLINE
7 rows selected.
```

### 2、数据文件的脱机与联机

与表空间类似，可以把数据文件设置为联机或脱机状态。脱机的数据文件对于数据库来说是不可用的，直到它们被恢复为联机状态为止。

如果数据文件发生损坏时，Oracle 会自动将这个数据文件设置为脱机状态，并且记录在警告文件中。如果损坏的文件恢复后，需要以手工方式重新将数据文件恢复为联机状态。将数据文件设置为脱机状态，不会影响表空间的状态，但是反过来，将表空间设置为脱机状态后，属于该表空间的数据文件同时会进入脱机状态。可以使用 ALTER ATABASE 命令改变数据文件的状态：

```java
--把表空间 ts001 对应的数据文件设置为脱机状态
SQL> ALTER DATABASE DATAFILE '+DATA/orcl/datafile/ts001.dbf' OFFLINE;
Database altered.
--查看表空间的状态
SQL> select tablespace_name,status from dba_tablespaces;
TABLESPACE_NAME      STATUS
-------------------- ---------
SYSTEM		     ONLINE
SYSAUX		     ONLINE
UNDOTBS1	     ONLINE
TEMP		     ONLINE
USERS		     ONLINE
UNDOTBS2	     ONLINE
TS001		     ONLINE
7 rows selected.
--查看数据文件的状态
SQL> select name,status from v$datafile;
NAME							     STATUS
------------------------------------------------------------ -------
+DATA/orcl/datafile/system.256.1070471889		     SYSTEM
+DATA/orcl/datafile/sysaux.257.1070471889		     ONLINE
+DATA/orcl/datafile/undotbs1.258.1070471891		     ONLINE
+DATA/orcl/datafile/users.259.1070471891		     ONLINE
+DATA/orcl/datafile/undotbs2.264.1070472143		     ONLINE
+DATA/orcl/datafile/ts001.dbf				     RECOVER
+DATA/orcl/datafile/ts001_bak.dbf			     ONLINE
7 rows selected.
```

把表空间 ts001 对应的数据文件重新设置为联机状态：

```java
--把表空间 ts001 对应的数据文件设置为联机状态
SQL> ALTER DATABASE DATAFILE '+DATA/orcl/datafile/ts001.dbf' ONLINE;
ALTER DATABASE DATAFILE '+DATA/orcl/datafile/ts001.dbf' ONLINE
*
ERROR at line 1:
ORA-01113: file 6 needs media recovery
ORA-01110: data file 6: '+DATA/orcl/datafile/ts001.dbf'
--恢复数据文件
SQL> alter database recover datafile '+DATA/orcl/datafile/ts001.dbf';
Database altered.
--重新把数据文件设置为脱机状态
SQL> ALTER DATABASE DATAFILE '+DATA/orcl/datafile/ts001.dbf' ONLINE;
Database altered.
--查看表空间的状态
SQL> select tablespace_name,status from dba_tablespaces;
TABLESPACE_NAME      STATUS
-------------------- ---------
SYSTEM		     ONLINE
SYSAUX		     ONLINE
UNDOTBS1	     ONLINE
TEMP		     ONLINE
USERS		     ONLINE
UNDOTBS2	     ONLINE
TS001		     ONLINE
7 rows selected.
--查看数据文件的状态
SQL> select name,status from v$datafile;
NAME							     STATUS
------------------------------------------------------------ -------
+DATA/orcl/datafile/system.256.1070471889		     SYSTEM
+DATA/orcl/datafile/sysaux.257.1070471889		     ONLINE
+DATA/orcl/datafile/undotbs1.258.1070471891		     ONLINE
+DATA/orcl/datafile/users.259.1070471891		     ONLINE
+DATA/orcl/datafile/undotbs2.264.1070472143		     ONLINE
+DATA/orcl/datafile/ts001.dbf				     ONLINE
+DATA/orcl/datafile/ts001_bak.dbf			     ONLINE
7 rows selected.
```

## 八、移动数据文件的位置

为了防止数据丢失、提高 I/O 性能，应尽可能将数据文件保存到不同的磁盘上。移动数据 文件有两种方法，一种方法是使用 ALTER TABLESPACE 命令，另一种方法是使用ALTER DATABASE 命令。

### 1、使用 ALTER TABLESPACE 命令移动数据文件

命令格式如下：

```java
ALTER TABESPACE tablespace_name RENAME DATAFILE 'file_name1' TO 'file_name2';
/*说明：
（1）该方法不能移动 SYSTEM 表空间中的数据文件。
（2）源文件名必须与存储在控制文件内的文件名称匹配。
（3）表空间必须脱机，并且 TO 子句后的目标数据文件必须存在。
使用该命令重命名数据文件的步骤如下：
第1步：使表空间脱机。
第2步：使用操作系统命令移动或复制文件。
第3步：执行ALTER TABLESPACE RENAME DATAFILE 命令。
第4步：使表空间联机。
*/
```

修改表空间 ts001 包含的数据文件的名称：

（1）使表空间 ts001 脱机。

```java
SQL> alter tablespace ts001 offline;
Tablespace altered.
```

（2）在操作系统下修改文件名

```java
ASMCMD> pwd
+data/orcl/datafile
ASMCMD> ls
SYSAUX.257.1070471889
SYSTEM.256.1070471889
TS001.271.1080381235
TS001.276.1080384759
UNDOTBS1.258.1070471891
UNDOTBS2.264.1070472143
USERS.259.1070471891
ts001.DBF
ts001_bak.dbf
ASMCMD> cp ts001.dbf ts1_001.dbf
copying +data/orcl/datafile/ts001.dbf -> +data/orcl/datafile/ts1_001.dbf
ASMCMD> rm ts001.dbf
ASMCMD> ls
SYSAUX.257.1070471889
SYSTEM.256.1070471889
TS001.276.1080384759
UNDOTBS1.258.1070471891
UNDOTBS2.264.1070472143
USERS.259.1070471891
ts001_bak.dbf
ts1_001.dbf
```

（3）执行 ALTER TABLESPACE RENAME DATAFILE 命令。

```java
SQL> ALTER TABLESPACE ts001
     RENAME DATAFILE '+data/orcl/datafile/ts001.dbf' to '+data/orcl/datafile/ts1_001.dbf';
Tablespace altered.
```

（4）使表空间联机

```java
SQL> ALTER TABLESPACE ts001 online;
Tablespace altered.
```

（5）查看表空间对应的数据文件

```java
SQL> select tablespace_name,file_name from dba_data_files;
TABLESPACE_NAME      FILE_NAME
-------------------- ------------------------------------------------------------
USERS		     +DATA/orcl/datafile/users.259.1070471891
UNDOTBS1	     +DATA/orcl/datafile/undotbs1.258.1070471891
SYSAUX		     +DATA/orcl/datafile/sysaux.257.1070471889
SYSTEM		     +DATA/orcl/datafile/system.256.1070471889
UNDOTBS2	     +DATA/orcl/datafile/undotbs2.264.1070472143
TS001		     +DATA/orcl/datafile/ts1_001.dbf
TS001		     +DATA/orcl/datafile/ts001_bak.dbf
7 rows selected.
```

### 2、使用 ALTER DATABASE 命令移动数据文件

命令格式如下：

```java
ALTER DATABASE RENAME DATAFILE 'file_name1' TO 'file_name2';
/*说明：该命令可用来移动任意类型的数据文件，数据库必须处于 mount 状态，且目标数据文件必须存在。
操作步骤如下：
（1）关闭数据库。
（2）使用操作系统命令移动文件。
（3）启动数据库到 mount 状态。
（4）执行 ALTER DATABASE RENAME FILE 命令。
（5）打开数据库。
*/
```

修改表空间 ts001 包含的数据文件的名称：

（1）关闭数据库（如果是 Oracle rac 集群环境，在所有节点执行关闭数据库操作）

```java
--节点1
SQL> shutdown immediate
Database closed.
Database dismounted.
ORACLE instance shut down.
--节点2
SQL> shutdown immediate
Database closed.
Database dismounted.
ORACLE instance shut down.
```

（2）使用操作系统命令移动文件。

```java
ASMCMD> pwd
+data/orcl/datafile
ASMCMD> ls
SYSAUX.257.1070471889
SYSTEM.256.1070471889
TS001.276.1080384759
UNDOTBS1.258.1070471891
UNDOTBS2.264.1070472143
USERS.259.1070471891
ts001_bak.dbf
ts1_001.dbf
ASMCMD> cp ts1_001.dbf ts001_file1.bak
copying +data/orcl/datafile/ts1_001.dbf -> +data/orcl/datafile/ts001_file1.bak
ASMCMD> cp ts001_bak.dbf ts001_file2.bak
copying +data/orcl/datafile/ts001_bak.dbf -> +data/orcl/datafile/ts001_file2.bak
ASMCMD> rm +data/orcl/datafile/ts001_bak.dbf
ASMCMD> rm +data/orcl/datafile/ts1_001.dbf
ASMCMD> ls
SYSAUX.257.1070471889
SYSTEM.256.1070471889
UNDOTBS1.258.1070471891
UNDOTBS2.264.1070472143
USERS.259.1070471891
ts001_file1.bak
ts001_file2.bak
```

（3）启动数据库到 mount 状态。

```java
SQL> startup mount
ORACLE instance started.
Total System Global Area  835104768 bytes
Fixed Size		    2257840 bytes
Variable Size		  570428496 bytes
Database Buffers	  260046848 bytes
Redo Buffers		    2371584 bytes
Database mounted.
```

（4）执行 ALTER DATABASE RENAME FILE 命令。

```java
SQL> ALTER DATABASE 
     RENAME FILE '+data/orcl/datafile/ts1_001.dbf' to '+data/orcl/datafile/ts001_file1.bak';
Database altered.
SQL> ALTER DATABASE 
     RENAME FILE '+data/orcl/datafile/ts001_bak.dbf' to '+data/orcl/datafile/ts001_file2.bak';
Database altered.
```

（5）打开数据库。

```java
--节点2
--下面的问题就是因为在节点2移动数据文件时节点1没有关闭数据库导致的
--表空间 ts001 对应的两个文件需要做 recover
SQL> alter database open;
alter database open
*
ERROR at line 1:
ORA-01113: file 6 needs media recovery
ORA-01110: data file 6: '+DATA/orcl/datafile/ts001_file1.bak'
SQL> alter database recover datafile 6;
Database altered.
SQL> alter database open;
alter database open
*
ERROR at line 1:
ORA-01113: file 7 needs media recovery
ORA-01110: data file 7: '+DATA/orcl/datafile/ts001_file2.bak'
SQL> alter database recover datafile 7;
Database altered.
SQL> alter database open;
Database altered.
--节点1
SQL> startup
ORACLE instance started.
Total System Global Area  835104768 bytes
Fixed Size		    2257840 bytes
Variable Size		  603982928 bytes
Database Buffers	  226492416 bytes
Redo Buffers		    2371584 bytes
Database mounted.
Database opened.
```

（6）查看表空间对应的数据文件

```java
SQL> select tablespace_name,file_name from dba_data_files;
TABLESPACE_NAME      FILE_NAME
-------------------- ------------------------------------------------------------
USERS		     +DATA/orcl/datafile/users.259.1070471891
UNDOTBS1	     +DATA/orcl/datafile/undotbs1.258.1070471891
SYSAUX		     +DATA/orcl/datafile/sysaux.257.1070471889
SYSTEM		     +DATA/orcl/datafile/system.256.1070471889
UNDOTBS2	     +DATA/orcl/datafile/undotbs2.264.1070472143
TS001		     +DATA/orcl/datafile/ts001_file1.bak
TS001		     +DATA/orcl/datafile/ts001_file2.bak
7 rows selected.
```

## 九、删除表空间

可以通过 DROP TABLESPACE 命令从数据库中删除表空间。删除表空间时需要注意以下问题：

（1）如果表空间包含数据段，必须使用 INCLUDING CONTENTS 选项。

（2）删除表空间后，数据将不再包含在数据库内。

（3）删除表空间时，只删除关联数据库控制文件内的文件指针。操作系统文件仍然存 在，可以使用 AND DATAFILES 子句同时删除操作系统文件。

（4）表空间切换到只读状态，仍可以删除该表空间以及其中的段。

（5）删除表空间之前，建议将表空间脱机，以确保没有事务处理访问该表空间内的任何段。

（6）SYSTEM 表空间不能被删除。

删除表空间的命令如下：

```java
DROP TABLESPACE tablespace_name [INCLUDING CONTENTS [AND DATAFILES] [CASCADE CONSTRAINTS]]
/* 说明：
（1）INCLUDING CONTENTS：删除表空间内的所有段。
（2）AND DATAFILES：删除关联的操作系统文件。
（3）CASCADE CONSTRAINTS：如果表空间之外的表引用了该表空间内表的主键和唯一键，则删除引用完整性约束。
  */
```

删除表空间 ts001 以及表空间对应的数据文件：

```java
SQL> DROP TABLESPACE ts001 INCLUDING CONTENTS AND DATAFILES;
Tablespace dropped.
```

查看表空间对应的数据文件：

```java
SQL> select tablespace_name,file_name from dba_data_files;
TABLESPACE_NAME      FILE_NAME
-------------------- ------------------------------------------------------------
USERS		     +DATA/orcl/datafile/users.259.1070471891
UNDOTBS1	     +DATA/orcl/datafile/undotbs1.258.1070471891
SYSAUX		     +DATA/orcl/datafile/sysaux.257.1070471889
SYSTEM		     +DATA/orcl/datafile/system.256.1070471889
UNDOTBS2	     +DATA/orcl/datafile/undotbs2.264.1070472143
```

查看操作系统文件

```java
ASMCMD> pwd
+data/orcl/datafile
ASMCMD> ls
SYSAUX.257.1070471889
SYSTEM.256.1070471889
UNDOTBS1.258.1070471891
UNDOTBS2.264.1070472143
USERS.259.1070471891
```

## 十、设置用户的默认表空间

在Oracle11g 以前，如果创建用户时未使用 DEFAULT TABLESPACE 子句指定默认表空间，则将 SYSTEM 表空间作为它们的默认表空间。

在Oracle 10g 中定义了数据库级别的默认表空间 USERS，在创建用户时如果没有定义默认表空间，就会把数据库级别的默认表空间当作用户的默认表空间。

### 1、查看数据库的默认表空间

```java
SQL> SELECT PROPERTY_VALUE
     FROM database_properties
     WHERE PROPERTY_NAME = 'DEFAULT_PERMANENT_TABLESPACE';
PROPERTY_VALUE
----------------------------------------------------------------------------------------
USERS
```

说明：
（1）如果在创建用户时没有指定用户表空间，则默认会使用数据库的默认表空间，如果我们修改了数据库的默认表空间，用户的表空间也会发生改变。

（2）如果在创建用户时指定用户的表空间是其他的表空间，修改数据库的默认表空间不会影响用户的表空间。

（3）数据库的默认表空间不能删除，除非将默认表空间指向其他表空间之后才可以删除。

（4）如果用户的默认表空间指向其他的表空间，当这个表空间被删除之后，用户的默认表空间会自动指向数据库的默认表空间。

### 2、修改数据库的默认表空间

```java
SQL> ALTER DATABASE DEFAULT TABLESPACE ts001;
Database altered.
SQL> SELECT PROPERTY_VALUE
     FROM database_properties
     WHERE PROPERTY_NAME = 'DEFAULT_PERMANENT_TABLESPACE';
PROPERTY_VALUE
----------------------------------------------------------------------------------------------
TS001
SQL> ALTER DATABASE DEFAULT TABLESPACE users;
Database altered.
SQL> SELECT PROPERTY_VALUE
     FROM database_properties
     WHERE PROPERTY_NAME = 'DEFAULT_PERMANENT_TABLESPACE';
PROPERTY_VALUE
-----------------------------------------------------------------------------------------
USERS
```

### 3、查看当前用户的默认表空间

```java
SQL> select default_tablespace from user_users;
DEFAULT_TABLESPACE
------------------------------
SYSTEM
SQL> conn scott/tiger;
Connected.
SQL> select default_tablespace from user_users;
DEFAULT_TABLESPACE
------------------------------
USERS
```

### 4、查看所有用户的默认表空间

```java
SQL> select user_id, username, default_tablespace from dba_users;
   USER_ID USERNAME			  DEFAULT_TABLESPACE
---------- ------------------------------ ------------------------------
	 0 SYS				  SYSTEM
	 5 SYSTEM			  SYSTEM
	83 SCOTT			  USERS
	87 HMJ				  USERS
	84 WGX				  USERS
	 9 OUTLN			  SYSTEM
	73 MGMT_VIEW			  SYSTEM
	74 FLOWS_FILES			  SYSAUX
	57 MDSYS			  SYSAUX
	53 ORDSYS			  SYSAUX
	42 EXFSYS			  SYSAUX
	30 DBSNMP			  SYSAUX
	32 WMSYS			  SYSAUX
	31 APPQOSSYS			  SYSAUX
	77 APEX_030200			  SYSAUX
	79 OWBSYS_AUDIT 		  SYSAUX
	54 ORDDATA			  SYSAUX
	43 CTXSYS			  SYSAUX
	46 ANONYMOUS			  SYSAUX
	71 SYSMAN			  SYSAUX
	45 XDB				  SYSAUX
	55 ORDPLUGINS			  SYSAUX
	78 OWBSYS			  SYSAUX
	56 SI_INFORMTN_SCHEMA		  SYSAUX
	60 OLAPSYS			  SYSAUX
	21 ORACLE_OCM			  USERS
2147483638 XS$NULL			  USERS
	64 MDDATA			  USERS
	14 DIP				  USERS
	75 APEX_PUBLIC_USER		  USERS
	69 SPATIAL_CSW_ADMIN_USR	  USERS
	66 SPATIAL_WFS_ADMIN_USR	  USERS
32 rows selected.
```

### 5、创建新用户，不指定默认表空间#

```java
SQL> create user john identified by john;
User created.
SQL> grant connect to john;
Grant succeeded.
```

### 6、创建新用户同时指定默认表空间

```java
SQL> create user tom identified by tom default tablespace ts001;
User created.
SQL> grant connect to tom;
Grant succeeded.
```

### 7、查看用户 john 和 tom 的默认表空间

```java
SQL> alter user john account unlock;
User altered.
SQL> alter user tom account unlock;
User altered.
SQL> conn john/john;
Connected.
SQL> select default_tablespace from user_users;
DEFAULT_TABLESPACE
------------------------------
USERS
SQL> conn tom/tom;
Connected.
SQL> select default_tablespace from user_users;
DEFAULT_TABLESPACE
------------------------------
TS001
```
