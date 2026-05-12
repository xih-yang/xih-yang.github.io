# 25、Kubernetes - 实战：ServiceMesh之Linkerd proxy的流量劫持详细分析
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/4/25.html
- 分类：容器服务
- 分组：教程目录
## 一、前言

文章[《二十二：Service Mesh之在Kubernetes部署Linkerd2进行service mesh》](/zhuanlan/container/kubernetes/4/22.html)介绍了Linkerd的部署和应用的部署以及mesh，本文对Linkerd2 v2.7.1的Linkerd proxy的工作原理进行分析，包括：

- sidecar注入方法
- 流量劫持方法
- 数据流转方法

## 二、sidecar注入方法

### 2.1 注入方式

Linkerd sidecar的配置在名为linkerd-config的configmap中:

可以通过编辑deployment的annonation来修改这些默认的配置，具体可以参看：[https://linkerd.io/2/reference/proxy-configuration/](https://linkerd.io/2/reference/proxy-configuration/)

**a) 使用linkerd inject进行手动注入**

```java
cat deployment.yml | linkerd inject - | kubectl apply -f -
```

**b) 使用webhook admission controller进行自动注入**

需要先将一个namespace标记成可以注入的：

```java
kubectl label namespace linkerd-test linkerd.io/inject=enabled
```

之后在这个namespace部署的POD会由Kubernetes自动按照注入的配置文件进行sidecar注入

### 2.2 注入效果

在执行sidecar注入之后，新启动的POD会启动sidecar，包含两个container，一个是初始化init容器，一个是proxy容器。最新的如果使用Linkerd CNI Plugin的话，就不会有init容器了。

a)初始化容器linkerd-init

该容器主要是进行POD network namespace sidecar iptables的写入，这些iptables规则主要是进行出站和入站数据的劫持转发。

b)数据流代理容器linkerd-proxy

该容器进行数据面数据流的转发和控制，实现servicemesh的所有数据流管控工作，包括目的地查找、负载均衡、熔断、服务发现、服务健康管理、metrics和trace等工作。该数据proxy Rust进行编码。

## 三、数据流量劫持方法

### 3.1 iptables规则插入

init容器通过proxy-init命令和指定的参数来插入iptables：

```java
/usr/local/bin/proxy-init --incoming-proxy-port 4143 --outgoing-proxy-port 4140 --proxy-uid 2102 --inbound-ports-to-ignore 4190,4191
```

通过命令：

```java
docker top docker ps|grep "k8s_linkerd-proxy_web"|cut -d " " -f1
nsenter -n --target 1429784
```

可以查看插入的iptables规则如下：

```java
01: *nat
02: -A PREROUTING -m comment --comment "proxy-init/install-proxy-init-prerouting/1590476641" -j PROXY_INIT_REDIRECT
03: -A OUTPUT -m comment --comment "proxy-init/install-proxy-init-output/1590476641" -j PROXY_INIT_OUTPUT
04: -A PROXY_INIT_OUTPUT ! -d 127.0.0.1/32 -o lo -m owner --uid-owner 2102 -m comment --comment "proxy-init/redirect-non-loopback-local-traffic/1590476641" -j PROXY_INIT_REDIRECT
05: -A PROXY_INIT_OUTPUT -m owner --uid-owner 2102 -m comment --comment "proxy-init/ignore-proxy-user-id/1590476641" -j RETURN
06: -A PROXY_INIT_OUTPUT -o lo -m comment --comment "proxy-init/ignore-loopback/1590476641" -j RETURN
07: -A PROXY_INIT_OUTPUT -p tcp -m comment --comment "proxy-init/redirect-all-outgoing-to-proxy-port/1590476641" -j REDIRECT --to-ports 4140
08: -A PROXY_INIT_REDIRECT -p tcp -m multiport --dports 4190,4191 -m comment --comment "proxy-init/ignore-port-4190,4191/1590476641" -j RETURN
09: -A PROXY_INIT_REDIRECT -p tcp -m comment --comment "proxy-init/redirect-all-incoming-to-proxy-port/1590476641" -j REDIRECT --to-ports 4143
10: COMMIT
```

### 3.2 iptables规则解读

相比Istio proxy，linkerd proxy的iptables规则的comment里面描述还是比较清楚的：

- 2，所有进展数据包在进行路由选择之前会被引导到PROXY_INIT_REDIRECT链表
- 3，所有输出数据包会被引导到PROXY_INIT_OUTPUT链表
- 4，POD1向POD所在的服务svc1发送请求，并且被Linkerd mesh到自己(POD1)的情况下，走正常的入站处理流程PROXY_INIT_REDIRECT，由proxy进行mesh处理
- 5，linkerd proxy发出的包括控制面数据包和mesh/proxy之后的数据包，proxy不做处理
- 6，通过localhost自己访问自己的数据包，proxy不做处理
- 7，其余出站数据包进入proxy监听的出站端口4140，进行mesh/proxy
- 8，入站数据包如果是控制面发给linkerd proxy 4190/4191端口的，不做处理
- 9，其余入站数据进入proxy监听的入站端口4143，进行mesh/proxy

具体可以参看代码：

[https://github.com/linkerd/linkerd2-proxy-init/blob/master/iptables/iptables.go](https://github.com/linkerd/linkerd2-proxy-init/blob/master/iptables/iptables.go)

## 四、数据流转方法

可以看到Linkerd proxy的数据流量劫持规则基本和文章[《二十四：Service Mesh之Istio proxy的流量劫持详细分析》](/zhuanlan/container/kubernetes/4/24.html)里面分析的类似，在此不进行
