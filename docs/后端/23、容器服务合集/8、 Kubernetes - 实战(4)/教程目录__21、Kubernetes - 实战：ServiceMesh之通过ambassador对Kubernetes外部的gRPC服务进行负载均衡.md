# 21、Kubernetes - 实战：ServiceMesh之通过ambassador对Kubernetes外部的gRPC服务进行负载均衡
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/4/21.html
- 分类：容器服务
- 分组：教程目录
## 一、前言

ambassador除了可以对Kubernetes上的gRPC服务进行负载均衡，还可以对外部gRPC服务进行负载均衡。这其中关键的一步是将外部gRPC服务注册为Kubernetes的service。

## 二、部署外部服务并注册到Kubernetes

### 2.1 部署外部服务

将文章[《十九：使用Ingress Nginx暴露Kubernetes上的gRPC服务》](/zhuanlan/container/kubernetes/4/19.html)里面的grpc_server服务分别部署在172.3.0.11(k8s-master-03.novalocal)和172.3.0.17(k8s-master-02.novalocal)两个机器上

### 2.2 将外部服务部署到Kubernetes

external-grpcserver.yaml

```java
apiVersion: v1
kind: Service
metadata:
  name: external-grpc
spec:
  ports:
  - port: 50051
    targetPort: 50051
    protocol: TCP
---
apiVersion: v1
kind: Endpoints
metadata:
  name: external-grpc
subsets:
  - addresses:
    - ip: 172.3.0.11
    - ip: 172.3.0.17
    ports:
    - port: 50051
      protocol: TCP
```

部署结果：

## 三、通过ambassador暴露gRPC服务

### 3.1 配置ambassador服务发现和负载均衡

相较于基于etcd的客户端服务发现和负载均衡方案，类似于Ingress Nginx和ambassador的方案做到了负载均衡器所要达到的两大效果：

- 后端服务的发现和状态维护
- 负载均衡策略
- gRPC的七层负载均衡

ambassador-external-grpc.yaml

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
  name: external-grpcserver
spec:
  grpc: true
  prefix: /greet.GrpcService/
  rewrite: /greet.GrpcService/
  service: external-grpc.grpcserver:50051
  resolver: grpcserver-endpoint-resolver
  load_balancer:
    policy: round_robin
```

部署之后的ambassador控制面状态如下：

Ambassador Route Table：

Currently active Envoy Routes：

Currently active Envoy Clusters：

YAML input documents — these are what Ambassador is currently reading for its configuration：

### 3.2 通过长连接访问服务

成功实现长连接负载均衡

### 3.3 通过短连接访问服务

占用了大量端口，gRPC服务被轮流访问到
