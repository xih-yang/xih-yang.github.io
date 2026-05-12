# 30、Oracle 教程 - Oracle 表空间有关的数据字典
- 来源：https://ddkk.com/zhuanlan/db/oracle/1/30.html
- 分类：缓存数据库
- 分组：教程目录
和表空间对应的数据字典主要有：DBA_TABLESPACES、USER_TABLESPACES、V T A B L E S P A C E 、 G V TABLESPACE、GV TABLESPACE、GVTABLESPACE 等。与表空间对应的数据文件相关的数据字典主要有：DBA_DATA_FILES、V D A T A F I L E 、 G V DATAFILE、GV DATAFILE、GVDATAFILE、DBA_TEMP_FILES、V T E M P F I L E 、 G V TEMPFILE、GV TEMPFILE、GVTEMPFILE 等。

## 一、查看表空间信息

### 1、DBA_TABLESPACES

查询系统的表空间信息，该数据字典的结构如下：

```java
SQL> desc DBA_TABLESPACES;
 Name										     Null?    Type
 ----------------------------------------------------------------------------------- ----
 TABLESPACE_NAME								     NOT NULL VARCHAR2(30)
 BLOCK_SIZE									         NOT NULL NUMBER
 INITIAL_EXTENT 									          NUMBER
 NEXT_EXTENT										          NUMBER
 MIN_EXTENTS									     NOT NULL NUMBER
 MAX_EXTENTS										          NUMBER
 MAX_SIZE									        	      NUMBER
 PCT_INCREASE										          NUMBER
 MIN_EXTLEN	    	    								      NUMBER
 STATUS 		    	    							      VARCHAR2(9)
 CONTENTS					        					      VARCHAR2(9)
 LOGGING							        			      VARCHAR2(9)
 FORCE_LOGGING								    		      VARCHAR2(3)
 EXTENT_MANAGEMENT								    	      VARCHAR2(10)
 ALLOCATION_TYPE									          VARCHAR2(9)
 PLUGGED_IN										              VARCHAR2(3)
 SEGMENT_SPACE_MANAGEMENT								      VARCHAR2(6)
 DEF_TAB_COMPRESSION									      VARCHAR2(8)
 RETENTION					        					      VARCHAR2(11)
 BIGFILE							        			      VARCHAR2(3)
 PREDICATE_EVALUATION									      VARCHAR2(7)
 ENCRYPTED									        	      VARCHAR2(3)
 COMPRESS_FOR										          VARCHAR2(12)
```

查询表空间信息：

```java
SQL> SELECT TABLESPACE_NAME, STATUS, CONTENTS, RETENTION FROM DBA_TABLESPACES;
TABLESPACE_NAME 	       STATUS	 CONTENTS  RETENTION
------------------------------ --------- --------- -----------
SYSTEM			       ONLINE	 PERMANENT NOT APPLY    --永久表空间
SYSAUX			       ONLINE	 PERMANENT NOT APPLY    --永久表空间
UNDOTBS1		       ONLINE	 UNDO	   NOGUARANTEE  -- undo 表空间
TEMP			       ONLINE	 TEMPORARY NOT APPLY    --临时表空间
USERS			       ONLINE	 PERMANENT NOT APPLY    --永久表空间
UNDOTBS2		       ONLINE	 UNDO	   NOGUARANTEE  -- undo 表空间
TS001			       ONLINE	 PERMANENT NOT APPLY    --临时表空间
TEMP02			       ONLINE	 TEMPORARY NOT APPLY    --临时表空间
TEMP03			       ONLINE	 TEMPORARY NOT APPLY    --临时表空间
UNDOTBS11		       ONLINE	 UNDO	   NOGUARANTEE  -- undo 表空间
UNDO_ARCHIVE		   ONLINE	 PERMANENT NOT APPLY    --永久表空间
TS003			       ONLINE	 PERMANENT NOT APPLY    --永久表空间
12 rows selected.
```

