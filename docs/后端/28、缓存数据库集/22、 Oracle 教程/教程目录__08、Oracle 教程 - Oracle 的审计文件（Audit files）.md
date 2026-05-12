# 08、Oracle 教程 - Oracle 的审计文件（Audit files）
- 来源：https://ddkk.com/zhuanlan/db/oracle/1/8.html
- 分类：缓存数据库
- 分组：教程目录
审计（Audit）用于监视用户对数据库的操作，审计记录保存在数据字典表中，存储在 system 表空间中的 SYS.AUD$ 表中（可通过视图 dba_audit_trail 查看）或审计文件中（默认位置为 O R A C L E B A S E / a d m i n / ORACLE_BASE/admin/ ORACLEBASE/admin/ORACLE_SID/adump/)。

审计是对特定的用户动作的监控和记录，通常用于：（1）审查可疑的活动。（2）监视和收集关于指定数据库活动的数据。

不管是否打开数据库的审计功能，以下这些操作会强制被记录：用管理员权限连接 Instance、启动数据库、关闭数据库。

## 一、查看审计信息

**1、** 执行以下命令；

```java
-- 建立 sys 用户的连接
SQL> conn / as sysdba
Connected.
-- 关闭数据库
SQL> shutdown immediate
Database closed.
Database dismounted.
ORACLE instance shut down.
-- 启动数据库
SQL> startup
ORACLE instance started.
Total System Global Area  835104768 bytes
Fixed Size		    2257840 bytes
Variable Size		  603982928 bytes
Database Buffers	  226492416 bytes
Redo Buffers		    2371584 bytes
Database mounted.
Database opened.
```

**2、** 进入/u01/app/oracle/admin/orcl/adump目录；

```java
[oracle@rac1 adump]$ ll
total 24
-rw-r----- 1 oracle asmadmin 1055 Aug  6 19:21 orcl1_ora_96807_20210806192133262862143795.aud
-rw-r----- 1 oracle asmadmin  818 Aug  6 19:22 orcl1_ora_96876_20210806192217735586143795.aud
-rw-r----- 1 oracle asmadmin  824 Aug  6 19:22 orcl1_ora_96964_20210806192217749385143795.aud
-rw-r----- 1 oracle asmadmin  819 Aug  6 19:22 orcl1_ora_96971_20210806192217809852143795.aud
-rw-r----- 1 oracle asmadmin  858 Aug  6 19:22 orcl1_ora_97021_20210806192224607943143795.aud
-rw-r----- 1 oracle asmadmin  853 Aug  6 19:22 orcl1_ora_97049_20210806192230891126143795.aud
[oracle@rac1 adump]$ cat orcl1_ora_96807_20210806192133262862143795.aud
Audit file /u01/app/oracle/admin/orcl/adump/orcl1_ora_96807_20210806192133262862143795.aud
Oracle Database 11g Enterprise Edition Release 11.2.0.4.0 - 64bit Production
With the Partitioning, Real Application Clusters, Automatic Storage Management, OLAP,
Data Mining and Real Application Testing options
ORACLE_HOME = /u01/app/oracle/product/11.2.0/db_1
System name:	Linux
Node name:	rac1
Release:	2.6.32-431.el6.x86_64
Version:	#1 SMP Fri Nov 22 03:15:09 UTC 2013
Machine:	x86_64
VM name:	VMWare Version: 6
Instance name: orcl1
Redo thread mounted by this instance: 1
Oracle process number: 32
Unix process pid: 96807, image: oracle@rac1 (TNS V1-V3)
Fri Aug  6 19:21:33 2021 +08:00
LENGTH : '160'
ACTION :[7] 'CONNECT'
DATABASE USER:[1] '/'
PRIVILEGE :[6] 'SYSDBA'
CLIENT USER:[6] 'oracle'
CLIENT TERMINAL:[5] 'pts/2'
STATUS:[1] '0'
DBID:[10] '1598252726'
Fri Aug  6 19:21:51 2021 +08:00
LENGTH : '150'
ACTION :[8] 'SHUTDOWN'
DATABASE USER:[1] '/'
PRIVILEGE :[6] 'SYSDBA'
CLIENT USER:[6] 'oracle'
CLIENT TERMINAL:[5] 'pts/2'
STATUS:[1] '0'
DBID:[0] ''
[oracle@rac1 adump]$ cat orcl1_ora_96876_20210806192217735586143795.aud
Audit file /u01/app/oracle/admin/orcl/adump/orcl1_ora_96876_20210806192217735586143795.aud
Oracle Database 11g Enterprise Edition Release 11.2.0.4.0 - 64bit Production
With the Partitioning, Real Application Clusters, OLAP, Data Mining
and Real Application Testing options
ORACLE_HOME = /u01/app/oracle/product/11.2.0/db_1
System name:	Linux
Node name:	rac1
Release:	2.6.32-431.el6.x86_64
Version:	#1 SMP Fri Nov 22 03:15:09 UTC 2013
Machine:	x86_64
VM name:	VMWare Version: 6
Instance name: orcl1
Redo thread mounted by this instance: 0 <none>
Oracle process number: 0
Unix process pid: 96876, image: oracle@rac1
Fri Aug  6 19:22:17 2021 +08:00
LENGTH : '156'
ACTION :[7] 'STARTUP'
DATABASE USER:[1] '/'
PRIVILEGE :[4] 'NONE'
CLIENT USER:[6] 'oracle'
CLIENT TERMINAL:[13] 'Not Available'
STATUS:[1] '0'
DBID:[0] ''
```

