# 20、Oracle 教程 - Oracle 的段（segment）管理
- 来源：https://ddkk.com/zhuanlan/db/oracle/1/20.html
- 分类：缓存数据库
- 分组：教程目录
在Oracle 内部，对象空间是以段（Segment）的形式存在和管理的，当建立数据对象（表、索引、簇等）时，Oracle 会自动给这些数据对象分配相应的存储空间，以存放它们的数据信息，这些为数据对象所分配的存储空间被称为段。

一个段只能存放在一个表空间中，但是可分布在属于这个表空间中的多个数据文件中。段由多个区组成，用于保存特定的数据库对象，每种数据对象都具有相应的段。段可分为以下几种类型：

（1）数据段：也称为表段，当创建一张表时，系统自动创建一个以该表的名字命名的数据段。

（2）索引段：包含索引信息。创建索引时，系统自动创建一个以该索引的名字命名的索引段。

（3）回滚段：当一个事务开启（DML 会自动开启事务）时，系统会自动为之分配回滚段。当修改表中数据的时候，该数据修改前的值会存放在回滚段中，当用户回滚（rollback）事务时，Oracle 将利用回滚段中保存的数据来恢复到原来的值。提交事务之后，系统会自动释放相应回滚段的数据。

（4）临时段：是 Oracle 在运行过程中自行创建的段。当一个 SQL 语句需要临时工作区时，由 Oracle 建立临时段。一旦语句执行完毕，临时段将自动消除。

（5）LOB 段：如果表中含有 CLOB 和 BLOB 等大型对象类型数据时，系统将创建 LOB 段以存储相应的大型对象数据。

当一个段被创建时，区间（Extent）就被分配，随着后续的不断使用，一个段的空间可以以区为单位不断扩展。

前面提到Extent的管理技术是通过字典或本地的方式进行的，那么当Extent被分配给Segment，这个空间又是如何管理的呢？"SEGMENT SPACE MANAGEMENT AUTO"这个语句就是定义的段空间管理方式。

Oracle的段空间管理方式主要有两种，一种是手工段空间管理（Manual Segment Space Management，缩写为MSSM），由于这种方式使用自由列表来管理段空间，所以也被称为自由列表管理方式（Freelist Mangement，缩写为FLM），一种就是Oracle 9i带来的全新的自动段空间管理（Auto Segment Space Management，缩写为ASSM）。

## 一、查看 Oracle 数据库的段类型

可以使用数据字段 dba_segments 查看 Oracle 段的类型：

```java
SQL> select distinct segment_type from dba_segments;
SEGMENT_TYPE
------------------
LOBINDEX
INDEX PARTITION
TABLE SUBPARTITION
TABLE PARTITION
NESTED TABLE
ROLLBACK
LOB PARTITION
LOBSEGMENT
INDEX
TABLE
CLUSTER
TYPE2 UNDO
12 rows selected.
```

### 1、数据段（TABLE）

这是最常见的段类型，普通表（非CLUSTER），没有分区，则每个表有一个类型为 TABLE 的段。

查询users 表空间中，所有表的名称、大小：

```java
SQL> select OWNER, SEGMENT_NAME, BYTES/1024/1024 size_MB
     from dba_segments
     where segment_type='TABLE' and tablespace_name='USERS';
OWNER			       SEGMENT_NAME					    SIZE_MB
----------------------------------------------------------------------------- ----------
SCOTT			       E01							     .0625
SCOTT			       TS_001						     .0625
SCOTT			       EMP_BAK						     .0625
SCOTT			       SALGRADE 					     .0625
SCOTT			       EMP							    .0625
SCOTT			       DEPT							    .0625
WGX			           EMP01							.0625
WGX			           T1								.0625
8 rows selected.
```

### 2、索引段（INDEX）

这是除TABLE 之外最常见的段类型。表的普通索引，没有分区，则每个索引有一个类型为 INDEX 的段。除了表上的普通索引之外，INDEX CLUSTER 上的索引也是 INDEX 段，并且在 INDEX CLUSTER 上必须有一个索引。

查询users 表空间中，所有索引的名称、大小：

```java
SQL> select OWNER, SEGMENT_NAME, BYTES/1024/1024 size_MB
     from dba_segments
     where segment_type='INDEX' and tablespace_name='USERS';
OWNER			       SEGMENT_NAME					    SIZE_MB
---------------------------------------------------------------------- ----------
SCOTT			       PK_EMP						      .0625
SCOTT			       PK_DEPT						      .0625
WGX			           SYS_C0011088					      .0625
```

### 3、回退段（ROLLBACK）

回退段包含两种类型：（1）ROLLBAKTY；（2）PE2 UNDO。

