# 14、Spring Boot 4 整合 RabbitMQ 完整教程
- 来源：https://ddkk.com/springboot/4-action/14.html
- 分类：Spring Boot 4 整合教程
- 分组：三、消息队列
- 日期：2025-12-08
你有没有遇到过这样的情况,系统需要解耦、异步处理、削峰填谷,但是用传统的HTTP调用太麻烦,同步等待还容易超时;后来听说消息队列能解决这些问题,选来选去发现RabbitMQ这玩意儿不错,功能全、可靠性高、社区活跃;但是直接用原生AMQP客户端写,那叫一个复杂,连接管理、交换机声明、队列绑定、消息确认,一堆代码写得人头疼;后来发现Spring AMQP直接把这些都封装好了,用起来贼简单;现在Spring Boot 4出来了,整合RabbitMQ更是方便得不行,自动配置给你整得明明白白,咱今天就聊聊Spring Boot 4咋整合RabbitMQ的。

其实RabbitMQ在Spring Boot里早就支持了,你只要加个`spring-boot-starter-amqp`依赖,基本上就能用;但是很多兄弟不知道里面的门道,也不知道咋用RabbitTemplate、@RabbitListener、消息确认、死信队列这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

## 项目搭建和环境准备

### 创建Maven项目

首先你得有个Maven项目,用IDEA或者Eclipse都行,或者直接用Spring Initializr生成;项目结构大概是这样:

```plaintext
spring-boot-rabbitmq-demo/
├── pom.xml                          # Maven配置文件
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── demo/
│   │   │               ├── Application.java          # 启动类
│   │   │               ├── entity/                   # 实体类目录
│   │   │               ├── producer/                 # 生产者目录
│   │   │               ├── consumer/                 # 消费者目录
│   │   │               ├── service/                  # 服务层目录
│   │   │               ├── controller/               # 控制器目录
│   │   │               └── config/                   # 配置类目录
│   │   └── resources/
│   │       ├── application.yml                       # 配置文件
│   └── test/
│       └── java/                                     # 测试代码目录
```

### pom.xml完整配置

这是最关键的,依赖配置不对后面全是坑;Spring Boot 4需要Java 17以上,而且Spring Boot 4默认使用Spring AMQP 3.x版本。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <!-- 继承Spring Boot父POM,统一管理版本 -->
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>4.0.0</version>  <!-- Spring Boot 4.0版本 -->
        <relativePath/>
    </parent>
    <groupId>com.example</groupId>
    <artifactId>spring-boot-rabbitmq-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 RabbitMQ Demo</name>
    <description>Spring Boot 4整合RabbitMQ示例项目</description>
    <properties>
        <java.version>17</java.version>  <!-- Java 17以上 -->
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>
    <dependencies>
        <!-- Spring Boot Web Starter: 包含Spring MVC、Tomcat等 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <!-- Spring Boot AMQP Starter: 包含Spring AMQP和RabbitMQ支持 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-amqp</artifactId>
        </dependency>
        <!-- Spring Boot Test: 测试支持 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <!-- Lombok: 简化Java代码(可选,但强烈推荐) -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <!-- Spring Boot Maven插件: 打包成可执行JAR -->
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

### application.yml配置

Spring Boot 4的RabbitMQ自动配置通过`spring.rabbitmq.*`属性控制,配置起来贼简单:

