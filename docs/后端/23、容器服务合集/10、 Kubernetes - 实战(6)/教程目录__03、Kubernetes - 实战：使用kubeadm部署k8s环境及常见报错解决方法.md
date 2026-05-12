# 03、Kubernetes - 实战：使用kubeadm部署k8s环境及常见报错解决方法
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/6/3.html
- 分类：容器服务
- 分组：教程目录
## k8s集群安装

**环境说明：**

k8s-Master-Centos8 ip：192.168.152.53

k8s-Node1-Centos7 ip：192.168.152.253

k8s-Node2-Centos8 ip：192.168.152.252

**注意**：

Master与Node节点操作步骤基本一致

Node节点只需配置到本文的第6步即可

## 1、前期准备

```java
#关闭防火墙
[root@Centos8 ~]# systemctl stop firewalld.service 
#关闭SElinux，永久关闭可修改/etc/selinux/config文件
[root@Centos8 ~]# setenforce 0    
#关闭Swap分区，防止将K8S安装至swap内存中
[root@Centos8 ~]# swapoff -a
[root@Centos8 ~]# sed -i '/swap/ s/^/#/g' /etc/fstab
#安装iptables并设置为空规则及开机自启
yum -y install iptables-services iptables
systemctl enable --now iptables.service
iptables -F 清空规则
service iptables save 保存
iptables -L 检查是否为空规则
```

## 2、升级内核，建议 >= 4.4

```java
#—————————————— Centos8 ————————————————#
#——————Centos8最好不要做升级，如果非要要建议也升级到4.4 ————————#
#——————以下只是演示升级过程，真实不要升级到5.6，貌似本身不支持nf_conntrack_ipv4 ————————#
#安装ELrepo仓库
rpm --import https://www.elrepo.org/RPM-GPG-KEY-elrepo.org
yum install https://www.elrepo.org/elrepo-release-8.0-2.el8.elrepo.noarch.rpm
#查看可用的系统内核包
yum --disablerepo="*" --enablerepo="elrepo-kernel" list available
#安装内核
yum --enablerepo=elrepo-kernel install kernel-ml
# 安装完毕后，查看现有所有内核
grubby --info=ALL
#设置启动内核
grubby --set-default /boot/vmlinuz-5.6.2-1.el8.elrepo.x86_64
#———————————————— Centos7 ————————————————#
#下载内核rpm包
rpm -Uvh http://www.elrepo.org/elrepo-release-7.0-3.el7.elrepo.noarch.rpm
#指定包名安装新版kernel
yum --enablerepo=elrepo-kernel install -y kernel-lt
#设置默认启动的内核
grub2-set-default 'CentOS Linux (4.4.218-1.el7.elrepo.x86_64) 7 (Core)'
#———————————————— 以下相同 ————————————————#
#重启生效
systemctl reboot
#重新查看内核版本
[root@Centos8 ~]# uname -r
5.6.2-1.el8.elrepo.x86_64
```

## 3、设置kube-proxy开启ipvs的前置条件(centos7及以上一般默认都开启)

```java
modprobe br_netfilter
cat > /etc/sysconfig/modules/ipvs.modules <<EOF
#!/bin/bash
modprobe -- ip_vs
modprobe -- ip_vs_rr
modprobe -- ip_vs_wrr
modprobe -- ip_vs_sh
modprobe -- nf_conntrack_ipv4
EOF
chmod 755 /etc/sysconfig/modules/ipvs.modules && bash /etc/sysconfig/modules/ipvs.modules
# 查看是否加载成功ipvs模块
lsmod | grep -e ip_vs -e nf_conntrack_ipv4
```

nf_conntrack_ipv4 20480 4

nf_defrag_ipv4 16384 1 nf_conntrack_ipv4

ip_vs_sh 16384 0

ip_vs_wrr 16384 0

ip_vs_rr 16384 0