## 二、和审计相关的参数

和审计有关的参数主要有以下几个：

```java
SQL> show parameter audit
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
audit_file_dest 	     string	      /u01/app/oracle/admin/orcl/adump
audit_sys_operations	 boolean	 FALSE
audit_syslog_level		 string
audit_trail			     string	 DB
```

### 1、audit_file_dest

如果AUDIT_TRAIL = OS，则审计记录的文件，存放在 audit_file_dest 参数指定的目录中。如果指定的路径不存在，会造成数据库无法启动：

```java
SQL> show parameter audit_file_dest
NAME			    TYPE	 VALUE
------------------------------------ ----------- ------------------------------
audit_file_dest      string	 /u01/app/oracle/admin/orcl/adump
-- 修改 audit_file_dest 参数为一个不存在的路径
SQL> alter system set audit_file_dest = '/home/oracle/aaa' scope = spfile sid = '*';
System altered.
-- 重启数据库，提示不能创建审计文件
SQL> startup force;
ORA-09925: Unable to create audit trail file
Linux-x86_64 Error: 2: No such file or directory
Additional information: 9925
-- 查看 alert 警报日志
System parameters with non-default values:
  processes                = 150
  spfile                   = "+DATA/orcl/spfileorcl.ora"
  memory_target            = 800M
  control_files            = "+DATA/orcl/controlfile/control_file01.ctl"
  control_files            = "+BAK/orcl/controlfile/control_file02.ctl"
  control_files            = "+BAK/ctl_files/control_file03.ctl"
  db_block_size            = 8192
  compatible               = "11.2.0.4.0"
  cluster_database         = TRUE
  db_create_file_dest      = "+DATA"
  db_recovery_file_dest    = "+BAK"
  db_recovery_file_dest_size= 4407M
  thread                   = 1
  undo_tablespace          = "UNDOTBS1"
  instance_number          = 1
  remote_login_passwordfile= "EXCLUSIVE"
  db_domain                = ""
  dispatchers              = "(PROTOCOL=TCP) (SERVICE=orclXDB)"
  remote_listener          = "rac-scan:1521"
  audit_file_dest          = "/home/oracle/aaa"  -- 审计目录
  audit_trail              = "DB"
  db_name                  = "orcl"
  open_cursors             = 300
  diagnostic_dest          = "/u01/app/oracle"
-- 创建设计目录
[oracle@rac1 trace]$ mkdir -p /home/oracle/aaa
-- 打开数据库
SQL> alter database mount;
Database altered.
SQL> alter database open;
Database altered.
SQL> show parameter audit_file_dest
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
audit_file_dest 		     string	 /home/oracle/aaa
SQL> alter system set audit_file_dest = '/u01/app/oracle/admin/orcl/adump' scope = spfile sid = '*';
System altered.
SQL> startup force
ORACLE instance started.
Total System Global Area  835104768 bytes
Fixed Size		    2257840 bytes
Variable Size		  603982928 bytes
Database Buffers	  226492416 bytes
Redo Buffers		    2371584 bytes
Database mounted.
Database opened.
```

### 2、Audit_trail

该参数用于关闭或开启审计功能，取值如下：

（1）None：不做审计。

（2）DB：启用数据库审计，将审计记录保存在数据库的 sys.AUD$ 的表中。

（3）OS：启用数据库审计，将审计记录保存在操作系统文件中，文件位置由 audit_file_dest 参数指定。

不管是否开启审计功能，以下的几种个操作都会记录在由参数 audit_file_dest 指定的目录中的 .aud 操作系统文件中。

（1）用 sysdba 或者 sysoper 权限登陆数据库。（2）启动数据库（startup）。（3）关闭数据库（shutdown）。

