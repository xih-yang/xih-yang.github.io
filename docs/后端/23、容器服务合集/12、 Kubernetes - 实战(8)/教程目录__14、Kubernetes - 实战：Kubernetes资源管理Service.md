# 14、Kubernetes - 实战：Kubernetes资源管理Service
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/8/14.html
- 分类：容器服务
- 分组：教程目录
## 一、Kubernetes资源管理Service的使用定义

### 1.1 介绍说明

- 防止Pod失联
- 定义一组Pod的访问策略
- 支持ClusterIP、NodePort以及LoadBalance三种类型
- Service的底层实现主要有Iptables和IPVS两种网络模型
- Pod与service关系
- 通过lable-selector相关联
- 通过Service实现Pod的负载均衡（TCP/UDP 4层）

### 1.2 service定义

```java
# 版本
apiVersion: v1
# 资源对象
kind: Service
# 元数据
metadata:
  指定service名称
  name: my-service
  命名空间
  namespace: default
spec:
  分配IP
  clusterIP: 10.0.0.1
  指定端口
  ports:
  端口名称
  - name: http
    指定service端口
    port: 80
    service使用协议
    protocol: TCP
    容器端口，转发后端容器端口
    targetPort: 80
  标签选择器，通过标签匹配关联的pod
  selector:
    标签
    app: nginx
```

实例
[1] 创建service yml文件

```java
apiVersion: v1
kind: Service
metadata:
  name: my-service
  namespace: default
spec:
  clusterIP: 10.0.0.123
  ports:
  - name: http
    port: 80
    protocol: TCP
    targetPort: 80
  selector:
    app: nginx
```

[2] 创建service

```java
kubectl apply -f service.yaml
```

[3] 查看创建的service

```java
kubectl get service
NAME             TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)        AGE
my-service       ClusterIP   10.0.0.123   <none>        80/TCP
```

[4] 动态感知查看分配的Node

```java
kubectl get endpoints
NAME             ENDPOINTS                                   AGE
kubernetes       192.168.1.108:6443,192.168.1.109:6443       2d16h
my-service       <none>                                      2m54s
nginx-service    172.17.1.2:80,172.17.1.3:80,172.17.1.6:80   44h
nginx-service2   <none>                                      17h
注：每个service对应一个ENDPOINTS控制器，service则用来关联pod
```

[5] 查看ENDPOINTS详细信息

```java
kubectl describe service my-service
Name:              my-service
Namespace:         default
Labels:            <none>
Annotations:       kubectl.kubernetes.io/last-applied-configuration:
                     {"apiVersion":"v1","kind":"Service","metadata":{"annotations":{},"name":"my-service","namespace":"default"},"spec":{"clusterIP":"10.0.0.12...
Selector:          app=nginx
Type:              ClusterIP
IP:                10.0.0.123
Port:              http  80/TCP
TargetPort:        80/TCP
Endpoints:         <none>
Session Affinity:  None
Events:            <none>
```

### 二、Service代理k8s外部应用

希望在生产环境中使用某个固定的名称而非IP地址进行访问外部中间件服务

希望Service指向一个Namespace中或其他集群中的服务

某个项目正在迁移至k8s集群，但是一部分服务任然在集群外部，此时可以使用Service代理至k8s集群外部的服务。

[1] 常见代理service服务

```java
apiVersion: v1
kind: Service
metadata:
  labels:
    app: nginx-svc-external
  name: nginx-svc-external
spec:
  ports:
  - name: http
    port: 80
    protocol: TCP
    targetPort: 80
  sessionAffinity: None
  type: ClusterIP
```

[2] 常见外部服务的endpoint服务

```java
apiVersion: v1
kind: Endpoints
metadata:
  labels:
    app: nginx-svc-external
  name: nginx-svc-external
  namespace: default
subsets:
- addresses:
  - ip: 42.236.78.232   外部服务的IP地址
  ports:
  - name: http
    port: 80
    protocol: TCP
```

## 三、Kubernetes资源管理service类型

- ClusterIP：默认，分配一个集群内部可以访问的虚拟IP（VIP）
- NodePort：在每个Node上分配一个端口作为外部访问入口
- LoadBalancer：工作在特定的cloud Provider上，例如Google Cloud，AWS，OpenStack
- ExternalName：通过返回定义的CNAME别名

