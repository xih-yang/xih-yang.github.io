# 19、Kubernetes 实战 - k8s 污点和容忍度
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/2/19.html
- 分类：容器服务
- 分组：教程目录
## 一，前言

上一篇，介绍了 k8s ConfigMap 管理服务环境变量；

本篇，介绍 k8s 污点和容忍度；

## 二，污点与容忍度介绍

通过污点和容忍度配置可以干预 Pod 部署到特定的节点；

比如：
不想让某些服务、deploy、pod 部署到某台机器上；

专门负责部署 mysql 的机器，可以设置污点默认不能部署其他服务；

污点和容忍度

- 在 Kubernetes 中， Pod 被部署到 Node 上面去的规则和逻辑是由 Kubernetes 的调度组件根据 Node 的剩余资源，地位，以及其他规则自动选择调度的
- 但前端和后端往往服务器资源的分配都是不均衡的，甚至有的服务只能让特定的服务器来跑
- 在这种情况下，我们选择自动调度是不均衡的，就需要人工去干预匹配选择规则了
- 这时候，就需要在给 Node 添加一个叫做污点的东西，以确保 Node 不被 Pod 调度到
- 当你给 Node 设置一个污点后，除非给 Pod 设置一个相对应的容忍度，否则 Pod 才能被调度上去。这也就是污点和容忍的来源
- 污点的格式是 key=value，可以自定义自己的内容，就像是一组 Tag 一样
- Node_Name 为要添加污点的 node 名称
- key 和 value 为一组键值对，代表一组标示标签
- NoSchedule 则为不被调度的意思，和它同级别的还有其他的值：PreferNoSchedule 和 NoExecute

## 三，清理环境

先清理一下现有环境，释放出资源：

```java
[root@k8s-master deployment]# kubectl get pods
NAME                      READY   STATUS             RESTARTS   AGE
pay-v1-655587b6f5-gv8hc   1/1     Running            0          24h
user-v1-9f4d589cc-rdmnz   1/1     Running            0          10m
v4-57b4cf7fd9-zcl45       0/1     ImagePullBackOff   0          5d23h
v4-fb4cd75f5-bf2pf        0/1     ImagePullBackOff   0          40h
// 删掉 pay-v1 的部署(pay-v1 的容器会被干掉)
[root@k8s-master deployment]# kubectl delete deploy pay-v1
deployment.apps "pay-v1" deleted
[root@k8s-master deployment]# kubectl get pods
NAME                      READY   STATUS             RESTARTS   AGE
user-v1-9f4d589cc-rdmnz   1/1     Running            0          13m
v4-57b4cf7fd9-zcl45       0/1     ImagePullBackOff   0          5d23h
v4-fb4cd75f5-bf2pf        0/1     ImagePullBackOff   0          40h
```

## 四，设置污点

为k8s-node 设置污点：

