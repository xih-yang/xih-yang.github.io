# 03、Linux 实战：文档管理相关命令
- 来源：https://ddkk.com/zhuanlan/server/linux/2/3.html
- 分类：服务器框架
- 分组：教程目录
## 基础概念

## 文档字符

Linux中通过不同的单个字符区别不同的文件，常见文件字符如下：

文档字符
类型

-
普通文件

d
目录文件

l
链接文件

b
块设备文件

c
字符设备文件

s
网络数据交换文件

p
管道文件

## 文件种类

为方便管理，主观的将文档分为以下5种类型：

## 文档颜色

在显示文档信息时，Linux系统会自动为不同文档种类赋予不同的颜色显示：

颜色
类型

蓝色
目录

黄色
设备文件

灰色
其他文件

红色
压缩或包文件

绿色
可执行文件
（一般为二进制程序)

白色
(黑色)
普通文件

浅蓝色文件
链接文件

红色闪烁
有问题的链接文件

## 文档时间

文档的时间信息由以下3个时间参数组成：

时间参数
含义

mtime
（Modification Time）
当文档内容被修改时，则更新该时间

atime
（Access Time）
当文档被任意方式读取时，则更新该时间

ctime
（Status Time）
当文档状态被更改时，则更新该时间

## 管理文档相关命令

## basename

basename命令：返回指定文档路径的名称部分

指令格式：basename 文档路径

（1）常用于shell编程中；

> 例1：仅打印/etc/passwd的名称部分
>
> [root@ddkk.com ~]# basename /etc/passwd
>
> passwd

## dirname

dirname命令：返回指定文档路径的目录部分

指令格式：dirname 文档路径

（1）常用于shell编程中；

> 例1：仅打印/etc/passwd的目录部分
>
> [root@ddkk.com ~]# dirname /etc/passwd
>
> /etc

## pwd

pwd命令（Print Working Directory）：返回当前终端所在的工作目录

指令格式：pwd

> 例1：返回当前工作目录，切换到/etc目录后再次返回当前工作目录
>
> [root@ddkk.com ~]# pwd
>
> /root
>
> [root@ddkk.com ~]# cd /etc
>
> [root@ddkk.com etc]# pwd
>
> /etc
>
> [root@ddkk.com etc]# cd
>
> [root@ddkk.com ~]# pwd
>
> /root

## cd

cd命令（Change Directory）：切换当前终端所在的工作目录

指令格式：cd 路径

（1）若省略路径，则默认切换到当前用户的家目录（等效于cd ~）；

> 例1：切换至/tmp目录，再返回至用户的家目录
>
> [root@ddkk.com ~]# cd /tmp
>
> [root@ddkk.com tmp]# pwd
>
> /tmp
>
> [root@ddkk.com tmp]# cd ~
>
> [root@ddkk.com ~]# pwd
>
> /root

## ls

ls命令：返回文档的基础信息

指令格式：ls 选项 文档路径

（1）添加选项以查看更多的文档信息；

选项
含义

-l
以详细列表形式显示

-a
返回全部文档
（默认不显示隐藏文档）

-d
仅返回目录的信息
（默认返回目录中包含的文档信息）

-R
连同子目录内容返回

-h
以较高的可读性形式返回

-F
根文档信息给予附加数据结构

-i
返回文档的inode号

--full-time
返回文档创建/修改的具体日期

> 例1：以详细信息列出/目录下所有文档的信息

> 例2：仅列出./root目录的信息
>
> [root@ddkk.com ~]# ls -ldh /root
>
> dr-xr-x---. 16 root root 4.0K Nov 16 11:56 /root

## stat

stat命令：返沪i指定文档的详细信息

指令格式：stat 文档路径

> 例1：查看/etc/grub.d目录的详细信息

## mkdir

mkdir命令（Make Directory）：指定路径下创建目录

指令格式：mkdir 路径

（1）若只指定目录名，则默认在当前工作目录创建子目录；

（2）若同时创建多个目录，目录之间使用空格分隔；

（3）若创建多层级目录应添加-p选项，格式：mkdir -p 路径

> 例1：在当前目录下创建test子目录
>
> [root@ddkk.com ~]# mkdir test
>
> [root@ddkk.com ~]# ls -ld ./test
>
> drwxr-xr-x. 2 root root 6 11月 16 11:48 ./test

