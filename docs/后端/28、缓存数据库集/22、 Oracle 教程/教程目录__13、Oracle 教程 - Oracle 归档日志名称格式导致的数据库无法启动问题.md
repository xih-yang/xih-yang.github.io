# 13、Oracle 教程 - Oracle 归档日志名称格式导致的数据库无法启动问题
- 来源：https://ddkk.com/zhuanlan/db/oracle/1/13.html
- 分类：缓存数据库
- 分组：教程目录
## 一、问题原因

### 1、修改归档日志的文件名称

命令如下：

```java
SQL> alter system set LOG_ARCHIVE_FORMAT = 'thread_%T_seq_S.%d' scope = spfile sid='*';
System altered.
```

### 2、重启数据库使设置生效

```java
-- 关闭数据库
SQL> shutdown immediate
Database closed.
Database dismounted.
ORACLE instance shut down.
-- 启动数据库出现错误
-- 错误原因是：归档日志文件名必须包含 %s、%t 和 %r 三个选项。
SQL> shutdown immediate
Database closed.
Database dismounted.
ORACLE instance shut down.
SQL> startup
ORA-19905: log_archive_format must contain %s, %t and %r
```

由于该参数错误导致参数文件无法加载，无法通过 alter system 命令修改参数值，也无法启动数据库到 nomount 状态。

```java
SQL> alter system set LOG_ARCHIVE_FORMAT = 'thread_%T_seq_S.%r_%d' scope = spfile sid='*';
alter system set LOG_ARCHIVE_FORMAT = 'thread_%T_seq_S.%r_%d' scope = spfile sid='*'
*
ERROR at line 1:
ORA-01034: ORACLE not available
Process ID: 0
Session ID: 1 Serial number: 5
-- 启动数据库到 nomount 失败
SQL> startup nomount
ORA-19905: log_archive_format must contain %s, %t and %r
```

## 二、问题解决办法

由于LOG_ARCHIVE_FORMAT 参数设置错误导致数据库无法启动到 nomount ，无法使用 alter system 命令重置参数值，可以采用如下方法解决：

### 1、根据 spfile 文件生成 pfile 文件

```java
SQL> create pfile='/home/oracle/a.ora' from spfile='+data/orcl/spfileorcl.ora';
File created.
```

### 2、使用文本编辑器修改 pfile 文件

```java
[oracle@rac1 ~]$ vi /home/oracle/a.ora
...........
orcl2.instance_number=2
orcl1.instance_number=1
*.log_archive_dest_1='location=/home/oracle/archivelog'
*.log_archive_format='thread_%T_seq_S.%a.%r.%d'  直接修改该参数的值
*.memory_target=838860800
*.open_cursors=300
*.processes=150
*.remote_listener='rac-scan:1521'
*.remote_login_passwordfile='exclusive'
..........
```

### 3、根据修改之后的 pfile 文件重新生成 spfile 文件

```java
SQL> create spfile='+data/orcl/spfileorcl.ora' from pfile='/home/oracle/a.ora';
File created.
```

### 4、重新启动数据库

```java
SQL> startup nomount
ORACLE instance started.
Total System Global Area  835104768 bytes
Fixed Size		    2257840 bytes
Variable Size		  603982928 bytes
Database Buffers	  226492416 bytes
Redo Buffers		    2371584 bytes
SQL> alter database mount;
Database altered.
SQL> alter database open;
Database altered.
```

## 问题解决！！
