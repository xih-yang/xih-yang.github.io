# 12、Kubernetes - 实战：存储（Volume之动态pv）
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/5/12.html
- 分类：容器服务
- 分组：教程目录
## 一、StorageClass

简介及属性

StorageClass提供了一种描述存储类（class）的方法，不同的class可能会映射到不同的服务质量等级和备份策略或其他策略等。

每个StorageClass 都包含 provisioner、parameters 和 reclaimPolicy 字段， 这些字段会在StorageClass需要动态分配 PersistentVolume 时会使用到。

**StorageClass的属性**

Provisioner（存储分配器）：用来决定使用哪个卷插件分配PV，该字段必须指定。可以指定内部分配器，也可以指定外部分配器。外部分配器的代码地址为：kubernetes-incubator/external-storage，其中包括NFS和Ceph等。

Reclaim Policy（回收策略）：通过reclaimPolicy字段指定创建的Persistent Volume的回收策略，回收策略包括：Delete 或者 Retain，没有指定默认为Delete。

更多属性查看：https://kubernetes.io/zh/docs/concepts/storage/storage-classes/

NFSClient Provisioner

NFSClient Provisioner是一个automatic provisioner，使用NFS作为存储，自动创建PV和对应的PVC，本身不提供NFS存储，需要外部先有一套NFS存储服务。

PV以namespace−namespace−{pvcName}-${pvName}的命名格式提供（在NFS服务器上）

PV回收的时候以 archieved-namespace−namespace−{pvcName}-${pvName} 的命名格式（在NFS服务器上）

## 二、NFS动态分配PV示例

实验准备

首先需要保证nfs服务器的正常运行：

```java
[root@server1 ~]# showmount -e
Export list for server1:
/nfs *
```

## 授权配置

接下来进行基于角色的认证授权的配置：

```java
[root@server1 pv]# mkdir nfsclass
[root@server1 pv]# cd nfsclass/
[root@server1 nfsclass]# vim rbac.yaml 
[root@server1 nfsclass]# cat rbac.yaml 
apiVersion: v1
kind: ServiceAccount
metadata:
  name: nfs-client-provisioner
  replace with namespace where provisioner is deployed
  namespace: default
---
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: nfs-client-provisioner-runner
rules:
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
    namespace: default
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
  namespace: default
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
  namespace: default
subjects:
  - kind: ServiceAccount
    name: nfs-client-provisioner
    replace with namespace where provisioner is deployed
    namespace: default
roleRef:
  kind: Role
  name: leader-locking-nfs-client-provisioner
  apiGroup: rbac.authorization.k8s.io
```

## 部署NFS Client Provisioner

```java
[root@server1 nfsclass]# vim deployment.yaml 
[root@server1 nfsclass]# cat deployment.yaml 
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nfs-client-provisioner
  labels:
    app: nfs-client-provisioner
  replace with namespace where provisioner is deployed
  namespace: default				#指定为默认的namespace
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
          image: nfs-client-provisioner:latest			#镜像名称
          volumeMounts:
            - name: nfs-client-root
              mountPath: /persistentvolumes
          env:
            - name: PROVISIONER_NAME
              value: westos.org/nfs			#分配器的名称
            - name: NFS_SERVER
              value: 172.25.63.1			#NFS服务器地址
            - name: NFS_PATH
              value: /nfs					#nfs的输出路径
      volumes:
        - name: nfs-client-root				#nfs卷
          nfs:
            server: 172.25.63.1
            path: /nfs
```

其中需要的镜像nfs-client-provisioner:latest，可以先拉取下来然后上传到私有仓库，这样在部署的时候比较快。

## 创建 NFS SotageClass

```java
[root@server1 nfsclass]# vim class.yaml 
[root@server1 nfsclass]# cat class.yaml 
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: managed-nfs-storage			#SotageClass的名称
provisioner: westos.org/nfs			#分配器的名称
parameters:
  archiveOnDelete: "false"
```

其中：archiveOnDelete: "false"表示在删除时不会对数据进行打包，当设置为true时表示删除时会对数据进行打包。

运行部署文件

运行之前先将环境中的所有pv和pvc全部删除。

```java
[root@server1 nfsclass]# kubectl get pv
No resources found in default namespace.
[root@server1 nfsclass]# kubectl get pvc
No resources found in default namespace.
```

然后可以使用以下命令直接运行通目录下的所有部署文件(rbac.yaml,deployment.yaml,class.yaml)：

```java
[root@server1 nfsclass]# kubectl apply -f .
```

查看状态：

```java
[root@server1 nfsclass]# kubectl get all
NAME                                          READY   STATUS    RESTARTS   AGE
pod/nfs-client-provisioner-6b66ddf664-zjvtv   1/1     Running   0          62s
NAME                 TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
service/kubernetes   ClusterIP   10.96.0.1       <none>        443/TCP   18d
service/myservice    ClusterIP   10.101.31.155   <none>        80/TCP    14d
NAME                                     READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/nfs-client-provisioner   1/1     1            1           63s
NAME                                                DESIRED   CURRENT   READY   AGE
replicaset.apps/nfs-client-provisioner-6b66ddf664   1         1         1       63s
```