查看回退段的信息：

```java
SQL> select owner,segment_name,tablespace_name from dba_segments where segment_type='ROLLBACK';
OWNER			   SEGMENT_NAME					 TABLESPACE_NAME
------------------------------ -------------------------------------------------------------
SYS			       SYSTEM						 SYSTEM
SYS			       UNDO_SEGS001					 UNDOTBS1
SYS			       UNDO_SEGS002					 UNDOTBS1
SYS			       UNDO_SEGS003					 UNDOTBS1
SYS			       UNDO_SEGS004					 UNDOTBS1
SYS			       UNDO_SEGS005					 UNDOTBS1
6 rows selected.
SQL> select owner,segment_name,tablespace_name from dba_segments where segment_type='TYPE2 UNDO';
OWNER			       SEGMENT_NAME					 TABLESPACE_NAME
------------------------------ ----------------------------------------------------------------
SYS			       _SYSSMU1_3724004606$				 UNDOTBS1
SYS			       _SYSSMU2_2996391332$				 UNDOTBS1
SYS			       _SYSSMU3_1723003836$				 UNDOTBS1
SYS			       _SYSSMU4_1254879796$				 UNDOTBS1
SYS			       _SYSSMU5_898567397$				 UNDOTBS1
SYS			       _SYSSMU6_1263032392$				 UNDOTBS1
SYS			       _SYSSMU7_2070203016$				 UNDOTBS1
SYS			       _SYSSMU8_517538920$				 UNDOTBS1
SYS			       _SYSSMU9_1650507775$				 UNDOTBS1
SYS			       _SYSSMU10_1197734989$			 UNDOTBS1
SYS			       _SYSSMU11_2522431595$			 UNDOTBS2
SYS			       _SYSSMU12_1517809045$			 UNDOTBS2
SYS			       _SYSSMU13_436118795$				 UNDOTBS2
SYS			       _SYSSMU14_2425809615$			 UNDOTBS2
SYS			       _SYSSMU15_1019824898$			 UNDOTBS2
SYS			       _SYSSMU16_436613144$				 UNDOTBS2
SYS			       _SYSSMU17_448925445$				 UNDOTBS2
SYS			       _SYSSMU18_3926145788$			 UNDOTBS2
SYS			       _SYSSMU19_1451449480$			 UNDOTBS2
SYS			       _SYSSMU20_3889389392$			 UNDOTBS2
SYS			       _SYSSMU21_894061986$				 UNDOTBS11
SYS			       _SYSSMU22_3290518977$			 UNDOTBS11
SYS			       _SYSSMU23_4195287356$			 UNDOTBS11
SYS			       _SYSSMU24_2904816458$			 UNDOTBS11
SYS			       _SYSSMU25_3424601340$			 UNDOTBS11
SYS			       _SYSSMU26_2544040228$			 UNDOTBS11
SYS			       _SYSSMU27_81081477$				 UNDOTBS11
SYS			       _SYSSMU28_3305267124$			 UNDOTBS11
SYS			       _SYSSMU29_4263141085$			 UNDOTBS11
SYS			       _SYSSMU30_2064898567$			 UNDOTBS11
30 rows selected.
```

也可通过数据字典 dba_rollback_segs 查看回退段的信息：

```java
SQL> select owner,segment_name,tablespace_name,status from dba_rollback_segs;
OWNER  SEGMENT_NAME		      TABLESPACE_NAME		     STATUS
------ ------------------------------ ------------------------------ ----------------
SYS    SYSTEM		             SYSTEM			        ONLINE
PUBLIC _SYSSMU1_3724004606$	      UNDOTBS1			     ONLINE
PUBLIC _SYSSMU2_2996391332$	      UNDOTBS1			     ONLINE
PUBLIC _SYSSMU3_1723003836$	      UNDOTBS1			     ONLINE
PUBLIC _SYSSMU4_1254879796$	      UNDOTBS1			     ONLINE
PUBLIC _SYSSMU5_898567397$	      UNDOTBS1			     ONLINE
PUBLIC _SYSSMU6_1263032392$	      UNDOTBS1			     ONLINE
PUBLIC _SYSSMU7_2070203016$	      UNDOTBS1			     ONLINE
PUBLIC _SYSSMU8_517538920$	      UNDOTBS1			     ONLINE
PUBLIC _SYSSMU9_1650507775$	      UNDOTBS1			     ONLINE
PUBLIC _SYSSMU10_1197734989$	  UNDOTBS1			     ONLINE
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
PUBLIC _SYSSMU21_894061986$	      UNDOTBS11 		     OFFLINE
PUBLIC _SYSSMU22_3290518977$	  UNDOTBS11 		     OFFLINE
PUBLIC _SYSSMU23_4195287356$	  UNDOTBS11 		     OFFLINE
PUBLIC _SYSSMU24_2904816458$	  UNDOTBS11 		     OFFLINE
PUBLIC _SYSSMU25_3424601340$	  UNDOTBS11 		     OFFLINE
PUBLIC _SYSSMU26_2544040228$	  UNDOTBS11 		     OFFLINE
PUBLIC _SYSSMU27_81081477$	      UNDOTBS11 		     OFFLINE
PUBLIC _SYSSMU28_3305267124$	  UNDOTBS11 		     OFFLINE
PUBLIC _SYSSMU29_4263141085$	  UNDOTBS11 		     OFFLINE
PUBLIC _SYSSMU30_2064898567$	  UNDOTBS11 		     OFFLINE
SYS    UNDO_SEGS001		          UNDOTBS1			     OFFLINE
SYS    UNDO_SEGS002		          UNDOTBS1			     OFFLINE
SYS    UNDO_SEGS003		          UNDOTBS1			     OFFLINE
SYS    UNDO_SEGS004		          UNDOTBS1			     OFFLINE
SYS    UNDO_SEGS005		          UNDOTBS1			     OFFLINE
36 rows selected.
```

