# 07、Kubernetes - 实战：通过etcd备份和恢复Kubernetes集群状态
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/4/7.html
- 分类：容器服务
- 分组：教程目录
## 一、前言

严格来讲，Kubernetes的所有组建都是无状态的，这些组建的状态包括各种后来部署的资源的状态都存储在etcd集群之中，所以通过备份etcd，可以在灾难情况下快速恢复集群和集群上的应用。

## 二、进行集群备份

### 2.1 查看集群当前状态

```java
kubectl get pods --all-namespaces -o wide
NAMESPACE     NAME                                       READY     STATUS    RESTARTS   AGE       IP              NODE
default       demo-deployment-7c687dbbfd-jxvnw           1/1       Running   0          17m       10.254.66.8     k8s-node-02
default       demo-deployment-7c687dbbfd-l4pzv           1/1       Running   0          17m       10.254.95.250   k8s-node-01
default       demo-deployment-7c687dbbfd-pjz9q           1/1       Running   0          17m       10.254.95.251   k8s-node-01
default       demo-deployment-7c687dbbfd-xzb6b           1/1       Running   0          17m       10.254.95.249   k8s-node-01
kube-system   calico-kube-controllers-64b4dd5f65-5r6sj   1/1       Running   0          17m       10.0.2.15       k8s-node-01
kube-system   calico-node-bdv8q                          2/2       Running   0          17m       10.0.2.15       k8s-node-01
kube-system   calico-node-v4d25                          2/2       Running   0          17m       10.0.2.15       k8s-node-02
kube-system   coredns-794cc4cddd-jt4jf                   1/1       Running   0          1m        10.254.66.15    k8s-node-02
kube-system   coredns-794cc4cddd-k5n88                   1/1       Running   0          1m        10.254.95.253   k8s-node-01
```

```java
ETCDCTL_API=3 etcdctl --cert=/opt/etcd/ca/client.pem  --key=/opt/etcd/ca/client-key.pem --cacert=/opt/etcd/ca/ca.pem --endpoints=https://k8s-master-01:2379,https://k8s-master-02:2379,https://k8s-master-03:2379 get / --prefix --keys-only
```

### 2.2 进行etcd备份

etcd集群一般都有多个节点，只要选择其中一个进行备份就好了。

**Step 1: 确认APIServer正在运行**

```java
[root@k8s-master-01 coredns]# ps -ef | grep kube-api
kube      2218     1  1 00:33 ?        00:07:02 /usr/bin/kube-apiserver --logtostderr=true --v=2 --etcd-servers=https://192.168.56.101:2379,https://192.168.56.102:2379,https://192.168.56.103:2379 --advertise-address=192.168.56.101 --insecure-bind-address=127.0.0.1 --bind-address=192.168.56.101 --insecure-port=8080 --secure-port=6443 --allow-privileged=true --service-cluster-ip-range=10.254.0.0/16 --admission-control=NamespaceLifecycle,LimitRanger,SecurityContextDeny,ServiceAccount,ResourceQuota --authorization-mode=RBAC --runtime-config=rbac.authorization.k8s.io/v1beta1 --anonymous-auth=false --kubelet-https=true --enable-bootstrap-token-auth=true --token-auth-file=/etc/kubernetes/token.csv --service-node-port-range=30000-50000 --tls-cert-file=/etc/kubernetes/ssl/kubernetes.pem --tls-private-key-file=/etc/kubernetes/ssl/kubernetes-key.pem --client-ca-file=/etc/kubernetes/ssl/k8s-root-ca.pem --service-account-key-file=/etc/kubernetes/ssl/k8s-root-ca.pem --etcd-quorum-read=true --storage-backend=etcd3 --etcd-cafile=/etc/kubernetes/ssl/ca.pem --etcd-certfile=/etc/kubernetes/ssl/client.pem --etcd-keyfile=/etc/kubernetes/ssl/client-key.pem --enable-swagger-ui=true --apiserver-count=3 --audit-log-maxage=30 --audit-log-maxbackup=3 --audit-log-maxsize=100 --audit-log-path=/var/log/kube-audit/audit.log --event-ttl=1h --external-hostname=k8s-master-01
```

**Step 2: 进行备份**

```java
export ETCD_SERVERS=$(ps -ef|grep apiserver|grep -Eo "etcd-servers=.*2379"|awk -F= '{print $NF}')
mkdir /opt/etcd/backup
ETCDCTL_API=3 etcdctl snapshot --endpoints=$ETCD_SERVERS --cacert=/opt/etcd/ca/ca.pem --cert=/opt/etcd/ca/client.pem --key=/opt/etcd/ca/client-key.pem save /opt/etcd/backup/backup_$(date "+%Y%m%d%H%M%S").db
Snapshot saved at /opt/etcd/backup/backup_20181031080729.db
cp -a /etc/kubernetes/ /etc/kubernetes.bak
```

**Step 3: 在当前集群删除一个叫demo-deployment的deployment以造成集群状态变化**

