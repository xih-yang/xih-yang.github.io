# 05、Kubernetes - 实战：ETCD集群搭建及使用(https认证+数据备份恢复)
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/6/5.html
- 分类：容器服务
- 分组：教程目录
## etcd集群搭建

### 环境介绍

基于CentOS Linux release 7.9.2009 (Core)

ip
hostname
role

172.17.0.4
cd782d0a790b
etcd1

172.17.0.3
83d43a1203f6
etcd2

172.17.0.2
99dac45f202c
etcd3

### 提前准备工作

```java
## 先添加 yum 仓库
## docker-ce
yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
## epel
wget -O /etc/yum.repos.d/epel.repo http://mirrors.aliyun.com/repo/epel-7.repo
```

### 安装docker-ce

```java
yum install -y yum-utils device-mapper-persistent-data lvm2 docker-ce
```

### 安装go，非必须（如果编译安装，则要有go环境）

```java
yum install golang
```

### 其他

```java
yum -y install ansible git iproute
```

### 开始构建etcd集群(yum 安装)

```java
yum -y install etcd
## 查看版本
[root@cd782d0a790b data]# etcdctl -v
etcdctl version: 3.3.11
API version: 2
```

### 1、基于http协议构建集群

### 编辑配置文件

```java
cat /etc/etcd/etcd.conf
## etcd存储路径
ETCD_DATA_DIR="/var/lib/etcd/default.etcd"
## 用于监听集群内所有etcd通讯的URL列表
ETCD_LISTEN_PEER_URLS="http://172.17.0.4:2380"
## 用于监听客户端通讯的URL列表
ETCD_LISTEN_CLIENT_URLS="http://172.17.0.4:2379,http://127.0.0.1:2379"
## 集群名字
ETCD_NAME="etcd1"
## 触发快照到硬盘的已提交事务的数量
ETCD_SNAPSHOT_COUNT="10000"
## 心跳间隔时间，单位毫秒
ETCD_HEARTBEAT_INTERVAL="250"
## 选举的超时时间，单位毫秒
ETCD_ELECTION_TIMEOUT="5000"
## 列出本机的通信 URL 以便通告给集群的其他成员
ETCD_INITIAL_ADVERTISE_PEER_URLS="http://172.17.0.4:2380"
## 列出本机的客户端连接URL，通告给集群中的其他成员
ETCD_ADVERTISE_CLIENT_URLS="http://172.17.0.4:2379"
## 启动初始化集群配置
ETCD_INITIAL_CLUSTER="etcd1=http://172.17.0.4:2380,etcd2=http://172.17.0.3:2380,etcd3=http://172.17.0.2:2380"
## 在启动期间用于 etcd 集群的初始化集群记号
ETCD_INITIAL_CLUSTER_TOKEN="k8s_etcd"
## 初始化集群状态，一般在新创建集群时填new，如果是加入某个已有的集群，则填写existing
ETCD_INITIAL_CLUSTER_STATE="new"
## 代理模式设置
ETCD_PROXY="off"
## 是否开始自动压缩，0表示关闭自动压缩。
ETCD_AUTO_COMPACTION_RETENTION="8"
## METRICS接口，用于提供给监控对接的
ETCD_METRICS="basic"
```

> 注意：三个配置文件大体内容基本相似，需要注意的是ETCD_NAME和本机的ip地址要随之更改

### 加入systemctl管理

```java
cat /usr/lib/systemd/system/etcd.service
[Unit]
Description=Etcd Server
After=network.target
After=network-online.target
Wants=network-online.target
[Service]
Type=notify
WorkingDirectory=/var/lib/etcd/
EnvironmentFile=-/etc/etcd/etcd.conf
User=etcd
# set GOMAXPROCS to number of processors
ExecStart=/bin/bash -c "GOMAXPROCS=$(nproc) /usr/bin/etcd --name=\"${ETCD_NAME}\" --data-dir=\"${ETCD_DATA_DIR}\" --listen-client-urls=\"${ETCD_LISTEN_CLIENT_URLS}\""
Restart=on-failure
LimitNOFILE=65536
[Install]
WantedBy=multi-user.target
```

### 启动服务，检查健康状态