```yaml
spring:
  application:
    name: spring-boot-rabbitmq-demo  # 应用名称
  # RabbitMQ配置
  rabbitmq:
    # 连接配置
    host: localhost          # RabbitMQ服务器地址
    port: 5672               # RabbitMQ端口
    username: guest          # 用户名
    password: guest          # 密码
    virtual-host: /          # 虚拟主机
    # 连接池配置
    cache:
      connection:
        mode: channel        # 连接模式: channel(单连接多通道)或connection(多连接)
        size: 1              # 连接池大小
      channel:
        size: 25             # 通道池大小
        checkout-timeout: 0   # 获取通道超时时间(毫秒),0表示不超时
    # 发布确认配置
    publisher-confirm-type: correlated  # 确认类型: none(不确认)、simple(简单确认)、correlated(关联确认)
    publisher-returns: true              # 是否启用返回机制
    # 模板配置
    template:
      mandatory: true        # 消息无法路由时是否返回
      receive-timeout: 0      # 接收超时时间(毫秒)
      reply-timeout: 5000     # 回复超时时间(毫秒)
      retry:
        enabled: true         # 是否启用重试
        initial-interval: 1000  # 初始重试间隔(毫秒)
        max-attempts: 3       # 最大重试次数
        multiplier: 1.0      # 重试间隔倍数
        max-interval: 10000  # 最大重试间隔(毫秒)
    # 监听器配置
    listener:
      type: simple           # 监听器类型: simple(简单)或direct(直接)
      simple:
        acknowledge-mode: manual  # 确认模式: none(不确认)、auto(自动确认)、manual(手动确认)
        concurrency: 1        # 最小并发数
        max-concurrency: 10  # 最大并发数
        prefetch: 1          # 预取数量
        retry:
          enabled: true      # 是否启用重试
          initial-interval: 1000  # 初始重试间隔
          max-attempts: 3    # 最大重试次数
          multiplier: 1.0    # 重试间隔倍数
          max-interval: 10000  # 最大重试间隔
```

## 基础使用: 发送和接收消息

### 创建交换机和队列配置

首先得创建交换机、队列和绑定关系,Spring Boot 4会自动创建你定义的Bean:

```java
package com.example.demo.config;
import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
/**
 * RabbitMQ配置类
 * 定义交换机、队列和绑定关系
 */
@Configuration
public class RabbitMQConfig {
    /**
     * 创建直连交换机
     * 直连交换机根据routing key精确匹配路由消息
     */
    @Bean
    public DirectExchange orderExchange() {
        return ExchangeBuilder.directExchange("order.exchange")
                .durable(true)  // 持久化,服务器重启后不丢失
                .build();
    }
    /**
     * 创建订单队列
     * 队列用于存储消息
     */
    @Bean
    public Queue orderQueue() {
        return QueueBuilder.durable("order.queue")  // 持久化队列
                .build();
    }
    /**
     * 创建绑定关系
     * 将队列绑定到交换机,指定routing key
     */
    @Bean
    public Binding orderBinding() {
        return BindingBuilder.bind(orderQueue())
                .to(orderExchange())
                .with("order.create");  // routing key
    }
    /**
     * 创建主题交换机
     * 主题交换机支持通配符匹配routing key
     */
    @Bean
    public TopicExchange topicExchange() {
        return ExchangeBuilder.topicExchange("topic.exchange")
                .durable(true)
                .build();
    }
    /**
     * 创建主题队列
     */
    @Bean
    public Queue topicQueue() {
        return QueueBuilder.durable("topic.queue")
                .build();
    }
    /**
     * 主题绑定
     * 支持通配符: *匹配一个单词, #匹配多个单词
     */
    @Bean
    public Binding topicBinding() {
        return BindingBuilder.bind(topicQueue())
                .to(topicExchange())
                .with("order.*");  // 匹配order.开头的routing key
    }
    /**
     * 创建死信交换机
     * 处理失败或过期的消息
     */
    @Bean
    public DirectExchange deadLetterExchange() {
        return ExchangeBuilder.directExchange("dlx.exchange")
                .durable(true)
                .build();
    }
    /**
     * 创建死信队列
     */
    @Bean
    public Queue deadLetterQueue() {
        return QueueBuilder.durable("dlx.queue")
                .build();
    }
    /**
     * 死信队列绑定
     */
    @Bean
    public Binding deadLetterBinding() {
        return BindingBuilder.bind(deadLetterQueue())
                .to(deadLetterExchange())
                .with("dlx.routing.key");
    }
    /**
     * 创建带死信队列的订单队列
     * 消息处理失败或过期后会发送到死信队列
     */
    @Bean
    public Queue orderQueueWithDlx() {
        return QueueBuilder.durable("order.queue.dlx")
                .withArgument("x-dead-letter-exchange", "dlx.exchange")  // 死信交换机
                .withArgument("x-dead-letter-routing-key", "dlx.routing.key")  // 死信routing key
                .withArgument("x-message-ttl", 60000)  // 消息过期时间(毫秒)
                .build();
    }
}
```

