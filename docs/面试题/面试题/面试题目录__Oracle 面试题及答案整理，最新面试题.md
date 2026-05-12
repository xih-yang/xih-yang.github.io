# Oracle 面试题及答案整理，最新面试题
- 来源：https://ddkk.com/zhuanlan/tiku/oracle.html
- 分类：私域粉丝-面试题
- 分组：面试题目录
## 1.解释冷备份和热备份的不同点以及各自的优点

**冷备份**

发生在数据库已经正常关闭的情况下，将关键性文件拷贝到另外位置的一种说法。适用于所有模式的数据库。

**优点**

1. 是非常快速的备份方法（只需拷贝文件）
2. 容易归档（简单拷贝即可）
3. 容易恢复到某个时间点上(只需将文件再拷贝回去)
4. 能与归档方法相结合，作数据库“最新状态”的恢复
5. 低度维护，高度安全。

**缺点**

1. 单独使用时，只能提供到“某一时间点上”的恢复。
2. 在实施备份的全过程中，数据库必须要作备份而不能作其它工作。也就是说，在冷备份过程中，数据库必须是关闭状态。
3. 若磁盘空间有限，只能拷贝到磁带等其它外部存储设备上，速度会很慢。
4. 不能按表或按用户恢复。

**热备份**

是在数据库仍旧处于工作状态时进行备份，采用的是归档方式备份数据的方法。

**优点**

1. 可在表空间或数据库文件级备份，备份的时间短。
2. 备份时数据库仍可使用。
3. 可达到秒级恢复(恢复到某一时间点上)。
4. 可对几乎所有数据库实体做恢复。
5. 恢复是快速的，在大多数情况下在数据库仍工作时恢复。

**缺点**

1. 不能出错，否则后果严重。
2. 若热备份不成功，所得结果不可用于时间点的恢复。
3. 因难于维护，所以要非凡仔细小心，不答应“以失败告终”。

**不同点**

热备份针对归档模式的数据库，在数据库仍旧处于工作状态时进行备份。而冷备份指在数据库关闭后，进行备份，适用于所有模式的数据库。

## 2.你必须利用备份恢复数据库，但是你没有控制文件，该如何解决问题呢？

重建控制文件，用带 backup control file 子句的 recover 命令恢复数据库。

## 3.如何转换 init.ora 到 spfile ?

使用 create spfile from pfile 命令

## 4.解释 data block ，extend 和 segment 的区别（这里建议用英文术语）

data block 是数据库中最小的逻辑存储单元。当数据库的对象需要更多的物理存储空间时，连续的 data block 就组成了 extend. 一个数据库对象拥有的所有 extents 被称为该对象的 segment

## 5.给出两个查询表结构的方法

1. DESCRIBE 命令
2. DBMS_METADATA.GET_DDL 包

## 6.怎样查看数据库引擎的报错

alert log.

## 7.比较 truncate 和 delete 命令

两者都可以用来删除表中所有的记录。区别在于：truncate 是 DDL 操作，它移动 HWK ，不需要 rollback segment 而 Delete 是 DML 操作，需要 rollback segment 且花费较长时间

## 8.使用索引的理由

快速访问表中的 data block

## 9.给出在 STAR SCHEMA 中的两种表及他们分别含有的数据

Fact tables 和 dimension tables. fact table 包含大量的主要的信息而 dimension tables 存放对 fact table 某些属性描述的信息

## 10.FACT Table 上需要建立何种索引？

位图索引（bitmap index）

## 11.给出两种相关约束？

主键和外键

## 12.如何在不影响子表的前提下，重建一个母表

子表的外键强制实效，重建母表，激活外键

## 13.解释归档和非归档模式之间的不同和他们的各自的优缺点

归档模式是指你可以备份所有的数据库 transactions 并恢复到任意一个时间点。非归档模式则相反，不能恢复到任意一个时间点。

但是非归档模式可以带来数据库性能上的少许提高

## 14.如何建立一个备份控制文件？

Alter database backup control file to trace.

## 15.给出数据库正常启动所经历的几种状态？

STARTUP NOMOUNT ?C 数据库实例启动

STARTUP MOUNT - 数据库装载

STARTUP OPEN ?C 数据库打开

## 16.哪个 column 可以用来区别 V 视图？

INST_ID 指明集群环境中具体的某个 instance

## 17.如何生成 explain plan

运行 utlxplan.sql 建立 plan 表

针对特定 SQL 语句，使用 explain plan set statement_id = 'tst1' into plan_table 运行 utlxplp.sql 或 utlxpls.sql 查看 explain plan

## 18.如何增加 buffer cache 的命中率？

在数据库较繁忙时，适用 buffer cache advisory 工具，查询 v$db_cache_advice 如果有必要更改，可以使用 alter system set db_cache_size 命令

## 19.ORA-01555 的应对方法？

具体的出错信息是 snapshot too old within rollback seg ， 通常可以通过增大 rollback seg 来解决问题。当然也需要查看一下具体造成错误的 SQL 文本

## 20.解释 ORACLE_BASE 和 ORACLE_HOME 的区别

ORACLE_BASE 是 oracle 的根目录，ORACLE_HOME 是 oracle 产品的目录。

## 21.说一下什么是 Oracle 分区

分区的实质是把一张大表的数据按照某种规则使用多张子表来存储。

