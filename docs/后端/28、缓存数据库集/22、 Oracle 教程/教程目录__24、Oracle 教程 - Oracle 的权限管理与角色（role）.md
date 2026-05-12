# 24、Oracle 教程 - Oracle 的权限管理与角色（role）
- 来源：https://ddkk.com/zhuanlan/db/oracle/1/24.html
- 分类：缓存数据库
- 分组：教程目录
角色（role）是一组权限的集合，将角色赋给一个用户，这个用户就拥有了这个角色中的所有权限。

## 一、系统预定义角色

预定义角色是在数据库安装后，系统自动创建的一些常用的角色。查询角色所包含的权限可以使用以下语句：

```java
SQL> select * from role_sys_privs where role='RESOURCE';
ROLE			       PRIVILEGE	    ADM
------------------------------ -------------------- ---
RESOURCE		       CREATE TRIGGER	    NO
RESOURCE		       CREATE SEQUENCE	    NO
RESOURCE		       CREATE TYPE	    NO
RESOURCE		       CREATE PROCEDURE     NO
RESOURCE		       CREATE CLUSTER	    NO
RESOURCE		       CREATE OPERATOR	    NO
RESOURCE		       CREATE INDEXTYPE     NO
RESOURCE		       CREATE TABLE	    NO
8 rows selected.
```

### 1、CONNECT，RESOURCE，DBA

这些预定义角色主要用于数据库管理。Oracle 建议用户自己设计数据库管理和安全的权限规划，而不要简单的使用这些预定角色。

### 2、DELETE_CATALOG_ROLE，EXECUTE_CATALOG_ROLE，SELECT_CATALOG_ROLE

这些角色主要用于访问数据字典视图和包。

### 3、EXP_FULL_DATABASE，IMP_FULL_DATABASE

这两个角色用于数据导入导出工具的使用。

### 4、AQ_USER_ROLE，AQ_ADMINISTRATOR_ROLE

这两个角色用于 Oracle 高级查询功能。

### 5、SNMPAGENT

用于Oracle enterprise manager 和 Intelligent Agent

### 6、RECOVERY_CATALOG_OWNER

用于创建拥有恢复库的用户。

## 二、管理角色

### 1、创建角色

```java
--语法格式
create role role_name;
SQL> create role teacher;
Role created.
SQL> create role student;
Role created.
```

### 2、为角色授权

```java
SQL> grant create any table, create procedure to teacher;
Grant succeeded.
SQL> grant SELECT ANY TABLE to student;
Grant succeeded.
```

### 3、授予角色给用户

```java
SQL> grant teacher to white;
Grant succeeded.
SQL> grant student to black;
Grant succeeded.
```

### 4、查看用户 while 和 black 包含的角色：

```java
SQL> select * from dba_role_privs where grantee='WHITE';
GRANTEE 		       GRANTED_ROLE		      ADM DEF
------------------------------ ------------------------------ --- ---
WHITE			       TEACHER			      NO  YES
WHITE			       CONNECT			      YES YES
WHITE			       RESOURCE 		      NO  YES
SQL> select * from dba_role_privs where grantee='BLACK';
GRANTEE 		       GRANTED_ROLE		      ADM DEF
------------------------------ ------------------------------ --- ---
BLACK			       STUDENT			      NO  YES
BLACK			       CONNECT			      NO  YES
BLACK			       RESOURCE 		      NO  YES
```

### 5、查看角色所包含的权限

```java
SQL> select * from role_sys_privs where ROLE='TEACHER';
ROLE			       PRIVILEGE	    ADM
------------------------------ -------------------- ---
TEACHER 		       CREATE ANY TABLE     NO
TEACHER 		       CREATE PROCEDURE     NO
SQL> select * from role_sys_privs where ROLE='STUDENT';
ROLE			       PRIVILEGE	    ADM
------------------------------ -------------------- ---
STUDENT 		       SELECT ANY TABLE     NO
```

### 6、创建带有口令的角色

```java
SQL> create role class_manager identified by Wgx123456;
Role created.
```

### 7、为角色添加或删除口令

```java
--为角色添加口令
SQL> alter role teacher identified by Tea123456;
Role altered.
--删除角色的口令
SQL> alter role teacher not identified;
Role altered.
```

### 8、设置当前用户要生效的角色

假设user1 用户有 b1、b2、b3 三个角色，那么如果 b1 未生效，则 b1 所包含的权限对于用户 user1 来讲是不拥有的，只有角色生效了，角色内的权限才作用于用户。最大可生效角色数由参数 MAX_ENABLED_ROLES 设定：

```java
SQL> show parameter  MAX_ENABLED_ROLES
NAME				     TYPE	    VALUE
------------------------------------ ----------- ------------------------------
max_enabled_roles		  integer	 150
```

用户登录后，oracle 将所有直接赋给用户的权限和用户默认角色中的权限赋给用户。

