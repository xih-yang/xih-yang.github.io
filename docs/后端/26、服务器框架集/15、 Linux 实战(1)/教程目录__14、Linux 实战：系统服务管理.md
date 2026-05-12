# 14、Linux 实战：系统服务管理
- 来源：https://ddkk.com/zhuanlan/server/linux/2/14.html
- 分类：服务器框架
- 分组：教程目录
## 系统服务

**服务（daemon）**：常驻在内存中，且负责提供系统/网络功能的进程

1）自有服务：系统内置的服务（不需要用户独立安装的软件服务）

2）自Centos7.x以后，系统服务管理方式由传统System V变成Systemd

## System V

1）所有服务的配置脚本文件都存放与/etc/init.d目录下

//该目录下的文件为可执行文件，可通过这些文件控制服务

指令格式：/etc/init.d/文件名 选项

选项
含义

start
启动

stop
停止

restart
重启

statu
查看状态

如：查看网卡相关服务的状态，并停止该服务

service命令：控制服务的启动/停止/重启和查看状态

指令格式：service 服务名 选项

1）其选项可为start（启动）、stop（停止）、restart（重启）、status（状态）

如：启动Linux下安装的Apache（网站服务器软件），服务名为httpd

可通过ps命令验证服务是否启动：

2）服务分类：根据服务启动方式将服务分为两大类

**独立启动模式（Stand alone）**：独立启动的服务，该类服务常驻与内存中

//提供本机/用户的服务操作，响应速度快

**超级守护进程（Super daemon）**：由xinetd和inetd两个总管程序提供的socket对应或端口对应进行管理

//当用户不需要对应的socket/端口时，服务就不会启动，当用户需要使用时，xinetd才去唤醒对应的服务（使用结束时，服务也会结束）相较于独立启动能够控制服务的时程和连接需求等，但响应速度慢

3）服务依赖：服务之间可能存在依赖性，就会导致部分服务不能启动

//如A服务依赖于B服务，现启动A服务（但B服务处于停止状态），则A服务就无法启动（若需其启动，必须先启动B服务）

//也是System V中服务依序执行启动的本质

4）运行级别：Linux在初始化后不同的运行模式有着不同的自有服务

//Linux中存在由内核调用的“init”（initialize，初始化）进程，且PID是1

如：查看系统有关init的进程

该进程对应的配置文件（系统运行级别配置文件为：/etc/inittab

运行级别
含义

0
关机模式 （不能将默认模式设为该值）

1
单用户模式

2
多用户模式，但不带NFS（Network File Syetem） （本质效果同级别3，除不带有网络服务）

3
多用户模式，完整的多用户模式 （纯命令行模式，无图形界面）

4
没有被使用的模式 （被系统预留模式）

5
X11 （完整的图形化界面模式）

6
重启模式 （不能将默认模式设为该值）

init命令：切换系统的运行模式（临时）

指令格式：init 运行级别

1）本质是调用init进程：将数字（运行级别）传递给进程，进程再进行操作

2）init命令需要超级管理员的权限，普通用户无法执行

3）init服务会主动分析/etc/rc.d目录下两个切换模式的文件，再在转换模式中启动相关运行级别所需的服务

设置永久命令行模式：进入/etc/inittab中将id的修改为对于的模式，再进行重启

1）仅适用于Centos7.x以下

如：将系统的运行级别永久改成3

/etc/rc.d目录：存放各个运行级别的启动脚本

如：查看运行级别5中的启动脚本

//启动脚本都链接到/etc/init.d目录下的具体服务

文档路径
含义

/etc/rc.d/init.d
存储所有服务在各个运行级别的启动脚本

/etc/rc.d/rc0.d~/etc/rc.d/rc6.d
存储对应运行级别的init脚本的链接文件 文件命名格式为：字母 数字 服务名 字母为：S（start）、K（kill）和D（disable）

/etc/rc.d/rc.local
shell脚本 root可自定义系统启动后运行的额外程序/脚本