然后这多张子表使用统一的表名对外提供服务，子表实际对用户不可见。类似于在多张子表上简历一个视图，然后用户直接使用该视图来访问数据。

## 22. Oracle 分区在什么情况下使用

当一张表的数据量到达上亿行的时候，表的性能会严重降低，这个时候就需要用到分区了，通过划分成多个小表，并在每个小表上建立本地索引可以大大缩小索引数据文件的大小，从而更快的定位到目标数据来提升访问性能。

分区除了可以用来提升访问性能外，还因为可以指定分区所使用的表空间，因此也用来做数据的生命周期管理。当前需要频繁使用的活跃数据可以放到访问速度更快但价格也更贵的存储设备上，而 2、3 年前的历史数据，或者叫冷数据可以放到更廉价、速度更低的设备上，从而降低存储费用。

## 23.说一下，Oracle 的分区有几种

Oracle 的分区可以分为：列表分区、范围分区、散列分区（哈希分区）、复合分区。

**列表分区：**

列表分区明确指定了根据某字段的某个具体值进行分区，而不是像范围分区那样根据字段的值范围来划分的。

**范围分区：**

1. 就是根据数据库表中某一字段的值的范围来划分分区。
2. 数据中有空值，Oracle 机制会自动将其规划到 maxvalue 的分区中。

**散列分区（哈希分区）**

1. 根据字段的 hash 值进行均匀分布，尽可能地实现各分区所散列的数据相等。
2. 散列分区即为哈希分区，Oracle 采用哈希码技术分区，具体分区如何由 Oracle 说的算，也可能我下一次搜索就不是这个数据了。

**复合分区**

根据范围分区后，每个分区内的数据再散列地分布在几个表空间中，这样我们就要使用复合分区。复合分区是先使用范围分区，然后在每个分区同再使用散列分区的一种分区方法。

## 24.在千万级的数据库查询中，如何提高效率？

分别从数据库设计方面、SQL 优化语句方面，物理优化方面

**数据库设计方面**

对查询进行优化，应尽量避免全表扫描，首先应考虑在where及orderby涉及的列上建立索引；

应尽量避免在 where 子句中对字段进行 null 值判断，否则将导致引擎放弃使用索引而进行全表扫描，如： select id from t where num is null 可以在 num 上设置默认值 0 ，确保表中 num 列没有 null 值，然后这样查询：select id from t where num = 0

并不是所有索引对查询都有效，SQL是根据表中数据来进行查询优化的，当索引列有大量数据重复时，查询可能不会去利用索引如一表中有字段sex、male、female几乎各占一半，那么即使在sex上建了索引也对查询效率起不了作用；

索引并不是越多越好，索引固然可以提高相应的 select 的效率，但同时也降低了 insert 及 update 的效率，因为 insert 或 update 时有可能会重建索引，所以怎样建索引需要慎重考虑，视具体情况而定。一个表的索引数最好不要超过 6 个，若太多则应考虑一些不常使用到的列上建的索引是否有必要。

应尽可能的避免更新索引数据列，因为索引数据列的顺序就是表记录的物理存储顺序，一旦该列值改变将导致整个表记录的顺序的调整，会耗费相当大的资源若应用系统需要频繁更新索引数据列，那么需要考虑是否应将该索引建为索引；

尽量使用数字型字段，若只含数值信息的字段尽量不要设计为字符型，这会降低查询和连接的性能，并会增加存储开销。这是因为引擎在处理查询和连接时会逐个比较字符串中每一个字符，而对于数字型而言只需要比较一次就够了。

尽可能的使用varchar/nvarchar代替char/nchar，因为首先变长字段存储空间小，可以节省存储空间，其次对于查询来说，在一个相对较小的字段内搜索效率显然要高些；

尽量使用表变量来代替临时表。如果表变量包含大量数据，请注意索引非常有限（只有主键索引）。

避免频繁创建和删除临时表，以减少系统表资源的消耗；

临时表并不是不可使用，适当地使用它们可以使某些例程更有效，例如，当需要重复引用大型表或常用表中的某个数据集时。但是，对于一次性事件，最好使用导出表。

在新建临时表时，如果一次性插入数据量很大，那么可以使用selectinto代替createtable，避免造成大量log，以提高速度；如果数据量不大，为了缓和系统表的资源，应先createtable，然后insert；

如果使用到了临时表，在存储过程的最后务必将所有的临时表显式删除，先 truncate table，然后 drop table，这样可以避免系统表的较长时间锁定。

**从SQL 语句方面**

应尽量避免在where子句中使用!=或<操作符，否则将引擎放弃使用索引而进行全表扫描；

应尽量避免在 where 子句中使用 or 来连接条件，否则将导致引擎放弃使用索引而进行全表扫描，如：select id from t where num = 10 or num = 20 可以这样查间：select id from t where num = 10 union all select id from t where num = 20

in和notin也要慎用，否则会导致全表扫描，如：selectidfromtwherenumin(1,2,3)对于连续的数值，能用between就不要用in了：selectidfromtwherenumbetween1and3；

下面的查询也将导致全表扫描：select id from t where name like '%abc%'

