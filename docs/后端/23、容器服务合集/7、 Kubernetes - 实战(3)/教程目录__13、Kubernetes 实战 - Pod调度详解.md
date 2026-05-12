# 13、Kubernetes 实战 - Pod调度详解
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/3/13.html
- 分类：容器服务
- 分组：教程目录
## 前言

Pod调度

## 第一节 Pod调度

在默认情况下，一个Pod在哪个Nod节点上运行，是由Scheduler组件采用相应的算法计算出来的，这个过程不受人工控制的。但是实际使用中，这并不满足需求，因为很多情况下，我们想控制某些Pod到达某些节点上，那么应该怎么做呢？这就要求了解kubernetes对Pod的调度规则，kubernetes提供了四大类

### 1. 调度方式

- 自动调度： 运行在哪个节点上完全由scheduler经过一些的算法计算得出
- 定向调度：NodeName，NodeSelector
- 亲和性调度: NodeAffinity，PodAffinity，PodAntiAffinity
- 污点(容忍)调度： Taints，Toleration

## 第二节 定向调度

定向调度，指的是利用在pod上声明的 nodeName或者nodeSelector，以此将Pod调度到期望的node节点上。注意，这里的调度是强制的，这就意味着要调度的目标Node不存在，也会向上进行调度，只不过pod运行失败而已。

### 1. NodeName

NodeName用于强制约束将Pod调度到指定的Name的Node节点上。这种方式，其实是直接跳过Scheduler的调度逻辑，直接将Pod调度到指定名称的节点。

接下来，创建一个 pod-nodename.yaml文件

```java
apiVersion: v1
kind: Pod
metadata:
  name: pod-nodename
  namespace: dev
spec:
  containers:
    - name: nginx
      image: nginx:1.17.1
  nodeName: node1指定调度到node1节点上
```

创建Pod

```java
kubectl create -f pod-nodename.yaml
```

当把nodeName改为node3时，再次运行，发现其一直在pending状态，并且NODE为 node3，这标识它是强制调度，不管这个node是否存在。

### 2. NodeSelector

NodeSelector用于将pod调度到添加了标签的node节点上。它是通过kubernetes的label-selector机制实现的，也就是说，在pod创建之前，会由scheduler使用MatchNodeSelector调度策略进行label匹配，找出目标node，然后将pod调度到目标节点上，该匹配规则是强制约束。

**1、** 首先分别为node节点上添加标签；

```java
kubectl label nodes node1 nodeenv=pro
kubectl label nodes node2 nodeenv=test
```

**2、** 创建一个pod-nodeselector.yaml文件，并使用它创建pod；

```java
apiVersion: v1
kind: Pod
metadata:
  name: pod-nodeselector
  namespace: dev
spec:
  containers:
    - name: nginx
      image: nginx:1.17.1
  nodeSelector:
      nodeenv: pro指定调度到具有nodeenv=pro标签的节点上
```

创建pod

```java
kubectl create -f pod-nodeselector.yaml
```

可以看到它被创建到了node1节点上

## 第三节 亲和性调度

前面介绍了两种定向调度的方式，使用起来非常方便，但是也存在一些问题，那就是如果没有满足条件的Node，那么Pod将不会被运行，即使在集群中还可用Node列表也不行，这就限制了它的使用场景。

基于上面的问题，kubernetes还提供了一种亲和性调度(Affinity)。它在NodeSelector的基础之上的进行了扩展，可以通过配置的形式，实现优先选择满足条件的Node进行调度，如果没有，也可以调度到不满足条件的节点上，使调度更加灵活。

**Affinity主要分为三类：**

- nodeAffinity(node亲和性): 以node为目标，解决pod可以调度到哪些node的问题
- podAffinity(pod亲和性): 以pod为目标，解决pod可以和哪些已存在的pod部署在同一个拓扑域中的问题
- podAntiAffinity(pod反亲和性): 以pod为目标，解决pod不能和哪些已存在pod部署在同一个拓扑域中的问题

