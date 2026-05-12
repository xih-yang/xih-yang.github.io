# 21、Kubernetes - 实战：Kubernetes资源管理PV&amp;PVC
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/8/21.html
- 分类：容器服务
- 分组：教程目录
kubernetes支持持久卷的存储插件：

[https://kubernetes.io/docs/concepts/storage/persistent-volumes/](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)

**PersistenVolume（PV）** ：对存储资源创建和使用的抽象，使得存储作为集群中的资源管理，分为有静态与动态。（可以连接：NFS，CEPG/GFS、Ceph）

**PersistentVolumeClaim（PVC）** ：让用户不需要关心具体的Volume实现细节

- PV：提供者、提供存储容量,由k8s配置的存储，PV同样是集群的一类资源，
- PVC：消费者、消费容量

注：PV与PVC成绑定关系。（容器应用-->卷需求模板-->数据卷定义）

## 一、 Kubernetes静态PV使用

kubernetes支持持久卷的存储插件：

[https://kubernetes.io/docs/concepts/storage/persistent-volumes/](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)

- 缺点：手动创建pv比较繁琐、不适合大工程
- 优点：小规模使用方便灵活

### 1、创建pvc yaml文件

```java
vim pvc.yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx6
spec:
  containers:
  - name: nginx6
    image: nginx
    挂在点
    volumeMounts:
    - name: wwwroot
      mountPath: /usr/share/nginx/html
    ports:
    - containerPort: 80
  挂载来源
  volumes:
  - name: wwwroot
    定义PVC
    persistentVolumeClaim:
      定义PVC名称
      claimName: my-pvc
---
apiVersion: v1
# 使用PVC类型
kind: PersistentVolumeClaim
metadata:
  与容器应用PVC相同
  name: my-pvc
spec:
  定义读写权限
  accessModes:
    - ReadWriteMany
  请求资源
  resources:
    requests:
      存储空间 5G
      storage: 5Gi
```

### 2、创建pv yaml文件

```java
vim pv.yaml
apiVersion: v1
# PV类型
kind: PersistentVolume
metadata:
  PV名称与PVC相同
  name: my-pv
spec:
  定义容量
  capacity:
    storage: 5Gi
  读写权限
  accessModes:
    - ReadWriteMany
  nfs分配网络存储
  nfs:
    path: /data/nfs
    server: 192.168.1.115
```

### 3、执行创建pv容器

```java
kubectl apply -f pv.yaml
```

### 4、查看创建pv

```java
kubectl get pv
NAME CAPACITY ACCESS MODES RECLAIM POLICY STATUS CLAIM STORAGECLASS REASON AGE
# RWX：读写模式、Available：为可用状态
my-pv 5Gi RWX Retain Available 23s
```

### 5、创建pvc容器

```java
kubectl apply -f pvc.yaml
```

### 6、查看pvc创建容器

```java
kubectl get pod
NAME READY STATUS RESTARTS AGE
nginx6 1/1 Running 0 20s
```

### 7、查看pv与pvc状态

```java
kubectl get pv,pvc
NAME CAPACITY ACCESS MODES RECLAIM POLICY STATUS CLAIM STORAGECLASS REASON AGE
# Bound：已经使用以成绑定装填
persistentvolume/my-pv 5Gi RWX Retain Bound default/my-pvc 3m44s
NAME STATUS VOLUME CAPACITY ACCESS MODES STORAGECLASS AGE
# 以绑定到pv
persistentvolumeclaim/my-pvc Bound my-pv 5Gi RWX 78s
```

### 8、nfs共享目录下创建一个index.html

```java
echo "<h1>xxxxxxxxx</h1>" > /data/nfs/index.html
```

### 9、进入容器测试

```java
kubectl exec -it nginx6 bash
ls /usr/share/nginx/html
index.html
```

### NFS类型PV模板

```java
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv0001
spec:
  capacity:        PV容量
    storage: 5Gi
  volumeMode: Filesystem    挂载的类型，Filesystem\block
  accessModes:    PV访问模式
    - ReadWriteOnce    可以被单节点读写的模式挂载
  persistentVolumeReclaimPolicy: Recycle    回收策略
  storageClassName: slow
  mountOptions:
    - hard
    - nfsvers=4.1
  nfs:
    path: /tmp
    server: 172.17.0.2
```

persistenVolumeReclaimPolicy: Recycle: 回收/Retain: 保留/Delete删除（pvc删除pv也会删除，动态存储的默认方式）

- ReadWriteOnce # 可以被单节点读写的模式挂载
- ReadWriteMany # 可以被多个点读写的模式挂载
- ReadOnlyOnce # 可以多个节点只读的模式挂载

PV的状态：

- Availabe：空闲PV，没有被任何PVC绑定
- Bond：已被PVC绑定
- Released：PVC被删除，但是资源未被重新使用
- Failed：自动回收失败

### PVC模板

```java
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: myclaim
spec:
  accessModes:
    - ReadWriteOnce
  volumeMode: Filesystem
  resources:
    requests:
      storage: 8Gi
  storageClassName: slow
  selector:   选择和标签匹配的PVC
    matchLabels:
      release: "stable"
    matchExpressions:
      - {key: environment, operator: In, values: [dev]}
```

### 创建POD挂载PVC

```java
apiVersion: v1
kind: Pod
metadata:
  name: mypod
spec:
  containers:
    - name: myfrontend
      image: nginx
      volumeMounts:
      - mountPath: "/var/www/html"
        name: mypd
  volumes:
    - name: mypd
      persistentVolumeClaim:
        claimName: myclaim
```

**很多情况下：（创建PVC之后，一直绑定不上PV［Pending状态］）**

**1、** PVC的空间申请大小大于PV的大小；

**2、** PVC的StorageClassName没有和PV一致；

**3、** PVC的accessMode和PV的不一致；

**创建挂载了PVC的Pod之后，一直处于Pending状态：**

**1、** PVC没有创建成功，或者被创；

**2、** PVC和Pod不在同一个Namespace；

**删除PVC后---->k8s会创建一个用于回收的Pod---->根据PV的回收策略进行PV的回收---->回收完以后PV的状态会变成可绑定的状态也就是空闲状态---->其他Pending状态的PVC如果匹配到了这个PV，他就能和这个PV进行绑定。**

## 二、Kubernetes 动态PV使用

Kubernetes支持动态供给的存储插件：

[https://kubernetes.io/docs/concepts/storage/storage-classes/](https://kubernetes.io/docs/concepts/storage/storage-classes/)

- Dynamic Provisioning机制工作的核心在于StorageClass的API对象。
- StorageClass声明存储插件，用于自动创建PV

## 创建动态PVStorageClass

### 1、创建storageclass相关文件

#### 1.1、vim storageclass-nfs.yaml：标识插件创建storageclass名称

```java
apiVersion: storage.k8s.io/v1beta1
kind: StorageClass
metadata:
  StorageClass名称
  name: managed-nfs-storage
# 默认不支持nfs存储，添加支持web插件标识
provisioner: fuseim.pri/ifs
```

#### 1.2、vim deployment-nfs.yaml：创建nfs相关存储指定服务名称

```java
apiVersion: apps/v1beta1
kind: Deployment
metadata:
  name: nfs-client-provisioner
spec:
  replicas: 1
  strategy:
    type: Recreate
  template:
    metadata:
      labels:
        app: nfs-client-provisioner
    spec:
      imagePullSecrets:
        - name: registry-pull-secret
      绑定角色定义的名称
      serviceAccount: nfs-client-provisioner
      containers:
        镜像拉取
        - name: nfs-client-provisioner
          image: lizhenliang/nfs-client-provisioner:v2.0.0
          自定义变量格式处理
          volumeMounts:
            - name: nfs-client-root
              mountPath: /persistentvolumes
          env:
            - name: PROVISIONER_NAME
              指定标识插件的值
              value: fuseim.pri/ifs
            - name: NFS_SERVER
              nfs地址
              value: 192.168.1.115
            - name: NFS_PATH
              挂在路径
              value: /data/nfs
      volumes:
        - name: nfs-client-root
          nfs:
            nfs地址
            server: 192.168.1.115
            共享路径
            path: /data/nfs
```

#### 1.3、vim rbac.yaml：创建rbac授权apiserver

```java
apiVersion: v1
kind: ServiceAccount
metadata:
  name: nfs-client-provisioner
---
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  name: nfs-client-provisioner-runner
# 角色中可以访问的权限
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
    verbs: ["list", "watch", "create", "update", "patch"]
---
# 角色绑定
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  name: run-nfs-client-provisioner
subjects:
  绑定角色 ServiceAccount
  - kind: ServiceAccount
    name: nfs-client-provisioner
    namespace: default
roleRef:
  kind: ClusterRole
  name: nfs-client-provisioner-runner
  apiGroup: rbac.authorization.k8s.io
```

### 2、创建文件

```java
kubectl apply -f storageclass-nfs.yaml
kubectl apply -f rbac.yaml
kubectl apply -f deployment-nfs.yaml
```

### 3、查看创建的storageclass

```java
kubectl get storageclass
NAME PROVISIONER AGE
managed-nfs-storage fuseim.pri/ifs 57s
```

### 4、查看创建的nfs容器

```java
kubectl get pods
NAME READY STATUS RESTARTS AGE
nfs-client-provisioner-565b4456f6-v9b97 1/1 Running 0 67s
```

## 使用动态 PV StorageClass 案例一：部署mysql

### 1、创建yaml配置文件。vim mysql.yaml

```java
apiVersion: v1
kind: Service
metadata:
  name: mysql
spec:
  ports:
  - port: 3306
    name: mysql
  创建service为无头服务，标识容器
  clusterIP: None
  selector:
    app: mysql-public
---
apiVersion: apps/v1beta1
kind: StatefulSet
# 名称
metadata:
  name: db
spec:
  指定service名称
  serviceName: "mysql"
  标签选择器
  template:
    metadata:
      labels:
        app: mysql-public
    spec:
      镜像容器编辑
      containers:
      - name: mysql
        image: mysql:5.7
        env:
        创建数据库用户密码
        - name: MYSQL_ROOT_PASSWORD
          value: "123456"
        创建数据库
        - name: MYSQL_DATABASE
          value: test
        启用端口
        ports:
        - containerPort: 3306
        数据卷
        volumeMounts:
        挂在容器目录
        - mountPath: "/var/lib/mysql"
          使用来源
          name: mysql-data
      使用数据卷来源
      volumes:
      数据卷名称
      - name: mysql-data
        指定数据卷动态供给
        persistentVolumeClaim:
          pvc动态供给名称
          claimName: mysql-pvc
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  pvc名称
  name: mysql-pvc
spec:
  读写权限
  accessModes:
    - ReadWriteMany
  使用的存储类
  storageClassName: managed-nfs-storage
  定义容量
  resources:
    requests:
      storage: 5Gi
```

## 2、创建容器

```java
kubectl apply -f mysql.yaml
```

## 3、查看持久卷

```java
kubectl get PersistentVolumeClaim
NAME STATUS VOLUME CAPACITY ACCESS MODES STORAGECLASS AGE
mysql-public-mysql-public-0 Bound default-mysql-public-mysql-public-0-pvc-2b4979b7-c89a-11e9-8b0e-000c29400317 2Gi RWO managed-nfs-storage 39m
mysql-pvc Bound default-mysql-pvc-pvc-b8584af2-c89d-11e9-9db0-000c292e28d6 5Gi RWX managed-nfs-storage 14m
```

## 使用动态 PV StorageClass 案例二

### 1、创建文件

```java
vim sts.yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx
  labels:
    app: nginx
spec:
  ports:
  - port: 80
    name: web
  clusterIP: None
  selector:
    app: nginx
---
apiVersion: apps/v1beta1
kind: StatefulSet
metadata:
  name: nginx-statefulset
  namespace: default
spec:
  serviceName: nginx
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:latest
        ports:
        - containerPort: 80
          name: web
        volumeMounts:
        - name: www
          mountPath: /usr/share/nginx/html
  volumeClaimTemplates:
  - metadata:
      name: www
    spec:
      accessModes: [ "ReadWriteOnce" ]
      storageClassName: "managed-nfs-storage"
      resources:
        requests:
          storage: 1Gi
```

### 2、创建容器

```java
kubectl create -f sts.yaml
```

### 3、查看pod

```java
kubectl get pods
NAME READY STATUS RESTARTS AGE
nginx-statefulset-0 1/1 Running 0 3m21s
nginx-statefulset-1 1/1 Running 0 3m16s
nginx-statefulset-2 1/1 Running 0 3m11s
```

### 4、查看动态pv，pvc存储kubectl get pv,pvc

```java
kubectl get pv,pvc
NAME CAPACITY ACCESS MODES RECLAIM POLICY STATUS CLAIM STORAGECLASS REASON AGE
persistentvolume/default-mysql-public-mysql-public-0-pvc-2b4979b7-c89a-11e9-8b0e-000c29400317 2Gi RWO Delete Bound default/mysql-public-mysql-public-0 managed-nfs-storage 63m
persistentvolume/default-www-nginx-statefulset-0-pvc-8063e4f9-c8a1-11e9-8b0e-000c29400317 1Gi RWO Delete Bound default/www-nginx-statefulset-0       managed-nfs-storage 11m
persistentvolume/default-www-nginx-statefulset-1-pvc-836c1466-c8a1-11e9-8b0e-000c29400317 1Gi RWO Delete Bound default/www-nginx-statefulset-1 managed-nfs-storage 11m
persistentvolume/default-www-nginx-statefulset-2-pvc-868a4a51-c8a1-11e9-8b0e-000c29400317 1Gi RWO Delete Bound default/www-nginx-statefulset-2 managed-nfs-storage 11m
persistentvolume/my-pv 5Gi RWX Retain Bound default/my-pvc 133m
NAME STATUS VOLUME CAPACITY ACCESS MODES STORAGECLASS AGE
persistentvolumeclaim/my-pvc Bound my-pv 5Gi RWX 133m
persistentvolumeclaim/mysql-public-mysql-public-0 Bound default-mysql-public-mysql-public-0-pvc-2b4979b7-c89a-11e9-8b0e-000c29400317 2Gi RWO managed-nfs-storage 63m
persistentvolumeclaim/www-nginx-statefulset-0 Bound default-www-nginx-statefulset-0-pvc-8063e4f9-c8a1-11e9-8b0e-000c29400317 1Gi RWO managed-nfs-storage 11m
persistentvolumeclaim/www-nginx-statefulset-1 Bound default-www-nginx-statefulset-1-pvc-836c1466-c8a1-11e9-8b0e-000c29400317 1Gi RWO managed-nfs-storage 11m
persistentvolumeclaim/www-nginx-statefulset-2 Bound default-www-nginx-statefulset-2-pvc-868a4a51-c8a1-11e9-8b0e-000c29400317 1Gi RWO managed-nfs-storage 11m
```

### 5、nfs服务器会自动创建pv数据

```java
[root@ddkk.com nfs]# ls
default-www-nginx-statefulset-0-pvc-8063e4f9-c8a1-11e9-8b0e-000c29400317
default-www-nginx-statefulset-1-pvc-836c1466-c8a1-11e9-8b0e-000c29400317
default-www-nginx-statefulset-2-pvc-868a4a51-c8a1-11e9-8b0e-000c29400317
```
