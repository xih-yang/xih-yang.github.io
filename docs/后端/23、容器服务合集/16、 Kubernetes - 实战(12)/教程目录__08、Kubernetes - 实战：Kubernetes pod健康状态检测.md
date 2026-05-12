# 08、Kubernetes - 实战：Kubernetes pod健康状态检测
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/12/8.html
- 分类：容器服务
- 分组：教程目录
## 一、容器的存活性探测livenessProbe

有些应用程序因存在缺陷（例如多线程导致的应用程序死锁等）会在长时间持续运行后逐渐转为不可用状态，并且仅能通过重启操作恢复，Kubernetes的容器存活性探测机制可发现诸如此类的问题，并依据探测结果结合重启策略触发后续的行为。存活性探测是隶属于容器级别的配置，kubelet可基于它判定何时需要重启容器。目前，Kubernetes在容器上支持的存活探针有3种类型：ExecAction、TCPSocketAction和HTTPGetAction。

存活探针清单格式

Pod配置格式中，spec.containers.livenessProbe字段用于定义此类检测，配置格式如下所示。但一个容器之上仅能定义一种类型的探针，即exec、httpGet和tcpSocket三者互斥，它们不可在一个容器同时使用，只能三选一。

```java
apiVersion: v1
kind: Pod
metadata:
  name: ...
  namespace: ...
spec:
  containers:
  - name: ...
    image: ...
    imagePullPolicy: ...
    livenessProbe:
      exec<Object> 命令式探针
      httpGet<Object>http Get 类型的探针
      tcpSocket<Object>tcp Socket类型的探针
     上面的探针类型只能三选一
      initialDelaySeconds<integer>发起初次探测请求的延时时长，容器启动多长时间后发起第一次探测请求。
      periodSeconds<integer>请求周期
      timeoutSeconds<integer>超时时长
      successThreshold成功阀值，在容器运行不正常的情况下，连续探测多少次成功后，检测通过。
      failureThreshold失败阀值，在容器运行正常的情况下，连续探测多少次失败后，检测失败。
```

探针之外的其他字段用于定义探测操作的行为方式，没有明确定义这些属性字段时，它们会使用各自的默认值，各字段的详细说明如下。

```java
▪initialDelaySeconds <integer>：首次发出存活探测请求的延迟时长，即容器启动多久之后开始第一次探测操作，显示为delay属性；默认为0秒，即容器启动后便立刻进行探测；该参数值应该大于容器的最大初始化时长，以避免程序永远无法启动。
▪timeoutSeconds <integer>：存活探测的超时时长，显示为timeout属性，默认为1秒，最小值也为1秒；应该为此参数设置一个合理值，以避免因应用负载较大时的响应延迟导致Pod被重启。
▪periodSeconds <integer>：存活探测的频度，显示为period属性，默认为10秒，最小值为1秒；需要注意的是，过高的频率会给Pod对象带来较大的额外开销，而过低的频率又会使得对错误反应不及时。
▪successThreshold <integer>：处于失败状态时，探测操作至少连续多少次的成功才被认为通过检测，显示为#success属性，仅可取值为1。
▪failureThreshold：处于成功状态时，探测操作至少连续多少次的失败才被视为检测不通过，显示为#failure属性，默认值为3，最小值为1；尽量设置宽容一些的失败计数，能有效避免一些场景中的服务级联失败。
```

使用kubectl describe命令查看配置了存活性探测的Pod对象的详细信息时，其相关容器中会输出类似如下一行内容，它给出了探测方式及其额外的配置属性delay、timeout、period、success和failure及其各自的相关属性值。

查看一个calico的pod

```java
root@k8s-master01:~# kubectl describe pod calico-node-xjw6q -n kube-system
......
   Liveness:   exec [/bin/calico-node -felix-live -bird-live] delay=10s timeout=1s period=10ssuccess=1failure=6
    Readiness:  exec [/bin/calico-node -felix-ready -bird-ready] delay=0s timeout=1s period=10ssuccess=1failure=3
......
```

