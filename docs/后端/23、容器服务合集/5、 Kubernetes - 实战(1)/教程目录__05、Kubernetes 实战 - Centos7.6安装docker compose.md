# 05、Kubernetes 实战 - Centos7.6安装docker compose
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/1/5.html
- 分类：容器服务
- 分组：教程目录
## 简介

Compose是用于定义和运行多容器Docker应用程序的工具。通过Compose，您可以使用Compose文件配置应用程序的服务。然后，使用一个命令，从您的配置中创建并启动所有服务。（摘自GitHub,简单理解就是使用yml配置文件来运行docker）

## 安装

**1、** 检查docker；

**2、** 二进制方式安装（github上提供的连接无法访问，现使用DaoCloud镜像站连接安装）；

```sh
curl -L https://get.daocloud.io/docker/compose/releases/download/1.25.4/docker-compose-uname -s-uname -m >` /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
docker-compose -version
```

##

1. 运行示例

[K8S入门系列(6)-Docker compose安装中文版GitLab,配置SSH免密登录](https://blog.csdn.net/qq_43437874/article/details/105033179)
