# 15、Kubernetes 实战 - Pod控制器ReplicaSet和Deployment详解
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/3/15.html
- 分类：容器服务
- 分组：教程目录
## 前言

pod控制器

## 第一节 Pod控制器

在kubernetes中，按照pod的创建方式可以将其分为两类

- **自主式pod**: kubernetes直接创建出来的pod，这种pod删除后就没有了，也不会重建.
- **控制器创建的pod**: 通过控制器创建的pod， 这种pod删除了之后还会自动重建

> 什么是pod控制器
>
> Pod控制器是管理pod的中间层，使用了pod控制器之后，我们只需要告诉pod控制器，想要多少个什么样的pod就可以了，它就会创建出满足条件的pod并确保每一个pod处于用户期望的状态，如果pod在运行中出现故障，控制器会基于指定策略重启或者重建pod。

在kubernetes中，有很多类型的pod控制器，每个都有自己的适合的场景，常见的有下面这些:

- **ReplicationController**

比较原始的pod控制器，已经被废弃，由ReplicatSet替代
- **ReplicaSet**

保证指定数量的pod运行，并支持pod数量变更，镜像版本变更
- **Deployment**

通过空值ReplicaSet来空值pod，并支持滚动升级，版本回退
- **Horizontal Pod Autoscaler**

可以根据集群负载自动调整pod的数量，实现消峰填谷
- **DaemonSet**

在集群中的指定Node上都运行一个副本，一般用于守护进行类的任务
- **Job**

它创建出来的pod只要完成任务就立即退出，用于执行一次性任务
- **Cronjob**

它创建的pod会周期性的执行，用于执行周期性任务
- **StatefulSet**

管理有状态应用

## 第二节 ReplicaSet(RS)

### 1. 概念和资源清单

ReplicaSet的主要作用是保证一定数量的pod能够正常运行，它会持续监听这些pod的运行状态，一旦pod发生故障，就会重启或重建。同时它还支持pod数量。同时它还支持对pod数量的扩缩容和版本镜像的升级。

ReplicaSet的资源清单文件：

```java
apiVersion: apps/v1  版本号
kind: ReplicaSet   类型
metadata:  元数据
  name: pc-replicaset   rs名称
  namespace: dev  所属命名空间
  labels: 标签
     controller: rs
spec: 详情
  replicas: 3副本数量3
  selector:选择器，通过它指定该控制器管理哪些pod
    matchLabels:labels匹配规则,用于匹配template
      app: nginx-pod
    matchExpressions: Expressions匹配规则
      - {
     key: app,operator: In ,values:[nginx-pod]}
  template: 模板，当副本数量不足时，会根据模板创建pod副本
    metadata:
      labels:
        app: nginx-pod
    spec:
      containers:
        - name: nginx
          image: nginx:1.17.1
          ports:
            - containerPort: 80
```

在这里，需要新了解的配置项就是spec下面的几个属性

- replicas: 指定副本数量，其实就是当前rs创建出来的pod的数量，默认1
- selector: 选择器，它的作用是建立pod控制器与pod之间的关联关系，采用Label Selector机制在在pod模板上定义label，在控制器上定义选择器，就可以表明当前控制器能管理哪些pod了
- template: 模板，就是当前控制器创建pod所使用的模板，就是前面的pod定义

### 2. 创建ReplicaSet

创建pc-replicaset.yaml文件，内容如下

```java
apiVersion: apps/v1  版本号
kind: ReplicaSet   类型
metadata:  元数据
  name: pc-replicaset   rs名称
  namespace: dev  所属命名空间
  labels: 标签
     controller: rs
spec: 详情
  replicas: 3副本数量3
  selector:选择器，通过它指定该控制器管理哪些pod
    matchLabels:labels匹配规则,用于匹配template
      app: nginx-pod
  template: 模板，当副本数量不足时，会根据模板创建pod副本
    metadata:
      labels:
        app: nginx-pod
    spec:
      containers:
        - name: nginx
          image: nginx:1.17.1
```

