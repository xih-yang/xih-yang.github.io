# 07、Kubernetes - 实战：Kubernetes二进制生产集群部署
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/8/7.html
- 分类：容器服务
- 分组：教程目录
## 第一章、前置知识点

### 1.1 生产环境部署K8S集群的两种方式

- kubeadm

Kubeadm是一个K8S部署工具，提供kubeadm init 和 kubeadm join，用于快速部署Kubernetes集群。

- 二进制包

从GitHub下载发行版的二进制包，手动部署每个组件，组成Kubernetes集群。

- 小结：

Kubeadm降低部署门槛，但屏蔽了很多细节，遇到问题很难排查。如果想更容易可控，推荐使用二进制包部署Kubernetes集群，虽然手动部署麻烦点，期间可以学习很多工作原理，也利于后期维护。

### 1.2 准备环境

- 服务器要求：

**1、** 建议最小硬件配置：2核CPU、2G内存、30G硬盘；

**2、** 服务器最好可以访问外网，会从网上拉取镜像需求，如果服务器不能上网，需要提前下载对应镜像并导入节点；

- 软件环境：

```java
软件                 版本
操作系统            CentOS7.x_x64
容器引擎            Docker CE 19
Kubernetes        Kubernetes v1.22
```

- 服务器规划：

角色
IP
组件

master1.k8s.test
10.140.20.141
kube-apiserver,kube-controller-manager,kube-scheduler,docker,etcd，haproxy,keepalived

master2.k8s.test
10.140.20.142
kube-apiserver,kube-controller-manager,kube-scheduler,docker,etcd, haproxy,keepalived

master3.k8s.test
10.140.20.143
kube-apiserver,kube-controller-manager,kube-scheduler,docker,etcd, haproxy,keepalived

node01.k8s.test
10.140.20.156
kubelet，kube-proxy，docker，etcd

## 第二章、 安装说明

本文章将演示Centos7二进制方式安装高可用k8s 1.22+，相对于其他版本，二进制安装方式并无太大区别，只需要区分每个组件版本的对应关系即可。

**生产环境中，建议使用小版本大于5的Kubernetes版本，比如1.19.5以后的才可用于生产环境。**

## 第三章、集群安装

### 3.1 基本环境配置

主机信息，服务器IP地址不能设成dhcp方式，要配置成静态IP。

配置主机名：

```java
10.140.20.141 master1.k8s.test
10.140.20.142 master2.k8s.test
10.140.20.143 master3.k8s.test
10.140.20.141 k8s-master-lb 如果不是高可用集群，该IP为Master01的IP
10.140.20.156 node1.k8s.test
```

网段划分：

**K8S Service网段：10.96.0.0/16

K8SPod网段： 10.244.0.0/16

K8SNode网段： 192.168.31.0/24**

> 注意：宿主机网段、K8S Service网段、Pod网段不能重复。

系统环境：

```java
[root@master1 ~]# more /etc/redhat-release 
CentOS Linux release 7.9.2009 (Core)
[root@master1 ~]# 
```

配置所有节点hosts文件：

```java
[root@master1 ~]# cat /etc/hosts
127.0.0.1   localhost localhost.localdomain localhost4 localhost4.localdomain4
::1         localhost localhost.localdomain localhost6 localhost6.localdomain6
10.140.20.141 master1.k8s.test
10.140.20.142 master2.k8s.test
10.140.20.143 master3.k8s.test
10.140.20.141 k8s-master-lb 如果不是高可用集群，该IP为Master01的IP
10.140.20.156 node1.k8s.test
```

CentOS 7安装yum源：

```java
curl -o /etc/yum.repos.d/CentOS-Base.repo https://mirrors.aliyun.com/repo/Centos-7.repo
yum install -y yum-utils device-mapper-persistent-data lvm2
yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
sed -i -e '/mirrors.cloud.aliyuncs.com/d' -e '/mirrors.aliyuncs.com/d' /etc/yum.repos.d/CentOS-Base.repo
```

必备工具安装:

```java
yum install wget jq psmisc vim net-tools telnet yum-utils device-mapper-persistent-data lvm2 git -y
```

所有节点关闭firewalld 、dnsmasq、selinux(CentOS7需要关闭NetworkManager，CentOS8不需要)

```java
systemctl disable --now firewalld 
systemctl disable --now dnsmasq
systemctl disable --now NetworkManager
setenforce 0
sed -i 's#SELINUX=enforcing#SELINUX=disabled#g' /etc/sysconfig/selinux
sed -i 's#SELINUX=enforcing#SELINUX=disabled#g' /etc/selinux/config
```

所有节点关闭swap分区，fstab注释swap：

```java
swapoff -a && sysctl -w vm.swappiness=0
sed -ri '/^[^#]*swap/s@^@#@' /etc/fstab
```

所有节点同步时间：

```java
rpm -ivh http://mirrors.wlnmp.com/centos/wlnmp-release-centos.noarch.rpm
yum install ntpdate -y
ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
echo 'Asia/Shanghai' >/etc/timezone
ntpdate time2.aliyun.com
# 加入到crontab
*/5 * * * * /usr/sbin/ntpdate time2.aliyun.com
```

所有节点配置limit：

```java
ulimit -SHn 65535
vim /etc/security/limits.conf
# 末尾添加如下内容
* soft nofile 65536
* hard nofile 131072
* soft nproc 65535
* hard nproc 655350
* soft memlock unlimited
* hard memlock unlimited　
```

配置免密登录：

Master01节点免密钥登录其他节点，安装过程中生成配置文件和证书均在Master01上操作，集群管理也在Master01上操作，阿里云或者AWS上需要单独一台kubectl服务器。密钥配置如下：

```java
[root@master1 ~]# ssh-keygen -t rsa
```

Master01配置免密码登录其他节点：

```java
[root@master1 ~]# for i in master1.k8s.test master2.k8s.test master3.k8s.test k8s-node01 k8s-node02;do ssh-copy-id -i .ssh/id_rsa.pub $i;done
```

Master01下载安装文件：

```java
[root@master1 ~]# cd /root/ ; git clone https://github.com/dotbalo/k8s-ha-install.git
Cloning into 'k8s-ha-install'...
remote: Enumerating objects: 12, done.
remote: Counting objects: 100% (12/12), done.
remote: Compressing objects: 100% (11/11), done.
remote: Total 461 (delta 2), reused 5 (delta 1), pack-reused 449
Receiving objects: 100% (461/461), 19.52 MiB | 4.04 MiB/s, done.
Resolving deltas: 100% (163/163), done.
```

如果无法clone可以使用https://gitee.com/dukuan/k8s-ha-install.git进行克隆。

所有节点升级系统并重启，此处升级没有升级内核，下节会单独升级内核：

```java
yum update -y --exclude=kernel* && reboot 
#CentOS7需要升级，CentOS8可以按需升级系统
```

### 3.2 内核升级

CentOS7 需要升级内核至4.18+，本次升级的版本为6.3

在master01节点下载内核：

```java
cd /root
wget http://193.49.22.109/elrepo/kernel/el7/x86_64/RPMS/kernel-ml-devel-4.19.12-1.el7.elrepo.x86_64.rpm
wget http://193.49.22.109/elrepo/kernel/el7/x86_64/RPMS/kernel-ml-4.19.12-1.el7.elrepo.x86_64.rpm
wget http://193.49.22.109/elrepo/kernel/el7/x86_64/RPMS/kernel-ml-6.3.2-1.el7.elrepo.x86_64.rpm
wget http://193.49.22.109/elrepo/kernel/el7/x86_64/RPMS/kernel-ml-devel-6.3.2-1.el7.elrepo.x86_64.rpm
```

从master01节点传到其他节点：

```java
for i in master2.k8s.test master3.k8s.test k8s-node01 k8s-node02;do scp kernel-ml-4.19.12-1.el7.elrepo.x86_64.rpm kernel-ml-devel-4.19.12-1.el7.elrepo.x86_64.rpm $i:/root/ ; done
```

所有节点安装内核

```java
cd /root && yum localinstall -y kernel-ml*
```

所有节点更改内核启动顺序

```java
grub2-set-default  0 && grub2-mkconfig -o /etc/grub2.cfg
grubby --args="user_namespace.enable=1" --update-kernel="$(grubby --default-kernel)"
```

检查默认内核是不是63.

```java
[root@master2 ~]# grubby --default-kernel
/boot/vmlinuz-6.3.2-1.el7.elrepo.x86_64
```

所有节点重启，然后检查内核是不是6.3。

所有节点安装ipvsadm：

```java
yum install ipvsadm ipset sysstat conntrack libseccomp -y
```

所有节点配置ipvs模块，在内核4.19+版本nf_conntrack_ipv4已经改为nf_conntrack， 4.18以下使用nf_conntrack_ipv4即可：

```java
modprobe -- ip_vs
modprobe -- ip_vs_rr
modprobe -- ip_vs_wrr
modprobe -- ip_vs_sh
modprobe -- nf_conntrack
vim /etc/modules-load.d/ipvs.conf 
# 加入以下内容
ip_vs
ip_vs_lc
ip_vs_wlc
ip_vs_rr
ip_vs_wrr
ip_vs_lblc
ip_vs_lblcr
ip_vs_dh
ip_vs_sh
ip_vs_fo
ip_vs_nq
ip_vs_sed
ip_vs_ftp
ip_vs_sh
nf_conntrack
ip_tables
ip_set
xt_set
ipt_set
ipt_rpfilter
ipt_REJECT
ipip
```

然后执行命令即可

```java
systemctl enable --now systemd-modules-load.service
```

检查是否加载：

```java
[root@master1 ~]# lsmod | grep -e ip_vs -e nf_conntrack
nf_conntrack_ipv4      16384  23 
nf_defrag_ipv4         16384  1 nf_conntrack_ipv4
nf_conntrack          135168  10 xt_conntrack,nf_conntrack_ipv6,nf_conntrack_ipv4,nf_nat,nf_nat_ipv6,ipt_MASQUERADE,nf_nat_ipv4,xt_nat,nf_conntrack_netlink,ip_vs
```

