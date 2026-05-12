# 11、Kubernetes - 实战：存储（Volume之pv）
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/5/11.html
- 分类：容器服务
- 分组：教程目录
## 一、persistent volumes简介

## 简介

管理存储和管理计算有着明显的不同。PersistentVolume给用户和管理员提供了一套API，抽象出存储是如何提供和消耗的细节。在这里，我们介绍两种新的API资源：PersistentVolume（简称PV）和PersistentVolumeClaim（简称PVC）。

PersistentVolume（持久卷，简称PV） 是集群内，由管理员提供的网络存储的一部分。就像集群中的节点一样，PV也是集群中的一种资源。它也像Volume一样，是一种volume插件，但是它的生命周期却是和使用它的Pod相互独立的。PV这个API对象，捕获了诸如NFS、ISCSI、或其他云存储系统的实现细节。

PersistentVolumeClaim（持久卷声明，简称PVC） 是用户的一种存储请求。它和Pod类似，Pod消耗Node资源，而PVC消耗PV资源。Pod能够请求特定的资源（如CPU和内存）。PVC能够请求指定的大小和访问的模式（可以被映射为一次读写或者多次只读）。

PVC允许用户消耗抽象的存储资源，用户也经常需要各种属性（如性能）的PV。集群管理员需要提供各种各样、不同大小、不同访问模式的PV，而不用向用户暴露这些volume如何实现的细节。因为这种需求，就催生出一种StorageClass资源。

StorageClass提供了一种方式，使得管理员能够描述他提供的存储的等级。集群管理员可以将不同的等级映射到不同的服务等级、不同的后端策略。

## pv和pvc的区别

PersistentVolume（持久卷）和PersistentVolumeClaim（持久卷申请）是k8s提供的两种API资源，用于抽象存储细节。管理员关注于如何通过pv提供存储功能而无需关注用户如何使用，同样的用户只需要挂载pvc到容器中而不需要关注存储卷采用何种技术实现。

pvc和pv的关系与pod和node关系类似，前者消耗后者的资源。pvc可以向pv申请指定大小的存储资源并设置访问模式,这就可以通过Provision -> Claim 的方式，来对存储资源进行控制。

## 二、volume和claim的生命周期

PV是集群中的资源，PVC是对这些资源的请求，同时也是这些资源的“提取证”。PV和PVC的交互遵循以下生命周期：

## 有两种PV提供的方式：静态和动态。

静态

集群管理员创建多个PV，它们携带着真实存储的详细信息，这些存储对于集群用户是可用的。它们存在于Kubernetes API中，并可用于存储使用。

动态

当管理员创建的静态PV都不匹配用户的PVC时，集群可能会尝试专门地供给volume给PVC。这种供给基于StorageClass：PVC必须请求这样一个等级，而管理员必须已经创建和配置过这样一个等级，以备发生这种动态供给的情况。请求等级配置为“ ”的PVC，有效地禁用了它自身的动态供给功能。

## 绑定

用户创建一个PVC（或者之前就已经就为动态供给创建了），指定要求存储的大小和访问模式。master中有一个控制回路用于监控新的PVC，查找匹配的PV（如果有），并把PVC和PV绑定在一起。如果一个PV曾经动态供给到了一个新的PVC，那么这个回路会一直绑定这个PV和PVC。另外，用户总是至少能得到它们所要求的存储，但是volume可能超过它们的请求。一旦绑定了，PVC绑定就是专属的，无论它们的绑定模式是什么。

如果没找到匹配的PV，那么PVC会无限期得处于unbound未绑定状态，一旦PV可用了，PVC就会又变成绑定状态。比如，如果一个供给了很多50G的PV集群，不会匹配要求100G的PVC。直到100G的PV添加到该集群时，PVC才会被绑定。

## 使用

Pod使用PVC就像使用volume一样。集群检查PVC，查找绑定的PV，并映射PV给Pod。对于支持多种访问模式的PV，用户可以指定想用的模式。一旦用户拥有了一个PVC，并且PVC被绑定，那么只要用户还需要，PV就一直属于这个用户。用户调度Pod，通过在Pod的volume块中包含PVC来访问PV。