### 消息生产者: 使用RabbitTemplate

RabbitTemplate是Spring AMQP提供的发送消息的模板类,自动配置好了,直接注入就能用:

```java
package com.example.demo.producer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageBuilder;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.stereotype.Component;
import java.util.UUID;
/**
 * RabbitMQ消息生产者
 * 负责发送消息到RabbitMQ
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderProducer {
    // 注入RabbitTemplate,Spring Boot自动配置好了
    private final RabbitTemplate rabbitTemplate;
    /**
     * 发送简单消息
     * @param routingKey 路由键
     * @param message 消息内容
     */
    public void sendMessage(String routingKey, String message) {
        // 发送消息到交换机,根据routing key路由到队列
        rabbitTemplate.convertAndSend("order.exchange", routingKey, message);
        log.info("发送消息到交换机: order.exchange, RoutingKey: {}, 消息内容: {}", routingKey, message);
    }
    /**
     * 发送消息并设置消息属性
     * 可以设置消息的优先级、过期时间等属性
     */
    public void sendMessageWithProperties(String routingKey, String message) {
        // 构建消息,设置消息属性
        Message msg = MessageBuilder.withBody(message.getBytes())
                .setContentType("text/plain")  // 内容类型
                .setPriority(5)                 // 消息优先级(0-255)
                .setExpiration("60000")        // 消息过期时间(毫秒)
                .setMessageId(UUID.randomUUID().toString())  // 消息ID
                .build();
        // 发送消息
        rabbitTemplate.send("order.exchange", routingKey, msg);
        log.info("发送消息(带属性): RoutingKey: {}, 消息内容: {}", routingKey, message);
    }
    /**
     * 发送消息并获取确认
     * 使用发布确认机制,确保消息发送成功
     */
    public void sendMessageWithConfirm(String routingKey, String message) {
        // 创建关联数据,用于确认回调
        CorrelationData correlationData = new CorrelationData(UUID.randomUUID().toString());
        // 发送消息,带关联数据
        rabbitTemplate.convertAndSend("order.exchange", routingKey, message, correlationData);
        log.info("发送消息(带确认): CorrelationId: {}, RoutingKey: {}, 消息内容: {}", 
                correlationData.getId(), routingKey, message);
    }
    /**
     * 发送消息到主题交换机
     * 使用通配符routing key
     */
    public void sendTopicMessage(String routingKey, String message) {
        rabbitTemplate.convertAndSend("topic.exchange", routingKey, message);
        log.info("发送主题消息: RoutingKey: {}, 消息内容: {}", routingKey, message);
    }
}
```

### 配置发布确认和返回回调

为了确保消息发送成功,需要配置确认和返回回调:

```java
package com.example.demo.config;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.context.annotation.Configuration;
import javax.annotation.PostConstruct;
/**
 * RabbitMQ确认回调配置
 * 配置消息发送确认和返回机制
 */
@Slf4j
@Configuration
public class RabbitMQConfirmConfig {
    private final RabbitTemplate rabbitTemplate;
    public RabbitMQConfirmConfig(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }
    /**
     * 配置确认和返回回调
     * 在Bean初始化后设置回调
     */
    @PostConstruct
    public void init() {
        // 设置确认回调: 消息发送到交换机后的确认
        rabbitTemplate.setConfirmCallback(new RabbitTemplate.ConfirmCallback() {
            @Override
            public void confirm(CorrelationData correlationData, boolean ack, String cause) {
                if (ack) {
                    // 消息发送成功
                    log.info("消息发送成功, CorrelationId: {}", correlationData != null ? correlationData.getId() : "null");
                } else {
                    // 消息发送失败
                    log.error("消息发送失败, CorrelationId: {}, 原因: {}", 
                            correlationData != null ? correlationData.getId() : "null", cause);
                }
            }
        });
        // 设置返回回调: 消息无法路由到队列时的返回
        rabbitTemplate.setReturnsCallback(returned -> {
            log.error("消息无法路由, 消息: {}, 回复码: {}, 回复文本: {}, 交换机: {}, 路由键: {}", 
                    new String(returned.getMessage().getBody()),
                    returned.getReplyCode(),
                    returned.getReplyText(),
                    returned.getExchange(),
                    returned.getRoutingKey());
        });
    }
}
```

