# 02、分布式事务 实战 - MySQL 事务的实现原理
- 来源：https://ddkk.com/zhuanlan/transaction/2/2.html
- 分类：分布式事务
- 分组：教程目录
## 一、Redo Log

MySQL 中事务的原子性和持久性是由 Redo Log 实现的，它确保 MySQL 事务提交后，事务所涉及的所有操作要么全部执行成功，要么全部执行失败

### 1.Redo Log 基本概念

Redo Log 也被称作重做日志，它是在 InnoDB 存储引擎中产生的，用来保证事务的原子性和持久性。Redo Log 主要记录的是物理日志，也就是对磁盘上的数据进行的修改操作。Redo Log 往往用来恢复提交后的物理数据页，不过只能恢复到最后一次提交的位置

Redo Log 通常包含两部分：一部分是内存中的日志缓冲，称作 Redo Log Buffer，这部分日志比较容易丢失，另一部分是存放在磁盘上的重做日志文件，称作 Redo Log File，这部分日志是持久化到磁盘上的，不容易丢失

### 2.Redo Log 基本原理

Redo Log 能够保证事务的原子性和持久性，在 MySQL 发生故障时，尽力避免内存中的脏页数据写入数据表的 IBD 文件。在重启 MySQL 服务时，可以根据 Redo Log 恢复事务已经提交但是还未写入 IBD 文件中的数据，从而对事务提交的数据进行持久化操作

例如，在商城系统的下单业务中，用户提交订单时，系统会创建一条新的订单记录并保存到订单数据表中。在 MySQL 内部，Redo Log 的基本原理可以用下图表示：

从上图可以看出，用户下单后系统创建订单记录，MySQL 在提交事务时，会将数据写入 Redo Log Buffer，而 Redo Log Buffer 中的数据会根据一定的规则写入 Redo Log 文件

当MySQL 发生故障重启时，会通过 Redo Log 中的数据对订单表中的数据进行恢复，也就是 Redo Log 文件中的数据恢复到 order.ibd 文件中

系统可以根据需要，查询并加载订单表中的数据（也就是加载 order.ibd 文件中的数据），也可以向订单表写入数据（也就是持久化数据到 order.ibd 文件中）

### 3.Redo Log 刷盘规则

在MySQL 的 InnoDB 存储引擎中，通过提交事务时强制执行写日志操作机制实现事务的持久化。InnoDB 存储引擎为了保证在事务提交时，将日志提交到事务日志文件中，默认每次将 Redo Log Buffer 中的日志写入日志文件时，都调用以此操作系统的 fsync() 操作。因为 MySQL 进程和其占用的内存空间都工作在操作系统的用户空间中，所以 MySQL 的 Log Buffer 也工作在操作系统的用户空间中。默认情况下，如果想要将 Log Buffer 中的数据持久化到磁盘的日志文件中， 还需要经过操作系统的内核空间缓冲区，也就是 OS Buffer。从 Redo Log Buffer 中将数据持久化到磁盘的日志文件中的大致流程如下图所示：

从上图可以看出，Redo Log 从用户空间的 Log Buffer 写入磁盘的 Redo Log 文件时需要经过内核空间的 OS Buffer。这是因为在打开日志文件时，没有使用 O_DIRECT 标志位，而 O_DIRECT 标志位可以不经过操作系统内核空间的 OS Buffer，直接向磁盘写数据

在InnoDB 存储引擎中，Redo Log 具有以下几种刷盘规则：

**1、** 开启事务，发出提交事务指令后是否刷新日志由变量innodb_flush_log_at_trx_commit决定；

**2、** 每秒刷新一次，刷新日志的频率由变量innodb_flush_log_at_timeout的值决定，默认是1s需要注意的是，刷新日志的频率和是否执行了commit操作无关；

**3、** 当LogBuffer中已经使用的内存超过一半时，也会触发刷盘操作；

**4、** 当事务中存在checkpoint（检查点）时，在一定程度上代表了刷写到磁盘时日志所处的LSN的位置其中，LSN（LogSequenceNumber）表示日志的逻辑序列号；

接下来，对第 1 条规则进行简单介绍

当事务提交时，需要先将事务日志写入 Log Buffer，这些写入 Log Buffer 的日志并不是随着事务的提交立刻写入磁盘的，而是根据一定的规则将 Log Buffer 中的数据刷写到磁盘，从而保证了 Redo Log 文件中数据的持久性。这种刷盘规则可以通过 innodb_flush_log_at_trx_commit 变量控制，innodb_flush_log_at_trx_commit 变量可取的值有 0、1 和 2，默认为 1.每个取值代表的刷盘规则下图所示：

