# 12、Kubernetes 实战 - Pod生命周期
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/3/12.html
- 分类：容器服务
- 分组：教程目录
## 前言

pod的生命周期

## 第一节 Pod生命周期

我们一般将Pod对象从创建至终的这段时间范围称为pod的生命周期，它主要包含下面的过程

- pod创建过程
- 运行初始化容器(init container)过程
- 运行主容器(main container)过程
- 容器启动后钩子(post start)、容器终止前钩子(pre stop)
- 容器的存活性探测(liveness probe)、就绪性探测(readiness probe)
- pod终止过程

在整个生命周期中，**Pod会出现5种状态**，分布如下
- 挂起(Pending): apiserver已经创建了pod资源对象，但它尚未被调度完成或者仍处于下载镜像的过程种
- 运行中（Running）: pod已经被调度到某个节点，并且所有容器都已经被kubelet创建完成
- 成功(Succeeded): pod种所有的容器都已经成功终止并且不会被重启
- 失败(Failed)： 所有容器都已经终止，但至少有一个容器终止失败，即容器返回了非0值的退出状态
- 未知(Unknown)：apiserver无法正常获取到pod对象的状态信息，通常由网络通信失败导致

## 第二节 创建和终止

### 1. pod的创建过程

**1、** 用户通过kubectl或者其它api客户端提交需要创建的pod信息给apiServer；

**2、** apiServer开始生成pod对象的信息，并将信息存入etcd，然后返回确认信息至客户端；

**3、** apiServer开始反映etcd中的pod对象的变化，其它组件使用watch机制来跟踪检查apiServer上的变动；

**4、** scheduler发现有新的pod对象需要创建，开始为pod分配主机并将结果信息更新至apiServer；

**5、** node节点上的kubelet发现有pod调度过来，尝试调用docker启动容器，并将结果返回至apiServer；

**6、** apiServer将接收到的pod状态信息存入etcd中；

### 2. pod的终止过程

**1、** 用户向apiServer发送删除pod对象的命令；

**2、** apiServer中的pod对象信息会随着时间的推移而更新，在宽限器内(默认30秒)，pod被视为dead；

**3、** 将pod标记为terminating状态；

**4、** kubelet在监控到pod对象转为terminating状态的同时启动pod关闭过程；

**5、** 端点控制器监控到pod对象的关闭行为时将其从所有匹配到此端点的service资源的端点列表中移除；

**6、** 如果当前pod对象定义了preStop钩子处理器，则在标记为terminating后即会以同步的方式启动执行；

**7、** pod对象中的容器进程收到停止信号；

**8、** 宽限期结束后，若pod中还存在仍在运行的进程，那么pod对象会收到立即终止的信号；

**9、** kubelet请求apiServer将此pod资源的宽限期设置为0从而完成删除操作，此时pod对于用户已不可见；

## 第三节 初始化容器

初始化容器是pod的主容器启动之前要运行的容器，主要是做一些主容器的前置工作，它具有两大特征

**1、** 初始化容器必须运行完成直至结束，若某初始化容器运行失败，那么kubenetes需要重新启动它知道成功完成；

**2、** 初始化容器必须按照定义的顺序执行，当且仅当前一个成功之后，后面的一个才能运行；

初始化容器有很多的应用场景，下面列出的是最场景的几个

- 提供主容器镜像中不具备的工具程序或自定义代码
- 初始化容器要先于应用容器串行启动并运行完成，因此可用于延后应用的启动直至其依赖的条件得到满足

接下来做一个案例，模拟下面这个需求

假设要以主容器运行nginx，但是要求在运行nginx之前要先把能够连接上的mysql和redis所在的服务器。

为了简化测试，实现规定好mysql(192.168.111.201)和redis(192.168.111.201)服的地址

创建pod-initcontainer.yaml，内容如下

```java
apiVersion: v1
kind: Pod
metadata:
  name: pod-initcontainer
  namespace: dev
spec:
  containers:
    - name: main-container
      image: nginx:1.17.1
      ports:
        - name: nginx-port
          containerPort: 80
  initContainers:
    - name: test-mysql
      image: busybox:1.30
      command: ['sh','-c','until ping 192.168.88.201 -c 1 ; do echo waiting for mysql...;sleep 2;done;']
    - name: test-redis
      image: busybox:1.30
      command: ['sh','-c','until ping 192.168.88.202 -c 1 ; do echo waiting for redis...;sleep 2;done;']
```

创建pod

```java
kubectl create -f pod-initcontainer.yaml
```

动态监听 -w

```java
kubectl get pods pod-initcontainer  -n dev -w
```

此时新开一个窗口，我们添加两个ip

```java
[root@master ~]# ifconfig ens33:1 192.168.88.201 netmask 255.255.255.0 up
```

发现pod已经初始化完成了。

添加第二个ip，可以看到command命令执行成功，可以ping两个ip，pod初始化完成。

