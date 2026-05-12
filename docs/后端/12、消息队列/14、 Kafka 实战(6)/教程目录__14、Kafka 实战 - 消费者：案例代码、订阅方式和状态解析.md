# 14、Kafka 实战 - 消费者：案例代码、订阅方式和状态解析
- 来源：https://ddkk.com/zhuanlan/mq/kafka/6/14.html
- 分类：消息队列
- 分组：教程目录
> 消费者客户端提供的消费方式
>
>
> 订阅模式：消费者指定订阅主题，由协调者为消费者分配动态的分区
> 分配模式：消费者指定消费特定的分区，但是这个模式会失去协调者为消费者动态分配分区的功能

### 一、Java 消费者案例代码

**Consumer**

```java
public class Consumer extends ShutdownableThread {
    private final KafkaConsumer<Integer, String> consumer;
    private final String topic;
    public Consumer(String topic) {
        super("KafkaConsumerExample", false);
        Properties props = new Properties();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "DemoConsumer");
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, "true");
        props.put(ConsumerConfig.AUTO_COMMIT_INTERVAL_MS_CONFIG, "1000");
        props.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, "30000");
        // 反序列化 key value
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, "org.apache.kafka.common.serialization.IntegerDeserializer");
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, "org.apache.kafka.common.serialization.StringDeserializer");
        // 就是初始化几个核心组件
        consumer = new KafkaConsumer<>(props);
        this.topic = topic;
    }
    @Override
    public void doWork() {
        // 订阅主题
        consumer.subscribe(Collections.singletonList(this.topic));
        // 拉取消息，0.10.1.0 官方案例，更高版本该传参已作废，新版传参 Duration.ofMillis(timeout)
        ConsumerRecords<Integer, String> records = consumer.poll(1000);
        for (ConsumerRecord<Integer, String> record : records) {
            System.out.println("Received message: (" + record.key() + ", " + record.value() + ") at offset " + record.offset());
        }
    }
    @Override
    public String name() {
        return null;
    }
    @Override
    public boolean isInterruptible() {
        return false;
    }
}
```

**ShutdownableThread**

```java
abstract class ShutdownableThread(val name: String, val isInterruptible: Boolean = true)
        extends Thread(name) with Logging {
  this.setDaemon(false)
  this.logIdent = "[" + name + "], "
  val isRunning: AtomicBoolean = new AtomicBoolean(true)
  private val shutdownLatch = new CountDownLatch(1)
  def shutdown() = {
    initiateShutdown()
    awaitShutdown()
  }
  def initiateShutdown(): Boolean = {
    if(isRunning.compareAndSet(true, false)) {
      info("Shutting down")
      isRunning.set(false)
      if (isInterruptible)
        interrupt()
      true
    } else
      false
  }
    /**
   * After calling initiateShutdown(), use this API to wait until the shutdown is complete
   */
  def awaitShutdown(): Unit = {
    shutdownLatch.await()
    info("Shutdown completed")
  }
  /**
   * This method is repeatedly invoked until the thread shuts down or this method throws an exception
   * 此方法被反复调用，直到线程关闭或该方法抛出异常为止
   */
  def doWork(): Unit
  override def run(): Unit = {
    info("Starting ")
    try{
      while(isRunning.get()){
        doWork()
      }
    } catch{
      case e: Throwable =>
        if(isRunning.get())
          error("Error due to ", e)
    }
    shutdownLatch.countDown()
    info("Stopped ")
  }
}
```

### 二、消费方式

**订阅模式调用的方法：subscribe()**

```java
public void subscribe(Collection<String> topics, ConsumerRebalanceListener listener) {
	...
	if (topics.isEmpty()) {
		// treat subscribing to empty topic list as the same as unsubscribing
		// 将订阅空主题列表视为与取消订阅相同
		this.unsubscribe();
	} else {
		// 更新订阅状态对象
		this.subscriptions.subscribe(new HashSet<>(topics), listener);
		// 为元数据设置最新的主题
		metadata.setTopics(subscriptions.groupSubscription());
	}
}
```

**分配模式调用的方法：assign()**

```java
public void assign(Collection<TopicPartition> partitions) {
	...
	this.subscriptions.assignFromUser(new HashSet<>(partitions));
	// 为元数据设置最新的主题
	metadata.setTopics(topics);
}
```

