# 12、Kubernetes - 实战：Kubernetes资源管理Deployment
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/8/12.html
- 分类：容器服务
- 分组：教程目录
## 一、什么是Deployment

- 一个 Deployment 为 Pods 和 ReplicaSets 提供声明式的更新能力。
- 你负责描述 Deployment 中的 目标状态 ，而 Deployment 控制器（Controller） 以受控速率更改实际状态， 使其变为期望状态
- 不要管理 Deployment 所拥有的 ReplicaSet
- 我们部署一个应用一般不直接写Pod，而是部署一个Deployment
- Deploy编写规约 [https://kubernetes.io/zh/docs/concepts/workloads/controllers/deployment/#writing-a-deployment-spec](https://kubernetes.io/zh/docs/concepts/workloads/controllers/deployment/#writing-a-deployment-spec)

## 二、创建Deployment

通过创建Deployment来管理pods从而创建容器。它会同时创建容器、pod、以及Deployment ！

### 2.1 Deployment模板

```java
apiVersion: apps/v1
kind: Deployment
metadata:
  annotations:
    deployment.kubernetes.io/revision: "1"
  creationTimestamp: "2021-11-07T04:45:29Z"
  generation: 1
  labels:
    app: nginx
  name: nginx
  namespace: default
spec:
  progressDeadlineSeconds: 600
  replicas: 2
  revisionHistoryLimit: 10   历史记录保留的个数
  selector:
    matchLabels:
      app: nginx
  strategy:
    rollingUpdate:    滚动更新策略
      maxSurge: 25%
      maxUnavailable: 25%
    type: RollingUpdate
  template:
    metadata:
      creationTimestamp: null
      labels:
        app: nginx
    spec:
      containers:
      - image: nginx:1.15.2
        imagePullPolicy: IfNotPresent
        name: nginx
        resources: {}
        terminationMessagePath: /dev/termination-log
        terminationMessagePolicy: File
      dnsPolicy: ClusterFirst
      restartPolicy: Always
      schedulerName: default-scheduler
      securityContext: {}
      terminationGracePeriodSeconds: 30
```

### 2.2 用yaml文件创建Deployment

```java
vim nginx-deployment.yaml
apiVersion: apps/v1beta2
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 3
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
        image: nginx:1.9
        ports:
        - containerPort: 80
```

### 2.3 文档介绍

```java
# 指定api版本
apiVersion: apps/v1beta2
# 指定需要创建的资源对象
kind: Deployment
# 源数据、可以写name，命名空间，对象标签
metadata:
# 指定创建对象名称
  name: nginx-deployment
# spec 描述pod相关信息
spec:
# pod 副本数，默认1
  replicas: 3
# pod 标签选择器
  selector:
# pod 匹配标签字段
    matchLabels:
# pod 匹配app值为nginx
      app: nginx
# 容器 描述pod具体信息
  template:
# 容器 指定标签
    metadata:
# 容器 匹配标签字段
      labels:
# 容器 匹配值aap值为nginx
        app: nginx
# 容器信描述信息
    spec:
# 指定容器信息
      containers:
# 指定容器名称
      - name: nginx
# 指定镜像名称
        image: nginx:1.10
# 暴露容器端口
        ports:
# 指定暴露容器端口
        - containerPort: 80
```

### 2.4 创建deployment资源

```java
kubectl create -f nginx-deployment.yaml
```

### 2.5查看deployment资源

```java
命令：kubectl get deployment
NAME               DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
nginx-deployment   3         3         3            3           1m
```

### 2.6 查看ReplicaSet资源

```java
命令：kubectl get replicaset
NAME                          DESIRED   CURRENT   READY     AGE
nginx-deployment-845cfc7fb9   3         3         3         4m
```

### 2.7 查看pod资源

```java
命令：kubectl get pods
NAME                                READY     STATUS    RESTARTS   AGE
nginx-deployment-845cfc7fb9-j2xcv   1/1       Running   0          5m
nginx-deployment-845cfc7fb9-jfq5b   1/1       Running   0          5m
nginx-deployment-845cfc7fb9-sbrsp   1/1       Running   0          5m
```

### 2.8 更新deployment资源

```java
1、更行deployment资源
kubectl set image deploy nginx nginx=nginx:1.15.3 --record
2、查看更行deployment资源状态
kubectl rollout status deploy nginx
3、在线编辑deployment配置文件
 kubectl edit deployment nginx
4、修改deployment配置后手动更行
kubectl replace -f xxx.yaml
```

### 2.9 回滚deployment资源

```java
1、查看更新历史
kubectl rollout history deploy nginx
2、回滚到上个版本
kubectl rollout undo deployment nginx
3、查看指定版本的详细信息
kubectl rollout history deploy nginx --revision=2
4、回滚到指定版本
kubectl rollout undo deployment nginx --to-revision=3
```