ip_vs 147456 6 ip_vs_rr,ip_vs_sh,ip_vs_wrr

nf_conntrack 114688 9 ip_vs,nf_nat,nf_nat_ipv4,nf_nat_ipv6,xt_conntrack,nf_nat_masquerade_ipv4,nf_conntrack_netlink,nf_conntrack_ipv4,nf_conntrack_ipv6

libcrc32c 16384 2 xfs,ip_vs

## 4、安装Docker

```java
#安装环境
yum install -y yum-utils device-mapper-persistent-data lvm2
#添加docker仓库
yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
#安装dpcker
yum -y install docker-ce
报错：
   package docker-ce-3:19.03.8-3.el7.x86_64 requires containerd.io >= 1.2.2-3, but none of the providers can be installed
先安装containerd.io >= 1.2.2-3：
dnf install https://download.docker.com/linux/centos/7/x86_64/stable/Packages/containerd.io-1.2.6-3.3.el7.x86_64.rpm
再次安装docker：
yum -y install docker-ce
#启动docker，并设置开机自启
systemctl enable --now docker.service
#配置daemon.设置默认的cgroup组为systemd，并使docker的日志以json形式输出
#并将镜像仓库源更改为阿里云镜像源
cat > /etc/docker/daemon.json <<EOF
{
    "exec-opts": ["native.cgroupdriver=systemd"],
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "100m"
    },
"registry-mirrors": ["https://f1bhsuge.mirror.aliyuncs.com"]
}
EOF
#创建配置文件目录
mkdir -p /etc/systemd/system/docker.service.d
#重新加载daemon 及 重启docker
systemctl daemon-reload && systemctl restart docker.service
```

## 5、安装Kubeadm（主从配置）

```java
#配置yum仓库
cat <<EOF > /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=http://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64
enabled=1
gpgcheck=0
repo_gpgcheck=0
gpgkey=http://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg
EOF
#安装kubeadm、kubectl、kubelet
yum -y install kubeadm-1.15.1 kubectl-1.15.1 kubelet-1.15.1
#设置开机自启，暂时不开启服务
systemctl enable kubelet.service
```

## 6、拉取初始化镜像

**（1）两种方法，第一种可以通过以下脚本完成导入**

