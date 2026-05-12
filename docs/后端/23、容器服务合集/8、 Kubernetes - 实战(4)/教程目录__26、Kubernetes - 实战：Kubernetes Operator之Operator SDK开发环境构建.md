# 26、Kubernetes - 实战：Kubernetes Operator之Operator SDK开发环境构建
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/4/26.html
- 分类：容器服务
- 分组：教程目录
## 一、前言

[Kubernetes Operator](https://coreos.com/operators/)是由coreos公司提出的一个概念，旨在对Kubernetes的CRD概念进行系统化和框架化的有机组合。CRD是对Kubernetes平台的扩展机制，一个CRD加上其处理逻辑可以很容易将一个新功能/资源扩展到Kubernetes平台，比如你可以定义一个CRD使得Kubernetes可以直接按照你的要求“启动一个POD-打印helloworld-退出”。

但是单个CRD所定义的能力是有限的，在正常生产环境中的需求会需要多种资源、多种动作、多种状态交叉管理，这时候就需要多种CRD进行有机的面向业务的组合，而Operator正好就是为了满足这样的需求而提出的一个概念，将资源定义、资源部署、资源运维等工作的规则、标准和经验整合在一个或者一组控制器里面。我觉得此处祭出CS科学领域的一个基本哲学概念比较合适：

通过这一次的抽象，资源的整个运维工作有了自动化的可能，为资源全生命周期的自动化打下了坚实的基础，打开了资源管理和运维的新空间。

Kubernetes Operator的Controller凝结了对资源定义的理解、资源的部署的流程和资源运维的经验，可以在低运维成本的状态下标准化的、自动化的、规模化的交付和管理带有复杂状态的资源和服务：

CoreOS为Operator的开发提供了一个[Operator SDK](https://sdk.operatorframework.io/)，使得Kubernetes和Devops的开发者可以快速构建一个Operator，该Operator SDK也可以在github找到：[https://github.com/operator-framework/operator-sdk](https://github.com/operator-framework/operator-sdk)。整个Operator的概念除了SDK还包括更多的内容，统称[Operator Framework](https://github.com/operator-framework) ：

- Operator SDK：开发框架
- Operator Lifecycle Manager：Operator的安装、更新和生命周期管理
- Operator Metering：使用情况报告

## 二、安装GO和Operator SDK

根据Operator SDK github上的描述，SDK借助controller-runtime来为Operator的开发提供如下便利：

- High level APIs and abstractions to write the operational logic more intuitively
- Tools for scaffolding and code generation to bootstrap a new project fast
- Extensions to cover common operator use cases

### 2.1 在CentOS安装GO

```java
yum install -y golang
mkdir /root/gowork/
export GOPATH=/root/gowork/
export GOROOT=/usr/lib/golang
```

### 2.2 安装operator-sdk

获取依赖和源代码：

```java
cd gowork/
go get -u github.com/golang/dep/cmd/dep
go get -u github.com/operator-framework/operator-sdk
cd ~/gowork/src/github.com/operator-framework/operator-sdk
```

编译和安装：

```java
make
cp build/operator-sdk /usr/local/bin/
```

## 三、编译一个例子Operator：app-operator

### 3.1 GO开发环境准备

```java
export GO111MODULE=on
export GOROOT=/usr/lib/golang
export GOPATH=/root/gowork
```

### 3.2 创建一个Operator框架

```java
cd /root/gowork/
operator-sdk new app-operator --repo github.com/example-inc/app-operator
```

### 3.3 为自定义的资源AppService加入一个新的API

```java
/root/gowork/src/app-operator
operator-sdk add api --api-version=app.example.com/v1alpha1 --kind=AppService
```

### 3.4 为AppService加入一个controller

```java
operator-sdk add controller --api-version=app.example.com/v1alpha1 --kind=AppService
```

### 3.5 构建app-operator镜像

Enable access to redhat base images

```java
wget http://mirror.centos.org/centos/7/os/x86_64/Packages/python-rhsm-certificates-1.19.10-1.el7_4.x86_64.rpm
rpm2cpio python-rhsm-certificates-1.19.10-1.el7_4.x86_64.rpm | cpio -iv --to-stdout ./etc/rhsm/ca/redhat-uep.pem | tee /etc/rhsm/ca/redhat-uep.pem
```

```java
operator-sdk build 172.2.2.11:5000/example/app-operator
```

```java
docker push 172.2.2.11:5000/example/app-operator
```

## 四、部署app-operator和资源服务

### 4.1 更新部署文件使用刚刚构建的镜像

```java
cd app-operator/
sed -i 's|REPLACE_IMAGE|172.2.2.11:5000/example/app-operator|g' deploy/operator.yaml
```

### 4.2 部署app-operator

```java
kubectl create ns app-operator
# Setup Service Account
kubectl create -f deploy/service_account.yaml  -n app-operator
# Setup RBAC
kubectl create -f deploy/role.yaml  -n app-operator
kubectl create -f deploy/role_binding.yaml  -n app-operator
# Setup the CRD
kubectl create -f deploy/crds/app_v1alpha1_appservice_crd.yaml  -n app-operator
# Deploy the app-operator
kubectl create -f deploy/operator.yaml  -n app-operator
```

operator.yaml

```java
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-operator
spec:
  replicas: 1
  selector:
    matchLabels:
      name: app-operator
  template:
    metadata:
      labels:
        name: app-operator
    spec:
      serviceAccountName: app-operator
      containers:
        - name: app-operator
          Replace this with the built image name
          image: REPLACE_IMAGE
          command:
          - app-operator
          imagePullPolicy: Always
          env:
            - name: WATCH_NAMESPACE
              valueFrom:
                fieldRef:
                  fieldPath: metadata.namespace
            - name: POD_NAME
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name
            - name: OPERATOR_NAME
              value: "app-operator"
```

查看部署结果：

```java
[root@k8s-install-node app-operator]# kubectl get crd  | grep appservices
appservices.app.example.com                       2020-06-04T09:09:12Z
[root@k8s-install-node app-operator]# kubectl get pod -n app-operator
NAME                            READY     STATUS    RESTARTS   AGE
app-operator-5f76bdb47b-lsn4l   1/1     Running   0          15s
```

### 4.3 部署一个AppService资源

```java
# The default controller will watch for AppService objects and create a pod for each CR
kubectl create -f deploy/crds/app_v1alpha1_appservice_cr.yaml  -n app-operator
```

查看部署结果：

```java
kubectl get appservice -n app-operator
NAME                 AGE
example-appservice   32s
kubectl get pod -n app-operator
NAME                            READY   STATUS    RESTARTS   AGE
app-operator-5f76bdb47b-lsn4l   1/1     Running   0          3m
example-appservice-pod          1/1     Running   0          1m
```

Logof controller
