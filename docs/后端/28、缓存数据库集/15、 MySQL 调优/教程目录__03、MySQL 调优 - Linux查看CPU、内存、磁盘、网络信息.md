# 03、MySQL 调优 - Linux查看CPU、内存、磁盘、网络信息
- 来源：https://ddkk.com/zhuanlan/db/mysql/3/3.html
- 分类：缓存数据库
- 分组：教程目录
备注:测试数据库版本为MySQL 8.0

## 一.查看CPU信息

总核数= 物理CPU个数 X 每颗物理CPU的核数

总逻辑CPU数 = 物理CPU个数 X 每颗物理CPU的核数 X 超线程数

### 1.1 查看物理CPU个数

代码:

```java
cat /proc/cpuinfo| grep "physical id"| sort| uniq| wc -l
```

测试记录:

```java
[root@mydb ~]# cat /proc/cpuinfo| grep "physical id"| sort| uniq| wc -l
1
```

### 1.2 查看每个物理CPU中core的个数(即核数)

代码:

```java
cat /proc/cpuinfo| grep "cpu cores"| uniq
```

测试记录:

```java
[root@mydb ~]# cat /proc/cpuinfo| grep "cpu cores"| uniq
cpu cores       : 8
```

### 1.3 查看逻辑CPU的个数

代码:

```java
cat /proc/cpuinfo| grep "processor"| wc -l
```

测试记录:

```java
[root@mydb ~]# cat /proc/cpuinfo| grep "processor"| wc -l
16
```

### 1.4 查看CPU信息（型号）

代码:

```java
cat /proc/cpuinfo | grep name | cut -f2 -d: | uniq -c
```

测试记录:

```java
[root@mydb ~]# cat /proc/cpuinfo | grep name | cut -f2 -d: | uniq -c
     16  Intel(R) Xeon(R) Platinum 8163 CPU @ 2.50GHz
```

### 1.5 查看CPU的负载

一般使用top命令来看CPU的负载:

```java
[root@mydb ~]# top
top - 13:56:35 up 1012 days,  2:52,  2 users,  load average: 0.44, 0.74, 0.78
Tasks: 662 total,   1 running, 660 sleeping,   0 stopped,   1 zombie
Cpu(s):  7.9%us,  1.4%sy,  0.0%ni, 86.9%id,  3.7%wa,  0.0%hi,  0.0%si,  0.0%st
Mem:  33013360k total, 32320120k used,   693240k free,     8360k buffers
Swap: 16777212k total,  2047684k used, 14729528k free, 26327424k cached
  PID USER      PR  NI  VIRT  RES  SHR S %CPU %MEM    TIME+  COMMAND                                                                                                                                     
21508 oracle    20   0 18.1g 329m 313m S  5.8  1.0   6549:46 oracle                                                                                                                                       
22979 oracle    20   0 18.0g 345m 342m S  3.9  1.1   0:03.94 oracle                                                                                                                                       
28118 root      20   0 17464 1688  896 R  3.9  0.0   0:00.02 top                                                                                                                                          
 4150 oracle    20   0  607m  34m 3260 S  1.9  0.1   5422:14 extract                                                                                                                                      
16032 oracle    20   0  522m  34m 3000 S  1.9  0.1 451:50.61 replicat                                                                                                                                     
20408 oracle    20   0 5783m 558m 1620 S  1.9  1.7   1064:12 java                                                                                                                                         
21529 oracle    20   0 18.0g 1.1g 1.1g S  1.9  3.4   2042:26 oracle                                                                                                                                       
22704 oracle    20   0  473m 8300 1724 S  1.9  0.0 106:03.15 server                                                                                                                                       
    1 root      20   0 21400  372  176 S  0.0  0.0  30:04.17 init                                                                                                                                         
    2 root      20   0     0    0    0 S  0.0  0.0   0:02.35 kthreadd                                                                                                                                     
    3 root      RT   0     0    0    0 S  0.0  0.0  16:36.78 migration/0 
```

load average: 即任务队列的平均长度,如果这个数除以逻辑CPU的数量，结果高于5的时候就表明系统在超负荷运转了。

## 二.查看内存及交换空间

### 2.1 /proc/meminfo

命令:

```java
cat /proc/meminfo
```

测试记录:

```java
[root@mydb ~]# cat /proc/meminfo
MemTotal:       33013360 kB
MemFree:          512656 kB
Buffers:            9976 kB
Cached:         26476312 kB
SwapCached:       162928 kB
Active:         23151748 kB
Inactive:        6444968 kB
Active(anon):   18516392 kB
Inactive(anon):  2012552 kB
Active(file):    4635356 kB
Inactive(file):  4432416 kB
Unevictable:           0 kB
Mlocked:               0 kB
SwapTotal:      16777212 kB
SwapFree:       14729528 kB
Dirty:               204 kB
Writeback:             0 kB
AnonPages:       2987664 kB
Mapped:         17342640 kB
Shmem:          17418484 kB
Slab:             322072 kB
SReclaimable:     232712 kB
SUnreclaim:        89360 kB
KernelStack:       17968 kB
PageTables:      2293392 kB
NFS_Unstable:          0 kB
Bounce:                0 kB
WritebackTmp:          0 kB
CommitLimit:    33283892 kB
Committed_AS:   28046004 kB
VmallocTotal:   34359738367 kB
VmallocUsed:       69828 kB
VmallocChunk:   34359658920 kB
HardwareCorrupted:     0 kB
AnonHugePages:    618496 kB
HugePages_Total:       0
HugePages_Free:        0
HugePages_Rsvd:        0
HugePages_Surp:        0
Hugepagesize:       2048 kB
DirectMap4k:        6016 kB
DirectMap2M:     2091008 kB
DirectMap1G:    31457280 kB
```

### 2.2 free 命令

命令:

```java
free 
free -m
free -g
```

测试记录:

```java
[root@mydb ~]# free
             total       used       free     shared    buffers     cached
Mem:      33013360   32748708     264652   17418484       4740   26755832
-/+ buffers/cache:    5988136   27025224
Swap:     16777212    2047684   14729528
[root@mydb ~]# 
[root@mydb ~]# free -m
             total       used       free     shared    buffers     cached
Mem:         32239      31980        258      17010          4      26128
-/+ buffers/cache:       5847      26392
Swap:        16383       1999      14384
[root@mydb ~]# 
[root@mydb ~]# free -g
             total       used       free     shared    buffers     cached
Mem:            31         31          0         16          0         25
-/+ buffers/cache:          5         25
Swap:           15          1         14
```

