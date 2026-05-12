# 04、Kubernetes - 实战：kubespray安装高可用k8sv1.20.2集群及常见报错解决
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/6/4.html
- 分类：容器服务
- 分组：教程目录
## kubespray安装高可用k8s集群

### 环境介绍

系统环境
主机名 / IP地址
角色
内核版本

CentOS 7.6.1810
master1 / 192.168.181.252
master && node
5.4

CentOS 7.6.1810
master2 / 192.168.181.253
master && node
5.4

### 工具介绍

工具名称
版本
官网下载
安装机器

ansible
2.9.16
阿里云的epel.repo
master1

kubespray
2.15.0
https://github.com/kubernetes-sigs/kubespray
master1

chronyd
3.2
系统自带的就好
master1 && master2

阿里云yum源

https://developer.aliyun.com/mirror/
master1 && master2

### 环境准备工作(所有机器都需要)

### 1.关闭防火墙、SElinux

```java
## 防火墙
systemctl stop firewalld.service
systemctl disable firewalld.service
## selinux
setenforce
sed -i 's/^SELINUX=.*/SELINUX=disabled/' /etc/selinux/config
```

### 2.编辑/etc/hosts文件

```java
## /etc/hosts文件中添加所有主机的域名解析
192.168.181.252 master1
192.168.181.253 master2
```

### 3.ssh免密

```java
## 生成密钥
ssh-keygen -t rsa
## 公钥复制到其他主机
ssh-copy-id master1
ssh-copy-id master2
## 可以测试访问是否成功
ssh master2
```

### 4.升级内核至5.4

查看当前内核版本

```java
[root@master1 data]# uname -r
3.10.0-957.el7.x86_64
```

设置ELRepo源

```java
## 导入公钥
rpm --import https://www.elrepo.org/RPM-GPG-KEY-elrepo.org
## 安装yum源
yum install https://www.elrepo.org/elrepo-release-7.el7.elrepo.noarch.rpm
```

查看可用内核

```java
[root@master1 data]# yum --disablerepo \* --enablerepo elrepo-kernel list available 
已加载插件：fastestmirror, langpacks
Loading mirror speeds from cached hostfile
 * elrepo-kernel: mirrors.tuna.tsinghua.edu.cn
可安装的软件包
kernel-lt.x86_64                                                          5.4.95-1.el7.elrepo                                          elrepo-kernel
kernel-lt-devel.x86_64                                                    5.4.95-1.el7.elrepo                                          elrepo-kernel
kernel-lt-doc.noarch                                                      5.4.95-1.el7.elrepo                                          elrepo-kernel
kernel-lt-headers.x86_64                                                  5.4.95-1.el7.elrepo                                          elrepo-kernel
kernel-lt-tools.x86_64                                                    5.4.95-1.el7.elrepo                                          elrepo-kernel
kernel-lt-tools-libs.x86_64                                               5.4.95-1.el7.elrepo                                          elrepo-kernel
kernel-lt-tools-libs-devel.x86_64                                         5.4.95-1.el7.elrepo                                          elrepo-kernel
kernel-ml.x86_64                                                          5.10.13-1.el7.elrepo                                         elrepo-kernel
kernel-ml-devel.x86_64                                                    5.10.13-1.el7.elrepo                                         elrepo-kernel
kernel-ml-doc.noarch                                                      5.10.13-1.el7.elrepo                                         elrepo-kernel
kernel-ml-headers.x86_64                                                  5.10.13-1.el7.elrepo                                         elrepo-kernel
kernel-ml-tools.x86_64                                                    5.10.13-1.el7.elrepo                                         elrepo-kernel
kernel-ml-tools-libs.x86_64                                               5.10.13-1.el7.elrepo                                         elrepo-kernel
kernel-ml-tools-libs-devel.x86_64                                         5.10.13-1.el7.elrepo                                         elrepo-kernel
perf.x86_64                                                               5.10.13-1.el7.elrepo                                         elrepo-kernel
python-perf.x86_64                                                        5.10.13-1.el7.elrepo                                         elrepo-kernel
```

