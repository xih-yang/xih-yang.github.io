# 02、Kubernetes 实战 - 购买阿里云 ECS 实例
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/2/2.html
- 分类：容器服务
- 分组：教程目录
## 一，前言

上一篇，简单介绍了 CI/CD 的概念以及 ECS 服务规划，搭建整套服务需要三台服务器，配置如下：

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

搭建基于 k8s 的 CI/CD 环境，最少需要准备 3 台服务器：

- 1 台用于做 ci 构建机，构建镜像（最低配置需要满足 2c4g）；
- 2 台用于做 K8S 集群，主从各一台：master + node；

本篇，主要介绍阿里云服务器的采购和简单配置（仅做简单记录，没有技术含量）

## 二，购买阿里云 ECS 实例

### 1，ci-server 构建机（2c4g）

购买流程如下：

选择付费模式：按量付费，共享型；筛选 2c4g 且价位合适的镜像；

公共镜像：使用 CentOS 7.9 64位

下一步，网络和安全组配置

默认，无需配置，直接下一步

下一步，系统配置：登录凭证选择自定义密码：

设置实例名称 ci-server 和登录密码（略）

下一步，分组设置

默认，无需配置，直接下一步

下一步，确认订单

默认，无需配置，勾选服务协议，创建实例；

查看实例：进入控制台

获得阿里云 ECS 实例的公网 IP：182.92.4.158

### 2，k8s-master 主节点（2c4g）

按量付费，2c4g

选择镜像：公共镜像，CentOS 7.9 版本 64 位

下一步

下一步

下一步

下一步，确认订单

勾选服务协议，创建实例

### 3，k8s-node 从节点（2c1g）

选择镜像

下一步，分配公网 ip

下一步

下一步，下一步

创建实例

查看控制台，获取实例公网 IP：39.105.58.35

## 三，连接服务器

### 1，连接工具

- windows 可以使用 Xshell；
- Mac 使用自带的 terminal 终端即可；

### 2，登录服务器

```java
// ssh 登录：ssh 用户名@公网IP
ssh root@182.92.4.158
```

首次连接服务器询问，输入 yes 回车即可：

```java
Last login: Thu Dec 16 10:21:13 on ttys000
The default interactive shell is now zsh.
To update your account to use zsh, please run chsh -s /bin/zsh.
For more details, please visit https://support.apple.com/kb/HT208050.
BravedeMacBook-Pro:~ brave$ ssh root@182.92.4.158
The authenticity of host '182.92.4.158 (182.92.4.158)' can't be established.
ECDSA key fingerprint is SHA256:Z5fSVEKfzbR2Fm2qWrScdGdowQkbU77qr7Rzi4oBSwY.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added '182.92.4.158' (ECDSA) to the list of known hosts.
root@182.92.4.158's password: 
Welcome to Alibaba Cloud Elastic Compute Service !
[root@iZ2ze7rkgit9zoa18pxu73Z ~]# 
```

登录成功；

> 备注：停机可以减少实例产生的费用，但停机后重启将导致内外网 IP 变化，导致需要重新配置；

## 四，结尾

服务
配置
内网IP
外网IP
说明

ci-server
2c4g
172.17.178.104
182.92.4.158
Jenkins + Nexus + Docker

k8s-master
2c4g
172.17.178.105
47.93.9.45
Kubernetes + Docker

k8s-node
2c1g
172.17.178.106
39.105.58.35
Kubernetes + Docker

下一节，ci-server 构建环境配置；
