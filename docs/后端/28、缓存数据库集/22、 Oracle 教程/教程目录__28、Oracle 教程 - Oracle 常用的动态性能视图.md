# 28、Oracle 教程 - Oracle 常用的动态性能视图
- 来源：https://ddkk.com/zhuanlan/db/oracle/1/28.html
- 分类：缓存数据库
- 分组：教程目录
## 一、查看数据库状态信息

```java
-- GV$DATABASE 视图看到的两个节点其实是同一个数据库
SQL> SELECT DBID,NAME,CREATED,LOG_MODE,CURRENT_SCN FROM V$DATABASE;
      DBID NAME      CREATED   LOG_MODE     CURRENT_SCN
---------- --------- --------- ------------ -----------
1598252726 ORCL      21-APR-21 ARCHIVELOG	3763255
SQL> SELECT INST_ID,DBID,NAME,CREATED,LOG_MODE,CURRENT_SCN FROM GV$DATABASE;
   INST_ID	 DBID NAME	CREATED   LOG_MODE     CURRENT_SCN
---------- ---------- --------- --------- ------------ -----------
	 2 1598252726 ORCL	21-APR-21 ARCHIVELOG	   3763349
	 1 1598252726 ORCL	21-APR-21 ARCHIVELOG	   3763349
```

## 二、查询实例的状态信息

```java
--节点1
SQL> SELECT INSTANCE_NUMBER, INSTANCE_NAME, HOST_NAME FROM V$INSTANCE;
INSTANCE_NUMBER INSTANCE_NAME	 HOST_NAME
--------------- ---------------- ----------------------------------------------------------------
	      2 orcl2		 rac2
--节点2
SQL> SELECT INSTANCE_NUMBER, INSTANCE_NAME, HOST_NAME FROM V$INSTANCE;
INSTANCE_NUMBER INSTANCE_NAME	 HOST_NAME
--------------- ---------------- ----------------------------------------------------------------
	      2 orcl2		 rac2
SQL> SELECT INSTANCE_NUMBER, INSTANCE_NAME, HOST_NAME FROM GV$INSTANCE;
INSTANCE_NUMBER INSTANCE_NAME	 HOST_NAME
--------------- ---------------- ----------------------------------------------------------------
	      2 orcl2		 rac2
	      1 orcl1		 rac1
```

## 三、查询数据文件的基本信息

