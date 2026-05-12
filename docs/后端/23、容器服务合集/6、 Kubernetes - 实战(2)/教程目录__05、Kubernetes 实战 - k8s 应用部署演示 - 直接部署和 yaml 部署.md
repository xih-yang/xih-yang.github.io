# 05、Kubernetes 实战 - k8s 应用部署演示 - 直接部署和 yaml 部署
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/2/5.html
- 分类：容器服务
- 分组：教程目录
## 一，前言

目前，购买了 3 台阿里云服务器，完成了构建服务器（ci-server）和 k8s 集群（k8s-master+k8s-node）的搭建；

服务器规划如下：

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

专栏最终会实现基于 Jenkins 和 k8s 的持续集成；

本篇，通过部署 nginx 和 mysql 介绍 k8s 的两种部署：

- 直接部署 nginx
- yaml 配置文件部署 mysql；

## 二，直接部署 nginx

在k8s-master 服务器创建一个 nginx 部署

### 1，创建部署

使用nginx 镜像创建一个部署，命名为 nginx：

```java
// 创建部署，名字 nginx，使用镜像 nginx
[root@k8s-master ~]# kubectl create deployment nginx --image=nginx
deployment.apps/nginx created
```

### 2，暴露端口

暴露部署 nginx 的端口号 80

```java
// 暴露端口
[root@k8s-master ~]# kubectl expose deployment nginx --port=80 --type=NodePort
service/nginx exposed
```

> 备注：service 用于管理 pod；由于 pod 会发生 ip 漂移，需要通过 service 将请求转发到 pod；

### 3，查看 pod 和 service

```java
// 获取 pod 和 service
[root@k8s-master ~]# kubectl get pod,svc
NAME                         READY   STATUS    RESTARTS   AGE
pod/nginx-6799fc88d8-lkct4   1/1     Running   0          4m34s
NAME                 TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
service/kubernetes   ClusterIP   10.96.0.1       <none>        443/TCP        14h
service/nginx        NodePort    10.107.223.32   <none>        80:32117/TCP   3m49s
```

pod信息:

- 包含 1 个 pod 部署单元，pod 名：nginx-6799fc88d8-lkct4，状态运行中；

service 信息:

- 服务 kubernetes，类型：ClusterIP(集群 IP)；
- 服务 nginx，类型：NodePort(节点端口)，80 映射为 32117，外部通过 Ip+32117 访问 service；

### 4，访问 nginx 集群

通过master_ip + 端口 32117，访问 nginx 集群：

```java
// master_ip + 端口 32117
[root@k8s-master ~]# curl http://172.17.178.105:32117
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
html {
        color-scheme: light dark; }
body {
        width: 35em; margin: 0 auto;
font-family: Tahoma, Verdana, Arial, sans-serif; }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, the nginx web server is successfully installed and
working. Further configuration is required.</p>
<p>For online documentation and support please refer to
<a href="http://nginx.org/">nginx.org</a>.<br/>
Commercial support is available at
<a href="http://nginx.com/">nginx.com</a>.</p>
<p><em>Thank you for using nginx.</em></p>
</body>
</html>
```

经验证，nginx 集群能够被正常访问；

### 5，扩容 nginx 集群

```java
// 扩容 nginx 部署，改变副本数量为 3 个
[root@k8s-master ~]# kubectl scale deployment nginx --replicas=3
deployment.apps/nginx scaled
```

查看扩容后的 pod 信息：

```java
[root@k8s-master ~]# kubectl get pod
NAME                     READY   STATUS    RESTARTS   AGE
nginx-6799fc88d8-2wvl2   1/1     Running   0          45s
nginx-6799fc88d8-lkct4   1/1     Running   0          14m
nginx-6799fc88d8-pktqq   1/1     Running   0          45s
```

三个pod 均处于运行中状态；

备注：外部访问 k8s-master 的 service，由 service 将请求派发到指定 pod；

### 6，查看 pod 详情

