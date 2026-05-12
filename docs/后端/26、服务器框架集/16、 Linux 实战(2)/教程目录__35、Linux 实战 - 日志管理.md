# 35、Linux 实战 - 日志管理
- 来源：https://ddkk.com/zhuanlan/server/linux/5/35.html
- 分类：服务器框架
- 分组：教程目录
## 日志管理

现在centos中使用的是rsyslogd日志管理服务，是之前syslogd的升级版。

Linux中的日志文件一般保存在/var/log目录下。

```java
[root@ddkk.com log]# ls
anaconda           cron-20220206        kdump.log          private               vmware-network.2.log
audit              cron-20220221        lastlog            secure                vmware-network.3.log
boot.log           cron-20220227        mail               secure-20220206       vmware-network.4.log
boot.log-20220204  cron-20220306        maillog            secure-20220221       vmware-network.5.log
boot.log-20220206  dnf.librepo.log      maillog-20220206   secure-20220227       vmware-network.6.log
boot.log-20220221  dnf.log              maillog-20220221   secure-20220306       vmware-network.7.log
boot.log-20220307  dnf.rpm.log          maillog-20220227   spooler               vmware-network.8.log
boot.log-20220308  firewalld            maillog-20220306   spooler-20220206      vmware-network.9.log
boot.log-20220309  hawkey.log           messages           spooler-20220221      vmware-network.log
boot.log-20220311  hawkey.log-20220206  messages-20220206  spooler-20220227      vmware-vgauthsvc.log.0
btmp               hawkey.log-20220221  messages-20220221  spooler-20220306      vmware-vmsvc-root.log
btmp-20220304      hawkey.log-20220227  messages-20220227  sssd                  vmware-vmtoolsd-root.log
chrony             hawkey.log-20220306  messages-20220306  tuned                 wtmp
cron               httpd                pcp                vmware-network.1.lo
```

### 系统中常见的日志文件

日志文件
说明

/var/log/cron
记录了系统定时任务相关的日志。

/var/logs/dmesg
记录了系统在开机时内核自检的信息，也可以使用dmesg命令直接查看内核自检信息。

/var/log/btmp
记录错误登录的日志，这个文件是二进制文件，需要用lastb命令查看。

/var/log/lastlog
记录所有用户最后一次登录时间的日志，需要用lastlog明令查看。

/var/log/mailog
记录邮件信息。

/var/log/message
记录系统中重要信息的日志，如果系统出了问题，首先要检查的就应该是这个日志。

/var/log/wtmp
永久记录所有用户的登录，需要用last命令来查看。

/var/log/secure
记录验证和授权方面的信息，只要设计账户和密码的程序都会记录。

rpm包安装的服务记录的日志才会/var/log目录下，源码包安装服务的日志则是在源码包指定目录中。

### 日志文件格式

只要是由日志服务rsyslogd记录的日志文件，格式都是一样的，基本日志格式有以下四列：

- 事件产生的事件
- 发生事件的服务器的主机名
- 产生事件的服务名或程序名
- 事件的具体信息

### rsyslogd服务的配置文件

**/etc/rsyslog.conf配置文件格式** ：

```java
[root@ddkk.com log]# vim /etc/rsyslog.conf
...
mail.*                                                  -/var/log/maillog
#mail服务名 .连接符 *日志登记             -是指先存在内存中，存满后存在磁盘里  /var/log/maillog存放位置
*.emerg                                                 :omusrmsg:*
#如果情况比emerg严重的，通知给所有用户
...
```

**日志服务连接符号**：

- “.”：代表只要比后面等级高，就记录。
- “.=”：代表只记录所需等级的日志。
- “.!”：除了该等级的日志，都记录。

**日志等级**

等级名称
说明

debug
一般的调试说明信息

info
基本的通知信息

notice
普通信息，但有一定的重要性

warning
警告信息，但是还不会影响到服务或系统的运行

err
错误信息，一般达到err等级的信息以及可以影响到服务或系统的运行

