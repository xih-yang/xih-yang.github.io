# 06、Oracle 教程 - Oracle 的控制文件（Control files）
- 来源：https://ddkk.com/zhuanlan/db/oracle/1/6.html
- 分类：缓存数据库
- 分组：教程目录
## 一、控制文件概述

Oracle 的控制文件记录了当前数据库的结构信息，包含数据文件及日志文件的信息以及相关的状态、归档信息等。控制文件是一个二进制文件，一个控制文件只属于一个数据库。当数据库的物理结构发生改变时，Oracle会自动更新控制文件。当增加、重命名、删除一个数据文件或者一个重做日志文件时，Oracle 服务器进程会立即更新控制文件以反映数据库结构的变化。用户不能手工编辑控制文件，控制文件的修改由 Oracle 自动完成。

数据库的启动和正常运行都离不开控制文件（数据库在 mount 阶段读取控制文件，open 阶段一直使用），一定要备份控制文件，控制文件损坏将导致整个数据库损坏，数据库正常工作至少需要一个控制文件，生产库至少需要两个控制文件（多个控制文件之间是镜像关系），控制文件的位置和数量由初始化参数（control_files）决定。启动数据库时，Oracle 从初始化参数文件中获取控制文件的名字及位置，并打开控制文件，然后从控制文件中读取数据文件和重做日志文件的信息，最后打开数据库。数据库运行时，会更改控制文件。

控制文件的内容包括：

（1）数据库的名称、ID、创建的时间戳；

（2）表空间的名称；

（3）联机日志文件、数据文件的位置、名称；

（4）联机日志的 Sequence 号码；

（5）检查点的信息；

（6）撤销段的开始或结束；

（7）归档信息；

（8）备份信息。

## 二、查看控制文件的个数、名称和位置

### 1、使用 show parameter 命令

```java
SQL> show parameter control_files
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
control_files			     string	 +DATA/orcl/controlfile/current.260.1070471991, 
                                      +BAK/orcl/controlfile/current.256.1070471991
```

### 2、查看 v$controlfile 视图

```java
SQL> select name,block_size,file_size_blks from v$controlfile;
NAME                                                BLOCK_SIZE      FILE_SIZE_BLKS
---------- ----------------------------------------------------------------------------
+DATA/orcl/controlfile/current.260.1070471991       16384	     1128
+BAK/orcl/controlfile/current.256.1070471991        16384	     1128
```

## 三、查看控制文件的内容

### 1、将控制文件转出为文本文件

```java
SQL> alter database backup controlfile to trace as '/home/oracle/ctl001.txt';
Database altered.
```

### 2、查看文件的内容

