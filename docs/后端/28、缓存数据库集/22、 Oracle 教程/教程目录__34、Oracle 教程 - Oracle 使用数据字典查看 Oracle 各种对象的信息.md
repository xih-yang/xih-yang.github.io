# 34、Oracle 教程 - Oracle 使用数据字典查看 Oracle 各种对象的信息
- 来源：https://ddkk.com/zhuanlan/db/oracle/1/34.html
- 分类：缓存数据库
- 分组：教程目录
## 一、使用 USER_OBJECTS 查看当前用户所拥有的各种对象的信息

### 1、USER_OBJECTS 数据字典的结构

```java
SQL> SHOW USER
USER is "SCOTT"
SQL> DESC USER_OBJECTS;
 Name										     Null?    Type
----------------------------------------------------------------------------------
 OBJECT_NAME									      VARCHAR2(128)
 SUBOBJECT_NAME 								      VARCHAR2(30)
 OBJECT_ID										      NUMBER
 DATA_OBJECT_ID 								      NUMBER
 OBJECT_TYPE									      VARCHAR2(19)
 CREATED										      DATE
 LAST_DDL_TIME									      DATE
 TIMESTAMP										      VARCHAR2(19)
 STATUS 										      VARCHAR2(7)
 TEMPORARY										      VARCHAR2(1)
 GENERATED										      VARCHAR2(1)
 SECONDARY										      VARCHAR2(1)
 NAMESPACE										      NUMBER
 EDITION_NAME									      VARCHAR2(30)
```

### （2）查看当前用户所拥有的各种对象的信息

```java
SQL> SELECT OBJECT_ID,OBJECT_NAME,OBJECT_TYPE,CREATED FROM USER_OBJECTS;
 OBJECT_ID OBJECT_NAME			  OBJECT_TYPE	      CREATED
---------- ------------------------------ ------------------- ---------
     88036 FUN_GET_TABLE_ROWCOUNT	  FUNCTION	      30-AUG-21    --存储函数
     88035 FUN_GET_DEPT_COUNT		  FUNCTION	      30-AUG-21    --存储函数
     88034 FUN_GET_GRADE		      FUNCTION	      30-AUG-21    --存储函数
     87111 SALGRADE			          TABLE 	      24-AUG-13    --表
     87110 BONUS        			  TABLE 	      24-AUG-13    --表
     87109 PK_EMP		        	  INDEX 	      24-AUG-13    --索引
     87108 EMP				          TABLE 	      24-AUG-13    --表
     87106 DEPT         			  TABLE 	      24-AUG-13    --表
     87107 PK_DEPT		        	  INDEX 	      24-AUG-13    --索引
     88033 SP_UPDATE_EMP_SAL		  PROCEDURE	      30-AUG-21    --存储过程
     88032 SP_SET_EMP_SAL	    	  PROCEDURE	      30-AUG-21    --存储过程
     88031 SP_ADD			          PROCEDURE	      30-AUG-21    --存储过程
     88030 T_UPDATE_DEPT	    	  TRIGGER	      30-AUG-21    --触发器
     88029 T_UPDATE_EMP 		      TRIGGER	      30-AUG-21    --触发器
     88028 T_DEL_EMP	    		  TRIGGER	      30-AUG-21    --触发器
     88024 V_EMP			          VIEW		      30-AUG-21    --视图
     88027 SYS_C0011090 		      INDEX 	      30-AUG-21    --索引
     87859 EMP666        			  TABLE 	      24-AUG-21    --表
     87858 EMP888		        	  TABLE 	      24-AUG-21    --表
     87856 EMP010        			  TABLE 	      24-AUG-21    --表
     87834 TX001		        	  TABLE 	      23-AUG-21    --表
     87835 TX002	        		  TABLE 	      23-AUG-21    --表
     87746 EMP_BAK			          TABLE 	      21-AUG-21    --表
     87778 TS_001	        		  TABLE 	      22-AUG-21    --表
     88026 EMP_LOGS			          TABLE 	      30-AUG-21    --表
     88025 SEQ_EMP_LOGS_ID	    	  SEQUENCE	      30-AUG-21    --自定义序列
     87784 E01		        		  TABLE 	      22-AUG-21    --表
     87795 SYS_TEMP_FBT 		      TABLE 	      22-AUG-21    --表
28 rows selected.
```

## 二、使用 ALL_OBJECTS 查看当前用户可以访问的对象的信息

### 1、ALL_OBJECTS 数据字典的结构