```java
ifconfig ens33:2 192.168.88.202 netmask 255.255.255.0 up
```

## 第四节 钩子函数

钩子函数能够感知自身生命周期中的事件，并在相应的时刻来到时运行用户指定的程序代码。

kubernetes在主容器的启动之后和停止之前提供了两个钩子函数

- post start:：容器创建之后执行，如果失败了会重启容器
- pre stop ：容器终止之前执行，执行完成之后容器将成功终止，在其完成之前会阻塞删除容器的操作

钩子处理器支持使用下面三种方式定义动作：

- Exec命令：在容器内执行一次

```java
....
  lifecycle:
    postStart:
      exec:
        command:
        - cat
        - /tmp/healthy
  ....
```

- TCPSocket: 在当前容器尝试访问指定的socket

```java
....
  lifecycle:
    postStart:
      tcpSocket:
        port: 8080
....
```

- HTTPGet: 在当前容器中向某url发起http请求

```java
....
  lifecycle:
    postStart:
      httpGet:
        path: /URI地址
        port: 80
        host: 192.168.88.100主机地址
        scheme: HTTP支持的协议http或https
....
```

> 这里只演示exec方式，在下一节 容器探测 全部介绍
>
> 接下来，以exec方式为例，演示钩子函数的使用，创建pod-hook-exec.yaml文件，内容如下

```java
apiVersion: v1
kind: Pod
metadata:
  name: pod-hook-exec
  namespace: dev
spec:
  containers:
    - name: main-container
      image: nginx:1.17.1
      ports:
        - name: nginx-port
          containerPort: 80
      lifecycle:
        postStart:
          exec:
            command: ["/bin/sh","-c","echo post Start... > /usr/share/nginx/html/index.html"]
        preStop:
          exec:
            command: ["/usr/sbin/nginx","-s","quit"]
```

创建pod

```java
kubectl create -f pod-hook-exec.yaml
```

查看pod

```java
kubectl get pods pod-hook-exec -n dev -o wide
```

访问curl 10.244.2.16:80

查看如何配置

```java
kubectl explain pod.spec.containers.lifecycle
```

## 第五节 容器探测

容器探测用于检测容器中的应用示例是否正常工作，是保障业务可用性的一种传统机制。如果经过探测，示例的状态不符合预期，那么kubernetes就会把该问题实例”摘除“，不承担业务流量。kubernetes提供了两种探针来实现容器探测，分布是

- liveness probes: 存活性探测，用于检测应用实例当前是否处于正常运行状态，如果不是，k8s会重新启动容器
- readiness probes： 就绪性探针，用于检测应用实例当前是否可以接收请求，如果不能，k8s不会转发流量

> livenessProbe决定是否重启容器，readinessProbe决定是否将请求转发给容器

上面两种探针目前均支持三种探针方式

- Exec命令: 在容器内执行一次命令，如果命令执行的退出代码为0，则认为退出正常，否则不正确

```java
....
  livenessProbe:
      exec:
        command:
        - cat
        - /tmp/healthy
  ....
```

- TCPSocket: 将会尝试一个用户容器的端口，如果能够建立这条连接，则认为程序正常，否则不正常

```java
....
  livenessProbe:
      tcpSocket:
        port: 8080
  ....
```

- HTTPGet: 调用容器内Web应用的URL，如果返回的状态码在200到399之间，则认为程序是正常的，否则不正常

```java
....
    livenessProbe:
      httpGet:
        path: /URI地址
        port: 80
        host: 192.168.88.100主机地址
        scheme: HTTP支持的协议http或https
....
```

下面以liveness probes为例，

### 1. 方式一： Exec

创建pod-liveness-exec.yaml

```java
apiVersion: v1
kind: Pod
metadata:
  name: pod-liveness-exec
  namespace: dev
spec:
  containers:
    - name: main
      image: nginx:1.17.1
      ports:
        - name: nginx-port
          containerPort: 80
      livenessProbe:
        exec:
          command: ["/bin/cat","/tmp/hello.txt"] 执行一个查看文件的命令
```

创建pod.观察效果

```java
kubectl create -f pod-liveness-exec.yaml
```

查看pod详情

```java
kubectl describe pod pod-liveness-exec -n dev
```

如果将其更改为正确的可以探测内容，再测试

### 3. 方式二 TCPSocket

创建pod-liveness-tcpsocket.yaml

```java
apiVersion: v1
kind: Pod
metadata:
  name: pod-liveness-tcpsocket
  namespace: dev
spec:
  containers:
    - name: main
      image: nginx:1.17.1
      ports:
        - name: nginx-port
          containerPort: 80
      livenessProbe:
        tcpSocket:
          port: 8080 尝试访问8080端口
```

创建pod,观察效果

```java
kubectl create -f pod-liveness-tcpsocket.yaml
```