```java
[oracle@rac1 ~]$ cat ctl001.txt 
-- The following are current System-scope REDO Log Archival related
-- parameters and can be included in the database initialization file.
--
-- LOG_ARCHIVE_DEST=''
-- LOG_ARCHIVE_DUPLEX_DEST=''
--
-- LOG_ARCHIVE_FORMAT=%t_%s_%r.dbf
--
-- DB_UNIQUE_NAME="orcl"
--
-- LOG_ARCHIVE_CONFIG='SEND, RECEIVE, NODG_CONFIG'
-- LOG_ARCHIVE_MAX_PROCESSES=4
-- STANDBY_FILE_MANAGEMENT=MANUAL
-- STANDBY_ARCHIVE_DEST=?/dbs/arch
-- FAL_CLIENT=''
-- FAL_SERVER=''
--
-- LOG_ARCHIVE_DEST_1='LOCATION=USE_DB_RECOVERY_FILE_DEST'
-- LOG_ARCHIVE_DEST_1='MANDATORY NOREOPEN NODELAY'
-- LOG_ARCHIVE_DEST_1='ARCH NOAFFIRM EXPEDITE NOVERIFY SYNC'
-- LOG_ARCHIVE_DEST_1='NOREGISTER NOALTERNATE NODEPENDENCY'
-- LOG_ARCHIVE_DEST_1='NOMAX_FAILURE NOQUOTA_SIZE NOQUOTA_USED NODB_UNIQUE_NAME'
-- LOG_ARCHIVE_DEST_1='VALID_FOR=(PRIMARY_ROLE,ONLINE_LOGFILES)'
-- LOG_ARCHIVE_DEST_STATE_1=ENABLE
--
-- Below are two sets of SQL statements, each of which creates a new
-- control file and uses it to open the database. The first set opens
-- the database with the NORESETLOGS option and should be used only if
-- the current versions of all online logs are available. The second
-- set opens the database with the RESETLOGS option and should be used
-- if online logs are unavailable.
-- The appropriate set of statements can be copied from the trace into
-- a script file, edited as necessary, and executed when there is a
-- need to re-create the control file.
--
--     Set1. NORESETLOGS case
--
-- The following commands will create a new control file and use it
-- to open the database.
-- Data used by Recovery Manager will be lost.
-- Additional logs may be required for media recovery of offline
-- Use this only if the current versions of all online logs are
-- available.
-- After mounting the created controlfile, the following SQL
-- statement will place the database in the appropriate
-- protection mode:
--  ALTER DATABASE SET STANDBY DATABASE TO MAXIMIZE PERFORMANCE
STARTUP NOMOUNT
CREATE CONTROLFILE REUSE DATABASE "ORCL" NORESETLOGS  NOARCHIVELOG
    MAXLOGFILES 192
    MAXLOGMEMBERS 3
    MAXDATAFILES 1024
    MAXINSTANCES 32
    MAXLOGHISTORY 292
LOGFILE
  GROUP 1 (
    '+DATA/orcl/onlinelog/group_1.261.1070471997',
    '+BAK/orcl/onlinelog/group_1.257.1070471999'
  ) SIZE 50M BLOCKSIZE 512,
  GROUP 2 (
    '+DATA/orcl/onlinelog/group_2.262.1070472003',
    '+BAK/orcl/onlinelog/group_2.258.1070472005'
  ) SIZE 50M BLOCKSIZE 512,
  GROUP 3 (
    '+DATA/orcl/onlinelog/group_3.265.1070472253',
    '+BAK/orcl/onlinelog/group_3.259.1070472255'
  ) SIZE 50M BLOCKSIZE 512,
  GROUP 4 (
    '+DATA/orcl/onlinelog/group_4.266.1070472257',
    '+BAK/orcl/onlinelog/group_4.260.1070472261'
  ) SIZE 50M BLOCKSIZE 512,
  GROUP 5 (
    '+DATA/orcl/onlinelog/group_5.268.1079737919',
    '+BAK/orcl/onlinelog/group_5.263.1079737919'
  ) SIZE 50M BLOCKSIZE 512,
  GROUP 6 (
    '+DATA/orcl/onlinelog/group_6.269.1079737941',
    '+BAK/orcl/onlinelog/group_6.264.1079737943'
  ) SIZE 50M BLOCKSIZE 512
-- STANDBY LOGFILE
DATAFILE
  '+DATA/orcl/datafile/system.256.1070471889',
  '+DATA/orcl/datafile/sysaux.257.1070471889',
  '+DATA/orcl/datafile/undotbs1.258.1070471891',
  '+DATA/orcl/datafile/users.259.1070471891',
  '+DATA/orcl/datafile/undotbs2.264.1070472143'
CHARACTER SET AL32UTF8
;
................
-- Commands to add tempfiles to temporary tablespaces.
-- Online tempfiles have complete space information.
-- Other tempfiles may require adjustment.
ALTER TABLESPACE TEMP ADD TEMPFILE '+DATA/orcl/tempfile/temp.263.1070472029'
     SIZE 33554432  REUSE AUTOEXTEND ON NEXT 655360  MAXSIZE 32767M;
-- End of tempfile additions.
```

### 3、使用 strings 命令直接查看控制文件

