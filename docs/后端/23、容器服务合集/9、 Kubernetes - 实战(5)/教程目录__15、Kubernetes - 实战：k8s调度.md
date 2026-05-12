# 15、Kubernetes - 实战：k8s调度
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/5/15.html
- 分类：容器服务
- 分组：教程目录
## 一、kubernetes调度

调度器通过 kubernetes 的 **watch 机制**来发现集群中新创建且尚未被调度到 Node 上的 Pod。调度器会将发现的每一个未调度的 Pod 调度到一个合适的 Node 上来运行。

**kube-scheduler 是 Kubernetes 集群的默认调度器，**并且是集群控制面的一部分。如果你真的希望或者有这方面的需求，kube-scheduler 在设计上是允许你自己写一个调度组件并替换原有的 kube-scheduler。

在做调度决定时需要考虑的因素包括：**单独和整体的资源请求、硬件/软件/策略限制、亲和以及反亲和要求、数据局域性、负载间的干扰等等。**

## 二、nodeName方式调度

nodeName 是节点选择约束的最简单方法，但一般不推荐。如果 nodeName 在 PodSpec 中指定了，则它优先于其他的节点选择方法。

使用nodeName 来选择节点的一些限制：

```java
如果指定的节点不存在。
如果指定的节点没有资源来容纳 pod，则pod 调度失败。
云环境中的节点名称并非总是可预测或稳定的。
```

示例：

```java
apiVersion: v1
kind: Pod
metadata:
  name: nginx
spec:
  containers:
  - name: nginx
    image: nginx
  nodeName: server3
```

那么运行该pod后，该pod将会调度到server3上，如果server3这个节点出现了一些问题，比如资源不够了，即使有其他健康的节点这个pod依然会被调度到server3上，结果就时调度失败。

## 三、nodeSelector方式调度

nodeSelector 是节点选择约束的最简单推荐形式。

给选择的节点添加标签：

```java
kubectl label nodes server2 disktype=ssd
```

可以使用以下命令查看节点标签：

```java
kubectl get nodes --show-labels
```

添加nodeSelector 字段到 pod 配置中：

```java
apiVersion: v1
kind: Pod
metadata:
  name: nginx
  labels:
    env: test
spec:
  containers:
  - name: nginx
    image: nginx
    imagePullPolicy: IfNotPresent
  nodeSelector:
    disktype: ssd
```

那么这个pod将会被调度到有 disktype: ssd标签的节点server2上。

## 四、亲和与反亲和 调度

nodeSelector 提供了一种非常简单的方法来将 pod 约束到具有特定标签的节点上。**亲和/反亲和功能极大地扩展了你可以表达约束的类型。**

你可以发现规则是“软”/“偏好”，而不是硬性要求，因此，如果调度器无法满足该要求，仍然调度该 pod

你可以使用节点上的 pod 的标签来约束，而不是使用节点本身的标签，来允许哪些 pod 可以或者不可以被放置在一起。

## 节点亲和 nodeaffinity

nodeaffinity支持多种规则匹配条件的配置如

```java
In：label 的值在列表内
NotIn：label 的值不在列表内
Gt：label 的值大于设置的值，不支持Pod亲和性
Lt：label 的值小于设置的值，不支持pod亲和性
Exists：设置的label 存在
DoesNotExist：设置的 label 不存在
```

`requiredDuringSchedulingIgnoredDuringExecution` 必须满足

`preferredDuringSchedulingIgnoredDuringExecution` 倾向满足

`IgnoreDuringExecution 表`示如果在Pod运行期间Node的标签发生变化，导致亲和性策略不能满足，则继续运行当前的Pod。

节点亲和性pod示例：

```java
apiVersion: v1
kind: Pod
metadata:
  name: node-affinity
spec:
  containers:
  - name: nginx
    image: nginx
  affinity:
    nodeAffinity:   节点亲和
      requiredDuringSchedulingIgnoredDuringExecution:必须满足
           nodeSelectorTerms:
           - matchExpressions:
             - key: disktype
               operator: In
               values:
                 - ssd
```

上述部署文件表示该pod必须被调度到有 disktype: ssd标签的节点上，values的值可以有多个，比如：

```java
apiVersion: v1
kind: Pod
metadata:
  name: node-affinity
spec:
  containers:
  - name: nginx
    image: nginx
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
           nodeSelectorTerms:
           - matchExpressions:
             - key: disktype
               operator: In
               values:
                 - ssd
                 - sata
```

