# 33、Oracle 教程 - Oracle 使用数据字典查看 Oracle 的逻辑结构
- 来源：https://ddkk.com/zhuanlan/db/oracle/1/33.html
- 分类：缓存数据库
- 分组：教程目录
Oracle 的逻辑结构包括：表空间（Tablespace）、段（Segment）、区（Extent）、数据块（Block）。

## 一、查看表空间信息

### 1、DBA_TABLESPACES

```java
--SEGMENT_SPACE_MANAGEMENT：段空间管理方式（手工 MANUAL，自动 AUTO）
--EXTENT_MANAGEMENT：表空间管理方式（LOCAL本地管理表空间，DICT 字典管理表空间）
--CONTENTS：表空间类型（PERMANENT 永久表空间，TEMPORARY 临时表空间，UNDO undo表空间）
SQL> SELECT TABLESPACE_NAME,CONTENTS,SEGMENT_SPACE_MANAGEMENT,EXTENT_MANAGEMENT,RETENTION 
FROM DBA_TABLESPACES;
TABLESPACE_NAME 	       CONTENTS  SEGMEN EXTENT_MAN RETENTION
------------------------------ --------- ------ ---------- -----------
SYSTEM			       PERMANENT     MANUAL    LOCAL	   NOT APPLY
SYSAUX			       PERMANENT     AUTO	   LOCAL	   NOT APPLY
UNDOTBS1		       UNDO	         MANUAL    LOCAL	   NOGUARANTEE
TEMP			       TEMPORARY     MANUAL    LOCAL	   NOT APPLY
USERS			       PERMANENT     AUTO	   LOCAL	   NOT APPLY
UNDOTBS2		       UNDO	         MANUAL    LOCAL	   NOGUARANTEE
TS001			       PERMANENT     AUTO	   LOCAL	   NOT APPLY
TEMP02			       TEMPORARY     MANUAL    LOCAL	   NOT APPLY
TEMP03			       TEMPORARY     MANUAL    LOCAL	   NOT APPLY
UNDOTBS11		       UNDO	         MANUAL    LOCAL	   NOGUARANTEE
UNDO_ARCHIVE	       PERMANENT     AUTO	   LOCAL	   NOT APPLY
TS003			       PERMANENT     AUTO	   LOCAL	   NOT APPLY
12 rows selected.
```

### 2、USER_TABLESPACES

```java
SQL> show user
USER is "SCOTT"
--当前用户可以访问的表空间
SQL> SELECT TABLESPACE_NAME,CONTENTS,EXTENT_MANAGEMENT,SEGMENT_SPACE_MANAGEMENT 
FROM USER_TABLESPACES;
TABLESPACE_NAME 	       CONTENTS  EXTENT_MAN SEGMEN
------------------------------ --------- ---------- ------
SYSTEM			       PERMANENT     LOCAL	    MANUAL
SYSAUX			       PERMANENT     LOCAL	    AUTO
UNDOTBS1		       UNDO	         LOCAL	    MANUAL
TEMP			       TEMPORARY     LOCAL	    MANUAL
USERS			       PERMANENT     LOCAL	    AUTO
UNDOTBS2		       UNDO	         LOCAL	    MANUAL
TS001			       PERMANENT     LOCAL	    AUTO
TEMP02			       TEMPORARY     LOCAL	    MANUAL
TEMP03			       TEMPORARY     LOCAL	    MANUAL
UNDOTBS11		       UNDO	         LOCAL	    MANUAL
UNDO_ARCHIVE		   PERMANENT     LOCAL	    AUTO
TS003			       PERMANENT     LOCAL	    AUTO
12 rows selected.
```

### 3、V$TABLESPACE

```java
SQL> SELECT * FROM V$TABLESPACE;
       TS# NAME 							INC BIG FLA ENC
---------- ------------------------------------------------------------ --- --- --- ---
	 0 SYSTEM							YES NO	YES
	 1 SYSAUX							YES NO	YES
	 2 UNDOTBS1							YES NO	YES
	 4 USERS							YES NO	YES
	 3 TEMP 							NO  NO	YES
	 5 UNDOTBS2							YES NO	YES
	 6 TS001							YES NO	YES
	 8 TEMP02							NO  NO	YES
	10 TEMP03							NO  NO	YES
	12 UNDOTBS11						YES NO	YES
	13 UNDO_ARCHIVE 					YES NO	YES
	14 TS003							YES NO	YES
12 rows selected.
```

