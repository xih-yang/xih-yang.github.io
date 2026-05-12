# 27、Kubernetes 实战 - 之Helm安装与配置
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/1/27.html
- 分类：容器服务
- 分组：教程目录
## 简介

在没使用 helm 之前，向 kubernetes 部署应用，我们要依次部署 deployment、svc 等，步骤较繁琐。况且随着很多项目微服务化，复杂的应用在容器中部署以及管理显得较为复杂，helm 通过打包的方式，支持发布的版本管理和控制，很大程度上简化了 Kubernetes 应用的部署和管理。

Helm 本质就是让 K8s 的应用管理（Deployment,Service 等 ) 可配置，能动态生成。通过动态生成 K8s 资源清单文件（deployment.yaml，service.yaml）。然后调用 Kubectl 自动执行 K8s 资源部署

Helm 是官方提供的类似于 YUM 的包管理器，是部署环境的流程封装。Helm 有两个重要的概念：chart 和release

- chart 是创建一个应用的信息集合，包括各种 Kubernetes 对象的配置模板、参数定义、依赖关系、文档说明等。chart 是应用部署的自包含逻辑单元。可以将 chart 想象成 apt、yum 中的软件安装包
- release 是 chart 的运行实例，代表了一个正在运行的应用。当 chart 被安装到 Kubernetes 集群，就生成一个 release。chart 能够多次安装到同一个集群，每次安装都是一个 release

## V2/V3区别

2019年11月，HELM发布了V3版本，相对于V2版本，有较大改动

- 删除了Tiller
- release 可以在不同命名空间重用
- 将chart推送到docker仓库中

架构变化

## 安装Helm客户端（V3）

**1、** 下载二进制，并上传至master服务器，[下载页面](https://github.com/helm/helm/releases)；

**2、** 解压并移动到bin目录下；

```sh
tar -zxvf helm-v3.4.1-linux-amd64.tar.gz
mv linux-amd64/helm /usr/local/bin/helm
# 查看帮助
helm help
```

**1、** 添加仓库源；

```sh
# 官方 网络原因，不好用
helm repo add stable https://charts.helm.sh/stable
# 微软
helm repo add stable http://mirror.azure.cn/kubernetes/charts/
# 阿里云
helm repo add apphub https://apphub.aliyuncs.com/
# 更新
helm repo update
# 查看
helm repo list
# 删除
helm repo remove aliyun
```