### 消息消费者: 使用@RabbitListener

@RabbitListener是Spring AMQP提供的注解,标注在方法上就能接收消息:

```java
package com.example.demo.consumer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;
import com.rabbitmq.client.Channel;
/**
 * RabbitMQ消息消费者
 * 负责接收和处理RabbitMQ消息
 */
@Slf4j
@Component
public class OrderConsumer {
    /**
     * 简单消息监听
     * queues: 监听的队列名称
     */
    @RabbitListener(queues = "order.queue")
    public void consumeOrder(String message) {
        // 处理消息
        log.info("收到订单消息: {}", message);
        // 这里写你的业务逻辑
    }
    /**
     * 带消息头信息的监听
     * @Payload: 消息体
     * @Header: 消息头信息
     */
    @RabbitListener(queues = "order.queue")
    public void consumeOrderWithHeaders(
            @Payload String message,
            @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag,
            @Header(AmqpHeaders.REDELIVERED) boolean redelivered) {
        log.info("收到消息 - DeliveryTag: {}, Redelivered: {}, 内容: {}", 
                deliveryTag, redelivered, message);
    }
    /**
     * 手动确认消息
     * 配置了acknowledge-mode: manual时需要手动确认
     * 确认后RabbitMQ才会认为消息处理成功
     */
    @RabbitListener(queues = "order.queue")
    public void consumeOrderWithAck(
            @Payload String message,
            Channel channel,
            @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) {
        try {
            // 处理消息
            log.info("处理订单消息: {}", message);
            // 业务逻辑...
            // 处理成功后确认消息
            // multiple: false表示只确认当前消息
            channel.basicAck(deliveryTag, false);
            log.info("消息处理成功并确认, DeliveryTag: {}", deliveryTag);
        } catch (Exception e) {
            log.error("消息处理失败", e);
            try {
                // 拒绝消息并重新入队
                // requeue: true表示重新入队,false表示丢弃或发送到死信队列
                channel.basicNack(deliveryTag, false, true);
            } catch (Exception ex) {
                log.error("拒绝消息失败", ex);
            }
        }
    }
    /**
     * 消费主题队列消息
     * 支持通配符匹配
     */
    @RabbitListener(queues = "topic.queue")
    public void consumeTopicMessage(String message) {
        log.info("收到主题消息: {}", message);
        // 处理主题消息...
    }
    /**
     * 消费死信队列消息
     * 处理失败或过期的消息
     */
    @RabbitListener(queues = "dlx.queue")
    public void consumeDeadLetterMessage(String message) {
        log.error("收到死信队列消息: {}", message);
        // 记录日志、告警、人工处理等
    }
}
```

## 高级功能

### 发送JSON消息

实际项目中经常需要发送对象,这时候用JSON序列化:

```java
package com.example.demo.entity;
import lombok.Data;
import java.time.LocalDateTime;
/**
 * 订单实体
 */
@Data
public class Order {
    private String orderId;      // 订单ID
    private String userId;        // 用户ID
    private Double amount;        // 订单金额
    private LocalDateTime createTime;  // 创建时间
}
```

```java
package com.example.demo.producer;
import com.example.demo.entity.Order;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;
/**
 * 订单生产者
 * 发送Order对象到RabbitMQ
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderJsonProducer {
    private final RabbitTemplate rabbitTemplate;
    /**
     * 发送订单对象
     * Spring AMQP会自动用JSON序列化
     * @param order 订单对象
     */
    public void sendOrder(Order order) {
        // 发送Order对象,Spring AMQP会自动用JSON序列化
        rabbitTemplate.convertAndSend("order.exchange", "order.create", order);
        log.info("发送订单: {}", order);
    }
}
```

```java
package com.example.demo.consumer;
import com.example.demo.entity.Order;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
/**
 * 订单消费者
 * 接收Order对象
 */
@Slf4j
@Component
public class OrderJsonConsumer {
    /**
     * 消费订单对象
     * Spring AMQP会自动反序列化成Order对象
     */
    @RabbitListener(queues = "order.queue")
    public void consumeOrder(Order order) {
        log.info("收到订单: 订单ID={}, 用户ID={}, 金额={}", 
                order.getOrderId(), order.getUserId(), order.getAmount());
        // 处理订单业务逻辑...
    }
}
```

