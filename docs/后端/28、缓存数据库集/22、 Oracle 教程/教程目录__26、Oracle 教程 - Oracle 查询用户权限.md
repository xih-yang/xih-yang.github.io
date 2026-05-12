# 26、Oracle 教程 - Oracle 查询用户权限
- 来源：https://ddkk.com/zhuanlan/db/oracle/1/26.html
- 分类：缓存数据库
- 分组：教程目录
ORACLE 的数据字典分为：USER，ALL 和 DBA。

USER_*：有关用户所拥有的对象信息，即用户自己创建的对象信息。

ALL_*：有关用户可以访问的对象的信息，即用户自己创建的对象的信息加上其他用户创建的对象但该用户有权访问的信息。

DBA_*：整个数据库中对象的信息。

与用户权限相关的数据字典表有：

```java
----------------------- 系统权限 ----------------------------
--所有用户和角色所拥有的系统权限，使用 where grantee='*' 查询指定用户或角色所拥有的系统权限
DBA_SYS_PRIVS
--当前用户所拥有的系统权限
USER_SYS_PRIVS  
--某个角色所拥有的系统权限
ROLE_SYS_PRIVS  
----------------------- 对象权限 ----------------------------
--所有用户的对象权限
DBA_TAB_PRIVS
--所有用户的对象权限
ALL_TAB_PRIVS
--当前用户的对象权限
USER_TAB_PRIVS
--角色所拥有的对象权限
ROLE_TAB_PRIVS
----------------------- 当前会话的权限 ----------------------------
--当前用户所拥有的系统权限和对象权限
SESSION_PRIVS
--当前用户被激活的角色
SESSION_ROLES
----------------------- 角色信息 ----------------------------
DBA_ROLES        --所有角色
DBA_ROLE_PRIVS   --授予用户的角色
```

## 一、查看用户信息

### 1、查看系统中的所有用户

```java
select * from dba_user;
SQL> select username, created, profile from dba_users;
USERNAME		            CREATED	 PROFILE
------------------------------ --------- ------------------------------
BLACK		    	       27-AUG-21 DEFAULT
WHITE			           27-AUG-21 DEFAULT
SCOTT			           24-AUG-13 DEFAULT
BOSS			           27-AUG-21 DEFAULT
HMJ			               10-AUG-21 DEFAULT
TOM			               27-AUG-21 TOM_PROFILE
ORACLE_OCM		           24-AUG-13 DEFAULT
XS$NULL 		           24-AUG-13 DEFAULT
MDDATA			           24-AUG-13 DEFAULT
DIP			               24-AUG-13 DEFAULT
APEX_PUBLIC_USER	       24-AUG-13 DEFAULT
SPATIAL_CSW_ADMIN_USR	   24-AUG-13 DEFAULT
SPATIAL_WFS_ADMIN_USR	   24-AUG-13 DEFAULT
FLOWS_FILES		           24-AUG-13 DEFAULT
MDSYS	    		       24-AUG-13 DEFAULT
ORDSYS		    	       24-AUG-13 DEFAULT
EXFSYS			           24-AUG-13 DEFAULT
DBSNMP			           24-AUG-13 MONITORING_PROFILE
WMSYS			           24-AUG-13 DEFAULT
APPQOSSYS	    	       24-AUG-13 DEFAULT
APEX_030200		           24-AUG-13 DEFAULT
OWBSYS_AUDIT		       24-AUG-13 DEFAULT
ORDDATA 		           24-AUG-13 DEFAULT
CTXSYS		    	       24-AUG-13 DEFAULT
ANONYMOUS		           24-AUG-13 DEFAULT
SYSMAN			           24-AUG-13 DEFAULT
XDB			               24-AUG-13 DEFAULT
ORDPLUGINS		           24-AUG-13 DEFAULT
OWBSYS			           24-AUG-13 DEFAULT
SI_INFORMTN_SCHEMA	       24-AUG-13 DEFAULT
OLAPSYS 		           24-AUG-13 DEFAULT
SYS	        		       24-AUG-13 DEFAULT
SYSTEM		    	       24-AUG-13 DEFAULT
OUTLN			           24-AUG-13 DEFAULT
MGMT_VIEW		           24-AUG-13 DEFAULT
JOHN			           13-AUG-21 DEFAULT
36 rows selected.
```

