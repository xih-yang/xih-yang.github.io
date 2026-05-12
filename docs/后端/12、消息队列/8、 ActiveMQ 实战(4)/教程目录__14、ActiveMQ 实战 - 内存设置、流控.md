# 14、ActiveMQ 实战 - 内存设置、流控
- 来源：https://ddkk.com/zhuanlan/mq/activemq/4/14.html
- 分类：消息队列
- 分组：教程目录
## 1 内存设置

windows 环境下 Bin/activemq.bat 文件

linux环境中 修改env文件：

ACTIVEMQ_OPTS_MEMORY="-Xms1G -Xmx1G"

在broker配置中的系统内存和磁盘空间使用量

```java
<systemUsage>
             <systemUsage>
                       <memoryUsage>
                                 <memoryUsagelimit="20mb"/>
                       </memoryUsage>
                       <storeUsage>
                                 <storeUsagelimit="1gb"/>
                       </storeUsage>
                       <tempUsage>
                                 <tempUsagelimit="100mb"/>
                       </tempUsage>
             </systemUsage>
    </systemUsage>
```

- memoryUsage表示ActiveMQ使用的内存，这个值要大于等于destinationPolicy中设置的所有队列的内存之和。
- storeUsage表示持久化存储文件的大小。
- tempUsage表示非持久化消息存储的临时内存大小。

这里配置的memoryUsage一定要小于jvm中设置的数量，否则broker启动时会log.error提示设置内存出错。

在broker中还可单独配置生产者使用的producerSystemUsage 和消费者使用的consumerSystemUsage，格式跟systeUsage一样。默认情况下，没有配置producerSystemUsage 和 consumerSystemUsage，则生产者和消费者都使用systemUsage。若生产者把内存用完，将会导致消费者线程处理缓慢甚至造成消息阻塞的问题。在这种情况下，增加消费者数量可能都无法增加消息消费的速度。

解决办法：在broker上设置splitSystemUsageForProducersConsumers=”true”，使得生产者线程和消费者线程各使用各的内存。默认是 生产者线程内存：消费者线程内存 = 6:4。也可以通过如下两个参数设置生产者线程内存和消费者线程内存各一半：

producerSystemUsagePortion = 50

consumerSystemUsagePortion = 50

## 2 流量控制

### 2.1 生产者流量控制

ActiveMQ支持为每个生产者单独设置流量控制。流量控制的含义：当生产者产生消息过快，超过流量限制的时候，生产者将会被阻塞直到资源可以继续使用，或者抛出一个JMSException。

同步发送消息（useAsynSend为false）和异步发送消息时（useAsynSend为true），流量控制实现的方式不一样的。

#### 2.1.1 同步发送流控设置

同步发送消息：此时将在SystemUsage的限制下，使用destinationPolicy中的policyEntry来实现流量控制。如：

```java
<destinationPolicy>
     <policyMap>
          <policyEntries>
               <policyEntry queue="Foo" producerFlowControl="true"memoryLimit="1mb">         
     <pendingQueuePolicy>
          <vmQueueCursor/>
     </pendingQueuePolicy>
</policyEntry>
          </policyEntries>
     </policyMap>
</destinationPolicy>
```

限制队列Foo的最大内存为1M，当使用内存达到1M时，该生产者将直接被阻塞至有空余的内存时才会继续发送消息。

也可以在systemUsage上设置sendFailIfNoSpace="true"和sendFailIfNoSpaceAfterTimeout="3000"来控制客户端的异常和等待时间。

（1）sendFailIfNoSpace="true"：应对代理空间不足，而导致不确定的阻塞send()方法的一种替代方案，就是将其配置成客户端抛出的一个异常。

```java
<systemUsage>
  <systemUsage sendFailIfNoSpace="true">
            <memoryUsage>
                      <memoryUsage limit="20 mb"/>
            </memoryUsage>
  </systemUsage>
</systemUsage>
```

（2）sendFailIfNoSpaceAfterTimeout="3000"：导致send()方法失败，并在客户端抛出异常，但仅当等待了指定时间之后才触发。单位是毫秒。

```java
<systemUsage>
  <systemUsage sendFailIfNoSpaceAfterTimeout="3000">
            <memoryUsage>
                      <memoryUsage limit="20 mb"/>
            </memoryUsage>
  </systemUsage>
</systemUsage>
```

#### 2.1.2 异步发送流控设置

异步发送消息：由于不阻塞生产者，可以通过connctionFactory.setProducerWindowSize(1024000)来控制broker确认收到消息前生产者能发送的最大数据量。

### 2.2 消费者流量控制

在消费者端，流量控制是通过prefetchSize参数来控制未确认情况下，最多可以预获取多少条记录。实现方式有以下三种方式：

1、 tcp://localhost:61616?jms.prefetchPolicy.all=50

2、 tcp://localhost:61616?jms.prefetchPolicy.queuePrefetch=1

3、 queue = new ActiveMQQueue("TEST.QUEUE?consumer.prefetchSize=10");