- 如果该变量设置为 0，则每次提交事务时，不会将 Log Buffer 中的日志写入 OS Buffer，而是通过一个单独的线程，每秒写入 OS Buffer 并调用 fsync() 函数写入磁盘的 Redo Log 文件。这种方式不是实时写磁盘的，而是每隔 1s 写一次日志，如果系统崩溃，可能会丢失 1s 的数据
- 如果该变量设置为 1，则每次提交事务都会将 Log Buffer 中的日志写入 OS Buffer，并且会调用 fsync() 函数将日志数据写入磁盘的 Redo Log 文件中。这种方式虽然在系统崩溃时不会丢失数据，但是性能比较差。如果没有设置 innodb_flush_log_at_trx_commit 变量的值，则默认为 1
- 如果该变量设置为 2，则每次提交事务时，都只是将数据写入 OS Buffer，之后再每隔 1s，通过 fsync() 函数将 OS Buffer 中的日志数据同步写入磁盘的 Redo Log 文件中

需要注意的是，在 MySQL 中，有一个变量 innodb_flush_log_at_timeout 的值为 1，这个变量表示刷新日志的频率。另外，在 InnoDB 存储引擎中，刷新数据页到磁盘和刷新 Undo Log 页到磁盘就只有一种检查点规则

### 4.Redo Log 写入机制

Redo Log 主要记录的是物理日志，其文件内容是以顺序循环的方式写入的，一个文件写满时会写入另一个文件，最后一个文件写满时，会向第一个文件写数据，并且是覆盖写，如下图所示：

由上图可以看出：

**1、** WritePos是数据表中当前记录所在的位置，随着不断地向数据表中写数据，这个位置会向后移动，当移动到最后一个文件的最后一个位置时，又会回到第一个文件的开始位置进行写操作；

**2、** CheckPoint是当前要擦除的位置，这个位置也是向后移动的，移动到最后一个文件的最后一个位置时，也会回到第一个文件的最开始位置进行擦除只不过在擦除记录之前，需要把记录更新到数据文件中；

**3、** WritePos和CheckPoint之间存在间隔时，中间的间隔表示还可以记录新的操作如果WritePos移动的速度较快，追上了CheckPoint，则表示数据已经写满，不能再向RedoLog文件中写数据了此时，需要停止写入数据，擦除一些记录；

### 5.Redo Log 的 LSN 机制

LSN（Log Sequence Number）表示日志的逻辑序列号。在 InnoDB 存储引擎中，LSN 占用 8 字节的存储空间，并且 LSN 的值是单调递增的。一般可以从 LSN 中获取如下信息：

**1、** RedoLog写入数据的总量；

**2、** 检查点位置；

**3、** 数据页版本相关的信息；

LSN除了存在于 Redo Log 中外，还存在于数据页中。在每个数据页的头部，有一个 fil_page_lsn 参数记录着当前页最终的 LSN 值。将数据页中的 LSN 值和 Redo Log 中的 LSN 值进行比较，如果数据页中的 LSN 值小于 Redo Log 中的 LSN 值，则表示丢失了一部分数据，此时，可以通过 Redo Log 的记录来恢复数据，否则不需要恢复数据

在MySQL 的命令行通过如下命令可以查看 LSN 值：

```java
mysql> show engine innodb status \G
#########省略部分日志#############
Log sequence number          3072213599
Log buffer assigned up to    3072213599
Log buffer completed up to   3072213599
Log written up to            3072213599
Log flushed up to            3072213599
Added dirty pages up to      3072213599
Pages flushed up to          3072213599
Last checkpoint at           3072213599
1620 log i/o's done, 0.00 log i/o's/second
#########省略部分日志#############
```

重要的参数说明如下所示：

**1、** Logsequencenumber：表示当前内存缓冲区中的RedoLog的LSN；

**2、** Logflushedupto：表示刷新到磁盘上的RedoLog文件中的LSN；

**3、** Pagesflushedupto：表示已经刷新到磁盘数据页上的LSN；

**4、** Lastcheckpointat：表示上一次检查点所在位置的LSN；

### 6.Redo Log 相关参数

在MySQL 中，输入如下命令可以查看与 Redo Log 相关的参数

```java
show variables like '%innodb_log%';
```

可以查询到与 Redo Log 有关的几个重要参数如下所示：

**1、** innodb_log_buffer_size：表示logbuffer的大小，默认为8MB；

**2、** innodb_log_file_size：表示事务日志的大小，默认为5MB；

**3、** innodb_log_files_group=2：表示事务日志组中的事务日志文件个数，默认为2个；

**4、** innodb_log_group_home_dir=./：表示事务日志组所在的目录，当前目录表示MySQL数据所在的目录；

## 二、Undo Log

Undo Log 在 MySQL 事务的实现中也起着至关重要的作用，MySQL 中事务的一致性是由 Undo Log 实现的

### 1.Undo Log 基本概念

