# 08、Kubernetes - 实战：Pod 相关命令
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/7/8.html
- 分类：容器服务
- 分组：教程目录
## 一、环境安装

参考

[MiniKube方式部署](/zhuanlan/container/kubernetes/7/3.html)

[KubeAdm方式部署](/zhuanlan/container/kubernetes/7/4.html)

[Kind方式部署](/zhuanlan/container/kubernetes/7/5.html)

## 二、Pod概述

Pod是k8s系统中可以创建和管理的最小单元，是资源对象模型中由用户创建或部署的最小资源对象模型，也是在k8s上运行容器化应用的资源对象，其他的资源对象都是用来支撑或者扩展Pod对象功能的，比如控制器对象是用来管控Pod对象的，Service或者Ingress资源对象是用来暴露Pod引用对象的，PersistentVolume资源对象是用来为Pod提供存储等等，k8s不会直接处理容器，而是Pod,Pod是由一个或多个container组成。

pod和这豌豆类似，一个豌豆里很多个容器。

## 三、Pod详细

### 1、分类

通常把Pod分为两类：自主式Pod和控制器管理的Pod

**自主式Pod**

这种Pod本身是不能自我修复的，当Pod被创建后（不论是由你直接创建还是被其他controller)，都会被Kuberentes调度到集群的Node 上。直到pod的进程终止、被删掉、因为缺少资源而被驱逐、或者Node故障之前这个Pod都会一直保持在那个Node上。Pod不会自愈。如果Pod运行的Node故障，或者是调度器本身故障，这个Pod就会被删除。同样的，如果Pod所在Node缺少资源或者Pod处于维护状态，Pod也会被驱逐。

**控制器管理的Pod**

Kubernetes使用更高级的称为Controller的抽象层，来管理Pod实例。Controller可以创建和管理多个Pod，提供副本管理、滚动升级和集群级别的自愈能力。例如，如果一个Node故障，Controller就能自动将该节点上的Pod调度到其他健康的Node 上。虽然可以直接使用Pod,但是在Kubernetes中通常是使用Controller来管理Pod的。

### 2、pod的状态

pending：意思是已经创建了该pod，但是pod中一个或多个容器镜像还没有创建好

running：意思就是pod内所有容器创建好了，至少有一个处于运行状态

completed：就是pod内容器成功执行然后退出不会重启

failed：pod中容器都退出，且至少一个容器退出失败

unknown：就是某种原因无法获取pod状态

### 3、pod重启策略

always：容器失效，kubelet自动重启该容器

onfailure：容器不运行而且退出码不为0，kubelet自动重启

never：不管三七二十一，kubelet都不会重启

## 四、Pod操作

### 1、创建 Pod

--image：指定Pod的镜像

--port：指定端口

--namespace：指定namespace

```java
kubectl run nginx --image=nginx:1.17.1 --port=80 --namespace dev
```

### 2、查看 Pod 基本信息

```java
kubectl get pods -n dev
```

### 3、查看 Pod 详细信息

```java
kubectl get pods -n dev -o wide
```

### 4、删除指定 Pod

```java
kubectl delete pod nginx -n dev
```

### 5、yml 方式

编写yml

命名为：pod-nginx.yml

```java
apiVersion: v1
kind: Pod
metadata:
  name: nginx
  namespace: dev
spec:
  containers:
  - image: nginx:1.17.1
    name: pod
    ports:
    - name: nginx-port
      containerPort: 80
      protocol: TCP
```

### 5.1、创建

```java
kubectl create -f pod-nginx.yml
```

### 5.2、 删除

```java
kubectl delete -f pod-nginx.yml
```