> 关于亲和性(反亲和性)使用场景说明
>
> 亲和性：如果两个应用频繁交互，那就有必要利用亲和性让两个应用的尽可能的靠近，这样可以减少因网络通信而带来的性能损耗
>
> 反亲和性: 当应用的采用多副本部署时，有必要采用反亲和性让各个应用实例打散分布在各个node上，这样可以提高服务的高可用性

### 1. NodeAffinity(Node亲和性)

- requiredDuringSchedulingIgnoredDuringExecution:

必须满足制定的规则才可以调度pode到Node上。相当于硬限制
- preferredDuringSchedulingIgnoreDuringExecution:

强调优先满足制定规则，调度器会尝试调度pod到Node上，但并不强求，相当于软限制。多个优先级规则还可以设置权重值，以定义执行的先后顺序。

```java
.....
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:  node节点必须满足指定的所有规则才可以，相当于硬限制
        nodeSelectorTerms: 节点选择列表
          - matchExpressions:  按节点字段列出的节点选择器要求列表(推荐)
              - key: 键
                operator: 关系符
                values: 值
      preferredDuringSchedulingIgnoredDuringExecution:  优先调度到满足指定的规则上的Node，相当于软限制(倾向)
        - weight: 1权重，1~100
          preference:  一个节点选择器项，与相应的权重关联
            matchExpressions:  按节点标签列出的节点选择器要求列表(推荐)
              - key: 键
                operator: 关系符
                values: 值
......           
```

关系符支持

- In
- NotIn
- Exists
- DoesNotExit
- Gt
- Lt

举个例子

```java
  - matchExpressions:  
     - key: nodeenv
       operator: Exists       匹配存在标签的key为nodeenv的节点
     - key: nodeenv
       operator: In
       values: ["test","dev"] 匹配标签的key为nodeenv,且value是test或dev的节点
     - key: nodenv
       operator: Gt           匹配标签的key为nodeven,且value大于1的节点
       values: 1
```

#### 1.1 requiredDuringSchedulingIgnoredDuringExecution 硬限制

接下来演示一下requiredDuringSchedulingIgnoredDuringExecution

创建pod-nodeaffinity-required.yaml

```java
apiVersion: v1
kind: Pod
metadata:
  name: pod-nodeaffinity-required
  namespace: dev
spec:
  containers:
    - name: nginx
      image: nginx:1.17.1
  affinity:亲和性设置
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
          - matchExpressions:
              - key: nodeenv
                operator: In
                values: ["xxx","yyy"]
```

创建pod

```java
kubectl create -f pod-nodeaffinity-required.yaml
```

查看pod详情，可以发现当前的三个node都不能满足条件，创建失败了。

此时更改匹配的标签，再次运行，可以发现pod运行在了node1节点上(标签匹配到了node1)。

#### 1.2 preferredDuringSchedulingIgnoredDuringExecution 软限制

创建pod-nodeaffinity-preferred.yaml

```java
apiVersion: v1
kind: Pod
metadata:
  name: pod-nodeaffinity-preferred
  namespace: dev
spec:
  containers:
    - name: nginx
      image: nginx:1.17.1
  affinity:亲和性设置
    nodeAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 1
        preference:
           matchExpressions: 匹配env的值
              - key: nodeenv
                operator: In
                values: ["xxx","yyy"]
```

创建pod

```java
kubectl create f pod-nodeaffinity-preferred.yaml
```

查看pod，发现虽然标签没有匹配成功，但是依然被调度到了node2节点上

NodeAffinity规则设置的注意事项

**1、** 如果同时定义了nodeSelector和nodeAffinity，那么必须两个条件都得到满足，Pod才能运行在指定的Node上；

**2、** 如果nodeAffinity指定了多个nodeSelectorTerms，那么只需要其中一个能够匹配成功即可；

**3、** 如果一个nodeSelectorTerms中有多个matchExpressions，则一个节点必须满足所有的条件才能匹配成功；

