# 02、Kubernetes - 实战：使用kubeasz部署k8s集群
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/12/2.html
- 分类：容器服务
- 分组：教程目录
## 一、实验环境

```java
OS:
root@harbor:~# cat /etc/issue
Ubuntu 20.04.2 LTS \n \l
IP分配：
192.168.1.100 k8s-deploy
192.168.1.101 k8s-master1 etcd1
192.168.1.102 k8s-master2 etcd2
192.168.1.103 k8s-master3 etcd3
192.168.1.104 k8s-node1
192.168.1.105 k8s-node2
192.168.1.106 k8s-node3
192.168.1.107 harbor
192.168.1.108 haproxy1
192.168.1.109 haproxy2
VIP：
192.168.1.188
```

## 二、环境初始化

在所有主机上执行

```java
#1、部署清华镜像源
cat > /etc/apt/sources.list <<EOF
# 默认注释了源码镜像以提高 apt update 速度，如有需要可自行取消注释
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal main restricted universe multiverse
# deb-src https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-updates main restricted universe multiverse
# deb-src https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-updates main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-backports main restricted universe multiverse
# deb-src https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-backports main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-security main restricted universe multiverse
# deb-src https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-security main restricted universe multiverse
EOF
apt update
#2、部署基础命令
apt  install iproute2  ntpdate  tcpdump telnet traceroute nfs-kernel-server nfs-common  lrzsz tree  openssl libssl-dev libpcre3 libpcre3-dev zlib1g-dev ntpdate tcpdump telnet traceroute  gcc openssh-server lrzsz tree  openssl libssl-dev libpcre3 libpcre3-dev zlib1g-dev ntpdate tcpdump telnet traceroute iotop unzip zip openjdk-8-jdk -y
#3、时间同步
apt install cron -y
systemctl status cron.service
/usr/sbin/ntpdate time1.aliyun.com &> /dev/null && hwclock -w
 echo "*/5 * * * * /usr/sbin/ntpdate time1.aliyun.com &> /dev/null && hwclock -w" >> /var/spool/cron/crontabs/root
rm -rf /etc/localtime
ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
cat >> /etc/default/locale << EOF
LANG=en_US.UTF-8
LC_TIME=en_DK.UTF-8
EOF
#4、修改内核参数
cat >/etc/sysctl.conf <<EOF
# Controls source route verification 
net.ipv4.conf.default.rp_filter = 1 
net.ipv4.ip_nonlocal_bind = 1 
net.ipv4.ip_forward = 1 
# Do not accept source routing 
net.ipv4.conf.default.accept_source_route = 0 
# Controls the System Request debugging functionality of the kernel 
kernel.sysrq = 0 
# Controls whether core dumps will append the PID to the core filename. 
# Useful for debugging multi-threaded 
applications. kernel.core_uses_pid = 1 
# Controls the use of TCP syncookies 
net.ipv4.tcp_syncookies = 1 
# Disable netfilter on bridges. 
net.bridge.bridge-nf-call-ip6tables = 0 
net.bridge.bridge-nf-call-iptables = 0 
net.bridge.bridge-nf-call-arptables = 0 
# Controls the default maxmimum size of a mesage queue 
kernel.msgmnb = 65536 
# Controls the maximum size of a message, in bytes 
kernel.msgmax = 65536 
# Controls the maximum shared segment size, in bytes 
kernel.shmmax = 68719476736 
# Controls the maximum number of shared memory segments, in pages 
kernel.shmall = 4294967296 
# TCP kernel paramater 
net.ipv4.tcp_mem = 786432 1048576 1572864 
net.ipv4.tcp_rmem = 4096        87380   4194304 
net.ipv4.tcp_wmem = 4096        16384   4194304 n
et.ipv4.tcp_window_scaling = 1 
net.ipv4.tcp_sack = 1 
# socket buffer 
net.core.wmem_default = 8388608 
net.core.rmem_default = 8388608 
net.core.rmem_max = 16777216 
net.core.wmem_max = 16777216 
net.core.netdev_max_backlog = 262144 
net.core.somaxconn = 20480 
net.core.optmem_max = 81920 
# TCP conn 
net.ipv4.tcp_max_syn_backlog = 262144 
net.ipv4.tcp_syn_retries = 3 
net.ipv4.tcp_retries1 = 3 
net.ipv4.tcp_retries2 = 15 
# tcp conn reuse 
net.ipv4.tcp_timestamps = 0 
net.ipv4.tcp_tw_reuse = 0 
net.ipv4.tcp_tw_recycle = 0 
net.ipv4.tcp_fin_timeout = 1 
net.ipv4.tcp_max_tw_buckets = 20000 
net.ipv4.tcp_max_orphans = 3276800 
net.ipv4.tcp_synack_retries = 1 
net.ipv4.tcp_syncookies = 1 
# keepalive conn 
net.ipv4.tcp_keepalive_time = 300 
net.ipv4.tcp_keepalive_intvl = 30 
net.ipv4.tcp_keepalive_probes = 3 
net.ipv4.ip_local_port_range = 10001    65000 
# swap 
vm.overcommit_memory = 0 
vm.swappiness = 10 
#net.ipv4.conf.eth1.rp_filter = 0 
#net.ipv4.conf.lo.arp_ignore = 1 
#net.ipv4.conf.lo.arp_announce = 2 
#net.ipv4.conf.all.arp_ignore = 1 
#net.ipv4.conf.all.arp_announce = 2 
EOF
#5、修改文件参数
cat >> /etc/security/limits.conf <<EOF
root                soft    core            unlimited 
root                hard    core            unlimited 
root                soft    nproc           1000000 
root                hard    nproc           1000000 
root                soft    nofile          1000000 
root                hard    nofile          1000000 
root                soft    memlock         32000 
root                hard    memlock         32000 
root                soft    msgqueue        8192000 
root                hard    msgqueue        8192000 
*                soft    core            unlimited 
*                hard    core            unlimited 
*                soft    nproc           1000000 
*                hard    nproc           1000000 
*                soft    nofile          1000000 
*                hard    nofile          1000000 
*                soft    memlock         32000 
*                hard    memlock         32000 
*                soft    msgqueue        8192000 
*                hard    msgqueue        8192000 
EOF
#6、hosts文件
cat >> /etc/hosts <<EOF
127.0.0.1 localhost
# The following lines are desirable for IPv6 capable hosts
::1     ip6-localhost ip6-loopback
fe00::0 ip6-localnet
ff00::0 ip6-mcastprefix
ff02::1 ip6-allnodes
ff02::2 ip6-allrouters
192.168.1.101 k8s-master1 etcd1
192.168.1.102 k8s-master2 etcd2
192.168.1.103 k8s-master3 etcd3
192.168.1.104 k8s-node1
192.168.1.105 k8s-node2
192.168.1.106 k8s-node3
192.168.1.107 harbor harbor.zhrx.com
192.168.1.108 haproxy1
192.168.1.109 haproxy2
EOF
#7、关闭swap
swapoff -a
root@harbor:~# vim /etc/fstab
# /etc/fstab: static file system information.
# 
# Use 'blkid' to print the universally unique identifier for a
# device; this may be used with UUID= as a more robust way to name devices
# that works even if disks are added and removed. See fstab(5).
#
# <file system> <mount point>   <type>  <options>       <dump>  <pass>
# / was on /dev/sda2 during curtin installation
/dev/disk/by-uuid/d70a7e92-2d0d-4014-a9a1-4cd95db5e242 / xfs defaults 0 0
#/swap.img      none    swap    sw      0       0
```

