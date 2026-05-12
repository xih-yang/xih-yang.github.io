# 10、SpringBoot 整合 ActiveMQ 自动重连配置
- 来源：https://ddkk.com/zhuanlan/mq/activemq/1/10.html
- 分类：消息队列
- 分组：教程目录
启动类添加注解：@EnableJms

## 1、pom

```java
 <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-activemq</artifactId>
    <version>1.5.7.RELEASE</version>
</dependency>
<dependency>
    <groupId>org.apache.activemq</groupId>
    <artifactId>activemq-pool</artifactId>
</dependency>
```

## 2、application.properties

```sh
activemq.url=tcp://127.0.0.1:61616
activemq.user=admin
activemq.password=admin
```

## 3、初始化对象配置

```java
@Configuration
public class BeanConfig {
    @Value("${activemq.url}")
    private String ActiveMQ_URL;
    @Value("${activemq.user}")
    private String ActiveMQ_USER;
    @Value("${activemq.password}")
    private String ActiveMQ_PASSWORD;
/**
   @Bean
    public ConnectionFactory connectionFactory() {
        ActiveMQConnectionFactory connectionFactory = new ActiveMQConnectionFactory();
        connectionFactory.setBrokerURL(ActiveMQ_URL);
        connectionFactory.setUserName(ActiveMQ_USER);
        connectionFactory.setPassword(ActiveMQ_PASSWORD);
        return connectionFactory;
    } */
   /**
     * 参考介绍:https://www.cnblogs.com/xingzc/p/5943165.html
     * @return 解决activeMq 一直创建连接的问题
     */
    @Bean("connectionFactory")
    public CachingConnectionFactory connectionFactory(){
        ActiveMQConnectionFactory amqFactory = new ActiveMQConnectionFactory(ActiveMQ_USER, ActiveMQ_PASSWORD, ActiveMQ_URL);
        CachingConnectionFactory ccf = new CachingConnectionFactory(amqFactory);
        ccf.setSessionCacheSize(50);
        ccf.setCacheProducers(true);
        return ccf;
    }
    @Bean
    public ConvertJmsTemplate jmsTemplate(ConnectionFactory connectionFactory) {
        ConvertJmsTemplate jmsTemplate = new ConvertJmsTemplate();
        jmsTemplate.setDeliveryMode(DeliveryMode.NON_PERSISTENT);//进行持久化配置 1表示非持久化，2表示持久化
        jmsTemplate.setConnectionFactory(connectionFactory);
        jmsTemplate.setSessionAcknowledgeMode(Session.AUTO_ACKNOWLEDGE);//客户端签收模式
        return jmsTemplate;
    }
    @Bean
    public JmsMessagingTemplate jmsMessageTemplate(ConnectionFactory connectionFactory) {
        return new JmsMessagingTemplate(connectionFactory);
    }
    // 自动设置JMS重连JmsListenerContainerFactory
    @Bean
    public JmsListenerContainerFactory jmsListenerContainerFactory(ConnectionFactory connectionFactory) {
        DefaultJmsListenerContainerFactory jmsListenerFactory = new DefaultJmsListenerContainerFactory();
        jmsListenerFactory.setPubSubDomain(false);
        jmsListenerFactory.setConnectionFactory(connectionFactory);
        return jmsListenerFactory;
    }
    @Bean
    public Session createConnSession(ConnectionFactory connectionFactory) throws JMSException {
        Connection conn = connectionFactory.createConnection();
        Session session = (ActiveMQSession)conn.createSession(false, Session.AUTO_ACKNOWLEDGE);
        conn.start();
        return session;
    }
```

- ConvertJmsTemplate.java
- 解决生产者producer多次重连断开的问题

```java
import org.apache.activemq.command.ActiveMQQueue;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.jms.support.JmsUtils;
import javax.jms.MessageProducer;
import javax.jms.Session;
import java.util.Objects;
public class ConvertJmsTemplate extends JmsTemplate {
    private Logger logger = LoggerFactory.getLogger(ConvertJmsTemplate.class);
    @Autowired
    private Session session;
    private MessageProducer producer;
    public void sendQueue(ActiveMQQueue queue, final Object message) {
        try {
            if (Objects.isNull(producer)) {
                producer = super.createProducer(session, queue);
            }
            doSend(producer, super.getMessageConverter().toMessage(message, session));
            // Check commit - avoid commit call within a JTA transaction.
            if (session.getTransacted() && isSessionLocallyTransacted(session)) {
                // Transacted session created by this template -> commit.
                JmsUtils.commitIfNecessary(session);
            }
        } catch (Exception e) {
            logger.error("error {}", e);
        }
    }
}
```

## 4、生产者与消费者

@JmsListener：注解默认支持自动重连机制

- 消费者

```java
@Component
public class Consumer {
    /*
     * 监听和读取消息
     */
    @JmsListener(destination = "active.topic")
    public void readActiveTopic(String message) {
        System.out.println("接受到2：" + message);
    }
}
```

- 生产者

