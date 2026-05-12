# 04、Kubernetes - 实战：KubeAdm方式部署
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/7/4.html
- 分类：容器服务
- 分组：教程目录
## 环境初始化

### 1、检查操作系统版本

```java
/etc/hosts添加如下内容
```

cat/etc/hosts

**10、** 0.0.6master；

**10、** 0.0.3node1；

**10、** 0.0.10node2；

登录密码：roopa9123ss#

注意：`三个服务器核数需要双核以上`

### 3、时间同步

```java
systemctl start chronyd
systemctl enable chronyd
测试时间 date
```

### 4、禁用iptabels和firewalld服务

```java
关闭firewalld
systemctl stop firewalld
systemctl disable firewalld
关闭iptables
systemctl stop iptables
systemctl disable iptables
```

### 5、禁用selinux

```java
编辑/etc/selinux/config文件，修改SELINUX值为disabled
SELINUX=disabled
```

### 6、禁用swap分区

```java
编辑分区配置文件/etc/fstab，注释掉swap分区一行，然后重启linux服务
#/dev/mapper/centos-swap swap
```

### 7、修改linux的内核参数

```java
修改linux的内核参数，添加网桥过滤和地址转发功能
编辑/etc/sysctl.d/kubernetes.conf文件，添加如下配置：
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
net.ipv4.ip\_forward = 1
#重新加载配置
sysctl -p
#加载网桥过滤模块
modprobe br\_netfilter
#查看网桥过滤模块是否加载成功
lsmod | grep br\_netfilter
```

### 8、配置ipvs功能

```java
# 1.安装ipset和ipvsadm
[root@master ~]# yum install ipset ipvsadmin -y
# 2.添加需要加载的模块写入脚本文件
[root@master ~]# cat `<<EOF>` /etc/sysconfig/modules/ipvs.modules
#!/bin/bash
modprobe -- ip\_vs
modprobe -- ip\_vs\_rr
modprobe -- ip\_vs\_wrr
modprobe -- ip\_vs\_sh
modprobe -- nf\_conntrack\_ipv4
EOF
2台机器 到这里############
# 3.为脚本添加执行权限
[root@master ~]# chmod +x /etc/sysconfig/modules/ipvs.modules
# 4.执行脚本文件
[root@master ~]# /bin/bash /etc/sysconfig/modules/ipvs.modules
# 5.查看对应的模块是否加载成功
[root@master ~]# lsmod | grep -e ip\_vs -e nf\_conntrack\_ipv4
```

### 9、重启服务器

```java
reboot
```

## 环境安装

### 1、安装docker

```java
# 1、切换镜像源
[root@master ~]# wget [https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo][https_mirrors.aliyun.com_docker-ce_linux_centos_docker-ce.repo] \-O /etc/yum.repos.d/docker-ce.repo
# 2、查看当前镜像源中支持的docker版本
[root@master ~]# yum list docker-ce --showduplicates
# 3、安装特定版本的docker-ce
# 必须制定--setopt=obsoletes=0，否则yum会自动安装更高版本
[root@master ~]# yum install --setopt=obsoletes=0 docker-ce-18.06.3.ce-3.el7 -y
# 4、添加一个配置文件
#Docker 在默认情况下使用Vgroup Driver为cgroupfs，而Kubernetes推荐使用systemd来替代cgroupfs
[root@master ~]# mkdir /etc/docker
[root@master ~]# cat `<<EOF>` /etc/docker/daemon.json
\{
"exec-opts": ["native.cgroupdriver=systemd"],
"registry-mirrors": ["[https://kn0t2bca.mirror.aliyuncs.com][https_kn0t2bca.mirror.aliyuncs.com]"]
\}
EOF
# 5、启动dokcer
[root@master ~]# systemctl restart docker
[root@master ~]# systemctl enable docker
# 6、检查docker版本
docker version
```

其中启动docker时报错

unable to configure the Docker daemon with file /etc/docker/daemon.json: invalid character '.' looking for beginning of object key string

是因为*"exec-opts"和"registry-mirrors"复制时，前面包含. 需要去掉然后 systemctl restart docker*

### 2、安装Kubernetes组件

