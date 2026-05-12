# 32、Oracle 教程 - Oracle 表有关的数据字典
- 来源：https://ddkk.com/zhuanlan/db/oracle/1/32.html
- 分类：缓存数据库
- 分组：教程目录
## 一、查询当前用户所拥有的表

使用数据字典 USER_TABLES 可以查询当前用户所拥有的表，该数据字典的表结构如下：

```java
SQL> SHOW USER;
USER is "SCOTT"
SQL> DESC USER_TABLES;
 Name										     Null?    Type
 -----------------------------------------------------------------------------------
 TABLE_NAME								     NOT NULL VARCHAR2(30)
 TABLESPACE_NAME								      VARCHAR2(30)
 CLUSTER_NAME									      VARCHAR2(30)
 IOT_NAME										      VARCHAR2(30)
 STATUS 										      VARCHAR2(8)
 PCT_FREE										      NUMBER
 PCT_USED										      NUMBER
 INI_TRANS										      NUMBER
 MAX_TRANS										      NUMBER
 INITIAL_EXTENT 								      NUMBER
 NEXT_EXTENT									      NUMBER
 MIN_EXTENTS									      NUMBER
 MAX_EXTENTS									      NUMBER
 PCT_INCREASE									      NUMBER
 FREELISTS										      NUMBER
 FREELIST_GROUPS								      NUMBER
 LOGGING										      VARCHAR2(3)
 BACKED_UP										      VARCHAR2(1)
 NUM_ROWS										      NUMBER
 BLOCKS 										      NUMBER
 EMPTY_BLOCKS									      NUMBER
 AVG_SPACE										      NUMBER
 CHAIN_CNT										      NUMBER
 AVG_ROW_LEN									      NUMBER
 AVG_SPACE_FREELIST_BLOCKS						        NUMBER
 NUM_FREELIST_BLOCKS							       NUMBER
 DEGREE 										      VARCHAR2(10)
 INSTANCES										      VARCHAR2(10)
 CACHE											      VARCHAR2(5)
 TABLE_LOCK										      VARCHAR2(8)
 SAMPLE_SIZE									      NUMBER
 LAST_ANALYZED									      DATE
 PARTITIONED									      VARCHAR2(3)
 IOT_TYPE										      VARCHAR2(12)
 TEMPORARY										      VARCHAR2(1)
 SECONDARY										      VARCHAR2(1)
 NESTED 										      VARCHAR2(3)
 BUFFER_POOL									      VARCHAR2(7)
 FLASH_CACHE									      VARCHAR2(7)
 CELL_FLASH_CACHE								      VARCHAR2(7)
 ROW_MOVEMENT									      VARCHAR2(8)
 GLOBAL_STATS									      VARCHAR2(3)
 USER_STATS										      VARCHAR2(3)
 DURATION										      VARCHAR2(15)
 SKIP_CORRUPT									      VARCHAR2(8)
 MONITORING										      VARCHAR2(3)
 CLUSTER_OWNER									      VARCHAR2(30)
 DEPENDENCIES									      VARCHAR2(8)
 COMPRESSION									      VARCHAR2(8)
 COMPRESS_FOR									      VARCHAR2(12)
 DROPPED										      VARCHAR2(3)
 READ_ONLY										      VARCHAR2(3)
 SEGMENT_CREATED								      VARCHAR2(3)
 RESULT_CACHE									      VARCHAR2(7)
```

查询当前用户所拥有的表：

```java
SQL> SELECT TABLE_NAME, TABLESPACE_NAME, PCT_FREE, PCT_USED FROM USER_TABLES;
TABLE_NAME		       TABLESPACE_NAME			PCT_FREE   PCT_USED
------------------------------ ------------------------------ ---------- ----------
DEPT		       USERS				      10
EMP			       USERS				      10
BONUS		       USERS				      10
SALGRADE	       USERS				      10
EMP_BAK 	       USERS				      10
TS_001		       USERS				      10
E01			       USERS				      10
TX001		       SYSTEM				      10	 40
TX002		       TS001				      10
EMP010		       USERS				      10
EMP888		       TS003				      10
EMP666		       TS001				      10
SYS_TEMP_FBT							      10	 40
```

数据字典 TABS 为 USER_TABLES 的别名：

```java
SQL> SELECT TABLE_NAME, TABLESPACE_NAME, PCT_FREE, PCT_USED FROM TABS;
TABLE_NAME		       TABLESPACE_NAME			PCT_FREE   PCT_USED
------------------------------ ------------------------------ ---------- ----------
DEPT			      USERS				      10
EMP			          USERS				      10
BONUS			      USERS				      10
SALGRADE		       USERS			      10
EMP_BAK 		       USERS			      10
TS_001			       USERS			      10
E01			           USERS			      10
TX001			       SYSTEM			      10	 40
TX002			       TS001			      10
EMP010			       USERS			      10
EMP888			       TS003			      10
EMP666			       TS001			      10
SYS_TEMP_FBT							      10	 40
13 rows selected.
```