## 二、Oracle 段空间的管理模式

段空间管理模式，就是怎样管理段内的空闲空间，是指如何管理段所拥有的数据块中的空闲块。段空间管理模式分为两种：自动管理（auto）和手工管理（manual）。

### 说明：段空间管理模式是表空间的一个属性。即：某个表空间中的所有段必须采用同一种管理模式。

查看段空间的管理模式：

```java
SQL> select tablespace_name, segment_space_management from dba_tablespaces;
TABLESPACE_NAME 	       SEGMEN
------------------------------ ------
SYSTEM			       MANUAL
SYSAUX			       AUTO
UNDOTBS1		       MANUAL
TEMP			       MANUAL
USERS			       AUTO
UNDOTBS2		       MANUAL
TS001			       AUTO
TEMP02			       MANUAL
TEMP03			       MANUAL
UNDOTBS11		       MANUAL
UNDO_ARCHIVE	       AUTO
11 rows selected.
```

### 1、手工段空间管理（Manual Segment Space Management）

MSSM 管理方式是 Oracle 最初实现的一种段空间管理技术。区间（Extent）是 Oracle 的最小空间分配单元，而 Block 是Oracle 的最小 IO 操作单元，也就是说，Oracle 以区间为单位将空间分配给段，而段内则是以 Block 为单位进行空间使用和管理的。

MSSM 管理方式的具体实现方式是通过在段头（Segment Header）分配空闲列表（freelist）来管理 Block 的使用，可以把自由列表想象成一个数据表，Oracle 依赖一系列的算法通过向自由列表中加入或移出 Block 来实现段空间管理。

### 2、自动段空间管理（Auto Segment Space Management）

在ASSM中，原有的 freelist 被位图所取代，通过位图能够迅速有效地管理存储扩展和剩余区块（free block），因此能够改善段存储管理的本质。

## 三、段空间的手工管理（Manual Segment Space Management）

MSSM 管理方式的具体实现方式是通过在段头（Segment Header）分配空闲列表（freelist）来管理 Block 的使用。使用空闲列表管理段内的空闲块，空闲列表记录在段头，空闲列表指向段内空闲块的地址，空闲列表的数量可以由用户指定。可以把自由列表想象成一个数据表，Oracle 依赖一系列的算法通过向空闲列表中加入或移出 Block 来实现段空间管理。

当创建对象时（如数据表）可以定义 freelist 的数量，对于数据表缺省的 freelist 为1，可以通过 dba_segments 查询得到这些数据：

```java
SQL> select owner,segment_name,freelists from dba_segments where owner='SCOTT';
OWNER	   SEGMENT_NAME 	 FREELISTS
---------- -------------------- ----------
SCOTT	   TX001			 2
SCOTT	   PK_EMP
SCOTT	   PK_DEPT
SCOTT	   E01
SCOTT	   TS_001
SCOTT	   EMP_BAK
SCOTT	   SALGRADE
SCOTT	   EMP
SCOTT	   DEPT
SCOTT	   TX002
10 rows selected.
```

当向一个对象中插入数据时，Oracle 首先在该对象的 freelist 上寻找可用于插入数据的 Block，当一个 Block 用完之后，就会从 freelist 中删除，当这个 Block 上由于数据删除等空间释放后，可以再次回到 freelist 中，而这主要是通过存储参数PCTFREE 和 PCTUSED 来实现。

