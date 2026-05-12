# 01、Kubernetes 实战 - CI/CD 简介与 ECS 服务规划
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/2/1.html
- 分类：容器服务
- 分组：教程目录
## 一，前言

去年公司上了一个持续集成平台，设计技术组件与开源工具集，大致如下：

- 使用 Gitlab 作为代码的管理和托管工具；
- 使用 Gitlab CI 持续集成工具；
- 使用 Docker 开源应用容器引擎；
- 使用 Harbor 企业级 Docker 私有镜像仓库；
- 使用 Kubernetes 作为容器编排和管理工具；
- 使用 Helm 作为 Kubernetes 的包管理器；

结合上述技术特点，以 k8s 的使用为核心，从 0 到 1 实现一个前后端项目的持续集成；

主要内容:

- ci/cd 简介；
- 服务规划及阿里云 ECS 服务器采购；
- 环境安装：Linux+Git+Jenkins+Docker+k8s集群；
- docker 的使用（后续将会写在另外一个专栏）
- k8s 的配置和使用；

## 二，CI/CD 简介

### 1，持续构建（CI）

- 持续构建环节不参与部署，只负责构建代码并将制品上传至制品库；
- 比如：使用 Jenkins 拉取仓库代码 -> 执行预置脚本构建制品（docker 镜像），将制品推送至制品库（docker 镜像仓库）;
- 常用工具：Gitlab CI，Github CI，Jenkins 等；

### 2，持续部署、持续交付（CD）

CD有 2 层含义： 持续部署（Continuous Deployment） 和 持续交付（Continuous Delivery） ；

- 持续交付：在持续集成的基础上，将集成后的代码或镜像制品部署到接近真实环境的「类生产环境」，交付给客户提前测试；

- 持续部署：在持续交付的基础上，把部署到生产环境的过程自动化；

## 三，服务器规划

搭建基于 k8s 的 CI/CD 环境，最少需要准备 3 台服务器：

- 1 台用于做 ci 构建机，构建镜像（最低配置需要满足 2c4g）；
- 2 台用于做 K8S 集群，主从各一台：master + node；

ECS 配置
启动服务
说明

2核4G
Jenkins + Nexus + Docker
ci-server

2核4G
Docker + Kubernetes
k8s-master

1核1G
Docker + Kubernetes
k8s-node

> 备注：
>
> 有条件的话，最好准备 4 台服务器，k8s 集群使用1 主 + 2 从的配置，可以测试任务分配和负载均衡；
>
> 按需付费，每小时每台大概 0.2~0.3 元，3 台服务器每天约15 元左右，每月约450元还是挺烧钱的；

以下是正常情况下，三台服务一天的费用情况：

## 四，结尾

下一篇，购买并配置阿里云 ECS 实例；
