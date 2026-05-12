# 14、Kubernetes - 实战：PV - PVC - NFS
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/9/14.html
- 分类：容器服务
- 分组：教程目录
## 存储

前面有通过 `hostPath` 或者 `emptyDir` 的方式来持久化数据，但是显然还需要更加可靠的存储来保存应用的持久化数据，这样容器在重建后，依然可以使用之前的数据。可存储资源和 CPU 资源以及内存资源有很大不同，为了让用户更加方便的使用，Kubernetes 便引入了 `PV` 和 `PVC` 两个重要的资源对象来实现对存储的管理。

`PV` （PersistentVolume，持久化卷），是对底层共享存储的一种抽象，PV 由管理员进行创建和配置，它和具体的底层的共享存储技术的实现方式有关，比如 `Ceph`、`GlusterFS`、`NFS`、`hostPath` 等，都是通过插件机制完成与共享存储的对接。

`PVC` （PersistentVolumeClaim，持久化卷声明），PVC 是用户存储的一种声明，PVC 和 Pod 比较类似，Pod 消耗的是节点，PVC 消耗的是 PV 资源，Pod 可以请求 CPU 和内存，而 PVC 可以请求特定的存储空间和访问模式。对于真正使用存储的用户不需要关心底层的存储实现细节，只需要直接使用 PVC 即可。

但是通过 PVC 请求到一定的存储空间也很有可能不足以满足应用对于存储设备的各种需求，而且不同的应用程序对于存储性能的要求可能也不尽相同，比如读写速度、并发性能等，为了解决这一问题，Kubernetes 又引入了一个新的资源对象：`StorageClass`。

通过`StorageClass` 的定义，管理员可以将存储资源定义为某种类型的资源，比如快速存储、慢速存储等，用户根据 StorageClass 的描述就可以非常直观的知道各种存储资源的具体特性了，这样就可以根据应用的特性去申请合适的存储资源了，此外 `StorageClass` 还可以自动生成 PV，免去了每次手动创建的麻烦。

## hostPath

Kubernetes 支持 hostPath 类型的 PV 使用节点上的文件或目录来模拟附带网络的存储，但是需要注意的是：在生产集群中，一般不会使用 hostPath，而是选择网络存储资源，比如 NFS 共享卷或 Ceph 存储卷。集群管理员还可以使用 `StorageClasses` 来设置动态提供存储。

因为Pod 并不是始终固定在某个节点上面的，所以要使用 hostPath 的话就需要将 Pod 固定在某个节点上，这样显然就大大降低了应用的容错性，但是对于 DaemonSet 类型的服务好像还可以。

测试hostPath，将应用发布到指定的节点 worker-01 上：

```java
# 先在 woker-01 上创建目录并配置 html 文件
mkdir -p /data/html
echo "PV hostPath Demo" > /data/html/index.html
```

创建PV 资源清单：

```java
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-hostpath
spec:
  capacity:
    storage: 1Gi
  accessModes:
    - ReadWriteOnce
  storageClassName: slow
  hostPath:
    path: "/data/html"
```

配置说明：

- hostPath：指定 PV 类型，配置为本机的 /data/html 目录作为可供挂载到 Pod 的目录。
- capacity.storage：指定存储能力，分配的磁盘空间为 1G。
- storageClassName：该名称用来将 PersistentVolumeClaim 请求绑定到该 PersistentVolum。下面是关于 PV 的这些配置属性的一些说明：
- accessModes（访问模式）：描述用户应用对存储资源的访问权限，包括下面几种方式：
- ReadWriteOnce（RWO）：读写权限，但是只能被单个节点挂载。
- ReadOnlyMany（ROX）：只读权限，可以被多个节点挂载。
- ReadWriteMany（RWX）：读写权限，可以被多个节点挂载。

一些PV 可能支持多种访问模式，但是在挂载的时候只能使用一种访问模式，多种访问模式是不会生效的。

查看创建的 PV：