如果仅仅查询当前用户所拥有的表的表名，可以使用如下命令：

```java
SQL> SELECT * FROM TAB;
TNAME			           TABTYPE	CLUSTERID
------------------------------ ------- ----------
BIN$ykHOOudYVAjgUwsBqMCqjA==$0  TABLE
BONUS			               TABLE
DEPT			               TABLE
E01			                   TABLE
EMP			                   TABLE
EMP010	        		       TABLE
EMP666			               TABLE
EMP888			               TABLE
EMP_BAK 	        	       TABLE
SALGRADE		               TABLE
SYS_TEMP_FBT		           TABLE
TS_001	        		       TABLE
TX001			               TABLE
TX002			               TABLE
14 rows selected.
```

## 二、查询当前用户可以访问的表

使用数据字典 ALL_TABLES 可以查询当前用户可以访问的表，该数据字典的表结构如下：

```java
SQL> DESC ALL_TABLES;
 Name										     Null?    Type
 -------------------------------------------------------------------------------
 OWNER									     NOT NULL VARCHAR2(30)
 TABLE_NAME								     NOT NULL VARCHAR2(30)
 TABLESPACE_NAME								      VARCHAR2(30)
 CLUSTER_NAME									      VARCHAR2(30)
 IOT_NAME										      VARCHAR2(30)
 STATUS 										      VARCHAR2(8)
 PCT_FREE										      NUMBER
 PCT_USED										      NUMBER
 INI_TRANS										      NUMBER
 MAX_TRANS										      NUMBER
 INITIAL_EXTENT 								      NUMBER
 NEXT_EXTENT									      NUMBER
 MIN_EXTENTS									      NUMBER
 MAX_EXTENTS									      NUMBER
 PCT_INCREASE									      NUMBER
 FREELISTS										      NUMBER
 FREELIST_GROUPS								      NUMBER
 LOGGING										      VARCHAR2(3)
 BACKED_UP										      VARCHAR2(1)
 NUM_ROWS										      NUMBER
 BLOCKS 										      NUMBER
 EMPTY_BLOCKS									      NUMBER
 AVG_SPACE										      NUMBER
 CHAIN_CNT										      NUMBER
 AVG_ROW_LEN									      NUMBER
 AVG_SPACE_FREELIST_BLOCKS						      NUMBER
 NUM_FREELIST_BLOCKS							      NUMBER
 DEGREE 										      VARCHAR2(10)
 INSTANCES										      VARCHAR2(10)
 CACHE											      VARCHAR2(5)
 TABLE_LOCK										      VARCHAR2(8)
 SAMPLE_SIZE									      NUMBER
 LAST_ANALYZED									      DATE
 PARTITIONED									      VARCHAR2(3)
 IOT_TYPE										      VARCHAR2(12)
 TEMPORARY										      VARCHAR2(1)
 SECONDARY										      VARCHAR2(1)
 NESTED 										      VARCHAR2(3)
 BUFFER_POOL									      VARCHAR2(7)
 FLASH_CACHE									      VARCHAR2(7)
 CELL_FLASH_CACHE								      VARCHAR2(7)
 ROW_MOVEMENT									      VARCHAR2(8)
 GLOBAL_STATS									      VARCHAR2(3)
 USER_STATS										      VARCHAR2(3)
 DURATION										      VARCHAR2(15)
 SKIP_CORRUPT									      VARCHAR2(8)
 MONITORING										      VARCHAR2(3)
 CLUSTER_OWNER									      VARCHAR2(30)
 DEPENDENCIES									      VARCHAR2(8)
 COMPRESSION									      VARCHAR2(8)
 COMPRESS_FOR									      VARCHAR2(12)
 DROPPED										      VARCHAR2(3)
 READ_ONLY										      VARCHAR2(3)
 SEGMENT_CREATED								      VARCHAR2(3)
 RESULT_CACHE									      VARCHAR2(7)
```

查看SCOTT 用户所能访问的表：

