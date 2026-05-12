# 05、Kubernetes 实战 - Pod结构和定义
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/3/5.html
- 分类：容器服务
- 分组：教程目录
## 前言

Pod解析

## Pod结构

每个Pod中都可以包含一个或者多个容器，这些容器可以分为两类

- 用户程序所在的容器，数量可多可少
- Pause容器，这是每个Pod都会有的一个根容器，它的作用有两个：
- 可以以它为依据，评估整个Pod的健康状态
- 可以在根容器设置IP地址，其它容器都以此IP，以实现Pod内部的网络通信

> 这里是Pod内部的通讯，Pod之间的通讯采用的虚拟二层网络技术来实现，当前环境采用的Flannel

## Pod定义

下面是Pod的资源清单

```java
apiVersion: v1    必选，版本号，例如v1
kind: Pod       　必选，资源类型，例如 Pod
metadata:       　必选，元数据
  name: string    必选，Pod名称
  namespace: string Pod所属的命名空间,默认为"default"
  labels:       　　 自定义标签列表
    - name: string      　          
spec: 必选，Pod中容器的详细定义
  containers: 必选，Pod中容器列表
  - name: string  必选，容器名称
    image: string 必选，容器的镜像名称
    imagePullPolicy: [ Always|Never|IfNotPresent ] 获取镜像的策略 
    command: [string]  容器的启动命令列表，如不指定，使用打包时使用的启动命令
    args: [string]     容器的启动命令参数列表
    workingDir: string 容器的工作目录
    volumeMounts:      挂载到容器内部的存储卷配置
    - name: string     引用pod定义的共享存储卷的名称，需用volumes[]部分定义的的卷名
      mountPath: string存储卷在容器内mount的绝对路径，应少于512字符
      readOnly: boolean是否为只读模式
    ports:需要暴露的端口库号列表
    - name: string       端口的名称
      containerPort: int 容器需要监听的端口号
      hostPort: int      容器所在主机需要监听的端口号，默认与Container相同
      protocol: string   端口协议，支持TCP和UDP，默认TCP
    env:  容器运行前需设置的环境变量列表
    - name: string 环境变量名称
      value: string环境变量的值
    resources:资源限制和请求的设置
      limits: 资源限制的设置
        cpu: string    Cpu的限制，单位为core数，将用于docker run --cpu-shares参数
        memory: string 内存限制，单位可以为Mib/Gib，将用于docker run --memory参数
      requests:资源请求的设置
        cpu: string   Cpu请求，容器启动的初始可用数量
        memory: string内存请求,容器启动的初始可用数量
    lifecycle:生命周期钩子
        postStart:容器启动后立即执行此钩子,如果执行失败,会根据重启策略进行重启
        preStop:容器终止前执行此钩子,无论结果如何,容器都会终止
    livenessProbe: 对Pod内各容器健康检查的设置，当探测无响应几次后将自动重启该容器
      exec:       　对Pod容器内检查方式设置为exec方式
        command: [string] exec方式需要制定的命令或脚本
      httpGet:      对Pod内个容器健康检查方法设置为HttpGet，需要制定Path、port
        path: string
        port: number
        host: string
        scheme: string
        HttpHeaders:
        - name: string
          value: string
      tcpSocket:    对Pod内个容器健康检查方式设置为tcpSocket方式
         port: number
       initialDelaySeconds: 0      容器启动完成后首次探测的时间，单位为秒
       timeoutSeconds: 0    　　   对容器健康检查探测等待响应的超时时间，单位秒，默认1秒
       periodSeconds: 0     　　   对容器监控检查的定期探测时间设置，单位秒，默认10秒一次
       successThreshold: 0
       failureThreshold: 0
       securityContext:
         privileged: false
  restartPolicy: [Always | Never | OnFailure] Pod的重启策略
  nodeName: <string>设置NodeName表示将该Pod调度到指定到名称的node节点上
  nodeSelector: obeject设置NodeSelector表示将该Pod调度到包含这个label的node上
  imagePullSecrets:Pull镜像时使用的secret名称，以key：secretkey格式指定
  - name: string
  hostNetwork: false  是否使用主机网络模式，默认为false，如果设置为true，表示使用宿主机网络
  volumes:  在该pod上定义共享存储卷列表
  - name: string   共享存储卷名称 （volumes类型有很多种）
    emptyDir: {
     }      类型为emtyDir的存储卷，与Pod同生命周期的一个临时目录。为空值
    hostPath: string  类型为hostPath的存储卷，表示挂载Pod所在宿主机的目录
      path: string      　　       Pod所在宿主机的目录，将被用于同期中mount的目录
    secret:       　　　#类型为secret的存储卷，挂载集群与定义的secret对象到容器内部
      scretname: string  
      items:     
      - key: string
        path: string
    configMap:        类型为configMap的存储卷，挂载预定义的configMap对象到容器内部
      name: string
      items:
      - key: string
        path: string
```

通过kubectl explain pod命令查看下面有什么属性

```java
[root@master ~]# kubectl explain pod
KIND:     Pod
VERSION:  v1
DESCRIPTION:
     Pod is a collection of containers that can run on a host. This resource is
     created by clients and scheduled onto hosts.
FIELDS:
   apiVersion	<string>
     APIVersion defines the versioned schema of this representation of an
     object. Servers should convert recognized schemas to the latest internal
     value, and may reject unrecognized values. More info:
     https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
   kind	<string>
     Kind is a string value representing the REST resource this object
     represents. Servers may infer this from the endpoint the client submits
     requests to. Cannot be updated. In CamelCase. More info:
     https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
   metadata	<Object>
     Standard object's metadata. More info:
     https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
   spec	<Object>
     Specification of the desired behavior of the pod. More info:
     https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#spec-and-status
   status	<Object>
     Most recently observed status of the pod. This data may not be up to date.
     Populated by the system. Read-only. More info:
     https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#spec-and-status
[root@master ~]# 
```

如何查看下面的子属性

```java
kubectl explain pod.xxx
kubectl explain pod.metadata
```

**在kubernetes中基本所有资源的一级属性都是一样的，主要包含5部分：**

- apiVersion 版本，由kubernetes内部定义，版本号必须可以用 kubectl api-versions 查询到
- kind 类型，由kubernetes内部定义，版本号必须可以用 kubectl api-resources 查询到
- metadata 元数据，主要是资源标识和说明，常用的有name、namespace、labels等
- spec 描述，这是配置中最重要的一部分，里面是对各种资源配置的详细描述
- status 状态信息，里面的内容不需要定义，由kubernetes自动生成

**在上面的属性中，spec是接下来研究的重点，继续看下它的常见子属性:**

- containers `` 容器列表，用于定义容器的详细信息
- nodeName 根据nodeName的值将pod调度到指定的Node节点上
- nodeSelector `` 根据NodeSelector中定义的信息选择将该Pod调度到包含这些label的Node 上
- hostNetwork 是否使用主机网络模式，默认为false，如果设置为true，表示使用宿主机网络
- volumes `` 存储卷，用于定义Pod上面挂在的存储信息
- restartPolicy 重启策略，表示Pod在遇到故障的时候的处理策略