### 2、V$TABLESPACE

查询系统的表空间信息，但是能够查询的信息要比 DBA_TABLESPACES 少得多，该数据字典的结构如下：

```java
SQL> DESC V$TABLESPACE;
 Name										     Null?    Type
 -------------------------------------------------------------------------- -------- -------
 TS#											      NUMBER
 NAME											      VARCHAR2(30)
 INCLUDED_IN_DATABASE_BACKUP					        VARCHAR2(3)
 BIGFILE										      VARCHAR2(3)
 FLASHBACK_ON										  VARCHAR2(3)
 ENCRYPT_IN_BACKUP									   VARCHAR2(3)
```

查询表空间信息：

```java
SQL> SELECT TS#, NAME FROM V$TABLESPACE;
       TS# NAME
---------- ------------------------------
	 0 SYSTEM
	 1 SYSAUX
	 2 UNDOTBS1
	 4 USERS
	 3 TEMP
	 5 UNDOTBS2
	 6 TS001
	 8 TEMP02
	10 TEMP03
	12 UNDOTBS11
	13 UNDO_ARCHIVE
	14 TS003
12 rows selected.
```

### 3、USER_TABLESPACES

查询当前用户能够使用的表空间信息，该数据字典的结构如下：

```java
SQL> desc DBA_TABLESPACES;
 Name										     Null?    Type
 ----------------------------------------------------------------------------------
 TABLESPACE_NAME								     NOT NULL VARCHAR2(30)
 BLOCK_SIZE									         NOT NULL NUMBER
 INITIAL_EXTENT 									          NUMBER
 NEXT_EXTENT			    							      NUMBER
 MIN_EXTENTS									     NOT NULL NUMBER
 MAX_EXTENTS				    						      NUMBER
 MAX_SIZE						        				      NUMBER
 PCT_INCREASE							    			      NUMBER
 MIN_EXTLEN									        	      NUMBER
 STATUS 										              VARCHAR2(9)
 CONTENTS		        								      VARCHAR2(9)
 LOGGING				        						      VARCHAR2(9)
 FORCE_LOGGING					    					      VARCHAR2(3)
 EXTENT_MANAGEMENT					    				      VARCHAR2(10)
 ALLOCATION_TYPE						    			      VARCHAR2(9)
 PLUGGED_IN									        	      VARCHAR2(3)
 SEGMENT_SPACE_MANAGEMENT								      VARCHAR2(6)
 DEF_TAB_COMPRESSION									      VARCHAR2(8)
 RETENTION										              VARCHAR2(11)
 BIGFILE					        					      VARCHAR2(3)
 PREDICATE_EVALUATION									      VARCHAR2(7)
 ENCRYPTED							        			      VARCHAR2(3)
 COMPRESS_FOR			
```

查询当前用户能够使用的表空间信息：

```java
SQL> SHOW USER;
USER is "SCOTT"
SQL> SELECT TABLESPACE_NAME, STATUS, CONTENTS, RETENTION FROM USER_TABLESPACES;
TABLESPACE_NAME 	       STATUS	 CONTENTS  RETENTION
------------------------------ --------- --------- -----------
SYSTEM			       ONLINE	 PERMANENT NOT APPLY
SYSAUX			       ONLINE	 PERMANENT NOT APPLY
UNDOTBS1		       ONLINE	 UNDO	   NOGUARANTEE
TEMP			       ONLINE	 TEMPORARY NOT APPLY
USERS			       ONLINE	 PERMANENT NOT APPLY
UNDOTBS2		       ONLINE	 UNDO	   NOGUARANTEE
TS001			       ONLINE	 PERMANENT NOT APPLY
TEMP02			       ONLINE	 TEMPORARY NOT APPLY
TEMP03			       ONLINE	 TEMPORARY NOT APPLY
UNDOTBS11		       ONLINE	 UNDO	   NOGUARANTEE
UNDO_ARCHIVE		   ONLINE	 PERMANENT NOT APPLY
TS003			       ONLINE	 PERMANENT NOT APPLY
12 rows selected.
```

