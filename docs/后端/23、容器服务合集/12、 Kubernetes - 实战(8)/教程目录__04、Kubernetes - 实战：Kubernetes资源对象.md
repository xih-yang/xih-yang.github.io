# 04、Kubernetes - 实战：Kubernetes资源对象
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/8/4.html
- 分类：容器服务
- 分组：教程目录
## 一、Kubernetes资源对象列表

```java
• Autoscaling (HPA)
• ConfigMap
• CronJob
• CustomResourceDefinition
• DaemonSet
• Deployment
• Ingress
• Job
• LocalVolume
• Namespace
• NetworkPolicy    网络策略
• Node
• PersistentVolume
• Pod
• PodPreset
• ReplicaSet
• Resource Quota
• Secret
• SecurityContext
• Service
• ServiceAccount
• StatefulSet
• Volume
```

## 二、Kubernetes资源对象介绍

## 1、Horizontal Pod Autoscaling (HPA)

Horizontal Pod Autoscaling (HPA) 可以根据 CPU 使用率或应用自定义 metrics 自动扩展 Pod 数量（支持 replication controller、deployment 和 replica set ）。

- 控制管理器每隔 30s（可以通过 --horizontal-pod-autoscaler-sync-period修改）查询 metrics 的资源使用情况
- 支持三种 metrics 类型
- 预定义 metrics（比如 Pod 的 CPU）以利用率的方式计算
- 自定义的 Pod metrics，以原始值（raw value）的方式计算
- 自定义的 object metrics
- 支持两种 metrics 查询方式：Heapster 和自定义的 REST API
- 支持多 metrics

```java
# 创建 pod 和 service
$ kubectl run php-apache --image=k8s.gcr.io/hpa-example --requests=cpu=200m --expose --port=80
# 创建 autoscaler
$ kubectl autoscale deployment php-apache --cpu-percent=50 --min=1 --max=10
$ kubectl get hpa
# 增加负载
$ kubectl run -i --tty load-generator --image=busybox /bin/sh
$ while true; do wget -q -O- http://php-apache.default.svc.cluster.local; done
# 过一会就可以看到负载升高了
$ kubectl get hpa
# autoscaler 将这个 deployment 扩展为 7 个 pod
$ kubectl get deployment php-apache
# 删除刚才创建的负载增加 pod 后会发现负载降低，并且 pod 数量也自动降回 1 个
$ kubectl get hpa
$ kubectl get deployment php-apache
```

## 2、ConfigMap

ConfigMap 用于保存配置数据的键值对，可以用来保存单个属性，也可以用来保存配置文件。ConfigMap 跟 Secret 很类似，但它可以更方便地处理不包含敏感信息的字符串。

$kubectl create configmap special-config --from-literal=special.how=very

configmap "special-config" created

$kubectl get configmap special-config -o go-template='{{.data}}'

map[special.how:very]

## 3、CronJob

CronJob 即定时任务，就类似于 Linux 系统的 crontab，在指定的时间周期运行指定的任务。

## 4、DaemonSet

DaemonSet 保证在每个 Node 上都运行一个容器副本，常用来部署一些集群的日志、监控或者其他系统管理应用。典型的应用包括：

•日志收集，比如 fluentd，logstash 等

•系统监控，比如 Prometheus Node Exporter，collectd，New Relic agent，Gangliagmond 等

•系统程序，比如 kube-proxy, kube-dns, glusterd, ceph 等

## 5、Deployment

Deployment 为 Pod 和 ReplicaSet 提供了一个声明式定义 (declarative) 方法，用来替代以前的 ReplicationController 来方便的管理应用。

比如一个简单的 nginx 应用可以定义为

```java
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 3
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.7.9
        ports:
        - containerPort: 80
```

扩容：
kubectl scale deployment nginx-deployment --replicas 10

如果集群支持 horizontal pod autoscaling 的话，还可以为 Deployment 设置自动扩展：

