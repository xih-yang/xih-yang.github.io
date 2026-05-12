# 21、Oracle 教程 - Oracle 的区（extent）管理
- 来源：https://ddkk.com/zhuanlan/db/oracle/1/21.html
- 分类：缓存数据库
- 分组：教程目录
区是由一组连续的数据块（data block）构成的数据库逻辑存储分配单位，用于保存特定数据类型的数据。当用户创建表时，Oracle 为此表的数据段分配一个包含若干数据块的初始区（initial extent）。如果一个段的初始区中的数据块已满，且有新数据插入时，Oracle 自动为这个段分配一个增量区（incremental extent）。为了管理的需要，每个段的段头（header block）包含一个记录此段所有区（extent）的目录。

创建一张空表时是否分配 extent 与 deferred_segment_creation 参数有关：

```java
SQL> show parameter deferred
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
deferred_segment_creation	     boolean	 TRUE
/*说明：deferred_segment_creation 参数
为 false 时：创建表的时候分配 extent
为 trude 时：创建表的时候不分配空间，执行 insert 操作时分配空间
*/
```

段的定义中包含了区（extent）的存储参数，该参数控制 Oracle 如何为段分配可用空间。

如：在CREATE TABLE 语句中使用 STORAGE 子句设定存储参数，决定创建表时为段分配多少初始空间，或限定一个表最多可以包含多少区。如果没有指定存储参数，创建表时使用所在表空间的默认存储参数。

## 一、查看 extent 的信息

### 1、创建一张表 scott.emp002

```java
SQL> create table scott.emp002 as select * from scott.emp where 1=2;
Table created.
```

### 2、使用数据字典 dba_extents 查看 extent 的使用情况

### （1）数据字典 dba_extents 的结构

```java
SQL> desc dba_extents;
 Name					   Null?    Type
 ----------------------------------------- -------- ----------------------------
 OWNER						        VARCHAR2(30)
 SEGMENT_NAME					    VARCHAR2(81)
 PARTITION_NAME 				    VARCHAR2(30)
 SEGMENT_TYPE					    VARCHAR2(18)
 TABLESPACE_NAME				    VARCHAR2(30)
 EXTENT_ID					        NUMBER
 FILE_ID					        NUMBER
 BLOCK_ID					        NUMBER
 BYTES						        NUMBER
 BLOCKS 					        NUMBER
 RELATIVE_FNO					    NUMBER
```

### （2）查看 scott.emp002 表对应的 extent 信息

```java
SQL> select file_id, block_id, blocks, extent_id 
     from dba_extents where segment_name = 'EMP002';
no rows selected
```

可以看到，系统并没有为表 scott.emp002 分配空间。原因就是 deferred_segment_creation 参数为 true 时，并不为空表分配存储空间。

### （3）向 scott.emp002 表插入数据

```java
SQL> insert into scott.emp002(empno, ename, sal) values(8888,'TOM',2800);
1 row created.
SQL> commit;
Commit complete.
```

### （4）重新查看 scott.emp002 表对应的 extent 信息

```java
SQL> select file_id, block_id, blocks, extent_id 
     from dba_extents where segment_name = 'EMP002';
   FILE_ID   BLOCK_ID	  BLOCKS  EXTENT_ID
---------- ---------- ---------- ----------
	 4	  168	       8	  0
```

## 二、自动创建 extent

（1）当用户创建表时（创建一张空表时是否分配 extent 与 deferred_segment_creation 参数有关），Oracle 为此表的数据段分配一个包含若干数据块的初始区（initial extent）。

（2）当一个段的初始区中的数据块已满，并且有新数据插入时，Oracle 自动为这个段分配一个增量区（incremental extent）。

### 1、为 scott.emp002 表插入数据

```java
SQL> insert into scott.emp002 select * from scott.emp;
14 rows created.
SQL> insert into scott.emp002 select * from scott.emp002;
15 rows created.
SQL> insert into scott.emp002 select * from scott.emp002;
30 rows created.
SQL> insert into scott.emp002 select * from scott.emp002;
60 rows created.
SQL> insert into scott.emp002 select * from scott.emp002;
120 rows created.
SQL> commit;
Commit complete.
```

### 2、查看 scott.emp002 表对应的 extent 信息

