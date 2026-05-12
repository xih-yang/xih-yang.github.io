# 04、Kubernetes 实战 - Centos7.6 yum安装Docker，配置阿里云加速器
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/1/4.html
- 分类：容器服务
- 分组：教程目录
## 简介

Docker 是一个开源的应用容器引擎，让开发者可以打包他们的应用以及依赖包到一个可移植的容器中,然后发布到任何流行的Linux机器或Windows 机器上,也可以实现虚拟化,容器是完全使用沙箱机制,相互之间不会有任何接口。

## 架构

- **镜像（Image）** ：Docker 镜像（Image），就相当于是一个 root 文件系统。
- **容器（Container）** ：镜像（Image）和容器（Container）的关系，就像是面向对象程序设计中的类和实例一样，镜像是静态的定义，容器是镜像运行时的实体。容器可以被创建、启动、停止、删除、暂停等。
- **仓库（Repository）** ：仓库可看着一个代码控制中心，用来保存镜像。

## 环境要求

- Linux平台内核3.10及以上（uname -r 查看内核版本）
- CentOS 7.X
- 64位系统

## 安装

卸载自带安装包及旧版本文件

```sh
sudo yum remove docker
sudo yum remove docker docker-common docker-selinux docker-engine
```

安装需要的软件包,设置阿里云yum源，

```sh
sudo yum install -y yum-utils device-mapper-persistent-data lvm2
sudo yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
sudo yum makecache fast
```

查询版本，并安装指定版本

```sh
sudo yum list docker-ce --showduplicates | sort -r
sudo yum -y install docker-ce-19.03.8
```

启动并查看版本

```sh
sudo systemctl start docker
sudo systemctl enable docker
sudo docker -v
```

配置阿里云加速器，注册账号，按照官网文档操作即可

[阿里云地址](https://cr.console.aliyun.com/cn-hangzhou/instances/mirrors)

查看docker信息

```sh
sudo docker info
```

## 卸载

查询安装包

```sh
sudo yum list installed | grep docker
```

卸载安装包

```sh
sudo yum remove docker-ce-cli.x86_64 
```

删除存储文件

```sh
sudo rm -rf /var/lib/docker
```
