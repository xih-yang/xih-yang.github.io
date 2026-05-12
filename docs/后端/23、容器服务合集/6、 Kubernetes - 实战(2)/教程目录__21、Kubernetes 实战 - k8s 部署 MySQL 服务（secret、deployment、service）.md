# 21、Kubernetes 实战 - k8s 部署 MySQL 服务（secret、deployment、service）
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/2/21.html
- 分类：容器服务
- 分组：教程目录
## 一，前言

上一篇，介绍基于 k8s 项目部署流程设计；

本篇，介绍 MySQL 服务的部署；

## 二，部署 MySQL 服务

部署MySQL

- 可以为指定 node 添加污点，专门用于 mysql 部署（当前只有一个节点，不考虑）；
- 为了保证mysql容器重启时数据不会丢失：创建 mysql 数据目录，用于存储 mysql 数据，实现 MySQL 数据的持久化；
- 创建 Secret 对象，向为 mysql 容器提供用户名、密码信息；
- 创建 mysql Deployment 配置文件，并创建 deploy 完成 pod 部署；
- 创建 mysql Service 配置文件，并创建 service 解决 ip 漂移问题，对外提供 pod 访问；
- 为 k8s-master 安装 mysql，使 k8s-master 能够使用 mysql 命令，测试数据库使用；

## 三，MySQL 数据的持久化

容器中的数据是需要保留的，否则容器重启就没了，需要创建数据目录，存储 MySQL 数据；

在本地创建 MySQL 数据文件夹，然后挂载到 MySQL 容器，实现 MySQL 数据的可以持久化

在k8s-node 节点创建 MySQL 数据文件夹（此文件夹必须为空，否则导致 MySQL 启动失败；

```java
// 创建数据目录文件夹（mysql 运行时的数据目录，约定好的）
[root@k8s-master ~]# mkdir /var/lib/mysql
[root@k8s-master ~]# ll /var/lib/mysql
总用量 0
```

创建一个新的文件夹：cicd

将所有的配置文件都放在这个cicd目录下

```java
[root@k8s-master ~]# mkdir cicd
[root@k8s-master ~]# cd cicd/
[root@k8s-master cicd]# 
```

## 四，创建 Secret 对象

通过Secret 对象，将 MySQL 的用户名、密码传递到镜像中使用；

创建Secret 对象：mysql-auth

```java
// 创建 secret，generic：基于普通文本格式，--from-literal：从字面量创建
[root@k8s-master cicd]# kubectl create secret generic mysql-auth --from-literal=username=root --from-literal=password=123456
secret/mysql-auth created
[root@k8s-master cicd]# kubectl get secret mysql-auth
NAME                  TYPE                                  DATA   AGE
mysql-auth            Opaque                                2      17s
[root@k8s-master cicd]# kubectl get secret mysql-auth -o yaml
apiVersion: v1
data:
  password: MTIzNDU2
  username: cm9vdA==
kind: Secret
metadata:
  creationTimestamp: "2022-01-06T07:14:25Z"
  managedFields:
  - apiVersion: v1
    fieldsType: FieldsV1
    fieldsV1:
      f:data:
        .: {}
        f:password: {}
        f:username: {}
      f:type: {}
    manager: kubectl-create
    operation: Update
    time: "2022-01-06T07:14:25Z"
  name: mysql-auth
  namespace: default
  resourceVersion: "1934676"
  uid: c4a219d2-3754-4133-8484-9b4caa5a54cd
type: Opaque
[root@k8s-master cicd]# echo MTIzNDU2 | base64 -d
123456
[root@k8s-master cicd]# echo cm9vdA== | base64 -d
root
```

## 五，创建 Deployment

创建mysql Deployment 配置文件，并创建 deploy 完成 pod 部署；

创建deploy：deployment-cicd-mysql.yaml