```java
SQL> select file_id, block_id, blocks, extent_id 
     from dba_extents where segment_name = 'EMP002';
   FILE_ID   BLOCK_ID	  BLOCKS  EXTENT_ID
---------- ---------- ---------- ----------
	 4	  168	       8	  0
--extent 没有增加
```

### 3、为 scott.emp002 表插入数据

```java
SQL> insert into scott.emp002 select * from scott.emp002;
240 rows created.
SQL> insert into scott.emp002 select * from scott.emp002;
480 rows created.
SQL> insert into scott.emp002 select * from scott.emp002;
960 rows created.
SQL> insert into scott.emp002 select * from scott.emp002;
1920 rows created.
SQL> commit;
Commit complete.
```

### 4、查看 scott.emp002 表对应的 extent 信息

```java
SQL> select file_id, block_id, blocks, extent_id 
     from dba_extents where segment_name = 'EMP002';
   FILE_ID   BLOCK_ID	  BLOCKS  EXTENT_ID
---------- ---------- ---------- ----------
	 4	  168	       8	  0
	 4	  176	       8	  1
	 4	  184	       8	  2
	 4	  192	       8	  3
-- extent 增加，并且，每个 extent 包含 8 个数据块
```

### 5、为 scott.emp002 表插入数据

```java
SQL> insert into scott.emp002 select * from scott.emp002;
3840 rows created.
SQL> insert into scott.emp002 select * from scott.emp002;
7680 rows created.
SQL> insert into scott.emp002 select * from scott.emp002;
15360 rows created.
SQL> insert into scott.emp002 select * from scott.emp002;
30720 rows created.
SQL> insert into scott.emp002 select * from scott.emp002;
61440 rows created.
SQL> commit;
Commit complete.
```

### 6、查看 scott.emp002 表对应的 extent 信息

```java
SQL> select file_id, block_id, blocks, extent_id 
     from dba_extents where segment_name = 'EMP002';
   FILE_ID   BLOCK_ID	  BLOCKS  EXTENT_ID
---------- ---------- ---------- ----------
	 4	  168	       8	  0
	 4	  176	       8	  1
	 4	  184	       8	  2
	 4	  192	       8	  3
	 4	  248	       8	  4
	 4	  256	       8	  5
	 4	  264	       8	  6
	 4	  272	       8	  7
	 4	  280	       8	  8
	 4	  288	       8	  9
	 4	  296	       8	 10
	 4	  304	       8	 11
	 4	  312	       8	 12
	 4	  320	       8	 13
	 4	  328	       8	 14
	 4	  336	       8	 15
	 4	  384	     128	 16
	 4	  512	     128	 17
	 4	  640	     128	 18
	 4	  768	     128	 19
	 4	  896	     128	 20
21 rows selected.
--extent 数量继续增加，但后来每个 extent 包含 128 个数据块
```

## 三、建表时手工指定 extent 大小

创建表时可以指定 storage 参数指定段的大小：

### 1、创建表 scott.emp666，初始大小 10m

```java
SQL> create table scott.emp666 storage(initial 10m) tablespace ts001 
     as select * from scott.emp;
Table created.
```

### 2、查看 scott.emp002 表对应的 extent 信息

```java
SQL> 
select file_id, block_id, blocks, extent_id 
  2       from dba_extents where segment_name = 'EMP666';
   FILE_ID   BLOCK_ID	  BLOCKS  EXTENT_ID
---------- ---------- ---------- ----------
	 6	  256	    1024	  0
	 6	 1280	     128	  1
	 6	 1408	     128	  2
```

## 四、手工扩展 extent

使用alter table 命令：

### 1、查看 scott.emp002 表对应的 extent 信息

```java
SQL> select file_id, block_id, blocks, extent_id 
     from dba_extents where segment_name = 'EMP002';
   FILE_ID   BLOCK_ID	  BLOCKS  EXTENT_ID
---------- ---------- ---------- ----------
	 4	  168	       8	  0
	 4	  176	       8	  1
	 4	  184	       8	  2
	 4	  192	       8	  3
	 4	  248	       8	  4
	 4	  256	       8	  5
	 4	  264	       8	  6
	 4	  272	       8	  7
	 4	  280	       8	  8
	 4	  288	       8	  9
	 4	  296	       8	 10
	 4	  304	       8	 11
	 4	  312	       8	 12
	 4	  320	       8	 13
	 4	  328	       8	 14
	 4	  336	       8	 15
	 4	  384	     128	 16
	 4	  512	     128	 17
	 4	  640	     128	 18
	 4	  768	     128	 19
	 4	  896	     128	 20
21 rows selected.
```

