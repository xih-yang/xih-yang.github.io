# 18、Kubernetes 实战 - Pod控制器DaemonSet(DS)
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/3/18.html
- 分类：容器服务
- 分组：教程目录
## DaemonSet(DS)

DaemonSet类型的控制器可以保证集群中的每一台(或指定)节点都运行一个副本，一般适用于日志收集、节点监控等常见。也就是说，如果一个pod提供的功能是节点级别的(每个节点都需要且只需要一个)，那么这类Pod就适合使用DaemonSet类型的控制器创建。

DaemonSet控制器的特点

- 每当向集群中添加一个节点，指定的pod副本也将添加到该节点上
- 当节点从集群中移除时，pod也被垃圾回收了

下面先来看一下DaemonSet的资源清单文件

```java
apiVersion: apps/v1 版本号
kind: DaemonSet  类型
metadata:   元数据
  name: pc-daemonset rs名称
  namespace: dev 命名空间
  labels: 标签
    controller: daemonset
spec: 详情
  revisionHistoryLimit: 3 保留历史版本
  updateStrategy:  更新策略
    type: RollingUpdate  滚动更新策略
    rollingUpdate:  滚动更新
      maxUnavaiable: 1  最大不可用状态的Pod的最大值，可以为百分比，也可以为整数
  selector: 选择器，通过它指定该控制器管理哪些pod
    matchLabels: Labels匹配规则
      app: nginx-pod
    matchExpresssions: Expressions匹配规则
      - {
     key: app, operator: In, values:[nginx-pod]}
  template:  模板,当副本数量不足时，会格局下面的模板创建pod副本
    metadata:
      labels:
        app: nginx-pod
    spec:
      containers:
        - image: nginx:1.17.1
          name: nginx
          ports:
            - containerPort: 80
```

对资源清单的主体部分的解释

创建pc-daemonset.yaml

```java
apiVersion: apps/v1 版本好
kind: DaemonSet  类型
metadata:   元数据
  name: pc-daemonset rs名称
  namespace: dev 命名空间
spec: 详情
  selector: 选择器，通过它指定该控制器管理哪些pod
    matchLabels: Labels匹配规则
      app: nginx-pod
  template:  模板,当副本数量不足时，会格局下面的模板创建pod副本
    metadata:
      labels:
        app: nginx-pod
    spec:
      containers:
        - image: nginx:1.17.1
          name: nginx
```

创建daemonset

```java
kubectl create -f pc-daemonset.yaml
```

```java
#查看ds详情，可以看到ds启动了两个pod
kubectl get ds pc-daemonset -n dev
#查看pod详情，可以看到node1和node2各启动了一个pod
kubectl get pod -n dev -o wide
```

可以发现node1和node2都生成了pod。

## 暂停调度和驱逐

node1和node2节点，事先对node2节点执行暂停调度，但是DS依然可以将pod部署到node2上面，DS可以无视cordon的暂停调度。同时执行drain驱逐pod，DS部署的pod依然可以无视驱逐，依然running在node2上面。