### 3.1 ClusterIP

### 3.2 NodePort

### 3.3 LoadBalancer

### 3.4 二、NodePort端口固定

```java
# 固定范围在kube-apiserver配置文件下参数
--service-node-port-range=30000-50000
实例
# 通过配置yaml文件固定端口 
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  selector:
    app: A
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8080
      固定端口数值，必须是配置文件范围内
      nodePort: 30001
  网络类型
  type: NodePort
```

## 四、Kubernetes资源管理service代理模式

底层流量转发与负载均衡实现：

- Iptables(默认)
- IPVS

### 4.1 IPVS

了解代理模式之IPVS工作原理

LVS基于IPVS内核调度模块实现的负载均衡。

```java
# 查看路由对应关系，需要先下载ipvsadm工具
Ipvsadm -ln
注：内核态处理
IPVS：
工作在内核态，有更好的性能
调度算法丰富：rr\wrr\lc\wlc\ip hash …
```

[1]安装IPVS

```java
yum -y install ipvsadm
```

开启使用IPVS模式

[2] Node：启动IPVS模式，修改配置文件

```java
vim /opt/kubernetes/cfg/kube-proxy
KUBE_PROXY_OPTS="--logtostderr=true \
--v=4 \
--hostname-override=192.168.1.110 \
--cluster-cidr=10.0.0.0/24 \
--proxy-mode=ipvs \
--masquerade-all=true \
# 指定默认调度算法
--ipvs-scheduler=wrr \
--kubeconfig=/opt/kubernetes/cfg/kube-proxy.kubeconfig"
```

[3] 重启kube-proxy

```java
systemctl restart kube-proxy
```

### 4.2 Iptables

iptables实现是通过linux内核，实现linux内核级防火墙。

查看所有规则：iptables-save more

原理：通过iptables为访问来源创建许多规则，所有规则从上到下进行匹配。

问题：
**1、** 创建很多iptables规则（更新，非增量式）；

**2、** iptables规则从上到下逐条匹配（延时大）；

**3、** 用户态处理；

Iptables：

- 灵活，功能强大（可以在数据包不同阶段对包进行操作）
- 规则遍历匹配和更新，呈线性时延

## 五、Kubernetes资源管理service案例

### 5.1 创建简单service

```java
apiVersion: v1
kind: Service
metadata:
name: my-service
spec:
selector:
 app: MyApp  ## 使用选择器选择所有Pod
# type: ClusterIPtype很重要，不写默认是ClusterIP
ports:
 - protocol: TCP
  port: 80
  targetPort: 9376
```

- Service 创建完成后，会对应一组EndPoint。可以kubectl get ep 进行查看
- type有四种，每种对应不同服务发现机制
- Servvice可以利用Pod的就绪探针机制，只负载就绪了的Pod。自动剔除没有就绪的Pod

### 5.2 创建无Selector的Service

- 我们可以创建Service不指定Selector
- 然后手动创建EndPoint，指定一组Pod地址。
- 此场景用于我们负载均衡其他中间件场景。

```java
# 无selector的svc
apiVersion: v1
kind: Service
metadata:
  name: my-service-no-selector
spec:
  ports:
  - protocol: TCP
    name: http  ###一定注意，name可以不写，
   但是这里如果写了name，那么endpoint里面的ports必须有同名name才能绑定
    port: 80  # service 80
    targetPort: 80  #目标80
---
apiVersion: v1
kind: Endpoints
metadata:
  name: my-service-no-selector  ### ep和svc的绑定规则是：和svc同名同名称空间，port同名或同端口
  namespace: default
subsets:
- addresses:
  - ip: 220.181.38.148
  - ip: 39.156.69.79
  - ip: 192.168.169.165
ports:
- port: 80
  name: http  ## svc有name这里一定要有
  protocol: TCP
```

