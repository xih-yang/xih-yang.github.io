# 07、Kubernetes - 实战：命名空间NameSpace
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/7/7.html
- 分类：容器服务
- 分组：教程目录
## 一、环境安装

参考

[MiniKube方式部署](/zhuanlan/container/kubernetes/7/3.html)

[KubeAdm方式部署](/zhuanlan/container/kubernetes/7/4.html)

[Kind方式部署](/zhuanlan/container/kubernetes/7/5.html)

## 二、NameSpace作用

多套环境的资源隔离或者多租户的资源隔离。

结合资源配额机制，限定不同租户能占用的资源，例如CPU使用量、内存使用量等，实现租户可用资源的管理。

### 1、查看命名空间

namespace可简写为ns

```java
kubectl get namespace
```

输出：

### 2、创建命名空间

```java
kubectl create ns dev
```

### 3、查看描述信息

```java
kubectl describe ns dev
```

输出：

### 4、删除命名空间

```java
kubectl delete ns dev
```

### 5、通过yml 方式

编写yml

命名为：ns-dev.yml

```java
apiVersion: v1
kind: Namespace
metadata:
  name: dev
```

#### 1）创建

```java
kubectl create -f ns-dev.yml
```

####

2）删除

```java
kubectl delete -f ns-dev.yml
```

**PS:**

**1）删除一个namespace会自动删除所有属于该namespace的资源**

**2）default 和 kube-system 命名空间不可删除。**

**3）PersistentVolumes是不属于任何namespace的，但PersistentVolumeClaim是属于 某个特定namespace的。**

**4）Events是否属于namespace取决于产生events的对象**
