# 18、Oracle 教程 - Oracle 的 undo 表空间管理
- 来源：https://ddkk.com/zhuanlan/db/oracle/1/18.html
- 分类：缓存数据库
- 分组：教程目录
UNDO 表空间又称为回滚表空间、撤销表空间，用于保存回退段（rollback segment），通过回退段保存数据修改之前的镜像。一个数据库可以有多个 UNDO 表空间，但是在某一时刻只能使用一个 UNDO 表空间，可以使用 alter system 切换UNDO 表空间。

## 一、UNDO 表空间的作用

当执行DML 操作时，如果修改了数据块，Oracle 就会把修改前的数据块保留下来，存储在回退段（Undo segment）中。当执行回滚（rollback）操作时，把原来的数据重新覆盖回来。回滚段存放在 UNDO 表空间中。

UNDO 表空间的管理分为手动管理和自动管理。在 Oracle11g 中默认采用自动管理模式。

回退段的作用如下：

（1）为事务提供回退：当事务执行失败或用户执行回滚操作（rollback）时，Oracle 会利用保存在回退段中的信息将数据恢复到原来的值；

（2）实例恢复：当数据库实例运行失败，在数据库重新启动时，Oracle 先利用重做日志文件的信息对数据库进行恢复，再利用回退段中的信息回滚未提交的事务；

（3）提供读一致性：当用户对数据进行修改时，会预先将其原始值保存到回退段中。此时，如果有其它用户访问该数据，则访问回退段中的信息，使当前用户未提交的修改其他用户无法看到，保证数据的一致性；

（4）提供对 DML 操作的闪回处理：通过保留在回退段中的信息，用户可以查询某个数据在过去某个时刻的状态。

回退段的工作方式：

（1）当事务开始时，系统分配给该事务一个回退段。在事务的整个生命周期中，当数据发生改变时，数据的原始值被复制到回退段中。

（2）回退段采用循环写的方式进行工作，当事务写满回退段的一个区之后，会接着写入回退段的下一个区，当所有的区都写满后，事务开始循环写入到第一个区或者分配新的区（extent）。

## 二、与 undo 表空间有关的初始化参数

```java
SQL> show parameter undo_
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
undo_management 		     string	 AUTO
undo_retention			     integer	 900
undo_tablespace 		     string	 UNDOTBS1
/*说明：
（1）undo_management：UNDO 表空间回退段的管理方式：AUTO（自动管理），MANUAL（手动管理）。
（2）undo_retention：事务提交后，相应的 UNDO 数据保留的时间，单位：秒。
（3）undo_tablespace：指定使用的 undo 表空间。
*/
```

集群环境下，每个实例都使用自己的 undo 表空间：

```java
--节点1
SQL> show parameter undo_tablespace
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
undo_tablespace 		     string	 UNDOTBS1
--节点2
SQL> show parameter undo_tablespace
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
undo_tablespace 		     string	 UNDOTBS2
```

## 三、回退段（rollback segment）的管理方式

```java
SQL> show parameter undo_management
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
undo_management 		     string	 AUTO
```

rollback segment 管理方式有两种：AUTO（自动管理，默认方式），MANUAL（手动管理）。

### 1、AUTO：自动管理

自动管理方式下，由初始化参数 undo_tablespace 指定一个 undo 表空间，作为默认使用的 undo 表空间。

```java
--集群环境下每个节点都是用自己的 undo 表空间
--节点1
SQL> show parameter undo_tablespace
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
undo_tablespace 		     string	 UNDOTBS1
--节点2
SQL> show parameter undo_tablespace
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
undo_tablespace 		     string	 UNDOTBS2
```

（1）自动管理模式下，在节点1创建 undo 表空间 undotbs11

```java
SQL> create undo tablespace undotbs11
     datafile '+DATA/orcl/datafile/undotbs11' size 50m
     autoextend on next 50m;
Tablespace created.
```

（2）把节点1的 undo 表空间切换为 undotbs11