开启一些k8s集群中必须的内核参数，所有节点配置k8s内核：

```java
cat <<EOF > /etc/sysctl.d/k8s.conf
net.ipv4.ip_forward = 1
net.bridge.bridge-nf-call-iptables = 1
net.bridge.bridge-nf-call-ip6tables = 1
fs.may_detach_mounts = 1
vm.overcommit_memory=1
net.ipv4.conf.all.route_localnet = 1
vm.panic_on_oom=0
fs.inotify.max_user_watches=89100
fs.file-max=52706963
fs.nr_open=52706963
net.netfilter.nf_conntrack_max=2310720
net.ipv4.tcp_keepalive_time = 600
net.ipv4.tcp_keepalive_probes = 3
net.ipv4.tcp_keepalive_intvl =15
net.ipv4.tcp_max_tw_buckets = 36000
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_max_orphans = 327680
net.ipv4.tcp_orphan_retries = 3
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 16384
net.ipv4.ip_conntrack_max = 65536
net.ipv4.tcp_max_syn_backlog = 16384
net.ipv4.tcp_timestamps = 0
net.core.somaxconn = 16384
EOF
sysctl --system
```

所有节点配置完内核后，重启服务器，保证重启后内核依旧加载

```java
reboot
lsmod | grep --color=auto -e ip_vs -e nf_conntrack
```

## 第四章、基本组件安装

本节主要安装的是集群中用到的各种组件。比如Docker-ce、kubernetes各组件等。

### 4.1 Docker安装

所有节点安装Docker-ce 19.03

```java
yum install docker-ce-19.03.* docker-ce-cli-19.03.* -y
```

温馨提示：

由于新版kubelet建议使用systemd，所以可以把docker的CgroupDriver改成systemd

```java
mkdir /etc/docker
cat > /etc/docker/daemon.json <<EOF
{
  "exec-opts": ["native.cgroupdriver=systemd"]
}
EOF
```

所有节点设置开机自启动Docker：

```java
systemctl daemon-reload && systemctl enable --now docker
```

### 4.2 K8s及etcd安装

Master01下载kubernetes安装包：

```java
[root@master1 ~]# wget https://dl.k8s.io/v1.22.6/kubernetes-server-linux-amd64.tar.gz
wget https://dl.k8s.io/v1.22.17/kubernetes-server-linux-amd64.tar.gz
```

注意目前版本是1.22.6，安装时需要下载最新的1.22.x版本：https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG/CHANGELOG-1.22.md

**以下操作都在master01执行：**

下载etcd安装包：

```java
[root@master1 ~]# wget https://github.com/etcd-io/etcd/releases/download/v3.5.9/etcd-v3.5.9-linux-amd64.tar.gz
wget https://github.com/etcd-io/etcd/releases/download/v3.5.0/etcd-v3.5.0-linux-amd64.tar.gz
```

解压kubernetes安装文件

```java
[root@master1 ~]# tar -xf kubernetes-server-linux-amd64.tar.gz  --strip-components=3 -C /usr/local/bin kubernetes/server/bin/kube{let,ctl,-apiserver,-controller-manager,-scheduler,-proxy}
```

解压etcd安装文件

```java
[root@master1 ~]#  tar -zxvf etcd-v3.5.9-linux-amd64.tar.gz --strip-components=1 -C /usr/local/bin etcd-v3.5.9-linux-amd64/etcd{,ctl}
```

版本查看：

```java
[root@master1 ~]# kubelet --version
Kubernetes v1.22.6
[root@master1.k8s.test ~]# etcdctl version
etcdctl version: 3.5.0
API version: 3.5
[root@master1 ~]# 
```

将组件发送到其他节点：

```java
MasterNodes='master2.k8s.test master3.k8s.test'
WorkNodes='node1.k8s.test'
for NODE in $MasterNodes; do echo $NODE; scp /usr/local/bin/kube{
     let,ctl,-apiserver,-controller-manager,-scheduler,-proxy} $NODE:/usr/local/bin/; scp /usr/local/bin/etcd* $NODE:/usr/local/bin/; done
for NODE in $WorkNodes; do     scp /usr/local/bin/kube{
     let,-proxy} $NODE:/usr/local/bin/ ; done
```

所有节点创建/opt/cni/bin目录：

```java
mkdir -p /opt/cni/bin
```

切换分支：

Master01节点切换到1.22.x分支（其他版本可以切换到其他分支，.x即可，不需要更改为具体的小版本）

```java
cd /root/k8s-ha-install && git checkout manual-installation-v1.22.x
```

## 第五章、生成证书

**二进制安装最关键步骤，一步错误全盘皆输，一定要注意每个步骤都要是正确的**。

Master01下载生成证书工具

```java
wget "https://pkg.cfssl.org/R1.2/cfssl_linux-amd64" -O /usr/local/bin/cfssl
wget "https://pkg.cfssl.org/R1.2/cfssljson_linux-amd64" -O /usr/local/bin/cfssljson
chmod +x /usr/local/bin/cfssl /usr/local/bin/cfssljson
```

### 5.1 etcd证书

所有Master节点创建etcd证书目录

```java
mkdir /etc/etcd/ssl -p
```

所有节点创建kubernetes相关目录

```java
mkdir -p /etc/kubernetes/pki
```

Master01节点生成etcd证书

生成证书的CSR文件：证书签名请求文件，配置了一些域名、公司、单位

```java
[root@master1 pki]# cd /root/k8s-ha-install/pki
# 生成etcd CA证书和CA证书的key
cfssl gencert -initca etcd-ca-csr.json | cfssljson -bare /etc/etcd/ssl/etcd-ca
cfssl gencert -ca=/etc/etcd/ssl/etcd-ca.pem -ca-key=/etc/etcd/ssl/etcd-ca-key.pem -config=ca-config.json -hostname=127.0.0.1,master1.k8s.test,master2.k8s.test,master3.k8s.test,10.140.20.141,10.140.20.142,10.140.20.143, -profile=kubernetes etcd-csr.json | cfssljson -bare /etc/etcd/ssl/etcd
执行结果
2023/05/16 15:53:33 [INFO] generate received request
2023/05/16 15:53:33 [INFO] received CSR
2023/05/16 15:53:33 [INFO] generating key: rsa-2048
2023/05/16 15:53:33 [INFO] encoded CSR
2023/05/16 15:53:33 [INFO] signed certificate with serial number 189052540690168442492442794802253693390408995729
[root@master1 ssl]# cd /etc/etcd/ssl/
[root@master1.k8s.test ssl]# ls
etcd-ca.csr  etcd-ca-key.pem  etcd-ca.pem  etcd.csr  etcd-key.pem  etcd.pem
[root@master1 ssl]# 
```

将证书复制到其他节点：

```java
MasterNodes='master2.k8s.test master3.k8s.test'
for NODE in $MasterNodes; do
     ssh $NODE "mkdir -p /etc/etcd/ssl"
     for FILE in etcd-ca-key.pem  etcd-ca.pem  etcd-key.pem  etcd.pem; do
       scp /etc/etcd/ssl/${FILE} $NODE:/etc/etcd/ssl/${FILE}
     done
 done
```

### 5.2 k8s组件证书

- Master01生成kubernetes ca 证书

```java
[root@master1 pki]# cd /root/k8s-ha-install/pki
cfssl gencert -initca ca-csr.json | cfssljson -bare /etc/kubernetes/pki/ca
```

- 生成apiserver证书

#10.96.0.是k8s service的网段，如果说需要更改k8s service网段，那就需要更改10.96.0.1，建议多写几个IP地址，为扩容master节点准备

#如果不是高可用集群，10.140.20.141为Master01的IP

```java
cfssl gencert -ca=/etc/kubernetes/pki/ca.pem -ca-key=/etc/kubernetes/pki/ca-key.pem -config=ca-config.json -hostname=10.96.0.1,10.140.20.141,127.0.0.1,kubernetes,kubernetes.default,kubernetes.default.svc,kubernetes.default.svc.cluster,kubernetes.default.svc.cluster.local,10.140.20.141,10.141.20.142,10.141.20.143 -profile=kubernetes apiserver-csr.json | cfssljson -bare /etc/kubernetes/pki/apiserver
```

生成apiserver的聚合证书。Requestheader-client-xxx requestheader-allowwd-xxx:aggerator

```java
cfssl gencert -initca front-proxy-ca-csr.json | cfssljson -bare /etc/kubernetes/pki/front-proxy-ca 
cfssl gencert -ca=/etc/kubernetes/pki/front-proxy-ca.pem -ca-key=/etc/kubernetes/pki/front-proxy-ca-key.pem -config=ca-config.json -profile=kubernetes front-proxy-client-csr.json | cfssljson -bare /etc/kubernetes/pki/front-proxy-client
```

- 生成controller-manage的证书

```java
cfssl gencert -ca=/etc/kubernetes/pki/ca.pem -ca-key=/etc/kubernetes/pki/ca-key.pem -config=ca-config.json -profile=kubernetes manager-csr.json | cfssljson -bare /etc/kubernetes/pki/controller-manager
# 注意，如果不是高可用集群，10.140.20.141:6443改为master01的地址，6443改为apiserver的端口，默认是6443
# set-cluster：设置一个集群项，
kubectl config set-cluster kubernetes --certificate-authority=/etc/kubernetes/pki/ca.pem --embed-certs=true --server=https://10.140.20.141:6443 --kubeconfig=/etc/kubernetes/controller-manager.kubeconfig
# 设置一个环境项，一个上下文
kubectl config set-context system:kube-controller-manager@kubernetes --cluster=kubernetes --user=system:kube-controller-manager --kubeconfig=/etc/kubernetes/controller-manager.kubeconfig
# set-credentials 设置一个用户项
kubectl config set-credentials system:kube-controller-manager --client-certificate=/etc/kubernetes/pki/controller-manager.pem --client-key=/etc/kubernetes/pki/controller-manager-key.pem --embed-certs=true --kubeconfig=/etc/kubernetes/controller-manager.kubeconfig
# 使用某个环境当做默认环境
kubectl config use-context system:kube-controller-manager@kubernetes --kubeconfig=/etc/kubernetes/controller-manager.kubeconfig
```

