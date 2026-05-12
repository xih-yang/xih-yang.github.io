# 19、Kubernetes - 实战：持久化存储（Longhorn）
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/9/19.html
- 分类：容器服务
- 分组：教程目录
## Longhorn

除了本地存储、NFS 共享存储之外，还有块存储。在 Kubernetes 中，块存储的方案有很多，比如 Ceph RBD，这里主要介绍 Rancher 开源的一款 Kubernetes 的云原生分布式块存储方案 - `Longhorn`。

使用Longhorn 可以：

- 使用 Longhorn 卷作为 Kubernetes 集群中分布式有状态应用程序的持久存储。
- 将块存储分区为 Longhorn 卷，以便可以在有或没有云提供商的情况下使用 Kubernetes 卷。
- 跨多个节点和数据中心复制块存储以提高可用性。
- 将备份数据存储在 NFS 或 AWS S3 等外部存储中。
- 创建跨集群灾难恢复卷，以便可以从第二个 Kubernetes 集群快速恢复主 Kubernetes 集群中的数据。
- 调度一个卷的快照，并将备份调度到 NFS 或 S3 兼容的二级存储。
- 从备份还原卷。
- 不中断持久卷的情况下升级 Longhorn。

Longhorn 还带有独立的 UI，可以使用 Helm、kubectl 或 Rancher 应用程序目录进行安装。

## 系统架构

Longhorn 为每个卷创建一个专用的存储控制器，并在多个节点上存储的多个副本之间同步复制该卷。Longhorn 在整体上分为两层：`数据平面` 和 `控制平面`。

- Longhorn Engine 是存储控制器，对应数据平面。
- Longhorn Manager 对应控制平面。

Longhorn Manager 会以 DaemonSet 的形式在 Longhorn 集群中的每个节点上运行，它负责在 Kubernetes 集群中创建和管理卷，并处理来自 UI 或 Kubernetes 卷插件的 API 调用，遵循 Kubernetes 控制器模式。

Longhorn Manager 通过与 APIServer 通信来创建新的 Longhorn volume CRD，并一直 Watch APIServer 的响应，当发现创建了一个新的 Longhorn volume CRD 时，Longhorn Manager 就会去创建一个新的对应卷。

当Longhorn Manager 被要求创建一个卷时，它会在卷所连接的节点上创建一个 Longhorn Engine 实例，并在每个将放置副本的节点上创建一个副本。通过副本的多条数据访问路径，确保了 Longhorn 卷的高可用性，即使某个副本或引擎出现问题，也不会影响所有副本或 Pod 对卷的访问。

Longhorn Engine 始终与使用 Longhorn 卷的 Pod 在同一节点中运行，它在存储在多个节点上的多个副本之间同步复制卷。

如下图所示，描述了 Longhorn 卷、Longhorn Engine、副本实例和磁盘之间的读/写数据流:

关系图说明：

- 上图有3个 Longhorn 卷实例。
- 每个卷都有一个专用控制器，称为 Longhorn Engine，并作为 Linux 进程运行。
- 每个 Longhorn 卷有两个副本，每个副本也是一个 Linux 进程。
- 通过为每个卷创建单独的 Longhorn Engine，如果一个控制器发生故障，其他卷的功能不会受到影响。

注意：图中的 Engine 并非是单独的一个 Pod，而是每一个 Volume 会对应一个 golang exec 出来的 Linux 进程

在Longhorn 中，每个 Engine 只需要服务一个卷，简化了存储控制器的设计，由于控制器软件的故障域与单个卷隔离，因此控制器崩溃只会影响一个卷。由于 Longhorn Engine 足够简单和轻便，因此可以创建多达 100000 个独立的 Engine，Kubernetes 去调度这些独立的 Engine，从一组共享的磁盘中提取资源，并与 Longhorn 合作形成一个弹性的分布式块存储系统。

因为每个卷都有自己的控制器，所以每个卷的控制器和副本实例也可以升级，而不会导致 IO 操作明显中断。Longhorn 可以创建一个长时间运行的 job 任务来协调所有卷的升级，而不会中断系统的运行。

Longhorn 是通过 CSI 驱动在 Kubernetes 中管理的，CSI 驱动通过调用 Longhorn 来创建卷，为 Kubernetes 工作负载创建持久性数据，CSI 插件可以让我们创建、删除、附加、分离、挂载卷，并对卷进行快照操作，Kubernetes 集群内部使用 CSI 接口与Longhorn CSI 驱动进行通信，而 Longhorn CSI 驱动是通过使用 Longhorn API 与 Longhorn Manager 进行通信。

