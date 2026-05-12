# 13、Spring Boot 4 整合 Kafka 完整教程
- 来源：https://ddkk.com/springboot/4-action/13.html
- 分类：Spring Boot 4 整合教程
- 分组：三、消息队列
- 日期：2025-12-08
上次做项目的时候,需要搞个消息队列来处理异步任务,选来选去最后定了Kafka;刚开始用原生Kafka客户端写,那叫一个麻烦,连接管理、序列化、异常处理、事务控制,一堆底层代码写得人头疼;后来发现Spring Kafka这玩意儿,直接把这些都封装好了,用起来贼简单;现在Spring Boot 4出来了,整合Kafka更是方便得不行,自动配置给你整得明明白白,咱今天就聊聊Spring Boot 4咋整合Kafka的。

其实Kafka在Spring Boot里早就支持了,你只要加个`spring-kafka`依赖,基本上就能用;但是很多兄弟不知道里面的门道,也不知道咋用KafkaTemplate、@KafkaListener、Kafka Streams这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

## 项目搭建和环境准备

### 创建Maven项目

首先你得有个Maven项目,用IDEA或者Eclipse都行,或者直接用Spring Initializr生成;项目结构大概是这样:

```plaintext
spring-boot-kafka-demo/
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

这是最关键的,依赖配置不对后面全是坑;Spring Boot 4需要Java 17以上,而且Spring Boot 4默认使用Kafka客户端3.8.x版本。

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
    <artifactId>spring-boot-kafka-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 Kafka Demo</name>
    <description>Spring Boot 4整合Kafka示例项目</description>
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
        <!-- Spring Kafka: Kafka集成支持 -->
        <dependency>
            <groupId>org.springframework.kafka</groupId>
            <artifactId>spring-kafka</artifactId>
        </dependency>
        <!-- Kafka Streams: 流处理支持(可选) -->
        <dependency>
            <groupId>org.apache.kafka</groupId>
            <artifactId>kafka-streams</artifactId>
        </dependency>
        <!-- Spring Boot Test: 测试支持 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <!-- Spring Kafka Test: 嵌入式Kafka测试支持 -->
        <dependency>
            <groupId>org.springframework.kafka</groupId>
            <artifactId>spring-kafka-test</artifactId>
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

Spring Boot 4的Kafka自动配置通过`spring.kafka.*`属性控制,配置起来贼简单:

```yaml
spring:
  application:
    name: spring-boot-kafka-demo  # 应用名称
  # Kafka配置
  kafka:
    # 连接配置: Kafka服务器地址
    bootstrap-servers: localhost:9092
    # 生产者配置
    producer:
      # 键序列化器: 消息的key用什么序列化
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      # 值序列化器: 消息的value用什么序列化
      value-serializer: org.apache.kafka.common.serialization.StringSerializer
      # 确认机制: all表示所有副本都确认才返回
      acks: all
      # 重试次数: 发送失败时重试3次
      retries: 3
      # 批量大小: 一次发送多少条消息(字节)
      batch-size: 16384
      # 缓冲区大小: 生产者缓冲区大小(字节)
      buffer-memory: 33554432
      # 额外属性配置
      properties:
        # 最大未确认请求数: 保证消息顺序
        max.in.flight.requests.per.connection: 1
        # 启用幂等性: 防止重复消息
        enable.idempotence: true
        # 压缩类型: 可选gzip、snappy、lz4、zstd
        compression.type: snappy
    # 消费者配置
    consumer:
      # 消费者组ID: 同一个组的消费者会负载均衡消费
      group-id: my-consumer-group
      # 键反序列化器: 消息的key用什么反序列化
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      # 值反序列化器: 消息的value用什么反序列化
      value-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      # 自动提交偏移量: true表示自动提交,false需要手动提交
      enable-auto-commit: false
      # 自动提交间隔: 自动提交时多久提交一次(毫秒)
      auto-commit-interval: 1000
      # 偏移量重置策略: earliest从最早开始,latest从最新开始
      auto-offset-reset: earliest
      # 一次拉取的最大记录数
      max-poll-records: 500
      # 额外属性配置
      properties:
        # 会话超时时间: 消费者多久没心跳就认为挂了(毫秒)
        session.timeout.ms: 30000
        # 心跳间隔: 消费者多久发送一次心跳(毫秒)
        heartbeat.interval.ms: 3000
    # 监听器配置
    listener:
      # 确认模式: manual手动确认,batch批量确认
      ack-mode: manual_immediate
      # 并发数: 每个监听器启动几个线程
      concurrency: 3
      # 批量监听: 是否批量接收消息
      type: batch
    # Kafka Streams配置(如果使用流处理)
    streams:
      # 应用ID: Streams应用的唯一标识
      application-id: ${spring.application.name}-streams
      # 引导服务器: 可以覆盖全局配置
      bootstrap-servers: ${spring.kafka.bootstrap-servers}
      # 默认键序列化器
      default-key-serde: org.apache.kafka.common.serialization.Serdes$StringSerde
      # 默认值序列化器
      default-value-serde: org.apache.kafka.common.serialization.Serdes$StringSerde
      # 额外属性
      properties:
        # 提交间隔: 多久提交一次处理进度(毫秒)
        commit.interval.ms: 1000
