# 24、Kubernetes 实战 - 数据存储-高级存储PV和PVC
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/3/24.html
- 分类：容器服务
- 分组：教程目录
## 第一节 PV和PVC的概念

使用NFS提供存储，此时就要求用户会搭建NFS系统，并且会在yaml配置nfs。由于kubernetes支持的存储系统有很多，要求客户全都掌握，显然不现实。为了能够屏蔽底层存储实现的细节，方便用户使用，kubernetes引入了PV和PVC两种资源对象。

PV(Persistent Volume) 是持久化卷的意思，是对底层的共享存储的一种抽象。一般情况下PV由kubernetes管理员进行创建和配置，它与具体的共享存储技术有关，并通过插件完成与共享存储的对接。

PVC(Oersistent Volume Claim) 是持久卷声明的意思，是用户对于存储需求的一种声明。换句话说，PVC其实就是用户向kubernetes系统发出的一种资源需求申请。

使用了PV和PVC之后，工作可以进一步细分：

- 存储: 存储工程师维护
- PV: kubernetes管理员维护
- PVC：kubernetes用户维护

## 第二节 PV

PV存储资源的抽象，下面是资源清单文件

```java
apiVersion: v1  版本号
kind: PersistentVolume   类型
metadata:  元数据
  name: pv2   名称
spec: 详情
  nfs: 存储类型，与底层真正存储对应
  capacity: 存储能力，目前只迟迟存储空间的设置
    storage: 2Gi
  accessModes:访问模式
  storageClassName:存储类别
  persistentVolumeReclaimPolicy:回收策略
```

PV的关键配置参数说明

- 存储类型

底层实际存储的类型，kubernetes支持多种存储类型，每种存储类型的配置都有所差异
- 存储能力(capacity)

目前只支持存储空间的设置(storage=2Gi)，不过未来可能会加入IOPS、吞吐量等指标的配置
- 访问模式(accessModes)

用于描述用户应用对存储资源的访问权限，访问权限包括了下面几种方式：
- ReadWirteOnce(RWO): 读写权限，但是只能被单个节点挂载
- ReadOnlyMany(ROX): 只读权限，可以被多个节点挂载
- ReadWriteMany(RWX): 读写权限，可以被多个节点挂载

> 需要注意:底层不同的存储类型可能支持的访问模式不同

- 回收策略(persistentVolumeReclaimPolicy)

