# 17、RabbitMQ 实战 - 延迟队列的简介与实现
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/2/17.html
- 分类：消息队列
- 分组：教程目录
**1、** 延迟队列的概念；

延迟队列内部是有序的，重要的特性体现在它的延迟属性上，延迟队列中的元素希望在指定时间到了之后或之前取出处理，简单的说延迟队列就是用来存放需要在指定时间被处理的元素的队列。

**2、** 延迟队列的应用场景；

(1)订单指定时间内未支付则自动取消

(2)用户发起退款，指定时间内未处理则通知相关运营人员

**3、** 定时任务和延迟队列的取舍；

以上场景都有一个特点，那就是都需要在某个事件发生前或发生后执行一项任务，如生成订单后，在十分钟后检查订单状态，未支付的订单将关闭，这种场景也可以用定时任务来处理，但数据量比价少的话确实可以用定时任务来处理，但在活动期间，订单的数据量可能会变得很庞大，对于庞大的数据，定时任务很难在1秒内检查完订单，从而不能及时的关闭未支付的订单，而且用定时任务来检查订单会给数据库带来很大的压力，所以在数据量大的情况下，定时任务无法满足业务需求且性能低下

**4、** 延迟队列架构图（后面我们就根据这个架构图进行代码的设计与实现）；

**5、** 延迟队列的实现；

(1)新建一个名为config的包，用于装实现特定配置的代码

效果图：

(2)在config包里新建一个名为TtlQueueConfig的类用于编写配置队列延迟的代码

代码如下：

```java
package com.ken.springbootrqbbitmq.config;
import org.springframework.amqp.core.*;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.util.HashMap;
import java.util.Map;
/**
 * 用于配置TTL队列的延迟时间
 */
@Configuration
public class TtlQueueConfig {
    //普通交换机的名称
    public static final String NORMAL_EXCHANGE = "normal_exchange";
    //死信交换机的名称
    public static final String DEAD_EXCHANGE = "dead_exchange";
    //普通队列的名称
    public static final String NORMAL_QUEUE01 = "normal_queue01";
    public static final String NORMAL_QUEUE02 = "normal_queue02";
    //死信队列的名称
    public static final String DEAD_QUEUE = "dead_queue";
    //声明普通交换机
    @Bean("normalExchange")
    public DirectExchange normalExchange() {
        return new DirectExchange(NORMAL_EXCHANGE);
    }
    //声明交换机交换机
    @Bean("deadExchange")
    public DirectExchange deadExchange() {
        return new DirectExchange(DEAD_EXCHANGE);
    }
    //声明普通队列,TTL为10S
    @Bean("normalQueue01")
    public Queue normalQueue01() {
        Map<String, Object> arguments = new HashMap<>();
        //设置死信交换机
        arguments.put("x-dead-letter-exchange",DEAD_EXCHANGE);
        //设置死信RoutignKey
        arguments.put("x-dead-letter-routing-key","dead");
        //设置TTL
        arguments.put("x-message-ttl",10000);
        return QueueBuilder.durable(NORMAL_QUEUE01).withArguments(arguments).build();
    }
    //声明普通队列,TTL为40S
    @Bean("normalQueue02")
    public Queue normalQueue02() {
        Map<String, Object> arguments = new HashMap<>();
        //设置死信交换机
        arguments.put("x-dead-letter-exchange",DEAD_EXCHANGE);
        //设置死信RoutignKey
        arguments.put("x-dead-letter-routing-key","dead");
        //设置TTL
        arguments.put("x-message-ttl",40000);
        return QueueBuilder.durable(NORMAL_QUEUE02).withArguments(arguments).build();
    }
    //声明死信队列
    @Bean("deadQueue")
    public Queue deadQueue() {
        return QueueBuilder.durable(DEAD_QUEUE).build();
    }
    //绑定队列1和普通交换机
    @Bean
    public Binding queue01BindNormalExchange(@Qualifier("normalQueue01") Queue normalQueue01,
                                             @Qualifier("normalExchange") DirectExchange normalExchange) {
        return BindingBuilder.bind(normalQueue01).to(normalExchange).with("normal01");
    }
    //绑定队列2和普通交换机
    @Bean
    public Binding queue02BindNormalExchange(@Qualifier("normalQueue02") Queue normalQueue02,
                                             @Qualifier("normalExchange") DirectExchange normalExchange) {
        return BindingBuilder.bind(normalQueue02).to(normalExchange).with("normal02");
    }
    //绑定队列2和普通交换机
    @Bean
    public Binding deadQueueBindDeadExchange(@Qualifier("deadQueue") Queue deadQueue,
                                             @Qualifier("deadExchange") DirectExchange deadExchange) {
        return BindingBuilder.bind(deadQueue).to(deadExchange).with("dead");
    }
}
```

