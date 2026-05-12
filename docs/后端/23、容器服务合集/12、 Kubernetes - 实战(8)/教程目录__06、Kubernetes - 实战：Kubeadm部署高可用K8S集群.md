# 06、Kubernetes - 实战：Kubeadm部署高可用K8S集群
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/8/6.html
- 分类：容器服务
- 分组：教程目录
## 1.简介

本章节使用kubeadm搭建一套三主三从的高可用kubernetes集群。相比单master而言，多master更加有利于我们生产环境的稳定性。就算master节点宕机一台，我们依然有其他master节点保证我们的集群环境。多master节点需要依赖于keepalive还生成一个vip，也就是虚拟ip，做过nginx+keepalive的小伙伴们都知道，还需要一个haproxy来实现负载策略。

## 2.整体架构信息

Linux版本CentOS7,内核版本推荐4.10+（3.10有个kmem的bug）

Kubernetes 默认安装最新

网段配置：pod网段10.244.0.0/16service网段10.96.0.0/12

## 3.环境初始化

### 3.1配置hosts文件

```java
在每个主机上配置
cat >>/etc/hosts<<EOF
192.168.3.18 master1
192.168.3.19 master2
192.168.3.20 master3
192.168.3.21 node1
192.168.3.22 node2
192.168.3.23 node3
EOF
```

### 3.2关闭selinux和防火墙

```java
sed -ri 's#(SELINUX=).*#\1disabled#' /etc/selinux/config
setenforce 0
systemctl disable firewalld
systemctl stop firewalld
```

### 3.3关闭swap

```java
swapoff -a
sed -i 's/.*swap.*/#&/' /etc/fstab
```

### 3.4创建秘钥

```java
在master1节点上创建秘钥，设置免密登录其他服务器，主要是为了后面的远程拷贝证书
ssh-keygen -t rsa
一路回车即可。
```

```java
# 将密钥拷贝到其他节点
for n in seq -w 2 3;do ssh-copy-id master$n;done
```

### 3.5配置内核转发参数

```java
cat <<EOF >  /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
net.ipv4.ip_nonlocal_bind = 1
net.ipv4.ip_forward = 1
vm.swappiness=0
EOF
sysctl --system
```

### 3.6加载ipvs模块

```java
cat > /etc/sysconfig/modules/ipvs.modules <<EOF
#!/bin/bash
modprobe -- ip_vs
modprobe -- ip_vs_rr
modprobe -- ip_vs_wrr
modprobe -- ip_vs_sh
modprobe -- nf_conntrack_ipv4
EOF
chmod 755 /etc/sysconfig/modules/ipvs.modules && bash /etc/sysconfig/modules/ipvs.modules && lsmod | grep -e ip_vs -e nf_conntrack_ipv4
```

## 4.安装keepalived

3个master节点上安装keepalived

```java
yum install -y keepalived
```

修改keepalived的配置文件，保证priority不一样即可，这里我们分别采用100,90,80

配置文件路径

```java
vim /etc/keepalived/keepalived.conf
```

配置文件内容：

```java
global_defs {
    router_id lb-master-105
}
vrrp_script check-haproxy {
    script "killall -0 haproxy"
    interval 5
    weight -30
}
vrrp_instance VI-kube-master {
    state MASTER   MASTER或BACKUP
    priority 120   权限
    dont_track_primary
    interface ens33   网卡地址
    virtual_router_id 68
    advert_int 3
    track_script {
        check-haproxy
    }
    virtual_ipaddress {
        192.168.60.100
    }
}
```

启动keepalive并设置成开启启动

```java
systemctl start keepalived && systemctl enable keepalived
```

检查虚拟vip是否正常工作

ifconfig查看vip是否绑定成功，如果能ping 192.168.3.100则说明vip绑定成功，也可以使用ip a看虚拟vip是否绑定到当前指定网卡上

## 5.安装haproxy

```java
yum install -y haproxy
```

修改haproxy的配置文件，因为我们的haproxy安装在3个master节点上面，haproxy实现api-server的负载均衡，所有不能用api-server的端口，我们设置端口信息为8443，默认是api-server是8443

配置文件路径/etc/haproxy/haproxy.conf

配置文件内容：

