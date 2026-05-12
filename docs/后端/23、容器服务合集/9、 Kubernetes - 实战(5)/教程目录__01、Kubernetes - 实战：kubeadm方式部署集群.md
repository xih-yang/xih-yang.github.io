# 01、Kubernetes - 实战：kubeadm方式部署集群
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/5/1.html
- 分类：容器服务
- 分组：教程目录
## 一、Kubernetes 简介

## 1.什么是kubernetes

官方中文文档：https://www.kubernetes.org.cn/docs

它是一个全新的容器技术的分布式架构领先方案。Kubernetes(k8s)是Google开源的容器集群管理系统（谷歌内部:Borg）。在Docker技术的基础上，为容器化的应用提供部署运行、资源调度、服务发现和动态伸缩等一系列完整功能，提高了大规模容器集群管理的便捷性。

Kubernetes是一个开源的，用于管理云平台中多个主机上的容器化的应用，Kubernetes的目标是让部署容器化的应用简单并且高效（powerful）。Kubernetes提供了应用部署，规划，更新，维护的一种机制。

Kubernetes一个核心的特点就是能够自主的管理容器来保证云平台中的容器按照用户的期望状态运行着（比如用户想让apache一直运行，用户不需要关心怎么去做，Kubernetes会自动去监控，然后去重启，新建，总之，让apache一直提供服务），管理员可以加载一个微型服务，让规划器来找到合适的位置，同时，Kubernetes也系统提升工具以及人性化方面，让用户能够方便的部署自己的应用。

Kubernetes是一个完备的分布式系统支撑平台，具有完备的集群管理能力，多扩多层次的安全防护和准入机制、多租户应用支撑能力、透明的服务注册和发现机制、內建智能负载均衡器、强大的故障发现和自我修复能力、服务滚动升级和在线扩容能力、可扩展的资源自动调度机制以及多粒度的资源配额管理能力。同时Kubernetes提供完善的管理工具，涵盖了包括开发、部署测试、运维监控在内的各个环节。

在集群管理方面，Kubernetes将集群中的机器划分为一个Master节点和一群工作节点Node。其中，在Master节点运行着集群管理相关的一组进程kube-apiserver、kube-controller-manager和kube-scheduler，这些进程实现了整个集群的资源管理、Pod调度、弹性伸缩、安全控制、系统监控和纠错等管理能力，并且都是全自动完成的。Node作为集群中的工作节点，运行真正的应用程序，在Node上Kubernetes管理的最小运行单元是Pod。Node上运行着Kubernetes的kubelet、kube-proxy服务进程，这些服务进程负责Pod的创建、启动、监控、重启、销毁以及实现软件模式的负载均衡器

它是一个全新的容器技术的分布式架构领先方案。Kubernetes(k8s)是Google开源的容器集群管理系统（谷歌内部:Borg）。在Docker技术的基础上，为容器化的应用提供部署运行、资源调度、服务发现和动态伸缩等一系列完整功能，提高了大规模容器集群管理的便捷性。

Kubernetes是一个开源的，用于管理云平台中多个主机上的容器化的应用，Kubernetes的目标是让部署容器化的应用简单并且高效（powerful）。Kubernetes提供了应用部署，规划，更新，维护的一种机制。

Kubernetes一个核心的特点就是能够自主的管理容器来保证云平台中的容器按照用户的期望状态运行着（比如用户想让apache一直运行，用户不需要关心怎么去做，Kubernetes会自动去监控，然后去重启，新建，总之，让apache一直提供服务），管理员可以加载一个微型服务，让规划器来找到合适的位置，同时，Kubernetes也系统提升工具以及人性化方面，让用户能够方便的部署自己的应用。

Kubernetes是一个完备的分布式系统支撑平台，具有完备的集群管理能力，多扩多层次的安全防护和准入机制、多租户应用支撑能力、透明的服务注册和发现机制、內建智能负载均衡器、强大的故障发现和自我修复能力、服务滚动升级和在线扩容能力、可扩展的资源自动调度机制以及多粒度的资源配额管理能力。同时Kubernetes提供完善的管理工具，涵盖了包括开发、部署测试、运维监控在内的各个环节。

