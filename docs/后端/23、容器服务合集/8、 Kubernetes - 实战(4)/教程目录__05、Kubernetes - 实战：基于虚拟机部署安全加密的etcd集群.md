# 05、Kubernetes - 实战：基于虚拟机部署安全加密的etcd集群
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/4/5.html
- 分类：容器服务
- 分组：教程目录
## 一、前言

etcd集群对于Kubernetes集群及其重要，Kubernetes的API Server本身是无状态的，所有的状态都进入etcd进行存储，所以etcd的性能和安全关乎整个Kubernetes集群的性能和安全：

本文介绍使用在虚拟机上构建证书安全的etcd集群。

## 二、准备工作

### 2.1 操作系统准备工作

```java
#关闭防火墙
systemctl disable firewalld
systemctl stop firewalld
#配置域名
[root@k8s-master-02 etcd]# cat /etc/hosts
127.0.0.1   localhost localhost.localdomain localhost4 localhost4.localdomain4
::1         localhost localhost.localdomain localhost6 localhost6.localdomain6
192.168.56.101 k8s-master-01
192.168.56.102 k8s-master-02
192.168.56.103 k8s-master-03
192.168.56.111 k8s-node-01
192.168.56.112 k8s-node-02
192.168.56.113 k8s-node-03
#创建需要的目录
mkdir /opt/etcd/
mkdir /opt/etcd/data
mkdir /opt/etcd/logs
```

### 2.2 生成证书和key文件

工具准备

```java
curl -s -L -o /usr/bin/cfssl https://pkg.cfssl.org/R1.2/cfssl_linux-amd64
curl -s -L -o /usr/bin/cfssljson https://pkg.cfssl.org/R1.2/cfssljson_linux-amd64
chmod +x /usr/bin/{cfssl,cfssljson}
```

ca-config.json

```java
{
  "signing": {
    "default": {
      "expiry": "100000h"
    },
    "profiles": {
      "server": {
        "usages": ["signing", "key encipherment", "server auth", "client auth"],
        "expiry": "100000h"
      },
      "client": {
        "usages": ["signing", "key encipherment", "server auth", "client auth"],
        "expiry": "8760h"
      }
    }
  }
}
```

ca-csr.json

```java
{
  "CN": "Etcd",
  "key": {
    "algo": "rsa",
    "size": 4096
  },
  "names": [
    {
      "C": "CN",
      "L": "Shanghai",
      "O": "ETCD",
      "OU": "my.ai",
      "ST": "Shanghai"
    }
  ]
}
```

server-csr.json

```java
{
  "CN": "etcd-server",
  "hosts": [
    "localhost",
    "0.0.0.0",
    "127.0.0.1",
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
    "k8s-node-07",
    "k8s-tool",
    "192.168.56.101",
    "192.168.56.102",
    "192.168.56.103",
    "192.168.56.104",
    "192.168.56.105",
    "192.168.56.106",
    "192.168.56.111",
    "192.168.56.112",
    "192.168.56.113",
    "192.168.56.114",
    "192.168.56.115",
    "192.168.56.116",
    "192.168.56.117"
  ],
  "key": {
    "algo": "rsa",
    "size": 4096
  },
  "names": [
    {
      "C": "CN",
      "L": "Shanghai",
      "O": "ETCD",
      "OU": "etcd.ai",
      "ST": "Shanghai"
    }
  ]
}
```

ca-csr.json

```java
{
  "CN": "Etcd",
  "key": {
    "algo": "rsa",
    "size": 4096
  },
  "names": [
    {
      "C": "CN",
      "L": "Shanghai",
      "O": "ETCD",
      "OU": "etcd.ai",
      "ST": "Shanghai"
    }
  ]
}
```

client-csr.json

```java
{
  "CN": "etcd-client",
  "hosts": [
    ""
  ],
  "key": {
    "algo": "rsa",
    "size": 4096
  },
  "names": [
    {
      "C": "CN",
      "L": "Shanghai",
      "ST": "Shanghai",
      "O": "ETCD",
      "OU": "etcd.ai"
    }
  ]
}
```

执行如下命令：