## 1、exec存活探针

exec类型的探针通过在目标容器中执行由用户自定义的命令来判定容器的健康状态，命令状态返回值为0表示“成功”通过检测，其余值均为“失败”状态。spec.containers.livenessProbe.exec字段只有一个可用属性command，用于指定要执行的命令。demoapp应用程序通过/livez输出内置的存活状态检测接口，服务正常时，它以200响应码返回OK，否则为5xx响应码，我们可基于exec探针使用HTTP客户端向该path发起请求，并根据命令的结果状态来判定容器健康与否。系统刚启动时，对该路径的请求将会延迟大约不到5秒的时长，且默认响应值为OK。它还支持由用户按需向该路径发起POST请求，并向参数livez传值来自定义其响应内容。

下面是定义在资源清单文件liveness-exec-demo.yaml中的示例。

```java
apiVersion: v1
kind: Pod
metadata:
  name: liveness-exec-demo
  namespace: default
spec:
  containers:
  - name: demo
    image: ikubernetes/demoapp:v1.0
    imagePullPolicy: IfNotPresent
    livenessProbe:
      exec:
        command: ['/bin/sh', '-c', '[ "$(curl -s 127.0.0.1/livez)" == "OK" ]']
      initialDelaySeconds: 5
      periodSeconds: 5
```

该配置清单中定义的Pod对象为demo容器定义了exec探针，它通过在容器本地执行测试命令来比较curl -s 127.0.0.1/livez的返回值是否为OK以判定容器的存活状态。命令成功执行则表示容器正常运行，否则3次检测失败之后则将其判定为检测失败。首次检测在容器启动5秒之后进行，请求间隔也是5秒。

```java
root@k8s-master01:/apps/k8s-yaml/livessnessprob# kubectl apply -f liveness-exec-demo.yaml 
pod/liveness-exec-demo created
root@k8s-master01:/apps/k8s-yaml/livessnessprob# kubectl get pod
NAME                 READY   STATUS    RESTARTS   AGE
liveness-exec-demo   1/1     Running   0          18s
#重启次数为0
```

创建完成后，Pod中的容器demo会正常运行，存活检测探针也不会遇到检测错误而导致容器重启。若要测试存活状态检测的效果，可以手动将/livez的响应内容修改为OK之外的其他值，例如FAIL。

```java
root@k8s-master01:/apps/k8s-yaml/livessnessprob# kubectl exec liveness-exec-demo -- curl -s -X POST -d 'livez=FAIL' 127.0.0.1/livez
```

而后经过1个检测周期，可通过Pod对象的描述信息来获取相关的事件状态，例如，由下面命令结果中的事件可知，容器因健康状态检测失败而被重启。

```java
root@k8s-master01:/apps/k8s-yaml/livessnessprob# kubectl describe pod liveness-exec-demo
......
Events:
  Type     Reason     Age                From               Message
  ----     ------     ----               ----               -------
  Normal   Scheduled  100s               default-scheduler  Successfully assigned default/liveness-exec-demo to 172.168.33.211
  Normal   Pulling    100s               kubelet            Pulling image "ikubernetes/demoapp:v1.0"
  Normal   Pulled     96s                kubelet            Successfully pulled image "ikubernetes/demoapp:v1.0" in 3.148561284s
  Normal   Created    96s                kubelet            Created container demo
  Normal   Started    96s                kubelet            Started container demo
  Warning  Unhealthy  15s (x4 over 89s)  kubelet            Liveness probe failed:
  Normal   Killing    15s                kubelet            Container demo failed liveness probe, will be restarted
#livenessprobe检测失败。容器被重启
```