```java
SQL> SELECT OWNER, TABLE_NAME, TABLESPACE_NAME, STATUS FROM ALL_TABLES;
OWNER			       TABLE_NAME		      TABLESPACE_NAME		     STATUS
------------------------------ ------------------------------ ------------------------------ --------
SYS			       DUAL			                  SYSTEM			     VALID
SYS			       SYSTEM_PRIVILEGE_MAP	          SYSTEM			     VALID
SYS			       TABLE_PRIVILEGE_MAP	          SYSTEM			     VALID
SYS			       STMT_AUDIT_OPTION_MAP	      SYSTEM			     VALID
SYS			       AUDIT_ACTIONS		          SYSTEM			     VALID
SYS			       WRR$_REPLAY_CALL_FILTER	      SYSAUX			     VALID
SYS			       HS_BULKLOAD_VIEW_OBJ	          SYSTEM			     VALID
SYS			       HS$_PARALLEL_METADATA	      SYSTEM			     VALID
SYS			       HS_PARTITION_COL_NAME	      SYSTEM			     VALID
SYS			       HS_PARTITION_COL_TYPE	      SYSTEM			     VALID
SYSTEM		       HELP			                  SYSTEM			     VALID
CTXSYS		       DR$OBJECT_ATTRIBUTE	          SYSAUX			     VALID
CTXSYS		       DR$POLICY_TAB		          SYSAUX			     VALID
CTXSYS		       DR$THS			              SYSAUX			     VALID
CTXSYS		       DR$THS_PHRASE	    	      SYSAUX			     VALID
CTXSYS		       DR$NUMBER_SEQUENCE	          SYSAUX			     VALID
XDB			       XDB$IMPORT_TT_INFO	          SYSAUX			     VALID
MDSYS		       OGIS_SPATIAL_REFERENCE_SYSTEMS SYSAUX			     VALID
MDSYS		       OGIS_GEOMETRY_COLUMNS	      SYSAUX			     VALID
MDSYS		       SDO_UNITS_OF_MEASURE	          SYSAUX			     VALID
MDSYS		       SDO_PRIME_MERIDIANS	          SYSAUX			     VALID
MDSYS		       SDO_ELLIPSOIDS		          SYSAUX			     VALID
MDSYS		       SDO_DATUMS		              SYSAUX			     VALID
MDSYS		       SDO_COORD_SYS		          SYSAUX			     VALID
MDSYS		       SDO_COORD_AXIS_NAMES	          SYSAUX			     VALID
MDSYS		       SDO_COORD_AXES		          SYSAUX			     VALID
MDSYS		       SDO_COORD_REF_SYS	          SYSAUX			     VALID
MDSYS		       SDO_COORD_OP_METHODS	          SYSAUX			     VALID
MDSYS		       SDO_COORD_OPS		          SYSAUX			     VALID
MDSYS		       SDO_PREFERRED_OPS_SYSTEM       SYSAUX			     VALID
MDSYS		       SDO_PREFERRED_OPS_USER	      SYSAUX			     VALID
MDSYS		       SDO_COORD_OP_PATHS	          SYSAUX			     VALID
MDSYS		       SDO_COORD_OP_PARAMS	          SYSAUX			     VALID
MDSYS		       SDO_COORD_OP_PARAM_USE	      SYSAUX			     VALID
MDSYS		       SDO_COORD_OP_PARAM_VALS	      SYSAUX			     VALID
SYS			       AW$EXPRESS		              SYSAUX			     VALID
SYS			       AW$AWMD			              SYSAUX			     VALID
SYS			       AW$AWCREATE	        	      SYSAUX			     VALID
SYS			       AW$AWCREATE10G		          SYSAUX			     VALID
SYS			       AW$AWXML 		              SYSAUX			     VALID
SYS			       AW$AWREPORT		              SYSAUX			     VALID
SYSTEM		       MVIEW$_ADV_INDEX     	      SYSTEM			     VALID
SYSTEM		       MVIEW$_ADV_PARTITION	          SYSTEM			     VALID
MDSYS		       SDO_CS_SRS		              SYSAUX			     VALID
MDSYS		       NTV2_XML_DATA	    	      SYSAUX			     VALID
MDSYS		       SDO_PROJECTIONS_OLD_SNAPSHOT   SYSAUX			     VALID
MDSYS		       SDO_ELLIPSOIDS_OLD_SNAPSHOT    SYSAUX			     VALID
MDSYS		       SDO_DATUMS_OLD_SNAPSHOT	      SYSAUX			     VALID
MDSYS		       SRSNAMESPACE_TABLE	          SYSAUX			     VALID
MDSYS		       SDO_XML_SCHEMAS		          SYSAUX			     VALID
MDSYS		       SDO_CRS_GEOGRAPHIC_PLUS_HEIGHT SYSAUX			     VALID
MDSYS		       SDO_FEATURE_USAGE	          SYSAUX			     VALID
MDSYS		       SDO_GEOR_XMLSCHEMA_TABLE       SYSAUX			     VALID
MDSYS		       SDO_GEOR_PLUGIN_REGISTRY       SYSAUX			     VALID
MDSYS		       SDO_TIN_PC_SEQ		          SYSAUX			     VALID
MDSYS		       SDO_TIN_PC_SYSDATA_TABLE       SYSAUX			     VALID
MDSYS		       SDO_WS_CONFERENCE	          SYSAUX			     VALID
MDSYS		       SDO_WS_CONFERENCE_RESULTS      SYSAUX			     VALID
MDSYS		       SDO_WS_CONFERENCE_PARTICIPANTS SYSAUX			     VALID
APEX_030200	       WWV_FLOW_DUAL100 	          SYSAUX			     VALID
SCOTT		       DEPT		            	      USERS			         VALID
SCOTT		       EMP		            	      USERS			         VALID
SCOTT		       BONUS	            	      USERS			         VALID
SCOTT		       SALGRADE 		              USERS		    	     VALID
SCOTT		       EMP_BAK	        		      USERS			         VALID
SCOTT		       TS_001	        		      USERS			         VALID
SCOTT		       E01		            	      USERS		    	     VALID
SCOTT		       TX001	        		      SYSTEM			     VALID
SCOTT		       TX002	        		      TS001		    	     VALID
SCOTT		       EMP010		        	      USERS			         VALID
SCOTT		       EMP888		        	      TS003			         VALID
SCOTT		       EMP666		        	      TS001		    	     VALID
WHITE		       T1			                  TS001		    	     VALID
APEX_030200	       WWV_FLOW_TEMP_TABLE	            				     VALID
APEX_030200	       WWV_FLOW_LOV_TEMP				            	     VALID
MDSYS		       SDO_WFS_LOCAL_TXNS		            			     VALID
MDSYS		       SDO_GR_RDT_1						                     VALID
MDSYS		       SDO_GR_MOSAIC_3						                 VALID
MDSYS		       SDO_GR_MOSAIC_2		            				     VALID
MDSYS		       SDO_GR_MOSAIC_1					            	     VALID
MDSYS		       SDO_GR_MOSAIC_0			            			     VALID
MDSYS		       SDO_TOPO_DATA$			            			     VALID
MDSYS		       SDO_TOPO_RELATION_DATA	            			     VALID
MDSYS		       SDO_TOPO_TRANSACT_DATA				                 VALID
MDSYS		       SDO_CS_CONTEXT_INFORMATION            			     VALID
MDSYS		       SDO_TXN_IDX_EXP_UPD_RGN				                 VALID
MDSYS		       SDO_TXN_IDX_DELETES	            				     VALID
MDSYS		       SDO_TXN_IDX_INSERTS				            	     VALID
MDSYS		       SDO_ST_TOLERANCE 	            				     VALID
OLAPSYS 	       OLAP_SESSION_CUBES				            	     VALID
OLAPSYS 	       OLAP_SESSION_DIMS		            			     VALID
SYS			       SAM_SPARSITY_ADVICE					                 VALID
SYSTEM		       MVIEW$_ADV_OWB		            				     VALID
SYS			       OLAPTABLEVELTUPLES				            	     VALID
SYS			       OLAPTABLEVELS		            				     VALID
EXFSYS		       RLM$PARSEDCOND					            	     VALID
XDB			       XDB$XIDX_IMP_T		            				     VALID
SYS			       KU$_DATAPUMP_MASTER_10_1 				             VALID
SYS			       KU$_DATAPUMP_MASTER_11_1 			        	     VALID
SYS			       KU$_DATAPUMP_MASTER_11_1_0_7			        	     VALID
SYS			       KU$_DATAPUMP_MASTER_11_2 			        	     VALID
SYS			       DATA_PUMP_XPL_TABLE$			            		     VALID
SYS			       IMPDP_STATS			            	    		     VALID
SCOTT		       SYS_TEMP_FBT			            			         VALID
SYS			       KU$XKTFBUE			                			     VALID
SYS			       ODCI_PMO_ROWIDS$ 		            			     VALID
SYS			       ODCI_WARNINGS$		            				     VALID
SYS			       ODCI_SECOBJ$			                			     VALID
SYS			       KU$_LIST_FILTER_TEMP_2	           				     VALID
SYS			       KU$_LIST_FILTER_TEMP		            			     VALID
SYS			       KU$NOEXP_TAB						                     VALID
SYSTEM		       OL$NODES 		            		    		     VALID
SYSTEM		       OL$HINTS 					                	     VALID
SYSTEM		       OL$				            			             VALID
SYS			       PLAN_TABLE$					            	         VALID
SYS			       WRI$_ADV_ASA_RECO_DATA					             VALID
SYS			       PSTUBTBL 			            			         VALID
117 rows selected.
```

