# 06、Kubernetes - 实战：Kubernetes的资源对象之Pod控制器的基础
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/12/6.html
- 分类：容器服务
- 分组：教程目录
## 一、pod控制器的介绍

## 1、什么是pod控制器？

自主式Pod对象由调度器绑定至目标工作节点后即由相应节点上的kubelet负责监控其容器的存活性，容器主进程崩溃后，kubelet能够自动重启相应的容器。不过，kubelet对非主进程崩溃类的容器错误却无从感知，这依赖于用户为Pod资源对象自定义的存活性探测（liveness probe）机制，以便kubelet能够探知到此类故障。然而，在Pod对象遭到意外删除，或者工作节点自身发生故障时，又该如何处理呢？kubelet是Kubernetes集群节点代理程序，它在每个工作节点上都运行着一个实例。因而，集群中的某工作节点发生故障时，其kubelet也必将不再可用，于是，节点上的Pod资源的健康状态将无从得到保证，也无法再由kubelet重启。此种场景中的Pod存活性一般要由工作节点之外的Pod控制器来保证。事实上，遭到意外删除的Pod资源的恢复也依赖于其控制器。Pod控制器由master的kube-controller-manager组件提供，常见的此类控制器有ReplicationController、ReplicaSet、Deployment、DaemonSet、StatefulSet、Job和CronJob等，它们分别以不同的方式管理Pod资源对象。实践中，对Pod对象的管理通常都是由某种控制器的特定对象来实现的，包括其创建、删除及重新调度等操作。

Master的各组件中，API Server仅负责将资源存储于etcd中，并将其变动通知给各相关的客户端程序，如kubelet、kube-scheduler、kube-proxy和kube-controller-manager等，kube-scheduler监控到处于未绑定状态的Pod对象出现时遂启动调度器为其挑选适配的工作节点，然而，Kubernetes的核心功能之一还在于要确保各资源对象的当前状态（status）以匹配用户期望的状态（spec），使当前状态不断地向期望状态“和解”（reconciliation）来完成容器应用管理，而这些则是kube-controller-manager的任务。kube-controller-manager是一个独立的单体守护进程，然而它包含了众多功能不同的控制器类型分别用于各类和解任务.

## 2、常用的pod控制器

pod控制器是K8s的一个抽象概念，用于更高级层次对象，部署和管理Pod

常用工作负载控制器：

```java
Deployment：无状态应用部署
StatefulSet：有状态应用部署
DaemonSet：确保所有Node运行同一个Pod
Job：一次性任务
Cronjob：定时任务
```

## 3、控制器的作用

```java
管理Pod对象
使用标签与Pod关联
控制器实现了Pod的运维，例如滚动更新、伸缩、副本管理、维护Pod状态等。
```

## 二、deployment

## 1、deployment的介绍

Deployment（简写为deploy）是Kubernetes控制器的又一种实现，它构建于ReplicaSet控制器之上，可为Pod和ReplicaSet资源提供声明式更新。相比较而言，Pod和ReplicaSet是较低级别的资源，它们很少被直接使用。

Deployment控制器为 Pod 和 ReplicaSet 提供了一个声明式更新的方法，在Deployment对象中描述一个期望的状态，Deployment控制器就会按照一定的控制速率把实际状态改成期望状态，通过定义一个Deployment控制器会创建一个新的ReplicaSets控制器，通过replicaset创建pod，删除Deployment控制器，也会删除Deployment控制器下对应的ReplicaSet控制器和pod资源

Deployment控制器资源的主要职责同样是为了保证Pod资源的健康运行，其大部分功能均可通过调用ReplicaSet控制器来实现，同时还增添了部分特性。

```java
事件和状态查看：必要时可以查看Deployment对象升级的详细进度和状态。·
回滚：升级操作完成后发现问题时，支持使用回滚机制将应用返回到前一个或由用户指定的历史记录中的版本上。·
版本记录：对Deployment对象的每一次操作都予以保存，以供后续可能执行的回滚操作使用。·
暂停和启动：对于每一次升级，都能够随时暂停和启动。·
多种自动更新方案：一是Recreate，即重建更新机制，全面停止、删除旧有的Pod后用新版本替代；另一个是RollingUpdate，即滚动升级机制，逐步替换旧有的Pod至新的版本。
Deployment可以用来管理蓝绿发布的情况，建立在rs之上的，一个Deployment可以管理多个rs，有多个rs存在，但实际运行的只有一个，当你更新到一个新版本的时候，只是创建了一个新的rs，把旧的rs替换掉了
```

