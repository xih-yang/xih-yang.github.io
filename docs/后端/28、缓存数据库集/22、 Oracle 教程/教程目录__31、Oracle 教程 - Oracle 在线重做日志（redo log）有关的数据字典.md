# 31、Oracle 教程 - Oracle 在线重做日志（redo log）有关的数据字典
- 来源：https://ddkk.com/zhuanlan/db/oracle/1/31.html
- 分类：缓存数据库
- 分组：教程目录
Oracle 11g 默认为每个数据库实例建立 3 个在线日志组，每组一个或多个日志文件。每组内的日志文件的内容完全相同，且保存在不同的位置，用于磁盘日志镜像，以提高安全性。

默认情况这 3 个日志组只有一组处于活动状态，当日志文件写满时，如果当前数据库处于归档模式，则将在线日志归档到硬盘，成为归档日志。若当前数据库处于非归档模式，则不进行归档操作，而当前在线日志的内容会被覆盖。

## 一、查询在线日志文件信息

数据字典：v l o g f i l e 和 g v logfile 和 gv logfile和gvlogfile

### 1、数据字典的结构

```java
SQL> DESC V$LOGFILE;
 Name										     Null?    Type
--------------------------------------------------------------------------------
 GROUP# 										      NUMBER
 STATUS 										      VARCHAR2(7)
 TYPE											      VARCHAR2(7)
 MEMBER 										      VARCHAR2(513)
 IS_RECOVERY_DEST_FILE							       VARCHAR2(3)
SQL> DESC GV$LOGFILE;
 Name										     Null?    Type
----------------------------------------------------------------------------------
 INST_ID										      NUMBER
 GROUP# 										      NUMBER
 STATUS 										      VARCHAR2(7)
 TYPE											      VARCHAR2(7)
 MEMBER 										      VARCHAR2(513)
 IS_RECOVERY_DEST_FILE								   VARCHAR2(3)
```

### 2、查询在线日志文件信息

