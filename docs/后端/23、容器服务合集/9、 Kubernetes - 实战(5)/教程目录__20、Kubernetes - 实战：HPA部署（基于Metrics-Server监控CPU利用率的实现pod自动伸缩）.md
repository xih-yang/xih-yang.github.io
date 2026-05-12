# 20、Kubernetes - 实战：HPA部署（基于Metrics-Server监控CPU利用率的实现pod自动伸缩）
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/5/20.html
- 分类：容器服务
- 分组：教程目录
## 一、HPA简介

Horizontal Pod Autoscaler 可以根据CPU利用率自动伸缩 replication controller、deployment 或者 replica set 中的Pod数量 （也可以基于其他应用程序提供的度量指标，目前这一功能处于 beta 版本）。

**metrics-server 也需要部署到集群中， 它可以通过 resource metrics API 对外提供度量数据，Horizontal Pod Autoscaler 正是根据此 API 来获取度量数据**

## 二、HPA实例

## 运行 php-apache 服务器并暴露服务

为了演示 Horizontal Pod Autoscaler，我们将使用一个叫 **hpa-example**的基于php-apache定制 Docker 镜像。 Dockerfile 内容如下：

```java
FROM php:5-apache
ADD index.php /var/www/html/index.php
RUN chmod a+rx index.php
它定义一个 index.php 页面来执行一些 CPU 密集型计算：
<?php
  $x = 0.0001;
  for ($i = 0; $i <= 1000000; $i++) {
    $x += sqrt($x);
  }
  echo "OK!";
?>
```

首先，我们先启动一个 deployment 来运行这个镜像并暴露一个服务:

```java
[root@server1 hpa]# vim php-apache.yaml 
[root@server1 hpa]# cat php-apache.yaml 
apiVersion: apps/v1
kind: Deployment
metadata:
  name: php-apache
spec:
  selector:
    matchLabels:
      run: php-apache
  replicas: 1
  template:
    metadata:
      labels:
        run: php-apache
    spec:
      containers:
      - name: php-apache
        image: hpa-example
        ports:
        - containerPort: 80
        resources:
          limits:
            cpu: 500m
          requests:
            cpu: 200m
---
apiVersion: v1
kind: Service
metadata:
  name: php-apache
  labels:
    run: php-apache
spec:
  ports:
  - port: 80
  selector:
    run: php-apache
```

其中需要的镜像hpa-example可以在docker hub拉取，先在运行这个部署文件：

```java
[root@server1 hpa]# kubectl apply -f php-apache.yaml 
deployment.apps/php-apache created
service/php-apache created
```

查看状态，可以看出该部署文件创建了一个由deployment控制器维护的pod，以及一个service：

```java
[root@server1 hpa]# kubectl get all
NAME                                          READY   STATUS    RESTARTS   AGE
pod/nfs-client-provisioner-6b66ddf664-rxw77   1/1     Running   0          15m
pod/php-apache-dfb6d784b-jvntc                1/1     Running   0          2m7s
NAME                 TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
service/kubernetes   ClusterIP   10.96.0.1       <none>        443/TCP   23d
service/php-apache   ClusterIP   10.99.210.255   <none>        80/TCP    2m7s
NAME                                     READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/nfs-client-provisioner   1/1     1            1           4d1h
deployment.apps/php-apache               1/1     1            1           2m8s
NAME                                                DESIRED   CURRENT   READY   AGE
replicaset.apps/nfs-client-provisioner-6b66ddf664   1         1         1       4d1h
replicaset.apps/php-apache-dfb6d784b                1         1         1       2m8s
NAME                   READY   AGE
statefulset.apps/web   0/0     4d
```

## 创建 Horizontal Pod Autoscaler

现在，php-apache服务器已经运行，我们将通过 kubectl autoscale 命令创建 Horizontal Pod Autoscaler。 以下命令将创建一个 Horizontal Pod Autoscaler 用于控制我们上一步骤中创建的 deployment，使 Pod 的副本数量在维持在1到10之间。 大致来说，HPA 将通过增加或者减少 Pod 副本的数量（通过 Deployment ）以保持所有 Pod 的平均CPU利用率在50%以内 （由于每个 Pod 通过 yaml文件 申请了200 milli-cores CPU，所以50%的 CPU 利用率意味着平均 CPU 利用率为100 milli-cores）。

