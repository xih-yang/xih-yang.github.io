# 11、Oracle 教程 - Oracle 的联机日志文件（Redo log files）
- 来源：https://ddkk.com/zhuanlan/db/oracle/1/11.html
- 分类：缓存数据库
- 分组：教程目录
联机日志文件又叫重做日志文件，记录了对数据库修改的信息，一个 Oracle 实例有一组或多组联机日志文件，每组包含一个或多个日志成员，同一组的日志成员内容相同，存放位置不同，防止日志文件组内某个日志文件损坏导致数据丢失。

lgwr 进程负责将数据写入日志文件，如果一组日志文件被写满，会自动切换到下一组日志文件。当所有的日志文件都被写满时，如果数据库为非归档模式，则直接覆盖 sequence 最小的日志组；如果数据库为归档模式，lgwr 进程开始等待归档进程将日志信息写入到归档日志中，然后覆盖 sequence 最小的日志组。

联机日志文件具有如下特点：

（1）联机日志文件以组为单位工作；

（2）数据库正常工作至少需要两组联机日志；

（3）联机日志记录所有数据块的变化，用来做实例恢复（recover）；

（4）同一组可以有多个成员；

（5）同一组的成员之间是镜像关系；

（6）默认情况下，日志成员写满 redo 时发生切换；

（7）日志切换时优先覆盖 sequence 最小的组；

（8）成员的位置和数量由控制文件决定。

## 一、联机日志的相关概念

### 1、日志文件的工作方式

日志文件采用按顺序循环写的方式。当一组联机日志组写满，LGWR 则将日志写入到下一组，当最后一组写满则从第一组开始写入。写入下一组的过程称为日志切换，切换时产生检查点，检查点的信息同时写入控制文件。

### 2、联机重做日志组

由一个或多个相同的联机日志文件组成一个联机重做日志组。数据库正常工作至少需要两个日志组，每组至少一个成员（生产环境建议每组至少两个成员，并放到不同的磁盘）。由 LGWR 后台进程同时将日志内容写入到一个组的所有成员。

### 3、联机重做日志成员

联机重做日志组内的每一个联机日志文件称为一个成员。一个组内的所有成员具有相同的日志序列号（log sequence number）且成员的大小相同。

每次日志切换时，Oracle 服务器分配一个新的 LSN 号给即将写入日志的日志文件组。LSN 号用于唯一区分每一个联机日志组和归档日志处于归档模式的联机日志，LSN 号在归档时也被写入到归档日志之中。

## 二、与日志有关的动态性能视图

### 1、查看日志组的信息

一共6 个日志组，每个节点使用 3 组日志，每组拥有两个成员（两个日志文件）。

```java
SQL> select group#,thread#,sequence#,status from v$log;
    GROUP#    THREAD#  SEQUENCE# STATUS
---------- ---------- ---------- ----------------
	 1	    1	       7 INACTIVE
	 2	    1	       8 CURRENT
	 3	    2	       1 INACTIVE
	 4	    2	       2 CURRENT
	 5	    1	       6 INACTIVE
	 6	    2	       0 UNUSED
6 rows selected.
/*说明：
（1）THREAD#：实例号，rac 集群环境每个实例都有对应的日志组。
（2）status 选项值
UNUSED: 表示该联机日志文件组对应的文件还从未被写入过数据。一般情况下，新创建的联机日志文件组会显示为这一状态。当日志切换到这一组时，状态会改变； 
CURRENT：表示当前正在使用的日志文件组，该联机日志组是活动的； 
ACTIVE：该组是活动的但不是当前组，实例恢复时需要这组日志。处于这一状态，虽然不是当前组，但该文件中内容尚未归档，或者文件中的数据没有全部写入数据文件，一旦需要实例恢复，必须借助该文件中保存的内容；
INACTIVE：实例恢复已不再需要这组联机日志组。对应的联机日志文件中的内容已被妥善处理，该组联机重做日志当前处于空闲状态；
CLEARING：表示该组日志文件正被重建，重建后该状态会变成UNUSED；
CLEARING_CURRENT：表示该组日志重建时出现错误。
*/
```

### 2、查看日志文件的信息

