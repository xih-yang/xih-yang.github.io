# 07、Kubernetes - 实战：Kubernetes资源对象之Service基础
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/12/7.html
- 分类：容器服务
- 分组：教程目录
运行于Pod中的容器化应用绝大多数是服务类的守护进程，例如envoy和demoapp等，它们受控于控制器资源对象，在自愿或非自愿中断后只能由重构的、具有同样功能的新Pod对象所取代，属非可再生类组件。在Kubernetes应用编排的动态、弹性管理模型下，Service资源用于为此类Pod对象提供一个固定、统一的访问接口及负载均衡能力，并支持新一代DNS系统的服务发现功能，解决了客户端发现并访问容器化应用的难题。然而，Service对象的IP地址都仅在Kubernetes集群内可达，它们无法接入集群外部的访问流量。在解决此类问题时，除了可以在单一节点上做端口（hostPort）暴露及让Pod资源共享使用工作节点的网络名称空间（hostNetwork）之外，更推荐用户使用NodePort或LoadBalancer类型的Service资源，或者是有七层负载均衡能力的Ingress资源。

## 一、Service资源及其实现模型

## 1、service的资源概述

Service是Kubernetes的核心资源类型之一，通常被看作微服务的一种实现。它事实上是一种抽象：通过规则定义出由多个Pod对象组合而成的逻辑集合，以及访问这组Pod的策略。Service关联Pod资源的规则要借助标签选择器完成。

作为一款容器编排系统，托管在Kubernetes之上、以Pod形式运行的应用进程的生命周期通常受控于Deployment或StatefulSet一类的控制器，由于节点故障或驱离等原因导致Pod对象中断后，会由控制器自动创建的新对象所取代，而扩缩容或更新操作更是会带来Pod对象的群体变动。因为编排系统需要确保服务在编排操作导致的应用Pod动态变动的过程中始终可访问，所以Kubernetes提出了满足这一关键需求的解决方案，即核心资源类型——Service。

app1的Pod作为客户端访问app2相关的Pod应用时，IP的变动或应用规模的缩减会导致客户端访问错误，而Pod规模的扩容又会使客户端无法有效使用新增的Pod对象，影响达成规模扩展的目的。

Service资源基于标签选择器把筛选出的一组Pod对象定义成一个逻辑组合，并通过自己的IP地址和端口将请求分发给该组内的Pod对象，如下图所示。Service向客户端隐藏了真实的处理用户请求的Pod资源，使得客户端的请求看上去是由Service直接处理并进行响应。

Service对象的IP地址（可称为ClusterIP或ServiceIP）是虚拟IP地址，由Kubernetes系统在Service对象创建时在专用网络（Service Network）地址中自动分配或由用户手动指定，并且在Service对象的生命周期中保持不变。Service基于端口过滤到达其IP地址的客户端请求，并根据定义将请求转发至其后端的Pod对象的相应端口之上，因此这种代理机制也称为“端口代理”或四层代理，工作于TCP/IP协议栈的传输层。Service对象会通过API Server持续监视（watch）标签选择器匹配到的后端Pod对象，并实时跟踪这些Pod对象的变动情况，例如IP地址变动以及Pod对象的增加或删除等。不过，Service并不直接连接至Pod对象，它们之间还有一个中间层——Endpoints资源对象，该资源对象是一个由IP地址和端口组成的列表，这些IP地址和端口则来自由Service的标签选择器匹配到的Pod对象。这也是很多场景中会使用“Service的后端端点”这一术语的原因。默认情况下，创建Service资源对象时，其关联的Endpoints对象会被自动创建。

本质上来讲，一个Service对象对应于工作节点内核之中的一组iptables或/和ipvs规则，这些规则能够将到达Service对象的ClusterIP的流量调度转发至相应Endpoint对象指向的IP地址和端口之上。内核中的iptables或ipvs规则的作用域仅为其所在工作节点的一个主机，因而生效于集群范围内的Service对象就需要在每个工作节点上都生成相关规则，从而确保任一节点上发往该Service对象请求的流量都能被正确转发。

每个工作节点的kube-proxy组件通过API Server持续监控着各Service及其关联的Pod对象，并将Service对象的创建或变动实时反映至当前工作节点上相应的iptables或ipvs规则上。客户端、Service及Pod对象的关系如下图所示。

```java
提示
Netfilter是Linux内核中用于管理网络报文的框架，它具有网络地址转换（NAT）、报文改动和报文过滤等防火墙功能，用户可借助用户空间的iptables等工具按需自由定制规则使用其各项功能。
ipvs是借助于Netfilter实现的网络请求报文调度框架，支持rr、wrr、lc、wlc、sh、sed和nq等10余种调度算法，用户空间的命令行工具是ipvsadm，用于管理工作于ipvs之上的调度规则。
```

Service对象的ClusterIP事实上是用于生成iptables或ipvs规则时使用的IP地址，它仅用于实现Kubernetes集群网络内部通信，且仅能够以规则中定义的转发服务的请求作为目标地址予以响应，这也是它之所以被称作虚拟IP的原因之一。kube-proxy把请求代理至相应端点的方式有3种：userspace、iptables和ipvs。

### 2.1 userpace代理模式

userspace是指Linux操作系统的用户空间。在这种模型中，kube-proxy负责跟踪API Server上Service和Endpoints对象的变动（创建或移除），并据此调整Service资源的定义。对于每个Service对象，它会随机打开一个本地端口（运行于用户空间的kube-proxy进程负责监听），任何到达此代理端口的连接请求都将被代理至当前Service资源后端的各Pod对象，至于哪个Pod对象会被选中则取决于当前Service资源的调度方式，默认调度算法是轮询（round-robin）。userspace代理模型工作逻辑如图所示。另外，此类Service对象还会创建iptables规则以捕获任何到达ClusterIP和端口的流量。在Kubernetes 1.1版本之前，userspace是默认的代理模型。

配的目标后端Pod对象。因请求报文在内核空间和用户空间来回转发，所以必然导致模型效率不高。

