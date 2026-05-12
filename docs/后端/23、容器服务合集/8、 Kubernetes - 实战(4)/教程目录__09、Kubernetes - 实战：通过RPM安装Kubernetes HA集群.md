# 09、Kubernetes - 实战：通过RPM安装Kubernetes HA集群
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/4/9.html
- 分类：容器服务
- 分组：教程目录
## 一、前言

高可用的Kubernetes集群会有3个master节点，运行3个APIServer实例，这三个APIServer实例可以挂载再同一个负载均衡器后端，实现高可用。

## 二、测试集群主机准备

### 2.1 测试环境主机角色分配

> 3 kubernetes masters
>
> 192.168.56.101 (k8s-master-01)
>
> 192.168.56.102 (k8s-master-02)
>
> 192.168.56.103 (k8s-master-03)
>
> 1 kubernetes node
>
> 192.168.56.111 (k8s-node-01)
>
> 1 load balancer for 3 API servers
>
> 192.168.56.100
>
> 1 etcd cluster with 3 etcd servers running in 192.168.56.101/102/103

etcd集群的安装参看文章[《四：基于虚拟机部署安全加密的etcd集群》](/zhuanlan/container/kubernetes/4/5.html)

### 2.2 安全和DNS准备

```java
systemctl stop firewalld
systemctl disable firewalld
SELINUX=disabled
setenforce 0
/etc/ssh/sshd_config 
UseDNS no
```

### 2.3 集群证书准备

k8s-root-ca-csr.json

```java
{
  "CN": "kubernetes",
  "key": {
    "algo": "rsa",
    "size": 4096
  },
  "names": [
    {
      "C": "CN",
      "ST": "Shanghai",
      "L": "Shanghai",
      "O": "k8s",
      "OU": "System"
    }
  ]
}
```

k8s-gencert.json

```java
{
  "signing": {
    "default": {
      "expiry": "87600h"
    },
    "profiles": {
      "kubernetes": {
        "usages": [
            "signing",
            "key encipherment",
            "server auth",
            "client auth"
        ],
        "expiry": "87600h"
      }
    }
  }
}
```

kubernetes-csr.json

```java
{
    "CN": "kubernetes",
    "hosts": [
        "127.0.0.1",
        "10.254.0.1",
        "192.168.56.101",
        "192.168.56.100",
        "192.168.56.104",
        "192.168.56.105",
        "192.168.56.106",
        "192.168.56.102",
        "192.168.56.103",
        "192.168.56.111",
        "192.168.56.112",
        "192.168.56.113",
        "192.168.56.114",
        "192.168.56.115",
        "192.168.56.116",
        "192.168.56.117",
        "localhost",
        "kubernetes",
        "kubernetes.default",
        "kubernetes.default.svc",
        "kubernetes.default.svc.cluster",
        "kubernetes.default.svc.cluster.local",
        "k8s-master-01",
        "k8s-master-02",
        "k8s-master-03",
        "k8s-master-04",
        "k8s-master-05",
        "k8s-master-06",
        "k8s-node-01",
        "k8s-node-02",
        "k8s-node-03",
        "k8s-node-04",
        "k8s-node-05",
        "k8s-node-06",
        "k8s-node-07"
    ],
    "key": {
        "algo": "rsa",
        "size": 2048
    },
    "names": [
        {
            "C": "CN",
            "ST": "Shanghai",
            "L": "Shanghai",
            "O": "k8s",
            "OU": "System"
        }
    ]
}
```

kube-proxy-csr.json

```java
{
  "CN": "system:kube-proxy",
  "hosts": [],
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "ST": "Shanghai",
      "L": "Shanghai",
      "O": "k8s",
      "OU": "System"
    }
  ]
}
```

生成不同组建(kubernetes，admin，kube-proxy)使用的证书和key

```java
cfssl gencert --initca=true k8s-root-ca-csr.json | cfssljson --bare k8s-root-ca
for targetName in kubernetes admin kube-proxy; do
    cfssl gencert --ca k8s-root-ca.pem --ca-key k8s-root-ca-key.pem --config k8s-gencert.json --profile kubernetes $targetName-csr.json | cfssljson --bare $targetName
done
```

```java
openssl x509 -in kubernetes.pem -text
```

