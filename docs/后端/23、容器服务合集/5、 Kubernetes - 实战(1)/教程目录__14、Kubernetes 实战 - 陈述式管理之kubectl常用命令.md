# 14、Kubernetes 实战 - 陈述式管理之kubectl常用命令
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/1/14.html
- 分类：容器服务
- 分组：教程目录
## 概述

Kubectl 是一个命令行接口，用于对 Kubernetes 集群运行命令。

## 语法

```sh
kubectl [command] [TYPE] [NAME] [flags]
# 查看集群信息
kubectl cluster-info  
```

## get

显示一种或多种资源

```sh
# 用法
$ kubectl get [(-o|--output=)json|yaml|wide|custom-columns=...|custom-columns-file=...|go-template=...|go-template-file=...|jsonpath=...|jsonpath-file=...] (TYPE[.VERSION][.GROUP] [NAME | -l label] | TYPE[.VERSION][.GROUP]/NAME ...) [flags]
```

```sh
# 列出所有不同的资源对象，默认default空间
kubectl get all
# 查看defalut空间下的所有资源 
kubectl get all -n default
# 列出所有节点
kubectl get nodes
# 列出所有节点及详情
kubectl get nodes -o wide 
# 实时查看
kubectl get pods -o wide -w
# 列出所有节点详情及标签信息
kubectl get nodes -o wide --show-labels
# 列出所有命名空间下运行的Pod信息
kubectl get pods --all-namespaces
# 列出所有运行的Pod信息
kubectl get pods
# 列出所有运行的Pod信息及详情
kubectl get pods -o wide
# 列出所有的命令空间
kubectl get namespace
# 列出所有replication controllers和service信息
kubectl get rc,services
# 查看test下的service资源，Cluster IP，Service的直接IP地址，此为虚拟IP地址。外部网络无法ping通，只有kubernetes集群内部访问使用。
kubectl get svc -n test 
```

## create

```sh
# 从文件或标准输入创建资源,接受JSON和YAML格式。
kubectl create -f FILENAME
# 根据aaa.text创建一个名为my-config的configmap
kubectl create configmap my-config --from-file=/root/aaa.text
# 创建一个名为test-namespace的命名空间,可缩写为ns
kubectl create namespace test-namespace
# 在test命名空间下，创建一个名为test-nginx的deployment资源
kubectl create deployment test-nginx --image=daocloud.io/library/nginx:1.7.11  -n test 
```

## run

```sh
# 语法
run NAME --image=image [--env="key=value"] [--port=port] [--replicas=replicas] [--dry-run=bool] [--overrides=inline-json] [--command] -- [COMMAND] [args...]
```

```sh
# 在test-namespace命名空间下创建nginx，执行端口88，副本数为2
kubectl run nginx --image=daocloud.io/library/nginx:1.7.11 --port= 88 --replicas=2 --env="POD_NAMESPACE=test-namespace"
```

## delete

通过配置文件名、stdin、资源名称或label选择器来删除资源。

```sh
# 语法
$ delete ([-f FILENAME] | TYPE [(NAME | -l label | --all)])
# 使用nginx-test.yml中指定的资源类型和名称删除pod
kubectl delete -f ./nginx-test.yml
# 删除一个pod
kubectl delete pod test-nginx-cc44fcc54-hhfgv -n test
# 删除所有的pod
kubectl delete pods --all
# 删除命名空间
kubectl delete namespace test-namespace
```

## describe

输出指定的一个/多个资源的详细信息

```sh
# 语法
kubectl describe TYPE NAME_PREFIX
# 查看名为test-nginx的详细信息
kubectl describe deployment test-nginx -n test
# 查看名为test-nginx的svc的详细信息
kubectl describe svc test-nginx -n test
# deployment名称
Name:                   test-nginx 
# 所属命名空间
Namespace:              test
# 创建时间
CreationTimestamp:      Mon, 02 Nov 2020 22:21:59 +0800
# 标签，此处是默认添加，Label具有严格的命名规则，它定义的是Kubernetes对象的元数据（Metadata），并且用于Label Selector。
Labels:                 app=test-nginx
# Annotation则是用户任意定义的“附加”信息，以便于外部工具进行查找。
Annotations:            deployment.kubernetes.io/revision: 1
# 标签选择器，Kubernetes核心的分组机制，通过label selector客户端/用户能够识别一组有共同特征或属性的资源对象
Selector:               app=test-nginx
# 副本数 期望1，已更新1，总计1个，1个可用，0个不可用
Replicas:               1 desired | 1 updated | 1 total | 1 available | 0 unavailable
# 更新策略-滚动更新（重建(recreate)/滚动更新(rolling-update)蓝绿(blue/green)金丝雀(canary)A/B测(a/b testing)）
StrategyType:           RollingUpdate
# 升级等待时间
MinReadySeconds:        0
# 滚动更新策略，unavailable升级过程中最多有多少个POD处于无法提供服务的状态，surge升级过程中最多可以比原先设置多出的POD数量
RollingUpdateStrategy:  25% max unavailable, 25% max surge
# pod模板
Pod Template:
  标签
  Labels:  app=test-nginx
  容器
  Containers:
   容器nginx
   nginx:
    镜像地址
    Image:        daocloud.io/library/nginx:1.7.11
    Port:         <none>
    Host Port:    <none>
    Environment:  <none>
    Mounts:       <none>
  Volumes:        <none>
Conditions:
  Type           Status  Reason
  ----           ------  ------
  Available      True    MinimumReplicasAvailable
  Progressing    True    NewReplicaSetAvailable
OldReplicaSets:  <none>
NewReplicaSet:   test-nginx-cc44fcc54 (1/1 replicas created)
# 事件
Events:
  Type    Reason             Age   From                   Message
  ----    ------             ----  ----                   -------
  Normal  ScalingReplicaSet  16m   deployment-controller  Scaled up replica set test-nginx-cc44fcc54 to 1
```

## exec

进入容器(很少用，推荐docker exec )

```sh
# 语法
kubectl exec POD [-c CONTAINER] -- COMMAND [args...]
# 
kubectl exec -it  podName -c cName /bin/bash -n test 
```

## expose

将资源暴露为新的Kubernetes Service。

```sh
# 语法
expose (-f FILENAME | TYPE NAME) [--port=port] [--protocol=TCP|UDP] [--target-port=number-or-name] [--name=name] [--external-ip=external-ip-of-service] [--type=type]
# 为deployment的test-nginx创建service，并通过Service的80端口转发至容器的80端口上,service接入点不变
kubectl expose deployment test-nginx --port=80 --target-port=80  -n test
```

## scale

扩容或缩容 Deployment、ReplicaSet、Replication Controller或 Job 中Pod数量。

```sh
# 语法
scale [--resource-version=version] [--current-replicas=count] --replicas=COUNT (-f FILENAME | TYPE NAME)
# 扩容test-nginx为2份
kubectl scale deployment test-nginx --replicas=2 -n test
```