```java
#---------------------------------------------------------------------
# Global settings
#---------------------------------------------------------------------
global
    to have these messages end up in /var/log/haproxy.log you will
    need to:
    1) configure syslog to accept network log events.  This is done
       by adding the '-r' option to the SYSLOGD_OPTIONS in
       /etc/sysconfig/syslog
    2) configure local2 events to go to the /var/log/haproxy.log
      file. A line like the following can be added to
      /etc/sysconfig/syslog
       local2.*                       /var/log/haproxy.log
    log         127.0.0.1 local2
    chroot      /var/lib/haproxy
    pidfile     /var/run/haproxy.pid
    maxconn     4000
    user        haproxy
    group       haproxy
    daemon
    turn on stats unix socket
    stats socket /var/lib/haproxy/stats
#---------------------------------------------------------------------
# common defaults that all the 'listen' and 'backend' sections will
# use if not designated in their block
#---------------------------------------------------------------------
defaults
    mode                    http
    log                     global
    option                  httplog
    option                  dontlognull
    option http-server-close
    option forwardfor       except 127.0.0.0/8
    option                  redispatch
    retries                 3
    timeout http-request    10s
    timeout queue           1m
    timeout connect         10s
    timeout client          1m
    timeout server          1m
    timeout http-keep-alive 10s
    timeout check           10s
    maxconn                 3000
#---------------------------------------------------------------------
# kubernetes apiserver frontend which proxys to the backends
#---------------------------------------------------------------------
frontend kubernetes-apiserver
    mode                 tcp
    bind                 *:16443
    option               tcplog
    default_backend      kubernetes-apiserver
#---------------------------------------------------------------------
# round robin balancing between the various backends
#---------------------------------------------------------------------
backend kubernetes-apiserver
    mode        tcp
    balance     roundrobin
    server  master-0 172.16.7.11:6443 check
    server  master-1 172.16.7.12:6443 check
    server  master-2 172.16.7.13:6443 check
#---------------------------------------------------------------------
# collection haproxy statistics message
#---------------------------------------------------------------------
listen stats
    bind                 *:1080
    stats auth           admin:awesomePassword
    stats refresh        5s
    stats realm          HAProxy\ Statistics
    stats uri            /admin?stats
```

启动并设置为开机启动

```java
systemctl start haproxy && systemctl enable haproxy
ss -lnt | grep -E "16443|1080"
```

## 6.安装docker-ce

### 6.1安装一些必要的组件信息

```java
sudo yum install -y yum-utils device-mapper-persistent-data lvm2
```

### 6.2添加docker的yum源

```java
sudo yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
```

### 6.3更新缓存

```java
sudo yum makecache fast
```

## 6.4安装

```java
yum install -y docker-ce
```

### 6.5启动并设置成开机启动

```java
systemctl start docker && systemctl enable docker
```

## 7.安装kubernetes组件

### 7.1添加kubernetes的yum源

```java
cat << EOF > /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64/
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg https://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg
EOF
```

### 7.2更新缓存

```java
yum makecache fast
```

### 7.3安装组件

```java
yum install -y kubelet-1.19.0 kubeadm-1.19.0 kubectl-1.19.0
```

### 7.4设置kubelet开机自启动

```java
systemctl enable kubelet
```

## 8.初始化集群

### 8.1获取默认配置文件信息

```java
kubeadm config print init-defaults > kubeadm-init.yaml
```

### 8.2修改初始化文件

修改之后的配置文件如下，注意以下几点advertiseAddress，imageRepository，kubernetesVersion，podSubnet，controlPlaneEndpoint

```java
apiVersion: kubeadm.k8s.io/v1beta2
bootstrapTokens:
- groups:
  - system:bootstrappers:kubeadm:default-node-token
  token: abcdef.0123456789abcdef
  ttl: 24h0m0s
  usages:
  - signing
  - authentication
kind: InitConfiguration
localAPIEndpoint:
  advertiseAddress: 192.168.3.18
  bindPort: 6443
nodeRegistration:
  criSocket: /var/run/dockershim.sock
  name: master1
  taints:
  - effect: NoSchedule
    key: node-role.kubernetes.io/master
---
apiServer:
  timeoutForControlPlane: 4m0s
apiVersion: kubeadm.k8s.io/v1beta2
certificatesDir: /etc/kubernetes/pki
clusterName: kubernetes
controlPlaneEndpoint: 192.168.3.100:16443
controllerManager: {}
dns:
  type: CoreDNS
etcd:
  local:
    dataDir: /var/lib/etcd
imageRepository: registry.cn-hangzhou.aliyuncs.com/google_containers
kind: ClusterConfiguration
kubernetesVersion: v1.15.0
networking:
  dnsDomain: cluster.local
  serviceSubnet: 10.96.0.0/12
  podSubnet: 10.244.0.0/16
scheduler: {}
```

### 8.3初始化集群

```java
kubeadm init --config kubeadm-init.yaml
```

集群初始化完成后执行一下三步：