```java
SQL> alter system set undo_tablespace = undotbs11;
System altered.
SQL> show parameter undo_tablespace
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
undo_tablespace 		     string	 UNDOTBS11
--查看回退段
SQL> select segment_name,tablespace_name,status from dba_rollback_segs;
SEGMENT_NAME		       TABLESPACE_NAME		      STATUS
------------------------------ ------------------------------ ----------------
SYSTEM			              SYSTEM			      ONLINE
_SYSSMU10_1197734989$	       UNDOTBS1 		      OFFLINE
_SYSSMU9_1650507775$	       UNDOTBS1 		      OFFLINE
_SYSSMU8_517538920$	           UNDOTBS1 		      OFFLINE
_SYSSMU7_2070203016$	       UNDOTBS1 		      OFFLINE
_SYSSMU6_1263032392$	       UNDOTBS1 		      OFFLINE
_SYSSMU5_898567397$	           UNDOTBS1 		      OFFLINE
_SYSSMU4_1254879796$	       UNDOTBS1 		      OFFLINE
_SYSSMU3_1723003836$	       UNDOTBS1 		      OFFLINE
_SYSSMU2_2996391332$	       UNDOTBS1 		      OFFLINE
_SYSSMU1_3724004606$	       UNDOTBS1 		      OFFLINE
_SYSSMU20_3889389392$	       UNDOTBS2 		      ONLINE
_SYSSMU19_1451449480$	       UNDOTBS2 		      ONLINE
_SYSSMU18_3926145788$	       UNDOTBS2 		      ONLINE
_SYSSMU17_448925445$	       UNDOTBS2 		      ONLINE
_SYSSMU16_436613144$	       UNDOTBS2 		      ONLINE
_SYSSMU15_1019824898$	       UNDOTBS2 		      ONLINE
_SYSSMU14_2425809615$	       UNDOTBS2 		      ONLINE
_SYSSMU13_436118795$	       UNDOTBS2 		      ONLINE
_SYSSMU12_1517809045$	       UNDOTBS2 		      ONLINE
_SYSSMU11_2522431595$	       UNDOTBS2 		      ONLINE
_SYSSMU30_2064898567$	       UNDOTBS11		      ONLINE
_SYSSMU29_4263141085$	       UNDOTBS11		      ONLINE
_SYSSMU28_3305267124$	       UNDOTBS11		      ONLINE
_SYSSMU27_81081477$	           UNDOTBS11		      ONLINE
_SYSSMU26_2544040228$	       UNDOTBS11		      ONLINE
_SYSSMU25_3424601340$	       UNDOTBS11		      ONLINE
_SYSSMU24_2904816458$	       UNDOTBS11		      ONLINE
_SYSSMU23_4195287356$	       UNDOTBS11		      ONLINE
_SYSSMU22_3290518977$	       UNDOTBS11		      ONLINE
_SYSSMU21_894061986$	       UNDOTBS11		      ONLINE
31 rows selected.
```

### 2、MANUAL：手工管理

把回退段的管理方式修改为手工管理，只需要把初始化参数 undo_management 修改为 manual 即可。

当回退段的管理方式为自动管理，并且由于回退段出现问题而导致数据库无法启动时，可以把回退段管理方式设置为手工管理，数据库启动后再修改为自动管理。

### 注：集群环境下修改回退段管理方式会影响到所有节点！

```java
SQL> show parameter undo_management;
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
undo_management 		     string	 AUTO
```

初始化参数 undo_management 为静态参数，修改之后需要重启数据库才能生效。

```java
SQL> alter system set undo_management = manual scope = spfile;
System altered.
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
SQL> show parameter undo_management;
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
undo_management 		     string	 MANUAL
```

回退段管理方式修改为手工管理之后，发现原有的回退段全部变成了 OFFLINE 状态（system 除外）。此时，只有系统表空间的对象能够进行数据修改操作，用户表空间的对应无法进行数据修改操作。

```java
SQL> select segment_name,tablespace_name,status from dba_rollback_segs;
SEGMENT_NAME		       TABLESPACE_NAME		      STATUS
------------------------------ ------------------------------ ----------------
SYSTEM			              SYSTEM			      ONLINE
_SYSSMU10_1197734989$	       UNDOTBS1 		      OFFLINE
_SYSSMU9_1650507775$	       UNDOTBS1 		      OFFLINE
_SYSSMU8_517538920$	           UNDOTBS1 		      OFFLINE
_SYSSMU7_2070203016$	       UNDOTBS1 		      OFFLINE
_SYSSMU6_1263032392$	       UNDOTBS1 		      OFFLINE
_SYSSMU5_898567397$	           UNDOTBS1 		      OFFLINE
_SYSSMU4_1254879796$	       UNDOTBS1 		      OFFLINE
_SYSSMU3_1723003836$	       UNDOTBS1 		      OFFLINE
_SYSSMU2_2996391332$	       UNDOTBS1 		      OFFLINE
_SYSSMU1_3724004606$	       UNDOTBS1 		      OFFLINE
_SYSSMU20_3889389392$	       UNDOTBS2 		      OFFLINE
_SYSSMU19_1451449480$	       UNDOTBS2 		      OFFLINE
_SYSSMU18_3926145788$	       UNDOTBS2 		      OFFLINE
_SYSSMU17_448925445$	       UNDOTBS2 		      OFFLINE
_SYSSMU16_436613144$	       UNDOTBS2 		      OFFLINE
_SYSSMU15_1019824898$	       UNDOTBS2 		      OFFLINE
_SYSSMU14_2425809615$	       UNDOTBS2 		      OFFLINE
_SYSSMU13_436118795$	       UNDOTBS2 		      OFFLINE
_SYSSMU12_1517809045$	       UNDOTBS2 		      OFFLINE
_SYSSMU11_2522431595$	       UNDOTBS2 		      OFFLINE
_SYSSMU30_2064898567$	       UNDOTBS11		      OFFLINE
_SYSSMU29_4263141085$	       UNDOTBS11		      OFFLINE
_SYSSMU28_3305267124$	       UNDOTBS11		      OFFLINE
_SYSSMU27_81081477$	           UNDOTBS11		      OFFLINE
_SYSSMU26_2544040228$	       UNDOTBS11		      OFFLINE
_SYSSMU25_3424601340$	       UNDOTBS11		      OFFLINE
_SYSSMU24_2904816458$	       UNDOTBS11		      OFFLINE
_SYSSMU23_4195287356$	       UNDOTBS11		      OFFLINE
_SYSSMU22_3290518977$	       UNDOTBS11		      OFFLINE
_SYSSMU21_894061986$	       UNDOTBS11		      OFFLINE
31 rows selected.
```

