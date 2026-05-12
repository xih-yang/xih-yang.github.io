# 06、Kubernetes 实战 - Deployment 部署对象
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/2/6.html
- 分类：容器服务
- 分组：教程目录
## 一，前言

上一篇，介绍了 k8s 的两种部署：直接部署和 yaml 配置文件部署；

本篇，介绍 Deployment 部署对象；

专栏最终会实现基于 Jenkins 和 k8s 的持续集成，三 台服务器如下：

服务
配置
内网IP
外网IP
说明

ci-server
2c4g
172.17.178.104
182.92.4.158
Jenkins + Nexus + Docker

k8s-master
2c4g
172.17.178.105
47.93.9.45
Kubernetes + Docker

k8s-node
2c1g
172.17.178.106
39.105.58.35
Kubernetes + Docker

## 二，Deployment 部署对象

### 1，Deployment 简介

deployment 部署，一个部署可以管理多个 Pod；

使用deployment 部署对象，能够实现多个 Pod 实例的批量启动和管理；

### 2，创建 Deployment 配置文件

1，创建 Deployment 配置文件：deployment-user-v1.yaml

```java
// 创建目录
mkdir deployment && cd deployment
// 创建 deployment 配置文件
vim deployment-user-v1.yaml
apiVersion: apps/v1 API版本号
kind: Deployment    资源类型部署
metadata:
  name: user-v1     资源名称
spec:
  selector:
    matchLabels:
      app: user-v1  告诉deployment根据规则匹配相应的Pod进行控制和管理，matchLabels字段匹配Pod的label值
  replicas: 3       声明Pod副本的数量
  template:
    metadata:
      labels:
        app: user-v1Pod名称
    spec:           描述Pod内的容器信息
      containers:
      - name: nginx 容器的名称
        image:      镜像
        ports:
        - containerPort: 80容器内映射的端口
```

生效配置文件后，将会创建一个 Deployment 实例，部署 3 个 user-v1 的 Pod副本：

Deployment 实例会判断是否满足 3 个标签为 user-v1 的 Pod 副本启动；

### 3，应用配置文件

生效配置文件，创建部署实例，部署 pod

```java
// 生效配置：创建部署实例
[root@k8s-master deployment]# kubectl apply -f deployment-user-v1.yaml
deployment.apps/user-v1 created
```

### 4，查看 deploy 部署对象信息

```java
// 查看部署对象 0/3
[root@k8s-master deployment]# kubectl get deploy user-v1
NAME      READY   UP-TO-DATE   AVAILABLE   AGE
user-v1   0/3     3            0           118s
// 稍等一会再查看 3/3
[root@k8s-master deployment]# kubectl get deploy user-v1
NAME      READY   UP-TO-DATE   AVAILABLE   AGE
user-v1   3/3     3            3           10m
```

### 5，查看 pod 列表

```java
// 获取 pod
[root@k8s-master deployment]# kubectl get pod
NAME                       READY   STATUS              RESTARTS   AGE
mysql-g2zst                1/1     Running             0          5h35m
nginx-6799fc88d8-2wvl2     1/1     Running             0          6h17m
nginx-6799fc88d8-lkct4     1/1     Running             0          6h31m
nginx-6799fc88d8-pktqq     1/1     Running             0          6h17m
user-v1-5895c69847-649g5   0/1     ContainerCreating   0          4m9s
user-v1-5895c69847-chrjk   0/1     ContainerCreating   0          4m9s
user-v1-5895c69847-qnwg2   0/1     ContainerCreating   0          4m9s
// 稍等一会再查看
[root@k8s-master deployment]# kubectl get pod
NAME                       READY   STATUS    RESTARTS   AGE
mysql-g2zst                1/1     Running   1          5h42m
nginx-6799fc88d8-2wvl2     1/1     Running   0          6h24m
nginx-6799fc88d8-lkct4     1/1     Running   0          6h37m
nginx-6799fc88d8-pktqq     1/1     Running   0          6h24m
user-v1-5895c69847-649g5   1/1     Running   0          10m
user-v1-5895c69847-chrjk   1/1     Running   0          10m
user-v1-5895c69847-qnwg2   1/1     Running   0          10m
```