- 生成scheduler证书

```java
cfssl gencert -ca=/etc/kubernetes/pki/ca.pem -ca-key=/etc/kubernetes/pki/ca-key.pem -config=ca-config.json -profile=kubernetes scheduler-csr.json | cfssljson -bare /etc/kubernetes/pki/scheduler
# 注意，如果不是高可用集群，10.140.20.141:6443改为master01的地址，6443改为apiserver的端口，默认是6443
kubectl config set-cluster kubernetes --certificate-authority=/etc/kubernetes/pki/ca.pem --embed-certs=true --server=https://10.140.20.141:6443 --kubeconfig=/etc/kubernetes/scheduler.kubeconfig
kubectl config set-credentials system:kube-scheduler --client-certificate=/etc/kubernetes/pki/scheduler.pem --client-key=/etc/kubernetes/pki/scheduler-key.pem --embed-certs=true --kubeconfig=/etc/kubernetes/scheduler.kubeconfig
kubectl config set-context system:kube-scheduler@kubernetes --cluster=kubernetes --user=system:kube-scheduler --kubeconfig=/etc/kubernetes/scheduler.kubeconfig
kubectl config use-context system:kube-scheduler@kubernetes --kubeconfig=/etc/kubernetes/scheduler.kubeconfig
```

- 生成admin证书

```java
cfssl gencert -ca=/etc/kubernetes/pki/ca.pem -ca-key=/etc/kubernetes/pki/ca-key.pem -config=ca-config.json -profile=kubernetes admin-csr.json | cfssljson -bare /etc/kubernetes/pki/admin
# 注意，如果不是高可用集群，10.140.20.141:6443改为master01的地址，6443改为apiserver的端口，默认是6443
kubectl config set-cluster kubernetes --certificate-authority=/etc/kubernetes/pki/ca.pem --embed-certs=true --server=https://10.140.20.141:6443 --kubeconfig=/etc/kubernetes/admin.kubeconfig
kubectl config set-credentials kubernetes-admin --client-certificate=/etc/kubernetes/pki/admin.pem --client-key=/etc/kubernetes/pki/admin-key.pem --embed-certs=true --kubeconfig=/etc/kubernetes/admin.kubeconfig
kubectl config set-context kubernetes-admin@kubernetes --cluster=kubernetes --user=kubernetes-admin --kubeconfig=/etc/kubernetes/admin.kubeconfig
kubectl config use-context kubernetes-admin@kubernetes --kubeconfig=/etc/kubernetes/admin.kubeconfig
```

- 创建ServiceAccount Key->secret

```java
openssl genrsa -out /etc/kubernetes/pki/sa.key 2048
返回结果
Generating RSA private key, 2048 bit long modulus (2 primes)
...................................................................................+++++
...............+++++
e is 65537 (0x010001)
openssl rsa -in /etc/kubernetes/pki/sa.key -pubout -out /etc/kubernetes/pki/sa.pub
```

发送证书至其他节点:

```java
for NODE in master2.k8s.test master3.k8s.test; do 
for FILE in $(ls /etc/kubernetes/pki | grep -v etcd); do scp /etc/kubernetes/pki/${FILE} $NODE:/etc/kubernetes/pki/${FILE};
done; 
for FILE in admin.kubeconfig controller-manager.kubeconfig scheduler.kubeconfig; do 
scp /etc/kubernetes/${FILE} $NODE:/etc/kubernetes/${FILE};
done;
done
```

### 5.3 检验证书

```java
#查看证书文件，确保生成的证书是23个
[root@master2 kubernetes]# ls /etc/kubernetes/pki/|wc -l
23
[root@master2 kubernetes]# ls /etc/kubernetes/pki/
admin.csr      apiserver-key.pem  ca.pem                      front-proxy-ca.csr      front-proxy-client-key.pem  scheduler.csr
admin-key.pem  apiserver.pem      controller-manager.csr      front-proxy-ca-key.pem  front-proxy-client.pem      scheduler-key.pem
admin.pem      ca.csr             controller-manager-key.pem  front-proxy-ca.pem      sa.key                      scheduler.pem
apiserver.csr  ca-key.pem         controller-manager.pem      front-proxy-client.csr  sa.pub
[root@master2 kubernetes]# ls /etc/kubernetes/
admin.kubeconfig  controller-manager.kubeconfig  pki  scheduler.kubeconfig
```

## 第六章、 Kubernetes系统组件配置

### 6.1 Etcd配置

etcd配置大致相同，注意修改每个Master节点的etcd配置的主机名和IP地址。

#### 6.1.1 Master01

```java
cat > /etc/etcd/etcd.config.yml << EOF
name: 'master1.k8s.test'
data-dir: /var/lib/etcd
wal-dir: /var/lib/etcd/wal
snapshot-count: 5000
heartbeat-interval: 100
election-timeout: 1000
quota-backend-bytes: 0
listen-peer-urls: 'https://10.140.20.141:2380'
listen-client-urls: 'https://10.140.20.141:2379,http://127.0.0.1:2379'
max-snapshots: 3
max-wals: 5
cors:
initial-advertise-peer-urls: 'https://10.140.20.141:2380'
advertise-client-urls: 'https://10.140.20.141:2379'
discovery:
discovery-fallback: 'proxy'
discovery-proxy:
discovery-srv:
initial-cluster: 'master1.k8s.test=https://10.140.20.141:2380,master2.k8s.test=https://10.140.20.142:2380,master3.k8s.test=https://10.140.20.143:2380'
initial-cluster-token: 'etcd-k8s-cluster'
initial-cluster-state: 'new'
strict-reconfig-check: false
enable-v2: true
enable-pprof: true
proxy: 'off'
proxy-failure-wait: 5000
proxy-refresh-interval: 30000
proxy-dial-timeout: 1000
proxy-write-timeout: 5000
proxy-read-timeout: 0
client-transport-security:
  cert-file: '/etc/kubernetes/pki/etcd/etcd.pem'
  key-file: '/etc/kubernetes/pki/etcd/etcd-key.pem'
  client-cert-auth: true
  trusted-ca-file: '/etc/kubernetes/pki/etcd/etcd-ca.pem'
  auto-tls: true
peer-transport-security:
  cert-file: '/etc/kubernetes/pki/etcd/etcd.pem'
  key-file: '/etc/kubernetes/pki/etcd/etcd-key.pem'
  peer-client-cert-auth: true
  trusted-ca-file: '/etc/kubernetes/pki/etcd/etcd-ca.pem'
  auto-tls: true
debug: false
log-package-levels:
log-outputs: [default]
force-new-cluster: false
EOF
```

#### 6.1.2 Master02

```java
cat > /etc/etcd/etcd.config.yml << EOF
name: 'master2.k8s.test'
data-dir: /var/lib/etcd
wal-dir: /var/lib/etcd/wal
snapshot-count: 5000
heartbeat-interval: 100
election-timeout: 1000
quota-backend-bytes: 0
listen-peer-urls: 'https://10.140.20.142:2380'
listen-client-urls: 'https://10.140.20.142:2379,http://127.0.0.1:2379'
max-snapshots: 3
max-wals: 5
cors:
initial-advertise-peer-urls: 'https://10.140.20.142:2380'
advertise-client-urls: 'https://10.140.20.142:2379'
discovery:
discovery-fallback: 'proxy'
discovery-proxy:
discovery-srv:
initial-cluster: 'master1.k8s.test=https://10.140.20.141:2380,master2.k8s.test=https://10.140.20.142:2380,master3.k8s.test=https://10.140.20.143:2380'
initial-cluster-token: 'etcd-k8s-cluster'
initial-cluster-state: 'new'
strict-reconfig-check: false
enable-v2: true
enable-pprof: true
proxy: 'off'
proxy-failure-wait: 5000
proxy-refresh-interval: 30000
proxy-dial-timeout: 1000
proxy-write-timeout: 5000
proxy-read-timeout: 0
client-transport-security:
  cert-file: '/etc/kubernetes/pki/etcd/etcd.pem'
  key-file: '/etc/kubernetes/pki/etcd/etcd-key.pem'
  client-cert-auth: true
  trusted-ca-file: '/etc/kubernetes/pki/etcd/etcd-ca.pem'
  auto-tls: true
peer-transport-security:
  cert-file: '/etc/kubernetes/pki/etcd/etcd.pem'
  key-file: '/etc/kubernetes/pki/etcd/etcd-key.pem'
  peer-client-cert-auth: true
  trusted-ca-file: '/etc/kubernetes/pki/etcd/etcd-ca.pem'
  auto-tls: true
debug: false
log-package-levels:
log-outputs: [default]
force-new-cluster: false
EOF
```

#### 6.1.3 Master03

