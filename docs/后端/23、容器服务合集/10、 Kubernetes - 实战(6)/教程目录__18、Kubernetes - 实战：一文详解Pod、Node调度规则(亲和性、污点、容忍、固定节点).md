# 18、Kubernetes - 实战：一文详解Pod、Node调度规则(亲和性、污点、容忍、固定节点)
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/6/18.html
- 分类：容器服务
- 分组：教程目录
## Kubernetes Pod调度说明

### 简介

Scheduler 是 Kubernetes 的调度器，主要任务是把定义的Pod分配到集群的节点上，听起来非常简单，但要考虑需要方面的问题：

- 公平：如何保证每个节点都能被分配到资源
- 资源高效利用：集群所有资源最大化被使用
- 效率：调度性能要好，能够尽快的对大批量的Pod完成调度工作
- 灵活：允许用户根据自己的需求控制调度的流程

Scheduler 是作为单独的服务运行的，启动之后会一直监听API Server，获取 podSpec.NodeName为空的Pod，对每个Pod都会创建一个buiding，表明该Pod应该放在哪个节点上

### 调度过程

调度流程：首先过滤掉不满足条件的节点，这个过程称为predicate；然后对通过的节点按照优先级的顺序，这个是priority；最后从中选择优先级最高的节点。如果中间有任何一步报错，则直接返回错误信息。

### Predicate有一系列的算法可以使用：

- PodFitsResources：节点上剩余的资源是否大于 Pod 请求的资源
- PodFitsHost：如果Pod指定了nodeName，检查节点名称是否和nodeName匹配
- PodFitsHostPort：节点上已经使用的port是否和Pod申请的port冲突
- PodSelectorMatches：过滤和Pod指定的 label 不匹配的节点
- NoDiskConflict：已经 mount 的 volume 和 Pod 指定的volume不冲突，除非他们都是只读

如果在predicate过程中没有适合的节点，Pod会一直处于Pending状态，不断重新调度，直到有节点满足条件，经过这个步骤，如果多个节点满足条件，就会进入priority过程：按照优先级大小对节点排序，优先级由一系列键值对组成，键是该优先级的名称，值是它的权重，这些优先级选项包括：

- LeastRequestedPriority：通过计算CPU和Memory的使用率来决定权重，使用率越低权重越高，换句话说，这个优先级倾向于资源使用率低的节点
- BalanceResourceAllocation：节点上CPU和Memory使用率非常及接近，权重就越高，这个要和上边的一起使用，不可单独使用
- ImageLocalityPriority：倾向于已经要使用镜像的节点，镜像的总大小值越大，权重越高

通过算法对所有的优先级项目和权重进行计算，得出最终的结果

### 自定义调度器

除了Kubernetes自带的调度器，也可以编写自己的调度器，通过spec.schedulername参数指定调度器的名字，可以为Pod选择某个调度器进行调度，比如下边的Pod选择my-scheduler进行调度，而不是默认的default-scheduler

```java
apiVersion: v1
kind: Pod
metadata:
  name: scheduler-test
  labels:
    name: example-scheduler
spec:
  schedulername: my-scheduler
  containers:
  - name: Pod-test
    image: nginx:v1
```

下边开始正式介绍Pod的各种调度方法！！！

## 一、亲和性

注意，以下所有的测试都是1Master、1Node的情况下：

```java
[root@Centos8 scheduler]# kubectl get node
NAME          STATUS   ROLES    AGE    VERSION
centos8       Ready    master   134d   v1.15.1
testcentos7   Ready    <none>   133d   v1.15.1
```

### 1、节点亲和性

pod.spec.affinity.nodeAffinity

- preferredDuringSchedulingIgnoredDuringExecution：软策略
- 软策略是偏向于，更想(不)落在某个节点上，但如果实在没有，落在其他节点也可以
- requiredDuringSchedulingIgnoredDuringExecution：硬策略
- 硬策略是必须(不)落在指定的节点上，如果不符合条件，则一直处于Pending状态

### requiredDuringSchedulingIgnoredDuringExecution硬策略

vimnode-affinity-required.yaml

```java
apiVersion: v1
kind: Pod
metadata:
  name: affinity-required
  labels:
      app: node-affinity-pod
spec:
  containers:
  - name: with-node-required
    image: nginx:1.2.1
    imagePullPolicy: IfNotPresent
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: kubernetes.io/hostname   节点名称
            operator: NotIn       不是
            values:
            - testcentos7         node节点
```

