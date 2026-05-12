# 26、MySQL 调优 - MySQL 服务器 一次 cpu 100% 问题排查
- 来源：https://ddkk.com/zhuanlan/db/mysql/3/26.html
- 分类：缓存数据库
- 分组：教程目录
## 一. 问题描述

前两天在帮朋友在CentOS 8.5 安装了最新的MySQL 8.0.27，安装方式为编译安装。

才刚上线2天，就发现CPU长期负载100%，而且不管是高峰期还是低峰期，都是100%。

通过FinalShell查看:

通过top命令查看:

输入1查看每一个cpu的使用率

## 二.解决方案

top然后按b，排序，发现最耗CPU的确实是mysql

排名第一的是mysql用户下的xri命令，这个非常可疑。

排名第二的是mysql用户下的mysqld命令，这个是mysql的服务进程，正常的景程。

**接下来我们来排查这个xri到底是什么**

命令:

```java
ps -aux |grep -v grep|grep 1483
```

从输出中可以看到，这个是 /var/tmp/.xri/xri 命令

我们查看xri文件，更新时间是3天前，而且是在/var/tmp目录下，先杀掉

### 2.1 kill进程

kill 掉，cpu负载降下来了

kill掉之后发现文件还在，初步怀疑是种了挖矿病毒

### 2.2 清理定时任务

查看一下我的定时任务

```java
[mysql@CentOS-Mysql ~]$ crontab -l
@daily /var/tmp/.x/secure
@reboot /var/tmp/.x/secure
@monthly /var/tmp/.x/secure
```

我都没设置定时任务，居然有这个定时任务，清空掉

删除掉cron的日志

```java
[root@CentOS-Mysql log]# cd /var/log/
[root@CentOS-Mysql log]# rm cron
rm: remove regular file 'cron'? y
[root@CentOS-Mysql log]# 
```

### 2.3 删除ssh下生成的异常公钥

```java
[mysql@CentOS-Mysql ~]$ cat /home/mysql/.ssh/authorized_keys
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCh047MLLA8ul64R+zVcEezUGtPUhnB+6mSzXoikFgju2orDUBX4K1ve/SW2pMQeQf9ErQojugX43N0iJYtuZUCgtH3A3oLV7zlhbkMuxjfgoUEovBXlAe9sXtLPnbYE999hT0M+OVv2l5/dDgiXs3eG9/BtcuPBEQ4lnH2YdFkckUJmrQQctA1ItFGTNB9fiFu44bH7JjRxSPt97PJPjeEcbEMdJyx4y827NpogeL2QSCfj7II9XdfgaarEOeEF9abY6+1RqDhElhz4ZSQTfoSkl8/8LyBXun7ybdVYxxJdxGznDpNBHyYEcKZFRy9q4mTHBeXMlWiGimSpE7dyhuT rsa-key[mysql@CentOS-Mysql ~]$ 
[mysql@CentOS-Mysql ~]$ 
[mysql@CentOS-Mysql ~]$ cd /home/mysql/.ssh
[mysql@CentOS-Mysql .ssh]$ rm authorized_keys
[mysql@CentOS-Mysql .ssh]$ 
```

### 2.4 清理病 毒文件

```java
[root@CentOS-Mysql log]# cd /var/tmp
[root@CentOS-Mysql tmp]# ll
total 16
drwxrwxrwt.  4 root  root  4096 Jan  8 05:53 ./
drwxr-xr-x. 20 root  root  4096 Nov 25 07:13 ../
drwxrwxr-x   2 mysql mysql 4096 Jan  5 17:00 .x/
drwxr-xr-x   2 mysql mysql 4096 Jan  5 17:00 .xri/
[root@CentOS-Mysql tmp]# rm -rf *
[root@CentOS-Mysql tmp]# 
[root@CentOS-Mysql tmp]# ll
total 16
drwxrwxrwt.  4 root  root  4096 Jan  8 05:53 ./
drwxr-xr-x. 20 root  root  4096 Nov 25 07:13 ../
drwxrwxr-x   2 mysql mysql 4096 Jan  5 17:00 .x/
drwxr-xr-x   2 mysql mysql 4096 Jan  5 17:00 .xri/
[root@CentOS-Mysql tmp]# 
```

居然删除不掉，这么厉害的吗? 直接删除整个tmp目录

```java
[root@CentOS-Mysql var]# cd /var
[root@CentOS-Mysql var]# rm -rf tmp
[root@CentOS-Mysql var]# cd tmp
-bash: cd: tmp: No such file or directory
[root@CentOS-Mysql var]# 
```

全局查找，这次真的没有了

```java
[root@CentOS-Mysql var]# find / -name xri
[root@CentOS-Mysql var]# 
```

### 2.5 待观察

今天把病毒都清理了，监控两天，待反馈
