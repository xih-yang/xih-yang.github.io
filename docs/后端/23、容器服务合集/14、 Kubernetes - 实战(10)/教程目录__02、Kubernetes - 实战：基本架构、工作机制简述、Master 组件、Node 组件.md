# 02、Kubernetes - 实战：基本架构、工作机制简述、Master 组件、Node 组件
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/10/2.html
- 分类：容器服务
- 分组：教程目录
## 1. Kubernetes 的基本架构

`Kubernetes` 采用了现今流行的“控制面 / 数据面”（`Control Plane / Data Plane`）架构，集群里的计算机被称为“节点”（`Node`），可以是实机也可以是虚机，少量的节点用作控制面来执行集群的管理维护工作，其他的大部分节点都被划归数据面，用来跑业务应用。

- 控制面的节点在 Kubernetes 里叫做 Master Node，一般简称为 Master，它是整个集群里最重要的部分，可以说是Kubernetes 的大脑和心脏。
- 数据面的节点叫做 Worker Node，一般就简称为 Worker 或者 Node，相当于 Kubernetes 的手和脚，在 Master 的指挥下干活。

`Node` 的数量非常多，构成了一个资源池，`Kubernetes` 就在这个池里分配资源，调度应用。因为资源被“池化”了，所以管理也就变得比较简单，可以在集群中任意添加或者删除节点。

在这张架构图里，我们还可以看到有一个 `kubectl`，它就是 `Kubernetes` 的客户端工具，用来操作 `Kubernetes`，但它位于集群之外，理论上不属于集群。

你可以使用命令 `kubectl get node` 来查看 `Kubernetes` 的节点状态：

```java
$ kubectl get node
NAME       STATUS   ROLES                  AGE   VERSION
minikube   Ready    control-plane,master   18h   v1.23.3
```

可以看到当前的 `minikube` 集群里只有一个 `Master`，那 `Node` 怎么不见了？

这是因为 `Master` 和 `Node` 的划分不是绝对的。当集群的规模较小，工作负载较少的时候，`Master` 也可以承担 `Node` 的工作，就像我们搭建的 `minikube` 环境，它就只有一个节点，这个节点既是 `Master` 又是 `Node`。

## 2. 节点内部的结构

`Kubernetes` 的节点内部也具有复杂的结构，是由很多的模块构成的，这些模块又可以分成组件（`Component`）和插件（`Addon`）两类。

组件实现了 `Kubernetes` 的核心功能特性，没有这些组件 `Kubernetes` 就无法启动，而插件则是 `Kubernetes` 的一些附加功能，属于“锦上添花”，不安装也不会影响 `Kubernetes` 的正常运行。

### 2.1 Master 里的组件

`Master` 里有 4 个组件，分别是 `apiserver`、`etcd`、`scheduler`、`controller-manager`。

- apiserver 是 Master 节点——同时也是整个 Kubernetes 系统的唯一入口，它对外公开了一系列的 RESTful API，并且加上了验证、授权等功能，所有其他组件都只能和它直接通信，可以说是 Kubernetes 里的联络员。负责集群中所有组件通信，访问它必须经过授权于认证。
- etcd 是一个高可用的分布式 Key-Value 数据库，用来持久化存储系统里的各种资源对象和状态，相当于 Kubernetes 里的配置管理员。注意它只与 apiserver 有直接联系，也就是说任何其他组件想要读写 etcd 里的数据都必须经过 apiserver。
- scheduler 负责容器的编排工作，检查节点的资源状态，把 Pod 调度到最适合的节点上运行，相当于部署人员。因为节点状态和 Pod 信息都存储在 etcd 里，所以 scheduler 必须通过 apiserver 才能获得。

> 调度器职责是监听 API Server 来启动工作任务，并分配合适的节点。它的核心是排序系统，该系统有评分机制，将工作分配到分数最高的节点来运行任务。调度器确定可以执行任务的节点后，还会再进行前置校验，例如该节点是否仍然存在、分配的任务需要的端口当前选择的工作节点是否可以访问等，如果无法通过，该节点会被直接忽略，如果调度器最后无法找到合适的工作节点，则当前任务无法被调度，并被标记为暂停状态。
>
> 需要特别注意，调度器不负责运行任务，只为任务负责分配合适的工作节点。

- controller-manager 负责维护容器和节点等资源的状态，实现故障检测、服务迁移、应用伸缩等功能，相当于监控运维人员。同样地，它也必须通过 apiserver 获得存储在 etcd 里的信息，才能够实现对资源的各种操作。

> 它实现了控制循环，完成集群监控与事件响应。它负责创建 controller。一般控制循环包括：工作节点 controller、终端 controller 以及副本 controller。集群监控目的是保证集群当前状态与期望状态相匹配。集群监控基础逻辑大致如下：（获取期望状态、观察当前状态、判断差异、变更消除差异点）。