```java
kubectl taint nodes [Node_Name] [key]=[value]:NoSchedule
// 添加污点-k8s-nodes 不部署 pay-v1
[root@k8s-master deployment]# kubectl taint nodes k8s-node pay-v1=true:NoSchedule
node/k8s-node tainted
//查看污点
[root@k8s-master deployment]# kubectl describe node k8s-node
Name:               k8s-node
Roles:              <none>
Labels:             beta.kubernetes.io/arch=amd64
                    beta.kubernetes.io/os=linux
                    kubernetes.io/arch=amd64
                    kubernetes.io/hostname=k8s-node
                    kubernetes.io/os=linux
Annotations:        flannel.alpha.coreos.com/backend-data: {"VNI":1,"VtepMAC":"96:c0:15:7d:c1:a9"}
                    flannel.alpha.coreos.com/backend-type: vxlan
                    flannel.alpha.coreos.com/kube-subnet-manager: true
                    flannel.alpha.coreos.com/public-ip: 172.17.178.106
                    kubeadm.alpha.kubernetes.io/cri-socket: /var/run/dockershim.sock
                    node.alpha.kubernetes.io/ttl: 0
                    volumes.kubernetes.io/controller-managed-attach-detach: true
CreationTimestamp:  Wed, 22 Dec 2021 00:41:20 +0800
// 以下就是污点信息-如果部署的名称是 pay-v1，k8s-node 不参与调度
Taints:             pay-v1=true:NoSchedule
Unschedulable:      false
Lease:
  HolderIdentity:  k8s-node
  AcquireTime:     <unset>
  RenewTime:       Wed, 05 Jan 2022 15:35:38 +0800
Conditions:
  Type                 Status  LastHeartbeatTime                 LastTransitionTime                Reason                       Message
  ----                 ------  -----------------                 ------------------                ------                       -------
  NetworkUnavailable   False   Fri, 24 Dec 2021 17:43:49 +0800   Fri, 24 Dec 2021 17:43:49 +0800   FlannelIsUp                  Flannel is running on this node
  MemoryPressure       False   Wed, 05 Jan 2022 15:32:38 +0800   Fri, 24 Dec 2021 18:22:47 +0800   KubeletHasSufficientMemory   kubelet has sufficient memory available
  DiskPressure         False   Wed, 05 Jan 2022 15:32:38 +0800   Fri, 24 Dec 2021 18:22:47 +0800   KubeletHasNoDiskPressure     kubelet has no disk pressure
  PIDPressure          False   Wed, 05 Jan 2022 15:32:38 +0800   Fri, 24 Dec 2021 18:22:47 +0800   KubeletHasSufficientPID      kubelet has sufficient PID available
  Ready                True    Wed, 05 Jan 2022 15:32:38 +0800   Fri, 24 Dec 2021 18:22:47 +0800   KubeletReady                 kubelet is posting ready status
Addresses:
  InternalIP:  172.17.178.106
  Hostname:    k8s-node
Capacity:
  cpu:                2
  ephemeral-storage:  41152812Ki
  hugepages-1Gi:      0
  hugepages-2Mi:      0
  memory:             951856Ki
  pods:               110
Allocatable:
  cpu:                2
  ephemeral-storage:  37926431477
  hugepages-1Gi:      0
  hugepages-2Mi:      0
  memory:             849456Ki
  pods:               110
System Info:
  Machine ID:                 20211123171600472607520636465043
  System UUID:                71F14756-1816-4DFF-86DF-5129F0234463
  Boot ID:                    336150f9-ea6b-4de6-b4f5-c06967b5b344
  Kernel Version:             3.10.0-1160.45.1.el7.x86_64
  OS Image:                   CentOS Linux 7 (Core)
  Operating System:           linux
  Architecture:               amd64
  Container Runtime Version:  docker://20.10.12
  Kubelet Version:            v1.20.4
  Kube-Proxy Version:         v1.20.4
PodCIDR:                      10.244.1.0/24
PodCIDRs:                     10.244.1.0/24
Non-terminated Pods:          (6 in total)
  Namespace                   Name                                         CPU Requests  CPU Limits  Memory Requests  Memory Limits  AGE
  ---------                   ----                                         ------------  ----------  ---------------  -------------  ---
  default                     user-v1-9f4d589cc-rdmnz                      0 (0%)        0 (0%)      0 (0%)           0 (0%)         17m
  default                     v4-57b4cf7fd9-zcl45                          0 (0%)        0 (0%)      0 (0%)           0 (0%)         5d23h
  default                     v4-fb4cd75f5-bf2pf                           0 (0%)        0 (0%)      0 (0%)           0 (0%)         40h
  ingress-nginx               ingress-nginx-controller-6b6497d95d-9j7qn    100m (5%)     0 (0%)      90Mi (10%)       0 (0%)         13d
  kube-system                 kube-flannel-ds-ckhq8                        100m (5%)     100m (5%)   50Mi (6%)        50Mi (6%)      14d
  kube-system                 kube-proxy-sp6r2                             0 (0%)        0 (0%)      0 (0%)           0 (0%)         14d
Allocated resources:
  (Total limits may be over 100 percent, i.e., overcommitted.)
  Resource           Requests     Limits
  --------           --------     ------
  cpu                200m (10%)   100m (5%)
  memory             140Mi (16%)  50Mi (6%)
  ephemeral-storage  0 (0%)       0 (0%)
  hugepages-1Gi      0 (0%)       0 (0%)
  hugepages-2Mi      0 (0%)       0 (0%)
Events:              <none>
```

生效pay-v1 部署配置：deployment-pay-v1.yaml

```java
[root@k8s-master deployment]# kubectl apply -f deployment-pay-v1.yaml
deployment.apps/pay-v1 created
[root@k8s-master deployment]# kubectl get pods
NAME                      READY   STATUS             RESTARTS   AGE
pay-v1-655587b6f5-k26lx   0/1     Pending            0          19s
user-v1-9f4d589cc-rdmnz   1/1     Running            0          20m
v4-57b4cf7fd9-zcl45       0/1     ImagePullBackOff   0          5d23h
v4-fb4cd75f5-bf2pf        0/1     ImagePullBackOff   0          40h
```

新创建的pod：pay-v1-655587b6f5-k26lx 处于 Pending 状态：