```java
ASMCMD> cp +DATA/orcl/controlfile/current.260.1070471991 /home/grid/controlfile.ctl
copying +DATA/orcl/controlfile/current.260.1070471991 -> /home/grid/controlfile.ctl
[grid@rac1 ~]$ strings controlfile.ctl 
.....
+DATA/orcl/onlinelog/group_2.262.1070472003
+BAK/orcl/onlinelog/group_2.258.1070472005
+DATA/orcl/onlinelog/group_1.261.1070471997
+BAK/orcl/onlinelog/group_1.257.1070471999
+DATA/orcl/datafile/users.259.1070471891
+DATA/orcl/datafile/undotbs1.258.1070471891
+DATA/orcl/datafile/sysaux.257.1070471889
+DATA/orcl/datafile/system.256.1070471889
+DATA/orcl/tempfile/temp.263.1070472029
+DATA/orcl/datafile/undotbs2.264.1070472143
+DATA/orcl/onlinelog/group_3.265.1070472253
+BAK/orcl/onlinelog/group_3.259.1070472255
+DATA/orcl/onlinelog/group_4.266.1070472257
+BAK/orcl/onlinelog/group_4.260.1070472261
+DATA/orcl/onlinelog/group_5.268.1079737919
+BAK/orcl/onlinelog/group_5.263.1079737919
+DATA/orcl/onlinelog/group_6.269.1079737941
+BAK/orcl/onlinelog/group_6.264.1079737943
+DATA/orcl/onlinelog/group_2.262.1070472003
+BAK/orcl/onlinelog/group_2.258.1070472005
+DATA/orcl/onlinelog/group_1.261.1070471997
+BAK/orcl/onlinelog/group_1.257.1070471999
+DATA/orcl/datafile/users.259.1070471891
+DATA/orcl/datafile/undotbs1.258.1070471891
+DATA/orcl/datafile/sysaux.257.1070471889
+DATA/orcl/datafile/system.256.1070471889
+DATA/orcl/tempfile/temp.263.1070472029
+DATA/orcl/datafile/undotbs2.264.1070472143
+DATA/orcl/onlinelog/group_3.265.1070472253
+BAK/orcl/onlinelog/group_3.259.1070472255
+DATA/orcl/onlinelog/group_4.266.1070472257
+BAK/orcl/onlinelog/group_4.260.1070472261
+DATA/orcl/onlinelog/group_5.268.1079737919
+BAK/orcl/onlinelog/group_5.263.1079737919
+DATA/orcl/onlinelog/group_6.269.1079737941
+BAK/orcl/onlinelog/group_6.264.1079737943
SYSTEM
SYSAUX
UNDOTBS1
USERS
TEMP
UNDOTBS2
SYSTEM
SYSAUX
UNDOTBS1
USERS
TEMP
UNDOTBS2
k[@Tx
{
     [@t
k[@Tx
DISK
+BAK/orcl/backupset/2021_08_04/ncnnf0_tag20210804t231019_0.261.1079737823
TAG20210804T231019
DISK
+BAK/orcl/backupset/2021_08_04/nnsnf0_tag20210804t231048_0.262.1079737849
TAG20210804T231048
DISK
+BAK/orcl/backupset/2021_08_04/ncnnf0_tag20210804t231019_0.261.1079737823
TAG20210804T231019
.........
ACM unit testing operation
LSB Database Guard
Supplemental Log Data DDL
LSB Role Change Support
RFS block and kill across RAC
RAC-wide SGA
ACM unit testing operation
LSB Database Guard
Supplemental Log Data DDL
LSB Role Change Support
RFS block and kill across RAC
RAC-wide SGA
```

### 4、查看控制文件包含的记录片段：

```java
SQL> select type,record_size,records_total,records_used from v$controlfile_record_section;
TYPE			     RECORD_SIZE RECORDS_TOTAL RECORDS_USED
---------------------------- ----------- ------------- ------------
DATABASE			     	 316	     1		  1
CKPT PROGRESS			    8180	    35		  0
REDO THREAD			     	 256	    32		  2
REDO LOG			      	  72	   192		  4
DATAFILE			         520	  1024		  5
FILENAME			         524	  4674		 14
TABLESPACE			          68	  1024		  6
TEMPORARY FILENAME		      56	  1024		  1
RMAN CONFIGURATION		    1108	    50		  0
LOG HISTORY			          56	   292		 34
OFFLINE RANGE			     200	  1063		  0
ARCHIVED LOG			     584	    28		  0
BACKUP SET			          40	  1227		  0
BACKUP PIECE			     736	  1000		  0
BACKUP DATAFILE 		     200	  1063		  0
BACKUP REDOLOG			      76	   430		  0
DATAFILE COPY			     736	  1000		  0
BACKUP CORRUPTION		      44	  1115		  0
COPY CORRUPTION 		      40	  1227		  0
DELETED OBJECT			      20	   818		  0
PROXY COPY			         928	  1004		  0
BACKUP SPFILE			     124	   131		  0
DATABASE INCARNATION		  56	   292		  2
FLASHBACK LOG			      84	  2048		  0
RECOVERY DESTINATION		 180	     1		  1
INSTANCE SPACE RESERVATION	  28	  1055		  2
REMOVABLE RECOVERY FILES	  32	  1000		  0
RMAN STATUS			         116	   141		  0
THREAD INSTANCE NAME MAPPING   80	    32		 32
MTTR				         100	    32		  2
DATAFILE HISTORY		      568	    57		  0
STANDBY DATABASE MATRIX 	  400	    31		 31
GUARANTEED RESTORE POINT	  212	  2048		  0
RESTORE POINT			     212	  2083		  0
DATABASE BLOCK CORRUPTION	  80	  8384		  0
ACM OPERATION			     104	    64		  6
FOREIGN ARCHIVED LOG		 604	  1002		  0
37 rows selected.
```