## 三、部署harbor

haorbor部署在192.168.1.107上

域名：harbor.zhai.com

**1、** 部署docker；

```java
#1、部署docker源
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository \
   "deb [arch=amd64] https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/ubuntu \
   $(lsb_release -cs) \
   stable"
apt-get update
#2、查看支持的docker版本
apt-cache madison docker-ce
#3、安装19.03.15版的docker
apt-get install docker-ce=5:19.03.15~3-0~ubuntu-focal docker-ce-cli=5:19.03.15~3-0~ubuntu-focal
#4、下载docker-compose v1.24.1
wget https://github.com/docker/compose/releases/download/1.24.1/docker-compose-Linux-x86_64
chmod +x docker-compose-Linux-x86_64
mv docker-compose-Linux-x86_64 /usr/bin/docker-compose
```

**2、** 下载harbor-offine-installer-v2.3.2.tgz,并解压；

```java
root@harbor:~# mkdir /apps
root@harbor:~# cd /apps
root@harbor:/apps# wget https://github.com/goharbor/harbor/releases/download/v2.3.2/harbor-offline-installer-v2.3.2.tgz
root@harbor:/apps# tar -xf harbor-offline-installer-v2.3.2.tgz
```

**3、** 创建证书；

```java
root@harbor:/apps# cd harbor/
root@harbor:/apps/harbor# mkdir certs
root@harbor:/apps/harbor# cd certs
root@harbor:/apps/harbor/certs# openssl genrsa -out harbor-ca.key 2048
root@harbor:/apps/harbor/certs# openssl req -x509 -new -nodes -key harbor-ca.key -subj "/CN=harbor.zhai.com" -days 3650 -out harbor-ca.crt
#注意：/CN=harbor.zhai.com必须是我们用来访问harbor的域名
```

**4、** 编辑harbor的配置文件；

```java
# 修改harbor.yaml文件指定证书的具体路径以及访问域名
root@harbor:/apps/harbor# vim harbor.yml
hostname: harbor.zhai.com
certificate: /apps/harbor/certs/harbor-ca.crt
private_key: /apps/harbor/certs/harbor-ca.key
```

**5、** 安装harbor；

```java
root@harbor:/apps/harbor# ./install.sh --help
Note: Please set hostname and other necessary attributes in harbor.yml first. DO NOT use localhost or 127.0.0.1 for hostname, because Harbor needs to be accessed by external clients.
Please set --with-notary if needs enable Notary in Harbor, and set ui_url_protocol/ssl_cert/ssl_cert_key in harbor.yml bacause notary must run under https. 
Please set --with-trivy if needs enable Trivy in Harbor 开启镜像扫描
Please set --with-chartmuseum if needs enable Chartmuseum in Harbor
root@harbor:/apps/harbor# ./install.sh --with-trivy
......
✔ ----Harbor has been installed and started successfully.----
```

**6、** 将harbor的公钥拷贝到docker并测试；

```java
#1、在docker中创建存放公钥的目录
root@harbor:/etc/docker# mkdir -p certs.d/harbor.zhai.com
#注意：存放公钥的目录必须为域名地址
#2、把harbor公钥拷贝到docker存放公钥的目录
root@harbor:/etc/docker# cp /apps/harbor/certs/harbor-ca.crt /etc/docker/certs.d/harbor.zhai.com/
root@harbor:/etc/docker/certs.d/harbor.zhai.com# ls
harbor-ca.crt
#3、使用docker登录harbor.ywx.net
root@harbor:~# docker login harbor.zhai.com
Username: admin
Password: 
WARNING! Your password will be stored unencrypted in /root/.docker/config.json.
Configure a credential helper to remove this warning. See
https://docs.docker.com/engine/reference/commandline/login/#credentials-store
Login Succeeded
#4、拉取nginx镜像来测试
root@harbor:~# docker pull nginx
#5、更改nginx镜像名称
root@harbor:~# docker tag nginx:latest harbor.zhai.com/k8s-baseimages/nginx:latest
#6、上传镜像
root@harbor:~# docker push harbor.zhai.com/k8s-baseimages/nginx:v1
The push refers to repository [harbor.zhai.com/k8s-baseimages/nginx]
fac15b2caa0c: Pushed 
f8bf5746ac5a: Pushed 
d11eedadbd34: Pushed 
797e583d8c50: Pushed 
bf9ce92e8516: Pushed 
d000633a5681: Pushed 
v1: digest: sha256:6fe11397c34b973f3c957f0da22b09b7f11a4802e1db47aef54c29e2813cc125 size: 1570
```

