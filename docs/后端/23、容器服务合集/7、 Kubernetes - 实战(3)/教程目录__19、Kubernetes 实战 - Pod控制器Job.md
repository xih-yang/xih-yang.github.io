# 19、Kubernetes 实战 - Pod控制器Job
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/3/19.html
- 分类：容器服务
- 分组：教程目录
## Job

Job，主要用于负责批量处理短暂的一次性任务。Job特点如下

- 当Job创建的pod执行成功时，Job将记录成功结束的pod数量
- 当成功结束的pod达到指定的数量时，Job将完成执行

Job的资源清单文件

```java
apiVersion: batch/v1 版本号
kind: Job  类型
metadata:   元数据
  name: pc-job rs名称
  namespace: dev 命名空间
  labels: 标签
    controller: job
spec: 详情
  completions: 1指定job需要成功运行pods的次数.默认1
  parallelism: 1指定job在任一时刻应该并发运行Pods的数量。默认1
  activeDeadlineSeconds: 30指定job可运行的时间限制，超过时间还未结束，系统将会尝试进行终止。
  backoffLimit: 6指定job失败后进行重试的次数。默认6
  manualSelector: true是否可以使用选择器选择pod，默认false
  selector:选择器，通过它指定该控制器管理哪些pod
    matchLabels:Labels匹配规则
      app: counter-pod
    matchExpresssions: Expressions匹配规则
      - {
     key: app, operator: In, values:[counter-pod]}
  template:  模板,当副本数量不足时，会格局下面的模板创建pod副本
    metadata:
      labels:
        app: counter-pod
    spec:
      restartPolicy: Never重启策略只能设置为Never或者OnFailure
      containers:
        - image: busybox:1.30
          name: counter
          command: ["bin/sh", "-c","for i in 9 8 7 6 5 4 3 2 1;do echo $i;sleep 2;done"]
```

> 重启策略的说明
>
> 如果指定为OnFailure，则job会在pod出现故障时重启容器，而不是创建pod，failed次数不变
>
> 如果指定为Never，则job会在pod出现故障时创建新的pod，并且故障pod不会消失，也不会重启，failed次数加1
>
> 如果指定为Always，就意味着一直重启，意味着job任务会重复执行了，所以不能设置为Always

创建pc-job.yaml，内容如下

```java
apiVersion: batch/v1 版本号
kind: Job  类型
metadata:   元数据
  name: pc-job rs名称
  namespace: dev 命名空间
spec: 详情
  manualSelector: true是否可以使用选择器选择pod，默认false
  selector:选择器，通过它指定该控制器管理哪些pod
    matchLabels:Labels匹配规则
      app: counter-pod
  template:  模板,当副本数量不足时，会格局下面的模板创建pod副本
    metadata:
      labels:
        app: counter-pod
    spec:
      restartPolicy: Never重启策略只能设置为Never或者OnFailure
      containers:
        - image: busybox:1.30
          name: counter
          command: ["bin/sh", "-c","for i in 9 8 7 6 5 4 3 2 1;do echo $i;sleep 2;done"]
```

创建job

```java
kubectl create -f pc-job.yaml
```

查看job和pod，注意先提前打开窗口查看

```java
kubectl get job -n dev -w
kubectl get pod -n dev -w
```

删除job

```java
kubectl delete -f pc-job.yaml
```
