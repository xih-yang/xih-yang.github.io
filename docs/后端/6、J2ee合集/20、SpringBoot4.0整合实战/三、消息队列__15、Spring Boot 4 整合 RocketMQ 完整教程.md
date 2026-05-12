# 15、Spring Boot 4 整合 RocketMQ 完整教程
- 来源：https://ddkk.com/springboot/4-action/15.html
- 分类：Spring Boot 4 整合教程
- 分组：三、消息队列
- 日期：2025-12-08
在XX场景下,我们经常需要处理高并发、大流量的消息,传统的消息队列可能扛不住;后来听说阿里开源的RocketMQ这玩意儿不错,性能高、可靠性强、支持事务消息和顺序消息,特别适合电商、金融这些对一致性要求高的场景;但是直接用原生RocketMQ客户端写,那叫一个麻烦,连接管理、消息发送、消费监听、事务控制,一堆底层代码写得人头疼;后来发现RocketMQ Spring Boot Starter直接把这些都封装好了,用起来贼简单;现在Spring Boot 4出来了,整合RocketMQ更是方便得不行,自动配置给你整得明明白白,咱今天就聊聊Spring Boot 4咋整合RocketMQ的。

其实RocketMQ在Spring Boot里早就支持了,你只要加个`rocketmq-spring-boot-starter`依赖,基本上就能用;但是很多兄弟不知道里面的门道,也不知道咋用RocketMQTemplate、@RocketMQMessageListener、事务消息、顺序消息这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

## 项目搭建和环境准备

### 创建Maven项目

首先你得有个Maven项目,用IDEA或者Eclipse都行,或者直接用Spring Initializr生成;项目结构大概是这样:

```plaintext
spring-boot-rocketmq-demo/
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

这是最关键的,依赖配置不对后面全是坑;Spring Boot 4需要Java 17以上,而且需要添加RocketMQ Spring Boot Starter依赖。

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
    <artifactId>spring-boot-rocketmq-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 RocketMQ Demo</name>
    <description>Spring Boot 4整合RocketMQ示例项目</description>
    <properties>
        <java.version>17</java.version>  <!-- Java 17以上 -->
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <!-- RocketMQ Spring Boot Starter版本 -->
        <rocketmq-spring-boot-starter.version>2.3.0</rocketmq-spring-boot-starter.version>
    </properties>
    <dependencies>
        <!-- Spring Boot Web Starter: 包含Spring MVC、Tomcat等 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <!-- RocketMQ Spring Boot Starter: RocketMQ集成支持 -->
        <dependency>
            <groupId>org.apache.rocketmq</groupId>
            <artifactId>rocketmq-spring-boot-starter</artifactId>
            <version>${rocketmq-spring-boot-starter.version}</version>
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

RocketMQ Spring Boot Starter的配置通过`rocketmq.*`属性控制,配置起来贼简单:

```yaml
spring:
  application:
    name: spring-boot-rocketmq-demo  # 应用名称
# RocketMQ配置
rocketmq:
  # NameServer地址: RocketMQ的服务发现地址
  name-server: localhost:9876
  # 生产者配置
  producer:
    # 生产者组名: 用于标识一组生产者
    group: my-producer-group
    # 发送消息超时时间(毫秒)
    send-message-timeout: 3000
    # 消息体最大大小(字节)
    max-message-size: 4194304
    # 压缩消息体阈值(字节),超过此值会压缩
    compress-message-body-threshold: 4096
    # 同步发送失败重试次数
    retry-times-when-send-failed: 2
    # 异步发送失败重试次数
    retry-times-when-send-async-failed: 2
    # 是否启用VIP通道(内部网络)
    vip-channel-enabled: false
    # 是否启用消息轨迹
    enable-msg-trace: true
    # 自定义消息轨迹主题
    customized-trace-topic: RMQ_SYS_TRACE_TOPIC
    # 访问密钥(如果启用ACL)
    access-key: 
    # 密钥(如果启用ACL)
    secret-key: 
  # 消费者配置(全局默认配置)
  consumer:
    # 消费者组名
    group: my-consumer-group
    # 消费模式: CLUSTERING(集群模式)或BROADCASTING(广播模式)
    message-model: CLUSTERING
    # 消费类型: CONCURRENTLY(并发消费)或ORDERLY(顺序消费)
    consume-mode: CONCURRENTLY
    # 消费线程数最小值
    consume-thread-min: 20
    # 消费线程数最大值
    consume-thread-max: 64
    # 最大重试次数
    max-reconsume-times: 16
    # 消费超时时间(分钟)
    consume-timeout: 15
    # 是否启用VIP通道
    vip-channel-enabled: false
    # 是否启用消息轨迹
    enable-msg-trace: true
    # 自定义消息轨迹主题
    customized-trace-topic: RMQ_SYS_TRACE_TOPIC
    # 访问密钥(如果启用ACL)
    access-key: 
    # 密钥(如果启用ACL)
    secret-key: 