```java
[root@k8s-master cicd]# vi deployment-cicd-mysql.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cicd-mysql
spec:
  replicas: 1
  selector:
    matchLabels:
      app: cicd-mysql
  template:
    metadata:
      labels:
        app: cicd-mysql
    spec:
      containers:
      - name: cicd-mysql
        image: mysql:5.7
        imagePullPolicy: IfNotPresent镜像拉取策略:如果不存在就拉取镜像
        args:
        - "--ignore-db-dir=lost+found"
        ports:
        - containerPort: 3306
        volumeMounts:挂载数据卷
        - name: mysql-data
          mountPath: "/var/lib/mysql"挂载到容器内的目录
        env:环境变量
        - name: MYSQL_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysql-auth
              key: password引用mysql-auth中的password值
      volumes:数据卷
      - name: mysql-data
        hostPath:宿主机路径
          path: /var/lib/mysql宿主机的目录
          type: Directory 
备注：以下配置文档中有，但视频没用
      tolerations:
      - key: "mysql"
        operator: "Equal"
        value: "true"
        effect: "NoSchedule"
```

备注：

mysql 自带 root 用户，只设置 root 用户密码即可使用；

环境变量 env MYSQL_ROOT_PASSWORD 是在 mysql:5.7 的镜像中约定的；

mysql容器启动成功后，会读取到 MYSQL_ROOT_PASSWORD 并设置为密码；

如：docker run mysql:5.7 --env PASSWORD=123

生效配置

```java
[root@k8s-master cicd]# kubectl apply -f deployment-cicd-mysql.yaml
deployment.apps/cicd-mysql created
[root@k8s-master cicd]# kubectl get pods
NAME                          READY   STATUS             RESTARTS   AGE
cicd-mysql-745975859b-kstnh   0/1     Pending            0          65s
pay-v1-6db6455b8-np2hw        1/1     Running            0          6h38m
user-v1-9f4d589cc-rdmnz       1/1     Running            0          24h
v4-57b4cf7fd9-zcl45           0/1     ImagePullBackOff   0          7d
v4-fb4cd75f5-bf2pf            0/1     ImagePullBackOff   0          2d17h
```

清理一下资源，删除 pay-v1、user-v1、v4 的 deploy

```java
[root@k8s-master cicd]# kubectl delete deploy pay-v1 user-v1 v4
deployment.apps "pay-v1" deleted
deployment.apps "user-v1" deleted
deployment.apps "v4" deleted
[root@k8s-master cicd]# kubectl get pods
NAME                          READY   STATUS    RESTARTS   AGE
cicd-mysql-745975859b-kstnh   0/1     Pending   0          4m8s
```

cicd-mysql-745975859b-kstnh 这个 pod 是 pending 状态

```java
[root@k8s-master cicd]# kubectl describe pods cicd-mysql-745975859b-kstnh
Events:
  Type     Reason            Age                  From               Message
  ----     ------            ----                 ----               -------
  Warning  FailedScheduling  49s (x7 over 4m51s)  default-scheduler  0/2 nodes are available: 1 node(s) had taint {node-role.kubernetes.io/master: }, that the pod didn't tolerate, 1 node(s) had taint {pay-v1: true}, that the pod didn't tolerate.
kubectl logs cicd-mysql-6cbd4f95-g64hh 
```

这是因为，k8s-node 服务器之前配置了 pay-v1: true，需要删除掉污点

```java
// 查看污点
[root@k8s-master cicd]# kubectl describe node k8s-node
Taints:             pay-v1=true:NoSchedule
// 删除污点
[root@k8s-master cicd]# kubectl taint nodes k8s-node pay-v1-
node/k8s-node untainted
// 再次查看，没有污点了
[root@k8s-master cicd]# kubectl describe node k8s-node
Taints:             <none>
```

再看pod 信息，已经在创建中了

```java
[root@k8s-master cicd]# kubectl get pods
NAME                          READY   STATUS              RESTARTS   AGE
cicd-mysql-745975859b-kstnh   0/1     ContainerCreating   0          20m
```

但是有些问题，再看一下容器描述