rs的v1控制三个pod，删除一个，在rs的v2上重新建立一个，依次类推，直到全部都是由rs2控制，如果rs v2有问题，还可以回滚，Deployment是建构在rs之上的，多个rs组成一个Deployment，但是只有一个rs处于活跃状态。

Deployment默认保留10个历史版本。

Deployment可以使用声明式定义，直接在命令行通过纯命令的方式完成对应资源版本的内容的修改，也就是通过打补丁的方式进行修改；Deployment能提供滚动式自定义自控制的更新；对Deployment来讲，我们在实现更新时还可以实现控制更新节奏和更新逻辑，什么叫做更新节奏和更新逻辑呢？

比如说ReplicaSet控制5个pod副本，pod的期望值是5个，但是升级的时候需要额外多几个pod，那么我们控制器可以控制在5个pod副本之外还能再增加几个pod副本；比方说能多一个，但是不能少，那么升级的时候就是先增加一个，再删除一个，增加一个删除一个，始终保持pod副本数是5个，但是有个别交叉之间是6个；还有一种情况，最多允许多一个，最少允许少一个，也就是最多6个，最少4个，第一次加一个，删除两个，第二次加两个，删除两个，依次类推，可以自己控制更新方式，这种是滚动更新的，需要加readinessProbe和livenessProbe探测，确保pod中容器里的应用都正常启动了才删除之前的pod；启动的第一步，刚更新第一批就暂停了也可以；假如目标是5个，允许一个也不能少，允许最多可以10个，那一次加5个即可；这就是我们可以自己控制节奏来控制更新的方法

应用场景：网站、API、微服务

## 2、deployment的部署

编写deployment.yml

```java
apiVersion: apps/v1
kind: Deployment类型为deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 3 副本数
  selector:   匹配标签，必须与template中定义的标签一样
    matchLabels:
      app: nginx
  template:   定义pod模板
    metadata:
      labels:
        app: nginx pod的标签与deployment选择的标签一致
    spec:定义容器
      containers:
      - name: nginx
        image: nginx:1.14.2
        imagePullPolicy: IfNotPresent
        ports:
        - name: http
          containerPort: 80
        livenessProbe:
          initialDelaySeconds: 3
          periodSeconds: 10
          httpGet:
            port: 80
            path: /index.html
        readinessProbe:
          initialDelaySeconds: 3
          periodSeconds: 10
          httpGet:
            port: 80
            path: /index.html
```

运行deployment

```java
root@k8s-master1:/apps/k8s-yaml/deployment-case# kubectl apply -f nginx-deploy.yaml 
deployment.apps/nginx-deployment created
```

查看deployment和pod信息

```java
#1、创建deployment
root@k8s-master01:/apps/k8s-yaml/deployment-case# kubectl get deployments -n default
NAME               READY   UP-TO-DATE   AVAILABLE   AGE
nginx-deployment   3/3     3            3           54s
#2、deployment创建replicasets
root@k8s-master01:/apps/k8s-yaml/deployment-case# kubectl get replicasets -n default
NAME                          DESIRED   CURRENT   READY   AGE
nginx-deployment-657df44b4f   3         3         3       82s
#3、replicasets再创建pod
root@k8s-master01:/apps/k8s-yaml/deployment-case# kubectl get pod -n default
NAME                                READY   STATUS    RESTARTS   AGE
nginx-deployment-657df44b4f-hk8x5   1/1     Running   0          109s
nginx-deployment-657df44b4f-mcw7v   1/1     Running   0          109s
nginx-deployment-657df44b4f-vv2wh   1/1     Running   0          109s
#deployment的名称为nginx-deployment
#replicasets的名称为deployment名称后添加随机数nginx-deployment-5899cb477c
#pod的名称为replicasets名称后再添加随机数nginx-deployment-5899cb477c-6dd2x nginx-deployment-5899cb477c-8j2fr nginx-deployment-5899cb477c-jst94 。
#因此deployment的创建顺序为deployment--->replicasets--->pod
```

