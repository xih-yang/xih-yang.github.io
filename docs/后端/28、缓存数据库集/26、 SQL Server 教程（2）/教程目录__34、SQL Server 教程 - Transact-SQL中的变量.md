# 34、SQL Server 教程 - Transact-SQL中的变量
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/2/34.html
- 分类：缓存数据库
- 分组：教程目录
**1、** 局部变量；

DECLARE

[@local_variable [AS] data_type]

[，…n]

- @locaLvariable：局部变量名称。
- data_type:局部变量的数据类型，但不能是text、ntext或image数据类型。

**用SET语句和SELECT语句可以为变量赋值。**

SET@local_variable=value

SELECT @local_variable=value

**用SELECT语句和PRINT语句可以显示变量内容。**

SELECT @local_variable

PRINT @local_variable

```java
例  定义局部变量，并给其赋值，最后显示变量内容。
--定义局部变量name和age
DECLARE  @name  nvarchar(10)
DECLARE  @age   int
--给变量name和age赋值
SET @name='张三'
SELECT @age=20
--显示变量name和age的内容
PRINT @name
PRINT @age
例  使用SELECT语句给变量赋值。
DECLARE  @name  nchar (20)
SELECT @name = sname
FROM   stu_info
WHERE   sno = '0006'
PRINT  '学生姓名：'+@name
```

**2、** 全局变量；

全局变量

说  明

@@CONNECTIONS

返回SQLServer自上次启动以来尝试的连接数，无论连接是成功面是失败

@@CPU_BUSY

返回SQLServer由上次启动后的工作时间。其结果以CPU时间增量或“滴答数’表示，此值为所有CPU时同的累积

@@CURSOR_ROWS

返回连接上打开的上一个游标中的当前限定行的数目

@@DATEFIRST

返回SET DATEFIRST的当前。SET DATEFIRST是将一周的第一天设置为从1到7的数字

@@DBTS

返回当前数据库的当前timestamp数据类型的值

@@ERROR

返回执行的上一个T-SQL语句的错误号

@@FETCH_STATUS

回针对连接当前打开的任何游标发出的上一条游标语句的状态

@@IDENTITY

返回上次插入的标识值

@@IDLE

返回SQLServer自上次启动事的空闲时间。结果以CPU时间增量或“时钟周期”表示

@@IO_BUSY

返回自从SQLServer最近一次启动以来，SQL Server已经用于执行输入和输出操作的时间。其结果以CPU时间增量或“时钟周期”表示，并且是所有CPU的累积值

@@LANGID

返回当前使用的语言的本地语言标识符（ID）

@@LANGUAGE

返回当前所用语言的名称

@@LOCK_TIMEOUT

返回当前会话的当前锁定超时设置

@@MAX_CONNECTIONS

返回SQL Server实例允许同时进行的最大用户连接数。返回的数值不一定是当前配置的数值

@@MAX_PRECISION

按照服务器中的当前设置，返回decimal和numeric数据类型所有和的精度级别

@@NESTLEVEL

返回对本地服务器上执行的当前存储过程的嵌套级别，初始值为0

@@OPTIONS

返回有关当前SET选项的信息

@@PACK_RECEIVED

返回SQL Server自上次启动后从网络读取的输入数据包数

@@PACK_SENT

返回SQL Server自上次启动后写入网络的输出数据包数

@@PACKET_ERRORS

返回自上次启动SQL Server后在SQL Server连接上发生的网络数据包错误数

@@PROCID

返回Transct-SQL当前模块的对象标识符

@@REMSERVER

返回远程SQL Server数据库服务器在登录记录中显示的名称

@@ROWCOUNT

返回受上一语句影响的行数

@@SERVERNAME

返回运行SQL Server的本地服务器的名称

@@SERVICENAME

返回SQL Server正在其下运行的注册表项的名称。若当前实例为默认实例，则MSSQLSERVER，若当前实例是命名实例，则该函数返回该实例名

@@SPID

返回当前用户进程的会话ID

@@TEXTSIZE

返回SET语句中的TEXTSIZE选项的当前值

@@TIMETICKS

返回每下 个时钟周期的微秒数

@@TOTAL_ERRORS

返回SQL Server自上次启动之后所遇到的磁盘写入错误数

@@TOTAL_READ

返回SQLServer自上次启动后读取磁盘的次数

@@TATAL_WRITE

返回SQL Server自上次启动以来所执行的磁盘写数次数

@@TRANCOUNT

返回当前连接的活动事务数

@@VERSION

返回当前的SQL Server安装的版本、处理器体系结构、生成日期和操作系统。