**buffer和cache的区别**

buffer（缓冲）是为了提高内存和硬盘（或其他I/O设备）之间的数据交换的速度而设计的

cache（缓存）是从CPU角度考虑，是为了提高cpu和内存之间的数据交换速度而设计的

**free命令解释:**

**1、** used=total-free即total=used+free；

**2、** 实际内存占用：used-buffers-cached即total-free-buffers-cached；

**3、** 实际可用内存：buffers+cached+free；

下面以上面的free -m命令的输出来解释

**1、** 第1行Mem数据：；

total 内存总数: 32239

used 已经使用的内存数: 31980

free 空闲的内存数: 258

shared 被共享使用的物理内存: 17010

buffers Buffer Cache内存数: 4

cached Page Cache内存数: 26128
**2、** -/+buffers/cache：；

-buffers/cache 的内存数：5847 (等于第1行的 used - buffers - cached)

+buffers/cache 的内存数: 26392 (等于第1行的 free + buffers + cached)

可见-buffers/cache反映的是被程序实实在在吃掉的内存，而+buffers/cache反映的是可以挪用的内存总数。
**3、** 交换分区SWAP；

可以看到此例由于cache太多，导致使用了1999M swap空间。

### 2.3 释放cache

释放方法有三种（系统默认值是0，释放之后你可以再改回0值）：

Tofree pagecache: echo 1 > /proc/sys/vm/drop_caches

Tofree dentries and inodes: echo 2 > /proc/sys/vm/drop_caches

Tofree pagecache, dentries and inodes: echo 3 > /proc/sys/vm/drop_caches

## 三.磁盘信息

### 3.1 fdisk命令

fdisk命令是看该机器下有多少的磁盘

命令:

```java
fdisk -l
```

测试记录:

```java
[root@mydb ~]# fdisk -l
Disk /dev/vda: 214.7 GB, 214748364800 bytes
255 heads, 63 sectors/track, 26108 cylinders
Units = cylinders of 16065 * 512 = 8225280 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disk identifier: 0x00020f78
   Device Boot      Start         End      Blocks   Id  System
/dev/vda1   *           1       26109   209713152   83  Linux
```

fdisk 命令可以看到盼复以及磁盘的容量。

如果fdisk的输出 有HDD特有的关键字，比如：”heads”（磁头），”track”（磁道）和”cylinders”（柱面），那么就是HDD，否则就是SSD(固态硬盘)。

### 3.2 查看磁盘的性能

命令:

```java
iostat -x 10
```

测试记录:

```java
[root@mydb2~]# iostat -x 10
Linux 3.10.0-1127.8.2.el7.x86_64 (mydb2)      05/07/2021      _x86_64_        (2 CPU)
avg-cpu:  %user   %nice %system %iowait  %steal   %idle
           5.00    0.00    2.39    0.89    0.00   91.72
Device:         rrqm/s   wrqm/s     r/s     w/s    rkB/s    wkB/s avgrq-sz avgqu-sz   await r_await w_await  svctm  %util
vda               0.02     7.48    1.83   17.27   148.01   326.21    49.66     0.06    3.66   21.90    1.73   0.87   1.67
avg-cpu:  %user   %nice %system %iowait  %steal   %idle
          51.78    0.00   13.98    0.10    0.00   34.14
Device:         rrqm/s   wrqm/s     r/s     w/s    rkB/s    wkB/s avgrq-sz avgqu-sz   await r_await w_await  svctm  %util
vda               0.00     4.60    1.30    3.10    80.80    49.60    59.27     0.01    1.84    2.92    1.39   1.30   0.57
avg-cpu:  %user   %nice %system %iowait  %steal   %idle
          47.44    0.00   12.21    1.32    0.00   39.03
Device:         rrqm/s   wrqm/s     r/s     w/s    rkB/s    wkB/s avgrq-sz avgqu-sz   await r_await w_await  svctm  %util
vda               0.00    12.50    1.90   41.40   134.40  1204.80    61.86     0.06    1.52    2.00    1.50   0.53   2.29
```

## 四.网络资源

### 4.1 查看网卡基本信息

命令:

```java
ip addr
ifconfig
```

测试记录:

```java
[root@mydb ~]# ip addr
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN 
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP qlen 1000
    link/ether 00:16:3e:0a:60:00 brd ff:ff:ff:ff:ff:ff
    inet 172.18.1.6/20 brd 172.18.15.255 scope global eth0
[root@mydb ~]# 
[root@mydb ~]# ifconfig
eth0      Linkencap:Ethernet  HWaddr 00:16:3E:0A:60:00  
          inet addr:172.18.1.6  Bcast:172.18.15.255  Mask:255.255.240.0
          UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
          RX packets:137515926477 errors:0 dropped:0 overruns:0 frame:0
          TX packets:79878398077 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:1000 
          RX bytes:161443204416339 (146.8 TiB)  TX bytes:425205658311024 (386.7 TiB)
lo        Linkencap:Local Loopback  
          inet addr:127.0.0.1  Mask:255.0.0.0
          UP LOOPBACK RUNNING  MTU:65536  Metric:1
          RX packets:10063583513 errors:0 dropped:0 overruns:0 frame:0
          TX packets:10063583513 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:0 
          RX bytes:6331958540844 (5.7 TiB)  TX bytes:6331958540844 (5.7 TiB)
```

**下面我们来看看ifconfig eth0这个网卡的输出信息:**

第一行：连接类型：Ethernet（以太网）HWaddr（硬件mac地址）

第二行：网卡的IP地址、子网、掩码

第三行：UP（代表网卡开启状态）RUNNING（代表网卡的网线被接上）MULTICAST（支持组播）MTU:1500（最大传输单元）：1500字节

第四、五行：接收、发送数据包情况统计

第七行：接收、发送数据字节数统计信息。

RX和TX代表什么?

transmitter 发送

receiver 接收

X为了好读

### 4.2 查看网卡接口的速度

命令:

```java
ethtool ens192
```

测试记录:

```java
[root@hp1 ~]# ethtool ens192
Settings for ens192:
        Supported ports: [ TP ]
        Supported link modes:   1000baseT/Full 
                                10000baseT/Full 
        Supported pause frame use: No
        Supports auto-negotiation: No
        Supported FEC modes: Not reported
        Advertised link modes:  Not reported
        Advertised pause frame use: No
        Advertised auto-negotiation: No
        Advertised FEC modes: Not reported
        Speed: 10000Mb/s
        Duplex: Full
        Port: Twisted Pair
        PHYAD: 0
        Transceiver: internal
        Auto-negotiation: off
        MDI-X: Unknown
        Supports Wake-on: uag
        Wake-on: d
        Linkdetected: yes
```