切换到scott 用户，修改 emp 表中的数据：

```java
SQL> conn scott/tiger
Connected.
SQL> select * from tab;
TNAME			       TABTYPE	CLUSTERID
------------------------------ ------- ----------
BONUS			       TABLE
DEPT			       TABLE
E01			           TABLE
E02			           TABLE
EMP			           TABLE
SALGRADE		       TABLE
6 rows selected.
SQL> update e01 set sal=sal+1;
update e01 set sal=sal+1
       *
ERROR at line 1:
ORA-01552: cannot use system rollback segment for non-system tablespace 'USERS'
--出现错误：由于 emp 表不在系统表空间，因此没有回退段可用，导致数据修改无法进行。
--把表 e01 移动到 system 表空间
SQL> alter table e01 move tablespace system;
Table altered.
SQL> update e01 set sal=sal+1;
1792 rows updated.
--此时可以更新，因为 system 表空间中的表更新时使用 system 回退段。
```

在回退段管理方式修改为手工管理之后，需要手工创建回退段，并设置为 online。

### 步骤1：创建回退段

```java
SQL> create rollback segment undo_segs001 tablespace UNDOTBS1;
Rollback segment created.
SQL> create rollback segment undo_segs002 tablespace UNDOTBS1;
Rollback segment created.
SQL> create rollback segment undo_segs003 tablespace UNDOTBS1;
Rollback segment created.
SQL> create rollback segment undo_segs004 tablespace UNDOTBS1;
Rollback segment created.
SQL> create rollback segment undo_segs005 tablespace UNDOTBS1;
Rollback segment created.
```

### 步骤2：查看新建的回退段的状态（OFFLINE）

```java
SQL> select segment_name, tablespace_name,status from dba_rollback_segs;
SEGMENT_NAME		       TABLESPACE_NAME		      STATUS
------------------------------ ------------------------------ ----------------
SYSTEM			       SYSTEM			      ONLINE
UNDO_SEGS005		       UNDOTBS1 		      OFFLINE
UNDO_SEGS004		       UNDOTBS1 		      OFFLINE
UNDO_SEGS003		       UNDOTBS1 		      OFFLINE
UNDO_SEGS002		       UNDOTBS1 		      OFFLINE
UNDO_SEGS001		       UNDOTBS1 		      OFFLINE
.....
_SYSSMU21_894061986$	       UNDOTBS11		      OFFLINE
36 rows selected.
```

### 步骤3：修改回退段的状态为 ONLINE

```java
SQL> alter rollback segment UNDO_SEGS001 online;
Rollback segment altered.
SQL> alter rollback segment UNDO_SEGS002 online;
Rollback segment altered.
SQL> alter rollback segment UNDO_SEGS003 online;
Rollback segment altered.
SQL> alter rollback segment UNDO_SEGS004 online;
Rollback segment altered.
SQL> alter rollback segment UNDO_SEGS005 online;
Rollback segment altered.
```

### 步骤4：查看新建的回退段的状态（ONLINE）

```java
--查看回退段的状态：ONLINE
SQL> select segment_name, tablespace_name,status from dba_rollback_segs;
SEGMENT_NAME		       TABLESPACE_NAME		      STATUS
------------------------------ ------------------------------ ----------------
SYSTEM			       SYSTEM			      ONLINE
UNDO_SEGS005		       UNDOTBS1 		      ONLINE
UNDO_SEGS004		       UNDOTBS1 		      ONLINE
UNDO_SEGS003		       UNDOTBS1 		      ONLINE
UNDO_SEGS002		       UNDOTBS1 		      ONLINE
UNDO_SEGS001		       UNDOTBS1 		      ONLINE
......
_SYSSMU21_894061986$	       UNDOTBS11		      OFFLINE
36 rows selected.
```

