# 11、Kubernetes - 实战：Pod 控制器 Deployment相关命令
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/7/11.html
- 分类：容器服务
- 分组：教程目录
## 一、环境安装

参考

[【Kubernetes实战】（四）MiniKube方式部署](/zhuanlan/container/kubernetes/7/3.html)

[【Kubernetes实战】（五）KubeAdm方式部署](/zhuanlan/container/kubernetes/7/4.html)

[【Kubernetes实战】（六）Kind方式部署](/zhuanlan/container/kubernetes/7/5.html)

## 二、Deployment介绍

对于kubernetes来说Pod是资源调度最小单元，kubernetes主要的功能就是管理多个Pod，Pod中可以包含一个或多个容器，而kubernetes是如可管理多个Pod的呢？对，没错，就是通过控制器，比如Deployment和ReplicaSet（rs）。

kubernetes下有多个Deployment，Deployment下管理RepliceSet，通过RepliceSet管理多个Pod，通过Pod管理容器。

它们之间的关系图如下：

查看Deployment官方帮助

```java
kubectl explain deployment
或者 
kubectl explain deploy
```

```java
KIND:     Deployment
VERSION:  apps/v1
DESCRIPTION:
     Deployment enables declarative updates for Pods and ReplicaSets.
FIELDS:
   apiVersion   <string>
     APIVersion defines the versioned schema of this representation of an
     object. Servers should convert recognized schemas to the latest internal
     value, and may reject unrecognized values. More info:
     https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
   kind <string>
     Kind is a string value representing the REST resource this object
     represents. Servers may infer this from the endpoint the client submits
     requests to. Cannot be updated. In CamelCase. More info:
     https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
   metadata     <Object>
     Standard object's metadata. More info:
     https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
   spec <Object>
     Specification of the desired behavior of the Deployment.
   status       <Object>
     Most recently observed status of the Deployment.
```

## 可以一级一级的查看，想查看什么只需要在后面加上 .字段名 即可。例如查看Deployment下的spec字段

```java
kubectl explain deploy.spec
```

```java
KIND:     Deployment
VERSION:  apps/v1
RESOURCE: spec <Object>
DESCRIPTION:
     Specification of the desired behavior of the Deployment.
     DeploymentSpec is the specification of the desired behavior of the
     Deployment.
FIELDS:
   minReadySeconds      <integer>
     Minimum number of seconds for which a newly created pod should be ready
     without any of its container crashing, for it to be considered available.
     Defaults to 0 (pod will be considered available as soon as it is ready)
   paused       <boolean>
     Indicates that the deployment is paused.
   progressDeadlineSeconds      <integer>
     The maximum time in seconds for a deployment to make progress before it is
     considered to be failed. The deployment controller will continue to process
     failed deployments and a condition with a ProgressDeadlineExceeded reason
     will be surfaced in the deployment status. Note that progress will not be
     estimated during the time a deployment is paused. Defaults to 600s.
   replicas     <integer>
     Number of desired pods. This is a pointer to distinguish between explicit
     zero and not specified. Defaults to 1.
   revisionHistoryLimit <integer>
     The number of old ReplicaSets to retain to allow rollback. This is a
     pointer to distinguish between explicit zero and not specified. Defaults to
     10.
   selector     <Object> -required-
     Label selector for pods. Existing ReplicaSets whose pods are selected by
     this will be the ones affected by this deployment. It must match the pod
     template's labels.
   strategy     <Object>
     The deployment strategy to use to replace existing pods with new ones.
   template     <Object> -required-
     Template describes the pods that will be created.
```

## 三、Deployment使用

### 完整配置

```java
apiVersion: apps/v1 版本号
kind: Deployment 类型       
metadata: 元数据
  name: deploy 名称 
  namespace: 所属命名空间 
  labels:标签
    controller: deploy
spec: 详情描述
  replicas: 3 副本数量
  revisionHistoryLimit: 3 保留历史版本
  paused: false 暂停部署，默认是 false
  progressDeadlineSeconds: 600 部署超时时间（s），默认是 600
  strategy: 策略
    type: RollingUpdate 滚动更新策略
    rollingUpdate: 滚动更新
      maxSurge: 30% 最大额外可以存在的副本数，可以为百分比，也可以为整数。默认为25%。
      maxUnavailable: 30% 最大不可用状态的 Pod 的最大值，可以为百分比，也可以为整数。默认为25%。
  selector: 选择器，通过它指定该控制器管理哪些 Pod
    matchLabels:      Labels 匹配规则
      app: nginx-pod
    matchExpressions: Expressions匹配规则
      - {key: app, operator: In, values: [nginx-pod]}
  template: 模板，当副本数量不足时，会根据下面的模板创建 Pod
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

使用示例yml：

pc-deployment.yml

```java
apiVersion: apps/v1
kind: Deployment      
metadata:
  name: pc-deployment
  namespace: dev
