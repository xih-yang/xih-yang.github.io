# 09、Oracle 教程 - Oracle 的跟踪文件（Trace files）
- 来源：https://ddkk.com/zhuanlan/db/oracle/1/9.html
- 分类：缓存数据库
- 分组：教程目录
跟踪文件包含了大量而详细的诊断和调试信息。通过对跟踪文件的分析，可以定位问题、分析问题和解决问题。跟踪文件分为以下三类：

## 一、警报日志文件

记录数据库在启动、关闭和运行期间后台进程的活动情况。如表空间创建、回滚段创建、某些 alter 命令、日志切换、错误消息等。

警报日志的名称：alert_.log。报警日志主要保存以下信息：

（1）数据库的启动、停止；

（2）记录所有的非默认值的初始化参数；

（3）记录日志的切换情况；

（4）记录检查点的完成情况；

（5）记录数据库工作时遭遇的错误信息。

在数据库出现故障时，应首先查看该文件。警报日志文件的位置由 BACKGROUND_DUMP_DEST 参数决定：

```java
SQL> show parameter BACKGROUND_DUMP_DEST
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
background_dump_dest	  string	 /u01/app/oracle/diag/rdbms/orcl/orcl1/trace
```

查看警报日志文件：

```java
[oracle@rac1 adump]$ cd /u01/app/oracle/admin/orcl/adump
[oracle@rac1 trace]$ ll alert_orcl1.log 
-rw-r----- 1 oracle asmadmin 387777 Aug  6 22:31 alert_orcl1.log
[oracle@rac1 trace]$ cat alert_orcl1.log 
Starting up:
Oracle Database 11g Enterprise Edition Release 11.2.0.4.0 - 64bit Production
With the Partitioning, Real Application Clusters, OLAP, Data Mining
and Real Application Testing options.
ORACLE_HOME = /u01/app/oracle/product/11.2.0/db_1
System name:	Linux
Node name:	rac1
Release:	2.6.32-431.el6.x86_64
Version:	#1 SMP Fri Nov 22 03:15:09 UTC 2013
Machine:	x86_64
VM name:	VMWare Version: 6
Using parameter settings in server-side pfile /u01/app/oracle/product/11.2.0/db_1/dbs/initorcl1.ora
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
  audit_file_dest          = "/u01/app/oracle/admin/orcl/adump"
  audit_trail              = "DB"
  db_name                  = "orcl"
  open_cursors             = 300
  diagnostic_dest          = "/u01/app/oracle"
Cluster communication is configured to use the following interface(s) for this instance
  169.254.44.235
cluster interconnect IPC version:Oracle UDP/IP (generic)
.....
QMNC started with pid=44, OS id=120460 
Fri Aug 06 23:28:49 2021
Completed: ALTER DATABASE OPEN
```

## 二、后台进程跟踪文件

DBWR、LGWR、SMON 等后台进程创建的后台跟踪文件。后台进程跟踪文件也保存在BACKGROUND_DUMP_DEST参数指定的目录中，文件名格式为：_进程名_进程号.trc

查看后台进程 pmon 对应的跟踪文件：

```java
[oracle@rac1 trace]$ ll *pmon*
-rw-r----- 1 oracle asmadmin 987 Aug  6 04:12 orcl1_pmon_10408.trc
-rw-r----- 1 oracle asmadmin  69 Aug  6 04:12 orcl1_pmon_10408.trm
-rw-r----- 1 oracle asmadmin 989 Aug  6 00:26 orcl1_pmon_119087.trc
-rw-r----- 1 oracle asmadmin  70 Aug  6 00:26 orcl1_pmon_119087.trm
-rw-r----- 1 oracle asmadmin 982 Aug  6 03:50 orcl1_pmon_119403.trc
-rw-r----- 1 oracle asmadmin  81 Aug  6 03:50 orcl1_pmon_119403.trm
-rw-r----- 1 oracle asmadmin 980 Aug  6 17:25 orcl1_pmon_14036.trc
-rw-r----- 1 oracle asmadmin  80 Aug  6 17:25 orcl1_pmon_14036.trm
-rw-r----- 1 oracle asmadmin 978 Apr 21 18:06 orcl1_pmon_2535.trc
-rw-r----- 1 oracle asmadmin  68 Apr 21 18:06 orcl1_pmon_2535.trm
-rw-r----- 1 oracle asmadmin 980 Aug  5 23:25 orcl1_pmon_75818.trc
-rw-r----- 1 oracle asmadmin  89 Aug  5 23:25 orcl1_pmon_75818.trm
-rw-r----- 1 oracle asmadmin 985 Aug  6 04:01 orcl1_pmon_8736.trc
-rw-r----- 1 oracle asmadmin  68 Aug  6 04:01 orcl1_pmon_8736.trm
-rw-r----- 1 oracle asmadmin 980 Aug  6 19:21 orcl1_pmon_96358.trc
-rw-r----- 1 oracle asmadmin  69 Aug  6 19:21 orcl1_pmon_96358.trm
-rw-r----- 1 oracle asmadmin 985 Aug  6 04:07 orcl1_pmon_9757.trc
-rw-r----- 1 oracle asmadmin  68 Aug  6 04:07 orcl1_pmon_9757.trm
```