```java
[root@Centos8 ~]# kubectl get node --show-labels   查看node节点标签
NAME          STATUS   ROLES    AGE    VERSION   LABELS
centos8       Ready    master   133d   v1.15.1   beta.kubernetes.io/arch=amd64,beta.kubernetes.io/os=linux,kubernetes.io/arch=amd64,kubernetes.io/hostname=centos8,kubernetes.io/os=linux,node-role.kubernetes.io/master=
testcentos7   Ready    <none>   133d   v1.15.1   beta.kubernetes.io/arch=amd64,beta.kubernetes.io/os=linux,kubernetes.io/arch=amd64,kubernetes.io/hostname=testcentos7,kubernetes.io/os=linux
## 目前只有两个节点，一个master 一个node，策略中表示此Pod必须不在testcentos7这个节点上
## Pod创建之后，因为除去testcentos7节点已再无其他node，Master节点又不能被调度，所以一直处于Pending状态
[root@Centos8 scheduler]# kubectl create -f node-affinity-required.yaml 
pod/affinity-required created
[root@Centos8 scheduler]# kubectl get pod 
NAME                READY   STATUS    RESTARTS   AGE
affinity-required   0/1     Pending   0          4s
[root@Centos8 scheduler]# kubectl describe pod affinity-required
default-scheduler  0/2 nodes are available: 1 node(s) didn't match node selector, 1 node(s) had taints that the pod didn't tolerate.
```

将yaml文件中，NotIn改为In

```java
affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: kubernetes.io/hostname   节点名称
            operator: In       是，存在
            values:
            - testcentos7           node节点
```

再次创建，已经落在指定node节点中

```java
[root@Centos8 scheduler]# kubectl get pod -o wide 
NAME                READY   STATUS    RESTARTS   AGE   IP             NODE     
affinity-required   1/1     Running   0          11s  10.244.3.219  testcentos7
```

### preferredDuringSchedulingIgnoredDuringExecution软策略

vimnode-affinity-preferred.yaml

```java
apiVersion: v1
kind: Pod
metadata:
  name: affinity-preferred
  labels:
    app: node-affinity-pod
spec:
  containers:
  - name: with-node-preferred
    image: nginx:1.2.1
    imagePullPolicy: IfNotPresent
  affinity:
    nodeAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 1   权重为1,软策略中权重越高匹配到的机会越大
        preference: 更偏向于
          matchExpressions:
          - key: kubernetes.io/hostnamenode名称
            operator: In 等于，为
            values:
            - testcentos7  node真实名称
```

```java
## 更想落在node节点名称为testcentos7的node中
[root@Centos8 scheduler]# kubectl create -f node-affinity-prefered.yaml 
pod/affinity-prefered created
[root@Centos8 scheduler]# kubectl get pod -o wide 
NAME                READY   STATUS    RESTARTS   AGE   IP             NODE     
affinity-prefered   1/1     Running   0          9s    10.244.3.220 testcentos7
```

更改一下策略，将node节点名称随便更改为不存在的node名称，例如kube-node2

```java
affinity:
    nodeAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 1   权重为1,软策略中权重越高匹配到的机会越大
        preference: 更偏向于
          matchExpressions:
          - key: kubernetes.io/hostnamenode名称
            operator: In 等于，为
            values:
            - kube-node2  node真实名称
```

```java
[root@Centos8 scheduler]# kubectl create -f node-affinity-prefered.yaml 
pod/affinity-prefered created
##创建后，同样是落在了testcentos7节点上，虽然它更想落在kube-node2节点上，但没有，只好落在testcentos7节点中
[root@Centos8 scheduler]# kubectl get pod -o wide 
NAME                READY   STATUS    RESTARTS   AGE   IP             NODE     
affinity-prefered   1/1     Running   0          17s   10.244.3.221 testcentos7
```

### 软硬策略合体

vimnode-affinity-common.yaml

```java
apiVersion: v1
kind: Pod
metadata:
  name: affinity-node
  labels:
    app: node-affinity-pod
spec:
  containers:
  - name: with-affinity-node
    image: nginx:v1
    imagePullPulicy: IfNotPresent
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: kubernetes.io/hostname
            operator: NotIn
            values:
            - k8s-node2
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 1 
        preference:
        matchExpressions:
        - key: source
          operator: In
          values:
           - hello
```

