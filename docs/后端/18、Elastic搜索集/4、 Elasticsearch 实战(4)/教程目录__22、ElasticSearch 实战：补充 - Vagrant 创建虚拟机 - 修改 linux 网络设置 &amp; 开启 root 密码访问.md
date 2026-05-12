# 22、ElasticSearch 实战：补充 - Vagrant 创建虚拟机 - 修改 linux 网络设置 &amp; 开启 root 密码访问
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/4/22.html
- 分类：搜索引擎
- 分组：教程目录
> 接第21节

#### 一、修改 linux 网络设置

##### 1、进入网卡设置目录下

```java
cd sysconfig/network-scripts/
```

##### 2、查看当系统前网卡信息

```java
ip addr
```

##### 3、修改网卡地址，添加网关和 DNS 服务

```java
vi ifcfg-eth1
```

```java
NM_CONTROLLED=yes
BOOTPROTO=none
ONBOOT=yes
IPADDR=192.168.56.10
NETMASK=255.255.255.0
GATEWAY=192.168.56.1
DNS1=114.114.114.114
DNS2=8.8.8.8
DEVICE=eth1
PEERDNS=no
```

```java
service network restart
```

##### 4、配置新的 yum 源，提升软件安装下载速度

```java
curl -o /etc/yum.repos.d/CentOS-Base.repo http://mirrors.163.com/.help/CentOS7-Base-163.repo
```

```java
yum makecache使新的yum源生效
```

#### 二、开启 root 密码访问

##### 1、修改 sshd_config 文件

```java
vi /etc/ssh/sshd_config  Vagrant ssh进去系统之后，修改sshd_config文件
```

```java
PasswordAuthentication yes/no 修改 no 为 yes
```

##### 2、重启服务

```java
service sshd restart
```