如果在where子句中使用参数，也会导致全表扫描因为SQL只有在运行时才会解析局部变量，但优化程序不能将访问计划的选择推迟到运行时；它必须在编译时进行选择然而，如果在编译时建立访问计划，变量的值还是未知的，因而无法作为索引选择的输入项如下面语句将进行全表扫描：selectidfromtwherenum=@num可以改为强制查询使用索引：selectidfromtwith(index(索引名)wherenum=@num；

应尽量避免在 where 子句中对字段进行表达式操作，这将导致引擎放弃使用索引而进行全表扫描。 如：select id from t where num/2 = 100 应改为：select id from t where num = 100*2

应尽量避免在where子句中对字段进行函数操作，这将导致引擎放弃使用索引而进行全表扫描；

如：select id from t where substring(name,1,3) = ‘abc’ - name 以 abc 开头的 id

select id from t where datediff(day,createdate,‘2005-11-30’) = 0 - ‘2005-11-30’ 生成的 id

应改为：select id from t where name like ‘abc%’ ,

select id from t where createdate = ‘2005-11-30’ and createdate < ‘2005-12-1’ 不要在 where 子句中的 " = " 左边进行函数、算术运算或其他表达式运算，否则系统将可能无法正确使用索引。

如需要生成一个空表结构：select col1,col2 intot from t where1 = 0 这类代码不会返回任何结果集，但是会消耗系统资源的，应改成这样：create tablet(...)

很多时候用exists代替in是一个好的选择：；

select num from a where num in(select num from b)

用下面的语句替换：select num from a where exists(select 1 from b where num = a.num)

任何地方都不要使用 select from t，用具体的字段列表代替 "" ,不要返回用不到的任何字段。

尽量避免使用游标，因为游标的效率较差，如果游标操作的数据超过1万行，那么就应该考虑改写；

尽量避免向客户返回大数据量，若数据量过大，应该考虑相应需求是否合理。

尽量避免大事务操作，提高系统并发能力；

**物理优化方面**

1. Oracle 的运行环境（网络，硬件等）
2. 使用合适的优化器
3. 合理配置 oracle 实例参数
4. 建立合适的索引（减少 IO )
5. 将索引数据和表数据分开在不同的表空间上（降低O冲突）
6. 建立表分区，将数据分别存储在不同的分区上（以空间换取时间，减少 IO )

## 25.使用存储过程访问数据库比直接用SQL语句访问有何优点？

1. 存储过程是预编译过的，执行时不须编译，执行速度更快。
2. 存储过程封装了多条 SQL ，便于维护数据的完整性与一致性。
3. 实现代码复用。

## 26.索引是用来干什么的？有那些约束建立索引？

**说下你怎么使用索引的？使用索引的好处和坏处？**

1. 索引用于对指定字段查询时，提升查询速度。
2. 主要有 B 树索引，位图索引，函数索引。
3. 对查询频率比较高的字段做索引，但一张表不要做太多索引。
4. 索引能提升查询效率，但它占用存储空间，且在更新数据时也会影响更新效率。

## 27.说下内连接，左连接，右连接的区别

**内连接：**

指主表，从表中符合连接条件的记录全部显示

**左连接：**

外连接方式，主要是显示主表，从表中符合连接条件的记录，并且主表中所有不符合连接条件的记录也要显示。

**右连接：**

外连接方式，主要是显示主表，从表中所有符合连接条件的记录，并且从表中不符合的记录也要显示。

## 28.说说 Oracle 中经常使用到的函数

length 长度、lower 小写、upper 大写、to_date 转化日期、to_char 转化字符、to_number 转化数字、Ltrim 去左边空格、rtrim 去右边空格、substr 截取字符串、add month 增加或减掉月份

## 29.truncate 和 delete 区别

1. Truncate 和 delete 都可以将数据实体删掉，truncate 的操作并不记录到 rollback 日志，所以操作速度较快，但同时这个数据不能恢复
2. Delete 操作不腾出表空间的空间
3. Truncate 不能对视图等进行删除
4. Truncate 是数据定义语言(DDL)，而 delete 是数据操纵语言(DML)

## 30.存储过程、函数、游标在项目中怎么用的

**存储过程：**

1. 能够批量执行的一组 SQL 语句，且容易控制事务。但没有返回值，可以通过设置 in out | out 类型的参数返回结果
2. 存储过程可以没有参数，不需要返回值

**函数：**

与存储过程相似，函数可以没有参数，但是一定需要一个返回值

**游标：**

游标类以指针，游标可以执行多个不相关的操作，如果希望当产生了结果集后，对结果集中的数据进行多种不相关的数据操作

## 31.存储过程的操作 当它抛出异常的时候 你是如何解决的 用了什么技术

1. 中止当前语句执行，转到 exception 语句块执行。
2. 在异常处理时，捕获相应异常，并执行对应解决方案语句。

## 32. Oracle 的游标在存储过程里是放在 begin 与 end 的里面还是外面？

**Oracle的存储过程跟函数你写没有？项目中用到没有？怎么用的**？

1. 放在 begin 与 end 之间。
2. 用作多表连接查询数据返回结果查询。
3. 复杂的业务操作，涉及多表的数据操作的事务控制。
4. 预防 SQL 注入。

## 33. oracle 中存储过程，游标和函数的区别

1. 游标类似指针，游标可以执行多个不相关的操作如果希望当产生了结果集后，对结果集中的数据进行多种不相关的数据操作
2. 函数可以理解函数是存储过程的一种；函数可以没有参数，但是一定需要一个返回值，存储过程可以没有参数，不需要返回值；两者都可以通过 out 参数返回值，如果需要返回多个
3. 参数则建议使用存储过程；在 SQL 数据操纵语句中只能调用函数而不能调用存储过程

