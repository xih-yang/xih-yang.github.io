# 15、Linux 基础 - 认识系统服务
- 来源：https://ddkk.com/zhuanlan/server/linux/4/15.html
- 分类：服务器框架
- 分组：教程目录
### 什么是daemon与服务（service）

*从CentOS 7.x开始，传统的init已经被抛弃，取而代之的是systemd*

### 什么是daemon与服务（service）

*学英语：daemon：[ˈdiːmən]：半神半人精灵、恶魔、守护神*

系统为了某些功能必须提供一些服务（不论系统本身还是网络方面），这个服务就是service。但是service的提供总是需要程序的运行吧，否则如何执行？所以完成这个service的程序我们就称它为daemon，举例来说，完成周期性计划任务服务（service）的程序为crond这个daemon。

一把来说，当我们以命令行或图形模式（非单人维护模式）完整地进入Linux主机后，操作系统已经提供了很多的服务，包括打印服务、计划任务服务、邮件管理服务等。那么这些服务是如何被启动的呢？他们的工作状态如何呢？

> service的名称被建立之后，在Linux中使用时，通常在service的后面加上一个d，例如计划任务命令建立的at与cron这两个服务，它的程序名会被取为atd和crond，这个d就是代表daemon。

### 早期System V的init管理操作中daemon的主要分类（Optional）

记得我们老早以前聊过的UNIX的System V版本吗？那个很纯净的UNIX版本，在那个年代，我们启动系统服务的管理方式被称为SysV的init脚本程序的处理方式。亦即系统内核第一个调用的程序是init，然后init去运行所有系统所需要的服务

基本上init的管理机制有如下几个特色：

- 服务的启动、关闭与查看等方式
- 所有的服务启动脚本放置于/etc/init.d目录中，基本上都是使用bash shell所写的脚本程序，需要启动、关闭、重新启动、查看状态时，可以通过如下方法：

启动：/etc/init.d/daemon start
- 关闭：/etc/init.d/daemon stop
- 重新启动：/etc/init.d/daemon restart
- 查看状态：/etc/init.d/daemon status

服务启动的分类

init服务的分类中，根据服务是独立启动或被一个总管程序管理而分为两大类

- 独立启动模式（stand alone）：服务启动成功，该服务直接常驻于内存中，提供本机或用户的服务操作，反应速度快
- 超级守护进程（super daemon）：由特殊的xinetd或inetd这两个总管程序提供socket对应或端口对应的管理。当没有用户要求某socket或端口时，所需要服务就不会被启动。若有用户要求时，xinetd才会去唤醒相对应的服务程序。当该要求结束时，此服务也会被结束，因为通过xinetd所总管，因此这个家伙就被称为super daemon。好处是可以通过super daemon 来执行服务的时程、连接需求等的控制，缺点是唤醒服务需要一点实际的延迟。

服务的依赖性问题

服务可能会有依赖性，例如你要启动网络服务，但是系统没有网络，就不能成功启动。如果你需要连接到外部取得认证服务器的连接，但该连接需要另一个A服务的需求，问题是A服务没有启动，因此，你的认证服务就不可能会成功启动，这就是所谓的服务依赖性问题。init在管理员自己手动处理这些服务时，是没有办法协助唤醒依赖服务的。

运行级别的分类

上面说到init是启动后内核主动调用的，然后init可以根据用户自定义的运行级别（runlevel）来唤醒不同的服务，以进入不同的操作界面。基本上Linux提供7个运行级别，分别是0、1、2、3、4、5、6，比较重要的是1（单人维护模式）、3（纯命令行模式）、5（图形界面）。而各个运行级别的启动脚本是通过/etc/rc.d/rc[0-6]/SXXdaemon链接到/etc/init.d/daemon，链接文件名（SXXdaemon）的功能为：S为启动该服务，XX为数字，为启动的顺序。由于有SXX的设置，因此在启动时可以【依序执行】所有需要的服务，同时也能解决依赖服务的问题，这点与管理员自己手动处理不太一样。

制定运行级别默认要启动的服务

若要建立如上提到的SXXdaemon的话，不需要管理员手动建立链接文件，通过如下的命令可以来处理默认启动、默认不启动、查看默认启动与否的操作

- 默认要启动：chkconfig daemon on
- 默认不启动：chkconfig daemon off
- 查看默认为启动与否：chkconfig –list daemon

运行级别的切换操作

当你要从命令行界面（runlevel 3）切换到图形界面（runlevel 5），不需要手动启动、关闭该运行级别的相关服务，只要【init 5】即可切换，init会主动去分析/etc/rc.d/rc[35].d/，这两个目录内的脚本，然后启动转换运行级别中需要的服务，就完成整体的运行级别切换。

基本上init主要的功能都写在上面了，重要的命令包括daemon本身自己的脚本（/etc/init.d/daemon）、xinetd这个特殊的超级守护进程（super daemon）、设置默认开机启动的chkconfig以及会影响到运行级别的init N等。虽然CentOS 7已经不使用init来管理服务了，不过因为考虑到某些脚本没有办法直接使用systemd处理，因此这些脚本还是被保留下来，所以，我们在这里还是稍微介绍一下，更多更详情的数据就请自己查询旧版本。

### systemd使用的unit分类

从CentOS 7.x以后，Red Hat系列的发行版放弃沿用多年的System V开机启动服务的流程，就是刚才说的init启动脚本的方法，改用systemd这个启动服务管理机制。那么，systemd有什么好处呢？

- 并行处理所有服务，加速开机流程
- 旧的init启动脚本是【一项一项任务依序启动】的模式，因此不依赖的服务也是得要一个一个的等待。但目前我们的硬件主机系统与操作系统几乎都支持多内核框架了，没道理不依赖的服务不能同时启动。systemd就是可以让所有的服务同时启动。systemd就是可以让所有的服务同时启动，因此你会发现，操作系统启动的速度变快了。
- 一经要求就响应的on-demand启动方式
- systemd 全部就是仅有一个systemd服务搭配systemctl命令来处理，无需其他额外的命令来支持。不像System V 还要init、chkconfig、service等命令。此外，systemd由于常驻内存，因此任何要求（on-demand）都可以立即处理后续的daemon启动任务。
- 服务依赖性的自我检查
- 由于systemd可以自定义服务依赖性的检查，因此如果B服务是架构在A服务上面启动的，当你在没有启动A服务的情况下仅手动启动B服务的时候，systemd就会帮你启动A服务。这样就可以免去管理员一项一项服务去分析的麻烦。
- 依daemon功能分类
- systemd旗下管理的服务非常多，为了梳理清楚所有服务的功能，因此，首先systemd先定义所有的服务为一个服务单位（unit），并将该unit归类到不同的服务类型（type）中，旧的init仅分为stand alone与super daemon，实在不够好，systemd将服务单位（unit）区分为service、socket、target、path、snapshot、timer等多种不同类型（type），方便管理员的分类与记忆。
- 将多个daemons集合成为一个群组
- 如同System V的init里面有个运行级别的角色，systemd亦将许多的功能集合成为一个所谓的target项目，这个项目主要在设计操作环境的创建，所以是集合了许多的daemons，亦即是执行某个target就是执行好多个daemon的意思。
- 向下兼容旧有的init服务版本
- 基本上，systemd可以兼容init的启动脚本，因此，旧的init启动脚本也能通过systemd来管理，只是更高级的systemd功能就没有办法支持。
- 虽然如此，不过，systemd也是有些地方无法完全替代init的，包括：