### 2、查看所有用户（all_users 的信息要比 dba_users 少）

```java
SQL> select * from all_users;
USERNAME			       USER_ID CREATED
------------------------------ ---------- ---------
BOSS			    	       99 27-AUG-21
WHITE				           95 27-AUG-21
BLACK				           94 27-AUG-21
HMJ			        	       87 10-AUG-21
TOM				               92 27-AUG-21
SCOTT				           83 24-AUG-13
OWBSYS_AUDIT			       79 24-AUG-13
OWBSYS			    	       78 24-AUG-13
APEX_030200			           77 24-AUG-13
APEX_PUBLIC_USER		       75 24-AUG-13
FLOWS_FILES			           74 24-AUG-13
MGMT_VIEW			           73 24-AUG-13
SYSMAN				           71 24-AUG-13
SPATIAL_CSW_ADMIN_USR		   69 24-AUG-13
SPATIAL_WFS_ADMIN_USR		   66 24-AUG-13
MDDATA			    	       64 24-AUG-13
OLAPSYS 			           60 24-AUG-13
MDSYS				           57 24-AUG-13
SI_INFORMTN_SCHEMA		       56 24-AUG-13
ORDPLUGINS			           55 24-AUG-13
ORDDATA 			           54 24-AUG-13
ORDSYS			    	       53 24-AUG-13
ANONYMOUS	    		       46 24-AUG-13
XDB				               45 24-AUG-13
CTXSYS	    			       43 24-AUG-13
EXFSYS		    		       42 24-AUG-13
XS$NULL 		               2147483638 24-AUG-13
WMSYS				           32 24-AUG-13
APPQOSSYS	    		       31 24-AUG-13
DBSNMP			    	       30 24-AUG-13
ORACLE_OCM			           21 24-AUG-13
DIP				               14 24-AUG-13
OUTLN	        				9 24-AUG-13
SYSTEM			        		5 24-AUG-13
SYS		            			0 24-AUG-13
JOHN				           88 13-AUG-21
36 rows selected.
```

### 3、查看当前用户信息

```java
SQL> show user;
USER is "SYS"
SQL> select username, created from user_users;
USERNAME		       CREATED
------------------------------ ---------
SYS			         24-AUG-13
SQL> show user;
USER is "SCOTT"
SQL> select username,created from user_users;
USERNAME		       CREATED
------------------------------ ---------
SCOTT			       24-AUG-13
```

## 二、查看用户或角色的系统权限

### 1、查询所有用户和角色所拥有的系统权限（DBA_SYS_PRIVS）

```java
--查看 RESOURCE 所拥有的系统权限
SQL> select * from DBA_SYS_PRIVS where grantee='RESOURCE';
GRANTEE 		       PRIVILEGE	    ADM
------------------------------ -------------------- ---
RESOURCE		       CREATE TRIGGER	    NO
RESOURCE		       CREATE SEQUENCE	    NO
RESOURCE		       CREATE TYPE	        NO
RESOURCE		       CREATE PROCEDURE     NO
RESOURCE		       CREATE CLUSTER	    NO
RESOURCE		       CREATE OPERATOR	    NO
RESOURCE		       CREATE INDEXTYPE     NO
RESOURCE		       CREATE TABLE	        NO
8 rows selected.
--查看角色 TEACHER 所拥有的系统权限
SQL> select * from DBA_SYS_PRIVS where grantee='TEACHER';
GRANTEE 		       PRIVILEGE	    ADM
------------------------------ -------------------- ---
TEACHER 		       CREATE ANY TABLE     NO
TEACHER 		       CREATE PROCEDURE     NO
```