```java
## 三台都启动
systemctl start etcd
## 查看集群
[root@cd782d0a790b /]# etcdctl member list
d02233d35f3c4b94: name=etcd3 peerURLs=http://172.17.0.2:2380 clientURLs=http://172.17.0.2:2379 isLeader=false
e302fd1dad15f911: name=etcd1 peerURLs=http://172.17.0.4:2380 clientURLs=http://172.17.0.4:2379 isLeader=true
ef7057d9f69d96ad: name=etcd2 peerURLs=http://172.17.0.3:2380 clientURLs=http://172.17.0.3:2379 isLeader=false
## 检查健康状态
[root@cd782d0a790b /]# etcdctl cluster-health
member d02233d35f3c4b94 is healthy: got healthy result from http://172.17.0.2:2379
member e302fd1dad15f911 is healthy: got healthy result from http://172.17.0.4:2379
member ef7057d9f69d96ad is healthy: got healthy result from http://172.17.0.3:2379
```

### 以上为默认的 API version: 2，可以将 API version 改为 3，再次查看

```java
export ETCDCTL_API=3
HOST_1=172.17.0.2
HOST_2=172.17.0.3
HOST_3=172.17.0.4
ENDPOINTS=$HOST_1:2379,$HOST_2:2379,$HOST_3:2379
## 查看list
[root@cd782d0a790b /]# etcdctl --endpoints=$ENDPOINTS member list
d02233d35f3c4b94, started, etcd3, http://172.17.0.2:2380, http://172.17.0.2:2379
e302fd1dad15f911, started, etcd1, http://172.17.0.4:2380, http://172.17.0.4:2379
ef7057d9f69d96ad, started, etcd2, http://172.17.0.3:2380, http://172.17.0.3:2379
## 检查health
[root@cd782d0a790b /]# etcdctl --endpoints=$ENDPOINTS endpoint health
172.17.0.2:2379 is healthy: successfully committed proposal: took = 7.5093ms
172.17.0.4:2379 is healthy: successfully committed proposal: took = 5.5682ms
172.17.0.3:2379 is healthy: successfully committed proposal: took = 8.0291ms
## 查看status
[root@cd782d0a790b /]# etcdctl --write-out=table --endpoints=$ENDPOINTS endpoint status
+-----------------+------------------+---------+---------+-----------+-----------+------------+
|    ENDPOINT     |        ID        | VERSION | DB SIZE | IS LEADER | RAFT TERM | RAFT INDEX |
+-----------------+------------------+---------+---------+-----------+-----------+------------+
| 172.17.0.2:2379 | d02233d35f3c4b94 |  3.3.11 |   16 kB |     false |       129 |         12 |
| 172.17.0.3:2379 | ef7057d9f69d96ad |  3.3.11 |   16 kB |     false |       129 |         12 |
| 172.17.0.4:2379 | e302fd1dad15f911 |  3.3.11 |   20 kB |      true |       129 |         12 |
+-----------------+------------------+---------+---------+-----------+-----------+------------+
```

> 具体更多操作可以查看etcd官网demo：https://etcd.io/docs/v3.4/demo/

### 2、基于https构建集群

### 首先需要生成证书，下载证书生成工具

```java
curl -s -L -o /usr/local/bin/cfssl https://pkg.cfssl.org/R1.2/cfssl_linux-amd64 
curl -s -L -o /usr/local/bin/cfssljson https://pkg.cfssl.org/R1.2/cfssljson_linux-amd64 
curl -s -L -o /usr/local/bin/cfssl-certinfo https://pkg.cfssl.org/R1.2/cfssl-certinfo_linux-amd64 
chmod +x /usr/local/bin/cfssl*
```

### 开始生成证书

```java
## CA机构配置，有效期10年
[root@cd782d0a790b cert]# cat > ca-config.json << EOF
{
  "signing": {
    "default": {
      "expiry": "87600h"
    },
    "profiles": {
      "etcd": {
         "expiry": "87600h",
         "usages": [
            "signing",
            "key encipherment",
            "server auth",
            "client auth"
        ]
      }
    }
  }
}
EOF
```

```java
"字段说明" "ca-config.json"：可以定义多个 profiles，分别指定不同的过期时间、使用场景等参数；后续在签名证书时使用某个 profile； "signing"：表示该证书可用于签名其它证书；生成的 ca.pem 证书中 CA=TRUE； "server auth"：表示client可以用该 CA 对server提供的证书进行验证； "client auth"：表示server可以用该 CA 对client提供的证书进行验证； 
```

```java
## CA机构配置，机构名称Comman Name，所在地Country国家, State省, Locality市
[root@cd782d0a790b cert]# cat > ca-csr.json << EOF
{
    "CN": "etcd CA",
    "key": {
        "algo": "rsa",
        "size": 2048
    },
    "names": [
        {
            "C": "CN",
            "ST": "Beijing",
            "L": "Beijing"
        }
    ]
}
EOF
```