## 四、控制文件的多路复用

数据库的启动和正常运行都离不开控制文件，控制文件损坏将导致整个数据库损坏，数据库正常工作至少需要一个控制文件，由于控制文件极其重要，生产库最少创建控制文件的两个以上副本，可以通过多路复用技术，将控制文件的副本创建到不同的磁盘上。这样，如果一个控制文件损坏了，可以自动使用另一个控制文件。

但控制文件并不是越多越好，因为当 Oracle 更新控制文件时，会将所有的控制文件全部进行更新，对数据库的性能会有一定的影响，读取时则仅读取第一个控制文件。

控制文件的位置和数量由初始化参数（control_files）决定。启动数据库时，Oracle 从初始化参数文件中获取控制文件的名字及位置，并打开控制文件，然后从控制文件中读取数据文件和重做日志文件的信息，最后打开数据库。数据库运行时，会更改控制文件。

增加控制文件的步骤如下：

### 1、查看当前使用的控制文件

```java
SQL> show parameter control_files
NAME		     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
control_files    string	     +DATA/orcl/controlfile/current.260.1070471991, 
                             +BAK/orcl/controlfile/current.256.1070471991
```

### 2、修改参数文件

```java
alter system set control_files = '+DATA/orcl/controlfile/current.260.1070471991',
'+BAK/orcl/controlfile/current.256.1070471991',
'+bak/ctl_files/control_bak.ctl'
scope = spfile sid = '*';
```

### 3、重启数据库到 nomount 状态，复制所需的控制文件

（1）重启数据库到 nomount

```java
SQL> startup force nomount;
ORACLE instance started.
Total System Global Area  835104768 bytes
Fixed Size		    2257840 bytes
Variable Size		  603982928 bytes
Database Buffers	  226492416 bytes
Redo Buffers		    2371584 bytes
```

（2）利用已有的控制文件通过复制的方式生成第三个控制文件

以grid 用户身份进入 asmcmd，执行如下操作：

```java
# 查看根目录
ASMCMD> ls +
BAK/
DATA/
OCR/
# 进入磁盘组 +bak
ASMCMD> cd +bak
ASMCMD> ls
ORCL/
# 在磁盘组 +bak 中创建目录 ctl_files
ASMCMD> mkdir ctl_files
ASMCMD> ls
ORCL/
ctl_files/
# 复制文件
ASMCMD> cp '+BAK/orcl/controlfile/current.256.1070471991' '+bak/ctl_files/control_bak.ctl'
copying +BAK/orcl/controlfile/current.256.1070471991 -> +bak/ctl_files/control_bak.ctl
# 查看文件 +bak/ctl_files/control_bak.ctl
ASMCMD> ls +bak/ctl_files/control_bak.ctl
control_bak.ctl
```

### 4、启动数据库

```java
SQL> alter database mount;
Database altered.
SQL> alter database open;
Database altered.
```

## 五、控制文件丢失的解决办法

### 1、控制文件部分丢失

一个或多个控制文件丢失，至少有一个控制文件存在。比如，原来有 3 个控制文件，丢失一个导致数据库无法启动。解决方法如下：

（1）将已经存在的控制文件复制到目的路径并更改为正确的控制文件名称；

（2）修改 control_files 参数将丢失的控制文件去掉。

模拟控制文件丢失：

（1）查看控制文件信息

```java
SQL> show parameter control_files
NAME		   TYPE	 VALUE
------------------------------------ ----------- ------------------------------
control_files	string	 +DATA/orcl/controlfile/current.260.1070471991, 
                         +BAK/orcl/controlfile/current.256.1070471991, 
                         +BAK/ctl_files/control_bak.ctl
```

（2）关闭数据库

