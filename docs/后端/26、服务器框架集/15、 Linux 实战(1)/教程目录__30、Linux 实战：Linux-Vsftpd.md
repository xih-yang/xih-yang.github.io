# 30、Linux 实战：Linux-Vsftpd
- 来源：https://ddkk.com/zhuanlan/server/linux/2/30.html
- 分类：服务器框架
- 分组：教程目录
## Vsftpd

**FTP（File Transfer Protocol）** ：文件传输协议

1）属于TCP/IP协议（基于C/S模式）

2）默认占用20端口（传输数据）和21端口（传输命令）

FTP工作模式分为以下两种：

1）** 主动模式**：FTP服务器主动向客户端发起连接请求；

2）** 被动模式**：FTP服务器等待客户端发起连接请求（默认工作模式）；

**vsftpd（very secure ftp daemon）** ：非常安全的FTP守护进程

1）基于FTP协议开发，运行在Linux系统上的FTP服务程序

vsftpd三种认证模式：

1）** 匿名开放模式**：所有人均可访问并登录FTP服务器（无需身份验证）；

2）** 本地用户模式**：基于Linux系统本地用户的认证模式；

3）** 虚拟用户模式**：基于独立的用户数据库文件，创建虚拟用户

//虚拟用户信息在Linux系统上不存在（安全性最高）

//为管理虚拟用户对本地文档的属性权限，需创建映射虚拟用户的本地用户

## 配置

vsftpd安装指令：yum install -y vsftpd

如：在系统中安装vsftpd

配置防火墙指令：

1）iptables -F

2）service iptables save

//iptables中默认禁止FTP传输协议的端口号

/etc/vsftpd/vsftpd.conf：vsftpd服务的主配置的文件

1）常用的配置参数如下：

参数
说明

全局性参数

listen=YSE/NO
是否以独立运行的方式监听服务

listen_address=IP
指定监听的IP地址

listen_port=端口号
指定监听端口号

download_enable=YES/NO
是否允许下载文档

userlist_enable=YES/NO userlist_deny=YES/No
允许/拒绝/etc/vsftpd/user_list文件内的用户登录

max_clients=N
指定最大客户端连接数为N （0为无限制）

max_per_ip=N
指定一个IP的最大连接数为N （0为无限制）

匿名开放模式参数

anonymous_enable=YES/NO
是否允许匿名用户登录

anon_root=目录路径
指定匿名用户的FTP根目录

anonymous_upload_enable=YES/NO
是否允许匿名用户上传文件

anon_mask=umask值
指定匿名用户上传文件的umask值

anon_max_rate=N
指定匿名用户的最大传输速率为N （0为无限制）

anon_mkdir_write_enable=YES/NO
是否允许匿名用户创建目录

anon_other_write_enable=YES/NO
是否配置匿名用户全部权限

本地用户模式参数

local_enable=YES/NO
是否允许本地用户登录

local_root=目录路径
指定本地用户的FTP根目录

local_mask=umask值
指定本地用户上传文件的umask值

local_max_rate=N
指定本地用户的最大传输速率为N （0为无限制）

chroot_local_user=YES/NO
是否限制本地用户权限在FTP目录

虚拟用户模式参数

guest_enable=YES/NO
是否允许虚拟用户登录

guest_username=本地用户
指定映射虚拟用户的本地用户

user_config_dir=目录路径
指定虚拟用户权限配置文件的目录

pam_service_name=PAM文件路径
指定PAM验证文件 （默认为/etc/pam.d/vsftpd）

//配置虚拟用户模式使用的是匿名开放模式参数

如：查看/etc/vsftpd/vsftpd.conf文件

**ftp**：Linux系统中以命令行界面管理FTP传输服务的客户端工具

ftp安装指令：yum install -y ftp

如：在系统中安装ftp

## 匿名开放模式

**匿名开放模式**：vsftpd服务默认模式

1）登录用户名统一为“anonymous”密码为空

2）默认登录访问的是/var/ftp目录（可通过配置匿名根目录修改）

