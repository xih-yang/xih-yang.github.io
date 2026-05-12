# 06、Kubernetes - 实战：搭建多节点集群、kubeadm 安装 master/worker/console/flannel 网络插件
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/10/6.html
- 分类：容器服务
- 分组：教程目录
## 1. kubeadm

官网：[https://kubernetes.io/zh-cn/docs/reference/setup-tools/kubeadm/](https://kubernetes.io/zh-cn/docs/reference/setup-tools/kubeadm/)

为了简化 `Kubernetes` 的部署工作，社区里就出现了一个专门用来在集群中安装 `Kubernetes` 的工具，名字就叫 `kubeadm`，意思就是 `Kubernetes` 管理员。

`kubeadm`，原理和 `minikube` 类似，也是用容器和镜像来封装 `Kubernetes` 的各种组件，但它的目标不是单机部署，而是要能够轻松地在集群环境里部署 `Kubernetes`，并且让这个集群接近甚至达到生产级质量。

## 2. 集群架构

图里一共有 3 台主机，下面我来详细说明一下：

所谓的多节点集群，要求服务器应该有两台或者更多，为了简化我们只取最小值，所以这个 `Kubernetes` 集群就只有两台主机，一台是 `Master` 节点（管理整个集群），另一台是 `Worker` 节点（没有管理工作，只运行业务应用）。当然，在完全掌握了 `kubeadm` 的用法之后，你可以在这个集群里添加更多的节点。

基于模拟生产环境的考虑，在 `Kubernetes` 集群之外还需要有一台起辅助作用的服务器。它的名字叫 `Console`，意思是控制台，我们要在上面安装命令行工具 `kubectl`，所有对 `Kubernetes` 集群的管理命令都是从这台主机发出去的。这也比较符合实际情况，因为安全的原因，集群里的主机部署好之后应该尽量少直接登录上去操作。要提醒你的是，`Console` 这台主机只是逻辑上的概念，不一定要是独立，你在实际安装部署的时候完全可以复用之前 `minikube` 的虚拟机，或者直接使用 `Master/Worker` 节点作为控制台。

## 3. 准备工作

因为`Kubernetes` 对系统有一些特殊要求，我们必须还要在 `Master` 和 `Worker` 节点上做一些准备。

### 3.1 修改主机名

由于`Kubernetes` 使用主机名来区分集群里的节点，所以每个节点的 `hostname` 必须不能重名。你需要修改 `/etc/hostname`这个文件，把它改成容易辨识的名字，比如 `Master` 节点就叫 `master`，`Worker` 节点就叫 `worker`：

```java
sudo vi /etc/hostname
```

本次实验环境中：

- Master 主机名为 test6
- Worker 主机名为 dev-pc

### 3.2 安装 Docker

虽然`Kubernetes` 目前支持多种容器运行时，但 `Docker` 还是最方便最易用的一种，所以我们仍然继续使用 `Docker` 作为 `Kubernetes` 的底层支持，使用 `apt` 安装 `Docker Engine`。

安装完成后需要你再对 `Docker` 的配置做一点修改，在“/etc/docker/daemon.json”里把 `cgroup` 的驱动程序改成 `systemd` ，然后重启 `Docker` 的守护进程，具体的操作我列在了下面：

```java
cat <<EOF | sudo tee /etc/docker/daemon.json
{
  "exec-opts": ["native.cgroupdriver=systemd"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m"
  },
  "storage-driver": "overlay2"
}
EOF
sudo systemctl enable docker
sudo systemctl daemon-reload
sudo systemctl restart docker
```

### 3.3 修改网络设置

为了让`Kubernetes` 能够检查、转发网络流量，你需要修改 `iptables` 的配置，启用 `br_netfilter`模块：

```java
cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
br_netfilter
EOF
cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
net.ipv4.ip_forward=1 better than modify /etc/sysctl.conf
EOF
sudo sysctl --system
```

### 3.4 修改交换分区

需要修改 `/etc/fstab`，关闭 `Linux` 的 `swap` 分区，提升 `Kubernetes` 的性能：

```java
sudo swapoff -a
sudo sed -ri '/\sswap\s/s/^#?/#/' /etc/fstab
```

最后重启系统。

## 4. 安装 kubeadm

安装`kubeadm` 时需要在 `Master` 节点和 `Worker` 节点上都做这一步。

`kubeadm` 可以直接从 `Google` 自己的软件仓库下载安装，但国内的网络不稳定，很难下载成功，需要改用其他的软件源，这里我选择了国内的某云厂商：

```java
sudo apt install -y apt-transport-https ca-certificates curl
curl https://mirrors.aliyun.com/kubernetes/apt/doc/apt-key.gpg | sudo apt-key add -
cat <<EOF | sudo tee /etc/apt/sources.list.d/kubernetes.list
deb https://mirrors.aliyun.com/kubernetes/apt/ kubernetes-xenial main
EOF
sudo apt update
```

`apt` 默认会下载最新版本，但我们也可以指定版本号，比如使用和 `minikube` 相同的“1.23.3”：

```java
sudo apt install -y kubeadm=1.23.3-00 kubelet=1.23.3-00 kubectl=1.23.3-00
```

安装完成之后，你可以用 `kubeadm version`、`kubectl version` 来验证版本是否正确：

```java
test6@test6:~$ kubeadm version
kubeadm version: &version.Info{
     Major:"1", Minor:"23", GitVersion:"v1.23.3", GitCommit:"816c97ab8cff8a1c72eccca1026f7820e93e0d25", GitTreeState:"clean", BuildDate:"2022-01-25T21:24:08Z", GoVersion:"go1.17.6", Compiler:"gc", Platform:"linux/amd64"}
test6@test6:~$ kubectl version --short
Client Version: v1.23.3
```

另外按照 `Kubernetes` 官网的要求，我们最好再使用命令 `apt-mark hold` ，锁定这三个软件的版本，避免意外升级导致版本错误：

```java
sudo apt-mark hold kubeadm kubelet kubectl
```

## 5. 下载 Kubernetes 组件镜像

前面我说过，`kubeadm` 把 `apiserver`、`etcd`、`scheduler` 等组件都打包成了镜像，以容器的方式启动 `Kubernetes`，但这些镜像不是放在 `Docker Hub` 上，而是放在 `Google` 自己的镜像仓库网站 `gcr.io`，而它在国内的访问很困难，直接拉取镜像几乎是不可能的。

使用命令 `kubeadm config images list` 可以查看安装 `Kubernetes` 所需的镜像列表，参数 `--kubernetes-version` 可以指定版本号：

```java
$ kubeadm config images list --kubernetes-version v1.23.3
k8s.gcr.io/kube-apiserver:v1.23.3
k8s.gcr.io/kube-controller-manager:v1.23.3
k8s.gcr.io/kube-scheduler:v1.23.3
k8s.gcr.io/kube-proxy:v1.23.3
k8s.gcr.io/pause:3.6
k8s.gcr.io/etcd:3.5.1-0
k8s.gcr.io/coredns/coredns:v1.8.6
```

利用`minikube`。因为 `minikube` 本身也打包了 `Kubernetes` 的组件镜像，所以完全可以从它的节点里把这些镜像导出之后再拷贝过来。

具体做法也很简单，先启动 `minikube`，然后 `minikube ssh` 登录进虚拟节点，用 `docker save -o` 命令把相应版本的镜像都保存下来，再用 `minikube cp` 拷贝到本地。

## 6. 安装 Master 节点

`kubeadm` 的用法非常简单，只需要一个命令 `kubeadm init` 就可以把组件在 `Master` 节点上运行起来，不过它还有很多参数用来调整集群的配置。

```java
sudo kubeadm init \
--apiserver-advertise-address=172.16.19.134 \
--image-repository registry.aliyuncs.com/google_containers \
--kubernetes-version v1.23.3 \
--pod-network-cidr=10.10.0.0/16
```

参数含义：

- --pod-network-cidr，设置集群里 Pod 的 IP 地址段。
- --apiserver-advertise-address，设置 apiserver 的 IP 地址，也就是 Master 机器的 IP地址。
- --kubernetes-version，指定 Kubernetes 的版本号。
- --image-repository， 指定镜像源，有了这个参数就可以省掉第 5 步下载组件镜像的过程。

`kubeadm init`时指定的 `apiserver`的 `ip`需要是自己环境上 `master`节点的 `ip`地址，如果指定错误，可通过`sudo kubeadm reset`重置。

执行结果如下：

```java
Your Kubernetes control-plane has initialized successfully!
To start using your cluster, you need to run the following as a regular user:
  mkdir -p $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

按照上面提示执行相关命令即可。

```java
# 初始话失败再重新尝试需要清空环境
#重置
sudo kubeadm reset
#干掉kubelet进程
ps -ef|grep kubelet
sudo kill -9 进程id
#删掉配置目录
sudo rm -rf  /etc/kubernetes/manifests/
```

另外还有一个很重要的 `kubeadm join`提示，其他节点要加入集群必须要用指令里的 `token` 和 `ca` 证书，所以这条命令务必拷贝后保存好：

```java
Then you can join any number of worker nodes by running the following on each as root:
kubeadm join 172.16.19.134:6443 --token h8dabp.4o6nlvw4h51p2uu3 \
        --discovery-token-ca-cert-hash sha256:b92bfc46494e236b5287ffb5be88ed0580de54abaa28873e116374805e118b6d
```

检查版本和集群节点状态

```java
test6@test6:~$ kubectl version --short
Client Version: v1.23.3
Server Version: v1.23.3
test6@test6:~$ kubectl get node
NAME    STATUS     ROLES                  AGE   VERSION
test6   NotReady   control-plane,master   11m   v1.23.3
test6@test6:~$
```

你会注意到 `Master` 节点的状态是 `NotReady`，这是由于还缺少网络插件，集群的内部网络还没有正常运作。

## 7. 安装 Flannel 网络插件

`Kubernetes` 定义了 `CNI` 标准，有很多网络插件，这里我选择最常用的 `Flannel`，可以在它的 仓库里（[https://github.com/flannel-io/flannel/](https://github.com/flannel-io/flannel/)）找到相关文档。

```java
 wget https://raw.githubusercontent.com/flannel-io/flannel/v0.20.2/Documentation/kube-flannel.yml
```

需要修改文件里的“net-conf.json”字段，把 `Network` 改成刚才 `kubeadm` 的参数 `--pod-network-cidr` 设置的地址段。

```java
  net-conf.json: |
    {
      "Network": "10.10.0.0/16",
      "Backend": {
        "Type": "vxlan"
      }
    }
```

然后执行下面命令来安装 `Flannel` 网络。

```java
kubectl apply -f kube-flannel.yml
```

稍等一小会，可以执行 `kubectl get node` 来看节点状态：

```java
$ kubectl get node
NAME    STATUS   ROLES                  AGE   VERSION
test6   Ready    control-plane,master   28m   v1.23.3
```

这时你应该能够看到 `Master` 节点的状态是 `Ready`，表明节点网络也工作正常了。

## 8. 安装 Worker 节点

`Worker` 节点的安装就简单多了，只需要用之前拷贝的那条 `kubeadm join` 命令就可以了，记得要用 `sudo` 来执行：

```java
sudo \
kubeadm join 172.16.19.134:6443 --token h8dabp.4o6nlvw4h51p2uu3      \
--discovery-token-ca-cert-hash sha256:b92bfc46494e236b5287ffb5be88ed0580de54abaa28873e116374805e118b6d
```

这里面的 token 默认有效期为 24 小时，如果忘记或者超时了可以执行 `kubeadm token create --print-join-command`创建一个新的 token。

`Worker` 节点安装完毕后，在 `Master` 机器执行 `kubectl get node` ，就会看到两个节点都是`Ready`状态：

```java
$ kubectl get node
NAME     STATUS   ROLES                  AGE    VERSION
dev-pc   Ready    <none>                 70s    v1.23.3
test6    Ready    control-plane,master   133m   v1.23.3
```

在`Master` 机器执行以下命令，查看是否正常。

```java
kubectl run ngx --image=nginx:alpine
kubectl get pod -o wide
```

执行结果：

```java
$ kubectl run ngx --image=nginx:alpine
pod/ngx created
test6@test6:~/k8s$ kubectl get pod -o wide
NAME   READY   STATUS    RESTARTS   AGE   IP          NODE     NOMINATED NODE   READINESS GATES
ngx    1/1     Running   0          16s   10.10.1.2   dev-pc   <none>           <none>
```

会看到`Pod` 运行在 `Worker` 节点(dev-pc)上，`IP` 地址是“10.10.1.2”，表明我们的 `Kubernetes` 集群部署成功。

## 9. 部署 Console 节点

`Console` 节点的部署工作更加简单，它只需要安装一个 `kubectl`，

```java
# 下载：
curl -LO https://dl.k8s.io/release/v1.23.3/bin/linux/amd64/kubectl
# 安装
sudo install kubectl /usr/local/bin/kubectl
# 
mkdir -p $HOME/.kube
```

然后复制 `config`文件就行，可以直接在 `Master` 节点上用 `scp`远程拷贝，其中 test@192.168.0.54 为 console 机器的地址。

```java
scp ~/.kube/config test@192.168.0.54:~/.kube/
```

然后在`Console` 机器测试下，

```java
$ kubectl get nodes
NAME     STATUS   ROLES                  AGE    VERSION
dev-pc   Ready    <none>                 41m    v1.23.3
test6    Ready    control-plane,master   173m   v1.23.3
$ kubectl version --short
Client Version: v1.23.3
Server Version: v1.23.3
```

至此，`kubeadm`的 `master + worker + console` 的环境搭建完成了。

`Console` 就是一个向 `Kubernetes`集群发送命令的“控制台”，理论上是与 `Kubernetes`无关的，只要安装了 `kubectl`和相应的 `config`，能够与 `Kubernetes`集群通信就可以了。 任何有 `kubectl`的计算机都可以作为 `console`，所以 `Kubernetes`集群里的 `master`、`node`节点，只要有 `kubectl`，就可以认为是`console`。 它是一个逻辑角色，可以和已有的机器重合。

> 注意 kubectl和 Kubernetes集群其实是彼此独立的，不能想当然认为 Kubernetes集群节点上一定可以用kubectl，可以再看一下集群的网络结构图。