> 软硬结合达到一个更为准确的node选择，以上文件意思为此Pod必须不存在k8s-node2节点中，其他的节点都可以，但最好落在label中source的值为hello的节点中

### 键值运算关系

- In：label 的值在某个列表里
- NotIn：label 的值不在某个列表中
- Gt：label 的值大于某个值
- Lt：label 的值小于某个值
- Exists：某个 label 存在
- DoesNotExist：某个 label 不存在

> 如果nodeSelectorTerms下面有多个选项，满足任何一个条件就可以了；如果matchExpressions有多个选项，则必须满足这些条件才能正常调度

### 2、Pod亲和性

pod.spec.affinity.podAffinity/podAntiAffinity

- preferedDuringSchedulingIgnoredDuringExecution：软策略
- 软策略是偏向于，更想(不)落在某个节点上，但如果实在没有，落在其他节点也可以
- requiredDuringSchedulingIgnoredDuringExecution：硬策略
- 硬策略是必须(不)落在指定的节点上，如果不符合条件，则一直处于Pending状态

### 先创建一个测试Pod

vimpod.yaml

```java
apiVersion: v1
kind: Pod
metadata:
  name: pod-1
  labels:
    app: nginx
    type: web
spec:
  containers:
  - name: pod-1
    image: nginx:1.2.1
    imagePullPolicy: IfNotPresent
    ports:
    - name: web
      containerPort: 80
```

```java
[root@Centos8 scheduler]# kubectl create -f pod.yaml 
pod/pod-1 created
[root@Centos8 scheduler]# kubectl get pod --show-labels
NAME    READY   STATUS    RESTARTS   AGE   LABELS
pod-1   1/1     Running   0          4s    app=nginx,type=web
```

### requiredDuringSchedulingIgnoredDuringExecution Pod硬策略

vimpod-affinity-required.yaml

```java
apiVersion: v1
kind: Pod
metadata:
  name: affinity-required
  labels:
    app: pod-3
spec:
  containers:
  - name: with-pod-required
    image: nginx:1.2.1
    imagePullPolicy: IfNotPresent
  affinity:
    podAffinity:  在同一域下
      requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchExpressions:
          - key: app   标签key
            operator: In
            values:
            - nginx    标签value
        topologyKey: kubernetes.io/hostname域的标准为node节点的名称
```

> 以上文件策略为：此必须要和有label种app：nginx的pod在同一node下

### 创建测试:

```java
[root@Centos8 scheduler]# kubectl create -f pod-affinity-required.yaml 
pod/affinity-required created
[root@Centos8 scheduler]# kubectl get pod -o wide 
NAME                READY   STATUS    RESTARTS   AGE   IP             NODE  
affinity-required   1/1     Running   0          43s   10.244.3.224 testcentos7
pod-1               1/1     Running   0          10m   10.244.3.223 testcentos7
# 和此标签Pod在同一node节点下
```

将podAffinity改为podAnitAffinity，使它们不在用于node节点下

```java
apiVersion: v1
kind: Pod
metadata:
  name: required-pod2
  labels:
    app: pod-3
spec:
  containers:
  - name: with-pod-required
    image: nginx:1.2.1
    imagePullPolicy: IfNotPresent
  affinity:
    podAntiAffinity:   
      requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchExpressions:
          - key: app   标签key
            operator: In
            values:
            - nginx    标签value
        topologyKey: kubernetes.io/hostname域的标准为node节点的名称
```

> 此策略表示，必须要和label为app:nginx的pod在不用的node节点上

### 创建测试：

```java
[root@Centos8 scheduler]# kubectl create -f pod-affinity-required.yaml 
pod/required-pod2 created
[root@Centos8 scheduler]# kubectl get pod 
NAME                READY   STATUS    RESTARTS   AGE
affinity-required   1/1     Running   0          9m40s
pod-1               1/1     Running   0          19m
required-pod2       0/1     Pending   0          51s
## 由于我这里只有一个节点，所以required-pod2只能处于Pending状态
```

### preferedDuringSchedulingIgnoredDuringExecution Pod软策略

