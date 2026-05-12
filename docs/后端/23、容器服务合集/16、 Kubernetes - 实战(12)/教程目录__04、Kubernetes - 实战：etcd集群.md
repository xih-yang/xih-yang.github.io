# 04、Kubernetes - 实战：etcd集群
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/12/4.html
- 分类：容器服务
- 分组：教程目录
## 1、集群环境

```java
OS:
root@harbor:~# cat /etc/issue
Ubuntu 20.04.2 LTS \n \l
IP分配：<br>192.168.1.100 k8s-deploy
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

## 2、etcd的介绍

etcd是CoreOS团队于2013年6月发起的开源项目，它的目标是构建一个高可用的分布式键值(key-value)数据库。etcd内部采用`raft`协议作为一致性算法，etcd基于Go语言实现。

## 3、etcd的特点

```java
简单：安装配置简单，而且提供了HTTP API进行交互，使用也很简单
安全：支持SSL证书验证
快速：根据官方提供的benchmark数据，单实例支持每秒2k+读操作
可靠：采用raft算法，实现分布式系统数据的可用性和一致性
完全复制：集群中的每个节点都可以使⽤完整的存档
⾼可⽤性：Etcd可⽤于避免硬件的单点故障或⽹络问题
⼀致性：每次读取都会返回跨多主机的最新写⼊
```

## 4、etcd的客户端操作

etcd有多个不同的API访问版本，v1版本已经废弃，etcd v2 和 v3 本质上是共享同⼀套 raft 协议代码的两个独⽴的应⽤，接⼝不⼀样，存储不⼀样，数据互相隔离。也就是说如果从 Etcd v2 升级到 Etcd v3，原来v2 的数据还是只能⽤ v2 的接⼝访问，v3 的接⼝创建的数据也只能访问通过 v3 的接⼝访问。

etcd命令用法：

```java
root@k8s-deploy:~/shell# etcdctl --help
NAME:
	etcdctl - A simple command line client for etcd3.
USAGE:
	etcdctl [flags]
VERSION:
	3.4.13
API VERSION:
	3.4
COMMANDS:
	alarm disarm		Disarms all alarms
	alarm list		Lists all alarms
	auth disable		Disables authentication
	auth enable		Enables authentication
	check datascale		Check the memory usage of holding data for different workloads on a given server endpoint.
	check perf		Check the performance of the etcd cluster
	compaction		Compacts the event history in etcd
	defrag			Defragments the storage of the etcd members with given endpoints
	del			Removes the specified key or range of keys [key, range_end)
	elect			Observes and participates in leader election
	endpoint hashkv		Prints the KV history hash for each endpoint in --endpoints
	endpoint health		Checks the healthiness of endpoints specified in --endpoints flag
	endpoint status		Prints out the status of endpoints specified in --endpoints flag
	get			Gets the key or a range of keys
	help			Help about any command
	lease grant		Creates leases
	lease keep-alive	Keeps leases alive (renew)
	lease list		List all active leases
	lease revoke		Revokes leases
	lease timetolive	Get lease information
	lock			Acquires a named lock
	make-mirror		Makes a mirror at the destination etcd cluster
	member add		Adds a member into the cluster
	member list		Lists all members in the cluster
	member promote		Promotes a non-voting member in the cluster
	member remove		Removes a member from the cluster
	member update		Updates a member in the cluster
	migrate			Migrates keys in a v2 store to a mvcc store
	move-leader		Transfers leadership to another etcd cluster member.
	put			Puts the given key into the store
	role add		Adds a new role
	role delete		Deletes a role
	role get		Gets detailed information of a role
	role grant-permission	Grants a key to a role
	role list		Lists all roles
	role revoke-permission	Revokes a key from a role
	snapshot restore	Restores an etcd member snapshot to an etcd directory
	snapshot save		Stores an etcd node backend snapshot to a given file
	snapshot status		Gets backend snapshot status of a given file
	txn			Txn processes all the requests in one transaction
	user add		Adds a new user
	user delete		Deletes a user
	user get		Gets detailed information of a user
	user grant-role		Grants a role to a user
	user list		Lists all users
	user passwd		Changes password of user
	user revoke-role	Revokes a role from a user
	version			Prints the version of etcdctl
	watch			Watches events stream on keys or prefixes
