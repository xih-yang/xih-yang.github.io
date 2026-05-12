# 33、Linux 实战 - 系统资源
- 来源：https://ddkk.com/zhuanlan/server/linux/5/33.html
- 分类：服务器框架
- 分组：教程目录
## 系统资源查看

### vmstat命令监控系统资源

命令格式：

```java
[root@ddkk.com ~]# vmstat [刷新延时] [刷新次数]
```

例如：

```java
[root@ddkk.com ~]# vmstat 1 3
procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
 r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
 1  0      0 330076  18836 221336    0    0   263    48  126  140  0  1 92  7  0
 0  0      0 330016  18836 221336    0    0     0     0  103  163  0  0 100  0  0
 0  0      0 330016  18836 221336    0    0     0     0   72  131  0  0 100  0  0
```

解释输出：

- procs:进程信息字段，r，等待运行的进程数；b，不可被唤醒的进程数量，这两个数量越大，系统越繁忙。
- memory：内存信息字段，swpd，虚拟内存的使用情况；free，空闲的内存容量；buff，缓冲的内存数量，加快写入；cache，缓存的内存容量，加快读取；单位KB。
- swap：交换分区的信息字段，si，从磁盘中交换到内存中的数据的数量；so，从内存中交换到磁盘中的数据的数量；这两个数越大，说明数据要经常在磁盘和内存间交换，系统性能越差。
- io：磁盘读写信息字段；bi从块设备读取数据的总量，单位是块；bo，写到块设备的数据的总量，单位是块。这两个数越大，代表系统的I/O越忙。
- system：系统信息字段 ：in，每秒被中断的进程次数；cs，每秒中进行的事件切换次数，此两个数越大，代表系统与接口设备的通信非常繁忙。
- CPU：CPU信息字段，us，非内核进程消耗CPU运算时间的百分比；sy，内核进程消耗CPU运算时间的百分比；id，空闲CPU的百分比；wa，等待I/O所消耗的CPU百分比；st，被虚拟机所盗用的CPU占比。

### dmesg显示开机时内核检测信息

```java
[root@ddkk.com ~]# dmesg | grep CPU
#查看CPU信息
```

### free命令查看内存使用状态

```java
[root@ddkk.com ~]# free [选项]
```

选项：

- -h：人性化显示。
- -b：以字节为单位显示。
- -k：以KB为单位显示，默认状态。
- -m：以MB为单位。
- -g：以GB为单位。

例：

```java
[root@ddkk.com ~]# free
              total        used        free      shared  buff/cache   available
Mem:         801048      235372      253688        5732      311988      434492
Swap:       3096568           0     3096568
```

### 查看CPU信息

CPU的主要信息保存在/proc/cpuinfo这个文件当中，我们只要查看这个文件，就可以知道cpu的相关信息，命令如下。

```java
[root@ddkk.com ~]# cat /proc/cpuinfo
processor	: 0
vendor_id	: GenuineIntel
cpu family	: 6
model		: 158
model name	: Intel(R) Core(TM) i5-8300H CPU @ 2.30GHz
...
```

### 查看内存信息

内存信息保存在/proc/meminfo中，查看这个文件。

```java
[root@ddkk.com ~]# cat /proc/meminfo
MemTotal:         801048 kB
MemFree:          253412 kB
MemAvailable:     434300 kB
Buffers:           20192 kB
Cached:           255928 kB
SwapCached:            0 kB
...
```

### 查看当前登录的用户

- w

```java
[root@ddkk.com ~]# w
 23:32:17 up  1:23,  1 user,  load average: 0.00, 0.00, 0.00
USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT
root     pts/0    192.168.19.1     22:10    1.00s  0.04s  0.01s w
```

- who

```java
[root@ddkk.com ~]# who
root     pts/0        2022-03-10 22:10 (192.168.19.1)
```

### uptime

uptime这个命令可以显示系统的启动时间和平均负载，也就是top命令的第一行，其实w命令也能看到这一行的数据，具体使用看个人习惯。

```java
[root@ddkk.com ~]# uptime
 23:35:32 up  1:26,  1 user,  load average: 0.00, 0.00, 0.00
```

### 查看与内核的相关信息

uname命令可以查看与内核的相关信息。

```java
[root@ddkk.com ~]# uname -a
Linux localhost.localdomain 4.18.0-338.el8.x86_641 SMP Fri Aug 27 17:32:14 UTC 2021 x86_64 x86_64 x86_64 GNU/Linux
[root@ddkk.com ~]# uname -r
4.18.0-338.el8.x86_64
```

选项：

- -a：查看与内核相关的所有信息。
- -r：查看内核版本。

### 用file来查看当前系统位数

```java
[root@ddkk.com ~]# file /bin/ls
/bin/ls: ELF 64-bit LSB shared object, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, for GNU/Linux 3.2.0, BuildID[sha1]=bccb4c17516c6a9ad59c3ec19b347c83236c04c2, stripped
```

### 查询当前系统的发行版本

使用lsb_release命令可以查询到系统的发行版本，这个命令如果不存在可以安装redhat-lsb-core这个包。

```java
[root@ddkk.com ~]# lsb_release -a
LSB Version:	:core-4.1-amd64:core-4.1-noarch
Distributor ID:	CentOSStream
Description:	CentOS Stream release 8
Release:	8
Codename:	n/a
```