spec: 
  replicas: 3
  selector:
    matchLabels:
      app: nginx-pod
  template:
    metadata:
      labels:
        app: nginx-pod
    spec:
      containers:
      - name: nginx
        image: nginx:1.17.1
```

### 1 创建 Deployment

```java
kubectl create -f pc-deployment.yml
```

### 2 查看Deployment状态

```java
kubectl get deploy -n dev -o wide
```

### 3 查看副本信息

```java
kubectl get rs -n dev -o wide
```

### 4 扩缩容

使用方式同rs

参考：

[Pod 控制器 ReplicaSet相关命令](/zhuanlan/container/kubernetes/7/10.html)

**1)edit 方式**

```java
kubectl edit deploy pc-deployment -n dev
```

扩容ReplicaSet到5后

**2)scale 方式**

```java
kubectl scale deploy pc-deployment --replicas=4 -n dev
```

### 5 镜像更新

Deployment支持两种更新策略：重建更新和滚动更新，可以通过strategy指定策略类型。

#### 5.1 重建更新Recreate

```java
apiVersion: apps/v1
kind: Deployment      
metadata:
  name: pc-deployment
  namespace: dev
spec:
  strategy: 策略
    type: Recreate 重建更新
  replicas: 3
  selector:
    matchLabels:
      app: nginx-pod
  template:
    metadata:
      labels:
        app: nginx-pod
    spec:
      containers:
      - name: nginx
        image: nginx:1.17.1
```

#### 5.2 滚动更新RollingUpdate

```java
apiVersion: apps/v1
kind: Deployment      
metadata:
  name: pc-deployment
  namespace: dev
spec:
  strategy: 策略
    type: RollingUpdate 滚动更新策略
    rollingUpdate:
      maxSurge: 25% 
      maxUnavailable: 25%
  replicas: 3
  selector:
    matchLabels:
      app: nginx-pod
  template:
    metadata:
      labels:
        app: nginx-pod
    spec:
      containers:
      - name: nginx
        image: nginx:1.17.1
```

### 6 版本回退

kubectl rollout：版本升级相关功能，支持下面的选项：

status：显示当前升级状态

history：显示升级历史记录

pause：暂停版本升级过程

resume：继续已经暂停的版本升级过程

restart：重启版本升级过程

undo：回滚到上一级版本（可以使用--to-revision回滚到指定版本）

**查看当前升级版本的状态**

```java
kubectl rollout status deploy pc-deployment -n dev
```

**查看升级历史记录**

```java
kubectl rollout history deploy pc-deployment -n dev
```

**版本回滚**

```java
kubectl rollout undo deployment pc-deployment --to-revision=1 -n dev
```

Deployment之所以可是实现版本的回滚，就是通过记录下历史rs来实现的，一旦想回滚到哪个版本，只需要将当前版本Pod数量降为0，然后将回滚版本的Pod提升为目标数量就可以了。

### 7 金丝雀发布(灰度发布)

Deployment控制器支持控制更新过程中的控制，如暂停(pause)或继续(resume)更新操作。

**更新并暂停**

```java
kubectl set image deploy pc-deployment nginx=nginx:1.17.4 -n dev && kubectl rollout pause deployment pc-deployment -n dev
```

#### 观察更新状态

```java
kubectl rollout status deploy pc-deployment -n dev
```

**监控更新的过程**

```java
kubectl get rs -n dev -o wide
```

**继续更新**

```java
kubectl rollout resume deploy pc-deployment -n dev
```

### 8 删除 Deployment

```java
kubectl delete -f pc-deployment.yml
```

## 四、Deployment和ReplicaSet的区别

### 1 ReplicaSet

核心作用在于帮助用户创建指定数量的pod副本，并确保pod副本一直处于满足用户期望的数量，起到多退少补的作用，并且还具有自动扩容缩容等机制

主要由三个部分组成

用户期望的pod副本数：用来定义由这个控制器管控的pod副本有几个

标签选择器：当pod挂掉的时候，replicaset就通过标签选择器，选择指定标签的pod模板，再通过pod模板创建pod。

pod资源模板：定义一个Pod模板，且需要给pod模板设置标签。给标签选择器使用

### 2 Deployment

ReplicaSet并不是我们直接使用的控制器，kubernetes建议我们使用Deployment

Deployment控制器是工作在ReplicaSet之上的，Deployment通过控制ReplicaSet来控制pod，并不是直接控制pod。

Deployment有ReplicaSet的所有功能

Deployment支持自动扩容缩容，滚动更新和回滚等机制，并提供了一个声明式的定义功能，这种声明式定义使得我们将来创建资源时可以基于声明的逻辑来定义，我们那些所有定义的资源可以随时重新进行声明，随时改变我们在apiserver上的定义的目标期望状态，只要那些资源支持动态运行时修改，都能修改是帮我们管理无状态的应用的最好的控制器。