```java
[root@k8s-master deployment]# kubectl describe pod pay-v1-655587b6f5-k26lx
Name:           pay-v1-655587b6f5-k26lx
Namespace:      default
Priority:       0
Node:           <none>
Labels:         app=pay-v1
                pod-template-hash=655587b6f5
Annotations:    <none>
Status:         Pending
IP:             
IPs:            <none>
Controlled By:  ReplicaSet/pay-v1-655587b6f5
Containers:
  nginx:
    Image:        nginx:pay
    Port:         80/TCP
    Host Port:    0/TCP
    Environment:  <none>
    Mounts:
      /var/run/secrets/kubernetes.io/serviceaccount from default-token-q4qxd (ro)
Conditions:
  Type           Status
  PodScheduled   False 
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
  Type     Reason            Age               From               Message
  ----     ------            ----              ----               -------
  Warning  FailedScheduling  3s (x3 over 75s)  default-scheduler  0/2 nodes are available: 1 node(s) had taint {node-role.kubernetes.io/master: }, that the pod didn't tolerate, 1 node(s) had taint {pay-v1: true}, that the pod didn't tolerate.
```

报错了，调度失败，共 2 个节点，0 个可用， k8s-node 污点效果生效

## 五，设置容忍度

为Pod 设置容忍度：

- 想让 Pod 被调度过去，需要在 Pod 一侧添加相同的容忍度才能被调度到
- 给 Pod 设置一组容忍度，以匹配对应的 Node 的污点
- key 和 value 是你配置 Node 污点的 key 和 value
- effect 是 Node 污点的调度效果，和 Node 的设置项也是匹配的
- operator 是运算符，equal 代表只有 key 和 value 相等才算数。当然也可以配置 exists ，代表只要 key 存在就匹配，不需要校验 value 的值

修改前： deployment-pay-v1.yaml

```java
apiVersion: apps/v1 API版本号
kind: Deployment    资源类型部署
metadata:
  name: pay-v1     资源名称
spec:
  selector:
    matchLabels:
      app: pay-v1  告诉deployment根据规则匹配相应的Pod进行控制和管理，matchLabels字段匹配Pod的label值
  replicas: 1       声明Pod副本的数量
  template:
    metadata:
      labels:
        app: pay-v1Pod名称
    spec:           描述Pod内的容器信息
      containers:
      - name: nginx 容器的名称
        image: nginx:pay镜像
        ports:
        - containerPort: 80容器内映射的端口
```

修改后：

```java
apiVersion: apps/v1 API版本号
kind: Deployment    资源类型部署
metadata:
  name: pay-v1     资源名称
spec:
  selector:
    matchLabels:
      app: pay-v1  告诉deployment根据规则匹配相应的Pod进行控制和管理，matchLabels字段匹配Pod的label值
  replicas: 1       声明Pod副本的数量
  template:
    metadata:
      labels:
        app: pay-v1Pod名称
    spec:           描述Pod内的容器信息
      tolerations:
      - key: "pay-v1"
        value: "true"
        operator: "Equal"
        effect: "NoSchedule"
      containers:
      - name: nginx 容器的名称
        image: nginx:pay镜像
        ports:
        - containerPort: 80容器内映射的端口
```

生效配置：

```java
[root@k8s-master deployment]# kubectl apply -f deployment-pay-v1.yaml
deployment.apps/pay-v1 configured
// pay-v1的 pod 成功 Running
[root@k8s-master deployment]# kubectl get pods
NAME                      READY   STATUS             RESTARTS   AGE
pay-v1-6cd6d4cc78-sgvnv   1/1     Running            0          45s
user-v1-9f4d589cc-rdmnz   1/1     Running            0          86m
v4-57b4cf7fd9-zcl45       0/1     ImagePullBackOff   0          6d1h
v4-fb4cd75f5-bf2pf        0/1     ImagePullBackOff   0          42h
// 容忍污点，部署到了k8s-node上
[root@k8s-master deployment]# kubectl describe pod pay-v1-6cd6d4cc78-sgvnv
Name:         pay-v1-6cd6d4cc78-sgvnv
Namespace:    default
Priority:     0
Node:         k8s-node/172.17.178.106
```

## 六，修改 node 节点的污点

先删除pay-v1 的部署

```java
[root@k8s-master deployment]# kubectl delete deploy pay-v1
deployment.apps "pay-v1" deleted
```

```java
// 之前是 pay-v1=true ，这次是 pay-v1=1
[root@k8s-master deployment]# kubectl taint nodes k8s-node pay-v1=1:NoSchedule --overwrite
node/k8s-node modified
[root@k8s-master deployment]# kubectl apply -f deployment-pay-v1.yaml
deployment.apps/pay-v1 created
// pending 了
[root@k8s-master deployment]# kubectl get pods
NAME                      READY   STATUS             RESTARTS   AGE
pay-v1-6cd6d4cc78-shfp9   0/1     Pending            0          20s
user-v1-9f4d589cc-rdmnz   1/1     Running            0          91m
v4-57b4cf7fd9-zcl45       0/1     ImagePullBackOff   0          6d1h
v4-fb4cd75f5-bf2pf        0/1     ImagePullBackOff   0          42h
```

为什么是 pending 呢？因为污点不被允许；

这时因为，在 yaml 中的配置是：