kubectl autoscale deployment nginx-deployment --min=10 --max=15 --cpu-percent=80

更新镜像也比较简单:

kubectl set image deployment/nginx-deployment nginx=nginx:1.9.1

回滚：
kubectl rollout undo deployment/nginx-deployment

Deployment 的 典型应用场景 包括：

- 定义 Deployment 来创建 Pod 和 ReplicaSet
- 滚动升级和回滚应用
- 扩容和缩容
- 暂停和继续 Deployment

Deployment 是什么？

Deployment 为 Pod 和 Replica Set（下一代 Replication Controller）提供声明式更新。

一个典型的用例如下：

- 使用 Deployment 来创建 ReplicaSet。ReplicaSet 在后台创建 pod。检查启动状态，看它是成功还是失败。
- 然后，通过更新 Deployment 的 PodTemplateSpec 字段来声明 Pod 的新状态。这Deployment会创建一个新的 ReplicaSet，Deployment 会按照控制的速率将 pod 从旧的ReplicaSet 移动到新的 ReplicaSet 中。
- 如果当前状态不稳定，回滚到之前的 Deployment revision。每次回滚都会更新Deployment 的 revision。
- 扩容 Deployment 以满足更高的负载。
- 暂停 Deployment 来应用 PodTemplateSpec 的多个修复，然后恢复上线。
- 根据 Deployment 的状态判断上线是否 hang 住了。
- 清除旧的不必要的 ReplicaSet。

```java
创建 Deployment
$ kubectl create -f docs/user-guide/nginx-deployment.yaml --record
$ kubectl get deployments
$ kubectl get rs
$ kubectl get pods --show-labels
更新 Deployment
$ kubectl set image deployment/nginx-deployment nginx=nginx:1.9.1
$ kubectl edit deployment/nginx-deployment
查看 rollout 的状态，只要执行：
$ kubectl rollout status deployment/nginx-deployment
$ kubectl get deployments
$ kubectl get rs
$ kubectl get pods
$ kubectl describe deployments
回退 Deployment
假设我们在更新 Deployment 的时候犯了一个拼写错误，将镜像的名字写成了nginx:1.91  ，而正确的名字应该是  nginx:1.9.1  ：
$ kubectl set image deployment/nginx-deployment nginx=nginx:1.91
Rollout 将会卡住。
$ kubectl rollout status deployments nginx-deployment
按住 Ctrl-C 停止上面的 rollout 状态监控。
$ kubectl get rs
检查 Deployment 升级的历史记录
$ kubectl rollout history deployment/nginx-deployment
查看单个 revision 的详细信息：
$ kubectl rollout history deployment/nginx-deployment --revision=2
回退到历史版本
现在，我们可以决定回退当前的 rollout 到之前的版本：
$ kubectl rollout undo deployment/nginx-deployment
也可以使用  --to-revision  参数指定某个历史版本：
$ kubectl rollout 
也可以使用  --to-revision  参数指定某个历史版本：
$ kubectl rollout undo deployment/nginx-deployment --to-revision=2
$ kubectl get deployment
$ kubectl describe deployment
Deployment 扩容
$ kubectl scale deployment nginx-deployment --replicas 10
假设你的集群中启用了 horizontal pod autoscaling (HPA)，你可以给 Deployment 设置一个 autoscaler，基于当前 Pod 的 CPU 利用率选择最少和最多的 Pod 数。
$ kubectl autoscale deployment nginx-deployment --min=10 --max=15 --cpu-percent=80
$ kubectl get deploy
$ kubectl get rs
暂停和恢复 Deployment
使用以下命令暂停 Deployment：
$ kubectl rollout pause deployment/nginx-deployment
然后更新 Deployment 中的镜像：
$ kubectl set image deploy/nginx nginx=nginx:1.9.1
注意没有启动新的 rollout：
$ kubectl rollout history deploy/nginx
$ kubectl get rs
你可以进行任意多次更新，例如更新使用的资源：
$ kubectl set resources deployment nginx -c=nginx --limits=cpu=200m,memory=512Mi
最后，恢复这个 Deployment，观察完成更新的 ReplicaSet 已经创建出来了：
$ kubectl rollout resume deploy nginx
deployment "nginx" resumed
$ KUBECTL get rs -w
```

