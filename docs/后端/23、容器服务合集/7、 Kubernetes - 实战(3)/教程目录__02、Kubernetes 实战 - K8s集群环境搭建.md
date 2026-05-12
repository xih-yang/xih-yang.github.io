# 02、Kubernetes 实战 - K8s集群环境搭建
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/3/2.html
- 分类：容器服务
- 分组：教程目录
## 前言

集群环境的搭建的全程。

## 第一节 集群类型

kubernetes 集群大体上分为两类：一主多从，多主多从。

**一主多从**：一个Master节点和多个Node节点，搭建简单，但是有单机故障风险，适用于测试环境

**多主多从**：多个Master节点和多个Node节点，搭建麻烦，安全性高，适用于生成环境。

## 第二节 安装方式

k8s有多种安装部署方式，目前主流的方式有kubeadm、minikube、二进制包

**minikube**: 一个用于快速搭建单节点kubernetes的工具

**kubeadm**: 一个用于快速搭建kubernetes集群的工具

**二进制包**：从官网下载每个组件的二进制包，依次去安装，此方式对于理解kubernetes 组件更加有效

> 现在需要安装kubernetes的集群环境，但是又不想过于麻烦，所以选择使用kubeadm方式

## 第三节 主机规划

类型
IP
系统信息
配置

master
192.168.88.100
Centos 7.9.2009
2核1G 50G磁盘

node1
192.168.88.101
Centos 7.9.2009
2核1G 50G磁盘

node2
192.168.88.102
Centos 7.9.2009
2核1G 50G磁盘

安装过程设置:

- 操作系统环境 CPU(2C)，内存（1G），硬盘50G
- 语言选择：中文简体
- 软件选择：基础设施服务器
- 分区选择：自动分区
- 网络配置：

> 网络地址: 192.168.88.100 (不同主机ip不同)
>
> 子网掩码: 255.255.255.0
>
> 默认网关: 192.168.88.2 (vm的默认网关是x.x.x.2)
>
> DNS: 223.5.5.5 (阿里云DNS)