```java
    spec:           描述Pod内的容器信息
      tolerations:
      - key: "pay-v1"
        value: "true"
        operator: "Equal"
        effect: "NoSchedule"
```

key和 value 都要相等才可以，但 value 是 1，不相等；

修改：改为存在 key 即可，不关心 value 值

```java
    spec:           描述Pod内的容器信息
      tolerations:
      - key: "pay-v1"
        operator: "Exists"
        effect: "NoSchedule"
[root@k8s-master deployment]# vi deployment-pay-v1.yaml
apiVersion: apps/v1 API版本号
kind: Deployment    资源类型部署
metadata:
  name: pay-v1     资源名称
spec:
  selector:
    matchLabels:
      app: pay-v1  告诉deployment根据规则匹配相应的Pod进行控制和管理，matchLabels字段匹配Pod的label值
  replicas: 1       声明Pod副本的数量
  template:
    metadata:
      labels:
        app: pay-v1Pod名称
    spec:           描述Pod内的容器信息
      tolerations:
      - key: "pay-v1"
        operator: "Exists"
        effect: "NoSchedule"
      containers:
      - name: nginx 容器的名称
        image: nginx:pay镜像
        ports:
        - containerPort: 80容器内映射的端口
[root@k8s-master deployment]# kubectl apply -f deployment-pay-v1.yaml
deployment.apps/pay-v1 configured
// 成功 Running
[root@k8s-master deployment]# kubectl get pods
NAME                      READY   STATUS             RESTARTS   AGE
pay-v1-6d6cdc544b-fbhdd   1/1     Running            0          28s
user-v1-9f4d589cc-rdmnz   1/1     Running            0          97m
v4-57b4cf7fd9-zcl45       0/1     ImagePullBackOff   0          6d1h
v4-fb4cd75f5-bf2pf        0/1     ImagePullBackOff   0          42h
```

即匹配规则可以自由指定，容忍规则也可以自由指定

## 七，删除 Node 的污点

```java
kubectl taint nodes k8s-node pay-v1-  // 最后的 - 就是删除的意思
[root@k8s-master ~]# kubectl taint nodes k8s-node pay-v1-
node/k8s-node untainted  // 在k8s-node节点上取消污点
```

取消污点后，就可以随便部署了

## 八，如何在 master 上布署 pod

master 之所以不能部署 pod，是因为有污点

```java
// 添加污点
[root@k8s-master ~]# kubectl taint nodes k8s-node pay-v1=true:NoSchedule --overwrite
node/k8s-node modified
// 删掉部署
[root@k8s-master ~]# kubectl delete deploy pay-v1
deployment.apps "pay-v1" deleted
// 查看k8s-master污点信息
[root@k8s-master ~]# kubectl describe node k8s-master
Name:               k8s-master
Taints:             node-role.kubernetes.io/master:NoSchedule
Unschedulable:      false
```

修改pay-v1 配置，将 tolerations 容忍度，修改为 node-role.kubernetes.io/master，使之匹配

```java
[root@k8s-master deployment]# vi deployment-pay-v1.yaml 
apiVersion: apps/v1 API版本号
kind: Deployment    资源类型部署
metadata:
  name: pay-v1     资源名称
spec:
  selector:
    matchLabels:
      app: pay-v1  告诉deployment根据规则匹配相应的Pod进行控制和管理，matchLabels字段匹配Pod的label值
  replicas: 1       声明Pod副本的数量
  template:
    metadata:
      labels:
        app: pay-v1Pod名称
    spec:           描述Pod内的容器信息
+     tolerations:
+     - key: "node-role.kubernetes.io/master"
+       operator: "Exists"
+       effect: "NoSchedule"
      containers:
      - name: nginx 容器的名称
        image: nginx:pay镜像
        ports:
        - containerPort: 80容器内映射的端口
// 部署
[root@k8s-master deployment]#  kubectl apply -f deployment-pay-v1.yaml 
deployment.apps/pay-v1 created
```

查看部署 pod:

```java
[root@k8s-master deployment]# kubectl get pods
NAME                      READY   STATUS             RESTARTS   AGE
pay-v1-6db6455b8-np2hw    1/1     Running            0          37s
user-v1-9f4d589cc-rdmnz   1/1     Running            0          18h
v4-57b4cf7fd9-zcl45       0/1     ImagePullBackOff   0          6d17h
v4-fb4cd75f5-bf2pf        0/1     ImagePullBackOff   0          2d10h
[root@k8s-master deployment]# kubectl describe pod pay-v1-6db6455b8-np2hw
Name:         pay-v1-6db6455b8-np2hw
Namespace:    default
Priority:     0
Node:         k8s-master/172.17.178.105
```

可以发现，pod 被部署到了 master 节点上

## 九，结尾

本篇，介绍了 k8s 污点和容忍度；

下一篇，待定；