```java
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
	 5	   ONLINE  +DATA/orcl/onlinelog/group_5.268.1079737919	      NO
	 5	   ONLINE  +BAK/orcl/onlinelog/group_5.263.1079737919	      YES
	 6	   ONLINE  +DATA/orcl/onlinelog/group_6.269.1079737941	      NO
	 6	   ONLINE  +BAK/orcl/onlinelog/group_6.264.1079737943	      YES
12 rows selected.
```

## 三、手工切换日志

日志切换就是停止写入当前日志组，去写另外一个新的日志组。系统可以自动切换，也可以手工切换。当发生 switch logfile 时，系统会在后台完成 checkpoint 操作。checkpoint 是一个事件，当 checkpoint 事件发生时，会触发 DBWn 进程，把 database buffer 中发生变化的脏数据写入数据文件，同时 chkp 进程更新控制文件（control file）和数据文件头（datafile header），使它们保持一致。在 vKaTeX parse error: Expected 'EOF', got '#' at position 20: …表的 first_change#̲ 列、vdatafile 的 checkpoint_change# 以及 v`$`database 的 checkpoint_change# 列写入相同的 scn 号，scn（system change number）称为系统改变号，也称为检查点号。只要这三个值相同，就表明数据库是同步的，否则就要进行介质恢复。

```java
-- 手工切换日志文件的命令如下：
 alter system switch logfile;
-- 查看日志组状态
SQL> select group#,thread#,sequence#,status from v$log;
    GROUP#    THREAD#  SEQUENCE# STATUS
---------- ---------- ---------- ----------------
	 1	    1	       7 INACTIVE
	 2	    1	       8 CURRENT
	 3	    2	       1 INACTIVE
	 4	    2	       2 CURRENT
	 5	    1	       6 INACTIVE
	 6	    2	       0 UNUSED
6 rows selected.
-- 在 节点1 切换日志
SQL> alter system switch logfile;
System altered.
-- 查看日志组状态
SQL> select group#,thread#,sequence#,status from v$log;
    GROUP#    THREAD#  SEQUENCE# STATUS
---------- ---------- ---------- ----------------
	 1	    1	       7 INACTIVE
	 2	    1	       8 ACTIVE
	 3	    2	       1 INACTIVE
	 4	    2	       2 CURRENT
	 5	    1	       9 CURRENT
	 6	    2	       0 UNUSED
6 rows selected.
-- 节点1 的当前日志组由第 1 组变成了第 5 组， SEQUENCE# 由 8 号变成了 9 号，节点2 的当前日志组没有发生变化
-- 在 节点2 切换日志
SQL> alter system switch logfile;
SQL> select group#,thread#,sequence#,status from v$log;
    GROUP#    THREAD#  SEQUENCE# STATUS
---------- ---------- ---------- ----------------
	 1	    1	       7 INACTIVE
	 2	    1	       8 ACTIVE
	 3	    2	       1 INACTIVE
	 4	    2	       2 ACTIVE
	 5	    1	       9 CURRENT
	 6	    2	       3 CURRENT
6 rows selected.
-- 节点2 的当前日志组由第 4 组变成了第 6 组，SEQUENCE# 由2 变成了3 ，节点1 的当前日志组没有发生变化
-- 第2 组（属于节点1）和第4组（属于节点2）日志处于 ACTIVE 状态，表明对应的数据还没有写盘。
-- 手工产生检查点，强制脏数据写盘
SQL> ALTER SYSTEM CHECKPOINT;
System altered.
SQL> select group#,thread#,sequence#,status from v$log;
    GROUP#    THREAD#  SEQUENCE# STATUS
---------- ---------- ---------- ----------------
	 1	    1	       7 INACTIVE
	 2	    1	       8 INACTIVE
	 3	    2	       1 INACTIVE
	 4	    2	       2 INACTIVE
	 5	    1	       9 CURRENT
	 6	    2	       3 CURRENT
6 rows selected.
```

日志切换的频率与日志成员的大小、数据更新的频率等有关。一般日志组的大小应满足自动切换间隔 15-20 分钟左右的业务需求。可以使用以下语句查看日志文件的历史切换频率：

