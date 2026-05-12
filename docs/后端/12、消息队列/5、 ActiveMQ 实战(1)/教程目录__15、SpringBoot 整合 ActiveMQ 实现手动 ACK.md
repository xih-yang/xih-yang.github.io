# 15、SpringBoot 整合 ActiveMQ 实现手动 ACK
- 来源：https://ddkk.com/zhuanlan/mq/activemq/1/15.html
- 分类：消息队列
- 分组：教程目录
看这篇文章之前，我相信大家已经有过ActiveMQ的基本知识，已经知道JmsTemplete、MessageListenerContainer、Connection、Session、ConnectionFactory等相关知识，在后续的介绍里，还是会简单的进行介绍，以便更好的了解。

## 1、项目搭建

和SpringBoot整合之前，我们先导入相关依赖包，如下所示：

```xml
<!--activemq依赖-->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-activemq</artifactId>
</dependency>
<!--lombok-->
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
</dependency>
<!--测试依赖包-->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
```

application.properties相关配置：

```sh
#配置ActiveMq
spring.activemq.broker-url=tcp://127.0.0.1:61616
spring.activemq.password=admin
spring.activemq.user=admin
#队列名称
activemq.first.queue=FIRST_QUEUE
```

下面我们先实现生产者和消费者：

JmsTemplate是消息处理核心类（线程安全），被用作消息的发送和接受，在发送或者是消费消息的同时也会对所需资源进行创建和释放。消息消费采用receive方式（同步、阻塞的），这里不做具体描述。关于消息的发送，常用的方式为send()以及convertAndSend()两种，其中send()发送需要我们自己指定消息格式，使用convertAndSend可以根据定义好的MessageConvert自动转换消息格式。大家请注意，在自定义JmsTemplate时，一定要指定ConnectionFactory，否则会出错。

生产者，使用JmsTemplate.convertAndSend()实现消息的发送。

```java
@Component
@Slf4j
public class FirstQueueProducer {
    @Resource
    private JmsTemplate jmsTemplate;
    /**
     * 用于发送消息到mq服务
     * @param destination queue或者topic
     * @param message 消息体
     */
    public void send(String destination, String message) {
        this.jmsTemplate.convertAndSend(destination,message);
        log.info("发送消息成功，发送方式：{}，发送内容：{}",destination,message);
    }
}
```

消费者，这里使用@JmsListener监听队列消息，大家请注意，如果我们不在@JmsListener中指定containerFactory，那么将使用默认配置，默认配置中Session是开启了事物的，即使我们设置了手动Ack也是无效的。在后续配置containerFactory的时候会给大家提到这个地方的坑。

```java
@Component
@Slf4j
public class FirstQueueConsumer {
    @JmsListener(destination = "${activemq.first.queue}")
    public void consumer(ActiveMQMessage message) throws JMSException {
        log.info("接受队列消息，内容为：{}",message.getStringProperty("value"));
    }
}
```

到目前为止，一个简单的生产和消费就实现了，大家可以测试一下，试试看。在测试的时候，如果不生效，请在启动类上添加@EnableJms。大家测试，或许应该发现了，当使用默认配置的时候，在不出现异常的情况下，消息会被成功消费，如果消费过程中出现异常，即使已经获取到消息也会消费失败，消息还是保留在消息队列中。这就是上述给大家说的，采用默认配置，Session是自动开启了事物的，如果消费成功（不出现任何异常的情况下）会提交事物，否则会回滚事物。

## 2、手动ACK

默认的配置已经能够满足大部分的业务，但是在某些情况下，我们可能需要手动确认消息的消费，这样我们就不得不修改默认的配置。在修改默认配置之前，我们先来了解一下ACK_MOD的几种类型：

```java
int AUTO_ACKNOWLEDGE = 1;自动确认
int CLIENT_ACKNOWLEDGE = 2;客户端手动确认
int DUPS_OK_ACKNOWLEDGE = 3;批量自动确认
int SESSION_TRANSACTED = 0;事物提交确认
```

这几种是javax.jms.Session提供给客户端使用，如果我们想手动确认消息，那么肯定是需要CLIENT_ACKNOWLEDGE = 2这个值了，真的吗？其实即使我们把commit模式修改为2并且关闭事物，也不会起到任何作用，大家不妨试一试，源码如下：

//org.springframework.jms.listener.AbstractMessageListenerContainer

```java
protected void commitIfNecessary(Session session, Message message) throws JMSException {
    if (session.getTransacted()) {//是否开启事物
        if (this.isSessionLocallyTransacted(session)) {
            JmsUtils.commitIfNecessary(session);//进行事物提交
        }
        //判断消息不为空并且是否设置为CLIENT_ACKNOWLEDGE
    } else if (message != null && this.isClientAcknowledge(session)) {
        message.acknowledge();
    }
}
```

//org.springframework.jms.support.JmsAccessor

```java
protected boolean isClientAcknowledge(Session session) throws JMSException {
   return (session.getAcknowledgeMode() == Session.CLIENT_ACKNOWLEDGE);
}
```

从源码中可以发现，即使我们设置ACK_MOD为CLIENT_ACKNOWLEDGE，也是不起作用的，Spring在判断的时候，直接转化为自动提交了。难道就不能实现手动提交了吗？当然不是，ActiveMQ在jms的基础上新添加了一个模式：INDIVIDUAL_ACKNOWLEDGE = 4（单条消息确认）。使用该模式就能够满足我们的需要，下面简单介绍几种使用该模式的方式：

## 3、自定义JmsTemplate

最简单，最直接的方式就是自定义JmsTemplate，如下：