```

## 基础使用: 发送和接收消息

### 消息生产者: 使用RocketMQTemplate

RocketMQTemplate是RocketMQ Spring Boot Starter提供的发送消息的模板类,自动配置好了,直接注入就能用:

```java
package com.example.demo.producer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.rocketmq.spring.core.RocketMQTemplate;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Component;
/**
 * RocketMQ消息生产者
 * 负责发送消息到RocketMQ
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderProducer {
    // 注入RocketMQTemplate,Spring Boot自动配置好了
    private final RocketMQTemplate rocketMQTemplate;
    /**
     * 发送简单消息
     * @param topic Topic名称
     * @param message 消息内容
     */
    public void sendMessage(String topic, String message) {
        // 发送消息到指定Topic
        rocketMQTemplate.convertAndSend(topic, message);
        log.info("发送消息到Topic: {}, 消息内容: {}", topic, message);
    }
    /**
     * 发送带Tag的消息
     * Tag用于消息过滤,可以更精确地路由消息
     * @param topic Topic名称
     * @param tag Tag名称
     * @param message 消息内容
     */
    public void sendMessageWithTag(String topic, String tag, String message) {
        // 发送消息,格式: topic:tag
        String destination = topic + ":" + tag;
        rocketMQTemplate.convertAndSend(destination, message);
        log.info("发送消息到Topic: {}, Tag: {}, 消息内容: {}", topic, tag, message);
    }
    /**
     * 发送带Key的消息
     * Key用于消息查询和去重
     * @param topic Topic名称
     * @param key 消息Key
     * @param message 消息内容
     */
    public void sendMessageWithKey(String topic, String key, String message) {
        // 构建消息,设置Key
        org.springframework.messaging.Message<String> msg = MessageBuilder.withPayload(message)
                .setHeader("KEYS", key)  // 设置消息Key
                .build();
        // 发送消息
        rocketMQTemplate.send(topic, msg);
        log.info("发送消息到Topic: {}, Key: {}, 消息内容: {}", topic, key, message);
    }
    /**
     * 同步发送消息
     * 等待发送结果,适合需要确认发送成功的场景
     */
    public void sendMessageSync(String topic, String message) {
        try {
            // 同步发送,返回SendResult
            org.apache.rocketmq.client.producer.SendResult result = 
                    rocketMQTemplate.syncSend(topic, message);
            log.info("消息发送成功, MessageId: {}, QueueId: {}", 
                    result.getMsgId(), result.getMessageQueue().getQueueId());
        } catch (Exception e) {
            log.error("消息发送失败", e);
            throw new RuntimeException("发送消息失败", e);
        }
    }
    /**
     * 异步发送消息
     * 不等待发送结果,适合高并发场景
     */
    public void sendMessageAsync(String topic, String message) {
        // 异步发送,带回调
        rocketMQTemplate.asyncSend(topic, message, new org.apache.rocketmq.client.producer.SendCallback() {
            @Override
            public void onSuccess(org.apache.rocketmq.client.producer.SendResult sendResult) {
                // 发送成功回调
                log.info("消息发送成功, MessageId: {}", sendResult.getMsgId());
            }
            @Override
            public void onException(Throwable e) {
                // 发送失败回调
                log.error("消息发送失败", e);
            }
        });
    }
    /**
     * 单向发送消息
     * 不关心发送结果,性能最高
     */
    public void sendMessageOneWay(String topic, String message) {
        // 单向发送,不等待结果
        rocketMQTemplate.sendOneWay(topic, message);
        log.info("单向发送消息到Topic: {}, 消息内容: {}", topic, message);
    }
}
```

### 消息消费者: 使用@RocketMQMessageListener

@RocketMQMessageListener是RocketMQ Spring Boot Starter提供的注解,标注在类上就能接收消息:

```java
package com.example.demo.consumer;
import lombok.extern.slf4j.Slf4j;
import org.apache.rocketmq.spring.annotation.RocketMQMessageListener;
import org.apache.rocketmq.spring.core.RocketMQListener;
import org.springframework.stereotype.Service;
/**
 * RocketMQ消息消费者
 * 负责接收和处理RocketMQ消息
 */
