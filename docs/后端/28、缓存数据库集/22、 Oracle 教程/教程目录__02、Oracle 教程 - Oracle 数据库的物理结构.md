# 02、Oracle 教程 - Oracle 数据库的物理结构
- 来源：https://ddkk.com/zhuanlan/db/oracle/1/2.html
- 分类：缓存数据库
- 分组：教程目录
Oracle 数据库物理结构指的是用户存储数据的一些物理文件。包含：数据文件（datafile）、联机重做日志文件（online redo logfile）、控制文件（controlfile）、参数文件、密码文件、归档日志文件、备份文件、警告日志文件、跟踪文件等。

其中数据文件、控制文件、重做日志文件和参数文件是必须的，其他文件是可选的。

## 一、密码文件（Password files）

作用：进行 Oracle dba 用户的身份验证。

DBA用户：具有 sysdba，sysoper 权限的用户被称为 dba 用户。默认情况下 sysdba 角色中存在 sys 用户，sysoper 角色中存在system用户。

Oracle 的两种认证方式；

**1、** 使用操作系统进行身份验证；

**2、** 使用Oracle数据库的密码文件进行身份认证；

密码文件的位置与名称为：$ORACLE_HOME/dbs/orapw。查看密码文件：

```java
[oracle@rac1 dbs]$ pwd
/u01/app/oracle/product/11.2.0/db_1/dbs
[oracle@rac1 dbs]$ ll
total 16
-rw-rw---- 1 oracle asmadmin 1544 Jul 31 17:11 hc_orcl1.dat
-rw-r--r-- 1 oracle oinstall 2851 May 15  2009 init.ora
-rw-r----- 1 oracle oinstall   35 Apr 21 17:24 initorcl1.ora
-rw-r----- 1 oracle oinstall 1536 Jul 30 21:53 orapworcl1    密码文件
# 操作系统登录验证
[oracle@rac1 admin]$ sqlplus / as sysdba
SQL*Plus: Release 11.2.0.4.0 Production on Sat Jul 31 22:17:57 2021
Copyright (c) 1982, 2013, Oracle.  All rights reserved.
Connected to:
Oracle Database 11g Enterprise Edition Release 11.2.0.4.0 - 64bit Production
With the Partitioning, Real Application Clusters, Automatic Storage Management, OLAP,
Data Mining and Real Application Testing options
SQL> 
# 使用密码文件进行登录验证
[oracle@rac1 admin]$ sqlplus sys/oracle@rac-scan/orcl as sysdba
SQL*Plus: Release 11.2.0.4.0 Production on Sat Jul 31 21:50:55 2021
Copyright (c) 1982, 2013, Oracle.  All rights reserved.
Connected to:
Oracle Database 11g Enterprise Edition Release 11.2.0.4.0 - 64bit Production
With the Partitioning, Real Application Clusters, Automatic Storage Management, OLAP,
Data Mining and Real Application Testing options
SQL> 
```

## 二、参数文件（Parameter files）

参数文件记录了 Oracle 数据库的基本参数信息，包括数据库名、控制文件所在路径等，数据库启动时会读取参数文件，然后根据参数文件中的参数来分配 SGA 并启动一系列的后台进程。参数分为静态参数（修改之后需要重启数据库才能生效）和动态参数（修改之后无需重启，立即生效）。参数文件是 Oracle 数据库较为重要的一种文件结构，参数文件分为两类：