```java
## 实验
apiVersion: v1
kind: Service
metadata:
  name: cluster-service-no-selector
  namespace: default
spec:
  不选中Pod而在下面手动定义可以访问的EndPoint
  type: ClusterIP
  ports:
  - name: abc
    port: 80  ## 访问当前service 的 80
    targetPort: 80  ## 派发到Pod的 80
---
apiVersion: v1
kind: Endpoints
metadata:
  name: cluster-service-no-selector  ## 和service同名
  namespace: default
subsets:
- addresses:
  - ip: 192.168.169.184
  - ip: 192.168.169.165
  - ip: 39.156.69.79
ports:
- name: abc  ## ep和service要是一样的
  port: 80
  protocol: TCP
```

场景：pod要访问Mysql。Mysql单独部署到很多机器，每次记ip麻烦

集群内创建一个service，实时的可以剔除EP信息。反向代理集群的东西。

### 5.3 ClusterIP

```java
type: ClusterIP
ClusterIP: 手动指定/None/""
```

- 手动指定的ClusterIP必须在合法范围内
- None会创建出没有ClusterIP的headless service（无头服务），Pod需要用服务的域名访问

### 5.4 NodePort

```java
apiVersion: v1
kind: Service
metadata:
  name: my-service
  namespace: default
type: NodePort
ports:
  - protocol: TCP
    port: 80  # service 80
    targetPort: 80  #目标80
    nodePort: 32123  #自定义
```

- 如果将 type 字段设置为 NodePort ，则 Kubernetes 将在 --service-node-port-range 标志指定的范围内分配端口（默认值：30000-32767）
- k8s集群的所有机器都将打开监听这个端口的数据，访问任何一个机器，都可以访问这个service对应的Pod
- 使用 nodePort 自定义端口

### 5.5 ExternalName

```java
apiVersion: v1
kind: Service
metadata:
  name: my-service-05
  namespace: default
spec:
  type: ExternalName
  externalName: baidu.com
```

- 其他的Pod可以通过访问这个service而访问其他的域名服务
- 但是需要注意目标服务的跨域问题

### 5.6 LoadBalancer

```java
apiVersion: v1
kind: Service
metadata:
  creationTimestamp: null
  labels:
    app.kubernetes.io/name: load-balancer-example
  name: my-service
spec:
  ports:
  - port: 80
    protocol: TCP
    targetPort: 80
  selector:
    app.kubernetes.io/name: load-balancer-example
  type: LoadBalancer
```

### 5.7 扩展-externalIP

在Service 的定义中,externalIPs 可以和任何类型的 .spec.type 一通使用。在下面的例子中，

客户端可通过 80.11.12.10:80 （externalIP:port） 访问 my-service

```java
apiVersion: v1
kind: Service
metadata:
name: my-service-externalip
spec:
selector:
 app: canary-nginx
ports:
 - name: http
  protocol: TCP
  port: 80
  targetPort: 80
externalIPs: 定义只有externalIPs指定的地址才可以访问这个service
 - 10.170.0.111
```

### 5.8 扩展-Pod的DNS

```java
apiVersion: v1
kind: Service
metadata:
  name: default-subdomain
spec:
  selector:
    name: busybox
  clusterIP: None
  ports:
  - name: foo 实际上不需要指定端口号
    port: 1234
    targetPort: 1234
---
apiVersion: v1
kind: Pod
metadata:
  name: busybox1
  labels:
    name: busybox
spec:
  hostname: busybox-1
  subdomain: default-subdomain
  指定必须和svc名称一样，才可以 podName.subdomain.名称空间.svc.cluster.local访问。否则访问不同指定Pod
  containers:
  - image: busybox:1.28
    command:
      - sleep
      - "3600"
    name: busybox
---
apiVersion: v1
kind: Pod
metadata:
  name: busybox2
  labels:
    name: busybox
spec:
  hostname: busybox-2
  subdomain: default-subdomain
  containers:
  - image: busybox:1.28
    command:
      - sleep
      - "3600"
    name: busybox
```

- 访问 busybox-1. default-subdomain .default. svc.cluster.local 可以访问到busybox-1。
- 访问Service
- 同名称空间

ping service-name 即可

不同名称空间

- ping service-name.namespace 即可

访问Pod

同名称空间

- ping pod-host-name.service-name 即可

不同名称空间

- ping pod-host-name.service-name.namespace 即可