安装lt内核

```java
## 安装
yum --enablerepo elrepo-kernel -y install kernel-lt
## 查看当前所有内核
grubby --info=ALL
## 设置5.4内核为默认启动内核
grub2-set-default 0
grub2-reboot 0
或
grep menuentry /boot/efi/EFI/centos/grub.cfg
grub2-set-default 'CentOS Linux (5.4.95-1.el7.x86_64) 7 (Core)'
## 查看修改结果
grub2-editenv list
## 重启服务器
systemctl reboot
```

验证内核版本

```java
[root@master1 ~]# uname -r 
5.4.95-1.el7.elrepo.x86_64
[root@master2 ~]# uname -r 
5.4.95-1.el7.elrepo.x86_64
```

### 另外扩展一下如何将yum所安装的所有安装包及依赖包下载到本地，以供在没有外网环境时安装使用：

```java
## 安装yumdownloader工具
yum -y install yum-utils
## 下载kernel包及其所需依赖包
yumdownloader --resolve --destdir /data/kernel/ --enablerepo elrepo-kernel kernel-lt
 --resolve 连带依赖包一起下载
 --destdir 包下载到的路径
 --enablerepo 使用哪个repo库
```

### 5.开启内核路由转发功能

```java
## 临时开始，写入内存
echo 1 > /proc/sys/net/ipv4/ip_forward
## 永久开启写入内核参数
echo 'net.ipv4.ip_forward = 1' >> /etc/sysctl.conf 
## 加载配置
sysctl -p
## 验证是否生效
[root@master2 ~]# sysctl -a | grep 'ip_forward'
net.ipv4.ip_forward = 1
net.ipv4.ip_forward_update_priority = 1
net.ipv4.ip_forward_use_pmtu = 0
```

### 6.关闭swap分区

```java
## 临时关闭
swapoff -a
## 永久关闭
sed -i "s/.*swap.*//" /etc/fstab
```

### 工具准备工作

### 1.安装阿里云yum源(两台机器都需要)

CentOS-Base.repo

```java
wget -O /etc/yum.repos.d/CentOS-Base.repo https://mirrors.aliyun.com/repo/Centos-7.repo
## 非阿里云ECS要执行
sed -i -e '/mirrors.cloud.aliyuncs.com/d' -e '/mirrors.aliyuncs.com/d' /etc/yum.repos.d/CentOS-Base.repo
```

```java
epel.repo
```

```java
wget -O /etc/yum.repos.d/epel.repo http://mirrors.aliyun.com/repo/epel-7.repo
```

docker-ce.repo

```java
yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
sed -i 's+download.docker.com+mirrors.aliyun.com/docker-ce+' /etc/yum.repos.d/docker-ce.repo
```

kubernetes.repo

```java
cat <<EOF > /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64/
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg https://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg
EOF
```

yum源准备完毕后，创建元数据

```java
[root@master1 data]# yum clean all
[root@master1 data]# yum makecache 
```

### 2.更新python的pip、jinja2等

```java
## 先安装gcc编译需要，和zlib*压缩解压缩需要,
## libffi-devel为python需要，不然ansible安装K8S时会报类似：ModuleNotFoundError: No module named '_ctypes'
## python2-pip pip的安装
yum -y install gcc zlib* libffi-develpython2-pip-8.1.2-14.el7.noarch
## 配置pip源，这里配置的aliyun的pip源
vim ~/.pip/pip.conf
...
[global]
index-url = http://mirrors.aliyun.com/pypi/simple
trusted-host = mirrors.aliyun.com
...
## 更新pip、jinja2，如果不更新jinja2，安装k8s会报错：AnsibleError: template error while templating string: expected token '=', got 'end of statement block'.
pip install --upgrade pip
pip install --upgrade jinja2
```