### 2.2 iptables代理模式

建Service对象的操作会触发集群中的每个kube-proxy并将其转换为定义在所属节点上的iptables规则，用于转发工作接口接收到的、与此Service资源ClusterIP和端口相关的流量。客户端发来请求将直接由相关的iptables规则进行目标地址转换（DNAT）后根据算法调度并转发至集群内的Pod对象之上，而无须再经由kube-proxy进程进行处理，因而称为iptables代理模型，如图所示。对于每个Endpoints对象，Service资源会为其创建iptables规则并指向其iptables地址和端口，而流量转发到多个Endpoint对象之上的默认调度机制是随机算法。iptables代理模型由Kubernetes v1.1版本引入，并于v1.2版本成为默认的类型。

在iptables代理模型中，Service的服务发现和负载均衡功能都使用iptables规则实现，而无须将流量在用户空间和内核空间来回切换，因此更为高效和可靠，但是性能一般，而且受规模影响较大，仅适用于少量Service规模的集群。

### 2.3 ipvs代理模式

Kubernetes自v1.9版本起引入ipvs代理模型，且自v1.11版本起成为默认设置。在此种模型中，kube-proxy跟踪API Server上Service和Endpoints对象的变动，并据此来调用netlink接口创建或变更ipvs（NAT）规则，如图所示。它与iptables规则的不同之处仅在于客户端请求流量的调度功能由ipvs实现，余下的其他功能仍由iptables完成。

ipvs代理模型中Service的服务发现和负载均衡功能均基于内核中的ipvs规则实现。类似于iptables，ipvs也构建于内核中的netfilter之上，但它使用hash表作为底层数据结构且工作于内核空间，因此具有流量转发速度快、规则同步性能好的特性，适用于存在大量Service资源且对性能要求较高的场景。ipvs代理模型支持rr、lc、dh、sh、sed和nq等多种调度算法。

## 3、service资源类型

无论哪一种代理模型，Service资源都可统一根据其工作逻辑分为ClusterIP、NodePort、LoadBalancer和ExternalName这4种类型。

（1）ClusterIP通过集群内部IP地址暴露服务，ClusterIP地址仅在集群内部可达，因而无法被集群外部的客户端访问。此为默认的Service类型。

（2）NodePortNodePort类型是对ClusterIP类型Service资源的扩展，它支持通过特定的节点端口接入集群外部的请求流量，并分发给后端的Server Pod处理和响应。因此，这种类型的Service既可以被集群内部客户端通过ClusterIP直接访问，也可以通过套接字: 与集群外部客户端进行通信，如图所示。显然，若集群外部的请求报文首先到的节点并非Service调度的目标Server Pod所在的节点，该请求必然因需要额外的转发过程（跃点）和更多的处理步骤而产生更多延迟。

集群外部客户端对NodePort发起的请求报文源地址并非集群内部地址，而请求报文又可能被收到报文的节点（例如图中的Y节点）转发至集群中的另一个节点（例如图中的X节点）上的Pod对象（例如图中的Server Pod 1），因此，为避免X节点直接将响应报文发送给外部客户端，Y节点需要先将收到的报文的源地址转为请求报文的目标IP（自身的节点IP）后再进行后续处理过程。

（3）LoadBalancer这种类型的Service依赖于部署在IaaS云计算服务之上并且能够调用其API接口创建软件负载均衡器的Kubernetes集群环境。LoadBalancer Service构建在NodePort类型的基础上，通过云服务商提供的软负载均衡器将服务暴露到集群外部，因此它也会具有NodePort和ClusterIP。简言之，创建LoadBalancer类型的Service对象时会在集群上创建一个NodePort类型的Service，并额外触发Kubernetes调用底层的IaaS服务的API创建一个软件负载均衡器，而集群外部的请求流量会先路由至该负载均衡器，并由该负载均衡器调度至各节点上该Service对象的NodePort，如图所示。该Service类型的优势在于，它能够把来自集群外部客户端的请求调度至所有节点（或部分节点）的NodePort之上，而不是让客户端自行决定连接哪个节点，也避免了因客户端指定的节点故障而导致的服务不可用。

（4）ExternalName通过将Service映射至由externalName字段的内容指定的主机名来暴露服务，此主机名需要被DNS服务解析至CNAME类型的记录中。换言之，此种类型不是定义由Kubernetes集群提供的服务，而是把集群外部的某服务以DNS CNAME记录的方式映射到集群内，从而让集群内的Pod资源能够访问外部服务的一种实现方式，如图所示。因此，这种类型的Service没有ClusterIP和NodePort，没有标签选择器用于选择Pod资源，也不会有Endpoints存在。

总体来说，若需要将Service资源发布至集群外部，应该将其配置为NodePort或Load-Balancer类型，而若要把外部的服务发布于集群内部供Pod对象使用，则需要定义一个ExternalName类型的Service资源，只是这种类型的实现要依赖于v1.7及更高版本的Kubernetes。

## 二、应用service资源

Service是Kubernetes核心API群组（core）中的标准资源类型之一。Service资源配置规范中常用的字段及意义如下所示。

```java
apiVersion: v1
kind: Service
metadata:
  name: …
  namespace: …
spec:
  type <string>                 Service类型，默认为ClusterIP(NodePort、ClusterIP、LoadBalancer、ExternalName)
  selector <map[string]string>  等值类型的标签选择器，内含“与”逻辑
  ports：                       Service的端口对象列表
  - name <string>               端口名称
    protocol <string>           协议，目前仅支持TCP、UDP和SCTP，默认为TCP
    port <integer>              Service的端口号
    targetPort  <string>        后端目标进程的端口号或名称，名称需由Pod规范定义
    nodePort <integer>          节点端口号，仅适用于NodePort和LoadBalancer类型
  clusterIP  <string>           Service的集群IP，建议由系统自动分配
  externalTrafficPolicy  <string> 外部流量策略处理方式，Local表示由当前节点处理，
　　　                            Cluster表示向集群范围内调度
  loadBalancerIP  <string>        外部负载均衡器使用的IP地址，仅适用于LoadBlancer
  externalName <string>           外部服务名称，该名称将作为Service的DNS CNAME值
```