```java
--节点1
SELECT SQL> SELECT FILE#,NAME,TS#,STATUS FROM V$DATAFILE;
     FILE# NAME 							       TS# STATUS
---------- ------------------------------------------------------------ ---------- -------
	 1 +DATA/orcl/datafile/system.256.1070471889				 0 SYSTEM
	 2 +DATA/orcl/datafile/sysaux.257.1070471889				 1 ONLINE
	 3 +DATA/orcl/datafile/undotbs1.258.1070471891				 2 ONLINE
	 4 +DATA/orcl/datafile/users.259.1070471891				 4 ONLINE
	 5 +DATA/orcl/datafile/undotbs2.264.1070472143				 5 ONLINE
	 6 +DATA/orcl/datafile/ts001.dbf					 6 ONLINE
	 7 +DATA/orcl/datafile/undotbs11					12 ONLINE
	 8 +DATA/orcl/datafile/undo_archive.dbf 				13 ONLINE
	 9 +DATA/orcl/datafile/ts003.dbf					14 ONLINE
9 rows selected.
--节点2
SQL> SELECT FILE#,NAME,TS#,STATUS FROM V$DATAFILE;
     FILE# NAME 							       TS# STATUS
---------- ------------------------------------------------------------ ---------- -------
	 1 +DATA/orcl/datafile/system.256.1070471889				 0 SYSTEM
	 2 +DATA/orcl/datafile/sysaux.257.1070471889				 1 ONLINE
	 3 +DATA/orcl/datafile/undotbs1.258.1070471891				 2 ONLINE
	 4 +DATA/orcl/datafile/users.259.1070471891				 4 ONLINE
	 5 +DATA/orcl/datafile/undotbs2.264.1070472143				 5 ONLINE
	 6 +DATA/orcl/datafile/ts001.dbf					 6 ONLINE
	 7 +DATA/orcl/datafile/undotbs11					12 ONLINE
	 8 +DATA/orcl/datafile/undo_archive.dbf 				13 ONLINE
	 9 +DATA/orcl/datafile/ts003.dbf					14 ONLINE
9 rows selected.
--查询 GV$DATAFILE
SQL> SELECT INST_ID,FILE#,NAME,TS#,STATUS FROM GV$DATAFILE;
   INST_ID	FILE# NAME								  TS# STATUS
---------- ---------- ------------------------------------------------------------ ---------- -------
	 2	    1 +DATA/orcl/datafile/system.256.1070471889 			    0 SYSTEM
	 2	    2 +DATA/orcl/datafile/sysaux.257.1070471889 			    1 ONLINE
	 2	    3 +DATA/orcl/datafile/undotbs1.258.1070471891			    2 ONLINE
	 2	    4 +DATA/orcl/datafile/users.259.1070471891				    4 ONLINE
	 2	    5 +DATA/orcl/datafile/undotbs2.264.1070472143			    5 ONLINE
	 2	    6 +DATA/orcl/datafile/ts001.dbf					    6 ONLINE
	 2	    7 +DATA/orcl/datafile/undotbs11					   12 ONLINE
	 2	    8 +DATA/orcl/datafile/undo_archive.dbf				   13 ONLINE
	 2	    9 +DATA/orcl/datafile/ts003.dbf					   14 ONLINE
	 1	    1 +DATA/orcl/datafile/system.256.1070471889 			    0 SYSTEM
	 1	    2 +DATA/orcl/datafile/sysaux.257.1070471889 			    1 ONLINE
	 1	    3 +DATA/orcl/datafile/undotbs1.258.1070471891			    2 ONLINE
	 1	    4 +DATA/orcl/datafile/users.259.1070471891				    4 ONLINE
	 1	    5 +DATA/orcl/datafile/undotbs2.264.1070472143			    5 ONLINE
	 1	    6 +DATA/orcl/datafile/ts001.dbf					    6 ONLINE
	 1	    7 +DATA/orcl/datafile/undotbs11					   12 ONLINE
	 1	    8 +DATA/orcl/datafile/undo_archive.dbf				   13 ONLINE
	 1	    9 +DATA/orcl/datafile/ts003.dbf					   14 ONLINE
18 rows selected.
```

## 四、查询临时文件的基本信息

```java
--节点1
SQL> SELECT FILE#,NAME,TS# FROM V$TEMPFILE;
     FILE# NAME 							       TS#
---------- ------------------------------------------------------------ ----------
	 1 +DATA/orcl/tempfile/temp.263.1070472029				 3
	 2 +DATA/orcl/tempfile/temp02.dbf					 8
	 3 +DATA/orcl/tempfile/temp03.dbf					10
--节点2
SQL> SELECT FILE#,NAME,TS# FROM V$TEMPFILE;
     FILE# NAME 							       TS#
---------- ------------------------------------------------------------ ----------
	 1 +DATA/orcl/tempfile/temp.263.1070472029				 3
	 2 +DATA/orcl/tempfile/temp02.dbf					 8
	 3 +DATA/orcl/tempfile/temp03.dbf					10
--查询 GV$TEMPFILE
SQL> SELECT INST_ID,FILE#,NAME,TS# FROM GV$TEMPFILE;
   INST_ID	FILE# NAME								  TS#
---------- ---------- ------------------------------------------------------------ ----------
	 2	    1 +DATA/orcl/tempfile/temp.263.1070472029				    3
	 2	    2 +DATA/orcl/tempfile/temp02.dbf					    8
	 2	    3 +DATA/orcl/tempfile/temp03.dbf					   10
	 1	    1 +DATA/orcl/tempfile/temp.263.1070472029				    3
	 1	    2 +DATA/orcl/tempfile/temp02.dbf					    8
	 1	    3 +DATA/orcl/tempfile/temp03.dbf					   10
6 rows selected.
```

## 五、查询控制文件的基本信息