创建rs

```java
kubectl create -f pc-replicaset.yaml
```

查看rs

```java
kubectl get rs pc-replicaset -n dev -o wide
```

DESIRED: 期望副本数量

CURRENT: 当前副本数量

READY: 已准备好的副本数

可以看到它创建了3个pod，pod的名称是控制器的名称+一个随机字符串。

### 3. 扩缩容

#### 3.1 方法一：直接编辑rs

```java
kubectl edit rs pc-replicaset -n dev
```

#### 3.2方法二 ：命令扩缩容

```java
kubectl scale rs pc-replicaset --replicas=2 -n dev
```

replicas=n，kubernetes会根据当前pod数量自动增加或者减少到n个pod

### 4. 镜像升级/降级

#### 4.1 方法一： 直接编辑rs

```java
kubectl edit rs pc-replicaset -n dev
```

修改版本并退出

查看rs

```java
kubectl get rs pc-replicaset -n dev -o wide
```

#### 4.2 方法二 ：命令升级

```java
kubectl set image rs pc-replicaset nginx=nginx:1.17.1 -n dev
```

### 5. 删除ReplicaSet

#### 5.1 命令删除

使用kubectl delete 命令会删除此RS以及它管理的Pod

在kubernetes删除之前，会将RS的replicascaler调整为0，等地所有的Pod被删除后，在执行RS对象的删除

```java
kubectl delete rs pc-replicaset -n dev
kubectl get pod -n dev -o wide
```

#### 5.2 非级联删除

如果希望只删除RS对象（保留Pod），可以使用kubectl delete 命令后添加 --cascade=false选项(不推荐)

```java
#只删除RS，不级联删除pod,不推荐此操作
kubectl delete rs pc-replicaset -n dev  --cascade=false
```

#### 5.3 yaml删除

直接使用yaml删除（推荐）

```java
kubectl delete -f pc-replicaset.yaml
```

## 第三节 Deployment(Deploy)

### 1. 概念和资源清单

为了更好的解决服务编排的问题，kubernetes在v1.2版本开始，引入了Deployment控制器。值得一提的是，这种控制器并不直接管理pod，而是通过管理ReplicasSet来间接管理Pod，即Deployment管理ReplicaSet，ReplicaSet管理Pod。所以Deployment比ReplicaSet功能更加强大。

Deployment主要功能有下面几个

- 支持ReplicaSet的所有功能
- 支持发布的停止、继续
- 支持版本滚动更新和版本回退

Deployment的资源清单

```java
apiVersion: apps/v1  版本号
kind: Deployment   类型
metadata:  元数据
  name: pc-deployment   rs名称
  namespace: dev  所属命名空间
  labels: 标签
     controller: deploy
spec: 详情
  replicas: 3副本数量3
  revisionHistoryLimit: 3保留历史版本，默认10
  paused: false暂停部署，默认是false
  progressDeadlineSeconds: 600部署超时时间(s),默认600
  strategy: 策略
    type: RollingUpdate滚动更新策略
    rollingUpdate:
      maxSurge: 30%最大额外可以存在的副本数，可以为百分比，也可以是整数
      maxUnavailable: 30%最大不可用状态的Pod的最大值，可以为百分比，也可以是整数
  selector:选择器，通过它指定该控制器管理哪些pod
    matchLabels:labels匹配规则,用于匹配template
      app: nginx-pod
    matchExpressions: Expressions匹配规则
      - {
     key: app,operator: In ,values:[nginx-pod]}
  template: 模板，当副本数量不足时，会根据模板创建pod副本
    metadata:
      labels:
        app: nginx-pod
    spec:
      containers:
        - name: nginx
          image: nginx:1.17.1
          ports:
            - containerPort: 80
```

### 2. 创建Deployment

