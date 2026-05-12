# 04、Linux 实战：文档内容相关命令
- 来源：https://ddkk.com/zhuanlan/server/linux/2/4.html
- 分类：服务器框架
- 分组：教程目录
## 重定向

## 输出重定向

**输出重定向：**将命令的执行结果导向到特定的文件或设备

**1、** Linux中命令的执行结果默认输出到终端（屏幕）；

**2、** 输出重定向分为：**标准输出重定向**、**标准错误输出重定向**；

标准输出重定向（Standard Output，stdout）：输出命令/程序的执行结果

- 标准输出重定向符号分为以下两种：

>
>>

覆盖输出
（输出内容将原有内容进行覆盖）
追加输出
（在原有内容的默认处添加）

- 也可在输出符号前添加1（输出符）（如：1>或1>>）
- 若指定的文件不存在，则系统会自动创建该文件

> 例1：列出根目录下所有文档的详细信息并导入到当前目录的ls.txt文件

标准错误输出重定向（Standard Error Output，stderr）：输出命令/程序的日志或错误信息

- 标准输出重定向符号分为以下两种：

2>
2>>

覆盖输出
（输出内容将原有内容进行覆盖）
追加输出
（在原有内容的默认处添加）

- 输出符2不能省略（用于区分）

> 例2：查询/home下所有.bashrc文件，并将结果分别导向ls_stdout.txt和ls_stderr.txt文件；

stdout
stderr

区别
执行成功后返回的信息
执行失败后返回的信息

**1、** stdout和stderr不能使用对方输出符；

**2、** 特殊输出符（&>）可同时将stdout和stderr的信息导向指定文件（覆盖写）；

> 例3：查询/home下所有.bashrc文件，并将结果导向到当前目录下的list文件

## 输入重定向

**输入重定向：**将指定文件或设备中数据作为终端的输入数据

**1、** Linux中输入默认从键盘设备获取；

**2、** 输出重定向只有一种：**标准输入重定向**；

标准输入重定向（Standard Input，stdin）：将文件/设备的数据作为输入数据

- 标准输入重定向符号分为以下两种：

 例1：使用stdin发送mai给mwl用户

## tee命令

tee命令：输出双向重定向（将数据分别输出到终端和文件/设备中）

指令格式：tee 选项 文件路径

选项
含义

-a
以追加形式输出
（默认以覆盖形式）

-i
忽略中断信号

> 例2：将PATH环境变量的值分别输出到终端和ls_path.txt文件；

## echo命令

echo命令：输出指定字符串或变量的值

指令格式：echo “字符串”或${变量}

- 可省略变量左右的中括号（博主不建议省略）

> 例3：分别输出”Hello，World“和SHELL环境变量
>
> [root@ddkk.com ~]# echo "Hello,World"
>
> Hello,World
>
> [root@ddkk.com ~]# echo "${SHELL}"
>
> /bin/bash

## 管道

管道：组合命令

**1、** 管道符（竖线，回车键上）：|；

**2、** 常用于：过滤处理、扩展命令扩能和；

**3、** 并不是所有命令都支持管道（部分命令不支持多个参数同时输入）；

**4、** 本质：将第一个命令的输出作为第二个命令的输入（可无限其嵌套，依次类推）；

> 例1：仅列出根目录含字符”y”的文档
>
> [root@ddkk.com ~]# ls /
>
> bin dev home lib64 mnt proc run srv tmp var
>
> boot etc lib media opt root sbin sys usr
>
> [root@ddkk.com ~]# ls / | grep y
>
> sys

## xargs命令

xargs命令（X Arguments）：命令传递参数过滤器

指令格式：xargs 选项 命令

选项
含义

-n
一次性传递几个参数

-p
执行每个命令前都询问是否执行

-e
设置结束字符

-0
将特殊字符还原成普通字符

> 例2：通过id命令查询/etc/passwd文件中前3个用户

## 查看文档相关命令

## cat

cat命令：输出文件内容到终端

指令格式：cat 选项 文件路径

选项
含义

-n
同时输出行号
（默认仅输出内容）

-A
同时输出不可打印字符
（行尾以“$”表示结束）

