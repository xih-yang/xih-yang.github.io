# 12、Kubernetes - 实战：网络共享存储 PersistentVolume + NFS、部署 NFS Provisoner、使用 NFS 动态存储卷
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/10/12.html
- 分类：容器服务
- 分组：教程目录
要想让存储卷真正能被 `Pod` 任意挂载，我们需要变更存储的方式，不能限定在本地磁盘，而是要改成网络存储，这样 `Pod` 无论在哪里运行，只要知道 `IP` 地址或者域名，就可以通过网络通信访问存储设备。

## 1. 安装 NFS 服务器和客户端

`NFS` 采用的是 `Client/Server` 架构，需要选定一台主机作为 `Server`，安装 `NFS` 服务端；其他要使用存储的主机作为 `Client`，安装 `NFS` 客户端工具。

我们在自己的 `Kubernetes` 集群里再增添一台名字叫 `Storage` 的服务器，在上面安装 `NFS`，实现网络存储、共享网盘的功能。不过这台 `Storage` 也只是一个逻辑概念，我们在实际安装部署的时候完全可以把它合并到集群里的某台主机里，比如这里的 `Console`。

具体安装请参考：

[https://blog.csdn.net/wohu1104/article/details/121051526](https://blog.csdn.net/wohu1104/article/details/121051526)

## 2. 使用 NFS 存储卷

为`Kubernetes` 配置好了 `NFS` 存储系统，就可以使用它来创建新的 `PV` 存储对象了。

先来手工分配一个存储卷，需要指定 `storageClassName` 是 `nfs`，而 `accessModes` 可以设置成 `ReadWriteMany`，这是由 `NFS` 的特性决定的，它支持多个节点同时访问一个共享目录。

因为这个存储卷是 `NFS` 系统，所以我们还需要在 `YAML` 里添加 `nfs`字段，指定 `NFS` 服务器的 `IP` 地址和共享目录名。

这里在`NFS` 服务器的 `/tmp/nfs` 目录里又创建了一个新的目录 `1g-pv`，表示分配了 1GB 的可用存储空间，相应的，`PV` 里的 `capacity` 也要设置成同样的数值，也就是 1Gi。

把这些字段都整理好后，我们就得到了一个使用 `NFS` 网络存储的 `YAML` 描述文件：

```java
# nfs-static-pv.yml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: nfs-1g-pv
spec:
  storageClassName: nfs
  accessModes:
    - ReadWriteMany
  capacity:
    storage: 1Gi
  nfs:
    path: /home/dev/multipass/k8s/data/1g-pv
    server: 192.168.10.208
```

现在就可以用命令 `kubectl apply` 来创建 `PV`对象，再用 `kubectl get pv` 查看它的状态：

```java
kubectl apply -f nfs-static-pv.yml
kubectl get pv
```

`spec.nfs` 里的 IP 地址一定要正确，路径一定要存在（事先创建好），否则 `Kubernetes` 按照 `PV` 的描述会无法挂载 `NFS` 共享目录，`PV` 就会处于“pending”状态无法使用。

有了`PV`，我们就可以定义申请存储的 `PVC` 对象了，它的内容和 `PV` 差不多，但不涉及 `NFS` 存储的细节，只需要用 `resources.request` 来表示希望要有多大的容量，这里我写成 1GB，和 `PV` 的容量相同：

```java
# nfs-static-pvc.yml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: nfs-static-pvc
spec:
  storageClassName: nfs
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 1Gi
```

创建`PVC` 对象之后，`Kubernetes` 就会根据 `PVC` 的描述，找到最合适的 `PV`，把它们“绑定”在一起，也就是存储分配成功：

我们再创建一个 `Pod`，把 `PVC` 挂载成它的一个 `volume`，具体的做法和上节是一样的，用 `persistentVolumeClaim` 指定 `PVC` 的名字就可以了：

```java
# nfs-static-pod.yml
apiVersion: v1
kind: Pod
metadata:
  name: nfs-static-pod
spec:
  volumes:
  - name: nfs-pvc-vol
    persistentVolumeClaim:
      claimName: nfs-static-pvc
  containers:
    - name: nfs-pvc-test
      image: nginx:alpine
      ports:
      - containerPort: 80
      volumeMounts:
        - name: nfs-pvc-vol
          mountPath: /tmp
```

`Pod`、`PVC`、`PV` 和 `NFS` 存储的关系可以用下图来形象地表示，可以对比一下 `HostPath PV` 的用法，看看有什么不同：

因为我们在 `PV/PVC` 里指定了 `storageClassName` 是 `nfs`，节点上也安装了 `NFS` 客户端，所以 `Kubernetes`就会自动执行 `NFS` 挂载动作，把 `NFS` 的共享目录 `/home/dev/multipass/k8s/data/1g-pv` 挂载到 `Pod` 里的 `/tmp`，完全不需要我们去手动管理。

最后还是测试一下，用 `kubectl apply` 创建 `Pod` 之后，我们用 `kubectl exec` 进入 `Pod`，再试着操作 `NFS` 共享目录：

退出`Pod`，再看一下 `NFS` 服务器的 `/home/dev/multipass/k8s/data/1g-pv` 目录，你就会发现 `Pod` 里创建的文件确实写入了共享目录：

而且更好的是，因为 `NFS` 是一个网络服务，不会受 `Pod` 调度位置的影响，所以只要网络通畅，这个 `PV` 对象就会一直可用，数据也就实现了真正的持久化存储。

## 3. 部署 NFS Provisoner

因为`PV` 还是需要人工管理，必须要由系统管理员手动维护各种存储设备，再根据开发需求逐个创建 `PV`，而且 `PV` 的大小也很难精确控制，容易出现空间不足或者空间浪费的情况。

那么能不能让创建 `PV` 的工作也实现自动化呢？或者说，让计算机来代替人类来分配存储卷呢？

这个在`Kubernetes` 里就是“动态存储卷”的概念，它可以用 `StorageClass` 绑定一个 `Provisioner` 对象，而这个 `Provisioner` 就是一个能够自动管理存储、创建 `PV` 的应用，代替了原来系统管理员的手工劳动。

有了“动态存储卷”的概念，前面我们讲的手工创建的 `PV` 就可以称为“静态存储卷”。

目前，`Kubernetes` 里每类存储设备都有相应的 `Provisioner` 对象，对于 `NFS` 来说，它的 `Provisioner` 就是“NFS subdir external provisioner”，你可以在 GitHub 上找到这个项目

[https://github.com/kubernetes-sigs/nfs-subdir-external-provisioner](https://github.com/kubernetes-sigs/nfs-subdir-external-provisioner)

`NFS Provisioner` 也是以 `Pod` 的形式运行在 `Kubernetes` 里的，在 GitHub 的 `deploy` 目录里是部署它所需的 `YAML` 文件，一共有三个，分别是 `rbac.yaml`、`class.yaml` 和 `deployment.yaml`。

不过这三个文件只是示例，想在我们的集群里真正运行起来还要修改其中的两个文件。

第一个要修改的是 `rbac.yaml`，它使用的是默认的 `default` 名字空间，应该把它改成其他的名字空间，避免与普通应用混在一起，你可以用“查找替换”的方式把它统一改成 `kube-system`。

第二个要修改的是 `deployment.yaml`，它要修改的地方比较多。首先要把名字空间改成和 `rbac.yaml` 一样，比如是 `kube-system`，然后重点要修改 `volumes` 和 `env` 里的 `IP` 地址和共享目录名，必须和集群里的 `NFS` 服务器配置一样。

按照我们当前的环境设置，就应该把 `IP` 地址改成 192.168.10.208，目录名改成 `/tmp/nfs`：

```java
spec:
  template:
    spec:
      serviceAccountName: nfs-client-provisioner
      containers:
      ...
          env:
            - name: PROVISIONER_NAME
              value: k8s-sigs.io/nfs-subdir-external-provisioner
            - name: NFS_SERVER
              value: 192.168.10.208       改IP地址
            - name: NFS_PATH
              value: /tmp/nfs             改共享目录名
      volumes:
        - name: nfs-client-root
          nfs:
            server: 192.168.10.208        改IP地址
            Path: /tmp/nfs                改共享目录名
```

还有一件麻烦事，`deployment.yaml` 的镜像仓库用的是 `gcr.io`，拉取很困难，而国内的镜像网站上偏偏还没有它，为了让实验能够顺利进行，我不得不“曲线救国”，把它的镜像转存到了 Docker Hub 上。

所以你还需要把镜像的名字由原来的“k8s.gcr.io/sig-storage/nfs-subdir-external-provisioner:v4.0.2”改成“chronolaw/nfs-subdir-external-provisioner:v4.0.2”，其实也就是变动一下镜像的用户名而已。

把这两个 `YAML` 修改好之后，具体内容如下：

```java
# rbac.yml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: nfs-client-provisioner
  replace with namespace where provisioner is deployed
  namespace: kube-system
---
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: nfs-client-provisioner-runner
rules:
  - apiGroups: [""]
    resources: ["nodes"]
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources: ["persistentvolumes"]
    verbs: ["get", "list", "watch", "create", "delete"]
  - apiGroups: [""]
    resources: ["persistentvolumeclaims"]
    verbs: ["get", "list", "watch", "update"]
  - apiGroups: ["storage.k8s.io"]
    resources: ["storageclasses"]
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources: ["events"]
    verbs: ["create", "update", "patch"]
---
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: run-nfs-client-provisioner
subjects:
  - kind: ServiceAccount
    name: nfs-client-provisioner
    replace with namespace where provisioner is deployed
    namespace: kube-system
roleRef:
  kind: ClusterRole
  name: nfs-client-provisioner-runner
  apiGroup: rbac.authorization.k8s.io
---
kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: leader-locking-nfs-client-provisioner
  replace with namespace where provisioner is deployed
  namespace: kube-system
rules:
  - apiGroups: [""]
    resources: ["endpoints"]
    verbs: ["get", "list", "watch", "create", "update", "patch"]
---
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: leader-locking-nfs-client-provisioner
  replace with namespace where provisioner is deployed
  namespace: kube-system
subjects:
  - kind: ServiceAccount
    name: nfs-client-provisioner
    replace with namespace where provisioner is deployed
    namespace: kube-system
roleRef:
  kind: Role
  name: leader-locking-nfs-client-provisioner
  apiGroup: rbac.authorization.k8s.io
```

```java
# deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nfs-client-provisioner
  labels:
    app: nfs-client-provisioner
  replace with namespace where provisioner is deployed
  namespace: kube-system
spec:
  replicas: 1
  strategy:
    type: Recreate
  selector:
    matchLabels:
      app: nfs-client-provisioner
  template:
    metadata:
      labels:
        app: nfs-client-provisioner
    spec:
      serviceAccountName: nfs-client-provisioner
      containers:
        - name: nfs-client-provisioner
#          image: k8s.gcr.io/sig-storage/nfs-subdir-external-provisioner:v4.0.2
          image: chronolaw/nfs-subdir-external-provisioner:v4.0.2
          volumeMounts:
            - name: nfs-client-root
              mountPath: /persistentvolumes
          env:
            - name: PROVISIONER_NAME
              value: k8s-sigs.io/nfs-subdir-external-provisioner
            - name: NFS_SERVER
              value: 172.16.19.54
            - name: NFS_PATH
              value: /home/dev/multipass/k8s/data
      volumes:
        - name: nfs-client-root
          nfs:
            server: 172.16.19.54
            path: /home/dev/multipass/k8s/data
```

```java
# class.yml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: nfs-client
provisioner: k8s-sigs.io/nfs-subdir-external-provisioner or choose another name, must match deployment's env PROVISIONER_NAME'
parameters:
  archiveOnDelete: "false"
```

我们就可以在 `Kubernetes` 里创建 `NFS Provisioner` 了：

```java
kubectl apply -f rbac.yml
kubectl apply -f class.yml
kubectl apply -f deployment.yml
```

使用命令 `kubectl get`，再加上名字空间限定 `-n kube-system`，就可以看到 `NFS Provisioner` 在 `Kubernetes` 里运行起来了。

## 4. 使用 NFS 动态存储卷

比起静态存储卷，动态存储卷的用法简单了很多。因为有了 `Provisioner`，我们就不再需要手工定义 `PV` 对象了，只需要在 `PVC` 里指定 `StorageClass` 对象，它再关联到 `Provisioner`。

我们来看一下 `NFS` 默认的 `StorageClass` 定义：

```java
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: nfs-client
provisioner: k8s-sigs.io/nfs-subdir-external-provisioner 
parameters:
  archiveOnDelete: "false"
```

`YAML` 里的关键字段是 `provisioner`，它指定了应该使用哪个 `Provisioner`。另一个字段 `parameters` 是调节 `Provisioner` 运行的参数，需要参考文档来确定具体值，在这里的 `archiveOnDelete: "false"` 就是自动回收存储空间。

理解了`StorageClass` 的 `YAML` 之后，你也可以不使用默认的 `StorageClass`，而是根据自己的需求，任意定制具有不同存储特性的 `StorageClass`，比如添加字段 `onDelete: "retain"` 暂时保留分配的存储，之后再手动删除：

```java
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: nfs-client-retained
provisioner: k8s-sigs.io/nfs-subdir-external-provisioner
parameters:
  onDelete: "retain"
```

接下来我们定义一个 `PVC`，向系统申请 10MB 的存储空间，使用的 `StorageClass` 是默认的 `nfs-client`：

```java
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: nfs-dyn-10m-pvc
spec:
  storageClassName: nfs-client
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 10Mi
```

写好了`PVC`，我们还是在 `Pod` 里用 `volumes` 和 `volumeMounts` 挂载，然后 `Kubernetes` 就会自动找到 `NFS Provisioner`，在 `NFS` 的共享目录上创建出合适的 `PV` 对象：

```java
apiVersion: v1
kind: Pod
metadata:
  name: nfs-dyn-pod
spec:
  volumes:
  - name: nfs-dyn-10m-vol
    persistentVolumeClaim:
      claimName: nfs-dyn-10m-pvc
  containers:
    - name: nfs-dyn-test
      image: nginx:alpine
      ports:
      - containerPort: 80
      volumeMounts:
        - name: nfs-dyn-10m-vol
          mountPath: /tmp
```

使用`kubectl apply` 创建好 `PVC` 和 `Pod`，让我们来查看一下集群里的 `PV` 状态：

从截图你可以看到，虽然我们没有直接定义 `PV` 对象，但由于有 `NFS Provisioner`，它就自动创建一个 `PV`，大小刚好是在 `PVC` 里申请的 10MB。如果你这个时候再去 `NFS` 服务器上查看共享目录，也会发现多出了一个目录，名字与这个自动创建的 `PV` 一样，但加上了名字空间和 `PVC` 的前缀：

我还是把 `Pod`、`PVC`、`StorageClass` 和 `Provisioner` 的关系画成了一张图，你可以清楚地看出来这些对象的关联关系，还有 `Pod` 是如何最终找到存储设备的：

## 5. 总结

本节我们引入了网络存储系统，以 `NFS` 为例研究了静态存储卷和动态存储卷的用法，其中的核心对象是 `StorageClass` 和 `Provisioner`。

**1、** 在`Kubernetes`集群里，网络存储系统更适合数据持久化，`NFS`是最容易使用的一种网络存储系统，要事先安装好服务端和客户端；

**2、** 可以编写`PV`手工定义`NFS`静态存储卷，要指定`NFS`服务器的`IP`地址和共享目录名；

**3、** 使用`NFS`动态存储卷必须要部署相应的`Provisioner`，在`YAML`里正确配置`NFS`服务器；

**4、** 动态存储卷不需要手工定义`PV`，而是要定义`StorageClass`，由关联的`Provisioner`自动创建`PV`完成绑定；

**5、**`StorageClass`里面的`OnDelete`、`archiveOnDelete`源自`PV`的存储回收策略，指定`PV`被销毁时数据是保留`Retain`还是删除`Delete`；

动态存储卷相比静态存储卷有什么好处？有没有缺点？

- 首先，静态存储卷 PV 这个动作是要由运维手动处理的，如果是处在大规模集群的成千上万个 PVC 的场景下，这个工作量是难以想象的；
- 再者，业务的迭代变更是动态的，这也就意味着随时会有新的 PVC 被创建，或者就的 PVC 被删除，这也就要求运维每碰到 PVC 的变更，就要跟着去手动维护一个新的 PV 。来满足业务的新需求。
- 最后，动态存储卷的好处还在于分层和解耦，对于简单的 localPath 或者 NFS 这种存储卷或许相对来说还比较简单一些，但是像类似于远程存储磁盘这种就相对来说比较复杂了，动态存储可以让我们只关注于需求点，至于怎么把这些东西创建出来，就交由各个类型的 provisioner 去处理就行了。

缺点：缺点的话就是在于资源的管控方面，比如原本我可能只需要2Gi的空间，但是业务人员对容量把握不够申请了10Gi，就会有8Gi空间的浪费。

`StorageClass` 在动态存储卷的分配过程中起到了什么作用？

`StorageClass` 作用是帮助指定特定类型的 `provisioner`，这决定了你要使用的具体某种类型的存储插件；另外它还限定了 `PV` 和 `PVC` 的绑定关系，只有从属于同一 `StorageClass` 的 `PV` 和 `PVC` 才能做绑定动作，比如指定 `GlusterFS` 类型的 `PVC` 对象不能绑定到另外一个 `PVC` 定义的 `NFS` 类型的 `StorageClass` 模版创建出的 `Volume` 的 `PV` 对象上面去。

`StorageClass` 应证了“所有问题都可以通过增加一层来解决”。作用是解决了特定底层存储与 `K8S` 上资源的解耦问题，通过 `SC` 统一接口，具体厂商负责具体的存储实现。

因为存储它涉及到了对物理机文件系统绑定的操作，因此 `K8S` 做了一系列抽象。`PV` 在这个抽象里，其实就指代了主机文件系统的路径，当然至于再往实现层面走，是网络文件系统还是主机文件系统，这就全由 `PV` 的绑定类型决定。而往抽象层走，作为 `K8S` 的核心系统，`K8S` 想尽可能屏蔽掉底层，也就是主机文件系统的概念，所以它抽象了 `StorageClass` ，用来统一指代/管理 `PV` 。至此，`K8S` 持久化存储就可以分两个部分：

- 第一部分是由 主机文件系统+PV+StorageClass组成的，用来将抽象对象绑定到真实文件系统的生产者部分；
- 第二部分就是 Volume+PVC+StorageClass，完全被抽象为K8S核心业务的消费者部分，而StorageClass，可以看作是两部分连接的桥梁。
