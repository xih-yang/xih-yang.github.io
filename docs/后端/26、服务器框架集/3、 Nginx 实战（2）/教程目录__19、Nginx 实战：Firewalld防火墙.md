# 19、Nginx 实战：Firewalld防火墙
- 来源：https://ddkk.com/zhuanlan/server/nginx/3/19.html
- 分类：服务器框架
- 分组：教程目录
## 安全的考虑方向：

安全框架 OSI七层模型

硬件机架上锁（机柜） 温度 硬件检查

网络iptables/firewalld 仅允许公司的IP地址能连接服务器的22端口 公有云使用 安全组

系统没有公网IP、修改ssh端口、禁止root直接登陆、使用密钥登陆

服务mysql、redis、及时更新服务，防止漏洞被人攻击

网站漏洞注入 sql注入 ddos waf防火墙 SSL证书 保证网站的传输安全

安全狗
知道创宇

牛盾云

firewalld 只能做和IP/Rort相关的限制，web相关的限制无法实现。

## 1、防火墙安全基本概述

在CentOS7系统中集成了多款防火墙管理工具,默认启用的是firewalld（动态防火墙管理器）防火墙管理工具,Firewalld支持CLI（命令行）以及GUI （图形）的两种管理方式。

对于接触Linux较早的人员对iptables比较的熟悉,但由于Iptables的规则比较的麻烦,并网络有一定要求,所以学习成本较高。但Firewaild的学习对网络并没有那么高的要求,相对iptables来说要简单不少。就好比如（手动挡汽车VS自动挡汽车）,所以建议刚接触CentOS7系统的人员直接学习Firewalld。

需要注意的是: 如果开启防火墙工具，并且没有配置任何允许的规则，那么从外部访问防火墙这台主机默认会被阻止，但如果直接从防火墙这台主机往外部流出的流量默认会被允许。

## 2、防火墙使用区域管理

那么相较于传统的Iptables防火墙,firewalld支持动态更新,并加入了区域zone的概念。

简单来说,区域就是firewalld预先准备了几套防火墙策略集合（策略模板），用户可以根据不同的场景而选择不同的策略模板,从而实现防火墙策略之间的快速切换。

需要注意的是Firewalld中的区域与接口

一个网卡仅能绑定一个区域， eth0 -->A区域

但一个区域可以绑定多个网卡 A区域-->eth0 eth1 eth2

还可以根据来源的地址设定不同的规则。比如：所有人能访问80端口，但只有公司的IP才允许访问22端口。

## 3、主要区域：

trusted 白名单

public 默认

drop 黑名单

## 4、防火墙区域配置策略

## 4.1、firewalld的规则分两种状态

为了能正常使用firewalld服务和相关工具去管理防火墙,必须启动firewalld服务,同时关闭以前旧防火墙相关服务。

需要注意firewalld的规则分两种状态:

runtime运行时: 修改规则马上生效，但如果重启服务则马上失效，测试建议。

permanent持久配置: 修改规则后需要reload重载服务才会生效，生产建议。

```java
1.关闭旧版本防火墙服务
[root@m01 ~]# systemctl  mask  iptables
[root@m01 ~]# systemctl  mask  ip6tables
2.启动firewalld防火墙，并加入开机自启动
[root@m01 ~]# systemctl start firewalld
[root@m01 ~]# systemctl enable firewalld
3.了解我们使用的是哪个区域
[root@m01 ~]# firewall-cmd --get-default-zone 
public
4.使用--list-all 获取当前默认区域的规则
[root@m01 ~]# firewall-cmd --list-all
public (active)
  target: default
  icmp-block-inversion: no
  interfaces: eth0 eth1
  sources: 
  services: ssh dhcpv6-client
  ports: 
  protocols: 
  masquerade: no
  forward-ports: 
  source-ports: 
  icmp-blocks: 
  rich rules:
5.使用firewalld各个区域规则结合配置，调整默认public区域拒绝所有流量，但如果来源IP是10.0.0.0/24网段则允许。
	必须根据来源的地址设定，给其添加至一个规则，这样才能做到多区域。
[root@m01 ~]# firewall-cmd --remove-service=ssh 
success
[root@m01 ~]# firewall-cmd --add-source=10.0.0.1/32 --zone=trusted
success
6.检查当前活动的区域
[root@m01 ~]# firewall-cmd --get-active-zone
public
  interfaces: eth1 eth0	
trusted
  sources: 10.0.0.1/32
```

