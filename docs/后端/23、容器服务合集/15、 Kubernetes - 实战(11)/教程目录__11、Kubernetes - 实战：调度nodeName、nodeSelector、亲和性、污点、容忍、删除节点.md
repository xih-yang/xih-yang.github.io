# 11、Kubernetes - 实战：调度nodeName、nodeSelector、亲和性、污点、容忍、删除节点
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/11/11.html
- 分类：容器服务
- 分组：教程目录
## 1、什么是调度？

调度器通过 kubernetes 的 watch 机制来发现集群中新创建且尚未被调度到 Node 上的 Pod。调度器会将发现的每一个未调度的 Pod 调度到一个合适的 Node 上来运行。

kube-scheduler 是 Kubernetes 集群的默认调度器，并且是集群控制面的一部分。kube-scheduler 是很灵活的，在设计上是允许你自己写一个调度组件并替换原有的 kube-scheduler。

在做调度决定时需要考虑的因素包括：单独和整体的资源请求、硬件/软件/策略限制、亲和以及反亲和要求、数据局域性、负载间的干扰等等。

默认策略可以参考：[https://kubernetes.io/docs/reference/scheduling/policies/](https://kubernetes.io/docs/reference/scheduling/policies/)

## 2、nodeName

nodeName 是节点选择约束的最简单方法，但一般不推荐。如果 nodeName 在 PodSpec 中指定了，则它优先于其他的节点选择方法。直接就指定在哪个节点调度。

使用nodeName 来选择节点的一些限制：

（1）如果指定的节点不存在。

（2）如果指定的节点没有资源来容纳 pod，则pod 调度失败。

（3）云环境中的节点名称并非总是可预测或稳定的。

编辑pod.yaml 文件

```java
apiVersion: v1
kind: Pod
metadata:
  name: nginx
spec:
  containers:
  - name: nginx
    image: nginx
      nodeName: server2 		%寻找node是server2的节点
```

```java
[root@server2 ～]# kubectl  apply  -f pod.yaml 	%应用，创建pod
pod/nginx created
[root@server2 ～]# kubectl  get pod
NAME    READY   STATUS    RESTARTS   AGE
nginx   1/1     Running   0          5s
[root@server2 ～]# kubectl  get pod  -o wide	%调度到了server2（server2是master，一般不用它工作的，原因后面讲）
NAME    READY   STATUS    RESTARTS   AGE     IP               NODE      NOMINATED NODE   READINESS GATES
nginx   1/1     Running   0          19s     10.244.179.115   server2   <none>           <none>
		%实验完成，删除pod
```

## 3、nodeSelector

nodeSelector 是节点选择约束的实用形式，它的原理是匹配某些特殊的标签，满足该条件的节点就可以被调度过去。

创建目录

编辑pod.yaml文件

```java
apiVersion: v1
kind: Pod
metadata:
  name: nginx
  labels:
    env: test		%该pod的标签是env=test
spec:
  containers:
  - name: nginx
    image: nginx
    imagePullPolicy: IfNotPresent
  nodeSelector:		%选择标签disktype=ssd的node
    disktype: ssd
```

应用pod.yaml文件，创建pod，查看状态为pending，因为三个节点都没有ssd这个标签。

给server3加标签`disktype=ssd`，再次查看pod的状态，已经running了

删除标签后，查看pod的状态，还是running，这是因为，pod已经调度过去了，删除标签也不影响

删除pod，净化环境

### （1）节点亲和性

nodeSelector 提供了一种非常简单的方法来将 pod 约束到具有特定标签的节点上。亲和与反亲和功能极大地扩展了你可以表达约束的类型。你可以发现规则是“软”/“偏好”，而不是硬性要求，因此，如果调度器无法满足该要求，仍然调度该 pod。

节点亲和中的三个参数：

（1）`requiredDuringSchedulingIgnoredDuringExecution` 必须满足

（2）`preferredDuringSchedulingIgnoredDuringExecution`倾向满足

（3）`IgnoreDuringExecution` 表示如果在Pod运行期间Node的标签发生变化，导致亲和性策略不能满足，则继续运行当前的Pod。

nodeaffinity还支持多种规则匹配条件的配置如下：

表示
含义

In
label 的值在列表内

NotIn
label 的值不在列表内

Gt
label 的值大于设置的值，不支持Pod亲和性

Lt
label 的值小于设置的值，不支持pod亲和性

Exists
设置的label 存在

DoesNotExist
设置的 label 不存在

参考：[https://kubernetes.io/zh/docs/concepts/scheduling-eviction/assign-pod-node/](https://kubernetes.io/zh/docs/concepts/scheduling-eviction/assign-pod-node/)

编辑pod1.yaml

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
    nodeAffinity:				%node亲和性
      requiredDuringSchedulingIgnoredDuringExecution:	%必须满足该模块的条件
           nodeSelectorTerms:
           - matchExpressions:
             - key: kubernetes.io/hostname
               operator: In		%以下条件在列表内，才可调度
               values:			%调度的节点必须是server3或server4
               - server3
               - server4
      preferredDuringSchedulingIgnoredDuringExecution:	%优先匹配满足该模块条件的节点，不满足也没事
      - weight: 1				%权重为1
        preference:
          matchExpressions:
          - key: disktype		%匹配条件是disktype这个键值为ssd
            operator: In
            values:
            - ssd  
```

应用，创建pod，由于现在server3和server4都没有ssd这个标签，且都满足硬性条件，所以随机调度到了server3

删除上个pod，给server4添加disktype=ssd这个标签，再次创建pod，查看，调度到了server4

查看详细信息也可以看到，该pod由于node的亲和性，调度到了server4

### （2）pod亲和与反亲和

除了上面的节点的亲和性，也可以使用 pod 的标签来约束，而不是使用节点本身的标签，来允许哪些 pod 可以或者不可以被放置在一起。

pod亲和性和反亲和性：

（1）`podAffinity` 主要解决POD可以和哪些POD部署在同一个拓扑域中的问题（拓扑域用主机标签实现，可以是单个主机，也可以是多个主机组成的cluster、zone等。）即pod2想和某些特殊的pod1在同一个节点工作

（2）`podAntiAffinity`主要解决POD不能和哪些POD部署在同一个拓扑域中的问题。它们处理的是Kubernetes集群内部POD和POD之间的关系。即pod2想避开某些特殊的pod1所在的那个节点

Pod间亲和与反亲和在与更高级别的集合（例如 ReplicaSets，StatefulSets，Deployments 等）一起使用时，它们可能更加有用。可以轻松配置一组应位于相同定义拓扑（例如，节点）中的工作负载。Pod 间亲和与反亲和需要大量的处理，这可能会显著减慢大规模集群中的调度。

首先纯净实验环境

编辑pod2.yaml 文件

```java
apiVersion: v1
kind: Pod
metadata:
  name: nginx
  labels:			%nginx这个pod的标签是app=nginx
    app: nginx
spec:
  containers:
  - name: nginx
    image: nginx
---
apiVersion: v1
kind: Pod
metadata:
  name: mysql
  labels:			%mysql这个pod的标签是app=mysql
    app: mysql
spec:
  containers:
  - name: mysql
    image: mysql:5.7
    env:			%环境变量
     - name: "MYSQL_ROOT_PASSWORD"
       value: "westos"
  affinity:
    podAffinity:		%pod亲和性
      requiredDuringSchedulingIgnoredDuringExecution:	%必须满足以下条件
      - labelSelector:
          matchExpressions:
          - key: app			%标签app=nginx
            operator: In
            values:
            - nginx
        topologyKey: kubernetes.io/hostname
```

应用pod2.yaml 文件，创建pod，查看两个pod，他们在同一个节点上，因为mysql专门匹配有nginx这个标签的pod，nginx去哪个节点，mysql就去哪个节点，生产环境中也确实有这种需要，nginx服务和mysql数据库要放在一起。

下面测试pode的反亲和。修改pod2.yaml 文件，由原来的pod亲和变为pod反亲和

应用pod2.yaml 文件，创建pod，可以看到，mysql和nginx专门不在同一个节点上

## 4、Taints(污点)

NodeAffinity节点亲和性，是Pod上定义的一种属性，使Pod能够按我们的要求调度到某个Node上，而Taints则恰恰相反，它可以让Node拒绝运行Pod，甚至驱逐Pod。

Taints(污点)是Node的一个属性，设置了Taints后，Kubernetes是不会将Pod调度到这个Node上的，于是Kubernetes就又给Pod设置了个属性Tolerations(容忍)，只要Pod能够容忍Node上的污点，那么Kubernetes就会忽略Node上的污点，就能够(不是必须)把Pod调度过去。

> 举个不太恰当的例子：假如一个人有犯罪前科（Taints）来应聘，我是饭店老板，那么我可能不喜欢他，甚至驱逐他，不让他在这工作等等，但是如果我比较大度（Tolerations），我不计较你的前科（Taints），那我就可以把你留在我这当服务生。

可以使用命令 kubectl taint 给节点增加一个 taint：

`kubectl taint nodes node1 key=value:NoSchedule` 创建

`kubectl describe nodes server1 |grep Taints` 查询

`kubectl taint nodes node1 key:NoSchedule-` 删除

其中[effect] 可取值： [ NoSchedule | PreferNoSchedule | NoExecute ]

参数
含义

NoSchedule
POD 不会被调度到标记为 taints 的节点

PreferNoSchedule
NoSchedule 的软策略版本（最好不要调度到标记为 taints 的节点）

NoExecute
该选项意味着一旦 Taint 生效，如该节点内正在运行的 POD 没有对应 Tolerate 设置，会直接被逐出

注意上面的nodename调度方式无视污点，nodename的优先级最高，nodename说去哪里就去哪里

### （1）NoSchedule+标签选择

前面说到server2是集群的master，默认不会work只会调度，原因就在与server2有污点，NoSchedule

编辑pod.yaml 文件

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
    roles: master		%匹配标签roles=master的节点
```

给server2添加roles=master标签，应用pod.yaml 文件，创建pod，查看pod的状态为pending。原因是创建pod时，要寻找标签是roles=master的节点，找到了server2，但是server2上有污点，NoSchedule，pod就无法调度到server2，那么pod只能等待。说明标签选择无法覆盖污点

显示调度失败

### （2）容忍

tolerations中定义的key、value、effect，要与node上设置的taint保持一致：

（1）如果 operator 是 Exists ，value可以省略。

（2）如果 operator 是 Equal ，则key与value之间的关系必须相等。

（3）如果不指定operator属性，则默认值为Equal。

还有两个特殊值：

（1）当不指定key时，再配合Exists 就能匹配所有的key与value ，可以容忍所有污点。

（2）当不指定effect时 ，则匹配所有的effect。

#### 1.NoSchedule

修改pod.yaml 文件

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
    roles: master
  tolerations:			%容忍NoSchedule这个污点，即装作看不见NoSchedule这个污点
  - operator: "Exists"
    effect: "NoSchedule"
```

删除上个的pod，重新应用pod.yaml 文件，查看状态，running了

删除上个的pod，给server3也添加一个污点，NoSchedule。

修改pod.yaml 文件，注释掉匹配标签模块和容忍模块。

应用pod.yaml 文件，节点只能去server4，因为server2和server3都有污点

#### 2.NoExecute

NoExecute：该选项意味着一旦 Taint 生效，如该节点内正在运行的 POD 没有对应 Tolerate 设置，会直接被逐出。被驱逐到其他node节点。

删除以前的pod

修改pod.yaml 文件

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
    disktype: ssd		%匹配标签disktype=ssd
  tolerations:
  - operator: "Exists"
    effect: "NoSchedule"	%容忍NoSchedule这个污点
```

查看标签，之前给server4添加了ssd这个标签。应用pod.yaml 文件，pod被调度到server4

给server4添加污点`key=value:NoExecute`，可以看到添加完成后，之前在server4上的pod立马被驱离了

当pod.yaml 文件改为

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
    disktype: ssd		%匹配标签disktype=ssd
  tolerations:
  - operator: "Exists"
    effect: "NoExecute"	%容忍NoExecute这个污点
```

为Pod设置容忍后，应用pod.yaml 文件，server4又可以运行Pod了

测试完成后，取消污点`kubectl taint nodes server4 key:NoExecute-`

## 5、cordon、drain、delete

影响Pod调度的指令还有：cordon、drain、delete，后期创建的pod都不会被调度到该节点上，但操作的暴力程度不一样，逐渐递增。

### （1）cordon隔离

cordon 停止调度。影响最小，只会将node调为SchedulingDisabled，新创建pod，不会被调度到该节点，节点原有pod不受影响，仍正常对外提供服务。

隔离server3后，状态为SchedulingDisabled，新的pod不会被调度到server3。

取消隔离后，恢复正常

### （2）drain驱逐

drain 驱逐节点：

首先驱逐node上的已有pod，在其他节点重新创建，然后将节点调为SchedulingDisabled。

驱逐server3时，显示错误，是因为有daemonset这个控制器，他的特点就是每个节点上部署一个，和驱逐策略冲突，所以我们需要忽略daemonset产生的pod，把其他pod驱逐。查看状态会显示SchedulingDisabled。同时可以查看pod的数量锐减

```java
kubectl uncordon server3		%恢复
```

### （3）delete删除

delete 删除节点。最暴力的一个，首先驱逐node上的pod，在其他节点重新创建，然后，从master节点删除该node，master失去对其控制，

```java
kubectl delete node server3		%删除server3
```

可以看到删除后，连接直接拒绝了

如要恢复调度，需进入node节点server3，重启kubelet服务，重新连接master

```java
[root@server3 ～]# systemctl restart kubelet	%基于node的自注册功能,恢复使用
```

server3恢复正常

补充：上面讲了已经连接过的节点被删除后，如何恢复。下面讲解如何添加一个新的节点。

我们第一想法是使用刚开始初始化后产生的token令牌添加新的节点，但是那个token只有24小时的有效期，所以需要重新建立token。如下图，建立token，查看，有效期确实为24小时。然后把这个新的token给准备添加的节点，加入集群。