## 3、使用deployment对pod升级

```java
更新deployment.yml文件，再kubectl apply -f nginx-deploy.yml即可
把nginx镜像文件从1.14.2升级为1.16.0
副本数量改为5个
root@k8s-master01:/apps/k8s-yaml/deployment-case# vim nginx-deploy.yml 
apiVersion: apps/v1
kind: Deployment类型为deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 5 修改副本数
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
        image: nginx:1.16.0更改镜像文件
        ports:
        - containerPort: 80
root@k8s-master01:/apps/k8s-yaml/deployment-case# cp nginx-deploy.yml  nginx-deploy.yml.bak
#注意：变更deployment.yml时，注意保存原文件。
root@k8s-master01:/apps/k8s-yaml/deployment-case# kubectl apply -f nginx-deploy.yaml 
deployment.apps/nginx-deployment configured
#deployment副本数变了5个
root@k8s-master01:/apps/k8s-yaml/deployment-case# kubectl get deployments -n default
NAME               READY   UP-TO-DATE   AVAILABLE   AGE
nginx-deployment   5/5     5            5           10m
#replicasets已经更新也变了5个，老的在一段时间后会自动消失
root@k8s-master01:/apps/k8s-yaml/deployment-case# kubectl get replicasets -n default
NAME                          DESIRED   CURRENT   READY   AGE
nginx-deployment-657df44b4f   0         0         0       11m
nginx-deployment-9fc7f565     5         5         5       95s
#pod副本升级为5个
root@k8s-master01:/apps/k8s-yaml/deployment-case# kubectl get pod -n default
NAME                              READY   STATUS    RESTARTS   AGE
nginx-deployment-9fc7f565-8nwng   1/1     Running   0          118s
nginx-deployment-9fc7f565-cg99d   1/1     Running   0          2m28s
nginx-deployment-9fc7f565-cxcn8   1/1     Running   0          2m28s
nginx-deployment-9fc7f565-czdnm   1/1     Running   0          2m28s
nginx-deployment-9fc7f565-tgqwh   1/1     Running   0          118s
#查看pod的image也升级了nginx:1.16.0
root@k8s-master01:/apps/k8s-yaml/deployment-case# kubectl describe pod nginx-deployment-9fc7f565-8nwng|grep "Image"
    Image:          nginx:1.16.0
    Image ID:       docker-pullable://nginx@sha256:3e373fd5b8d41baeddc24be311c5c6929425c04cabf893b874ac09b72a798010
root@k8s-master01:/apps/k8s-yaml/deployment-case#  kubectl rollout history deployment nginx-deployment
deployment.apps/nginx-deployment 
REVISION  CHANGE-CAUSE
1         <none> 创建deployment
2         <none> 第一次升级deployment
注意: v1.20之前的版本需要使用deployment做回滚的时候，需要在创建deployment时添加"--record"参数
root@k8s-master01:/apps/k8s-yaml/deployment-case# kubectl apply -f nginx-deploy.yaml --record
```

deployment对pod升级默认为滚动升级：也是K8s对Pod升级的默认策略，通过使用新版本Pod逐步更新旧版本Pod，实现零停机发布，用户无感知。

## 4、deployment滚动升级策略

vimroll-deploy.yml

```java
apiVersion: apps/v1
kind: Deployment 
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 5 
  revisionHistoryLimit: 10 RS历史版本保存数量
  selector:    
    matchLabels:
      app: nginx
 滚动升级策略
  strategy:
    rollingUpdate:
     maxSurge：滚动更新过程中最大Pod副本数，确保在更新时启动的Pod数量比期望（replicas）Pod数量最大多出25%
      maxSurge: 25% 
     maxUnavailable：滚动更新过程中最大不可用Pod副本数，确保在更新时最大25%Pod数量不可用，即确保75%Pod数量是可用状态。
      maxUnavailable: 25%
    type: RollingUpdate 类型为滚动升级
  template:   
    metadata:
      labels:
        app: nginx  
    spec:
      containers:
      - name: nginx
        image: nginx:1.18.0
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 80
```

