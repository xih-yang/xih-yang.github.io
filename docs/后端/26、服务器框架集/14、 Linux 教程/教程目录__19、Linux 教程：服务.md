# 19、Linux 教程：服务
- 来源：https://ddkk.com/zhuanlan/server/linux/1/19.html
- 分类：服务器框架
- 分组：教程目录
## 服务

## 服务的分类

RPM包服务和源码包安装服务的区别很多，启动和设置都不同，这种差异主要在于安装时RPM包会选择默认位置，卸载时也有专门的命令；而源码包一般安装在/usr/local/，卸载时也只需要删除文件。

独立的服务是将服务直接注册在内存中，用户访问服务，服务响应，好处是响应较快，但需要占用内存。基于xinetd服务是由一个独立服务xinetd管理的，用户访问被管理的服务需要首先访问xinetd，再访问具体服务，好处是不需要太多内存，但响应速度慢。

查看RPM包服务的自启动状态（所有的服务都会列出，它也可以用来查询系统中所有安装的RPM服务）：

如果23 4 5任意一个是启用，说明该服务会随着服务器启动而启动，但是不代表现在该服务就是运行的。

查看服务是否运行：`ps aux`，列出的服务就是运行中的。

还可以查看`netstat -tlun`查看端口使用情况，如果该服务运行会开启端口，可以根据端口情况判断服务是否启动。

服务常用各文件（启动、配置文件、数据文件、日志等）位置：

## 独立服务

独立服务的启动、关闭、重启、查看状态：

`/etc/init.d/独立服务名 start|stop|status|restart|`或

`service 独立服务名 start|stop|restart|status`（后者是redhat专有的命令，和第一个作用相同）

status代表查看服务的状态，同时查看占用的进程号。

查询所有独立服务的状态：`service --status-all`

独立服务设置自启动有三种方法：

**1、**`chkconfig--level2345[独立服务][on|off]`可以关闭或开启自启动；

**2、** 修改/etc/rc.d/rc.local文件，这个文件中的命令会在登录前执行，只要加上对应服务启动的命令，下次开机就会自动启动服务（推荐该方法，如果所有自启动设置都总结在该文件中，查看较方便，可以避免不同安装方式的相同服务启动两次），这个文件还可以写入环境变量的修改，但是优先级较低；

**3、** 执行ntsysv命令，会出现图形化界面，在想自启动的服务前加上*即可（这个方法可以同时管理独立服务和xinetd服务）；

## 基于xintd服务

想要使用基于xintd服务，必须先安装xintd，再安装基于此的服务。

启动方法，以telnet服务为例，修改文件/etc/xinetd.d/telnet，将disable=yes改为no，保存后重启xintd服务：

`service xinetd restart`，这样就能完成启动。

自启动方法有两个：

**1、**`chkconfigtelneton`；

**2、** 执行ntsysv命令；

xintd服务的启动和自启动是相通的，开启服务会自动开启自启动，开启自启动服务会自动启动。

## 源码包服务

源码包服务启动时应该使用绝对路径启动脚本`/usr/local/apache2/bin/apachectl start|stop`，不同的服务脚本名也不同，此时需要查看安装说明查看启动脚本的方法。

源码包服务的自启动也需要在/etc/rc.d/rc.local文件中加入启动命令。

如果想让service命令也能管理源码包服务，需要在service命令扫描的目录下添加一个链接文件，以apache服务为例：

`ln-s /usr/local/apache2/bin/apachectl /etc/init.d/apache`但是这样做会弄混两种服务，因此不建议。

service服务也可以被chkconfig与ntsysv命令管理自启动，此时需要修改新建的链接文件/etc/init.d/apache，在首行下加入两句话：

```java
# chkconfig: 35 86 76
# description: source package apache
```

三个数字分别是运行级别，启动顺序和关闭顺序。两个顺序数字不能和其他服务重合，查看/etc/rc.d/中有rc0.d、rc1.d。。。rc6.d文件，对应6个运行级别，应该查看rc3.d文件中的顺序，然后再进行设置。最后把源码包apache加入chkconfig命令：`chkconfig --add apache`

## 服务管理总结

## systemd管理的特点

CentOS7的新的systemd弃用了原来的init启动脚本的方法，init的管理机制有如下几个特点：

**1、** 服务启动脚本都放在/etc/init.d/下；

**2、** 服务被分成独立启动的服务和基于xinetd或inetd的服务两种；

**3、** 服务存在相依性问题，需要管理员手动解决；