（1）spfile（Server Parameter File）：服务器参数文件，文件格式为二进制格式，不能使用文本编辑器修改，可以使用 alter system 命令修改文件中的参数值，可以使用 strings 命令查看其内容。spfile 参数文件的默认名称为：spfile.ora，文件路径为： O R A C L E H O M E / d b s 。 （ 2 ） p f i l e （ I n i t i a l i z a t i o n P a r a m e t e r s F i l e ） ： 初 始 化 参 数 文 件 ， 文 件 格 式 为 文 本 格 式 ， 可 以 使 用 文 本 编 辑 器 修 改 其 中 的 参 数 内 容 。 p f i l e 默 认 的 名 称 为 ： i n i t  . o r a ， 文 件 路 径 为 ： ORACLE_HOME/dbs。 （2）pfile（Initialization Parameters File）： 初始化参数文件，文件格式为文本格式，可以使用文本编辑器修改其中的参数内容。pfile 默认的名称为：init.ora，文件路径为： ORACLEHOME/dbs。（2）pfile（InitializationParametersFile）：初始化参数文件，文件格式为文本格式，可以使用文本编辑器修改其中的参数内容。pfile默认的名称为：init.ora，文件路径为：ORACLE_HOME/dbs。

（3）Oracle 实例启动时查找参数文件的顺序：Oracle 首先在默认目录中查找名为 spfile . o r a 的 文 件 ， 如 果 没 有 则 查 找 s p f i l e . o r a 文 件 ， 如 果 还 没 有 ， 继 续 查 找 i n i t .ora的文件，如果没有则查找spfile.ora 文件，如果还没有，继续查找 init.ora的文件，如果没有则查找spfile.ora文件，如果还没有，继续查找init.ora 文件。

在操作系统中查看参数文件：

```java
[oracle@rac1 dbs]$ cd $ORACLE_HOME/dbs
[oracle@rac1 dbs]$ pwd
/u01/app/oracle/product/11.2.0/db_1/dbs
[oracle@rac1 dbs]$ ll
total 16
-rw-rw---- 1 oracle asmadmin 1544 Jul 29 02:40 hc_orcl1.dat
-rw-r--r-- 1 oracle oinstall 2851 May 15  2009 init.ora
-rw-r----- 1 oracle oinstall   35 Apr 21 17:24 initorcl1.ora
-rw-r----- 1 oracle oinstall 1536 Apr 21 17:22 orapworcl1
```

Oracle 数据库根据 SPFILE 或 PFILE 中设置的参数来配置数据库的启动。Oracle 实例在启动时，会去读取参数文件中的配置：数据库的 startup 命令中可以指定以哪个 pfile 来启动（startup 命令只能指定 pfile，不 能指定 spfile）。如果使用不带 pfile 子句的 startup 命令，Oracle 将从默认位置的 spfile 文件中读取初始化参数。

查看启动实例时所使用的参数文件：

```java
SQL> SELECT INST_ID,NAME,VALUE FROM GV$PARAMETER WHERE NAME LIKE '%pfile%';
   INST_ID NAME 			  VALUE
---------- ------------------------------ --------------------------------------------------
	 2 spfile			  +DATA/orcl/spfileorcl.ora
	 1 spfile			  +DATA/orcl/spfileorcl.ora
SQL> show parameter pfile
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
spfile				     string	 +DATA/orcl/spfileorcl.ora
-- 可以看出 oracle 启动实例时使用的是 spfile 参数文件
```

## 三、控制文件（Control files）

控制文件作用重大，记录指向数据库其余部分的指针（包括重做日志文件，数据文件，归档日志文件等的位置），存储重要的序列号和时间戳，存储RMAN备份的详细信息。由于控制文件记录数据库的物理结构信息，对数据库运行至关重要，建议在不同的存储设备保存两份以上的控制文件镜像。

数据库在启动的时候需要访问控制文件，从中读取数据文件、日志文件的信息；随着 Oracle 的运行，数据库将不断更新控制文件；相对应的一旦控制文件损坏，数据库便会发生运行故障。

查看控制文件的信息：

```java
SQL> select * from v$controlfile;
STATUS	NAME						   IS_ BLOCK_SIZE FILE_SIZE_BLKS
------- -------------------------------------------------- --- ---------- --------------
	+DATA/orcl/controlfile/current.260.1070471991	   NO	    16384	    1128
	+BAK/orcl/controlfile/current.256.1070471991	   YES	    16384	    1128
SQL> show parameters control_files;
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
control_files			  string	 +DATA/orcl/controlfile/current.260.1070471991, 
                                      +BAK/orcl/controlfile/current.256.1070471991
```