## 6、Ingress

在本篇文章中你将会看到一些在其他地方被交叉使用的术语，为了防止产生歧义，我们首先来澄清下。

- 节点：Kubernetes 集群中的服务器；
- 集群：Kubernetes 管理的一组服务器集合；
- 边界路由器：为局域网和 Internet 路由数据包的路由器，执行防火墙保护局域网络；
- 集群网络：遵循 Kubernetes网络模型 实现集群内的通信的具体实现，比如 flannel和 OVS。
- 服务：Kubernetes 的服务 (Service) 是使用标签选择器标识的一组 pod Service。除非另有说明，否则服务的虚拟 IP 仅可在集群内部访问。

什么是Ingress？

通常情况下，service 和 pod 的 IP 仅可在集群内部访问。集群外部的请求需要通过负载均衡转发到 service 在 Node 上暴露的 NodePort 上，然后再由 kube-proxy 通过边缘路由器 (edge router) 将其转发给相关的 Pod 或者丢弃。而 Ingress 就是为进入集群的请求提供路由规则的集合。

Ingress 可以给 service 提供集群外部访问的 URL、负载均衡、SSL 终止、HTTP 路由等。为了配置这些 Ingress 规则，集群管理员需要部署一个 Ingress controller，它监听Ingress 和 service 的变化，并根据规则配置负载均衡并提供访问入口。

## 7、Job

Job负责批量处理短暂的一次性任务 (short lived one-off tasks)，即仅执行一次的任务，它保证批处理任务的一个或多个 Pod 成功结束。

## 8、Local Volume

本地数据卷（Local Volume）代表一个本地存储设备，比如磁盘、分区或者目录等。主要的应用场景包括分布式存储和数据库等需要高性能和高可靠性的环境里。本地数据卷同时支持块设备和文件系统，通过 spec.local.path 指定；但对于文件系统来说，kubernetes 并不会限制该目录可以使用的存储空间大小。

本地数据卷只能以静态创建的 PV 使用。相对于 HostPath，本地数据卷可以直接以持久化的方式使用（它总是通过 NodeAffinity 调度在某个指定的节点上）。

另外，社区还提供了一个 local-volume-provisioner，用于自动创建和清理本地数据卷。

## 9、NameSpace

Namespace 是对一组资源和对象的抽象集合，比如可以用来将系统内部的对象划分为不同的项目组或用户组。常见的 pod, service, replication controller 和 deployment 等都是属于某一个 namespace 的（默认是 default），而 node, persistent volume，

namespace 等资源则不属于任何 namespace。

Namespace 常用来隔离不同的用户，比如 Kubernetes 自带的服务一般运行在 kube-system namespace 中。

查询命名空间

$kubectl get namespaces

创建命名空间

(1)命令行直接创建

$kubectl create namespace new-namespace

(2)通过文件创建

$cat my-namespace.yaml

apiVersion: v1

kind: Namespace

metadata:

name: new-namespace

$kubectl create -f ./my-namespace.yaml

删除命名空间

$kubectl delete namespaces new-namespace

注意：

**1、** 删除一个namespace会自动删除所有属于该namespace的资源；

**2、** default和kube-system命名空间不可删除；

**3、** PersistentVolume是不属于任何namespace的，但PersistentVolumeClaim是属于某个特定namespace的；

**4、** Event是否属于namespace取决于产生event的对象；

**5、** v1.7版本增加了kube-public命名空间，该命名空间用来存放公共的信息，一般以ConfigMap的形式存放$kubectlgetconfigmap-n=kube-public；

## 10、Node