主机安装流程请见： [vmware安装centos7并制作多副本](https://blog.csdn.net/u011628753/article/details/127126209)

## 第四节 环境搭建

本次环境搭建安装三台CentOS，一主二从，然后在每台服务器上安装docker，kuberadmin，kubelet，kubectl程序。

### 1. 环境初始化

> 这里使用xshell7软件 链接到多台服务器。

**1、** 检查操作系统；

> 此方式安装kubenetes集群要求CentOS版本要在7.5或以上

```java
[root@master ~]# cat /etc/redhat-release
CentOS Linux release 7.9.2009 (Core)
```

**1、** 主机域名解析；

为了方便后面集群节点间的直接调用，在这配置一下主机名解析，企业中推荐使用内部DNS服务器

```java
vim /etc/hosts
```

```java
#主机名解析,编辑三台服务器的/etc/hosts文件,添加下面的内容
192.168.88.100  master
192.168.88.101  node1
192.168.88.102  node2
```

为了方便，可以使用发送键到所有会话，这样可以同时控制多个服务器，执行同样的命令。

**1、** 时间同步，kubernetes要求集群中的节点时间必须精确一致，这里直接使用chronyd服务从网络同步时间；

> 企业中建议配置内部的时间同步服务器

```java
systemctl start chronyd     启动chronyd服务
systemctl enable chronyd    设置chronyd服务开机自启动
date                        在chronyd服务启动后几秒，使用date命令验证时间
```

**1、** 禁用iptables和firewalld服务，kubernetes和docker在运行中会产生大量的iptables规则，为了不让系统规则跟它们混淆，直接关闭系统的规则；

```java
#关闭firealld服务
systemctl stop firewalld
systemctl disable firewalld
```

```java
#关闭iptables服务，这里没有iptables，所以可以忽略这一步
systemctl stop iptables
systemctl disable iptables
```

**5、** 禁用selinux，selinux是linux系统下的一个安全服务，如果不关闭它，在安装集群中会产生各种各样的奇葩问题；

```java
#查看selinux开启状态，默认是开启状态
[root@master ~]# getenforce
Enforcing
[root@master ~]# 
```

```java
#编辑 /etc/selinux/config 文件，修改SELINUX的值为disabled
#注意修改完毕后注意重启linux服务
vim /etc/selinux/config  
```

```java
SELINUX=disabled
```

**6、** 禁用swap分区；

> swap分区指的是虚拟内存分区，它的作用是在物理内存使用完之后，将磁盘空间虚拟成内存来使用

启用swap设备会对系统的性能产生非常负面的影响，因此kubernetes要求每个节点都要禁止swap设备

但是如果因为某些原因确实不能关闭swap分区，就需要在集群安装过程中通过明确的参数进行配置说明

```java
vim /etc/fstab
```

```java
#编辑分区配置文件/etc/fstab, 注释掉swap分区一行
#注意修改完成后重启linux服务
/dev/mapper/centos-root /                       xfs     defaults        0 0
UUID=97331e16-0f44-41fd-bb3b-103d0fa6095d /boot                   xfs     defaults        0 0
#/dev/mapper/centos-swap swap                    swap    defaults        0 0
```

**7、** 修改linux内核参数；

```java
vim /etc/sysctl.d/kubernetes.conf
```

```java
#修改linux的内核参数，添加网桥过滤和地址转发功能
#编辑/etc/sysctl.d/kubernetes.conf文件，添加如下配置:
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
net.ipv4.ip_forward = 1
```

```java
#重新加载配置
sysctl -p  
```

```java
#加载网桥过滤模块
modprobe br_netfilter
```

```java
#查看网桥过滤模块是否加载成功
lsmod | grep br_netfilter
```

**8、** 配置ipvs功能；

在kubernetes中service有两种代理模型，一种是基于iptables的，一种是基于ipvs的

两者比较的话，ipvs的性能明显更高一些，但是如果要使用它，需要手动载入ipvs模块

(1)安装ipset和ipvsadm

```java
yum install ipset ipvsadmin -y
```

(2)添加需要加载的模块写入脚本文件，(copy命令直接回车即可)

```java
cat <<EOF > /etc/sysconfig/modules/ipvs.modules
#!/bin/bash
modprobe -- ip_vs
modprobe -- ip_vs_rr
modprobe -- ip_vs_wrr
modprobe -- ip_vs_sh
modprobe -- nf_conntrack_ipv4
EOF
```

(3)为脚本文件添加执行权限

```java
chmod +x /etc/sysconfig/modules/ipvs.modules
```

(4)执行脚本文件

```java
/bin/bash /etc/sysconfig/modules/ipvs.modules
```

(5)查看相应的模块是否加载成功

```java
lsmod | grep -e ip_vs -e nf_conntrack_ipv4
```

**9、** 重启服务器；

上面步骤执行完成之后，重启一下linux服务

```java
reboot
```

**10、** 重启完成之后，检查一下；

```java
#查看SELINUX是否为禁用状态，可以看到为disabled状态 
getenforce
#查看内存分配，可以发现swap都为0
free -m 
```

### 2. 安装docker

(1). 切换镜像源(如果不切换，默认使用国外的镜像源，速度较慢)

```java
wget https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo -O /etc/yum.repos.d/docker-ce.repo
```

(2)查看当前镜像源中支持的docker版本

```java
yum list docker-ce --showduplicates
```

(3)安装特定版本的docker-ce

> 为什么安装这个版本(docker-ce-18.06.3.ce-3.el7)？
>
> 因为这个版本比较稳定，很多参数进行了初始化，不需要我们去修改。当然也可以选择其它版本。

```java
#必须指定--setopt=obsoletes=0，否则yum会自动安装更高版本
yum -y  install --setopt=obsoletes=0 docker-ce-18.06.3.ce-3.el7 
```

(4) 添加一个配置文件

```java
#Docker在默认的情况下使用Cgroup Driver为cgroups，而kubernetes推荐使用systemd来代替cgroups
```

```java
mkdir /etc/docker
```

```java
cat <<EOF > /etc/docker/daemon.json
{
   "exec-opts": ["native.cgroupdriver=systemd"],
   "registry-mirrors": ["https://khs8qcsu.mirror.aliyuncs.com"]
}
EOF
```

```java
systemctl daemon-reload 重新加载配置
```

> 注意 千万不要写成中文逗号，网上某些资料资料写中文逗号，直接坑死人

可以在阿里云容器镜像中找到自己的镜像加速器，也可以使用公共的镜像地址。如果不配置镜像地址，默认使用docker官方的地址。

(5)重启docker

```java
systemctl restart docker   重启docker
systemctl enable docker    设置开机启动
```

### 3. 安装kubernetes组件

**1、** 由于kubernetes的镜像源在国外，速度比较慢，这里使用阿里云的镜像；

编辑/etc/yum.repos.d/kubernetes.repo，添加下面的配置

```java
vim /etc/yum.repos.d/kubernetes.repo
```

```java
[kubernetes]
name=Kubernetes
baseurl=http://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64
enabled=1
gpgcheck=0
repo_gpgcheck=0
gpgkey=http://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg
       http://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg
```

**1、** 安装kubeadm、kubelet和kubectl；

```java
yum -y install --setopt=obsolete=0 kubeadm-1.17.4-0 kubelet-1.17.4-0 kubectl-1.17.4-0
```

**1、** 配置kubelet的cgroup；

```java
vim /etc/sysconfig/kubelet
```

```java
KUBELET_CGROUP_ARGS="--cgroup-driver=systemd"
KUB_PROXY_MODE="ipvs"
```

**4、** 设置kubelet开机自启动；

```java
systemctl enable kubelet
```

### 4. 准备集群镜像

> 由于kubernetes所需要的镜像在国外，某些原因导致我们无法访问，因此我们需要提前镜像。如果你的服务器在海外，则不需要准备镜像
>
> 在安装kubernetes集群前，必须提前准备好集群需要的镜像，所需的镜像可以通过命令查看

```java
kubeadm config images list
```

下载镜像，此镜像在kubernetes的仓库中，由于网络原因，无法连接，下面提供替代方案

```java
#此镜像在kubernets的仓库中，由于网络原因，无法连接，下面提供一种替代方案
```

```java
#定义集群镜像
images=(
    kube-apiserver:v1.17.4
    kube-controller-manager:v1.17.4
    kube-scheduler:v1.17.4
    kube-proxy:v1.17.4
    pause:3.1
    etcd:3.4.3-0
    coredns:1.6.5
)
```

```java
# 拉取镜像并修改镜像名
for imageName in ${images[@]} ; do
    docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/$imageName
    docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/$imageName k8s.gcr.io/$imageName
    docker rmi registry.cn-hangzhou.aliyuncs.com/google_containers/$imageName
done
```

```java
#查看镜像文件，可以看到镜像准备好了
docker images 
```

### 5. 集群初始化

下面集群进行初始化，并将node节点加入到集群

> 注意:只在master节点上执行即可

**1、** 创建集群；

```java
kubeadm init --kubernetes-version=v1.17.4 --pod-network-cidr=10.244.0.0/16 --service-cidr=10.96.0.0/12 --apiserver-advertise-address=192.168.88.100
```

> 192.168.88.100 是master节点的ip，需要变更为自己的master节点的ip，不要写127.0.0.1，因为集群其它节点无法找到你的master，建议写成内网ip

**1、** 创建HOME/.kube文件，并复制/etc/kubernetes/admin.conf到HOME/.kube文件，并复制/etc/kubernetes/admin.conf到HOME/.kube文件，并复制/etc/kubernetes/admin.conf到HOME/.kube/config，并给$HOME/.kube/config赋予执行权限；

```java
 mkdir -p $HOME/.kube
 sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
 sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

**1、** 添加node到集群；

> 注意: 在node1节点上执行，将node添加到集群中

```java
#命令在前面已红框标注
kubeadm join 192.168.88.100:6443 --token md5dfk.rwb3dww9dfwc6s01 \
    --discovery-token-ca-cert-hash sha256:3a77b5c3bee41edf3fa8e68a4b591bedf53d0b8a2d4cccc9c50e89733acb0012 
```

**1、** 回到master节点，查看节点情况，可以看到此时集群中包含了node1节点；

```java
kubectl get nodes
```

我们已经把node1节点加入到集群中，同样的操作，把node2节点加入到集群中。

### 6. 安装网络插件

查看节点，发现它们的状态是NotReady，为什么？

节点之间需要通信，我们需要为集群安装网络插件，才能使节点运行。如何安装网络插件？

kubernetes 支持多种网络插件，比如flannel、calico、canal等，任选一个即可。本次使用flannel

> 下面的操作只在master节点上执行即可，插件使用的是 DaemonSet的控制器，它会在每个节点上都运行

**1、** 获取fannel的配置文件；

```java
wget  https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
```

**1、** 修改文件中的quay.io仓库为quay-mirror.qiniu.com；

> 直接用下面这个文件即可，不用wget取文件太麻烦。
>
> kube-flannel.yml

```java
---
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: psp.flannel.unprivileged
  annotations:
    seccomp.security.alpha.kubernetes.io/allowedProfileNames: docker/default
    seccomp.security.alpha.kubernetes.io/defaultProfileName: docker/default
    apparmor.security.beta.kubernetes.io/allowedProfileNames: runtime/default
    apparmor.security.beta.kubernetes.io/defaultProfileName: runtime/default
spec:
  privileged: false
  volumes:
  - configMap
  - secret
  - emptyDir
  - hostPath
  allowedHostPaths:
  - pathPrefix: "/etc/cni/net.d"
  - pathPrefix: "/etc/kube-flannel"
  - pathPrefix: "/run/flannel"
  readOnlyRootFilesystem: false
  Users and groups
  runAsUser:
    rule: RunAsAny
  supplementalGroups:
    rule: RunAsAny
  fsGroup:
    rule: RunAsAny
  Privilege Escalation
  allowPrivilegeEscalation: false
  defaultAllowPrivilegeEscalation: false
  Capabilities
  allowedCapabilities: ['NET_ADMIN', 'NET_RAW']
  defaultAddCapabilities: []
  requiredDropCapabilities: []
  Host namespaces
  hostPID: false
  hostIPC: false
  hostNetwork: true
  hostPorts:
  - min: 0
    max: 65535
  SELinux
  seLinux:
    SELinux is unused in CaaSP
    rule: 'RunAsAny'
---
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: flannel
rules:
- apiGroups: ['extensions']
  resources: ['podsecuritypolicies']
  verbs: ['use']
  resourceNames: ['psp.flannel.unprivileged']
- apiGroups:
  - ""
  resources:
  - pods
  verbs:
  - get
- apiGroups:
  - ""
  resources:
  - nodes
  verbs:
  - list
  - watch
- apiGroups:
  - ""
  resources:
  - nodes/status
  verbs:
  - patch
---
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: flannel
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: flannel
subjects:
- kind: ServiceAccount
  name: flannel
  namespace: kube-system
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: flannel
  namespace: kube-system
---
kind: ConfigMap
apiVersion: v1
metadata:
  name: kube-flannel-cfg
  namespace: kube-system
  labels:
    tier: node
    app: flannel
data:
  cni-conf.json: |
    {
      "name": "cbr0",
      "cniVersion": "0.3.1",
      "plugins": [
        {
          "type": "flannel",
          "delegate": {
            "hairpinMode": true,
            "isDefaultGateway": true
          }
        },
        {
          "type": "portmap",
          "capabilities": {
            "portMappings": true
          }
        }
      ]
    }
  net-conf.json: |
    {
      "Network": "10.244.0.0/16",
      "Backend": {
        "Type": "vxlan"
      }
    }
---
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: kube-flannel-ds
  namespace: kube-system
  labels:
    tier: node
    app: flannel
spec:
  selector:
    matchLabels:
      app: flannel
  template:
    metadata:
      labels:
        tier: node
        app: flannel
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: kubernetes.io/os
                operator: In
                values:
                - linux
      hostNetwork: true
      priorityClassName: system-node-critical
      tolerations:
      - operator: Exists
        effect: NoSchedule
      serviceAccountName: flannel
      initContainers:
      - name: install-cni
        image: quay.io/coreos/flannel:v0.14.0
        command:
        - cp
        args:
        - -f
        - /etc/kube-flannel/cni-conf.json
        - /etc/cni/net.d/10-flannel.conflist
        volumeMounts:
        - name: cni
          mountPath: /etc/cni/net.d
        - name: flannel-cfg
          mountPath: /etc/kube-flannel/
      containers:
      - name: kube-flannel
        image: quay.io/coreos/flannel:v0.14.0
        command:
        - /opt/bin/flanneld
        args:
        - --ip-masq
        - --kube-subnet-mgr
        resources:
          requests:
            cpu: "100m"
            memory: "50Mi"
          limits:
            cpu: "100m"
            memory: "50Mi"
        securityContext:
          privileged: false
          capabilities:
            add: ["NET_ADMIN", "NET_RAW"]
        env:
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: POD_NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        volumeMounts:
        - name: run
          mountPath: /run/flannel
        - name: flannel-cfg
          mountPath: /etc/kube-flannel/
      volumes:
      - name: run
        hostPath:
          path: /run/flannel
      - name: cni
        hostPath:
          path: /etc/cni/net.d
      - name: flannel-cfg
        configMap:
          name: kube-flannel-cfg
```

上传文件到master

**4、** 安装flannel；

```java
kubectl apply -f kube-flannel.yml
```

**5、** 稍等片刻，可以查看到节点准备状态；

```java
kubectl get nodes
```

到这里kubernetes集群就搭建成功了。

## 第五节 服务部署

下面我们使用kubernetes，在集群中部署一个nginx程序，测试一下集群是否正常工作。

> 所有的部署操作都只需要在master进行即可。

### 1. 部署nginx

**1、** 部署nginx；

```java
kubectl create deployment nginx --image=nginx:1.14-alpine
```

**1、** 暴露端口；

```java
kubectl expose deployment nginx --port=80 --type=NodePort
```

**1、** 查看服务状态，可以看到nginx在32437这个端口对外提供服务；

```java
kubectl get pod pod
kubectl get svc svc就是service,也可以写成kubectl get service
```

**1、** 访问一下nginx页面，注意端口号是前面查看到的端口；

## 第六节 扩展内容

### 1. 自建DNS服务器

前面搭建安装kubernetes集群的过程中，在每台主机上配置host，但是在企业中通常使用自建DNS服务器。

docker应用篇(9):搭建DNS服务器

### 2. 时间同步服务器

kubernetes集群中时间同步是非常重要的，服务器可能出现时间的同步问题，通常我们会自建时间同步服务器或者使用阿里云为我们提供的NTP服务器。下面是阿里云提供的NTP服务器，既可以用于内网，也可以用于公网。

[同步服务器本地时间](https://help.aliyun.com/document_detail/108415.html)

> 阿里云已经提供了大量的NTP服务器，适用于不同的网络位置，并且针对不同的操作系统，提供了对应的操作指南。