创建pc-deployment.yaml，内容如下

```java
apiVersion: apps/v1  版本号
kind: Deployment   类型
metadata:  元数据
  name: pc-deployment   rs名称
  namespace: dev  所属命名空间
  labels: 标签
    controller: rs
spec: 详情
  replicas: 3副本数量3
  selector:选择器，通过它指定该控制器管理哪些pod
    matchLabels:labels匹配规则,用于匹配template
      app: nginx-pod
  template: 模板，当副本数量不足时，会根据模板创建pod副本
    metadata:
      labels:
        app: nginx-pod
    spec:
      containers:
        - name: nginx
          image: nginx:1.17.1
```

创建deployment

```java
kubectl create -f pc-deployment.yaml --record=true
```

查看deployment

UP-TO-DATE 最新版本的pod的数量

AVAILABLE 当前可用的pod的数量

名称规则

### 2. 扩缩容

#### 2.1 方法一： 命令方式

将副本数量变成5

```java
kubectl scale deploy pc-deployment --replicas=5 -n dev
```

查看deployment

```java
kubectl get deploy pc-deployment -n dev
```

查看pod

```java
kubectl get pod -n dev
```

#### 2.2 方法二 : 直接编辑rs

编辑deployment的副本数量，修改spec.replicas:3

```java
kubectl edit deploy pc-deployment -n dev
```

查看pod

```java
kubectl get pod -n dev
```

### 3. 升级策略

Deployment支持两种镜像更新的策略: 重建更新和滚动更新(默认)，可以通过strategy选项进行配置。

```java
strategy: 指定新的pod替换旧的Pod的策略，支持两个属性
  type: 指定策略类型，支持两种策略
    Recreate: 在创建出新的Pod之前会先杀死所有已存在的Pod
    RollingUpdate: 滚动更新，就是杀死一部分，就启动一部分，在更新过程中，存在两个版本Pod
  rollingUpdate: 当type为RollingUpdate时生效，用于为RollingUpdate设置参数，支持两个属性
    maxUnavailable: 用来指定在升级过程中不可用Pod的最大数量，默认为25%
    maxSurge: 用来指定在升级过程中可以超过期望的Pod的最大数量，默认为25%
```

#### 3.1 重建更新

> 重建更新是将旧pod全部删除，重建创建新的pod

**1、** 编辑pc-deployment.yaml，在spec节点下添加更新策略；

```java
apiVersion: apps/v1  版本号
kind: Deployment   类型
metadata:  元数据
  name: pc-deployment   rs名称
  namespace: dev  所属命名空间
  labels: 标签
    controller: rs
spec: 详情
  strategy:
    type: Recreate重建更新策略
  replicas: 3副本数量3
  selector:选择器，通过它指定该控制器管理哪些pod
    matchLabels:labels匹配规则,用于匹配template
      app: nginx-pod
  template: 模板，当副本数量不足时，会根据模板创建pod副本
    metadata:
      labels:
        app: nginx-pod
    spec:
      containers:
        - name: nginx
          image: nginx:1.17.1
```

```java
kubectl apply -f pc-deployment.yaml
```

**1、** 创建deploy进行验证；

变更镜像

```java
kubectl set image deployment pc-deployment nginx=nginx:1.17.2 -n dev
```

观察升级过程

```java
kubectl get pod -n dev -w 
```

一次性把所有的pod都停止了，然后重建创建

#### 3.2 滚动更新

**1、** 编辑pc-deployment.yaml文件，在spec下添加更新策略；

```java
apiVersion: apps/v1  版本号
kind: Deployment   类型
metadata:  元数据
  name: pc-deployment   rs名称
  namespace: dev  所属命名空间
  labels: 标签
    controller: rs
spec: 详情
  strategy:
    type: RollingUpdate滚动更新
    rollingUpdate:
      maxUnavailable: 25%
      maxSurge: 25%
  replicas: 3副本数量3
  selector:选择器，通过它指定该控制器管理哪些pod
    matchLabels:labels匹配规则,用于匹配template
      app: nginx-pod
  template: 模板，当副本数量不足时，会根据模板创建pod副本
    metadata:
      labels:
        app: nginx-pod
    spec:
      containers:
        - name: nginx
          image: nginx:1.17.1
```