此时并不会创建pv，但是会为我们创建一个sc（SotageClass）：

```java
[root@server1 nfsclass]# kubectl get pv
No resources found in default namespace.
[root@server1 nfsclass]# 
[root@server1 nfsclass]# kubectl get sc
NAME                  PROVISIONER      RECLAIMPOLICY   VOLUMEBINDINGMODE   ALLOWVOLUMEEXPANSION   AGE
managed-nfs-storage   westos.org/nfs   Delete          Immediate           false                  76s
```

创建测试pvc

```java
[root@server1 nfsclass]# vim pvc.yaml 
[root@server1 nfsclass]# cat pvc.yaml 
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: test-claim
  annotations:
    volume.beta.kubernetes.io/storage-class: "managed-nfs-storage"
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 100Mi
```

创建：

```java
[root@server1 nfsclass]# kubectl apply -f pvc.yaml 
persistentvolumeclaim/test-claim created
```

此时会为我们创建一个pv：

```java
[root@server1 nfsclass]# kubectl get pv
NAME                                       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM                STORAGECLASS          REASON   AGE
pvc-2a8ecd7a-a181-42dd-bae6-53ead083dcbc   100Mi      RWX            Delete           Bound    default/test-claim   managed-nfs-storage            7s
```

创建pvc后会在nfs服务器的共享目录中生成以namespace+pvcname+pvname命名的文件夹：

```java
[root@server1 nfsclass]# ls /nfs/
default-test-claim-pvc-2a8ecd7a-a181-42dd-bae6-53ead083dcbc
```

而当此时我们将pvc删除后，pv也会随之删除：

```java
[root@server1 nfsclass]# kubectl delete -f pvc.yaml 
persistentvolumeclaim "test-claim" deleted
[root@server1 nfsclass]# kubectl get pvc
No resources found in default namespace.
[root@server1 nfsclass]# 
[root@server1 nfsclass]# kubectl get pv
No resources found in default namespace.
```

接下来我们将删除打包策略设置为true：

```java
[root@server1 nfsclass]# vim class.yaml 
[root@server1 nfsclass]# cat class.yaml 
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: managed-nfs-storage
provisioner: westos.org/nfs
parameters:
  archiveOnDelete: "true"
```

运行：

```java
[root@server1 nfsclass]# kubectl delete -f class.yaml 
storageclass.storage.k8s.io "managed-nfs-storage" deleted
[root@server1 nfsclass]# kubectl apply -f class.yaml 
storageclass.storage.k8s.io/managed-nfs-storage created
[root@server1 nfsclass]# 
[root@server1 nfsclass]# kubectl get sc
NAME                  PROVISIONER      RECLAIMPOLICY   VOLUMEBINDINGMODE   ALLOWVOLUMEEXPANSION   AGE
managed-nfs-storage   westos.org/nfs   Delete          Immediate           false                  15s
```

再创建两个pvc：

```java
[root@server1 nfsclass]# vim pvc.yaml 
[root@server1 nfsclass]# cat pvc.yaml 
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: test-claim
  annotations:
    volume.beta.kubernetes.io/storage-class: "managed-nfs-storage"
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 100Mi
---
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: test-claim-2
  annotations:
    volume.beta.kubernetes.io/storage-class: "managed-nfs-storage"
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 200Mi
[root@server1 nfsclass]# 
[root@server1 nfsclass]# kubectl apply -f pvc.yaml 
```

查看pv状态：

```java
[root@server1 nfsclass]# kubectl get pv
NAME                                       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM                  STORAGECLASS          REASON   AGE
pvc-093922b7-048a-4c1f-97e9-d77afe0ec37b   200Mi      RWX            Delete           Bound    default/test-claim-2   managed-nfs-storage            12s
pvc-34761774-0a1f-4519-9d44-35c3736ce550   100Mi      RWX            Delete           Bound    default/test-claim     managed-nfs-storage            2m9s
```

删除这些pv后再查看nfs共享目录：

```java
[root@server1 nfsclass]# kubectl delete -f pvc.yaml 
persistentvolumeclaim "test-claim" deleted
persistentvolumeclaim "test-claim-2" deleted
[root@server1 nfsclass]# kubectl get pv
No resources found in default namespace.
[root@server1 nfsclass]# ls /nfs/
archived-default-test-claim-2-pvc-093922b7-048a-4c1f-97e9-d77afe0ec37b
archived-default-test-claim-pvc-34761774-0a1f-4519-9d44-35c3736ce550
```

可以看出数据被打包成 archived+ 原来名字的形式。

