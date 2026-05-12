# 14、MySQL 调优 - 优化MySQL内存
- 来源：https://ddkk.com/zhuanlan/db/mysql/3/14.html
- 分类：缓存数据库
- 分组：教程目录
备注:测试数据库版本为MySQL 8.0

## 一. MySQL如何使用内存

MySQL分配缓冲区和缓存来提高数据库操作的性能。默认配置被设计为允许MySQL服务器在拥有大约512MB内存的虚拟机上启动。您可以通过增加某些缓存和缓冲区相关的系统变量的值来提高MySQL的性能。您还可以修改默认配置，以便在内存有限的系统上运行MySQL。

下面的列表描述了MySQL使用内存的一些方式。在适用的情况下，引用了相关的系统变量。有些项目是特定于存储引擎或特性的。

**1、** InnoDB缓冲池是存放表、索引和其他辅助缓冲的InnoDB数据的内存区域为了提高大容量读操作的效率，缓冲池被划分为可能包含多行的页为了提高缓存管理的效率，缓冲池被实现为页面的链表;使用LRU算法的一种变体，将很少使用的数据从缓存中老化；

缓冲池的大小对系统性能很重要:

1)InnoDB在服务器启动时使用malloc()操作为整个缓冲池分配内存系统变量innodb_buffer_pool_size定义了缓冲池的大小通常，建议innodb_buffer_pool_size值为系统内存的50%到75%Innodb_buffer_pool_size可以在服务器运行时动态配置；

2)在具有大量内存的系统上，可以通过将缓冲池划分为多个缓冲池实例来提高并发性系统变量innodb_buffer_pool_instances定义了缓冲池实例的数量；

3)太小的缓冲池可能会导致过多的搅动，因为从缓冲池中刷新的页面不久之后才需要再次使用；

4)太大的缓冲池可能会由于内存竞争而导致交换；

**2、** 存储引擎接口使优化器能够提供有关用于扫描的记录缓冲区大小的信息，优化器估计这些扫描可能会读取多行缓冲区大小可以根据估计的大小而变化InnoDB使用这种可变大小的缓冲能力来利用行预取，并减少锁存和b-树导航的开销；

**3、** 所有线程共享MyISAM键缓冲区key_buffer_size系统变量决定了它的大小；

**4、** 对于服务器打开的每个MyISAM表，索引文件打开一次;对于每个并发运行的访问表的线程，都打开数据文件一次对于每个并发线程，都分配了一个表结构、每个列的列结构和一个大小为3*N的缓冲区(其中N是最大的行长度，不包括BLOB列)一个BLOB列需要5到8个字节加上BLOB数据的长度MyISAM存储引擎维护一个额外的行缓冲区供内部使用；

**5、** 可以将myisam_use_mmap系统变量设置为1，以便为所有MyISAM表启用内存映射；

**6、** 如果内存中的临时表变得太大(使用tmp_table_size和max_heap_table_size系统变量确定)，MySQL会自动将表从内存中的格式转换为磁盘上的格式从MySQL8.0.16开始，磁盘上的临时表总是使用InnoDB存储引擎(以前，用于此目的的存储引擎由系统变量internal_tmp_disk_storage_engine决定，现在不再支持该变量)你可以增加允许的临时表的大小；

**7、** 对于使用CREATETABLE显式创建的MEMORY表，只有max_heap_table_size系统变量决定表可以增长多少，并且没有转换到磁盘上的格式；

**8、** MySQL性能模式是一个用于在低级别监控MySQL服务器执行的特性PerformanceSchema动态地增量地分配内存，根据实际的服务器负载扩展其内存使用，而不是在服务器启动期间分配所需的内存一旦分配了内存，就不会释放它，直到服务器重新启动；

**9、** 服务器用于管理客户机连接的每个线程都需要一些特定于线程的空间下面的列表表明了这些和哪些系统变量控制它们的大小:；

1)一个堆栈(thread_stack)；

2)连接缓冲区(net_buffer_length)；

3)结果缓冲区(net_buffer_length)；

连接缓冲区和结果缓冲区的大小都以net_buffer_length字节开始，但会根据需要动态扩大到max_allowed_packet字节。在每个SQL语句之后，结果缓冲区缩小到net_buffer_length字节。当语句运行时，还会分配当前语句字符串的副本。

每个连接线程使用内存计算语句摘要。服务器为每个会话分配max_digest_length字节。

**10、** 所有线程共享相同的基本内存；

