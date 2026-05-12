# 03、Kubernetes 实战 - ci-server 构建节点 Docker、Jenkins 环境搭建
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/2/3.html
- 分类：容器服务
- 分组：教程目录
## 一，前言

上一篇，主要介绍了阿里云服务器的采购和简单配置：

三台服务器规划如下：

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

本篇，对 ci-server 进行环境安装与配置；

## 二，ci-server 构建机的 CI 流程简介

构建机ci-server（2c4g），用于提供 ci 所需的 Jenkins 服务、 Docker 私有仓库；

流程如图：

CI流程如下：

- IDE 本地开发，上传代码到 Git 仓库；
- 手动或自动触发 jenkins 拉取指定代码仓库并执行构建任务；
- 构建 docker 镜像并发布至私有镜像仓库；

## 三，安装 docker

### 1，docker 简介

- Docker 是 Docker.Lnc 公司开源的，基于 LXC 技术之上搭建的 Container 容器引擎，属于Linux容器的一种封装，提供简单易用的容器使用接口；
- Docker 使用 Go 语言开发实现，基于 Linux 内核的 cgroup，namespace，OverlayFS 类的 Union FS 等技术，对进程进行封装隔离，属于操作系统层面的虚拟化技术，由于隔离的进程独立于宿主和其它的隔离的进程，因此也称其为容器
- Docker 将应用程序与该程序的依赖，打包在一个文件里面，运行这个文件，就会生成一个虚拟容器

### 2，安装 docker

添加docker 阿里云镜像源

```java
sudo yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
```

安装docker 社区版本：docker-ce

```java
yum install docker-ce -y
```

启动docker

```java
systemctl start docker
```

设置docker 开机启动

```java
systemctl enable docker
```

### 3，配置镜像加速

配置阿里云安装源：

```java
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": ["https://fwvjnv59.mirror.aliyuncs.com"]
}
EOF
```

重启docker 使镜像配置生效

```java
// 重载配置文件
sudo systemctl daemon-reload
sudo systemctl restart docker
```

## 四，安装 Jenkins

### 1，Jenkins 简介

- Jenkins：一个基于 Java 语言开发的持续构建工具平台，用于持续、自动的构建和测试你的软件和项目。
- Jenkins 能够执行预设的构建脚本、与 Git 代码仓库集成，实现自动/定时触发构建任务；

### 2，安装 Jenkins

安装java

```java
yum install -y java
```

切换jenkins 安装源

```java
sudo wget -O /etc/yum.repos.d/jenkins.repo https://pkg.jenkins.io/redhat-stable/jenkins.repo
sudo rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io.key
```

安装jenkins

```java
yum install jenkins -y
```

启动jenkins 服务

```java
systemctl start jenkins.service
```

注意，此时还无法访问，需要系统关闭防火墙、开放端口访问

关闭防火墙

```java
// 关闭防火墙
firewall-cmd --zone=public --add-port=8080/tcp --permanent
firewall-cmd --zone=public --add-port=50000/tcp --permanent
// 重启防火墙
systemctl reload firewalld
```

开放端口访问

配置ECS 实例安全组：添加 8080 入方向，开放 8080 端口给外部访问：

