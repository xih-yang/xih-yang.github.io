# 14、Kubernetes 实战 - Secret 对象的简介与创建
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/2/14.html
- 分类：容器服务
- 分组：教程目录
## 一，前言

上一篇，介绍了 docker 私有镜像仓库的安装和使用；

本篇，介绍 Secret 对象的创建；

## 二，k8s Secret 简介

Secret 是 Kubernetes 中的一种资源类型，可以用来储存机密信息，如：密码，token，密钥等；

信息被存入 Secret 后，可以通过挂载卷的方式挂载到 Pod 内；

也可以用于存放 docker 私有镜像库的登录名和密码，用于拉取私有镜像使用；

- Opaque 类型;
-

## 三，Opaque 类型

Opaque 类型，一般用于存放密码，密钥等信息，存储格式为 base64；

### 1，通过命令行方式创建

- account 为自定义名称
- –from-literal key=value

```java
// 创建一个通用的秘钥对象，包含两个值：username、password
[root@k8s-master ~]# kubectl create secret generic secret-opaque --from-literal=username=admin --from-literal=password=123456
secret/secret-opaque created
```

查看secret 列表

```java
kubectl get secret
// 实际执行
[root@k8s-master ~]# kubectl get secret
NAME                  TYPE                                  DATA   AGE
default-token-q4qxd   kubernetes.io/service-account-token   3      8d
secret-opaque         Opaque                                2      43s
```

字段
含义

NAME
Secret的名称

TYPE
Secret的类型

DATA
存储内容的数量

AGE
创建到现在的时间

查看指定 secret

```java
//输出yaml格式
kubectl get secret secret-opaque -o yaml
//输出json格式
kubectl get secret secret-opaque -o json
// 实际执行
[root@k8s-master ~]# kubectl get secret secret-opaque -o yaml
apiVersion: v1
data:
  password: MTIzNDU2
  username: YWRtaW4=
kind: Secret
metadata:
  creationTimestamp: "2021-12-30T05:38:01Z"
  managedFields:
  - apiVersion: v1
    fieldsType: FieldsV1
    fieldsV1:
      f:data:
        .: {}
        f:password: {}
        f:username: {}
      f:type: {}
    manager: kubectl-create
    operation: Update
    time: "2021-12-30T05:38:01Z"
  name: secret-opaque
  namespace: default
  resourceVersion: "1042792"
  uid: 23fc82eb-9c31-41d2-8e08-d85bd6267cf9
type: Opaque
```

发现密码 username、password 是 MTIzNDU2，是被 base64 加密了：

```java
// 对 Base64 进行解码
echo MTIzNDU2 | base64 -d
// 实际执行
[root@k8s-master ~]# echo MTIzNDU2 | base64 -d
123456
```

secret 编辑值

```java
// 编辑值
kubectl edit secret secret-opaque 
```

### 2，配置文件创建

secret-opaque-flie.yaml

```java
[root@k8s-master ~]# cd deployment/
[root@k8s-master deployment]# vi secret-opaque-flie.yaml
apiVersion: v1
kind: Secret
metadata:
  name: secret-opaque-flie
stringData:
  username: root
  password: root
type: Opaque
```

应用配置文件

```java
[root@k8s-master deployment]# kubectl apply -f secret-opaque-flie.yaml 
secret/secret-opaque-flie created
[root@k8s-master deployment]# kubectl get secret secret-opaque-flie -o yaml
apiVersion: v1
data:
  password: cm9vdA==
  username: cm9vdA==
kind: Secret
metadata:
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"v1","kind":"Secret","metadata":{"annotations":{},"name":"secret-opaque-flie","namespace":"default"},"stringData":{"password":"root","username":"root"},"type":"Opaque"}
  creationTimestamp: "2021-12-30T05:45:44Z"
  managedFields:
  - apiVersion: v1
    fieldsType: FieldsV1
    fieldsV1:
      f:data:
        .: {}
        f:password: {}
        f:username: {}
      f:metadata:
        f:annotations:
          .: {}
          f:kubectl.kubernetes.io/last-applied-configuration: {}
      f:type: {}
    manager: kubectl-client-side-apply
    operation: Update
    time: "2021-12-30T05:45:44Z"
  name: secret-opaque-flie
  namespace: default
  resourceVersion: "1043462"
  uid: 815da8ac-662c-44c4-930b-b11d1cfdf509
type: Opaque
```

## 四、私有镜像库认证

私有镜像库认证类型，一般用于拉取私有库镜像时使用；

### 1，通过命令行创建

```java
// 创建 secret，类型是 docker-registry，名字是 registry-auth 
kubectl create secret docker-registry registry-auth \
--docker-username=admin \
--docker-password=Wz@19880818 \
--docker-email=admin@example.org \
--docker-server=39.105.212.14:8082
// 实际执行
[root@k8s-master deployment]# kubectl create secret docker-registry registry-auth \
> --docker-username=admin \
> --docker-password=Wz@19880818 \
> --docker-email=admin@example.org \
> --docker-server=39.105.212.14:8082
secret/registry-auth created
```

> 备注：docker-registry 是关键字， 表示类型;

查看私有库密钥组

