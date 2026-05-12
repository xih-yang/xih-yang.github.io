# 20、Kubernetes 实战 - 控制器之ReplicaSet
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/1/20.html
- 分类：容器服务
- 分组：教程目录
## 什么是控制器

Pod是Kubernetes中的最小调度单位，但是Pod自身出现故障不能自愈，所以K8S内置了很多控制器，用来控制Pod的具体状态和行为。在使用Pod时，应当通过控制器来创建及管理Pod。

**特性：**

- 水平扩展
- 版本更新
- 故障恢复

**类型：**

- ReplicationController（RC已淘汰）
- ReplicaSet
- Deployment
- StatefulSet
- DaemonSet
- Job
- CronJob
- HPA

## ReplicaSet

**定义**

ReplicaSet的目的是维护在任何给定时间运行的稳定的副本Pod集。如果有Pod异常退出，会自动创建一个新的替代，因此，它通常用于保证指定数量的相同Pod的可用性。（ 官方推荐使用 Deployment 替代 ReplicaSet）

**工作方式**

ReplicaSet的定义中，包含：

- selector： 用于指定哪些 Pod 属于该 ReplicaSet 的管辖范围
- replicas： 副本数，用于指定该 ReplicaSet 应该维持多少个 Pod 副本
- template： Pod模板，在 ReplicaSet 使用 Pod 模板的定义创建新的 Pod

ReplicaSet 控制器将通过创建或删除 Pod，以使得当前 Pod 数量达到 replicas 指定的期望值。ReplicaSet 创建的 Pod 中，都有一个字段 metadata.ownerReferences 用于标识该 Pod 从属于哪一个 ReplicaSet。

ReplicaSet 通过 selector 字段的定义，识别哪些 Pod 应该由其管理。如果 Pod 没有 ownerReference 字段，或者 ownerReference 字段指向的对象不是一个控制器，且该 Pod 匹配了 ReplicaSet 的 selector，则该 Pod 的 ownerReference 将被修改为 该 ReplicaSet 的引用。

## 创建

```sh
# 查看rs模板信息
kubectl explain rs
# 
vim nginx-rs.yaml
# 内容
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: frontend
spec:
  副本数
  replicas: 3
  标签选择器，匹配tier: frontend
  selector:
    matchLabels:
      tier: frontend
  模板，定义怎么创建RS
  template:
    metadata:
      添加标签
      labels:
        tier: frontend
    spec:
      containers:
      - name: nginx
        image: daocloud.io/library/nginx:1.7.11
        ports:
        - name: nginx-port
          containerPort: 80
# 创建并查看，此时有三个pod被创建
kubectl create -f nginx-rs.yaml
kubectl get rs
kubectl describe rs/frontend
kubectl get pods --show-labels
```

## 删除

```sh
# 只删除rs,不删除pod，可以创建新的rs来替代
kubectl delete rs frontend --cascade=false
# rs及pod都会被删除
kubectl delete rs frontend 
```

## Pod隔离

修改Pod 的标签，可以使 Pod 脱离 ReplicaSet 的管理，ReplicaSet 将立刻自动创建一个新的 Pod 以维持其指定的 replicas 副本数。

```sh
# 修改标签 ，然后发现有四个pod
kubectl edit pod frontend-5k6mj
kubectl get pod 
```

## 自动伸缩

**HPA概念**

Horizontal Pod Autoscaling可以根据指标自动伸缩控制器中的Pod数量

```sh
# 将frontend控制器中的POD伸缩为5个副本，此时会创建一个hpa
kubectl autoscale rs frontend --max=5
# 查看hpa 
kubectl get hpa frontend 
```