执行升级

```java
#将nginx镜像该为nginx:1.18.0来升级roll-deploy.yaml
root@k8s-master01:/apps/k8s-yaml/deployment-case# kubectl apply -f roll-deploy.yaml 
deployment.apps/roll-deployment configured
root@k8s-master01:/apps/k8s-yaml/deployment-case# kubectl get deployments roll-deployment -n default
NAME              READY   UP-TO-DATE   AVAILABLE   AGE
roll-deployment   5/5     5            5           4m53s
root@k8s-master01:/apps/k8s-yaml/deployment-case#  kubectl get replicasets -n default
NAME                         DESIRED   CURRENT   READY   AGE
roll-deployment-67dfd6c8f9   5         5         5       42s
roll-deployment-75d4475c89   0         0         0       3m38s
NAME                               READY   STATUS    RESTARTS   AGE
roll-deployment-67dfd6c8f9-59cv2   1/1     Running   0          112s
roll-deployment-67dfd6c8f9-cqgn8   1/1     Running   0          2m19s
roll-deployment-67dfd6c8f9-jlkbs   1/1     Running   0          112s
roll-deployment-67dfd6c8f9-vdxjh   1/1     Running   0          2m19s
roll-deployment-67dfd6c8f9-x5dhc   1/1     Running   0          2m18s
root@k8s-master01:/apps/k8s-yaml/deployment-case# kubectl describe deployments roll-deployment 
Name:                   roll-deployment
Namespace:              default
CreationTimestamp:      Sat, 02 Oct 2021 21:04:50 +0800
Labels:                 app=nginx
Annotations:            deployment.kubernetes.io/revision: 2
Selector:               app=nginx
Replicas:               5 desired | 5 updated | 5 total | 5 available | 0 unavailable
StrategyType:           RollingUpdate
MinReadySeconds:        0
RollingUpdateStrategy:  25% max unavailable, 25% max surge
Pod Template:
  Labels:  app=nginx
  Containers:
   nginx:
    Image:        nginx:1.18.0
    Port:         80/TCP
    Host Port:    0/TCP
    Environment:  <none>
    Mounts:       <none>
  Volumes:        <none>
Conditions:
  Type           Status  Reason
  ----           ------  ------
  Available      True    MinimumReplicasAvailable
  Progressing    True    NewReplicaSetAvailable
OldReplicaSets:  <none>
NewReplicaSet:   roll-deployment-67dfd6c8f9 (5/5 replicas created)
Events:
  Type    Reason             Age    From                   Message
  ----    ------             ----   ----                   -------
  Normal  ScalingReplicaSet  5m41s  deployment-controller  Scaled up replica set roll-deployment-75d4475c89 to 5
  Normal  ScalingReplicaSet  2m45s  deployment-controller  Scaled up replica set roll-deployment-67dfd6c8f9 to 2
  Normal  ScalingReplicaSet  2m45s  deployment-controller  Scaled down replica set roll-deployment-75d4475c89 to 4
  Normal  ScalingReplicaSet  2m44s  deployment-controller  Scaled up replica set roll-deployment-67dfd6c8f9 to 3
  Normal  ScalingReplicaSet  2m18s  deployment-controller  Scaled down replica set roll-deployment-75d4475c89 to 3
  Normal  ScalingReplicaSet  2m18s  deployment-controller  Scaled up replica set roll-deployment-67dfd6c8f9 to 4
  Normal  ScalingReplicaSet  2m18s  deployment-controller  Scaled down replica set roll-deployment-75d4475c89 to 2
  Normal  ScalingReplicaSet  2m18s  deployment-controller  Scaled up replica set roll-deployment-67dfd6c8f9 to 5
  Normal  ScalingReplicaSet  2m14s  deployment-controller  Scaled down replica set roll-deployment-75d4475c89 to 1
  Normal  ScalingReplicaSet  2m10s  deployment-controller  (combined from similar events): Scaled down replica set roll-deployment-75d4475c89 to 0
```

## 5、deployment的水平扩容