Undo Log 在 MySQL 事务的实现中主要起到两方面的作用：回滚事务和多版本并发事务，也就是常说的 MVCC 机制

在MySQL 启动事务之前， 会将要修改的数据记录存储到 Undo Log 中。如果数据库的事务回滚或者 MySQL 数据库崩溃，可以利用 Undo Log 对数据库中未提交的事务进行回滚操作，从而保证数据库中数据的一致性

Undo Log 会在事务开始前产生， 当事务提交时，不并不会立刻删除相应的 Undo Log。此时，InnoDB 存储引擎会将当前事务对应的 Undo Log 放入待删除的列表，接下来，通过一个后台线程 purge thread 进行删除处理

Undo Log 与 Redo Log 不同，Undo Log 记录的是逻辑日志，可以这样理解：当数据库执行一条 insert 语句时，Undo Log 会记录一条对应的 delete 语句；当数据库执行一条 delete 语句时，Undo Log 会记录一条对应的 insert 语句；当数据库执行一条 update 语句时，Undo Log 会记录一条相反的 update 语句

当数据崩溃重启或者执行回滚事务时，可以从 Undo Log 中读取相应的数据记录进行回滚操作

MySQL 中的多版本并发控制也是通过 Undo Log 实现的，当 select 语句查询的数据被其他事务锁定时，可以从 Undo Log 中分析出当前数据之前的版本，从而向客户端返回之前版本的数据

需要注意的是，因为 MySQL 事务执行过程中产生的 Undo Log 也需要进行持久化操作，所以 Undo Log 也会产生 Redo Log。由于 Undo Log 的完整性和可靠性需要 Redo Log 来保证，因此数据库崩溃时需要先做 Redo Log 数据恢复，然后做 Undo Log 回滚

### 2.Undo Log 存储方式

在MySQL 中，InnoDB 存储引擎对于 Undo Log 的存储采用段的方式进行管理，在 InnoDB 存储引擎的数据文件中存在一种叫做 rollback segment 的回滚段，这个回滚段内部有 1024 个 undo log segment 段

Undo Log 默认存放在共享数据表空间中，默认为 ibdata1 文件中。如果开启了 innodb_file_per_table 参数，就会将 Undo Log 存放在每张数据表的 .idb 文件中

默认情况下，InnoDB 存储引擎会将回滚段全部写在同一个文件中，也可以通过 innodb_undo_tablespaces 变量将回滚段平均分配到多个文件中。innod_undo_tablespaces 变量的默认值为 0，表示将 rollback segment 回滚段全部写到同一个文件中

需要注意的是，innodb_undo_tablespaces 变量只能在停止 MySQL 服务的情况下修改，重启 MySQL 服务后生效，但是不建议修改这个变量的值

### 3.Undo Log 基本原理

Undo Log 写入磁盘时和 Redo Log 一样，默认情况下都需要经过内核空间的 OS Buffer，如下图所示：

同样，如果在打开日志文件时设置了 O_DIRECT 标志位，就可以不经过操作系统内核空间的 OS Buffer，直接向磁盘写入数据，这点和 Redo Log 也是一样

这里依然以商城系统的下单业务为例来简单说明 Undo Log 的基本原理，如下图所示：

从上图中可以看出，MySQL 数据库事务提交之前，InnoDB 存储引擎会将数据表中修改前的数据保存到 Undo Log Buffer。Undo Log Buffer 中的数据会持久化到磁盘的 Undo Log 文件中。当数据库发生故障重启或者事务回滚时，InnoDB 存储引擎会读取 Undo Log 中的数据，将事务还未提交的数据回滚到最初的状态。同时，系统可以根据需要查询并加载订单表中的数据，也就是加载 order.ibd 文件中的数据，也可以向订单表写入数据，也就是持久化数据到 order.ibd 文件中

### 4.Undo Log 实现 MVCC 机制

在MySQL 中，Undo Log 除了实现事务的回滚操作外，另一个重要的作用就是实现多版本并发控制，也就是 MVCC 机制。在事务提交之前，向 Undo Log 保存事务当前的数据，这些保存到 Undo Log 中的旧版本数据可以作为快照供其他并发事务进行快照读

Undo Log 的回滚段中，undo logs 分为 insert undo log 和 update undo log

- insert undo log：事务对插入新记录产生的 Undo Log，只是在事务回滚时需要，在事务提交后可以立即丢弃
- update undo log：事务对记录进行删除和更新操作时产生的 Undo Log，不仅在事务回滚时需要，在一致性读时也需要，因此不能随便删除，只有当数据库所使用的快照不涉及该日志记录时，对应的回滚日志才会被 purge 线程删除

关于InnoDB 实现 MVCC 机制，简单点理解就是 InnoDB 存储引擎在数据表的每行记录后面保存了两个隐藏列，一个隐藏列保存行的创建版本，另一个隐藏列保存行的删除版本。每开始一个新的事务，这些版本号就会递增