**1、** 当系统进入一个运行级别时，按照该运行级别下的文件名格式实现顺序启动；

运行所有S开头的脚本文件，并传入start参数（开机自启的服务）

运行所有K开头的脚本文件，并传入stop参数（开机关闭的服务）

忽略所有D开头的脚本文件（禁止该脚本文件运行）

**2、** 若系统启动后需执行额外的程序/脚本，可将该程序/脚本的绝对路径写入到/etc/rc.d/rc.local；

5）开机自启：通过chkconfig命令设置指定运行级别下的服务开机自动启动

chkconfig命令：控制Linux开机自动启动的相关信息

指令格式1：chkconfig --list

1）功能：查看所有开机自动启动的服务

2）Linux中并不是所有的软件在安装后都开机自动启动，个别需要手动添加

如：查看系统开机时，所有服务的自启动信息

//0~6代表了在不同运行级别下该服务是否开机自动启动

指令格式2：chkconfig --del 服务名

1）功能：把某一服务从开机服务中的删除

指令格式3：chkconfig --add 服务名

1）功能：把某一服务添加到开机服务中

指令格式4：chkconfig --level 运行级别 服务名 开或关

1）功能：设置某一服务在某运行级别下开启（关闭）开机服务

2）若设置多个运行级别下都启动该服务，运行级别数字需连续

3）若服务开为：on，服务关为：off

如：设置httpd服务在3，5运行级别下开机自动启动

ntpd服务：计算机时间同步管理

1）计算机内的时间会随着时间流逝而出现误差，所以要一段时间内进行同步

2）时间同步分为：一次性同步（手动同步）、通过服务自动同步

手动同步：ntpdate 时间服务器的域名/IP地址

1）仅同步该次时间，后续时间同步仍需手动同步

服务自动同步：启动ntpd服务

1）可通过“service ntpd start”或“/etc/init.d/ntpd start”启动服务

2）启动服务后系统会自动进行时间同步（但需设置为开机服务）

如：启动ntpd服务，并设置3，5运行级别下开机自启

## Systemd

### 概念

1）并行处理服务：Systemd让所有服务同时启动，加速开机流程

//现代主机系统多为多内核架构，能够避免不依赖服务也需依序启动的场景

2）On-demand启动：Systemd只通过Systemd服务和systemctl命令管理，且Systemd服务常驻内存，可快速处理任何服务

3）检查依赖服务：Systemd可自定义服务依赖性的检查，实现自动启动依赖服务

//如A服务依赖于B服务，现启动A服务（但B服务处于停止状态）,Systemd会自动启动B服务，然后再启动A服务（减少人工操作）

4）daemon分类：systemd定义所有的服务为一个服务单位（unit），并将该unit归类到不同的服务类型（type）中

类型
含义

service
系统服务

socket
数据监听/交换socket文件服务

target
建立运行环境服务

path
检测文档类型服务

snapshot
系统快照状态服务

timer
计划任务服务

5）daemons群组：集合多个daemon组成一个target

//Systemd中无具体的运行级别配置，而是通过target设计不同的运行环境

因为执行一个target，等于执行多个daemon群组

System V 运行级别
Systemd target
说明

0
runlevel0.target （poweroff.target）
关机

1
runlevel1.target （rescue.target）
单用户模式

2
runlevel2.target （multi-user.target）
同运行级别3

3
runlevel3.target （multi-user.target）
多用户的命令行模式

4
runlevel4.target （multi-user-.target）
同运行级别3

5
runlevel5.target （graphical.target）
多用户的图形模式

6
runlevel6.target （reboot.target）
重启

emergency
Emergency.target
紧急Shell

6）兼容System V：Systemd可兼容init的启动脚本

//Systemd也可管理init启动脚本，但可能导致某些Systemd功能不工作

Systemd并不能完全替换System V，如：

（1）Systemd通过target实现的运行级别仅有1、3、5；