```java
SQL> show parameter Audit_trail
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
audit_trail			     string	 DB
```

### 3、Audit_sys_operations

指定是否启用对 SYS 用户的审计，默认为 false。当设置为 true 时，所有 sys 用户（包括以 sysdba、sysoper 身份登录的用户）的操作都会被记录。这些审计记录不会保存在 aud$ 表中，而是被保存到操作系统文件中。当设置为 false 时，只记录 sys 用户的连接、数据库的启动和停止。

```java
SQL> show parameter Audit_sys_operations
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
audit_sys_operations		     boolean	 TRUE
```

验证Audit_sys_operations 参数：参数值为 TRUE

（1）删除所有的审计文件

```java
[oracle@rac1 adump]$ rm *
[oracle@rac1 adump]$ ll
total 0
```

（2）以 sys 用户操作数据库

```java
[oracle@rac1 ~]$ sqlplus / as sysdba
SQL*Plus: Release 11.2.0.4.0 Production on Fri Aug 6 20:47:22 2021
Copyright (c) 1982, 2013, Oracle.  All rights reserved.
Connected to:
Oracle Database 11g Enterprise Edition Release 11.2.0.4.0 - 64bit Production
With the Partitioning, Real Application Clusters, Automatic Storage Management, OLAP,
Data Mining and Real Application Testing options
SQL> select * from scott.dept;
    DEPTNO DNAME	  LOC
---------- -------------- -------------
	50 LENOVO	  BEIJING
	10 ACCOUNTING	  NEW YORK
	20 RESEARCH	  DALLAS
	30 SALES	  CHICAGO
	40 OPERATIONS	  BOSTON
SQL> create table t01(id int);
Table created.
```

（3）查看审计文件

```java
[oracle@rac1 adump]$ ll
total 4
-rw-r----- 1 oracle asmadmin 1722 Aug  6 20:47 orcl1_ora_105182_20210806204722681590143795.aud
[oracle@rac1 adump]$ cat orcl1_ora_105182_20210806204722681590143795.aud
Audit file /u01/app/oracle/admin/orcl/adump/orcl1_ora_105182_20210806204722681590143795.aud
Oracle Database 11g Enterprise Edition Release 11.2.0.4.0 - 64bit Production
With the Partitioning, Real Application Clusters, Automatic Storage Management, OLAP,
Data Mining and Real Application Testing options
ORACLE_HOME = /u01/app/oracle/product/11.2.0/db_1
System name:	Linux
Node name:	rac1
Release:	2.6.32-431.el6.x86_64
Version:	#1 SMP Fri Nov 22 03:15:09 UTC 2013
Machine:	x86_64
VM name:	VMWare Version: 6
Instance name: orcl1
Redo thread mounted by this instance: 1
Oracle process number: 39
Unix process pid: 105182, image: oracle@rac1 (TNS V1-V3)
Fri Aug  6 20:47:22 2021 +08:00
LENGTH : '160'
ACTION :[7] 'CONNECT'
DATABASE USER:[1] '/'
PRIVILEGE :[6] 'SYSDBA'
CLIENT USER:[6] 'oracle'
CLIENT TERMINAL:[5] 'pts/2'
STATUS:[1] '0'
DBID:[10] '1598252726'
Fri Aug  6 20:47:22 2021 +08:00
LENGTH : '159'
ACTION :[6] 'COMMIT'
DATABASE USER:[1] '/'
PRIVILEGE :[6] 'SYSDBA'
CLIENT USER:[6] 'oracle'
CLIENT TERMINAL:[5] 'pts/2'
STATUS:[1] '0'
DBID:[10] '1598252726'
Fri Aug  6 20:47:22 2021 +08:00
LENGTH : '159'
ACTION :[6] 'COMMIT'
DATABASE USER:[1] '/'
PRIVILEGE :[6] 'SYSDBA'
CLIENT USER:[6] 'oracle'
CLIENT TERMINAL:[5] 'pts/2'
STATUS:[1] '0'
DBID:[10] '1598252726'
Fri Aug  6 20:47:39 2021 +08:00
LENGTH : '178'
ACTION :[24] 'select * from scott.dept'
DATABASE USER:[1] '/'
PRIVILEGE :[6] 'SYSDBA'
CLIENT USER:[6] 'oracle'
CLIENT TERMINAL:[5] 'pts/2'
STATUS:[1] '0'
DBID:[10] '1598252726'
Fri Aug  6 20:47:49 2021 +08:00
LENGTH : '178'
ACTION :[24] 'create table t01(id int)'
DATABASE USER:[1] '/'
PRIVILEGE :[6] 'SYSDBA'
CLIENT USER:[6] 'oracle'
CLIENT TERMINAL:[5] 'pts/2'
STATUS:[1] '0'
DBID:[10] '1598252726'
```

