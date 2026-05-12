# 21、Kubernetes 实战 - 控制器之Deployment
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/1/21.html
- 分类：容器服务
- 分组：教程目录
## 简介

一个Deployment 控制器为 Pods 和 ReplicaSets 提供声明式的更新能力。Deployment 是最常用的用于部署无状态服务的方式。

你负责描述 Deployment 中的 目标状态，而 Deployment 控制器以受控速率更改实际状态， 使其变为期望状态。你可以定义 Deployment 以创建新的 ReplicaSet，或删除现有 Deployment， 并通过新的 Deployment 收养其资源。

## 使用方式

以下是Deployment 的典型用例：

- 定义Deployment 来创建Pod和ReplicaSet
- 滚动升级和回滚应用
- 自动伸缩
- 暂停和继续Deployment

## 创建

```sh
vim nginx-deploy.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  Deployment名称
  name: nginx-deployment
  labels:
    app: nginx
spec:
  Pod 副本数量
  replicas: 3
  定义 Deployment 如何查找要管理的 Pods
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: daocloud.io/library/nginx:1.7.11
        ports:
		- containerPort: 80
# 你可以设置 --record 标志将所执行的命令写入资源注解 kubernetes.io/change-cause 中。 这对于以后的检查是有用的。例如，要查看针对每个 Deployment 修订版本所执行过的命令。
kubectl create  -f nginx-deploy.yaml --record
kubectl get deployments
# 查看 Deployment 上线状态
kubectl rollout status deployment.v1.apps/nginx-deployment
# 会自动创建rs
kubectl get rs
# 查看每个 Pod 自动生成的标签
kubectl get pods --show-labels
```

**deployment字段说明**

- NAME 列出了集群中 Deployment 的名称。
- READY 显示应用程序的可用的 副本 数。显示的模式是“就绪个数/期望个数”。
- UP-TO-DATE 显示为了打到期望状态已经更新的副本数。
- AVAILABLE 显示应用可供用户使用的副本数。
- AGE 显示应用程序运行的时间。

**ReplicaSet 字段说明**：

- NAME 列出名字空间中 ReplicaSet 的名称；
- DESIRED 显示应用的期望副本个数，即在创建 Deployment 时所定义的值。 此为期望状态；
- CURRENT 显示当前运行状态中的副本个数；
- READY 显示应用中有多少副本可以为用户提供服务；
- AGE 显示应用已经运行的时间长度。

注意ReplicaSet 的名称始终被格式化为[Deployment名称]-[随机字符串]。 其中的随机字符串是使用 pod-template-hash 作为种子随机生成的

## 扩容

```sh
kubectl scale deployment nginx-deployment --replicas 5
```

## 自动扩容

```sh
kubectl autoscale deployment nginx-deployment --min=1 --max=5 --cpu-percent=80 
```

## 更新镜像版本

```sh
# 将ngixn更新到1.9.2
kubectl set image deployment/nginx-deployment nginx=daocloud.io/library/nginx:1.9.2
# 
kubectl describe deployment nginx-deployment
```

## 回滚版本

```sh
kubectl rollout undo deployment/nginx-deployment
# 查看回滚状态
kubectl rollout status deployment.v1.apps/nginx-deployment
# 查看历史版本
kubectl rollout history deployment/nginx-deployment
# 指定版本查看修订历史的详细信息
kubectl rollout history deployment/nginx-deployment --revision=4
# 指定版本回滚
kubectl rollout undo deployment/nginx-deployment --to-revision=3
# 暂定更新
kubectl rollout pause  deployment/nginx-deployment
```