### 步骤5：把回退段信息添加到参数文件，否则重启后会自动变成 offline

```java
SQL> show parameter rollback
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
fast_start_parallel_rollback	     string	 LOW
rollback_segments		     string
transactions_per_rollback_segment    integer	 5
SQL> alter system set rollback_segments='UNDO_SEGS001','UNDO_SEGS002','UNDO_SEGS003','UNDO_SEGS004','UNDO_SEGS005' scope=spfile;
System altered.
```

## 四、与 undo 表空间有关的数据字典与动态视图

### 1、v$tablaspace

通过该动态视图可以查看所有表空间信息。

```java
SQL> select * from v$tablespace;
       TS# NAME 			  INC BIG FLA ENC
---------- ------------------------------ --- --- --- ---
	 0 SYSTEM			  YES NO  YES
	 1 SYSAUX			  YES NO  YES
	 2 UNDOTBS1			  YES NO  YES
	 4 USERS			  YES NO  YES
	 3 TEMP 			  NO  NO  YES
	 5 UNDOTBS2			  YES NO  YES
	 6 TS001			  YES NO  YES
	 8 TEMP02			  NO  NO  YES
	10 TEMP03			  NO  NO  YES
9 rows selected.
```

### 2、dba_tablespaces

通过该数据字典可以查看表空间的类型。

```java
SQL> select tablespace_name,contents from dba_tablespaces;
TABLESPACE_NAME 	       CONTENTS
------------------------------ ---------
SYSTEM			       PERMANENT
SYSAUX			       PERMANENT
UNDOTBS1		       UNDO
TEMP			       TEMPORARY
USERS			       PERMANENT
UNDOTBS2		       UNDO
TS001			       PERMANENT
TEMP02			       TEMPORARY
TEMP03			       TEMPORARY
9 rows selected.
--PERMANENT：永久表空间
--UNDO：UNDO 表空间
--TEMPORARY：临时表空间
```

### 3、dba_data_files

通过该数据字段可以查看表空间对应的数据文件。

```java
SQL> select tablespace_name,file_name from dba_data_files;
TABLESPACE_NAME 	       FILE_NAME
------------------------------ ------------------------------------------------------------
USERS			       +DATA/orcl/datafile/users.259.1070471891
UNDOTBS1		       +DATA/orcl/datafile/undotbs1.258.1070471891
SYSAUX			       +DATA/orcl/datafile/sysaux.257.1070471889
SYSTEM			       +DATA/orcl/datafile/system.256.1070471889
UNDOTBS2		       +DATA/orcl/datafile/undotbs2.264.1070472143
TS001			       +DATA/orcl/datafile/ts001.dbf
6 rows selected.
```

### 4、dba_rollback_segs

通过该数据字典可以查看 undo 表空间所包含的回退段及回退段的大小等特征。

```java
SQL> select SEGMENT_NAME,TABLESPACE_NAME,STATUS 
     from dba_rollback_segs ;
SEGMENT_NAME		       TABLESPACE_NAME		      STATUS
------------------------------ ------------------------------ ----------------
SYSTEM			              SYSTEM		         ONLINE
_SYSSMU1_3724004606$	       UNDOTBS1 		      ONLINE
_SYSSMU2_2996391332$	       UNDOTBS1 		      ONLINE
_SYSSMU3_1723003836$	       UNDOTBS1 		      ONLINE
_SYSSMU4_1254879796$	       UNDOTBS1 		      ONLINE
_SYSSMU5_898567397$	           UNDOTBS1 		      ONLINE
_SYSSMU6_1263032392$	       UNDOTBS1 		      ONLINE
_SYSSMU7_2070203016$	       UNDOTBS1 		      ONLINE
_SYSSMU8_517538920$	           UNDOTBS1 		      ONLINE
_SYSSMU9_1650507775$	       UNDOTBS1 		      ONLINE
_SYSSMU10_1197734989$	       UNDOTBS1 		      ONLINE
_SYSSMU11_2522431595$	       UNDOTBS2 		      ONLINE
_SYSSMU12_1517809045$	       UNDOTBS2 		      ONLINE
_SYSSMU13_436118795$	       UNDOTBS2 		      ONLINE
_SYSSMU14_2425809615$	       UNDOTBS2 		      ONLINE
_SYSSMU15_1019824898$	       UNDOTBS2 		      ONLINE
_SYSSMU16_436613144$	       UNDOTBS2 		      ONLINE
_SYSSMU17_448925445$	       UNDOTBS2 		      ONLINE
_SYSSMU18_3926145788$	       UNDOTBS2 		      ONLINE
_SYSSMU19_1451449480$	       UNDOTBS2 		      ONLINE
_SYSSMU20_3889389392$	       UNDOTBS2 		      ONLINE
21 rows selected.
```