```java
cfssl gencert -initca ca-csr.json | cfssljson -bare ca
cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=server server-csr.json | cfssljson -bare server
cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=client client-csr.json | cfssljson -bare client
```

## 三、安装etcd服务

### 3.1 下载发布版本

```java
wget https://github.com/etcd-io/etcd/releases/download/v3.3.10/etcd-v3.3.10-linux-amd64.tar.gz
tar -zxvf etcd-v3.3.10-linux-amd64.tar.gz 
cd etcd-v3.3.10-linux-amd64
cp etcd* /usr/bin/
```

### 3.2 准备启动脚本

```java
/usr/lib/systemd/system/etcd.service
[Unit]
Description=etcd
[Service]
ExecStart=/usr/bin/etcd \
   --name=k8s-master-0{1|2|3} \
   --listen-client-urls=https://0.0.0.0:2379 \
   --advertise-client-urls=https://192.168.56.101:2379 \
   --listen-peer-urls=https://0.0.0.0:2380 \
   --initial-advertise-peer-urls=https://k8s-master-01{1|2|3}:2380 \
   --initial-cluster=k8s-master-01=https://k8s-master-01:2380,k8s-master-02=https://k8s-master-02:2380,k8s-master-03=https://k8s-master-03:2380 \
   --initial-cluster-token=my-etcd-cluster-token \
   --initial-cluster-state=new \
   --cert-file=/opt/etcd/ca/server.pem \
   --key-file=/opt/etcd/ca/server-key.pem \
   --peer-cert-file=/opt/etcd/ca/server.pem \
   --peer-key-file=/opt/etcd/ca/server-key.pem \
   --trusted-ca-file=/opt/etcd/ca/ca.pem \
   --peer-trusted-ca-file=/opt/etcd/ca/ca.pem \
   --data-dir=/opt/etcd/data \
   --peer-client-cert-auth=true \
   --client-cert-auth=true
[Install]
WantedBy=multi-user.target
```

启动etcd服务

```java
systemctl enable etcd
systemctl start etcd
```

## 四、查看集群状态

集群health

```java
etcdctl --cert-file=/opt/etcd/ca/client.pem  --key-file=/opt/etcd/ca/client-key.pem --ca-file=/opt/etcd/ca/ca.pem --endpoints=https://k8s-master-01:2379 cluster-health
member 666e3882c4f82f71 is healthy: got healthy result from https://0.0.0.0:2379
member 679ae639419c436f is healthy: got healthy result from https://0.0.0.0:2379
member f21bce98b30c6f30 is healthy: got healthy result from https://0.0.0.0:2379
cluster is healthy
```

member list

```java
etcdctl --cert-file=/opt/etcd/ca/client.pem  --key-file=/opt/etcd/ca/client-key.pem --ca-file=/opt/etcd/ca/ca.pem --endpoints=https://k8s-master-01:2379 member list
666e3882c4f82f71: name=k8s-master-03 peerURLs=https://k8s-master-03:2380 clientURLs=https://0.0.0.0:2379 isLeader=false
679ae639419c436f: name=k8s-master-02 peerURLs=https://k8s-master-02:2380 clientURLs=https://0.0.0.0:2379 isLeader=false
f21bce98b30c6f30: name=k8s-master-01 peerURLs=https://k8s-master-01:2380 clientURLs=https://0.0.0.0:2379 isLeader=true
```

不用证书去访问etcd会失败

```java
etcdctl  --endpoints=https://k8s-master-01:2379 member list
client: etcd cluster is unavailable or misconfigured; error0: x509: certificate signed by unknown authority
```

使用证书和key从其它主机访问etcd集群

```java
etcdctl --cert-file=./client.pem  --key-file=./client-key.pem --ca-file=./ca.pem --endpoints=https://k8s-master-01:2379,https://k8s-master-02:2379,https://k8s-master-03:2379  cluster-health
member 666e3882c4f82f71 is healthy: got healthy result from https://192.168.56.103:2379
member 679ae639419c436f is healthy: got healthy result from https://192.168.56.102:2379
member f21bce98b30c6f30 is healthy: got healthy result from https://192.168.56.101:2379
cluster is healthy
```