验证Audit_sys_operations 参数：参数值为 FALSE

（1）查看 Audit_sys_operations 参数的值：

```java
SQL> show parameter Audit_sys_operations
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
audit_sys_operations		     boolean	 FALSE
```

（2）删除所有的审计文件

```java
[oracle@rac1 adump]$ rm *
[oracle@rac1 adump]$ ll
total 0
```

（3）以 sys 用户操作数据库

```java
[oracle@rac1 ~]$ sqlplus / as sysdba
SQL*Plus: Release 11.2.0.4.0 Production on Fri Aug 6 21:01:18 2021
Copyright (c) 1982, 2013, Oracle.  All rights reserved.
Connected to:
Oracle Database 11g Enterprise Edition Release 11.2.0.4.0 - 64bit Production
With the Partitioning, Real Application Clusters, Automatic Storage Management, OLAP,
Data Mining and Real Application Testing options
SQL> select * from scott.dept;
    DEPTNO DNAME	  LOC
---------- -------------- -------------
	50 LENOVO	  BEIJING
	10 ACCOUNTING	  NEW YORK
	20 RESEARCH	  DALLAS
	30 SALES	  CHICAGO
	40 OPERATIONS	  BOSTON
SQL> insert into t3 values(100);
1 row created.
```

（4）查看审计文件

```java
[oracle@rac1 adump]$ ll
total 24
-rw-r----- 1 oracle asmadmin 850 Aug  6 20:52 orcl1_ora_105669_20210806205250823669143795.aud
-rw-r----- 1 oracle asmadmin 856 Aug  6 20:52 orcl1_ora_105802_20210806205250856644143795.aud
-rw-r----- 1 oracle asmadmin 851 Aug  6 20:52 orcl1_ora_105824_20210806205252418250143795.aud
-rw-r----- 1 oracle asmadmin 860 Aug  6 20:52 orcl1_ora_105835_20210806205256211541143795.aud
-rw-r----- 1 oracle asmadmin 855 Aug  6 20:53 orcl1_ora_105878_20210806205309838640143795.aud
-rw-r----- 1 oracle asmadmin 860 Aug  6 21:01 orcl1_ora_106676_20210806210118499214143795.aud
[oracle@rac1 adump]$ cat orcl1_ora_106676_20210806210118499214143795.aud
Audit file /u01/app/oracle/admin/orcl/adump/orcl1_ora_106676_20210806210118499214143795.aud
Oracle Database 11g Enterprise Edition Release 11.2.0.4.0 - 64bit Production
With the Partitioning, Real Application Clusters, Automatic Storage Management, OLAP,
Data Mining and Real Application Testing options
ORACLE_HOME = /u01/app/oracle/product/11.2.0/db_1
System name:	Linux
Node name:	rac1
Release:	2.6.32-431.el6.x86_64
Version:	#1 SMP Fri Nov 22 03:15:09 UTC 2013
Machine:	x86_64
VM name:	VMWare Version: 6
Instance name: orcl1
Redo thread mounted by this instance: 1
Oracle process number: 32
Unix process pid: 106676, image: oracle@rac1 (TNS V1-V3)
Fri Aug  6 21:01:18 2021 +08:00
LENGTH : '160'
ACTION :[7] 'CONNECT'
DATABASE USER:[1] '/'
PRIVILEGE :[6] 'SYSDBA'
CLIENT USER:[6] 'oracle'
CLIENT TERMINAL:[5] 'pts/2'
STATUS:[1] '0'
DBID:[10] '1598252726'
```

## orver

## 三、审计的类型

**1、** 语句审计：对某种类型的SQL语句审计，不指定结构或对象如：audittable会审计数据库中所有的createtable、droptable、truncatetable语句，altersessionbyscott会审计scott用户所有的数据库连接；

**2、** 权限审计：当用户使用了该权限则被审计，如：CREATETABLE或ALTERINDEX和语句审计一样，权限审计可以指定一个或多个特定的用户作为审计的目标；

**3、** 对象审计：审计特定模式对象上运行的特定语句，如：EMP表上的UPDATE语句模式对象审计应用于数据库中的所有用户；

**4、** 细粒度的审计：根据访问对象的内容来审计表访问和权限使用程序包DBMS_FGA来建立特定表上的策略；

## 四、使用 audit 命令打开和关闭审计

### 1、语句审计

语句审计，audit 命令的格式如下所示：

```java
AUDIT sql_statement_clause 
BY {
    SESSION | ACCESS} WHENEVER [NOT] SUCCESSFUL; 
```