不同Service类型所支持使用的配置字段有着明显的区别，具体使用时应该根据计划使用的类型进行选择。

## 1、应用ClusrerIP Service资源

创建Service对象的常用方法有两种：一是利用此前曾使用过的kubectl create service命令创建，另一个则是利用资源配置清单创建。Service资源对象的期望状态定义在spec字段中，较为常用的内嵌字段为selector和ports，用于定义标签选择器和服务端口。下面的配置清单是定义在services-clusterip-demo.yaml中的一个Service资源示例：

```java
apiVersion: v1
kind: Service
metadata:
  name: demoapp-svc
  namespace: default
spec:
  selector:
    app: demoapp
  ports:
  - name: http 端口名称标识
    protocol: TCP协议，支持TCP\UDP\SCTP,默认为TCP
    port: 80     Service自身的端口号
    targetPort: 80 目标端口号，即endpoint上定义的端口号
```

Service资源的spec.selector仅支持以映射（字典）格式定义的等值类型的标签选择器，例如上面示例中的app: demoapp。定义服务端口的字段spec.ports的值则是一个对象列表，它主要定义Service对象自身的端口与目标后端端口的映射关系。我们可以将示例中的Service对象创建于集群中，通过其详细描述了解其特性，如下面的命令及结果所示。

```java
root@k8s-master01:/apps/k8s-yaml/srv-case# kubectl apply -f services-clusterip-demo.yaml 
service/demoapp-svc created
root@k8s-master01:/apps/k8s-yaml/srv-case# kubectl get services -n default
NAME          TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
demoapp-svc   ClusterIP   10.68.106.128   <none>        80/TCP    50s
kubernetes    ClusterIP   10.68.0.1       <none>        443/TCP   3d13h
root@k8s-master01:/apps/k8s-yaml/srv-case# kubectl describe services demoapp-svc -n default
Name:              demoapp-svc
Namespace:         default
Labels:            <none>
Annotations:       <none>
Selector:          app=demoapp
Type:              ClusterIP
IP Family Policy:  SingleStack
IP Families:       IPv4
IP:                10.68.106.128
IPs:               10.68.106.128
Port:              http  80/TCP
TargetPort:        80/TCP
Endpoints:         <none> 没有与标签app=demoapp匹配的pod对象
Session Affinity:  None
Events:            <none>
```

上面命令中的结果显示，demoapp-svc默认设定为ClusterIP类型，并得到一个自动分配的IP地址10.68.106.128。创建Service对象的同时会创建一个与之同名且拥有相同标签选择器的Endpoint对象，若该标签选择器无法匹配到任何Pod对象的标签，则Endpoint对象无任何可用端点数据，于是Service对象的Endpoints字段值便成了。

Service对象自身只是iptables或ipvs规则，它并不能处理客户端的服务请求，而是需要把请求报文通过目标地址转换（DNAT）后转发至后端某个Server Pod，这意味着没有可用的后端端点的Service对象是无法响应客户端任何服务请求的，如下面从集群节点上发起的请求命令结果所示。

```java
root@k8s-master01:/apps/k8s-yaml/srv-case# curl 10.96.97.89
curl: (28) Failed to connect to 10.96.97.89 port 80: Connection timed out
```

下面使用命令式命令手动创建一个与该Service对象具有相同标签选择器的Deployment对象demoapp，它默认会自动创建一个拥有标签app: demoapp的Pod对象。

```java
#添加一个有app=demoapp标签的deployments
root@k8s-master01:/apps/k8s-yaml/srv-case# vim nginx-demoapp.yaml
apiVersion: apps/v1
kind: Deployment 
metadata:
  name: nginx-demoapp
  labels:
    app: demoapp
spec:
  replicas: 1
  selector:    
    matchLabels:
      app: demoapp
  template:    
    metadata:
      labels:
        app: demoapp 
    spec: 
      containers:
      - name: nginx
        image: harbor.ywx.net/k8s-baseimages/demoapp:v1.0
        imagePullPolicy: IfNotPresent
        ports:
        - name: http
          containerPort: 80
#执行该yaml文件
root@k8s-master01:/apps/k8s-yaml/srv-case# kubectl apply -f nginx-demoapp.yaml 
deployment.apps/nginx-demoapp created
root@k8s-master01:~# kubectl get pod -n default -o wide
NAME                             READY   STATUS    RESTARTS   AGE     IP               NODE             
nginx-demoapp-5b5cb85747-wnl7z   1/1     Running   0          6m53s   172.20.135.163   172.168.33.212   
#验证pod是否有app=demoapp标签
root@k8s-master01:/apps/k8s-yaml/srv-case# kubectl get pods -n default -l app=demoapp
NAME                             READY   STATUS    RESTARTS   AGE
nginx-demoapp-5b5cb85747-wnl7z   1/1     Running   0          2m5s
#验证service把带有app=demoapp的pod添加到endpoints
root@k8s-master01:/apps/k8s-yaml/srv-case# kubectl describe services demoapp-svc -n default
Name:              demoapp-svc
Namespace:         default
Labels:            <none>
Annotations:       <none>
Selector:          app=demoapp
Type:              ClusterIP
IP Family Policy:  SingleStack
IP Families:       IPv4
IP:                10.68.106.128
IPs:               10.68.106.128
Port:              http  80/TCP
TargetPort:        80/TCP
Endpoints:         172.20.135.163:80 带有app=demoapp的pod已经添加到了endpoints
Session Affinity:  None
Events:            <none>
```

Service对象demoapp-svc通过API Server获知这种匹配变动后，会立即创建一个以该Pod对象的IP和端口为列表项的名为demoapp-svc的Endpoints对象，而该Service对象详细描述信息中的Endpoint字段便以此列表项为值，如下面的命令结果所示。

