# 10、Kubernetes 实战 - 滚动发布的介绍与实现
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/2/10.html
- 分类：容器服务
- 分组：教程目录
## 一，前言

上一篇，介绍了灰度发布和流量切分的集中方式，以及如何实现 k8s 的灰度发布；

本篇，介绍滚动发布的实现；

## 二，滚动发布简介

### 滚动发布

- 滚动发布，则是我们一般所说的无宕机发布。其发布方式如同名称一样，一次取出一台/多台服务器（看策略配置）进行新版本更新。当取出的服务器新版确保无问题后，接着采用同等方式更新后面的服务器
- k8s创建副本应用程序的最佳方法就是部署(Deployment)，部署自动创建副本集(ReplicaSet)，副本集可以精确地控制每次替换的Pod数量，从而可以很好的实现滚动更新
- k8s每次使用一个新的副本控制器(replication controller)来替换已存在的副本控制器，从而始终使用一个新的Pod模板来替换旧的pod模板
- 创建一个新的 replication controller；
- 增加或减少 pod 副本数量，直到满足当前批次期望的数量；
- 删除掉旧的 replication controller；

### 发布流程和策略

- 优点
- 不需要停机更新，无感知平滑更新；
- 版本更新成本小,不需要新旧版本共存；
- 缺点
- 更新时间长：每次只更新一个/多个镜像，需要频繁连续等待服务启动缓冲
- 旧版本环境无法得到备份：始终只有一个环境存在
- 回滚版本异常：如果滚动发布到一半出了问题，回滚时需要使用同样的滚动策略回滚旧版本

## 三、环境初始化

由于k8s-node 资源问题，先清理一下 k8s-node 上的资源占用；

### 查看资源情况

```java
[root@k8s-master deployment]# kubectl get deploy
NAME      READY   UP-TO-DATE   AVAILABLE   AGE
nginx     0/3     3            0           2d1h
pay-v1    0/3     3            0           6h52m
user-v1   0/3     3            0           8m11s
user-v2   0/3     3            0           5h11m
[root@k8s-master deployment]# kubectl get service
NAME              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)        AGE
kubernetes        ClusterIP   10.96.0.1        <none>        443/TCP        2d16h
nginx             NodePort    10.107.223.32    <none>        80:32117/TCP   2d1h
service-pay-v1    NodePort    10.106.98.218    <none>        80:30872/TCP   6h32m
service-user-v1   NodePort    10.104.13.40     <none>        80:31071/TCP   28h
service-user-v2   NodePort    10.100.196.142   <none>        80:30289/TCP   5h12m
[root@k8s-master deployment]# kubectl get pods
NAME                       READY   STATUS             RESTARTS   AGE
mysql-g2zst                0/1     CrashLoopBackOff   53         2d
nginx-6799fc88d8-2wvl2     1/1     Running            1          2d1h
nginx-6799fc88d8-lkct4     1/1     Running            1          2d1h
nginx-6799fc88d8-pktqq     1/1     Running            1          2d1h
pay-v1-655587b6f5-lpft2    1/1     Running            1          6h41m
pay-v1-655587b6f5-pcnrp    1/1     Running            2          6h42m
pay-v1-655587b6f5-spj85    1/1     Running            1          6h41m
user-v1-5895c69847-8tkm9   0/1     Pending            0          9m18s
user-v1-5895c69847-swp52   0/1     Pending            0          9m18s
user-v1-5895c69847-xr4r8   0/1     Pending            0          9m18s
user-v2-fc9d84585-2zztd    1/1     Running            2          5h13m
user-v2-fc9d84585-ss2ss    1/1     Running            1          5h13m
user-v2-fc9d84585-xrvnf    1/1     Running            1          5h13m
```

### 删除无用 pod

> 注意：想要删除 pod，需要删除掉 deployment，否则副本依然还在；

以nginx 为例：目前的有 3 个正在运行的 nginx 副本

