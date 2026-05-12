# 21、Linux 实战：日志文件
- 来源：https://ddkk.com/zhuanlan/server/linux/2/21.html
- 分类：服务器框架
- 分组：教程目录
## 日志文件

## 日志基础

**日志**：记录系统中硬件、软件和系统问题的信息

1）日志包括系统日志、应用程序日志和安全日志

2）日志文件的权限的设置通常是仅root可读取

3）日志文件便于系统管理员查找系统服务问题、网络服务问题和应用程序问题

Linux中常见日志文件：

日志文件名
含义

/var/log/boot.log
记录开机时系统内核和硬件启动流程信息 （仅存储本次开机启动的）

/var/log/cron
记录循环计划任务相关信息 （如：该任务是否被执行和执行是否出错等）

/var/log/dmesg
记录开机时系统内核检测过程中的各项信息 （Centos默认开机时不显示内核检测过程）

/var/log/lastlog
记录系统上所有用户最近一次登录系统的相关信息 （lastlog命令本质就是读取该文件的数据）

/var/log/maillog
记录邮件的相关信息（主要记录postfix和dovecot） （/var/log/mail目录具有相同作用）

/var/log/messages
记录系统中几乎所有发生报错的信息

/var/log/secure
记录所有使用用户名和密码验证登录的信息 不论是否登录成功都记录下（login、su和ssh等）

/var/log/wtmp
记录正确登录系统的用户信息 last命令本质就说读取该文件的数据

/var/log/faillog
记录拒绝登录系统的用户信息

/var/log/httpd /var/log/samba
网络服务也有同名目录存储其日志文件记录各项信息 如：/var/log/httpd、/var/log/samba和/var/log/dhcp

Linux主要通过3个服务/程序管理日志文件：

1）** systemd-journald.service**：记录系统信息存入内存（读写性能较好）

//由Systemd提供，系统中所有由Systemd管理的服务，其产生的各项信息都由systemd-journald.service以二进制形式记录，再转交rsyslog.service进一步记录

2）** rsyslog.service**：以文件形式记录系统服务和网络服务等各项信息

//Linux的日志文件主要是由rsyslog.service负责管理

3）** logrotate**：实现日志文件的轮循功能

日志文件内容的主要构成（不同类型日志文件存在差异）：

**事件发生的时间 事件发生的主机名 事件相关的服务/命令/函数 实际内容**

如：查看记录用户验证登录的/var/log/secure日志文件内容

//第一行：在08/17的18：38：06时，study用户登录系统，通过pam_unix模块配置其相关权限；

//第二行：在08/17的18：38：06时，root通过login程序在tty1登录。

## rsyslog.service

**rsyslog.service**：Linux主要日志文件管理服务

1）rsyslog.service配置文件：/etc/rsyslog.conf

如：查看当前系统中的rsyslog.service服务（是否开机自启）

如：查看/etc/rsyslog.conf配置文件

配置格式：服务名 连接符号 信息等级 信息存储点

1）服务名、连接符号和信息等级三者之间没有空格分隔

2）具体配置内容主要为框内内容（框外为全局配置）

3）一行即为一项配置

rsyslog.service服务通过Linux内核提供的syslog规范来设置日志数据的分类,其中syslog自带部分数据分类，如：

序号
服务类型
含义

0
kern
记录内核（kernel）产生的信息

1
user
记录用户产生的信息

2
mail
记录邮件相关的信息

3
daemon
记录系统服务产生的信息

4
auth
记录验证登录相关的信息

5
syslog
记录syslog相关协议的信息

6
lpr
记录打印相关的信息

7
news
记录新闻组服务器相关的信息

8
uucp
记录UNIX系统间程序交换数据的信息 UNIX to UNIX Copy Protocol

9
cron
记录计划任务相关的信息

10
authpriv
记录与auth类似，记录更多信息 （包括pam模块运行等）

11
ftp
记录FTP通讯协议相关的信息