此外Longhorn 还提供一个 UI 界面程序，通过 Longhorn API 与 Longhorn Manager 进行交互，通过 Longhorn UI 可以管理快照、备份、节点和磁盘等，此外，集群工作节点的空间使用情况还可以通过 Longhorn UI 查看。

## 安装条件

要在Kubernetes 集群上安装 Longhorn，需要集群的每个节点都必须满足以下要求：

- 与 Kubernetes 兼容的容器运行时。
- Kubernetes v1.18+。
- 安装 open-iscsi，并且 iscsid 守护程序在所有节点上运行，这是必要的，因为 Longhorn 依赖主机上的 iscsiadm 为 Kubernetes 提供持久卷。
- RWX 支持需要每个节点上都安装 NFSv4 客户端。
- 宿主机文件系统支持 file extents 功能来存储数据，目前支持：ext4 与 XFS。
- bash、curl、findmnt、grep、awk、blkid、lsblk 等工具必须安装。
- Mount propagation 必须启用，它允许将一个容器挂载的卷与同一 pod 中的其他容器共享，甚至可以与同一节点上的其他 pod 共享。
- Longhorn workloads 必须能够以 root 身份运行才能正确部署和操作 Longhorn。

## 配置依赖

为了验证这些环境要求，Longhorn 官方提供了一个脚本来帮助我们进行检查，执行该脚本需要在本地安装 `jq` 工具，脚本地址：

> https://github.com/longhorn/longhorn/blob/master/scripts/environment_check.sh

可以下载下来在服务器上面执行：

提示所有节点要安装 `open-iscsi`，其它服务也可以一并安装好：

```java
# 直接 yum 安装
yum install -y iscsi-initiator-utils nfs-utils
```

## 安装 Longhorn

先准备两台机器作为数据节点，打上标签：

```java
kubectl label nodes worker-01 worker-02 node.longhorn.io/create-default-disk=true
```

这个标签有特殊含义，可以配合 longhorn helm 的 values 参数：`createDefaultDiskLabeledNodes` 一起使用，开启之后只有这个标签的节点才会存数据。具体可以参考官方文档：

> https://longhorn.io/kb/tip-only-use-storage-on-a-set-of-nodes/

这里通过官方推荐的 helm 的方式安装，方便调整配置：

```java
# 添加 longhorn 的仓库源
helm repo add longhorn https://charts.longhorn.io
helm repo update
```

查看默认的 values 配置文件，然后对部分配置进行修改：

> https://github.com/longhorn/longhorn/blob/master/chart/values.yaml

需要里面的某些配置进行修改：

```java
# 下载 helm 包
cd /opt/service/kubernetes/addons/
vim longhorn-values.yaml
```

内容如下：

```java
defaultSettings:
  特定的数据存储节点
  createDefaultDiskLabeledNodes: true
  配置默认数据存放地址
  defaultDataPath: /data/longhorn
ingress:
  Ingress 配置
  enabled: true
  ingressClassName: nginx
  host: longhorn.k8s.io
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: 10000m
```

执行安装：

```java
helm upgrade --install longhorn longhorn/longhorn --namespace longhorn-system --create-namespace -f longhorn-values.yaml
```

查看安装进度：

```java
kubectl get pods -n longhorn-system -w -o wide
```

完成后如图所示：

可以看到，由于设置了标签并开启了配置，只有 worker-01 和 worker-02 节点才有用于存储副本的 `instance-manager-r-xxx` Pod。

运行的主要 Pod 说明：

- csi-xxx：csi 原生的组件。
- longhorn-manager-xxx：控制器，为 Longhorn UI 或者 CSI 插件提供 API，主要功能是通过修改 Kubernetes CRD 来触发控制循环，比如 volume attach/detach 操作。
- longhorn-ui-xxx：提供 Longhorn UI 可视化的控制页面。
- Longhorn Engine 数据平面，由于配置 nodeSelector，所有只有两个节点有，否则会每个节点都部署：
- Engine Mode（`instance-manager-e-xxx` 的 Pod），Engine 连接到副本实现 volume 的数据平面
- Replica Mode（`instance-manager-r-xxx` 的 Pod），Replica 负责实际数据的写入的副本，每个副本都包含完整数据，任何写操作都会同步到所有副本，读操作从任意一个副本读取数据。

