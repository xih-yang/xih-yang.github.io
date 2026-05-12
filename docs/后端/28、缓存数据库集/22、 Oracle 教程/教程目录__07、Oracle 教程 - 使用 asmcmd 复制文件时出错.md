# 07、Oracle 教程 - 使用 asmcmd 复制文件时出错
- 来源：https://ddkk.com/zhuanlan/db/oracle/1/7.html
- 分类：缓存数据库
- 分组：教程目录
## 一、错误描述

需要增加一个控制文件，进行了如下操作：

### 1、修改参数

```java
alter system set control_files = '+DATA/orcl/controlfile/current.260.1070471991',
'+BAK/orcl/controlfile/current.256.1070471991',
'+bak/ctl_files/controlfile.256.1070471991'
scope = spfile sid = '*';
```

### 2、复制控制文件到 control_files 参数指定的位置

使用asmcmd 在执行 cp 命令时出现如下错误：

```java
ASMCMD> cp +bak/orcl/controlfile/Current.256.1070471991 +bak/ctl_files/controlfile.256.1070471991
copying +bak/orcl/controlfile/Current.256.1070471991 -> +bak/ctl_files/controlfile.256.1070471991
ASMCMD-8016: copy source '+bak/orcl/controlfile/Current.256.1070471991' and target '+bak/ctl_files/controlfile.256.1070471991' failed
ORA-15056: additional error message
ORA-15046: ASM file name '+bak/ctl_files/controlfile.256.1070471991' is not in single-file creation form
ORA-06512: at "SYS.X$DBMS_DISKGROUP", line 415
ORA-06512: at line 3 (DBD ERROR: OCIStmtExecute)
```

## 二、错误产生的原因及解决办法

用户在asmcmd 中复制文件时不能指定文件后面的数值。命令修改为如下格式：

```java
ASMCMD> cp '+BAK/orcl/controlfile/current.256.1070471991' '+bak/ctl_files/control_bak.ctl'
copying +BAK/orcl/controlfile/current.256.1070471991 -> +bak/ctl_files/control_bak.ctl
```

复制成功，查看文件：

```java
ASMCMD> ls +bak/ctl_files
control_bak.ctl
# 用 ls -l 查看文件
# 发现在 ASM 中复制文件其实只是在目标目录下存储了一个 alias（别名），真正的文件被 ASM 放到了其他位置
ASMCMD> ls -l +bak/ctl_files
Type   Redund  Striped  Time   Sys  Name
                   N  control_bak.ctl => +BAK/ASM/CONTROLFILE/control_bak.ctl.265.1079800929
```

把数据库启动到 nomount，修改参数文件如下：

```java
alter system set control_files = '+DATA/orcl/controlfile/current.260.1070471991',
'+BAK/orcl/controlfile/current.256.1070471991',
'+bak/ctl_files/control_bak.ctl'
scope = spfile sid = '*';
```

重启数据库，问题解决：

```java
SQL> startup force
ORACLE instance started.
Total System Global Area  835104768 bytes
Fixed Size		    2257840 bytes
Variable Size		  603982928 bytes
Database Buffers	  226492416 bytes
Redo Buffers		    2371584 bytes
Database mounted.
Database opened.
```