**4、** 如果一个pod所在的Node在Pod运行期间标签发生了改变，不再符合该Pod的节点亲和性需求，则系统会忽略此变化；

### 2. PodAffinity(Pod亲和性)

- requiredDuringSchedulingIgnoredDuringExecution:

必须满足制定的规则才可以调度pode到Node上。相当于硬限制
- preferredDuringSchedulingIgnoreDuringExecution:

强调优先满足制定规则，调度器会尝试调度pod到Node上，但并不强求，相当于软限制。多个优先级规则还可以设置权重值，以定义执行的先后顺序。

```java
.....
spec:
  affinity:
    podAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:  pod节点必须满足指定的所有规则才可以，相当于硬限制
        namespaces: dev指定参照pod的namespace
        topologykey:   之地那个调度作用域
        labelSelector: 标签选择器
           - matchExpressions:  按节点字段列出的节点选择器要求列表(推荐)
             - key: 键
               operator: 关系符
               values: 值
             matchLabels:    指定多个matchExpressions映射的内容
      preferredDuringSchedulingIgnoredDuringExecution:  优先调度到满足指定的规则上的pod，相当于软限制(倾向)
        weight: 1      倾向权重，范围1~100
        podAffinityTerm: 选项
          namespaces: dev指定参照pod的namespace
          topologykey:   之地那个调度作用域
          labelSelector: 标签选择器
            - matchExpressions:  按节点字段列出的节点选择器要求列表(推荐)
               - key: 键
                 operator: 关系符
                 values: 值
......           
```

关系符支持

- In
- NotIn
- Exists
- DoesNotExit
- Gt
- Lt

举个例子

```java
  - matchExpressions:  
     - key: nodeenv
       operator: Exists       匹配存在标签的key为nodeenv的节点
     - key: nodeenv
       operator: In
       values: ["test","dev"] 匹配标签的key为nodeenv,且value是test或dev的节点
     - key: nodenv
       operator: Gt           匹配标签的key为nodeven,且value大于1的节点
       values: 1
```

演示示例

**1、** 创建一个pod-podaffinity-target.yaml；

```java
apiVersion: v1
kind: Pod
metadata:
  name: pod-podaffinity-target
  namespace: dev
  labels:
    podenv: pro 设置标签
spec:
  containers:
    - name: nginx
      image: nginx:1.17.1
  nodeName: node1   将目标pod确定到node1上
```

这个pod 将会部署到node1上

创建pod

```java
kubectl create -f pod-podaffinity-target.yaml
```

查看pod可以看到目标pod部署在了node1上

```java
kubectl get pod pod-podaffinity-target -n dev -o wide --show-labels
```

**1、** 创建pod-podaffinity-required.yaml，内容如下；

```java
apiVersion: v1
kind: Pod
metadata:
  name: pod-podaffinity-required
  namespace: dev
spec:
  containers:
    - name: nginx
      image: nginx:1.17.1
  affinity:亲和性设置
    podAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        - labelSelector:
              matchExpressions: 匹配env的值
              - key: podenv
                operator: In
                values: ["xxx","yyy"]
          topologyKey: kubernetes.io/hostname
```

> 这里配置的podenv明显和前面部署的pod不匹配

**topologyKey用于指定调度时作用域**

如果指定kubernetes.io/hostname，那么就是以Node节点区分范围

如果指定beta.kubernetes.io/os，则以Node节点的操作系统类型来区分

创建pod

```java
kubectl create -f pod-podaffinity-required.yaml 
```

查看pod详情

```java
kubectl describe pod pod-podaffinity-required -n dev
```

> 提示翻译
>
> 0/3 nodes are available: 1 node(s) had taints that the pod didn’t tolerate, 2 node(s) didn’t match pod affinity rules.
>
> 翻译：0/3个节点可用:1个节点(s)有pod不能容忍的污染，2个节点(s)不符合pod亲和力规则。

删除pod，修改内容，再次创建pod