```java
-- 节点1 和 节点2 都关闭：
-- 节点1
SQL> shutdown immediate
Database closed.
Database dismounted.
ORACLE instance shut down.
-- 节点2
SQL> shutdown immediate
Database closed.
Database dismounted.
ORACLE instance shut down.
```

（3）删除第 3 个控制文件

```java
ASMCMD> rm +BAK/ctl_files/control_bak.ctl
ASMCMD> ls +BAK/ctl_files/control_bak.ctl
ASMCMD-8002: entry 'control_bak.ctl' does not exist in directory '+BAK/ctl_files/'
```

（4）启动数据库报错，显示控制文件

```java
SQL> startup
ORACLE instance started.
Total System Global Area  835104768 bytes
Fixed Size		    2257840 bytes
Variable Size		  603982928 bytes
Database Buffers	  226492416 bytes
Redo Buffers		    2371584 bytes
ORA-00205: error in identifying control file, check alert log for more info
```

（5）查看 alert 文件信息

```java
[oracle@rac1 trace]$ tail 200 alert_orcl1.log 
tail: cannot open 200' for reading: No such file or directory
==> alert_orcl1.log <==
NOTE: dependency between database orcl and diskgroup resource ora.BAK.dg is established
ORA-00210: cannot open the specified control file
ORA-00202: control file: '+BAK/ctl_files/control_bak.ctl'
ORA-17503: ksfdopn:2 Failed to open file +BAK/ctl_files/control_bak.ctl
ORA-15173: entry 'control_bak.ctl' does not exist in directory 'ctl_files'
ORA-205 signalled during: ALTER DATABASE   MOUNT...
Thu Aug 05 23:31:32 2021
ALTER SYSTEM SET local_listener=' (ADDRESS=(PROTOCOL=TCP)(HOST=192.168.1.101)(PORT=1521))' SCOPE=MEMORY SID='orcl1';
Thu Aug 05 23:32:21 2021
Decreasing number of real time LMS from 1 to 0
```

发现是打开日志文件 +BAK/ctl_files/control_bak.ctl 失败，解决方法如下：

（6）利用第一个控制文件通过复制生成所需的日志文件

```java
ASMCMD> cp +DATA/orcl/controlfile/current.260.1070471991 +BAK/ctl_files/control_bak.ctl
copying +DATA/orcl/controlfile/current.260.1070471991 -> +BAK/ctl_files/control_bak.ctl
```

（7）打开数据库

```java
SQL> alter database mount;
Database altered.
SQL> alter database open;
Database altered.
```

### 2、控制文件版本不一致

模拟控制文件版本不一致问题：

（1）查看数据库控制文件信息

```java
SQL> show parameter control_files
NAME		     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
control_files     string	 +DATA/orcl/controlfile/current.260.1070471991, 
                             +BAK/orcl/controlfile/current.256.1070471991,
                             +BAK/ctl_files/control_bak.ctl
```

（2）修改参数文件，只保留第一个控制文件

```java
SQL> alter system set control_files = '+DATA/orcl/controlfile/current.260.1070471991' scope = spfile sid = '*';
System altered.
```

（3）重启数据库，对数据库进行操作

```java
SQL> startup force
ORACLE instance started.
Total System Global Area  835104768 bytes
Fixed Size		    2257840 bytes
Variable Size		  603982928 bytes
Database Buffers	  226492416 bytes
Redo Buffers		    2371584 bytes
Database mounted.
Database opened.
SQL> create table scott.e01 as select * from scott.emp;
Table created.
SQL> commit;
Commit complete.
```

（4）修改参数文件，添加两个控制文件

```java
SQL> alter system set control_files = '+DATA/orcl/controlfile/current.260.1070471991', 
'+BAK/orcl/controlfile/current.256.1070471991', 
'+BAK/ctl_files/control_bak.ctl'
scope = spfile sid = '*';
System altered.
```

（5）重启数据库，提示版本错误

```java
SQL> startup force
ORACLE instance started.
Total System Global Area  835104768 bytes
Fixed Size		    2257840 bytes
Variable Size		  603982928 bytes
Database Buffers	  226492416 bytes
Redo Buffers		    2371584 bytes
ORA-00214: control file '+DATA/orcl/controlfile/current.260.1070471991' version
1519 inconsistent with file '+BAK/orcl/controlfile/current.256.1070471991'
version 1505
```

