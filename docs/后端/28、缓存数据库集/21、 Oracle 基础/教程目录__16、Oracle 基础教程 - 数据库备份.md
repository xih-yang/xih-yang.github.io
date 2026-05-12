# 16、Oracle 基础教程 - 数据库备份
- 来源：https://ddkk.com/zhuanlan/db/oracle/3/16.html
- 分类：缓存数据库
- 分组：教程目录
## 1. 数据库备份的分类

### 1.1 逻辑备份与物理备份

数据库备份按照备份状态分为逻辑备份与物理备份。

**（1）逻辑备份**

利用SQL从数据库中抽取数据，并存为二进制文件的形式进行备份。业务数据库采用此种方式，不需要在归档模式下。如Oracle中，对数据库对象（用户、表、存储过程）利用EXPORT导出，利用IMPORT把逻辑备份文件导入数据库（Oracle exp/imp）。

> 优点：可以只备份某些表或某些特定的数据；可以在不同版本之间进行跨平台恢复；可以压缩后存储节省空间。

> 缺点：对于大规模的数据库，执行语句耗时较长；无法保证完全一致性（如同时有新数据插入）。

**（2）物理备份**

物理备份是指直接拷贝数据库存储介质上的所有内容，包括操作系统层面和数据库引擎层面，这样就能够完整地还原整个数据库。一般需要外部存储设备。

> 优点：速度快且可靠；能够提供一致性快照。

> 缺点：只能提供到“某一时间点”上的恢复，无法选择性地（按表或用户）进行备份和恢复，只能全库备份和恢复；不能用于跨平台迁移。

- 冷备份：发生在数据库已经正常关闭的情况下（脱机状态），所有的数据文件都处于离线状态。在实施备份过程中，数据库不能做其他工作，可以保证数据的完整性和一致性。
- 热备份：在数据库运行情况下（联机状态）进行，不会影响正常的业务操作，可在表空间或数据库文件级备份，并且对用户透明，能够保持业务连续性，备份时间短，可达到秒级恢复（恢复到某一时间点）。热备份要将日志置为归档模式，需要考虑到正在写入或修改的数据可能导致数据不一致性问题，采取特殊措施来确保数据完整性。

**（3）归档模式与非归档模式**

- **归档模式**：归档模式下，数据库将历史记录保存到一组称为“归档日志”的特殊文件中。这些日志包含先前已提交的事务的详细信息，使得可以恢复或还原丢失或损坏的数据。由于需要频繁地写入日志文件，性能会有所降低。
- **非归档模式**：非归档模式下，当一个事务被提交时，其结果直接写入主要数据文件中。而不像归档模式那样额外生成日志文件。这种方式虽然可以提高性能，并降低空间开销，但也存在数据丢失或损坏时无法完全恢复的风险。

### 1.2 完全备份/差异备份/增量备份

**（1）完全备份（Full）** ：备份全部选中文件，并不依赖文件的存档属性来确定备份哪些文件（每个文件都被标记为已备份，消除存档属性）。

**（2）差异备份（Differential）** ：备份上次完全备份后发生变化的所有文件（备份后不标记为已备份文件，不消除存档属性）。（备份时间长，占空间多，恢复快）。

**（3）增量备份（Incremental）** ：针对上次备份后（无论哪种备份）备份上次备份后所有发生变化的文件（备份后标记文件，消除存档属性）。（备份时间短，占空间少，恢复慢）。

组合示例：

- 完备+差备：周一进行完全备份，周二到周五进行差异备份。若周五数据被破坏，需还原周一的完全备份及周五的差异备份。
- 完备+增备：周一进行完全备份，周二到周五机型增量备份。若周五数据被破坏，需还原周一的完全备份及周二至周五的增量备份。

## 2. Oracle 逻辑备份

Oracle支持两种类型的逻辑备份：导出/导入实用程序与数据泵。

### 2.1 EXP/IMP

**（1）EXP导出**

- **完全模式**

```java
exp SYSTEM/MANAGER BUFFER=64000 file= C:\full.dmp full=Y
```

- **用户模式**

```java
exp detail12/detail12 owner=(detail12,detail11) file=/home/oracle/detail.dmp
```

```java
exp detail12/detail12@RACDB_192.168.1.13 file=d:/detail.dmp
```

其中，`RACDB_192.168.1.13`为Oracle Net Configuration Assistant的网络服务名。

- **表模式**

```java
exp detail12/detail12 owner=detail12 tables=(T_JBXX) file=/home/oracle/t_jbxx.dmp
```

如果T_JBXX为分区表，使用`tables=(T_JBXX1:P1，T_JBXX2:P2`)的形式。

query字段格式：

```java
query="""where dept_date<to_date('2014-02-01 00:00:10','yyyy-mm-dd hh24:mi:ss')"""
```

**注意**：不导入权限和索引可加入 `GRANTS=Y INDEXES=Y`

**关键字说明**

关键字
说明 (默认值)

USERID
用户名/口令

FULL
导出整个文件 (N)

BUFFER
数据缓冲区大小

OWNER
所有者用户名列表

FILE
输出文件 (EXPDAT.DMP)

TABLES
表名列表

COMPRESS
导入到一个区 (Y)

RECORDLENGTH
IO 记录的长度

GRANTS
导出权限 (Y)

INCTYPE
增量导出类型

INDEXES
导出索引 (Y)

RECORD
跟踪增量导出 (Y)

DIRECT
直接路径 (N)

TRIGGERS
导出触发器 (Y)

LOG
屏幕输出的日志文件

STATISTICS
分析对象 (ESTIMATE)

ROWS
导出数据行 (Y)

PARFILE
参数文件名

CONSISTENT
交叉表的一致性 (N)