**11、** 当不再需要一个线程时，分配给它的内存将被释放并返回给系统，除非该线程返回到线程缓存中在这种情况下，内存仍然被分配；

**12、** 每个执行表的顺序扫描的请求都分配一个读缓冲区read_buffer_size系统变量决定缓冲区大小；

**13、** 当以任意顺序读取行(例如，按照排序)时，可能会分配一个随机读取缓冲区以避免磁盘查找read_rnd_buffer_size系统变量决定缓冲区大小；

**14、** 所有连接都是在一次传递中执行的，而且大多数连接甚至可以在不使用临时表的情况下完成大多数临时表都是基于内存的散列表具有较大行长度(计算为所有列长度之和)或包含BLOB列的临时表存储在磁盘上；

**15、** 大多数执行排序的请求根据结果集大小分配一个排序缓冲区和0到两个临时文件；

**16、** 几乎所有的解析和计算都是在线程本地和可重用内存池中完成的对于小的项目不需要内存开销，因此避免了通常缓慢的内存分配和释放内存只分配给异常大的字符串；

**17、** 对于具有BLOB列的每个表，将动态地扩大缓冲区以读取更大的BLOB值如果扫描一个表，缓冲区将增长到最大的BLOB值；

**18、** MySQL需要内存和表缓存的描述符所有正在使用的表的处理程序结构都保存在表缓存中，并以“先入先出”(FIFO)的方式管理table_open_cache系统变量定义了初始表缓存大小；

**19、** MySQL还需要用于表定义缓存的内存table_definition_cache系统变量定义了可以存储在表定义缓存中的表定义的数量如果使用大量表，可以创建大型表定义缓存来加快表的打开速度与表缓存不同，表定义缓存占用的空间更少，而且不使用文件描述符；

**20、** FLUSHTABLES语句或mysqladminFLUSH-TABLES命令会立即关闭所有未使用的表，并在当前正在执行的线程结束时将所有正在使用的表标记为关闭这有效地释放了大部分使用中的内存FLUSHTABLES直到所有表都被关闭后才返回；

**21、** 服务器通过GRANT、CREATEUSER、CREATEserver和INSTALLPLUGIN语句将信息缓存到内存中该内存不会被相应的REVOKE、DROPUSER、DROPSERVER和UNINSTALLPLUGIN语句释放，所以对于一个执行了许多导致缓存的语句实例的服务器来说，缓存内存的使用会增加，除非使用FLUSH特权释放它；

**22、** 在复制拓扑中，以下设置会影响内存占用率，可根据需要进行调整:；

1)复制源上的max_allowed_packet系统变量限制源发送给其副本进行处理的最大消息大小。该设置默认为64M。

2)多线程副本上的slave_pending_jobs_size_max系统变量设置了用于保存等待处理的消息的最大内存量。该设置默认为128M。内存只在需要时分配，但如果复制拓扑有时处理大型事务，则可能会使用内存。这是一个软限制，可以处理较大的事务。

3)复制源或副本上的rpl_read_size系统变量控制从二进制日志文件和中继日志文件读取的最小数据量(以字节为单位)。缺省值是8192字节。为每个读取二进制日志和中继日志文件的线程分配这个值大小的缓冲区，包括源上的转储线程和副本上的协调线程。

4)binlog_transaction_dependency_history_size系统变量限制了作为内存历史记录保存的行散列的数量。

5)max_binlog_cache_size系统变量指定单个事务使用内存的上限。

6)max_binlog_stmt_cache_size系统变量指定语句缓存使用内存的上限。

Ps和其他系统状态程序可能会报告mysqld使用了大量内存。这可能是由不同内存地址上的线程堆栈引起的。例如，Solaris版本的ps将堆栈之间未使用的内存计算为使用内存。要验证这一点，请使用swap -s检查可用的交换。我们用几个内存泄漏检测器(商业的和开源的)测试mysqld，所以应该没有内存泄漏。

## 二.监控MySQL内存使用

下面的例子演示了如何使用Performance Schema和sys Schema来监控MySQL内存使用情况。

大多数Performance Schema内存检测在默认情况下是禁用的。可以通过更新Performance Schema setup_instruments表的enabled列来启用Instruments。内存工具的名称以Memory /code_area/instrument_name的形式出现，其中code_area是一个值，比如sql或innodb，而instrument_name是工具细节。

**1、** 要查看可用的MySQL内存工具，请查询PerformanceSchemasetup_instruments表下面的查询为所有代码区域返回数百个内存工具；

根据MySQL的安装情况，代码区域可能包括performance_schema、sql、client、innodb、myisam、csv、memory、blackhole、archive、partition等。