## 四、审计文件（audit files）

审计（Audit）用于监视用户对数据库的操作，审计记录保存在数据字典表中，存储在 system 表空间中的 SYS.AUD$ 表中（可通过视图 dba_audit_trail 查看）或审计文件中（默认位置为 O R A C L E B A S E / a d m i n / ORACLE_BASE/admin/ ORACLEBASE/admin/ORACLE_SID/adump/)。

审计是对特定的用户动作的监控和记录，通常用于：（1）审查可疑的活动。（2）监视和收集关于指定数据库活动的数据。

不管是否打开数据库的审计功能，以下这些操作会强制被记录：用管理员权限连接 Instance、启动数据库、关闭数据库。

审计文件的位置由参数 audit_file_dest 决定：

```java
SQL> show parameter audit_file_dest 
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
audit_file_dest 	     string	      /u01/app/oracle/admin/orcl/adump
```

查看审计文件：

```java
[oracle@rac1 adump]$ cd /u01/app/oracle/admin/orcl/adump
[oracle@rac1 adump]$ ll
total 28
-rw-r----- 1 oracle asmadmin 850 Aug  6 20:52 orcl1_ora_105669_20210806205250823669143795.aud
-rw-r----- 1 oracle asmadmin 856 Aug  6 20:52 orcl1_ora_105802_20210806205250856644143795.aud
-rw-r----- 1 oracle asmadmin 851 Aug  6 20:52 orcl1_ora_105824_20210806205252418250143795.aud
-rw-r----- 1 oracle asmadmin 860 Aug  6 20:52 orcl1_ora_105835_20210806205256211541143795.aud
-rw-r----- 1 oracle asmadmin 855 Aug  6 20:53 orcl1_ora_105878_20210806205309838640143795.aud
-rw-r----- 1 oracle asmadmin 860 Aug  6 21:01 orcl1_ora_106676_20210806210118499214143795.aud
-rw-r----- 1 oracle asmadmin 860 Aug  6 22:11 orcl1_ora_113201_20210806221106443351143795.aud
```

## 五、跟踪文件（tracle files）

跟踪文件包含了大量而详细的诊断和调试信息。通过对跟踪文件的分析，可以定位问题、分析问题和解决问题。跟踪文件的位置由 BACKGROUND_DUMP_DEST 参数决定。跟踪文件分为以下三类：

### 1、警报日志文件（alert files）

警报日志文件记录数据库在启动、关闭和运行期间后台进程的活动情况。如表空间创建、回滚段创建、某些 alter 命令、日志切换、错误消息等。

警报日志的名称：alert_.log。报警日志主要保存以下信息：

（1）数据库的启动、停止；

（2）记录所有的非默认值的初始化参数；

（3）记录日志的切换情况；

（4）记录检查点的完成情况；

（5）记录数据库工作时遭遇的错误信息。

查看警报日志文件：

（1）查看警报日志文件的位置

```java
SQL> show parameter BACKGROUND_DUMP_DEST
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
background_dump_dest	  string	 /u01/app/oracle/diag/rdbms/orcl/orcl1/trace
```

（2）查看警报日志文件

```java
[oracle@rac1 trace]$ ll alert_orcl1.log 
-rw-r----- 1 oracle asmadmin 11211 Aug  6 23:33 alert_orcl1.log
```

### 2、后台进程跟踪文件

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

### 3、用户进程跟踪文件

由连接到 Oracle 的用户进程生成的用户跟踪文件。这些文件仅在用户会话期间遇到错误时产生。用户可以通过执行Oracle 跟踪事件来生成该类文件。用户跟踪文件保存在 SER_DUMP_DEST 参数指定的目录中，文件命名格式为：_ora_服务进程的spid.trc。

查看用户进程跟踪文件：