（2）Systemd只通过systemctl命令进行管理，而systemctl支持语法有限制，

不像/etc/init.d可通过纯脚本实现自定义参数（systemctl不可自定义参数）；

（3）若手动启动某个服务，而不是使用systemctl启动，

则Systemd服务就无法检测到服务，也不能对该服务进行管理

（4）Systemd启动过程中，用户无法通过标准输入进行交互

//所以自行编写的Systemd启动设置时，必须取消交互机制,也许取消启动时需要的标准输入（避免各种启动失败/报错）

7）Systemd配置文件：存放与三个目录下

/usr/lib/systemd/system目录：存放每个服务默认的启动脚本配置文件

//类似/etc/init.d目录下的文件，尽量不要修改该处数据

/run/systemd/system目录：系统运行过程中产生的服务脚本

/etc/systemd/system目录：root根据系统需求所建立的执行脚本

//类似/etc/rc.d目录下的文件，修改数据尽量在此处

执行优先级：/etc/systemd/system **>** /run/systemd/system **>**

/usr/lib/systemd/system

8）Systemd后缀名：不同文件后缀名代表不同服务类型

后缀名
服务类型

.service
一般服务类型（service unit）：主要是系统服务 包括本地服务和网络服务等（最常见服务）

.socket
内部程序数据交换的socket服务（socket unit）：IPC 使用socket类型服务较少，所以都是开机延迟启动

.target
执行环境类型（target unit）：一群unit集合 执行target服务本质就是执行一堆service和socket服务

.mount .automount
文件系统挂载相关服务（mount/automount unit）：网络的自动挂载、NFS文件系统挂载和文件系统相关的进程管理

.path
检测特定文档类型（path unit）：某些服务需要检测特定文档类型来提供队列服务（如：打印服务）

.timer
循环执行服务（timer unit）：类似anacrontab 不过是Systemd主动提供，更富有弹性化

### systemctl

**systemctl命令**：Systemd中唯一管理服务的命令

指令格式1：systemctl 选项 服务名 //管理服务状态

选项
含义

start
启动服务

stop
关闭服务

restart
重启服务

reload
重新加载服务配置文件（服务继续运行）

enable
开启开机自启

disable
关闭开机自启

status
服务状态

is-active
检测服务当前是否在运行

is-enabled
检测服务是否开机自启

如：查看crond服务是否启动，并重启该服务后查询服务状态

日志内容构成：时间 运行主机 具体服务 日志信息

运行状态
含义

active(running)
有一个或多个进程正在执行

active(exited)
仅执行一次就正常结束（当前无进程执行）

active(waiting)
运行中需等待其他服务/进程触发

faild
服务启动失败

inactive(dead)
服务已关闭

自启状态
含义

enabled
开启开机自启

disabled
关闭开机自启

static
关闭开机自启，但可被其他服务唤醒（依赖性服务）

mask
关闭开机自启，且不能被任何服务唤醒

指令格式2：systemctl 选项 服务名 //管理服务注销

选项
含义

mask
强制注销服务

unmask
取消强制注销

//mask本质：使启动服务的脚本连结到空装置（/dev/null）

如：关闭cups.service服务，使用打印机输出“test”

1）关闭cups.service服务；

2）查看cups相关服务状态；

3）打印“test”，并查看cups.service服务的状态

如：强制注销cups.service服务

//强制注销后的服务，不能通过任何形式启动

指令格式3：systemctl 选项 //查看系统服务

选项
含义

list-units
列出所有已启动的服务和相关信息

list-unit-file
列出所有已安装的服务和自启状态 （根据/usr/lib/systemd/system下的文件）

--type=服务类型
列出指定服务类型的服务

1）若只运行“systemctl”命令，则列出系统上已启动的服务

2）“list-units --all”可同时列出已启动和没启动的服务

如：列出系统所有已启动的服务和相关信息

内容
含义

UNIT
服务名称

LOAD
自启状态

