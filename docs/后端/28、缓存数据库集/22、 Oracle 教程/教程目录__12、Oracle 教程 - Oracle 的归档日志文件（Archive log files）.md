# 12、Oracle 教程 - Oracle 的归档日志文件（Archive log files）
- 来源：https://ddkk.com/zhuanlan/db/oracle/1/12.html
- 分类：缓存数据库
- 分组：教程目录
归档是将联机重做日志以文件的形式保存到硬盘，联机日志归档的前提条件是数据库要处于归档模式。当数据库处于 ARCHIVELOG 模式并进行日志切换时，后台进程 ARCH 会将联机重做日志的内容保存到归档日志中，当数据库出现介质故障时，使用数据文件备份、归档日志和联机重做日志可以完全恢复数据库到正常状态。

Oracle 数据库设置为归档模式之后，如果归档空间写满，数据库的 redo 文件不能归档，会出现数据库挂起的问题，导致 数据库无法使用。

## 一、查看数据库是否为归档模式

```java
-- 节点1：归档模式
SQL> archive log list;
Database log mode	       Archive Mode
Automatic archival	       Enabled
Archive destination	       USE_DB_RECOVERY_FILE_DEST
Oldest online log sequence     14
Next log sequence to archive   17
Current log sequence	       17
SQL> select log_mode from v$database;
LOG_MODE
------------
ARCHIVELOG
-- 节点2：非归档模式
SQL> archive log list;
Database log mode	       No Archive Mode
Automatic archival	       Disabled
Archive destination	       USE_DB_RECOVERY_FILE_DEST
Oldest online log sequence     11
Current log sequence	       14
SQL> select log_mode from v$database;
LOG_MODE
------------
NOARCHIVELOG
```

## 二、打开或关闭归档模式

如果需要打开或关闭归档模式，在数据库处于 mount 状态时使用如下命令：

```java
-- 打开归档模式
alter database archivelog;
-- 关闭归档模式
alter database noarchivelog;
```

把节点2 的数据库设置为归档模式，在节点2 执行如下操作：

### 1、正常停库，然后启动数据库到 mount 状态

```java
SQL> shutdown immediate
Database closed.
Database dismounted.
ORACLE instance shut down.
SQL> startup mount
ORACLE instance started.
Total System Global Area  835104768 bytes
Fixed Size		    2257840 bytes
Variable Size		  583011408 bytes
Database Buffers	  247463936 bytes
Redo Buffers		    2371584 bytes
Database mounted.
```

### 2、使用 alter database 命令打开归档模式

```java
SQL> alter database archivelog;
alter database archivelog
*
ERROR at line 1:
ORA-01126: database must be mounted in this instance and not open in any
instance
-- 命令出现错误的原因：在 rac 集群环境下，要设置一个节点为归档模式或非归档模式，必须关闭其他节点。
-- 关闭节点1
SQL> shutdown immediate
Database closed.
Database dismounted.
ORACLE instance shut down.
-- 在节点2 重新执行如下命令：
SQL> alter database archivelog;
Database altered.
```

### 3、打开数据库，查看归档状态

```java
SQL> alter database open;
Database altered.
SQL> archive log list;
Database log mode	       Archive Mode
Automatic archival	       Enabled
Archive destination	       USE_DB_RECOVERY_FILE_DEST
Oldest online log sequence     13
Next log sequence to archive   16
Current log sequence	       16
-- 数据库已经处于归档状态
```

## 三、配置归档的位置

当数据库处于归档模式时，进行日志切换时后台进程将自动生成归档日志。

### 1、查看归档进程数

初始化参数 LOG_ARCHIVE_MAX_PROCESSES 用于指定最大归档进程个数。通过改变该初始化参数的取值，可以动态地增加或减少归档进程的个数。

```java
-- 查看归档进程数
SQL> show parameter LOG_ARCHIVE_MAX_PROCESSES
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
log_archive_max_processes	     integer	 4
```

### 2、配置归档的位置

可以使用 LOG_ARCHIVE_DEST_n 配置多个归档位置：该参数最多可以指定 10 个归档位置。格式如下：

```java
ALTER SYSTEM SET log_archive_dest_1 = 'location = 路径1';
ALTER SYSTEM SET log_archive_dest_2 = 'location = 路径2';
.....
```

（1）查看归档文件

可知当前归档位置为：+BAK/orcl/archivelog

```java
SQL> select sequence#, name from v$archived_log;
 SEQUENCE# NAME
---------- --------------------------------------------------------------------------
	16 +BAK/orcl/archivelog/2021_08_08/thread_2_seq_16.319.1080028877
	21 +BAK/orcl/archivelog/2021_08_08/thread_1_seq_21.320.1080050731
	22 +BAK/orcl/archivelog/2021_08_08/thread_1_seq_22.318.1080060961
```