解决方法：利用最新版本的控制文件替换旧的控制文件。

（6）修改 control_files 参数（文件 +BAK/orcl/controlfile/current.256.1070471991 无法使用 cp 命令替换，具体原因请参考博客【Oracle体系结构（7）—— 使用 asmcmd 复制文件时出错】）

```java
SQL> alter system set control_files = '+DATA/orcl/controlfile/current.260.1070471991', 
'+BAK/orcl/controlfile/control_file02.ctl', 
'+BAK/ctl_files/control_bak.ctl'
scope = spfile sid = '*';
System altered.
```

（7）使用控制文件 +DATA/orcl/controlfile/current.260.1070471991 通过复制的方法生成另外两个控制文件

```java
ASMCMD> cp +DATA/orcl/controlfile/current.260.1070471991 +BAK/orcl/controlfile/control_file02.ctl
copying +DATA/orcl/controlfile/current.260.1070471991 -> +BAK/orcl/controlfile/control_file02.ctl
ASMCMD> cp +DATA/orcl/controlfile/current.260.1070471991 +BAK/ctl_files/control_bak.ctl
copying +DATA/orcl/controlfile/current.260.1070471991 -> +BAK/ctl_files/control_bak.ctl
```

（8）重新启动数据库

```java
SQL> startup force;
ORACLE instance started.
Total System Global Area  835104768 bytes
Fixed Size		    2257840 bytes
Variable Size		  603982928 bytes
Database Buffers	  226492416 bytes
Redo Buffers		    2371584 bytes
Database mounted.
Database opened.
```

## 六、控制文件的备份

### 1、使用 alter database backup controlfile 备份

（1）备份控制文件。命令如下：

```java
-- 语法
alter database backup controlfile to '<dir>'; 
-- 备份控制文件：
SQL> alter database backup controlfile to '+bak/control_file.ctl.bak';
Database altered.
-- 查看控制文件的备份
ASMCMD> ls +bak
ASM/
ORCL/
control_file.ctl.bak  -- 控制文件的备份文件
ctl_files/
```

（2）生成创建控制文件的脚本

```java
-- 语法
alter database backup controlfile to trace as '<dir>' ;
-- 生成创建控制文件的脚本
SQL> alter database backup controlfile to trace as '/home/oracle/ctl002.txt' ;
Database altered.
```

查看文件 /home/oracle/ctl002.txt 的内容：

创建控制文件主要包含三部分内容：

（1）设置日志文件的大小及位置；

（2）设置数据文件的位置；

（3）设置正确的字符集。

```java
[oracle@rac1 ~]$ cat ctl002.txt 
.....
STARTUP NOMOUNT
CREATE CONTROLFILE REUSE DATABASE "ORCL" NORESETLOGS  NOARCHIVELOG
    MAXLOGFILES 192
    MAXLOGMEMBERS 3
    MAXDATAFILES 1024
    MAXINSTANCES 32
    MAXLOGHISTORY 292
LOGFILE
  GROUP 1 (
    '+DATA/orcl/onlinelog/group_1.261.1070471997',
    '+BAK/orcl/onlinelog/group_1.257.1070471999'
  ) SIZE 50M BLOCKSIZE 512,
  GROUP 2 (
    '+DATA/orcl/onlinelog/group_2.262.1070472003',
    '+BAK/orcl/onlinelog/group_2.258.1070472005'
  ) SIZE 50M BLOCKSIZE 512,
  GROUP 3 (
    '+DATA/orcl/onlinelog/group_3.265.1070472253',
    '+BAK/orcl/onlinelog/group_3.259.1070472255'
  ) SIZE 50M BLOCKSIZE 512,
  GROUP 4 (
    '+DATA/orcl/onlinelog/group_4.266.1070472257',
    '+BAK/orcl/onlinelog/group_4.260.1070472261'
  ) SIZE 50M BLOCKSIZE 512,
  GROUP 5 (
    '+DATA/orcl/onlinelog/group_5.268.1079737919',
    '+BAK/orcl/onlinelog/group_5.263.1079737919'
  ) SIZE 50M BLOCKSIZE 512,
  GROUP 6 (
    '+DATA/orcl/onlinelog/group_6.269.1079737941',
    '+BAK/orcl/onlinelog/group_6.264.1079737943'
  ) SIZE 50M BLOCKSIZE 512
-- STANDBY LOGFILE
DATAFILE
  '+DATA/orcl/datafile/system.256.1070471889',
  '+DATA/orcl/datafile/sysaux.257.1070471889',
  '+DATA/orcl/datafile/undotbs1.258.1070471891',
  '+DATA/orcl/datafile/users.259.1070471891',
  '+DATA/orcl/datafile/undotbs2.264.1070472143'
CHARACTER SET AL32UTF8
;
......
```