ACTIVE SUB
当前状态

DESCRIPTION
详细描述

如：列出系统所有已安装的服务和自启状态

如：列出系统所有安装的target类型服务

//Systemd通过target实现不同运行环境

类型
含义

multi-user.target
命令行界面

graphical.target
命令行界面和图形界面 （包含multi-user.target）

rescue.target
救援模式 当系统无法使用root登录情况下，可运行该环境 使用root密码登录该运行环境 可获得root权限对系统维护 （运行环境为临时系统，与原系统无关）

emergency.target
紧急模式 （救援模式升级版）

shutdown.target
关机模式

getty.target
tty管理

指令格式4：systemctl 选项 target类型 //管理target服务

选项
含义

get-default
列出系统默认target类型

set-default
指定系统默认target类型

isolate
切换到指定target类型

1）isolate可在不重启前提下，实现不同运行环境的切换

//systemctl isolate graphical.target等效于init 5

如：查看系统默认target类型，并设置为multi-user.target类型

指令格式5：systemctl 选项 //切换系统运行模式

选项
含义

poweroff
关机模式

reboot
重启模式

suspend
挂起模式 将系统状态和数据保存到内存中，关闭系统大部分硬件

hibernate
休眠模式 将系统状态和数据保存到硬盘中，关闭系统所有硬件

rescue
救援模式

emergency
紧急模式

指令格式6：systemctl list-dependencies 服务名 //查看依赖的服务

1）不加服务名，默认列出系统默认target类型的依赖关系

如：查看默认target类型的依赖关系

//graphical.target就是在multi-user.target上再加上account-daemon.service、gdm.service、network.service、rtkit-daemon.service、systemd-readahead-collect.service、systemd-readahead-replay.service和systemd-update-utmp-runlevel.service服务

指令格式7：systemctl list-dependencies 服务名 --reverse //查看被依赖的服务

如：查看依赖crond服务的服务

指令格式8：systemctl list-sockets //查看服务的socket文件存放位

如：列出所有服务的socket文件存放位

### Systemd配置

**端口号（port number）**：实现同一IP的不同服务请求

如：用户访问同一个IP地址，显示结果却不同

/etc/services文件：服务与端口的映射文件

内容格式：服务名称 服务端口号/数据封包协议 服务说明

//虽然可通过修改/etc/service文件实现服务端口号的更改，但不建议如此做，因为可能导致部分协议出现无法预知的错误

**网络服务**：产生一个网络监听端口的进程

//建议关闭所有的非必要网络服务（提高系统安全性）

如：列出当前系统中所有正在使用的网络端口

//系统已打开53、22、25、59968、67和5353端口

如：关闭avahi-daemon服务（同时关闭59968和5353端口）

目录
含义

/usr/lib/systemd/system
服务默认启动脚本的配置文件

/run/systemd/systemd
系统运行过程中产生的服务脚本

/etc/systemd/system
root根据系统需求所建立的执行脚本

/etc/sysconfig
服务的初始化设置

/var/lib
服务产生的数据

/run
服务产生的缓存 （也含有lock文件和PID文件等）

如：vsftpd.service服务相关配置文件

1）/usr/lib/systemd/systemd/vsftpd.service：官方默认配置文件

2）/etc/systemd/system/vsftpd.service.d/custom.conf：服务配置文件

//在/etc/systemd/system目录下建立与默认配置文件同名，后缀名为“.d”的目录；再在该目录下建立服务配置文件（配置文件的后缀名为“.conf”），该设置会累加到默认配置文件（不同配置时，以该配置为准）

3）/etc/systemd/system/vsftpd.service.requires：指定该服务启动需要的依赖服务

//该目录下的文件为链接文件（依赖服务的链接）

4）/etc/systemd/system/vsftpd.service.wants：指定该服务启动时建议的服务

//该目录下的文件为链接文件（建议服务的链接）

可通过修改/usr/lib/systemd/system目录下服务的配置文件达到服务自定义效果

