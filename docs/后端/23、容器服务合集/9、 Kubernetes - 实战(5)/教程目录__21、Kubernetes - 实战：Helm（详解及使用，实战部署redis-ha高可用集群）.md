# 21、Kubernetes - 实战：Helm（详解及使用，实战部署redis-ha高可用集群）
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/5/21.html
- 分类：容器服务
- 分组：教程目录
## 一、Helm

Helm是Kubernetes 应用的包管理工具，主要用来管理 Charts，类似Linux系统的yum。

Helm Chart 是用来封装 Kubernetes 原生应用程序的一系列 YAML 文件。可以在你部署应用的时候自定义应用程序的一些 Metadata，以便于应用程序的分发。

对于应用发布者而言，可以通过 Helm 打包应用、管理应用依赖关系、管理应用版本并发布应用到软件仓库。

对于使用者而言，使用 Helm 后不用需要编写复杂的应用部署文件，可以以简单的方式在 Kubernetes 上查找、安装、升级、回滚、卸载应用程序。

## 二、Helm安装

安装包的下载地址：`https://github.com/helm/helm/releases`，最新版本3.2.1.

下载软件包：`helm-v3.2.1-linux-amd64.tar.gz`

解压：

```java
[root@server1 ~]# tar zxf helm-v3.2.1-linux-amd64.tar.gz 
[root@server1 ~]# cd linux-amd64/
[root@server1 linux-amd64]# ls
helm  LICENSE  README.md
[root@server1 linux-amd64]# cp helm /usr/local/bin/
```

使命令自动补齐：

```java
[root@server1 linux-amd64]# echo "source <(helm completion bash)" >> ~/.bashrc
[root@server1 linux-amd64]# source ~/.bashrc
```

helm部署完成。

## 三、Helm仓库的使用

搜索官方helm hub chart库：

```java
[root@server1 linux-amd64]# helm search hub redis
```

Helm 添加第三方 Chart 库：

添加微软库：

```java
[root@server1 linux-amd64]# helm repo add stable http://mirror.azure.cn/kubernetes/charts/
"stable" has been added to your repositories
```

添加第三库之后就可以使用以下方式查询：

```java
[root@server1 linux-amd64]# helm search repo redis
```

注意：加-l选项可以查看历史版本

删除第三方库：

```java
[root@server1 linux-amd64]# helm repo remove aliyun 
"aliyun" has been removed from your repositories
```

## 四、使用Helm部署redis-ha

拉取部署文件

```java
[root@server1 linux-amd64]# helm pull stable/redis-ha
[root@server1 linux-amd64]# ls
helm  LICENSE  README.md  redis-ha-4.4.4.tgz
```

不指定标签时默认拉取最新版本，拉取下来是一个压缩包

解压

```java
[root@server1 linux-amd64]# tar zxf redis-ha-4.4.4.tgz -C /root/helm
```

```java
[root@server1 linux-amd64]# cd
[root@server1 ~]# cd helm/
[root@server1 helm]# ls
redis-ha
[root@server1 helm]# cd redis-ha/
[root@server1 redis-ha]# ls
Chart.yaml  ci  OWNERS  README.md  templates  values.yaml
```

上述文件中README.md 为帮助文档，目录templates中为模板部署文件，部署文件中的变量都保存在values.yaml文件中，因此我们在部署应用时只需要更改values.yaml文件即可。

查看目录结构：

```java
[root@server1 redis-ha]# tree .
.
├── Chart.yaml
├── ci
│   └── haproxy-enabled-values.yaml
├── OWNERS
├── README.md
├── templates
│   ├── _configs.tpl
│   ├── _helpers.tpl
│   ├── NOTES.txt
│   ├── redis-auth-secret.yaml
│   ├── redis-ha-announce-service.yaml
│   ├── redis-ha-configmap.yaml
│   ├── redis-ha-exporter-script-configmap.yaml
│   ├── redis-ha-pdb.yaml
│   ├── redis-haproxy-deployment.yaml
│   ├── redis-haproxy-serviceaccount.yaml
│   ├── redis-haproxy-servicemonitor.yaml
│   ├── redis-haproxy-service.yaml
│   ├── redis-ha-rolebinding.yaml
│   ├── redis-ha-role.yaml
│   ├── redis-ha-serviceaccount.yaml
│   ├── redis-ha-servicemonitor.yaml
│   ├── redis-ha-service.yaml
│   ├── redis-ha-statefulset.yaml
│   └── tests
│       ├── test-redis-ha-configmap.yaml
│       └── test-redis-ha-pod.yaml
└── values.yaml
```

更改变量文件

```java
[root@server1 redis-ha]# vim values.yaml 
```

这里需要镜像redis: 5.0.6-alpine，更改镜像路径，还需要更改副本数，我这里设置的2，即一主一从。

## 部署redis高可用集群

支持多种安装方式：(helm默认读取~/.kube/config信息连接k8s集群)

```java
$ helm install redis-ha stable/redis-ha	
$ helm install redis-ha redis-ha-4.4.0.tgz
$ helm install redis-ha path/redis-ha
$ helm install redis-ha https://example.com/charts/redis-ha-4.4.0.tgz
$ helm pull stable/redis-ha		//拉取应用到本地
$ helm status redis-ha			//查看状态
$ helm uninstall redis-ha			//卸载
```

注意：以上操作均是在默认的namespace下的示例，其他namespace需要加-n选项

我们这里直接安装：