```java
方法一：命令（不推荐）
kubectl scale deployment web --replicas=10
方法二：编写deployment.yml
修改yaml里replicas值，再kubectl apply -f deploment.yml
#注意：保留原deployment.yml文件
```

replicas参数控制Pod副本数量

## 6、deployment的回滚

```java
kubectl rollout history deployments roll-deploy 查看历史发布版本
kubectl rollout undo deployments roll-deploy 回滚上一个版本
kubectl rollout undo deployments roll-deploy --to-revision=2 回滚历史指定版本
注：回滚是重新部署某一次部署时的状态，即当时版本所有配置
建议：编写deployment.yml文件，再kubectl apply -f deployment.yml
注意保存deployment.yml原文件
因为kubectl rollout history deployments roll-deploy 无法查看当前pod的具体信息
```

## 7、deployment的删除

```java
方法一：
kubectl delete -f deployment.yml
方法二：
kubectl delete deployments roll-deploy
```

## 8、Deployment：ReplicaSet

ReplicaSet控制器用途：

　　Pod副本数量管理，不断对比当前Pod数量与期望Pod数量

　　Deployment每次发布都会创建一个RS作为记录，用于实现回滚

```java
kubectl get rs查看RS记录
root@k8s-master01:/apps/k8s-yaml/deployment-case# kubectl get rs -n default
NAME                         DESIRED   CURRENT   READY   AGE
roll-deployment-67dfd6c8f9   5         5         5       10m
roll-deployment-75d4475c89   0         0         0       13m
kubectl rollout history deployment roll-deploy版本对应RS记录
root@k8s-master01:/apps/k8s-yaml/deployment-case# kubectl rollout history deployments roll-deployment -n default
deployment.apps/roll-deployment 
REVISION  CHANGE-CAUSE
3         <none>
4         <none>
```

## 9、金丝雀发布升级

Deployment资源允许用户控制更新过程中的滚动节奏，例如“暂停”或“继续”更新操作，尤其是借助于前文讲到的maxSurge和maxUnavailable属性还能实现更为精巧的过程控制。例如，在第一批新的Pod资源创建完成后立即暂停更新过程，此时，仅有一小部分新版本的应用存在，主体部分还是旧的版本。然后，通过应用层路由机制根据请求特征精心筛选出小部分用户的请求路由至新版本的Pod应用，并持续观察其是否能稳定地按期望方式运行。默认，Service只会随机或轮询地将用户请求分发给所有的Pod对象。确定没有问题后再继续进行完余下的所有Pod资源的滚动更新，否则便立即回滚至第一步更新操作。这便是所谓的金丝雀部署。

为了尽可能降低对现有系统及其容量的影响，基于Deployment的金丝雀发布过程通常建议采用“先增后减且可用Pod对象总数不低于期望值”的方式进行。首次添加的Pod对象数量取决于其接入的第一批请求的规则及单个Pod的承载能力，视具体需求而定，为了能更简单地说明问题，接下来采用首批添加1个Pod资源的方式。我们将Deployment控制器的maxSurge属性的值设置为1，并将maxUnavailable属性的值设置为0就能完成设定。

roll-deploy.yaml

```java
apiVersion: apps/v1
kind: Deployment
metadata:
  name: roll-deployment
  labels:
    app: nginx
spec:
  replicas: 3
  revisionHistoryLimit: 10 RS历史版本保存数量
  selector:
    matchLabels:
      app: nginx
 滚动升级策略
  strategy:
    rollingUpdate:
     maxSurge：滚动更新过程中最大Pod副本数，确保在更新时启动的Pod数量比期望（replicas）Pod数量最大多出25%
      maxSurge: 1
     maxUnavailable：滚动更新过程中最大不可用Pod副本数，确保在更新时最大25%Pod数量不可用，即确保75%Pod数量是可用状态。
      maxUnavailable: 0
    type: RollingUpdate 类型为滚动升级
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.16.0
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 80
```

运行清单

