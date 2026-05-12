# 35、Oracle 教程 - Oracle 使用数据字典查看视图的信息
- 来源：https://ddkk.com/zhuanlan/db/oracle/1/35.html
- 分类：缓存数据库
- 分组：教程目录
## 一、使用 USER_VIEWS 查看当前用户所拥有的视图

### 1、数据字典 USER_VIEWS 的结构

```java
SQL> DESC USER_VIEWS;
 Name										     Null?    Type
----------------------------------------------------------------------------------- 
 VIEW_NAME								     NOT NULL VARCHAR2(30)
 TEXT_LENGTH									      NUMBER
 TEXT											      LONG
 TYPE_TEXT_LENGTH								      NUMBER
 TYPE_TEXT										      VARCHAR2(4000)
 OID_TEXT_LENGTH								      NUMBER
 OID_TEXT										      VARCHAR2(4000)
 VIEW_TYPE_OWNER								      VARCHAR2(30)
 VIEW_TYPE										      VARCHAR2(30)
 SUPERVIEW_NAME 								      VARCHAR2(30)
 EDITIONING_VIEW								      VARCHAR2(1)
 READ_ONLY										      VARCHAR2(1)
```

### 2、查看当前用户所拥有的视图信息

```java
SQL> SELECT VIEW_NAME,TEXT FROM USER_VIEWS;
VIEW_NAME	   TEXT
---------------- --------------------------------------------------------------------------------
V_EMP		  SELECT "EMPNO","ENAME","JOB","MGR","HIREDATE","SAL","COMM","DEPTNO" FROM SCOTT.E
```

## 二、使用 ALL_VIEWS 查看当前用户能够访问的视图

### 1、数据字典 ALL_VIEWS 的结构

```java
SQL> DESC ALL_VIEWS;
 Name										     Null?    Type
----------------------------------------------------------------------------------- -
 OWNER									     NOT NULL VARCHAR2(30)
 VIEW_NAME								     NOT NULL VARCHAR2(30)
 TEXT_LENGTH									      NUMBER
 TEXT											      LONG
 TYPE_TEXT_LENGTH								      NUMBER
 TYPE_TEXT										      VARCHAR2(4000)
 OID_TEXT_LENGTH								      NUMBER
 OID_TEXT										      VARCHAR2(4000)
 VIEW_TYPE_OWNER								      VARCHAR2(30)
 VIEW_TYPE										      VARCHAR2(30)
 SUPERVIEW_NAME 								      VARCHAR2(30)
 EDITIONING_VIEW								      VARCHAR2(1)
 READ_ONLY										      VARCHAR2(1)
```

### 2、查看当前用户能够访问的所有视图信息

```java
--查看当前用户能够访问的视图的数量
SQL> SELECT COUNT(*) FROM ALL_VIEWS;
  COUNT(*)
----------
      1946
--查看当前用户能够访问的各个用户的视图数量
SQL> SELECT OWNER,COUNT(*) FROM ALL_VIEWS GROUP BY OWNER;
OWNER				 COUNT(*)
------------------------------ ----------
MDSYS				       82
CTXSYS				       62
OLAPSYS 			      169
SYSTEM					    1
EXFSYS				       40
APEX_030200			       111
SCOTT					    1
ORDSYS					    5
XDB					        4
ORDDATA 				    5
SYS				         1378
WMSYS				       88
12 rows selected.
--查看 SCOTT 用户的视图信息
SQL> SELECT OWNER,VIEW_NAME,TEXT FROM ALL_VIEWS WHERE OWNER='SCOTT';
OWNER	  VIEW_NAME	    TEXT
------------------------------ ------------------------------ -------------------------
SCOTT	  V_EMP	    SELECT "EMPNO","ENAME","JOB","MGR","HIREDATE","SAL","COMM","DEPTNO" FROM SCOTT.E
```

## 三、使用 DBA_VIEWS 查看 Oracle 的所有视图

### 1、数据字典 DBA_VIEWS 的结构

```java
SQL> DESC DBA_VIEWS;
 Name										     Null?    Type
---------------------------------------------------------------------------------
 OWNER									     NOT NULL VARCHAR2(30)
 VIEW_NAME								     NOT NULL VARCHAR2(30)
 TEXT_LENGTH									      NUMBER
 TEXT											      LONG
 TYPE_TEXT_LENGTH								      NUMBER
 TYPE_TEXT										      VARCHAR2(4000)
 OID_TEXT_LENGTH								      NUMBER
 OID_TEXT										      VARCHAR2(4000)
 VIEW_TYPE_OWNER								      VARCHAR2(30)
 VIEW_TYPE										      VARCHAR2(30)
 SUPERVIEW_NAME 								      VARCHAR2(30)
 EDITIONING_VIEW								      VARCHAR2(1)
 READ_ONLY										      VARCHAR2(1)
```

### 2、查看 SCOTT 用户的视图信息

```java
--查看 Oracle 视图的数量
SQL> SELECT COUNT(*) FROM DBA_VIEWS;
  COUNT(*)
----------
      5219
--查看各个用户的视图数量
SQL> SELECT OWNER,COUNT(*) FROM DBA_VIEWS GROUP BY OWNER;
OWNER	     COUNT(*)
---------- ----------
MDSYS		   86
CTXSYS		   77
OLAPSYS 	  307
SYSTEM		   14
EXFSYS		   56
APEX_03020	  1250
SCOTT		    1
DBSNMP		    7
ORDSYS		    5
SYSMAN		  471
XDB		        5
ORDDATA 	   25
SYS		     3929
WMSYS		  111
14 rows selected.
--查看 SCOTT 用户的视图信息
SQL> SELECT OWNER, VIEW_NAME, TEXT FROM DBA_VIEWS WHERE OWNER='SCOTT';
OWNER	   VIEW_NAME	 TEXT
---------------- --------------------------------------------------------------------------------
SCOTT	   V_EMP  SELECT "EMPNO","ENAME","JOB","MGR","HIREDATE","SAL","COMM","DEPTNO" FROM SCOTT.E
```