```java
SQL> select to_char(first_time,'yyyymmddhh24') fist_time, count(*) 
     from v$log_history 
     group by to_char(first_time,'yyyymmddhh24') 
     order by 1;
FIST_TIME    COUNT(*)
---------- ----------
2021042117	    8
2021042118	    1
2021042416	    2
2021042420	    1
2021042421	    1
2021042602	    1
2021080421	    2
2021080423	    1
2021080503	    1
2021080515	    2
2021080516	    1
2021080523	    1
2021080600	    2
2021080605	    1
2021080617	    1
2021080619	    2
2021080620	    2
2021080623	    1
2021080705	    4
19 rows selected.
```

## 四、添加日志文件组和日志组成员

添加日志文件组的方法如下：

```java
-- 1、添加日志组时不指定日志成员，自动在相关位置添加日志组成员
alter database add logfile thread m group n size 50M;
/* 说明：
（1）此命令会自动在相关位置添加日志组成员
（2）thread 选项：指定给哪一个实例添加日志组
（3）group：添加的日志组编号
（4）size：指定日志成员的大小
*/
-- 2、添加日志组时指定日志成员
alter database add logfile thread m group n ('成员1', '成员2') size 50m;
/* 说明：
（1）成员1、成员2格式：+BAK/orcl/onlinelog/redo01.log
（2）thread 选项：指定给哪一个实例添加日志组
（3）group：添加的日志组编号
（4）size：指定日志成员的大小
*/
-- 3、添加日志组成员：可实现日志文件的多路复用
alter database add logfile member '成员' to group n;
```

### 1、查看日志组

```java
SQL> select group#,thread#,sequence#,status from v$log;
    GROUP#    THREAD#  SEQUENCE# STATUS
---------- ---------- ---------- ----------------
	 1	    1	       7 INACTIVE
	 2	    1	       8 INACTIVE
	 3	    2	       1 INACTIVE
	 4	    2	       2 INACTIVE
	 5	    1	       9 CURRENT
	 6	    2	       3 CURRENT
6 rows selected.
```

### 2、为节点1 添加日志组

```java
SQL> alter database add logfile thread 1 group 7 size 50M;
Database altered.
SQL> select group#,thread#,sequence#,status from v$log;
    GROUP#    THREAD#  SEQUENCE# STATUS
---------- ---------- ---------- ----------------
	 1	    1	       7 INACTIVE
	 2	    1	       8 INACTIVE
	 3	    2	       1 INACTIVE
	 4	    2	       2 INACTIVE
	 5	    1	       9 CURRENT
	 6	    2	       3 CURRENT
	 7	    1	       0 UNUSED
7 rows selected.
```

### 3、为节点2 添加日志组

```java
SQL> alter database add logfile thread 2 group 8 size 50M;
Database altered.
SQL> select group#,thread#,sequence#,status from v$log;
    GROUP#    THREAD#  SEQUENCE# STATUS
---------- ---------- ---------- ----------------
	 1	    1	       7 INACTIVE
	 2	    1	       8 INACTIVE
	 3	    2	       1 INACTIVE
	 4	    2	       2 INACTIVE
	 5	    1	       9 CURRENT
	 6	    2	       3 CURRENT
	 7	    1	       0 UNUSED
	 8	    2	       0 UNUSED
8 rows selected.
```

### 4、查看日志成员

```java
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
	 5	   ONLINE  +DATA/orcl/onlinelog/group_5.268.1079737919	      NO
	 5	   ONLINE  +BAK/orcl/onlinelog/group_5.263.1079737919	      YES
	 6	   ONLINE  +DATA/orcl/onlinelog/group_6.269.1079737941	      NO
	 6	   ONLINE  +BAK/orcl/onlinelog/group_6.264.1079737943	      YES
	 7	   ONLINE  +DATA/orcl/onlinelog/group_7.271.1079974733	      NO
	 7	   ONLINE  +BAK/orcl/onlinelog/group_7.294.1079974737	      YES
	 8	   ONLINE  +DATA/orcl/onlinelog/group_8.272.1079975081	      NO
	 8	   ONLINE  +BAK/orcl/onlinelog/group_8.295.1079975081	      YES
16 rows selected.
```

### 5、添加日志组同时指定日志成员