//不建议修改默认配置文件（虽然可减少很多相关配置文件的读取）

如：查看sshd.service服务的默认配置文件

//项目设置是可重复的，但后面的设置会覆盖前面的设置

//空白行、开头为“#”或“；”的行都为注释行

设置项目
含义

Unit

Description
服务的简易说明

Documentation
查看具体说明方式

After
说明该服务在指定服务启动后才启动 仅说明服务服务启动顺序，并不强制要求

Before
说明该服务在指定服务启动前需启动 仅说明服务服务启动顺序，并不强制要求

Wants
说明该启动服务前建议最好启动指定服务 目的是建立较好的运行环境

Requires
说明该服务的依赖服务

Conflicts
说明服务冲突性检查 指定服务与该服务不能同时启动

Service

Type
指定服务的启动方式（影响ExecStart） simple：服务由ExecStart启动，启动后常驻内存 （默认配置）； oneshot：类似simple，但该服务在进程工作完毕后就立刻关闭（不会常驻内存）； dbus：类似simple，但该服务必须获取一个D-Bus名称后，才会运行（通过设置BusName实现） idle：类似simple，该服务必须在系统其他工作都正常执行完后才会执行（通常为开机最后执行的服务） forking：服务由ExecStart启动，通过spawns扩展出其子进程作为该服务，且原生的父进程在启动结束和子进程运行后就关闭；

EnvironmentFile
指定服务启动时的环境配置文件

ExecStart
指定该服务实际所执行的命令/脚本 不支持大部分Bash语法和输出、输入重定向等符号

ExecStop
指定关闭该服务时所执行的命令/脚本 （与systemctl stop的执行有关）

ExecReload
指定重读该服务的配置文件时所执行的命令/脚本 （与systemctl reload的执行有关）

Restart
指定是否循环执行该服务 Restart=1时，服务被关闭后，会再次启动该服务 Restart=0时，服务被关闭后，服务不会再次启动

RemainAfterExit
指定 RemainAfterExit=1时，当属于该服务的所有进程都关闭后，再启动该服务； RemainAfterExit=0时，不论属于该服务的所有进程是否关闭，都可启动该服务；

TimeoutSec
指定服务在错误状态多长时间后强制结束

KillMode
指定服务被关闭后，关闭该服务下的那些服务 process：只关闭主要进程（ExecStart指定的命令）； control-group：关闭服务产生的control-group进程； none：没有进程会被关闭；

RestartSec
指定服务重启时需等多长时间再启动

Install

WantedBy
指定服务依附于的target类型 大部分服务都依附于multi-user.target

Also
指定依赖服务 使该服务被设置为开机自启时 其依赖服务也会被设置为开机自启

Alias
指定该服务的别名

### Systemd功能

**自定义服务**：通过Shell脚本和服务配置文件实现个性化服务

如：建立可备份系统的backup.service服务

1）编写Shell脚本“backup.sh”，并配置权限

2）编写服务配置文件

//若备份系统，只需“systemctl start backup.service”启动该服务即可

**timers.target**：Systemd的辅助服务以实现服务的计划任务（具有以下优势）

1）Systemd上的所有服务产生的信息都会被记录；

2）各项的timer的任务可以跟Systemd的服务相结合；

3）各项timer的任务可以跟control group结合用于限制任务的资源利用；

//control group（cgroup）：用来替换/etc/secure/limit.conf的功能

4）timer的任务可用限制到秒甚至是毫秒

//但timer的任务没有email通知功能，也不能一段时间内随机选取

本质：配置/etc/systemd/systemd/服务名.timer文件

如：使backup.service服务在开机后两小时内执行一次；从第一次执行后，每隔两天执行一次

设置项目
含义

Timer

OnBootSec
当开机后多久执行该服务

OnStartupSec
当Systemd第一次启动后多久执行该服务

OnActiveSec
当timer.target启动后多久执行该服务

