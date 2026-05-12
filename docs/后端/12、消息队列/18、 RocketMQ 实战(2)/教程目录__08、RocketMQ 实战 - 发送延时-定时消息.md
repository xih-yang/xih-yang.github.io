# 08、RocketMQ 实战 - 发送延时-定时消息
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/6/8.html
- 分类：消息队列
- 分组：教程目录
定时/延时消息是 Apache RocketMQ 提供的一种高级消息类型，消息被发送至服务端后，在指定时间后才能被消费者消费。通过设置一定的定时时间可以实现分布式场景的延时调度触发效果。

### 应用场景

在分布式定时调度触发、任务超时处理等场景，需要实现精准、可靠的定时事件触发。使用 Apache RocketMQ 的定时消息可以简化定时调度任务的开发逻辑，实现高性能、可扩展、高可靠的定时触发能力。

##### 典型场景一：分布式定时调度

在分布式定时调度场景下，需要实现各类精度的定时任务，例如每天5点执行文件清理，每隔2分钟触发一次消息推送等需求。传统基于数据库的定时调度方案在分布式场景下，性能不高，实现复杂。基于 Apache RocketMQ 的定时消息可以封装出多种类型的定时触发器。

##### 典型场景二：任务超时处理

以电商交易场景为例，订单下单后暂未支付，此时不可以直接关闭订单，而是需要等待一段时间后才能关闭订单。使用 Apache RocketMQ 定时消息可以实现超时任务的检查触发。

基于定时消息的超时任务处理具备如下优势：

- 精度高、开发门槛低：基于消息通知方式不存在定时阶梯间隔。可以轻松实现任意精度事件触发（RocketMQ4.x以及之前的版本只能设置固定的延时时间），无需业务去重。
- 高性能可扩展：传统的数据库扫描方式较为复杂，需要频繁调用接口扫描，容易产生性能瓶颈。 Apache RocketMQ 的定时消息具有高并发和水平扩展的能力。

### RocketMQ4.x以及之前版本的延时/定时消息

Apache RocketMQ 一共支持18个等级的延迟投递，具体时间如下：

投递等级（delay level）
延迟时间
投递等级（delay level）
延迟时间

1
1s
10
6min

2
5s
11
7min

3
10s
12
8min

4
30s
13
9min

5
1min
14
10min

6
2min
15
20min

7
3min
16
30min

8
4min
17
1h

9
5min
18
2h

要发送延时消息，只需要设置消息的延时投递等级,修改MqProcuder的OldVersionProducer：

```java
 public SendResult sendDelayMsg(String topic,String msg, int delayLevel) throws InterruptedException, RemotingException, MQClientException, MQBrokerException {
    Message message = new Message(topic, msg.getBytes(StandardCharsets.UTF_8));
    message.setDelayTimeLevel(delayLevel);
    return producer.send(message);
}
```

新建DelayController：

```java
@RestController
public class DelayController {
    @Autowired
    private OldVersionProducer oldVersionProducer;
    String topic = "MyTopic";
    @RequestMapping("/sendDelayMsg")
    public Map<String,Object> sendDelayMsg(@RequestParam("msg") String msg,@RequestParam("delayLevel") Integer delayLevel) throws InterruptedException, RemotingException, MQClientException, MQBrokerException {
        Map<String,Object> map = new HashMap<>(4);
        SendResult sendResult = oldVersionProducer.sendDelayMsg(topic, msg, delayLevel);
        map.put("sendResult", sendResult);
        map.put("sendDate", LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME));
        return map;
    }
}
```

启动消费者后，在启动MqProcuder，访问http://localhost:8001/sendDelayMsg?msg=123&delayLevel=3，发送消息并设置延时投递等级为3，即延时10秒：

记住上图中的发送时间。

查看消费者控制台：

查看消费时间，和上面的发送时间对比，正好相差10秒。

继续访问http://localhost:8001/sendDelayMsg?msg=123&delayLevel=0，设置了延时投递等级为0，不在1到18之内，多试几次发现延时时间为随机时间。继续访问http://localhost:8001/sendDelayMsg?msg=123&delayLevel=50，发送成功后，在RocketMQ dashboard中的SCHEDULE_TOPIC_XXXX topic查到消息。访问http://localhost:8001/sendDelayMsg?msg=123&delayLevel=-3，发现延时时间为随机时间。

设置level等级：

- level  maxLevel，则level== maxLevel，例如level==20，延迟2h

定时消息会暂存在名为SCHEDULE_TOPIC_XXXX的topic中，并根据delayTimeLevel存入特定的queue，queueId = delayTimeLevel – 1，即一个queue只存相同延迟的消息，保证具有相同发送延迟的消息能够顺序消费。broker会调度地消费SCHEDULE_TOPIC_XXXX，将消息写入真实的topic。

### RocketMQ5.0延时/定时消息

##### 定时时间设置原则