```java
//查看私有库密钥组
kubectl get secret registry-auth -o yaml
// 实际执行
[root@k8s-master deployment]# kubectl get secret registry-auth -o yaml
apiVersion: v1
data:
  .dockerconfigjson: eyJhdXRocyI6eyIzOS4xMDUuMjEyLjE0OjgwODIiOnsidXNlcm5hbWUiOiJhZG1pbiIsInBhc3N3b3JkIjoiV3pAMTk4ODA4MTgiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUub3JnIiwiYXV0aCI6IllXUnRhVzQ2VjNwQU1UazRPREE0TVRnPSJ9fX0=
kind: Secret
metadata:
  creationTimestamp: "2021-12-30T05:52:35Z"
  managedFields:
  - apiVersion: v1
    fieldsType: FieldsV1
    fieldsV1:
      f:data:
        .: {}
        f:.dockerconfigjson: {}
      f:type: {}
    manager: kubectl-create
    operation: Update
    time: "2021-12-30T05:52:35Z"
  name: registry-auth
  namespace: default
  resourceVersion: "1044058"
  uid: 4e0d8412-e6a2-4edb-80a7-23128687c42c
type: kubernetes.io/dockerconfigjson
```

```java
// base64 解密
echo [value] | base64 -d
// 实际执行
[root@k8s-master deployment]# echo eyJhdXRocyI6eyIzOS4xMDUuMjEyLjE0OjgwODIiOnsidXNlcm5hbWUiOiJhZG1pbiIsInBhc3N3b3JkIjoiV3pAMTk4ODA4MTgiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUub3JnIiwiYXV0aCI6IllXUnRhVzQ2VjNwQU1UazRPREE0TVRnPSJ9fX0= | base64 -d
{"auths":{"39.105.212.14:8082":{"username":"admin","password":"Wz@19880818","email":"admin@example.org","auth":"YWRtaW46V3pAMTk4ODA4MTg="}}}
[root@k8s-master deployment]# echo YWRtaW46V3pAMTk4ODA4MTg= | base64 -d
admin:Wz@19880818
```

### 2，通过文件创建

registry-auth-file.yaml

```java
vi registry-auth-file.yaml
apiVersion: v1
kind: Secret
metadata:
  name: registry-auth-file
data:
  .dockerconfigjson: eyJhdXRocyI6eyIzOS4xMDUuMjEyLjE0OjgwODIiOnsidXNlcm5hbWUiOiJhZG1pbiIsInBhc3N3b3JkIjoiV3pAMTk4ODA4MTgiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUub3JnIiwiYXV0aCI6IllXUnRhVzQ2VjNwQU1UazRPREE0TVRnPSJ9fX0=
type: kubernetes.io/dockerconfigjson
```

应用配置

```java
kubectl apply -f ./registry-auth-file.yaml
// 实际执行
[root@k8s-master deployment]# kubectl apply -f ./registry-auth-file.yaml
secret/registry-auth-file created
```

查看指定 secret

```java
kubectl get secret registry-auth-file -o yaml
// 实际执行
[root@k8s-master deployment]# kubectl get secret registry-auth-file -o yaml
apiVersion: v1
data:
  .dockerconfigjson: eyJhdXRocyI6eyIzOS4xMDUuMjEyLjE0OjgwODIiOnsidXNlcm5hbWUiOiJhZG1pbiIsInBhc3N3b3JkIjoiV3pAMTk4ODA4MTgiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUub3JnIiwiYXV0aCI6IllXUnRhVzQ2VjNwQU1UazRPREE0TVRnPSJ9fX0=
kind: Secret
metadata:
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"v1","data":{".dockerconfigjson":"eyJhdXRocyI6eyIzOS4xMDUuMjEyLjE0OjgwODIiOnsidXNlcm5hbWUiOiJhZG1pbiIsInBhc3N3b3JkIjoiV3pAMTk4ODA4MTgiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUub3JnIiwiYXV0aCI6IllXUnRhVzQ2VjNwQU1UazRPREE0TVRnPSJ9fX0="},"kind":"Secret","metadata":{"annotations":{},"name":"registry-auth-file","namespace":"default"},"type":"kubernetes.io/dockerconfigjson"}
  creationTimestamp: "2021-12-30T05:58:33Z"
  managedFields:
  - apiVersion: v1
    fieldsType: FieldsV1
    fieldsV1:
      f:data:
        .: {}
        f:.dockerconfigjson: {}
      f:metadata:
        f:annotations:
          .: {}
          f:kubectl.kubernetes.io/last-applied-configuration: {}
      f:type: {}
    manager: kubectl-client-side-apply
    operation: Update
    time: "2021-12-30T05:58:33Z"
  name: registry-auth-file
  namespace: default
  resourceVersion: "1044577"
  uid: c865aeac-daa1-425a-90d3-cfd70446ccb9
type: kubernetes.io/dockerconfigjson
```

查看全部 secret 列表

```java
[root@k8s-master deployment]# kubectl get secret
NAME                  TYPE                                  DATA   AGE
default-token-q4qxd   kubernetes.io/service-account-token   3      8d
registry-auth         kubernetes.io/dockerconfigjson        1      8m12s
registry-auth-file    kubernetes.io/dockerconfigjson        1      2m14s
secret-opaque         Opaque                                2      22m
secret-opaque-flie    Opaque                                2      15m
```

可以看到 registry-auth、 registry-auth-file 是私有镜像仓库类型 kubernetes.io/dockerconfigjson

## 五，结尾

本篇，介绍了两种 Secret 对象的创建；

下一篇，介绍 Secret 对象的使用；
