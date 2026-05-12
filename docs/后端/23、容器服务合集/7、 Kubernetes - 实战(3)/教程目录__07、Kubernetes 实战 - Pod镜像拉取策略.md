# 07、Kubernetes 实战 - Pod镜像拉取策略
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/3/7.html
- 分类：容器服务
- 分组：教程目录
## 前言

镜像拉取策略

## 镜像拉取

创建pod-imagepullpolicy.yaml文件

```java
apiVersion: v1
kind: Pod
metadata:
  name: pod-imagepullpolicy
  namespace: dev
  labels:
    user: xiaowang
spec:
  containers:
    - name: nginx
      image: nginx:1.17.1
      imagePullPolicy: Always设置镜像拉取策略
    - name: busybox
      image: busybox:1.30
```

imagePullPolicy， 用于设置镜像拉取策略，kubernetes支持配置三种拉取策略

- Always: 总是从远程仓库拉取镜像
- IfNotPresent: 本地有则用本地镜像，本地没有则从远程仓库拉取镜像
- Never: 只使用本地镜像，从不去远程仓库拉取，本地没有就报错

> 默认值说明
>
> 如果镜像tag为具体版本号，默认策略是IfNotPresent
>
> 如果镜像tag为:lastest（最终版本），默认策略是always