从上面可以看到网卡的速度是 10000Mb/s

### 4.3 网卡流量监控工具 iptraf

iptraf 是一个比较好的监控网卡流量的工具。

yum安装:

```java
yum install -y iptraf
```

直接输入iptraf-ng ，第一项就是流量监控

界面分上下两部分，上部分可详细显示哪个与之相连的IP，发了多少包(bytes)，即时流量是多少，下部分，可以显示udp等信息。

1byte=8bit,可以推算网卡是否满负荷运行。

**也可以借助本文第五章节的dstat命令来查看网络的负载**

### 4.4 netstat查看网络连接

命令:

```java
netstat -an  表示查看所有网络连接
```

测试记录:

```java
[root@hp1 ~]# netstat -an
Active Internet connections (servers and established)
Proto Recv-Q Send-Q Local Address           Foreign Address         State      
tcp        0      0 0.0.0.0:7191            0.0.0.0:*               LISTEN     
tcp        0      0 10.31.1.123:8888        0.0.0.0:*               LISTEN     
tcp        0      0 10.31.1.123:8088        0.0.0.0:*               LISTEN     
tcp        0      0 127.0.0.1:19001         0.0.0.0:*               LISTEN     
tcp        0      0 10.31.1.123:8091        0.0.0.0:*               LISTEN     
tcp        0      0 0.0.0.0:9083            0.0.0.0:*               LISTEN     
tcp        0      0 0.0.0.0:25020           0.0.0.0:*               LISTEN     
tcp        0      0 10.31.1.123:8033        0.0.0.0:*               LISTEN     
tcp        0      0 10.31.1.123:10020       0.0.0.0:*               LISTEN     
tcp        0      0 127.0.0.1:46053         0.0.0.0:*               LISTEN     
tcp        0      0 0.0.0.0:2181            0.0.0.0:*               LISTEN     
tcp        0      0 0.0.0.0:18088           0.0.0.0:*               LISTEN     
tcp        0      0 10.31.1.123:9864        0.0.0.0:*               LISTEN     
tcp        0      0 10.31.1.123:9000        0.0.0.0:*               LISTEN     
tcp        0      0 127.0.0.1:9001          0.0.0.0:*               LISTEN     
tcp        0      0 0.0.0.0:9994            0.0.0.0:*               LISTEN     
tcp        0      0 10.31.1.123:9866        0.0.0.0:*               LISTEN     
tcp        0      0 10.31.1.123:9995        0.0.0.0:*               LISTEN     
-- snip --
```

### 4.5 网络测试命令

代码:

```java
-- 测试是否可以ping通
ping IP或域名
-- 测试远程的端口是否开通
telnet [域名或IP] [端口]
-- 查看路由
traceroute [选项] IP或域名
-- 网络抓包命令
tcpdump 网络抓包命令
```

测试记录:

```java
[root@hp1 ~]# ping www.baidu.com
PING www.a.shifen.com (14.215.177.39) 56(84) bytes of data.
64 bytes from 14.215.177.39 (14.215.177.39): icmp_seq=1 ttl=56 time=7.10 ms
64 bytes from 14.215.177.39 (14.215.177.39): icmp_seq=2 ttl=56 time=7.28 ms
64 bytes from 14.215.177.39 (14.215.177.39): icmp_seq=3 ttl=56 time=7.06 ms
^C
--- www.a.shifen.com ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2002ms
rtt min/avg/max/mdev = 7.064/7.153/7.287/0.096 ms
[root@hp1 ~]# telnet 10.31.1.124 22
Trying 10.31.1.124...
Connected to 10.31.1.124.
Escape character is '^]'.
SSH-2.0-OpenSSH_7.4
Protocol mismatch.
Connection closed by foreign host.
[root@hp1 ~]# 
[root@hp1 ~]# traceroute www.baidu.com
traceroute to www.baidu.com (14.215.177.39), 30 hops max, 60 byte packets
 1  172.30.210.254 (172.30.210.254)  0.301 ms  0.237 ms  0.199 ms
 2  100.64.0.1 (100.64.0.1)  2.714 ms  2.895 ms  2.954 ms
 3  25.187.37.59.broad.dg.gd.dynamic.163data.com.cn (59.37.187.25)  4.206 ms  4.785 ms  4.651 ms
 4  113.106.34.253 (113.106.34.253)  19.535 ms 219.133.207.85 (219.133.207.85)  6.580 ms 113.106.35.1 (113.106.35.1)  6.335 ms
 5  * * 113.96.5.114 (113.96.5.114)  6.685 ms
 6  113.96.4.205 (113.96.4.205)  14.035 ms 90.96.135.219.broad.fs.gd.dynamic.163data.com.cn (219.135.96.90)  7.628 ms 113.96.4.205 (113.96.4.205)  12.718 ms
 7  121.14.67.146 (121.14.67.146)  7.316 ms 102.96.135.219.broad.fs.gd.dynamic.163data.com.cn (219.135.96.102)  8.512 ms  8.442 ms
 8  * * 14.215.32.118 (14.215.32.118)  8.077 ms
[root@hp1 ~]# tcpdump -i ens192     
tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
listening on ens192, link-type EN10MB (Ethernet), capture size 262144 bytes
17:57:10.443395 IP hp1.ssh > sky-20170418ypl.hengxinyongli.com.57374: Flags [P.], seq 1516359829:1516360069, ack 781907098, win 301, length 240
17:57:10.443605 IP hp1.46354 > hp2.inovaport1: Flags [P.], seq 2963436253:2963436489, ack 695770812, win 229, options [nop,nop,TS val 2169683162 ecr 2169683028], length 236
17:57:10.443856 IP sky-20170418ypl.hengxinyongli.com.57374 > hp1.ssh: Flags [.], ack 240, win 16300, length 0
17:57:10.443941 IP hp2.inovaport1 > hp1.46354: Flags [P.], seq 1:60, ack 236, win 1432, options [nop,nop,TS val 2169683229 ecr 2169683162], length 59
17:57:10.443968 IP hp1.46354 > hp2.inovaport1: Flags [.], ack 60, win 229, options [nop,nop,TS val 2169683163 ecr 2169683229], length 0
17:57:10.444600 IP hp1.49461 > iz94vvoeumtz.hengxinyongli.com.domain: 47748+ PTR? 157.1.30.172.in-addr.arpa. (43)
17:57:10.450673 IP iz94vvoeumtz.hengxinyongli.com.domain > hp1.49461: 47748* 1/0/0 PTR sky-20170418ypl.hengxinyongli.com. (90)
17:57:10.451120 IP hp1.33670 > iz94vvoeumtz.hengxinyongli.com.domain: 6254+ PTR? 2.0.18.172.in-addr.arpa. (41)
17:57:10.451230 IP hp1.ssh > sky-20170418ypl.hengxinyongli.com.57374: Flags [P.], seq 240:1040, ack 1, win 301, length 800
17:57:10.461234 IP iz94vvoeumtz.hengxinyongli.com.domain > hp1.33670: 6254* 1/0/0 PTR iz94vvoeumtz.hengxinyongli.com. (85)
17:57:10.461728 IP hp1.ssh > sky-20170418ypl.hengxinyongli.com.57374: Flags [P.], seq 1040:1728, ack 1, win 301, length 688
17:57:10.461885 IP hp1.ssh > sky-20170418ypl.hengxinyongli.com.57374: Flags [P.], seq 1728:1936, ack 1, win 301, length 208
17:57:10.462002 IP hp1.ssh > sky-20170418ypl.hengxinyongli.com.57374: Flags [P.], seq 1936:2144, ack 1, win 301, length 208
17:57:10.462050 IP sky-20170418ypl.hengxinyongli.com.57374 > hp1.ssh: Flags [.], ack 1728, win 16560, length 0
-- snip --
```