OPTIONS:
      --cacert=""				verify certificates of TLS-enabled secure servers using this CA bundle
      --cert=""					identify secure client using this TLS certificate file
      --command-timeout=5s			timeout for short running command (excluding dial timeout)
      --debug[=false]				enable client-side debug logging
      --dial-timeout=2s				dial timeout for client connections
  -d, --discovery-srv=""			domain name to query for SRV records describing cluster endpoints
      --discovery-srv-name=""			service name to query when using DNS discovery
      --endpoints=[127.0.0.1:2379]		gRPC endpoints
  -h, --help[=false]				help for etcdctl
      --hex[=false]				print byte strings as hex encoded strings
      --insecure-discovery[=true]		accept insecure SRV records describing cluster endpoints
      --insecure-skip-tls-verify[=false]	skip server certificate verification (CAUTION: this option should be enabled only for testing purposes)
      --insecure-transport[=true]		disable transport security for client connections
      --keepalive-time=2s			keepalive time for client connections
      --keepalive-timeout=6s			keepalive timeout for client connections
      --key=""					identify secure client using this TLS key file
      --password=""				password for authentication (if this option is used, --user option shouldn't include password)
      --user=""					username[:password] for authentication (prompt if password is not supplied)
  -w, --write-out="simple"			set the output format (fields, json, protobuf, simple, table)
```

## 4.1查看etcd集群成员客户端信息

```java
root@etcd01:~# ETCDCTL_API=2 etcdctl member --help
NAME:
   etcdctl member - member add, remove and list subcommands
USAGE:
   etcdctl member command [command options] [arguments...]
COMMANDS:
     list    enumerate existing cluster members
     add     add a new member to the etcd cluster
     remove  remove an existing member from the etcd cluster
     update  update an existing member in the etcd cluster
OPTIONS:
   --help, -h  show help
root@etcd01:~# ETCDCTL_API=3 etcdctl member --help
NAME:
    member - Membership related commands
USAGE:
    etcdctl member <subcommand> [flags]
API VERSION:
    3.4
COMMANDS:
    add    Adds a member into the cluster
    list    Lists all members in the cluster
    promote    Promotes a non-voting member in the cluster
    remove    Removes a member from the cluster
    update    Updates a member in the cluster
OPTIONS:
  -h, --help[=false]    help for member
GLOBAL OPTIONS:
      --cacert=""                verify certificates of TLS-enabled secure servers using this CA bundle
      --cert=""                    identify secure client using this TLS certificate file
      --command-timeout=5s            timeout for short running command (excluding dial timeout)
      --debug[=false]                enable client-side debug logging
      --dial-timeout=2s                dial timeout for client connections
  -d, --discovery-srv=""            domain name to query for SRV records describing cluster endpoints
      --discovery-srv-name=""            service name to query when using DNS discovery
      --endpoints=[127.0.0.1:2379]        gRPC endpoints
      --hex[=false]                print byte strings as hex encoded strings
      --insecure-discovery[=true]        accept insecure SRV records describing cluster endpoints
      --insecure-skip-tls-verify[=false]    skip server certificate verification (CAUTION: this option should be enabled only for testing purposes)
      --insecure-transport[=true]        disable transport security for client connections
      --keepalive-time=2s            keepalive time for client connections
      --keepalive-timeout=6s            keepalive timeout for client connections
      --key=""                    identify secure client using this TLS key file
      --password=""                password for authentication (if this option is used, --user option shouldn't include password)
      --user=""                    username[:password] for authentication (prompt if password is not supplied)
  -w, --write-out="simple"            set the output format (fields, json, protobuf, simple, table)
```

etcd集群成员的心跳信息

```java
root@k8s-master1:~# export NODE_IPS="192.168.1.101 192.168.1.102 192.168.1.103"
root@k8s-master1:~# clear
root@k8s-master1:~# for ip in ${NODE_IPS}; do ETCDCTL_API=3 /opt/kube/bin/etcdctl --endpoints=https://${ip}:2379 --cacert=/etc/kubernetes/ssl/ca.pem --cert=/etc/kubernetes/ssl/etcd.pem --key=/etc/kubernetes/ssl/etcd-key.pem endpoint health; done
https://192.168.1.101:2379 is healthy: successfully committed proposal: took = 13.705088ms
https://192.168.1.102:2379 is healthy: successfully committed proposal: took = 16.549874ms
https://192.168.1.103:2379 is healthy: successfully committed proposal: took = 15.147654ms
```

etcd集群的成员信息

```java
root@k8s-master1:~# ETCDCTL_API=3 /opt/kube/bin/etcdctl --endpoints=https://192.168.1.101:2379 --cacert=/etc/kubernetes/ssl/ca.pem --cert=/etc/kubernetes/ssl/etcd.pem --key=/etc/kubernetes/ssl/etcd-key.pem member list --write-out=table
+------------------+---------+--------------------+----------------------------+----------------------------+------------+
|        ID        | STATUS  |        NAME        |         PEER ADDRS         |        CLIENT ADDRS        | IS LEARNER |
+------------------+---------+--------------------+----------------------------+----------------------------+------------+
| 4469cb53324fe68b | started | etcd-192.168.1.102 | https://192.168.1.102:2380 | https://192.168.1.102:2379 |      false |
| 9f5e0acc1f346641 | started | etcd-192.168.1.101 | https://192.168.1.101:2380 | https://192.168.1.101:2379 |      false |
| e519401c4b995768 | started | etcd-192.168.1.103 | https://192.168.1.103:2380 | https://192.168.1.103:2379 |      false |
+------------------+---------+--------------------+----------------------------+----------------------------+------------+
```

显示etcd群集的详细信息

```java
root@k8s-master1:~# for ip in ${NODE_IPS}; do ETCDCTL_API=3 /opt/kube/bin/etcdctl --write-out=table endpoint status --endpoints=https://${ip}:2379 --cacert=/etc/kubernetes/ssl/ca.pem --cert=/etc/kubernetes/ssl/etcd.pem --key=/etc/kubernetes/ssl/etcd-key.pem; done
+----------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
|          ENDPOINT          |        ID        | VERSION | DB SIZE | IS LEADER | IS LEARNER | RAFT TERM | RAFT INDEX | RAFT APPLIED INDEX | ERRORS |
+----------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
| https://192.168.1.101:2379 | 9f5e0acc1f346641 |  3.4.13 |  5.0 MB |     false |      false |        14 |      20561 |              20561 |        |
+----------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
+----------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
|          ENDPOINT          |        ID        | VERSION | DB SIZE | IS LEADER | IS LEARNER | RAFT TERM | RAFT INDEX | RAFT APPLIED INDEX | ERRORS |
+----------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
| https://192.168.1.102:2379 | 4469cb53324fe68b |  3.4.13 |  4.9 MB |     false |      false |        14 |      20561 |              20561 |        |
+----------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
+----------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
|          ENDPOINT          |        ID        | VERSION | DB SIZE | IS LEADER | IS LEARNER | RAFT TERM | RAFT INDEX | RAFT APPLIED INDEX | ERRORS |
+----------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
| https://192.168.1.103:2379 | e519401c4b995768 |  3.4.13 |  4.8 MB |      true |      false |        14 |      20561 |              20561 |        |
+----------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
```

**172、** 168.33.205为etcd集群的leader；

人为的关闭etcd的leader:172.168.33.205,查看etcd leader是否会跳转到其它的etcd

```java
#1、关闭etcd leader 192.168.1.103
root@k8s-master3:~#systemctl stop etcd
#2、在其他的ercd
root@k8s-master1:~# export NODE_IPS="192.168.1.101 192.168.1.102 192.168.1.103"
root@k8s-master1:~# for ip in ${NODE_IPS}; do ETCDCTL_API=3 /opt/kube/bin/etcdctl --write-out=table endpoint status --endpoints=https://${ip}:2379 --cacert=/etc/kubernetes/ssl/ca.pem --cert=/etc/kubernetes/ssl/etcd.pem --key=/etc/kubernetes/ssl/etcd-key.pem; done
+----------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
|          ENDPOINT          |        ID        | VERSION | DB SIZE | IS LEADER | IS LEARNER | RAFT TERM | RAFT INDEX | RAFT APPLIED INDEX | ERRORS |
+----------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
| https://192.168.1.101:2379 | 9f5e0acc1f346641 |  3.4.13 |  5.0 MB |     false |      false |        15 |      20991 |              20991 |        |
+----------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
+----------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
|          ENDPOINT          |        ID        | VERSION | DB SIZE | IS LEADER | IS LEARNER | RAFT TERM | RAFT INDEX | RAFT APPLIED INDEX | ERRORS |
+----------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
| https://192.168.1.102:2379 | 4469cb53324fe68b |  3.4.13 |  4.9 MB |      true |      false |        15 |      20991 |              20991 |        |
+----------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
{"level":"warn","ts":"2022-02-15T21:58:57.565+0800","caller":"clientv3/retry_interceptor.go:62","msg":"retrying of unary invoker failed","target":"passthrough:///https://192.168.1.103:2379","attempt":0,"error":"rpc error: code = DeadlineExceeded desc = latest balancer error: connection error: desc = \"transport: Error while dialing dial tcp 192.168.1.103:2379: connect: connection refused\""}
Failed to get the status of endpoint https://192.168.1.103:2379 (context deadline exceeded)
+----------+----+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
| ENDPOINT | ID | VERSION | DB SIZE | IS LEADER | IS LEARNER | RAFT TERM | RAFT INDEX | RAFT APPLIED INDEX | ERRORS |
+----------+----+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
+----------+----+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
```

可以看到192.168.1.102成为了etcd集群的leader

## 4.2查看etcd集群的数据信息

### 4.2.1查看所有的key

```java
root@k8s-master1:~# ETCDCTL_API=3 etcdctl get / --prefix --keys-only 以路径的⽅式所有key信息
......
/registry/services/endpoints/kubernetes-dashboard/kubernetes-dashboard
/registry/services/specs/default/kubernetes
/registry/services/specs/kube-system/kube-dns
/registry/services/specs/kubernetes-dashboard/dashboard-metrics-scraper
/registry/services/specs/kubernetes-dashboard/kubernetes-dashboard
```

### 4.2.2查看kubernetes中所有pod的信息

```java
root@k8s-master1:~# ETCDCTL_API=3 etcdctl get / --prefix --keys-only | grep pods
/registry/pods/kube-system/calico-kube-controllers-5677ffd49-cx5pc
/registry/pods/kube-system/calico-node-66ccx
/registry/pods/kube-system/calico-node-8qk4r
/registry/pods/kube-system/calico-node-cvmn8
/registry/pods/kube-system/calico-node-kh68r
/registry/pods/kube-system/calico-node-q5rhx
/registry/pods/kube-system/calico-node-sphzp
/registry/pods/kube-system/coredns-c5bb68557-62675
#在kubernetes中查看pod信息
root@k8s-deploy:~# kubectl get pods -A
NAMESPACE     NAME                                      READY   STATUS    RESTARTS   AGE
kube-system   calico-kube-controllers-5677ffd49-cx5pc   1/1     Running   1          23h
kube-system   calico-node-66ccx                         1/1     Running   2          46h
kube-system   calico-node-8qk4r                         1/1     Running   5          46h
kube-system   calico-node-cvmn8                         1/1     Running   2          46h
kube-system   calico-node-kh68r                         1/1     Running   2          46h
kube-system   calico-node-q5rhx                         1/1     Running   3          46h
kube-system   calico-node-sphzp                         1/1     Running   5          46h
kube-system   coredns-c5bb68557-62675                   1/1     Running   2          23h
```

### 4.2.3查看kubernetes中所有namespace的信息

```java
root@k8s-master1:~# ETCDCTL_API=3 etcdctl get / --prefix --keys-only | grep namespaces
/registry/namespaces/default
/registry/namespaces/kube-node-lease
/registry/namespaces/kube-public
/registry/namespaces/kube-system
#在kubernetes中查看namespaces信息
root@k8s-deploy:~# kubectl get namespaces 
NAME              STATUS   AGE
default           Active   47h
kube-node-lease   Active   47h
kube-public       Active   47h
kube-system       Active   47h
```

### 4.2.4查看kubernetes中所有deployments的信息

```java
root@k8s-master1:~# ETCDCTL_API=3 etcdctl get / --prefix --keys-only | grep deployments
/registry/deployments/kube-system/calico-kube-controllers
/registry/deployments/kube-system/coredns
#在kubernetes中查看deployments
root@k8s-deploy:~# kubectl get deployments -A
NAMESPACE     NAME                      READY   UP-TO-DATE   AVAILABLE   AGE
kube-system   calico-kube-controllers   1/1     1            1           46h
kube-system   coredns                   1/1     1            1           46h
```

### 4.2.5查看calico网络组件信息

```java
root@k8s-master1:~# ETCDCTL_API=3 etcdctl get / --prefix --keys-only | grep calico
/calico/ipam/v2/assignment/ipv4/block/172.20.107.192-26
/calico/ipam/v2/assignment/ipv4/block/172.20.135.192-26
/calico/ipam/v2/assignment/ipv4/block/172.20.159.128-26
/calico/ipam/v2/assignment/ipv4/block/172.20.169.128-26
/calico/ipam/v2/assignment/ipv4/block/172.20.224.0-26
/calico/ipam/v2/assignment/ipv4/block/172.20.36.64-26
/calico/ipam/v2/handle/ipip-tunnel-addr-k8s-master1
/calico/ipam/v2/handle/ipip-tunnel-addr-k8s-master2
/calico/ipam/v2/handle/ipip-tunnel-addr-k8s-master3
/calico/ipam/v2/handle/ipip-tunnel-addr-k8s-node1
/calico/ipam/v2/handle/ipip-tunnel-addr-k8s-node2
/calico/ipam/v2/handle/ipip-tunnel-addr-k8s-node3
/calico/ipam/v2/handle/k8s-pod-network.5976346f009767c80648dd6f28d1cfb4aaff177bdd1a2bcdcf72eaf1ed3dba23
/calico/ipam/v2/host/k8s-master1/ipv4/block/172.20.159.128-26
/calico/ipam/v2/host/k8s-master2/ipv4/block/172.20.224.0-26
/calico/ipam/v2/host/k8s-master3/ipv4/block/172.20.135.192-26
/calico/ipam/v2/host/k8s-node1/ipv4/block/172.20.36.64-26
/calico/ipam/v2/host/k8s-node2/ipv4/block/172.20.169.128-26
/calico/ipam/v2/host/k8s-node3/ipv4/block/172.20.107.192-26
......
```

### 4.2.6查看指定的key

```java
#查看namespaces中default的key
root@k8s-master1:~# ETCDCTL_API=3 etcdctl get /registry/namespaces/default
/registry/namespaces/default
k8s
v1	Namespace² 
default"*$0d89ae35-e6bd-46ea-9a1f-67ebd1b63d7e2¨º¤zO
kube-apiserverUpdatev¨º¤FieldsV1: 
"f:status":{"f:phase":{}}} 
kubernetes 
Active"
#查看calico的key
root@k8s-master1:~# ETCDCTL_API=3 etcdctl get /calico/ipam/v2/assignment/ipv4/block/172.20.107.192-26
/calico/ipam/v2/assignment/ipv4/block/172.20.107.192-26
{"cidr":"172.20.107.192/26","affinity":"host:k8s-node3","allocations":[0,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unallocated":[5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,1,2,4,3],"attributes":[{"handle_id":"ipip-tunnel-addr-k8s-node3","secondary":{"node":"k8s-node3","type":"ipipTunnelAddress"}}],"deleted":false}
```

### 4.2.7查看所有calico的数据

```java
root@k8s-master1:~# ETCDCTL_API=3 etcdctl get --keys-only --prefix /calico
/calico/ipam/v2/assignment/ipv4/block/172.20.107.192-26
/calico/ipam/v2/assignment/ipv4/block/172.20.135.192-26
/calico/ipam/v2/assignment/ipv4/block/172.20.159.128-26
/calico/ipam/v2/assignment/ipv4/block/172.20.169.128-26
/calico/ipam/v2/assignment/ipv4/block/172.20.224.0-26
/calico/ipam/v2/assignment/ipv4/block/172.20.36.64-26
/calico/ipam/v2/handle/ipip-tunnel-addr-k8s-master1
/calico/ipam/v2/handle/ipip-tunnel-addr-k8s-master2
/calico/ipam/v2/handle/ipip-tunnel-addr-k8s-master3
/calico/ipam/v2/handle/ipip-tunnel-addr-k8s-node1
/calico/ipam/v2/handle/ipip-tunnel-addr-k8s-node2
/calico/ipam/v2/handle/ipip-tunnel-addr-k8s-node3
......
```

## 4.3 etcd增删改查数据

### 4.3.1添加数据

```java
root@k8s-master1:~# ETCDCTL_API=3 /opt/kube/bin/etcdctl put /name zhai
OK
#验证添加的数据
root@k8s-master1:~# ETCDCTL_API=3 /opt/kube/bin/etcdctl get /name 
/name
zhai
```

### 4.3.2改动数据

```java
#改动数据，是重新上传新的数据来覆盖原数据
root@k8s-master1:~# ETCDCTL_API=3 /opt/kube/bin/etcdctl get /name 
/name
zhai
#把name的值该为aaa
root@k8s-master1:~# ETCDCTL_API=3 /opt/kube/bin/etcdctl put /name aaa
OK
root@k8s-master1:~# ETCDCTL_API=3 /opt/kube/bin/etcdctl get /name 
/name
aaa
```

### 4.3.3删除数据

```java
#删除name
root@k8s-master1:~# ETCDCTL_API=3 /opt/kube/bin/etcdctl del /name 
1
root@k8s-master1:~# ETCDCTL_API=3 /opt/kube/bin/etcdctl get /name
root@k8s-master1:~#
```

## 4.4 etcd数据watch机制

基于不断监看数据，发⽣变化就主动触发通知客户端，Etcd v3 的watch机制⽀持watch某个固定的key，也⽀持watch⼀个范围。

相⽐Etcd v2, Etcd v3的⼀些主要变化：

```java
1)接⼝通过grpc提供rpc接⼝，放弃了v2的http接⼝，优势是⻓连接效率提升明显，缺点是使⽤不如以前⽅便，尤其对不⽅便维护⻓连接的场景。
2)废弃了原来的⽬录结构，变成了纯粹的kv，⽤户可以通过前缀匹配模式模拟⽬录。
3)内存中不再保存value，同样的内存可以⽀持存储更多的key。
4)watch机制更稳定，基本上可以通过watch机制实现数据的完全同步。
5)提供了批量操作以及事务机制，⽤户可以通过批量事务请求来实现Etcd v2的CAS机制（批量事务⽀持if条件判断）。
```

在etcd02上监控一个name的key

```java
root@k8s-master1:~# ETCDCTL_API=3 /opt/kube/bin/etcdctl watch /name
```

在etcd01上修改name的key，在etcd02上验证

```java
#添加一个name的值
root@k8s-master2:~# ETCDCTL_API=3 /opt/kube/bin/etcdctl put /name zhai
OK
root@k8s-master1:~# ETCDCTL_API=3 /opt/kube/bin/etcdctl watch /name
PUT
/name
zhai
#修改name的值
root@k8s-master2:~# ETCDCTL_API=3 /opt/kube/bin/etcdctl put /name aaa
OK
root@k8s-mater1:~# ETCDCTL_API=3 /opt/kube/bin/etcdctl watch /name
PUT
/name
zhai
PUT
/name
aaa
#删除name
root@k8s-master2:~# ETCDCTL_API=3 /opt/kube/bin/etcdctl del /name 
1
root@k8s-master1:~# ETCDCTL_API=3 /opt/kube/bin/etcdctl watch /name
PUT
/name
zhai
PUT
/name
aaa
DELETE
/name
```

## 4.5 etcd数据备份与恢复机制

WAL是write ahead log的缩写，顾名思义，也就是在执⾏真正的写操作之前先写⼀个⽇志，预写⽇志。wal: 存放预写式⽇志,最⼤的作⽤是记录了整个数据变化的全部历程。在etcd中，所有数据的修改在提交前，都要先写⼊到WAL中。

### 4.5.1 etcd 集群v3版本数据⼿动备份与恢复

数据备份

```java
root@k8s-master1:~# ETCDCTL_API=3 /opt/kube/bin/etcdctl snapshot save etcd-bak.db
{"level":"info","ts":1644934781.8806252,"caller":"snapshot/v3_snapshot.go:119","msg":"created temporary db file","path":"etcd-bak.db.part"}
{"level":"info","ts":"2022-02-15T22:19:41.886+0800","caller":"clientv3/maintenance.go:200","msg":"opened snapshot stream; downloading"}
{"level":"info","ts":1644934781.8873541,"caller":"snapshot/v3_snapshot.go:127","msg":"fetching snapshot","endpoint":"127.0.0.1:2379"}
{"level":"info","ts":"2022-02-15T22:19:41.947+0800","caller":"clientv3/maintenance.go:208","msg":"completed snapshot read; closing"}
{"level":"info","ts":1644934781.961404,"caller":"snapshot/v3_snapshot.go:142","msg":"fetched snapshot","endpoint":"127.0.0.1:2379","size":"5.0 MB","took":0.080196636}
{"level":"info","ts":1644934781.9614692,"caller":"snapshot/v3_snapshot.go:152","msg":"saved","path":"etcd-bak.db"}
Snapshot saved at etcd-bak.db
```

数据恢复

数据恢复时需要对整个etcd集群的所有成员做恢复

第一步先停止业务及etcd

```java
root@k8s-master1:~#systemctl stop etcd
root@k8s-master2:~#systemctl stop etcd
root@k8s-master3:~#systemctl stop etcd
```

第二步删除etcd的原数据目录

```java
root@k8s-master1:~#rm -rf /var/lib/etcd
root@k8s-master2:~#rm -rf /var/lib/etcd
root@k8s-master3:~#rm -rf /var/lib/etcd
```

第三步在所有etcd成员上恢复数据

```java
#恢复etcd01上的数据
root@k8s-master1:~# ETCDCTL_API=3 etcdctl snapshot restore etcd-bak.db \
> --name=etcd-192.168.1.101 \
> --initial-cluster=etcd-192.168.1.101=https://192.168.1.101:2380,etcd-192.168.1.102=https://192.168.1.102:2380,etcd-192.168.1.103=https://192.168.1.103:2380 \
> --initial-cluster-token=etcd-cluster-0 \
> --initial-advertise-peer-urls=https://192.168.1.101:2380 \
> --data-dir=/var/lib/etcd
{"level":"info","ts":1644940081.6611586,"caller":"snapshot/v3_snapshot.go:296","msg":"restoring snapshot","path":"etcd-bak.db","wal-dir":"/var/lib/etcd/member/wal","data-dir":"/var/lib/etcd","snap-dir":"/var/lib/etcd/member/snap"}
{"level":"info","ts":1644940081.7069404,"caller":"mvcc/kvstore.go:380","msg":"restored last compact revision","meta-bucket-name":"meta","meta-bucket-name-key":"finishedCompactRev","restored-compact-revision":18091}
{"level":"info","ts":1644940081.723146,"caller":"membership/cluster.go:392","msg":"added member","cluster-id":"ee540041cbf7407a","local-member-id":"0","added-peer-id":"4469cb53324fe68b","added-peer-peer-urls":["https://192.168.1.102:2380"]}
{"level":"info","ts":1644940081.7232628,"caller":"membership/cluster.go:392","msg":"added member","cluster-id":"ee540041cbf7407a","local-member-id":"0","added-peer-id":"9f5e0acc1f346641","added-peer-peer-urls":["https://192.168.1.101:2380"]}
{"level":"info","ts":1644940081.7233887,"caller":"membership/cluster.go:392","msg":"added member","cluster-id":"ee540041cbf7407a","local-member-id":"0","added-peer-id":"e519401c4b995768","added-peer-peer-urls":["https://192.168.1.103:2380"]}
{"level":"info","ts":1644940081.7327075,"caller":"snapshot/v3_snapshot.go:309","msg":"restored snapshot","path":"etcd-bak.db","wal-dir":"/var/lib/etcd/member/wal","data-dir":"/var/lib/etcd","snap-dir":"/var/lib/etcd/member/snap"}
#只能将数据恢复到⼀个新的不存在的⽬录中，如果需要恢复到原目录，需要将原目录删除
#恢复etcd02上的数据
root@k8s-master2:~# ETCDCTL_API=3 etcdctl snapshot restore etcd-bak.db \
> --name=etcd-192.168.1.102 \
> --initial-cluster=etcd-192.168.1.101=https://192.168.1.101:2380,etcd-192.168.1.102=https://192.168.1.102:2380,etcd-192.168.1.103=https://192.168.1.103:2380 \
> --initial-cluster-token=etcd-cluster-0 \
> --initial-advertise-peer-urls=https://192.168.1.102:2380 \
> --data-dir=/var/lib/etcd
{"level":"info","ts":1644940197.2187765,"caller":"snapshot/v3_snapshot.go:296","msg":"restoring snapshot","path":"etcd-bak.db","wal-dir":"/var/lib/etcd/member/wal","data-dir":"/var/lib/etcd","snap-dir":"/var/lib/etcd/member/snap"}
{"level":"info","ts":1644940197.260996,"caller":"mvcc/kvstore.go:380","msg":"restored last compact revision","meta-bucket-name":"meta","meta-bucket-name-key":"finishedCompactRev","restored-compact-revision":18091}
{"level":"info","ts":1644940197.2731636,"caller":"membership/cluster.go:392","msg":"added member","cluster-id":"ee540041cbf7407a","local-member-id":"0","added-peer-id":"4469cb53324fe68b","added-peer-peer-urls":["https://192.168.1.102:2380"]}
{"level":"info","ts":1644940197.2733335,"caller":"membership/cluster.go:392","msg":"added member","cluster-id":"ee540041cbf7407a","local-member-id":"0","added-peer-id":"9f5e0acc1f346641","added-peer-peer-urls":["https://192.168.1.101:2380"]}
{"level":"info","ts":1644940197.2733717,"caller":"membership/cluster.go:392","msg":"added member","cluster-id":"ee540041cbf7407a","local-member-id":"0","added-peer-id":"e519401c4b995768","added-peer-peer-urls":["https://192.168.1.103:2380"]}
{"level":"info","ts":1644940197.2862613,"caller":"snapshot/v3_snapshot.go:309","msg":"restored snapshot","path":"etcd-bak.db","wal-dir":"/var/lib/etcd/member/wal","data-dir":"/var/lib/etcd","snap-dir":"/var/lib/etcd/member/snap"}
#只能将数据恢复到⼀个新的不存在的⽬录中，如果需要恢复到原目录，需要将原目录删除
#恢复etcd03上的数据
root@k8s-master3:~# ETCDCTL_API=3 etcdctl snapshot restore etcd-bak.db \
> --name=etcd-192.168.1.103 \
> --initial-cluster=etcd-192.168.1.101=https://192.168.1.101:2380,etcd-192.168.1.102=https://192.168.1.102:2380,etcd-192.168.1.103=https://192.168.1.103:2380 \
> --initial-cluster-token=etcd-cluster-0 \
> --initial-advertise-peer-urls=https://192.168.1.103:2380 \
> --data-dir=/var/lib/etcd
{"level":"info","ts":1644940197.2187765,"caller":"snapshot/v3_snapshot.go:296","msg":"restoring snapshot","path":"etcd-bak.db","wal-dir":"/var/lib/etcd/member/wal","data-dir":"/var/lib/etcd","snap-dir":"/var/lib/etcd/member/snap"}
{"level":"info","ts":1644940197.260996,"caller":"mvcc/kvstore.go:380","msg":"restored last compact revision","meta-bucket-name":"meta","meta-bucket-name-key":"finishedCompactRev","restored-compact-revision":18091}
{"level":"info","ts":1644940197.2731636,"caller":"membership/cluster.go:392","msg":"added member","cluster-id":"ee540041cbf7407a","local-member-id":"0","added-peer-id":"4469cb53324fe68b","added-peer-peer-urls":["https://192.168.1.102:2380"]}
{"level":"info","ts":1644940197.2733335,"caller":"membership/cluster.go:392","msg":"added member","cluster-id":"ee540041cbf7407a","local-member-id":"0","added-peer-id":"9f5e0acc1f346641","added-peer-peer-urls":["https://192.168.1.101:2380"]}
{"level":"info","ts":1644940197.2733717,"caller":"membership/cluster.go:392","msg":"added member","cluster-id":"ee540041cbf7407a","local-member-id":"0","added-peer-id":"e519401c4b995768","added-peer-peer-urls":["https://192.168.1.103:2380"]}
{"level":"info","ts":1644940197.2862613,"caller":"snapshot/v3_snapshot.go:309","msg":"restored snapshot","path":"etcd-bak.db","wal-dir":"/var/lib/etcd/member/wal","data-dir":"/var/lib/etcd","snap-dir":"/var/lib/etcd/member/snap"}
#只能将数据恢复到⼀个新的不存在的⽬录中，如果需要恢复到原目录，需要将原目录删除
```

注意：

```java
#--name=etcd-192.168.1.103 \
#--initial-cluster=etcd-192.168.1.101=https://192.168.1.101:2380,etcd-192.168.1.102=https://192.168.1.102:2380,etcd-192.168.1.103=https://192.168.1.103:2380\
#--initial-cluster-token=etcd-cluster-0 \
#--initial-advertise-peer-urls=https://192.168.1.101:2380 \
#--data-dir=/var/lib/etcd
上面的信息可以在下面的文件中查找
vim /etc/systemd/system/etcd.service
......
  --name=etcd-192.168.1.101 \
  --cert-file=/etc/kubernetes/ssl/etcd.pem \
  --key-file=/etc/kubernetes/ssl/etcd-key.pem \
  --peer-cert-file=/etc/kubernetes/ssl/etcd.pem \
  --peer-key-file=/etc/kubernetes/ssl/etcd-key.pem \
  --trusted-ca-file=/etc/kubernetes/ssl/ca.pem \
  --peer-trusted-ca-file=/etc/kubernetes/ssl/ca.pem \
  --initial-advertise-peer-urls=https://192.168.1.101:2380 \
  --listen-peer-urls=https://192.168.1.101:2380 \
  --listen-client-urls=https://192.168.1.101:2379,http://127.0.0.1:2379 \
  --advertise-client-urls=https://192.168.1.101:2379 \
  --initial-cluster-token=etcd-cluster-0 \
  --initial-cluster=etcd-192.168.1.101=https://192.168.1.101:2380,etcd-192.168.1.102=https://192.168.1.102:2380,etcd-192.168.1.103=https://192.168.1.103:2380 \
  --initial-cluster-state=new \
  --data-dir=/var/lib/etcd \
  --snapshot-count=50000 \
  --auto-compaction-retention=1 \
  --max-request-bytes=10485760 \
  --auto-compaction-mode=periodic \
  --quota-backend-bytes=8589934592
