# 12、Kubernetes - 实战：在Kubernetes部署和运维Presslabs MySQL
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/4/12.html
- 分类：容器服务
- 分组：教程目录
## 一、前言

文章[Kubernetes Mysql Operator方案对比》](/zhuanlan/container/kubernetes/4/11.html)详细分析了Presslabs的MySQL Operator方案的架构、功能特点和Presslabs在他们产品中的实践效果，本文根据Presslabs官网的描述[《Getting started with MySQL operator》](https://www.presslabs.com/docs/mysql-operator/)来部署Operator和MySQL集群，并分析一些运维操作。

Operator架构图

## 二、部署Presslabs MySQL Operator

### 2.1 通过helm部署charts

通过查看chart文件，可以看到当前operator的版本是0.3.8；并且在values.yaml中，进行了如下设置：

```java
  replicas: 3
  ...
  installCRDs: true
  ...
  persistence:
    enabled: true
    If defined, storageClassName: <storageClass>
    If set to "-", storageClassName: "", which disables dynamic provisioning
    If undefined (the default) or set to null, no storageClassName spec is
      set, choosing the default provisioner.  (gp2 on AWS, standard on
      GKE, AWS & OpenStack)
    storageClass: "ceph-rbd"
    accessMode: "ReadWriteOnce"
    size: 1Gi
```

下面一些orchestrator的配置没有做改动，比如：

```java
    Automated recovery (this is opt-in, so we need to set these)
    Prevent recovery flip-flop, by disabling auto-recovery for 5 minutes per
    cluster
    RecoveryPeriodBlockSeconds: 300
    Do not ignore any host for auto-recovery
    RecoveryIgnoreHostnameFilters: []
    Recover both, masters and intermediate masters
    RecoverMasterClusterFilters: ['.*']
    RecoverIntermediateMasterClusterFilters: ['.*']
    reset slave all and set read_only=0 on promoted master
    ApplyMySQLPromotionAfterMasterFailover: false
    MasterFailoverDetachReplicaMasterHost: true
    https://github.com/github/orchestrator/blob/master/docs/configuration-recovery.md#promotion-actions
    Safety! do not disable unless you know what you are doing
    FailMasterPromotionIfSQLThreadNotUpToDate: true
    DetachLostReplicasAfterMasterFailover: true
    orchestrator hooks called in the following order
    for more information about template: https://github.com/github/orchestrator/blob/master/go/logic/topology_recovery.go#L256
    ProcessesShellCommand: "sh"
```

通过helm部署的资源如下：

```java
-rwxr-xr-x 1 root root 5672 1月  22 21:56 statefulset.yaml
-rwxr-xr-x 1 root root  327 1月  22 21:56 serviceaccount.yaml
-rwxr-xr-x 1 root root  536 1月  22 21:56 role.yaml
-rwxr-xr-x 1 root root  680 1月  22 21:56 rolebinding.yaml
-rwxr-xr-x 1 root root 1353 1月  22 21:56 podsecuritypolicy.yaml
-rwxr-xr-x 1 root root  735 1月  22 21:56 pdb.yaml
-rwxr-xr-x 1 root root 1541 1月  22 21:56 orc-service.yaml
-rwxr-xr-x 1 root root  655 1月  22 21:56 orc-secret.yaml
-rwxr-xr-x 1 root root  887 1月  22 21:56 orc-ingress.yaml
-rwxr-xr-x 1 root root 1407 1月  22 21:56 orc-config.yaml
-rwxr-xr-x 1 root root 2443 1月  22 21:56 _helpers.tpl
-rwxr-xr-x 1 root root 1660 1月  22 21:56 crds.yaml
-rwxr-xr-x 1 root root 1407 1月  22 21:56 clusterrole.yaml
-rwxr-xr-x 1 root root  618 1月  22 21:56 clusterrolebinding.yaml
```

另外还通过ingress暴露一个域名来访问orchestractor的UI：

```java
piVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
  name: presslab-mysql-operator-ingress
  namespace: operator
spec:
  rules:
  - host: mysql-operator.lab.local
    http:
      paths:
      - backend:
          serviceName: presslabs-mysql-operator
          servicePort: 80
        path: /
```

通过下面的命令进行部署：

```java
helm install presslabs-mysql-operator presslabs/mysql-operator -f values.yaml --namespace operator
```

这里要说明的是operator不支持动态扩容，否则新生成的POD里面的key会和原集群的key match不上：

> 2020-04-22 06:23:53 ERROR x509: certificate is valid for MySQL_Server_5.7.26-29_Auto_Generated_Server_Certificate, not my-cluster-1-mysql-0.mysql.operator-cluster

我们这里部署的operator集群有三个节点：

operator部署之后还会注册如下2个CRD：

```java
kubectl get crd | grep presslabs
mysqlbackups.mysql.presslabs.org                  2020-03-27T05:40:31Z
mysqlclusters.mysql.presslabs.org                 2020-03-27T05:40:37Z
```

并创建如下的服务，其中由于orchestrator是通过raft协议进行集群管理的，所以POD的10008端口会打开：

> [root@k8s-master-01 mysql-operator-presslabs]# kubectl get svc -n operator
>
> NAME TYPE CLUSTER-IP EXTERNAL-IP PORT(S) AGE
>
> presslabs-mysql-operator ClusterIP 10.96.251.251  80/TCP 30m
>
> presslabs-mysql-operator-0-svc ClusterIP 10.96.205.25  80/TCP,10008/TCP 30m
>
> presslabs-mysql-operator-1-svc ClusterIP 10.96.30.76  80/TCP,10008/TCP 30m
>
> presslabs-mysql-operator-2-svc ClusterIP 10.96.208.222  80/TCP,10008/TCP 30m

里面的operator容器和orchestrator容器都会有选主的过程，Operator POD在起来之后，其中给一个会成为leader(这个例子中presslabs-mysql-operator-2是leader)：

> 2020/04/22 08:02:19 [DEBUG] raft: Votes needed: 2
>
> 2020/04/22 08:02:19 [DEBUG] raft: Vote granted from 10.96.208.222:10008. Tally: 1
>
> 2020/04/22 08:02:19 [DEBUG] raft: Vote granted from 10.96.30.76:10008. Tally: 2
>
> 2020/04/22 08:02:19 [INFO] raft: Election won. Tally: 2
>
> 2020/04/22 08:02:19 [INFO] raft: Node at 10.96.208.222:10008 [Leader] entering Leader state
>
> 2020/04/22 08:02:19 [INFO] raft: pipelining replication to peer 10.96.30.76:10008

后续部署cluster的处理会由presslabs-mysql-operator-2来进行：

> [root@k8s-master-01 ~]# kubectl logs -f presslabs-mysql-operator-2 -n operator -c operator
>
> {"level":"info","ts":1587542531.5914958,"logger":"kubebuilder.controller","msg":"Starting EventSource","controller":"mysqlbackup-controller","source":"kind source: /, Kind="}
>
> {"level":"info","ts":1587542531.5917566,"logger":"kubebuilder.controller","msg":"Starting EventSource","controller":"mysqlbackup-controller","source":"kind source: /, Kind="}
>
> {"level":"info","ts":1587542531.5919662,"logger":"kubebuilder.controller","msg":"Starting EventSource","controller":"mysqlbackupcron-controller","source":"kind source: /, Kind="}
>
> {"level":"info","ts":1587542531.592171,"logger":"kubebuilder.controller","msg":"Starting EventSource","controller":"controller.mysqlcluster","source":"kind source: /, Kind="}
>
> {"level":"info","ts":1587542531.5922117,"logger":"kubebuilder.controller","msg":"Starting EventSource","controller":"controller.mysqlcluster","source":"kind source: /, Kind="}
>
> {"level":"info","ts":1587542531.592351,"logger":"kubebuilder.controller","msg":"Starting EventSource","controller":"controller.mysqlcluster","source":"kind source: /, Kind="}
>
> {"level":"info","ts":1587542531.5924706,"logger":"kubebuilder.controller","msg":"Starting EventSource","controller":"controller.mysqlcluster","source":"kind source: /, Kind="}
>
> {"level":"info","ts":1587542531.592589,"logger":"kubebuilder.controller","msg":"Starting EventSource","controller":"controller.mysqlcluster","source":"kind source: /, Kind="}
>
> {"level":"info","ts":1587542531.5927098,"logger":"kubebuilder.controller","msg":"Starting EventSource","controller":"controller.mysqlcluster","source":"kind source: /, Kind="}
>
> {"level":"info","ts":1587542531.6496875,"logger":"kubebuilder.controller","msg":"Starting EventSource","controller":"controller.mysqlNode","source":"kind source: /, Kind="}
>
> {"level":"info","ts":1587542531.649941,"logger":"kubebuilder.controller","msg":"Starting EventSource","controller":"controller.orchestrator","source":"kind source: /, Kind="}
>
> {"level":"info","ts":1587542531.64998,"logger":"kubebuilder.controller","msg":"Starting EventSource","controller":"controller.orchestrator","source":"channel source: 0xc0006a4870"}
>
> I0422 08:02:11.650174 1 leaderelection.go:205] attempting to acquire leader lease operator/mysql-operator-leader-election...
>
> {"level":"info","ts":1587544037.4970384,"logger":"controller.mysqlcluster","msg":"syncing cluster","cluster":"operator-cluster/my-cluster-1"}
>
> {"level":"info","ts":1587544037.497133,"logger":"upgrades.cluster","msg":"annotation not set on cluster"}
>
> {"level":"info","ts":1587544037.5643048,"logger":"controller.mysqlcluster","msg":"cluster status","status":{}}
>
> {"level":"info","ts":1587544037.6648607,"logger":"controller.mysqlcluster","msg":"syncing cluster","cluster":"operator-cluster/my-cluster-1"}
>
> {"level":"info","ts":1587544037.6691175,"logger":"controller.mysqlcluster","msg":"cluster status","status":{}}
>
> {"level":"info","ts":1587544038.4630077,"logger":"controller.orchestrator","msg":"reconciling cluster","cluster":"operator-cluster/my-cluster-1"}
>
> {"level":"info","ts":1587544038.4685085,"logger":"controller.mysqlcluster","msg":"syncing cluster","cluster":"operator-cluster/my-cluster-1"}
>
> {"level":"info","ts":1587544038.4726372,"logger":"controller.mysqlcluster","msg":"cluster status","status":{}}