```java
vim initimage.sh
...
#!/usr/bin/env bash
K8S_VERSION=v1.15.1
ETCD_VERSION=3.3.10
DASHBOARD_VERSION=v1.8.3
FLANNEL_VERSION=v0.10.0-amd64
DNS_VERSION=1.3.1
PAUSE_VERSION=3.1
# 基本组件
docker pull mirrorgooglecontainers/kube-apiserver-amd64:$K8S_VERSION
docker pull mirrorgooglecontainers/kube-controller-manager-amd64:$K8S_VERSION
docker pull mirrorgooglecontainers/kube-scheduler-amd64:$K8S_VERSION
docker pull mirrorgooglecontainers/kube-proxy-amd64:$K8S_VERSION
docker pull mirrorgooglecontainers/etcd-amd64:$ETCD_VERSION
docker pull mirrorgooglecontainers/pause:$PAUSE_VERSION
docker pull coredns/coredns:$DNS_VERSION
# 修改tag
docker tag mirrorgooglecontainers/kube-apiserver-amd64:$K8S_VERSION k8s.gcr.io/kube-apiserver:$K8S_VERSION
docker tag mirrorgooglecontainers/kube-controller-manager-amd64:$K8S_VERSION k8s.gcr.io/kube-controller-manager:$K8S_VERSION
docker tag mirrorgooglecontainers/kube-scheduler-amd64:$K8S_VERSION k8s.gcr.io/kube-scheduler:$K8S_VERSION
docker tag mirrorgooglecontainers/kube-proxy-amd64:$K8S_VERSION k8s.gcr.io/kube-proxy:$K8S_VERSION
docker tag mirrorgooglecontainers/etcd-amd64:$ETCD_VERSION k8s.gcr.io/etcd:$ETCD_VERSION
docker tag mirrorgooglecontainers/pause:$PAUSE_VERSION k8s.gcr.io/pause:$PAUSE_VERSION
docker tag coredns/coredns:$DNS_VERSION k8s.gcr.io/coredns:$DNS_VERSION
#删除冗余的images
docker rmi mirrorgooglecontainers/kube-apiserver-amd64:$K8S_VERSION
docker rmi mirrorgooglecontainers/kube-controller-manager-amd64:$K8S_VERSION
docker rmi mirrorgooglecontainers/kube-scheduler-amd64:$K8S_VERSION
docker rmi mirrorgooglecontainers/kube-proxy-amd64:$K8S_VERSION
docker rmi mirrorgooglecontainers/etcd-amd64:$ETCD_VERSION
docker rmi mirrorgooglecontainers/pause:$PAUSE_VERSION
docker rmi coredns/coredns:$DNS_VERSION
...
chmod +x initimage.sh
#执行此脚本，开始导入镜像...
./initimage.sh
[root@Centos8 ]# docker images 
REPOSITORY                           TAG                 IMAGE ID            CREATED             SIZE
quay.io/coreos/flannel               v0.12.0-amd64       4e9f801d2217        4 weeks ago         52.8MB
k8s.gcr.io/kube-scheduler            v1.15.1             b0b3c4c404da        8 months ago        81.1MB
k8s.gcr.io/kube-controller-manager   v1.15.1             d75082f1d121        8 months ago        159MB
k8s.gcr.io/kube-proxy                v1.15.1             89a062da739d        8 months ago        82.4MB
k8s.gcr.io/kube-apiserver            v1.15.1             68c3eb07bfc3        8 months ago        207MB
k8s.gcr.io/coredns                   1.3.1               eb516548c180        15 months ago       40.3MB
k8s.gcr.io/etcd                      3.3.10              2c4adeb21b4f        16 months ago       258MB
k8s.gcr.io/pause                     3.1                 da86e6ba6ca1        2 years ago         742kB
```

**（2） 第二种可以在k8s配置文件初始化后，也就是下边的第七步之后，再执行导入镜像操作**

**7、初始化主节点**

```java
#打印k8s默认的初始化配置文件至kubeadm-conf.yaml中
kubeadm config print init-defaults > kubeadm-conf.yaml
#修改kubeadm-conf.yaml
vim kubeadm-conf.yaml
...
apiVersion: kubeadm.k8s.io/v1beta2
bootstrapTokens:
- groups:
  - system:bootstrappers:kubeadm:default-node-token
  token: abcdef.0123456789abcdef
  ttl: 24h0m0s
  usages:
  - signing
  - authentication
kind: InitConfiguration
localAPIEndpoint:
  advertiseAddress: 192.168.152.53   此处需要修改为你的真实ip
  bindPort: 6443
nodeRegistration:
  criSocket: /var/run/dockershim.sock
  name: centos8
  taints:
  - effect: NoSchedule
    key: node-role.kubernetes.io/master
---
apiServer:
  timeoutForControlPlane: 4m0s
apiVersion: kubeadm.k8s.io/v1beta2
certificatesDir: /etc/kubernetes/pki
clusterName: kubernetes
controllerManager: {}
dns:
  type: CoreDNS
etcd:
  local:
    dataDir: /var/lib/etcd
imageRepository: registry.cn-hangzhou.aliyuncs.com/google_containers#镜像站点的更改，也可以不改
kind: ClusterConfiguration
kubernetesVersion: v1.15.1  版本信息修改一致
networking:
  dnsDomain: cluster.local
  podSubnet: "10.244.0.0/16" 添加此配置，用于指定flannel的默认PodNet网段
  serviceSubnet: 10.96.0.0/12
scheduler: {}
---   以下为新增配置，将默认的调度方式改为ipvs
apiVersion: kubeproxy.config.k8s.io/v1alpha1
kind: KubeProxyConfiguration
featureGates:
  SupportIPVSProxyMode: true
mode: ipvs
...
# 提前拉取配置文件种所需要的image，对应上边第6步的(2)
```

