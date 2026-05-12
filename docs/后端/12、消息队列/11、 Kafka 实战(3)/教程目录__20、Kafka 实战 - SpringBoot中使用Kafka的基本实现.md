# 20、Kafka 实战 - SpringBoot中使用Kafka的基本实现
- 来源：https://ddkk.com/zhuanlan/mq/kafka/3/20.html
- 分类：消息队列
- 分组：教程目录
## SpringBoot中使用Kafka的基本实现

### POM

```java
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.7.8</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>
    <groupId>com.example</groupId>
    <artifactId>kafka-springboot</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>kafka-springboot</name>
    <description>kafka-springboot</description>
    <properties>
        <java.version>1.8</java.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.kafka</groupId>
            <artifactId>spring-kafka</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-devtools</artifactId>
            <scope>runtime</scope>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

### YML

```java
server:
  port: 80
spring:
  kafka:
    bootstrap-servers: 81.68.232.188:9092,81.68.232.188:9093,81.68.232.188:9094
    producer: ⽣产者
      retries: 3 设置⼤于0的值，则客户端会将发送失败的记录重新发送
      batch-size: 16384
      buffer-memory: 33554432
      acks: 1
      指定消息key和消息体的编解码⽅式
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.apache.kafka.common.serialization.StringSerializer
    consumer:
      group-id: default-group
      enable-auto-commit: false
      auto-offset-reset: earliest
      key-deserializer:
        org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer:
        org.apache.kafka.common.serialization.StringDeserializer
      max-poll-records: 500
    listener:
      当每⼀条记录被消费者监听器（ListenerConsumer）处理之后提交
      RECORD
      当每⼀批poll()的数据被消费者监听器（ListenerConsumer）处理之后提交
      BATCH
      当每⼀批poll()的数据被消费者监听器（ListenerConsumer）处理之后，距离上
      次提交时间⼤于TIME时提交
      TIME
      当每⼀批poll()的数据被消费者监听器（ListenerConsumer）处理之后，被处理
      record数量⼤于等于COUNT时提交
      COUNT
      TIME | COUNT　有⼀个条件满⾜时提交
      COUNT_TIME
      当每⼀批poll()的数据被消费者监听器（ListenerConsumer）处理之后, ⼿动调
      ⽤Acknowledgment.acknowledge()后提交
      MANUAL
      ⼿动调⽤Acknowledgment.acknowledge()后⽴即提交，⼀般使⽤这种
      MANUAL_IMMEDIATE
      ack-mode: MANUAL_IMMEDIATE
#  redis:
#    host: 172.16.253.21
```

### LOGBACK

```java
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <logger name="org.apache.kafka.clients" level="info" />
</configuration>
```

### 生产者

```java
package com.example.kafka.springboot.controller;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import javax.annotation.Resource;
@RestController
@RequestMapping("/msg")
public class MyKafkaController {
    private final static String TOPIC_NAME = "test";
    @Resource
    private KafkaTemplate<String,String> kafkaTemplate;
    @RequestMapping("/send")
    public String sendMessage(){
        kafkaTemplate.send(TOPIC_NAME,0,"key","this is a message!");
        return "send success!";
    }
}
```

### 消费者

```java
package com.example.kafka.springboot.consumer;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;
@Component
public class MyConsumer {
    @KafkaListener(topics = "test",groupId = "default-group")
    public void listenGroup(ConsumerRecord<String, String> record, Acknowledgment ack) {
        String value = record.value();
        System.out.println(value);
        System.out.println(record);
        //⼿动提交offset
        ack.acknowledge();
    }
}
```

### 测试

通过Restful向/msg/send接口发请求，消费者会实时收到消息，可以做简单的即时通讯软件