在operator部署完毕之后，可以通过ingress定义的域名来访问orchestrator的Web UI：

## 三、部署Presslabs MySQL Cluster

可以通过如下方式部署一个5节点的percona mysql集群：

```java
apiVersion: mysql.presslabs.org/v1alpha1
kind: MysqlCluster
metadata:
  name: my-cluster-1
spec:
  replicas: 5
  secretName: my-secret
  volumeSpec:
    persistentVolumeClaim:
      accessModes: [ "ReadWriteOnce" ]
      storageClassName: ceph-rbd
      resources:
        requests:
          storage: 1Gi
```

此时operator会监控到mysqlclusters这个CRD的创建请求，进行下述集群的部署：

```java
[root@k8s-master-01 examples]# kubectl get pod -o wide -n operator-cluster 
NAME                   READY     STATUS    RESTARTS   AGE       IP               NODE          NOMINATED NODE
my-cluster-1-mysql-0   4/4       Running   0          29m       10.244.127.222   k8s-node-04   <none>
my-cluster-1-mysql-1   4/4       Running   0          13m       10.244.127.234   k8s-node-04   <none>
my-cluster-1-mysql-2   4/4       Running   0          26m       10.244.154.208   k8s-node-01   <none>
my-cluster-1-mysql-3   4/4       Running   0          25m       10.244.89.180    k8s-node-03   <none>
my-cluster-1-mysql-4   4/4       Running   0          24m       10.244.45.38     k8s-node-02   <none>
```

