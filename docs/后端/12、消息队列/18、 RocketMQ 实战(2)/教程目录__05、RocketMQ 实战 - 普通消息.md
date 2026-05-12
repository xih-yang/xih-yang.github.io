# 05、RocketMQ 实战 - 普通消息
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/6/5.html
- 分类：消息队列
- 分组：教程目录
生产者能发送的消息类型有：

- **Normal**：普通消息，消息本身无特殊语义，消息之间也没有任何关联。
- **FIFO**：顺序消息，Apache RocketMQ 通过消息分组MessageGroup标记一组特定消息的先后顺序，可以保证消息的投递顺序严格按照消息发送时的顺序。
- **Delay**：定时/延时消息，通过指定延时时间控制消息生产后不要立即投递，而是在延时间隔后才对消费者可见。
- **Transaction**：事务消息，Apache RocketMQ 支持分布式事务消息，支持应用数据库更新和消息调用的事务一致性保障。

先来看下最简单的普通消息，什么是普通消息呢？普通消息为 Apache RocketMQ 中最基础的消息，区别于有特性的顺序消息、定时/延时消息和事务消息。

### 应用场景

普通消息一般应用于**微服务解耦**、**事件驱动**、**数据集成**等场景，这些场景大多数要求数据传输通道具有可靠传输的能力，且**对消息的处理时机、处理顺序没有特别要求**。

##### 典型场景一：微服务异步解耦

如上图所示，以在线的电商交易场景为例，上游订单系统将用户下单支付这一业务事件封装成独立的普通消息并发送至Apache RocketMQ服务端，下游按需从服务端订阅消息并按照本地消费逻辑处理下游任务。每个消息之间都是相互独立的，且不需要产生关联。

##### 典型场景二：数据集成传输

如上图所示，以离线的日志收集场景为例，通过埋点组件收集前端应用的相关操作日志，并转发到 Apache RocketMQ 。每条消息都是一段日志数据，Apache RocketMQ 不做任何处理，只需要将日志数据可靠投递到下游的存储系统和分析系统即可，后续功能由后端应用完成。

### 功能原理

普通消息是Apache RocketMQ基本消息功能，支持生产者和消费者的异步解耦通信。

##### 普通消息生命周期

- **初始化**：消息被生产者构建并完成初始化，待发送到服务端的状态。
- **待消费**：消息被发送到服务端，对消费者可见，等待消费者消费的状态。
- **消费中**：消息被消费者获取，并按照消费者本地的业务逻辑进行处理的过程。 此时服务端会等待消费者完成消费并提交消费结果，如果一定时间后没有收到消费者的响应，Apache RocketMQ会对消息进行重试处理。
- **消费提交**：消费者完成消费处理，并向服务端提交消费结果，服务端标记当前消息已经被处理（包括消费成功和失败）。 Apache RocketMQ默认支持保留所有消息，此时消息数据并不会立即被删除，只是逻辑标记已消费。消息在保存时间到期或存储空间不足被删除前，消费者仍然可以回溯消息重新消费。
- **消息删除**：Apache RocketMQ按照消息保存机制滚动清理最早的消息数据，将消息从物理文件中删除。

### 发送普通消息

新建名为Mq-Producer的SpringBoot项目，添加依赖：

```java
<dependency>
    <groupId>org.apache.rocketmq</groupId>
    <artifactId>rocketmq-client-java</artifactId>
    <version>5.0.4</version>
</dependency> 
   <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
```

配置application.properties：

```java
server.port=8001
rocketmq.proxy = 127.0.0.1:8081
```

rocketmq.proxy是RocketMQ5.0新增的mqproxy地址。RocketMQ还要启动mqproxy。

增加MyController：