```java
--节点1
SQL> SELECT NAME,STATUS FROM V$CONTROLFILE;
NAME							     STATUS
------------------------------------------------------------ -------
+DATA/orcl/controlfile/control_file01.ctl
+BAK/orcl/controlfile/control_file02.ctl
+BAK/ctl_files/control_file03.ctl
--节点2
SQL> SELECT NAME,STATUS FROM V$CONTROLFILE;
NAME							     STATUS
------------------------------------------------------------ -------
+DATA/orcl/controlfile/control_file01.ctl
+BAK/orcl/controlfile/control_file02.ctl
+BAK/ctl_files/control_file03.ctl
--查询 GV$CONTROLFILE
SQL> SELECT INST_ID,NAME,STATUS FROM GV$CONTROLFILE;
   INST_ID NAME 							STATUS
---------- ------------------------------------------------------------ -------
	 2 +DATA/orcl/controlfile/control_file01.ctl
	 2 +BAK/orcl/controlfile/control_file02.ctl
	 2 +BAK/ctl_files/control_file03.ctl
	 1 +DATA/orcl/controlfile/control_file01.ctl
	 1 +BAK/orcl/controlfile/control_file02.ctl
	 1 +BAK/ctl_files/control_file03.ctl
6 rows selected.
```

## 六、查询日志文件的基本信息

### 1、查看日志组

```java
--节点1
SQL> SELECT GROUP#,MEMBERS,ARCHIVED,STATUS FROM V$LOG;
    GROUP#    MEMBERS ARC STATUS
---------- ---------- --- ----------------
	 1	    2 YES INACTIVE
	 2	    2 YES INACTIVE
	 3	    2 YES INACTIVE
	 4	    2 YES INACTIVE
	 5	    2 NO  CURRENT
	 6	    2 YES INACTIVE
	 7	    2 YES INACTIVE
	 8	    2 NO  CURRENT
8 rows selected.
--节点2
SQL> SELECT GROUP#,MEMBERS,ARCHIVED,STATUS FROM V$LOG;
    GROUP#    MEMBERS ARC STATUS
---------- ---------- --- ----------------
	 1	    2 YES INACTIVE
	 2	    2 YES INACTIVE
	 3	    2 YES INACTIVE
	 4	    2 YES INACTIVE
	 5	    2 NO  CURRENT
	 6	    2 YES INACTIVE
	 7	    2 YES INACTIVE
	 8	    2 NO  CURRENT
8 rows selected.
--查询GV$LOG
SQL> SELECT INST_ID,GROUP#,MEMBERS,ARCHIVED,STATUS FROM GV$LOG;
   INST_ID     GROUP#	 MEMBERS ARC STATUS
---------- ---------- ---------- --- ----------------
	 2	    1	       2 YES INACTIVE
	 2	    2	       2 YES INACTIVE
	 2	    3	       2 YES INACTIVE
	 2	    4	       2 YES INACTIVE
	 2	    5	       2 NO  CURRENT
	 2	    6	       2 YES INACTIVE
	 2	    7	       2 YES INACTIVE
	 2	    8	       2 NO  CURRENT
	 1	    1	       2 YES INACTIVE
	 1	    2	       2 YES INACTIVE
	 1	    3	       2 YES INACTIVE
	 1	    4	       2 YES INACTIVE
	 1	    5	       2 NO  CURRENT
	 1	    6	       2 YES INACTIVE
	 1	    7	       2 YES INACTIVE
	 1	    8	       2 NO  CURRENT
16 rows selected.
```

### 2、查询日志文件