```java
kubectl apply -f pc-deployment.yaml
```

**1、** 创建deploy进行验证；

变更镜像

```java
kubectl set image deployment pc-deployment nginx=nginx:1.17.3 -n dev
```

观察升级过程

```java
kubectl get pod -n dev -w 
```

可以看到它是按照25%比例进行创建新版本pod，再停止旧版本pod，这样滚动升级

### 4. 版本回退

deployment支持版本升级过程中的暂停、继续功能以及版本回退等诸多功能，下面具体来看

kubectl rollout 版本升级相关功能，支持下面选项

- status 显示当前升级状态
- history 显示升级历史记录
- pause 暂停版本升级过程
- resume 继续已经暂停的版本升级过程
- restart 重启版本升级
- undo 回滚到上一级版本(可以使用–to-revision回滚到指定版本)

**（1）演示版本升级前，我们需要先进行一次升级，查看一下升级过程**。

删除掉之前的pc-deployment，重新create 一个rs

```java
#创建rs
kubectl create -f pc-deployment.yaml --record
#查看deploy,rs,pod内容
kubectl get deploy,rs,pod -n dev
```

进行版本升级前，先打开两个标签窗口，分别查看rs和pod信息

```java
kubectl get pod -n dev -w
kubectl get rs -n dev -w
```

```java
#进行版本升级
kubectl set image deploy pc-deployment nginx=nginx:1.17.2 -n dev
```

升级保留了原来的rs，创建了新的rs，新rs上的pod增加，旧的rs上pod被删除。即使升级完了，旧的rs依然被保留。

**（2）版本回退**

查看当前升级版本的状态

```java
kubectl rollout status deploy pc-deployment -n dev 
```

查看历史升级信息

```java
kubectl rollout history deploy pc-deployment -n dev
```

注意，kubectl create 时需要添加–record ，否则可能显示为空

回退版本

```java
#回退到版本1
kubectl rollout undo deploy pc-deployment --to-revision=1 -n dev
```

可以看到第一个rs上面拥有3个pod，而第三个则没有了。

再次查看历史升级信息，可以看到1版本消失了。

### 5. 金丝雀发布

Deployment 支持更新过程中的空值，如暂停(pause)或继续(resume)更新操作

比如有一批新的Pod资源创建完成后立即暂停更新过程，此时，仅存在一部分新版本的应用，主体部分还是旧的版本。然后，再筛选一小部分的用户请求路由到新的版本的Pod应用，继续观察能否稳定地按期望的方式运行。确定没问题之后再继续完成余下的Pod资源滚动更新，否则立即回滚更新操作。这就是金丝雀发布。

更新deployment 的版本，并配置暂停deployment

```java
kubectl set image deploy pc-deployment nginx=nginx:1.17.4 -n dev && kubectl rollout pause deployment pc-deployment -n dev
```

监控更新的过程，可以看到已经新增了一个资源，但是并未按照预期的状态去删除一个旧的资源，就是因为使用了pause暂停命令

```java
kubectl get rs -n dev -o wide
```

观察更新状态

```java
kubectl rollout status deploy pc-deployment -n dev
```

可以看到有一个pod创建，并且finish，三个副本等待更新。

确保更新的pod没问题之后，继续更新

```java
kubectl rollout resume deploy pc-deployment -n dev
```

稍等一下就更新完成了。

### 6. 终止金丝雀发布

请见：[k8s金丝雀发布终止](/zhuanlan/container/kubernetes/3/16.html?spm=1001.2014.3001.5502)