## 四、部署keepalived和haproxy

在haproxy01 192.168.1.108和haproxy02 192.168.1.109上部署

keepalived中haproxy01为master,haproxy02为

## 1、部署keepalived

```java
#1、安装keepalived
apt install keepalived
#2、修改haproxy01上的keepalived的配置文件
! Configuration File for keepalived
global_defs {
   notification_email {
     acassen
   }
   notification_email_from Alexandre.Cassen@firewall.loc
   smtp_server 192.168.200.1
   smtp_connect_timeout 30
   router_id LVS_DEVEL
}
vrrp_instance VI_1 {
    interface eth0
    virtual_router_id 50
    nopreempt
    priority 100
    advert_int 1
    virtual_ipaddress {
        192.168.1.188 dev eth0 label eth0:0
        192.168.1.189 dev eth0 label eth0:1
        192.168.1.190 dev eth0 label eth0:2
        192.168.1.191 dev eth0 label eth0:3
    }
}
#3、修改haproxy02上的keepalived的配置文件
! Configuration File for keepalived
global_defs {
   notification_email {
     acassen
   }
   notification_email_from Alexandre.Cassen@firewall.loc
   smtp_server 192.168.200.1
   smtp_connect_timeout 30
   router_id LVS_DEVEL
}
vrrp_instance VI_1 {
    interface eth0
    virtual_router_id 50
    nopreempt
    priority 80
    advert_int 1
    virtual_ipaddress {
        192.168.1.188 dev eth0 label eth0:0
        192.168.1.189 dev eth0 label eth0:1
        192.168.1.190 dev eth0 label eth0:2
        192.168.1.191 dev eth0 label eth0:3
    }
}
#4、启动keepalived
systemctl restart keepalived
#5、验证keepalived
haproxy01上
root@k8s-haproxy1:~# ip a  | grep eth0
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    inet 192.168.1.108/24 brd 192.168.1.255 scope global eth0
    inet 192.168.1.188/32 scope global eth0:0
    inet 192.168.1.189/32 scope global eth0:1
    inet 192.168.1.190/32 scope global eth0:2
    inet 192.168.1.191/32 scope global eth0:3
haproxy02上
root@k8s-haproxy2:~# ip a  | grep eth0
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    inet 192.168.1.109/24 brd 192.168.1.255 scope global eth0
关闭haproxy01上的keepalived
root@haproxy01:/etc/keepalived# systemctl stop keepalived
在haproxy02上验证
root@k8s-haproxy2:~# ip a  | grep eth0
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    inet 192.168.1.109/24 brd 192.168.1.255 scope global eth0
    inet 192.168.1.188/32 scope global eth0:0
    inet 192.168.1.189/32 scope global eth0:1
    inet 192.168.1.190/32 scope global eth0:2
    inet 192.168.1.191/32 scope global eth0:3
```

## 2、部署haproxy

```java
#1、部署haproxy
apt install -y haproxy
#2、配置haproxy.cfg
#haproxy01和haproxy02是一样的配置
cat >> /etc/haproxy/haproxy.cfg < EOF
listen stats
  mode http
  bind 0.0.0.0:9999
  stats enable
  log global
  stats uri /haproxy-status
  stats auth haadmin:123456
listen api-server
  bind 192.168.1.188:6443
  mode tcp
  log global
  server k8s-master1 192.168.1.101 check inter 3000 fall 2 rise 5
  server k8s-master2 192.168.1.102 check inter 3000 fall 2 rise 5
  server k8s-master3 192.168.1.103 check inter 3000 fall 2 rise 5
EOF
#3、启动haproxy
systemctl restart haproxy
root@haproxy01:~# systemctl status haproxy
● haproxy.service - HAProxy Load Balancer
     Loaded: loaded (/lib/systemd/system/haproxy.service; enabled; vendor preset: enabled)
     Active: active (running) since Fri 2021-09-17 15:43:36 CST; 5min ago
       Docs: man:haproxy(1)
             file:/usr/share/doc/haproxy/configuration.txt.gz
    Process: 32380 ExecStartPre=/usr/sbin/haproxy -f $CONFIG -c -q $EXTRAOPTS (code=exited, status=0/SUCCESS)
   Main PID: 32381 (haproxy)
      Tasks: 2 (limit: 2278)
     Memory: 2.0M
     CGroup: /system.slice/haproxy.service
             ├─32381 /usr/sbin/haproxy -Ws -f /etc/haproxy/haproxy.cfg -p /run/haproxy.pid -S /run/haproxy-master.sock
             └─32388 /usr/sbin/haproxy -Ws -f /etc/haproxy/haproxy.cfg -p /run/haproxy.pid -S /run/haproxy-master.sock
#4、查看端口是否启动
root@k8s-haproxy1:~# netstat -tnlp | grep -E "9999|6443"
tcp        0      0 0.0.0.0:9999            0.0.0.0:*               LISTEN      5766/haproxy        
tcp        0      0 192.168.1.188:6443      0.0.0.0:*               LISTEN      5766/haproxy        
root@k8s-haproxy1:~#
```

## 五、用kubeasz部署kubernetes

使用k8s-deploy 192.168.1.100 主机部署

## 1、免密钥认证

```java
#1、安装sshpass
apt install -y sshpass
#2、生成ssh key
ssh-keygen 
#3、密钥分发脚本
#!/bin/bash
#目标主机列表
passwd="123456"
IP="
192.168.1.101
192.168.1.102
192.168.1.103
192.168.1.104
192.168.1.105
192.168.1.106
192.168.1.108
192.168.1.109
"
which sshpass &> /dev/null || apt install sshpass
for node in ${IP};do
  sshpass -p "${passwd}" ssh-copy-id  ${node}  -o StrictHostKeyChecking=no
  if [ $? -eq 0 ];then
    echo "${node} 秘钥copy完成"
  else
    echo "${node} 秘钥copy失败"
  fi
done
#4、密钥分发
bash ssh-copy.sh
```