## 释放

当用户使用PV完毕后，他们可以通过API来删除PVC对象。当PVC被删除后，对应的PV就被认为是已经是“released”了，但还不能再给另外一个PVC使用。前一个PVC的属于还存在于该PV中，必须根据策略来处理掉。

## 回收

PV的回收策略告诉集群，在PV被释放之后集群应该如何处理该PV。当前，PV可以被Retained（保留）、 Recycled（再利用）或者Deleted（删除）。保留允许手动地再次声明资源。对于支持删除操作的PV卷，删除操作会从Kubernetes中移除PV对象，还有对应的外部存储（如AWS EBS，GCE PD，Azure Disk，或者Cinder volume）。动态供给的卷总是会被删除。

## 三、PV详解

每个PV都包含一个spec和状态，即说明书和PV卷的状态，如以下示例：

```java
[root@server1 volumes]# vim pv1.yaml 
[root@server1 volumes]# cat pv1.yaml 
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv1
spec:
  capacity:
    storage: 500Mi					#设置pv大小
  volumeMode: Filesystem			#卷类型
  accessModes:
    - ReadWriteOnce							#访问模式
  persistentVolumeReclaimPolicy: Recycle		#回收策略
  storageClassName: slow			#存储类别名称
  nfs:
    server: 172.25.63.1			#设置nfs挂载路径和服务器地址
    path: /nfs
```

创建pv：

```java
[root@server1 volumes]# kubectl create -f pv1.yaml 
persistentvolume/pv1 created
```

查看pv：

```java
[root@server1 volumes]# kubectl get pv
NAME   CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS      CLAIM   STORAGECLASS   REASON   AGE
pv1    500Mi      RWO            Recycle          Available           slow                    11s
```

删除：

```java
[root@server1 volumes]# kubectl delete -f pv1.yaml 
persistentvolume "pv1" deleted
```

## 访问模式

PV可以使用存储资源提供商支持的任何方法来映射到host中。如下的表格中所示，提供商有着不同的功能，每个PV的访问模式被设置为卷支持的指定模式。比如，NFS可以支持多个读/写的客户端，但可以在服务器上指定一个只读的NFS PV。每个PV有它自己的访问模式。

访问模式包括：

　　　▷ ReadWriteOnce —— 该volume只能被单个节点以读写的方式映射

　　　▷ ReadOnlyMany —— 该volume可以被多个节点以只读方式映射

　　　▷ ReadWriteMany —— 该volume只能被多个节点以读写的方式映射

　
在CLI中，访问模式可以简写为：

　　　▷ RWO - ReadWriteOnce

　　　▷ ROX - ReadOnlyMany

　　　▷ RWX - ReadWriteMany

## Class

一个PV可以有一种class，通过设置storageClassName属性来选择指定的StorageClass。有指定class的PV只能绑定给请求该class的PVC。没有设置storageClassName属性的PV只能绑定给未请求class的PVC。

过去，使用volume.beta.kubernetes.io/storage-class注解，而不是storageClassName属性。该注解现在依然可以工作，但在Kubernetes的未来版本中已经被完全弃用了。

## 回收策略

当前的回收策略有：

　　　▷ Retain：手动回收

　　　▷ Recycle：需要擦除后才能再使用

　　　▷ Delete：相关联的存储资产，如AWS EBS，GCE PD，Azure Disk，or OpenStack Cinder卷都会被删除

当前，只有NFS和HostPath支持回收利用，AWS EBS，GCE PD，Azure Disk，or OpenStack Cinder卷支持删除操作。

阶段

一个volume卷处于以下几个阶段之一：

　　　▷ Available：空闲的资源，未绑定给PVC

　　　▷ Bound：绑定给了某个PVC

　　　▷ Released：PVC已经删除了，但是PV还没有被集群回收

　　　▷ Failed：PV在自动回收中失败了

CLI可以显示PV绑定的PVC名称。

## 四、PersistentVolumeClaims（PVC）详解

每个PVC都包含一个spec和status，即该PVC的规则说明和状态。