- 订阅模式的参数是 topics，分配模式的参数是 partitions，都会去更新消费者订阅状态对象 SubscriptionState，assignment 保存类分配给消费者的分区到分区状态映射关系
- 分配模式一开始就确定了分区，而订阅模式需要通过消费组协调之后，才会知道自己分配到那些分区

### 三、TopicPartitionState 分区状态对象

- 更新拉取状态 position() 是为了拉取新数据，更新消费状态 committed() 是为了提交到 ZK 或协调节点
- 拉取线程工作时，要确保及时地更新分区状态的拉取偏移量，每次构建的拉取请求都以拉取偏移量为准
- seek() 可以看作是 “第一次读取 ZK” 更新拉取偏移量，position() 可以看作是 “每次拉取到消息后” 更新拉取偏移量

```java
private static class TopicPartitionState {
    // 拉取偏移量
    private Long position; // last consumed position 最后消费位置
    // 消费偏移量，提交偏移量
    private OffsetAndMetadata committed;  // last committed position 最后提交位置
    // 分区是否被暂停拉取
    private boolean paused;  // whether this partition has been paused by the user 该分区是否已被用户暂停
    // 重置策略
    private OffsetResetStrategy resetStrategy;  // the strategy to use if the offset needs resetting 需要重置偏移量时使用的策略
    public TopicPartitionState() {
        this.paused = false;
        this.position = null;
        this.committed = null;
        this.resetStrategy = null;
    }
    // 重置拉取偏移量（第一次分配给消费者时调用）
    private void awaitReset(OffsetResetStrategy strategy) {
        // 设置重置策略
        this.resetStrategy = strategy;
        // 清空 position
        this.position = null;
    }
    public boolean awaitingReset() {
        return resetStrategy != null;
    }
    // 开始重置
    private void seek(long offset) {
        // 设置 position
        this.position = offset;
        // 清空重置策略
        this.resetStrategy = null;
    }
    // 更新拉取偏移量（拉取线程在拉取到消息后调用）
    private void position(long offset) {
        // 当前 position 必须有效，才可以更新 position
        if (!hasValidPosition())
            throw new IllegalStateException("Cannot set a new position without a valid current position");
        this.position = offset;
    }
    public boolean hasValidPosition() {
        return position != null;
    }
    // 更新提交偏移量（定时提交任务调用）
    private void committed(OffsetAndMetadata offset) {
        this.committed = offset;
    }
    private boolean isFetchable() {
        // 没有暂停，且 position 有效才可以拉取
        return !paused && hasValidPosition();
    }
```

### 四、订阅状态

- 消费者在拉取消息之前，hasAllFetchPositions() 会先判断所有的分区是否都有拉取偏移量，如果没有，missingFetchPositions() 就要找出相应分区
- 分配给消费者所有分区的状态，每个分区必须指定拉取偏移量，才可以被消费者拉取
- 在拉取的时候只会选择 fetchablePartitions() 允许拉取的分区集合，不允许拉取的分区就不会拉取
- 准备拉取消息到开始拉取消息过程
- 客户端订阅主题后通过 KafkaConsumer 轮询，准备拉取消息
- 如果所有的分区都有拉取偏移量，进入最后一个步骤，如果没有则继续
- 从订阅状态的分配结果中找出所有没有拉取偏移量的分区
- 通过 updateFetchPositions() 更新没有拉取偏移量的分区
- 现在所有分区都有拉取偏移量，现在允许消费者拉取
- 对所有存在拉取偏移量并且允许拉取的分区，构建拉取请求开始拉取消息
- 注意
- 并不是每次轮询都会调用到 updateFetchPositions()，只有那些没有拉取偏移量的分区才要更新拉取偏移量

### 五、重置和更新拉取偏移量

- 拉取偏移量步骤
- 通过 ConsumerCoordinator 协调者更新分区状态的提交偏移量
- 通过 Fetcher 拉取器更新分区状态的拉取偏移量
- "拉取偏移量"是在发送拉取请求时指定从分区哪里开始拉取消息
- "提交偏移量"表示消费者处理分区消息的进度
- 消费者拉取消息时要更新拉取偏移量，处理消息时要更新提交偏移量