```java
[root@k8s-tools k8s-ca]# ls -l
-rw-r--r--. 1 root root 1013 Oct 31 00:31 admin.csr
-rw-r--r--. 1 root root  231 Oct 30 02:56 admin-csr.json
-rw-------. 1 root root 1675 Oct 31 00:31 admin-key.pem
-rw-r--r--. 1 root root 1753 Oct 31 00:31 admin.pem
-rw-r--r--. 1 root root  292 Oct 30 02:53 k8s-gencert.json
-rw-r--r--. 1 root root 1695 Oct 31 00:31 k8s-root-ca.csr
-rw-r--r--. 1 root root  210 Oct 30 02:53 k8s-root-ca-csr.json
-rw-------. 1 root root 3243 Oct 31 00:31 k8s-root-ca-key.pem
-rw-r--r--. 1 root root 2057 Oct 31 00:31 k8s-root-ca.pem
-rw-r--r--. 1 root root 1013 Oct 31 00:31 kube-proxy.csr
-rw-r--r--. 1 root root  232 Oct 30 02:56 kube-proxy-csr.json
-rw-------. 1 root root 1679 Oct 31 00:31 kube-proxy-key.pem
-rw-r--r--. 1 root root 1753 Oct 31 00:31 kube-proxy.pem
-rw-r--r--. 1 root root 1622 Oct 31 00:31 kubernetes.csr
-rw-r--r--. 1 root root 1202 Oct 31 00:31 kubernetes-csr.json
-rw-------. 1 root root 1675 Oct 31 00:31 kubernetes-key.pem
-rw-r--r--. 1 root root 2334 Oct 31 00:31 kubernetes.pem
```

### 2.4 生成token和kubeconfig

要确保生成的kubeconfig里面带有APIServer 前端LB的地址

> server: https://192.168.56.100:6443

```java
export BOOTSTRAP_TOKEN=$(head -c 16 /dev/urandom | od -An -t x | tr -d ' ')
cat > token.csv <<EOF
${BOOTSTRAP_TOKEN},kubelet-bootstrap,10001,"system:kubelet-bootstrap"
EOF
```

每个节点kubelet连接APIServer LB使用的bootstrap.kubeconfig

```java
export KUBE_APISERVER="https://192.168.56.100:6443"address of LB
# 设置集群参数
kubectl config set-cluster kubernetes \
  --certificate-authority=k8s-root-ca.pem \
  --embed-certs=true \
  --server=${KUBE_APISERVER} \
  --kubeconfig=bootstrap.kubeconfig
# 设置客户端认证参数
kubectl config set-credentials kubelet-bootstrap \
  --token=${BOOTSTRAP_TOKEN} \
  --kubeconfig=bootstrap.kubeconfig
# 设置上下文参数
kubectl config set-context default \
  --cluster=kubernetes \
  --user=kubelet-bootstrap \
  --kubeconfig=bootstrap.kubeconfig
# 设置默认上下文
kubectl config use-context default --kubeconfig=bootstrap.kubeconfig
```

每个节点kube-proxy连接APIServer LB使用的kube-proxy.kubeconfig

```java
# 设置集群参数
kubectl config set-cluster kubernetes \
  --certificate-authority=k8s-root-ca.pem \
  --embed-certs=true \
  --server=${KUBE_APISERVER} \
  --kubeconfig=kube-proxy.kubeconfig
# 设置客户端认证参数
kubectl config set-credentials kube-proxy \
  --client-certificate=kube-proxy.pem \
  --client-key=kube-proxy-key.pem \
  --embed-certs=true \
  --kubeconfig=kube-proxy.kubeconfig
# 设置上下文参数
kubectl config set-context default \
  --cluster=kubernetes \
  --user=kube-proxy \
  --kubeconfig=kube-proxy.kubeconfig
# 设置默认上下文
kubectl config use-context default --kubeconfig=kube-proxy.kubeconfig
```

## 三、集群安装过程

### 3.1 将安装所需要的RPM和证书文件同步到各个节点

