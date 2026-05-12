# 12、RocketMQ 实战 - 消费者类型
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/6/12.html
- 分类：消息队列
- 分组：教程目录
### 消费者概览

Apache RocketMQ 4.x 支持 PushConsumer 、 PullConsumer 这两种类型的消费者。DefaultMQPushConsumer只需要设置MessageListener，获取消息，消息并发等都有SDK处理。DefaultMQPullConsumer需要用户自己拉取消息，并维护消费进度，同时并发消费消息都由用户控制，比较灵活。

RocketMQ 4.x还提供了另一种PullConsumer，是Lite Pull Consumer，它提供了Subscribe和Assign两种方式，使用起来更加方便。

Subscribe模式示例如下：

```java
@Configuration
@Slf4j
public class ConsumerConfig {
    @Value("${rocketmq.namesrv}")
    private String namesrv;
    String topic = "MyTopic";
    @Bean
    public DefaultLitePullConsumer litePullConsumer() throws MQClientException, InterruptedException {
        DefaultLitePullConsumer defaultLitePullConsumer = new DefaultLitePullConsumer("my-lite-consumer");
        defaultLitePullConsumer.setNamesrvAddr(namesrv);
        defaultLitePullConsumer.subscribe(topic,"*");
        defaultLitePullConsumer.setPullBatchSize(20);
        defaultLitePullConsumer.start();
        while (true) {
            List<MessageExt> messageExts = defaultLitePullConsumer.poll(300);
            if (!CollectionUtils.isEmpty(messageExts)) {
                log. info("消费消息:{}", messageExts.stream().map(msg -> new String(msg.getBody(), StandardCharsets.UTF_8)).collect(Collectors.toList()));
            } else {
                TimeUnit.MILLISECONDS.sleep(300);
            }
        }
    }
}
```

首先还是初始化DefaultLitePullConsumer并设置ConsumerGroupName，调用subscribe方法订阅topic并启动。与Push Consumer不同的是，LitePullConsumer拉取消息调用的是轮询poll接口，如果能拉取到消息则返回对应的消息列表，否则返回null。通过setPullBatchSize可以设置每一次拉取的最大消息数量，此外如果不额外设置，`LitePullConsumer默认是自动提交位点`。`在subscribe模式下，同一个消费组下的多个LitePullConsumer会负载均衡消费，与PushConsumer一致`。

再来看Assign模式：

```java
@Bean
public DefaultLitePullConsumer litePullConsumer() throws MQClientException, InterruptedException {
        DefaultLitePullConsumer defaultLitePullConsumer = new DefaultLitePullConsumer("my-lite-consumer");
        defaultLitePullConsumer.setNamesrvAddr(namesrv);
        defaultLitePullConsumer.setAutoCommit(false);
        defaultLitePullConsumer.start();
        Collection<MessageQueue> messageQueues = defaultLitePullConsumer.fetchMessageQueues(topic);
        List<MessageQueue> list = new ArrayList<>(messageQueues);
        List<MessageQueue> messageQueueList = new ArrayList<>(messageQueues.size() / 2);
        for (int i = 0; i < list.size() / 2; i++) {
            messageQueueList.add(list.get(i));
        }
        defaultLitePullConsumer.assign(messageQueueList);
        defaultLitePullConsumer.seek(messageQueueList.get(0), 10);
        while (true) {
            List<MessageExt> messageExts = defaultLitePullConsumer.poll(300);
            if (!CollectionUtils.isEmpty(messageExts)) {
                log. info("消费消息:{}", messageExts.stream().map(msg -> new String(msg.getBody(), StandardCharsets.UTF_8)).collect(Collectors.toList()));
                defaultLitePullConsumer.commitSync();
            } else {
                TimeUnit.MILLISECONDS.sleep(300);
            }
        }
    }
}
```

Assign模式一开始仍然是初始化DefaultLitePullConsumer，这里我们采用手动提交位点的方式，因此设置AutoCommit为false，然后启动consumer。与Subscribe模式不同的是，`Assign模式下没有自动的负载均衡机制，需要用户自行指定需要拉取的队列`，因此在例子中，先用fetchMessageQueues获取了Topic下的队列，再取前面的一半队列进行拉取，示例中还调用了seek方法，将第一个队列拉取的位点设置从10开始。紧接着进入循环不停地调用poll方法拉取消息，拉取到消息后调用commitSync方法手动提交位点。

接下来看Apache RocketMQ 5.0版本的消费者，并做比较。

Apache RocketMQ 支持 PushConsumer 、 SimpleConsumer 以及 PullConsumer 这三种类型的消费者。

对比项
PushConsumer
SimpleConsumer
PullConsumer

接口方式
使用监听器回调接口返回消费结果，消费者仅允许在监听器范围内处理消费逻辑。
业务方自行实现消息处理，并主动调用接口返回消费结果。
业务方自行按队列拉取消息，并可选择性地提交消费结果

消费并发度管理
由SDK管理消费并发度。
由业务方消费逻辑自行管理消费线程。
由业务方消费逻辑自行管理消费线程。

负载均衡粒度
5.0 SDK是消息粒度，更均衡，早期版本是队列维度
消息粒度，更均衡
队列粒度，吞吐攒批性能更好，但容易不均衡

接口灵活度
高度封装，不够灵活。
原子接口，可灵活自定义。
原子接口，可灵活自定义。

适用场景
适用于无自定义流程的业务消息开发场景。
适用于需要高度自定义业务流程的业务开发场景。
仅推荐在流处理框架场景下集成使用

### PushConsumer内部原理

在PushConsumer类型中，消息的实时处理能力是基于SDK内部的典型Reactor线程模型实现的。如下图所示，SDK内置了一个长轮询线程，先将消息异步拉取到SDK内置的缓存队列中，再分别提交到消费线程中，触发监听器执行本地消费逻辑。

PushConsumer 消费者类型中，客户端SDK和消费逻辑的唯一边界是消费监听器接口。客户端SDK严格按照监听器的返回结果判断消息是否消费成功，并做可靠性重试。所有消息必须以同步方式进行消费处理，并在监听器接口结束时返回调用结果，不允许再做异步化分发。如果消费者分组设置了顺序消费模式，则PushConsumer在触发消费监听器时，严格遵循消息的先后顺序。业务处理逻辑无感知即可保证消息的消费顺序。如果业务逻辑自定义实现了异步分发，则Apache RocketMQ 无法保证消息的顺序性。
