# 27、Oracle 教程 - Oracle 数据字典概述
- 来源：https://ddkk.com/zhuanlan/db/oracle/1/27.html
- 分类：缓存数据库
- 分组：教程目录
数据字典是 Oracle 存放数据库信息的地方，用来描述数据。比如一个表的创建者信息，创建时间信息，所属表空间信息，用户访问权限信息等。数据字典系统表保存在 system 表空间，查询所有数据字典可使用以下命令：

```java
SQL> select * from dictionary;
TABLE_NAME		       COMMENTS
------------------------------ ---------------------------------------------------
.............
V$DIAG_VINCIDENT	       Synonym for V_$DIAG_VINCIDENT
V$DIAG_VINC_METER_INFO	       Synonym for V_$DIAG_VINC_METER_INFO
V$DIAG_VIPS_FILE_METADATA      Synonym for V_$DIAG_VIPS_FILE_METADATA
V$DIAG_VIPS_PKG_FILE	       Synonym for V_$DIAG_VIPS_PKG_FILE
V$DIAG_VIPS_PACKAGE_FILE       Synonym for V_$DIAG_VIPS_PACKAGE_FILE
V$DIAG_VIPS_PACKAGE_HISTORY    Synonym for V_$DIAG_VIPS_PACKAGE_HISTORY
V$DIAG_VIPS_FILE_COPY_LOG      Synonym for V_$DIAG_VIPS_FILE_COPY_LOG
V$DIAG_VIPS_PACKAGE_SIZE       Synonym for V_$DIAG_VIPS_PACKAGE_SIZE
...................
2667 rows selected.
```

## 一、数据字典的分类

Oracle 数据字典有静态和动态之分。静态数据字典在用户访问数据字典时不发生改变，动态数据字典依赖数据库运行状态、反映数据库运行的一些内在信息，所以在访问这类数据字典时往往不是一成不变的。

### 1、 静态数据字典

静态数据字典是由表和视图组成，数据字典中的表是不能直接被访问的，但是可以访问数据字典中的视图。静态数据字典中的视图分为三类，分别由三个前缀够成： dba_*、 all_*、user_*。

（1）dba_*：存储数据库中所有对象的信息，一般使用 sys 账号访问。

```java
SQL> show user;
USER is "SYS"
SQL> select owner, table_name, tablespace_name from dba_tables 
     where owner IN ('SCOTT','BLACK','WHITE');
OWNER			       TABLE_NAME		      TABLESPACE_NAME
------------------------------ ------------------------------ ------------------------------
SCOTT			       DEPT			          USERS
SCOTT			       EMP			          USERS
SCOTT			       SALGRADE 		      USERS
SCOTT			       EMP_BAK			      USERS
SCOTT			       TX001			      SYSTEM
SCOTT			       TS_001			      USERS
SCOTT			       E01			          USERS
SCOTT			       TX002			      TS001
SCOTT			       EMP888			      TS003
SCOTT			       EMP010			      USERS
SCOTT			       EMP666			      TS001
WHITE			       T1			          TS001   --用户 white 的表
BLACK			       T22			          TS001   --用户 black 的表
SCOTT			       SYS_TEMP_FBT
SCOTT			       BONUS			      USERS
15 rows selected.
```

（2）user_*：存储当前用户所拥有的对象的信息（该用户模式下的所有对象）。

```java
SQL> show user
USER is "SYS"
--给用户 white 授予对象权限，使其可以访问 scott.emp 和 scott.dept 表
SQL> grant select on scott.emp to white;
Grant succeeded.
SQL> grant select on scott.dept to white;
Grant succeeded.
-- white 用户建立连接
SQL> connect white/White123456
Connected.
--查看当前用户的信息
SQL> select username, account_status, 
     default_tablespace, temporary_tablespace 
     from user_users;
USERNAME	   ACCOUNT_STATUS     DEFAULT_TABLESPACE	 TEMPORARY_TABLESPACE
------------------------------ ------------------------------------------------ --------
WHITE	        OPEN                  TS001			       TEMP
-- 当前 white 用户只拥有一张表
SQL> select table_name, tablespace_name from user_tables;
TABLE_NAME		       TABLESPACE_NAME
------------------------------ ------------------------------
T1			       TS001
```

（3）all_*：存储当前用户能够访问的所有对象的信息（并不需要拥有该对象，只需要具有访问该对象的权限即可）。

