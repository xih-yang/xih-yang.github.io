# 17、Kubernetes - 实战：持久化存储PV、PVC和StatefulSet介绍及使用
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/6/17.html
- 分类：容器服务
- 分组：教程目录
## PV、PVC简介

### PersistentVolume（PV）

是由管理员设置的存储，它是集群的一部分，就像节点是集群中的资源一样，PV也是集群中的资源、PV是Volume之类的卷插件，但具有独立于使用PV的Pod的生命周期，此API对象包含存储实现的细节，即NFS、iSCSI或特定于云供应商的存储系统

### PersistentVolumeClaim（PVC）

是用户存储的请求，它与Pod相似。Pod消耗节点资源，PVC消耗PV资源。Pod可以请求特定级别的资源(CPU和内存)。PVC可以请求特定pv的大小和访问模式（例如，可以以读/写一次或只读多次模式挂载）

### 静态PV

集群管理员呢创建一些PV，他们带有可供集群用户使用的实际存储细节。他们存在与Kubernetes API中，可用于消费。

### PV与PVC的工作流程

**1、** 首先将不同规格的存储(例如NFS存储，有5GB、10GB等)创建为PV；

**2、** 用户再将需要用到的存储的条件创建为PVC，PVC会在PV资源中寻找最匹配用户需求的PV；

**3、** 匹配到最优PV后，PVC与PV进行绑定，最后挂载到对应Pod中；

### 持久化卷声明的保护

PVC保护的目的是确保由Pod正在使用的PVC不会从系统移除，因为如果被移除的话可能会导致数据丢失

当启用PVC保护alpha功能时，如果用户删除一个Pod正在使用的PVC，则该PVC不会被立即删除。PVC的删除将被推迟，知道PVC不再被任何Pod使用

### PV访问模式

PersistentVolume可以以资源提供者支持的任何方式挂载到主机上。如下表所示，供应商具有不同的功能，每个PV的访问模式都将被设置为该卷支持的特定模式，例如，NFS可以支持多个读/写客户端，但特定的PV可能以只读方式导出到服务器上。每个PV都有一套自己的用来描述特定功能的访问模式

- ReadWriteOnce——该卷可以被单个节点以读/写模式挂载
- ReadOnlyMany——该卷可以被多个节点以只读模式挂载
- ReadWriteMany——该卷可以被多个节点以读/写模式挂载

在命令行中，访问模式缩写为：

- RWO - ReadWriteOnce
- ROX - ReadOnlyMany
- RWX - ReadWriteMany

> 一个pv卷一次只能使用一种访问模式挂载，即使它支持很多访问模式。

Volume插件
ReadWriteOnce
ReadOnlyMany
ReadWriteMany

AWSElasticBlockStoreAWSElasticBlockStore
√
-
-

AzureFile
√
√
√

AzureDisk
√
-
-

cephFS
√
√
√

FlexVolume
√
-
-

Flocker
√
√
-

GCEPersistentDisk
√
√
-

Glusterfs
√
-
-

HostPath
√
-
√

NFS
√
√
√

### 回收策略