### 4、DBA_DATA_FILES：查询表空间对应的数据文件

```java
SQL> SELECT FILE_ID, FILE_NAME,TABLESPACE_NAME FROM DBA_DATA_FILES;
   FILE_ID FILE_NAME							TABLESPACE_NAME
---------- ------------------------------------------------------------ ------------------------------
	 4 +DATA/orcl/datafile/users.259.1070471891			USERS
	 3 +DATA/orcl/datafile/undotbs1.258.1070471891		UNDOTBS1
	 2 +DATA/orcl/datafile/sysaux.257.1070471889		SYSAUX
	 1 +DATA/orcl/datafile/system.256.1070471889		SYSTEM
	 5 +DATA/orcl/datafile/undotbs2.264.1070472143		UNDOTBS2
	 6 +DATA/orcl/datafile/ts001.dbf				   TS001
	 7 +DATA/orcl/datafile/undotbs11				   UNDOTBS11
	 8 +DATA/orcl/datafile/undo_archive.dbf 			UNDO_ARCHIVE
	 9 +DATA/orcl/datafile/ts003.dbf				   TS003
9 rows selected.
```

## 二、查看段（SEGMENT）信息

### 1、USER_SEGMENTS：查询当前用户所拥有的段

### （1）数据字典的结构

```java
SQL> DESC USER_SEGMENTS;
 Name										     Null?    Type
 --------------------------------------------------------------------------------
 SEGMENT_NAME									      VARCHAR2(81)
 PARTITION_NAME 								      VARCHAR2(30)
 SEGMENT_TYPE									      VARCHAR2(18)
 SEGMENT_SUBTYPE								      VARCHAR2(10)
 TABLESPACE_NAME								      VARCHAR2(30)
 BYTES											      NUMBER
 BLOCKS 										      NUMBER
 EXTENTS										      NUMBER
 INITIAL_EXTENT 								      NUMBER
 NEXT_EXTENT									      NUMBER
 MIN_EXTENTS									      NUMBER
 MAX_EXTENTS									      NUMBER
 MAX_SIZE										      NUMBER
 RETENTION										      VARCHAR2(7)
 MINRETENTION									      NUMBER
 PCT_INCREASE									      NUMBER
 FREELISTS										      NUMBER
 FREELIST_GROUPS								      NUMBER
 BUFFER_POOL									      VARCHAR2(7)
 FLASH_CACHE									      VARCHAR2(7)
 CELL_FLASH_CACHE								      VARCHAR2(7)
```

### （2）查询当前用户所拥有的段信息

```java
SQL> SHOW USER
USER is "SCOTT"
SQL> SELECT SEGMENT_NAME,SEGMENT_TYPE,TABLESPACE_NAME,RETENTION FROM USER_SEGMENTS;
SEGMENT_NAME		       SEGMENT_TYPE	  TABLESPACE_NAME		 RETENTI
------------------------------ ------------------ ------------------------------ -------
DEPT			       TABLE		  USERS
EMP			           TABLE		  USERS
SALGRADE		       TABLE		  USERS
EMP_BAK 		       TABLE		  USERS
TS_001			       TABLE		  USERS
E01			           TABLE		  USERS
TX001			       TABLE		  SYSTEM
TX002			       TABLE		  TS001
EMP010			       TABLE		  USERS
EMP888			       TABLE		  TS003
EMP666			       TABLE		  TS001
PK_DEPT 		       INDEX		  USERS
PK_EMP			       INDEX		  USERS
13 rows selected.
```

### 2、DBA_SEGMENTS：查询 Oracle 所有的段信息

### （1）数据字典的结构