在运行级别的对应上，大概仅有runlevel 1、3、5有对应到systemd的某些target类型而已，没有全部对应。
- 全部的systemd都用systemctl这个管理程序进行管理，而systemctl支持的语法有限制，不像/etc/init.d/daemon就是纯脚本可以自定义参数，systemctl不可自定义参数。
- 如果某个服务启动时管理员自己手动执行启动，而不是使用systemctl去启动（例如你自己手动输入crond以启动crond服务），那么systemd将无法检测到该服务，而无法进一步管理。
- systemd启动过程中，无法与管理员通过标准输入传入信息。因此，自行编写systemd的启动设置时，务必要取消交互机制。（连通过启动时传入的标准输入信息也要避免）

不过，光是同步启动服务脚本这个功能就可以节省你很多的开机时间，同时systemd还有很多特殊的服务类型（type）可以提供更多有趣的功能，确实值得学一学。而且CentOS 7 已经使用了systemd，想不学也不行。

下面我们针对systemd管理的unit来了解一下：

#### systemd的配置文件放置目录

基本上，systemd将过去所谓的daemon执行脚本通通称为一个服务单位（unit），而每种服务单位根据功能来区分时，就分类为不同的类型（type）。基本的类型包括系统服务、数据监听与交换的socket文件服务（socket）、存储系统状态的快照类型、提供不同类型运行级别分类的操作环境（target）等。这么多类型，那设置时会不会很麻烦？其实还好，因为配置文件都放置在下面的目录中。

- /usr/lib/systemd/system/：每个服务最主要的启动脚本设置，有点类似以前的/etc/init.d 下面的文件
- /run/systemd/system/：系统执行过程中所产生的服务脚本，这些脚本的优先级要比/usr/lib/systemd/system/高
- /etc/systemd/system/：管理员根据主机系统的需求所建立的执行脚本。

也就是说，到底操作系统启动会不会执行某些服务其实都是看/etc/systemd/system/下面的设置，所以该目录下面是一大堆链接文件。而实际执行的systemd启动脚本配置文件，其实都是放置在/usr/lib/systemd/system/下面，因此如果你想要修改某个服务启动的设置，应该要去/usr/lib/systemd/system下面去修改才对，/etc/systemd/system/仅是链接到正确的配置文件而已。所以想要看执行脚本的设置，应该到/usr/lib/systemd/system/下面去看才对。

#### systemd的uint类型分类说明

/usr/lib/systemd/system/ 以下的数据如何区分上述所谓的不同的类型（type）呢？很简单，看扩展名。举例来说，我们来看看vsftpd这个范例的启动脚本设置，还有crond与命令行模式的multi-user设置：

```java
[root@study system]# ll /usr/lib/systemd/system/ | grep -E "(vsftpd|multi|cron)"
-rw-r--r--. 1 root root  356 11月  9 2019 crond.service
-rw-r--r--. 1 root root  815 11月  9 2019 multipathd.service
-rw-r--r--. 1 root root  186 11月  9 2019 multipathd.socket
-rw-r--r--. 1 root root  532 6月  22 2018 multi-user.target
drwxr-xr-x. 2 root root  258 1月  31 2020 multi-user.target.wants
lrwxrwxrwx. 1 root root   17 11月  9 2019 runlevel2.target -> multi-user.target
lrwxrwxrwx. 1 root root   17 11月  9 2019 runlevel3.target -> multi-user.target
lrwxrwxrwx. 1 root root   17 11月  9 2019 runlevel4.target -> multi-user.target
```

所以我们知道vsftpd与crond其实算是系统服务（service），而multi-user要算是执行环境相关的类型（target type）。根据这些扩展名的类型，我们大概可以找到如下几种比较常见的systemd的服务类型：

扩展名
主要服务功能

.service
一般服务类型 （service unit）：主要是系统服务，包括服务器本身所需要的本机服务以及网络服务都是！比较经常被使用到的服务大多是这种类型！ 所以，这也是最常见的类型了！

.socket
内部程序数据交换的插槽服务 （socket unit）：主要是 IPC （Interprocess communication） 的传输讯息socket文件 （socket file） 功能。 这种类型的服务通常在监控讯息传递的socket文件，当有通过此socket文件传递讯息来说要链接服务时，就依据当时的状态将该用户的要求传送到对应的daemon， 若 daemon 尚未启动，则启动该 daemon 后再传送用户的要求。

使用 socket 类型的服务一般是比较不会被用到的服务，因此在开机时通常会稍微延迟启动的时间 （因为比较没有这么常用嘛！）。一般用于本机服务比较多，例如我们的图形界面很多的软件都是通过 socket 来进行本机程序数据交换的行为。 （这与早期的 xinetd 这个 super daemon 有部份的相似喔！）

.target
执行环境类型 （target unit）：其实是一群 unit 的集合，例如上面表格中谈到的 multi-user.target 其实就是一堆服务的集合～也就是说， 选择执行multi-user.target 就是执行一堆其他 .service 或/及 .socket 之类的服务就是了！

.mount

.automount

文件系统挂载相关的服务 （automount unit / mount unit）：例如来自网络的自动挂载、NFS 文件系统挂载等与文件系统相关性较高的程序管理。

.path
侦测特定文件或目录类型 （path unit）：某些服务需要侦测某些特定的目录来提供伫列服务，例如最常见的打印服务，就是通过侦测打印伫列目录来启动打印功能！ 这时就得要 .path 的服务类型支持了！

.timer
循环执行的服务 （timer unit）：这个东西有点类似 anacrontab 喔！不过是由 systemd 主动提供的，比 anacrontab 更加有弹性！

其中又以.service的系统服务类型最常见，因为我们一堆网络服务都是使用这种类型来设计的。接下来，让我们谈谈如何管理这些服务的启动与关闭。

## 通过systemctl管理服务

基本上，systemd这个启动服务的机制，主要是通过一个名为systemctl的命令来完成。跟以前的System V需要service、chkconfig、setup、init等命令来协助不同，systemd只有systemctl这一个命令来处理而已，所以全部的操作都得要使用systemctl。

### 通过systemctl管理单一服务（service unit）的启动/开机启动与查看状态

一般来说服务的启动有两个阶段，一个是开机的时候设置要不要启动这个服务，以及你现在要不要启动这个服务。这两者有很大的差异。

