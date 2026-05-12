# 07、SpringBoot 整合 ActiveMQ 踩坑
- 来源：https://ddkk.com/zhuanlan/mq/activemq/1/7.html
- 分类：消息队列
- 分组：教程目录
因为工作需要使用到ActiveMQ，在使用之前，只掌握了RabbitMQ，因为MQ大同小异，理解了一个MQ，其他的MQ使用起来也不会有太大问题，就跟着网上的帖子学会了如何使用ActiceMQ

学习嘛，肯定不能一步登天，本来上来就直接ActiveMQ整合SpringBoot，搞着搞着发现整不会了，所以还是需要一步一个脚印的走，需要先在Java中学会使用ActiveMQ。

在学习过程中，因为是对比学习嘛，会拿ActiveMQ和RabbitMQ进行比较，其中不同的是，ActiveMQ没有了交换机这个概念，生产者直接定义发送消息类型为Queue或者Topic，这两者和RabbitMQ中的Queue交换机、Topic交换机可不是一个概念

- Queue类型：可以理解为RabbitMQ中的普通交换机，一个生产者发送消息，一个消费者接收消息，是1：1的概念
- Topic类型：可以理解为RabbitMQ中的发布订阅模式，一个生产者发送消息，多个消费者接收消息，是1：n的概念

## 1、Java中使用ActiveMQ只需引入一下依赖

```xml
<dependency>
    <groupId>org.apache.activemq</groupId>
    <artifactId>activemq-core</artifactId>
    <version>5.7.0</version>
</dependency>
```

## 2、ActiveMQ整合SpringBoot

**引入依赖**

这里有两个坑！！！

- 在SpringBoot2.0以前，连接池包为activemq-pool，而在SpringBoot2.1以后，连接池包为pooled-jms
- 如果你和一样，在同一个项目下既导入了activemq-core（Java使用MQ的依赖）又导入了pooled-jms，启动时会出现依赖包冲突的情况，解决办法就是删除activemq-core依赖

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-activemq</artifactId>
</dependency>
<!--ActiveMQ连接池-->
<dependency>
    <groupId>org.messaginghub</groupId>
    <artifactId>pooled-jms</artifactId>
</dependency>
```

## 3、ActiveMQ配置文件

这里是本文的第三个坑！！！

如果使用queue来发送数据的话，你会发现一点事都没有，但如果使用topic发布订阅来发送数据的话，必须配置以下信息

```sh
#默认值false，表示point to point（点到点）模式，true时代表发布订阅模式，需要手动开启
spring.jms.pub-sub-domain=true
```

## 4、废消息

本文的第四个坑！！！

在topic模式中，编辑了生产者，没有编辑消费者，因为的习惯是，启动时生产者看客户端队列中是否能接收到生产者发送的消息，结果队列名称显示了，但队列中并没有消息，这就让百思不得其解，是不是我的配置信息出了问题啊，代码哪里写错了啊之类的。

在一通百度之下，终于解决了这个小问题。

在topic模式中，消费者和生产者必须是实时交互的，也就是说有生产者发送消息，必须有消费者消费消息，如果只有生产者发送消息，发送的消息为废消息，不会存到队列中。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