（2）修改归档日志的位置为：/home/oracle/archivelog

修改log_archive_dest_1 参数指向定义的归档位置：

```java
SQL> alter system set log_archive_dest_1 = 'location=/home/oracle/archivelog' scope = both sid='*';
System altered.
SQL> archive log list
Database log mode	       Archive Mode
Automatic archival	       Enabled
Archive destination	       /home/oracle/archivelog
Oldest online log sequence     23
Next log sequence to archive   26
Current log sequence	       26
```

（3）手工切换日志：

```java
SQL> alter system switch logfile;
System altered.
SQL> alter system switch logfile;
System altered.
```

（4）重新查看归档日志：

```java
SQL>  select sequence#, name from v$archived_log;
 SEQUENCE# NAME
---------- --------------------------------------------------------------------------------
	16 +BAK/orcl/archivelog/2021_08_08/thread_2_seq_16.319.1080028877
	21 +BAK/orcl/archivelog/2021_08_08/thread_1_seq_21.320.1080050731
	22 +BAK/orcl/archivelog/2021_08_08/thread_1_seq_22.318.1080060961
	23 /home/oracle/archivelog/1_23_1079891135.dbf
	24 /home/oracle/archivelog/1_24_1079891135.dbf
	17 /home/oracle/archivelog/2_17_1079891135.dbf
	18 /home/oracle/archivelog/2_18_1079891135.dbf
	19 /home/oracle/archivelog/2_19_1079891135.dbf
	25 /home/oracle/archivelog/1_25_1079891135.dbf
9 rows selected.
```

## 四、配置归档日志文件的名称格式

初始化参数 LOG_ARCHIVE_FORMAT 用于指定归档日志文件的名称格式。设置该初始化参数时，可以指定以下匹配符：

（1）%s：日志序列号；

（2）%S：日志序列号（带有前导 0）；

（3）%t：线程编号；

（4）%T：线程编号（带有前导 0）；

（5）%a：活动 ID 号；

（6）%d：数据库 ID 号；

（7）%r：RESETLOGS的ID值。

归档日志的文件名称格式设置如下：

```java
SQL> alter system set LOG_ARCHIVE_FORMAT = 'thread_%T_seq_%S.%a.%r.%d' scope = spfile sid='*';
System altered.
-- 重启数据库使设置生效
SQL> shutdown immediate
Database closed.
Database dismounted.
ORACLE instance shut down.
SQL> startup
ORACLE instance started.
Total System Global Area  835104768 bytes
Fixed Size		    2257840 bytes
Variable Size		  570428496 bytes
Database Buffers	  260046848 bytes
Redo Buffers		    2371584 bytes
Database mounted.
Database opened.
```

查看参数 LOG_ARCHIVE_FORMAT 的值：

```java
SQL> show parameter LOG_ARCHIVE_FORMAT
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
log_archive_format		     string	 thread_%T_seq_%S.%a.%r.%d
```

查看归档日志：

```java
SQL> select sequence#, name from v$archived_log;
 SEQUENCE# NAME
---------- ------------------------------------------------------------------------------------
	16 +BAK/orcl/archivelog/2021_08_08/thread_2_seq_16.319.1080028877
	21 +BAK/orcl/archivelog/2021_08_08/thread_1_seq_21.320.1080050731
	22 +BAK/orcl/archivelog/2021_08_08/thread_1_seq_22.318.1080060961
	23 /home/oracle/archivelog/1_23_1079891135.dbf
	24 /home/oracle/archivelog/1_24_1079891135.dbf
	17 /home/oracle/archivelog/2_17_1079891135.dbf
	18 /home/oracle/archivelog/2_18_1079891135.dbf
	19 /home/oracle/archivelog/2_19_1079891135.dbf
	25 /home/oracle/archivelog/1_25_1079891135.dbf
	20 /home/oracle/archivelog/2_20_1079891135.dbf
	26 /home/oracle/archivelog/thread_0001_seq_0000000026.5fd299b3.1079891135.5f4366b6
	27 /home/oracle/archivelog/thread_0001_seq_0000000027.5fd299b3.1079891135.5f4366b6
	21 /home/oracle/archivelog/thread_0002_seq_0000000021.5fd299b3.1079891135.5f4366b6
	22 /home/oracle/archivelog/thread_0002_seq_0000000022.5fd299b3.1079891135.5f4366b6
14 rows selected.
```

