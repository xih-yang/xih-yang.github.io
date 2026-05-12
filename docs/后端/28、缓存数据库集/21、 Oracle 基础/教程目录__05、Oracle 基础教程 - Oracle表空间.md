# 05、Oracle 基础教程 - Oracle表空间
- 来源：https://ddkk.com/zhuanlan/db/oracle/3/5.html
- 分类：缓存数据库
- 分组：教程目录
## 1. 基本概念

Oracle数据库开创性地提出了 **表空间**（tablespaces）的设计理念，Oracle中很多优化都是基于表空间实现的。

Oracle表空间是一个逻辑的概念，由**数据文件（data files）**作为承载。**一个Oracle数据库可以有一个或多个表空间，而一个表空间则对应着一个或多个物理的数据库文件**。

表空间是ORACLE数据库恢复的最小单位，容纳着许多数据库对象，如表、视图、索引、聚簇、回退段和临时段等。

表空间分为：**系统表空间**、**UNDO表空间**、**临时表空间**、**用户表空间**。

默认的表空间有**SYSAUX**，**SYSTEM**，**UNDOTBS1**，**TEMP**，**USERS**，对应数据文件在`$ORACLE_HOME\oradata\orcl`下，分别为`SYSTEM01.DBF`，`SYSAUX01.DBF`，`UNDOTBS01.DBF` ， `TEMP01.DBF`，`USERS01.DBF`。

表空间相关的视图包括：

**DBA_TABLESPACES**（**USER_TABLESPACES**）、**DBA_DATA_FILES**

## 2. 表空间的创建与管理

**（1）表空间的创建**

```java
CREATE TABLESPACE tbs01 Datafile 'D:\oracle\product\10.2.0\oradata\orcl\tbs01.dbf' SIZE 100M;
```

可加入`Autoextend On Next 100M Maxsize Unlimited`，否则会由于空间不足报ORA-01659错误（表示无法分配超出的MINEXTENTS）。

表空间默认区大小为64KB，可通过`UNIFORM SIZE 128k`来指定区大小为128k；或使用`AUTOALLOCATE`，区的大小由数据库根据情况指定。此时需要加入E`XTENT MANAGEMENT LOCAL`，表示表空间的区管理方式为本地管理（否则为字典管理）。

Oracle的Data block address共32bit，其中10bit记录file_id，22bit(ROWID)记录block_id，在一个数据文件中最多能够记录 2 22 − 1 ( 4194303 ) 2^{22}-1(4194303) 222−1(4194303)个block，由于db_block_size = 8k，所以**一个数据文件的最大值为8k* 2 22 2^{22} 222=31.9999924G**。（DBA_DATA_FILES视图中的MAXBLOCKS为4194302，MAXBYTES为34359721984，单位为字节BYTE）

**Oracle大文件表空间**

Oracle大文件表空间只包含一个数据文件，这个数据文件可包含4GB个数据块，一个数据文件大小可达32TB(8KB*4GB)。区（Extent）管理方式为本地管理（LOCAL），段（SEGMENT）管理方式为自动管理（AUTO）。

建立大表空间语句如下：

```java
Create Bigfile Tablespace btbs1 Datafile 
'D:\ORACLE\PRODUCT\10.2.0\ORADATA\ORCL\ BTBS01. DBF' Size 200M;
```

**（2）修改表空间数据文件大小**

```java
Alter  Database  Datafile 'D:\oracle\product\10.2.0\oradata\orcl\tbs01.dbf' Resize 200M;
```

**（3）表空间不足时，增加数据文件（可增加1个或多个）**

```java
ALTER TABLESPACE tbs01 add Datafile 
'D:\ORACLE\PRODUCT\10.2.0\ORADATA\ORCL\TBS01-1.DBF' Size 50M,
D:\ORACLE\PRODUCT\10.2.0\ORADATA\ORCL\TBS01-2.DBF' Size 50M;
```

**（4）重命名表空间数据文件**

```java
Alter Tablespace tbs01 Rename Datafile 'D:\ORACLE\PRODUCT\10.2.0\ORADATA\ORCL\TBS01.DBF'
To 'D:\ORACLE\PRODUCT\10.2.0\ORADATA\ORCL\TBS01-0.DBF'
```

修改控制文件和数据字典中数据文件的位置和名称信息，在执行之前需要保证数据文件在操作系统中已经被正确重命名。

**（5）删除表空间**

```java
DROP TABLESPACE tbs01 INCLUDING CONTENTS AND DATAFILES;
```