```java
-rw-r--r--. 1 root root      219 Oct 30 05:15 install.sh
-rw-r--r--. 1 root root    41872 Oct 30 04:56 kubernetes-1.10.3-1.el7.x86_64.rpm
-rw-r--r--. 1 root root 28983340 Oct 30 04:58 kubernetes-client-1.10.3-1.el7.x86_64.rpm
-rw-r--r--. 1 root root 20025212 Oct 30 04:58 kubernetes-kubeadm-1.10.3-1.el7.x86_64.rpm
-rw-r--r--. 1 root root 49244240 Oct 30 04:57 kubernetes-master-1.10.3-1.el7.x86_64.rpm
-rw-r--r--. 1 root root 28641836 Oct 30 04:57 kubernetes-node-1.10.3-1.el7.x86_64.rpm
-rw-r--r--. 1 root root 21887636 Oct 30 04:57 kubernetes-unit-test-1.10.3-1.el7.x86_64.rpm
```

**将RPM送到各个master节点**

```java
for IP in seq 101 102 103; do
    ssh root@192.168.56.$IP mkdir ~/k8s-rpm
    scp kubernetes*.rpm root@192.168.56.$IP:~/k8s-rpm; 
    ssh root@192.168.56.$IP yum install -y docker conntrack-tools socat
    ssh root@192.168.56.$IP rpm -ivh ~/k8s-rpm/kubernetes*.rpm
done
```

**将证书文件送到各个master节点**

```java
for IP in seq 101 102 103; do
    ssh root@192.168.56.$IP mkdir /etc/kubernetes/ssl
    scp *.pem root@192.168.56.$IP:/etc/kubernetes/ssl
    scp *.kubeconfig root@192.168.56.$IP:/etc/kubernetes
    scp token.csv root@192.168.56.$IP:/etc/kubernetes
    ssh root@192.168.56.$IP chown -R kube:kube /etc/kubernetes/ssl
done
```

**生成日志目录**

```java
for IP in seq 101 102 103; do
    ssh root@192.168.56.$IP mkdir /var/log/kube-audit  
    ssh root@192.168.56.$IP chown -R kube:kube /var/log/kube-audit
    ssh root@192.168.56.$IP chmod -R 755 /var/log/kube-audit
done
```

### 3.2 安装master节点

**/etc/kubernetes/config 修改/加入如下字段：**

```java
KUBE_LOGTOSTDERR="--logtostderr=true"
KUBE_LOG_LEVEL="--v=2"
KUBE_ALLOW_PRIV="--allow-privileged=true"
KUBE_MASTER="--master=http://127.0.0.1:8080”
```

**/etc/kubernetes/apiserver修改/加入如下字段：**

```java
KUBE_API_ADDRESS="--advertise-address=192.168.56.10{1|2|3} --insecure-bind-address=127.0.0.1 --bind-address=192.168.56.10{1|2|3}"
KUBE_API_PORT="--insecure-port=8080 --secure-port=6443"
KUBE_ETCD_SERVERS="--etcd-servers=https://192.168.56.101:2379,https://192.168.56.102:2379,https://192.168.56.103:2379"
KUBE_SERVICE_ADDRESSES="--service-cluster-ip-range=10.254.0.0/16"
KUBE_ADMISSION_CONTROL="--admission-control=NamespaceLifecycle,LimitRanger,SecurityContextDeny,ServiceAccount,ResourceQuota"
KUBE_API_ARGS="--authorization-mode=RBAC \
               --runtime-config=rbac.authorization.k8s.io/v1beta1 \
               --anonymous-auth=false \
               --kubelet-https=true \
               --enable-bootstrap-token-auth=true \
               --token-auth-file=/etc/kubernetes/token.csv \
               --service-node-port-range=30000-50000 \
               --tls-cert-file=/etc/kubernetes/ssl/kubernetes.pem \
               --tls-private-key-file=/etc/kubernetes/ssl/kubernetes-key.pem \
               --client-ca-file=/etc/kubernetes/ssl/k8s-root-ca.pem \
               --service-account-key-file=/etc/kubernetes/ssl/k8s-root-ca.pem \
               --etcd-quorum-read=true \
               --storage-backend=etcd3 \
               --etcd-cafile=/etc/kubernetes/ssl/ca.pem \
               --etcd-certfile=/etc/kubernetes/ssl/client.pem \
               --etcd-keyfile=/etc/kubernetes/ssl/client-key.pem \
               --enable-swagger-ui=true \
               --apiserver-count=3 \
               --audit-log-maxage=30 \
               --audit-log-maxbackup=3 \
               --audit-log-maxsize=100 \
               --audit-log-path=/var/log/kube-audit/audit.log \
               --event-ttl=1h \
               --external-hostname=k8s-master-01"
```