```java
 
```

```java
## 向ca机构申请：证书注册 (中国，北京省，北京市),每个节点用相同的证书，所以要填写所有主机ip
[root@cd782d0a790b cert]# cat > server-csr.json << EOF
{
    "CN": "etcd",
    "hosts": [
      "172.17.0.2",
      "172.17.0.3",
      "172.17.0.4"
    ],
    "names": [
        {
            "C": "CN",
            "ST": "BeiJing",
            "L": "BeiJing",
            "O":"aa.com",
            "CN":"beijing.aa.com"
        }
    ]
}
EOF
```

```java
 请求文件全部编辑好后：
```

```java
## 生成ca证书和key
cfssl gencert -initca ca-csr.json | cfssljson -bare ca -
## 生成etcd证书和key，注意这里的-profile的值必须和ca-config中的profiles的值一样
cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=etcd server-csr.json | cfssljson -bare server
## 生成证书如下
[root@cd782d0a790b ssl]# ls *.pem
ca-key.pem  ca.pem  server-key.pem  server.pem
## 赋值读权限
chmod 644 *.pem
```

以上情况是客户端、服务端、集群内peer通信都是用同一个证书，实际情况中，可以把它分为多个，设置不同的功能，不同的到期时间，例如如下：

```java
## ca证书生成，在此定义了几种不同的证书类型
[root@cd782d0a790b cert]# cat > ca-config.json << EOF
{
    "signing": {
        "default": {
            "expiry": "168h"
        },
        "profiles": {
            "server": {
                "expiry": "8760h",
                "usages": [
                    "signing",
                    "key encipherment",
                    "server auth"
                ]
            },
            "client": {
                "expiry": "8760h",
                "usages": [
                    "signing",
                    "key encipherment",
                    "client auth"
                ]
            },
            "peer": {
                "expiry": "8760h",
                "usages": [
                    "signing",
                    "key encipherment",
                    "server auth",
                    "client auth"
                ]
            }
        }
    }
}
EOF
```

```java
"类型说明" 在其中定义3个profile "server" 作为服务器与客户端通信时的服务器证书 "client" 作为服务器与客户端通信时的客户端证书 "peer" 作为服务器间通信时用的证书，既认证服务器也认证客户端 
```

```java
cat > ca-csr.json << EOF
{
    "CN": "etcd CA",
    "key": {
        "algo": "rsa",
        "size": 2048
    },
    "names": [
        {
            "C": "CN",
            "ST": "Beijing",
            "L": "Beijing"
        }
    ]
}
EOF
```

```java
 
```

```java
## 这种是单独的，各自使用自己的peer证书,注意名字要不同，所有的机器都要执行一次
[root@cd782d0a790b cert]# cat > etcd1-csr.json << EOF
{
    "CN": "etcd1",
    "hosts": [
      "172.17.0.2"
    ],
    "names": [
        {
            "C": "CN",
            "ST": "BeiJing",
            "L": "BeiJing",
            "O":"aa.com",
            "CN":"beijing.aa.com"
        }
    ]
}
EOF
```

```java
请求文件全部编辑好后：
```

```java
## 生成ca证书和key
cfssl gencert -initca ca-csr.json | cfssljson -bare ca -
## 生成etcd证书和key，注意这里的-profile的值必须和ca-config中的profiles的值一样
for i in seq 1 5;do cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=peer etcd${i}-csr.json | cfssljson -bare etcd${i};done
[root@cd782d0a790b ssl]# ls
ca-config.json  ca.csr          etcd1-key.pem  etcd2-csr.json  etcd2.pem       etcd3.csr       etcd4-key.pem  etcd5-csr.json  etcd5.pem
ca-csr.json     ca.pem          etcd1.csr      etcd2-key.pem   etcd3-csr.json  etcd3.pem       etcd4.csr      etcd5-key.pem   server.pem
ca-key.pem      etcd1-csr.json  etcd1.pem      etcd2.csr       etcd3-key.pem   etcd4-csr.json  etcd4.pem      etcd5.csr
## 赋值读权限
chmod 644 *.pem
```

> 如果是每个服务器单独的证书，下边etcd的配置，包括查看、检查状态时，所指定的证书，都指定本机的即可

### 修改etcd.conf配置