```

## 基础使用: 发送和接收消息

### 创建Topic配置

首先得创建Topic,Spring Boot 4会自动创建你定义的Topic Bean:

```java
package com.example.demo.config;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import java.time.Duration;
/**
 * Kafka Topic配置类
 * 定义项目中用到的所有Topic
 */
@Configuration
public class KafkaTopicConfig {
    /**
     * 创建订单Topic
     * partitions: 分区数,提高并发处理能力
     * replicas: 副本数,保证高可用
     */
    @Bean
    public NewTopic orderTopic() {
        return TopicBuilder.name("orders")
                .partitions(3)  // 3个分区,可以3个消费者并行处理
                .replicas(1)    // 1个副本(单机环境)
                .build();
    }
    /**
     * 创建支付Topic
     * 带保留时间配置
     */
    @Bean
    public NewTopic paymentTopic() {
        return TopicBuilder.name("payments")
                .partitions(5)  // 5个分区
                .replicas(1)
                .config("retention.ms", String.valueOf(Duration.ofDays(7).toMillis()))  // 保留7天
                .build();
    }
    /**
     * 创建死信队列Topic
     * 处理失败的消息会发送到这里
     */
    @Bean
    public NewTopic orderDltTopic() {
        return TopicBuilder.name("orders.DLT")  // DLT = Dead Letter Topic
                .partitions(1)
                .replicas(1)
                .config("retention.ms", String.valueOf(Duration.ofDays(30).toMillis()))  // 保留30天
                .build();
    }
}
```

### 消息生产者: 使用KafkaTemplate

KafkaTemplate是Spring Kafka提供的发送消息的模板类,自动配置好了,直接注入就能用:

```java
package com.example.demo.producer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;
import org.springframework.util.concurrent.ListenableFuture;
import org.springframework.util.concurrent.ListenableFutureCallback;
/**
 * Kafka消息生产者
 * 负责发送消息到Kafka Topic
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderProducer {
    // 注入KafkaTemplate,Spring Boot自动配置好了
    private final KafkaTemplate<String, String> kafkaTemplate;
    /**
     * 发送简单消息
     * @param topic Topic名称
     * @param message 消息内容
     */
    public void sendMessage(String topic, String message) {
        // 发送消息,不指定key,Kafka会自动分配分区
        kafkaTemplate.send(topic, message);
        log.info("发送消息到Topic: {}, 消息内容: {}", topic, message);
    }
    /**
     * 发送带key的消息
     * 相同key的消息会发送到同一个分区,保证顺序
     * @param topic Topic名称
     * @param key 消息key
     * @param message 消息内容
     */
    public void sendMessageWithKey(String topic, String key, String message) {
        // 发送消息,指定key,相同key会到同一分区
        kafkaTemplate.send(topic, key, message);
        log.info("发送消息到Topic: {}, Key: {}, 消息内容: {}", topic, key, message);
    }
    /**
     * 发送消息并获取结果(异步)
     * 可以监听发送结果,处理成功或失败的回调
     */
    public void sendMessageAsync(String topic, String key, String message) {
        // 发送消息,返回Future对象
        ListenableFuture<SendResult<String, String>> future = 
                kafkaTemplate.send(topic, key, message);
        // 添加回调,处理发送结果
        future.addCallback(new ListenableFutureCallback<SendResult<String, String>>() {
            @Override
            public void onSuccess(SendResult<String, String> result) {
                // 发送成功回调
                log.info("消息发送成功, Topic: {}, Partition: {}, Offset: {}", 
                        result.getRecordMetadata().topic(),
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
            }
            @Override
            public void onFailure(Throwable ex) {
                // 发送失败回调
                log.error("消息发送失败, Topic: {}, 错误: {}", topic, ex.getMessage(), ex);
            }
        });
    }
    /**
     * 发送消息(同步)
     * 等待发送完成才返回,适合需要确认发送结果的场景
     */
    public void sendMessageSync(String topic, String key, String message) {
        try {
            // 发送消息并等待结果
            SendResult<String, String> result = kafkaTemplate.send(topic, key, message).get();
            log.info("消息发送成功, Offset: {}", result.getRecordMetadata().offset());
        } catch (Exception e) {
            log.error("消息发送失败", e);
            throw new RuntimeException("发送消息失败", e);
        }
    }
}
```

### 消息消费者: 使用@KafkaListener

@KafkaListener是Spring Kafka提供的注解,标注在方法上就能接收消息:

```java
package com.example.demo.consumer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;
import java.util.List;
/**
 * Kafka消息消费者
 * 负责接收和处理Kafka消息
 */