### 2、手工扩展表 emp002 的 extent

```java
SQL> alter table scott.emp002 
     allocate extent (size 2048k datafile '+DATA/orcl/datafile/users.259.1070471891');
Table altered.
```

### 3、查看 scott.emp002 表对应的 extent 信息

```java
SQL>  select file_id, block_id, blocks, extent_id 
      from dba_extents where segment_name = 'EMP002';
   FILE_ID   BLOCK_ID	  BLOCKS  EXTENT_ID
---------- ---------- ---------- ----------
	 4	  168	       8	  0
	 4	  176	       8	  1
	 4	  184	       8	  2
	 4	  192	       8	  3
	 4	  248	       8	  4
	 4	  256	       8	  5
	 4	  264	       8	  6
	 4	  272	       8	  7
	 4	  280	       8	  8
	 4	  288	       8	  9
	 4	  296	       8	 10
	 4	  304	       8	 11
	 4	  312	       8	 12
	 4	  320	       8	 13
	 4	  328	       8	 14
	 4	  336	       8	 15
	 4	  384	     128	 16
	 4	  512	     128	 17
	 4	  640	     128	 18
	 4	  768	     128	 19
	 4	  896	     128	 20
	 4	 1024	     128	 21
	 4	 1152	     128	 22
23 rows selected.
--扩展了两个 extent，每个 1m（128 * 8k）
```

## 五、手工回收 extent

手工回收 extent 只能回收完全没有使用的 extent。使用 alter table 命令：

```java
SQL> alter table scott.emp002 deallocate unused;
Table altered.
```

查看scott.emp002 表对应的 extent 信息：

```java
SQL> select file_id, block_id, blocks, extent_id 
     from dba_extents where segment_name = 'EMP002';
   FILE_ID   BLOCK_ID	  BLOCKS  EXTENT_ID
---------- ---------- ---------- ----------
	 4	  168	       8	  0
	 4	  176	       8	  1
	 4	  184	       8	  2
	 4	  192	       8	  3
	 4	  248	       8	  4
	 4	  256	       8	  5
	 4	  264	       8	  6
	 4	  272	       8	  7
	 4	  280	       8	  8
	 4	  288	       8	  9
	 4	  296	       8	 10
	 4	  304	       8	 11
	 4	  312	       8	 12
	 4	  320	       8	 13
	 4	  328	       8	 14
	 4	  336	       8	 15
	 4	  384	     128	 16
	 4	  512	     128	 17
	 4	  640	     128	 18
	 4	  768	     128	 19
	 4	  896	     128	 20
21 rows selected.
```

## 六、删除数据后回收 extent

### 注：删除数据后 extent 并不会自动回收！！

### 1、删除 scott.emp002 中的部分数据

```java
SQL> delete from scott.emp002 where rownum < 55000;
54999 rows deleted.
SQL> commit;
Commit complete.
SQL> select count(*) from scott.emp002;
  COUNT(*)
----------
     67881
SQL> delete from scott.emp002 where rownum < 55000;
54999 rows deleted.
SQL> commit;
Commit complete.
SQL> select count(*) from scott.emp002;
  COUNT(*)
----------
     12882
```

### 2、查看 scott.emp002 表对应的 extent 信息

```java
SQL> select file_id, block_id, blocks, extent_id 
     from dba_extents where segment_name = 'EMP002';
   FILE_ID   BLOCK_ID	  BLOCKS  EXTENT_ID
---------- ---------- ---------- ----------
	 4	  168	       8	  0
	 4	  176	       8	  1
	 4	  184	       8	  2
	 4	  192	       8	  3
	 4	  248	       8	  4
	 4	  256	       8	  5
	 4	  264	       8	  6
	 4	  272	       8	  7
	 4	  280	       8	  8
	 4	  288	       8	  9
	 4	  296	       8	 10
	 4	  304	       8	 11
	 4	  312	       8	 12
	 4	  320	       8	 13
	 4	  328	       8	 14
	 4	  336	       8	 15
	 4	  384	     128	 16
	 4	  512	     128	 17
	 4	  640	     128	 18
	 4	  768	     128	 19
	 4	  896	     128	 20
21 rows selected.
```

