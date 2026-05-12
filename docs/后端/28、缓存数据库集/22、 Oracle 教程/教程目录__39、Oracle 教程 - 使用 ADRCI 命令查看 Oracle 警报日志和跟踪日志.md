# 39、Oracle 教程 - 使用 ADRCI 命令查看 Oracle 警报日志和跟踪日志
- 来源：https://ddkk.com/zhuanlan/db/oracle/1/39.html
- 分类：缓存数据库
- 分组：教程目录
Oracle 的 ADRCI 工具主要用来管理 alert 文件、trace 文件、dump 文件等。

Oracle 11g 中的 alert 文件以及 trace 文件的存放位置为：$ORACLE_BASE/diag/rdbms/DBNAME/INSTANCE_NAME 目录。使用 ADRCI 命令可以统一管理 ASM 实例和多个数据库实例的 alert 文件、后台 trace 文件、用户 trace 文件，dump文件等，还可以快速查询错误相关的所有 trace 文件，并将这些文件打包到一个 zip文件。

## 一、查看 v$diag_info 视图

```java
SQL> select name,value from v$diag_info;
NAME			  VALUE
------------------------- ----------------------------------------------------------------------
Diag Enabled		  TRUE
ADR Base		      /usr/local/oracle
ADR Home		      /usr/local/oracle/diag/rdbms/hisdb/hisdb
Diag Trace		      /usr/local/oracle/diag/rdbms/hisdb/hisdb/trace
Diag Alert		      /usr/local/oracle/diag/rdbms/hisdb/hisdb/alert
Diag Incident		  /usr/local/oracle/diag/rdbms/hisdb/hisdb/incident
Diag Cdump		      /usr/local/oracle/diag/rdbms/hisdb/hisdb/cdump
Health Monitor		  /usr/local/oracle/diag/rdbms/hisdb/hisdb/hm
Default Trace File	  /usr/local/oracle/diag/rdbms/hisdb/hisdb/trace/hisdb_ora_31090.trc
Active Problem Count	  3
Active Incident Count	  30
11 rows selected.
```

## 二、ADRCI 的相关命令

使用help 可以查看 ADRCI 相关的命令：

```java
[oracle@wgx trace]$ adrci
ADRCI: Release 11.2.0.4.0 - Production on Mon Dec 13 13:55:25 2021
Copyright (c) 1982, 2011, Oracle and/or its affiliates.  All rights reserved.
ADR base = "/usr/local/oracle"
adrci> help
 HELP [topic]
   Available Topics:
        CREATE REPORT
        ECHO
        EXIT
        HELP
        HOST
        IPS
        PURGE
        RUN
        SET BASE
        SET BROWSER
        SET CONTROL
        SET ECHO
        SET EDITOR
        SET HOMES | HOME | HOMEPATH
        SET TERMOUT
        SHOW ALERT
        SHOW BASE
        SHOW CONTROL
        SHOW HM_RUN
        SHOW HOMES | HOME | HOMEPATH
        SHOW INCDIR
        SHOW INCIDENT
        SHOW PROBLEM
        SHOW REPORT
        SHOW TRACEFILE
        SPOOL
 There are other commands intended to be used directly by Oracle, type
 "HELP EXTENDED" to see the list
```

通过HELP 加命令，可以列出该命令的具体语法：

```java
adrci> help show problem
  Usage: SHOW PROBLEM [-p <predicate_string>] 
                      [-last <num> | -all]
                      [-orderby (field1, field2, ...) [ASC|DSC]]
  Purpose: Show the problem information. By default, this command will
           only show the last 50 problems.
  Options:
    [-p <predicate_string>]: The predicate string must be double-quoted.
    The field names that users can specify in the predicate are:
        PROBLEM_ID                    number
        PROBLEM_KEY                   text(550)
        FIRST_INCIDENT                number
        FIRSTINC_TIME                 timestamp
        LAST_INCIDENT                 number
        LASTINC_TIME                  timestamp
        IMPACT1                       number
        IMPACT2                       number
        IMPACT3                       number
        IMPACT4                       number
        SERVICE_REQUEST               text(64)
        BUG_NUMBER                    text(64)
    [-last <num> | -all]: This option allows users to either select 
    the last <num> of qualified problems to show or to show all the
    qualified problems. If this option is not specified, this command
    will only show 50 incidents.
    [-orderby (field1, field2, ...) [ASC|DSC]]: If specified, the results
    will be ordered by the specified fields' values. By default, it will be
    in the ascending order unless "DSC" is specified. Note that the field
    names that can be specified here are from the "PROBLEM" relation.
  Examples:  
    show problem 
    show problem -p "problem_id>123"
```