### 5、dba_segments

通过该数据字典可以查看所有表空间所包含的段及段的大小等特征。

```java
SQL> select owner,segment_name,bytes/1024/1024 mb 
     from dba_segments ;
     where tablespace_name like '%UNDO%';
OWNER			       SEGMENT_NAME										 MB
------------------------------ --------------------------------------------------------------
SYS			       _SYSSMU1_3724004606$								      2.125
SYS			       _SYSSMU2_2996391332$								      2.125
SYS			       _SYSSMU3_1723003836$								      1.125
SYS			       _SYSSMU4_1254879796$								      2.125
SYS			       _SYSSMU5_898567397$								      1.125
SYS			       _SYSSMU6_1263032392$								      1.125
SYS			       _SYSSMU7_2070203016$								      2.125
SYS			       _SYSSMU8_517538920$								      1.125
SYS			       _SYSSMU9_1650507775$								      1.125
SYS			       _SYSSMU10_1197734989$							      2.125
SYS			       _SYSSMU11_2522431595$							      1.125
SYS			       _SYSSMU12_1517809045$							      1.125
SYS			       _SYSSMU13_436118795$								      1.125
SYS			       _SYSSMU14_2425809615$							      1.125
SYS			       _SYSSMU15_1019824898$							      .6875
SYS			       _SYSSMU16_436613144$									.25
SYS			       _SYSSMU17_448925445$								      1.125
SYS			       _SYSSMU18_3926145788$							      2.125
SYS			       _SYSSMU19_1451449480$							      .5625
SYS			       _SYSSMU20_3889389392$							      1.125
20 rows selected.
```

### 6、dba_undo_extents

通过该数据字典可以查询 undo 表空间中区的大小与状态信息。

```java
SQL> select tablespace_name,segment_name,extent_id,status from dba_undo_extents;
TABLESPACE_NAME 	       SEGMENT_NAME		       EXTENT_ID STATUS
------------------------------ ------------------------------ ---------- ---------
UNDOTBS1		       _SYSSMU10_1197734989$		       0 UNEXPIRED
UNDOTBS1		       _SYSSMU10_1197734989$		       1 UNEXPIRED
UNDOTBS1		       _SYSSMU10_1197734989$		       2 UNEXPIRED
UNDOTBS1		       _SYSSMU10_1197734989$		       3 UNEXPIRED
.....
UNDOTBS2		       _SYSSMU11_2522431595$		       0 EXPIRED
UNDOTBS2		       _SYSSMU11_2522431595$		       1 EXPIRED
UNDOTBS2		       _SYSSMU11_2522431595$		       2 UNEXPIRED
81 rows selected.
/*undo表空间中区的状态一共有3种：EXPIRED、UNEXPIRED、ACTIVE。
（1）EXPIRED：表示该回退信息对应的事务已经提交，保存时间超过保留区；
（2）UNEXPIRED：表示该回退信息对应的事务已经提交，保存时间没有超过保留区；
（3）ACTIVE：表示回退信息对应的事务还没有提交，该区还在使用；
*/
```

### 7、v$rollname

通过该性能视图可以查询回退段的名称。

```java
--节点1
SQL> select * from v$rollname;
       USN NAME
---------- ------------------------------
	 0 SYSTEM
	 1 _SYSSMU1_3724004606$
	 2 _SYSSMU2_2996391332$
	 3 _SYSSMU3_1723003836$
	 4 _SYSSMU4_1254879796$
	 5 _SYSSMU5_898567397$
	 6 _SYSSMU6_1263032392$
	 7 _SYSSMU7_2070203016$
	 8 _SYSSMU8_517538920$
	 9 _SYSSMU9_1650507775$
	10 _SYSSMU10_1197734989$
11 rows selected.
--节点2
SQL> select * from v$rollname;
       USN NAME
---------- ------------------------------
	 0 SYSTEM
	11 _SYSSMU11_2522431595$
	12 _SYSSMU12_1517809045$
	13 _SYSSMU13_436118795$
	14 _SYSSMU14_2425809615$
	15 _SYSSMU15_1019824898$
	16 _SYSSMU16_436613144$
	17 _SYSSMU17_448925445$
	18 _SYSSMU18_3926145788$
	19 _SYSSMU19_1451449480$
	20 _SYSSMU20_3889389392$
11 rows selected.
```

### 8、v$rollstat

通过该性能视图可以查询 undo 表空间回退段的性能统计信息。