- Retain（保留）——手动回收
- Recycle（回收）——基本擦除（rm -rf /thevolume/*）
- Delete（删除）——关联的存储资产将被删除

当前只有HostPath和NFS支持回收策略。AWS EBS、GCE PD等支持删除策略

### 状态

卷可以处于以下某种状态：

- Available(可用) —— 一块空闲资源没有被任何声明绑定
- Bound(已绑定) —— 卷已经被声明绑定
- Released(已释放) —— 声明被删除，但是资源还没有被集群声明
- Failed(失败) —— 该卷的自动回收失败

命令行会显示绑定到PV的PVC名称

### 持久化演示说明 —— NFS

### 1、安装NFS

```java
## 安装nfs，服务器IP地址为：192.168.152.252
yum -y install  nfs-utils rpcbind
## 配置nfs配置文件，设置可连接主机及权限
vim /etc/exports
...
/alibaba  *(rw,no_root_squash,no_all_squash,sync)
<目录路径> <可连接ip，*代表全部> <目录及文件权限>
... 
## 创建共享目录，及设置目录权限
mkdir /alibaba
chmod 777 -R /alibaba
chown nfsnobody /alibaba/
## 启动nfs服务及rpcbind服务
systemctl start nfs-server.service rpcbind
### 进入客户机，测试能否正常访问，注意每个节点都要测试，保证可挂载
## 客户机安装nfs客户端及rpcbind
yum -y install  nfs-utils rpcbind
## 创建挂载目录及挂载
mkdir /usr/local/rds
mount -t nfs 192.168.152.252:/alibaba /usr/local/rds/
[root@Centos8 rds]# df -h | grep alibaba 
192.168.152.252:/alibaba   17G  6.9G   11G   41% /usr/local/rds
## 进入目录，测试读写是否正常
cd /usr/local/rds/
vim test.txt
......
```

### 2、创建PV（Master节点：192.168.152.53）

vimpv.yaml

```java
apiVersion: v1
kind: PersistentVolume
metadata:
  name: nfspv1
  labels:
      type: web
spec:
  capacity:   容量
    storage: 1Gi存储
  accessModes:类型
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Recycle回收策略
  storageClassName: nfs存储类别名称
  nfs:
    path: /alibaba
    server: 192.168.152.252
```

多创建几个pv，供后边的pvc使用

```java
## 首先在nfs中多创建几个文件系统
[root@kubenode2 ~]# cat /etc/exports
/alibaba1 *(rw,no_root_squash,no_all_squash,sync)
/alibaba2 *(rw,no_root_squash,no_all_squash,sync)
/alibaba3 *(rw,no_root_squash,no_all_squash,sync)
/alibaba4 *(rw,no_root_squash,no_all_squash,sync)
## 重启nfs server和rpcbind
systemctl restart rpcbind nfs-server.service
## 再次去客户端挂载测试读写
```

创建好的pv如下

```java
[root@Centos8 pv]# kubectl get pv 
NAME     CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS      CLAIM   STORAGECLASS   REASON   AGE
nfspv1   1Gi        RWO            Recycle          Available           nfs                     5s
nfspv2   10Gi       RWX            Retain           Available           cloud                   5s
nfspv3   5Gi        RWO            Recycle          Available           nfs                     5s
nfspv4   100Gi      RWX            Recycle          Available           nfs                     5s
### 创建不同的类别，存储大小，读写类型
### 我这里一共创建四个pv
```

### 3、创建PVC

vimpvc.yaml

```java
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc-nas
spec:
  accessModes:    选择类型
  - ReadWriteMany
  resources:   选择容量
    requests:
      storage: 10Gi
  storageClassName: cloud    选择存储类别
  selector:        选择标签可以更加准确的绑定想要绑定的pv
    matchLabels:
      type: web
```

```java
[root@Centos8 pv]# kubectl create -f pvc.yaml 
persistentvolumeclaim/pvc-nas created
[root@Centos8 pv]# kubectl get pvc 
NAME      STATUS   VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS   AGE
pvc-nas   Bound    nfspv2   10Gi       RWX            cloud          4s
[root@Centos8 pv]# kubectl get pv
NAME     CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS      CLAIM           STORAGECLASS   REASON   AGE
nfspv2   10Gi       RWX            Retain           Bound       default/pvc-nas   cloud   
```

创建Deployment

vimpvc-deployment.yaml

```java
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: pvc-deployment
  labels:
    app: nginx
spec:
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
        image: nginx:1.2.1
        imagePullPolicy: IfNotPresent
        ports:
        - name: web
          containerPort: 80
        volumeMounts:
        - name: pvc-nas    
          mountPath: /data    挂载路径
      volumes:
      - name: pvc-nas    定义的volume名字
        persistentVolumeClaim:    绑定pvc
          claimName: pvc-nas   pvc的名字
```

```java
[root@Centos8 pv]# kubectl create -f pvc-deployment.yaml 
deployment.extensions/pvc-deployment created
[root@Centos8 pv]# kubectl get pod 
NAME                             READY   STATUS    RESTARTS   AGE
pvc-deployment-db7b65ff8-6nz5g   1/1     Running   0          4s
pvc-deployment-db7b65ff8-9mthh   1/1     Running   0          4s
pvc-deployment-db7b65ff8-kgx5w   1/1     Running   0          4s
## 查看当前/data目录下文件
[root@Centos8 pv]# kubectl exec -it pvc-deployment-db7b65ff8-6nz5g -- ls /data
111
[root@Centos8 pv]# kubectl exec -it pvc-deployment-db7b65ff8-9mthh -- ls /data
111
[root@Centos8 pv]# kubectl exec -it pvc-deployment-db7b65ff8-kgx5w -- ls /data
111
## 向/data中创建文件
[root@Centos8 pv]# kubectl exec -it pvc-deployment-db7b65ff8-kgx5w -- touch /data/index.html 
## 再次查看，测试文件nas的共享存储
[root@Centos8 pv]# kubectl exec -it pvc-deployment-db7b65ff8-kgx5w -- ls /data
111  index.html
[root@Centos8 pv]# kubectl exec -it pvc-deployment-db7b65ff8-9mthh -- ls /data
111  index.html
[root@Centos8 pv]# kubectl exec -it pvc-deployment-db7b65ff8-6nz5g -- ls /data
111  index.html
```

```java
## 删除Pod，检验数据的持久性 [root@Centos8 pv]# kubectl delete pod pvc-deployment-db7b65ff8-6nz5g pod "pvc-deployment-db7b65ff8-6nz5g" deleted [root@Centos8 pv]# kubectl get pod NAME READY STATUS RESTARTS AGE pvc-deployment-db7b65ff8-9mthh 1/1 Running 0 3m11s pvc-deployment-db7b65ff8-bnvw7 1/1 Running 0 47s pvc-deployment-db7b65ff8-kgx5w 1/1 Running 0 3m11s 再次查看，依旧是这两个文件 [root@Centos8 pv]# kubectl exec -it pvc-deployment-db7b65ff8-bnvw7 -- ls /data 111 index.html
```

> aliyunURL：https://help.aliyun.com/document_detail/100684.html?spm=a2c4g.11186623.6.1080.1668631aCuHGi2

### 4、创建StatefulSet

vimStatefulSet.yaml

```java
apiVersion: v1
kind: Service
metadata:
  name: pvc-svc
  namespace: default
  labels:
    app: nginx
spec:
  clusterIP: None
  ports:
  - name: web
    port: 80
  selector:
    app: nginx
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: web
  namespace: default
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  serviceName: "pvc-svc"
  template:
    metadata:
      labels:
        app: nginx
    spec:
      dnsPolicy: ClusterFirstWithHostNet使pod使用k8s的dns而不是宿主机dns
      containers:
      - name: nginx
        image: hub.vfancloud.com/test/myapp:v1
        imagePullPolicy: IfNotPresent
        ports:
        - name: web
          containerPort: 80
        volumeMounts:
        - name: www
          mountPath: /usr/share/nginx/html
  volumeClaimTemplates:
  - metadata:
      name: www
    spec:
      accessModes: [ "ReadWriteOnce" ]   指定pv的读写策略
      storageClassName: "nfs"   指定pv的存储类型
      resources:
        requests:
          storage: 1Gi   指定pv的存储大小
```

查看Pod、PV信息

```java
[root@Centos8 pv]# kubectl get pod 
NAME    READY   STATUS    RESTARTS   AGE
web-0   1/1     Running   0          2m32s
web-1   1/1     Running   0          2m30s
web-2   0/1     Pending   0          2m27s
### yaml文件中statefulSet指定副本数为3个，其中web-2一直处于pending状态
## 查看web-2描述，提示Pod没有可以绑定的pv
[root@Centos8 pv]# kubectl describe pod web-2
Events:
  Warning  FailedScheduling  66s (x3 over 3m47s)  default-scheduler  pod has unbound immediate PersistentVolumeClaims
##  再看PV的状态
### nfspv1和nfspv3的STATUS为Bound，已被绑定其他的均为Available可用状态
### 再来回顾一下上边yaml文件内容
### yaml中明确指出，accessModes必须为ReadWriteOnly，storageClassName必须为NFS，storage存储为1Gi，可见，第一个pod创建时直接绑定最合适nfspv1，第二个Pod创建时由于没有其他符合的nfs，所以绑定nfspv3，第三个Pod创建后，发现没有合适的pv了，所以一直保持pending状态
[root@Centos8 pv]# kubectl get pv 
NAME  CAPACITY ACCESS MODES RECLAIM POLICY STATUS  CLAIM         STORAGECLASS  
nfspv1   1Gi     RWO        Recycle      Bound     default/www-web-0     nfs
nfspv2   10Gi    RWX        Retain       Available                       cloud
nfspv3   5Gi     RWO        Recycle      Bound     default/www-web-1     nfs
nfspv4   100Gi   RWX        Recycle      Available                       nfs
```

测试访问Pod、NFS持久性（statefulSet特性）

```java
## 在web-0所绑定的nfs下创建index.html文件，内容如下
[root@kubenode2 alibaba1]# cat index.html 
Are you ok?
## 访问web-0的http服务
[root@Centos8 pv]# curl http://10.244.3.56
Are you ok?
## 在web-1所绑定的nfs下创建index.html文件，内容如下
[root@kubenode2 alibaba3]# cat index.html 
qbbbbbb
bbbbb
## 访问web-1的http服务
[root@Centos8 pv]# curl http://10.244.3.57
qbbbbbb
bbbbb
## 测试删除pod后，存储是否持久化
[root@Centos8 pv]# kubectl delete pod web-0
pod "web-0" deleted
[root@Centos8 pv]# kubectl get pod -o wide 
NAME    READY   STATUS    RESTARTS   AGE   IP     
web-0   1/1     Running   0          9s    10.244.3.58
## ip已经发生改变，再次测试访问http，数据未变化
[root@Centos8 pv]# curl http://10.244.3.58
Are you ok?
```

> aliyunURL：https://help.aliyun.com/document_detail/100013.html?spm=a2c4g.11186623.6.1084.562220d7kAeXTB

### 关于StatefulSet

**1、** 匹配Podname（网络标识）的模式为：(statefulset名称)-符号，比如上面的web-0，web-1；

**2、** StatefulSet为每个Pod副本创建了一个DNS域名，域名格式为：$(podname).(headlessservername)，也就意味着服务间是通过Pod域名来通信而非PodIP，因为Pod在Node发生故障时，会将Pod漂移到其他node节点，PodIP会发生改变，但是Pod域名不会变化；

**3、** StatefulSet使用Headless服务来控制Pod的域名，这个域名的FQDN为：(servicename).(namespace).svc.cluster.local，其中，"cluster.local"指的是集群的域名；

**4、** 根据VolumeClaimTemplates，为每个Pod创建一个pvc，pvc命名规则匹配模式：([volumeClaimTemplate.name](http://volumeclaimtemplate.name/))-([pod.name](http://pod.name/))，比如www-web-0；

**5、** 删除Pod不会删除其pvc，手动删除pvc将自动释放pv；

### 验证DNS解析

```java
## 当前pod
[root@Centos8 pv]# kubectl get pod 
NAME                             READY   STATUS    RESTARTS   AGE
ingress-http2-84b79f86c8-l6w7z   1/1     Running   0          8m33s
ingress-http2-84b79f86c8-sgsch   1/1     Running   0          8m33s
ingress-http2-84b79f86c8-xm7tj   1/1     Running   0          8m33s
web-0                            1/1     Running   0          24m
web-1                            1/1     Running   0          18m
web-2                            0/1     Pending   0          20m
## 当前svc
[root@Centos8 pv]# kubectl get svc 
NAME           TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
ingress-svc2   ClusterIP   10.105.70.203   <none>        8080/TCP   9m4s
kubernetes     ClusterIP   10.96.0.1       <none>        443/TCP    84d
pvc-svc        ClusterIP   None            <none>        80/TCP     25m
## 访问statefulSet的pod，使用域名$(podname).(headless server name)的方式
[root@Centos8 pv]# kubectl exec -it web-0 -- nslookup web-1.pvc-svc
Name:      web-1.pvc-svc
Address 1: 10.244.3.90
或者
[root@Centos8 pv]# kubectl exec -it web-0 -- nslookup web-1.pvc-svc.default.svc.cluster.local.
Name:      web-1.pvc-svc.default.svc.cluster.local.
Address 1: 10.244.3.90
## 测试其他svc的Pod是否可以通过$(podname).(headless server name)的方式访问
[root@Centos8 pv]# kubectl exec -it ingress-http2-84b79f86c8-sgsch -- nslookup web-1.pvc-svc
Name:      web-1.pvc-svc
Address 1: 10.244.3.90
或者
[root@Centos8 pv]# kubectl exec -it ingress-http2-84b79f86c8-sgsch -- nslookup web-0.pvc-svc.default.svc.cluster.local.
Name:      web-0.pvc-svc.default.svc.cluster.local.
Address 1: 10.244.3.88
## 此功能是通过无头(headless)服务进行绑定的，最终规则如下
[root@Centos8 pv]# dig -t -A pvc-svc.default.svc.cluster.local. @10.244.0.81
;; Warning, ignoring invalid type -A
; <<>> DiG 9.11.4-P2-RedHat-9.11.4-16.P2.el8 <<>> -t -A pvc-svc.default.svc.cluster.local. @10.244.0.81
;; global options: +cmd
;; Got answer:
;; WARNING: .local is reserved for Multicast DNS
;; You are currently testing what happens when an mDNS query is leaked to DNS
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 14325
;; flags: qr rd; QUERY: 1, ANSWER: 2, AUTHORITY: 0, ADDITIONAL: 1
;; WARNING: recursion requested but not available
;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 4096
; COOKIE: 538aadec9b559ba0 (echoed)
;; QUESTION SECTION:
;pvc-svc.default.svc.cluster.local. IN    A
;; ANSWER SECTION:
pvc-svc.default.svc.cluster.local. 17 IN A    10.244.3.90
pvc-svc.default.svc.cluster.local. 17 IN A    10.244.3.88
;; Query time: 0 msec
;; SERVER: 10.244.0.81#53(10.244.0.81)
;; WHEN: 日 7月 05 11:41:24 CST 2020
;; MSG SIZE  rcvd: 172
```

### statefulSet的启停顺序

- 有序部署：部署StatefulSet时，如果有多个Pod副本，它们会被顺序的创建（从0到N-1），并且，在下一个Pod运行之前，之前的Pod必须是Ready或者Running的状态
- 有序删除：当Pod被删除时，他们被终止的顺序是从N-1到0
- 有序扩展：当Pod执行扩展操作时，与部署一样，他们之前的Pod必须是Running和Ready状态

### statefulSet使用场景

- 稳定的持久化存储，即Pod重新调度后还是能访问相同的持久化数据，基于PVC来实现
- 稳定的网络表示符，即Pod重新调度后其PodNname与HostName不变
- 有序部署，有序扩展，基于init Container来实现
- 有序收缩

### 删除持久化存储pv、pvc

```java
## 首先删除pvc的yaml文件，svc和statefulSet就会被删除
[root@Centos8 pv]# kubectl delete -f StatefulSet.yaml 
service "pvc-svc" deleted
statefulset.apps "web" deleted
## 删除pvc
[root@Centos8 pv]# kubectl delete pvc --all
persistentvolumeclaim "www-web-0" deleted
persistentvolumeclaim "www-web-1" deleted
persistentvolumeclaim "www-web-2" deleted
## 确认
[root@Centos8 pv]# kubectl get pvc
No resources found.
[root@Centos8 pv]# kubectl get statefulset
No resources found.
## 查看pv，状态已经变为Released，虽然已经解除绑定，但还没有完全回收
[root@Centos8 pv]# kubectl get pv
NAME     CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS      CLAIM               STORAGECLASS   REASON   AGE
nfspv1   1Gi        RWO            Recycle          Released    default/www-web-0   nfs                     6d14h
nfspv2   10Gi       RWX            Retain           Available                       cloud                   6d14h
nfspv3   5Gi        RWO            Recycle          Released      default/www-web-1   nfs                     6d14h
nfspv4   100Gi      RWX            Recycle          Available                       nfs                     6d14h
## 手动回收
[root@Centos8 pv]# kubectl edit pv nfspv3
把以下内容删除，然后保存
  claimRef:
    apiVersion: v1
    kind: PersistentVolumeClaim
    name: www-web-1
    namespace: default
    resourceVersion: "323988"
    uid: 32f75ce6-5462-42c1-9913-888c803b0bf4
## 再次查看，已经完全释放
[root@Centos8 pv]# kubectl get pv
NAME     CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS      CLAIM   STORAGECLASS   REASON   AGE
nfspv1   1Gi        RWO            Recycle          Available           nfs                     6d14h
nfspv2   10Gi       RWX            Retain           Available           cloud                   6d14h
nfspv3   5Gi        RWO            Recycle          Available           nfs                     6d14h
nfspv4   100Gi      RWX            Recycle          Available           nfs                     6d14h
```
