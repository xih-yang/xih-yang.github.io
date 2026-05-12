# 09、Kubernetes 实战 - docker compose之网络设置
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/1/9.html
- 分类：容器服务
- 分组：教程目录
## 简介

**1、** Compose是用于定义和运行多容器Docker应用程序的工具您可以使用Compose文件配置应用程序的服务然后，使用单个命令，从您的配置中创建并启动所有服务；

**2、** Compose具有用于管理应用程序整个生命周期的命令：

- 启动，停止和重建服务
- 查看正在运行的服务的状态
- 流运行服务的日志输出
- 对服务运行一次性命令

**1、** 每一个容器都是独立且隔离的网络，容器之间通信时，因为不在同一个局域网中，且IP不固定，若不代理，则无法通过主机名或者IP进行通信，为了解决这种现状，可通过compose网络设置，让容器归属于同一个局域网中，则可通过主机名进行通信，；

## 准备工作

**1、** docker；

**2、** docker-compose；

**3、** springboot项目（基于上篇文章添加了数据库访问，注意数据库地址写的不是IP）；

## 集成步骤

**1、** 推送项目镜像至私服（参照上篇文章）；

**2、** 编写compose(不配置网络)；

```sh
vim docker-compose.yaml
# 添加内容
version: '3'
services:
  数据库
  db_mysql:
    image: mariadb:10.4.12                                
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: 123456
    ports:
      - 3307:3306
  demo_k8s:
   image: 192.168.58.173/library/demo-kubenetes:2.3.0
   restart: always
   ports:
     - 9090:8080
```

**1、** 启动；

```sh
# 启动
docker-compose up 
```

访问test接口访问数据库报错，原因是因为启动了两个容器，网络隔离，此时数据库地址为db_mysql, 该容器并无法解析此地址。

**5、** 网络设置；

**启动会自动创建网络**

名称规则为当前compose文件加上_default

**查看docker网络列表**

```sh
docker network ls
```

**网络模式分类**

```sh
# docker默认的网络模式，这种模式容器直接可以互相通讯，但无法和宿主机通讯
network_mode: "bridge"
# host表示容器共享宿主机的ip和端口号。容器中不会虚拟自己的网卡和ip，当你查看容器ip的时候，其实是宿主机的ip
network_mode: "host"
# 使用none模式时容器没有网卡、IP、路由等信息。需要我们自己为Docker容器添加网卡、配置IP等
network_mode: "none"
network_mode: "service:[service name]"
# container是共享容器ip地址和端口
network_mode: "container:[container name/id]"
```

**1、** 重新配置yaml；

```sh
version: '3'
services:
  数据库
  db_mysql:
    image: mariadb:10.4.12
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: 123456
    ports:
      - 3307:3306
    服务网络设置
    networks:
      使用网络名
      demo_network:
        aliases:
         - db_mysql
  demo_k8s:
   image: 192.168.58.173/library/demo-kubenetes:2.3.0
   restart: always
   ports:
     - 9090:8080
   networks:
      demo_network:
        设置容器固定IP
        ipv4_address: 172.19.0.222
# 网络设置
networks:
  自定义网络名称
  demo_network:
    driver: bridge
    ipam:
      config:
      网络号段
      - subnet: 172.19.0.0/16
```

**1、** 重启并访问；
