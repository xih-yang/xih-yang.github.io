# 18、Kubernetes - 实战：资源监控 Metrics-Server V0.3.6 部署与应用
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/5/18.html
- 分类：容器服务
- 分组：教程目录
## 一、Metrics-Server的部署

Metrics-Server是集群核心监控数据的聚合器，用来替换之前的heapster。

容器相关的 Metrics 主要来自于 kubelet 内置的 cAdvisor 服务，**有了Metrics-Server之后，用户就可以通过标准的 Kubernetes API 来访问到这些监控数据。

必须部署 metrics-server 才能使用该 API，metrics-server 通过调用 Kubelet Summary API 获取数据**。

Metrics Server 并不是 kube-apiserver 的一部分，而是通过 Aggregator 这种插件机制，在独立部署的情况下同 kube-apiserver 一起统一对外服务的。

kube-aggregator 其实就是一个根据 URL 选择具体的 API 后端的代理服务器。

Metrics-server属于Core metrics(核心指标)，提供API metrics.k8s.io，仅提供Node和Pod的CPU和内存使用情况。 而其他Custom Metrics(自定义指标)由Prometheus等组件来完成。

## Metrics-server（v0.3.6）部署：

下载部署文件：

```java
[root@server1 limit]# wget https://github.com/kubernetes-sigs/metrics-server/releases/download/v0.3.6/components.yaml
```

编辑部署文件，主要更改镜像：

```java
[root@server1 limit]# vim components.yaml 
```

可以先下载镜像放到私有仓库。

应用部署文件：

```java
[root@server1 limit]# kubectl apply -f components.yaml
[root@server1 limit]# kubectl get pod -n kube-system 
NAME                              READY   STATUS    RESTARTS   AGE
coredns-7ff77c879f-8gzr5          1/1     Running   19         21d
coredns-7ff77c879f-dxst6          1/1     Running   18         21d
etcd-server1                      1/1     Running   19         21d
kube-apiserver-server1            1/1     Running   19         21d
kube-controller-manager-server1   1/1     Running   56         21d
kube-flannel-ds-amd64-8bj5x       1/1     Running   2          5h49m
kube-flannel-ds-amd64-qwk6c       1/1     Running   28         21d
kube-flannel-ds-amd64-wcqrh       1/1     Running   30         21d
kube-proxy-fvx88                  1/1     Running   17         17d
kube-proxy-m8xrc                  1/1     Running   23         17d
kube-proxy-qsq27                  1/1     Running   17         17d
kube-scheduler-server1            1/1     Running   47         21d
metrics-server-7cdfcc6666-mdmps   1/1     Running   0          15s
```

**部署后正常情况下我们使用kubectl top pod和kubectl top node可以查看pod和node的状态，但是现在执行后发现没有信息：**

```java
[root@server1 limit]# kubectl top node
error: metrics not available yet
[root@server1 limit]# kubectl top pod
W0509 03:12:14.940662    9210 top_pod.go:274] Metrics not available for pod default/nfs-client-provisioner-6b66ddf664-2qf7m, age: 1h35m2.940654525s
error: Metrics not available for pod default/nfs-client-provisioner-6b66ddf664-2qf7m, age: 1h35m2.940654525s
```

## 通过logs解决报错

## 1.解析问题，错误1：dial tcp: lookup server1 on 10.96.0.10:53: no such host

查看Metrics-server的Pod日志：

```java
[root@server1 limit]# kubectl logs metrics-server-7cdfcc6666-mdmps -n kube-system 
```

可以看出是解析的问题：

这是因为没有内网的DNS服务器，所以metrics-server无法解析节点名字。可以直接修**改coredns的configmap**，将各个节点的主机名加入到hosts中，这样所有Pod都可以从CoreDNS中解析各个节点的名字。

```java
[root@server1 limit]# kubectl -n kube-system get cm
NAME                                 DATA   AGE
coredns                              1      21d
extension-apiserver-authentication   6      21d
kube-flannel-cfg                     2      21d
kube-proxy                           2      21d
kubeadm-config                       2      21d
kubelet-config-1.18                  1      21d
[root@server1 limit]# kubectl -n kube-system edit cm coredns 
apiVersion: v1
data:
  Corefile: |
    ...
        ready
        hosts {
           172.25.63.1 server1
           172.25.63.2 server2
           172.25.63.3 server3
           fallthrough
        }
        kubernetes cluster.local in-addr.arpa ip6.arpa {
```

## 2.证书问题，报错2：x509: certificate signed by unknown authority

Metric Server 支持一个参数 --kubelet-insecure-tls，可以跳过这一检查，然而官方也明确说了，这种方式不推荐生产使用。

启用TLS Bootstrap 证书签发：

```java
# vim /var/lib/kubelet/config.yaml 	
加入：
serverTLSBootstrap: true
# systemctl  restart kubelet
```

注意，每个节点都要进行以上两步操作。

操作后查看证书请求：

```java
[root@server1 limit]# kubectl get csr
NAME        AGE     SIGNERNAME                      REQUESTOR             CONDITION
csr-5mvdn   20s     kubernetes.io/kubelet-serving   system:node:server3   Pending
csr-kfrm4   3m52s   kubernetes.io/kubelet-serving   system:node:server1   Pending
csr-r9jnh   18s     kubernetes.io/kubelet-serving   system:node:server2   Pending
```

可以看出三个节点都在进行证书请求，我们现在来批准这些请求：

```java
[root@server1 limit]# kubectl certificate approve csr-kfrm4
certificatesigningrequest.certificates.k8s.io/csr-kfrm4 approved
[root@server1 limit]# kubectl certificate approve csr-5mvdn
certificatesigningrequest.certificates.k8s.io/csr-5mvdn approved
[root@server1 limit]# kubectl certificate approve csr-r9jnh
certificatesigningrequest.certificates.k8s.io/csr-r9jnh approved
```

批准后再次查看请求：

```java
[root@server1 limit]# kubectl get csr
NAME        AGE     SIGNERNAME                      REQUESTOR             CONDITION
csr-5mvdn   47s     kubernetes.io/kubelet-serving   system:node:server3   Approved,Issued
csr-kfrm4   4m19s   kubernetes.io/kubelet-serving   system:node:server1   Approved,Issued
csr-r9jnh   45s     kubernetes.io/kubelet-serving   system:node:server2   Approved,Issued
```

可以看出状态都是Approved。

Metrics-Server部署完成。
