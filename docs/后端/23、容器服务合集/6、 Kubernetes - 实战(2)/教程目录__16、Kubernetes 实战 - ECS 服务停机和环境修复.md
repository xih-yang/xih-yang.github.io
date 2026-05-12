# 16、Kubernetes 实战 - ECS 服务停机和环境修复
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/2/16.html
- 分类：容器服务
- 分组：教程目录
## 一，前言

上一篇，介绍了 Secret 镜像的使用；

三台服务每天大概 15 块钱的支出，用一个月也是不少钱；

闲时可以停掉，这样每天只有 4 块钱支出，剩下一大笔；

ECS服务停机后公网 IP 会变化，所以使用到公网 IP 的地方都需要重新配置，恢复环境；

本篇，介绍 ECS 停机后重启的环境修复；

> 备注：只涉及到目前未知的配置，后续章节可能会新增其他配置项，全部完成之后再补充一篇熊进行说明；

## 二，ci-service 服务器重启问题

ci-service 服务器停机后重启：

1，导致公网 IP 变化：39.105.212.14 -> 47.94.92.122；

2，服务器重启后：docker 镜像仓库无法访问；

## 三，环境修复

### 1，启动 docker 私有镜像仓库

```java
[root@iZ2ze7rkgit9zoa18pxu73Z ~]# cd /usr/local/nexus-3.29.0-02/bin/
[root@iZ2ze7rkgit9zoa18pxu73Z bin]# ./nexus start
WARNING: ************************************************************
WARNING: Detected execution as "root" user.  This is NOT recommended!
WARNING: ************************************************************
Starting nexus
```