```java
--节点1
SQL> SELECT GROUP#,STATUS,TYPE,MEMBER FROM V$LOGFILE;
    GROUP# STATUS  TYPE    MEMBER
---------- ------- ------- --------------------------------------------------
	 2	   ONLINE  +DATA/orcl/onlinelog/group_2.262.1070472003
	 2	   ONLINE  +BAK/orcl/onlinelog/group_2.258.1070472005
	 1	   ONLINE  +DATA/orcl/onlinelog/group_1.261.1070471997
	 1	   ONLINE  +BAK/orcl/onlinelog/group_1.257.1070471999
	 3	   ONLINE  +DATA/orcl/onlinelog/group_3.265.1070472253
	 3	   ONLINE  +BAK/orcl/onlinelog/group_3.259.1070472255
	 4	   ONLINE  +DATA/orcl/onlinelog/group_4.266.1070472257
	 4	   ONLINE  +BAK/orcl/onlinelog/group_4.260.1070472261
	 5	   ONLINE  +DATA/orcl/onlinelog/group_5.268.1079737919
	 5	   ONLINE  +BAK/orcl/onlinelog/group_5.263.1079737919
	 6	   ONLINE  +DATA/orcl/onlinelog/group_6.269.1079737941
	 6	   ONLINE  +BAK/orcl/onlinelog/group_6.264.1079737943
	 7	   ONLINE  +DATA/orcl/onlinelog/group_7_redo7_01.log
	 7	   ONLINE  +BAK/orcl/onlinelog/group_7_redo7_02.log
	 8	   ONLINE  +DATA/orcl/onlinelog/group_8_redo8_01.log
	 8	   ONLINE  +BAK/orcl/onlinelog/group_8_redo8_02.log
16 rows selected.
--节点2
SQL> SELECT GROUP#,STATUS,TYPE,MEMBER FROM V$LOGFILE;
    GROUP# STATUS  TYPE    MEMBER
---------- ------- ------- --------------------------------------------------
	 2	   ONLINE  +DATA/orcl/onlinelog/group_2.262.1070472003
	 2	   ONLINE  +BAK/orcl/onlinelog/group_2.258.1070472005
	 1	   ONLINE  +DATA/orcl/onlinelog/group_1.261.1070471997
	 1	   ONLINE  +BAK/orcl/onlinelog/group_1.257.1070471999
	 3	   ONLINE  +DATA/orcl/onlinelog/group_3.265.1070472253
	 3	   ONLINE  +BAK/orcl/onlinelog/group_3.259.1070472255
	 4	   ONLINE  +DATA/orcl/onlinelog/group_4.266.1070472257
	 4	   ONLINE  +BAK/orcl/onlinelog/group_4.260.1070472261
	 5	   ONLINE  +DATA/orcl/onlinelog/group_5.268.1079737919
	 5	   ONLINE  +BAK/orcl/onlinelog/group_5.263.1079737919
	 6	   ONLINE  +DATA/orcl/onlinelog/group_6.269.1079737941
	 6	   ONLINE  +BAK/orcl/onlinelog/group_6.264.1079737943
	 7	   ONLINE  +DATA/orcl/onlinelog/group_7_redo7_01.log
	 7	   ONLINE  +BAK/orcl/onlinelog/group_7_redo7_02.log
	 8	   ONLINE  +DATA/orcl/onlinelog/group_8_redo8_01.log
	 8	   ONLINE  +BAK/orcl/onlinelog/group_8_redo8_02.log
16 rows selected.
--查看GV$LOGFILE
SQL> SELECT INST_ID,GROUP#,STATUS,TYPE,MEMBER FROM GV$LOGFILE;
   INST_ID     GROUP# STATUS  TYPE    MEMBER
---------- ---------- ------- ------- --------------------------------------------------
	 2	    2	      ONLINE  +DATA/orcl/onlinelog/group_2.262.1070472003
	 2	    2	      ONLINE  +BAK/orcl/onlinelog/group_2.258.1070472005
	 2	    1	      ONLINE  +DATA/orcl/onlinelog/group_1.261.1070471997
	 2	    1	      ONLINE  +BAK/orcl/onlinelog/group_1.257.1070471999
	 2	    3	      ONLINE  +DATA/orcl/onlinelog/group_3.265.1070472253
	 2	    3	      ONLINE  +BAK/orcl/onlinelog/group_3.259.1070472255
	 2	    4	      ONLINE  +DATA/orcl/onlinelog/group_4.266.1070472257
	 2	    4	      ONLINE  +BAK/orcl/onlinelog/group_4.260.1070472261
	 2	    5	      ONLINE  +DATA/orcl/onlinelog/group_5.268.1079737919
	 2	    5	      ONLINE  +BAK/orcl/onlinelog/group_5.263.1079737919
	 2	    6	      ONLINE  +DATA/orcl/onlinelog/group_6.269.1079737941
	 2	    6	      ONLINE  +BAK/orcl/onlinelog/group_6.264.1079737943
	 2	    7	      ONLINE  +DATA/orcl/onlinelog/group_7_redo7_01.log
	 2	    7	      ONLINE  +BAK/orcl/onlinelog/group_7_redo7_02.log
	 2	    8	      ONLINE  +DATA/orcl/onlinelog/group_8_redo8_01.log
	 2	    8	      ONLINE  +BAK/orcl/onlinelog/group_8_redo8_02.log
	 1	    2	      ONLINE  +DATA/orcl/onlinelog/group_2.262.1070472003
	 1	    2	      ONLINE  +BAK/orcl/onlinelog/group_2.258.1070472005
	 1	    1	      ONLINE  +DATA/orcl/onlinelog/group_1.261.1070471997
	 1	    1	      ONLINE  +BAK/orcl/onlinelog/group_1.257.1070471999
	 1	    3	      ONLINE  +DATA/orcl/onlinelog/group_3.265.1070472253
	 1	    3	      ONLINE  +BAK/orcl/onlinelog/group_3.259.1070472255
	 1	    4	      ONLINE  +DATA/orcl/onlinelog/group_4.266.1070472257
	 1	    4	      ONLINE  +BAK/orcl/onlinelog/group_4.260.1070472261
	 1	    5	      ONLINE  +DATA/orcl/onlinelog/group_5.268.1079737919
	 1	    5	      ONLINE  +BAK/orcl/onlinelog/group_5.263.1079737919
	 1	    6	      ONLINE  +DATA/orcl/onlinelog/group_6.269.1079737941
	 1	    6	      ONLINE  +BAK/orcl/onlinelog/group_6.264.1079737943
	 1	    7	      ONLINE  +DATA/orcl/onlinelog/group_7_redo7_01.log
	 1	    7	      ONLINE  +BAK/orcl/onlinelog/group_7_redo7_02.log
	 1	    8	      ONLINE  +DATA/orcl/onlinelog/group_8_redo8_01.log
	 1	    8	      ONLINE  +BAK/orcl/onlinelog/group_8_redo8_02.log
32 rows selected.
```

