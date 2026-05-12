# 03、Kubernetes - 实战：MiniKube方式部署
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/7/3.html
- 分类：容器服务
- 分组：教程目录
## 当前配置环境

CentOS7： 7.9

IP：192.168.81.101

kubelet: v1.26.3

minikube: v1.29.0

kubernetes: v1.26.3

## 准备工作

### 1.关闭防火墙和SeLinux

```java
systemctl stop firewalld && systemctl disable firewalld
setenforce 0
sed -i 's/SELINUX=.*/SELINUX=disabled/g' /etc/sysconfig/selinux
```

### 2.禁用swap交换分区

```java
swapoff -a && sed -i 's/SELINUX=.*/SELINUX=disabled/g' /etc/sysconfig/selinux
```

## 三、Docker安装

### 1.配置docker源

```java
yum install -y wget
wget https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo -O /etc/yum.repos.d/docker-ce.repo
```

### 2.安装docker环境依赖

```java
yum install -y yum-utils device-mapper-persistent-data lvm2
```

### 3.安装docker

docker版本需要与Kubernetes版本能够兼容使用

```java
yum install docker-ce-18.09.9 docker-ce-cli-18.09.9 containerd.io -y
```

### 4.启动docker并设置为开机自启

```java
systemctl start docker && systemctl enable docker
```

### 5.配置镜像加速

### 这里使用的是我的阿里云镜像加速，可以自己去阿里云配置一个

```java
mkdir -p /etc/docker
tee /etc/docker/daemon.json <<-'EOF'
{
    "registry-mirrors": ["https://mxdu1aof.mirror.aliyuncs.com"],
    "exec-opts": ["native.cgroupdriver=systemd"]
}
EOF
```

### 6.重新启动守护进程并重启docker

```java
systemctl daemon-reload && systemctl restart docker
```

## 四、安装Kubectl 和 Minikube

### 1.卸载旧版本minikube(如果有的话)

```java
# 停止运行
minikube stop
# 执行卸载命令
minikube delete -all
docker stop (docker ps -aq)
rm -rf ~/.kube ~/.minikube
rm /usr/local/bin/localkube /usr/local/bin/minikube
systemctl stop '*kubelet*.mount'
rm -rf /etc/kubernetes/
docker system prune -af --volumes
```

卸载kubectl(如果有的话)

```java
rm -rf /usr/bin/kubectl
```

### 2.安装kubectl

下载最新版本kubectl

```java
curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl \
&& chmod +x ./kubectl
```

将kubectl二进制文件移至你的PATH中

```java
mv ./kubectl /usr/local/bin/kubectl
```

新建一个ssh终端，测试

```java
kubectl version --short
```

输出
Client Version: v1.26.3

Kustomize Version: v4.5.7

### 3.安装minikube

注意minikube版本需要>=1.23，早期版本的docker版ingress运行有bug

下载

```java
curl -Lo minikube https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64 \ 
&& chmod +x minikube
```

添加Minikube可执行文件到你的PATH中:

```java
cp minikube /usr/local/bin && rm minikube
```

测试

```java
minikube version
```

输出
minikube version: v1.29.0

commit: ddac20b4b34a9c8c857fc602203b6ba2679794d3

启动minikube

```java
minikube start --force --kubernetes-version=v1.23.8
```

启动成功！

### 4.测试

```java
kubectl get po -A
```