```java
SQL>alter database add logfile thread 1 group 9 
('+DATA/orcl/onlinelog/group_9_redo_log.log', '+BAK/orcl/onlinelog/group_9_redo_log.log') size 50m;
Database altered.
SQL>alter database add logfile thread 2 group 10 
('+DATA/orcl/onlinelog/group_10_redo_log.log', '+BAK/orcl/onlinelog/group_10_redo_log.log') size 50m;
Database altered.
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
	 5	   ONLINE  +DATA/orcl/onlinelog/group_5.268.1079737919	      NO
	 5	   ONLINE  +BAK/orcl/onlinelog/group_5.263.1079737919	      YES
	 6	   ONLINE  +DATA/orcl/onlinelog/group_6.269.1079737941	      NO
	 6	   ONLINE  +BAK/orcl/onlinelog/group_6.264.1079737943	      YES
	 7	   ONLINE  +DATA/orcl/onlinelog/group_7.271.1079974733	      NO
	 7	   ONLINE  +BAK/orcl/onlinelog/group_7.294.1079974737	      YES
	 8	   ONLINE  +DATA/orcl/onlinelog/group_8.272.1079975081	      NO
	 8	   ONLINE  +BAK/orcl/onlinelog/group_8.295.1079975081	      YES
	 9	   ONLINE  +DATA/orcl/onlinelog/group_9_redo_log.log	      NO
	 9	   ONLINE  +BAK/orcl/onlinelog/group_9_redo_log.log	      NO
	10	   ONLINE  +DATA/orcl/onlinelog/group_10_redo_log.log	      NO
	10	   ONLINE  +BAK/orcl/onlinelog/group_10_redo_log.log	      NO
20 rows selected.
```

### 6、查看日志组状态

```java
SQL> select group#,thread#,sequence#,status from v$log;
    GROUP#    THREAD#  SEQUENCE# STATUS
---------- ---------- ---------- ----------------
	 1	    1	       7 INACTIVE
	 2	    1	       8 INACTIVE
	 3	    2	       1 INACTIVE
	 4	    2	       2 INACTIVE
	 5	    1	       9 CURRENT
	 6	    2	       3 CURRENT
	 7	    1	       0 UNUSED
	 8	    2	       0 UNUSED
	 9	    1	       0 UNUSED
	10	    2	       0 UNUSED
10 rows selected.
-- 多次切换日志组
SQL> alter system switch logfile;
System altered.
....
SQL> select group#,thread#,sequence#,status from v$log;
    GROUP#    THREAD#  SEQUENCE# STATUS
---------- ---------- ---------- ----------------
	 1	    1	      12 INACTIVE
	 2	    1	      13 CURRENT
	 3	    2	       6 CURRENT
	 4	    2	       2 INACTIVE
	 5	    1	       9 INACTIVE
	 6	    2	       3 INACTIVE
	 7	    1	      10 INACTIVE
	 8	    2	       4 INACTIVE
	 9	    1	      11 INACTIVE
	10	    2	       5 INACTIVE
10 rows selected.
```

## 五、删除日志组和日志组成员

删除日志组的说明：

（1）一个实例至少需要两个联机日志文件组；

（2）活动的或当前的日志组不能被删除；

（3）组内成员状态有 NULL 值或 INVALID 状态并存，组不可删除；

（4）日志组被删除后，物理文件需要手动删除。

删除日志组成员的说明：

（1）不能删除组内唯一的成员；

（2）不能删除处于 active 和 current 状态组内的成员；

（3）要删除处于 active 和 current 状态组内的成员，应使用日志切换使其处于 INACTIVE 状态后再删除；

（4）对于组内如果一个成员为 NULL 值，一个为 INVALID，且组处入 INACTIVE，仅能删除 INVALID 状态成员；

（5）删除日志文件后，控制文件被更新；

（6）对处于归档模式下的数据库，删除成员时确保日志已被归档，查看 v$log 视图获得归档信息。

### 1、删除日志组

删除日志组命令的语法如下：

```java
ALTER DATABASE DROP LOGFILE GROUP n;
```

删除日志组时先查看要删除的日志组的状态：状态为 INACTIVE 的日志组可以被删除，状态为 CURRENT 和 ACTIVE 的日志组不能被删除。

