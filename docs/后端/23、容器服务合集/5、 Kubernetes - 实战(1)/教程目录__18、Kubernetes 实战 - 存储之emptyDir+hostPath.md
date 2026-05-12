# 18、Kubernetes 实战 - 存储之emptyDir+hostPath
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/1/18.html
- 分类：容器服务
- 分组：教程目录
## emptyDir

一个emptyDir 第一次创建是在一个pod被指定到具体node的时候，并且会一直存在在pod的生命周期当中，正如它的名字一样，它初始化是一个空的目录，pod中的容器都可以读写这个目录，这个目录可以被挂在到各个容器相同或者不相同的的路径下。当一个pod因为任何原因被移除的时候，这些数据会被永久删除。注意：一个容器崩溃了不会导致数据的丢失，因为容器的崩溃并不移除pod.

**emptyDir 磁盘的作用：**

- 普通空间，基于磁盘的数据存储
- 作为从崩溃中恢复的备份点
- 存储那些那些需要长久保存的数据，例web服务中的数据
- 容器之间的数据共享

默认的，emptyDir 磁盘会存储在主机所使用的媒介上，可能是SSD，或者网络硬盘，这主要取决于你的环境。当然，我们也可以将emptyDir.medium的值设置为Memory来告诉Kubernetes 来挂在一个基于内存的目录tmpfs，因为tmpfs速度会比硬盘块度了，但是，当主机重启的时候所有的数据都会丢失

## hostPath

一个hostPath类型的磁盘就是挂在了主机的一个文件或者目录。

**例如，如下情况我们可能需要用到hostPath**

- 某些应用需要用到docker的内部文件，这个时候只需要挂在本机的/var/lib/docker作为hostPath
- 在容器中运行cAdvisor，这个时候挂在/dev/cgroups

当我们使用hostPath的时候要注意如下内容从模版文件中创建的pod可能会因为主机上文件夹目录的不同而导致一些问题Kubernetes 规划一些资源相关的维护的时候，它不能根据此种类型的资源进行判断

hostPath的**type类型**

值
说明

空字符串(默认)，向后兼容

Directory
给定的目录路径必须存在

DirectoryOrCreate
如果给定路径不存在，将根据需要在那里创建一个空目录，权限设置为755，与Kubelet具有相同的组和所有权。

FileOrCreate
如果给定路径不存在，将根据需要在那里创建一个空文件，权限设置为644，与Kubelet具有相同的组和所有权。

File
给定路径上必须存在对应文件

Socket
给定路径上必须存在一个UNIX socket

CharDevice
给定路径上必须存在字符设备

BlockDevice
给定路径上必须存在块设备

**案例**

在主机创建一个日志存放目录，容器将nginx日志写入此目录

**1、** 创建；

```sh
# work节点创建日志目录
mkdir -p  /log/nginx
# 
vim nginx-pod.yaml 
# 内容
apiVersion: v1
kind: Pod
metadata:
 labels:
  app: nginx
 name: nginx
spec:
 restartPolicy: Never
 containers:
 - name: nginx-001
   image: daocloud.io/library/nginx:1.7.11
   imagePullPolicy: IfNotPresent
   volumeMounts:
   - name: log-v
     mountPath: /var/log/nginx
 volumes:
 - name: log-v
   hostPath:
    path: /log/nginx
    type: Directory
kubectl apply  -f nginx-pod.yaml
kubectl get pod nginx -o wid
# 进入节点查看，日志已存储到节点目录
cd  /log/nginx
ll
# 删除pod,日志依然存在，类似于docker的目录隐射
```
