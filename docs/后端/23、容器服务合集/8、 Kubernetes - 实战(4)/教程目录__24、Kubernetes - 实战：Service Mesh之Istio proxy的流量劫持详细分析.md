# 24、Kubernetes - 实战：Service Mesh之Istio proxy的流量劫持详细分析
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/4/24.html
- 分类：容器服务
- 分组：教程目录
## 一、前言

文章[《二十三：Service Mesh之在Kubernetes部署Istio进行service mesh》](/zhuanlan/container/kubernetes/4/23.html)介绍了Istio的部署和使用案例，本文对于v1.6版本的Istio proxy sidecar的工作原理进行分析，包括：

- sidecar注入方法
- 流量劫持方法
- 数据流转方法

## 二、sidecar注入方法

### 2.1 注入方式

根据Istio官方文档[《](https://istio.io/docs/setup/additional-setup/sidecar-injection/)[Installing the Sidecar](https://istio.io/docs/setup/additional-setup/sidecar-injection/)[》](https://istio.io/docs/setup/additional-setup/sidecar-injection/)，sidecard有手动注入和自动注入两种方式，这两种注入方式可以使用默认的注入配置文件：

```java
kubectl -n istio-system get configmap istio-sidecar-injector -o=jsonpath='{.data.config}' > inject-config.yaml
kubectl -n istio-system get configmap istio-sidecar-injector -o=jsonpath='{.data.values}' > inject-values.yaml
kubectl -n istio-system get configmap istio -o=jsonpath='{.data.mesh}' > mesh-config.yaml
```

- inject-config.yaml里面是注入sidecard使用的模版
- inject-values.yaml里面是注入sidecard使用的一些配置value
- mesh-config.yaml里面是servicemesh的配置文件：

```java
accessLogEncoding: TEXT
accessLogFile: /dev/stdout
accessLogFormat: ""
defaultConfig:
  concurrency: 2
  configPath: ./etc/istio/proxy
  connectTimeout: 10s
  controlPlaneAuthPolicy: NONE
  discoveryAddress: istiod.istio-system.svc:15012
  drainDuration: 45s
  parentShutdownDuration: 1m0s
  proxyAdminPort: 15000
  proxyMetadata:
    DNS_AGENT: ""
  serviceCluster: istio-proxy
  tracing:
    zipkin:
      address: zipkin.istio-system:9411
disableMixerHttpReports: true
disablePolicyChecks: false
enablePrometheusMerge: false
ingressClass: istio
ingressControllerMode: STRICT
ingressService: istio-ingressgateway
protocolDetectionTimeout: 100ms
reportBatchMaxEntries: 100
reportBatchMaxTime: 1s
sdsUdsPath: unix:/etc/istio/proxy/SDS
trustDomain: cluster.local
trustDomainAliases: null
```

**a) 使用istioctl进行手动注入**

```java
istioctl kube-inject -f sample.yaml | kubectl apply -f -
```

也可以在注入的时候overwrite默认的Istio配置文件，使用自定义的配置：

```java
istioctl kube-inject \
    --injectConfigFile inject-config.yaml \
    --meshConfigFile mesh-config.yaml \
    --valuesFile inject-values.yaml \
    --filename sample.yaml \
    | kubectl apply -f -
```

**b) 使用webhook admission controller进行自动注入**

需要先将一个namespace标记成可以注入的：

```java
kubectl label namespace istio-test istio-injection=enabled
```

之后在这个namespace部署的POD会由Kubernetes自动按照注入的配置文件进行sidecar注入

### 2.2 注入效果

在执行sidecar注入之后，新启动的POD会启动sidecar，包含两个container，一个是初始化容器，一个是proxy容器。

a)初始化容器istio-init

该容器主要是进行POD network namespace sidecar iptables的写入，这些iptables规则主要是进行出站和入站数据的劫持转发：

b)数据流代理容器istio-proxy

该容器进行数据面数据流的转发和控制，实现servicemesh的所有数据流管控工作，包括目的地查找、负载均衡、熔断、服务发现、服务健康管理、metrics和trace等工作。该数据proxy借助envoy进行数据面得到操作，envoy使用C++进行编码，同时使用xDS协议进行系统化和规范化的控制面和数据面、数据面和数据面的信息交互。

## 三、数据流量劫持方法

数据流量的劫持主要发生在istio-init容器里面建立的iptables规则中，由于这些iptables是建立在业务POD的namespace的，所以在主机上是看不到这些规则的。

