# 46、SpringCloud Alibaba RocketMQ（5）完善 rocketmq-consumer-example 项目
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/2/79.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
## 1.添加配置文件

内容如下：

```java
spring.cloud.stream.rocketmq.binder.name-server=127.0.0.1:9876
spring.cloud.stream.bindings.input1.destination=test-topic
spring.cloud.stream.bindings.input1.content-type=text/plain
spring.cloud.stream.bindings.input1.group=test-group1
spring.cloud.stream.rocketmq.bindings.input1.consumer.orderly=true
spring.cloud.stream.bindings.input2.destination=test-topic
spring.cloud.stream.bindings.input2.content-type=text/plain
spring.cloud.stream.bindings.input2.group=test-group2
spring.cloud.stream.rocketmq.bindings.input2.consumer.orderly=false
spring.cloud.stream.rocketmq.bindings.input2.consumer.tags=tagStr
spring.cloud.stream.bindings.input2.consumer.concurrency=20
spring.cloud.stream.bindings.input2.consumer.maxAttempts=1
spring.cloud.stream.bindings.input3.destination=test-topic
spring.cloud.stream.bindings.input3.content-type=application/json
spring.cloud.stream.bindings.input3.group=test-group3
spring.cloud.stream.rocketmq.bindings.input3.consumer.tags=tagObj
spring.cloud.stream.bindings.input3.consumer.concurrency=20
spring.cloud.stream.bindings.input4.destination=TransactionTopic
spring.cloud.stream.bindings.input4.content-type=text/plain
spring.cloud.stream.bindings.input4.group=transaction-group
spring.cloud.stream.bindings.input4.consumer.concurrency=5
spring.cloud.stream.bindings.input5.destination=pull-topic
spring.cloud.stream.bindings.input5.content-type=text/plain
spring.cloud.stream.bindings.input5.group=pull-topic-group
spring.application.name=rocketmq-consume-example
server.port=28082
management.endpoints.web.exposure.include=*
management.endpoint.health.show-details=always
```

## 2.添加一个 Sink

在 Sink 里面添加输入：

```java
public interface Sink {
	@Input("input1") 
	SubscribableChannel input1(); 
	@Input("input2") 
	SubscribableChannel input2(); 
	@Input("input3") 
	SubscribableChannel input3(); 
	@Input("input4") 
	SubscribableChannel input4(); 
	@Input("input5") PollableMessageSource input5(); 
}
```

## 6.3创建消息的监听器

```java
//receive
@Service
public class ReceiveService {
	@StreamListener("input1") 
	public void receiveInput1(String receiveMsg) {
		System.out.println("input1 receive: " + receiveMsg); 
	}
	@StreamListener("input2") 
	public void receiveInput2(String receiveMsg) {
		System.out.println("input2 receive: " + receiveMsg); 
	}
	@StreamListener("input3") 
	public void receiveInput3(@Payload User user) {
		System.out.println("input3 receive: " + user); 
	}
	@StreamListener("input4") 
	public void receiveTransactionalMsg(String transactionMsg) {
		System.out.println("input4 receive transaction msg: " + transactionMsg); 
	}
}
```

## 4.主动去 mq 服务器拉起消息

使用定时任务，主动去服务器拉取消息：

```java
@Service 
public class PullMessageTask {
	@Autowired 
	private Sink sink ; 
	@Scheduled(fixedRate = 5*1000) 
	public void pullMessage(){
		sink.input5().poll((message) -> {
			String payload = (String) message.getPayload(); 
			System.out.println("pull msg: " + payload); 
		}, new ParameterizedTypeReference<String>() {
		}); 
	} 
}
```

## 5.模型类

直接从 produce 里面复制过来：

## 6.配置类

新建 MQConfig：

代码如下：

```java
@Configuration 
@EnableBinding({
     Sink.class}) 
public class MQConfig {
      }
```

## 7.启动类

```java
@SpringBootApplication 
@EnableScheduling 
public class RocketMQConsumerApplication {
	public static void main(String[] args) {
		SpringApplication.run(RocketMQConsumerApplication.class ,args) ;
	}
}
```