## 三、设置 ADRCI 的主目录

```java
adrci> set home diag/rdbms/hisdb/hisdb
adrci> show home
ADR Homes: 
diag/rdbms/hisdb/hisdb
```

## 四、使用 show alert 命令查看 alertlog 信息

```java
-- show alert -tail     (默认是10条条目)
-- show alert -tail 20 (显示最后20个条目)
-- show alert -tail -f  (和 tail -f alertlog 命令功能相同)
adrci> show alert -tail
2021-12-13 22:00:18.688000 +08:00
TABLE SYS.WRI$_OPTSTAT_HISTHEAD_HISTORY: ADDED INTERVAL PARTITION SYS_P81 (12) VALUES LESS THAN (TO_DATE(' 2021-12-13 12:21:25', 'SYYYY-MM-DD HH2
4:MI:SS', 'NLS_CALENDAR=GREGORIAN'))2021-12-13 22:00:19.950000 +08:00
TABLE SYS.WRI$_OPTSTAT_HISTGRM_HISTORY: ADDED INTERVAL PARTITION SYS_P84 (12) VALUES LESS THAN (TO_DATE(' 2021-12-13 12:21:26', 'SYYYY-MM-DD HH24
:MI:SS', 'NLS_CALENDAR=GREGORIAN'))2021-12-14 00:41:04.873000 +08:00
TABLE SYS.WRI$_OPTSTAT_HISTHEAD_HISTORY: ADDED INTERVAL PARTITION SYS_P101 (13) VALUES LESS THAN (TO_DATE(' 2021-12-14 12:21:25', 'SYYYY-MM-DD HH
24:MI:SS', 'NLS_CALENDAR=GREGORIAN'))2021-12-14 02:00:00.029000 +08:00
Closing scheduler window
Closing Resource Manager plan via scheduler window
Clearing Resource Manager plan via parameter
2021-12-14 22:00:00.005000 +08:00
Setting Resource Manager plan SCHEDULER[0x3004]:DEFAULT_MAINTENANCE_PLAN via scheduler window
Setting Resource Manager plan DEFAULT_MAINTENANCE_PLAN via parameter
Starting background process VKRM
VKRM started with pid=28, OS id=14416 
2021-12-14 22:00:01.624000 +08:00
Begin automatic SQL Tuning Advisor run for special tuning task  "SYS_AUTO_SQL_TUNING_TASK"
2021-12-14 22:00:04.082000 +08:00
End automatic SQL Tuning Advisor run for special tuning task  "SYS_AUTO_SQL_TUNING_TASK"
2021-12-14 22:00:06.599000 +08:00
TABLE SYS.WRI$_OPTSTAT_HISTGRM_HISTORY: ADDED INTERVAL PARTITION SYS_P121 (13) VALUES LESS THAN (TO_DATE(' 2021-12-14 12:21:26', 'SYYYY-MM-DD HH2
4:MI:SS', 'NLS_CALENDAR=GREGORIAN'))2021-12-15 00:41:19.327000 +08:00
TABLE SYS.WRI$_OPTSTAT_HISTHEAD_HISTORY: ADDED INTERVAL PARTITION SYS_P141 (14) VALUES LESS THAN (TO_DATE(' 2021-12-15 12:21:25', 'SYYYY-MM-DD HH
24:MI:SS', 'NLS_CALENDAR=GREGORIAN'))TABLE SYS.WRI$_OPTSTAT_HISTGRM_HISTORY: ADDED INTERVAL PARTITION SYS_P144 (14) VALUES LESS THAN (TO_DATE(' 2021-12-15 12:21:26', 'SYYYY-MM-DD HH2
4:MI:SS', 'NLS_CALENDAR=GREGORIAN'))2021-12-15 02:00:00.008000 +08:00
Closing scheduler window
Closing Resource Manager plan via scheduler window
Clearing Resource Manager plan via parameter
2021-12-15 12:46:37.515000 +08:00
Warning: VKTM detected a time drift.
Time drifts can result in an unexpected behavior such as time-outs. Please check trace file for more details.
--------------------------------------------------------------------------------------------
adrci> show alert -tail 20
2021-12-13 12:41:05.919000 +08:00
space available in the underlying filesystem or ASM diskgroup.
2021-12-13 12:41:07.420000 +08:00
Completed: ALTER DATABASE OPEN
Starting background process CJQ0
CJQ0 started with pid=19, OS id=2605 
2021-12-13 12:46:19.877000 +08:00
Warning: VKTM detected a time drift.
Time drifts can result in an unexpected behavior such as time-outs. Please check trace file for more details.
2021-12-13 12:46:32.223000 +08:00
Starting background process SMCO
SMCO started with pid=25, OS id=2647 
2021-12-13 22:00:00.070000 +08:00
Setting Resource Manager plan SCHEDULER[0x3003]:DEFAULT_MAINTENANCE_PLAN via scheduler window
Setting Resource Manager plan DEFAULT_MAINTENANCE_PLAN via parameter
Starting background process VKRM
VKRM started with pid=27, OS id=5977 
2021-12-13 22:00:06.279000 +08:00
Begin automatic SQL Tuning Advisor run for special tuning task  "SYS_AUTO_SQL_TUNING_TASK"
2021-12-13 22:00:17.148000 +08:00
End automatic SQL Tuning Advisor run for special tuning task  "SYS_AUTO_SQL_TUNING_TASK"
2021-12-13 22:00:18.688000 +08:00
TABLE SYS.WRI$_OPTSTAT_HISTHEAD_HISTORY: ADDED INTERVAL PARTITION SYS_P81 (12) VALUES LESS THAN (TO_DATE(' 2021-12-13 12:21:25', 'SYYYY-MM-DD HH2
4:MI:SS', 'NLS_CALENDAR=GREGORIAN'))2021-12-13 22:00:19.950000 +08:00
TABLE SYS.WRI$_OPTSTAT_HISTGRM_HISTORY: ADDED INTERVAL PARTITION SYS_P84 (12) VALUES LESS THAN (TO_DATE(' 2021-12-13 12:21:26', 'SYYYY-MM-DD HH24
:MI:SS', 'NLS_CALENDAR=GREGORIAN'))2021-12-14 00:41:04.873000 +08:00
TABLE SYS.WRI$_OPTSTAT_HISTHEAD_HISTORY: ADDED INTERVAL PARTITION SYS_P101 (13) VALUES LESS THAN (TO_DATE(' 2021-12-14 12:21:25', 'SYYYY-MM-DD HH
24:MI:SS', 'NLS_CALENDAR=GREGORIAN'))2021-12-14 02:00:00.029000 +08:00
Closing scheduler window
Closing Resource Manager plan via scheduler window
Clearing Resource Manager plan via parameter
2021-12-14 22:00:00.005000 +08:00
Setting Resource Manager plan SCHEDULER[0x3004]:DEFAULT_MAINTENANCE_PLAN via scheduler window
Setting Resource Manager plan DEFAULT_MAINTENANCE_PLAN via parameter
Starting background process VKRM
VKRM started with pid=28, OS id=14416 
2021-12-14 22:00:01.624000 +08:00
Begin automatic SQL Tuning Advisor run for special tuning task  "SYS_AUTO_SQL_TUNING_TASK"
2021-12-14 22:00:04.082000 +08:00
End automatic SQL Tuning Advisor run for special tuning task  "SYS_AUTO_SQL_TUNING_TASK"
2021-12-14 22:00:06.599000 +08:00
TABLE SYS.WRI$_OPTSTAT_HISTGRM_HISTORY: ADDED INTERVAL PARTITION SYS_P121 (13) VALUES LESS THAN (TO_DATE(' 2021-12-14 12:21:26', 'SYYYY-MM-DD HH2
4:MI:SS', 'NLS_CALENDAR=GREGORIAN'))2021-12-15 00:41:19.327000 +08:00
TABLE SYS.WRI$_OPTSTAT_HISTHEAD_HISTORY: ADDED INTERVAL PARTITION SYS_P141 (14) VALUES LESS THAN (TO_DATE(' 2021-12-15 12:21:25', 'SYYYY-MM-DD HH
24:MI:SS', 'NLS_CALENDAR=GREGORIAN'))TABLE SYS.WRI$_OPTSTAT_HISTGRM_HISTORY: ADDED INTERVAL PARTITION SYS_P144 (14) VALUES LESS THAN (TO_DATE(' 2021-12-15 12:21:26', 'SYYYY-MM-DD HH2
4:MI:SS', 'NLS_CALENDAR=GREGORIAN'))2021-12-15 02:00:00.008000 +08:00
Closing scheduler window
Closing Resource Manager plan via scheduler window
Clearing Resource Manager plan via parameter
2021-12-15 12:46:37.515000 +08:00
Warning: VKTM detected a time drift.
Time drifts can result in an unexpected behavior such as time-outs. Please check trace file for more details.
--------------------------------------------------------------------------------------------
adrci> show alert -tail -f 
2021-12-13 22:00:18.688000 +08:00
TABLE SYS.WRI$_OPTSTAT_HISTHEAD_HISTORY: ADDED INTERVAL PARTITION SYS_P81 (12) VALUES LESS THAN (TO_DATE(' 2021-12-13 12:21:25', 'SYYYY-MM-DD HH2
4:MI:SS', 'NLS_CALENDAR=GREGORIAN'))2021-12-13 22:00:19.950000 +08:00
TABLE SYS.WRI$_OPTSTAT_HISTGRM_HISTORY: ADDED INTERVAL PARTITION SYS_P84 (12) VALUES LESS THAN (TO_DATE(' 2021-12-13 12:21:26', 'SYYYY-MM-DD HH24
:MI:SS', 'NLS_CALENDAR=GREGORIAN'))2021-12-14 00:41:04.873000 +08:00
TABLE SYS.WRI$_OPTSTAT_HISTHEAD_HISTORY: ADDED INTERVAL PARTITION SYS_P101 (13) VALUES LESS THAN (TO_DATE(' 2021-12-14 12:21:25', 'SYYYY-MM-DD HH
24:MI:SS', 'NLS_CALENDAR=GREGORIAN'))2021-12-14 02:00:00.029000 +08:00
Closing scheduler window
Closing Resource Manager plan via scheduler window
Clearing Resource Manager plan via parameter
2021-12-14 22:00:00.005000 +08:00
Setting Resource Manager plan SCHEDULER[0x3004]:DEFAULT_MAINTENANCE_PLAN via scheduler window
Setting Resource Manager plan DEFAULT_MAINTENANCE_PLAN via parameter
Starting background process VKRM
VKRM started with pid=28, OS id=14416 
2021-12-14 22:00:01.624000 +08:00
Begin automatic SQL Tuning Advisor run for special tuning task  "SYS_AUTO_SQL_TUNING_TASK"
2021-12-14 22:00:04.082000 +08:00
End automatic SQL Tuning Advisor run for special tuning task  "SYS_AUTO_SQL_TUNING_TASK"
2021-12-14 22:00:06.599000 +08:00
TABLE SYS.WRI$_OPTSTAT_HISTGRM_HISTORY: ADDED INTERVAL PARTITION SYS_P121 (13) VALUES LESS THAN (TO_DATE(' 2021-12-14 12:21:26', 'SYYYY-MM-DD HH2
4:MI:SS', 'NLS_CALENDAR=GREGORIAN'))2021-12-15 00:41:19.327000 +08:00
TABLE SYS.WRI$_OPTSTAT_HISTHEAD_HISTORY: ADDED INTERVAL PARTITION SYS_P141 (14) VALUES LESS THAN (TO_DATE(' 2021-12-15 12:21:25', 'SYYYY-MM-DD HH
24:MI:SS', 'NLS_CALENDAR=GREGORIAN'))TABLE SYS.WRI$_OPTSTAT_HISTGRM_HISTORY: ADDED INTERVAL PARTITION SYS_P144 (14) VALUES LESS THAN (TO_DATE(' 2021-12-15 12:21:26', 'SYYYY-MM-DD HH2
4:MI:SS', 'NLS_CALENDAR=GREGORIAN'))2021-12-15 02:00:00.008000 +08:00
Closing scheduler window
Closing Resource Manager plan via scheduler window
Clearing Resource Manager plan via parameter
2021-12-15 12:46:37.515000 +08:00
Warning: VKTM detected a time drift.
Time drifts can result in an unexpected behavior such as time-outs. Please check trace file for more details.
```

