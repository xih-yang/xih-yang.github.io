# 01、Hadoop 入门：Mac OS准备工作
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/1/1.html
- 分类：大数据框架
- 分组：教程目录
## 准备

操作系统： **macOS**

镜像文件： **CentOS7**

虚拟机软件：**VMware Fusion**

## 网络配置

### 创建自己的网络

- **打开VMware Fusion偏好设置->网络->自定**
- *解锁*
- *添加网络vmnet2*
- **勾选使用NAT、将Mac主机连接到该网络；去勾选DHCP**
- *应用，加锁*

### 修改配置

- **打开终端进入目录：** cd /Library/Preferences/VMware\ Fusion
- *修改networking* sudo vim networking

```java
# 将vmnet2信息修改，我这里修改成了 192.168.77.0
answer VNET_2_HOSTONLY_NETMASK 255.255.255.0
answer VNET_2_HOSTONLY_SUBNET 192.168.77.0
answer VNET_2_HOSTONLY_UUID AC697810-54C6-42E0-9BA1-9B0D4C2AB3EE
answer VNET_2_NAT yes
answer VNET_2_NAT_PARAM_UDP_TIMEOUT 30
answer VNET_2_VIRTUAL_ADAPTER yes
```

- *修改vmnet2目录下的nat.conf* sudo vim vmnet2/nat.conf

```java
# 修改对应网关
# NAT gateway address
ip = 192.168.77.2
netmask = 255.255.255.0
```

### 重新启动VMware Fusion

- **VMware Fusion偏好设置->网络->自定->vmnet2** 开锁 加锁 应用

## 新建虚拟机

### 创建自定虚拟机

- *选择操作系统CentOS7、固件引导BIOS*
- 默认磁盘
- 命名centos7_seed、完成

### 安装虚拟机

- *根据自己需要修改处理器内存*
- **网络适配器选择vmnet2**
- *根据自己需要修改硬盘大小*
- *准备一个CentOS7镜像文件*
- *选择CD/DVD并选择镜像文件*，**勾选连接CD/DVD**
- *启动磁盘选择CD/DVD*

## 安装CentOS7

- *语言默认English*
- 时间设置 *Asia Shanghai*
- INSTALLATION DESTINACTION选择分配的磁盘
- NETWORK&HOST NAME 打开Ethernet，网卡名默认ens33
- IPV4设置，save保存
- *开始安装，给root用户设置密码为 123456*

## root登录CentOS7

### 修改网卡配置 vi /etc/sysconfig/network-scripts/ifcfg-ens33

```java
# 修改这几项
BOOTPROTO="static"
IPADDR="192.168.77.100"
PREFIX="24"
GATEWAY="192.168.77.2"
DNS1="8.8.8.8"
```

**重启网络服务**`systemctl restart network`

**能否ping通百度**`ping www.baidu.com`

### 安装常用工具

```java
yum -y install vim
yum -y install net-tools
```

## 关机 init 0

重新选择启动方式为硬盘

## 克隆出三台机器

### 克隆

- 虚拟机->创建完整克隆3个
- 起名node_001、node_002、node_003

### 修改三台机器的网络配置

`vim /etc/sysconfig/network-scripts/ifcfg-ens33`

```java
IPADDR="192.168.77.110"
```

```java
IPADDR="192.168.77.120"
```

```java
IPADDR="192.168.77.130"
```

## 快照

可以给三台机器打个快照，以免往后安装hadoop集群出错