## 2、部署ansible

```java
apt install python3-pip git -y
pip3 install ansible 
```

## 3、使用kubeasz部署kubernetes

### 3.1下载项目源码、二进制及离线镜像

```java
# 下载工具脚本ezdown，举例使用kubeasz版本3.0.0
export release=3.0.0
curl -C- -fLO --retry 3 https://github.com/easzlab/kubeasz/releases/download/${release}/ezdown
chmod +x ./ezdown
# 使用工具脚本下载
./ezdown -D
或者直接下载
wget https://github.com/easzlab/kubeasz/releases/download/3.1.0/ezdown
chmod +x ./ezdown
# 使用工具脚本下载
./ezdown -D
```

可以修改组件版本以后再进行安装

```java
修改docker的版本改为19.03.15
root@harbor:/apps# vim ezdown
#!/bin/bash
#--------------------------------------------------
# This script is used for: 
# 1. to download the scripts/binaries/images needed for installing a k8s cluster with kubeasz
# 2. to run kubeasz in a container (optional)
# @author:   gjmzj
# @usage:    ./ezdown
# @repo:     https://github.com/easzlab/kubeasz
# @ref:      https://github.com/kubeasz/dockerfiles
#--------------------------------------------------
set -o nounset
set -o errexit
#set -o xtrace
# default settings, can be overridden by cmd line options, see usage
#DOCKER_VER=20.10.5
DOCKER_VER=19.03.15
KUBEASZ_VER=3.1.0
K8S_BIN_VER=v1.21.0
EXT_BIN_VER=0.9.4
SYS_PKG_VER=0.4.1
HARBOR_VER=v2.1.3
REGISTRY_MIRROR=CN
# images needed by k8s cluster
calicoVer=v3.15.3
flannelVer=v0.13.0-amd64
dnsNodeCacheVer=1.17.0
corednsVer=1.8.0
dashboardVer=v2.2.0
dashboardMetricsScraperVer=v1.0.6
metricsVer=v0.3.6
pauseVer=3.4.1
nfsProvisionerVer=v4.0.1
export ciliumVer=v1.4.1
export kubeRouterVer=v0.3.1
export kubeOvnVer=v1.5.3
export promChartVer=12.10.6
export traefikChartVer=9.12.3
。。。。。。
在执行./ezdown -D下载kubernetes组件
```

查看下载信息

```java
ezdown -D下载完成后
文件及安装包会自动保存在/etc/kubeasz目录中
root@harbor:/apps# ll /etc/kubeasz/
.gitignore   README.md    ansible.cfg  bin/         docs/        down/        example/     ezctl        ezdown       manifests/   pics/        playbooks/   roles/       tools/  
```

### 3.2创建一个集群配置实例k8s-test

```java
root@harbor:/etc/kubeasz# ./ezctl new k8s-test
2021-09-17 20:53:33 DEBUG generate custom cluster files in /etc/kubeasz/clusters/k8s-test
2021-09-17 20:53:33 DEBUG set version of common plugins
2021-09-17 20:53:33 DEBUG disable registry mirrors
2021-09-17 20:53:33 DEBUG cluster k8s-test: files successfully created.
2021-09-17 20:53:33 INFO next steps 1: to config '/etc/kubeasz/clusters/k8s-test/hosts'
2021-09-17 20:53:33 INFO next steps 2: to config '/etc/kubeasz/clusters/k8s-test/config.yml'
root@harbor:/etc/kubeasz# ll clusters/k8s-test/
total 12
drwxr-xr-x 2 root root   37 Sep 17 20:53 ./
drwxr-xr-x 3 root root   21 Sep 17 20:53 ../
-rw-r--r-- 1 root root 6696 Sep 17 20:53 config.yml
-rw-r--r-- 1 root root 1686 Sep 17 20:53 hosts
```

### 3.3修改配置文件

修改hosts文件

```java
root@harbor:/etc/kubeasz/clusters/k8s-ywx# vim hosts 
# 'etcd' cluster should have odd member(s) (1,3,5,...)
[etcd]
192.168.1.101
192.168.1.102
192.168.1.103
# master node(s)
[kube_master]
192.168.1.101
192.168.1.102
192.168.1.103
# work node(s)
[kube_node]
192.168.1.104
192.168.1.105
192.168.1.106
# [optional] harbor server, a private docker registry
# 'NEW_INSTALL': 'true' to install a harbor server; 'false' to integrate with existed one
[harbor]
#172.168.33.8 NEW_INSTALL=false
# [optional] loadbalance for accessing k8s from outside
[ex_lb]
192.168.1.108 LB_ROLE=backup EX_APISERVER_VIP=192.168.1.188 EX_APISERVER_PORT=6443
192.168.1.109 LB_ROLE=master EX_APISERVER_VIP=192.168.1.188 EX_APISERVER_PORT=6443
# [optional] ntp server for the cluster
[chrony]
#172.168.33.201
[all:vars]
# --------- Main Variables ---------------
# Secure port for apiservers
SECURE_PORT="6443"
# Cluster container-runtime supported: docker, containerd
CONTAINER_RUNTIME="docker"
# Network plugins supported: calico, flannel, kube-router, cilium, kube-ovn
#使用calico网络
CLUSTER_NETWORK="calico"
# Service proxy mode of kube-proxy: 'iptables' or 'ipvs'
PROXY_MODE="ipvs"
#注意：service CICR和Cluster CIDR地址不要冲突
# K8S Service CIDR, not overlap with node(host) networking
SERVICE_CIDR="10.68.0.0/16"
# Cluster CIDR (Pod CIDR), not overlap with node(host) networking
CLUSTER_CIDR="172.20.0.0/16"
# NodePort Range
NODE_PORT_RANGE="30000-32767"
# Cluster DNS Domain
#修改集群域名，这里使用默认，多集群需要修改
CLUSTER_DNS_DOMAIN="cluster.local"
# -------- Additional Variables (don't change the default value right now) ---
# Binaries Directory
bin_dir="/usr/local/bin"
# Deploy Directory (kubeasz workspace)
base_dir="/etc/kubeasz"
# Directory for a specific cluster
cluster_dir="{{ base_dir }}/clusters/k8s-test"
# CA and other components cert/key Directory
ca_dir="/etc/kubernetes/ssl"
```

