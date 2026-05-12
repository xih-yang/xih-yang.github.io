# 20、Kubernetes - 实战：Kubernetes资源管理Volume
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/8/20.html
- 分类：容器服务
- 分组：教程目录
## Kubernetes Volume本地数据卷

Container（容器）中的磁盘文件是短暂的，当容器崩溃时，kubelet会重启容器，但最初的文件将丢失，Container会以最干净的状态启动。另外，当一个pod运行多个Container时，各个容器可能需要共享一些文件，Kubernetes Volume可以解决两个问题。

一些需要持久化数据的程序才会用到Volumme，或一些需要共享数据的容器需要Volume。

**emptyDir**

如果删除Pod，emptyDir卷中的数据也将会被删除，一般emptyDir卷中的数据也将会被删除，一般emptyDir卷用于Pod中的不同Container共享数据。它可以被挂载到相同或不同的路径上。

默认情况下，emptyDir卷支持节点上的任何介质，可能是SSD、磁盘或网络存储，具体取决于自身的环境。![image]

- 当Pod分配到Node时，首先创建一个空卷，并挂载到Pod中的容器。
- Pod中的容器可以读取和写入卷中的文件。
- 当Pod从节点中删除emptyDir时，该数据也会被删除。
- 注：适用于容器之间的数据共享。

**hostPath**

hostPath卷可将节点上的文件或目录挂载到Pod上，用于Pod自定义日志输出或访问Docker内部的容器。

使用hostPath卷示例。将主机的/data目录挂载到Pod的/test-pd目录。

- 一个hostPath卷挂载Node文件系统上的文件或目录到Pod中的容器。
- 注：指定宿主级的数据目录挂载到容器中。

## 一、创建emptydir实例

### 1、管理节点：创建yaml文件

```java
# vim emptydir.yaml
apiVersion: v1
kind: Pod
metadata:
  name: test-pd
spec:
  containers:
  - image: nginx:1.12
    name: test-container
    volumeMounts:
    - mountPath: /cache
      name: cache-volume
  volumes:
  - name: cache-volume
    emptyDir: {}
```

```java
文件注释
# api版本
apiVersion: v1
# 指定创建资源对象
kind: Pod
# 源数据、可以写name，命名空间，对象标签
metadata:
# 服务名称
  name: test-pd
# 容器资源信息
spec:
# 容器管理
  containers:
# 镜像名称
  - image: nginx:1.12
# 容器名称
    name: test-container
# 容器数据卷管理
    volumeMounts:
# 容器内挂载目录
    - mountPath: /cache
# 容器挂载数据名称
      name: cache-volume
# 宿主数据卷管理
  volumes:
# 创建数据卷名称
  - name: cache-volume
# emptydir标准语法
    emptyDir: {}
```

### 2、管理节点：创建pod

```java
kubectl create -f emptydir.yaml
```

### 3、测试

```java
命令：kubectl exec test-pd -it bash
root@test-pd:/# cd /cache/
root@test-pd:/cache# ls
root@test-pd:/cache#
```

### 4、查看容器挂载信息

```java
命令：kubectl describe pods test-pd
Mounts:
      /cache from cache-volume (rw)
Conditions:
  Type           Status
  Initialized    True 
  Ready          True 
  PodScheduled   True 
Volumes:
  cache-volume:
    Type:        EmptyDir (a temporary directory that shares a pod's lifetime)
    Medium:
QoS Class:       BestEffort
Node-Selectors:  <none>
Tolerations:     <none>
```

## 二、创建hostPath实例

### 1、管理节点：创建yaml文件

```java
apiVersion: v1
kind: Pod
metadata:
  name: test-pd2
spec:
  containers:
  - image: nginx:1.12
    name: test-container
    volumeMounts:
    - mountPath: /data
      name: test-volume
  volumes:
  - name: test-volume
    hostPath:
      path: /etc/default
      type: Directory
```

```java
# api版本
apiVersion: v1
# 指定创建资源对象
kind: Pod
# 源数据、可以写name，命名空间，对象标签
metadata:
# 服务名称
  name: test-pd2
# 容器资源信息
spec:
# 容器管理
  containers:
# 镜像名称
  - image: nginx:1.12
    name: test-container
# 容器数据卷管理
    volumeMounts:
# 容器挂载目录
    - mountPath: /data
# 容器挂载数据名称
      name: test-volume
# 宿主数据卷管理
  volumes:
# 创建数据卷名称
  - name: test-volume
# 数据卷地址
    hostPath:
# 挂载到容器的宿主目录
      path: /etc/default
# 类型为目录文件
      type: Directory
```