```java
@Bean
public JmsTemplate jmsTemplate(ActiveMQConnectionFactory factory) {
    JmsTemplate jmsTemplate = new JmsTemplate();
    //关闭事物
    jmsTemplate.setSessionTransacted(false);
    //设置为单条消息确认
    jmsTemplate.setSessionAcknowledgeMode(4);
    jmsTemplate.setConnectionFactory(factory);
    return jmsTemplate;
}
```

在消费消息时，直接使用该JmsTemplate.receive操作消息即可。较少使用。

## 4、使用DefaultMessageListenerContainer

DefaultMessageListenerContainer继承AbstractPollingMessageListenerContainer，采用consumer.receive来接受消息，支持XA transaction，receive方式是同步的，阻塞的，依赖多线程（taskExecutor）处理消息。

采用该方式手动Ack代码如下：

```java
@Bean
public DefaultMessageListenerContainer defaultMessageListenerContainer(ConnectionFactory  connectionFactory){
    DefaultMessageListenerContainer defaultMessageListenerContainer=new DefaultMessageListenerContainer();
    defaultMessageListenerContainer.setSessionAcknowledgeMode(4);//设置单条消息确认
    defaultMessageListenerContainer.setDestinationName("FIRST_QUEUE");//需要指定队列
    defaultMessageListenerContainer.setSessionTransacted(false);//关闭事物，否则不生效
    //消费消息
    defaultMessageListenerContainer.setMessageListener((MessageListener) message -> {
        try {
            System.out.println("消费消息："+message);
            //手动确认消息，如若不确认，消息将一直存在于消息队列中
            message.acknowledge();
        } catch (JMSException e) {
            e.printStackTrace();
        }
    });
    defaultMessageListenerContainer.setConnectionFactory(connectionFactory);
    return defaultMessageListenerContainer;
}
```

在验证该方式之前，需要把之前写的FirstQueueConsumer消费者注释掉，以免被它消费自动确认，影响结果。使用该方式需要明确指定destination和messageListener。也就是说有多少队列或主题就需要定义多少个这样的Bean。

## 5、使用SimpleJmsListenerContainerFactory

SimpleJmsListenerContainerFactory内部使用SimpleMessageListenerContainer，该容器使用简单，不支持外部事物，另外该方式支持持有多个MessageConsumer实例，并且它提供了两种方式处理消息：线程池（taskExecutor）和MessageConsumer.setMessageListener。源码如下：

```java
protected MessageConsumer createListenerConsumer(final Session session) throws JMSException {
   Destination destination = getDestination();
   if (destination == null) {
      destination = resolveDestinationName(session, getDestinationName());
   }
   MessageConsumer consumer = createConsumer(session, destination);
    //当线程池不为空
   if (this.taskExecutor != null) {
      consumer.setMessageListener(new MessageListener() {
         @Override
         public void onMessage(final Message message) {
            //使用线程池消费消息
            taskExecutor.execute(new Runnable() {
               @Override
               public void run() {
                  processMessage(message, session);
               }
            });
         }
      });
   }
   else {
       //使用MessageConsumer.setMessageListener()处理消息
      consumer.setMessageListener(new MessageListener() {
         @Override
         public void onMessage(Message message) {
            processMessage(message, session);
         }
      });
   }
   return consumer;
}
```

在我们了解该容器之后，再来看看该容器如何实现手动Ack，代码如下：

```java
@Bean
    public SimpleJmsListenerContainerFactory firstFactory(ConnectionFactory  connectionFactory) {
       SimpleJmsListenerContainerFactory factory=new SimpleJmsListenerContainerFactory();
       factory.setSessionTransacted(false);
       factory.setSessionAcknowledgeMode(4);
       factory.setConnectionFactory(connectionFactory);
       return factory;
    }
```

定义好容器之后，我们就需要在消费者上去使用它，如下：

```java
@JmsListener(destination = "${activemq.first.queue}" ,containerFactory = "firstFactory")
```

大家在测试的时候，也可以在消费者方法里输出Session对象中的事物开启状态和Ack模式，以便验证是否成功，如下：

```java
@JmsListener(destination = "${activemq.first.queue}" ,containerFactory = "firstFactory")
public void consumer(ActiveMQMessage message,Session session) throws Exception {
    System.out.println(session.getAcknowledgeMode());
    System.out.println(session.getTransacted());
    log.info("接受队列消息，内容为：{}",message);
    message.acknowledge();
}
```

@JmsListener中containerFactory可以指定容器工厂，Spring提供的容器工厂有两种： DefaultJmsListenerContainerFactory和SimpleJmsListenerContainerFactory。网上很多示例使用的都是DefaultJmsListenerContainerFactory，例如：

```java
@Bean
public DefaultJmsListenerContainerFactory firstFactory(ConnectionFactory connectionFactory, DefaultJmsListenerContainerFactoryConfigurer configurer) {
    DefaultJmsListenerContainerFactory defaultJmsListenerContainerFactory = new DefaultJmsListenerContainerFactory();
    defaultJmsListenerContainerFactory.setSessionTransacted(false);
    defaultJmsListenerContainerFactory.setSessionAcknowledgeMode(4);
    configurer.configure(defaultJmsListenerContainerFactory, connectionFactory);
    return defaultJmsListenerContainerFactory;
}
```

但是此方法在我这里并没有生效，不知是否是我这里使用有误，如果大家可以实现，望不吝赐教。

## 6、总结

上述内容是我在SpringBoot与ActiveMQ整合实现消息手动确认时，查阅网上资料，根据个人感悟所得，其中若有不好或是不正确的地方，望大家不吝指教，共同进步。