### 3.安装ansible

```java
## 阿里云的epel.repo中有ansible，直接yum即可
yum -y install ansible
## 然后更新jinja2，必须指定国内的源pip源，这里指定阿里云的pip源
pip install jinja2 --upgrade
```

### 4.配置时钟服务

这里以master1为时钟服务端，master2为时钟客户端

```java
[master下操作]
vim /etc/chrony.conf
...
# 主要下面几个点
server 192.168.181.252 指定服务端
allow 192.168.181.0/24把自身当作服务端
...
[slave下操作]
vim /etc/chrony.conf
...
server 192.168.181.252 指定服务端
...
## 然后重启服务，查看状态
systemctl enable chronyd
systemctl restart chronyd
timedatectl
chronyc sources -v
```

### 配置kubespray

### 1.安装requirements.txt

```java
## 首先要配置pip源，前边如果配置了可忽略
mkdir -p ~/.pip/
cat > pip.conf << EOF
> [global]
> index-url = http://mirrors.aliyun.com/pypi/simple
> trusted-host = mirrors.aliyun.com
> EOF
## 更新pip
python3 -m pip install --upgrade pip
## 安装requirements.txt
pip install -r requirements.txt
```

### 2.更改inventory

```java
## 复制inventory/sample到inventory/mycluster
cd /data/kubespray-master
cp -rfp inventory/sample inventory/mycluster
## 使用库存生成器更新Ansible inventory 文件
declare -a IPS=(192.168.181.252 192.168.181.253)
CONFIG_FILE=inventory/mycluster/hosts.yaml python3 contrib/inventory_builder/inventory.py ${IPS[@]}
## 生成的hosts.yaml文件，这里的node1和node2将会被更改为主机的hostname，可以根据实际场景设定
[root@master1 kubespray]# cat inventory/mycluster/hosts.yaml 
all:
  hosts:
    node1:
      ansible_host: 192.168.181.252
      ip: 192.168.181.252
      access_ip: 192.168.181.252
    node2:
      ansible_host: 192.168.181.253
      ip: 192.168.181.253
      access_ip: 192.168.181.253
  children:
    kube-master:
      hosts:
        node1:
        node2:
    kube-node:
      hosts:
        node1:
        node2:
    etcd:
      hosts:
        node1:
    k8s-cluster:
      children:
        kube-master:
        kube-node:
    calico-rr:
      hosts: {}
```

### 3.根据需求修改默认配置

```java
## 一些组件的安装，比如helm、registry、local_path_provisioner、ingress等，默认都是关闭状态，如果有需求，可以将其打开并设置
vim inventory/mycluster/group_vars/k8s-cluster/addons.yml
...
# Helm deployment
helm_enabled: true
# Registry deployment
registry_enabled: true
# Rancher Local Path Provisioner
local_path_provisioner_enabled: false
...
## 还有网络插件（默认为calico）、网池、kube-proxy的模式等一些可以自己修改
vim inventory/mycluster/group_vars/k8s-cluster/k8s-cluster.yml
...
kube_network_plugin: flannel
kube_network_plugin_multus: false
kube_service_addresses: 10.233.0.0/18
kube_pods_subnet: 10.233.64.0/18
kube_proxy_mode: ipvs
...
## 还有docker的一些配置象存储位置、端口等配置，都可以在配置文件中修改，不再一一赘述
```

### 4.替换镜像源为国内镜像源

```java
cd /data/kubespray
find ./ -type f |xargs sed -i 's/k8s.gcr.io/registry.cn-hangzhou.aliyuncs.com/g'
find ./ -type f |xargs sed -i 's/gcr.io/registry.cn-hangzhou.aliyuncs.com/g'
find ./ -type f |xargs sed -i 's/google-containers/google_containers/g'
```

> 或者提前将所需的所有镜像下载下来导入，两种方法都可以