> 例1：输出root用户家目录下的.bashrc文件
>
> [root@ddkk.com ~]# cat -n /root/.bashrc
>
> 1 # .bashrc
>
> 2
> 3 # User specific aliases and functions
>
> 4
> 5alias rm='rm -i'
>
> 6alias cp='cp -i'
>
> 7alias mv='mv -i'
>
> 8
> 9 # Source global definitions
>
> 10 if [ -f /etc/bashrc ]; then
>
> 11 . /etc/bashrc
>
> 12 fi

## head

head命令：输出指定文件的前N行内容

指令格式：head -N 文件路径

- 若不指定N，则默认显示前10行

> 例1：输出/etc/passwd文件的前5和10行内容
>
> [root@ddkk.com ~]# head -5 /etc/passwd
>
> root:\x:0:0:root:/root:/bin/bash
>
> bin:\x:1:1:bin:/bin:/sbin/nologin
>
> daemon:\x:2:2:daemon:/sbin:/sbin/nologin
>
> adm:\x:3:4:adm:/var/adm:/sbin/nologin
>
> lp:\x:4:7:lp:/var/spool/lpd:/sbin/nologin
>
> [root@ddkk.com ~]# head /etc/passwd
>
> root:\x:0:0:root:/root:/bin/bash
>
> bin:\x:1:1:bin:/bin:/sbin/nologin
>
> daemon:\x:2:2:daemon:/sbin:/sbin/nologin
>
> adm:\x:3:4:adm:/var/adm:/sbin/nologin
>
> lp:\x:4:7:lp:/var/spool/lpd:/sbin/nologin
>
> sync:\x:5:0:sync:/sbin:/bin/sync
>
> shutdown:\x:6:0:shutdown:/sbin:/sbin/shutdown
>
> halt:\x:7:0:halt:/sbin:/sbin/halt
>
> mail:\x:8:12:mail:/var/spool/mail:/sbin/nologin
>
> operator:\x:11:0:operator:/root:/sbin/nologin

## tail

tail命令：输出指定文件的后N行内容

指令格式：tail -N 文件路径

- 若不指定N，则默认显示后10行

> 例1：输出/etc/passwd文件的后5和10行内容
>
> [root@ddkk.com ~]# tail -5 /etc/passwd
>
> gnome-initial-setup:\x:976:975::/run/gnome-initial-setup/:/sbin/nologin
>
> sshd:\x:74:74:Privilege-separated SSH:/var/empty/sshd:/sbin/nologin
>
> tcpdump:\x:72:72:: /:/sbin/nologin
>
> mwl:\x:1000:1000:mwl:/home/mwl:/bin/bash
>
> test:\x:1001:1001::/home/test:/bin/bash
>
> [root@ddkk.com ~]# tail /etc/passwd
>
> rpcuser:\x:29:29:RPC Service User:/var/lib/nfs:/sbin/nologin
>
> setroubleshoot:\x:979:978::/var/lib/setroubleshoot:/sbin/nologin
>
> flatpak:\x:978:977:User for flatpak system helper:/:/sbin/nologin
>
> gdm:\x:42:42::/var/lib/gdm:/sbin/nologin
>
> clevis:\x:977:976:Clevis Decryption Framework unprivileged user:/var/cache/clevis:/sbin/nologin
>
> gnome-initial-setup:\x:976:975::/run/gnome-initial-setup/:/sbin/nologin
>
> sshd:\x:74:74:Privilege-separated SSH:/var/empty/sshd:/sbin/nologin
>
> tcpdump:\x:72:72:: /:/sbin/nologin
>
> mwl:\x:1000:1000:mwl:/home/mwl:/bin/bash
>
> test:\x:1001:1001::/home/test:/bin/bash

## more

more命令：占用当前终端以分页输出文件内容

指令格式：more 文件路径

- 每次仅根据终端屏幕大小显示一页，可通过空格翻页查看
- 只能向后翻页，不可回滚（完全查看后，返回终端）

> 例1：通过more命令查看/etc/passwd文件

## less

less命令：在more命令的基础上，添加可回滚功能

指令格式：less 文件路径

- 可通过辅助功能键（数字、空格和上下键）查看内容
- 按“q”可返回终端