```java
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: myclaim
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 8Gi
  storageClassName: slow
  selector:
    matchLabels:
      release: "stable"
    matchExpressions:
      - {
     key: environment, operator: In, values: [dev]}
```

## 访问模式

当请求指定访问模式的存储时，PVC使用的规则和PV相同。

资源

PVC，就像pod一样，可以请求指定数量的资源。请求资源时，PV和PVC都使用相同的资源样式。

## 选择器（Selector）

PVC可以指定标签选择器进行更深度的过滤PV，只有匹配了选择器标签的PV才能绑定给PVC。选择器包含两个字段：

matchLabels（匹配标签） - PV必须有一个包含该值得标签

matchExpressions（匹配表达式） - 一个请求列表，包含指定的键、值的列表、关联键和值的操作符。合法的操作符包含In，NotIn，Exists，和DoesNotExist。

所有来自matchLabels和matchExpressions的请求，都是逻辑与关系的，它们必须全部满足才能匹配上。

## 等级（Class）

PVC可以使用属性storageClassName来指定StorageClass的名称，从而请求指定的等级。只有满足请求等级的PV，即那些包含了和PVC相同storageClassName的PV，才能与PVC绑定。

PVC并非必须要请求一个等级。设置storageClassName为“”的PVC总是被理解为请求一个无等级的PV，因此它只能被绑定到无等级的PV（未设置对应的标注，或者设置为“”）。未设置storageClassName的PVC不太相同，DefaultStorageClass的权限插件打开与否，集群也会区别处理PVC。

如果权限插件被打开，管理员可能会指定一个默认的StorageClass。所有没有指定StorageClassName的PVC只能被绑定到默认等级的PV。要指定默认的StorageClass，需要在StorageClass对象中将标注storageclass.kubernetes.io/is-default-class设置为“true”。如果管理员没有指定这个默认值，集群对PVC创建请求的回应就和权限插件被关闭时一样。如果指定了多个默认等级，那么权限插件禁止PVC创建请求。

　　　
如果权限插件被关闭，那么久没有默认StorageClass的概念。所有没有设置StorageClassName的PVC都只能绑定到没有等级的PV。因此，没有设置StorageClassName的PVC就如同设置StorageClassName为“”的PVC一样被对待。

根据安装方法的不同，默认的StorageClass可能会在安装过程中被插件管理默认的部署在Kubernetes集群中。

当PVC指定selector来请求StorageClass时，所有请求都是与操作的。只有满足了指定等级和标签的PV才可能绑定给PVC。当前，一个非空selector的PVC不能使用PV动态供给。

## 使用PVC

Pod通过使用PVC（使用方式和volume一样）来访问存储。PVC必须和使用它的pod在同一个命名空间，集群发现pod命名空间的PVC，根据PVC得到其后端的PV，然后PV被映射到host中，再提供给pod。

## 五、用nfs创建pv示例

**1、** 首先搭建nfs服务器；

**2、** 创建NFSPV卷；

```java
[root@server1 volumes]# vim pv2.yaml
[root@server1 volumes]# cat pv2.yaml 
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv1
spec:
  capacity:
    storage: 500Mi
  volumeMode: Filesystem
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Recycle
  storageClassName: nfs
  nfs:
    server: 172.25.63.1
    path: /nfs
```

创建并查看状态：

```java
[root@server1 volumes]# kubectl create -f pv2.yaml 
persistentvolume/pv1 created
[root@server1 volumes]# kubectl get pv
NAME   CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS      CLAIM   STORAGECLASS   REASON   AGE
pv1    500Mi      RWO            Recycle          Available           nfs                     21s
```

可以看到状态是Available

**3、** 创建PVC；

```java
[root@server1 volumes]# vim pvc2.yaml 
[root@server1 volumes]# cat pvc2.yaml 
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc1
spec:
  storageClassName: nfs
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 500Mi
```

注意我们在上述文件中只是声明我们要求的PV是什么样子的，我们这里的要求与上面创建的PV相同。

同时需要注意的是只有pv满足storageClassName，accessModes，resources的所有条件才会被绑定。

创建并查看：