Node 是 Pod 真正运行的主机，可以是物理机，也可以是虚拟机。为了管理 Pod，每个Node 节点上至少要运行 container runtime（比如 docker 或者 rkt ）、 kubelet和 kube-proxy 服务。

kind: Node

apiVersion: v1

metadata:

name: 10-240-79-157

labels:

name: my-first-k8s-node

这个检查是由 Node Controller 来完成的。Node Controller 负责

- 维护 Node 状态
- 与 Cloud Provider 同步 Node
- 给 Node 分配容器 CIDR
- 删除带有 NoExecute taint 的 Node 上的 Podsu

默认情况下，kubelet 在启动时会向 master 注册自己，并创建 Node 资源。

每个Node 都包括以下状态信息：

- 地址：包括 hostname、外网 IP 和内网 IP
- 条件（Condition）：包括 OutOfDisk、Ready、MemoryPressure 和 DiskPressure
- 容量（Capacity）：Node 上的可用资源，包括 CPU、内存和 Pod 总数
- 基本信息（Info）：包括内核版本、容器引擎版本、OS 类型等

Taints 和 tolerations 用于保证 Pod 不被调度到不合适的 Node 上，Taint 应用于 Node上，而 toleration 则应用于 Pod 上（Toleration 是可选的）。

比如，可以使用 taint 命令给 node1 添加 taints：

kubectl taint nodes node1 key1=value1:NoSchedule

kubectl taint nodes node1 key1=value2:NoExecute

## 11、Persistent Volume

PersistentVolume (PV) 和 PersistentVolumeClaim (PVC) 提供了方便的持久化卷：PV提供网络存储资源，而 PVC 请求存储资源。这样，设置持久化的工作流包括配置底层文件系统或者云数据卷、创建持久性数据卷、最后创建 PVC 来将 Pod 跟数据卷关联起来。PV 和 PVC 可以将 pod 和数据卷解耦，pod 不需要知道确切的文件系统或者支持它的持久化引擎。

Volume 的生命周期包括 5 个阶段

**1、** Provisioning，即PV的创建，可以直接创建PV（静态方式），也可以使用StorageClass动态创建；

**2、** Binding，将PV分配给PVC；

**3、** Using，Pod通过PVC使用该Volume，并可以通过准入控制StorageObjectInUseProtection（1.9及以前版本为PVCProtection）阻止删除正在使用的PVC；

**4、** Releasing，Pod释放Volume并删除PVC；

**5、** Reclaiming，回收PV，可以保留PV以便下次使用，也可以直接从云存储中删除；

**6、** Deleting，删除PV并从云存储中删除后段存储；

根据这5 个阶段，Volume 的状态有以下 4 种

- Available：可用
- Bound：已经分配给 PVC
- Released：PVC 解绑但还未执行回收策略
- Failed：发生错误

PersistentVolume（PV）是集群之中的一块网络存储。跟 Node 一样，也是集群的资源。PV 跟 Volume (卷) 类似，不过会有独立于 Pod 的生命周期。

## 12、PVC

PV是存储资源，而 PersistentVolumeClaim (PVC) 是对 PV 的请求。PVC 跟 Pod 类似：Pod 消费 Node 资源，而 PVC 消费 PV 资源；Pod 能够请求 CPU 和内存资源，而PVC 请求特定大小和访问模式的数据卷。

## 13、POD

Pod是一组紧密关联的容器集合，它们共享 IPC、Network 和 UTS namespace，是Kubernetes 调度的基本单位。Pod 的设计理念是支持多个容器在一个 Pod 中共享网络和文件系统，可以通过进程间通信和文件共享这种简单高效的方式组合完成服务。

pod特征：

