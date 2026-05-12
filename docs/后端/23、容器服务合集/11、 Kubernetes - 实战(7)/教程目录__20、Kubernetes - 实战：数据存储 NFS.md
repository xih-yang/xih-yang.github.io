# 20、Kubernetes - 实战：数据存储 NFS
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/7/20.html
- 分类：容器服务
- 分组：教程目录
## 一、环境安装

参考

[MiniKube方式部署](/zhuanlan/container/kubernetes/7/3.html)

[KubeAdm方式部署](/zhuanlan/container/kubernetes/7/4.html)

[Kind方式部署](/zhuanlan/container/kubernetes/7/5.html)

## 二、NFS介绍

`HostPath`可以解决数据持久化的问题，但是一旦`Node`节点故障了，`Pod`如果转移到了别的节点，又会出现问题了，此时需要准备单独的网络存储系统，比较常用的用`NFS`、`CIFS`。

`NFS`是一个网络文件存储系统，可以搭建一台`NFS`服务器，然后将`Pod`中的存储直接连接到`NFS`系统上。

特点：

无论`Pod`在节点上怎么转移，只要`Node`跟`NFS`的对接没问题，数据就可以成功访问。

## 三、NFS使用准备

1安装NFS

```java
yum install nfs-utils -y
```

2创建共享目录

```java
mkdir -p /root/data/nfs
```

3将共享目录以读写权限暴露给特定网段中的所有主机

```java
vim /etc/exports
#添加内容
/root/data/nfs 172.30.1.0/24(rw,no_root_squash)
```

4启动`NFS`服务

```java
systemctl start nfs
```

5其他`Node`节点（`Linux`服务器）只需要安装`nfs`即可，无需启动服务。

```java
yum install nfs-utils -y
```

## 四、NFS使用实例

### 示例 yml

vimvolume-nfs.yml

```java
apiVersion: v1
kind: Pod
metadata:
  name: volume-nfs
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
    nfs:
      server: 172.30.1.100  NFS 服务器地址
      path: /root/data/nfs 共享文件路径
```

`nfs`的`server`说明：

在`/etc/exports`配置的是网络地址（最后一个`Bit`是`0`），而`server`配置的是服务器的`IP`地址。

### 1 创建NFS

```java
kubectl create -f volume-nfs.yml
```

### 2 查看 Pod

```java
kubectl get pods -n dev -o wide
```

### 3 查看共享目录

```java
ll /root/data/nfs/
```
