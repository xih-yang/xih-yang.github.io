# 02、SpringCloud Alibaba 之 Nacos
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/1/2.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
Nacos（英文全称：Dynamic Naming and Configuration Service），是由阿里巴巴团队使用 Java 语言开发并于2018年7月推出来的开源项目（Nacos：纳科斯）

Nacos 是一个更易于帮助构建云原生应用的动态服务发现、配置和服务管理平台

Nacos官网：[https://nacos.io/](https://nacos.io/)

Nacos官网文档：[什么是 Nacos](https://nacos.io/zh-cn/docs/what-is-nacos.html)

Nacos的GitHub地址： [https://github.com/alibaba/nacos](https://github.com/alibaba/nacos)

> Nacos 的命名是由 3 部分组成

组成部分
全称
描述

Na
naming/nameServer
即服务注册中心，与 Spring Cloud Eureka 的功能类似。

co
configuration
即配置中心，与 Spring Cloud Config+Spring Cloud Bus 的功能类似。

s
service
即服务，表示 Nacos 实现的服务注册中心和配置中心都是以服务为核心的。

Nacos 约等于 spring cloud eureka（注册中心）+ spring cloud config（配置中心），它是服务注册中心和配置中心的组合体，它可以替换 [Eureka](http://c.biancheng.net/springcloud/eureka.html) 作为服务注册中心，实现服务的注册与发现；还可以替换 [Spring Cloud Config](http://c.biancheng.net/springcloud/config.html) 作为配置中心，实现配置的动态刷新

Nacos 作为服务注册中心经历了十年“双十一”的洪峰考验，具有简单易用、稳定可靠、性能卓越等优点

Nacos 支持几乎所有主流类型“服务”的发现、配置和管理：

[Kubernetes Service](https://kubernetes.io/docs/concepts/services-networking/service/)

[gRPC](https://grpc.io/docs/guides/concepts.html#service-definition) & [Dubbo RPC Service](https://dubbo.incubator.apache.org/)

[Spring Cloud RESTful Service](https://spring.io/projects/spring-restdocs)

## 一、Nacos 两大组件

与Eureka 类似，Nacos 也采用 CS（Client/Server，客户端/服务器）架构，它包含两大组件

组件
描述
功能

Nacos Server
Nacos 服务端，与 Eureka Server 不同，Nacos Server 由阿里巴巴团队使用 Java 语言编写并将 Nacos Server 的下载地址给用户，用户只需要直接下载并运行即可。
Nacos Server 可以作为服务注册中心，帮助 Nacos Client 实现服务的注册与发现。

Nacos Server 可以作为配置中心，帮助 Nacos Client 在不重启的情况下，实现配置的动态刷新。

Nacos Client
Nacos 客户端，通常指的是微服务架构中的各个服务，由用户自己搭建，可以使用多种语言编写。
Nacos Client 通过添加依赖 spring-cloud-starter-alibaba-nacos-discovery，在服务注册中心（Nacos Server）中实现服务的注册与发现。

Nacos Client 通过添加依赖 spring-cloud-starter-alibaba-nacos-config，在配置中心（Nacos Server）中实现配置的动态刷新。

Nacos 作为服务注册中心可以实现服务的注册与发现，流程如下

- 服务注册中心（Nacos）：它是一个 Nacos Server，可以为服务提供者和服务消费者提供服务注册和发现功能。
- 服务提供者（Provider Service）：它是一个 Nacos Client，用于对外服务。它将自己提供的服务注册到服务注册中心，以供服务消费者发现和调用。
- 服务消费者（Consumer Service）：它是一个 Nacos Client，用于消费服务。它可以从服务注册中心获取服务列表，调用所需的服务

和Dubbo类似，微服务开发是controller调用controller，调用者是服务消费者，被调用者是服务提供者，服务消费者和服务提供者是相对概念，服务消费者也可以被另一个服务调用，那么此时的服务消费者也是一个服务提供者；

在实际开发中，我们会把所有服务都注册到nacos注册中心上，由nacos去维护和管理我们的所有服务

> Nacos 实现服务注册与发现的流程如下：

**1、** 从Nacos官方提供的下载页面中，下载NacosServer并运行；

**2、** 服务提供者NacosProvider启动时，会把服务以服务名（spring.application.name）的方式注册到服务注册中心（NacosServer）；

**3、** 服务消费者NacosConsumer启动时，也会将自己的服务注册到服务注册中心；

**4、** 服务消费者在注册服务的同时，它还会从服务注册中心获取一份服务注册列表信息，该列表中包含了所有注册到服务注册中心上的服务的信息（包括服务提供者和自身的信息）；

**5、** 在获取了服务提供者的信息后，服务消费者通过HTTP或消息中间件远程调用服务提供者提供的服务；

## 二、安装、运行Nacos

**1、** 下载nacos最新的二进制压缩包；

Nacos下载地址：[Releases · alibaba/nacos · GitHub](https://github.com/alibaba/nacos/releases)

Nacos Server 下各目录说明如下：

- bin：用于存放 Nacos 的可执行命令
- conf：用于存放 Nacos 配置文件
- target：用于存放 Nacos 应用的 jar 包

**2、** 解压下载下来的nacos的二进制压缩包；

```bash
unzip nacos-server-$version.zip 或者 tar -xvf nacos-server-$version.tar.gz
cd nacos/bin
```

**3、** 启动nacosserver；

注：Nacos的运行需要以至少2C4g60g*3的机器配置下运行

启动之前可先查看下 防火墙firewalld状态，最好先关闭

```bash
systemctl status firewalld
systemctl stop firewalld
```

### Linux/Unix/Mac 启动

启动命令(standalone代表着单机模式运行，非集群模式):

```bash
sh startup.sh -m standalone
```

如果使用的是ubuntu系统，或者运行脚本报错提示[[符号找不到，可尝试如下运行：

```bash
bash startup.sh -m standalone
```

### Windows 启动

启动命令(standalone代表着单机模式运行，非集群模式):

```bash
startup.cmd -m standalone
```

注：

> 单机环境必须带-m standalone参数启动；不带参数启动的是集群环境

**4、** 启动日志：/xx/nacos/logs/start.out（安装nacos路径）；

**5、** 访问：[http://192.168.133.129:8848/nacos](http://192.168.172.128:8848/nacos)默认用户名密码：**nacos/nacos**；

**6、** 关闭服务器；

### Linux/Unix/Mac 关闭

```bash
sh shutdown.sh
```

### Windows 关闭

```bash
shutdown.cmd
```

或者双击shutdown.cmd运行文件

启动成功如下图

### Nacos启动踩坑

### 1、JAVA_HOME环境变量

启动nacos时，报错

```bash
sh ./startup.sh 出现错误，那么请先尝试:
sh ./startup.sh -m standalon(设置单机模式，nacos默认集群模式)
若仍然报错，请尝试：
bash -f  ./startup -sh -m standalon
```

```bash
ERROR: Please set the JAVA_HOME variable in your environment, We need java(x64)! jdk8 or later is better! !!
```

JAVA_HOME路径没有设置对，或者你的jdk版本不对，如果你用的是jdk的话 ，修改/etc/profile文件

```bash
[root@centos-linux-1 mrzhuang]# vi /etc/profile
export JAVA_HOME=/usr/lib/jvm/java-1.8.0
export PATH=$JAVA_HOME/bin:$PATH
export CLASSPATH=.:$JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tools.jar
```

或者修改 startup.sh 中Java环境变量

### 2、/nacos/logs/start.out: Permission denied

Permission denied,即**权限问题**，你的启动日志不能运行，这一点在实际情况中可能并不影响nacos的各种操作

```bash
sudo chmod 777 start.out
sudo chmod 777 -R logs
```

### 3、nacos启动后无法访问注册中心

关闭防火墙

```bash
systemctl stop firewalld
```

nacos默认使用8848端口，那么考虑一下是否端口冲突了，**冲突的话你换个端口就行了**

修改默认端口的话,在nacos文件夹中：

```bash
vim /conf/application.properties
```

进行修改

### 4、如果Nacos使用MySQL数据持久化，启动服务成功，最终还是无法访问nacos控制台

博主就遇到过，启动nacos服务OK，但是浏览器访问nacos控制台就报错

如，我们在 nacos安装包下 conf 目录下 的 application.properties文件 （/xx/conf/application.properties文件）配置了MySQL进行数据持久化

但是mysql服务没启动 ，或者 没创建 库和表，即使后台启动nacos成功，但是依旧无法访问nacos控制台，这时进入日志查看才会找到报错原因

nacos踩坑可参考

[nacos部署报错（各种奇葩超级坑啊）及openjdk设置JAVA_HOME_涛涛ALG的博客-CSDN博客_nacos 设置javahome](https://blog.csdn.net/sunjintaoxxx/article/details/119790231)