并且会部署两个kubernetes服务：

> my-cluster-1-mysql ClusterIP 10.96.216.54  3306/TCP 25m
>
> my-cluster-1-mysql-master ClusterIP 10.96.225.228  3306/TCP 25m

在节点部署之后，会借助orchestractor进行leader选举，其中my-cluster-1-mysql-master对于当前选举出来的的master节点，可以进行读写操作：

> kubectl describe svc my-cluster-1-mysql-master -n operator-cluster
>
> Name: my-cluster-1-mysql-master
>
> ......
>
> Selector: app.kubernetes.io/managed-by=mysql.presslabs.org,app.kubernetes.io/name=mysql,mysql.presslabs.org/cluster=my-cluster-1,role=master
>
> Type: ClusterIP
>
> IP: 10.96.225.228
>
> Port: mysql 3306/TCP
>
> TargetPort: 3306/TCP
>
> Endpoints: 10.244.127.222:3306
>
> Session Affinity: None
>
> Events:

而my-cluster-1-mysql后面是所有的mysql节点，可以用于读操作：

```java
kubectl describe svc my-cluster-1-mysql -n operator-cluster 
Name:              my-cluster-1-mysql
Namespace:         operator-cluster
Labels:            app.kubernetes.io/component=database
                   app.kubernetes.io/instance=my-cluster-1
                   app.kubernetes.io/managed-by=mysql.presslabs.org
                   app.kubernetes.io/name=mysql
                   app.kubernetes.io/version=5.7.26
                   mysql.presslabs.org/cluster=my-cluster-1
                   mysql.presslabs.org/service-type=ready-nodes
Annotations:       <none>
Selector:          app.kubernetes.io/managed-by=mysql.presslabs.org,app.kubernetes.io/name=mysql,healthy=yes,mysql.presslabs.org/cluster=my-cluster-1
Type:              ClusterIP
IP:                10.96.216.54
Port:              mysql  3306/TCP
TargetPort:        3306/TCP
Endpoints:         10.244.127.234:3306,10.244.154.208:3306,10.244.44.254:3306 + 2 more...
Session Affinity:  None
Events:            <none>
```

