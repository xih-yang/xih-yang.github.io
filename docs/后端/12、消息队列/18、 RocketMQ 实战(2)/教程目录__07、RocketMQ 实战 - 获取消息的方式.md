# 07、RocketMQ 实战 - 获取消息的方式
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/6/7.html
- 分类：消息队列
- 分组：教程目录
RocketMQ获取消息的方式有两种：

**1、** PULL（消费者主动去Broker拉取）：拉取消息需要编写代码去Broker获取通过DefaultMQPullConsumer，关联namesrv后，通过topic获取到关联的所有MessageQueue遍历所有的MessageQueue，批量获取消息并消费直到处理完所有的MessageQueue用户需要自己保存消费进度，也就是MessageQueue下一次的OffSet；

**2、** PUSH（服务端推送）：当消息到达时，服务端主动推送消息给消费者RocketMQ的实现方式还是使用PULL，但是封装了遍历MessageQueue的过程，并注册MessageListener，取到消息后唤醒MessageListener消费消息；

**优缺点比较**

- PUSH实时性高，但是增加了服务端负载，而且可能会造成消费者消息堆积，消费者消费能力不同，如果服务端推送消息过快，消费较慢就会造成消息堆积。消费消息逻辑简单，只需添加MessageListener，用户不用自己维护消费进度。
- PULL是由消费者自动从服务端拉取，较灵活，但是需要自己编写代码拉取消息，而且拉取消息的时间间隔不好控制，间隔太短，空请求太多，间隔太长，消息不能处理。还需要用户维护消费进度。

上个例子的消费者OldVersionConsumer 就是PUSH方式：

```java
@Slf4j
@Component
public class OldVersionConsumer implements InitializingBean, DisposableBean {
    private DefaultMQPushConsumer consumer;
    @Value("${rocketmq.namesrv}")
    private String namesrv;
    String topic = "MyTopic";
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

新增OldVersionPullConsumer pull方式的消费者：

```java
@Slf4j
@Component
public class OldVersionPullConsumer implements InitializingBean, DisposableBean {
    private DefaultMQPullConsumer pullConsumer;
    @Value("${rocketmq.namesrv}")
    private String namesrv;
    String topic = "MyTopic";
    Map<MessageQueue, Long> OFFSET_MAP = new HashMap<>();
    @Override
    public void destroy() throws Exception {
        if (pullConsumer != null) {
            pullConsumer.shutdown();
        }
    }
    @Override
    public void afterPropertiesSet() throws Exception {
        pullConsumer = new DefaultMQPullConsumer("my-pull-consumer");
        pullConsumer.setNamesrvAddr(namesrv);
        pullConsumer.start();
        handleMassage();
    }
    @Scheduled(cron = "0/30 * * * * ?")
    private void handleMassage() throws MQClientException, RemotingException, InterruptedException, MQBrokerException {
        Set<MessageQueue> messageQueues = pullConsumer.fetchSubscribeMessageQueues(topic);
        log.info("message queue:{}", messageQueues);
        for (MessageQueue messageQueue : messageQueues) {
            PullResult pullResult = pullConsumer.pull(messageQueue, (String) null,getOffSet(messageQueue) , 32);
            // 保存消费进度
            OFFSET_MAP.put(messageQueue, pullResult.getNextBeginOffset());
            List<MessageExt> list = null;
            switch (pullResult.getPullStatus()) {
                case FOUND:
                    list = pullResult.getMsgFoundList();
                    break;
                case  NO_NEW_MSG:
                    break;
                case NO_MATCHED_MSG:
                    break;
                case   OFFSET_ILLEGAL:
                    break;
                default:
                    break;
            }
            if (!CollectionUtils.isEmpty(list)) {
                log.info("消费消息:{}", list);
            }
        }
    }
    private Long getOffSet(MessageQueue queue) {
        Long aLong = OFFSET_MAP.get(queue);
        if (Objects.isNull(aLong)) {
            return 0L;
        } else {
            return aLong;
        }
    }
}
```

调用fetchSubscribeMessageQueues方法获取某个Topic的所有队列，然后挑选队列进行拉取。找到或者构造完队列之后，调用pull方法就可以进行拉取，需要传入拉取的队列，过滤表达式，拉取的位点，最大拉取消息条数等参数。拉取完成后会返回拉取结果PullResult，PullResult中的PullStatus表示结果状态，如下所示

```java
public enum PullStatus {
    /**
     * Founded
     */
    FOUND,
    /**
     * No new message can be pull
     */
    NO_NEW_MSG,
    /**
     * Filtering results can not match
     */
    NO_MATCHED_MSG,
    /**
     * Illegal offset,may be too big or too small
     */
    OFFSET_ILLEGAL
}
```

FOUND表示拉取到消息，NO_NEW_MSG表示没有发现新消息，NO_MATCHED_MSG表示没有匹配的消息，OFFSET_ILLEGAL表示传入的拉取位点是非法的，有可能偏大或偏小。如果拉取状态是FOUND，我们可以通过pullResult的getMsgFoundList方法获取拉取到的消息列表。最后，如果消费完成，通过updateConsumeOffset方法更新消费位点。比如 consumer.updateConsumeOffset(mq, pullResult.getNextBeginOffset())。或者自己维护消费进度，比如 OFFSET_MAP 保存了每个Message Queue的消费进度。

接下来看下RocketMQ5.0新的api。

push类型的消费者之前看过了：

```java
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