当PV不再被使用了之后，对其的处理方式。目前支持三种策略：
- Retain(保留) 保留数据，需要管理员手动清理数据
- Recycle(回收) 清理PV中的数据，效果相当于执行了rm -rf /volume/*
- Delete(删除) 与PV相连的后端存储完成volume的删除操作，当然这常见于云服务器的存储服务

> 需要注意：底层不同的存储类型可能支持的回收策略不同

- 存储类比

PV可以通过storageClassName参数指定了一个存储类别
- 具有特定类比的PV只能与请求了该类比的PVC进行绑定
- 未设定类别的PV则只能与不请求任何类别的PVC进行绑定
- 状态(status)

一个PV的生命周期中，可能会处于4种不同的阶段
- Available（可用）:表示可用状态，还未被任何PVC绑定
- Bound (已绑定)：表示PV已经被PVC绑定
- Released(已释放)：表示PVC被删除，但是资源还未被集中重新声明
- Failed(失败)：表示该PV的自动回收失败

**实验**

使用NFS作为存储，做PV的示例，创建3个PV，对应NFS中的3个暴露的路径。

**1、** 准备NFS环境；

```java
# 创建目录
[root@node199 ~]# mkdir /root/data/{pv1,pv2,pv3} -pv
mkdir: 已创建目录 "/root/data/pv1"
mkdir: 已创建目录 "/root/data/pv2"
mkdir: 已创建目录 "/root/data/pv3"
# 暴露服务
[root@node199 ~]# vim /etc/exports
[root@node199 ~]# cat /etc/exports
/root/data/pv1     192.168.88.0/24(rw,no_root_squash)
/root/data/pv2     192.168.88.0/24(rw,no_root_squash)
/root/data/pv3     192.168.88.0/24(rw,no_root_squash)
# 重启服务
[root@node199 ~]# systemctl restart nfs
```

> 如果无法访问NFS，请查看是否关闭了防火墙。

**1、** 创建pv.yaml；

```java
apiVersion: v1  版本号
kind: PersistentVolume   类型
metadata:  元数据
  name: pv1   名称
spec: 详情
  capacity: 存储能力，目前只迟迟存储空间的设置
    storage: 1Gi
  accessModes:访问模式
    - ReadWriteMany
  persistentVolumeReclaimPolicy: Retain回收策略
  nfs: 存储类型，与底层真正存储对应
    path: /root/data/pv1
    server: 192.168.88.199
---
apiVersion: v1  版本号
kind: PersistentVolume   类型
metadata:  元数据
  name: pv2   名称
spec: 详情
  capacity: 存储能力，目前只迟迟存储空间的设置
    storage: 2Gi
  accessModes:访问模式
    - ReadWriteMany
  persistentVolumeReclaimPolicy: Retain回收策略
  nfs: 存储类型，与底层真正存储对应
    path: /root/data/pv2
    server: 192.168.88.199
---
apiVersion: v1  版本号
kind: PersistentVolume   类型
metadata:  元数据
  name: pv3   名称
spec: 详情
  capacity: 存储能力，目前只迟迟存储空间的设置
    storage: 3Gi
  accessModes:访问模式
    - ReadWriteMany
  persistentVolumeReclaimPolicy: Retain回收策略
  nfs: 存储类型，与底层真正存储对应
    path: /root/data/pv3
    server: 192.168.88.199
```

```java
# 创建pv
[root@master ~]# kubectl create -f pv.yaml 
persistentvolume/pv1 created
persistentvolume/pv2 created
persistentvolume/pv3 created
# 查看pv
[root@master ~]# kubectl get pv -o wide
NAME   CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS      CLAIM   STORAGECLASS   REASON   AGE   VOLUMEMODE
pv1    1Gi        RWX            Retain           Available                                   26s   Filesystem
pv2    2Gi        RWX            Retain           Available                                   26s   Filesystem
pv3    3Gi        RWX            Retain           Available                                   26s   Filesystem
```

## 第三节 PVC

PVC是资源的申请，用来声明对存储空间、访问模式、存储类别需求信息。

资源清单文件

```java
apiVersion: v1  版本号
kind: PersistentVolumeClaim   类型
metadata:  元数据
  name: pvc   名称
  namespace: dev
spec: 详情
  accessModes:访问模式
  selector:采用标签对PV选择
  storageClassName:存储类别
  resources:请求空间
    requests:
      storage: 5Gi
```

PVC的关键配置参数说明

- 访问模式(accessModes)

用于描述用户应用对存储资源的访问权限
- 选择条件(selector)

通过Label Selector的设置，可使PVC对于系统中已存在的PV进行筛选
- 存储类型(storageClassName)

PVC在定义时可以设定需要的后端存储的类别，只有设置了该class的pv才能被系统选出
- 资源请求(Resources)

描述对存储资源的请求

**实验**

(1). 创建pvc.yaml，申请pv

```java
---
apiVersion: v1  版本号
kind: PersistentVolumeClaim   类型
metadata:  元数据
  name: pvc1   名称
  namespace: dev
spec: 详情
  accessModes:访问模式
    - ReadWriteMany
  resources:请求空间
    requests:
      storage: 1Gi
---
apiVersion: v1  版本号
kind: PersistentVolumeClaim   类型
metadata:  元数据
  name: pvc2   名称
  namespace: dev
spec: 详情
  accessModes:访问模式
    - ReadWriteMany
  resources:请求空间
    requests:
      storage: 1Gi
---
apiVersion: v1  版本号
kind: PersistentVolumeClaim   类型
metadata:  元数据
  name: pvc3   名称
  namespace: dev
spec: 详情
  accessModes:访问模式
    - ReadWriteMany
  resources:请求空间
    requests:
      storage: 1Gi
```

```java
# 创建pvc
[root@master ~]# kubectl create -f pvc.yaml 
persistentvolumeclaim/pvc1 created
persistentvolumeclaim/pvc2 created
persistentvolumeclaim/pvc3 created
# 查看pvc
[root@master ~]# kubectl get pvc -n dev -o wide
NAME   STATUS   VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS   AGE   VOLUMEMODE
pvc1   Bound    pv1      1Gi        RWX                           18s   Filesystem
pvc2   Bound    pv2      2Gi        RWX                           18s   Filesystem
pvc3   Bound    pv3      3Gi        RWX                           18s   Filesystem
```

```java
# 查看pv,可以看到pvc已经绑定了pv
[root@master ~]# kubectl get pv -o wide
NAME   CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM      STORAGECLASS   REASON   AGE   VOLUMEMODE
pv1    1Gi        RWX            Retain           Bound    dev/pvc1                           79s   Filesystem
pv2    2Gi        RWX            Retain           Bound    dev/pvc2                           79s   Filesystem
pv3    3Gi        RWX            Retain           Bound    dev/pvc3                           79s   Filesystem
```

(2)创建pods.yaml，使用pv

```java
apiVersion: v1  版本号
kind: Pod   类型
metadata:  元数据
  name: pod1   pod名称
  namespace: dev  所属命名空间
spec: 详情
  containers:
    - name: busybox
      image: busybox:1.30
      command: ["/bin/sh","-c","while true;do echo pod1 >> /root/out.txt;sleep 5;done;"]初始化命令，动态读取指定文件中内容
      volumeMounts: 将log-volume 挂在到busybox容器中，对应的目录为 /logs
        - name: volume
          mountPath: /root/
  volumes: 声明volume, name为log-volume，类型为emptyDir
    - name: volume
      persistentVolumeClaim:
        claimName: pvc1 声明需要pvc1
        readOnly: false
---
apiVersion: v1  版本号
kind: Pod   类型
metadata:  元数据
  name: pod2   pod名称
  namespace: dev  所属命名空间
spec: 详情
  containers:
    - name: busybox
      image: busybox:1.30
      command: ["/bin/sh","-c","while true;do echo pod2 >> /root/out.txt;sleep 5;done;"]初始化命令，动态读取指定文件中内容
      volumeMounts: 将log-volume 挂在到busybox容器中，对应的目录为 /logs
        - name: volume
          mountPath: /root/
  volumes: 声明volume, name为log-volume，类型为emptyDir
    - name: volume
      persistentVolumeClaim:
        claimName: pvc2 声明需要pvc2
        readOnly: false
```

```java
# 创建pod
[root@master ~]# kubectl create -f pods.yaml 
pod/pod1 created
pod/pod2 created
```

此时去到nfs服务器查看，发现pv1和pv2下面已经有文件了。

## 第四节 删除pod和pvc

```java
# 查看pv
[root@master ~]# kubectl get pv
NAME   CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM      STORAGECLASS   REASON   AGE
pv1    1Gi        RWX            Retain           Bound    dev/pvc1                           115m
pv2    2Gi        RWX            Retain           Bound    dev/pvc2                           115m
pv3    3Gi        RWX            Retain           Bound    dev/pvc3                           115m
# 删除pod
[root@master ~]# kubectl delete -f pods.yaml 
pod "pod1" deleted
pod "pod2" deleted
[root@master ~]# kubectl delete -f pvc.yaml 
persistentvolumeclaim "pvc1" deleted
persistentvolumeclaim "pvc2" deleted
persistentvolumeclaim "pvc3" deleted
# 删除pvc
[root@master ~]# kubectl get pv
NAME   CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS     CLAIM      STORAGECLASS   REASON   AGE
pv1    1Gi        RWX            Retain           Released   dev/pvc1                           116m
pv2    2Gi        RWX            Retain           Released   dev/pvc2                           116m
pv3    3Gi        RWX            Retain           Released   dev/pvc3                           116m
# 查看pv
[root@master ~]# kubectl get pv
NAME   CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS     CLAIM      STORAGECLASS   REASON   AGE
pv1    1Gi        RWX            Retain           Released   dev/pvc1                           117m
pv2    2Gi        RWX            Retain           Released   dev/pvc2                           117m
pv3    3Gi        RWX            Retain           Released   dev/pvc3                           117m
```

在删除pod和pvc之后，发现pv的状态变成了Released （PVC已被删除，但是资源还未被集群重新声明）

## 第五节 生命周期

PVC和PV是一一对应的，PV和PVC之间的相互作用遵循以下生命周期：

- 资源供应： 管理员手动创建底层存储和PV
- 资源绑定： 用户创建PVC，kubernetes负责根据PVC的声明寻找PV，并绑定

在用户定义好PVC之后，系统将根据PVC对存储资源的请求在已存在的PC中选择一个满足条件的
- 一旦找到，就将该PV与用户定义的PV进行绑定，用户的应用就可以使用这个PVC了
- 如果找不到，PVC则会无限期处于Pending状态，直到等到系统管理员创建一个符合其要求的PV

PV一旦绑定到某个PVC上，就会被这个PVC独占，不能再与其它PVC进行绑定了

- 资源使用：用户可在pod中像volume一样使用pvc

Pod使用volume的定义，将PVC挂载到容器内的某个路径进行使用
- 资源释放： 用户删除pvc来释放pv

当存储资源是哟个完毕后，用户可以删除PVC，与该PVC绑定的PV将会被标记为”已释放"，但还不能立刻与其他PVC进行绑定。通过之前PVC写入的数据可能还被留在存储设备上，只有在清除之后该PV才能再次使用。
- 资源回收： kubernetes根据pv设置的回收策略进行资源的回收

对于PV，管理员可以设定回收策略，用户设置与绑定的PVC释放之后如何处理遗留数据的问题。只有PV的存储空间完成回收，才能供新的PVC绑定和使用。