......
```

第四步重启etcd

```java
root@k8s-master1:~#systemctl start etcd
root@k8s-master2:~#systemctl start etcd
root@k8s-master3:~#systemctl start etcd
```

第五步验证

```java
root@k8s-master1:~# export NODE_IPS="192.168.1.101 192.168.1.102 192.168.1.103"
root@k8s-master1:~# for ip in ${NODE_IPS}; do ETCDCTL_API=3 /opt/kube/bin/etcdctl --write-out=table endpoint status --endpoints=https://${ip}:2379 --cacert=/etc/kubernetes/ssl/ca.pem --cert=/etc/kubernetes/ssl/etcd.pem --key=/etc/kubernetes/ssl/etcd-key.pem; done
+----------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
|          ENDPOINT          |        ID        | VERSION | DB SIZE | IS LEADER | IS LEARNER | RAFT TERM | RAFT INDEX | RAFT APPLIED INDEX | ERRORS |
+----------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
| https://192.168.1.101:2379 | 9f5e0acc1f346641 |  3.4.13 |  5.0 MB |      true |      false |       124 |        240 |                240 |        |
+----------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
+----------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
|          ENDPOINT          |        ID        | VERSION | DB SIZE | IS LEADER | IS LEARNER | RAFT TERM | RAFT INDEX | RAFT APPLIED INDEX | ERRORS |
+----------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
| https://192.168.1.102:2379 | 4469cb53324fe68b |  3.4.13 |  5.0 MB |     false |      false |       124 |        240 |                240 |        |
+----------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
+----------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
|          ENDPOINT          |        ID        | VERSION | DB SIZE | IS LEADER | IS LEARNER | RAFT TERM | RAFT INDEX | RAFT APPLIED INDEX | ERRORS |
+----------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
| https://192.168.1.103:2379 | e519401c4b995768 |  3.4.13 |  5.0 MB |     false |      false |       124 |        240 |                240 |        |
+----------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
```

### 4.5.3 使用kubeasz来备份和恢复etcd

```java
root@k8s-deploy:~# cd /etc/kubeasz/
root@k8s-deploy:/etc/kubeasz# ll playbooks/
total 92
drwxrwxr-x  2 root root 4096 Sep 29 16:28 ./
drwxrwxr-x 12 root root  225 Sep 17 20:53 ../
-rw-rw-r--  1 root root  448 Sep 29 16:02 01.prepare.yml
-rw-rw-r--  1 root root   58 Apr 26 10:02 02.etcd.yml
-rw-rw-r--  1 root root  209 Apr 26 10:02 03.runtime.yml
-rw-rw-r--  1 root root  482 Apr 26 10:02 04.kube-master.yml
-rw-rw-r--  1 root root  218 Apr 26 10:02 05.kube-node.yml
-rw-rw-r--  1 root root  408 Apr 26 10:02 06.network.yml
-rw-rw-r--  1 root root   77 Apr 26 10:02 07.cluster-addon.yml
-rw-rw-r--  1 root root   34 Apr 26 10:02 10.ex-lb.yml
-rw-rw-r--  1 root root 3893 Apr 26 10:02 11.harbor.yml
-rw-rw-r--  1 root root 1567 Apr 26 10:02 21.addetcd.yml
-rw-rw-r--  1 root root 1520 Apr 26 10:02 22.addnode.yml
-rw-rw-r--  1 root root 1050 Apr 26 10:02 23.addmaster.yml
-rw-rw-r--  1 root root 3344 Apr 26 10:02 31.deletcd.yml
-rw-rw-r--  1 root root 1566 Apr 26 10:02 32.delnode.yml
-rw-rw-r--  1 root root 1620 Apr 26 10:02 33.delmaster.yml
-rw-rw-r--  1 root root 1891 Apr 26 10:02 90.setup.yml
-rw-rw-r--  1 root root 1054 Apr 26 10:02 91.start.yml
-rw-rw-r--  1 root root  934 Apr 26 10:02 92.stop.yml
-rw-rw-r--  1 root root 1042 Apr 26 10:02 93.upgrade.yml
-rw-rw-r--  1 root root 1786 Apr 26 10:02 94.backup.yml
-rw-rw-r--  1 root root  999 Apr 26 10:02 95.restore.yml
-rw-rw-r--  1 root root  337 Apr 26 10:02 99.clean.yml
root@harbor:/etc/kubeasz# ./ezctl --help
Usage: ezctl COMMAND [args]
-------------------------------------------------------------------------------------
Cluster setups:
    list                     to list all of the managed clusters
    checkout    <cluster>            to switch default kubeconfig of the cluster
    new         <cluster>            to start a new k8s deploy with name 'cluster'
    setup       <cluster>  <step>    to setup a cluster, also supporting a step-by-step way
    start       <cluster>            to start all of the k8s services stopped by 'ezctl stop'
    stop        <cluster>            to stop all of the k8s services temporarily
    upgrade     <cluster>            to upgrade the k8s cluster
    destroy     <cluster>            to destroy the k8s cluster
    backup      <cluster>            to backup the cluster state (etcd snapshot)
    restore     <cluster>            to restore the cluster state from backups
    start-aio                     to quickly setup an all-in-one cluster with 'default' settings