```java
SQL> select group#,thread#,sequence#,status from v$log;
    GROUP#    THREAD#  SEQUENCE# STATUS
---------- ---------- ---------- ----------------
	 1	    1	      12 INACTIVE
	 2	    1	      13 CURRENT
	 3	    2	       6 CURRENT
	 4	    2	       2 INACTIVE
	 5	    1	       9 INACTIVE
	 6	    2	       3 INACTIVE
	 7	    1	      10 INACTIVE
	 8	    2	       4 INACTIVE
	 9	    1	      11 INACTIVE
	10	    2	       5 INACTIVE
10 rows selected.
```

删除编号为 9 和 10 的日志组：

```java
SQL> ALTER DATABASE DROP LOGFILE GROUP 9;
Database altered.
SQL> ALTER DATABASE DROP LOGFILE GROUP 10;
Database altered.
SQL> select group#,thread#,sequence#,status from v$log;
    GROUP#    THREAD#  SEQUENCE# STATUS
---------- ---------- ---------- ----------------
	 1	    1	      12 INACTIVE
	 2	    1	      13 CURRENT
	 3	    2	       6 CURRENT
	 4	    2	       2 INACTIVE
	 5	    1	       9 INACTIVE
	 6	    2	       3 INACTIVE
	 7	    1	      10 INACTIVE
	 8	    2	       4 INACTIVE
8 rows selected.
```

查看日志组对应的日志文件并手动删除：