这两个服务的管理通过operator更新mysql节点的tag来进行。

## 四、运维Presslabs MySQL Cluster

### 4.1 operator/orchestrator HA

如果operator/orchestrator发生故障，如果又恰好是leader，则会重新进行leader选举，比如我将现在的leader presslabs-mysql-operator-2 POD重启，则presslabs-mysql-operator-0成为了新的leader：

> 2020/04/22 09:10:56 [DEBUG] raft-net: 10.96.205.25:10008 accepted connection from: 172.2.2.11:40546
>
> 2020/04/22 09:10:56 [INFO] raft: Duplicate RequestVote for same term: 81
>
> 2020/04/22 09:10:57 [WARN] raft: Election timeout reached, restarting election
>
> 2020/04/22 09:10:57 [INFO] raft: Node at 10.96.205.25:10008 [Candidate] entering Candidate state
>
> 2020/04/22 09:10:57 [DEBUG] raft: Votes needed: 2
>
> 2020/04/22 09:10:57 [DEBUG] raft: Vote granted from 10.96.205.25:10008. Tally: 1
>
> 2020/04/22 09:10:57 [DEBUG] raft: Vote granted from 10.96.30.76:10008. Tally: 2
>
> 2020/04/22 09:10:57 [INFO] raft: Election won. Tally: 2
>
> 2020/04/22 09:10:57 [INFO] raft: Node at 10.96.205.25:10008 [Leader] entering Leader state
>
> 2020/04/22 09:10:57 [INFO] raft: pipelining replication to peer 10.96.30.76:10008
>
> 2020/04/22 09:10:57 [DEBUG] raft: Node 10.96.205.25:10008 updated peer set (2): [10.96.205.25:10008 10.96.208.222:10008 10.96.30.76:10008]

整个过程mysql业务集群没有任何感知和影响。

### 4.2 mysql master HA

如果mysql集群的master被重启，则也会进行leader选举，新的leader会被打上master的tag，则my-cluster-1-mysql-master的后端端点也会变化：

> [root@k8s-master-01 examples]# kubectl describe svc my-cluster-1-mysql-master -n operator-cluster
>
> ......
>
> Selector: app.kubernetes.io/managed-by=mysql.presslabs.org,app.kubernetes.io/name=mysql,mysql.presslabs.org/cluster=my-cluster-1,role=master
>
> Type: ClusterIP
>
> IP: 10.96.225.228
>
> Port: mysql 3306/TCP
>
> TargetPort: 3306/TCP
>
> Endpoints: 10.244.127.234:3306
>
> Session Affinity: None
>
> Events:

### 4.3 orchestrator UI操作

**1) 改变mysql replica关系，通过拖拽就能完成：**

**2) 改变master**

**3) 操作mysql节点**

**4) 建立co-master**