```java
SQL> SELECT GROUP#, MEMBER, STATUS, TYPE FROM V$LOGFILE;
    GROUP# MEMBER					      STATUS  TYPE
---------- -------------------------------------------------- ------- --------------------
	 2 +DATA/orcl/onlinelog/group_2.262.1070472003		      ONLINE
	 2 +BAK/orcl/onlinelog/group_2.258.1070472005		      ONLINE
	 1 +DATA/orcl/onlinelog/group_1.261.1070471997		      ONLINE
	 1 +BAK/orcl/onlinelog/group_1.257.1070471999		      ONLINE
	 3 +DATA/orcl/onlinelog/group_3.265.1070472253		      ONLINE
	 3 +BAK/orcl/onlinelog/group_3.259.1070472255		      ONLINE
	 4 +DATA/orcl/onlinelog/group_4.266.1070472257		      ONLINE
	 4 +BAK/orcl/onlinelog/group_4.260.1070472261		      ONLINE
	 5 +DATA/orcl/onlinelog/group_5.268.1079737919		      ONLINE
	 5 +BAK/orcl/onlinelog/group_5.263.1079737919		      ONLINE
	 6 +DATA/orcl/onlinelog/group_6.269.1079737941		      ONLINE
	 6 +BAK/orcl/onlinelog/group_6.264.1079737943		      ONLINE
	 7 +DATA/orcl/onlinelog/group_7_redo7_01.log		      ONLINE
	 7 +BAK/orcl/onlinelog/group_7_redo7_02.log		          ONLINE
	 8 +DATA/orcl/onlinelog/group_8_redo8_01.log		      ONLINE
	 8 +BAK/orcl/onlinelog/group_8_redo8_02.log		          ONLINE
16 rows selected.
SQL> SELECT INST_ID, GROUP#, MEMBER, STATUS, TYPE FROM GV$LOGFILE;
   INST_ID     GROUP# MEMBER						 STATUS  TYPE
---------- ---------- -------------------------------------------------- ------- --------------------
	 1	    2 +DATA/orcl/onlinelog/group_2.262.1070472003		 ONLINE
	 1	    2 +BAK/orcl/onlinelog/group_2.258.1070472005		 ONLINE
	 1	    1 +DATA/orcl/onlinelog/group_1.261.1070471997		 ONLINE
	 1	    1 +BAK/orcl/onlinelog/group_1.257.1070471999		 ONLINE
	 1	    3 +DATA/orcl/onlinelog/group_3.265.1070472253		 ONLINE
	 1	    3 +BAK/orcl/onlinelog/group_3.259.1070472255		 ONLINE
	 1	    4 +DATA/orcl/onlinelog/group_4.266.1070472257		 ONLINE
	 1	    4 +BAK/orcl/onlinelog/group_4.260.1070472261		 ONLINE
	 1	    5 +DATA/orcl/onlinelog/group_5.268.1079737919		 ONLINE
	 1	    5 +BAK/orcl/onlinelog/group_5.263.1079737919		 ONLINE
	 1	    6 +DATA/orcl/onlinelog/group_6.269.1079737941		 ONLINE
	 1	    6 +BAK/orcl/onlinelog/group_6.264.1079737943		 ONLINE
	 1	    7 +DATA/orcl/onlinelog/group_7_redo7_01.log 		 ONLINE
	 1	    7 +BAK/orcl/onlinelog/group_7_redo7_02.log			 ONLINE
	 1	    8 +DATA/orcl/onlinelog/group_8_redo8_01.log 		 ONLINE
	 1	    8 +BAK/orcl/onlinelog/group_8_redo8_02.log			 ONLINE
	 2	    2 +DATA/orcl/onlinelog/group_2.262.1070472003		 ONLINE
	 2	    2 +BAK/orcl/onlinelog/group_2.258.1070472005		 ONLINE
	 2	    1 +DATA/orcl/onlinelog/group_1.261.1070471997		 ONLINE
	 2	    1 +BAK/orcl/onlinelog/group_1.257.1070471999		 ONLINE
	 2	    3 +DATA/orcl/onlinelog/group_3.265.1070472253		 ONLINE
	 2	    3 +BAK/orcl/onlinelog/group_3.259.1070472255		 ONLINE
	 2	    4 +DATA/orcl/onlinelog/group_4.266.1070472257		 ONLINE
	 2	    4 +BAK/orcl/onlinelog/group_4.260.1070472261		 ONLINE
	 2	    5 +DATA/orcl/onlinelog/group_5.268.1079737919		 ONLINE
	 2	    5 +BAK/orcl/onlinelog/group_5.263.1079737919		 ONLINE
	 2	    6 +DATA/orcl/onlinelog/group_6.269.1079737941		 ONLINE
	 2	    6 +BAK/orcl/onlinelog/group_6.264.1079737943		 ONLINE
	 2	    7 +DATA/orcl/onlinelog/group_7_redo7_01.log 		 ONLINE
	 2	    7 +BAK/orcl/onlinelog/group_7_redo7_02.log			 ONLINE
	 2	    8 +DATA/orcl/onlinelog/group_8_redo8_01.log 		 ONLINE
	 2	    8 +BAK/orcl/onlinelog/group_8_redo8_02.log			 ONLINE
32 rows selected.
```

## 二、查询日志组的信息

### 1、V L O G 和 G V LOG 和 GV LOG和GVLOG

### （1）数据字典的结构

```java
SQL> DESC V$LOG;
 Name										     Null?    Type
-------------------------------------------------------------------- -------- -------  
 GROUP# 										      NUMBER
 THREAD#										      NUMBER
 SEQUENCE#										      NUMBER
 BYTES											      NUMBER
 BLOCKSIZE										      NUMBER
 MEMBERS										      NUMBER
 ARCHIVED										      VARCHAR2(3)
 STATUS 										      VARCHAR2(16)
 FIRST_CHANGE#									      NUMBER
 FIRST_TIME										      DATE
 NEXT_CHANGE#									      NUMBER
 NEXT_TIME										      DATE
SQL> DESC GV$LOG;
 Name										     Null?    Type
 ------------------------------------------------------------------------------
 INST_ID										      NUMBER
 GROUP# 										      NUMBER
 THREAD#										      NUMBER
 SEQUENCE#										      NUMBER
 BYTES											      NUMBER
 BLOCKSIZE										      NUMBER
 MEMBERS										      NUMBER
 ARCHIVED										      VARCHAR2(3)
 STATUS 										      VARCHAR2(16)
 FIRST_CHANGE#									      NUMBER
 FIRST_TIME										      DATE
 NEXT_CHANGE#									      NUMBER
 NEXT_TIME										      DATE
```