(3)新建一个名为controller的包，用于装控制层的代码

效果图：

(4)新建一个名为SendMsgController的类用于充当生产者用于发送消息

代码如下：

```java
package com.ken.springbootrqbbitmq.controller;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Date;
/**
 * 发送延迟消息
 */
@Slf4j
@RequestMapping("ttl")
@RestController
public class SendMsgController {
    @Autowired(required = false)
    private RabbitTemplate rabbitTemplate;
    @GetMapping("/sendMsg/{message}")
    public void sendMsg(@PathVariable String message) {
        log.info("当前时间：{}，发送一条消息给两个TTL队列：{}",new Date().toString(),message);
        rabbitTemplate.convertAndSend("normal_exchange","normal01","消息来着ttl为10s的队列：" + message);
        rabbitTemplate.convertAndSend("normal_exchange","normal02","消息来着ttl为40s的队列：" + message);
    }
}
```

(5)新建一个名为consumer的包，用于装消费者的代码

效果图：

(6)新建一个名为DeadQueueConsumer的类用于消费死信队列里的消息

代码如下：

```java
package com.ken.springbootrqbbitmq.consumer;
import com.rabbitmq.client.Channel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import java.util.Date;
/**
 * 死信队列消费者
 */
@Slf4j
@Component
public class DeadQueueConsumer {
    //接收消息
    @RabbitListener(queues = "dead_queue")
    public void receiveMsg(Message message, Channel channel) throws Exception {
        String msg = new String(message.getBody());
        log.info("当前时间：{}，收到死信队列的消息：{}",new Date().toString(),msg);
    }
}
```

(7)进入项目的启动类启动项目