## 三、用户进程跟踪文件

由连接到 Oracle 的用户进程生成的用户跟踪文件。这些文件仅在用户会话期间遇到错误时产生。用户可以通过执行Oracle 跟踪事件来生成该类文件。用户跟踪文件保存在 SER_DUMP_DEST 参数指定的目录中，文件命名格式为：_ora_服务进程的spid.trc。

### 1、查看某个连接对应的用户进程跟踪文件

（1）使用 scott 用户登录，查看 scott 用户对应的 spid。

```java
-- 查询 scott 用户对应的 paddr
SQL> select sid, paddr
from v$session
where username = 'SCOTT';
       SID PADDR
---------- ----------------
	47 00000000914C7F68
-- 查看 paddr 对应的 spid（系统服务进程号）
SQL> select spid from v$process where addr= '00000000914C7F68';
SPID
------------------------
122267
```

（2）查看进程号 122267 对应的进程

```java
[oracle@rac1 trace]$ ps -ef|grep 122267
oracle   122267 122266  0 Aug06 ?        00:00:01 oracleorcl1 (DESCRIPTION=(LOCAL=YES)(ADDRESS=(PROTOCOL=beq)))
oracle   123693  11512  0 00:02 pts/6    00:00:00 grep 122267
```

（3）截获用户进程发出的 sql 语句

```java
-- 查看连接用户的 sdi 和 serial#
select sid, serial#,username,machine
from v$session
where username = 'SCOTT';
    SID    SERIAL# USERNAME        MACHINE
----------------------------------------------------------------
	47	   19 SCOTT                rac1
-- 打开 sql 跟踪：exec dbms_system.set_sql_trace_in_session(sid, serial#, true)
-- 关闭 sql 跟踪：exec dbms_system.set_sql_trace_in_session(sid, serial#, false)
-- 打开 scott 用户的 sql 跟踪
SQL> exec dbms_system.set_sql_trace_in_session(47, 19, true);
PL/SQL procedure successfully completed.
-- 使用 scott 用户，进行如下操作：
SQL> show user
USER is "SCOTT"
SQL> select empno,ename,sal from emp where sal > 3000;
     EMPNO ENAME	     SAL
---------- ---------- ----------
      7839 KING 	    5000
SQL> update sal = sal*1.1 where deptno = 10;
update sal = sal*1.1 where deptno = 10
           *
ERROR at line 1:
ORA-00971: missing SET keyword
SQL> update emp set sal = sal*1.1 where deptno = 10;
3 rows updated.
SQL> commit;
Commit complete.
-- 停止 scott 用户的 sql 跟踪
SQL> exec dbms_system.set_sql_trace_in_session(47, 19, false);
PL/SQL procedure successfully completed.
```

（4）查看用户进程跟踪文件

```java
[oracle@rac1 trace]$ ll *122267*
-rw-r----- 1 oracle asmadmin 57489 Aug  7 00:13 orcl1_ora_122267.trc
-rw-r----- 1 oracle asmadmin  1243 Aug  7 00:13 orcl1_ora_122267.trm
```

### 2、查看用户进程跟踪文件的内容

可以直接打开用户进程跟踪文件，但可读性不好。可以使用 tkprof 命令对用户进程跟踪文件格式化。

```java
tkprof 用户进程跟踪文件 文本文件
sys = no|yes
# 说明：
#（1）用户进程跟踪文件：需要格式化的用户进程跟踪文件名称；
#（2）文本文件：把格式化以后的用户进程跟踪文件信息写入文本文件；
#（3）sys=no：禁止将 SYS 用户所发布的 SQL 语句列表到输出文件中。
[oracle@rac1 trace]$ tkprof orcl1_ora_122267.trc user1.txt sys=no
TKPROF: Release 11.2.0.4.0 - Development on Sat Aug 7 00:27:44 2021
Copyright (c) 1982, 2011, Oracle and/or its affiliates.  All rights reserved.
```

查看经过格式化之后的用户进程跟踪文件：