```java
kubectl delete -f pod-podaffinity-required.yaml 
```

查看pod，可以看到部署到了node1节点上(和前面pod-podaffinity-target在同一个节点)。

### 3. podAntiAffinity (Pod反亲和性)

反亲和性就是亲和性的对立面。

这里依然采用前面亲和性里创建的pod-podaffinity-target作为目标

**1、** 创建pod-podantiaffinity-required.yaml，内容如下；

```java
apiVersion: v1
kind: Pod
metadata:
  name: pod-podantiaffinity-required
  namespace: dev
spec:
  containers:
    - name: nginx
      image: nginx:1.17.1
  affinity:亲和性设置
    podAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        - labelSelector:
              matchExpressions: 匹配env的值
              - key: podenv
                operator: In
                values: ["pro"]
          topologyKey: kubernetes.io/hostname
```

> 解释：利用反亲和性，使pod远离target-pod

创建pod

```java
kubectl create -f pod-podantiaffinity-required.yaml
```

查看pod

```java
kubectl get pod pod-podantiaffinity-required -n dev -o wide
```

可以发现，pod-podantiaffinity-required使用反亲和性，远离了node1

## 第四节 污点和容忍

### 1. 污点(Taints)

前面的调度方式都是站在Pod的角度上，通过在Pod上添加属性，来确定Pod是否要调度到指定Node上，其实我们也可以站在Node的角度上，通过在Node上添加污点属性，来决定是否运行Pod调度过来。

Node被设置上污点之后就和Pod之间存在一种相斥的关系，进而拒绝Pod调度进来，甚至可以将已经存在的Pod驱除出去。

污点格式: **key=value:effect**，key和value是污点的标签，effect描述污点的作用，支持如下三个选项：

- **PreferNoSchedule**

kubernetes将尽量避免把Pod调度到具有污点的Node上，除非没有其它节点可以调度
- **NoSchedule**

kubernetes将不会把Pod调度到具有该污点的Node上，但不会影响当前Node上已存在的Pod
- **NoExecute**

kubernetes将不会把Pod调度到具有该污点的Node上，同时也会将Node上已存在的Pod驱离

使用kubectl设置和去除污点

```java
#设置污点
kubectl taint nodes node1 key=value:effect
#去除污点
kubecel taint nodes node1 key:effect-
#去除所有污点
kubectl taint nodes node1 key-
```

> 下面的demo将演示亲和性的用法

**1、** 准备节点node1(暂停node2节点)；

> 如何暂停node调度请见?Kubernetes(14):cordon暂停调度/uncordon恢复调度/drain驱逐

```java
[root@master ~]# kubectl cordon node2
node/node2 cordoned
[root@master ~]# kubectl get node
NAME     STATUS                     ROLES    AGE    VERSION
master   Ready                      master   4d2h   v1.17.4
node1    Ready                      <none>   4d1h   v1.17.4
node2    Ready,SchedulingDisabled   <none>   4d1h   v1.17.4
```

**1、** 为node1节点设置一个污点tag=hello:PreferNoSchedule；然后创建pod1；

```java
#给node1设置污点(PreferNoSchedule)
kubectl taint nodes node1 tag=hello:PreferNoSchedule
```

```java
#创建pod
kubectl run taint1 --image=nginx:1.17.1 -n dev
```

```java
#查看pod
kubectl get pods -n dev -o wide
```

可以发现pod1可以创建到node1上面（尽量不来node1，除非没办法）。

**1、** 修改node1节点设置一个污点：tag=hello:NoSchedule；然后创建pod2；

```java
#删除前面的污点
kubectl taint nodes node1 tag=hello:PreferNoSchedule-
```

```java
#创建污点
kubectl taint nodes node1 tag=hello:NoSchedule
```

```java
#创建pod
kubectl run taint2 --image=nginx:1.17.1 -n dev
#查看pod
kubectl get pods -n dev -o wide
```

可以发现已存在的pod正常在node1上运行，但是新的pod不能部署。

