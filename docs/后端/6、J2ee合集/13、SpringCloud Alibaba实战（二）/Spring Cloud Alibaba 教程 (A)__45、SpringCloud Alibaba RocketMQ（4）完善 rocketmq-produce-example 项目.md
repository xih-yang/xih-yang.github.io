# 45、SpringCloud Alibaba RocketMQ（4）完善 rocketmq-produce-example 项目
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/2/78.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
## 1.添加一个配置文件

配置信息如下：

```bash
logging.level.com.alibaba.cloud.stream.binder.rocketmq=DEBUG
spring.cloud.stream.rocketmq.binder.name-server=127.0.0.1:9876
spring.cloud.stream.bindings.output1.destination=test-topic
spring.cloud.stream.bindings.output1.content-type=application/json
spring.cloud.stream.rocketmq.bindings.output1.producer.group=binder-group
spring.cloud.stream.rocketmq.bindings.output1.producer.sync=true
spring.cloud.stream.bindings.output2.destination=TransactionTopic
spring.cloud.stream.bindings.output2.content-type=application/json
spring.cloud.stream.rocketmq.bindings.output2.producer.transactional=true
spring.cloud.stream.rocketmq.bindings.output2.producer.group=myTxProducerGroup
spring.cloud.stream.bindings.output3.destination=pull-topic
spring.cloud.stream.bindings.output3.content-type=text/plain
spring.cloud.stream.rocketmq.bindings.output3.producer.group=pull-binder-group
spring.application.name=rocketmq-produce-example
server.port=28081
management.endpoints.web.exposure.include=*
management.endpoint.health.show-details=always
```

## 2.添加一个启动类

```java
@SpringBootApplication 
public class RocketMQProduceApplication {
	public static void main(String[] args) {
		SpringApplication.run(RocketMQProduceApplication.class, args); 
	} 
}
```

## 3.添加 MQSource

在 Source 里面定义输出：

```java
public interface MQSource {
	@Output("output1") 
	MessageChannel output1() ; 
	@Output("output2") 
	MessageChannel output2() ; 
	@Output("output1") 
	MessageChannel output3() ; 
}
```

## 4.添加发送消息的类

```java
@Service 
public class SendService {
	@Autowired 
	private MQSource source;
	//发送简单的测试消息
	public void send(String msg) throws Exception {
		source.output1().send(MessageBuilder.withPayload(msg).build()); 
	}
	//发消息时添加标签
	public <T> void sendWithTags(T msg, String tag) throws Exception {
		Message message = MessageBuilder.createMessage(msg, new MessageHeaders(Stream.of(tag).collect(Collectors.toMap(str -> MessageConst.PROPERTY_TAGS, String::toString))));
		source.output1().send(message);
	}
	//发送一个对象消息
	public <T> void sendObject(T msg, String tag) throws Exception {
		Message message = MessageBuilder.withPayload(msg).setHeader(MessageConst.PROPERTY_TAGS, tag).setHeader(MessageHeaders.CONTENT_TYPE, MimeTypeUtils.APPLICATION_JSON).build();
		source.output1().send(message);
	}
	//发送事务的消息
	public <T> void sendTransactionalMsg(T msg, int num) throws Exception {
		MessageBuilder builder = MessageBuilder.withPayload(msg).setHeader(MessageHeaders.CONTENT_TYPE, MimeTypeUtils.APPLICATION_JSON);
		builder.setHeader("test", String.valueOf(num));
		Message message = builder.build();
		source.output2().send(message);
	}
	public void sendMassiveMessage(String msg) {
		source.output3().send(MessageBuilder.withPayload(msg).build());
	}
}
```

## 5.添加配置类

代码如下：

```java
@Configuration @
EnableBinding({
     MQSource.class}) 
public class MQConfig {
      }
```

## 6.事务消息往往需要我们监听回查

新建一个类：

代码如下：

```java
//TransactionStatus.CommitTransaction：消息提交，当消息状态为 CommitTransaction，表示允许消费者允许消费当前消息
//TransactionStatus.RollbackTransaction：消息回滚，表示 MQ 服务端将会删除当前半消息，不允许消费者消费
//TransactionStatus.Unknown：中间状态，表示 MQ 服务需要发起回查操作，检测当前发送方本地事务的执行状态。
@RocketMQTransactionListener(txProducerGroup = "myTxProducerGroup", corePoolSize = 5, maximumPoolSize = 10)
public class TransactionListenerImpl implements RocketMQLocalTransactionListener {
	//消息生产者需要在 executeLocalTransaction 中执行本地事务,当事务半消息提交成功，执行完毕后需要返回事务状态码
	@Override
	public RocketMQLocalTransactionState executeLocalTransaction(Message msg, Object o){
		Object num = msg.getHeaders().get("test");
		if ("1".equals(num)) {
			System.out.println( "executer: " + new String((byte[]) msg.getPayload()) + " unknown");
			return RocketMQLocalTransactionState.UNKNOWN; // 将会导致再次查询本地事务
		}else if ("2".equals(num)) {
			System.out.println( "executer: " + new String((byte[]) msg.getPayload()) + " rollback");
			return RocketMQLocalTransactionState.ROLLBACK; // 半消息将会被 mq 服务器删除，并且消费者不会消费到该消息
		}
		System.out.println( "executer: " + new String((byte[]) msg.getPayload()) + " commit");
		return RocketMQLocalTransactionState.COMMIT; // 半消息提交，消费者会消费到该消息。
	}
	//实现 checkLocalTransaction 方法，该方法用于进行本地事务执行情况回查，并回应事务状态给 MQ 的 broker
	//执行完成之后需要返回对应的事务状态码
	@Override
	public RocketMQLocalTransactionState checkLocalTransaction(Message message) {
		System.out.println("check: " + new String((byte[]) message.getPayload()));
		return RocketMQLocalTransactionState.COMMIT;
	}
}
```

## 7.构建一个简单的模型

代码如下：

## 8.测试消息的发送

```java
@RestController
public class SendMessageController {
	@Autowired 
	private SendService sendService ;
	//发送一个简单的消息
	@GetMapping("/send/simple")
	private ResponseEntity<String> sendSimpleMessage( @RequestParam(required = true) String msg) throws Exception {
		sendService.send(msg);
		return ResponseEntity.ok("发送成功") ;
	}
	//发送消息并且带上标签
	@GetMapping("/send/tags")
	private ResponseEntity<String> sendMessageWithTag( @RequestParam(required = true) String msg,@RequestParam(required = true)String tags) throws Exception {
		sendService.sendWithTags(msg,tags);
		return ResponseEntity.ok("发送成功") ;
	}
	//发送对象消息
	@GetMapping("/send/object")
	public ResponseEntity<String> sendObjectMessage(User user,String tags) throws Exception {
		sendService.sendObject(user,tags);
		return ResponseEntity.ok("发送成功") ;
	}
	//发送一个事务消息，也就是 half 消息
	@GetMapping("/send/transaction")
	public ResponseEntity<String> sendTransactionMessage(String msg ,int num) throws Exception {
		sendService.sendTransactionalMsg(msg,num);
		return ResponseEntity.ok("发送成功") ;
	}
	//发送很多消息
	@GetMapping("/send/poll")
	public ResponseEntity<String> sendMassiveMessage(String msg) throws Exception {
		sendService.sendMassiveMessage(msg);
		return ResponseEntity.ok("发送成功") ;
	}
}
```

## 9.启动类

代码如下：

```java
@SpringBootApplication 
public class RocketMQProduceApplication {
	public static void main(String[] args) {
		SpringApplication.run(RocketMQProduceApplication.class, args); 
	} 
}
```
