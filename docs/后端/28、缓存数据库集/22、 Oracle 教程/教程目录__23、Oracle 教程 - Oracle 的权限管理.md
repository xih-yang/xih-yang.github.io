# 23、Oracle 教程 - Oracle 的权限管理
- 来源：https://ddkk.com/zhuanlan/db/oracle/1/23.html
- 分类：缓存数据库
- 分组：教程目录
权限是用户对一项功能的执行权力。每个 Oracle 用户都拥有一些由其创建的表、视图和其他资源。Oracle 系统提供三种权限：对象级（Object），系统级（System），角色级（Role）。

这些权限可以授予给用户、特殊用户 public 或 角色，如果授予一个权限给特殊用户 Public（用户 public 是 Oracle 预定义的，每个用户享有这个用户享有的权限），则意味作将该权限授予了该数据库的所有用户。

Oracle 角色（role）是一组权限（privilege）。可以给角色授予指定的权限，然后将角色赋给相应的用户。对管理权限而言，角色是一个工具，权限能够被授予给一个角色，角色也能被授予给另一个角色或用户。用户可以通过角色继承权限，除了管理权限外角色服务没有其它目的。

## 一、权限分类

在Oracle 中，根据系统管理方式不同，将权限分为系统权限与实体权限两类。

（1）系统权限：是指被授权用户是否可以连接到数据库上，在数据库中可以进行哪些系统操作。

（2）实体权限：是指用户对具体的模式实体（schema）所拥有的权限。

例如：select any table 是系统权限，表示可以查看任何表。而 select on table1 是实体权限，表示对表 table1 的查询权限。

## 二、系统权限管理

系统权限分类：

（1）DBA：拥有全部特权，是系统最高权限，只有 DBA 才可以创建数据库结构。

（2）RESOURCE：拥有 Resource 权限的用户可以创建实体，不可以创建数据库结构。

（3）CONNECT：拥有 Connect 权限的用户只可以登录 Oracle，不可以创建实体，不可以创建数据库结构。

对于普通用户：可以授予 connect、resource 权限。

对于DBA 用户：授予 connect、resource、dba 权限。

### 1、系统权限授权

系统权限只能由 DBA 用户授出，命令如下：

```java
SQL> grant connect, resource, dba to 用户名1 [,用户名2]...;
--创建用户 black、white 并授予权限
SQL> create user black identified by Black123456 default tablespace ts001;
User created.
SQL> create user white identified by White123456 default tablespace ts001;
User created.
--为用户 black、white 授予权限
SQL> grant connect, resource to black, white;
Grant succeeded.
SQL> grant dba to white;
Grant succeeded.
```

### 2、查看系统权限

使用DBA_SYS_PRIVS 查看系统权限：