假设PCTFREE=20，PCTUSED=40，表明当一个 Block 的空间使用率达到了 80% 时，这个 block 就不再允许被用于新增数据（insert），而保留下来的这 20% 的空间则被预留为行更新（update）所可能需要的空间扩展，此时这个 Block 就从 freelist 中被删除；当这个 Block 中有数据被删除（delete）时，空间不断被释放，当空间使用低于 PCTUSED 参数设置时（此处即为40%），这个数据块才会重新被加入到 freelists 中，加入 freelist 后这个 Block 又可以被插入新的数据。

通过以上的描述可以看出，如果一个段的操作非常频繁，那么很多用户就会同时请求访问 freelist，并对 freelist 进行修改。对于表来说，缺省的 freelist 为1，这就很容易引发竞争，虽然可以通过增加 freelist 的方法缓解这种竞争，但是我们已经看到这种管理方式存在的缺陷。

可以通过 DUMP 的方式来转储数据块的头信息，查看 freelist 的设置。

### 1、查看空闲列表

（1）在 system 表空间（手工管理）创建一张表 scott.tx001

```java
-- system 表空间采用手工管理段空间
SQL> create table scott.tx001(id int, name varchar(20)) tablespace system;
Table created.
--在表中插入数据
SQL> insert into scott.tx001 values(1,'Jack');
1 row created.
SQL> commit;
Commit complete.
SQL> alter system checkpoint;
System altered.
```

（2）查询 tx001 段的段头块

```java
--查询哪些块属于 tx001 段
SQL> select file_id, block_id, blocks from dba_extents where segment_name = 'TX001';
   FILE_ID   BLOCK_ID	  BLOCKS
---------- ---------- ----------
	 1	95392	       8
--查询 tx001 段的段头块
SQL> select header_file, header_block from dba_segments where segment_name = 'TX001';
HEADER_FILE HEADER_BLOCK
----------- ------------
	  1	   95392
```

（3）将段头块（segment header）的数据转储到用户进程跟踪文件

```java
SQL> alter system dump datafile 1 block 95392;
System altered.
--查看用户进程跟踪文件的位置
SQL> show parameter background
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
background_core_dump		     string	 partial
```

（4）查看用户进程跟踪文件的内容

```java
##按时间先后显示用户进程跟踪文件
[root@rac1 trace]# ll -tr *ora*
.....
-rw-r----- 1 oracle asmadmin   386 8月  23 12:33 orcl1_ora_2750.trm
-rw-r----- 1 oracle asmadmin  3640 8月  23 12:33 orcl1_ora_2750.trc
-rw-r----- 1 oracle asmadmin   159 8月  23 12:46 orcl1_ora_4274.trm
-rw-r----- 1 oracle asmadmin  3180 8月  23 12:46 orcl1_ora_4274.trc
##查看用户进程跟踪文件的内容
[root@rac1 trace]# cat orcl1_ora_4274.trc
*** 2021-08-23 12:46:51.013
Dump of buffer cache at level 4 for tsn=0 rdba=4289696
Block dump from disk:
buffer tsn: 0 rdba: 0x004174a0 (1/95392)
scn: 0x0000.002bb0a4 seq: 0x01 flg: 0x04 tail: 0xb0a41001
#########################################
## DATA SEGMENT HEADER：段头块
frmt: 0x02 chkval: 0xc5e5 type: 0x10=DATA SEGMENT HEADER - UNLIMITED
#########################################
Hex dump of block: st=0, typ_found=1
Dump of memory from 0x00007F6954A3FA00 to 0x00007F6954A41A00
7F6954A3FA00 0000A210 004174A0 002BB0A4 04010000  [.....tA...+.....]
......
7F6954A419F0 00000000 00000000 00000000 B0A41001  [................]
  Extent Control Header
  -----------------------------------------------------------------
  Extent Header:: spare1: 0      spare2: 0     extents: 1     blocks: 7     
                  last map  0x00000000 maps: 0      offset: 4128  
############  高水位标记##########################
## 指向段内的第一个空闲块的地址，即：当前段的第一个空闲块的地址为 0x004174a2
## 查询时如果执行全表扫描，则扫描到高水位标记指向的块就结束。并不需要扫描所有的块。
## 因为高水位之后的块肯定是空白块，不需要扫描。
      Highwater::  0x004174a2  ext#: 0      blk#: 1      ext size: 7     
 blocks in seg. hdr's freelists: 1     
 blocks below: 1     
##############################################
  mapblk  0x00000000  offset: 0     
                   Unlocked
     Map Header:: next  0x00000000 extents: 1    obj#: 87834  flag: 0x40000000
  Extent Map
  -----------------------------------------------------------------
   0x004174a1  length: 7     
  nfl = 1, nfb = 1 typ = 1 nxf = 0 ccnt = 1
##############################################
## 空闲列表：指向高水位之前的某个空闲块
  SEG LST:: flg: USED   lhd: 0x004174a1 ltl: 0x004174a1 
##############################################
2021-08-23 12:46:51.087256 : kjbmbassert [0x174a0.1]
End dump data blocks tsn: 0 file#: 1 minblk 95392 maxblk 95392
```

