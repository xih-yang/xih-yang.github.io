# 02、Kubernetes - 实战：pod命令行方式管理
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/5/2.html
- 分类：容器服务
- 分组：教程目录
## 一、Pod是什么

Pod是Kubernetes中能够创建和部署的最小单元，是Kubernetes集群中的一个应用实例，总是部署在同一个节点Node上。Pod中包含了一个或多个容器，还包括了存储、网络等各个容器共享的资源。Pod支持多种容器环境，Docker则是最流行的容器环境。

```java
单容器Pod，最常见的应用方式。
多容器Pod，对于多容器Pod，Kubernetes会保证所有的容器都在同一台物理主机或虚拟主机中运行。多容器Pod是相对高阶的使用方式，除非应用耦合特别严重，一般不推荐使用这种方式。一个Pod内的容器共享IP地址和端口范围，容器之间可以通过 localhost 互相访问。
```

## Pod带来的好处

Pod并不提供保证正常运行的能力，因为可能遭受Node节点的物理故障、网络分区等等的影响，整体的高可用是Kubernetes集群通过在集群内调度Node来实现的。通常情况下我们不要直接创建Pod，一般都是通过Controller来进行管理，但是了解Pod对于我们熟悉控制器非常有好处。

Pod做为一个可以独立运行的服务单元，简化了应用部署的难度，以更高的抽象层次为应用部署管提供了极大的方便。

Pod做为最小的应用实例可以独立运行，因此可以方便的进行部署、水平扩展和收缩、方便进行调度管理与资源的分配。

Pod中的容器共享相同的数据和网络地址空间，Pod之间也进行了统一的资源管理与分配。

## Kubernetes中Pod控制器

pod的管理主要有RC(RS)、Deployment、StatefulSet、DaemonSet和Job（CronJob）等

## Replication Controller

Replication Controller简称RC，简单来说，RC可以保证在任意时间运行Pod的副本数量，能够保证Pod总是可用的。总维持pod是指定的副本数量运行。

Replication Set

Replication Set简称RS，随着Kubernetes的发展，RS在RC的基础上做了一些扩展，官方已经推荐使用RS和Deployment来代替RC了。

```java
apiVersion: v1
kind: ReplicationController/Replication Set
metadata:
  name: rc-test
  labels:
    name: rc
spec:
  replicas: 3
  selector:
    name: rc
 ...................................
```

## Deployment

主要职责和RC一样的都是保证Pod的数量和健康，二者大部分功能都是完全一致的，可以看成是一个升级版的RC控制器。比如一些官方组件kube-dns、kube-proxy也都是使用的Deployment来管理的.

新特性如下：

RS的全部功能：Deployment具备上面描述的RC的全部功能

事件和状态查看：可以查看Deployment的升级详细进度和状态

回滚：当升级Pod的时候如果出现问题，可以使用回滚操作回滚到之前的任一版本

版本记录：每一次对Deployment的操作，都能够保存下来，这也是保证可以回滚到任一版本的基础

暂停和启动：对于每一次升级都能够随时暂停和启动

```java
apiVersion: apps/v1beta1
kind: Deployment
metadata:
  name: test
  labels:
    k8s-app: test
spec:
  replicas: 3
  template:
    metadata:
      labels:
        app: mysql
  ....................................
```

## DaemonSet

DaemonSet适用于在每个Node都需要运行一个Pod的时候使用，比如：每一个Node上运行一个日志采集、性能监控的Pod,可以通过DaemonSet来实现

```java
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: node-ds-test
spec:
  selector:
    matchLabels:
      name: node-ds-test
  template:
    metadata:
      labels:
...........................
```

## StatefulSet

StatefulSet是Kubernetes提供的管理有状态应用的负载管理控制器API。在Pods管理的基础上，保证Pods的顺序和一致性。与Deployment一样，StatefulSet也是使用容器的Spec来创建Pod，与之不同StatefulSet创建的Pods在生命周期中会保持持久的标记

```java
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: web
spec:
  serviceName: "nginx"
  replicas: 2
  selector:
     matchLabels:
       app: nginx
  template:
    metadata:
...........................
```

## Job/CronJob

K8S中，通常用Job来创建一个任务，注意job是执行一个的任务。如需要任务定时周期的去执行。CronJob就出场了，CronJob其实就是在Job的基础上加上了任务调度。

```java
apiVersion: batch/v1
kind: Job/CronJob
metadata:
  name: job-test
spec:
  template:
    metadata:
      name: job-test
    spec:
      restartPolicy: Never
```

## 二、通过命令来管理pod

官方推荐我们使用yaml文件的形式来管理pod，我们先用命令的方式来管理pod：

以下就是一些常用的kubectl管理命令