@Slf4j
@Service
@RocketMQMessageListener(
        topic = "order-topic",           // Topic名称
        consumerGroup = "order-consumer-group",  // 消费者组
        consumeMode = org.apache.rocketmq.common.protocol.heartbeat.MessageModel.CONCURRENTLY  // 并发消费
)
public class OrderConsumer implements RocketMQListener<String> {
    /**
     * 处理消息
     * 实现RocketMQListener接口的onMessage方法
     */
    @Override
    public void onMessage(String message) {
        // 处理消息
        log.info("收到订单消息: {}", message);
        // 这里写你的业务逻辑
    }
}
```

### 带Tag过滤的消费者

```java
package com.example.demo.consumer;
import lombok.extern.slf4j.Slf4j;
import org.apache.rocketmq.spring.annotation.RocketMQMessageListener;
import org.apache.rocketmq.spring.core.RocketMQListener;
import org.springframework.stereotype.Service;
/**
 * 带Tag过滤的消费者
 * 只消费指定Tag的消息
 */
@Slf4j
@Service
@RocketMQMessageListener(
        topic = "order-topic",
        selectorExpression = "create",  // 只消费Tag为create的消息
        consumerGroup = "order-create-consumer-group"
)
public class OrderCreateConsumer implements RocketMQListener<String> {
    @Override
    public void onMessage(String message) {
        log.info("收到订单创建消息: {}", message);
        // 处理订单创建逻辑...
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
import org.apache.rocketmq.spring.core.RocketMQTemplate;
import org.springframework.stereotype.Component;
/**
 * 订单生产者
 * 发送Order对象到RocketMQ
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderJsonProducer {
    private final RocketMQTemplate rocketMQTemplate;
    /**
     * 发送订单对象
     * RocketMQ Spring Boot Starter会自动用JSON序列化
     * @param order 订单对象
     */
    public void sendOrder(Order order) {
        // 发送Order对象,RocketMQ会自动用JSON序列化
        rocketMQTemplate.convertAndSend("order-topic", order);
        log.info("发送订单: {}", order);
    }
}
```

```java
package com.example.demo.consumer;
import com.example.demo.entity.Order;
import lombok.extern.slf4j.Slf4j;
import org.apache.rocketmq.spring.annotation.RocketMQMessageListener;
import org.apache.rocketmq.spring.core.RocketMQListener;
import org.springframework.stereotype.Service;
/**
 * 订单消费者
 * 接收Order对象
 */
@Slf4j
@Service
@RocketMQMessageListener(
        topic = "order-topic",
        consumerGroup = "order-consumer-group"
)
public class OrderJsonConsumer implements RocketMQListener<Order> {
    /**
     * 消费订单对象
     * RocketMQ会自动反序列化成Order对象
     */
    @Override
    public void onMessage(Order order) {
        log.info("收到订单: 订单ID={}, 用户ID={}, 金额={}", 
                order.getOrderId(), order.getUserId(), order.getAmount());
        // 处理订单业务逻辑...
    }
}
```

### 顺序消息

RocketMQ支持顺序消息,保证同一消息队列的消息按顺序消费:

```java
package com.example.demo.producer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.rocketmq.spring.core.RocketMQTemplate;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Component;
/**
 * 顺序消息生产者
 * 保证消息按顺序发送和消费
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderSequenceProducer {
    private final RocketMQTemplate rocketMQTemplate;
    /**
     * 发送顺序消息
     * 相同orderId的消息会发送到同一个队列,保证顺序
     * @param orderId 订单ID(作为消息队列选择器)
     * @param message 消息内容
     */
    public void sendOrderMessage(String orderId, String message) {
        // 构建消息,设置消息队列选择器
        org.springframework.messaging.Message<String> msg = MessageBuilder.withPayload(message)
                .setHeader("KEYS", orderId)  // 设置Key,用于选择队列
                .build();
        // 同步发送顺序消息
        // 第三个参数是消息队列选择器,相同orderId会发送到同一队列
        rocketMQTemplate.syncSendOrderly("order-topic", msg, orderId);
        log.info("发送顺序消息: OrderId={}, Message={}", orderId, message);
    }
}
```

```java
package com.example.demo.consumer;
import lombok.extern.slf4j.Slf4j;
import org.apache.rocketmq.spring.annotation.RocketMQMessageListener;
import org.apache.rocketmq.spring.core.RocketMQListener;
import org.springframework.stereotype.Service;
/**
 * 顺序消息消费者
 * 保证消息按顺序消费
 */