### 3、GV$TABLESPACE

与V$TABLESPACE 的内容相似，查询 Oracle rac 集群所有节点的表空间，该数据字典的结构如下：

```java
SQL> DESC GV$TABLESPACE
 Name										     Null?    Type
----------------------------------------------------------------------------------- -------
 INST_ID										      NUMBER
 TS#											      NUMBER
 NAME											      VARCHAR2(30)
 INCLUDED_IN_DATABASE_BACKUP					        VARCHAR2(3)
 BIGFILE										      VARCHAR2(3)
 FLASHBACK_ON										  VARCHAR2(3)
 ENCRYPT_IN_BACKUP									   VARCHAR2(3)
```

查询表空间信息：

```java
SQL> SELECT INST_ID, TS#, NAME FROM GV$TABLESPACE;
   INST_ID	  TS# NAME
---------- ---------- ------------------------------
	 2	    0 SYSTEM
	 2	    1 SYSAUX
	 2	    2 UNDOTBS1
	 2	    4 USERS
	 2	    3 TEMP
	 2	    5 UNDOTBS2
	 2	    6 TS001
	 2	    8 TEMP02
	 2	   10 TEMP03
	 2	   12 UNDOTBS11
	 2	   13 UNDO_ARCHIVE
	 2	   14 TS003
	 1	    0 SYSTEM
	 1	    1 SYSAUX
	 1	    2 UNDOTBS1
	 1	    4 USERS
	 1	    3 TEMP
	 1	    5 UNDOTBS2
	 1	    6 TS001
	 1	    8 TEMP02
	 1	   10 TEMP03
	 1	   12 UNDOTBS11
	 1	   13 UNDO_ARCHIVE
	 1	   14 TS003
24 rows selected.
```

## 二、查询永久表空间和 undo 表空间对应的数据文件

### 1、DBA_DATA_FILES

查询永久表空间和 undo 表空间对应的数据文件信息，该数据字典的结构如下：

```java
SQL> desc DBA_DATA_FILES;
 Name										     Null?    Type
---------------------------- -------- ---------------------------------------------------
 FILE_NAME										      VARCHAR2(513)
 FILE_ID										      NUMBER
 TABLESPACE_NAME	 							      VARCHAR2(30)
 BYTES											      NUMBER
 BLOCKS 										      NUMBER
 STATUS 										      VARCHAR2(9)
 RELATIVE_FNO									      NUMBER
 AUTOEXTENSIBLE 								      VARCHAR2(3)
 MAXBYTES										      NUMBER
 MAXBLOCKS										      NUMBER
 INCREMENT_BY									      NUMBER
 USER_BYTES										      NUMBER
 USER_BLOCKS									      NUMBER
 ONLINE_STATUS									      VARCHAR2(7)
```

查询永久表空间和 undo 表空间对应的数据文件信息：

```java
SQL> SELECT FILE_ID, FILE_NAME, TABLESPACE_NAME, BYTES/1024/1024 SIZE_MB
     FROM DBA_DATA_FILES;
   FILE_ID FILE_NAME							TABLESPACE_NAME 		  SIZE_MB
---------- ------------------------------------------------------------ ----------------------
	 4 +DATA/orcl/datafile/users.259.1070471891			USERS				       10
	 3 +DATA/orcl/datafile/undotbs1.258.1070471891		UNDOTBS1			       75
	 2 +DATA/orcl/datafile/sysaux.257.1070471889		SYSAUX				      960
	 1 +DATA/orcl/datafile/system.256.1070471889		SYSTEM				      750
	 5 +DATA/orcl/datafile/undotbs2.264.1070472143		UNDOTBS2			       75
	 6 +DATA/orcl/datafile/ts001.dbf				   TS001				      100
	 7 +DATA/orcl/datafile/undotbs11				   UNDOTBS11			       50
	 8 +DATA/orcl/datafile/undo_archive.dbf 			UNDO_ARCHIVE		       50
	 9 +DATA/orcl/datafile/ts003.dbf				   TS003				       50
9 rows selected.
```