```java
[root@server1 hpa]# kubectl autoscale deployment php-apache --cpu-percent=50 --min=1 --max=10
horizontalpodautoscaler.autoscaling/php-apache autoscaled
horizontalpodautoscaler.autoscaling/php-apache autoscaled
```

我们可以通过以下命令查看 autoscaler 的状态：

```java
[root@server1 hpa]# kubectl get hpa
NAME         REFERENCE               TARGETS   MINPODS   MAXPODS   REPLICAS   AGE
php-apache   Deployment/php-apache   0%/50%    1         10        1          19s
kubectl get hpa
```

请注意在上面的命令输出中，当前的CPU利用率是0%，这是由于我们尚未发送任何请求到服务器 （CURRENT 列显示了相应 deployment 所控制的所有 Pod 的平均 CPU 利用率）。

## 增加负载

现在，我们将看到 autoscaler 如何对增加负载作出反应。 我们将启动一个容器，并通过一个循环向 php-apache 服务器发送无限的查询请求：

```java
[root@server1 hpa]# kubectl get svc
NAME         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
kubernetes   ClusterIP   10.96.0.1       <none>        443/TCP   23d
php-apache   ClusterIP   10.99.210.255   <none>        80/TCP    4m32s
[root@server1 hpa]# kubectl run test --image=busybox -it --rm --restart=Never
If you don't see a command prompt, try pressing enter.
/ while true; do wget -q -O- http://10.99.210.255; done
```

在几分钟时间内，通过以下命令，我们可以看到CPU负载升高了（在另一个终端查看）：

```java
[root@server1 ~]# kubectl get hpa
NAME         REFERENCE               TARGETS    MINPODS   MAXPODS   REPLICAS   AGE
php-apache   Deployment/php-apache   250%/50%   1         10        1          4m22s
```

这时，由于请求增多，CPU利用率已经升至250%。 可以看到，deployment 的副本数量已经增长到了5：

```java
[root@server1 ~]# kubectl get hpa
NAME         REFERENCE               TARGETS    MINPODS   MAXPODS   REPLICAS   AGE
php-apache   Deployment/php-apache   250%/50%   1         10        5          5m1s
```

查看pod的资源使用情况：

```java
[root@server1 ~]# kubectl top pod
NAME                                      CPU(cores)   MEMORY(bytes)   
nfs-client-provisioner-6b66ddf664-rxw77   1m           3Mi             
php-apache-dfb6d784b-jvntc                500m         14Mi            
test                                      5m           1Mi             
[root@server1 ~]# kubectl top pod
NAME                                      CPU(cores)   MEMORY(bytes)   
nfs-client-provisioner-6b66ddf664-rxw77   1m           7Mi             
php-apache-dfb6d784b-jvntc                147m         21Mi            
php-apache-dfb6d784b-lsfgp                150m         12Mi            
php-apache-dfb6d784b-vx8rn                134m         11Mi            
test                                      4m           1Mi             
[root@server1 ~]# kubectl top pod
NAME                                      CPU(cores)   MEMORY(bytes)   
nfs-client-provisioner-6b66ddf664-rxw77   1m           7Mi             
php-apache-dfb6d784b-7zb9t                0m           0Mi             
php-apache-dfb6d784b-jvntc                147m         21Mi            
php-apache-dfb6d784b-lsfgp                150m         12Mi            
php-apache-dfb6d784b-pprhd                0m           0Mi             
php-apache-dfb6d784b-vx8rn                134m         11Mi            
test                                      4m           1Mi            
```

注意：有时最终副本的数量可能需要几分钟才能稳定下来。 由于环境的差异，不同环境中最终的副本数量可能与本示例中的数量不同。

## 停止负载

我们将通过停止负载来结束我们的示例。

在我们创建 busybox 容器的终端中，输入 + C来终止负载的产生。

然后我们可以再次查看负载状态（等待几分钟时间）：

```java
[root@server1 ~]# kubectl get hpa
NAME         REFERENCE               TARGETS   MINPODS   MAXPODS   REPLICAS   AGE
php-apache   Deployment/php-apache   0%/50%    1         10        1          13m
```