配置JSON消息转换器:

```java
package com.example.demo.config;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
/**
 * RabbitMQ消息转换器配置
 */
@Configuration
public class RabbitMQMessageConverterConfig {
    /**
     * 配置JSON消息转换器
     * 自动将对象转换为JSON格式
     */
    @Bean
    public MessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
```

### 延迟消息

RabbitMQ支持延迟消息,通过延迟插件实现:

```java
package com.example.demo.config;
import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
/**
 * 延迟消息配置
 * 需要安装rabbitmq-delayed-message-exchange插件
 */
@Configuration
public class DelayedMessageConfig {
    /**
     * 创建延迟交换机
     * 使用x-delayed-message类型
     */
    @Bean
    public CustomExchange delayedExchange() {
        return new CustomExchange("delayed.exchange", 
                "x-delayed-message",  // 延迟消息类型
                true,  // 持久化
                false);  // 不自动删除
    }
    /**
     * 创建延迟队列
     */
    @Bean
    public Queue delayedQueue() {
        return QueueBuilder.durable("delayed.queue")
                .build();
    }
    /**
     * 绑定延迟队列
     */
    @Bean
    public Binding delayedBinding() {
        return BindingBuilder.bind(delayedQueue())
                .to(delayedExchange())
                .with("delayed.routing.key")
                .noargs();
    }
}
```

```java
package com.example.demo.producer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageBuilder;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;
/**
 * 延迟消息生产者
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DelayedMessageProducer {
    private final RabbitTemplate rabbitTemplate;
    /**
     * 发送延迟消息
     * @param message 消息内容
     * @param delayMillis 延迟时间(毫秒)
     */
    public void sendDelayedMessage(String message, long delayMillis) {
        // 构建消息,设置延迟时间
        Message msg = MessageBuilder.withBody(message.getBytes())
                .setHeader("x-delay", delayMillis)  // 延迟时间(毫秒)
                .build();
        // 发送到延迟交换机
        rabbitTemplate.send("delayed.exchange", "delayed.routing.key", msg);
        log.info("发送延迟消息: 消息内容={}, 延迟时间={}ms", message, delayMillis);
    }
}
```

### 消息重试和死信队列

配置消息重试和死信队列处理失败的消息:

```java
package com.example.demo.config;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.retry.MessageRecoverer;
import org.springframework.amqp.rabbit.retry.RejectAndDontRequeueRecoverer;
import org.springframework.boot.autoconfigure.amqp.SimpleRabbitListenerContainerFactoryConfigurer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
/**
 * 消息重试和死信队列配置
 */
@Configuration
public class RetryAndDlxConfig {
    /**
     * 配置消息恢复器
     * 重试失败后的处理策略
     */
    @Bean
    public MessageRecoverer messageRecoverer() {
        // 拒绝消息并发送到死信队列
        return new RejectAndDontRequeueRecoverer();
    }
    /**
     * 配置监听器容器工厂
     * 应用重试和死信队列配置
     */
    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            SimpleRabbitListenerContainerFactoryConfigurer configurer,
            ConnectionFactory connectionFactory,
            MessageRecoverer messageRecoverer) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        configurer.configure(factory, connectionFactory);
        // 设置消息恢复器
        factory.setRecoveryBackOff(new org.springframework.retry.backoff.ExponentialBackOffPolicy());
        factory.setMessageRecoverer(messageRecoverer);
        return factory;
    }
}
```

## 最佳实践

### 1. 消息幂等性处理