### 2、查询当前用户拥有的系统权限（USER_SYS_PRIVS）

```java
SQL> show user
USER is "SYS"
SQL> SELECT * FROM USER_SYS_PRIVS;
USERNAME	     PRIVILEGE							  ADM
-------------------- ------------------------------------------------------------ ---
SYS		     UPDATE ANY CUBE BUILD PROCESS			  NO
SYS		     CREATE MINING MODEL					  NO
SYS		     DROP ANY ASSEMBLY						  NO
SYS		     DROP ANY EDITION						  NO
SYS		     CREATE EXTERNAL JOB					  NO
SYS		     MANAGE FILE GROUP						  NO
SYS		     ADMINISTER SQL TUNING SET				  NO
SYS		     MANAGE SCHEDULER						  NO
.............
SQL> show user;
USER is "SCOTT"
SQL> SELECT * FROM USER_SYS_PRIVS;
USERNAME		       PRIVILEGE				ADM
------------------------------ ---------------------------------------- ---
SCOTT			       UNLIMITED TABLESPACE			NO
```

### 3、查询角色所拥有的系统权限（ROLE_SYS_PRIVS）

```java
--查询 RESOURCE 所拥有的系统权限
SQL> select * from ROLE_SYS_PRIVS where role='RESOURCE';
ROLE			       PRIVILEGE						    ADM
------------------------------ ------------------------------------------------------------ ---
RESOURCE		       CREATE TRIGGER						    NO
RESOURCE		       CREATE SEQUENCE						    NO
RESOURCE		       CREATE TYPE						    NO
RESOURCE		       CREATE PROCEDURE 					    NO
RESOURCE		       CREATE CLUSTER						    NO
RESOURCE		       CREATE OPERATOR						    NO
RESOURCE		       CREATE INDEXTYPE 					    NO
RESOURCE		       CREATE TABLE						    NO
8 rows selected.
--查询  TEACHER 所拥有的系统权限
SQL> select * from ROLE_SYS_PRIVS where role='TEACHER';
ROLE			       PRIVILEGE						    ADM
------------------------------ ------------------------------------------------------------ ---
TEACHER 		       CREATE ANY TABLE 					    NO
TEACHER 		       CREATE PROCEDURE 					    NO
```

对于普通用户来说，ROLE_SYS_PRIVS 包含当前用户的角色所拥有的系统权限：

```java
SQL> show user;
USER is "SCOTT"
SQL> select * from ROLE_SYS_PRIVS;
ROLE			       PRIVILEGE				ADM
------------------------------ ---------------------------------------- ---
RESOURCE		       CREATE SEQUENCE				NO
RESOURCE		       CREATE TRIGGER				NO
RESOURCE		       CREATE CLUSTER				NO
RESOURCE		       CREATE PROCEDURE 			NO
RESOURCE		       CREATE TYPE			    	NO
CONNECT 		       CREATE SESSION				NO
RESOURCE		       CREATE OPERATOR				NO
RESOURCE		       CREATE TABLE		    		NO
RESOURCE		       CREATE INDEXTYPE 			NO
9 rows selected.
SQL> conn white/White123456
Connected.
SQL> select * from ROLE_SYS_PRIVS;
ROLE			       PRIVILEGE				ADM
------------------------------ ---------------------------------------- ---
TEACHER 		       CREATE ANY TABLE 			NO
RESOURCE		       CREATE SEQUENCE				NO
RESOURCE		       CREATE TRIGGER				NO
TEACHER 		       CREATE PROCEDURE 			NO
RESOURCE		       CREATE CLUSTER				NO
RESOURCE		       CREATE PROCEDURE 			NO
RESOURCE		       CREATE TYPE				NO
CONNECT 		       CREATE SESSION				NO
RESOURCE		       CREATE OPERATOR				NO
RESOURCE		       CREATE TABLE				NO
RESOURCE		       CREATE INDEXTYPE 			NO
11 rows selected.
```

## 三、查看用户或角色的对象权限

