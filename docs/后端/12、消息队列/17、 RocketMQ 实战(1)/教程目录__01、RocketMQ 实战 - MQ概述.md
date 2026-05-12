# 01、RocketMQ 实战 - MQ概述
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/5/1.html
- 分类：消息队列
- 分组：教程目录
## 1、MQ简介

MQ，Message Queue，是一种提供消息队列服务的中间件，也称为消息中间件，是一套提供了消息生

产、存储、消费全过程API的软件系统。消息即数据。一般消息的体量不会很大。

## 2、MQ用途

从网上可以查看到很多的关于MQ用途的叙述，但总结起来其实就以下三点。

### 限流削峰

MQ可以将系统的超量请求暂存其中，以便系统后期可以慢慢进行处理，从而避免了请求的丢失或系统

被压垮。

### 异步解耦

上游系统对下游系统的调用若为同步调用，则会大大降低系统的吞吐量与并发度，且系统耦合度太高。

而异步调用则会解决这些问题。所以两层之间若要实现由同步到异步的转化，一般性做法就是，在这两

层间添加一个MQ层。

### 数据收集

分布式系统会产生海量级数据流，如：业务日志、监控数据、用户行为等。针对这些数据流进行实时或

批量采集汇总，然后对这些数据流进行大数据分析，这是当前互联网平台的必备技术。通过MQ完成此

类数据收集是最好的选择。

## 3、常见MQ产品

### ActiveMQ

ActiveMQ是使用Java语言开发一款MQ产品。早期很多公司与项目中都在使用。但现在的社区活跃度已

经很低。现在的项目中已经很少使用了。

### RabbitMQ

RabbitMQ是使用ErLang语言开发的一款MQ产品。其吞吐量较Kafka与RocketMQ要低，且由于其不是

Java语言开发，所以公司内部对其实现定制化开发难度较大。

### Kafka

Kafka是使用Scala/Java语言开发的一款MQ产品。其最大的特点就是高吞吐率，常用于大数据领域的实

时计算、日志采集等场景。其没有遵循任何常见的MQ协议，而是使用自研协议。对于Spring Cloud

Net􀃧ix，其仅支持RabbitMQ与Kafka。

### RocketMQ

RocketMQ是使用Java语言开发的一款MQ产品。经过数年阿里双11的考验，性能与稳定性非常高。其

没有遵循任何常见的MQ协议，而是使用自研协议。对于Spring Cloud Alibaba，其支持RabbitMQ、

Kafka，但提倡使用RocketMQ。

### 对比

## 4、MQ常见协议

一般情况下MQ的实现是要遵循一些常规性协议的。常见的协议如下：

### JMS

JMS，Java Messaging Service（Java消息服务）。是Java平台上有关MOM（Message Oriented

Middleware，面向消息的中间件 PO/OO/AO）的技术规范，它便于消息系统中的Java应用程序进行消

息交换，并且通过提供标准的产生、发送、接收消息的接口，简化企业应用的开发。ActiveMQ是该协

议的典型实现。

### STOMP

STOMP，Streaming Text Orientated Message Protocol（面向流文本的消息协议），是一种MOM设计

的简单文本协议。STOMP提供一个可互操作的连接格式，允许客户端与任意STOMP消息代理

（Broker）进行交互。ActiveMQ是该协议的典型实现，RabbitMQ通过插件可以支持该协议。

### AMQP

AMQP，Advanced Message Queuing Protocol（高级消息队列协议），一个提供统一消息服务的应用

层标准，是应用层协议的一个开放标准，是一种MOM设计。基于此协议的客户端与消息中间件可传递

消息，并不受客户端/中间件不同产品，不同开发语言等条件的限制。 RabbitMQ是该协议的典型实

现。

### MQTT

MQTT，Message Queuing Telemetry Transport（消息队列遥测传输），是IBM开发的一个即时通讯协

议，是一种二进制协议，主要用于服务器和低功耗IoT（物联网）设备间的通信。该协议支持所有平

台，几乎可以把所有联网物品和外部连接起来，被用来当做传感器和致动器的通信协议。 RabbitMQ通

过插件可以支持该协议。

## RocketMQ概述

### 1、RocketMQ简介

RocketMQ是一个统一消息引擎、轻量级数据处理平台。

RocketMQ是⼀款阿⾥巴巴开源的消息中间件。2016年11⽉28⽇，阿⾥巴巴向 Apache 软件基⾦会捐赠

RocketMQ，成为 Apache 孵化项⽬。2017 年 9 ⽉ 25 ⽇，Apache 宣布 RocketMQ孵化成为 Apache 顶

级项⽬（TLP ），成为国内⾸个互联⽹中间件在 Apache 上的顶级项⽬。

官⽹地址：http://rocketmq.apache.org

### 2、RocketMQ发展历程

2007年，阿里开始五彩石项目，Notify作为项目中交易核心消息流转系统，应运而生。Notify系统是

RocketMQ的雏形。

2010年，B2B大规模使用ActiveMQ作为阿里的消息内核。阿里急需一个具有海量堆积能力的消息系

统。
2011年初，Kafka开源。淘宝中间件团队在对Kafka进行了深入研究后，开发了一款新的MQ，MetaQ。

2012年，MetaQ发展到了v3.0版本，在它基础上进行了进一步的抽象，形成了RocketMQ，然后就将其

进行了开源。

2015年，阿里在RocketMQ的基础上，又推出了一款专门针对阿里云上用户的消息系统Aliware MQ。

2016年双十一，RocketMQ承载了万亿级消息的流转，跨越了一个新的里程碑。11⽉28⽇，阿⾥巴巴

向Apache 软件基⾦会捐赠 RocketMQ，成为 Apache 孵化项⽬。

2017 年 9 ⽉ 25 ⽇，Apache 宣布 RocketMQ孵化成为 Apache 顶级项⽬（TLP ），成为国内⾸个互联

⽹中间件在 Apache 上的顶级项⽬。