### （2）查询日志组的信息

```java
SQL> SELECT GROUP#, THREAD#, SEQUENCE#, MEMBERS, STATUS, ARCHIVED, FIRST_CHANGE#, NEXT_CHANGE# 
     FROM V$LOG;
    GROUP#    THREAD#  SEQUENCE#    MEMBERS STATUS	     ARC FIRST_CHANGE# NEXT_CHANGE#
---------- ---------- ---------- ---------- ---------------- --- ------------- ------------
	 1	    1	      21	  2 INACTIVE	     YES       3648967	    3678209
	 2	    1	      22	  2 INACTIVE	     YES       3678209	    3734696
	 3	    2	      17	  2 INACTIVE	     YES       3777695	    3857248
	 4	    2	      18	  2 CURRENT	         NO        3857248	 2.8147E+14
	 5	    1	      23	  2 INACTIVE	     YES       3734696	    3848228
	 6	    2	      15	  2 INACTIVE	     YES       3607484	    3607490
	 7	    1	      24	  2 CURRENT	         NO        3848228	 2.8147E+14
	 8	    2	      16	  2 INACTIVE	     YES       3678643	    3777695
8 rows selected.
SQL> SELECT INST_ID, GROUP#, THREAD#, SEQUENCE#, MEMBERS, STATUS, 
     ARCHIVED, FIRST_CHANGE#, NEXT_CHANGE# FROM GV$LOG;
   INST_ID     GROUP#	 THREAD#  SEQUENCE#    MEMBERS STATUS	ARC FIRST_CHANGE# NEXT_CHANGE#
---------- ---------- ---------- ---------- ---------- ---------------- --- ----------------
	 2	    1	       1	 21	     2 INACTIVE 	YES	  3648967      3678209
	 2	    2	       1	 22	     2 INACTIVE 	YES	  3678209      3734696
	 2	    3	       2	 17	     2 INACTIVE 	YES	  3777695      3857248
	 2	    4	       2	 18	     2 CURRENT		NO	  3857248   2.8147E+14
	 2	    5	       1	 23	     2 INACTIVE 	YES	  3734696      3848228
	 2	    6	       2	 15	     2 INACTIVE 	YES	  3607484      3607490
	 2	    7	       1	 24	     2 CURRENT		NO	  3848228   2.8147E+14
	 2	    8	       2	 16	     2 INACTIVE 	YES	  3678643      3777695
	 1	    1	       1	 21	     2 INACTIVE 	YES	  3648967      3678209
	 1	    2	       1	 22	     2 INACTIVE 	YES	  3678209      3734696
	 1	    3	       2	 17	     2 INACTIVE 	YES	  3777695      3857248
	 1	    4	       2	 18	     2 CURRENT		NO	  3857248   2.8147E+14
	 1	    5	       1	 23	     2 INACTIVE 	YES	  3734696      3848228
	 1	    6	       2	 15	     2 INACTIVE 	YES	  3607484      3607490
	 1	    7	       1	 24	     2 CURRENT		NO	  3848228   2.8147E+14
	 1	    8	       2	 16	     2 INACTIVE 	YES	  3678643      3777695
16 rows selected.
```

## 三、查看归档日志文件信息

### 1、查看归档日志文件的位置信息

### （1）使用初始化参数 LOG_ARCHIVE_DEST 查看归档日志文件的位置信息

