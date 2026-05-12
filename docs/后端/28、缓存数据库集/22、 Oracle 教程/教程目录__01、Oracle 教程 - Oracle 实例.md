# 01、Oracle 教程 - Oracle 实例
- 来源：https://ddkk.com/zhuanlan/db/oracle/1/1.html
- 分类：缓存数据库
- 分组：教程目录
Oracle Server（Oracle 服务器）： 由两部分组成：实例（Instance）+ 数据库（DataBase）。

实例（Instance）：是数据库启动时初始化的一组进程和内存结构。一个实例只能对应一个数据库，但一个数据库可以对应多个实例（比如 Oracle Rac 集群环境就是多个实例操作同一个）。

数据库（DataBase）：Oracle 数据库是数据的物理存储。包括三类文件：数据文件，控制文件，重做日志文件。

从实例和数据库的概念来看，实例暂时存在的，是一组逻辑划分的内存结构和进程结构，会随着数据库的关闭而消失。而数据库是一系列的物理文件（控制文件，数据文件，日志文件等等），是永久存在的。

用户要访问数据库，必须连接到实例，通过实例来访问数据库。

Oracle Server 的结构如下图所示：

## 一、Oracle 实例的内存结构

从上图可以看出，Oracle 实例的内存由两部分组成：SGA（系统全局区）和 PGA（用户全局区）。

SGA是一块共享的内存区域。当数据库实例启动时，SGA 的内存被自动分配；当数据库实例关闭时，SGA 内存被回收。 SGA 是占用内存最大的一个区域，同时也是影响数据库性能的重要因素。

PGA是用户会话专有的内存区域，每个会话在服务器端都有一块专有的内存区域，就是 PGA。

SGA主要由以下几部分构成：

### 1、DataBase Buffer Cache（数据库缓冲区高速缓存）

DataBase Buffer Cache 是 SGA 中的一个高速缓存区域，它用来存储从数据文件中读取到的数据块的镜像。是 Oracle 用来执行 SQL 的工作区域，当用户更新数据时，用户会话先会扫描缓冲区，不会去直接在磁盘上操作，这样会减少磁盘的IO，从而大幅度提升系统的性能。

DataBase Buffer Cache 的大小由 DB_CACHE_SIZE 参数设定，数据块的大小由 DB_BLOCK_SIZE 参数确定。Oracle 使用最近最少使用（LRU，Least Recently Used）算法来管理可用空间。当存储区需要自由空间时，最近最少使用块将被移出，新数据块将在存储区代替它的位置。通过这种方法，将最频繁使用的数据保存在存储区中。

查看DataBase Buffer Cache 的大小以及数据块的大小：

```java
SQL> show parameter db_block_size
NAME				     TY1PE	 VALUE
------------------------------------ ----------- ------------------------------
db_block_size			     integer	 8192
SQL> show parameter DB_CACHE_SIZE
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
db_cache_size			     big integer 0
```

举例说明 DataBase Buffer Cache 的工作原理：

```java
select ename,salary from scott.emp where empno = 7839;
```

以上SQL 语句的执行过程如下：由对应的用户进程发送给服务器，监听收到请求后，创建一个相对应的服务器进程。该服务器进程会先扫描缓冲区是否存在 empno = 7839 的数据块，如果存在，把相关信息传到 PGA 中处理，最后显示给用户；如果没有命中，该进程便会将磁盘上对应的数据块复制到缓冲区中，再执行剩余的操作。

DML（insert，update，delete）操作同理，如果用户发送一条 update 语句，服务器进程依然先去扫描缓冲区，如果缓存命中，则直接更新，数据变脏；如果没有命中，由服务器进程将对应数据块先从磁盘上复制到缓冲区内，再进行更新操作。

脏缓冲区：如果缓冲区存储的块和磁盘上的块不一致，该缓冲区就叫做脏缓冲区，脏缓冲区最终会由数据库写入器（DBWn 进程）写入到磁盘中。

### 2、Redo Log Buffer（重做日志缓冲区）

当执行DML 操作时，日志文件用于记录对数据库的更改，为了减少磁盘 IO，减少用户等待时间，数据库的修改操作信息要先写到日志缓冲区中，当日志缓冲区达到一定的限度时，会被日志写入进程 LGWR 写入磁盘中。其大小由 LOG_BUFFER 参数指定。

查看Redo Log Buffer 的大小：

```java
SQL> show parameter LOG_BUFFER
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
log_buffer			     integer	 2199552
```

### 3、Shared Pool（共享池）

共享池是最复杂的 SGA 结构，它包含许多子结构：

### （1）Library Cache（库高速缓存）

Oracle 引入库缓存的目的是共享 SQL 代码。服务器进程执行 SQL 命令时，首先进入库缓存查找是否有相同的 SQL，如果有，就不再进行后续的编译处理，直接使用已经编译的 SQL 和执行计划。