修改config.yml文件

```java
root@harbor:/etc/kubeasz/clusters/k8s-test# vim config.yml
############################
# prepare
############################
# 可选离线安装系统软件包 (offline|online)
INSTALL_SOURCE: "online"
# 可选进行系统安全加固 github.com/dev-sec/ansible-collection-hardening
OS_HARDEN: false
# 设置时间源服务器【重要：集群内机器时间必须同步】
ntp_servers:
  - "ntp1.aliyun.com"
  - "time1.cloud.tencent.com"
  - "0.cn.pool.ntp.org"
# 设置允许内部时间同步的网络段，比如"10.0.0.0/8"，默认全部允许
local_network: "0.0.0.0/0"
############################
# role:deploy
############################
# default: ca will expire in 100 years
# default: certs issued by the ca will expire in 50 years
CA_EXPIRY: "876000h"
CERT_EXPIRY: "438000h"
# kubeconfig 配置参数
CLUSTER_NAME: "cluster1"
CONTEXT_NAME: "context-{{ CLUSTER_NAME }}"
############################
# role:etcd
############################
# 设置不同的wal目录，可以避免磁盘io竞争，提高性能
ETCD_DATA_DIR: "/var/lib/etcd"
ETCD_WAL_DIR: ""
############################
# role:runtime [containerd,docker]
############################
# ------------------------------------------- containerd
# [.]启用容器仓库镜像
ENABLE_MIRROR_REGISTRY: false
# [containerd]基础容器镜像
SANDBOX_IMAGE: "easzlab/pause-amd64:3.4.1"
# [containerd]容器持久化存储目录
CONTAINERD_STORAGE_DIR: "/var/lib/containerd"
# ------------------------------------------- docker
# [docker]容器存储目录
DOCKER_STORAGE_DIR: "/var/lib/docker"
# [docker]开启Restful API
ENABLE_REMOTE_API: false
# [docker]信任的HTTP仓库
INSECURE_REG: '["127.0.0.1/8","192.168.1.107"]'
############################
# role:kube-master
############################
# k8s 集群 master 节点证书配置，可以添加多个ip和域名（比如增加公网ip和域名）
MASTER_CERT_HOSTS:
  - "10.1.1.1"
  - "k8s.test.io"
 - "www.test.com"
# node 节点上 pod 网段掩码长度（决定每个节点最多能分配的pod ip地址）
# 如果flannel 使用 --kube-subnet-mgr 参数，那么它将读取该设置为每个节点分配pod网段
# https://github.com/coreos/flannel/issues/847
NODE_CIDR_LEN: 24
############################
# role:kube-node
############################
# Kubelet 根目录
KUBELET_ROOT_DIR: "/var/lib/kubelet"
# node节点最大pod 数
MAX_PODS: 110
# 配置为kube组件（kubelet,kube-proxy,dockerd等）预留的资源量
# 数值设置详见templates/kubelet-config.yaml.j2
KUBE_RESERVED_ENABLED: "yes"
# k8s 官方不建议草率开启 system-reserved, 除非你基于长期监控，了解系统的资源占用状况；
# 并且随着系统运行时间，需要适当增加资源预留，数值设置详见templates/kubelet-config.yaml.j2
# 系统预留设置基于 4c/8g 虚机，最小化安装系统服务，如果使用高性能物理机可以适当增加预留
# 另外，集群安装时候apiserver等资源占用会短时较大，建议至少预留1g内存
SYS_RESERVED_ENABLED: "no"
# haproxy balance mode
BALANCE_ALG: "roundrobin"
############################
# role:network [flannel,calico,cilium,kube-ovn,kube-router]
############################
# ------------------------------------------- flannel
# [flannel]设置flannel 后端"host-gw","vxlan"等
FLANNEL_BACKEND: "vxlan"
DIRECT_ROUTING: false
# [flannel] flanneld_image: "quay.io/coreos/flannel:v0.10.0-amd64"
flannelVer: "v0.13.0-amd64"
flanneld_image: "easzlab/flannel:{{ flannelVer }}"
# [flannel]离线镜像tar包
flannel_offline: "flannel_{{ flannelVer }}.tar"
# ------------------------------------------- calico
# [calico]设置 CALICO_IPV4POOL_IPIP=“off”,可以提高网络性能，条件限制详见 docs/setup/calico.md
CALICO_IPV4POOL_IPIP: "Always"  跨网段使用，建议默认开启
# [calico]设置 calico-node使用的host IP，bgp邻居通过该地址建立，可手工指定也可以自动发现
IP_AUTODETECTION_METHOD: "can-reach={{ groups['kube_master'][0] }}"
# [calico]设置calico 网络 backend: brid, vxlan, none
CALICO_NETWORKING_BACKEND: "brid"
# [calico]更新支持calico 版本: [v3.3.x] [v3.4.x] [v3.8.x] [v3.15.x]
calico_ver: "v3.15.3"
# [calico]calico 主版本
calico_ver_main: "{{ calico_ver.split('.')[0] }}.{{ calico_ver.split('.')[1] }}"
# [calico]离线镜像tar包
calico_offline: "calico_{{ calico_ver }}.tar"
# ------------------------------------------- cilium
# [cilium]CILIUM_ETCD_OPERATOR 创建的 etcd 集群节点数 1,3,5,7...
ETCD_CLUSTER_SIZE: 1
# [cilium]镜像版本
cilium_ver: "v1.4.1"
# [cilium]离线镜像tar包
cilium_offline: "cilium_{{ cilium_ver }}.tar"
# ------------------------------------------- kube-ovn
# [kube-ovn]选择 OVN DB and OVN Control Plane 节点，默认为第一个master节点
OVN_DB_NODE: "{{ groups['kube_master'][0] }}"
# [kube-ovn]离线镜像tar包
kube_ovn_ver: "v1.5.3"
kube_ovn_offline: "kube_ovn_{{ kube_ovn_ver }}.tar"
# ------------------------------------------- kube-router
# [kube-router]公有云上存在限制，一般需要始终开启 ipinip；自有环境可以设置为 "subnet"
OVERLAY_TYPE: "full"
# [kube-router]NetworkPolicy 支持开关
FIREWALL_ENABLE: "true"
# [kube-router]kube-router 镜像版本
kube_router_ver: "v0.3.1"
busybox_ver: "1.28.4"
# [kube-router]kube-router 离线镜像tar包
kuberouter_offline: "kube-router_{{ kube_router_ver }}.tar"
busybox_offline: "busybox_{{ busybox_ver }}.tar"
############################
# role:cluster-addon
############################
# coredns 自动安装 关闭所有的自动安装
dns_install: "no"   不自动安装，手动部署
corednsVer: "1.8.0"
ENABLE_LOCAL_DNS_CACHE: false 不开启dns缓存
dnsNodeCacheVer: "1.17.0"
# 设置 local dns cache 地址
LOCAL_DNS_CACHE: "169.254.20.10"
# metric server 自动安装
metricsserver_install: "no"
metricsVer: "v0.3.6"
# dashboard 自动安装
dashboard_install: "no"
dashboardVer: "v2.2.0"
dashboardMetricsScraperVer: "v1.0.6"
# ingress 自动安装
ingress_install: "no"
ingress_backend: "traefik"
traefik_chart_ver: "9.12.3"
# prometheus 自动安装
prom_install: "no"
prom_namespace: "monitor"
prom_chart_ver: "12.10.6"
# nfs-provisioner 自动安装
nfs_provisioner_install: "no"
nfs_provisioner_namespace: "kube-system"
nfs_provisioner_ver: "v4.0.1"
nfs_storage_class: "managed-nfs-storage"
nfs_server: "192.168.1.10"
nfs_path: "/data/nfs"
############################
# role:harbor
############################
# harbor version，完整版本号
HARBOR_VER: "v2.1.3"
HARBOR_DOMAIN: "harbor.yourdomain.com"
HARBOR_TLS_PORT: 8443
# if set 'false', you need to put certs named harbor.pem and harbor-key.pem in directory 'down'
HARBOR_SELF_SIGNED_CERT: true
# install extra component
HARBOR_WITH_NOTARY: false
HARBOR_WITH_TRIVY: false
HARBOR_WITH_CLAIR: false
HARBOR_WITH_CHARTMUSEUM: true
```

