# 32、Kubernetes 实战 - kubeasz单主机模式
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/3/32.html
- 分类：容器服务
- 分组：教程目录
## 前言

有时候，我们只需要k8s集群进行项目测试，能够使用的主机可能只有一台，那么如何构建一台单机的k8s集群？

单机版的k8s集群可以用于本地测试，或者内部测试环境，或者个人电脑上的项目测试。

那么我们可以使用all-in-one模式安装一个单机的k8s集群。

官方地址：[单机快速体验k8s集群的测试环境–AllinOne部署](https://github.com/easzlab/kubeasz/blob/master/docs/setup/quickStart.md)

## AllinOne部署

### 1 . 服务器装备

准备一台虚机配置内存2G/硬盘30G以上

最小化安装Ubuntu 16.04 server或者CentOS 7

下面是实验准备的主机

类型
IP
系统信息
配置

master
192.168.88.222
Centos 7.9.2009
2核1G 50G磁盘

> k8s要求的最小核心数是2核，如果你的主机资源较少，可以分配2核2G100G磁盘，安装虚拟机后，磁盘不会立即占用100G，而是根据根据实际情况逐渐占用。

服务器的安装过程： 请见[vmware安装centos7并制作多副本](https://blog.csdn.net/u011628753/article/details/127126209)

或者也可以使用云服务商提供的服务器。

### 2. 下载文件

(1)下载工具脚本ezdown，举例使用kubeasz版本3.1.0

```java
export release=3.1.0
# 国外地址（由于网络原因，可能需要多次尝试才能下载成功）
curl -C- -fLO --retry 3 https://github.com/easzlab/kubeasz/releases/download/${release}/ezdown
# 国内地址 (国内下载地址，不会失败)
curl -C- -fLO --retry 3  https://github.91chi.fun//https://github.com/easzlab/kubeasz/releases/download/${release}/ezdown
# 修改文件的执行权限
chmod +x ezdown
```

(2)下载kubeasz代码、二进制、默认容器镜像

```java
# 国内环境
./ezdown -D
# 海外环境
#./ezdown -D -m standard
```

上述脚本运行成功后，所有文件（kubeasz代码、二进制、离线镜像）均已整理好放入目录/etc/kubeasz

- /etc/kubeasz 包含 kubeasz 版本为 `$`{release} 的发布代码
- /etc/kubeasz/bin 包含 k8s/etcd/docker/cni 等二进制文件
- /etc/kubeasz/down 包含集群安装时需要的离线容器镜像
- /etc/kubeasz/down/packages 包含集群安装时需要的系统基础软件

### 3. 安装集群

（1）容器化运行 kubeasz

```java
./ezdown -S
```

(2)使用默认配置安装 aio 集群

```java
docker exec -it kubeasz ezctl start-aio
# 如果安装失败，查看日志排除后，使用如下命令重新安装aio集群
# docker exec -it kubeasz ezctl setup default all
```

### 4. 验证安装

如果-bash: kubectl: command not found ，请重新打开客户端

```java
$ kubectl version         验证集群版本     
$ kubectl get node        验证节点就绪 (Ready) 状态
$ kubectl get pod -A      验证集群pod状态，默认已安装网络插件、coredns、metrics-server等
$ kubectl get svc -A      验证集群服务状态
```

### 5. pod部署测试

```java
# 创建namespace
kubectl create ns dev
# 部署一个nginx
kubectl run nginx --image=nginx:1.17.1 --port=80 --namespace=dev
# 测试访问nginx
curl 172.20.0.6:80
```

## kubernetes-dashboard

```java
# 修改kubernetes-dashboard的端口，这里我改成30443,也可以不该使用系统分配的端口
kubectl edit service/kubernetes-dashboard -n kube-system
```

## 传送门

[Kubernetes(29):Kubernetes Dashboard的使用](/zhuanlan/container/kubernetes/3/29.html)