crit
临界状况信息，比err严重

alert
警告状态信息，比crit严重，必须立即采取行动

emerg
疼痛等级信息，系统已经无法使用了

*
所有日志等级

**/etc/rsyslog.d/**

```java
# Include all config files in /etc/rsyslog.d/
 include(file="/etc/rsyslog.d/*.conf" mode="optional")
```

这一行的意思是所有/etc/syslog.d/*.conf的文件都会被包括进来，所以要想给指定的服务添加日志管理，可以写入/etc/rsyslog.conf,也可以在/etc/rsyslog.d/文件中添加日志管理文件。

## 日志轮替

在工作中，我们需要保存一定时间范围内的日志文件，以分析和预防系统中可能出现的问题，这个时候，logrotate服务就很重要了，它是Linux提供的日志轮替服务。

日志轮替的功能就是把旧的日志文件改名，同时建立新的日志文件，把超过保存范围时间的日志文件给删除。如果配置文件中有"dateext"参数，那么logrotate将会用日期来作为旧日志的后缀。

### logrotate配置文件

```java
[root@ddkk.com log]# vim /etc/logrotate.conf
# see "man logrotate" for details
# rotate log files weekly
weekly
#轮替时间，一周轮替一次
# keep 4 weeks worth of backlogs
rotate 4 
#会保存4个旧文件
# create new (empty) log files after rotating old ones
create
# use date as a suffix of the rotated file
dateext
#旧日志会用日期作为后缀
# uncomment this if you want your log files compressed
#compress
#轮替日志是否要压缩，默认是关闭的
# RPM packages drop log rotation information into this directory
include /etc/logrotate.d
#/etc/logrotate.d中的文件被包括进来，也是logrotate的配置文件
# system-specific logs may be also be configured here.
```

英文是官方注释，中文是解释了一下。

### 配置文件夹 /etc/logrotate.d

```java
[root@ddkk.com logrotate.d]# ls
bootlog  btmp  chrony  dnf  firewalld  httpd  kvm_stat  sssd  syslog  wtmp
[root@ddkk.com logrotate.d]# vim /etc/logrotate.d/httpd 
/var/log/httpd/*log {
    missingok
    notifempty
    sharedscripts
    delaycompress
    postrotate
        /bin/systemctl reload httpd.service > /dev/null 2>/dev/null || true
    endscript
}
```

**logrotate配置文件的参数解释**：

参数
解释

daily
每天轮替

weekly
每周轮替

mouthly
每月轮替

rotate 数字
保留的日志个数

create mode owner group
新建日志，并规定日志文件的权限、所有者、所属组，如create 0600 root utmp

mail address
当日志轮替是，输出内容通过邮件地址发送到指定的邮件地址

missingok
当日止文件不存在时，忽略该日志文件的警告信息。

notifempty
如果日志为空文件，则不进行日志轮替

minsize
日志轮替的最小值，也就是日志一定要达到这个最小值才会轮替，否则就断时间达到也不轮替

size
日志只有达到指定大小才轮替，不按照时间轮替

dateext
使用日期作为轮替文件后缀

sharedscripts
该关键字后的脚本只执行一次

prerotate/endscript
在日志轮替之前执行脚本命令

postrotate/endscript
在日志轮替之后执行脚本命令

**注**：

被轮替日志的服务和rsyslogd需要在轮替后重启一次，否则无法正常运行。

### 把自己日志加入轮替

- 直接写在/etc/logrotate.conf配置文件中。
- 直接在/etc/logrotate.d/目录中加入配置文件。

模板：

```java
/date/logs/nginx/access/access.log /date/logs/nginx/access/default.log{
	daily
	rotate 15
	sharedscripts
	postrotate
	/bin/kill -HUP $(/bin/cat /var/run/syslog.pid) &>/dev/null
	#重启rsyslogd服务，平滑重启
	/bin/kill -HUP $(/bin/cat /usr/local/nginx/logs/nginx.pid) &>/dev/null
	#重启Nginx服务
	endscript
}
```
