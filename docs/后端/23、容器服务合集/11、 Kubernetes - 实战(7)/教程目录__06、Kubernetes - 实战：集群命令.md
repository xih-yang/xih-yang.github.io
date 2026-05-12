# 06、Kubernetes - 实战：集群命令
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/7/6.html
- 分类：容器服务
- 分组：教程目录
## 一、环境安装

参考

[MiniKube方式部署](/zhuanlan/container/kubernetes/7/3.html)

[KubeAdm方式部署](/zhuanlan/container/kubernetes/7/4.html)

[Kind方式部署](/zhuanlan/container/kubernetes/7/5.html)

## 二、集群NameSpace命令

注意：以下命令基于用Kind方式部署的k8s

**获取集群名称**

```java
kind get clusters
```

**列出使用镜像**

```java
docker exec -it kind-control-plane crictl images
```

## 三、查看各组件和简写

### 1、Pod

```java
kubectl api-resources | egrep -w 'Pod|KIND'
```

### 2、Service

```java
kubectl api-resources | egrep -w 'Service|KIND'
```

### 3、Deployment

```java
kubectl api-resources | egrep -w 'Deployment|KIND'
```

### 4、DaemonSet

```java
kubectl api-resources | egrep -w 'DaemonSet|KIND'
```

### 5、Job

```java
kubectl api-resources | egrep -w 'Job|KIND'
```

### 6、CronJob

```java
kubectl api-resources | egrep -w 'CronJob|KIND'
```

### 7、所有

```java
#某命名空间下所有
kubectl get all -n dev
#全部命名空间下所有
kubectl get all -A
```
