# 13、Kubernetes - 实战：容器资源限制
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/11/13.html
- 分类：容器服务
- 分组：教程目录
## 1、资源限制与资源类型

Kubernetes采用request和limit两种限制类型来对资源进行分配。

- request(资源需求)：即运行Pod的节点必须满足运行Pod的最基本需求才能运行Pod，这就是资源下限。
- limit(资源限额)：即运行Pod期间，可能内存使用量会增加，那最多能使用多少内存，这就是资源上限。

资源类型:

- CPU 的单位是核心数，内存的单位是字节。
- 一个容器申请0.5个CPU，就相当于申请1个CPU的一半，你也可以加个后缀m 表示千分之一的概念。比如说100m的CPU，100毫核的CPU和0.1个CPU是一个意思。
- 内存单位：

K、M、G、T、P、E #通常是以1000为换算标准的。

Ki、Mi、Gi、Ti、Pi、Ei #通常是以1024为换算标准的。

## 2、内存限制

做实验之前，先把上一个实验的环境清空，删除pod、roles、clusterrole、rolebingding、clusterrolebingding、deployment、psp。

为了实验效果，提前给仓库上传了stress镜像

创建目录

编辑pod.yaml文件

```java
apiVersion: v1
kind: Pod
metadata:
  name: memory-demo
spec:
  containers:
  - name: memory-demo
    image: stress
    args:
    - --vm
    - "1"
    - --vm-bytes
    - 200M				%使用200M
    resources:
      requests:
        memory: 50Mi	%下限50M
      limits:
        memory: 100Mi	%上限100M
```

应用pod.yaml文件，很明显pod无法启动，这因为使用的内存超过了上限。可以查看日志

修改pod.yaml文件的上限为300M，

删除上一个pod，重新应用pod.yaml文件，成功创建

## 3、cpu限制

编辑pod1.yaml文件

```java
apiVersion: v1
kind: Pod
metadata:
  name: cpu-demo
spec:
  containers:
  - name: cpu-demo
    image: stress
    resources:
      limits:			%上限10个cpu
        cpu: "10"
      requests:			%下限5个cpu
        cpu: "5"
    args:				%使用2个cpu
    - -c
    - "2"
```

应用pod1.yaml文件，pending状态，因为cpu数量不在限定范围内

kubectl describe pod cpu-demo查看详细信息，cpu限制直接影响调度，调度失败

修改pod1.yaml文件，使其满足cpu要求

删除原来的cpu-demo，重新应用pod1.yaml文件，成功running

## 4、为namespace设置资源限制

LimitRange 在 namespace 中施加的最小和最大内存限制只有在创建和更新 Pod 时才会被应用。改变 LimitRange 不会对之前创建的 Pod 造成影响。可以提供最大最小内存限制以及默认的request 以及limit限制。

编辑limrange.yaml文件

```java
apiVersion: v1
kind: LimitRange
metadata:
  name: limitrange-memory
spec:
  limits:
  - default:
      cpu: 0.5
      memory: 512Mi
    defaultRequest:
      cpu: 0.1
      memory: 256Mi
    max:
      cpu: 1
      memory: 1Gi
    min:
      cpu: 0.1
      memory: 100Mi
    type: Container
```

应用limrange.yaml文件，查看详细信息

注释pod.yaml文件中定义的内存限制，使用limrange.yaml文件中的默认限制

重新应用pod.yaml文件，查看

看到使用了默认的限制

编辑pod.yaml文件，重新打开自定义限制

应用pod.yaml文件创建pod时报错，因为内存规定最低为100Mi，而pod.yaml文件中只写了50Mi，未按照规范

## 5、为namespace设置资源配额

创建的ResourceQuota对象将在default名字空间中添加以下限制：

每个容器必须设置内存请求（memory request），内存限额（memory limit），cpu请求（cpu request）和cpu限额（cpu limit）。

编辑quota.yaml文件

```java
apiVersion: v1
kind: ResourceQuota
metadata:
  name: mem-cpu-demo
spec:
  hard:
    requests.cpu: "1"		%所有容器的CPU请求总额不得超过1 CPU
    requests.memory: 1Gi	%所有容器的内存请求总额不得超过1 GiB
    limits.cpu: "2"			%所有容器的CPU限额总额不得超过2 CPU
    limits.memory: 2Gi		%所有容器的内存限额总额不得超过2 GiB
```

应用quota.yaml文件，创建资源配额

注意有了配额后，创建pod必须指定内存的上限和下限，cpu的上限和下限。如果如下不指定

就会报错

指定了内存的上限和下限，cpu的上限和下限

创建pod，会显示已使用量，

一旦总的使用量即将超出限制量，无法创建pod

## 6、Namespace 配置Pod配额

ResourceQuota也可以限制namespace中运行的Pod数

```java
apiVersion: v1
kind: ResourceQuota
metadata:
  name: pod-demo
spec:
  hard:
    pods: "2"	%限制pod数量为2
```

```java
[root@server1 limit]# kubectl  describe  resourcequotas 	%查看配额
Name:            mem-cpu-demo
Namespace:       default
Resource         Used  Hard
--------         ----  ----
limits.cpu       0     2
limits.memory    0     2Gi
requests.cpu     0     1
requests.memory  0     1Gi
Name:       pod-demo
Namespace:  default
Resource    Used  Hard
--------    ----  ----
pods        1     2		%pod数量限制上限为2个，超出无法建立
```
