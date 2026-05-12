# 04、Kubernetes - 实战：k8s集群之控制器
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/11/4.html
- 分类：容器服务
- 分组：教程目录
## 1、什么是控制器

自主式Pod，当Pod 退出后不会被创建。如果加入了控制器，控制器管理的 Pod，在控制器的生命周期里，始终要维持 Pod 的副本数目，删除一个副本，控制器就会自动补一个副本。

控制器分为多种类型，下面一一分析

## 2、ReplicaSet（rs）控制器

ReplicaSet 确保任何时间都有指定数量的 Pod 副本在运行。虽然 ReplicaSets 可以独立使用，但今天它主要被Deployments 用作协调 Pod 创建、删除和更新的机制。

编辑rs.yaml文件

```java
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: replicaset-example
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
        image: nginx
```

拉起pod，可以看到有三个副本，

当把副本个数变为6时，

启动pod，就会扩容为六个副本

还可以查看标签

```java
kubectl get pod --show-labels			%查看pod的标签
kubectl label pod replicaset-example-9b9gz app=myapp --overwrite	%覆盖replicaset-example-9b9gz这个pod的标签为app=myapp
kubectl delete -f rs.yaml				%可以根据该文件删除，怎么创建的怎么删除，回收所有节点
```

删除一个节点，rs会自动补充。注意rs只控制副本数量，不管镜像的更新。

## 3、Deployment控制器

deployment可以更新，原理是和rs合作，一个版本一个rs，五个版本就是五个rs，每个rs分别管理自己的副本数量。

编写deployment.yaml文件

```java
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
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
        image: nginx
```

拉起容器，测试，可以看到是nginx

修改文件，镜像变为myapp

拉起容器，测试，可以看到，更新为mypp

当然deployment也支持回滚

```java
kubectl rollout status deployment deployment-nginx	%查看可以回滚的版本
kubectl rollout history deployment					%回滚
kubectl delete -f deployment.yaml					%删除
```

## 4、DaemonSet控制器

DaemonSet 确保全部（或者某些）节点上运行一个 Pod 的副本。当有节点加入集群时， 也会为他们新增一个 Pod 。当有节点从集群移除时，这些 Pod 也会被回收。删除 DaemonSet 将会删除它创建的所有 Pod。一个典型用法是在每个节点上运行监控 DaemonSet，例如 zabbix agent等。保证每个节点做一次

编辑daemonset.yaml文件

```java
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: daemonset-example
  labels:
    k8s-app: zabbix-agent
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

## 5、StatefulSet控制器

StatefulSet 是用来管理有状态应用的工作负载 API 对象。实例之间有不对等关系，以及实例对外部数据有依赖关系的应用，称为“有状态应用”。

主要用于长期的、持续的监测状态，需要唯一的网络标识符的集群。

## 6、Job控制器

执行批处理任务，仅执行一次任务，执行成功就结束。比如可以计算pi值。

```java
apiVersion: batch/v1
kind: Job
metadata:
  name: pi
spec:
  template:
    spec:
      containers:
      - name: pi
        image: perl
        command: ["perl",  "-Mbignum=bpi", "-wle", "print bpi(2000)"]
      restartPolicy: Never
  backoffLimit: 4
```

拉起pod，查看状态

启动成功后，在日志中出现结果

## 7、CronJob控制器

vimcronjob-example.yaml

```java
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
            image: busyboxplus
            args:
            - /bin/sh
            - -c
            - date; echo Hello from k8s cluster
          restartPolicy: OnFailure
```

启动pod，在日志中每分钟都会来一条消息

## 8、HPA控制器

全称是Horizontal Pod Autoscaler，根据资源利用率自动调整service中Pod数量，实现Pod水平动态拉伸