(8)启动完毕后在浏览器地址栏输入[http://localhost:8080/ttl/sendMsg/参数](http://localhost:8080/ttl/sendMsg/%E6%88%91%E6%98%AF%E7%AC%AC%E4%B8%80%E6%9D%A1%E6%B6%88%E6%81%AF)往队列发送消息

(9)查看控制台的输出，发现分别在10s和40s后进行输出，这证明我们的延迟队列成功运行

**6、** 延迟队列的优化；

虽然上述能实现延迟队列，但上述的实现过程是一个队列只能延迟固定的已经设置好的时间，若想增加一个新的时间需要，用上述的实现方法就只能新增一个队列，这样很麻烦，所以我们需要优化延迟队列

(1)延迟队列优化架构图 （后面我们就根据这个架构图对延迟队列进行优化）

(2)修改config包里TtlQueueConfig类的代码，多加一些关于NormalQueue03队列的配置

代码如下：

```java
package com.ken.springbootrqbbitmq.config;
import org.springframework.amqp.core.*;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.util.HashMap;
import java.util.Map;
/**
 * 用于配置TTL队列的延迟时间
 */
@Configuration
public class TtlQueueConfig {
    //普通交换机的名称
    public static final String NORMAL_EXCHANGE = "normal_exchange";
    //死信交换机的名称
    public static final String DEAD_EXCHANGE = "dead_exchange";
    //普通队列的名称
    public static final String NORMAL_QUEUE01 = "normal_queue01";
    public static final String NORMAL_QUEUE02 = "normal_queue02";
    //自定义延迟时间队列的名称
    public static final String NORMAL_QUEUE03 = "normal_queue03";
    //死信队列的名称
    public static final String DEAD_QUEUE = "dead_queue";
    //声明普通交换机
    @Bean("normalExchange")
    public DirectExchange normalExchange() {
        return new DirectExchange(NORMAL_EXCHANGE);
    }
    //声明交换机交换机
    @Bean("deadExchange")
    public DirectExchange deadExchange() {
        return new DirectExchange(DEAD_EXCHANGE);
    }
    //声明普通队列,TTL为10S
    @Bean("normalQueue01")
    public Queue normalQueue01() {
        Map<String, Object> arguments = new HashMap<>(3);
        //设置死信交换机
        arguments.put("x-dead-letter-exchange",DEAD_EXCHANGE);
        //设置死信RoutignKey
        arguments.put("x-dead-letter-routing-key","dead");
        //设置TTL
        arguments.put("x-message-ttl",10000);
        return QueueBuilder.durable(NORMAL_QUEUE01).withArguments(arguments).build();
    }
    //声明普通队列,TTL为40S
    @Bean("normalQueue02")
    public Queue normalQueue02() {
        Map<String, Object> arguments = new HashMap<>(3);
        //设置死信交换机
        arguments.put("x-dead-letter-exchange",DEAD_EXCHANGE);
        //设置死信RoutignKey
        arguments.put("x-dead-letter-routing-key","dead");
        //设置TTL
        arguments.put("x-message-ttl",40000);
        return QueueBuilder.durable(NORMAL_QUEUE02).withArguments(arguments).build();
    }
    //声明普通队列,TTL为40S
    @Bean("normalQueue03")
    public Queue normalQueue03() {
        Map<String, Object> arguments = new HashMap<>(3);
        //设置死信交换机
        arguments.put("x-dead-letter-exchange",DEAD_EXCHANGE);
        //设置死信RoutignKey
        arguments.put("x-dead-letter-routing-key","dead");
        //设置TTL
        return QueueBuilder.durable(NORMAL_QUEUE03).withArguments(arguments).build();
    }
    //声明死信队列
    @Bean("deadQueue")
    public Queue deadQueue() {
        return QueueBuilder.durable(DEAD_QUEUE).build();
    }
    //绑定队列1和普通交换机
    @Bean
    public Binding queue01BindNormalExchange(@Qualifier("normalQueue01") Queue normalQueue01,
                                             @Qualifier("normalExchange") DirectExchange normalExchange) {
        return BindingBuilder.bind(normalQueue01).to(normalExchange).with("normal01");
    }
    //绑定队列2和普通交换机
    @Bean
    public Binding queue02BindNormalExchange(@Qualifier("normalQueue02") Queue normalQueue02,
                                             @Qualifier("normalExchange") DirectExchange normalExchange) {
        return BindingBuilder.bind(normalQueue02).to(normalExchange).with("normal02");
    }
    //绑定队列3和普通交换机
    @Bean
    public Binding queue03BindNormalExchange(@Qualifier("normalQueue03") Queue normalQueue03,
                                             @Qualifier("normalExchange") DirectExchange normalExchange) {
        return BindingBuilder.bind(normalQueue03).to(normalExchange).with("normal03");
    }
    //绑定死信队列和死信交换机
    @Bean
    public Binding deadQueueBindDeadExchange(@Qualifier("deadQueue") Queue deadQueue,
                                             @Qualifier("deadExchange") DirectExchange deadExchange) {
        return BindingBuilder.bind(deadQueue).to(deadExchange).with("dead");
    }
}
```

(3)修改controller包里SendMsgController类的代码，多加一个调用自定义延迟时间NormalQueue03队列的接口

代码如下：

```java
package com.ken.springbootrqbbitmq.controller;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Date;
/**
 * 发送延迟消息
 */
@Slf4j
@RequestMapping("ttl")
@RestController
public class SendMsgController {
    @Autowired(required = false)
    private RabbitTemplate rabbitTemplate;
    @GetMapping("/sendMsg/{message}")
    public void sendMsg(@PathVariable String message) {
        log.info("当前时间：{}，发送一条消息给两个TTL队列：{}",new Date().toString(),message);
        rabbitTemplate.convertAndSend("normal_exchange","normal01","消息来着ttl为10s的队列：" + message);
        rabbitTemplate.convertAndSend("normal_exchange","normal02","消息来着ttl为40s的队列：" + message);
    }
    @GetMapping("/sendExpirationMsg/{message}/{ttlTime}")
    public void sendMsg(@PathVariable String message,@PathVariable String ttlTime) {
        log.info("当前时间：{}，发送一条时长{}毫秒的TTL消息给normal03队列：{}", new Date(),ttlTime,message);
        rabbitTemplate.convertAndSend("normal_exchange","normal03",message,msg -> {
            //发送消息的时候延迟时长
            msg.getMessageProperties().setExpiration(ttlTime);
            return msg;
        });
    }
}
```

(4)进入项目的启动类重新启动项目

(5)启动完毕后分别在浏览器地址栏输http://localhost:8080/ttl/sendExpirationMsg/第一个参数/20000和http://localhost:8080/ttl/sendExpirationMsg/第二个参数/2000队列发送消息

例：

(6)查看控制台的输出，发现第一条消息在20s后进行了输出，这证明我们优化后的延迟队列成功运行，但当我们发送多条消息时，消息可能不会按时"死亡"从而不能按时把消息发送到死信队列，如图里的第二条消息，在第一条消息被消费后紧跟着被消费，而不是隔2秒后被消费，这是因为RabbitMQ只会检查第一条消息是否过期，过期则会被扔进死信队列，如果第一条消息延迟时间很长，第二条消息延迟时间很短，第二条消息也并不会被优先消费，而是等到第一条消息被消费后第二条消息再被消费，这时需要我们用另一种方法去实现延迟队列（另一种方法放在下一篇文章介绍）