### 3.1 iptables规则插入

init容器通过istio-iptables命令和指定的参数来插入iptables：

```java
istio-iptables -p 15001 -z 15006 -u 1337 -m REDIRECT -i * -x -b * -d 15090,15021,15020
```

对应的代码在这里：

[https://github.com/istio/istio/blob/master/tools/istio-iptables/pkg/cmd/run.go](https://github.com/istio/istio/blob/master/tools/istio-iptables/pkg/cmd/run.go)

该命令参考如下一些变量：

```java
PROXY_PORT=15001
PROXY_INBOUND_CAPTURE_PORT=15006
PROXY_UID=1337
PROXY_GID=1337
INBOUND_INTERCEPTION_MODE=REDIRECT
INBOUND_TPROXY_MARK=1337
INBOUND_TPROXY_ROUTE_TABLE=133
INBOUND_PORTS_INCLUDE=*
INBOUND_PORTS_EXCLUDE=15090,15021,15020
OUTBOUND_IP_RANGES_INCLUDE=*
OUTBOUND_IP_RANGES_EXCLUDE=
OUTBOUND_PORTS_EXCLUDE=
KUBEVIRT_INTERFACES=
ENABLE_INBOUND_IPV6=false
```

PROXY_UID/GID是enovy proxy以该ID运行，15006和15001分别是入站和出站端口，15090/15021/25020是istio的管理端口，所以会从入站监控端口里面去除，另外入站流量使用REDIRECT的模式进行劫持，另外一种劫持方式是TPROXY。

插入的规则如下：

```java
* nat
-N ISTIO_REDIRECT
-N ISTIO_IN_REDIRECT
-N ISTIO_INBOUND
-N ISTIO_OUTPUT
-A ISTIO_REDIRECT -p tcp -j REDIRECT --to-ports 15001
-A ISTIO_IN_REDIRECT -p tcp -j REDIRECT --to-ports 15006
-A PREROUTING -p tcp -j ISTIO_INBOUND
-A ISTIO_INBOUND -p tcp --dport 22 -j RETURN
-A ISTIO_INBOUND -p tcp --dport 15090 -j RETURN
-A ISTIO_INBOUND -p tcp --dport 15021 -j RETURN
-A ISTIO_INBOUND -p tcp --dport 15020 -j RETURN
-A ISTIO_INBOUND -p tcp -j ISTIO_IN_REDIRECT
-A OUTPUT -p tcp -j ISTIO_OUTPUT
-A ISTIO_OUTPUT -o lo -s 127.0.0.6/32 -j RETURN
-A ISTIO_OUTPUT -o lo ! -d 127.0.0.1/32 -m owner --uid-owner 1337 -j ISTIO_IN_REDIRECT
-A ISTIO_OUTPUT -o lo -m owner ! --uid-owner 1337 -j RETURN
-A ISTIO_OUTPUT -m owner --uid-owner 1337 -j RETURN
-A ISTIO_OUTPUT -o lo ! -d 127.0.0.1/32 -m owner --gid-owner 1337 -j ISTIO_IN_REDIRECT
-A ISTIO_OUTPUT -o lo -m owner ! --gid-owner 1337 -j RETURN
-A ISTIO_OUTPUT -m owner --gid-owner 1337 -j RETURN
-A ISTIO_OUTPUT -d 127.0.0.1/32 -j RETURN
-A ISTIO_OUTPUT -j ISTIO_REDIRECT
COMMIT
```

同时注入之后的POD网卡设备信息如下：

```java
root@web-54f74db995-c26xv:/# ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
2: tunl0@NONE: <NOARP> mtu 1480 qdisc noop state DOWN group default qlen 1000
    link/ipip 0.0.0.0 brd 0.0.0.0
4: eth0@if106: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1440 qdisc noqueue state UP group default 
    link/ether 86:4c:63:b6:14:cc brd ff:ff:ff:ff:ff:ff link-netnsid 0
    inet 10.244.241.91/32 scope global eth0
       valid_lft forever preferred_lft forever
```

### 3.2 iptables规则解读

在进行iptables规则解读之前，有几个基本的规则需要先进行了解，以便于理解后续的iptables规则：

- 所有数据经由enovy处理之后，数据包所属的UID/GID即是envoy运行所使用的ID：1337
- 15001和15006分别是envoy proxy监听的数据包出站和入站端口
- enovy proxy数据处理完毕之后的出口设备是lo或者eth0，取决于是入站还是出站流量，默认情况下入站数据经过proxy处理之后源IP地址是127.0.0.1([这个文章介绍了透明代理的情况](https://blog.gmem.cc/istio-tproxy))
- 127.0.0.6是envoy PassThroughCluster使用的IP(PassThroughCluster is the default cluster traffic is directed to if no listeners -> routes -> clusters are found during the lookup.)，这个目标是没有任何match情况下的默认处理。
- iptables的规则主要分成出站和入站两类规则，其中入站规则比较简单，主要考虑需要ignore的istio管理端口，出站规则则比较复杂，需要根据数据包的来源/去向/处理阶段(envoy proxy处理之前还是之后)进行分别处理
- 业务容器收到的来自envoy proxy的数据包目的地址应该是业务POD的IP(因为客户端侧envoy调用的时候，已经确定是要调用哪个IP的endpoint POD)，经由lo进入，业务容器发出的数据包目的地址是对方服务的clusterIP地址
- 进入和流出istio proxy sidecar和业务容器的流量都需要分别经过ISTIO_INBOUND和ISTIO_OUTPUT的处理

init容器插入的iptables规则编号如下：

```java
01: * nat
02: -N ISTIO_REDIRECT
03: -N ISTIO_IN_REDIRECT
04: -N ISTIO_INBOUND
05: -N ISTIO_OUTPUT
06: -A ISTIO_REDIRECT -p tcp -j REDIRECT --to-ports 15001
07: -A ISTIO_IN_REDIRECT -p tcp -j REDIRECT --to-ports 15006
08: -A PREROUTING -p tcp -j ISTIO_INBOUND
09: -A ISTIO_INBOUND -p tcp --dport 22 -j RETURN
10: -A ISTIO_INBOUND -p tcp --dport 15090 -j RETURN
11: -A ISTIO_INBOUND -p tcp --dport 15021 -j RETURN
12: -A ISTIO_INBOUND -p tcp --dport 15020 -j RETURN
13: -A ISTIO_INBOUND -p tcp -j ISTIO_IN_REDIRECT
14: -A OUTPUT -p tcp -j ISTIO_OUTPUT
15: -A ISTIO_OUTPUT -o lo -s 127.0.0.6/32 -j RETURN
16: -A ISTIO_OUTPUT -o lo ! -d 127.0.0.1/32 -m owner --uid-owner 1337 -j ISTIO_IN_REDIRECT
17: -A ISTIO_OUTPUT -o lo -m owner ! --uid-owner 1337 -j RETURN
18: -A ISTIO_OUTPUT -m owner --uid-owner 1337 -j RETURN
19: -A ISTIO_OUTPUT -o lo ! -d 127.0.0.1/32 -m owner --gid-owner 1337 -j ISTIO_IN_REDIRECT
20: -A ISTIO_OUTPUT -o lo -m owner ! --gid-owner 1337 -j RETURN
21: -A ISTIO_OUTPUT -m owner --gid-owner 1337 -j RETURN
22: -A ISTIO_OUTPUT -d 127.0.0.1/32 -j RETURN
23: -A ISTIO_OUTPUT -j ISTIO_REDIRECT
24: COMMIT
```

iptables规则解释：

- 1，表明这些规则都插入到NAT表中
- 2~5，是新建新的chain，istio的所有iptables操作都在自己的chain里面进行，不修改系统的默认chain。其中ISTIO_REDIRECT chain用于转发到proxy入站端口，ISTIO_IN_REDIRECT chain用于转发到proxy的出站端口，ISTIO_INBOUND和ISTIO_OUTPUT用于入站和出站数据类型判断和下一步规则确定
- 6～7，分别指定数据最后的跳转目标是envoy proxy监听的出站和入站端口，进入envoy proxy进行servicemesh
- 8，将入站数据导入入站处理的chain ISTIO_INBOUND
- 9~12，Istio管理端口数据不进行任何servicemesh处理，直接由envoy的proxy进行响应
- 13，其余数据包进入ISTIO_IN_REDIRECT chain，最后由规则7主导，进入enovy监听的15006入站端口进行servicemesh处理
- 14，出站数据包进入ISTIO_OUTPUT chain进行处理
- 15，对于inbound PassThroughCluster来源的数据，不做额外处理，直接返回
- 16/19，对于由envoy proxy经由lo发出的目的地非127.0.0.1的数据包，进入envoy proxy的入站处理端口；这条规则主要应对的容器调用本身所在的svc，并且经过envoy proxy代理mesh之后调度到自己的情况(即appN `` Envoy (client) `` Envoy (server) `` appN)，这种情况下目的IP是当前POD自己的IP，但是数据是由envoy经过mesh之后发出的(uid owner 1337)，这种情况也属于数据包入站的case，所以直接进入envoy的入站端口，进行后续转发处理逻辑
- 17/20，如果是来自lo的业务容器通过自己的POD IP调用自己的数据包(appN => appN by lo)，不走envoy proxy处理流程，直接返回
- 18/21，如果是来自envoy proxy的其它数据包，不做任何处理，直接返回
- 22，如果是通过localhost/127.0.0.1进行调用的数据包，不做任何处理，直接返回
- 23，其它数据包转入envoy proxy的出站端口，进行servicemesh处理(包括选定endpoint和proxy出去)

综上所述，入站的数据包的处理比较简单，除了exlcude一些端口，其余的都进入proxy入站处理逻辑，而出站的情况比较复杂，对于如下一些case进行了特殊处理：

- app通过clusterIP调用自己所在的svc最后被自己POD所在的envoy调度会自己的情况，需要将出站数据包转送到入站iptables处理chain，进而走标准的入站数据包处理流程，需要由envoy进行处理
- app容器通过自己的POD IP调用自己所在的POD内的服务的情况，不需要envoy进行处理
- envoy发出的其它数据包，不需要envoy进行处理
- app容器通过localhost调用自己所在的POD内的服务的情况，不需要envoy进行处理
- 剩余的属于标准的出站数据包，需要由envoy进行处理

这里主要的区分点包括：

- 是否是localhost的流量
- 是否是envoy proxy用户空间的流量(uid/gid)

其它参考信息：

- [文章《服务监听pod ip 在istio中路由异常分析》](https://zhonghua.io/2019/07/11/istio-xds-podip/)通过case分析对于istio proxy的iptables规则也有比较深入的介绍
- 文章[《Istio 中的 Sidecar 注入及透明流量劫持过程详解》](https://jimmysong.io/blog/sidecar-injection-iptables-and-traffic-routing/)和文章[《理解 Istio Service Mesh 中 Envoy 代理 Sidecar 注入及流量劫持》](https://jimmysong.io/blog/envoy-sidecar-injection-in-istio-service-mesh-deep-dive/)对于整个istio proxy的工作原理有深入的介绍
- 也可以参考如下代码中原汁原味的注释进行理解：[https://github.com/istio/istio/blob/master/tools/istio-iptables/pkg/cmd/run.go](https://github.com/istio/istio/blob/master/tools/istio-iptables/pkg/cmd/run.go)

## 四、数据流转方法

### 4.1 istio mesh的调用流程

**基本流程：**进入和流出istio proxy sidecar和业务容器的流量都需要分别经过ISTIO_INBOUND和ISTIO_OUTPUT的处理，sidecar和业务容器发出或者接收的流量都会独立走一次iptables链表

**servicemesh流程：**app1 => envoy proxy1 => envoy proxy2 => app2，app1调用app2所在的服务会通过Kubernetets的cluster service IP进行，进入envoy proxy1之后会选定app2所在的服务的后端列表里面的某一个endpoint比如app2容器，获取其IP，将请求的目的地设置为该IP，发送过去，envoy proxy2在接收到数据包之后，会直接转发给后端app2容器。

**proxy和mesh操作：**而对于envoy proxy而言，入站数据包是指外部业务容器调用本地业务容器的流量以及本地调用外部之后的返回流量，这里都只要让proxy进行转发操作而不需要mesh操作；出站数据包是指本地业务容器调用外部业务容器的流量以及本地给外部返回的响应流量，这里前者需要本地proxy进行mesh操作而后者只需要proxy操作不需要mesh操作；入站和入站的数据包经过evnoy mesh操作之后都带有明确的源POD和目的POD地址。

### 4.2 劫持的数据的流转动作

对于入站的数据，被劫持之后的目的动作有两个：

- RETURN，不进行任何istio proxy的处理
- ISTIO_IN_REDIRECT，进行istio proxy的入站处理

对于出站的数据，被劫持之后的目的动作有三个：

- RETURN，不进行任何istio proxy的处理
- ISTIO_IN_REDIRECT，进行istio proxy的入站处理
- ISTIO_REDIRECT，进行istio proxy的出站处理

这里比较费解的是出站数据竟然有可能要进行入站处理，主要是考虑服务A的某个POD1调用自己所在的服务A的Kubernetes service IP，最后被istio proxy进行mesh之后调度到自己(POD1)的情况，这种情况下出站操作之后紧接着就应该是入站操作。

### 4.3 istio mesh的请求响应流程分析

servicemesh的调用和响应流程

app1(svc1)会使用app2所在的svc2来进行调用：

- a) app1容器发出请求数据包P1(src: POD1_IP, dst: svc2, out device: eth0)
- b) P1会先经过iptables的ISTIO_OUTPUT链表，根据P1的TCP包头信息以及数据包owner是app1，所以不能匹配规则15～22，而匹配规则23进入ISTIO_REDIRECT链表
- c) P1经过ISTIO_REDIRECT链表规则6的引导进入proxy的15001出站监听端口
- d) proxy根据svc2的域名进行mesh而选中svc2的一个endpoint app2，确定其地址POD2_IP，数据包P1被修改成P2(src: POD1_IP, dst: POD2_IP, out device: eth0)，该数据包进入ISTIO_OUTPUT链表
- e) 由于数据包P2输出设备是eth0，owner是proxy，所以不满足链表规则15～17，但是满足规则18，所以直接return，并且随后eth0被发送出去到app2所在的POD2
- f) 在POD2数据包P2被接收之后被修改成数据包P3(src: POD1_IP, dst: POD2_IP, in device: eth0)，并进入ISTIO_INBOUND链表
- g) ISTIO_INBOUND链表内部的规则9～12都无法匹配，所以直接进入ISTIO_IN_REDIRECT链表
- h) ISTIO_IN_REDIRECT链表规则7将数据包P3引导进入proxy的15006入站监听端口
- i) proxy处理完毕之后数据包P3被修改成数据包P4(src: POD1_IP, dst: 127.0.0.1, out device: lo)并且由proxy发送出去并进入ISTIO_OUTPUT链表
- j) 由于数据包P4的owner是proxy并且输出设备是lo，所以不满足ISTIO_OUTPUT链表的规则15～21，而匹配规则22，直接return并且将数据包P4发送给业务容器app2