```java
cat > /etc/etcd/etcd.config.yml << EOF
name: 'master3.k8s.test'
data-dir: /var/lib/etcd
wal-dir: /var/lib/etcd/wal
snapshot-count: 5000
heartbeat-interval: 100
election-timeout: 1000
quota-backend-bytes: 0
listen-peer-urls: 'https://10.140.20.143:2380'
listen-client-urls: 'https://10.140.20.143:2379,http://127.0.0.1:2379'
max-snapshots: 3
max-wals: 5
cors:
initial-advertise-peer-urls: 'https://10.140.20.143:2380'
advertise-client-urls: 'https://10.140.20.143:2379'
discovery:
discovery-fallback: 'proxy'
discovery-proxy:
discovery-srv:
initial-cluster: 'master1.k8s.test=https://10.140.20.141:2380,master2.k8s.test=https://10.140.20.142:2380,master3.k8s.test=https://10.140.20.143:2380'
initial-cluster-token: 'etcd-k8s-cluster'
initial-cluster-state: 'new'
strict-reconfig-check: false
enable-v2: true
enable-pprof: true
proxy: 'off'
proxy-failure-wait: 5000
proxy-refresh-interval: 30000
proxy-dial-timeout: 1000
proxy-write-timeout: 5000
proxy-read-timeout: 0
client-transport-security:
  cert-file: '/etc/kubernetes/pki/etcd/etcd.pem'
  key-file: '/etc/kubernetes/pki/etcd/etcd-key.pem'
  client-cert-auth: true
  trusted-ca-file: '/etc/kubernetes/pki/etcd/etcd-ca.pem'
  auto-tls: true
peer-transport-security:
  cert-file: '/etc/kubernetes/pki/etcd/etcd.pem'
  key-file: '/etc/kubernetes/pki/etcd/etcd-key.pem'
  peer-client-cert-auth: true
  trusted-ca-file: '/etc/kubernetes/pki/etcd/etcd-ca.pem'
  auto-tls: true
debug: false
log-package-levels:
log-outputs: [default]
force-new-cluster: false
EOF
```

#### 6.1.4 创建Service

所有Master节点创建etcd service并启动

```java
cat > /usr/lib/systemd/system/etcd.service << EOF
[Unit]
Description=Etcd Service
Documentation=https://coreos.com/etcd/docs/latest/
After=network.target
[Service]
Type=notify
ExecStart=/usr/local/bin/etcd --config-file=/etc/etcd/etcd.config.yml
Restart=on-failure
RestartSec=10
LimitNOFILE=65536
[Install]
WantedBy=multi-user.target
Alias=etcd3.service
EOF
```

#### 6.1.5 所有Master节点创建etcd的证书目录

```java
mkdir /etc/kubernetes/pki/etcd
ln -s /etc/etcd/ssl/* /etc/kubernetes/pki/etcd/
systemctl daemon-reload
systemctl enable --now etcd
```

查看etcd状态

```java
export ETCDCTL_API=3
etcdctl --endpoints="10.140.20.143:2379,10.140.20.142:2379,10.140.20.141:2379" --cacert=/etc/kubernetes/pki/etcd/etcd-ca.pem --cert=/etc/kubernetes/pki/etcd/etcd.pem --key=/etc/kubernetes/pki/etcd/etcd-key.pem  endpoint status --write-out=table
+--------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
|      ENDPOINT      |        ID        | VERSION | DB SIZE | IS LEADER | IS LEARNER | RAFT TERM | RAFT INDEX | RAFT APPLIED INDEX | ERRORS |
+--------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
| 10.140.20.143:2379 | 2a5b796cadaf7df9 |   3.5.9 |   20 kB |      true |      false |         2 |          9 |                  9 |        |
| 10.140.20.142:2379 | 58b160318edea505 |   3.5.9 |   20 kB |     false |      false |         2 |          9 |                  9 |        |
| 10.140.20.141:2379 | ea4af3a294d72d25 |   3.5.9 |   20 kB |     false |      false |         2 |          9 |                  9 |        |
+--------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
```

## 第七章、高可用配置

高可用配置（注意：如果不是高可用集群，haproxy和keepalived无需安装）

如果在云上安装也无需执行此章节的步骤，可以直接使用云上的lb，比如阿里云slb，腾讯云elb等

公有云要用公有云自带的负载均衡，比如阿里云的SLB，腾讯云的ELB，用来替代haproxy和keepalived，因为公有云大部分都是不支持keepalived的，另外如果用阿里云的话，kubectl控制端不能放在master节点，推荐使用腾讯云，因为阿里云的slb有回环的问题，也就是slb代理的服务器不能反向访问SLB，但是腾讯云修复了这个问题。

Slb-> haproxy -> apiserver

所有Master节点安装keepalived和haproxy

```java
yum install keepalived haproxy -y
```

### 7.1 Haproxy配置，所有Master节点的配置是一样的。

```java
vim /etc/haproxy/haproxy.cfg
global
  maxconn  2000
  ulimit-n  16384
  log  127.0.0.1 local0 err
  stats timeout 30s
defaults
  log global
  mode  http
  option  httplog
  timeout connect 5000
  timeout client  50000
  timeout server  50000
  timeout http-request 15s
  timeout http-keep-alive 15s
frontend k8s-master
  bind 0.0.0.0:6443
  bind 127.0.0.1:6443
  mode tcp
  option tcplog
  tcp-request inspect-delay 5s
  default_backend k8s-master
backend k8s-master
  mode tcp
  option tcplog
  option tcp-check
  balance roundrobin
  default-server inter 10s downinter 5s rise 2 fall 2 slowstart 60s maxconn 250 maxqueue 256 weight 100
  server master1.k8s.test    10.140.20.141:6443  check
  server master2.k8s.test    10.140.20.142:6443  check
  server master3.k8s.test    10.140.20.143:6443  check
```

### 7.2 Master01 keepalived

所有Master节点配置KeepAlived，配置不一样,注意每个节点的IP和网卡（interface参数）

```java
vim /etc/keepalived/keepalived.conf
! Configuration File for keepalived
global_defs {
    router_id LVS_DEVEL
}
vrrp_script chk_apiserver {
    script "/etc/keepalived/check_apiserver.sh"
    interval 5 
    weight -5
    fall 2
    rise 1
}
vrrp_instance VI_1 {
    state MASTER
    interface eth0
    mcast_src_ip 10.140.20.141
    virtual_router_id 51
    priority 101
    nopreempt
    advert_int 2
    authentication {
        auth_type PASS
        auth_pass K8SHA_KA_AUTH
    }
    virtual_ipaddress {
        192.168.31.100
    }
    track_script {
      chk_apiserver 
} }
```

### 7.3 Master02 keepalived

```java
vim /etc/keepalived/keepalived.conf
! Configuration File for keepalived
global_defs {
    router_id LVS_DEVEL
}
vrrp_script chk_apiserver {
    script "/etc/keepalived/check_apiserver.sh"
    interval 5 
    weight -5
    fall 2
    rise 1
}
vrrp_instance VI_1 {
    state BACKUP
    interface eth0
    mcast_src_ip 10.140.20.142
    virtual_router_id 51
    priority 100
    nopreempt
    advert_int 2
    authentication {
        auth_type PASS
        auth_pass K8SHA_KA_AUTH
    }
    virtual_ipaddress {
        192.168.31.100
    }
    track_script {
      chk_apiserver 
} }
```

### 7.4 Master03 keepalived

```java
vim /etc/keepalived/keepalived.conf
! Configuration File for keepalived
global_defs {
    router_id LVS_DEVEL
}
vrrp_script chk_apiserver {
    script "/etc/keepalived/check_apiserver.sh"
    interval 5
    weight -5
    fall 2  
    rise 1
}
vrrp_instance VI_1 {
    state BACKUP
    interface eth0
    mcast_src_ip 10.140.20.143
    virtual_router_id 51
    priority 100
    nopreempt
    advert_int 2
    authentication {
        auth_type PASS
        auth_pass K8SHA_KA_AUTH
    }
    virtual_ipaddress {
        192.168.31.100
    }
    track_script {
      chk_apiserver 
} }
```

### 7.5 健康检查配置

所有Master节点：

```java
vim /etc/keepalived/check_apiserver.sh 
#!/bin/bash
err=0
for k in $(seq 1 3)
do
    check_code=$(pgrep haproxy)
    if [[ $check_code == "" ]]; then
        err=$(expr $err + 1)
        sleep 1
        continue
    else
        err=0
        break
    fi
done
if [[ $err != "0" ]]; then
    echo "systemctl stop keepalived"
    /usr/bin/systemctl stop keepalived
    exit 1
else
    exit 0
fi
chmod +x /etc/keepalived/check_apiserver.sh
```

所有master节点启动haproxy和keepalived：

```java
systemctl daemon-reload
systemctl enable --now haproxy
systemctl enable --now keepalived
```

### 7.6 VIP测试

```java
[root@master1 ~]# ping 192.168.31.100
PING 192.168.31.100 (192.168.31.100) 56(84) bytes of data.
64 bytes from 192.168.31.100: icmp_seq=1 ttl=64 time=0.041 ms
64 bytes from 192.168.31.100: icmp_seq=2 ttl=64 time=0.054 ms
64 bytes from 192.168.31.100: icmp_seq=3 ttl=64 time=0.067 ms
64 bytes from 192.168.31.100: icmp_seq=4 ttl=64 time=0.033 ms
[root@master1 ~]# telnet  192.168.31.100 6443
Trying 192.168.31.100...
Connected to 192.168.31.100.
Escape character is '^]'.
Connection closed by foreign host.
```

如果ping不通且telnet没有出现 ]，则认为VIP不可以，不可在继续往下执行，需要排查keepalived的问题，比如防火墙和selinux，haproxy和keepalived的状态，监听端口等

所有节点查看防火墙状态必须为disable和inactive：systemctl status firewalld

所有节点查看selinux状态，必须为disable：getenforce

master节点查看haproxy和keepalived状态：systemctl status keepalived haproxy

master节点查看监听端口：netstat -lntp

## 第八章 Kubernetes组件配置

所有节点创建相关目录

```java
mkdir -p /etc/kubernetes/manifests/ /etc/systemd/system/kubelet.service.d /var/lib/kubelet /var/log/kubernetes
```

### 8.1 Apiserver

所有Master节点创建kube-apiserver service，# 注意，如果不是高可用集群，10.140.20.141改为master01的地址

#### 8.1.1 Master01 配置

注意本文档使用的K8s service 网段为 10.96.0.0/16，该网段不能和宿主机的网段、Pod网段的重复，请按需修改