在可重复读隔离级别下，MVCC 机制在增删改查操作下分别按照如下方式实现：

**1、** 当前操作是select操作时，InnoDB存储引擎只会查找版本号小于或者等于当前事务版本号的数据行，这样可以保证事务读取的数据行要么之前就已经存在，要么是当前事务自身插入或者修改的记录另外，行的删除版本号要么未定义，要么大于当前事务的版本号，这样可以保证事务读取的行在事务开始之前没有被删除；

**2、** 当前操作是insert操作时，将当前事务的版本号保存为当前行的创建版本号；

**3、** 当前操作是delete操作时，将当前事务的版本号保存为删除的数据行的删除版本号，作为行删除标识；

**4、** 当前操作是update操作时，InnoDB存储引擎会将待修改的行复制为新的行，将当前事务的版本号保存为新数据行的创建版本号，同时保存当前事务的版本号为原来数据行的删除版本号；

需要注意的是，将当前事务的版本号保存为行删除版本号时，相应的数据行并不会被真正删除，当事务提交时，会将这些记录放入一个待删除列表，因此需要根据一定的策略对这些标识为删除的行进行清理。为此，InnoDB 存储引擎会开启一个后台线程进行清理工作，是否可以清理需要后台线程来判断

为便于读者理解 Undo Log 实现 MVCC 机制的原理，上面介绍的实现过程经过了简化。从本质上说，为实现 MVCC 机制，InnoDB 存储引擎在数据库每行数据的后面添加了 3 个字段：6 字节的事务 id（DB_TRX_ID）字段、7 字节的回滚指针（DB_ROLL_PTR）字段、6 字节的 DB_ROW_ID 字段。每个字段的作用如下所示：

- 6 字节的事务 id（DB_TRX_ID）字段：用来标识最近一次对本行记录做修改（insert、update）的事务标识符，即最后一次修改本行记录的事务 id。如果是 delete 操作，在 InnoDB 存储引擎内部也属于一次 update 操作，即更新行中的一个特殊位，将行标识为已删除，并非真正删除
- 7 字节的回滚指针（DB_ROLL_PTR）字段：主要指向上一个版本的行记录，能够从最新版本的行记录逐级向上，找到要查找的行版本记录
- 6 字节的 DB_ROW_ID 字段：这个字段包含一个随着新数据行的插入操作而单调递增的行 id，当由 InnoDB 存储引擎自动产生聚集索引时，聚集索引会包含这个行 id，否则这个行 id 不会出现在任何索引中

### 5.Undo Log 相关参数

在MySQL 命令行输入如下命令可以查看 Undo Log 香瓜的呢参数：

```java
show variables like "%undo%";
```

其中几个重要的参数说明如下所示：

**1、** innodb_max_undo_log_size：表示UndoLog空间的最大值，当超过这个阈值（默认是1GB），会触发truncate回收（收缩）操作，回收操作后，UndoLog空间缩小到10MB；

**2、** innodb_undo_directory：表示UndoLog的存储目录；

**3、** innodb_undo_log_encrypt：MySQL8中新增的参数，表示UndoLog是否加密，OFF表示不加密，ON表示加密，默认为OFF；

**4、** innodb_undo_log_truncate：表示是否开启在线回收UndoLog文件操作，支持动态设置，ON表示开启，OFF表示关闭，默认为OFF；

**5、** innodb_undo_tablespaces：此参数必须大于或等于2，即回收一个UndoLog时，要保证另一个UndoLog是可用的；

**6、** innodb_undo_logs：表示UndoLog的回滚段数量，此参数的值至少大于或等于35，默认为128；

**7、** innodb_purge_rseg_truncate_frequency：用于控制回收UndoLog的频率UndoLog空间在回滚段释放之前是不会回收的，要想增加释放回滚区间的频率，就要降低innodb_purge_rseg_truncate_frequency参数的值；

## 三、BinLog

Redo Log 是 InnoDB 存储引擎特有的日志，MySQL 也有其自身的日志，这个日志就是 BinLog，即二进制日志

### 1.BinLog 基本概念

BinLog 是一种记录所有 MySQL 数据库表结构变更以及表数据变更的二进制日志。BinLog 中不会记录诸如 select 和 show 这类查询操作的日志，同时，BinLog 是以事件形式记录相关变更操作的，并且包含语句执行所消耗的时间。BinLog 有以下两个最重要的使用场景：

**1、** 主从复制：在主数据库上开启BinLog，主数据库把BinLog发送至从数据库，从数据库获取BinLog后通过I/O线程将日志写到中继日志，也就是RelayLog中然后，通过SQL线程将RelayLog中的数据同步至从数据库，从而达到主从数据库数据的一致性；

