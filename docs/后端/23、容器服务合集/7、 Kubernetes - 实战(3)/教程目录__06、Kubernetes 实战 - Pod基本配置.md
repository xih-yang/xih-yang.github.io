# 06、Kubernetes 实战 - Pod基本配置
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/3/6.html
- 分类：容器服务
- 分组：教程目录
## 前言

Pod基本配置

## Pod配置

pod.spec.containers属性，这是Pod配置中最为关键的一项配置。

```java
[root@master ~]# kubectl explain pod.spec.containers
KIND:     Pod
VERSION:  v1
RESOURCE: containers <[]Object># 数组，代表可以有多个容器
FIELDS:
   name  <string>              容器名称
   image <string>              容器需要的镜像地址
   imagePullPolicy  <string>   镜像拉取策略 
   command  <[]string>         容器的启动命令列表，如不指定，使用打包时使用的启动命令
   args     <[]string>         容器的启动命令需要的参数列表
   env      <[]Object>         容器环境变量的配置
   ports    <[]Object>         容器需要暴露的端口号列表
   resources <Object>          资源限制和资源请求的设置
```

## 基本配置

创建pod-base.yaml文件，内容如下

```java
apiVersion: v1
kind: Pod
metadata:
  name: pod-base
  namespace: dev
  labels:
    user: xiaowang
spec:
  containers:
    - name: nginx
      image: nginx:1.17.1
    - name: busybox
      image: busybox:1.30
```

上面定义了一个比较简单Pod的配置，里面有两个容器

- nginx: 用1.17.1版本的nginx镜像创建（nginx是一个轻量级的web容器）
- busybox: 用1.30版本的busybox镜像创建(busybox是一个小巧的linux命令集合)

执行命令创建pod，这个pod中有两个容器，ready一直是1/2，并且重试了多次。

```java
kubectl create -f pod-base.yaml 
```

查看详细信息，可以看到busybox拉取成功，但是启动失败。

```java
kubectl describe pods pod-base -n dev
```