```java
vim pod-affinity-prefered.yaml
...
apiVersion: v1
kind: Pod
metadata:
  name: affinity-prefered
  labels:
    app: pod-3
spec:
  containers:
  - name: with-pod-prefered
    image: nginx:v1
    imagePullPolicy: IfNotPresent
  affinity:
    podAntiAffinity:   不在同一个域下
      preferedDuringSchedulingIgnoredDuringExecution:
      - weight: 1
        podAffinityTerm:
          labelSelector:
            matchExpressions:
            - key: app
              operator: In
              values:
              - pod-2
          topologyKey: kubernetes.io/hostname
...
```

> 软策略和硬策略的方法基本类似，只是添加了权重，表示更喜欢而已，也可以接受其他，在此就不再演示

### 亲和性/反亲和性调度策略比较如下：

调度策略
匹配标签
操作符
拓扑域支持
调度目标

nodeAffinity
主机
In,NotIn,Exists,DoesNotExists,Gt,Lt
否
指定主机

podAffinity
Pod
In,NotIn,Exists,DoesNotExists,Gt,Lt
是
pod与指定pod在一拓扑域

podAnitAffinity
Pod
In,NotIn,Exists,DoesNotExists,Gt,Lt
是
pod与指定pod不在一拓扑域

### 二、污点(Taint)和容忍(Toleration)

节点亲和性，是Pod的一种属性（偏好或硬性要求），它使Pod被吸引到一类特定的节点，Taint则相反，它使节点能够 排斥 一类特定的Pod

Taint与Toleration相互配合，可以用来避免Pod被分配到不合适的节点上，每个节点上都可以应用一个或两个taint，这表示对那些不能容忍这些taint和pod，是不会被该节点接受的，如果将toleration应用于pod上，则表示这些pod可以（但不要求）被调度到具有匹配taint的节点上

注意，以下所有的测试都是1Master、1Node的情况下：

```java
[root@Centos8 scheduler]# kubectl get node
NAME          STATUS   ROLES    AGE    VERSION
centos8       Ready    master   134d   v1.15.1
testcentos7   Ready    <none>   133d   v1.15.1
```

### 1、污点（Taint）

### 污点的组成

使用kubectl taint 命令可以给某个node节点设置污点，Node被设置上污点之后就和Pod之间存在了一种相斥的关系，可以让Node拒绝Pod的调度执行，甚至将已经存在得Pod驱逐出去

每个污点的组成如下：

```java
key=value:effect
```

每个污点有一个 key 和 value 作为污点标签，其中 value 可以为空，effect描述污点的作用，当前 taint effect 支持如下三个选项：

- **NoSchedule**：表示 k8s 不会将Pod调度到具有该污点的Node上
- **PreferNoSchedule**：表示 k8s 将尽量避免将Pod调度到具有该污点的Node上
- **NoExecute**：表示 k8s 将不会将Pod调度到具有该污点的Node上，同时会将Node上已有的Pod驱逐出去

### 污点的设置、查看和去除

> k8s的master节点本身就带有污点，这也是为什么k8s在调度Pod时，不会调度到master节点的原因，具体查看如下：

```java
[root@Centos8 scheduler]# kubectl describe node centos8
Taints:             node-role.kubernetes.io/master:NoSchedule
## 设置污点
kubectl taint nodes [node name] key1=value:NoSchedule
## 节点说明中，查看Taint字段
kubectl describe node [node name]
## 去除污点
kubectl taint nodes [node name] key1:NoSchedule-
```

测试效果：

```java
## 查看当前节点所拥有Pod，都在testcentos7中
[root@Centos8 scheduler]# kubectl get pod -o wide
NAME                READY   STATUS    RESTARTS   AGE   IP             NODE     
affinity-required   1/1     Running   0          68m   10.244.3.224 testcentos7
pod-1               1/1     Running   0          78m   10.244.3.223 testcentos7
required-pod2       0/1     Pending   0          59m   <none>         <none>   
## 给testcentos7设置NoExecute污点
[root@Centos8 scheduler]# kubectl taint nodes testcentos7 check=vfan:NoExecute
node/testcentos7 tainted
## 查看Pod有没被驱逐出去
[root@Centos8 scheduler]# kubectl get pod 
NAME            READY   STATUS    RESTARTS   AGE
required-pod2   0/1     Pending   0          62m
## 只剩一个Pending状态的Pod，因为他还没创建，所以还未分配Node
```

查看testcentos7 节点信息

```java
[root@Centos8 scheduler]# kubectl describe node  testcentos7
Taints:             check=vfan:NoExecute
```

