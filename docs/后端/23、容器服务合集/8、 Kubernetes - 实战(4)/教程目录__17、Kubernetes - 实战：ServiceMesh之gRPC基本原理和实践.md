# 17、Kubernetes - 实战：ServiceMesh之gRPC基本原理和实践
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/4/17.html
- 分类：容器服务
- 分组：教程目录
## 一、前言

gRPC是一款高效的RPC框架，基于HTTP/2进行设计并支持ProtoBuf序列化协议。gRPC使用长连接和单连接内部高并发来提高性能，这对于数据中心内部服务之间横向调用意义巨大。当前服务在启动的时候可以启动到多个gRPC服务端的长连接，并在连接内部进行大批量的数据并发调用，极大提升了内部东西向调用性能：

gRPC服务调用

## 二、gRPC负载均衡问题和方案

### 2.1 问题

基于gRPC的服务通过加强七层链接的使用率提升调用性能。具体来说，gRPC使用HTTP/2.0协议建立单一长TCP连接(single long-lived TCP connection)，并在该连接上能准并发(交叉)传递请求/响应(multiple requests can be active on the same connection at any point in time)，消灭单transaction连接建立时间并且在热链路上即时进行数据收发。这样的数据传输特性意味着长连接内部状态在7层才能获得，很多基于四层的流量管理机制都会失效，四层的负载均衡将由于长TCP连接的存在而失去效果，所有的后续gRPC请求都会被发送到这一个长TCP连接对应的后端。

四层LB无法均衡gRPC调用

这里可以再进一步聊一下HTTP/1.1也是基于长连接的协议，为什么进行四层LB负载均衡没有问题？其实由于HTTP/1.1的特性，导致这个问题没有那么明显，对于实际的业务没有太大的影响：

- HTTP/1.1 不会进行请求的交叉发送，任何时候在一个连接上只有一个请求，只有等当前的请求处理完了才能进行下一个请求
- 如果有很多并发请求，需要启动更多的长连接进行处理
- 每个长连接会有确定的过期时间

这几个点组合起来最后会导致对于有大量并发的系统而言，会建立足够多的长连接，只要长连接的数量足够多，就能保证到所有的后端都有连接，所以看起来整体是负载均衡的：

HTTP/1.1的四层“负载均衡”

### 2.2 gRPC流量负载均衡方案

抽象的讲，负载均衡方案有如下几个选择：

- 专用集中式LB，比如Nginx、Envoy、HAProxy、IPVS、公有云厂商的ELB
- 客户端分布式LB
- 客户端进程内自主负载均衡，比如客户端的SDK感知所有服务端，然后有调用流程按照负载均衡方案选择调用客户端
- 客户端独立进程负载均衡，在客户端所在的主机部署LB进程同一负载均衡，类似Kubernetes部署的Istio/Linkerd的sidecard方案

根据灵活性、独立性、稳定性等不同的要求，可以选择不同的方案，在我们的业务场景中，集中式和客户端分布式LB都有使用，比如通过Envoy集中式暴露gRPC服务(具体细节参看下一节内容：**三、gRPC负载均衡实验**)或者通过服务注册和发现机制让客户端感知后端服务然后进行自主负载均衡：

基于Etcd的服务发现和客户端负载均衡方案

在这种方案中，etcd集群被用于服务注册和发现，每个gRPC客户端都会获取当前存活的注册到etcd的服务列表，然后在进行请求时按照负载均衡策略选择合理的后端发起请求。

## 三、gRPC负载均衡实验

本节通过配置gRPC客户端进行长连接和短连接不同模式尝试来验证gRPC的特性，这里使用能感知gRPC协议的七层代理Envoy作为集中式负载均衡器：

基于Envoy的集中式gRPC负载均衡方案

### 3.1 准备工作

Install go and gRPC lib on centos

```java
#https://grpc.io/docs/quickstart/go/
yum install epel-release -y
yum install golang -y
go get -u google.golang.org/grpc
go get -u github.com/golang/protobuf/{proto,protoc-gen-go}
```

### 3.2 运行例子

```java
#/root/go/src/google.golang.org/grpc/examples/helloworld
go run greeter_server/main.go 
go run greeter_client/main.go
```

并分别在两个VM启动两个gRPC服务：

> 172.3.0.17:50051
>
> 172.3.0.11:50051

### 3.3 按照Envoy作为LB

```java
#https://www.envoyproxy.io/docs/envoy/latest/start/start#using-the-envoy-docker-image
docker pull envoyproxy/envoy
```

Envoy config file: envoy-grpc.yaml

```java
admin:
  access_log_path: /tmp/admin_access.log
  address:
    socket_address:
      address: 0.0.0.0
      port_value: 9901
static_resources:
  listeners:
    -
      name: listener_0
      address:
        socket_address:
          address: 0.0.0.0
          port_value: 10000
      filter_chains:
        -
          filters:
            -
              name: envoy.http_connection_manager
              config:
                stat_prefix: ingress_http
                codec_type: AUTO
                route_config:
                  name: local_route
                  virtual_hosts:
                    -
                      name: local_service
                      domains:
                        - '*'
                      routes:
                        -
                          match:
                            prefix: /
                          route:
                            cluster: service_grpc
                http_filters:
                  -
                    name: envoy.router
  clusters:
    -
      name: service_grpc
      connect_timeout: 25s
      type: STATIC
      lb_policy: ROUND_ROBIN
      dns_lookup_family: V4_ONLY
      http2_protocol_options: {}
      hosts:
        -
          socket_address:
            address: 172.3.0.17
            port_value: 50051
        -
          socket_address:
            address: 172.3.0.11
            port_value: 50051
```

将配置构建如镜像：Dockerfile

```java
FROM envoyproxy/envoy
COPY envoy-grpc.yaml /etc/envoy/envoy.yaml
```

进行构建：

```java
docker build -t envoy:v1 .
```

Runthe envoy as proxy：

```java
docker run -d --name envoy -p 9901:9901 -p 10000:10000
#9901 as admin port and 10000 as envoy service port
```

### 3.4 使用长连接访问Envoy LB以及后端服务

修改客户端代码如下：

结果如下，在这个例子中，我们的两个gRPC服务端分别在两个VM(km2/km3)上，客户端发送的请求也会被Envoy使用RR策略轮流调度到不同的后端：

整个过程都只有一个到envoy的链接：

> tcp 0 47 172.3.0.17:45918 172.3.0.17:10000 ESTABLISHED 25429/main1

如果使用gRPC短连接访问服务则会占用大量端口：
