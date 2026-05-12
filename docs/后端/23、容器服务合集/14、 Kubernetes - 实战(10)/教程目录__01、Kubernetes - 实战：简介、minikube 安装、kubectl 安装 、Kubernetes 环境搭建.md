# 01、Kubernetes - 实战：简介、minikube 安装、kubectl 安装 、Kubernetes 环境搭建
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/10/1.html
- 分类：容器服务
- 分组：教程目录
实验参考：[https://github.com/chronolaw/k8s_study](https://github.com/chronolaw/k8s_study)

`Kubernetes` 的官网（[https://kubernetes.io/zh-cn/](https://kubernetes.io/zh-cn/)），里面有非常详细的文档，包括概念解释、入门教程、参考手册等等。

`Kubernetes` 是一个生产级别的容器编排平台和集群管理系统，不仅能够创建、调度容器，还能够监控、管理服务器。

## 1. minikube 简介

`Kubernetes` 一般都运行在大规模的计算集群上，管理很严格，这就对我们个人来说造成了一定的障碍，在官网（[https://kubernetes.io/zh/docs/tasks/tools/](https://kubernetes.io/zh/docs/tasks/tools/)）上推荐的有两个工具：`kind` 和 `minikube`，它们都可以在本机上运行完整的 `Kubernetes` 环境。

- kind 基于 Docker，意思是 Kubernetes in Docker 。它功能少，用法简单，也因此运行速度快，容易上手。不过它缺少很多 Kubernetes 的标准功能，例如仪表盘、网络插件，也很难定制化，所以我认为它比较适合有经验的 Kubernetes 用户做快速开发测试，不太适合学习研究。不选 kind 还有一个原因，它的名字与 Kubernetes YAML 配置里的字段 kind 重名，会对初学者造成误解，干扰学习。
- minikube 最大特点就是“小而美”，可执行文件仅有不到 100MB，运行镜像也不过 1GB，但就在这么小的空间里却集成了 Kubernetes 的绝大多数功能特性，不仅有核心的容器编排功能，还有丰富的插件，例如 Dashboard、GPU、Ingress、Istio、Kong、Registry 等等，综合来看非常完善。

## 2. minikube 安装

`minikube` 支持 `Mac`、`Windows`、`Linux` 这三种主流平台，我们选择的版本为 `minikube` 的版本是 1.25.2，支持的 `Kubernetes` 版本是 1.23.3，

安装参考：[https://minikube.sigs.k8s.io/docs/start/](https://minikube.sigs.k8s.io/docs/start/)

```java
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
```

或者下载指定版本：

```java
wget https://github.com/kubernetes/minikube/releases/download/v1.25.2/minikube-linux-amd64
```

所有版本链接：[https://github.com/kubernetes/minikube/releases](https://github.com/kubernetes/minikube/releases)

安装完成后，检查版本

```java
$ minikube version
minikube version: v1.25.2
commit: 362d5fdc0a3dbee389b3d3f1034e8023e72bd3a7
```

## 3. kubectl 安装

`minikube` 只能够搭建 `Kubernetes` 环境，要操作 `Kubernetes`，还需要另一个专门的客户端工具`kubectl`。

`kubectl` 的作用有点类似之前我们学习容器技术时候的工具 `docker` ，它也是一个命令行工具，作用也比较类似，同样是与 `Kubernetes` 后台服务通信，把我们的命令转发给 `Kubernetes`，实现容器和集群的管理功能。

`kubectl` 是一个与 `Kubernetes`、`minikube` 彼此独立的项目，所以不包含在 `minikube` 里，但 `minikube` 提供了安装它的简化方式，你只需执行下面的这条命令：

```java
minikube kubectl
```

它就会把与当前 `Kubernetes` 版本匹配的 `kubectl` 下载下来，存放在内部目录（例如 `.minikube/cache/linux/arm64/v1.23.3`），然后我们就可以使用它来对 `Kubernetes` “发号施令”了。

所以，在 `minikube` 环境里，我们会用到两个客户端：

- minikube 管理 Kubernetes 集群环境；
- kubectl 操作实际的 Kubernetes 功能；

## 4. Kubernetes 环境搭建

使用命令 `minikube start` 会从 `Docker Hub` 上拉取镜像，以当前最新版本的 `Kubernetes` 启动集群。不过为了保证实验环境的一致性，我们可以在后面再加上一个参数 `--kubernetes-version`，明确指定要使用 `Kubernetes` 版本。

```java
minikube start --kubernetes-version=v1.23.3
```

> 由于国内网络环境下载 gcr.io 的镜像比较困难， minikube 提供了特殊的启动参数 --image-mirror-country=cn --registry-mirror=xxx --image-repository=xxx 等。

> minikube start --kubernetes-version=v1.23.3 --image-mirror-country=‘cn’

> minikube start --kubernetes-version=v1.23.3 --image-mirror-country=‘cn’ --force --memory=2048
>
> 参数解释：
>
> –force 如果是root需要添加
>
> –image-mirror-country=‘cn’ 切换到国内镜像
>
> –memory=2048 如果内存不足，则会卡住 ……p/s ，需要增大内存

然后可以使用 `minikube status`、`minikube node list` 这两个命令来查看集群的状态：

```java
$ minikube status
minikube
type: Control Plane
host: Running
kubelet: Running
apiserver: Running
kubeconfig: Configured
$ minikube node list
minikube        192.168.49.2
```

可以看到， `Kubernetes` 集群里现在只有一个节点，名字就叫 `minikube`，类型是 `Control Plane`，里面有 `host`、`kubelet`、`apiserver` 三个服务，IP 地址是 192.168.49.2。

还可以用命令 `minikube ssh` 登录到这个节点上，是 `minikube` 利用了 `docker` 来实现的 `Kubernetes` 输入 `docker ps` 可以看到很多其它容器 ，虽然它是虚拟的，但用起来和实机也没什么区别：

```java
$ minikube ssh
docker@minikube:~$ hostname
minikube
docker@minikube:~$ uname -a
Linux minikube 5.8.0-53-generic60~20.04.1-Ubuntu SMP Thu May 6 09:52:46 UTC 2021 x86_64 x86_64 x86_64 GNU/Linux
docker@minikube:~$ docker ps
CONTAINER ID   IMAGE                                                                     COMMAND                  CREATED             STATUS             PORTS     NAMES
0d172f0fda7f   nginx                                                                     "/docker-entrypoint.…"   About an hour ago   Up About an hour             k8s_ngx_ngx_default_90bda9ec-3f31-4506-865b-8674fd2ea66b_0
df17f1718d03   registry.cn-hangzhou.aliyuncs.com/google_containers/pause:3.6             "/pause"                 About an hour ago   Up About an hour             k8s_POD_ngx_default_90bda9ec-3f31-4506-865b-8674fd2ea66b_0
32518b44de73   registry.cn-hangzhou.aliyuncs.com/google_containers/storage-provisioner   "/storage-provisioner"   About an hour ago   Up About an hour             k8s_storage-provisioner_storage-provisioner_kube-system_5012757e-fc1b-4202-a366-14b0ba83304c_0
0193ab3d7e7f   a4ca41631cc7                                                              "/coredns -conf /etc…"   About an hour ago   Up About an hour             k8s_coredns_coredns-65c54cc984-l7d24_kube-system_a8b97755-18b0-4cc6-83c9-01ebc582f2c8_0
fe7a561318b5   registry.cn-hangzhou.aliyuncs.com/google_containers/pause:3.6             "/pause"                 About an hour ago   Up About an hour             k8s_POD_coredns-65c54cc984-l7d24_kube-system_a8b97755-18b0-4cc6-83c9-01ebc582f2c8_0
7dff38d9ed4b   9b7cc9982109                                                              "/usr/local/bin/kube…"   About an hour ago   Up About an hour             k
docker@minikube:~$ exit
logout
```

有了集群，接下来我们就可以使用 `kubectl` 来操作一下，初步体会 `Kubernetes` 这个容器编排系统，最简单的命令当然就是查看版本：

```java
kubectl version
```

不过这条命令还不能直接用，因为使用 `minikube` 自带的 `kubectl` 有一点形式上的限制，要在前面加上 `minikube` 的前缀，后面再有个 `--`，像这样：

```java
minikube kubectl -- version 
```

为了避免这个不大不小的麻烦，我建议你使用 `Linux` 的“alias”功能，为它创建一个别名，写到当前用户目录下的 `.bashrc` 里，也就是这样：

```java
alias kubectl="minikube kubectl --"
```

另外，`kubectl` 还提供了命令自动补全的功能，你还应该在 `.bashrc` 加上 `kubectl completion`：

```java
source <(kubectl completion bash)
```

现在，使用 `source ~/.bashrc` 之后我们就可以愉快地使用 `kubectl` 了

```java
$ kubectl version --short
Client Version: v1.23.3
Server Version: v1.23.3
```

下面我们在 `Kubernetes` 里运行一个 `Nginx` 应用，命令与 `Docker` 一样，也是 `run`，不过形式上有点区别，需要用 `--image` 指定镜像，然后 `Kubernetes` 会自动拉取并运行：

```java
kubectl run ngx --image=nginx:alpine
```

这里涉及 `Kubernetes` 里的一个非常重要的概念：`Pod`，你可以暂时把它理解成是“穿了马甲”的容器，查看 `Pod` 列表需要使用命令 `kubectl get pod`，它的效果类似 `docker ps`：

```java
$ kubectl get pod
NAME   READY   STATUS    RESTARTS   AGE
ngx    1/1     Running   0          71s
```

命令执行之后可以看到，在 `Kubernetes` 集群里就有了一个名字叫 `ngx` 的 `Pod` 正在运行，表示我们的这个单节点 `minikube` 环境已经搭建成功。
