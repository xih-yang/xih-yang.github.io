# 20、RocketMQ 实战 - RocketMQ5.x消费重试
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/6/20.html
- 分类：消息队列
- 分组：教程目录
消费重试指的是，消费者在消费某条消息失败后，Apache RocketMQ 服务端会根据重试策略重新消费该消息，超过一次定数后若还未消费成功，则该消息将不再继续重试，直接被发送到死信队列中。Apache RocketMQ 的消费重试主要解决的是业务处理逻辑失败导致的消费完整性问题，是一种为业务兜底的策略，不应该被用做业务流程控制。建议以下消费失败场景使用重试机制：

- 业务处理失败，且失败原因跟当前的消息内容相关，比如该消息对应的事务状态还未获取到，预期一段时间后可执行成功。
- 消费失败的原因不会导致连续性，即当前消息消费失败是一个小概率事件，不是常态化的失败，后面的消息大概率会消费成功。此时可以对当前消息进行重试，避免进程阻塞。

##### 消息重试的触发条件

- 消费失败，包括消费者返回消息失败状态标识或抛出非预期异常。
- 消息处理超时，包括在PushConsumer中排队超时。

### PushConsumer消费重试策略

PushConsumer消费消息时，消息的几个主要状态如下：

- Ready：已就绪状态。消息在Apache RocketMQ服务端已就绪，可以被消费者消费。
- Inflight：处理中状态。消息被消费者客户端获取，处于消费中还未返回消费结果的状态。
- WaitingRetry：待重试状态，PushConsumer独有的状态。当消费者消息处理失败或消费超时，会触发消费重试逻辑判断。如果当前重试次数未达到最大次数，则该消息变为待重试状态，经过重试间隔后，消息将重新变为已就绪状态可被重新消费。多次重试之间，可通过重试间隔进行延长，防止无效高频的失败。
- Commit：提交状态。消费成功的状态，消费者返回成功响应即可结束消息的状态机。
- DLQ：死信状态。消费逻辑的最终兜底机制，若消息一直处理失败并不断进行重试，直到超过最大重试次数还未成功，此时消息不会再重试，会被投递至死信队列。您可以通过消费死信队列的消息进行业务恢复。

两次消费间的间隔时间实际由消费耗时及重试间隔控制。PushConsumer的最大重试次数由消费者分组创建时的元数据控制，默认16次，例如，最大重试次数为3次，则该消息最多可被投递4次，1次为原始消息，3次为重试投递次数。

##### 重试间隔时间

- 无序消息（非顺序消息）：重试间隔为阶梯时间，若重试次数超过16次，后面每次重试间隔都为2小时。具体时间如下：

第几次重试
与上次重试的间隔时间
第几次重试
与上次重试的间隔时间

1
10秒
9
7分钟

2
30秒
10
8分钟

3
1分钟
11
9分钟

4
2分钟
12
10分钟

5
3分钟
13
20分钟

6
4分钟
14
30分钟

7
5分钟
15
1小时

8
6分钟
16
2小时

- 顺序消息：重试间隔为固定时间，默认3000毫秒。

PushConsumer触发消息重试只需要返回消费失败的状态码即可，当出现非预期的异常时，也会被SDK捕获：

```java
provider.newPushConsumerBuilder()
                .setClientConfiguration(configuration)
                // 设置消费者分组。
                .setConsumerGroup("my-consumer")
                // 设置预绑定的订阅关系。
                .setSubscriptionExpressions(Collections.singletonMap(topic, filterExpression))
                .setMaxCacheMessageSizeInBytes(5 * 1024 * 1024)
                // 设置消费监听器。
                .setMessageListener(messageView -> {
                    log.info("消费时间:{},消息内容为：{}", LocalDateTime.now(), uncompress(StandardCharsets.UTF_8.decode(messageView.getBody()).toString()));
                    return ConsumeResult.FAILURE;
                }).build();
```

返回消费失败的状态，发送两条消息，发现一直在重试，同时发现重试间隔时间越来越长：

```java
provider.newPushConsumerBuilder()
                .setClientConfiguration(configuration)
                // 设置消费者分组。
                .setConsumerGroup("my-consumer")
                // 设置预绑定的订阅关系。
                .setSubscriptionExpressions(Collections.singletonMap(topic, filterExpression))
                .setMaxCacheMessageSizeInBytes(5 * 1024 * 1024)
                // 设置消费监听器。
                .setMessageListener(messageView -> {
                      String body = StandardCharsets.UTF_8.decode(messageView.getBody()).toString();
                    log.info("消费时间:{},消息内容为：{}", LocalDateTime.now(), uncompress(body));
                    int i = Integer.parseInt(body);
                    log.info("数字:{}", i);
                }).build();
```

这里Integer.parseInt(body);模拟出现消费异常。当消息体不全是数字时会报错。首先在Rocket dashboard中发送一条消息内容为123的消息，一条消息内容为qwer的消息。

发现消息内容为qwer的消息在重试消费。

### SimpleConsumer消费重试策略

SimpleConsumer消费消息时，消息的几个主要状态如下：

- Ready：已就绪状态。消息在Apache RocketMQ服务端已就绪，可以被消费者消费。
- Inflight：处理中状态。消息被消费者客户端获取，处于消费中还未返回消费结果的状态。
- Commit：提交状态。消费成功的状态，消费者返回成功响应即可结束消息的状态机。
- DLQ：死信状态。消费逻辑的最终兜底机制，若消息一直处理失败并不断进行重试，直到超过最大重试次数还未成功，此时消息不会再重试，会被投递至死信队列。您可以通过消费死信队列的消息进行业务恢复。

和PushConsumer消费重试策略不同的是，SimpleConsumer消费者的重试间隔是预分配的，每次获取消息消费者会在调用API时设置一个不可见时间参数 InvisibleDuration，即消息的最大处理时长。若消息消费失败触发重试，不需要设置下一次重试的时间间隔，直接复用不可见时间参数的取值。由于不可见时间为预分配的，可能和实际业务中的消息处理时间差别较大，您可以通过API接口修改不可见时间。例如，您预设消息处理耗时最多20 ms，但实际业务中20 ms内消息处理不完，您可以修改消息不可见时间，延长消息处理时间，避免消息触发重试机制。

```java
simpleConsumer.receive(10, Duration.ofSeconds(30));
```

消息不可见时间在调用SimpleConsumer的receive方法时设置，这里设置30秒。

修改消息不可见时间需要满足以下条件：

- 消息处理未超时
- 消息处理未提交消费状态

如下图所示，消息不可见时间修改后立即生效，即从调用API时刻开始，重新计算消息不可见时间。

SimpleConsumer的最大重试次数由消费者分组创建时的元数据控制，默认16次，消息重试间隔=不可见时间－消息实际处理时长。SimpleConsumer 的消费重试间隔通过消息的不可见时间控制。例如，消息不可见时间为30 ms，实际消息处理用了10 ms就返回失败响应，则距下次消息重试还需要20 ms，此时的消息重试间隔即为20 ms；若直到30 ms消息还未处理完成且未返回结果，则消息超时，立即重试，此时重试间隔即为0 ms。

```java
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
```

要想消费重试，不调用simpleConsumer.ack提交消费结果即可。注释 simpleConsumer.ack(messageView);来模拟消费重试。发送一条消息后，查看消费结果：

触发了消费重试。