```java
[root@k8s-master cicd]# kubectl describe pods cicd-mysql-745975859b-kstnh
Events:
  Type     Reason            Age                    From               Message
  ----     ------            ----                   ----               -------
  Warning  FailedScheduling  6m58s (x20 over 24m)   default-scheduler  0/2 nodes are available: 1 node(s) had taint {node-role.kubernetes.io/master: }, that the pod didn't tolerate, 1 node(s) had taint {pay-v1: true}, that the pod didn't tolerate.
  Normal   Scheduled         6m36s                  default-scheduler  Successfully assigned default/cicd-mysql-745975859b-kstnh to k8s-node
  Warning  FailedMount       2m15s (x2 over 4m33s)  kubelet            Unable to attach or mount volumes: unmounted volumes=[mysql-data], unattached volumes=[mysql-data default-token-q4qxd]: timed out waiting for the condition
  Warning  FailedMount       24s (x11 over 6m35s)   kubelet            MountVolume.SetUp failed for volume "mysql-data" : hostPath type check failed: /var/lib/mysql is not a directory
```

原因是，pod 在 k8s-node 服务器上部署，但 k8s-node 服务器上并没有/var/lib/mysql目录

所以，需要在 k8s-node 服务器上创建/var/lib/mysql目录

```java
[root@k8s-node ~]# mkdir /var/lib/mysql
```

删除pod，再看新启动的 pod，已经正常 Running

（注意：1，不删除 pod 过一会儿也会正常 Running；2，删除 pod后，副本会重新创建）

```java
[root@k8s-master deployment]# kubectl delete pod cicd-mysql-745975859b-kstnh
pod "cicd-mysql-745975859b-kstnh" deleted
[root@k8s-master deployment]# kubectl get pods
NAME                          READY   STATUS    RESTARTS   AGE
cicd-mysql-745975859b-gpwzh   1/1     Running   0          10s
[root@k8s-master deployment]# kubectl describe pods cicd-mysql-745975859b-gpwzh
Events:
  Type    Reason     Age   From               Message
  ----    ------     ----  ----               -------
  Normal  Scheduled  29s   default-scheduler  Successfully assigned default/cicd-mysql-745975859b-gpwzh to k8s-node
  Normal  Pulled     25s   kubelet            Container image "mysql:5.7" already present on machine
  Normal  Created    25s   kubelet            Created container cicd-mysql
  Normal  Started    25s   kubelet            Started container cicd-mysql
```

查看日志：

```java
[root@k8s-master deployment]# kubectl logs cicd-mysql-745975859b-gpwzh
2022-01-07T01:39:13.425378Z 0 [Note] mysqld: ready for connections.
Version: '5.7.36'  socket: '/var/run/mysqld/mysqld.sock'  port: 3306  MySQL Community Server (GPL)
```

mysql 已经启动成功，等待连接

## 六，k8s-master 安装 mysql 命令

为k8s-master 安装 mysql，使 k8s-master 能够使用 mysql 命令，测试数据库使用；

由于k8s-maste 没有安装 mysql 所以不能使用 mysql 命令

1，k8s-maste 安装 mysql

2，可以进入容器中操作

```java
[root@k8s-master deployment]# kubectl exec -it cicd-mysql-745975859b-gpwzh -- bash
root@cicd-mysql-745975859b-gpwzh:/# mysql -uroot -p123456
mysql: [Warning] Using a password on the command line interface can be insecure.
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 4
Server version: 5.7.36 MySQL Community Server (GPL)
Copyright (c) 2000, 2021, Oracle and/or its affiliates.
Oracle is a registered trademark of Oracle Corporation and/or its
affiliates. Other names may be trademarks of their respective
owners.
Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.
mysql> show databases;
++
| Database           |
++
| information_schema |
| mysql              |
| performance_schema |
| sys                |
++
4 rows in set (0.01 sec)
mysql> show tables;
+----------------+
| Tables_in_cicd |
+----------------+
| users          |
+----------------+
1 row in set (0.00 sec)
mysql> select * from users;
Empty set (0.00 sec)
```