```java
kubeadm config images pull --config kubeadm-conf.yaml
```

```java
#开始初始化
kubeadm init --config=kubeadm-config.yaml --experimental-upload-certs | tee kubeadm-init.log
报错：
    [ERROR NumCPU]: the number of available CPUs 1 is less than the required 2
    很明显，cpu数目小于所需的2，重新设置一个虚拟机CPU个数就ok
初始化成功回显：
To start using your cluster, you need to run the following as a regular user:
  mkdir -p $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config
kubeadm join 192.168.152.53:6443 --token abcdef.0123456789abcdef \
    --discovery-token-ca-cert-hash sha256:50ca5375950abfa05cd4bd37dfb60e9ccd078083aeca49fa8bb6275c13d2a2cd 
#根据回显创建文件及目录
#目的为保存 kubectl 与 api server 交互时的缓存，交互过程为https协议
mkdir -p $HOME/.kube
cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
chown $(id -u):$(id -g) $HOME/.kube/config
#查看当前拥有节点，可见状态为NotReady，是因为没有添加网络
[root@Centos8 .kube]# kubectl get node 
NAME      STATUS     ROLES    AGE    VERSION
centos8   NotReady   master   4m1s   v1.15.1
```

**8、添加flannel网络**

**（1）第一种**

```java
mkdir -p install-k8s/plugin/flannel
mkdir -p install-k8s/core
cd install-k8s/core
mv /etc/kubernetes/kubeadm-init.log /etc/kubernetes/kubeadm-config.yaml ./
cd ../plugin/flannel
#下载flannel.yml
wget https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
#执行yaml文件
kubectl create -f kube-flannel.yml
#构建完成，查看当前名称空间为kube-system的pod状态，-n 指定名称空间
[root@Centos8 core]# kubectl get pod -n kube-system
NAME                              READY   STATUS             RESTARTS   AGE
coredns-5c98db65d4-5gwmj          0/1     CrashLoopBackOff   22         91m
coredns-5c98db65d4-c277w          0/1     CrashLoopBackOff   22         91m
etcd-centos8                      1/1     Running            0          90m
kube-apiserver-centos8            1/1     Running            0          90m
kube-controller-manager-centos8   1/1     Running            0          90m
kube-flannel-ds-amd64-ggghn       1/1     Running            0          8m45s
kube-proxy-gslw2                  1/1     Running            0          91m
kube-scheduler-centos8            1/1     Running            0          90m
#构建完成后，网卡界面会显示flannel信息
[root@Centos8 core]# ifconfig
flannel.1: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1450
        inet 10.244.0.0  netmask 255.255.255.255  broadcast 0.0.0.0
        inet6 fe80::4019:beff:fe7c:5582  prefixlen 64  scopeid 0x20<link>
        ether 42:19:be:7c:55:82  txqueuelen 0  (Ethernet)
        RX packets 0  bytes 0 (0.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 0  bytes 0 (0.0 B)
        TX errors 0  dropped 13 overruns 0  carrier 0  collisions 0
　#网络加载成功，状态变为Ready
　[root@Centos8 ~]# kubectl get node 
　NAME 　 STATUS ROLES AGE VERSION
　centos8 Ready master 53d v1.15.1
```

（2）第二种，当 kubectl create -f kube-flannel.yml 时，镜像导入不成功，或者因为网络问题导致失败时

```java
# 修改主机hosts文件
echo "199.232.28.133  raw.githubusercontent.com" >> /etc/hosts
# 然后下载flannel文件
curl -o kube-flannel.yml   https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
# 编辑镜像源，默认的镜像地址我们修改一下。把yaml文件中所有的quay.io 修改为quay-mirror.qiniu.com
sed -i 's/quay.io/quay-mirror.qiniu.com/g' kube-flannel.yml
# 最后再执行创建命令就可以啦
kubectl apply -f kube-flannel.yml 
```

