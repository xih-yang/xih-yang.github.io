# 21、Oracle 基础教程 - 常见Oracle错误： ORA-00257/ORA-00313/ORA-28000/ORA-28000
- 来源：https://ddkk.com/zhuanlan/db/oracle/3/21.html
- 分类：缓存数据库
- 分组：教程目录
### （1）ORA-00257 空间不足错误

这是由于归档日志太多，占用了全部的硬盘剩余空间导致的，通过简单删除日志或加大存储空间就能够解决。但在Oracle 10g上存储空间还有很大，却也报这个错误。原因是Oracle 10g中新的特性，对Flash Recovery的管理导致的。如下图所示：

**第一种 删除日志文件**

`ORACLE_HOME/flash_recovery_area/ORCL/archivelog` 下删除归档日志

`ORACLE_HOME/bin`下执行

```java
./rman target / 
```

进入`RMAN`执行

```java
crosscheck archivelog all;
delete expired archivelog all
```

**第二种 增大闪回日志文件的最大大小**

查看数据库`REDOLOG`情况，发现ARC状态为NO，表示系统无法自动归档。（`select * From v$log`）

查看`FLASH_RECOVERY_AREA`空间中各部分使用情况：

把`FLASH_RECOVERY_AREA`的空间修改为20GB：

这时再查看日志的状态，发现`REDO LOG`处于正常的归档状态：

关闭闪回日志的功能

```java
alter database flashback off
```

### （2）ORA-00313 无法打开日志组

如下图所示：

解决方法：

### （3）ORA-16038 日志序列号无法归档

如下图所示：

关闭数据库

重新启动

缺少spfile，创建spfile

更改闪回区大小为4G，打开数据库

**另一种解决方法：将日志模式改为非归档模式**

```java
SQL>shutdown immediate;     停止服务 
SQL>archive log list;  查看现在的状态 
SQL>startup mount; 
SQL>alter database noarchivelog; 转换为非归档模式 
SQL>alter database open;  启动数据库
```

### （4）ORA-16320 激活归档模式出现错误

startup后显示

```java
ORA-16032: parameter LOG_ARCHIVE_DEST destination string cannot be translated
ORA-07286: sksagdi: cannot obtain device information.
Linux Error: 2: No such file or directory
```

启动数据库的时候指定具体路径 如 `startup pfile='具体文件路径'`

```java
startup  pfile=/home/oracle/oracle/product/10.2.0/db_1/dbs/initorcl.ora nomount
```

### （5）ORA-28000: the account is locked

```java
SQL>select account_status from dba_users where username='test';
SQL>alter user test account unlock;
```

### （6）ORA-28002: 用户密码过期

```java
SELECT * FROM dba_profiles WHERE resource_name='PASSWORD_LIFE_TIME';
ALTER PROFILE DEFAULT LIMIT PASSWORD_LIFE_TIME UNLIMITED;
```

修改之后不需要重启动数据库，会立即生效。

### （7）ORA-00054: Rusource busy and acquire with nowait specified or timeout expired.

```java
# 得到对象的object_id
SQL> select object_id from dba_objects where object_name=’’
#	得到被锁的会话SID
SQL> select * from v$lock where id1=&object_id
#	得到SID, SERIAL
SQL> select * from v$session where sid=2367
# 杀死相关进程
SQL> alter system kill session ‘SID, SERIAL#’
```

### （8）EXP-00003: 未找到段 (0,0) 的存储定义

Oracle 11G在用EXPORT导出时，空表不能导出，11GR2中有个新特性，当表无数据时，不分配segment，以节省空间。

```java
alter system setdeferred_segment_creation=false scope=both;
```

### （9） EXP-00028 failed to open for write

oracle用户对当前文件夹没有写权限

chmod改成可写

### （10） EXP-00091: Exporting questionable statistics

一般是由于字符集问题。

### （11）登录EM：java.lang.Exception: Exception in sending Request :: null

一般是因为没有设置时区，默认的是`agentTZRegion=GMT`。打开$`ORACLE_HOME\db_1 \$HOSTNAME\sysman\config\emd.properties`文件，修改为：`agentTZRegion=Asia/Shanghai`，然后重启Oracle相关服务。
