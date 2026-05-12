# 05、Kubernetes - 实战：pod控制器
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/5/5.html
- 分类：容器服务
- 分组：教程目录
## 一、Pod控制器

## Pod 的分类

自主式Pod：Pod 退出后不会被创建

控制器管理的 Pod：在控制器的生命周期里，始终要维持 Pod 的副本数目

## 控制器类型

```java
Replication Controller和ReplicaSet
Deployment
DaemonSet
StatefulSet
Job
CronJob
HPA全称Horizontal Pod Autoscaler
```

## Replication Controller和ReplicaSet

ReplicaSet (RS)是下一代的 Replication Controller(RC)，官方推荐使用ReplicaSet。

ReplicaSet 和 Replication Controller 的唯一区别是选择器的支持，ReplicaSet 支持新的基于集合的选择器需求。

ReplicaSet 确保任何时间都有指定数量的 Pod 副本在运行。

虽然ReplicaSets 可以独立使用，但今天它主要被Deployments 用作协调 Pod 创建、删除和更新的机制。

## Deployment

Deployment 为 Pod 和 ReplicaSet 提供了一个申明式的定义方法。

典型的应用场景：

```java
用来创建Pod和ReplicaSet
滚动更新和回滚
扩容和缩容
暂停与恢复
```

## DaemonSet

DaemonSet 确保全部（或者某些）节点上运行一个 Pod 的副本。当有节点加入集群时， 也会为他们新增一个 Pod 。当有节点从集群移除时，这些 Pod 也会被回收。删除 DaemonSet 将会删除它创建的所有 Pod。

DaemonSet 的典型用法：

```java
在每个节点上运行集群存储 DaemonSet，例如 glusterd、ceph。
在每个节点上运行日志收集 DaemonSet，例如 fluentd、logstash。
在每个节点上运行监控 DaemonSet，例如 Prometheus Node Exporter、zabbix agent等
```

一个简单的用法是在所有的节点上都启动一个 DaemonSet，将被作为每种类型的 daemon 使用。

一个稍微复杂的用法是单独对每种 daemon 类型使用多个 DaemonSet，但具有不同的标志， 并且对不同硬件类型具有不同的内存、CPU 要求。

## StatefulSet

StatefulSet 是用来管理有状态应用的工作负载 API 对象。实例之间有不对等关系，以及实例对外部数据有依赖关系的应用，称为“有状态应用”

StatefulSet 用来管理 Deployment 和扩展一组 Pod，并且能为这些 Pod 提供序号和唯一性保证。

StatefulSets 对于需要满足以下一个或多个需求的应用程序很有价值：

```java
稳定的、唯一的网络标识符。
稳定的、持久的存储。
有序的、优雅的部署和缩放。
有序的、自动的滚动更新。
```

## Job

执行批处理任务，仅执行一次任务，保证任务的一个或多个Pod成功结束。

## CronJob

Cron Job 创建基于时间调度的 Jobs。

一个CronJob 对象就像 crontab (cron table) 文件中的一行，它用 Cron 格式进行编写，并周期性地在给定的调度时间执行 Job。

HPA

根据资源利用率自动调整service中Pod数量，实现Pod水平自动缩放。

## 二、Pod控制器使用示例

## ReplicaSet举例

编辑以下yaml文件：

```java
[root@server1 ~]# vim rs.yaml 
[root@server1 ~]# cat rs.yaml 
apiVersion: apps/v1
kind: ReplicaSet
metadata:
    name: replicaset-example
spec:
  replicas: 2			#启动pod的副本数
  selector:				#定义选择器为标签选择器。
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx				#定义容器的标签
    spec:						#定义容器
      containers:
      - name: nginx
        image: nginx
```

以上使用的控制器的RS，RS控制器通过pod的标签（matchLabels）来控制pod的数量，使用apply命令可以实现创建，更新pod，而create命令创建后若需要更新只能删除之后再创建，因此建议使用apply：

```java
[root@server1 ~]# kubectl apply -f rs.yaml 
replicaset.apps/replicaset-example created
[root@server1 ~]# kubectl apply -f rs.yaml 
replicaset.apps/replicaset-example unchanged
```

查看状态：

