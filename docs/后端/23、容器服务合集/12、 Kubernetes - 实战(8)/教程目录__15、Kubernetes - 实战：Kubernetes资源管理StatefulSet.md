# 15、Kubernetes - 实战：Kubernetes资源管理StatefulSet
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/8/15.html
- 分类：容器服务
- 分组：教程目录
## 一、Kubernetes SatefulSet（有状态应用部署）

Statefulset（有状态集，缩写为sts）常用于部署有状态的且需要有序启动的应用程序，比如在进行SpringCloud项目容器化时，Eureka的部署是比较适用StatefulSet部署方式的，可一个每个Eureka实例创建一个唯一且固定的标识符，并且每个Eurkeka实例无需配置多余的Service，其余SpringCloud应用可以直接通过Eureka的Headless即可进行注册。

Eurake的statefulset的资源名称是eureka，eureka-0，eureka-1,eureka-2

Service是headless service,没有Cluster IP， eureka-svc

Eureka-0.eureka-svc.NAMESPACE_NAME

### 1.1 部署有状态应用

- 解决Pod独立生命周期，保持Pod启动顺序和唯一性
- 稳定，唯一的网络标识符，持久存储
- 有序，优雅的部署和扩展、删除和终止
- 有序，滚动更新

### 1.2 应用场景：数据库

说明
常规的service

service：一组pod访问策略，提供负载均衡和服务发现

其他：service 会分配一个 CLUSTER-IP 虚拟IP 使整个容器进行通信。

headless service：无头服务

headless service：与service类似，不同点在于clusterIP为None

需要部署一个dns服务器

[https://www.cnblogs.com/xiangsikai/p/11413970.html](https://www.cnblogs.com/xiangsikai/p/11413970.html)

### 1.3 案例

#### 1、创建有状态应用

```java
vim sts.yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx
  labels:
    app: nginx
spec:
  ports:
  - port: 80
    name: web
  clusterIP: None
  selector:
    app: nginx
---
apiVersion: apps/v1beta1
kind: StatefulSet
metadata:
  name: nginx-statefulset
  namespace: default
spec:
  指定使用的service
  serviceName: nginx
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:latest
        ports:
        - containerPort: 80
```

#### 2、创建容器

```java
kubectl create -f sts.yaml
```

#### 3、查看创建容器以及service、通过dns名称，保证每个固定的身份（pod/nginx-statefulset-x）标识。

```java
kubectl get pods,svc
NAME READY STATUS RESTARTS AGE
# statefulset-x 为身份标识
pod/nginx-statefulset-0 1/1 Running 0 16s
pod/nginx-statefulset-1 1/1 Running 0 13s
pod/nginx-statefulset-2 1/1 Running 0 10s
pod/sh-77649dbd59-ppfbx 1/1 Running 0 21m
NAME TYPE CLUSTER-IP EXTERNAL-IP PORT(S) AGE
service/kubernetes ClusterIP 10.0.0.1 <none> 443/TCP 5d16h
service/nginx ClusterIP None <none> 80/TCP 26s
```

#### 4、临时启动程序测试解析，通过dns解析唯一标识的容器

```java
kubectl run --image=busybox:1.28.4 -it sh
/ nslookup nginx-statefulset-0
Server:    10.0.0.2
Address 1: 10.0.0.2 kube-dns.kube-system.svc.cluster.local
nslookup: can't resolve 'nginx-statefulset-0'
```

如此可以比对出效果

StatefulSet与Deployment区别：有身份的！

身份三要素：

- 域名
- 主机名
- 存储（PVC）

```java
ClusterIP A记录格式：<service-name>.<namespace-name>.svc.cluster.local
ClusterIP=None A记录格式：<statefulsetName-index>.<service-name>.svc.cluster.local
示例：web-0.nginx.default.svc.cluster.local
```

## 二、statsfulset更新策略

创建从第一个开始，更新从最后一个开始，删除也是从最后一个开始。

默认为：RollingUpdate #滚动式更新

OnDelete

Partition: 3 #只更新大于等3的pod,来实现简单的灰度发布。（statefulset实现分段更新）

## 三、statsfulset删除策略

级联删除：kuebctl delete sts nginx(删除statefulset同时删除Pod)

非级联删除：kubectl delete sts nginx --cascade=false（删除statefulset不删除pod，此时Pod变成孤儿Pod,删除之后惠被创建）
