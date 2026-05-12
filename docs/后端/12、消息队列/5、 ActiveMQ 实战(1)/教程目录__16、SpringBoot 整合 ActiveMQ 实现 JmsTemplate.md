# 16、SpringBoot 整合 ActiveMQ 实现 JmsTemplate
- 来源：https://ddkk.com/zhuanlan/mq/activemq/1/17.html
- 分类：消息队列
- 分组：教程目录
## 1、整合 ROCKETMQ 实现消息生产消费（ROCKETMQTEMPLATE实现）

消息队列能解决什么问题：异步处理、应用解耦、流量削锋、日志处理、消息通讯

在整套的微服务架构中, 消息队列是不可或缺的部分, 它能够起到线程内同步或者异步调用无法达到的作用。

优点：
**1、** 解耦；

i.只依赖消息的格式, 而不依赖发送者的ip和端口

ii.多消费者的情况下, 发送者不需要关注消费者的任何信息

**2、** 路由；

不能互相访问的网络之间可以消息队列实现访问, 可以减少对现有网络的修改。

消息可靠性

当消费者发生故障时, 消息可以被有效保存下来, 等待恢复后继续访问.

**3、** 异步调用；

发送者异步发送消息, 不等待消息ack,不会对发送者本身产生响应速度的影响, 当然异步调用也是可以实现的。

**4、** 方便扩展；

集群部署消息队列, 当流量增大和减小是可以通过调整部署来实现和发送方, 消费方无关。

缺点：多出一个环节,需要保证消息队列的可用性。

## 1、MQTT

MQTT（Message Queuing Telemetry Transport，消息队列遥测传输）是IBM开发的一个即时通讯协议，ActiveMQ只是Apache下一个队列项目，不仅仅支持MQTT协议，也支持其他比如AMQP等协议。MQTT是协议，协议只是定义好的规则。ActiveMQ只是实现了MQTT协议的一个程序。

如果说传统的消息队列中间件一般应用于微服务之间，那么适用于物联网的微消息队列 MQTT 版则实现了端与云之间的消息传递和真正意义上的万物互联。

百度百科 AMQP https://baike.baidu.com/item/AMQP/8354716?fr=aladdin

## 2、ActiveMQ

ActiveMQ是一种开源的基于JMS（Java Message Servie）规范的一种消息中间件的实现，ActiveMQ的设计目标是提供标准的，面向消息的，能够跨越多语言和多系统的应用集成消息通信中间件。

**5种消息类型**

TextMessage：java.lang.String对象，如xml文件内容。

MapMessage：key/value键值对的集合，key是String对象，值类型可以是Java任何基本类型。

BytesMessage：字节流。

StreamMessage：Java 中的输入输出流。

ObjectMessage：Java中的可序列化对象。

## 3、SpringBoot实现JmsTemplate处理ActiveMQ消息

```java
@EnableJms //启动消息队列
@EnableAutoConfiguration(exclude = DataSourceAutoConfiguration.class)
@SpringBootApplication
public class ActiveApplication {
    public static void main(String[] args) {
        SpringApplication.run(ActiveApplication.class, args);
    }
}
```

BeanConfig.java 定义存放消息的队列。

```java
@Configuration
public class BeanConfig {
    //定义存放消息的队列
    @Bean(name = "deviceMSG")
    public Queue deviceMSG(){
        return new ActiveMQQueue("deviceMSG?consumer.prefetchSize=1");
    }
}
```

ProviderService 生产者，创建Controller测试

```java
@Component
public class ProviderService {
    @Autowired private JmsMessagingTemplate jmsMessagingTemplate;
    @Resource(name = "deviceMSG")
    @Autowired private Queue queue;
    public void sendMessage(){
        Map<String, byte[]> msgMap = new HashMap<>();
        byte[] ctx = new byte[]{49, 54, 50, 47, 51, 48, 54, 51, 52, 50};
        String devId = "2201000001";
        msgMap.put("devId", devId.getBytes());
        msgMap.put("ctx", ctx);
        jmsMessagingTemplate.convertAndSend(queue ,msgMap);
    }
}
```

创建消费者 ConsumerService.java

```java
@Component
public class ConsumerService {
    @Autowired private MainService mainService;
    @JmsListener(destination = "deviceMSG", concurrency = "10-20")
    public void handlerMessage(Map<String, byte[]> msgMap)
    {
        mainService.anylysisDataPackage(msgMap);
    }
}
```

创建Controller测试

```java
@RestController
public class IndexController {
    @Autowired ProviderService providerService;
    @RequestMapping("/sendMessage")
    public void sendMessage(){
        logger.info("Provider send msg success");
        providerService.sendMessage();
    }
}
```