目前所有的节点都被打上了污点，新建Pod测试下效果：

```java
[root@Centos8 scheduler]# kubectl create -f pod.yaml 
pod/pod-1 created
[root@Centos8 scheduler]# kubectl get pod 
NAME            READY   STATUS    RESTARTS   AGE
pod-1           0/1     Pending   0          4s
required-pod2   0/1     Pending   0          7h18m
```

> 新建的Pod会一直处于Pending状态，因为没有可用的Node节点，这时候就可以使用容忍(Toleration)了

### 2、容忍(Toleration)

设置了污点的Node将根据 taint 的 effect:NoSchedule、PreferNoSchedule、NoExecute和Pod之间产生互斥的关系，Pod将在一定程度上不会被调度到 Node 上。但我们可以在 Pod 上设置容忍(Toleration)，意思是设置了容忍的 Pod 将可以容忍污点的存在，可以被调度到存在污点的Node上

Pod.spec.tolerations

```java
tolerations:
- key: "key1"
  operator: "Equal"
  value: "value1"
  effect: "NoSchedule"
  tolerationSeconds: 3600
- key: "key1"
  operator: "Equal"
  value: "value1"
  effect: "NoExecute"
- key: "key2"
  operator: "Exists"
  effect: "NoSchedule"
```

- 其中 key、value、effect 要与Node中的 taint 保持一致
- operator 的值为 Exists 将会忽略 value 的值
- tolerationSeconds 用于描述当Pod需要驱逐时可以在Node上继续保留运行的时间

（1）当不指定key时，表示容忍所有污点的key：

```java
tolerations：
- operator: "Exists"
```

例如：

vimpod3.yaml

```java
apiVersion: v1
kind: Pod
metadata:
  name: pod-3
  labels:
    app: nginx
    type: web
spec:
  containers:
  - name: pod-3
    image: nginx:1.2.1
    imagePullPolicy: IfNotPresent
    ports:
    - name: web
      containerPort: 80
  tolerations:
  - operator: "Exists"
    effect: "NoSchedule"
```

```java
[root@Centos8 scheduler]# kubectl create -f pod3.yaml 
pod/pod-3 created
[root@Centos8 scheduler]# kubectl get pod -o wide 
NAME    READY   STATUS    RESTARTS   AGE   IP             NODE          NOMINATED NODE   READINESS GATES
pod-1   0/1     Pending   0          14m   <none>         <none>        
pod-2   1/1     Running   0          11m   10.244.3.229   testcentos7  
pod-3   1/1     Running   0          9s    10.244.0.107   centos8       
```

> yaml策略为：可以容忍所有为NoSchedule的污点，因为centos8为master节点，污点默认为NoSchedule，所以Pod-3被调度到master节点

（2）当不指定 offect 值时，表示容忍所有的污点类型

```java
tolerations:
- key: "key1"
  value: "value1"
  operator: "Exists"
```

（3）Pod容忍测试用例：

vimpod2.yaml

```java
apiVersion: v1
kind: Pod
metadata:
  name: pod-2
  labels:
    app: nginx
    type: web
spec:
  containers:
  - name: pod-2
    image: nginx:1.2.1
    imagePullPolicy: IfNotPresent
    ports:
    - name: web
      containerPort: 80
  tolerations:
  - key: "check"
    operator: "Equal"
    value: "vfan"
    effect: "NoExecute"
```

```java
[root@Centos8 scheduler]# kubectl create -f pod2.yaml 
pod/pod-2 created
[root@Centos8 scheduler]# kubectl get pod 
NAME    READY   STATUS    RESTARTS   AGE
pod-1   0/1     Pending   0          3m25s
pod-2   1/1     Running   0          4s
```

> 设置容忍的Pod，可以正常调度到Node节点，而没有设置容忍的，还一直处于Pending状态

### 最后将Node污点去除：

```java
kubectl taint nodes testcentos7 check=vfan:NoExecute-
```

> 去除node污点仅需在创建命令的最后加一个 - 即可

## 三、指定调度节点

注意，以下所有的测试都是1Master、1Node的情况下：

```java
[root@Centos8 scheduler]# kubectl get node
NAME          STATUS   ROLES    AGE    VERSION
centos8       Ready    master   134d   v1.15.1
testcentos7   Ready    <none>   133d   v1.15.1
```

**1、** Pod.spec.nodeName将Pod直接调度到指定的Node节点上，会跳过Schedule的调度策略，该匹配规则是强制匹配；