pull类型的消费者：

```java
@Component
public class RocketMq5PullConsumer {
    @Value("${rocketmq.proxy}")
    private String proxy;
    String topic = "MyTopic";
    SimpleConsumer simpleConsumer=null;
    @Bean(name = "mqPullConsumer")
    public void mqConsumer() {
        ClientServiceProvider provider = ClientServiceProvider.loadService();
        ClientConfigurationBuilder builder = ClientConfiguration.newBuilder().setEndpoints(proxy);
        ClientConfiguration configuration = builder.build();
        // 初始化Producer时需要设置通信配置以及预绑定的Topic。
        try {
            // 订阅消息的过滤规则，表示订阅所有Tag的消息。
            String tag = "*";
            FilterExpression filterExpression = new FilterExpression(tag, FilterExpressionType.TAG);
            simpleConsumer = provider.newSimpleConsumerBuilder()
                    .setClientConfiguration(configuration)
                    // 设置消费者分组。
                    .setConsumerGroup("my-consumer")
                    // 设置预绑定的订阅关系。
                    .setSubscriptionExpressions(Collections.singletonMap("MyTopic", filterExpression))
                    .setAwaitDuration(Duration.ofSeconds(10))
                    .build();
            handleMessage();
            log.info("构建mq5.0消费者成功：proxy:{}, topic:{}", proxy, topic);
        } catch (ClientException e) {
            log.error("构建mq5.0消费者异常：proxy:{}, topic:{}", proxy, topic, e);
        }
    }
    @Scheduled(cron = "0/5 * * * * ?")
    private void handleMessage() throws ClientException {
        List<MessageView> messageViewList =  simpleConsumer.receive(10, Duration.ofSeconds(30));
        messageViewList.forEach(messageView -> {
            log.info("消费消息:{}", StandardCharsets.UTF_8.decode(messageView.getBody()).toString());
            try {
                //消费处理完成后，需要主动调用ACK提交消费结果。
                simpleConsumer.ack(messageView);
            } catch (ClientException e) {
                e.printStackTrace();
            }
        });
    }
}
```

客户端SDK和服务端通过receive拉取消息和ack提交消费结果接口通信。receive方法可以设置批量拉取消息数和消息的最长处理耗时（该参数用于控制消费失败时的消息重试间隔）。SimpleConsumer提供原子接口，用于消息获取和提交消费结果，相对于PushConsumer方式更加灵活。SimpleConsumer适用于以下场景：

- 消息处理时长不可控：如果消息处理时长无法预估，经常有长时间耗时的消息处理情况。建议使用SimpleConsumer消费类型，可以在消费时自定义消息的预估处理时长，若实际业务中预估的消息处理时长不符合预期，也可以通过接口提前修改。
- 需要异步化、批量消费等高级定制场景：SimpleConsumer在SDK内部没有复杂的线程封装，完全由业务逻辑自由定制，可以实现异步分发、批量消费等高级定制场景。
- 需要自定义消费速率：SimpleConsumer是由业务逻辑主动调用接口获取消息，因此可以自由调整获取消息的频率，自定义控制消费速率。
