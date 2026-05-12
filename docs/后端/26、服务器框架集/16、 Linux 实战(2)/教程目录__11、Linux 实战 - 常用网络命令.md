# 11、Linux 实战 - 常用网络命令
- 来源：https://ddkk.com/zhuanlan/server/linux/5/11.html
- 分类：服务器框架
- 分组：教程目录
## 配置IP地址

### 更改配置

- setup工具

使用setup工具可以通过图形界面来配置IP地址。
- 更改配置文件

配置文件：/etc/sysconfig/network-scripts/ifcfg-eth0 #查看目录下对应网卡所对应的IP

### 重启网络服务

刚开始我使用的是视频课程中的命令：

```java
[root@ddkk.com ~]# service network restart
Redirecting to /bin/systemctl restart network.service
Failed to restart network.service: Unit network.service not found.
#系统报错，显示找不到该服务
```

之后经过查询，因为我用的是centos8，视频中用的是centos6，用的命令不对，centos8重启网络服务：

```java
nmcli c reload
```

debian系重启网络服务：

```java
service networking restart
```

其他可以试试：

```java
service network-manager restart
```

注：不同的系统之间有很多差异，甚至查了一个版本也会有很多东西不一样，如果这些命令在你的系统上不适用，多查多找多实践，是最好的学习方法。

#### 重置失败

- IP冲突

局域网内设置的IP重复，重新设置IP地址。
- UUID冲突

UUID和mac号有关，一台设备一个UUID，一般来说是不会重复的，但在虚拟机中建立快照和克隆，信息一样，所以会有重复的mac值。

**解决方法**：

```java
[root@ddkk.com ~]# vi /etc/sysconfig/network-scripts/ifcfg-eth0
#删除MAC地址行
[root@ddkk.com ~]# rm -rf /etc/udev/rules.d/70-persistent-ipoib.rules 
#删除Mac地址和UUID绑定文件
[root@ddkk.com ~]# shutdown -r now
#重启Linux
```

## 查询网络信息

### ifconfig命令

作用：显示或设置网络设备。

ifconfig最主要的命令就是查看IP地址的信息，直接输入ifconfig命令即可。

```java
[root@ddkk.com ~]# ifconfig
ens33: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
       标志                                   最大输出单元
        inet 192.168.19.130  netmask 255.255.255.0  broadcast 192.168.19.255
       IP地址             子网掩码               广播地址
        inet6 fe80::20c:29ff:fe0f:3664  prefixlen 64  scopeid 0x20<link>
       IPv6地址
        ether 00:0c:29:0f:36:64  txqueuelen 1000  (Ethernet)
       Mac地址
        RX packets 35558  bytes 45769460 (43.6 MiB)
        RX errors 0  dropped 0  overruns 0  frame 0
       接受的数据包情况
        TX packets 17283  bytes 1248094 (1.1 MiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
       输出的数据包情况
lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128  scopeid 0x10<host>
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 0  bytes 0 (0.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 0  bytes 0 (0.0 B)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
```

### ip a命令

ipa是ip adress的简写，ip a命令也可以查看ip地址。

```java
[root@ddkk.com ~]# ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host 
       valid_lft forever preferred_lft forever
2: ens33: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    link/ether 00:0c:29:0f:36:64 brd ff:ff:ff:ff:ff:ff
    inet 192.168.19.130/24 brd 192.168.19.255 scope global dynamic noprefixroute ens33
       valid_lft 932sec preferred_lft 932sec
    inet6 fe80::20c:29ff:fe0f:3664/64 scope link noprefixroute 
       valid_lft forever preferred_lft forever
```

### ping命令

ping是常用的网络命令，主要通过ICMP协议进行网络探测，测试网络中主机的通信情况。

作用：向网络主机发送ICMP请求。

命令基本格式：

```java
[root@ddkk.com ~]# ping [选项] IP地址
......
```

选项：

- -b：后面加入广播地址，用于对整个网段进行探测,使用这个选项可以探测到网络中的不同用户。
- -c次数：用于指定ping的次数，Windows中的ping命令一般执行4次，而Linux中如果不设置次数，会一直执行下去，直到中断。
- -s：指定探测包的大小。

```java
[root@ddkk.com ~]# ping www.baidu.com -c 4   对www.baidu.com探测四次
PING www.baidu.com (110.242.68.3) 56(84) bytes of data.
64 bytes from 110.242.68.3 (110.242.68.3): icmp_seq=1 ttl=128 time=26.8 ms
64 bytes from 110.242.68.3 (110.242.68.3): icmp_seq=2 ttl=128 time=29.3 ms
64 bytes from 110.242.68.3 (110.242.68.3): icmp_seq=3 ttl=128 time=28.7 ms
64 bytes from 110.242.68.3 (110.242.68.3): icmp_seq=4 ttl=128 time=32.5 ms
--- www.baidu.com ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3034ms
rtt min/avg/max/mdev = 26.789/29.337/32.492/2.050 ms
```

