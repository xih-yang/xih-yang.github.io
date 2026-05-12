# 26、Spring Cloud 之 Stream 构建消息驱动微服务框架；Spring Cloud Alibaba集成RocketMQ
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/1/26.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
## 一、Spring Cloud Stream

在微服务的开发过程中，会经常用到消息中间件，通过消息中间件在服务与服务之间传递消息，不管使用哪款消息中间件，如RabbitMQ、Kafka和RocketMQ，那么消息中间件和服务之间都有耦合性（如原来使用RabbitMQ，要替换为RocketMQ，那么微服务都需要修改，变动会比较大），因为这两款消息中间件有一些区别，如果我们Spring Cloud Stream来整合我们的消息中间件，就可以降低微服务和消息中间件的耦合性，做到轻松在不同消息中间件间切换

**Spring Cloud [Stream](https://so.csdn.net/so/search?q=Stream&spm=1001.2101.3001.7020)**就是负责整合我们的消息中间件，降低微服务和消息中间件的耦合性，做到轻松在不同消息中间件间切换

### 官网地址：

[Spring Cloud Stream](https://spring.io/projects/spring-cloud-stream)

Spring Cloud Stream是一个框架，用于构建与共享消息系统连接的高度可伸缩的事件驱动微服务。

Spring Cloud Stream解决了开发人员无感知的使用消息中间件的问题，Spring Cloud Stream对消息中间件的进一步封装，可以做到代码层面对消息中间件的无感知，甚至于动态的切换中间件(rabbitmq切换为rocketmq或者kafka)，使得微服务开发的高度解耦。

注：

> 目前Spring Cloud Stream仅支持RabbitMQ、Kafka，Spring Cloud Alibaba新写了一个starter可以支持RocketMQ

## Spring Cloud Stream架构

**Spring Cloud Stream** 是一个构建消息驱动微服务的[框架](https://so.csdn.net/so/search?q=%E6%A1%86%E6%9E%B6&spm=1001.2101.3001.7020)

应用程序通过Input（相当于消费者consumer）、Output（相当于生产者producer）来与Spring Cloud Stream中Binder交互，而Binder负责与[消息中间件](https://so.csdn.net/so/search?q=%E6%B6%88%E6%81%AF%E4%B8%AD%E9%97%B4%E4%BB%B6&spm=1001.2101.3001.7020)交互，因此，我们只需关注如何与Binder交互即可，而无需关注与具体消息中间件的交互

### 1、Binder

与外部消息中间件集成的组件，用来创建Binding，各消息中间件都有自己的 Binder 实现

> Kafka 的实现 KafkaMessageChannelBinder
>
> RabbitMQ 的实现 RabbitMessageChannelBinder
>
> RocketMQ 的实现 RocketMQMessageChannelBinder

### 2、Binding

包括Input Binding 和 Output Binding

Binding 在消息中间件与应用程序提供的 Provider 和 Consumer 之间提供了一个桥梁，实现了开发者只需使用应用程序的 Provider 或 Consumer 生产或消费数据即可，屏蔽了开发者与底层消息中间件的接触

### 3、Input

应用程序通过input（相当于消费者consumer）与Spring Cloud Stream中Binder交互，而Binder负责与消息中间件交互，因此，我们只需关注如何与Binder交互即可，而无需关注与具体消息中间件的交互

### 4、Output

output（相当于生产者producer）与Spring Cloud Stream中Binder交互

**组成**

**说明**

Binder

Binder是应用与消息中间件之间的封装，目前实现了Kafka和RabbitMQ的Binder，通过Binder可以很方便的连接中间件，可以动态的改变消息类型(对应于Kafka的topic，RabbitMQ的exchange)，这些都可以通过配置文件来实现

@Input

该注解标识输入通道，通过该输入通道接收消息进入应用程序

@Output

该注解标识输出通道，发布的消息将通过该通道离开应用程序

@StreamListener

监听队列，用于消费者的队列的消息接收

@EnableBinding

将信道channel和exchange、topic绑定在一起

## 二、Spring Cloud Stream应用（RocketMQ）

## （一）Spring Cloud Stream应用（RocketMQ）

**1、** 创建Springboot工程springcloud-alibaba-4-stream-rocketmq；

**2、** 添加依赖spring-cloud-starter-stream-rocketmq；

```xml
<!--spring-cloud-starter-stream-rocketmq-->
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-stream-rocketmq</artifactId>
</dependency>
```

```xml
<groupId>com.bjpowernode</groupId>
<artifactId>31-rocketmq-spring-cloud-stream</artifactId>
<version>1.0.0</version>
<name>31-rocketmq-spring-cloud-stream</name>
<description>31-rocketmq-spring-cloud-stream project for Spring Boot</description>
<properties>
    <java.version>1.8</java.version>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
    <spring-boot.version>2.2.5.RELEASE</spring-boot.version>
    <spring-cloud-alibaba.version>2.2.1.RELEASE</spring-cloud-alibaba.version>
</properties>
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <!--spring-cloud-starter-stream-rocketmq-->
    <dependency>
        <groupId>com.alibaba.cloud</groupId>
        <artifactId>spring-cloud-starter-stream-rocketmq</artifactId>
    </dependency>
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
    </dependency>
</dependencies>
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-dependencies</artifactId>
            <version>${spring-boot.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-alibaba-dependencies</artifactId>
            <version>${spring-cloud-alibaba.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <version>3.8.1</version>
            <configuration>
                <source>1.8</source>
                <target>1.8</target>
                <encoding>UTF-8</encoding>
            </configuration>
        </plugin>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
            <version>2.3.0.RELEASE</version>
            <configuration>
                <mainClass>com.bjpowernode.Application</mainClass>
            </configuration>
            <executions>
                <execution>
                    <id>repackage</id>
                    <goals>
                        <goal>repackage</goal>
                    </goals>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>
```

**3、** application.properties配置文件；

```bash
server.port=8081
spring.application.name=springcloud-alibaba-4-stream-rocketmq
# 日志级别
logging.level.com.alibaba.cloud.stream.binder.rocketmq=INFO
########## RocketMQ 通用配置
# 客户端接入点，必填，rocketmq的连接地址, binder高度抽象
spring.cloud.stream.rocketmq.binder.name-server=192.168.133.128:9876
########## 生产者Producer Config
# output 的配置如下： bindings 具体生产消息、消费消息的桥梁(消费者Consumer和生产者Producer的destination 目的地必须保持一致)
spring.cloud.stream.bindings.output.destination=test-topic
spring.cloud.stream.bindings.output.content-type=text/plain
spring.cloud.stream.bindings.output.group=test-group
########## 消费者Consumer Config
# input 的配置：(消费者Consumer和生产者Producer的destination 目的地必须保持一致)
spring.cloud.stream.bindings.input.destination=test-topic
spring.cloud.stream.bindings.input.content-type=text/plain
spring.cloud.stream.bindings.input.group=test-group
```

### 4、消息发送（生产者）

```java
@Service
public class SenderService {
    //spring cloud stream里面发消息通过 Source 发送
    @Autowired
    private Source source;
    //原来springboot里面通过 RocketMQTemplate 发送
    /**
     * 发送消息的方法
     *
     * @param msg
     * @throws Exception
     */
    public void send(String msg) throws Exception {
        // source.output() == MessageChannel 消息通道
        boolean flag = source.output().send(MessageBuilder.withPayload(msg).build());
        System.out.println("消息发送：" + flag);
    }
}
```

### 5、消息接收（消费者）

```java
@Service
public class ReceiveService {
    //spring cloud stream里面发消息通过 Sink 发送
    @Autowired
    private Sink sink;
    //原来springboot里面通过 RocketMQTemplate 发送
    /* 接收消息
    第一种：通过手动调用receive()方法接收消息，while循环监听消息
    * */
    public void receive() {
        while(true){
            // SubscribableChannel = sink.input() 消息订阅的信道
            sink.input().subscribe((Message<?> message) -> {
                System.out.println("Sink接收到的消息是：" + message.getPayload());
            });
        }
    }
    /* 接收消息
    第二种：通过@StreamListener监听消息，不需要调用receiveMessage(String message)方法 
    * */
    @StreamListener(value = Sink.INPUT)
    public void receiveMessage(String message) {
        System.out.println("StreamListener接收到的消息是：" + message);
    }
}
```

**6、** springboot启动程序类；

```java
import com.company.consumer.ReceiveService;
import com.company.producer.SenderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.stream.annotation.EnableBinding;
import org.springframework.cloud.stream.messaging.Sink;
import org.springframework.cloud.stream.messaging.Source;
@EnableBinding(value = {Source.class, Sink.class}) //使其生效
@SpringBootApplication
//Spring boot的CommandLineRunner接口主要用于实现在应用初始化后，去执行一段代码块逻辑，这段初始化代码在整个应用生命周期内只会执行一次
public class Stream4RocketmqApplication implements CommandLineRunner {
    @Autowired
    private SenderService senderService;
    @Autowired
    private ReceiveService receiveService;
    public static void main(String[] args) {
        SpringApplication.run(Stream4RocketmqApplication.class, args);
    }
    @Override
    public void run(String... args) throws Exception {
        senderService.send("Hello spring cloud stream rocketmq！");
        receiveService.receive();
    }
}
```

## （二）Spring Cloud Stream自定义信道

消息传递主要使用的是系统提供的 Source （output）、Sink（input）；因此我们自定义Source和Sink接口即可

```bash
server.port=8081
spring.application.name=springcloud-alibaba-4-stream-rocketmq
# 日志级别
logging.level.com.alibaba.cloud.stream.binder.rocketmq=INFO
########## RocketMQ 通用配置
# 客户端接入点，必填，rocketmq的连接地址, binder高度抽象
spring.cloud.stream.rocketmq.binder.name-server=192.168.133.128:9876
########## 生产者Producer Config
# output 的配置如下： bindings 具体生产消息、消费消息的桥梁(消费者Consumer和生产者Producer的destination 目的地必须保持一致)
spring.cloud.stream.bindings.output.destination=test-topic
spring.cloud.stream.bindings.output.content-type=text/plain
spring.cloud.stream.bindings.output.group=test-group
# output1 要对应到一个Source里面去
spring.cloud.stream.bindings.output1.destination=test-topic1
spring.cloud.stream.bindings.output1.content-type=text/plain
spring.cloud.stream.bindings.output1.group=test-group1
# output2 要对应到一个Source里面去
spring.cloud.stream.bindings.output2.destination=test-topic2
spring.cloud.stream.bindings.output2.content-type=text/plain
spring.cloud.stream.bindings.output2.group=test-group2
########## 消费者Consumer Config
# input 的配置：(消费者Consumer和生产者Producer的destination 目的地必须保持一致)
spring.cloud.stream.bindings.input.destination=test-topic
spring.cloud.stream.bindings.input.content-type=text/plain
spring.cloud.stream.bindings.input.group=test-group
spring.cloud.stream.bindings.input1.destination=test-topic1
spring.cloud.stream.bindings.input1.content-type=text/plain
spring.cloud.stream.bindings.input1.group=test-group1
spring.cloud.stream.rocketmq.bindings.input1.consumer.tags=myTag
spring.cloud.stream.bindings.input2.destination=test-topic2
spring.cloud.stream.bindings.input2.content-type=text/plain
spring.cloud.stream.bindings.input2.group=test-group2
```

### 消息发送（生产者）

```java
public interface MySource {
    /**
     * Name of the output channel.
     */
    String OUTPUT1 = "output1";
    /**
     * Name of the output channel.
     */
    String OUTPUT2 = "output2";
    /**
     * @return output channel
     */
    @Output(MySource.OUTPUT1)
    MessageChannel output1();
    @Output(MySource.OUTPUT2)
    MessageChannel output2();
}
```

```java
import org.apache.rocketmq.common.message.MessageConst;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.stream.messaging.Source;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageHeaders;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Service;
import org.apache.rocketmq.spring.core.RocketMQTemplate;
import org.springframework.util.MimeTypeUtils;
@Service
public class SenderService {
    //spring cloud stream里面发消息通过 Source 发送
    @Autowired
    private Source source;
    //原来springboot里面通过 RocketMQTemplate 发送
    @Autowired
    private MySource mySource;
    @Autowired
    private RocketMQTemplate rocketMQTemplate;
    /**
     * 发送消息的方法
     *
     * @param msg
     * @throws Exception
     */
    public void send(String msg) throws Exception {
        // source.output() == MessageChannel 消息通道
        boolean flag = source.output().send(MessageBuilder.withPayload(msg).build());
        System.out.println("消息发送：" + flag);
    }
    /**
     * 发送消息的方法
     *
     * @param msg
     * @throws Exception
     */
    public void send(String msg) throws Exception {
        // source.output() == MessageChannel 消息通道
        boolean flag = source.output().send(MessageBuilder.withPayload(msg).build());
        System.out.println("消息发送：" + flag);
    }
    /**
     * 发送消息的方法
     *
     * @param msg
     * @throws Exception
     */
    public void send1(String msg) throws Exception {
        // source.output() == MessageChannel 消息通道
        boolean flag = mySource.output1().send(MessageBuilder.withPayload(msg).build());
        System.out.println("消息发送1：" + flag);
    }
    /**
     * 发送消息的方法,发到3个topic中
     *
     * @param msg
     * @throws Exception
     */
    public void multiSend(String msg) throws Exception {
        // source.output() == MessageChannel 消息通道
        boolean flag = source.output().send(MessageBuilder.withPayload(msg).build());
        System.out.println("消息发送：" + flag);
        // source.output() == MessageChannel 消息通道
        boolean flag1 = mySource.output1().send(MessageBuilder.withPayload(msg).build());
        System.out.println("消息发送1：" + flag1);
        // source.output() == MessageChannel 消息通道
        boolean flag2 = mySource.output2().send(MessageBuilder.withPayload(msg).build());
        System.out.println("消息发送2：" + flag2);
    }
    public <T> void sendObject(T msg, String tag) throws Exception {
        Message message = MessageBuilder.withPayload(msg)
                .setHeader(MessageConst.PROPERTY_TAGS, tag)
                .setHeader(MessageHeaders.CONTENT_TYPE, MimeTypeUtils.APPLICATION_JSON)
                .build();
        boolean flag2 = mySource.output1().send(message);
        System.out.println("对象消息发送2：" + flag2);
    }
    /**
     * 发送消息的方法
     *
     * @param msg
     * @throws Exception
     */
    public void sendTemplate(String msg) throws Exception {
        Message message = MessageBuilder.withPayload(msg)
                .setHeader(MessageHeaders.CONTENT_TYPE, MimeTypeUtils.APPLICATION_JSON)
                .build();
        rocketMQTemplate.send("test-topic1", message);
        System.out.println("发送完毕......");
    }
}
```

### 消息接收（消费者）

```java
public interface MySink {
    /**
     * Input channel name.
     */
    String INPUT1 = "input1";
    /**
     * Input channel name.
     */
    String INPUT2 = "input2";
    /**
     * @return input channel.
     */
    @Input(MySink.INPUT1)
    SubscribableChannel input1();
    /**
     * @return input channel.
     */
    @Input(MySink.INPUT2)
    SubscribableChannel input2();
}
```

```java
@Service
public class ReceiveService {
    //spring cloud stream里面发消息通过 Sink 发送
    @Autowired
    private Sink sink;
    //原来springboot里面通过 RocketMQTemplate 发送
    @Autowired
    private MySink mySink;
    /* 接收消息
    第一种：通过手动调用receive()方法接收消息，while循环监听消息
    * */
    public void receive() {
        while(true){
            // SubscribableChannel = sink.input() 消息订阅的信道
            sink.input().subscribe((Message<?> message) -> {
                System.out.println("Sink接收到的消息是：" + message.getPayload());
            });
        }
    }
    /* 接收消息
    第二种：通过@StreamListener监听消息，不需要调用receiveMessage(String message)方法
    * */
    @StreamListener(value = Sink.INPUT)
    public void receiveMessage(String message) {
        System.out.println("StreamListener接收到的消息是：" + message);
    }
    public void receive1() {
        while (true){
            // SubscribableChannel = sink.input() 消息订阅的信道
            mySink.input1().subscribe((Message<?> message) -> {
                System.out.println("input 1---" + message.getPayload());
            });
        }
    }
    @StreamListener(value = MySink.INPUT1)
    public void receiveMessage1(String message) {
        System.out.println("接收到的消息是1：" + message);
    }
    @StreamListener(value = MySink.INPUT2)
    public void receiveMessage2(String message) {
        System.out.println("接收到的消息是2：" + message);
    }
}
```

## （三）Spring Cloud Stream事务消息

```bash
#--------------------------事务消息-------------------------------------
#生产的配置
spring.cloud.stream.bindings.outputTX.destination=TransactionTopic
spring.cloud.stream.bindings.outputTX.content-type=application/json
spring.cloud.stream.rocketmq.bindings.outputTX.producer.group=myTxProducerGroup
#是否为事务消息，默认为false表示不是事务消息，true表示是事务消息
spring.cloud.stream.rocketmq.bindings.outputTX.producer.transactional=true
#消费的配置：
spring.cloud.stream.bindings.inputTX.destination=TransactionTopic
spring.cloud.stream.bindings.inputTX.content-type=text/plain
spring.cloud.stream.bindings.inputTX.group=transaction-group
spring.cloud.stream.rocketmq.bindings.inputTX.consumer.broadcasting=false
```

### 消息发送（生产者）

```java
@Component
public class Sender {
    @Autowired
    private MySource mySource;
    public <T> void sendTransactionalMsg(T msg, int num) throws Exception {
        MessageBuilder builder = MessageBuilder.withPayload(msg)
                .setHeader(MessageHeaders.CONTENT_TYPE, MimeTypeUtils.APPLICATION_JSON)
                .setHeader("test", String.valueOf(num));
                //.setHeader(RocketMQHeaders.TAGS, "binder");
        Message message = builder.build();
        mySource.outputTX().send(message);
    }
}
```

```java
import org.apache.rocketmq.spring.annotation.RocketMQTransactionListener;
import org.apache.rocketmq.spring.core.RocketMQLocalTransactionListener;
import org.apache.rocketmq.spring.core.RocketMQLocalTransactionState;
import org.springframework.messaging.Message;
@RocketMQTransactionListener(txProducerGroup = "myTxProducerGroup", corePoolSize = 5, maximumPoolSize = 10)
public class TransactionListenerImpl implements RocketMQLocalTransactionListener {
	/**
	 * 执行本地事务：也就是执行本地业务逻辑
	 *
	 * @param msg
	 * @param arg
	 * @return
	 */
	@Override
	public RocketMQLocalTransactionState executeLocalTransaction(Message msg, Object arg) {
		Object num = msg.getHeaders().get("test");
		if ("1".equals(num)) {
			System.out.println("executer: " + new String((byte[]) msg.getPayload()) + " unknown");
			return RocketMQLocalTransactionState.UNKNOWN;
		}
		else if ("2".equals(num)) {
			System.out.println("executer: " + new String((byte[]) msg.getPayload()) + " rollback");
			return RocketMQLocalTransactionState.ROLLBACK;
		}
		System.out.println("executer: " + new String((byte[]) msg.getPayload()) + " commit");
		return RocketMQLocalTransactionState.COMMIT;
	}
	/**
	 * 回调检查
	 *
	 * @param msg
	 * @return
	 */
	@Override
	public RocketMQLocalTransactionState checkLocalTransaction(Message msg) {
		System.out.println("check: " + new String((byte[]) msg.getPayload()));
		return RocketMQLocalTransactionState.COMMIT;
	}
}
```

### 消息接收（消费者）

```java
@StreamListener(value = MySink.INPUTTX)
    public void receiveTransactionMessage(String message) {
        System.out.println("接收到的 事务 消息是：" + message);
    }
```

## 三、Spring Cloud Stream RocketMQ配置选项

## RocketMQ Binder Properties

***spring.cloud.stream.rocketmq.binder.name-server***

RocketMQ NameServer 地址(老版本使用 namesrv-addr 配置项)；

Default: 127.0.0.1:9876.

***spring.cloud.stream.rocketmq.binder.access-key***

阿里云账号 AccessKey。

Default: null.

***spring.cloud.stream.rocketmq.binder.secret-key***

阿里云账号 SecretKey。

Default: null.

***spring.cloud.stream.rocketmq.binder.enable-msg-trace***

是否为Producer 和 Consumer 开启消息轨迹功能

Default: true.

***spring.cloud.stream.rocketmq.binder.customized-trace-topic***

消息轨迹开启后存储的 topic 名称。

Default: RMQ_SYS_TRACE_TOPIC.

## RocketMQ Consumer Properties

下面的这些配置是以 spring.cloud.stream.rocketmq.bindings..consumer. 为前缀的 RocketMQ Consumer 相关的配置。

***enable***

是否启用 Consumer；

默认值: true.

***tags***

Consumer 基于 TAGS 订阅，多个 tag 以 || 分割；

默认值: empty.

***sql***

Consumer 基于 SQL 订阅；

默认值: empty.

***broadcasting***

Consumer 是否是广播消费模式。如果想让所有的订阅者都能接收到消息，可以使用广播模式；

默认值: false.

***orderly***

Consumer 是否同步消费消息模式；

默认值: false.

***delayLevelWhenNextConsume***

异步消费消息模式下消费失败重试策略：

-1,不重复，直接放入死信队列

0,broker 控制重试策略

> 0,client 控制重试策略

默认值: 0.

***suspendCurrentQueueTimeMillis***

同步消费消息模式下消费失败后再次消费的时间间隔；

默认值: 1000.

## RocketMQ Provider Properties

下面的这些配置是以 spring.cloud.stream.rocketmq.bindings..producer. 为前缀的 RocketMQ Producer 相关的配置；

***enable***

是否启用 Producer；

默认值: true.

***group***

Producer group name；

默认值: empty.

***maxMessageSize***

消息发送的最大字节数；

默认值: 8249344.

***transactional***

是否发送事务消息；

默认值: false.

***sync***

是否使用同步得方式发送消息；

默认值: false.

***vipChannelEnabled***

是否在Vip Channel 上发送消息；

默认值: true.

***sendMessageTimeout***

发送消息的超时时间(毫秒)；

默认值: 3000.

***compressMessageBodyThreshold***

消息体压缩阀值(当消息体超过 4k 的时候会被压缩)；

默认值: 4096.

***retryTimesWhenSendFailed***

在同步发送消息的模式下，消息发送失败的重试次数；

默认值: 2.

***retryTimesWhenSendAsyncFailed***

在异步发送消息的模式下，消息发送失败的重试次数；

默认值: 2.

***retryNextServer***

消息发送失败的情况下是否重试其它的 broker；

默认值: false

**由此开发使用RocketMQ有两种选择**

**1、** SpringBoot+RocketMQ整合实现消息传送；

**2、** 使用SpringCloudStream对消息中间件的包装，来实现消息传送；
