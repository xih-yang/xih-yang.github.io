# 25、RocketMQ源码解析 - 自动创建Topic设置
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/1/25.html
- 分类：消息队列
- 分组：教程目录
## 1、现象

很多网友会问，为什么明明集群中有多台Broker服务器，autoCreateTopicEnable设置为true，表示开启Topic自动创建，但新创建的Topic的路由信息只包含在其中一台Broker服务器上，这是为什么呢？

期望值：为了消息发送的高可用，希望新创建的Topic在集群中的每台Broker上创建对应的队列，避免Broker的单节点故障。

现象截图如下：

正如上图所示，自动创建的topicTest5的路由信息：

- topicTest5只在broker-a服务器上创建了队列，并没有在broker-b服务器创建队列，不符合期望。
- 默认读写队列的个数为4。

我们再来看一下RocketMQ默认topic的路由信息截图如下：

从图中可以默认Topic的路由信息为broker-a、broker-b上各8个队列。

## 2、思考

默认Topic的路由信息是如何创建的？

**1、** Topic的路由信息是存储在哪里？Nameserver？broker?；

**2、** RocketMQTopic默认队列个数是多少呢？；

## 3、原理

### 3.1 RocketMQ基本路由规则

**1、** Broker在启动时向Nameserver注册存储在该服务器上的路由信息，并每隔30s向Nameserver发送心跳包，并更新路由信息；

**2、** Nameserver每隔10s扫描路由表，如果检测到Broker服务宕机，则移除对应的路由信息；

**3、** 消息生产者每隔30s会从Nameserver重新拉取Topic的路由信息并更新本地路由表；在消息发送之前，如果本地路由表中不存在对应主题的路由消息时，会主动向Nameserver拉取该主题的消息；

回到本文的主题：autoCreateTopicEnable，开启自动创建主题，试想一下，如果生产者向一个不存在的主题发送消息时，上面的任何一个步骤都无法获取一个不存在的主题的路由信息，那该如何处理这种情况呢？

在RocketMQ中，如果autoCreateTopicEnable设置为true，消息发送者向NameServer查询主题的路由消息返回空时，会尝试用一个系统默认的主题名称(MixAll.AUTO_CREATE_TOPIC_KEY_TOPIC)，此时消息发送者得到的路由信息为：

但问题就来了，默认Topic在集群的每一台Broker上创建8个队列，那问题来了，为啥新创建的Topic只在一个Broker上创建4个队列？

### 3.2 探究autoCreateTopicEnable机制

#### 3.2.1 默认Topic路由创建时机

Step1：在Broker启动流程中，会构建TopicConfigManager对象，其构造方法中首先会判断是否开启了允许自动创建主题，如果启用了自动创建主题，则向topicConfigTable中添加默认主题的路由信息。

TopicConfigManager构造方法

> 备注：该topicConfigTable中所有的路由信息，会随着Broker向Nameserver发送心跳包中，Nameserver收到这些信息后，更新对应Topic的路由信息表。

BrokerConfig的defaultTopicQueueNum默认为8。两台Broker服务器都会运行上面的过程，故最终Nameserver中关于默认主题的路由信息中，会包含两个Broker分别各8个队列信息。

Step2：生产者寻找路由信息

生产者首先向NameServer查询路由信息，由于是一个不存在的主题，故此时返回的路由信息为空，RocketMQ会使用默认的主题再次寻找，由于开启了自动创建路由信息，NameServer会向生产者返回默认主题的路由信息。然后从返回的路由信息中选择一个队列（默认轮询）。消息发送者从Nameserver获取到默认的Topic的队列信息后，队列的个数会改变吗？答案是会的，其代码如下：

MQClientInstance#updateTopicRouteInfoFromNameServer

> 温馨提示：消息发送者在到默认路由信息时，其队列数量，会选择DefaultMQProducer#defaultTopicQueueNums与Nameserver返回的的队列数取最小值，DefaultMQProducer#defaultTopicQueueNums默认值为4，故自动创建的主题，其队列数量默认为4。

Step3：发送消息

DefaultMQProducerImpl#sendKernelImpl

在消息发送时的请求报文中，设置默认topic名称，消息发送topic名称，使用的队列数量为DefaultMQProducer#defaultTopicQueueNums，即默认为4。