### 4.6 查看是否丢包

MTR是Linux平台上一款非常好用的网络诊断工具，或者说网络连通性判断工具，集成了ping，traceroute，nslookup的功能，用于诊断网络状态很好用，可以用来判断服务器是否丢包。

代码:

```java
 mtr -n --report www.baidu.com
```

测试记录:

```java
[root@hp1 ~]# mtr -n --report www.baidu.com
Start: Fri May  7 18:00:20 2021
HOST: hp1                         Loss%   Snt   Last   Avg  Best  Wrst StDev
  1.|-- 172.30.210.254             0.0%    10    0.4   0.4   0.3   0.4   0.0
  2.|-- 100.64.0.1                 0.0%    10    2.0   2.5   1.9   2.8   0.0
  3.|-- 59.37.187.25               0.0%    10   19.9  16.2   6.2  24.9   5.8
  4.|-- 113.106.34.249             0.0%    10    5.4   6.0   5.0   8.4   0.7
  5.|-- ???                       100.0    10    0.0   0.0   0.0   0.0   0.0
  6.|-- 113.96.4.209               0.0%    10   12.2   9.6   6.3  12.7   2.4
  7.|-- 219.135.96.102            30.0%    10    7.4  16.6   7.3  66.5  22.1
  8.|-- 14.29.121.198              0.0%    10    7.1   7.3   7.1   7.7   0.0
  9.|-- ???                       100.0    10    0.0   0.0   0.0   0.0   0.0
 10.|-- ???                       100.0    10    0.0   0.0   0.0   0.0   0.0
 11.|-- 14.215.177.39              0.0%    10    7.2   7.2   6.6   7.5   0.0
[root@hp1 ~]# 
```

**其中loss%为丢包率**

## 五. 常用的监控工具

### 5.1 全能的监控工具dstat

一个命令可以看到CPU、内存以及网络的使用情况。

yum安装:

```java
yum install -y dstat
```

dstat 5 10 表示每5秒显示一次，一共显示10条。

测试记录:

```java
[root@hp1 src]# dstat
You did not select any stats, using -cdngy by default.
----total-cpu-usage---- -dsk/total- -net/total- ---paging-- ---system--
usr sys idl wai hiq siq| read  writ| recv  send|  in   out | int   csw 
  3   1  96   0   0   0|  51k  282k|   0     0 |   0     0 |1790  2815 
  5   1  95   0   0   0|   0     0 |  40k   17k|   0     0 |1963  2810 
  2   1  98   0   0   0|   0     0 |  32k   13k|   0     0 |1662  2541 
  1   1  98   0   0   0|   0   113k|9128B   12k|   0     0 |1632  2648 
  1   1  98   0   0   0|   0    20k|  13k   14k|   0     0 |1804  2761 
  1   1  98   0   0   0|   0     0 |9806B   13k|   0     0 |1643  2596 
  4   1  96   0   0   0|   0     0 |9067B   12k|   0     0 |2038  3184 
  1   1  98   0   0   0|   0     0 |  11k   13k|   0     0 |1786  2718
```

cpu：hiq、siq分别为硬中断和软中断次数。

system：int、csw分别为系统的中断次数（interrupt）和上下文切换（context switch）。

其它的都比较好理解。

**常用选项:**

-c：显示CPU系统占用，用户占用，空闲，等待，中断，软件中断等信息。

-C：当有多个CPU时候，此参数可按需分别显示cpu状态，例：-C 0,1 是显示cpu0和cpu1的信息。

-d：显示磁盘读写数据大小。

-Dhda,total：include hda and total。

-n：显示网络状态。

-Neth1,total：有多块网卡时，指定要显示的网卡。

-l：显示系统负载情况。

-m：显示内存使用情况。

-g：显示页面使用情况。

-p：显示进程状态。

-s：显示交换分区使用情况。

-S：类似D/N。

-r：I/O请求情况。

-y：系统状态。

–ipc：显示ipc消息队列，信号等信息。

–socket：用来显示tcp udp端口状态。

-a：此为默认选项，等同于-cdngy。

-v：等同于 -pmgdsc -D total。

–output 文件：此选项也比较有用，可以把状态信息以csv的格式重定向到指定的文件中，以便日后查看。

### 5.2 top命令

top命令可以查看CPU、内存及交换空间的使用情况

