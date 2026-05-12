# 15、Kubernetes - 实战：Service 对外提供访问相关命令
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/7/15.html
- 分类：容器服务
- 分组：教程目录
## 一、环境安装

参考

[MiniKube方式部署](/zhuanlan/container/kubernetes/7/3.html)

[KubeAdm方式部署](/zhuanlan/container/kubernetes/7/4.html)

[Kind方式部署](/zhuanlan/container/kubernetes/7/5.html)

## 二、Service介绍

Kubernetes Pod 是有生命周期的，它们可以被创建，也可以被销毁，然而一旦被销毁生命就永远结束。 通过 ReplicationController 能够动态地创建和销毁 Pod（例如，需要进行扩缩容，或者执行 滚动升级）。 每个 Pod 都会获取它自己的 IP 地址，即使这些 IP 地址不总是稳定可依赖的。 这会导致一个问题：在 Kubernetes 集群中，如果一组 Pod（称为 backend）为其它 Pod （称为 frontend）提供服务，那么那些 frontend 该如何发现，并连接到这组 Pod 中的哪些 backend 呢？

Kubernetes Service 定义了这样一种抽象：一个 Pod 的逻辑分组，一种可以访问它们的策略 —— 通常称为微服务。 这一组 Pod 能够被 Service 访问到，通常是通过 Label Selector实现的。Service 通过标签来选取服务后端，一般配合 Replication Controller 或者 Deployment 来保证后端容器的正常运行。这些匹配标签的 Pod IP 和端口列表组成 endpoints，由 kube-proxy 负责将服务 IP 负载均衡到这些 endpoints 上。

Service默认只支持4层负载均衡能力，没有7层功能。（7层可以通过Ingress实现）

## 三、Service的类型

•ClusterIP：默认值，k8s系统给service自动分配的虚拟IP，只能在集群内部访问。

•NodePort：在ClusterIP基础上，将Service通过指定的Node上的端口暴露给外部，访问任意一个 NodeIP:nodePort都将路由到ClusterIP。

•LoadBalancer：在 NodePort 的基础上，借助 cloud provider 创建一个外部的负载均衡器，并将请求转发到 :NodePort

此模式只能在云服务器上使用（收费的）。

•ExternalName：将服务通过 DNS CNAME 记录方式转发到指定的域名（通过 spec.externlName 设定）。(很少用)

## 四、Service使用

### 1 ClusterIP类型

1)vim svc.yml

```java
apiVersion: v1
kind: Service
metadata:
  labels:                          
    app: web
  name: nginx-svc
  namespace: dev
spec:
  ports:
  - name: http
    port: 3001                      service暴露的端口
    protocol: TCP
    targetPort: 80                 后端容器的端口
  selector:                      标签选择器与deployment一致
    app: web                 
  type: ClusterIP
---
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: web
  name: deployment-nginx
  namespace: dev
spec:
  replicas: 2         replicas至少要2个以上，否则 后面进容器内无法访问svc
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
      - image: nginx:1.21.4
        name: nginx
        ports:
        - name: http
          containerPort: 80      容器端口
```

2)创建svc 和 deploy

```java
kubectl apply -f svc.yml
```

3)查看deploy、svc、pod

```java
kubectl get svc -n dev -o wide
kubectl get deploy -n dev -o wide
kubectl get po -n dev -o wide
```

4)测试访问

进入其中一个po中容器

```java
kubectl exec -it deployment-nginx-7c64d47847-8tspg bash -n dev
```

通过curl http://10.96.243.3:3001 或 curl http://nginx-svc:3001 都可以访问成功。其中nginx-svc为service name

也可以查看容器的日志

```java
kubectl logs -f  deployment-nginx-7c64d47847-8tspg
```

ClusterIp类型默认只能内部访问，不能外部访问。也可以用 port-forward 实现临时转发访问

```java
kubectl port-forward sevice/nginx-svc 81:3001
```

转发后，启用新ssh终端访问

```java
curl http://127.0.0.1:81
```

### 2 NodePort类型

vimsvc.yml

```java
apiVersion: v1
kind: Service
metadata:
  labels:
    app: web
  name: nginx-svc
  namespace: dev
spec:
  ports:
  - name: http
    port: 3001     
    protocol: TCP
    targetPort: 80
    nodePort: 31000  30000 - 32767
  selector:
    app: web
  type: NodePort
---
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: web
  name: deployment-nginx
  namespace: dev
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
      - image: nginx:1.21.4
        name: nginx
        ports:
        - name: http
          containerPort: 80
```

使配置生效

```java
kubectl apply -f svc.yml
```

获取svc

```java
kubectl  get svc -n dev
```

外部浏览器打开访问：

Ip: 31000

### 3 LoadBalancer类型

收费的，后续待补充

### 4 ExternalName

很少用
