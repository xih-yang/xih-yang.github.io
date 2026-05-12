# 09、Kubernetes - 实战：Service
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/9/9.html
- 分类：容器服务
- 分组：教程目录
## label Selector

在某些特殊的使用场景中，可能会遇到某些服务只能部署在某些特定的机器上面的情况。为了将这一部分机器逻辑上隔离出来，就需要用户给这批机器打上特定的标签。然后在部署的时候通过标签选择器限制服务的部署以实现这种特殊的需求。

查看标签：

```java
# 查看 Node 的标签
kubectl get node --show-labels
# 查看 Pod 的标签
kubectl get pod -A --show-labels
```

如图所示：

添加标签：

```java
# 给节点添加标签
kubectl label node worker-01 role=worker
kubectl label node worker-02 role=worker
kubectl label node worker-03 role=worker
kubectl label node master-01 role=master
kubectl label node master-02 role=master
```

如图所示：

标签过滤：

通过`--show-labels` 参数可以看到资源对象定义的所有标签。使用 `-l` 参数可以对标签进行过滤。

```java
# 过滤有指定标签的
kubectl get node --show-labels -l role
# 标签过滤
kubectl get node --show-labels -l role=worker
# 多标签过滤
kubectl get node --show-labels -l role=worker,kubernetes.io/hostname=worker-03
# 多选项过滤
kubectl get node --show-labels -l "role in (master,worker)"
# 反选过滤
kubectl get node --show-labels -l role!=worker
```

修改标签：

```java
kubectl label node worker-03 role=node --overwrite
```

其实跟添加 label 的命令时一样的，但是标签已经存在，不加 `--overwrite` 参数，则会提示报错：

> error: 'role' already has a value (worker), and --overwrite is false

删除标签：

```java
kubectl label node worker-03 role-
```

只需要在标签名称后面跟一个 `-` 则可以删除指定标签。

## Service

在直接使用 Pod 或者 Deployment 等控制器的时候发现一个问题：应然如何将服务暴露给用户访问？

用IP 显然是不合适的。一是因为 Pod 可能会挂掉或更新发生重建，Pod IP 会发生变化。二是如果采用多副本部署，岂不意味着需要暴露多个访问地址，而且还有如何实现负载均衡的问题。

对于这种问题，在没有使用 Kubernetes 之前，可以选择在前面安装一个 Nginx 反向代理后端多节点，但是这在 IP 可能会变化的环境是没法配置的。于是便有了注册中心的概念，让服务启动后自动注册到注册中心，然后调度的时候通过访问固定的注册中心获取到最新的端点进行代理。这类常见的注册中心有 Consul，Zookeeper，Etcd 等。

为解决这些问题，Kubernetes 提供了这样的一个对象 `Service`。

Service 是一种抽象的对象，它定义了一组 Pod 的逻辑集合和一个用于访问它们的策略，以此达到这种解耦的目的。Serivce 通过 Label Selector 来决定下面包含的 Pod 集合。

同时需要先明白一个概念，在 Kubernetes 中存在三类 IP：

- Node IP：宿主机自己的 IP 地址。
- Pod IP：Pod 运行时被分配的 IP 地址，在创建 Kubernetes 集群的时候有定义它的网段。
- Cluster IP：Service 使用的 IP 地址，在创建 Kubernetes 集群的时候有定义它的网段。

集群外部的机器想要访问集群内部的服务，只能通过 Node IP 进行访问。

Cluster IP 是一个虚拟 IP，仅仅作用于 Service 这个对象，由 Kubernetes 自己进行管理和分配地址。

## kube-proxy

在之前部署 kube-proxy 的时候说过，kube-proxy 运行在每一个 Node 上面，负责为 Service 实现一种 VIP 的代理形式。它支持两种模式：

- iptables：默认模式，该模式下，kube-proxy 会 watch apiserver 对 Service 对象和 Endpoints 对象的添加和移除。通过 iptable 规则将请求重定向到 Service 代理的集合中的某一个 Pod 上面。并且配合 Pod readiness 探针 验证 Pod 是否正常，保障服务的可用性。
- ipvs：该模式下，kube-proxy 会 watch Kubernetes 服务和端点，调用 netlink 接口相应地创建 IPVS 规则， 并定期将 IPVS 规则与 Kubernetes 服务和端点同步。访问服务时，IPVS 将流量定向到后端 Pod 之一。IPVS 代理模式基于类似于 iptables 模式的 netfilter 钩子函数，但是使用哈希表作为基础数据结构，并且在内核空间中工作。所以与 iptables 模式相比，IPVS 模式下的重定向通信的延迟更短，并且在同步代理规则时具有更好的性能。同时，IPVS 模式还支持更高的网络流量吞吐量。所以一般会将 kube-proxy 的模式改成 IPVS。但是如果节点不满足 IPVS 的运行条件，模式会自动降级为 iptables。

IPVS 提供了更多选项来平衡后端 Pod 的流量，默认是 `rr`：

- rr: round-robin
- lc: least connection
- dh: destination hashing
- sh: source hashing
- sed: shortest expected delay
- nq: never queue

可以通过 kube-proxy 中配置 `–ipvs-scheduler` 参数进行修改。

## 定义 Service

在创建Service 之前，先创建一个多副本的 Deployment：

```java
apiVersion: apps/v1
kind: Deployment
metadata:
  name: deploy-nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: c-nginx
        image: nginx:latest
        ports:
        - name: web
          containerPort: 80
```

查看部署之后的标签信息：

定义对应的 Service：