下表是可以审计的语句类型：

语句选项
SQL操作

ALTER SYSTEM
所有ALTER SYSTEM选项，例如，动态改变实例参数，切换到下一个日志文件组，以及终止用户会话

CLUSTER
CREATE、ALTER、DROP或TRUNCATE集群

CONTEXT
CREATE CONTEXT或DROP CONTEXT

DATABASE LINK
CREATE或DROP数据库链接

DIMENSION
CREATE、ALTER或DROP维数

DIRECTORY
CREATE或DROP目录

INDEX
CREATE、ALTER或DROP索引

MATERIALIZED VIEW
CREATE、ALTER或DROP物化视图

NOT EXISTS
由于不存在的引用对象而造成的 SQL 语句的失败

PROCEDURE
CREATE或DROP FUNCTION、LIBRARY、PACKAGE、PACKAGE BODY或PROCEDURE

PROFILE
CREATE、ALTER或DROP配置文件

PUBLIC DATABASE LINK
CREATE或DROP公有数据库链接

PUBLIC SYNONYM
CREATE或DROP公有同义词

ROLE
CREATE、ALTER、DROP或SET角色

ROLLBACK SEGMENT
CREATE、ALTER或DROP回滚段

SEQUENCE
CREATE或DROP序列

SESSION
登录和退出

SYNONYM
CREATE或DROP同义词

SYSTEM AUDIT
系统权限的AUDIT或NOAUDIT

SYSTEM GRANT
GRANT或REVOKE系统权限和角色

TABLE
CREATE、DROP或TRUNCATE表

TABLESPACE
CREATE、ALTER或DROP表空间

TRIGGER
CREATE、ALTER(启用/禁用)、DROP触发器；具有ENABLE ALL TRIGGERS或DISABLE ALL TRIGGERS的ALTER TABLE

TYPE
CREATE、ALTER和DROP类型以及类型主体

USER
CREATE、ALTER或DROP用户

VIEW
CREATE或DROP视图

ALTER SEQUENCE
任何ALTER SEQUENCE命令

ALTER TABLE
任何ALTER TABLE命令

COMMENT TABLE
添加注释到表、视图、物化视图或它们中的任何列

DELETE TABLE
删除表或视图中的行

EXECUTE PROCEDURE
执行程序包中的过程、函数或任何变量或游标

GRANT DIRECTORY
GRANT或REVOKE DIRECTORY对象上的权限

GRANT PROCEDURE
GRANT或REVOKE过程、函数或程序包上的权限

GRANT SEQUENCE
GRANT或REVOKE序列上的权限

GRANT TABLE
GRANT或REVOKE表、视图或物化视图上的权限

GRANT TYPE
GRANT或REVOKE TYPE上的权限

INSERT TABLE
INSERT INTO表或视图

LOCK TABLE
表或视图上的LOCK TABLE命令

SELECT SEQUENCE
引用序列的CURRVAL或NEXTVAL的任何命令

SELECT TABLE
SELECT FROM 表、视图或物化视图

UPDATE TABLE
在表或视图上执行UPDATE

例如：

可以使用如下命令审计 wgx 的查询操作：

```java
SQL>` audit index by kshelton; Audit succeeded. 
```

打开另一个窗口，执行如下命令：

```java
SQL>` create index job_title_idx on hr.jobs(job_title); Index created.
```

检查数据字典视图DBA_AUDIT_TRAIL中的审计跟踪，可以看到KSHELTON实际上在8月12日的5:15 P.M.创建了索引：

```java
SQL>` select username, to_char(timestamp,'MM/DD/YY HH24:MI') Timestamp, 2      obj_name, action_name, sql_text from dba_audit_trail 3  where username = 'KSHELTON';USERNAME    TIMESTAMP        OBJ_NAME         ACTION_NAME      SQL_TEXT ---------  --------------  --------------  --------------  ---------------- KSHELTON    08/12/07 17:15  JOB_TITLE_IDX   CREATE INDEX     create index hr. job_title_idx on hr.jobs(job_title)1 row selected.
```

注意：

从Oracle Database 11g开始，只有在初始参数AUDIT_TRAIL被设置为DB_EXTENDED时，才填充DBA_AUDIT_TRAIL中的列SQL_TEXT和SQL_BIND。默认情况下，AUDIT_TRAIL的值是DB。

为了关闭HR.JOBS表上KSHELTON的审计，可以使用noaudit命令，如下所示：

```java
SQL>` noaudit index by kshelton; Noaudit succeeded.
```

也可能希望按常规方式审计成功的和不成功的登录，这需要两个audit命令：

