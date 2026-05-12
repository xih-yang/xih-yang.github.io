# 13、Kubernetes - 实战：存储（StatefulSet 控制器）
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/5/13.html
- 分类：容器服务
- 分组：教程目录
## 一、StatefulSets简介

StatefulSet 是用来管理有状态应用的工作负载 API 对象（比如mysql集群的主从就是状态，每一个服务器都有自己的配置，角色不能因为重启发生改变，就要用statefulset来维持）。

StatefulSet 用来管理 Deployment 和扩展一组 Pod，并且能为这些 **Pod 提供序号和唯一性保证**。

和Deployment 相同的是，StatefulSet 管理了基于相同容器定义的一组 Pod。但和 Deployment 不同的是，StatefulSet 为它们的每个 Pod 维护了一个**固定的 ID**。这些 Pod 是基于相同的声明来创建的，但是不能相互替换：无论怎么调度，**每个 Pod 都有一个永久不变的 ID**。

StatefulSet 和其他控制器使用相同的工作模式。你在 StatefulSet 对象 中定义你期望的状态，然后 StatefulSet 的 控制器 就会通过各种更新来达到那种你想要的状态。

**StatefulSets 对于需要满足以下一个或多个需求的应用程序很有价值**：

稳定的、唯一的网络标识符。

稳定的、持久的存储。

有序的、优雅的部署和缩放。

有序的、自动的滚动更新。

在上面，稳定意味着 Pod 调度或重调度的整个过程是有持久性的。如果应用程序不需要任何稳定的标识符或有序的部署、删除或伸缩，则应该使用由一组无状态的副本控制器提供的工作负载来部署应用程序，比如 Deployment 或者 ReplicaSet 可能更适用于您的无状态应用部署需要。

给定Pod 的存储必须由 PersistentVolume 驱动 基于所请求的 storage class 来提供，或者由管理员预先提供。

删除或者收缩 StatefulSet 并不会删除它关联的存储卷。这样做是为了保证数据安全，它通常比自动清除 StatefulSet 所有相关的资源更有价值。

StatefulSet 当前需要 headless 服务 来负责 Pod 的网络标识。您需要负责创建此服务。

当删除StatefulSets 时，StatefulSet 不提供任何终止 Pod 的保证。为了实现 StatefulSet 中的 Pod 可以有序和优雅的终止，可以在删除之前将 StatefulSet 缩放为 0。

在默认Pod 管理策略(OrderedReady) 时使用 滚动更新，可能进入需要 人工干预 才能修复的损坏状态。

StatefulSet将应用状态抽象成了两种情况：

```java
拓扑状态：应用实例必须按照某种顺序启动。新创建的Pod必须和原来Pod的网络标识一样
存储状态：应用的多个实例分别绑定了不同存储数据。
```

StatefulSet给所有的Pod进行了编号，编号规则是： ( s t a t e f u l s e t 名 称 ) − (statefulset名称)- (statefulset名称)−(序号)，从0开始。

Pod被删除后重建，重建Pod的网络标识也不会改变,Pod的拓扑状态按照Pod的“名字+编号”的方式固定下来,并且为每个Pod提供了一个固定且唯一的访问入口,即Pod对应的DNS记录，同时重建时保证每个pod挂载到原来的卷上。

## 二、StatefulSet通过Headless Service维持Pod的拓扑状态

statefulset可以维持pod的名字id不变，但ip会变，利用Headless Service就可以通过名字访问

首先创建Headless service：

```java
[root@server1 pv]# mkdir statefulset
[root@server1 pv]# cd statefulset/
[root@server1 statefulset]# vim service.yaml
[root@server1 statefulset]# cat service.yaml 
apiVersion: v1
kind: Service
metadata:
 name: nginx
 labels:
  app: nginx
spec:
 ports:
 - port: 80
   name: web
 clusterIP: None
 selector:
  app: nginx
```

创建服务：

```java
[root@server1 statefulset]# kubectl apply -f service.yaml 
service/nginx created
[root@server1 statefulset]# kubectl get service
NAME         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
kubernetes   ClusterIP   10.96.0.1       <none>        443/TCP   19d
myservice    ClusterIP   10.101.31.155   <none>        80/TCP    14d
nginx        ClusterIP   None            <none>        80/TCP    13s
```