```java
// 查看 pod 详情
[root@k8s-master ~]# kubectl describe pod
Name:         nginx-6799fc88d8-2wvl2
Namespace:    default
Priority:     0
Node:         k8s-node/172.17.178.106        // 部署在 k8s-node 节点上
Start Time:   Wed, 22 Dec 2021 14:57:26 +0800
Labels:       app=nginx
              pod-template-hash=6799fc88d8
Annotations:  <none>
Status:       Running
IP:           10.244.1.3
IPs:
  IP:           10.244.1.3
Controlled By:  ReplicaSet/nginx-6799fc88d8
Containers:
  nginx:
    Container ID:   docker://1a7ebaea15d2c56eb3a03efa0ce2d1280f7290c70fbfd44748df2b27ea33c57d
    Image:          nginx
    Image ID:       docker-pullable://nginx@sha256:366e9f1ddebdb844044c2fafd13b75271a9f620819370f8971220c2b330a9254
    Port:           <none>
    Host Port:      <none>
    State:          Running
      Started:      Wed, 22 Dec 2021 14:57:28 +0800
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
  Normal  Scheduled  15m   default-scheduler  Successfully assigned default/nginx-6799fc88d8-2wvl2 to k8s-node
  Normal  Pulling    15m   kubelet            Pulling image "nginx"
  Normal  Pulled     15m   kubelet            Successfully pulled image "nginx" in 1.138769769s
  Normal  Created    15m   kubelet            Created container nginx
  Normal  Started    15m   kubelet            Started container nginx
Name:         nginx-6799fc88d8-lkct4
Namespace:    default
Priority:     0
Node:         k8s-node/172.17.178.106
Start Time:   Wed, 22 Dec 2021 14:43:33 +0800
Labels:       app=nginx
              pod-template-hash=6799fc88d8
Annotations:  <none>
Status:       Running
IP:           10.244.1.2
IPs:
  IP:           10.244.1.2
Controlled By:  ReplicaSet/nginx-6799fc88d8
Containers:
  nginx:
    Container ID:   docker://d70ef223cba8add839720ad639e3d6aa9d57608c181e25b015c0888f5d830040
    Image:          nginx
    Image ID:       docker-pullable://nginx@sha256:366e9f1ddebdb844044c2fafd13b75271a9f620819370f8971220c2b330a9254
    Port:           <none>
    Host Port:      <none>
    State:          Running
      Started:      Wed, 22 Dec 2021 14:43:58 +0800
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
  Normal  Scheduled  29m   default-scheduler  Successfully assigned default/nginx-6799fc88d8-lkct4 to k8s-node
  Normal  Pulling    29m   kubelet            Pulling image "nginx"
  Normal  Pulled     28m   kubelet            Successfully pulled image "nginx" in 23.66268788s
  Normal  Created    28m   kubelet            Created container nginx
  Normal  Started    28m   kubelet            Started container nginx
Name:         nginx-6799fc88d8-pktqq
Namespace:    default
Priority:     0
Node:         k8s-node/172.17.178.106
Start Time:   Wed, 22 Dec 2021 14:57:26 +0800
Labels:       app=nginx
              pod-template-hash=6799fc88d8
Annotations:  <none>
Status:       Running
IP:           10.244.1.4
IPs:
  IP:           10.244.1.4
Controlled By:  ReplicaSet/nginx-6799fc88d8
Containers:
  nginx:
    Container ID:   docker://db3b517dd913eb7dffd1857c1324877646d38fd7d527613c4c22628c22929b1c
    Image:          nginx
    Image ID:       docker-pullable://nginx@sha256:366e9f1ddebdb844044c2fafd13b75271a9f620819370f8971220c2b330a9254
    Port:           <none>
    Host Port:      <none>
    State:          Running
      Started:      Wed, 22 Dec 2021 14:57:44 +0800
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
  Normal  Scheduled  15m   default-scheduler  Successfully assigned default/nginx-6799fc88d8-pktqq to k8s-node
  Normal  Pulling    15m   kubelet            Pulling image "nginx"
  Normal  Pulled     14m   kubelet            Successfully pulled image "nginx" in 16.580801442s
  Normal  Created    14m   kubelet            Created container nginx
  Normal  Started    14m   kubelet            Started container nginx
```

关键信息：由于只有一个 node 节点，3 个 pod 均被部署到 k8s-node 上；