```java
SQL>` audit session whenever successful; Audit succeeded. SQL>` audit session whenever not successful; Audit succeeded. 
```

### 2、权限审计

审计系统权限具有与语句审计相同的基本语法，但审计系统权限是在sql_statement_clause中，而不是在语句中，指定系统权限。

例如，可能希望将ALTER TABLESPACE权限授予所有的DBA，但希望在发生这种情况时生成审计记录。启用对这种权限的审计的命令看起来类似于语句审计：

```java
SQL>` audit alter tablespace by access whenever successful; Audit succeeded.
```

每次成功使用ALTER TABLESPACE权限时，都会将一行内容添加到SYS.AUD$。

使用SYSDBA和SYSOPER权限或者以SYS用户连接到数据库的系统管理员可以利用特殊的审计。为了启用这种额外的审计级别，可以设置初始参数AUDIT_SYS_OPERATIONS为TRUE。这种审计记录发送到与操作系统审计记录相同的位置。因此，这个位置是和操作系统相关的。当使用其中一种权限时执行的所有SQL语句，以及作为用户SYS执行的任何SQL语句，都会发送到操作系统审计位置。

### 3、对象审计

审计对各种模式对象的访问看起来类似于语句审计和权限审计：

```java
AUDIT schema_object_clause BY {SESSION | ACCESS} WHENEVER [NOT] SUCCESSFUL; 
```

schema_object_clause 指定对象访问的类型以及访问的对象。可以审计特定对象上14种不同的操作类型，下表中列出了这些操作。

对象选项
说明

ALTER
改变表、序列或物化视图

AUDIT
审计任何对象上的命令

COMMENT
添加注释到表、视图或物化视图

DELETE
从表、视图或物化视图中删除行

EXECUTE
执行过程、函数或程序包

FLASHBACK
执行表或视图上的闪回操作

GRANT
授予任何类型对象上的权限

INDEX
创建表或物化视图上的索引

INSERT
将行插入表、视图或物化视图中

LOCK
锁定表、视图或物化视图

READ
对DIRECTORY对象的内容执行读操作

RENAME
重命名表、视图或过程

SELECT
从表、视图、序列或物化视图中选择行

UPDATE
更新表、视图或物化视图

如果希望审计HR.JOBS表上的所有insert和update命令，而不管谁正在进行更新，则每次该动作发生时，都可以使用如下所示的audit命令：

```java
SQL>` audit insert, update on hr.jobs by access whenever successful; Audit successful.
```

用户KSHELTON决定向HR.JOBS表添加两个新行：

```java
SQL>` insert into hr.jobs (job_id, job_title, min_salary, max_salary) 2  values ('IN_CFO','Internet Chief Fun Officer', 7500, 50000); 1 row created.SQL>` insert into hr.jobs (job_id, job_title, min_salary, max_salary) 2  values ('OE_VLD','Order Entry CC Validation', 5500, 20000); 1 row created.
```

查看DBA_AUDIT_TRAIL视图，可以看到KSHELTON会话中的两个insert命令：

**4.细粒度的审计**

从Oracle9i开始，通过引入细粒度的对象审计，或称为FGA，审计变得更为关注某个方面，并且更为精确。由称为DBMS_FGA的PL/SQL程序包实现FGA。

使用标准的审计，可以轻松发现访问了哪些对象以及由谁访问，但无法知道访问了哪些行或列。细粒度的审计可解决这个问题，它不仅为需要访问的行指定谓词(或where子句)，还指定了表中访问的列。通过只在访问某些行和列时审计对表的访问，可以极大地减少审计表条目的数量。

程序包DBMS_FGA具有4个过程：

ADD_POLICY
添加使用谓词和审计列的审计策略

DROP_POLICY
删除审计策略

DISABLE_POLICY
禁用审计策略，但保留与表或视图关联的策略

ENABLE_POLICY
启用策略

用户TAMARA通常每天访问HR.EMPLOYEES表，查找雇员的电子邮件地址。系统管理员怀疑TAMARA正在查看经理们的薪水信息，因此他们建立一个FGA策略，用于审计任何经理对SALARY列的任何访问：

