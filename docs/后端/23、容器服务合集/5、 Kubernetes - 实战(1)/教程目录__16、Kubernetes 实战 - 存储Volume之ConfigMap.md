# 16、Kubernetes 实战 - 存储Volume之ConfigMap
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/1/16.html
- 分类：容器服务
- 分组：教程目录
## 卷

容器中的文件在磁盘上是临时存放的，这给容器中运行的特殊应用程序带来一些问题。 首先，当容器崩溃时，kubelet 将重新启动容器，容器中的文件将会丢失——因为容器会以干净的状态重建（docker不会）。 其次，当在一个 Pod 中同时运行多个容器时，常常需要在这些容器之间共享文件。 Kubernetes 抽象出 Volume 对象来解决这两个问题。

## 背景

Docker 也有 Volume 的概念，但对它只有少量且松散的管理。 在 Docker 中，Volume 是磁盘上或者另外一个容器内的一个目录。 直到最近，Docker 才支持对基于本地磁盘的 Volume 的生存期进行管理。 虽然 Docker 现在也能提供 Volume 驱动程序，但是目前功能还非常有限 （例如，截至 Docker 1.7，每个容器只允许有一个 Volume 驱动程序，并且无法将参数传递给卷）。

另一方面，Kubernetes 卷具有明确的生命周期——与包裹它的 Pod 相同。 因此，卷比 Pod 中运行的任何容器的存活期都长，在容器重新启动时数据也会得到保留。 当然，当一个 Pod 不再存在时，卷也将不再存在。 也许更重要的是，Kubernetes 可以支持许多类型的卷，Pod 也能同时使用任意数量的卷。

卷的核心是包含一些数据的目录，Pod 中的容器可以访问该目录。 特定的卷类型可以决定这个目录如何形成的，并能决定它支持何种介质，以及目录中存放什么内容。

使用卷时, Pod 声明中需要提供卷的类型 (.spec.volumes 字段)和卷挂载的位置 (.spec.containers.volumeMounts 字段).

容器中的进程能看到由它们的 Docker 镜像和卷组成的文件系统视图。 Docker 镜像 位于文件系统层次结构的根部，并且任何 Volume 都挂载在镜像内的指定路径上。 卷不能挂载到其他卷，也不能与其他卷有硬链接。 Pod 中的每个容器必须独立地指定每个卷的挂载位置。

## 类型

Kubernetes 支持下列类型的卷：

- awsElasticBlockStore
- azureDisk
- azureFile
- cephfs
- cinder
- configMap
- csi
- downwardAPI
- emptyDir
- fc (fibre channel)
- flexVolume
- flocker
- gcePersistentDisk
- gitRepo (deprecated)
- glusterfs
- hostPath
- iscsi
- local
- nfs
- persistentVolumeClaim
- projected
- portworxVolume
- quobyte
- rbd
- scaleIO
- secret
- storageos
- vsphereVolume

## configMap概述

configMap 资源提供了向 Pod 注入配置数据的方法。 ConfigMap 对象中存储的数据可以被 configMap 类型的卷引用，然后被应用到 Pod 中运行的容器化应用，configmap资源对象会存储在etcd中。

当引用configMap 对象时，你可以简单的在 Volume 中通过它名称来引用。 还可以自定义 ConfigMap 中特定条目所要使用的路径。

## ConfigMap创建

**1、** 使用文件目录创建，目录下所有文件会以键值对形式存放，键为文件名，值为文件内容；

```sh
cd ~
mkdir config-dir && cd config-dir
vim test001.properties
# 添加
user.name=zhangsan
user.age=18
aaa=bbb
vim test002.properties
# 添加
app.name=test
# 根据config-dir文件夹创建名为test-config的configMap
kubectl create configmap test-config --from-file=../config-dir/
# 查看
kubectl get cm test-config -o yaml
```

**1、** 使用文件创建；

```sh
# 根据test002.properties文件创建名为test002-config的configMap
kubectl create configmap test002-config --from-file=./test002.properties
# 查看
kubectl get cm test002-config -o yaml
```

**1、** 字面值创建；

```sh
# 创建
kubectl create configmap literal-config --from-literal=user.name=lisi --from-literal=user.age=48
# 查看
kubectl get cm literal-config -o yaml
```

**1、** yml配置文件创建；