```java
--查看当前用户的生效的角色
SQL> conn scott/tiger;
Connected.
SQL> select * from SESSION_ROLES;
ROLE
------------------------------
CONNECT
RESOURCE
SQL> conn / as sysdba
Connected.
SQL> create user boss identified by Boss123456;
User created.
SQL> create role manager;
Role created.
SQL> grant connect,resource,dba to manager;
Grant succeeded.
SQL> grant manager,teacher,student to boss;
Grant succeeded.
SQL> select * from session_roles;
ROLE
------------------------------
TEACHER
STUDENT
MANAGER
CONNECT
RESOURCE
DBA
SELECT_CATALOG_ROLE
HS_ADMIN_SELECT_ROLE
EXECUTE_CATALOG_ROLE
HS_ADMIN_EXECUTE_ROLE
DELETE_CATALOG_ROLE
EXP_FULL_DATABASE
IMP_FULL_DATABASE
DATAPUMP_EXP_FULL_DATABASE
DATAPUMP_IMP_FULL_DATABASE
GATHER_SYSTEM_STATISTICS
SCHEDULER_ADMIN
WM_ADMIN_ROLE
JAVA_ADMIN
JAVA_DEPLOY
XDBADMIN
XDB_SET_INVOKER
OLAP_XS_ADMIN
OLAP_DBA
24 rows selected.
```

使boss 用户的角色生效：

```java
--设置所有角色失效
SQL> set role none;
Role set.
SQL> select * from session_roles;
no rows selected
--使 teacher 生效
SQL> set role teacher;
Role set.
SQL> select * from session_roles;
ROLE
------------------------------
TEACHER
--使 connect，student 生效
SQL> set role student,connect;
Role set.
SQL> select * from session_roles;
ROLE
------------------------------
CONNECT
STUDENT
--使除了 student 外的该用户的所有其它角色生效
SQL> set role all except student;
Role set.
SQL> select * from session_roles;
ROLE
------------------------------
TEACHER
MANAGER
CONNECT
RESOURCE
DBA
SELECT_CATALOG_ROLE
HS_ADMIN_SELECT_ROLE
EXECUTE_CATALOG_ROLE
HS_ADMIN_EXECUTE_ROLE
DELETE_CATALOG_ROLE
EXP_FULL_DATABASE
IMP_FULL_DATABASE
DATAPUMP_EXP_FULL_DATABASE
DATAPUMP_IMP_FULL_DATABASE
GATHER_SYSTEM_STATISTICS
SCHEDULER_ADMIN
WM_ADMIN_ROLE
JAVA_ADMIN
JAVA_DEPLOY
XDBADMIN
XDB_SET_INVOKER
OLAP_XS_ADMIN
OLAP_DBA
23 rows selected.
--使用该用户的所有角色生效
SQL> select * from session_roles;
ROLE
------------------------------
TEACHER
STUDENT
MANAGER
CONNECT
RESOURCE
DBA
SELECT_CATALOG_ROLE
HS_ADMIN_SELECT_ROLE
EXECUTE_CATALOG_ROLE
HS_ADMIN_EXECUTE_ROLE
DELETE_CATALOG_ROLE
EXP_FULL_DATABASE
IMP_FULL_DATABASE
DATAPUMP_EXP_FULL_DATABASE
DATAPUMP_IMP_FULL_DATABASE
GATHER_SYSTEM_STATISTICS
SCHEDULER_ADMIN
WM_ADMIN_ROLE
JAVA_ADMIN
JAVA_DEPLOY
XDBADMIN
XDB_SET_INVOKER
OLAP_XS_ADMIN
OLAP_DBA
24 rows selected.
```

### 9、修改用户，设置其默认角色

```java
--命令格式：
SQL> alter user boss default role teacher;
User altered.
```

### 10、删除角色

角色删除后，原来拥用该角色的用户就不再拥有该角色了，相应的权限也就没有了。

```java
SQL> drop role student;
Role dropped.
SQL> select * from session_roles;
ROLE
------------------------------
TEACHER
MANAGER
CONNECT
RESOURCE
DBA
SELECT_CATALOG_ROLE
HS_ADMIN_SELECT_ROLE
EXECUTE_CATALOG_ROLE
HS_ADMIN_EXECUTE_ROLE
DELETE_CATALOG_ROLE
EXP_FULL_DATABASE
IMP_FULL_DATABASE
DATAPUMP_EXP_FULL_DATABASE
DATAPUMP_IMP_FULL_DATABASE
GATHER_SYSTEM_STATISTICS
SCHEDULER_ADMIN
WM_ADMIN_ROLE
JAVA_ADMIN
JAVA_DEPLOY
XDBADMIN
XDB_SET_INVOKER
OLAP_XS_ADMIN
OLAP_DBA
23 rows selected.
```
