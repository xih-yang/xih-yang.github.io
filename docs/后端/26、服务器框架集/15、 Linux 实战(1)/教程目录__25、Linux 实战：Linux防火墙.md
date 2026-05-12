# 25、Linux 实战：Linux防火墙
- 来源：https://ddkk.com/zhuanlan/server/linux/2/25.html
- 分类：服务器框架
- 分组：教程目录
## 防火墙

**防火墙**：防范网络攻击（选择性将请求通过以保证网络安全性）

1）Centos6.x的默认管理防火墙的工具为：iptables

2）Centos7.x的默认管理防火墙的工具为：firewalld

策略：防火墙基于流量的源地址、目的地址、端口号、协议和应用等信息所选的应对方式（接受/拒绝）

1）防火墙从上至下读取配置的策略（把优先级高的策略/规则放到上面），在匹配到对应项后就结束匹配工作，并按照策略进行处理（若匹配不到任何策略，就执行默认策略）

2）iptables服务将配置好的防火墙策略交由内核的netfilter网络过滤器处理，firewalld服务将配置好的防火墙策略交由内核的nftables包过滤框架处理

## Iptables

**规则**：iptables服务中把用于处理和过滤流量的策略

**规则链**：由多条规则组成（针对特定数据包的各种规则）

规则链根据不同的数据包处理位置进行以下分类：

规则链
说明

INPUT
处理流入的数据包

OUTPUT
处理流出的数据包

FORWARD
处理转发的数据包

PREROUTING
在进行路由选择前处理的数据包

POSTROUTING
在进行路由选择后处理的数据包

//使用最多的是INPUT规则链

iptables服务根据流量的源地址、目的地址、传输协议、服务类型等信息匹配相关的规则链，匹配成功后根据对应的动作进行处理

动作
说明

ACCEPT
允许流量通过

LOG
允许流量通过，并记录相关信息

REJECT
拒绝流量通过（并回复“拒绝”）

DROP
拒绝流量通过（忽视）

//动作为DROP时，对方无法判断流量被拒绝或主机不在线

iptables命令：查看、添加、设置和删除系统中防火墙的策略/规则

指令格式1：iptables 选项 //查看规则

选项
含义

-L
列出系统中已有的针对规则链策略

如：列出系统中已有的规则链

指令格式2：iptables 选项 //添加规则

选项
含义

-A
在指定规则链的尾部加入该规则

-I
在指定规则链的头部加入该规则

-i 网卡名
匹配从该网卡流入的数据

-o 网卡名
匹配从该网卡列出的数据

-p 协议
匹配指定协议（tcp、udp和icmp）

-s IP
匹配该来源IP

--sport 端口号
匹配该来源端口号

-d IP
匹配该目标IP

--dport 端口号
匹配该目标端口号

-j 动作
指定匹配成功后所进行的动作

一般iptables添加规则参数的输入顺序和格式：

1）有对应的限制，则添加对应的参数（没有限制，则可省略对应的参数）

如：在INPUT规则链中添加允许ICMP流量进入的规则

//ICMP流量的进入就是允许ping命令检测

如：设置INPUT规则链只允许网段为“192.168.10.0/24”的主机访问本机的22端口（拒绝其他所有主机访问22端口）

//由于防火墙策略规则是从上到下顺序匹配的，所以允许动作需写在拒绝动作前

如：设置INPUT规则链中拒绝所有主机访问本机的3306端口

//若某一端口拒绝其他主机任何方式访问，则需同时拒绝tcp和upd两种协议

如：设置INPUT规则链中拒绝所有主机访问本机的1000~1024端口

//若设置顺序的端口时，用“：”连接两个端口号

如：设置INPUT规则链中拒绝192.168.10.5主机访问本机的80端口

指令格式3：iptables 选项 //设置规则

选项
含义

-P 规则链 动作
指定规则链中的默认动作