在集群管理方面，Kubernetes将集群中的机器划分为一个Master节点和一群工作节点Node。其中，在Master节点运行着集群管理相关的一组进程kube-apiserver、kube-controller-manager和kube-scheduler，这些进程实现了整个集群的资源管理、Pod调度、弹性伸缩、安全控制、系统监控和纠错等管理能力，并且都是全自动完成的。Node作为集群中的工作节点，运行真正的应用程序，在Node上Kubernetes管理的最小运行单元是Pod。Node上运行着Kubernetes的kubelet、kube-proxy服务进程，这些服务进程负责Pod的创建、启动、监控、重启、销毁以及实现软件模式的负载均衡器

## 2.kubernetes的优点：

隐藏资源管理和错误处理，用户只需要关注应用的开发

服务高可用、高可靠

可将负载运行在由成千上万机器联合而成的集群中

## 3.Kubernetes组成

Kubernetes节点有运行应用容器必备的服务，而这些都是受Master的控制。每个节点上都要运行Docker。Docker来负责所有具体的映像下载和容器运行。

![ ][nbsp]

Kubernetes主要由以下几个核心组件组成：

etcd：保存了整个集群的状态；

apiserver：提供了资源操作的唯一入口，并提供认证、授权、访问控制、API注册和发现等机制；

controller manager：负责维护集群的状态，比如故障检测、自动扩展、滚动更新等；

scheduler：负责资源的调度，按照预定的调度策略将Pod调度到相应的机器上；

kubelet：负责维护容器的生命周期，同时也负责Volume（CVI）和网络（CNI）的管理；

Container runtime：负责镜像管理以及Pod和容器的真正运行（CRI）；

kube-proxy：负责为Service提供cluster内部的服务发现和负载均衡；

除了核心组件，还有一些推荐的Add-ons：

```java
kube-dns：负责为整个集群提供DNS服务
Ingress Controller：为服务提供外网入口
Heapster：提供资源监控
Dashboard：提供GUI
Federation：提供跨可用区的集群
Fluentd-elasticsearch：提供集群日志采集、存储与查询
```

![ ][nbsp 1]核心层： Kubernetes最核心的功能，对外提供API构建高层的应用，对内提供插件式应用执行环境

应用层：部署(无状态应用、有状态应用、批处理任务、集群应用等)和路由(服务发现、DNS解析等)

管理层：系统度量(如基础设施、容器和网络的度量)，自动化(如自动扩展、动态Provision等)以及策略管理(RBAC、 Quota、PSP、NetworkPolicy等)

接口层：kubectl命令行工具、客户端SDK以及集群联邦

生态系统：在接口层之上的庞大容器集群管理调度的生态系统，可以划分为两个范畴

Kubernetes外部： 日志、监控、配置管理、CI、CD、Workflow、 FaaS、OTS应用、ChatOps等

Kubernetes内部：CRI、 CNI、CVI、镜像仓库、Cloud Provider、集群自身的配置和管理等

## 二、Kubernetes的一些重要概念

**1、** cluster；

cluster是 计算、存储和网络资源的集合，k8s利用这些资源运行各种基于容器的应用。

**2、** master；

master是cluster的大脑，他的主要职责是调度，即决定将应用放在那里运行。master运行linux操作系统，可以是物理机或者虚拟机。为了实现高可用，可以运行多个master。

**3、** node；

node的职责是运行容器应用。node由master管理，node负责监控并汇报容器的状态，同时根据master的要求管理容器的生命周期。node运行在linux的操作系统上，可以是物理机或者是虚拟机。

**4、** pod；

pod是k8s的最小工作单元。每个pod包含一个或者多个容器。pod中的容器会作为一个整体被master调度到一个node上运行。

**5、** controller；

k8s通常不会直接创建pod,而是通过controller来管理pod的。controller中定义了pod的部署特性，比如有几个剧本，在什么样的node上运行等。为了满足不同的业务场景，k8s提供了多种controller，包括deployment、replicaset、daemonset、statefulset、job等。

**6、** deployment；

是最常用的controller。deployment可以管理pod的多个副本，并确保pod按照期望的状态运行。

**7、** replicaset；

实现了pod的多副本管理。使用deployment时会自动创建replicaset，也就是说deployment是通过replicaset来管理pod的多个副本的，我们通常不需要直接使用replicaset。

**8、** daemonset；

用于每个node最多只运行一个pod副本的场景。正如其名称所示的，daemonset通常用于运行daemon。

**9、** statefuleset；

能够保证pod的每个副本在整个生命周期中名称是不变的，而其他controller不提供这个功能。当某个pod发生故障需要删除并重新启动时，pod的名称会发生变化，同时statefulset会保证副本按照固定的顺序启动、更新或者删除。

