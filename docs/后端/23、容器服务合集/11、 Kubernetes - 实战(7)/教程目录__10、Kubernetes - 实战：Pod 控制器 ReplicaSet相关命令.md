# 10、Kubernetes - 实战：Pod 控制器 ReplicaSet相关命令
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/7/10.html
- 分类：容器服务
- 分组：教程目录
## 一、环境安装

参考

[【Kubernetes实战】（四）MiniKube方式部署](/zhuanlan/container/kubernetes/7/3.html)

[【Kubernetes实战】（五）KubeAdm方式部署](/zhuanlan/container/kubernetes/7/4.html)

[【Kubernetes实战】（六）Kind方式部署](/zhuanlan/container/kubernetes/7/5.html)

## 二、ReplicaSet介绍

Replication Set简称RS，随着Kubernetes的高速发展，官方已经推荐我们使用RS和Deployment来代替RC了，实际上RS和RC的功能基本一致，目前唯一的一个区别就是RC只支持基于等式的selector（env=dev或environment!=qa），但RS还支持基于集合的selector（version in (v1.0, v2.0)），这对复杂的运维管理就非常方便了。

查看ReplicaSet官方帮助

```java
kubectl explain ReplicaSet
```

```java
KIND:     ReplicaSet
VERSION:  apps/v1
DESCRIPTION:
     ReplicaSet ensures that a specified number of pod replicas are running at
     any given time.
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
     If the Labels of a ReplicaSet are empty, they are defaulted to be the same
     as the Pod(s) that the ReplicaSet manages. Standard object's metadata. More
     info:
     https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
   spec <Object>
     Spec defines the specification of the desired behavior of the ReplicaSet.
     More info:
     https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#spec-and-status
   status       <Object>
     Status is the most recently observed status of the ReplicaSet. This data
     may be out of date by some window of time. Populated by the system.
     Read-only. More info:
     https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#spec-and-status
```

可以一级一级的查看，想查看什么只需要在后面加上 .字段名 即可。例如查看rs下的spec字段

```java
kubectl explain rs.spec
```

```java
KIND:     ReplicaSet
VERSION:  apps/v1
RESOURCE: spec <Object>
DESCRIPTION:
     Spec defines the specification of the desired behavior of the ReplicaSet.
     More info:
     https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#spec-and-status
     ReplicaSetSpec is the specification of a ReplicaSet.
FIELDS:
   minReadySeconds      <integer>
     Minimum number of seconds for which a newly created pod should be ready
     without any of its container crashing, for it to be considered available.
     Defaults to 0 (pod will be considered available as soon as it is ready)
   replicas     <integer>
     Replicas is the number of desired replicas. This is a pointer to
     distinguish between explicit zero and unspecified. Defaults to 1. More
     info:
     https://kubernetes.io/docs/concepts/workloads/controllers/replicationcontroller/#what-is-a-replicationcontroller
   selector     <Object> -required-
     Selector is a label query over pods that should match the replica count.
     Label keys and values that must match in order to be controlled by this
     replica set. It must match the pod template's labels. More info:
     https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/#label-selectors
   template     <Object>
     Template is the object that describes the pod that will be created if
     insufficient replicas are detected. More info:
     https://kubernetes.io/docs/concepts/workloads/controllers/replicationcontroller#pod-template
```

## 三、ReplicaSet使用

yml文件

vimrs-nginx.yaml

`replicas: 3`：指定运行`3`个实例。

```java
apiVersion: apps/v1
kind: ReplicaSet   
metadata:
  name: pc-replicaset
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

### 1、创建副本集

```java
kubectl create -f rs-nginx.yaml 
```

### 2、查看副本集信息

```java
kubectl get rs -n dev -o wide
```

### 3、查看运行的 Pod

```java
kubectl get pods -n dev -o wide
```

删除一个pod后，查看是否能自动新建一个pod

确实，删除完一个pod后，rs又自动新建一个pod

### 4、扩缩容

#### 4.1 扩容

**1）edit 方式**

使用edit编辑副本集名为pc-replicaset的配置。

该命令进入的编辑页面与Vim用法一致。

```java
kubectl edit rs pc-replicaset -n dev
```

将replicas修改为6

扩容后，查看rs

```java
kubectl get rs -n dev -o wide
```

扩容后，查看pod

```java
kubectl get pods -n dev -o wide
```

**2）scale 方式**

```java
kubectl scale rs pc-replicaset --replicas=6 -n dev
```

#### 4.2 缩容

**1）edit 方式**

使用方式同扩容，这里不再重复演示

**2）scale 方式**

```java
kubectl scale rs pc-replicaset --replicas=2 -n dev
```

将replicas调整为2

缩容后，查看rs

```java
kubectl get rs -n dev -o wide
```

缩容后，查看pod

```java
kubectl get pods -n dev -o wide
```

### 5、镜像升级

备注：也可以使用edit方式

例如将镜像从1.17.1升级到1.17.2

```java
kubectl set image rs pc-replicaset nginx=nginx:1.17.2 -n dev
```

查看实例

### 6、删除 ReplicaSet

#### 6.1 通过名称删除

```java
kubectl delete rs pc-replicaset -n dev
```

#### 6.2 通过yml文件删除

```java
kubectl delete -f pc-replicaset.yml
```