```java
[root@mydb ~]# top
top - 13:56:35 up 1012 days,  2:52,  2 users,  load average: 0.44, 0.74, 0.78
Tasks: 662 total,   1 running, 660 sleeping,   0 stopped,   1 zombie
Cpu(s):  7.9%us,  1.4%sy,  0.0%ni, 86.9%id,  3.7%wa,  0.0%hi,  0.0%si,  0.0%st
Mem:  33013360k total, 32320120k used,   693240k free,     8360k buffers
Swap: 16777212k total,  2047684k used, 14729528k free, 26327424k cached
  PID USER      PR  NI  VIRT  RES  SHR S %CPU %MEM    TIME+  COMMAND                                                                                                                                     
21508 oracle    20   0 18.1g 329m 313m S  5.8  1.0   6549:46 oracle                                                                                                                                       
22979 oracle    20   0 18.0g 345m 342m S  3.9  1.1   0:03.94 oracle                                                                                                                                       
28118 root      20   0 17464 1688  896 R  3.9  0.0   0:00.02 top                                                                                                                                          
 4150 oracle    20   0  607m  34m 3260 S  1.9  0.1   5422:14 extract                                                                                                                                      
16032 oracle    20   0  522m  34m 3000 S  1.9  0.1 451:50.61 replicat                                                                                                                                     
20408 oracle    20   0 5783m 558m 1620 S  1.9  1.7   1064:12 java                                                                                                                                         
21529 oracle    20   0 18.0g 1.1g 1.1g S  1.9  3.4   2042:26 oracle                                                                                                                                       
22704 oracle    20   0  473m 8300 1724 S  1.9  0.0 106:03.15 server                                                                                                                                       
    1 root      20   0 21400  372  176 S  0.0  0.0  30:04.17 init                                                                                                                                         
    2 root      20   0     0    0    0 S  0.0  0.0   0:02.35 kthreadd                                                                                                                                     
    3 root      RT   0     0    0    0 S  0.0  0.0  16:36.78 migration/0 
```

**下面我们来解释下top命令的输出:**

第一行：系统运行时间和平均负载

当前时间、系统已运行时间、当前登录用户的数量、最近1、5、15分钟内的平均负载

load average: 即任务队列的平均长度,如果这个数除以逻辑CPU的数量，结果高于5的时候就表明系统在超负荷运转了。

第二行：任务

任务的总数、运行中(running)的任务、休眠(sleeping)中的任务、停止(stopped)的任务、僵尸状态(zombie)的任务

第三行：cpu状态

字段
字段释义

us
user： 运行(未调整优先级的) 用户进程的CPU时间

sy
system: 运行内核进程的CPU时间

ni
niced：运行已调整优先级的用户进程的CPU时间

id
idle:空闲时间

wa
IO wait: 用于等待IO完成的CPU时间

hi
处理硬件中断的CPU时间

si
处理软件中断的CPU时间

st
这个虚拟机被hypervisor偷去的CPU时间（译注：如果当前处于一个hypervisor下的vm，实际上hypervisor也是要消耗一部分CPU处理时间的）

第四行：内存

全部可用内存、已使用内存、空闲内存、缓冲内存

第五行：swap

全部、已使用、空闲和缓冲交换空间

第七行至N行：各进程任务的的状态监控

字段
字段释义

PID
进程ID，进程的唯一标识符

USER
进程所有者的实际用户名

PR
进程的调度优先级。这个字段的一些值是’rt’。这意味这这些进程运行在实时态。

NI
进程的nice值（优先级）。越小的值意味着越高的优先级。负值表示高优先级，正值表示低优先级

VIRT
virtual memory usage 虚拟内存,进程使用的虚拟内存。进程使用的虚拟内存总量，单位kb VIRT=SWAP+RES
1、进程“需要的”虚拟内存大小，包括进程使用的库、代码、数据等
2、假如进程申请100m的内存，但实际只使用了10m，那么它会增长100m，而不是实际的使用量

RES
resident memory usage 常驻内存,驻留内存大小。驻留内存是任务使用的非交换物理内存大小。进程使用的、未被换出的物理内存大小，单位kb。RES=CODE+DATA
1、进程当前使用的内存大小，但不包括swap out
2、包含其他进程的共享
3、如果申请100m的内存，实际使用10m，它只增长10m，与VIRT相反
4、关于库占用内存的情况，它只统计加载的库文件所占内存大小

SHR
SHR：shared memory 共享内存
1、除了自身进程的共享内存，也包括其他进程的共享内存
2、虽然进程只使用了几个共享库的函数，但它包含了整个共享库的大小
3、计算某个进程所占的物理内存大小公式：RES – SHR
4、swap out后，它将会降下来

S
这个是进程的状态。它有以下不同的值:
D - 不可中断的睡眠态。
R – 运行态
S – 睡眠态
T – 被跟踪或已停止
Z – 僵尸态

%CPU
自从上一次更新时到现在任务所使用的CPU时间百分比。%CPU显示的是进程占用一个核的百分比，而不是整个cpu（N核）的百分比，有时候可能大于100，那是因为该进程启用了多线程占用了多个核心，所以有时候我们看该值得时候会超过100%，但不会超过总核数*100

%MEM
进程使用的可用物理内存百分比

TIME+
任务启动后到现在所使用的全部CPU时间，精确到百分之一秒
2:32.45代表多长时间啊
从右到左分别是百分之一秒，十分之一秒，秒，十秒，分钟
这个就是2分钟，30秒，2秒，十分之4秒，百分之5秒，是按位来计算的。

COMMAND
运行进程所使用的命令。进程名称（命令名/命令行）

### 5.3 sar命令

yum安装sar命令:

```java
yum install -y sysstat 
```

sar命令常用格式：

```java
sar [options] [-A] [-o file] t [n]
```

t为采样间隔，n为采样次数，默认值是1；

-ofile表示将命令结果以二进制格式存放在文件中，file 是文件名。

options 为命令行选项，sar命令常用选项如下：

选项
解释

-A
所有报告的总和

-u
输出CPU使用情况的统计信息

-v
输出inode、文件和其他内核表的统计信息

-d
输出每一个块设备的活动信息

-r
输出内存和交换空间的统计信息

-b
显示I/O和传送速率的统计信息

-a
文件读写情况

-c
输出进程统计信息，每秒创建的进程数

-R
输出内存页面的统计信息

-y
终端设备活动情况

-w
输出系统交换活动信息

#### 5.3.1 CPU资源监控

例如，每10秒采样一次，连续采样3次，观察CPU 的使用情况，并将采样结果以二进制形式存入当前目录下的文件test中，需键入如下命令：

```java
sar -u -o test 10 3
```

测试记录:

```java
[root@hp1 src]# sar -u -o test 10 3
Linux 3.10.0-1127.el7.x86_64 (hp1)      2021年05月08日  _x86_64_        (4 CPU)
10时44分49秒     CPU     %user     %nice   %system   %iowait    %steal     %idle
10时44分59秒     all      1.86      0.00      0.81      0.00      0.00     97.33
10时45分09秒     all      2.69      0.00      1.06      0.00      0.00     96.25
10时45分19秒     all      1.74      0.00      0.63      0.03      0.00     97.61
平均时间:     all  
```