### 2、手工指定空闲列表的数量

（1）指定空闲列表的数量为 2

```java
SQL> alter table scott.tx001 storage (freelists 2);
Table altered.
```

（2）重新转储段头块

```java
SQL> alter system dump datafile 1 block 95392;
System altered.
```

（3）查看用户进程跟踪文件的内容

```java
##按时间先后显示用户进程跟踪文件
[root@rac1 trace]# ll -tr *ora*
.....
-rw-r----- 1 oracle asmadmin 43502 8月  23 14:10 orcl1_ora_9867.trc
-rw-r----- 1 oracle asmadmin  2744 8月  23 14:27 orcl1_ora_14686.trm
-rw-r----- 1 oracle asmadmin 38041 8月  23 14:27 orcl1_ora_14686.trc
-rw-r----- 1 oracle asmadmin   568 8月  24 01:46 orcl1_ora_87048.trm
-rw-r----- 1 oracle asmadmin  5924 8月  24 01:46 orcl1_ora_87048.trc
##查看用户进程跟踪文件的内容
[root@rac1 trace]# cat orcl1_ora_87048.trc
*** 2021-08-24 01:46:33.285
Block dump from disk:
buffer tsn: 0 rdba: 0x004174a0 (1/95392)
scn: 0x0000.002c7a26 seq: 0x01 flg: 0x04 tail: 0x7a261001
frmt: 0x02 chkval: 0xc5e1 type: 0x10=DATA SEGMENT HEADER - UNLIMITED
Hex dump of block: st=0, typ_found=1
Dump of memory from 0x00007F4429EE2A00 to 0x00007F4429EE4A00
7F4429EE2A00 0000A210 004174A0 002C7A26 04010000  [.....tA.&z,.....]
......
7F4429EE49F0 00000000 00000000 00000000 7A261001  [..............&z]
  Extent Control Header
  -----------------------------------------------------------------
  Extent Header:: spare1: 0      spare2: 0     extents: 1     blocks: 7     
                  last map  0x00000000 maps: 0      offset: 4128  
      Highwater::  0x004174a2  ext#: 0      blk#: 1      ext size: 7     
 blocks in seg. hdr's freelists: 1     
 blocks below: 1     
  mapblk  0x00000000  offset: 0     
                   Unlocked
     Map Header:: next  0x00000000 extents: 1    obj#: 87834  flag: 0x40000000
  Extent Map
  -----------------------------------------------------------------
   0x004174a1  length: 7     
  nfl = 2, nfb = 1 typ = 1 nxf = 0 ccnt = 1
#############################################
## 空闲列表：一共 3 个空闲列表
  SEG LST:: flg: USED   lhd: 0x004174a1 ltl: 0x004174a1 
  SEG LST:: flg: UNUSED lhd: 0x00000000 ltl: 0x00000000 
  SEG LST:: flg: UNUSED lhd: 0x00000000 ltl: 0x00000000 
#############################################
GLOBAL CACHE ELEMENT DUMP (address: 0x77bf3be8):
...
2021-08-24 01:46:33.462741 : kjbmbassert [0x174a0.1]
End dump data blocks tsn: 0 file#: 1 minblk 95392 maxblk 95392
```

## 四、段空间自动管理（Auto Segment Space Management）

在ASSM 管理方式下，原有的 freelist 被位图所取代，通过位图能够迅速有效地管理存储扩展和剩余区块（free block），因此能够改善段存储管理的本质。在 ASSM 管理方式下，insert 通过扫描位图来查找可用的 block，即使 block 的可用空间低于 PCTFREE，也不会从位图中删除，因此 PCTUSED 参数将不再需要；而 PCTFREE 参数，仍然需要它来指示需要保留多少空间给后续的 update 导致的行数据增长使用。至于 freelists 和 freelist groups 参数在 ASSM 中都无效了。

创建一个数据表，设置 pctfree 选项，命令如下：

```java
create table EYGLE (  
    ID    NUMBER(8),  
    UNAME CHAR(1000)  
)  
    tablespace ts001
    pctfree 50; 
```

