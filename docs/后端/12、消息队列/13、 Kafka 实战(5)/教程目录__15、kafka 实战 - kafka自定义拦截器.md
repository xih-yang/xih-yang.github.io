# 15、kafka 实战 - kafka自定义拦截器
- 来源：https://ddkk.com/zhuanlan/mq/kafka/5/15.html
- 分类：消息队列
- 分组：教程目录
> 自定义拦截器

### 拦截器原理

Producer拦截器是在kafka 0.10版本引入的，主要用于实现clients端的定制化控制逻辑。

对于producer而言，interceptor使得用户在消息发送前以及producer回调逻辑前有机会对消息做一些定制化需求，比如修改消息等。同时，producer允许用户指定多个interceptor按序作用同一条消息从而形成一个拦截链（interceptor chain）。Interceptor的实现接口是`org.apache.kafka.clients.producer.ProducerInterceptor`

（1）configure(configs)

获取配置信息和初始化数据时调用

（2）onSend(ProducerRecord)

该方法封装进KafkaProducer.send方法中，运行在主线程中。producer确保在消息被序列化以及计算分区前调用该方法。`用户可以在该方法中对消息做任何操作，但最好保证不要修改消息所属的topic和分区`，否则会影响目标分区的计算

（3）onAcknowledgement(RecordMetadata, Exception)

`该方法会在消息从RecordAccumulator成功发送到kafka broker之后，或者在发送过程中失败时调用`。并且通常都是在producer回调逻辑触发之前，onAcknowledgement运行在IO线程中，因此不要在该方法中放入很重要的逻辑，否则会拖慢producer的消息发送效率

（4）close

`关闭interceptor，主要用于执行一些资源清理工作`，interceptor可能被运行在多线程中，因此具体实现时用户需要自行确保线程安全，另外倘若指定了多个interceptor，则producer将按照指定顺序调用他们，并仅仅是捕获每个interceptor可能抛出的异常记录到错误日志中而非向上传递。

### 拦截器案例

实现一个简单的双interceptor组成的拦截链。第一个interceptor会在消息发送前将时间戳信息追加到消息的最前部，第二个interceptor会在消息发送后更新成功发送消息数或失败发送消息数

**时间戳拦截器**

```java
public class TimeInterceptor implements ProducerInterceptor<String, String> {
    @Override
    public ProducerRecord<String, String> onSend(ProducerRecord<String, String> record) {
        //创建一个新的record，把时间戳写入到消息体的最前部
        return new ProducerRecord<String, String>(record.topic(), record.partition(), record.timestamp(),
                record.key(), System.currentTimeMillis() + "," +record.value());
    }
    @Override
    public void onAcknowledgement(RecordMetadata metadata, Exception exception) {
    }
    @Override
    public void close() {
    }
    @Override
    public void configure(Map<String, ?> configs) {
    }
}
```

**发送消息计数拦截器**

```java
public class CounterInterceptor implements ProducerInterceptor<String, String> {
    private int successCounter = 0;
    private int errorCounter = 0;
    @Override
    public ProducerRecord<String, String> onSend(ProducerRecord<String, String> record) {
        return record;
    }
    @Override
    public void onAcknowledgement(RecordMetadata metadata, Exception exception) {
        //统计消息发送成功和失败的数量
        if (exception != null) {
            errorCounter++;
        } else {
            successCounter++;
        }
    }
    @Override
    public void close() {
        //打印结果
        System.out.println("successful send:" + successCounter);
        System.out.println("failed send:" + errorCounter);
    }
    @Override
    public void configure(Map<String, ?> configs) {
    }
}
```

生产者

```java
public class InterceptorProducer {
    public static void main(String[] args) {
        //配置信息
        Properties properties = new Properties();
        //kafka连接
        properties.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "hll1:9092");
        //ack机制
        properties.put(ProducerConfig.ACKS_CONFIG, "all");
        //重试次数
        properties.put(ProducerConfig.RETRIES_CONFIG, 3);
        //批次大小
        properties.put(ProducerConfig.BATCH_SIZE_CONFIG, 16384);
        //等待时间，发送数据
        properties.put(ProducerConfig.LINGER_MS_CONFIG, 1);
        //RecordAccumulator缓冲区大小
        properties.put(ProducerConfig.BUFFER_MEMORY_CONFIG, 33554432);
        //key value序列化
        properties.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        properties.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        //构建拦截链，将写好的拦截器配置上
        List<String> interceptors = new ArrayList<>();
        interceptors.add("com.hll.interceptor.TimeInterceptor");
        interceptors.add("com.hll.interceptor.CounterInterceptor");
        properties.put(ProducerConfig.INTERCEPTOR_CLASSES_CONFIG, interceptors);
        //构建生产者
        KafkaProducer<String, String> producer = new KafkaProducer<String, String>(properties);
        for (int i=0; i<10; i++) {
            producer.send(new ProducerRecord<String, String>("bigdata", "message" + i));
        }
        //关闭producer才会调用interceptor的close方法
        producer.close();
    }
}
```

**消费者**

```java
public class MyConsumer {
    public static void main(String[] args) {
        //创建配置信息
        Properties properties = new Properties();
        //配置信息赋值
        //连接kafka集群
        properties.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "hll1:9092");
        //开启自动提交offset
        properties.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, true);
        //自动提交offset的时间间隔
        properties.put(ConsumerConfig.AUTO_COMMIT_INTERVAL_MS_CONFIG, "1000");
        //key, value的反序列化
        properties.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, "org.apache.kafka.common.serialization.StringDeserializer");
        properties.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, "org.apache.kafka.common.serialization.StringDeserializer");
        //消费者组
        properties.put(ConsumerConfig.GROUP_ID_CONFIG, "hll-group1");
        //重置消费者的offset,默认是latest
        /**
         * 重新消费一个主题的数据需要满足条件：更换一个新的消费者组(或者offset过期)，且配置auto.offset.reset=earliest
         * 配置earliest不等于offset就是0,因为之前的数据可能会被删除,offset就不是从0开始的
         */
        properties.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        //创建消费者
        KafkaConsumer<String, String> consumer = new KafkaConsumer<String, String>(properties);
        //订阅主题
        consumer.subscribe(Collections.singletonList("bigdata"));
        //循环不断拉取数据
        while (true) {
            ConsumerRecords<String, String> records = consumer.poll(100);
            for (ConsumerRecord<String, String> record : records) {
                System.out.printf("offset=%d, key=%s, value=%s%n", record.offset(), record.key(), record.value());
            }
        }
    }
}
```
