# 12、Kubernetes 实战 - 二进制方式搭建Kubernetes集群（完结）
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/1/12.html
- 分类：容器服务
- 分组：教程目录
## 配置集群参数

```sh
# 必要配置 因为垃圾电脑，删了master003....
cd /etc/ansible && cp example/hosts.multi-node hosts
# 编写配置文件，需要修改的内容为已贴出
vim hosts 
# kuberntes 集群使用 etcd 存储所有数据，是最重要的组件之一，注意 etcd集群需要奇数个节点(1,3,5...)，本文档使用3个节点做集群。
[etcd]
192.168.58.100 NODE_NAME=etcd1
192.168.58.101 NODE_NAME=etcd2
192.168.58.103  NODE_NAME=etcd3
# master节点地址
[kube-master]
192.168.58.100
192.168.58.101
# work节点地址
[kube-node]
192.168.58.103
192.168.58.104
192.168.58.105
# 设置网络插件
CLUSTER_NETWORK="calico"
```

## 1.2.创建证书和安装准备/安装etcd集群

```sh
# 基础配置，可以查看脚本安装提示
ansible-playbook 01.prepare.yml
# 安装etcd集群
ansible-playbook 02.etcd.yml
# 查看etcd
systemctl status etcd
```

## 3.安装docker

```sh
ansible-playbook 03.docker.yml
# 查看docker状态
systemctl status docker 
# 查看版本
docker -v
```

## 4.安装master节点

部署master节点主要包含三个组件apiserver scheduler controller-manager，其中：

apiserver提供集群管理的REST API接口，包括认证授权、数据校验以及集群状态变更等

**只有API Server才直接操作etcd**

其他模块通过API Server查询或修改数据

提供其他模块之间的数据交互和通信的枢纽

**scheduler负责分配调度Pod到集群内的node节点**

监听kube-apiserver，查询还未分配Node的Pod

根据调度策略为这些Pod分配节点

controller-manager由一系列的控制器组成，它通过apiserver监控整个集群的状态，并确保集群处于预期的工作状态

```sh
ansible-playbook 04.kube-master.yml
# 查看进程状态
systemctl status kube-apiserver
systemctl status kube-controller-manager
systemctl status kube-scheduler
```

## 5.安装node节点

kube-node 是集群中运行工作负载的节点，前置条件需要先部署好kube-master节点，它需要部署如下组件：

- docker：运行容器
- kubelet： kube-node上最主要的组件
- kube-proxy： 发布应用服务与负载均衡
- haproxy：用于请求转发到多个 apiserver，详见HA-2x 架构
- calico： 配置容器网络 (或者其他网络组件)

```sh
# 安装
ansible-playbook 05.kube-node.yml
# 查看状态
systemctl status kubelet	
systemctl status kube-proxy
# 查看日志
journalctl -u kubelet		
journalctl -u kube-proxy 
# 查看所有节点
kubectl get node
```

## 6.安装网络组件

首先回顾下K8S网络设计原则，在配置集群网络插件或者实践K8S 应用/服务部署请时刻想到这些原则：

**1、** 每个Pod都拥有一个独立IP地址，Pod内所有容器共享一个网络命名空间；

**2、** 集群内所有Pod都在一个直接连通的扁平网络中，可通过IP直接访问；

所有容器之间无需NAT就可以直接互相访问

所有Node和所有容器之间无需NAT就可以直接互相访问

容器自己看到的IP跟其他容器看到的一样
**3、** ServiceclusterIP尽可在集群内部访问，外部请求需要通过NodePort、LoadBalance或者Ingress来访问；

Container Network Interface (CNI)是目前CNCF主推的网络模型，它由两部分组成：

CNIPlugin负责给容器配置网络，它包括两个基本的接口

配置网络: AddNetwork(net *NetworkConfig, rt *RuntimeConf) (types.Result, error)

清理网络: DelNetwork(net *NetworkConfig, rt *RuntimeConf) error

IPAM Plugin负责给容器分配IP地址

Kubernetes Pod的网络是这样创建的：

**1、** 每个Pod除了创建时指定的容器外，都有一个kubelet启动时指定的基础容器，比如：easzlab/pause-amd64registry.access.redhat.com/rhel7/pod-infrastructure；

**2、** 首先kubelet创建基础容器生成networknamespace；

**3、** 然后kubelet调用网络CNIdriver，由它根据配置调用具体的CNI插件；

**4、** 然后CNI插件给基础容器配置网络；

**5、** 最后Pod中其他的容器共享使用基础容器的网络；

本项目基于CNI driver 调用各种网络插件来配置kubernetes的网络，常用CNI插件有 flannel calico weave等等，这些插件各有优势，也在互相借鉴学习优点，比如：在所有node节点都在一个二层网络时候，flannel提供hostgw实现，避免vxlan实现的udp封装开销，估计是目前最高效的；calico也针对L3 Fabric，推出了IPinIP的选项，利用了GRE隧道封装；因此这些插件都能适合很多实际应用场景。

项目当前内置支持的网络插件有：calico cilium flannel kube-ovn kube-router

```sh
# 安装
ansible-playbook 06.network.yml
```

## 7.安装集群主要插件

```sh
# 安装
ansible-playbook 07.cluster-addon.yml
```

## 集群验证(安装nginx)

```sh
# 编写资源配置
vim nginx-test.yml
# 添加内容
apiVersion: v1
kind: ReplicationController
metadata:
  name: nginx-test
spec:
  template:
    metadata:
      labels:
        app: nginx-test
    spec:
      containers:
      - name: nginx
        image: daocloud.io/library/nginx:1.7.11
        ports:
        - containerPort: 80
# 创建
kubectl create -f nginx-test.yml
# 列出所有 pod 并显示详细信息
kubectl get pods -o wide
# 访问
curl 172.20.112.193
```
