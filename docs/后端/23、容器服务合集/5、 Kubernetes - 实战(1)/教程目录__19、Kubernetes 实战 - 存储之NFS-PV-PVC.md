# 19、Kubernetes 实战 - 存储之NFS/PV/PVC
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/1/19.html
- 分类：容器服务
- 分组：教程目录
## NFS

**概念**

一种网络文件系统，NFS允许一个系统在网络上与它人共享目录和文件。通过使用NFS，用户和程序可以象访问本地文件 一样访问远端系统上的文件。

**应用在K8S中**

Kubernetes中通过简单地配置就可以挂载NFS到Pod中，而NFS中的数据是可以永久保存的，同时NFS支持同时写操作。Pod被删除时，Volume被卸载，内容被保留。这就意味着NFS能够允许我们提前对数据进行处理，而且这些数据可以在Pod之间相互传递。

**创建**

```sh
yum  install  nfs-utils rpcbind  -y  
mkdir -p /data/{
     nfs1,nfs2,nfs3}
vi  /etc/exports
# 添加
/data/nfs1  *(rw,no_root_squash,no_all_squash,sync)
/data/nfs2  *(rw,no_root_squash,no_all_squash,sync)
/data/nfs3  *(rw,no_root_squash,no_all_squash,sync)
# 刷新配置
exportfs -r
# 重启
systemctl restart rpcbind  && systemctl restart nfs
systemctl enable  rpcbind  && systemctl enable  nfs
```

## PV/PVC

**简介**

*PersistentVolume*（PV）是集群中已由管理员配置的一段网络存储。 集群中的资源就像一个节点是一个集群资源。 PV是诸如卷之类的卷插件，但是具有独立于使用PV的任何单个pod的生命周期。 该API对象捕获存储的实现细节，即NFS，iSCSI或云提供商特定的存储系统。

*PersistentVolumeClaim*（PVC）是用户存储的请求。 它类似于pod。Pod消耗节点资源，PVC消耗存储资源。 pod可以请求特定级别的资源（CPU和内存）。 权限要求可以请求特定的大小和访问模式。

**PV分类**

*静态Static*：集群管理员创建一些PV。它们带有可供集群用户使用的实际存储的详细信息。存在于Kubernetes API中，可供使用。

*动态Dynamic*：当管理员创建的静态PV都不匹配用户的PersistentVolumeClaim时，集群可能会尝试为PVC动态配置卷。 此配置基于StorageClasses：PVC必须请求一个类，并且管理员必须已创建并配置该类才能进行动态配置。 要求该类的声明有效地为自己禁用动态配置

**生命周期**

PV是集群中的资源。 PVC是对这些资源的请求，也是对资源的索赔检查。 PV和PVC之间的相互作用遵循这个生命周期:

**创建=》绑定=》使用=》释放=》回收**

**支持类型**

- GCEPersistentDisk
- AWSElasticBlockStore
- AzureFile
- AzureDisk
- FC (Fibre Channel)
- FlexVolume
- Flocker
- NFS
- iSCSI
- RBD (Ceph Block Device)
- CephFS
- Cinder (OpenStack block storage)
- Glusterfs
- VsphereVolume
- Quobyte Volumes
- HostPath (single node testing only – local storage is not supported in any way and WILL - - NOT WORK in a multi-node cluster)
- VMware Photon
- Portworx Volumes
- ScaleIO Volumes

**创建PV示例**

```sh
vim pvs.yml
# 内容
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv001
spec:
  特定的存储容量
  capacity:
    storage: 1Gi
  volumeMode: Filesystem
  访问模式，ReadWriteOnce/ReadOnlyMany/ReadWriteMany,单node的读写/多node的只读/多node的读写
  accessModes:
    - ReadWriteOnce
  回收策略：Retain/Recycle/Delete，保留/回收/删除
  persistentVolumeReclaimPolicy: Recycle
  PV可以有一个类，通过将storageClassName属性设置为StorageClass的名称来指定。 特定类的PV只能绑定到请求该类的PVC。 没有storageClassName的PV没有类，只能绑定到不需要特定类的PVC。
  storageClassName: slow
  Kubernetes管理员可以指定在一个节点上挂载一个持久卷时的其他安装选项
  mountOptions:
    - hard
    - nfsvers=4.1
  nfs:
    nfs路径
    path: /data/nfs1
    nfs节点IP
    server: 192.168.58.103
# 创建
kubectl create -f pvs.yml
# 查看
kubectl get pv 
```

**重要参数解析**

CAPACITY：特定的存储容量

ACCESS MODES：访问模式

RECLAIM POLICY：回收策略

STATUS：状态（Available /Bound /Released /Failed 可用/已绑定/已释放/已失败）

## 案例

部署一个Mysql，并把数据目录挂载到pv中

**1、** 创建pvc，没有绑定PV时,K8S会自动根据PVC需要寻找PV；

```sh
vim mysql-pvc.yaml
# 添加
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc-mysql-001
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
# 
kubectl apply  -f mysql-pvc.yaml
# 查看pvc 
kubectl get pvc 
```

**1、** 创建pod；

```sh
apiVersion: v1
kind: Pod
metadata:
 labels:
  app: mysql-001
 name: mysql-001
spec:
   restartPolicy: Never
   containers:
   - name: mysql-001
     image: daocloud.io/library/mysql:5.7.4
     imagePullPolicy: IfNotPresent
     ports:
     - containerPort: 3306
       name: mysql-port
     env:
     - name: MYSQL_ROOT_PASSWORD
       value: admin123
     volumeMounts:
     - name: data
       mountPath: /var/lib/mysql
   volumes:
   - name: data
     persistentVolumeClaim:
       claimName: pvc-mysql-001
```

**1、** 验证，进入nfs目录，发现mysql数据已被挂载；