下面输出信息中的Containers一段中还清晰显示了容器健康状态检测及状态变化的相关信息：容器当前处于Running状态，但前一次是为Terminated，原因是退出码为137的错误信息，它表示进程是被外部信号所终止。137事实上由两部分数字之和生成：128+signum，其中signum是导致进程终止的信号的数字标识，9表示SIGKILL，这意味着进程是被强行终止的。

```java
Containers:
  demo:
    Container ID:   docker://99edd216d313a69fd5beb1b51e18d1c61c1f520f678d10423bb17285c61583f8
    Image:          ikubernetes/demoapp:v1.0
    Image ID:       docker-pullable://ikubernetes/demoapp@sha256:6698b205eb18fb0171398927f3a35fe27676c6bf5757ef57a35a4b055badf2c3
    Port:           <none>
    Host Port:      <none>
    State:          Running
      Started:      Wed, 13 Oct 2021 07:04:11 +0800
    Last State:     Terminated
      Reason:       Error
      Exit Code:    137
      Started:      Wed, 13 Oct 2021 07:02:20 +0800
      Finished:     Wed, 13 Oct 2021 07:04:11 +0800
    Ready:          True
    Restart Count:  1  容器重启次数为1
    Liveness:       exec [/bin/sh -c [ "$(curl -s 127.0.0.1/livez)" == "OK" ]] delay=5s timeout=1s period=5ssuccess=1failure=3
    Environment:    <none>
    Mounts:
      /var/run/secrets/kubernetes.io/serviceaccount from kube-api-access-2fp2n (ro)
```

待容器重启完成后，/livez的响应内容会重置镜像中默认定义的OK，因而其存活状态检测不会再遇到错误，这模拟了一种典型的通过“重启”应用而解决问题的场景。需要特别说明的是，exec指定的命令运行在容器中，会消耗容器的可用计算资源配额，另外考虑到探测操作的效率等因素，探测操作的命令应该尽可能简单和轻量。

```java
root@k8s-master01:/apps/k8s-yaml/livessnessprob# kubectl get pod
NAME                 READY   STATUS    RESTARTS   AGE
liveness-exec-demo   1/1     Running   1          5m12s
#RESTART状态为1及已经重启了一次，重启后容器可以正常提供服务
root@k8s-master01:/apps/k8s-yaml/livessnessprob# kubectl exec liveness-exec-demo -- curl -s 127.0.0.1
iKubernetes demoapp v1.0 !! ClientIP: 127.0.0.1, ServerName: liveness-exec-demo, ServerIP: 172.20.58.223!
```

## 2、HTTP探针

HTTP探针是基于HTTP协议的探测（HTTPGetAction），通过向目标容器发起一个GET请求，并根据其响应码进行结果判定，2xx或3xx类的响应码表示检测通过。HTTP探针可用配置字段有如下几个。

```java
▪host <string>：请求的主机地址，默认为Pod IP；也可以在httpHeaders使用“Host:”来定义。
▪port <string>：请求的端口，必选字段。
▪httpHeaders <[]Object>：自定义的请求报文头部。
▪path <string>：请求的HTTP资源路径，即URL path。
▪scheme：建立连接使用的协议，仅可为HTTP或HTTPS，默认为HTTP。
```

下面是一个定义在资源清单文件liveness-httpget-demo.yaml中的示例，它使用HTTP探针直接对/livez发起访问请求，并根据其响应码来判定检测结果。

```java
apiVersion: v1
kind: Pod
metadata:
  name: liveness-httpget-demo
  namespace: default
spec:
  containers:
  - name: demo
    image: ikubernetes/demoapp:v1.0
    imagePullPolicy: IfNotPresent
    livenessProbe:
      httpGet:
        path: '/livez'
        port: 80
        scheme: HTTP
      initialDelaySeconds: 5
```

上面清单文件中定义的httpGet测试中，请求的资源路径为/livez，地址默认为Pod IP，端口使用了容器中定义的端口名称http，这也是明确为容器指明要暴露的端口的用途之一。下面测试其效果，首先创建此Pod对象：