@Slf4j
@Component
public class OrderConsumer {
    /**
     * 简单消息监听
     * topics: 监听的Topic名称,可以多个
     * groupId: 消费者组ID,不指定就用配置文件里的
     */
    @KafkaListener(topics = "orders", groupId = "order-consumer-group")
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
    @KafkaListener(topics = "orders", groupId = "order-consumer-group")
    public void consumeOrderWithHeaders(
            @Payload String message,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset) {
        log.info("收到消息 - Topic: {}, Partition: {}, Offset: {}, 内容: {}", 
                topic, partition, offset, message);
    }
    /**
     * 手动确认消息
     * 配置了ack-mode: manual_immediate时需要手动确认
     * 确认后Kafka才会认为消息处理成功
     */
    @KafkaListener(topics = "orders", groupId = "order-consumer-group")
    public void consumeOrderWithAck(
            @Payload String message,
            Acknowledgment acknowledgment) {
        try {
            // 处理消息
            log.info("处理订单消息: {}", message);
            // 业务逻辑...
            // 处理成功后确认消息
            acknowledgment.acknowledge();
            log.info("消息处理成功并确认");
        } catch (Exception e) {
            log.error("消息处理失败", e);
            // 不确认消息,会重新消费
            // 或者发送到死信队列
        }
    }
    /**
     * 批量消费消息
     * 配置了type: batch后可以批量接收
     * 提高处理效率,减少网络开销
     */
    @KafkaListener(topics = "orders", groupId = "order-consumer-group")
    public void consumeOrderBatch(@Payload List<String> messages) {
        log.info("批量收到 {} 条消息", messages.size());
        // 批量处理消息
        for (String message : messages) {
            log.info("处理消息: {}", message);
            // 业务逻辑...
        }
    }
    /**
     * 消费死信队列消息
     * 处理失败的消息会发送到这里
     */
    @KafkaListener(topics = "orders.DLT", groupId = "dlt-consumer-group")
    public void consumeDltMessage(String message) {
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
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;
/**
 * 订单生产者
 * 发送Order对象到Kafka
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderJsonProducer {
    // 使用泛型指定key和value的类型
    private final KafkaTemplate<String, Order> kafkaTemplate;
    /**
     * 发送订单对象
     * @param order 订单对象
     */
    public void sendOrder(Order order) {
        // 发送Order对象,Spring Kafka会自动用JSON序列化
        kafkaTemplate.send("orders", order.getOrderId(), order);
        log.info("发送订单: {}", order);
    }
}
```

```java
package com.example.demo.consumer;
import com.example.demo.entity.Order;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
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
     * Spring Kafka会自动反序列化成Order对象
     */
    @KafkaListener(topics = "orders", groupId = "order-consumer-group")
    public void consumeOrder(Order order) {
        log.info("收到订单: 订单ID={}, 用户ID={}, 金额={}", 
                order.getOrderId(), order.getUserId(), order.getAmount());
        // 处理订单业务逻辑...
    }
}
```

配置JSON序列化器:

```yaml
spring:
  kafka:
    producer:
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
    consumer:
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
      properties:
        # 指定反序列化的目标类型
        spring.json.type.mapping: order:com.example.demo.entity.Order
        # 信任所有包(生产环境建议指定具体包)
        spring.json.trusted.packages: "*"