```java
[root@k8s-master-01 coredns]# kubectl get pods --all-namespaces -o wide
NAMESPACE     NAME                                       READY     STATUS        RESTARTS   AGE       IP              NODE
default       demo-deployment-7c687dbbfd-l4pzv           0/1       Terminating   0          1h        <none>          k8s-node-01
default       demo-deployment-7c687dbbfd-pjz9q           0/1       Terminating   0          1h        <none>          k8s-node-01
default       demo-deployment-7c687dbbfd-xzb6b           0/1       Terminating   0          1h        <none>          k8s-node-01
kube-system   calico-kube-controllers-64b4dd5f65-5r6sj   1/1       Running       0          1h        10.0.2.15       k8s-node-01
kube-system   calico-node-bdv8q                          2/2       Running       0          1h        10.0.2.15       k8s-node-01
kube-system   calico-node-v4d25                          2/2       Running       0          1h        10.0.2.15       k8s-node-02
kube-system   coredns-794cc4cddd-jt4jf                   1/1       Running       0          1h        10.254.66.15    k8s-node-02
kube-system   coredns-794cc4cddd-k5n88                   1/1       Running       0          1h        10.254.95.253   k8s-node-01
```

## 三、恢复集群所备份的状态

**Step 1: 停止所有的APIServer**

```java
systemctl stop kube-apiserver
```

**Step 2: 将备份文件同步到各个etcd节点**

```java
scp backup_20181031080729.db root@k8s-master-02:/opt/etcd/
scp backup_20181031080729.db root@k8s-master-03:/opt/etcd/
```

**Step 3: 使用下面的方法从etcd备份文件恢复**

```java
etcdctl snapshot restore backup_20181031080729.db \
>     --endpoints=192.168.56.10{1|2|3}:2379 \
>     --name=k8s-master-0{1|2|3} \
>    --cacert=/opt/etcd/ca/ca.pem \
>    --key=/opt/etcd/ca/server-key.pem \
>    --cert=/opt/etcd/ca/server.pem \
>    --initial-advertise-peer-urls=https://k8s-master-0{1|2|3}:2380 \
>    --initial-cluster-token=wayz-etcd-cluster-token \
>    --initial-cluster=k8s-master-01=https://k8s-master-01:2380,k8s-master-02=https://k8s-master-02:2380,k8s-master-03=https://k8s-master-03:2380 \
>    --data-dir=/opt/etcd/data
2018-10-31 08:24:08.639390 I | pkg/netutil: resolving k8s-master-01:2380 to 192.168.56.101:2380
2018-10-31 08:24:08.639628 I | pkg/netutil: resolving k8s-master-01:2380 to 192.168.56.101:2380
2018-10-31 08:24:08.674823 I | mvcc: restore compact to 38176
2018-10-31 08:24:08.684389 I | etcdserver/membership: added member 666e3882c4f82f71 [https://k8s-master-03:2380] to cluster a374d6d95deea33d
2018-10-31 08:24:08.684424 I | etcdserver/membership: added member 679ae639419c436f [https://k8s-master-02:2380] to cluster a374d6d95deea33d
2018-10-31 08:24:08.684436 I | etcdserver/membership: added member f21bce98b30c6f30 [https://k8s-master-01:2380] to cluster a374d6d95deea33d
```

**Step 4: 重启etcd并查看状态**

```java
systemctl start etcd
ETCDCTL_API=2  etcdctl --cert-file=/opt/etcd/ca/client.pem  --key-file=/opt/etcd/ca/client-key.pem --ca-file=/opt/etcd/ca/ca.pem --endpoints=https://k8s-master-01:2379,https://k8s-master-02:2379,https://k8s-master-03:2379 cluster-health
member 666e3882c4f82f71 is healthy: got healthy result from https://192.168.56.103:2379
member 679ae639419c436f is healthy: got healthy result from https://192.168.56.102:2379
member f21bce98b30c6f30 is healthy: got healthy result from https://192.168.56.101:2379
ETCDCTL_API=3  etcdctl --cert=/opt/etcd/ca/client.pem  --key=/opt/etcd/ca/client-key.pem --cacert=/opt/etcd/ca/ca.pem --endpoints=https://k8s-master-01:2379,https://k8s-master-02:2379,https://k8s-master-03:2379 endpoint health
https://k8s-master-03:2379 is healthy: successfully committed proposal: took = 10.454518ms
https://k8s-master-01:2379 is healthy: successfully committed proposal: took = 8.020988ms
https://k8s-master-02:2379 is healthy: successfully committed proposal: took = 8.316226ms
```

**Step 5: 重启APIServer**

```java
systemctl start kube-apiserver
```

**Step 6: 查看集群状态，预期是demo-deployment正在进行恢复部署**

```java
[root@k8s-master-01 backup]# kubectl get pods --all-namespaces
NAMESPACE     NAME                                       READY     STATUS              RESTARTS   AGE
default       demo-deployment-7c687dbbfd-jxvnw           0/1       ContainerCreating   0          1h
default       demo-deployment-7c687dbbfd-l4pzv           0/1       ContainerCreating   0          1h
default       demo-deployment-7c687dbbfd-pjz9q           0/1       ContainerCreating   0          1h
default       demo-deployment-7c687dbbfd-xzb6b           0/1       ContainerCreating   0          1h
kube-system   calico-kube-controllers-64b4dd5f65-5r6sj   0/1       Running             0          1h
kube-system   calico-node-bdv8q                          2/2       Running             0          1h
kube-system   calico-node-v4d25                          2/2       Running             0          1h
kube-system   coredns-794cc4cddd-jt4jf                   1/1       Running             0          1h
kube-system   coredns-794cc4cddd-k5n88                   1/1       Running             0          1h
```