这时，CPU利用率已经降到0，所以 HPA 将自动缩减副本数量至1。

注意：自动伸缩完成副本数量的改变可能需要几分钟的时间。

## 三、HPA的伸缩过程

HPA伸缩过程

```java
收集HPA控制下所有Pod最近的cpu使用情况（CPU utilization）
对比在扩容条件里记录的cpu限额（CPUUtilization）
调整实例数（必须要满足不超过最大/最小实例数）
每隔30s做一次自动扩容的判断
```

CPUutilization的计算方法是用cpu usage（最近一分钟的平均值，通过metrics可以直接获取到）除以cpu request（这里cpu request就是我们在创建容器时制定的cpu使用核心数）得到一个平均值，这个平均值可以理解为：平均每个Pod CPU核心的使用占比。

上例中我们的cpu request为200m（在部署文件中定义），在负载开始时我们的cpu usage为500m，因此上例的CPU utilization为500/200=2.5.

HPA进行伸缩算法

目标pod数量计算公式：TargetNumOfPods = ceil(sum(CurrentPodsCPUUtilization) / Target)

ceil()表示取大于或等于某数的最近一个整数。

```java
为了保持集群的稳定，每次扩容后冷却3分钟才能再次进行扩容，而缩容则要等5分钟后。
当前Pod Cpu使用率与目标使用率接近时，不会触发扩容或缩容：
触发条件：avg(CurrentPodsConsumption) / Target >1.1 或 <0.9
```

上例中的target我们定义的是50%，因此TargetNumOfPods = ceil(2.5 /0.5)=5

因此目标pod数量应该为5,最后的结果也验证了我们的计算。

上例中在扩展pod数量时中间还有一个过程：

```java
[root@server1 ~]# kubectl top pod
NAME                                      CPU(cores)   MEMORY(bytes)   
nfs-client-provisioner-6b66ddf664-rxw77   1m           7Mi             
php-apache-dfb6d784b-jvntc                147m         21Mi            
php-apache-dfb6d784b-lsfgp                150m         12Mi            
php-apache-dfb6d784b-vx8rn                134m         11Mi            
test                                      4m           1Mi      
```

可以看出此时有三个pod，cpu利用率为147，150，134

这时avg(CurrentPodsConsumption)=（（147+150+134）/3）/200=0.718，触发条件为0.718/0.5=1.43 > 1.1,因此还会触发扩容，扩容的目标pod数量为（（147+150+134）/200）/0.5=4.31，取整为5，因此我们再次查看时副本数变成了5个。

## 四、引入其他度量指标

利用autoscaling/v2beta2API版本，您可以在自动伸缩 php-apache 这个 Deployment 时引入其他度量指标。

```java
[root@server1 hpa]# vim hpav2.yaml 
[root@server1 hpa]# cat hpav2.yaml 
apiVersion: autoscaling/v2beta2
kind: HorizontalPodAutoscaler
metadata:
  name: php-apache
spec:
  maxReplicas: 10
  minReplicas: 1
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: php-apache
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        averageUtilization: 60
        type: Utilization
  - type: Resource
    resource:
      name: memory
      target:
        averageValue: 50Mi
        type: AverageValue
[root@server1 hpa]# kubectl apply -f hpav2.yaml 
Warning: kubectl apply should be used on resource created by either kubectl create --save-config or kubectl apply
horizontalpodautoscaler.autoscaling/php-apache configured
[root@server1 hpa]# kubectl get hpa
NAME         REFERENCE               TARGETS                 MINPODS   MAXPODS   REPLICAS   AGE
php-apache   Deployment/php-apache   13824512/50Mi, 0%/60%   1         10        8          26m
```

查看hpa时可以看出已经有了cpu的指标，单位时字节。

这里就不进行演示。

实验后删除：

```java
[root@server1 hpa]# kubectl delete -f php-apache.yaml 
deployment.apps "php-apache" deleted
service "php-apache" deleted
[root@server1 hpa]# kubectl delete -f hpav2.yaml
horizontalpodautoscaler.autoscaling "php-apache" deleted
```
