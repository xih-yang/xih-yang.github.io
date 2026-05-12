# 28、RabbitMQ 实战 - RabbitMQ使用Federation Queue（联邦队列）解决异地访问延迟问题
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/2/28.html
- 分类：消息队列
- 分组：教程目录
前言：

联邦队列可以在多个Broker节点(或者集群)之间为单个队列提供均衡负载的功能。一个联邦队列可以连接一个或者多个上游队列(upstream queue)，并从这些上游队列中获取消息以满足本地消费者消费消息的需求。

**1、** FederationQueue工作原理图；

**2、** 添加策略；

(1)进入添加策略的页面

(2)给策略取一个名字，我这里取queue-policy

(3)给策略加上匹配规则，通过正则表达式匹配队列，若交换机或者队列的名字满足以fed开头后面任意这个条件，则那条队列使用该策略

```java
^fed.*
```

例：

(4)选择队列为策略的应用

(5)选择上游策略federation-upstream，点击Federation upstream即可

(6)填写上游的名称为node1-as-upstream

(7)添加策略即可
