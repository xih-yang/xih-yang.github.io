# 27、RabbitMQ 实战 - RabbitMQ使用Federation Exchange（联邦交换机）解决异地访问延迟问题
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/2/27.html
- 分类：消息队列
- 分组：教程目录
前言：

(broker北京)、(broker深圳)彼此之间相距甚远，网络延迟是一个不得不面对的问题。有一个在北京的业务(Client北京）需要连接(broker北京),向其中的交换器exchangeA发送消息，此时的网络延迟很小,(Client北京)可以迅速将消息发送至exchangeA 中，就算在开启了publisherconfirm机制或者事务机制的情况下，也可以迅速收到确认信息。此时又有个在深圳的业务(Client深圳)需要向exchangeA发送消息，那么(Client 深圳)(broker北京)之间有很大的网络延迟，(Client 深圳)发送消息至exchangeA会经历一定的延迟，尤其是在开启了publisherconfirm机制或者事务机制的情况下，(Client深圳)会等待很长的延迟时间来接收(broker北京)的确认信息，进而必然造成这条发送线程的性能降低，甚至造成一定程度上的阻塞。将业务(Client深圳)部署到北京的机房可以解决这个问题，但是如果(Client深圳)调用的另些服务都部署在深圳,那么又会引发新的时延问题,总不见得将所有业务全部部署在一个机房,那么容灾又何以实现?这里使用Federation 插件就可以很好地解决这个问题.

**1、** FederationExchange工作原理图；

**2、** 在每台机器上开启federation相关插件；

(1)安装rabbitmq_federation插件

```java
rabbitmq-plugins enable rabbitmq_federation
```

node1效果图 ：

node2效果图：

node3效果图：

(2)安装rabbitmq_federation_management插件

```java
rabbitmq-plugins enable rabbitmq_federation_management
```

node1效果图：

node2效果图：

node3效果图：

(3)进入安装了federation插件的节点的可视化页面，进入Admin可以看到多出了两个与federation相关的管理菜单

**3、** 在node2节点上创建fed_exchange交换机和node2_queue队列；

(1)编写以下代码

```java
package com.ken;
import com.rabbitmq.client.*;
public class Producer {
    public static final String FED_EXCHANGE = "fed_exchange";
    public static void main(String[] args) throws Exception {
        //创建一个连接工厂
        ConnectionFactory factory = new ConnectionFactory();
        //设置工厂IP，用于连接RabbitMQ的队列
        factory.setHost("192.168.194.128");
        //设置连接RabbitMQ的用户名
        factory.setUsername("admin");
        //设置连接RabbitMQ的密码
        factory.setPassword("123456");
        //创建连接
        Connection connection = factory.newConnection();
        //获取信道
        Channel channel = connection.createChannel();
        channel.exchangeDeclare(FED_EXCHANGE, BuiltinExchangeType.DIRECT);
        channel.queueDeclare("node2_queue",true,false,false,null);
        channel.queueBind("node2_queue",FED_EXCHANGE,"routeKey");
    }
}
```

(2)启动程序：

效果图：

交换机：

交换机和队列的绑定情况：

队列：

**4、** 在downstream(node2)上配置upstream(node1)；

(1)进入配置页面

(2)给上游起名称

(3)设置上游链接

(4)点击添加上游即可

效果图：

**5、** 添加策略；

(1)进入添加策略的页面

(2)给策略取一个名字，我这里取exchange-policy

(3)给策略加上匹配规则，通过正则表达式匹配队列，若交换机或者队列的名字满足以fed开头后面任意这个条件，则那条队列使用该策略

```java
^fed.*
```

例：

(4)选择交换机为策略的应用

(5)选择上游策略federation-upstream，点击Federation upstream即可

(6)填写上游的名称为node1-as-upstream（在步骤4(2)里我们填写的上游名称就是node1-as-upstream）

(7)添加策略即可

效果图：

(8)进入Admin里的Federation Status查看联邦状态，如果是running证明运行成功