### 3、查询日志归档信息

```java
SQL> select name,dest_id,blocks,block_size,
     archived,status,backup_count
     from v$archived_log
     where rownum<10
     order by COMPLETION_TIME desc;
NAME								DEST_ID     BLOCKS BLOCK_SIZE ARC S BACKUP_COUNT
------------------------------------------------------------ ---------- ---------- ---------- 
/home/oracle/archivelog/thread_0001_seq_0000000028.5fd299b3.	   1      34572	  512 YES A	       0
1079891135.5f4366b6
/home/oracle/archivelog/thread_0002_seq_0000000023.5fd299b3.	   1      10015	  512 YES A	       0
1079891135.5f4366b6
/home/oracle/archivelog/thread_0002_seq_0000000024.5fd299b3.	   1       2419	  512 YES A	       0
1079891135.5f4366b6
/home/oracle/archivelog/thread_0001_seq_0000000029.5fd299b3.	   1 	 2	  512 YES A	       0
1079891135.5f4366b6
/home/oracle/archivelog/thread_0001_seq_0000000030.5fd299b3.	   1 	 1	  512 YES A	       0
1079891135.5f4366b6
/home/oracle/archivelog/thread_0001_seq_0000000027.5fd299b3.	   1 	 1	  512 YES A	       0
1079891135.5f4366b6
/home/oracle/archivelog/thread_0001_seq_0000000026.5fd299b3.	   1        853	  512 YES A	       0
1079891135.5f4366b6
/home/oracle/archivelog/thread_0002_seq_0000000021.5fd299b3.	   1 	89	  512 YES X	       0
1079891135.5f4366b6
/home/oracle/archivelog/thread_0002_seq_0000000022.5fd299b3.	   1 	 1	  512 YES X	       0
1079891135.5f4366b6
9 rows selected.
```

## 七、查询内存信息

