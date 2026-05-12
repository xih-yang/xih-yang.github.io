# 05、Linux 实战：系统信息相关命令
- 来源：https://ddkk.com/zhuanlan/server/linux/2/5.html
- 分类：服务器框架
- 分组：教程目录
## 系统信息相关命令

## 基础信息

### uname

uname命令：返回当前操作系统相关信息

指令格式：uname 选项

- 若不指定选项，则仅返回操作系统名称(-s选项）

选项
含义

-a
返回全部信息

-s
仅返回系统名

-n
仅返回主机名

-r
仅返回内核版本

-v
仅返回系统版本

-m
仅返回CPU类型

-p
仅返回处理器类型

-i
仅返回硬件平台

-o
仅返回系统类型

> 例1：通过id命令查询/etc/passwd文件中前3个用户
>
> [root@ddkk.com ~]# uname
>
> Linux
>
> [root@ddkk.com ~]# uname -a
>
> Linux localhost.localdomain 4.18.0-305.3.1.el8.x86_64 #1 SMP Tue Jun 1 16:14:33 UTC 2021 x86_64 x86_64 x86_64 GNU/Linux

- 全部信息内容组成为： 系统名、主机名、内核版本、系统版本、硬件名称、处理器类型、硬件平台、系统类型

### hostname

hostname命令：返回/修改系统的主机名

指令格式：hostname 选项/主机名

- 当为选项时，则返回系统主机名相关信息
- 当为主机名时，则修改主机名(临时修改,重启后自动恢复）

选项
含义

-a
返回所有主机名

-i
返回所有主机IP

-f
返回主机的FQDN

-d
返回主机的DNS域名

> 例1：列出当前系统的主机名
>
> [root@ddkk.com ~]# hostname
>
> localhost.localdomain
>
> [root@ddkk.com ~]# hostname -a
>
> localhost.localdomain localhost4 localhost4.localdomain4 localhost.localdomain localhost6 localhost6.localdomain6
>
> [root@ddkk.com ~]# hostname -i
>
> ::1 127.0.0.1
>
> [root@ddkk.com ~]# hostname -f
>
> localhost

> 例2：修改系统主机名，并验证
>
> [root@ddkk.com ~]# hostname
>
> localhost.localdomain
>
> [root@ddkk.com ~]# hostname mwl
>
> [root@ddkk.com ~]# hostname
>
> mwl
>
> (PS:可通过/etc/hostname永久修改主机名(需重启)，同时需配置/etc/hosts和/etc/sysconfig/network)

### uptime

uptime命令：返回系统时间和负载相关信息

指令格式：uptime

- 等效于top命令的显示的首行信息

> 例1：列出系统时间和负载相关信息
>
> [root@ddkk.com ~]# uptime
>
> 20:31:20 up 14 min, 1 user, load average: 0.00, 0.05, 0.06

- 内容组成为： 当前系统时间、系统已运行时间、用户连接数、平均负载、

(PS:平均负载显示的分别是：1、5和15分钟的系统平均负载)

### date

date命令：获取/修改系统日期和时间

指令格式：date 选项

- 若不指定选项，则按照默认字符格式输出当前日期和时间

选项
含义

-d
根据指定个数输出日期和时间

-s
修改系统日期和时间

时间格式有以下8种：

选项
含义

%F
表示完整的年、月、日

%T
表示完整的时、分、秒

%Y
表示四位年份
(包括前导0)

%m
表示月份
(包括前导0)

%d
表示日期
(包括前导0)

%H
表示小时
(包括前导0)

%M
表示分钟
(包括前导0)

%S
表示秒数
(包括前导0)

> 例1：根据指定格式输出系统日期和时间
>
> [root@ddkk.com ~]# date
>
> Tue Dec 7 21:48:19 CST 2021
>
> [root@ddkk.com ~]# date "+%F %T"
>
> 2021-12-07 21:48:27
>
> [root@ddkk.com ~]# date -d "+1 month" "+%F %T"
>
> 2022-01-07 21:49:21

> 例2：修改系统日期和时间并显示
>
> [root@ddkk.com ~]# date
>
> Tue Dec 7 21:49:52 CST 2021
>
> [root@ddkk.com ~]# date -s "20:00:00"
>
> Tue Dec 7 20:00:00 CST 2021
>
> [root@ddkk.com ~]# date
>
> Tue Dec 7 20:00:01 CST 2021
>
> [root@ddkk.com ~]# date -s 20220630
>
> Thu Jun 30 00:00:00 CST 2022
>
> [root@ddkk.com ~]# date
>
> Thu Jun 30 00:00:04 CST 2022
>
> [root@ddkk.com ~]# date -s "20211207 21:51:00"
>
> Tue Dec 7 21:51:00 CST 2021
>
> [root@ddkk.com ~]# date
>
> Tue Dec 7 21:51:02 CST 2021

## 登录用户

### id

id命令：返回指定用户的相关信息

指令格式：id 选项 用户名

- 若不指定用户，则默认为执行该命令的用户
- 若不指定选项，则返回用户的UID、GID和附加组ID

选项
含义

-u
仅返回用户的UID

-g
仅返回用户的GID

-G
仅返回用户的附加组ID

> 例1：列出用户root和mwl的信息
>
> [root@ddkk.com ~]# id
>
> uid=0(root) gid=0(root) groups=0(root) context=unconfined_u:unconfined_r:unconfined_t:s0-s0:c0.c1023
>
> [root@ddkk.com ~]# id root
>
> uid=0(root) gid=0(root) groups=0(root)
>
> [root@ddkk.com ~]# id mwl
>
> uid=1000(mwl) gid=1000(mwl) groups=1000(mwl)

### whoami

whoami命令：返回执行该命令的用户名

指令格式：whoami

> 例1：列出用户root和mwl的信息
>
> [root@ddkk.com ~]# whoami
>
> root
>
> [root@ddkk.com ~]# su - mwl
>
> [mwl@localhost ~]$ whoami
>
> mwl

(PS:常用于Shell脚本以获得执行程序的用户名(方便记录日志))

### who

who命令：返回系统当前所有在线的用户名和其所在终端

指令格式：who

> 例1：列出当前所有在线用户
>
> [root@ddkk.com ~]# who
>
> root tty2 Dec 7 20:16 (tty2)
>
> mwl pts/1 Dec 7 20:41 (192.168.184.1)

### w

w命令：返回当前所有在线的用户名和其相关操作

指令格式：w

> 例1：列出当前所有在线用户的信息

### last

last命令：返回系统的登录信息

指令格式：last

- 显示顺序默认从新到旧

> 例1：列出登录过系统的用户信息

### lastlog

lastlog命令：返回系统所有用户登录信息

指令格式：lastlog

> 例1：列出系统中所有用户的登录信息

## 资源信息

### free

free命令：返回系统内存信息

指令格式：free 选项

选项
含义

-s N
间隔N秒显示一次信息

-c N
共显示N次

-t
同时返回内存总和行

-b
以Byte为单位显示

-k
以KB为单位显示

-m
以MB为单位显示

- -s选项需搭配-c选项使用(负责-s选项会占用终端不停刷新显示)

> 例1：2秒显示一次，总共显示2次系统内存使用情况，且显示内存总和列

字段名
含义

total
总内存

used
已占用内存

free
剩余内存

shared
共享内存

buff/cache
读写缓存
(预留内存，并不是实际使用)

available
可调用内存
(大小等于：free + buff/cache - 不可回收内存)

### dmesg

dmesg命令：返回系统启动时的内核初始化信息

指令格式：dmesg

- 本质：返回/var/log/dmesg文件中的信息

(PS:CentOS8中可能查找不到该文件(权限限制)，可参考该文章实现 [CentOS8访问/var/log/dmesg](https://www.cnblogs.com/kerrycode/p/14003342.html))

> 例1：列出系统启动时内核初始化信息

### vmstat

vmstat命令：返回系统CPU和内存的使用信息

指令格式：vmstat 选项 数字N 数字M

- 数字N：指定每N秒刷新信息
- 数字M：共显示M次

选项
含义

-a
显示inact和active栏位
(代替buff和cache栏位)

-f
同时列出启动创建进程的总数

-d
同时列出磁盘信息

-p
同时列出分区信息

-S
指定各信息输出的单位

> 例1：列出系统CPU和内存的使用信息

所属资源
字段名
含义

prcs
(进程)
r
等待运行中的进程数量

b
等待IO的进程数量

memory
(内存)
swpd
虚拟内存被使用的大小

free
剩余的物理内存大小

buff
缓冲内存的大小

cache
高速缓存的内存大小/td>

swap
(内存交换分区)
si
由交换分区调入内存的大小

so
由内存写入交换分区的大小/td>

io
(磁盘读写)
bi
每秒读取磁盘的区块数

bo
每秒写入磁盘的区块数

system
(系统)
in
每秒被中断的进程次数

cs
每秒执行的事件切换次数

cpu
us
普通用户进程占用CPU时间百分比

sy
内核系统进程占用CPU时间百分比

id
CPU空闲时间百分比

wa
IO等待时间百分比

st
虚拟机占用CPU时间百分比
