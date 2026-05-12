# 17、Kubernetes - 实战：pod资源限制 namespace资源限制
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/5/17.html
- 分类：容器服务
- 分组：教程目录
## 一、容器资源限制

Kubernetes采用request和limit两种限制类型来对资源进行分配。

```java
request(资源需求)：即运行Pod的节点必须满足运行Pod的最基本需求才能运行Pod。
limit(资源限额)：即运行Pod期间，可能内存使用量会增加，那最多能使用多少内存，这就是资源限额。
```

资源类型:

```java
CPU 的单位是核心数，内存的单位是字节。
一个容器申请0.5个CPU，就相当于申请1个CPU的一半，你也可以加个后缀m表示千分之一的概念。比如说100m的CPU，100豪的CPU和0.1个CPU都是一样的。
```

内存单位：

K、M、G、T、P、E #通常是以1000为换算标准的。

Ki、Mi、Gi、Ti、Pi、Ei #通常是以1024为换算标准的

内存限制示例：

```java
[root@server1 ~]# mkdir limit
[root@server1 ~]# cd limit
[root@server1 limit]# vim pod.yaml 
[root@server1 limit]# cat pod.yaml 
apiVersion: v1
kind: Pod
metadata:
  name: memory-demo
spec:
  containers:
  - name: memory-demo
    image: stress
    args:
    - --vm
    - "1"
    - --vm-bytes
    - 200M
    resources:
      requests:
        memory: 50Mi
      limits:
        memory: 100Mi
```

上述部署文件表示容器最小需要50Mi的内存，但是最多使用100Mi的内存，该容器的镜像使用stress消耗200Mi的内存，我们运行这个pod来查看状态：

```java
[root@server1 limit]# kubectl apply -f pod.yaml 
pod/memory-demo created
[root@server1 limit]# kubectl get pod -o wide
NAME                                      READY   STATUS      RESTARTS   AGE   IP             NODE      NOMINATED NODE   READINESS GATES
memory-demo                               0/1     OOMKilled   0          33s   10.244.1.109   server2   <none>           <none>
nfs-client-provisioner-6b66ddf664-2qf7m   1/1     Running     0          27m   10.244.2.98    server3   <none>           <none>
[root@server1 limit]# kubectl get pod -o wide
NAME                                      READY   STATUS             RESTARTS   AGE   IP             NODE      NOMINATED NODE   READINESS GATES
memory-demo                               0/1     CrashLoopBackOff   2          51s   10.244.1.109   server2   <none>           <none>
nfs-client-provisioner-6b66ddf664-2qf7m   1/1     Running            0          28m 
```

可以看出容器的状态为OOMKilled，之后变为CrashLoopBackOff，说明如果容器超过其内存限制，则会被终止。如果可重新启动，则与所有其他类型的运行时故障一样，kubelet 将重新启动它。

如果一个容器超过其内存请求，那么当节点内存不足时，它的 Pod 可能被逐出。

实验后删除：

```java
[root@server1 limit]# kubectl delete -f pod.yaml 
pod "memory-demo" deleted
```

而当我们将容器的资源限制提升到300Mi后该pod可以正常运行：

2.CPU限制示例

```java
[root@server1 limit]# vim pod1.yaml 
[root@server1 limit]# cat pod1.yaml 
apiVersion: v1
kind: Pod
metadata:
  name: cpu-demo
spec:
  containers:
  - name: cpu-demo
    image: stress
    resources:
      limits:
        cpu: "10"
      requests:
        cpu: "5"
    args:
    - -c
    - "2"
```

该部署文件表示该容器运行至少需要5个cpu，最大的限制为10个cpu，而我们主机只有2个cpu，因此运行该pod会出现pending的状态：

```java
[root@server1 limit]# kubectl apply -f pod1.yaml 
pod/cpu-demo created
[root@server1 limit]# kubectl get pod
NAME                                      READY   STATUS    RESTARTS   AGE
cpu-demo                                  0/1     Pending   0          4s
nfs-client-provisioner-6b66ddf664-2qf7m   1/1     Running   0          36m
[root@server1 limit]# kubectl get pod
NAME                                      READY   STATUS    RESTARTS   AGE
cpu-demo                                  0/1     Pending   0          5s
nfs-client-provisioner-6b66ddf664-2qf7m   1/1     Running   0          36m
[root@server1 limit]# kubectl get pod
NAME                                      READY   STATUS    RESTARTS   AGE
cpu-demo                                  0/1     Pending   0          6s
nfs-client-provisioner-6b66ddf664-2qf7m   1/1     Running   0          36m
```

我们使用以下命令查看pod的详细信息：

```java
[root@server1 limit]# kubectl describe pod cpu-demo 
```