```java
SQL> show user;
USER is "WHITE"
--用户 white 可以访问的表一共有 106 张
SQL> select table_name, tablespace_name from all_tables;
TABLE_NAME		       TABLESPACE_NAME
------------------------------ ------------------------------
DUAL			       SYSTEM
......
DEPT			       USERS
EMP			           USERS
T1			           TS001
........
106 rows selected.
```

由于数据字典视图是由 SYS（系统用户）所拥有的，默认情况下只有 SYS 和拥有 DBA 系统权限的用户可以看到所有的视图。没有 DBA 权限的用户只能看到 user_* 和 all_* 开头的视图。

### 2、动态性能视图

动态性能视图是以 GB$ 或 V$ 开头的视图，记录了数据库运行时的信息和统计数据。

```java
--查看 scott 用户连接：scott 用户登录到1号节点
SQL> select saddr, inst_id, sid, serial#, username from gv$session where username='SCOTT';
SADDR		    INST_ID	   SID	  SERIAL# USERNAME
---------------- ---------- ---------- ---------- ------------------------------
000000009178F3E8	  1	    64	       55 SCOTT
--查看数据库包含的数据文件名称
SQL> select name from v$datafile;
NAME
----------------------------------------------------------------------------------------
+DATA/orcl/datafile/system.256.1070471889
+DATA/orcl/datafile/sysaux.257.1070471889
+DATA/orcl/datafile/undotbs1.258.1070471891
+DATA/orcl/datafile/users.259.1070471891
+DATA/orcl/datafile/undotbs2.264.1070472143
+DATA/orcl/datafile/ts001.dbf
+DATA/orcl/datafile/undotbs11
+DATA/orcl/datafile/undo_archive.dbf
+DATA/orcl/datafile/ts003.dbf
9 rows selected.
```

## 二、查看各种类型的数据字典

### 1、以 V$ 开头的动态视图

### （1）查看以 V$ 开头的动态视图的数量

```java
SQL> select count(*) from dictionary where table_name like 'V$%';
  COUNT(*)
----------
       636
```

### （2）查看以 V$ 开头的动态视图

```java
SQL> select TABLE_NAME from dictionary where table_name like 'V$%';
TABLE_NAME
------------------------------
..............
V$TEMP_CACHE_TRANSFER
V$TEMP_EXTENT_MAP
V$TEMP_EXTENT_POOL
V$TEMP_PING
V$TEMP_SPACE_HEADER
.............
636 rows selected.
```

### 2、以 GV$ 开头的动态视图

### （1）查询以 GV$ 开头的动态视图数量

```java
SQL> select count(*) from dictionary where table_name like 'GV$%';
  COUNT(*)
----------
       514
```

### （2）查询以 GV$ 开头的动态视图

```java
SQL> select TABLE_NAME from dictionary where table_name like 'GV$%';
TABLE_NAME
------------------------------
................
GV$RESOURCE
GV$RESOURCE_LIMIT
GV$RESTORE_POINT
GV$RESULT_CACHE_DEPENDENCY
GV$RESULT_CACHE_MEMORY
GV$RESULT_CACHE_OBJECTS
................
514 rows selected.
```

### 3、DBA_开头的数据字典

### （1）DBA_开头的数据字典的数量

```java
SQL> select count(*) from dictionary where table_name like 'DBA%';
  COUNT(*)
----------
       728
```

### （2）DBA_开头的数据字典

```java
SQL> select TABLE_NAME from dictionary where table_name like 'DBA%';
TABLE_NAME
------------------------------
...................
DBA_CUBE_HIER_VIEW_COLUMNS
DBA_CUBE_MEASURES
DBA_CUBE_VIEWS
DBA_CUBE_VIEW_COLUMNS
DBA_DATAPUMP_JOBS
DBA_DATAPUMP_SESSIONS
DBA_DATA_FILES
DBA_DBFS_HS
..................
728 rows selected.
```

### 4、ALL_ 开头的数据字典

### （1）查询以 ALL_ 开头的数据字典的数量

```java
SQL> select COUNT(*) from dictionary where table_name like 'ALL%';
  COUNT(*)
----------
       372
```

### （2）查询以 ALL_ 开头的数据字典