**ICMP协议**：ICMP协议是一种面向无连接的协议，用于传输出错报告控制信息。它是一个非常重要的协议，它对于网络安全具有极其重要的意义。它属于网络层协议，主要用于在主机与路由器之间传递控制信息，包括报告错误、交换受限控制和状态信息等。

### netstat命令

netstat命令在之前说明[管道符命令](/zhuanlan/server/linux/5/8.html)时已经大概了解过一次，这里再补充几个常用的命令。

```java
#查看本机中开启的端口
[root@ddkk.com ~]# netstat -tulnp
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name    
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN      840/sshd            
tcp6       0      0 :::22                   :::*                    LISTEN      840/sshd            
udp        0      0 127.0.0.1:323           0.0.0.0:*                           782/chronyd         
udp6       0      0 ::1:323                 :::*                                782/chronyd  
#Proto：网络连接的协议，一般就是TCP或是UDP协议
#Recv-Q：表示收到的数据，已经在本地的缓存中，还没有被进程取走。
#Send-Q：表示要发送的数据，对方还没有收到，依然在本地的缓冲中，一般是不具备ACK标志的数据包。
#Local Address：本地的IP地址和端口号。
#Foreign Adress：远程主机的IP地址和端口号。
#State：状态，最常用的一般是LISTEN和EStABLISHED状态，前者表示正在监听，后者表示已经建立连接。
#PID/Program name：程序的PID以及端口号所属的程序。
```

```java
#查看网关
[root@ddkk.com ~]# netstat -rn
Kernel IP routing table
Destination     Gateway         Genmask         Flags   MSS Window  irtt Iface
0.0.0.0         192.168.19.2    0.0.0.0         UG        0 0          0 ens33
192.168.19.0    0.0.0.0         255.255.255.0   U         0 0          0 ens33
#Gateway：网关
```

## 向其他用户发送信息

### write

作用：想指定用户发送信息。

命令格式：

```java
[root@ddkk.com ~]# write u1 pts/3  向远程终端3的u1用户发送信息
hello， i am root.
#输入完之后按“ctrl+D”快捷键保存发送的数据
```

用命令w搜索正在使用的用户：

```java
[root@ddkk.com ~]# w
 03:14:53 up  3:15,  3 users,  load average: 0.01, 0.01, 0.00
USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT
root     pts/0    192.168.19.1     20:41    3:54m  0.11s  0.11s -bash   在远程终端pts/0登录的root
root     pts/2    192.168.19.1     02:44    0.00s  0.03s  0.00s w
u1       pts/3    192.168.19.1     02:45   29:25   0.00s  0.00s -bash
#TTY：终端。
#tty1-6：本地字符终端，用alt+F1-F6来切换。
#tty7：本地图形终端，用ctrl+alt+F7，按住3秒，使用之前要安装图形界面。
#pts/0-255：远程终端6
```

命令格式：

- 和write相似：

```java
[root@ddkk.com ~]# wall 输入命令回车后开始
hello
#ctrl+D结束
```

- 直接输入

```java
[root@ddkk.com ~]# wall "hello"  直接在引号中输入要发送的信息
```

### mail命令

作用：给用户发送邮件以及查看接收的邮件

#### 发送邮件

```java
[root@ddkk.com ~]# mail u1  mail 用户
Subject: hello  输入标题
hello,i am rooot^[[D
.  按"."结束
```

#### 查看邮件

```java
[u1@localhost ~]$ mail  直接使用mail命令查看邮件
Heirloom Mail version 12.5 7/5/10.  Type ? for help.
"/var/spool/mail/u1": 1 message 1 new
>N  1 root                  Tue Jan 11 05:40  21/854   "hello"  "N"表示新邮件
& 1  查看邮件1，下面是邮件信息及具体内容
Message  1:
From root@ddkk.com.localdomain  Tue Jan 11 05:40:24 2022
Return-Path: <root@ddkk.com.localdomain>
From: root <root@ddkk.com.localdomain>
Date: Tue, 11 Jan 2022 03:38:05 -0500
To: u1@localhost.localdomain
Subject: hello
User-Agent: Heirloom mailx 12.5 7/5/10
Content-Type: application/octet-stream
Status: R
[Binary content]
& h  列出邮件
>   1 root                  Tue Jan 11 05:40  21/854   "hello"  N已经没有了，表示已经查看过
& d 1  删除邮件1
& h
No applicable messages
& q  退出
```

查看邮件时的一些功能键：

键位
作用

h
列出邮件标题。

d
删除邮件，"d 2"代表删除第二封邮件。

s
保存邮件，把指定邮件保存成文件，“s 2 /tmp/1.mail”

quit
退出把已经操作过的邮件进行保存。

exit
退出，但是不保存操作。

？
查询帮助。

#### 发送文件内容

```java
[root@ddkk.com ~]# mail -s "hello" root < /root/abc.gz  
#将/root/abc.gz的内容发送给用户u1
#-s：指定邮件标题
```

在写脚本时，有时需要脚本自动发送一些信息给指定用户，把要发送的信息预先写到文件中。