```java
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

画红线部分主要是针对其他，master节点加入集群，node节点加入集群的话则不需要--experimental-control-plane。

注意这里token默认24小时过期，查看token的命令

```java
kubeadm token list
```

token过期后，如果我们需要重新生成token，可以使用以下命令，生成命令默认是node节点加入的命令，如需要角色是master则需要在最后面加上--experimental-control-plane。

```java
kubeadm token create --print-join-command
```

接着我们将证书拷贝到其他master节点

```java
USER=root
CONTROL_PLANE_IPS="k8s.master02.com k8s.master03.com"
for host in ${CONTROL_PLANE_IPS}; do
    ssh "${USER}"@$host "mkdir -p /etc/kubernetes/pki/etcd"
    scp /etc/kubernetes/pki/ca.* "${USER}"@$host:/etc/kubernetes/pki/
    scp /etc/kubernetes/pki/sa.* "${USER}"@$host:/etc/kubernetes/pki/
    scp /etc/kubernetes/pki/front-proxy-ca.* "${USER}"@$host:/etc/kubernetes/pki/
    scp /etc/kubernetes/pki/etcd/ca.* "${USER}"@$host:/etc/kubernetes/pki/etcd/
    scp /etc/kubernetes/admin.conf "${USER}"@$host:/etc/kubernetes/
done
```

### 8.4初始化其他master节点

使用命令

```java
kubeadm join 192.168.3.100:8443 --token rv4daf.44jisgiwzg7wp07c  --discovery-token-ca-cert-hash sha256:c947ffc92b679603c51279d843e6a0657d48b7c60644e539dba15dc1246e6f59 --experimental-control-plane
```

接着等待一段时间，初始化的时候需要从网上拉取镜像，直到我们看见

This node has joined the cluster …则证明我们其他master节点成功加入到集群，加入集群后我们依然需要执行图中画红线的部分，执行后才可以使用kubectl直接和api-server交互。

### 8.5验证集群环境

我们使用kubectl get node [-o wide]查看集群状态，可以看到当前已经有3个节点了，都是master角色，但是状态都是NotReady状态，别着急，我们目前为止还没有安装网络组件。

安装calico网络组件，生产集群大的时候推荐calico。

官方介绍如下：

详情可以根据情况查看官网介绍，连接地址：[https://docs.projectcalico.org/v3.8/getting-started/kubernetes/installation/calico](https://docs.projectcalico.org/v3.8/getting-started/kubernetes/installation/calico)

步骤：
**1、** 下载yaml；

```java
curl https://docs.projectcalico.org/v3.8/manifests/calico.yaml -O
```

**2、** 修改网络地址跟pod网段保持一致；

我们的第二步骤跟官方不一样，但是是一个意思，都是修改网络地址段修改calico.yaml的192.168.0.0/24改为初始化的pod网段地址，我们之前使用的10.244.0.0/16

**3、** 创建calico网络pod；

```java
kubectl apply -f calico.yaml
```

创建后等待段时间后，这个根据网络环境等待，下载镜像，启动pod直到我们使用kubectl get pod -n kube-system的pod全部变成n/n的时候集群就算搭建完成。

等待一段时间后，我们再次使用kubectl get node [-o wide]查看集群状态信息，可以看到所有的pod已经成功启动，3个master节点变成了Ready状态。

### 8.6加入node节点

这里我们使用直接加入到集群环境即可，注意：node节点没有后面的--experimental-control-plane参数。

```java
kubeadm join 192.168.3.100:8443 --token rv4daf.44jisgiwzg7wp07c --discovery-token-ca-cert-hash sha256:c947ffc92b679603c51279d843e6a0657d48b7c60644e539dba15dc1246e6f59
```

三个节点都执行加入集群的命令后，稍等一下即可看到，此时我们的master和node都处于Ready状态。

并且此时我们kube-system名称空间下的所有pod都处于n/n的状态，此时我们的k8s多master高可用环境搭建完成。

## 9、注意事项

我们的高可用目前环境是三个master,因为etcd集群至少要保证2个节点，所以当我们挂了一个master节点时是对于我们高可用环境是不受影响的，生产环境至少要保证三个master节点以上即可。

## 10、外部如何访问

因为我们集群环境使用的keepalived生成并绑定了vip，这个vip是会飘走的。举个例子，现在vip绑定到192.168.3.18的ens32网卡上面，当我们这个服务器宕机，keepalived的高可用机制可能就把vip飘到其他keepalived上面。

所以，外部访问直接访问我们的vip即可。为了测试，我们在自己电脑上启动一个cmd,去ping我们这个vip看是否有返回结果即可。
