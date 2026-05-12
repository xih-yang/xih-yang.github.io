# 01、Docker 实战：Docker 基础教程
- 来源：https://ddkk.com/zhuanlan/container/docker/2/1.html
- 分类：容器服务
- 分组：教程目录
Docker 是一个开源的应用容器引擎，基于 Go 语言 并遵从 Apache2.0 协议开源

Docker 可以让开发者打包它们的应用以及依赖包到一个轻量级、可移植的容器中，然后发布到任何流行的 Linux 机器上，也可以实现虚拟化

Docker 使用完全使用沙箱机制，两个容器之间不会有任何接口 (这个有点像 iPhone 的 app ) ,更重要的是容器性能开销极低

## 学习前提

在继续阅读之前，我们希望你对 Linux 有一些基本的了解，包括

**1、** 会使用Linux常用的命令；

**2、** 知道大部分的Linux常识，比如**终端**、**service**、**ip**、**用户**、**组**等；

**3、** 熟练使用Ubuntu或者Centos或者MacOS种的一种昂；

如果你对这些知识还是一知半解，可以访问我们的 Linux 基础教程 先进行一些简单的了解

## Docker的应用场景

**1、** Web应用的自动化打包和发布；

**2、** 自动化测试和持续集成、发布；

**3、** 在服务型环境中部署和调整数据库或其他的后台应用；

**4、** 从头编译或者扩展现有的OpenShift或CloudFoundry平台来搭建自己的PaaS环境；

## Docker 的优点

**1、** 简化程序；

Docker 让开发者可以打包他们的应用以及依赖包到一个可移植的容器中，然后发布到任何流行的 Linux 机器上，便可以实现虚拟化

Docker 改变了虚拟化的方式，使开发者可以直接将自己的成果放入 Docker 中进行管理

方便快捷已经是 Docker 的最大优势，过去需要用数天乃至数周的 任务，在Docker容器的处理下，只需要数秒就能完成

**2、** 解决运维配置噩梦；

在没有 Docker 之前，每一台机器，每一个要用到的依赖，几乎都要重新配置一遍

比如新增一台 MySQL 数据库，就要从头开始配置所有环境

有了 Docker 之后，只需要从仓库里把之前的 MySQL 镜像拉出来，直接使用

**3、** 节省开支；

使用 Docker ，可以在一台电脑上部署多个服务，多个应用，从而充分榨干每一滴性能

同时，又不用担心多个应用之间出现相互访问的情况

## 相关链接

Docker 官网： [http://www.docker.com](http://www.docker.com)

Github Docker 源码： [https://github.com/docker/docker](https://github.com/docker/docker)