```java
systemctl   [command]  [unit]
start：立刻启动后面接的unit
stop：立刻关闭后面接的unit
restart：立刻重新启动后面接的unit，亦即执行stop再start
reload：不关闭后面接的unit的情况下，重新加载配置文件，让设置生效
enable：设置下次开机，后面接的unit会被启动
disable：设置下次开机，后面接的unit不会被启动（其实是删了/etc/systemd/system/下的对应链接文件）
status：目前后面接的这个unit的状态，会列出有没有正在执行、 
       开机默认执行与否、登录等信息等
is-active：目前有没有正在运行中
is-enable：开始时有没有默认要启用这个unit
```

假设我们现在要【立即停止atd这个服务】时，正确的方法（不要kill）要怎么处理？

```java
//看看目前atd这个服务的状态是什么
[root@study system]# systemctl status atd.service
● atd.service - Job spooling tools
   Loaded: loaded (/usr/lib/systemd/system/atd.service; enabled; vendor preset: enabled)
   Active: active (running) since Thu 2020-08-06 19:59:48 CST; 2h 22min ago
 Main PID: 1099 (atd)
    Tasks: 1 (limit: 11332)
   Memory: 608.0K
   CGroup: /system.slice/atd.service
           └─1099 /usr/sbin/atd -f
8月 06 19:59:48 study.cool systemd[1]: Started Job spooling tools.
//重点在第二行、第三行
//Loaded：这行在说明，开机的时候这个unit会不会启动，enabled为开机启动；disabled为开机不会启动
//Active：现在这个unit的状态是正在被执行（running）或没有执行（dead）
//后面几行则是说明这个unit程序的PID状态以及最后一行显示这个服务的日志文件信息
//日志文件信息格式为：【时间】【信息发送主机】【哪一个服务的信息】【实际发送内容】
```

```java
//关闭这个atd服务
[root@study system]# systemctl stop atd.service
[root@study system]# systemctl status atd.service
● atd.service - Job spooling tools
   Loaded: loaded (/usr/lib/systemd/system/atd.service; enabled; vendor preset: enabled)
   Active: inactive (dead) since Thu 2020-08-06 22:45:56 CST; 1s ago
  Process: 1099 ExecStart=/usr/sbin/atd -f $OPTS (code=exited, status=0/SUCCESS)
 Main PID: 1099 (code=exited, status=0/SUCCESS)
8月 06 19:59:48 study.cool systemd[1]: Started Job spooling tools.
8月 06 22:45:56 study.cool systemd[1]: Stopping Job spooling tools...
8月 06 22:45:56 study.cool systemd[1]: Stopped Job spooling tools.
//目前这个unit下次开机还是会启动，但是现在处于关闭状态。
//同时，最后两行为新增加的登录信息，告诉我们目前的系统状态。
```

上面的示例中，我们已经关闭了atd，这样做才是对的。不应该使用kill的方式来关闭一个正常的服务。否则systemctl会无法继续监控该服务，那就比较麻烦了。

使用systemctl status atd的输出结果中，第2、3行很重要，因为那个是告知我们该unit下次开机会不会默认启动，以及目前启动的状态，相当重要。

最下面那个是unit的日志文件，如果你的这个unit曾经出错过，查看这个地方也是相当重要的。

说回第三行，Active的daemon的状态值，常见如下：

- active（running）：正有一个或多个进程正在系统中运行的意思，举例来说，正在运行中的vsftpd就是这种状态
- active（exited）：仅执行一次就正常结束的服务，目前并没有任何进程在系统中执行。举例：开机或是挂载时才会执行一次的quotaon功能，就是这种模式。quotaon不需要一直运行，只执行一次之后，就交给文件系统去自行处理。通常用bash shell写的小型服务，大多是属于这种类型的（无须常驻内存）
- active（waiting）：正在运行当中，不过还需等待其他的事件发生才能继续运行。举例来说，打印的队列相关服务就是这种状态。虽然正在启动中，不过，也需要真的有队列进来（打印作业）这样它才会继续唤醒打印机服务来进行下一步的打印功能。
- inactive：这个服务没有运行

既然daemon目前的状态就这么多种了，那么daemon的默认状态有没有可能除了enable/disable之外，还有其他的情况呢？当然有。

- enabled：这个daemon将在开机时被运行
- disabled：这个daemon在开机时不被运行
- static：这个daemon不可以自己启动（不可enable），不过可能会被其他的enabled的服务来唤醒（依赖属性的服务）
- mask：这个daemon无论如何都无法被启动，因为已经被强制注销（非删除）。可通过systemctl unmask方式改回默认状态。

一定要记住，很多时候，很多服务彼此是有依赖性的，你关闭了某一个，当你启用另一个服务的时候，很可能会将关闭的服务再次唤醒，除非用mask将其彻底封印。

### 通过systemctl查看系统上所有的服务

我们可以通过命令来查看系统上一共有多少服务：

```java
systemctl   [command]   [--type=TYPE]   [--all]
若systemctl不加参数，等价于加了list-units
command:
     list-units：依据unit显示目前有启动的unit，若加上--all才会加上没有启动的
     list-unit-files：依据/usr/lib/systemd/system/内的文件，将所有文件列表说明
--type=TYPE：就是unit类型，例如service、socket、target等
```

```java
//列出系统上面有启动的unit服务
[root@study system]# systemctl 
UNIT                                   LOAD   ACTIVE SUB       DESCRIPTION              
proc-sys-fs-binfmt_misc.automount     loaded active waiting   Arbitrary Executable File>
sys-devices-pci0000:00-0000:00:07.1-ata2-host1-target1:0:0-1:0:0:0-block-sr0.device  loaded active plugged   VMware_Virtual_IDE_CDROM_>
UNIT                                                   LOAD   ACTIVE SUB       DESCRIPTION              
proc-sys-fs-binfmt_misc.automount                    loaded active waiting   Arbitrary Executable File>
sys-devices-pci0000:00-0000:00:07.1-ata2-host1-target1:0:0-1:0:0:0-block-sr0.device   loaded active plugged   VMware_Virtual_IDE_CDROM_>
sys-devices-pci0000:00-0000:00:10.0-host2-target2:0:0-2:0:0:0-block-sda-sda1.device   loaded active plugged   VMware_Virtual_S 1   
…………………………………………
LOAD   = Reflects whether the unit definition was properly loaded.
ACTIVE = The high-level unit activation state, i.e. generalization of SUB.
SUB    = The low-level unit activation state, values depend on unit type.
177 loaded units listed. Pass --all to see loaded but inactive units, too.
To show all installed unit files use 'systemctl list-unit-files'.
//列出的项目中，主要的含义是：
//UNIT：项目的名称，包括各unit的类型（后缀名）
//LOAD：开机时是否会被自动加载，默认systemctl显示的是有加载的项目
//ACTIVE：目前的状态，需与后续SUB搭配，就是我们用systemctl status查看时，active的项目
//DESCRIPTION：详细描述
```

使用systemctl list-unit-files会将系统上所有的服务通通显示出来，而不像list-units仅以unit分类作大致的说明。

### 通过systemctl管理不同的操作环境（target unit）

通过上一小节我们知道系统上所有的systemd的unit查看方式，那么可否列出跟操作界面有关的target项目呢？很简单，我们这样操作一下：

