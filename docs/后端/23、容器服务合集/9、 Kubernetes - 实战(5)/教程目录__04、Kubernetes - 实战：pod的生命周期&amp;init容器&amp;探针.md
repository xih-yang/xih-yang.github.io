# 04、Kubernetes - 实战：pod的生命周期&amp;init容器&amp;探针
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/5/4.html
- 分类：容器服务
- 分组：教程目录
## 一、pod的生命周期

Pod 是 kubernetes 系统的基础单元，是由用户创建或部署的最小组件，也是 kubernetes 系统上运行容器化应用的资源对象

pod可以包含多个容器，应用运行在这些容器里面，同时pod也可以有一个或多个先于应用容器启动的init容器。、

## 二、init容器介绍

Pod可以包含多个容器，应用运行在这些容器里面，同时 Pod 也可以有一个或多个先于应用容器启动的 Init 容器。

Init 容器与普通的容器非常像，除了如下三点：

```java
它们总是运行到完成。
Init 容器不支持 Readiness，因为它们必须在 Pod 就绪之前运行完成。
每个 Init 容器必须运行成功，下一个才能够运行。
```

如果Pod 的 Init 容器失败，Kubernetes 会不断地重启该 Pod，直到 Init 容器成功为止。然而，如果 Pod 对应的 restartPolicy 值为 Never，它不会重新启动。

## Init 容器作用

Init 容器可以包含一些安装过程中应用容器中不存在的实用工具或个性化代码。

Init 容器可以安全地运行这些工具，避免这些工具导致应用镜像的安全性降低。

应用镜像的创建者和部署者可以各自独立工作，而没有必要联合构建一个单独的应用镜像。

Init 容器能以不同于Pod内应用容器的文件系统视图运行。因此，Init容器可具有访问 Secrets 的权限，而应用容器不能够访问。

由于 Init 容器必须在应用容器启动之前运行完成，因此 Init 容器提供了一种机制来阻塞或延迟应用容器的启动，直到满足了一组先决条件。一旦前置条件满足，Pod内的所有的应用容器会并行启动。

## init容器实验

```java
[root@server1 manifest]# vim init.yaml
[root@server1 manifest]# cat init.yaml 
apiVersion: v1
kind: Pod
metadata:
  name: myapp-pod
  labels:
    app: myapp
spec:
  containers:
    - name: myapp-container
      image: myapp:v1
  initContainers:
    - name: init-container
      image: busybox
      command: ["/bin/sh", "-c", "until nslookup myservice.default.svc.cluster.local; do echo waiting for myservice; sleep 2; done"]
```

其中init容器种执行的命令是用来检测default 命名空间的解析，这个解析需要一个service，即init容器在运行时会检测service，若果service没有运行的话就会一直处于初始化状态。

我们先来运行一下这个pod：

```java
[root@server1 manifest]# kubectl create -f init.yaml 
pod/myapp-pod created
[root@server1 manifest]# kubectl get pod
NAME        READY   STATUS     RESTARTS   AGE
myapp-pod   0/1     Init:0/1   0          83s
```

可以看出pod一直处于初始化状态。

现在进入容器内部查看解析：

```java
[root@server1 manifest]# kubectl exec -it myapp-pod -c init-container -- sh
/ nslookup myservice.default.svc.cluster.local
Server:		10.96.0.10
Address:	10.96.0.10:53
** server can't find myservice.default.svc.cluster.local: NXDOMAIN
^C
/ 
```

可以看出果然没有解析。

接下来我们创建一个service：

```java
[root@server1 manifest]# vim service.yaml 
[root@server1 manifest]# cat service.yaml 
kind: Service
apiVersion: v1
metadata:
  name: myservice
spec:
  ports:
    - protocol: TCP
      port: 80
      targetPort: 9376
[root@server1 manifest]# kubectl create -f service.yaml 
service/myservice created
[root@server1 manifest]# kubectl get svc
NAME         TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)   AGE
kubernetes   ClusterIP   10.96.0.1        <none>        443/TCP   2d4h
myservice    ClusterIP   10.109.148.189   <none>        80/TCP    9s
```

创建service成功，之后再查看pod状态：

