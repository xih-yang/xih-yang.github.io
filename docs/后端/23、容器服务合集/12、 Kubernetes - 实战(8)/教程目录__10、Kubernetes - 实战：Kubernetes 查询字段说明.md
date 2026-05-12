# 10、Kubernetes - 实战：Kubernetes 查询字段说明
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/8/10.html
- 分类：容器服务
- 分组：教程目录
## 一、Kubernetes查询字段说明

### 1.1 打印受支持的API版本

```java
# kubectl api-versions
# 扩展
apiextensions.k8s.io/v1beta1
# 注册
apiregistration.k8s.io/v1beta1
# 创建app
apps/v1beta1
apps/v1beta2
# 认证
authentication.k8s.io/v1
authentication.k8s.io/v1beta1
# 授权
authorization.k8s.io/v1
authorization.k8s.io/v1beta1
# 弹性伸缩
autoscaling/v1
autoscaling/v2beta1
# 批量
batch/v1
batch/v1beta1
certificates.k8s.io/v1beta1
# 证书
extensions/v1beta1
# 网络
networking.k8s.io/v1
# 策略
policy/v1beta1
# 控制
rbac.authorization.k8s.io/v1
rbac.authorization.k8s.io/v1beta1
# 存储
storage.k8s.io/v1
storage.k8s.io/v1beta1
v1
```

### 1.2 查看service详细信息

```java
# kubectl describe service资源名
# 服务名称
Name:              nginx
# 命名空间
Namespace:         default
# 标签
Labels:            run=nginx
Annotations:       <none>
# 标签
Selector:          run=nginx
# 网络代理类型
Type:              ClusterIP
# 集群唯一IP
IP:                10.10.10.17
# Service端口
Port:              <unset>  88/TCP
# 容器端口
TargetPort:        80/TCP
# 代理容器IP
Endpoints:         172.17.1.2:80,172.17.2.2:80,172.17.2.3:80
注：kubernetes默认负载均衡模式为ClusterIP。
注：标签主要是识别资源的描述符号。
注：显示集群信息 kubectl cluster-info 显示运行API情况。
```

### 1.3 查看容器详细信息

```java
# kubectl describe pod 容器名
# 容器名称
Name:           hello-world-cc85d4fb6-9lnt9
# 命名空间
Namespace:      default
# 分配节点IP
Node:           192.168.1.77/192.168.1.77
# 启动时间
Start Time:     Thu, 15 Nov 2018 11:59:33 +0800
# 标签名称，系统生成标签
Labels:         app=example
                pod-template-hash=774180962
# 注释
Annotations:    kubernetes.io/created-by={"kind":"SerializedReference","apiVersion":"v1","reference":{"kind":"ReplicaSet","namespace":"default","name":"hello-world-cc85d4fb6","uid":"dc7d20d1-e88a-11e8-91e0-000c29e1b1...
# 状态
Status:         Running
# 分配容器IP
IP:             172.17.1.3
# 由RS进行管理
Created By:     ReplicaSet/hello-world-cc85d4fb6
Controlled By:  ReplicaSet/hello-world-cc85d4fb6
# 容器信息
Containers:
  hello-world:
# 容器ID
    Container ID:   docker://b05c00a8a840e8cf0ee4499ee9244282d500acf28ede13c76ff62c62baaa2057
# 镜像版本号
    Image:          nginx:1.10
    Image ID:       docker-pullable://nginx@sha256:6202beb06ea61f44179e02ca965e8e13b961d12640101fca213efbfd145d7575
# 开放端口
    Port:           80/TCP
# 运行状态
    State:          Running
      Started:      Thu, 15 Nov 2018 12:00:04 +0800
    Ready:          True
    Restart Count:  0
    Environment:    <none>
    Mounts:         <none>
# 容器信息
Conditions:
  Type           Status
  Initialized    True 
  Ready          True 
  PodScheduled   True 
Volumes:         <none>
QoS Class:       BestEffort
Node-Selectors:  <none>
Tolerations:     <none>
Events:          <none>
```

### 1.4 显示有关Deployment详细信息

```java
# kuebctl describe deployments资源名
# 服务名称
Name:                   hello-world
# 命名空间名称，一个命名空间相当与一个虚拟集群
Namespace:              default
CreationTimestamp:      Thu, 15 Nov 2018 11:59:33 +0800
# 加入一个标签
Labels:                 app=example
# 注释
Annotations:            deployment.kubernetes.io/revision=1
# 标签选择器
Selector:               app=example
# 副本数
Replicas:               3 desired | 3 updated | 3 total | 3 available | 0 unavailable
StrategyType:           RollingUpdate
MinReadySeconds:        0
RollingUpdateStrategy:  1 max unavailable, 1 max surge
# pod模板
Pod Template:
  Labels:  app=example
  Containers:
   hello-world:
# 容器镜像版本
    Image:        nginx:1.10
# 容器端口
    Port:         80/TCP
    Environment:  <none>
    Mounts:       <none>
  Volumes:        <none>
Conditions:
  Type           Status  Reason
  ----           ------  ------
# 执行时间记录
  Available      True    MinimumReplicasAvailable
OldReplicaSets:  <none>
NewReplicaSet:   hello-world-cc85d4fb6 (3/3 replicas created)
Events:          <none>
```
