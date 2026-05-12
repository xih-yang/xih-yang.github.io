# 18、Kubernetes 实战 - 使用 ConfigMap 管理服务的环境变量
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/2/18.html
- 分类：容器服务
- 分组：教程目录
## 一，前言

上一篇，介绍了 k8s 服务发现；

本篇，介绍 k8s ConfigMap 管理服务环境变量；

## 二，服务环境变量的统一管理

前面介绍了 k8s Secret，它的主要作用是用来存放密码、密钥等机密信息；

除了秘钥信息之外，还会有一些配置信息，如：数据库地址；

这些并不属于机密信息，修改相对也会更频繁一些，如果使用 Secret 就不合适了，打包在镜像内耦合又太严重；

这里，就可以使用 Kubernetes ConfigMap 来对服务的环境变量进行统一管理；

## 三，ConfigMap 简介

ConfigMap：意味配置地图或配置对象，与 Secret 功能相似，都用于存储 key-value；

它们的区别在于：

- Secret 存放机密信息，会对数据进行加密；
- ConfigMap 存放配置信息，不会对数据进行加密；

ConfigMap 是 Kubernetes 的一种资源类型，用于存放一些环境变量和配置文件；

信息存入后，可以通过挂载卷的方式挂载到 Pod 内，也可以通过环境变量进行注入；

## 四，创建 ConfigMap

### 1，命令行创建

```java
// 创建 configmap 命令：
kubectl create configmap [config_name] --from-literal=[key]=[value]
// 创建 configmap
[root@k8s-master ~]# kubectl create configmap mysql-config --from-literal=MYSQL_HOST=127.0.0.1 --from-literal=MYSQL_PORT=3306
configmap/mysql-config created
```

需要注意：

- configmap 的名称必须全部小写；
- 特殊符号只能包含 ‘-’ 和 ‘.’；

可以使用此正则表达式校验合规则性：a-z0-9?(.a-z0-9?)*')

```java
// 获取configmap列表
[root@k8s-master ~]# kubectl get cm
NAME               DATA   AGE
kube-root-ca.crt   1      14d
mysql-config       2      84s
[root@k8s-master ~]# kubectl get configmap
NAME               DATA   AGE
kube-root-ca.crt   1      14d
mysql-config       2      92s
// 查看 configmap
[root@k8s-master ~]# kubectl describe cm mysql-config
Name:         mysql-config
Namespace:    default
Labels:       <none>
Annotations:  <none>
Data
====
MYSQL_HOST:
----
127.0.0.1
MYSQL_PORT:
----
3306
Events:  <none>
```

### 2，配置清单创建（通过配置文件创建）

- kind 值为 ConfigMap 表示声明一个 ConfigMap 类型的资源
- metadata.name 代表该 configmap 的名称
- data 是存放数据的地方，数据格式为 key:value

mysql-config-file.yaml

```java
[root@k8s-master ~]# cd deployment/
[root@k8s-master deployment]# vi mysql-config-file.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: mysql-config-file
data:
  MYSQL_HOST: "127.0.0.1"
  MYSQL_PORT: "3306"
[root@k8s-master deployment]# kubectl apply -f mysql-config-file.yaml
configmap/mysql-config-file created
[root@k8s-master deployment]# kubectl get cm
NAME                DATA   AGE
kube-root-ca.crt    1      14d
mysql-config        2      5m45s
mysql-config-file   2      19s
[root@k8s-master deployment]# kubectl describe cm mysql-config-file
Name:         mysql-config-file
Namespace:    default
Labels:       <none>
Annotations:  <none>
Data
====
MYSQL_HOST:
----
127.0.0.1
MYSQL_PORT:
----
3306
Events:  <none>
```

### 3，文件创建

- –from-file代表一个文件
- key是文件在 configmap 内的 key
- file_path 是文件的路径

```java
// 文件创建 configmap 命令
kubectl create configmap [configname] --from-file=[key]=[file_path]
```

创建文件 env.config，包含环境变量信息