```java
cat > /usr/lib/systemd/system/kube-apiserver.service << EOF
[Unit]
Description=Kubernetes API Server
Documentation=https://github.com/kubernetes/kubernetes
After=network.target
[Service]
ExecStart=/usr/local/bin/kube-apiserver --v=2 --logtostderr=true --allow-privileged=true --bind-address=0.0.0.0 --secure-port=6443 --insecure-port=0 --advertise-address=10.140.20.141 --service-cluster-ip-range=10.96.0.0/16 --service-node-port-range=30000-32767 --etcd-servers=https://10.140.20.141:2379,https://10.140.20.142:2379,https://10.140.20.143:2379 --etcd-cafile=/etc/etcd/ssl/etcd-ca.pem --etcd-certfile=/etc/etcd/ssl/etcd.pem --etcd-keyfile=/etc/etcd/ssl/etcd-key.pem --client-ca-file=/etc/kubernetes/pki/ca.pem --tls-cert-file=/etc/kubernetes/pki/apiserver.pem --tls-private-key-file=/etc/kubernetes/pki/apiserver-key.pem --kubelet-client-certificate=/etc/kubernetes/pki/apiserver.pem --kubelet-client-key=/etc/kubernetes/pki/apiserver-key.pem --service-account-key-file=/etc/kubernetes/pki/sa.pub --service-account-signing-key-file=/etc/kubernetes/pki/sa.key --service-account-issuer=https://kubernetes.default.svc.cluster.local --kubelet-preferred-address-types=InternalIP,ExternalIP,Hostname --enable-admission-plugins=NamespaceLifecycle,LimitRanger,ServiceAccount,DefaultStorageClass,DefaultTolerationSeconds,NodeRestriction,ResourceQuota --authorization-mode=Node,RBAC --enable-bootstrap-token-auth=true --requestheader-client-ca-file=/etc/kubernetes/pki/front-proxy-ca.pem --proxy-client-cert-file=/etc/kubernetes/pki/front-proxy-client.pem --proxy-client-key-file=/etc/kubernetes/pki/front-proxy-client-key.pem --requestheader-allowed-names=aggregator --requestheader-group-headers=X-Remote-Group --requestheader-extra-headers-prefix=X-Remote-Extra- --requestheader-username-headers=X-Remote-User
Restart=on-failure
RestartSec=10s
LimitNOFILE=65535
[Install]
WantedBy=multi-user.target
EOF
```

#### 8.1.2 Master02配置

注意本文档使用的K8s service 网段为 10.96.0.0/16，该网段不能和宿主机的网段、Pod网段的重复，请按需修改

```java
[root@master2 ~]# cat > /usr/lib/systemd/system/kube-apiserver.service << EOF
[Unit]
Description=Kubernetes API Server
Documentation=https://github.com/kubernetes/kubernetes
After=network.target
[Service]
ExecStart=/usr/local/bin/kube-apiserver --v=2 --logtostderr=true --allow-privileged=true --bind-address=0.0.0.0 --secure-port=6443 --insecure-port=0 --advertise-address=10.140.20.142 --service-cluster-ip-range=10.96.0.0/16 --service-node-port-range=30000-32767 --etcd-servers=https://10.140.20.141:2379,https://10.140.20.142:2379,https://10.140.20.143:2379 --etcd-cafile=/etc/etcd/ssl/etcd-ca.pem --etcd-certfile=/etc/etcd/ssl/etcd.pem --etcd-keyfile=/etc/etcd/ssl/etcd-key.pem --client-ca-file=/etc/kubernetes/pki/ca.pem --tls-cert-file=/etc/kubernetes/pki/apiserver.pem --tls-private-key-file=/etc/kubernetes/pki/apiserver-key.pem --kubelet-client-certificate=/etc/kubernetes/pki/apiserver.pem --kubelet-client-key=/etc/kubernetes/pki/apiserver-key.pem --service-account-key-file=/etc/kubernetes/pki/sa.pub --service-account-signing-key-file=/etc/kubernetes/pki/sa.key --service-account-issuer=https://kubernetes.default.svc.cluster.local --kubelet-preferred-address-types=InternalIP,ExternalIP,Hostname --enable-admission-plugins=NamespaceLifecycle,LimitRanger,ServiceAccount,DefaultStorageClass,DefaultTolerationSeconds,NodeRestriction,ResourceQuota --authorization-mode=Node,RBAC --enable-bootstrap-token-auth=true --requestheader-client-ca-file=/etc/kubernetes/pki/front-proxy-ca.pem --proxy-client-cert-file=/etc/kubernetes/pki/front-proxy-client.pem --proxy-client-key-file=/etc/kubernetes/pki/front-proxy-client-key.pem --requestheader-allowed-names=aggregator --requestheader-group-headers=X-Remote-Group --requestheader-extra-headers-prefix=X-Remote-Extra- --requestheader-username-headers=X-Remote-User
Restart=on-failure
RestartSec=10s
LimitNOFILE=65535
[Install]
WantedBy=multi-user.target
EOF
```

#### 8.1.3 Master03 配置

注意本文档使用的K8s service 网段为 10.96.0.0/16，该网段不能和宿主机的网段、Pod网段的重复，请按需修改

```java
[root@master3 pki]# cat > /usr/lib/systemd/system/kube-apiserver.service <<EOF
[Unit]
Description=Kubernetes API Server
Documentation=https://github.com/kubernetes/kubernetes
After=network.target
[Service]
ExecStart=/usr/local/bin/kube-apiserver --v=2 --logtostderr=true --allow-privileged=true --bind-address=0.0.0.0 --secure-port=6443 --insecure-port=0 --advertise-address=10.140.20.143 --service-cluster-ip-range=10.96.0.0/16 --service-node-port-range=30000-32767 --etcd-servers=https://10.140.20.141:2379,https://10.140.20.142:2379,https://10.140.20.143:2379 --etcd-cafile=/etc/etcd/ssl/etcd-ca.pem --etcd-certfile=/etc/etcd/ssl/etcd.pem --etcd-keyfile=/etc/etcd/ssl/etcd-key.pem --client-ca-file=/etc/kubernetes/pki/ca.pem --tls-cert-file=/etc/kubernetes/pki/apiserver.pem --tls-private-key-file=/etc/kubernetes/pki/apiserver-key.pem --kubelet-client-certificate=/etc/kubernetes/pki/apiserver.pem --kubelet-client-key=/etc/kubernetes/pki/apiserver-key.pem --service-account-key-file=/etc/kubernetes/pki/sa.pub --service-account-signing-key-file=/etc/kubernetes/pki/sa.key --service-account-issuer=https://kubernetes.default.svc.cluster.local --kubelet-preferred-address-types=InternalIP,ExternalIP,Hostname --enable-admission-plugins=NamespaceLifecycle,LimitRanger,ServiceAccount,DefaultStorageClass,DefaultTolerationSeconds,NodeRestriction,ResourceQuota --authorization-mode=Node,RBAC --enable-bootstrap-token-auth=true --requestheader-client-ca-file=/etc/kubernetes/pki/front-proxy-ca.pem --proxy-client-cert-file=/etc/kubernetes/pki/front-proxy-client.pem --proxy-client-key-file=/etc/kubernetes/pki/front-proxy-client-key.pem --requestheader-allowed-names=aggregator --requestheader-group-headers=X-Remote-Group --requestheader-extra-headers-prefix=X-Remote-Extra- --requestheader-username-headers=X-Remote-User
Restart=on-failure
RestartSec=10s
LimitNOFILE=65535
[Install]
WantedBy=multi-user.target
EOF
```

#### 8.1.4 启动apiserver

所有master节点启动kube-apiserver

```java
systemctl daemon-reload && systemctl enable --now kube-apiserver
```

检测kube-server状态

```java
systemctl status kube-apiserver
```

### 8.2 ControllerManager

所有Master节点配置kube-controller-manager service（所有master节点配置一样）

注意本文档使用的k8s Pod网段为10.244.0.0/16，该网段不能和宿主机的网段、k8s Service网段的重复，请按需修改

```java
[root@master1 ~]# cat > /usr/lib/systemd/system/kube-controller-manager.service
[Unit]
Description=Kubernetes Controller Manager
Documentation=https://github.com/kubernetes/kubernetes
After=network.target
[Service]
ExecStart=/usr/local/bin/kube-controller-manager --v=2 --logtostderr=true --address=127.0.0.1 --root-ca-file=/etc/kubernetes/pki/ca.pem --cluster-signing-cert-file=/etc/kubernetes/pki/ca.pem --cluster-signing-key-file=/etc/kubernetes/pki/ca-key.pem --service-account-private-key-file=/etc/kubernetes/pki/sa.key --kubeconfig=/etc/kubernetes/controller-manager.kubeconfig --leader-elect=true --use-service-account-credentials=true --node-monitor-grace-period=40s --node-monitor-period=5s --pod-eviction-timeout=2m0s --controllers=*,bootstrapsigner,tokencleaner --allocate-node-cidrs=true --cluster-cidr=10.244.0.0/16 --requestheader-client-ca-file=/etc/kubernetes/pki/front-proxy-ca.pem --node-cidr-mask-size=24
Restart=always
RestartSec=10s
[Install]
WantedBy=multi-user.target
```

所有Master节点启动kube-controller-manager:

```java
systemctl daemon-reload
systemctl enable --now kube-controller-manager
```

查看启动状态：

```java
[root@master1 ~]# systemctl status kube-controller-manager
```

### 8.3 Scheduler

所有Master节点配置kube-scheduler service（所有master节点配置一样）

```java
[root@master1 ~]# vim /usr/lib/systemd/system/kube-scheduler.service 
[Unit]
Description=Kubernetes Scheduler
Documentation=https://github.com/kubernetes/kubernetes
After=network.target
[Service]
ExecStart=/usr/local/bin/kube-scheduler --v=2 --logtostderr=true --address=127.0.0.1 --leader-elect=true --kubeconfig=/etc/kubernetes/scheduler.kubeconfig
Restart=always
RestartSec=10s
[Install]
WantedBy=multi-user.target
[root@master1 ~]# systemctl daemon-reload
[root@master1 ~]# systemctl enable --now kube-scheduler
```

