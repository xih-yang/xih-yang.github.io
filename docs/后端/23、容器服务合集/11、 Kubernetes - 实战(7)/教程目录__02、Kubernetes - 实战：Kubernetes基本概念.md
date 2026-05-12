# 02、Kubernetes - 实战：Kubernetes基本概念
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/7/2.html
- 分类：容器服务
- 分组：教程目录
## Kubernetes组件

## 详细概念

### 1、Master

负责管理群集，协调集群中的所有活动，例如调度应用程序，维护应用程序的所需状态，扩展应用程序以及推出新的更新。

### 2、Node

充当Kubernetes 集群中的辅助计算机的VM或物理计算机。每个节点都有一个 Kubelet，它是用于管理节点并与 Master 通信的代理。Node 是 Kubernetes 中的参与计算的机器，可以是虚拟机或物理计算机，具体取决于集群。每个 Node 由 Master 管理。Node 可以有多个 Pod ，Master 会自动处理群集中的 Node 并在上面调度 Pod 。Master 的自动调度会参考每个Node 上的可用资源从而进行资源均衡。在Node上运行的服务进程包括docker daemon，Kubelet 和 Kube-Proxy

### 3、Pod

Pod是 Kubernetes 调度的基本单位。 当我们在 Kubernetes 上创建 Deployment 时，该 Deployment 会在其中创建包含容器的 Pod （而不是直接创建容器）。每个 Pod 都与调度它的 Node 绑定，并保持在那里直到终止（根据重启策略）或删除。 如果 Node 发生故障，则会在群集中的其他可用 Node 上调度相同的 Pod。

Kubernetes 使用 Pod 来管理容器，每个 Pod 可以包含一个或多个紧密关联的容器(container)。

例如，Pod 可能既包含带有 Node.js 应用的容器，也包含另一个不同的容器(如 nginx 提供代理服务)，用于提供 Node.js 网络服务器要发布的数据。Pod 中的容器共享 IP 地址和端口，始终位于同一位置并且共同调度，并在同一 Node 上的共享上下文中运行。Pod 是一组紧密关联的容器集合，它们共享 PID、IPC、Network 和 UTS namespace，共享网络和文件系统，可以通过进程间通信和文件共享这种简单高效的方式组合完成服务。

### 4、Deployment

Deployment 为 Pod 和 Replica Set（下一代 Replication Controller）提供声明式更新。

你只需要在 Deployment 中描述你想要的目标状态是什么，Deployment controller 就会帮你将 Pod 和 Replica Set 的实际状态改变到你的目标状态。你可以定义一个全新的 Deployment，也可以创建一个新的替换旧的 Deployment。

一个典型的用例如下：

使用Deployment 来创建 ReplicaSet。ReplicaSet 在后台创建 pod。检查启动状态，看它是成功还是失败。

然后，通过更新 Deployment 的 PodTemplateSpec 字段来声明 Pod 的新状态。这会创建一个新的 ReplicaSet，Deployment 会按照控制的速率将 pod 从旧的 ReplicaSet 移动到新的 ReplicaSet 中。

如果当前状态不稳定，回滚到之前的 Deployment revision。每次回滚都会更新 Deployment 的 revision。

扩容Deployment 以满足更高的负载。

暂停Deployment 来应用 PodTemplateSpec 的多个修复，然后恢复上线。

根据Deployment 的状态判断上线是否 hang 住了。

清除旧的不必要的 ReplicaSet。

Deployment 是我们经常用到的资源类型，一般来说不会直接操作 `pod` ，而是通过 `deployment`

来描述`pod` 的期望状态，然后交由 `deployment` 来帮助我们管理 `pod` 。

### 5、Replication controller

控制一个 pod 在集群上运行的实例数量。确保任何时候Kubernetes集群中有指定数量的Pod副本在运行， 如果少于指定数量的Pod副本，Replication Controller会启动新的Pod，反之会杀死多余的以保证数量不变。

### 6、Service

将服务内容与具体的pod分离。Kubernetes服务代理负责自动将服务请求分发到正确的pod处，不管pod移动到集群中的什么位置，甚至可以被替换掉。Service是定义一系列Pod以及访问这些Pod的策略的一层抽象。service 通过 pod 的 label 和 pod 进行匹配

