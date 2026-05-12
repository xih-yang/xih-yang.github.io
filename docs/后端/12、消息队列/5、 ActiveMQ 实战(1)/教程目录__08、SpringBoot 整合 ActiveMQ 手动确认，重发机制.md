# 08、SpringBoot 整合 ActiveMQ 手动确认，重发机制
- 来源：https://ddkk.com/zhuanlan/mq/activemq/1/8.html
- 分类：消息队列
- 分组：教程目录
## 1、SpringBoot项目搭建；

可本地启动activemq项目，直接官网下载后，启动即可。

SpringBoot项目搭建两个模块（zj-producer,zj-consumer），分别模拟生产值和消费者；

## 2、队列消息（点对点模式），主题订阅模式；

队列消息是点对点模式，生产方生产一条消息只能给一个消费方消费。

主题订阅模式，生产方的一条消息可同时下发给多个订阅该主题的消费方去使用和消费。

## 3、消息手动确认；

消息手动确认，主要用于消费方是否由于异常等原因，未处理完该消息；

因此只有手动确认后，给出回馈消息，该消息才确认消费完成，否则consumer重启后会重新消费该消息。控制面板中依旧存在Messages Enqueued 中。

activemq的消息确认机制,本文中使用的是通过INDIVIDUAL_ACKNOWLEDGE = 4， 单条消息确认，是 activemq 独有。

## 4、消息重发；

消息重发机制，主要用户消费方是否由于异常等原因，未处理完该消息，需要在一定时间后重发该消息，继续处理。

消息重发可通过**RedeliveryPolicy****，定义各种参数，如消息重发的次数，间隔时间等；**

本文只简单介绍activemq使用以上四点时的关键步骤，如需进一步了解可查阅更多资料。

给出主要实现代码

### 1、 配置文件（zj-producer,zj-consumer模块项目的配置文件相同即可）

```sh
#ActiveMQ
##基本配置
spring.activemq.broker-url=tcp://localhost:61616
spring.activemq.user=admin
spring.activemq.password=admin
## 集群配置
#spring.activemq.broker-url=failover:(tcp://192.168.1.122:61616,tcp://192.168.1.122:61617)
## 线程池配置
spring.activemq.pool.enabled=true
spring.activemq.pool.max-connections=50
## 开启支持发布订阅模式，默认是点对点模式
#spring.jms.pub-sub-domain=true
#避免端口冲突
server.port=8071
```

其中spring.jms.pub-sub-domain参数如果设置为true,则开启发布订阅模式，无法使用点对点队列模式。由于在代码中需要同时使用两种模式，故此处配置去掉。

### 2、生产者（zj-producer）

1、定义主题和队列对象给spring管理，注入使用

```java
package zj.test.zjproducer;
import org.apache.activemq.command.ActiveMQQueue;
import org.apache.activemq.command.ActiveMQTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import javax.jms.Queue;
import javax.jms.Topic;
@Configuration
public class JmsConfig {
    @Bean   //将主题对象交给spring管理
    public Topic topic(){
        return new ActiveMQTopic("zj.topic");
    }
    @Bean   //交给spring管理，方便后续注入
    public Queue queue(){
        //common.queue默认的消息队列
        return new ActiveMQQueue("zj.queue");
    }
}
```

2、消息生产方法类

```java
package zj.test.zjproducer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jms.core.JmsMessagingTemplate;
import org.springframework.stereotype.Service;
import javax.jms.Destination;
import javax.jms.Queue;
import javax.jms.Topic;
@Service
public class JmsProduceService {
    @Autowired
    private Queue queue;
    @Autowired
    private JmsMessagingTemplate jmsTemplate; //用来发送消息到broker的对象
    //发送消息，destination是发送到的队列，message是待发送的消息
    public void sendMessage(Destination destination, String message) {
        jmsTemplate.convertAndSend(destination, message);
    }
    //发送消息，destination是发送到的队列，message是待发送的消息
    public void sendMessage(final String message) {
        jmsTemplate.convertAndSend(this.queue,message);
    }
    //=======发布订阅相关代码=========
    @Autowired
    private Topic topic;
    public void publish(String msg) {
        this.jmsTemplate.convertAndSend(this.topic, msg);
    }
}
```

3、测试发送消息和发布主题消息

```java
package zj.test.zjproducer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
@RestController
public class TestController {
    @Autowired
    JmsProduceService produceService;
    @RequestMapping("/producer")
    @ResponseBody
    public void send() {
        String msgString = System.currentTimeMillis()+"zjj";
        produceService.sendMessage(msgString);
        System.out.println("点对点通讯，msg"+msgString);
    }
    @RequestMapping("/producerTopic")
    @ResponseBody
    public void producerTopic() {
        String msgString = System.currentTimeMillis()+"zjj";
        produceService.publish(msgString);
        System.out.println("点对点通讯，msg"+msgString);
    }
}
```

### 3、消费者（zj-consumer）

**1、** 上面提到，同时支持点对点和主题订阅模式因此还需要自定义topicListenerContainerFactory和queueListenerContainerFactory，如下；

**2、** 支持手动确认接收消息，此处为方便大家查看不同的配置方式，定义用订阅主题方式不用手动确认，而队列模式支持ack手动确认想使用那种方式都可以，主要是定义ContainerFactory的配置中这一项；

```java
factory.setSessionTransacted(false);
factory.setSessionAcknowledgeMode(4);
```

这里也普及下activemq的消息确认机制：

AUTO_ACKNOWLEDGE = 1 自动确认

CLIENT_ACKNOWLEDGE = 2 客户端手动确认

DUPS_OK_ACKNOWLEDGE = 3 自动批量确认

SESSION_TRANSACTED = 0 事务提交并确认

INDIVIDUAL_ACKNOWLEDGE = 4 单条消息确认 activemq 独有