## 34.解释什么是死锁，如何解决Oracle中的死锁？

简言之就是存在加了锁而没有解锁，可能是使用锁没有提交或者回滚事务，如果是表级锁则不能操作表，客户端处于等在状态，如果是行级锁则不能操作锁定行

**解决办法：**

**查找出被锁的表**

java
select b.owner,b.object_name,a.session_id,a.locked_mode
from v$locked_object a,dba_objects b
where b.object_id a.object_id;

select b.username,b.sid,b.serial#,logon_time
from v$locked_object a,v$session b
where a.session_id b.sid order by b.logon_time;

**杀进程中的会话**

java
alter system kill session "sid,serial#";

## 35.不借助第三方工具，怎样查看 SQL 的执行计划

java
set autot on
explain plan set statement_id =&item_id for &sql
select from table(dbms_xplan.display);

## 36.如何定位重要（消耗资源多）的 SQL

java
select sql_text
from v$sql
where disk_reads 1000 or (executions 0 and
buffer_gets/executions 30000);

## 37.触发器的作用有哪些？

1. 触发器可通过数据库中的相关表实现级联更改；通过级联引用完整性约束可以更有效地执行这些更改。
2. 触发器可以强制比用 CHECK 约束定义的约束更为复杂的约束。与 CHECK 约束不同，触发器可以引用其它表中的列。例如，触发器可以使用另个表中的 SELECT 比较插入或更新的数据，以及执行其它操作，如修改数据或显示用户定义错误信息。
3. 触发器还可以强制执行业务规则
4. 触发器也可以评估数据修改前后的表状态，并根据其差异采取对策。

## 38. Oralce 怎样存储文件，能够存储哪些文件？

1. Oracle 能存储 clob、nclob、blob、bfile
2. Clob 可变长度的字符型数据，也就是其他数据库中提到的文本型数据类型
3. Nclob 可变字符类型的数据，不过其存储的是 Unicode 字符集的字符数据
4. Blob 可变长度的二进制数据
5. Bfile 数据库外面存储的可变二进制数据

## 39.说下如何使用 Oracle 的游标？

1. oracle 中的游标分为显示游标和隐式游标
2. 显示游标是用 cursor...is 命令定义的游标，它可以对查询语句 (select) 返回的多条记录进行处理；隐式游标是在执行插入 (insert) 、删除 (delete) 、修改 (update) 和返回单条记录的查询 (select) 语句时由 PL/SQL 自动定义的。
3. 显式游标的操作：打开游标、操作游标、关闭游标；PL/SQL 隐式地打开 SQL 游标，并在它内部处理 SQL 语句，然后关闭它

## 40.说下 Oracle 中 function 和 procedure 的区别？

1. 可以理解函数是存储过程的一种
2. 函数可以没有参数，但是一定需要一个返回值，存储过程可以没有参数，不需要返回值
3. 函数 return 返回值没有返回参数模式，存储过程通过 out 参数返回值，如果需要返回多个参数则建议使用存储过程
4. 在 SQL 数据操纵语句中只能调用函数而不能调用存储过程

## 41.说下 Oracle 的导入导出有几种方式，有何区别？

1. 使用 Oracle 工具 exp/imp
2. 使用 PLSQL 相关工具

方法1. 导入/导出的是二进制的数据

方法2. PLSQL 导入/导出的是 SQL 语句的文本文件

## 42.说下 Oracle 中有哪几种文件？

1. 数据文件（一般后缀为 .dbf 或者 .ora )
2. 日志文件（后缀名.log)
3. 控制文件（后缀名为.c

## 43.说下 oracle 中 DML、DDL、DCL的使用有哪些

1. DML数据操纵语言，如 select、update、delete、insert
2. DDL 数据定义语言，如 create table、drop table 等等
3. DCL 数据控制语言，如commit、rollback、grant、invoke等

## 44.说下怎样创建一个视图，视图的好处，视图可以控制权限吗？

java

create view 视图名 as select 列名 [别名] ... from 表 [unio [all] select ... ]]

**好处：**

1. 可以简单的将视图理解为 SQL 查询语句，视图最大的好处是不占系统空间
2. 一些安全性很高的系统，不会公布系统的表结构，可能会使用视图将一些敏感信息过虑或者重命名后公布结构
3. 简化查询
4. 视图可以控制权限的，在使用的时候需要将视图的使用权限 grant 给用户

## 45.说下 Oracle 的锁有几种，定义分别是什么？

1. 行共享锁(ROW SHARE)
2. 行排他锁(ROW EXCLUSIVE)
3. 共享锁(SHARE)
4. 共享行排他锁(SHARE ROW EXCLUSIVE)
5. 排他锁(EXCLUSIVE)

**Oracle 锁具体分为以下几类：**

1.按用户与系统划分，可以分为自动锁与显示锁

1. 自动锁：当进行一项数据库操作时，缺省情况下，系统自动为此数据库操作获得所有有必要的锁。
2. 显示锁：某些情况下，需要用户显示的锁定数据库操作要用到的数据，才能使数据库操作执行得更好，显示锁是用户为数据库对象设定的。

2.按锁级别划分，可分为共享锁与排它锁

**共享锁：**

共享锁使一个事务对特定数据库资源进行共享访问一一另一事务也可对此资源进行访问或获得相同共享锁。共享锁为事务提供高并发性，但如拙劣的事务设计 + 共享锁容易造成死锁或数据更新丢失。

