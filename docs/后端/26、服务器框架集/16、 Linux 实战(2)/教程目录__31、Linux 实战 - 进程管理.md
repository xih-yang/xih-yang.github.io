# 31、Linux 实战 - 进程管理
- 来源：https://ddkk.com/zhuanlan/server/linux/5/31.html
- 分类：服务器框架
- 分组：教程目录
## 进程管理

进程就是系统中运行的程序，每一个运行的进程都会被分配一个进程号。

### 进程管理的作用

- 判断服务器的健康状态：运维工程师的一个重要任务，就是维持服务器健康，通过进程管理，可以判断服务器是否健康，这其中的一个通用指标，就是看CPU占用是否超过90%以及内存占用是否超过70%。
- 查看系统中运行的所有进程。
- 杀死进程：先要确定正常的手段是否能关闭进程，实在没有办法关闭时，可以考虑使用这种方法。

### 进程的查看

#### ps命令

ps(process status)命令是用来静态显示系统中进程的命令，这个命令有些特殊，它的部分选项不能用"-",常用的比如"ps aux"，遵照的是老式的BSD系统的命令格式。

```java
[root@ddkk.com ~]# ps aux
[root@ddkk.com ~]# ps -le
#这两个命令都是用来显示系统中所有进程的，常用ps aux
```

选项：

- a：显示所有的终端进程，除了回话引线
- u：显示进程的归属用户及内存的使用情况
- x：显示所有没有控制终端的进程

命令输出：

- PID：进程号
- %CPU：占用CPU资源百分比
- %MEM：占用物理内存百分比
- VSZ ：占用虚拟内存的大小，单位KB
- RSS：占用物理内存的大小，单位KB
- TYY：显示运行该进程的终端，tty1-tty6是本地字符终端，tty7是图形终端，pts/0-255表示远程终端。
- STAT：进程状态。
- START：该进程的启动时间。
- TIME：该进程占用CPU的运算时间。
- COMMAND：产生此进程的命令名。

常见状态
表示

D
不可被唤醒的睡眠状态，通常用于I/O情况。

R
该进程正在运行。

S
该进程正在睡眠状态，可被唤醒。

T
停止状态，可能实在后台暂停或进程在除错状态。

W
内存交互状态。(2.6内核后开始无效)

X
死掉的进程，(一般不会出现)。

Z
僵尸进程，进程已经终止，但部分程序还在内存当中。

<
高优先级

N
低优先级

L
被锁入内存

s
包含子进程

l
多线程

+
位于后台

#### top命令

相比于ps命令的静态输出，top命令可以动态更新进程的情况。

选项：

- -d 秒数：指定top命令的更新间隔。
- -b：使用批处理模式输出，一般和"-n"选项合用，用于把top命令重定向到文件中。
- -n 次数：指定top命令执行的次数。
- -p：指定PID，只查看某个PID的进程。
- -s：使top在安全模式运行，避免在交互模式中出现错误。
- -u 用户名：只监听某个用户的程度。

交互界面的命令：

- ？或h：显示交互模式中的帮助。
- P：以cpu使用率排序，默认就是此项。
- M：以内存的使用率来排序。
- N：以PID排序。
- T：按照CPU的累计运算时间排序，也就是用TIME+项排序。
- k：按照PID号，给某个进程重设优先级值。
- q：退出top。

top界面的信息：

部分信息
含义

- 00:11:37
系统时间

up 2:38
系统启动时间

1 user
当前登录了一个用户

load average: 0.00, 0.00, 0.00
系统在前1分钟、5分钟、15分钟的平均负载，一般超过CPU核心数，就是高负载。

154 total
系统中的进程总数。

1 running
正在运行的进程数。

153 sleeping
正在睡眠的进程数。

0.0 ni
0%cpu被修改过优先级的进程占用。

99.9 id
99.9%cpu处于空闲状态。

部分输出：

- PR和NI：优先级，数值越小，优先级越高。
- VIRT：占用的虚拟内存大小，单位KB。
- SHR：共享内存大小，单位KB。

```java
#将top命令输出到文件
[root@ddkk.com ~]# top -b -n 1 >top.log
```

#### pstree命令

可以通过pstree命令看到进程依赖。

