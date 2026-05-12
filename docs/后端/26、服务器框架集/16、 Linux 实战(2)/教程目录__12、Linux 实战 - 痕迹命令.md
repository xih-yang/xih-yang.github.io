# 12、Linux 实战 - 痕迹命令
- 来源：https://ddkk.com/zhuanlan/server/linux/5/12.html
- 分类：服务器框架
- 分组：教程目录
## 系统痕迹命令

系统中有一些重要的痕迹日志文件，如/var/log/wtmp、/var/run/utmp、/var/log/btmp、/var/log/lastlog等日志文件，如果你用vim打开这些文件，得到的会是乱码，因为这些文件都是系统中比较重要的记录系统痕迹信息的文件，这些文件只能通过对应的命令才能查看。

### w命令

作用：查看当前登录的用户，对应的文件是/var/run/utmp。

信息解释：

```java
[root@ddkk.com ~]# w
 04:14:08 up  4:15,  2 users,  load average: 0.06, 0.01, 0.00
系统时间 开机4小时15分钟 两个用户 前1分钟，5分钟，15分钟的平均负载
USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT
u1       pts/1    192.168.19.1     03:21   21:35   0.01s  0.01s -bash
root     pts/2    192.168.19.1     02:44    0.00s  0.17s  0.01s w
```

注：一般来说负载超过核心数就算高负载。

具体信息解释：

内容
含义

USER
用户。

TTY
登录的终端。

FROM
登录IP。

LOGIN@
登录时间。

IDLE
用户闲置时间。

JCPU
所有进程占用CPU时间。

PCPU
当前进程占用的CPU时间。

WHAT
用户在进行的操作。

### who命令

作用：查看当前正在登录的用户，查看的也是/var/run/utmp日志。

```java
[root@ddkk.com ~]# who
u1       pts/1        2022-01-11 03:21 (192.168.19.1)
root     pts/2        2022-01-11 02:44 (192.168.19.1)
```

### last命令

作用：查看所有登录过的用户信息，包括正在登录的和之前登录过的用户，查看的是/var/log/wtmp日志文件。

```java
[root@ddkk.com ~]# last
u1       pts/1        192.168.19.1     Tue Jan 11 03:21   still logged in
u1       pts/3        192.168.19.1     Tue Jan 11 02:45 - 03:21  (00:35)
u1       pts/3        192.168.19.1     Tue Jan 11 02:44 - 02:45  (00:00)
root     pts/2        192.168.19.1     Tue Jan 11 02:44   still logged in
u1       pts/1        192.168.19.1     Mon Jan 10 21:39 - 03:01  (05:22)
root     pts/0        192.168.19.1     Mon Jan 10 20:41 - 03:37  (06:55)
......
```

### lastlog命令

作用：列出系统中的用户以及最近一次登录的时间。

注：系统中有一些伪用户，用来启动相应的服务，不能登录，也不能删除。

```java
[root@ddkk.com ~]# lastlog
用户名           端口     来自             最后登陆时间
root             pts/2    192.168.19.1     二 1月 11 02:44:04 -0500 2022
bin                                        **从未登录过**
daemon                                     **从未登录过**
adm                                        **从未登录过**
lp                                         **从未登录过**
sync                                       **从未登录过**
......
#上面bin、daemon、adm等就是一些伪用户。
```

### lastb命令

作用：查看错误登录的信息，对应的是/var/log/btmp 痕迹日志。

```java
[root@ddkk.com ~]# lastb
u1       ssh:notty    192.168.19.1     Mon Jan 10 02:07 - 02:07  (00:00)
u1       ssh:notty    192.168.19.1     Mon Jan 10 02:07 - 02:07  (00:00)
root     tty1                          Sat Jan  8 03:39 - 03:39  (00:00)
root     tty1                          Sat Jan  8 03:39 - 03:39  (00:00)
btmp begins Sat Jan  8 03:39:08 2022
```