```java
mysql> SELECT * FROM performance_schema.setup_instruments
    ->        WHERE NAME LIKE '%memory/innodb%';
+-------------------------------------------+---------+-------+-------------------+------------+---------------+
| NAME                                      | ENABLED | TIMED | PROPERTIES        | VOLATILITY | DOCUMENTATION |
+-------------------------------------------+---------+-------+-------------------+------------+---------------+
| memory/innodb/adaptive hash index         | YES     | NULL  |                   |          0 | NULL          |
| memory/innodb/log and page archiver       | YES     | NULL  |                   |          0 | NULL          |
| memory/innodb/buf_buf_pool                | YES     | NULL  | global_statistics |          0 | NULL          |
| memory/innodb/buf_stat_per_index_t        | YES     | NULL  |                   |          0 | NULL          |
| memory/innodb/clone                       | YES     | NULL  |                   |          0 | NULL          |
--snip--
| memory/innodb/ut0sort                     | YES     | NULL  |                   |          0 | NULL          |
| memory/innodb/ut0stage                    | YES     | NULL  |                   |          0 | NULL          |
| memory/innodb/ut0ut                       | YES     | NULL  |                   |          0 | NULL          |
| memory/innodb/ut0vec                      | YES     | NULL  |                   |          0 | NULL          |
| memory/innodb/ut0wqueue                   | YES     | NULL  |                   |          0 | NULL          |
| memory/innodb/zipdecompress               | YES     | NULL  |                   |          0 | NULL          |
+-------------------------------------------+---------+-------+-------------------+------------+---------------+
206 rows in set (0.01 sec)
mysql> 
```

**1、** 要启用内存工具，请在MySQL配置文件中添加一个性能模式工具规则例如，要启用所有内存工具，请将此规则添加到配置文件中并重新启动服务器:；

```java
performance-schema-instrument='memory/%=COUNTED'
```

重新启动服务器后，Performance Schema setup_instruments表的ENABLED列应该报告您启用的内存工具的YES。对于内存工具，setup_instruments表中的TIMED列将被忽略，因为内存操作不是定时的。

**1、** 查询存储仪器数据在本例中，内存工具数据在PerformanceSchemamemory_summary_global_by_event_name表中查询，该表通过EVENT_NAME汇总数据EVENT_NAME是工具的名称；

```java
mysql> SELECT * FROM performance_schema.memory_summary_global_by_event_name
    ->        WHERE EVENT_NAME LIKE 'memory/innodb/buf_buf_pool'\G
*************************** 1. row ***************************
                  EVENT_NAME: memory/innodb/buf_buf_pool
                 COUNT_ALLOC: 4
                  COUNT_FREE: 0
   SUM_NUMBER_OF_BYTES_ALLOC: 548143104
    SUM_NUMBER_OF_BYTES_FREE: 0
              LOW_COUNT_USED: 0
          CURRENT_COUNT_USED: 4
             HIGH_COUNT_USED: 4
    LOW_NUMBER_OF_BYTES_USED: 0
CURRENT_NUMBER_OF_BYTES_USED: 548143104
   HIGH_NUMBER_OF_BYTES_USED: 548143104
1 row in set (0.01 sec)
```

可以使用sys模式memory_global_by_current_bytes表查询相同的底层数据，该表按分配类型显示了全局服务器中当前的内存使用情况。

```java
mysql> SELECT * FROM sys.memory_global_by_current_bytes
    ->        WHERE event_name LIKE 'memory/innodb/buf_buf_pool'\G
*************************** 1. row ***************************
       event_name: memory/innodb/buf_buf_pool
    current_count: 4
    current_alloc: 522.75 MiB
current_avg_alloc: 130.69 MiB
       high_count: 4
       high_alloc: 522.75 MiB
   high_avg_alloc: 130.69 MiB
1 row in set (0.00 sec)
```

这个sys模式查询通过代码区域聚合当前分配的内存(current_alloc):

