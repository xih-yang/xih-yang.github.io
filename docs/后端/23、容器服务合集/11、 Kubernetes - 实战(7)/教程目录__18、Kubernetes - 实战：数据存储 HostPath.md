# 18、Kubernetes - 实战：数据存储 HostPath
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/7/18.html
- 分类：容器服务
- 分组：教程目录
## 一、环境安装

参考

[MiniKube方式部署](/zhuanlan/container/kubernetes/7/3.html)

[KubeAdm方式部署](/zhuanlan/container/kubernetes/7/4.html)

[Kind方式部署](/zhuanlan/container/kubernetes/7/5.html)

## 二、HostPath介绍

`HostPath`就是将`Node`主机中一个实际目录挂载到`Pod`中，以供容器使用。

特点：

`Pod`销毁，但是数据依然可以存在于`Node`主机上。

## 三、HostPath使用

### 示例 yml

vimvolume-hostpath.yml

```java
apiVersion: v1
kind: Pod
metadata:
  name: volume-hostpath
  namespace: dev
spec:
  containers:
  - name: nginx
    image: nginx:1.17.1
    ports:
    - containerPort: 80
    volumeMounts:
    - name: logs-volume
      mountPath: /var/log/nginx
  - name: busybox
    image: busybox:1.30
    command: ["/bin/sh","-c","tail -f /logs/access.log"]
    volumeMounts:
    - name: logs-volume
      mountPath: /logs
  volumes:
  - name: logs-volume
    hostPath: 
      path: /root/logs
      type: DirectoryOrCreate  目录存在就使用，不存在就先创建后使用
```

`hostPath`的`type`说明：

- DirectoryOrCreate：目录存在就使用，不存在就先创建后使用
- Directory：目录必须存在
- FileOrCreate：文件存在就使用，不存在就先创建后使用
- File：文件必须存在
- Socket：Unix套接字必须存在
- CharDevice：字符设备必须存在
- BlockDevice：块设备必须存在

### 1 创建

```java
kubectl create -f  volume-hostpath.yml
```

### 2 查看

```java
kubectl get pods -n dev -o wide
```
