# 30、Kubernetes 实战 - 为集群添加worker node节点
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/3/30.html
- 分类：容器服务
- 分组：教程目录
## 前言

如何给k8s添加worker node?

## 节点的创建与初始化

需要准备一台centos7服务器，并完成相关的配置，才能加入到k8s集群。

需要完成1~4的过程。或者直接将现有的node节点进行克隆，修改主机和ip地址。

请见：[/zhuanlan/container/kubernetes/3/2.html](/zhuanlan/container/kubernetes/3/2.html)

## 添加node节点

查看当前集群节点

```java
[root@master ~]# kubectl get node
NAME     STATUS   ROLES    AGE   VERSION
master   Ready    master   12d   v1.17.4
node1    Ready    <none>   12d   v1.17.4
node2    Ready    <none>   12d   v1.17.4
```

生成命令加入集群

```java
[root@master ~]# kubectl get node
NAME     STATUS   ROLES    AGE   VERSION
master   Ready    master   12d   v1.17.4
node1    Ready    <none>   12d   v1.17.4
node2    Ready    <none>   12d   v1.17.4
# 生成join命令,在master节点上执行
[root@master ~]# kubeadm token create --print-join-command
W1020 18:18:07.062023   91749 validation.go:28] Cannot validate kube-proxy config - no validator is available
W1020 18:18:07.062130   91749 validation.go:28] Cannot validate kubelet config - no validator is available
kubeadm join 192.168.88.100:6443 --token 9p9ztp.ueb8qh9f7wdog4i1     --discovery-token-ca-cert-hash sha256:3a77b5c3bee41edf3fa8e68a4b591bedf53d0b8a2d4cccc9c50e89733acb0012 
```

> 注意:生成的密令有效期24小时

在待节点的workder node节点执行join命令

```java
kubeadm join 192.168.88.100:6443 --token 9p9ztp.ueb8qh9f7wdog4i1     --discovery-token-ca-cert-hash sha256:3a77b5c3bee41edf3fa8e68a4b591bedf53d0b8a2d4cccc9c50e89733acb0012 
```

在添加完成之后，查看集群节点

## 移除节点

```java
# 只在 worker 节点执行
kubeadm reset
# 只在 master 节点执行
kubectl delete node demo-worker-x-x
```