app2(svc2)处理之后响应app1的流程如下：

- k) app2将响应数据包P5(src: POD2_IP, dst: POD1_IP, out device: eth0)发送出来进入ISTIO_OUTPUT链表
- l) 数据包P5的owner是app2并且出口设备是eth0，所以无法匹配ISTIO_OUTPUT链表规则15～22，可以匹配规则23，进入ISTIO_REDIRECT链表
- m) ISTIO_REDIRECT链表的规则6将数据包P5引导进入proxy的15001出站监听端口
- n) 针对响应数据包，proxy不做mesh处理，直接将数据包P5(src: POD2_IP, dst: POD1_IP, out device: eth0)发出来至ISTIO_OUTPUT链表，并将数据包owner变成proxy的uid
- o) 数据包P5会匹配ISTIO_OUTPUT链表的规则18，直接return，后续发送给app1所在的POD1
- p) POD1接收之后会进入ISTIO_INBOUND链表，此时数据包P5被修改成数据包P6(src: POD2_IP, dst: POD1_IP, in device: eth0)，这个数据包P6会匹配规则13，进入ISTIO_IN_REDIRECT链表
- q) ISTIO_IN_REDIRECT链表规则7会将数据包P6引导进入proxy的15006入站监听端口
- r) 针对响应数据包，proxy不做mesh处理，会将数据包P6修改成P7(src: POD2_IP, dst: 12.0.0.1, out device: lo)并直接将数据包P7发出来至ISTIO_OUTPUT链表，并将数据包owner变成proxy的uid
- s) 根据P7数据包的特点，会匹配ISTIO_OUTPUT链表的规则22，直接return并且将数据包P7发送给业务容器app1，完成一次请求响应

注释：

特别的，如果svc1 = svc2，并且在步骤d)中POD1 = POD2，则数据包的出口设备会变成lo，目的地址为POD1的IP地址，则会匹配ISTIO_OUTPUT链表中的规则16/19，然后进入ISTIO_IN_REDIRECT链表