这4个组件也都被容器化了，运行在集群的 `Pod` 里，我们可以用 `kubectl` 来查看它们的状态，使用命令：

```java
$ kubectl get pod -n kube-system
NAME                               READY   STATUS    RESTARTS        AGE
coredns-64897985d-rrw8v            1/1     Running   0               5h17m
etcd-minikube                      1/1     Running   0               5h17m
kube-apiserver-minikube            1/1     Running   0               5h17m
kube-controller-manager-minikube   1/1     Running   0               5h17m
kube-proxy-9bv6z                   1/1     Running   0               5h17m
kube-scheduler-minikube            1/1     Running   0               5h17m
storage-provisioner                1/1     Running   1 (5h16m ago)   5h17m
```

注意命令行里要用 `-n kube-system` 参数，表示检查 `kube-system` 名字空间里的 `Pod`，至于名字空间是什么，我们后面会讲到。

### 2.2 Node 里的组件

`Master` 里的 `apiserver`、`scheduler` 等组件需要获取节点的各种信息才能够作出管理决策，那这些信息该怎么来呢？

这就需要 `Node` 里的 3 个组件了，分别是 `kubelet`、`kube-proxy`、`container-runtime`。

- kubelet 是 Node 的代理，负责管理 Node 相关的绝大部分操作，Node 上只有它能够与 apiserver 通信，实现状态报告、命令下发、启停容器等功能，相当于是 Node 上的一个“小管家”。工作节点的核心部分。新工作节点加入节点后，Kubelet 会被部署到新节点，然后 Kubelet 将当前节点注册到集群中。它还有一个职责，监听 API Server 分配的任务，监听到就执行该任务，并维护一个与控制平面的通信频道。
- kube-proxy 的作用有点特别，它是 Node 的网络代理，只负责管理容器的网络通信，简单来说就是为 Pod 转发 TCP/UDP 数据包，相当于是专职的“小邮差”。
- container-runtime 是容器和镜像的实际使用者，在 kubelet 的指挥下创建容器，管理 Pod 的生命周期，是真正干活的“苦力”。工作节点需要通过它来获取、启动、停止执行任务依赖的容器，它负责容器管理与运行逻辑。

我们一定要注意，因为 `Kubernetes` 的定位是容器编排平台，所以它没有限定 `container-runtime` 必须是 `Docker`，完全可以替换成任何符合标准的其他容器运行时，例如 `containerd`、`CRI-O` 等等，只不过在这里我们使用的是 `Docker`。

这3个组件中只有 `kube-proxy` 被容器化了，而 `kubelet` 因为必须要管理整个节点，容器化会限制它的能力，所以它必须在 `container-runtime` 之外运行。

使用`minikube ssh` 命令登录到节点后，可以用 `docker ps` 看到 `kube-proxy`：

```java
$ minikube ssh
Last login: Tue Dec 27 07:28:14 2022 from 192.168.49.1
docker@minikube:~$ docker ps | grep kube-proxy
3b96a6d7c991   9b7cc9982109           "/usr/local/bin/kube…"   18 hours ago   Up 18 hours             k8s_kube-proxy_kube-proxy-9bv6z_kube-system_4eb70a9d-5b2b-4b98-b9cb-beb7fcd55860_0
f552eb12a465   k8s.gcr.io/pause:3.6   "/pause"                 18 hours ago   Up 18 hours             k8s_POD_kube-proxy-9bv6z_kube-system_4eb70a9d-5b2b-4b98-b9cb-beb7fcd55860_0
```

而`kubelet` 用 `docker ps` 是找不到的，需要用操作系统的 `ps` 命令

```java
$ ps -ef | grep kubelet
root        2274       1  4 Dec27 ?        00:48:59 /var/lib/minikube/binaries/v1.23.3/kubelet --bootstrap-kubeconfig=/etc/kubernetes/bootstrap-kubelet.conf --config=/var/lib/kubelet/config.yaml --container-runtime=docker --hostname-override=minikube --housekeeping-interval=5m --kubeconfig=/etc/kubernetes/kubelet.conf --node-ip=192.168.49.2
```

现在，我们再把 `Node` 里的组件和 `Master` 里的组件放在一起来看，就能够明白 `Kubernetes` 的大致工作流程了：

- 每个 Node 上的 kubelet 会定期向 apiserver 上报节点状态，apiserver 再存到 etcd 里。
- 每个 Node 上的 kube-proxy 实现了 TCP/UDP 反向代理，让容器对外提供稳定的服务。
- scheduler 通过 apiserver 得到当前的节点状态，调度 Pod，然后 apiserver 下发命令给某个 Node 的 kubelet，kubelet 调用 container-runtime 启动容器。
- controller-manager 也通过 apiserver 得到实时的节点状态，监控可能的异常情况，再使用相应的手段去调节恢复。

