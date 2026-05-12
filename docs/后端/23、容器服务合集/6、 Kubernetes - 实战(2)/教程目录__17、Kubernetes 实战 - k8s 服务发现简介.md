# 17、Kubernetes 实战 - k8s 服务发现简介
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/2/17.html
- 分类：容器服务
- 分组：教程目录
## 一，前言

上一篇，介绍了阿里云 ECS 服务器重启后的环境修复；

本篇，介绍 k8s 服务发现；

## 二，服务发现简介

当A服务依赖了 B服务，而 B服务的IP和端口未知（或相对不固定），这时就需要服务发现；

服务发现：是指使用一个注册中心，来记录分布式系统中全部服务的信息，以便于其他服务能够快速找到这些在注册中心的已注册服务；

## 三，CoreDNS

Pod的 IP 是漂移且不固定的，所以需要使用 Service 来将 pod 的访问入口进行固定；

（pod 的 ip 和端口号可能会改变，但 service 是不会变的）

可以利用 DNS 机制为每一个 Service 添加一个内部的域名，指向其真实 IP；

通过访问服务的域名访问到 ip；

在K8s中，对 Service 的服务发现，是通过 CoreDNS 组件实现的；

（coreDNS 是 Go 语言实现的一个 DNS 服务器）

--n 按命名空间过滤

--l 按标签过滤

--o wide 输出额外信息。对于Pod，将输出Pod所在的Node名

```java
kubectl -n kube-system get all  -l k8s-app=kube-dns -o wide
[root@k8s-master ~]# kubectl -n kube-system get all  -l k8s-app=kube-dns -o wide
NAME                           READY   STATUS    RESTARTS   AGE   IP           NODE         NOMINATED NODE   READINESS GATES
pod/coredns-54d67798b7-rlktq   1/1     Running   1          13d   10.244.0.4   k8s-master   <none>           <none>
pod/coredns-54d67798b7-w8p5k   1/1     Running   1          13d   10.244.0.5   k8s-master   <none>           <none>
NAME               TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)                  AGE   SELECTOR
service/kube-dns   ClusterIP   10.96.0.10   <none>        53/UDP,53/TCP,9153/TCP   13d   k8s-app=kube-dns
NAME                      READY   UP-TO-DATE   AVAILABLE   AGE   CONTAINERS   IMAGES                                                              SELECTOR
deployment.apps/coredns   2/2     2            2           13d   coredns      registry.cn-hangzhou.aliyuncs.com/google_containers/coredns:1.7.0   k8s-app=kube-dns
NAME                                 DESIRED   CURRENT   READY   AGE   CONTAINERS   IMAGES                                                              SELECTOR
replicaset.apps/coredns-54d67798b7   2         2         2       13d   coredns      registry.cn-hangzhou.aliyuncs.com/google_containers/coredns:1.7.0   k8s-app=kube-dns,pod-template-hash=54d67798b7
```

## 四，服务发现的规则

- kubectl exec 的作用是可以直接在容器内执行Shell脚本
- 命令格式：kubectl exec -it [PodName] – [Command]

-i：即使没有连接，也要保持标准输入保持打开状态。一般与 -t 连用。
-t：分配一个伪TTY（终端设备终端窗口），一般与 -i 连用。可以分配给我们一个Shell终端

```java
[root@k8s-master ~]# kubectl get pods
NAME                       READY   STATUS             RESTARTS   AGE
user-v1-84bdcc465b-vxvl2   1/1     Running            0          5d
v4-57b4cf7fd9-zcl45        0/1     ImagePullBackOff   0          4d23h
v4-fb4cd75f5-bf2pf         0/1     ImagePullBackOff   0          16h
[root@k8s-master ~]# kubectl get svc
NAME              TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)        AGE
kubernetes        ClusterIP   10.96.0.1      <none>        443/TCP        13d
service-user-v1   NodePort    10.104.13.40   <none>        80:31071/TCP   12d
```

目前只有service-user-v1这一个服务，是不够的，需要再启动一个（启动一个 pay 的服务）

