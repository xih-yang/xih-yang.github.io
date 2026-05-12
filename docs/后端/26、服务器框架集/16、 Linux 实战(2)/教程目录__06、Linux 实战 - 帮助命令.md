# 06、Linux 实战 - 帮助命令
- 来源：https://ddkk.com/zhuanlan/server/linux/5/6.html
- 分类：服务器框架
- 分组：教程目录
## 帮助命令

### man(Manual)

作用：查看联机帮助手册。

执行权限：所有用户。

man命令的快捷键：

快捷键
作用

上箭头
向上移动一行。

下箭头
向下移动一行。

PgUp
向前移动一页。

PgDn
向下移动一页。

g
移动到第一页。

G
移动到最后一页。

q
退出。

/字符串
从当前页向下搜索字符串。

?字符串
从当前页向上搜素字符串。

n
当搜索字符串时，使用n键查找下一个字符串。

N
当搜索字符串时，使用N键反向查询字符串，也就是说，如果使用"/字符串"方式搜索，则N键表示向上搜索字符串，如果使用"?字符串"方式搜索，则N键表示向下搜索字符串。

帮助级别：有的命令不止有一种方面的帮助，被称为不同的帮助级别，例如级别1是指普通用户可以执行的系统命令和可执行文件的帮助。使用"man -f"或者是"whatis"命令可以查询命令的帮助级别。

```java
[root@ddkk.com ~]# whatis ls
ls (1)               - list directory contents   代表ls只有级别1方面的作用。
```

whatis无法使用时，可能是因为数据没有更新，在centos7及以下使用"makewhatis"进行更新，在centos7以上用"mandb"更新。

```java
LS(1)                                         User Commands                                        LS(1)
NAME
       ls - list directory contents
"LS(1)"是指ls命令在级别1方面的作用。
```

```java
USERADD(8)                                    系统管理命令                                    USERADD(8)
名称
       useradd - 创建一个新用户或更新默认新用户信息
#"USERADD(8)"是指useradd命令在级别8方面的作用。
```

### info

info命令的帮助信息是一套完整的资料，每个单独命令的帮助信息只是这套完整资料中的某一个单独小章节，日常man命令就已经够用了。

### help

help只能获取Shell内置命令的帮助，可以用type命令来区分内置命令与外部命令。

例：

```java
[root@ddkk.com ~]# type passwd
passwd 是 /usr/bin/passwd
[root@ddkk.com ~]# type cd
cd 是 shell 内建
```

日常使用的命令有很大一部分是外置命令，且用man和info也可以查看内置命令的帮助。

注：Shell俗称为壳，计算机壳层，是Linux中的命令解释器。

### - -help

绝大多数命令都可以调用"–help"选项来查看帮助，这也是一种获取帮助的方法，例如

```java
[root@ddkk.com ~]# ls --help
用法：ls [选项]... [文件]...
List information about the FILEs (the current directory by default).
Sort entries alphabetically if none of -cftuvSUX nor --sort is specified.
必选参数对长短选项同时适用。
  -a, --all			不隐藏任何以. 开始的项目
  -A, --almost-all		列出除. 及.. 以外的任何项目
      --author			与-l 同时使用时列出每个文件的作者
  -b, --escape			以八进制溢出序列表示不可打印的字符
      --block-size=SIZE      with -l, scale sizes by SIZE when printing them;
                               e.g., '--block-size=M'; see SIZE format below
  -B, --ignore-backups       do not list implied entries ending with ~
  -c                         with -lt: sort by, and show, ctime (time of last
                               modification of file status information);
                               with -l: show ctime and sort by name;
                               otherwise: sort by ctime, newest first
......
```
