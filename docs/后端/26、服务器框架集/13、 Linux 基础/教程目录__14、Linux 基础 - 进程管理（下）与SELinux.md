# 14、Linux 基础 - 进程管理（下）与SELinux
- 来源：https://ddkk.com/zhuanlan/server/linux/4/14.html
- 分类：服务器框架
- 分组：教程目录
## 特殊文件与进程

### 具有SUID/SGID权限的命令执行状态

SUID的权限其实与进程的相关性非常大，我们来看看SUID的程序如何被一般用户执行以及具有什么特点？

- SUID权限仅对二进制程序（binary program）有效。
- 执行者对于该程序需要具有x的可执行权限。
- 本权限仅在执行该程序的过程中有效（run-time）
- 执行者将具有该程序拥有者的权限（owner）的权限。

所以说，整个SUID的权限会生效是由于【具有该权限的程序被触发】，而我们知道一个程序被触发会变成进程，所以执行者可以具有程序拥有者的权限就是在该程序变成进程的那个时候。

例如经典的passwd，触发passwd后，会获得一个新的进程与PID，该PID产生时通过SUID来给予该PID特殊的权限设置。

使用passwd，然后按下Ctrl+z+Enter，将任务放入后台，然后我们使用pstree -uA命令查看进程树，可以看到这样的一部分：

```java
    |      |-gnome-terminal--+-bash-+-2*[passwd(root)]
    |      |                 |      -pstree
    |      |                 -3*[{gnome-terminal-}]
```

*利用type命令查看命令的可执行文件的路径*

passwd是由我们的bash衍生出来的，但是确实特殊权限root，这就是因为SUID程序执行过程中产生的进程可以拿到特殊的权限。

> 还记得怎么查看系统中所有的SUID/SGID吗？
>
>
>
> ```plaintext
```java 
find /  -perm /6000
```

```plaintext
### /proc/\*代表的意义
我们之前提到的所谓的进程都是在内存之中，而内存当中的数据又都是写入到/proc/\*这个目录下的，所以，我们当然可以直接查看/proc这个目录之中的文件。如果你查看/proc会发现它大概是这样：
```java 
[luoluo@study ~]$ ll /proc
总用量 0
dr-xr-xr-x.  9 root           root                         0 7月  20 21:31 1
dr-xr-xr-x.  9 root           root                         0 7月  20 21:31 10
dr-xr-xr-x.  9 root           root                         0 7月  20 21:31 100
dr-xr-xr-x.  9 root           root                         0 7月  20 21:31 101
dr-xr-xr-x.  9 root           root                         0 7月  20 21:31 102
…………
-r--r--r--.  1 root           root                         0 7月  20 21:32 uptime
-r--r--r--.  1 root           root                         0 7月  20 21:32 version
-r--------.  1 root           root                         0 7月  20 22:22 vmallocinfo
-r--r--r--.  1 root           root                         0 7月  20 21:32 vmstat
-r--r--r--.  1 root           root                         0 7月  20 21:32 zoneinfo
```