**2、** 数据恢复：当MySQL数据库发生故障或者崩溃时，可以通过BinLog进行数据恢复例如，可以使用mysqlbinlog等工具进行数据恢复；

### 2.BinLog 记录模式

BinLog 文件中主要有 3 种记录模式，分别为 Row、Statement 和 Mixed

**Row 模式**

Row模式下的 BinLog 文件会记录每一行数据被修改的情况，然后在 MySQL 从数据库中对相同的数据进行修改

Row模式的优点是能够非常清楚地记录每一行数据的修改情况，完全实现主从数据库的同步和数据的恢复

Row模式的缺点是如果主数据库中发生批量操作，尤其是大批量的操作，会产生大量的二进制日志。比如，使用 alter table 操作修改拥有大量数据的数据表结构时，会使二进制日志的内容暴涨，产生大量的二进制日志，从而大大影响主从数据库的同步性能

**Statement 模式**

Statement 模式下的 BinLog 文件会记录每一条修改数据的 SQL 语句，MySQL 从数据库在复制 SQL 语句的时候，会通过 SQL 进程将 BinLog 中的 SQL 语句解析成和 MySQL 主数据库上执行过的 SQL 语句相同的 SQL 语句，然后在从数据库上执行 SQL 进程解析出来的 SQL 语句

Statement 模式的优点是由于不记录数据的修改细节，只是记录数据表结构和数据变更的 SQL 语句，因此产生的二进制日志数据量比较小，这样能够减少磁盘的 I/O 操作，提升数据存储和恢复的效率

Statement 模式的缺点是在某些情况下，可能会导致主从数据库中的数据不一致。例如，在 MySQL 主数据库中使用了 last_insert_id() 和 now() 等函数，会导致 MySQL 主从数据库中的数据不一致

**Mixed 模式**

Mixed 模式下的 BinLog 是 Row 模式和 Statement 模式的混用。在这种模式下，一般会使用 Statement 模式保存 BinLog，如果存在 Statement 无法复制的操作，例如在 MySQL 主数据库中使用 last_insert_id() 和 now() 等函数，MySQL 会使用 Row 模式保存 BinLog。也就是说，如果将 BinLog 的记录模式设置为 Mixed，MySQL 会根据执行的 SQL 语句选择写入的记录模式

### 3.BinLog 文件结构

MySQL 的 BinLog 文件中保存的是对数据库、数据表和数据表中的数据的各种更新操作。用来表示修改操作的数据结构叫做日志事件（Log Event），不同的修改操作对应着不同的日志集合。在 MySQL 中，比较常用的日志事件包括 Query Event、Row Event、Xid Event 等。从某种程度上说，BinLog 文件的内容就是各种日志事件的集合

### 4.BinLog 写入机制

MySQL 事务在提交的时候，会记录事务日志和二进制日志，也就是 Redo Log 和 BinLog。这里就存在一个问题：对于事务日志和二进制日志，MySQL 会先记录哪种呢？

我们已经知道，Redo Log 是 InnoDB 存储引擎特有的日志，BinLog 是 MySQL 本身就有的上层日志，并且会先于 InnoDB 的事务日志被写入，因此在 MySQL 中，二进制日志会先于事务日志被写入

简单点理解就是 MySQL 在写 BinLog 文件时，会按照如下规则进行写操作：

**1、** 根据记录的模式（Row、Statement和Mixed）和操作（create、drop、alter、insert、update等）触发事件生成日志事件（事件出发执行机制）；

**2、** 将事务执行过过程中产生的日志事件写入相应的缓冲区注意，这里是每个事务线程都有一个缓冲区日志事件保存在数据结构binlog_cache_mngr中，这个数据结构中有两个缓冲区：一个是stmt_cache，用于存放不支持事务的信息；另一个是trx_cache，用于存放支持事务的信息；

**3、** 事务在Commit阶段会将产生的日志事件写入磁盘的BinLog文件中因为不同的事务会以串行的方式将日志事件写入BinLog文件中，所以一个事务中包含的日志事件信息在BinLog文件中是连续的，中间不会插入其他事务的日志事件；

综上，一个事务的 BinLog 是完整的，并且中间不会插入其他事务的 BinLog

### 5.BinLog 组提交机制

为了提高 MySQL 中日志刷盘的效率，MySQL 数据库提供了组提交（group commit）功能。通过组提交功能，调用一次 fsync() 函数能够将多个事务的日志刷新到磁盘的日志文件中，而不用将每个事务的日志单独刷新到磁盘的日志文件中，从而大大提升了日志刷盘的效率

在InnoDB 存储引擎中，提交事务时，一般会进行两个阶段的操作：

**1、** 修改内存中事务对应的信息，并将日志写入相应的RedoLogBuffer；