```java
root@k8s-master01:/apps/k8s-yaml/livessnessprob# kubectl apply -f liveness-httpget-demo.yaml 
pod/liveness-httpget-demo created
root@k8s-master01:/apps/k8s-yaml/livessnessprob# kubectl get pod
NAME                    READY   STATUS        RESTARTS   AGE
liveness-httpget-demo   1/1     Running       0          25s
```

首次检测为延迟5秒，这刚好超过了demoapp的/livez接口默认会延迟响应的时长。镜像中定义的默认响应是以200状态码响应、以OK为响应结果，存活状态检测会成功完成。为了测试存活状态检测的效果，同样可以手动将/livez的响应内容修改为OK之外的其他值，例如FAIL

```java
root@k8s-master01:/apps/k8s-yaml/livessnessprob# kubectl exec liveness-httpget-demo -- curl -s -X POST -d "livez=FAIL" 127.0.0.1/livez
#而后经过至少1个检测周期后，可通过Pod对象的描述信息来获取相关的事件状态，例如，由下面命令的结果中的事件可知，容器因健康状态检测失败而被重启。
root@k8s-master01:/apps/k8s-yaml/livessnessprob# kubectl describe pod liveness-httpget-demo 
......
Events:
  Type     Reason     Age                From               Message
  ----     ------     ----               ----               -------
  Normal   Scheduled  41s                default-scheduler  Successfully assigned default/liveness-httpget-demo to 172.168.33.211
  Normal   Pulled     41s                kubelet            Container image "ikubernetes/demoapp:v1.0" already present on machine
  Normal   Created    41s                kubelet            Created container demo
  Normal   Started    41s                kubelet            Started container demo
  Warning  Unhealthy  31s                kubelet            Liveness probe failed: Get "http://172.20.58.224:80/livez": context deadline exceeded (Client.Timeout exceeded while awaiting headers)
  Warning  Unhealthy  12s (x2 over 22s)  kubelet            Liveness probe failed: HTTP probe failed with statuscode: 506
  Normal   Killing    12s                kubelet            Container demo failed liveness probe, will be restarted
```

一般来说，HTTP探针应该针对专用的URL路径进行，例如前面示例中特别为其准备的/livez，此URL路径对应的Web资源也应该以轻量化的方式在内部对应用程序的各关键组件进行全面检测，以确保它们可正常向客户端提供完整的服务。需要注意的是，这种检测方式仅对分层架构中的当前一层有效，例如，它能检测应用程序工作正常与否的状态，但重启操作却无法解决其后端服务（例如数据库或缓存服务）导致的故障。此时，容器可能会被反复重启，直到后端服务恢复正常。其他两种检测方式也存在类似的问题。

## 3、TCP探针

TCP探针是基于TCP协议进行存活性探测（TCPSocketAction），通过向容器的特定端口发起TCP请求并尝试建立连接进行结果判定，连接建立成功即为通过检测。相比较来说，它比基于HTTP协议的探测要更高效、更节约资源，但精准度略低，毕竟连接建立成功未必意味着页面资源可用。spec.containers.livenessProbe.tcpSocket字段用于定义此类检测，它主要有以下两个可用字段：

```java
1）host <string>：请求连接的目标IP地址，默认为Pod自身的IP；
2）port <string>：请求连接的目标端口，必选字段，可以名称调用容器上显式定义的端口。
```

下面是一个定义在资源清单文件liveness-tcpsocket-demo.yaml中的示例，它向Pod对象的TCP协议的80端口发起连接请求，并根据连接建立的状态判定测试结果。为了能在容器中通过iptables阻止接收对80端口的请求以验证TCP检测失败，下面的配置还在容器上启用了特殊的内核权限NET_ADMIN。

