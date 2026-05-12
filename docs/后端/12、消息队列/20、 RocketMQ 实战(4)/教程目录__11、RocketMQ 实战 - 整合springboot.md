# 11、RocketMQ 实战 - 整合springboot
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/8/11.html
- 分类：消息队列
- 分组：教程目录
## 整合springboot

### 添加依赖

```java
<!-- https://mvnrepository.com/artifact/org.apache.rocketmq/rocketmq-spring-boot-starter -->
<dependency>
    <groupId>org.apache.rocketmq</groupId>
    <artifactId>rocketmq-spring-boot-starter</artifactId>
    <version>2.0.4</version>
</dependency>
```

### 配置文件

> rocketmq.name-server=ip1:port1;ip2:port2
>
> rocketmq-producer.group=groupName

### 生产者

```java
 @Autowired
 private RocketMQTemplate rocketMQTemplate;
 public void produce(){
       rocketMQTemplate.converAndSent("topicName","消息主体");
  }
```

### 消费者

```java
@RocketMQMessageListener(topic = "topicName",consumerGroup = "groupName")
public class Consumer imlements RocketMQListener<String>{
@Override
public void onMessage(String message){
    System.out.println("消费"+message);
}
}
```