**2、** 调用fsync()函数将RedoLogBuffer中的日志信息刷新到磁盘的RedoLog文件中；

其中，步骤 2 因为存在写磁盘的操作，所以比较耗时。事务提交后，先将日志信息写入内存中的 Redo Log Buffer，然后调用 fsync() 函数将多个事务的日志信息从内存中的 Redo Log Buffer 刷新到磁盘的 Redo Log 文件中，这样能够大大提升事务日志的写入效率，尤其对于写入和更新操作比较频繁的业务，性能提升更加明显

在MySQL 5.6 之前的版本中，如果开启了 BinLog，则 InnoDB 存储引擎的组提交功能就会失效，导致事务性能下降。这是因为在 MySQL 中需要保证 BinLog 和事务日志的一致性，为了保证二者的一致性，使用了两阶段事务。两阶段事务的步骤如下所示：

**1、** 当事务提交时，InnoDB存储引擎需要进行prepare操作；

**2、** MySQL上层会将数据库、数据表和数据表中的数据的更新操作写入BinLog文件；

**3、** InnoDB存储引擎将事务日志写入RedoLog文件中；

为了保证 BinLog 和事务日志的一致性，在步骤 1 的 prepare 阶段会启用一个 prepare_commit_mutex 锁，这样会导致开启二进制日志后组提交功能失效

这个问题在 MySQL 5.6 中得到了解决。在 MySQL 5.6 中，提交事务时会在 InnoDB 存储引擎的上层将事务按照一定的顺序放入一个队列，队列中的第一个事务称为 leader，其他事务称为 follower。在执行顺序上，虽然还是会先写 BinLog，再写事务日志，但是写日志的机制发生了变化：移除了 prepare_commit_mutex 锁。开启 BinLog 后，组提交功能不会失效。BinLog 的写入和 InnoDB 的事务日志写入都是通过组提交功能进行的

MySQ 5.6 中，这种实现方式称为二进制日志组提交（Binary Log Group Commit，BLGC）。BLGC 的实现主要分为 Flush、Sync 和 Commit 三个阶段：

**1、** Flush阶段：将每个事务的BinLog写入对应的内存缓冲区；

**2、** Sync阶段：将内存缓冲区中的BinLog写入磁盘的BinLog文件，如果队列中存在多个事务，则此时只执行一次刷盘操作就可以将多个事务的BinLog刷新到磁盘的BinLog文件中，这就是BLGC操作；

**3、** Commit阶段：leader事务根据队列中事务的顺序调用存储引擎层事务的提交操作，由于InnoDB存储引擎本身就支持组提交功能，因此解决了prepare_commit_mutex锁导致的组提交功能失效的问题；

在Flush 阶段，将 BinLog 写入内存缓冲区时，不是写完就立刻进入 Sync 阶段，而是等待一定时间，多积累几个事务的 BinLog 再一起进入 Sync 阶段。这个等待时间由变量 binlog_max_flush_queue_time 决定，binlog_max_flush_queue_time 变量的默认值为 0。除非有大量的事务不断地进行写入和更新操作，否则不建议修改这个变量的值，这是因为修改后可能会导致事务的响应时间变长

进入Sync 阶段后，会将内存缓冲区中多个事务的 BinLog 刷新到磁盘的 BinLog 文件中，和刷新一个事务的 BinLog 一样，也是由 sync_binlog 变量进行控制的

一组事务正在执行 Commit 阶段的操作时，其他新产生的事务可以执行 Flush 阶段的操作，Commit 阶段的事务和 Flush 阶段的事务不会互相阻塞。这样，组提交功能就会持续生效。此时，组提交功能的性能和队列中的事务数量有关，如果队列中只存在一个事务，组提交功能和单独提交一个事务的效果差不多，有时甚至会更差。提交的事务越多，组提交功能的性能提升就越明显

### 6.BinLog 与 Redo Log 的区别

BinLog 和 Redo Log 在一定程度上都能恢复数据，但是二者有着本质的区别，具体内容如下：

**1、** BinLog是MySQL本身就拥有的，不管使用何种存储引擎，BinLog都存在，而RedoLog是InnoDB存储引擎特有的，只有InnoDB存储引擎才会输出RedoLog；

**2、** BinLog是一种逻辑日志，记录的是对数据库的所有修改操作，而RedoLog是一种物理日志，记录的是每个数据页的修改；

**3、** RedoLog具有幂等性，多次操作的前后状态是一致的，而BinLog不具有幂等性，记录的是所有影响数据库的操作例如插入一条数据后再将其删除，RedoLog前后的状态不会发生变化，而BinLog就会记录插入操作和删除操作；

