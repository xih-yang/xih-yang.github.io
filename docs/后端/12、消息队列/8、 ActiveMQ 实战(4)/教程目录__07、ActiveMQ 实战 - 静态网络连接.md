# 07、ActiveMQ 实战 - 静态网络连接
- 来源：https://ddkk.com/zhuanlan/mq/activemq/4/7.html
- 分类：消息队列
- 分组：教程目录
## 1 静态协议配置

基本示意图

两个Brokers是通过一个static的协议来网络链接的。一个Consumer链接到brokerB的一个地址上 ，当Producer在brokerA上以相同的地址发送消息时，此时它将被转移到brokerB上。也就是，BrokerA会转发消息到BrokerB上。

在brocker节点中配置，这样的话broker2的consumer可以消费broker1生产者的消息，但是反之不能。如果要实现双向通信需要配置duplex=”true”

```java
<networkConnectors>
     <networkConnector name="bridge" uri="static://(tcp://localhost:61616,tcp://192.168.249.201:61616)"/>
</networkConnectors>
```

这里我们用两台机器演示

broker1:192.168.249.200

broker2:192.168.249.201

### 1.1 broker1发消息，broker2收消息

如果没有配置，在broker1上发送消息，然后在broker2上消费，发现消费不到任何消息

然后我们在192.168.249.200做如下配置，重启服务

```java
<networkConnectors>
     <networkConnector name="bridge" uri="static://(tcp://localhost:61616,tcp://192.168.249.201:61616)"/>
</networkConnectors>
```

可以看到network那一栏有一个远程连接

这个时候我们在broker1上发消息

有10个消息未消费

然后在broker2上收消息

查看broker1的队列，10个消息已消费

broker1的network，有10个消息传输到网络

broker2的队列，有10个消息已消费

### 1.2 broker2发消息，beroker1收消息

然后我们在broker2上发消息

在broker1上收消息，发现收不到

然后我们在broker1的networkConnector添加duplex="true"

```java
<networkConnectors>
             <networkConnector name="bridge" duplex="true" uri="static://(tcp://localhost:61616,tcp://192.168.249.201:61616)"/>
</networkConnectors>
```

重启服务再消费可以成功消费到消息

### 1.3 networkConnector其他属性

1、name：默认是bridge

2、dynamicOnly：默认是false，如果为true, 持久订阅被激活时才创建对应的网路持久订阅。默认是启动时激活

3、decreaseNetworkConsumerPriority：默认是false。设定消费者优先权，如果为true，网络的消费者优先级降低

为-5。如果为false，则默认跟本地消费者一样为0

4、networkTTL ：默认是1 ，网络中用于消息和订阅消费的broker数量

5、messageTTL ：默认是1 ，网络中用于消息的broker数量

6、consumerTTL：默认是1 ，网络中用于消费的broker数量

7、conduitSubscriptions ：默认true，是否把同一个broker的多个consumer当做一个来处理

8、dynamicallyIncludedDestinations ：默认为空，要包括的动态消息地址，类似于excludedDestinations，如：

```xml
<dynamicallyIncludedDestinations>  
<queue physicalName="include.test.foo"/>  
<topic physicalName="include.test.bar"/>  
</dynamicallyIncludedDestinations>  
```

9、staticallyIncludedDestinations ：默认为空，要包括的静态消息地址。类似于excludedDestinations，如：

```xml
<staticallyIncludedDestinations>  
<queue physicalName="always.include.queue"/>  
</staticallyIncludedDestinations>
```

10）excludedDestinations ：默认为空，指定排除的地址，示例如下：

```xml
<networkConnectors>  
<networkConnector uri="static://(tcp://localhost:61617)"  
name="bridge" dynamicOnly="false" conduitSubscriptions="true"  
decreaseNetworkConsumerPriority="false">  
<excludedDestinations>  
<queue physicalName="exclude.test.foo"/>  
<topic physicalName="exclude.test.bar"/>  
</excludedDestinations>  
<dynamicallyIncludedDestinations>  
<queue physicalName="include.test.foo"/>  
<topic physicalName="include.test.bar"/>  
</dynamicallyIncludedDestinations>  
<staticallyIncludedDestinations>  
<queue physicalName="always.include.queue"/>  
<topic physicalName="always.include.topic"/>  
</staticallyIncludedDestinations>  
</networkConnector>  
</networkConnectors>  
```

11）duplex ：默认false，设置是否能双向通信。

12）prefetchSize ：默认是1000，持有的未确认的最大消息数量，必须大于0，因为网络消费者不能自己轮询消息。

13）suppressDuplicateQueueSubscriptions：默认false，如果为true, 重复的订阅关系一产生即被阻止。

14）bridgeTempDestinations ：默认true，是否广播advisory messages来创建临时destination。

15）alwaysSyncSend ：默认false，如果为true，非持久化消息也将使用request/reply方式代替oneway方式发送到远程broker。

16）staticBridge ：默认false，如果为true，只有staticallyIncludedDestinations中配置的destination可以被处理。

## 2 消息回流功能

### 2.1 丢失的消息

如果有broker1和broker2通过networkConnector连接，有一个consumer1连接到broker1,一个consumer2连接到broker2，程序往broker1上面发送30条消息，这时consumer2连接到broker2消费消息，当consumer2消费了15条消息时，broker2挂掉了。 但是还剩下15条消息在broker2上面，这些消息就好像消息了，除非broker2重启了，然后有消费者连接到broker2上来消费消息，遇到这样的情况该怎么办呢？

### 2.2 消息回流配置

从5.6版本起，在destinationPolicy上新增的选择replayWhenNoConsumers，这个选项使得broker2上有需要转发的消息但是没有消费者时，把消息回流到它原来的broker1上，同时需要把enableAudit设置为false,为了防止消息回流后被当做重复消息而不被分发，activemq.xml配置如下

1）允许双向链接

设置networkConnector 节点的duplex属性为true

2）brocker配置文件添加如下配置

```java
<destinationPolicy>
    <policyMap>
        <policyEntries>
            <policyEntry queue=">" enableAudit="false">
                <networkBridgeFilterFactory>
                    <conditionalNetworkBridgeFilterFactory replayWhenNoConsumers="true"/>
                </networkBridgeFilterFactory>
            </policyEntry>
        </policyEntries>
    </policyMap>
</destinationPolicy>
```

### 2.3 代码测试

broker1发10条消息，broker2接收5条消息后停止消费

broker2的队列

这时候我们再用broker1的消费者消费消息发现消费不到。

然后我们在broker2上配置networkBridgeFilterFactory，重启后在进行测试，发现broker1可以消费broker2上未处理的消息。

同样，如果我们想在broker2消费broker1上未处理的消息在broker1上做该配置即可