```java
[root@k8s-master deployment]# kubectl get pods
NAME                       READY   STATUS    RESTARTS   AGE
mysql-4nq2q                0/1     Pending   0          4m19s
nginx-6799fc88d8-2wvl2     1/1     Running   1          2d1h
nginx-6799fc88d8-lkct4     1/1     Running   1          2d2h
nginx-6799fc88d8-pktqq     1/1     Running   1          2d1h
pay-v1-655587b6f5-lpft2    1/1     Running   1          6h53m
pay-v1-655587b6f5-pcnrp    1/1     Running   2          6h53m
pay-v1-655587b6f5-spj85    1/1     Running   1          6h53m
user-v1-5895c69847-8tkm9   0/1     Pending   0          20m
user-v1-5895c69847-swp52   0/1     Pending   0          20m
user-v1-5895c69847-xr4r8   0/1     Pending   0          20m
user-v2-fc9d84585-2zztd    1/1     Running   2          5h24m
user-v2-fc9d84585-ss2ss    1/1     Running   1          5h24m
user-v2-fc9d84585-xrvnf    1/1     Running   1          5h24m
[root@k8s-master deployment]# kubectl get deploy
NAME      READY   UP-TO-DATE   AVAILABLE   AGE
nginx     0/3     3            0           2d2h
pay-v1    0/3     3            0           7h8m
user-v1   0/3     3            0           23m
user-v2   0/3     3            0           5h27m
```

删除nginx 的 deploy 后，pod 状态变为 Terminating

```java
[root@k8s-master deployment]# kubectl delete deployment nginx
deployment.apps "nginx" deleted
[root@k8s-master deployment]# kubectl get pods
NAME                       READY   STATUS        RESTARTS   AGE
mysql-4nq2q                0/1     Pending       0          9m50s
nginx-6799fc88d8-2wvl2     1/1     Terminating   1          2d1h
nginx-6799fc88d8-lkct4     1/1     Terminating   1          2d2h
nginx-6799fc88d8-pktqq     1/1     Terminating   1          2d1h
pay-v1-655587b6f5-lpft2    1/1     Terminating   1          6h58m
pay-v1-655587b6f5-pcnrp    1/1     Terminating   2          6h59m
pay-v1-655587b6f5-spj85    1/1     Terminating   1          6h58m
user-v1-5895c69847-8tkm9   0/1     Pending       0          26m
user-v1-5895c69847-swp52   0/1     Pending       0          26m
user-v1-5895c69847-xr4r8   0/1     Pending       0          26m
user-v2-fc9d84585-2zztd    1/1     Terminating   2          5h30m
user-v2-fc9d84585-ss2ss    1/1     Terminating   1          5h30m
user-v2-fc9d84585-xrvnf    1/1     Terminating   1          5h30m
```

继续再删除 pod

```java
[root@k8s-master deployment]# kubectl delete pod nginx-6799fc88d8-2wvl2 --force
warning: Immediate deletion does not wait for confirmation that the running resource has been terminated. The resource may continue to run on the cluster indefinitely.
pod "nginx-6799fc88d8-2wvl2" force deleted
[root@k8s-master deployment]# kubectl get pods
NAME                       READY   STATUS        RESTARTS   AGE
mysql-4nq2q                0/1     Pending       0          14m
nginx-6799fc88d8-lkct4     1/1     Terminating   1          2d2h
nginx-6799fc88d8-pktqq     1/1     Terminating   1          2d1h
pay-v1-655587b6f5-lpft2    1/1     Terminating   1          7h3m
pay-v1-655587b6f5-pcnrp    1/1     Terminating   2          7h3m
pay-v1-655587b6f5-spj85    1/1     Terminating   1          7h3m
user-v1-5895c69847-8tkm9   0/1     Pending       0          30m
user-v1-5895c69847-swp52   0/1     Pending       0          30m
user-v1-5895c69847-xr4r8   0/1     Pending       0          30m
user-v2-fc9d84585-2zztd    1/1     Terminating   2          5h34m
user-v2-fc9d84585-ss2ss    1/1     Terminating   1          5h34m
user-v2-fc9d84585-xrvnf    1/1     Terminating   1          5h34m
```