> 例1：通过less命令查看/etc/passwd文件

## wc

wc命令：统计文件信息并返回

指令格式：wc 选项 文件路径

选项
含义

-l
统计文件的行数

-w
统计文件的单词数
（基于空格判断，对中文无实际意义）

-c
统计文件的字节数

- 若无选项，wc命令默认会统计行数、单词数和字节数

> 例1：通过wc命令统计/etc/passwd文件的信息
>
> [root@ddkk.com ~]# wc /etc/passwd
>
> 47 106 2584 /etc/passwd
>
> [root@ddkk.com ~]# wc -l /etc/passwd
>
> 47 /etc/passwd
>
> [root@ddkk.com ~]# wc -w /etc/passwd
>
> 106 /etc/passwd
>
> [root@ddkk.com ~]# wc -c /etc/passwd
>
> 2584 /etc/passwd

## grep

grep命令：查找数据中含有关键词的行并返回

指令格式：grep 选项 关键词 文件路径

选项
含义

-a
以文本方式查找二进制文件中的数据

-c
统计含有关键词的函数

-i
忽略大小写
（默认大小区分）

-n
同时输出行号

-v
输出不含有关键词的行

-P
使其支持正则表达式（BRE）

-E
使其支持扩展正则表达式（ERE）

- grep命令在匹配到关键词后，以行为单位输出数据
- egrep命令是grep命令的升级版，其支持POSIX扩展正则表达式

> 例1：检索/etc/passwd文件中shell解释器不是/sbin/nologin的用户
>
> [root@ddkk.com ~]# grep -v /sbin/nologin /etc/passwd
>
> root:\x:0:0:root:/root:/bin/bash
>
> sync\x:5:0:sync:/sbin:/bin/sync
>
> shutdown:\x:6:0:shutdown:/sbin:/sbin/shutdown
>
> halt:\x:7:0:halt:/sbin:/sbin/halt
>
> mwl:\x:1000:1000:mwl:/home/mwl:/bin/bash
>
> test:\x:1001:1001::/home/test:/bin/bash

> 例2：检索系统进程中以“d”为开头的用户运行的进程
>
> [root@ddkk.com ~]# ps aux | grep -E ^d
>
> dbus 926 0.0 0.2 74016 8132 ? Ssl 14:52 0:01 /usr/bin/dbus-daemon --system --address=systemd: --nofork --nopidfile --systemd-activation --syslog-only
>
> dnsmasq 1768 0.0 0.0 73320 2160 ? S 14:52 0:00 /usr/sbin/dnsmasq --conf-file=/var/lib/libvirt/dnsmasq/default.conf --leasefile-ro --dhcp-script=/usr/libexec/libvirt_leaseshelper

## diff

diff命令：以行为单位对比两个文档的差异

指令格式：diff 选项 文档路径1 文档路径2

选项
含义

-b
忽略行中的空白差异

-B
忽略空白行差异

-i
忽略大小写差异

-c
显示所有内容，并标记拥有差异内容的行

-r
递归比较
（比较目录下的文件差异）

> 例1：比较test1.txt和test2.txt文件内容的差异

## iconv

iconv命令：语系编码转换

指令格式：iconv -f 原编码 -t 新编码 文档路径

选项
含义

-f
原本的编码格式

-t
新编码的格式

-o
指定转换后的结束输出
（默认输出到当前终端的屏幕）

- 查看iconv支持的语系数据可用：iconv --list
- -f和-t所能指定的合法编码都在--list选项返回的结果中

> 例1：将test1.txt的编码格式转换为WINDOWS-1258，并输出
>
> [root@ddkk.com ~]# iconv -f UTF-8 -t WINDOWS-1258 test1.txt
>
> Mawenlong
>
> 1234

## 格式转换

由于Linux（Linux）和Windows（Dos）的文件的默认字符格式文件不同，在两个平台间传输文件时需适当的对文件就进行字符转换。

Dos格式转换为Linux格式：dos2unix 选项 文件路径 新文件路径

Linux格式转换为Dos格式：unix2dos 选项 文件路径 新文件路径

选项
含义

-k
保留该文件的mtime时间格式

-n
保留源文件
（默认转换后将源文件删除）