```java
[oracle@rac1 trace]$ ll *ora*
....
-rw-r----- 1 oracle asmadmin  2237 Aug  6 04:04 orcl1_ora_9748.trc
-rw-r----- 1 oracle asmadmin   157 Aug  6 04:04 orcl1_ora_9748.trm
-rw-r----- 1 oracle asmadmin  1962 Aug  6 04:07 orcl1_ora_9866.trc
-rw-r----- 1 oracle asmadmin   180 Aug  6 04:07 orcl1_ora_9866.trm
```

## 六、联机日志文件（Redo Log Files）

联机日志文件的作用：记录数据文件的每一个变化过程，保证数据库一致性。

一个数据库实例需要两组或两组以上日志文件组，为了防止日志文件本身出现故障，每个日志文件组可以有一个或多个日志成员。日志的主要功能是记录对数据所作的修改，用于在出现故障时，利用日志恢复数据，从而保证数据不丢失。日志文件中的信息仅在系统故障或介质故障恢复数据库时使用。

任何丢失的数据在下一次数据库打开时，Oracle 自动应用日志文件中的信息来恢复数据库数据文件。Oracle 日志文件有联机日志文件和归档日志文件两种，联机日志文件用来循环记录数据库改变的操作系统文件；归档日志文件是为避免联机日志文件重写时丢失重复数据而对联机日志文件所做的备份；Oracle 数据库可以选择归档（ARCHIVELOG）或非归档（NOARCHIVELOG）模式。在归档进程还未对当前组的日志归档完毕之前，不允许 LGWR 对其进行重写。

查看日志文件组和日志文件：

```java
SQL> select * from v$loG;
GROUP# THREAD# SEQUENCE#  BYTES  BLOCKSIZE	MEMBERS ARC STATUS	FIRST_CHANGE# FIRST_TIM NEXT_CHANGE# NEXT_TIME
---------- ---------- ---------- ---------- ---------- ---------- --- ---------------- ------------- 
	 1	    1	  13   52428800	   512	2 NO  CURRENT	  1419092 30-JUL-21	 2.8147E+14
	 2	    1	  12   52428800	   512	2 NO  INACTIVE	  1356866 29-JUL-21	    1419092  30-JUL-21
	 3	    2	   9   52428800	   512	2 NO  INACTIVE	  1274008 28-JUL-21	    1405516  30-JUL-21
	 4	    2	  10   52428800	   512	2 NO  CURRENT	  1405516 30-JUL-21	 2.8147E+14
SQL> select * from v$logfile;
    GROUP# STATUS  TYPE    MEMBER					      IS_
---------- ------- ------- -------------------------------------------------- ---
	 2	   ONLINE  +DATA/orcl/onlinelog/group_2.262.1070472003	      NO
	 2	   ONLINE  +BAK/orcl/onlinelog/group_2.258.1070472005	      YES
	 1	   ONLINE  +DATA/orcl/onlinelog/group_1.261.1070471997	      NO
	 1	   ONLINE  +BAK/orcl/onlinelog/group_1.257.1070471999	      YES
	 3	   ONLINE  +DATA/orcl/onlinelog/group_3.265.1070472253	      NO
	 3	   ONLINE  +BAK/orcl/onlinelog/group_3.259.1070472255	      YES
	 4	   ONLINE  +DATA/orcl/onlinelog/group_4.266.1070472257	      NO
	 4	   ONLINE  +BAK/orcl/onlinelog/group_4.260.1070472261	      YES
8 rows selected.
```

## 七、归档日志文件（Archived Log files）

归档是将联机重做日志以文件的形式保存到硬盘，联机日志归档的前提条件是数据库要处于归档模式。当数据库处于 ARCHIVELOG 模式并进行日志切换时，后台进程 ARCH 会将联机重做日志的内容保存到归档日志中，当数据库出现介质故障时，使用数据文件备份、归档日志和联机重做日志可以完全恢复数据库到正常状态。

查看数据库是否是归档模式：

```java
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
```

查看归档日志文件：

