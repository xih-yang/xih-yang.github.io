# 25、Kubernetes 实战 - 配置存储-configmap
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/3/25.html
- 分类：容器服务
- 分组：教程目录
## 配置存储

存储配置信息

## ConfigMap

ConfigMap是一种比较特殊的存储卷，它的主要作用是用来存储配置信息的。

创建configmap.yaml

```java
apiVersion: v1  版本号
kind: ConfigMap   类型
metadata:  元数据
  name: configmap   pod名称
  namespace: dev  所属命名空间
data:
  info: |
    username: admin
    password: 111111
```

使用此配置创建configmap

```java
# 创建configmap
[root@master ~]# kubectl create -f configmap.yaml 
configmap/configmap created
# 查看configmap详情
[root@master ~]# kubectl describe cm configmap -n dev
Name:         configmap
Namespace:    dev
Labels:       <none>
Annotations:  <none>
Data
====
info:
----
username: admin
password: 111111
Events:  <none>
```

如何使用configmap呢？

接下来创建一个pod-configmap.yaml文件，将前面创建的configmap挂载进去

```java
apiVersion: v1  版本号
kind: Pod   类型
metadata:  元数据
  name: pod-configmap  pod名称
  namespace: dev  所属命名空间
spec: 详情
  containers:
    - name: nginx
      image: nginx:1.17.1
      volumeMounts: 将configmap挂载到目录
        - name: config
          mountPath: /configmap/config
  volumes: 引用configmap
    - name: config
      configMap:
        name: configmap
```

```java
# 创建pod
[root@master ~]# kubectl create -f pod-configmap.yaml 
pod/pod-configmap created
# 查看pod
[root@master ~]# kubectl get pod pod-configmap -n dev
NAME            READY   STATUS    RESTARTS   AGE
pod-configmap   1/1     Running   0          11s
[root@master ~]# 
# 进入容器中，到/configmap/config路径下，会发现生成了一个info文件
[root@master ~]# kubectl exec -it pod-configmap -n dev /bin/sh
# cd /configmap/config
# ls
info
# cat info
username: admin
password: 111111
# exit
```

动态修改configmap的配置内容

```java
kubectl edit cm configmap -n dev
```

稍等以下，再次进入容器，可以看到内容变成了最新

```java
[root@master ~]# kubectl exec -it pod-configmap -n dev /bin/sh
# cd /configmap/config
# cat info
username: admin
password: 11111122222
# 
```