```java
ETCD_DATA_DIR="/var/lib/etcd/default.etcd"
ETCD_LISTEN_PEER_URLS="https://172.17.0.4:2380"
ETCD_LISTEN_CLIENT_URLS="https://172.17.0.4:2379,https://127.0.0.1:2379"
ETCD_NAME="etcd1"
ETCD_SNAPSHOT_COUNT="10000"
ETCD_HEARTBEAT_INTERVAL="250"
ETCD_ELECTION_TIMEOUT="5000"
ETCD_INITIAL_ADVERTISE_PEER_URLS="https://172.17.0.4:2380"
ETCD_ADVERTISE_CLIENT_URLS="https://172.17.0.4:2379"
ETCD_INITIAL_CLUSTER="etcd1=https://172.17.0.4:2380,etcd2=https://172.17.0.3:2380,etcd3=https://172.17.0.2:2380"
ETCD_INITIAL_CLUSTER_TOKEN="etcd"
ETCD_INITIAL_CLUSTER_STATE="new"
ETCD_PROXY="off"
```

```java
## etcd 客户端与服务端通信的证书和key
ETCD_CERT_FILE="/data/cert/ssl/etcd1.pem"
ETCD_KEY_FILE="/data/cert/ssl/etcd1-key.pem" ETCD_CLIENT_CERT_AUTH="true" ca证书 ETCD_TRUSTED_CA_FILE="/data/cert/ssl/ca.pem" etcd 集群内部通信证书和key ETCD_PEER_CERT_FILE="/data/cert/ssl/etcd1.pem" ETCD_PEER_KEY_FILE="/data/cert/ssl/etcd1-key.pem" ETCD_PEER_CLIENT_CERT_AUTH="true" ETCD_PEER_TRUSTED_CA_FILE="/data/cert/ssl/ca.pem" ETCD_AUTO_COMPACTION_RETENTION="8" ETCD_METRICS="basic"
```

> 将http全部更改为https，然后指定证书的路径的路径

### 重启服务

```java
systemctl restart etcd
## 重启时，报类似错误
request sent was ignored (cluster ID mismatch: peer[61c68880c0fd8e67]=47ca0413c1aaf745, local=755bf44e2e1770ae)
或
publish error: etcdserver: request timed out
## 因为之前启动过http的etcd集群，已经有数据保存，由于这些脏数据引起的，所有节点全部数据删除后，重启即可
rm -rf /var/lib/etcd/default.etcd/*
```

### 检查状态

```java
export ETCDCTL_API=3
HOST_1=https://172.17.0.2
HOST_2=https://172.17.0.3
HOST_3=https://172.17.0.4
ENDPOINTS=$HOST_1:2379,$HOST_2:2379,$HOST_3:2379
## list
etcdctl --endpoints=$ENDPOINTS --cacert="/data/cert/ssl/ca.pem" --cert="/data/cert/ssl/etcd1.pem" --key="/data/cert/ssl/etcd1-key.pem" member list --write-out=table
+------------------+---------+-------+-------------------------+-------------------------+
|        ID        | STATUS  | NAME  |       PEER ADDRS        |      CLIENT ADDRS       |
+------------------+---------+-------+-------------------------+-------------------------+
| 37ab29a4575d84d2 | started | etcd3 | https://172.17.0.2:2380 | https://172.17.0.2:2379 |
| 3e6a29fd4717a78b | started | etcd2 | https://172.17.0.3:2380 | https://172.17.0.3:2379 |
| 653155eddc689793 | started | etcd1 | https://172.17.0.4:2380 | https://172.17.0.4:2379 |
+------------------+---------+-------+-------------------------+-------------------------+
## status
etcdctl --endpoints=$ENDPOINTS --cacert="/data/cert/ssl/ca.pem" --cert="/data/cert/ssl/etcd1.pem" --key="/data/cert/ssl/etcd1-key.pem" endpoint status --write-out=table
+-------------------------+------------------+---------+---------+-----------+-----------+------------+
|        ENDPOINT         |        ID        | VERSION | DB SIZE | IS LEADER | RAFT TERM | RAFT INDEX |
+-------------------------+------------------+---------+---------+-----------+-----------+------------+
| https://172.17.0.2:2379 | 37ab29a4575d84d2 |  3.3.11 |   20 kB |     false |      1064 |        139 |
| https://172.17.0.3:2379 | 3e6a29fd4717a78b |  3.3.11 |   20 kB |      true |      1064 |        139 |
| https://172.17.0.4:2379 | 653155eddc689793 |  3.3.11 |   20 kB |     false |      1064 |        139 |
+-------------------------+------------------+---------+---------+-----------+-----------+------------+
```