## 三、查询 Oracle 数据库中所有的表

使用数据字典 DBA_TABLES 可以查询 Oracle 数据库创建的所有的表，该数据字典的结构如下：

```java
SQL> DESC DBA_TABLES;
 Name										     Null?    Type
 -----------------------------------------------------------------------------------
 OWNER									     NOT NULL VARCHAR2(30)
 TABLE_NAME								     NOT NULL VARCHAR2(30)
 TABLESPACE_NAME								      VARCHAR2(30)
 CLUSTER_NAME									      VARCHAR2(30)
 IOT_NAME										      VARCHAR2(30)
 STATUS 										      VARCHAR2(8)
 PCT_FREE										      NUMBER
 PCT_USED										      NUMBER
 INI_TRANS										      NUMBER
 MAX_TRANS										      NUMBER
 INITIAL_EXTENT 								      NUMBER
 NEXT_EXTENT									      NUMBER
 MIN_EXTENTS									      NUMBER
 MAX_EXTENTS									      NUMBER
 PCT_INCREASE									      NUMBER
 FREELISTS										      NUMBER
 FREELIST_GROUPS								      NUMBER
 LOGGING										      VARCHAR2(3)
 BACKED_UP										      VARCHAR2(1)
 NUM_ROWS										      NUMBER
 BLOCKS 										      NUMBER
 EMPTY_BLOCKS									      NUMBER
 AVG_SPACE										      NUMBER
 CHAIN_CNT										      NUMBER
 AVG_ROW_LEN									      NUMBER
 AVG_SPACE_FREELIST_BLOCKS						      NUMBER
 NUM_FREELIST_BLOCKS							      NUMBER
 DEGREE 										      VARCHAR2(10)
 INSTANCES										      VARCHAR2(10)
 CACHE											      VARCHAR2(5)
 TABLE_LOCK										      VARCHAR2(8)
 SAMPLE_SIZE									      NUMBER
 LAST_ANALYZED									      DATE
 PARTITIONED									      VARCHAR2(3)
 IOT_TYPE										      VARCHAR2(12)
 TEMPORARY										      VARCHAR2(1)
 SECONDARY										      VARCHAR2(1)
 NESTED 										      VARCHAR2(3)
 BUFFER_POOL									      VARCHAR2(7)
 FLASH_CACHE									      VARCHAR2(7)
 CELL_FLASH_CACHE								      VARCHAR2(7)
 ROW_MOVEMENT									      VARCHAR2(8)
 GLOBAL_STATS									      VARCHAR2(3)
 USER_STATS										      VARCHAR2(3)
 DURATION										      VARCHAR2(15)
 SKIP_CORRUPT									      VARCHAR2(8)
 MONITORING										      VARCHAR2(3)
 CLUSTER_OWNER									      VARCHAR2(30)
 DEPENDENCIES									      VARCHAR2(8)
 COMPRESSION									      VARCHAR2(8)
 COMPRESS_FOR									      VARCHAR2(12)
 DROPPED										      VARCHAR2(3)
 READ_ONLY										      VARCHAR2(3)
 SEGMENT_CREATED								      VARCHAR2(3)
 RESULT_CACHE									      VARCHAR2(7)
```