```java
[root@k8s-master ~]# cd deployment/
[root@k8s-master deployment]# ls
deployment-pay-v1.yaml   ingress-gray.yaml         service-user-v2.yaml
deployment-user-v1.yaml  ingress.yaml              shell-probe.yaml
deployment-user-v2.yaml  pay-service-v1.yaml       tcp-probe.yaml
deployment-v4.yaml       registry-auth-file.yaml   user-service-v1.yaml
deploy.yaml              registry-login-file.yaml
http-probe.yaml          secret-opaque-flie.yaml
// 将 deployment-pay-v1.yaml 副本集修改为 1 个
[root@k8s-master deployment]# vi deployment-pay-v1.yaml 
apiVersion: apps/v1 API版本号
kind: Deployment    资源类型部署
metadata:
  name: pay-v1     资源名称
spec:
  selector:
    matchLabels:
      app: pay-v1  告诉deployment根据规则匹配相应的Pod进行控制和管理，matchLabels字段>匹配Pod的label值
  replicas: 1       声明Pod副本的数量
  template:
    metadata:
      labels:
        app: pay-v1Pod名称
    spec:           描述Pod内的容器信息
      containers:
      - name: nginx 容器的名称
        image: nginx:pay镜像
        ports:
        - containerPort: 80容器内映射的端口
// 生效配置-部署一个 pay 服务
[root@k8s-master deployment]# kubectl apply -f deployment-pay-v1.yaml 
deployment.apps/pay-v1 created
// 启动服务 pay-service-v1.yaml 
[root@k8s-master deployment]# kubectl apply -f pay-service-v1.yaml 
service/service-pay-v1 created
// 查看 pod
[root@k8s-master deployment]# kubectl get pods
NAME                       READY   STATUS             RESTARTS   AGE
pay-v1-655587b6f5-gv8hc    1/1     Running            0          20s
user-v1-84bdcc465b-vxvl2   1/1     Running            0          5d
v4-57b4cf7fd9-zcl45        0/1     ImagePullBackOff   0          4d23h
v4-fb4cd75f5-bf2pf         0/1     ImagePullBackOff   0          16h
// 查看 service
[root@k8s-master deployment]# kubectl get svc
NAME              TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
kubernetes        ClusterIP   10.96.0.1       <none>        443/TCP        13d
service-pay-v1    NodePort    10.97.250.199   <none>        80:30114/TCP   21s
service-user-v1   NodePort    10.104.13.40    <none>        80:31071/TCP   12d
```

目前共有两个 pod：user-v1-84bdcc465b-vxvl2 和 pay-v1-655587b6f5-gv8hc

两个service : service-pay-v1和 service-user-v1

都在运行中了

从user-v1 中访问 pay-v1：

```java
// 进入 pod : user-v1
[root@k8s-master deployment]# kubectl exec -it user-v1-84bdcc465b-vxvl2 -- /bin/sh
// 从 user-v1 的 pod 中，访问 service-pay-v1
# curl http://service-pay-v1
// 返回信息
pay
```

## 五，namespace(命名空间)

namespace（命名空间）是 k8s 中比较重要的一个概念；

在启动集群后，kubernetes 会分配一个默认的 default 命名空间；不同的命名空间能够实现资源隔离，服务隔离，甚至权限隔离；

之前创建的服务由于没有指定 namespace ，所以这些服务都在同一个默认的 default 命名空间下；

```java
[root@k8s-master deployment]# kubectl describe service service-pay-v1
Name:                     service-pay-v1
Namespace:                default               默认命名空间
Labels:                   <none>
Annotations:              <none>
Selector:                 app=pay-v1
Type:                     NodePort
IP Families:              <none>
IP:                       10.97.250.199
IPs:                      10.97.250.199
Port:                     <unset>  80/TCP
TargetPort:               80/TCP
NodePort:             
<unset>  30114/TCP
Endpoints:                10.244.1.84:80
Session Affinity:         None
External Traffic Policy:  Cluster
Events:                   <none>
```

在相同namespace 下的规则，只需要直接访问 http://ServiceName:Port 就可以访问到相应的 Service

```java
curl http://service-pay-v1:80       (同 curl http://service-pay-v1)
备注：内部访问（pod 中）时，访问的是内部端口号，即 80（见下面 service-pay-v1 的 PORT 内部/外部）
外部访问需要通过外网 ip+30114访问
[root@k8s-master deployment]# kubectl get svc
NAME              TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
kubernetes        ClusterIP   10.96.0.1       <none>        443/TCP        13d
service-pay-v1    NodePort    10.97.250.199   <none>        80:30114/TCP   21s
service-user-v1   NodePort    10.104.13.40    <none>        80:31071/TCP   12d
```

- 不同 namespace 下的规则是 [ServiceName].[NameSpace].svc.cluster.local
- ServiceName 就是我们创建的 Service 名称
- NameSpace 则是命名空间。如果你没有命名空间，则这个值为 default。

```java
// 假如 service-pay-v1 和 service-user-v1 不在同一个命名空间下
[root@k8s-master deployment]# kubectl exec -it user-v1-84bdcc465b-vxvl2 -- /bin/sh
# curl http://service-pay-v1.default.svc.cluster.local
pay
```

## 六，结尾