查看Pod 部署完毕后的运行状态，当状态为 Running 时，表示 Pod 运行正常：

属性
描述

NAME
Pod 名称；

READY
容器状态，格式：可用容器/所有容器数量；

STATUS
Pod 的运行状态

RESTARTS
重启次数

AGE
Pod 运行时间

### 6，查看指定 pod 详情

通过`kubectl describe pod PodName`查看指定 pod 详情

```java
// 查看 pod 详情：user-v1-5895c69847-649g5
[root@k8s-master deployment]# kubectl describe pod user-v1-5895c69847-649g5
Name:         user-v1-5895c69847-649g5
Namespace:    default
Priority:     0
Node:         k8s-node/172.17.178.106
Start Time:   Wed, 22 Dec 2021 21:10:51 +0800
Labels:       app=user-v1
              pod-template-hash=5895c69847
Annotations:  <none>
Status:       Running
IP:           10.244.1.8
IPs:
  IP:           10.244.1.8
Controlled By:  ReplicaSet/user-v1-5895c69847
Containers:
  nginx:
    Container ID:   docker://f278b88938ebb0fd6e0df479898a222bf216b635ef0a14538623d053ba06a17e
    Image:          registry.cn-beijing.aliyuncs.com/zhangrenyang/nginx:user-v1
    Image ID:       docker-pullable://registry.cn-beijing.aliyuncs.com/zhangrenyang/nginx@sha256:dd0c6742222f512af96fb53b8e398c098cc8fbbd466582ccbdb8c79eab304e94
    Port:           80/TCP
    Host Port:      0/TCP
    State:          Running
      Started:      Wed, 22 Dec 2021 21:20:23 +0800
    Ready:          True
    Restart Count:  0
    Environment:    <none>
    Mounts:
      /var/run/secrets/kubernetes.io/serviceaccount from default-token-q4qxd (ro)
Conditions:
  Type              Status
  Initialized       True 
  Ready             True 
  ContainersReady   True 
  PodScheduled      True 
Volumes:
  default-token-q4qxd:
    Type:        Secret (a volume populated by a Secret)
    SecretName:  default-token-q4qxd
    Optional:    false
QoS Class:       BestEffort
Node-Selectors:  <none>
Tolerations:     node.kubernetes.io/not-ready:NoExecute op=Exists for 300s
                 node.kubernetes.io/unreachable:NoExecute op=Exists for 300s
Events:
  Type     Reason                  Age    From               Message
  ----     ------                  ----   ----               -------
  Normal   Scheduled               16m    default-scheduler  Successfully assigned default/user-v1-5895c69847-649g5 to k8s-node
  Warning  FailedCreatePodSandBox  7m35s  kubelet            Failed to create pod sandbox: rpc error: code = DeadlineExceeded desc = context deadline exceeded
  Normal   SandboxChanged          7m28s  kubelet            Pod sandbox changed, it will be killed and re-created.
  Normal   Pulling                 7m27s  kubelet            Pulling image "registry.cn-beijing.aliyuncs.com/zhangrenyang/nginx:user-v1"
  Normal   Pulled                  6m40s  kubelet            Successfully pulled image "registry.cn-beijing.aliyuncs.com/zhangrenyang/nginx:user-v1" in 47.305915875s
  Normal   Created                 6m39s  kubelet            Created container nginx
  Normal   Started                 6m38s  kubelet            Started container nginx
```

## 三，结尾

本篇，通过 Deployment 部署对象完成了 pod 部署；

下一篇，介绍 Service；

备注：目前不足的地方太多，还需要找时间再梳理；先堆上再说；