```java
SQL> SHOW PARAMETER LOG_ARCHIVE_DEST
NAME				     TYPE		  VALUE
------------------------------------ -------------------- ------------------------------
log_archive_dest		     string
log_archive_dest_1		     string		  location=+bak
log_archive_dest_10		     string
log_archive_dest_11		     string
log_archive_dest_12		     string
log_archive_dest_13		     string
log_archive_dest_14		     string
log_archive_dest_15		     string
log_archive_dest_16		     string
log_archive_dest_17		     string
log_archive_dest_18		     string
log_archive_dest_19		     string
log_archive_dest_2		     string
log_archive_dest_20		     string
log_archive_dest_21		     string
log_archive_dest_22		     string
log_archive_dest_23		     string
log_archive_dest_24		     string
log_archive_dest_25		     string
log_archive_dest_26		     string
log_archive_dest_27		     string
log_archive_dest_28		     string
log_archive_dest_29		     string
log_archive_dest_3		     string
log_archive_dest_30		     string
log_archive_dest_31		     string
log_archive_dest_4		     string
log_archive_dest_5		     string
log_archive_dest_6		     string
log_archive_dest_7		     string
log_archive_dest_8		     string
log_archive_dest_9		     string
log_archive_dest_state_1	     string		  enable
log_archive_dest_state_10	     string		  enable
log_archive_dest_state_11	     string		  enable
log_archive_dest_state_12	     string		  enable
log_archive_dest_state_13	     string		  enable
log_archive_dest_state_14	     string		  enable
log_archive_dest_state_15	     string		  enable
log_archive_dest_state_16	     string		  enable
log_archive_dest_state_17	     string		  enable
log_archive_dest_state_18	     string		  enable
log_archive_dest_state_19	     string		  enable
log_archive_dest_state_2	     string		  enable
log_archive_dest_state_20	     string		  enable
log_archive_dest_state_21	     string		  enable
log_archive_dest_state_22	     string		  enable
log_archive_dest_state_23	     string		  enable
log_archive_dest_state_24	     string		  enable
log_archive_dest_state_25	     string		  enable
log_archive_dest_state_26	     string		  enable
log_archive_dest_state_27	     string		  enable
log_archive_dest_state_28	     string		  enable
log_archive_dest_state_29	     string		  enable
log_archive_dest_state_3	     string		  enable
log_archive_dest_state_30	     string		  enable
log_archive_dest_state_31	     string		  enable
log_archive_dest_state_4	     string		  enable
log_archive_dest_state_5	     string		  enable
log_archive_dest_state_6	     string		  enable
log_archive_dest_state_7	     string		  enable
log_archive_dest_state_8	     string		  enable
log_archive_dest_state_9	     string		  enable
```

### （2）使用数据字典 V$ARCHIVE_DEST 查看归档日志文件的位置信息