```java
root@k8s-master01:/apps/k8s-yaml/deployment-case# kubectl apply -f roll-deploy.yaml 
deployment.apps/roll-deployment created
root@k8s-master01:/apps/k8s-yaml/deployment-case# kubectl get pod
NAME                               READY   STATUS    RESTARTS   AGE
roll-deployment-75d4475c89-4hbkg   1/1     Running   0          72s
roll-deployment-75d4475c89-bdt8k   1/1     Running   0          72s
roll-deployment-75d4475c89-f8jxn   1/1     Running   0          72s
root@k8s-master01:/apps/k8s-yaml/deployment-case# kubectl get deployments.apps 
NAME              READY   UP-TO-DATE   AVAILABLE   AGE
roll-deployment   3/3     3            3           2m22s
```

使用金丝雀升级

```java
#将nginx1.16.0升级为nginx1.18.0
#升级
#kubectl set image deployment roll-deployment nginx=nginx:1.18.0 -n default 
#暂定升级
#kubectl rollout pause deployment roll-deployment -n default
#继续升级
#kubectl rollout resume  deployment roll-deployment -n default
#升级失败回滚
#kubectl rollout undo deployments roll-deployment -n default
#1）升级depolymnet
root@k8s-master01:/apps/k8s-yaml/deployment-case# kubectl set image deployment roll-deployment nginx=nginx:1.18.0 -n default
deployment.apps/roll-deployment image updated
#2）暂定升级
root@k8s-master01:/apps/k8s-yaml/deployment-case# kubectl rollout pause deployment roll-deployment -n default
deployment.apps/roll-deployment paused
#3）验正
root@k8s-master01:/apps/k8s-yaml/deployment-case# kubectl get deployments.apps roll-deployment 
NAME              READY   UP-TO-DATE   AVAILABLE   AGE
roll-deployment   4/3     2            4           8m37s
#按照升级策略临时新增一个deploymnet
root@k8s-master01:/apps/k8s-yaml/deployment-case# kubectl get pod
NAME                               READY   STATUS    RESTARTS   AGE
roll-deployment-67dfd6c8f9-5w9d9   1/1     Running   0          2m58s
roll-deployment-67dfd6c8f9-jwj52   1/1     Running   0          2m57s
roll-deployment-75d4475c89-4hbkg   1/1     Running   0          10m
roll-deployment-75d4475c89-f8jxn   1/1     Running   0          10m
#pod也会临时新增一个
#升级了2个pod，新老版本暂时共存
#新版本
root@k8s-master01:/apps/k8s-yaml/deployment-case# kubectl describe pod roll-deployment-67dfd6c8f9-5w9d9
......
 Image:          nginx:1.18.0
......
#老版本
root@k8s-master01:/apps/k8s-yaml/deployment-case# kubectl describe pod roll-deployment-75d4475c89-f8jxn
......
 Image:          nginx:1.16.0
......
#4）升级测试没有问题继续升级
root@k8s-master01:/apps/k8s-yaml/deployment-case# kubectl rollout resume  deployment roll-deployment -n default
deployment.apps/roll-deployment resumed
#5）升级测试失败则直接回滚
root@k8s-master01:/apps/k8s-yaml/deployment-case# kubectl rollout undo deployments roll-deployment -n default
```

## 三、DaemonSet

## 1、DaemonSet介绍

DaemonSet是Pod控制器的又一种实现，用于在集群中的全部节点上同时运行一份指定的Pod资源副本，后续新加入集群的工作节点也会自动创建一个相关的Pod对象，当从集群移除节点时，此类Pod对象也将被自动回收而无须重建。管理员也可以使用节点选择器及节点标签指定仅在部分具有特定特征的节点上运行指定的Pod对象。

DaemonSet是一种特殊的控制器，它有特定的应用场景，通常运行那些执行系统级操作任务的应用，其应用场景具体如下。·运行集群存储的守护进程，如在各个节点上运行glusterd或ceph。·在各个节点上运行日志收集守护进程，如fluentd和logstash。·在各个节点上运行监控系统的代理守护进程，如Prometheus Node Exporter、collectd、Datadog agent、New Relic agent或Ganglia gmond等。当然，既然是需要运行于集群内的每个节点或部分节点，于是很多场景中也可以把应用直接运行为工作节点上的系统级守护进程，不过，这样一来就失去了运用Kubernetes管理所带来的便捷性。另外，也只有必须将Pod对象运行于固定的几个节点并且需要先于其他Pod启动时，才有必要使用DaemonSet控制器，否则就应该使用Deployment控制器。