### 3.4使用kubeasz部署kubernetes

```java
root@k8s-deploy:/etc/kubeasz# ll playbooks/
total 92
drwxrwxr-x  2 root root 4096 Sep 17 21:15 ./
drwxrwxr-x 12 root root  225 Sep 17 20:53 ../
-rw-rw-r--  1 root root  443 Apr 26 10:02 01.prepare.yml
-rw-rw-r--  1 root root   58 Apr 26 10:02 02.etcd.yml
-rw-rw-r--  1 root root  209 Apr 26 10:02 03.runtime.yml
-rw-rw-r--  1 root root  482 Apr 26 10:02 04.kube-master.yml
-rw-rw-r--  1 root root  218 Apr 26 10:02 05.kube-node.yml
-rw-rw-r--  1 root root  408 Apr 26 10:02 06.network.yml
-rw-rw-r--  1 root root   77 Apr 26 10:02 07.cluster-addon.yml
-rw-rw-r--  1 root root   34 Apr 26 10:02 10.ex-lb.yml
-rw-rw-r--  1 root root 3893 Apr 26 10:02 11.harbor.yml
-rw-rw-r--  1 root root 1567 Apr 26 10:02 21.addetcd.yml
-rw-rw-r--  1 root root 1520 Apr 26 10:02 22.addnode.yml
-rw-rw-r--  1 root root 1050 Apr 26 10:02 23.addmaster.yml
-rw-rw-r--  1 root root 3344 Apr 26 10:02 31.deletcd.yml
-rw-rw-r--  1 root root 1566 Apr 26 10:02 32.delnode.yml
-rw-rw-r--  1 root root 1620 Apr 26 10:02 33.delmaster.yml
-rw-rw-r--  1 root root 1891 Apr 26 10:02 90.setup.yml
-rw-rw-r--  1 root root 1054 Apr 26 10:02 91.start.yml
-rw-rw-r--  1 root root  934 Apr 26 10:02 92.stop.yml
-rw-rw-r--  1 root root 1042 Apr 26 10:02 93.upgrade.yml
-rw-rw-r--  1 root root 1786 Apr 26 10:02 94.backup.yml
-rw-rw-r--  1 root root  999 Apr 26 10:02 95.restore.yml
-rw-rw-r--  1 root root  337 Apr 26 10:02 99.clean.yml
```

部署01.prepare.yml

