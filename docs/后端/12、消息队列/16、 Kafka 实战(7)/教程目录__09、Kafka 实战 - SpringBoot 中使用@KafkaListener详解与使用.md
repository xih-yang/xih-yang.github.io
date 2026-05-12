# 09、Kafka 实战 - SpringBoot 中使用@KafkaListener详解与使用
- 来源：https://ddkk.com/zhuanlan/mq/kafka/7/9.html
- 分类：消息队列
- 分组：教程目录
从2.2.4版开始，您可以直接在注释上指定Kafka使用者属性，这些属性将覆盖在使用者工厂中配置的具有相同名称的所有属性。您不能通过这种方式指定group.id和client.id属性。他们将被忽略；

可以使用#{…}或属性占位符（`$`{…}）在SpEL上配置注释上的大多数属性。

比如:

```java
@KafkaListener(id = "consumer-id",topics = "SHI_TOPIC1",concurrency = "${listen.concurrency:3}",
            clientIdPrefix = "myClientId")
```

对于spring.kafka.listener.concurrency=3这个参数来说，它设置的是每个@KafkaListener的并发个数。每添加一个@KafkaListener, spring-kafka都会启动concurrency条Consumer线程来监听这些topic(注解可以指定监听多个topic), 当enable-auto-commit设为true时会直接在当前线程，即kafka consumer所在线程调用我们的@KafkaListener方法，如果设为false，则是将消息投放到阻塞队列中，另一边由Listener线程取出执行，有源码为证：

所以，当concurrency=3，自动提交设置为false时，如果你程序里有两个方法标记了@KafkaListener，那么此时会启动 2 * 3 = 6 个Consumer线程，6个Listener线程。

这个信息在排查错误的时候非常重要，但官方文档居然没怎么提线程的事(不够详细)，只是在介绍KafkaContainerListener。特此记录

### @KafkaListener详解

#### id 监听器的id

①.消费者线程命名规则

填写:

2020-11-19 14:24:15 c.d.b.k.KafkaListeners 120 [INFO] 线程:Thread[consumer-id5-1-C-1,5,main]-groupId:BASE-DEMO consumer-id5 消费

没有填写ID:

2020-11-19 10:41:26 c.d.b.k.KafkaListeners 137 [INFO] 线程:Thread[org.springframework.kafka.KafkaListenerEndpointContainer#0-0-C-1,5,main] consumer-id7

②.在相同容器中的监听器ID不能重复

否则会报错

```java
Caused by: java.lang.IllegalStateException: Another endpoint is already registered with id
```

③.会覆盖消费者工厂的消费组GroupId

假如配置文件属性配置了消费组kafka.consumer.group-id=BASE-DEMO

正常情况它是该容器中的默认消费组

但是如果设置了 @KafkaListener(id = "consumer-id7", topics = {"SHI_TOPIC3"})

那么当前消费者的消费组就是consumer-id7 ;

当然如果你不想要他作为groupId的话 可以设置属性idIsGroup = false;那么还是会使用默认的GroupId;

④.如果配置了属性groupId,则其优先级最高

@KafkaListener(id = "consumer-id5",idIsGroup = false,topics = "SHI_TOPIC3",groupId = "groupId-test")

例如上面代码中最终这个消费者的消费组GroupId是 “groupId-test”

该id属性（如果存在）将用作Kafka消费者group.id属性,并覆盖消费者工厂中的已配置属性（如果存在）您还可以groupId显式设置或将其设置idIsGroup为false，以恢复使用使用者工厂的先前行为group.id。

topicPattern 匹配Topic进行监听(与topics、topicPartitions 三选一)

topicPartitions 显式分区分配

可以为监听器配置明确的主题和分区（以及可选的初始偏移量）

```java
@KafkaListener(id = "thing2", topicPartitions =
        { @TopicPartition(topic = "topic1", partitions = { "0", "1" }),
          @TopicPartition(topic = "topic2", partitions = "0",
             partitionOffsets = @PartitionOffset(partition = "1", initialOffset = "100"))
        })
public void listen(ConsumerRecord<?, ?> record) {
    ...
}
```

上面例子意思是 监听topic1的0,1分区；监听topic2的第0分区,并且第1分区从offset为100的开始消费;

#### errorHandler 异常处理

实现`KafkaListenerErrorHandler`; 然后做一些异常处理;

```java
@Component
public class KafkaDefaultListenerErrorHandler implements KafkaListenerErrorHandler {
    @Override
    public Object handleError(Message<?> message, ListenerExecutionFailedException exception) {
        return null;
    }
    @Override
    public Object handleError(Message<?> message, ListenerExecutionFailedException exception, Consumer<?, ?> consumer) {
    	//do someting
        return null;
    }
}
```

调用的时候 填写beanName;例如`errorHandler="kafkaDefaultListenerErrorHandler"`

#### containerFactory 监听器工厂

> 指定生成监听器的工厂类;

例如我写一个 批量消费的工厂类

```java
/**
 * 监听器工厂 批量消费
 * @return
 */
@Bean
public KafkaListenerContainerFactory<ConcurrentMessageListenerContainer<Integer, String>> batchFactory() {
    ConcurrentKafkaListenerContainerFactory<Integer, String> factory =
            new ConcurrentKafkaListenerContainerFactory<>();
    factory.setConsumerFactory(kafkaConsumerFactory());
    //设置为批量消费，每个批次数量在Kafka配置参数中设置ConsumerConfig.MAX_POLL_RECORDS_CONFIG
    factory.setBatchListener(true);
    return factory;
}
```

使用`containerFactory = "batchFactory"`

#### clientIdPrefix 客户端前缀

> 会覆盖消费者工厂的kafka.consumer.client-id属性; 最为前缀后面接 -n n是数字

#### concurrency并发数

会覆盖消费者工厂中的concurrency ,这里的并发数就是多线程消费; 比如说单机情况下,你设置了3; 相当于就是启动了3个客户端来分配消费分区;分布式情况 总线程数=concurrency*机器数量; 并不是设置越多越好,具体如何设置请看 属性concurrency的作用及配置(RoundRobinAssignor 、RangeAssignor)

```java
/**
 * 监听器工厂 
 * @return
 */
@Bean
public KafkaListenerContainerFactory<ConcurrentMessageListenerContainer<Integer, String>> concurrencyFactory() {
    ConcurrentKafkaListenerContainerFactory<Integer, String> factory =
            new ConcurrentKafkaListenerContainerFactory<>();
    factory.setConsumerFactory(kafkaConsumerFactory());
    factory.setConcurrency(6);
    return factory;
}
```

```java
    
    @KafkaListener(id = "consumer-id5",idIsGroup = false,topics = "SHI_TOPIC3", containerFactory = "concurrencyFactory",concurrency = "1)
```

虽然使用的工厂是concurrencyFactory(concurrency配置了6); 但是他最终生成的监听器数量 是1;

#### properties 配置其他属性

kafka中的属性看`org.apache.kafka.clients.consumer.ConsumerConfig` ;

同名的都可以修改掉;

用法

```java
@KafkaListener(id = "consumer-id5",idIsGroup = false,topics = "SHI_TOPIC3", containerFactory = "concurrencyFactory",concurrency = "1"
        , clientIdPrefix = "myClientId5",groupId = "groupId-test",
        properties = {
                "enable.auto.commit:false","max.poll.interval.ms:6000" },errorHandler="kafkaDefaultListenerErrorHandler")
```

### @KafkaListener使用

### KafkaListenerEndpointRegistry

```java
@Autowired
private KafkaListenerEndpointRegistry registry;
   //.... 获取所有注册的监听器
    registry.getAllListenerContainers();
```

#### 设置入参验证器

**当您将Spring Boot与验证启动器一起使用时，将LocalValidatorFactoryBean自动配置：如下**

```java
@Configuration
@EnableKafka
public class Config implements KafkaListenerConfigurer {
    @Autowired
    private LocalValidatorFactoryBean validator;
    ...
    @Override
    public void configureKafkaListeners(KafkaListenerEndpointRegistrar registrar) {
      registrar.setValidator(this.validator);
    }
}
```

**使用**

```java
@KafkaListener(id="validated", topics = "annotated35", errorHandler = "validationErrorHandler",
      containerFactory = "kafkaJsonListenerContainerFactory")
public void validatedListener(@Payload @Valid ValidatedClass val) {
    ...
}
@Bean
public KafkaListenerErrorHandler validationErrorHandler() {
    return (m, e) -> {
        ...
    };
}
```