```java
[root@server1 manifest]# kubectl get pod -o wide
NAME        READY   STATUS    RESTARTS   AGE   IP            NODE      NOMINATED NODE   READINESS GATES
myapp-pod   1/1     Running   0          53s   10.244.2.18   server3   <none>           <none>
```

可以看出已经处于运行状态，同样我们可以访问它：

[

```java
root@server1 manifest]# curl 10.244.2.18
Hello MyApp | Version: v1 | <a href="hostname.html">Pod Name</a>
```

之后再进入容器查看解析：

```java
[root@server1 manifest]# kubectl run test -it  --image=radial/busyboxplus
If you don't see a command prompt, try pressing enter.
/ nslookup myservice.default.svc.cluster.local
Server:    10.96.0.10
Address 1: 10.96.0.10 kube-dns.kube-system.svc.cluster.local
Name:      myservice.default.svc.cluster.local
Address 1: 10.109.148.189 myservice.default.svc.cluster.local
/ 
```

果然解析成功。

因此可以验证如果 Pod 的 Init 容器失败，Kubernetes 会不断地重启该 Pod，直到 Init 容器成功为止。

实验完成后删除：

```java
[root@server1 manifest]# kubectl delete pod test
[root@server1 manifest]# kubectl delete pod myapp-pod 
[root@server1 manifest]# kubectl delete svc myservice
```

## 三、探针

## 理解探针

容器探针用来检测主容器的运行状态。

在pod生命周期中可以做的一些事情。主容器启动前可以完成初始化容器，初始化容器可以有多个，他们是串行执行的，执行完成后就退出了，在主程序刚刚启动的时候可以指定一个post start 主程序启动开始后执行一些操作，在主程序结束前可以指定一个 pre stop 表示主程序结束前执行的一些操作。在程序启动后可以做两类常用检测 liveness probe（存活性探测） 和 readness probe（就绪性探测）

探针是由 kubelet 对容器执⾏的定期诊断。 要执⾏诊断， kubelet 调⽤由容器实现的 Handler。

## 有三种类型的探测方式：

```java
ExecAction： 在容器内执⾏指定命令。 如果命令退出时返回码为 0 则认为诊断成功。
TCPSocketAction： 对指定端⼝上的容器的 IP 地址进⾏ TCP 检查。 如果端⼝打开， 则诊断被认为是成功的
HTTPGetAction： 对指定的端⼝和路径上的容器的 IP 地址执⾏ HTTP Get 请求。 如果响应的状态码⼤于等于200且⼩于400， 则诊断被认为是成功的。
```

## 每次探测都将获得以下三种结果之一

：

```java
成功：容器通过了诊断。
失败：容器未通过诊断。
未知：诊断失败，因此不会采取任何行动。
```

Kubelet 可以选择是否执行在容器上运行的两种探针执行和做出反应：

```java
livenessProbe：指示容器是否正在运行。如果存活探测失败，则 kubelet 会杀死容器，并且容器将受到其 重启策略的影响。如果容器不提供存活探针，则默认状态为 Success。
readinessProbe：指示容器是否准备好服务请求。如果就绪探测失败，端点控制器将从与 Pod 匹配的所有 Service 的端点中删除该 Pod 的 IP 地址。初始延迟之前的就绪状态默认为 Failure。如果容器不提供就绪探针，则默认状态为 Success。
startupProbe: 指示容器中的应用是否已经启动。如果提供了启动探测(startup probe)，则禁用所有其他探测，直到它成功为止。如果启动探测失败，kubelet 将杀死容器，容器服从其重启策略进行重启。如果容器没有提供启动探测，则默认状态为成功Success。
```

## 重启策略

PodSpec 中有一个 restartPolicy 字段，可能的值为 Always、OnFailure 和 Never。默认为 Always。

## livenessProbe存活探测示例

编辑以下yaml文件：

```java
[root@server1 manifest]# vim liveness.yaml
[root@server1 manifest]# cat liveness.yaml 
apiVersion: v1
kind: Pod
metadata:
  name: liveness-http
spec:
  containers:
    - name: myapp
      image: ikubernetes/myapp:v1
      imagePullPolicy: IfNotPresent
      livenessProbe:
        tcpSocket:
          port: 8080
        initialDelaySeconds: 1
        periodSeconds: 3
        timeoutSeconds: 1
```

以上使用tcpsock检测容器8080端口，若liveness探针没有检测到8080端口则判定为不存活。由于我们运行的容器只暴露出来80端口，因此会检测失败。其中：

```java
initialDelaySeconds: 1表示pod运行1s后检测状态。
periodSeconds: 3表示每3s检测一次。
timeoutSeconds: 1表示检测1s后即超时进行下次检测
```

之后运行并查看状态：

```java
[root@server1 manifest]# kubectl create -f liveness.yaml 
pod/liveness-http created
[root@server1 manifest]# kubectl get pod
NAME            READY   STATUS    RESTARTS   AGE
liveness-http   1/1     Running   0          10s
[root@server1 manifest]# kubectl get pod
NAME            READY   STATUS             RESTARTS   AGE
liveness-http   0/1     CrashLoopBackOff   2          51s
[root@server1 manifest]# kubectl get pod
NAME            READY   STATUS    RESTARTS   AGE
liveness-http   1/1     Running   3          54s
[root@server1 manifest]# kubectl get pod
NAME            READY   STATUS    RESTARTS   AGE
liveness-http   1/1     Running   3          56s
[root@server1 manifest]# kubectl get pod
NAME            READY   STATUS    RESTARTS   AGE
liveness-http   1/1     Running   3          61s
```

可以看出检测失败一直在重启。

接下来我们将检测端口改为80端口再运行：

```java
[root@server1 manifest]# kubectl delete -f liveness.yaml 
[root@server1 manifest]# vim liveness.yaml
[root@server1 manifest]# cat liveness.yaml 
apiVersion: v1
kind: Pod
metadata:
  name: liveness-http
spec:
  containers:
    - name: myapp
      image: ikubernetes/myapp:v1
      imagePullPolicy: IfNotPresent
      livenessProbe:
        tcpSocket:
          port: 80
        initialDelaySeconds: 1
        periodSeconds: 3
        timeoutSeconds: 1
[root@server1 manifest]# kubectl create -f liveness.yaml 
pod/liveness-http created
[root@server1 manifest]# kubectl get pod
NAME            READY   STATUS    RESTARTS   AGE
liveness-http   1/1     Running   0          23s
```

可以看出启动成功，在运行状态。

实验后删除：

```java
[root@server1 manifest]# kubectl delete -f liveness.yaml 
```

## readinessProbe就绪检测示例：

编辑测试文件：

```java
[root@server1 manifest]# vim reainess.yaml 
[root@server1 manifest]# cat reainess.yaml 
apiVersion: v1
kind: Pod
metadata:
  name: readiness-http
spec:
  containers:
    - name: readiness
      image: nginx
      readinessProbe:
        httpGet:
          path: /test.html
          port: 80
        initialDelaySeconds: 1
        periodSeconds: 3
        timeoutSeconds: 1
```

以上使用httpGet的方式使用readinessProbe进行探测，表示在容器运行后检测test.html发布文件内容，若返回200到400之间的状态码则检测通过为READY状态，其他为不通过。

运行pod，并查看状态：

```java
[root@server1 manifest]# kubectl create -f reainess.yaml 
pod/readiness-http created
[root@server1 manifest]# kubectl get pod
NAME             READY   STATUS    RESTARTS   AGE
readiness-http   0/1     Running   0          51s
[root@server1 manifest]# kubectl get pod
NAME             READY   STATUS    RESTARTS   AGE
readiness-http   0/1     Running   0          60s
```

可以看出是运行状态但是并不是READY状态，可以看出检测没有通过。

```java
 [root@server1 manifest]# kubectl describe pod readiness-http
```

查看日志：

```java
[root@server1 manifest]# kubectl logs readiness-http
```

此时我们进入容器添加test.html发布文件：

```java
[root@server1 manifest]# kubectl exec -it readiness-http -- sh
# echo redhat > /usr/share/nginx/html/test.html
# 
```

查看pod状态：

```java
[root@server1 manifest]# kubectl get pod
NAME             READY   STATUS    RESTARTS   AGE
readiness-http   1/1     Running   0          2m37s
```

可以看出已经是READY状态了。

可以看出就绪探针的作用了，即指示容器是否准备好服务请求。

实验后删除：

```java
[root@server1 manifest]# kubectl delete -f reainess.yaml 
```