```java
SQL> select TABLE_NAME from dictionary where table_name like 'ALL%';
TABLE_NAME
------------------------------
............
ALL_MVIEW_LOGS
ALL_BASE_TABLE_MVIEWS
ALL_REGISTERED_MVIEWS
ALL_POLICIES
ALL_POLICY_GROUPS
ALL_POLICY_CONTEXTS
............
372 rows selected.
```

### 5、USER_ 开头的数据字典

### （1）查询以 USER_ 开头的数据字典的数量

```java
SQL> select COUNT(*) from dictionary where table_name like 'USER%';
  COUNT(*)
----------
       377
```

### （2）查询以 USER_ 开头的数据字典

```java
SQL> select TABLE_NAME from dictionary where table_name like 'USER%';
TABLE_NAME
------------------------------
..................
USER_ADVISOR_SQLA_TABLES
USER_PARALLEL_EXECUTE_CHUNKS
USER_ADVISOR_SQLW_TABLES
USER_TAB_SUBPARTITIONS
USER_QUEUE_SCHEDULES
.................
377 rows selected.
```

### 6、其他类型的数据字典

### （1）把所有的数据字典导入表 t1，统计各种类型视数据字典的数量

```java
SQL> CREATE TABLE T1 AS SELECT * FROM DICTIONARY;
Table created.
SQL> ALTER TABLE T1 ADD FLAG VARCHAR2(10);
Table altered.
SQL> UPDATE T1 SET FLAG = 'V$' WHERE TABLE_NAME LIKE 'V$%';
636 rows updated.
SQL> UPDATE T1 SET FLAG = 'GV$' WHERE TABLE_NAME LIKE 'GV$%';
514 rows updated.
SQL> UPDATE T1 SET FLAG = 'DBA' WHERE TABLE_NAME LIKE 'DBA%';
728 rows updated.
SQL> UPDATE T1 SET FLAG = 'ALL' WHERE TABLE_NAME LIKE 'ALL%';
372 rows updated.
SQL> UPDATE T1 SET FLAG = 'USER' WHERE TABLE_NAME LIKE 'USER%';
377 rows updated.
SQL> SELECT FLAG, COUNT(*) FROM T1 GROUP BY FLAG;
FLAG	     COUNT(*)
---------- ----------
	  	   40
GV$		   514
DBA		   728
V$		   636
USER	   377
ALL		   372
6 rows selected.
```

### （2）查询其他类型的数据字典

```java
SQL> SELECT TABLE_NAME,COMMENTS FROM T1 WHERE FLAG IS NULL;
TABLE_NAME		       COMMENTS
------------------------------------------------------------------------------------------
AUDIT_ACTIONS		           Description table for audit trail action type codes.  Maps action 
                               type numbers to action type names
COLUMN_PRIVILEGES	           Grants on columns for which the user is the grantor, grantee, owner, 
                               or an enabled role or PUBLIC is the grantee
DATABASE_COMPATIBLE_LEVEL      Database compatible parameter set via init.ora
DBMS_ALERT_INFO
DBMS_LOCK_ALLOCATED
DICTIONARY		               Description of data dictionary tables and views
DICT_COLUMNS	    	       Description of columns in data dictionary tables and views
DUAL
GLOBAL_NAME		               global database name
INDEX_HISTOGRAM 	           statistics on keys with repeat count
INDEX_STATS		               statistics on the b-tree
NLS_DATABASE_PARAMETERS        Permanent NLS parameters of the database
NLS_INSTANCE_PARAMETERS        NLS parameters of the instance
NLS_SESSION_PARAMETERS	       NLS parameters of the user session
RESOURCE_COST		           Cost for each resource
ROLE_ROLE_PRIVS 	           Roles which are granted to roles
ROLE_SYS_PRIVS	    	       System privileges granted to roles
ROLE_TAB_PRIVS		           Table privileges granted to roles
SESSION_PRIVS		           Privileges which the user currently has set
SESSION_ROLES	    	       Roles which the user currently has enabled.
TABLE_PRIVILEGES	           Grants on objects for which the user is the grantor, grantee, owner,
                               or an enabled role or PUBLIC is the grantee CAT Synonym for ER_CATALOG
CHANGE_PROPAGATIONS	           Synonym for ALL_CHANGE_PROPAGATIONS
CHANGE_PROPAGATION_SETS        Synonym for ALL_CHANGE_PROPAGATION_SETS
CHANGE_SETS	        	       Synonym for ALL_CHANGE_SETS
CHANGE_SOURCES		           Synonym for ALL_CHANGE_SOURCES
CHANGE_TABLES		           Synonym for ALL_CHANGE_TABLES
CLIENT_RESULT_CACHE_STATS$     Synonym for CRCSTATS_$
CLU		            	       Synonym for USER_CLUSTERS
COLS	        		       Synonym for USER_TAB_COLUMNS
EXT_TO_OBJ	        	       Synonym for EXT_TO_OBJ_VIEW
LOGSTDBY_UNSUPPORTED_TABLES     Synonym for DBA_LOGSTDBY_UNSUPPORTED_TABLE
DICT	        		       Synonym for DICTIONARY
IND			                   Synonym for USER_INDEXES
RECYCLEBIN	        	       Synonym for USER_RECYCLEBIN
SEQ			                   Synonym for USER_SEQUENCES
SM$VERSION	        	       Synonym for SM_$VERSION
SYN			                   Synonym for USER_SYNONYMS
TABS		        	       Synonym for USER_TABLES
OBJ			                   Synonym for USER_OBJECTS
40 rows selected.
```