新的管理机制用位图数组来跟踪或管理每个分配到对象的块，而每个块有多少剩余空间是根据位图的状态来确定的。Oracle 将高水位（HIgh Water Mark）以下的块分成六种状态：full、UNformat、free 0~25%、free 25~50%、、free 50~75%、free 75~100%。块的空间使用情况会记录在位图块，位图块属于具体的段。

段空间自动管理模式下：由 FIRST LEVEL BITMAP BLOCK（一级位图块）管理空闲块。由 SECOND LEVEL BITMAP BLOCK（二级位图块）管理一级位图块。当数据量足够大时，还会出现 THIRD BITMAP BLOCK（三级位图块），由三级位图块管理二级位图块。

使用ASSM 管理方式之后，显著提高了 DML 并发操作的性能，因为位图数组的不同部分可以被同时使用，这样就消除了寻找剩余空间的串行化。

查看位图块和段头块：

### 1、在 ts001 表空间（自动管理）创建一张表 scott.tx002

```java
SQL> select tablespace_name,contents,segment_space_management from dba_tablespaces;
TABLESPACE_NAME 	       CONTENTS  SEGMEN
------------------------------ --------- ------
SYSTEM			       PERMANENT MANUAL
SYSAUX			       PERMANENT AUTO
UNDOTBS1		       UNDO	 MANUAL
TEMP			       TEMPORARY MANUAL
USERS			       PERMANENT AUTO
UNDOTBS2		       UNDO	 MANUAL
TS001			       PERMANENT AUTO
TEMP02			       TEMPORARY MANUAL
TEMP03			       TEMPORARY MANUAL
UNDOTBS11		       UNDO	 MANUAL
UNDO_ARCHIVE		       PERMANENT AUTO
11 rows selected.
-- ts001 表空间采用手工管理段空间
SQL> create table scott.tx002(id int, name varchar(20)) tablespace ts001;
Table created.
--在表中插入数据
SQL> insert into scott.tx002 values(1,'Jack');
1 row created.
SQL> commit;
Commit complete.
SQL> alter system checkpoint;
System altered.
```

### 2、查询 tx002 段的段头块

```java
--查询哪些块属于 tx002 段
SQL> select file_id, block_id, blocks from dba_extents where segment_name = 'TX002';
   FILE_ID   BLOCK_ID	  BLOCKS
---------- ---------- ----------
	 6	  128	       8
--查询 tx002 段的段头块
--段头块并不是第一个数据块！
SQL> select header_file, header_block from dba_segments where segment_name = 'TX002';
HEADER_FILE HEADER_BLOCK
----------- ------------
	  6	     130
```

### 3、将 128~135 共 8 个块的数据转储到用户进程跟踪文件

```java
SQL> alter system dump datafile 6 block min 128 block max 135;
System altered.
```

### 4、查看用户进程跟踪文件的内容

### （1）一级位图块

该位图块管理 8 个 Block，如果对象的空间超过这个值，那么 Oracle 就要分配更多的一级位图块来管理 Block，进而这些一级位图块又需要管理，于是又引出了二级位图块，Oracle 最多支持三级位图块。

parent dba：0x01800081 表示管理一级位图块的二级位图块的地址。

```java
Block dump from disk:
buffer tsn: 6 rdba: 0x01800080 (6/128)
scn: 0x0000.002c7a8b seq: 0x01 flg: 0x04 tail: 0x7a8b2001
####################################
## FIRST LEVEL BITMAP BLOCK：一级位图块，第一个块（128号块）
frmt: 0x02 chkval: 0xb158 type: 0x20=FIRST LEVEL BITMAP BLOCK
Hex dump of block: st=0, typ_found=1
####################################
...........
## dump 一级位图块
Dump of First Level Bitmap Block
 --------------------------------
   nbits : 4 nranges: 1         parent dba:  0x01800081   poffset: 0     
   unformatted: 0       total: 8         first useful block: 3      
   owning instance : 1
   instance ownership changed at 08/23/2021 14:06:40
   Last successful Search 08/23/2021 14:06:40
   Freeness Status:  nf1 0      nf2 0      nf3 0      nf4 5      
   Extent Map Block Offset: 4294967295 
   First free datablock : 3      
   Bitmap block lock opcode 0
   Locker xid:     :  0x0000.000.00000000
   Dealloc scn: 925704.0 
   Flag: 0x00000001 (-/-/-/-/-/HWM)
   Inc: 0 Objd: 87835 
  HWM Flag: HWM Set
      Highwater::  0x01800088  ext#: 0      blk#: 8      ext size: 8     
 blocks in seg. hdr's freelists: 0     
 blocks below: 5     
  mapblk  0x00000000  offset: 0     
  --------------------------------------------------------
  DBA Ranges :
  --------------------------------------------------------
   0x01800080  Length: 8      Offset: 0      
   0:Metadata   1:Metadata   2:Metadata   3:75-100% free
   4:75-100% free   5:75-100% free   6:75-100% free   7:75-100% free
  --------------------------------------------------------
.....
```

