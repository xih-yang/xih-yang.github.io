# 12、Kubernetes - 实战：Pod 控制器 DaemonSet相关命令
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/7/12.html
- 分类：容器服务
- 分组：教程目录
## 一、环境安装

参考

[MiniKube方式部署](/zhuanlan/container/kubernetes/7/3.html)

[KubeAdm方式部署](/zhuanlan/container/kubernetes/7/4.html)

[Kind方式部署](/zhuanlan/container/kubernetes/7/5.html)

## 二、DaemonSet介绍

Deployment 部署的副本 Pod 会分布在各个 Node 上，每个 Node 都可能运行好几个副本。DaemonSet 的不同之处在于：每个 Node 上最多只能运行一个副本。

一般适用于日志收集、节点监控等场景。

如果一个`Pod`提供的功能是节点级别的（每个节点都需要且只需要一个），那么这类`Pod`就适合使用`DaemonSet`类型的控制器创建。

特点：

- 每当向集群中添加一个节点时，指定的Pod也将添加到该节点上
- 当节点从集群中移除时，Pod也就被回收了

1)daemonset 是众多控制器中的一种（其他还有deployment等等），它的作用是保证在每个节点只部署一个Pod，而且是只在pod 模板中定义的标签的节点上保证运行一个pod。

2)如果节点下线， DaemonSet不会在其他地方重新创建pod。 但是，当将 一个新节点添加到集群中时， DaemonSet会立刻部署一个新的pod实例 。

3)与daemonset 相比副本控制器（rc或rs）是保证集群有固定数量的pod ,而不一定是均匀的每个节点一个这样分布。

4)删除了 pod那么它也会重新个新的pod 。与ReplicaSet一样，DaemonSet 从配 pod 模板创建pod。

查看DaemonSet官方帮助

```java
kubectl explain  daemonset
```

```java
KIND:     DaemonSet
VERSION:  apps/v1
DESCRIPTION:
     DaemonSet represents the configuration of a daemon set.
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
     The desired behavior of this daemon set. More info:
     https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#spec-and-status
   status       <Object>
     The current status of this daemon set. This data may be out of date by some
     window of time. Populated by the system. Read-only. More info:
     https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#spec-and-status
```

可以一级一级的查看，想查看什么只需要在后面加上 .字段名 即可。

```java
kubectl explain  daemonset.spec.template
```

```java
KIND:     DaemonSet
VERSION:  apps/v1
RESOURCE: template <Object>
DESCRIPTION:
     An object that describes the pod that will be created. The DaemonSet will
     create exactly one copy of this pod on every node that matches the
     template's node selector (or on every node if no node selector is
     specified). More info:
     https://kubernetes.io/docs/concepts/workloads/controllers/replicationcontroller#pod-template
     PodTemplateSpec describes the data a pod should have when created from a
     template
FIELDS:
   metadata     <Object>
     Standard object's metadata. More info:
     https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
   spec <Object>
     Specification of the desired behavior of the pod. More info:
     https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#spec-and-status
```

## 三、DaemonSet使用

**完整配置**

```java
apiVersion: apps/v1 版本号
kind: DaemonSet 类型       
metadata: 元数据
  name: ds 名称 
  namespace: 所属命名空间 
  labels:标签
    controller: daemonset
spec: 详情描述
  revisionHistoryLimit: 3 保留历史版本
  updateStrategy: 更新策略
    type: RollingUpdate 滚动更新策略
    rollingUpdate: 滚动更新
      maxUnavailable: 1 最大不可用状态的 Pod 的最大值，可以为百分比，也可以为整数
  selector: 选择器，通过它指定该控制器管理哪些 Pod
    matchLabels:      Labels 匹配规则
      app: nginx-pod
    matchExpressions: Expressions 匹配规则
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

### 示例 yml

pc-daemonset.yml

```java
apiVersion: apps/v1
kind: DaemonSet      
metadata:
  name: pc-daemonset
  namespace: dev
spec: 
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

### 1 创建DaemonSet

```java
kubectl create -f pc-daemonset.yml
```

### 2 查看 DaemonSet

```java
kubectl get ds -n dev -o wide
```

### 3 查看 Pod

```java
kubectl get pods -n dev -o wide
```

### 4 删除 DaemonSet

```java
kubectl delete -f pc-daemonset.yml
```