```java
apiVersion: v1
kind: Pod
metadata:
  name: liveness-tcpsocket-demo
  namespace: default
spec:
  containers:
  - name: demo
    image: ikubernetes/demoapp:v1.0
    imagePullPolicy: IfNotPresent
    ports:
    - name: http
      containerPort: 80
    securityContext:
      capabilities:
        add:
        - NET_ADMIN
    livenessProbe:
      tcpSocket:
        port: http
      periodSeconds: 5
      initialDelaySeconds: 20
```

按照配置，将该清单中的Pod对象创建在集群之上，20秒之后即会进行首次的tcpSocket检测。

```java
root@k8s-master01:/apps/k8s-yaml/livessnessprob# kubectl apply -f liveness-tcpsocket-demo.yaml 
pod/liveness-tcpsocket-demo created
root@k8s-master01:/apps/k8s-yaml/livessnessprob# kubectl get pod
NAME                      READY   STATUS        RESTARTS   AGE
liveness-tcpsocket-demo   1/1     Running       0          17s
```

容器应用demoapp启动后即监听于TCP协议的80端口，tcpSocket检测也就可以成功执行。为了测试效果，可使用下面的命令在Pod的Network名称空间中设置iptables规则以阻止对80端口的请求：

```java
root@k8s-master01:/apps/k8s-yaml/livessnessprob# kubectl exec liveness-tcpsocket-demo -- iptables -A INPUT -p tcp --dport 80 -j REJECT
```

而后经过至少1个检测周期后，可通过Pod对象的描述信息来获取相关的事件状态，例如，由下面命令的结果中的事件可知，容器因健康状态检测失败而被重启。

```java
root@k8s-master01:/apps/k8s-yaml/livessnessprob# kubectl describe pod liveness-tcpsocket-demo 
......
Events:
  Type     Reason     Age                From               Message
  ----     ------     ----               ----               -------
  Normal   Scheduled  99s                default-scheduler  Successfully assigned default/liveness-tcpsocket-demo to 172.168.33.212
  Normal   Pulled     99s                kubelet            Container image "ikubernetes/demoapp:v1.0" already present on machine
  Normal   Created    99s                kubelet            Created container demo
  Normal   Started    99s                kubelet            Started container demo
  Warning  Unhealthy  14s (x3 over 24s)  kubelet            Liveness probe failed: dial tcp 172.20.135.178:80: i/o timeout
  Normal   Killing    14s                kubelet            Container demo failed liveness probe, will be restarted
```

重启容器并不会导致Pod资源的重建操作，网络名称空间的设定附加在pause容器之上，因而添加的iptables规则在应用重启后依然存在，它是一个无法通过重启而解决的问题。若需要手消除该问题，删除添加至Pod中的iptables规则或者重新构建该pod。

## 二、Pod的重启策略

Pod对象的应用容器因程序崩溃、启动状态检测失败、存活状态检测失败或容器申请超出限制的资源等原因都可能导致其被终止，此时是否应该重启则取决于Pod上的restartPolicy（重启策略）字段的定义，该字段支持以下取值。

```java
1）Always：无论因何原因、以何种方式终止，kubelet都将重启该Pod，此为默认设定。
2）OnFailure：仅在Pod对象以非0方式退出时才将其重启。
3）Never：不再重启该Pod。
```

需要注意的是，restartPolicy适用于Pod对象中的所有容器，而且它仅用于控制在同一个节点上重新启动Pod对象的相关容器。首次需要重启的容器，其重启操作会立即进行，而再次重启操作将由kubelet延迟一段时间后进行，反复的重启操作的延迟时长依次为10秒、20秒、40秒、80秒、160秒和300秒，300秒是最大延迟时长。事实上，一旦绑定到一个节点，Pod对象将永远不会被重新绑定到另一个节点，它要么被重启，要么被终止，直到节点故障、被删除或被驱逐。

## 三、容器就绪状态检测readinessprobe

