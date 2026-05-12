# 03、Kubernetes 实战 - 资源管理
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/3/3.html
- 分类：容器服务
- 分组：教程目录
## 前言

什么是资源？

资源管理是什么？

## 第一节 资源管理

在kubernetes中，所有的内容都抽象为资源，用户需要通过操作资源来管理kubernetes。

kubernetes 的本质上是一个集群系统，用户可以在集群中部署各种服务，所谓的部署服务，其实就是在kubernetes集群中运行一个个的容器，并将指定的程序跑在容器中。

kubernetes的最小单位是pod而不是容器，所以只能将容器部署在**pod**中，而kubernetes一般也不会直接管理pod，而是通过**Pod控制器**来管理Pod

Pod可以提供服务之后，就需要考虑如何访问Pod中服务，kubernetes提供了**Service**资源来实现这个功能。当然，如果Pod中程序的数据需要持久化，kubernetes还提供了各种**存储**系统。

> 学习kubernetes核心，就是为了学习如何对集群中的Pod、Pod控制器、Service、存储等各种资源进行操作

## 第二节 资源管理方式

- 命令式对象管理: 直接使用命令取操作kubernetes资源

```java
kubectl run nginx-pod --image=nginx:1.14-alpine
```

- 命令式对象配置: 通过命令配置和配置文件去操作kubernetes资源

```java
kubectl create/patch -f nginx-pod.yaml
```

- 声明式对象配置: 通过apply命令和配置文件去操作kubernetes资源

```java
kubectl apply -f nginx-pod.yaml
```

类型
操作对象
适用环境
优点
缺点

命令式对象管理
对象
测试
简单
只能操作活动对象，无法审计、跟踪

命令式对象配置
文件
开发
可以审计、跟踪
项目大时，配置文件多，操作麻烦

声明式对象配置
目录
开发
支持目录操作
意外情况难以调试

## 第三节 命令式对象管理

### 1. kubectl 命令

kubectl是kubernetes集群的命令行工具，通过它能够对集群本身进行管理，并能够在集群上进行容器化应用的安装部署。kuberctl 命令的语法如下

```java
kubectl [command] [type] [name] [flags]
```

command: 指定对资源执行的操作，例如create 、get、delete

type : 指定资源类型，比如deploy、pod 、service

name： 指定资源的名称(名称大小写铭感)

flags: 指定额外的可选参数

```java
#查看所有pod
kubectl get pod
#查看某个pod
kubectl get pod pod_name
#查看某个pod，以yaml格式展示结果
kubectl get pod pod_name -o  yaml
```

#### 1.1 基本命令

命令
翻译
作用

create
创建
创建资源

edit
编辑
编辑资源

get
获取
获取资源

patch
获取
更新（修改）资源

delete
删除
删除资源

explain
解释
展示资源文档

#### 1.2 运行/调试

命令
翻译
作用

run
运行
在集群中运行指定镜像

expose
暴露
暴露资源为service

describe
描述
展示资源内部信息

logs
日志
输出容器在pod中的日志

attach
贴附
进入运行中的容器

cp
复制
在pod内外复制文件

rollout
首次展示
管理资源的发布

scale
规模
扩/缩容Pod数量

autoscale
自动调整
自动调整pod数量

#### 1.3 高级命令

命令
翻译
作用

apply
rc
通过文件对资源进行配置

label
标签
更新资源上的标签

#### 1.4. other

命令
翻译
作用

cluster-info
集群
显示集群信息

versionl
版本
显示当前Server和Client的版本

help
帮助
查看帮助，kubectl --help

### 2. 资源分类

#### 2.1 集群资源分类

资源名称
缩写
说明
资源作用

nodes
no
node节点
集群组成部分

namespace
ns
命名空间
隔离Pod

#### 2.2 pod资源

资源名称
缩写
说明
资源作用

pods
po
pod
装载容器的最小单元

#### 2.3 pod资源控制器

资源名称
缩写
说明
资源作用

replicationcontroller
rc

控制pod资源

replicasets
rs

控制pod资源

daemonsets
ds

控制pod资源