## 三、Oracle 常用的数据字典

### 1、静态数据字典

数据字典名称
作用

USER_TABLES
ALL_TABLES
DBA_TABLES
查看系统或某个用户有哪些表

USER_TAB_COLUMNS
ALL_TAB_COLUMNS
DBA_TAB_COLUMNS
查看列的数据类型，字段长度等

USER_OBJECT
ALL_OBJECTS
DBA_OBJECTS
查看数据库对象。包括：DATABASE LINK、FUNCTION、INDEX、PACKAGE、PACKAGE BODY、PROCEDURE、SEQUENCE、SYNONYM、TABLE、TRIGGER、VIEW

USER_SOURCE
ALL_SOURCE
DBA_SOURCE
源码：查看 procedure，function, package, package body 等有SQL语句的源码。trigger除外。

USER_CONSTRAINTS
ALL_CONSTRAINTS
DBA_CONSTRAINTS
查看约束

USER_CONS_COLUMNS
ALL_CONS_COLUMNS
DBA_CONS_COLUMNS
查看约束的列名

USER_INDEXES
ALL_INDEXES
查看索引信息

USER_IND_COLUMNS
ALL_IND_COLUMNS
DBA_IND_COLUMNS
索引列信息

USER_SYNONYMS
ALL_SYNONYMS
DBA_SYNONYMS
查看同义词信息

USER_SEQUENCES
ALL_SEQUENCES
DBA_SEQUENCES
查看序列信息

USER_VIEWS
ALL_VIEWS
DBA_VIEWS
查看视图信息

USER_TRIGGERS
ALL_TRIGGERS
DBA_TRIGGERS
查看触发器信息

USER_TRIGGER_COLS
ALL_TRIGGER_COLS
DBA_TRIGGER_COLS
查看触发器用到的列

DBA_DB_LINKS
查看数据库链

USER_USERS
ALL_USERS
DBA_USERS
查看用户信息

USER_SYS_PRIVS
查看当前用户所拥有的系统权限

ROLE_SYS_PRIVS
查看角色所拥有的系统权限

DBA_SYS_PRIVS
查看所有用户所拥有的系统权限

USER_TAB_PRIVS
查看当前用户所拥有的对象权限

ROLE_TAB_PRIVS
查看角色所拥有的对象权限

DBA_TAB_PRIVS
查看所有用户所拥有的对象权限

DBA_ROLES
查看全数据库的所有角色

USER_ROLE_PRIVS
查看当前用户所拥有的角色权限

ROLE_ROLE_PRIVS
查看角色所拥有的角色权限

DBA_ROLE_PRIVS
查看所有用户所拥有的角色权限

SESSION_PRIVS
查看当前会话相关的权限

### 2、动态数据字典

动态视图名称
作用

V$INSTANCE
数据库实例的基本信息

V$DATAFILE
数据文件的基本信息

DBA_DATA_FILES
dba_data_files

DBA_TEMP_FILES
临时文件的基本信息

V$CONTROLFILE
控制文件的基本信息

V$LOGFILE
日志文件的基本信息

V$DATABASE
数据库的基本信息

LOG_ARCHIVE_DEST
日志文件参数信息

V$PARAMETER
访问参数文件

V$BGPROCESS
后台进程信息

V$ARCHIVED_LOG
归档状态的一些基本信息

V$SGA
关于内存结构的一些信息
