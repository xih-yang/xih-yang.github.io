# 29、Oracle 教程 - Oracle 用户管理有关的数据字典
- 来源：https://ddkk.com/zhuanlan/db/oracle/1/29.html
- 分类：缓存数据库
- 分组：教程目录
Oracle 和用户管理相关的数据字典主要有三个：DBA_USERS、USER_USERS、ALL_USERS

## 一、DBA_USERS

该数据字典用于查询 Oracle 的所有用户信息，该数据字典的结构如下：

```java
SQL> desc DBA_USERS;
 Name										     Null?    Type
-------------------------------------------------------------------- -------- --------
 USERNAME									     NOT NULL VARCHAR2(30)
 USER_ID									     NOT NULL NUMBER
 PASSWORD							 			          VARCHAR2(30)
 ACCOUNT_STATUS 							      NOT NULL VARCHAR2(32)
 LOCK_DATE										          DATE
 EXPIRY_DATE										      DATE
 DEFAULT_TABLESPACE							      NOT NULL VARCHAR2(30)
 TEMPORARY_TABLESPACE							  NOT NULL VARCHAR2(30)
 CREATED									     NOT NULL DATE
 PROFILE									     NOT NULL VARCHAR2(30)
 INITIAL_RSRC_CONSUMER_GROUP						       VARCHAR2(30)
 EXTERNAL_NAME										      VARCHAR2(4000)
 PASSWORD_VERSIONS									      VARCHAR2(8)
 EDITIONS_ENABLED									      VARCHAR2(1)
 AUTHENTICATION_TYPE									  VARCHAR2(8)
```

### 1、查看 Oracle 用户的个数

```java
SQL> SELECT COUNT(*) FROM DBA_USERS;
  COUNT(*)
----------
	36
```

### 2、查询所有用户的详细信息：用户名，创建时间，资源文件等

```java
SQL> SELECT USER_ID, USERNAME, CREATED, DEFAULT_TABLESPACE, PROFILE
     FROM DBA_USERS;
   USER_ID USERNAME			  CREATED   DEFAULT_TABLESPACE		   PROFILE
---------- ------------------------------ --------- ------------------------------ -
	95 WHITE	    		      27-AUG-21 TS001			   DEFAULT
	94 BLACK		        	  27-AUG-21 TS001			   DEFAULT
	92 TOM	    		    	  27-AUG-21 USERS			   TOM_PROFILE
	87 HMJ		    		      10-AUG-21 USERS			   DEFAULT
	99 BOSS 		    	      27-AUG-21 USERS			   DEFAULT
	83 SCOTT			          24-AUG-13 USERS			   DEFAULT
	66 SPATIAL_WFS_ADMIN_USR	   24-AUG-13 USERS			   DEFAULT
	69 SPATIAL_CSW_ADMIN_USR	   24-AUG-13 USERS			   DEFAULT
	75 APEX_PUBLIC_USER		       24-AUG-13 USERS			   DEFAULT
	14 DIP	        			  24-AUG-13 USERS			   DEFAULT
	64 MDDATA		        	  24-AUG-13 USERS			   DEFAULT
2147483638 XS$NULL		 	       24-AUG-13 USERS			   DEFAULT
	21 ORACLE_OCM			      24-AUG-13 USERS			   DEFAULT
	30 DBSNMP	        		  24-AUG-13 SYSAUX			   MONITORING_PROFILE
	60 OLAPSYS        			  24-AUG-13 SYSAUX			   DEFAULT
	56 SI_INFORMTN_SCHEMA		  24-AUG-13 SYSAUX			   DEFAULT
	78 OWBSYS		        	  24-AUG-13 SYSAUX			   DEFAULT
	55 ORDPLUGINS			      24-AUG-13 SYSAUX			   DEFAULT
	45 XDB	        			  24-AUG-13 SYSAUX			   DEFAULT
	71 SYSMAN		        	  24-AUG-13 SYSAUX			   DEFAULT
	46 ANONYMOUS			      24-AUG-13 SYSAUX			   DEFAULT
	43 CTXSYS	        		  24-AUG-13 SYSAUX			   DEFAULT
	54 ORDDATA			          24-AUG-13 SYSAUX			   DEFAULT
	79 OWBSYS_AUDIT     		  24-AUG-13 SYSAUX			   DEFAULT
	77 APEX_030200		    	  24-AUG-13 SYSAUX			   DEFAULT
	31 APPQOSSYS			      24-AUG-13 SYSAUX			   DEFAULT
	32 WMSYS        			  24-AUG-13 SYSAUX			   DEFAULT
	42 EXFSYS		        	  24-AUG-13 SYSAUX			   DEFAULT
	53 ORDSYS        			  24-AUG-13 SYSAUX			   DEFAULT
	57 MDSYS		        	  24-AUG-13 SYSAUX			   DEFAULT
	74 FLOWS_FILES			      24-AUG-13 SYSAUX			   DEFAULT
	 5 SYSTEM	        		  24-AUG-13 SYSTEM			   DEFAULT
	 0 SYS				          24-AUG-13 SYSTEM			   DEFAULT
	73 MGMT_VIEW    			  24-AUG-13 SYSTEM			   DEFAULT
	 9 OUTLN	        		  24-AUG-13 SYSTEM			   DEFAULT
	88 JOHN 			          13-AUG-21 USERS			   DEFAULT
36 rows selected.
```