**排它锁：**

事务设置排它锁后，该事务单独获得此资源，另一事务不能在此事务提交之前获得相同对象的共享锁或排它锁。

3.按操作划分，可分为 DML 锁、DDL 锁。DML 锁又可以分为，行锁、表锁、死锁

**DML锁：**

1. **行锁：** 当事务执行数据库插入、更新、删除操作时，该事务自动获得操作表中操作行的排它锁。
2. **表级锁：** 当事务获得行锁后，此事务也将自动获得该行的表锁（共享锁），以防止其它事务进行 DDL 语句影响记录行的更新。事务也可以在进行过程中获得共享锁或排它锁，只有当事务显示使用 LOCK TABLE 语句显示的定义一个排它锁时，事务才会获得表上的排它锁，也可使用 LOCK TABLE 显示的定义一个表级的共享锁 (LOCK TABLE具体用法请参考相关文档)。
3. **死锁：** 当两个事务需要一组有冲突的锁，而不能将事务继续下去的话，就会出现死锁。

java
如事务 1 在表A行记录3 中有一排它锁，并等待事务2在表A中记录#4中排它锁的释放，而事务2在表A记录行#4中有一排它锁，并等待事务；1在表A中记录#3中排它锁的释放，事务1与事务2彼此等待，因此就造成了死锁。

死锁一般是因拙劣的事务设计而产生，死锁只能使用 SQL 下：alter system kill session "sid,serial#"; 或者使用相关操作系统 kill 进程的命令，如 UNlX 下 kill -9 sid ,或者使用其它工具杀掉死锁进程。

**DDL锁：**

**DDL锁又可以分为：**

排它 DDL 锁、共享 DDL 锁、分析锁

1. **排它 DDL 锁：** 创建、修改、删除一个数据库对象的 DDL 语句获得操作对象的排它锁。如使用 alter table 语句时，为了维护数据的完成性、一致性、合法性，该事务获得一排它 DDL 锁。
2. **共享 DDL 锁：** 需在数据库对象之间建立相互依赖关系的 DDL 语句通常需共享获得 DDL 锁。如创建一个包，该包中的过程与函数引用了不同的数据库表，当编译此包时，该事务就获得了引用表的共享 DDL 锁。
3. **分析锁：** ORACLE 使用共享池存储分析与优化过的 SQL 语句及 PL/SQL 程序，使运行相同语句的应用速度更快。在一个在共享池中缓存的对象获得它所引用数据库对象的分析锁。分析锁是一种独特的 DDL 锁类型，ORACLE使用它追踪共享池对象及它所引用数据库对象之间的依赖关系。当一个事务修改或删除了共享池持有分析锁的数据库对象时，ORACLE 使共享池中的对象作废，下次在引用这条 SQL/PLSQL 语句时，ORACLE 重新分析编译此语句。
4. **内部闩锁**
5.

内部闩锁：这是 ORACLE 中的一种特殊锁，用于顺序访问内部系统结构。当事务需向缓冲区写入信息时，为了使用此块内存区域，ORACLE 首先必须取得这块内存区域的闩锁，才能向此块内存写入信息。

## 46. delete 与 Truncate 区别？

1. Truncate 是 DDL 语句，DELETE 是 DML 语句。
2. Truncate 的速度远快于 DELETE;

**原因是：** 当执行 DELETE 操作时所有表数据先被 copy 到回滚表空间，数据量不同花费时间长短不一。而 TRUNCATE 是直接删除数据不进回滚表空间。
3. delete 数据可以运行 Rollback 进行数据回滚。而 Truncate 则是永久删除不能回滚。
4. Truncate 操作不会触发表上的 delete 触发器，而 delete 会正常触发。
5. Truncate 语句不能带 where 条件意味着只能全部数据删除，而 DELETE 可带 where 条件进行删除数据。
6. Truncate 操作会重置表的高水位线（High Water Mark），而 delete 不会。

## 47.集合操作符

1. Union：不包含重复值，默认按第一个查询的第一列升序排列。
2. Union ALL：完全并集包含重复值。不排序。
3. Minus 不包含重复值，不排序。

## 48.数据库的三大范式是什么？

1. 第一范式：原子性，要求每一列的值不能再拆分了。
2. 第二范式：一张表只描述一个实体（若列中有冗余数据，则不满足）。
3. 第三范式：所有列与主键值直接相关。

## 49.事务的特性(ACID)是指什么？

1. 原子性（Atomic）：事务中的各项操作，要么全做要么全不做，任何一项操作的失败都会导数整个事务的失败。
2. 一致性（Consistent）：事务结束后系统状态是一样的。
3. 隔离性（Isolated）：并发执行的事务彼此无法看到对方的中间状态。
4. 持久性（Durable）：事务完成后，即使发生灾难性故障，通过日志和同步备份可以在故障发生后重建数据。

## 50. MySQL 数据库与 Oracle 数据库有什么区别？

1. 应用方面，MySQL 是中小型应用的数据库。一般用于个人和中小型企业。Oracle 属于大型数据库，一般用于具有相当规模的企业应用。
2. 自动增长的数据类型方面：MySQL 有自动增长的数据类型。Oracle 没有自动增长的数据类型。需要建立一个自增序列。
3. group by 用法：MySQL 中 group by 在 SELECT 语句中可以随意使用，但在 ORACLE 中如果查询语句中有组函数，那么其他列必须是组函数处理过的或者是 group by 子句中的列，否则会报错。
4. 引导方面：MySQL 中可以用单引号、双引号包起字符串，Oracle 中只可以用单引号包起字符串。

