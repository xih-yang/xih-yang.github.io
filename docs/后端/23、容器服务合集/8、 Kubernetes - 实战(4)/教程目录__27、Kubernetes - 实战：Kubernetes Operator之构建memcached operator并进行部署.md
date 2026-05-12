# 27、Kubernetes - 实战：Kubernetes Operator之构建memcached operator并进行部署
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/4/27.html
- 分类：容器服务
- 分组：教程目录
## 一、前言

在文章[《二十六：Kubernetes Operator之Operator SDK开发环境构建》](/zhuanlan/container/kubernetes/4/26.html)中，对于Operator的基本原理和开发方法进行了介绍。其实在之前的文章[《六：使用etcd-operator在Kubernetes部署 HA etcd集群》](/zhuanlan/container/kubernetes/4/6.html)和文章[《十一：Kubernetes Mysql Operator方案对比》](/zhuanlan/container/kubernetes/4/11.html)中，已经在生产环境中使用了Operator进行有状态的数据存储服务etcd和Mysql的交付：

其实业界现在已经将Operator作为应用在Kubernetes进行标准化、自动化、规模化部署和交付事实标准，网站[https://operatorhub.io/](https://operatorhub.io/)收集了大量的不同技术和业务方向的Operator，而网站[https://github.com/operator-framework/awesome-operators](https://github.com/operator-framework/awesome-operators)也列举了不少靠谱可用的Operator：

[https://operatorhub.io/](https://operatorhub.io/)

本文将根据例子构建一个memcached operator并进行部署：

## 二、构建Operator

### 2.1 下载代码

```java
cd /root/gowork/src/
git clone https://github.com/operator-framework/operator-sdk-samples.git
cd /root/gowork/src/operator-sdk-samples/memcached-operator
```

### 2.2 修改部分代码逻辑

Operator binary code

```java
/root/gowork/src/operator-sdk-samples/memcached-operator/cmd/manager/main.go 
```

Controller code

```java
/root/gowork/src/memcached-operator/vendor/github.com/operator-framework/operator-sdk-samples/memcached-operator/pkg/controller/memcached/memcached_controller.go 
```

### 2.3 构建

```java
export GOROOT=/usr/lib/golang
export GOPATH=/root/gowork
export GO111MODULE=off
go get -u github.com/golang/dep/cmd/dep
/root/gowork/bin/dep ensure -v
export IMAGE=172.2.2.11:5000/memcached-operator:v0.3.1
operator-sdk build $IMAGE --verbose --image-build-args --no-cache
docker push $IMAGE
```

## 三、部署Operator

### 3.1 部署

```java
sed "s@REPLACE_IMAGE@$IMAGE@g" -i deploy/operator.yaml
kubectl create ns $NAMESPACE
kubectl create -f deploy/crds/cache_v1alpha1_memcached_crd.yaml -n $NAMESPACE
kubectl create -f deploy/service_account.yaml -n $NAMESPACE
kubectl create -f deploy/role.yaml -n $NAMESPACE
kubectl create -f deploy/role_binding.yaml -n $NAMESPACE
kubectl create -f deploy/operator.yaml -n $NAMESPACE
```

cache_v1alpha1_memcached_crd.yaml

```java
apiVersion: apiextensions.k8s.io/v1beta1
kind: CustomResourceDefinition
metadata:
  name: memcacheds.cache.example.com
spec:
  group: cache.example.com
  names:
    kind: Memcached
    listKind: MemcachedList
    plural: memcacheds
    singular: memcached
  scope: Namespaced
  subresources:
    status: {}
  validation:
    openAPIV3Schema:
      description: Memcached is the Schema for the memcacheds API
      properties:
        apiVersion:
          description: 'APIVersion defines the versioned schema of this representation
            of an object. Servers should convert recognized schemas to the latest
            internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources'
          type: string
        kind:
          description: 'Kind is a string value representing the REST resource this
            object represents. Servers may infer this from the endpoint the client
            submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds'
          type: string
        metadata:
          type: object
        spec:
          description: MemcachedSpec defines the desired state of Memcached
          properties:
            size:
              description: Size is the size of the memcached deployment
              format: int32
              type: integer
          required:
          - size
          type: object
        status:
          description: MemcachedStatus defines the observed state of Memcached
          properties:
            nodes:
              description: Nodes are the names of the memcached pods
              items:
                type: string
              type: array
              x-kubernetes-list-type: set
          required:
          - nodes
          type: object
      type: object
  version: v1alpha1
  versions:
  - name: v1alpha1
    served: true
    storage: true
```

### 3.2 查看部署结果

```java
kubectl get pod -n $NAMESPACE
NAME                                  READY   STATUS    RESTARTS   AGE
memcached-operator-57f77b4bd8-dcp7v   1/1     Running   0          8s
```

## 四、部署memcached集群

### 4.1 部署

```java
kubectl apply -f cache_v1alpha1_memcached_cr.yaml -n $NAMESPACE
```

cache_v1alpha1_memcached_cr.yaml

```java
apiVersion: cache.example.com/v1alpha1
kind: Memcached
metadata:
  name: example-memcached
spec:
  Add fields here
  size: 3
```

### 4.2 Operator的日志

### 4.3 修改集群部署参数增加replica：3->7