### 3、打开行移动

```java
--打开行移动
SQL> alter table scott.emp002 enable row movement;
Table altered.
```

### 4、收缩表空间

```java
SQL> alter table scott.emp002 shrink space;
Table altered.
```

### 5、查看 scott.emp002 表对应的 extent 信息

```java
SQL> select file_id, block_id, blocks, extent_id 
     from dba_extents where segment_name = 'EMP002';
   FILE_ID   BLOCK_ID	  BLOCKS  EXTENT_ID
---------- ---------- ---------- ----------
	 4	  168	       8	  0
	 4	  176	       8	  1
	 4	  184	       8	  2
	 4	  192	       8	  3
	 4	  248	       8	  4
	 4	  256	       8	  5
	 4	  264	       8	  6
	 4	  272	       8	  7
	 4	  280	       8	  8
	 4	  288	       8	  9
10 rows selected.
```

## 七、执行 truncate 和 drop 命令收缩 extent

### 1、执行 truncate 清空数据

```java
SQL> truncate table scott.emp002;
Table truncated.
```

### 2、查看 scott.emp002 表对应的 extent 信息

```java
SQL> select file_id, block_id, blocks, extent_id 
     from dba_extents where segment_name = 'EMP002';
   FILE_ID   BLOCK_ID	  BLOCKS  EXTENT_ID
---------- ---------- ---------- ----------
	 4	  168	       8	  0
```

### 3、执行 drop 命令删除表

```java
SQL> drop table scott.emp002;
Table dropped.
```

### 4、查看 scott.emp002 表对应的 extent 信息

```java
SQL> select file_id, block_id, blocks, extent_id 
     from dba_extents where segment_name = 'EMP002';
no rows selected
```

## 八、extent 空间分配算法

查看extent 空间分配算法：

```java
SQL> select tablespace_name, allocation_type from dba_tablespaces;
TABLESPACE_NAME 	       ALLOCATIO
------------------------------ ---------
SYSTEM			       SYSTEM
SYSAUX			       SYSTEM
UNDOTBS1		       SYSTEM
TEMP			       UNIFORM
USERS			       SYSTEM
UNDOTBS2		       SYSTEM
TS001			       SYSTEM
TEMP02			       UNIFORM
TEMP03			       UNIFORM
UNDOTBS11		       SYSTEM
UNDO_ARCHIVE		   SYSTEM
11 rows selected.
```

### 1、system：extent 呈阶梯增长

```java
SQL> select file_id, block_id, blocks, extent_id 
     from dba_extents where segment_name = 'EMP002';
   FILE_ID   BLOCK_ID	  BLOCKS  EXTENT_ID
---------- ---------- ---------- ----------
	 4	  168	       8	  0
	 4	  176	       8	  1
	 4	  184	       8	  2
	 4	  192	       8	  3
	 4	  248	       8	  4
	 4	  256	       8	  5
	 4	  264	       8	  6
	 4	  272	       8	  7
	 4	  280	       8	  8
	 4	  288	       8	  9
	 4	  296	       8	 10
	 4	  304	       8	 11
	 4	  312	       8	 12
	 4	  320	       8	 13
	 4	  328	       8	 14
	 4	  336	       8	 15
	 4	  384	     128	 16
	 4	  512	     128	 17
	 4	  640	     128	 18
	 4	  768	     128	 19
	 4	  896	     128	 20
21 rows selected.
```

### 2、uniform：每次分配的 extent 大小相同

（1）创建一个 uniform 类型的表空间

```java
SQL> create tablespace ts003 
     datafile '+DATA/orcl/datafile/ts003.dbf' size 50m uniform size 10m;
Tablespace created.
--uniform size 10m：表示 extent 每次扩充的大小都是 10m 
```

（2）在表空间 ts003 中创建表 scott.emp888

```java
SQL> create table scott.emp888 tablespace ts003
     as select * from scott.emp;
Table created.
```

（3）查看 scott.emp888 表对应的 extent 信息

```java
SQL> select file_id, block_id, blocks, extent_id 
     from dba_extents where segment_name = 'EMP888';
   FILE_ID   BLOCK_ID	  BLOCKS  EXTENT_ID
---------- ---------- ---------- ----------
	 9	  128	    1280	  0
```
