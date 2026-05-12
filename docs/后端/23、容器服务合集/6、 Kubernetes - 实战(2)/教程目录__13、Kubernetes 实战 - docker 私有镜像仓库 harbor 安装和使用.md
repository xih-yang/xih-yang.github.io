# 13、Kubernetes 实战 - docker 私有镜像仓库 harbor 安装和使用
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/2/13.html
- 分类：容器服务
- 分组：教程目录
## 一，前言

上一篇，介绍了 k8s 服务探针的实现；

本篇，介绍 docker 私有镜像仓库的安装和使用；

## 二，docker 私有镜像仓库简介

镜像库是一个用于集中存放docker 镜像文件的文件服务；

镜像库在 CI/CD 中，又称为制品库；构建后的产物称为制品，制品需要放入制品库中进行管理；

常用的docker 镜像平台有 Nexus、Jfrog 和 Harbor 等对象存储平台；

## 三，部署 docker 私有镜像仓库

使用Nexus 服务：

- nexus-3.29.0-02 是 nexus 主程序文件夹
- sonatype-work 是数据文件

### 1，启动 ci-server 服务器

启动部署 jenkins 的阿里云 ci-server 服务器

备注：停机一段时间后再启动，公网 IP 会发生变化；

访问jenkins：[http://39.105.212.14:8080/](http://39.105.212.14:8080/)

在jenkins 服务器上，安装 nexus 私有镜像仓库

```java
// 进入目录
cd /usr/local
// 下载私有镜像仓库压缩包
wget https://dependency-fe.oss-cn-beijing.aliyuncs.com/nexus-3.29.0-02-unix.tar.gz
// 解压
tar -zxvf ./nexus-3.29.0-02-unix.tar.gz
// 进入目录启动服务
cd nexus-3.29.0-02/bin
./nexus start
firewall-cmd --zone=public --add-port=8081/tcp --permanent
firewall-cmd --zone=public --add-port=8082/tcp --permanent
// 访问镜像仓库
http://39.105.212.14:8081/
```

### 2，配置 Nexus

使用admin 用户登录 Nexus ：

管理员密码：`/usr/local/sonatype-work/nexus3/admin.password`

密码：6dbc3ee7-72f0-452f-9973-3c3379954b86

重置密码、启用匿名登录：

### 3，创建 docker 的私有镜像仓库

- proxy 是用来缓存外网镜像的
- hosted 只存放自己的私有镜像
- group 即代理外网镜像，又保存私有镜像

- online：是否可用
- 指定访问的端口号
- 允许匿名拉取镜像

创建完成

点击copyURL 地址：[http://39.105.212.14:8081/repository/docker-repository/](http://39.105.212.14:8081/repository/docker-repository/)

### 4，修改安全设置

激活`Docker Bearer Token Realm` 后就可以安全访问了

## 四，推送镜像到私有仓库

我们希望能够在 k8s-master 上，从私有镜像仓库去拉取需要的镜像

但是，目前镜像仓库中是空的，需要先推送一个镜像到仓库中。。。

进入jenkins，新建项目，执行构建，构建成功后得到一个镜像，将镜像推送到镜像仓库中，就可以拉取了

### 1，新建任务

### 2，shell 脚本

```java
#！/bin/sh -l
npm install --registry=https://registry.npm.taobao.org
npm run build
time=$(date "+%Y%m%d%H%M%s")
docker build -t 39.105.212.14:8082/vue-project:$time .
```

构建流程：

- 先 git clone 克隆代码到本地，
- 进入项目，执行安装依赖，
- 进行编译，得到编译后的文件目录 dist，
- 然后可以打包镜像，"."这个点，表示从当前文件夹查找 Dockerfile 文件

Dockerfile

```java
FROM nginx:1.15
#将dist目录拷贝到/etc/nginx/html中
COPY dist /etc/nginx/html
#将nginx配置文件目录拷贝到/etc/nginx中
COPY conf /etc/nginx
```

```java
server {
  listen 80;
  server_name _;
  root /etc/nginx/html;
}
```

监听80 端口

服务名是通配符

指定根目录是 /etc/nginx/html（Dockerfile配置将 dist 目录拷贝到 /etc/nginx/html 中）

### 3，测试构建

推送镜像仓库

shell 脚本，添加推送镜像操作

```java
#！/bin/sh -l
npm install --registry=https://registry.npm.taobao.org
npm run build
time=$(date "+%Y%m%d%H%M%s")
docker build -t 39.105.212.14:8082/vue-project:$time .
docker push 39.105.212.14:8082/vue-project:$time
```

但是这样推送是会报错的

```java
[root@iZ2ze7rkgit9zoa18pxu73Z ~]# docker image ls
REPOSITORY                       TAG                      IMAGE ID       CREATED              SIZE
39.105.212.14:8082/vue-project   2021123011191640834385   cf09bb54e87e   About a minute ago   110MB
cicdproject                      latest                   2e9269d7c724   9 days ago           110MB
node                             latest                   058747996654   3 weeks ago          992MB
nginx                            1.15                     53f3fd8007f7   2 years ago 109MB
[root@iZ2ze7rkgit9zoa18pxu73Z ~]# docker push 39.105.212.14:8082/vue-project:2021123011191640834385
The push refers to repository [39.105.212.14:8082/vue-project]
Get "https://39.105.212.14:8082/v2/": http: server gave HTTP response to HTTPS client
```

报错的原因有两个：

- 私有仓库默认情况下是不允许 http 访问的，需要修改配置

```java
// 解决 http 问题
[root@iZ2ze7rkgit9zoa18pxu73Z ~]# vi /etc/docker/daemon.json 
// 添加不安全的仓库地址：insecure-registries
{
  "insecure-registries":["39.105.212.14:8082"],
  "registry-mirrors": ["https://fwvjnv59.mirror.aliyuncs.com"]
}
[root@iZ2ze7rkgit9zoa18pxu73Z ~]# systemctl restart docker
[root@iZ2ze7rkgit9zoa18pxu73Z ~]# docker push 39.105.212.14:8082/vue-project:2021123011191640834385
The push refers to repository [39.105.212.14:8082/vue-project]
530879695cfc: Preparing 
b0a31e56a1ef: Preparing 
332fa54c5886: Preparing 
6ba094226eea: Preparing 
6270adb5794c: Preparing 
unauthorized: access to the requested resource is not authorized
```

资源未授权问题，登录：

```java
// 登录
[root@iZ2ze7rkgit9zoa18pxu73Z ~]# docker login 39.105.212.14:8082
Username: admin
Password: 
WARNING! Your password will be stored unencrypted in /root/.docker/config.json.
Configure a credential helper to remove this warning. See
https://docs.docker.com/engine/reference/commandline/login/#credentials-store
Login Succeeded
```

再次推送镜像，成功

```java
[root@iZ2ze7rkgit9zoa18pxu73Z ~]# docker push 39.105.212.14:8082/vue-project:2021123011191640834385
The push refers to repository [39.105.212.14:8082/vue-project]
530879695cfc: Pushed 
b0a31e56a1ef: Pushed 
332fa54c5886: Pushed 
6ba094226eea: Pushing  15.42MB/54.05MB
6270adb5794c: Pushing  14.13MB/55.28MB
```

到私有镜像仓库，验证推送结果：

更新完整的 shell 脚本：

```java
#！/bin/sh -l
npm install --registry=https://registry.npm.taobao.org
npm run build
time=$(date "+%Y%m%d%H%M%s")
docker build -t 39.105.212.14:8082/vue-project:$time .
docker login -u admin -p Wz@19880818 39.105.212.14:8082
docker push 39.105.212.14:8082/vue-project:$time
```

一般地，不能将密码放在这里显示，可以在构建环境中进行配置：

##

### 4，更新 shell 脚本

```java
#！/bin/sh -l
npm install --registry=https://registry.npm.taobao.org
npm run build
time=$(date "+%Y%m%d%H%M%s")
docker build -t 39.105.212.14:8082/vue-project:$time .
docker login -u $DOCKER_LOGIN_USERNAME -p $DOCKER_LOGIN_PASSWORD 39.105.212.14:8082
docker push 39.105.212.14:8082/vue-project:$time
```

执行脚本时，会获取配置好的用户名和密码并赋值给配置的环境变量

### 5，测试构建

构建成功：创建了新的镜像，并推送到镜像仓库

## 五，结尾

本篇介绍了 docker 镜像仓库的安装和使用；

下一篇，创建 Secret 对象；