```java
# [optional] to synchronize system time of nodes with 'chrony' 
- hosts:
  - kube_master
  - kube_node
  - etcd
 - ex_lb
 - chrony
 可以不用部署，报错不影响
  roles:
  - { role: os-harden, when: "OS_HARDEN|bool" }
  - { role: chrony, when: "groups['chrony']|length > 0" }
# to create CA, kubeconfig, kube-proxy.kubeconfig etc.
- hosts: localhost
  roles:
  - deploy
# prepare tasks for all nodes
- hosts:
  - kube_master
  - kube_node
  - etcd
  roles:
  - prepare
root@k8s-deploy:/etc/kubeasz# pwd
/etc/kubeasz
root@k8s-deploy:/etc/kubeasz# ./ezctl setup k8s-test 01
#全程无错误即可
```

部署02.etcd.yml

```java
root@k8s-deploy:/etc/kubeasz# ./ezctl setup k8s-test 02
#全程无错误即可
#验证etcd，在任意etcd节点上运行
export NODE_IPS="192.168.1.101 192.168.1.102 192.168.1.103"
root@k8s-master1:~# for ip in ${NODE_IPS}; do ETCDCTL_API=3 /opt/kube/bin/etcdctl --endpoints=https://${ip}:2379 --cacert=/etc/kubernetes/ssl/ca.pem --cert=/etc/kubernetes/ssl/etcd.pem --key=/etc/kubernetes/ssl/etcd-key.pem endpoint health; done
https://192.168.1.101:2379 is healthy: successfully committed proposal: took = 7.066863ms
https://192.168.1.102:2379 is healthy: successfully committed proposal: took = 8.104232ms
https://192.168.1.103:2379 is healthy: successfully committed proposal: took = 7.145907ms
```

部署03.runtime.yml

```java
#将harbor-ca.crt的公钥拷贝到所有的k8s-master和k8s-node节点
vim /opt/copy-file.sh
#!/bin/bash
#目标主机列表
IP="
192.168.1.101
192.168.1.102
192.168.1.103
192.168.1.104
192.168.1.105
192.168.1.106
"
for node in ${IP};do
  ssh ${node} "mkdir -p /etc/docker/certs.d/harbor.zhai.com/"
  scp -r /apps/harbor/certs/harbor-ca.crt ${node}:/etc/docker/certs.d/harbor.zhai.com/ &> /dev/null
  if [ $? -eq 0 ];then
    echo "${node} 公钥copy完成"
  else
    echo "${node} 公钥copy失败"
  fi
done
root@harbor:/tmp# bash copy-file.sh 
192.168.1.101 公钥copy完成
192.168.1.102 公钥copy完成
192.168.1.103 公钥copy完成
192.168.1.104 公钥copy完成
192.168.1.105 公钥copy完成
192.168.1.106 公钥copy完成
#把docker访问的habor的认证信息拷贝到master和node节点
cat >> /opt/copy-file.sh << EOF
#!/bin/bash
#目标主机列表
IP="
192.168.1.101
192.168.1.102
192.168.1.103
192.168.1.104
192.168.1.105
192.168.1.106
"
for node in ${IP};do
  ssh ${node} "mkdir -p /root/.docker"
  scp -r /root/.docker/config.json ${node}:/root/.docker/config.json &> /dev/null
  if [ $? -eq 0 ];then
    echo "${node} 公钥copy完成"
  else
    echo "${node} 公钥copy失败"
  fi
done
EOF
#部署runtime
root@k8s-deploy:/etc/kubeasz# ./ezctl setup k8s-test 03
#全程无错误即可
```

部署04.kube-master.yml

```java
root@k8s-deploy:/etc/kubeasz# ./ezctl setup k8s-test 04
#全程无错误即可
```

部署05.kube-node.yml

```java
root@k8s-deploy:/etc/kubeasz# ./ezctl setup k8s-test 05
#全程无错误即可
```

部署06.network.yml

```java
root@k8s-deploy:/etc/kubeasz# ./ezctl setup k8s-test 06
#全程无错误即可
```

验证集群状态

在k8s-master01上操作

```java
root@k8s-deploy:~# kubectl  get no
NAME            STATUS                     ROLES    AGE    VERSION
192.168.1.101   Ready,SchedulingDisabled   master   5m5s   v1.20.2
192.168.1.102   Ready,SchedulingDisabled   master   5m6s   v1.20.2
192.168.1.103   Ready,SchedulingDisabled   master   5m5s   v1.20.2
192.168.1.104   Ready                      node     4m4s   v1.20.2
192.168.1.105   Ready                      node     4m4s   v1.20.2
192.168.1.106   Ready                      node     4m4s   v1.20.2
#查看网络
root@k8s-deploy:~# kubectl get pod -A -o wide
NAMESPACE     NAME                                      READY   STATUS    RESTARTS   AGE     IP              NODE            NOMINATED NODE   READINESS GATES
kube-system   calico-kube-controllers-5677ffd49-j2x9j   1/1     Running   0          3m21s   192.168.1.105   192.168.1.105   <none>           <none>
kube-system   calico-node-66ccx                         1/1     Running   0          3m21s   192.168.1.105   192.168.1.105   <none>           <none>
kube-system   calico-node-8qk4r                         1/1     Running   0          3m21s   192.168.1.101   192.168.1.101   <none>           <none>
kube-system   calico-node-cvmn8                         1/1     Running   0          3m21s   192.168.1.104   192.168.1.104   <none>           <none>
kube-system   calico-node-kh68r                         1/1     Running   0          3m21s   192.168.1.106   192.168.1.106   <none>           <none>
kube-system   calico-node-q5rhx                         1/1     Running   0          3m21s   192.168.1.102   192.168.1.102   <none>           <none>
kube-system   calico-node-sphzp                         1/1     Running   0          3m21s   192.168.1.103   192.168.1.103   <none>           <none>
```

## 4、部署coredns

在k8s-master01上部署coredns