**10、** job；

用于运行结束就删除的应用，而其他controller中的pod通常是长期持续运行的。

**11、** service；

deployment可以部署多个副本，每个pod 都有自己的IP，外界如何访问这些副本那？

答案是service

k8s的 service定义了外界访问一组特定pod的方式。service有自己的IP和端口，service为pod提供了负载均衡。

k8s运行容器pod与访问容器这两项任务分别由controller和service执行。

**12、** namespace；

可以将一个物理的cluster逻辑上划分成多个虚拟cluster，每个cluster就是一个namespace。不同的namespace里的资源是完全隔离的。

## 三kubeadm方式部署集群

server1 172.25.63.1 master

server2 172.25.63.2 node1

server3 172.25.63.3 node2

## 基础环境部署

（在所有节点都要做）

step1 在每个节点添加私有仓库的解析：

vim/etc/hosts

**172、** 25.63.1server1reg.westos.org；

step2 master与node之间免密：

```java
ssh-keygen 
ssh-copy-id server3
ssh-copy-id server4
```

step3 关闭swap分区：

```java
swapoff -a	#临时关闭
vim /etc/fstab	#禁用
```

```java
# /dev/mapper/rhel-swap   swap                    swap    defaults        0 0
```

## 集群部署

step1 将桥接的IPv4流量传递到iptables的链：

确保在sysctl配置中的 `net.bridge.bridge-nf-call-iptables` 被设置为 1

```java
cd /etc/sysctl.d/
vim k8s.conf
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
sysctl --system
```

step2 安装kubernetes和docker：

docker的安装方法在这里不再赘述

部署k8s的yum源：

```java
cd /etc/yum.repos.d/
vim kubernetes.repo 
[kubernetes]
name=Kubernetes
baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64/
enabled=1
gpgcheck=0
yum install docker-ce kubelet kubeadm kubectl container-selinux-2.77-1.el7.noarch.rpm -y
```

step3 将cgroupdriver改为systemd：

```java
cd /etc/docker
vim daemon.json 
{
  "registry-mirrors": ["https://reg.westos.org"],
  "exec-opts": ["native.cgroupdriver=systemd"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m"
  },
  "storage-driver": "overlay2",
  "storage-opts": [
    "overlay2.override_kernel_check=true"
  ]
}
systemctl daemon-reload 
systemctl restart docker
docker info
```

```java
cd /sys/fs/cgroup
ls	#systemd目录的路径
```

step4 启动kublet和docker：

```java
systemctl start docker
systemctl enable docker
systemctl start kubelet 
systemctl enable kubelet 
```

step5 指定仓库拉取镜像：

首先我们查看kubeadm的配置信息

```java
kubeadm config print init-defaults
```

可以看到它默认从k8s.gcr.io上下载镜像，需要翻墙

所以我们直接指定下载时仓库的地址：

```java
kubeadm config images list --image-repository registry.aliyuncs.com/google_containers
```

从阿里云上拉取kubeadm所需的镜像

```java
kubeadm config images pull --image-repository registry.aliyuncs.com/google_containers
```

step6 将下载的镜像上传到私有仓库：

首先我们可以新建一个名为kubernetes的仓库

给镜像批量改名：

```java
for i in docker images | grep registry.aliyuncs.com | awk '{print $1":"$2}'|awk -F / '{print $3}';do docker tag registry.aliyuncs.com/google_containers/$i reg.westos.org/kubernetes/$i; done
docker images | grep reg.westos.org
```

上传：

```java
for i in docker images | grep reg.westos.org|awk '{print $1":"$2}';do docker push $i ;done
```

我们要在其他节点上都部署好私有仓库，将证书发送过去：

```java
scp -r certs.d server2:/etc/docker
ca.crt 
scp -r certs.d server3:/etc/docker
ca.crt 
```

测试私有仓库：

```java
yum install bash-* -y
docker pull reg.westos.org/kubernetes/kube-proxy:v1.18.1	#尝试拉取
docker images
docker rmi reg.westos.org/kubernetes/kube-proxy:v1.18.1	#删除
```

step7 启动kubernetes集群：

这里我们选择flannel网络

```java
kubeadm init --pod-network-cidr=10.244.0.0/16 --image-repository reg.westos.org/kubernetes
```

启动完成后会有提示，让你做如下操作：

成功后注意最后一个命令，这个join命令可以用来添加节点。

如果初始化失败，请使用如下代码清除后重新初始化

