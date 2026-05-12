# 14、ActiveMQ 实战 - ActiveMQ高级特性2
- 来源：https://ddkk.com/zhuanlan/mq/activemq/3/14.html
- 分类：消息队列
- 分组：教程目录
### 前言

续上篇ActiveMQ高级特性，详细地址在下面

### 死信队列

死信队列：异常消息规避处理的集合，主要处理失败的消息。\color{red}死信队列：异常消息规避处理的集合，主要处理失败的消息。死信队列：异常消息规避处理的集合，主要处理失败的消息。
ActiveMQ中引入了“死信队列”(DeadLetterQueue)的概念。即一条消息再被重发了多次后(默认为重发6次，即redeliveryCounter==6)。将会被ActiveMQ移入“死信队列”。开发人员可以在这个Queue中查看处理出错的消息，进行人工干预。

## 死信队列应用案例

DLQ-死信队列(Dead Letter Queue)用来保存处理失败或者过期的消息。

一般生产环境中在使用MQ的时候设计两个队列：一个是核心业务队列，一个是死信队列。

核心业务队列，就是比如上图专门用来让订单系统发送订单消息的，然后另外一个死信队列就是用来处理异常情况的。

假如第三方物流系统故障了，此时无法请求，那么仓储系统每次消费到一条订单消息，尝试通知发货和配送都会遇到对方的接口报错。此时仓储系统就可以把这条消息拒绝访问或者标记为处理失败。一旦标记这条消息处理失败了之后，MQ就会把这条消息转入提前设置好的一个死信队列中。然后你会看到的就是，在第三方物流系统故障期间，所有的订单消息全部处理失败，全部都会转入到死信队列。然后你的仓储系统得专门找一个后台线程，监控第三方物流系统是否正常，是否能请求，不停地监视。一旦发现对方恢复正常，这个后台线程就从死信队列消费出来处理失败的订单，重新执行发货和配送通知。

缺省持久消息过期，会被送到死信队列，非持久消息不会送到DLQ。\color{red}缺省持久消息过期，会被送到死信队列，非持久消息不会送到DLQ。缺省持久消息过期，会被送到死信队列，非持久消息不会送到DLQ。
缺省的死信队列是ActiveMQ.DLQ，如果没有特别指定，死信都会被发送到这个队列中。\color{red}缺省的死信队列是ActiveMQ.DLQ，如果没有特别指定，死信都会被发送到这个队列中。缺省的死信队列是ActiveMQ.DLQ，如果没有特别指定，死信都会被发送到这个队列中。

## 死信队列策略

**1、** 共享队列策略（默认）；

```xml
<!-- “>”表示对所有队列生效，如果需要设置指定队列，则直接写队 列名称-->
<policyEntry queue=">">
	<deadLetterStrategy>
		<sharedDeadLetterStrategy processNonPersistent="false" processExpired="true" deadLetterQueue="" />
	</deadLetterStrategy>
</policyEntry>  
$\color{
     red}processNonPersistent：是否将非持久化消息发送到死信队列，默认false；processExpired：是否将过期消息放入到死信队列中，默认为true$
```

**1、** 独立死信队列策略；

individualDeadLetterStrategy可以为queue和topic单独指定两个死信队列。还可以为某个话题，单独指定一个死信队列。

```xml
<!-- “>”表示对所有队列生效，如果需要设置指定队列，则直接写队 列名称-->
<policyEntry queue=">">
	<deadLetterStrategy>
	<!--
		Use the prefix 'DLQ.' for the destination name, and make
		the DLQ a queue rather than a topic
	-->
		<individualDeadLetterStrategy queuePrefix="DLQ."/>
	</deadLetterStrategy>
</policyEntry>
```

queuePrefix：设置死信队列前缀

配置案例：

## 自动删除过期消息

过期消息是值生产者指定的过期时间，超过这个时间的消息。

## 存放非持久消息到死信队列中

### 消息不被重复消费，幂等性

原因：

解決方法：

## 小总结

基本上述的标题都是大厂常规面试题目