## 第九章 TLS Bootstrapping配置

只需要在Master01创建bootstrap

#注意，如果不是高可用集群，10.140.20.141:6443改为master01的地址，6443改为apiserver的端口，默认是6443

```java
cd /root/k8s-ha-install/bootstrap
kubectl config set-cluster kubernetes --certificate-authority=/etc/kubernetes/pki/ca.pem --embed-certs=true --server=https://10.140.20.141:6443 --kubeconfig=/etc/kubernetes/bootstrap-kubelet.kubeconfig
kubectl config set-credentials tls-bootstrap-token-user --token=c8ad9c.2e4d610cf3e7426e --kubeconfig=/etc/kubernetes/bootstrap-kubelet.kubeconfig
kubectl config set-context tls-bootstrap-token-user@kubernetes --cluster=kubernetes --user=tls-bootstrap-token-user --kubeconfig=/etc/kubernetes/bootstrap-kubelet.kubeconfig
kubectl config use-context tls-bootstrap-token-user@kubernetes --kubeconfig=/etc/kubernetes/bootstrap-kubelet.kubeconfig
```

注意：如果要修改bootstrap.secret.yaml的token-id和token-secret，需要保证下图红圈内的字符串一致的，并且位数是一样的。还要保证上个命令的token：c8ad9c.2e4d610cf3e7426e与你修改的字符串要一致

```java
[root@master1 bootstrap]# mkdir -p /root/.kube ; cp /etc/kubernetes/admin.kubeconfig /root/.kube/config
```

可以正常查询集群状态，才可以继续往下，否则不行，需要排查k8s组件是否有故障

```java
[root@master1 bootstrap]# kubectl get cs
Warning: v1 ComponentStatus is deprecated in v1.19+
NAME                 STATUS    MESSAGE                         ERROR
scheduler            Healthy   ok                              
controller-manager   Healthy   ok                              
etcd-1               Healthy   {
     "health":"true","reason":""}   
etcd-0               Healthy   {
     "health":"true","reason":""}   
etcd-2               Healthy   {
     "health":"true","reason":""}    
[root@master1 bootstrap]# kubectl create -f bootstrap.secret.yaml 
secret/bootstrap-token-c8ad9c created
clusterrolebinding.rbac.authorization.k8s.io/kubelet-bootstrap created
clusterrolebinding.rbac.authorization.k8s.io/node-autoapprove-bootstrap created
clusterrolebinding.rbac.authorization.k8s.io/node-autoapprove-certificate-rotation created
clusterrole.rbac.authorization.k8s.io/system:kube-apiserver-to-kubelet created
clusterrolebinding.rbac.authorization.k8s.io/system:kube-apiserver created
```

## 第十章 Node节点配置

### 10.1 复制证书

Master01节点复制证书至Node节点

```java
cd /etc/kubernetes/
for NODE in master2.k8s.test master3.k8s.test node1.k8s.test; do
     ssh $NODE mkdir -p /etc/kubernetes/pki
     for FILE in pki/ca.pem pki/ca-key.pem pki/front-proxy-ca.pem bootstrap-kubelet.kubeconfig; do
       scp /etc/kubernetes/$FILE $NODE:/etc/kubernetes/${FILE}
 done
 done
```

检查证书文件：

```java
[root@node1 kubernetes]# pwd
/etc/kubernetes
[root@k8s-node01 kubernetes]# tree
.
├── bootstrap-kubelet.kubeconfig
├── manifests
└── pki
    ├── ca-key.pem
    ├── ca.pem
    └── front-proxy-ca.pem
2 directories, 4 files
[root@k8s-node01 kubernetes]# 
```

### 10.2 Kubelet配置

所有节点创建相关目录（如果存在，忽略）

```java
mkdir -p /var/lib/kubelet /var/log/kubernetes /etc/systemd/system/kubelet.service.d /etc/kubernetes/manifests/
```

- 所有节点配置Kubelet service

```java
[root@master1 ~]# cat > /usr/lib/systemd/system/kubelet.service <<EOF
[Unit]
Description=Kubernetes Kubelet
Documentation=https://github.com/kubernetes/kubernetes
After=docker.service
Requires=docker.service
[Service]
EnvironmentFile=/etc/systemd/system/kubelet.service.d/10-kubelet.conf
ExecStart=/usr/local/bin/kubelet \$KUBELET_OPTS
Restart=always
StartLimitInterval=0
RestartSec=10
[Install]
WantedBy=multi-user.target
EOF
```

- 所有节点配置kubelet service的配置文件

```java
mkdir -p /etc/cni/net.d
cat > /etc/systemd/system/kubelet.service.d/10-kubelet.conf <<EOF
KUBELET_OPTS="--bootstrap-kubeconfig=/etc/kubernetes/bootstrap-kubelet.kubeconfig --kubeconfig=/etc/kubernetes/kubelet.kubeconfig --network-plugin=cni --cni-conf-dir=/etc/cni/net.d --cni-bin-dir=/opt/cni/bin --config=/etc/kubernetes/kubelet-conf.yml --pod-infra-container-image=registry.cn-hangzhou.aliyuncs.com/google_containers/pause:3.5 --node-labels=node.kubernetes.io/node='' --logtostderr=true --v=2"
EOF
```

- 所有节点创建kubelet的配置文件

**注意：如果更改了k8s的service网段，需要更改kubelet-conf.yml 的clusterDNS:配置，改成k8s Service网段的第十个地址，比如10.96.0.10**

```java
cat > /etc/kubernetes/kubelet-conf.yml <<EOF
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration
address: 0.0.0.0
port: 10250
readOnlyPort: 10255
authentication:
  anonymous:
    enabled: false
  webhook:
    cacheTTL: 2m0s
    enabled: true
  x509:
    clientCAFile: /etc/kubernetes/pki/ca.pem
authorization:
  mode: Webhook
  webhook:
    cacheAuthorizedTTL: 5m0s
    cacheUnauthorizedTTL: 30s
cgroupDriver: systemd
cgroupsPerQOS: true
clusterDNS:
- 10.96.0.10
clusterDomain: cluster.local
containerLogMaxFiles: 5
containerLogMaxSize: 10Mi
contentType: application/vnd.kubernetes.protobuf
cpuCFSQuota: true
cpuManagerPolicy: none
cpuManagerReconcilePeriod: 10s
enableControllerAttachDetach: true
enableDebuggingHandlers: true
enforceNodeAllocatable:
- pods
eventBurst: 10
eventRecordQPS: 5
evictionHard:
  imagefs.available: 15%
  memory.available: 100Mi
  nodefs.available: 10%
  nodefs.inodesFree: 5%
evictionPressureTransitionPeriod: 5m0s
failSwapOn: true
fileCheckFrequency: 20s
hairpinMode: promiscuous-bridge
healthzBindAddress: 127.0.0.1
healthzPort: 10248
httpCheckFrequency: 20s
imageGCHighThresholdPercent: 85
imageGCLowThresholdPercent: 80
imageMinimumGCAge: 2m0s
iptablesDropBit: 15
iptablesMasqueradeBit: 14
kubeAPIBurst: 10
kubeAPIQPS: 5
makeIPTablesUtilChains: true
maxOpenFiles: 1000000
maxPods: 110
nodeStatusUpdateFrequency: 10s
oomScoreAdj: -999
podPidsLimit: -1
registryBurst: 10
registryPullQPS: 5
resolvConf: /etc/resolv.conf
rotateCertificates: true
runtimeRequestTimeout: 2m0s
serializeImagePulls: true
staticPodPath: /etc/kubernetes/manifests
streamingConnectionIdleTimeout: 4h0m0s
syncFrequency: 1m0s
volumeStatsAggPeriod: 1m0s
EOF
```

- 启动所有节点kubelet

```java
systemctl daemon-reload
systemctl enable --now kubelet
```

- 查看集群状态

```java
[root@master1 ~]# kubectl get nodes
NAME               STATUS     ROLES    AGE   VERSION
master1.k8s.test   NotReady   <none>   11m   v1.22.17
master2.k8s.test   NotReady   <none>   46s   v1.22.17
master3.k8s.test   NotReady   <none>   48s   v1.22.17
node1.k8s.test     NotReady   <none>   51s   v1.22.17
```

注：由于网络插件还没有部署，节点会没有准备就绪 NotReady。

### 10.3 kube-proxy配置

#注意，如果不是高可用集群，10.140.20.141:6443改为master01的地址，6443改为apiserver的端口，默认是6443

- 创建kube-proxy.kubeconfig文件，只需要在Master01上执行

```java
kubectl -n kube-system create serviceaccount kube-proxy
kubectl create clusterrolebinding system:kube-proxy --clusterrole system:node-proxier --serviceaccount kube-system:kube-proxy
SECRET=$(kubectl -n kube-system get sa/kube-proxy --output=jsonpath='{.secrets[0].name}')
JWT_TOKEN=$(kubectl -n kube-system get secret/$SECRET --output=jsonpath='{.data.token}' | base64 -d)
PKI_DIR=/etc/kubernetes/pki
K8S_DIR=/etc/kubernetes
kubectl config set-cluster kubernetes --certificate-authority=/etc/kubernetes/pki/ca.pem --embed-certs=true --server=https://10.140.20.141:6443   --kubeconfig=${K8S_DIR}/kube-proxy.kubeconfig
kubectl config set-credentials kubernetes --token=${JWT_TOKEN} --kubeconfig=/etc/kubernetes/kube-proxy.kubeconfig
kubectl config set-context kubernetes --cluster=kubernetes --user=kubernetes --kubeconfig=/etc/kubernetes/kube-proxy.kubeconfig
kubectl config use-context kubernetes --kubeconfig=/etc/kubernetes/kube-proxy.kubeconfig
```

- 将kubeconfig发送至其他节点

```java
for NODE in master2.k8s.test master3.k8s.test node1.k8s.test; do
     scp /etc/kubernetes/kube-proxy.kubeconfig  $NODE:/etc/kubernetes/kube-proxy.kubeconfig
 done
```