```java
begin dbms_fga.add_policy( object_schema =>`   'HR', object_name =>`     'EMPLOYEES', policy_name =>`     'SAL_SELECT_AUDIT', audit_condition =>` 'instr(job_id,''_MAN'') >` 0', audit_column =>`    'SALARY' ); end;
```

可以使用数据字典视图DBA_FGA_AUDIT_TRAIL访问细粒度审计的审计记录。如果一般需要查看标准的审计行和细粒度的审计行，则数据字典视图DBA_COMMON_AUDIT_TRAIL结合了这两种审计类型中的行。

继续看示例，用户TAMARA运行了如下两个SQL查询：

```java
SQL>` select employee_id, first_name, last_name, email from hr.employees 2     where employee_id = 114;EMPLOYEE_ID FIRST_NAME           LAST_NAME                 EMAIL ----------- ------------------ ---------------------   -------------- 114    Den                   Raphaely                  DRAPHEAL1 row selected.SQL>` select employee_id, first_name, last_name, salary from hr.employees 2     where employee_id = 114;EMPLOYEE_ID FIRST_NAME           LAST_NAME                     SALARY ----------- ------------------ -----------------------   ---------- 114    Den                   Raphaely                       110001 row selected.
```

第一个查询访问经理信息，但没有访问SALARY列。第二个查询与第一个查询相同，但是访问了SALARY列，因此触发了FGA策略，从而在审计跟踪中生成了一行：

```java
SQL>` select to_char(timestamp,'mm/dd/yy hh24:mi') timestamp, 2      object_schema, object_name, policy_name, statement_type 3  from dba_fga_audit_trail 4  where db_user = 'TAMARA';TIMESTAMP        OBJECT_SCHEMA  OBJECT_NAME     POLICY_NAME       STATEMENT_TYPE --------------  -------------  -------------  ---------------- -------------- 08/12/07 18:07  HR               EMPLOYEES       SAL_SELECT_AUDIT SELECT1 row selected.
```

因为在本章前面的VPD示例中建立了细粒度的访问控制来阻止对SALARY列的未授权访问，因此需要加倍检查策略函数，确保仍然正确限制了SALARY信息。细粒度的审计以及标准审计是确保首先正确建立授权策略的好方法。

**5.与审计相关的数据字典视图**

下表包含了与审计相关的数据字典视图。

数据字典视图
说 明

AUDIT_ACTIONS
包含审计跟踪动作类型代码的描述，例如INSERT、DROP VIEW、DELETE、LOGON和LOCK

DBA_AUDIT_OBJECT
与数据库中对象相关的审计跟踪记录

DBA_AUDIT_POLICIES
数据库中的细粒度审计策略

DBA_AUDIT_SESSION
与CONNECT和DISCONNECT相关的所有审计跟踪记录

DBA_AUDIT_STATEMENT
与GRANT、REVOKE、AUDIT、NOAUDIT和ALTER SYSTEM命令相关的审计跟踪条目

DBA_AUDIT_TRAIL
包含标准审计跟踪条目。USER_AUDIT_TRAILUSER_TRAIL_AUDIT只包含已连接用户的审计行

DBA_FGA_AUDIT_TRAIL
细粒度审计策略的审计跟踪条目

(续表)

数据字典视图
说 明

DBA_COMMON_AUDIT_TRAIL
将标准的审计行和细粒度的审计行结合在一个视图中

DBA_OBJ_AUDIT_OPTS
对数据库对象生效的审计选项

DBA_PRIV_AUDIT_OPTS
对系统权限生效的审计选项

DBA_STMT_AUDIT_OPTS
对语句生效的审计选项

**6.保护审计跟踪**

审计跟踪自身需要受到保护，特别是在非系统用户必须访问表SYS.AUD$时。内置的角色DELETE_ANY_CATALOG是非SYS用户可以访问审计跟踪的一种方法(例如，归档和截取审计跟踪，以确保它不会影响到SYS表空间中其他对象的空间需求)。

为了建立对审计跟踪自身的审计，以SYSDBA身份连接到数据库，并运行下面的命令：