```java
[root@server1 redis-ha]# kubectl create namespace redis
namespace/redis created
[root@server1 redis-ha]# helm install redis-ha . -n redis 
```

其中redis-ha为名称，上述命令表示使用当前目录的部署文件在redis命名空间中创建名为redis-ha的高可用集群。

创建后查看：

```java
[root@server1 redis-ha]# kubectl -n redis get all
NAME                    READY   STATUS    RESTARTS   AGE
pod/redis-ha-server-0   2/2     Running   0          28s
pod/redis-ha-server-1   2/2     Running   0          19s
NAME                          TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)              AGE
service/redis-ha              ClusterIP   None             <none>        6379/TCP,26379/TCP   29s
service/redis-ha-announce-0   ClusterIP   10.105.143.195   <none>        6379/TCP,26379/TCP   29s
service/redis-ha-announce-1   ClusterIP   10.101.152.37    <none>        6379/TCP,26379/TCP   29s
NAME                               READY   AGE
statefulset.apps/redis-ha-server   2/2     29s
```

可以看到创建了两个pod，其中server-0为master，还有两个svc和一个statefulset控制器。

## 测试集群高可用

每个pod中有两个容器redis和sentinel，我们进入redis容器查看：

```java
[root@server1 redis-ha]# kubectl -n redis exec -it redis-ha-server-0 -c redis -- sh
/data $ redis-cli
127.0.0.1:6379> info Replication
# Replication
role:master
connected_slaves:1
min_slaves_good_slaves:1
slave0:ip=10.101.152.37,port=6379,state=online,offset=25236,lag=0
master_replid:4baa1ff233604d357f9a5b2d6b100f90192d309c
master_replid2:0000000000000000000000000000000000000000
master_repl_offset:25236
second_repl_offset:-1
repl_backlog_active:1
repl_backlog_size:1048576
repl_backlog_first_byte_offset:1
repl_backlog_histlen:25236
```

使用info Replication来差可能主机信息，可以看出redis-ha-server-0为master主机。

执行SHUTDOWN命令来使主机宕机：

```java
127.0.0.1:6379> SHUTDOWN
command terminated with exit code 137
```

等重建好了之后再次查看pod角色：

```java
[root@server1 redis-ha]# kubectl -n redis exec -it redis-ha-server-0 -c redis -- sh
/data $ redis-cli
127.0.0.1:6379> info Replication
# Replication
role:slave
master_host:10.101.152.37
master_port:6379
...
```

可以看出redis-ha-server-0已经变成了从机，而主机的ip为10.101.152.37，这时就实现了主从的切换。

访问master主机：

```java
/data $ nslookup redis-ha.redis.svc.cluster.local			#通过解析查看master主机
```

```java
nslookup: can't resolve '(null)': Name does not resolve
Name:      redis-ha.redis.svc.cluster.local
Address 1: 10.244.1.127 redis-ha-server-0.redis-ha.redis.svc.cluster.local
Address 2: 10.244.2.109 10-244-2-109.redis-ha-announce-1.redis.svc.cluster.local
/data $ redis-cli -h redis-ha-announce-1.redis.svc.cluster.local
redis-ha-announce-1.redis.svc.cluster.local:6379> info Replication
# Replication
role:master
connected_slaves:1
min_slaves_good_slaves:1
slave0:ip=10.105.143.195,port=6379,state=online,offset=57996,lag=1
master_replid:f475aa004c2eb055a0a19b59e52e88cf90b6219d
master_replid2:564b948de16fb4db8b30a8a57c3d64d447b1252f
master_repl_offset:57996
second_repl_offset:7242
repl_backlog_active:1
repl_backlog_size:1048576
repl_backlog_first_byte_offset:594
repl_backlog_histlen:57403
redis-ha-announce-1.redis.svc.cluster.local:6379> 
```

可以看出redis-ha-server-1变成了master主机，有一个slave主机。

## 集群的动态拉伸

可以直接更改变量文件中的副本数量实现集群的动态拉伸：

```java
[root@server1 redis-ha]# vim values.yaml
```

将副本数更改为3.

使用upgrade选项更新集群：

```java
[root@server1 redis-ha]# helm -n redis upgrade redis-ha .
```

更新后查看pod可以看出已经变成了3个：

```java
[root@server1 redis-ha]# kubectl -n redis get pod
NAME                READY   STATUS    RESTARTS   AGE
redis-ha-server-0   2/2     Running   2          20m
redis-ha-server-1   2/2     Running   0          20m
redis-ha-server-2   0/2     Pending   0          12s
```

也可以使用以下命令查看更新历史以便回滚：

```java
[root@server1 redis-ha]# helm -n redis history redis-ha 
REVISION	UPDATED                 	STATUS    	CHART         	APP VERSION	DESCRIPTION     
1       	Sun May 10 23:15:35 2020	superseded	redis-ha-4.4.4	5.0.6      	Install complete
2       	Sun May 10 23:35:35 2020	deployed  	redis-ha-4.4.4	5.0.6      	Upgrade complete
[root@server1 redis-ha]# helm -n redis historyrollback redis-ha 1  回滚
```

实验后删除：

```java
[root@server1 redis-ha]# helm uninstall redis-ha -n redis 
release "redis-ha" uninstalled
[root@server1 redis-ha]# kubectl -n redis get pod
No resources found in redis namespace.
[root@server1 redis-ha]# kubectl delete namespaces redis 
namespace "redis" deleted
```