**输出项说明：**

输出项
解释

CPU
all 表示统计信息为所有 CPU 的平均值。

%user
显示在用户级别(application)运行使用 CPU 总时间的百分比。

%nice
显示在用户级别，用于nice操作，所占用 CPU 总时间的百分比

%system
在核心级别(kernel)运行所使用 CPU 总时间的百分比

%iowait
显示用于等待I/O操作占用 CPU 总时间的百分比

%steal
管理程序(hypervisor)为另一个虚拟进程提供服务而等待虚拟 CPU 的百分比

%idle
显示 CPU 空闲时间占用 CPU 总时间的百分比

**1、** 若%iowait的值过高，表示硬盘存在I/O瓶颈；

**2、** 若%idle的值高但系统响应慢时，有可能是CPU等待分配内存，此时应加大内存容量；

**3、** 若%idle的值持续低于1，则系统的CPU处理能力相对较低，表明系统中最需要解决的资源是CPU；

如果要查看二进制文件test中的内容，需键入如下sar命令：

```java
sar -u -f test
```

测试记录:

```java
[root@hp1 src]# sar -u -f test
Linux 3.10.0-1127.el7.x86_64 (hp1)      2021年05月08日  _x86_64_        (4 CPU)
10时44分49秒     CPU     %user     %nice   %system   %iowait    %steal     %idle
10时44分59秒     all      1.86      0.00      0.81      0.00      0.00     97.33
10时45分09秒     all      2.69      0.00      1.06      0.00      0.00     96.25
10时45分19秒     all      1.74      0.00      0.63      0.03      0.00     97.61
平均时间:     all      2.10      0.00      0.83      0.01      0.00     97.06
[root@hp1 src]# 
```

#### 5.3.2 内存和交换空间监控

每10秒采样一次，连续采样3次，监控内存分页：

```java
sar -r 10 3
```

测试记录:

```java
[root@hp1 src]# sar -r 10 3
Linux 3.10.0-1127.el7.x86_64 (hp1)      2021年05月08日  _x86_64_        (4 CPU)
10时52分43秒 kbmemfree kbmemused  %memused kbbuffers  kbcached  kbcommit   %commit  kbactive   kbinact   kbdirty
10时52分53秒    215420  16051168     98.68         0   2051168  21118556     86.11  12837024   2530152      1004
10时53分03秒    212112  16054476     98.70         0   2054264  21118556     86.11  12837040   2533224      3264
10时53分13秒    211984  16054604     98.70         0   2054304  21118556     86.11  12837024   2533264      2692
平均时间:    213172  16053416     98.69         0   2053245  21118556     86.11  12837029   2532213      2320
[root@hp1 src]# 
```

**输出项说明：**

输出项
解释

kbmemfree
这个值和free命令中的free值基本一致,所以它不包括buffer和cache的空间.

kbmemused
这个值和free命令中的used值基本一致,所以它包括buffer和cache的空间.

%memused
这个值是kbmemused和内存总量(不包括swap)的一个百分比.

kbbuffers和kbcached
这两个值就是free命令中的buffer和cache

kbcommit
保证当前系统所需要的内存,即为了确保不溢出而需要的内存(RAM+swap)

%commit
这个值是kbcommit与内存总量(包括swap)的一个百分比.

#### 5.3.3 I/O和传送速率监控

每10秒采样一次，连续采样3次，报告缓冲区的使用情况，需键入如下命令：

```java
sar -b 10 3
```

测试记录:

```java
[root@hp1 src]# sar -b 10 3
Linux 3.10.0-1127.el7.x86_64 (hp1)      2021年05月08日  _x86_64_        (4 CPU)
10时56分27秒       tps      rtps      wtps   bread/s   bwrtn/s
10时56分37秒      2.40      0.00      2.40      0.00     43.30
10时56分47秒      7.80      0.00      7.80      0.00    143.40
10时56分57秒      4.70      0.00      4.70      0.00    139.30
平均时间:      4.97      0.00      4.97      0.00    108.67
[root@hp1 src]# 
```

**输出项说明：**

输出项
解释

tps
每秒钟物理设备的 I/O 传输总量

rtps
每秒钟从物理设备读入的数据总量

wtps
每秒钟向物理设备写入的数据总量

bread/s
每秒钟从物理设备读入的数据量，单位为 块/s

bwrtn/s
每秒钟向物理设备写入的数据量，单位为 块/s

#### 5.3.4 各磁盘的使用率监控

命令:

```java
-- 参数-p可以打印出sda,hdc等磁盘设备名称,如果不用参数-p,设备节点则有可能是dev8-0,dev22-0
sar -d 10 3 -p
```

测试记录:

```java
[root@hp1 src]# sar -d 10 3 -p
Linux 3.10.0-1127.el7.x86_64 (hp1)      2021年05月08日  _x86_64_        (4 CPU)
11时01分14秒       DEV       tps  rd_sec/s  wr_sec/s  avgrq-sz  avgqu-sz     await     svctm     %util
11时01分24秒       sda      8.50      0.00    161.90     19.05      0.01      0.67      0.11      0.09
11时01分24秒       sr0      0.00      0.00      0.00      0.00      0.00      0.00      0.00      0.00
11时01分24秒 centos_10--31--1--123-root      8.60      0.00    151.40     17.60      0.01      0.70      0.10      0.09
11时01分24秒 centos_10--31--1--123-swap      0.00      0.00      0.00      0.00      0.00      0.00      0.00      0.00
11时01分24秒 centos_10--31--1--123-home      0.50      0.00     10.50     21.00      0.00      0.00      0.00      0.00
11时01分24秒       DEV       tps  rd_sec/s  wr_sec/s  avgrq-sz  avgqu-sz     await     svctm     %util
11时01分34秒       sda      4.20      0.00    248.70     59.21      0.00      0.07      0.07      0.03
11时01分34秒       sr0      0.00      0.00      0.00      0.00      0.00      0.00      0.00      0.00
11时01分34秒 centos_10--31--1--123-root      4.20      0.00    248.70     59.21      0.00      0.05      0.05      0.02
11时01分34秒 centos_10--31--1--123-swap      0.00      0.00      0.00      0.00      0.00      0.00      0.00      0.00
11时01分34秒 centos_10--31--1--123-home      0.00      0.00      0.00      0.00      0.00      0.00      0.00      0.00
11时01分34秒       DEV       tps  rd_sec/s  wr_sec/s  avgrq-sz  avgqu-sz     await     svctm     %util
11时01分44秒       sda      4.70      0.00     73.40     15.62      0.00      0.13      0.11      0.05
11时01分44秒       sr0      0.00      0.00      0.00      0.00      0.00      0.00      0.00      0.00
11时01分44秒 centos_10--31--1--123-root      4.70      0.00     73.40     15.62      0.00      0.13      0.11      0.05
11时01分44秒 centos_10--31--1--123-swap      0.00      0.00      0.00      0.00      0.00      0.00      0.00      0.00
11时01分44秒 centos_10--31--1--123-home      0.00      0.00      0.00      0.00      0.00      0.00      0.00      0.00
平均时间:       DEV       tps  rd_sec/s  wr_sec/s  avgrq-sz  avgqu-sz     await     svctm     %util
平均时间:       sda      5.80      0.00    161.33     27.82      0.00      0.38      0.10      0.06
平均时间:       sr0      0.00      0.00      0.00      0.00      0.00      0.00      0.00      0.00
平均时间: centos_10--31--1--123-root      5.83      0.00    157.83     27.06      0.00      0.39      0.09      0.05
平均时间: centos_10--31--1--123-swap      0.00      0.00      0.00      0.00      0.00      0.00      0.00      0.00
平均时间: centos_10--31--1--123-home      0.17      0.00      3.50     21.00      0.00      0.00      0.00      0.00
[root@hp1 src]# 
```

**输出项说明：**

输出项
解释

tps
每秒从物理磁盘I/O的次数.多个逻辑请求会被合并为一个I/O磁盘请求,一次传输的大小是不确定的.

rd_sec/s
每秒读扇区的次数.

wr_sec/s
每秒写扇区的次数.

avgrq-sz
平均每次设备I/O操作的数据大小(扇区).

avgqu-sz
磁盘请求队列的平均长度.

await
从请求磁盘操作到系统完成处理,每次请求的平均消耗时间,包括请求队列等待时间,单位是毫秒(1秒=1000毫秒).

svctm
系统处理每次请求的平均时间,不包括在请求队列中消耗的时间.

%util
I/O请求占CPU的百分比,比率越大,说明越饱和.

**1、** avgqu-sz的值较低时，设备的利用率较高；

**2、** %util项的值也是衡量磁盘I/O的一个重要指标，如果%util接近100%，表示磁盘产生的I/O请求太多，I/O系统已经满负荷的在工作，该磁盘可能存在瓶颈长期下去，势必影响系统的性能，可以通过优化程序或者通过更换更高、更快的磁盘来解决此问题；

#### 5.3.5 sar查看网卡流量

-n参数很有用，他有6个不同的开关：DEV | EDEV | NFS | NFSD | SOCK | ALL 。DEV显示网络接口信息，EDEV显示关于网络错误的统计数据，NFS统计活动的NFS客户端的信息，NFSD统计NFS服务器的信息，SOCK显示套 接字信息，ALL显示所有5个开关。它们可以单独或者一起使用。我们现在要用的就是-n DEV了。

命令:

```java
sar -n DEV 1 4
```

测试记录:

```java
[root@hp1 src]# sar -n DEV 1 4
Linux 3.10.0-1127.el7.x86_64 (hp1)      2021年05月08日  _x86_64_        (4 CPU)
11时35分14秒     IFACE   rxpck/s   txpck/s    rxkB/s    txkB/s   rxcmp/s   txcmp/s  rxmcst/s
11时35分15秒    ens192     65.00     73.00      6.79     12.41      0.00      0.00      0.00
11时35分15秒        lo     37.00     37.00      7.38      7.38      0.00      0.00      0.00
11时35分15秒     IFACE   rxpck/s   txpck/s    rxkB/s    txkB/s   rxcmp/s   txcmp/s  rxmcst/s
11时35分16秒    ens192     68.00     77.00      6.94     12.90      0.00      0.00      0.00
11时35分16秒        lo     30.00     30.00      4.58      4.58      0.00      0.00      0.00
11时35分16秒     IFACE   rxpck/s   txpck/s    rxkB/s    txkB/s   rxcmp/s   txcmp/s  rxmcst/s
11时35分17秒    ens192     62.00     73.00      5.92     12.46      0.00      0.00      0.00
11时35分17秒        lo     21.00     21.00      3.50      3.50      0.00      0.00      0.00
11时35分17秒     IFACE   rxpck/s   txpck/s    rxkB/s    txkB/s   rxcmp/s   txcmp/s  rxmcst/s
11时35分18秒    ens192     73.00     80.00      8.52     13.74      0.00      0.00      0.00
11时35分18秒        lo     77.00     77.00    190.75    190.75      0.00      0.00      0.00
平均时间:     IFACE   rxpck/s   txpck/s    rxkB/s    txkB/s   rxcmp/s   txcmp/s  rxmcst/s
平均时间:    ens192     67.00     75.75      7.04     12.88      0.00      0.00      0.00
平均时间:        lo     41.25     41.25     51.55     51.55      0.00      0.00      0.00
```

**输出项说明：**

输出项
解释

IFACE
LAN接口

rxpck/s
每秒钟接收的数据包

txpck/s
每秒钟发送的数据包

rxbyt/s
每秒钟接收的字节数

txbyt/s
每秒钟发送的字节数

rxcmp/s
每秒钟接收的压缩数据包

txcmp/s
每秒钟发送的压缩数据包

rxmcst/s
每秒钟接收的多播数据包

输出项
解释

IFACE
LAN接口

rxerr/s
每秒钟接收的坏数据包

txerr/s
每秒钟发送的坏数据包

coll/s
每秒冲突数

rxdrop/s
因为缓冲充满，每秒钟丢弃的已接收数据包数

txdrop/s
因为缓冲充满，每秒钟丢弃的已发送数据包数

txcarr/s
发送数据包时，每秒载波错误数

rxfram/s
每秒接收数据包的帧对齐错误数

rxfifo/s
接收的数据包每秒FIFO过速的错误数

txfifo/s
发送的数据包每秒FIFO过速的错误数

#### 5.3.6 sar命令小结

要判断系统瓶颈问题，有时需几个 sar 命令选项结合起来

怀疑CPU存在瓶颈，可用 sar -u 和 sar -q 等来查看