```java
--数据字典的结构
SQL> DESC V$ARCHIVE_DEST;
 Name										     Null?    Type
 ----------------------------------------------------------------------------------
 DEST_ID										      NUMBER
 DEST_NAME										      VARCHAR2(256)
 STATUS 										      VARCHAR2(9)
 BINDING										      VARCHAR2(9)
 NAME_SPACE										      VARCHAR2(7)
 TARGET 										      VARCHAR2(7)
 ARCHIVER										      VARCHAR2(10)
 SCHEDULE										      VARCHAR2(8)
 DESTINATION									      VARCHAR2(256)
 LOG_SEQUENCE									      NUMBER
 REOPEN_SECS									      NUMBER
 DELAY_MINS										      NUMBER
 MAX_CONNECTIONS								      NUMBER
 NET_TIMEOUT									      NUMBER
 PROCESS										      VARCHAR2(10)
 REGISTER										      VARCHAR2(3)
 FAIL_DATE										      DATE
 FAIL_SEQUENCE									      NUMBER
 FAIL_BLOCK										      NUMBER
 FAILURE_COUNT									      NUMBER
 MAX_FAILURE									      NUMBER
 ERROR											      VARCHAR2(256)
 ALTERNATE										      VARCHAR2(256)
 DEPENDENCY										      VARCHAR2(256)
 REMOTE_TEMPLATE								      VARCHAR2(256)
 QUOTA_SIZE										      NUMBER
 QUOTA_USED										      NUMBER
 MOUNTID										      NUMBER
 TRANSMIT_MODE									      VARCHAR2(12)
 ASYNC_BLOCKS									      NUMBER
 AFFIRM 										      VARCHAR2(3)
 TYPE											      VARCHAR2(7)
 VALID_NOW										      VARCHAR2(16)
 VALID_TYPE										      VARCHAR2(15)
 VALID_ROLE										      VARCHAR2(12)
 DB_UNIQUE_NAME 								      VARCHAR2(30)
 VERIFY 										      VARCHAR2(3)
 COMPRESSION									      VARCHAR2(7)
 APPLIED_SCN									      NUMBER
--查看
SQL> SELECT DEST_ID, DEST_NAME FROM V$ARCHIVE_DEST;
   DEST_ID DEST_NAME
---------- ------------------------------
	 1 LOG_ARCHIVE_DEST_1
	 2 LOG_ARCHIVE_DEST_2
	 3 LOG_ARCHIVE_DEST_3
	 4 LOG_ARCHIVE_DEST_4
	 5 LOG_ARCHIVE_DEST_5
	 6 LOG_ARCHIVE_DEST_6
	 7 LOG_ARCHIVE_DEST_7
	 8 LOG_ARCHIVE_DEST_8
	 9 LOG_ARCHIVE_DEST_9
	10 LOG_ARCHIVE_DEST_10
	11 LOG_ARCHIVE_DEST_11
	12 LOG_ARCHIVE_DEST_12
	13 LOG_ARCHIVE_DEST_13
	14 LOG_ARCHIVE_DEST_14
	15 LOG_ARCHIVE_DEST_15
	16 LOG_ARCHIVE_DEST_16
	17 LOG_ARCHIVE_DEST_17
	18 LOG_ARCHIVE_DEST_18
	19 LOG_ARCHIVE_DEST_19
	20 LOG_ARCHIVE_DEST_20
	21 LOG_ARCHIVE_DEST_21
	22 LOG_ARCHIVE_DEST_22
	23 LOG_ARCHIVE_DEST_23
	24 LOG_ARCHIVE_DEST_24
	25 LOG_ARCHIVE_DEST_25
	26 LOG_ARCHIVE_DEST_26
	27 LOG_ARCHIVE_DEST_27
	28 LOG_ARCHIVE_DEST_28
	29 LOG_ARCHIVE_DEST_29
	30 LOG_ARCHIVE_DEST_30
	31 LOG_ARCHIVE_DEST_31
31 rows selected.
```

### （3）使用数据字典 GV$ARCHIVE_DEST 查看归档日志文件的位置