**/etc/kubernetes/controller-manager 修改/加入如下字段：**

```java
KUBE_CONTROLLER_MANAGER_ARGS="--address=0.0.0.0 \
                              --service-cluster-ip-range=10.254.0.0/16 \
                              --cluster-name=kubernetes \
                              --cluster-signing-cert-file=/etc/kubernetes/ssl/k8s-root-ca.pem \
                              --cluster-signing-key-file=/etc/kubernetes/ssl/k8s-root-ca-key.pem \
                              --service-account-private-key-file=/etc/kubernetes/ssl/k8s-root-ca-key.pem \
                              --root-ca-file=/etc/kubernetes/ssl/k8s-root-ca.pem \
                              --experimental-cluster-signing-duration=87600h0m0s \
                              --leader-elect=true \
                              --node-monitor-grace-period=40s \
                              --node-monitor-period=5s \
                              --pod-eviction-timeout=5m0s"
```

**/etc/kubernetes/scheduler 修改/加入如下字段：**

```java
KUBE_SCHEDULER_ARGS="--leader-elect=true --address=0.0.0.0"
```

**启动master节点上的服务(apiserver/scheduler/controller manager)**

```java
systemctl daemon-reload
systemctl start kube-apiserver
systemctl start kube-controller-manager
systemctl start kube-scheduler
systemctl enable kube-apiserver
systemctl enable kube-controller-manager
systemctl enable kube-scheduler
```

查看服务状态

```java
kubectl get cs
NAME                 STATUS    MESSAGE             ERROR
scheduler            Healthy   ok                  
controller-manager   Healthy   ok                  
etcd-0               Healthy   {"health":"true"}   
etcd-1               Healthy   {"health":"true"}   
etcd-2               Healthy   {"health":"true"} 
```

### 3.3 配置APIServer的负载均衡

**配置nginx**

```java
# 创建配置目录
mkdir -p /etc/nginx
# 写入代理配置
cat << EOF >> /etc/nginx/nginx.conf
error_log stderr notice;
worker_processes auto;
events {
  multi_accept on;
  use epoll;
  worker_connections 1024;
}
stream {
    upstream kube_apiserver {
        least_conn;
        server 192.168.56.101:6443;
        server 192.168.56.102:6443;
        server 192.168.56.103:6443;
    }
    server {
        listen        0.0.0.0:6443;
        proxy_pass    kube_apiserver;
        proxy_timeout 10m;
        proxy_connect_timeout 1s;
    }
}
EOF
# 更新权限
chmod +r /etc/nginx/nginx.conf
```

**启动nginx代理服务**

```java
at << EOF >> /etc/systemd/system/nginx-proxy.service
[Unit]
Description=kubernetes apiserver docker wrapper
Wants=docker.socket
After=docker.service
[Service]
User=root
PermissionsStartOnly=true
ExecStart=/usr/bin/docker run -p 6443:6443 \\
                              -v /etc/nginx:/etc/nginx \\
                              --name nginx-proxy \\
                              --net=host \\
                              --restart=on-failure:5 \\
                              --memory=512M \\
                              nginx:1.13.3-alpine
ExecStartPre=-/usr/bin/docker rm -f nginx-proxy
ExecStop=/usr/bin/docker stop nginx-proxy
Restart=always
RestartSec=15s
TimeoutStartSec=30s
[Install]
WantedBy=multi-user.target
EOF
```

安装成系统服务

```java
systemctl daemon-reload
systemctl start nginx-proxy
systemctl enable nginx-proxy
```

### 3.4 安装工作节点

**Send RPMs**

```java
for IP in 111; do
        ssh root@192.168.56.$IP mkdir ~/k8s-rpm
        scp kubernetes-node-1.10.3-1.el7.x86_64.rpm root@192.168.56.$IP:~/k8s-rpm/
        scp kubernetes-client-1.10.3-1.el7.x86_64.rpm root@192.168.56.$IP:~/k8s-rpm/
        ssh root@192.168.56.$IP yum install -y docker conntrack-tools socat
        ssh root@192.168.56.$IP rpm -ivh ~/k8s-rpm/kubernetes*.rpm
done
```

