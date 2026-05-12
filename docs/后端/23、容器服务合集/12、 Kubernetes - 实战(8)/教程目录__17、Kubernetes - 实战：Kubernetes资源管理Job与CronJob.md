# 17、Kubernetes - 实战：Kubernetes资源管理Job与CronJob
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/8/17.html
- 分类：容器服务
- 分组：教程目录
## 一、Job

- Job分为普通任务（Job） 一次性执行
- 应用场景：离线数据处理，视频解码等业务

官方文档：[https://kubernetes.io/docs/concepts/workloads/controllers/jobs-run-to-completion/](https://kubernetes.io/docs/concepts/workloads/controllers/jobs-run-to-completion/)

**1、** 创建yaml文件；

```java
# vim job.yaml
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
        计算两千位的值
        command: ["perl", "-Mbignum=bpi", "-wle", "print bpi(2000)"]
      重启策略
      restartPolicy: Never
  限制重启的次数
  backoffLimit: 4
```

**2、** 创建容器；

```java
kubectl create -f job.yaml
```

**3、** 查看容器；

```java
kubectl get pods
NAME READY STATUS RESTARTS AGE
# 计算完成
pi-q8rvl 0/1 Completed 0 4m5s
```

**4、** 执行完成后查看job；

```java
kubectl get job
NAME COMPLETIONS DURATION AGE
pi 1/1 91s 106s
```

**5、** 查看日志；

```java
kubectl logs pi-q8rvl
3.141592653589793238462643383279502884197169399375105820974944592307816406286208998628034825342117067982148086513...............
```

**6、** 删除方法；

```java
kubectl delete -f job.yaml
```

## 二、CronJob

官方文档：[https://kubernetes.io/docs/tasks/job/automated-tasks-with-cron-jobs/](https://kubernetes.io/docs/tasks/job/automated-tasks-with-cron-jobs/)

- 定时任务，像Linux的Crontab一样。
- 应用场景：通知，备份

### 1.创建一个yaml文件

```java
# vim cronjob.yaml
apiVersion: batch/v1beta1
kind: CronJob
metadata:
  name: hello
spec:
  分时日月周，与crontab语法一样
  schedule: "*/1 * * * *"
  job模板
  jobTemplate:
    spec:
      template:
        spec:
          容器配置
          containers:
          - name: hello
            image: busybox
            到达时间段执行命令
            args:
            - /bin/sh
            - -c
            - date; echo Hello from the Kubernetes cluster
          如果异常退出就重启
          restartPolicy: OnFailure
```

### 2、创建容器

```java
kubectl create -f cronjob.yaml
```

### 3、查看容器

```java
kubectl get pod
NAME READY STATUS RESTARTS AGE
hello-1566882780-t88jl 0/1 Completed 0 71s
```

### 4、查看cronjob

```java
kubectl get cronjob
NAME SCHEDULE SUSPEND ACTIVE LAST SCHEDULE AGE
hello */1 * * * * False 0 <none> 21s
```

### 5、查看日志

```java
kubectl logs hello-1566883020-7hw2s
Tue Aug 27 05:17:10 UTC 2019
Hello from the Kubernetes cluster
```

### 6、删除

```java
kubectl delete -f cronjob.yaml
```
