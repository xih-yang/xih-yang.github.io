# 20、Kubernetes 实战 - k8s 项目部署流程和操作梳理
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/2/20.html
- 分类：容器服务
- 分组：教程目录
## 一，前言

上一篇，介绍了 k8s 污点和容忍度；

在了解前面 k8s 介绍之后，设计并完成一个前后端项目的部署和持续集成；

本篇，介绍基于 k8s 项目部署流程设计；

## 二，项目部署流程设计

- 本地 IDE 进行代码开发，完成并提交到代码仓库（使用 gitee）；
- 代码提交后，触发 jenkins 构建任务，拉取代码到 ci-server 服务器，开启构建流程；
- 构建流程：1，拉取最新代码 2，安装依赖 3，打包构建 4，创建 docker 镜像 5，将构件推送至私有仓库；
- CI 过程可以执行单元测试，代码校验，质量检测，端到端测试等操作
- k8s 拉取镜像完成部署更新；

部署顺序：

- 配置并部署 mysql 数据库
- 部署后端服务
- 部署前端服务

备注：考虑到服务器成本，前端、后端和数据库全都部署在 k8s-node 上，和集群部署的是操作一致的；

## 三，部署操作梳理

部署MySQL

- 可以为指定 node 添加污点，专门用于 mysql 部署（当前只有一个节点，不考虑）；
- 为了保证mysql容器重启时数据不会丢失：创建 mysql 数据目录，用于存储 mysql 数据，实现 MySQL 数据的持久化；
- 创建 Secret 对象，向为 mysql 容器提供用户名、密码信息；
- 创建 mysql Deployment 配置文件，并创建 deploy 完成 pod 部署；
- 创建 mysql Service 配置文件，并创建 service 解决 ip 漂移问题，对外提供 pod 访问；
- 为 k8s-master 安装 mysql，使 k8s-master 能够使用 mysql 命令，测试数据库使用；

部署后端项目（nodejs）

- 创建后端项目，配置 dockerfile，上传代码到远程仓库；
- 在 jenkins 创建并配置后端部署任务(配置 git 仓库地址、git 公钥私钥、构建环境、部署脚本)；
- 构建脚本：设置 npm 源，构建镜像，推送到镜像仓库；
- 为后端项目配置数据库连接信息 configMap、数据库账号 Secret、docker 私有库认证 secret；
- jenkins 配置凭据并绑定环境变量，提供 jenkins 环境变量登录 docker 私有仓库；

部署前端项目

- 与前端项目相似

### 四，结尾

本篇，介绍了项目部署流程和操作梳理了；

下一篇，部署 mysql 服务；
