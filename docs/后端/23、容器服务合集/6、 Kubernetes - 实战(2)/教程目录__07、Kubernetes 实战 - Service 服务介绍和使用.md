# 07、Kubernetes 实战 - Service 服务介绍和使用
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/2/7.html
- 分类：容器服务
- 分组：教程目录
## 一，前言

上一篇，通过配置一个 Deployment 对象，在内部创建副本集对象，副本集帮我们创建了 3 个 pod 副本

由于pod 存在 IP 漂移现象，pod 的创建和重启会导致 IP 变化；

本篇，介绍 Service 服务，解决 pod 的 IP 漂移问题；

## 二，Service 介绍

- deployment 是无状态的
- deployment 并不会对 pod 进行网络通信和分发
- Pod 的 IP 在运行时还会经常进行漂移且不固定
- 想访问服务需要使用 Service 组织统一的 Pod 访问入口
- 可以定义Service 来进行统一组织 Pod 服务访问
- 负责自动调度和组织deployment中 Pod 的服务访问，由于自动映射 Pod 的IP，同时也解决了 Pod 的IP漂移问题

## 三，Pod 的 ip 漂移问题

上图有3 个 node 节点，访问节点 3000 端口，请求会统一转发到 service，由 service 负载均衡分发到 pod 节点；

在每个node 节点上监听一个端口（如 3000），客户端（即浏览器）访问每个节点的 3000 端口都会访问到 Service 服务（Service 有固定 IP 和端口号），通过 Service 转发给 pod

Service 负责调度和组织 deployment 中 Pod 完成服务访问，Service 会自动映射 Pod 的 IP（即 Service知道每个 pod 对应的真实 ip ），这样就解决了 Pod 的 IP 漂移问题（pod 的 ip 可能会发生变化，但有固定 IP 和端口的 Service 服务可以找到 pod）

## 四，创建 Service 配置文件

NodePort 将会在所有节点上开放一个特定端口，任何发送到该端口的流量都将被转发到对应的服务上；

字段
说明

protocol
通信类型（TCP/UDP）

targetPort
原本 Pod 开放的端口

port
Kubernetes 容器之间互相访问的端口

type
NodePort，Service 的一种访问方式

创建Service 配置文件：user-service-v1.yaml

```java
[root@k8s-master ~]# ls
deployment  init-kubeadm.conf  kube-flannel.yml  mysql.yaml
[root@k8s-master ~]# cd deployment/
[root@k8s-master deployment]# ls
deployment-user-v1.yaml
[root@k8s-master deployment]# vi user-service-v1.yaml
```

配置信息：

```java
apiVersion: v1
kind: Service      类型
metadata:
  name: service-user-v1
spec:
  selector:
    app: user-v1   
  ports:
  - protocol: TCP  协议
    port: 80       nginx端口
    targetPort: 80
  type: NodePort   节点端口号，不指定随机
```

## 五，启动 Service

```java
// 根据配置文件启动 Service
[root@k8s-master deployment]# kubectl apply -f user-service-v1.yaml
service/service-user-v1 created
```

## 六，查看当前的服务

```java
// 查看当前服务
[root@k8s-master deployment]# kubectl get svc
NAME              TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
kubernetes        ClusterIP   10.96.0.1       <none>        443/TCP        35h
nginx             NodePort    10.107.223.32   <none>        80:32117/TCP   21h
service-user-v1   NodePort    10.104.13.40    <none>        80:31071/TCP   55s
```

## 七，访问 Service

1，可以在任何节点上访问

```java
// master 访问
[root@k8s-master ~]# curl http://172.17.178.105:31071
user-v1
[root@k8s-master ~]# curl http://172.17.178.106:31071
user-v1
// node 访问
[root@k8s-node ~]# curl http://172.17.178.105:31071
user-v1
[root@k8s-node ~]# curl http://172.17.178.106:31071
user-v1
```

2，通过浏览器访问公网地址

```java
http://47.93.9.45:31071/
```

问题：浏览器会转框卡住

原因：由于防火墙导致

两种解决方法：

1，到阿里云安全规则配置开放端口

2，换成一个已经开放的端口，比如：8080

开放端口号：31071

重新访问，成功：

## 结尾

本篇，主要介绍了 Service 相关内容，包含创建、启动、访问、以及 pod 的 id 漂移；

下一篇，继续介绍 Ingress；
