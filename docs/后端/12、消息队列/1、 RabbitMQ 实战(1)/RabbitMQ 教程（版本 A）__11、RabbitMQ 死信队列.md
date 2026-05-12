# 11、RabbitMQ 死信队列
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/1/11.html
- 分类：消息队列
- 分组：RabbitMQ 教程（版本 A）
## 1、死信队列简介

先从概念解释上搞清楚这个定义，死信，顾名思义就是无法被消费的消息，字面意思可以这样理解，一般来说，producer 将消息投递到 broker 或者直接到 queue 里了，consumer 从 queue 取出消息进行消费，但**某些时候由于特定的原因导致 queue 中的某些消息无法被消费**，这样的消息如果没有后续的处理，就变成了死信，有死信自然就有了死信队列。

应用场景:为了保证订单业务的消息数据不丢失，需要使用到 RabbitMQ 的死信队列机制，当消息消费发生异常时，将消息投入死信队列中.还有比如说: 用户在商城下单成功并点击去支付后在指定时间未支付时自动失效

## 2、死信来源

**1、** 消息TTL过期；

**2、** 队列达到最大长度(队列满了，无法再添加数据到mq中)；

**3、** 消息被拒绝(basic.reject或basic.nack)并且requeue=false.；

## 3、过期时间

### 3.1、代码结构图

### 3.2、消费者一

```java
package com.zww.spring.rabbitmq.eight;
import com.rabbitmq.client.BuiltinExchangeType;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.DeliverCallback;
import com.zww.spring.rabbitmq.utils.RabbitMQUtils;
import java.util.HashMap;
import java.util.Map;
public class Consumer01 {
    //普通交换机名称
    private static final String NORMAL_EXCHANGE = "normal_exchange";
    //死信交换机名称
    private static final String DEAD_EXCHANGE = "dead_exchange";
    public static void main(String[] args) throws Exception {
        Channel channel = RabbitMQUtils.getChannel();
        //声明死信和普通交换机 类型为 direct
        channel.exchangeDeclare(NORMAL_EXCHANGE, BuiltinExchangeType.DIRECT);
        channel.exchangeDeclare(DEAD_EXCHANGE, BuiltinExchangeType.DIRECT);
        //声明死信队列
        String deadQueue = "dead-queue";
        channel.queueDeclare(deadQueue, false, false, false, null);
        //死信队列绑定：队列、交换机、路由键（routingKey）
        channel.queueBind(deadQueue, DEAD_EXCHANGE, "lisi");
        //正常队列绑定死信队列信息
        Map<String, Object> params = new HashMap<>();
        //正常队列设置死信交换机 参数 key 是固定值
        params.put("x-dead-letter-exchange", DEAD_EXCHANGE);
        //正常队列设置死信 routing-key 参数 key 是固定值
        params.put("x-dead-letter-routing-key", "lisi");
        //正常队列
        String normalQueue = "normal-queue";
        channel.queueDeclare(normalQueue, false, false, false, params);
        channel.queueBind(normalQueue, NORMAL_EXCHANGE, "zhangsan");
        System.out.println("等待接收消息........... ");
        DeliverCallback deliverCallback = (consumerTag, delivery) -> {
            String message = new String(delivery.getBody(), "UTF-8");
            System.out.println("Consumer01 接收到消息" + message);
        };
        channel.basicConsume(normalQueue, true, deliverCallback, consumerTag -> {
        });
    }
}
```

### 3.3、消费者二

```java
package com.zww.spring.rabbitmq.eight;
import com.rabbitmq.client.BuiltinExchangeType;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.DeliverCallback;
import com.zww.spring.rabbitmq.utils.RabbitMQUtils;
//死信队列 消费者二
public class Consumer02 {
    //死信交换机名称
    private static final String DEAD_EXCHANGE = "dead_exchange";
    public static void main(String[] args) throws Exception {
        Channel channel = RabbitMQUtils.getChannel();
        //声明交换机
        channel.exchangeDeclare(DEAD_EXCHANGE, BuiltinExchangeType.DIRECT);
        //声明队列
        String deadQueue = "dead-queue";
        channel.queueDeclare(deadQueue, false, false, false, null);
        channel.queueBind(deadQueue, DEAD_EXCHANGE, "lisi");
        System.out.println("等待接收死信消息........... ");
        DeliverCallback deliverCallback = (consumerTag, delivery) -> {
            String message = new String(delivery.getBody(), "UTF-8");
            System.out.println("Consumer02 接收到消息" + message);
        };
        channel.basicConsume(deadQueue, true, deliverCallback, consumerTag -> {
        });
    }
}
```

### 3.4、生产者

```java
package com.zww.spring.rabbitmq.eight;
import com.rabbitmq.client.AMQP;
import com.rabbitmq.client.Channel;
import com.zww.spring.rabbitmq.utils.RabbitMQUtils;
//生产者
public class Producer {
    //普通交换机名称
    public static final String NORMAL_EXCHANGE = "normal_exchange";
    public static void main(String[] args) throws Exception {
        Channel channel = RabbitMQUtils.getChannel();
        //死信消息 设置TTL时间  expirantion过期时间
        AMQP.BasicProperties properties = new AMQP.BasicProperties().builder().expiration("10000").build();
        for (int i = 0; i < 10; i++) {
            String message = "info" + i;
            channel.basicPublish(NORMAL_EXCHANGE,"zhangsan",null,message.getBytes("UTF-8"));
        }
    }
}
```

### 3.5、运行测试

**1、启动消费者一，创建信道**

**2、关闭消费者一，启动生产者发送消息**

10S过期

**3、启动消费者二**

## 4、队列长度

**1、** 消息生产者代码去掉TTL属性

![ ][nbsp5]；

**2、** C1消费者修改以下代码(启动之后关闭该消费者模拟其接收不到消息)

![ ][nbsp6]；

注意此时需要把原先队列删除 因为参数发生了改变

**3.C2 消费者代码不变(启动 C2 消费者)**

## 5、消息被拒

**1、** 生产者

![ ][nbsp8]；

**2、** C1消费者代码(启动之后关闭该消费者模拟其接收不到消息)

![ ][nbsp9]；

注意此时需要把原先队列删除 因为参数发生了改变

**3.启动测试**

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
