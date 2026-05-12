# 04、Kubernetes 实战 - 实战入门
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/3/4.html
- 分类：容器服务
- 分组：教程目录
## 前言

实战Kubernetes

关于编写yaml文件，建议使用工具编写，避免对齐错误，网上工具供参考

[https://json2yaml.com](https://json2yaml.com/)

## 第一节 Namespace

Namespace是Kubernetes系统中的一种非常重要的资源，它的主要用途是用来实现多套环境的资源隔离或者多租户的资源隔离。

默认情况下，kubernetes集群中的所有Pod都是可以互相访问的。但是实际中，可能不想让两个Pod之间进行互相的访问，此时就可以将两个Pod划分到不同的Namespace下。kubernetes 通过集群内部的资源分割到不同的Namespace 中，可以形成逻辑上的组，以方便不同的资源进行隔离使用和管理。

可以通过kubenetes 的授权机制，将不同的namespace 交给不同租户进行管理，这样就实现了多租户的资源隔离。

可以通过kubernetes的授权机制，将不同的namespace交给不同租户进行管理，这样就实现了多租户的资源隔离。此时还能结合kubernetes的资源配额机制，限定不同租户能占用的资源，例如CPU使用量、内存使用量等，来实现租户可用资源的管理。

kubenetes在集群启动之后，会默认创建几个namespace

```java
[root@master ~]# kubectl get namespace
NAME              STATUS   AGE
default           Active   28h     所有未指定namespace的对象都会被分配在default命名空间中
dev               Active   3h27m    
kube-node-lease   Active   28h     集群节点之间的心跳维护，v1.13开始引入
kube-public       Active   28h     此命名空间下的资源可以被所有人访问到(包含未认证用户)
kube-system       Active   28h     所有kubenetes系统创建的资源都处于这个命名空间
[root@master ~]# 
```

- 创建namespace

```java
kubectl create ns test
```

- 查看namespace

```java
kubectl get ns test
```

- 删除namespace

```java
kubectl delete ns test
```

配置方式

首先准备一个yaml文件 ns-test.yaml

```java
apiVersion: v1
kind: Namespace
metadata:
  name: test
```

然后就可以执行创建和删除命令了

```java
kubectl create -f ns-test.yaml
kubectl delete -f ns-test.yaml
```

## 第二节 Pod

Pod是kubenetes集群进行管理的最小单位，程序要运行必须部署在容器中，而容器必须存在于Pod中。

Pod可以认为是容器的封装，一个Pod中可以存在一个容器或者多个容器。

kubenetes在集群启动之后，集群中的各个组件也都是以Pod方式运行的。可以通过下面的命令查看：

```java
kubectl get pod -n kube-system
```

### 创建并运行

kubernetes没有提供单独运行Pod的命令，都是通过Pod控制器来实现的

```java
kubectl run nginx --image=nginx:1.17.1 --port=80 --namespace=dev
#命令格式 kubectl run pod控制器名称 [参数]
--image  指定Pod的镜像
--port   指定端口
--namespace 指定namespace
```

### 查看Pod信息

```java
#查看pod信息
kubectl get pods -n dev
#显示更多的pod的内容
kubectl get pods -n dev -o wide
```

```java
#查看详细的pod的信息
kubectl describe pod nginx-64777cd554-fxvw5 -n dev
```

### 访问pod

```java
curl 10.244.2.5:80
```

### 删除pod

```java
kubectl delete pod nginx-64777cd554-fxvw5 -n dev
```

删除之后，再次查看pod，发现又产生了一个新的pod

这是因为当前Pod是由Pod控制器创建的，控制器会监控Pod状况，一旦发现Pod死亡，会立即重建

此时要想删除Pod，必须删除Pod控制器

先来查询一下当前namespace下的Pod控制器

```java
kubectl get deploy -n dev
```

接下来，删除此Pod的Pod控制器

```java
kubectl delete deployment nginx -n dev
```

稍等，再次查询 Pod ，发现Pod被删除了。

### 配置文件

创建一个配置文件pod-nginx.yaml

```java
apiVersion: v1
kind: Pod
metadata:
  name: nginx
  namespace: dev
spec: 
  containers: 
  - image: nginx:1.17.1
    imagePullPolicy: IfNotPresent
    name: pod
    ports: 
    - name: nginx-port
      containerPort: 80
      protocol: TCP
```

创建pod

```java
kubectl create -f pod-nginx.yaml
```

删除pod

```java
kubectl delete -f pod-nginx.yaml
```

> 采用yaml创建的pod是可以删除的

## 第三节 Label

### Label

Label 是kubernetes系统中的一个重要概念。它的作用就是在资源上添加标识，用来对它们进行区分和选择。

Label 的特点

- 一个Label 会以key/value键值对的形式附加到各种对象上，如Node，Pod，Service等
- 一个资源对象可以定义任意数量的Label，同一个Label也可以被添加到任意数量的资源对象上去
- Label 通常在资源对定义时确定，当然也可以在对象创建后动态添加或者删除

可以通过Label实现资源的多维度分组，以便灵活、方便地进行资源分配、调度、配置、部署等管理工作。

**一些常用的Label示例**

- 版本标签: ”version":“release”
- 环境标签: “environment”:“dev”，“environment”:“test”，“environment”:“pro”
- 架构标签: “tier":“frontend”，“tier”:“backend”

标签定义完毕之后，还要考虑到标签的选择，这就要使用到Label Selector ,即

Label 用于给某个资源对象定义标识

Label Selector 用于查询和筛选拥有某些标签的资源对象

当前有两种Label Selector

- 基于等式的Label Selector

name=slave 选择所有包含Label中key为name，且value为slave的对象

env!=production 选择所有包括了key为env，且value不为production的对象
- 基于集合的Label Selector

name in (master ,slave) 选择所有包含Label 中的key =name 且value为master或者slave的对象

name not in (frontend) 选择所有包含Label 中的key=name 且value 不等于frontend的对象

标签的选择条件可以使用多个，此时将多个Label Selector 进行组合，使用逗号","进行分割即可。例如

name=slave,env!=production

name not in (frontend),env!=production

### 命令方式

首先需要先创建一个pod

- 为pod资源打标签，可以增加多个标签

```java
kubectl label pod nginx-pod version=1.0 -n dev 
```

- 为pod资源更新标签

```java
kubectl label pod nginx-pod version=2.0 -n dev --overwrite
```

- 查看标签

```java
kubectl get nginx-pod -n dev --show-labels
```

- 筛选标签

```java
kubectl get pod -n dev -l version=2.0 --show-labels
kubectl get pod -n dev -l version!=2.0 --show-labels
```

这里我们再创建一个pod,名称为nginx2

- 删除标签

```java
kubectl label pod nginx  -n dev tier-
```

### 配置方式

```java
apiVersion: v1
kind: Pod
metadata:
  name: nginx
  namespace: dev
  labels:
    version: "1.0"
    env: "test"
spec: 
  containers: 
  - image: nginx:1.17.1
    imagePullPolicy: IfNotPresent
    name: pod
    ports: 
    - name: nginx-port
      containerPort: 80
      protocol: TCP
```

然后直接执行命令进行更新即可 kubectl apply -f xxx.yaml

## 第四节 Deployment

### Deployment

在kubernetes中，Pod是最小的控制单元，但是kubernetes很少直接控制Pod，一般都是通过Pod控制器来完成的。Pod控制器用于Pod的管理，确保Pod 资源符合预期的状态，当Pod的资源出现故障时，会尝试进行重启或重建Pod。

在kubernetes中Pod控制器的种类有很多，本章节只介绍Deployment

命令操作

```java
#命令格式 kubectl run deployment名称 [参数]
--image 指定pod的镜像
--port 指定端口
--replicase 指定创建pod数量
--namespace 指定namespace
 kubectl run nginx --image=nginx:1.17.1 --port=80 --replicas=3 --namespace=dev
```

查看创建的deployment和Pod

```java
kubectl get deployment,pods -n dev
```

查看详细的deployment

```java
kubectl describe deployment nginx -n dev
```

删除deployment

```java
kubectl delete deployment nginx -n dev
```

### 配置操作

创建一个deploy-nginx.yaml，内容如下

```java
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
  namespace: dev
spec:
  replicas: 3
  selector:
    matchLabels:
      run: nginx
  template:
    metadata:
      labels:
        run: nginx
    spec:
    containers:
      - image: nginx:1.17.1
        name: nginx
        ports:
          - containerPort: 80
            protocol: TCP
```

然后就可以执行对应的创建和删除命令了

```java
#创建
kubectl create -f deploy-nginx.yaml
```

```java
#删除
kubectl delete -f deploy-nginx.yaml
```

## 第五节 Service

虽然每个Pod都会分配一个独立的Pod IP，然而却存在如下两个问题

- Pod IP会随着Pod的重建产生变化
- Pod IP仅仅是集群内可见的虚拟IP，外部无法访问

这样对于访问这个服务带来了难度。因此kubernetes设计了Service来解决这个问题。

Service可以看作是一组同类Pod对外的访问接口。借助service，应用可以方便地实现服务发现和负载均衡。

很显然Pod的IP是不是固定的。

### 操作一： 创建集群内部可以访问的Service

```java
#暴露Service
kubectl expose deployment nginx --name=svc-nginx1 --type=ClusterIP --port=80 --target-port=80 -n dev
```

```java
#查看Service
kubectl get svc svc-nginx -n dev -o wide
```

这里我们使用的IP是ClusterIP，只能在集群内部才能访问，外部是不能访问的。

### 操作二： 创建集群外部也可以访问的Service

上面创建的Service的type类型为 ClusterIP，这个ip地址只用集群内部可访问

如果需要创建外部也可以访问的Service，需要修改type为NodePort

```java
kubectl expose deployment nginx --name=svc-nginx2 --type=NodePort --port=80 --target-port=80 -n dev
```

这样外部就可以访问到这个Service了。

http://192.168.88.100:32615/

### 删除Sevice

```java
kubectl delete svc svc-nginx1 -n dev
```

### 配置方式

创建一个svc-nginx.yaml，内容如下

```java
apiVersion: v1
kind: Service
metadata:
  name: svc-nginx
  namespace: dev
spec: 
  clusterIP: 10.102.145.115
  ports: 
  - port: 80
   protocol: TCP
   targetPort: 80
  selector: 
    run: nginx
  type: ClusterIP
```

创建

```java
kubectl create -f svc-nginx.yaml 
```

删除

```java
kubectl delete -f svc-nginx.yaml 
```