**9、配置从节点与主节点关联**

```java
# 直接将kubeadm-init.log的最后一句回显在node节点运行即可
[root@kube-node2 ~]# kubeadm join 192.168.152.53:6443 --token abcdef.0123456789abcdef \
>     --discovery-token-ca-cert-hash sha256:c291b4fc646b5925299f8cdf7fafe33ad9c0505a1609041d8c8214d104eb08da
[root@kube-node2 ~]# kubeadm join 192.168.152.53:6443 --token abcdef.0123456789abcdef \
>     --discovery-token-ca-cert-hash sha256:c291b4fc646b5925299f8cdf7fafe33ad9c0505a1609041d8c8214d104eb08da
```

**遇到的问题及启动服务报错：**

**1、** W041204:57:19.803140846watcher.go:87]Errorwhileprocessingevent("/sys/fs/cgroup/devices/libcontainer_30695_systemd_test_default.slice":0x40000100==IN_CREATE|IN_ISDIR):inotify_add_watch/sys/fs/cgroup/devices/libcontainer_30695_systemd_test_default.slice:nosuchfileordirectory；

```java
## 问题的原因是docker与kubelet的cgroup组不一致
## 查看kubeadm的配置文件位置
[root@Centos8 ~]# rpm -ql kubeadm
/usr/bin/kubeadm
/usr/lib/systemd/system/kubelet.service.d/10-kubeadm.conf
## 修改配置文件,将kubelet的cgroup改为systemd
vim /usr/lib/systemd/system/kubelet.service.d/10-kubeadm.conf
...
Environment="KUBELET_CONFIG_ARGS=--config=/var/lib/kubelet/config.yaml --cgroup-driver=systemd" ... 重新加载配置文件及重启服务 [root@Centos8 ~]# systemctl daemon-reload [root@Centos8 ~]# systemctl restart kubelet.service 
```

**2、** node2节点的flannel一直报错；

```java
## 还未找到根本原因，正在排错，如有大佬路过，希望指点
kube-flannel-ds-amd64-b47l9       0/1     Init:ErrImagePull   0          3m50s
```

**3、** 如果需要重新安装master节点，执行：；

```java
# kubeadm reset
然后再进行重新安装
```

**4、** 如果需要重新安装node节点，执行：；

```java
# kubectl drain <node name> --delete-local-data --force --ignore-daemonsets
# kubectl delete node <node name>
或
kubeadm reset直接重新join
```

**5、** node节点加入master时报错：errorexecutionphasepreflight:couldn'tvalidatetheidentityoftheAPIServer:abortconnectingtoAPIserversaftertimeoutof5m0s；

原因：master的token过期了，需要重新创建

解决：

```java
Master：
[root@Centos8 ~]# kubeadm token create
blopur.fn8gtr06gsjlq7yi
Node：
kubeadm join 192.168.152.53:6443 --token blopur.fn8gtr06gsjlq7yi --discovery-token-ca-cert-hash sha256:c291b4fc646b5925299f8cdf7fafe33ad9c0505a1609041d8c8214d104eb08da
```

**6、** node2节点加入master后，systemctlstatuskubelet.service报错：Unabletoupdatecniconfig:Nonetworksfoundin/etc/cni/net.d；

```java
vim /usr/lib/systemd/system/kubelet.service.d/10-kubeadm.conf
...
添加：
Environment="KUBELET_NETWORK_ARGS=--network-plugin=cni --cni-conf-dir=/etc/cni/ --cni-bin-dir=/opt/cni/bin"
...
systemctl daemon-reload && systemctl restart kubelet.service
```