查询Oracle 数据库中一共有多少张数据表：

```java
SQL> SELECT COUNT(*) FROM DBA_TABLES;
  COUNT(*)
----------
      2818
```

查询SCOTT 用户拥有的表：

```java
SQL> SELECT OWNER,TABLE_NAME,TABLESPACE_NAME FROM DBA_TABLES WHERE OWNER='SCOTT';
OWNER	   TABLE_NAME			  TABLESPACE_NAME
---------- ------------------------------ ------------------------------
SCOTT	   DEPT 			  USERS
SCOTT	   EMP				  USERS
SCOTT	   SALGRADE			  USERS
SCOTT	   EMP_BAK			  USERS
SCOTT	   TX001			  SYSTEM
SCOTT	   TS_001			  USERS
SCOTT	   E01				  USERS
SCOTT	   TX002			  TS001
SCOTT	   EMP888			  TS003
SCOTT	   EMP010			  USERS
SCOTT	   EMP666			  TS001
SCOTT	   SYS_TEMP_FBT
SCOTT	   BONUS			  USERS
13 rows selected.
```

## 四、查询表中的字段信息

### 1、使用 USER_TAB_COLUMNS 查询当前用户所拥有的表中的字段信息

数据字典 USER_TAB_COLUMNS 的结构如下：

```java
SQL> DESC USER_TAB_COLUMNS;
 Name										     Null?    Type
 --------------------------------------------------------------------------------
 TABLE_NAME								     NOT NULL VARCHAR2(30)
 COLUMN_NAME							     NOT NULL VARCHAR2(30)
 DATA_TYPE										      VARCHAR2(106)
 DATA_TYPE_MOD									      VARCHAR2(3)
 DATA_TYPE_OWNER								      VARCHAR2(30)
 DATA_LENGTH							     NOT NULL NUMBER
 DATA_PRECISION 								      NUMBER
 DATA_SCALE										      NUMBER
 NULLABLE										      VARCHAR2(1)
 COLUMN_ID										      NUMBER
 DEFAULT_LENGTH 								      NUMBER
 DATA_DEFAULT									      LONG
 NUM_DISTINCT									      NUMBER
 LOW_VALUE										      RAW(32)
 HIGH_VALUE										      RAW(32)
 DENSITY										      NUMBER
 NUM_NULLS										      NUMBER
 NUM_BUCKETS									      NUMBER
 LAST_ANALYZED									      DATE
 SAMPLE_SIZE									      NUMBER
 CHARACTER_SET_NAME								      VARCHAR2(44)
 CHAR_COL_DECL_LENGTH							      NUMBER
 GLOBAL_STATS									      VARCHAR2(3)
 USER_STATS										      VARCHAR2(3)
 AVG_COL_LEN									      NUMBER
 CHAR_LENGTH									      NUMBER
 CHAR_USED										      VARCHAR2(1)
 V80_FMT_IMAGE									      VARCHAR2(3)
 DATA_UPGRADED									      VARCHAR2(3)
 HISTOGRAM										      VARCHAR2(15)
```