@Slf4j
@Service
@RocketMQMessageListener(
        topic = "order-topic",
        consumerGroup = "order-sequence-consumer-group",
        consumeMode = org.apache.rocketmq.common.protocol.heartbeat.MessageModel.CONCURRENTLY,
        consumeMode = org.apache.rocketmq.common.consume.ConsumeMode.ORDERLY  // 顺序消费模式
)
public class OrderSequenceConsumer implements RocketMQListener<String> {
    @Override
    public void onMessage(String message) {
        log.info("顺序消费消息: {}", message);
        // 处理顺序消息,保证同一订单的消息按顺序处理
    }
}
```

### 延迟消息

RocketMQ支持延迟消息,可以指定消息延迟多久后消费:

```java
package com.example.demo.producer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.rocketmq.spring.core.RocketMQTemplate;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Component;
/**
 * 延迟消息生产者
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DelayedMessageProducer {
    private final RocketMQTemplate rocketMQTemplate;
    /**
     * 发送延迟消息
     * @param topic Topic名称
     * @param message 消息内容
     * @param delayLevel 延迟级别(1-18,对应不同的延迟时间)
     *                    1: 1秒, 2: 5秒, 3: 10秒, 4: 30秒, 5: 1分钟...
     */
    public void sendDelayedMessage(String topic, String message, int delayLevel) {
        // 构建消息,设置延迟级别
        org.springframework.messaging.Message<String> msg = MessageBuilder.withPayload(message)
                .setHeader("DELAY", delayLevel)  // 设置延迟级别
                .build();
        // 发送延迟消息
        rocketMQTemplate.syncSend(topic, msg);
        log.info("发送延迟消息: Topic={}, DelayLevel={}, Message={}", topic, delayLevel, message);
    }
}
```

### 事务消息

RocketMQ支持事务消息,保证本地事务和消息发送的一致性:

```java
package com.example.demo.producer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.rocketmq.spring.core.RocketMQTemplate;
import org.apache.rocketmq.spring.support.RocketMQHeaders;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Component;
/**
 * 事务消息生产者
 * 保证本地事务和消息发送的一致性
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TransactionMessageProducer {
    private final RocketMQTemplate rocketMQTemplate;
    /**
     * 发送事务消息
     * @param topic Topic名称
     * @param message 消息内容
     * @param transactionId 事务ID
     */
    public void sendTransactionMessage(String topic, String message, String transactionId) {
        // 构建事务消息
        org.springframework.messaging.Message<String> msg = MessageBuilder.withPayload(message)
                .setHeader(RocketMQHeaders.TRANSACTION_ID, transactionId)  // 事务ID
                .build();
        // 发送事务消息
        rocketMQTemplate.sendMessageInTransaction("tx-producer-group", topic, msg, null);
        log.info("发送事务消息: Topic={}, TransactionId={}, Message={}", topic, transactionId, message);
    }
}
```

```java
package com.example.demo.producer;
import lombok.extern.slf4j.Slf4j;
import org.apache.rocketmq.spring.annotation.RocketMQTransactionListener;
import org.apache.rocketmq.spring.core.RocketMQLocalTransactionListener;
import org.apache.rocketmq.spring.core.RocketMQLocalTransactionState;
import org.springframework.messaging.Message;
import org.springframework.stereotype.Component;
/**
 * 事务消息监听器
 * 处理事务消息的本地事务和回查
 */
@Slf4j
@Component
@RocketMQTransactionListener(txProducerGroup = "tx-producer-group")
public class OrderTransactionListener implements RocketMQLocalTransactionListener {
    /**
     * 执行本地事务
     * @param msg 消息
     * @param arg 参数
     * @return 事务状态
     */
    @Override
    public RocketMQLocalTransactionState executeLocalTransaction(Message msg, Object arg) {
        try {
            // 执行本地事务(如保存订单到数据库)
            String orderId = (String) msg.getHeaders().get("orderId");
            log.info("执行本地事务: OrderId={}", orderId);
            // 业务逻辑...
            // 本地事务成功,提交消息
            return RocketMQLocalTransactionState.COMMIT;
        } catch (Exception e) {
            log.error("本地事务执行失败", e);
            // 本地事务失败,回滚消息
            return RocketMQLocalTransactionState.ROLLBACK;
        }
    }
    /**
     * 回查本地事务状态
     * 如果消息状态未知,会调用此方法回查
     * @param msg 消息
     * @return 事务状态
     */
    @Override
    public RocketMQLocalTransactionState checkLocalTransaction(Message msg) {
        // 回查本地事务状态
        String orderId = (String) msg.getHeaders().get("orderId");
        log.info("回查本地事务: OrderId={}", orderId);
        // 查询本地事务状态
        // boolean exists = orderRepository.existsById(orderId);
        // return exists ? RocketMQLocalTransactionState.COMMIT : RocketMQLocalTransactionState.ROLLBACK;
        // 这里简化处理,实际应该查询数据库
        return RocketMQLocalTransactionState.COMMIT;
    }
}
```

## 最佳实践

### 1. 消息幂等性处理

```java
package com.example.demo.service;
import lombok.extern.slf4j.Slf4j;
import org.apache.rocketmq.spring.annotation.RocketMQMessageListener;
import org.apache.rocketmq.spring.core.RocketMQListener;
import org.springframework.stereotype.Service;
import java.util.concurrent.ConcurrentHashMap;
/**
 * 订单服务
 * 演示消息幂等性处理
 */
