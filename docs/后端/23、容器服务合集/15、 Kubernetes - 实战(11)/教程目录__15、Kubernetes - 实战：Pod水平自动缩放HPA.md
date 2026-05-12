# 15、Kubernetes - 实战：Pod水平自动缩放HPA
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/11/15.html
- 分类：容器服务
- 分组：教程目录
## 1、什么是HPA？

应用的资源使用率通常都有高峰和低谷的时候，如何削峰填谷，提高集群的整体资源利用率，让service中的Pod个数根据利用情况自动调整呢？这就有赖于HPA（Horizontal Pod Autoscaling）即使Pod水平自动缩放。

Horizontal Pod Autoscaling仅适用于Deployment控制器和ReplicaSet控制器，在V1版本中仅支持根据Pod的CPU利用率扩容与缩容，在v2版本中，支持根据内存和cpu利用率扩容与缩容。HPA需要与metrics配合使用，metrics负责监控cpu和mem数据，然后提供给HPA，HPA根据使用情况自动扩容与缩容。metrics默认只能用cpu和mem两个指标（系统负载），其他监控指标（访问量等等）需要第三方给数据，比如普罗米修斯。

HPA伸缩过程：

- 收集HPA控制下所有Pod最近的cpu使用情况（CPU utilization）
- 对比在扩容条件里记录的cpu限额（CPUUtilization）
- 调整实例数（必须要满足不超过最大/最小实例数）
- 每隔30s做一次自动扩容的判断
- CPU utilization的计算方法是用cpu usage（最近一分钟的平均值，通过metrics可以直接获取到）除以cpu request（这里cpu request就是我们在创建容器时制定的cpu使用核心数）得到一个平均值，这个平均值可以理解为：平均每个Pod CPU核心的使用占比。

HPA进行伸缩算法：

- 计算公式：TargetNumOfPods = ceil(sum(CurrentPodsCPUUtilization) / Target)
- ceil()表示取大于或等于某数的最近一个整数
- 每次扩容后冷却3分钟才能再次进行扩容，而缩容则要等5分钟后。
- 当前Pod Cpu使用率与目标使用率接近时，不会触发扩容或缩容：
- 触发条件：avg(CurrentPodsConsumption) / Target >`1.1 或`<0.9

## 2、HPA部署----cpu

官网文档：[https://kubernetes.io/zh/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/](https://kubernetes.io/zh/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/)

准备镜像，上传到仓库

创建目录hpa，进入

编辑deploy.yaml 文件

```java
apiVersion: apps/v1
kind: Deployment		%创建Deployment控制器
metadata:
  name: php-apache
spec:
  selector:
    matchLabels:
      run: php-apache
  replicas: 1			%副本数为1
  template:
    metadata:
      labels:
        run: php-apache
    spec:
      containers:
      - name: php-apache
        image: hpa-example		镜像是hpa-example
        ports:
        - containerPort: 80
        resources:
          limits:
            cpu: 500m			%cpu上限0.5
          requests:
            cpu: 200m			%cpu下限0.2
---
apiVersion: v1
kind: Service					%创建svc
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

应用deploy.yaml 文件，创建pod和svc

```java
[root@server2 hpa]# kubectl autoscale deployment php-apache --cpu-percent=50 --min=1 --max=10
	%设定HPA控制器，名字叫php-apache,cpu目标使用率是百分之五十，副本最小个数为1，最大个数为10
```

查看pod的cpu使用情况

接下来压力测试，看hpa是否生效，HPA 将增加或者减少 Pod 副本的数量来保持所有 Pod 的平均 CPU 利用率在 50% 左右。

```java
[root@server2 hpa]# kubectl run -i --tty load-generator --rm --image=busybox --restart=Never -- /bin/sh -c "while sleep 0.01; do wget -q -O- http://php-apache; done"
	%每0.01秒访问一次php-apache服务，模拟增加php-apache服务的负荷
```

成功访问一次，出现一个OK！

另外开启一个窗口查看，由于cpu使用率的上升，hpa自动把副本数量提升到6个

现在取消压力测试，大约五分钟过后，副本数量恢复为1。hpa的机制是扩容很迅速，缩容很慢，原因是压力上来了，需要马上扩容，才能应对压力，等压力小了，不能马上缩容，防止压力再次上升，不能及时应对。

## 3、HPA部署----cpu+mem

想要同时监测cpu和mem，v1版本的hpa不能满足，需要使用v2版本，下面不再使用命令的方式，使用yaml文件的格式生成hpa

编辑hpa-v2.yaml 文件

```java
apiVersion: autoscaling/v2beta2
kind: HorizontalPodAutoscaler	%类型是HPA
metadata:
  name: php-apache
spec:
  maxReplicas: 10				%最大副本数10
  minReplicas: 1				%最小副本数1
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: php-apache
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        averageUtilization: 60	%cpu目标使用率是百分之六十
        type: Utilization
  - type: Resource
    resource:
      name: memory
      target:
        averageValue: 50Mi		%mem目标使用大小是50M
        type: AverageValue
```

删除之前的v1版本，应用hpa-v2.yaml 文件产生v2版本的hpa。查看

可以类似上面执行压力测试，这里不再赘述
