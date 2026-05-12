# 17、Kubernetes - 实战：据存储 EmptyDir
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/7/17.html
- 分类：容器服务
- 分组：教程目录
## 一、环境安装

参考

[MiniKube方式部署](/zhuanlan/container/kubernetes/7/3.html)

[KubeAdm方式部署](/zhuanlan/container/kubernetes/7/4.html)

[Kind方式部署](/zhuanlan/container/kubernetes/7/5.html)

## 二、EmptyDir介绍

`EmptyDir`是最基础的`Volume`类型，一个`EmptyDir`就是宿主机上的一个空目录。

`EmptyDir`是在`Pod`被分配到`Node`时创建的，它的初始内容为空，并且无须指定宿主机上对应的目录文件，`Kubernetes`会自动分配一个目录，当`Pod`销毁时，`EmptyDir`中的数据也会被永久删除。

特点：

- 临时空间，例如用于某些应用程序运行时所需的临时目录，且无须永久保留。
- 一个容器需要从另一个容器中获取数据的目录（多容器共享目录）。

## 三、EmptyDir使用

### 示例 yml

vivolume-emptydir.yml

```java
apiVersion: v1
kind: Pod
metadata:
  name: volume-emptydir
  namespace: dev
spec:
  containers:
  - name: nginx
    image: nginx:1.17.1
    ports:
    - containerPort: 80
    volumeMounts:  将 logs-volume 挂在到 Nginx 容器中，对应的目录为 /var/log/nginx
    - name: logs-volume
      mountPath: /var/log/nginx
  - name: busybox
    image: busybox:1.30
    command: ["/bin/sh","-c","tail -f /logs/access.log"] 初始命令，动态读取指定文件中内容
    volumeMounts:  将 logs-volume 挂在到 busybox 容器中，对应的目录为 /logs
    - name: logs-volume
      mountPath: /logs
  volumes: 声明 volume，name 为 logs-volume，类型为 EmptyDir
  - name: logs-volume
    emptyDir: {} 必须加 {}
```

### 1 创建

```java
kubectl create -f volume-emptydir.yml
```

### 2 查看

```java
kubectl get pods -n dev -o wide
```