```

### Kafka事务支持

Kafka支持事务消息,保证消息的原子性:

```java
package com.example.demo.config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.transaction.KafkaTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;
/**
 * Kafka事务配置
 */
@Configuration
@EnableTransactionManagement
public class KafkaTransactionConfig {
    /**
     * 配置Kafka事务管理器
     * 启用事务后,消息发送和数据库操作可以在一个事务中
     */
    @Bean
    public KafkaTransactionManager<String, Object> kafkaTransactionManager(
            KafkaTemplate<String, Object> kafkaTemplate) {
        return new KafkaTransactionManager<>(kafkaTemplate.getProducerFactory());
    }
}
```

```java
package com.example.demo.service;
import com.example.demo.entity.Order;
import com.example.demo.producer.OrderJsonProducer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
/**
 * 订单服务
 * 演示事务消息的使用
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderJsonProducer orderProducer;
    private final KafkaTemplate<String, Order> kafkaTemplate;
    /**
     * 创建订单(事务方法)
     * 数据库操作和Kafka消息发送在同一个事务中
     * 要么都成功,要么都回滚
     */
    @Transactional
    public void createOrder(Order order) {
        // 1. 保存订单到数据库
        // orderRepository.save(order);
        log.info("保存订单到数据库: {}", order.getOrderId());
        // 2. 发送消息到Kafka(事务消息)
        // 如果数据库操作失败,这个消息也不会发送
        kafkaTemplate.executeInTransaction(operations -> {
            operations.send("orders", order.getOrderId(), order);
            return null;
        });
        log.info("发送订单消息到Kafka: {}", order.getOrderId());
    }
}
```

### Kafka Streams流处理

Kafka Streams是Kafka提供的流处理库,Spring Boot 4也支持:

```java
package com.example.demo.streams;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.common.serialization.Serdes;
import org.apache.kafka.streams.KeyValue;
import org.apache.kafka.streams.StreamsBuilder;
import org.apache.kafka.streams.kstream.KStream;
import org.apache.kafka.streams.kstream.Produced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafkaStreams;
import java.util.Locale;
/**
 * Kafka Streams配置
 * 实现流式数据处理
 */
@Slf4j
@Configuration
@EnableKafkaStreams
public class KafkaStreamsConfig {
    /**
     * 定义流处理逻辑
     * 从输入Topic读取数据,处理后写入输出Topic
     */
    @Bean
    public KStream<String, String> kStream(StreamsBuilder streamsBuilder) {
        // 从输入Topic创建流
        KStream<String, String> stream = streamsBuilder.stream("orders-input");
        // 处理流数据: 将消息转换为大写
        stream.map((key, value) -> {
                    log.info("处理消息: key={}, value={}", key, value);
                    // 转换为大写
                    String upperValue = value.toUpperCase(Locale.getDefault());
                    return new KeyValue<>(key, upperValue);
                })
                // 写入输出Topic
                .to("orders-output", 
                    Produced.with(Serdes.String(), Serdes.String()));
        return stream;
    }
}
```

## 最佳实践

### 1. 错误处理和重试

```java
package com.example.demo.config;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.support.serializer.ErrorHandlingDeserializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.util.backoff.BackOff;
import org.springframework.util.backoff.FixedBackOff;
/**
 * Kafka错误处理配置
 */