### 2、V$DATAFILE

查询永久表空间和 undo 表空间对应的数据文件信息，该数据字典的结构如下：

```java
SQL> desc V$DATAFILE;
 Name										     Null?    Type
--------------- -------- ---------------------------------------------------
 FILE#											      NUMBER
 CREATION_CHANGE#								      NUMBER
 CREATION_TIME									      DATE
 TS#											      NUMBER
 RFILE# 										      NUMBER
 STATUS 										      VARCHAR2(7)
 ENABLED										      VARCHAR2(10)
 CHECKPOINT_CHANGE#								      NUMBER
 CHECKPOINT_TIME								      DATE
 UNRECOVERABLE_CHANGE#							      NUMBER
 UNRECOVERABLE_TIME								      DATE
 LAST_CHANGE#									      NUMBER
 LAST_TIME										      DATE
 OFFLINE_CHANGE#								      NUMBER
 ONLINE_CHANGE# 								      NUMBER
 ONLINE_TIME									      DATE
 BYTES											      NUMBER
 BLOCKS 										      NUMBER
 CREATE_BYTES									      NUMBER
 BLOCK_SIZE										      NUMBER
 NAME											      VARCHAR2(513)
 PLUGGED_IN										      NUMBER
 BLOCK1_OFFSET									      NUMBER
 AUX_NAME										      VARCHAR2(513)
 FIRST_NONLOGGED_SCN							      NUMBER
 FIRST_NONLOGGED_TIME							      DATE
 FOREIGN_DBID									      NUMBER
 FOREIGN_CREATION_CHANGE#						      NUMBER
 FOREIGN_CREATION_TIME							      DATE
 PLUGGED_READONLY								      VARCHAR2(3)
 PLUGIN_CHANGE# 								      NUMBER
 PLUGIN_RESETLOGS_CHANGE#						      NUMBER
 PLUGIN_RESETLOGS_TIME							      DATE
```

查询永久表空间和 undo 表空间对应的数据文件信息：

```java
SQL> SELECT FILE#, TS#, NAME, BYTES/1024/1024 SIZE_MB FROM V$DATAFILE;
     FILE#	  TS# NAME							      SIZE_MB
---------- ---------- ------------------------------------------------------------ ----------
	 1	    0 +DATA/orcl/datafile/system.256.1070471889 	  750
	 2	    1 +DATA/orcl/datafile/sysaux.257.1070471889 	  960
	 3	    2 +DATA/orcl/datafile/undotbs1.258.1070471891	   75
	 4	    4 +DATA/orcl/datafile/users.259.1070471891		   10
	 5	    5 +DATA/orcl/datafile/undotbs2.264.1070472143	   75
	 6	    6 +DATA/orcl/datafile/ts001.dbf					  100
	 7	   12 +DATA/orcl/datafile/undotbs11					   50
	 8	   13 +DATA/orcl/datafile/undo_archive.dbf			   50
	 9	   14 +DATA/orcl/datafile/ts003.dbf					   50
9 rows selected.
```

### 3、GV$DATAFILE

查询永久表空间和 undo 表空间对应的数据文件信息，用于查询 Oracle rac 集群中所有节点对应的数据文件信息，该数据字典的结构如下：