> 例2：在/tmp目录下同时创建test2和test3子目录
>
> [root@ddkk.com ~]# mkdir /tmp/test2 /tmp/test3
>
> [root@ddkk.com ~]# ls -ld /tmp/test2 /tmp/test3
>
> drwxr-xr-x. 2 root root 6 11月 16 11:51 /tmp/test2
>
> drwxr-xr-x. 2 root root 6 11月 16 11:51 /tmp/test3

> 例3：创建多层级目录/root/lay1/lay2

## touch

touch命令：创建文件和更新文件的时间参数

指令格式1（创建文件）：touch 文件路径

（1）若指定文件已存在，则更新该文件的时间参数为当前时间；

> 例1：在/tmp目录下创建hello文件
>
> [root@ddkk.com ~]# touch /tmp/hello
>
> [root@ddkk.com ~]# ls -l /tmp/hello
>
> -rw-r--r--. 1 root root 0 Nov 16 12:44 /tmp/hello

指令各式2（更新时间参数）：touch 选项 文件路径

（1）若不指定选项，则默认修改文档的全部时间参数；

选项
含义

-m
修改文档的mtime时间参数

-a
修改文档的atime时间参数

-c
修改文档的ctime时间参数

-t
指定修改文档的时间
（默认是当前时间）
（指定格式：年月日时分.秒）

> 例2：创建txt1文件并修改其使劲按为2020-10-11 08：15：30，最后更新为当前时间

## rename

rename命令：重命名文档

指令格式：rename 原文档名 新文档名 文档路径

（1）可搭配通配符进行批量修改文件；

> 例1：将当前工作目录的test文件重命名为file
>
> [root@ddkk.com ~]# touch test
>
> [root@ddkk.com ~]# ls -l test file
>
> ls: cannot access 'file': No such file or directory
>
> -rw-r--r--. 1 root root 0 Nov 16 13:08 test
>
> [root@ddkk.com ~]# rename test file ./test
>
> [root@ddkk.com ~]# ls -l test file
>
> ls: cannot access 'test': No such file or directory
>
> -rw-r--r--. 1 root root 0 Nov 16 13:08 file

## cp

cp命令（Copy）：复制文档到指定路径

指令格式：cp 选项 源文档路径 目标文档路径

（1）复制过程中可对文档进行重命名；

选项
含义

-f
强制复制

-r
递归复制

-p
复制时保留源文件属性

-d
复制链接文件时，将复制后的文件指向源链接文件

-a
复制时，保留链接和属性（或递归复制）
（等同于-dpr）

> 例1：复制链接文件txt2（链接至txt1）为txt3和txt4文件
>
> [root@ddkk.com ~]# touch txt1
>
> [root@ddkk.com ~]# ln -s txt1 txt2
>
> [root@ddkk.com ~]# ls -l txt1 txt2
>
> -rw-r--r--. 1 root root 0 11月 16 13:15 txt1
>
> lrwxrwxrwx. 1 root root 4 11月 16 13:15 txt2 -> txt1
>
> [root@ddkk.com ~]# cp txt2 txt3
>
> [root@ddkk.com ~]# cp -d txt2 txt4
>
> [root@ddkk.com ~]# ls -l txt3 txt4
>
> -rw-r--r--. 1 root root 0 11月 16 13:15 txt3
>
> lrwxrwxrwx. 1 root root 4 11月 16 13:15 txt4 -> txt1

## mv

mv命令（Move）：移动文档和重命名文档

指令格式：mv 被移动文档路径 指定路径

（1）只需将移动的文档和移动前的文档名不一致，即可实现文档的重命名（需使用绝对路径）；

> 例1：将/root/test文件移至/tmp目录下，再重命名为file
>
> [root@ddkk.com ~]# mv ./test /tmp/test
>
> [root@ddkk.com ~]# ls -l /tmp/test
>
> -rw-r--r--. 1 root root 0 11月 16 13:24 /tmp/test
>
> [root@ddkk.com ~]# mv /tmp/test /tmp/file
>
> [root@ddkk.com ~]# ls -l /tmp/file
>
> -rw-r--r--. 1 root root 0 11月 16 13:24 /tmp/file

## rm

rm命令（Remove）：移动指定文档

指令格式：rm 选项 被移除的文档路径

（1）若不添加选项，删除时会提示（删除目录时较麻烦）；

选项
含义

-f
强制移除

-r
递归移除