CONSTRAINTS
导出的约束条件 (Y)

OBJECT_CONSISTENT
只在对象导出期间设置为只读的事务处理 (N)

FEEDBACK
每 x 行显示进度 (0)

FILESIZE
每个转储文件的最大大小

FLASHBACK_SCN
用于将会话快照设置回以前状态的 SCN

FLASHBACK_TIME
用于获取最接近指定时间的 SCN 的时间

QUERY
用于导出表的子集的 select 子句

RESUMABLE
遇到与空格相关的错误时挂起 (N)

RESUMABLE_NAME
用于标识可恢复语句的文本字符串

RESUMABLE_TIMEOUT
RESUMABLE 的等待时间

TTS_FULL_CHECK
对 TTS 执行完整或部分相关性检查

TABLESPACES
要导出的表空间列表

TRANSPORT_TABLESPACE
导出可传输的表空间元数据 (N)

TEMPLATE
调用 iAS 模式导出的模板名

**（2）IMP导入**

- **完全模式**

```java
imp SYSTEM/MANAGER BUFFER=64000 file=C:\full.dmp full=Y
```

- **用户模式**

```java
imp detail12/detail12 fromuser=(detail12，detail11) touser=(detail12，detail11) file=/home/oracle/detail.dmp
```

- **表模式**

```java
imp detail12/detail12 owner=detail12 tables=(T_JBXX) file=/home/oracle/t_jbxx.dmp
```

**注意**

IMP导入必须指定Full=Y，或提供fromuser/touser参数，或提供tables参数。

导入前需按要求设置字符集export NLS_LANG=AMERICAN_AMERICA.ZHS16GBK

忽略创建表错误可加入IGNORE=Y，不导入权限和索引可加入 GRANTS=Y INDEXES=Y

导入时发生IMP-00032错误，表示SQL语句超过缓冲区长度，可以加入选项：buffer=100000000

**关键字说明**

关键字
说明 (默认值)

USERID
用户名/口令

FULL
导入整个文件 (N)

BUFFER
数据缓冲区大小

FROMUSER
所有者用户名列表

FILE
输入文件 (EXPDAT.DMP)

TOUSER
用户名列表

SHOW
只列出文件内容 (N)

TABLES
表名列表

IGNORE
忽略创建错误 (N)

RECORDLENGTH
IO 记录的长度

GRANTS
导入权限 (Y)

INCTYPE
增量导入类型

INDEXES
导入索引 (Y)

COMMIT
提交数组插入 (N)

ROWS
导入数据行 (Y)

PARFILE
参数文件名

LOG
屏幕输出的日志文件

CONSTRAINTS
导入限制 (Y)

DESTROY
覆盖表空间数据文件 (N)

INDEXFILE
将表/索引信息写入指定的文件

SKIP_UNUSABLE_INDEXES
跳过不可用索引的维护 (N)

FEEDBACK
每 x 行显示进度 (0)

TOID_NOVALIDATE
跳过指定类型 ID 的验证

FILESIZE
每个转储文件的最大大小

STATISTICS
始终导入预计算的统计信息

RESUMABLE
在遇到有关空间的错误时挂起 (N)

RESUMABLE_NAME
用来标识可恢复语句的文本字符串

RESUMABLE_TIMEOUT
RESUMABLE 的等待时间

COMPILE
编译过程， 程序包和函数 (Y)

STREAMS_CONFIGURATION
导入流的一般元数据 (Y)

STREAMS_INSTANTIATION
导入流实例化元数据 (N)

### 2.2 EXPDP/IMPDP

**（1）数据泵介绍**

Oracle Database 10g引入了最新的数据泵(Data Dump)技术，使DBA或开发人员可以将数据库元数据(对象定义)和数据快速移动到另一个oracle数据库中，与Export / Import相比，它提供更好的性能、安全性和灵活性。

**并行处理**： Oracle 数据泵支持并行处理（通过指定 PARALLEL 参数启用），这使得导入和导出任务更加快速和高效。

**可定制**： 数据泵允许用户选择要包含或排除的对象类型（如表、视图、约束等），以及要包含或排除的特定对象。

**压缩**： Oracle 数据泵支持压缩功能，可减少导出文件的大小，并提高传输速度。

**安全性**： 数据泵支持 SSL 加密协议来保护敏感信息，在安全方面非常有优势。

**多平台兼容性**： Oracle 数据泵支持多个平台上运行，例如 Windows 和 Linux 等操作系统。

**（2）数据泵的使用**

**EXP和IMP是客户段工具程序，它们既可以在可以客户端使用，也可以在服务端使用。 EXPDP和IMPDP是服务端的工具程序，他们只能在ORACLE服务端使用，不能在客户端使用**。

使用EXPDP工具时，其转储文件只能被存放在DIRECTORY对象对应的OS目录中,而不能直接指定转储文件所在的OS目录。因此，**使用EXPDP工具时，必须首先建立DIRECTORY对象，并且需要为数据库用户授予使用DIRECTORY对象权限**。

使用Data Pump，可将整个数据库或特定模式及其对象（如表格、索引、约束和其数据）导出/导入，还可指定选项，例如表空间、压缩级别、加密和远程导出/导入的网络链接。

Data Pump包括两个客户端实用程序：expdp（Export Data Pump）和impdp（Import Data Pump）。

**e.g.**

```java
create directory imp_dir as 'D:\imp_dir';
GRANT READ, WIRTE ON DIRECTORY imp_dir TO detail;
```

```java
expdp scott/tiger DUMPFILE=tmp_dump.dmp  DIRECTORY= imp_dir
```

```java
impdp scott/tiger DUMPFILE=tmp_dump.dmp  DIRECTORY= imp_dir
```