```java
SQL> DESC ALL_OBJECTS;
 Name										     Null?    Type
----------------------------------------------------------------------------------- --
 OWNER									     NOT NULL VARCHAR2(30)
 OBJECT_NAME							     NOT NULL VARCHAR2(30)
 SUBOBJECT_NAME 								      VARCHAR2(30)
 OBJECT_ID								     NOT NULL NUMBER
 DATA_OBJECT_ID 								      NUMBER
 OBJECT_TYPE									      VARCHAR2(19)
 CREATED								     NOT NULL DATE
 LAST_DDL_TIME							     NOT NULL DATE
 TIMESTAMP										      VARCHAR2(19)
 STATUS 										      VARCHAR2(7)
 TEMPORARY										      VARCHAR2(1)
 GENERATED										      VARCHAR2(1)
 SECONDARY										      VARCHAR2(1)
 NAMESPACE								     NOT NULL NUMBER
 EDITION_NAME									      VARCHAR2(30)
```

### （2）查看当前用户能够访问的各种对象的信息

```java
SQL> SELECT OWNER,OBJECT_TYPE,COUNT(*) FROM ALL_OBJECTS GROUP BY OWNER,OBJECT_TYPE ORDER BY OWNER;
OWNER			       OBJECT_TYPE	     COUNT(*)
------------------------------ ------------------- ----------
APEX_030200		       FUNCTION 		    4
APEX_030200		       PACKAGE			   47
APEX_030200		       PROCEDURE		   13
APEX_030200		       SEQUENCE 		    2
APEX_030200		       TABLE			    3
APEX_030200		       TYPE			        2
APEX_030200		       VIEW			      111
CTXSYS			       INDEXTYPE		    4
CTXSYS			       OPERATOR 		    6
CTXSYS			       PACKAGE			   13
CTXSYS			       TABLE			    5
CTXSYS			       TYPE		    	    9
CTXSYS			       VIEW			       62
DBSNMP			       PACKAGE			    1
EXFSYS			       FUNCTION 		    4
EXFSYS			       INDEXTYPE		    1
EXFSYS			       JAVA CLASS		    1
EXFSYS			       OPERATOR 		    1
EXFSYS			       PACKAGE			    7
EXFSYS			       PROCEDURE		    1
EXFSYS			       TABLE			    1
EXFSYS			       TYPE			       27
EXFSYS			       VIEW			       40
MDSYS			       FUNCTION 		   74
MDSYS			       INDEXTYPE		    2
MDSYS			       JAVA CLASS		  544
MDSYS			       JAVA RESOURCE		    3
MDSYS			       OPERATOR 		   25
MDSYS			       PACKAGE			   47
MDSYS			       SEQUENCE 		    6
MDSYS			       TABLE			   51
MDSYS			       TYPE			      189
MDSYS			       VIEW			       82
OLAPSYS 		       PACKAGE			    3
OLAPSYS 		       SEQUENCE 		    1
OLAPSYS 		       TABLE			    2
OLAPSYS 		       VIEW		    	  169
ORDDATA 		       VIEW		    	    5
ORDPLUGINS		       PACKAGE			    5
ORDSYS			       FUNCTION 		   32
ORDSYS			       JAVA CLASS		 1877
ORDSYS			       JAVA RESOURCE	   72
ORDSYS			       PACKAGE			   19
ORDSYS			       PROCEDURE		    7
ORDSYS			       TYPE			      446
ORDSYS			       VIEW			        5
PUBLIC			       SYNONYM			34017
SCOTT			       FUNCTION 		    3
SCOTT			       INDEX			    3
SCOTT			       PROCEDURE		    3
SCOTT			       SEQUENCE 		    1
SCOTT			       TABLE			   14
SCOTT			       TRIGGER			    3
SCOTT			       VIEW			        1
SYS			           CONSUMER GROUP	    2
SYS		    	       DESTINATION		    2
SYS			           EDITION			    1
SYS			           EVALUATION CONTEXT    1
SYS			           FUNCTION 		   90
SYS	    		       JAVA CLASS		26536
SYS		    	       JAVA RESOURCE	  863
SYS			           JOB CLASS		    2
SYS			           OPERATOR 		    7
SYS			           PACKAGE			  225
SYS		    	       PROCEDURE		   17
SYS			           PROGRAM			   11
SYS			           SCHEDULE 		    3
SYS			           SCHEDULER GROUP	    4
SYS		    	       SEQUENCE 		    3
SYS			           TABLE			   35
SYS			           TYPE			      772
SYS			           VIEW			     1378
SYS			           WINDOW			    9
SYSTEM			       TABLE			    7
SYSTEM			       VIEW			        1
WHITE			       TABLE			    1
WMSYS			       FUNCTION 		    4
WMSYS			       OPERATOR 		    9
WMSYS			       PACKAGE			    6
WMSYS			       TYPE			        8
WMSYS			       VIEW			       88
XDB		    	       FUNCTION 		    5
XDB			           INDEXTYPE		    2
XDB			           OPERATOR 		    7
XDB			           PACKAGE			   28
XDB			           SEQUENCE 		    1
XDB		    	       TABLE			   18
XDB			           TYPE			       90
XDB			           VIEW		    	    4
XDB			           XML SCHEMA		   53
90 rows selected.
```