\

创建cicd 数据库，创建表

```java
mysql> create database cicd;
Query OK, 1 row affected (0.04 sec)
mysql> use cicd;
Database changed
mysql>` CREATE TABLE users (
    ->`   id int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
    ->`   name varchar(255) NOT NULL COMMENT '',
    ->`   age int(11) NOT NULL COMMENT '',
    ->`   sex varchar(255) NOT NULL COMMENT '1 2',
    ->`   PRIMARY KEY (id)
    -> ) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8;
Query OK, 0 rows affected (0.03 sec)
```

退出mysql，退出pod，回到 k8s-master

```java
mysql> exit;
Bye
root@cicd-mysql-745975859b-gpwzh:/# exit
exit
```

给k8s-master 安装 mysql：

```java
// 下载MySQL源安装包
wget http://dev.mysql.com/get/mysql57-community-release-el7-11.noarch.rpm
// 安装MySQL源
yum -y install mysql57-community-release-el7-11.noarch.rpm
// 安装 mysql
yum install mysql-community-server -y
```

k8s-master 访问 MySQL

```java
[root@k8s-master ~]# cat /etc/hosts
::1	localhost	localhost.localdomain	localhost6	localhost6.localdomain6
127.0.0.1	localhost	localhost.localdomain	localhost4	localhost4.localdomain4
172.17.178.106	k8s-node
172.17.178.105	k8s-master
[root@k8s-master cicd]# mysql -h172.17.178.105 -P3306 -uroot -p123456
mysql: [Warning] Using a password on the command line interface can be insecure.
ERROR 2003 (HY000): Can't connect to MySQL server on '172.17.178.105' (111)
```

还不能访问，因为没有服务

## 七，创建 Service

由于pod 的 ip 是会漂移的， 需要通过 Service 访问 pod，需要创建服务

创建service：service-cicd-mysql.yaml

```java
[root@k8s-master cicd]# vi service-cicd-mysql.yaml
apiVersion: v1
kind: Service
metadata:源数据
  name: service-cicd-mysql
spec:规格
  selector:选择器
    app: cicd-mysql与deployment配置中的container-name相对应
  ports:将pod的 3306端口代理到宿主机的3306端口
  - protocol: TCP
    port: 3306
    targetPort: 3306虚拟端口->真正的端口要看Service启动后实际分配的
  type: NodePort不写就不能访问到pod
```

生效配置，服务启动

```java
[root@k8s-master cicd]# kubectl apply -f service-cicd-mysql.yaml
service/service-cicd-mysql created
[root@k8s-master cicd]# kubectl get service
NAME                 TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
kubernetes           ClusterIP   10.96.0.1       <none>        443/TCP          16d
service-cicd-mysql   NodePort    10.108.224.96   <none>        3306:30509/TCP   11s
service-pay-v1       NodePort    10.97.250.199   <none>        80:30114/TCP     2d19h
service-user-v1      NodePort    10.104.13.40    <none>        80:31071/TCP     14d
```

3306:30509 服务的内部端口/外部端口（外部访问 Service 中的 mysql 服务使用的端口号）

数据库端口：访问 Service 的 30509 端口

```java
[root@k8s-master cicd]# mysql -h172.17.178.105 -P30509 -uroot -p123456
mysql: [Warning] Using a password on the command line interface can be insecure.
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 7
Server version: 5.7.36 MySQL Community Server (GPL)
Copyright (c) 2000, 2021, Oracle and/or its affiliates.
Oracle is a registered trademark of Oracle Corporation and/or its
affiliates. Other names may be trademarks of their respective
owners.
Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.
mysql> use cicd;
Database changed
mysql> show tables;
+----------------+
| Tables_in_cicd |
+----------------+
| users          |
+----------------+
1 row in set (0.00 sec)
mysql> exit;
Bye
```

数据库配置完成；

## 八，结尾

本篇，完成了 mysql 服务的创建和测试；

下一篇，介绍后端服务的部署；