### 1、查看所有用户或角色的对象权限（DBA_TAB_PRIVS）

```java
-- 查询用户 WHITE 所拥有的的对象权限 
SQL> select grantee, owner, table_name, privilege 
     from DBA_TAB_PRIVS where OWNER='WHITE';
GRANTEE 		       OWNER		    TABLE_NAME		 PRIVILEGE
------------------------------ -------------------- -------------------- --
PUBLIC			       WHITE		    T1			 SELECT
```

### 2、查看所有用户或角色的对象权限（ALL_TAB_PRIVS）

```java
-- 查询用户 WHITE 所拥有的的对象权限 
SQL> SELECT GRANTEE, TABLE_SCHEMA, TABLE_NAME, PRIVILEGE 
     FROM ALL_TAB_PRIVS WHERE TABLE_SCHEMA ='WHITE';
GRANTEE 		       TABLE_SCHEMA		      TABLE_NAME	   PRIVILEGE
------------------------------ ------------------------------ -------------------- ------------
PUBLIC			       WHITE			      T1		   SELECT
```

### 3、查看所有用户或角色的对象权限（USER_TAB_PRIVS）

```java
SQL> show user;
USER is "WHITE"
SQL> select grantee, owner, table_name, privilege 
     from USER_TAB_PRIVS;
GRANTEE 		       OWNER        TABLE_NAME		       PRIVILEGE
------------------------------ ----------------------------------------
PUBLIC			       WHITE           T1			       SELECT
```

### 4、查询角色所拥有的对象权限（ROLE_TAB_PRIVS）

```java
SQL> select role, owner, table_name, privilege 
     from ROLE_TAB_PRIVS 
     where OWNER='SYS' AND ROWNUM<10;
ROLE			       OWNER		    TABLE_NAME		 PRIVILEGE
------------------ -------------------- --------------------------------------
DBA			       SYS		    AW$ 		 DEBUG
DBA			       SYS		    AW$ 		 SELECT
DBA			       SYS		    PS$ 		 DEBUG
DBA			       SYS		    PS$ 		 SELECT
DBA			       SYS		    AWSEQ$		 ALTER
DBA			       SYS		    AWSEQ$		 SELECT
DBA			       SYS		    AW_OBJ$		 DEBUG
DBA			       SYS		    AW_OBJ$		 SELECT
DBA			       SYS		    DBMS_HM		 EXECUTE
9 rows selected.
```

## 四、查看当前会话用户的所有权限

### 1、当前用户所拥有的系统权限和对象权限（SESSION_PRIVS）

```java
SQL> show user
USER is "SYS"
SQL> select * from SESSION_PRIVS where rownum<10;
PRIVILEGE
------------------------------------------------------------
ALTER SYSTEM
AUDIT SYSTEM
CREATE SESSION
ALTER SESSION
RESTRICTED SESSION
CREATE TABLESPACE
ALTER TABLESPACE
MANAGE TABLESPACE
DROP TABLESPACE
9 rows selected.
SQL> show user;
USER is "WHITE"
SQL> select * from SESSION_PRIVS;
PRIVILEGE
----------------------------------------
CREATE SESSION
UNLIMITED TABLESPACE
CREATE TABLE
CREATE ANY TABLE
CREATE CLUSTER
CREATE SEQUENCE
CREATE PROCEDURE
CREATE TRIGGER
CREATE TYPE
CREATE OPERATOR
CREATE INDEXTYPE
11 rows selected.
```

### 2、查询当前用户被激活的角色（SESSION_ROLES）

```java
SQL> show user
USER is "WHITE"
SQL> select * from SESSION_ROLES;
ROLE
------------------------------
CONNECT
RESOURCE
TEACHER
SQL> show user
USER is "SYS"
SQL> select * from SESSION_ROLES;
no rows selected
```

## 五、查询角色信息

### 1、查询数据库中的所有角色（DBA_ROLES）

