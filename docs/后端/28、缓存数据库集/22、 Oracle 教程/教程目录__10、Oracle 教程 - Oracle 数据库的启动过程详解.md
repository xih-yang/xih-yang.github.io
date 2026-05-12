# 10、Oracle 教程 - Oracle 数据库的启动过程详解
- 来源：https://ddkk.com/zhuanlan/db/oracle/1/10.html
- 分类：缓存数据库
- 分组：教程目录
Oracle 数据库的启动分为三个阶段：

shutdown —> nomount —> mount —> open

## 一、启动数据库到 nomount 阶段

数据库启动到 nomount 阶段时，将启动数据库实例， 读取参数文件，写审计文件和警报日志，不加载数据库。因此，数据库启动到 nomount 阶段需要有正确的参数文件，需要正确的审计目录（由参数 audit_file_dest 指定）和跟踪文件目录（由 BACKGROUND_DUMP_DEST 参数指定）。

数据库从关闭状态启动到 nomount 状态会执行如下操作：

（1）按如下顺序读取初始化参数文件：spfile.ora —> spfile.ora —> init.ora

（2）分配SGA、启动后台进程；

（3）启动警报日志文件（alert_.log）和跟踪文件。

在nomount 阶段可以进行如下操作：

（1）可以修改参数；

（2）可以查看内存和后台进程的信息；

（3）可以创建数据库；

（4）可以重建控制文件。

启动数据库到 nomount 阶段的方法如下：

```java
-- shutdown --> nomount
-- startup nomount
SQL> startup nomount
ORACLE instance started.
Total System Global Area  835104768 bytes
Fixed Size		    2257840 bytes
Variable Size		  603982928 bytes
Database Buffers	  226492416 bytes
Redo Buffers		    2371584 bytes
SQL> select status from v$instance;
STATUS
------------
STARTED
```

查看警告日志关于 startup nomount 的信息：

```java
[oracle@rac1 trace]$ cat alert_orcl1.log 
........
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
.........
ALTER SYSTEM SET local_listener=' (ADDRESS=(PROTOCOL=TCP)(HOST=192.168.1.101)(PORT=1521))' SCOPE=MEMORY SID='orcl1';
Sat Aug 07 01:07:21 2021
Decreasing number of real time LMS from 1 to 0
```

由于nomount 状态下数据库没有加载，因此无法访问数据字典。nomount 状态下参数文件已经加载，可以查看参数。

```java
-- 无法访问数据字典
SQL> select name from v$datafile;
select name from v$datafile
                 *
ERROR at line 1:
ORA-01507: database not mounted
-- 数据库参数已经加载
SQL> show parameter name;
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
cell_offloadgroup_name		     string
db_file_name_convert		     string
db_name 			     string	 orcl
db_unique_name			     string	 orcl
global_names			     boolean	 FALSE
instance_name			     string	 orcl1
lock_name_space 		     string
log_file_name_convert		     string
processor_group_name		     string
service_names			     string	 orcl
```

## 二、启动数据库到 mount 阶段

数据库启动到 mount 阶段时，将启动数据库实例，加载控制文件的信息到内存，加载数据库并保持数据库关闭状态。数据库启动到 mount 阶段需要有正确的控制文件。

数据库从 nomount 状态启动到 mount 状态会执行如下操作：

（1）将先前启动的实例与数据库相关联；

（2）根据参数文件中保存的控制文件的位置找到控制文件并打开；

（3）从控制文件中读取数据文件及联机日志文件的位置与名称。（此时并不检查数据文件与联机日志文件是否存在）。

数据库启动到 mount 状态可以进行如下操作：

（1）可以备份、还原、恢复；

（2）可以查看所有的动态视图；

（3）可以移动数据库文件；

（4）可以进行数据库文件的 offline；

（5）可以打开和关闭归档模式；

（6）可以打开和关闭闪回数据库的功能。

启动数据库到 nomount 阶段的方法如下：

