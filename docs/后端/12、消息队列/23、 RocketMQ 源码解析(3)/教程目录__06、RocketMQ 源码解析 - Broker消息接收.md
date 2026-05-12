# 06、RocketMQ 源码解析 - Broker消息接收
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/3/6.html
- 分类：消息队列
- 分组：教程目录
## 版本

基于`rocketmq-all-4.3.1`版本；

## Broker处理消息流程

1. RocketMQ客户端发送消息方法是MQClientAPIImpl#sendMessage,发送消息的请求命令是RequestCode.SEND_MESSAGE(10)

```java
public SendResult sendMessage(
    final String addr,
    final String brokerName,
    final Message msg,
    final SendMessageRequestHeader requestHeader,
    final long timeoutMillis,
    final CommunicationMode communicationMode,
    final SendCallback sendCallback,
    final TopicPublishInfo topicPublishInfo,
    final MQClientInstance instance,
    final int retryTimesWhenSendFailed,
    final SendMessageContext context,
    final DefaultMQProducerImpl producer
) throws RemotingException, MQBrokerException, InterruptedException {
    long beginStartTime = System.currentTimeMillis();
    RemotingCommand request = null;
    if (sendSmartMsg || msg instanceof MessageBatch) {
        SendMessageRequestHeaderV2 requestHeaderV2 = SendMessageRequestHeaderV2.createSendMessageRequestHeaderV2(requestHeader);
        request = RemotingCommand.createRequestCommand(msg instanceof MessageBatch ? RequestCode.SEND_BATCH_MESSAGE : RequestCode.SEND_MESSAGE_V2, requestHeaderV2);
    } else {
        request = RemotingCommand.createRequestCommand(RequestCode.SEND_MESSAGE, requestHeader);
    }
    ...省略...
}
```

1. 在Broker端源码可以找到注册RequestCode.SEND_MESSAGE命令的地方是BrokerController#registerProcessor。对应的处理类是SendMessageProcessor

```java
public void registerProcessor() {
   SendMessageProcessor sendProcessor = new SendMessageProcessor(this);
   sendProcessor.registerSendMessageHook(sendMessageHookList);
   sendProcessor.registerConsumeMessageHook(consumeMessageHookList);
	//可以看到处理类是SendMessageProcessor
   this.remotingServer.registerProcessor(RequestCode.SEND_MESSAGE, sendProcessor, this.sendMessageExecutor);
  ...省略...
}  
```

### SendMessageProcessor

1. SendMessageProcessor#processRequest是客户端发送消息的处理方法（单个消息和批量消息），此方法是一个模板方法，增加钩子处理函数，批量消息和单条消息处理逻辑。SendMessageProcessor#processRequest整体的流程如下
2. 单条消息和批量消息都是调用AbstractSendMessageProcessor#msgCheck进行主要参数检查。批量消息不支持私信队列，因为只有消费失败时Consumer才会发送单条消息到私信队列，并不会发送批量消息进去死信队列，所以不存在重试Topic
3. AbstractSendMessageProcessor#msgCheck的执行逻辑

- 检查Broker是否有写权限
- 检查topic是否可以进行消息发送，主要针对默认主题，默认主题不能发送消息，仅供路由查找
- 如果Topic不存在，则创建Topic。在NameServer端存储Topic的配置信息，默认路径为`${ROCKET_HOME}/store/config/topic.json`。