```java
SQL> select * from dba_sys_privs where grantee='CONNECT';
GRANTEE 		       PRIVILEGE				ADM
------------------------------ ---------------------------------------- ---
CONNECT 		       CREATE SESSION			NO
SQL> select * from dba_sys_privs where grantee='RESOURCE';
GRANTEE 		       PRIVILEGE				ADM
------------------------------ ---------------------------------------- ---
RESOURCE		       CREATE TRIGGER			NO
RESOURCE		       CREATE SEQUENCE			NO
RESOURCE		       CREATE TYPE				NO
RESOURCE		       CREATE PROCEDURE 		NO
RESOURCE		       CREATE CLUSTER			NO
RESOURCE		       CREATE OPERATOR			NO
RESOURCE		       CREATE INDEXTYPE 		NO
RESOURCE		       CREATE TABLE				NO
8 rows selected.
SQL> select * from dba_sys_privs where grantee='DBA';
GRANTEE 		       PRIVILEGE				ADM
------------------------------ ---------------------------------------- ---
DBA			       DROP ANY CUBE BUILD PROCESS		YES
DBA			       CREATE CUBE				        YES
DBA			       ALTER ANY CUBE DIMENSION 		YES
DBA			       ALTER ANY MINING MODEL			YES
DBA			       DROP ANY MINING MODEL			YES
DBA			       DROP ANY EDITION 			    YES
DBA			       CHANGE NOTIFICATION			    YES
DBA			       ADMINISTER ANY SQL TUNING SET	YES
DBA			       ALTER ANY SQL PROFILE			YES
DBA			       CREATE RULE				        YES
DBA			       EXPORT FULL DATABASE			    YES
DBA			       EXECUTE ANY EVALUATION CONTEXT	YES
DBA			       DEQUEUE ANY QUEUE			    YES
DBA			       DROP ANY INDEXTYPE		    	YES
DBA			       ALTER ANY INDEXTYPE		    	YES
DBA			       EXECUTE ANY LIBRARY	    		YES
DBA			       CREATE ANY LIBRARY		    	YES
DBA			       CREATE ANY DIRECTORY		    	YES
DBA			       ALTER PROFILE			    	YES
DBA			       EXECUTE ANY PROCEDURE			YES
DBA			       CREATE ROLE			        	YES
DBA			       SELECT ANY SEQUENCE	    		YES
DBA			       DROP ANY INDEX		    		YES
DBA			       UPDATE ANY TABLE 	    		YES
DBA			       INSERT ANY TABLE 		    	YES
DBA			       SELECT ANY TABLE 			    YES
DBA			       DROP ROLLBACK SEGMENT			YES
DBA			       BECOME USER			        	YES
DBA			       DROP TABLESPACE		    		YES
DBA			       ALTER SESSION			    	YES
DBA			       CREATE SESSION				    YES
DBA			       DROP ANY MEASURE FOLDER			YES
DBA			       SELECT ANY CUBE		    		YES
DBA			       ALTER ANY CUBE			    	YES
DBA			       CREATE ANY ASSEMBLY			    YES
DBA			       ALTER ANY EDITION		    	YES
DBA			       ANALYZE ANY DICTIONARY			YES
DBA			       ALTER ANY RULE SET		    	YES
DBA			       CREATE RULE SET				    YES
DBA			       DEBUG ANY PROCEDURE	    		YES
DBA			       CREATE DIMENSION 		    	YES
DBA			       ALTER ANY LIBRARY			    YES
DBA			       UNDER ANY TYPE		    		YES
DBA			       DROP ANY MATERIALIZED VIEW		YES
DBA			       DROP ANY TRIGGER 	    		YES
DBA			       ALTER ANY PROCEDURE		    	YES
DBA			       FORCE ANY TRANSACTION			YES
DBA			       ALTER DATABASE		    		YES
DBA			       DELETE ANY TABLE 		    	YES
DBA			       ALTER ROLLBACK SEGMENT			YES
DBA			       UPDATE ANY CUBE DIMENSION		YES
DBA			       CREATE ANY CUBE BUILD PROCESS	YES
DBA			       CREATE CUBE DIMENSION			YES
DBA			       ALTER ANY ASSEMBLY	    		YES
DBA			       CREATE ASSEMBLY			    	YES
DBA			       CREATE ANY EDITION			    YES
DBA			       EXECUTE ANY PROGRAM		    	YES
DBA			       EXECUTE ANY RULE 			    YES
DBA			       IMPORT FULL DATABASE		    	YES
DBA			       EXECUTE ANY RULE SET		    	YES
DBA			       CREATE ANY RULE SET			    YES
DBA			       FLASHBACK ANY TABLE			    YES
DBA			       RESUMABLE				        YES
DBA			       ADMINISTER DATABASE TRIGGER		YES
DBA			       CREATE ANY OUTLINE    			YES
DBA			       ALTER ANY DIMENSION	    		YES
DBA			       CREATE ANY DIMENSION		    	YES
DBA			       EXECUTE ANY OPERATOR			    YES
DBA			       CREATE TYPE		        		YES
DBA			       CREATE TRIGGER			    	YES
DBA			       GRANT ANY ROLE				    YES
DBA			       DROP ANY VIEW	    			YES
DBA			       CREATE VIEW			    	    YES
DBA			       LOCK ANY TABLE			    	YES
DBA			       ALTER USER		        		YES
DBA			       CREATE USER				        YES
DBA			       ALTER TABLESPACE 	    		YES
DBA			       CREATE TABLESPACE		    	YES
DBA			       RESTRICTED SESSION			    YES
DBA			       UPDATE ANY CUBE BUILD PROCESS	YES
DBA			       DROP ANY CUBE				    YES
DBA			       INSERT ANY CUBE DIMENSION		YES
DBA			       CREATE MINING MODEL			    YES
DBA			       CREATE ANY JOB				    YES
DBA			       CREATE JOB		        		YES
DBA			       CREATE ANY RULE			    	YES
DBA			       DROP ANY EVALUATION CONTEXT		YES
DBA			       CREATE ANY EVALUATION CONTEXT	YES
DBA			       CREATE EVALUATION CONTEXT		YES
DBA			       GRANT ANY OBJECT PRIVILEGE		YES
DBA			       SELECT ANY DICTIONARY			YES
DBA			       DROP ANY DIMENSION	    		YES
DBA			       UNDER ANY TABLE			    	YES
DBA			       CREATE INDEXTYPE 			    YES
DBA			       CREATE ANY OPERATOR	    		YES
DBA			       DROP ANY LIBRARY 		    	YES
DBA			       ANALYZE ANY			        	YES
DBA			       ALTER ANY ROLE				    YES
DBA			       CREATE ANY SEQUENCE			    YES
DBA			       CREATE ANY INDEX 	    		YES
DBA			       CREATE ANY TABLE 		    	YES
DBA			       DELETE ANY MEASURE FOLDER		YES
DBA			       CREATE ANY MEASURE FOLDER		YES
DBA			       SELECT ANY MINING MODEL			YES
DBA			       CREATE ANY MINING MODEL			YES
DBA			       MANAGE FILE GROUP			    YES
DBA			       MANAGE SCHEDULER 			    YES
DBA			       ADMINISTER RESOURCE MANAGER		YES
DBA			       ALTER ANY OUTLINE		    	YES
DBA			       DROP ANY CONTEXT 			    YES
DBA			       EXECUTE ANY INDEXTYPE			YES
DBA			       UNDER ANY VIEW	    			YES
DBA			       DROP ANY TYPE		    		YES
DBA			       ALTER ANY TYPE			    	YES
DBA			       ALTER ANY MATERIALIZED VIEW		YES
DBA			       CREATE PROFILE				    YES
DBA			       DROP PUBLIC DATABASE LINK		YES
DBA			       ALTER ANY INDEX	    			YES
DBA			       CREATE CLUSTER		    		YES
DBA			       COMMENT ANY TABLE		    	YES
DBA			       DROP ANY TABLE				    YES
DBA			       CREATE ROLLBACK SEGMENT			YES
DBA			       AUDIT SYSTEM	        			YES
DBA			       ALTER SYSTEM			        	YES
DBA			       SELECT ANY CUBE DIMENSION		YES
DBA			       DELETE ANY CUBE DIMENSION		YES
DBA			       CREATE ANY CUBE DIMENSION		YES
DBA			       COMMENT ANY MINING MODEL 		YES
DBA			       EXECUTE ASSEMBLY     			YES
DBA			       EXECUTE ANY ASSEMBLY	    		YES
DBA			       MANAGE ANY FILE GROUP			YES
DBA			       EXECUTE ANY CLASS		    	YES
DBA			       DROP ANY RULE SET			    YES
DBA			       DEBUG CONNECT SESSION			YES
DBA			       ON COMMIT REFRESH	    		YES
DBA			       ENQUEUE ANY QUEUE		    	YES
DBA			       CREATE ANY INDEXTYPE			    YES
DBA			       ALTER ANY OPERATOR	    		YES
DBA			       CREATE ANY TYPE			    	YES
DBA			       DROP ANY DIRECTORY			    YES
DBA			       ALTER RESOURCE COST	    		YES
DBA			       CREATE ANY PROCEDURE		    	YES
DBA			       CREATE PROCEDURE 			    YES
DBA			       FORCE TRANSACTION    			YES
DBA			       ALTER ANY SEQUENCE	    		YES
DBA			       CREATE SEQUENCE			    	YES
DBA			       CREATE ANY VIEW				    YES
DBA			       DROP PUBLIC SYNONYM	    		YES
DBA			       DROP ANY SYNONYM 		    	YES
DBA			       CREATE ANY CLUSTER			    YES
DBA			       BACKUP ANY TABLE 		    	YES
DBA			       CREATE TABLE			    	    YES
DBA			       ADMINISTER SQL MANAGEMENT OBJECT YES
DBA			       INSERT ANY MEASURE FOLDER		YES
DBA			       UPDATE ANY CUBE	    			YES
DBA			       ADMINISTER SQL TUNING SET		YES
DBA			       MERGE ANY VIEW		    		YES
DBA			       DROP ANY OUTLINE 		    	YES
DBA			       CREATE OPERATOR				    YES
DBA			       CREATE LIBRARY		    		YES
DBA			       GRANT ANY PRIVILEGE		    	YES
DBA			       DROP PROFILE				        YES
DBA			       ALTER ANY TRIGGER	    		YES
DBA			       CREATE ANY TRIGGER		    	YES
DBA			       DROP ANY PROCEDURE			    YES
DBA			       AUDIT ANY	        			YES
DBA			       DROP ANY ROLE		    		YES
DBA			       DROP ANY SEQUENCE		    	YES
DBA			       CREATE PUBLIC SYNONYM			YES
DBA			       CREATE SYNONYM				    YES
DBA			       DROP ANY CLUSTER     			YES
DBA			       ALTER ANY TABLE		    		YES
DBA			       FLASHBACK ARCHIVE ADMINISTER		YES
DBA			       CREATE CUBE BUILD PROCESS		YES
DBA			       CREATE MEASURE FOLDER			YES
DBA			       CREATE ANY CUBE			    	YES
DBA			       DROP ANY CUBE DIMENSION			YES
DBA			       DROP ANY ASSEMBLY			    YES
DBA			       CREATE EXTERNAL JOB	    		YES
DBA			       READ ANY FILE GROUP		    	YES
DBA			       CREATE ANY SQL PROFILE			YES
DBA			       DROP ANY SQL PROFILE			    YES
DBA			       SELECT ANY TRANSACTION			YES
DBA			       ADVISOR			        		YES
DBA			       DROP ANY RULE			    	YES
DBA			       ALTER ANY RULE				    YES
DBA			       ALTER ANY EVALUATION CONTEXT		YES
DBA			       CREATE ANY CONTEXT    			YES
DBA			       MANAGE ANY QUEUE 	    		YES
DBA			       GLOBAL QUERY REWRITE		    	YES
DBA			       QUERY REWRITE				    YES
DBA			       DROP ANY OPERATOR	    		YES
DBA			       EXECUTE ANY TYPE 		    	YES
DBA			       CREATE ANY MATERIALIZED VIEW		YES
DBA			       CREATE MATERIALIZED VIEW 		YES
DBA			       CREATE PUBLIC DATABASE LINK		YES
DBA			       CREATE DATABASE LINK			    YES
DBA			       CREATE ANY SYNONYM	    		YES
DBA			       ALTER ANY CLUSTER		    	YES
DBA			       DROP USER		        		YES
DBA			       MANAGE TABLESPACE			    YES
201 rows selected.
```

