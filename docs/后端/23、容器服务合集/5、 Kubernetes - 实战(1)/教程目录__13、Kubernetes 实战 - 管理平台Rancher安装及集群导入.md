# 13、Kubernetes 实战 - 管理平台Rancher安装及集群导入
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/1/13.html
- 分类：容器服务
- 分组：教程目录
## 简介

**一个Kubernetes管理平台**，Rancher是供采用容器的团队使用的完整软件堆栈。它解决了管理多个Kubernetes集群的运营和安全挑战，同时为DevOps团队提供了用于运行容器化工作负载的集成工具。

[官网](https://rancher.com/)

[GitHub](https://github.com/rancher/rancher)

功能：

- Rancher最初是为与多个协调器一起工作而构建的，其中包括自己的协调器Cattle。随着Kubernetes在市场上的兴起，Rancher 2.x专门部署和管理在任何提供商的任何位置运行的Kubernetes集群。
- Rancher可以从托管提供程序中配置Kubernetes，配置计算节点，然后在其上安装Kubernetes，或导入可在任何地方运行的现有Kubernetes集群。
- 一台Rancher服务器安装程序可以从同一用户界面管理数千个Kubernetes集群和数千个节点。
- Rancher首先通过集中所有集群的身份验证和基于角色的访问控制（RBAC），在Kubernetes上增加了可观的价值，使全局管理员能够从一个位置控制集群的访问。然后，它可以对集群及其资源进行详细的监视和警报，将日志发送给外部提供商，并通过应用程序目录直接与Helm集成。如果您具有外部CI / CD系统，则可以将其插入Rancher，但是如果没有，Rancher甚至包括管道引擎来帮助您自动部署和升级工作负载。
- Rancher是Kubernetes的完整容器管理平台，为您提供了在任何地方成功运行Kubernetes的工具。

## 单节点安装

```sh
# master001扩容内存至4G，使用docker安装rancher
docker run -d --restart=unless-stopped -p 80:80 -p 443:443 --privileged rancher/rancher:v2.4.5
```

## 配置K8S

**1、** 进入首页设置登录密码；

**2、** 最右下角选择语言；

**3、** 点击添加集群，设置集群名；

**4、** 在master节点数据输入图中命令；

**5、** 稍作等待，集群导入成功；