- 所有节点添加kube-proxy的配置和service文件

```java
cat > /usr/lib/systemd/system/kube-proxy.service << EOF
[Unit]
Description=Kubernetes Kube Proxy
Documentation=https://github.com/kubernetes/kubernetes
After=network.target
[Service]
ExecStart=/usr/local/bin/kube-proxy --config=/etc/kubernetes/kube-proxy.yaml --v=2
Restart=always
RestartSec=10s
[Install]
WantedBy=multi-user.target
EOF
```

如果更改了集群Pod的网段，需要更改kube-proxy.yaml的clusterCIDR为自己的Pod网段：

```java
cat > /etc/kubernetes/kube-proxy.yaml << EOF
apiVersion: kubeproxy.config.k8s.io/v1alpha1
bindAddress: 0.0.0.0
clientConnection:
  acceptContentTypes: ""
  burst: 10
  contentType: application/vnd.kubernetes.protobuf
  kubeconfig: /etc/kubernetes/kube-proxy.kubeconfig
  qps: 5
clusterCIDR: 10.244.0.0/16 
configSyncPeriod: 15m0s
conntrack:
  max: null
  maxPerCore: 32768
  min: 131072
  tcpCloseWaitTimeout: 1h0m0s
  tcpEstablishedTimeout: 24h0m0s
enableProfiling: false
healthzBindAddress: 0.0.0.0:10256
hostnameOverride: ""
iptables:
  masqueradeAll: false
  masqueradeBit: 14
  minSyncPeriod: 0s
  syncPeriod: 30s
ipvs:
  masqueradeAll: true
  minSyncPeriod: 5s
  scheduler: "rr"
  syncPeriod: 30s
kind: KubeProxyConfiguration
metricsBindAddress: 127.0.0.1:10249
mode: "ipvs"
nodePortAddresses: null
oomScoreAdj: -999
portRange: ""
udpIdleTimeout: 250ms
EOF
```

- 所有节点启动kube-proxy

```java
systemctl daemon-reload
systemctl enable --now kube-proxy
systemctl status kube-proxy
```

## 第十一章 安装Calico

### 11.1 安装官方推荐版本

以下步骤只在Master01上执行

```java
cd /root/k8s-ha-install/calico/
# 更改calico的网段，改为自己的Pod的网段
sed -i "s#POD_CIDR#10.244.0.0/16#g" calico.yaml
```

更改后如下所示：

```java
[root@master1 calico]#  grep "IPV4POOL_CIDR" calico.yaml  -A 1
            - name: CALICO_IPV4POOL_CIDR
              value: "10.244.0.0/16"
```

安装calico

```java
kubectl apply -f calico.yaml
#查看容器状态
[root@master1 calico]# kubectl get pods -A
NAMESPACE     NAME                                       READY   STATUS    RESTARTS   AGE
kube-system   calico-kube-controllers-66686fdb54-qnsnn   1/1     Running   0          42s
kube-system   calico-node-2hm5d                          1/1     Running   0          42s
kube-system   calico-node-lbt6k                          1/1     Running   0          42s
kube-system   calico-node-pm8r9                          1/1     Running   0          42s
kube-system   calico-node-vxvd5                          1/1     Running   0          42s
kube-system   calico-typha-67c6dc57d6-96qjq              1/1     Running   0          42s
kube-system   calico-typha-67c6dc57d6-h8rqw              1/1     Running   0          42s
kube-system   calico-typha-67c6dc57d6-z6qlj              1/1     Running   0          42s
[root@master1 calico]# kubectl get nodes
NAME               STATUS   ROLES    AGE   VERSION
master1.k8s.test   Ready    <none>   73m   v1.22.17
master2.k8s.test   Ready    <none>   62m   v1.22.17
master3.k8s.test   Ready    <none>   62m   v1.22.17
node1.k8s.test     Ready    <none>   62m   v1.22.17
```

如果容器状态异常可以使用kubectl describe 或者kubectl logs查看容器的日志。

## 第十二章 安装CoreDNS

### 12.1 安装官方推荐版本(推荐)

```java
#如果更改了k8s service的网段需要将coredns的serviceIP改成k8s service网段的第十个IP
cd /root/k8s-ha-install/
COREDNS_SERVICE_IP=kubectl get svc | grep kubernetes | awk '{print $3}'0
sed -i "s#192.168.0.10#${COREDNS_SERVICE_IP}#g" CoreDNS/coredns.yaml
#安装Coredns
[root@master1.k8s.test k8s-ha-install]# kubectl  create -f CoreDNS/coredns.yaml
serviceaccount/coredns created
clusterrole.rbac.authorization.k8s.io/system:coredns created
clusterrolebinding.rbac.authorization.k8s.io/system:coredns created
configmap/coredns created
deployment.apps/coredns created
service/kube-dns created
#检查Pod运作状况
[root@master1.k8s.test k8s-ha-install]# kubectl get pods -n kube-system -l k8s-app=kube-dns
NAME                      READY   STATUS    RESTARTS   AGE
coredns-7684f7549-jqnch   1/1     Running   0          30s
[root@master1.k8s.test k8s-ha-install]# kubectl get svc -n kube-system -l k8s-app=kube-dns
NAME       TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)                  AGE
kube-dns   ClusterIP   10.96.0.10   <none>        53/UDP,53/TCP,9153/TCP   54s
```

### 12.2 安装最新版CoreDNS

```java
COREDNS_SERVICE_IP=kubectl get svc | grep kubernetes | awk '{print $3}'0
git clone https://github.com/coredns/deployment.git
cd deployment/kubernetes
# ./deploy.sh -s -i ${COREDNS_SERVICE_IP} | kubectl apply -f -
serviceaccount/coredns created
clusterrole.rbac.authorization.k8s.io/system:coredns created
clusterrolebinding.rbac.authorization.k8s.io/system:coredns created
configmap/coredns created
deployment.apps/coredns created
service/kube-dns created
查看状态
 kubectl get po -n kube-system -l k8s-app=kube-dns
NAME                       READY   STATUS    RESTARTS   AGE
coredns-85b4878f78-h29kh   1/1     Running   0          8h
```

## 第十三章 安装Metrics Server

在新版的Kubernetes中系统资源的采集均使用Metrics-server，可以通过Metrics采集节点和Pod的内存、磁盘、CPU和网络的使用率。

安装metrics server

```java
#没有安装之前，查看
[root@master1 ~]# kubectl api-resources|grep metrics
[root@master1 ~]# kubectl api-resources|grep metrics|wc -l
0
# 安装
cd /root/k8s-ha-install/metrics-server
kubectl  create -f .
serviceaccount/metrics-server created
clusterrole.rbac.authorization.k8s.io/system:aggregated-metrics-reader created
clusterrole.rbac.authorization.k8s.io/system:metrics-server created
rolebinding.rbac.authorization.k8s.io/metrics-server-auth-reader created
clusterrolebinding.rbac.authorization.k8s.io/metrics-server:system:auth-delegator created
clusterrolebinding.rbac.authorization.k8s.io/system:metrics-server created
service/metrics-server created
deployment.apps/metrics-server created
apiservice.apiregistration.k8s.io/v1beta1.metrics.k8s.io created
#安装之后，查看
[root@master1.k8s.test metrics-server]# kubectl get pods -n kube-system -l k8s-app=metrics-server
NAME                              READY   STATUS    RESTARTS   AGE
metrics-server-5c8b499fd7-hvnz7   1/1     Running   0          41s
[root@master1.k8s.test metrics-server]# kubectl api-resources|grep metrics
nodes                                          metrics.k8s.io/v1beta1                 false        NodeMetrics
pods                                           metrics.k8s.io/v1beta1                 true         PodMetrics
#等待metrics server启动然后查看状态
[root@master1 metrics-server]# kubectl top nodes
NAME               CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%   
master1.k8s.test   189m         2%     2021Mi          6%        
master2.k8s.test   158m         1%     1154Mi          3%        
master3.k8s.test   149m         1%     1214Mi          3%        
node1.k8s.test     85m          1%     691Mi           2% 
```

## 第十四章 集群验证

验证步骤：

**1、** Pod必须能解析Service；

**2、** Pod必须能解析跨namespace的Service；

**3、** 每个节点都必须要能访问Kubernetes的kubernetessvc443和kube-dns的service53；

**4、** Pod和Pod之间要能通；

a) 同namespace能通信

b） 跨namespace能通信

c) 跨机器能通信

- 安装busybox和nginx进行验证

```java
cat<<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: busybox
  namespace: default
spec:
  containers:
  - name: busybox
    image: busybox:1.28
    command:
      - sleep
      - "3600"
    imagePullPolicy: IfNotPresent
  restartPolicy: Always
EOF
[root@master1.k8s.test ~]# kubectl create deploy nginx --image=nginx --replicas=2
```

验证：

