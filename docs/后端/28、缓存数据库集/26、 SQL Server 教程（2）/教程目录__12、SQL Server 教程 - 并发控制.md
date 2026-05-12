# 12、SQL Server 教程 - 并发控制
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/2/12.html
- 分类：缓存数据库
- 分组：教程目录
并发访问数据时，如果不加以控制，那么修改的数据将有可能影响到同一时间读取或修改相同数据的其他用户。不加并发控制的数据存储系统，将有可能发生：丢失更新、脏读、不一致的分析和幻像读。

锁定是数据库引擎为了避免数据出现异常，而限制多个用户在同一时间访问相同数据块的一种机制。锁定机制是通过锁(LOCK)来实现的，当对一个数据源加锁后，此数据源就有了一定的访问限制，也就是对此数据源进行了锁定。

在Microsoft SQL Server中，允许一个事务锁定不同类型的资源，包括数据行、表，也有可能是数据库本身。

## SQL Server 事务锁定

#### 数据库引擎可以锁定的资源。

资源
说明

RID
用于锁定堆中的单个行的行标识符。

KEY
索引中用于保护可序列化事务中的键范围的行锁。

PAGE
数据库中的 8 KB 页，例如数据页或索引页。

EXTENT
一组连续的八页，例如数据页或索引页。

HoBT
堆或 B 树。 用于保护没有聚集索引的表中的 B 树（索引）或堆数据页的锁。

TABLE
包括所有数据和索引的整个表。

FILE
数据库文件。

APPLICATION
应用程序专用的资源。

METADATA
元数据锁。

ALLOCATION_UNIT
分配单元。

DATABASE
整个数据库。

锁的模式根据需要处理的事件

#### 锁模式

SQLServer 数据库引擎使用不同的锁模式锁定资源，这些锁模式确定了并发事务访问资源的方式。

下表显示了数据库引擎使用的资源锁模式。

锁模式
说明

共享 (S)
用于不更改或不更新数据的读取操作，如 SELECT 语句。

更新 (U)
用于可更新的资源中。 防止当多个会话在读取、锁定以及随后可能进行的资源更新时发生常见形式的死锁。

排他 (X)
用于数据修改操作，例如 INSERT、UPDATE 或 DELETE。 确保不会同时对同一资源进行多重更新。

Intent
用于建立锁的层次结构。 意向锁包含三种类型：意向共享 (IS)、意向排他 (IX) 和意向排他共享 (SIX)。

架构
在执行依赖于表架构的操作时使用。 架构锁包含两种类型：架构修改 (Sch-M) 和架构稳定性 (Sch-S)。

大容量更新 (BU)
在将数据大容量复制到表中时使用，并指定TABLOCK提示。

键范围
当使用可序列化事务隔离级别时保护查询读取的行的范围。 确保再次运行查询时其他事务无法插入符合可序列化事务的查询的行。

查看活跃事务

DBCC OPENTRAN

[
(['database_name' | database_id | 0])

{[ WITH TABLERESULTS ][,[NO_INFOMSGS]]}

]

示例1： 得到数据库中活跃的事务和锁的信息。

要求开启事务，对表test表进行删除操作。需要对表指定排他锁，利用DBCC OPENTRAN命令查询Test数据库活动的事务信息

useAdventureWorks

go

BEGIN TRANSACTION

DELETE

FROM test

WITH (TABLOCKX)

WHERE id=1

DBCC OPENTRAN('Test')

### sys.dm_tran_locks (Transact-SQL)

查询当前活动的锁管理器资源的信息：

SELECT request_session_id,

resource_type AS type,

resource_database_id,

request_status

FROM sys.dm_tran_locks
