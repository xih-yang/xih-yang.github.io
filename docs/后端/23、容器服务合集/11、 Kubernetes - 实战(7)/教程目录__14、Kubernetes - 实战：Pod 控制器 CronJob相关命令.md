# 14、Kubernetes - 实战：Pod 控制器 CronJob相关命令
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/7/14.html
- 分类：容器服务
- 分组：教程目录
## 一、环境安装

参考

[MiniKube方式部署](/zhuanlan/container/kubernetes/7/3.html)

[KubeAdm方式部署](/zhuanlan/container/kubernetes/7/4.html)

[Kind方式部署](/zhuanlan/container/kubernetes/7/5.html)

## 二、CronJob介绍

cronjob是管理job，也就是每一个周期创建一个job去执行任务,一次只能管理一个job。

cronjob其实就是在Job的基础上加上了时间调度，我们可以：在给定的时间点运行一个任务，也可以周期性地在给定时间点运行。这个实际上和Linux中的crontab就非常类似了。

一个cronjob对象其实就对应crontab文件中的一行，它根据配置的时间格式周期性地运行一个Job，格式和crontab也是一样的。

查看Job官方帮助

```java
kubectl explain cronjob
```

```java
KIND:     CronJob
VERSION:  batch/v1
DESCRIPTION:
     CronJob represents the configuration of a single cron job.
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
     Specification of the desired behavior of a cron job, including the
     schedule. More info:
     https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#spec-and-status
   status       <Object>
     Current status of a cron job. More info:
     https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#spec-and-status
```

## 三、CronJob使用

**完整配置**

```java
apiVersion: batch/v1beta1 版本号
kind: CronJob 类型       
metadata: 元数据
  name: CronJob 名称 
  namespace: 所属命名空间 
  labels: 标签
    controller: cronjob
spec: 详情描述
  schedule: cron 格式的作业调度运行时间点,用于控制任务在什么时间执行
  concurrencyPolicy: 并发执行策略，用于定义前一次作业运行尚未完成时是否以及如何运行后一次的作业
  failedJobHistoryLimit: 为失败的任务执行保留的历史记录数，默认为 1
  successfulJobHistoryLimit: 为成功的任务执行保留的历史记录数，默认为 3
  startingDeadlineSeconds: 启动作业错误的超时时长
  jobTemplate: job 控制器模板，用于为 CronJob 控制器生成 job 对象;下面其实就是 job 的定义
    metadata:
    spec:
      completions: 1
      parallelism: 1
      activeDeadlineSeconds: 30
      backoffLimit: 6
      manualSelector: true
      selector:
        matchLabels:
          app: counter-pod
        matchExpressions: 规则
          - {key: app, operator: In, values: [counter-pod]}
      template:
        metadata:
          labels:
            app: counter-pod
        spec:
          restartPolicy: Never 
          containers:
          - name: counter
            image: busybox:1.30
            command: ["bin/sh","-c","for i in 9 8 7 6 5 4 3 2 1; do echo $i;sleep 20;done"]
```

需要重点解释的几个选项：

`schedule`：`cron`表达式，用于指定任务的执行时间

```java
*/1    *      *    *     *
<分钟> <小时> <日> <月份> <星期>
分钟 值从 0 到 59.
小时 值从 0 到 23.
日 值从 1 到 31.
月 值从 1 到 12.
星期 值从 0 到 6, 0 代表星期日
多个时间可以用逗号隔开，范围可以用连字符给出；* 可以作为通配符，/ 表示每...
```

`concurrencyPolicy`:

- Allow：允许Jobs并发运行(默认)
- Forbid：禁止并发运行，如果上一次运行尚未完成，则跳过下一次运行
- Replace：替换，取消当前正在运行的作业并用新作业替换它

### 示例 yml

pc-cronjob.yml

```java
apiVersion: batch/v1
kind: CronJob
metadata:
  name: pc-cronjob
  namespace: dev
  labels:
    controller: cronjob
spec:
  schedule: "*/1 * * * *"
  jobTemplate:
    metadata:
    spec:
      template:
        spec:
          restartPolicy: Never
          containers:
          - name: counter
            image: busybox:1.30
            command: ["bin/sh","-c","for i in 9 8 7 6 5 4 3 2 1; do echo $i;sleep 3;done"]
```

### 1 创建CronJob

```java
kubectl create -f pc-cronjob.yml
```

### 2 查看 CronJob

```java
kubectl get cronjob -n dev
```

### 3 查看Pod

```java
kubectl get cronjob -n dev
```

### 4 删除 CronJob

```java
kubectl delete -f pc-cronjob.yml
```
