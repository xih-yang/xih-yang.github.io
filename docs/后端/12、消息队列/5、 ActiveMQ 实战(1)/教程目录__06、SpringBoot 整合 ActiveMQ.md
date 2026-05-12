# 06、SpringBoot 整合 ActiveMQ
- 来源：https://ddkk.com/zhuanlan/mq/activemq/1/6.html
- 分类：消息队列
- 分组：教程目录
本文主要讲解SpringBoot整合ActiveMQ，文末附源码地址

## 1、添加依赖

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-activemq</artifactId>
</dependency>
```

## 2、配置文件

```sh
server.port=8821
logging.level.root=warn
logging.level.com.example=debug
#ActiveMQ通讯地址
spring.activemq.broker-url=tcp://47.xxx.xx.xx:61616
#用户名
spring.activemq.user=admin
#密码
spring.activemq.password=admin
#是否启用内存模式（就是不安装MQ，项目启动时同时启动一个MQ实例）
spring.activemq.in-memory=false
#信任所有的包
spring.activemq.packages.trust-all=true
#是否替换默认的连接池，使用其它ActiveMQ的连接池需引入的依赖
spring.activemq.pool.enabled=false
```

## 2、队列配置

```java
/**
 * 消息队列配置
 */
@Configuration
public class ActiveMQConfig {
  /**
   * 声明普通队列
   */
  @Bean
  public Queue queue() {
    return new ActiveMQQueue("springboot.queue");
  }
  /**
   * 声明延时队列
   */
  @Bean
  public Queue delayQueue() {
    return new ActiveMQQueue("springboot.delay.queue");
  }
  /**
   * 声明订阅模式-广播队列
   */
  @Bean
  public Topic topic() {
    return new ActiveMQTopic("springboot.topic");
  }
}
```

## 3、核心配置

```java
/**
 * 消息队列核心配置
 */
@EnableJms
@Configuration
public class ActiveMQCoreConfig {
  @Value("${spring.activemq.broker-url}")
  private String brokerUrl;
  @Value("${spring.activemq.user}")
  private String username;
  @Value("${spring.activemq.password}")
  private String password;
  /**
   * 消息重发策略配置
   */
  @Bean
  public RedeliveryPolicy redeliveryPolicy() {
    RedeliveryPolicy redeliveryPolicy = new RedeliveryPolicy();
    //是否在每次尝试重新发送失败后,增长这个等待时间
    redeliveryPolicy.setUseExponentialBackOff(true);
    //重发次数,默认为6次-设置为10次
    redeliveryPolicy.setMaximumRedeliveries(10);
    //重发时间间隔单位毫秒,默认为1秒
    redeliveryPolicy.setInitialRedeliveryDelay(1000L);
    //第一次失败后重新发送之前等待500毫秒,第二次失败再等待500 * 2毫秒
    redeliveryPolicy.setBackOffMultiplier(2);
    //是否避免消息碰撞
    redeliveryPolicy.setUseCollisionAvoidance(false);
    //设置重发最大拖延时间-1 
    redeliveryPolicy.setMaximumRedeliveryDelay(-1);
    return redeliveryPolicy;
  }
  /**
   * 消息工厂配置
   *
   * @param redeliveryPolicy
   */
  @Bean
  public ActiveMQConnectionFactory activeMqConnectionFactory(@Qualifier("redeliveryPolicy") RedeliveryPolicy redeliveryPolicy) {
    ActiveMQConnectionFactory activeMqConnectionFactory = new ActiveMQConnectionFactory(username, password, brokerUrl);
    activeMqConnectionFactory.setRedeliveryPolicy(redeliveryPolicy);
    return activeMqConnectionFactory;
  }
  @Bean(name = "jmsTemplate")
  public JmsTemplate jmsTemplate(@Qualifier("activeMqConnectionFactory") ActiveMQConnectionFactory activeMqConnectionFactory) {
    JmsTemplate jmsTemplate = new JmsTemplate();
    jmsTemplate.setConnectionFactory(activeMqConnectionFactory);
    //进行持久化配置 1表示非持久化，2表示持久化
    jmsTemplate.setDeliveryMode(2);
    //客户端签收模式
    jmsTemplate.setSessionAcknowledgeMode(ACKNOWLEDGE_MODE);
    return jmsTemplate;
  }
 /**
   * 默认只配置queue类型消息，
   * 如果要使用topic类型的消息，则需要配置该bean
   *
   * @return
   */
  @Bean(name = "jmsTopicListener")
  public JmsListenerContainerFactory<?> jmsTopicListener(@Qualifier("activeMqConnectionFactory") ActiveMQConnectionFactory activeMqConnectionFactory) {
    DefaultJmsListenerContainerFactory factory = new DefaultJmsListenerContainerFactory();
    factory.setConnectionFactory(activeMqConnectionFactory);
    //这里必须设置为true，false则表示是queue类型
    factory.setPubSubDomain(true);
    //重连间隔时间
    factory.setRecoveryInterval(1000L);
    return factory;
  }
}
```

## 4、消息生产者

```java
/**
 * 消息生产者
 */