可以看出调度失败的错误，调度失败的原因是申请的CPU资源超出集群节点所能提供的资源。

但CPU 使用率过高，不会被杀死

删除该pod：

```java
[root@server1 limit]# kubectl delete -f pod1.yaml 
pod "cpu-demo" deleted
```

当我们将cpu限制设置为最少0.5个最大2个cpu时pod就可以正常运行：

## 二、namespace资源限制

## 为namespace设置资源限制

```java
[root@server1 limit]# vim limitrange.yaml 
[root@server1 limit]# cat limitrange.yaml 
apiVersion: v1
kind: LimitRange
metadata:
  name: limitrange-memory
spec:
  limits:
  - default:
      cpu: 0.5
      memory: 512Mi
    defaultRequest:
      cpu: 0.1
      memory: 256Mi
    max:
      cpu: 1
      memory: 800Mi
    min:
      cpu: 0.1
      memory: 100Mi
    type: Container
```

上述部署文件的default字段和defaultRequest字段表示在默认（没有指定namespace所以是默认）的namespace中创建的pod如果没有指定资源限制，那么就将这两个字段作为pod的资源限制。

而pod指定了限制时，也不可以超过max字段定义的1个cpu和800Mi内存的限制，也不能低于0.1个cpu和100Mi的内存。

运行该部署文件：

```java
[root@server1 limit]# kubectl apply -f limitrange.yaml 
limitrange/limitrange-memory created
```

可以使用以下命令查看namespace资源限制：

```java
[root@server1 limit]# kubectl get limitranges 
NAME                CREATED AT
limitrange-memory   2020-05-08T18:20:12Z
[root@server1 limit]# kubectl describe limitranges 
Name:       limitrange-memory
Namespace:  default
Type        Resource  Min    Max    Default Request  Default Limit  Max Limit/Request Ratio
----        --------  ---    ---    ---------------  -------------  -----------------------
Container   cpu       100m   1      100m             500m           -
Container   memory    100Mi  800Mi  256Mi            512Mi          -
```

设置的限制都可以查看到。

**需要注意的是：LimitRange 在 namespace 中施加的最小和最大内存限制只有在创建和更新 Pod 时才会被应用。改变 LimitRange 不会对之前创建的 Pod 造成影响。**

实验后删除限制：

```java
[root@server1 limit]# kubectl delete -f limitrange.yaml 
limitrange "limitrange-memory" deleted
```

## 为namespace设置资源配额

这个配额定义的是该namespace中所有pod资源的总和上限

```java
[root@server1 limit]# vim quota.ayml
[root@server1 limit]# \vi quota.ayml 
[root@server1 limit]# cat quota.ayml 
apiVersion: v1
kind: ResourceQuota
metadata:
  name: mem-cpu-demo
spec:
  hard:
    requests.cpu: "1"
    requests.memory: 1Gi
    limits.cpu: "2"
    limits.memory: 2Gi
```

创建的ResourceQuota对象将在default名字空间中添加以下限制：

```java
每个容器必须设置内存请求（memory request），内存限额（memory limit），cpu请求（cpu request）和cpu限额（cpu limit）。
所有容器的内存请求总额不得超过1 GiB。
所有容器的内存限额总额不得超过2 GiB。
所有容器的CPU请求总额不得超过1 CPU。
所有容器的CPU限额总额不得超过2 CPU。
```

创建后查看设置的配额：

```java
[root@server1 limit]# kubectl create -f quota.ayml 
resourcequota/mem-cpu-demo created
[root@server1 limit]# kubectl describe resourcequotas 
Name:            mem-cpu-demo
Namespace:       default
Resource         Used  Hard
--------         ----  ----
limits.cpu       0     2
limits.memory    0     2Gi
requests.cpu     0     1
requests.memory  0     1Gi
```

可以看出没有以使用的资源，同时需要注意的是我们创建pod时必须指定所有的资源限制（memory request，memory limit，cpu request和cpu limit），否则将会不能创建：

```java
[root@server1 limit]# vim pod.yaml 
[root@server1 limit]# cat pod.yaml 
apiVersion: v1
kind: Pod
metadata:
  name: memory-demo
spec:
  containers:
  - name: memory-demo
    image: nginx
[root@server1 limit]# kubectl apply -f pod.yaml 
Error from server (Forbidden): error when creating "pod.yaml": pods "memory-demo" is forbidden: failed quota: mem-cpu-demo: must specify limits.cpu,limits.memory,requests.cpu,requests.memory
```

可以看出创建时提示forbidden，并且提醒我们设置资源限制。

当我们设置了资源限制后创建时：