- 包含多个共享 IPC、Network 和 UTC namespace 的容器，可直接通过 localhost 通信
- 所有 Pod 内容器都可以访问共享的 Volume，可以访问共享数据
- 无容错性：直接创建的 Pod 一旦被调度后就跟 Node 绑定，即使 Node 挂掉也不会被重新调度（而是被自动删除），因此推荐使用 Deployment、Daemonset 等控制器来容错
- 优雅终止：Pod 删除的时候先给其内的进程发送 SIGTERM，等待一段时间（graceperiod）后才强制停止依然还在运行的进程
- 特权容器（通过 SecurityContext 配置）具有改变系统配置的权限（在网络插件中大量应用）

pod生命周期

- Pending: API Server已经创建该Pod，但一个或多个容器还没有被创建，包括通过网络下载镜像的过程。
- Running: Pod中的所有容器都已经被创建且已经调度到 Node 上面，但至少有一个容器还在运行或者正在启动。
- Succeeded: Pod 调度到 Node 上面后均成功运行结束，并且不会重启。
- Failed: Pod中的所有容器都被终止了，但至少有一个容器退出失败（即退出码不为0 或者被系统终止）。
- Unknonwn: 状态未知，因为一些原因Pod无法被正常获取，通常是由于 apiserver无法与 kubelet 通信导致。

## 14、PodPreset

PodPreset 用来给指定标签的 Pod 注入额外的信息，如环境变量、存储卷等。这样，Pod 模板就不需要为每个 Pod 都显式设置重复的信息。

## 15、ReplicationController 和 ReplicaSet

ReplicationController（也简称为 rc）用来确保容器应用的副本数始终保持在用户定义的副本数，即如果有容器异常退出，会自动创建新的 Pod 来替代；而异常多出来的容器也会自动回收。ReplicationController 的典型应用场景包括确保健康 Pod 的数量、弹性伸缩、滚动升级以及应用多版本发布跟踪等。

## 16、Secret

Secret 解决了密码、token、密钥等敏感数据的配置问题，而不需要把这些敏感数据暴露到镜像或者 Pod Spec 中。Secret 可以以 Volume 或者环境变量的方式使用。

## 17、服务发现与负载均衡

- Service：直接用 Service 提供 cluster 内部的负载均衡，并借助 cloud provider 提供的 LB 提供外部访问
- Ingress Controller：还是用 Service 提供 cluster 内部的负载均衡，但是通过自定义Ingress Controller 提供外部访问
- Service Load Balancer：把 load balancer 直接跑在容器中，实现 Bare Metal 的Service Load Balancer
- Custom Load Balancer：自定义负载均衡，并替代 kube-proxy，一般在物理部署Kubernetes 时使用，方便接入公司已有的外部服务

## 18、Service

Service 是对一组提供相同功能的 Pods 的抽象，并为它们提供一个统一的入口。借助Service，应用可以方便的实现服务发现与负载均衡，并实现应用的零宕机升级。

Service 通过标签来选取服务后端，一般配合 Replication Controller 或者 DeploymentService

来保证后端容器的正常运行。这些匹配标签的 Pod IP 和端口列表组成 endpoints，由kube-proxy 负责将服务 IP 负载均衡到这些 endpoints 上。

Service 有四种类型：

- ClusterIP：默认类型，自动分配一个仅 cluster 内部可以访问的虚拟 IP
- NodePort：在 ClusterIP 基础上为 Service 在每台机器上绑定一个端口，这样就可以通过 :NodePort 来访问该服务。如果 kube-proxy 设置了 --nodeport-addresses=10.240.0.0/16 （v1.10 支持），那么仅该 NodePort 仅对设置在范围内的 IP 有效。
- LoadBalancer：在 NodePort 的基础上，借助 cloud provider 创建一个外部的负载均衡器，并将请求转发到 :NodePort
- ExternalName：将服务通过 DNS CNAME 记录方式转发到指定的域名（通过spec.externlName 设定）。需要 kube-dns 版本在 1.7 以上。

Service定义

Service 的定义也是通过 yaml 或 json，比如下面定义了一个名为 nginx 的服务，将服务的 80 端口转发到 default namespace 中带有标签 run=nginx 的 Pod 的 80 端口