```java
package com.example.demo.service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;
import java.util.concurrent.ConcurrentHashMap;
/**
 * 订单服务
 * 演示消息幂等性处理
 */
@Slf4j
@Service
public class OrderService {
    // 使用内存缓存记录已处理的消息ID(生产环境建议用Redis)
    private final ConcurrentHashMap<String, Boolean> processedMessages = new ConcurrentHashMap<>();
    /**
     * 处理订单消息(幂等性保证)
     * 使用消息ID确保消息只处理一次
     */
    @RabbitListener(queues = "order.queue")
    public void processOrder(String messageId, String orderData) {
        // 检查消息是否已处理
        if (processedMessages.containsKey(messageId)) {
            log.warn("消息已处理,跳过: MessageId={}", messageId);
            return;
        }
        try {
            // 处理订单业务逻辑
            log.info("处理订单: MessageId={}, OrderData={}", messageId, orderData);
            // 业务逻辑...
            // 标记消息已处理
            processedMessages.put(messageId, true);
            log.info("订单处理成功: MessageId={}", messageId);
        } catch (Exception e) {
            log.error("订单处理失败: MessageId={}", messageId, e);
            // 不标记为已处理,允许重试
            throw e;
        }
    }
}
```

### 2. 批量消费消息

```java
package com.example.demo.consumer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import java.util.List;
/**
 * 批量消息消费者
 */
@Slf4j
@Component
public class BatchConsumer {
    /**
     * 批量消费消息
     * 配置prefetch和concurrency提高处理效率
     */
    @RabbitListener(queues = "order.queue", 
                    containerFactory = "batchRabbitListenerContainerFactory")
    public void consumeBatch(List<String> messages) {
        log.info("批量收到 {} 条消息", messages.size());
        // 批量处理消息
        for (String message : messages) {
            log.info("处理消息: {}", message);
            // 业务逻辑...
        }
    }
}
```

配置批量监听器容器工厂:

```java
package com.example.demo.config;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.boot.autoconfigure.amqp.SimpleRabbitListenerContainerFactoryConfigurer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
/**
 * 批量监听器配置
 */
@Configuration
public class BatchListenerConfig {
    /**
     * 配置批量监听器容器工厂
     */
    @Bean
    public SimpleRabbitListenerContainerFactory batchRabbitListenerContainerFactory(
            SimpleRabbitListenerContainerFactoryConfigurer configurer,
            ConnectionFactory connectionFactory) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        configurer.configure(factory, connectionFactory);
        // 设置批量接收
        factory.setBatchListener(true);
        // 设置批量大小
        factory.setBatchSize(10);
        // 设置接收超时
        factory.setReceiveTimeout(5000L);
        return factory;
    }
}
```

### 3. 监控和管理

```java
package com.example.demo.controller;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
/**
 * RabbitMQ管理控制器
 * 提供队列监控和管理功能
 */
@RestController
@RequestMapping("/admin/rabbitmq")
@RequiredArgsConstructor
public class RabbitMQAdminController {
    private final RabbitAdmin rabbitAdmin;
    private final RabbitTemplate rabbitTemplate;
    /**
     * 获取队列信息
     */
    @GetMapping("/queues/{queueName}")
    public Map<String, Object> getQueueInfo(@PathVariable String queueName) {
        Map<String, Object> info = new HashMap<>();
        // 获取队列属性
        org.springframework.amqp.core.QueueInformation queueInfo = 
                rabbitAdmin.getQueueInfo(queueName);
        if (queueInfo != null) {
            info.put("queueName", queueName);
            info.put("messageCount", queueInfo.getMessageCount());
            info.put("consumerCount", queueInfo.getConsumerCount());
        }
        return info;
    }
    /**
     * 清空队列
     */
    @DeleteMapping("/queues/{queueName}")
    public String purgeQueue(@PathVariable String queueName) {
        rabbitAdmin.purgeQueue(queueName);
        return "队列 " + queueName + " 已清空";
    }
}
```

## 总结

Spring Boot 4整合RabbitMQ确实方便,自动配置给你整得明明白白;用RabbitTemplate发送消息、@RabbitListener接收消息,简单得不行;支持JSON序列化、延迟消息、死信队列、消息确认这些高级功能,基本能满足大部分业务需求;重试机制、幂等性处理、批量消费这些也都有现成的方案,用起来贼顺手。

兄弟们在实际项目中用RabbitMQ的时候,注意几个点:一是合理设置预取数量和并发数,提高处理能力;二是做好消息确认和幂等性处理,保证消息不丢失不重复;三是配置好死信队列,处理失败的消息;四是监控好队列积压情况,及时发现问题;五是生产环境记得配置好连接池和重试机制,提高可靠性。

好了,今天就聊到这,有啥问题评论区见。