此时在本地配置 ingress nginx 的域名 hosts 解析就能直接访问，没有验证：

存储的几种状态：

- Schedulable：可用于 Longhorn 卷调度的实际空间。
- Reserved：为其他应用程序和系统保留的空间。
- Used：Longhorn、系统和其他应用程序已使用的实际空间。
- Disabled：不允许调度 Longhorn 卷的磁盘/节点的总空间。

现在的实际情况就是：

只有两台机器开启了数据存储，总 40G 磁盘，每台机器都用了 10G 左右，剩下每台各 10G 空闲，但是因为每台机器都保存完整副本，所以总可以调度的磁盘为最小的那台机器的磁盘容量，也就是 10G 左右。

在Node 页面，Longhorn 会显示每个节点的空间分配、调度和使用信息，其中没有打标签的节点就是 `Disabled` 状态：

安装完成之后会默认创建一个 StorageClass：

## 测试

使用默认的 StorageClass 创建 PVC：

```java
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc-longhorn
spec:
  storageClassName: longhorn
  resources:
    requests:
      storage: 1Gi
  accessModes:
    - ReadWriteOnce
```

如图所示：

然后使用这个 PVC 部署一个 mysql 进行测试：

```java
apiVersion: apps/v1
kind: Deployment
metadata:
  name: deploy-mysql
spec:
  selector:
    matchLabels:
      app.kuberneets.io/name: mysql
  template:
    metadata:
      labels:
        app.kuberneets.io/name: mysql
    spec:
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: pvc-longhorn
      containers:
      - name: mysql
        image: mysql:5.6
        env:
          - name: MYSQL_ROOT_PASSWORD
            value: "123456"
        ports:
          - containerPort: 3306
            name: mysql
        volumeMounts:
          - name: data
            mountPath:  /var/lib/mysql
```

此时，Pod 就能够被调度到所有容器，但是使用的是 Longhorn 作为持久存储。

登录Pod 中创建数据库，完成之后删除 Pod：

此时Pod 可能会被调度到其它机器，然后登录 Pod 再次查看，发现数据库依然存在。

查看数据卷：

发现数据集处于 `Degraded` 降级状态， 原因在于只有两个存储数据的节点，也就只有两个副本。

## 新增数据节点

只需要再找一个节点打上安装时候的标签：

```java
kubectl label nodes worker-03 node.longhorn.io/create-default-disk=true
```

此时会在该节点自动创建相关 Pod，然后加入集群：

此时就处于 Headlthy 状态了！

## PVC 扩容

查看StorageClass 是否支持动态扩容：

```java
kubectl describe sc longhorn
```

如果有参数 `allowVolumeExpansion: true` 则表示支持。

在Longhorn 界面上直接就能进行扩容：

## 数据快照

Longhorn 提供了备份恢复功能，其方法类似于在使用虚拟机的时候给系统创建一个快照 `snapshot`，它保存了 volume 在指定时间点的状态信息。

同时也可以在数据存储节点进行查看：

其中volume-snap 开头的就是快照相关文件：

- img：镜像文件
- meta：元数据文件，可以直接查看，内容大致如下：

```java
{"Name":"volume-head-002.img","Parent":"volume-snap-ec1792e8-7a07-4a53-9fd9-cf53a7b11374.img","Removed":false,"UserCreated":true,"Created":"2023-03-20T15:18:57Z","Labels":null}
```

Parent 为父级镜像，这表明快照是增量快照。

除了手动创建快照，Longhorn 还支持定时任务创建：

完成后可以看到目前的相关快照信息：

同时，也可以在 Recurring Job 也没看到：

为了避免当卷长时间没有新数据时，定时任务可能会用相同的备份和空快照覆盖旧的备份/快照，Longhorn 进行了以下处理：

- Recurring backup job：仅在自上次备份以来卷有新数据时才进行新备份
- Recurring snapshot job：仅在卷头(volume head)中有新数据时才拍摄新快照

除了在UI 界面上创建定时任务备份，也可以通过资源清单创建，格式如下：

```java
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: longhorn
provisioner: driver.longhorn.io
parameters:
  numberOfReplicas: "3"
  staleReplicaTimeout: "30"
  fromBackup: ""
  recurringJobs: '[
    {
      "name":"snap",
      "task":"snapshot",
      "cron":"*/1 * * * *",
      "retain":1
    },
    {
      "name":"backup",
      "task":"backup",
      "cron":"*/2 * * * *",
      "retain":1
    }
  ]'
```

