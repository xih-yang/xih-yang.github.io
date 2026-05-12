# 14、Kubernetes - 实战：存储（StatefulSet 控制器实现mysql主从集群的部署）
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/5/14.html
- 分类：容器服务
- 分组：教程目录
## 一、部署原理

使用statefulset控制器部署mysql主从集群的原理如下图所示：

## 二、使用 statefulset控制器部署mysql主从集群

部署MySQL 示例，**包含一个 ConfigMap**，（用于拷贝mysql配置文件）

**两个 Services，**（一个是无头服务，用于名称访问MySQL，一个是clustip，用于客户端通过ip访问）

**一个 StatefulSet**（部署MySQL主从集群的）。

## 创建ConfigMap

从以下的 YAML 配置文件创建 ConfigMap ：

```java
[root@server1 pv]# mkdir mysql
[root@server1 pv]# cd mysql/
[root@server1 mysql]# vim configmap.yaml 
[root@server1 mysql]# cat configmap.yaml 
apiVersion: v1
kind: ConfigMap
metadata:
  name: mysql
  labels:
    app: mysql
data:
  master.cnf: |
    Apply this config only on the master.
    [mysqld]
    log-bin
  slave.cnf: |
    Apply this config only on slaves.
    [mysqld]
    super-read-only
```

这个ConfigMap 提供 my.cnf 覆盖，使我们可以独立控制 MySQL 主服务器和从服务器的配置。 在这种情况下，我们希望**主服务器能够开启log-bin开启二进制文件**将复制日志提供给从服务器，并且希望从服务器拒绝任何不是通过复制进行的写操作开启 **super-read-only**。

ConfigMap 本身没有什么特别之处，它可以使不同部分应用于不同的 Pod。 每个 Pod 都会决定在初始化时要看基于 StatefulSet 控制器提供的信息。

运行yaml文件：

```java
[root@server1 mysql]# kubectl apply -f configmap.yaml 
configmap/mysql created
[root@server1 mysql]# kubectl get cm
NAME    DATA   AGE
mysql   2      2s
```

查看这个cm的详细信息：

```java
[root@server1 mysql]# kubectl describe cm mysql 
Name:         mysql
Namespace:    default
Labels:       app=mysql
Annotations:  
Data
====
master.cnf:				#主服务器的配置文件
----
# Apply this config only on the master.
[mysqld]
log-bin
slave.cnf:				#从服务器的配置文件
----
# Apply this config only on slaves.
[mysqld]
super-read-only
Events:  <none>
```

## 创建Services

从以下YAML 配置文件创建服务：

```java
[root@server1 mysql]# vim service.yaml 
[root@server1 mysql]# cat service.yaml 
# Headless service for stable DNS entries of StatefulSet members.
apiVersion: v1
kind: Service
metadata:
  name: mysql
  labels:
    app: mysql
spec:
  ports:
  - name: mysql
    port: 3306
  clusterIP: None
  selector:
    app: mysql
---
# Client service for connecting to any MySQL instance for reads.
# For writes, you must instead connect to the master: mysql-0.mysql.
apiVersion: v1
kind: Service
metadata:
  name: mysql-read
  labels:
    app: mysql
spec:
  ports:
  - name: mysql
    port: 3306
  selector:
    app: mysql
[root@server1 mysql]# 
[root@server1 mysql]# kubectl apply -f service.yaml 
service/mysql created
service/mysql-read created
[root@server1 mysql]# kubectl get svc
NAME         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
mysql        ClusterIP   None            <none>        3306/TCP   23s
mysql-read   ClusterIP   10.100.94.198   <none>        3306/TCP   23s
```

Headless Service 给 StatefulSet 控制器为集合中每个 Pod 创建的 DNS 条目提供了一个宿主。因为 Headless Service 名为 mysql，所以可以通过在同一 Kubernetes 集群和 namespace 中的任何其他 Pod 内解析 .mysql 来访问 Pod。**（例如mysql-0.mysql.default.cluster.local）**

客户端Service 称为 mysql-read，是一种常规 Service，具有其自己的群集 IP，该群集 IP 在报告为就绪的所有MySQL Pod 中分配连接。可能端点的集合包括 MySQL 主节点和所有从节点。

请注意，只有读取查询才能使用负载平衡的客户端 Service。因为只有一个 MySQL 主服务器，所以客户端应直接连接到 MySQL 主服务器 Pod (通过其在 Headless Service 中的 DNS 条目)以执行写入操作。

## StatefulSet控制器创建pod

最后，从以下 YAML 配置文件创建 StatefulSet：

