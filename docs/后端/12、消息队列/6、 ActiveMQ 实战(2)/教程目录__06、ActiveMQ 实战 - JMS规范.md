# 06、ActiveMQ 实战 - JMS规范
- 来源：https://ddkk.com/zhuanlan/mq/activemq/2/6.html
- 分类：消息队列
- 分组：教程目录
### JavaEE规范

JavaEE是一套使用Java进行企业级应用开发的大家一致遵循的13个核心规范工业标准（JMS只是其中一个）。JavaEE平台提供了一个基于组件的方法来加快设计，开发。装配及部署企业应用程序。

**1、** JDBC（JavaDatabease）数据库连接；

**2、** JNDI（JavaNamingandDirectoryInterfaces）Java命名和目录接口；

**3、** EJB（EnterpriseJavaBean）；

**4、** RMI（RemoteMethodInvoke）远程方法调用；

**5、** JavaIDL（InterfaceDescriptionLanguage）/CORBA（CommonObjectBrokerArchitecture）接口定义语言/共用对象请求代理程序体系结构；

**6、** JSP（JavaServerPage）；

**7、** JavaServlet；

**8、** XML（ExtensibleMarkupLanguage）可扩展标记语言；

**9、** JMS（JavaMessageService）Java消息服务；

**10、** JTA（JavaTransactionAPI）Java事务API；

**11、** JTS（JavaTransactionService）Java事务服务；

**12、** JavaMail；

**13、** JAF（JavaBeanActivationFramework）；

更多信息参考：[JavaEE十三种规范](http://blog.sina.com.cn/s/blog_131183a710102x64w.html)

### JMS

JMS（Java Message Service）：即Java消息服务，指的是两个应用程序之间进行异步通信的API，它为标准协议和消息服务提供了一组通用接口，包括创建、发送、读取消息等，用于支持Java应用程序开发。在JavaEE中，当两个应用程序使用JMS进行通信时，它们之间不是直接相连的，而是通过一个共同的消息收发服务组件关联起来以达到解耦/异步削峰的效果。

### 常用MQ产品比较

特性
ActiveMQ
RabbitMQ
Kafka
RocketMQ

PRODUCER-CUMSUMER
支持
支持
支持
支持

PUBLISH-SUBSCRIBE
支持
支持
支持
支持

REQUEST-REPLY
支持
支持
-
支持

API完备性
支持
支持
支持
支持

PRODUCER-CUMSUMER
高
高
高
低(静态配置)

多语言支持
支持,Java优先
语言无关
支持,Java优先
支持

单机吞吐量
万级
万级
十万级
单片万级

消息延迟
-
微秒级
毫秒级
-

可用性
高(主从)
高(主从)
非常高(分布式)
高

消息丢失
-
低
理论上不会丢失
-

消息重复
-
可控制
理论上会有重复
-

文档的完备性
高
高
高
中

提供快速入门
有
有
有
无

首次部署难度
-
低
中
高

### JMS中的角色

- JMS Provider：实现JMS接口和规范的消息中间件，即MQ服务器
- JMS Producer：消息生产者，创建和发送JMS消息的客户端应用
- JMS Consumer：消息消费者，接受和处理JMS消息的客户端应用
- JMS Message：消息

### JMS Message结构

- 消息头

**1、** JMSDestination：消息发送的目的地，主要是指Queue和Topic；

**2、** JMSDeliveryMode：消息持久化和非持久化模式；

持久性的消息：应该被传送“一次仅仅一次”，这就意味着如果JMS提供者出现故障，该消息并不会丢失，它会在服务器恢复之后再次传递。

非持久的消息：最多会传递一次，这意味着服务器出现故障，该消息将会永远丢失。
**3、** JMSExpiration：消息过期时间；

可以设置消息在一定时间后过期，默认是永不过期。

消息过期时间，等于Destination的send方法中的timeToLive值加上发送时刻的GMT时间值。

如果timeToLive值等于0，则JMSExpiration被设为0，表示该消息永不过期。

如果发送后，在消息过期时间之后还没有被发送到目的地，则该消息被清除。
**4、** JMSPriority：消息优先级；

消息优先级，从0-9十个级别，0-4是普通消息5-9是加急消息。

JMS不要求MQ严格按照这十个优先级发送消息但必须保证加急消息要先于普通消息到达。默认是4级。（比如优先级9加急消息不一定要早于优先级8的加急消息先发送，但是这两条加急消息一定比优先级4普通消息先发送。）
**5、** JMSMessageID：消息唯一标识，由MQ产生；

- 消息属性

**1、** TxtMessage：普通字符串（String）消息；

**2、** MapMessage：Map类型的消息，key为String类型，值为Java基本类型；

**3、** BytesMessage：二进制数组消息；

**4、** StreamMessage：Java数据流消息，用标准流操作来顺序填充和读取；

**5、** ObjectMessage：对象消息，包含一个可序列化的Java对象；

- 消息体

对消息的一种描述，达到识别、去重、重点标注等操作。

### JMS的可靠性

- Persistent（持久性）：包括持久的Queue和持久的Topic。
- Transaction（事务性）：消息发送后并且提交事务后，消息才被真正提交到队列中。在生产端，当消息需要批量提交时，要么全部成功提交，要么事务回滚，全部不提交。在消费端，只有当消费者提交事务后，消息才算真正的出队，否则即使是队列的消息也会被重复消费，事务保证了消息一定会被消费者消费。
- Acknowledge（签收）：客户端只有对消息签收后，队列中的消息才会真正的出队。签收方式：自动签收（默认），手动签收，允许消息重复签收，事务级别签收。

**1、** 非事务性自动签收：消息被自动签收；

**2、** 事务性自动签收：客户端只有提交事务后消息自动签收才生效；

**3、** 非事务性手动签收：客户端需要手动调用签收方法，消息才会出队；

**4、** 事务性手动签收：事务提交后，消息会被自动被签收（即使是手动签收方式），事务不提交，消息即使手动签收，也签收不成功，仍然存在消息重复消费的问题；

`签收和事务的关系：在事务会话中，当一个事务被成功提交则消息被自动签收，如果事务回滚，则消息被再次传送；非事务会话中，消息何时被确认取决于创建会话时的签收模式（Acknowledge Mode）。`

`事务偏生产者，签收偏消费者。`

### JMS的点对点（Queue）

点对点模型是基于队列的，生产者发送消息到队列，消费者从队列接收消息，队列的存在使得消息的异步传输成为可能。和我们平时给朋友发送短信类似。

**1、** 如果在Session关闭时有部分消息被收到但还没有被签收（acknowledge），那当消费者下次连接到相同的队列时，这些消息还会被再次接收；

**2、** 队列可以长久的保存消息直到消费者收到消息消费者不需要因为担心消息会丢失而时刻和队列保持激活的链接状态，充分体现了异步传输模式的优势；

### JMS的发布和订阅（Topic）

**1、** 非持久性订阅：非持久订阅只有当客户端处于激活状态，也就是和MQ保持连接状态才能收发到某个主题的消息如果消费者处于离线状态，生产者发送的主题消息将会丢失作废，消费者永远不会收到简而言之，先订阅注册才能接受到发布，只给订阅者发布消息；

**2、** 持久性订阅：客户端首先向MQ注册一个自己的身份ID识别号，当这个客户端处于离线时，生产者会为这个ID保存所有发送到主题的消息，当客户再次连接到MQ的时候，会根据消费者的ID得到所有当自己处于离线时发送到主题的消息非持久订阅状态下，不能恢复或重新派送一个未签收的消息持久订阅才能恢复或重新派送一个未签收的消息；