```java
[root@ddkk.com ~]# pstree
systemd─┬─NetworkManager───2*[{NetworkManager}]
        ├─VGAuthService
        ├─agetty
        ├─auditd───{auditd}
        ├─chronyd
        ├─crond
        ├─dbus-daemon───{dbus-daemon}
        ├─firewalld───{firewalld}
        ├─irqbalance───{irqbalance}
        ├─polkitd───7*[{polkitd}]
        ├─rsyslogd───2*[{rsyslogd}]
        ├─sshd───sshd───sshd───bash───pstree
        ├─sssd─┬─sssd_be
        │      └─sssd_nss
        ├─systemd───(sd-pam)
        ├─systemd-journal
        ├─systemd-logind
        ├─systemd-udevd
        ├─tuned───4*[{tuned}]
        └─vmtoolsd───3*[{vmtoolsd}]
```

选项：

- -p：显示进程的PID。
- -u：显示进程的所属用户。

### 进程的管理

#### kill命令

系统中可以识别的信号较多，我们可以使用命令"kill -l"或"man 7 signal"来查询。

```java
[root@ddkk.com ~]# kill -l
 1) SIGHUP	 2) SIGINT	 3) SIGQUIT	 4) SIGILL	 5) SIGTRAP
 6) SIGABRT	 7) SIGBUS	 8) SIGFPE	 9) SIGKILL	10) SIGUSR1
11) SIGSEGV	12) SIGUSR2	13) SIGPIPE	14) SIGALRM	15) SIGTERM
16) SIGSTKFLT	17) SIGCHLD	18) SIGCONT	19) SIGSTOP	20) SIGTSTP
21) SIGTTIN	22) SIGTTOU	23) SIGURG	24) SIGXCPU	25) SIGXFSZ
26) SIGVTALRM	27) SIGPROF	28) SIGWINCH	29) SIGIO	30) SIGPWR
31) SIGSYS	34) SIGRTMIN	35) SIGRTMIN+1	36) SIGRTMIN+2	37) SIGRTMIN+3
38) SIGRTMIN+4	39) SIGRTMIN+5	40) SIGRTMIN+6	41) SIGRTMIN+7	42) SIGRTMIN+8
43) SIGRTMIN+9	44) SIGRTMIN+10	45) SIGRTMIN+11	46) SIGRTMIN+12	47) SIGRTMIN+13
48) SIGRTMIN+14	49) SIGRTMIN+15	50) SIGRTMAX-14	51) SIGRTMAX-13	52) SIGRTMAX-12
53) SIGRTMAX-11	54) SIGRTMAX-10	55) SIGRTMAX-9	56) SIGRTMAX-8	57) SIGRTMAX-7
58) SIGRTMAX-6	59) SIGRTMAX-5	60) SIGRTMAX-4	61) SIGRTMAX-3	62) SIGRTMAX-2
63) SIGRTMAX-1	64) SIGRTMAX	
```

主要的几个信号：

信号代号
信号名
说明

1
SIGHUP
该信号让进程立即关闭，然后重新读取配置文件之后重启。

9
SIGKILL
用来立即结束程序的运行，本信号不能被阻塞、处理和忽略，一般用于强制终止进程。

命令格式：

```java
[root@ddkk.com ~]# kill [信号] PID
```

#### killall命令

killall命令用于杀死一类进程。

命令格式：

```java
[root@ddkk.com ~]# killall [选项] [信号] 进程名
```

选项：

- -i：询问是否杀死进程。
- -I：忽略进程名的大小写。

#### pkill命令

pkill命令可以和killall一样通过进程名杀死进程，也可以根据终端号踢出用户。

```java
[root@ddkk.com ~]# pkill [信号] [选项] 进程名
```

选项：

- -t 终端：按终端踢出用户。

例：将用户u1踢出

```java
[root@ddkk.com ~]# w
 01:08:26 up  3:35,  2 users,  load average: 0.00, 0.00, 0.00
USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT
root     pts/0    192.168.19.1     21:34    1.00s  0.08s  0.02s w
u1       pts/1    192.168.19.1     01:06    2:07   0.00s  0.00s -bash
[root@ddkk.com ~]# pkill -9 -t pts/1
```