```java
SQL> DESC DBA_SEGMENTS;
 Name										     Null?    Type
 ----------------------------------------------------------------------------------
 OWNER											      VARCHAR2(30)
 SEGMENT_NAME									      VARCHAR2(81)
 PARTITION_NAME 								      VARCHAR2(30)
 SEGMENT_TYPE									      VARCHAR2(18)
 SEGMENT_SUBTYPE								      VARCHAR2(10)
 TABLESPACE_NAME								      VARCHAR2(30)
 HEADER_FILE									      NUMBER
 HEADER_BLOCK									      NUMBER
 BYTES											      NUMBER
 BLOCKS 										      NUMBER
 EXTENTS										      NUMBER
 INITIAL_EXTENT 								      NUMBER
 NEXT_EXTENT									      NUMBER
 MIN_EXTENTS									      NUMBER
 MAX_EXTENTS									      NUMBER
 MAX_SIZE										      NUMBER
 RETENTION										      VARCHAR2(7)
 MINRETENTION									      NUMBER
 PCT_INCREASE									      NUMBER
 FREELISTS										      NUMBER
 FREELIST_GROUPS								      NUMBER
 RELATIVE_FNO									      NUMBER
 BUFFER_POOL									      VARCHAR2(7)
 FLASH_CACHE									      VARCHAR2(7)
 CELL_FLASH_CACHE								      VARCHAR2(7)
```

### （2）查看 SCOTT 用户所拥有的短信息

```java
SQL> SELECT OWNER,SEGMENT_NAME,SEGMENT_TYPE,RETENTION FROM DBA_SEGMENTS WHERE OWNER='SCOTT';
OWNER	   SEGMENT_NAME 	SEGMENT_TYPE	   RETENTI
---------- -------------------- ------------------ -------
SCOTT	   TX001		TABLE
SCOTT	   PK_EMP		INDEX
SCOTT	   PK_DEPT		INDEX
SCOTT	   EMP010		TABLE
SCOTT	   E01			TABLE
SCOTT	   TS_001		TABLE
SCOTT	   EMP_BAK		TABLE
SCOTT	   SALGRADE		TABLE
SCOTT	   EMP			TABLE
SCOTT	   DEPT 		TABLE
SCOTT	   EMP666		TABLE
SCOTT	   TX002		TABLE
SCOTT	   EMP888		TABLE
13 rows selected.
```

### 3、DBA_ROLLBACK_SEGS

使用DBA_ROLLBACK_SEGS 可以查询回退段（ROLLBACK SEGMENT）信息：

### （1）数据字典的结构

```java
SQL> DESC DBA_ROLLBACK_SEGS;
 Name										     Null?    Type
 -----------------------------------------------------------------------------------
 SEGMENT_NAME							     NOT NULL VARCHAR2(30)
 OWNER											    VARCHAR2(6)
 TABLESPACE_NAME						     NOT NULL VARCHAR2(30)
 SEGMENT_ID								     NOT NULL NUMBER
 FILE_ID								     NOT NULL NUMBER
 BLOCK_ID								     NOT NULL NUMBER
 INITIAL_EXTENT 								      NUMBER
 NEXT_EXTENT									      NUMBER
 MIN_EXTENTS							     NOT NULL NUMBER
 MAX_EXTENTS							     NOT NULL NUMBER
 PCT_INCREASE									      NUMBER
 STATUS 									          VARCHAR2(16)
 INSTANCE_NUM									      VARCHAR2(40)
 RELATIVE_FNO							     NOT NULL NUMBER
```

### （2）查询回退段（ROLLBACK SEGMENT）信息