```java
--数据字典的结构
SQL> DESC GV$ARCHIVE_DEST;
 Name										     Null?    Type
 ------------------------------------------------------------------------------
 INST_ID										      NUMBER
 DEST_ID										      NUMBER
 DEST_NAME										      VARCHAR2(256)
 STATUS 										      VARCHAR2(9)
 BINDING										      VARCHAR2(9)
 NAME_SPACE										      VARCHAR2(7)
 TARGET 										      VARCHAR2(7)
 ARCHIVER										      VARCHAR2(10)
 SCHEDULE										      VARCHAR2(8)
 DESTINATION									      VARCHAR2(256)
 LOG_SEQUENCE									      NUMBER
 REOPEN_SECS									      NUMBER
 DELAY_MINS										      NUMBER
 MAX_CONNECTIONS								      NUMBER
 NET_TIMEOUT									      NUMBER
 PROCESS										      VARCHAR2(10)
 REGISTER										      VARCHAR2(3)
 FAIL_DATE										      DATE
 FAIL_SEQUENCE									      NUMBER
 FAIL_BLOCK										      NUMBER
 FAILURE_COUNT									      NUMBER
 MAX_FAILURE									      NUMBER
 ERROR											      VARCHAR2(256)
 ALTERNATE										      VARCHAR2(256)
 DEPENDENCY										      VARCHAR2(256)
 REMOTE_TEMPLATE								      VARCHAR2(256)
 QUOTA_SIZE										      NUMBER
 QUOTA_USED										      NUMBER
 MOUNTID										      NUMBER
 TRANSMIT_MODE									      VARCHAR2(12)
 ASYNC_BLOCKS									      NUMBER
 AFFIRM 										      VARCHAR2(3)
 TYPE											      VARCHAR2(7)
 VALID_NOW										      VARCHAR2(16)
 VALID_TYPE										      VARCHAR2(15)
 VALID_ROLE										      VARCHAR2(12)
 DB_UNIQUE_NAME 								      VARCHAR2(30)
 VERIFY 										      VARCHAR2(3)
 COMPRESSION									      VARCHAR2(7)
 APPLIED_SCN									      NUMBER
--查看归档日志文件的位置信息
SQL> SELECT INST_ID, DEST_ID, DEST_NAME FROM GV$ARCHIVE_DEST;
   INST_ID    DEST_ID DEST_NAME
---------- ---------- ------------------------------
	 2	    1 LOG_ARCHIVE_DEST_1
	 2	    2 LOG_ARCHIVE_DEST_2
	 2	    3 LOG_ARCHIVE_DEST_3
	 2	    4 LOG_ARCHIVE_DEST_4
	 2	    5 LOG_ARCHIVE_DEST_5
	 2	    6 LOG_ARCHIVE_DEST_6
	 2	    7 LOG_ARCHIVE_DEST_7
	 2	    8 LOG_ARCHIVE_DEST_8
	 2	    9 LOG_ARCHIVE_DEST_9
	 2	   10 LOG_ARCHIVE_DEST_10
	 2	   11 LOG_ARCHIVE_DEST_11
	 2	   12 LOG_ARCHIVE_DEST_12
	 2	   13 LOG_ARCHIVE_DEST_13
	 2	   14 LOG_ARCHIVE_DEST_14
	 2	   15 LOG_ARCHIVE_DEST_15
	 2	   16 LOG_ARCHIVE_DEST_16
	 2	   17 LOG_ARCHIVE_DEST_17
	 2	   18 LOG_ARCHIVE_DEST_18
	 2	   19 LOG_ARCHIVE_DEST_19
	 2	   20 LOG_ARCHIVE_DEST_20
	 2	   21 LOG_ARCHIVE_DEST_21
	 2	   22 LOG_ARCHIVE_DEST_22
	 2	   23 LOG_ARCHIVE_DEST_23
	 2	   24 LOG_ARCHIVE_DEST_24
	 2	   25 LOG_ARCHIVE_DEST_25
	 2	   26 LOG_ARCHIVE_DEST_26
	 2	   27 LOG_ARCHIVE_DEST_27
	 2	   28 LOG_ARCHIVE_DEST_28
	 2	   29 LOG_ARCHIVE_DEST_29
	 2	   30 LOG_ARCHIVE_DEST_30
	 2	   31 LOG_ARCHIVE_DEST_31
	 1	    1 LOG_ARCHIVE_DEST_1
	 1	    2 LOG_ARCHIVE_DEST_2
	 1	    3 LOG_ARCHIVE_DEST_3
	 1	    4 LOG_ARCHIVE_DEST_4
	 1	    5 LOG_ARCHIVE_DEST_5
	 1	    6 LOG_ARCHIVE_DEST_6
	 1	    7 LOG_ARCHIVE_DEST_7
	 1	    8 LOG_ARCHIVE_DEST_8
	 1	    9 LOG_ARCHIVE_DEST_9
	 1	   10 LOG_ARCHIVE_DEST_10
	 1	   11 LOG_ARCHIVE_DEST_11
	 1	   12 LOG_ARCHIVE_DEST_12
	 1	   13 LOG_ARCHIVE_DEST_13
	 1	   14 LOG_ARCHIVE_DEST_14
	 1	   15 LOG_ARCHIVE_DEST_15
	 1	   16 LOG_ARCHIVE_DEST_16
	 1	   17 LOG_ARCHIVE_DEST_17
	 1	   18 LOG_ARCHIVE_DEST_18
	 1	   19 LOG_ARCHIVE_DEST_19
	 1	   20 LOG_ARCHIVE_DEST_20
	 1	   21 LOG_ARCHIVE_DEST_21
	 1	   22 LOG_ARCHIVE_DEST_22
	 1	   23 LOG_ARCHIVE_DEST_23
	 1	   24 LOG_ARCHIVE_DEST_24
	 1	   25 LOG_ARCHIVE_DEST_25
	 1	   26 LOG_ARCHIVE_DEST_26
	 1	   27 LOG_ARCHIVE_DEST_27
	 1	   28 LOG_ARCHIVE_DEST_28
	 1	   29 LOG_ARCHIVE_DEST_29
	 1	   30 LOG_ARCHIVE_DEST_30
	 1	   31 LOG_ARCHIVE_DEST_31
62 rows selected.
```