```java
[root@server1 ~]# kubectl get pod
NAME                       READY   STATUS    RESTARTS   AGE
replicaset-example-p6sv6   1/1     Running   0          34s
replicaset-example-s5jps   1/1     Running   0          34s
[root@server1 ~]# kubectl get rs			#获取rs的信息
NAME                 DESIRED   CURRENT   READY   AGE
replicaset-example   2         2         2       36s
[root@server1 ~]# kubectl get pod -o wide
NAME                       READY   STATUS    RESTARTS   AGE   IP            NODE      NOMINATED NODE   READINESS GATES
replicaset-example-p6sv6   1/1     Running   0          38s   10.244.1.14   server2   <none>           <none>
replicaset-example-s5jps   1/1     Running   0          38s   10.244.2.21   server3   <none>           <none>
```

可以看出一且正常，接下来进行pod的拉伸与压缩：

拉伸：

```java
[root@server1 ~]# vim rs.yaml 
[root@server1 ~]# cat rs.yaml 
apiVersion: apps/v1
kind: ReplicaSet
metadata:
    name: replicaset-example
spec:
  replicas: 4		#拉伸为4个
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
        image: nginx
[root@server1 ~]# kubectl apply -f rs.yaml 
replicaset.apps/replicaset-example configured
```

查看pod数：

```java
[root@server1 ~]# kubectl get pod
NAME                       READY   STATUS    RESTARTS   AGE
replicaset-example-p6sv6   1/1     Running   0          97s
replicaset-example-s5jps   1/1     Running   0          97s
replicaset-example-wzclz   1/1     Running   0          21s
replicaset-example-zk4mb   1/1     Running   0          21s
```

已经被拉伸成了4个。

缩减：

```java
[root@server1 ~]# vim rs.yaml 
[root@server1 ~]# cat rs.yaml 
apiVersion: apps/v1
kind: ReplicaSet
metadata:
    name: replicaset-example
spec:
  replicas: 2			#缩减为2个
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
        image: nginx
[root@server1 ~]# kubectl apply -f rs.yaml 
replicaset.apps/replicaset-example configured
[root@server1 ~]# kubectl get pod
NAME                       READY   STATUS        RESTARTS   AGE
replicaset-example-p6sv6   1/1     Running       0          2m6s
replicaset-example-s5jps   1/1     Running       0          2m6s
```

可以看出删除的是刚刚创建的那两个pod。

接下来更改一个pod 的标签：

```java
[root@server1 ~]# kubectl label pod replicaset-example-s5jps app=myapp --overwrite 		#将标签强制更改为myapp
pod/replicaset-example-s5jps labeled
[root@server1 ~]# kubectl get pod --show-labels
NAME                       READY   STATUS    RESTARTS   AGE     LABELS
replicaset-example-p6sv6   1/1     Running   0          3m56s   app=nginx
replicaset-example-s5jps   1/1     Running   0          3m56s   app=myapp
replicaset-example-w98nk   1/1     Running   0          26s     app=nginx
```

可以看出现在有3个pod，两个标签为nginx一个为myapp，RS控制器的工作原理就是维持标签为nginx的pod个数有2个，因此当我们更改一个pod的标签后，RS又会给我们创建一个标签为nginx的pod，而当我们将标签为myapp的pod删除后RS控制器不会有操作：

```java
[root@server1 ~]# kubectl delete pod replicaset-example-s5jps
pod "replicaset-example-s5jps" deleted
[root@server1 ~]# kubectl get pod --show-labels
NAME                       READY   STATUS    RESTARTS   AGE    LABELS
replicaset-example-p6sv6   1/1     Running   0          5m8s   app=nginx
replicaset-example-w98nk   1/1     Running   0          98s    app=nginx
```

此时我们再更改：

```java
[root@server1 ~]# kubectl label pod replicaset-example-p6sv6 app=myapp --overwrite 		#首先保证3个pod
pod/replicaset-example-p6sv6 labeled
[root@server1 ~]# kubectl get pod --show-labels
NAME                       READY   STATUS    RESTARTS   AGE     LABELS
replicaset-example-p6sv6   1/1     Running   0          6m4s    app=myapp
replicaset-example-w98nk   1/1     Running   0          2m34s   app=nginx
replicaset-example-x2lq9   1/1     Running   0          26s     app=nginx
[root@server1 ~]# kubectl label pod replicaset-example-p6sv6 app=nginx --overwrite
pod/replicaset-example-p6sv6 labeled
[root@server1 ~]# kubectl get pod --show-labels
NAME                       READY   STATUS        RESTARTS   AGE     LABELS
replicaset-example-p6sv6   1/1     Running       0          6m23s   app=nginx
replicaset-example-w98nk   1/1     Running       0          2m53s   app=nginx
replicaset-example-x2lq9   0/1     Terminating   0          45s     app=nginx
[root@server1 ~]# kubectl get pod --show-labels
NAME                       READY   STATUS    RESTARTS   AGE     LABELS
replicaset-example-p6sv6   1/1     Running   0          6m25s   app=nginx
replicaset-example-w98nk   1/1     Running   0          2m55s   app=nginx
```