```java
SQL> select name, value/1024/1024 SIZE_MB from v$sga;
NAME								SIZE_MB
------------------------------------------------------------ ----------
Fixed Size						     2.15324402
Variable Size						 516.003006
Database Buffers					 276
Redo Buffers						 2.26171875
SQL> select pool,name,bytes from v$sgastat;
POOL	     NAME							       BYTES
------------ ------------------------------------------------------------ ----------
	     fixed_sga							     2257840
	     buffer_cache						   289406976
	     log_buffer 						     2371584
shared pool  KEWS fixed SGA							5704
shared pool  dsktab_kfgsg						       58176
shared pool  jsksncb: 2 							7840
shared pool  file state object						     1102896
shared pool  event classes							1584
shared pool  KJFM heartbea							2968
1029 rows selected.
SQL> select owner,name,type,namespace,locks from v$db_object_cache where rownum<10;
OWNER	   NAME 			  TYPE		       NAMESPACE		 LOCKS
---------- ------------------------------ -------------------- -------------------- ----------
$BUILD$    40922edfbd7a5150		  CURSOR	       SQL AREA BUILD		     0
SYS	       WRH$_SQL_PLAN		  TABLE 	       TABLE/PROCEDURE		     0
	   7f5259471f5383ccfc3a966b99bf0c CURSOR STATS	       SQL AREA STATS		     0
	   76
	   SELECT COUNT(*) FROM 	  CURSOR	       SQL AREA 		     0
	   select   LOW_OPTIMAL_SIZE,	  CURSOR	       SQL AREA 		     0
		  HIGH_OPTIMAL_SIZE,
		 OPTIMAL_EXECUTIONS,
		 ONEPASS_EXECUTIONS,
		 MULTIPASSES_EXECUTIONS,
		     TOTAL_EXECUTIONS
	   from   GV$SQL_WORKAREA_HISTOGR
	   AM	 where	INST_ID = USERENV
	   ('Instance')
	   select   LOW_OPTIMAL_SIZE,	  CURSOR	       SQL AREA 		     0
		  HIGH_OPTIMAL_SIZE,
		 OPTIMAL_EXECUTIONS,
		 ONEPASS_EXECUTIONS,
		 MULTIPASSES_EXECUTIONS,
		     TOTAL_EXECUTIONS
	   from   GV$SQL_WORKAREA_HISTOGR
	   AM	 where	INST_ID = USERENV
	   ('Instance')
	   select inst_id,kmmsinam,kmmsip CURSOR	       SQL AREA 		     0
	   rp,kmmsista,kmmsinmg, kmmsinmb
	   ,kmmsibrk,kmmsivcp,kmmsiidl,km
	   msibsy,kmmsineti,kmmsineto,kmm
	   sitnc from x$kmmsi where bitan
	   d(kmmsiflg,1)!=0
	   select inst_id,kmmsinam,kmmsip CURSOR	       SQL AREA 		     0
	   rp,kmmsista,kmmsinmg, kmmsinmb
	   ,kmmsibrk,kmmsivcp,kmmsiidl,km
	   msibsy,kmmsineti,kmmsineto,kmm
	   sitnc from x$kmmsi where bitan
	   d(kmmsiflg,1)!=0
	   /* SQL Analyze(64,1) 	  CURSOR	       SQL AREA 		     0
9 rows selected.
SQL> select sql_id,sql_text from v$sql where rownum<5;
SQL_ID             SQL_TEXT
---------------------------------------------------------------------------------------
1fkh93md0802n
select	 LOW_OPTIMAL_SIZE,	     HIGH_OPTIMAL_SIZE, 	  OPTIMAL_EXECUTIONS,		ONEPASS_EXECUTIONS,	      MULTIPASSES_EXECUTIONS,	  TOTAL_EXECUTIONS    from   GV$SQL_WORKAREA_HISTOGRAM	  where  INST_ID = USERENV('Instance')
7nr1kb47kw04j
select inst_id,kmmsinam,kmmsiprp,kmmsista,kmmsinmg, kmmsinmb, kmmsibrk, kmmsivcp, kmmsiidl, kmmsibsy,kmmsineti,kmmsineto,kmmsitnc from x$kmmsi where bitand(kmmsiflg,1)!=0
4dy1xm4nxc0gf
insert into wrh$_system_event(snap_id, dbid, instance_number, event_id,total_waits, total_timeouts, time_waited_micro,	 total_waits_fg, total_timeouts_fg, time_waited_micro_fg)  select:snap_id, :dbid, :instance_number, event_id,    total_waits, total_timeouts, time_waited_micro, total_waits_fg, total_timeouts_fg, time_waited_micro_fg  from    v$system_event  order by	 event_id
aq8yqxyyb40nn
update sys.job$ set this_date=:1 where job=:2
```