重复操作，删除全部无用 pod

这个mysql 删除不掉

```java
[root@k8s-master deployment]# kubectl get deploy
NAME      READY   UP-TO-DATE   AVAILABLE   AGE
user-v1   0/3     3            0           33m
[root@k8s-master deployment]# kubectl get pods
NAME                       READY   STATUS    RESTARTS   AGE
mysql-xqsgz                0/1     Pending   0          13s
user-v1-5895c69847-8tkm9   0/1     Pending   0          35m
user-v1-5895c69847-swp52   0/1     Pending   0          35m
user-v1-5895c69847-xr4r8   0/1     Pending   0          35m
```

### 删除 Service

```java
kubectl delete service service-pay-v1 service-user-v2 nginx
[root@k8s-master deployment]# kubectl get svc
NAME              TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)        AGE
kubernetes        ClusterIP   10.96.0.1      <none>        443/TCP        2d16h
service-user-v1   NodePort    10.104.13.40   <none>        80:31071/TCP   28h
```

重启阿里云服务

```java
[root@k8s-master deployment]# kubectl get nodes
NAME         STATUS   ROLES                  AGE     VERSION
k8s-master   Ready    control-plane,master   2d16h   v1.20.4
k8s-node     Ready    <none>                 2d16h   v1.20.4
[root@k8s-master deployment]# kubectl get pods
NAME                       READY   STATUS    RESTARTS   AGE
user-v1-5895c69847-8zs9n   1/1     Running   0          20m
user-v1-5895c69847-tdkhj   1/1     Running   0          20m
user-v1-5895c69847-xcdwl   1/1     Running   0          20m
```

测试连接

```java
[root@k8s-master deployment]# curl http://172.17.178.106:31071
user-v1
[root@k8s-master deployment]# curl http://172.17.178.105:31071
user-v1
```

## 四，实现滚动更新

重新做一下，用 user-v1 测试滚动更新

目前基于 deployment-user-v1.yaml 创建了 deployment 部署实例；

基于user-service-v1.yaml 创建了 service，并创建了 3 个 pod 副本

### 修改 deployment 配置，实现滚动更新

将v1 升级成 v3，原始 deployment-user-v1.yaml：

```java
[root@k8s-master deployment]# cat deployment-user-v1.yaml 
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
        image: nginx:user-v1镜像
        ports:
        - containerPort: 80容器内映射的端口
```

修改deployment-user-v1.yaml

```java
apiVersion: apps/v1 API 配置版本
kind: Deployment    资源类型
metadata:
  name: user-v1    资源名称
spec:
+ minReadySeconds: 1
+ strategy:
+   type: RollingUpdate
+   rollingUpdate:
+     maxSurge: 1
+     maxUnavailable: 0
+ selector:
+   matchLabels:
+     app: user-v1告诉deployment根据规则匹配相应的Pod进行控制和管理，matchLabels字段匹配Pod的label值
  replicas: 10声明一个 Pod,副本的数量
  template:
    metadata:
      labels:
        app: user-v1Pod的名称
    spec:  组内创建的 Pod 信息
      containers:
      - name: nginx容器的名称
+       image: nginx:user-v3使用哪个镜像
        ports:
        - containerPort: 80容器内映射的端口
```

### 相关参数介绍

参数
含义
备注

minReadySeconds
容器接受流量延缓时间：单位为秒，默认为0。如果没有设置的话，k8s会认为容器启动成功后就可以用了。设置该值可以延缓容器流量切分
容器启动好了，并不代表服务启动好了，比如还要去连接数据库，初始化缓存等服务初始化工作

strategy.type = RollingUpdate
ReplicaSet 发布类型，声明为滚动发布，默认也为滚动发布

strategy.rollingUpdate.maxSurge
最多Pod数量：为数字类型/百分比。如果 maxSurge 设置为1，replicas 设置为10，则在发布过程中pod数量最多为10 + 1个（多出来的为旧版本pod，平滑期不可用状态）。maxUnavailable 为 0 时，该值也不能设置为0