```java
@RestController
public class MyController implements InitializingBean, DisposableBean {
    private static final Logger logger = LoggerFactory.getLogger(MyController.class);
    @Value("${rocketmq.proxy}")
    private String proxy;
    private Producer producer;
    private ClientServiceProvider provider;
    // 消息发送的目标Topic名称，需要提前创建。
    String topic = "MyTopic";
    private DateTimeFormatter formatter = DateTimeFormatter.ISO_DATE;
    @RequestMapping("/send")
    public  List<SendReceipt> send() throws ClientException {
        List<SendReceipt> list = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            // 普通消息发送。
            Message message = provider.newMessageBuilder()
                    .setTopic(topic)
                    // 设置消息索引键，可根据关键字精确查找某条消息。
                    .setKeys("messageKey")
                    // 设置消息Tag，用于消费端根据指定Tag过滤消息。
                    .setTag("messageTag")
                    // 消息体。
                    .setBody(("messageBody" + LocalDate.now().format(formatter)).getBytes())
                    .build();
            try {
                // 发送消息，需要关注发送结果，并捕获失败等异常。
                SendReceipt sendReceipt = producer.send(message);
                list.add(sendReceipt);
                logger.info("Send message successfully, messageId={}", sendReceipt.getMessageId());
            } catch (ClientException e) {
                logger.error("Failed to send message", e);
            }
        }
        return list;
    }
    @Override
    public void afterPropertiesSet() throws Exception {
         this.provider = ClientServiceProvider.loadService();
        ClientConfigurationBuilder builder = ClientConfiguration.newBuilder().setEndpoints(proxy);
        ClientConfiguration configuration = builder.build();
        // 初始化Producer时需要设置通信配置以及预绑定的Topic。
        this.producer = provider.newProducerBuilder()
                .setTopics(topic)
                .setClientConfiguration(configuration)
                .build();
    }
    @Override
    public void destroy() throws Exception {
        if (producer != null) {
            producer.close();
        }
    }
}
```

InitializingBean，DisposableBean是Spring的生命周期接口。在RocketMQ-console里面新增名为MyTopic的Topic。启动程序。调用http://localhost:8001/send发送消息到RocketMQ中：

在RocketMQ-console中查看MyTopic的消息。随便点击右边的一条消息的详情：

### 消费消息

新建名为Mq-Consumer的SpringBoot项目，添加依赖：

```java
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
     <dependency>
        <groupId>org.apache.rocketmq</groupId>
        <artifactId>rocketmq-client-java</artifactId>
        <version>5.0.4</version>
    </dependency>
```

配置application.properties：

```java
server.port=8002
rocketmq.proxy = 127.0.0.1:8081
```

新建消费者：

```java
@Slf4j
@Component
public class RocketMq5Consumer {
    @Value("${rocketmq.proxy}")
    private String proxy;
    String topic = "MyTopic";
    @Bean(name = "mqConsumer")
    public void mqConsumer() {
        ClientServiceProvider provider = ClientServiceProvider.loadService();
        ClientConfigurationBuilder builder = ClientConfiguration.newBuilder().setEndpoints(proxy);
        ClientConfiguration configuration = builder.build();
        // 初始化Producer时需要设置通信配置以及预绑定的Topic。
        try {
            // 订阅消息的过滤规则，表示订阅所有Tag的消息。
            String tag = "*";
            FilterExpression filterExpression = new FilterExpression(tag, FilterExpressionType.TAG);
            provider.newPushConsumerBuilder()
                    .setClientConfiguration(configuration)
                    // 设置消费者分组。
                    .setConsumerGroup("my-consumer")
                    // 设置预绑定的订阅关系。
                    .setSubscriptionExpressions(Collections.singletonMap("MyTopic", filterExpression))
                    // 设置消费监听器。
                    .setMessageListener(messageView -> {
                        log.info("消费消息：{}", messageView);
                        log.info("消息内容为：{}",  StandardCharsets.UTF_8.decode(messageView.getBody()).toString());
                        return ConsumeResult.SUCCESS;
                    }).build();
            log.info("构建mq5.0消费者成功：proxy:{}, topic:{}", proxy, topic);
        } catch (ClientException e) {
            log.error("构建mq5.0消费者异常：proxy:{}, topic:{}", proxy, topic, e);
        }
    }
}
```

@Slf4j是lombok注解。

调用http://localhost:8001/send往MyTopic中发送消息，查看Mq-Consumer的控制台的消费记录：