以上实验可以看出，当集群里有3个标签是nginx的pod的时候，RS控制器又会帮我们将最后创建的pod删除。

实验后删除：

```java
[root@server1 ~]# kubectl delete -f rs.yaml 
replicaset.apps "replicaset-example" deleted
```

## Deployment控制器示例

编辑yaml文件：

```java
[root@server1 ~]# vim deployment.yaml 
[root@server1 ~]# cat deployment.yaml 
apiVersion: apps/v1
kind: Deployment
metadata:
  name: deployment-nginx
  labels:
    app: nginx
spec:
  replicas: 2
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
        image: ikubernetes/myapp:v1
        ports:
        - containerPort: 80
```

创建pod：

```java
[root@server1 ~]# kubectl apply -f deployment.yaml 
deployment.apps/deployment-nginx created
[root@server1 ~]# kubectl get pod
NAME                                READY   STATUS    RESTARTS   AGE
deployment-nginx-56d786cd98-kx5pw   1/1     Running   0          23s
deployment-nginx-56d786cd98-qgcjl   1/1     Running   0          23s
[root@server1 ~]# kubectl get rs
NAME                          DESIRED   CURRENT   READY   AGE
deployment-nginx-56d786cd98   2         2         2       28s
[root@server1 ~]# kubectl get deployments.apps 		#查看deployments
NAME               READY   UP-TO-DATE   AVAILABLE   AGE
deployment-nginx   2/2     2            2           32s
```

以上运行结果可以看出deployments底层也是由RS实现的，接下来进行拉伸：

```java
[root@server1 ~]# vim deployment.yaml 
[root@server1 ~]# cat deployment.yaml 
apiVersion: apps/v1
kind: Deployment
metadata:
  name: deployment-nginx
  labels:
    app: nginx
spec:
  replicas: 4			#拉伸为4个
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
        image: ikubernetes/myapp:v1
        ports:
        - containerPort: 80
[root@server1 ~]# kubectl apply -f deployment.yaml 
deployment.apps/deployment-nginx configured
[root@server1 ~]# kubectl get pod
NAME                                READY   STATUS    RESTARTS   AGE
deployment-nginx-56d786cd98-942dh   1/1     Running   0          26s
deployment-nginx-56d786cd98-kx5pw   1/1     Running   0          108s
deployment-nginx-56d786cd98-qgcjl   1/1     Running   0          108s
deployment-nginx-56d786cd98-zb8s8   1/1     Running   0          26s
```

可以看出已经拉伸为4个。接下来进行滚动更新：

```java
[root@server1 ~]# vim deployment.yaml 
[root@server1 ~]# cat deployment.yaml 
apiVersion: apps/v1
kind: Deployment
metadata:
  name: deployment-nginx
  labels:
    app: nginx
spec:
  replicas: 4
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
        image: ikubernetes/myapp:v2		#更新到v2
        ports:
        - containerPort: 80
[root@server1 ~]# kubectl apply -f deployment.yaml 
deployment.apps/deployment-nginx configured
[root@server1 ~]# kubectl get pod -o wide
NAME                                READY   STATUS    RESTARTS   AGE     IP            NODE      NOMINATED NODE   READINESS GATES
deployment-nginx-868855d887-2zh45   1/1     Running   0          2m39s   10.244.2.26   server3   <none>           <none>
deployment-nginx-868855d887-87m22   1/1     Running   0          2m34s   10.244.1.20   server2   <none>           <none>
deployment-nginx-868855d887-hb6mv   1/1     Running   0          2m39s   10.244.1.19   server2   <none>           <none>
deployment-nginx-868855d887-v8ndt   1/1     Running   0          2m33s   10.244.2.27   server3   <none>           <none>
[root@server1 ~]# curl 10.244.2.26
Hello MyApp | Version: v2 | <a href="hostname.html">Pod Name</a>
```

可以看出版本已经更新到了v2，我们查看rs可以看出更新过程：

```java
[root@server1 ~]# kubectl get rs
NAME                          DESIRED   CURRENT   READY   AGE
deployment-nginx-56d786cd98   0         0         0       4m41s
deployment-nginx-868855d887   4         4         4       2m27s
```

可以看出更新时控制器新建一个rs，然后再新建4个pod，原来的rs依然存在，为了方便我们进行回滚：