OnUnitActiveSec
距该服务最后一次启动多久执行一次

OnUnitInActiveSec
距该服务最后一次停止多久执行一次

OnCalendar
指定具体执行时间

Unit
指定执行服务 默认是同名的后缀为.service

Persistent
指定服务是否持续进行

//具体执行时间是与UNIX标准时间（1970-01-01 00：00：00）作比较

时间格式1：英文周名 YYYY - MM - DD HH：MM：SS

如：2021年5月15日 星期六：Sat 2021-05-15 12：30：00

时间格式2：N时间单位

单位
含义

us、usec
微秒

ms、msec
毫秒

s、sec、second、seconds
秒

m、min、minute、minutes
分钟

h、hr、hour、hours
小时

d、day、days
天

w、week、weeks
周

month、months
月

y、year、years
年

如：隔3小时：3h

隔300分钟又10秒：10s 300m

隔5天又100分钟：100m 5d

//多个单位同时使用时，小单写前面，大单位写后面

时间格式3：英文单词

单词
含义

now
当前时间

today
当天零点

tomorrow
明天零点

hourly
每隔一小时

daily
每隔一天

weekly
每隔一星期

monthly
每隔一个月

如：查看backup.service下次执行的时间

//上次执行backup.service服务的时间是2021-05-15 17：15，由于设置每隔两天

执行一次，所以下次执行时间是2021-05-17 17：15；

但timer由timer.target所管理，且其启动时间是2021-05-15 15：29

所以下次执行是“2021-05-17 17：15 - 2021-05-15 15：29”为2d 45min

服务名
功能

Centos7默认启动服务

abrtd
提供日志文件以便解决应用软件的错误

accounts-daemon
以accountsservice计划提供D-Bus界面管理用户

alsa-X
管理系统音效

atd
管理单一计划任务

Auditd
使SELinux的审核信息写入/var/log/audit/audit.log中

avahi-daemon
通过Zeroconf自动地分析和管理网络（客户端服务）

brandbot-rhel
检测系统启动过程中的环境脚本和提供网络启动/关闭

ntpd ntpdate chrondyd
校正系统时间

cpupower
提供CPU的运行数据

crond
管理循环计划任务

cups
管理打印

dbus
以D-Bus方式管理不同应用程序之间的通信

dm-event multipathd
监控设备映射（device mapper）

dmraid-activation mdmonitor
启动Software RAID服务

dracut-shutdown
处理initramfs的相关操作

ebtables
以类似防火墙规则的设置方式，设计网卡作为桥接时的封包分析策略

emergency rescue
进入紧急模式或恢复模式

firewalld
防火墙

gdm
图形界面上的登录管理

getty@
管理本机系统命令行界面登录

hyper ksm libvirt vmtoolsd
建立虚拟机

irqbalance
自动地分配系统中断（IRQ）之类的硬件资源

iscsi
管理来自网络驱动器的挂载

kdump
当内核出错时，记录内存的数据

lvm2
管理LVM相关性较高的服务

ModemManager network NeworkManager
调制解调器和网络设置等服务

quotaon
磁盘配额

rc-local
兼容与/etc/rc.d/rc.local

rsyslog
记录系统所产生的各项信息（日志文件）

smartd
自动检测硬盘状态

sysstat
记载某些时间点下系统资源的使用情况

systemd
管理系统运行中所需的服务

plymount upower
图形界面运行相关较高的服务

Centos7默认关闭服务

dovecot
管理POP3/IMAP等收发邮件的服务

httpd
使Linux服务变为网站服务器

named
域名服务器（Domain Name System，DNS）

nfs nfs-server
使UNIX-like之间互相作为网络驱动器 （Network Filesystem）

smb nmb
使不同操作系统实现资源共享（Samba服务器）

Vsftpd
文件传输服务器（FTP服务器）

sshd
远程连接服务

rpcbind
完成RPC协议

postfix
系统邮件发送主机