## 五、删除归档日志

### 1、手工删除归档日志文件

```java
# 节点1
[oracle@rac1 ~]$ cd /home/oracle/archivelog/
[oracle@rac1 archivelog]$ ll
total 3576
-rw-r----- 1 oracle asmadmin 3208704 Aug  8 18:17 1_23_1079891135.dbf
-rw-r----- 1 oracle asmadmin    1024 Aug  8 18:17 1_24_1079891135.dbf
-rw-r----- 1 oracle asmadmin    1024 Aug  8 18:18 1_25_1079891135.dbf
-rw-r----- 1 oracle asmadmin  437248 Aug  8 19:47 thread_0001_seq_0000000026.5fd299b3.1079891135.5f4366b6
-rw-r----- 1 oracle asmadmin    1024 Aug  8 19:47 thread_0001_seq_0000000027.5fd299b3.1079891135.5f4366b6
[oracle@rac1 archivelog]$ rm 1*
[oracle@rac1 archivelog]$ ll
total 432
-rw-r----- 1 oracle asmadmin 437248 Aug  8 19:47 thread_0001_seq_0000000026.5fd299b3.1079891135.5f4366b6
-rw-r----- 1 oracle asmadmin   1024 Aug  8 19:47 thread_0001_seq_0000000027.5fd299b3.1079891135.5f4366b6
# 节点2
[oracle@rac2 ~]$ cd /home/oracle/archivelog/
[oracle@rac2 archivelog]$ ll
total 33892
-rw-r----- 1 oracle asmadmin 34569216 Aug  8 18:17 2_17_1079891135.dbf
-rw-r----- 1 oracle asmadmin     1024 Aug  8 18:17 2_18_1079891135.dbf
-rw-r----- 1 oracle asmadmin     1024 Aug  8 18:18 2_19_1079891135.dbf
-rw-r----- 1 oracle asmadmin    70144 Aug  8 18:48 2_20_1079891135.dbf
-rw-r----- 1 oracle asmadmin    46080 Aug  8 19:47 thread_0002_seq_0000000021.5fd299b3.1079891135.5f4366b6
-rw-r----- 1 oracle asmadmin     1024 Aug  8 19:47 thread_0002_seq_0000000022.5fd299b3.1079891135.5f4366b6
[oracle@rac2 archivelog]$ rm 2*
[oracle@rac2 archivelog]$ ll
total 52
-rw-r----- 1 oracle asmadmin 46080 Aug  8 19:47 thread_0002_seq_0000000021.5fd299b3.1079891135.5f4366b6
-rw-r----- 1 oracle asmadmin  1024 Aug  8 19:47 thread_0002_seq_0000000022.5fd299b3.1079891135.5f4366b6
```

查看归档日志：

```java
SQL>  select sequence#, name from v$archived_log;
 SEQUENCE# NAME
-----------------------------------------------------------------------------------------------
	16 +BAK/orcl/archivelog/2021_08_08/thread_2_seq_16.319.1080028877
	21 +BAK/orcl/archivelog/2021_08_08/thread_1_seq_21.320.1080050731
	22 +BAK/orcl/archivelog/2021_08_08/thread_1_seq_22.318.1080060961
	23 /home/oracle/archivelog/1_23_1079891135.dbf
	24 /home/oracle/archivelog/1_24_1079891135.dbf
	17 /home/oracle/archivelog/2_17_1079891135.dbf
	18 /home/oracle/archivelog/2_18_1079891135.dbf
	19 /home/oracle/archivelog/2_19_1079891135.dbf
	25 /home/oracle/archivelog/1_25_1079891135.dbf
	20 /home/oracle/archivelog/2_20_1079891135.dbf
	26 /home/oracle/archivelog/thread_0001_seq_0000000026.5fd299b3.1079891135.5f4366b6
	27 /home/oracle/archivelog/thread_0001_seq_0000000027.5fd299b3.1079891135.5f4366b6
	21 /home/oracle/archivelog/thread_0002_seq_0000000021.5fd299b3.1079891135.5f4366b6
	22 /home/oracle/archivelog/thread_0002_seq_0000000022.5fd299b3.1079891135.5f4366b6
14 rows selected.
```

虽然物理文件已经删除，但是归档日志文件的信息还在。

### 2、用 RMAN 删除数据库记录的归档列表信息

（1）进入 rman，查看归档日志文件的状态：

