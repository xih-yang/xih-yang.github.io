# 11、Kubernetes - 实战：Deployment、DaemonSet、Job、CronJob等各控制器介绍及演示
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/6/11.html
- 分类：容器服务
- 分组：教程目录
## 前文中也都已经提及过k8s都有哪些常用的控制器，本文对这些控制器进行细剖及演示一下

## RS与RC与Deployment关联

RC主要作用就是用来确保容器应用副本数保持用户的期望值数目，即如果有pod异常退出，则会自动再创建Pod，同理会把多出来的Pod删除掉

Kubernetes官方建议使用RS来代替RC进行部署，RS跟RC没有本质的差别，只是名字不同，并且RS支持selector

```java
vim rs.yaml
...
apiVersion: extensions/v1beta1
kind: ReplicaSet
metadata:
  name: frontend
spec:
  replicas: 3 副本数，对应下边的template
  selector: 选择(匹配)标签
    matchLabels:
      tier: frontend 匹配标签为tier: frontend的Pod
  template: 模板
    metadata:
      lables:标签
        tire: frontend
    spec:
      containers:
      - name: nginx
        image: hub.vfancloud.com/myapp/nginx:v1
        env:
        - name: GET_HOSTS_FROM
          value: dns
        ports:
        - containerPort: 80
...
[root@Centos8 k8sYaml]# kubectl apply -f rs.yaml 
replicaset.extensions/frontend created
[root@Centos8 k8sYaml]# kubectl get rs
NAME       DESIRED   CURRENT   READY   AGE
frontend   3         3         3       21s
[root@Centos8 k8sYaml]# kubectl get pod 
NAME             READY   STATUS    RESTARTS   AGE
frontend-6r2n9   1/1     Running   0          24s
frontend-9vrvv   1/1     Running   0          24s
frontend-vbt9c   1/1     Running   0          24s
[root@Centos8 k8sYaml]# kubectl delete pod frontend-6r2n9
pod "frontend-6r2n9" deleted
## 维持了原本的副本数目
[root@Centos8 k8sYaml]# kubectl get pod  
NAME             READY   STATUS    RESTARTS   AGE
frontend-9vrvv   1/1     Running   0          61s
frontend-vbt9c   1/1     Running   0          61s
frontend-zk7jn   1/1     Running   0          11s
## 删除RS，Pod也会随之删除
[root@Centos8 k8sYaml]# kubectl delete rs frontend
replicaset.extensions "frontend" deleted
[root@Centos8 k8sYaml]# kubectl get pod 
No resources found.
```

## Deployment

Deployment 为 Pod 和 ReplicaSet 提供了一个声名式的定义(declarative)方法，用来代替以前的ReplicationController 来方便的管理应用，典型的应用场景包括：

- 定义Deployment来创建Pod和ReplicaSet
- 滚动升级和回滚应用
- 扩容和缩容
- 暂停和继续Delpoyment

### 资源清单

```java
vim dm.yaml
...
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  relicas: 3
  template:  
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: hub.vfancloud.com/myapp/nginx:v1
        ports:
        - containerPort: 80
...
# --record 表示记录deployment Rollout的每一次变化
kubectl apply -f dm.yaml --record
deployment.extensions/nginx-deployment created
[root@Centos8 k8sYaml]# kubectl get deployment 
NAME               READY   UP-TO-DATE   AVAILABLE   AGE
nginx-deployment   3/3     3            3           53s
[root@Centos8 k8sYaml]# kubectl get pod 
NAME                                READY   STATUS    RESTARTS   AGE
nginx-deployment-66c8c6957b-bqxm6   1/1     Running   0          56s
nginx-deployment-66c8c6957b-rdfxj   1/1     Running   0          56s
nginx-deployment-66c8c6957b-tb8t4   1/1     Running   0          56s
```

### 扩容