此节点亲和规则表示，pod 只能放置在具有标签键为 disktype且 标签值为 ssd 或 sata 的节点上。

当然也可以将软限制（preferred 不必须）与硬限制（required 必须）结合：

```java
apiVersion: v1
kind: Pod
metadata:
  name: node-affinity
spec:
  containers:
  - name: nginx
    image: nginx
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
           nodeSelectorTerms:
           - matchExpressions:
             - key: kubernetes.io/hostname
               operator: NotIn
               values:
               - server2
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 1
        preference:
          matchExpressions:
          - key: disktype
            operator: In
            values:
            - ssd     
```

此节点亲和规则表示，pod 不能放置在server2节点上，在剩下的节点中，具有标签键为 disktype且标签值为ssd 的节点应该优先使用，如果没有满足这个label的节点，也可以调度在server2之外的节点。

## pod 亲和性和反亲和性

`podAffinity` 主要解决POD可以和哪些POD部署在同一个拓扑域中的问题（拓扑域用主机标签实现，可以是单个主机，也可以是多个主机组成的cluster、zone等。）

`podAntiAffinity`主要解决POD不能和哪些POD部署在同一个拓扑域中的问题。它们处理的是Kubernetes集群内部POD和POD之间的关系。

Pod间亲和与反亲和在与更高级别的集合（例如 ReplicaSets，StatefulSets，Deployments 等）一起使用时，它们可能更加有用。可以轻松配置一组应位于相同定义拓扑（例如，节点）中的工作负载。

Pod亲和与反亲和的合法操作符有 In，NotIn，Exists，DoesNotExist。

pod亲和性示例：

```java
apiVersion: v1
kind: Pod
metadata:
  name: nginx
  labels:
    app: nginx
spec:
  containers:
  - name: nginx
    image: nginx
```

首先创建一个有app: nginx标签的pod，接下来将基于这个标签实现pod亲和性和反亲和性。

pod亲和性示例:

```java
apiVersion: v1
kind: Pod
metadata:
  name: mysql
  labels:
    app: mysql
spec:
  containers:
  - name: mysql
    image: mysql
    env:
     - name: "MYSQL_ROOT_PASSWORD"
       value: "westos"
  affinity:
    podAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchExpressions:
          - key: app
            operator: In
            values:
            - nginx
        topologyKey: kubernetes.io/hostname			#选择的范围以节点的范畴
```

上述部署文件表示，这个pod必须（required）被调度到有app: nginx标签的pod的同一个节点上，因此这个pod和上个pod将会调度到一个节点上。

pod反亲和性示例:

```java
apiVersion: v1
kind: Pod
metadata:
  name: mysql
  labels:
    app: mysql
spec:
  containers:
  - name: mysql
    image: mysql
    env:
     - name: "MYSQL_ROOT_PASSWORD"
       value: "westos"
  affinity:
    podAntiAffinity:		#亲和性和反亲和性只有一个参数的区别
      requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchExpressions:
          - key: app
            operator: In
            values:
            - nginx
        topologyKey: "kubernetes.io/hostname"
```

上述部署文件表示，这个pod必须（required）不被调度到有app: nginx标签的pod的同一个节点上，因此这个pod和上个pod将会调度到不同节点上。

当然也可以像节点亲和一样设置软限制与硬限制或者结合。

## 五、Taints 污点调度

NodeAffinity节点亲和性，使Pod能够按我们的要求调度到某个Node上，而Taints则恰恰相反，它可以让Node拒绝运行Pod，甚至驱逐Pod。

Taints(污点)是Node的一个属性，设置了Taints后，Kubernetes是不会将Pod调度到这个Node上的，于是Kubernetes就给Pod设置了个属性Tolerations(容忍)，只要Pod能够容忍Node上的污点，那么Kubernetes就会忽略Node上的污点，就能够(不是必须)把Pod调度过去。

可以使用命令 kubectl taint 给节点增加一个 taint：

```java
$ kubectl taint nodes node1 key=value:NoSchedule	//创建
$ kubectl describe nodes  server1 |grep Taints		//查询
$ kubectl taint nodes node1 key:NoSchedule-		//删除
```