**4、** 存在执行等级的分类，可以根据用户自定义的执行等级来唤醒不同的服务，直接执行`init5`就能切换；

**5、** 用chkconfig命令来管理自启动；

新的systemd管理机制的特点：

**1、** systemd可以让所有服务同时启动，系统启动的速度变快了；

**2、** 服务不再区分，统一由systemd指令来管理；

**3、** 服务相依性自动检测；

**4、** systemd定义所有的服务为一个服务单位（unit），并将该unit归类到不同的服务类型（type）中，systemd将服务unit区分为多种type，包括service、socket、target等；

**5、** systemd可以兼容旧的init脚本；

**6、** systemd也有一个类似于runlevel的设计，systemd将许多功能集合整合成一个target项目，通过执行该target来执行好多个服务；

新的systemd也有一些弊端：

**1、** runlevel并没有做到完全对应；

**2、** 新的systemd全部用systemctl这个管理程序管理，systemctl不可自定义参数；

**3、** 没有用systemctl启动的服务，systemd无法监测到；

**4、** systemd启动过程中无法与管理员进行交互，自行编写启动设定时应该取消互动机制；

## systemd相关目录和unit类型

systemd将服务执行脚本称为一个服务单位unit，每种服务根据功能来划分成多种type，相关的配置文件主要放在：

**1、** /usr/lib/systemd/system/：每个服务最主要的启动脚本设定；

**2、** /run/systemd/system/：系统执行过程中产生的服务脚本，优先序比上一个目录高；

**3、** /etc/systemd/system/：管理员根据主机需求所建立的执行脚本，执行优先序比上一个高；

**4、** /etc/sysconfig/*：服务初始化的一些设置会放在该目录；

**5、** /var/lib/：一些产生数据的服务会将数据写入该目录中，如数据库文件；

**6、** /run/：服务暂存档的位置；

**7、** /usr/share/doc/：相关服务信息、软件配置和说明；

系统开机到底会不会执行某些服务要看/etc/systemd/system/底下的设定，该目录下是一大堆连结档，实际执行的脚本都是放在/usr/lib/systemd/system/中。

unit类型可以通过看/usr/lib/systemd/system/下文件的扩展名来分辨：

socket服务会产生一些socket file，查找所有的socket file：`systemctl list-sockets`

## systemd管理服务和查看服务

查看服务状态：`systemctl status atd.service`。

结果的第二行会显示服务的预设状态，enable为开始自动执行，disabled为开机时不会被执行，static为该服务不可以自启动，需要其他服务唤醒，mask为该服务已经被强制注销。

结果的第三行会显示服务目前的状态，active（running）为该服务的一只或多只程序正在运行，active（exited）为仅执行一次就正常结束的服务，如开机、挂载或自定义脚本，active（waiting）为正在执行中，但是需要等待其他事件，inactive为服务没有运作。

正常关闭服务：`systemctl stop atd.service`

开启服务：`systemctl start 服务`

设置开机启动/开机不启动：`systemctl enable/disable 服务`

注销服务/恢复正常：`systemctl mask/unmask 服务`

列出系统上所有启动的unit：`systemctl`

列出所有已经安装的unit：`systemctl list-unit-files`

只列出service这种类别的服务：`systemctl list-units --type=service --all`

## 不同的操作环境target unit

主要的操作环境相关的target unit主要有以下几个：

**1、** multi-user.target：纯文本模式；

**2、** graphical.target：文字加图形界面；

**3、** 救援模式rescue.target和emergency.target；

查看默认的模式：`systemctl get-default`

设置默认的模式：`systemctl set-default multi-user.target`

在不重新启动的情况下，将目前的操作环境改为纯文本模式：`systemctl isolate multi-user.target`

systemd提供了一些简单的切换命令：

暂停模式和休眠模式的区别：暂停模式是将系统的数据保存在内存，然后不关机，唤醒后重新加载；休眠模式是将系统的数据保存在硬盘中，然后关机，重新启动后把数据从硬盘中读出。

## 各服务的依赖性检查

列出所有的服务依赖性：`systemctl list-dependencies`，一行稍靠前的部分是服务A，靠后是服务B，列出的信息表示服务A用到了一系列服务B，这类关系还可以反向查看，也就是哪些服务用到我：`systemctl list-dependencies --reverse`

查看单一服务的依赖性，如查看graphical.target用到了哪些服务：

`systemctl list-dependencies graphical.target`