```java
[root@server1 mysql]# vim statefulset.yaml
[root@server1 mysql]# cat statefulset.yaml 
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mysql
spec:
  selector:
    matchLabels:
      app: mysql
  serviceName: mysql
  replicas: 3
  template:
    metadata:
      labels:
        app: mysql
    spec:
      initContainers:
      - name: init-mysql
        image: mysql:5.7
        command:
        - bash
        - "-c"
        - |
          set -ex
          Generate mysql server-id from pod ordinal index.
          [[ hostname =~ -([0-9]+)$ ]] || exit 1
          ordinal=${BASH_REMATCH[1]}
          echo [mysqld] > /mnt/conf.d/server-id.cnf
          Add an offset to avoid reserved server-id=0 value.
          echo server-id=$((100 + $ordinal)) >> /mnt/conf.d/server-id.cnf
          Copy appropriate conf.d files from config-map to emptyDir.
          if [[ $ordinal -eq 0 ]]; then
            cp /mnt/config-map/master.cnf /mnt/conf.d/
          else
            cp /mnt/config-map/slave.cnf /mnt/conf.d/
          fi
        volumeMounts:
        - name: conf
          mountPath: /mnt/conf.d
        - name: config-map
          mountPath: /mnt/config-map
      - name: clone-mysql
        image: xtrabackup:1.0
        command:
        - bash
        - "-c"
        - |
          set -ex
          Skip the clone if data already exists.
          [[ -d /var/lib/mysql/mysql ]] && exit 0
          Skip the clone on master (ordinal index 0).
          [[ hostname =~ -([0-9]+)$ ]] || exit 1
          ordinal=${BASH_REMATCH[1]}
          [[ $ordinal -eq 0 ]] && exit 0
          Clone data from previous peer.
          ncat --recv-only mysql-$(($ordinal-1)).mysql 3307 | xbstream -x -C /var/lib/mysql
          Prepare the backup.
          xtrabackup --prepare --target-dir=/var/lib/mysql
        volumeMounts:
        - name: data
          mountPath: /var/lib/mysql
          subPath: mysql
        - name: conf
          mountPath: /etc/mysql/conf.d
      containers:
      - name: mysql
        image: mysql:5.7
        env:
        - name: MYSQL_ALLOW_EMPTY_PASSWORD
          value: "1"
        ports:
        - name: mysql
          containerPort: 3306
        volumeMounts:
        - name: data
          mountPath: /var/lib/mysql
          subPath: mysql
        - name: conf
          mountPath: /etc/mysql/conf.d
        resources:
          requests:
            cpu: 500m
            memory: 300Mi
        livenessProbe:
          exec:
            command: ["mysqladmin", "ping"]
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
        readinessProbe:
          exec:
            Check we can execute queries over TCP (skip-networking is off).
            command: ["mysql", "-h", "127.0.0.1", "-e", "SELECT 1"]
          initialDelaySeconds: 5
          periodSeconds: 2
          timeoutSeconds: 1
      - name: xtrabackup
        image: xtrabackup:1.0
        ports:
        - name: xtrabackup
          containerPort: 3307
        command:
        - bash
        - "-c"
        - |
          set -ex
          cd /var/lib/mysql
          Determine binlog position of cloned data, if any.
          if [[ -f xtrabackup_slave_info && "x$(<xtrabackup_slave_info)" != "x" ]]; then
            XtraBackup already generated a partial "CHANGE MASTER TO" query
            because we're cloning from an existing slave. (Need to remove the tailing semicolon!)
            cat xtrabackup_slave_info | sed -E 's/;$//g' > change_master_to.sql.in
            Ignore xtrabackup_binlog_info in this case (it's useless).
            rm -f xtrabackup_slave_info xtrabackup_binlog_info
          elif [[ -f xtrabackup_binlog_info ]]; then
            We're cloning directly from master. Parse binlog position.
            [[ cat xtrabackup_binlog_info =~ ^(.*?)[[:space:]]+(.*?)$ ]] || exit 1
            rm -f xtrabackup_binlog_info xtrabackup_slave_info
            echo "CHANGE MASTER TO MASTER_LOG_FILE='${BASH_REMATCH[1]}',\
                  MASTER_LOG_POS=${BASH_REMATCH[2]}" > change_master_to.sql.in
          fi
          Check if we need to complete a clone by starting replication.
          if [[ -f change_master_to.sql.in ]]; then
            echo "Waiting for mysqld to be ready (accepting connections)"
            until mysql -h 127.0.0.1 -e "SELECT 1"; do sleep 1; done
            echo "Initializing replication from clone position"
            mysql -h 127.0.0.1 \
                  -e "$(<change_master_to.sql.in), \
                          MASTER_HOST='mysql-0.mysql', \
                          MASTER_USER='root', \
                          MASTER_PASSWORD='', \
                          MASTER_CONNECT_RETRY=10; \
                        START SLAVE;" || exit 1
            In case of container restart, attempt this at-most-once.
            mv change_master_to.sql.in change_master_to.sql.orig
          fi
          Start a server to send backups when requested by peers.
          exec ncat --listen --keep-open --send-only --max-conns=1 3307 -c \
            "xtrabackup --backup --slave-info --stream=xbstream --host=127.0.0.1 --user=root"
        volumeMounts:
        - name: data
          mountPath: /var/lib/mysql
          subPath: mysql
        - name: conf
          mountPath: /etc/mysql/conf.d
        resources:
          requests:
            cpu: 100m
            memory: 100Mi
      volumes:
      - name: conf
        emptyDir: {
     }
      - name: config-map
        configMap:
          name: mysql
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 1Gi
```