12~23
local0~local7
保留给系统使用

//软件开发商可通过这些服务类型实现记录自己软件的各项信息

如：邮件相关软件在开发时，就可指定该软件的日志文件记录数据类型为mail，就会主动调用syslog内的mail服务

同一个服务所产生信息等级是不同的，Linux内核的syslog将信息分为8个等级

信息等级
等级名称
含义

7
debug
用来debug时产生的信息

6
info
基本信息说明

5
notice
正常信息

4
warning （warn）
警示信息 但不影响服务的正常运行

3
err （error）
重大错误信息 如：配置文件出错导致服务无法启动

2
crit
比err更严重的错误信息

1
alert
比crit更严重的错误信息

0
emerg （panic）
最严重的错误信息 大概率为硬件出问题（几乎宕机状态）

1）0~6之间，数值越高代表服务越稳定

//两个特殊等级：debug（错误检测等级）和none（无需登录等级）

通过三个连接符号实现对不同信息等级的记录：

连接符号
含义

.
代表比该等级数值低的都需记录 如：mail.info代表与mail相关的信息， 且信息等级低于6（包含6）都需被记录

.=
代表仅记录该等级数值

.!
代表不等于该等级数值的都需记录

**信息存储点**：日志信息则可记录至文件、设备和其他主机中（日志文件系统）

1）文件路径：通常存储在/var/log目录下的文件中；

2）设备：存储在类似/dev/lp0打印机设备中；

3）用户名：显示至指定用户的终端；

4）主机名：存放至远程主机中（对方主机需支持）；

5）*：显示至所有在线用户的终端

//信息存储点为文件时，该日志文件若被修改过（仅打开则无影响）则无法继续记录信息，可重启rsyslog.service服务使该日志文件恢复，为预防此类错误，日志文件一般设置“a”隐藏权限

如：将news和cron类所有信息写至/var/log/cronnews，同时将news和cron类警示信息写至/var/log/cronnews.warn

//手动配置文件后，需重启rsyslog.service服务/重读配置文件才可生效

如：除cron、mail和news类信息之外，将所有信息写至/var/log/messages

其他写法：*.*；corn，mail，news.none

/var/log/messages

1）使用“，”分隔时，若指定的相同信息等级，只需最后一个即可

2）使用“；”分割时，每个服务都需要指定对应的信息等级

3）“-”代表：信息先存入内存缓冲区（buffer）中，待数据量达到指标后，一次性将所有数据写入磁盘

### 日志文件服务器

**日志文件服务器**：通过rsyslog.service服务实现记录其他主机日志文件

1）Centos7默认安装rsyslog的日志文件服务器功能（默认不启动）

2）Server端和Clint端的rsyslog.service配置方式不一样

//实现日志文件不在本机保留，直接传输到日志文件服务器中

（1）Server端配置：开启服务和指定接受方式

如：修改/etc/rsyslog.conf使Server端以TCP方式接受文件

//修改后，需重启服务/重读配置文件才能生效

（2）Client端配置：指定传输地址和传输方式

1）内容格式：服务名 连接符号 信息等级 传输方式 传输地址

2）服务名、连接符号和信息等级三者之间没有空格分隔

3）传输方式和传输地址两者之间没有空格分隔

4）传输方式分为：@（UPD）和@@（TCP）

5）传输地址为Server端的IP地址

如：修改/etc/rsyslog.conf使Client端所有信息以TCP方式传输到Server端，Server端的IP为：192.168.1.100

## logrotate

**logrotate**：自动化处理日志文件的轮循功能

1）rsyslog.service是由Systemd管理的，可立即执行，而logrotate是由cron管理的，需触发条件才可执行（/etc/cron.daily/logrotate记录系统每天的轮循工作）

**轮循**：实现日志文件自动更新与备份