```java
SQL> desc GV$DATAFILE;
 Name										     Null?    Type
 ----------------------------------------------------------------------------------- -
 INST_ID										      NUMBER
 FILE#											      NUMBER
 CREATION_CHANGE#								      NUMBER
 CREATION_TIME									      DATE
 TS#											      NUMBER
 RFILE# 										      NUMBER
 STATUS 										      VARCHAR2(7)
 ENABLED										      VARCHAR2(10)
 CHECKPOINT_CHANGE#								      NUMBER
 CHECKPOINT_TIME								      DATE
 UNRECOVERABLE_CHANGE#							      NUMBER
 UNRECOVERABLE_TIME								      DATE
 LAST_CHANGE#									      NUMBER
 LAST_TIME										      DATE
 OFFLINE_CHANGE#								      NUMBER
 ONLINE_CHANGE# 								      NUMBER
 ONLINE_TIME									      DATE
 BYTES											      NUMBER
 BLOCKS 										      NUMBER
 CREATE_BYTES									      NUMBER
 BLOCK_SIZE										      NUMBER
 NAME											      VARCHAR2(513)
 PLUGGED_IN										      NUMBER
 BLOCK1_OFFSET									      NUMBER
 AUX_NAME										      VARCHAR2(513)
 FIRST_NONLOGGED_SCN							      NUMBER
 FIRST_NONLOGGED_TIME							      DATE
 FOREIGN_DBID									      NUMBER
 FOREIGN_CREATION_CHANGE#						      NUMBER
 FOREIGN_CREATION_TIME							      DATE
 PLUGGED_READONLY								      VARCHAR2(3)
 PLUGIN_CHANGE# 								      NUMBER
 PLUGIN_RESETLOGS_CHANGE#						      NUMBER
 PLUGIN_RESETLOGS_TIME							      DATE
```

查询永久表空间和 undo 表空间对应的数据文件信息：

```java
SQL> SELECT INST_ID, FILE#, TS#, NAME, BYTES/1024/1024 SIZE_MB FROM GV$DATAFILE;
   INST_ID	FILE#	     TS# NAME								 SIZE_MB
---------- ---------- ---------- --------------------------------------------------------------
	 1	    1	       0 +DATA/orcl/datafile/system.256.1070471889		     750
	 1	    2	       1 +DATA/orcl/datafile/sysaux.257.1070471889		     960
	 1	    3	       2 +DATA/orcl/datafile/undotbs1.258.1070471891	      75
	 1	    4	       4 +DATA/orcl/datafile/users.259.1070471891		      10
	 1	    5	       5 +DATA/orcl/datafile/undotbs2.264.1070472143	      75
	 1	    6	       6 +DATA/orcl/datafile/ts001.dbf					     100
	 1	    7	      12 +DATA/orcl/datafile/undotbs11					      50
	 1	    8	      13 +DATA/orcl/datafile/undo_archive.dbf			      50
	 1	    9	      14 +DATA/orcl/datafile/ts003.dbf					      50
	 2	    1	       0 +DATA/orcl/datafile/system.256.1070471889		      750
	 2	    2	       1 +DATA/orcl/datafile/sysaux.257.1070471889			  960
	 2	    3	       2 +DATA/orcl/datafile/undotbs1.258.1070471891	      75
	 2	    4	       4 +DATA/orcl/datafile/users.259.1070471891			  10
	 2	    5	       5 +DATA/orcl/datafile/undotbs2.264.1070472143		   75
	 2	    6	       6 +DATA/orcl/datafile/ts001.dbf					     100
	 2	    7	      12 +DATA/orcl/datafile/undotbs11					      50
	 2	    8	      13 +DATA/orcl/datafile/undo_archive.dbf				  50
	 2	    9	      14 +DATA/orcl/datafile/ts003.dbf					      50
18 rows selected.
```

## 三、查询临时表空间对应的数据文件信息

### 1、DBA_TEMP_FILES

查询临时表空间对应的数据文件信息，该数据字典的结构如下：

```java
SQL> DESC DBA_TEMP_FILES;
 Name										     Null?    Type
--------------------------------------------------------------------------------
 FILE_NAME										      VARCHAR2(513)
 FILE_ID										      NUMBER
 TABLESPACE_NAME						     NOT NULL  VARCHAR2(30)
 BYTES											      NUMBER
 BLOCKS 										      NUMBER
 STATUS 										      VARCHAR2(7)
 RELATIVE_FNO									      NUMBER
 AUTOEXTENSIBLE 								      VARCHAR2(3)
 MAXBYTES										      NUMBER
 MAXBLOCKS										      NUMBER
 INCREMENT_BY									      NUMBER
 USER_BYTES										      NUMBER
 USER_BLOCKS									      NUMBER
```

