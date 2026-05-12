# 13、Kubernetes - 实战：Pod 控制器 Job相关命令
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/7/13.html
- 分类：容器服务
- 分组：教程目录
## 一、环境安装

参考

[MiniKube方式部署](/zhuanlan/container/kubernetes/7/3.html)

[KubeAdm方式部署](/zhuanlan/container/kubernetes/7/4.html)

[Kind方式部署](/zhuanlan/container/kubernetes/7/5.html)

## 二、Job介绍

Kubernetes jobs主要是针对短时和批量的工作负载。它是为了结束而运行的，而不是像deployment、replicasets、replication controllers和DaemonSets等其他对象那样持续运行。

Kubernetes Jobs会一直运行到Job中指定的任务完成。也就是说，如果pods给出退出代码0，那么Job就会退出。而在正常的Kubernetes中，无论退出代码是什么，deployment对象在终止或出现错误时都会创建新的pod，以保持deployment的理想状态。

在job运行过程中，如果托管pod的节点发生故障，Job pod将被自动重新安排到另一个节点。

对于Kubernetes Jobs最好的用例实践是：

**1、** **批处理任务：**比如说你想每天运行一次批处理任务，或者在指定日程中运行它可能是像从存储库或数据库中读取文件那样，将它们分配给一个服务来处理文件；

**2、** **运维/ad-hoc任务：**比如你想要运行一个脚本/代码，该脚本/代码会运行一个数据库清理活动，甚至备份一个Kubernetes集群；

特点：

- 当Job创建的Pod执行成功结束时，Job将记录成功结束的Pod数量
- 当成功结束的Pod达到指定的数量时，Job将完成执行

查看Job官方帮助

```java
kubectl explain job
```

```java
KIND:     Job
VERSION:  batch/v1
DESCRIPTION:
     Job represents the configuration of a single job.
FIELDS:
   apiVersion   <string>
     APIVersion defines the versioned schema of this representation of an
     object. Servers should convert recognized schemas to the latest internal
     value, and may reject unrecognized values. More info:
     https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
   kind <string>
     Kind is a string value representing the REST resource this object
     represents. Servers may infer this from the endpoint the client submits
     requests to. Cannot be updated. In CamelCase. More info:
     https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
   metadata     <Object>
     Standard object's metadata. More info:
     https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
   spec <Object>
     Specification of the desired behavior of a job. More info:
     https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#spec-and-status
   status       <Object>
     Current status of a job. More info:
     https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#spec-and-status
```

## 三、Job使用

### 完整配置

```java
apiVersion: batch/v1 版本号
kind: Job 类型       
metadata: 元数据
  name: job 名称 
  namespace: 所属命名空间 
  labels:标签
    controller: job
spec: 详情描述
  completions: 1 指定 job 需要成功运行 Pod 的次数。默认值: 1
  parallelism: 1 指定 job 在任一时刻应该并发运行 Pod 的数量。默认值: 1
  activeDeadlineSeconds: 30 指定 job 可运行的时间期限，超过时间还未结束，系统将会尝试进行终止。
  backoffLimit: 6 指定 job 失败后进行重试的次数。默认是 6
  manualSelector: true 是否可以使用 selector 选择器选择 Pod，默认是 false
  selector: 选择器，通过它指定该控制器管理哪些 Pod
    matchLabels:      Labels 匹配规则
      app: counter-pod
    matchExpressions: Expressions 匹配规则
      - {key: app, operator: In, values: [counter-pod]}
  template: 模板，当副本数量不足时，会根据下面的模板创建 Pod
    metadata:
      labels:
        app: counter-pod
    spec:
      restartPolicy: Never 重启策略只能设置为 Never 或者 OnFailure
      containers:
      - name: counter
        image: busybox:1.30
        command: ["bin/sh","-c","for i in 9 8 7 6 5 4 3 2 1; do echo $i;sleep 2;done"]
```

**关于重启策略设置的说明：**

- 如果指定为OnFailure，则job会在Pod出现故障时重启容器，而不是创建Pod，failed次数不变。
- 如果指定为Never，则job会在Pod出现故障时创建新的Pod，并且故障Pod不会消失，也不会重启，failed次数加1
- 如果指定为Always的话，就意味着一直重启，意味着job任务会重复去执行了，当然不对，所以不能设置为Always

**示例 yml**

pc-job.yml

```java
apiVersion: batch/v1
kind: Job      
metadata:
  name: pc-job
  namespace: dev
spec:
  manualSelector: true
  selector:
    matchLabels:
      app: counter-pod
  template:
    metadata:
      labels:
        app: counter-pod
    spec:
      restartPolicy: Never
      containers:
      - name: counter
        image: busybox:1.30
        command: ["bin/sh","-c","for i in 9 8 7 6 5 4 3 2 1; do echo $i;sleep 3;done"]
```

### 1 创建job

```java
kubectl create -f pc-job.yml
```

### 2 查看 Job

```java
kubectl get job -n dev -o wide  -w
```

### 3 查看 Pod

需开两个`SSH`窗口，否则`kubectl get job`查看`job`的指令会阻塞。

```java
kubectl get pods -n dev -w
```

### 4 删除 Job

```java
kubectl delete -f pc-job.yml
```
