# 23、Kubernetes 实战 - 布署 nodejs 后端项目（中）
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/2/23.html
- 分类：容器服务
- 分组：教程目录
## 一，前言

上一篇，介绍了 nodejs 后端项目的布署（将后端项目构建成为 docker 镜像，并推送至镜像仓库）；

部署后端之前，需要完成一下操作：

1，配置数据库连接信息、数据库账号，使项目连接到数据库；

2，配置私有镜像仓库认证信息；

本篇，后端项目连接数据库；

## 二，配置数据库连接信息

```java
// config/config.prod.js
module.exports = () => {
  const userConfig = {
    mysql: {
      client: {
        host: process.env.MYSQL_HOST,
        port: process.env.MYSQL_PORT,
        database: process.env.MYSQL_DATABASE,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
      },
      app: true,
      agent: false,
    }
  };
  console.log(userConfig);
  return {
    ...userConfig,
  };
};
```

需要配置 5 个数据库相关信息：主机名、端口号、db、用户名、密码，其中：

- 主机名、端口号、db 不敏感，无需加密可以放到 configMap 中；
- 用户名、密码比较敏感，需要放到会加密的 Secret 中；

备注：包含用户名、密码的 Secret 前面已经创建可以直接使用；

还需要再创建一个 configMap：

创建ConfigMap ：mysql.config.yaml

```java
[root@k8s-master cicd]# vi mysql.config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: mysql-config
data:
  host: "service-cicd-mysql"  通过服务名访问之前定义的mysql服务
  port: "8899"内部访问端口
  database: "cicd"
// 有一个警告，没关系
[root@k8s-master cicd]# kubectl apply -f mysql.config.yaml
Warning: resource configmaps/mysql-config is missing the kubectl.kubernetes.io/last-applied-configuration annotation which is required by kubectl apply. kubectl apply should only be used on resources created declaratively by either kubectl create --save-config or kubectl apply. The missing annotation will be patched automatically.
configmap/mysql-config configured
// 由于和之前的mysql-config重名了，所以被创建到了之前的mysql-config中
[root@k8s-master cicd]# kubectl get cm
NAME                DATA   AGE
env-from-dir        2      2d4h
env-from-file       1      2d4h
kube-root-ca.crt    1      16d
mysql-config        5      2d4h
mysql-config-file   2      2d4h
[root@k8s-master cicd]# kubectl get cm -o yaml
- apiVersion: v1
  data:
    MYSQL_HOST: 127.0.0.1
    MYSQL_PORT: "3306"
    database: cicd
    host: service-cicd-mysql
    port: "8899"
// 删除之前的相关configMap
[root@k8s-master cicd]# kubectl delete cm env-from-dir
configmap "env-from-dir" deleted
[root@k8s-master cicd]# kubectl delete cm env-from-file
configmap "env-from-file" deleted
[root@k8s-master cicd]# kubectl delete cm mysql-config
configmap "mysql-config" deleted
[root@k8s-master cicd]# kubectl delete cm mysql-config-file
configmap "mysql-config-file" deleted
// 删逛了
[root@k8s-master cicd]# kubectl get cm
NAME               DATA   AGE
kube-root-ca.crt   1      16d
// 重新 apply mysql-config
[root@k8s-master cicd]# kubectl apply -f mysql.config.yaml
configmap/mysql-config created
// mysql-config有 3 个 key
[root@k8s-master cicd]# kubectl get cm
NAME               DATA   AGE
kube-root-ca.crt   1      16d
mysql-config       3      63s
[root@k8s-master cicd]# kubectl get cm -o yaml
- apiVersion: v1
  data:
    database: cicd
    host: service-cicd-mysql
    port: "8899"
```

## 三，配置数据库账号信息

Secret 之前已经创建好了，可以直接使用;

```java
[root@k8s-master cicd]# kubectl get secret mysql-auth -o yaml
apiVersion: v1
data:
  password: MTIzNDU2
  username: cm9vdA==
kind: Secret
metadata:
  creationTimestamp: "2022-01-07T01:49:33Z"
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
    time: "2022-01-07T01:49:33Z"
  name: mysql-auth
  namespace: default
  resourceVersion: "2031029"
  uid: 4b2f060f-2b8c-4f4d-803a-daec20fe50fc
type: Opaque
[root@k8s-master cicd]# echo MTIzNDU2 | base64 -d
123456
[root@k8s-master cicd]# echo cm9vdA== | base64 -d
root
```

参考创建方式：

```java
vi mysql-auth.yaml
apiVersion: v1
kind: Secret
metadata:
  name: mysql-auth
stringData:
  username: root
  password: 13456
type: Opaque
kubectl apply -f  mysql.config.yaml
```

这样，主机名、端口号、db、用户名、密码就都齐备了；

## 四，私有仓库认证

当需要登陆私服拉取镜像时，需要进行私有仓库的认证；

创建secret docker-registry：private-registry

备注：docker-registry 是关键字，代表私有镜像仓库认证

```java
kubectl create secret docker-registry private-registry \
--docker-username=admin \
--docker-password=Wz@19880818 \
--docker-email=admin@example.org \
--docker-server=47.94.92.122:8082
// 实际操作
root[root@k8s-master cicd]# kubectl create secret docker-registry private-registry\
> --docker-username=admin \
> --docker-password=Wz@19880818 \
> --docker-email=admin@example.org \
> --docker-server=47.94.92.122:8082
secret/private-registry created
[root@k8s-master cicd]# kubectl get secret private-registry
NAME               TYPE                             DATA   AGE
private-registry   kubernetes.io/dockerconfigjson   1      87s
[root@k8s-master cicd]# kubectl get secret private-registry -o yaml
apiVersion: v1
data:
  .dockerconfigjson: eyJhdXRocyI6eyI0Ny45NC45Mi4xMjI6ODA4MiI6eyJ1c2VybmFtZSI6ImFkbWluIiwicGFzc3dvcmQiOiJXekAxOTg4MDgxOCIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5vcmciLCJhdXRoIjoiWVdSdGFXNDZWM3BBTVRrNE9EQTRNVGc9In19fQ==
kind: Secret
metadata:
  creationTimestamp: "2022-01-07T08:30:32Z"
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
    time: "2022-01-07T08:30:32Z"
  name: private-registry
  namespace: default
  resourceVersion: "2065620"
  uid: a0d963ea-4857-41e6-8240-6352e849d410
type: kubernetes.io/dockerconfigjson
[root@k8s-master cicd]# echo eyJhdXRocyI6eyI0Ny45NC45Mi4xMjI6ODA4MiI6eyJ1c2VybmFtZSI6ImFkbWluIiwicGFzc3dvcmQiOiJXekAxOTg4MDgxOCIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5vcmciLCJhdXRoIjoiWVdSdGFXNDZWM3BBTVRrNE9EQTRNVGc9In19fQ== | base64 -d
{"auths":{"47.94.92.122:8082":{"username":"admin","password":"Wz@19880818","email":"admin@example.org","auth":"YWRtaW46V3pAMTk4ODA4MTg="}}}
```

接下来，就可以部署后端服务了；

需要为后端后台服务创建 Deployment 部署对象 和 后端服务的 Service 服务对象；

## 五，结尾

本篇，介绍了部署后端之前，需要的配置信息准备；

下一篇，部署后端项目；