怀疑内存存在瓶颈，可用 sar -B、sar -r 和 sar -W 等来查看

怀疑I/O存在瓶颈，可用 sar -b、sar -u 和 sar -d 等来查看

### 5.4 iostat命令

iostat方便查看CPU、网卡、tty设备、磁盘、CD-ROM 等等设备的活动情况, 负载信息。

安装:

```java
 yum -y install sysstat
```

命令格式:

```java
iostat[参数][时间][次数]
```

命令参数：

-C显示CPU使用情况

-d显示磁盘使用情况

-k以 KB 为单位显示

-m以 M 为单位显示

-N显示磁盘阵列(LVM) 信息

-n显示NFS 使用情况

-p[磁盘] 显示磁盘和分区的情况

-t显示终端和CPU的信息

-x显示详细信息

-V显示版本信息

#### 5.4.1 显示所有设备的负载

命令:

```java
iostat
```

测试记录:

```java
[root@hp1 ~]# iostat
Linux 3.10.0-1127.el7.x86_64 (hp1)      2021年05月08日  _x86_64_        (4 CPU)
avg-cpu:  %user   %nice %system %iowait  %steal   %idle
           2.68    0.00    0.87    0.00    0.00   96.45
Device:            tps    kB_read/s    kB_wrtn/s    kB_read    kB_wrtn
sda               6.85        49.24       281.53  110499269  631773267
scd0              0.00         0.00         0.00       4232          0
dm-0              6.89         5.73       278.32   12859625  624556629
dm-1              0.00         0.00         0.00       5312          0
dm-2              0.21        43.49         3.21   97599788    7214199
```

**cpu属性值说明：**

%user：CPU处在用户模式下的时间百分比。

%nice：CPU处在带NICE值的用户模式下的时间百分比。

%system：CPU处在系统模式下的时间百分比。

%iowait：CPU等待输入输出完成时间的百分比。

%steal：管理程序维护另一个虚拟处理器时，虚拟CPU的无意识等待时间百分比。

%idle：CPU空闲时间百分比。

备注：如果%iowait的值过高，表示硬盘存在I/O瓶颈，%idle值高，表示CPU较空闲，如果%idle值高但系统响应慢时，有可能是CPU等待分配内存，此时应加大内存容量。%idle值如果持续低于10，那么系统的CPU处理能力相对较低，表明系统中最需要解决的资源是CPU。

tps：该设备每秒的传输次数

kB_read/s：每秒从设备（drive expressed）读取的数据量；

kB_wrtn/s：每秒向设备（drive expressed）写入的数据量；

kB_read： 读取的总数据量；

kB_wrtn：写入的总数量数据量；

#### 5.4.2 查看单个磁盘的统计信息

命令:

```java
iostat -p sda
```

测试记录:

```java
[root@hp1 ~]# iostat -p sda
Linux 3.10.0-1127.el7.x86_64 (hp1)      2021年05月08日  _x86_64_        (4 CPU)
avg-cpu:  %user   %nice %system %iowait  %steal   %idle
           2.68    0.00    0.87    0.00    0.00   96.45
Device:            tps    kB_read/s    kB_wrtn/s    kB_read    kB_wrtn
sda               6.85        49.22       281.55  110499737  632044038
sda1              0.00         0.01         0.00      29980       2438
sda2              6.85        49.21       281.55  110467817  632041600
```

#### 5.4.3 查看逻辑卷的统计信息

命令:

```java
iostat -N
```

测试记录:

```java
[root@hp1 ~]# iostat -N
Linux 3.10.0-1127.el7.x86_64 (hp1)      2021年05月08日  _x86_64_        (4 CPU)
avg-cpu:  %user   %nice %system %iowait  %steal   %idle
           2.68    0.00    0.87    0.00    0.00   96.45
Device:            tps    kB_read/s    kB_wrtn/s    kB_read    kB_wrtn
sda               6.85        49.22       281.55  110499737  632057684
scd0              0.00         0.00         0.00       4232          0
centos_10--31--1--123-root     6.89         5.73       278.33   12860093  624840738
centos_10--31--1--123-swap     0.00         0.00         0.00       5312          0
centos_10--31--1--123-home     0.21        43.48         3.21   97599788    7214508
```

### 5.5 vmstat命令

vmstat 查看 内存，进程和分页等的简要信息

安装:

```java
 yum -y install sysstat
```

在5秒内进行5次采样:

```java
vmstat 5  5
```

测试记录:

```java
[root@hp1 ~]# vmstat 5 5
procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
 r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
 1  0      0 168900      0 2360832    0    0    12    71    3    1  3  1 96  0  0
 0  0      0 167948      0 2361904    0    0     0     2 1824 2759  3  1 96  0  0
 0  0      0 167824      0 2361916    0    0     0    33 1555 2523  1  1 98  0  0
 1  0      0 167544      0 2361976    0    0     0    16 2814 4564  6  2 93  0  0
 0  0      0 167684      0 2361992    0    0     0   118 1695 2678  2  1 97  0  0
```

**字段说明：**

**1、** Procs（进程）；

r: 运行队列中进程数量

b： 等待IO的进程数量

**2、** Memory（内存）；

swpd: 使用虚拟内存大小

free: 可用内存大小

buff: 用作缓冲的内存大小

cache: 用作缓存的内存大小

**3、** Swap；

si: 每秒从交换区写到内存的大小

so: 每秒写入交换区的内存大小

**4、** IO：（现在的Linux版本块的大小为1024bytes）；

bi: 每秒读取的块数

bo: 每秒写入的块数

**5、** 系统；

in: 每秒中断数，包括时钟中断。【interrupt】

cs: 每秒上下文切换数。 【count/second】

**6、** CPU（以百分比表示）；

us: 用户进程执行时间(user time)

sy: 系统进程执行时间(system time)

id: 空闲时间(包括IO等待时间),中央处理器的空闲时间 。以百分比表示。

wa: 等待IO时间

**备注：**

如果r经常大于4，id经常少于40，表示cpu的负荷很重。

如果bi，bo长期不等于0，表示内存不足。

如果disk经常不等于0，且在b中的队列大于3，表示io性能不好。

Linux在具有高稳定性、可靠性的同时，具有很好的可伸缩性和扩展性，能够针对不同的应用和硬件环境调整，优化出满足当前应用需要的最佳性能。因此企业在维护Linux系统、进行系统调优时，了解系统性能分析工具是至关重要的。
