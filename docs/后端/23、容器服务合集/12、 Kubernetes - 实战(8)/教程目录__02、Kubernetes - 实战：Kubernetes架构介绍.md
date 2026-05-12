# 02、Kubernetes - 实战：Kubernetes架构介绍
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/8/2.html
- 分类：容器服务
- 分组：教程目录
## 一、Kubernetes架构介绍

## 1、Kubernetes架构图

## 2、Kubernetes组件功能介绍

### 1、API Server

kube-apiserver 是 Kubernetes 最重要的核心组件之一，主要提供以下的功能

- 提供集群管理的 REST API 接口，包括认证授权、数据校验以及集群状态变更等
- 提供其他模块之间的数据交互和通信的枢纽（其他模块通过 API Server 查询或修改数据，只有 API Server 才直接操作 etcd）

`$` kubectl api-versions # 查看API信息

### 2、Kube-scheduler

kube-scheduler 负责分配调度 Pod 到集群内的节点上，它监听 kube-apiserver，查询还未分配 Node 的 Pod，然后根据调度策略为这些 Pod 分配节点（更新 Pod 的NodeName 字段）。

调度器需要充分考虑诸多的因素：

- 公平调度
- 资源高效利用
- QoS
- affinity 和 anti-affinity
- 数据本地化（data locality）
- 内部负载干扰（inter-workload interference）
- deadlines

指定Node 节点调度

有三种方式指定 Pod 只运行在指定的 Node 节点上

- nodeSelector：只调度到匹配指定 label 的 Node 上
- nodeAffinity：功能更丰富的 Node 选择器，比如支持集合操作
- podAffinity：调度到满足条件的 Pod 所在的 Node 上

nodeSelector 示例

首先给 Node 打上标签

$ kubectl label nodes node-01 disktype=ssd

然后在 daemonset 中指定 nodeSelector 为 disktype=ssd ：

```java
spec:
  nodeSelector:
    disktype: ssd
```

### 3、Controller Manager

Controller Manager 由 kube-controller-manager 和 cloud-controller-manager 组成，是Kubernetes 的大脑，它通过 apiserver 监控整个集群的状态，并确保集群处于预期的工作状态。

kube-controller-manager 由一系列的控制器组成：

- Replication Controller
- Node Controller
- CronJob Controller
- Daemon Controller
- Deployment Controller
- Endpoint Controller
- Garbage Collector
- Namespace Controller
- Job Controller
- Pod AutoScaler
- RelicaSet
- Service Controller
- ServiceAccount Controller
- StatefulSet Controller
- Volume Controller
- Resource quota Controller

kube-controller-manager 由一系列的控制器组成，这些控制器可以划分为三组

**1、** 必须启动的控制器；

• EndpointController

• ReplicationController

• PodGCController

• ResourceQuotaController

• NamespaceController

• ServiceAccountController

• GarbageCollectorController

• DaemonSetController

• JobController

• DeploymentController

• ReplicaSetController

• HPAController

• DisruptionController

• StatefulSetController

• CronJobController

• CSRSigningController

• CSRApprovingController

• TTLController
**2、** 默认启动的可选控制器，可通过选项设置是否开启；

• TokenController

• NodeController

• ServiceController

• RouteController

• PVBinderController

• AttachDetachController
**3、** 默认禁止的可选控制器，可通过选项设置是否开启；

• BootstrapSignerController

• TokenCleanerController

### 4、Kubelet

每个Node节点上都运行一个 Kubelet 服务进程，默认监听 10250 端口，接收并执行Master 发来的指令，管理 Pod 及 Pod 中的容器。每个 Kubelet 进程会在 API Server 上注册所在Node节点的信息，定期向 Master 节点汇报该节点的资源使用情况，并通过cAdvisor 监控节点和容器的资源。

### 5、Kube-proxy

每台机器上都运行一个 kube-proxy 服务，它监听 API server 中 service 和 endpoint 的变化情况，并通过 iptables 等来为服务配置负载均衡（仅支持 TCP 和 UDP）。

kube-proxy 可以直接运行在物理机上，也可以以 static pod 或者 daemonset 的方式运行。

### 6、DNS

DNS是 Kubernetes 的核心功能之一，通过 kube-dns 或 CoreDNS 作为集群的必备扩展来提供命名服务。

### 7、Core-dns

从v1.11 开始可以使用 CoreDNS 来提供命名服务，并从 v1.13 开始成为默认 DNS 服务。CoreDNS 的特点是效率更高，资源占用率更小，推荐使用 CoreDNS 替代 kube-dns 为集群提供 DNS 服务。

从kube-dns 升级为 CoreDNS 的步骤为：

$git clone [https://github.com/coredns/deployment](https://github.com/coredns/deployment)

$cd deployment/kubernetes

$./deploy.sh | kubectl apply -f -

$kubectl delete --namespace=kube-system deployment kube-dns

### 8、kubeadm

kubeadm 是 Kubernetes 主推的部署工具之一，正在快速迭代开发中。

所有机器都需要初始化容器执行引擎（如 docker 或 frakti 等）和 kubelet。这是因为kubeadm 依赖 kubelet 来启动 Master 组件，比如 kube-apiserver、kube-manager-controller、kube-scheduler、kube-proxy 等。

初始化Master

在初始化 master 时，只需要执行 kubeadm init 命令即可，比如

kubeadm init --pod-network-cidr 10.244.0.0/16 --kubernetes-version stable

这个命令会自动

•系统状态检查

•生成 token

•生成自签名 CA 和 client 端证书

•生成 kubeconfig 用于 kubelet 连接 API server

•为Master 组件生成 Static Pod manifests，并放到

•/etc/kubernetes/manifests 目录中

•配置 RBAC 并设置 Master node 只运行控制平面组件

•创建附加服务，比如 kube-proxy 和 kube-dns

网络插件

•Flannel

•Weave

•Calico

添加Node

token=$(kubeadm token list | grep authentication,signing | awk '{print $1}')

kubeadm join --token $token ${master_ip}

这包括以下几个步骤

- 从 API server 下载 CA
- 创建本地证书，并请求 API Server 签名
- 最后配置 kubelet 连接到 API Server

删除安装

kubeadm reset

### 9、Hyperkube

hyperkube是Kubernetes的allinone binary，可以用来启动多种kubernetes服务，常用在

Docker镜像中。每个Kubernetes发布都会同时发布一个包含hyperkube的docker镜像，

如gcr.io/google_containers/hyperkube:v1.6.4 。

hyperkube支持的子命令包括

- kubelet
- apiserver
- controller-manager
- federation-apiserver
- federation-controller-manager
- kubectl
- proxy
- scheduler

### 10、Kubectl

kubectl 是 Kubernetes 的命令行工具（CLI），是 Kubernetes 用户和管理员必备的管理工具。

- kubectl -h 查看子命令列表
- kubectl options 查看全局选项
- kubectl --help 查看子命令的帮助
- kubectl [command] [PARAMS] -o= 设置输出格式（如 json、yaml、jsonpath 等）
- kubectl explain [RESOURCE] 查看资源的定义

### 11、Etcd

- Etcd是CoreOS基于Raft协议开发的分布式key-value存储，可用于服务发现、共享配置以及一致性保障（如数据库选主、分布式锁等）。
- 在分布式系统中，如何管理节点间的状态一直是一个难题，etcd像是专门为集群环境的服务发现和注册而涉及，它提供了数据TTL失效、数据改变监视、多值、目录监听、分布式锁原子操作等功能，可以方便的跟踪并管理集群节点的状态。
- Etcd负责保存整个Kubernetes集群的状态