### 2、查看归档日志文件的信息

### （1）使用数据字典 V$ARCHIVED_LOG 查看归档日志文件的信息

```java
--数据字典的结构
SQL> DESC V$ARCHIVED_LOG;
 Name										     Null?    Type
 -------------------------------------------------------------------------------
 RECID											      NUMBER
 STAMP											      NUMBER
 NAME											      VARCHAR2(513)
 DEST_ID										      NUMBER
 THREAD#										      NUMBER
 SEQUENCE#										      NUMBER
 RESETLOGS_CHANGE#								      NUMBER
 RESETLOGS_TIME 								      DATE
 RESETLOGS_ID									      NUMBER
 FIRST_CHANGE#									      NUMBER
 FIRST_TIME										      DATE
 NEXT_CHANGE#									      NUMBER
 NEXT_TIME										      DATE
 BLOCKS 										      NUMBER
 BLOCK_SIZE										      NUMBER
 CREATOR										      VARCHAR2(7)
 REGISTRAR										      VARCHAR2(7)
 STANDBY_DEST									      VARCHAR2(3)
 ARCHIVED										      VARCHAR2(3)
 APPLIED										      VARCHAR2(9)
 DELETED										      VARCHAR2(3)
 STATUS 										      VARCHAR2(1)
 COMPLETION_TIME								      DATE
 DICTIONARY_BEGIN								      VARCHAR2(3)
 DICTIONARY_END 								      VARCHAR2(3)
 END_OF_REDO									      VARCHAR2(3)
 BACKUP_COUNT									      NUMBER
 ARCHIVAL_THREAD#								      NUMBER
 ACTIVATION#									      NUMBER
 IS_RECOVERY_DEST_FILE							       VARCHAR2(3)
 COMPRESSED										      VARCHAR2(3)
 FAL											      VARCHAR2(3)
 END_OF_REDO_TYPE								       VARCHAR2(10)
 BACKED_BY_VSS									       VARCHAR2(3)
--查看归档日志文件的信息
SQL> SELECT RECID, DEST_ID, NAME, THREAD#, SEQUENCE# 
     FROM V$ARCHIVED_LOG 
     WHERE ROWNUM<11 ORDER BY RESETLOGS_TIME DESC;
     RECID    DEST_ID NAME							      THREAD#  SEQUENCE#
---------- ---------- ------------------------------------------------------------ ----------
	 1	    1 /home/oracle/archivelog/thread_0002_seq_0000000022.5fd299b3.	    2	      22
		      1079891135.5f4366b6
	 2	    1 /home/oracle/archivelog/thread_0002_seq_0000000021.5fd299b3.	    2	      21
		      1079891135.5f4366b6
	 3	    1 /home/oracle/archivelog/thread_0001_seq_0000000027.5fd299b3.	    1	      27
		      1079891135.5f4366b6
	 4	    1 /home/oracle/archivelog/thread_0001_seq_0000000026.5fd299b3.	    1	      26
		      1079891135.5f4366b6
	10	    1 /home/oracle/archivelog/thread_0001_seq_0000000031.5fd299b3.	    1	      31
		      1079891135.5f4366b6
	 6	    1 /home/oracle/archivelog/thread_0001_seq_0000000029.5fd299b3.	    1	      29
		      1079891135.5f4366b6
	 7	    1 /home/oracle/archivelog/thread_0002_seq_0000000024.5fd299b3.	    2	      24
		      1079891135.5f4366b6
	 8	    1 /home/oracle/archivelog/thread_0002_seq_0000000023.5fd299b3.	    2	      23
		      1079891135.5f4366b6
	 9	    1 /home/oracle/archivelog/thread_0001_seq_0000000028.5fd299b3.	    1	      28
		      1079891135.5f4366b6
	 5	    1 /home/oracle/archivelog/thread_0001_seq_0000000030.5fd299b3.	    1	      30
		      1079891135.5f4366b6
10 rows selected.
```