## 五、使用 show tracefile 命令查看 trace files（跟踪文件）

```java
-- 查看所有的跟踪文件
adrci> show tracefile
     diag/rdbms/hisdb/hisdb/trace/alert_hisdb.log
     diag/rdbms/hisdb/hisdb/trace/hisdb_ora_2482.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_ora_2498.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_ora_2522.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_vktm_2530.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_mman_2542.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_dbw0_2544.trc
     .......
     diag/rdbms/hisdb/hisdb/trace/hisdb_m000_6945.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_ckpt_2487.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_j000_12675.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_vkrm_14416.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_j002_14420.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_m000_15385.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_j000_21031.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_vkrm_22730.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_j000_22734.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_m000_23678.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_j001_29176.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_vkrm_30867.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_j003_30883.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_m000_31809.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_j001_37321.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_vkrm_39017.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_j001_39015.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_m000_39960.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_vkrm_41753.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_j003_41763.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_j001_45485.trc
     diag/rdbms/hisdb/hisdb/incident/incdir_233/hisdb_ora_2663_i233.trc
     diag/rdbms/hisdb/hisdb/incident/incdir_234/hisdb_ora_2663_i234.trc
     diag/rdbms/hisdb/hisdb/incident/incdir_1355/hisdb_ora_2759_i1355.trc
     diag/rdbms/hisdb/hisdb/incident/incdir_1356/hisdb_ora_2759_i1356.trc
     diag/rdbms/hisdb/hisdb/incident/incdir_1357/hisdb_ora_2759_i1357.trc
     diag/rdbms/hisdb/hisdb/incident/incdir_1358/hisdb_ora_2759_i1358.trc
     diag/rdbms/hisdb/hisdb/incident/incdir_1359/hisdb_ora_2759_i1359.trc
     diag/rdbms/hisdb/hisdb/incident/incdir_2562/hisdb_ora_2877_i2562.trc
     diag/rdbms/hisdb/hisdb/incident/incdir_2594/hisdb_j001_2935_i2594.trc
     diag/rdbms/hisdb/hisdb/incident/incdir_2595/hisdb_j001_2935_i2595.trc
     diag/rdbms/hisdb/hisdb/incident/incdir_2563/hisdb_ora_2877_i2563.trc
     diag/rdbms/hisdb/hisdb/incident/incdir_2586/hisdb_j000_2895_i2586.trc
   --查看某种类型的跟踪文件
     adrci> show tracefile %ora%
     diag/rdbms/hisdb/hisdb/trace/hisdb_ora_2482.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_ora_2498.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_ora_2522.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_ora_2577.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_ora_2651.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_ora_2653.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_ora_2650.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_ora_2649.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_ora_2652.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_ora_2579.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_ora_2663.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_ora_2707.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_ora_2715.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_ora_2759.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_ora_2833.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_ora_2877.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_ora_2467.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_ora_2517.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_ora_2461.trc
     diag/rdbms/hisdb/hisdb/trace/hisdb_ora_2505.trc
     diag/rdbms/hisdb/hisdb/incident/incdir_233/hisdb_ora_2663_i233.trc
     diag/rdbms/hisdb/hisdb/incident/incdir_234/hisdb_ora_2663_i234.trc
     diag/rdbms/hisdb/hisdb/incident/incdir_1355/hisdb_ora_2759_i1355.trc
     diag/rdbms/hisdb/hisdb/incident/incdir_1356/hisdb_ora_2759_i1356.trc
     diag/rdbms/hisdb/hisdb/incident/incdir_1357/hisdb_ora_2759_i1357.trc
     diag/rdbms/hisdb/hisdb/incident/incdir_1358/hisdb_ora_2759_i1358.trc
     diag/rdbms/hisdb/hisdb/incident/incdir_1359/hisdb_ora_2759_i1359.trc
     diag/rdbms/hisdb/hisdb/incident/incdir_2562/hisdb_ora_2877_i2562.trc
     diag/rdbms/hisdb/hisdb/incident/incdir_2563/hisdb_ora_2877_i2563.trc
```