```java
root@k8s-master01:~# kubectl get endpoints demoapp-svc 
NAME          ENDPOINTS           AGE
demoapp-svc   172.20.135.163:80   16m
root@k8s-master01:~# kubectl describe services demoapp-svc 
Name:              demoapp-svc
Namespace:         default
Labels:            <none>
Annotations:       <none>
Selector:          app=demoapp
Type:              ClusterIP
IP Family Policy:  SingleStack
IP Families:       IPv4
IP:                10.68.106.128
IPs:               10.68.106.128
Port:              http  80/TCP
TargetPort:        80/TCP
Endpoints:         172.20.135.163:80
Session Affinity:  None
Events:            <none>
```

扩展Deployment对象demoapp的应用规模引起的变动也将立即反映到相关的Endpoint和Service对象之上，例如将deployments/demoapp对象的副本扩展至3个，再来验证services/demoapp-svc的端点信息，如下面的命令及结果所示。

```java
root@k8s-master01:~# kubectl scale deployment nginx-demoapp --replicas=3
deployment.apps/nginx-demoapp scaled
root@k8s-master01:~# kubectl get pods -n default -o wide
NAME                             READY   STATUS    RESTARTS   AGE    IP               NODE             NOMINATED NODE   READINESS GATES
nginx-demoapp-54cc8d5bff-jls24   1/1     Running   0          49s    172.20.135.167   172.168.33.212   
nginx-demoapp-54cc8d5bff-qf9j8   1/1     Running   0          101s   172.20.85.250    172.168.33.210   
nginx-demoapp-54cc8d5bff-zgsmh   1/1     Running   0          49s    172.20.135.166   172.168.33.212   
root@k8s-master01:~# kubectl describe services demoapp-svc -n default
Name:              demoapp-svc
Namespace:         default
Labels:            <none>
Annotations:       <none>
Selector:          app=demoapp
Type:              ClusterIP
IP Family Policy:  SingleStack
IP Families:       IPv4
IP:                10.68.106.128
IPs:               10.68.106.128
Port:              http  80/TCP
TargetPort:        80/TCP
Endpoints:         172.20.135.166:80,172.20.135.167:80,172.20.85.250:80
Session Affinity:  None
Events:            <none>
```

接下来可于集群中的某节点上再次向服务对象demoapp-svc发起访问请求以进行测试，多次的访问请求还可评估负载均衡算法的调度效果，如下面的命令及结果所示。

```java
root@k8s-master01:~# while true; do curl -s 10.68.106.128/hostname; sleep 2;done
ServerName: nginx-demoapp-54cc8d5bff-jls24
ServerName: nginx-demoapp-54cc8d5bff-zgsmh
ServerName: nginx-demoapp-54cc8d5bff-qf9j8
```

kubeadm部署的Kubernetes集群的Service代理模型默认为iptables，它使用随机调度算法，因此Service会把客户端请求随机调度至其关联的某个后端Pod对象。请求取样次数越多，其调度效果也越接近算法的目标效果。

## 2、应用NodePort Service资源

部署Kubernetes集群系统时会预留一个端口范围，专用于分配给需要用到NodePort的Service对象，该端口范围默认为30000～32767。与Cluster类型的Service资源的一个显著不同之处在于，NodePort类型的Service资源需要显式定义.spec.type字段值为NodePort，必要时还可以手动指定具体的节点端口号。例如下面的配置清单（services-nodeport-demo.yaml）中定义的Service资源对象demoapp-nodeport-svc，它使用了NodePort类型，且人为指定了32223这个节点端口。

```java
kind: Service
apiVersion: v1
metadata:
  name: demoapp-nodeport-svc
spec:
  type: NodePort
  selector:
    app: demoapp 选择带有app=demoapp标签的pod加入该svc的endpoints
  ports:
  - name: http
    protocol: TCP
    port: 80
    targetPort: 80
    nodePort: 32223
```

实践中，并不鼓励用户自定义节点端口，除非能事先确定它不会与某个现存的Service资源产生冲突。无论如何，只要没有特别需要，留给系统自动配置总是较好的选择。将配置清单中定义的Service对象demoapp-nodeport-svc创建于集群之上，以便通过详细描述了解其状态细节。

```java
root@k8s-master01:/apps/k8s-yaml/srv-case# kubectl apply -f service-nodeport-demo.yaml 
service/demoapp-nodeport-svc created
root@k8s-master01:/apps/k8s-yaml/srv-case# kubectl get svc -n default
NAME                   TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
demoapp-nodeport-svc   NodePort    10.68.76.207    <none>        80:32223/TCP   27s
demoapp-svc            ClusterIP   10.68.106.128   <none>        80/TCP         31m
kubernetes             ClusterIP   10.68.0.1       <none>        443/TCP        3d14h
root@k8s-master01:/apps/k8s-yaml/srv-case# kubectl describe svc demoapp-nodeport-svc 
Name:                     demoapp-nodeport-svc
Namespace:                default
Labels:                   <none>
Annotations:              <none>
Selector:                 app=demoapp
Type:                     NodePort
IP Family Policy:         SingleStack
IP Families:              IPv4
IP:                       10.68.76.207
IPs:                      10.68.76.207
Port:                     http  80/TCP
TargetPort:               80/TCP
NodePort:                 http  32223/TCP
Endpoints:                172.20.135.166:80,172.20.135.167:80,172.20.85.250:80
Session Affinity:         None
External Traffic Policy:  Cluster
Events:                   <none>
#注意：nodeport模式会在所有节点上开启32223端口
```

命令结果显示，该Service对象用于调度集群外部流量时使用默认的Cluster策略，该策略优先考虑负载均衡效果，哪怕目标Pod对象位于另外的节点之上而带来额外的网络跃点，因而针对该NodePort的请求将会被分散调度至该Serivce对象关联的所有端点之上。可以在集群外的某节点上对任一工作节点的NodePort端口发起HTTP请求以进行测试。以节点k8s-node03为例，我们以如下命令向它的IP地址172.168.32.206的32223端口发起多次请求。