DaemonSet功能：

在每一个Node上运行一个Pod

新加入的Node也同样会自动运行一个Pod应用场景：网络插件（kube-proxy、calico）、其他Agent。

## 2、在每个node上部署一个日志采集

编写daemonset.yml

```java
apiVersion: apps/v1
kind: DaemonSet类型为Daemonset
metadata:
  name: filebeat
  namespace: kube-system
spec:
  selector:
    matchLabels:
      name: filebeat
  template:
    metadata:
      labels:
        name: filebeat
    spec:
      containers:
      - name: log
        image: elastic/filebeat:7.3.2
```

运行daemonset.yml

```java
root@k8s-master01:/apps/k8s-yaml/deployment-case# kubectl apply -f daemonset.yaml 
daemonset.apps/filebeat created
root@k8s-master01:/apps/k8s-yaml/deployment-case# kubectl get pod -n kube-system -o wide|grep filebeat
filebeat-4z59k                             1/1     Running   0          3m37s   172.20.32.129    172.168.33.207   <none>           <none>
filebeat-d2hfc                             1/1     Running   0          3m37s   172.20.135.162   172.168.33.212   <none>           <none>
filebeat-jdqdl                             1/1     Running   0          3m37s   172.20.122.130   172.168.33.209   <none>           <none>
filebeat-mg6nb                             1/1     Running   0          3m37s   172.20.85.249    172.168.33.210   <none>           <none>
filebeat-vzkt9                             1/1     Running   0          3m37s   172.20.58.212    172.168.33.211   <none>           <none>
filebeat-wlxnv                             1/1     Running   0          3m37s   172.20.122.129   172.168.33.208   <none>           <none>
```

会自动的在每个节点上部署一个fIlebeat的pod，有新增节点该pod会自动在新节点上部署，有节点需要下线，该pod会自动从下线节点删除。

## 四、Job

## 1、Job的介绍

Job控制器用于调配Pod对象运行一次性任务，容器中的进程在正常运行结束后不会对其进行重启，而是将Pod对象置于“Completed”（完成）状态。若容器中的进程因错误而终止，则需要依配置确定重启与否，未运行完成的Pod对象因其所在的节点故障而意外终止后会被重新调度。

应用场景：离线数据处理，视频解码等业务。

## 2、Job的部署

编写job.yml

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

运行job.yml

```java
root@k8s-master01:/apps/k8s-yaml/deployment-case# kubectl apply -f job.yml 
job.batch/pi created
root@k8s-master01:/apps/k8s-yaml/deployment-case# kubectl get job -o wide
NAME   COMPLETIONS   DURATION   AGE   CONTAINERS   IMAGES   SELECTOR
pi     1/1           52s        82s   pi           perl     controller-uid=461170f9-603e-4cdc-8af8-b206b8dbab8f
root@k8s-master01:/apps/k8s-yaml/deployment-case# kubectl describe job/pi
Name:           pi
Namespace:      default
Selector:       controller-uid=461170f9-603e-4cdc-8af8-b206b8dbab8f
Labels:         controller-uid=461170f9-603e-4cdc-8af8-b206b8dbab8f
                job-name=pi
Annotations:    <none>
Parallelism:    1
Completions:    1
Start Time:     Tue, 13 Apr 2021 16:43:54 +0800
Completed At:   Tue, 13 Apr 2021 16:44:46 +0800
Duration:       52s
Pods Statuses:  0 Running / 1 Succeeded / 0 Failed
Pod Template:
  Labels:  controller-uid=461170f9-603e-4cdc-8af8-b206b8dbab8f
           job-name=pi
  Containers:
   pi:
    Image:      perl
    Port:       <none>
    Host Port:  <none>
    Command:
      perl
      -Mbignum=bpi
      -wle
      print bpi(2000)
    Environment:  <none>
    Mounts:       <none>
  Volumes:        <none>
Events:
  Type    Reason            Age   From            Message
  ----    ------            ----  ----            -------
  Normal  SuccessfulCreate  109s  job-controller  Created pod: pi-7nbgv
  Normal  Completed         57s   job-controller  Job completed
root@k8s-master01:/apps/k8s-yaml/deployment-case# kubectl get pod
NAME                                READY   STATUS      RESTARTS   AGE
pi-7nbgv                            0/1     Completed   0          2m56s
#该pod pi-7nbgv已经执行成功
[root@k8s-master01 apps]# kubectl logs pi-7nbgv
3.14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651328230664709384460955058223172535940812848111745028410270193852110555964462294895。。。。。。
```