jobs

控制pod资源

cronjobs
cj

控制pod资源

horizontalpodautoscalers
hpa

控制pod资源

statefulsets
sts

控制pod资

#### 2.4 服务发现资源

资源名称
缩写
说明
资源作用

services
svc
服务
统一pod对外接口

ingress
ing

统一pod对外接口

### 3. 参数

参数
说明

-A
展示所有

-f
指定文件

-k
处理kustomization目录。此标志不能与-f或-R一起使用。

-L
指定标签lebel

-o
指定输出格式，常用的有json、yaml、wide(详细列表)

-R
递归处理-f，–filename中使用的目录。在需要管理时非常有用

-l
要进行筛选的选择器（只支持标签查询），支持“=”、“=”和“！=”。（例如-l键1=value1，键2=value2）用法示例：kubectl get pod -l “key=value”

-w
持续跟踪命令的状态或者事件变化，类似tail -f功能

-n
指定命名空间,–namepace的缩写

-i
即使未连接任何组件，也要保持pod中容器上的stdin打开。

-t
为pod中的每个容器分配了一个tty。

### 4. 命令演示

```java
# 创建一个namespace
kubectl create namespace dev
# 查看namespace
kubectl get ns
# 在此namespace下创建并运行一个nginx的Pod
kubectl run pod --image=nginx:1.17.1 -n dev
# 查看新创建的pod
kubectl get pods -n dev
# 不指定namespace默认是default
kubectl get pods
#查看pod的详细执行过程
kubectl describe pods pod-cbb995bbf-x28lj -n dev
```

服务部署的执行事件(过程)

```java
#删除pod
kubectl delete pods pod-cbb995bbf-x28lj -n dev
```

```java
#删除namespace
kubectl delete ns dev
```

## 第四节 命令式对象配置

命令式对象配置就是使用命令配合配置文件一起来操作kubenetes资源

**1、** 创建nginxpod.yaml；

```java
apiVersion: v1
kind: Namespace
metadata:
  name: dev
---
apiVersion: v1
kind: Pod
metadata:
  name: nginxpod
  namespace: dev
spec:
  containers:
    - name: nginx-containers
      image: nginx:1.17.1
```

**1、** 执行create命令，创建资源；

```java
kubectl create -f nginxpod.yaml
```

**1、** 执行get命令，查看资源；

```java
kubectl get -f nginxpod.yaml
```

**1、** 执行delete命令，删除资源，此时发现两个资源都被删除了；

```java
kubectl delete -f nginxpod.yaml
```

> 命令式对象配置的方式操作资源，可以简单的理解为：命令 + yaml配置文件（里面的各种参数）

## 第五节 声明式对象配置

声明式对象配置跟命令式对象配置很相似，但是它只有一个命令apply

```java
#首先执行一次kubectl apply -f xxx.yaml ，发现创建了资源
kubectl apply -f nginxpod.yaml
```

```java
#再次执行一次kubectl apply -f xxx.yaml ，发现资源没有变动
kubectl apply -f nginxpod.yaml
```

> 声明式对象配置就是使用apply描述一个资源最终的状态
>
> 使用apply操作资源
>
> +如果资源不存在，就创建，相当于kubectl create
>
> +如果资源已存在，就更新，相当于kubectl patch

## 第六节 kubectl可以在node节点上运行吗？

node节点是不能执行kubectl命令的。

kubectl的运行是需要进行配置的，它的配置文件是$HOME/.kube，如果想要在node节点运行此命令，需要将master上的.kube文件复制到node节点上，即为master节点上执行下面的操作

```java
scp -r ~/.kube node1:~/           复制./kube到node1 
scp -r $HOME/.kube node2:$HOME/   复制./kube到node2 
```

再次在node1节点下执行kubectl命令，发现可以执行了。

## 第七节 三种方式应用总结

- **创建/更新资源**

使用声明式对象配置kubectl apply -f xxx.yaml
- **删除资源**

使用命令式对象配置 kubectl delete -f xxx.yaml
- **查询资源**

使用命令式对象管理kubectl get/describe 资源名