```java
ASMCMD> ls -l +DATA/orcl/onlinelog
Type       Redund  Striped  Time             Sys  Name
ONLINELOG  UNPROT  COARSE   AUG 07 17:00:00  Y    group_1.261.1070471997
ONLINELOG  UNPROT  COARSE   AUG 07 17:00:00  Y    group_10.274.1079976131
                                             N    group_10_redo_log.log => +DATA/ORCL/ONLINELOG/group_10.274.1079976131
ONLINELOG  UNPROT  COARSE   AUG 07 06:00:00  Y    group_2.262.1070472003
ONLINELOG  UNPROT  COARSE   AUG 07 06:00:00  Y    group_3.265.1070472253
ONLINELOG  UNPROT  COARSE   AUG 07 06:00:00  Y    group_4.266.1070472257
ONLINELOG  UNPROT  COARSE   AUG 07 17:00:00  Y    group_5.268.1079737919
ONLINELOG  UNPROT  COARSE   AUG 07 17:00:00  Y    group_6.269.1079737941
ONLINELOG  UNPROT  COARSE   AUG 07 17:00:00  Y    group_7.271.1079974733
ONLINELOG  UNPROT  COARSE   AUG 07 17:00:00  Y    group_8.272.1079975081
ONLINELOG  UNPROT  COARSE   AUG 07 17:00:00  Y    group_9.273.1079976053
                                             N    group_9_redo_log.log => +DATA/ORCL/ONLINELOG/group_9.273.1079976053
-- 删除文件：group_9_redo_log.log
ASMCMD> rm +DATA/orcl/onlinelog/group_9_redo_log.log
-- 删除文件：group_10_redo_log.log
ASMCMD> rm +DATA/orcl/onlinelog/group_10_redo_log.log
ASMCMD> ls -l +DATA/orcl/onlinelog/
Type       Redund  Striped  Time             Sys  Name
ONLINELOG  UNPROT  COARSE   AUG 07 17:00:00  Y    group_1.261.1070471997
ONLINELOG  UNPROT  COARSE   AUG 07 06:00:00  Y    group_2.262.1070472003
ONLINELOG  UNPROT  COARSE   AUG 07 06:00:00  Y    group_3.265.1070472253
ONLINELOG  UNPROT  COARSE   AUG 07 06:00:00  Y    group_4.266.1070472257
ONLINELOG  UNPROT  COARSE   AUG 07 17:00:00  Y    group_5.268.1079737919
ONLINELOG  UNPROT  COARSE   AUG 07 17:00:00  Y    group_6.269.1079737941
ONLINELOG  UNPROT  COARSE   AUG 07 17:00:00  Y    group_7.271.1079974733
ONLINELOG  UNPROT  COARSE   AUG 07 17:00:00  Y    group_8.272.1079975081
ASMCMD> ls -l +BAK/orcl/onlinelog/
Type       Redund  Striped  Time             Sys  Name
ONLINELOG  UNPROT  COARSE   AUG 07 17:00:00  Y    group_1.257.1070471999
ONLINELOG  UNPROT  COARSE   AUG 07 17:00:00  Y    group_10.297.1079976133
                                             N    group_10_redo_log.log => +BAK/ORCL/ONLINELOG/group_10.297.1079976133
ONLINELOG  UNPROT  COARSE   AUG 07 06:00:00  Y    group_2.258.1070472005
ONLINELOG  UNPROT  COARSE   AUG 07 06:00:00  Y    group_3.259.1070472255
ONLINELOG  UNPROT  COARSE   AUG 07 06:00:00  Y    group_4.260.1070472261
ONLINELOG  UNPROT  COARSE   AUG 07 17:00:00  Y    group_5.263.1079737919
ONLINELOG  UNPROT  COARSE   AUG 07 17:00:00  Y    group_6.264.1079737943
ONLINELOG  UNPROT  COARSE   AUG 07 17:00:00  Y    group_7.294.1079974737
ONLINELOG  UNPROT  COARSE   AUG 07 17:00:00  Y    group_8.295.1079975081
ONLINELOG  UNPROT  COARSE   AUG 07 17:00:00  Y    group_9.296.1079976053
                                             N    group_9_redo_log.log => +BAK/ORCL/ONLINELOG/group_9.296.1079976053
-- 删除文件：group_9_redo_log.log
ASMCMD> rm +BAK/orcl/onlinelog/group_9_redo_log.log
-- 删除文件：group_10_redo_log.log
ASMCMD> rm +BAK/orcl/onlinelog/group_10_redo_log.log
ASMCMD> ls -l +BAK/orcl/onlinelog/
Type       Redund  Striped  Time             Sys  Name
ONLINELOG  UNPROT  COARSE   AUG 07 17:00:00  Y    group_1.257.1070471999
ONLINELOG  UNPROT  COARSE   AUG 07 06:00:00  Y    group_2.258.1070472005
ONLINELOG  UNPROT  COARSE   AUG 07 06:00:00  Y    group_3.259.1070472255
ONLINELOG  UNPROT  COARSE   AUG 07 06:00:00  Y    group_4.260.1070472261
ONLINELOG  UNPROT  COARSE   AUG 07 17:00:00  Y    group_5.263.1079737919
ONLINELOG  UNPROT  COARSE   AUG 07 17:00:00  Y    group_6.264.1079737943
ONLINELOG  UNPROT  COARSE   AUG 07 17:00:00  Y    group_7.294.1079974737
ONLINELOG  UNPROT  COARSE   AUG 07 17:00:00  Y    group_8.295.1079975081
```

### 2、删除日志组成员

删除日志组成员的语法如下：

```java
ALTER DATABASE DROP LOGFILE MEMBER '成员';
```

查看日志组及日志组成员的状态：

```java
SQL> select group#,thread#,sequence#,status from v$log;
    GROUP#    THREAD#  SEQUENCE# STATUS
---------- ---------- ---------- ----------------
	 1	    1	      12 INACTIVE
	 2	    1	      13 CURRENT
	 3	    2	       6 CURRENT
	 4	    2	       2 INACTIVE
	 5	    1	       9 INACTIVE
	 6	    2	       3 INACTIVE
	 7	    1	      10 INACTIVE
	 8	    2	       4 INACTIVE
8 rows selected.
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
	 5	   ONLINE  +DATA/orcl/onlinelog/group_5.268.1079737919	      NO
	 5	   ONLINE  +BAK/orcl/onlinelog/group_5.263.1079737919	      YES
	 6	   ONLINE  +DATA/orcl/onlinelog/group_6.269.1079737941	      NO
	 6	   ONLINE  +BAK/orcl/onlinelog/group_6.264.1079737943	      YES
	 7	   ONLINE  +DATA/orcl/onlinelog/group_7.271.1079974733	      NO
	 7	   ONLINE  +BAK/orcl/onlinelog/group_7.294.1079974737	      YES
	 8	   ONLINE  +DATA/orcl/onlinelog/group_8.272.1079975081	      NO
	 8	   ONLINE  +BAK/orcl/onlinelog/group_8.295.1079975081	      YES
16 rows selected.
```