可以看出创建了一个名为nginx的无头服务（Headless service）。

创建使用StatefulSet控制器的pod：

```java
[root@server1 statefulset]# vim deployment.yaml 
[root@server1 statefulset]# cat deployment.yaml 
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
   labels:
    app: nginx
  spec:
   containers:
   - name: nginx
     image: nginx
     ports:
     - containerPort: 80
       name: web
[root@server1 statefulset]# 
[root@server1 statefulset]# kubectl apply -f deployment.yaml 
statefulset.apps/web created
[root@server1 statefulset]# 
[root@server1 statefulset]# kubectl get pod
NAME                                      READY   STATUS    RESTARTS   AGE
nfs-client-provisioner-6b66ddf664-zjvtv   1/1     Running   0          31m
web-0                                     1/1     Running   0          29s
web-1                                     1/1     Running   0          26s
```

可以看出创建了两个名为web-0和web-1的pod，service也会由两个endpoint：

其中pod名称中的0和1是pod的唯一标识。

当我们将replicas改为1时，web-1将会被回收，而当我们将replicas改为0时，所有pod将会被回收：

```java
[root@server1 statefulset]# vim deployment.yaml 
[root@server1 statefulset]# cat deployment.yaml 
更改：
 replicas: 2
[root@server1 statefulset]# kubectl apply -f deployment.yaml 
statefulset.apps/web configured
[root@server1 statefulset]# kubectl get pod
NAME                                      READY   STATUS              RESTARTS   AGE
nfs-client-provisioner-6b66ddf664-zjvtv   1/1     Running             0          35m
web-0                                     0/1     ContainerCreating   0          2s
[root@server1 statefulset]# kubectl get pod
^[[3~NAME                                      READY   STATUS    RESTARTS   AGE
nfs-client-provisioner-6b66ddf664-zjvtv   1/1     Running   0          35m
web-0                                     1/1     Running   0          9s
web-1                                     1/1     Running   0          7s
[root@server1 statefulset]# kubectl get pod -o wide
NAME                                      READY   STATUS    RESTARTS   AGE   IP            NODE      NOMINATED NODE   READINESS GATES
nfs-client-provisioner-6b66ddf664-zjvtv   1/1     Running   0          35m   10.244.1.81   server2   <none>           <none>
web-0                                     1/1     Running   0          28s   10.244.2.72   server3   <none>           <none>
web-1                                     1/1     Running   0          26s   10.244.1.83   server2   <none>           <none>
```

可以看出重新创建时是先创建web-0再创建web-1，而删除的时候是先删除web-1，再删除web-0.

但是需要注意的是虽然名称标识没有变，但是pod的ip发生了变化。

现在可以直接访问服务：

利用kube-dns可以解析地址：

也可以使用nslookup web-1.nginx的方式解析和访问到：

PV和PVC的设计，使得StatefulSet对存储状态的管理成为了可能，现在为以上这些pod添加存储

```java
[root@server1 statefulset]# vim deployment.yaml 
[root@server1 statefulset]# cat deployment.yaml 
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
   labels:
    app: nginx
  spec:
   containers:
   - name: nginx
     image: nginx
     ports:
     - containerPort: 80
       name: web
     volumeMounts:
       - name: www
         mountPath: /usr/share/nginx/html
 volumeClaimTemplates:
  - metadata:
     name: www
    spec:
     storageClassName: managed-nfs-storage			#分配器名称
     accessModes:
     - ReadWriteOnce
     resources:
      requests:
       storage: 100Mi
[root@server1 statefulset]# 
[root@server1 statefulset]# kubectl apply -f deployment.yaml 
statefulset.apps/web created
[root@server1 statefulset]# kubectl get pod -o wide
NAME                                      READY   STATUS    RESTARTS   AGE   IP            NODE      NOMINATED NODE   READINESS GATES
nfs-client-provisioner-6b66ddf664-zjvtv   1/1     Running   0          85m   10.244.1.81   server2   <none>           <none>
test                                      1/1     Running   2          48m   10.244.2.73   server3   <none>           <none>
web-0                                     1/1     Running   0          25s   10.244.1.84   server2   <none>           <none>
web-1                                     1/1     Running   0          20s   10.244.2.74   server3   <none>           <none>
```