```java
# 1、由于kubernetes的镜像在国外，速度比较慢，这里切换成国内的镜像源
# 2、编辑/etc/yum.repos.d/kubernetes.repo,添加下面的配置
[kubernetes]
name=Kubernetes
baseurl=[http://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86\_64][http_mirrors.aliyun.com_kubernetes_yum_repos_kubernetes-el7-x86_64]
enabled=1
gpgchech=0
repo\_gpgcheck=0
gpgkey=[http://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg][http_mirrors.aliyun.com_kubernetes_yum_doc_yum-key.gpg]
[http://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg][http_mirrors.aliyun.com_kubernetes_yum_doc_rpm-package-key.gpg]
# 3、安装kubeadm、kubelet和kubectl
[root@master ~]# yum install --setopt=obsoletes=0 kubeadm-1.17.4-0 kubelet-1.17.4-0 kubectl-1.17.4-0 -y
# 4、配置kubelet的cgroup
#编辑/etc/sysconfig/kubelet, 删掉原来的，添加下面的配置
KUBELET\_CGROUP\_ARGS="--cgroup-driver=systemd"
KUBE\_PROXY\_MODE="ipvs"
# 5、设置kubelet开机自启
[root@master ~]# systemctl enable kubelet
```

### 3、准备集群镜像

```java
# 在安装kubernetes集群之前，必须要提前准备好集群需要的镜像，所需镜像可以通过下面命令查看
[root@master ~]# kubeadm config images list
# 下载镜像
# 此镜像kubernetes的仓库中，由于网络原因，无法连接，下面提供了一种替换方案
vimpull.sh
images=(
kube-apiserver:v1.17.4
kube-controller-manager:v1.17.4
kube-scheduler:v1.17.4
kube-proxy:v1.17.4
pause:3.1
etcd:3.4.3-0
coredns:1.6.5
)
forimageName in $\{images[@]\};do
docker pull [registry.cn-hangzhou.aliyuncs.com/google\_containers/$imageName][registry.cn-hangzhou.aliyuncs.com_google_containers_imageName]
docker tag [registry.cn-hangzhou.aliyuncs.com/google\_containers/$imageName][registry.cn-hangzhou.aliyuncs.com_google_containers_imageName] k8s.gcr.io/$imageName
docker rmi [registry.cn-hangzhou.aliyuncs.com/google\_containers/$imageName][registry.cn-hangzhou.aliyuncs.com_google_containers_imageName]
done
然后sh pull.sh
```

拉取完后，查看docker images 下 7个镜像是否已下载好

### 4、集群初始化

> 下面的操作只需要在master节点上执行即可

vim/etc/kubernetes/kubelet.conf

修改其中server ip为master IP

```java
# 创建集群
[root@master ~]#
kubeadm init \\
\--image-repository [registry.aliyuncs.com/google\_containers][registry.aliyuncs.com_google_containers] \\
\--kubernetes-version=v1.17.4 \\
\--service-cidr=10.96.0.0/12 \\
\--pod-network-cidr=10.244.0.0/16 \\
\--apiserver-advertise-address=10.0.0.6
**27号晚跑到这里**
# 创建必要文件
[root@master ~]# mkdir -p `$`HOME/.kube
[root@master ~]# sudo cp -i /etc/kubernetes/admin.conf `$`HOME/.kube/config
[root@master ~]# sudo chown `$`(id -u):`$`(id -g) `$`HOME/.kube/config
```

> 下面的操作只需要在node节点上执行即可

```java
kubeadm join 10.0.0.6:6443 --token luqe46.ma1zjznl1tmwyroz \\
\--discovery-token-ca-cert-hash sha256:d3c9121b221d22c85f6a947f0b2aafdac3674569dc25abfc1466560c97daa2e5
注意上面这个命令会在master节点上安装完kubeadm init 自动生成，直接复制在Node节点上执行即可！
```

在master上查看节点信息

```java
[root@master ~]# kubectl get nodes
NAME STATUS ROLES AGE VERSION
master NotReady master 6m v1.17.4
node1 NotReady <none> 22s v1.17.4
node2 NotReady <none> 19s v1.17.4
```

在工作节点kubeadm join出现连接不上，报错：

kubeadm init /proc/sys/net/bridge/bridge-nf-call-iptables contents are not set to 1

解决办法：

```java
echo 1 > /proc/sys/net/bridge/bridge-nf-call-iptables
echo 1 > /proc/sys/net/bridge/bridge-nf-call-ip6tables
然后重启机器reboot,重新连接就可以
参考：[https://developer.aliyun.com/article/701252][https_developer.aliyun.com_article_701252]
```

### 5、安装网络插件，只在master节点操作即可

```java
wget [https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml][https_raw.githubusercontent.com_coreos_flannel_master_Documentation_kube-flannel.yml]
```

由于外网不好访问，如果出现无法访问的情况，可以直接用下面的 记得文件名是kube-flannel.yml，位置：/root/kube-flannel.yml内容：