## 数据备份

要备份卷就需要在 Longhorn 中配置一个备份目标，可以是一个 NFS 服务或者 S3 兼容的对象存储服务，用于存储 Longhorn 卷的备份数据。配置方式一般有两种：

- 在使用 helm 安装的时候，可以通过 values 文件中的 defaultSettings.backupTarget 去指定。
- 在 UI 界面 Settings/General/BackupTarget 配置。

配置好之后在 PVC 界面创建的备份的按钮才能正常使用：

可以给备份添加个标签，便于区分：

如图所示：

此时也可以在 Backup 中看到：

同时在NFS 的目录下面可以看到一个叫做 `backupstore` 的目录，下面存储了备份信息。

## 数据故障模拟

这里删除之前的 Deployment 和 PVC，然后重新创建：

登录Pod 中添加数据：

```java
kubectl exec -it deploy-mysql-b66d58c56-2f7q7 -- mysql -uroot -p123456
```

这里添加 hello 和 world 两个数据库：

创建备份：

删除刚刚创建的数据库：

此时故障模拟已经完成，接下来就是恢复数据！

## 数据恢复

找到备份的数据进行 restore：

查看恢复任务：

恢复完成后，基于这个任务创建 PV/PVC：

设置PV 和 PVC 名称：

此时系统中会创建对应的 PV 和 PVC：

删除创建的 Deployment，修改资源清单中的 PVC 指向恢复的 PVC `pv-longhorn-restore-pvc`，然后重新发布。

此时Pod 已经绑定到恢复的 PVC 上面：

查看数据库中的数据：

数据已经恢复完成！

## ReadWriteMany

Longhorn 可以通过 `NFSv4` 服务器暴露 Longhorn 卷，原生支持 RWX 工作负载。

其工作原理为：在 longhorn-system 命名空间下面创建一个 `share-manager-` 的 Pod，该 Pod 负责通过在 Pod 内运行的 NFSv4 服务器暴露 Longhorn 卷。

特别注意：

> 使用 RWX 卷，每个客户端节点都需要安装 NFSv4 客户端。

直接yum 安装即可：

```java
yum -y install nfs-utils
```

创建一个访问模式为 ReadWriteMany 的 PVC：

```java
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc-longhorn-rwx
spec:
  storageClassName: longhorn
  resources:
    requests:
      storage: 1Gi
  accessModes:
    - ReadWriteMany
```

如图所示：

创建一个写的 Deployment：

```java
apiVersion: apps/v1
kind: Deployment
metadata:
  name: deploy-writer
spec:
  selector:
    matchLabels:
      app: writer
  template:
    metadata:
      labels:
        app: writer
    spec:
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: pvc-longhorn-rwx
      containers:
      - name: writer
        image: busybox
        command: ["/bin/sh", "-c"]
        args:
          - "while true;do echo $(date) >> /opt/index.html;sleep 5;done"
        volumeMounts:
          - name: data
            mountPath: /opt
```

此时查看 Volume：

同时，系统会创建一个 `share-manager-xxx` 的 Pod，通过该 Pod 内运行的 NFSv4 服务器来暴露 Longhorn 卷。

创建一个 Deployment 来展示上面的数据：

```java
apiVersion: apps/v1
kind: Deployment
metadata:
  name: deploy-reader
spec:
  replicas: 2
  selector:
    matchLabels:
      app: reader
  template:
    metadata:
      labels:
        app: reader
    spec:
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: pvc-longhorn-rwx
      containers:
      - name: reader
        image: nginx:latest
        ports:
          - containerPort: 80
        volumeMounts:
          - name: data
            mountPath: /usr/share/nginx/html
---
apiVersion: v1
kind: Service
metadata:
  name: svc-reader
spec:
  selector:
    app: reader
  ports:
  - port: 80
    targetPort: 80
```

如图所示：

通过reader Pods 引用 writer Pod 相同的 PVC，验证了 PV 和 PVC 是 `ReadWriteMany` 访问模式。

## CSI 卷管理（卷快照）

除了使用 Longhorn UI 可以对卷进行快照、备份恢复等功能，还可以通过 Kubernetes 来实现对卷的管理。

Kubernetes 从 1.12 版本开始引入了存储卷快照功能，在 1.17 版本进入 Beta 版本，和 PV、PVC 两个资源对象类似，Kubernetes 提供了三个资源对象用于卷快照管理：