```java
[root@server1 volumes]# kubectl create -f pvc2.yaml 
persistentvolumeclaim/pvc1 created
[root@server1 volumes]# kubectl get pvc
NAME   STATUS   VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS   AGE
pvc1   Bound    pv1      500Mi      RWO            nfs            7s
```

可以看到pvc1的状态已经是Bound绑定状态了，且绑定的是pv1,然后我们现在查看pv状态：

```java
[root@server1 volumes]# kubectl get pv
NAME   CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM          STORAGECLASS   REASON   AGE
pv1    500Mi      RWO            Recycle          Bound    default/pvc1   nfs                     4m55s
```

同样显示与pvc1是绑定状态，default表示默认的namespace

**4、** 再创建一个pv；

```java
[root@server1 volumes]# vim pv3.yaml 
[root@server1 volumes]# cat pv3.yaml 
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv2
spec:
  capacity:
    storage: 1Gi
  volumeMode: Filesystem
  accessModes:
    - ReadWriteMany
  persistentVolumeReclaimPolicy: Delete
  storageClassName: nfs
  nfs:
    server: 172.25.63.1
    path: /nfs
[root@server1 volumes]# kubectl create -f pv3.yaml 
persistentvolume/pv2 created
[root@server1 volumes]# kubectl get pv
NAME   CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS      CLAIM   STORAGECLASS   REASON   AGE
pv1    500Mi      RWO            Recycle          Available           nfs                     9m44s
pv2    1Gi        RWX            Delete           Available           nfs                     45s
```

注意我们设置的回收策略设置的是删除，即删除pvc时pv也会被删除，大小设置的是1G.

**5、** 再创建一个pvc；

```java
[root@server1 volumes]# vim pvc2.yaml 
[root@server1 volumes]# cat pvc2.yaml 
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc1
spec:
  storageClassName: nfs
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 1Gi
[root@server1 volumes]# kubectl create -f pvc2.yaml 
persistentvolumeclaim/pvc1 created
[root@server1 volumes]# 
[root@server1 volumes]# kubectl get pv
NAME   CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS      CLAIM          STORAGECLASS   REASON   AGE
pv1    500Mi      RWO            Recycle          Available                  nfs                     10m
pv2    1Gi        RWX            Delete           Bound       default/pvc1   nfs                     88s
[root@server1 volumes]# kubectl get pvc
NAME   STATUS   VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS   AGE
pvc1   Bound    pv2      1Gi        RWX            nfs            12s
```

可以看出pvc1的要求 pv2满足，因此创建后就和pv2绑定。

然后现在删除pvc1后查看pv2的状态：

```java
[root@server1 volumes]# kubectl delete -f pvc2.yaml 
persistentvolumeclaim "pvc1" deleted
[root@server1 volumes]# kubectl get pvc
No resources found in default namespace.
[root@server1 volumes]# kubectl get pv
NAME   CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS      CLAIM          STORAGECLASS   REASON   AGE
pv1    500Mi      RWO            Recycle          Available                  nfs                     11m
pv2    1Gi        RWX            Delete           Failed      default/pvc1   nfs                     2m13s
```

可以看出pv2的状态是faild，因为nfs不支持删除，因此显示删除失败。

实验完成后将pv2删除：

```java
[root@server1 volumes]# kubectl delete -f pv3.yaml 
persistentvolume "pv2" deleted
```

## 六、pod使用pvc示例

首先创建pv和pvc：

```java
[root@server1 volumes]# kubectl get pv
NAME   CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS      CLAIM   STORAGECLASS   REASON   AGE
pv1    500Mi      RWO            Recycle          Available           nfs                     11m
[root@server1 volumes]# vim pvc2.yaml 
[root@server1 volumes]# cat pvc2.yaml 
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc1
spec:
  storageClassName: nfs
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 500Mi
[root@server1 volumes]# kubectl create -f pvc2.yaml 
persistentvolumeclaim/pvc1 created
[root@server1 volumes]# kubectl get pv
NAME   CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM          STORAGECLASS   REASON   AGE
pv1    500Mi      RWO            Recycle          Bound    default/pvc1   nfs                     13m
[root@server1 volumes]# kubectl get pvc
NAME   STATUS   VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS   AGE
pvc1   Bound    pv1      500Mi      RWO            nfs            8s
```