ACK模式描述了Consumer与broker确认消息的方式(时机),比如当消息被Consumer接收之后,Consumer将在何时确认消息。

对于broker而言，只有接收到ACK指令,才会认为消息被正确的接收或者处理成功了,通过ACK，可以在consumer（/producer）

与Broker之间建立一种简单的“担保”机制.

手动确认和单条消息确认需要手动的在客户端调用message.acknowledge();

**3、** 支持消息未确认重发机制，即在**jmsConnectionFactory**中定义**RedeliveryPolicy**，具体实现如下；

1、消息同时支持两种模式和手动确认机制的配置类

```java
package zj.test.zjconsumer;
import org.apache.activemq.ActiveMQConnection;
import org.apache.activemq.ActiveMQConnectionFactory;
import org.apache.activemq.RedeliveryPolicy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jms.config.DefaultJmsListenerContainerFactory;
import org.springframework.jms.config.JmsListenerContainerFactory;
import javax.jms.ConnectionFactory;
@Configuration
public class JmsTogetherConfig {
    @Value("${spring.activemq.broker-url}")
    private String activeMQURL;
    @Value("${spring.activemq.user}")
    private String userName;
    @Value("${spring.activemq.password}")
    private String password;
    /**
     * @title 发布-订阅
     */
    @Bean
    public JmsListenerContainerFactory<?> topicListenerContainerFactory(ConnectionFactory jmsConnectionFactory){
        DefaultJmsListenerContainerFactory factory = new DefaultJmsListenerContainerFactory();
        factory.setPubSubDomain(true);
        factory.setConnectionFactory(jmsConnectionFactory);
        return factory;
    }
    /**
     * @title 点对点
     */
    @Bean
    public JmsListenerContainerFactory<?> queueListenerContainerFactory(ConnectionFactory jmsConnectionFactory){
        DefaultJmsListenerContainerFactory factory = new DefaultJmsListenerContainerFactory();
        factory.setPubSubDomain(false);
        factory.setConnectionFactory(jmsConnectionFactory);
        factory.setSessionTransacted(false);
        factory.setSessionAcknowledgeMode(4);
        return factory;
    }
    @Bean
    public ConnectionFactory jmsConnectionFactory(){
        ActiveMQConnectionFactory connectionFactory = new ActiveMQConnectionFactory();
        connectionFactory.setBrokerURL(activeMQURL);
        connectionFactory.setUserName(userName);
        connectionFactory.setPassword(password);
        connectionFactory.setTrustAllPackages(true);
        connectionFactory.setMaxThreadPoolSize(ActiveMQConnection.DEFAULT_THREAD_POOL_SIZE);
        RedeliveryPolicy redeliveryPolicy = new RedeliveryPolicy();
        //定义ReDelivery(重发机制)机制 ，重发时间间隔是100毫秒，最大重发次数是3次
        //是否在每次尝试重新发送失败后,增长这个等待时间
        redeliveryPolicy.setUseExponentialBackOff(true);
        //重发次数,默认为6次   这里设置为1次
        redeliveryPolicy.setMaximumRedeliveries(2);
        //重发时间间隔,默认为1秒
        redeliveryPolicy.setInitialRedeliveryDelay(5000);
        //第一次失败后重新发送之前等待500毫秒,第二次失败再等待500 * 2毫秒,这里的2就是value
        redeliveryPolicy.setBackOffMultiplier(2);
        //最大传送延迟，只在useExponentialBackOff为true时有效（V5.5），假设首次重连间隔为10ms，倍数为2，那么第
        //二次重连时间间隔为 20ms，第三次重连时间间隔为40ms，当重连时间间隔大的最大重连时间间隔时，以后每次重连时间间隔都为最大重连时间间隔。
        redeliveryPolicy.setMaximumRedeliveryDelay(1000);
        connectionFactory.setRedeliveryPolicy(redeliveryPolicy);
        return connectionFactory;
    }
}
```

2、队列消费方法

```java
package zj.test.zjconsumer;
import org.springframework.jms.annotation.JmsListener;
import org.springframework.stereotype.Component;
import javax.jms.JMSException;
import javax.jms.Message;
import javax.jms.Session;
import javax.jms.TextMessage;
@Component
public class QueueConsumer {
	@JmsListener(destination="zj.queue", containerFactory = "queueListenerContainerFactory")
	public void receive3(Message message, Session session) throws JMSException {
		TextMessage textmessage = (TextMessage)message;
		System.out.println("queue 消费者:receive3="+ textmessage.getText());
		try {
			if (textmessage.getText().contains("zj")) {
				throw new JMSException("故意抛出的异常");
			}
			message.acknowledge();
		} catch (JMSException e) {
			System.out.println(String.format("触发重发机制msg = %s",textmessage.getText()));
			session.recover();
		}
	}
}
```

3、两个主题消费

```java
package zj.test.zjconsumer;
import org.springframework.jms.annotation.JmsListener;
import org.springframework.stereotype.Component;
@Component
public class TopicConsumer {
	@JmsListener(destination="zj.topic", containerFactory = "topicListenerContainerFactory")
	public void receive1(String text){
		System.out.println("zj.topic 消费者:receive1="+text);
	}
	@JmsListener(destination="zj.topic", containerFactory = "topicListenerContainerFactory")
	public void receive2(String text){
		System.out.println("zj.topic 消费者:receive2="+text);
	}
}
```

通过生产者项目中发送测试请求，可以发现消费者接收消息的日志。

这里也给出完整项目工程地址，[https://download.csdn.net/download/zjcool2012/15417350](https://download.csdn.net/download/zjcool2012/15417350)

最后，理解原理再手动实践，才能固化为自己的知识。懂的越多，才发现自己知道的越少。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
