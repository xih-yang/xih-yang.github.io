# 31、Linux 实战：Linux-Samba
- 来源：https://ddkk.com/zhuanlan/server/linux/2/31.html
- 分类：服务器框架
- 分组：教程目录
## Samba

**SMB协议(Server Messages Block)**：解决局域网内文件和打印机等资源共享问题

Samba程序：基于SMB协议开发的开源共享原件

1）主要解决跨平台/系统之间的文件共享

2）SMB服务默认占用137/445（TCP）和138/139（UDP）端口

## 配置

Samba安装指令：yum install -y samba

如：在系统中安装Samba

配置防火墙指令：

1）iptables -F

2）service iptables save

//iptables中默认禁止SMB服务

/etc/samba/smb.conf文件：SMB服务的主配置文件

1）常用的配置参数如下：

参数
说明

全局参数[global]

workgroup = 工作组名称
指定工作组名称

server string = 服务器信息.%v
服务器信息简介 （%v代表Samba服务的版本号）

log file = 日志文件路径.%m
指定日志文件路径 （%m代表访问的主机名）

max log size = N
指定日志文件最大容量为N KB

security = 验证方式
指定验证方式（默认为user）

passdb backend = 用户后台类型
指定用户后台类型（默认为tdbsam）

共享参数[home]

comment = 描述信息
共享资源的描述信息

path = 文档路径
指定共享资源

browseable = yes/no
“网上邻居”是否可见共享资源

public = yes/no
所有人是否可见共享资源

writable = yes/no
是否可执行写操作

SMB服务的验证方式有以下4种：

1）** share**：允许所有主机访问（无需身份验证）；

2）** user**：访问需进行身份验证（默认）；

3）** server**：独立的远程主机验证访问主机的身份（集中管理用户）

4）** domain**：域控制器进行身份验证

SMB服务的用户后台类型有以下3种：

1）smbpasswd：以smbpasswd命令为系统用户设置SMB服务的密码；

2）tdbsam：以创建数据库文件和使用pdbedit命令配置SMB服务的用户；

3）ldapsam：基于LDAP服务进行用户验证

如：查看/etc/samba/smb.conf文件

//[home]中的home为指定的共享名称

//[printers]为打印机相关参数（较少使用）

**pdbedit命令**：为已建立的本地用户创建/管理SMB服务的用户数据库信息

指令格式：pdbedit 选项

选项
含义

-a 用户名
建立Samba用户 （必须是已存在的本地用户）

-u 用户名
修改指定Samba用户的密码

-x 用户名
删除Samba用户

-L
列出所有用户

-Lv 用户名
列出指定用户的详细信息

如：使本地用户mwl成为Samba用户

## 共享资源

如：配置共享/home/database目录的Samba服务器

1）创建/home/database目录，配置默认权限；

2）配置SELinux安全上下文和策略使SMB服务可访问普通用户家目录

3）配置SMB服务的主配置文件/etc/samba/smb.conf；

### Windows访问

使用Windows访问Samba服务器只需通过文件资源管理器或者游览器输入对应的Samba服务器的IP地址即可，再进行身份验证

如：续上，利用Windows访问Samba服务器

1）输入IP地址；

2）进行身份验证；

3）进入服务器；

### Linux访问

Samba服务也支持Linux系统的访问，但需cifs-utils工具协助

1）cifs-utils安装指令：yum install -y cifs-utils

如：在系统中安装cifs-utils程序

配置Samba服务的认证文件步骤：

1）建立认证文件，以“.smb”后缀结尾；

2）以Samba用户名、密码、共享域的顺序写入认证文件；

3）将认证文件的权限该为仅root可读写（提高安全性）；

如：在系统中建立认证文件

如：实现另外一台Linux系统访问Samba服务器（Linux系统）的共享资源

1）建立Linux客户端的认证文件auth.smb；

2）建立挂载点，并写入/etc/fstab文件中（实现开机自动挂载）；

3）进入服务器

## NFS

**NFS（Nerwork File System）** ：网络文件系统

1）基于TCP/IP协议

2）实现将远程Linux系统上的文件共享资源挂载到本地主机目录

//NFS仅能实现Linux系统之间的文件共享

安装NFS服务指令：yum install -y nfs-utils

//Centos7中默认安装NFS服务

如：验证/安装系统中的NFS服务

//确保服务器和客户端均安装

配置防火墙指令：

1）iptables -F

2）service iptables save

//iptables中默认禁止NFS共享服务

/etc/exports文件：NFS服务的主配置文件

内容格式：共享目录的路径 允许访问的NFS客户端（共享权限参数）

共享权限参数
说明

ro
只读

rw
读写

sync
同步处理内存数据和磁盘数据

async
异步处理内存数据和磁盘数据

root_squash
当NFS客户端以root管理员访问时 映射为NFS服务器的匿名用户

no_root_squash
当NFS客户端以root管理员访问时 映射为NFS服务器的root管理员

all_sqush
所有人均映射为NFS服务器的匿名用户

1）使用NFS服务进行文件共享前，先启动rpcbind服务

2）调用RPC服务将NFS服务器的IP和端口号等信息发送至客户端

如：启动rpcbind和nfs-server服务

RPC（Remote Procedure Call）：远程过程调用

如：建立客户端和服务器的NFS

1）NFS服务器上建立NFS文件共享目录；

2）配置NFS服务器上的NFS服务的主配置文件/etc/exports；

3）启动NFS服务器上的rpcbind和nfs-server服务；

4）客户端查询NFS服务器上支持共享的目录；

5）创建本地挂载目录（需指定挂载的文件系统类型）；

6）客户端和NFS服务器即共享资源

//还可再写入/etc/fstab文件中实现开机自动挂载

**showmount命令**：查询NFS服务资源共享相关信息

指令格式：showmount 选项

选项
含义

-e
列出NFS服务器的共享列表

-a
列出本机挂载的文件资源状况

## autofs

autofs服务：当检测到用户访问尚未挂载的文件系统时，便自动挂载该文件系统

1）autofs服务属于Linux系统守护进程

2）autofs服务安装指令：yum install -y autofs

如：在系统中安装autofs服务

/etc/auto.master文件：autofs服务的主配置文件

1）内容格式：挂载目录 子配置文件

2）挂载目录指的是该设备挂载路径的上一级目录

3）子配置文件的命名和路径无限制，但后缀必须为“.misc”结尾

4）子配置文件的内容格式：挂载目录 挂载文件类型，权限 ：设备名

5）其中-fstype参数指定挂载文件类型，多个权限使用“，”作为分隔符

如：查看/etc/auto.master文件

如：实现/dev/sr0目录的自动挂载服务（挂载点为/mnt/cdrom）

1）编写autofs服务的主配置文件/etc/auto.master；

2）配置子配置文件；

3）验证

//需启动autofs服务（还可设置开机自启）