### 3、系统权限传递

授予权限时使用 WITH ADMIN OPTION选项，则得到的权限可以传递，即用户可以把自己的系统再授予其他用户。

```java
SQL> grant connect, resource, dba to white with admin option;
Grant succeeded.
SQL> alter user white account unlock;
User altered.
SQL> alter user black account unlock;
User altered.
--以 white 用户登录系统
SQL> conn white/White123456;
Connected.
--white 用户把自己的 connect,resource 权限授予 black
SQL> grant connect,resource to black;
Grant succeeded.
--查看用户所拥有的的角色
SQL> select * from dba_role_privs where grantee='WHITE';
GRANTEE 		       GRANTED_ROLE		      ADM DEF
------------------------------ ------------------------------ --- ---
WHITE			       CONNECT			      YES YES
WHITE			       RESOURCE 		      YES YES
WHITE			       DBA			      YES YES
SQL> select * from dba_role_privs where grantee='BLACK';
GRANTEE 		       GRANTED_ROLE		      ADM DEF
------------------------------ ------------------------------ --- ---
BLACK			       CONNECT			      NO  YES
BLACK			       RESOURCE 		      NO  YES
```

### 4、系统权限回收

```java
SQL> Revoke connect, resource from black; 
Revoke succeeded.
SQL> Revoke connect, resource, dba from white; 
Revoke succeeded.
SQL> select * from dba_role_privs where grantee='BLACK';
no rows selected
SQL> select * from dba_role_privs where grantee='WHITE';
no rows selected
```

