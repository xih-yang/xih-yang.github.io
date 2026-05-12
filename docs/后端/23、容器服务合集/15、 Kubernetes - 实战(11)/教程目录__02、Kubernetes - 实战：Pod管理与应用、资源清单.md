# 02、Kubernetes - 实战：Pod管理与应用、资源清单
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/11/2.html
- 分类：容器服务
- 分组：教程目录
## 1、什么是pod？

Pod是可以创建和管理Kubernetes计算的最小可部署单元，一个Pod代表着集群中运行的一个进程，每个pod都有一个唯一的ip。pod可以理解为是花生壳，一个pod中好几个花生豆（container），也可能一个pod中一个container，里面的container共享pod内的IP、Network和ns（namespace）等资源，这样就存在容器的多个副本不能直接放在一个pod里的问题，必须靠端口不同来区分一个pod中的不同容器。所有功能都是通过api接口实现。

## 2、pod中常用命令

本文是已经搭建好k8s集群，server1做仓库，server2是集群的master，server3和server4是集群的worker

### （1）查看

kubectl get pod -n kube-system查看k8s系统服务

```java
kubectl run demo --image=myapp:v1		%创建新的pod，叫demo
kubectl get node						%查看所有pod的简单信息
kubectl get node -o wide				%查看所有pod的ip和节点服务位置
kubectl describe pod demo				%查看demo的详细信息
kubectl  get all						%查看所有资源信息
```

查看flannel环境，可以看到mater主机是0网段，

server3是1网段，

server4是2网段，

访问上面建立的demo服务，确实用的是myapp：v1镜像。

kubectl delete pod demo 删除名叫demo的pod

### （2）部署Deployment、扩容、更新、回滚

创建两个副本，可以看到这里正好两个副本都在server3。

我们删除一个副本，查看发现，数量还是两个，但是号码换了。这是因为Deployment控制器的机制，他发现副本数量不足2时，他会自动创建，补足两个副本。

集群内部任意节点可以访问Pod，但集群外部无法直接访问。

kubectl expose deployment demo --port=80 --target-port=80，此时pod客户端可以通过service的名称或ip访问后端的两个Pod，设定可供集群外部访问的虚拟IP

访问该虚拟ip，可以看到负载均衡的落在两个后端上

kubectl describe svc demo 可以详细的看到demo这个服务的虚拟ip和两个后端

Pod扩容，从2个副本变为6个副本。

可以看到有六个后端服务

测试负载均衡

同理，缩容也很简单，多余的副本会被回收（缩容时，最新创建pod的会被最先删除）

镜像从myapp：v1更新为myapp：v2

查看，更新后的v2是7bd47bddfc这个，开启的副本数量是2。可以看到5b4fc8bb88的信息也保存着，但是开启的副本数量是0，问什么还要保存他的信息呢？这是因为回滚时的需要。

```java
kubectl rollout history deployment demo	%查看历史版本
kubectl rollout undo deployment demo --to-revision=1	%回滚版本
```

## 3、资源清单介绍

在k8s中，一般使用yaml格式的文件来创建我们期望产生的pod，该yaml文件称为资源清单，可以减少命令行的使用，减少错误，可重复性好，可以规范化部署，因此备受喜爱

## 4、资源清单实现

编写pod.yaml 文件

```java
[root@server2 pod]# cat pod.yaml 
apiVersion: v1		%指明api资源属于哪个群组和版本，同一个组可以有多个版本
kind: Pod			%标记创建的资源类型，k8s主要支持以下资源类别（Pod,ReplicaSet,Deployment,StatefulSet,DaemonSet,Job,Cronjob）
metadata:			%元数据
  name: pod-example	%对象名称
spec:				%定义目标资源的期望状态
  containers:
  - name: myapp						%容器名字
    image: myapp:v1	%指定镜像
```

用pod.yaml 文件创建pod

修改pod.yaml 文件

```java
[root@server2 pod]# cat pod.yaml 
apiVersion: v1
kind: Pod
metadata:
  name: pod-example
spec:
  containers:
  - name: myapp
    image: myapp:v1
    imagePullPolicy: IfNotPresent		%优先在已有镜像的服务端创建，不再重复拉取镜像，节省资源
    ports:				%指定容器所在主机需要监听的端口号，会写到iptables策略中
      - containerPort: 80
        hostPort: 80					%利用NAT把物理机的80端口影射到容器的80端口
```

拉起pod后，节点分配到了server3上，查看iptables

修改pod.yaml 文件

```java
[root@server2 pod]# cat pod.yaml 
apiVersion: v1
kind: Pod
metadata:
  name: pod-example
spec:
  hostNetwork: true				%直接把物理机的端口给容器用
  containers:
  - name: myapp
    image: myapp:v1
    imagePullPolicy: IfNotPresent		
```

拉起pod后，可以看到pod与物理机共用ip

查看端口

使用清单限制内存和CPU，修改pod.yaml 文件

```java
[root@server2 pod]# cat pod.yaml 
apiVersion: v1
kind: Pod
metadata:
  name: pod-example
spec:
  hostNetwork: true	
  containers:
  - name: myapp
    image: myapp:v1
    imagePullPolicy: IfNotPresent
    resources:
      requests:			%对cpu和mem的最低要求
        cpu: "100m"
        memory: "50Mi"
      limits:			%对cpu和mem的最高限制
        cpu: "200m"
        memory: "100Mi"
```

kubectl apply -f pod.yaml拉起pod，kubectl describe pod pod-example查看

默认容器副本退出后会自动重启always，这里可以使用never参数设置不重启。退出后，该节点显示已完成，且不会自动重启

如何指定该pod节点去server4创建？修改pod.yaml 文件

```java
[root@server2 pod]# cat pod.yaml 
apiVersion: v1
kind: Pod
metadata:
  name: pod-example
spec:
  nodeName: server4				%使用server4作为后端
  containers:
  - name: myapp
    image: myapp:v1
    imagePullPolicy: IfNotPresent
    resources:
      requests:			%对cpu和mem的最低要求
        cpu: "100m"
        memory: "50Mi"
      limits:			%对cpu和mem的最高限制
        cpu: "200m"
        memory: "100Mi"
```

kubectl apply -f pod.yaml拉起pod，查看确实在server4
