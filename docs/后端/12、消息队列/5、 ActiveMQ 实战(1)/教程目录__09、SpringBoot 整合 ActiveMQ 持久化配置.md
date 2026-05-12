# 09、SpringBoot 整合 ActiveMQ 持久化配置
- 来源：https://ddkk.com/zhuanlan/mq/activemq/1/9.html
- 分类：消息队列
- 分组：教程目录
## 1、ActiveMQ数据库持久化配置

ActiveMQ持久化的三种方式，我们采用数据库的方式来进行持久化。

1、Memory 消息存储-基于内存的消息存储。

2、基于日志消息存储方式，KahaDB是ActiveMQ的默认日志存储方式，它提供了容量的提升和恢复

能力。

3、基于JDBC的消息存储方式-数据存储于数据库（例如：MySQL）中。

首先我们先来配置activeMQ

在conf文件夹里的activeMQ.xml中增加一个jdbc的bean

```xml
<bean id="activemq-db" class="org.apache.commons.dbcp.BasicDataSource">
      <property name="driverClassName" value="com.mysql.jdbc.Driver"/>
      <property name="url" value="jdbc:mysql://127.0.0.1:3306/test"/>
      <property name="username" value="root"/>
      <property name="password" value="root"/>
      <property name="maxActive" value="200"/>
      <property name="poolPreparedStatements" value="true"/>
    </bean>
```

然后还是同一个文件，找到``标签修改：注释掉原来的kahaDB方式持久化。

```java
 <persistenceAdapter>
<!--<kahaDB directory="${activemq.base}/data/kahadb"/>  -->
<!--createTablesOnStartup    启动是否创建表  第一次为true 后续为false-->
<jdbcPersistenceAdapter dataSource="#activemq-db" createTablesOnStartup="true" />
</persistenceAdapter>
```

接着需要将一些jar包放在lib目录里。因为我们用的是连接池和mysql，所以要导入四个jar包