```java
root@k8s-master01:/apps/k8s-yaml/srv-case# while true; do curl -s 172.168.33.212:32223; sleep 2;done
iKubernetes demoapp v1.0 !! ClientIP: 172.20.135.128, ServerName: nginx-demoapp-54cc8d5bff-qf9j8, ServerIP: 172.20.85.250!
iKubernetes demoapp v1.0 !! ClientIP: 172.168.33.212, ServerName: nginx-demoapp-54cc8d5bff-jls24, ServerIP: 172.20.135.167!
iKubernetes demoapp v1.0 !! ClientIP: 172.168.33.212, ServerName: nginx-demoapp-54cc8d5bff-zgsmh, ServerIP: 172.20.135.166!
```

上面命令的结果显示出外部客户端的请求被调度至该Service对象的每一个后端Pod之上，而这些Pod对象可能会分散于集群中的不同节点。命令结果还显示，请求报文的客户端IP地址是最先接收到请求报文的节点上用于集群内部通信的IP地址，而非外部客户端地址，这也能够在Pod对象的应用访问日志中得到进一步验证，如下所示。

```java
root@k8s-master01:/apps/k8s-yaml/srv-case# kubectl logs nginx-demoapp-54cc8d5bff-zgsmh
 * Running on http://0.0.0.0:80/ (Press CTRL+C to quit)
172.20.32.128 - - [03/Oct/2021 02:29:54] "GET /hostname HTTP/1.1" 200 -
172.168.33.212 - - [03/Oct/2021 02:37:26] "GET / HTTP/1.1" 200 -
172.168.33.212 - - [03/Oct/2021 02:37:32] "GET / HTTP/1.1" 200 -
#第一个报文172.20.32.128为集群内部地址
```

集群外部客户端对NodePort发起的请求报文源地址并非集群内部地址，而请求报文又可能被收到报文的节点转发至集群中的另一个节点上的Pod对象，因此，为避免X节点直接将响应报文发送给外部客户端，Y节点需要先将收到的报文的源地址转为请求报文的目标IP（自身的节点IP）后再进行后续处理过程。这样才能确保Server Pod的响应报文必须由最先接收到请求报文的节点进行响应，因此NodePort类型的Service对象会对请求报文同时进行源地址转换（SNAT）和目标地址转换（DNAT）操作。

另一个外部流量策略Local则仅会将流量调度至请求的目标节点本地运行的Pod对象之上，以减少网络跃点，降低网络延迟，但当请求报文指向的节点本地不存在目标Service相关的Pod对象时将直接丢弃该报文。下面先把demoapp-nodeport-svc的外部流量策略修改为Local，而后再进行访问测试。简单起见，这里使用kubectl patch命令来修改Service对象的流量策略。

```java
root@k8s-master01:/apps/k8s-yaml/srv-case# kubectl patch services/demoapp-nodeport-svc -p '{"spec": {"externalTrafficPolicy": "Local"}}'  
service/demoapp-nodeport-svc patched
#或者直接修改yaml文件中externalTrafficPolicy
root@k8s-master01:/apps/k8s-yaml/srv-case# kubectl describe svc demoapp-nodeport-svc
Name:                     demoapp-nodeport-svc
Namespace:                default
Labels:                   <none>
Annotations:              <none>
Selector:                 app=demoapp
Type:                     NodePort
IP Family Policy:         SingleStack
IP Families:              IPv4
IP:                       10.68.76.207
IPs:                      10.68.76.207
Port:                     http  80/TCP
TargetPort:               80/TCP
NodePort:                 http  32223/TCP
Endpoints:                172.20.135.166:80,172.20.135.167:80,172.20.85.250:80
Session Affinity:         None
External Traffic Policy:  Local 本地有service相关的pod就直接转发，没有则直接丢弃报文
Events:                   <none>
```

-p选项中指定的补丁是一个JSON格式的配置清单片段，它引用了spec.externalTrafficPolicy字段，并为其赋一个新的值。配置完成后，我们再次发起测试请求时会看到，请求都被调度给了目标节点本地运行的Pod对象。另外，Local策略下无须在集群中转发流量至其他节点，也就不用再对请求报文进行源地址转换，Server Pod所看到的客户端IP就是外部客户端的真实地址。

```java
root@k8s-master01:/apps/k8s-yaml/srv-case# kubectl get pod -n default -o wide
NAME                             READY   STATUS    RESTARTS   AGE   IP               NODE             
nginx-demoapp-54cc8d5bff-jls24   1/1     Running   0          21m   172.20.135.167   172.168.33.212    
nginx-demoapp-54cc8d5bff-qf9j8   1/1     Running   0          22m   172.20.85.250    172.168.33.210    
nginx-demoapp-54cc8d5bff-zgsmh   1/1     Running   0          21m   172.20.135.166   172.168.33.212    
```

访问：k8s-node03，在k8s-node03上有servicex相关的pod节点

```java
root@k8s-master01:/apps/k8s-yaml/srv-case# while true; do curl -s 172.168.33.212:32223; sleep 2 ;done
iKubernetes demoapp v1.0 !! ClientIP: 172.168.33.207, ServerName: nginx-demoapp-54cc8d5bff-jls24, ServerIP: 172.20.135.167!
iKubernetes demoapp v1.0 !! ClientIP: 172.168.33.207, ServerName: nginx-demoapp-54cc8d5bff-zgsmh, ServerIP: 172.20.135.166!
iKubernetes demoapp v1.0 !! ClientIP: 172.168.33.207, ServerName: nginx-demoapp-54cc8d5bff-jls24, ServerIP: 172.20.135.167!
```

访问：k8s-node02，在k8s-node02上没有servicex相关的pod节点

```java
root@k8s-master01:/apps/k8s-yaml/srv-case# while true; do curl -s 172.168.33.211:32223; sleep 2 ;done
```

因为k8s-node02上没有services的pod资源，当请求报文指向的节点本地不存在目标Service相关的Pod对象时将直接丢弃该报文。