```java
#查看所有 pod 列表,  -n 后跟 namespace, 查看指定的命名空间  -o wide 查看详细信息
kubectl get pod
kubectl get pod -n kube  
kubectl get pod -o wide
# 查看 RC 和 service 列表， -o wide 查看详细信息
kubectl get rc,svc
kubectl get pod,svc -o wide  
kubectl get pod <pod-name> -o yaml
# 显示 Node 的详细信息
kubectl describe node server2
# 显示 Pod 的详细信息, 特别是查看 pod 无法创建的时候的日志
kubectl describe pod <pod-name>
eg:
kubectl describe pod nginx
# 根据 yaml 创建资源, apply 可以重复执行，create 不行
kubectl create -f pod.yaml
kubectl apply -f pod.yaml
# 基于 pod.yaml 定义的名称删除 pod 
kubectl delete -f pod.yaml 
# 删除所有包含某个 label 的pod 和 service
kubectl delete pod,svc -l name=<label-name>
# 删除所有 Pod
kubectl delete pod --all
# 查看 endpoint 列表
kubectl get endpoints
# 执行 pod 的命令
kubectl exec <pod-name> -- date
kubectl exec <pod-name> -- bash
kubectl exec <pod-name> -- ping 172.25.63.1
# 通过bash获得 pod 中某个容器的TTY，相当于登录容器
kubectl exec -it <pod-name> -c <container-name> -- bash
eg:
kubectl exec -it nginx -- bash
# 查看容器的日志
kubectl logs <pod-name>
kubectl logs -f <pod-name> 实时查看日志
kubectl log  <pod-name>  -c <container_name> 若 pod 只有一个容器，可以不加 -c 
# 查看注释
kubectl explain pod
kubectl explain pod.apiVersion
# 查看节点 labels
kubectl get node --show-labels
```

## 三、pod命令管理实践

## 创建自主式pod

运行一个pod：

可以使用`kubectl run --help`查看运行的帮助

```java
[root@server1 ~]# kubectl run nginx --image=nginx
pod/nginx created
```

查看运行的pod：

```java
[root@server1 ~]# kubectl get pod
NAME    READY   STATUS              RESTARTS   AGE
nginx   0/1     ContainerCreating   0          3m56s
```

查看默认namespace的pod：

```java
[root@server1 ~]# kubectl get pod -n default
NAME    READY   STATUS    RESTARTS   AGE
nginx   1/1     Running   0          4m31s
```

查看pod的详细信息：

```java
[root@server1 ~]# kubectl describe pod nginx
Name:         nginx
Namespace:    default
Priority:     0
Node:         server2/172.25.63.2			#这个pod运行在哪个节点上
Start Time:   Sat, 18 Apr 2020 00:43:38 +0800
Labels:       run=nginx					#pod的label
Annotations:  <none>
Status:       Running
IP:           10.244.1.2			#pod的ip地址
IPs:
  IP:  10.244.1.2
Containers:
  nginx:
  ......
```

此时，集群内部的任意节点可以访问pod，但是集群外部无法直接访问：

现在再运行一个容器来访问nginx：

```java
[root@server1 ~]# kubectl run test -it --image=radial/busyboxplus --restart=Never
If you don't see a command prompt, try pressing enter.
/ 
/ curl 10.244.1.2			#访问第一个pod的ip地址即可。
```

上述命令中`--restart=Neve`r表示退出之后不重启，默认会重启。

当pod不使用时可以将其删除

删除pod：

```java
[root@server1 ~]# kubectl delete pod nginx 
pod "nginx" deleted
[root@server1 ~]# kubectl delete pod test 
pod "test" deleted
```

## 指定pod控制器为deployment

默认创建pod时使用自主式的pod管理器，这种自主创建的pod再删除时会直接删除，我们也可以指定pod管理器deployment来创建pod，这种管理器在pod删除时会帮我们自动启动：

首先用两种方式创建pod：

```java
[root@server1 ~]# kubectl run nginx --image=nginx
pod/nginx created
[root@server1 ~]# kubectl create deployment myapp --image=ikubernetes/myapp:v1deployment.apps/myapp created
查看pod信息：
[root@server1 ~]# kubectl get pod -o wide
NAME                     READY   STATUS              RESTARTS   AGE     IP           NODE      NOMINATED NODE   READINESS GATES
myapp-5d587c4d45-vw5z5   0/1     ContainerCreating   0          13s     <none>       server3   <none>           <none>
nginx                    1/1     Running             0          5m32s   10.244.1.3   server2   <none>           <none>
删除自主pod：
[root@server1 ~]# kubectl delete pod nginx 
pod "nginx" deleted
[root@server1 ~]# kubectl get pod
NAME                     READY   STATUS    RESTARTS   AGE
myapp-5d587c4d45-vw5z5   1/1     Running   0          116s
可以看到已经被删除，接下来删除指定deployment的pod：
[root@server1 ~]# kubectl delete pod myapp-5d587c4d45-vw5z5
pod "myapp-5d587c4d45-vw5z5" deleted
[root@server1 ~]# kubectl get pod
NAME                     READY   STATUS              RESTARTS   AGE
myapp-5d587c4d45-nplqk   0/1     ContainerCreating   0          26s
可以看到删除pod后deployment又帮我们启动了pod。
```

