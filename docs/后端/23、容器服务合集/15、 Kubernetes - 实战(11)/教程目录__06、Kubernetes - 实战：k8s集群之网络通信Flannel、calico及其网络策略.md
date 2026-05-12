# 06、Kubernetes - 实战：k8s集群之网络通信Flannel、calico及其网络策略
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/11/6.html
- 分类：容器服务
- 分组：教程目录
## 1、如何实现网络通信？

k8s通过CNI接口接入其他插件来实现网络通信。主要有插件有flannel和calico两个插件

CNI插件存放的位置： `/etc/cni/net.d/10-flannel.conflist` ，当更换插件时，需要把这个文件删除。

插件使用的解决方案如下：

虚拟网桥，虚拟网卡，多个容器共用一个虚拟网卡进行通信。

多路复用：MacVLAN，多个容器共用一个物理网卡进行通信。

硬件交换：SR-LOV，一个物理网卡可以虚拟出多个接口，这个性能最好。

同一个pod内的多个容器可以互相通信，共用网络。

同一节点的pod之间通过cni网桥转发数据包。

不同节点的pod之间的通信需要网络插件支持。

pod和service通信: 通过iptables或ipvs实现通信，ipvs取代不了iptables，因为ipvs只能做负载均衡，而做不了nat转换。

pod和外网通信使用iptables的M地址伪装功能。

## 2、Flannel vxlan模式

Flannel的功能是让集群中的不同节点主机创建的Docker容器都具有全集群唯一的虚拟IP地址。但是随着容器数量的增加，虚拟ip不够用。

VXLAN，即Virtual Extensible LAN（虚拟可扩展局域网），是Linux本身支持的一种网络虚拟化技术，主要是要解决ip不够分的问题。VXLAN可以完全在内核态实现封装和解封装工作，从而通过“隧道”机制，构建出覆盖网络（Overlay Network）。

VTEP：VXLAN Tunnel End Point（虚拟隧道端点），在Flannel中 VNI的默认值是1，所以宿主机的VTEP设备都叫flannel.1。

Cni0: 网桥设备，每创建一个pod都会创建一对 veth pair。其中一端是pod中的eth0，另一端是Cni0网桥中的端口（网卡）。

Flannel.1: TUN设备(虚拟网卡)，用来进行 vxlan 报文的处理（封包和解包）。不同node之间的pod数据流量都从overlay设备以隧道的形式发送到对端。

Flanneld：flannel在每个主机中运行flanneld作为agent，它会为所在主机从集群的网络地址空间中，获取一个小的网段subnet，本主机内所有容器的IP地址都将从中分配。同时Flanneld监听K8s集群数据库，为flannel.1设备提供封装数据时必要的mac、ip等网络数据信息。

vxlan的运行模式图如下

当容器发送IP包，通过veth pair 发往cni网桥，再路由到本机的flannel.1设备进行处理。

VTEP设备之间通过二层数据帧进行通信，源VTEP设备收到原始IP包后，在上面加上一个目的MAC地址，封装成一个内部数据帧，发送给目的VTEP设备。

内部数据桢，并不能在宿主机的二层网络传输，Linux内核还需要把它进一步封装成为宿主机的一个普通的数据帧，承载着内部数据帧通过宿主机的eth0进行传输。

Linux会在内部数据帧前面，加上一个VXLAN头，VXLAN头里有一个重要的标志叫VNI，它是VTEP识别某个数据桢是不是应该归自己处理的重要标识。

flannel.1设备只知道另一端flannel.1设备的MAC地址，却不知道对应的宿主机地址是什么。在linux内核里面，网络设备进行转发的依据，来自FDB的转发数据库，这个flannel.1网桥对应的FDB信息，是由flanneld进程维护的。

linux内核在IP包前面再加上二层数据帧头，把目标节点的MAC地址填进去，MAC地址从宿主机的ARP表获取。

此时flannel.1设备就可以把这个数据帧从eth0发出去，再经过宿主机网络来到目标节点的eth0设备。目标主机内核网络栈会发现这个数据帧有VXLAN Header，并且VNI为1，Linux内核会对它进行拆包，拿到内部数据帧，根据VNI的值，交给本机flannel.1设备处理,flannel.1拆包，根据路由表发往cni网桥，最后到达目标容器。

## 3、flannel模式类型

flannel支持多种后端：

**1、** Vxlan，报文封装，默认使用vxlan；

**2、** host-gw，主机网关，性能好，但只能在二层网络中，不支持跨网络，如果有成千上万的Pod，容易产生广播风暴；

**3、** UDP，性能差，不推荐；

默认是vxlan模式，查看下图，server3在自己节点访问就是通过cni0，当访问server2和server4时使用flannel.1。

由于我们这里都是在同一个网段中，不用跨网段，所以这里改为host-gw模式。

`kubectl -n kube-system edit cm kube-flannel-cfg`进入kube-flannel-cfg进行配置更改，修改类型为host-gw模式

删除flannel的相关pod，控制器会自动补上，达到更新配置的效果。

再次查看，使用的都是eth0

## 4、calico

由于flannel组件只可以实现网络的通信，无法写入策略，无法实现对服务、对pod的控制（黑名单白名单pod之间的隔离等等），所以我们把网络组件替换为calico，不仅支持网络的通信，还支持策略的写入

Felix：监听ECTD中心的存储获取事件，用户创建pod后，Felix负责将其网卡、IP、MAC都设置好，然后在内核的路由表里面写一条，注明这个IP应该到这张网卡。同样如果用户制定了隔离策略，Felix同样会将该策略创建到ACL中，以实现隔离。

BIRD：一个标准的路由程序，它会从内核里面获取哪一些IP的路由发生了变化，然后通过标准BGP的路由协议扩散到整个其他的宿主机上，让外界都知道这个IP在这里，路由的时候到这里来。