之后创建pod：

```java
[root@server1 volumes]# vim pod3.yaml
[root@server1 volumes]# cat pod3.yaml 
apiVersion: v1
kind: Pod
metadata:
  name: testpd
spec:
  containers:
  - image: nginx
    name: test-container
    volumeMounts:
    - mountPath: /usr/share/nginx/html
      name: storage1
  volumes:
  - name: storage1
    nfs:
    persistentVolumeClaim:
      claimName: pvc1
```

上述部署文件表示将pvc1挂载到容器内的nginx发布目录，创建pod：

```java
[root@server1 volumes]# kubectl create -f pod3.yaml 
pod/testpd created
[root@server1 volumes]# kubectl get pod
NAME      READY   STATUS        RESTARTS   AGE
testpd    1/1     Running       0          5s
[root@server1 volumes]# kubectl describe pod testpd 
```

现在我们进入容器内部写入测试文件：

```java
[root@server1 volumes]# kubectl exec -it testpd -- bash
root@testpd:/# cd /usr/share/nginx/html/
root@testpd:/usr/share/nginx/html# ls
root@testpd:/usr/share/nginx/html# echo redhat > index.html
root@testpd:/usr/share/nginx/html# cat index.html 
redhat
root@testpd:/usr/share/nginx/html# exit
```

然后测试访问：

```java
[root@server1 volumes]# kubectl get pod -o wide
NAME      READY   STATUS        RESTARTS   AGE    IP            NODE      NOMINATED NODE   READINESS GATES
testpd    1/1     Running       0          119s   10.244.2.67   server3   <none>           <none>
[root@server1 volumes]# curl 10.244.2.67
redhat
```

可以成功访问，需要注意的是，在容器内写入的数据会直接写入到nfs服务器中：

```java
[root@server1 volumes]# cat /nfs/index.html 
redhat
```

此时我们将pod删除后再查看pvc的状态：

```java
[root@server1 volumes]# kubectl delete -f pod3.yaml 
pod "testpd" deleted
[root@server1 volumes]# kubectl get pvc
NAME   STATUS   VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS   AGE
pvc1   Bound    pv1      500Mi      RWO            nfs            7m52s
```

可以看出pvc依然存在，这个pvc也可以被其他pod挂载：

```java
[root@server1 volumes]# vim pod3.yaml
[root@server1 volumes]# cat pod3.yaml 
apiVersion: v1
kind: Pod
metadata:
  name: mypod
spec:
  containers:
  - image: nginx
    name: test-container
    volumeMounts:
    - mountPath: /usr/share/nginx/html
      name: storage1
  volumes:
  - name: storage1
    nfs:
    persistentVolumeClaim:
      claimName: pvc1
[root@server1 volumes]# kubectl create -f pod3.yaml 
pod/mypod created
[root@server1 volumes]# kubectl get pod -o wide
NAME      READY   STATUS        RESTARTS   AGE   IP            NODE      NOMINATED NODE   READINESS GATES
mypod     1/1     Running       0          27s   10.244.2.68   server3   <none>           <none>
```

挂载后直接访问其虚拟地址：

```java
[root@server1 volumes]# curl 10.244.2.68
redhat
```

依然可以访问到之前写入的文件，这就是持久卷pv的作用。

但是当我们把pod 和 pvc全部删除后，nfs服务器中的文件也就删除了：

```java
[root@server1 volumes]# kubectl delete -f pvc2.yaml 
persistentvolumeclaim "pvc1" deleted
[root@server1 volumes]# kubectl delete -f pod3.yaml 
pod "mypod" deleted
[root@server1 volumes]# ls /nfs/
[root@server1 volumes]# 
```

此时pv恢复成了Available可用状态：

```java
[root@server1 volumes]# kubectl get pv
NAME   CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS      CLAIM   STORAGECLASS   REASON   AGE
pv1    500Mi      RWO            Recycle          Available           nfs        
```
