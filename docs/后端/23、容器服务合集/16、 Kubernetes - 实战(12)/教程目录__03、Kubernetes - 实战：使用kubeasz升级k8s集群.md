# 03、Kubernetes - 实战：使用kubeasz升级k8s集群
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/12/3.html
- 分类：容器服务
- 分组：教程目录
## 一、实验环境

```java
OS:
root@harbor:~# cat /etc/issue
Ubuntu 20.04.2 LTS \n \l
IP分配：
192.168.1.100 k8s-deploy
192.168.1.101 k8s-master1 etcd1
192.168.1.102 k8s-master2 etcd2
192.168.1.103 k8s-master3 etcd3
192.168.1.104 k8s-node1
192.168.1.105 k8s-node2
192.168.1.106 k8s-node3
192.168.1.107 harbor
192.168.1.108 haproxy1
192.168.1.109 haproxy2
VIP：
192.168.1.188
```

## 2、升级kubernetes到v1.21.4

### 1)下载kubernetes v1.12.5版本的二进制软件

[https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG/CHANGELOG-1.21.md#downloads-for-v1215](https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG/CHANGELOG-1.21.md#downloads-for-v1215)

```java
下载：
Source Code: kubernetes.tar.gz  
Client Binaries: kubernetes-client-linux-amd64.tar.gz
Server Binaries: kubernetes-server-linux-amd64.tar.gz
Node Binaries: kubernetes-node-linux-amd64.tar.gz
```

#注意：不要下载错误的cpu架构

```java
root@k8s-deploy:~/bin# pwd
/root/bin
root@k8s-deploy:~/bin# ls
kubernetes-client-linux-amd64.tar.gz  kubernetes-node-linux-amd64.tar.gz  kubernetes-server-linux-amd64.tar.gz  kubernetes.tar.gz
root@k8s-deploy:~/bin# tar xf kubernetes.tar.gz 
root@k8s-deploy:~/bin# tar xf kubernetes-client-linux-amd64.tar.gz 
root@k8s-deploy:~/bin# tar xf kubernetes-node-linux-amd64.tar.gz 
root@k8s-deploy:~/bin# tar xf kubernetes-server-linux-amd64.tar.gz 
root@k8s-deploy:~/bin# ll kubernetes
total 35296
drwxr-xr-x 10 root root     4096 Aug 12  2021 ./
drwxr-xr-x  3 root root     4096 Feb 14 21:52 ../
drwxr-xr-x  3 root root     4096 Aug 12  2021 LICENSES/
-rw-r--r--  1 root root     3387 Aug 12  2021 README.md
drwxr-xr-x  2 root root     4096 Aug 12  2021 addons/
drwxr-xr-x  3 root root     4096 Aug 12  2021 client/
drwxr-xr-x  9 root root     4096 Aug 12  2021 cluster/
drwxr-xr-x  2 root root     4096 Aug 12  2021 docs/
drwxr-xr-x  3 root root     4096 Aug 12  2021 hack/
-rw-r--r--  1 root root 36093737 Aug 12  2021 kubernetes-src.tar.gz
drwxr-xr-x  3 root root     4096 Aug 12  2021 node/
drwxr-xr-x  3 root root     4096 Aug 12  2021 server/
-rw-r--r--  1 root root        8 Aug 12  2021 version
```

### 2）升级master节点

```java
#在node节点上剔除k8s-master节点
#第一步从所有的node节点的负载均衡中剔除k8s-master01节点
#以k8s-node01为例：k8s-node02和k8s-node03操作一样
root@k8s-node1:~# vim /etc/haproxy/haproxy.cfg 
global
        log /dev/log    local1 warning
        chroot /var/lib/haproxy
        user haproxy
        group haproxy
        daemon
        nbproc 1
defaults
        log     global
        timeout connect 5s
        timeout client  10m
        timeout server  10m
listen kube_master
        bind 127.0.0.1:6443
        mode tcp
        option tcplog
        option dontlognull
        option dontlog-normal
        balance roundrobin 
       server 192.168.1.101 192.168.1.101:6443 check inter 10s fall 2 rise 2 weight 1   剔除k8s-master1
        server 192.168.1.102 192.168.1.102:6443 check inter 10s fall 2 rise 2 weight 1
        server 192.168.1.103 192.168.1.103:6443 check inter 10s fall 2 rise 2 weight 1
#第二步所有node节点重启haproxy
root@k8s-node1:~# systemctl restart haproxy
root@k8s-node2:~# systemctl restart haproxy
root@k8s-node3:~# systemctl restart haproxy
#在master节点上操作，升级master节点
#以k8s-master1为例
#第三步停止master节点上kube-apiserver kube-controller-manager kube-proxy kube-scheduler kubelet服务
root@k8s-master1:~# systemctl  stop kube-apiserver kube-controller-manager kube-proxy kube-scheduler kubelet
#第四步拷贝v1.21.4的kube-apiserver kube-controller-manager kube-proxy kube-scheduler kubelet二进制文件覆盖老版本的二进制文件
root@k8s-deploy:~# cd /root/bin/kubernetes/server/bin/
root@k8s-deploy:~/bin/kubernetes/server/bin# scp kube-apiserver kube-controller-manager kube-scheduler kube-proxy kubelet 192.168.1.101:/opt/kube/bin/
#第五步重启master节点上kube-apiserver kube-controller-manager kube-proxy kube-scheduler kubelet服务
root@k8s-master1:~# systemctl  start kube-apiserver kube-controller-manager kube-proxy kube-scheduler kubelet
#在所有node节点操作
#第六步将k8s-master1重新添加进所有node节点的haproxy配置文件并重启haproxy
#以k8s-node1为例
root@k8s-node1:~# vim /etc/haproxy/haproxy.cfg
global
        log /dev/log    local1 warning
        chroot /var/lib/haproxy
        user haproxy
        group haproxy
        daemon
        nbproc 1
defaults
        log     global
        timeout connect 5s
        timeout client  10m
        timeout server  10m
listen kube_master
        bind 127.0.0.1:6443
        mode tcp
        option tcplog
        option dontlognull
        option dontlog-normal
        balance roundrobin 
        server 192.168.1.101 192.168.1.101:6443 check inter 10s fall 2 rise 2 weight 1
        server 192.168.1.102 192.168.1.102:6443 check inter 10s fall 2 rise 2 weight 1
        server 192.168.1.103 192.168.1.103:6443 check inter 10s fall 2 rise 2 weight 1
root@k8s-node01:~# systemctl restart kube-lb.service 
#第七步验证k8s-master1的版本信息
root@k8s-deploy:~# kubectl  get no
NAME            STATUS                     ROLES    AGE   VERSION
192.168.1.101   Ready,SchedulingDisabled   master   23h   v1.21.4
192.168.1.102   Ready,SchedulingDisabled   master   23h   v1.20.2
192.168.1.103   Ready,SchedulingDisabled   master   23h   v1.20.2
192.168.1.104   Ready                      node     23h   v1.20.2
192.168.1.105   Ready                      node     23h   v1.20.2
192.168.1.106   Ready                      node     23h   v1.20.2
#第八步升级k8s-master2和k8s-master3
#k8s-master2和k8s-master3升级步骤与k8s-master1一致
#验证master节点
root@k8s-deploy:~# kubectl  get no
NAME            STATUS                     ROLES    AGE   VERSION
192.168.1.101   Ready,SchedulingDisabled   master   23h   v1.21.4
192.168.1.102   Ready,SchedulingDisabled   master   23h   v1.21.4
192.168.1.103   Ready,SchedulingDisabled   master   23h   v1.21.4
192.168.1.104   Ready                      node     23h   v1.20.2
192.168.1.105   Ready                      node     23h   v1.20.2
192.168.1.106   Ready                      node     23h   v1.20.2
```

### 3）升级node节点

```java
#以k8s-node1为例，k8s-node2和k8s-node3通k8s-node1一样
#第一步:驱逐该k8s-node1节点上的所有pod
#在master节点上操作
root@k8s-deploy:~# kubectl drain 192.168.1.104
node/192.168.1.104 cordoned
error: unable to drain node "192.168.1.104", aborting command...
There are pending nodes to be drained:
 192.168.1.104
error: cannot delete DaemonSet-managed Pods (use --ignore-daemonsets to ignore): kube-system/calico-node-cvmn8
#需要添加--ignore-daemonsets 来清除daemonset
root@k8s-deploy:~# kubectl drain 192.168.1.104 --ignore-daemonsets
node/192.168.1.104 already cordoned
WARNING: ignoring DaemonSet-managed Pods: kube-system/calico-node-cvmn8
evicting pod kube-system/coredns-c5bb68557-jcq9r
pod/coredns-c5bb68557-jcq9r evicted
node/192.168.1.104 evicted
root@k8s-deploy:~# kubectl get no
NAME            STATUS                     ROLES    AGE   VERSION
192.168.1.101   Ready,SchedulingDisabled   master   23h   v1.21.4
192.168.1.102   Ready,SchedulingDisabled   master   23h   v1.21.4
192.168.1.103   Ready,SchedulingDisabled   master   23h   v1.21.4
192.168.1.104   Ready,SchedulingDisabled   node     23h   v1.20.2  node1 不在调度
192.168.1.105   Ready                      node     23h   v1.20.2
192.168.1.106   Ready                      node     23h   v1.20.2
#第二步:停止K8s-node1上的kubelet和kube-proxy服务
root@k8s-node1:~# systemctl stop kubelet kube-proxy
#第三步:把v1.21.4版本的kubelet和kube-proxy从k8s-deploy上拷贝过来
root@k8s-deploy:~# cd /root/bin/kubernetes/server/bin/
root@k8s-deploy:~/bin/kubernetes/server/bin# scp kubelet kube-proxy 192.168.1.104:/opt/kube/bin/
#第四步:在k8s-node1上重启kubelet和kube-proxy服务
root@k8s-node1:~# systemctl start kubelet kube-proxy
#第五步:取消k8s-node1上不调度pod的设置
root@k8s-deploy:~# kubectl uncordon 192.168.1.104
node/192.168.1.104 uncordoned
root@k8s-deploy:~# kubectl get no
NAME            STATUS                     ROLES    AGE   VERSION
192.168.1.101   Ready,SchedulingDisabled   master   23h   v1.21.4
192.168.1.102   Ready,SchedulingDisabled   master   23h   v1.21.4
192.168.1.103   Ready,SchedulingDisabled   master   23h   v1.21.4
192.168.1.104   Ready                      node     23h   v1.21.4
192.168.1.105   Ready                      node     23h   v1.20.2
192.168.1.106   Ready                      node     23h   v1.20.2
#第六步:升级k8s-node02和k8s-node03，操作与k8s-node01一样
#第七步:验证
root@k8s-deploy:~# kubectl get no
NAME            STATUS                     ROLES    AGE   VERSION
192.168.1.101   Ready,SchedulingDisabled   master   23h   v1.21.4
192.168.1.102   Ready,SchedulingDisabled   master   23h   v1.21.4
192.168.1.103   Ready,SchedulingDisabled   master   23h   v1.21.4
192.168.1.104   Ready                      node     23h   v1.21.4
192.168.1.105   Ready                      node     23h   v1.21.4
192.168.1.106   Ready                      node     23h   v1.21.4
```