### 2、使用 rman 备份（推荐）

（1）查看数据库的归档状态

```java
SQL> archive log list;
Database log mode	       Archive Mode  -- 数据库为归档模式
Automatic archival	       Enabled
Archive destination	       USE_DB_RECOVERY_FILE_DEST
Oldest online log sequence     14
Next log sequence to archive   16
Current log sequence	       16
```

（2）备份控制文件

```java
RMAN> backup current controlfile format '+bak/control_2021_08_06.bak';
Starting backup at 06-AUG-21
using channel ORA_DISK_1
channel ORA_DISK_1: starting full datafile backup set
channel ORA_DISK_1: specifying datafile(s) in backup set
including current control file in backup set
channel ORA_DISK_1: starting piece 1 at 06-AUG-21
channel ORA_DISK_1: finished piece 1 at 06-AUG-21
piece handle=+BAK/control_2021_08_06.bak tag=TAG20210806T170714 comment=NONE
channel ORA_DISK_1: backup set complete, elapsed time: 00:00:26
Finished backup at 06-AUG-21
-- 查看控制文件的备份信息
RMAN> list backup of controlfile;
List of Backup Sets
===================
.......
BS Key  Type LV Size       Device Type Elapsed Time Completion Time
------- ---- -- ---------- ----------- ------------ ---------------
7       Full    17.70M     DISK        00:00:00     06-AUG-21      
        BP Key: 7   Status: AVAILABLE  Compressed: NO  Tag: TAG20210806T003251
        Piece Name: +BAK/orcl/backupset/2021_08_06/ncsnf0_tag20210806t003251_0.273.1079829269
  Control File Included: Ckp SCN: 1430968      Ckp time: 06-AUG-21
BS Key  Type LV Size       Device Type Elapsed Time Completion Time
------- ---- -- ---------- ----------- ------------ ---------------
8       Full    17.67M     DISK        00:00:32     06-AUG-21      
        BP Key: 8   Status: AVAILABLE  Compressed: NO  Tag: TAG20210806T170714
        Piece Name: +BAK/control_2021_08_06.bak
  Control File Included: Ckp SCN: 1461042      Ckp time: 06-AUG-21
```

（3）备份数据库与控制文件

```java
RMAN> backup database include current controlfile;
Starting backup at 06-AUG-21
using channel ORA_DISK_1
channel ORA_DISK_1: starting full datafile backup set
channel ORA_DISK_1: specifying datafile(s) in backup set
input datafile file number=00001 name=+DATA/orcl/datafile/system.256.1070471889
input datafile file number=00002 name=+DATA/orcl/datafile/sysaux.257.1070471889
input datafile file number=00003 name=+DATA/orcl/datafile/undotbs1.258.1070471891
input datafile file number=00005 name=+DATA/orcl/datafile/undotbs2.264.1070472143
input datafile file number=00004 name=+DATA/orcl/datafile/users.259.1070471891
channel ORA_DISK_1: starting piece 1 at 06-AUG-21
channel ORA_DISK_1: finished piece 1 at 06-AUG-21
piece handle=+BAK/orcl/backupset/2021_08_06/nnndf0_tag20210806t171042_0.281.1079889045 tag=TAG20210806T171042 comment=NONE
channel ORA_DISK_1: backup set complete, elapsed time: 00:01:37
channel ORA_DISK_1: starting full datafile backup set
channel ORA_DISK_1: specifying datafile(s) in backup set
including current control file in backup set
including current SPFILE in backup set
channel ORA_DISK_1: starting piece 1 at 06-AUG-21
channel ORA_DISK_1: finished piece 1 at 06-AUG-21
piece handle=+BAK/orcl/backupset/2021_08_06/ncsnf0_tag20210806t171042_0.282.1079889141 tag=TAG20210806T171042 comment=NONE
channel ORA_DISK_1: backup set complete, elapsed time: 00:00:01
Finished backup at 06-AUG-21
```

## 七、使用 rman 恢复控制文件