其中有一项 `RECLAIM POLICY` 的配置，这个值可以通过 PV 的 `persistentVolumeReclaimPolicy`（回收策略）属性来进行配置，目前 PV 支持的策略有三种：

- Retain（保留）：保留数据，需要管理员手工清理数据。
- Recycle（回收）：清除 PV 中的数据，效果相当于执行 rm -rf /thevoluem/*
- Delete（删除）：与 PV 相连的后端存储完成 volume 的删除操作，当然这常见于云服务商的存储服务。

特别注意：

- 目前只有 NFS 和 HostPath 两种类型支持回收策略，当然一般来说还是设置为 Retain 这种策略保险一点。
- Recycle 策略会通过运行一个 busybox 容器来执行数据删除命令，但默认 busybox 镜像是：gcr.io/google_containers/busybox:latest，一般情况下是拉取不到的，如果需要调整配置，需要增加 kube-controller-manager 启动参数：--pv-recycler-pod-template-filepath-hostpath 来进行配置。

关于PV 的状态，实际上描述的是 PV 的生命周期的某个阶段，一个 PV 的生命周期中，可能会处于 4 种不同的阶段：

- Available（可用）：表示可用状态，还未被任何 PVC 绑定。
- Bound（已绑定）：表示 PV 已经被 PVC 绑定。
- Released（已释放）：PVC 被删除，但是资源还未被集群重新声明。
- Failed（失败）： 表示该 PV 的自动回收失败。

创建PVC 资源清单：

```java
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc-hostpath
spec:
  storageClassName: slow
  可以不指定，通过 storageClassName 也可以匹配到
  volumeName: pv-hostpath
  resources:
    requests:
      storage: 500Mi
  accessModes:
    - ReadWriteOnce
```

目前PV 和 PVC 之间是一对一绑定的关系，也就是说一个 PV 只能被一个 PVC 绑定。此时的 PV 状态就会变成 `Bound` 状态。

创建Pod 资源清单：

```java
apiVersion: v1
kind: Pod
metadata:
  name: pod-pv-hostpath-demo
spec:
  只需要指定 pvc 即可
  volumes:
    自定义的名称，方便后面挂载的时候区分
    - name: pvc-demo
      persistentVolumeClaim:
        claimName: pvc-hostpath
  需要发布到指定节点
  nodeSelector:
    kubernetes.io/hostname: worker-01
  containers:
  - name: nginx
    image: nginx:latest
    ports:
      - containerPort: 80
    挂载 volume
    volumeMounts:
      - name: pvc-demo
        mountPath: /usr/share/nginx/html
```

通过Pod IP 在服务器上面访问可以看到之前生成的 index.html 文件内容。

在使用Pod 的时候是直接可以使用 hostPath 来持久化数据，那么为什么还要费劲去创建 PV、PVC 对象来引用呢？

PVC和 PV 的设计，其实跟面向对象的思想完全一致，PVC 可以理解为持久化存储的接口，它提供了对某种持久化存储的描述，但不提供具体的实现。而这个持久化存储的实现部分则由 PV 负责完成。

这样做的好处是，Pod 的配置只需要跟 PVC 这个接口打交道，而不必关心具体的实现是 hostPath、NFS 还是 Ceph。完全屏蔽了存储细节，实现了解耦。

## Local PV

在使用hostPath 有一个局限：Pod 不能随便漂移，需要固定到一个节点上，一旦漂移到其他节点上就没有对应的数据了，所以需要搭配 nodeSelector 来使用。

但hostPath 也有好处，因为 PV 直接使用本地磁盘，它的读写性能相比于大多数远程存储来说，要好得多。这对于一些对磁盘 IO 要求比较高的应用，比如 etcd 就非常实用。

不过，相比于正常的 PV，使用 hostPath 的节点一旦宕机数据就可能丢失，这要求着使用 hostPath 的应用必须具备数据备份和恢复的能力。

所以在hostPath 的基础上，Kubernetes 依靠 PV、PVC 实现了一个新的特性：`Local Persistent Volume`，也就是 `Local PV`。

其实Local PV 实现的功能非常类似于 hostPath 加上 `nodeAffinity`。比如，Pod 可以声明使用类型为 Local 的 PV，而这个 PV 其实就是一个 hostPath 类型的 Volume。如果这个 hostPath 对应的目录已经在节点 A 上被事先创建好，那么只需要再给这个 Pod 加上一个 `nodeAffinity=nodeA`，就可以使用这个 Volume 了。理论是这样，但是事实上，将宿主机上的目录当作 PV 来使用，风险太高了。一般来说 Local PV 对应的存储介质是一块额外挂载在宿主机的磁盘或者块设备。

另外，Local PV 和普通 PV 很大的不同在于 Local PV 可以保证 Pod 始终能够被正确地调度到它所请求的 Local PV 所在的节点上面。对于普通 PV 来说，Kubernetes 都是先调度 Pod 到某个节点上，然后再持久化节点上的 Volume 目录，进而完成 Volume 目录与容器的绑定挂载。但是对于 Local PV 来说，节点上可供使用的磁盘必须是提前准备好的，因为它们在不同节点上的挂载情况可能完全不同，甚至有的节点可以没这种磁盘，所以，调度器就必须能够知道所有节点与 Local PV 对应的磁盘的关联关系，然后根据这个信息来调度 Pod，也就是在调度的时候考虑 Volume 的分布。

测试将worker-01 上面的 /data/local 目录当成挂载的单独的磁盘。然后创建资源清单：

```java
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-localpv
spec:
  capacity:
    storage: 1Gi
  volumeMode: Filesystem
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Delete
  storageClassName: local-storage
  local:
    path: /data/local
  nodeAffinity:
    required:
      nodeSelectorTerms:
        - matchExpressions:
            - key: kubernetes.io/hostname
              operator: In
              values:
                - "worker-01"
```

和之前的 PV 不同，这里定义了一个 `local` 字段，表明它是一个 Local PV，而 path 字段，指定的正是这个 PV 对应的本地磁盘的路径。这也意味着如果 Pod 要想使用这个 PV，那它就必须运行在 worker-01 节点上。所以，在这个 PV 的定义里，添加了一个节点亲和性 `nodeAffinity` 字段指定 worker-01 这个节点。这样，调度器在调度 Pod 的时候，就能够知道一个 PV 与节点的对应关系，从而做出正确的选择。

此时，如果按照正常的用法，就需要去创建 PVC 资源清单，让 PVC 和 PV 做绑定。但是在 local pv 中不这样使用。需要创建 `StorageClass` 做延时绑定：

```java
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: local-storage
provisioner: kubernetes.io/no-provisioner
volumeBindingMode: WaitForFirstConsumer
```

此时再创建 PVC 资源清单：

```java
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc-localpv
spec:
  resources:
    requests:
      storage: 1G
  accessModes:
    - ReadWriteOnce
  storageClassName: local-storage
```

此时PVC 会处于 `Pending` 状态，因为有延时。

创建Pod 资源清单：

```java
apiVersion: v1
kind: Pod
metadata:
  name: pod-localpv-demo
spec:
  volumes:
    - name: pvc-demo
      persistentVolumeClaim:
        claimName: pvc-localpv
  containers:
  - name: nginx
    image: nginx:latest
    ports:
      - containerPort: 80
    volumeMounts:
      - name: pvc-demo
        mountPath: /usr/share/nginx/html
```

Pod启动完成之后 PVC 的状态变成了 `Bound`。而且 Pod 会被调度到 worker-01 节点。

对于StatefulSet 这样的有状态的资源对象，完全可以通过声明 Local 类型的 PV 和 PVC，来管理应用的存储状态。

## NFS 安装

hostPath 与 Local PV 两种本地存储方式对于日常使用比较多的无状态服务是不合适的。相同的服务可能会同时发布在不同的节点上，这个时候可能就需要使用到共享存储。目前业内最简单常用的网络共享存储就是 NFS。

为了方便测试，在 `ops` 机器上部署 NFS 服务，给集群的节点提供挂载功能。

```java
# 安装
yum -y install nfs-utils rpcbind
# 创建共享的目录
mkdir -p /data/nfs
# 配置 NFS 目录
cat > /etc/exports << EOF
/data/nfs *(rw,sync,no_root_squash)
EOF
```

NFS配置文件说明：

- /data/nfs：共享的数据目录。
- *：表示任何人都有权限连接，也可以是一个网段，一个 IP，也可以是域名。
- rw：读写的权限。
- sync：表示文件同时写入硬盘和内存。
- no_root_squash：当登录 NFS 使用者是 root 时，其权限将被转换为匿名用户 nobody。

NFS服务需要向 rpc 注册，rpc 一旦重启了，注册的文件都会丢失，向它注册的服务都需要重启。所以需要先启动 rpcbind。

```java
# 启动服务
systemctl  start rpcbind
systemctl  start nfs
# 开机启动
systemctl enable rpcbind
systemctl enable nfs
# 查看状态
rpcinfo -p | grep nfs
```

如图所示：

所有Kubernetes 节点安装 NFS：

```java
# 安装
yum -y install nfs-utils rpcbind
# 查看提供的 NFS 挂载点
showmount -e 192.168.2.40
```

在任意节点测试挂载：

```java
# 本地创建用于挂载的文件夹
mkdir -p /data/nfs
# 挂载 NFS 共享目录到本地目录
mount -t nfs 192.168.2.40:/data/nfs /data/nfs
```

如果挂载没有问题就说明 NFS 配置没有问题，此时就可以卸载了。

```java
umount -f /data/nfs
```

如果卸载出现：`device is busy`，可以通过下面命令处理：

```java
# 查看进程占用
fuser -m -v /data/nfs
```

找到占用的进程 Pid 然后 kill 掉再 umount。

## NFS 使用

和前面使用 PV 和 PVC 类似，还是需要创建相应的资源清单。

创建PV 和 PVC 的资源清单：

```java
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-nfs
spec:
  capacity:
    storage: 1Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: manual
  nfs:
    path: /data/nfs
    server: 192.168.2.40
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc-nfs
spec:
  resources:
    requests:
      storage: 1Gi
  accessModes:
    - ReadWriteOnce
  storageClassName: manual
  volumeName: pv-nfs
```

创建Deployment：

```java
apiVersion: apps/v1
kind: Deployment
metadata:
  name: deploy-pv-nfs
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx-nfs
  template:
    metadata:
      labels:
        app: nginx-nfs
    spec:
      volumes:
        - name: nfs-demo
          persistentVolumeClaim:
            claimName: pvc-nfs
      containers:
      - name: c-nginx-nfs
        image: nginx:latest
        ports:
        - containerPort: 80
        volumeMounts:
          - name: nfs-demo
            subPath: html
            mountPath: /usr/share/nginx/html
```

此时在NFS 的 /data/nfs 目录下会新建 subPath 定义的 html 目录。可以在该目录下面创建测试 index.html。

```java
echo "NFS Demo" > index.html
```

访问如图：

此时就实现了数据的共享存储持久化。而且是 Kubernetes 自己实现的挂载。

上面的示例中需要手动去创建 PV 来和 PVC 进行绑定，有的场景下面需要自动创建 PV，这个时候就需要使用到 StorageClass，并且需要一个对应的 provisioner 来自动创建 PV。

比如使用 NFS 存储，则可以使用 nfs-subdir-external-provisioner 这个 Provisioner。它使用现有的和已配置的NFS 服务器来支持通过 PVC 动态配置 PV，持久卷配置为 `${namespace}-${pvcName}-${pvName}`，但是按照需要用到 Helm Chart，所以后面再说。