基本上，目前主机上面的各个进程的PID都以目录的形式存在于/proc当中。举例来说，我们启动所执行的第一个程序systemd的PID是1，这个PID的所有相关信息都写入/proc/1/*当中。那么我们直接查看PID为1的数据好了，它有点像这样：

```java
dr-xr-xr-x. 2 root root 0 7月  20 21:31 attr
-rw-r--r--. 1 root root 0 7月  20 22:29 autogroup
-r--------. 1 root root 0 7月  20 22:29 auxv
-r--r--r--. 1 root root 0 7月  20 21:31 cgroup
--w-------. 1 root root 0 7月  20 22:29 clear_refs
-r--r--r--. 1 root root 0 7月  20 21:31 cmdline  //命令串
-r--r--r--. 1 root root 0 7月  20 22:29 cpuset  
lrwxrwxrwx. 1 root root 0 7月  20 22:29 cwd
-r--------. 1 root root 0 7月  20 21:31 environ //环境变量
lrwxrwxrwx. 1 root root 0 7月  20 21:31 exe
…………
```

里面的数据还是挺多的，比较有趣的是两个文件：

**1、** cmdline：这个进程被启动的命令串；

**2、** environ：这个进程的环境变量内容；

我们查看一下cmdline：

```java
/usr/lib/systemd/systemd--switched-root--system--deserialize17
```

就是这个命令、选项与参数启动systemd的。

这些proc内部目录（例如：/proc/1），还是和某个特定的PID有关的内容；如果是针对整个Linux系统相关的参数呢？那就是在/proc目录下面的文件：

档名
文件内容

/proc/cmdline
加载 kernel （内核）时所执行的相关命令和参数，查阅此文件，可了解系统是如何启动的！

/proc/cpuinfo
本机的 CPU 的相关信息，包含频率、类型与功能等

/proc/devices
这个文件记录了系统各个主要设备的主要设备代号，与 mknod 有关呢！

/proc/filesystems
目前系统已经加载的文件系统

/proc/interrupts
目前系统上面的 IRQ 分配状态。

/proc/ioports
目前系统上面各个设备所配置的 I/O 位址。

/proc/kcore
这个就是内存的大小，好大对吧，但是不要读他。

/proc/loadavg
还记得 top 以及 uptime 吧？没错！上头的三个平均数值就是记录在此！

/proc/meminfo
使用 free 列出的内存资讯，嘿嘿！在这里也能够查阅到！

/proc/modules
目前我们的 Linux 已经加载的模块列表，也可以想成是驱动程序啦！

/proc/mounts
系统已经挂载的数据，就是用 mount 这个命令呼叫出来的数据啦！

/proc/swaps
到底系统挂加载的内存在哪里？呵呵！使用掉的 partition 就记录在此啦！

/proc/partitions
使用 fdisk -l 会出现目前所有的 partition 吧？在这个文件当中也有纪录喔！

/proc/pci
在 PCI 汇流排上面，每个装置的详细情况！可用 lspci 来查阅！

/proc/uptime
就是用 uptime 的时候，会出现的资讯啦！

/proc/version
核心的版本，就是用 uname -a 显示的内容啦！

/proc/bus/*
一些汇流排的装置，还有 U盘 的设备也记录在此喔！

*如果未来你想要自行编排某种工具或软件，这个目录下面的相关文件会对你有帮助。*

### 查询已使用文件或已执行进程使用的文件

其实还有一些与进程相关的命令值得参考与应用，我们来谈一谈

#### fuser：借由文件（或文件系统）找出正在使用该文件的进程

有的时候我想要知道我的进程到底在这次启动过程中使用了多少文件，可以利用fuser来查看。举例来说，如果在卸载时发现系统通知【device is busy】，则表示此文件系统正在忙碌中，表示有某个进程正在使用该文件系统。那么你就可以利用fuser来查询。fuser的语法有点像这样：

```java
fuser  [-umv]  [-k  [i]  [-signal]]  file/dir
-u：除了进程的PID之外，同时列出该进程的拥有者
-m：后面接的那个文件名会主动地上提到该文件系统的
    最顶层 ，对 umount 不成功很有效
-v：可以列出每个文件与进程还有命令的完整相关性
-k：找出使用该文件/目录的PID，并试图以SIGKILL这个信号给予该PID
-i：必须与-k配合，在删除PID之前会先询问使用者的意思
-signal：例如-1、-15等，若不加的话，默认是SIGKILL（-9）
```

```java
//找出目前所在目录的使用PID/所属账号/权限是什么
[root@study ~]# fuser -uv .
                     用户     进程号 权限   命令
/root:               root       3614 ..c.. (root)bash
```

看到输出结果没？它说【.】下面有一个PID为3614，该进程的拥有者是root，且执行命令为bash。

中间那个权限（Access）的代表的意义是：

- c：此进程在当前的目录下（非子目录）
- e：可被触发为执行状态
- f：是一个被开启的文件
- r：代表顶层目录（root directory）
- F：该文件被使用了，不过在等待响应中
- m：可能为共享的动态函数库

*df-T：查看你的文件系统们*

如果你想要查看某个文件系统下面有多少进程正在占用该文件系统时，那个-m的选项就很有帮助了，

下面是几个简单的测试：

```java
//找到所有使用到/proc这个文件系统的进程
[root@study ~]# fuser -uv /proc
                     用户     进程号 权限   命令
/proc:               root     kernel mount (root)/proc
                     rtkit       947 .rc.. (rtkit)rtkit-daemon
//数据量还不会很多，虽然这个系统很繁忙，我们可以继续这样查看其他的进程：
[root@study ~]# fuser -muv /proc
                     用户     进程号 权限   命令
/proc:               root     kernel mount (root)/proc
                     root          1 f.... (root)systemd
                     root        673 f.... (root)systemd-journal
                     root        931 f.... (root)udisksd
                     rtkit       947 .rc.. (rtkit)rtkit-daemon
                     root       1283 F.... (root)libvirtd
                     gdm        1441 f.... (gdm)systemd
                     gdm        2278 f.... (gdm)gnome-shell
                     luoluo     2545 f.... (luoluo)systemd
                     luoluo     2771 f.... (luoluo)gvfs-udisks2-vo
                     luoluo     2878 f.... (luoluo)gsd-housekeepin
//如上进程在进行/proc文件系统的读取
```

再来几个简单的实验：

```java
[root@study ~]# echo $$
3614       //查看一下自己的bash的PID
[root@study home]# fuser -muv .
                     用户     进程号 权限   命令
/home:               root     kernel mount (root)/home
                     luoluo     2561 F...m (luoluo)pulseaudio
                     luoluo     2574 ..c.. (luoluo)dbus-daemon
                     luoluo     2578 ..c.. (luoluo)gdm-wayland-ses
                     luoluo     2586 ..c.m (luoluo)gnome-session-b
                     luoluo     2663 F.c.m (luoluo)gnome-shell
                     luoluo     2678 ..c.. (luoluo)gvfsd
                     luoluo     2688 ..c.. (luoluo)gvfsd-fuse
                     luoluo     2690 ..c.. (luoluo)Xwayland
                     ………………
                     luoluo     3265 ..c.m (luoluo)gnome-terminal-
                     luoluo     3270 ..c.. (luoluo)bash
                     root       3614 ..c.. (root)bash    //自己的bash  PID
[root@study home]# cd ~ //离开后，fuser -muv /home会发现没有PID 3614了
[root@study ~]# umount /home
umount: /home: target is busy.
//从fuser的结果可以知道，总共有那么多的进程在该目录下运行，那即使root离开了/home，
//当然还是无法umount的，那要怎么办？通过如下方法一个一个删除
[root@study ~]# fuser -mki /home
/home:                2561m  2574c  2578c  2586cm …………
//后面选择n，不要真的删除，咱们只是做个试验
```

既然可以针对整个文件系统，那也一定可以针对单一文件

```java
//找到/run下属于FIFO类型的文件，并且找出读取该文件的进程
[root@study home]# find /run -type p
/run/systemd/inhibit/2.ref
/run/systemd/inhibit/1.ref
/run/systemd/sessions/2.ref
/run/systemd/sessions/c1.ref  //随便选一个，就比如这行的吧
/run/systemd/inaccessible/fifo  
[root@study home]# fuser -uv /run/systemd/sessions/c1.ref
                     用户     进程号 权限   命令
/run/systemd/sessions/c1.ref:
                     root       1090 f.... (root)systemd-logind
                     root       1328 F.... (root)gdm-session-wor
//通常系统的FIFO文件都会放置到/run目录下，通过这个
//方式来追踪该文件被读取的进程
```

通过这个fuser我们可以找出使用该文件、目录的进程，它的重点与ps、pstree不同。fuser可以让我们了解到某个文件（或文件系统）目前正在被哪些进程所使用。

#### lsof：列出被进程所使用的文件名称

相对于fuser是由文件或设备去找出使用该文件或设备的进程，lsof则是查出某个进程开启或使用的文件与设备。

```java
lsof  [-aUu]  [+d]
-a：多项数据需要【同时成立】才显示出结果时
-U：仅列出UNIX-like系列的socket文件类型
-u：后面接username，列出该使用者相关进程所使用的文件
+d：后面接目录，亦即找出某个目录下面已经被使用的文件
```

```java
//列出目前系统上面所有已经被开启的文件与设备
[root@study home]# lsof 
lsof: WARNING: can't stat() fuse.gvfsd-fuse file system /run/user/1000/gvfs
      Output information may be incomplete.
COMMAND    PID  TID TASKCMD   USER   FD      TYPE             DEVICE SIZE/OFF       NODE NAME
systemd      1                root  cwd       DIR              253,0      224        128 /
systemd      1                root  rtd       DIR              253,0      224        128 /
systemd      1                root  txt       REG              253,0  2520760   25703762 /usr/lib/systemd/systemd
systemd      1                root  mem       REG              253,0  2303696    8469179 /usr/lib64/libm-2.28.so
systemd      1                root  mem       REG              253,0   510104    9606081 /usr/lib64/libudev.so.1.6.11
systemd      1                root  mem       REG              253,0   969832    8508415 /usr/lib64/libsepol.so.1
systemd      1                root  mem       REG              253,0  1805368    8617059 /usr/lib64/libunistring.so.2.1.0
…………
//在默认情况下，lsof会将目前系统上面已经打开的文件全部列出来
//所以结果会多的吓人。
//另外，第一个文件systemd执行的地方就在根目录
```

```java
//仅列出关于root的所有的进程所使用的socket文件
[root@study home]# lsof -u root -a -U
lsof: WARNING: can't stat() fuse.gvfsd-fuse file system /run/user/1000/gvfs
      Output information may be incomplete.
COMMAND    PID USER   FD   TYPE             DEVICE SIZE/OFF   NODE NAME
systemd      1 root   15u  unix 0x000000007c36759b      0t0  21933 /run/systemd/private type=STREAM
systemd      1 root   17u  unix 0x0000000062c936cc      0t0  49042 /run/systemd/journal/stdout type=STREAM
systemd      1 root   18u  unix 0x000000009fcfb6cb      0t0  12762 /run/systemd/notify type=DGRAM
systemd      1 root   20u  unix 0x0000000076203b50      0t0  49043 /run/systemd/journal/stdout type=STREAM
systemd      1 root   21u  unix 0x0000000035074f1a      0t0  49788 /run/systemd/journal/stdout type=STREAM
systemd      1 root   22u  unix 0x00000000f6a53709      0t0  49952 /run/systemd/journal/stdout type=STREAM
systemd      1 root   23u  unix 0x00000000a5dcfe26      0t0  50090 /run/systemd/journal/stdout type=STREAM
systemd      1 root   25u  unix 0x00000000d49b04ad      0t0  12764 /run/systemd/cgroups-agent type=DGRAM
systemd      1 root   26u  unix 0x00000000ef366f9e      0t0  12766 type=DGRAM
…………
//如上使用参数-a，使得-u和-U的条件集取交集，即要求同时实现
```

```java
//列出目前系统上面所有的被使用的外接设备
[root@study home]# lsof +d /dev
lsof: WARNING: can't stat() fuse.gvfsd-fuse file system /run/user/1000/gvfs
      Output information may be incomplete.
COMMAND    PID           USER   FD   TYPE DEVICE SIZE/OFF  NODE NAME
systemd      1           root    0u   CHR    1,3      0t0  9952 /dev/null
systemd      1           root    1u   CHR    1,3      0t0  9952 /dev/null
systemd      1           root    2u   CHR    1,3      0t0  9952 /dev/null
systemd      1           root    3w   CHR   1,11      0t0  9958 /dev/kmsg
systemd      1           root   24r   CHR 10,235      0t0 12237 /dev/autofs
systemd      1           root   50u   CHR  10,57      0t0 23946 /dev/rfkill
kdevtmpfs   15           root  cwd    DIR    0,6     3420     3 /dev
kdevtmpfs   15           root  rtd    DIR    0,6     3420     3 /dev
systemd-j  673           root    0r   CHR    1,3      0t0  9952 /dev/null
………………
```

```java
//显示属于root用户的bash这个程序所开启的文件
[root@study home]# lsof -u root  |  grep bash
lsof: WARNING: can't stat() fuse.gvfsd-fuse file system /run/user/1000/gvfs
      Output information may be incomplete.
ksmtuned   952 root  txt       REG              253,0  1219248     230355 /usr/bin/bash
bash      3614 root  cwd       DIR              253,2      115        128 /home
bash      3614 root  rtd       DIR              253,0      224        128 /
bash      3614 root  txt       REG              253,0  1219248     230355 /usr/bin/bash
bash      3614 root  mem       REG              253,0  2801698    8469122 /usr/lib/locale/zh_CN.utf8/LC_COLLATE
bash      3614 root  mem       REG              253,0    73264    8490051 /usr/lib64/libnss_files-2.28.so
bash      3614 root  mem       REG              253,0  8406312    1789707 /var/lib/sss/mc/passwd
bash      3614 root  mem       REG              253,0    62600   10699165 /usr/lib64/libnss_sss.so.2
bash      3614 root  mem       REG              253,0  3197880    8469175 /usr/lib64/libc-2.28.so
bash      3614 root  mem       REG              253,0    28784    8469177 /usr/lib64/libdl-2.28.so
bash      3614 root  mem       REG              253,0   208616    8460720 /usr/lib64/libtinfo.so.6.1
…………
```

这个命令可以找出您想知道的某个进程是否正在使用某些文件。

#### pidof：找出某个正在执行的进程的PID

```java
pidof  [-sx]  program_name
-s：仅列出一个PID而不列出所有的PID
-x：同时列出该 program  name 可能的PPID那个进程的PID
```

通过这个pidof命令，配合ps aux与正则表达式，就可以轻易地找到您所想要的进程内容了。例如找bash，只需要pidof bash即可。

## 承上启下

“进程管理”篇章告一段落，我们接下来来学习SELinux

## SELinux初探

*自CentOS 5.x之后的CentOS版本中（CentOS 7），SELinux 已经是个非常完备的内核模块了。CentOS提供了很多管理SELinux的命令与功能，因此在整体架构上面是单纯且容易操作管理的。所以，在没有自行开发网络服务软件以及第三方辅助软件的前提下，也就是全部利用CentOS官方提供的软件来使用我们服务器的情况下，建议大家不要关闭SELinux。*

### 什么是SELinux

什么是SELinux呢？其实他是【Security Enhanced Linux】的英文缩写，字面上的意义就是安全强化Linux的意思。那么所谓的安全强化是强化哪个部分呢？

#### 当初设计的目标：避免资源的误用

SELinux是由美国国家安全局（NSA）开发的，当初开发这玩意儿的原因是很多企业发现，系统出现问题的原因大部分都在于【内部员工的资源误用】，实际由外部发动的攻击反而没有这么严重。那么什么是【员工资源误用】呢？举例来说，如果有个不是很懂系统的系统管理员为了自己设置的方便，将网页所在目录/var/www/html的权限设置为drwxrwxrwx，你觉得会有什么事情发生？

现在我们知道所有的系统资源都是通过进程来读写的，那么/var/www/html/如果设置为777，代表所有进程均可对该目录读写，万一你真的启动了WWW服务器软件，那么该软件所触发的进程将可以写入该目录，而该进程却是对整个Internet提供服务的。只要有心人接触到这个进程，而且该进程刚好又提供了用户进行写入的功能，那么外部的人很可能就会向你的系统写入些莫名其妙的东西。那可真是不得了，一个小小的777问题可是大大的。

为了管理这方面的权限与进程的问题，美国国家安全局开始着手处理操作系统这方面的管理，由于Linux是自由软件，程序代码是公开的，因此他们便使用Linux来作为研究的目标，最后更将研究的结果整合到Linux内核中，那就是SELinux。所以，SELinux是整合到内核的一个模块。

这也就是说，**其实SELinux是在进行进程、文件等详细权限配置时依据的一个内核模块。由于启动网络服务的也是进程，因此刚好也是能够控制网络服务能否读写系统资源的一道关卡。**

#### 传统的文件权限与账号的关系：自主访问控制（DAC）

我们知道系统的账号主要分为系统管理员（root）与一般用户，而这两种身份能否使用系统上面的文件资源则与rwx的权限设置有关。不过你要注意的是，各种权限设置对root是无效的。因此，当某个进程想要对文件进行读写时，系统就会根据该进程的拥有者和用户组，比对文件的权限，只有通过权限检查，才可以读写该文件。

**这种读写文件系统的方式被称为【自主访问控制（Discretionary Access Control，DAC）】。基本上，就是依据进程的拥有者与文件资源的rwx权限来决定有无读写的权限。**不过这种DAC的访问控制有几个缺点，那就是：

- **root具有最高的权限**：如果不小心某个进程被有心人士窃取，且该进程属于root权限，那么这个进程就可以在系统上执行任何资源的读写。
- **用户可以获取进程来修改文件资源的访问权限**：如果你不小心将某个目录的权限设置为777，由于对任何人的权限都是rwx，因此该目录就会被任何人所任意读写。

#### 以策略规则制定特定进程读取特定文件：强制访问控制（MAC）

现在我们知道DAC的困扰就是当用户获取进程后，他可以借由这个进程与自己默认的权限来处理它自己的文件资源。万一这个用户对Linux系统不熟，就很有可能会有资源误用的问题产生。为了避免DAC（自主访问控制）容易发生的问题，SELinux引入了强制访问控制（Mandatory Access Control，MAC）的方法。

*目前我所知道的 MAC 在计算机界可能三个意思：1. 苹果电脑 2. 设备的物理地址 3.SELinux引入的强制访问控制*

强制访问控制（MAC）很有趣，他可以针对特定的进程与特定的文件资源来管理权限。也就是说，即使你是root，那么在使用不同的进程时，你所能获取的权限也并不一定是root，而要根据当时该进程的设置而设定。

如此一来，我们针对控制的【主体】变成了【进程】而不是用户。

此外，这个主体进程也不能任意使用系统文件资源，因为每个文件资源也针对该主体进程设置了可使用的权限。如此一来，控制项目就细的多了。但整个系统进程那么多、文件那么多，一项一项控制可就没完没了。所以SELinux也提供了一些默认的策略（Policy），并在该策略内提供多个规则（rule），让你可以选择是否启用该控制规则。

在强制访问控制的设置下，我们的进程能够活动的空间就变小了。举例来说，WWW服务器软件的进程为httpd这个程序，而默认情况下，httpd仅能在/var/www/这个目录下面读写文件。如果httpd这个进程想要到其他目录去读写数据时，除了规则设置要开放外，目标目录也要设置成httpd可读取的类型（type）才行，限制非常多。所以，即使不小心httpd被黑客获取了控制权，它也无权浏览/etc/shadow等重要的配置文件。

针对apache这个WWW网络服务使用DAC或MAC的结果，两者之间的关系下图说明的很好：

左图是没有SELinux的DAC的结果，apache这个root主导的进程，可以在这三个目录内作任何文件的新建与修改，相当麻烦。右边则是加上SELinux的MAC管理的结果，SELinux仅会针对apache这个【进程】开放部分目录的使用权，其他非正规目录就不会让apache使用。因此不管你是谁，都不能穿透MAC的框框。

### SELinux的运行模式

#### 基本运作名词与原理

再次重复说明一下，SELinux是通过MAC的方式来管理进程的，它控制的主体是进程，而目标则是该进程能否读取的【文件资源】，所以先来说明一下这些东西的相关性。

- 主体（Subject）：SELinux主要管理的就是进程，因此你可以将【主体】跟本章谈到的进程划上等号
- 目标（Object）：主体进程能否读写的【目标资源】一般就是文件系统，因此这个目标选项可以与文件系统划上等号
- 策略（Policy）：由于进程与文件数量庞大，因此SELinux会依据某些服务来制订基本的读写安全性策略，这些策略内还会有详细的规则（rule）来指定不同的服务是否开放某些资源的读写。在目前的CentOS 7.x里面仅提供三个主要的策略，分别是：
- targeted：针对网络服务限制较多，针对本机限制较少，是默认的策略，也是建议的策略
- minimum：由target自定义而来，仅针对选择的进程来保护
- mls：完整的SELinux限制，限制方面较为严格。

除了策略指定之外，**主体与目标的安全上下文必须一致才能够顺利读写。**这个安全上下文（security context）有点类似文件系统的rwx。安全上下文的内容与设置是非常重要的，如果设置错误，你的某些服务（主体进程）就无法读写文件系统（目标资源），当然就会一直出现【权限不符】的错误信息了。

由于SELinux的重点在保护进程读取文件系统的权限，因此我们将上述几个说明搭配起来，绘制成下图，便于理解：

上图的重点在于【主体】如何获取【目标】的资源访问权限。由上图我们可以发现，主体进程必须要通过SELinux策略内的规则放行后，才可以与目标资源进行安全上下文的比对，若比对失败则无法读写目标，若比对成功则可以开始读写目标。问题是，最终能否读写目标还是与文件系统的rwx权限设置有关。如此一来，加入SELinux后，出现权限不符的情况时，你就要一步一步分析可能的问题了。

#### 安全上下文（Security Context）

CentOS 7.x的target策略已经帮我们制订好了非常多的规则，因此你只要知道如何开启/关闭某项规则的放行与否即可。

那个安全上下文比较麻烦，因为你可能需要自行配置文件的安全上下文。为何需要自行配置？举例来说，你不也常常进行文件的rwx权限的重新设置吗？可以将这个安全上下文当做SELinux内必备的rwx，这样就比较好理解了。

安全上下文存在于主体进程与目标文件资源中。进程在主存中，所以安全上下文可以存入是没问题的。那文件的安全上下文记录在哪里？事实上，安全上下文是放置到文件的inode内的，因此主体进程想要读取目标文件资源时，同样需要读取inode，这inode内就可以比对安全上下文以及rwx等权限值是否正确，而给予适当的读取权限依据。

那么安全上下文到底是什么样的存在呢？我们先来看看/root目录下面的文件的安全上下文。查看安全上下文可使用【ls -Z】（注意：你必须已经启动了SELinux才行，若尚未启动，这部分稍微看过一遍即可，下面会介绍如何启动SELinux）

```java
先来查看一下root家目录下面的【文件的SELinux相关信息】
[root@study ~]# ls -Z
    system_u:object_r:admin_home_t:s0 anaconda-ks.cfg
unconfined_u:object_r:admin_home_t:s0 createuser.sh
unconfined_u:object_r:admin_home_t:s0 Here
    system_u:object_r:admin_home_t:s0 initial-setup-ks.cfg
//上述特殊字体的部分，就是安全上下文的内容
```

如上所示，安全上下文主要用冒号分为三个字段，这三个字段的意义为：

```java
Identify:role:type
身份识别:角色:类型
```

下面我们详细地说明一下这三个字段的意义：

- 身份识别（Identify）：相当于账号方面的身份识别，主要的身份识别有下面几种常见的类型
- unconfined_u：不受限的用户，也就是说，该文件来自于不受限的进程。一般来说，我们使用可登录账号获取bash之后，默认的bash环境是不受SELinux的管制的，因为bash并不是什么特别的网络服务。因此，这个不受SELinux限制的bash进程所产生的文件，其身份识别大多就是unconfined_u这个不受限用户。
- system_u：系统用户，大部分就是系统自己产生的文件

基本上，如果是系统或软件本身所提供的文件，大多就是system_u这个身份名称；而如果是我们用户通过bash自己建立的文件，大多则是不受限的unconfined_u身份；如果是网络服务所产生的文件，或是系统服务运行过程中所产生的文件，则大部分的识别就会是system_u。

- 角色（Role）：通过角色字段，我们可以知道这个数据是属于进程、文件资源还是代表用户，一般的角色有：
- object_r：代表的是文件或目录等资源，这应该是最常见的
- system_r：代表的就是进程，不过，一般用户也会被指定成为system_r

你会发现角色的字段最后面使用【_r】来结尾，因为是role的意思。

- 类型（Type）：在默认的targeted策略中，Identify与Role字段基本上是不重要的，重要的是这个类型Type字段。基本上，一个主体进程能不能读取到这个文件资源与类型字段有关，而类型字段在文件与进程方面的定义又不太相同，分别是：
- type：在文本资源（Object）上面称为类型（Type）
- domain：在主体进程（Subject）则称为域（Domain）

domain需要与type搭配，则该进程才能够顺利读取文件资源。

#### 进程与文件SELinux类型字段的相关性

那么这三个字段如何利用呢？首先我们来看看主体进程在这三个字段的意义是什么。通过身份识别与角色字段的定义，我们可以知道大概某个进程所代表的意义。先来动手看一看目前系统中的进程在SELinux下面的安全上下文是什么？

```java
#再来查看一下系统【进程的SELinux相关信息】
[root@study ~]# ps -eZ
LABEL                              PID TTY          TIME CMD
system_u:system_r:init_t:s0          1 ?        00:00:02 systemd
system_u:system_r:kernel_t:s0        2 ?        00:00:00 kthreadd
system_u:system_r:kernel_t:s0        3 ?        00:00:00 rcu_gp
system_u:system_r:kernel_t:s0        4 ?        00:00:00 rcu_par_gp
system_u:system_r:kernel_t:s0        6 ?        00:00:00 kworker/0:0H-kblockd
………………
unconfined_u:unconfined_r:unconfined_t:s0-s0:c0.c1023 3297 pts/0 00:00:00 bash
unconfined_u:unconfined_r:unconfined_t:s0-s0:c0.c1023 3328 pts/0 00:00:00 su
```

基本上进程主要就分为两大类，一种是系统有受限的system_u:system_r，另一种则可能是用户自己的，比较不受限的进程（通常是本机用户自己执行的进程），亦即是unconfined_u:unconfined_r这两种。

*学英语——confined：限定、监禁*

基本上，这些数据在target策略下对应如下：

身份识别
角色
该对应在targeted的意义

unconfined_u
unconfined_r
一般可登录用户的进程，比较没有受限的进程之意。大多数都是用户已经顺利登录系统（不论网络还是本机登录来获取可用的shell）后，所用来操作系统的进程。如bash、X Window相关软件等

system_u
system_r
由于为系统账号，因此是非交互式的系统运行进程，大多数的系统进程均是这种类型

但就如上所述，在默认的target策略下，其实最重要的字段是类型字段（type），主体与目标之间是否具有可以读写的权限，与进程的domain（域）及文件的type（类型）有关。这两者的关系我们可以使用crond以及他的配置文件来说明。即通过/usr/sbin/crond、/etc/crontab、/etc/cron.d等文件来说明。首先，先看看这几个东西的安全上下文内容：

```java
#1.先看看这个进程的安全上下文内容
[root@study ~]# ps -eZ | grep cron
system_u:system_r:crond_t:s0-s0:c0.c1023 1068 ? 00:00:00 crond
system_u:system_r:crond_t:s0-s0:c0.c1023 1069 ? 00:00:00 atd
#这个安全上下文的类型名称为crond_t
#2.再来看看执行文件、配置文件等的安全上下文内容是什么
[root@study ~]# ll -Zd /usr/sbin/crond /etc/crontab /etc/cron.d
drwxr-xr-x. 2 root root system_u:object_r:system_cron_spool_t:s0    39 1月  31 16:50 /etc/cron.d
-rw-r--r--. 1 root root system_u:object_r:system_cron_spool_t:s0   451 5月  11 2019 /etc/crontab
-rwxr-xr-x. 1 root root system_u:object_r:crond_exec_t:s0        80552 11月  9 2019 /usr/sbin/crond
```

当我们执行/usr/sbin/crond之后，这个程序变成的进程的domain类型会是crond_t，而这个cond_t能够读取的配置文件则为system_cron_spool_t这种类型。因此不论/etc/crontab、/etc/cron.d还是/var/spool/cron都会是相关的SELinux类型（/var/spool/cron为user_cron_spool_t）。

图示：

上图的意义我们可以这样看：

**1、** 首先，我们触发一个可执行的目标文件，即具有crond_exec_t这个类型的/usr/sbin/crond文件；

**2、** 该文件的类型会让这个文件所造成的主体进程（Subject）具有crond这个域（domain），我们的策略针对这个域已经制定了许多规则，其中包括这个域可以读取的目标资源类型；

**3、** 由于cronddomain被设置为可以读取system_cron_spool_t这个类型的目标文件（Object），因此你的配置文件放到/etc/cron.d目录下，就能够被crond那个进程所读取了；

**4、** 但最终能不能读到正确的数据，还要看rwx是否符合Linux权限的规范；

上述流程告诉我们几个重点，第一个是策略内需要制订详细的domain/type相关性；第二个是若文件的type设置错误，那么及时权限为rwx全开的777，该主体进程也无法读取目标文件资源。不过如此一来，也就可以避免用户将他的家目录设置为777时所造成的权限困扰。

我们再来做几个测试，就是万一你的crond配置文件的SELinux并不是system_cron_spool_t，该配置文件真的可以顺利被读取运行吗？来看看下面的示例：

```java
//在家目录下创建一个文件
[root@study ~]# vim checktime
10 * * * * root sleep 60s
//移动到cron.d目录下
[root@study ~]# mv checktime /etc/cron.d
[root@study ~]# ll /etc/cron.d/checktime
-rw-r--r--. 1 root root 26 7月  31 21:32 /etc/cron.d/checktime
//我们可以看到权限是644，即任何进程都能读取
//强制重新启动crond，然后看一下日志文件
[root@study ~]# systemctl restart crond
[root@study ~]# tail /var/log/cron
Jul 31 21:33:05 study crond[3122]: (CRON) INFO (RANDOM_DELAY will be scaled with factor 78% if used.)
Jul 31 21:33:06 study crond[3122]: ((null)) Unauthorized SELinux context=system_u:system_r:system_
cronjob_t:s0-s0:c0.c1023 file_context=unconfined_u:object_r:admin_home_t:s0 (/etc/cron.d/checktime)
Jul 31 21:33:06 study crond[3122]: (root) FAILED (loading cron table)
Jul 31 21:33:06 study crond[3122]: (CRON) INFO (running with inotify support)
Jul 31 21:33:06 study crond[3122]: (CRON) INFO (@reboot jobs will be run at computer's startup.)
//上面的意思是，有错误，因为原本的安全上下文与文件的实际安全上下文无法匹配的缘故
```

从上面的测试来看，我们的配置文件确实没有办法被crond这个服务所读取。而原因在日志文件中有说明，主要就是来自SELinux安全上下文类型的不同所致。

```java
//该用户bash产生的文件的type是：admin_home_t
[root@study ~]# ll -Zd /etc/cron.d/checktime 
-rw-r--r--. 1 root root unconfined_u:object_r:admin_home_t:s0 26 7月  31 21:32 /etc/cron.d/checktime
//而cron进程的domain是：crond_t
system_u:system_r:crond_t:s0-s0:c0.c1023 1068 ? 00:00:00 crond
domain（域）：crond_t 不能访问admin_home_t类型，故即使rwx权限没有问题，cron也不能访问checktime文件资源。
```

### SELinux的3种模式的启动、关闭、查看

#### 三种模式与状态查看

并非所有的Linux发行版都支持SELinux，所以必须要查看一下你的系统版本是什么。

目前的SELinux依据启动与否，有3种模式，分别如下：

**1、** Enforcing：强制模式，代表SELinux运行中，且已经正确开始限制domain/type（进程的域和文件的类型）；

**2、** Permissive：宽容模式，代表SELinux运行中，不过仅会有警告信息并不会实际限制domain/type的读写这种模式可以用来作为SELinux的debug之用；

**3、** Disabled：关闭模式，SELinux并没有实际运行；

*学英语：Permission：允许、许可*

首先你要知道，并不是所有的进程都会被SELinux所管制，因此最左边会出现一个所谓的【有受限的进程主体】（身份识别：system_u）。如何查看有没有受限（confined）？可以通过 ps -eZ去查看：

```java
[root@study ~]# ps -eZ | grep -E 'cron|bash'
system_u:system_r:crond_t:s0-s0:c0.c1023 1104 ? 00:00:00 atd
system_u:system_r:crond_t:s0-s0:c0.c1023 1107 ? 00:00:00 crond
unconfined_u:unconfined_r:unconfined_t:s0-s0:c0.c1023 3062 pts/0 00:00:00 bash
unconfined_u:unconfined_r:unconfined_t:s0-s0:c0.c1023 3569 pts/0 00:00:00 bash
```

我们可以看到，crond确实是受限的主体进程（身份识别：system_u），而bash因为是本机进程，就是不受限（unconfined）的类型，也就是说，bash不需要经过SELinux策略模式的规则和安全上下文的审核，可以直接去rwx的对比。

我们再来了解一下三种模式的运行状态。首先，如果是Disabled的模式，那么SELinux将不会运行，当然受限的进程也不会经过SELinux，也是直接去判断rwx。如果是宽容（Permissive）模式呢？这种模式也是不会阻止主体进程，不过万一没有通过策略规则或安全上下文的对比时，那么该读写操作将会被记录起来（log），可作为未来检查问题的判断依据。

至于最狠的Enforcing模式，就是实际将受限主体进入规则比对、安全上下文比对的流程，若失败，就直接组织主体进程的读写操作，并且将它记录了下来。如果通通没问题，这才进入到rwx权限的判断。这样可以理解三种模式的运行模式了吧？

那你怎么知道目前的SELinux模式呢？可以使用getenforce来查看：

```java
[root@study ~]# getenforce
Enforcing
```

另外，我们又如何知道SELinux的策略（Policy）是什么呢？这时可以用sestatus

```java
sestatus  [-vb]
-v：检查列于/etc/sestatus.conf内的文件与进程的安全上下文内容
-b：将目前策略的规则布尔值列出，某些规则rule是否要启动（0/1）
```

```java
[root@study ~]# sestatus 
SELinux status:                 enabled  //是否启动SELinux
SELinuxfs mount:                /sys/fs/selinux  //SELinux的相关文件挂载点
SELinux root directory:         /etc/selinux  //SELinux的根目录所在
Loaded policy name:             targeted  //目前的策略
Current mode:                   enforcing  //目前的模式
Mode from config file:          enforcing  //配置文件内规范的SELinux模式
Policy MLS status:              enabled  //是否含有MLS的模式机制
Policy deny_unknown status:     allowed   //是否默认阻止未知的主体进程
Memory protection checking:     actual (secure) 
Max kernel policy version:      31
```

如上，目前是启动的而且是Enforcing模式，而由配置文件查询得知亦为Enforcing模式。此外，目前的默认策略是targeted。

SELinux的配置文件是/etc/selinux/config

```java
[root@study ~]# cat /etc/selinux/config 
# This file controls the state of SELinux on the system.
# SELINUX= can take one of these three values:
#     enforcing - SELinux security policy is enforced.
#     permissive - SELinux prints warnings instead of enforcing.
#     disabled - No SELinux policy is loaded.
SELINUX=enforcing    //模式
# SELINUXTYPE= can take one of these three values:
#     targeted - Targeted processes are protected,
#     minimum - Modification of targeted policy. Only selected processes are protected. 
#     mls - Multi Level Security protection.
SELINUXTYPE=targeted   //策略
```

如果要修改默认策略的话，直接修改SELinux=enforcing那一行即可。

#### SELinux的启动与关闭

上面是默认的策略与启动的模式。你要注意的是，如果修改了策略则需要重新启动；如果由Enforcing或Permissive改成Disabled，或者由Disabled改成其他两个，那也必须要重新启动。这是因为SELinux是整合到内核中的，你只可以在SELinux运行下切换成为强制（Enforcing）或宽容（Permissive）模式，不能够直接关闭SELinux。如果你刚刚发现getenforce出现Disabled时，请到上述配置文件修改成为Enforcing然后重新启动。

另外要注意，如果从Disabled转到启动SELinux的模式时，由于系统必须要针对文件写入安全上下文信息，因此启动过程会花费不少时间在等待重新写入SELinux安全上下文（有时也称为SELinux Label），而且在写完之后还要再重新启动一次，你必须要等待很长一段时间。等到下次重新启动成功后，再使用getenforce或sestatus来查看是否成功启动到Enforcing模式。

如果你已经在Enforcing模式，但是可能由于一些设置的问题导致SELinux让某些服务无法正常地运行，此时可以将Enforcing的模式改为宽容（Permissive）的模式，让SELinux只会警告无法顺利连接的信息，而不是直接阻止主体进程的读取权限。让SELinux模式在Enforcing与Permissive之间切换的方法：

```java
setenforce   [0|1]
0：转成Permissive宽容模式
1：转成Enforcing强制模式
```

```java
[root@study ~]# setenforce 0
[root@study ~]# getenforce
Permissive
[root@study ~]# setenforce 1
[root@study ~]# getenforce
Enforcing
```

在Disabled模式下无法使用 setenforce

#### 提一下特殊情况

某些特殊情况下，你从Disable切成Enforcing之后，竟然有一堆服务无法顺利启动，都会跟你说在/lib/xxx里面的数据没有权限读取，所以启动失败。这大多是重新写入SELinux类型（Relabel）出错之故，使用Permissive就不会有这种错误。

解决方法：在Permissive模式下，使用 【restorecon -Rv /】重新还原所有的SELinux的类型，就能够解决这个问题。

### SELinux策略内的规则管理

我们知道SELinux的三种模式会影响到主体进程的放行与否。如果是进入Enforcing模式，那么接下来会影响主题进程的，就是第二关：【target策略内的各项规则（rules）】。

#### SELinux各个规则的布尔值查看getsebool

查看系统上面全部规则的启动与否（on/off），通过getsebool -a或者sestatus -b均可以：

```java
getsebool  [-a]  [规则的名称]
-a：列出目前系统上面的所有SELinux规则的布尔值状态
```

```java
[root@study ~]# getsebool -a 
abrt_anon_write --> off
abrt_handle_event --> off
abrt_upload_watch_anon_write --> on
antivirus_can_scan_system --> off
…………
cron_can_relabel --> off     //跟cron计划任务有关
cron_userdomain_transition --> on
…………
httpd_enable_homedirs --> off  //跟http网页有关
…………
```

#### SELinux各个规则规范的主体进程能够读取的文件SELinux类型查询seinfo、sesearch

我们现在知道有那么多的SELinux规则，但是每个规则内到底是在限制什么东西？如果你想要知道的话，就要使用seinfo工具。这些工具没有默认安装，因此请先拿出光盘并放到光驱，接下来我们来安装seinfo工具：

```java
[root@study ~]# mount /dev/sr0 /mnt/
mount: /mnt: WARNING: device write-protected, mounted read-only.
[root@study mnt]# yum install /mnt/BaseOS/Packages/setools-console-4.2.2-1.el8.x86_64.rpm 
```

```java
seinfo [-Atrub]
-A：列出SELinux的状态、规则布尔、身份识别、角色、类型等所有信息
-u：列出SELinux的所有身份识别（user）种类
-r：列出SELinux的所有角色（role）种类
-t：列出SELinux的所有类型（type）种类
-b：列出所有规则的种类（布尔值）
```

```java
//列出SELinux在此策略下的统计状态
[root@study mnt]# seinfo
Statistics for policy file: /sys/fs/selinux/policy
Policy Version:             31 (MLS enabled)
Target Policy:              selinux
Handle unknown classes:     allow
  Classes:             131    Permissions:         457
  Sensitivities:         1    Categories:         1024
  Types:              4940    Attributes:          252
  Users:                 8    Roles:                14
  Booleans:            330    Cond. Expr.:         379
  Allow:            113443    Neverallow:            0
  Auditallow:          160    Dontaudit:         10355
  Type_trans:       243653    Type_change:          87
…………………………
//上述信息可知，这个策略是targeted，此策略的安全上下文类型有4940个。
//而各种SELinux的规则（Boolean）共制订了295条
```

我们前面谈到的几个身份识别（user）及角色（role），如果你想要查询目前所有的身份识别与角色，使用【seinfo -u】及【seinfo -r】就可以知道了。

下面我们来介绍根据进程类型判断能够读取的文件类型：

```java
sesearch  [-A]  [-s  主体类型]  [-t  目标类型]  [-b  布尔值]
-A：列出后面数据中，允许【读取或放行】的相关信息
-t：后面还要接类型，例如-t   httpd_t
-b：后面还要接SELinux的规则，例如-b   httpd_enable_ftp_server
```

```java
//找出crond_t这个主体进程域（domain）能够读取的文件SELinux类型
[root@study mnt]# sesearch -A -s crond_t  |  grep  spool
allow crond_t cron_spool_t:dir { add_name getattr ioctl lock open read remove_name search write };
allow crond_t cron_spool_t:file { append create getattr ioctl link lock open read rename setattr unlink write };
allow crond_t system_cron_spool_t:dir { getattr ioctl lock open read search };
…………
//allow后面接主体进程以及文件的SELinux类型，上面的数据是选取出来的
//意思是说，crond_t可以读取system_cron_spool_t的文件/目录类型等
```

```java
//找出crond_t是否能够读取/etc/cron.d/checktime这个我们自定义的配置文件
[root@study mnt]# ll -Z /etc/cron.d/checktime 
-rw-r--r--. 1 root root unconfined_u:object_r:admin_home_t:s0 26 7月  31 21:32 
 etc/cron.d/checktime
[root@study mnt]# sesearch -A -s crond_t | grep admin_home_t
allow crond_t admin_home_t:dir { add_name getattr ioctl lock open read remove_name search write };
allow crond_t admin_home_t:lnk_file { getattr read };
allow domain admin_home_t:dir { getattr open search };
allow domain admin_home_t:lnk_file { getattr read };
//虽然有crond_t  admin_home_t 存在，但是这是总体的信息，并没有针对某些规则的寻找
//所以还是确定checktime能否被读取，但是，基本上就是SELinux的类型出现问题才会无法读取
```

现在我们知道/etc/cron.d/checktime我们自己复制过去的文件没有办法被读取的原因，因为SELinux类型错误。根本就无法被读取。

现在我们来查一查，getsebool -a里面看到的httpd_enable_homedirs到底是什么？又规范了哪些主体进程能够读取的SELinux类型呢？

```java
[root@study mnt]# semanage boolean -l | grep httpd_enable_homedirs
httpd_enable_homedirs          (off    ,   off)  Allow httpd to enable homedirs
//httpd_enable_homedirs的功能是允许httpd进程去读取使用者家目录的意思
```

```java
//列出这个规则，主体进程能够读取的文件SELinux类型
[root@study mnt]# sesearch -A -b httpd_enable_homedirs
allow httpd_suexec_t autofs_t:dir { getattr ioctl lock open read search }; [ use_nfs_home_dirs && httpd_enable_homedirs ]:True
allow httpd_suexec_t autofs_t:dir { getattr open search }; [ use_nfs_home_dirs && httpd_enable_homedirs ]:True
allow httpd_suexec_t cifs_t:dir { getattr ioctl lock open read search }; [ use_samba_home_dirs && httpd_enable_homedirs ]:True
allow httpd_suexec_t cifs_t:dir { getattr ioctl lock open read search }; [ use_samba_home_dirs && httpd_enable_homedirs ]:True
…………
//如果没有这个规则启动，httpd_t这种进程就无法读取使用者家目录下的文件
```

#### 修改SELinux规则的布尔值setsebool

```java
setsebool   [-P]  【规则名称】 [0|1]
-P：直接将设置值写入配置文件，该配置信息未来会生效的
```

```java
[root@study mnt]# getsebool httpd_enable_homedirs
httpd_enable_homedirs --> off
[root@study mnt]# setsebool -P httpd_enable_homedirs 1
[root@study mnt]# getsebool httpd_enable_homedirs
httpd_enable_homedirs --> on
```

记得这个setsebool一定要加上-P这个选项，因为这样才能将此设置写入配置文件。

### SELinux安全上下文的修改

SELinux对受限的主体进程有没有影响，首先考虑SELinux的三种类型；然后是考虑SELinux的策略规则是否放行，第三关则是开始比对SELinux的类型（即比对安全上下文）。

下面我们再介绍几个重要的东西：

#### 使用chcon手动修改文件的SELinux类型

```java
chcon  [-R]  [-t type]  [-u  user]  [-r role]  文件
chcon  [-R]  --reference=范例文件  文件
-R：连同该目录下的子目录也同时修改
-t：后面接安全上下文的类型栏位，例如httpd_sys_content_t
-u：后面接身份识别，例如system_u
-r：后面接角色，例如 system_r
-v：若有变化成功，请将变动的结果列出来
--reference=范例文件：拿某个文件当范例来修改后续文件的类型
```

```java
//查询一下/etc/hosts的type，并套用给checktime上
[root@study mnt]# ll -Z /etc/hosts
-rw-r--r--. 1 root root system_u:object_r:net_conf_t:s0 158 9月  10 2018 /etc/hosts
[root@study mnt]# ll -Z /etc/cron.d/checktime 
-rw-r--r--. 1 root root unconfined_u:object_r:admin_home_t:s0 26 7月  31 21:32 /etc/cron.d/checktime
[root@study mnt]# chcon -v -t net_conf_t /etc/cron.d/checktime 
正在更改'/etc/cron.d/checktime' 的安全环境
[root@study mnt]# ll -Z /etc/cron.d/checktime 
-rw-r--r--. 1 root root unconfined_u:object_r:net_conf_t:s0 26 7月  31 21:32 /etc/cron.d/checktime
```

这就把etc/cron.d/checktime的type给修改了

#### 使用restorecon 让文件恢复正确的SELinux类型

```java
restorecon  [-Rv] 文件或目录
-R：连同子目录一起修改
-v：将过程显示到屏幕
```

```java
//将/etc/cron.d/下面的文件通通恢复成默认的SELinux类型
[root@study mnt]# restorecon -Rv /etc/cron.d
Relabeled /etc/cron.d/checktime 
from unconfined_u:object_r:net_conf_t:s0 to unconfined_u:object_r:system_cron_spool_t:s0
```

这样就很轻松的恢复了整个目录下文件资源的type

#### semanage默认目录的安全上下文查询与修改

你应该觉得奇怪，为什么restorecon可以【恢复】原本的SELinux类型呢？那肯定是有个地方在记录每个文件/目录的SELinuxmore类型？没错，是这样。

```java
semanage {login|user|port|interface|fcontext|translation} -l
semanage fcontext -{a|d|m}  [-frst] file_spec
fcontext：主要用在安全上下文方面的用途，-l为查询的意思
-a：增加的意思，你可以增加一些目录的默认安全上下文类型设置
-m：修改的意思
-d：删除的意思
```

```java
//查询一下/etc  /etc/cron.d 默认的SELinux类型是什么
[root@study mnt]# semanage fcontext -l | grep -E '^/etc |^/etc/cron'
/etc                              all files          system_u:object_r:etc_t:s0 
……
/etc/cron\.d(/.*)?                all files          system_u:object_r:system_cron_spool_t:s0 
……
```

所以我们的/etc/cron.d/checktime会被restorecon还原成system_cron_spool_t

### SELinux的日志文件辅助

为了方便知道SELinux问题导致网络不对劲，我们可以利用几个服务来记录SELinux产生的错误。

那就是auditd与setroubleshootd

几乎所有的SELinux相关的进程都会以se开头，这个服务也是以se开头的。而troubleshoot大家都知道是错误解决，因此这个setroubleshoot自然就要启动它。这个服务会将关于SELinux的错误信息与解决方法记录到/var/log/message与/var/log/setroubleshoot/*中，所以你一定要启动这个服务才好。

启动这个服务之前就要安装它，这玩意儿需要两个软件：

**1、** setroublshoot；

**2、** setroubleshoot-server；

请用yum安装

```java
[root@study mnt]# find /mnt -name "setroubl*"
/mnt/AppStream/Packages/setroubleshoot-3.3.20-2.el8.x86_64.rpm
/mnt/AppStream/Packages/setroubleshoot-plugins-3.3.10-3.el8.noarch.rpm
/mnt/AppStream/Packages/setroubleshoot-server-3.3.20-2.el8.x86_64.rpm
[root@study mnt]# rpm -qa |grep setroubleshoot
setroubleshoot-plugins-3.3.10-3.el8.noarch
setroubleshoot-server-3.3.20-2.el8.x86_64
[root@study mnt]# yum install /mnt/AppStream/Packages/setroubleshoot-3.3.20-2.el8.x86_64.rpm 
[root@study mnt]# rpm -qa |grep setroubleshoot
setroubleshoot-plugins-3.3.10-3.el8.noarch
setroubleshoot-server-3.3.20-2.el8.x86_64
setroubleshoot-3.3.20-2.el8.x86_64
```

此外，原本的SELinux信息本来是以两个服务记录的，auditd和setroubleshoodtd，既然是同样的信息，故CentOS 6.x以后的版本将两者整合在auditd中，故现在没有setroubleshooted服务的存在了。因此，当你安装好了setroubleshoot-server之后，记得重新启动一下auditd，否则setroubleshootd的功能是不会被启动的。