##=## 3、ETCD集群中添加节点

### member add 添加

```java
## add
etcdctl --endpoints=$ENDPOINTS --cacert="/data/cert/ssl/ca.pem" --cert="/data/cert/ssl/etcd1.pem" --key="/data/cert/ssl/etcd1-key.pem" member add etcd4 --peer-urls=https://172.17.0.5:2380
Member 71f4582f1c4ba901 added to cluster a89c967de8e14b61
ETCD_NAME="etcd4"
ETCD_INITIAL_CLUSTER="etcd3=https://172.17.0.2:2380,etcd2=https://172.17.0.3:2380,etcd1=https://172.17.0.4:2380,etcd4=https://172.17.0.5:2380"
ETCD_INITIAL_ADVERTISE_PEER_URLS="https://172.17.0.5:2380"
ETCD_INITIAL_CLUSTER_STATE="existing"
## list
etcdctl --endpoints=$ENDPOINTS --cacert="/data/cert/ssl/ca.pem" --cert="/data/cert/ssl/etcd1.pem" --key="/data/cert/ssl/etcd1-key.pem" member list --write-out=table
+------------------+-----------+-------+-------------------------+-------------------------+
|        ID        |  STATUS   | NAME  |       PEER ADDRS        |      CLIENT ADDRS       |
+------------------+-----------+-------+-------------------------+-------------------------+
| 37ab29a4575d84d2 |   started | etcd3 | https://172.17.0.2:2380 | https://172.17.0.2:2379 |
| 3e6a29fd4717a78b |   started | etcd2 | https://172.17.0.3:2380 | https://172.17.0.3:2379 |
| 653155eddc689793 |   started | etcd1 | https://172.17.0.4:2380 | https://172.17.0.4:2379 |
| e321a980939fe867 | unstarted |       | https://172.17.0.5:2380 |                         |
+------------------+-----------+-------+-------------------------+-------------------------+
```

> 注意：添加节点时，必须把集群状态修复完毕，才能继续添加下一个，否则报错类似：Error: etcdserver: unhealthy cluster

### 最终etcd4的配置文件如下

```java
ETCD_DATA_DIR="/var/lib/etcd/default.etcd"
ETCD_LISTEN_PEER_URLS="https://172.17.0.5:2380"
ETCD_LISTEN_CLIENT_URLS="https://172.17.0.5:2379,https://127.0.0.1:2379"
ETCD_NAME="etcd4"
ETCD_SNAPSHOT_COUNT="10000"
ETCD_HEARTBEAT_INTERVAL="250"
ETCD_ELECTION_TIMEOUT="5000"
ETCD_INITIAL_ADVERTISE_PEER_URLS="https://172.17.0.5:2380"
ETCD_ADVERTISE_CLIENT_URLS="https://172.17.0.5:2379"
ETCD_INITIAL_CLUSTER="etcd1=https://172.17.0.4:2380,etcd2=https://172.17.0.3:2380,etcd3=https://172.17.0.2:2380,etcd4=https://172.17.0.5:2380"
ETCD_INITIAL_CLUSTER_TOKEN="etcd"
ETCD_INITIAL_CLUSTER_STATE="existing"
ETCD_PROXY="off"
ETCD_CERT_FILE="/data/cert/ssl/etcd4.pem"
ETCD_KEY_FILE="/data/cert/ssl/etcd4-key.pem"
ETCD_CLIENT_CERT_AUTH="true"
ETCD_TRUSTED_CA_FILE="/data/cert/ssl/ca.pem"
ETCD_PEER_CERT_FILE="/data/cert/ssl/etcd4.pem"
ETCD_PEER_KEY_FILE="/data/cert/ssl/etcd4-key.pem"
ETCD_PEER_CLIENT_CERT_AUTH="true"
ETCD_PEER_TRUSTED_CA_FILE="/data/cert/ssl/ca.pem"
ETCD_AUTO_COMPACTION_RETENTION="8"
ETCD_METRICS="basic"
```

### 启动etcd4，查看集群状态