```java
[luoluo@study ~]$ systemctl list-units --type=target --all
  UNIT                      LOAD      ACTIVE   SUB    DESCRIPTION              
  UNIT                      LOAD      ACTIVE   SUB    DESCRIPTION              
  basic.target              loaded    active   active Basic System             
  bluetooth.target          loaded    active   active Bluetooth                
  cryptsetup.target         loaded    active   active Local Encrypted Volumes  
  emergency.target          loaded    inactive dead   Emergency Mode           
  getty-pre.target          loaded    inactive dead   Login Prompts (Pre)      
  getty.target              loaded    active   active Login Prompts            
  graphical.target          loaded    active   active Graphical Interface      
  initrd-fs.target          loaded    inactive dead   Initrd File Systems      
  initrd-root-device.target loaded    inactive dead   Initrd Root Device       
  initrd-root-fs.target     loaded    inactive dead   Initrd Root File System  
  initrd-switch-root.target loaded    inactive dead   Switch Root              
  initrd.target             loaded    inactive dead   Initrd Default Target    
  local-fs-pre.target       loaded    active   active Local File Systems (Pre) 
  local-fs.target           loaded    active   active Local File Systems       
  multi-user.target         loaded    active   active Multi-User System        
  network-online.target     loaded    active   active Network is Online        
  network-pre.target        loaded    active   active Network (Pre)            
  network.target            loaded    active   active Network                  
  nfs-client.target         loaded    active   active NFS client services      
  nss-lookup.target         loaded    inactive dead   Host and Network Name Loo>
  nss-user-lookup.target    loaded    active   active User and Group Name Looku>
  paths.target              loaded    active   active Paths                    
  UNIT                      LOAD      ACTIVE   SUB    DESCRIPTION              
  basic.target              loaded    active   active Basic System             
  bluetooth.target          loaded    active   active Bluetooth                
  cryptsetup.target         loaded    active   active Local Encrypted Volumes  
  emergency.target          loaded    inactive dead   Emergency Mode           
  getty-pre.target          loaded    inactive dead   Login Prompts (Pre)      
  getty.target              loaded    active   active Login Prompts            
  graphical.target          loaded    active   active Graphical Interface      
  initrd-fs.target          loaded    inactive dead   Initrd File Systems      
  initrd-root-device.target loaded    inactive dead   Initrd Root Device       
  initrd-root-fs.target     loaded    inactive dead   Initrd Root File System  
  initrd-switch-root.target loaded    inactive dead   Switch Root              
  initrd.target             loaded    inactive dead   Initrd Default Target    
  local-fs-pre.target       loaded    active   active Local File Systems (Pre) 
  local-fs.target           loaded    active   active Local File Systems       
  multi-user.target         loaded    active   active Multi-User System        
  network-online.target     loaded    active   active Network is Online        
  network-pre.target        loaded    active   active Network (Pre)            
  network.target            loaded    active   active Network                  
  nfs-client.target         loaded    active   active NFS client services      
  nss-lookup.target         loaded    inactive dead   Host and Network Name Loo>
  nss-user-lookup.target    loaded    active   active User and Group Name Looku>
  paths.target              loaded    active   active Paths                    
  UNIT                      LOAD      ACTIVE   SUB    DESCRIPTION              
  basic.target              loaded    active   active Basic System             
  bluetooth.target          loaded    active   active Bluetooth                
  cryptsetup.target         loaded    active   active Local Encrypted Volumes  
  emergency.target          loaded    inactive dead   Emergency Mode           
  getty-pre.target          loaded    inactive dead   Login Prompts (Pre)      
  getty.target              loaded    active   active Login Prompts            
  graphical.target          loaded    active   active Graphical Interface      
  initrd-fs.target          loaded    inactive dead   Initrd File Systems      
  initrd-root-device.target loaded    inactive dead   Initrd Root Device       
  initrd-root-fs.target     loaded    inactive dead   Initrd Root File System  
  initrd-switch-root.target loaded    inactive dead   Switch Root              
  initrd.target             loaded    inactive dead   Initrd Default Target    
  local-fs-pre.target       loaded    active   active Local File Systems (Pre) 
  local-fs.target           loaded    active   active Local File Systems       
  multi-user.target         loaded    active   active Multi-User System        
  network-online.target     loaded    active   active Network is Online        
  network-pre.target        loaded    active   active Network (Pre)            
  network.target            loaded    active   active Network                  
  nfs-client.target         loaded    active   active NFS client services      
  nss-lookup.target         loaded    inactive dead   Host and Network Name Loo>
  nss-user-lookup.target    loaded    active   active User and Group Name Looku>
  paths.target              loaded    active   active Paths                    
  remote-fs-pre.target      loaded    active   active Remote File Systems (Pre)
  remote-fs.target          loaded    active   active Remote File Systems      
  rescue.target             loaded    inactive dead   Rescue Mode              
  rpc_pipefs.target         loaded    active   active rpc_pipefs.target        
  rpcbind.target            loaded    active   active RPC Port Mapper          
  shutdown.target           loaded    inactive dead   Shutdown                 
  slices.target             loaded    active   active Slices                   
  sockets.target            loaded    active   active Sockets                  
  sound.target              loaded    active   active Sound Card               
  sshd-keygen.target        loaded    active   active sshd-keygen.target       
  swap.target               loaded    active   active Swap                     
  sysinit.target            loaded    active   active System Initialization    
● syslog.target             not-found inactive dead   syslog.target            
  time-sync.target          loaded    inactive dead   System Time Synchronized 
  timers.target             loaded    active   active Timers                   
  umount.target             loaded    inactive dead   Unmount All Filesystems  
LOAD   = Reflects whether the unit definition was properly loaded.
ACTIVE = The high-level unit activation state, i.e. generalization of SUB.
SUB    = The low-level unit activation state, values depend on unit type.
38 loaded units listed.
To show all installed unit files use 'systemctl list-unit-files'.
```

跟操作界面相关性比较高的主要有下面几个：

- graphical.target：就是命令加上图形界面，这个项目已经包含了下面的multi-user.target。
- multi-user.target：纯命令模式
- rescue.target：在无法使用root登录的情况下，systemd在启动时多加一个额外的临时系统，与你原本的系统无关，这时你可以取得root的权限来维护你的系统。但是这是额外系统，因此可能需要用到chroot方式来取得你原有的系统。
- emergency.target：紧急处理系统的错误，还是需要使用root登陆的情况，在无法使用rescue.target时，可以尝试这种模式
- shutdown.target：就是关机模式
- getty.target：可设置你需要几个tty之类的操作，如果想要降低tty的数量，可以修改他的配置文件

正常的模式是multi-user.target以及graphical.target两个，恢复方面的模式主要是rescue.target以及更紧急的emergency.target。如果要修改可提供登录的tty数量，则修改getty.target即可。基本上，我们最常使用的当然就是multi-user以及graphical。

那么我如何知道目前的模式是哪一种呢？又要如何修改呢？

```java
systemctl  [command]  [unit.target]
command：
       get-default：取得目前的target
       set-default：设置后面接的target成为默认的操作模式
       isolate：切换到后面接的模式
```