**4、** BinLog开启事务时，会将每次提交的事务一次性写入内存缓冲区，如果未开启事务，则每次成功执行插入、更新和删除语句时，就会将对应的事务信息写入内存缓冲区，而RedoLog是在数据准备修改之前将数据写入缓冲区的RedoLog中，然后在缓冲区中修改数据而且在提交事务时，先将RedoLog写入缓冲区，写入完成后再提交事务；

**5、** BinLog只会在事务提交时，一次性写入BinLog，其日志的记录方式与事务的提交顺序有关，并且一个事务的BinLog中间不会插入其他事务的BinLog而RedoLog记录的是物理页的修改，最后一个提交的事务记录会覆盖之前所有未提交的事务记录，并且一个事务的RedoLog中间会插入其他事务的RedoLog；

**6、** BinLog是追加写入，写完一个日志在写下一个日志文件，不会覆盖使用，而RedoLog是循环写入，日志空间的大小是固定的，会覆盖使用；

**7、** BinLog一般用于主从复制和数据恢复，并且不具备崩溃自动恢复的能力，而RedoLog是在服务器发生故障后重启MySQL，用于恢复事务已提交但未写入数据表的数据；

### 7.BinLog 相关参数

在MySQL 中，输入如下命令可以查看与 BinLog 相关的参数：

```java
show variables like '%log_bin%';
show variables like '%binlog%';
```

其中，几个重要的参数如下所示：

**1、** log_bin：表示开启二进制日志，未指定BinLog的目录时，会在MySQL的数据目录下生成BinLog，指定BinLog的目录时，会在指定的目录下生成BinLog；

**2、** log_bin_index：设置此参数可以指定二进制索引文件的路径与名称；

**3、** binlog_do_db：表示只记录指定数据库的二进制日志；

**4、** binlog_ignore_db：表示不记录指定数据库的二进制日志；

**5、** max_binlog_size：表示BinLog的最大值，默认值为1GB；

**6、** sync_binlog：这个参数会影响MySQL的性能和数据的完整性取值为0时，事务提交后，MySQL将binlog_cache中的数据写入BInLog文件的同时，不会执行fsync()函数刷盘当取值为大于0的数字N时，在进行N此事务提交操作后，MySQL将执行一次fsync()函数，将多个事务的BinLog刷新到磁盘中；

**7、** max_binlog_cache_size：表示BinLog占用的最大内存；

**8、** binlog_cache_size：表示BinLog使用的内存大小；

**9、** binlog_cache_use：表示使用BinLog缓存的事务数量；

**10、** binlog_cache_disk_use：表示使用BinLog缓存但超过binlog_cache_size的值，并且使用临时文件夹来保存SQL语句中的事务数量；

需要注意的是，MySQL 中默认不会开启 BinLog。如果需要开启 BinLog，要修改 my.cnf 或 my.ini 配置文件，在 mysqlId 下面增加 log_bin = mysql_bin_log 命令，重启 MySQL 服务，如下所示：

```java
binlog-format=ROW
log-bin=mysqlbinlog
```

## 四、MySQL 事务流程

MySQL 的事务流程分为 MySQL 事务执行流程和 MySQL 事务恢复流程，本节对 MySQL 的事务流程进行简单的介绍

### 1.MySQL 事务执行流程

MySQL 事务执行流程如下图所示：

MySQL 在事务执行的过程中，主要是通过 Redo Log 和 Undo Log 实现的

从上图可以看出，MySQL 在事务执行的过程中，会记录相应 SQL 语句的 Undo Log 和 Redo Log，然后在内存中更新数据并形成数据脏页。接下来 Redo Log 会根据一定的规则触发刷盘操作，Undo Log 和数据脏页则通过检查点机制刷盘。事务提交时，会将当前事务相关的所有 Redo Log 刷盘，只有当前事务相关的所有 Redo Log 刷盘成功，事务才算提交成功

### 2.MySQL 事务恢复流程

如果一切正常，则 MySQL 事务会按照上图中的顺序执行。实际上，MySQL 事务的执行不会总是那么顺利。如果 MySQL 由于某种原因崩溃或者宕机，则需要进行数据的恢复或者回滚操作

按照上图所示，如果事务在执行第 8 步，即事务提交之前，MySQL 崩溃或者宕机，此时会先使用 Redo Log 恢复数据，然后使用 Undo Log 回滚数据。如果在执行第 8 步之后 MySQL 崩溃或者宕机，此时会使用 Redo Log 恢复数据，大体流程如下图所示：

如上图所示，MySQL 发生崩溃或者宕机时，需要重启 MySQL。MySQL 重启之后，会获取日志检查点信息，随后根据日志检查点信息使用 Redo Log 恢复数据。如果在 MySQL 崩溃或者宕机时，事务未提交，则接下来使用 Undo Log 回滚数据。如果在 MySQL 崩溃或者宕机时，事务已经提交，则用 Redo Log 恢复数据即可

## 五、MySQL 中的 XA 事务

