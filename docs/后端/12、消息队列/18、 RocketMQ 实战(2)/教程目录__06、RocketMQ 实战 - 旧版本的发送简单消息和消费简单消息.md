# 06、RocketMQ 实战 - 旧版本的发送简单消息和消费简单消息
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/6/6.html
- 分类：消息队列
- 分组：教程目录
RocketMQ5.0之后api的之前版本的api有差异。从发送简单消息和消费简单消息就可以看出来。上一篇的示例用的是RocketMQ5.0的api。现在看下之前版本的发送消息和消费消息。

在MqProducer中添加依赖：

```java
<dependency>
        <groupId>org.apache.rocketmq</groupId>
        <artifactId>rocketmq-client</artifactId>
        <version>4.9.4</version>
    </dependency>
```

在application.properties添加以下配置：

```java
rocketmq.namesrv=localhost:9876
```

新建消息发送类：

```java
@Slf4j
@Component
public class OldVersionProducer implements InitializingBean, DisposableBean {
    private DefaultMQProducer producer;
    @Value("${rocketmq.namesrv}")
    private String namesrv;
    @Override
    public void destroy() throws Exception {
        if (producer != null) {
            producer.shutdown();
        }
    }
    @Override
    public void afterPropertiesSet() throws Exception {
        if (producer == null) {
            producer = new DefaultMQProducer("my-producer");
        }
        producer.setNamesrvAddr(namesrv);
        producer.start();
    }
    public SendResult send(String topic,String msg) throws InterruptedException, RemotingException, MQClientException, MQBrokerException {
        Message message = new Message(topic, msg.getBytes(StandardCharsets.UTF_8));
       return producer.send(message);
    }
}
```

发送消息使用DefaultMQProducer，设置namesrv即可。发送的消息通过topic和二进制消息组成Message，通过DefaultMQProducer发送到broker中。InitializingBean, DisposableBean是Spring的生命周期接口。

在MyController添加以下内容：

```java
 @Autowired
private OldVersionProducer oldVersionProducer;
String topic = "MyTopic";
private DateTimeFormatter formatter1 = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
@RequestMapping("/sendByOld")
public List<SendResult> sendByOld() {
    List<SendResult> list = new ArrayList<>();
    for (int i = 0; i < 10; i++) {
        try {
            list.add(oldVersionProducer.send(topic,"old version message:" + LocalDateTime.now().format(formatter1)));
        } catch (InterruptedException e) {
            e.printStackTrace();
        } catch (RemotingException e) {
            e.printStackTrace();
        } catch (MQClientException e) {
            e.printStackTrace();
        } catch (MQBrokerException e) {
            e.printStackTrace();
        }
    }
    return list;
}
```

调用http://localhost:8001/sendByOld，发送消息。

还是使用RocketMQ5.0版本的消费消息api，查看Mq-Consumer的控制台：

可以消费消息。

现在来看下RocketMQ4.0版本的消费消息api。在Mq-Consumer中添加依赖：

```java
     <dependency>
        <groupId>org.apache.rocketmq</groupId>
        <artifactId>rocketmq-client</artifactId>
        <version>4.9.4</version>
    </dependency>
```

在application.properties添加配置：

```java
rocketmq.namesrv=localhost:9876
```

添加消费者：

```java
@Slf4j
@Component
public class OldVersionConsumer implements InitializingBean, DisposableBean {
    private DefaultMQPushConsumer consumer;
    @Value("${rocketmq.namesrv}")
    private String namesrv;
    @Override
    public void destroy() throws Exception {
        if (consumer != null) {
            consumer.shutdown();
        }
    }
    @Override
    public void afterPropertiesSet() throws Exception {
        consumer = new DefaultMQPushConsumer("my-consumer");
        consumer.setNamesrvAddr(namesrv);
       // 设置从之前的消费位置开始消费
        consumer.setConsumeFromWhere(ConsumeFromWhere.CONSUME_FROM_LAST_OFFSET);
        consumer.subscribe(topic, "*");
        consumer.registerMessageListener(new MessageListenerConcurrently() {
            @Override
            public ConsumeConcurrentlyStatus consumeMessage(List<MessageExt> list, ConsumeConcurrentlyContext consumeConcurrentlyContext) {
                log.info("消费消息:{}", list);
                return ConsumeConcurrentlyStatus.CONSUME_SUCCESS;
            }
        });
        consumer.start();
    }
}
```

消费者DefaultMQPushConsumer类，设置消费者组名，namesrv地址，设置消费的开始位置，订阅topic以及添加消费消息监听器。

注释RocketMq5Consumer类上的@Component。重启后，调用http://localhost:8001/sendByOld发送消息，查看Mq-Consumer的控制台：

已经消费消息。