```java
SQL> select v$rollname.*,v$rollstat.extents Extents,
       v$rollstat.rssize Size_in_Bytes,
       v$rollstat.xacts XActs,
       v$rollstat.gets Gets,
       v$rollstat.waits Waits,
       v$rollstat.writes Writes
     from v$rollstat, v$rollname
     where v$rollstat.usn(+) = v$rollname.usn;
       USN NAME 			     EXTENTS SIZE_IN_BYTES	XACTS	    GETS      WAITS	WRITES
---------- ------------------------------ ---------- ------------- ---------- ---------- -------
	 0 SYSTEM				          6	        385024	    0	     396	  0	  5408
	 1 _SYSSMU1_3724004606$ 		   4	   2220032	    0	    6484	  1    9326004
	 2 _SYSSMU2_2996391332$ 		   4	   2220032	    0	    5791	  0    6863384
	 3 _SYSSMU3_1723003836$ 		   3	   1171456	    0	    5905	  0    8019800
	 4 _SYSSMU4_1254879796$ 		   4	   2220032	    0	    7241	  2   16259136
	 5 _SYSSMU5_898567397$			   3	   1171456	    0	    5836	  6    7611208
	 6 _SYSSMU6_1263032392$ 		   3	   1171456	    0	    6336	  0   11252118
	 7 _SYSSMU7_2070203016$ 		   4	   2220032	    0	    5041	  1    6246930
	 8 _SYSSMU8_517538920$			   3	   1171456	    0	    7036	  0   17027584
	 9 _SYSSMU9_1650507775$ 		   3	   1171456	    0	    5152	  0    5555406
	10 _SYSSMU10_1197734989$		   4	   2220032	    0	    5138	  0    5949234
11 rows selected.
```

### 9、v$undostat

能视图可以查询 undo 表空间中回退段的性能统计信息。

```java
SQL> SELECT TO_CHAR(BEGIN_TIME, 'MM/DD/YYYY HH24:MI:SS') BEGIN_TIME,  
     TO_CHAR(END_TIME, 'MM/DD/YYYY HH24:MI:SS') END_TIME,  
     UNDOBLKS, MAXQUERYLEN, TUNED_UNDORETENTION  
     FROM v$UNDOSTAT
     WHERE ROWNUM <= 10; 
BEGIN_TIME	    END_TIME		  UNDOBLKS MAXQUERYLEN TUNED_UNDORETENTION
------------------- ------------------- ---------- ----------- -------------------
08/16/2021 16:39:51 08/16/2021 16:45:47 	 0	   742		      1582
08/16/2021 16:29:51 08/16/2021 16:39:51 	 0	   441		      1342
08/16/2021 16:19:51 08/16/2021 16:29:51 	 0	  1045		      1946
08/16/2021 16:09:51 08/16/2021 16:19:51 	 1	   442		      1344
08/16/2021 15:59:51 08/16/2021 16:09:51 	 2	  1051		      1951
08/16/2021 15:49:51 08/16/2021 15:59:51    141	   450		      1350
08/16/2021 15:39:51 08/16/2021 15:49:51 	 0	  1050		      1951
08/16/2021 15:29:51 08/16/2021 15:39:51 	 1	   449		      1350
08/16/2021 15:19:51 08/16/2021 15:29:51 	 0	  1055		      1955
08/16/2021 15:09:51 08/16/2021 15:19:51 	 0	   454		      1355
10 rows selected.
```

### 10、v$transaction

通过该性能视图可以查询事务所使用的回退段信息。查询哪些用户使用了回退段：

```java
SQL> select a.username,b.name,c.used_ublk 
     from v$session a,v$rollname b,v$transaction c
     where a.saddr=c.ses_addr and b.usn=c.xidusn;
USERNAME		       NAME			       USED_UBLK
------------------------------ ------------------------------ ----------
SCOTT			       _SYSSMU8_517538920$		       1
```

## 五、管理 undo 表空间

### 1、新建 undo 表空间

可以使用 create undo tablespace 来创建 undo 表空间。undo 表空间用来保存事务的回退信息，用户不能在 undo 表空间中创建数据库对象。该命令的语法格式如下：

```java
CREATE UNDO TABLESPACE tablespace_name
DATAFILE 'path/filename' SIZE x [K | M | G] 
[AUTOEXTEND] [OFF | ON] NEXT x [K | M | G] MAXSIZE [UNLIMITED | x [K | M | G] ]
[EXTENT MANAGEMENT LOCAL] [AUTOALLOCATE]
[RETENTION GUARANTEE | NOGUARANTEE]
```

例如：新建一个 undo 表空间，名称为 undotbs101，命令如下：

```java
SQL> create undo tablespace undotbs101
     datafile '+DATA/orcl/datafile/undotbs101.dbf' size 50m
     autoextend on next 50m;
Tablespace created.
```

查看表空间的信息：