Step4：Broker端收到消息后的处理流程

服务端收到消息发送的处理器为：SendMessageProcessor，在处理消息发送时，会调用super.msgCheck方法：

AbstractSendMessageProcessor#msgCheck

在Broker端，首先会使用TopicConfigManager根据topic查询路由信息，如果Broker端不存在该主题的路由配置(路由信息),此时如果Broker中存在默认主题的路由配置信息，则根据消息发送请求中的队列数量，在Broker创建新Topic的路由信息。这样Broker服务端就会存在主题的路由信息。

在Broker端的topic配置管理器中存在的路由信息，一会向Nameserver发送心跳包，汇报到Nameserver，另一方面会有一个定时任务，定时存储在broker端，具体路径为 `$` {ROCKET_HOME}/store/config/topics.json中，这样在Broker关闭后再重启，并不会丢失路由信息。

广大读者朋友，跟踪到这一步的时候，大家应该对启用自动创建主题机制时，新主题是的路由信息是如何创建的，为了方便理解，给出创建主题序列图：

#### 3.2.2 现象分析

经过上面自动创建路由机制的创建流程，我们可以比较容易的分析得出如下结论：

因为开启了自动创建路由信息，消息发送者根据Topic去NameServer无法得到路由信息，但接下来根据默认Topic从NameServer是能拿到路由信息(在每个Broker中，存在8个队列)，因为两个Broker在启动时都会向NameServer汇报路由信息。此时消息发送者缓存的路由信息是2个Broker，每个Broker默认4个队列（原因见3.2.1:Step2的分析）。消息发送者然后按照轮询机制，发送第一条消息选择(broker-a的messageQueue:0)，向Broker发送消息，Broker服务器在处理消息时，首先会查看自己的路由配置管理器(TopicConfigManager)中的路由信息，此时不存在对应的路由信息，然后尝试查询是否存在默认Topic的路由信息，如果存在，说明启用了autoCreateTopicEnable，则在TopicConfigManager中创建新Topic的路由信息，此时存在与Broker服务端的内存中，然后本次消息发送结束。此时，在NameServer中还不存在新创建的Topic的路由信息。

这里有三个关键点：

**1、** 启用autoCreateTopicEnable创建主题时，在Broker端创建主题的时机为，消息生产者往Broker端发送消息时才会创建；

**2、** 然后Broker端会在一个心跳包周期内，将新创建的路由信息发送到NameServer，于此同时，Broker端还会有一个定时任务，定时将内存中的路由信息，持久化到Broker端的磁盘上；

**3、** 消息发送者会每隔30s向NameServer更新路由信息，如果消息发送端一段时间内未发送消息，就不会有消息发送集群内的第二台Broker，那么NameServer中新创建的Topic的路由信息只会包含Broker-a，然后消息发送者会向NameServer拉取最新的路由信息，此时就会消息发送者原本缓存了2个broker的路由信息，将会变为一个Broker的路由信息，则该Topic的消息永远不会发送到另外一个Broker，就出现了上述现象；

原因就分析到这里了，现在我们还可以的大胆假设，开启autoCreateTopicEnable机制，什么情况会在两个Broker上都创建队列，其实，我们只需要连续快速的发送9条消息，就有可能在2个Broker上都创建队列，验证代码如下：

```java
public static void main(String[] args) throws MQClientException, InterruptedException {
    DefaultMQProducer producer = new DefaultMQProducer("please_rename_unique_group_name");
    producer.setNamesrvAddr("127.0.0.1:9876");
    producer.start();
    for (int i = 0; i < 9; i++) {
        try {
            Message msg = new Message("TopicTest10" ,"TagA" , ("Hello RocketMQ " + i).getBytes(RemotingHelper.DEFAULT_CHARSET));
            SendResult sendResult = producer.send(msg);
            System.out.printf("%s%n", sendResult);
        } catch (Exception e) {
            e.printStackTrace();
            Thread.sleep(1000);
        }
    }
    producer.shutdown();
}
```

验证结果如图所示：

本文就分析到这里了，大家如果喜欢这篇文章，麻烦大家帮忙点点赞，同时大家也可以给作者留言，告知在使用RocketMQ的过程中遇到的疑难杂症，与作者互动。
