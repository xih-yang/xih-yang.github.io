# 13、SpringBoot 整合 ActiveMQ 延时消息、死信队列
- 来源：https://ddkk.com/zhuanlan/mq/activemq/1/13.html
- 分类：消息队列
- 分组：教程目录
## 1、引入 ActiveMQ 的依赖

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-activemq</artifactId>
</dependency>
```

## 2、application.yml 文件配置

```sh
spring:
  activemq:
    # 连接地址
    broker-url: failover:tcp://192.168.237.23:61616
    user: admin
    password: admin
    queue-name: active.queue.name
    #true表示使用连接池；false时，每发送一条数据创建一个连接
    pool:
      enabled: true
  jms:
    template:
      delivery-mode: persistent
```

spring.activemq.queue-name 是我自定义的，待会在配置队列名称时可以用到。

## 3、SpringBoot 的启动类配置

在SpringBoot 的启动类上加上一个 `@EnableJms` 注解

## 4、ActiveMQ 连接相关配置

新建一个 BeanConfig 类用来配置 ActiveMQ 连接相关配置。在工厂中设置开启手动消息确认模式。注意：ActiveMQ 默认是开启事务的，且在事务开启的时候消息为自动确认模式，就算是设置了手动确认也无效，因此想要开启手动确认消息模式，还需关掉事务。

代码如下：

```java
package com.caihao.activemqdemo.config;
import org.apache.activemq.ActiveMQConnectionFactory;
import org.apache.activemq.ActiveMQSession;
import org.apache.activemq.command.ActiveMQQueue;
import org.apache.activemq.command.ActiveMQTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jms.config.JmsListenerContainerFactory;
import org.springframework.jms.config.SimpleJmsListenerContainerFactory;
import org.springframework.jms.core.JmsMessagingTemplate;
import javax.jms.ConnectionFactory;
import javax.jms.Queue;
import javax.jms.Topic;
@Configuration
public class BeanConfig {
    @Value("${spring.activemq.broker-url}")
    private String brokerUrl;
    @Value("${spring.activemq.user}")
    private String username;
    @Value("${spring.activemq.password}")
    private String password;
    @Bean(name = "queue")
    public Queue queue() {
        return new ActiveMQQueue("queue-test");
    }
    @Bean(name = "delayQueue")
    public Queue delayQueue() {
        return new ActiveMQQueue("delay-queue-test");
    }
    @Bean
    public Topic topic() {
        return new ActiveMQTopic("topic-test");
    }
    @Bean
    public ConnectionFactory connectionFactory() {
        return new ActiveMQConnectionFactory(username, password, brokerUrl);
    }
    @Bean
    public JmsMessagingTemplate jmsMessageTemplate() {
        return new JmsMessagingTemplate(connectionFactory());
    }
    // 在Queue模式中，对消息的监听需要对containerFactory进行配置
    @Bean("queueListener")
    public JmsListenerContainerFactory<?> queueJmsListenerContainerFactory(ConnectionFactory connectionFactory) {
        SimpleJmsListenerContainerFactory factory = new SimpleJmsListenerContainerFactory();
        // 关闭事务
        factory.setSessionTransacted(false);
        // 设置手动确认，默认配置中Session是开启了事物的，即使我们设置了手动Ack也是无效的
        factory.setSessionAcknowledgeMode(ActiveMQSession.INDIVIDUAL_ACKNOWLEDGE);
        factory.setPubSubDomain(false);
        factory.setConnectionFactory(connectionFactory);
        return factory;
    }
    //在Topic模式中，对消息的监听需要对containerFactory进行配置
    @Bean("topicListener")
    public JmsListenerContainerFactory<?> topicJmsListenerContainerFactory(ConnectionFactory connectionFactory) {
        SimpleJmsListenerContainerFactory factory = new SimpleJmsListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setPubSubDomain(true);
        return factory;
    }
}
```

## 5、队列消息手动确认实现

### 5.1、消息生产者

消息生产者代码比较少，主要是调用 `jmsMessagingTemplate` 的 `convertAndSend()` 方法。发送的消息如果是对象的话，可以将对象转成 json 串传输。（注意：在上面配置中关掉事务和设置手动确认）

```java
package com.caihao.activemqdemo.producer;
import com.caihao.activemqdemo.entity.Student;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.activemq.ScheduledMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jms.core.JmsMessagingTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import javax.jms.Queue;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
@RestController
@Slf4j
public class ProducerController {
    @Autowired
    private JmsMessagingTemplate jmsMessagingTemplate;
    @Autowired
    @Qualifier("queue")// 因为我配置中还有个延时队列，所以采用通过bean的名称方式注入
    private Queue queue;
    /**
     * 发送普通消息队列
     */
    @GetMapping("/queue")
    public String sendQueue() throws JsonProcessingException {
        Student student = new Student(1, "张三", new Date());
        ObjectMapper objectMapper = new ObjectMapper();
        String msg = objectMapper.writeValueAsString(student);
        log.info("发送-开始");
        jmsMessagingTemplate.convertAndSend(queue, msg);
        log.info("发送-结束");
        return "send queue success";
    }
}
```

其中Student 类如下：

```java
package com.caihao.activemqdemo.entity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;
import java.util.Date;
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Student implements Serializable {
    private static final long serialVersionUID = 1;
    private Integer id;
    private String name;
    private Date birthDay;
}
```

### 5.2、消息消费者

这里我定义了两个 `"queue-test"` 的消费者，在消费消息时，这两个消费者默认会轮询消费。在消费完消息之后，调用 `message.acknowledge()` 进行消息的手动确认。如果在消费者中未进行手动确认的话，由于 ActiveMQ 进行了持久化消息，那么在项目下次启动的时候还会再次发送该消息。

```java
package com.caihao.activemqdemo.consumer;
import com.caihao.activemqdemo.entity.Student;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.activemq.command.ActiveMQMessage;
import org.springframework.jms.annotation.JmsListener;
import org.springframework.stereotype.Component;
import javax.jms.JMSException;
import javax.jms.Session;
import javax.jms.TextMessage;
@Slf4j
@Component
public class ConsumerListener {
    /**
     * queue-test普通队列：消费者1
     */
    @JmsListener(destination = "queue-test", containerFactory = "queueListener")
    public void receiveQueueTest1(ActiveMQMessage message, Session session) throws JMSException,
            JsonProcessingException {
        log.info("receiveQueueTest:1");
        String text = null;
        if (message instanceof TextMessage) {
            TextMessage textMessage = (TextMessage) message;
            text = textMessage.getText();
            log.info("queue1接收到消息：{}", text);
            ObjectMapper objectMapper = new ObjectMapper();
            Student student = objectMapper.readValue(text, Student.class);
            sleep(5000);
            log.info("queue1接收到student：{}", student);
            // 手动确认
            message.acknowledge();
        }
    }
    /**
     * queue-test普通队列：消费者2
     */
    @JmsListener(destination = "queue-test", containerFactory = "queueListener")
    public void receiveQueueTest2(ActiveMQMessage message, Session session) throws JMSException,
            JsonProcessingException {
        log.info("receiveQueueTest:2");
        String text = null;
        if (message instanceof TextMessage) {
            TextMessage textMessage = (TextMessage) message;
            text = textMessage.getText();
            log.info("queue2接收到消息：{}", text);
            ObjectMapper objectMapper = new ObjectMapper();
            Student student = objectMapper.readValue(text, Student.class);
            sleep(5000);
            log.info("queue2接收到student：{}", student);
            // 手动确认
            message.acknowledge();
        }
    }
    private void sleep(long time) {
        try {
            Thread.sleep(time);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
```

## 6、发送延时消息

发送延时消息需要修改 ActiveMQ 安装目录下的 `conf/activemq.xml` 文件。

打开activemq.xml 文件，找到 `` 标签，在 `` 标签里面增加一个属性 `schedulerSupport="true"` 。如下所示：

```xml
<broker xmlns="http://activemq.apache.org/schema/core" brokerName="localhost" dataDirectory="${activemq.data}"
schedulerSupport="true">
```

发送延迟消息队列的时候还是调用 `jmsMessagingTemplate.convertAndSend` 方法，只不过相比于普通队列，我们需要再多传一个 `Map` 类型的参数，为该参数添加一个键值对，其中 key 为 `ScheduledMessage.AMQ_SCHEDULED_DELAY` ，value 为需要延迟的时间（毫秒）。

生产者代码如下：

```java
@Autowired
@Qualifier("delayQueue")
private Queue delayQueue;
/**
 * 发送延迟消息队列
 */
@GetMapping("/delay-queue")
public String sendDelayQueue() throws JsonProcessingException {
    Student student = new Student(2, "李四", new Date());
    ObjectMapper objectMapper = new ObjectMapper();
    String msg = objectMapper.writeValueAsString(student);
    Map<String, Object> headers = new HashMap<>();
    // 延迟5秒
    headers.put(ScheduledMessage.AMQ_SCHEDULED_DELAY, 5000);
    log.info("延迟发送-开始");
    jmsMessagingTemplate.convertAndSend(delayQueue, msg, headers);
    log.info("延迟发送-结束");
    return "send delay queue success";
}
```

消费者代码和普通队列方式无异，如下：

```java
@JmsListener(destination = "delay-queue-test", containerFactory = "queueListener")
public void receiveDelayQueueTest(ActiveMQMessage message, Session session) throws JMSException,
JsonProcessingException {
    log.info("receiveDelayQueueTest");
    String text = null;
    if (message instanceof TextMessage) {
        TextMessage textMessage = (TextMessage) message;
        text = textMessage.getText();
        log.info("delayQueue接收到消息：{}", text);
        ObjectMapper objectMapper = new ObjectMapper();
        Student student = objectMapper.readValue(text, Student.class);
        sleep(2000);
        log.info("delayQueue接收到student：{}", student);
        // 手动确认
        message.acknowledge();
    }
}
```

## 7、死信队列

### 7.1、默认死信队列 ActiveMQ.DLQ

DLQ-死信队列 (Dead Letter Queue) 用来保存处理失败或者过期的消息。默认的死信队列为 `ActiveMQ.DLQ` ，为了演示死信队列，我在消费者监听类中增加一个监听 `queue-test` 队列的方法 `receiveQueueTest3()`，当轮到该方法消费消息的时候，调用 `session.recover()` 方法让消息重发，默认重发 6 次后，消息就会进入死信队列中。消息生产者方法见 5.1 中的消息生产者。`receiveQueueTest3()` 方法代码如下：

```java
/**
 * queue-test普通队列：消费者3，专门用来让消息重发，从而进入死信队列
 */
@JmsListener(destination = "queue-test", containerFactory = "queueListener")
public void receiveQueueTest3(ActiveMQMessage message, Session session) throws JMSException,
JsonProcessingException {
    log.info("receiveQueueTest:3");
    String text = null;
    if (message instanceof TextMessage) {
        TextMessage textMessage = (TextMessage) message;
        text = textMessage.getText();
        log.info("queue3接收到消息：{}", text);
        ObjectMapper objectMapper = new ObjectMapper();
        Student student = objectMapper.readValue(text, Student.class);
        // 该消费者用来让消息重发，从而进入死信队列
        session.recover();
        if (true) {
            return;
        }
        sleep(5000);
        log.info("queue3接收到student：{}", student);
        // 手动确认
        message.acknowledge();
    }
}
```

当轮到该消费者消费消息的时候，由于调用了 `session.recover()` ，消息会进行重发 6 次之后就不再重发。这个时候观察 ActiveMQ 的管理界面 http://192.168.237.23:8161/admin/queues.jsp 的 `ActiveMQ.DLQ` 队列，由于没有消费者监听 `ActiveMQ.DLQ` ，因此该队列会显示有 1 条待处理信息，1 条入队，0 条出队。

### 7.2、自定义死信队列名称

项目中通常会让自定义死信队列名称，且每个队列不共用一个死信队列，因此我们可以修改 ActiveMQ 安装目录下的 `conf/activemq.xml` 文件自定义名称。

打开activemq.xml 文件，找到 `` 标签，在 `` 里面增加一个 `` ，增加代码如下所示：配置死信队列前缀为 `DLQ.` （自定义）

```xml
<policyEntry queue=">">
    <deadLetterStrategy>
        <individualDeadLetterStrategy queuePrefix="DLQ."
                                      useQueueForQueueMessages="true"/>
    </deadLetterStrategy>
</policyEntry>
```

具体如下图片所示：

增加一个消费者监听之前的 `queue-test` 队列产生的死信。

```java
/**
 * queue-test 产生的死信队列
 */
@JmsListener(destination = "DLQ.queue-test")
public void receiveDLQQueueTest(ActiveMQMessage message, Session session) throws JMSException,
JsonProcessingException {
    log.info("DLQ.queue-test");
    if (message instanceof TextMessage) {
        TextMessage textMessage = (TextMessage) message;
        String text = textMessage.getText();
        ObjectMapper objectMapper = new ObjectMapper();
        Student student = objectMapper.readValue(text, Student.class);
        log.info("DLQ.queue-test接收到消息：{}", student);
    }
}
```

再次测试发送 `queue-test` 队列，当轮到 7.1 中的消费者收到消息的时候，会进行消息重发 6 次，之后消息会进入我们自定义的 `DLQ.queue-test` 队列中，然后消息就会被我们写的 `receiveDLQQueueTest` 方法所收到。

### 7.3、丢弃某个死信队列

丢弃某个指定死信队列，即让处理失败或者过期的消息直接丢弃掉，不要进入死信队列。还是需要配置 ActiveMQ 安装目录下的 `conf/activemq.xml` 文件。打开 activemq.xml 文件，找到 `` 标签，在 `` 下面添加如下代码：

```xml
<plugins>
    <!-- 丢弃指定死信队列 -->
    <discardingDLQBrokerPlugin dropOnly="DLQ.queue-test3" reportInterval="1000" />
</plugins>
```

图片示例如下：

再次测试发送 `queue-test` 队列，当轮到 7.1 中的消费者收到消息的时候，会进行消息重发 6 次，之后消息就丢弃了，没有进入 `DLQ.queue-test` 或者默认的 `ActiveMQ.DLQ` 死信队列中。

完整代码：[https://gitee.com/caiworld/note-demo/tree/master/activemq-demo](https://gitee.com/caiworld/note-demo/tree/master/activemq-demo)

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