查看pod详情

```java
kubectl describe pod pod-liveness-tcpsocket -n dev
```

> 可以看到tcpSocket检测8080端口，但是pod并8080端口并没有启动应用，而nginx启动在80端口上，所以只有监听80端口，才能成功。

### 3. 方式三 HTTPGet

创建一个pod-liveness-httpget.yaml

```java
apiVersion: v1
kind: Pod
metadata:
  name: pod-liveness-httpget
  namespace: dev
spec:
  containers:
    - name: main
      image: nginx:1.17.1
      ports:
        - name: nginx-port
          containerPort: 80
      livenessProbe:
        httpGet:http://xxx:80/hello
          path: /helloURI地址
          port: 80
          scheme: HTTP支持的协议http或https
```

创建pod

```java
kubectl create -f pod-liveness-httpget.yaml
```

查看pod详情，可以看到存活性探针检测到404的错误

```java
kubectl describe pod pod-liveness-httpget -n dev
```

### 4. 容器探测的一些参数

```java
[root@master ~]# kubectl explain pod.spec.containers.livenessProbe
KIND:     Pod
VERSION:  v1
RESOURCE: livenessProbe <Object>
DESCRIPTION:
     Periodic probe of container liveness. Container will be restarted if the
     probe fails. Cannot be updated. More info:
     https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle#container-probes
     Probe describes a health check to be performed against a container to
     determine whether it is alive or ready to receive traffic.
FIELDS:
   exec	<Object>
     One and only one of the following should be specified. Exec specifies the
     action to take.
   failureThreshold	<integer>
     Minimum consecutive failures for the probe to be considered failed after
     having succeeded. Defaults to 3. Minimum value is 1.
    连续探测失败多少次才被认定为失败。默认3，最小值1
   httpGet	<Object>
     HTTPGet specifies the http request to perform.
   initialDelaySeconds	<integer>
     Number of seconds after the container has started before liveness probes
     are initiated. More info:
     https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle#container-probes
    容器启动后等待多少秒执行第一次探测
   periodSeconds	<integer>
     How often (in seconds) to perform the probe. Default to 10 seconds. Minimum
     value is 1.
    探测频率，默认10秒，最低1秒
   successThreshold	<integer>
     Minimum consecutive successes for the probe to be considered successful
     after having failed. Defaults to 1. Must be 1 for liveness and startup.
     Minimum value is 1.
    连续探测成功多少次才被认定成功。默认1
   tcpSocket	<Object>
     TCPSocket specifies an action involving a TCP port. TCP hooks not yet
     supported
   timeoutSeconds	<integer>
     Number of seconds after which the probe times out. Defaults to 1 second.
     Minimum value is 1. More info:
     https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle#container-probes
    探测超时时间。默认1秒，最低1秒
```

演示实例

```java
apiVersion: v1
kind: Pod
metadata:
  name: pod-liveness-httpget
  namespace: dev
spec:
  containers:
    - name: main
      image: nginx:1.17.1
      ports:
        - name: nginx-port
          containerPort: 80
      livenessProbe:
        httpGet:http://xxx:80/hello
          path: /helloURI地址
          port: 80
          scheme: HTTP支持的协议http或https
        initialDelaySeconds: 30容器启动后30秒开始探测
        timeoutSeconds: 3      探测超时时间3秒
        successThreshold: 2    连续探测成功2次才被认定成功
        failureThreshold: 2    连续探视失败2次才被认定失败
        periodSeconds: 10      探测频率,每10秒一次
```

## 第六节 重启策略

一旦容器探测出现了问题，kubernetes就会对容器所在的pod进行重启，其实这是由pod的重启策略决定的，pod的重启策略有3种，分布如下

- **Always**: 容器失效时，自动重启该容器。默认值。
- **OnFailure**: 容器终止运行且退出码不为0时重启
- **Never**: 不论状态如何，都不重启该容器

重启策略适用于Pod对象种的所有容器，首先需要重启的容器，将在其需要立即进行重启，随后再次需要重启的操作将由kuberlet延迟一段时间后进行，且反复的重启操作的延迟时长以此为10s、20s、40s、80s、160s、300s，300s是最大的延迟时长。

创建pod-restartpolicy.yaml

```java
apiVersion: v1
kind: Pod
metadata:
  name: pod-restartpolicy
  namespace: dev
spec:
  containers:
    - name: main
      image: nginx:1.17.1
      ports:
        - name: nginx-port
          containerPort: 80
      livenessProbe:
        httpGet:http://xxx:80/hello
          path: /helloURI地址
          port: 80
          scheme: HTTP支持的协议http或https
  restartPolicy: Always设置重启策略
```

创建pod

```java
kubectl create -f pod-restartpolicy.yaml 
```

查看pod，可以看到容器在不断的重启

```java
kubectl get pod pod-restartpolicy -n dev -w
```