创建测试pod

创建测试pod并修改pvc：

```java
[root@server1 nfsclass]# vim pod.yaml
[root@server1 nfsclass]# cat pod.yaml 
kind: Pod
apiVersion: v1
metadata:
  name: test-pod
spec:
  containers:
  - name: test-pod
    image: nginx
    volumeMounts:
      - name: nfs-pvc
        mountPath: "/usr/share/nginx/html"
  volumes:
    - name: nfs-pvc
      persistentVolumeClaim:
        claimName: test-claim
[root@server1 nfsclass]# 
[root@server1 nfsclass]# vim pvc.yaml 
[root@server1 nfsclass]# cat pvc.yaml 
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: test-claim
  annotations:
    volume.beta.kubernetes.io/storage-class: "managed-nfs-storage"
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 100Mi
[root@server1 nfsclass]# 
[root@server1 nfsclass]# 
[root@server1 nfsclass]# kubectl apply -f pvc.yaml 
persistentvolumeclaim/test-claim created
[root@server1 nfsclass]# 
[root@server1 nfsclass]# kubectl apply -f pod.yaml 
pod/test-pod created
```

查看pod状态：

```java
[root@server1 nfsclass]# kubectl get pod -o wide
NAME                                      READY   STATUS    RESTARTS   AGE   IP            NODE      NOMINATED NODE   READINESS GATES
nfs-client-provisioner-6b66ddf664-zjvtv   1/1     Running   0          15m   10.244.1.81   server2   <none>           <none>
test-pod                                  1/1     Running   0          33s   10.244.2.70   server3   <none>           <none>
```

此时访问这个pod不能访问到，提示403 Forbidden：

现在需要生成默认发布页面，可以直接在nfs共享目录中直接写入：

```java
[root@server1 nfsclass]# ls /nfs/
default-test-claim-pvc-17f37558-e8da-4b92-9d11-3a0adab97d8b
[root@server1 nfsclass]# 
[root@server1 nfsclass]# echo redhat > /nfs/default-test-claim-pvc-17f37558-e8da-4b92-9d11-3a0adab97d8b/index.html
```

再进行访问测试就可以访问到页面了：

```java
[root@server1 nfsclass]# curl 10.244.2.70
redhat
```

查看pod挂载：

```java
[root@server1 nfsclass]# kubectl describe pod test-pod 
```

实验后删除：

```java
[root@server1 nfsclass]# kubectl delete -f pod.yaml 
[root@server1 nfsclass]# kubectl delete -f pvc.yaml 
```

## 三、默认 StorageClass

默认的StorageClass 将被用于动态的为没有特定 storage class 需求的 PersistentVolumeClaims 配置存储：（只能有一个默认StorageClass）

如果没有默认StorageClass，PVC 也没有指定storageClassName 的值，那么意味着它只能够跟 storageClassName 也是“”的 PV 进行绑定。

如上例中的pvc若没有指定分配器的名称则会一直处于准备状态：

```java
[root@server1 nfsclass]# vim pvc.yaml 
[root@server1 nfsclass]# cat pvc.yaml 
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: test-claim
#  annotations:
#    volume.beta.kubernetes.io/storage-class: "managed-nfs-storage"
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 100Mi
[root@server1 nfsclass]# kubectl get sc
NAME                  PROVISIONER      RECLAIMPOLICY   VOLUMEBINDINGMODE   ALLOWVOLUMEEXPANSION   AGE
managed-nfs-storage   westos.org/nfs   Delete          Immediate           false                  12m
[root@server1 nfsclass]# 
[root@server1 nfsclass]# kubectl apply -f pvc.yaml 
persistentvolumeclaim/test-claim created
[root@server1 nfsclass]# 
[root@server1 nfsclass]# kubectl get pvc
NAME         STATUS    VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS   AGE
test-claim   Pending                                                     10s
[root@server1 nfsclass]# kubectl get pvc
NAME         STATUS    VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS   AGE
test-claim   Pending                                                     12s
```

这种情况可以使用以下命令将之前创建的StorageClass设置为默认：

```java
[root@server1 nfsclass]# kubectl patch storageclass managed-nfs-storage -p '{"metadata": {"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}'
```

更改后再查看sc发现已经变成默认的sc：

之后再次运行pvc部署文件即可：

```java
[root@server1 nfsclass]# kubectl delete -f pvc.yaml 
persistentvolumeclaim "test-claim" deleted
[root@server1 nfsclass]# kubectl apply -f pvc.yaml 
persistentvolumeclaim/test-claim created
[root@server1 nfsclass]# 
[root@server1 nfsclass]# kubectl get pvc
NAME         STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS          AGE
test-claim   Bound    pvc-95e11d69-4199-43e3-9084-72e3ad0c36a9   100Mi      RWX            managed-nfs-storage   9s
```

可以看出pvc状态已经正常。
