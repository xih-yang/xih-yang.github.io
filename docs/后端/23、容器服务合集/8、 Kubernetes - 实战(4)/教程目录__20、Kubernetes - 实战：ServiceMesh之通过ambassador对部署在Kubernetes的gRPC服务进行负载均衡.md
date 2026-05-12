# 20、Kubernetes - 实战：ServiceMesh之通过ambassador对部署在Kubernetes的gRPC服务进行负载均衡
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/4/20.html
- 分类：容器服务
- 分组：教程目录
## 一、前言

ambassdor是一款支持Kubernetes原生服务的API网关，它很好的补充了Ingress Nginx所不支持的流控、灰度、认证、授权等网关必备的功能。

ambassdor的数据平面是基于envoy proxy构建的，但是除了作为API网关，还可以成为Kubernetes的Ingress，原因就在于ambassdor的控制面负责监听k8中的service资源的变化，并将配置下发envoy，实际的流量转发通过envoy来完成。另外，ambassdor的控制面使用Kubernetes的etcd存储它的状态。

## 二、安装ambassador

参看文档：

[https://www.getambassador.io/docs/latest/tutorials/getting-started/](https://www.getambassador.io/docs/latest/tutorials/getting-started/) (v1.5)

### 2.1 部署

对aes.yaml进行如下修改：

暴露ambassdor的数据面80和443接口为32080和32443：

```java
apiVersion: v1
kind: Service
metadata:
  name: ambassador
  namespace: ambassador
  labels:
    product: aes
    app.kubernetes.io/component: ambassador-service
spec:
  type: NodePort
  ports:
  - name: http
    port: 80
    targetPort: http
    nodePort: 32080
  - name: https
    port: 443
    targetPort: https
    nodePort: 32443
  selector:
    service: ambassador
```

暴露ambassdor控制面的接口8877为3208：

```java
apiVersion: v1
kind: Service
metadata:
  labels:
    service: ambassador-admin
    product: aes
  name: ambassador-admin
  namespace: ambassador
spec:
  type: NodePort
  ports:
  - name: ambassador-admin
    port: 8877
    targetPort: admin
    nodePort: 32087
  selector:
    service: ambassador
```

部署结果：

### 2.2 访问控制面接口

通过Kubernetes的node IP和NodePort接口进行访问：

[http://172.2.2.11:32087/ambassador/v0/diag/](http://172.2.2.11:32087/ambassador/v0/diag/)

会显示现在ambassador系统的运行状况：

## 三、部署gRPC服务

参看文章[《十九：使用Ingress Nginx暴露Kubernetes上的gRPC服务》](/zhuanlan/container/kubernetes/4/19.html)第二节：

## 四、通过ambassador暴露gRPC服务

### 4.1 部署ambassador的Mapping配置

```java
---
apiVersion: getambassador.io/v2
kind: KubernetesEndpointResolver
metadata:
  name: grpcserver-endpoint-resolver
---
apiVersion: getambassador.io/v2
kind: Mapping
metadata:
  name: grpcserver
spec:
  grpc: true
  prefix: /greet.GrpcService/
  rewrite: /greet.GrpcService/
  service: grpcserver.grpcserver:50051
  resolver: grpcserver-endpoint-resolver
  load_balancer:
    policy: round_robin
```

ambassador进行服务发现和[负载均衡有很多的策略](https://www.getambassador.io/docs/1.3/topics/running/load-balancer/)，如果要在Mapping中使用负载均衡策略，需要进行后端服务的解析，针对Kubernetes的[服务解析器](https://www.getambassador.io/docs/1.3/topics/running/resolvers/)支持KubernetesServiceResolver、KubernetesEndpointResolver和ConsulResolver三种服务发现机制，前者将kubernetes的service作为LB的后端，后者将POD作为LB的后端。这里不能使用“KubernetesServiceResolver”，因为gRPC服务不能依赖于kubernetes默认的service进行四层负载均衡，需要ambassador借助KubernetesEndpointResolver将service所有replica POD IP解析出来，才能按照负载均衡策略转发流量。

配置的结果如下：

服务解析器：

Ambassador Route Table：

Envoy信息，gRPC服务两个后端POD IP都被ambassador发现了：

### 4.2 通过ambassador访问gRPC服务

配置访问对象：

```java
export SVC_HOST_NAME=172.2.2.11
export SVC_PORT=32443
```

相关代码参见[《十九：使用Ingress Nginx暴露Kubernetes上的gRPC服务》](/zhuanlan/container/kubernetes/4/19.html)第五节：

**client_short_connection.go**和**client_longlive_connection.go**

通过长连接访问：

```java
./grpc_client_longlive 
Starting client...
Created client: &{%!f(*grpc.ClientConn=&{0xc0000b2b80 0x4851c0 172.2.2.11:32443 {passthrough  172.2.2.11:32443} 172.2.2.11:32443 {<nil> <nil> [] [] <nil> <nil> {
    {1000000000 1.6 0.2 120000000000}} false false false 0 <nil>  {grpc-go/1.30.0-dev 0x86bf80 false [] 0xc0000ae3e0 <nil> {0 0 false} <nil> 0 0 32768 32768 0 <nil>} [] <nil> 0 false true false <nil> <nil> <nil> <nil> 0x86e680 [] true} 0xc0000a6f80 {0xc0000ae3f0 <nil> 0x86bf80 0 {passthrough  172.2.2.11:32443}} 0xc00013ebd0 {
    {0 0} 0 0 0 0} 0xc0000b0780 0xc0000b4910 map[0xc00017e580:{}] {0 0 false} pick_first 0xc0000b2c80 {<nil>} 0xc0000a6f60 0 0xc0000baa40 {0 0} <nil>})}callService...
2020/05/13 10:11:45 Response from Service: Got input test server host: grpcserver-5bfd56f94b-bc6fg
callService...
2020/05/13 10:11:47 Response from Service: Got input test server host: grpcserver-5bfd56f94b-w7frq
callService...
2020/05/13 10:11:49 Response from Service: Got input test server host: grpcserver-5bfd56f94b-bc6fg
callService...
2020/05/13 10:11:51 Response from Service: Got input test server host: grpcserver-5bfd56f94b-w7frq
callService...
2020/05/13 10:11:53 Response from Service: Got input test server host: grpcserver-5bfd56f94b-bc6fg
callService...
2020/05/13 10:11:55 Response from Service: Got input test server host: grpcserver-5bfd56f94b-w7frq
callService...
2020/05/13 10:11:57 Response from Service: Got input test server host: grpcserver-5bfd56f94b-bc6fg
callService...
2020/05/13 10:11:59 Response from Service: Got input test server host: grpcserver-5bfd56f94b-w7frq
callService...
2020/05/13 10:12:01 Response from Service: Got input test server host: grpcserver-5bfd56f94b-bc6fg
callService...
2020/05/13 10:12:03 Response from Service: Got input test server host: grpcserver-5bfd56f94b-w7frq
```

可以看到两个后端POD轮流进行服务，客户端所在机器只有一个端口被占用：

**通过短连接访问：**

可以看到两个后端POD轮流进行服务，客户端所在机器只有大量端口被占用：