查询表中的字段信息：

```java
SQL> SELECT TABLE_NAME,COUNT(*) FROM USER_TAB_COLUMNS GROUP BY TABLE_NAME;
TABLE_NAME	       COUNT(*)
-------------------- ----------
EMP666		      8
SYS_TEMP_FBT      5
TX002		      2
DEPT		      3
EMP010		      8
TS_001		      1
EMP888		      8
EMP			      8
BONUS		      4
E01			      4
TX001		      2
EMP_BAK 	      3
SALGRADE	      3
13 rows selected.
SQL> SELECT TABLE_NAME,COLUMN_NAME,DATA_TYPE,DATA_LENGTH,DATA_DEFAULT 
     FROM USER_TAB_COLUMNS
     WHERE TABLE_NAME='EMP';
TABLE_NAME	     COLUMN_NAME     DATA_TYPE	     DATA_LENGTH DATA_DEFAULT
--------------- --------------------------------------------------------------------------------
EMP		     EMPNO	     NUMBER		      22
EMP		     ENAME	     VARCHAR2		      10
EMP		     JOB	     VARCHAR2		       9
EMP		     MGR	     NUMBER		      22
EMP		     HIREDATE	     DATE		       7
EMP		     SAL	     NUMBER		      22
EMP		     COMM	     NUMBER		      22
EMP		     DEPTNO	     NUMBER		      22
8 rows selected.
```

### 2、使用 ALL_TAB_COLUMNS 查询当前用户所能访问的表中的字段信息

数据字典 ALL_TAB_COLUMNS 的结构如下：

```java
SQL> DESC ALL_TAB_COLUMNS;
 Name										     Null?    Type
 ----------------------------------------------------------------------------------- --
 OWNER									     NOT NULL VARCHAR2(30)
 TABLE_NAME								     NOT NULL VARCHAR2(30)
 COLUMN_NAME							     NOT NULL VARCHAR2(30)
 DATA_TYPE										      VARCHAR2(106)
 DATA_TYPE_MOD									      VARCHAR2(3)
 DATA_TYPE_OWNER								      VARCHAR2(30)
 DATA_LENGTH							     NOT NULL NUMBER
 DATA_PRECISION 								      NUMBER
 DATA_SCALE										      NUMBER
 NULLABLE										      VARCHAR2(1)
 COLUMN_ID										      NUMBER
 DEFAULT_LENGTH 								      NUMBER
 DATA_DEFAULT									      LONG
 NUM_DISTINCT									      NUMBER
 LOW_VALUE										      RAW(32)
 HIGH_VALUE										      RAW(32)
 DENSITY										      NUMBER
 NUM_NULLS										      NUMBER
 NUM_BUCKETS									      NUMBER
 LAST_ANALYZED									      DATE
 SAMPLE_SIZE									      NUMBER
 CHARACTER_SET_NAME								      VARCHAR2(44)
 CHAR_COL_DECL_LENGTH							      NUMBER
 GLOBAL_STATS									      VARCHAR2(3)
 USER_STATS										      VARCHAR2(3)
 AVG_COL_LEN									      NUMBER
 CHAR_LENGTH									      NUMBER
 CHAR_USED										      VARCHAR2(1)
 V80_FMT_IMAGE									      VARCHAR2(3)
 DATA_UPGRADED									      VARCHAR2(3)
 HISTOGRAM										      VARCHAR2(15)
```

查询当前用户能够访问的表中的字段信息：

```java
SQL> SHOW USER;
USER is "SCOTT"
--查询 WHITE 用户的表及表中的字段
SQL> SELECT TABLE_NAME,COLUMN_NAME,DATA_TYPE,DATA_LENGTH,DATA_DEFAULT 
     FROM ALL_TAB_COLUMNS
     WHERE OWNER='WHITE';
TABLE_NAME	     COLUMN_NAME     DATA_TYPE	     DATA_LENGTH DATA_DEFAULT
-- --------------------------------------------------------------------------------
T1		     X		     NUMBER		          22
T1		     NAME	     VARCHAR2		      20
--查询 BLACK 用户的表及表中的字段，SCOTT 用户无权访问 BLACK 用户的表
SQL> SELECT TABLE_NAME,COLUMN_NAME,DATA_TYPE,DATA_LENGTH,DATA_DEFAULT 
     FROM ALL_TAB_COLUMNS
     WHERE OWNER='BLACK';
no rows selected
```

### 3、使用 DBA_TAB_COLUMNS 查询所有表中的字段信息

数据字典 DBA_TAB_COLUMNS 的结构如下：

