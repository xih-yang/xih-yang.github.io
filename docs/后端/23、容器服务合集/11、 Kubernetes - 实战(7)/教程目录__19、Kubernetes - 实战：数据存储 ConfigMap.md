# 19、Kubernetes - 实战：数据存储 ConfigMap
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/7/19.html
- 分类：容器服务
- 分组：教程目录
## 一、环境安装

参考

[MiniKube方式部署](/zhuanlan/container/kubernetes/7/3.html)

[KubeAdm方式部署](/zhuanlan/container/kubernetes/7/4.html)

[Kind方式部署](/zhuanlan/container/kubernetes/7/5.html)

## 二、ConfigMap介绍

`ConfigMap`是一种比较特殊的存储卷，它的主要作用是用来存储配置信息的。

特点：

动态更新（定时更新），明文存储（`describe`可看到信息）

## 三、ConfigMap使用

### 示例 yml

#### ConfigMap

`vim configmap.yml`

```java
apiVersion: v1
kind: ConfigMap
metadata:
  name: configmap
  namespace: dev
data:
  info: |
    username:admin
    password:123456
```

#### Pod

`vim pod-configmap.yml`

```java
apiVersion: v1
kind: Pod
metadata:
  name: pod-configmap
  namespace: dev
spec:
  containers:
  - name: nginx
    image: nginx:1.17.1
    volumeMounts: 将 ConfigMap 挂载到目录
    - name: config
      mountPath: /configmap/config
  volumes: 引用 ConfigMap
  - name: config
    configMap:
      name: configmap
```

### 1 创建

```java
kubectl create -f  configmap.yml
kubectl create -f  pod-configmap.yml
```

### 2 查看ConfigMap

```java
kubectl describe cm configmap -n dev
```

### 3 查看Pod

```java
kubetl get po -n dev
```

### 4 查看ConfigMap内容

```java
-bash-4.2# kubectl exec -it pod-configmap -n dev -- /bin/sh
# cat /configmap/config/info
```

注意：

每个`ConfigMap`都映射成了一个目录，`key`--->文件，`value`---->文件中的内容，此时如果更新`ConfigMap`的内容，容器中的值也会动态更新。