Cluster ops:
    add-etcd    <cluster>  <ip>      to add a etcd-node to the etcd cluster
    add-master  <cluster>  <ip>      to add a master node to the k8s cluster
    add-node    <cluster>  <ip>      to add a work node to the k8s cluster
    del-etcd    <cluster>  <ip>      to delete a etcd-node from the etcd cluster
    del-master  <cluster>  <ip>      to delete a master node from the k8s cluster
    del-node    <cluster>  <ip>      to delete a work node from the k8s cluster
Extra operation:
    kcfg-adm    <cluster>  <args>    to manage client kubeconfig of the k8s cluster
Use "ezctl help <command>" for more information about a given command.
备份：
root@harbor:/etc/kubeasz# ./ezctl backup k8s-ywx 
恢复：
root@harbor:/etc/kubeasz# ./ezctl restore k8s-ywx
```

### 4.5.4 使用kubeasz来添加和删除etcd节点

```java
root@k8s-deploy:/etc/kubeasz# ./ezctl --help
Usage: ezctl COMMAND [args]
-------------------------------------------------------------------------------------
Cluster setups:
    list                     to list all of the managed clusters
    checkout    <cluster>            to switch default kubeconfig of the cluster
    new         <cluster>            to start a new k8s deploy with name 'cluster'
    setup       <cluster>  <step>    to setup a cluster, also supporting a step-by-step way
    start       <cluster>            to start all of the k8s services stopped by 'ezctl stop'
    stop        <cluster>            to stop all of the k8s services temporarily
    upgrade     <cluster>            to upgrade the k8s cluster
    destroy     <cluster>            to destroy the k8s cluster
    backup      <cluster>            to backup the cluster state (etcd snapshot)
    restore     <cluster>            to restore the cluster state from backups
    start-aio                     to quickly setup an all-in-one cluster with 'default' settings