```java
[root@k8s-master ~]# kubectl describe pod
Name:         nginx-6799fc88d8-2wvl2
Node:         k8s-node/172.17.178.106                     // 部署在 k8s-node 上
Name:         nginx-6799fc88d8-lkct4
Node:         k8s-node/172.17.178.106
Name:         nginx-6799fc88d8-pktqq
Node:         k8s-node/172.17.178.106
```

备注：master 默认只负责调度，不会部署 pod；若存在多个 node 节点，会按照策略分配部署任务；

## 二，通过 yaml 部署 mysql

在k8s-master 服务器通过 yaml 配置文件创建 mysql 部署；

### 1，创建配置文件

创建yaml 配置文件 mysql.yaml

```java
vi mysql.yaml
apiVersion: v1                版本
kind: ReplicationController   类型                     
metadata:
  name: mysql                 当前部署的名称                        
spec:
  replicas: 1                 Pod副本的期待数量
  selector:
    app: mysql                符合目标的Pod拥有此标签
  template:                   根据此模板创建Pod的副本（实例）
    metadata:
      labels:
        app: mysql            Pod副本拥有的标签，对应RC的Selector
    spec:
      containers:             Pod内容器的定义部分
      - name: mysql           容器的名称
        image: mysql          启动容器使用的Docker镜像
        ports: 
        - containerPort: 3306 容器应用监听的端口号
        env:                  指定注入容器内的环境变量
        - name: MYSQL_ROOT_PASSWORD 
          value: "123456"
```

yaml 在线格式校验工具：[https://www.bejson.com/validators/yaml_editor/](https://www.bejson.com/validators/yaml_editor/)

### 2，应用配置文件

生效配置文件，创建 pod

```java
// 根据 yaml 配置文件创建 pod
[root@k8s-master ~]# kubectl create -f mysql.yaml 
replicationcontroller/mysql created
```

### 3，查看 pod 信息

```java
[root@k8s-master ~]# kubectl get pods
NAME                     READY   STATUS    RESTARTS   AGE
mysql-g2zst              1/1     Running   0          60s
nginx-6799fc88d8-2wvl2   1/1     Running   0          42m
nginx-6799fc88d8-lkct4   1/1     Running   0          56m
nginx-6799fc88d8-pktqq   1/1     Running   0          42m
```

一个mysql 的 pod：mysql-g2zst 已经启动成功；

### 4，查看 pod 详情

```java
// 查看 pod 详情
[root@k8s-master ~]# kubectl describe pod mysql
Name:         mysql-g2zst
Namespace:    default
Priority:     0
Node:         k8s-node/172.17.178.106
Start Time:   Wed, 22 Dec 2021 15:39:19 +0800
Labels:       app=mysql
Annotations:  <none>
Status:       Running
IP:           10.244.1.5	// mysql 的 ip
IPs:
  IP:           10.244.1.5
Controlled By:  ReplicationController/mysql
Containers:
  mysql:
    Container ID:   docker://ecf31cd101532d3f2fdd299e0000d6502e9c59b41e07ef95ea030fa7476d322f
    Image:          mysql
    Image ID:       docker-pullable://mysql@sha256:e9027fe4d91c0153429607251656806cc784e914937271037f7738bd5b8e7709
    Port:           3306/TCP			// mysql 的 端口
    Host Port:      0/TCP
    State:          Running
      Started:      Wed, 22 Dec 2021 15:39:54 +0800
    Ready:          True
    Restart Count:  0
    Environment:
      MYSQL_ROOT_PASSWORD:  123456
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
  Type    Reason     Age    From               Message
  ----    ------     ----   ----               -------
  Normal  Scheduled  2m18s  default-scheduler  Successfully assigned default/mysql-g2zst to k8s-node
  Normal  Pulling    2m18s  kubelet            Pulling image "mysql"
  Normal  Pulled     104s   kubelet            Successfully pulled image "mysql" in 33.628902276s
  Normal  Created    104s   kubelet            Created container mysql
  Normal  Started    104s   kubelet            Started container mysql
```

mysql 服务启动成功；

## 三，结束

本篇，介绍了 k8s 两种部署方式，直接部署和 yaml 配置文件部署；

启动一个服务共需要两步：1，创建部署；2，启动服务；

下一篇，创建 Deployment 部署实例；