```java
SQL> SELECT OWNER,SEGMENT_NAME,TABLESPACE_NAME,STATUS FROM DBA_ROLLBACK_SEGS;
OWNER	   SEGMENT_NAME 		  TABLESPACE_NAME		 STATUS
---------- ------------------------------ ------------------------------ ----------------
SYS	       SYSTEM		        	  SYSTEM			 ONLINE
SYS	       UNDO_SEGS005 	    	  UNDOTBS1			 OFFLINE
SYS	       UNDO_SEGS004 	      	  UNDOTBS1			 OFFLINE
SYS	       UNDO_SEGS003 		      UNDOTBS1			 OFFLINE
SYS	       UNDO_SEGS002 		      UNDOTBS1			 OFFLINE
SYS	       UNDO_SEGS001 	    	  UNDOTBS1			 OFFLINE
PUBLIC	   _SYSSMU10_1197734989$	  UNDOTBS1			 ONLINE
PUBLIC	   _SYSSMU9_1650507775$ 	  UNDOTBS1			 ONLINE
PUBLIC	   _SYSSMU8_517538920$		  UNDOTBS1			 ONLINE
PUBLIC	   _SYSSMU7_2070203016$ 	  UNDOTBS1			 ONLINE
PUBLIC	   _SYSSMU6_1263032392$ 	  UNDOTBS1			 ONLINE
PUBLIC	   _SYSSMU5_898567397$		  UNDOTBS1			 ONLINE
PUBLIC	   _SYSSMU4_1254879796$ 	  UNDOTBS1			 ONLINE
PUBLIC	   _SYSSMU3_1723003836$ 	  UNDOTBS1			 ONLINE
PUBLIC	   _SYSSMU2_2996391332$ 	  UNDOTBS1			 ONLINE
PUBLIC	   _SYSSMU1_3724004606$ 	  UNDOTBS1			 ONLINE
PUBLIC	   _SYSSMU20_3889389392$	  UNDOTBS2			 ONLINE
PUBLIC	   _SYSSMU19_1451449480$	  UNDOTBS2			 ONLINE
PUBLIC	   _SYSSMU18_3926145788$	  UNDOTBS2			 ONLINE
PUBLIC	   _SYSSMU17_448925445$ 	  UNDOTBS2			 ONLINE
PUBLIC	   _SYSSMU16_436613144$ 	  UNDOTBS2			 ONLINE
PUBLIC	   _SYSSMU15_1019824898$	  UNDOTBS2			 ONLINE
PUBLIC	   _SYSSMU14_2425809615$	  UNDOTBS2			 ONLINE
PUBLIC	   _SYSSMU13_436118795$ 	  UNDOTBS2			 ONLINE
PUBLIC	   _SYSSMU12_1517809045$	  UNDOTBS2			 ONLINE
PUBLIC	   _SYSSMU11_2522431595$	  UNDOTBS2			 ONLINE
PUBLIC	   _SYSSMU30_2064898567$	  UNDOTBS11			 OFFLINE
PUBLIC	   _SYSSMU29_4263141085$	  UNDOTBS11			 OFFLINE
PUBLIC	   _SYSSMU28_3305267124$	  UNDOTBS11			 OFFLINE
PUBLIC	   _SYSSMU27_81081477$		  UNDOTBS11			 OFFLINE
PUBLIC	   _SYSSMU26_2544040228$	  UNDOTBS11			 OFFLINE
PUBLIC	   _SYSSMU25_3424601340$	  UNDOTBS11			 OFFLINE
PUBLIC	   _SYSSMU24_2904816458$	  UNDOTBS11			 OFFLINE
PUBLIC	   _SYSSMU23_4195287356$	  UNDOTBS11			 OFFLINE
PUBLIC	   _SYSSMU22_3290518977$	  UNDOTBS11			 OFFLINE
PUBLIC	   _SYSSMU21_894061986$ 	  UNDOTBS11			 OFFLINE
36 rows selected.
```

## 三、查看区（Extent）信息

### 1、USER_EXTENTS：查看当前用户所拥有的区

### （1）数据字典的结构

```java
SQL> DESC USER_EXTENTS;
 Name										     Null?    Type
----------------------------------------------------------------------------------
 SEGMENT_NAME									      VARCHAR2(81)
 PARTITION_NAME 								      VARCHAR2(30)
 SEGMENT_TYPE									      VARCHAR2(18)
 TABLESPACE_NAME								      VARCHAR2(30)
 EXTENT_ID										      NUMBER
 BYTES											      NUMBER
 BLOCKS 										      NUMBER
```

### （2）查看当前用户所拥有的区