这样就可以正常访问 Jenkins：[http://182.92.4.158:8080/login](http://182.92.4.158:8080/login?from=%2F)

### 3，配置 Jenkins

#### 获取管理员密码

首次访问 Jenkins 需要使用管理员密码登录并重置密码

页面显示了 jenkins 默认密码所在位置，打开文件获得解锁 jenkins 的密码：

```java
[root@iZ2ze7rkgit9zoa18pxu73Z ~]# cat /var/lib/jenkins/secrets/initialAdminPassword
26b889490519462f978276eb8f43882d
```

输入默认密码解锁 jenkins，进入 jenkins 初始化；

#### 安装 jenkins 插件

修改jenkins 安装源

在安装插件前，需要先切换 jenkins 安装源，否则会很慢；

修改jenkins 插件安装的路径，加快插件安装的速度：

```java
// 将 jenkins 官方源，修改为 jenkins 清华源
sed -i 's/http://updates.jenkins-ci.org/download/https://mirrors.tuna.tsinghua.edu.cn/jenkins/g' /var/lib/jenkins/updates/default.json
// 将谷歌的安装源，修改为百度的安装源
sed -i 's/http://www.google.com/https://www.baidu.com/g' /var/lib/jenkins/updates/default.json
```

> 说明：sed：修改字符串；-i：替换字符串；原地址；目标地址；

jenkins 插件的安装源更新完成后，继续操作 jenkins 初始化，安装插件：

选择“安装推荐的插件”，等待 3~5 分钟插件安装完成：

#### 创建管理员账户

保存并完成

保存并完成

#### 开始使用 Jenkins

至此，jenkins 安装并初始化完成；

## 五，测试并解决问题

### 1，测试 Jenkins 构建

新建item

输入任务名称，选择自由项目，点击确定

暂不配置 Git 仓库，单纯构建空项目用于测试：

立即构建

查看构建日志：

进入构建

查看控制台输出

### 2，测试拉取 docker 镜像（解决权限问题）

任务配置：

添加构建步骤：执行 shell

shell 内容：查看 docker 版本并拉取 node 最新镜像：

保存后，重新构建任务，查看日志：

拉取镜像失败，原因：没有权限

报错原因：

当前jenkins 用户不能访问 docker 服务；

解决方案：

需要将jenkins 添加至 docker 的 group 中，

jenkins 用户属于 docker 组，就可以访问 docker 服务了；

```java
// 创建 docker 组
[root@iZ2ze7rkgit9zoa18pxu73Z ~]# groupadd docker
groupadd：“docker”组已存在
// 将 jenkins 用户添加到 docker 组中
[root@iZ2ze7rkgit9zoa18pxu73Z ~]# gpasswd -a jenkins docker
正在将用户“jenkins”加入到“docker”组中
// 更新 docker 组
[root@iZ2ze7rkgit9zoa18pxu73Z ~]# newgrp docker
[root@iZ2ze7rkgit9zoa18pxu73Z ~]# 
```

再次构建还是失败！需要重启 jenkins，使配置生效：

```java
systemctl restart jenkins.service
```

等待jenkins 重启完成之后，再次构建；

此时，可以正常拉取 docker 镜像，等待构建完成：

jenkins 构建成功；

### 3，Jenkins 任务添加 node 支持

#### 安装 NodeJS 插件

系统管理 => 插件管理 => 可选插件 => 搜索并安装“NodeJS”插件

安装node 插件，为项目构建添加 node 支持（构建时可以使用 node 脚本）

安装完成后，勾选重启 jenkins，重启完成后，重新登录；

#### 配置 NodeJS

系统管理 => 全局工具配置 => NodeJS => 新增 NodeJS：

找到NodeJS，选择 node 版本，起别名，新增安装（选择从镜像安装）

备注：构建 vue 项目选择 15 版本会失败，12 版本可以成功；

配置nodejs 镜像

完成后，保存应用；这样，就完成了 node 环境的添加

#### 任务添加 nodejs 支持

任务配置 => 构建环境 => 勾选 `Provide Node & npm bin/ folder to PATH`

将nodejs 和 npm 的 bin 目录添加到 PATH 中：

保存/应用后，构建阶段就可以使用 node 环境了；

#### 测试 Jenkins 任务构建

重新启动构建：

备注：
第一次会稍慢一些，要下载并解压 nodejs，第二次开始构建就会比较快了;

有了node 环境，构建脚本可以执行基于 node 的构建命令；

## 六，结尾

本篇，完成了 ci-server 的构建环境配置：

- ci-server 构建机的 CI 流程简介；
- Docker 的安装、配置、测试；
- Jenkins 的安装、配置、测试；

下一篇，K8S 集群搭建；
