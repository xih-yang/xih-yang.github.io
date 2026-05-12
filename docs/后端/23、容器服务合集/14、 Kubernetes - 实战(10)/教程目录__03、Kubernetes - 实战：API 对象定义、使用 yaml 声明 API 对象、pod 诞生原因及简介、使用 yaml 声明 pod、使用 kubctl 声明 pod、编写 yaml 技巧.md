# 03、Kubernetes - 实战：API 对象定义、使用 yaml 声明 API 对象、pod 诞生原因及简介、使用 yaml 声明 pod、使用 kubctl 声明 pod、编写 yaml 技巧
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/10/3.html
- 分类：容器服务
- 分组：教程目录
## 1. API 对象的定义

因为`apiserver` 是 `Kubernetes` 系统的唯一入口，外部用户和内部组件都必须和它通信，而它采用了 `HTTP` 协议的 `URL` 资源理念，`API` 风格也用 `RESTful` 的 `GET/POST/DELETE` 等等，所以，这些概念很自然地就被称为是“API 对象”了。

`Kubernetes` 把集群里的一切资源都定义为 `API` 对象，通过 `RESTful` 接口来管理。描述 `API` 对象需要使用 `YAML` 语言，必须的字段是 `apiVersion`、`kind`、`metadata`。

`kubectl` 是官方的 `CLI`命令行工具，用于与 `apiserver` 进行通信，将用户在命令行输入的命令，组织并转化为 `apiserver`能识别的信息，进而实现管理 `k8s`各种资源的一种有效途径。

可以使用 `kubectl api-resources` 来查看当前 `Kubernetes` 版本支持的所有对象：

```java
$ kubectl api-resources
NAME                              SHORTNAMES   APIVERSION                             NAMESPACED   KIND
bindings                                       v1                                     true         Binding
componentstatuses                 cs           v1                                     false        ComponentStatus
configmaps                        cm           v1                                     true         ConfigMap
endpoints                         ep           v1                                     true         Endpoints
events                            ev           v1                                     true         Event
limitranges                       limits       v1                                     true         LimitRange
namespaces                        ns           v1                                     false        Namespace
nodes                             no           v1                                     false        Node
persistentvolumeclaims            pvc          v1                                     true         PersistentVolumeClaim
persistentvolumes                 pv           v1                                     false        PersistentVolume
pods                              po           v1                                     true         Pod
podtemplates                                   v1                                     true         PodTemplate
replicationcontrollers            rc           v1                                     true         ReplicationController
resourcequotas                    quota        v1                                     true         ResourceQuota
secrets                                        v1                                     true         Secret
```

其中：

- NAME 就是对象的名字，比如 ConfigMap、Pod、Service 等等；
- SHORTNAMES则是这种资源的简写，使用 kubectl 命令的时候很有用，可以少敲几次键盘，比如 Pod 可以简写成 po，Service 可以简写成 svc；

在使用`kubectl` 命令的时候，还可以加上一个参数 `--v=9`，它会显示出详细的命令执行过程，清楚地看到发出的 `HTTP` 请求，比如：

