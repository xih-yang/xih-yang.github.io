# 22、RabbitMQ 实战 - RabbitMQ优先级队列
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/2/22.html
- 分类：消息队列
- 分组：教程目录
前言：在购物系统中有一个订单催付的场景，如果客户在购物系统下单后在设定的时间内未付款那么就会给客户推送一条短信提醒，这是一个比较简单的功能，但是，商家对我们来说，肯定是要区分大客户和小客户的，比如像苹果、华为、小米这样的大商家一年能给我们创造很大的利润，在业务高峰时期，订单堆积，来不及处理，而为了创造最大的利润，他们的订单必须得到优先处理，而曾经的后端系统是使用redis来存放短信提醒的，并通过定时轮询实现短信发送，但大家都知道redis只能用List做一个简简单单的消息队列，并不能实现一个优先级的场景，所以后来需要采用RabbitMQ对系统进行改造和优化,如果发现是大客户的订单给一个相对比较高的优先级，否则就是默认优先级，而实现优先级就用到了RabbitMQ的优先级队列。

**1、** 在config包里新建一个名为PriorityQueueConfig的类用于编写配置交换机、队列、routingkey的代码；

代码如下：

```java
package com.ken.springbootrqbbitmq.config;
import org.springframework.amqp.core.*;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
@Configuration
public class PriorityQueueConfig {
    //交换机
    public static final String EXCHANGE_NAME = "priority_exchange";
    //队列
    public static final String QUEUE_NAME = "priority_queue";
    //routingkey
    public static final String ROUTING_KEY = "priority";
    //声明交换机
    @Bean("directExchange")
    public DirectExchange priorityExchange() {
        return new DirectExchange(EXCHANGE_NAME);
    }
    //声明队列
    @Bean("priorityQueue")
    public Queue priorityQueue() {
        //官方允许范围为0-255，这里设置10，即允许优先级的范围为0-10
        return QueueBuilder.durable().withArgument("x-max-priority",10).build();
    }
    //绑定交换机和队列
    @Bean
    public Binding warningQueueBindingBackupExchange(@Qualifier("priorityQueue") Queue priorityQueue,
                                                     @Qualifier("directExchange") DirectExchange directExchange) {
        return BindingBuilder.bind(priorityQueue).to(directExchange).with(ROUTING_KEY);
    }
}
```

**2、** 在controller包里新建一个名为SendPriorityMsgController的类用于编写充当生产者发送消息的代码；

代码如下：

```java
package com.ken.springbootrqbbitmq.controller;
import com.ken.springbootrqbbitmq.config.PriorityQueueConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
@Slf4j
@RestController
@RequestMapping("/priority")
public class SendPriorityMsgController {
    @Autowired(required = false)
    private RabbitTemplate rabbitTemplate;
    //发消息
    @GetMapping("/sendPriorityMessage/{message}")
    public void sendMessage(@PathVariable String message) {
        for (int i = 1; i <= 10; i++) {
            String msg = message + i;
            if(i == 5) {
                //给第5条消息设置优先级为5（数字越大优先级越高）
                rabbitTemplate.convertAndSend(PriorityQueueConfig.EXCHANGE_NAME,
                        PriorityQueueConfig.ROUTING_KEY,msg,correlationData -> {
                            correlationData.getMessageProperties().setPriority(5);
                            return correlationData;
                        });
            }else {
                rabbitTemplate.convertAndSend(PriorityQueueConfig.EXCHANGE_NAME,
                        PriorityQueueConfig.ROUTING_KEY,msg);
            }
            log.info("发送消息内容：{}",msg);
        }
    }
}
```

**3、** 在consumer包里新建一个名为PriorityQueueConsumer的类用于编写充当消费者消费消息的代码；

代码如下：``

```java
package com.ken.springbootrqbbitmq.consumer;
import com.ken.springbootrqbbitmq.config.PriorityQueueConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
@Slf4j
@Component
public class PriorityQueueConsumer {
    @RabbitListener(queues = PriorityQueueConfig.QUEUE_NAME)
    public void receivePriorityMsg(Message message) {
        String msg = new String(message.getBody());
        log.info("接收到的消息为：{}",msg);
    }
}
```

**4、** 先注释消费者的代码，然后启动项目，在浏览器地址栏调用发送消息的接口；

[http://localhost:8080/priority/sendPriorityMessage/我是消息](http://localhost:8080/priority/sendPriorityMessage/)

生产者发送消息后，没有消费者消费消息，消息就会堆积在队列中，可以用于模拟在业务高峰时期，订单堆积，来不及处理的场景。

效果图：

**5、** 去掉消费者代码里的注释，然后重新启动项目，可以得见消息被消费者消费了，且第5条消息由于优先级是5，在所有的消息里优先级最高，被优先消费了，这证明我们的优先队列成功实现了；

效果图：
