# 24、Linux 实战：Linux网络
- 来源：https://ddkk.com/zhuanlan/server/linux/2/24.html
- 分类：服务器框架
- 分组：教程目录
## 网络

## 配置网络

配置网络：配置Linux系统中的网络相关文件参数

/etc/sysconfig/network-scripts目录：存放网络相关的配置文件

//网卡的配置文件命名格式：ifcfg-网卡名称

如：查看ifcfg-eno16777736网卡配置文件

名称
含义

TYPE
设备类型

BOOTPROTO
IP地址分配方式

NAME
网卡名称

UUID
识别号

ONBOOT
开机后是否自动启动

NM_CONTROLLED
网卡是否被NM进程管理

IPADDR
IP地址

NETMASK
子网掩码

GATEWAY
网关地址

DNS1
DNS地址

HWADDR
硬件地址（MAC地址）

### 配置网卡

**ifconfig命令**：查询/配置网卡

指令格式1：ifconfig //查询网卡

1）Loop是Linux中的一个特殊网卡，名称为lo（IP地址一般为127.0.0.1）

如：列出当前系统中网卡信息

指令格式2：ifconfig 网卡名 选项 //配置网卡

选项
含义

add IP
添加IP地址

del IP
删除IP地址

netmask
指定子网掩码

broadcast
指定广播地址

mtu N
指定网卡的最大传输单元为N bytes

arp
启用arp

-arp
禁用arp

//临时修改（若永久生效，需修改其配置文件）

//添加的IP的地址默认为Ipv4（若IP地址为Ipv6形式，则添加Ipv6地址）

如：添加IP：192.168.10.10，子网掩码：255.255.255.0到网卡eno16777736

nmtui命令：调用NetworkManager TUI（图形界面）配置网卡

指令格式：nmtui

如：调用NetworkManager TUI

如：配置eno16777736网卡（选择Edit a connection）

1）选择eno16777736，并选择Edit

2）配置该网卡的Ipv4的配置方式为Manual

3）配置该网卡的Ipv4地址为192.168.10.10/24

### 配置网络会话

**会话**：实现多个配置文件的快速切换（类似Firewalld中的区域）

//会话可实现类似在不同环境中快速自动切换IP

nmcli命令：基于命令行管理Nerwork Manager的网络配置工具

指令格式1：nmcli 选项 //查询指定网络配置

选项
含义

connection show
列出所有网卡的网络会话

connection show 网卡名
列出指定网卡连接的网络会话

device status
列出所有网卡的连接信息

device show
列出所有网卡的详细信息

device show 网卡名
列出指定网卡的详细信息

//一个网卡可有多个网络会话，但只能有一个保持激活

如：列出所有网卡的连接信息

指令格式2：创建网络会话

选项
含义

ip4
指定IP地址和子网掩码

gw4
指定网关

autoconnect yes/no
是否默认启动

//nmcli所创建的网络默认为永久生效

如：创建company和house会话，网卡均为16777736

1）配置company会话，指定固定IP地址（默认关闭）；

2）配置house会话，IP地址从DHCP服务自动获取；

3）启动house会话

### 多块网卡绑定

**网卡绑定**：提供服务器网络的性能和稳定（类似RAID磁盘）

1）处于相同模式下的网卡才可进行绑定（否则网卡之间无法互相传送数据）

2）用于网卡绑定的网卡都属于“从网卡”，生成的网卡属于“主网卡”

//主网卡有类似普通网卡的全部信息（并不实际存在）,从网卡没有IP地址和子网掩码等信息（实际存在）

多块网卡绑定可实现以下优势：

1）提高网络传输速度（多块网卡可共同传输数据）；

2）提高网络容灾性（一块网卡出现故障，其他网卡可继续提供正常网络服务）；

网卡绑定驱动的三种模式：

1）** mode0**（平衡负载模式）：默认多块网卡同时工作，且自动备援；但需要在与服务器本地网卡相连的交换机设备上进行端口聚合以支持备援；