```java
SQL> DESC DBA_TAB_COLUMNS;
 Name										     Null?    Type
 ----------------------------------------------------------------------------------
 OWNER									     NOT NULL VARCHAR2(30)
 TABLE_NAME								     NOT NULL VARCHAR2(30)
 COLUMN_NAME							     NOT NULL VARCHAR2(30)
 DATA_TYPE										      VARCHAR2(106)
 DATA_TYPE_MOD									      VARCHAR2(3)
 DATA_TYPE_OWNER								      VARCHAR2(30)
 DATA_LENGTH							     NOT NULL NUMBER
 DATA_PRECISION 								      NUMBER
 DATA_SCALE										      NUMBER
 NULLABLE										      VARCHAR2(1)
 COLUMN_ID										      NUMBER
 DEFAULT_LENGTH 								      NUMBER
 DATA_DEFAULT									      LONG
 NUM_DISTINCT									      NUMBER
 LOW_VALUE										      RAW(32)
 HIGH_VALUE										      RAW(32)
 DENSITY										      NUMBER
 NUM_NULLS										      NUMBER
 NUM_BUCKETS									      NUMBER
 LAST_ANALYZED									      DATE
 SAMPLE_SIZE									      NUMBER
 CHARACTER_SET_NAME								      VARCHAR2(44)
 CHAR_COL_DECL_LENGTH							      NUMBER
 GLOBAL_STATS									      VARCHAR2(3)
 USER_STATS										      VARCHAR2(3)
 AVG_COL_LEN									      NUMBER
 CHAR_LENGTH									      NUMBER
 CHAR_USED										      VARCHAR2(1)
 V80_FMT_IMAGE									      VARCHAR2(3)
 DATA_UPGRADED									      VARCHAR2(3)
 HISTOGRAM										      VARCHAR2(15)
```

查询WHITE 和 BLACK 用户所拥有的表以及表结构：

```java
--查询 WHITE 用户所拥有的表以及表结构：
SQL> SELECT TABLE_NAME,COLUMN_NAME,DATA_TYPE,DATA_LENGTH
     FROM ALL_TAB_COLUMNS
     WHERE OWNER='WHITE';
TABLE_NAME	     COLUMN_NAME     DATA_TYPE       DATA_LENGTH
-------------------------------------------------------------------------------
T1		     X		     NUMBER   	 22
T1		     NAME	     VARCHAR2	 20
--查询 WHITE 用户所拥有的表以及表结构：
SQL> SELECT TABLE_NAME,COLUMN_NAME,DATA_TYPE,DATA_LENGTH
     FROM ALL_TAB_COLUMNS
     WHERE OWNER='BLACK';
TABLE_NAME	     COLUMN_NAME     DATA_TYPE      DATA_LENGTH
--------------------------------------------------------------------------------
T22		     X		     NUMBER 	 22
T22		     NAME	     VARCHAR2	 20
```

## 五、查询表和字段的注释信息

### 1、使用数据字典 USER_TAB_COMMENTS、ALL_TAB_COMMENTS、DBA_TAB_COMMENTS 查询表的注释信息

### （1）USER_TAB_COMMENTS

表结构如下：

```java
SQL> DESC USER_TAB_COMMENTS;
 Name										     Null?    Type
 -------------------------------------------------------------------------------
 TABLE_NAME								     NOT NULL VARCHAR2(30)
 TABLE_TYPE										      VARCHAR2(11)
 COMMENTS										      VARCHAR2(4000)
```

查询SCOTT 用户的表注释信息：

```java
SQL> SELECT * FROM USER_TAB_COMMENTS;
TABLE_NAME	     TABLE_TYPE  COMMENTS
-------------------- ----------- -------------------------------------------------------
TX002		     TABLE
TX001		     TABLE
TS_001		     TABLE
SYS_TEMP_FBT	     TABLE
SALGRADE	     TABLE
EMP_BAK 	     TABLE
EMP888		     TABLE
EMP666		     TABLE
EMP010		     TABLE
EMP		     TABLE
E01		     TABLE
DEPT		     TABLE
BONUS		     TABLE
13 rows selected.
```

### （2）ALL_TAB_COMMENTS

结构如下：

```java
SQL> DESC ALL_TAB_COMMENTS;
 Name										     Null?    Type
 ----------------------------------------------------------------------------------- 
 OWNER									     NOT NULL VARCHAR2(30)
 TABLE_NAME								     NOT NULL VARCHAR2(30)
 TABLE_TYPE										      VARCHAR2(11)
 COMMENTS										      VARCHAR2(4000)
```

查询WHITE 和 BLACK 用户的表注释信息：

```java
--查询 WHITE 用户的表注释信息，SCOTT 用户有权访问 WHITE 用户的 T1 表
SQL> SELECT * FROM ALL_TAB_COMMENTS WHERE OWNER='WHITE';
OWNER			       TABLE_NAME	    TABLE_TYPE   COMMENTS
-------------------------------------------------------------------
WHITE			       T1		    TABLE
--查询 BLACK 用户的表注释信息，SCOTT 用户无权访问 BLACK 用户的表
SQL> SELECT * FROM ALL_TAB_COMMENTS WHERE OWNER='BLACK';
no rows selected
```