```java
apiVersion: v1
kind: Service
metadata:
  labels:
    run: nginx
  name: nginx
  namespace: default
spec:
  ports:
  - port: 80
    protocol: TCP
    targetPort: 80
  selector:
    run: nginx
  sessionAffinity: None
  type: ClusterIP
```

```java
# service 自动分配了 Cluster IP 10.0.0.108
$ kubectl get service nginx
# 自动创建的 endpoint
$ kubectl get endpoints nginx
# Service 自动关联 endpoint
$ kubectl describe service nginx
```

## 19、Headless 服务

Headless 服务即不需要 Cluster IP 的服务，即在创建服务的时候指定

spec.clusterIP=None 。包括两种类型

- 不指定 Selectors，但设置 externalName，即上面的（2），通过 CNAME 记录处理
- 指定 Selectors，通过 DNS A 记录设置后端 endpoint 列表

```java
# 查询创建的 nginx 服务
$ kubectl get service --all-namespaces=true
```

## 20、Ingress

Service 虽然解决了服务发现和负载均衡的问题，但它在使用上还是有一些限制，比如Service－ 只支持 4 层负载均衡，没有 7 层功能 － 对外访问的时候，NodePort 类型需要在外部搭建额外的负载均衡，而 LoadBalancer 要求 kubernetes 必须跑在支持的 cloudprovider 上面

Ingress 就是为了解决这些限制而引入的新资源，主要用来将服务暴露到 cluster 外面，并且可以自定义服务的访问策略。比如想要通过负载均衡器实现不同子域名到不同服务的访问：

## 21、Service Load Balancer

在Ingress 出现以前，Service Load Balancer 是推荐的解决 Service 局限性的方式。Service Load Balancer 将 haproxy 跑在容器中，并监控 service 和 endpoint 的变化，通过容器 IP 对外提供 4 层和 7 层负载均衡服务。社区提供的 Service Load Balancer 支持四种负载均衡协议：TCP、HTTP、HTTPS 和SSL TERMINATION，并支持 ACL 访问控制。

## 22、Service Account

```java
• Service account 是为了方便 Pod 里面的进程调用 Kubernetes API 或其他外部服务而设计的。它与 User account 不同
• User account 是为人设计的，而 service account 则是为 Pod 中的进程调用Kubernetes API 而设计；
• User account 是跨 namespace 的，而 service account 则是仅局限它所在的namespace；
• 每个 namespace 都会自动创建一个 default service account
• Token controller 检测 service account 的创建，并为它们创建 secret
• 开启 ServiceAccount Admission Controller 后
	○ 每个 Pod 在创建后都会自动设置  spec.serviceAccountName  为 default（除非指定了其他 ServiceAccout）
	○ 验证 Pod 引用的 service account 已经存在，否则拒绝创建
	○ 如果 Pod 没有指定 ImagePullSecrets，则把 service account 的ImagePullSecrets 加到 Pod 中
	○ 每个 container 启动后都会挂载该 service account 的 token 和  ca.crt  到/var/run/secrets/kubernetes.io/serviceaccount/
```

## 23、StatefulSet

StatefulSet 是为了解决有状态服务的问题（对应 Deployments 和 ReplicaSets 是为无状态服务而设计），其应用场景包括

•稳定的持久化存储，即 Pod 重新调度后还是能访问到相同的持久化数据，基于PVC 来实现

•稳定的网络标志，即 Pod 重新调度后其 PodName 和 HostName 不变，基于Headless Service（即没有 Cluster IP 的 Service）来实现

•有序部署，有序扩展，即 Pod 是有顺序的，在部署或者扩展的时候要依据定义的顺序依次依序进行（即从 0 到 N-1，在下一个 Pod 运行之前所有之前的 Pod 必须都是 Running 和 Ready 状态），基于 init containers 来实现

•有序收缩，有序删除（即从 N-1 到 0）