```java
[oracle@rac1 trace]$ cat user1.txt
TKPROF: Release 11.2.0.4.0 - Development on Sat Aug 7 00:27:44 2021
Copyright (c) 1982, 2011, Oracle and/or its affiliates.  All rights reserved.
Trace file: orcl1_ora_122267.trc
Sort options: default
********************************************************************************
count    = number of times OCI procedure was executed
cpu      = cpu time in seconds executing 
elapsed  = elapsed time in seconds executing
disk     = number of physical reads of buffers from disk
query    = number of buffers gotten for consistent read
current  = number of buffers gotten in current mode (usually for update)
rows     = number of rows processed by the fetch or execute call
********************************************************************************
The following statement encountered a error during parse:
update sal = sal*1.1 where deptno = 10
Error encountered: ORA-00971
********************************************************************************
SQL ID: 503hv7afjyx4k Plan Hash: 3956160932
select empno,ename,sal 
from
 emp where sal > 3000
call     count       cpu    elapsed       disk      query    current        rows
------- ------  -------- ---------- ---------- ---------- ----------  ----------
Parse        1      0.03       0.09          0          0          0           0
Execute      1      0.00       0.00          0          0          0           0
Fetch        2      0.00       0.00          6          7          0           1
------- ------  -------- ---------- ---------- ---------- ----------  ----------
total        4      0.03       0.09          6          7          0           1
Misses in library cache during parse: 1
Optimizer mode: ALL_ROWS
Parsing user id: 83  
Number of plan statistics captured: 1
Rows (1st) Rows (avg) Rows (max)  Row Source Operation
---------- ---------- ----------  ---------------------------------------------------
    1      1      1  TABLE ACCESS FULL EMP (cr=7 pr=6 pw=0 time=9339 us cost=3 size=98 card=7)
********************************************************************************
SQL ID: gvud3kbwhynnt Plan Hash: 1494045816
update emp set sal = sal*1.1 
where
 deptno = 10
call     count       cpu    elapsed       disk      query    current        rows
------- ------  -------- ---------- ---------- ---------- ----------  ----------
Parse        1      0.00       0.00          0          0          0           0
Execute      1      0.00       0.00          0          6          2           3
Fetch        0      0.00       0.00          0          0          0           0
------- ------  -------- ---------- ---------- ---------- ----------  ----------
total        2      0.00       0.00          0          6          2           3
Misses in library cache during parse: 1
Optimizer mode: ALL_ROWS
Parsing user id: 83  
Number of plan statistics captured: 1
Rows (1st) Rows (avg) Rows (max)  Row Source Operation
---------- ---------- ----------  ---------------------------------------------------
  0       0       0  UPDATE  EMP (cr=6 pr=0 pw=0 time=214 us)
  3       3       3   TABLE ACCESS FULL EMP (cr=6 pr=0 pw=0 time=46 us cost=3 size=35 card=5)
********************************************************************************
SQL ID: 23wm3kz7rps5y Plan Hash: 0
commit
call     count       cpu    elapsed       disk      query    current        rows
------- ------  -------- ---------- ---------- ---------- ----------  ----------
Parse        1      0.00       0.00          0          0          0           0
Execute      1      0.00       0.00          0          0          1           0
Fetch        0      0.00       0.00          0          0          0           0
------- ------  -------- ---------- ---------- ---------- ----------  ----------
total        2      0.00       0.00          0          0          1           0
Misses in library cache during parse: 0
Parsing user id: 83  
********************************************************************************
OVERALL TOTALS FOR ALL NON-RECURSIVE STATEMENTS
call     count       cpu    elapsed       disk      query    current        rows
------- ------  -------- ---------- ---------- ---------- ----------  ----------
Parse        3      0.03       0.09          0          0          0           0
Execute      3      0.00       0.00          0          6          3           3
Fetch        2      0.00       0.00          6          7          0           1
------- ------  -------- ---------- ---------- ---------- ----------  ----------
total        8      0.03       0.10          6         13          3           4
Misses in library cache during parse: 2
OVERALL TOTALS FOR ALL RECURSIVE STATEMENTS
call     count       cpu    elapsed       disk      query    current        rows
------- ------  -------- ---------- ---------- ---------- ----------  ----------
Parse       15      0.04       0.04          0          0          0           0
Execute    136      0.08       0.13          0          0          2           1
Fetch      149      0.03       0.13         21        419          0         841
------- ------  -------- ---------- ---------- ---------- ----------  ----------
total      300      0.16       0.31         21        419          2         842
Misses in library cache during parse: 15
Misses in library cache during execute: 15
    3  user  SQL statements in session.
   16  internal SQL statements in session.
   19  SQL statements in session.
********************************************************************************
Trace file: orcl1_ora_122267.trc
Trace file compatibility: 11.1.0.7
Sort options: default
       1  session in tracefile.
       3  user  SQL statements in trace file.
      16  internal SQL statements in trace file.
      19  SQL statements in trace file.
      19  unique SQL statements in trace file.
     619  lines in trace file.
      54  elapsed seconds in trace file.
```