其中[effect] 可取值： [ NoSchedule | PreferNoSchedule | NoExecute ]

```java
NoSchedule：POD 不会被调度到标记为 taints 节点。
PreferNoSchedule：NoSchedule 的软策略版本。
NoExecute：该选项意味着一旦 Taint 生效，如该节点内正在运行的 POD 没有对应 Tolerate 设置，会直接被逐出。
```

**注意：将污点设置为NoSchedule不会影响已经存在的pod，NoExecute会影响已经存在的pod（驱逐）**

我们可以使用查询命令查看主节点（master）上的污点可以发现主节点默认有一个NoSchedule的污点，因此默认情况下创建pod不会被调度到主节点上，而其他节点上没有污点。

部署nginx deployment示例：

```java
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-server
spec:
  selector:
    matchLabels:
      app: nginx
  replicas: 3
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx
```

创建这个pod。

给Server2节点打上taint：

```java
$ kubectl taint node  server2 key1=v1:NoExecute
	node/server2 tainted
```

可以看到server2上的Pod被驱离：

```java
$ kubectl get pod -o wide
NAME                          READY   STATUS              RESTARTS   AGE   IP             NODE      NOMINATED NODE   READINESS GATES
web-server-86c57db685-9r5pn   1/1     Running             0          80s   10.244.1.158   server2   <none>           <none>
web-server-86c57db685-d87lc   0/1     ContainerCreating   0          7s    <none>         server2   <none>           <none>
web-server-86c57db685-gsqvt   1/1     Running             0          80s   10.244.2.143   server3   <none>           <none>
web-server-86c57db685-sk4t4   0/1     Terminating         0          80s   10.244.0.79    server1   <none>           <none>
```

在PodSpec中为容器设定容忍标签：

```java
 tolerations:
  - key: "key1"
    operator: "Equal"
    value: "v1"
    effect: "NoExecute"
```

为Pod设置容忍后会，server2又可以运行Pod了。

tolerations示例：

```java
tolerations:
- key: "key"
  operator: "Equal"
  value: "value"
  effect: "NoSchedule"
---
tolerations:
- key: "key"
  operator: "Exists"
  effect: "NoSchedule"
```

tolerations中定义的key、value、effect，要与node上设置的taint保持一致：

```java
如果 operator 是 Exists ，value可以省略。
如果 operator 是 Equal ，则key与value之间的关系必须相等。
如果不指定operator属性，则默认值为Equal。
```

还有两个特殊值：

```java
当不指定key，再配合Exists 就能匹配所有的key与value ，可以容忍所有污点。
当不指定effect ，则匹配所有的effect。
```

比如容忍所有污点可以这么设置容忍规则：

```java
tolerations:
  operator: "Exists"
```

实验后注意将所有节点的污点恢复原样。

## 六、cordon、drain、delete方式调度

影响Pod调度的指令还有：cordon、drain、delete，后期创建的pod都不会被调度到该节点上，但操作的暴力程度不一样。

## cordon 停止调度

影响最小，只会将node调为SchedulingDisabled，新创建pod，不会被调度到该节点，节点原有pod不受影响，仍正常对外提供服务。

```java
$ kubectl cordon server3
$ kubectl  get node
NAME      STATUS                     ROLES    AGE   VERSION
server1   Ready                      <none>   29m   v1.17.2
server2   Ready                      <none>   12d   v1.17.2
server3   Ready,SchedulingDisabled   <none>   9d    v1.17.2
$ kubectl uncordon server3 		//恢复
```

## drain 驱逐节点

首先驱逐node上的pod，在其他节点重新创建，然后将节点调为SchedulingDisabled。

```java
$ kubectl  drain server3 --ignore-daemonsets
node/server3 cordoned
evicting pod "web-1"
evicting pod "coredns-9d85f5447-mgg2k"
pod/coredns-9d85f5447-mgg2k evicted
pod/web-1 evicted
node/server3 evicted
$ kubectl uncordon server3			#恢复
```

## delete 删除节点

最暴力的一个，首先驱逐node上的pod，在其他节点重新创建，然后，从master节点删除该node，master失去对其控制，如要恢复调度，需进入node节点，重启kubelet服务

```java
$ kubectl delete node server3
```

恢复调度，在server3执行：

```java
# systemctl restart kubelet	
```

以上命令基于node的自注册功能,恢复使用。