查询临时表空间对应的数据文件信息：

```java
SQL> SELECT FILE_ID, FILE_NAME, TABLESPACE_NAME, BYTES/1024/1024 SIZE_MB FROM DBA_TEMP_FILES;
   FILE_ID FILE_NAME							TABLESPACE_NAME 		  SIZE_MB
---------- ------------------------------------------------------------ ------------------
	 1 +DATA/orcl/tempfile/temp.263.1070472029		 TEMP				       56
	 2 +DATA/orcl/tempfile/temp02.dbf				TEMP02				       50
	 3 +DATA/orcl/tempfile/temp03.dbf				TEMP03				       10
```

### 2、V$TEMPFILE

查询临时表空间对应的数据文件信息，该数据字典的结构如下：

```java
SQL> desc V$TEMPFILE;
 Name										     Null?    Type
---------------------------------------------------------------------------
 FILE#											      NUMBER
 CREATION_CHANGE#								      NUMBER
 CREATION_TIME									      DATE
 TS#											      NUMBER
 RFILE# 										      NUMBER
 STATUS 										      VARCHAR2(7)
 ENABLED										      VARCHAR2(10)
 BYTES											      NUMBER
 BLOCKS 										      NUMBER
 CREATE_BYTES									      NUMBER
 BLOCK_SIZE										      NUMBER
 NAME											      VARCHAR2(513)
```

查询临时表空间对应的数据文件信息：

```java
SQL> SELECT FILE#, NAME, TS#, BYTES/1024/1024 SIZE_MB FROM V$TEMPFILE;
     FILE# NAME 							       TS#    SIZE_MB
---------- ------------------------------------------------------------ ---------- ----------
	 1 +DATA/orcl/tempfile/temp.263.1070472029			  3	    56
	 2 +DATA/orcl/tempfile/temp02.dbf					 8	   50
	 3 +DATA/orcl/tempfile/temp03.dbf					10	   10
```

### 3、V$TEMPFILE

查询临时表空间对应的数据文件信息，用于查询 Oracle rac 集群中所有节点对应的数据文件信息，该数据字典的结构如下：

```java
SQL> desc GV$TEMPFILE;
 Name										     Null?    Type
----------------------------------------------------------------------------------- -----
 INST_ID										      NUMBER
 FILE#											      NUMBER
 CREATION_CHANGE#								      NUMBER
 CREATION_TIME									      DATE
 TS#											      NUMBER
 RFILE# 										      NUMBER
 STATUS 										      VARCHAR2(7)
 ENABLED										      VARCHAR2(10)
 BYTES											      NUMBER
 BLOCKS 										      NUMBER
 CREATE_BYTES									      NUMBER
 BLOCK_SIZE										      NUMBER
 NAME											      VARCHAR2(513)
```

查询临时表空间对应的数据文件信息：

```java
SQL> SELECT INST_ID, FILE#, NAME, TS#, BYTES/1024/1024 SIZE_MB FROM GV$TEMPFILE;
   INST_ID	FILE# NAME								  TS#	 SIZE_MB
---------- ---------- ------------------------------------------------------------ --------
	 2	    1 +DATA/orcl/tempfile/temp.263.1070472029			    3	      56
	 2	    2 +DATA/orcl/tempfile/temp02.dbf					    8	      50
	 2	    3 +DATA/orcl/tempfile/temp03.dbf					   10	      10
	 1	    1 +DATA/orcl/tempfile/temp.263.1070472029			    3	      56
	 1	    2 +DATA/orcl/tempfile/temp02.dbf					    8	      50
	 1	    3 +DATA/orcl/tempfile/temp03.dbf					   10	      10
6 rows selected.
```