NodePort类型的Service资源同样会被配置ClusterIP，以确保集群内的客户端对该服务的访问请求可在集群范围的通信中完成。

## 3、应用LoadBalancer Service资源

NodePort类型的Service资源虽然能够在集群外部访问，但外部客户端必须事先得知NodePort和集群中至少一个节点IP地址，一旦被选定的节点发生故障，客户端还得自行选择请求访问其他的节点，因而一个有着固定IP地址的固定接入端点将是更好的选择。此外，集群节点很可能是某IaaS云环境中仅具有私有IP地址的虚拟主机，这类地址对互联网客户端不可达，为此类节点接入流量也要依赖于集群外部具有公网IP地址的负载均衡器，由其负责接入并调度外部客户端的服务请求至集群节点相应的NodePort之上。

IaaS云计算环境通常提供了LBaaS（Load Balancer as a Service）服务，它允许租户动态地在自己的网络创建一个负载均衡设备。部署在此类环境之上的Kubernetes集群可借助于CCM（Cloud Controller Manager）在创建LoadBalancer类型的Service资源时调用IaaS的相应API，按需创建出一个软件负载均衡器。但CCM不会为那些非LoadBalancer类型的Service对象创建负载均衡器，而且当用户将LoadBalancer类型的Service调整为其他类型时也将删除此前创建的负载均衡器。

```java
注意：kubeadm在部署Kubernetes集群时并不会默认部署CCM，有需要的用户需要自行部署。
```

对于没有此类API可用的Kubernetes集群，管理员也可以为NodePort类型的Service手动部署一个外部的负载均衡器（推荐使用HA配置模型），并配置将请求流量调度至各节点的NodePort之上，这种方式的缺点是管理员需要手动维护从外部负载均衡器到内部服务的映射关系。从实现方式上来说，LoadBalancer类型的Service就是在NodePort类型的基础上请求外部管理系统的API，并在Kubernetes集群外部额外创建一个负载均衡器，将流量调度至该NodePort Service之上。Kubernetes以异步方式请求创建负载均衡器，并将有关配置保存在Service对象的.status.loadBalancer字段中。下面是定义在services-loadbalancer-demo.yam配置清单中的LoadBalancer类型Service资源，在最简单的配置模型中，用户仅需要修改NodePort Service服务定义中type字段的值为LoadBalancer即可。

```java
kind: Service
apiVersion: v1
metadata:
  name: demoapp-loadbalancer-svc
spec:
  type: LoadBalancer
  selector:
    app: demoapp
  ports:
  - name: http
    protocol: TCP
    port: 80
    targetPort: 80
```

Service对象的loadBalancerIP负责承接外部发来的流量，该IP地址通常由云服务商系统动态配置，或者借助.spec.loadBalancerIP字段显式指定，但有些云服务商不支持用户设定该IP地址，这种情况下，即便提供了也会被忽略。外部负载均衡器的流量会直接调度至Service后端的Pod对象之上，而如何调度流量则取决于云服务商，有些环境可能还需要为Service资源的配置定义添加注解，必要时请自行参考云服务商文档说明。另外，LoadBalancer Service还支持使用.spec. loadBalancerSourceRanges字段指定负载均衡器允许的客户端来源的地址范围。

## 4、外部IP

若集群中部分或全部节点除了有用于集群通信的节点IP地址之外，还有可用于外部通信的IP地址，如图中的EIP-1和EIP-2，那么我们还可以在Service资源上启用spec.externalIPs字段来基于这些外部IP地址向外发布服务。所有路由到指定的外部IP（externalIP）地址某端口的请求流量都可由该Service代理到后端Pod对象之上，如图所示。从这个角度来说，请求流量到达外部IP与节点IP并没有本质区别，但外部IP却可能仅存在于一部分的集群节点之上，而且它不受Kubernetes集群管理，需要管理员手动介入其配置和回收等操作任务中。

外部IP地址可结合ClusterIP、NodePort或LoadBalancer任一类型的Service资源使用，而到达外部IP的请求流量会直接由相关联的Service调度转发至相应的后端Pod对象进行处理。假设示例Kubernetes集群中的k8s-node01节点上拥有一个可被路由到的IP地址172.168.33.210，我们期望能够将demoapp的服务通过该外部IP地址发布到集群外部，则可以使用下列配置清单（services-externalip-demo.yaml）中的Service资源实现。

```java
kind: Service
apiVersion: v1
metadata:
  name: demoapp-externalip-svc
  namespace: default
spec:
  type: ClusterIP
  selector:
    app: demoapp
  ports:
  - name: http
    protocol: TCP
    port: 80
    targetPort: 80
  externalIPs:
  - 172.168.33.210 集群外部用户可以通过172.168.33.210访问集群服务
```

不难猜测，节点k8s-node01故障也必然导致该外部IP上公开的服务不再可达，除非该IP地址可以浮动到其他节点上。如今，大多数云服务商都支持浮动IP的功能，该IP地址可绑定在某个主机，并在其故障时通过某种触发机制自动迁移至其他主机。在不具有浮动IP功能的环境中进行测试之前，需要先在k8s-node01上（或根据规划的其他的节点上）手动配置172.168.34.200这个外部IP地址。而且，在模拟节点故障并手动将外部IP地址配置在其他节点进行浮动IP测试时，还需要清理之前的ARP地址缓存。

## 三、Service的Endpoint资源

在信息技术领域，端点是指通过LAN或WAN连接的能够用于网络通信的硬件设备，它在广义上可以指代任何与网络连接的设备。在Kubernetes语境中，端点通常代表Pod或节点上能够建立网络通信的套接字，并由专用的资源类型Endpoint进行定义和跟踪。

## 1、Endpoint与容器探针

Service对象借助于Endpoint资源来跟踪其关联的后端端点，但Endpoint是“二等公民”，Service对象可根据标签选择器直接创建同名的Endpoint对象，不过用户几乎很少有直接使用该类型资源的需求。例如，创建下面配置清单中名为services-readiness-demo的Service对象时就会自动创建一个同名的Endpoint对象。