@Slf4j
@Component
public class Producer {
  @Autowired
  private JmsTemplate jmsTemplate;
  /**
   * 发送消息
   *
   * @param destination 发送到的队列
   * @param message     待发送的消息
   */
  public <T extends Serializable> void send(Destination destination, T message) {
    jmsTemplate.convertAndSend(destination, message);
  }
  /**
   * 延时发送
   *
   * @param destination 发送的队列
   * @param data        发送的消息
   * @param time        延迟时间单号毫秒
   */
  public <T extends Serializable> void delaySend(Destination destination, T data, Long time) {
    Session session = null;
    Connection connection = null;
    MessageProducer producer = null;
    // 获取连接工厂
    ConnectionFactory connectionFactory = jmsTemplate.getConnectionFactory();
    try {
      // 获取连接
      connection = connectionFactory.createConnection();
      connection.start();
      // 获取session，true开启事务，false关闭事务
      session = connection.createSession(Boolean.TRUE, Session.AUTO_ACKNOWLEDGE);
      // 创建一个消息队列
      producer = session.createProducer(destination);
      producer.setDeliveryMode(JmsProperties.DeliveryMode.PERSISTENT.getValue());
      ObjectMessage message = session.createObjectMessage(data);
      //设置延迟时间
      message.setLongProperty(ScheduledMessage.AMQ_SCHEDULED_DELAY, time);
      // 发送消息
      producer.send(message);
      session.commit();
      log.info("[ 延时消息 ] >> 发送完毕 data:{}", data);
    } catch (Exception e) {
      log.error("[ 发送延时消息 ] 异常 >> data:{}", data, e);
    } finally {
      try {
        if (producer != null) {
          producer.close();
        }
        if (session != null) {
          session.close();
        }
        if (connection != null) {
          connection.close();
        }
      } catch (Exception e) {
        log.error("[ 发送延时消息 ] 关闭资源异常 >> data{}", data, e);
      }
    }
  }
}
```

## 5、模拟生产消息

```java
/**
 * 消息队列-消息生成接口
 */
@Slf4j
@RestController
public class ProducerContoller {
  @Autowired
  private Producer producer;
  @Autowired
  private Queue normalQueue;
  @Autowired
  private Queue delayQueue;
  @Autowired
  private Topic topic;
  /**
   * 发送queue类型消息
   *
   * @param msg
   */
  @GetMapping("/queue")
  public void sendQueueMsg(String msg) {
    log.info("[ 普通消息发送 ] >> msg:{}, 发送时间：{}", msg, DateUtil.now());
    producer.send(normalQueue, msg);
  }
  /**
   * 发送延时类型消息
   *
   * @param msg
   */
  @GetMapping("/delayQueue")
  public void sendDelayQueueMsg(String msg) {
    log.info("[ 延时消息发送 ] >> msg:{}, 发送时间：{}", msg, DateUtil.now());
    producer.delaySend(delayQueue, msg, 1000L * 10);
  }
  /**
   * 发送topic类型消息
   *
   * @param msg
   */
  @GetMapping("/topic")
  public void sendTopicMsg(String msg) {
    log.info("[ topic消息发送 ] >> msg:{}, 发送时间：{}", msg, DateUtil.now());
    producer.send(topic, msg);
  }
}
```

## 6、普通消息监听

```java
/**
 * 消息监听
 */
@Slf4j
@Component
public class NormalQueueListener {
  @JmsListener(destination = "springboot.queue")
  public void receiveMsg(String message) {
    Thread thread = Thread.currentThread();
    log.info("[ 普通消息消费 ] >> 线程ID:{},线程名称:{},消息内容:{}", thread.getId(), thread.getName(), message);
  }
}   
```

测试实例

## 7、延时消息监听

注：延时队列需要配置支持，详见文末附录

```java
/**
 * 延时队列-消费者监听
 */
@Slf4j
@Component
public class DelayQueueListener {
  @JmsListener(destination = "springboot.delay.queue")
  public void receiveMsg(String message) {
    Thread thread = Thread.currentThread();
    log.info("[ 延时消息消费 ] >> 线程ID:{},线程名称:{},消息内容:{},消费时间:{}", thread.getId(), thread.getName(), message, DateUtil.now());
  }
}
```

测试实例

## 8、广播消息监听

这里为了测试广播效果，初始化了2个监听

```java
/**
 * 广播模式-消息监听
 */