2）** mode1**（自动备援模式）：默认只有一块网卡工作，在该网卡出现故障时，可自动替换为其他正常工作网卡；

3）** mode6**（平衡负载模式）：默认多块网卡同时工作，且自动备援；且不需要交换机设备提供辅助支持；

如：利用ifcfg-eno16777736和ifcfg-eno33554968两块网卡绑定生成ifcfg-bond0

1）编写从网卡；

2）编写主网卡；

3）编写内核识别的网卡驱动

//指定ifcfg-bond0网卡的驱动模式为mode6，出现故障时自动备援时间为100ms

4）重启网络，bond0网卡即被启动

## 网络使用

**重启网卡**：通过重新启动网卡来解决某些问题

（1）通过systemctl命令：systemctl restart network

//该方法不一定适用于所有Linux版本

//不要随意停止网卡，尽量使用重启网卡

（2）通过/etc/init.d文件下的快捷方式：/etc/init.d/network reastart

//Linux所有分支版本都有/etc/init.d文件,该文件下存放着很多对服务的快捷方式

如：查看/etc/init.d目录下的文件

（3）重启单个网卡：通过停止和开启单个网卡实现

开启单个网卡：ifup 网卡名

停止单个网卡：ifdown 网卡名

netstat命令：查看系统网络状态和Socket文件

指令格式：netstat 选项

选项
含义

-a
显示所有状态 （默认不显示LISTEN状态）

-t
只列出TCP协议相关的连接

-u
只列出UPD协议相关的连接

-n
将地址从字母组合转化成IP地址 （将协议名称转化成端口号来显示）

-l
过滤出“state”列中其值为LISTEN（监听）的连接

-p
显示发起连接的进程的PID和进程的名称

-r
显示路由信息（路由表）

如：列出当前主机的网络连接状态和本机Socket

名称
含义

Proto
网络的封包协议

Recv-Q
网络接收队列 代表数据已接收到，且存放在本地接收缓冲中 有多少Bytes还没有被进程取走

Send-Q
网络发送队列 代表对方没有收到数据或Ack 有多少Bytes存放在本地发送缓冲区中

Local Address
本端的IP：Port

Foreign Address
远端的IP：Port

State
连接状态

//Recv-Q和Send-Q通常为0，也可短暂不为0的状态，若长时间不为0，则说明队列出现阻塞或堆积问题

Socket文件（Socket File）：实现进程之间的通信

名称
含义

Proto
连接使用的协议

RefCnt
连接到该Socket的进程号

Flags
连接标识

Type
Socket类型

State
Socket当前状态

Path
Socket相关进程的路径

**ping命令**：检测当前主机与目标主机之间的连通性

指令格式：ping 选项 目标主机的IP/域名

名称
含义

-c
指定发送数据包的次数

-w
指定超时的时间间隔

1）不能保证100%准确，因为部分服务器/主机是禁ping；

2）该命令在Windows和Linux中用法和效果相同；

//区别在于：Windows值发送4个数据包，而Linux则默认一直发送

3）本质是使用互联网控制协议（ICMP）中的ECHO_REQUEST数据包，网络设备接收到该数据包后一般会做出回应；

**traceroute命令**：查找当前主机与目标主机主机之间所有的网管（路由器）

指令格式：traceroute 目标主机的IP/域名

1）本质是给沿途各个路由器发送icmp数据包，路由器可能不响应

//该命令在Windows下叫“tracert”其用法和效果同traceroute

**arp（Address Resolution Protocol）地址解析协议**：根据IP地址获取MAC地址

**arp命令**：管理（显示、删除和添加）系统的arp缓冲区（Mac表）

指令格式：arp 选项

选项
含义

-a
显示本机的arp缓冲区内容

-d
删除缓冲区中指定的地址类型

-i
显示指定设备的arp缓冲区

//该命令在Windows下同样使用和效果

**tcpdump命令**：抓包（数据表）

指令格式1：tcpdump 协议 port 端口

1）功能：监视本主机指定端口的数据包

指令格式2：tcpdump 协议 port 端口 host IP地址