vimnodeName1.yaml

```java
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: nodename-1
  labels:
    app: web
spec:
  replicas: 3
  template:
    metadata:
      labels:
        app: web
    spec:
      nodeName: testcentos7
      containers:
      - name: nodename-1
        image: nginx:1.2.1
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 80
```

```java
[root@Centos8 scheduler]# kubectl apply -f nodeName1.yaml 
deployment.extensions/nodename-1 created
[root@Centos8 scheduler]# kubectl get pod -o wide 
NAME                 READY   STATUS    RESTARTS   AGE   IP             NODE
nodename-1-7f4c7db4d4-hdcjv   1/1  Running   0   92s   10.244.3.240 testcentos7
nodename-1-7f4c7db4d4-xxrj8   1/1  Running   0   93s   10.244.3.238 testcentos7
nodename-1-7f4c7db4d4-zkt2c   1/1  Running   0   92s   10.244.3.239 testcentos7
```

> 以上策略表示，所有Deployment所有的副本，均要调度到testcentos7节点上

为了对比效果，修改yaml文件中Node节点为centos8

```java
nodeName: centos8
```

再次创建测试

```java
[root@Centos8 scheduler]# kubectl delete -f nodeName1.yaml 
[root@Centos8 scheduler]# kubectl apply -f nodeName1.yaml 
deployment.extensions/nodename-1 created
NAME                          READY   STATUS    RESTARTS   AGE    IP     NODE
nodename-1-7d49bd7849-ct9w5   1/1     Running   0  2m2s   10.244.0.112  centos8
nodename-1-7d49bd7849-qk9mm   1/1     Running   0  2m2s   10.244.0.113  centos8
nodename-1-7d49bd7849-zdphd   1/1     Running   0  2m2s   10.244.0.111  centos8
```

> 全部落在了centos8节点中

**2、** Pod.spec.nodeSelector：通过kubernetes的label-selector机制选择节点，由调度策略匹配label，而后调度Pod到目标节点，该匹配规则属于强制约束；

vimnodeSelect1.yaml

```java
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: node-1
  labels: 
    app: web
spec:
  replicas: 3
  template:
    metadata:
      labels:
        app: myweb
    spec:
      nodeSelector:
        type: ssd    Node包含的标签
      containers:
      - name: myweb
        image: nginx:1.2.1
        ports:
        - containerPort: 80
```

```java
[root@Centos8 scheduler]# kubectl apply -f nodeSelect1.yaml 
deployment.extensions/node-1 created
[root@Centos8 scheduler]# kubectl get pod 
NAME                      READY   STATUS    RESTARTS   AGE
node-1-684b6cc685-9lzbn   0/1     Pending   0          3s
node-1-684b6cc685-lwzrm   0/1     Pending   0          3s
node-1-684b6cc685-qlgjq   0/1     Pending   0          3s
[root@Centos8 scheduler]# kubectl get node --show-labels
NAME          STATUS   ROLES    AGE    VERSION   LABELS
centos8       Ready    master   135d   v1.15.1   beta.kubernetes.io/arch=amd64,beta.kubernetes.io/os=linux,kubernetes.io/arch=amd64,kubernetes.io/hostname=centos8,kubernetes.io/os=linux,node-role.kubernetes.io/master=
testcentos7   Ready    <none>   134d   v1.15.1   beta.kubernetes.io/arch=amd64,beta.kubernetes.io/os=linux,kubernetes.io/arch=amd64,kubernetes.io/hostname=testcentos7,kubernetes.io/os=linux
```

> 以上策略表示：将Deployment的三个副本全部调度到标签为type:ssd的Node节点上，因为没有Node节点有此标签，所以一直处于Pending状态

下面我们将testcentos7节点打上标签type:ssd

```java
[root@Centos8 scheduler]# kubectl label node testcentos7 type=ssd
node/testcentos7 labeled
[root@Centos8 scheduler]# kubectl get pod
NAME                      READY   STATUS    RESTARTS   AGE
node-1-684b6cc685-9lzbn   1/1     Running   0          4m30s
node-1-684b6cc685-lwzrm   1/1     Running   0          4m30s
node-1-684b6cc685-qlgjq   1/1     Running   0          4m30s
```

> 打上标签后，Pod恢复Running状态

文中有不足之处欢迎指出，不胜感激！