```java
[root@server1 ~]# vim deployment.yaml 
[root@server1 ~]# cat deployment.yaml 
apiVersion: apps/v1
kind: Deployment
metadata:
  name: deployment-nginx
  labels:
    app: nginx
spec:
  replicas: 4
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
        image: ikubernetes/myapp:v1
        ports:
        - containerPort: 80
[root@server1 ~]# kubectl apply -f deployment.yaml 
deployment.apps/deployment-nginx configured
[root@server1 ~]# kubectl get pod
NAME                                READY   STATUS              RESTARTS   AGE
deployment-nginx-56d786cd98-78m7z   0/1     ContainerCreating   0          4s
deployment-nginx-56d786cd98-8hnns   1/1     Running             0          9s
deployment-nginx-56d786cd98-lcvzw   1/1     Running             0          9s
deployment-nginx-56d786cd98-xkjhq   0/1     ContainerCreating   0          3s
deployment-nginx-868855d887-2zh45   1/1     Running             0          3m22s
deployment-nginx-868855d887-hb6mv   1/1     Terminating         0          3m22s
deployment-nginx-868855d887-v8ndt   1/1     Terminating         0          3m16s
[root@server1 ~]# kubectl get pod
NAME                                READY   STATUS    RESTARTS   AGE
deployment-nginx-56d786cd98-78m7z   1/1     Running   0          26s
deployment-nginx-56d786cd98-8hnns   1/1     Running   0          31s
deployment-nginx-56d786cd98-lcvzw   1/1     Running   0          31s
deployment-nginx-56d786cd98-xkjhq   1/1     Running   0          25s
```

可以看出原来v1版本的rs被重新启用，再原来的rs下面新建4个pod。当然我门也可以使用kubectl delete rs --all命令删除不用的rs（注意：正在使用的rs不会删除）：

```java
[root@server1 ~]# kubectl delete rs --all
replicaset.apps "deployment-nginx-56d786cd98" deleted
replicaset.apps "deployment-nginx-868855d887" deleted
[root@server1 ~]# kubectl get pod
NAME                                READY   STATUS    RESTARTS   AGE
deployment-nginx-56d786cd98-6r589   1/1     Running   0          21s
deployment-nginx-56d786cd98-hvz24   1/1     Running   0          21s
deployment-nginx-56d786cd98-k62lj   1/1     Running   0          21s
deployment-nginx-56d786cd98-ss97z   1/1     Running   0          21s
[root@server1 ~]# kubectl get rs
NAME                          DESIRED   CURRENT   READY   AGE
deployment-nginx-56d786cd98   4         4         4       24s		#正在使用的RS不会删除
```

实验后删除：

```java
[root@server1 ~]# kubectl delete -f deployment.yaml 
deployment.apps "deployment-nginx" deleted
```

## DaemonSet举例

DaemonSet控制器保证每个节点上都运行一个pod：

```java
[root@server1 ~]# vim daemonset.yaml 
[root@server1 ~]# cat daemonset.yaml 
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: daemonset-example
  labels:
    app: zabbix-agent
spec:
  selector:
    matchLabels:
      name: zabbix-agent
  template:
    metadata:
      labels:
        name: zabbix-agent
    spec:
      containers:
      - name: zabbix-agent
        image: zabbix/zabbix-agent
```

创建pod：

```java
[root@server1 ~]# kubectl apply -f daemonset.yaml 
daemonset.apps/daemonset-example created
[root@server1 ~]# kubectl get pod
NAME                      READY   STATUS    RESTARTS   AGE
daemonset-example-ctbgh   1/1     Running   0          6m5s
daemonset-example-mdqzk   1/1     Running   0          6m5s
[root@server1 ~]# kubectl get pod -o wide
NAME                      READY   STATUS    RESTARTS   AGE     IP            NODE      NOMINATED NODE   READINESS GATES
daemonset-example-ctbgh   1/1     Running   0          7m16s   10.244.2.32   server3   <none>           <none>
daemonset-example-mdqzk   1/1     Running   0          7m16s   10.244.1.25   server2   <none>           <none>
```

可以看出我们的每个节点（server3和server2）上都运行了一个pod，当我们删除一个pod时：