**1、** 修改node1节点设置一个污点：tag=hello:NoExecute；然后创建pod3；

```java
#删除前面的污点
kubectl taint nodes node1 tag=hello:NoSchedule-
```

```java
#创建污点
kubectl taint nodes node1 tag=hello:NoExecute
#查看pod
kubectl get pods -n dev -o wide
```

可以发现，此时node1上所有的pod都被Terminating(终止)。

### 2. 为什么所有的pod都不运行到master节点？

原因：其实master节点正是利用污点，不允许pod部署到master上的。

```java
kubectl describe node master
```

> 使用kubead搭建的集群，默认就是给master节点添加了一个污点标记，所以pod就不会调度到master节点上。

### 3. 容忍(Toleration)

上面介绍了污点的作用，我们可以在node上添加污点用于拒绝pod调度上来，但是如果就是要将pod调度到一个有污点的node上去，这时候应该怎么做？这里就需要提到容忍。

> 污点就是拒绝，容忍就是可以接受，Node通过污点拒绝pod调度上去，pod通过容忍忽略拒绝

演示代码

**1、** 前面我们已经给node1节点打上了NoExecute的污点，此时pod是调度不上的；

**2、** 可以通过给pod添加容忍，然后使其调度上去；

创建pod-torertion.yaml

```java
apiVersion: v1
kind: Pod
metadata:
  name: pod-toleration
  namespace: dev
spec:
  containers:
    - name: nginx
      image: nginx:1.17.1
  tolerations:            添加容忍
    - key: "tag"          要容忍的污点的key
      operator: "Equal"   操作符
      value: "hello"      容忍的污点的value
      effect: "NoExecute" 添加容忍的规则，这里必须和标记的污点规则相同
```

查看容忍之前的pod

```java
kubectl get pods -n dev -o wide
```

创建pod

```java
kubectl create -f pod-torertion.yaml
```

可以发现，pod被调度了node1上。

**1、** 去掉容忍，再次测试；

```java
#先删除pod
kubectl delete -f pod-torertion.yaml
```

去掉容忍部分的配置

再次创建pod

```java
kubectl create -f pod-torertion.yaml
```

会发现pod在没有容忍时并不会被创建成功。

### 4. 容忍的配置参数

```java
[root@master ~]# kubectl explain pod.spec.tolerations
KIND:     Pod
VERSION:  v1
RESOURCE: tolerations <[]Object>
DESCRIPTION:
     If specified, the pod's tolerations.
     The pod this Toleration is attached to tolerates any taint that matches the
     triple <key,value,effect> using the matching operator <operator>.
FIELDS:
   effect	<string>
     Effect indicates the taint effect to match. Empty means match all taint
     effects. When specified, allowed values are NoSchedule, PreferNoSchedule
     and NoExecute.
	 对应污点的effect，空值意味着匹配所有 
   key	<string>
     Key is the taint key that the toleration applies to. Empty means match all
     taint keys. If the key is empty, operator must be Exists; this combination
     means to match all values and all keys.
     对应要容忍的污点的键，空值意味着匹配所有
   operator	<string>
     Operator represents a key's relationship to the value. Valid operators are
     Exists and Equal. Defaults to Equal. Exists is equivalent to wildcard for
     value, so that a pod can tolerate all taints of a particular category.
     key-value的运算符，支持Equal和Exists(默认)，Exists表示只匹配key，表示key只要存在就匹配上
   tolerationSeconds	<integer>
     TolerationSeconds represents the period of time the toleration (which must
     be of effect NoExecute, otherwise this field is ignored) tolerates the
     taint. By default, it is not set, which means tolerate the taint forever
     (do not evict). Zero and negative values will be treated as 0 (evict
     immediately) by the system.
     容忍时间，当effect为NoExecute时生效，表示pod在Node上的停留时间
   value	<string>
     Value is the taint value the toleration matches to. If the operator is
     Exists, the value should be empty, otherwise just a regular string.
     对应着要容忍的污点的值
```