> 例1：删除/tmp目录下的test文件和file目录

## 查找文档相关命令

## whereis

whereis命令：在特定目录下查找含有指定名称的文档路径

指令格式：whereis 选项 文档名

(1)特定目录主要为：/etc/sbin和/usr/share/man

选项
含义

-b
只查找二进制格式的文件

-m
只查找mannual路径下的文件

-l
列出whereis用户查找的目录

> 例1：查找ls命令的执行文件和帮助文档
>
> [root@ddkk.com ~]# whereis ls
>
> ls: /usr/bin/ls /usr/share/man/man1/ls.1.gz /usr/share/man/man1p/ls.1p.gz
>
> [root@ddkk.com ~]# whereis -b ls
>
> ls: /usr/bin/ls
>
> [root@ddkk.com ~]# whereis -m ls
>
> ls: /usr/share/man/man1/ls.1.gz /usr/share/man/man1p/ls.1p.gz

## locate

locate命令：在数据库中查找含有指定名称的文档路径

指令格式：locate 选项 文档名

（1）locate命令使用的数据：/var/lib/molcate

（2）数据库一般默认每天更新一次（不同发行版可能不同）

选项
含义

-i
忽略大小写

-r
使用正则表达式匹配

-S
返回locate所使用的数据库文件相关的信息

> 例1：查找含有yum.repos.d的文档路径
>
> [root@ddkk.com ~]# locate yum.repos.d
>
> /etc/yum.repos.d
>
> /etc/yum.repos.d/CentOS-Linux-AppStream.repo
>
> /etc/yum.repos.d/CentOS-Linux-BaseOS.repo
>
> /etc/yum.repos.d/CentOS-Linux-ContinuousRelease.repo
>
> /etc/yum.repos.d/CentOS-Linux-Debuginfo.repo
>
> /etc/yum.repos.d/CentOS-Linux-Devel.repo
>
> /etc/yum.repos.d/CentOS-Linux-Extras.repo
>
> /etc/yum.repos.d/CentOS-Linux-FastTrack.repo
>
> /etc/yum.repos.d/CentOS-Linux-HighAvailability.repo
>
> /etc/yum.repos.d/CentOS-Linux-Media.repo
>
> /etc/yum.repos.d/CentOS-Linux-Plus.repo
>
> /etc/yum.repos.d/CentOS-Linux-PowerTools.repo
>
> /etc/yum.repos.d/CentOS-Linux-Sources.repo

## updatedb

updatedb命令：更新locate命令查找的数据库

指令格式：updatedb

（1）updatedb命令会根据/etc/updatedb.conf的配置遍历整个文件系统，用遍历数据更新/var/lib/mlocate；

（2）updatedb命令不会由有任何返回值；

> 例1：更新/var/lib/mlocate
>
> [root@ddkk.com ~]# updatedb

## find

find命令：通过遍历文件系统查找指定文件

指令格式1（根据类型查找）：find 路径 类型选项 选项值

（1）路径参数用于给find命令指定查找范围；

（2）各个指令格式的选项可混用，此处只是便于表达进行区分；

选项
含义

-name
根据文档名查找
（可进行模糊查询）

-type
根据文档类型查找）

（2）常用文档类型有以下6种：

字符
代表的文件类型

:--:
:--:

f
普通文件

d
目录文件

l
链接文件

s
Socket文件

p
FIFO文件

b或c
设备文件

> 例1：查找/etc目录下所有sh后缀的文件
>
> [root@ddkk.com ~]# find /etc -name *.sh
>
> /etc/X11/xinit/xinitrc.d/50-systemd-user.sh
>
> /etc/X11/xinit/xinitrc.d/00-start-message-bus.sh
>
> /etc/X11/xinit/xinitrc.d/localuser.sh
>
> /etc/profile.d/vte.sh
>
> /etc/profile.d/lang.sh
>
> /etc/profile.d/colorgrep.sh
>
> /etc/profile.d/which2.sh
>
> /etc/profile.d/colorxzgrep.sh
>
> /etc/profile.d/colorls.sh
>
> /etc/profile.d/less.sh
>
> /etc/profile.d/gawk.sh
>
> /etc/profile.d/colorzgrep.sh
>
> /etc/profile.d/ssh-x-forwarding.sh
>
> /etc/profile.d/flatpak.sh
>
> /etc/profile.d/gnome-ssh-askpass.sh
>
> /etc/profile.d/vim.sh
>
> /etc/profile.d/PackageKit.sh
>
> /etc/profile.d/bash_completion.sh
>
> /etc/bash_completion.d/authselect-completion.sh
>
> /etc/dhcp/dhclient.d/chrony.sh
>
> /etc/kernel/postinst.d/51-dracut-rescue-postinst.sh
>
> /etc/smartmontools/smartd_warning.sh

