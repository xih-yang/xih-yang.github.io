# 05、Kubernetes - 实战：Kind方式部署Kubernetes
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/7/5.html
- 分类：容器服务
- 分组：教程目录
## 一、安装kind

操作系统环境

CentOS Linux release 7.6.1810 (Core)

**1、下载二进制文件**

```java
curl -k -Lo ./kind https://kind.sigs.k8s.io/dl/v0.14.0/kind-linux-amd64
```

**2、添加可执行权限**

```java
chmod +x ./kind
```

**3、移动至系统环境**

```java
mv./kind /usr/bin/kind
```

## 二、安装kubectl

**1、下载二进制文件**

```java
curl -k -LO "https://dl.k8s.io/release/$(curl -k -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
```

**2、添加可执行权限**

```java
chmod +x ./kubectl
```

**3、移动至系统环境**

```java
mv./kubectl /usr/bin/kubectl
```

## 三、创建 Kubernetes

**1、创建集群**

kind create cluster

输出

```java
localhost:~\# kind create cluster  
Creating cluster "kind" ...  
✓Ensuring node image (kindest/node:v1.24.0) 🖼  
✓Preparing nodes 📦  
✓Writing configuration 📜  
✓Starting control-plane 🕹️  
✓Installing CNI 🔌  
✓Installing StorageClass 💾  
Setkubectl context to "kind-kind"  
Youcan now use your cluster with:
kubectl cluster-info --context kind-kind
```

**2、卸载 Kubernetes**

kind delete cluster

**3、获取集群名称**

kind get clusters

**4、列出使用镜像**

docker exec -it kind-control-plane crictl images

输出

```java
IMAGE TAG IMAGE ID SIZE  
docker.io/kindest/kindnetd v20220510-4929dd75 6fb66cd78abfe 45.2MB  
docker.io/kindest/local-path-helper v20220512-507ff70b 64623e9d887d3 2.86MB  
docker.io/kindest/local-path-provisioner v0.0.22-kind.0 4c1e997385b8f 17.4MB  
k8s.gcr.io/coredns/coredns v1.8.6 a4ca41631cc7a 13.6MB  
k8s.gcr.io/etcd 3.5.3-0 aebe758cef4cd 102MB  
k8s.gcr.io/kube-apiserver v1.24.0 9ef4b1de3be49 77.3MB  
k8s.gcr.io/kube-controller-manager v1.24.0 efa8a439d1460 65.6MB  
k8s.gcr.io/kube-proxy v1.24.0 6960c0e47829d 112MB  
k8s.gcr.io/kube-scheduler v1.24.0 41f5241e3396e 52.3MB  
k8s.gcr.io/pause 3.6 6270bb605e12e 302kB
```

**官方文档：**

https://kind.sigs.k8s.io/

https://github.com/kubernetes-sigs/kind
