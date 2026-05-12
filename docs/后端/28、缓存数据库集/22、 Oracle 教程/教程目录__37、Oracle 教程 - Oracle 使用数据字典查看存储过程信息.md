# 37、Oracle 教程 - Oracle 使用数据字典查看存储过程信息
- 来源：https://ddkk.com/zhuanlan/db/oracle/1/37.html
- 分类：缓存数据库
- 分组：教程目录
## 一、使用 USER_PROCEDURES 查看当前用户的存储过程信息

### 1、数据字典的结构

```java
SQL> DESC USER_PROCEDURES;
 Name										     Null?    Type
-----------------------------------------------------------------------------------
 OBJECT_NAME									      VARCHAR2(128)
 PROCEDURE_NAME 								      VARCHAR2(30)
 OBJECT_ID										      NUMBER
 SUBPROGRAM_ID									      NUMBER
 OVERLOAD										      VARCHAR2(40)
 OBJECT_TYPE									      VARCHAR2(19)
 AGGREGATE										      VARCHAR2(3)
 PIPELINED										      VARCHAR2(3)
 IMPLTYPEOWNER									      VARCHAR2(30)
 IMPLTYPENAME									      VARCHAR2(30)
 PARALLEL										      VARCHAR2(3)
 INTERFACE										      VARCHAR2(3)
 DETERMINISTIC									      VARCHAR2(3)
 AUTHID 										      VARCHAR2(12)
```

### 2、查看当前用户的存储过程信息

```java
SQL> SHOW USER;
USER is "SCOTT"
--显示的结果包括存储过程、自定义函数和触发器
SQL> SELECT OBJECT_NAME,PROCEDURE_NAME,OBJECT_TYPE FROM USER_PROCEDURES;
OBJECT_NAME		       PROCEDURE_NAME		      OBJECT_TYPE
------------------------------ ------------------------------ -------------------
FUN_GET_TABLE_ROWCOUNT				      FUNCTION        ----自定义函数
FUN_GET_DEPT_COUNT					      FUNCTION        ----自定义函数
FUN_GET_GRADE					         FUNCTION        ----自定义函数
SP_UPDATE_EMP_SAL					     PROCEDURE        ----存储过程
SP_SET_EMP_SAL						     PROCEDURE        ----存储过程
SP_ADD				    			     PROCEDURE        ----存储过程
T_DEL_EMP				    		     TRIGGER          ----触发器
T_UPDATE_EMP						     TRIGGER          ----触发器
T_UPDATE_DEPT						     TRIGGER          ----触发器
9 rows selected.
```

## 二、使用 ALL_PROCEDURES 查看当前用户能够访问的存储过程信息

### 1、数据字典的结构

```java
SQL> DESC ALL_PROCEDURES;
 Name										     Null?    Type
--------------------------------------------------------------------------------
 OWNER											      VARCHAR2(30)
 OBJECT_NAME									      VARCHAR2(30)
 PROCEDURE_NAME 								      VARCHAR2(30)
 OBJECT_ID										      NUMBER
 SUBPROGRAM_ID									      NUMBER
 OVERLOAD										      VARCHAR2(40)
 OBJECT_TYPE									      VARCHAR2(19)
 AGGREGATE										      VARCHAR2(3)
 PIPELINED										      VARCHAR2(3)
 IMPLTYPEOWNER									      VARCHAR2(30)
 IMPLTYPENAME									      VARCHAR2(30)
 PARALLEL										      VARCHAR2(3)
 INTERFACE										      VARCHAR2(3)
 DETERMINISTIC									      VARCHAR2(3)
 AUTHID 										      VARCHAR2(12)
```

### 2、查看当前用户能够访问的存储过程信息

```java
SQL> SELECT COUNT(*) FROM ALL_PROCEDURES;
  COUNT(*)
----------
     10510
--查看 SCOTT 用户的存储过程信息
SQL> SELECT OWNER,OBJECT_NAME,PROCEDURE_NAME,OBJECT_TYPE 
     FROM ALL_PROCEDURES WHERE OWNER='SCOTT';
OWNER	   OBJECT_NAME			  PROCEDURE_NAME		 OBJECT_TYPE
---------- ------------------------------ ------------------------------ -------------------
SCOTT	   FUN_GET_TABLE_ROWCOUNT				 FUNCTION
SCOTT	   FUN_GET_DEPT_COUNT					 FUNCTION
SCOTT	   FUN_GET_GRADE						 FUNCTION
SCOTT	   SP_UPDATE_EMP_SAL					 PROCEDURE
SCOTT	   SP_SET_EMP_SAL						 PROCEDURE
SCOTT	   SP_ADD					    		 PROCEDURE
SCOTT	   T_UPDATE_DEPT						 TRIGGER
SCOTT	   T_DEL_EMP							 TRIGGER
SCOTT	   T_UPDATE_EMP 						 TRIGGER
9 rows selected.
```

## 三、使用 DBA_PROCEDURES 查看 Oracle 的存储过程信息

### 1、数据字典的结构

```java
SQL> DESC DBA_PROCEDURES;
 Name										     Null?    Type
-----------------------------------------------------------------------------------
 OWNER											      VARCHAR2(30)
 OBJECT_NAME									      VARCHAR2(30)
 PROCEDURE_NAME 								      VARCHAR2(30)
 OBJECT_ID										      NUMBER
 SUBPROGRAM_ID									      NUMBER
 OVERLOAD										      VARCHAR2(40)
 OBJECT_TYPE									      VARCHAR2(13)
 AGGREGATE										      VARCHAR2(3)
 PIPELINED										      VARCHAR2(3)
 IMPLTYPEOWNER									      VARCHAR2(30)
 IMPLTYPENAME									      VARCHAR2(30)
 PARALLEL										      VARCHAR2(3)
 INTERFACE										      VARCHAR2(3)
 DETERMINISTIC									      VARCHAR2(3)
 AUTHID 										      VARCHAR2(12)
```

### 2、查看 Oracle 的存储过程信息

```java
SQL> SELECT COUNT(*) FROM DBA_PROCEDURES;
  COUNT(*)
----------
     28043
--查看 SCOTT 用户的存储过程信息
SQL> 
SELECT OWNER,OBJECT_NAME,PROCEDURE_NAME,OBJECT_TYPE 
  2       FROM DBA_PROCEDURES WHERE OWNER='SCOTT';
OWNER	   OBJECT_NAME			  PROCEDURE_NAME		 OBJECT_TYPE
---------- ------------------------------ ------------------------------ ------
SCOTT	   FUN_GET_TABLE_ROWCOUNT				 FUNCTION
SCOTT	   FUN_GET_DEPT_COUNT					 FUNCTION
SCOTT	   FUN_GET_GRADE						 FUNCTION
SCOTT	   SP_UPDATE_EMP_SAL					 PROCEDURE
SCOTT	   SP_SET_EMP_SAL						 PROCEDURE
SCOTT	   SP_ADD					    		 PROCEDURE
SCOTT	   T_UPDATE_DEPT						 TRIGGER
SCOTT	   T_DEL_EMP							 TRIGGER
SCOTT	   T_UPDATE_EMP 						 TRIGGER
9 rows selected.
```