### （2）二级位图块

该二级位图块记录了一级位图块的地址，就是每个区间的第一个 Block，在这个块内同时包含了上级位图块地址。即：

pdba：0x01800082，该地址就是段头块的地址。

```java
Block dump from disk:
buffer tsn: 6 rdba: 0x01800081 (6/129)
scn: 0x0000.002c7a80 seq: 0x01 flg: 0x04 tail: 0x7a802101
####################################
## SECOND LEVEL BITMAP BLOCK：二级位图块，第2个块（129号块）
frmt: 0x02 chkval: 0xd111 type: 0x21=SECOND LEVEL BITMAP BLOCK
####################################
....
## dump 二级位图块
Dump of Second Level Bitmap Block
   number: 1       nfree: 1       ffree: 0      pdba:     0x01800082 
   Inc: 0 Objd: 87835
  opcode:0 
 xid: 
  L1 Ranges :
  --------------------------------------------------------
   0x01800080  Free: 5 Inst: 1  一级位图块的地址：0x01800080
  --------------------------------------------------------
..........
```

### （3）段头块

在段头块记录了二级位图块的地址。通常段头块被看作是一个三级位图块，如果段头块的空间不足以存储二级位图块的指针，那么新的三级级位图块将被创建。

```java
Block dump from disk:
buffer tsn: 6 rdba: 0x01800082 (6/130)
scn: 0x0000.002c7a8b seq: 0x01 flg: 0x04 tail: 0x7a8b2301
####################################
##  PAGETABLE SEGMENT HEADER：段头块
frmt: 0x02 chkval: 0xfcbd type: 0x23=PAGETABLE SEGMENT HEADER
####################################
Hex dump of block: st=0, typ_found=1
Dump of memory from 0x00007F72E9611A00 to 0x00007F72E9613A00
7F72E9611A00 0000A223 01800082 002C7A8B 04010000  [#........z,.....]
.......
7F72E96139F0 00000000 00000000 00000000 7A8B2301  [.............#.z]
  Extent Control Header
  -----------------------------------------------------------------
  Extent Header:: spare1: 0      spare2: 0     extents: 1     blocks: 8     
                  last map  0x00000000 maps: 0      offset: 2716  
      Highwater::  0x01800088  ext#: 0      blk#: 8      ext size: 8     
 blocks in seg. hdr's freelists: 0     
 blocks below: 5     
  mapblk  0x00000000  offset: 0     
                   Unlocked
  --------------------------------------------------------
  Low HighWater Mark : 
      Highwater::  0x01800088  ext#: 0      blk#: 8      ext size: 8     
 blocks in seg. hdr's freelists: 0     
 blocks below: 5     
  mapblk  0x00000000  offset: 0     
  Level 1 BMB for High HWM block: 0x01800080
  Level 1 BMB for Low HWM block: 0x01800080
  --------------------------------------------------------
  Segment Type: 1 nl2: 1      blksz: 8192   fbsz: 0      
  L2 Array start offset:  0x00001434
  First Level 3 BMB:  0x00000000
  L2 Hint for inserts:  0x01800081
  Last Level 1 BMB:  0x01800080
  Last Level II BMB:  0x01800081
  Last Level III BMB:  0x00000000
     Map Header:: next  0x00000000 extents: 1    obj#: 87835  flag: 0x10000000
  Inc 0 
############################################
## 区的地址
  Extent Map
  -----------------------------------------------------------------
   0x01800080  length: 8     
  Auxillary Map
  --------------------------------------------------------
   Extent 0     :  L1 dba:  0x01800080 Data dba:  0x01800083
  --------------------------------------------------------
############################################
## 二级位图块的地址
   Second Level Bitmap block DBAs 
   --------------------------------------------------------
   DBA 1:   0x01800081
............
```

### （4）数据块

