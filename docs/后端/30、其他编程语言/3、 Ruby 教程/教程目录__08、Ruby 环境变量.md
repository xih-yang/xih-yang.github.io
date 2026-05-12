# 08、Ruby 环境变量
- 来源：https://ddkk.com/zhuanlan/other/ruby/8.html
- 分类：Ruby 教程
- 分组：教程目录
Ruby 解释器使用下列环境变量来控制它的行为。 ENV 对象包含了所有当前设置的环境变量列表。

变量
描述

DLN_LIBRARY_PATH
动态加载模块搜索的路径

HOME
当没有参数传递给 Dir::chdir 时，要移动到的目录
也用于 File::expand_path 来扩展 "~"

LOGDIR
当没有参数传递给 Dir::chdir 且未设置环境变量 HOME 时，要移动到的目录

PATH
执行子进程的搜索路径，以及在指定 -S 选项后，Ruby 程序的搜索路径。每个路径用冒号分隔（在 DOS 和 Windows 中用分号分隔）

RUBYLIB
库的搜索路径。每个路径用冒号分隔 (在 DOS 和 Windows 中用分号分隔)

RUBYLIB_PREFIX
用于修改 RUBYLIB 搜索路径，通过使用格式 path1;path2 或 path1path2，把库的前缀 path1 替换为 path2

RUBYOPT
传给 Ruby 解释器的命令行选项。在 taint 模式时被忽略 (其中， `$` SAFE 大于 0)

RUBYPATH
指定 -S 选项后，Ruby 程序的搜索路径。优先级高于 PATH。在 taint 模式时被忽略（其中， `$` SAFE 大于 0）

RUBYSHELL
指定执行命令时所使用的 shell。如果未设置该环境变量，则使用 SHELL 或 COMSPEC

Linux / Mac OS 系统下可以使用 env 命令来查看所有环境变量的列表

```ruby
[root@ddkk.com ~]# env
XDG_SESSION_ID=3
HOSTNAME=localhost.localdomain
SELINUX_ROLE_REQUESTED=
TERM=xterm-256color
SHELL=/bin/bash
HISTSIZE=1000
SSH_CLIENT=192.168.0.100 57189 22
SELINUX_USE_CURRENT_RANGE=
SDKMAN_PLATFORM=Linux64
SSH_TTY=/dev/pts/0
SDKMAN_CURRENT_API=https://api.sdkman.io/2
USER=root
SDKMAN_LEGACY_API=https://api.sdkman.io/1
MAIL=/var/spool/mail/root
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/root/bin
PWD=/root
LANG=zh_CN.UTF-8
SDKMAN_VERSION=5.5.11+256
SELINUX_LEVEL_REQUESTED=
HISTCONTROL=ignoredups
SHLVL=1
HOME=/root
LOGNAME=root
SDKMAN_DIR=/root/.sdkman
SSH_CONNECTION=192.168.0.100 57189 192.168.0.118 22
LC_CTYPE=zh_CN.UTF-8
LESSOPEN=||/usr/bin/lesspipe.sh %s
SDKMAN_CANDIDATES_DIR=/root/.sdkman/candidates
XDG_RUNTIME_DIR=/run/user/0
_=/usr/bin/env
```
