# 08、Kubernetes - 实战：从源代码构建Kubernetes RPM包
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/4/8.html
- 分类：容器服务
- 分组：教程目录
## 一、前言

从源代码构建Kubernetes的RPM可以帮助我们随时测试新的功能并且进行深度的debug。

## 二、准备工作

安装go依赖

```java
yum install epel-release -y
yum update -y && yum upgrade -y
yum install golang go-md2man go-bindata gcc bison git rpm-build vim -y
bash < <(curl -s -S -L https://raw.githubusercontent.com/moovweb/gvm/master/binscripts/gvm-installer)
source /root/.gvm/scripts/gvm
gvm install go1.4 -B
gvm use go1.4
gvm install go1.11.1
gvm use go1.11
```

安装docker

```java
yum install -y docker
systemctl enable docker
systemctl start docker
```

## 三、获取构建环境和进行构建

### 3.1 获取Fedora发布的Kubernetes构建工具仓库

> git clone https://src.fedoraproject.org/cgit/rpms/kubernetes.git
>
> kubernetes.spec
>
> ...
>
> %global provider github
>
> %global provider_tld com
>
> %global project kubernetes
>
> %global repo kubernetes
>
> # https://github.com/kubernetes/kubernetes
>
> %global provider_prefix %{provider}.%{provider_tld}/%{project}/%{repo}
>
> %global import_path k8s.io/kubernetes
>
> %global commit 2bba0127d85d5a46ab4b778548be28623b32d0b0
>
> %global shortcommit %(c=%{commit}; echo ${c:0:7})
>
> %global con_provider github
>
> %global con_provider_tld com
>
> %global con_project kubernetes
>
> %global con_repo contrib
>
> # https://github.com/kubernetes/contrib
>
> %global con_provider_prefix %{con_provider}.%{con_provider_tld}/%{con_project}/%{con_repo}
>
> %global con_commit 5b445f1c53aa8d6457523526340077935f62e691
>
> %global con_shortcommit %(c=%{con_commit}; echo ${c:0:7})
>
> %global kube_version 1.10.3
>
> %global kube_git_version v%{kube_version}
>
> ...

从spec 文件可以看到构建过程依赖 kubernetes 主仓库和 contrib 仓库，根据这个版本所依赖kubernetes的commit id，可以从github找到对于的commit

```java
https://github.com/kubernetes/kubernetes/commit/2bba0127d85d5a46ab4b778548be28623b32d0b0
```

### 3.2 获取源代码

```java
https://github.com/kubernetes/kubernetes/archive/2bba0127d85d5a46ab4b778548be28623b32d0b0/kubernetes-2bba012.tar.gz
https://github.com/kubernetes//contrib/archive/5b445f1c53aa8d6457523526340077935f62e691/contrib-5b445f1.tar.gz
```

### 3.3 构建RPM

```java
mkdir -p /root/rpmbuild/SOURCES/
mv ~/kubernetes/* /root/rpmbuild/SOURCES/
cd /root/rpmbuild/SOURCES/
rpmbuild -ba kubernetes.spec
```

### 3.4 查看构建结果

```java
[root@k8s-tools SOURCES]# ls -l ../RPMS/x86_64/
total 145348
-rw-r--r--. 1 root root    41872 Oct 30 04:56 kubernetes-1.10.3-1.el7.x86_64.rpm
-rw-r--r--. 1 root root 28983340 Oct 30 04:58 kubernetes-client-1.10.3-1.el7.x86_64.rpm
-rw-r--r--. 1 root root 20025212 Oct 30 04:58 kubernetes-kubeadm-1.10.3-1.el7.x86_64.rpm
-rw-r--r--. 1 root root 49244240 Oct 30 04:57 kubernetes-master-1.10.3-1.el7.x86_64.rpm
-rw-r--r--. 1 root root 28641836 Oct 30 04:57 kubernetes-node-1.10.3-1.el7.x86_64.rpm
-rw-r--r--. 1 root root 21887636 Oct 30 04:57 kubernetes-unit-test-1.10.3-1.el7.x86_64.rpm
```