```java
SQL>` audit all on sys.aud$ by access; Audit succeeded.
```

现在，所有针对表SYS.AUD 的 动 作 ， 包 括 s e l e c t 、 i n s e r t 、 u p d a t e 和 d e l e t e ， 都 记 录 在 S Y S . A U D 的动作，包括select、insert、update和delete，都记录在SYS.AUD 的动作，包括select、insert、update和delete，都记录在SYS.AUD自身中。但是，您可能会问，如果某个人删除了标识对表SYS.AUD 访 问 的 审 计 记 录 ， 这 时 会 发 生 什 么 ？ 此 时 将 删 除 表 中 的 行 ， 但 接 着 插 入 另 一 行 ， 记 录 行 的 删 除 。 因 此 ， 总 是 存 在 一 些 针 对 S Y S . A U D 访问的审计记录，这时会发生什么？此时将删除表中的行，但接着插入另一行，记录行的删除。因此，总是存在一些针对SYS.AUD 访问的审计记录，这时会发生什么？此时将删除表中的行，但接着插入另一行，记录行的删除。因此，总是存在一些针对SYS.AUD表的(有意的或偶然的)活动的证据。此外，如果将AUDIT_SYS _OPERATIONS设置为True，使用as sysdba、as sysoper或以SYS自身连接的任何会话将记录到操作系统审计位置中，甚至Oracle DBA可能都无法访问该位置。因此，有许多合适的安全措施，用于确保记录数据库中所有权限的活动，以及隐藏该活动的任何尝试。

**7.启用增强的审计**

从Oracle Database 11g开始，数据库配置助手(Database Configuration Assistant，DBCA)很容易启用默认的(增强的)审计。虽然记录审计信息有一些系统开销，但兼容性需求(例如，Sarbanes-Oxley法案中规定的兼容性需求)要求严格监控所有业务操作，包括数据库中与安全相关的操作。

可以在创建数据库时或在数据库已经创建之后使用DBCA配置默认审计。如果已经改变了很多审计设置，并想要将审计选项重置为基线值，则在数据库已创建之后使用DBCA配置默认审计就非常有用。

除将初始参数AUDIT_TRAIL的值设置为DB外，默认审计设置还审计audit role命令本身。另外，在Audited Privileges选项卡的Oracle Enterprise Manager Audit Settings页面中，可以查看默认的审计权限。

补充说明：

所有类型的审计都使用audit命令来打开审计，使用noaudit命令来关闭审计。对于语句审计，audit命令的格式看起来如下所示：

```java
dba_audit_trail：保存所有的audit trail，实际上是一个基于aud$的视图。
dba_audit_session, dba_audit_object, dba_audit_statement 都是 dba_audit_trail 的子集。
dba_stmt_audit_opts：查看 statement 审计级别的 audit options
dba_obj_audit_opts, dba_priv_audit_opts 视图功能与之类似
all_def_audit_opts：查看数据库用 on default 子句设置了哪些默认对象审计
```

## 二、诊使用远程登录登录时失败（使用远程登录必须输入正确的用户名和密码）：

```java

```

## 二、

## 一、审计文件

记录数据库中的可疑操作：sys 的连接和数据库的启动、停库等。

审计文件的位置：

```java
SQL> show parameter audit_file_dest;
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
audit_file_dest 		     string	 /u01/app/oracle/admin/orcl/adump
```

如果审计目录不存在，数据库将无法启动。

```java

```

使用远程登录登录时失败（使用远程登录必须输入正确的用户名和密码）：

```java

```

## 二、诊断文件

（1）修改 $ORACLE_HOME/network/admin/sqlnet.ora 文件，如果该文件不存在，表示开启操作系统验证，则新建一个文件。

```java

```

（2）修改 remote_login_passwordfile 参数的取值：

```java

```

### 总结：

### （1）sqlnet.authentication_services = all，同时 Remote_login_passwordfile = NONE，为操作系统验证

## 三、用户进程跟踪文件

截获user process 所发出的信息：

```java

```

### （2）Sqlnet.authentication_services = NONE， 同时 Remote_login_passwordfile = EXCLUSIVE | SHARED，为密码文件验证

```java

```

### （3）Sqlnet.authentication_services = all，同时 Remote_login_passwordfile = EXCLUSIVE | SHARED，为操作系统认证和密码文件认证同时起作用

如下所示：

```java

```

## 二、密码文件验证

密码文件的位置与名称为：$ORACLE_HOME/dbs/orapw：

```java

```

查看密码文件中的用户信息：

```java

```

使用scott 用户登录数据库：

```java

```

重建密码文件：可以解决密码文件损坏，口令丢失

```java

```

## 三、数据库验证

数据库验证需要启动数据库，通过读取数据字典确定用户的用户名和密码是否正确。

## 四、操作系统验证和密码文件验证总结

（1）登录命令：conn / as sysdba，本机登陆，使用操作系统验证，有无监听都可以。

（2）登录命令：conn sys/password as sysdba，本机登陆，使用密码文件验证，有无监听都可以。

（3）登录命令：conn sys/password@dbanote as sysdba，本机登录和远程登录都可以，使用密码文件认证，必须有监听。

## 三、和审计有关的视图

```java
dba_audit_trail：保存所有的audit trail，实际上是一个基于aud$的视图。
dba_audit_session, dba_audit_object, dba_audit_statement 都是 dba_audit_trail 的子集。
dba_stmt_audit_opts：查看 statement 审计级别的 audit options
dba_obj_audit_opts, dba_priv_audit_opts 视图功能与之类似
all_def_audit_opts：查看数据库用 on default 子句设置了哪些默认对象审计
```

## 二、
