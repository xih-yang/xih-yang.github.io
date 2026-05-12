# 02、Dubbo 3.x 源码解析 - 源码调试环境准备
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/2/2.html
- 分类：J2EE框架
- 分组：教程目录
Apache Dubbo 是一款微服务框架，为大规模微服务实践提供高性能 RPC 通信、流量治理、可观测性等解决方案，涵盖 Java、Golang 等多种语言 SDK 实现。

## 1 Alibaba Dubbo和Apache Dubbo

在maven仓库中可以看到两个实现，一个是Alibaba Dubbo，另一个是Apache Dubbo，一般来说，建议选择Apache Dubbo，因为阿里将Dubbo捐献给apache基金会之后，便暂停了单独的Dubbo的开发。

在[https://mvnrepository.com/artifact/com.alibaba/dubbo](https://mvnrepository.com/artifact/com.alibaba/dubbo)中可以看到，Alibaba Dubbo最后的更新已经是2021年了：

而Apache Dubbo的更新则一直未中断过：

现在开始，我们来学习Alibaba Dubbo的源码，本系列源码解析基于dubbo 3.1.0：

```java
<!-- https://mvnrepository.com/artifact/org.apache.dubbo/dubbo -->
<dependency>
    <groupId>org.apache.dubbo</groupId>
    <artifactId>dubbo</artifactId>
    <version>3.1.0</version>
</dependency>
```

### 2 下载dubbo源码

访问dubbo地址：[https://github.com/apache/dubbo](https://github.com/apache/dubbo)，选择dubbo版本，我选择的是[3.1.0](https://github.com/apache/dubbo/tree/3.1)，然后点击Download ZIP下载源码包。或者直接frok项目到自己仓库，然后clone下来选择分支（这样的好处是可以随时提交自己的注释笔记等到github）。

下载ZIP包下来后，解压后用Idea打开，下载依赖之后，可以看到Dubbo的各个模块。

主要模块介绍：

**1、** dubbo-common公共逻辑模块：包括Util类和通用模型；

**2、** dubbo-remoting远程通讯模块：相当于Dubbo协议的实现，如果RPC用RMI协议则不需要使用此包；

**3、** dubbo-rpc远程调用模块：抽象各种协议，以及动态代理，只包含一对一的调用，不关心集群的管理；

**4、** dubbo-cluster集群模块：将多个服务提供方伪装为一个提供方，包括：负载均衡,容错，路由等，集群的地址列表可以是静态配置的，也可以是由注册中心下发；

**5、** dubbo-registry注册中心模块：基于注册中心下发地址的集群方式，以及对各种注册中心的抽象；

**6、** dubbo-monitor监控模块：统计服务调用次数，调用时间的，调用链跟踪的服务；

**7、** dubbo-config配置模块：是Dubbo对外的API，用户通过Config使用Dubbo，隐藏Dubbo所有细节；

**8、** dubbo-container容器模块：是一个Standlone的容器，以简单的Main加载Spring启动，因为服务通常不需要Tomcat/JBoss等Web容器的特性，没必要用Web容器去加载服务；

在源码的根目dubbo-3.1下使用命令构建本地调试环境：

```java
mvn clean install -Dmaven.test.skip=true
```

Dubbo的模块很多，这个命令将会执行很长的时间。

### 3 运行dubbo案例

打开dubbo-demo模块，这里面是最常见的各种整合Dubbo的demo，我们可以直接运行他们，其中dubbo-demo-annotation、dubbo-demo-spring-boot、dubbo-demo-xml是我们需要掌握的。

注意：运行之前需要更改zookeeper的地址为自己的zookeeper地址，如何安装zookeeper？[阿里云ECS云服务器基于docker安装zookeeper并且操作](https://blog.csdn.net/weixin_43767015/article/details/118697146)。

我们随便运行一个项目，例如dubbo-demo-xml-provider，这是一个基于xml的生产者，然后启动dubbo-demo-xml-consumer，这是基于xml的消费者，可以看到成功的进行了接口调用。

到此，说明我们的Dubbo源码环境搭建完毕，此时可以在其他任意模块debug，写注释，后面的文章我们将会继续分析源码！