### 2、管理节点：创建pod

```java
kubectl create -f hostpath.yaml
```

### 3、测试

```java
命令：kubectl exec test-pd2 -it bash
root@test-pd2:/# cd /data
root@test-pd2:/data# ls
grub  nss  useradd  yyy
```

## KubernetesVolume网络数据卷

由于支持网络数据卷众多 今天只拿nfs作为案例。

支持网络数据卷

- nfs
- iscsi
- glusterfs
- awsElasticBlockStore
- cephfs
- azureFileVolume
- azureDiskVolume
- vsphereVolume
- .....

## 一、搭建NFS服务与客户端

### 1、管理节点：安装nfs服务端、配置nfs主配置文件、添加权限、启动

```java
yum install nfs-utils -y
vim /etc/exports
# 添加目录给相应网段访问并添加读写权限
/data 192.168.1.0/24(insecure,rw,async,no_root_squash)
# 创建共享目录，添加权限
mkdir -p /data
chmod 777 /data
# 开启rpc服务
systemctl start rpcbind
# 启动服务并设置开机自启
systemctl start nfs
2、工作节点：安装nfs客户端、启动服务
yum install nfs-utils -y
# 开启rpc服务
systemctl start rpcbind
# 启动服务并设置开机自启
systemctl start nfs
```

## 二、共享NFS网络数据卷

### 1、管理节点：创建yaml文件

```java
# vim nginx-nfs.yaml
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: nginx-deployment-nfs
spec:
  replicas: 3
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.10
        volumeMounts:
        - name: wwwroot
          mountPath: /var/www/html
        ports:
        - containerPort: 80
      volumes:
      - name: 
        nfs:
          server: 192.168.1.79
          path: /data
```

```java
文件注释
# 指定api版本
apiVersion: extensions/v1beta1
# 指定需要创建的资源对象
kind: Deployment
# 源数据、可以写name，命名空间，对象标签
metadata:
# 指定对象名称
  name: nginx-deployment2-nfs
# 描述资源相关信息
spec:
# 指定pod 副本数，默认1
  replicas: 3
# 描述资源具体信息
  template:
# 匹配标签字段
    metadata:
# 指定pod标签value:key
      labels:
# 标签名
        app: nginx
# 管理容器
    spec:
# 指定容器信息
      containers:
# 指定容器名称
      - name: nginx
# 指定镜像名称
        image: nginx:1.10
# 网络数据卷管理
        volumeMounts:
# 数据卷名称
        - name: wwwroot
# 容器数据卷挂载路径
          mountPath: /var/www/html
# 端口管理
        ports:
# 暴露端口
        - containerPort: 80
# 网络共享数据卷管理
      volumes:
# 数据卷名称两边需要相同
      - name: wwwroot
# 数据卷类型为nfs
        nfs:
# NFS服务器地址
          server: 192.168.1.79
# 服务端共享路径
          path: /data
```

### 2、管理节点：创建Deployment

```java
kubectl create -f nginx-nfs.yaml
```

查看创建状态

```java
命令：kubectl get pods -o wide
NAME                                    READY     STATUS    RESTARTS   AGE       IP            NODE
nginx-deployment-nfs-5fbcddddb6-7btt4   1/1       Running   0          55s       172.17.2.11   192.168.1.78
nginx-deployment-nfs-5fbcddddb6-sf6bz   1/1       Running   0          55s       172.17.2.10   192.168.1.78
nginx-deployment-nfs-5fbcddddb6-ws8wk   1/1       Running   0          55s       172.17.1.9    192.168.1.77
```

查看详细信息

```java
命令：kubectl describe nginx-deployment-nfs-5fbcddddb6-sf6bz
Mounts:
      /var/www/html from wwwroot (rw)
Conditions:
  Type           Status
  Initialized    True 
  Ready          True 
  PodScheduled   True 
Volumes:
  wwwroot:
    Type:        NFS (an NFS mount that lasts the lifetime of a pod)
    Server:      192.168.1.79
    Path:        /data
    ReadOnly:    false
QoS Class:       BestEffort
Node-Selectors:  <none>
Tolerations:     <none>
reated container
```

### 3、测试

```java
# 1、宿主端nfs共享文件内创建文件
命令：touch /data/123
# 2、进入容器内查看文件是否共享
命令：kubectl exec nginx-deployment-nfs-5fbcddddb6-sf6bz -it bash
root@nginx-deployment-nfs-5fbcddddb6-sf6bz:/# ls /var/www/html/
123
```