删除第7 组日志的成员：+BAK/orcl/onlinelog/group_7.294.1079974737

删除第8 组日志的成员：+BAK/orcl/onlinelog/group_8.295.1079975081

```java
SQL> ALTER DATABASE DROP LOGFILE MEMBER '+BAK/orcl/onlinelog/group_7.294.1079974737';
Database altered.
SQL> ALTER DATABASE DROP LOGFILE MEMBER '+BAK/orcl/onlinelog/group_8.295.1079975081';
Database altered.
SQL> select group#,thread#,sequence#,status,members from v$log;
    GROUP#    THREAD#  SEQUENCE# STATUS 	     MEMBERS
---------- ---------- ---------- ---------------- ----------
	 1	    1	      12 INACTIVE		   2
	 2	    1	      13 CURRENT		   2
	 3	    2	       6 CURRENT		   2
	 4	    2	       2 INACTIVE		   2
	 5	    1	       9 INACTIVE		   2
	 6	    2	       3 INACTIVE		   2
	 7	    1	      10 INACTIVE		   1
	 8	    2	       4 INACTIVE		   1
8 rows selected.
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
	 5	   ONLINE  +DATA/orcl/onlinelog/group_5.268.1079737919	      NO
	 5	   ONLINE  +BAK/orcl/onlinelog/group_5.263.1079737919	      YES
	 6	   ONLINE  +DATA/orcl/onlinelog/group_6.269.1079737941	      NO
	 6	   ONLINE  +BAK/orcl/onlinelog/group_6.264.1079737943	      YES
	 7	   ONLINE  +DATA/orcl/onlinelog/group_7.271.1079974733	      NO
	 8	   ONLINE  +DATA/orcl/onlinelog/group_8.272.1079975081	      NO
14 rows selected.
```

## 六、移动日志文件的位置

希望把第 7 组和第 8 组的日志文件修改为另一个名称，并添加一个成员，使每组日志具有两个成员。可以进行如下操作：

### 1、重新启动数据库为 mount 状态

如果是rac 集群，要移动多个节点对应的日志文件的位置，则涉及到的节点数据库都要处于 mount 状态。如果在节点1 操作，也可以使节点1 处于 mount 状态，其他节点先关闭。

```java
-- 节点2
shutdown immediate
SQL> shutdown immediate
Database closed.
Database dismounted.
ORACLE instance shut down.
-- 节点1
SQL> startup force mount;
ORACLE instance started.
Total System Global Area  835104768 bytes
Fixed Size		    2257840 bytes
Variable Size		  603982928 bytes
Database Buffers	  226492416 bytes
Redo Buffers		    2371584 bytes
Database mounted.
```

### 2、在节点1执行以下操作