Oracle 通过比较两条 SQL 语句的正文来确定两条 SQL 语句是否相同，如果要共享 SQL 语句，必须使用绑定变量的方式。例如：

```java
select * from scott.emp where sal > 1000;
select * from scott.emp where sal > 1500;
-- 以上两条 SQL 语句是不同的
select * from scott.emp where sal > &v_sal;
-- 当使用绑定变量时，绑定变量 v_sal 的取值不同时，Oracle 认为 SQL 命令是相同的。
```

Oracle 使用 LRU 队列和算法来管理库缓存，最近使用过的 SQL 命令会放在队首，长时间没有使用的 SQL 命令放在队尾，当库缓存需要内存空间而又没有空闲的内存空间时，队尾内存中的 SQL 命令会被清除，放入最新的 SQL命令。

### （2）Data Dictionary Cache（数据字典高速缓存）

数据库对象的信息存储在数据字典表中，这些信息包括用户帐号数据、权限、数据文件名、段名、表结构及表说明等，当需要这些信息时，将读取数据字典表并且将返回的数据存储在数据字典缓存区中。数据字典缓存区通过 LRU 算法来管理。

## 二、Oracle 实例的后台进程

数据库的物理结构与内存结构之间的交互要通过后台进程来完成。后台进程与 SGA 各部分之间的关系如下图所示：

Oracle 的后台进程如下：

```java
[root@rac2 ~]# ps -ef|grep ora_
oracle     2186      1  0 Jul29 ?        00:00:08 ora_pmon_orcl2
oracle     2188      1  0 Jul29 ?        00:00:08 ora_psp0_orcl2
oracle     2190      1  0 Jul29 ?        00:10:28 ora_vktm_orcl2
oracle     2194      1  0 Jul29 ?        00:00:01 ora_gen0_orcl2
oracle     2196      1  0 Jul29 ?        00:00:45 ora_diag_orcl2
oracle     2198      1  0 Jul29 ?        00:00:02 ora_dbrm_orcl2
oracle     2200      1  0 Jul29 ?        00:00:11 ora_ping_orcl2
oracle     2202      1  0 Jul29 ?        00:00:01 ora_acms_orcl2
oracle     2204      1  0 Jul29 ?        00:01:55 ora_dia0_orcl2
oracle     2206      1  0 Jul29 ?        00:01:57 ora_lmon_orcl2
oracle     2208      1  0 Jul29 ?        00:01:32 ora_lmd0_orcl2
oracle     2210      1  0 Jul29 ?        00:03:23 ora_lms0_orcl2
oracle     2214      1  0 Jul29 ?        00:00:01 ora_rms0_orcl2
oracle     2216      1  0 Jul29 ?        00:00:03 ora_lmhb_orcl2
oracle     2218      1  0 Jul29 ?        00:00:01 ora_mman_orcl2
oracle     2220      1  0 Jul29 ?        00:00:05 ora_dbw0_orcl2
oracle     2222      1  0 Jul29 ?        00:00:04 ora_lgwr_orcl2
oracle     2224      1  0 Jul29 ?        00:00:19 ora_ckpt_orcl2
oracle     2226      1  0 Jul29 ?        00:00:19 ora_smon_orcl2
oracle     2228      1  0 Jul29 ?        00:00:01 ora_reco_orcl2
oracle     2230      1  0 Jul29 ?        00:00:01 ora_rbal_orcl2
oracle     2232      1  0 Jul29 ?        00:00:00 ora_asmb_orcl2
oracle     2234      1  0 Jul29 ?        00:00:28 ora_mmon_orcl2
oracle     2238      1  0 Jul29 ?        00:00:18 ora_mmnl_orcl2
oracle     2240      1  0 Jul29 ?        00:00:00 ora_d000_orcl2
oracle     2242      1  0 Jul29 ?        00:00:02 ora_mark_orcl2
oracle     2244      1  0 Jul29 ?        00:00:00 ora_s000_orcl2
oracle     2250      1  0 Jul29 ?        00:00:32 ora_lck0_orcl2
oracle     2252      1  0 Jul29 ?        00:00:03 ora_rsmn_orcl2
oracle     2287      1  0 Jul29 ?        00:00:00 ora_gtx0_orcl2
oracle     2289      1  0 Jul29 ?        00:00:03 ora_rcbg_orcl2
oracle     2295      1  0 Jul29 ?        00:00:02 ora_qmnc_orcl2
oracle     2324      1  0 Jul29 ?        00:00:58 ora_cjq0_orcl2
oracle     2326      1  0 Jul29 ?        00:00:00 ora_q000_orcl2
oracle     2471      1  0 Jul29 ?        00:00:01 ora_smco_orcl2
oracle     4011      1  0 Jul29 ?        00:01:15 ora_o000_orcl2
oracle     4465      1  0 Jul29 ?        00:00:01 ora_q003_orcl2
oracle    55602      1  0 04:37 ?        00:00:00 ora_w000_orcl2
oracle    57373      1  0 05:41 ?        00:00:00 ora_pz99_orcl2
root      57529   1482  0 05:47 pts/0    00:00:00 grep ora_
```