Pod对象启动后，应用程序通常需要一段时间完成其初始化过程，例如加载配置或数据、缓存初始化等，甚至有些程序需要运行某类预热过程等，因此通常应该避免在Pod对象启动后立即让其处理客户端请求，而是需要等待容器初始化工作执行完成并转为“就绪”状态，尤其是存在其他提供相同服务的Pod对象的场景更是如此。与存活探针不同的是，就绪状态检测是用来判断容器应用就绪与否的周期性（默认周期为10秒钟）操作，它用于检测容器是否已经初始化完成并可服务客户端请求。与存活探针触发的操作不同，检测失败时，就绪探针不会杀死或重启容器来确保其健康状态，而仅仅是通知其尚未就绪，并触发依赖其就绪状态的其他操作（例如从Service对象中移除此Pod对象），以确保不会有客户端请求接入此Pod对象。就绪探针也支持Exec、HTTP GET和TCP Socket这3种探测方式，且它们各自的定义机制与存活探针相同。因而，将容器定义中的livenessProbe字段名替换为readinessProbe，并略做适应性修改即可定义出就绪性检测的配置来，甚至有些场景中的就绪探针与存活探针的配置可以完全相同。demoapp应用程序通过/readyz暴露了专用于就绪状态检测的接口，它于程序启动约15秒后能够以200状态码响应、以OK为响应结果，也支持用户使用POST请求方法通过readyz参数传递自定义的响应内容，不过所有非OK的响应内容都被响应以5xx的状态码。一个简单的示例如下面的配置清单（readiness-httpget-demo.yaml）所示。

就绪探针检测成功，该pod才会被service加入到endpoint,使其向外提供服务；失败则会将该pod从endpoint中删除，知道下次检测成功才重新加入service的endpoint

```java
kind: Service
apiVersion: v1
metadata:
  name: services-readiness-demo
  namespace: default
spec:
  selector:
    app: web
  ports:
  - name: http
    protocol: TCP
    port: 80
    targetPort: 80
---
apiVersion: v1
kind: Pod
metadata:
  name: readiness-httpget-demo
  namespace: default
  labels:
    app: web
spec:
  containers:
  - name: demo
    image: ikubernetes/demoapp:v1.0
    imagePullPolicy: IfNotPresent
    readinessProbe:
      httpGet:
        path: '/readyz'
        port: 80
        scheme: HTTP
      initialDelaySeconds: 15
      timeoutSeconds: 2
      periodSeconds: 5
      failureThreshold: 3
  restartPolicy: Always
```

测试该Pod就绪探针的作用。按照配置，将Pod对象创建在集群上约15秒后启动首次探测，在该探测结果成功返回之前，Pod将一直处于未就绪状态：

```java
root@k8s-master01:/apps/k8s-yaml/readinessprobe# kubectl apply -f readiness-httpget-demo.yaml 
service/services-readiness-demo configured
pod/readiness-httpget-demo created
[root@k8s-master01 apps]# kubectl get pod -n default -o wide
NAME                     READY   STATUS    RESTARTS   AGE   IP               NODE         NOMINATED NODE   READINESS GATES
readiness-httpget-demo   1/1     Running   0          45s   10.244.135.155   k8s-node03   <none>           <none>
```

接着运行kubectl get -w命令监视其资源变动信息，由如下命令结果可知，尽管Pod对象处于Running状态，但直到就绪检测命令执行成功后Pod资源才转为“就绪”。

```java
root@k8s-master01:~# kubectl get pod readiness-httpget-demo -w
NAME                     READY   STATUS    RESTARTS   AGE
readiness-httpget-demo   0/1     Running   0          4s
readiness-httpget-demo   1/1     Running   0          31s
```

就绪检测成功后，该pod才会被添加进services的endpoint

