# 03、Oracle 入门教程 - 启动和关闭 Oracle 数据库实例
- 来源：https://ddkk.com/zhuanlan/db/oracle/2/3.html
- 分类：缓存数据库
- 分组：教程目录
## 一、启动数据库实例

Oracle数据库实例的启动过程分为3个步骤，分别是启动实例、加载数据库、打开数据库。用户可以根据实际情况的需要，以不同的模式启动数据库。

启动数据库所使用的命令格式如下：

```java
STARTUP [nomount|mount|open|force] [restrict] [pfile=filename]
```

- nomount：表示启动实例不加载数据库。
- mount：表示启动实例、加载数据库并保持数据库的关闭状态。
- open：表示启动实例、加载并打开数据库，这个是默认选项。
- force：表示终止实例并重新启动数据库。
- restrict：用于指定以受限制的会话方式启动数据库。
- pfile：于指定启动实例时所使用的文本参数文件，filename就是文件名。

### 1.1 NOMOUNT 模式

这种启动模式只会创建实例（即创建Oracle实例的各种内存结构和服务进程），并不加载数据库，也不会打开任何数据文件。

使用NOMOUNT模式启动数据库实例示例：

```java
SQL> connect system/test as sysdba
已连接。
SQL> shutdown immediate
数据库已经关闭。
已经卸载数据库。
ORACLE 例程已经关闭。
SQL> startup nomount
ORACLE 例程已经启动。
Total System Global Area 6814535680 bytes
Fixed Size                  2188688 bytes
Variable Size            3539995248 bytes
Database Buffers         3254779904 bytes
Redo Buffers               17571840 bytes
```

在上面的示例代码中，首先用户要以sysdba的身份登录，才具有关闭和启动数据实例的权限。在使用shutdown命令关闭数据库实例之后，然后使用startup nomount命令启动数据库实例。

通常在创建新数据库或重建控制文件时，使用NOMOUNT模式启动数据库实例。

NOMOUNT模式通常在进行数据库维护时使用。比如，执行数据库完全恢复操作、更改数据库的归档模式等。

### 1.2 MOUNT 模式

这种模式将启动实例、加载数据库并保持数据库的关闭状态。

使用MOUNT模式启动数据库实例示例：

```java
SQL> connect system/test as sysdba
已连接。
SQL> shutdown immediate
数据库已经关闭。
已经卸载数据库。
ORACLE 例程已经关闭。
SQL> startup mount
ORACLE 例程已经启动。
Total System Global Area 6814535680 bytes
Fixed Size                  2188688 bytes
Variable Size            3539995248 bytes
Database Buffers         3254779904 bytes
Redo Buffers               17571840 bytes
数据库装载完毕。
```

上面的代码中，首先使用shutdown命令关闭数据库实例，然后再使用startupmount命令启动数据库实例。

### 1.3 OPEN 模式

这种模式将启动实例、加载并打开数据库，这就是常规的启动模式，用户想要对数据库进行多种操作，就必须使用OPEN模式启动数据库实例。

使用OPEN模式启动数据库实例示例：

```java
SQL> connect system/test as sysdba
已连接。
SQL> shutdown immediate
ORA-01109: 数据库未打开
已经卸载数据库。
ORACLE 例程已经关闭。
SQL> startup
ORACLE 例程已经启动。
Total System Global Area 6814535680 bytes
Fixed Size                  2188688 bytes
Variable Size            3539995248 bytes
Database Buffers         3254779904 bytes
Redo Buffers               17571840 bytes
数据库装载完毕。
数据库已经打开。
```

在上面的代码中，startup命令的后面不带有任何参数， 就表示以OPEN模式启动数据库实例。

### 1.4 FORCE模式

这种模式将终止实例并重新启动数据库，这种启动模式具有一定的强制性。 比如，在其他启动模式失效时，可以尝试使用这种启动模式。

使用FORCE模式启动数据库实例示例：

```java
SQL> connect system/test as sysdba
已连接。
SQL> shutdown immediate
数据库已经关闭。
已经卸载数据库。
ORACLE 例程已经关闭。
SQL> startup force
ORACLE 例程已经启动。
Total System Global Area 6814535680 bytes
Fixed Size                  2188688 bytes
Variable Size            3539995248 bytes
Database Buffers         3254779904 bytes
Redo Buffers               17571840 bytes
数据库装载完毕。
数据库已经打开。
```

## 二、关闭数据库实例

与启动数据库实例相同，关闭数据库实例也分为3个步骤，分别是关闭数据库、卸载数据库、关闭Oracle实例。在`SQL*Plus`中，可以使用shutdown语句关闭数据库。

其具体语法格式如下:

```java
SHUTDOWN [normal|transactional|immediate|abort]
```

- normal：表示以正常方式关闭数据库。
- transactional：示在当前所有的活动事务被提交完毕之后，关闭数据库
- immediate：表示在尽可能短的时间内立即关闭数据库。
- abort：表示以终止方式来关闭数据库。

### 2.1 NORMAL方式

这种方式称作正常关闭方式，如果对关闭数据库的时间没有限制，通常会使用这种方式来关闭数据库。

使用NORMAL方式关闭数据库示例：

```java
shutdown normal
数据库已经关闭。
已经卸载数据库。
ORACLE 例程已关闭
```

从上面的代码可以看出，Oracle在执行shutdown命令后， 所返回的响应信息就是关闭数据库实例的过程。当以正常方式关闭数据库时，Oracle将执行如下操作：

- 阻止任何用户建立新的连接。
- 等待当前所有正在连接的用户主动断开连接。
- 当所有的用户都断开连接后，将立即关闭数据库。

### 2.2 NSACTIONAL方式

这种方式称作事务关闭方式，它的首要任务是能够保证当前所有的活动事务都可以被提交，并在尽可能短的时间内关闭数据库。

使用TRANSACTIONAL方式关闭数据库示例：

```java
shutdown transactional
数据库已经关闭。
已经卸载数据库。
ORACLE 例程已关闭
```

以事务方式关闭数据库时，Oracle将执行如下操作：

- 阻止用户建立新连接和开始新事务。
- 等待所有活动事务提交后，再断开用户连接。
- 当所有的活动事务提交完毕、所有的用户都断开连接后，将关闭数据库。

### 2.3 IMMEDIATE方式

MMEAI单间的含义样这种方式称作立即关方式，这种方限在共可能时间内关团数费件。

使用MEDAIR关闭数据库示例：

```java
shutdown immediate
数据库已经关闭。
已经卸载数据库。
ORACLE 例程已关闭
```

在这种关闭方式下，Oracle不但会立即中断当前用户的连接，而且会强行终止用户的当前活动事务，将未完成的事务回退。以立即关闭方式关闭数据库时，Oracle将执行如下操作：

- 阻止用户建立新连接和开始新事务。
- 将未提交的活动事务回退。
- 关闭数据库。

### 2.4 ABORT方式

这种方式称作终止关闭方式，终止关闭方式具有一定的强制性和破坏性。使用这种方式会强制中断任何数据库操作，这样可能会丢失一部分数据信息， 影响数据库的完整性。除了由于使用其他3种方式无法关闭数据库而使用它之外，应该尽量避免使用这种方式。

使用ABORT方式关闭数据库示例：

```java
shutdown immediate
ORACLE 例程已关闭
```

以立即关闭方式关闭数据库时，Oracle将执行如下操作:

- 阻止用户建立新连接和开始新事务。
- 取消未提交的活动事务，而不是回退。
- 立即终正在执行的任何SQL语句。
- 立即关闭数据库。