### （2）使用数据字典 GV$ARCHIVED_LOG 查看归档日志文件的信息

```java
--数据字典的结构
SQL> DESC GV$ARCHIVED_LOG;
 Name										     Null?    Type
 ----------------------------------------------------------------------------------
 INST_ID										      NUMBER
 RECID											      NUMBER
 STAMP											      NUMBER
 NAME											      VARCHAR2(513)
 DEST_ID										      NUMBER
 THREAD#										      NUMBER
 SEQUENCE#										      NUMBER
 RESETLOGS_CHANGE#								      NUMBER
 RESETLOGS_TIME 								      DATE
 RESETLOGS_ID									      NUMBER
 FIRST_CHANGE#									      NUMBER
 FIRST_TIME										      DATE
 NEXT_CHANGE#									      NUMBER
 NEXT_TIME										      DATE
 BLOCKS 										      NUMBER
 BLOCK_SIZE										      NUMBER
 CREATOR										      VARCHAR2(7)
 REGISTRAR										      VARCHAR2(7)
 STANDBY_DEST									      VARCHAR2(3)
 ARCHIVED										      VARCHAR2(3)
 APPLIED										      VARCHAR2(9)
 DELETED										      VARCHAR2(3)
 STATUS 										      VARCHAR2(1)
 COMPLETION_TIME								      DATE
 DICTIONARY_BEGIN								      VARCHAR2(3)
 DICTIONARY_END 								      VARCHAR2(3)
 END_OF_REDO									      VARCHAR2(3)
 BACKUP_COUNT									      NUMBER
 ARCHIVAL_THREAD#								      NUMBER
 ACTIVATION#									      NUMBER
 IS_RECOVERY_DEST_FILE							      VARCHAR2(3)
 COMPRESSED										      VARCHAR2(3)
 FAL											      VARCHAR2(3)
 END_OF_REDO_TYPE								      VARCHAR2(10)
 BACKED_BY_VSS									      VARCHAR2(3)
--查看归档日志文件的信息
SQL> SELECT INST_ID, RECID, DEST_ID, NAME, THREAD#, SEQUENCE# FROM GV$ARCHIVED_LOG WHERE ROWNUM<11 ORDER BY RESETLOGS_TIME DESC;
   INST_ID	RECID	 DEST_ID NAME								 THREAD#  SEQUENCE#
---------- ---------- ---------- ------------------------------------------------------------
2	    1	       1 /home/oracle/archivelog/thread_0002_seq_0000000022.5fd299b3.	   2	 22
				 1079891135.5f4366b6
2	    2	       1 /home/oracle/archivelog/thread_0002_seq_0000000021.5fd299b3.	   2	 21
				 1079891135.5f4366b6
2	    3	       1 /home/oracle/archivelog/thread_0001_seq_0000000027.5fd299b3.	   1	 27
				 1079891135.5f4366b6
2	    4	       1 /home/oracle/archivelog/thread_0001_seq_0000000026.5fd299b3.	   1	 26
				 1079891135.5f4366b6
2	   10	       1 /home/oracle/archivelog/thread_0001_seq_0000000031.5fd299b3.	   1	 31
				 1079891135.5f4366b6
2	    6	       1 /home/oracle/archivelog/thread_0001_seq_0000000029.5fd299b3.	   1	 29
				 1079891135.5f4366b6
2	    7	       1 /home/oracle/archivelog/thread_0002_seq_0000000024.5fd299b3.	   2	 24
				 1079891135.5f4366b6
2	    8	       1 /home/oracle/archivelog/thread_0002_seq_0000000023.5fd299b3.	   2	 23
				 1079891135.5f4366b6
2	    9	       1 /home/oracle/archivelog/thread_0001_seq_0000000028.5fd299b3.	   1	 28
				 1079891135.5f4366b6
2	    5	       1 /home/oracle/archivelog/thread_0001_seq_0000000030.5fd299b3.	   1	 30
				 1079891135.5f4366b6
10 rows selected.
```