```java
systemctl start etcd
export ETCDCTL_API=3
HOST_1=https://172.17.0.2
HOST_2=https://172.17.0.3
HOST_3=https://172.17.0.4
HOST_4=https://172.17.0.5
ENDPOINTS=$HOST_1:2379,$HOST_2:2379,$HOST_3:2379,$HOST_4:2379
## list
etcdctl --endpoints=$ENDPOINTS --cacert="/data/cert/ssl/ca.pem" --cert="/data/cert/ssl/etcd1.pem" --key="/data/cert/ssl/etcd1-key.pem" member list --write-out=table
+------------------+---------+-------+-------------------------+-------------------------+
|        ID        | STATUS  | NAME  |       PEER ADDRS        |      CLIENT ADDRS       |
+------------------+---------+-------+-------------------------+-------------------------+
| 37ab29a4575d84d2 | started | etcd3 | https://172.17.0.2:2380 | https://172.17.0.2:2379 |
| 3e6a29fd4717a78b | started | etcd2 | https://172.17.0.3:2380 | https://172.17.0.3:2379 |
| 653155eddc689793 | started | etcd1 | https://172.17.0.4:2380 | https://172.17.0.4:2379 |
| e321a980939fe867 | started | etcd4 | https://172.17.0.5:2380 | https://172.17.0.5:2379 |
+------------------+---------+-------+-------------------------+-------------------------+
## status
etcdctl --endpoints=$ENDPOINTS --cacert="/data/cert/ssl/ca.pem" --cert="/data/cert/ssl/etcd1.pem" --key="/data/cert/ssl/etcd1-key.pem" endpoint status --write-out=table
+-------------------------+------------------+---------+---------+-----------+-----------+------------+
|        ENDPOINT         |        ID        | VERSION | DB SIZE | IS LEADER | RAFT TERM | RAFT INDEX |
+-------------------------+------------------+---------+---------+-----------+-----------+------------+
| https://172.17.0.2:2379 | 37ab29a4575d84d2 |  3.3.11 |   20 kB |     false |      1066 |        159 |
| https://172.17.0.3:2379 | 3e6a29fd4717a78b |  3.3.11 |   20 kB |     false |      1066 |        159 |
| https://172.17.0.4:2379 | 653155eddc689793 |  3.3.11 |   20 kB |      true |      1066 |        159 |
| https://172.17.0.5:2379 | e321a980939fe867 |  3.3.11 |   20 kB |     false |      1066 |        159 |
+-------------------------+------------------+---------+---------+-----------+-----------+------------+
```

### 4、备份及恢复ETCD集群数据

### 备份

```java
## 环境配置
export ETCDCTL_API=3
kubectl get nodes -o wide
HOST_1=https://10.36.234.169
HOST_2=https://10.36.234.180
HOST_3=https://10.36.235.19
ENDPOINTS=$HOST_1:2379,$HOST_2:2379,$HOST_3:2379
## 备份
etcdctl --endpoints=$ENDPOINTS --cacert="/etc/ssl/etcd/ssl/ca.pem" --cert="/etc/ssl/etcd/ssl/member-gzbh-intelmbx043.gzbh.baidu.com.pem" --key="/etc/ssl/etcd/ssl/member-gzbh-intelmbx043.gzbh.baidu.com-key.pem" snapshot save my.db
Snapshot saved at my.db
## 查看
[root@gzbh-intelmbx043 etcd_data]# ls
my.db
```

### 恢复

```java
## 停止etcd服务
systemctl stop etcd
## 删除原数据（如原数据重要，记得备份！）
rm -rf /var/lib/etcd
## 恢复，如果是多台机器集群模式，每个机器都要导入
etcdctl --endpoints=https://10.61.187.39:2379 --cacert="/etc/ssl/etcd/ssl/ca.pem" --cert="/etc/ssl/etcd/ssl/member-yq01-aip-aikefu06e1a866.yq01.baidu.com.pem" --key="/etc/ssl/etcd/ssl/member-yq01-aip-aikefu06e1a866.yq01.baidu.com-key.pem" snapshot restore my.db --name=etcd1 --initial-cluster etcd1=https://10.61.187.39:2380 --initial-cluster-token etcd_test --initial-advertise-peer-urls https://10.61.187.39:2380 --data-dir=/var/lib/etcd/
2021-05-25 16:05:02.784608 I | mvcc: restore compact to 6104817
2021-05-25 16:05:02.802119 I | etcdserver/membership: added member 67745b5848ce7e3c [https://10.61.187.39:2380] to cluster 1256ee7f1ba66254
## 启动服务即可
systemctl start etcd
```

> 需要注意：数据的备份和恢复是个敏感操作，一定要谨慎！
