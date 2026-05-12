# 10、RabbitMQ Routing 之订阅模型-Topic
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/1/10.html
- 分类：消息队列
- 分组：RabbitMQ 教程（版本 A）
## 1、Topic简介

`Topic`类型的`Exchange`与`Direct`相比，都是可以根据`RoutingKey`把消息路由到不同的队列。只不过`Topic`类型`Exchange`可以让队列在绑定`Routing key` 的时候使用通配符！这种模型`Routingkey` 一般都是由一个或多个单词组成，多个单词之间以”.”分割，例如： `item.insert`

## 2、Topic 的要求

发送到类型是 topic 交换机的消息的 routing_key 不能随意写，**必须满足一定的要求，它必须是一个单词列表，以点号分隔开**。这些单词可以是任意单词，比如说："stock.usd.nyse", "nyse.vmw","quick.orange.rabbit".这种类型的。当然这个单词列表最多不能超过 255 个字节。

在这个规则列表中，其中有两个替换符需要注意:

*(星号)可以代替一个单词

#(井号)可以替代零个或多个单词

### 2.1、Topic 匹配案例

**下图绑定关系如下:**

Q1-->绑定的是

- 中间带 orange 带 3 个单词的字符串(*.orange.*)

Q2-->绑定的是

- 最后一个单词是 rabbit 的 3 个单词(*.*.rabbit)
- 第一个单词是 lazy 的多个单词(lazy.#)

上图是一个队列绑定关系图，我们来看看他们之间数据接收情况是怎么样的

quick.orange.rabbit------->被队列 Q1Q2 接收到

lazy.orange.elephant ------->被队列 Q1Q2 接收到

quick.orange.fox ------->被队列 Q1 接收到

lazy.brown.fox ------->被队列 Q2 接收到

lazy.pink.rabbit-------> 虽然满足两个绑定但只被队列 Q2 接收一次

quick.brown.fox ------->不匹配任何绑定不会被任何队列接收到会被丢弃

quick.orange.male.rabbit-------> 是四个单词不匹配任何绑定会被丢弃

lazy.orange.male.rabbit-------> 是四个单词但匹配 Q2

## 3、实战

### 3.1、消费者一

```java
package com.zww.spring.rabbitmq.seven;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.DeliverCallback;
import com.zww.spring.rabbitmq.utils.RabbitMQUtils;
//消费者
public class ReceiveLogsTopic01 {
    //交换机名称
    public static final String EXCHANGE_NAME = "topic_logs";
    //接收消息
    public static void main(String[] args) throws Exception {
        Channel channel = RabbitMQUtils.getChannel();
        //声明交换机
        channel.exchangeDeclare(EXCHANGE_NAME,"topic");
        //声明队列
        String queueName = "Q1";
        channel.queueDeclare(queueName,false,false,false,null);
        //绑定信道
        channel.queueBind(queueName,EXCHANGE_NAME,"*.orange.*");
        System.out.println("等待接收消息.....");
        DeliverCallback deliverCallback = (consumerTag, message) ->{
            System.out.println(new String(message.getBody(),"UTF-8"));
            System.out.println("接收队列："+queueName + "绑定key：" + message.getEnvelope().getRoutingKey());
        };
        channel.basicConsume(queueName,true,deliverCallback,consumerTag -> {});
    }
}
```

### 3.2、生产者

```java
package com.zww.spring.rabbitmq.seven;
import com.rabbitmq.client.Channel;
import com.zww.spring.rabbitmq.utils.RabbitMQUtils;
import java.util.HashMap;
import java.util.Map;
//生产者
public class EmitLogTopic {
    //交换机名称
    public static final String EXCHANGE_NAME = "topic_logs";
    public static void main(String[] args) throws Exception {
        Channel channel = RabbitMQUtils.getChannel();
        /*
        * Q1-->绑定的是
        *           中间带orange的3个单词的信道(*.orange.*)
        * Q2-->绑定的是
        *           最后一个单词是rabbit的3个单词的信道(*.*.rabbit)
        *           第一个单词是lazy的多个单词的信道(lazy.#)
        * */
        HashMap<String, String> bindingKeymap = new HashMap<>();
        bindingKeymap.put("quick.orange.rabbit","被队列Q1Q2接收到");
        bindingKeymap.put("lazy.orange.elephant","被队列Q1Q2接收到");
        bindingKeymap.put("quick.orange.fox","被队列Q1接收到");
        bindingKeymap.put("lazy.brown.fox","被队列Q2接收到");
        bindingKeymap.put("lazy.pink.rabbit","虽然满足两个绑定，但只被队列Q2接收一次");
        bindingKeymap.put("quick.brown.fox","不匹配任何绑定不会被任何队列接收到，会被丢弃");
        bindingKeymap.put("quick.orange.male.rabbit","是四个单词不匹配任何绑定，会被丢弃");
        bindingKeymap.put("lazy.orange.male.rabbit","被Q2接收到");
        for (Map.Entry<String, String> bindingKeyEntry : bindingKeymap.entrySet()) {
            String routingKey = bindingKeyEntry.getKey();
            String message = bindingKeyEntry.getValue();
            channel.basicPublish(EXCHANGE_NAME,routingKey,null,message.getBytes("UTF-8"));
            System.out.println("生产者发出消息：" + message);
        }
    }
}
```

### 3.3、运行测试

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