[http://47.94.92.122:8081/](http://47.94.92.122:8081/) 可以正常访问私有镜像仓库，登录后查看镜像正常

### 2，更新公网 ip

ci-service 服务器公网 IP 变化：39.105.212.14 -> 47.94.92.122；

需要更新所有使用私有库镜像的 yaml 配置文件：

#### 1，ci-service 的 jenkins 构建脚本更新，推送镜像到私有仓库部分

修改前脚本

```java
// 更新前
#！/bin/sh -l
npm install --registry=https://registry.npm.taobao.org
npm run build
time=$(date "+%Y%m%d%H%M%s")
docker build -t 39.105.212.14:8082/vue-project:$time .
docker login -u $DOCKER_LOGIN_USERNAME -p $DOCKER_LOGIN_PASSWORD 39.105.212.14:8082
docker push 39.105.212.14:8082/vue-project:$time
```

修改前，构建失败

修改后脚本

```java
// 更新后
#！/bin/sh -l
npm install --registry=https://registry.npm.taobao.org
npm run build
time=$(date "+%Y%m%d%H%M%s")
docker build -t 47.94.92.122:8082/vue-project:$time .
docker login -u $DOCKER_LOGIN_USERNAME -p $DOCKER_LOGIN_PASSWORD 47.94.92.122:8082
docker push 47.94.92.122:8082/vue-project:$time
```

修改后，构建成功，配置修改为正确

#### 2，docker 配置更新，更新私有库注册列表

```java
// 解决 http 问题
[root@iZ2ze7rkgit9zoa18pxu73Z ~]# vi /etc/docker/daemon.json 
// 添加不安全的仓库地址：insecure-registries
{
  "insecure-registries":["47.94.92.122:8082"],
  "registry-mirrors": ["https://fwvjnv59.mirror.aliyuncs.com"]
}
// 重启 docker
[root@iZ2ze7rkgit9zoa18pxu73Z bin]# systemctl restart docker
```

后面的贴过来，不测试了：

```java
// 测试镜像推送
[root@iZ2ze7rkgit9zoa18pxu73Z ~]# docker push 39.105.212.14:8082/vue-project:2021123011191640834385
The push refers to repository [39.105.212.14:8082/vue-project]
530879695cfc: Preparing 
b0a31e56a1ef: Preparing 
332fa54c5886: Preparing 
6ba094226eea: Preparing 
6270adb5794c: Preparing 
unauthorized: access to the requested resource is not authorized
// 解决授权问题：登录
[root@iZ2ze7rkgit9zoa18pxu73Z ~]# docker login 39.105.212.14:8082
Username: admin
Password: 
WARNING! Your password will be stored unencrypted in /root/.docker/config.json.
Configure a credential helper to remove this warning. See
https://docs.docker.com/engine/reference/commandline/login/#credentials-store
Login Succeeded
// 再次推送镜像，成功
[root@iZ2ze7rkgit9zoa18pxu73Z ~]# docker push 39.105.212.14:8082/vue-project:2021123011191640834385
The push refers to repository [39.105.212.14:8082/vue-project]
530879695cfc: Pushed 
b0a31e56a1ef: Pushed 
332fa54c5886: Pushed 
6ba094226eea: Pushing  15.42MB/54.05MB
6270adb5794c: Pushing  14.13MB/55.28MB
```

#### 3，更新已生成的 Sercet 中的 docker-server

涉及“私有镜像库认证”使用的 Sercet :

- 命令行创建的 Sercet : registry-auth
- 通过文件创建的 Sercet : registry-auth-file.yaml

1）命令行创建的Sercet : registry-auth

```java
// 原始 Sercet 的创建命令
[root@k8s-master deployment]# kubectl create secret docker-registry registry-auth \
 --docker-username=admin \
 --docker-password=****** \
 --docker-email=admin@example.org \
 --docker-server=39.105.212.14:8082
secret/registry-auth created
// 查询、删除、重新创建
[root@k8s-master ~]# kubectl get secret
NAME                  TYPE                                  DATA   AGE
default-token-q4qxd   kubernetes.io/service-account-token   3      12d
registry-auth         kubernetes.io/dockerconfigjson        1      4d8h
registry-auth-file    kubernetes.io/dockerconfigjson        1      4d8h
secret-opaque         Opaque                                2      4d8h
secret-opaque-flie    Opaque                                2      4d8h
// 删除
[root@k8s-master ~]# kubectl delete secret registry-auth
secret "registry-auth" deleted]
// 重新创建
[root@k8s-master ~]# kubectl create secret docker-registry registry-auth \
  --docker-username=admin \
  --docker-password=****** \
  --docker-email=admin@example.org \
  --docker-server=47.94.92.122:8082
secret/registry-auth created
```

2）registry-auth-file.yaml

```java
// 原始 Sercet 的创建
vi registry-auth-file.yaml
apiVersion: v1
kind: Secret
metadata:
  name: registry-auth-file
data:
  .dockerconfigjson: eyJhdXRocyI6eyIzOS4xMDUuMjEyLjE0OjgwODIiOnsidXNlcm5hbWUiOiJhZG1pbiIsInBhc3N3b3JkIjoiV3pAMTk4ODA4MTgiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUub3JnIiwiYXV0aCI6IllXUnRhVzQ2VjNwQU1UazRPREE0TVRnPSJ9fX0=
type: kubernetes.io/dockerconfigjson
```

查看registry-auth，使用 .dockerconfigjson 更新：

```java
// 读取
[root@k8s-master deployment]# kubectl get secret registry-auth -o yaml
apiVersion: v1
data:
  .dockerconfigjson: eyJhdXRocyI6eyI0Ny45NC45Mi4xMjI6ODA4MiI6eyJ1c2VybmFtZSI6ImFkbWluIiwicGFzc3dvcmQiOiJXekAxOTg4MDgxOCIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5vcmciLCJhdXRoIjoiWVdSdGFXNDZWM3BBTVRrNE9EQTRNVGc9In19fQ==
kind: Secret
metadata:
  creationTimestamp: "2022-01-03T14:33:48Z"
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
    time: "2022-01-03T14:33:48Z"
  name: registry-auth
  namespace: default
  resourceVersion: "1594980"
  uid: 06e43c6e-7e40-4d42-ad5a-427fd0698747
type: kubernetes.io/dockerconfigjson
// 解码验证
[root@k8s-master deployment]# echo eyJhdXRocyI6eyI0Ny45NC45Mi4xMjI6ODA4MiI6eyJ1c2VybmFtZSI6ImFkbWluIiwicGFzc3dvcmQiOiJXekAxOTg4MDgxOCIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5vcmciLCJhdXRoIjoiWVdSdGFXNDZWM3BBTVRrNE9EQTRNVGc9In19fQ== | base64 -d
{"auths":{"47.94.92.122:8082":{"username":"admin","password":"******","email":"admin@example.org","auth":"YWRtaW46V3pAMTk4ODA4MTg="}}}
// 修改
[root@k8s-master deployment]# vi registry-auth-file.yaml
apiVersion: v1
kind: Secret
metadata:
  name: registry-auth-file
data:
  .dockerconfigjson: eyJhdXRocyI6eyI0Ny45NC45Mi4xMjI6ODA4MiI6eyJ1c2VybmFtZSI6ImFkbWluIiwicGFzc3dvcmQiOiJXekAxOTg4MDgxOCIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5vcmciLCJhdXRoIjoiWVdSdGFXNDZWM3BBTVRrNE9EQTRNVGc9In19fQ==
type: kubernetes.io/dockerconfigjson
// 生效
[root@k8s-master deployment]# kubectl apply -f registry-auth-file.yaml 
secret/registry-auth-file configured
// 读取
[root@k8s-master deployment]# kubectl get secret registry-auth-file -o yaml
apiVersion: v1
data:
  .dockerconfigjson: eyJhdXRocyI6eyI0Ny45NC45Mi4xMjI6ODA4MiI6eyJ1c2VybmFtZSI6ImFkbWluIiwicGFzc3dvcmQiOiJXekAxOTg4MDgxOCIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5vcmciLCJhdXRoIjoiWVdSdGFXNDZWM3BBTVRrNE9EQTRNVGc9In19fQ==
kind: Secret
metadata:
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"v1","data":{".dockerconfigjson":"eyJhdXRocyI6eyI0Ny45NC45Mi4xMjI6ODA4MiI6eyJ1c2VybmFtZSI6ImFkbWluIiwicGFzc3dvcmQiOiJXekAxOTg4MDgxOCIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5vcmciLCJhdXRoIjoiWVdSdGFXNDZWM3BBTVRrNE9EQTRNVGc9In19fQ=="},"kind":"Secret","metadata":{"annotations":{},"name":"registry-auth-file","namespace":"default"},"type":"kubernetes.io/dockerconfigjson"}
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
  resourceVersion: "1595453"
  uid: c865aeac-daa1-425a-90d3-cfd70446ccb9
type: kubernetes.io/dockerconfigjson
// 验证
[root@k8s-master deployment]# echo eyJhdXRocyI6eyI0Ny45NC45Mi4xMjI6ODA4MiI6eyJ1c2VybmFtZSI6ImFkbWluIiwicGFzc3dvcmQiOiJXekAxOTg4MDgxOCIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5vcmciLCJhdXRoIjoiWVdSdGFXNDZWM3BBTVRrNE9EQTRNVGc9In19fQ== | base64 -d
{"auths":{"47.94.92.122:8082":{"username":"admin","password":"******","email":"admin@example.org","auth":"YWRtaW46V3pAMTk4ODA4MTg="}}}
```

修改后，重新生效配置，并查看 Sercet 内容完成验证；

#### 4，更新 deployment-v4.yaml 的镜像地址

```java
[root@k8s-master deployment]# vi deployment-v4.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: v4    修改
spec:
  selector:
    matchLabels:
      app: v4 修改
  replicas: 1
  template:
    metadata:
      labels:
        app: v4修改
    spec: 
      containers:
      - name: vue-project
        image: 47.94.92.122:8082/vue-project:2021123011191640834385  修改
        ports:
        - containerPort: 80
[root@k8s-master deployment]# kubectl apply -f deployment-v4.yaml
deployment.apps/v4 configured
[root@k8s-master deployment]# kubectl get pods
NAME                       READY   STATUS             RESTARTS   AGE
user-v1-84bdcc465b-vxvl2   1/1     Running            0          4d7h
v4-57b4cf7fd9-zcl45        0/1     ImagePullBackOff   0          4d7h
v4-fb4cd75f5-bf2pf         0/1     ErrImagePull       0          33s
[root@k8s-master deployment]# kubectl describe pod v4-fb4cd75f5-bf2pf
Events:
  Type     Reason     Age                From               Message
  ----     ------     ----               ----               -------
  Normal   Scheduled  67s                default-scheduler  Successfully assigned default/v4-fb4cd75f5-bf2pf to k8s-node
  Normal   Pulling    28s (x3 over 66s)  kubelet            Pulling image "47.94.92.122:8082/vue-project:2021123011191640834385"
  Warning  Failed     16s (x3 over 66s)  kubelet            Failed to pull image "47.94.92.122:8082/vue-project:2021123011191640834385": rpc error: code = Unknown desc = Error response from daemon: Get "https://47.94.92.122:8082/v2/": http: server gave HTTP response to HTTPS client
  Warning  Failed     16s (x3 over 66s)  kubelet            Error: ErrImagePull
  Normal   BackOff    4s (x3 over 66s)   kubelet            Back-off pulling image "47.94.92.122:8082/vue-project:2021123011191640834385"
  Warning  Failed     4s (x3 over 66s)   kubelet            Error: ImagePullBackOff
```

生效配置，进入pod验证拉取镜像时，实际访问的镜像地址：47.94.92.122 修改生效

#### 5，本地镜像仓库列表

删除无效的老地址镜像

```java
[root@iZ2ze7rkgit9zoa18pxu73Z bin]# docker image ls
REPOSITORY                       TAG                      IMAGE ID       CREATED       SIZE
39.105.212.14:8082/vue-project   2021123011191640834385   cf09bb54e87e   4 days ago    110MB
39.105.212.14:8082/vue-project   2021123011461640835990   cf09bb54e87e   4 days ago    110MB
39.105.212.14:8082/vue-project   2022010316221641198128   cf09bb54e87e   4 days ago    110MB
47.94.92.122:8082/vue-project    2022010316241641198261   cf09bb54e87e   4 days ago    110MB
cicdproject                      latest                   2e9269d7c724   2 weeks ago   110MB
node                             latest                   058747996654   4 weeks ago   992MB
nginx                            1.15                     53f3fd8007f7   2 years ago   109MB
```

## 四，结尾

本篇，介绍了 ci-server 服务器重启后的环境修复；

下一篇，介绍 k8s 的服务间调用，k8s 服务发现；