## 4.2、firewalld放行某个服务的流量

```java
[root@m01 ~]# firewall-cmd --add-service=http
success
[root@m01 ~]# firewall-cmd --remove-service=http 
success
注意--permanent 如果添加则代表永久，否则都算临时
```

## 4.3、firewalld放行某个端口的流量（推荐）

```java
[root@m01 ~]# firewall-cmd --add-port=80/tcp
success
[root@m01 ~]# firewall-cmd --remove-port=80/tcp
success
```

## 4.4、firewalld放行自定义服务

```java
	1.名称代表后面添加的服务名称
[root@m01 ~]# cp /usr/lib/firewalld/services/{http.xml,zabbix-agent.xml}  需修改配置文件中的zabbix的端口
	2.重载firewalld
[root@m01 ~]# firewall-cmd --reload
success
	3.添加自定义后的服务名
[root@m01 ~]#  firewall-cmd --add-service=zabbix-agent
success
	建议：以后就直接添加端口就行。
```

## 5、防火墙端口转发策略

端口转发是指传统的目标地址映射,实现外网访问内网资源,流量转发命令格式为:

firewall-cmd -permanent -zone=＜区域＞ -add-forward-port=port=＜源端口号＞:proto=<目标端口号＞:toaddr=＜ 目标IP地址＞

如果需要将本地的10.0.0.6:5555端口转发至后端 172.16.1.9:22端口

**firewalld实现端口转发（端口映射）只能转发tcp相关的服务**

```java
[root@m01 ~]# firewall-cmd --add-forward-port=port=2222:proto=tcp:toport=22:toaddr=172.16.1.7
success
[root@m01 ~]# firewall-cmd --add-masquerade 
success
[root@m01 ~]# firewall-cmd --list-all
public (active)
  target: default
  icmp-block-inversion: no
  interfaces: eth1 eth0
  sources: 
  services: ssh dhcpv6-client
  ports: 
  protocols: 
  masquerade: yes
  forward-ports: port=2222:proto=tcp:toport=22:toaddr=172.16.1.7
  source-ports: 
  icmp-blocks: 
  rich rules: 
```

## 6、防火墙富规则策略

firewalld中的富规则表示更细致、更详细的防火墙策略配置,它可以针对系统服务、端口号、源地址和目标地址等诸多信息进行更有针对性的策略配置，优先级在所有的防火墙策略中也是最高的。下面为firewalld富规则帮助手册

```java
[root@Firewalld ~]# man firewalld.richlanguage
rule
[source]
[destination]
service|port|protocol|icmp-block|masquerade|forward-port
[log]
[audit]
[accept|reject|drop]
rule [family="ipv4|ipv6"]
source address="address[/mask]" [invert="True"]
service name="service name"
port port="port value" protocol="tcp|udp"
protocol value="protocol value"
forward-port port="port value" protocol="tcp|udp" to-port="port value" to-addr="address"
accept | reject [type="reject type"] | drop
富规则相关命令
--add-rich-rule='<RULE>'      		#在指定的区添加一条富规则
--remove-rich-rule='<RULE>'		#在指定的区删除一条富规则
--query-rich-rule='<RULE> '		#找到规则返回0，找不到返回 1
--list-rich-rules					#列出指定区里的所有富规则
```

**示例：**

## 6.1、比如允许10.0.0.1主机能够访问http服务，允许172.16.1.0/24能访问10050端口

```java
[root@m01 ~]# firewall-cmd --add-rich-rule='rule family=ipv4 source address="10.0.0.1" service name=http accept'
[root@m01 ~]# firewall-cmd --add-rich-rule='rule family=ipv4 source address="172.16.1.0/24" port port="10050" protocol="tcp" accept'
```