Kubernetes ServiceTypes 允许指定一个需要的类型的 Service，默认是 ClusterIP 类型。

### 7、Kubelet

这个守护进程从master或者其他地方获取本节点需要达到什么状态, 运行在各个工作节点上，负责获取容器列表，运行的副本数量, 网络或者存储如何配置,保证被声明的容器已经启动并且正常运行。

### 8、Kube-proxy

实现集群网络服务负载均衡

### 9、DNS

DNS服务器监视着创建新 Service 的 Kubernetes API，从而为每一个 Service 创建一组 DNS 记录。 如果整个集群的 DNS 一直被启用，那么所有的 Pod 应该能够自动对 Service 进行名称解析。

### 10、Volume(存储卷)

Volume是Pod中能够被多个容器访问的共享目录。

### 11、Namespace(命名空间)

通过将系统内部的对象“分配”到不同的Namespace中，形成逻辑上的不同分组，便于在共享使用整个集群的资源同时还能分别管理。

### 12、Annotation(注解)

与Label类似，但Label定义的是对象的元数据，而Annotation则是用户任意定义的“附加”信息。

### 13、Ingress

通常情况下，service 和 pod 的 IP 仅可在集群内部访问。集群外部的请求要想访问到 service 就需要通过负载均衡转发，首先到 service 在 Node 上暴露的 Port 上，然后再由 kube-proxy 将其转发给相关的 Pod 或者丢弃。如下图所示

简而言之，Ingress 可以给 service 提供集群外部访问的 URL、负载均衡、SSL 终止、HTTP 路由等。为了配置这些 Ingress 规则，集群管理员需要部署一个 Ingress controller，它监听 Ingress 和 service 的变化，并根据规则配置负载均衡并提供访问入口。

Ingress 控制器

为了让Ingress 资源工作，集群必须有一个正在运行的 Ingress 控制器。与作为 kube-controller-manager 可执行文件的一部分运行的其他类型的控制器不同，Ingress 控制器不是随集群自动启动的。 需要自行选择最适合您的集群的 ingress 控制器实现。

Kubernetes 作为一个项目，目前支持和维护 GCE 和 nginx 控制器。

我们部署在集群里的服务的svc想暴露出来的时候，从长久眼光看和易于管理维护都是用的Ingress Controller来处理，clusterip非集群主机无法访问，Nodeport不方便长久管理和效率，LB服务多了不方便因为需要花费额外的钱，externalIPS不好用。

### 14、ConfigMap

应用程序的运行可能会依赖一些配置，而这些配置又是可能会随着需求产生变化的，如果我们的应用程序架构不是应用和配置分离的，那么就会存在当我们需要去修改某些配置项的属性时需要重新构建镜像文件的窘境。现在，ConfigMap 组件可以很好的帮助我们实现应用和配置分离，避免因为修改配置项而重新构建镜像。

ConfigMap 用于保存配置数据的键值对，可以用来保存单个属性，也可以用来保存配置文件。ConfigMap 跟 Secret 很类似，但它可以更方便地处理不包含敏感信息的字符串。

configMap 可以挂载到环境变量或者作为容器文件使用（通过 volume）。

### 15、Secret

Secret 类似 configMap 但是解决了密码、token、密钥等敏感数据的配置问题，而不需要把这些敏感数据暴露到镜像或者 Pod Spec 中。Secret 可以以 Volume 或者环境变量的方式使用

Secret 有三种类型：

1)Opaque：base64 编码格式的 Secret，用来存储密码、密钥等；但数据也通过 base64 --decode 解码得到原始数据，所有加密性很弱。

2)kubernetes.io/dockerconfigjson：用来存储私有 docker registry 的认证信息。

3)kubernetes.io/service-account-token： 用于被 serviceaccount 引用。serviceaccout 创建时 Kubernetes 会默认创建对应的 secret。Pod 如果使用了 serviceaccount，对应的 secret 会自动挂载到 Pod 的 /run/secrets/kubernetes.io/serviceaccount 目录中