StatefulSet 控制器一次按顺序启动 Pod 序数索引。它一直等到每个 Pod 报告就绪为止，然后再开始下一个 Pod。

此外，控制器为每个 Pod 分配一个唯一，稳定的表单名称 - 其结果是 Pods 名为 mysql-0，mysql-1 和 mysql-2。

上述StatefulSet 清单中的 Pod 模板利用这些属性来执行 MySQL 复制的有序启动。

## 生成配置

在启动Pod 规范中的任何容器之前， Pod 首先按照定义的顺序运行所有初始容器。

**第一个名为 init-mysql 的初始化容器**，**根据序号索引生成特殊的 MySQL 配置文件。**

该脚本通过从 Pod 名称的末尾提取索引来确定自己的序号索引，该名称由 hostname 命令返回。 然后将序数(带有数字偏移量以避免保留值)保存到 MySQL conf.d 目录中的文件 server-id.cnf 中。 这将转换 StatefulSet 提供的唯一，稳定的身份控制器进入需要相同属性的 MySQL 服务器 ID 的范围。

通过将内容复制到 conf.d 中，init-mysql 容器中的脚本也可以应用 ConfigMap 中的 master.cnf 或 slave.cnf。由于示例拓扑由单个 MySQL 主节点和任意数量的从节点组成，因此脚本仅将序数 0 指定为主节点，而将其他所有人指定为从节点。与 StatefulSet 控制器的部署顺序保证,这样可以确保 MySQL 主服务器在创建从服务器之前已准备就绪，以便它们可以开始复制。

## 克隆现有数据

通常，当新的 Pod 作为从节点加入集合时，必须假定 MySQL 主节点可能已经有数据。还必须假设复制日志可能不会一直追溯到时间的开始。 这些保守假设的关键是允许正在运行的 StatefulSet 随时间扩大和缩小而不是固定在其初始大小。

**第二个名为 clone-mysql 的初始化容器**，第一次在从属 Pod 上以空 PersistentVolume 启动时，会对从属 Pod 执行克隆操作。这意味着它将从另一个运行的 Pod 复制所有现有数据，因此其本地状态足够一致，可以开始主从服务器复制。

MySQL 本身不提供执行此操作的机制，因此该示例使用了一种流行的开源工具 Percona XtraBackup。 在克隆期间，源 MySQL 服务器可能会降低性能。 为了最大程度地减少对 MySQL 主机的影响，该脚本指示每个 Pod 从序号较低的 Pod 中克隆（即mysql-2从mysql-1中克隆）。 可以这样做的原因是 StatefulSet 控制器始终确保在启动 Pod N + 1 之前 Pod N 已准备就绪。

## 开始复制

初始化容器成功完成后，常规容器将运行。 MySQL Pods 由运行实际 mysqld 服务器的 mysql 容器和充当辅助工具的 xtrabackup 容器组成。

xtrabackup 辅助工具查看克隆的数据文件，并确定是否有必要在从属服务器上初始化 MySQL 复制。 如果是这样，它将等待 mysqld 准备就绪，然后执行带有从 XtraBackup 克隆文件中提取的复制参数 CHANGE MASTER TO 和 START SLAVE 命令。

一旦从服务器开始复制后，它会记住其 MySQL 主服务器。并且如果服务器重新启动或连接中断，则会自动重新连接。 另外，因为从服务器会以其稳定的 DNS 名称查找主服务器(mysql-0.mysql)，即使由于重新安排而获得新的 Pod IP，他们也会自动找到主服务器。

最后，开始复制后，xtrabackup 容器监听来自其他 Pod 的连接数据克隆请求。 如果 StatefulSet 扩大规模，或者下一个 Pod 失去其 PersistentVolumeClaim 并需要重新克隆，则此服务器将无限期保持运行。

上述yaml文件中需要的镜像有：mysql:5.7 和 xtrabackup:1.0，需要提前拉取放到私有仓库里面。
