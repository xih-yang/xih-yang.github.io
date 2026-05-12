# 16、Kubernetes - 实战：Ingress 控制器
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/7/16.html
- 分类：容器服务
- 分组：教程目录
## 一、环境安装

参考

[MiniKube方式部署](/zhuanlan/container/kubernetes/7/3.html)

[KubeAdm方式部署](/zhuanlan/container/kubernetes/7/4.html)

[Kind方式部署](/zhuanlan/container/kubernetes/7/5.html)

## 二、Ingress介绍

### 1 基本概念

`Ingress`相当于一个`7`层的负载均衡器，是`Kubernetes`对反向代理的一个抽象，它的工作原理类似于`Nginx`，可以理解成在** Ingress 里建立诸多映射规则，Ingress Controller 通过监听这些配置规则并转化成 Nginx 的反向代理配置，然后对外部提供服务**。

两个核心概念：

- Ingress：Kubernetes中的一个对象，作用是定义请求如何转发到Service的规则
- Ingress Controller：具体实现反向代理及负载均衡的程序，对Ingress定义的规则进行解析，根据配置的规则来实现请求转发，实现方式有很多，比如Nginx，Contour，Haproxy等

### 2 工作原理

**1、** 用户编写`Ingress`规则，说明哪个域名对应`Kubernetes`集群中的哪个`Service`；

**2、**`Ingress`控制器动态感知`Ingress`服务规则的变化，然后生成一段对应的`Nginx`反向代理配置；

**3、**`Ingress`控制器会将生成的`Nginx`配置写入到一个运行着的`Nginx`服务中，并动态更新；

查看Ingress官方帮助

```java
kubectl explain ingress
```

```java
KIND:     Ingress
VERSION:  networking.k8s.io/v1
DESCRIPTION:
     Ingress is a collection of rules that allow inbound connections to reach
     the endpoints defined by a backend. An Ingress can be configured to give
     services externally-reachable urls, load balance traffic, terminate SSL,
     offer name based virtual hosting etc.
FIELDS:
   apiVersion   <string>
     APIVersion defines the versioned schema of this representation of an
     object. Servers should convert recognized schemas to the latest internal
     value, and may reject unrecognized values. More info:
     https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
   kind <string>
     Kind is a string value representing the REST resource this object
     represents. Servers may infer this from the endpoint the client submits
     requests to. Cannot be updated. In CamelCase. More info:
     https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
   metadata     <Object>
     Standard object's metadata. More info:
     https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
   spec <Object>
     Spec is the desired state of the Ingress. More info:
     https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#spec-and-status
   status       <Object>
     Status is the current state of the Ingress. More info:
     https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#spec-and-status
```

## 三、Ingress使用

### 1 创建yml文件

tomcat-nginx.yml

```java
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  namespace: dev
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx-pod
  template:
    metadata:
      labels:
        app: nginx-pod
    spec:
      containers:
      - name: nginx
        image: nginx:1.17.1
        ports:
        - containerPort: 80
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tomcat-deployment
  namespace: dev
spec:
  replicas: 3
  selector:
    matchLabels:
      app: tomcat-pod
  template:
    metadata:
      labels:
        app: tomcat-pod
    spec:
      containers:
      - name: tomcat
        image: tomcat:8.5-jre10-slim
        ports:
        - containerPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
  namespace: dev
spec:
  selector:
    app: nginx-pod
  clusterIP: None
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: tomcat-service
  namespace: dev
spec:
  selector:
    app: tomcat-pod
  clusterIP: None
  type: ClusterIP
  ports:
  - port: 8080
    targetPort: 8080
```

### 2 创建service和deploy实例

```java
kubectl create -f tomcat-nginx.yml
```

### 3 查看service服务

```java
kubectl get svc -n dev
```

### 4 创建Ingress HTTP 代理

ingress-http.yml

```java
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ingress-http
  namespace: dev
spec:
  rules:
  - host: nginx.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: nginx-service svc 中配置的名字
            port: 
              number: 80 svc 中配置的端口
  - host: tomcat.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: tomcat-service
            port: 
              number: 8080
```

```java
kubectl create -f ingress-http.yml
```

### 5 查看 Ingress

```java
kubectl get ing -n dev
```