```java
RMAN> list archivelog all;
using target database control file instead of recovery catalog
List of Archived Log Copies for database with db_unique_name ORCL
=====================================================================
Key     Thrd Seq     S Low Time 
------- ---- ------- - ---------
2       1    21      A 07-AUG-21
        Name: +BAK/orcl/archivelog/2021_08_08/thread_1_seq_21.320.1080050731
3       1    22      A 08-AUG-21
        Name: +BAK/orcl/archivelog/2021_08_08/thread_1_seq_22.318.1080060961
4       1    23      A 08-AUG-21
        Name: /home/oracle/archivelog/1_23_1079891135.dbf
5       1    24      A 08-AUG-21
        Name: /home/oracle/archivelog/1_24_1079891135.dbf
9       1    25      A 08-AUG-21
        Name: /home/oracle/archivelog/1_25_1079891135.dbf
11      1    26      A 08-AUG-21
        Name: /home/oracle/archivelog/thread_0001_seq_0000000026.5fd299b3.1079891135.5f4366b6
12      1    27      A 08-AUG-21
        Name: /home/oracle/archivelog/thread_0001_seq_0000000027.5fd299b3.1079891135.5f4366b6
1       2    16      A 07-AUG-21
        Name: +BAK/orcl/archivelog/2021_08_08/thread_2_seq_16.319.1080028877
6       2    17      A 08-AUG-21
        Name: /home/oracle/archivelog/2_17_1079891135.dbf
7       2    18      A 08-AUG-21
        Name: /home/oracle/archivelog/2_18_1079891135.dbf
8       2    19      A 08-AUG-21
        Name: /home/oracle/archivelog/2_19_1079891135.dbf
10      2    20      A 08-AUG-21
        Name: /home/oracle/archivelog/2_20_1079891135.dbf
13      2    21      A 08-AUG-21
        Name: /home/oracle/archivelog/thread_0002_seq_0000000021.5fd299b3.1079891135.5f4366b6
14      2    22      A 08-AUG-21
        Name: /home/oracle/archivelog/thread_0002_seq_0000000022.5fd299b3.1079891135.5f4366b6
```

（2）更新归档日志信息

```java
RMAN> crosscheck archivelog all;
allocated channel: ORA_DISK_1
channel ORA_DISK_1: SID=61 instance=orcl2 device type=DISK
validation succeeded for archived log
archived log file name=+BAK/orcl/archivelog/2021_08_08/thread_1_seq_21.320.1080050731 RECID=2 STAMP=1080065388
validation succeeded for archived log
archived log file name=+BAK/orcl/archivelog/2021_08_08/thread_1_seq_22.318.1080060961 RECID=3 STAMP=1080065388
validation failed for archived log
archived log file name=/home/oracle/archivelog/1_23_1079891135.dbf RECID=4 STAMP=1080065865
validation failed for archived log
archived log file name=/home/oracle/archivelog/1_24_1079891135.dbf RECID=5 STAMP=1080065866
validation failed for archived log
archived log file name=/home/oracle/archivelog/1_25_1079891135.dbf RECID=9 STAMP=1080065896
validation failed for archived log
archived log file name=/home/oracle/archivelog/thread_0001_seq_0000000026.5fd299b3.1079891135.5f4366b6 RECID=11 STAMP=1080071232
validation failed for archived log
archived log file name=/home/oracle/archivelog/thread_0001_seq_0000000027.5fd299b3.1079891135.5f4366b6 RECID=12 STAMP=1080071232
validation succeeded for archived log
archived log file name=+BAK/orcl/archivelog/2021_08_08/thread_2_seq_16.319.1080028877 RECID=1 STAMP=1080065388
validation failed for archived log
archived log file name=/home/oracle/archivelog/2_17_1079891135.dbf RECID=6 STAMP=1080065872
validation failed for archived log
archived log file name=/home/oracle/archivelog/2_18_1079891135.dbf RECID=7 STAMP=1080065880
validation failed for archived log
archived log file name=/home/oracle/archivelog/2_19_1079891135.dbf RECID=8 STAMP=1080065881
validation failed for archived log
archived log file name=/home/oracle/archivelog/2_20_1079891135.dbf RECID=10 STAMP=1080067716
validation succeeded for archived log
archived log file name=/home/oracle/archivelog/thread_0002_seq_0000000021.5fd299b3.1079891135.5f4366b6 RECID=13 STAMP=1080071241
validation succeeded for archived log
archived log file name=/home/oracle/archivelog/thread_0002_seq_0000000022.5fd299b3.1079891135.5f4366b6 RECID=14 STAMP=1080071248
Crosschecked 14 objects
```

（3）删除失效的归档文件信息