@Slf4j
@Configuration
public class KafkaErrorHandlerConfig {
    /**
     * 配置错误处理器
     * 消息处理失败时自动重试
     */
    @Bean
    public DefaultErrorHandler errorHandler() {
        // 重试策略: 最多重试3次,每次间隔1秒
        BackOff backOff = new FixedBackOff(1000L, 3L);
        // 创建错误处理器
        DefaultErrorHandler errorHandler = new DefaultErrorHandler(backOff);
        // 设置重试失败后的回调
        errorHandler.setRetryListeners((record, ex, deliveryAttempt) -> {
            log.warn("重试消息处理, 尝试次数: {}, 消息: {}", 
                    deliveryAttempt, record.value());
        });
        return errorHandler;
    }
    /**
     * 配置监听器容器工厂
     * 应用错误处理器
     */
    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, String> kafkaListenerContainerFactory(
            ConsumerFactory<String, String> consumerFactory,
            DefaultErrorHandler errorHandler) {
        ConcurrentKafkaListenerContainerFactory<String, String> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory);
        // 设置错误处理器
        factory.setCommonErrorHandler(errorHandler);
        return factory;
    }
}
```

### 2. 监控和管理

```java
package com.example.demo.controller;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.config.KafkaListenerEndpointRegistry;
import org.springframework.kafka.listener.MessageListenerContainer;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;
/**
 * Kafka管理控制器
 * 提供监听器的启动、停止、暂停、恢复等管理功能
 */
@RestController
@RequestMapping("/admin/kafka")
@RequiredArgsConstructor
public class KafkaAdminController {
    private final KafkaListenerEndpointRegistry registry;
    /**
     * 暂停监听器
     */
    @PostMapping("/listeners/{id}/pause")
    public String pauseListener(@PathVariable String id) {
        MessageListenerContainer container = registry.getListenerContainer(id);
        if (container != null) {
            container.pause();
            return "监听器 " + id + " 已暂停";
        }
        return "监听器 " + id + " 不存在";
    }
    /**
     * 恢复监听器
     */
    @PostMapping("/listeners/{id}/resume")
    public String resumeListener(@PathVariable String id) {
        MessageListenerContainer container = registry.getListenerContainer(id);
        if (container != null) {
            container.resume();
            return "监听器 " + id + " 已恢复";
        }
        return "监听器 " + id + " 不存在";
    }
    /**
     * 停止监听器
     */
    @PostMapping("/listeners/{id}/stop")
    public String stopListener(@PathVariable String id) {
        MessageListenerContainer container = registry.getListenerContainer(id);
        if (container != null) {
            container.stop();
            return "监听器 " + id + " 已停止";
        }
        return "监听器 " + id + " 不存在";
    }
    /**
     * 启动监听器
     */
    @PostMapping("/listeners/{id}/start")
    public String startListener(@PathVariable String id) {
        MessageListenerContainer container = registry.getListenerContainer(id);
        if (container != null) {
            container.start();
            return "监听器 " + id + " 已启动";
        }
        return "监听器 " + id + " 不存在";
    }
    /**
     * 获取所有监听器状态
     */
    @GetMapping("/listeners")
    public Map<String, String> getAllListeners() {
        return registry.getListenerContainers().stream()
                .collect(Collectors.toMap(
                        MessageListenerContainer::getListenerId,
                        container -> container.isRunning() ? "运行中" : "已停止"
                ));
    }
}
```

### 3. 测试支持

```java
package com.example.demo.test;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.test.annotation.DirtiesContext;
/**
 * Kafka集成测试
 * 使用嵌入式Kafka进行测试
 */
@SpringBootTest
@DirtiesContext
@EmbeddedKafka(
        partitions = 1,  // 分区数
        topics = {"test-topic"},  // 测试Topic
        bootstrapServersProperty = "spring.kafka.bootstrap-servers"  // 覆盖配置
)
class KafkaIntegrationTest {
    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;
    @Test
    void testSendAndReceive() {
        // 发送测试消息
        kafkaTemplate.send("test-topic", "test-key", "test-message");
        // 验证消息发送成功
        // 这里可以添加消费者验证消息接收
    }
}
```

## 总结

Spring Boot 4整合Kafka确实方便,自动配置给你整得明明白白;用KafkaTemplate发送消息、@KafkaListener接收消息,简单得不行;支持JSON序列化、事务消息、流处理这些高级功能,基本能满足大部分业务需求;错误处理、监控管理这些也都有现成的方案,用起来贼顺手。

兄弟们在实际项目中用Kafka的时候,注意几个点:一是合理设置分区数和消费者并发数,提高处理能力;二是做好错误处理和重试机制,保证消息不丢失;三是监控好消费者延迟和积压情况,及时发现问题;四是生产环境记得配置好安全认证和加密传输,别让人把消息给截了。

好了,今天就聊到这,有啥问题评论区见。
