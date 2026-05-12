# 03、Kafka 实战 - 源码环境准备
- 来源：https://ddkk.com/zhuanlan/mq/kafka/6/3.html
- 分类：消息队列
- 分组：教程目录
> Kafka 官网：https://kafka.apache.org
>
> Kafka github：https://github.com/apache/kafka

### 一、下载源码包

**1、官网**

**2、Github**

### 二、源码结构

- bin：运行脚本
- clients：客户端（新版本的生产者和消费者）
- config：配置文件
- connect：Kafka 连接器组件
- core：Kafka 核心组件
- examples：客户端案例
- streams：Kafka 流处理库
- tools：工具类

### 三、环境准备

- Kafka 源码使用 Gradle 管理，在根目录下使用 gradle idea 命令生成项目，并导入 IDEA 中
- 需要使用对应的 gradle 版本，否则会报错，0.10.1.0 是 gradle-3.0

在 kafka.core.src.main 下面创建 resources 资源目录，添加 log4j.properties 日志配置以查看相关日志

可以参考其他模块的 log 配置

```java
log4j.rootLogger=INFO, stdout
log4j.appender.stdout=org.apache.log4j.ConsoleAppender
log4j.appender.stdout.layout=org.apache.log4j.PatternLayout
log4j.appender.stdout.layout.ConversionPattern=[%d] %p %m (%c:%L)%n
log4j.logger.kafka=INFO
log4j.logger.org.apache.kafka=ERROR
# zkclient can be verbose, during debugging it is common to adjust is separately
log4j.logger.org.I0Itec.zkclient.ZkClient=WARN
log4j.logger.org.apache.zookeeper=WARN
```

- 运行 core.src.main.scala.kafka.Kafka
- 需要配置启动参数 config/server.properties

- 查看日志可以看到 Kafka config、ZK 连接、logs 加载、启动一些后台工作线程(如：log cleanup、log flusher、网络服务端、选举控制器、启动消费组协调者等)
- 最后输出 [Kafka Server 0] 表示 Kafka 在本机开发环境中启动成功