## 51. Oracle 跟 SQL Server 2005 的区别？

**宏观上：**

1. 最大的区别在于平台，oracle 可以运行在不同的平台上，SQL Server 只能运行在 Windows 平台上，由于 Windows 平台的稳定性和安全性影响了 SQL Server 的稳定性和安全性
2. oracle 使用的脚本语言为 PL-SQL，而SQL Server 使用的脚本为T-SQL

**微观上**

从数据类型，数据库的结构等等回答

## 52.如何使用 Oracle 的游标？

1. oracle 中的游标分为显示游标和隐式游标
2. 显示游标是用 cursor…is 命令定义的游标，它可以对查询语句 (select) 返回的多条记录进行处理；隐式游标是在执行插入 (insert) 、删除 (delete) 、修改 (update) 和返回单条记录的查询 (select) 语句时由 PL/SQL 自动定义的。
3. 显式游标的操作：打开游标、操作游标、关闭游标；PL/SQL 隐式地打开 SQL游标，并在它内部处理 SQL 语句，然后关闭它

## 53. 解释 data block，extent 和 segment 的区别？

1. data block 数据块，是 oracle 最小的逻辑单位，通常 oracle 从磁盘读写的就是块
2. extent 区，是由若干个相邻的 block 组成
3. segment 段，是有一组区组成
4. tablespace 表空间，数据库中数据逻辑存储的地方，一个 tablespace 可以包含多个数据文件

## 54.怎样创建一个一个索引，索引使用的原则，有什么优点和缺点

**创建标准索引：** CREATE INDEX 索引名 ON 表名 (列名) TABLESPACE 表空间名;

**创建唯一索引：** CREATE unique INDEX 索引名 ON 表名 (列名) TABLESPACE 表空间名;

**创建组合索引：** CREATE INDEX 索引名 ON 表名（列名1，列名2）TABLESPACE 表空间名;

**创建反向键索引：** CREATE INDEX 索引名 ON 表名（列名）reverse TABLESPACE 表空间名;

**索引使用原则：**

1. 索引字段建议建立 NOT NULL 约束
2. 经常与其他表进行连接的表，在连接字段上应该建立索引;
3. 经常出现在 where 子句中的字段且过滤性很强的，特别是大表的字段，应该建立索引;
4. 可选择性高的关键字，应该建立索引；
5. 可选择性低的关键字，但数据的值分布差异很大时，选择性数据比较少时仍然可以利用索引提高效率

**复合索引的建立需要进行仔细分析；尽量考虑用单字段索引代替**

1. 正确选择复合索引中的第一个字段，一般是选择性较好的且在 where 子句中常用的字段上；
2. 复合索引的几个字段经常同时 AND 方式出现在 where 子句中可以建立复合索引；否则单字段索引；
3. 如果复合索引中包含的字段经常单独出现在 where 子句中，则分解为多个单字段索引；
4. 如果复合索引所包含的字段超过3个，那么仔细考虑其必要性，考虑减少复合的字段；
5. 如果既有单字段索引，又有这几个字段上的复合索引，一般可以删除复合索引；

频繁 DML 的表，不要建立太多的索引；

不要将那些频繁修改的列作为索引列；

**索引的优缺点：**

**优点：**

1. 创建唯一性索引，保证数据库表中每一行数据的唯一性
2. 大大加快数据的检索速度，这也是创建索引的最主要的原因
3. 加速表和表之间的连接，特别是在实现数据的参考完整性方面特别有意义
4. 在使用分组和排序子句进行数据检索时，同样可以显著减少查询中分组和排序的时间

**缺点：**

1. 索引创建在表上，不能创建在视图上
2. 创建索引和维护索引要耗费时间，这种时间随着数据量的增加而增加
3. 索引需要占物理空间，除了数据表占数据空间之外，每一个索引还要占一定的物理空间，如果要建立聚簇索引，那么需要的空间就会更大
4. 当对表中的数据进行增加、删除和修改的时候，索引也要动态的维护，降低了数据的维护速度

## 55.如何判断数据库的时区？

java

SELECT DBTIMEZONE FROM DUAL;

## 56.解释GLOBAL NAMES设为TRUE的用途？

GLOBAL_NAMES 指明联接数据库的方式。如果这个参数设置为 TRUE ，在建立数据库链接时就必须用相同的名字连结远程数据库

## 57.如何加密 PL/SQL 程序？

WRAP

## 58.解释 FUNCATION,PROCEDURE 和 PACKAGE 区别

function 和 procedure 是 PL/SQL 代码的集合，通常为了完成一个任务。

procedure 不需要返回任何值而 function 将返回一个值

Package 是为了完成个商业功能的一组 function 和 proceudre 的集合

## 59.解释TABLE Function的用途

TABLE Function 是通过 PL/SQL 逻辑返回一组纪录，用于普通的表/视图。他们也用于 pipeline 和 ETL 过程。

## 60.举出 3 种可以收集 three advisory statistics

Buffer Cache Advice，Segment Level Statistics，Timed Statistics

## 61. Audit trace 存放在哪个 oracle 目录结构中？

unix $ORACLE_HOME/rdbms/audit Windows the event viewer