配置好的MQ下载地址：[https://download.csdn.net/download/qq_39404258/12561459](https://download.csdn.net/download/qq_39404258/12561459)

如果启动失败，报下面这样的错，说明你的mysql和mysql连接的jar包不匹配：

Uncategorized exception occurred during JMS processing; nested exception is javax.jms.JMSException: You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near 'OPTION SQL_SELECT_LIMIT=DEFAULT' at line 1

我用的mysql是5.6，用的mysql-connector是5.0.8，出现了这样的错，将mysql-connector改成了5.1.21就正常运行了。版本以自己的实际为主。

## 2、ActiveMQ的两种模型

**点对点模型 queue**

每个消息只有一个消费者（ Consumer）(即一旦被消费，消息就不再在消息队列中)；

发送者和接收者之间在时间上没有依赖性，也就是说当发送者发送了消息之后，不管接收者有没有

正在运行，它不会影响到消息被发送到队列；

接收者在成功接收消息之后需向队列应答成功。

**发布/订阅模型 topic**

每个消息可以有多个消费者；

发布者和订阅者之间有时间上的依赖性（先订阅主题，再来发送消息）。

订阅者必须保持运行的状态，才能接受发布者发布的消息

使用jms原生消息进行示例：

生产者：

```java
public class ProducerJMS {
    public static String TCP_PATH="tcp://127.0.0.1:61616";
    public static void main(String[] args) {
        try {
            //1.创建连接工厂
            ConnectionFactory factory = new ActiveMQConnectionFactory();
            //2.创建连接
            Connection connection=factory.createConnection();
            //3.打开连接
            connection.start();
            //4.创建session param1=事务是否开启 param2=消息确认机制  如果开启事务，第二个参数无用，且需要一个提交事务的操作
            Session session=connection.createSession(false,Session.AUTO_ACKNOWLEDGE);
            //5.创建消息队列
            Topic topic =session.createTopic("q2");
            Queue queue=session.createQueue("q1");
            MessageProducer producer1=session.createProducer(topic);
            //6.创建生产者
            MessageProducer producer=session.createProducer(queue);
            //7.创建消息
            TextMessage textMessage=session.createTextMessage("new");
            TextMessage textMessage1=session.createTextMessage("new1");
            TextMessage textMessage2=session.createTextMessage("new2");
            TextMessage top1=session.createTextMessage("top");
            TextMessage top2=session.createTextMessage("top1");
            TextMessage top3=session.createTextMessage("top2");
            //8.发送消息到消息队列
            producer.send(textMessage);
            producer.send(textMessage1);
            producer.send(textMessage2);
            producer1.send(top2);
            producer1.send(top3);
            producer1.send(top1);
            //9.关闭连接
            session.close();
            connection.close();
        }catch (Exception e){
            e.printStackTrace();
        }
    }
}
```

消费者：

```java
public class ConsumerJMS {
    public static String URL_PATH="tcp://127.0.0.1:61616";
    public static void main(String[] args) {
        try{
            //1.创建连接工厂
            ConnectionFactory factory = new ActiveMQConnectionFactory(URL_PATH);
            //2.创建连接
            Connection connection = factory.createConnection();
            //3.打开连接
            connection.start();
            //4.创建会话
            Session session=connection.createSession(false,Session.AUTO_ACKNOWLEDGE);
            //5.创建目标地址(通道)
            Queue queue =session.createQueue("q1");
            Topic topic = session .createTopic("q2");
            //6.创建消费者
            MessageConsumer consumer1=session.createConsumer(topic);
            MessageConsumer consumer=session.createConsumer(queue);
            consumer1.setMessageListener(new MessageListener() {
                @Override
                public void onMessage(Message message) {
                    if (message instanceof TextMessage){
                        TextMessage textMessage = (TextMessage) message;
                        try {
                            System.out.println("接收的消息："+textMessage.getText());
                        } catch (JMSException e) {
                            e.printStackTrace();
                        }
                    }else {
                        System.out.println("类型错误！");
                    }
                }
            });
            //7.接收消息,因为在一直监听，当有新消息来时，获取，所以连接不能关
            consumer.setMessageListener(new MessageListener() {
                @Override
                public void onMessage(Message message) {
                    if (message instanceof TextMessage){
                        TextMessage textMessage = (TextMessage) message;
                        try {
                            System.out.println("接收的消息："+textMessage.getText());
                        } catch (JMSException e) {
                            e.printStackTrace();
                        }
                    }else {
                        System.out.println("类型错误！");
                    }
                }
            });
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

启动两个消费者，然后启动生产者，结果：

通过结果发现，queue的消息随机分配给了两个消费者，但topic的消息同时发给了他们两个。

接着先启动生产者，再启动消费者，发现只收到了queue里的消息。

## 3、在SpringBoot中简单使用

yml配置：

```sh
server:
  port: 9081
spring:
  activemq:
    broker-url: tcp://127.0.0.1:61616
    user: admin
    password: admin
    packages:
      trust-all: true  #信任包
  jms:
    pub-sub-domain: false #false点对点 true订阅
    template:
      delivery-mode: persistent #持久化
activemq:
  name: spring_queue
```

maven依赖：

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-activemq</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
    </dependency>
</dependencies>
```

五种消息的使用实例：

生产者：

```java
@RunWith(SpringJUnit4ClassRunner.class)
@SpringBootTest(classes= ProducerApplication.class)
public class Producer {
    @Value("${activemq.name}")
    private String messageName;
    @Autowired
    private JmsMessagingTemplate jmsMessagingTemplate;
    @Autowired
    private JmsTemplate jmsTemplate;
    @Test
    public void ptpSend() {
        jmsMessagingTemplate.convertAndSend("spring_queue", "new message");
    }
    @Test
    public void ptpSendTextMessage() {
        jmsTemplate.send(messageName, new MessageCreator() {
            @Override
            public Message createMessage(Session session) throws JMSException {
                return session.createTextMessage("testMessage");
            }
        });
    }
    @Test
    public void ptpSendMapMessage() {
        jmsTemplate.send(messageName, new MessageCreator() {
            @Override
            public Message createMessage(Session session) throws JMSException {
                MapMessage mapMessage =session.createMapMessage();
                mapMessage.setString("name","zz");
                mapMessage.setInt("age",1);
                return mapMessage;
            }
        });
    }
    @Test
    public void ptpSendUserMessage() {
        jmsTemplate.send(messageName, new MessageCreator() {
            @Override
            public Message createMessage(Session session) throws JMSException {
                User user= new User("zhangsan",11);
                return session.createObjectMessage(user);
            }
        });
    }
    @Test
    public void ptpSendByteMessage() {
        jmsTemplate.send(messageName, new MessageCreator() {
            @Override
            public Message createMessage(Session session) throws JMSException {
                File file =new File("D:\\img\\30.png");
               BytesMessage bytesMessage = session.createBytesMessage();
                try {
                    FileInputStream in = new FileInputStream(file);
                    byte[] bytes = new byte[(int)file.length()];
                    //将Stream里的内容输入到bytes里
                    in.read(bytes);
                    bytesMessage.writeBytes(bytes);
                } catch (Exception e) {
                    e.printStackTrace();
                }
                return bytesMessage;
            }
        });
    }
    @Test
    public void ptpSendStreamMessage() {
        jmsTemplate.send(messageName, new MessageCreator() {
            @Override
            public Message createMessage(Session session) throws JMSException {
              StreamMessage streamMessage =  session.createStreamMessage();
              streamMessage.writeDouble(2.2);
              streamMessage.writeString("Stream");
                return streamMessage;
            }
        });
    }
}
```

消费者：

```java
@Component
public class Consumer {
    @JmsListener(destination = "${activemq.name}")
    public void reveiced(Message message){
        if (message instanceof TextMessage){
          TextMessage textMessage=(TextMessage) message;
            try {
                System.out.println("接收消息："+textMessage.getText());
            } catch (Exception e) {
                e.printStackTrace();
            }
        }else if (message instanceof MapMessage){
            MapMessage mapMessage=(MapMessage) message;
            try {
                System.out.println("接收Map消息："+mapMessage.getString("name")+","+mapMessage.getString("age"));
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        else if (message instanceof ObjectMessage){
            ObjectMessage objectMessage=(ObjectMessage) message;
            try {
                User user = (User) objectMessage.getObject();
                System.out.println("接收Object消息："+user.getName()+","+user.getAge());
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        else if (message instanceof BytesMessage){   
            BytesMessage bytesMessage=(BytesMessage) message;
            try {
                FileOutputStream fileOutputStream = new FileOutputStream("D:\\img1\\1.png");
                byte[] bytes = new byte[(int)bytesMessage.getBodyLength()];
                bytesMessage.readBytes(bytes);
                fileOutputStream.write(bytes);
                fileOutputStream.close();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        else if (message instanceof StreamMessage){
            StreamMessage streamMessage=(StreamMessage) message;
            try {
                System.out.println("接收Stream消息："+streamMessage.readDouble());
                System.out.println("接收Stream消息："+streamMessage.readString());
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
}
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