系统权限无级联，即 A 授予 B 权限，B 授予 C 权限，如果 A 收回 B 的权限，C 的权限不受影响

```java
--sys 用户登录
SQL> conn / as sysdba;
Connected.
--为 white 用户授权
SQL> grant connect, resource, dba to white with admin option;
Grant succeeded.
--white 用户登录
SQL> conn white/White123456
Connected.
--把 connect，resource 权限授予 black
SQL> grant connect, resource to black;
Grant succeeded.
--查看 white 的权限
SQL> select * from dba_role_privs where grantee='WHITE';
GRANTEE 		       GRANTED_ROLE		      ADM DEF
------------------------------ ------------------------------ --- ---
WHITE			       CONNECT			      YES YES
WHITE			       RESOURCE 		      YES YES
WHITE			       DBA			      YES YES
--查看 black 的权限
SQL> select * from dba_role_privs where grantee='BLACK';
GRANTEE 		       GRANTED_ROLE		      ADM DEF
------------------------------ ------------------------------ --- ---
BLACK			       CONNECT			      NO  YES
BLACK			       RESOURCE 		      NO  YES
--sys 用户登录
SQL> conn / as sysdba
Connected.
--收回 white 用户的 resource, dba 权限
SQL> revoke resource, dba from white;
Revoke succeeded.
--查看 white、black 用户的权限
SQL> select * from dba_role_privs where grantee='WHITE';
GRANTEE 		       GRANTED_ROLE		      ADM DEF
------------------------------ ------------------------------ --- ---
WHITE			       CONNECT			      YES YES
SQL> select * from dba_role_privs where grantee='BLACK';
GRANTEE 		       GRANTED_ROLE		      ADM DEF
------------------------------ ------------------------------ --- ---
BLACK			       CONNECT			      NO  YES
BLACK			       RESOURCE 		      NO  YES
```

