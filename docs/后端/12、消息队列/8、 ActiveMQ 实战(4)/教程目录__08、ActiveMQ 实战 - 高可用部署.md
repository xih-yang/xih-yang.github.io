# 08、ActiveMQ 实战 - 高可用部署
- 来源：https://ddkk.com/zhuanlan/mq/activemq/4/8.html
- 分类：消息队列
- 分组：教程目录
## 1 前期准备

高可用部署的前提是做好了上篇文章的静态网络连接的配置

broker1和broker2都添加了如下配置

1）broker标签中配置networkConnectors，开启双工通信

```java
<networkConnectors>
                    <networkConnector name="bridge" duplex="true" uri="static://(nio://localhost:61618,nio://192.168.249.201:61618)"/>
</networkConnectors>
```

2）配置消息回流

在policyEntries中新增policyEntrie

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

## 2 失效转移failover

### 2.1 failover介绍

ConnectionFactory factory = new ActiveMQConnectionFactory("failover:(tcp://192.168.249.200:61616,tcp://192.168.249.201:61616)?randomize=false");

默认情况下这种协议随机的选择一个链接去链接，如果连接失败那么会连接到其他的broker上。

相关参数

initialReconnectDelay：默认为10，单位毫秒，表示第一次尝试重连之前等待的时间。

maxReconnectDelay：默认30000，单位毫秒，表示两次重连之间的最大时间间隔。

useExponentialBackOff：默认为true，表示重连时是否加入避让指数来避免高并发。

reconnectDelayExponent：默认为2.0，重连时使用的避让指数。

maxReconnectAttempts：5.6版本之前默认为-1,5.6版本及其以后，默认为0,0表示重连的次数无限，配置大于0可以指定最大重连次数。

startupMaxReconnectAttempts：默认为0，如果该值不为0，表示客户端接收到消息服务器发送来的错误消息之前尝试连接服务器的最大次数，一旦成功连接后，maxReconnectAttempts值开始生效，如果该值为0，则默认采用maxReconnectAttempts。

randomize：默认为true，表示在URI列表中选择URI连接时是否采用随机策略，记住，这种随机策略在第一次选择URI列表中的地址时就开始生效，所以，如果为true的话，一个生产者和一个消费者的Failover连接地址都是两个URI的话，有可能生产者连接的是第一个，而消费者连接的是第二个，造成一个服务器上只有生产者，一个服务器上只有消费者的尴尬境地。

backup：默认为false，表示是否在连接初始化时将URI列表中的所有地址都初始化连接，以便快速的失效转移，默认是不开启。

timeout：默认为-1，单位毫秒，是否允许在重连过程中设置超时时间来中断的正在阻塞的发送操作。-1表示不允许，其他表示超时时间。

trackMessages：默认值为false，是否缓存在发送中（in-flight messages）的消息，以便重连时让新的Transport继续发送。默认是不开启。

maxCacheSize：默认131072，如果trackMessages为true，该值表示缓存消息的最大尺寸，单位byte。

updateURIsSupported：默认值为true，表示重连时客户端新的连接器（Transport）是否从消息服务接受接受原来的URI列表的更新，5.4及其以后的版本可用。如果关闭的话，会导致重连后连接器没有其他的URI地址可以Failover。

updateURIsURL：默认为null，从5.4及其以后的版本，ActiveMQ支持从文件中加载Failover的URI地址列表，URI还是以逗号分隔，updateURIsURL为文件路径。

nested.*：默认为null，5.9及其以后版本可用，表示给嵌套的URL添加额外的选项。 以前，如果你想检测让死连接速度更快，你必须在wireFormat.maxInactivityDuration= 1000选项添加到失效转移列表中的所有嵌套的URL。例如：