```java
//更改默认的操作环境
[luoluo@study ~]$ systemctl get-default
graphical.target
[luoluo@study ~]$ systemctl set-default multi-user.target
Removed /etc/systemd/system/default.target.
Created symlink /etc/systemd/system/default.target → /usr/lib/systemd/system/multi-user.target.
[luoluo@study ~]$ systemctl get-default
multi-user.target
//将现在的操作环境改为纯命令行的模式
[luoluo@study ~]$ systemctl  isolate  multi-user.target
//改回图形化界面模式
[luoluo@study ~]$ systemctl  isolate  graphical.target
```

注意，改变当前graphics.target以及multi-user.target是通过isolate来完成的。

对于service部分用start、stop、restart等参数，在target项目则使用isolate（隔离不同的操作环境）才对。

在正常的情况下，使用上述isolate的方式即可，不过为了方便起见，systemd也提供了数个简单的命令给我们切换操作模式之用。大致如下：

```java
systemctl   poweroff   //系统关机
systemctl   reboot     //重新开机
systemctl   suspend   //进入挂起（暂停）模式
systemctl   hibernate   //进入休眠模式
systemctl   rescue    //强制进入恢复模式
systemctl   emergency   //强制进入紧急恢复模式
```

关机、重新启动、恢复与紧急模式这没啥问题，那么什么是挂起与休眠模式呢？

- suspend：挂起（暂停）模式会将系统的状态数据保存到内存中，然后关闭大部分的系统硬件，当然，并没有实际关机。当用户按下唤醒键按钮，系统数据会从内存中恢复，然后重新驱动被大部分关闭的硬件，就开始正常运行，唤醒的速度较快。
- hibernate：休眠模式则是将系统状态保存到硬盘当中，保存完毕后，将计算机关机。当用户尝试唤醒系统时，系统会开始正常运行，然后将保存在硬盘中的系统状态恢复起来，因为数据是由硬盘读出，因此唤醒的性能与你的硬盘速度有关。

### 通过systemctl分析各服务之间的依赖性

我们前面就聊过服务的依赖性问题，如何追踪一个unit的依赖性呢？下面就来谈一谈。

```java
systemctl   list-dependencies  [unit]  [--reverse]
--reverse：反向追踪谁使用这个unit的意思
```

```java
[luoluo@study ~]$ systemctl get-default
multi-user.target
[luoluo@study ~]$ systemctl  list-dependencies
default.target
● ├─atd.service
● ├─auditd.service
● ├─avahi-daemon.service
● ├─crond.service
● ├─cups.path
………………
● ├─tuned.service
● ├─vdo.service
● ├─vmtoolsd.service
● ├─basic.target
● │ ├─-.mount
● │ ├─microcode.service
● │ ├─paths.target
```

直接使用list-dependencies时，所列出的default.target其实是multi-user.target的内容。

上面列出的都是依赖于multi-user.target的服务，那么如果我们想要看multi-user.target所依赖的服务呢？

```java
[luoluo@study ~]$ systemctl  list-dependencies  --reverse
default.target
● └─graphical.target
```

这样我们就能很好的了解到服务之间的依赖关系。

### 与systemd的daemon运行过程相关的目录简介

#### daemon目录

我们前面谈过比较重要的systemd启动脚本配置文件在/usr/lib/systemd/system与/etc/systemd/system/目录下，那还有哪些目录跟系统的daemon有关呢？

