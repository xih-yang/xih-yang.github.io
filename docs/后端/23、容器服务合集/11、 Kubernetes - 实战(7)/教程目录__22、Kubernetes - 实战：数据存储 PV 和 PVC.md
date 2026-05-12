# 22、Kubernetes - 实战：数据存储 PV 和 PVC
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/7/22.html
- 分类：容器服务
- 分组：教程目录
## 一、环境安装

参考

[MiniKube方式部署](/zhuanlan/container/kubernetes/7/3.html)

[KubeAdm方式部署](/zhuanlan/container/kubernetes/7/4.html)

[Kind方式部署](/zhuanlan/container/kubernetes/7/5.html)

## 二、PV 和 PVC介绍

#### PV（Persistent Volume）

持久化卷，是对底层的共享存储的一种抽象。一般情况下`PV`由`Kubernetes`管理员进行创建和配置，它与底层具体的共享存储技术有关，并通过插件完成与共享存储的对接。

#### PVC（Persistent Volume Claim）

持久化卷声明，是用户对于存储需求的一种声明。换句话说，`PVC`其实就是用户向`Kubernetes`系统发出的一种资源需求申请。

特点：

屏蔽底层存储实现的细节，方便用户使用。

使用了`PV`和`PVC`之后，工作可以得到进一步的细分：

- 存储：存储工程师维护
- PV：Kubernetes管理员维护
- PVC：Kubernetes用户维护

## 三、PV 和 PVC使用

### yml 配置

**PV**

```java
apiVersion: v1  
kind: PersistentVolume
metadata:
  name: pv1
spec:
  nfs: 存储类型，与底层真正存储对应
  capacity:  存储能力，目前只支持存储空间的设置
    storage: 2Gi
  accessModes:  访问模式
  storageClassName: 存储类别
  persistentVolumeReclaimPolicy: 回收策略
```

`PV`的关键配置参数说明：

- 存储类型：底层实际存储的类型，Kubernetes支持多种存储类型，每种存储类型的配置都有所差异
- 存储能力（capacity）：目前只支持存储空间的设置(storage=1Gi)，不过未来可能会加入IOPS、吞吐量等指标的配置
- 访问模式（accessModes）：用于描述用户应用对存储资源的访问权限，访问权限包括下面几种方式：
- `ReadWriteOnce`（`RWO`）：读写权限，但是只能被单个节点挂载
- `ReadOnlyMany`（`ROX`）：只读权限，可以被多个节点挂载
- `ReadWriteMany`（`RWX`）：读写权限，可以被多个节点挂载
- 需要注意的是，底层不同的存储类型可能支持的访问模式不同
- 回收策略（persistentVolumeReclaimPolicy）：当PV不再被使用了之后，对其的处理方式。目前支持三种策略：
- `Retain`（保留）：保留数据，需要管理员手工清理数据
- `Recycle`（回收）：清除`PV`中的数据，效果相当于执行`rm -rf /thevolume/*`
- `Delete`（删除）：与`PV`相连的后端存储完成`Volume`的删除操作，当然这常见于云服务商的存储服务
- 需要注意的是，底层不同的存储类型可能支持的回收策略不同
- 存储类别：PV可以通过storageClassName参数指定一个存储类别
- 具有特定类别的`PV`只能与请求了该类别的`PVC`进行绑定
- 未设定类别的`PV`则只能与不请求任何类别的`PVC`进行绑定
- 状态（status）：一个PV的生命周期中，可能会处于4中不同的阶段：
- `Available`（可用）：表示可用状态，还未被任何`PVC`绑定
- `Bound`（已绑定）：表示`PV`已经被`PVC`绑定
- `Released`（已释放）：表示`PVC`被删除，但是资源还未被集群重新声明
- `Failed`（失败）：表示该`PV`的自动回收失败

#### PVC

```java
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc
  namespace: dev
spec:
  accessModes: 访问模式
  selector: 采用标签对PV选择
  storageClassName: 存储类别
  resources: 请求空间
    requests:
      storage: 5Gi
```

`PVC`的关键配置参数说明：

- 访问模式（accessModes）：用于描述用户应用对存储资源的访问权限
- 选择条件（selector）：通过Label Selector的设置，可使PVC对于系统中己存在的PV进行筛选
- 存储类别（storageClassName）：PVC在定义时可以设定需要的后端存储的类别，只有设置了该class的PV才能被系统选出
- 资源请求（resources）：描述对存储资源的请求

### 1 NFS准备工作

1)创建`NFS`共享目录

```java
mkdir -pv /root/data/{pv1,pv2,pv3}
```

2)vim /etc/exports

```java
/root/data/pv1     172.30.1.0/24(rw,no_root_squash)
/root/data/pv2     172.30.1.0/24(rw,no_root_squash)
/root/data/pv3     172.30.1.0/24(rw,no_root_squash)
```

### 2 创建PV

vimpv.yml

```java
apiVersion: v1
kind: PersistentVolume
metadata:
  name:  pv1
spec:
  capacity: 
    storage: 1Gi
  accessModes:
  - ReadWriteMany
  persistentVolumeReclaimPolicy: Retain
  nfs:
    path: /root/data/pv1
    server: 172.30.1.100
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name:  pv2
spec:
  capacity: 
    storage: 2Gi
  accessModes:
  - ReadWriteMany
  persistentVolumeReclaimPolicy: Retain
  nfs:
    path: /root/data/pv2
    server: 172.30.1.100
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name:  pv3
spec:
  capacity: 
    storage: 3Gi
  accessModes:
  - ReadWriteMany
  persistentVolumeReclaimPolicy: Retain
  nfs:
    path: /root/data/pv3
    server: 172.30.1.100
```

**创建pv**

```java
kubectl create -f pv.yml
```

### 3 创建PVC

vimpvc.yml

```java
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc1
  namespace: dev
spec:
  accessModes: 
  - ReadWriteMany
  resources:
    requests:
      storage: 1Gi
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc2
  namespace: dev
spec:
  accessModes: 
  - ReadWriteMany
  resources:
    requests:
      storage: 1Gi
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc3
  namespace: dev
spec:
  accessModes: 
  - ReadWriteMany
  resources:
    requests:
      storage: 1Gi
```

创建`PVC`

```java
kubectl create -f pvc.yml 
```

### 4 创建Pod

#### Pod yml

vimpod-pvc.yml

```java
apiVersion: v1
kind: Pod
metadata:
  name: pod1
  namespace: dev
spec:
  containers:
  - name: busybox
    image: busybox:1.30
    command: ["/bin/sh","-c","while true;do echo pod1 >> /root/out.txt; sleep 10; done;"]
    volumeMounts:
    - name: volume
      mountPath: /root/
  volumes:
    - name: volume
      persistentVolumeClaim:
        claimName: pvc1
        readOnly: false
---
apiVersion: v1
kind: Pod
metadata:
  name: pod2
  namespace: dev
spec:
  containers:
  - name: busybox
    image: busybox:1.30
    command: ["/bin/sh","-c","while true;do echo pod2 >> /root/out.txt; sleep 10; done;"]
    volumeMounts:
    - name: volume
      mountPath: /root/
  volumes:
    - name: volume
      persistentVolumeClaim:
        claimName: pvc2
        readOnly: false 
```

```java
kubectl create -f  pod-pvc.yml
```

### 5 查看PV

`PV`是全局资源，所以不用指定`namespace`

```java
kubectl get pv -o wide
```

### 6 查看PVC

```java
kubectl get pvc -n dev -o wide
```

### 7 查看 Pod

```java
kubectl get pods -n dev -o wide
```