- VolumeSnapshotContent：基于某个 PV 创建的快照，类似 PV。
- VolumeSnapshot：用户对卷快照的请求，类似 PVC。
- VolumeSnapshotClass：用来设置快照的特性，屏蔽 VolumeSnapshotContent 的细节，为 VolumeSnapshot 绑定提供动态管理，类似 StorageClass。

卷快照能力为 Kubernetes 用户提供了一种标准的方式在指定时间点进行卷的复制，并且不需要创建全新的卷，比如数据库执行备份。

但在使用该功能时，需要注意：

- VolumeSnapshot、VolumeSnapshotContent 和 VolumeSnapshotClass 资源对象是 CRDs， 不属于核心 API。
- VolumeSnapshot 支持仅可用于 CSI 驱动。
- 作为 VolumeSnapshot 部署过程的一部分，Kubernetes 团队提供了一个部署于控制平面的快照控制器，并且提供了一个叫做 csi-snapshotter 的 Sidecar 容器，该容器会去监听 VolumeSnapshot 和 VolumeSnapshotContent 对象，并且触发针对 CSI 端点的 CreateSnapshot 和 DeleteSnapshot 的操作，完成快照的创建或删除。
- CSI 驱动可能实现，也可能没有实现卷快照功能，CSI 驱动可能会使用 csi-snapshotter 来提供对卷快照的支持。

VolumeSnapshotContents 和 VolumeSnapshots 的生命周期包括：资源供应、资源绑定、对使用 PVC 的保护机制和资源删除等各个阶段。

- 资源供应
- 与 PV 类似，VolumeSnapshotContent 也可以以静态或动态两种方式供应资源：

静态供应：集群管理员预先创建，类似于手动创建 PV。
- 动态供应：基于 VolumeSnapshotClass 资源，当用户创建 VolumeSnapshot 申请时自动创建 VolumeSnapshotContent，类似于 StorageClass 动态创建 PV。

资源绑定

快照控制器负责将 VolumeSnapshot 与一个合适的 VolumeSnapshotContent 进行一对一绑定，包括静态和动态供应两种情况。

对使用中的PVC的保护机制

当 VolumeSnapshot 正被创建且还未完成时，相关的 PVC 将会被标记为正被使用中，如果用户对 PVC 进行删除操作，系统不会立即删除 PVC，以避免快照还未做完造成数据丢失。

资源删除：

对 VolumeSnapshot 发起删除操作时，对与其绑定的后端 VolumeSnapshotContent 的删除操作将基于删除策略 `DeletionPolicy` 决定：

- `Delete`：自动删除 VolumeSnapshotContent 资源对象和快照的内容。
- `Retain`：VolumeSnapshotContent 资源对象和快照的内容都将保留，需要手动清理。

在部署的 Longhorn 中可以看到这个 Pod：

这3个副本同一时间只有一个 Pod 提供服务，通过 `leader-election` 来实现的选主高可用。

如果查看 Pod 的日志可以发现一直在报错，提示找不到 VolumeSnapshotClass 和 VolumeSnapshotContent 对象，这是因为这两个资源都是 CRDs，并不是 Kubernetes 内置的资源对象，在安装 Longhorn 的时候也没有安装这两个 CRDs，所以找不到。

想要通过 CSI 来实现卷快照功能，就需要先安装 CRDs，可以从 `external-snapshotter` 项目中获取：

> https://github.com/kubernetes-csi/external-snapshotter

创建相关 CRDs：

```java
git clone https://github.com/kubernetes-csi/external-snapshotter.git
external-snapshotter/
kubectl kustomize client/config/crd | kubectl create -f -
```

如图所示：

CRDs 安装完成后还不够，还需要一个快照控制器来监听 VolumeSnapshot 和 VolumeSnapshotContent 对象，同样是 `external-snapshotter` 项目中也提供了一个 `Common Snapshot Controller`，但是里面的迹象地址有些问题，需要修改一下。执行下面的命令一键安装：

```java
sed -i "s#registry.k8s.io/sig-storage#dyrnq#g" deploy/kubernetes/snapshot-controller/setup-snapshot-controller.yaml
kubectl -n kube-system kustomize deploy/kubernetes/snapshot-controller | kubectl create -f -
```

如图所示：

到此，CSI 配置快照的基础环境搭建好了。

## CSI 卷管理（测试）

以之前创建的 pvc-longhorn 做测试：