**Send Certificates**

```java
for IP in 111; do
        ssh root@192.168.56.$IP mkdir /etc/kubernetes/ssl
        scp *.pem root@192.168.56.$IP:/etc/kubernetes/ssl
        scp *.kubeconfig root@192.168.56.$IP:/etc/kubernetes/
        scp token.csv root@192.168.56.$IP:/etc/kubernetes/
        ssh root@192.168.56.$IP chown -R kube:kube /etc/kubernetes/ssl
done
```

**修改配置文件如下**

```java
cat /etc/kubernetes/config | grep -v ^#
KUBE_LOGTOSTDERR="--logtostderr=true"
KUBE_LOG_LEVEL="--v=2"
KUBE_ALLOW_PRIV="--allow-privileged=true"
cat /etc/kubernetes/kubelet | grep -v ^#
KUBELET_ADDRESS="--address=192.168.56.111"
KUBELET_HOSTNAME="--hostname-override=k8s-node-01"
KUBELET_ARGS="--cgroup-driver=systemd \
              --cluster-dns=10.254.0.2 \
              --network-plugin=cni \
              --fail-swap-on=false \
              --resolv-conf=/etc/resolv.conf \
              --experimental-bootstrap-kubeconfig=/etc/kubernetes/bootstrap.kubeconfig \
              --kubeconfig=/etc/kubernetes/kubelet.kubeconfig \
              --cert-dir=/etc/kubernetes/ssl \
              --cluster-domain=cluster.local. \
              --hairpin-mode promiscuous-bridge \
              --serialize-image-pulls=false \
              --pod-infra-container-image=gcr.io/google_containers/pause-amd64:3.0"
cat /etc/kubernetes/proxy | grep -v ^#
KUBE_PROXY_ARGS="--bind-address=192.168.56.111 \
                 --hostname-override=k8s-node-01 \
                 --kubeconfig=/etc/kubernetes/kube-proxy.kubeconfig \
                 --cluster-cidr=10.254.0.0/16"
```

**配置ClusterRoleBinding**

由于kubelet 采用了 TLS Bootstrapping，所有根绝 RBAC 控制策略，kubelet 使用的用户 kubelet-bootstrap 是不具备任何访问 API 权限的，这是需要预先在集群内创建 ClusterRoleBinding 授予其 system:node-bootstrapper Role

```java
kubectl delete clusterrolebindings kubelet-node-clusterbinding
kubectl create clusterrolebinding kubelet-node-clusterbinding --clusterrole=system:node --group=system:nodes
```

**Test node connection to API server LB**

```java
kubectl   --server https://192.168.56.100:6443 --certificate-authority /etc/kubernetes/ssl/k8s-root-ca.pem --client-certificate /etc/kubernetes/ssl/admin.pem --client-key /etc/kubernetes/ssl/admin-key.pem get cs
NAME                 STATUS    MESSAGE             ERROR
controller-manager   Healthy   ok                  
scheduler            Healthy   ok                  
etcd-0               Healthy   {"health":"true"}   
etcd-2               Healthy   {"health":"true"}   
etcd-1               Healthy   {"health":"true"} 
```

**Enable node service**

```java
systemctl daemon-reload
systemctl start kubelet
systemctl enable kubelet
systemctl start kube-proxy
systemctl enable kube-proxy
```