```java
SQL> select tablespace_name,file_name
     from dba_data_files;
TABLESPACE_NAME 	       FILE_NAME
------------------------------ ------------------------------------------------------------
USERS			       +DATA/orcl/datafile/users.259.1070471891
UNDOTBS1		       +DATA/orcl/datafile/undotbs1.258.1070471891
SYSAUX			       +DATA/orcl/datafile/sysaux.257.1070471889
SYSTEM			       +DATA/orcl/datafile/system.256.1070471889
UNDOTBS2		       +DATA/orcl/datafile/undotbs2.264.1070472143
TS001			       +DATA/orcl/datafile/ts001.dbf
UNDOTBS101		       +DATA/orcl/datafile/undotbs101.dbf
7 rows selected.
```

### 2、修改 undo 表空间

可以使用 alter tablespace 修改 undo 表空间，允许对 undo 表空间进行如下操作：

（1）为 undo 表空间添加数据文件；

（2）重命名 undo 表空间的数据文件；

（3）将 undo 表空间的数据文件联机或脱机；

（4）启用或禁用保护回退信息在回退段中的保留时间。

其中：为 undo 表空间添加数据文件、重命名 undo 表空间的数据文件、将 undo 表空间的数据文件联机或脱机等三个操作和永久表空间的操作完全相同。

### 和回退信息保留时间相关的设置：

回退信息保留时间：Oracle 根据 undo 表空间的大小以及事务量的多少自动调整回退信息的保留时间，可通过调整初始化参数 undo_retention 设置回退信息在回退段中的保留时间：

```java
SQL> ALTER SYSTEM SET UNDO_RETENTION = 1800;
System altered.
```

当用户将 UNDO_RETENTION 参数设置为 1800s 以后，Oracle 会尽量的将回退信息保存 1800s。但在操作过程中，如果回退表空间不够用了，新的回退信息依然会将未达到 1800s 的回退信息覆盖。

我们也可以指定回退信息必须保留到 undo_retention 规定的时间，通过启用 undo 表空间的 retention guarantee 特性，保证只有过期（已提交且达到 undo_retention 设定的值）的数据才会被覆盖，即使 undo 表空间容量已经不足，也不会覆盖未过期的回退信息。

查看undo 表空间的 retention guarantee 属性：

```java
SQL> select tablespace_name, retention 
     from dba_tablespaces
     where tablespace_name like '%UNDO%';
TABLESPACE_NAME 	       RETENTION
------------------------------ -----------
UNDOTBS1		       NOGUARANTEE
UNDOTBS2		       NOGUARANTEE
UNDOTBS101		       NOGUARANTEE
```

修改undo 表空间的 retention guarantee 属性：

```java
SQL> ALTER TABLESPACE UNDOTBS101 RETENTION GUARANTEE;
Tablespace altered.
```

重新查看 undo 表空间的 retention guarantee 属性：

```java
SQL> select tablespace_name, retention 
     from dba_tablespaces
     where tablespace_name like '%UNDO%';
TABLESPACE_NAME 	       RETENTION
------------------------------ -----------
UNDOTBS1		       NOGUARANTEE
UNDOTBS2		       NOGUARANTEE
UNDOTBS101		       GUARANTEE
```

### 3、切换undo表空间

在数据库运行过程中，可以从一个 undo 表空间切换到另一个 undo 表空间，由于初始化参数 undo_tablespace 是一个动态参数，直接修改即可，无需重启实例。

在以下情况下，undo 表空间切换会发生错误：

（1）指定的 undo 表空间不存在；

（2）指定的表空间不是 undo 表空间；

（3）指定的 undo 表空间正在被其它实例使用。

在完成undo 表空间的切换后，任何新的事务的回退信息都会进入新的 undo 表空间中，如果旧的 undo 表空间还存在未提交的事务，则旧的 undo 表空间进入挂起脱机状态，挂起脱机状态的 undo 表空间不能被新的事务使用，也不能删除。当前未提交的事务将继续使用该表空间。当所有事务都提交完成后，旧的 undo 表空间进入脱机状态。

切换方式如下：

```java
SQL> ALTER SYSTEM SET UNDO_TABLESPACE = UNDOTBS101;
System altered.
SQL> show parameter undo_tablespace
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
undo_tablespace 		     string	 UNDOTBS101
```

查看回退段的状态：

