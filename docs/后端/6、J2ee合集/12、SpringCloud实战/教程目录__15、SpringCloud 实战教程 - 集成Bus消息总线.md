# 15、SpringCloud 实战教程 - 集成Bus消息总线
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloud/2/15.html
- 分类：J2EE框架
- 分组：教程目录
## 1.概述

用SpringCloud Config时，我们可以实现配置信息手动的动态刷新，也就是远端配置信息发生改变后，需要告诉服务端配置信息发生变化后，服务端才会更新配置信息，而现在我们想要实现**分布式自动刷新配置信息**功能，这就需要我们使用SpringCloud Bus消息总线配合SpringCloud Config实现配置信息的动态刷新。SpringCloud Bus是用来将分布式系统的节点与轻量级消息系统连接起来的框架，整合了Java的事件处理机制和消息中间件的功能，**SpringCloud Bus目前支持两种消息代理：RabbitMQ和Kafka**。SpringCloud Bus能管理和传播分布式系统间的消息，就像一个分布式执行器，可用于广播状态更改、事件推送等， 也可以当做微服务间的通信通道。

## 什么是总线？

在微服务架构的系统中，通常会使用轻量级的消息代理来构建一个**共用的消息主题**，并让系统中所有微服务实例都连接上来，由于**该主题中产生的消息会被所有实例监听和消费**，所以称它为消息总线。在总线上的各个实例，都可以方便地广播一些需要让其他连接在该主题上的实例都知道的消息。

SpringCloud Config客户端的实例都监听消息队列中的同一个主题（topic）（默认是SpringCloud Bus），当一个服务器刷新数据的时候，它会把这个信息放入到主题中，这样其他监听了同一主题的服务就能得到通知，然后去更新自身的配置。

## 2. SpringCloud Bus动态刷新全局广播

在学习SpringCloud Config的时候我们已经建立了服务cloud-config-client-3355作为Config的客户端，这里为了演示广播效果，我们增加复杂度，再以3355为模板再制作另一个Config的客户端3366，建立Module：cloud-config-client-3366，其结构和cloud-config-client-3355类似，修改下服务端口号即可

**消息总线的两种设计思想：**

- **方案一**：利用消息总线**触发一个客户端/bus/refresh端点**，而后刷新所有客户端的配置：
- **方案二**：利用消息总线**触发一个服务端ConfigServer的/bus/refresh端点**，而后刷新所有客户端的配置：

明显第二种架构更加合适，第一种架构不合适的原因主要有：
- 打破了微服务的职责单一性，因为微服务本身是业务模块，它本不应该承担配置刷新的职责；
- 破坏了微服务各节点的对等性；
- 有一定的局限性，比如在微服务迁移时，它的网络地址常常会发生变化，此时如果想要做到自动刷新，那就会增加更多的修改。

所以虽然从技术上两种方案都可以实现，但是无疑在技术选型上我们应该选择第二种方案。

**1. 给cloud-config-center-3344配置服务中心服务端ConfigServer添加消息总线支持**

在其POM文件中添加使用RabbitMQ实现消息总线的依赖：

```java
<!--添加消息总线RabbitMQ支持-->
<dependency>
	<groupId>org.springframework.cloud</groupId>
	<artifactId>spring-cloud-starter-bus-amqp</artifactId>
</dependency>
```

然后在其yaml配置文件中添加RabbitMQ的相关配置，暴露SpringCloud Bus刷新配置的端点

```java
# RabbitMQ相关配置
spring:
  rabbitmq:
    host: localhost
    port: 5672
    username: guest
    password: guest
# 暴露总线刷新配置的端点  
management:
  endpoints:
    web:
      exposure:
        include: 'bus-refresh'
```

**2. 给cloud-config-client-3355/3366两个客户端添加消息总线支持**

在其POM文件中添加RabbitMQ实现总线的依赖（同ConfigServer的相关依赖）：

```java
<!--添加消息总线RabbitMQ支持-->
<dependency>
	<groupId>org.springframework.cloud</groupId>
	<artifactId>spring-cloud-starter-bus-amqp</artifactId>
</dependency>
```

然后在其yaml配置文件中添加RabbitMQ的相关配置：

```java
# RabbitMQ相关配置
spring:
  rabbitmq:
    host: localhost
    port: 5672
    username: guest
    password: guest
```

**3. 测试**

按顺序启动Eureka服务注册中心7001/7002，ConfigServer配置中心3344，ConfigClient配置中心客户端3355/3366，此时远端GitHub上的配置信息如下：

```java
config:
  info: "spring cloud config-dev, version=3"
```

分别访问配置中心及其配置中心客户端的服务中心：

然后将GitHub远端的配置信息中的版本号改为4，然后**对服务配置中心发送POST请求**：

```java
curl -X POST "{配置中心的地址}/actuator/bus-refresh"
```

如，此时我们该发送的POST请求为：

```java
curl -X POST "http://localhost:3344/actuator/bus-refresh"
```

此时再访问配置中心及客户端的配置信息：

发现所有服务的配置信息都得到了更新，打开RabbitMQ的控制面板，我们可以发现有一个交换机，这就对应消息总线发送消息的交换机：

## 3. SpringCloud Bus动态刷新定点通知

再全局广播中，我们更新配置文件的信息对所有服务都进行了通知，但是假设我们只想通知3355，而不想通知3366又该怎么办呢，这就需要我们用定点通知的方法通知3355，也就是说我们进行消息通知时只指定具体某个实例生效而不是全部生效，这种情况下就需要修改我们发送的POST请求：

```java
curl -X POST "http://{配置中心的地址}/actuator/bus-refresh/{destination}"
```

这样的话，/bus/refresh请求就不再发送到具体的服务实例上，而是发给ConfigServer配置中心并通过destination参数指定需要更新配置的服务或实例。其中destination具体为**微服务+端口号**。

比如现在我们修改远端配置文件，但是我们只想通知3355的配置更新信息，而不想通知3366，此时我们发送的POST请求就应该是：

```java
curl -X POST "http://localhost:3344/actuator/bus-refresh/config-client:3355"
```

修改GitHub上远端配置文件信息，将版本号改为5，然后**对服务配置中心发送上面的POST请求**，

此时我们再访问配置中心及其客户端的配置中心，我们发现3355的配置信息得到了更新，而3344的配置中心仍然是之前的配置：