Cluster ops:
    add-etcd    <cluster>  <ip>      to add a etcd-node to the etcd cluster
    add-master  <cluster>  <ip>      to add a master node to the k8s cluster
    add-node    <cluster>  <ip>      to add a work node to the k8s cluster
    del-etcd    <cluster>  <ip>      to delete a etcd-node from the etcd cluster
    del-master  <cluster>  <ip>      to delete a master node from the k8s cluster
    del-node    <cluster>  <ip>      to delete a work node from the k8s cluster
Extra operation:
    kcfg-adm    <cluster>  <args>    to manage client kubeconfig of the k8s cluster
Use "ezctl help <command>" for more information about a given command.
#添加新的etcd节点
root@harbor:/etc/kubeasz# ./ezctl add-etcd k8s-ywx 172.168.33.200
#删除etcd节点
root@harbor:/etc/kubeasz# ./ezctl add-del k8s-ywx 172.168.33.200
```

## 4.6 ETCD数据恢复流程

```java
1、恢复服务器系统
2、重新部署ETCD集群
3、停⽌kube-apiserver/controller-manager/scheduler/kubelet/kube-proxy
4、停⽌ETCD集群
5、各ETCD节点恢复同⼀份备份数据
6、启动各节点并验证ETCD集群
7、启动kube-apiserver/controller-manager/scheduler/kubelet/kube-proxy
8、验证k8s master状态及pod数据
```