### 5.开始部署

```java
## 部署前提前安装 netaddr 包，不然执行过程会报错：
{"failed": true, "msg": "The ipaddr filter requires python-netaddr be installed on the ansible controller"}
yum -y install python-netaddr 
## 如果yum安装python-netaddr后，执行ansible-playbook时还报以上错，则执行pip安装
pip install python-netaddr --upgrade
## 部署
ansible-playbook -i inventory/mycluster/hosts.yaml --become --become-user=root cluster.yml
## 报错1：kubeadm-v1.20.2-amd64、kubectl-v1.20.2-amd64两个下载不下来，网络问题，可手动下载之后传上去，所有机器都要传，传至/tmp/releases/目录下
https://storage.googleapis.com/kubernetes-release/release/v1.20.2/bin/linux/amd64/kubeadm
https://storage.googleapis.com/kubernetes-release/release/v1.20.2/bin/linux/amd64/kubectl
## 报错2：有两个镜像基础镜像pull不下来的问题,我自己手动pull的
 cluster-proportional-autoscaler-amd64:1.8.3
 k8s-dns-node-cache:1.16.0
## 报错3：AnsibleError: template error while templating string: expected token '=', got 'end of statement block'.
 这个报错是由于jinja2版本较低造成的，前边 工具准备工作 的 第二步有提及到，直接pip install --upgrade jinja2即可，我是更新到了2.11
 这里注意一下，pip版本必须是pip2，因为ansible默认的python模式是python2.7的
## 报错4：error running kubectl (/usr/local/bin/kubectl apply --force --filename=/etc/kubernetes/k8s-cluster-critical-pc.yml) command (rc=1), out='', err='Unable to connect to the server: net/http: TLS handshake timeout
 报这个是因为内存不够，我只给了2G内存，再加点内存就ok
```

> 以上为我遇到的报错，如果你也遇到但未得到解决，可以留言一起探讨

### 6.部署完成

```java
[root@node1 kubespray]# kubectl get nodes 
NAME    STATUS   ROLES                  AGE   VERSION
node1   Ready    control-plane,master   24m   v1.20.2
node2   Ready    control-plane,master   23m   v1.20.2
[root@node1 kubespray]# kubectl version
Client Version: version.Info{Major:"1", Minor:"20", GitVersion:"v1.20.2", GitCommit:"faecb196815e248d3ecfb03c680a4507229c2a56", GitTreeState:"clean", BuildDate:"2021-01-13T13:28:09Z", GoVersion:"go1.15.5", Compiler:"gc", Platform:"linux/amd64"}
[root@node1 ~]# kubectl get pod -n kube-system  
NAME                              READY   STATUS    RESTARTS   AGE
coredns-5bfb6bc97d-g7j4v          1/1     Running   0          18m
coredns-5bfb6bc97d-vqz2m          1/1     Running   0          17m
dns-autoscaler-74877b64cd-gjnpb   1/1     Running   0          17m
kube-apiserver-node1              1/1     Running   0          40m
kube-apiserver-node2              1/1     Running   0          39m
kube-controller-manager-node1     1/1     Running   0          40m
kube-controller-manager-node2     1/1     Running   0          39m
kube-flannel-82x65                1/1     Running   0          19m
kube-flannel-cps8x                1/1     Running   0          19m
kube-proxy-4bzmh                  1/1     Running   0          19m
kube-proxy-h8xqx                  1/1     Running   0          19m
kube-scheduler-node1              1/1     Running   0          40m
kube-scheduler-node2              1/1     Running   0          39m
nodelocaldns-nfmjz                1/1     Running   0          17m
nodelocaldns-ngn6z                1/1     Running   0          17m
registry-proxy-qk24l              1/1     Running   0          17m
registry-rwb9k                    1/1     Running   0          17m
```

> 这里也提一下，cpu最少要2核，不然会有些基础pod都起不来

### 至此搭建结束！