```java
$ kubectl get pod --v=9
I0102 10:34:15.247154   12008 loader.go:372] Config loaded from file:  /home/wohu/.kube/config
I0102 10:34:15.247508   12008 cert_rotation.go:137] Starting client certificate rotation controller
I0102 10:34:15.249475   12008 round_trippers.go:466] curl -v -XGET  -H "Accept: application/json;as=Table;v=v1;g=meta.k8s.io,application/json;as=Table;v=v1beta1;g=meta.k8s.io,application/json" -H "User-Agent: kubectl/v1.23.3 (linux/amd64) kubernetes/816c97a" 'https://192.168.49.2:8443/api/v1/namespaces/default/pods?limit=500'
I0102 10:34:15.249641   12008 round_trippers.go:510] HTTP Trace: Dial to tcp:192.168.49.2:8443 succeed
I0102 10:34:15.253953   12008 round_trippers.go:570] HTTP Statistics: DNSLookup 0 ms Dial 0 ms TLSHandshake 2 ms ServerProcessing 1 ms Duration 4 ms
I0102 10:34:15.253973   12008 round_trippers.go:577] Response Headers:
I0102 10:34:15.253981   12008 round_trippers.go:580]     X-Kubernetes-Pf-Flowschema-Uid: 5ee9d184-ca55-43da-9db9-c7802b0b69b2
I0102 10:34:15.253989   12008 round_trippers.go:580]     X-Kubernetes-Pf-Prioritylevel-Uid: ad2ccea7-5611-4c3f-b38e-3c5e4e190732
I0102 10:34:15.253994   12008 round_trippers.go:580]     Date: Mon, 02 Jan 2023 02:34:15 GMT
I0102 10:34:15.254003   12008 round_trippers.go:580]     Audit-Id: 91b3f18e-785c-403e-a4a5-06e63138ede4
I0102 10:34:15.254007   12008 round_trippers.go:580]     Cache-Control: no-cache, private
I0102 10:34:15.254012   12008 round_trippers.go:580]     Content-Type: application/json
I0102 10:34:15.254084   12008 request.go:1181] Response Body: {
     "kind":"Table","apiVersion":"meta.k8s.io/v1","metadata":{
     "resourceVersion":"849"},"columnDefinitions":[{
     "name":"Name","type":"string","format":"name","description":"Name must be unique within a namespace. 
```

`kubectl` 客户端等价于调用了 `curl`，向 `8443` 端口发送了 `HTTP GET` 请求，`URL` 是 `/api/v1/namespaces/default/pods`。

虽然`yaml`格式是 `json`的超集，但在 `k8s`中的 `yaml`文件最终都是被转换为 `json`格式字符串放在 `request body`中提交到 `apiserver`的。

当`kubectl` 读取 `YAML` 文件时，它会将 `YAML` 文件转换成对应的 `Kubernetes API` 对象。比如，一个 `YAML` 文件可能会声明一个 `pod` 对象，而 `kubectl` 可以将这个 `pod`对象转换成 `Kubernetes API` 所需的 `JSON` 格式。 接下来，`kubectl` 会将这个转换后的 `JSON` 对象转换成一个 `HTTP` 请求，并发送到 `apiserver` 服务器。`apiserver` 服务器会根据这个 `HTTP` 请求来执行相应的操作。

目前的`Kubernetes 1.23` 版本有 50 多种 `API` 对象，全面地描述了集群的节点、应用、配置、服务、账号等等信息，`apiserver` 会把它们都存储在数据库 `etcd` 里，然后 `kubelet`、`scheduler`、`controller-manager` 等组件通过 `apiserver` 来操作它们，就在 `API` 对象这个抽象层次实现了对整个集群的管理。

## 2. 使用 yaml 声明 API 对象

之前运行 `Nginx` 的命令

```java
kubectl run ngx --image=nginx:alpine
```

我们来把它改写成“声明式”的 `YAML`，让 `Kubernetes` 自己去决定如何拉取镜像运行：

```java
apiVersion: v1
kind: Pod
metadata:
  name: ngx-pod
  labels:
    env: demo
    owner: chrono
spec:
  containers:
  - image: nginx:alpine
    name: ngx
    ports:
    - containerPort: 80
```

因为`API` 对象采用标准的 `HTTP` 协议，为了方便理解，我们可以借鉴一下 `HTTP` 的报文格式，把 `API` 对象的描述分成 `header`和 `body`两部分。

`header`包含的是 `API` 对象的基本信息，有三个字段：`apiVersion`、`kind`、`metadata`。

- apiVersion 表示操作这种资源的 API 版本号。
- kind 表示资源对象的类型，比如 Pod、Node、Job、Service 等等。
- metadata 这个字段顾名思义，表示的是资源的一些“元信息”，也就是用来标记对象，方便 Kubernetes 管理的一些信息。

