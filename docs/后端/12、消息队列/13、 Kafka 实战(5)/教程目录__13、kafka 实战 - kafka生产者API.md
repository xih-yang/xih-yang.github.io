# 13、kafka 实战 - kafka生产者API
- 来源：https://ddkk.com/zhuanlan/mq/kafka/5/13.html
- 分类：消息队列
- 分组：教程目录
> kafka Producer API

### 1.消息发送流程

kafka的producer发送消息采用的是**异步发送**的方式。在消息的发送过程中，涉及到了两个线程–main线程和sender线程，以及一个线程共享变量–RecordAccumulator。main线程将消息发送给RecordAccumulator，sender线程不断从RecordAccumulator中拉取消息发送到kafka broker。

相关参数：

`batch.size`：只有数据积累到batch.size之后，sender才会发送数据

`linger.ms`：如果数据迟迟未达到batch.size，sender等待linger.ms之后就会发送数据

### 2.异步发送API

**依赖**

```java
<dependency>
    <groupId>org.apache.kafka</groupId>
    <artifactId>kafka-clients</artifactId>
    <version>0.11.0.0</version>
</dependency>
```

**服务类**

`KafkaProducer`：创建一个生产者对象，用来发送数据

`ProducerConfig`：获取kafka需要的一系列配置参数

`ProducerRecord`：每条数据都要封装成一个ProducerRecord对象

#### 2.1 不调用回到函数#

```java
public class MyProducer {
    public static void main(String[] args) throws InterruptedException {
        //1.创建kafka生产者的配置信息
        Properties properties = new Properties();
        //2.指定连接的kafka集群
        properties.put("bootstrap.servers", "hll1:9092");
        //3.ack机制
        properties.put("acks", "all");
        //4.重试次数
        properties.put("retries", 3);
        //5.批次大小,16384=16k
        properties.put("batch.size", 16384);
        //6.等待时间,时间到了之后会发送数据
        properties.put("linger.ms", 1);
        //7.RecordAccumulator缓冲区大小，33554432=32M
        properties.put("buffer.memory", 33554432);
        //8.key value的序列化类
        properties.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        properties.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        //9.创建生产者对象
        KafkaProducer<String, String> producer = new KafkaProducer<>(properties);
        //10.发送数据
        //topic信息写在ProducerRecord
        for (int i = 0; i < 10; i++) {
            producer.send(new ProducerRecord<String, String>("bigdata", "hll---" + i));
        }
        //11.关闭连接,如果不关闭连接，消费者不会接收到消息
        producer.close();
        //或者可以暂停线程，达到"linger.ms"的配置要求也可以完成消费
        //Thread.sleep(1000);
    }
}
```

启动一个消费者后再运行代码，可以看到成功消费通过代码生成的消息

#### 2.2 调用回调函数#

```java
public class CallbackProducer {
    public static void main(String[] args) {
        //创建kafka配置信息
        Properties properties = new Properties();
        properties.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "hll1:9092");
        properties.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, "org.apache.kafka.common.serialization.StringSerializer");
        properties.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, "org.apache.kafka.common.serialization.StringSerializer");
        //创建kafka生产者对象
        KafkaProducer<String, String> kafkaProducer = new KafkaProducer<String, String>(properties);
        //发送数据
        for (int i = 0; i < 10; i++) {
            kafkaProducer.send(new ProducerRecord<>("bigdata", "hll::" + i),
                    (metadata, exception) -> {
                        if (exception == null) {
                            System.out.println(metadata.partition() + "::" + metadata.offset());
                        }
                    });
        }
        //关闭资源
        kafkaProducer.close();
    }
}
```

从打印的结果来看，消息被平均的分配到了两个分区(当前测试的主题只有两个分区)

### 3.自定义分区

```java
public class MyPartitioner implements Partitioner {
    /**
     * 分区选取
     */
    @Override
    public int partition(String topic, Object key, byte[] keyBytes, Object value, byte[] valueBytes, Cluster cluster) {
        //默认分区获取方法
        //new DefaultPartitioner().partition()
        //可以实现自己分区策略,返回的需要是可用的分区的
        return 0;
    }
    @Override
    public void close() {
    }
    @Override
    public void configure(Map<String, ?> configs) {
    }
}
```

```java
public class PartitionerProducer {
    public static void main(String[] args) {
        //kafka配置文件
        Properties properties = new Properties();
        properties.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "hll1:9092");
        properties.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, "org.apache.kafka.common.serialization.StringSerializer");
        properties.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, "org.apache.kafka.common.serialization.StringSerializer");
        //自定义分区加载器
        properties.put(ProducerConfig.PARTITIONER_CLASS_CONFIG, "com.hll.partitioner.MyPartitioner");
        //创建kafka生产者
        KafkaProducer<String, String> producer = new KafkaProducer<>(properties);
        //发送数据
        for (int i = 0; i < 10; i++) {
            producer.send(new ProducerRecord<>("bigdata", "hll::" + i),
                    (metadata, exception) -> {
                        //如果exception为null，说明消息发送成功没有异常
                        if (exception == null) {
                            System.out.println(metadata.partition() + "==" + metadata.offset());
                        } else {
                            exception.printStackTrace();
                        }
                    });
        }
        //关闭连接
        producer.close();
    }
}
```

### 4.同步发送API

同步发送的意思是，一条消息发送之后，会阻塞当前线程，直到返回ack.

由于send方法返回的是一个Future对象，根据Future对象的特点，我们也可以实现同步发送的效果，只需要调用Future对象的get()方法即可。

```java
//调用get,阻塞线程，同步发送
producer.send(new ProducerRecord<String, String>("bigdata", "hll---" + i)).get();
```