### 1、PMON （Process Monitor）——进程监控进程

PMON 进程用于在用户进程出现故障时进行恢复，清除失效的用户进程，负责清理内存区域和释放该进程所使用的资源，如果会话不正常终止时，PMON 负责 Rollback 未提交的事务，释放资源；同时监控 Oracle 所有后台进程。

PMON 还周期性地检查调度进程和服务器进程的状态，如果已死，则重新启动（不包括有意删除的进程）。

### 2、SMON （System Monitor）——系统监控进程

当实例异常终止时，SMON 进程在实例启动时执行实例恢复，在实例恢复过程中，如果由于文件读取错误或所需文件处于脱机状态而导致某些异常终止的事务未被恢复，SMON 将在表空间或文件恢复联机状态后再次恢复这些事务。

SMON 还负责清理不再使用的临时段以及为数据字典管理的表空间合并相邻的可用数据扩展。

### 3、DBWn（database writer）——数据库写入进程

DBWn进程是负责 DataBase Buffer Cache（数据库缓冲区高速缓存）管理的一个 Oracle 后台进程，通过使用 LRU 算法来管理，保持内存中的数据块是最近使用的，使 I/O 最小，将脏数据写入到数据文件中。

DBWn 进程用于将数据库缓冲区的数据写入数据文件，是负责数据库缓冲区管理的一个后台进程，默认数量 1 个，最多可以有 10 个，由参数为 db_writer_processes 设置。

```java
SQL> show parameter db_writer_processes
NAME				     TYPE	 VALUE
------------------------------------ ----------- ------------------------------
db_writer_processes		     integer	 1
```

DBWn是个比较懒的进程，它会尽可能少的进行写入。DBWn进程在以下情况触发：

（1）没有空闲缓冲区

（2）达到脏缓冲区阀值

（3）产生检查点

（4）表空间 offline

（5）超时，每 3 秒

（6）drop / truncate 表

从上述DBWn 的触发时机，我们可以看到，DBWn 的写入不是直接依赖于会话的更新操作的。不是一有脏缓冲区就执行写入。DBWn 执行写入跟 commit 操作没有任何关系。

### 4、LGWR（Log Writer）——日志写入进程

该进程将日志缓冲区写入磁盘上的一个日志文件，它是负责管理 Redo Log Buffer（重做日志缓冲区）的一个 Oracle 后台进程。

当事务提交时，被赋给一个系统修改号（SCN），它同事务日志项一起记录在日志中。LGWR 进程管理日志缓冲区，将数据库的更改写入日志文件，以便维护数据的一致性，并为数据丢失后进行恢复提供依据。Oracle 通过延迟写日志来优化 IO 操作，Oracle 会在以下 4 种情况触发 LGWR 进程写日志：

（1）在事务提交（COMMIT）时。

（2）每 3 秒钟，该进程最多休眠 3 秒钟。

（3）Redo log Buffer 占用达三分之一时。

（4）DBWn 进程将数据库缓冲区写入数据文件之前；

### 5、CKPT 进程

CKPT 进程负责通知 DBWn 和 LGWR 将脏数据写入磁盘，以及时消除因 DBWn 与 LGWR 延迟写所造成的数据不一致情况，确保内存中的数据块被规律地写入文件，并对数据库控制文件和数据文件进行更新同步（修改文件时间头部），以记录下当前的数据库结构和状态。

由于Oracle 中 LGWR 和 DBWn 工作的不一致，Oracle 引入了检查点的概念，用于同步数据库，保证数据库的一致性。

检查点可强制 DBWn 写入脏缓冲区，当数据库崩溃后，由于大量脏缓冲区未写入数据文件，在重新启动时，需要由 SMON 进行实例恢复，实例恢复需要提取和应用重做日志记录，提取的位置就是从上次检查点发起的位置开始的，这个位置称为RBA（redo byte address），CKPT 会不断将这个位置更新到控制文件中去，以确定实例恢复需要从哪儿开始提取日志记录。

### 6、RECO（Recovery）——恢复进程

RECO 进程是在具有分布式选项时所使用的一个进程，自动地解决在分布式事务中的故障，维持在分布式环境中的数据的一致性。

### 7、ARCH（Archiver）——归档进程

ARCH 进程用于管理归档日志文件，这个进程是可选的，当数据库运行在 archivelog 模式下时，这个进程就是必须的。所谓归档，就是将重做日志文件永久保存到归档日志文件中。归档日志文件和重做日志文件作用是一样的，只不过重做日志文件会不段被重写，而归档日志文件则保留了关于数据更改的完整的历史记录。

### 8、LCKn（lock）——锁进程

LCKn 进程是在并行服务器环境下使用，用于实例间的封锁，最多可以有 10 个进程（LCK0，LCK1……，LCK9）。