```java
-- 数据库处于关闭状态（shutdown --> mount）
startup mount;
-- 数据库处于 nomount 状态（nomount --> mount）
alter database mount;
SQL> alter database mount;
Database altered.
SQL> select status from v$instance;
STATUS
------------
MOUNTED
```

数据库启动到 mount 阶段可以访问所有的动态视图：

```java
SQL> select name from v$datafile;
NAME
--------------------------------------------------------------------------------
+DATA/orcl/datafile/system.256.1070471889
+DATA/orcl/datafile/sysaux.257.1070471889
+DATA/orcl/datafile/undotbs1.258.1070471891
+DATA/orcl/datafile/users.259.1070471891
+DATA/orcl/datafile/undotbs2.264.1070472143
```

## 三、启动数据库到 open 阶段

数据库启动到 open 阶段时，将启动数据库实例，加载联机日志和数据文件并打开数据库。数据库启动到 open 阶段需要有正确的数据文件和联机日志文件。数据库处于 open 状态时可以对数据库进行所有正常的操作。

数据库从 mount 状态启动到 open 状态会执行如下操作：

（1）打开数据文件；

（2）打开联机日志文件（打开数据库时如果数据文件或联机日志文件中的任何一个不存在，会出现错误）；

（3）Oracle 数据库验证数据文件和联机日志文件是否能够打开，并检验数据库的一致性。如果不一致，SMON 后台进程将启动实例恢复。

启动数据库到 open 阶段的方法如下：

```java
-- 数据库处于关闭状态（shutdown --> open）
startup
-- 数据库处于 nomount 状态（nomount --> mount）
alter database mount;
alter database open;
-- 数据库处于 mount 状态（mount --> mount）
alter database open;
SQL> alter database open;
Database altered.
SQL> select status from v$instance;
STATUS
------------
OPEN
```

## 四、数据库的停止

停库与启动数据库顺序相反，也分三个步骤：（1）关闭数据库（关闭数据文件）；（2）卸载数据库（关闭控制文件， DISMOUNT）；（3）关闭 Oracle 实例（SHUTDOWN）。同时关闭的方式有四种：

### 1、正常停库

数据库正常的关闭方式，以正常停库方式关闭数据库，Oracle 将执行如下操作：

（1）阻止任何用户建立新的连接；

（2）等待查询结束；

（3）等待事务结束；

（4）产生检查点（数据同步）；

（5）关闭联机日志和数据文件；

（6）关闭控制文件；

（7）关闭数据库实例。

正常停库的语法如下：

```java
shutdown normal 
shutdown
```

### 2、事务级停库

以事务级停库方式关闭数据库，Oracle 将执行如下操作：

（1）阻止任何用户建立新的连接；

（2）查询直接终止；

（3）等待事务结束；

（4）产生检查点（数据同步）；

（5）关闭联机日志和数据文件；

（6）关闭控制文件；

（7）关闭数据库实例。

事务级停库的语法如下：

```java
shutdown transactional
```

### 3、立即停库

以立即停库方式关闭数据库，Oracle 将执行如下操作：

（1）阻止任何用户建立新的连接；

（2）查询直接终止；

（3）中断当前事务，回滚未提交事务；

（4）产生检查点（数据同步）；

（5）关闭联机日志和数据文件；

（6）关闭控制文件；

（7）关闭数据库实例。

立即停库的语法如下：

```java
--生产库最常用的停库方式
shutdown immediate
```

### 4、强制停库

当数据库出现故障时，如果以上三种方式都无法正常关闭数据库，则使用强制停库。以这种方法停库，Oracle 将执行如下操作：

（1）强制结束当前正在执行的SQL语句；

（2）任何未递交的事务都不被回退！

以强制停库方式停止数据库之后，数据库可能存在脏数据。重启数据库实例时会自动做实例恢复。

立即停库的语法如下：

```java
shutdown abort
startup force = shutdown abort + startup
startup force nomount = shutdown abort + startup nomount
startup force mount = shutdown abort + startup mount
```