## 六、使用 show incident 命令查看 incident

```java
adrci> show incident 
ADR Home = /usr/local/oracle/diag/rdbms/hisdb/hisdb:
*************************************************************************
INCIDENT_ID          PROBLEM_KEY                                    CREATE_TIME     
-------------------- -------------------------------------------------------------------------- 
233                  ORA 600 [kcffo_recreate_tmpf-04]          2021-12-02 12:08:45.618000 +08:00     234                  ORA 7445 [eomg_migrate_if_oldnew()+61]    2021-12-02 12:09:59.881000 +08:00   
1355                 ORA 4031                                  2021-12-02 12:30:12.701000 +08:00 
1356                 ORA 4031                                  2021-12-02 12:36:45.941000 +08:00
1357                 ORA 4031                                  2021-12-02 12:37:15.369000 +08:00
1358                 ORA 4031                                  2021-12-02 12:37:21.223000 +08:00
1359                 ORA 4031                                  2021-12-02 12:37:43.999000 +08:00
2562                 ORA 4031                                  2021-12-02 12:42:47.572000 +08:00
2594                 ORA 4031                                  2021-12-02 12:43:15.071000 +08:00
2595                 ORA 4031                                  2021-12-02 12:43:15.891000 +08:00
2563                 ORA 4031                                  2021-12-02 12:43:19.689000 +08:00
2586                 ORA 4031                                  2021-12-02 12:43:21.068000 +08:00
```