```java
[https://github.com/flannel-io/flannel/tree/master/Documentation/kube-flannel.yml][https_github.com_flannel-io_flannel_tree_master_Documentation_kube-flannel.yml]
```

修改文件中的quay.io仓库为[quay-mirror.qiniu.com](http://quay-mirror.qiniu.com/) (如果能访问就不一定要替换，我当前没有替换也能成功的)

重启kubelet和docker

```java
# 重启kubelet
systemctl restart kubelet
# 重启docker
systemctl restart docker
```

使用配置文件启动fannel

```java
kubectl apply -f kube-flannel.yml
```

查看状态

```java
kubectl get nodes
```

显示如下

[root@VM-0-6-centos ~]# kubectl get nodes

NAME STATUS ROLES AGE VERSION

vm-0-10-centos Ready  24m v1.17.4

vm-0-3-centos Ready  32m v1.17.4

vm-0-6-centos Ready master 37m v1.17.4

问题：安装完后出现kubectl get nodes 都时NotReady问题，解决办法：

```java
执行完kubectl apply后一直集群节点状态一直显示NotReady状态，可以尝试将[quay-mirror.qiniu.com][]还原回quay.io然后再执行一次，再执行下面两条命令：
systemctl daemon-reload
systemctl restart kubelet
看看节点是否是ready状态
```

### 6、集群测试

创建一个nginx服务

```java
kubectl create deployment nginx --image=nginx:1.14-alpine
```

暴露端口

```java
kubectl expose deploy nginx --port=80 --target-port=80 --type=NodePort
```

查看服务

```java
kubectl get pod,svc
```

返回如下：

NAME READY STATUS RESTARTS AGE

pod/nginx-6867cdf567-pz9tz 0/1 ContainerCreating 0 10s

NAME TYPE CLUSTER-IP EXTERNAL-IP PORT(S) AGE

service/kubernetes ClusterIP 10.96.0.1  443/TCP 43m

service/nginx NodePort 10.101.235.58  80:31786/TCP 5s

查看pod

kubectl get pod

查看svc

kubectl get svc

浏览器访问： masterIp:31786、node1:31786、node2:31786 即可访问nginx

## DashBoard

### 1、部署Dashboard

**1、** 下载yaml，并运行Dashboard；

```java
# 下载yaml
[root@k8s-master01 ~]# wget [https://raw.githubusercontent.com/kubernetes/dashboard/v2.0.0/aio/deploy/recommended.yaml][https_raw.githubusercontent.com_kubernetes_dashboard_v2.0.0_aio_deploy_recommended.yaml]
# 修改kubernetes-dashboard的Service类型
kind: Service
apiVersion: v1
metadata:
labels:
k8s-app: kubernetes-dashboard
name: kubernetes-dashboard
namespace: kubernetes-dashboard
spec:
type: NodePort # 新增
ports:
\-port: 443
targetPort: 8443
nodePort: 30009 # 新增
selector:
k8s-app: kubernetes-dashboard
# 部署
[root@k8s-master01 ~]# kubectl create -f recommended.yaml
# 查看namespace下的kubernetes-dashboard下的资源
[root@k8s-master01 ~]# kubectl get pod,svc -n kubernetes-dashboard
NAME READY STATUS RESTARTS AGE
pod/dashboard-metrics-scraper-c79c65bb7-zwfvw 1/1 Running 0 111s
pod/kubernetes-dashboard-56484d4c5-z95z5 1/1 Running 0 111s
NAME TYPE CLUSTER-IP EXTERNAL-IP PORT(S) AGE
service/dashboard-metrics-scraper ClusterIP 10.96.89.218 <none> 8000/TCP 111s
service/kubernetes-dashboard NodePort 10.104.178.171 <none> 443:30009/TCP 111s
```

2）创建访问账户，获取token

```java
# 创建账号
[root@k8s-master01-1 ~]# kubectl create serviceaccount dashboard-admin -n kubernetes-dashboard
# 授权
[root@k8s-master01-1 ~]# kubectl create clusterrolebinding dashboard-admin-rb --clusterrole=cluster-admin --serviceaccount=kubernetes-dashboard:dashboard-admin
# 获取账号token
[root@k8s-master01 ~]# kubectl get secrets -n kubernetes-dashboard | grep dashboard-admin
dashboard-admin-token-x2x2d kubernetes.io/service-account-token 3 20s
[root@k8s-master01 ~]# kubectl describe secrets dashboard-admin-token-x2x2d -n kubernetes-dashboard
Name: dashboard-admin-token-xbqhh
Namespace: kubernetes-dashboard
Labels: <none>
Annotations: kubernetes.io/service-account.name: dashboard-admin
kubernetes.io/service-account.uid: 95d84d80-be7a-4d10-a2e0-68f90222d039
Type: kubernetes.io/service-account-token
Data
====
ca.crt: 1025 bytes
namespace: 20 bytes
token:
eyJhbGciOiJSUzI1NiIsImtpZCI6ImhvNXBVV3FxZGRxMnpNNkk3UFoxM0pVZmI5VEtmX3A0YWtwdTJKQ1ZFWWcifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJrdWJlcm5ldGVzLWRhc2hib2FyZCIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VjcmV0Lm5hbWUiOiJkYXNoYm9hcmQtYWRtaW4tdG9rZW4teDJ4MmQiLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlcnZpY2UtYWNjb3VudC5uYW1lIjoiZGFzaGJvYXJkLWFkbWluIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQudWlkIjoiNWJmOGE0ZWMtYjVmOS00ODhlLWJkZGItNjk1MTAxZTEzMmM0Iiwic3ViIjoic3lzdGVtOnNlcnZpY2VhY2NvdW50Omt1YmVybmV0ZXMtZGFzaGJvYXJkOmRhc2hib2FyZC1hZG1pbiJ9.C4wkD\_w9mttgSaJl2zLx6Oa5wmqcmHSTkVCiCDeeEfSVBIL7B6Ws-3macl\_Dpb48IDZc0mCV7Fe9O-w8uWX6vPVebTcR8O74cysJeqpECIHIv3etukhWI5s63WS5sclL7k8N4LOBk3Z7rn8dsABpXmycRmHRGAI-LYsaXYVmmXun-3Rq0TqR2CzT7TlAnYkdrC1B-G2k18l3jL6FlOdchLpY8FsPX17dPBrs5cMRyvQZsfuwI0XBD5Ao1wLqippyrIMxI5xHzfDYuRxR0PFG280PFl3iXgsjqNpFSgvp8VzOyGFq8dELo\_L8MjMtBuJfvDAtGF9o\_6KxfjnSsoNPxg
```

通过浏览器访问Dashboard的UI

[https://master](https://master/)节点外网Ip:30009/#/login

在登录页面上输入上面的token

```java
eyJhbGciOiJSUzI1NiIsImtpZCI6ImhvNXBVV3FxZGRxMnpNNkk3UFoxM0pVZmI5VEtmX3A0YWtwdTJKQ1ZFWWcifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJrdWJlcm5ldGVzLWRhc2hib2FyZCIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VjcmV0Lm5hbWUiOiJkYXNoYm9hcmQtYWRtaW4tdG9rZW4teDJ4MmQiLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlcnZpY2UtYWNjb3VudC5uYW1lIjoiZGFzaGJvYXJkLWFkbWluIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQudWlkIjoiNWJmOGE0ZWMtYjVmOS00ODhlLWJkZGItNjk1MTAxZTEzMmM0Iiwic3ViIjoic3lzdGVtOnNlcnZpY2VhY2NvdW50Omt1YmVybmV0ZXMtZGFzaGJvYXJkOmRhc2hib2FyZC1hZG1pbiJ9.C4wkD\_w9mttgSaJl2zLx6Oa5wmqcmHSTkVCiCDeeEfSVBIL7B6Ws-3macl\_Dpb48IDZc0mCV7Fe9O-w8uWX6vPVebTcR8O74cysJeqpECIHIv3etukhWI5s63WS5sclL7k8N4LOBk3Z7rn8dsABpXmycRmHRGAI-LYsaXYVmmXun-3Rq0TqR2CzT7TlAnYkdrC1B-G2k18l3jL6FlOdchLpY8FsPX17dPBrs5cMRyvQZsfuwI0XBD5Ao1wLqippyrIMxI5xHzfDYuRxR0PFG280PFl3iXgsjqNpFSgvp8VzOyGFq8dELo\_L8MjMtBuJfvDAtGF9o\_6KxfjnSsoNPxg
```

### 2、使用DashBoard

本章节以Deployment为例演示DashBoard的使用

**查看**

选择指定的命名空间`dev`，然后点击`Deployments`，查看dev空间下的所有deployment

**扩缩容**

在`Deployment`上点击`规模`，然后指定`目标副本数量`，点击确定

**编辑**

在`Deployment`上点击`编辑`，然后修改`yaml文件`，点击确定

**查看Pod**

点击`Pods`, 查看pods列表

**操作Pod**

选中某个Pod，可以对其执行日志（logs）、进入执行（exec）、编辑、删除操作