```java
#coredns的yaml文件
apiVersion: v1
kind: ServiceAccount
metadata:
  name: coredns
  namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  labels:
    kubernetes.io/bootstrapping: rbac-defaults
  name: system:coredns
rules:
  - apiGroups:
    - ""
    resources:
    - endpoints
    - services
    - pods
    - namespaces
    verbs:
    - list
    - watch
  - apiGroups:
    - discovery.k8s.io
    resources:
    - endpointslices
    verbs:
    - list
    - watch
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  annotations:
    rbac.authorization.kubernetes.io/autoupdate: "true"
  labels:
    kubernetes.io/bootstrapping: rbac-defaults
  name: system:coredns
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: system:coredns
subjects:
- kind: ServiceAccount
  name: coredns
  namespace: kube-system
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: coredns
  namespace: kube-system
data:
  Corefile: |
    .:53 {
        errors
        health {
          lameduck 5s
        }
        bind 0.0.0.0
        ready
       DNS_DOMAIN为clusters/k8s-ywx/hosts 配置中的CLUSTER_DNS_DOMAIN
        kubernetes cluster.local in-addr.arpa ip6.arpa {
          fallthrough in-addr.arpa ip6.arpa
        }
        prometheus :9153
       /etc/resolv.conf可以改为公司或者其它的DNS地址
        forward . /etc/resolv.conf {
          max_concurrent 1000
        }
        cache 30
        loop
        reload
        loadbalance
    }
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: coredns
  namespace: kube-system
  labels:
    k8s-app: kube-dns
    kubernetes.io/name: "CoreDNS"
spec:
  replicas: not specified here:
  1. Default is 1.
  2. Will be tuned in real time if DNS horizontal auto-scaling is turned on.
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
  selector:
    matchLabels:
      k8s-app: kube-dns
  template:
    metadata:
      labels:
        k8s-app: kube-dns
    spec:
      priorityClassName: system-cluster-critical
      serviceAccountName: coredns
      tolerations:
        - key: "CriticalAddonsOnly"
          operator: "Exists"
      nodeSelector:
        kubernetes.io/os: linux
      affinity:
         podAntiAffinity:
           preferredDuringSchedulingIgnoredDuringExecution:
           - weight: 100
             podAffinityTerm:
               labelSelector:
                 matchExpressions:
                   - key: k8s-app
                     operator: In
                     values: ["kube-dns"]
               topologyKey: kubernetes.io/hostname
      containers:
      - name: coredns
       image: coredns/coredns:1.8.3
       从harbor仓库拉取镜像文件
        image: harbor.zhai.com/baseimages/coredns:v1.8.3
        imagePullPolicy: IfNotPresent
        resources:
          limits:
            memory: 170Mi
          requests:
            cpu: 100m
            memory: 70Mi
        args: [ "-conf", "/etc/coredns/Corefile" ]
        volumeMounts:
        - name: config-volume
          mountPath: /etc/coredns
          readOnly: true
        ports:
        - containerPort: 53
          name: dns
          protocol: UDP
        - containerPort: 53
          name: dns-tcp
          protocol: TCP
        - containerPort: 9153
          name: metrics
          protocol: TCP
        securityContext:
          allowPrivilegeEscalation: false
          capabilities:
            add:
            - NET_BIND_SERVICE
            drop:
            - all
          readOnlyRootFilesystem: true
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
            scheme: HTTP
          initialDelaySeconds: 60
          timeoutSeconds: 5
          successThreshold: 1
          failureThreshold: 5
        readinessProbe:
          httpGet:
            path: /ready
            port: 8181
            scheme: HTTP
      dnsPolicy: Default
      volumes:
        - name: config-volume
          configMap:
            name: coredns
            items:
            - key: Corefile
              path: Corefile
---
apiVersion: v1
kind: Service
metadata:
  name: kube-dns
  namespace: kube-system
  annotations:
    prometheus.io/port: "9153"
    prometheus.io/scrape: "true"
  labels:
    k8s-app: kube-dns
    kubernetes.io/cluster-service: "true"
    kubernetes.io/name: "CoreDNS"
spec:
  type: NodePort
  selector:
    k8s-app: kube-dns
  clusterIP: 10.68.0.2 为server CIDR的第二个ip地址
  ports:
  - name: dns
    port: 53
    protocol: UDP
  - name: dns-tcp
    port: 53
    protocol: TCP
  - name: metrics
    port: 9153
    protocol: TCP
    targetPort: 9153
    nodePort: 30009
```

执行coredns.yaml文件

```java
root@k8s-master01:/apps/k8s-yaml# kubectl apply -f coredns.yaml 
serviceaccount/coredns created
clusterrole.rbac.authorization.k8s.io/system:coredns created
clusterrolebinding.rbac.authorization.k8s.io/system:coredns created
configmap/coredns created
deployment.apps/coredns created
service/kube-dns created
#查看coredns的部署
root@k8s-master01:/apps/k8s-yaml# kubectl get pod -A -o wide | grep coredns
kube-system   coredns-55d54f7cfb-fg5jf                   1/1     Running   0          105s   172.20.135.129   172.168.33.212   <none>           <none>
#测试在test01容器中可以ping通域名
root@k8s-master01:/apps/k8s-yaml# kubectl run test01 --image=alpine sleep 999999
root@k8s-master01:/apps/k8s-yaml# kubectl exec -it test01 -- sh
/ ping www.baidu.com
PING www.baidu.com (14.215.177.39): 56 data bytes
64 bytes from 14.215.177.39: seq=0 ttl=53 time=34.848 ms
64 bytes from 14.215.177.39: seq=1 ttl=53 time=35.722 ms
^C
--- www.baidu.com ping statistics ---
2 packets transmitted, 2 packets received, 0% packet loss
round-trip min/avg/max = 34.848/35.285/35.722 ms
/ ping kubernetes
PING kubernetes (10.68.0.1): 56 data bytes
64 bytes from 10.68.0.1: seq=0 ttl=64 time=0.077 ms
64 bytes from 10.68.0.1: seq=1 ttl=64 time=0.085 ms
^C
--- kubernetes ping statistics ---
2 packets transmitted, 2 packets received, 0% packet loss
round-trip min/avg/max = 0.077/0.081/0.085 ms
```