```java
[root@master1 ~]# kubectl get pods -o wide
NAME                     READY   STATUS    RESTARTS   AGE   IP              NODE           NOMINATED NODE   READINESS GATES
busybox                  1/1     Running   0          54m   10.244.32.130   master1.k8s.test   <none>           <none>
nginx-6799fc88d8-9hvr8   1/1     Running   0          53m   10.244.85.193   k8s-node01     <none>           <none>
nginx-6799fc88d8-vzzg7   1/1     Running   0          53m   10.244.58.196   k8s-node02     <none>           <none>
[root@master1 ~]# ping 10.244.85.193
PING 10.244.85.193 (10.244.85.193) 56(84) bytes of data.
64 bytes from 10.244.85.193: icmp_seq=1 ttl=63 time=0.766 ms
64 bytes from 10.244.85.193: icmp_seq=2 ttl=63 time=0.231 ms
64 bytes from 10.244.85.193: icmp_seq=3 ttl=63 time=0.374 ms
64 bytes from 10.244.85.193: icmp_seq=4 ttl=63 time=1.75 ms
64 bytes from 10.244.85.193: icmp_seq=5 ttl=63 time=0.560 ms
[root@master1.k8s.test ~]# ping 10.244.58.196
PING 10.244.58.196 (10.244.58.196) 56(84) bytes of data.
64 bytes from 10.244.58.196: icmp_seq=1 ttl=63 time=3.34 ms
64 bytes from 10.244.58.196: icmp_seq=2 ttl=63 time=0.364 ms
64 bytes from 10.244.58.196: icmp_seq=3 ttl=63 time=0.270 ms
[root@master1 ~]# telnet  10.96.0.10 53
Trying 10.96.0.10...
Connected to 10.96.0.10.
Escape character is '^]'.
[root@master1.k8s.test ~]# kubectl exec busybox -n default -- nslookup kubernetes
Server:    10.96.0.10
Address 1: 10.96.0.10 kube-dns.kube-system.svc.cluster.local
Name:      kubernetes
Address 1: 10.96.0.1 kubernetes.default.svc.cluster.local
[root@master1.k8s.test ~]# kubectl exec busybox -n default -- nslookup kube-dns.kube-system
Server:    10.96.0.10
Address 1: 10.96.0.10 kube-dns.kube-system.svc.cluster.local
Name:      kube-dns.kube-system
Address 1: 10.96.0.10 kube-dns.kube-system.svc.cluster.local
```

## 第十五章 安装dashboard

### 15.1 Dashboard部署

Dashboard用于展示集群中的各类资源，同时也可以通过Dashboard实时查看Pod的日志和在容器中执行一些命令等。

#### 15.1.1 安装指定版本的dashboard

```java
[root@master1 ~]# cd /root/k8s-ha-install/dashboard/
[root@master1 dashboard]# ls
dashboard-user.yaml  dashboard.yaml
[root@master1 dashboard]# kubectl create -f .
```

#### 15.1.2 安装最新版

官方GitHub地址：https://github.com/kubernetes/dashboard

可以在官方dashboard查看到最新版dashboard

```java
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.0.3/aio/deploy/recommended.yaml
#创建管理员用户
vim admin.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: admin-user
  namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding 
metadata: 
  name: admin-user
  annotations:
    rbac.authorization.kubernetes.io/autoupdate: "true"
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- kind: ServiceAccount
  name: admin-user
  namespace: kube-system
#创建
kubectl apply -f admin.yaml -n kube-system
```

#### 15.1.3 登录Dashboard

在谷歌浏览器（Chrome）启动文件中加入启动参数，用于解决无法访问Dashboard的问题，参考图1-1：

```java
--test-type --ignore-certificate-errors
```

更改dashboard的svc为NodePort类型

```java
kubectl edit svc kubernetes-dashboard -n kubernetes-dashboard
```

（如果已经为NodePort 忽略此步骤）

查看端口号：

```java
[root@master1 ~]# kubectl get svc kubernetes-dashboard -n kubernetes-dashboard
NAME                   TYPE       CLUSTER-IP     EXTERNAL-IP   PORT(S)         AGE
kubernetes-dashboard   NodePort   10.96.62.177   <none>        443:30533/TCP   6m16s
[root@master1.k8s.test ~]# 
```

根据自己的实例端口号，通过任意安装了kube-proxy的宿主机的IP+端口即可访问到dashboard：

访问Dashboard：[https://10.140.20.141:30533（请更改30533为自己的端口），选择登录方式为令牌（即token方式）](https://10.140.20.141:30533%EF%BC%88%E8%AF%B7%E6%9B%B4%E6%94%B930533%E4%B8%BA%E8%87%AA%E5%B7%B1%E7%9A%84%E7%AB%AF%E5%8F%A3%EF%BC%89%EF%BC%8C%E9%80%89%E6%8B%A9%E7%99%BB%E5%BD%95%E6%96%B9%E5%BC%8F%E4%B8%BA%E4%BB%A4%E7%89%8C%EF%BC%88%E5%8D%B3token%E6%96%B9%E5%BC%8F%EF%BC%89/)

查看token值：

```java
[root@master1 ~]# kubectl -n kube-system describe secret $(kubectl -n kube-system get secret | grep admin-user | awk '{print $1}')
Name:         admin-user-token-6w689
Namespace:    kube-system
Labels:       <none>
Annotations:  kubernetes.io/service-account.name: admin-user
              kubernetes.io/service-account.uid: 2b2757c1-8740-46df-ae76-e9b439d45bbf
Type:  kubernetes.io/service-account-token
Data
====
ca.crt:     1411 bytes
namespace:  11 bytes
token:      eyJhbGciOiJSUzI1NiIsImtpZCI6IjJIX2RlNVhlV3gxVzRyZmhrMmQ3X01POHpXZFBIYWxENTQ4WTJhYmlMak0ifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJrdWJlLXN5c3RlbSIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VjcmV0Lm5hbWUiOiJhZG1pbi11c2VyLXRva2VuLTZ3Njg5Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQubmFtZSI6ImFkbWluLXVzZXIiLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlcnZpY2UtYWNjb3VudC51aWQiOiIyYjI3NTdjMS04NzQwLTQ2ZGYtYWU3Ni1lOWI0MzlkNDViYmYiLCJzdWIiOiJzeXN0ZW06c2VydmljZWFjY291bnQ6a3ViZS1zeXN0ZW06YWRtaW4tdXNlciJ9.nmTIiYVZKKooYbDmLf_P2rb5NAx6TuXSYlMKew1OU0ALKzIlhyt4HCqxlqgelOLAzm8ek15oc3ej77miG_DCTqz_bZXMXOBpAMCJEqXa0DdYWJd0nHXWauwJOdlBLmzQZDFkImrPbP9v7CKABMhDxu_7XKO8grAuCRJhL2AnfNOfHioc1LWIZ_WcOmOCYvb9JADkS0I_e3AyDgMbWV4gEtlmiAo6MxXKqBGprWnuN0TDEz30rvKcaWEdbUTy4L6kbOM6ogrT_ZQFfnsXzw6CsS103m86-5AXxcdW3af7ddSu5uahDk5pDRQRo9UBe1xJ6pbBf0yNyX-nVfsdF8MYLg
```

将token值输入到令牌后，单击登录即可访问Dashboard。

## 第十六章 生产环境关键性配置

- Docker的配置

```java
vim /etc/docker/daemon.json
{
 "registry-mirrors": [
    "https://registry.docker-cn.com",
    "http://hub-mirror.c.163.com",
    "https://docker.mirrors.ustc.edu.cn"
  ],
 "exec-opts": ["native.cgroupdriver=systemd"],
 "max-concurrent-downloads": 10, 
 "max-concurrent-uploads": 5, 
 "log-opts": {
   "max-size": "300m", 
   "max-file": "2" 
 }, 
 "live-restore": true
}
[root@master1.k8s.test ~]# systemctl daemon-reload
[root@master1.k8s.test ~]# systemctl restart docker
```

- Controller-manager的配置

```java
vim /usr/lib/systemd/system/kube-controller-manager.service
#添加如下配置
# --feature-gates=RotateKubeletClientCertificate=true,RotateKubeletServerCertificate=true \
--cluster-signing-duration=876000h0m0s \
```

- kubelet配置

（更改K8S的安全扫描方式）

```java
vim /etc/systemd/system/kubelet.service.d/10-kubelet.conf
[Service]
Environment="KUBELET_KUBECONFIG_ARGS=--bootstrap-kubeconfig=/etc/kubernetes/bootstrap-kubelet.kubeconfig --kubeconfig=/etc/kubernetes/kubelet.kubeconfig"
Environment="KUBELET_SYSTEM_ARGS=--network-plugin=cni --cni-conf-dir=/etc/cni/net.d --cni-bin-dir=/opt/cni/bin"
Environment="KUBELET_CONFIG_ARGS=--config=/etc/kubernetes/kubelet-conf.yml --pod-infra-container-image=registry.cn-hangzhou.aliyuncs.com/google_containers/pause:3.5"
Environment="KUBELET_EXTRA_ARGS=--node-labels=node.kubernetes.io/node='' --tls-cipher-suites=TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384 --image-pull-progress-deadline=30m"
ExecStart=
ExecStart=/usr/local/bin/kubelet $KUBELET_KUBECONFIG_ARGS $KUBELET_CONFIG_ARGS $KUBELET_SYSTEM_ARGS $KUBELET_EXTRA_ARGS
#添加的参数为：--tls-cipher-suites=TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384    --image-pull-progress-deadline=30m
```

性能优化，保证物理机能够正常提供服务，根据实际情况，进行调整

```java
vim /etc/kubernetes/kubelet-conf.yml
添加如下配置
rotateServerCertificates: true
allowedUnsafeSysctls:
 - "net.core*"
 - "net.ipv4.*"
kubeReserved:
  cpu: "1"
  memory: 1Gi
  ephemeral-storage: 10Gi
systemReserved:
  cpu: "1"
  memory: 1Gi
  ephemeral-storage: 10Gi
```

## 第十七章 kubectl命令的自动补全功能

```java
yum install -y bash-completion
source /usr/share/bash-completion/bash_completion
echo "source <(kubectl completion bash)" >> ~/.bashrc
source ~/.bashrc
```

## 第十八章 节点打上角色的标签（可选）

```java
[root@master1 ~]# kubectl label node master1.k8s.test node-role.kubernetes.io/master=
node/master1.k8s.test labeled
[root@master1 ~]# kubectl label node master1.k8s.test node-role.kubernetes.io/node=
node/master1.k8s.test labeled
[root@master1 ~]# kubectl get nodes
NAME           STATUS   ROLES         AGE     VERSION
master1.k8s.test   Ready   <none>   11m   v1.22.17
master2.k8s.test   Ready   <none>   46s   v1.22.17
master3.k8s.test   Ready   <none>   48s   v1.22.17
node1.k8s.test     Ready   <none>   51s   v1.22.17
```