StatefulSet还会为每一个Pod分配并创建一个同样编号的PVC。这样，kubernetes就可以通过Persistent Volume机制为这个PVC绑定对应的PV，从而保证每一个Pod都拥有一个独立的Volume：

```java
[root@server1 statefulset]# kubectl get pvc
NAME        STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS          AGE
www-web-0   Bound    pvc-41713073-508d-4dcf-897e-dd0575a0945a   100Mi      RWO            managed-nfs-storage   2m30s
www-web-1   Bound    pvc-36ac2b3c-2f82-452e-ad39-bab2a51e67c6   100Mi      RWO            managed-nfs-storage   2m25s
[root@server1 statefulset]# kubectl get pv
NAME                                       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM               STORAGECLASS          REASON   AGE
pvc-36ac2b3c-2f82-452e-ad39-bab2a51e67c6   100Mi      RWO            Delete           Bound    default/www-web-1   managed-nfs-storage            2m28s
pvc-41713073-508d-4dcf-897e-dd0575a0945a   100Mi      RWO            Delete           Bound    default/www-web-0   managed-nfs-storage            2m33s
```

可以往这些存储里写入测试页面：

```java
[root@server1 statefulset]# ls /nfs/
default-www-web-0-pvc-41713073-508d-4dcf-897e-dd0575a0945a
default-www-web-1-pvc-36ac2b3c-2f82-452e-ad39-bab2a51e67c6
[root@server1 statefulset]# 
[root@server1 statefulset]# echo web-0 > /nfs/default-www-web-0-pvc-41713073-508d-4dcf-897e-dd0575a0945a/index.html
[root@server1 statefulset]# echo web-1 > /nfs/default-www-web-1-pvc-36ac2b3c-2f82-452e-ad39-bab2a51e67c6/index.html
```

测试解析和访问：

```java
[root@server1 statefulset]# kubectl attach test -it
/ nslookup nginx
Server:    10.96.0.10
Address 1: 10.96.0.10 kube-dns.kube-system.svc.cluster.local
Name:      nginx
Address 1: 10.244.1.84 web-0.nginx.default.svc.cluster.local
Address 2: 10.244.2.74 10-244-2-74.myservice.default.svc.cluster.local
```

可以看出解析成功。

```java
/ curl nginx
web-1
/ curl nginx
web-1
/ curl nginx
web-0
/ curl nginx
web-0
/ curl nginx
web-1
/ curl nginx
web-0
/ curl web-1.nginx			#访问特定pod
web-1
/ curl web-0.nginx
web-0
```

访问可以成功负载。

而当我们将replicas改为0后，StatefulSet会将pod从2 ，1，0有序删除。

```java
[root@server1 statefulset]# vim deployment.yaml 
[root@server1 statefulset]# cat deployment.yaml 
更改：
 replicas: 0
[root@server1 statefulset]# kubectl apply -f deployment.yaml 
statefulset.apps/web configured
[root@server1 statefulset]# kubectl get pod
NAME                                      READY   STATUS    RESTARTS   AGE
nfs-client-provisioner-6b66ddf664-zjvtv   1/1     Running   0          94m
test                                      1/1     Running   5          57m
```

删除后进行pod的重建：

```java
[root@server1 statefulset]# vim deployment.yaml 
[root@server1 statefulset]# cat deployment.yaml 
更改：
 replicas: 3
[root@server1 statefulset]# kubectl apply -f deployment.yaml 
statefulset.apps/web configured
```

重键后测试访问：

```java
[root@server1 statefulset]# kubectl attach test -it
/ curl web-0.nginx
web-0
/ curl web-1.nginx
web-1
/ curl web-2.nginx
web-2
```

依然可以成功访问，这就验证了StatefulSet 控制器的特性。

最后将replicas改为0删除所有pod。
