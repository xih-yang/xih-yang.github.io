# 21、Docker 实战：DockerFile介绍
- 来源：https://ddkk.com/zhuanlan/container/docker/4/21.html
- 分类：容器服务
- 分组：教程目录
## DockerFile介绍

**dockerfile是用来构建docker镜像的文件！命令参数脚本！**

**构建步骤**

**1、** 编写一个dockerfile文件；

**2、** dockerbuild构建成为一个镜像；

**3、** dockerrun运行镜像；

**4、** dockerpush发布镜像（DockerHub、阿里云镜像仓库！）；

查看一下[官方](https://registry.hub.docker.com/_/centos)是怎么做的

很多官方镜像都是基础包，很多功能都没有，我们通常会自己搭建自己的镜像！

官方既然可以制作镜像，那我们也可以！

## DockerFile构建过程

**基础知识**

- 每个保留关键字（指令）都必须是大写字母
- 执行顺序从上到下
- #表示注释
- 每一个指令都会创建提交一个新的镜像层，并提交

dockerfile是面向开发的，我们以后要发布项目，做镜像，就需要编写dockerfile文件，这个文件十分简单

Docker镜像逐渐成为企业交付的标准

**步骤：开发、部署、运维**

- DockerFile：构建文件，定义了一切的步骤，源代码
- DockerImages：通过DockerFile构建生成的镜像，最终发布和运行的产品
- Docker容器：容器就是镜像运行起来提供的服务器