```java
RMAN> delete expired archivelog all;
released channel: ORA_DISK_1
allocated channel: ORA_DISK_1
channel ORA_DISK_1: SID=61 instance=orcl2 device type=DISK
List of Archived Log Copies for database with db_unique_name ORCL
=====================================================================
Key     Thrd Seq     S Low Time 
------- ---- ------- - ---------
4       1    23      X 08-AUG-21
        Name: /home/oracle/archivelog/1_23_1079891135.dbf
.......
Do you really want to delete the above objects (enter YES or NO)? yes
deleted archived log
archived log file name=/home/oracle/archivelog/1_23_1079891135.dbf RECID=4 STAMP=1080065865
deleted archived log
archived log file name=/home/oracle/archivelog/1_24_1079891135.dbf RECID=5 STAMP=1080065866
deleted archived log
archived log file name=/home/oracle/archivelog/1_25_1079891135.dbf RECID=9 STAMP=1080065896
deleted archived log
archived log file name=/home/oracle/archivelog/thread_0001_seq_0000000026.5fd299b3.1079891135.5f4366b6 RECID=11 STAMP=1080071232
deleted archived log
archived log file name=/home/oracle/archivelog/thread_0001_seq_0000000027.5fd299b3.1079891135.5f4366b6 RECID=12 STAMP=1080071232
deleted archived log
archived log file name=/home/oracle/archivelog/2_17_1079891135.dbf RECID=6 STAMP=1080065872
deleted archived log
archived log file name=/home/oracle/archivelog/2_18_1079891135.dbf RECID=7 STAMP=1080065880
deleted archived log
archived log file name=/home/oracle/archivelog/2_19_1079891135.dbf RECID=8 STAMP=1080065881
deleted archived log
archived log file name=/home/oracle/archivelog/2_20_1079891135.dbf RECID=10 STAMP=1080067716
Deleted 9 EXPIRED objects
```

（4）重新查看归档日志

使用RMAN 命令删除归档后，v$archived_log 视图中的 name 列为空，但其他列的信息仍然存在。

```java
SQL> select sequence#, name from v$archived_log;
 SEQUENCE# NAME
----------------------------------------------------------------------------------------------
	16 +BAK/orcl/archivelog/2021_08_08/thread_2_seq_16.319.1080028877
	21 +BAK/orcl/archivelog/2021_08_08/thread_1_seq_21.320.1080050731
	22 +BAK/orcl/archivelog/2021_08_08/thread_1_seq_22.318.1080060961
	23
	24
	17
	18
	19
	25
	20
	26
	27
	21 /home/oracle/archivelog/thread_0002_seq_0000000021.5fd299b3.1079891135.5f4366b6
	22 /home/oracle/archivelog/thread_0002_seq_0000000022.5fd299b3.1079891135.5f4366b6
14 rows selected.
```

### 3、清除 v$archived_log 视图中的过期信息

使用RMAN 命令删除归档后，v$archived_log 视图中的 name 列为空，但其他列的信息仍然存在。出现这种现象的原因是因为使用 RMAN 命令在删除归档日志的时候不能够清除控制文件中的内容。

（1）清除控制文件中关于 v$archived_log 的信息

```java
SQL> execute sys.dbms_backup_restore.resetCfileSection(11);
PL/SQL procedure successfully completed.
-- 查询发现  v$archived_log 视图中的信息全部被清除了
SQL> select sequence#, name from v$archived_log;
no rows selected
```

（2）将未过期的归档文件信息重新注册到控制文件中（**两个节点同时进行**）

```java
 RMAN> catalog start with '/home/oracle/archivelog/';
searching for all files that match the pattern /home/oracle/archivelog/
List of Files Unknown to the Database
=====================================
File Name: /home/oracle/archivelog/thread_0002_seq_0000000022.5fd299b3.1079891135.5f4366b6
File Name: /home/oracle/archivelog/thread_0002_seq_0000000021.5fd299b3.1079891135.5f4366b6
Do you really want to catalog the above files (enter YES or NO)? yes
cataloging files...
cataloging done
List of Cataloged Files
=======================
File Name: /home/oracle/archivelog/thread_0002_seq_0000000022.5fd299b3.1079891135.5f4366b6
File Name: /home/oracle/archivelog/thread_0002_seq_0000000021.5fd299b3.1079891135.5f4366b6
```

重新查看归档日志：

```java
SQL> select sequence#, name from v$archived_log;
 SEQUENCE# NAME
----------------------------------------------------------------------------------------
	22 /home/oracle/archivelog/thread_0002_seq_0000000022.5fd299b3.1079891135.5f4366b6
	21 /home/oracle/archivelog/thread_0002_seq_0000000021.5fd299b3.1079891135.5f4366b6
```