### （3）DBA_TAB_COMMENTS

数据字典结构：

```java
SQL> DESC DBA_TAB_COMMENTS;
 Name										     Null?    Type
 ---------------------------------------------------------------------------------
 OWNER									     NOT NULL VARCHAR2(30)
 TABLE_NAME								     NOT NULL VARCHAR2(30)
 TABLE_TYPE										      VARCHAR2(11)
 COMMENTS										      VARCHAR2(4000)
```

查询WHITE 和 BLACK 用户的表注释信息：

```java
SQL> SELECT * FROM ALL_TAB_COMMENTS WHERE OWNER='WHITE';
OWNER	   TABLE_NAME			  TABLE_TYPE        COMMENTS
--------------------------------------------------------------------
WHITE	   T1				  TABLE
SQL> SELECT * FROM ALL_TAB_COMMENTS WHERE OWNER='BLACK';
OWNER	   TABLE_NAME			  TABLE_TYPE        COMMENTS
----------------------------------------------------------------------------------
BLACK	   T22				  TABLE
```

### 2、使用数据字典 USER_COL_COMMENTS、ALL_COL_COMMENTS、DBA_COL_COMMENTS 查询表中字段的注释信息

### （1）USER_COL_COMMENTS

数据字典结构：

```java
SQL> DESC USER_COL_COMMENTS;
 Name										     Null?    Type
 ---------------------------------------------------------------------------------
 TABLE_NAME								     NOT NULL VARCHAR2(30)
 COLUMN_NAME							     NOT NULL VARCHAR2(30)
 COMMENTS										      VARCHAR2(4000)
```

查询当前用户表中字段的注释信息：

```java
SQL> SELECT TABLE_NAME,COUNT(*) FROM USER_COL_COMMENTS GROUP BY TABLE_NAME;
TABLE_NAME	       COUNT(*)
-------------------- ----------
EMP666			      8
SYS_TEMP_FBT		      5
TX002			      2
DEPT			      3
EMP010			      8
TS_001			      1
EMP888			      8
EMP			      8
BONUS			      4
E01			      4
TX001			      2
EMP_BAK 		      3
SALGRADE		      3
13 rows selected.
SQL> SELECT * FROM USER_COL_COMMENTS WHERE TABLE_NAME='EMP';
TABLE_NAME	     COLUMN_NAME     COMMENTS
-------------------- --------------- --------------------------------------------
EMP		     EMPNO
EMP		     ENAME
EMP		     JOB
EMP		     MGR
EMP		     HIREDATE
EMP		     SAL
EMP		     COMM
EMP		     DEPTNO
8 rows selected.
```

### （2）ALL_COL_COMMENTS

数据字典结构：

```java
SQL> DESC ALL_COL_COMMENTS;
 Name										     Null?    Type
 -----------------------------------------------------------------------------------
 OWNER									     NOT NULL VARCHAR2(30)
 TABLE_NAME								     NOT NULL VARCHAR2(30)
 COLUMN_NAME							     NOT NULL VARCHAR2(30)
 COMMENTS										      VARCHAR2(4000)
```

查询用户 WHITE 和 BLACK 拥有的表中字段的注释信息：

```java
SQL> SELECT * FROM ALL_COL_COMMENTS WHERE OWNER='WHITE'; 
OWNER			       TABLE_NAME	    COLUMN_NAME        COMMENTS
----------------------------------------------------------------------------
WHITE			       T1		    X
WHITE			       T1		    NAME
--查询 BLACK 用户的表注释信息，SCOTT 用户无权访问 BLACK 用户的表
SQL> SELECT * FROM ALL_COL_COMMENTS WHERE OWNER='BLACK'; 
no rows selected
```

### （3）DBA_COL_COMMENTS

数据字典结构：

```java
SQL> DESC DBA_COL_COMMENTS;
 Name										     Null?    Type
 ----------------------------------------------------------------------------------- --
 OWNER									     NOT NULL VARCHAR2(30)
 TABLE_NAME								     NOT NULL VARCHAR2(30)
 COLUMN_NAME							     NOT NULL VARCHAR2(30)
 COMMENTS										      VARCHAR2(4000)
```

查询用户 WHITE 和 BLACK 拥有的表中字段的注释信息：

```java
SQL> SELECT * FROM DBA_COL_COMMENTS WHERE OWNER='WHITE'; 
OWNER	   TABLE_NAME			  COLUMN_NAME     COMMENTS
--------------------------------------------------------------------------------
WHITE	   T1				  X
WHITE	   T1				  NAME
SQL> SELECT * FROM DBA_COL_COMMENTS WHERE OWNER='BLACK'; 
OWNER	   TABLE_NAME			  COLUMN_NAME        COMMENTS
--------------------------------------------------------------------------------
BLACK	   T22				  X
BLACK	   T22				  NAME
```
