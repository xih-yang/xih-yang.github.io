# 24、Kubernetes 实战 - 之Service
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/1/24.html
- 分类：容器服务
- 分组：教程目录
## 前言

在Kubernetes中，Pod中的网络是隔离的，而且IP随着pod的的变化而变化，比如部署了一个nginx,代理后端服务，当后端pod的IP变化后，nginx不能感知变动，从而发生错误，为了解决类似问题，Kubernetes中抽象出来一个Service服务发现机制（只支持四层负载均衡，即通过IP端口转发）。

- Pod 有自己的 IP 地址
- Service 被赋予一个唯一的 dns name
- Service 通过 label selector 选定一组 Pod
- Service 实现负载均衡，可将请求均衡分发到选定这一组 Pod 中

## Service的类型

Service在K8s中有以下四种类型

- ClusterIp:默认类型，自动分配一个仅Cluster内部可以访问的娜IP
- NodePort:在ClusterIP基础上为Service在每台机器上绑定一作口，这样就可以通过NodePort来访问该服努
- LoadBalancer:在NodePort的基础上，侑助cloud provider创建一个外部负载均衡器，并将请热专发 到：NodePort
- ExternalName:把集群外部的服努引入到集群内部来，在集群内部直接使用。没有任何类型代理被创建， 这只有kubernetes 1.7或更高版本的kube-dns才支持

## 代理模式(图片为百度网图)

kube-proxy是Kubernetes的核心组件，部署在每个Node节点上，它是实现Kubernetes Service的通信与负载均衡机制的重要组件; kube-proxy负责为Pod创建代理服务，从apiserver获取所有server信息，并根据server信息创建代理服务，实现server到Pod的请求路由和转发，从而实现K8s层级的虚拟转发网络。

**User space**

kube-proxy会监听apiserver中Service的变化, 并写入相关iptables 规则，请求会通过用户空间进入iptables，进入kube-proxy，然后代理转发请求后后端Pod,默认使用 轮询算法，性能很低，一般不用

**Iptables**

默认模式，基于User space，直接把反向代理全部交给 iptables 来实现，性能也存在问题

**IPVS**

LVS是Linux Virtual Server的简称，也就是Linux虚拟服务器, 是一个由章文嵩博士发起的自由软件项目，现在已经是 Linux标准内核的一部分。LVS是一种叫基于TCP/IP的负载均衡技术，转发效率极高，具有处理百万计并发连接请求的能力。

LVS的IP负载均衡技术是通过IPVS模块实现的。IPVS模块是LVS集群的核心软件模块，它安装在LVS集群作为负载均衡的主节点上，虚拟出一个IP地址和端口对外提供服务。用户通过访问这个虚拟服务（VS），然后访问请求由负载均衡器（LB）调度到后端真实服务器（RS）中，由RS实际处理用户的请求给返回响应。

IPVS模式在Kubernetes v1.8中引入，并在v1.9中进入了beta，目前基本都使用这种方式。通过netlink 创建ipvs规则，并使用k8s Service与Endpoints信息，对所在节点的ipvs规则进行定期同步。并提供了多种负载均衡算法：

- rr: round-robin(轮训)
- lc: least connection (最小打开的连接数)
- dh: destination hashing（目标哈希）
- sh: source hashing（源哈希）
- sed: shortest expected delay（最短期望延迟）
- nq: never queue（不排队调度）

## 创建

**ClusterIP**

```sh
# 
vim nginx.yaml
# 
apiVersion: v1
kind: Service
metadata:
  name: nginx-svc
  namespace: default
spec:
  标签选择器
  selector:
    app: nginx
  svc类型，默认ClusterIP
  type: ClusterIP
  ports:
  - name: default
    网络协议
    protocol: TCP
    svc访问端口
    port: 80
    代理端口
    targetPort: 80
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  selector:
    matchLabels:
      app: nginx
  replicas: 3
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: daocloud.io/library/nginx:1.7.11
        ports:
        - containerPort: 80
          protocol: TCP
kubectl create  -f nginx.yaml
kubectl get pods -l app=nginx
# 查看svc详情，这里可以很清楚的看到，svc代理了三个容器端口
kubectl describe svc nginx-svc
# 访问，在node节点输入ClusterIP分配的IP，可访问ngixn首页，此时是轮询机制
curl 10.68.39.19
```
