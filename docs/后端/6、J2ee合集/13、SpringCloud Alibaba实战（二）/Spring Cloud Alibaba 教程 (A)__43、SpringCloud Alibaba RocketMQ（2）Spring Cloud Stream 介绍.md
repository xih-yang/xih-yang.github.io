# 43、SpringCloud Alibaba RocketMQ（2）Spring Cloud Stream 介绍
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/2/76.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
Spring Cloud Stream 是一个用于构建基于消息的微服务应用框架。它基于 SpringBoot 来创建具有生产级别的单机 Spring 应用，并且使用 Spring Integration 与 Broker 进行连接。

Spring Cloud Stream 提供了消息中间件配置的统一抽象，推出了 publish-subscribe、 consumer groups、partition 这些统一的概念。

**Spring Cloud Stream 内部有两个概念：Binder 和 Binding：**

Binder: 跟外部消息中间件集成的组件，用来创建 Binding，各消息中间件都有自己的 Binder 实现。

举例说明：Kafka 的实现 KafkaMessageChannelBinder，RabbitMQ 的实现 RabbitMessageChannelBinder 以及 RocketMQ 的实现 RocketMQMessageChannelBinder

Binding: 包括 Input Binding 和 Output Binding。

Binding 在消息中间件与应用程序提供的 Provider 和 Consumer 之间提供了一个桥梁，实现了开发者只需使用应用程序的 Provider 或 Consumer 生产或消费数据即可，屏蔽了开发者与底层消息中间件的接触