**7、** node2节点加入master后，systemctlstatuskubelet.service报错：open/run/flannel/subnet.env:nosuchfileordirectory；

```java
## 将master节点的/run/flannel/subnet.env文件拷贝到此处即可
[root@Centos8 flannel]# scp subnet.env kubenode2:/run/flannel/
## 重启
systemctl restart kubelet.service   
```

**补充：**

node节点为了方便以后的部署和扩展，我采用Ansible自动化安装docker及k8s。

**ansible服务端为k8s的MASTER端：192.168.152.53**

**客户端根据node节点需求来控制**

```java
### 注意：所有的操作及文件都在192.168.152.53中
[root@Centos8 ansible]# pwd
/root/ansible
*** 先编辑好导入导出images的脚本 ***
[root@Centos8 ansible]# cat saveImages.sh 导出镜像脚本
#!/usr/bin/env bash
IMAGESNAME=(docker images | awk '/ago/{print $1}')
IMAGESTAG=(docker images | awk '/ago/{print $2}')
IPADDR1='192.168.152.253'
IPADDR2='192.168.152.252'
if [[ -d /root/images ]];then
  for i in seq 0 6;do
    docker save > /root/images/${i}.tar.gz ${IMAGESNAME[$i]}:${IMAGESTAG[$i]}
    scp /root/images/${i}.tar.gz ${IPADDR1}:/root/
    scp /root/images/${i}.tar.gz ${IPADDR2}:/root/
  done
else
  mkdir -p /root/images
  for i in seq 0 6;do
    docker save > /root/images/${IMAGESNAME[$i]}.tar.gz ${IMAGESNAME[$i]}:${IMAGESTAG[$i]}
    scp /root/images/${i}.tar.gz ${IPADDR1}:/root/
    scp /root/images/${i}.tar.gz ${IPADDR2}:/root/
  done
fi
[root@Centos8 ansible]# cat loadImages.sh 导入镜像脚本
#!/usr/bin/env bash
for i in seq 0 6;do
  docker load < /root/${i}.tar.gz && rm -f /root/${i}.tar.gz
done
*** 在本地执行saveImages.sh ***
./saveImages.sh
*** 创建PlayBook ***
[root@Centos8 ansible]# vim kuber.yaml
...
---
- name: Install docker and k8s
  hosts: all
  tasks:
  - block:
    - name: Add repository
      shell: yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
    - name: install docker-ass
      yum:
        name:
          - yum-utils
          - device-mapper-persistent-data
          - lvm2
          - https://download.docker.com/linux/centos/7/x86_64/stable/Packages/containerd.io-1.2.6-3.3.el7.x86_64.rpm
          - docker-ce
        state: latest
    - name: mkdir docker.service.d
      file:
        path: '{{ item }}'
        state: directory
      loop:
      - /etc/docker
      - /etc/systemd/system/docker.service.d
    - name: Copy daemon.json
      copy:
        src: /etc/docker/daemon.json
        dest: /etc/docker/daemon.json
    - name: daemon-reload
      shell: systemctl daemon-reload
    - name: Start docker
      service:
        name: docker
        state: restarted
        enabled: yes
    rescue:
    - debug:
        msg: 'docker Installation failed!'
  - name: Copy using inline content
    copy:
      content: 
        '[kubernetes]
        name=Kubernetes
        baseurl=http://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64
        enabled=1
        gpgcheck=0
        repo_gpgcheck=0
        gpgkey=http://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg'
      dest: /etc/yum.repos.d/kubernetes.repo
  - name: Install k8s
    yum:
      name:
        - kubeadm-1.15.1
        - kubectl-1.15.1
        - kubelet-1.15.1
      state: present
  - name: Start kubelet
    service:
      name: kubelet
      state: started
      enabled: yes
  - name: Run script load Images
    script: /root/ansible/loadImages.sh
...
ansible-playbook kuber.yaml 执行，完成，最后在node节点再执行以上第8步即可
```
