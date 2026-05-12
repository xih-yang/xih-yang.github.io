# 20、RabbitMQ 实战 - RabbitMQ备份交换机
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/2/20.html
- 分类：消息队列
- 分组：教程目录
前言：上一篇文章我们提到当交换机确认消息失败或者交换机发送消息到队列失败，都可以通过回调方法让生产者重新发送消息，除此之外另一种方法就是通过备份交换机的方式保证消息的不丢失，当生产者无法把消息投递给交换机，就通过交换机把消息发送到备份交换机，再让备份交换机通过自己的路由以及自己的队列发送消息给消费者，从而把发送失败的消息保存下来。

**1、** 架构图如下；

**2、** 修改ConfirmConfig类的代码；

代码如下：

```java
package com.ken.springbootrqbbitmq.config;
import org.springframework.amqp.core.*;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
@Configuration
public class ConfirmConfig {
    //交换机
    public static final String EXCHANGE_NAME = "confirm_exchange";
    //队列
    public static final String QUEUE_NAME = "confirm_queue";
    //routingkey
    public static final String ROUTING_KEY = "confirm";
    //备份交换机
    public static final String BACKUP_EXCHANGE_NAME = "backup_exchange";
    //备份队列
    public static final String BACKUP_QUEUE_NAME = "backup_queue";
    //报警队列
    public static final String WARNING_QUEUE_NAME = "warning_queue";
    /**
     * 声明交换机
     * durable(true)表示队列持久化
     * withArgument用于写入参数，这里的参数alternate-exchange表示备份交换机
     * @return
     */
    @Bean("confirmExchange")
    public DirectExchange confirmExchange() {
        return ExchangeBuilder.directExchange(EXCHANGE_NAME).durable(true)
                .withArgument("alternate-exchange",BACKUP_EXCHANGE_NAME).build();
    }
    //声明队列
    @Bean("confirmQueue")
    public Queue confirmQueue() {
        return QueueBuilder.durable(QUEUE_NAME).build();
    }
    //绑定交换机和队列
    @Bean
    public Binding queueBindingExchange(@Qualifier("confirmQueue") Queue confirmQueue,
                                        @Qualifier("confirmExchange") DirectExchange confirmExchange) {
        return BindingBuilder.bind(confirmQueue).to(confirmExchange).with(ROUTING_KEY);
    }
    //声明备份交换机
    @Bean("backupExchange")
    public FanoutExchange backupExchange() {
        return new FanoutExchange(BACKUP_EXCHANGE_NAME);
    }
    //声明备份队列
    @Bean("backupQueue")
    public Queue backupQueue() {
        return QueueBuilder.durable(BACKUP_QUEUE_NAME).build();
    }
    //声明报警队列
    @Bean("warningQueue")
    public Queue warningQueue() {
        return QueueBuilder.durable(WARNING_QUEUE_NAME).build();
    }
    //绑定备份交换机和备份队列
    @Bean
    public Binding backupQueueBindingBackupExchange(@Qualifier("backupQueue") Queue backupQueue,
                                        @Qualifier("backupExchange") FanoutExchange backupExchange) {
        return BindingBuilder.bind(backupQueue).to(backupExchange);
    }
    //绑定备份交换机和备份队列
    @Bean
    public Binding warningQueueBindingBackupExchange(@Qualifier("warningQueue") Queue warningQueue,
                                                    @Qualifier("backupExchange") FanoutExchange backupExchange) {
        return BindingBuilder.bind(warningQueue).to(backupExchange);
    }
}
```

**3、** 在consumer包里新建一个名为WarningConsumer的类用于编写充当消费者消费消息的代码；

代码如下：

```java
package com.ken.springbootrqbbitmq.consumer;
import com.ken.springbootrqbbitmq.config.ConfirmConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
/**
 * 报警消费者
 */
@Component
@Slf4j
public class WarningConsumer {
    //接收报警消息
    @RabbitListener(queues = ConfirmConfig.WARNING_QUEUE_NAME)
    public void receiveWarningMsg(Message message) {
        String msg = new String(message.getBody());
        log.error("警告！发现不可路由的消息{}",msg);
    }
}
```

**4、** 因为我们修改了交换机的代码，所以我们需要删除旧的confirm_exchange交换机，然后再启动项目重新生成confirm_exchange交换机；

**5、** 重新启动项目，在浏览器地址栏调用发送消息的接口，可以看到生产者发送消息成功，交换机路由消息失败后把消息发送给了备份交换机，使得warning_queue队列收到消息，从而让warning_consumer成功消费到不可路由的消息；

[http://localhost:8080/confirm/sendMessage/我是消息](http://localhost:8080/confirm/sendMessage/%E6%88%91%E6%98%AF%E6%B6%88%E6%81%AF)

例：

效果图：

**6、** 结果分析；

我们在配置文件开启了消息回退

也编写了和注入了消息回退的代码

同时我们也编写了备份交换机的代码

但由上述步骤5的结果可以看出，在同时使用mandatory参数和备份交换机的时候，消息优先走了备份交换机，打印了”警告！发现不可路由的消息“的日志，而不是走交换机的退回重发打印”被交换机退回“的日志，这证明备份交换机的优先级高于mandatory参数