```java
# 将副本数扩充为7个
[root@Centos8 k8sYaml]# kubectl scale deployment/nginx-deployment --replicas=7
deployment.extensions/nginx-deployment scaled
[root@Centos8 k8sYaml]# kubectl get pod
NAME                                READY   STATUS    RESTARTS   AGE
nginx-deployment-66c8c6957b-6d4qf   1/1     Running   0          13s
nginx-deployment-66c8c6957b-bqxm6   1/1     Running   0          2m48s
nginx-deployment-66c8c6957b-pjz9h   1/1     Running   0          13s
nginx-deployment-66c8c6957b-rdfxj   1/1     Running   0          2m48s
nginx-deployment-66c8c6957b-shn7b   1/1     Running   0          13s
nginx-deployment-66c8c6957b-tb8t4   1/1     Running   0          2m48s
nginx-deployment-66c8c6957b-ttzhc   1/1     Running   0          13s
```

### 如果集群支持horizontal pod autoscaling设置自动扩展

```java
# 根据cpu使用率来增加或减少模板数量
kubectl autoscale deployment nginx-deployment --min=10 --max=15 --cpu-percent=80
```

### 更新镜像也比较简单

```java
# 将container name=nginx 的容器镜像修改为nginx：1.2.1
kubectl set image deployment nginx-deployment nginx=nginx:1.2.1
deployment.extensions/nginx-deployment image updated
## 滚动升级中...
[root@Centos8 k8sYaml]# kubectl get pod 
NAME                                READY   STATUS              RESTARTS   AGE
nginx-deployment-54988485fb-5cfdd   0/1     ContainerCreating   0          9s
nginx-deployment-54988485fb-rgmp2   0/1     ContainerCreating   0          9s
nginx-deployment-66c8c6957b-6d4qf   1/1     Terminating         0          56m
nginx-deployment-66c8c6957b-bqxm6   1/1     Running             0          59m
nginx-deployment-66c8c6957b-pjz9h   1/1     Running             0          56m
nginx-deployment-66c8c6957b-rdfxj   1/1     Running             0          59m
nginx-deployment-66c8c6957b-shn7b   1/1     Running             0          56m
nginx-deployment-66c8c6957b-tb8t4   1/1     Running             0          59m
nginx-deployment-66c8c6957b-ttzhc   1/1     Running             0          56m
## 更新完毕
[root@Centos8 k8sYaml]# kubectl get pod 
NAME                                READY   STATUS    RESTARTS   AGE
nginx-deployment-54988485fb-2zksn   1/1     Running   0          100s
nginx-deployment-54988485fb-5cfdd   1/1     Running   0          116s
nginx-deployment-54988485fb-c6dpc   1/1     Running   0          106s
nginx-deployment-54988485fb-rgmp2   1/1     Running   0          116s
nginx-deployment-54988485fb-v24qq   1/1     Running   0          100s
nginx-deployment-54988485fb-x6q56   1/1     Running   0          31s
nginx-deployment-54988485fb-zxh27   1/1     Running   0          106s
[root@Centos8 k8sYaml]# curl 10.244.3.56 
<html>
<head>
<title>Welcome to nginx!</title>
</head>
<body bgcolor="white" text="black">
<center><h1>Welcome to nginx!</h1></center>
</body>
</html>
```

### 回滚

```java
# 回滚为上一个nginx-deployment版本
[root@Centos8 k8sYaml]# kubectl rollout undo deployment nginx-deployment 
deployment.extensions/nginx-deployment rolled back
## 回滚中...
[root@Centos8 k8sYaml]# kubectl get pod 
NAME                                READY   STATUS              RESTARTS   AGE
nginx-deployment-54988485fb-2zksn   1/1     Terminating         0          4m24s
nginx-deployment-54988485fb-5cfdd   1/1     Running             0          4m40s
nginx-deployment-54988485fb-c6dpc   1/1     Running             0          4m30s
nginx-deployment-54988485fb-rgmp2   1/1     Running             0          4m40s
nginx-deployment-54988485fb-v24qq   1/1     Terminating         0          4m24s
nginx-deployment-54988485fb-x6q56   1/1     Terminating         0          3m15s
nginx-deployment-54988485fb-zxh27   1/1     Running             0          4m30s
nginx-deployment-66c8c6957b-dtsb6   0/1     ContainerCreating   0          1s
nginx-deployment-66c8c6957b-f65gq   0/1     ContainerCreating   0          1s
nginx-deployment-66c8c6957b-xj8j4   1/1     Running             0          5s
nginx-deployment-66c8c6957b-xmstc   1/1     Running             0          5s
```

