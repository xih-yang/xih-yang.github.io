# 20、Kubernetes - 实战：k8s高可用集群haproxy+k8s
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/11/20.html
- 分类：容器服务
- 分组：教程目录
## 1、高可用集群简述

在前面k8s学习中，我们只使用一个master节点进行调度，当此节点dowm掉后k8s将无法进行后续的部署管理工作。本项目将通过haproxy配置三台 master主机实现负载均衡，通过k8s三台master主机实现k8s集群高可用。

流程图如下

准备五台虚拟机，分工如下

- server1（172.25.11.1）是harbor仓库，分1G内存
- server5（172.25.11.5）server6（172.25.11.6）server7（172.25.11.7）是集群的master端，各分2G内存
- server5（172.25.11.5）还是haproxy负载均衡
- server8（172.25.11.8）是集群的worker端，分1G内存
- 宿主机（172.25.11.250）网页测试

因为电脑只有8G内存，按照上面的分发已满8G ，宿主机一点没有了，会卡死。所以我们先起仓库和三个master，成功启动后，把server6和server7的内存降为1G，再创建server8进行测试

## 2、haproxy负载均衡部署

首先给server5添加虚拟ip172.25.11.100，用来haproxy使用，因为server5即有haproxy也有集群master，这样可以隔离。查看，ping测试可以成功连通

server5配置了yum源，

server5安装haproxy

进入haproxy的配置文件

首先添加一个监测haproxy状态的模块，使用80端口。因为server5有haproxy也是k8s集群的master，所以端口要区分，这里haproxy用8443端口，模式为tcp。

真正的后端是server5、server6、server7，rr论叫负载均衡，三个集群的master使用6443端口，模式为tcp。

重启haproxy，查看端口，80端口监测haproxy状态，8443端口为haproxy传输端口

现在网页访问虚拟ip`172.25.11.100/status`或者server5的ip`172.25.11.5/status`都可以查看haproxy的状态

## 3、docker部署

因为有三个集群的master，所以下面的所有操作，三个master都需要做。

提前在真机准备好docker-ce的安装包，放到了apche发布目录。只需在server5上编写yum文件，安装docker-ce

server6同样安装docker-ce

server7同样安装docker-ce

server5设置开机自启dcoker，进入docker目录，编写json文件，指定仓库地址，并修改cgroup的方式为systemed

server5发送json文件给server6，server6设置开机自启dcoker

server5发送json文件给server7，server7设置开机自启dcoker

server5设定桥接模式而不用NAT，重新加载内核参数

server6设定桥接模式而不用NAT，重新加载内核参数

server7设定桥接模式而不用NAT，重新加载内核参数

server5重启docker，查看信息，cgroup改为了systemd，并且没有警告出现

server6重启docker，查看信息，cgroup改为了systemd，并且没有警告出现

server7重启docker，查看信息，cgroup改为了systemd，并且没有警告出现

给三个master发以前产生的证书文件

并且三个master都要设置地址解析/etc/hosts，尤其要添加仓库的地址解析

测试docker是否安装成功，拉取镜像，成功

## 4、k8s集群部署

在部署了docker的基础上，还需要部署管理集群的工具，kubernetes

部署k8s时，三个master需要有2个CPU，2G内存

server5关闭swap分区

server6关闭swap分区

server7关闭swap分区

提前准备了k8s的安装包，发给server5、server6、server7

server5安装k8s（kubeadm，kubelet，kubectl）

server6安装k8s（kubeadm，kubelet，kubectl）

server7安装k8s（kubeadm，kubelet，kubectl）

server5开启kubelet并设置开机自启

server6开启kubelet并设置开机自启

server7开启kubelet并设置开机自启

server5打开IPVS模块

server6打开IPVS模块

server7打开IPVS模块

server5输出kubeadm初始化文件，修改kubeadm-init.yaml文件

设定本机ip和名称，设定集群调用的api端口为6443。设定访问集群的虚拟ip为172.25.11.100:8443，和前面的haproxy处一致

添加仓库地址，指定k8s版本为1.21.3，pod的网段为10.244，svc的网段为10.96，kube_proxy使用IPVS模式。

server5提前拉取所需镜像

server5初始化k8s集群

初始化成功会显示申明命令、加入master的命令和加入worker的命令，保存下来

根据提示信息，申明查看节点现在只有server5，查看pod，发现有两个没有ready，这是因为没有安装网络插件

由于没有补齐，操作不舒服，先输入补齐命令，重新加载~/.bashrc，现在有补齐了

给server5发送安装flannel网络组件的文件

编辑kube-flannel.yaml文件，修改网络类型为host-gw直连网关

应用kube-flannel.yaml文件，再次查看pod全部正常启动了

查看节点，server5准备就绪了

server6使用之前初始化提示的命令，以master身份加入集群

server7也使用之前初始化提示的命令，以master身份加入集群

server5查看节点，成功加入，且就绪了

现在网页查看haproxy的三个节点，成功开启

## 5、k8s集群添加worker节点

由于内存限制，把server6和server7的内存调整为1G，开启新的虚拟机server8，给server8执行前面的操作。

把docker的yum文件发给server8，把k8s的安装包给server8

server8安装docker-ce

开启docker，发给server8证书文件和json文件

同样server8需要地址解析

发送内核参数文件给server8

server8重新读取内核参数

重启docker，查看信息，cgroup改为systemd，且没有警告

安装k8s包

开机自启docker，关闭swap分区，开机自启kubelet，使用初始化产生的命令，以worker节点的身份加入集群

在server5处，查看节点，已成功加入集群

在master端创建一个pod，成功

查看到该pod实际在server8上，访问测试成功

## 6、高可用测试

运行一个pod节点于当前master主机，当此master主机down掉后，节点仍然可在其他master主机上查看状况并进行操作管理。现在我们应该关闭其中一个master端，测试其他master能否正常接管，由于我这里server5有haproxy也是master，关掉他，看不到效果了，所以测试关掉server6。

注意三个master k8s主机只容忍最多一个down掉，其余两个保持高可用。

现在关闭server6这个master，测试pod是否能够正常运行，测试其他master端能否正常管理

pod正常运行

网页haproxy可以看到server6关闭了

也可以使用命令行查看server6关闭了