```java
mysql> SELECT SUBSTRING_INDEX(event_name,'/',2) AS
    ->        code_area, FORMAT_BYTES(SUM(current_alloc))
    ->        AS current_alloc
    ->        FROM sys.x$memory_global_by_current_bytes
    ->        GROUP BY SUBSTRING_INDEX(event_name,'/',2)
    ->        ORDER BY SUM(current_alloc) DESC;
+---------------------------+---------------+
| code_area                 | current_alloc |
+---------------------------+---------------+
| memory/innodb             | 614.42 MiB    |
| memory/performance_schema | 218.81 MiB    |
| memory/sql                | 10.70 MiB     |
| memory/mysys              | 8.67 MiB      |
| memory/temptable          | 1.00 MiB      |
| memory/mysqld_openssl     | 150.29 KiB    |
| memory/myisam             | 6.40 KiB      |
| memory/mysqlx             | 2.62 KiB      |
| memory/csv                |   88 bytes    |
| memory/blackhole          |   88 bytes    |
| memory/vio                |   16 bytes    |
+---------------------------+---------------+
11 rows in set (0.01 sec)
mysql> 
```

## 三.开始large page支持

一些硬件/操作系统架构支持大于默认值(通常为4KB)的内存页。这种支持的实际实现取决于底层硬件和操作系统。由于翻译后备缓冲区(Translation Lookaside Buffer, TLB)错过的次数减少，执行大量内存访问的应用程序可以通过使用大页面来提高性能。

在MySQL中，InnoDB可以使用大页来为它的缓冲池和额外的内存池分配内存。

MySQL中大页面的标准使用尝试使用最大支持的大小，最多4MB。在Solaris下，一个“超大页面”特性支持使用最多256MB的页面。该特性可用于最近的SPARC平台。可以通过使用——超大页或——跳过超大页选项来启用或禁用它。

MySQL还支持Linux实现的大页面支持(在Linux中称为HugeTLB)。

在Linux上使用大页面之前，必须启用内核来支持它们，并且必须配置HugeTLB内存池。HugeTBL API在Linux源码的Documentation/vm/ hugetbpage .txt文件中有文档说明，供参考。

最近的一些系统(如Red Hat Enterprise Linux)的内核似乎在默认情况下启用了大页面特性。要检查你的内核是否正确，使用下面的命令并寻找包含" huge "的输出行:

```java
------------------+---------------+
11 rows in set (0.01 sec)
mysql> exit
Bye
[root@hp2 ~]# 
[root@hp2 ~]# 
[root@hp2 ~]# 
[root@hp2 ~]# cat /proc/memin
```

非空命令输出表明存在大页面支持，但0值表明没有配置页面供使用。

如果您的内核需要重新配置以支持大页面，请参阅hugetlbpage.txt文件以获得说明。

假设您的Linux内核启用了大页面支持，使用以下命令配置MySQL使用它。通常，您将这些文件放在rc文件或在系统引导序列期间执行的等价启动文件中，以便在每次系统启动时执行这些命令。这些命令应该在引导顺序的早期执行，在MySQL服务器启动之前。请确保根据您的系统更改分配号和组号。

```java
# Set the number of pages to be used.
# Each page is normally 2MB, so a value of 20 = 40MB.
# This command actually allocates memory, so this much
# memory must be available.
echo 20 > /proc/sys/vm/nr_hugepages
# Set the group number that is permitted to access this
# memory (102 in this case). The mysql user must be a
# member of this group.
echo 102 > /proc/sys/vm/hugetlb_shm_group
# Increase the amount of shmem permitted per segment
# (12G in this case).
echo 1560281088 > /proc/sys/kernel/shmmax
# Increase total amount of shared memory.  The value
# is the number of pages. At 4KB/page, 4194304 = 16GB.
echo 4194304 > /proc/sys/kernel/shmall
```

对于MySQL的使用，您通常希望shmmax的值接近于small的值。

要验证大页面配置，请按照前面所述再次检查/proc/meminfo。现在你应该看到一些非零值:

```java
shell> cat /proc/meminfo | grep -i huge
HugePages_Total:      20
HugePages_Free:       20
HugePages_Rsvd:        0
HugePages_Surp:        0
Hugepagesize:       4096 kB
```

使用hugetlb_shm_group的最后一步是给mysql用户一个“无限”的memlock限制值。这可以通过编辑/etc/security/limits.conf或者在mysqld_safe脚本中添加以下命令来实现:

```java
ulimit -l unlimited
```

在mysqld_safe中添加ulimit命令会导致root用户在切换到mysql用户之前将memlock限制设置为unlimited。(这假设mysqld_safe是由root启动的。)

MySQL中的大页面支持默认是禁用的。要启用它，请使用——large-pages选项启动服务器。例如，您可以在服务器my.cnf文件中使用以下行:

```java
[mysqld]
large-pages
```

使用这个选项，InnoDB自动使用大页面作为缓冲池和额外的内存池。如果InnoDB不能做到这一点，它会退回到使用传统内存，并在错误日志中写一个警告: Using conventional memory pool