```java
[root@server1 ~]# kubectl delete pod daemonset-example-ctbgh
pod "daemonset-example-ctbgh" deleted
[root@server1 ~]# kubectl get pod -o wide
NAME                      READY   STATUS              RESTARTS   AGE     IP            NODE      NOMINATED NODE   READINESS GATES
daemonset-example-998ck   0/1     ContainerCreating   0          8s      <none>        server3   <none>           <none>
daemonset-example-mdqzk   1/1     Running             0          8m22s   10.244.1.25   server2   <none>           <none>
[root@server1 ~]# kubectl get pod -o wide
NAME                      READY   STATUS    RESTARTS   AGE     IP            NODE      NOMINATED NODE   READINESS GATES
daemonset-example-998ck   1/1     Running   0          24s     10.244.2.33   server3   <none>           <none>
daemonset-example-mdqzk   1/1     Running   0          8m38s   10.244.1.25   server2   <none>           <none>
```

可以看出删除后DaemonSet控制器又会帮我们创建pod，以保证每个节点运行一个pod。

实验后删除：

```java
[root@server1 ~]# kubectl delete -f daemonset.yaml 
daemonset.apps "daemonset-example" deleted
```

## Job控制器举例

Job控制器只运行一次

```java
[root@server1 ~]# vim job.yaml 
[root@server1 ~]# cat job.yaml 
apiVersion: batch/v1
kind: Job
metadata:
  name: pi
spec:
  template:
    spec:
      containers:
      - name: pi
        image: perl				#利用perl计算圆周率
        command: ["perl",  "-Mbignum=bpi", "-wle", "print bpi(2000)"]
      restartPolicy: Never
  backoffLimit: 4			#容器启动失败重启4次之后不再重启。
```

创建pod：

```java
[root@server1 ~]# kubectl apply -f job.yaml 
job.batch/pi created
[root@server1 ~]# kubectl get pod
NAME       READY   STATUS              RESTARTS   AGE
pi-ktn6p   0/1     ContainerCreating   0          40s
[root@server1 ~]# kubectl get pod
NAME       READY   STATUS      RESTARTS   AGE
pi-ktn6p   0/1     Completed   0          2m12s
```

由于Job只运行一次，因此运行完后状态为Completed，我们可以查看日志获取结果

可以看出计算成功。

实验后删除：

```java
[root@server1 ~]# kubectl delete -f job.yaml 
job.batch "pi" deleted
```

## CronJob控制器举例

CronJob控制器用于定时执行任务：

```java
[root@server1 ~]# vim cronjob.yaml 
[root@server1 ~]# cat cronjob.yaml 
apiVersion: batch/v1beta1
kind: CronJob
metadata:
  name: cronjob-example
spec:
  schedule: "* * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: cronjob
            image: busybox
            args:
            - /bin/sh
            - -c
            - date; echo Hello from k8s cluster			#输出信息
          restartPolicy: OnFailure
```

其中schedule字段与crontab里面的写法相同，"* * * * *"表示每分钟执行任务。

创建pod：

```java
[root@server1 ~]# kubectl apply -f cronjob.yaml 
cronjob.batch/cronjob-example created
root@server1 ~]# kubectl get pod
NAME                               READY   STATUS              RESTARTS   AGE
cronjob-example-1587387120-ngt6n   0/1     ContainerCreating   0          16s
[root@server1 ~]# kubectl get pod		#等待一分钟
NAME                               READY   STATUS              RESTARTS   AGE
cronjob-example-1587387120-ngt6n   0/1     Completed           0          60s
cronjob-example-1587387180-hbwzb   0/1     ContainerCreating   0          9s
```

可以看出每分钟运行一个pod，查看日志获取输出信息：

```java
[root@server1 ~]# kubectl logs cronjob-example-1587387120-ngt6n
Mon Apr 20 12:52:30 UTC 2020
Hello from k8s cluster
[root@server1 ~]# kubectl logs cronjob-example-1587387180-hbwzb
Mon Apr 20 12:53:35 UTC 2020
Hello from k8s cluster
```

可以看出输出也是每分钟输出一次，也可以使用以下命令查看cronjob的信息：

```java
[root@server1 ~]# kubectl get cronjobs
NAME              SCHEDULE    SUSPEND   ACTIVE   LAST SCHEDULE   AGE
cronjob-example   * * * * *   False     1        16s             3m10s
[root@server1 ~]# kubectl get job -w		#查看job信息并且持续输出
NAME                         COMPLETIONS   DURATION   AGE
cronjob-example-1587387120   1/1           20s        2m23s
cronjob-example-1587387180   1/1           35s        92s
cronjob-example-1587387240   1/1           20s        32s
```

实验后删除

```java
[root@server1 ~]# kubectl delete -f cronjob.yaml 
cronjob.batch "cronjob-example" deleted
```
