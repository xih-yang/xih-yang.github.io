# 22、Kubernetes 实战 - 布署 nodejs 后端项目（上）
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/2/22.html
- 分类：容器服务
- 分组：教程目录
## 一，前言

上一篇，介绍了 MySQL 服务的部署；

本篇，介绍 nodejs 后端项目的布署（将后端项目构建成为 docker 镜像，并推送至镜像仓库）；

## 二，准备项目

### 创建后端项目，并上传到 git

创建nodejs 项目并上传

```java
git init
git commit -m "first commit"
git remote add origin git@gitee.com:BraveWangDev/cicd-backend.git
git push -u origin "master"
```

### Dockerfile 配置说明

```java
FROM node:12.16-alpine // 继承 node:12.16-alpine 镜像
ADD . /app   // 将当前目录拷贝到/app中
WORKDIR /app // 设置工作目录
EXPOSE 7001  // 暴露 7001 端口
CMD ["npm", "start"] // 执行命令 npm start
```

实现：将代码拷贝到静态文件目录，启动 nginx 服务；

## 三，新建 jenkins 项目

### 创建项目

- 创建自由风格 jenkins 项目：cicd-backend

### 配置 git

- 设置 git 源码地址、配置 git 私钥(之前已完成配置)

地址：git@gitee.com:BraveWangDev/cicd-backend.git

公钥给gitee、私钥给 jenkins

### 配置 docker 参数

- 配置 DOCKER_LOGIN_USERNAME 和 DOCKER_LOGIN_PASSWORD

### 配置构建环境和脚本

构建中可以使用 node 环境，可以使用 node 命令

构建使用 shell 脚本：

```java
#!/bin/bash
time=$(date "+%Y%m%d%H%M%S")
npm install --registry=https://registry.npm.taobao.org
docker build -t 47.94.92.122:8082/cicd-backend:$time .
// docker login -u $DOCKER_LOGIN_USERNAME -p $DOCKER_LOGIN_PASSWORD 47.94.92.122:8082
docker login -u admin -p Wz@19880818 47.94.92.122:8082
docker push 47.94.92.122:8082/cicd-backend:$time
```

### 测试构建

拉取代码、构建镜像成功，登录 docker，推送镜像到私有仓库，查看推送结果

备注：后端项目不需要 npm build 打包

### 私有库查看

私有库查看：cicd-backend:20220107150926

目前已经将后端项目构建成为 docker 镜像，并推送至镜像仓库了

后面，需要从镜像仓库中拉取最新的镜像，部署到集群上去

## 四，结尾

本篇，创建后端项目并上传，创建并配置 jenkins 项目，完成将后端项目构建成为 docker 镜像，并推送至镜像仓库；

下一篇，后端项目连接数据库；