- /usr/lib/systemd/system/：使用CentOS官方提供的软件安装后，默认的启动脚本配置文件都放在这里。尽量不要修改。
- /run/systemd/system/：系统执行过程中所产生的服务脚本，这些脚本的优先级要比/usr/lib/systemd/system/高
- /etc/systemd/system/：管理员依据主机系统的需求所建立的执行脚本，
- /etc/sysconfig/*：几乎所有的服务都会将初始化的一些选项设置写入到这个目录。
- /var/lib/：一些会产生数据的服务都会将它的数据写入到/var/lib/目录中。
- /run/：放置了好多daemon的缓存，包括lock文件以及PID文件等

我们知道systemd里面有很多的本机会用到的socket服务，里面可能会产生很多的socket文件，那你怎么知道这些socket文件放置在哪里？答案还是利用systemctl命令：

```java
[luoluo@study ~]$ systemctl   list-sockets
LISTEN                                UNIT                            ACTIVATES
/run/avahi-daemon/socket              avahi-daemon.socket             avahi-daemon.service
/run/dbus/system_bus_socket           dbus.socket                     dbus.service
/run/dmeventd-client                  dm-event.socket                 dm-event.service
/run/dmeventd-server                  dm-event.socket                 dm-event.service
/run/initctl                          systemd-initctl.socket          systemd-initctl.service
/run/lvm/lvmpolld.socket              lvm2-lvmpolld.socket            lvm2-lvmpolld.service
/run/rpcbind.sock                     rpcbind.socket                  rpcbind.service
/run/systemd/coredump                 systemd-coredump.socket        
/run/systemd/journal/dev-log          systemd-journald-dev-log.socket systemd-journald.service
/run/systemd/journal/socket           systemd-journald.socket         systemd-journald.service
/run/systemd/journal/stdout           systemd-journald.socket         systemd-journald.service
/run/udev/control                     systemd-udevd-control.socket    systemd-udevd.service
/var/run/.heim_org.h5l.kcm-socket     sssd-kcm.socket                 sssd-kcm.service
/var/run/cups/cups.sock               cups.socket                     cups.service
/var/run/libvirt/virtlockd-sock       virtlockd.socket                virtlockd.service
/var/run/libvirt/virtlogd-sock        virtlogd.socket                 virtlogd.service
0.0.0.0:111                           rpcbind.socket                  rpcbind.service
0.0.0.0:111                           rpcbind.socket                  rpcbind.service
@/org/kernel/linux/storage/multipathd multipathd.socket               multipathd.service
@ISCSIADM_ABSTRACT_NAMESPACE          iscsid.socket                   iscsid.service
@ISCSID_UIP_ABSTRACT_NAMESPACE        iscsiuio.socket                 iscsiuio.service
[::]:111                              rpcbind.socket                  rpcbind.service
[::]:111                              rpcbind.socket                  rpcbind.service
kobject-uevent 1                      systemd-udevd-kernel.socket     systemd-udevd.service
24 sockets listed.
Pass --all to see loaded but inactive sockets, too.
```

这样很清楚地就能知道正在监听本地服务需求的socket文件所在位置了

#### 网络服务与端口对应简介

我们知道，系统所有的功能都是某些进程所提供的，而进程则是通过程序而产生的。同样，操作系统提供的网络服务其实也是这样。

操作系统上面有没有什么设置可以让服务与端口对应在一起呢？那就是/etc/services。

```java
[root@study ~]# cat /etc/services 
…………
chargen         19/udp          ttytst source
ftp-data        20/tcp
ftp-data        20/udp
# 21 is registered to ftp, but also used by fsp
ftp             21/tcp
ftp             21/udp          fsp fspd
ssh             22/tcp                          The Secure Shell (SSH) Protocol
ssh             22/udp                          The Secure Shell (SSH) Protocol
telnet          23/tcp
telnet          23/udp
# 24 - private mail system
lmtp            24/tcp                          LMTP Mail Delivery
lmtp            24/udp     
…………
finger          79/udp
http            80/tcp          www www-http    WorldWideWeb HTTP
http            80/udp          www www-http    HyperText Transfer Protocol
http            80/sctp                         HyperText Transfer Protocol
kerberos        88/tcp          kerberos5 krb5  Kerberos v5
…………
```

这个文件的内容是以下面的格式来显示的：

第一栏为daemon（服务对应的程序）的名称、第二栏为该daemon所使用的端口号与网络数据封包协议，封包协议主要为可靠连接的TCP封包以及较快但非面向连接的UDP封包。举例来说，那个远程连接使用的是ssh这个服务，而这个服务使用的端口号是22，就是这样。

### 关闭网络服务

为什么systemctl查看本地服务器启动的服务时，会有这个多的daemon，ststemd会将许多原本不被列为daemon的进程都纳入到systemd自己的管辖范文内，因此就多了很多daemon的存在。那些大部分都属于Linux系统基础运行所需要的环境，没有什么特别需求最好不要修改。

除了本地服务以外，比较重要的就是网络服务，虽然网络服务默认由SELinux管理，不过，还是建议非必要的网络服务就关闭它。基本上，会产生一个网络监听端口（port）的进程，就可以称它为网络服务。那么如何查看网络端口？

```java
[root@study ~]# netstat -tlunp
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address        Foreign Address   State       PID/Program name    
tcp        0      0 0.0.0.0:111          0.0.0.0:*         LISTEN      1/systemd           
tcp        0      0 192.168.122.1:53     0.0.0.0:*         LISTEN      1629/dnsmasq        
tcp        0      0 0.0.0.0:22           0.0.0.0:*         LISTEN      1020/sshd           
tcp6       0      0 :::111               :::*              LISTEN      1/systemd           
tcp6       0      0 :::22                :::*              LISTEN      1020/sshd           
udp        0      0 192.168.122.1:53     0.0.0.0:*                     1629/dnsmasq        
udp        0      0 0.0.0.0:67           0.0.0.0:*                     1629/dnsmasq        
udp        0      0 192.168.2.105:68     0.0.0.0:*                     1010/NetworkManager 
udp        0      0 0.0.0.0:111          0.0.0.0:*                     1/systemd           
udp        0      0 0.0.0.0:5353         0.0.0.0:*                     905/avahi-daemon: r 
udp        0      0 0.0.0.0:55637        0.0.0.0:*                     905/avahi-daemon: r 
udp6       0      0 :::33542             :::*                          905/avahi-daemon: r 
udp6       0      0 :::111               :::*                          1/systemd           
udp6       0      0 :::5353              :::*                          905/avahi-daemon: r 
```

我们的操作系统上至少开了22、111、33542等端口，其中5353、55637、33542、5353这几个端口是由avahi-daemon这个服务所启动，接下来我们用systemctl去查看一下，到底有没有avahi-daemon为开头的服务？

```java
[root@study ~]# systemctl list-units  --all  |  grep  avahi-daemon
  avahi-daemon.service    loaded    active   running   Avahi mDNS/DNS-SD Stack                                                                                          
  avahi-daemon.socket     loaded    active   running   Avahi mDNS/DNS-SD Stack Activation Socket 
```

通过追查，知道这个avahi-daemon的功能是在局域网进行类似网络邻居的查找，因此这个服务可以协助你在局域网内随时了解即插即用的设备，包括笔记本电脑等。

你可能并不需要这个协议，现在我们来关闭它：

```java
[root@study ~]# systemctl stop avahi-daemon.service
Warning: Stopping avahi-daemon.service, but it can still be activated by:
  avahi-daemon.socket
[root@study ~]# systemctl stop avahi-daemon.socket
[root@study ~]# systemctl disable avahi-daemon.socket avahi-daemon.socket
Removed /etc/systemd/system/sockets.target.wants/avahi-daemon.socket.
[root@study ~]# netstat -tlunp
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address    State       PID/Program name    
tcp        0      0 0.0.0.0:111             0.0.0.0:*          LISTEN      1/systemd           
tcp        0      0 192.168.122.1:53        0.0.0.0:*          LISTEN      1629/dnsmasq        
tcp        0      0 0.0.0.0:22              0.0.0.0:*          LISTEN      1020/sshd           
tcp6       0      0 :::111                  :::*               LISTEN      1/systemd           
tcp6       0      0 :::22                   :::*               LISTEN      1020/sshd           
udp        0      0 192.168.122.1:53        0.0.0.0:*                      1629/dnsmasq        
udp        0      0 0.0.0.0:67              0.0.0.0:*                      1629/dnsmasq        
udp        0      0 192.168.2.105:68        0.0.0.0:*                      1010/NetworkManager 
udp        0      0 0.0.0.0:111             0.0.0.0:*                      1/systemd           
udp6       0      0 :::111                  :::*                           1/systemd    
```

## systemctl针对service类型的配置文件

以前，我们想要建立系统服务，就得要到/etc/init.d/下面去建立相对应的bash脚本来完成。那么现在systemd的环境下面，如果我们想要设置相关的服务启动环境，该怎么做？

### systemctl配置文件相关目录简介

我们上面知道，/usr/lib/systemd/system/下的文件尽量不要去修改，主要是改/etc/systemd/system/下的文件。举例来说，如果你想要额外修改vsftpd.service的话，它们建议要放置在哪些地方呢？

- /usr/systemd/system/vsftpd.service：官方发布的默认配置文件
- /etc/systemd/system/vsftpd.service.d/custom.conf：在/etc/systemd/system下面建立与配置文件相同文件名的目录，但要加上.d的扩展名，然后在该目录下建立配置文件即可。另外，配置文件的扩展名最好使用.conf，在这个目录下的文件会【累加其他设置】到/usr/lib/systemd/system/vsftpd.service中
- /etc/systemd/system/vsftpd.service.wants/*：此目录内的文件为链接文件，设置依赖服务的链接，意思是启动vsftpd.service之后，最好再加上该目录下面建议的服务。
- /etc/systemd/system/vsftpd.service.requires/*：此目录内的文件为链接文件，设置依赖服务的链接，意思是启动vsftpd.service之前，需要事先启动哪些服务的意思。

### systemctl配置文件的设置项目介绍

我们来看看官方给的sshd.service的内容。

```java
[root@study ~]# cat /usr/lib/systemd/system/sshd.service
[Unit]      //这个项目与此unit的解释，执行服务依赖性有关
Description=OpenSSH server daemon
Documentation=man:sshd(8) man:sshd_config(5)
After=network.target sshd-keygen.target
Wants=sshd-keygen.target
[Service]   //这个项目与实际执行的命令参数有关
Type=notify
EnvironmentFile=-/etc/crypto-policies/back-ends/opensshserver.config
EnvironmentFile=-/etc/sysconfig/sshd
ExecStart=/usr/sbin/sshd -D $OPTIONS $CRYPTO_POLICY
ExecReload=/bin/kill -HUP $MAINPID
KillMode=process
Restart=on-failure
RestartSec=42s
[Install]    //这个项目说明此unit要挂载到哪个target下面
WantedBy=multi-user.target
```

分析上面的配置文件，我们大概能够将整个设置分为三个部分。

- Unit：unit本身的说明，以及与其他依赖daemon的设置，包括在什么服务之后才启动此unit之类的设置值。
- Service、Socket、Timer、Mount、Path：不同的unit类型就得要使用相对应的设置项目。我们使用sshd.service来当模板，所以这边就使用Service来设置。这个项目主要用来规范服务启动的脚本、环境配置文件名、重新启动的方式等。
- Install：这个项目就是将此unit安装到那个target里面去的意思

至于配置文件内有些设置规则还是得要说明一下：

- 设定项目通常是可以重复的，例如我可以重复设定两个 After 在配置文件中，不过，后面的设定会取代前

面的喔！因此，如果你想要将设定值归零， 可以使用类似『 After= 』的设定，亦即该项目的等号后面什

么都没有，就将该设定归零了 (reset)。

- 如果设定参数需要有『是/否』的项目 (布尔值, boolean)，你可以使用 1, yes, true, on 代表启动，用 0, no, false,off 代表关闭！随你喜好选择啰！
- 空白行、开头为 # 或 ; 的那一行，都代表注释

每个部分里面的很多设置，我们用一个简单的表格来说明：

[Unit] 部份

设定参数

参数意义说明

Description

就是当我们使用 systemctl list-units 时，会输出给管理员看的简易说明！当然，使用 systemctl status 输出的此服务的说明，也是这个项目！

Documentation

这个项目在提供管理员能够进行进一步的文件查询的功能！提供的文件可以是如下的资料：

 Documentation=http://www….

 Documentation=man:sshd(8)

 Documentation=file:/etc/ssh/sshd_config

After

说明此 unit 是在哪个 daemon 启动之后才启动的意思！基本上仅是说明服务启动的顺序而已，并没有强制要求里头的服务一定要启动后此 unit 才能启动。 以 sshd.service 的内容为例，该文件提到 After 后面有 network.target 以及 sshd-keygen.service，但是若这两个 unit 没有启动而强制启动 sshd.service 的话， 那么 sshd.service 应该还是能够启动的！这与 Requires 的设定是有差异的喔！

Before

与 After 的意义相反，是在什么服务启动前最好启动这个服务的意思。不过这仅是规范服务启动的顺序，并非强制要求的意思。

Requires

明确的定义此 unit 需要在哪个 daemon 启动后才能够启动！就是设定相依服务啦！如果在此项设定的前导服务没有启动，那么此 unit 就不会被启动！

Wants

与 Requires 刚好相反，规范的是这个 unit 之后最好还要启动什么服务比较好！不过，并没有明确的规范就是了！主要的目的是希望建立让使用者比较好操作的环境。 因此，这个 Wants后面接的服务如果没有启动，其实不会影响到这个 unit 本身！

Conflicts

代表冲突的服务！亦即这个项目后面接的服务如果有启动，那么我们这个 unit 本身就不能启动！我们 unit 有启动，则此项目后的服务就不能启动！ 反正就是冲突性的检查！

[Service] 部份

设定参数

参数意义说明

Type

说明这个 daemon 启动的方式，会影响到 ExecStart 喔！一般来说，有底下几种类型：

 simple：默认值，这个 daemon 主要由 ExecStart 接的指令串来启动，启动后常驻于内存中。

 forking：由 ExecStart 启动的程序透过 spawns 延伸出其他子程序来作为此 daemon 的主要服务。原生的父程序在启动结束后就会终止运作。 传统的 unit 服务大多属于这种项目，例如 httpd 这个 WWW 服务，当 httpd 的程序因为运作过久因此即将终结了，则 systemd 会再重新生出另一个子程序持续运作后， 再将父程序删除。据说这样的效能比较好！！

 oneshot：与 simple 类似，不过这个程序在工作完毕后就结束了，不会常驻在内存中。

 dbus：与 simple 类似，但这个 daemon 必须要在取得一个 D-Bus 的名称后，才会继续运作！因此设定这个项目时，通常也要设定 BusName= 才行！

 idle：与 simple 类似，意思是，要执行这个 daemon 必须要所有的工作都顺利执行完毕后才会执行。这类的 daemon 通常是开机到最后才执行即可的服务！比较重要的项目大概是 simple, forking 与 oneshot 了！毕竟很多服务需要子程序 (forking)，而有更多的动作只需要在开机的时候执行一次(oneshot)，例如文件系统的检查与挂载啊等等的。

EnvironmentFile

可以指定启动脚本的环境配置文件！例如 sshd.service 的配置文件写入到 /etc/sysconfig/sshd 当中！你也可以使用 Environment= 后面接多个不同的 Shell 变量来给予设定！

ExecStart

就是实际执行此 daemon 的指令或脚本程序。你也可以使用 ExecStartPre (之前) 以及ExecStartPost (之后) 两个设定项目来在实际启动服务前，进行额外的指令行为。 但是你得要特别注意的是，指令串仅接受『指令 参数 参数…』的格式，不能接受 , >>, |, & 等特殊字符，很多的 bash 语法也不支持喔！ 所以，要使用这些特殊的字符时，最好直接写入到指令脚本里面去！不过，上述的语法也不是完全不能用，亦即，若要支持比较完整的 bash 语法，那你得要使用 Type=oneshot 才行喔！ 其他的 Type 才不能支持这些字符。

ExecStop

与 systemctl stop 的执行有关，关闭此服务时所进行的指令。

ExecReload

与 systemctl reload 有关的指令行为

Restart

当设定 Restart=1 时，则当此 daemon 服务终止后，会再次的启动此服务。举例来说，如果你在 tty2 使用文字界面登入，操作完毕后注销，基本上，这个时候 tty2 就已经结束服务了。 但是你会看到屏幕又立刻产生一个新的 tty2 的登入画面等待你的登入！那就是 Restart 的功能！除非使用 systemctl 强制将此服务关闭，否则这个服务会源源不绝的一直重复产生！

RemainAfterExit

当设定为 RemainAfterExit=1 时，则当这个 daemon 所属的所有程序都终止之后，此服务会再尝试启动。这对于 Type=oneshot 的服务很有帮助！

TimeoutSec

若这个服务在启动或者是关闭时，因为某些缘故导致无法顺利『正常启动或正常结束』的情况下，则我们要等多久才进入『强制结束』的状态！

KillMode

可以是 process, control-group, none 的其中一种，如果是 process 则 daemon 终止时，只会终止主要的程序 (ExecStart 接的后面那串指令)，如果是 control-group 时， 则由此 daemon 所产生的其他 control-group 的程序，也都会被关闭。如果是 none 的话，则没有程序会被关闭喔！

RestartSec

与 Restart 有点相关性，如果这个服务被关闭，然后需要重新启动时，大概要 sleep 多少时间再重新启动的意思。预设是 100ms (毫秒)。

[Install] 部份

设定参数

参数意义说明

WantedBy

这个设定后面接的大部分是 *.target unit ！意思是，这个 unit 本身是附挂在哪一个 target unit 底下的！一般来说，大多的服务性质的 unit 都是附挂在 multi-user.target 底下！

Also

当目前这个 unit 本身被 enable 时，Also 后面接的 unit 也请 enable 的意思！也就是具有相依性的服务可以写在这里呢！

Alias

进行一个连结的别名的意思！当 systemctl enable 相关的服务时，则此服务会进行连结档的建立！以 multi-user.target 为例，这个家伙是用来作为预设操作环境 default.target 的规划， 因此当你设定用成 default.target 时 ， 这 个 /etc/systemd/system/default.target 就 会 连 结 到 /usr/lib/systemd/system/multi-user.target 啰！

### 多重的重复设置方式：以getty为例

我们的CentOS中有6个终端可以使用，即tty1-tty6，这个东西是由agetty命令完成。OK，那么这个终端的功能又是哪个项目所提供的呢？其实这个东西涉及很多层面，主要管理的是getty.target这个target unit，不过，实际产生tty1-tty6的则是由getty@.service所提供。

```java
[root@study ~]# cat /usr/lib/systemd/system/getty@.service
[Unit]
Description=Getty on %I
Documentation=man:agetty(8) man:systemd-getty-generator(8)
Documentation=http://0pointer.de/blog/projects/serial-console.html
After=systemd-user-sessions.service plymouth-quit-wait.service getty-pre.target
After=rc-local.service
Before=getty.target
IgnoreOnIsolate=yes
Conflicts=rescue.service
Before=rescue.service
ConditionPathExists=/dev/tty0
[Service]
ExecStart=-/sbin/agetty -o '-p -- \\u' --noclear %I $TERM
Type=idle
Restart=always
RestartSec=0
UtmpIdentifier=%I
TTYPath=/dev/%I
TTYReset=yes
TTYVHangup=yes
TTYVTDisallocate=yes
KillMode=process
IgnoreSIGPIPE=no
SendSIGHUP=yes
UnsetEnvironment=LANG LANGUAGE LC_CTYPE LC_NUMERIC LC_TIME LC_COLLATE LC_MONETARY LC_MESSAGES LC_PAPER LC_NAME LC_ADDRESS LC_TELEPHONE LC_MEASUREMENT LC_IDENTIFICATION
[Install]
WantedBy=getty.target
DefaultInstance=tty1
```

我们去man agetty时，发现到它的语法应该是【agetty –noclear tty1】之类的字样，因此，我们如果要启动6个tty的时候，基本上应该有6个启动配置文件。亦即是可能会用到getty1.service、getty2.service…getty6.service才对。但是这样的管理非常麻烦，所以才会出现这个@的项目。我们先来看看getty.target的内容：

```java
[root@study ~]# systemctl show getty.target
Conflicts=shutdown.target
Before=shutdown.target multi-user.target
After=getty@tty2.service getty@tty1.service getty@tty4.service 
      getty@tty5.service getty@tty3.service
```

怎么会有6个怪异的service呢（我这里是5个，可能是版本问题，我们姑且当做6个）？

当我们执行完getty.target之后，它会持续要求getty@tty1.service等6个服务继续启动。那我们的systemd就会这么做：

**1、** 先看/usr/lib/systemd/system/、/etc/systemd/system/有没有getty@tty1.service的设置，若有就执行，没有则执行下一步；

**2、** 找getty@.service的设置，若有则将@后面的数据代入成%I的变量，进入getty@.service执行；

也就是说，其实getty@tty1.service实际上是不存在的，它主要是通过getty@.service执行。也就是说，getty@.service的目的是为了要简化多个执行的启动设置，它的命名方式是这样的：

```java
原始文件：执行服务名称@.service
执行文件：执行服务名称@范例名称.service
```

因此当有范例名称代入时，则会有一个新的服务名称产生。你再回头看看那getty@.service的启动脚本：

```java
ExecStart=-/sbin/agetty -o '-p -- \\u' --noclear %I $TERM
```

上表中那个%I就是范例名称。因此getty@tty1.service执行脚本就会变成/sbin/agetty –noclear tty1。所以我们才有办法以一个配置文件来启动多个tty1给用户登录。

#### 示例：将tty数量减少到4个

tty的数量主要是和systemd的登录配置文件 /etc/systemd/logind.conf里面规范的。假如你想要将tty数量下降到剩下4个的话，那么可以这样：

```java
[luoluo@study ~]$ vim /etc/systemd/logind.conf
[Login]
NAutoVTs=4
#ReserveVT=6
```

取消注释并改为4即可，然后我们

```java
systemctl  stop  getty@tty5.service
systemctl  stop  getty@tty6.service
systemctl  restart  systemd-logind.service
```

然后当你回到桌面环境下，通过Ctrl+Alt+f1~f6，就会发现只有4个可用的tty，后面的已经被废弃。

### 示例：系统备份服务

我们来自己做一个系统备份的服务。

```java
[root@study ~]# mkdir /backups
[root@study ~]# cd /backups/
[root@study backups]# vim backup.sh
#!/bin/bash
source="/etc /home /root /var/lib /var/spool/{cron,at,mail}"
target="/backups/backup-system-$(date +%Y-%m-%d).tar.gz"
[ ! -d /backups ] && mkdir /backups
tar -zcvf ${target} ${source} $> /backups/backup.log                                                   
```

```java
[root@study backups]# chmod a+x /backups/backup.sh 
[root@study backups]# ll backup.sh 
-rwxr-xr-x. 1 root root 271 8月  15 21:30 backup.sh
```

要有可执行权限。

接下来，我们要如何设计一个名为backup.service的启动脚本设置？可以如下这样做。

```java
[root@study backups]# vim /etc/systemd/system/backup.service
[Unit]
Description=backup my server
Requires=atd.service
[Service]
Type=simple
ExecStart=/bin/bash -c "echo /backups/backup.sh | at now"
[Install]
WantedBy=multi-user.target
[root@study backups]# systemctl daemon-reload
[root@study backups]# systemctl start backup.service
[root@study backups]# systemctl status backup.service
● backup.service - backup my server
   Loaded: loaded (/etc/systemd/system/backup.service; disabled; vendor preset:>
   Active: inactive (dead)
8月 15 22:16:24 study.cool systemd[1]: Started backup my server.
8月 15 22:16:24 study.cool bash[3760]: warning: commands will be executed using>
8月 15 22:16:24 study.cool bash[3760]: job 8 at Sat Aug 15 22:16:00 2020
 ESCOC
//为什么Active是inactive？这是因为我们的服务仅是一个简单的脚本，因此执行完毕了，不会继续常驻在内存之中
```

完成上述的操作以后，以后你都可以使用systemctl start backup.service进行系统的备份。