@Slf4j
@Component
public class TopicQueueListener {
  @JmsListener(destination = "springboot.topic", containerFactory = "jmsTopicListener")
  public void receiveMsg1(String message) {
    Thread thread = Thread.currentThread();
    log.info("[ Topic消息消费01 ] >> 线程ID:{},线程名称:{},消息内容:{},消费时间:{}", thread.getId(), thread.getName(), message, DateUtil.now());
  }
  @JmsListener(destination = "springboot.topic", containerFactory = "jmsTopicListener")
  public void receiveMsg2(String message) {
    Thread thread = Thread.currentThread();
    log.info("[ Topic消息消费02 ] >> 线程ID:{},线程名称:{},消息内容:{},消费时间:{}", thread.getId(), thread.getName(), message, DateUtil.now());
  }
}
```

测试实例

## 9、多线程集群消费

在流量较大的业务下，消息容易堆积，这里示例一下普通队列消息的多线程消费

在配置类ActiveMQCoreConfig 中添加如下配置，可自定义线程池

```java
/**
* 普通队列消息监听
* @param activeMqConnectionFactory
* @return
*/
@Bean(name = "jmsQueue2Listener")
public JmsListenerContainerFactory<?> jmsQueue2Listener(@Qualifier("activeMqConnectionFactory") ActiveMQConnectionFactory activeMqConnectionFactory) {
DefaultJmsListenerContainerFactory factory = new DefaultJmsListenerContainerFactory();
factory.setPubSubDomain(false);
factory.setConnectionFactory(activeMqConnectionFactory);
//重连间隔时间
factory.setRecoveryInterval(1000L);
factory.setSessionAcknowledgeMode(4);
//连接数
factory.setConcurrency("5-10");
//指定任务线程池
factory.setTaskExecutor(new ThreadPoolExecutor(5, 10, 1, TimeUnit.MINUTES,
  new LinkedBlockingQueue<>(100), new ThreadPoolExecutor.CallerRunsPolicy()));
return factory;
}
```

监听中指定containerFactory = “jmsQueueListener”

```java
/***
* 普通消息-多线程消费实例
*
* @param message
*/
@JmsListener(destination = "springboot.queue2", containerFactory = "jmsQueue2Listener")
public void receiveMsg2(String message) {
Thread thread = Thread.currentThread();
log.info("[ 普通消息多线程消费 ] >> 线程ID:{},线程名称:{},消息内容:{}", thread.getId(), thread.getName(), message);
}
```

测试实例

多点击几次，会发现，是不同的线程消费的。

## 10、异常重试的监听写法

在执行失败后往往需要重试，如果不配置，则默认进入了私信队列

```java
/**
* 消息监听
*
* @throws Exception
*/
@JmsListener(destination = "springboot.queue3", containerFactory = "jmsQueue3Listener")
public void listenQueue(final TextMessage message, Session session) throws JMSException {
try {
  Thread thread = Thread.currentThread();
  log.info("********** 华丽的分割线 **********");
  log.info("[ 普通消息消费-完善案例 ] >> 当前时间:{}", DateUtil.format(new Date(), "yyyy-MM-dd HH:mm:ss.SSS"));
  log.info("[ 普通消息消费-完善案例 ] >> 消息ID:{},消息内容:{}", message.getJMSMessageID(), message.getText());
  log.info("[ 普通消息消费-完善案例 ] >> 线程ID:{},线程名称:{}", thread.getId(), thread.getName());
  log.info("********** 华丽的分割线 **********");
  log.info("");
  //使用手动签收模式，需要手动的调用，如果不在catch中调用session.recover()消息只会在重启服务后重发
  message.acknowledge();
  log.info("[ 普通消息消费-完善案例 ] >> 消费成功了 , 消息ID:{},消息内容:{}", message.getJMSMessageID(), message.getText());
  log.info("********** 华丽的分割线-消费成功了 **********");
  log.info("");
} catch (Exception e) {
  log.info("[ 普通消息消费-完善案例 ] >> 消费异常了 , 消息ID:{},消息内容:{}",
    message.getJMSMessageID(), message.getText(), e);
  //消息重试
  session.recover();
}
}
```

## 11、本文附录

### 1、延时队列支持配置

ActiveMq生产者提供两个发送消息的方法，一个是即时发送消息，一个是延时发送消息。延时发送消息需要手动修改activemq目录conf下的activemq.xml配置文件，开启延时，设置schedulerSupport=“true”，然后重启activemq即可

### 2、消息数据模型

JMS定义了五种不同的消息格式，可以根据实际情况选则使用。本实例中发送的都是字符串，所以仅使用到了TextMessage

- StreamMessage – Java原始值的数据流
- MapMessage–一套名称-值对
- TextMessage–一个字符串对象
- **ObjectMessage–一个序列化的 Java对象**
- BytesMessage–一个未解释字节的数据流

### 3、源码地址

[传送门](https://github.com/xqiangme/spring-boot-example/tree/master/spring-boot-activemq)

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