```java
SQL> SHOW USER
USER is "SCOTT"
SQL> SELECT EXTENT_ID,SEGMENT_NAME,SEGMENT_TYPE,TABLESPACE_NAME FROM USER_EXTENTS;
 EXTENT_ID SEGMENT_NAME     SEGMENT_TYPE     TABLESPACE_NAME
---------- ------------------------------ ------------------ ------------------------------
	 0 DEPT 			  TABLE 	     USERS
	 0 EMP				  TABLE 	     USERS
	 0 SALGRADE			  TABLE 	     USERS
	 0 EMP_BAK			  TABLE 	     USERS
	 0 TS_001			  TABLE 	     USERS
	 0 E01				  TABLE 	     USERS
	 0 TX001			  TABLE 	     SYSTEM
	 0 TX002			  TABLE 	     TS001
	 0 EMP010			  TABLE 	     USERS
	 1 EMP010			  TABLE 	     USERS
	 2 EMP010			  TABLE 	     USERS
	 3 EMP010			  TABLE 	     USERS
	 0 EMP888			  TABLE 	     TS003
	 0 EMP666			  TABLE 	     TS001
	 1 EMP666			  TABLE 	     TS001
	 2 EMP666			  TABLE 	     TS001
	 0 PK_DEPT			  INDEX 	     USERS
	 0 PK_EMP			  INDEX 	     USERS
18 rows selected.
```

### （3）查询段 EMP010 对应的区、数据库信息

```java
SQL> SELECT SEGMENT_NAME,SEGMENT_TYPE,EXTENT_ID,BLOCKS 
     FROM USER_EXTENTS WHERE SEGMENT_NAME='EMP010';
SEGMENT_NAME	       SEGMENT_TYPE	   EXTENT_ID	 BLOCKS
------------------------------ ------------------ ---------- ----------
EMP010			       TABLE			   0	      8
EMP010			       TABLE			   1	      8
EMP010			       TABLE			   2	      8
EMP010			       TABLE			   3	      8
```

### 2、DBA_EXTENTS：查询 Oracle 中的区信息

### （1）数据字典的结构

```java
SQL> DESC DBA_EXTENTS;
 Name										     Null?    Type
---------------------------------------------------------------------------------
 OWNER											      VARCHAR2(30)
 SEGMENT_NAME									      VARCHAR2(81)
 PARTITION_NAME 								      VARCHAR2(30)
 SEGMENT_TYPE									      VARCHAR2(18)
 TABLESPACE_NAME								      VARCHAR2(30)
 EXTENT_ID										      NUMBER
 FILE_ID										      NUMBER
 BLOCK_ID										      NUMBER
 BYTES											      NUMBER
 BLOCKS 										      NUMBER
 RELATIVE_FNO									      NUMBER
```

### （2）查询 SCOTT 用户所拥有的区信息

```java
SQL> SELECT OWNER,EXTENT_ID,SEGMENT_NAME,SEGMENT_TYPE,TABLESPACE_NAME FROM DBA_EXTENTS WHERE OWNER='SCOTT';
OWNER	    EXTENT_ID SEGMENT_NAME		     SEGMENT_TYPE	TABLESPACE_NAME
---------- ---------- ------------------------------ ------------------ ------------------------------
SCOTT		    0 TX001			     TABLE		SYSTEM
SCOTT		    0 PK_EMP		     INDEX		USERS
SCOTT		    0 PK_DEPT		     INDEX		USERS
SCOTT		    0 EMP010		     TABLE		USERS
SCOTT		    1 EMP010		     TABLE		USERS
SCOTT		    2 EMP010		     TABLE		USERS
SCOTT		    3 EMP010		     TABLE		USERS
SCOTT		    0 E01			     TABLE		USERS
SCOTT		    0 TS_001		     TABLE		USERS
SCOTT		    0 EMP_BAK		     TABLE		USERS
SCOTT		    0 SALGRADE		     TABLE		USERS
SCOTT		    0 EMP			     TABLE		USERS
SCOTT		    0 DEPT			     TABLE		USERS
SCOTT		    0 EMP666		     TABLE		TS001
SCOTT		    1 EMP666		     TABLE		TS001
SCOTT		    2 EMP666		     TABLE		TS001
SCOTT		    0 TX002			     TABLE		TS001
SCOTT		    0 EMP888		     TABLE		TS003
18 rows selected.
```
