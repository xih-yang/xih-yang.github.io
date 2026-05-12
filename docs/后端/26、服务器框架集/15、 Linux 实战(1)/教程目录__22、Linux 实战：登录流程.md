# 22、Linux 实战：登录流程
- 来源：https://ddkk.com/zhuanlan/server/linux/2/22.html
- 分类：服务器框架
- 分组：教程目录
## 登录配置

## 登录管理

Linux用户使用密码登录过程：

**su命令**：切换用户

指令格式：su 选项 用户名

1）若不指定用户名，则默认切换到root用户

选项
含义

-l
以login shell方式切换用户 和“-”选项相同（以新环境变量登入）

-m
切换用户时不更换环境变量

-c
切换用户执行一次命令 然后恢复原来的用户

如：普通用户和root用户相互切换后

如：在/root目录下分别切换到root用户和wangerma用户，调用ls命令

1）切换用户前后的工作路径不会发生改变，但权限会发生改变

2）root用户切换到普通用户，不需要密码（反之，则需要）；

**finger命令**：查询并显示用户各种信息

指令格式1：finger //列出所有登陆系统用户的信息

1）本地和远端主机都进行查找，且忽略用户名大小写

2）若查询远端主机应该为：用户名@主机名

如：列出当前所有登录系统的用户信息

指令格式2：finger 选项 用户名 //列出指定用户的信息

选项
含义

-l
列出所有用户有关信息

-s
单行显示内容 默认为多行显示

-p
效果同-l选项，但不列出用户的“.plan”文件

如：查询mwl用户的信息

//若不带选项，效果同-l选项

内容
含义

Login
用户名 /etc/passwd文件的第1栏

Name
用户的注释 /etc/passwd文件的第5栏

Directory
用户家目录

Shell
用户使用的Shell解释器

On since
用户登录主机的情况 （未登录，则显示“Never logged in”）

Mail
调查/var/spool/mail当中的邮箱数据 （没有邮箱数据，则显示“No mail”）

Plan
调查用户家目录下的“.plan”文件并输出 （没有该文件，则显示“No plan”）

//能否输出Mail和Plan文件，与调用者权限有关

**chfn命令**：修改和添加finger显示的信息

指令格式：chfn 选项 用户名

1）无选项，则进入问答界面全部修改

选项
含义

-f
修改用户的全名

-o
修改用户Office room number

-p
修改用户Office Phone number

-h
修改用户Home Phone number

如：修改mwl的finger显示信息

## 登录配置

### /etc/issue

**/etc/issue**：终端登录欢迎信息的配置文件

如：查看当前主机的/etc/issue和登录欢迎信息

1）查看/etc/issue的文件内容

2）查看登录时显示的内容

/etc/issue中不同参数的含义：

参数
含义

\S
操作系统的名称

\r
操作系统版本

\m
硬件平台

\O
显示domain name

\l
第几个终端界面

\d
本地端时间的日期

\t
本地端时间的时间

\n
主机的网络名称

\v
操作系统的版本

### /etc/motd

**/etc/motd**：终端登录后布告信息的配置文件

1）所有用户登录都会显示该配置文件内容（包括root）

2）常用于通知登录用户一些系统信息

文件
区别

/etc/issue
在“login”提示符前显示信息

/etc/motd
在用户登录成功后显示信息

### 语系配置文件

**locale命令**：查询Linux相关语系配置

指令格式1：locale -a //查询Linux支持的所有语系

1）语系文件存储位：/usr/lib/locale

指令格式2：locale //查询当前Linux的语系设置

1）语系配置文件：/etc/locale.conf

//可通过修改该文件，达到更改系统默认语系英文为：en_US.utf8、中文为：zh_CN.utf8

//临时修改命令，如：LANG=en_US.utf8或LANG=zh_CN.utf8

如：locale查询当前语系设置

//其他语系变量若没设置，且仅设置LANG或LC_ALL时，其他语系变量默认取和这两个变量相同的语系

## Bash配置

Bash的环境配置文件：构造Bash运行所需要的环境

### Login shell和non-login shell

**login shell**：取得Bash时需要完整的登录流程

//如：登入Linux时，需要输入账号和密码

**non-login shell**：取得Bash不需要重复登录操作

//如：在原本的bash环境下启动一个bash

//login shell和non-login shell在取得Bash时读取的配置文件不同

#### Login shell

login shell读取的配置文件：/etc/profile和~/.bash_profile

/etc/profile：系统的整体环境设置

环境设置
含义

PATH
根据UID决定PATH变量是否含有/sbin目录

MAIL
根据用户名，设置用户的邮箱地址 /var/spool/mail/用户名

USER
根据用户名进行赋值

HOSTNAME
根据主机的hostname命令进行赋值

HISTSIZE
历史命令记录条数

umask
文档建立后的默认权限 root默认为022 普通用户默认为002

/etc/profile不仅配置环境设置，还会调用其他配置文件，如：

1）/etc/profile.d/*.sh：规范Bash操作界面基础和部分命令别名

//只要在/etc/profile.d目录下，扩展名为.sh且用户有r权限就被/etc/profile调用

2）/etc/locale.conf：规范Bash默认使用语系配置

//由/etc/profile.d/lang.sh调用

3）~/.bash_profile：用户个人环境设置

//login shell一般会读取~/.bash_profile、~/.bash_login和~/.profile的其中一个，读取顺序从左到右，且三者的效果相同（前提内容一样）

如：查看~/.bash_profile文件内容

#### non-login shell

non-login shell读取的配置文件：~/.bashrc

/etc/bashrc：设置登录用户的整体环境

//根据不同的UID设置umask值、命令提示符（PS1）并调用/etc/profile.d/*.sh的设置

其他配置文件：同样影响Bash环境设置

/etc/man_db.conf：规范了man命令去查找数据的路径

~/.bash_history：Bash会读取该文件，将所有的历史命令存入内存

~/.bash_logou：记录注销Bash后，系统需要执行什么操作

Linux用户从输入密码登录到使用Bash shell全过程

### 终端配置

**stty命令（setting tty）** ：设置/查看所有终端参数

指令格式：stty -a

如：查看所有终端参数

名称
含义

intr
发一个中断（interrupt）信号给正在运行的程序

quit
发一个quit信号给正在运行的程序

kill
删除目前命令行上的所有文字

eof
结束输入（End of file）

stop
停止目前屏幕输出

start
恢复目前屏幕输出

erase
向后删除字符

susp
发一个terminal stop信号给正在运行的程序