于是，这些组件就好像是无数个不知疲倦的运维工程师，把原先繁琐低效的人力工作搬进了高效的计算机里，就能够随时发现集群里的变化和异常，再互相协作，维护集群的健康状态。

### 2.3 插件（Addons）

只要服务器节点上运行了 `apiserver`、`scheduler`、`kubelet`、`kube-proxy`、`container-runtime` 等组件，就可以说是一个功能齐全的 `Kubernetes` 集群了。

由于`Kubernetes` 本身的设计非常灵活，所以就有大量的插件用来扩展、增强它对应用和集群的管理能力。

`minikube` 也支持很多的插件，使用命令 `minikube addons list` 就可以查看插件列表：

```java
$ minikube addons list
|-----------------------------|----------|--------------|--------------------------------|
|         ADDON NAME          | PROFILE  |    STATUS    |           MAINTAINER           |
|-----------------------------|----------|--------------|--------------------------------|
| ambassador                  | minikube | disabled     | third-party (ambassador)       |
| auto-pause                  | minikube | disabled     | google                         |
| csi-hostpath-driver         | minikube | disabled     | kubernetes                     |
| dashboard                   | minikube | disabled     | kubernetes                     |
| default-storageclass        | minikube | enabled ✅   | kubernetes                     |
| efk                         | minikube | disabled     | third-party (elastic)          |
| freshpod                    | minikube | disabled     | google                         |
| gcp-auth                    | minikube | disabled     | google                         |
| gvisor                      | minikube | disabled     | google                         |
| helm-tiller                 | minikube | disabled     | third-party (helm)             |
| ingress                     | minikube | disabled     | unknown (third-party)          |
| ingress-dns                 | minikube | disabled     | google                         |
| istio                       | minikube | disabled     | third-party (istio)            |
| istio-provisioner           | minikube | disabled     | third-party (istio)            |
| kong                        | minikube | disabled     | third-party (Kong HQ)          |
| kubevirt                    | minikube | disabled     | third-party (kubevirt)         |
| logviewer                   | minikube | disabled     | unknown (third-party)          |
| metallb                     | minikube | disabled     | third-party (metallb)          |
| metrics-server              | minikube | disabled     | kubernetes                     |
| nvidia-driver-installer     | minikube | disabled     | google                         |
| nvidia-gpu-device-plugin    | minikube | disabled     | third-party (nvidia)           |
| olm                         | minikube | disabled     | third-party (operator          |
|                             |          |              | framework)                     |
| pod-security-policy         | minikube | disabled     | unknown (third-party)          |
| portainer                   | minikube | disabled     | portainer.io                   |
| registry                    | minikube | disabled     | google                         |
| registry-aliases            | minikube | disabled     | unknown (third-party)          |
| registry-creds              | minikube | disabled     | third-party (upmc enterprises) |
| storage-provisioner         | minikube | enabled ✅   | google                         |
| storage-provisioner-gluster | minikube | disabled     | unknown (third-party)          |
| volumesnapshots             | minikube | disabled     | kubernetes                     |
|-----------------------------|----------|--------------|--------------------------------|
```

插件中我个人认为比较重要的有两个：`DNS` 和 `Dashboard`。

- DNS 它在 Kubernetes 集群里实现了域名解析服务，能够让我们以域名而不是 IP 地址的方式来互相通信，是服务发现和负载均衡的基础。由于它对微服务、服务网格等架构至关重要，所以基本上是 Kubernetes 的必备插件。
- Dashboard 就是仪表盘，为 Kubernetes 提供了一个图形化的操作界面，非常直观友好，虽然大多数 Kubernetes 工作都是使用命令行 kubectl，但有的时候在 Dashboard 上查看信息也是挺方便的。

你只要在 `minikube` 环境里执行一条简单的命令，就可以自动用浏览器打开 `Dashboard` 页面，而且还支持中文：

```java
minikube dashboard
```

## 3. 总结

**1、**`Kubernetes`能够在集群级别管理应用和服务器，可以认为是一种集群操作系统它使用“控制面/数据面”的基本架构，`Master`节点实现管理控制功能，`Worker`节点运行具体业务；

**2、**`Kubernetes`由很多模块组成，可分为核心的组件和选配的插件两类；

**3、**`Master`里有4个组件，分别是`apiserver`、`etcd`、`scheduler`、`controller-manager`；

**4、**`Node`里有3个组件，分别是`kubelet`、`kube-proxy`、`container-runtime`；

**5、** 通常必备的插件有`DNS`和`Dashboard`；

来源：[https://time.geekbang.org/column/article/529800](https://time.geekbang.org/column/article/529800)