## 62.解释 materialized views的作用

Materialized views 用于减少那些汇总，集合和分组的信息的集合数量。它们通 常适合于数据仓库和 DSS 系统。

## 63.当用户进程出错，哪个后台进程负责清理它

PMON

## 64.哪个后台进程刷新 materialized views？

The Job Queue Processes.

## 65.如何判断哪个 session 正在连结以及它们等待的资源？

\V SESSION_WAIT

## 66.描述什么是 redo logs

Redo Logs 是用于存放数据库数据改动状况的物理和逻辑结构。可以用来修复数据库

## 67.如何进行强制 LOG SWITCH?

ALTER SYSTEM SWITCH LOGFILE;

## 68.举出两个判断 DDL 改动的方法？

你可以使用 Logminer 或 Streams

## 69. Coalescing 做了什么？

Coalescing 针对于字典管理的 tablespace 进行碎片整理，将临近的小 extent合并成单个的大extent

## 70. TEMPORARY tablespace 和 PERMANENT tablespace 的区别是？

A temporary tablespace 用于临时对象例如排序结构而 tablespaces 用来存储那些'真实'的对象（例如表，回滚段等）

## 71.创建数据库时自动建立的tablespace名称？

SYSTEM tablespace.

## 72.创建用户时，需要赋予新用户什么权限才能使它联上数据库

CONNECT

## 73.如何在 tablespace 里增加数据文件？

ALTER TABLESPACE <tablespace_name ADD DATAFILE <datafile_name SIZE

## 74.如何变动数据文件的大小？

ALTER DATABASE DATAFILE <datafile_nameRESIZE <new_size;

## 75.哪个VMEW用来检意数据文件的大小？

DBA DATA FILES

## 76.哪个VIEW用来判断tablespace的剩余空间

DBA FREE SPACE

## 77.如何判断谁往表里增加了一条纪录？

auditing

## 78.如何重构索引？

ALTER INDEX <index_name REBUILD;

## 79.解释什么是Partitioning(分区)以及它的优点。

Partition将大表和索引分割成更小，易于管理的分区。

## 80.你刚刚编译了一个 PL/SQL Package 但是有错误报道，如何显示出错信息？

SHOW ERRORS

## 81.如何搜集表的各种状态数据？

ANALYZE

The ANALYZE command

## 82.如何启动 SESSION 级别的 TRACE

**解答：**

DBMS SESSION.SET_SQL_TRACE

ALTER SESSION SET SOL_TRACE = TRUE;

这两个 ORACLE 工具都是用来将数据导入数据库的。

**区别是：** IMPORT 工具只能处理 由另一个 ORACLE 工具 EXPORT 生成的数据。而 SQL*LOADER 可以导入不同的 ASCII 格式的数据源

## 83.用于网络连接的 2 个文件？

TNSNAMES.ORA and SQLNET.ORA

## 84.解释什么是 Oracle Forms ?

Oracle Forms 是用于创建与 Oracle 数据库交互的软件产品。它有一个lDE，包括一个属性表，对象导航器和使用 PL/SQL 的代码编辑器。

## 85.解释 Oracle 表单服务组件包括什么？

**Oracle表单包含：**

客户端：客户端发送HTTP请求

窗口监听器Servlet：它启动，停止并与窗体运行进程通信

表单运行过程：它执行特定表单应用程序中包含的代码

数据库：从数据库中获取的数据

## 86.提及 11g 版本 2 中 Oracle Forms Services 中引入的新功能是什么？

在Oracle Form's Services中，包括的功能包括：与 Oracle Access Manager 集成 计划表格运行预备 增强的网络统计报告 支持Unicode列 guiMode配置参数 表单指标代理 支持图像项目和图标按钮中的URL Oracle 真正的用户体验洞察

## 87.解释CALL_FORM,NEW_FORM和OPEN_FORM之间有什么区别？

CALL FORM:它启动一个新窗体并传递控件 New FORM:它终止当前窗体并用指定的新窗体替换它

OPEN FORM:打开指定的新表单，而不更换或暂停父表单。

## 88.列出0 racle Forms配置文件？

Oracle Forms配置文件包括： 基本HTML文件(base.htm,basejini..htm,basejpi.htm baseie.htm) ENV CFG DEVLOBER

## 89.在Oracle Forms Report中，Record组列的最大长度是多少？什么是不同类型的记录组？

**记录组列名的最大长度不能超过30个字符。**

**不同类型的记录组包括：**

查询记录组

状态记录组

非查询记录组

## 90.提示窗体中触发的顺序是什么？

表单打开时，触发序列 预成型 预块 预录 前文项 实例 当新形式的实例 当新块实例 当新记录实例 当新项目实例

## 91.提到一个项目的“验证LOV”属性？提到lov和list项目有什么区别？

当验证的LOV设置为True时，Oracle Forms将文本项的当前值与LOV中显示的第一列中的值进行比较。LOV是列表项的属性。列表项只能有一列，而lov可以有一个或多个列

## 92.说明如何使用相同的LOV2列？

我们可以通过在全局值中传递返回值并使用代码中的全局值，将相同的LOV用于2列。\

## 93.什么是绑定变量？

报表 6i 中使用了绑定变量来替换 select 语句中的单个参数。

## 94.说明如何在指定的块中迭代项目和记录？

要遍历指定块中的项目和记录可以使用NEXT_FIELD来迭代特定块中的项，并且NEXT RECORD遍历块中的记录。