```java
# 查看创建的 headless service 和 statefulset
$ kubectl get service nginx
$ kubectl get statefulset web
$ kubectl get pvc
# 查看创建的 Pod，他们都是有序的
$ kubectl get pods -l app=nginx
# 使用 nslookup 查看这些 Pod 的 DNS
$ kubectl run -i --tty --image busybox dns-test --restart=Never --rm /bin/sh
# 扩容
$ kubectl scale statefulset web --replicas=5
# 缩容
$ kubectl patch statefulset web -p '{"spec":{"replicas":3}}'
# 镜像更新（目前还不支持直接更新 image，需要 patch 来间接实现）
$ kubectl patch statefulset web --type='json' -p='[{"op":"replace","path":"/spec/template/spec/containers/0/image","value":"gcr.io/google_
containers/nginx-slim:0.7"}]'
# 删除 StatefulSet 和 Headless Service
$ kubectl delete statefulset web
$ kubectl delete service nginx
# StatefulSet 删除后 PVC 还会保留着，数据不再使用的话也需要删除
$ kubectl delete pvc www-web-0 www-web-1
StatefulSet 注意事项
1. 推荐在 Kubernetes v1.9 或以后的版本中使用
2. 所有 Pod 的 Volume 必须使用 PersistentVolume 或者是管理员事先创建好
3. 为了保证数据安全，删除 StatefulSet 时不会删除 Volume
4. StatefulSet 需要一个 Headless Service 来定义 DNS domain，需要在 StatefulSet之前创建好
```

## 24、Kubernetes 存储卷

我们知道默认情况下容器的数据都是非持久化的，在容器消亡以后数据也跟着丢失，所以 Docker 提供了 Volume 机制以便将数据持久化存储。类似的，Kubernetes 提供了更强大的 Volume 机制和丰富的插件，解决了容器数据持久化和容器间共享数据的问题。

与Docker 不同，Kubernetes Volume 的生命周期与 Pod 绑定

•容器挂掉后 Kubelet 再次重启容器时，Volume 的数据依然还在

•而Pod 删除时，Volume 才会清理。数据是否丢失取决于具体的 Volume 类型，比如 emptyDir 的数据会丢失，而 PV 的数据则不会丢

目前，Kubernetes 支持以下 Volume 类型：

•emptyDir

•hostPath

•gcePersistentDisk

•awsElasticBlockStore

•nfs

•iscsi

•flocker

•glusterfs

•rbd

•cephfs

•gitRepo

•secret

•persistentVolumeClaim

•downwardAPI

•azureFileVolume

•azureDisk

•vsphereVolume

•Quobyte

•PortworxVolume

•ScaleIO

•FlexVolume

•StorageOS

•local

emptyDir

如果Pod 设置了 emptyDir 类型 Volume， Pod 被分配到 Node 上时候，会创建emptyDir，只要 Pod 运行在 Node 上，emptyDir 都会存在（容器挂掉不会导致emptyDir 丢失数据），但是如果 Pod 从 Node 上被删除（Pod 被删除，或者 Pod 发生迁移），emptyDir 也会被删除，并且永久丢失。

hostPath

hostPath 允许挂载 Node 上的文件系统到 Pod 里面去。如果 Pod 需要使用 Node 上的文件，可以使用 hostPath。

NFS
NFS是 Network File System 的缩写，即网络文件系统。Kubernetes 中通过简单地配置就可以挂载 NFS 到 Pod 中，而 NFS 中的数据是可以永久保存的，同时 NFS 支持同时写操作。

gcePersistentDisk

gcePersistentDisk 可以挂载 GCE 上的永久磁盘到容器，需要 Kubernetes 运行在 GCE的 VM 中。

awsElasticBlockStore

awsElasticBlockStore 可以挂载 AWS 上的 EBS 盘到容器，需要 Kubernetes 运行在AWS 的 EC2 上。

gitRepo

gitRepo volume 将 git 代码下拉到指定的容器路径中