```java
Block dump from disk:
buffer tsn: 6 rdba: 0x01800083 (6/131)
scn: 0x0000.002c7a8b seq: 0x01 flg: 0x04 tail: 0x7a8b0601
frmt: 0x02 chkval: 0x6dcd type: 0x06=trans data
Hex dump of block: st=0, typ_found=1
Dump of memory from 0x00007F72E9611A00 to 0x00007F72E9613A00
7F72E9611A00 0000A206 01800083 002C7A8B 04010000  [.........z,.....]
...........
7F72E96139F0 00000000 00000000 00000000 7A8B0601  [...............z]
Block header dump:  0x01800083
 Object id on Block? Y
 seg/obj: 0x1571b  csc: 0x00.2c7a8a  itc: 2  flg: E  typ: 1 - DATA
     brn: 0  bdba: 0x1800080 ver: 0x01 opc: 0
     inc: 0  exflg: 0
 Itl           Xid                  Uba         Flag  Lck        Scn/Fsc
0x01   0x0000.000.00000000  0x00000000.0000.00  ----    0  fsc 0x0000.00000000
0x02   0x0000.000.00000000  0x00000000.0000.00  ----    0  fsc 0x0000.00000000
bdba: 0x01800083
data_block_dump,data header at 0x7f72e9611a64
===============
tsiz: 0x1f98
hsiz: 0xe
pbl: 0x7f72e9611a64
     76543210
flag=--------
ntab=0
nrow=0
frre=-1
fsbo=0xe
fseo=0x1f98
avsp=0x1f8a
tosp=0x1f8a
block_row_dump:
end_of_block_dump
GLOBAL CACHE ELEMENT DUMP (address: 0x7afe6d48):
  id1: 0x83 id2: 0x6 pkey: OBJ#87835 block: (6/131)
  lock: X rls: 0x0 acq: 0x0 latch: 7
  flags: 0x20 fair: 0 recovery: 0 fpin: 'ktspbwh2: ktspfmdb'
  bscn: 0x0.2c7a8b bctx: (nil) write: 0 scan: 0x0 
  lcp: (nil) lnk: [NULL] lch: [0x7b3cf6b0,0x7b3cf6b0]
  seq: 7 hist: 113 238 180 143:0 325 352 32
  LIST OF BUFFERS LINKED TO THIS GLOBAL CACHE ELEMENT:
    flg: 0x02200000 state: XCURRENT tsn: 6 tsh: 1
      addr: 0x7b3cf578 obj: 87835 cls: DATA bscn: 0x0.2c7a8b
 GCS SHADOW 0x7afe6dc0,1 resp[0x8a8a55a0,0x83.6] pkey 87835.0
   grant 2 cvt 0 mdrole 0x2 st 0x100 lst 0x40 GRANTQ rl LOCAL
   master 1 owner 1 sid 0 remote[(nil),0] hist 0x206
   history 0x6.0x4.0x0.0x0.0x0.0x0.0x0.0x0.0x0.0x0.
   cflag 0x0 sender 0 flags 0x0 replay# 0 abast (nil).x0.1 dbmap (nil)
   disk: 0x0000.00000000 write request: 0x0000.00000000
   pi scn: 0x0000.00000000 sq[0x8a8a55e0,0x8a8a55e0]
   msgseq 0x0 updseq 0x0 reqids[1,0,0] infop (nil) lockseq x115
 GCS SHADOW END
 GCS RESOURCE 0x8a8a55a0 hashq [0x8b51b878,0x8a920170] name[0x83.6] pkey 87835.0
   grant 0x7afe6dc0 cvt (nil) send (nil)@0,0 write (nil),0@65536
   flag 0x0 mdrole 0x2 mode 2 scan 0.0 role LOCAL
   disk: 0x0000.00000000 write: 0x0000.00000000 cnt 0x0 hist 0x0
   xid 0x0000.000.00000000 sid 0 pkwait 0s rmacks 0
   refpcnt 0 weak: 0x0000.00000000
   pkey 87835.0
   hv 6 [stat 0x0, 1->1, wm 32768, RMno 0, reminc 0, dom 0]
   kjga st 0x4, step 0.0.0, cinc 2, rmno 1, flags 0x0
   lb 0, hb 0, myb 14352, drmb 14352, apifrz 0
   GCS SHADOW 0x7afe6dc0,1 resp[0x8a8a55a0,0x83.6] pkey 87835.0
     grant 2 cvt 0 mdrole 0x2 st 0x100 lst 0x40 GRANTQ rl LOCAL
     master 1 owner 1 sid 0 remote[(nil),0] hist 0x206
     history 0x6.0x4.0x0.0x0.0x0.0x0.0x0.0x0.0x0.0x0.
     cflag 0x0 sender 0 flags 0x0 replay# 0 abast (nil).x0.1 dbmap (nil)
     disk: 0x0000.00000000 write request: 0x0000.00000000
     pi scn: 0x0000.00000000 sq[0x8a8a55e0,0x8a8a55e0]
     msgseq 0x0 updseq 0x0 reqids[1,0,0] infop (nil) lockseq x115
   GCS SHADOW END
```
