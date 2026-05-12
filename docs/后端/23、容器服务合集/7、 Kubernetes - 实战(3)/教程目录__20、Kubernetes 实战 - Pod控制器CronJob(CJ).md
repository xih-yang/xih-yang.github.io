# 20、Kubernetes 实战 - Pod控制器CronJob(CJ)
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/3/20.html
- 分类：容器服务
- 分组：教程目录
## CronJob

CronJob控制器以Job控制器资源为其管控对象，并借助它股那里pod资源对象，Job控制器定义的作业在其控制器资源创建之后便立即执行，但CronJob可以以类似于linux操作系统的周期性任务作业计划的方式控制其运行时间点及重复运行的方式。也就是说，CronJob可以在特定的时间点(反复的)去运行Job任务。

CronJob的资源清单文件

```java
apiVersion: batch/v1beta1 版本号
kind: CronJob  类型
metadata:   元数据
  name: pc-cronjob rs名称
  namespace: dev 命名空间
  labels: 标签
    controller: cronjob
spec: 详情
  schedule:cron格式的作业调度时间点，用于控制任务在什么时间执行
  concurrencyPolicy:并发执行策略，用于定义前一次作业运行尚未完成时是否以及如何运行后一次的作业
  failedJobHistoryLimit:为失败的任务执行保留的历史记录数，默认1
  successfulJobHistoryLimit:为成功的任务执行保留的历史记录数，默认3
  startingDeadlineSeconds:启动作业错误的超时时长
  jobTemplate:job控制器模板，用于conrjob控制器生成job对象；子属性就是job的内容
    metadata:   元数据
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

创建pc-cronjob.yaml

```java
apiVersion: batch/v1beta1 版本号
kind: CronJob  类型
metadata:   元数据
  name: pc-cronjob rs名称
  namespace: dev 命名空间
  labels: 标签
    controller: cronjob
spec: 详情
  schedule: "*/1 * * * *"cron格式的作业调度时间点，用于控制任务在什么时间执行
  jobTemplate:job控制器模板，用于conrjob控制器生成job对象；子属性就是job的内容
    metadata:   元数据
    spec: 详情
      template:  模板,当副本数量不足时，会格局下面的模板创建pod副本
        spec:
          restartPolicy: Never重启策略只能设置为Never或者OnFailure
          containers:
            - image: busybox:1.30
              name: counter
              command: ["bin/sh", "-c","for i in 9 8 7 6 5 4 3 2 1;do echo $i;sleep 3;done"]
```

创建cronjob

```java
kubectl create -f pc-cronjob.yaml
```

查看cronjob，job，pod

```java
kubectl get cronjobs -n dev -w
kubectl get job -n dev -w
kubectl get pod -n dev -w
```

删除cronjob

```java
kubectl delete -f pc-cronjob.yaml
```

### cron扩展资料

[阿里云cron表达式](https://help.aliyun.com/document_detail/64769.html)

[详解cron表达式](https://www.jb51.net/article/138900.htm)

[在线Cron表达式生成器](https://help.aliyun.com/document_detail/64769.html)