```java
[root@server1 limit]# vim pod1.yaml 
[root@server1 limit]# cat pod1.yaml 
apiVersion: v1
kind: Pod
metadata:
  name: cpu-demo
spec:
  containers:
  - name: cpu-demo
    image: nginx
    resources:
      limits:
        cpu: "1"
        memory: 512Mi
      requests:
        cpu: "0.5"
        memory: 256Mi
```

```java
[root@server1 limit]# kubectl apply -f pod1.yaml 
pod/cpu-demo configured
[root@server1 limit]# kubectl get pod
NAME                                      READY   STATUS    RESTARTS   AGE
cpu-demo                                  1/1     Running   3          44s
nfs-client-provisioner-6b66ddf664-2qf7m   1/1     Running   0          61m
```

可以成功创建，此时我们再查看配额情况：

```java
[root@server1 limit]# kubectl describe resourcequotas 
Name:            mem-cpu-demo
Namespace:       default
Resource         Used   Hard
--------         ----   ----
limits.cpu       1      2
limits.memory    512Mi  2Gi
requests.cpu     500m   1
requests.memory  256Mi  1Gi
```

可以看出在Used那一列正是我们在pod中设置的资源限制，再次创建pod将会在这一列上累加，但是不能超过配额，即Hard那一列。

实验后删除：

```java
[root@server1 limit]# kubectl delete -f quota.ayml
resourcequota "mem-cpu-demo" deleted
```

## 为 Namespace 配置Pod配额

```java
[root@server1 limit]# vim limitpod.yaml 
[root@server1 limit]# cat limitpod.yaml 
apiVersion: v1
kind: ResourceQuota
metadata:
  name: pod-demo
spec:
  hard:
    pods: "2"
```

设置Pod配额以限制可以在namespace中运行的Pod数量。 上述部署文件表示在默认的namespace上最多只能运行2个pod。

创建pod配额：

```java
[root@server1 limit]# kubectl apply -f limitpod.yaml 
resourcequota/pod-demo created
```

可以使用以下命令查看设置的配额：

```java
[root@server1 limit]# kubectl get resourcequotas 
NAME           AGE   REQUEST                                            LIMIT
mem-cpu-demo   19m   requests.cpu: 500m/1, requests.memory: 256Mi/1Gi   limits.cpu: 1/2, limits.memory: 512Mi/2Gi
pod-demo       12s   pods: 2/2     
[root@server1 limit]# kubectl describe resourcequotas pod-demo 
Name:       pod-demo
Namespace:  default
Resource    Used  Hard
--------    ----  ----
pods        2     2
```

可以看出配额已经全部使用完，此时我们再创建pod：

```java
[root@server1 limit]# vim pod1.yaml 
[root@server1 limit]# cat pod1.yaml 
apiVersion: v1
kind: Pod
metadata:
  name: cpu-demo-1
spec:
  containers:
  - name: cpu-demo
    image: nginx
    resources:
      limits:
        cpu: "1"
        memory: 512Mi
      requests:
        cpu: "0.5"
        memory: 256Mi
[root@server1 limit]# kubectl apply -f pod1.yaml 
Error from server (Forbidden): error when creating "pod1.yaml": pods "cpu-demo-1" is forbidden: exceeded quota: pod-demo, requested: pods=1, used: pods=2, limited: pods=2
```

创建失败，提示原因是pod数量超出配额。

接下来我们创建一个namespace test：

```java
[root@server1 limit]# kubectl create namespace test
namespace/test created
[root@server1 limit]# kubectl get namespaces 
NAME              STATUS   AGE
default           Active   21d
ingress-nginx     Active   17d
kube-node-lease   Active   21d
kube-public       Active   21d
kube-system       Active   21d
test              Active   6s
```

将pod运行在新的namespace即可：

```java
[root@server1 limit]# kubectl apply -f pod1.yaml -n test
pod/cpu-demo-1 created
nfs-client-provisioner-6b66ddf664-2qf7m   1/1     Running   0          67m
[root@server1 limit]# kubectl get pod -n test
NAME         READY   STATUS    RESTARTS   AGE
cpu-demo-1   1/1     Running   0          14s
```

实验后删除设置的配额以及运行的pod：

```java
[root@server1 limit]# kubectl delete namespaces test
namespace "test" deleted
[root@server1 limit]# kubectl delete -f limitpod.yaml 
resourcequota "pod-demo" deleted
[root@server1 limit]# kubectl delete -f quota.ayml
resourcequota "mem-cpu-demo" deleted
[root@server1 limit]# kubectl get pod
NAME                                      READY   STATUS    RESTARTS   AGE
cpu-demo                                  1/1     Running   3          7m29s
nfs-client-provisioner-6b66ddf664-2qf7m   1/1     Running   0          68m
[root@server1 limit]# kubectl delete pod cpu-demo 
pod "cpu-demo" deleted
```