```sh
# 创建配置
vim yaml-config.yaml
# 添加内容
apiVersion: v1
kind: ConfigMap
metadata:
 name: yaml-config
 namespace: default
data:
 user.name: wanger
 user.sex: 人妖
# 创建
kubectl create -f yaml-config.yaml
# 查看
kubectl get cm  yaml-config -o yaml
```

## ConfigMap删除

```sh
# 根据yaml配置删除
kubectl delete -f yaml-config.yaml
# 根据名字删除
kubectl delete cm literal-config
# 删除所有
kubectl delete cm --all
```

## ConfigMap修改

```sh
# 在线修改
kubectl edit cm yaml-config
# 离线修改
vim yaml-config.yaml
kubectl apply -f yaml-config.yaml
```

## ConfigMap使用案例

**案例1配置环境变量**

使用docker部署mysql时，需要指定环境变量MYSQL_ROOT_PASSWORD，配置root密码，此时可以使用ConfigMap来配置

**1、** 创建ConfigMap；

```sh
vim mysql-config.yaml
# 添加
apiVersion: v1
kind: ConfigMap
metadata:
 name: mysql-config
 namespace: default
data:
 root.password: "123456"
# 创建
kubectl create -f mysql-config.yaml
```

**1、** 启动mysqlPod配置从ConfigMap读取环境变量；

```sh
# 
vim mysql-pod.yaml
# 添加
apiVersion: v1
kind: Pod
metadata:
 labels:
  app: mysql
 name: mysql
spec:
   restartPolicy: Never
   containers:
   - name: mysql-001
     image: daocloud.io/library/mysql:5.7.4
     imagePullPolicy: IfNotPresent
     ports:
     - containerPort: 3306
       name: mysql-port
     env:
     - name: MYSQL_ROOT_PASSWORD
       valueFrom:
        configMapKeyRef:
         name: mysql-config
         key: root.password
# 创建
kubectl apply -f  mysql-pod.yaml
```

**1、** 验证；

```sh
# 查看pod
kubectl get pods -o wide
# 进入容器
kubectl exec -it mysql /bin/bash
# 使用123456登录
mysql -uroot -p123456
```

**案例2挂载配置文件**

可以在数据卷中使用ConfigMap,有不同的选项，最基本的就是将文件插入卷中，在这个文件中，键就是文件名，键值就是文件内容。当然ConfigMap挂载配置文件这只是实现配置读取其中一种方式。

**1、** 创建ConfigMap保存nginx配置；

```sh
vim nginx.conf
# 内容，修改端口为88
#user  nobody;
worker_processes  1;
#pid        logs/nginx.pid;
events {
    worker_connections  1024;
}
http {
    include       mime.types;
    default_type  application/octet-stream;
   log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                     '$status $body_bytes_sent "$http_referer" '
                     '"$http_user_agent" "$http_x_forwarded_for"';
   access_log  logs/access.log  main;
    sendfile        on;
   tcp_nopush     on;
   keepalive_timeout  0;
    keepalive_timeout  65;
   gzip  on;
    server {
        listen       88;
        server_name  localhost;
       charset koi8-r;
       access_log  logs/host.access.log  main;
        location / {
            root   html;
            index  index.html index.htm;
        }
       error_page  404              /404.html;
        redirect server error pages to the static page /50x.html
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
    }
}
# 创建configmap
kubectl create configmap nginx-config --from-file=nginx.conf
# 查看
kubectl get cm nginx-config -o yaml
```

**1、** 创建Pod使用ConfigMap中的配置文件启动；

```sh
# 创建pod
vim nginx-pod.yaml
# 内容
apiVersion: v1
kind: Pod
metadata:
 labels:
  app: nginx
 name: nginx
spec:
 restartPolicy: Never
 containers:
 - name: nginx-001
   image: daocloud.io/library/nginx:1.7.11
   imagePullPolicy: IfNotPresent
   volumeMounts:
   - name: nginx-v
     mountPath: /etc/nginx/nginx.conf
     subPath: nginx.conf
 volumes:
 - name: nginx-v
   configMap:
    name: nginx-config
# 创建
kubectl create -f nginx-pod.yaml
```

**1、** 进入容器查看nginx配置，已修改为当前configmap中的配置；

```sh
#
kubectl exec -it nginx /bin/bash
cat /etc/nginx/nginx.conf 
```