```java
root@k8s-master01:/apps/k8s-yaml/readinessprobe# kubectl get pod -o wide
NAME                     READY   STATUS    RESTARTS   AGE     IP              NODE             NOMINATED NODE   READINESS GATES
readiness-httpget-demo   1/1     Running   0          2m20s   172.20.58.226   172.168.33.211   <none>           <none>
root@k8s-master01:/apps/k8s-yaml/readinessprobe# kubectl describe services services-readiness-demo 
Name:              services-readiness-demo
Namespace:         default
Labels:            <none>
Annotations:       <none>
Selector:          app=web
Type:              ClusterIP
IP Family Policy:  SingleStack
IP Families:       IPv4
IP:                10.68.169.49
IPs:               10.68.169.49
Port:              http  80/TCP
TargetPort:        80/TCP
Endpoints:         172.20.58.226:80pod的ip
Session Affinity:  None
Events:            <none>
```

Pod运行过程中的某一时刻，无论因何原因导致的就绪状态检测的连续失败都会使得该Pod从就绪状态转变为“未就绪”，并且会从各个通过标签选择器关联至该Pod对象的Service后端端点列表中删除。为了测试就绪状态检测效果，下面修改/readyz响应以非OK内容。

```java
root@k8s-master01:/apps/k8s-yaml/readinessprobe# kubectl exec readiness-httpget-demo -- curl -s -XPOST -d 'readyz=FAIL' 127.0.0.1/readyz
```

而后在至少1个检测周期之后，通过该Pod的描述信息可以看到就绪检测失败相关的事件描述，命令及结果如下所示：

```java
root@k8s-master01:/apps/k8s-yaml/readinessprobe# kubectl describe pod readiness-httpget-demo
......
Events:
  Type     Reason     Age                   From               Message
  ----     ------     ----                  ----               -------
  Normal   Scheduled  3m26s                 default-scheduler  Successfully assigned default/readiness-httpget-demo to 172.168.33.211
  Normal   Pulled     3m26s                 kubelet            Container image "ikubernetes/demoapp:v1.0" already present on machine
  Normal   Created    3m26s                 kubelet            Created container demo
  Normal   Started    3m26s                 kubelet            Started container demo
  Warning  Unhealthy  2m59s (x3 over 3m9s)  kubelet            Readiness probe failed: Get "http://172.20.58.226:80/readyz": context deadline exceeded (Client.Timeout exceeded while awaiting headers)
  Warning  Unhealthy  1s (x5 over 21s)      kubelet            Readiness probe failed: HTTP probe failed with statuscode: 507
#容器不会被重启，但是service中endpoint会删除改pod的ip
root@k8s-master01:/apps/k8s-yaml/readinessprobe# kubectl describe services services-readiness-demo 
Name:              services-readiness-demo
Namespace:         default
Labels:            <none>
Annotations:       <none>
Selector:          app=web
Type:              ClusterIP
IP Family Policy:  SingleStack
IP Families:       IPv4
IP:                10.68.169.49
IPs:               10.68.169.49
Port:              http  80/TCP
TargetPort:        80/TCP
Endpoints:          pod ip已经被删除，service不会将客户请求转发至该pod
Session Affinity:  None
Events:            <none>
```

未定义就绪性检测的Pod对象在进入Running状态后将立即“就绪”，这在容器需要时间进行初始化的场景中可能会导致客户请求失败。因此，生产实践中，必须为关键性Pod资源中的容器定义就绪探针。

## 四、总结

readnessprobe探针的exec和tcp的使用方式与livenessprobe的使用方式一样。

区别：

livenessprobe检测失败，容器会根据定义的重启策略来重启容器。

readnessprobe检测失败，容器不会被重启，pod会从相应的service的endpoint中删除。

使用方式：

livenessprobe和readnessprobe的方式也一样，都使用相同的探针（如：都使用exec或http）,其他参数的配置也要求一致。

同时配置的优点：

一个pod在livenessprobe检测失败后，同时从service的endpoint中删除改pod,使其客户的请求不会被转发到有问题的pod上。