```java
apiVersion: v1
kind: Pod
metadata:
  name: ngx-pod
  labels:
    env: demo
    owner: wohu
```

比如在这个 `YAML` 示例里就有两个“元信息”，一个是 `name`，给 `Pod` 起了个名字叫 `ngx-pod`，另一个是 `labels`，给 `Pod`“贴”上了一些便于查找的标签，分别是 `env` 和 `owner`。

`apiVersion`、`kind`、`metadata` 都被 `kubectl` 用于生成 `HTTP` 请求发给 `apiserver`，可以用 `--v=9` 参数在请求的 `URL` 里看到它们，比如：

```java
https://192.168.49.2:8443/api/v1/namespaces/default/pods/ngx-pod
```

和`HTTP` 协议一样，

- header里的 apiVersion、kind、metadata 这三个字段是任何对象都必须有的。
- body部分则会与对象特定相关，每种对象会有不同的规格定义，在 YAML 里就表现为 spec 字段（即 specification），表示我们对对象的“期望状态”（desired status）。

还是来看这个 `Pod`，它的 `spec` 里就是一个 `containers` 数组，里面的每个元素又是一个对象，指定了名字、镜像、端口等信息：

```java
spec:
  containers:
  - image: nginx:alpine
    name: ngx
    ports:
    - containerPort: 80
```

现在把这些字段综合起来，我们就能够看出，这份 `YAML` 文档完整地描述了一个类型是 `Pod` 的 `API` 对象，要求使用 `v1` 版本的 `API` 接口去管理，其他更具体的名称、标签、状态等细节都记录在了 `metadata` 和 `spec` 字段等里。

使用`kubectl apply`、`kubectl delete`，再加上参数 `-f`，你就可以使用这个 `YAML` 文件，发送 `HTTP` 请求，管理 `API` 对象。

```java
kubectl apply -f ngx-pod.yml
kubectl delete -f ngx-pod.yml
```

`Kubernetes` 收到这份“声明式”的数据，再根据 `HTTP` 请求里的 `POST/DELETE` 等方法，就会自动操作这个资源对象，至于对象在哪个节点上、怎么创建、怎么删除完全不用我们操心。

## 3. pod 诞生缘由

`Pod` 这个词原意是“豌豆荚”，后来又延伸出“舱室”“太空舱”等含义。

容器技术我想你现在已经比较熟悉了，它让进程在一个“沙盒”环境里运行，具有良好的隔离性，对应用是一个非常好的封装。

但还有一些特殊情况，多个应用结合得非常紧密以至于无法把它们拆开。比如，有的应用运行前需要其他应用帮它初始化一些配置，还有就是日志代理，它必须读取另一个应用存储在本地磁盘的文件再转发出去。这些应用如果被强制分离成两个容器，切断联系，就无法正常工作了。

那么把这些应用都放在一个容器里运行可不可以呢？当然可以，但这并不是一种好的做法。因为容器的理念是对应用的独立封装，它里面就应该是一个进程、一个应用，如果里面有多个应用，不仅违背了容器的初衷，也会让容器更难以管理。

为了解决这样多应用联合运行的问题，同时还要不破坏容器的隔离，就需要在容器外面再建立一个“收纳舱”，让多个容器既保持相对独立，又能够小范围共享网络、存储等资源，而且永远是“绑在一起”的状态。所以，`Pod` 的概念也就呼之欲出了，容器正是“豆荚”里那些小小的“豌豆”，你可以在 `Pod` 的 `YAML` 里看到，`spec.containers`字段其实是一个数组，里面允许定义多个容器。

## 4. 核心对象 pod 简介

因为`Pod` 是对容器的“打包”，里面的容器是一个整体，总是能够一起调度、一起运行，绝不会出现分离的情况，而且 `Pod` 属于 `Kubernetes`，可以在不触碰下层容器的情况下任意定制修改。