```java
SQL> select owner,segment_name,tablespace_name,status from dba_rollback_segs;
OWNER  SEGMENT_NAME		      TABLESPACE_NAME		     STATUS
------ ------------------------------ ------------------------------ ----------------
SYS    SYSTEM			      SYSTEM			     ONLINE
PUBLIC _SYSSMU1_3724004606$	      UNDOTBS1			     OFFLINE
PUBLIC _SYSSMU2_2996391332$	      UNDOTBS1			     OFFLINE
PUBLIC _SYSSMU3_1723003836$	      UNDOTBS1			     OFFLINE
PUBLIC _SYSSMU4_1254879796$	      UNDOTBS1			     OFFLINE
PUBLIC _SYSSMU5_898567397$	      UNDOTBS1			     OFFLINE
PUBLIC _SYSSMU6_1263032392$	      UNDOTBS1			     OFFLINE
PUBLIC _SYSSMU7_2070203016$	      UNDOTBS1			     OFFLINE
PUBLIC _SYSSMU8_517538920$	      UNDOTBS1			     ONLINE --回退段正在使用，无法 OFFLINE
PUBLIC _SYSSMU9_1650507775$	      UNDOTBS1			     OFFLINE
PUBLIC _SYSSMU10_1197734989$	  UNDOTBS1			     OFFLINE
PUBLIC _SYSSMU11_2522431595$	  UNDOTBS2			     ONLINE
PUBLIC _SYSSMU12_1517809045$	  UNDOTBS2			     ONLINE
PUBLIC _SYSSMU13_436118795$	      UNDOTBS2			     ONLINE
PUBLIC _SYSSMU14_2425809615$	  UNDOTBS2			     ONLINE
PUBLIC _SYSSMU15_1019824898$	  UNDOTBS2			     ONLINE
PUBLIC _SYSSMU16_436613144$	      UNDOTBS2			     ONLINE
PUBLIC _SYSSMU17_448925445$	      UNDOTBS2			     ONLINE
PUBLIC _SYSSMU18_3926145788$	  UNDOTBS2			     ONLINE
PUBLIC _SYSSMU19_1451449480$	  UNDOTBS2			     ONLINE
PUBLIC _SYSSMU20_3889389392$	  UNDOTBS2			     ONLINE
PUBLIC _SYSSMU21_2253597407$	  UNDOTBS101		     ONLINE
PUBLIC _SYSSMU22_4023573983$	  UNDOTBS101		     ONLINE
PUBLIC _SYSSMU23_431727682$	      UNDOTBS101		     ONLINE
PUBLIC _SYSSMU24_2107355149$	  UNDOTBS101		     ONLINE
PUBLIC _SYSSMU25_1867674616$	  UNDOTBS101		     ONLINE
PUBLIC _SYSSMU26_1784068981$	  UNDOTBS101		     ONLINE
PUBLIC _SYSSMU27_3382458515$	  UNDOTBS101		     ONLINE
PUBLIC _SYSSMU28_429498880$	      UNDOTBS101		     ONLINE
PUBLIC _SYSSMU29_1658042439$	  UNDOTBS101		     ONLINE
PUBLIC _SYSSMU30_2168076357$	  UNDOTBS101		     ONLINE
31 rows selected.
```

### 4、删除undo表空间

与普通表空间一样，可以使用 drop tablespace 来删除 undo 表空间，但是不能删除当前正在使用的 undo 表空间。如果在 undo 表空间中含有任何未提交的事务的回退信息，则不能删除表空间。

此外，即使已经删除了 undo 表空间，在该表空间中也可能存在未过期的回退信息，这样导致某些查询所需的回退信息丢失。删除 undo 表空间命令如下：

```java
SQL> drop tablespace UNDOTBS101 including contents and datafiles;
drop tablespace UNDOTBS101 including contents and datafiles
*
ERROR at line 1:
ORA-30013: undo tablespace 'UNDOTBS101' is currently in use
--无法删除，要删除的表空间时当前正常使用的表空间
```

重新把表空间切换为 UNDOTBS1：

```java
SQL> ALTER SYSTEM SET UNDO_TABLESPACE = UNDOTBS1;
System altered.
SQL> show parameter undo;
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
undo_management 		     string	 AUTO
undo_retention			     integer	 1800
undo_tablespace 		     string	 UNDOTBS1
```

重建删除 undo 表空间 UNDOTBS101：

```java
SQL> drop tablespace UNDOTBS101 including contents and datafiles;
Tablespace dropped.
--成功删除
SQL> select tablespace_name,file_name from dba_data_files;
TABLESPACE_NAME 	       FILE_NAME
------------------------------ ------------------------------------------------------------
USERS			       +DATA/orcl/datafile/users.259.1070471891
UNDOTBS1		       +DATA/orcl/datafile/undotbs1.258.1070471891
SYSAUX			       +DATA/orcl/datafile/sysaux.257.1070471889
SYSTEM			       +DATA/orcl/datafile/system.256.1070471889
UNDOTBS2		       +DATA/orcl/datafile/undotbs2.264.1070472143
TS001			       +DATA/orcl/datafile/ts001.dbf
6 rows selected.
```
