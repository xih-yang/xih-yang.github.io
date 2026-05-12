# 14、Linux 教程：网络设置
- 来源：https://ddkk.com/zhuanlan/server/linux/1/14.html
- 分类：服务器框架
- 分组：教程目录
## 网络设置

## IP地址设置

查看网卡信息：`ifconfig`

修改ip地址和子网掩码：`ifconfig eth0 ip地址 netmask 子网掩码`或只修改ip地址：``ifconfig eth0 ip`

创建虚拟网卡：`ifconfig eth0:0 ip地址`，如果想创建多块还可以建立eth0:1、eth0:2..，但是注意多块网卡同时存在时只能有一个可以被使用，这就和windows有线网卡和无线网卡的关系一样。

取消虚拟网卡：`ifconfig eth0:0 down`

## 网络配置文件

网络配置文件/etc/sysconfig/network-scripts/ifcfg-eth0，如果有两块网卡，那就应该是eth1，如果有虚拟网卡应该是eth0:0，文件内容如下：

DEVICE=eth0的意思是网卡设备名。TYPE=Ethernet的意思是现在使用以太网。UUID是linux的唯一识别码（如果两个机器用一个UUID，那么联网就会出现问题）。ONBOOT=yes表示网卡随网络服务生效。NM_CONTROLLED=yes代表可以由network manager图形管理工具脱管。BOOTPROTO=dhcp代表自动获取IP地址，还可以改成no、static（这两个都代表手动分配）。DEFROUTE=yes代表default route，是否把这个eth设置为默认路由。IPV4_FAILURE_FATAL=yes代表如果ipv4配置失败禁用设备。IPV6INIT=no代表禁止IPV6。NAME="System eth0"代表 网络连接名字。HWADDR代表mac地址。PEERDNS代表是否允许DHCP获得的DNS覆盖本地的DNS。PEERROUTES是否从DHCP服务器获取用于定义接口的默认网关的信息的路由表条目。

主机名文件/etc/sysconfig/network：

第一行代表网络服务是否工作，第二行代表主机名。修改配置文件后，提示符处的主机名不会立刻改变，此时必须重启主机名才会出现变化。如果用`hostname 主机名`修改主机名，这种修改是临时生效，一重启就会恢复配置文件中的主机名。

DNS配置文件/etc/resolv.conf：

nameserver就是DNS，search是域名补全相关配置。

## ping和traceroute

ping命令，后加IP地址，可以查看网络连接情况，和windows不同的是linux如果不按ctrl+c就会一直执行该命令。如果要制定执行次数，应该执行`ping -c 3 IP地址`表示执行3次。

traceroute后加IP或域名可以查看到某个网站的距离，-n代表使用IP地址，速度更快，会显示节点到另一个节点的时间和节点的IP地址，可以用来故障分析。

## 网卡信息ifconfig

ifconfig可以查看自己的网卡信息，也可以给服务器临时设置IP地址。

第一行分别是网络类型是以太网、硬件地址（mac地址）。第二行是IP地址、广播地址、子网掩码。第三行是ipv6的地址信息。第五行是接受数据包的数量，以及其中错误的情况。第六行是发送数据包的数量，以及错误的情况。第八行是接受和发送数据包的总大小。最后一个是网卡在内存中的地址。

## 常用网络命令

启用网卡：`ifup 网卡名`关闭网卡：`ifdown 网卡名`

查看网关：`netstat -rn`或`route -n`：

表示除了发给192.168.47.0的消息以外，所有的消息都经过192.168.47.2这个网关。

域名解析命令：`nslookup [主机名或IP]`：

server和address显示的是DNS服务器，下方是对应域名的IP地址。

telnet命令是远程管理和端口探测命令，`telnet IP 端口`，该命令是明文传输数据包，不安全，不建议开启。

wget命令加网址上要下载的文件名，就可以开始下载。

如果使用虚拟机的克隆功能，新虚拟机必须进行以下操作来进行网络配置：首先打开/etc/sysconfig/network-scripts/ifcfg-eth0文件删除mac地址行，然后删除网卡和MAC地址绑定文件/etc/udev/rules.d/70-persistent-net.rules，然后重启系统这样就会重新分配UUID，网络就会恢复正常。

## 端口及网络信息netstat

netstat可以查看网络相关信息。-tlun可以查看本机开启的端口情况：

从左到右分别是协议名、接受数据包队列大小、发送数据包队列大小、本地地址加端口、远程主机地址和端口、联机状态（一般有建立ESTABLISED和监听LISTEN）。可以观察到只有tcp连接能处于监听状态，udp没有监听状态。

-an可以查看全部网络连接，既可以看见网络服务，还能看见程序占用的网络协议和端口，且不仅能查看到监听状态的连接，还能查看其他状态（如已建立）。

-rn可以查看本机路由表。

仅执行netstat命令会输出两部分信息，一种是和网络相关的部分，就是上图，一种是与本机进程相关的信息：

下方那部分就是本机相关进程，linux中进程可以接收不同进程发来的消息，socket file可以沟通两个进程之间的信息，上图中从左到右分别是协议（一般是unix）、连接到此socket的进程数量、联机旗标、socket存取的类型（主要有确认联机的STREAM和不需确认的DGRAM）、State（若为CONNECTED表示多个进程已经连接）、连接到此socket的相关程序路径。

查看服务与端口号的对应情况：`cat /etc/services`：

查看启动了网络的进程：`netstat -tulnp`

## 网络设置setup

setup命令执行后可以进行网络设置，redcat系列才能使用此命令：

网络设置完之后需要修改一个配置文件：/etc/sysconfig/network-scripts/ifcfg-eth0把ONBOOT="NO"中的NO改为YES。

然后执行`service network restart`重启网络服务。setup设置网络是永久生效的。
