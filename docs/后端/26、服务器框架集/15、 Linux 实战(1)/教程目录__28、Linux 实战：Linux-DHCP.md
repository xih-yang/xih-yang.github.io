# 28、Linux 实战：Linux-DHCP
- 来源：https://ddkk.com/zhuanlan/server/linux/2/28.html
- 分类：服务器框架
- 分组：教程目录
## DHCP

**DHCP（Dynamic Host Configuration Protocol）** ：动态主机配置协议

1）基于UDP协议，实现自动分配/收回局域网内主机的网络参数

DHCP中有以下概念：

**1）作用域**：完整的IP地址段；

**2）超级作用域**：用于管理处于同一个物理网络中的多个逻辑子网段；

**3）排除范围**：把作用域中的部分IP排除；

**4）地址池**：在作用域中排除范围之外的IP（可用于动态分配的IP）；

**5）租约**：DHCP客户端能够使用动态分配的IP的时间；

**6）预约**：确保网络中特定设备总是获得固定IP

如：DHCP协议分配指定网段的IP

## 配置

DHCP安装指令：yum install -y dhcp

如：在系统中安装DHCP程序

/etc/dhcp/dhcpd.conf文件：DHCP程序的主配置文件

1）常用的配置参数如下：

参数
说明

ddns-update-style 类型
定义DNS服务动态更新的类型 none（不支持动态更新）； interim（互动更新模式）； adhoc（特殊更新模式）

all/ignore client-update
是否允许忽略客户端更新DNS记录

default-lease-time N
指定租约时间为N秒

max-lease-time N
指定最大超时时间为N秒

subnet 网段 netmask 子网掩码
指定作用域的网段

range IP1 IP2
指定IP地址池（IP1到IP2）

option subnet-mask 子网掩码
指定客户端的子网掩码

option routers 网关IP
指定客户端的网关

option domain-name-server IP
指定DNS服务器的IP

option domain-name “域名”
指定DNS服务器的域名

broadcase-address 广播IP
指定客户端的广播地址

ntp-server IP
指定客户端的网络时间服务器（NTP）

nis-servers IP
指定客户端的NIS域服务器的IP

time-offset 偏移误差
指定客户端和格林尼治时间的偏移差

host 主机名
指定配置的主机

hardware 接口类型 网卡的MAC
指定网卡接口类型和MAC

fixed-address IP
将固定IP分配给指定用户

//每个配置参数都必须以“；”结尾

如：查看/etc/dhcp/dhcpd.conf文件

如：/etc/dhcp/dhcp.conf配置文件中全局配置、子网网段声明和地址配置参数

## 动态分配

配置DHCP动态分配服务步骤：

1）配置dhcpd服务的主配置文件/etc/dhcp/dhcpd.conf；

2）DHCP客户端验证

## 固定分配

固定分配：服务器根据用户主机的MAC地址（唯一性）分配固定IP

配置DHCP固定分配步骤：

**1、** 获取固定分配主机的MAC地址；

//通过主机本身查看（连接过DHCP服务器，可通过日志文件查看）

2）配置dhcpd服务的主配置文件/etc/dhcp/dhcpd.conf；

3）DHCP客户端验证
