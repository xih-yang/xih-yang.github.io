# 18、Kubernetes - 实战：ServiceMesh之在Kubernetes中对gRPC流量进行负载均衡
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/4/18.html
- 分类：容器服务
- 分组：教程目录
## 一、前言

gRPC服务在部署到Kubernetes之后，有来自Kubernetes内部和外部的gRPC访问请求，所以对负责请求接入和负载均衡的LB提出了更高的要求，除了实施传统的负载均衡策略，还要在七层实施数据包分解和路由。

业务的典型场景是外部客户端通过短连接访问API，经过外部LB、Kong、内部LB、Ingress到达内部请求接入服务，之后的内部调用通过gRPC长连接进行：

Kubernetes平台内部和外部gRPC调用

## 二、访问Kubernetes集群内gRPC服务的负载均衡

### 2.1 K8S集群内服务访问集群内gRPC服务的负载均衡

集群内服务访问集群内其它gRPC服务的时候，如果使用kube-proxy提供的基于iptables或者IPVS的四层负载均衡服务，则会造成gRPC长连接被绑定在某个固定的后端POD上，造成负载均衡的失效，要解决这个问题可以有两个方向进行选择：

- 集中式LB：Kubernetes Ingress Nginx
- 分布式客户端LB：
- 基于etcd服务发现的客户端负载均衡
- 基于k8s sidecar的负载均衡：Linkerd/Istio

在我们的业务实践中，我们采用来基于etcd服务发现的客户端负载均衡，这种方式可以大幅减轻Ingress Nginx的压力，但是会增加业务系统的复杂度(业务研发需要负责服务注册、服务发现、负载均衡、端点可用性保障和错误处理)：

基于etcd服务发现的客户端gRPC负载均衡

所有的服务都可以在etcd里面进行注册和发现：

### 2.2 K8S集群外服务访问集群内gRPC服务的负载均衡

外部访问集群内gRPC服务这个情况暂时还不是很普遍，因为外部业务请求一般都是客户端直接发起，都是HTTP短连接；针对特殊的gRPC长连接请求，可以直接通过v0.3.0版本以后Ingress Nginx进行访问支持：

[https://kubernetes.github.io/ingress-nginx/examples/grpc/](https://kubernetes.github.io/ingress-nginx/examples/grpc/)

这个可以参看下一篇文章[《使用Ingress Nginx暴露Kubernetes上的gRPC服务》](/zhuanlan/container/kubernetes/4/19.html)

## 三、Kubernetes集群内服务访问外部gRPC服务的负载均衡

Kubernetes集群内部服务要访问外部的gRPC服务，最直接的方案也是将外部服务注册到etcd上面，由客户端进行服务发现、服务维护和负载均衡：

另外一种等价的方案就是通过Kubernetes将外部服务定义成cluster service或者endpoints，直接暴露给内部调用：

[https://kubernetes.io/docs/concepts/services-networking/service/#services-without-selectors](https://kubernetes.io/docs/concepts/services-networking/service/#services-without-selectors)

这种方式Kubernetes可以帮助进行服务注册，但是客户端要负责后续服务发现(为了避免使用Kubernetes的默认负载均衡方案，客户端需要通过service进行主动的服务发现)、存活管理和负载均衡。

另外，对这个方案的一个改进措施是在外部gRPC服务集群前端部署支持gRPC协议的负载均衡服务，比如Nginx/Envoy/ambassador等，这样Kubernetes平台的服务只需要和支持gRPC协议的负载均衡服务IP建立长连接即可：