### 1.XA 事务的基本原理

XA事务支持不同数据库之间实现分布式事务。这里的不同数据库，可以是不同的 MySQL 示例，也可以是不同的数据库类型，比如 MySQL 数据库和 Oracle 数据库

XA事务本质上是一种基于两阶段提交的分布式事务，分布式事务可以简单理解为多个数据库事务共同完成一个原子性的事务操作。参与操作的多个事务要么全部提交成功，要么全部提交失败。在使用 XA 分布式事务时，InnoDB 存储引擎的事务隔离级别需要设置为串行化

XA事务由一个事务管理器（Transaction Manager）、一个或者多个资源管理器（Resource Manager）和一个应用程序（Application Progranm）组成，组成模型如下图所示：

- 事务管理器：主要对参与全局事务的各个分支事务进行协调，并与资源管理器进行通信
- 资源管理器：主要提供对事务资源的访问能力。实际上，一个数据库就可以看作一个资源管理器
- 应用程序：主要用来明确全局事务和各个分支事务，指定全局事务中的各个操作

因为XA 事务是基于两阶段提交的分布式事务，所以 XA 事务也被拆分为 Prepare 阶段和 Commit 阶段

在Prepare 阶段，事务管理器接收所有资源管理器返回的结果信息，如果某一个或多个资源管理器向事务管理器返回的结果信息为不可以提交，或者超时，则事务管理器向所有的资源管理器发送回滚指令。如果事务管理器收到的所有资源管理器返回的结果信息为可以提交，则事务管理器向所有的资源管理器发送提交事务的指令

在某种程度上，MySQL XA 事务可分为内部 XA 事务和外部 XA 事务。外部 XA 事务属于分布式事务的一种实现方式，而内部 XA 事务则表示 MySQL 使用了 InnoDB 作为存储引擎，并且开启了 BinLog，为了保证 BinLog 与 Redo Log 的一致性，MySQL 内部使用了 XA 事务

MySQL Connector/J 5.0.0 版本开始支持 XA 事务，也就是说，从 Connector/ J5.0.0 版本开始提供了 Java 版本 XA 接口的实现。基于此，可以直接通过 Java 代码来执行 MySQL 的 XA 事务。但是直接使用 JDBC 操作 MySQL 的 XA 事务还是比较繁琐的，在实际工作中，很少使用 JDBC 直接操作 MySQL 的 XA 事务，大部分时间会使用第三方框架或者容器来操作 XA 事务，能够大大提高开发的效率

### 2.MySQL XA 事务语法

在MySQL 命令行输入如下命令可以查看存储引擎是否支持 XA 事务

```java
mysql>show engines \G
```

只有InnoDB 存储引擎支持事务、XA 事务和事务保存点

MySQL XA 事务的基本语法如下所示：

1）开启 XA 事务，如果使用的是 XA START 命令而不是 XA BEGIN 命令，则不支持 [JOIN | RESUME]，xid 是一个唯一值，表示事务分支标识符，语法如下：

```java
XA {START|BEGIN} xid [JOIN|RESUME]
```

2）结束一个 XA 事务，不支持 [SUSPEND [FOR MIGRATE]]，语法如下：

```java
XA END xid [SUSPEND [FOR MIGRATE]]
```

3）准备提交 XA 事务：

```java
XA PREPARE xid
```

4）提交 XA 事务，如果使用了 ONE PHASE 命令，表示使用一阶段提交。在两阶段提交协议中，如果只有一个资源管理参与操作，则可以优化为一阶段提交：

```java
XA COMMIT xid [ONE PHASE]
```

5）回滚 XA 事务：

```java
XA ROLLBACK xid
```

6）列出所有处于准备阶段的 XA 事务

```java
XA RECOVER [CONVERT XID]
```

下面是MySQL 官方文档中对于 XA 事务的一个简单示例，演示了 MySQL 作为全局事务中的一个事务分支，将一行记录插入一个表：

```java
mysql> XA START 'xatest';
Query OK, 0 rows affected (0.00 sec)
mysql> INSERT INTO mytable (i) VALUES(10);
Query OK, 1 row affected (0.04 sec)
mysql> XA END 'xatest';
Query OK, 0 rows affected (0.00 sec)
mysql> XA PREPARE 'xatest';
Query OK, 0 rows affected (0.00 sec)
mysql> XA COMMIT 'xatest';
Query OK, 0 rows affected (0.00 sec)
```

MySQL XA 事务使用 XID 标识分布式事务，xid 主要由以下几部分组成：

```java
xid: gtrid[, bqual [, formatID]]
```

- gtrid：必须，为字符串，表示全局事务标识符
- bqual：可选，为字符串，默认是空串，表示分支限定符
- formatID：可选，默认值为 1，用于标识 gtrid 和 bqual 值使用的格式