```java
// 创建配置文件 env.config
[root@k8s-master deployment]# vi env.config
HOST: 192.168.0.1
PORT: 8080
```

根据文件，创建 configmap：

```java
// 文档中的创建命令
kubectl create configmap env-from-file --from-file=env=./env.config
// 视频中的创建命令
[root@k8s-master deployment]# kubectl create configmap env-from-file --from-file=./env.config
configmap/env-from-file created
```

```java
kubectl get cm env-from-file -o yaml
kubectl get cm env-from-file -o json
[root@k8s-master deployment]# kubectl get cm env-from-file -o json
{
    "apiVersion": "v1",
    "data": {
    		// 发现 env.config.yaml 的文件名 env.config 变成了 key
        "env.config": "HOST: 192.168.0.1\nPORT: 8080\n\n"
    },
    "kind": "ConfigMap",
    "metadata": {
        "creationTimestamp": "2022-01-05T03:33:06Z",
        "managedFields": [
            {
                "apiVersion": "v1",
                "fieldsType": "FieldsV1",
                "fieldsV1": {
                    "f:data": {
                        ".": {},
                        "f:env.config": {}
                    }
                },
                "manager": "kubectl-create",
                "operation": "Update",
                "time": "2022-01-05T03:33:06Z"
            }
        ],
        "name": "env-from-file",
        "namespace": "default",
        "resourceVersion": "1789103",
        "uid": "44aa6e85-53af-42e0-afbf-97bd55b40525"
    }
}
```

发现env.config.yaml 的文件名 env.config 变成了 key

key是文件名，value 是文件内容

但是这种感觉怪怪的，一般不会这样写： “env.config”: “HOST: 192.168.0.1\nPORT: 8080\n\n”

### 4，目录创建

- 可以将一个目录下的文件整个存入进去

```java
// 目录创建 configmap 命令
kubectl create configmap [configname] --from-file=[dir_path]
```

创建目录和配置文件

```java
[root@k8s-master deployment]# mkdir config
[root@k8s-master deployment]# cd config
[root@k8s-master config]# echo 127.0.0.1 > HOST
[root@k8s-master config]# echo 3306 > PORT
[root@k8s-master config]# ls
HOST  PORT
[root@k8s-master config]# cat HOST
127.0.0.1
[root@k8s-master config]# cat PORT
3306
[root@k8s-master config]# pwd
/root/deployment/config
```

```java
// 目录创建 configmap
[root@k8s-master deployment]# kubectl create configmap env-from-dir --from-file=./config
configmap/env-from-dir created
[root@k8s-master deployment]# kubectl get cm env-from-dir
NAME           DATA   AGE
env-from-dir   2      36s
[root@k8s-master deployment]# kubectl get cm env-from-dir -o json
{
    "apiVersion": "v1",
    "data": {
        "HOST": "127.0.0.1\n",
        "PORT": "3306\n"
    },
    "kind": "ConfigMap",
    "metadata": {
        "creationTimestamp": "2022-01-05T03:40:06Z",
        "managedFields": [
            {
                "apiVersion": "v1",
                "fieldsType": "FieldsV1",
                "fieldsV1": {
                    "f:data": {
                        ".": {},
                        "f:HOST": {},
                        "f:PORT": {}
                    }
                },
                "manager": "kubectl-create",
                "operation": "Update",
                "time": "2022-01-05T03:40:06Z"
            }
        ],
        "name": "env-from-dir",
        "namespace": "default",
        "resourceVersion": "1789715",
        "uid": "cb32b9e8-9a4b-4124-a7b9-4d000a0a0207"
    }
}
```

这种格式就舒服了：

```java
    "data": {
        "HOST": "127.0.0.1\n",
        "PORT": "3306\n"
    },
```

## 五，使用 ConfigMap

### 1，环境变量注入

### 2，存储卷挂载

## 六，结尾

本篇，介绍了使用 ConfigMap 管理服务环境变量；

下一篇，介绍 k8s 污点管理；