> 例2：查找/etc/sane.d目录下所有的目录
>
> [root@ddkk.com ~]# find /etc/sane.d -type d
>
> /etc/sane.d
>
> /etc/sane.d/dll.d

指令格式2（根据时间查找）：find 路径 时间选项 选项值

（1）返回指定时间段被修改的文档；

（2）时间选项有以下3种：

选项
含义

-mtime
根据文档的mtime时间参数

-atime
根据文档的atime时间参数

-ctime
根据文档的ctime时间参数

（3）若选项值为N，则不同符号代表形式如下：

形式
说明

N
第N天到第N+1天之间被修改的

-N
N天之内（包含第N天）被修改的

+N
N天之前（不包含第N天）被修改的

> 例3：当N为4时，其所代表的含义

指令格式3（根据用户查找）：find 路径 用户选项 选项值

（1）返回与指定用户信息相关的文档；

（2）用户选项有以下6种：

选项
说明

-uid
根据UID查找

-gid
根据GID查找

-user
根据用户名查找

-group
根据用户组名查找

-nouser
查找文当属主不在/etc/passwd文件中的文档

-nogroup
查找文档属组不在/etc/group文件中的文档

> 例4：查找/var目录中属于mwl用户的文档
>
> [root@ddkk.com ~]# find /var -user mwl
>
> /var/spool/mail/mwl

指令格式4（根据其他查找）：find 路径 其他选项 选项值

选项
说明

-perm
根据权限查找

-size
根据文件大小查找

-prune
查找时忽略该指定目录

-newer文档1 ！ 文档2
查找表i文件1新，但比文档2旧的文档

> 例5：先查找/home目录下大于50k的文档，再查找位于50k至100k之间大小的文档
>
> [root@ddkk.com ~]# find /home -size +50k | xargs -n 1 ls -lh
>
> -rw-r--r--. 1 mwl mwl 84K Oct 11 17:48 /home/mwl/.local/share/evolution/addressbook/system/contacts.db
>
> -rw-r-----. 1 mwl mwl 74K Oct 11 17:48 /home/mwl/.local/share/tracker/data/tracker-store.ontology.journal
>
> -rw-r-----. 1 mwl mwl 74K Oct 11 17:48 /home/mwl/.local/share/tracker/data/tracker-store.journal
>
> -rw-r--r--. 1 mwl mwl 1.3M Oct 11 17:55 /home/mwl/.cache/mesa_shader_cache/index
>
> -rw-r--r--. 1 mwl mwl 3.5M Oct 11 17:48 /home/mwl/.cache/tracker/meta.db
>
> -rw-r--r--. 1 mwl mwl 3.5M Oct 11 17:48 /home/mwl/.cache/tracker/meta.db-wal
>
> -rw-r--r--. 1 mwl mwl 353K Oct 11 17:48 /home/mwl/.cache/tracker/ontologies.gvdb
>
> -rw-------. 1 mwl mwl 549K Oct 11 17:48 /home/mwl/.cache/gstreamer-1.0/registry.x86_64.bin
>
> -rw-r--r--. 1 mwl mwl 2.4M Oct 11 17:48 /home/mwl/.cache/gnome-software/appstream/components.xmlb
>
> [root@ddkk.com ~]# find /home -size +50k -size -100k | xargs -n 1 ls -lh
>
> -rw-r--r--. 1 mwl mwl 84K Oct 11 17:48 /home/mwl/.local/share/evolution/addressbook/system/contacts.db
>
> -rw-r-----. 1 mwl mwl 74K Oct 11 17:48 /home/mwl/.local/share/tracker/data/tracker-store.ontology.journal
>
> -rw-r-----. 1 mwl mwl 74K Oct 11 17:48 /home/mwl/.local/share/tracker/data/tracker-store.journal

find、locate和whereis命令相比较：

命令
查找方式

find
遍历文件系统

locate
在数据库中查找

whereis
指定目录中查找