```java
# kubeadm reset
```

```java
useradd kubeadm
visudo
su - kubeadm
mkdir -p $HOME/.kube
cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
chown $(id -u):$(id -g) $HOME/.kube/config
```

step8 node节点加入集群：

```java
kubeadm join 172.25.254.1:6443 --token bxkh88.3xppwvn19x2b79pp --discovery-token-ca-cert-hash sha256:0abdd176472e86a55bfc7dc99f553dc62e6d163089e833027e788a8645ef891c
```

注意：sha256后面的内容是启动集群时生成的的信息

查看节点状态：

```java
kubectl get nodes
kubectl get pod -n kube-system
```

step9 配置kubectl命令补齐功能：

```java
echo "source <(kubectl completion bash)" >> ~/.bashrc
source .bashrc
```

step10 flannel网络管理：

我们可以看到在这之前节点的状态，前两行一直是pending状态，原因是缺少网络模型

```java
kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/2140ac876ef134e0ed5af15c65e414cf26827915/Documentation/kube-flannel.yml
```

等待一会再次查看集群状态：

```java
kubectl get nodes
kubectl get pod -n kube-system
```

![ ][nbsp 2]

## 补充：移除NODE节点的方法

第一步：先将节点设置为维护模式(server2是节点名称)

```java
[root@server1 ~]# kubectl drain server2 --delete-local-data --force --ignore-daemonsets
```

第二步：然后删除节点

```java
[root@server1 ~]# kubectl delete node server2
```

第三步：查看节点

发现server2节点已经被删除了

```java
[root@server1 ~]# kubectl get nodes
NAME      STATUS   ROLES    AGE   VERSION
server1   Ready    master   47m   v1.18.1
server3   Ready    <none>   11m   v1.18.1
```

## 添加已删除节点

如果这个时候再想添加进来这个node，需要执行两步操作

第一步：停掉kubelet(需要添加进来的节点操作)

```java
[root@server2 ~]# systemctl stop kubelet
```

第二步：删除相关文件

```java
[root@server2 ~]# rm -rf /etc/kubernetes/*
```

第三步：添加节点

```java
[root@server2 ~]# kubeadm join 172.25.63.1:6443 --token cmpyar.n4arbbq0i9irhmum     --discovery-token-ca-cert-hash sha256:542e77bad47c73c3336ce601ad9fe2078381ea8b04b95f377f46520296a79fe2
```

第四步：查看节点

```java
 kubectl get nodes
```

```java
[root@server1 ~]# kubectl get nodes
NAME      STATUS   ROLES    AGE   VERSION
server1   Ready    master   47m   v1.18.1
server2   Ready    <none>   11m   v1.18.1
server3   Ready    <none>   11m   v1.18.1
```

忘掉token再次添加进k8s集群

第一步：主节点执行命令

在主控节点，获取token：

```java
[root@server1 ~]# kubeadm token list
TOKEN                     TTL         EXPIRES                     USAGES                   DESCRIPTION                                                EXTRA GROUPS
cmpyar.n4arbbq0i9irhmum   23h         2020-04-18T20:47:06+08:00   authentication,signing   The default bootstrap token generated by 'kubeadm init'.   system:bootstrappers:kubeadm:default-node-token
```

第二步： 获取ca证书sha256编码hash值

在主控节点

```java
 [root@server1 ~]# openssl x509 -pubkey -in /etc/kubernetes/pki/ca.crt | openssl rsa -pubin -outform der 2>/dev/null | openssl dgst -sha256 -hex | sed 's/^.* //'
542e77bad47c73c3336ce601ad9fe2078381ea8b04b95f377f46520296a79fe2
```

第三步：从节点执行如下的命令

```java
[root@server2 ~]# systemctl stop kubelet
```

第四步：删除相关文件

```java
[root@server2 ~]# rm -rf /etc/kubernetes/*
```

第五步：加入集群

指定主节点IP，端口是6443

在生成的证书前有sha256:

```java
[root@server2 ~]# kubeadm join 172.25.63.1:6443 --token cmpyar.n4arbbq0i9irhmum --discovery-token-ca-cert-hash sha256:542e77bad47c73c3336ce601ad9fe2078381ea8b04b95f377f46520296a79fe2```
[nbsp]: /images/2023/11/5/140/1699164008928.png
[nbsp 1]: /images/2023/11/5/140/1699164010406.png
[nbsp 2]: /images/2023/11/5/140/1699164011830.png
```