### Deployment更新策略

```java
# Deployment可以保证在升级时有一定的Pod必须处于UP状态，一般比整体副本数-1个处于UP状态，也就是一个Pod一个Pod的进行更新
# 未来的版本中，将从 1—>1 到 25%—>25%
kubectl describe deployment
```

### Rollover(多个Rollover并行)

假如创建了10个镜像为nginx:1.7.9replica的Deployment，开始创建到第3个时，你将镜像修改为了nginx:1.9.1版本，那么K8S会立刻删除之前旧镜像的3个Pod，开始创建新镜像的Pod

### 回退Deployment

只要Deployment的rollout被触发就会创建一个revision，也就是说当且仅当Deployment的template中内容被修改，例如更新template下的label和容器镜像，就会出现一个新的revision。其他操作，例如扩容Deployment不会触发Rollout

```java
# 修改deployment的容器镜像
kubectl set image deployment nginx-deployment nginx=nginx:1.9.1
# 查看deployment下rollout的状态
kubectl rollout status deployment nginx-deployment
# 查看当前pod 默认namespace为default
kubectl get pod
# 查看deployment所有的历史版本
kubectl rollout history deployment nginx-deployment
# 回退为上一个版本的deployment
kubectl rollout undo deployment nginx-deployment
# 回退为指定版本的deployment  --to-revision指定版本
kubectl rollout undo deployment nginx-deployment --to-revision=2
# 暂停deployment的更新
kubectl rollout pause deployment nginx-deployment
```

### 修改policy

可以通过设置spec.revisionHistoryLimit项来指定保留多少个revision历史记录，默认的会保留所有的revision，如果将该项设置为0，Deployment就不允许回退了

## DaemonSet

DaemonSet确保全部(或者一些)Node上运行一个Pod副本、当有Node加入集群时，也会为他们新增一个Pod，当有Node从集群移除时，这些Pod也会被回收，删除DaemonSet将会删除它创建的所有Pod。

使用DaemonSet的一些典型用法

- 运行集群存储daemon，例如在每个Node上运行 glusterd、ceph
- 在每个Node节点运行日志收集damon，例如logstash、fluentd
- 在每个Node节点运行监控damon，例如Prometheus Node Exporter、collectd、Datadog代理、New Relic代理等

```java
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: daemonset-example
  labels:
    app: daemonset
spec:
  selector:
    matchLabels:
      name: daemonset-example
  template:
    metadata:
      name: daemonset-example
      labels: daemonset
    spec:
     containers:
     - name: deamonset-example
       image: hub.vfancloud.com/myapp:v1
```

## Job

Job负责批处理任务，即仅执行一次的任务，它保证批处理任务的一个或多个Pod成功结束

### 特殊说明

- spec.template格式同Pod
- RestartPolicy仅支持Never或OnFailure
- 单个Pod时，默认Pod成功运行后Job即结束
- .spec.completions标志Job结束需要成功运行的Pod个数，默认为1
- .spec.parallelism标志并行运行的Pod的个数，默认为1
- .spec.activeDeadlineSeconds 标志失败Pod重试的最大时间，超过这个时间不会继续重试

### Example