strategy.rollingUpdate.maxUnavailable
升级中最多不可用pod的数量：为数字类型/百分比。当 maxSurge 为 0 时，该值也不能设置为0

扩容数量，是不包括激增量的

pod最大数量 = 容量 + 激增数

### 应用配置

```java
[root@k8s-master deployment]# kubectl apply -f deployment-user-v1.yaml 
deployment.apps/user-v1 configured
```

### 分析更新过程

```java
// 更新前
[root@k8s-master deployment]# kubectl get pods
NAME                       READY   STATUS    RESTARTS   AGE
user-v1-5895c69847-9mdm8   1/1     Running   0          2m49s
user-v1-5895c69847-wjzfh   1/1     Running   0          2m51s
user-v1-5895c69847-x8n7z   1/1     Running   0          2m54s
// 开始更新
[root@k8s-master deployment]# kubectl apply -f deployment-user-v1.yaml 
deployment.apps/user-v1 configured
// 更新中
[root@k8s-master deployment]# kubectl get pods
NAME                       READY   STATUS              RESTARTS   AGE
user-v1-5895c69847-9mdm8   1/1     Terminating         0          3m27s
user-v1-5895c69847-wjzfh   1/1     Running             0          3m29s
user-v1-5895c69847-x8n7z   1/1     Running             0          3m32s
user-v1-8cc9f4fb5-52hmd    0/1     ContainerCreating   0          0s
user-v1-8cc9f4fb5-zqj2l    1/1     Running             0          3s
// 更新完成
[root@k8s-master deployment]# kubectl get pods
NAME                      READY   STATUS    RESTARTS   AGE
user-v1-8cc9f4fb5-52hmd   1/1     Running   0          48s
user-v1-8cc9f4fb5-6l7mz   1/1     Running   0          46s
user-v1-8cc9f4fb5-zqj2l   1/1     Running   0          51s
```

验证使用镜像是否变更：

```java
[root@k8s-master deployment]# kubectl describe pod user-v1-8cc9f4fb5-zqj2l
Name:         user-v1-8cc9f4fb5-zqj2l
Namespace:    default
Priority:     0
Node:         k8s-node/172.17.178.106
Start Time:   Fri, 24 Dec 2021 18:30:57 +0800
Labels:       app=user-v1
              pod-template-hash=8cc9f4fb5
Annotations:  <none>
Status:       Running
IP:           10.244.1.67
IPs:
  IP:           10.244.1.67
Controlled By:  ReplicaSet/user-v1-8cc9f4fb5
Containers:
  nginx:
    Container ID:   docker://436d2058c9a6a85000b2c32a3a87c1b7c892427894db1c7d851adb953ba01e88
    Image:          nginx:user-v3
    Image ID:       nginx@sha256:c3826e7a5cd2abc9f0e92fe02fe4897ab4346539438ce4f6c811371677f7494b
    Port:           80/TCP
    Host Port:      0/TCP
    State:          Running
      Started:      Fri, 24 Dec 2021 18:30:58 +0800
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
  Type    Reason     Age   From               Message
  ----    ------     ----  ----               -------
  Normal  Scheduled  7m8s  default-scheduler  Successfully assigned default/user-v1-8cc9f4fb5-zqj2l to k8s-node
  Normal  Pulled     7m8s  kubelet            Container image "nginx:user-v3" already present on machine
  Normal  Created    7m8s  kubelet            Created container nginx
  Normal  Started    7m8s  kubelet            Started container nginx
```

是nginx:user-v3，说明应用已更新成功；

### 访问 service-user-v1

```java
curl http://172.17.178.105:31071
curl http://172.17.178.106:31071
[root@k8s-master deployment]# curl http://172.17.178.105:31071
user-v3
[root@k8s-master deployment]# curl http://172.17.178.106:31071
user-v3
```

## 五，结尾

下一篇，服务的可用性探针；
