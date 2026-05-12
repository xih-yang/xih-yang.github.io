# 01、源码解析 Eureka 入门
- 来源：https://ddkk.com/zhuanlan/registered/eureka/d-1/1.html
- 分类：注册中心
- 分组：Eureka 教程（版本 A）
Eureka 入门

## 1、Eureka功能、原理了解

### 1.1 Eureka 基本介绍

Eureka是Netflix开源的一款提供服务注册和发现的产品

github地址为 https://github.com/Netflix/eureka

注册中心是分布式开发的核心组件之一,而eureka是spring cloud推荐的注册中心实现

### 1.2 Eureka 功能

1、Eureka主要实现了服务的注册与发现。

2、因为项目使用微服务的话，肯定会拆分为很多的服务，有了注册中心，就可以让让注册中心来管理服务的上下线、以及服务故障的监控。

3、有了注册中心后，其他服务调用的时候也不用关心有多个实例我怎么去调用，后面我们就知道我们在 Feign中直接写上实例名，就可以帮我们自动的去调用相应的服务实例。当然内部是有负载均衡的

## 2、Eureka 源码搭建

### 2.1 下载源码

**1、** 在本地打开命令行客户端(Windows:cmd/gitbash-推荐使用gitbash，更好友一些),执行gitclonehttps://github.com/Netflix/eureka；

**2、** 因为Eureka是gradle构建的，所以你打开项目之前先确保自己安装了gradle；

**3、** 然后用idea打开eureka的项目，打开之后你可以切换分支，我这里就打开的是1.7.x的版本来分析；

### 2.2 环境变量设置、构建

**1、** gradle配置环境变量；

**2、** gradle在idea中的设置；

**3、** 然后gradlecleanbuild即可；

**4、** 构建后的样子；

## 3、Eureka 目录结构

### 3.1 codequality

代码质量检测的，下面就一个文件 checkstyle.xml

### 3.2 eureka-client、eureka-client-archaius2、eureka-client-jersey2

eureka-client 主要是客户端相关的代码

eureka-client-archaius2 这个不用太多关注

eureka-client-jersey2 这个主要是一个restful 实现的 webservice 接口

看下图就可以知道这个类中封装了 client 的很多方法，用于向服务端请求。

### 3.3 eureka-core、eureka-core-jersey2

这2 个项目主要是服务端相关的代码。

先大概看一下 core 的类结构，后面源码解析的时候我们会去看更多的类

### 3.4 eureka-examples

这个目录下主要是 eureka 相关的一些例子，测试类啥的

### 3.5 eureka-resource

这个主要是 eureka 控制台相关的一些资源文件。

下面图中可以看出就是一些 js、css、jsp 页面文件

### 3.6 eureka-server、eureka-server-governator

主要是服务入口类，配置一些启动类、过滤器等

### 3.7 eureka-test-utils

这个主要是 test 相关的工具类

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