## pod拉伸

基于deployment我们也可以实现拉伸pod的目的：

```java
[root@server1 ~]# kubectl scale --replicas=2 deployment myapp
```

拉伸成功，同理也可以实现缩减的效果。

## 集群内部pod之间访问

此时的pod在集群外部和pod外部并不能被访问，只能在pod内部被访问，要实现集群内部pod外部访问就要借助service，service是一个抽象概念，定义了一个服务的多个pod逻辑合集和访问pod的策略，一般把service成为微服务。

解下来创建service：

```java
[root@server1 ~]# kubectl expose deployment myapp --port=80 --target-port=80
service/myapp exposed
```

此时pod客户端可以通过service的名称访问后端的两个pod，其中Cluster ip为默认类型，自动分配一个仅集群内部可以访问的虚拟ip。

```java
[root@server1 ~]# kubectl get deployments.apps 
NAME    READY   UP-TO-DATE   AVAILABLE   AGE
myapp   2/2     2            2           7m24s
[root@server1 ~]# kubectl get svc
NAME         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
kubernetes   ClusterIP   10.96.0.1       <none>        443/TCP   4h25m
myapp        ClusterIP   10.104.223.76   <none>        80/TCP    32s
[root@server1 ~]# kubectl describe svc myapp 
Name:              myapp
Namespace:         default
Labels:            app=myapp
Annotations:       <none>
Selector:          app=myapp
Type:              ClusterIP
IP:                10.104.223.76
Port:              <unset>  80/TCP
TargetPort:        80/TCP
Endpoints:         10.244.1.4:80,10.244.2.8:80		#两个pod的地址
Session Affinity:  None
Events:            <none>
```

之后测试访问：

```java
[root@server1 ~]# kubectl run test -it --image=radial/busyboxplus
If you don't see a command prompt, try pressing enter.
/ 
/ curl 10.104.223.76
```

## 集群外部访问pod

当然这种方式也只能在集群内部访问，要想实现集群外部访问，我们可以使用NodePort类型暴露端口，让外部客户端访问Pod。

NodePort：在ClusterIp基础上为Service在每台机器上绑定一个端口，这样就可以通过NodeIP:NodePort来访问该服务。

由于集群已经创建，因此要实现集群外部访问需要更改集群网络类型：

```java
[root@server1 ~]# kubectl edit svc myapp
```

将ClusterIp该为NodePort

当然也可以在创建service时加`--type=NodePort`指定类型。

```java
kubectl expose deployment myapp --port=80 --target-poet=80 --type=NodePort
kubectl get pod -o wide
kubectl get svc myapp
```

查看暴露出来的端口：

```java
[root@server1 ~]# kubectl get svc myapp
NAME    TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
myapp   NodePort   10.104.223.76   <none>        80:32516/TCP   6m47s
```

端口为32516，因此可以使用以下方式访问pod：

```java
[root@foundation63 kiosk]# curl 172.25.63.3:32516
Hello MyApp | Version: v1 | <a href="hostname.html">Pod Name</a>
[root@foundation63 kiosk]# curl 172.25.63.2:32516
Hello MyApp | Version: v1 | <a href="hostname.html">Pod Name</a>
```

## pod的应用版本更新和回滚

接下来实现pod的版本更新和回滚：

```java
[root@server1 ~]# kubectl set image deployments myapp myapp=ikubernetes/myapp:v2 --record 
deployment.apps/myapp image updated
```

查看更新历史：

```java
[root@server1 ~]# kubectl rollout history deployment myapp
deployment.apps/myapp 
REVISION  CHANGE-CAUSE
1         <none>
2         kubectl set image deployments myapp myapp=ikubernetes/myapp:v2 --record=true
```

查看版本：

```java
[root@server1 ~]# curl 172.25.63.3:32516
Hello MyApp | Version: v2 | <a href="hostname.html">Pod Name</a>
```

可以看出已经更新成了v2版本。

回滚到v1：

```java
[root@server1 ~]# kubectl rollout undo deployment myapp --to-revision=1
deployment.apps/myapp rolled back
```

查看版本：

```java
[root@server1 ~]# curl 172.25.63.3:32516
Hello MyApp | Version: v1 | <a href="hostname.html">Pod Name</a>
```

可以看到版本已经回滚到v1了。