```java
kind: Service
apiVersion: v1
metadata:
  name: services-readiness-demo
  namespace: default
spec:
  selector:
    app: demoapp-with-readiness
  ports:
  - name: http
    protocol: TCP
    port: 80
    targetPort: 80
---
apiVersion: apps/v1
kind: Deployment      定义Deployment对象，它使用Pod模板创建Pod对象
metadata:
  name: demoapp2
spec:
  replicas: 2         该Deployment对象要求满足的Pod对象数量
  selector:           Deployment对象的标签选择器，用于筛选Pod对象并完成计数
    matchLabels:
      app: demoapp-with-readiness
  template:           由Deployment对象使用的Pod模板，用于创建足额的Pod对象
    metadata:
      labels:
        app: demoapp-with-readiness
    spec:
      containers:
      - name: demoapp
      image: ikubernetes/demoapp:v1.0
        image: harbor.ywx.net/k8s-baseimages/demoapp:v1.0
        name: demoapp
        imagePullPolicy: IfNotPresent
        readinessProbe:
          httpGet:    定义探针类型和探测方式
            path: '/readyz'
            port: 80
          initialDelaySeconds: 15   初次检测延迟时长
          periodSeconds: 10         检测周期
```

Endpoint对象会根据就绪状态把同名Service对象标签选择器筛选出的后端端点的IP地址分别保存在subsets.addresses字段和subsets.notReadyAddresses字段中，它通过API Server持续、动态跟踪每个端点的状态变动，并即时反映到端点IP所属的字段。仅那些位于subsets.addresses字段的端点地址可由相关的Service用作后端端点。此外，相关Service对象标签选择器筛选出的Pod对象数量的变动也将会导致Endpoint对象上的端点数量变动。

上面配置清单中定义Endpoint对象services-readiness-demo会筛选出Deployment对象demoapp2创建的两个Pod对象，将它们的IP地址和服务端口创建为端点对象。但延迟15秒启动的容器探针会导致这两个Pod对象至少要在15秒以后才能转为“就绪”状态，这意味着在上面配置清单中的Service资源创建后至少15秒之内无可用后端端点，例如下面的资源创建和Endpoint资源监视命令结果中，在20秒之后，Endpoint资源services-readiness-demo才得到第一个可用的后端端点IP。

```java
root@k8s-master01:/apps/k8s-yaml/srv-case# kubectl apply -f services-readiness-demo.yaml 
service/services-readiness-demo created
deployment.apps/demoapp2 created
root@k8s-master01:/apps/k8s-yaml/srv-case# kubectl get endpoints services-readiness-demo -w
NAME                      ENDPOINTS   AGE
services-readiness-demo               33s
services-readiness-demo   172.20.135.169:80   40s
services-readiness-demo   172.20.135.168:80,172.20.135.169:80   40s
root@k8s-master01:/apps/k8s-yaml/srv-case# kubectl describe endpoints services-readiness-demo 
Name:         services-readiness-demo
Namespace:    default
Labels:       <none>
Annotations:  endpoints.kubernetes.io/last-change-trigger-time: 2021-10-03T11:07:31+08:00
Subsets:
  Addresses:          172.20.135.168,172.20.135.169
  NotReadyAddresses:  <none>
  Ports:
    Name  Port  Protocol
    ----  ----  --------
    http  80    TCP
Events:  <none>
root@k8s-master01:/apps/k8s-yaml/srv-case# kubectl get endpoints/services-readiness-demo -o yaml
apiVersion: v1
kind: Endpoints
metadata:
  annotations:
    endpoints.kubernetes.io/last-change-trigger-time: "2021-10-03T11:07:31+08:00"
  creationTimestamp: "2021-10-03T03:06:51Z"
  name: services-readiness-demo
  namespace: default
  resourceVersion: "621584"
  uid: ef4fd249-07c4-4a2b-92f0-258a2df24302
subsets:
- addresses:
  - ip: 172.20.135.168
    nodeName: 172.168.33.212
    targetRef:
      kind: Pod
      name: demoapp2-5c8d4df55d-cxq4l
      namespace: default
      resourceVersion: "621581"
      uid: 25b0c06e-3016-4528-91f8-eec87a8417b9
  - ip: 172.20.135.169
    nodeName: 172.168.33.212
    targetRef:
      kind: Pod
      name: demoapp2-5c8d4df55d-bpzs6
      namespace: default
      resourceVersion: "621576"
      uid: 8b632422-66f0-482a-a31f-b4532362c367
  ports:
  - name: http
    port: 80
    protocol: TCP
#无 NotReadyAddresses状态的IP
```

因任何原因导致的后端端点就绪状态检测失败，都会触发Endpoint对象将该端点的IP地址从subsets.addresses字段移至subsets.notReadyAddresses字段。例如，我们使用如下命令人为地将地址172.20.135.168的Pod对象中的容器就绪状态检测设置为失败，以进行验证。

```java
root@k8s-master01:/apps/k8s-yaml/srv-case# curl -s -X POST -d 'readyz=FAIL' 172.20.135.168/readyz
```

等待至少3个检测周期共30秒之后，获取Endpoint对象services-readiness-demo的资源清单的命令将返回类似如下信息。