//规则链的默认拒绝动作只能是DROP，而不能是REJECT

如：设置INPUT规则链的默认动作为DROP

指令格式4：iptables 选项 //删除规则

选项
含义

-D 规则链 N
删除指定规则链中的第N个规则

-F
清空防火墙中已有的针对规则链策略（INPUT无效）

如：删除INPUT规则链中允许ICMP流量进入的规则

如：清空防火墙中已有的针对规则链的策略

iptables命令配置永久生效：service iptables save

//iptables命令配置的防火墙策略/规则都是临时设置（重启后便失效）

其他服务保存设置：/etc/init.d/服务名 save

//当使用临时修改某项服务时，可通过保存设置来达到永久修改

## Firewalld

Firewalld(Dynamic Firewall Manager of Linux systems):Linux系统动态防火墙管理

1）Firewalld分为：CLI下的**firewall-cmd**、GUI下的**firewall-config**

1）** 区域（zone）** ：Firewalld中防火墙策略集合

Firewalld中常用的区域如下：

区域
说明

trusted
允许所有的数据包/流量

home
拒绝流入的流量（除非该流量和流出流量有关） 若该流量与ssh、mdns、ipp-client、amba-client 或dhcpv6-client服务有关，则允许该流量

internal
拒绝流入的流量（除非该流量和流出流量有关） 若该流量与ssh、ipp-client 或dhcpv6-client服务有关，则允许该流量

work
等同于home区域

public
拒绝流入的流量（除非该流量和流出流量有关） 若该流量与ssh或dhcpv6-client服务有关，则允许该流量

external
拒绝流入的流量（除非该流量和流出流量有关） 若该流量与ssh服务有关，则允许该流量

dmz
拒绝流入的流量（除非该流量和流出流量有关） 若该流量与ssh有关，则允许该流量

block
拒绝流入的流量（除非该流量和流出流量有关）

drop
拒绝流入的流量（除非该流量和流出流量有关）

//Firewalld中最常见的区域为：public

### firewall-cmd

**firewall-cmd命令**：Firewalld通过命令行界面配置防火墙

指令格式1：firewall-cmd 选项 //查询防火墙相关信息

选项
含义

--get-default-zone
列出默认区域

--get-zones
列出系统中可用的区域

--get-services
列出预先定义的服务

--get-active-zones
列出当前正在使用的区域和网卡

--list-all
列出当前区域调用网卡的配置参数、 资源、端口和服务等信息

--list-all-zones
列出所有区域调用网卡的配置参数、 资源、端口和服务等信息

--get-zone-of-interface=网卡
查询指定网卡所在区域

--query-service=服务名
查询指定服务在当前区域是否放行

如：列出默认区域、可用区域和预先定义的服务

如：查询ssh、dhcpv6-client和http服务在当前区域是否放行

如：列出当前区域调用网卡的相关信息

指令格式2：firewall-cmd 选项 //配置Firwalld服务

选项
含义

--zone
修改区域

--add-source=IP
将来自该IP的流量都导向指定区域

--remove-source=IP
取消该IP的流量导向指定区域

--add-interface=网卡
将该网卡的所有流量都导向指定区域

--chang-interface=网卡
设置指定网卡的默认区域为指定区域

--add-service=服务
设置默认区域允许该服务的流量

--remove-service=服务
设置默认区域不允许该服务的流量

--add-prot=端口号/协议
设置默认区域允许该端口的流量

--remove-port=端口号/协议
设置默认区域不允许该端口的流量

--reload
重读配置文件

--permanent
使后续配置永久生效（默认重启后生效）

//使用--permanent永久配置，配置不会立刻生效（默认是立刻生效），可通过--reload重读配置文件使永久配置立刻生效

如：设置eno16777736网卡的默认区域为external，并分别在当前模式和永久模式查看该网卡的默认区域

如：设置Firewalld服务的public中允许https服务的流量，并立即生效