```java
-- 更改日志文件的名称
ASMCMD> cp +DATA/orcl/onlinelog/group_7.271.1079974733 +DATA/orcl/onlinelog/group_7_redo7_01.log
copying +DATA/orcl/onlinelog/group_7.271.1079974733 -> +DATA/orcl/onlinelog/group_7_redo7_01.log
ASMCMD> cp +DATA/orcl/onlinelog/group_8.272.1079975081  +DATA/orcl/onlinelog/group_8_redo8_01.log
copying +DATA/orcl/onlinelog/group_8.272.1079975081 -> +DATA/orcl/onlinelog/group_8_redo8_01.log
-- 删除原来的日志文件
ASMCMD> rm +DATA/orcl/onlinelog/group_7.271.1079974733
ASMCMD> rm +DATA/orcl/onlinelog/group_8.272.1079975081
-- 查看日志文件
ASMCMD>ls -l +DATA/orcl/onlinelog
Type       Redund  Striped  Time             Sys  Name
ONLINELOG  UNPROT  COARSE   AUG 07 18:00:00  Y    group_1.261.1070471997
ONLINELOG  UNPROT  COARSE   AUG 07 18:00:00  Y    group_2.262.1070472003
ONLINELOG  UNPROT  COARSE   AUG 07 18:00:00  Y    group_3.265.1070472253
ONLINELOG  UNPROT  COARSE   AUG 07 18:00:00  Y    group_4.266.1070472257
ONLINELOG  UNPROT  COARSE   AUG 07 18:00:00  Y    group_5.268.1079737919
ONLINELOG  UNPROT  COARSE   AUG 07 18:00:00  Y    group_6.269.1079737941
                                             N    group_7_redo7_01.log => +DATA/ASM/ONLINELOG/group_7_redo7_01.log.274.1079982873
                                             N    group_8_redo8_01.log => +DATA/ASM/ONLINELOG/group_8_redo8_01.log.273.1079982961
ASMCMD> 
ASMCMD> ls -l +bak/orcl/onlinelog
Type       Redund  Striped  Time             Sys  Name
ONLINELOG  UNPROT  COARSE   AUG 07 18:00:00  Y    group_1.257.1070471999
ONLINELOG  UNPROT  COARSE   AUG 07 18:00:00  Y    group_2.258.1070472005
ONLINELOG  UNPROT  COARSE   AUG 07 18:00:00  Y    group_3.259.1070472255
ONLINELOG  UNPROT  COARSE   AUG 07 18:00:00  Y    group_4.260.1070472261
ONLINELOG  UNPROT  COARSE   AUG 07 18:00:00  Y    group_5.263.1079737919
ONLINELOG  UNPROT  COARSE   AUG 07 18:00:00  Y    group_6.264.1079737943
```

### 3、修改控制文件中的日志信息

```java
-- 修改日志成员的名称
SQL> alter database rename file '+DATA/orcl/onlinelog/group_7.271.1079974733' to '+DATA/orcl/onlinelog/group_7_redo7_01.log';
Database altered.
SQL> alter database rename file '+DATA/orcl/onlinelog/group_8.272.1079975081' to '+DATA/orcl/onlinelog/group_8_redo8_01.log';
Database altered.
-- 添加日志组成员
SQL> alter database add logfile member '+bak/orcl/onlinelog/group_7_redo7_02.log' to group 7;
Database altered.
SQL> alter database add logfile member '+BAK/orcl/onlinelog/group_8_redo8_02.log' to group 8;
Database altered.
```

### 4、打开数据库

```java
-- 节点1
SQL> alter database open;
Database altered.
-- 节点2
SQL> startup
ORACLE instance started.
Total System Global Area  835104768 bytes
Fixed Size		    2257840 bytes
Variable Size		  583011408 bytes
Database Buffers	  247463936 bytes
Redo Buffers		    2371584 bytes
Database mounted.
Database opened.
```

### 5、查看日志组与日志组成员信息

```java
SQL> select group#,thread#,sequence#,status,members from v$log;
    GROUP#    THREAD#  SEQUENCE# STATUS 	     MEMBERS
---------- ---------- ---------- ---------------- ----------
	 1	    1	      16 CURRENT		   2
	 2	    1	      13 INACTIVE		   2
	 3	    2	       6 INACTIVE		   2
	 4	    2	       7 INACTIVE		   2
	 5	    1	      14 INACTIVE		   2
	 6	    2	       8 INACTIVE		   2
	 7	    1	      15 INACTIVE		   2
	 8	    2	       9 INACTIVE		   2
8 rows selected.
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
	 5	   ONLINE  +DATA/orcl/onlinelog/group_5.268.1079737919	      NO
	 5	   ONLINE  +BAK/orcl/onlinelog/group_5.263.1079737919	      YES
	 6	   ONLINE  +DATA/orcl/onlinelog/group_6.269.1079737941	      NO
	 6	   ONLINE  +BAK/orcl/onlinelog/group_6.264.1079737943	      YES
	 7	   ONLINE  +DATA/orcl/onlinelog/group_7_redo7_01.log	      NO
	 7	   ONLINE  +BAK/orcl/onlinelog/group_7_redo7_02.log	      NO
	 8	   ONLINE  +DATA/orcl/onlinelog/group_8_redo8_01.log	      NO
	 8	   ONLINE  +BAK/orcl/onlinelog/group_8_redo8_02.log	      NO
16 rows selected.
```