使用show tracefile -I incident_id 查看某个 incident_id 对应的文件信息：

```java
adrci> show tracefile -I 2586 
     diag/rdbms/hisdb/hisdb/incident/incdir_2586/hisdb_j000_2895_i2586.trc
```

使用show incident -mode detail -p “incident_id=***” 查看某个 incident_id 对应的详细信息：

```java
adrci> show incident -mode detail -p "incident_id=2586"
ADR Home = /usr/local/oracle/diag/rdbms/hisdb/hisdb:
*************************************************************************
**********************************************************
INCIDENT INFO RECORD 1
**********************************************************
   INCIDENT_ID                   2586
   STATUS                        ready
   CREATE_TIME                   2021-12-02 12:43:21.068000 +08:00
   PROBLEM_ID                    3
   CLOSE_TIME                    <NULL>
   FLOOD_CONTROLLED              none
   ERROR_FACILITY                ORA
   ERROR_NUMBER                  4031
   ERROR_ARG1                    32
   ERROR_ARG2                    shared pool
   ERROR_ARG3                    select obj# from oid$ where ...
   ERROR_ARG4                    KGLH0^31c9af70
   ERROR_ARG5                    kglHeapInitialize:temp
   ERROR_ARG6                    <NULL>
   ERROR_ARG7                    <NULL>
   ERROR_ARG8                    <NULL>
   ERROR_ARG9                    <NULL>
   ERROR_ARG10                   <NULL>
   ERROR_ARG11                   <NULL>
   ERROR_ARG12                   <NULL>
   SIGNALLING_COMPONENT          KGH
   SIGNALLING_SUBCOMPONENT       <NULL>
   SUSPECT_COMPONENT             <NULL>
   SUSPECT_SUBCOMPONENT          <NULL>
   ECID                          <NULL>
   IMPACTS                       0
   PROBLEM_KEY                   ORA 4031
   FIRST_INCIDENT                1355
   FIRSTINC_TIME                 2021-12-02 12:30:12.701000 +08:00
   LAST_INCIDENT                 3612
   LASTINC_TIME                  2021-12-02 12:43:39.068000 +08:00
   IMPACT1                       34668547
   IMPACT2                       34668546
   IMPACT3                       0
   IMPACT4                       0
   KEY_NAME                      Client ProcId
   KEY_VALUE                     oracle@wgx.2895_140232683054912
   KEY_NAME                      ProcId
   KEY_VALUE                     22.3
   KEY_NAME                      SID
   KEY_VALUE                     26.7
   KEY_NAME                      PQ
   KEY_VALUE                     (0, 1638420193)
   OWNER_ID                      1
   INCIDENT_FILE                 /usr/local/oracle/diag/rdbms/hisdb/hisdb/trace/hisdb_j000_2895.trc
   OWNER_ID                      1
   INCIDENT_FILE                 /usr/local/oracle/diag/rdbms/hisdb/hisdb/incident/incdir_2586/hisdb_j000_2895_i2586.trc
1 rows fetched
```

## 七、使用 show problem 命令查看 problem

```java
adrci> show problem
ADR Home = /usr/local/oracle/diag/rdbms/hisdb/hisdb:
*************************************************************************
PROBLEM_ID           PROBLEM_KEY                      LAST_INCIDENT        LASTINC_TIME                             
-------------------- ----------------------------------------------------------------- 
1               ORA 600 [kcffo_recreate_tmpf-04]       233   2021-12-02 12:08:45.618000 +08:00
2               ORA 7445 [eomg_migrate_if_oldnew()+61] 234   2021-12-02 12:09:59.881000 +08:00
3               ORA 4031                              3612   2021-12-02 12:43:39.068000 +08:00
3 rows fetched
```