calico网络架构图如下

## 5、calico安装与部署

### （1）删除flannel组件

删除刚开始安装k8s时安装的flannel组件，使用kube-flannel.yml文件删除，查看确实没有flannel组件了。

在CNI插件存放的目录中，把原来的flannel组件的遗留东西移走或者删除，避免影响calico网络组件的使用

server3和sever4都要移除。

删除多余的服务，纯净环境

### （2）镜像与文件

创建calico的仓库项目

导入镜像

上传镜像到仓库，方便使用

已上传完毕

创建calico子目录，拉取calico.yaml资源清单文件

修改calico.yaml文件，把CALICO_IPV4POOL_IPIP功能关闭，并修改镜像的路径为自己的harbor仓库的路径

启动该pod

查看，多出了四个calico的组件

查看网关，把10.244.1网段直接和server3的ip（172.25.11.3）连接起来，把10.244.2网段直接和server3的ip（172.25.11.3）连接起来。

## 6、calico网络策略

正常情况下，我们不做任何限制，服务不限制，pod不限制，namespace 不限制，外网访问不限制。

查看pod信息

我需要首先创建一个服务，利用之前的lb-svc.yaml文件

```java
apiVersion: v1
kind: Service
metadata:
  name: lb-svc
spec:
  ports:
    - name: http
      port: 80
      targetPort: 80
  selector:
    app: myapp			%给标签是myapp的pod创建服务
  type: LoadBalancer
```

查看标签是myapp，应用该lb-svc.yaml文件，创建服务lb-svc。可以查看到该服务有外部访问ip172.25.11.10，且后端是标签为myapp的这这两个pod。

物理机充当集群外主机，访问172.25.11.10成功，且负载均衡。

### （1）、限制访问指定服务

编辑nginx-policy.yml文件

```java
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-nginx
spec:
  podSelector:
    matchLabels:
      app: myapp 	%限制访问标签为myapp的服务
```

启动该策略，查看已生效。

测试，无法访问。内部ip、外部ip都拒绝

### （2）、允许指定pod访问服务

直接限制整个服务无法访问，影响有过于大了。我们想允许特定的pod可以访问该服务，其他pod都不可以访问

先创建一个pod叫test，标签为app=test，无法访问，因为该服务上面被全面禁止了

编辑nginx-policy.yml文件，在上一个的基础上，再添加一条策略。

```java
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-nginx
spec:
  podSelector:
    matchLabels:
      app: myapp 	%限制访问标签为myapp的服务
---
kind: NetworkPolicy
apiVersion: networking.k8s.io/v1
metadata:
  name: access-nginx
spec:
  podSelector:
    matchLabels:
      app: myapp
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: test		%标签是test的pod允许访问服务
```

应用该策略，可以看到生效了两条策略。连接test这个pod，curl访问成功。

### （3）、禁止 一个namespace 中所有 Pod 之间的相互访问

首先删除前面的策略，以免影响，默认同一个ns中，pod是可以相互访问的，

但是现在我想设定为不可互相访问。编辑ns.yml文件

```java
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny
  namespace: default		%控制default这个namespace
spec:
  podSelector: {
     }
```

应用该策略，查看到一条策略已生效。现在进入test，curl访问失败

### （4）、禁止其他 namespace 访问服务

kubectl create namespace test创建一个新的ns叫test。

删除之前的策略，在test这个ns中创建一个叫test1的pod运行，可以看到不控制时，两个不同的ns之间的pod也是可以访问的。

编辑ns.yaml文件

```java
kind: NetworkPolicy
apiVersion: networking.k8s.io/v1
metadata:
  name: deny-namespace
spec:
  podSelector:
    matchLabels:				%匹配对象没写，就是都满足
  ingress:
  - from:
    - podSelector: {
     }			%其他namespace都无法访问
```

应用策略，进入test这个ns中的一个叫test1的pod，curl访问失败。

### （5）、只允许指定namespace访问服务

其他namespace都无法访问，范围太大，我们还想让某些特殊的namespace可以访问

修改ns.yaml文件

```java
kind: NetworkPolicy
apiVersion: networking.k8s.io/v1
metadata:
  name: deny-namespace
spec:
  podSelector:
    matchLabels:				
  ingress:
  - from:
    - podSelector: {
     }			
---
kind: NetworkPolicy
apiVersion: networking.k8s.io/v1
metadata:
  name: access-namespace
spec:
  podSelector:
    matchLabels:
      app: myapp			%匹配到标签是myapp的pod时，允许访问服务
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          role: prod		%匹配到角色是prod的ns时，允许访问服务
```

注意要给test这个ns添加prod角色

应用策略，进入test中的test1，curl访问成功

现在的策略是两条

### （6）、允许外网访问服务

默认情况下是不允许外网访问服务的，

在上面的基础上，再次添加策略，修改ns.yaml文件

```java
kind: NetworkPolicy
apiVersion: networking.k8s.io/v1
metadata:
  name: deny-namespace
spec:
  podSelector:
    matchLabels:				
  ingress:
  - from:
    - podSelector: {
     }			
---
kind: NetworkPolicy
apiVersion: networking.k8s.io/v1
metadata:
  name: access-namespace
spec:
  podSelector:
    matchLabels:
      app: myapp
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          role: prod		
---
kind: NetworkPolicy
apiVersion: networking.k8s.io/v1
metadata:
  name: web-allow-external
spec:
  podSelector:
    matchLabels:
      app: myapp			%允许标签是myapp的pod通过外网访问服务
  ingress:
  - ports:
    - port: 80			%端口是80
    from: []			%来源是谁都行
```

应用策略后，测试，允许外网访问服务