```java
SQL> select * from DBA_ROLES;
ROLE			       PASSWORD AUTHENTICAT
------------------------------ -------- -----------
CONNECT 		               NO	NONE
RESOURCE		               NO	NONE
DBA			                   NO	NONE
SELECT_CATALOG_ROLE	           NO	NONE
EXECUTE_CATALOG_ROLE	       NO	NONE
DELETE_CATALOG_ROLE	           NO	NONE
EXP_FULL_DATABASE	           NO	NONE
IMP_FULL_DATABASE	           NO	NONE
LOGSTDBY_ADMINISTRATOR    	   NO	NONE
DBFS_ROLE		               NO	NONE
AQ_ADMINISTRATOR_ROLE    	   NO	NONE
AQ_USER_ROLE		           NO	NONE
DATAPUMP_EXP_FULL_DATABASE     NO	NONE
DATAPUMP_IMP_FULL_DATABASE     NO	NONE
ADM_PARALLEL_EXECUTE_TASK      NO	NONE
GATHER_SYSTEM_STATISTICS       NO	NONE
JAVA_DEPLOY		               NO	NONE
RECOVERY_CATALOG_OWNER	       NO	NONE
SCHEDULER_ADMIN 	           NO	NONE
HS_ADMIN_SELECT_ROLE	       NO	NONE
HS_ADMIN_EXECUTE_ROLE	       NO	NONE
HS_ADMIN_ROLE		           NO	NONE
GLOBAL_AQ_USER_ROLE	           GLOBAL	GLOBAL
OEM_ADVISOR	    	           NO	NONE
OEM_MONITOR	        	       NO	NONE
WM_ADMIN_ROLE		           NO	NONE
JAVAUSERPRIV		           NO	NONE
JAVAIDPRIV	    	           NO	NONE
JAVASYSPRIV		               NO	NONE
JAVADEBUGPRIV		           NO	NONE
EJBCLIENT	    	           NO	NONE
JMXSERVER	    	           NO	NONE
JAVA_ADMIN		               NO	NONE
CTXAPP			               NO	NONE
XDBADMIN		               NO	NONE
XDB_SET_INVOKER     	       NO	NONE
AUTHENTICATEDUSER	           NO	NONE
XDB_WEBSERVICES 	           NO	NONE
XDB_WEBSERVICES_WITH_PUBLIC    NO	NONE
XDB_WEBSERVICES_OVER_HTTP      NO	NONE
OLAP_DBA	        	       NO	NONE
ORDADMIN		               NO	NONE
OLAP_XS_ADMIN		           NO	NONE
OWB_USER		               NO	NONE
CWM_USER		               NO	NONE
OLAP_USER		               NO	NONE
SPATIAL_WFS_ADMIN	           NO	NONE
WFS_USR_ROLE	    	       NO	NONE
SPATIAL_CSW_ADMIN	           NO	NONE
CSW_USR_ROLE		           NO	NONE
MGMT_USER		               NO	NONE
APEX_ADMINISTRATOR_ROLE        NO	NONE
OWB$CLIENT		               YES	PASSWORD
OWB_DESIGNCENTER_VIEW	       NO	NONE
TEACHER 		               NO	NONE
CLASS_MANAGER	    	       YES	PASSWORD
MANAGER 		               NO	NONE
57 rows selected.
```

### 2、查询授予某个用户的角色（DBA_ROLE_PRIVS）

```java
SQL> select * from DBA_ROLE_PRIVS where grantee='SCOTT';
GRANTEE 		       GRANTED_ROLE		      ADM DEF
------------------------------ ------------------------------ --- ---
SCOTT			       RESOURCE 		      NO  YES
SCOTT			       CONNECT			      NO  YES
SQL> select * from DBA_ROLE_PRIVS where grantee='WHITE';
GRANTEE 		       GRANTED_ROLE		      ADM DEF
------------------------------ ------------------------------ --- ---
WHITE			       TEACHER			      NO  YES
WHITE			       CONNECT			      YES YES
WHITE			       RESOURCE 		      NO  YES
```