## 6.2、默认public区域对外开放所有人能通过ssh服务连接，但拒绝172.16.1.0/24网段通过ssh连接服务器

```java
[root@m01 ~]# firewall-cmd --add-rich-rule='rule family=ipv4 source address=172.16.1.0/24 service name=ssh drop'
```

## 6.3、使用firewalld，允许所有人能访问http,https服务，但只有10.0.0.1主机可以访问ssh服务

```java
[root@m01 ~]# firewall-cmd --remove-service=ssh
[root@m01 ~]# firewall-cmd --add-service={http,https}
[root@m01 ~]# firewall-cmd --add-rich-rule='rule family=ipv4 source address=10.0.0.1/32 service name=ssh accept'
```

## 6.4、当用户来源IP地址是10.0.0.1主机，则将用户请求的5555端口转发至后端172.16.1.7的22端口

```java
[root@m01 ~]# firewall-cmd --add-rich-rule='rule family=ipv4 source address=10.0.0.1/32 forward-port port="5555" protocol="tcp" to-port="22" to-addr="172.16.1.7" accept'
```

## 7、firewalld的备份？

```java
我们所有针对public区域编写的永久添加的规则都会写入备份文件(--permanent)
/etc/firewalld/zones/public.xml
```

## 8、防火墙开启内部上网

在指定的带有公网IP的实例上启动Firewalld防火墙的NAT地址转换，以此达到内部主机上网。

sshopenvpn 都只是实现通过外网访问内部主机

firewalld、路由器 都是用来解决内部主机共享上网的

----------**firewalld内部共享上网**----------

```java
1.firewalld防火墙开启masquerade, 实现地址转换
[root@Firewalld ~]# firewall-cmd --add-masquerade --permanent
[root@Firewalld ~]# firewall-cmd --reload
2.客户端将网关指向firewalld服务器，将所有网络请求交给firewalld
[root@web03 ~]# cat /etc/sysconfig/network-scripts/ifcfg-eth1
GATEWAY=172.16.1.61
3.客户端还需配置dns服务器
[root@web03 ~]# cat /etc/resolv.conf
nameserver 223.5.5.5
4.重启网络，使其配置生效
[root@web03 ~]# nmcli connection reload
[root@web03 ~]# nmcli connection down eth1 && nmcli connection up eth1
5.测试后端web的网络是否正常
[root@web03 ~]# ping baidu.com
PING baidu.com (123.125.115.110) 56(84) bytes of data.
64 bytes from 123.125.115.110 (123.125.115.110): icmp_seq=1 ttl=127 time=9.08 ms
```

## 9、图形开启

```java
1.服务端安装x11图形界面工具
[root@kvm-node1 ~]# yum install -y xorg-x11-font-utils xorg-x11-server-utils xorg-x11-utils xorg-x11-xauth xorg-x11-xinit
2.服务端开启SSH隧道转发X11
[root@kvm-node1 ~]# vim /etc/ssh/sshd_config
X11Forwarding yes
[root@kvm-node1 ~]# systemctl restart sshd
3.Windows客户端使用Xshell连接主机，
	修改属性-->ssh->隧道-->转发x11-->勾选X DISPLAY-->重连服务器
	windows安装xming-->打开
	firewall-config
4.安装中文字符，解决界面乱码问题
[root@kevin ~]# yum install -y dejavu-lgc-sans-fonts
[root@kevin ~]# yum groupinstall -y "Fonts"
```

临时调整字体为中文

```java
[root@kvm-node1 ~]# export LANG=zh_CN.UTF-8	
```

SLA

```java
1年 = 365天 = 8760小时
99.9 = 8760 * 0.1% = 8760 * 0.001 = 8.76小时
99.99 = 8760 * 0.0001 = 0.876小时 = 0.876 * 60 = 52.6分钟
99.999 = 8760 * 0.00001 = 0.0876小时 = 0.0876 * 60 = 5.26分钟
```