failover:(tcp://host01:61616?wireFormat.maxInactivityDuration=1000,tcp://host02:61616?wireFormat.maxInactivityDuration=1000,tcp://host03:61616?wireFormat.maxInactivityDuration=1000)

而现在，你只需要这样：

failover:(tcp://host01:61616,tcp://host02:61616,tcp://host03:61616)?nested.wireFormat.maxInactivityDuration=1000

warnAfterReconnectAttempts.*：默认为10，5.10及其以后的版本可用，表示每次重连该次数后会打印日志告警，设置<=0的值表示禁用

reconnectSupported：默认为true，表示客户端是否应响应经纪人 ConnectionControl事件与重新连接（参见：rebalanceClusterClients）。

如果你使用Failover失效转移，则消息服务器在死亡的那一刻，你的生产者发送消息时默认将阻塞，但你可以设置发送消息阻塞的超时时间（注：timeout参数前面已经讲过了）：failover:(tcp://primary:61616)?timeout=3000

上面的设置将导致如果3秒后连接还未建立，将导致消息发送失败，但这并不会导致该连接被kill，所以你可以过一阵子后再使用这一个连接来尝试发送消息。如果用户希望能追踪到重连过程，可以在ActiveMQConnectionFactory设置一个TransportListener

### 2.2 代码测试

这里我们配置连接如下：failover:(tcp://192.168.249.200:61616,tcp://192.168.249.201:61616)?randomize=false&timeout=3000&backup=true&warnAfterReconnectAttempts=1

#### 2.2.1 两台mq都关闭，尝试发送消息

我们会看到一直在重连，每次重连都会打印告警日志，也就是说我们配置的warnAfterReconnectAttempts生效了

#### 2.2.2 启动两台mq，发送、接收消息

1）发送消息

查看控制台，我们看到连上broker1并且成功发送消息

2）消费消息

查看那控制台，我们看到连上broker1并且成功消费消息

#### 2.2.3 停止broker1，发送、接收消息

1）发送消息

查看控制台，我们看到连上broker2并且成功发送消息

2）消费消息

查看那控制台，我们看到连上broker2并且成功消费消息

可以说明我们配置的失效转移是成功的

### 2.3 TransportListener重连监听

上面的设置将导致如果3秒后连接还未建立，将导致消息发送失败，但这并不会导致该连接被kill，所以你可以过一阵子后再使用这一个连接来尝试发送消息。如果用户希望能追踪到重连过程，可以在ActiveMQConnectionFactory设置一个TransportListener

```java
static {
  ActiveMQConnectionFactory activeMQConnectionFactory = new ActiveMQConnectionFactory(Constant.FAULT_TOLERANT_URL);
  // 异步投递
  activeMQConnectionFactory.setUseAsyncSend(Boolean.TRUE);
  RedeliveryPolicy redeliveryPolicy = new RedeliveryPolicy();
  // 是否每次发送失败后增长投递时间
  redeliveryPolicy.setUseExponentialBackOff(Boolean.TRUE);
  // 最大重试次数，默认为6
  redeliveryPolicy.setMaximumRedeliveries(3);
  // 第一次重试时间
  redeliveryPolicy.setInitialRedeliveryDelay(1000);
  // 每次等待时间增长倍数
  redeliveryPolicy.setBackOffMultiplier(2);
  activeMQConnectionFactory.setRedeliveryPolicy(redeliveryPolicy);
  activeMQConnectionFactory.setTransportListener(new TransportListener() {
            @Override
            public void transportResumed() {
                      System.out.println("transport resumed");
            }
            @Override
            public void transportInterupted() {
                      System.out.println("transport interupted");
            }
            @Override
            public void onException(IOException error) {
                      log.error("onException:", error);
            }
            @Override
            public void onCommand(Object command) {
                      log.info("on command:{}", command);
            }
  });
  factory = new PooledConnectionFactory(activeMQConnectionFactory);
  factory.setMaxConnections(100);
}
```

## 3 brocker集群部署（mysql）

在activemq.xml配置文件中采用mysq持久化，jdbcPersistenceAdapter节点中添加useDatabaseLock="true" 属性。启动两个（以上）mq , 会发现只有一个mq 成功启动，另外一个处于等待锁的状态，这样当 抢到锁的mq 宕机了，其他的等待的mq 就继续抢锁，因为数据都在数据库中，所有我们能保证所有的消息都能完美消费。

如果master宕机，则未被消费的消息会转移到新的master上。本机重启并且重新成为master后brocker上的消息清空。

这里笔者就不再演示了，比较简单
