# 23、Kubernetes 实战 - 控制器之Job/CronJob
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/1/23.html
- 分类：容器服务
- 分组：教程目录
## Job 概念

Job会创建一个或者多个 Pods，并确保指定数量的 Pods 成功终止。 随着 Pods 成功结束，Job 跟踪记录成功完成的 Pods 个数。 当数量达到指定的成功个数阈值时，任务（即 Job）结束。 删除 Job 的操作会清除所创建的全部 Pods。

一种简单的使用场景下，你会创建一个 Job 对象以便以一种可靠的方式运行某 Pod 直到完成。 当第一个 Pod 失败或者被删除（比如因为节点硬件失效或者重启）时，Job 对象会启动一个新的 Pod。

你也可以使用 Job 以并行的方式运行多个 Pod。

## 创建Job

```sh
# 计算 π 到小数点后 2000 位，并将结果打印出来。 此计算大约需要 10 秒钟完成。
kubectl create -f job.yaml
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
# 查看
kubectl describe jobs/pi
# 
kubectl logs jobs/pi
```

**注意事项**

•spec.template 格式同 Pod

•RestartPolicy仅支持 Never或 OnFailure

•单个Pod时，默认Pod成功运行后Job即结束

•.spec.completions标志Job结束需要成功运行的Pod个数，默认为1

•.spec.parallelism标志并行运行的Pod的个数，默认为1

•spec.activeDeadlineSeconds标志失敗Pod的重试最大时间，超过这个时间不会继续重试

## CronJob

你可以使用 CronJob 创建一个在指定时间/日期运行的 Job，类似于 UNIX 系统上的 cron 工具。所有 CronJob 的 schedule 中所定义的时间，都是基于 master 所在时区来进行计算的。

## CronJob创建

```sh
vim cronjob.yaml
#  每分钟，打印一次当前时间并输出 hello world 信息
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
            image: busybox
            args:
            - /bin/sh
            - -c
            - date; echo Hello from the Kubernetes cluster
          restartPolicy: OnFailure
kubectl create -f cronjob.yaml
# 查看
kubectl get cronjob hello
kubectl get jobs --watch
```