## 三、使用 DBA_OBJECTS 查看 Oracle 所有对象的信息

### 1、DBA_OBJECTS 数据字典的结构

```java
SQL> DESC DBA_OBJECTS;
 Name										     Null?    Type
--------------------------------------------------------------------------------
 OWNER											      VARCHAR2(30)
 OBJECT_NAME									      VARCHAR2(128)
 SUBOBJECT_NAME 								      VARCHAR2(30)
 OBJECT_ID										      NUMBER
 DATA_OBJECT_ID 								      NUMBER
 OBJECT_TYPE									      VARCHAR2(19)
 CREATED										      DATE
 LAST_DDL_TIME									      DATE
 TIMESTAMP										      VARCHAR2(19)
 STATUS 										      VARCHAR2(7)
 TEMPORARY										      VARCHAR2(1)
 GENERATED										      VARCHAR2(1)
 SECONDARY										      VARCHAR2(1)
 NAMESPACE										      NUMBER
 EDITION_NAME									      VARCHAR2(30)
```

### 2、查看 Oracle 各类对象的数量

```java
SQL> SELECT COUNT(*) FROM DBA_OBJECTS;
  COUNT(*)
----------
     86350
SQL> SELECT OBJECT_TYPE,COUNT(*) FROM DBA_OBJECTS GROUP BY OBJECT_TYPE;
OBJECT_TYPE	      COUNT(*)
------------------- ----------
EDITION 	    	     1
INDEX PARTITION 	   126
TABLE SUBPARTITION	    32
CONSUMER GROUP		    25
SEQUENCE		       224
TABLE PARTITION 	   105
SCHEDULE		         3
QUEUE	    		    35
RULE		    	     1
JAVA DATA		       323
PROCEDURE		       174
OPERATOR		        55
LOB PARTITION		     1
DESTINATION	    	     2
WINDOW			         9
SCHEDULER GROUP 	     4
LOB	        		  1012
PACKAGE 	    	  1334
PACKAGE BODY		  1273
LIBRARY 		       193
PROGRAM 		        19
RULE SET	    	    19
CONTEXT 		         7
TYPE BODY		       243
JAVA RESOURCE		   940
XML SCHEMA	    	    53
TRIGGER 		       629
JOB CLASS		        14
UNDEFINED	    	    11
DIRECTORY		         4
MATERIALIZED VIEW	     1
TABLE	    		  2905
INDEX		    	  4893
SYNONYM 		     34106
VIEW	    		  5219
FUNCTION	    	   314
JAVA CLASS		     29075
JAVA SOURCE		         2
INDEXTYPE		         9
CLUSTER     		    10
TYPE		    	  2909
RESOURCE PLAN		    10
JOB			            14
EVALUATION CONTEXT	    12
44 rows selected.
```

### 3、查看 scott 用户所拥有的对象的信息

```java
SQL> SELECT OWNER,OBJECT_ID,OBJECT_NAME,OBJECT_TYPE FROM DBA_OBJECTS WHERE OWNER='SCOTT';
OWNER	    OBJECT_ID OBJECT_NAME		     OBJECT_TYPE
---------- ---------- ------------------------------ -------------------
SCOTT		87795 SYS_TEMP_FBT		     TABLE
SCOTT		87784 E01			         TABLE
SCOTT		88025 SEQ_EMP_LOGS_ID	     SEQUENCE
SCOTT		88026 EMP_LOGS			     TABLE
SCOTT		87778 TS_001			     TABLE
SCOTT		87746 EMP_BAK			     TABLE
SCOTT		87835 TX002			         TABLE
SCOTT		87834 TX001			         TABLE
SCOTT		87856 EMP010			     TABLE
SCOTT		87858 EMP888			     TABLE
SCOTT		87859 EMP666			     TABLE
SCOTT		88027 SYS_C0011090		     INDEX
SCOTT		88024 V_EMP			         VIEW
SCOTT		88028 T_DEL_EMP 		     TRIGGER
SCOTT		88029 T_UPDATE_EMP		     TRIGGER
SCOTT		88030 T_UPDATE_DEPT		     TRIGGER
SCOTT		88031 SP_ADD			     PROCEDURE
SCOTT		88032 SP_SET_EMP_SAL	     PROCEDURE
SCOTT		88033 SP_UPDATE_EMP_SAL      PROCEDURE
SCOTT		87107 PK_DEPT			     INDEX
SCOTT		87106 DEPT			         TABLE
SCOTT		87108 EMP			         TABLE
SCOTT		87109 PK_EMP			     INDEX
SCOTT		87110 BONUS			         TABLE
SCOTT		87111 SALGRADE			     TABLE
SCOTT		88034 FUN_GET_GRADE		     FUNCTION
SCOTT		88035 FUN_GET_DEPT_COUNT	 FUNCTION
SCOTT		88036 FUN_GET_TABLE_ROWCOUNT  FUNCTION
28 rows selected.
```