```java
apiVersion: v1
kind: Service
metadata:
  name: svc-nginx
spec:
  通过标签选择器选择拥有这个标签的的 Pod
  selector:
    app: nginx
  ports:
    Service 暴露的端口
  - port: 8080
    Pod 暴露的端口
    targetPort: 80
```

特别说明：

> 在定义 Deployment 的时候给 port 定义了 name 字段，那么 Service 资源中的 targetPort 字段就可以直接写 name 字段的内容，而不一定是特定的端口。另外，Service 是支持 TCP，UDP 协议的，如果没定义默认为 TCP。

查看创建 Service：

由于Service 只能通过集群内部访问，所以可以通过一个 busybox 的 Pod 进行访问测试：

```java
kubectl run -it busybox-demo --image=busybox:latest -- /bin/sh
```

进入Pod 之后可以执行下载命令测试访问：

可以通过 Service IP + 定义的端口进行访问，也可以使用 Service 名称加端口进行访问，由于 Service 名称一般是不会改的，所以推荐后者。

但是这样的访问只能访问当前名称空间下的 Service，如果想要访问其它名称空间的 Service，可以使用 `Service名称.名称空间:端口` 的方式访问，比如：svc-nginx.kube-system:8080。

## Service 类型

在定义Service 的时候可以指定一个自己需要的类型，默认为 `ClusterIP`。可以使用的服务类型如下：

- ClusterIP：通过 Cluster IP 暴露服务，服务只能在集群内部访问。
- NodePort：通过每个 Node 节点上的 IP 和端口暴露服务。Node 会将请求路由到自动创建的 ClusterIP 服务。可以通过 NodeIP + 端口从集群外部访问。
- LoadBalancer：使用云提供商的负载均衡器向外部暴露服务。外部负载均衡器可以路由到 NodePort 服务和 ClusterIP 服务。
- ExternalName：通过返回 CNAME 和它的值，可以将服务映射到 externalName 字段的内容。

## NodePort

如果设置 type 的值为 NodePort，Kubernetes master 将从给定的配置范围内分配端口，每个 Node 都将从该端口代理到 Service。如果不指定端口会自动生成一个端口。

```java
apiVersion: v1
kind: Service
metadata:
  name: svc-nginx-demo1
spec:
  selector:
    app: nginx
  type: NodePort
  ports:
  - protocol: TCP
    Service 暴露的端口
    port: 80
    Node 暴露的端口，在安装 Kubernetes 定义了端口范围，如果不指定会随机分配
    nodePort: 30001
    Pod 运行的端口或者端口名称
    targetPort: 80
```

查看Service：

注意，尽管通过 svc 指定了 Node 上的端口为 30001，但是本机并不会监听 30001 端口。但是并不影响我们访问：

产生这个问题的原因在于 Service 是通过 iptables 或者 ipvs 规则对这个请求进行转发的，所以并不会监听对应的端口。并且请求 IP 不能是 127.0.0.1。

## ExternalName

ExternalName 是 Service 的特例，它没有 selector，也没有定义任何的端口和 Endpoint。用于将集群外部的服务，以别名的方式向集群内部提供服务。

```java
apiVersion: v1
kind: Service
metadata:
  name: svc-demo2
spec:
  type: ExternalName
  externalName: db.mysql.ezops.cn
```

当访问地址 `svc-demo2.default.svc.cluster.local` 时，集群的 DNS 服务将返回一个值为 db.mysql.ezops.cn 的 `CNAME` 记录。

访问这个服务的工作方式与其它的相同，唯一不同的是重定向发生在 DNS 层，而且不会进行代理或转发。

这样做的好处在于以后这个 CNAME 对应的服务迁移到集群内部，就只需要修改 Service 配置，完全不需要修改代码里面配置的地址。

## Headless Service

除了通过 ExternalName 将集群外部服务配置进集群以外，通过学习 StatefulSet 控制器的时候提到了 Headless Service 也能做到。

通过自定义 Endpoints 来创建 Service，设置 clusterIP=None 的 Headless Service。

```java
apiVersion: v1
kind: Service
metadata:
  name: kube-etcd
  namespace: kube-system
spec:
  type: ClusterIP
  clusterIP: None
  ports:
  - name: port
    port: 2379
---
apiVersion: v1
kind: Endpoints
metadata:
  名称必须和 Service 一致
  name: kube-etcd
  namespace: kube-system
subsets:
- addresses:
  - ip: 192.168.2.21
  - ip: 192.168.2.22
  ports:
  - name: port
    port: 2379
```

上面这个服务就是将外部的 etcd 服务引入到 Kubernetes 集群中来。

## 获取客户端 IP（了解）

当集群内的客户端连接到服务的时候，Pod 是可以获取到客户端的 IP 地址的，但是当外部请求通过节点路由连接时，由于对数据包执行了源网络地址转换（SNAT），因此数据包的源 IP 地址会发生变化，后端的 Pod 无法看到实际的客户端 IP，这对于 nginx 这类服务是不合适的。

以之前NodePort 示例为例，从外部访问 Nginx，查看日志如下：

可以发现客户端的 IP 明显不对。为了解决这个问题，Service 提供了参数：

```java
spec:
  externalTrafficPolicy: Local
```

通过这个参数，能够让外部请求的 IP 只能是拥有部署了后端节点的 IP，如果请求的 Node IP 上面没有部署该服务，则请求会失败。

如果非要实现这个功能，可以通过定义 Pod 的 `spec` 的时候通过 `nodeSelector` 让服务只部署到确定节点上。再通过对应的节点来访问。