## 三、实体权限管理

实体权限分类：select、update、insert、alter、index、delete、all、execute

DBA用户可以操作全体用户的任意基表，无需授权。使用 sys 账户为 white 用户和 black 用户创建表，并输入数据：

```java
SQL> show user
USER is "SYS"
SQL> create table white.t1(x int,name varchar2(20));
Table created.
                  *
SQL> insert into white.t1 values(1,'white:t1');
1 row created.
SQL> create table black.t22(x int,name varchar2(20));
Table created.
SQL> insert into black.t22 values(1,'black:t22');
1 row created.
```

### 1、为 white 用户授予实体权限

```java
SQL> grant select on scott.emp to white;
Grant succeeded.
```

### 2、实体权限传递授权

授权时使用 with grant option 参数可实现实体权限的传递授权。

```java
SQL> grant select on scott.dept to white with grant option;
Grant succeeded.
```

使用white 账号登录：

```java
SQL> conn white/White123456
Connected.
--可以查看 emp.dept
SQL> select * from scott.dept;
    DEPTNO DNAME	  LOC
---------- -------------- -------------
	50 LENOVO	  BEIJING
	10 ACCOUNTING	  NEW YORK
	20 RESEARCH	  DALLAS
	30 SALES	  CHICAGO
	40 OPERATIONS	  BOSTON
--不能删除 emp.dept 表中的数据
SQL> delete from scott.dept;
delete from scott.dept
                  *
ERROR at line 1:
ORA-01031: insufficient privileges
--可以把对象 scott.dept 的查询权限授予 black
SQL> grant select on scott.dept to black;
Grant succeeded.
--不能把对象 scott.emp 的查询权限授予 black
SQL> grant select on scott.emp to black;
grant select on scott.emp to black
                      *
ERROR at line 1:
ORA-01031: insufficient privileges
```

### 3、实体权限的回收

收回white 用户针对 scott.emp 对象的查询权限

```java
SQL> conn / as sysdba
Connected.
SQL> revoke select on scott.emp from white;
Revoke succeeded.
```

如果收回某个用户的对象权限，那么对于这个用户使用 WITH GRANT OPTION 授予权限的用户来说，同样还会收回这些用户的相同权限，也就是说回收授权是级联的。

查询对象权限：

```java
SQL> select owner,table_name,privilege from dba_tab_privs where grantee='BLACK';
OWNER		     TABLE_NAME 	  PRIVILEGE
-------------------- -------------------- --------------------
SCOTT		     DEPT		  SELECT
SQL> select owner,table_name,privilege from dba_tab_privs where grantee='WHITE';
OWNER		     TABLE_NAME 	  PRIVILEGE
-------------------- -------------------- --------------------
SCOTT		     DEPT		  SELECT
```

使用SYS 用户登录，回收 white 用户的对象权限：

```java
SQL> show user
USER is "SYS"
SQL> revoke select on scott.dept from white;
Revoke succeeded.
SQL> select owner,table_name,privilege from dba_tab_privs where grantee='WHITE';
no rows selected
SQL> select owner,table_name,privilege from dba_tab_privs where grantee='BLACK';
no rows selected
--回收 white 用户针对 scott.dept 对象的查询权限，由于该权限由 white 用户授予了 black 用户，则 black 用户针对scott.dept 对象的查询权限也被回收
```

### 4、将对象权限授予全体用户

```java
--将对象 white.t1 的查询权限授予所有用户
SQL> grant select on white.t1 to public;
Grant succeeded.
SQL> conn scott/tiger;
Connected.
SQL> select * from white.t1;
	 X NAME
---------- --------------------
	 1 white:t1
SQL> conn black/Black123456
Connected.
SQL> select * from white.t1;
	 X NAME
---------- --------------------
	 1 white:t1
```