由于采用了 [TLS Bootstrapping](https://kubernetes.io/docs/admin/kubelet-tls-bootstrapping/)，所以 kubelet 启动后不会立即加入集群，而是进行证书申请，此时只需要在 master 允许其证书申请即可：

```java
# 查看 csr
[root@k8s-master-01 ssl]$ kubectl get csr
NAME                                                   AGE       REQUESTOR           CONDITION
node-csr-D-LrT1abA4-gBUuM0tumV0UZ34vu7Gk8R6t3QO19iqU   49s       kubelet-bootstrap   Pending
# 签发证书
[root@k8s-master-01 ssl]$ kubectl certificate approve node-csr-D-LrT1abA4-gBUuM0tumV0UZ34vu7Gk8R6t3QO19iqU  
certificatesigningrequest.certificates.k8s.io "node-csr-D-LrT1abA4-gBUuM0tumV0UZ34vu7Gk8R6t3QO19iqU” approved
# 查看 node
kubectl get node
NAME          STATUS    ROLES     AGE       VERSION
k8s-node-01   Ready     <none>    10s        v1.10.3
```

测试从其它节点用手kubectl访问APIServer LB

```java
kubectl   --server https://192.168.56.100:6443 --certificate-authority /root/k8s-ca/k8s-root-ca.pem --client-certificate /root/k8s-ca/admin.pem --client-key /root/k8s-ca/admin-key.pem get node
NAME          STATUS    ROLES     AGE       VERSION
k8s-node-01   Ready     <none>    2h        v1.10.3
```

### 3.6 在节点安装Calico CNI

Addin node /etc/kubernetes/kubelet --network-plugin=cni

```java
wget https://docs.projectcalico.org/v3.3/getting-started/kubernetes/installation/hosted/calico.yaml
wget https://docs.projectcalico.org/v3.3/getting-started/kubernetes/installation/rbac.yaml
sed -i 's@.*etcd_endpoints:.*@\ \ etcd_endpoints:\ \"https://192.168.56.101:2379,https://192.168.56.102:2379,https://192.168.56.103:2379\"@gi' calico.yaml
export ETCD_CERT=cat /root/etcd-ca/client.pem | base64 | tr -d '\n'
export ETCD_KEY=cat /root/etcd-ca/client-key.pem | base64 | tr -d '\n'
export ETCD_CA=cat /root/etcd-ca/ca.pem | base64 | tr -d '\n'
sed -i "s@.*etcd-cert:.*@\ \ etcd-cert:\ ${ETCD_CERT}@gi" calico.yaml
sed -i "s@.*etcd-key:.*@\ \ etcd-key:\ ${ETCD_KEY}@gi" calico.yaml
sed -i "s@.*etcd-ca:.*@\ \ etcd-ca:\ ${ETCD_CA}@gi" calico.yaml
sed -i 's@.*etcd_ca:.*@\ \ etcd_ca:\ "/calico-secrets/etcd-ca"@gi' calico.yaml
sed -i 's@.*etcd_cert:.*@\ \ etcd_cert:\ "/calico-secrets/etcd-cert"@gi' calico.yaml
sed -i 's@.*etcd_key:.*@\ \ etcd_key:\ "/calico-secrets/etcd-key"@gi' calico.yaml
sed -i 's@192.168.0.0/16@10.254.64.0/18@gi' calico.yaml
```

根据环境情况修改配置如下：

> Set POD IP range
>
> # The default IPv4 pool to create on startup if none exists. Pod IPs will be
>
> # chosen from this range. Changing this value after installation will have
>
> # no effect. This should fall within --cluster-cidr.
>
> - name: CALICO_IPV4POOL_CIDR
>
> value: "10.254.64.0/18”
>
> Also determine if to use IPIP
>
> # Enable IPIP
>
> - name: CALICO_IPV4POOL_IPIP
>
> value: "always"

部署calico

```java
kubectl --server https://192.168.56.100:6443 --certificate-authority /root/k8s-ca/k8s-root-ca.pem --client-certificate /root/k8s-ca/admin.pem --client-key /root/k8s-ca/admin-key.pem create -f calico.yaml
kubectl --server https://192.168.56.100:6443 --certificate-authority /root/k8s-ca/k8s-root-ca.pem --client-certificate /root/k8s-ca/admin.pem --client-key /root/k8s-ca/admin-key.pem apply -f rbac.yaml
```

查看部署结果

```java
kubectl   --server https://192.168.56.100:6443 --certificate-authority /root/k8s-ca/k8s-root-ca.pem --client-certificate /root/k8s-ca/admin.pem --client-key /root/k8s-ca/admin-key.pem get pods -n kube-system
NAME                                       READY     STATUS    RESTARTS   AGE
calico-kube-controllers-64b4dd5f65-b8kk9   0/1       Running   0          6s
calico-node-r7cqs                          1/2       Running   0          6s
```

### 3.7 再加入一个节点

```java
192.168.56.112 (k8s-node-02)
Send RPMs
for IP in 112; do
        ssh root@192.168.56.$IP mkdir ~/k8s-rpm
        scp kubernetes-node-1.10.3-1.el7.x86_64.rpm root@192.168.56.$IP:~/k8s-rpm/
        scp kubernetes-client-1.10.3-1.el7.x86_64.rpm root@192.168.56.$IP:~/k8s-rpm/
        ssh root@192.168.56.$IP yum install -y docker conntrack-tools socat
        ssh root@192.168.56.$IP rpm -ivh ~/k8s-rpm/kubernetes*.rpm
done
Send Certificates
for IP in 112; do
        ssh root@192.168.56.$IP mkdir /etc/kubernetes/ssl
        scp *.pem root@192.168.56.$IP:/etc/kubernetes/ssl
        scp *.kubeconfig root@192.168.56.$IP:/etc/kubernetes/
        scp token.csv root@192.168.56.$IP:/etc/kubernetes/
        ssh root@192.168.56.$IP chown -R kube:kube /etc/kubernetes/ssl
done
Config files
cat /etc/kubernetes/config | grep -v ^#
KUBE_LOGTOSTDERR="--logtostderr=true"
KUBE_LOG_LEVEL="--v=2"
KUBE_ALLOW_PRIV="--allow-privileged=true"
cat /etc/kubernetes/kubelet | grep -v ^#
KUBELET_ADDRESS="--address=192.168.56.111"
KUBELET_HOSTNAME="--hostname-override=k8s-node-01"
KUBELET_ARGS="--cgroup-driver=systemd \
              --cluster-dns=10.254.0.2 \
              --fail-swap-on=false \
              --network-plugin=cni \
              --resolv-conf=/etc/resolv.conf \
              --experimental-bootstrap-kubeconfig=/etc/kubernetes/bootstrap.kubeconfig \
              --kubeconfig=/etc/kubernetes/kubelet.kubeconfig \
              --cert-dir=/etc/kubernetes/ssl \
              --cluster-domain=cluster.local. \
              --hairpin-mode promiscuous-bridge \
              --serialize-image-pulls=false \
              --pod-infra-container-image=gcr.io/google_containers/pause-amd64:3.0"
cat /etc/kubernetes/proxy | grep -v ^#
KUBE_PROXY_ARGS="--bind-address=192.168.56.111 \
                 --hostname-override=k8s-node-01 \
                 --kubeconfig=/etc/kubernetes/kube-proxy.kubeconfig \
                 --cluster-cidr=10.254.0.0/16"
Enable node service
systemctl daemon-reload
systemctl start kubelet
systemctl enable kubelet
systemctl start kube-proxy
systemctl enable kube-proxy
kubectl get csr
NAME                                                   AGE       REQUESTOR           CONDITION
node-csr-Vnv0E_XSEV3iunGtRsqdqJiSCamgJPB5ErjRxs2E-LI   37s       kubelet-bootstrap   Pending
kubectl certificate approve node-csr-Vnv0E_XSEV3iunGtRsqdqJiSCamgJPB5ErjRxs2E-LI
kubectl get nodes
NAME          STATUS    ROLES     AGE       VERSION
k8s-node-01   Ready     <none>    4h        v1.10.3
k8s-node-02   Ready     <none>    4m        v1.10.3
kubectl get pods --all-namespaces
NAMESPACE     NAME                                       READY     STATUS    RESTARTS   AGE
kube-system   calico-kube-controllers-64b4dd5f65-b8kk9   1/1       Running   0          28m
kube-system   calico-node-h5lr6                          2/2       Running   7          6m
kube-system   calico-node-r7cqs                          2/2       Running   0          28m
```

### 3.8 安装CoreDNS

配置如下

```java
wget https://raw.githubusercontent.com/coredns/deployment/master/kubernetes/coredns.yaml.sed
SERVICE_CIDR=${1:-10.254.0.0/16}
POD_CIDR=${2:-10.254.64.0/18}
CLUSTER_DNS_IP=${3:-10.254.0.2}
CLUSTER_DOMAIN=${4:-cluster.local}
YAML_TEMPLATE=${5:-pwd/coredns.yaml.sed}
```

Runbellow to generate configure file

```java
sed -e s/CLUSTER_DNS_IP/$CLUSTER_DNS_IP/g -e s/CLUSTER_DOMAIN/$CLUSTER_DOMAIN/g -e s?SERVICE_CIDR?$SERVICE_CIDR?g -e s?POD_CIDR?$POD_CIDR?g $YAML_TEMPLATE > coredns.yaml
```

Change more configures as bellow

```java
  Corefile: |
    .:53 {
        errors
        health
        kubernetes cluster.local {
          pods insecure
          upstream
          fallthrough in-addr.arpa ip6.arpa
        }
        prometheus :9153
        proxy . /etc/resolv.conf
        cache 30
        loop
        reload
        loadbalance
    }
```

进行部署

```java
kubectl   --server https://192.168.56.100:6443 --certificate-authority /root/k8s-ca/k8s-root-ca.pem --client-certificate /root/k8s-ca/admin.pem --client-key /root/k8s-ca/admin-key.pem apply -f coredns.yaml
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

测试部署结果

```java
[root@k8s-master-01 coredns]# kubectl exec -it demo-deployment-7c687dbbfd-l4pzv bash
bash-4.4# ping kubernetes
PING kubernetes (10.254.0.1): 56 data bytes
^C
--- kubernetes ping statistics ---
3 packets transmitted, 0 packets received, 100% packet loss
bash-4.4# exit
exit
command terminated with exit code 1
```

## 四、验证集群可用性

demo-deploy.yml

```java
kind: Deployment
metadata:
  name: demo-deployment
spec:
  replicas: 4
  template:
    metadata:
      labels:
        app: demo
    spec:
      containers:
      - name: demo
        image: mritd/demo
        ports:
        - containerPort: 80
```

进行部署

```java
kubectl   --server https://192.168.56.100:6443 --certificate-authority /root/k8s-ca/k8s-root-ca.pem --client-certificate /root/k8s-ca/admin.pem --client-key /root/k8s-ca/admin-key.pem apply -f demo.deploy.yml 
```

查看部署结果

```java
kubectl   --server https://192.168.56.100:6443 --certificate-authority /root/k8s-ca/k8s-root-ca.pem --client-certificate /root/k8s-ca/admin.pem --client-key /root/k8s-ca/admin-key.pem get pods -o wide
NAME                               READY     STATUS    RESTARTS   AGE       IP              NODE
demo-deployment-7c687dbbfd-4n2kh   1/1       Running   0          2m        10.254.66.6     k8s-node-02
demo-deployment-7c687dbbfd-fbc7n   1/1       Running   0          2m        10.254.95.244   k8s-node-01
demo-deployment-7c687dbbfd-j2rfr   1/1       Running   0          2m        10.254.95.245   k8s-node-01
demo-deployment-7c687dbbfd-plvnv   1/1       Running   0          2m        10.254.95.237   k8s-node-01
```

访问服务

```java
# 查看网络连通性
kubectl   --server https://192.168.56.100:6443 --certificate-authority /root/k8s-ca/k8s-root-ca.pem --client-certificate /root/k8s-ca/admin.pem --client-key /root/k8s-ca/admin-key.pem exec -it demo-deployment-7c687dbbfd-fbc7n bash
bash-4.4# ping 10.254.95.244
PING 10.254.95.244 (10.254.95.244): 56 data bytes
64 bytes from 10.254.95.244: seq=0 ttl=64 time=0.147 ms
64 bytes from 10.254.95.244: seq=1 ttl=64 time=0.091 ms
^C
--- 10.254.95.244 ping statistics ---
2 packets transmitted, 2 packets received, 0% packet loss
round-trip min/avg/max = 0.091/0.119/0.147 ms
# 访问HTTP服务
bash-4.4# curl 10.254.95.244
<!DOCTYPE html>
<html lang="zh">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>Running!</title>
    <style type="text/css">
        body {
            width: 100%;
            min-height: 100%;
            background: linear-gradient(to bottom,fff 0,b8edff 50%,83dfff 100%);
            background-attachment: fixed;
        }
    </style>
</head>
<body class=" hasGoogleVoiceExt">
<div align="center">
    <h1>Your container is running!</h1>
    <img src="./docker.png" alt="docker">
</div>
</body>
```