### 3、查询 SCOTT 用户的信息

```java
SQL> SELECT USER_ID, USERNAME, ACCOUNT_STATUS, EXPIRY_DATE, DEFAULT_TABLESPACE 
     FROM DBA_USERS WHERE USERNAME='SCOTT';
   USER_ID USERNAME		  ACCOUNT_STATUS	   EXPIRY_DA     DEFAULT_TABLESPACE
--------------------- -------------------------------- --------- ------------------------------
	83 SCOTT			  OPEN				   18-OCT-21       USERS
```

## 二、USER_USERS

该数据字典用来查询当前用户的信息，数据字典表的结构如下：

```java
SQL> conn scott/tiger
Connected.
SQL> DESC USER_USERS;
 Name										     Null?    Type
------------------------------------------------------------ -------- -------------
 USERNAME									     NOT NULL VARCHAR2(30)
 USER_ID									     NOT NULL NUMBER
 ACCOUNT_STATUS 							      NOT NULL VARCHAR2(32)
 LOCK_DATE										          DATE
 EXPIRY_DATE										      DATE
 DEFAULT_TABLESPACE								  NOT NULL VARCHAR2(30)
 TEMPORARY_TABLESPACE							  NOT NULL VARCHAR2(30)
 CREATED									     NOT NULL DATE
 INITIAL_RSRC_CONSUMER_GROUP						       VARCHAR2(30)
 EXTERNAL_NAME										      VARCHAR2(4000)
```

串当前用户的信息：

```java
SQL> SELECT USER_ID, USERNAME, EXPIRY_DATE, DEFAULT_TABLESPACE FROM USER_USERS;
   USER_ID USERNAME			  EXPIRY_DA DEFAULT_TABLESPACE
---------- ------------------------------ --------- ------------------------------
	83 SCOTT		    	  18-OCT-21 USERS
```

可以使用动态视图 V S E E S I O N 和 G V SEESION 和 GV SEESION和GVSESSION 查看用户的会话信息：

```java
SQL> SELECT USER#, USERNAME, SADDR, SID, SERIAL# FROM V$SESSION WHERE USERNAME='SCOTT';
     USER# USERNAME			  SADDR 		  SID	 SERIAL#
---------- ------------------------------ ---------------- ---------- ----------
	83 SCOTT			  00000000917A1928	   58	     275
SQL> SELECT USER#, USERNAME, SADDR, SID, SERIAL# FROM GV$SESSION WHERE USERNAME='SCOTT';
     USER# USERNAME			  SADDR 		  SID	 SERIAL#
---------- ------------------------------ ---------------- ---------- ----------
	83 SCOTT			  00000000917A1928	   58	     275
```

## 三、ALL_USERS

该数据字典用来查询所有用户的信息，但是能够查询的信息比 DBA_USERS 要少得多，数据字典表的结构如下：

```java
SQL> DESC ALL_USERS;
 Name										     Null?    Type
------------------------ -------- ---------------------------------------------------
 USERNAME									     NOT NULL VARCHAR2(30)
 USER_ID									     NOT NULL NUMBER
 CREATED									     NOT NULL DATE
```

查询所有用户的用户 ID，用户名和创建时间：

```java
SQL> SELECT * FROM ALL_USERS;
USERNAME			  USER_ID CREATED
------------------------------ ---------- ---------
BOSS				       99 27-AUG-21
WHITE				       95 27-AUG-21
BLACK				       94 27-AUG-21
HMJ				           87 10-AUG-21
TOM				           92 27-AUG-21
SCOTT				       83 24-AUG-13
OWBSYS_AUDIT			   79 24-AUG-13
OWBSYS				       78 24-AUG-13
APEX_030200			       77 24-AUG-13
APEX_PUBLIC_USER		       75 24-AUG-13
FLOWS_FILES			       74 24-AUG-13
MGMT_VIEW			       73 24-AUG-13
SYSMAN				       71 24-AUG-13
SPATIAL_CSW_ADMIN_USR       69 24-AUG-13
SPATIAL_WFS_ADMIN_USR       66 24-AUG-13
MDDATA				       64 24-AUG-13
OLAPSYS 			       60 24-AUG-13
MDSYS				       57 24-AUG-13
SI_INFORMTN_SCHEMA	        56 24-AUG-13
ORDPLUGINS			       55 24-AUG-13
ORDDATA 			       54 24-AUG-13
ORDSYS				       53 24-AUG-13
ANONYMOUS			       46 24-AUG-13
XDB				           45 24-AUG-13
CTXSYS				       43 24-AUG-13
EXFSYS				       42 24-AUG-13
XS$NULL 		           2147483638 24-AUG-13
WMSYS				       32 24-AUG-13
APPQOSSYS			       31 24-AUG-13
DBSNMP				       30 24-AUG-13
ORACLE_OCM			       21 24-AUG-13
DIP				           14 24-AUG-13
OUTLN					   9 24-AUG-13
SYSTEM					   5 24-AUG-13
SYS		        		   0 24-AUG-13
JOHN				       88 13-AUG-21
36 rows selected.
```