```java
root@k8s-master01:/apps/k8s-yaml/srv-case# kubectl describe endpoints services-readiness-demo 
Name:         services-readiness-demo
Namespace:    default
Labels:       <none>
Annotations:  endpoints.kubernetes.io/last-change-trigger-time: 2021-10-03T11:10:51+08:00
Subsets:
  Addresses:          172.20.135.169
  NotReadyAddresses:  172.20.135.168172.20.135.168被设置为NotReadyAddresses状态
  Ports:
    Name  Port  Protocol
    ----  ----  --------
    http  80    TCP
Events:  <none>
root@k8s-master01:/apps/k8s-yaml/srv-case# kubectl get endpoints/services-readiness-demo -o yaml
apiVersion: v1
kind: Endpoints
metadata:
  annotations:
    endpoints.kubernetes.io/last-change-trigger-time: "2021-10-03T11:10:51+08:00"
  creationTimestamp: "2021-10-03T03:06:51Z"
  name: services-readiness-demo
  namespace: default
  resourceVersion: "621990"
  uid: ef4fd249-07c4-4a2b-92f0-258a2df24302
subsets:
- addresses:
  - ip: 172.20.135.169
    nodeName: 172.168.33.212
    targetRef:
      kind: Pod
      name: demoapp2-5c8d4df55d-bpzs6
      namespace: default
      resourceVersion: "621576"
      uid: 8b632422-66f0-482a-a31f-b4532362c367
  notReadyAddresses: 172.20.135.168被设置为notReadyAddresses
  - ip: 172.20.135.168
    nodeName: 172.168.33.212
    targetRef:
      kind: Pod
      name: demoapp2-5c8d4df55d-cxq4l
      namespace: default
      resourceVersion: "621987"
      uid: 25b0c06e-3016-4528-91f8-eec87a8417b9
  ports:
  - name: http
    port: 80
    protocol: TCP
```

该故障端点重新转回就绪状态后，Endpoints对象会将其移回subsets.addresses字段中。这种处理机制确保了Service对象不会将客户端请求流量调度给那些处于运行状态但服务未就绪（notReady）的端点。

## 2、自定义Endpoint资源

除了借助Service对象的标签选择器自动关联后端端点外，Kubernetes也支持自定义Endpoint对象，用户可通过配置清单创建具有固定数量端点的Endpoint对象，而调用这类Endpoint对象的同名Service对象无须再使用标签选择器。Endpoint资源的API规范如下。

```java
apiVersion: v1
kind: Endpoint
metadata:                  对象元数据
  name:
  namespace:
subsets:                   端点对象的列表
- addresses:               处于“就绪”状态的端点地址对象列表
  - hostname  <string>     端点主机名
    ip <string>            端点的IP地址，必选字段
    nodeName <string>      节点主机名
    targetRef：            提供了该端点的对象引用
      apiVersion <string>  被引用对象所属的API群组及版本
      kind <string>        被引用对象的资源类型，多为Pod
      name <string>        对象名称
      namespace <string>   对象所属的名称空间
      fieldPath <string>   被引用的对象的字段，在未引用整个对象时使用，通常仅引用
                           指定Pod对象中的单容器，例如spec.containers[1]
      uid <string>         对象的标识符
  notReadyAddresses:       处于“未就绪”状态的端点地址对象列表，格式与address相同
  ports:                   端口对象列表
  - name <string>          端口名称
    port <integer>         端口号，必选字段
    protocol <string>      协议类型，仅支持UDP、TCP和SCTP，默认为TCP
    appProtocol <string>   应用层协议
```

自定义Endpoint常将那些不是由编排程序编排的应用定义为Kubernetes系统的Service对象，从而让客户端像访问集群上的Pod应用一样请求外部服务。例如，假设要把Kubernetes集群外部一个可经由172.168.32.51:3306或172.168.32.52:3306任一端点访问的MySQL数据库服务引入集群中，便可使用如下清单中的配置完成。

```java
apiVersion: v1
kind: Endpoints
metadata:
  name: mysql-externalname必须与service的name一样，才能被service调用
  namespace: default
subsets:
#引入集群的外部地址和端口
- addresses:
  - ip: 172.29.9.51
  - ip: 172.29.9.52
  ports:
  - name: mysql
    port: 3306
    protocol: TCP
---
apiVersion: v1
kind: Service
metadata:
  name: mysql-externalname必须与endpoint的name一样，才能被service调用
  namespace: default
spec:
  type: ClusterIP
  ports:
  - name: mysql
    port: 3306
    targetPort: 3306
    protocol: TCP
kubernetes集群可以通过访问该service来调用外部的mysql。
```

显然，非经Kubernetes管理的端点，其就绪状态难以由Endpoint通过注册监视特定的API资源对象进行跟踪，因而用户需要手动维护这种调用关系的正确性。

Endpoint资源提供了在Kubernetes集群上跟踪端点的简单途径，但对于有着大量端点的Service来说，将所有的网络端点信息都存储在单个Endpoint资源中，会对Kubernetes控制平面组件产生较大的负面影响，且每次端点资源变动也会导致大量的网络流量。EndpointSlice（端点切片）通过将一个服务相关的所有端点按固定大小（默认为100个）切割为多个分片，提供了一种更具伸缩性和可扩展性的端点替代方案。EndpointSlice由引用的端点资源组成，类似于Endpoint，它可由用户手动创建，也可由EndpointSlice控制器根据用户在创建Service资源时指定的标签选择器筛选集群上的Pod对象自动创建。单个EndpointSlice资源默认不能超过100个端点，小于该数量时，EndpointSlice与Endpoint存在1:1的映射关系且性能相同。EndpointSlice控制器会尽可能地填满每一个EndpointSlice资源，但不会主动进行重新平衡，新增的端点会尝试添加到现有的EndpointSlice资源上，若超出现有任何EndpointSlice对象的可用的空余空间，则将创建新的EndpointSlice，而非分散填充。

EndpointSlice自Kubernetes 1.17版本开始升级为Beta版，隶属于discovery.k8s.io这一API群组。EndpointSlice控制器会为每个Endpoint资源自动生成一个EndpointSlice资源。例如，下面的命令列出了kube-system名称空间中的所有EndpointSlice资源，kube-dns-mbdj5来自于对kube-dns这一Endpoint资源的自动转换。

```java
~$ kubectl get endpointslice -n kube-system
NAME           ADDRESSTYPE        PORTS            ENDPOINTS        AGE
kube-dns-mbdj5   IPv4          53,9153,53   10.244.0.6,10.244.0.7   13d
```

EndpointSlice资源根据其关联的Service与端口划分成组，每个组隶属于同一个Service。