如：设置Firewalld服务的public中允许8080和8081端口的流量（仅限当前）

指令格式3：firewall-cmd 选项 //修改Firewalld服务

选项
含义

--set-default-zone=区域
指定默认区域

--panic-on
开启应急状况模式

--panic-off
关闭应急状况模式

//应急状况模式下，系统会阻断一切网络连接

指令格式4：通过firewall-cmd命令配置流量转发

如：设置访问本机330端口的流量转发到335端口（且当前和永久生效）

指令格式5：firewall-cmd --zone=区域 --add-rich-rule=“富规则名 = 规则”

规则
说明

rule family=ipv4/ipv6
ip4或ip6的富规则

source address=IP
指定源IP

destination address
指定目的IP

service name=服务
指定服务

port port=端口号
指定端口号

protocol value=tcp/upd
指定协议

动作
accept（通过）、reject（拒绝并返回消息） drop（拒绝并不返回消息）、log（日志）

1）** 富规则**：类似iptables设置针对用户、服务或端口的规则

2）多个规则之间使用空格分开；

//删除富规则为：firewall-cmd --zone --remove-rich-rule=“富规则名”

如：通过富规则设置拒绝192.168.10.0/24网段内所有用户访问本机的ssh服务

### firewall-config

firewall-config命令：调用Firewall Configuration（图形界面）配置Firewalld服务

指令格式：firewall-config

1）在Firewall Configuration修改内容后不需保存（其自动保存）；

2）Runtime模式下修改的内容会即刻生效，Permanent模式下修改的内容，需重启才能生效

//也可通过Option中的Reload Frewalld使其即刻生效

如：调用Firewall Configuration

**SNAT（Source Network Address Translation）** ：源网络地址转换

1）解决IP地址匮乏的技术，内网中多个用户通过一个外围IP接入Internet

如：比较开启SNAT技术前后

1）关闭SNAT技术

2）开启SNAT技术

如：通过Firewall Configuration开启SNAT

如：通过Firewall Configuration将访问本机3306端口的流量转发到8806端口

如：通过Firewall Configuration配置富规则

## TCP Wrappers

Linux系统中有两个层面的防火墙：

1）基于TCP/TP协议的流量过滤；

2）TCP Wrappers通过是否允许Linux系统提供服务的防火墙（层面更高）；

**TCP Wrappers**：是Centos7系统中默认启用的流量监控程序

1）可根据来访主机的地址和本机的目标服务程序判断是否允许操作

TCPWrappers有两个控制列表文件控制：/etc/hosts.allow和/etc/hosts.deny

1）/etc/hosts.allow：TCP Wrappers的白名单

2）/etc/hosts.deny：TCP Wrappers的黑名单

编写两个文件的参数如下：

客户端类型
示例
满足示例

单一主机
192.168.10.10
IP地址为192.168.10.10的主机

指定网段
192.168.10.
IP段为192.168.10.0/24的主机

指定DNS后缀
.linuxprobe.com
DNS后缀为.linuxprobe.com的主机

指定主机名称
www.linuxprobe.com
主机名www.linuxprobe.com的主机

指定所有客户端
ALL
所有主机均可

1）编写策略规则时，应使用服务名称（而非协议名称）

2）先编写拒绝策略规则（/etc/hosts.deny）再编写允许策略规则（/etc/hosts.allow）

如：使仅192.168.10.0/24网段的主机能访问本机的sshd服务

1）编写/etc/hosts.deny；

2）编写/etc/hosts.allow；

当一个流量访问本机时，系统执行以下操作：

1）系统先检索/etc/hosts.allow进行匹配，若匹配到对应项则放行该流量；

2）若匹配失败，检索/etc/hosts.deny进行匹配，若匹配到对应项则拒绝该流量；

3）若两个文件都匹配失败，则默认放行该流量

//优先级：/etc/hosts.allow > /etc/hosts.deny