```java
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshot
metadata:
  name: pvc-longhorn-snapshot
spec:
  volumeSnapshotClassName: longhorn
  source:
    persistentVolumeClaimName: pvc-longhorn
    volumeSnapshotContentName: test-content
```

主要配置参数：

- volumeSnapshotClassName：指定 VolumeSnapshotClass 的名称，这样就可以动态创建一个对应的 VolumeSnapshotContent 与之绑定，如果没有指定该参数，则属于静态方式，需要手动创建 VolumeSnapshotContent。
- persistentVolumeClaimName：指定数据来源的 PVC 名称。
- volumeSnapshotContentName：如果是申请静态存储快照，则需要通过该参数来指定一个 VolumeSnapshotContent。

```java
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshotClass
metadata:
  name: longhorn
  如果要指定成默认的快照类
  annotations:
    snapshot.storage.kubernetes.io/is-default-class: "true"
driver: driver.longhorn.io
deletionPolicy: Delete
```

`VolumeSnapshotClass` 包含 driver、deletionPolicy 和 parameters 字段，在需要动态配置属于该类的 `VolumeSnapshot` 时使用。

- driver：表示 CSI 存储插件驱动的名称，这里使用的是 Longhorn 插件，名为 driver.longhorn.io
- deletionPolicy：删除策略
- Delete：底层的存储快照会和 `VolumeSnapshotContent` 对象一起删除。
- Retain：底层快照和 `VolumeSnapshotContent` 对象都会被保留，需要手动清理。
- parameters：存储插件需要配置的参数，有 CSI 驱动提供具体的配置参数。

如果想将当前快照类设置成默认，则需要添加 `snapshot.storage.kubernetes.io/is-default-class: "true"` 这样的 annotations。

查看创建结果：

在Longhorn 中查看：

可以发现既做了快照，也做了备份。

## 基于快照创建新 PVC（恢复）

创建PVC 资源清单：

```java
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc-longhorn-restore
spec:
  storageClassName: longhorn
  resources:
    requests:
      storage: 1Gi
  accessModes:
    - ReadWriteOnce
  dataSource:
    apiGroup: snapshot.storage.k8s.io
    kind: VolumeSnapshot
    name: pvc-longhorn-snapshot
```

和之前的 PVC 创建方式类似，不同在于通过 dataSource 指定了来源的快照。

使用新版本的 external-snapshotter 有点问题，恢复报错，换成 5.0.1 版本正常。

此时只就可以和之前的操作方式一样，创建 PV/PVC，然后将 Deployment 绑定到新的上面即可！

## 卷克隆

除了基于快照创建新的 PVC 对象之外，CSI 类型的存储还支持存储的克隆功能，可以基于已经存在的 PVC 克隆一个新的 PVC，实现方式也是通过在 `dataSource` 字段中来设置源 PVC 来实现。

克隆一个 PVC 其实就是对已存在的存储卷创建一个副本，唯一的区别是，系统在为克隆 PVC 提供后端存储资源时，不是新建一个空的 PV，而是复制一个与原 PVC 绑定 PV 完全一样的 PV。

从Kubernetes API 的角度看，克隆的实现只是在创建新的 PVC 时， 增加了指定一个现有 PVC 作为数据源的能力，源 PVC 必须是 bound 状态且可用的。

用户在使用该功能时，需要注意以下事项：

- 克隆仅适用于 CSI 驱动
- 克隆仅适用于动态供应
- 克隆功能取决于具体的 CSI 驱动是否实现该功能
- 要求目标 PVC 和源 PVC 必须处于同一个命名空间
- 只支持在相同的 StorageClass 中（可以使用默认的）
- 两个存储卷的存储模式（VolumeMode）要一致

克隆资源清单：

```java
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc-longhorn-clone
spec:
  accessModes:
  - ReadWriteOnce
  storageClassName: longhorn
  resources:
    requests:
      必须大于或等于源的值
      storage: 2Gi
  dataSource:
    kind: PersistentVolumeClaim
    name: pvc-longhorn
```

创建之后查看：

此时创建一个资源对象绑定在上面就能直接使用了！

## 卸载 longhorn

如果想要卸载 longhorn，需要先修改配置：

```java
kubectl patch -p '{"value": "true"}' --type=merge lhs deleting-confirmation-flag -n longhorn-system
```

接下来就可以通过 helm 删除了，否则无法执行删除：

```java
helm uninstall longhorn
```

## 其它问题

备份空目录无法删除问题：

> https://github.com/longhorn/longhorn/issues/5643
