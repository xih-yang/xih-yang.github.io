# 23、Kubernetes 实战 - 数据存储-基本存储
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/3/23.html
- 分类：容器服务
- 分组：教程目录
## 前言

## 第一节 数据存储

容器的声明周期可能很短，会频繁地创建和销毁。那么容器在销毁时，保存在容器中的数据也会被清除。这种结果对于用户来说，在某些情况下是不可容忍的。为了持久化保存容器的数据，kubernetes引入了Volume的概念。

Volume是Pod中能够被多个容器访问的共享目录，它被定义在Pod上，然后被一个Pod里的多个容器挂载到具体的文件目录下，kubernetes通过Volume实现同一个Pod中不同容器之间的数据共享以及数据的持久化存储。

Volume的生命周期不与Pod中单个容器的生命周期相关，当容器终止或者重启时，Volume中的数据也不会丢失。

kubernetes的Volume支持多种类型，比较常见的有一下:

- 简单存储：EmptyDir、HostPath、NFS
- 高级存储：PV、PVC
- 配置存储：ConfigMap、Secret

## 第二节 基础存储

### 1. EmptyDir

EmptyDir是最基础的Volume类型，一个EmptyDir就是Host的一个空目录。

EmptyDir是在pod被分配到Note时创建的，它的初始内容为空，并且无需指定宿主机上对应的目录文件，因为kubernetes会自动分配一个目录，当 Pod销毁时，EmptyDir中的数据也被永久删除。 Empty用途如下:

- 临时空间，例如用于某些应用程序运行时所需要的临时目录，且无须永久保留
- 一个容器需要从另一个容器中获取数据的目录(多容器共享目录)

接下来，通过一个容器之间文件共享的案例来使用一下EmptyDir。

在一个Pod中准备两个容器nginx和busybox，然后声明一个Volume分别挂载到两个容器的目录上，然后nginx容器负责向Volume中写日志，busybox中通过命令将日志内容读到控制台。

创建一个volume-emptydir.yaml

```java
apiVersion: v1  版本号
kind: Pod   类型
metadata:  元数据
  name: volume-emptydir   pod名称
  namespace: dev  所属命名空间
spec: 详情
  containers:
    - name: nginx
      image: nginx:1.17.1
      ports:
        - containerPort: 80
      volumeMounts: 将log-volume挂载到nginx容器中，对应的目录为/var/log/nginx
        - name: logs-volume
          mountPath: /var/log/nginx
    - name: busybox
      image: busybox:1.30
      command: ["/bin/sh","-c","tail -f /logs/access.log"]初始化命令，动态读取指定文件中内容
      volumeMounts: 将log-volume 挂在到busybox容器中，对应的目录为 /logs
        - name: logs-volume
          mountPath: /logs
  volumes: 声明volume, name为log-volume，类型为emptyDir
      - name: logs-volume
        emptyDir: {
     } {}不能省略，固定写法
```

```java
# 创建pod
[root@master ~]# kubectl create -f volume-emptydir.yaml 
pod/volume-emptydir created
# 查看pod
[root@master ~]# kubectl get pod volume-emptydir -n dev -o wide
NAME              READY   STATUS    RESTARTS   AGE     IP             NODE    NOMINATED N
volume-emptydir   2/2     Running   0          7m31s   10.244.2.202   node2   <none> 
```

**测试**

```java
# 新开窗口，查看busybox容器命令输出
kubectl logs -f volume-emptydir -n dev -c busybox
```

```java
# 访问nginx
curl 10.244.2.202:80
```

### 2. HostPath

EmptyDir中数据不会被持久化，它会随着Pod的结束而销毁，如果想简单的将数据持久化到主机中，可以选择HostPath。

HostPath就是将Node主机中一个实际目录挂载到Pod中，以供容器使用，这样的设计就可以保证Pod销毁，但是数据依然可以存在于Node主机上。

创建volume-hostpath.yaml

```java
apiVersion: v1  版本号
kind: Pod   类型
metadata:  元数据
  name: volume-hostpath   pod名称
  namespace: dev  所属命名空间
spec: 详情
  containers:
    - name: nginx
      image: nginx:1.17.1
      ports:
        - containerPort: 80
      volumeMounts: 将log-volume挂载到nginx容器中，对应的目录为/var/log/nginx
        - name: logs-volume
          mountPath: /var/log/nginx
    - name: busybox
      image: busybox:1.30
      command: ["/bin/sh","-c","tail -f /logs/access.log"]初始化命令，动态读取指定文件中内容
      volumeMounts: 将log-volume 挂在到busybox容器中，对应的目录为 /logs
        - name: logs-volume
          mountPath: /logs
  volumes: 声明volume, name为log-volume，类型为emptyDir
      - name: logs-volume
        hostPath:
          path: /root/logs
          type: DirectoryOrCreate目录存在就使用，不存在就先创建后使用
```