//一个日志文件存放过多的数据（文件容量过大）导致读写效率下降（不安全）,就需对日志文件进行更新与备份：使旧的日志文件改名，再建立与原名同名的日志文件继续存放数据；而旧的日志文件在保存一定时间后就删除

如：某类日志文件轮循效果，仅能保留4次备份数据

1）第一次轮循后，messages变成messages.1，建立空的messages存储系统数据；

2）第二次轮循后，messages.1变成messages.2，messages变成messages.1，建立空的messages存储系统数据；

3）第三次同理，会出现messages.3；

4）第四次，则会删除messages.3，再使messages.2变成messages.3；

logrotate配置文件：/etc/logrotate.conf文件和/etc/logrotate.d目录

1）前者为logrotate的全局设置（默认值），而后者实现针对性设置

2）/etc/logrotated.d目录下所有文件都会被调入/etc/logrotate中使用

3）同样设置参数中/etc/logrotate.d目录下的文件优先级高于/etc/logrotate.conf

//在/etc/logrotate.d目录下，可同服务名配置服务自定义的轮循设置

如：查看/etc/logrotate.conf

//大部分的日志文件都不需要压缩（httpd需要压缩）

如：查看/etc/logrotate.d目录和/etc/logrotate.d/syslog文件

/etc/logrotate.d目录下文件内容格式：

```java
日志文件路径1
日志文件路径2
日志文件路径3
……
{
		参数1
		参数2
		sharedscripts
			命令脚本1
			命令脚步2
			命令脚步3
			……
		endscript
		参数3
		……
}
```

1）轮循的参数必须使用“{}”括起来

2）执行外部命令需使用执行脚本：sharedscripts……endscript

//**prerotate参数**：声明在logrotate前进行的命令

//**postrotate参数**：声明在logrotate后进行的命令

如：实现自定义轮循

1）建立/var/log/admin.log日志文件，并配置+a隐藏权限；

2）在/etc/logrotate.d目录建立logrotate配置文件，并配置；

3）强制执行轮循一次（不满一个月，且不大于10M），并查看效果

logrotate命令：执行日志文件的轮循操作

指令格式：logrotate 选项 日志文件路径

选项
含义

-v
显示执行过程

-f
强制执行轮循操作

## systemd-journald.service

**systemd-journald.service**：记录系统信息存入内存（读写性能较好）

1）配置文件：/etc/systemd/journald.conf

//由于systemd-journald.service由Systemd提供和管理，且Systemd是开机执行的第一个程序，所以systemd-journald.service可记录开机启动过程中的所有信息和服务启动情况等，再传递给rsyslog.service记录到磁盘中

**journalctl命令**：查看系统日志数据

指令格式1：journalctl 选项

1）无选项，则默认显示系统所有日志数据

选项
含义

-n N
显示最后N行数据

-p 信息等级
显示指定信息等级的数据

-r
反向输出 默认输出为最旧信息到最新消息

-f
仅查看最后10行

指令格式2：journalctl 选项

选项
含义

--since 时间1 --until 时间2
显示从时间1到时间2日志数据

_SYSTEMD_UNIT=服务名
显示指定服务的日志数据

_COMM=命令
显示指定命令的日志数据

_PID=N
显示与PID为N有关的日志数据

_UID=N
显示与UID为N有关的日志数据

SYSLOG_FACILITY=服务类型
显示指定服务类型的日志数据

**logger命令**：使终端输入的数据传输到日志文件中

指令格式：logger 选项 “信息”

选项
含义

-p
指定“服务名 连接符号 信息等级”格式

-s
同时输出到终端

如：将“I will check logger comman”输出到终端和日志文件中

logwatch工具：Centos7默认的日志分析工具，每天对日志数据进行一次分析

1）并将分析结果以email格式发送给root

2）logwatch需自行安装（yum install 挂载点/Packages/perl-5.*.rpm）

3）logwatch安装完成后会属于cron管理，定期分析日志数据

//也可直接“/etc/cron.daily/0logwatch”直接分析