- Apache RocketMQ 定时消息设置的定时时间是一个预期触发的系统时间戳，延时时间也需要转换成当前系统时间后的某一个时间戳，而不是一段延时时长。
- 定时时间的格式为毫秒级的Unix时间戳，您需要将要设置的时刻转换成时间戳形式。
- 定时时间必须设置在定时时长范围内，超过范围则定时不生效，服务端会立即投递消息。
- 定时时长最大值默认为24小时，不支持自定义修改
- 定时时间必须设置为当前时间之后，若设置到当前时间之前，则定时不生效，服务端会立即投递消息。

示例如下：

- 定时消息：例如，当前系统时间为2022-06-09 17:30:00，您希望消息在下午19:20:00定时投递，则定时时间为2022-06-09 19:20:00，转换成时间戳格式为1654773600000。
- 延时消息：例如，当前系统时间为2022-06-09 17:30:00，您希望延时1个小时后投递消息，则您需要根据当前时间和延时时长换算成定时时刻，即消息投递时间为2022-06-09 18:30:00，转换为时间戳格式为1654770600000。

##### 定时消息生命周期

- 初始化：消息被生产者构建并完成初始化，待发送到服务端的状态。
- 定时中：消息被发送到服务端，和普通消息不同的是，服务端不会直接构建消息索引，而是会将定时消息单独存储在定时存储系统中，等待定时时刻到达。
- 待消费：定时时刻到达后，服务端将消息重新写入普通存储引擎，对下游消费者可见，等待消费者消费的状态。
- 消费中：消息被消费者获取，并按照消费者本地的业务逻辑进行处理的过程。 此时服务端会等待消费者完成消费并提交消费结果，如果一定时间后没有收到消费者的响应，Apache RocketMQ会对消息进行重试处理。
- 消费提交：消费者完成消费处理，并向服务端提交消费结果，服务端标记当前消息已经被处理（包括消费成功和失败）。 Apache RocketMQ 默认支持保留所有消息，此时消息数据并不会立即被删除，只是逻辑标记已消费。消息在保存时间到期或存储空间不足被删除前，消费者仍然可以回溯消息重新消费。
- 消息删除：Apache RocketMQ按照消息保存机制滚动清理最早的消息数据，将消息从物理文件中删除。

##### 定时精度约束

Apache RocketMQ 定时消息的定时时长参数精确到毫秒级，但是默认精度为1000ms，即定时消息为秒级精度。

Apache RocketMQ 定时消息的状态支持持久化存储，系统由于故障重启后，仍支持按照原来设置的定时时间触发消息投递。若存储系统异常重启，可能会导致定时消息投递出现一定延迟。

首先进入RocketMQ的安装目录，在进入bin目录，打开控制台，建立topic：

```java
mqadmin.cmd updateTopic -c DefaultCluster -t myDelayTopic -n 127.0.0.1:9876 -a +message.type=DELAY
```

新建名为myDelayTopic的topic并指定消息类型是DELAY。

在Mq-consumer添加消费者：

```java
@Slf4j
@Component
public class RocketMq5DelayConsumer {
    @Value("${rocketmq.proxy}")
    private String proxy;
    String topic = "myDelayTopic";
    @Bean(name = "mqDelayConsumer")
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
                    .setConsumerGroup("my-delay-consumer")
                    // 设置预绑定的订阅关系。
                    .setSubscriptionExpressions(Collections.singletonMap(topic, filterExpression))
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

修改生产者MqProducer的MyController：

```java
 @RequestMapping("/sendNewDelayMsg")
public Map<String,Object> sendNewDelayMsg(@RequestParam("msg") String msg, @RequestParam("delaySecond") Integer delaySecond) throws  ClientException {
    Map<String,Object> map = new HashMap<>(4);
    MessageBuilder messageBuilder = new MessageBuilderImpl();
    Message message = messageBuilder.setBody(msg.getBytes(StandardCharsets.UTF_8))
            .setTopic("myDelayTopic")
            .setDeliveryTimestamp(System.currentTimeMillis() + delaySecond * 1000)
            .build();
    SendReceipt sendReceipt = producer.send(message);
    map.put("sendResult", sendReceipt);
    map.put("sendDate", LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME));
    return map;
}
```

在浏览器访问http://localhost:8001/sendNewDelayMsg?msg=123&delaySecond=2，设置延时时间为2秒，查看发送时间：

查看消费者控制台：

时间略有差异。改变delaySecond，多试几次，查看效果。`RocketMQ5.0现在可以实现自定义的延时时间。但是不能最大值默认为24小时。`

改变delaySecond=-80，设置时间为过去的时间，发现立刻消费了消息。

24小时等于86400秒，更改delaySecond=86401，发现报错，查看日志：

```java
org.apache.rocketmq.client.java.exception.BadRequestException: [request-id=b46d32d8-b72b-4f80-8e7a-fa6d077b3818, response-code=40012] the max delay time of message is too large, max is 86400000
```

延时时间间隔毫秒不能超过86400000，也就是24小时。