```java
vim job.yaml
...
apiVersion: batch/v1
kind: Job
metadata:
  name: p1
spec:
  template:
    metadata:
      labels:
        type: job
      name: p1
    spec:
      containers:
      - name: p1
        image: perl:v1
        command: ["perl","-Mbignum=bpi","-wle","print bpi(2000)"] 圆周率后2000位
        imagePullPolicy: IfNotPresent
      restartPolicy: Never
...
[root@Centos8 k8sYaml]# kubectl create -f job.yaml 
job.batch/p1 created
[root@Centos8 k8sYaml]# kubectl get pod 
NAME       READY   STATUS    RESTARTS   AGE
p1-49lcs   1/1     Running   0          6s
[root@Centos8 k8sYaml]# kubectl get job
NAME   COMPLETIONS   DURATION   AGE
p1     1/1           14s        21s
## 圆周率小数点后2000位
[root@Centos8 k8sYaml]# kubectl logs p1-49lcs
3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679821480865132823066470938446095505822317253594081284811174502841027019385211055596446229489549303819644288109756659334461284756482337867831652712019091456485669234603486104543266482133936072602491412737245870066063155881748815209209628292540917153643678925903600113305305488204665213841469519415116094330572703657595919530921861173819326117931051185480744623799627495673518857527248912279381830119491298336733624406566430860213949463952247371907021798609437027705392171762931767523846748184676694051320005681271452635608277857713427577896091736371787214684409012249534301465495853710507922796892589235420199561121290219608640344181598136297747713099605187072113499999983729780499510597317328160963185950244594553469083026425223082533446850352619311881710100031378387528865875332083814206171776691473035982534904287554687311595628638823537875937519577818577805321712268066130019278766111959092164201989380952572010654858632788659361533818279682303019520353018529689957736225994138912497217752834791315155748572424541506959508295331168617278558890750983817546374649393192550604009277016711390098488240128583616035637076601047101819429555961989467678374494482553797747268471040475346462080466842590694912933136770289891521047521620569660240580381501935112533824300355876402474964732639141992726042699227967823547816360093417216412199245863150302861829745557067498385054945885869269956909272107975093029553211653449872027559602364806654991198818347977535663698074265425278625518184175746728909777727938000816470600161452491921732172147723501414419735685481613611573525521334757418494684385233239073941433345477624168625189835694855620992192221842725502542568876717904946016534668049886272327917860857843838279679766814541009538837863609506800642251252051173929848960841284886269456042419652850222106611863067442786220391949450471237137869609563643719172874677646575739624138908658326459958133904780275898
```

## CronJob

CronJob执行会自动创建Job，然后Job再创建Pod，最后再执行任务，其模式就跟创建Deployment会自动创建ReplicaSet再生成Pod一致。

- .spec.schedule指定任务运行周期，格式同Cron
- .spec.jobTemplate指定需要运行的任务，格式同Job
- .spec.startingDeadineSeconds指定任务开始的截止期限
- .spec.concurrencyPolicy指定任务的并发策略，支持Allow、Forbid和Replace三个选项

```java
vim cronjob.yaml
...
apiVersion: batch/v1beta1
kind: CronJob
metadata:
  name: hello
spec:
  schedule: "*/1 * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: hello
            image: busybox:v1
            command: ["/bin/sh","-c","date;echo Welcome here"]
            imagePullPolicy: IfNotPresent
          restartPolicy: OnFailure
...
[root@Centos8 k8sYaml]# kubectl create -f cronjob.yaml 
cronjob.batch/hello created
[root@Centos8 k8sYaml]# kubectl get cronjob
NAME    SCHEDULE      SUSPEND   ACTIVE   LAST SCHEDULE   AGE
hello   */1 * * * *   False     0        <none>          24s
[root@Centos8 k8sYaml]# kubectl get pod 
NAME                     READY   STATUS      RESTARTS   AGE
hello-1589101500-shzd6   0/1     Completed   0          2m9s
hello-1589101560-ddrp7   0/1     Completed   0          69s
hello-1589101620-vmwfg   0/1     Completed   0          9s
## 可以看到，命令每1分钟执行一次
[root@Centos8 k8sYaml]# kubectl log hello-1589101500-shzd6
log is DEPRECATED and will be removed in a future version. Use logs instead.
Sun May 10 09:05:02 UTC 2020
Welcome here
[root@Centos8 k8sYaml]# kubectl log hello-1589101560-ddrp7
log is DEPRECATED and will be removed in a future version. Use logs instead.
Sun May 10 09:06:02 UTC 2020
Welcome here
```