`Kubernetes` 让 `Pod` 去编排处理容器，然后把 `Pod` 作为应用调度部署的最小单位，`Pod` 也因此成为了 `Kubernetes` 世界里的“原子”，基于 `Pod` 就可以构建出更多更复杂的业务形态了。

下面的这张图你也许在其他资料里见过，它从 `Pod` 开始，扩展出了 `Kubernetes` 里的一些重要 `API` 对象，比如配置信息 `ConfigMap`、离线作业 `Job`、多实例部署 `Deployment` 等等，它们都分别对应到现实中的各种实际运维需求。

受这张图的启发，我自己重新画了一份以 `Pod` 为中心的 `Kubernetes` 资源对象关系图，添加了一些新增的 `Kubernetes` 概念，今后我们就依据这张图来探索 `Kubernetes` 的各项功能。

从这两张图中你也应该能够看出来，所有的 `Kubernetes` 资源都直接或者间接地依附在 `Pod` 之上，所有的 `Kubernetes` 功能都必须通过 `Pod` 来实现，所以 `Pod` 理所当然地成为了 `Kubernetes` 的核心对象。

图片来源：[https://time.geekbang.org/column/article/531551](https://time.geekbang.org/column/article/531551)

## 5. 使用 YAML 声明 Pod 对象

因为`Pod` 也是 `API` 对象，所以它也必然具有 `apiVersion`、`kind`、`metadata`、`spec` 这四个基本组成部分。

`apiVersion`和 `kind`这两个字段很简单，对于 `Pod` 来说分别是固定的值 `v1` 和 `Pod`，而一般来说，`metadata`里应该有 `name` 和 `labels` 这两个字段。

我们在使用 `Docker` 创建容器的时候，可以不给容器起名字，但在 `Kubernetes`里，`Pod` 必须要有一个名字，这也是 `Kubernetes` 里所有资源对象的一个约定。通常会为 `Pod` 名字统一加上 `pod` 后缀，这样可以和其他类型的资源区分开。

`name` 只是一个基本的标识，信息有限，所以 `labels` 字段就派上了用处。它可以添加任意数量的 `Key-Value`，给 `Pod`“贴”上归类的标签，结合 `name` 就更方便识别和管理了。

比如说，我们可以根据运行环境，使用标签 `env=dev/test/prod`，或者根据所在的数据中心，使用标签 `region: north/south`……如此种种，只需要发挥你的想象力。

### 5.1 metadata

下面这段 `YAML` 代码就描述了一个简单的 `Pod`，名字是“wohu-pod”，再附加上一些标签：

```java
apiVersion: v1
kind: Pod
metadata:
  name: wohu-pod
  labels:
    owner: wohu
    env: demo
    region: north
    tier: back
```

`metadata`一般写上 `name` 和 `labels` 就足够了，而 `spec`字段由于需要管理、维护 `Pod` 这个 `Kubernetes` 的基本调度单元，里面有非常多的关键信息。

### 5.2 containers

```java
spec:
  containers:
  - image: busybox:latest
    name: busy
    imagePullPolicy: IfNotPresent
    env:
      - name: os
        value: "ubuntu"
      - name: debug
        value: "on"
    command:
      - /bin/echo
    args:
      - "$(os), $(debug)"
```

或者用下面的写法：

```java
spec:
  containers:
  - 
   image: busybox:latest
   name: busy
   imagePullPolicy: IfNotPresent
   env:
      - 
       name: os
       value: "ubuntu"
      - 
       name: debug
       value: "on"
   command:
      - 
       /bin/echo
   args:
      - 
       "$(os), $(debug)"
```

`containers`是一个数组，里面的每一个元素又是一个 `container` 对象，也就是容器。和 `Pod` 一样，`container` 对象也必须要有一个 `name` 表示名字，然后当然还要有一个 `image` 字段来说明它使用的镜像，这两个字段是必须要有的，否则 `Kubernetes` 会报告数据验证错误。

`container` 对象的其他字段解释：

- ports：列出容器对外暴露的端口，和 Docker 的 -p 参数有点像。
- imagePullPolicy：指定镜像的拉取策略，可以是 Always/Never/IfNotPresent，一般默认是 IfNotPresent，也就是说只有本地不存在才会远程拉取镜像，可以减少网络消耗。
- env：定义 Pod 的环境变量，和 Dockerfile 里的 ENV 指令有点类似，但它是运行时指定的，更加灵活可配置。
- command：定义容器启动时要执行的命令，相当于 Dockerfile 里的 ENTRYPOINT 指令
- args：它是 command 运行时的参数，相当于 Dockerfile里的 CMD 指令，这两个命令和 Docker 的含义不同，要特别注意。

## 6. 使用 kubectl 操作 Pod

上面我们定义了 `pod` 的名字为 `wohu-pod`，那么我们在删除的时候可以指定名字来删除：

```java
kubectl delete pod wohu-pod
```

和`Docker` 不一样，`Kubernetes` 的 `Pod` 不会在前台运行，只能在后台（相当于默认使用了参数 `-d`），所以输出信息不能直接看到。我们可以用命令 `kubectl logs`，它会把 `Pod` 的标准输出流信息展示给我们看，在这里就会显示出预设的两个环境变量的值：

```java
$ kubectl apply -f wohu-pod.yml
pod/wohu-pod created
wohu@dev:~/k8s$ kubectl get pod
NAME       READY   STATUS             RESTARTS     AGE
ngx        1/1     Running            0            3h39m
wohu-pod   0/1     CrashLoopBackOff   1 (3s ago)   5s
wohu@dev:~/k8s$ kubectl logs wohu-pod
ubuntu, on
wohu@dev:~/k8s$
```

我们可以使用命令 `kubectl describe` 来检查它的详细状态，它在调试排错时很有用：

```java
kubectl describe pod wohu-pod
```

输出结果：

```java
Events:
  Type     Reason     Age               From               Message
  ----     ------     ----              ----               -------
  Normal   Scheduled  54s               default-scheduler  Successfully assigned default/wohu-pod to minikube
  Normal   Pulled     6s (x4 over 54s)  kubelet            Container image "busybox:latest" already present on machine
  Normal   Created    6s (x4 over 54s)  kubelet            Created container busy
  Normal   Started    6s (x4 over 53s)  kubelet            Started container busy
  Warning  BackOff    5s (x5 over 52s)  kubelet            Back-off restarting failed container
```

通常需要关注的是末尾的`Events`部分，它显示的是 `Pod` 运行过程中的一些关键节点事件。对于这个 `wohu-pod`，因为它只执行了一条 `echo` 命令就退出了，而 `Kubernetes` 默认会重启 `Pod`，所以就会进入一个反复停止 - 启动的循环错误状态。

因为`Kubernetes` 里运行的应用大部分都是不会主动退出的服务，所以我们可以把这个 `wohu-pod` 删掉。

另外，`kubectl` 也提供与 `docker` 类似的 `cp` 和 `exec` 命令，`kubectl cp` 可以把本地文件拷贝进 `Pod`，`kubectl exec` 是进入 `Pod` 内部执行 `Shell` 命令，用法也差不多。

```java
echo 'aaa' > a.txt
kubectl cp a.txt ngx:/tmp
```

不过`kubectl exec` 的命令格式与 `Docker` 有一点小差异，需要在 `Pod` 后面加上 `--`，把 `kubectl` 的命令与 `Shell` 命令分隔开，在用的时候需要小心一些：

```java
kubectl exec -it ngx -- sh
```

```java
$ kubectl cp wohu-pod.yml ngx:/tmp
wohu@dev:~/k8s$ kubectl exec -it ngx -- sh
/ ls /tmp/
wohu-pod.yml
/ exit
wohu@dev:~/k8s$
```

总结：

- 现实中经常会有多个进程密切协作才能完成任务的应用，而仅使用容器很难描述这种关系，所以就出现了 Pod，它“打包”一个或多个容器，保证里面的进程能够被整体调度。
- Pod 是 Kubernetes 管理应用的最小单位，其他的所有概念都是从 Pod 衍生出来的。
- Pod 也应该使用 YAML“声明式”描述，关键字段是 spec.containers，列出名字、镜像、端口等要素，定义内部的容器运行状态。
- 操作 Pod 的命令很多与 Docker 类似，如 kubectl run、kubectl cp、kubectl exec 等，但有的命令有些小差异，使用的时候需要注意。

`Pod` 内部有一个名为 `infra` 的容器，它实际上代表了 `Pod`，维护着 `Pod` 内多容器共享的主机名、网络和存储。`infra` 容器的镜像叫 “pause”，非常小，只有不到 500KB。

## 7. k8s 中编写 yaml 技巧

在官网[https://kubernetes.io/docs/reference/kubernetes-api/](https://kubernetes.io/docs/reference/kubernetes-api/) 中 API 对象的所有字段都可以在里面找到。

介绍几个简单实用的小技巧：

- 使用 kubectl api-resources 命令，它会显示出资源对象相应的 API 版本和类型，比如 Pod 的版本是 v1，Ingress 的版本是 networking.k8s.io/v1。
- 使用命令 kubectl explain，它相当于是 Kubernetes 自带的 API 文档，会给出对象字段的详细说明，这样我们就不必去网上查找了。比如想要看 Pod 里的字段该怎么写，就可以这样：

```java
kubectl explain pod
kubectl explain pod.metadata
kubectl explain pod.spec
kubectl explain pod.spec.containers
```

查询结果

```java
$ kubectl explain  pod
KIND:     Pod
VERSION:  v1
DESCRIPTION:
     Pod is a collection of containers that can run on a host. This resource is
     created by clients and scheduled onto hosts.
FIELDS:
   apiVersion   <string>
     APIVersion defines the versioned schema of this representation of an
     object. Servers should convert recognized schemas to the latest internal
     value, and may reject unrecognized values. More info:
     https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
   kind <string>
     Kind is a string value representing the REST resource this object
     represents. Servers may infer this from the endpoint the client submits
     requests to. Cannot be updated. In CamelCase. More info:
     https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
   metadata     <Object>
     Standard object's metadata. More info:
     https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
   spec <Object>
     Specification of the desired behavior of the pod. More info:
     https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#spec-and-status
   status       <Object>
     Most recently observed status of the pod. This data may not be up to date.
     Populated by the system. Read-only. More info:
     https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#spec-and-status
```

- 使用 kubectl 的两个特殊参数 --dry-run=client 和 -o yaml，前者是空运行，后者是生成 YAML 格式，结合起来使用就会让 kubectl 不会有实际的创建动作，而只生成 YAML 文件。

例如，想要生成一个 `Pod` 的 `YAML` 样板示例，可以在 `kubectl run` 后面加上这两个参数：

```java
kubectl run ngx --image=nginx:alpine --dry-run=client -o yaml
```

就会生成一个绝对正确的 `YAML` 文件：

```java
apiVersion: v1
kind: Pod
metadata:
  creationTimestamp: null
  labels:
    run: ngx
  name: ngx
spec:
  containers:
  - image: nginx:alpine
    name: ngx
    resources: {
     }
  dnsPolicy: ClusterFirst
  restartPolicy: Always
status: {
     }
```

接下来你要做的，就是查阅对象的说明文档，添加或者删除字段来定制这个 `YAML` 了。

## 8. k8s 中 pod 类型 yaml 说明

```java
apiVersion: v1			#必选，版本号，例如v1
kind: Pod				#必选，Pod
metadata:				#必选，元数据
  name: string			 必选，Pod名称
  namespace: string		 必选，Pod所属的命名空间
  labels:				 自定义标签
    - name: string		   自定义标签名字
  annotations:			   自定义注释列表
    - name: string
spec:					#必选，Pod中容器的详细定义
  containers:			 必选，Pod中容器列表
  - name: string		   必选，容器名称
    image: string		   必选，容器的镜像名称
    imagePullPolicy: [Always | Never | IfNotPresent]	#获取镜像的策略：Alawys表示总是下载镜像，IfnotPresent表示优先使用本地镜像，否则下载镜像，Nerver表示仅使用本地镜像
    command: [string]		#容器的启动命令列表，如不指定，使用打包时使用的启动命令
    args: [string]			#容器的启动命令参数列表
    workingDir: string		#容器的工作目录
    volumeMounts:			#挂载到容器内部的存储卷配置
    - name: string			 引用pod定义的共享存储卷的名称，需用volumes[]部分定义的的卷名
      mountPath: string		 存储卷在容器内mount的绝对路径，应少于512字符
      readOnly: boolean		 是否为只读模式
    ports:					#需要暴露的端口库号列表
    - name: string			 端口号名称
      containerPort: int	 容器需要监听的端口号
      hostPort: int			 容器所在主机需要监听的端口号，默认与Container相同
      protocol: string		 端口协议，支持TCP和UDP，默认TCP
    env:					#容器运行前需设置的环境变量列表
    - name: string			 环境变量名称
      value: string			 环境变量的值
    resources:				#资源限制和请求的设置
      limits:				 资源限制的设置
        cpu: string			   Cpu的限制，单位为core数，将用于docker run --cpu-shares参数
        memory: string			#内存限制，单位可以为Mib/Gib，将用于docker run --memory参数
      requests:				 资源请求的设置
        cpu: string			   Cpu请求，容器启动的初始可用数量
        memory: string		   内存清楚，容器启动的初始可用数量
    livenessProbe:     		#对Pod内个容器健康检查的设置，当探测无响应几次后将自动重启该容器，检查方法有exec、httpGet和tcpSocket，对一个容器只需设置其中一种方法即可
      exec:					#对Pod容器内检查方式设置为exec方式
        command: [string]	 exec方式需要制定的命令或脚本
      httpGet:				#对Pod内个容器健康检查方法设置为HttpGet，需要制定Path、port
        path: string
        port: number
        host: string
        scheme: string
        HttpHeaders:
        - name: string
          value: string
      tcpSocket:			#对Pod内个容器健康检查方式设置为tcpSocket方式
         port: number
       initialDelaySeconds: 0	#容器启动完成后首次探测的时间，单位为秒
       timeoutSeconds: 0		#对容器健康检查探测等待响应的超时时间，单位秒，默认1秒
       periodSeconds: 0			#对容器监控检查的定期探测时间设置，单位秒，默认10秒一次
       successThreshold: 0
       failureThreshold: 0
       securityContext:
         privileged:false
    restartPolicy: [Always | Never | OnFailure]		#Pod的重启策略，Always表示一旦不管以何种方式终止运行，kubelet都将重启，OnFailure表示只有Pod以非0退出码退出才重启，Nerver表示不再重启该Pod
    nodeSelector: obeject		#设置NodeSelector表示将该Pod调度到包含这个label的node上，以key：value的格式指定
    imagePullSecrets:			#Pull镜像时使用的secret名称，以key：secretkey格式指定
    - name: string
    hostNetwork:false			#是否使用主机网络模式，默认为false，如果设置为true，表示使用宿主机网络
    volumes:					#在该pod上定义共享存储卷列表
    - name: string				 共享存储卷名称 （volumes类型有很多种）
      emptyDir: {
     }				 类型为emtyDir的存储卷，与Pod同生命周期的一个临时目录。为空值
      hostPath: string			 类型为hostPath的存储卷，表示挂载Pod所在宿主机的目录
        path: string			   Pod所在宿主机的目录，将被用于同期中mount的目录
      secret:					#类型为secret的存储卷，挂载集群与定义的secre对象到容器内部
        scretname: string  
        items:     
        - key: string
          path: string
      configMap:				#类型为configMap的存储卷，挂载预定义的configMap对象到容器内部
        name: string
        items:
        - key: string
```

##