> type的解释
>
> DirectoryOrCreate : 目录存在就使用，不存在就先创建后使用
>
> Directory: 目录必须存在
>
> FileOrCreate: 文件存在就使用，不存在就先创建后使用
>
> File : 文件必须存在
>
> Socket: unix套接字必须存在
>
> CharDevice: 字符设备必须存在
>
> BlockDevice: 块设备必须存在

```java
# 创建pod
[root@master ~]# kubectl create -f volume-hostpath.yaml 
pod/volume-hostpath created
# 查看pod,可以看到pod部署在了node1节点，打开node1节点查看，并执行curl请求nginx，可以看到access.log的日志
[root@master ~]# kubectl get pod volume-hostpath -n dev -o wide
NAME              READY   STATUS    RESTARTS   AGE   IP             NODE    NOMINATED NOD
volume-hostpath   2/2     Running   0          34s   10.244.1.119   node1   <none>  
# 请求nginx 
[root@master ~]# curl 10.244.1.119:80
```

此时，删除pod，再次查看access.log，文件依然还在。

```java
[root@master ~]# kubectl delete -f volume-hostpath.yaml 
pod "volume-hostpath" deleted
```

### 3. NFS

HostPath可以解决数据持久化的问题，但是一旦Node节点故障了，Pod如果转移到了别的节点，又会出现问题了，此时需要准备单独的网络存储系统，比如常用的NFS、CIFS。

NFS是一个网络文件存储系统，可以搭建一台NFS服务器，然后将Pod中的存储指甲连接到NFS系统上，这样的话，无论Pod在节点上怎么转移，只要Node跟NFS的对接没问题，数据就可以成功访问。

#### 3.1 搭建NFS服务

**1、** 首先要准备nfs的服务器，这里是集群同网段内的一台服务器；

```java
# 在一台新的服务器(这里是192.168.88.199)上安装nfs
[root@node199 ~]# yum -y install nfs-utils
已加载插件：fastestmirror, langpacks
....
# 准备一个共享目录
[root@node199 ~]# mkdir /root/data/nfs -pv
mkdir: 已创建目录 "/root/data"
mkdir: 已创建目录 "/root/data/nfs"
# 将共享目录以读写权限暴露给集群的网段(这里是192.168.88.0/24)所有的主机
[root@node199 ~]# vim /etc/exports
[root@node199 ~]# cat /etc/exports
/root/data/nfs     192.168.88.0/24(rw,no_root_squash)
# 启动nfs服务
[root@node199 ~]# systemctl restart nfs
# 关闭防火墙，如果不关闭防火墙，其它节点将无法访问
systemctl stop firewalld
systemctl disable firealld
```

> rw: 可读可写
>
> no_root_squash: 不需要root权限

#### 3.2 安装nfs驱动

要在每个node节点上都安装nfs，这样的目的是为了node节点可以驱动nfs设备

```java
[root@node1 ~]# yum -y install nfs-utils
已加载插件：fastestmirror, langpacks
....
```

#### 3.3 创建nfs存储卷

创建volume-nfs.yaml

```java
apiVersion: v1  版本号
kind: Pod   类型
metadata:  元数据
  name: volume-nfs   pod名称
  namespace: dev  所属命名空间
spec: 详情
  containers:
    - name: nginx
      image: nginx:1.17.1
      ports:
        - containerPort: 80
      volumeMounts: 将log-volume挂载到nginx容器中，对应的目录为/var/log/nginx
        - name: logs-volume
          mountPath: /var/log/nginx
    - name: busybox
      image: busybox:1.30
      command: ["/bin/sh","-c","tail -f /logs/access.log"]初始化命令，动态读取指定文件中内容
      volumeMounts: 将log-volume 挂在到busybox容器中，对应的目录为 /logs
        - name: logs-volume
          mountPath: /logs
  volumes: 声明volume, name为log-volume，类型为emptyDir
    - name: logs-volume
      nfs:
        server: 192.168.88.199 nfs服务器地址
        path: /root/data/nfs  共享文件路径
```

运行pod

```java
# 运行pod
[root@master ~]# kubectl create -f volume-nfs.yaml 
pod/volume-nfs created
[root@master ~]# kubectl get pod volume-nfs -n dev -o wide
NAME         READY   STATUS    RESTARTS   AGE     IP             NODE    NOMINATED NODE   READINESS GATES
# 查看pod
[root@master ~]# kubectl get pod volume-nfs -n dev -o wide
NAME         READY   STATUS    RESTARTS   AGE     IP             NODE    NOMINATED NODE   READINESS GATES
volume-nfs   2/2     Running   0          3m16s   10.244.1.121   node1   <none>           <none>
```

在启动pod之后，打开nfs服务器，tail -f access.log实时查看日志，并请求nginx服务器，curl 10.244.1.121:80，可以看到nfs服务器有日志输出。