@Slf4j
@Service
@RocketMQMessageListener(
        topic = "order-topic",
        consumerGroup = "order-consumer-group"
)
public class OrderService implements RocketMQListener<String> {
    // 使用内存缓存记录已处理的消息ID(生产环境建议用Redis)
    private final ConcurrentHashMap<String, Boolean> processedMessages = new ConcurrentHashMap<>();
    /**
     * 处理订单消息(幂等性保证)
     * 使用消息ID确保消息只处理一次
     */
    @Override
    public void onMessage(String message) {
        // 从消息中提取消息ID(实际应该从消息头获取)
        String messageId = extractMessageId(message);
        // 检查消息是否已处理
        if (processedMessages.containsKey(messageId)) {
            log.warn("消息已处理,跳过: MessageId={}", messageId);
            return;
        }
        try {
            // 处理订单业务逻辑
            log.info("处理订单: MessageId={}, Message={}", messageId, message);
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
    private String extractMessageId(String message) {
        // 简化处理,实际应该从消息头获取
        return String.valueOf(message.hashCode());
    }
}
```

### 2. 批量消费消息

```java
package com.example.demo.consumer;
import lombok.extern.slf4j.Slf4j;
import org.apache.rocketmq.spring.annotation.RocketMQMessageListener;
import org.apache.rocketmq.spring.core.RocketMQListener;
import org.springframework.stereotype.Service;
import java.util.List;
/**
 * 批量消息消费者
 * 提高处理效率
 */
@Slf4j
@Service
@RocketMQMessageListener(
        topic = "order-topic",
        consumerGroup = "order-batch-consumer-group",
        consumeMessageBatchMaxSize = 10  // 批量消费最大数量
)
public class OrderBatchConsumer implements RocketMQListener<List<String>> {
    /**
     * 批量消费消息
     * 一次接收多条消息,提高处理效率
     */
    @Override
    public void onMessage(List<String> messages) {
        log.info("批量收到 {} 条消息", messages.size());
        // 批量处理消息
        for (String message : messages) {
            log.info("处理消息: {}", message);
            // 业务逻辑...
        }
    }
}
```

### 3. 监控和管理

```java
package com.example.demo.controller;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.rocketmq.spring.core.RocketMQTemplate;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
/**
 * RocketMQ管理控制器
 * 提供消息发送和管理功能
 */
@Slf4j
@RestController
@RequestMapping("/admin/rocketmq")
@RequiredArgsConstructor
public class RocketMQAdminController {
    private final RocketMQTemplate rocketMQTemplate;
    /**
     * 发送测试消息
     */
    @PostMapping("/send")
    public Map<String, Object> sendMessage(@RequestParam String topic, 
                                           @RequestParam String message) {
        try {
            rocketMQTemplate.convertAndSend(topic, message);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "消息发送成功");
            return result;
        } catch (Exception e) {
            log.error("消息发送失败", e);
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "消息发送失败: " + e.getMessage());
            return result;
        }
    }
}
```

## 总结

Spring Boot 4整合RocketMQ确实方便,RocketMQ Spring Boot Starter给你整得明明白白;用RocketMQTemplate发送消息、@RocketMQMessageListener接收消息,简单得不行;支持JSON序列化、顺序消息、延迟消息、事务消息这些高级功能,基本能满足大部分业务需求;消息幂等性、批量消费这些也都有现成的方案,用起来贼顺手。

兄弟们在实际项目中用RocketMQ的时候,注意几个点:一是合理设置消费者线程数和批量消费大小,提高处理能力;二是做好消息幂等性处理,保证消息不重复消费;三是合理使用顺序消息和事务消息,保证业务一致性;四是监控好消息积压和消费延迟情况,及时发现问题;五是生产环境记得配置好ACL和消息轨迹,提高安全性和可追溯性。

好了,今天就聊到这,有啥问题评论区见。