如：配置匿名开发模式的FTP服务器

1）配置vsftpd服务的主配置文件/etc/vsftpd/vsftpd.conf；

2）配置根目录下默认目录pub的属主；

//不能更改/var/ftp目录，否则无法登录FTP服务器

3）配置SELinux策略；

4）登录192.168.121.128服务器，尝试增、删、改和查权限

ftp命令：通过身份验证登录FTP服务器

指令格式：ftp FTP服务器IP

ftp命令登录FTP服务器后，常用命令如下：

命令
说明

基础命令

ls
列出当前目录下的文档

pwd
列出当前工作目录

cd 目录路径
切换工作目录

status
列出FTP连接状态

quit
退出FTP服务器

文档命令

rename 原文件名 新文件名
重命名指定文件

delete 文件路径
删除指定文件

mdelete
删除多个文件

mkdir 目录路径
创建指定目录

rmdir 目录路径
删除指定目录

上传/下载命令

ascii
指定默认以ASCII码方式传输文件

binary
指定默认以二进制方式传输文件

get 目的文件路径 本地文件路径
下载单个文件

mget 文件路径
下载多个文件

put 本地文件路径 目的文件路径
上传单个文件

mput 文件路径
上传多个文件

## 本地用户模式

本地用户模式：基于Linux系统本地用户的认证模式

### 拒绝登录

FTP服务器的黑名单：/etc/vsftpd/userlist_deny和/etc/vsftpd/ftpusers

//系统管理员和系统用户需同时写入这两个文件

如：查看/etc/vsftpd/userlist_deny文件

//默认设置为：userlist_enable=YES，userlist_deny=YES

如：查看/etc/vsftpd/ftpusers文件

如：配置本地用户模式的FTP服务器

1）配置vsftpd服务的主配置文件/etc/vsftpd/vsftpd.conf；

2）配置/etc/vsftpd/userlist_deny和/etc/vsftpd/ftpusers文件中；

//根据userlist_enable和userlist_deny参数配置

3）配置SELinux策略；

4）登录192.168.121.128服务器，尝试增、删、改和查权限

## 虚拟用户模式

虚拟用户模式：基于独立的用户数据库文件，创建虚拟用户

**db_load命令**：将明文文件加密并生成db数据库

指令格式：db_load 选项

选项
含义

-T
应用程序可调用该数据库

-t
指定加密方式 一般为hash（哈希加密算法）

-f
指定需加密文件

//被加密的文件必须为奇数行为用户名，偶数行为密码（明文）

如：创建用户数据库文件

1）编写可登录的用户名和密码数据库文件；

//编写格式：奇数行为用户名，偶数行为密码（明文）

2）加密数据库文件，并保存至/etc/vsftpd目录下（配置权限）；

3）删除原始数据库文件（提高安全性）

如：配置虚拟用户模式的FTP服务器

1）创建虚拟用户所映射的系统本地用户；

//该本地用户的家目录作为存储文件的根目录（虚拟用户登录后默认位置）

2）利用加密数据库文件配置PAM认证；

3）为不同虚拟用户配置权限；

4）配置vsftpd服务的主配置文件/etc/vsftpd/vsftpd.conf；

5）配置SELinux策略；

6）mwl1和mwl2用户登录192.168.121.128服务器，尝试增、删、改和查权限

## TFTP

**TFTP（Trivial File Transfer Protocol）** ：简单文件传输协议（基于UDP协议）

1）默认占用69端口

2）不需要客户端的身份/权限认证

//由Linux系统中xinetd服务管理（默认禁用）

3）tftp的根目录为/var/lib/tftpboot，且内部命令和ftp一致

TFTP安装指令：yum install tftp-server tftp

如：在系统中安装TFTP

通过修改xinetd服务中的tfp配置文件/etc/xinetd.d/tftp开启TFTP服务

如：开启系统中的TFTP服务

配置防火墙指令：firewall-cmd --permanent --add-port=69/udp

firewall-cmd --reload
