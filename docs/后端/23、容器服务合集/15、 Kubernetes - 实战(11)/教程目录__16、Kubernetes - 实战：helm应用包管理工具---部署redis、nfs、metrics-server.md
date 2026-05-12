# 16、Kubernetes - 实战：helm应用包管理工具---部署redis、nfs、metrics-server
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/11/16.html
- 分类：容器服务
- 分组：教程目录
## 1、什么是helm？

Helm是Kubernetes 应用的包管理工具，主要用来管理 Charts，类似Linux系统的yum。

> Helm Chart 是用来封装 Kubernetes 原生应用程序的一系列 YAML 文件。可以在你部署应用的时候自定义应用程序的一些Metadata，以便于应用程序的分发。即不再需要手动写控制器的yaml文件、svc的yaml文件、pod的yaml文件等等，使用打包好的helm直接一键部署。

- 对于应用发布者而言，可以通过 Helm 打包应用、管理应用依赖关系、管理应用版本并发布应用到软件仓库。
- 对于使用者而言，使用 Helm 后不用需要编写复杂的应用部署文件，可以以简单的方式在 Kubernetes 上查找、安装、升级、回滚、卸载应用程序。

如图，之前学过的所有的东西，都可以打包成一个helm，一键部署

## 2、helm的安装

首先清空之间的环境，避免影响本次实验

查看官网[https://helm.sh/docs/intro/](https://helm.sh/docs/intro/)

下载二进制文件helm-v3.4.1-linux-amd64.tar.gz

解压二进制文件，进入解压出来的目录，复制helm到/usr/local/bin，使其可执行

添加环境变量，重新应用，成功设置helm命令补齐

搜索官方helm hub chart库

```java
helm repo add bitnami https://charts.bitnami.com/bitnami	%Helm 添加第三方 Chart 库
helm repo list			%查看repo源
```

## 3、helm部署redis

`helm search repo redis`查询redis应用

仓库新建一个项目，bitnami

准备镜像，上传到仓库

```java
helm pull bitnami/redis-cluster		%拉取redis-cluster应用到本地
tar zxf redis-cluster-6.3.2.tgz		%解压
cd redis-cluster/					%进入解压得到的目录
vim values.yaml						%编辑values.yaml文件，该文件内包括大量的变量
```

指定仓库地址

在本目录安装

查看六个pod都running了，成功

## 4、helm部署nfs

之前自己手动部署过nfs，我们删除他，用helm的方式重新部署一个nfs，体现helm的方便。

同时删除pv、pvc

在server1中有nfs路径为 /mnt/nfs

创建子目录nfs-client-provisioner

仓库中创建新项目sig-storage

导入镜像，上传镜像

进入目录，网上拉取chart，解压。进入解压得到的目录

编辑values.yaml文件，修改镜像文件，nfs的服务器和路径

打开默认类，关闭打包功能，直接删除就行

查看有命名空间，安装nfs-client-provisioner，查看

查看默认sc已配置成功，

编写test-pvc.yaml文件

```java
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: test-claim
spec:
 storageClassName: managed-nfs-storage-haha
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 1Gi
```

应用test-pvc.yaml文件，创建pvc，测试nfs，正常绑定了

删除test-pvc.yaml文件所创建的pvc，pv自动没有了

## 5、helm部署metrics-server

删除之前手动部署的metrics-server，看不到cpu和mem的指标了

上传镜像

`helm pull bitnami/metrics-server`拉取metrics-server的部署文件，解压，进入解压得到的子目录，

修改values.yaml文件，添加仓库信息

正确修改镜像路径

打开api接口

创建命名空间metrics-server，安装metrics-server

查看所有的pod、svc都正常启动，并且成功监测cpu和mem核心指标