```java
@RestController
public class ProducerController {
	@Autowired
	private JmsMessagingTemplate jmsMessagingTemplate;
	@Autowired
	private Queue queue;
	/*
	 * 消息生产者
	 */
	@RequestMapping("/sendmsg")
	public void sendmsg(String msg) {
		// 指定消息发送的目的地及内容
		this.jmsMessagingTemplate.convertAndSend(this.queue, msg);
	}
}
```

## 5、扩展

### 5.1、自定义动态监听器#

**1、** ConnectionDefaultListener；

```java
public class ConnectionDefaultListener {
    private Logger logger = LoggerFactory.getLogger(ConnectionDefaultListener.class);
    // 消费者
    private MessageConsumer messageConsumer;
    // 连接工厂
    ConnectionFactory connectionFactory;
    // 连接对象
    private Connection conn;
    // session
    private Session session;
    private Boolean isRunning = true;
    // 连接信息
    private ConnectMqtt connectMqtt;
    // 监听器
    private MessageListener messageListener;
    // ConnectMqtt  业务参数
    public ConnectionDefaultListener(ConnectionFactory connectionFactory, ConnectMqtt connectMqtt) throws Exception {
        this.connectMqtt = connectMqtt;
        this.connectionFactory = connectionFactory;
        this.messageListener = new MyJmsListenerConsumer(connectMqtt);
        createConnect();
        createConnSession();
    }
    /**
     * 创建新连接
     */
    private void createConnect() throws Exception {
        this.conn = connectionFactory.createConnection();
        this.conn.start();
    }
    public void start() throws Exception {
        // 注册messageConsumer
        registerMessageConsumer();
        // 5S执行一次
        new JmsListenerThread().registerConnectionDefaultListener(this);
    }
    /**
     * 注册MessageConsumer
     */
    private void registerMessageConsumer() {
        try {
            // 设置监听的队列名称
            Destination destination = this.session.createQueue(connectMqtt.getQueue());
            // 创建一个消费者
            MessageConsumer consumer = this.session.createConsumer(destination);
            addMessageConsumer(consumer);
            this.isRunning = Boolean.TRUE;
            logger.info("activeMq create success, destination: {}", connectMqtt.getQueue());
        } catch (Exception e) {
            logger.error("jms监听器创建失败Exception: {}", e);
            logger.error("jms监听器创建失败: {}", connectMqtt.getQueue());
        }
    }
    /**
     * 添加客户端
     *
     * @param consumer
     */
    public void addMessageConsumer(MessageConsumer consumer) {
        if (this.messageConsumer != null) {
            // 手动清除对象
            this.messageConsumer = null;
        }
        this.messageConsumer = consumer;
    }
    /**
     * 创建session
     *
     * @return
     * @throws JMSException
     */
    public void createConnSession() throws JMSException {
        Session session = this.conn.createSession(false, Session.AUTO_ACKNOWLEDGE);
        this.session = session;
    }
    /**
     * 校验是否建立连接
     * 没连接抛出异常
     *
     * @param timeout
     * @return
     * @throws JMSException
     */
    protected Message receiveFromConsumer(long timeout) throws JMSException {
        if (timeout > 0L) {
            return this.messageConsumer.receive(timeout);
        } else {
            return timeout < 0L ? this.messageConsumer.receiveNoWait() : this.messageConsumer.receive();
        }
    }
    /**
     * 消费消息
     *
     * @param message
     */
    public void messageInvoke(Message message) {
        try {
            this.messageListener.onMessage(message);
        } catch (Exception e) {
            logger.error("messageInvoke error {}", e);
        }
    }
    /**
     * 重连逻辑
     */
    public synchronized void releaseConnection() {
        if (isRunning) {
            return;
        }
        try {
            close();
            // 创建连接
            createConnect();
            // 创建session
            createConnSession();
            // 创建队列
            registerMessageConsumer();
            this.isRunning = Boolean.TRUE;
        } catch (Exception e) {
            logger.error("jms releaseConnect error {}", e);
        }
    }
    // 关闭 连接
    public void close() {
        try {
            if (null != this.messageConsumer) {
                this.messageConsumer.close();
            }
            if (null != this.session) {
                session.close();
            }
            if (null != this.conn) {
                this.conn.close();
            }
        } catch (Exception e) {
            logger.error("close error:{}", e);
        }
    }
}
```

**1、** ；

```java
/**
 * 自定义JMS监听
 */
public class MyJmsListenerConsumer implements MessageListener {
    private Logger logger = LoggerFactory.getLogger(MyJmsListenerConsumer.class);
    private ConnectMqtt connectMqtt;
    public MyJmsListenerConsumer(ConnectMqtt connectMqtt) {
        this.connectMqtt = connectMqtt;
    }
    @Override
    public void onMessage(Message message) {
        try {
            //接收文本消息
            if (message instanceof TextMessage) {
                TextMessage text = (TextMessage) message;
                logger.info("ActiveMq 接收消息: {}", text.getText());
                ...业务逻辑
                logger.info("process end");
            } else {
                logger.warn("消息不支持接受");
            }
        } catch (Exception e) {
            // 报错日志;
            logger.error("error: {}", e.getMessage());
        }
    }
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
