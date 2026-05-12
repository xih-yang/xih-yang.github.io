# 06、Linux 实战：其他基础命令
- 来源：https://ddkk.com/zhuanlan/server/linux/2/6.html
- 分类：服务器框架
- 分组：教程目录
## 关机相关命令

## reboot

reboot命令：重启系统

指令格式：reboot

- 可添加“-w”选项：模拟重启(只写入重启相关日志信息)

> 例1：重启系统
>
> [root@ddkk.com ~]# reboot

## shutdown

shutdown命令：

指令格式：shutdown 选项 “提示”

- 选项后可跟时间参数，指定时间段执行该命令

选项
含义

-h
停止系统服务并关机

-r
停止系统服务并重启

-k
仅向系统中所有在线用户发出提示信息

-c
取消系统的所有关机/重启命令

> 例1：设置系统在21：00关机且向用户发出提示信息，最后取消

- CentOS 7.x之前的版本取消关机方法为：Ctrl 和 C
- CentOS7.x之后的版本取消关机方式为：shutdown -c

## sync

sync命令：将内存中内存强制刷新到磁盘中

指令格式：sync

- 普通用户执行该命令，仅刷新本身相关的内存数据
- root用户执行该命令，则刷新整个系统中内存数据

> 例1：将系统内存中所有数据刷新到磁盘中
>
> [root@ddkk.com ~]# sync

- reboot、shutdown和halt命令在关机前均隐式调用该命令

-执行 `init 0`和`halt`和`poweroff`等命令也可关闭系统(所有关机命令底层均通过“systemctl”命令实现)

## 帮助相关命令

## help

help命令：返回指定命令的选项和该选项简介

指令格式：命令 --help

> 例1：查看shutdown命令相关选项
>
> [root@ddkk.com ~]# shutdown --help
>
> shutdown [OPTIONS...] [TIME] [WALL...]
>
> Shut down the system.
>
> --help Show this help
>
> -H --halt Halt the machine
>
> -P --poweroff Power-off the machine
>
> -r --reboot Reboot the machine
>
> -h Equivalent to --poweroff, overridden by --halt
>
> -k Don't halt/power-off/reboot, just send warnings
>
> --no-wall Don't send wall message before halt/power-off/reboot
>
> -c Cancel a pending shutdown

## man

man命令：打开指定命令的帮助文档(手册)

指令格式：man 命令

- 按q：退出帮文档
- 按/：检索帮助文档中的关键词(不区分大小写)

> 例1：打开date命令的帮助文档

- 帮助文档中的组成内容主要由以下字段构成：

字段
含义

NAME
命令名称和名称说明

SYNOPSIS
命令语法简介

DESCRIPTION
命令完整说明
(主要查看内容)

EXAMPLES
使用实例

OVERVIEW
命令概述

DEFAULTS
默认配置说明

OPTIONS
可用选项说明

ENVIRONMENT
环境变量

FILES
命令使用、参考或链接到的文件

COPYRIGHT
版权声明

AUTHOR
作者

SEE ALSO
该命令相关的其他说明

- 属性代号有以下9种：

属性代号
含义

1
用户在Shell环境种可调用的命令/执行文件

2
系统内核可调用的函数和程序等

3
常用函数和函数库
(主要为C语言函数库)

4
设备文件说明
(通常位于/dev目录下)

5
配置文件或文件格式

6
游戏

7
惯例和协议等

8
系统管理员才可调用的命令/执行文件

9
内核相关文件

## mandb

mandb命令：创建/更新帮助文档的数据库

指令格式：mandb

- 该命令仅root用户可执行(CentOS 7之前版本是makewhatis命令)
- whatis和apropos命令需在该数据库创建的前提下才可使用

> 例1：创建/更新帮助文档的数据库(第一次执行该命令，需较长时间遍历相关文件)
>
> [root@ddkk.com ~]# mandb
>
> Processing manual pages under /usr/share/man/overrides...
>
> Updating index cache for path `/usr/share/man/overrides/man8'. Wait...done.
>
> Checking for stray cats under /usr/share/man/overrides...
>
> Checking for stray cats under /var/cache/man/overrides...
>
> ...
>
> ...
>
> ...
>
> 119 man subdirectories contained newer manual pages.
>
> 7768 manual pages were added.
>
> 0stray cats were added.
>
> 0old database entries were purged.

## whatis

whatis命令：返回指定命令的功能

指令格式：whatis 命令

- 效果等效于man -f

> 例1：查看date命令的功能
>
> [root@ddkk.com ~]# whatis date
>
> date (1) - print or set the system date and time
>
> date (1p) - write the date and time

## apropos

apropos命令：返回在帮助文档检索关键词的结果

指令格式：apropos 关键词

- 效果等效于man -k

> 例1：在帮助文档种检索“firewalld”关键词
>
> [root@ddkk.com ~]# apropos firewalld
>
> firewall-cmd (1) - firewalld command line client
>
> firewall-offline-cmd (1) - firewalld offline command line client
>
> firewalld (1) - Dynamic Firewall Manager
>
> firewalld.conf (5) - firewalld configuration file
>
> firewalld.dbus (5) - firewalld D-Bus interface description
>
> firewalld.direct (5) - firewalld direct configuration file
>
> firewalld.helper (5) - firewalld helper configuration files
>
> firewalld.icmptype (5) - firewalld icmptype configuration files
>
> firewalld.ipset (5) - firewalld ipset configuration files
>
> firewalld.lockdown-whitelist (5) - firewalld lockdown whitelist configuration file
>
> firewalld.richlanguage (5) - Rich Language Documentation
>
> firewalld.service (5) - firewalld service configuration files
>
> firewalld.zone (5) - firewalld zone configuration files
>
> firewalld.zones (5) - firewalld zones

## 其他命令

## cal

cal命令：返回月历

指令格式：cal 选项

- 若不指定选项，则隐式添加选项-1

选项
含义

-1
仅返回当前月的月历

-3
返回前后3个月的月历

-y
指定年
(若仅指定年,则返回该年的所有月历)

-m
指定月

> 例1：分别输出本月月历和前后3个月的月历

## clear

clear命令：清屏终端

指令格式：clear

- 等效于Ctrl和L

## fc

fc命令：通过Vi编辑器修改指定历史命令，并在保存退出后执行

指令格式：fc 选项

选项
含义

-N
指定第N条历史命令
(默认为第1条)

-l N
返回最近N条历史命令
(默认仅返回最近10条)