## 五、CronJob

## 1、CronJob的介绍

CronJob控制器用于管理Job控制器资源的运行时间。Job控制器定义的作业任务在其控制器资源创建之后便会立即执行，但CronJob可以以类似于Linux操作系统的周期性任务作业计划（crontab）的方式控制其运行的时间点及重复运行的方式，具体如下。·在未来某时间点运行作业一次。·在指定的时间点重复运行作业。CronJob对象支持使用的时间格式类似于Crontab，略有不同的是，CronJob控制器在指定的时间点时，“”和“*”的意义相同，都表示任何可用的有效值。

CronJob用于实现定时任务，像Linux的Crontab一样。•定时任务应用场景：通知，备份

## 2、CronJob部署

每分钟输出一个hello

编写cronjob.yml

```java
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
            imagePullPolicy: IfNotPresent
            command:
            - /bin/sh
            - -c
            - date; echo Hello from the Kubernetes cluster
          restartPolicy: OnFailure
```

运行cronjob

```java
root@k8s-master01:/apps/k8s-yaml/deployment-case# kubectl apply -f cronjob.yml 
cronjob.batch/hello created
root@k8s-master01:/apps/k8s-yaml/deployment-case# kubectl get pod
NAME                                READY   STATUS      RESTARTS   AGE
hello-1618304040-mr2v5              0/1     Completed   0          49s
root@k8s-master01:/apps/k8s-yaml/deployment-case# kubectl logs hello-1618304040-mr2v5
Tue Apr 13 08:54:02 UTC 2021
Hello from the Kubernetes cluster
#每分钟会执行一次
root@k8s-master01:/apps/k8s-yaml/deployment-case# kubectl get pod
NAME                                READY   STATUS      RESTARTS   AGE
hello-1618304040-mr2v5              0/1     Completed   0          2m40s
hello-1618304100-mzcs9              0/1     Completed   0          100s
hello-1618304160-hf56t              0/1     Completed   0          39s
root@k8s-master01:/apps/k8s-yaml/deployment-case# kubectl describe cronjob hello
。。。。。。
Events:
  Type    Reason            Age    From                Message
  ----    ------            ----   ----                -------
  Normal  SuccessfulCreate  5m17s  cronjob-controller  Created job hello-1618304040
  Normal  SawCompletedJob   5m7s   cronjob-controller  Saw completed job: hello-1618304040, status: Complete
  Normal  SuccessfulCreate  4m17s  cronjob-controller  Created job hello-1618304100
  Normal  SawCompletedJob   4m7s   cronjob-controller  Saw completed job: hello-1618304100, status: Complete
  Normal  SuccessfulCreate  3m16s  cronjob-controller  Created job hello-1618304160
  Normal  SawCompletedJob   3m6s   cronjob-controller  Saw completed job: hello-1618304160, status: Complete
  Normal  SuccessfulCreate  2m16s  cronjob-controller  Created job hello-1618304220
  Normal  SuccessfulDelete  2m6s   cronjob-controller  Deleted job hello-1618304040
  Normal  SawCompletedJob   2m6s   cronjob-controller  Saw completed job: hello-1618304220, status: Complete
  Normal  SuccessfulCreate  76s    cronjob-controller  Created job hello-1618304280
  Normal  SawCompletedJob   66s    cronjob-controller  Saw completed job: hello-1618304280, status: Complete
  Normal  SuccessfulDelete  66s    cronjob-controller  Deleted job hello-1618304100
  Normal  SuccessfulCreate  15s    cronjob-controller  Created job hello-1618304340
  Normal  SawCompletedJob   5s     cronjob-controller  Saw completed job: hello-1618304340, status: Complete
  Normal  SuccessfulDelete  5s     cronjob-controller  Deleted job hello-1618304160
```