## 95.说明你可以将FMX转换或反向回到FMB文件吗？

不，不可能将FMX转换或反向回到FMB文件，以确保它们不会丢失。

## 96.可以从表单执行动态SQL吗？

是的，可以通过使用内置的FORMS_DDL或通过从表单调用DBNS_SQL数据库包从表单执行动态SQL。

## 97.pctused and pctfree表示什么含义有什么作用？

pctused与pctfree控制数据块是否出现在freelist中，pctfree控制数据块中保留用于update的空间，当数据块中的free space小于pctfree设置的空间时，该数据块从freelist中去掉当块由于dml操作free space大于pct used设置的空间时，该数据库块将被添加在freelist链表中。

## 98.简单描述table/sment/extent/blok之间的关系？

table创建时，默认创建了一个data segment,每个datasegment含有minextents指定的extents数，每个extent据据表空间的存储参数分配一定数量的blocks

## 99.描述tablespace和datafile之间的关系

一个tablespace可以有个或多个datafile,每个datafile只能在一个tablespace内，table中的数据，通过hash算法分布在tablespace中的各个datafile中，tablespace是逻辑上的概念，datafile则在物理上储存了数据库的种种对象。

## 100.本地管理表空间和字典管理表空间的特点，ASSM有什么特点？

本地管理表空间(LocallyManaged Tablespace简称LMT),8i以后出现的一种新的表空间的管理模式，通过位图来管理表空间的空间使用。字典管理表空间(Dictionary-ManagedTablespace简称DMT)8i以前包括以后都还可以使用的一种表空间管理模式，通过数据字典管理表空间的空间使用。动段空间管理(ASSM),它首次出现在Oracle920里有了ASSM,链接列表freelist被位图所取代，它是一个二进制的数组，能够迅速有效地管理存储扩展和剩余区块(free block),因此能够改善分段存储本质，ASSM表空间上创建的段还有另外一个称呼叫Bitmap ManagedSegments(BMB 段)

## 101.回滚段的作用是什么

**事务回滚：** 当事务修改表中数据的时候，该数据修改前的值（即前影像）会存放在回滚段中，当用户回滚事务(ROLLBACK)时，ORACLE将会利用回滚段中的数据前影像来将修改的数据恢复到原来的值。

**事务恢复：** 当事务正在处理的时候，例程失败，回滚段的信息保存在undo表空间中，ORACLE将在下次打开数据库时利用回滚来恢复未提交的数据。

1. **读一致性：** 当一个会话正在修改数据时，其他的会话将看不到该会话未提交的修改。
2. 一当一个语句正在执行时◇该语句将看不到从该语句开始执行后的未提交的修改（语句级读一致性）。
3. 当ORACLE执行Select语句时，ORACLE依照当前的系统改变号(SYSTECHANGE NUMBER-SCN)。
4. 来保证任何前于当前SCN的未提交的改变不被该语句处理。可以想象：当一个长时间的查询正在执行时。
5. 若其他会话改变了该查询要查询的某个数据块，ORACLE将利用回滚段的数据前影像来构造一个读一致性视图。

## 102.日志的作用是什么

记录数据库事务，最大限度地保证数据的一致性与安全性

重做日志文件：含对数据库所做的更改记录，这样万一出现故障可以启用数据恢复，一个数据库至少需要两个重做日志文件

归档日志文件：是重做日志文件的脱机副本，这些副本可能对于从介质失败中进行恢复很必要。

## 103.SGA主要有那些部分，主要作用是什么？

SGA:db_cache/shared_pool/large_pool/java_pooldb_cache: 数据库缓存(BlockBuffer)对于Oracle数据库的运转和性能起着非常关键的作用，它占据Oracle数据库SGA(系统共享内存区)的主要部分。Oracle数据库通过使用LRU算法，将最近访问的数据块存放到缓存中，从而优化对磁盘数据的访问。

**shared pool:**

共享池的大小对于Oracle性能来说都是很重要的。 共享池中保存数据字典高速缓冲和完全解析或编译的的PL/SQL块和SQL语句及控制结构。

**large_pool:**

使用MTS配置时，因为要在SGA中分配UGA来保持用户的会话，就是用Large_poor来保持这个会话内存使用RMAN做备份的时候，要使用Large_pool这个内存结构来做磁盘/O缓存器。

**java pool:**

为javaprocedure预备的内存区域，如果没有使用java_proc,,java_pool不是必须的。

## 104. oracle系统进程主要有哪些，作用是什么

数据写进程(dbwr)：负责将更改的数据从数据库缓冲区高速缓存写入数据文件。

日志写进程(lgwr)：将重做日志缓冲区中的更改写入在线重做日志文件。

1. 系统监控(smon)：检查数据库的一致性如有必要还会在数据库打开时启动数据库的恢复。
2. 进程监控(pmon)：负责在一个 Oracle 进程失败时清理资源。
3. 检查点进程(chpt)：负责在每当缓冲区高速缓存中的更改永久地记录在数据库中时，更新控制文件和数据文件中的数据库状态信息。
4. 归档进程(arcn)：在每次日志切换时把已满的日志组进行备份或归档。
5. 作业调度器(cjq)：负责将调度与执行系统中已定义好的job,完成一些预定义的工作。
6. 恢复进程(reco)：保证分布式事务的一致性，在分布式事务中，要么同时commit,要么同时rollback。
