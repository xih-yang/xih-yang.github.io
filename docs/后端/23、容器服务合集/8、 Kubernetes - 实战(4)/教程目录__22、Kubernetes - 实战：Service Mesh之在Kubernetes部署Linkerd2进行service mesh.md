# 22、Kubernetes - 实战：Service Mesh之在Kubernetes部署Linkerd2进行service mesh
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/4/22.html
- 分类：容器服务
- 分组：教程目录
## 一、前言

service mesh是为复杂微服务系统提供基础设施服务的方法，支持Kubernetes的service mesh实现包括文章[《十八：使用helm安装istio》](/zhuanlan/container/kubernetes/4/18.html)和[《二十三：Service Mesh之在Kubernetes部署Istio进行service mesh》](/zhuanlan/container/kubernetes/4/23.html)介绍的Istio以及本文要介绍的Linkerd2。

Linkerd可以在不进行任何入侵性改动的情况下，为部署在Kubernetes的微服务提供可调试性、可观测性、可靠性和安全性等能力。Linkerd主要包含UI、控制面和数据面三大组建。

根据众多测评的结果，普遍认为Linkerd2在数据面基于Rust编写的linkerd-proxy的性能要比Istio的Envoy好：

- [《Istio 和 Linkerd 的性能测试分析》](https://blog.fleeto.us/post/performance-benchmark-analysis-of-istio-and-linkerd/)

> 结论：
>
> 与裸金属相比，在常规条件下，Linkerd 和 Istio 的开销都算是可以接受的。当进入高负载状态时，相对于 Istio，Linkerd 能够提供更高的 RPS，并且使用更少的资源。

- [《Istio和Linkerd的CPU基准测试》](https://www.servicemesher.com/blog/benchmarking-istio-and-linkerd-cpu/)

> 结论：
>
> 对于这种综合的工作负载，Istio的Envoy代理使用的CPU比Linkerd多了50%以上。Linkerd的控制平面使用了Istio的一小部分，尤其是在考虑“核心”组件时。

- [《Linkerd 2.0 and Istio Performance Benchmark》](https://medium.com/@ihcsim/linkerd-2-0-and-istio-performance-benchmark-df290101c2bb)

> 结论：
>
> In this experiment, both the Linkerd2-meshed setup and Istio-meshed setup experienced higher latency and lower throughput, when compared with the baseline setup. The latency incurred in the Istio-meshed setup was higher than that observed in the Linkerd2-meshed setup. The Linkerd2-meshed setup was able to handle higher HTTP and GRPC ping throughput than the Istio-meshed setup.

## 二、Linkerd2架构

### 2.1 架构

Linkerd架构由控制面和数据面组成：

**1、** 控制面主要的工作包括遥测数据汇总、提供API、配置数据面proxy等，模块包括Controller(提供API服务)、Destination(proxy配置和路由)、Identity(安全控制/mTLS)、ProxyInjector(是一个Kubernetes准入控制器，在业务POD内部注入Linkerd数据面相关的sidecar)、ServiceProfileValidator(服务配置验证准入控制器)、Tap(具体服务的proxy的数据流观测)、Web(dashboard)、监控套件(Prometheus和Grafana)；

**2、** 数据面主要的工作是使用sidecard进行业务容器数据流的代理，由linkerd-init和proxy两个模块组成；linkerd-init进行iptables的配置，所配置的规则包括任何目的地为PODIP的数据都会先被转发到proxy的4143端口，任何从POD外出的数据包都会先被转发到4140端口；proxy是用Rust编写的轻量级透明代理，作为业务POD的sidecar对进出POD的流量进行拦截，可以无入侵的对HTTP、HTTP/2、WebSocket和任何TCP协议进行透明代理，自动的延迟感知的七层负载均衡，自动的四层非HTTP流量负载均衡，按需进行数据流TAP分析；

### 2.2 工作原理

Linkerd通过在业务POD中安装轻量级的透明代理sidecar进行业务POD的服务接入，这些sidecar代理随后会自动对进出POD的流量进行处理。这些轻量级的进程会向控制面发送测量的metrics并且从控制面接受控制信息。

在部署服务的时候，可以通过在部署的Kubernetes的spec文件里面加入如下annonation来声明接入到Linkerd的Service Mesh中：

> linkerd.io/inject: enabled

对于所有的标注了这个label的部署，linkerd-inject准入控制器会在部署的时候将数据面的proxy作为sidecar注入到业务POD里面:

## 三、部署Linkerd

参考：

> https://linkerd.io/2/getting-started/

### 3.1 安装CLI

```java
curl -sL https://run.linkerd.io/install | sh
export PATH=$PATH:$HOME/.linkerd2/bin
linkerd version
Client version: stable-2.7.1
Server version: unavailable
```

### 3.2 验证Kubernetes集群状态

```java
linkerd check --pre
kubernetes-api
--------------
√ can initialize the client
√ can query the Kubernetes API
kubernetes-version
------------------
× is running the minimum Kubernetes API version
    Kubernetes is on version [1.11.5], but version [1.13.0] or more recent is required
    see https://linkerd.io/checks/#k8s-version for hints
× is running the minimum kubectl version
    kubectl is on version [1.11.3], but version [1.13.0] or more recent is required
    see https://linkerd.io/checks/#kubectl-version for hints
pre-kubernetes-setup
--------------------
× control plane namespace does not already exist
    The "linkerd" namespace already exists
    see https://linkerd.io/checks/#pre-ns for hints
× can create non-namespaced resources
√ can create ServiceAccounts
√ can create Services
√ can create Deployments
√ can create CronJobs
√ can create ConfigMaps
√ can create Secrets
√ can read Secrets
√ no clock skew detected
pre-kubernetes-capability
-------------------------
√ has NET_ADMIN capability
√ has NET_RAW capability
linkerd-version
---------------
√ can determine the latest version
√ cli is up-to-date
Status check results are ×
```

### 3.3. 安装Linkerd

```java
linkerd install | kubectl apply -f -
```

### 3.4 安装后的check

服务的安装情况 deployment：

service:

## 四、部署服务

### 4.1 修改yaml进行Linkerd注入和部署

这里部署这个服务系统[emojivoto](https://github.com/BuoyantIO/emojivoto)来进行演示，这个系统的构成如下：

web服务提供REST API，emoji服务通过gRPC提供emoji的查找和list操作，voting服务通过gRPC提供投票和结果排名服务，vote-bot会自动进行投票模拟。在服务中，投票选举🍩会失败，vote-bot选择🍩的概率是15%，所以结果里面回头15%左右的请求失败。

部署之前需要进行Linkerd的注入操作：

```java
cat emojivoto.yml  | linkerd inject - > emojivoto-inject.yml
```

注入之后的yml如下，会加入linkerd.io/inject: enabled的注释：

```java
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app.kubernetes.io/name: emoji
    app.kubernetes.io/part-of: emojivoto
    app.kubernetes.io/version: v10
  name: emoji
  namespace: emojivoto
spec:
  replicas: 1
  selector:
    matchLabels:
      app: emoji-svc
  template:
    metadata:
      annotations:
        linkerd.io/inject: enabled
      labels:
        app: emoji-svc
    spec:
      containers:
      - env:
        - name: GRPC_PORT
          value: "8080"
        - name: PROM_PORT
          value: "8801"
        image: buoyantio/emojivoto-emoji-svc:v10
        name: emoji-svc
        ports:
        - containerPort: 8080
          name: grpc
        - containerPort: 8801
          name: prom
        resources:
          requests:
            cpu: 100m
      serviceAccountName: emoji
```

### 4.2 部署结果

部署的POD如下：

选择里面web POD进行查看可以看到被注入了一个linkerd-init 容器：

和一个linkerd-proxy 容器：

而且从容器日志可以看到linkerd-init 容器进行的iptables操作如下：

```java
2020/05/18 09:48:21 Tracing this script execution as [1589795301]
2020/05/18 09:48:21 State of iptables rules before run:
2020/05/18 09:48:21 > iptables -t nat -vnL
2020/05/18 09:48:21 < Chain PREROUTING (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination         
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination         
Chain OUTPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination         
Chain POSTROUTING (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination         
2020/05/18 09:48:21 > iptables -t nat -F PROXY_INIT_REDIRECT
2020/05/18 09:48:21 < iptables: No chain/target/match by that name.
2020/05/18 09:48:21 > iptables -t nat -X PROXY_INIT_REDIRECT
2020/05/18 09:48:21 < iptables: No chain/target/match by that name.
2020/05/18 09:48:21 Will ignore port(s) [4190 4191] on chain PROXY_INIT_REDIRECT
2020/05/18 09:48:21 Will redirect all INPUT ports to proxy
2020/05/18 09:48:21 > iptables -t nat -F PROXY_INIT_OUTPUT
2020/05/18 09:48:21 < iptables: No chain/target/match by that name.
2020/05/18 09:48:21 > iptables -t nat -X PROXY_INIT_OUTPUT
2020/05/18 09:48:21 < iptables: No chain/target/match by that name.
2020/05/18 09:48:21 Ignoring uid 2102
2020/05/18 09:48:21 Redirecting all OUTPUT to 4140
2020/05/18 09:48:21 Executing commands:
2020/05/18 09:48:21 > iptables -t nat -N PROXY_INIT_REDIRECT -m comment --comment proxy-init/redirect-common-chain/1589795301
2020/05/18 09:48:21 < 
2020/05/18 09:48:21 > iptables -t nat -A PROXY_INIT_REDIRECT -p tcp --match multiport --dports 4190,4191 -j RETURN -m comment --comment proxy-init/ignore-port-4190,4191/1589795301
2020/05/18 09:48:21 < 
2020/05/18 09:48:21 > iptables -t nat -A PROXY_INIT_REDIRECT -p tcp -j REDIRECT --to-port 4143 -m comment --comment proxy-init/redirect-all-incoming-to-proxy-port/1589795301
2020/05/18 09:48:21 < 
2020/05/18 09:48:21 > iptables -t nat -A PREROUTING -j PROXY_INIT_REDIRECT -m comment --comment proxy-init/install-proxy-init-prerouting/1589795301
2020/05/18 09:48:21 < 
2020/05/18 09:48:21 > iptables -t nat -N PROXY_INIT_OUTPUT -m comment --comment proxy-init/redirect-common-chain/1589795301
2020/05/18 09:48:21 < 
2020/05/18 09:48:21 > iptables -t nat -A PROXY_INIT_OUTPUT -m owner --uid-owner 2102 -o lo ! -d 127.0.0.1/32 -j PROXY_INIT_REDIRECT -m comment --comment proxy-init/redirect-non-loopback-local-traffic/1589795301
2020/05/18 09:48:21 < 
2020/05/18 09:48:21 > iptables -t nat -A PROXY_INIT_OUTPUT -m owner --uid-owner 2102 -j RETURN -m comment --comment proxy-init/ignore-proxy-user-id/1589795301
2020/05/18 09:48:21 < 
2020/05/18 09:48:21 > iptables -t nat -A PROXY_INIT_OUTPUT -o lo -j RETURN -m comment --comment proxy-init/ignore-loopback/1589795301
2020/05/18 09:48:21 < 
2020/05/18 09:48:21 > iptables -t nat -A PROXY_INIT_OUTPUT -p tcp -j REDIRECT --to-port 4140 -m comment --comment proxy-init/redirect-all-outgoing-to-proxy-port/1589795301
2020/05/18 09:48:21 < 
2020/05/18 09:48:21 > iptables -t nat -A OUTPUT -j PROXY_INIT_OUTPUT -m comment --comment proxy-init/install-proxy-init-output/1589795301
2020/05/18 09:48:21 < 
2020/05/18 09:48:21 > iptables -t nat -vnL
2020/05/18 09:48:21 < Chain PREROUTING (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination         
    0     0 PROXY_INIT_REDIRECT  all  --  *      *       0.0.0.0/0            0.0.0.0/0            /* proxy-init/install-proxy-init-prerouting/1589795301 */
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination         
Chain OUTPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination         
    0     0 PROXY_INIT_OUTPUT  all  --  *      *       0.0.0.0/0            0.0.0.0/0            /* proxy-init/install-proxy-init-output/1589795301 */
Chain POSTROUTING (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination         
Chain PROXY_INIT_OUTPUT (1 references)
 pkts bytes target     prot opt in     out     source               destination         
    0     0 PROXY_INIT_REDIRECT  all  --  *      lo      0.0.0.0/0           !127.0.0.1            owner UID match 2102 /* proxy-init/redirect-non-loopback-local-traffic/1589795301 */
    0     0 RETURN     all  --  *      *       0.0.0.0/0            0.0.0.0/0            owner UID match 2102 /* proxy-init/ignore-proxy-user-id/1589795301 */
    0     0 RETURN     all  --  *      lo      0.0.0.0/0            0.0.0.0/0            /* proxy-init/ignore-loopback/1589795301 */
    0     0 REDIRECT   tcp  --  *      *       0.0.0.0/0            0.0.0.0/0            /* proxy-init/redirect-all-outgoing-to-proxy-port/1589795301 */ redir ports 4140
Chain PROXY_INIT_REDIRECT (2 references)
 pkts bytes target     prot opt in     out     source               destination         
    0     0 RETURN     tcp  --  *      *       0.0.0.0/0            0.0.0.0/0            multiport dports 4190,4191 /* proxy-init/ignore-port-4190,4191/1589795301 */
    0     0 REDIRECT   tcp  --  *      *       0.0.0.0/0            0.0.0.0/0            /* proxy-init/redirect-all-incoming-to-proxy-port/1589795301 */ redir ports 4143
```

## 五、通过Linkerd Dashboard观察Service Mesh

通过如下命令可以启动linkerd dashboard：

```java
linkerd dashboard &
```

##

可以看到这个namespace的服务进行service mesh之后的状态：

也可以查看单个服务的信息：

Linkerd自带的监控系统还可以展示grafana监控信息：
