# 16、Kubernetes - 实战：存储卷Volume介绍及使用
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/6/16.html
- 分类：容器服务
- 分组：教程目录
## Volume介绍

**Volume存在的意义**

容器磁盘上的文件的生命周期是短暂的，这就使得在容器中运行重要应用时会出现一些问题，首先，当容器崩溃时，kubelet会重启它，但是容器中的文件将丢失——容器以干净的状态(镜像最初的状态)重新启动。其次，在Pod中运行多个容器时，这些容器之间通常需要共享文件。kubernetes中的Volume抽象就很好的解决了这些问题

**背景**

kubernetes中的卷有明确的寿命 —— 与封装它的Pod相同。所以，卷的生命比Pod中所有的容器要长，当这个容器重启时数据仍然得以保存。当然，当Pod不再存在，卷也就不复存在。也许，更重要的是kubernetes支持多种类型的卷，Pod可以同时使用任意数量的卷

**卷的类型**

## Kubernetes常用卷类型：

- 非持久性存储
- emptyDir
- hostPath
- 网络连接性存储
- SAN：iSCSI
- NFS：nfs，cfs
- 分布式存储
- glusterfs、rbd、cephfs
- 云端存储
- EBS、Azure、Disk、阿里云、gieRepo

> kubectl explain pod.spec.volumes #查询k8s支持的所有volume类型

**常用卷演示**

## 1、emptyDir

当Pod被分配到节点时，首先创建 emptyDir 卷，并且只要该Pod在该节点运行，改卷就会存在，正如名字所述，它最初是空的，Pod中的容器可以读取和写入 emptyDir 中的文件，尽管该卷可以挂在到每个容器相同或者不同的路径上，当Pod在该节点被删除后，emptyDir 中的数据也将会被永久删除

> 注意：容器崩溃不会将Pod在此节点移除，所有数据不会丢失

示例：

创建带有 emptyDir 的 Pod

```java
vim emptydir.yaml
...
apiVersion: v1
kind: Pod
metadata:
  name: emptydir
  namespace: default
spec:
  containers:
  - name: em-container-1
    image: hub.vfancloud.com/test/myapp:v1
    imagePullPolicy: IfNotPresent
    volumeMounts:
    - mountPath: /test1  挂载到/test1下
      name: em-volume
  - name: enecontainer-2
    image: mysql:master
    imagePullPolicy: IfNotPresent
    command: ['/bin/sh','-c','sleep 666666']
    volumeMounts:
    - mountPath: /test2  挂载到/test2下
      name: em-volume
  volumes:
  - name: em-volume
    emptyDir: {}
...
kubectl create -f emptydir.yaml
## 进入容器内，是空目录
[root@Centos8 volume]# kubectl exec -it emptydir -c em-container-1 -- /bin/sh
/ cd test1/
/test1 ls
## 创建一个文件
/test1 date > index.html
/test1 cat index.html 
Fri Jun  5 09:58:21 UTC 2020
## 进入第二个容器内，前往挂载的目录查看是否同步此文件
[root@Centos8 volume]# kubectl exec -it emptydir -c enecontainer-2 -- /bin/sh
# cd /test2       
# ls
index.html
# cat index.html
Fri Jun  5 09:58:21 UTC 2020
## 同时 再添加一条信息到文件中
# date >> index.html
# cat index.html 
Fri Jun  5 09:58:21 UTC 2020
Fri Jun  5 17:59:30 CST 2020
## 此时再返回第一个容器中，查看是否同步文件内容
/test1 cat index.html 
Fri Jun  5 09:58:21 UTC 2020
Fri Jun  5 17:59:30 CST 2020
```

## 2、hostPath

hostPath 卷将主机节点的文件系统中的文件或目录挂载到集群中

hostPath的用途如下：

运行需要访问Docker内部的容器；使用 /var/lib/docker 的 hostPath

在容器中运行cAdvisor；使用 /dev/cgroups 的 hostPath

除了所需的 Path 属性之外；用户还可以为 hostPath 卷指定 type

**值**

**行为**

空字符串(默认)用于向后兼容，这意味着在挂载hostPath卷之前不会进行任何检查

DirectoryOrCreate

如果给定的路径没有任何东西存在，那将根据需要在此创建一个空目录，权限设置为0755，与kubelet拥有相同的用户与组

Directory

指定路径下必须存在此目录

FileOrCreate

如果给定的路径没有任何东西存在，那将根据需要在此创建一个空文件，权限设置为0644，与kubelet拥有相同的用户与组

File

给定的路径下必须存在文件

Socket

给定的路径下必须存在Unix套接字

CharDevice

给定的路径下必须存在字符设备

BlockDevice

给定的路径下必须存在块设备

使用这种卷类型时请注意：

- 由于每个节点上的文件不同，具有相同配置(例如从 podTemplate创建的)的pod在不同节点上的行为可能会有所不同
- 当Kubernetes按照计划添加资源感知调度时，将无法考虑hostPath使用的资源
- 在底层主机上创建的文件或目录只能由root写入。必须在特权容器中以root身份运行进程，或修改主机上文件权限以便写入 hostPath 卷

```java
vim dir-volume.yaml
...
apiVersion: v1
kind: Pod
metadata:
  name: hostpath-volume
  namespace: default
spec:
  containers:
  - name: hostpath-container
    image: hub.vfancloud.com/test/myapp:v1
    imagePullPolicy: IfNotPresent
    volumeMounts:
    - mountPath: /test-volume
      name: dir-volume
  volumes:
  - name: dir-volume
    hostPath:
      path: /opt
      type: Directory  volume类型
...
kubectl create -f dir-volume.yaml
### 进入容器内查看，可以看到，pod的node节点下/opt的所有文件及目录已挂载
[root@Centos8 volume]# kubectl exec -it hostpath-volume -- /bin/sh
/ ls /test-volume/
cni         containerd  es-data     es-log      metricbeat  rh
```