由于误操作、磁盘故障等导致控制文件全部丢失时，可以使用备份的控制文件进行恢复操作。下面模拟控制文件全部丢失时，恢复数据库的操作：

（1）修改数据并提交

```java
SQL> create table scott.e02 as select * from scott.emp;
Table created.
SQL> insert into scott.e02 select * from scott.e02;
14 rows created.
SQL> insert into scott.e02 select * from scott.e02;
28 rows created.
SQL> insert into scott.e02 select * from scott.e02;
56 rows created.
SQL> insert into scott.e02 select * from scott.e02;
112 rows created.
SQL> insert into scott.e02 select * from scott.e02;
224 rows created.
SQL> insert into scott.e02 select * from scott.e02;
448 rows created.
SQL> insert into scott.e02 select * from scott.e02;
896 rows created.
SQL> commit;
Commit complete.
```

（2）查看控制文件

```java
SQL> show parameter control_files;
NAME			   TYPE	 VALUE
------------------------------------ ----------- ------------------------------
control_files	 string	 +DATA/orcl/controlfile/control_file01.ctl, 
                         +BAK/orcl/controlfile/control_file02.ctl, 
                         +BAK/ctl_files/control_file03.ctl
```

（3）删除全部的控制文件

```java
SQL> shutdown immediate
Database closed.
Database dismounted.
ORACLE instance shut down.
ASMCMD> rm +DATA/orcl/controlfile/control_file01.ctl
ASMCMD> rm +BAK/orcl/controlfile/control_file02.ctl
ASMCMD> rm +BAK/ctl_files/control_file03.ctl
```

（4）启动数据库，出现错误

```java
SQL> startup
ORACLE instance started.
Total System Global Area  835104768 bytes
Fixed Size		    2257840 bytes
Variable Size		  603982928 bytes
Database Buffers	  226492416 bytes
Redo Buffers		    2371584 bytes
ORA-00205: error in identifying control file, check alert log for more info
-- 数据库启动到 nomount 状态
SQL> select status from v$instance;
STATUS
------------
STARTED
```

（5）使用 RMAN 还原控制文件

```java
RMAN> restore controlfile from '+BAK/control_2021_08_06.bak';
Starting restore at 06-AUG-21
using target database control file instead of recovery catalog
allocated channel: ORA_DISK_1
channel ORA_DISK_1: SID=29 instance=orcl1 device type=DISK
channel ORA_DISK_1: restoring control file
channel ORA_DISK_1: restore complete, elapsed time: 00:00:08
output file name=+DATA/orcl/controlfile/control_file01.ctl
output file name=+BAK/orcl/controlfile/control_file02.ctl
output file name=+BAK/ctl_files/control_file03.ctl
Finished restore at 06-AUG-21
```

（6）启动数据库到 mount 状态

```java
RMAN> alter database mount;
database mounted
released channel: ORA_DISK_1
```

（7）恢复数据库

```java
RMAN> recover database;
Starting recover at 06-AUG-21
Starting implicit crosscheck backup at 06-AUG-21
allocated channel: ORA_DISK_1
Crosschecked 7 objects
Finished implicit crosscheck backup at 06-AUG-21
Starting implicit crosscheck copy at 06-AUG-21
using channel ORA_DISK_1
Crosschecked 2 objects
Finished implicit crosscheck copy at 06-AUG-21
searching for all files in the recovery area
cataloging files...
cataloging done
List of Cataloged Files
=======================
File Name: +bak/ORCL/BACKUPSET/2021_08_06/ncnnf0_TAG20210806T170714_0.280.1079888855
File Name: +bak/ORCL/BACKUPSET/2021_08_06/nnndf0_TAG20210806T171042_0.281.1079889045
File Name: +bak/ORCL/BACKUPSET/2021_08_06/ncsnf0_TAG20210806T171042_0.282.1079889141
using channel ORA_DISK_1
starting media recovery
archived log for thread 1 with sequence 1 is already on disk as file +BAK/orcl/onlinelog/group_1.257.1070471999
archived log file name=+BAK/orcl/onlinelog/group_1.257.1070471999 thread=1 sequence=1
media recovery complete, elapsed time: 00:00:01
Finished recover at 06-AUG-21
```

（8）打开数据库

以resetlogs 模式才能打开数据库。

```java
RMAN> alter database open resetlogs;
database opened
```