1）功能：监视指定主机和端口的数据包

指令格式3：tcpdump -i 网卡设备名

1）功能：监视指定网络接口的数据包

//若不指定，则默认为第一个网络接口（一般是eth0）

**nmap命令**（Network Mapper）：用于网络探测和程序扫描（跨平台）

指令格式：nmap 选项 IP地址

1）主要功能：主机发现、端口扫描、版本侦测、操作系统侦测；

2）多个IP地址使用空格分隔，IP地址可通过通配符、网段和“-”指定；

3）安装命令：yum install -y nmap

选项
含义

-sL
仅列出IP列表

-iL 文件路径
从指定文件中读取IP地址

--exclude 地址
将指定IP地址排除在外

-sS
通过TCP SYN方式扫描 （需管理员权限，执行块且可隐蔽式扫描）

-sT
通过建立完整的TCP连接方式扫描 （普通用户也可执行，默认方式）

-sV
同时进行版本侦测 （确定开发端口上运行的程序和其版本等信息）

-sO
同时进行操作系统侦测 （确定指定主机的操作系统类型和设备类型灯信息）

-sP （-sn）
通过ping检测主机是否可达 （不进行端口扫描）

-sA
探测指定主机是否使用了包过滤器或防火墙

-PS
通过TCP ACK和TCP SYN检测主机是否可达 （避免过滤防火墙阻断ping请求）

-p 协议：端口号
指定端口扫描的协议和端口号 （多个端口号之间使用逗号分隔）

1）若不添加任何参数，默认对IP地址的主机进行端口扫描（常用的1000个）

2）端口协议分为：T、U、S、P（分别代表TCP、UDP、SCTP、IP）；

//默认仅扫描TCP协议，且端口号可通过“-”进行范围指定

如：扫描指定主机的20到100端口TCP情况

端口状态
说明

open
开放的

closed
关闭的

filtered
无法确定状态 （被防火墙IDS/IPS屏蔽）

unfiltered
需进一步确定 （但未被屏蔽）

open|filtered
开放的或被屏蔽的

closed|filtered
关闭的或被屏蔽的

dig命令：域名解析

指令格式：dig 域名 RR资源 选项

1）若省略RR资源，则默认为‘A’，

RR资源
说明

‘A’
返回域名指向的IP地址（Ipv4）

‘AAAA’
返回域名指向的IP地址（Ipv6）

‘PTR’
返回IP地址指向的域名

‘NS’
返回保存下一级域名信息的服务器地址

‘MX’
返回接受电子邮件的服务器地址

‘CNAME’
返回别名指向的IP地址（域名间的映射）

‘ANY’
返回所有相关记录

选项
含义

-b IP地址
当拥有多个IP时 指定本机的具体IP向域名服务器发送查询请求

-x IP地址
将IP地址解析为域名

+cmd
返回结果中显示dig的版本信息 （+nocmd则不显示）

+answer
返回结果显示查询结果信息 （+noanswer则不显示）

+stats
返回结果中显示总结信息 （+nostats则不显示）

+short
以简洁形式返回结果

+identify
在间接形式的基础上显示响应服务器的IP和端口

如：解析baidu.com域名

## Fully Qualified Domain Name

设置主机名：分为临时更改和永久更改

临时更改：hostname 主机名

//虽然为临时更改，但需切换用户（su）后才可正常显示

永久更改：修改“/etc/hostname”

永久更改还需修改“/etc/sysconfig/network”中的“HOSTNAME”配置

//永久更改需要重启才可生效

//临时主机名和永久主机名需保持一致，防止下次启动出现未知错误

在设置主机名后，需给该主机设置FQDN

修改“/etc/hosts”中的IP后对应的域名

//如图所示，一个IP可以有很多的域名

//可使用hostname -f验证是否设置成功，但默认会显示第一个域名

若不设置FQDN则：

1）很多开源服务器软件（如：apache）无法启动

2）方便操作，看到主机名后对其作用有初步判断

3）影响本地的域名的解析