```java
SQL> select sequence#, name from v$archived_log;
 SEQUENCE# NAME
---------- -------------------------------------------------------------------------
	 1 +BAK/orcl/onlinelog/group_1.257.1070471999
	 1 +DATA/orcl/onlinelog/group_1.261.1070471997
	 0 +BAK/orcl/onlinelog/group_2.258.1070472005
	 0 +DATA/orcl/onlinelog/group_2.262.1070472003
	 0 +BAK/orcl/onlinelog/group_5.263.1079737919
	 0 +DATA/orcl/onlinelog/group_5.268.1079737919
	 0 +BAK/orcl/onlinelog/group_3.259.1070472255
	 0 +DATA/orcl/onlinelog/group_3.265.1070472253
	 0 +BAK/orcl/onlinelog/group_4.260.1070472261
	 0 +DATA/orcl/onlinelog/group_4.266.1070472257
	 0 +BAK/orcl/onlinelog/group_6.264.1079737943
	 0 +DATA/orcl/onlinelog/group_6.269.1079737941
	16 +BAK/orcl/archivelog/2021_08_08/thread_2_seq_16.319.1080028877
	21 +BAK/orcl/archivelog/2021_08_08/thread_1_seq_21.320.1080050731
67 rows selected.
```

## 八、数据文件（data files）

一个Oracle 数据库包含一个或多个物理的数据文件。数据文件存储着实际的数据，DBWn 进程会将数据库缓冲区中的内容写入到这类文件中去。从 Oracle10g 开始，一个数据库至少需要两个数据文件，一个用于 SYSTEM 表空间，用于存储数据字典；一个用于 SYSAUX 表空间，用于存储数据字典的辅助数据。数据文件由 Oracle 块组成，这是 Oracle 的 IO 基础单元，Oracle 块要比操作系统块大。数据文件有下列特征：

（1）一个数据文件仅与一个数据库联系；

（2）一个表空间由一个或多个数据文件组成。

查看数据文件：

```java
SQL> select file#,name,status from v$datafile;
     FILE# NAME 					      STATUS
---------- -------------------------------------------------- -------
	 1 +DATA/orcl/datafile/system.256.1070471889	      SYSTEM
	 2 +DATA/orcl/datafile/sysaux.257.1070471889	      ONLINE
	 3 +DATA/orcl/datafile/undotbs1.258.1070471891	      ONLINE
	 4 +DATA/orcl/datafile/users.259.1070471891	      ONLINE
	 5 +DATA/orcl/datafile/undotbs2.264.1070472143	      ONLINE
SQL> select file#,name,status from v$tempfile;
     FILE# NAME 					      STATUS
---------- -------------------------------------------------- -------
	 1 +DATA/orcl/tempfile/temp.263.1070472029	      ONLINE
SQL> select file_name,file_id,tablespace_name,bytes,online_status from dba_data_files;
FILE_NAME					      FILE_ID TABLESPACE_NAME			  BYTES ONLINE_
-------------------------------------------------- ---------- ------------------------------ 
+DATA/orcl/datafile/users.259.1070471891		    4 USERS				5242880 ONLINE
+DATA/orcl/datafile/undotbs1.258.1070471891		    3 UNDOTBS1	         78643200 ONLINE
+DATA/orcl/datafile/sysaux.257.1070471889		    2 SYSAUX		    608174080 ONLINE
+DATA/orcl/datafile/system.256.1070471889		    1 SYSTEM		    786432000 SYSTEM
+DATA/orcl/datafile/undotbs2.264.1070472143		    5 UNDOTBS2		    26214400 ONLINE
SQL> select file_name,file_id,tablespace_name,bytes,status from dba_temp_files;
FILE_NAME					      FILE_ID TABLESPACE_NAME			  BYTES STATUS
-------------------------------------------------- ---------- ------------------------------
+DATA/orcl/tempfile/temp.263.1070472029 		    1 TEMP			       33554432 ONLINE
```
