# 09、Kafka 实战 - 生产者：旧生产者客户端代码解析
- 来源：https://ddkk.com/zhuanlan/mq/kafka/6/9.html
- 分类：消息队列
- 分组：教程目录
> 早期旧版本的客户端采用 Scala 编写，功能比较简单，没有采用高性能的 Reactor 模式实现，也没有新版本中的回调功能

### 一、旧版消费者使用

```java
Properties props = new Properties();
props.put("metadata.broker.list", "localhost:9092");
props.put("serializer.class", "kafka.serializer.StringEncoder");
Producer<Interger, String> producer = new Producer(new ProducerConfig(props));
KeyedMessage<Integer, String> data = new KeyedMessage("myTopic", "message");
producer.send(data);
producer.close();
```

### 二、同步/异步 模式

- 小对比
- 新版本将消息封装成 ProducerRecord 传给 KafkaProducer 对象，而旧版本将消息构造成 KeyedMessage 传给 Producer 对象
- 新版本 KafkaProducer 发送消息时返回的是 Future，可以借此实现 同步/异步 模式，并且可以自定义回调方法，旧版本没有提供自定义的回调方法，但是实现了 同步/异步 模式
- 配置 props.put(“producer.type”, “sync”); 默认是 sync
- 同步模式
- 生产者类型为 sync
- 同步模式下，消息直接交给事件处理器 EventHandler 处理
- 异步模式
- 生产者类型为 async
- 异步模式有一个基于阻塞队列的生产者发送线程 ProducerSendThread
- 异步模式下，消息会先缓存到阻塞队列中，再由生产者发送线程定时取出批量消息，交给事件处理器 EventHandler 去处理

```java
class Producer[K,V](val config: ProducerConfig, private val eventHandler: EventHandler[K,V]) {
    // 阻塞队列
    private val queue = new LinkedBlockingQueue[KeyedMessage[K,V]](config.queueBufferingMaxMessages)
    // 同步/异步 模式标记
    private var sync: Boolean = true
    // 客户端设置生产者类型
    config.producerType match {
        // 同步模式
        case "sync" =>
        // 异步模式
        case "async" =>
            sync = false
            producerSendThread = new ProducerSendThread[K,V]("ProducerSendThread-" + config.clientId,
                                                                              queue,
                                                                              eventHandler,
                                                                              config.queueBufferingMaxMs,
                                                                              config.batchNumMessages,
                                                                              config.clientId)
                                                                              producerSendThread.start()
    }
    /**
      * Sends the data, partitioned by key to the topic using either the
      * synchronous or the asynchronous producer
      * 使用同步或异步生成器将按键分区的数据发送到主题
      * @param messages the producer data object that encapsulates the topic, key and message data
      */
      def send(messages: KeyedMessage[K,V]*) {
          lock synchronized {
          // 先判断是否已经 close
          if (hasShutdown.get)
              throw new ProducerClosedException
          // 消息 topic 状态
          recordStats(messages)
          // 同步/异步模式
          if (sync)
              eventHandler.handle(messages)
          else
              asyncSend(messages)
          }
      }
}
```

### 三、事件处理器处理客户端发送的消息

- 发送流程对比
- 新版本：将消息保存到记录收集器的不同分区中，每个分区都有一个存储批记录的队列，发送线程获取记录收集器的数据时，按照节点不同的分区进行分组，针对每个节点创建一个客户端请求
- 旧版本：对消息集序列化，然后通过 dispatchSerializedData() 方法分发序列化的消息，消息有可能会失败，如果分发序列化消息的方法有返回值，说明还有未完成的发送数据，就要重试

```java
def handle(events: Seq[KeyedMessage[K,V]]) {
    // 序列化事件
    val serializedData = serialize(events)
    // 未完成的请求
    var outstandingProduceRequests = serializedData
    while (remainingRetries > 0 && outstandingProduceRequests.nonEmpty) {
        // 分发数据，将最原始无序的消息按照 Broker - 分区 - MessageSet 分组
        outstandingProduceRequests = dispatchSerializedData(outstandingProduceRequests)
        // 有返回值表示出错未完成，继续重试
        if (outstandingProduceRequests.nonEmpty) {
            // 重试次数 -1
            remainingRetries -= 1
        }
    }
}
```

- 旧版本使用阻塞队列来存储所有消息，所有消息共用一个队列，只有在发送的时候才按照节点和分区进行分组，不管有没有满，属于同一个节点的所有分区消息都会一起被发送
- 分发序列化消息步骤
- 将消息序列按照节点和分区分组，每个节点都有一个 messagesPerBrokerMap 字典
- 将每个节点包括多分区的 messagesPerBrokerMap 原始消息，转换成 MessageSet
- 调用 send() 方法，向每个节点发送序列化后的消息集(MessageSet)

```java
private def dispatchSerializedData(messages: Seq[KeyedMessage[K,Message]]): Seq[KeyedMessage[K, Message]] = {
    // 对原始消息集进行分区和整理
    val partitionedDataOpt = partitionAndCollate(messages)
    val failedProduceRequests = new ArrayBuffer[KeyedMessage[K, Message]]
    // 按照节点和分区进行分组
	for ((brokerid, messagesPerBrokerMap) <- partitionedData) {
	  if (logger.isTraceEnabled) {
	    messagesPerBrokerMap.foreach(partitionAndEvent =>
	      trace("Handling event for Topic: %s, Broker: %d, Partitions: %s".format(partitionAndEvent._1, brokerid, partitionAndEvent._2)))
	  }
	  // 将 KeyedMessage 序列转换成 ByteBufferMessageSet 对象
	  val messageSetPerBrokerOpt = groupMessagesToSet(messagesPerBrokerMap)
	  messageSetPerBrokerOpt match {
	    case Some(messageSetPerBroker) =>
	      // 发送消息
	      val failedTopicPartitions = send(brokerid, messageSetPerBroker)
	      // 发送失败的分区
	      failedTopicPartitions.foreach(topicPartition => {
	        // 添加到失败列表重试
	        messagesPerBrokerMap.get(topicPartition) match {
	          case Some(data) => failedProduceRequests.appendAll(data)
	          // 没有失败的记录，所有消息发送成功
	          case None => // nothing
	        }
	      })
	    case None => // failed to group messages
	      messagesPerBrokerMap.values.foreach(m => failedProduceRequests.appendAll(m))
	  }
	}
	failedProduceRequests
}
```

- 新版本采用 NetworkClient 和 Reactor 模式将客户端请求发送到多个服务端节点，旧版本只能在客户端维护每个目标节点的网络连接
- 生产者连接池中保存了 BrokerId 到一个生产者网络连接对象 SyncProducer 的映射关系
- send() 会根据目标节点，从连接池获取生产者网络连接对象，将生产者请求发送给目标节点

```java
private def send(brokerId: Int, messagesPerTopic: collection.mutable.Map[TopicAndPartition, ByteBufferMessageSet]) = {
	// 创建生产者请求
    val producerRequest = new ProducerRequest(currentCorrelationId, config.clientId, config.requestRequiredAcks,config.requestTimeoutMs, messagesPerTopic)
    // 从连接池获取生产者
	val syncProducer = producerPool.getProducer(brokerId)
	// 发送生产者请求
	val response = syncProducer.send(producerRequest)
	val failedPartitionsAndStatus = response.status.filter(_._2.error != Errors.NONE.code).toSeq
	failedTopicPartitions = failedPartitionsAndStatus.map(partitionStatus => partitionStatus._1)
	failedTopicPartitions
}
```

### 四、对消息集按照节点和分区进行整理

- 生产者的消息集 messages 没有区分主题和分区，所以在分发数据的时候对每条消息选择所属的分区，重新按照消息代理节点组织数据
- partitionAndCollate() 方法对原始的消息集进行分区和整理
- 获取对应主题的分区集合
- 分区器从分区集合中为消息选择一个分区编号
- 获取选择的分区以及分区里面的主副本节点
- 构造 “消息代理节点编号 -> 分区 -> 消息集” 的字典数据结构

```java
// 对原始数据集进行分区和整理，输入消息是无序的，输出结果按照节点分组，再按照 TopicAndPartition(TAP) 分组
def partitionAndCollate(messages: Seq[KeyedMessage[K,Message]]): Option[Map[Int, collection.mutable.Map[TopicAndPartition, Seq[KeyedMessage[K,Message]]]]] = {
  // 消息代理节点编号 -> 分区 -> 消息集
  val ret = new HashMap[Int, collection.mutable.Map[TopicAndPartition, Seq[KeyedMessage[K,Message]]]]
  // 遍历每一条消息
  for (message <- messages) {
    // 一个 topic 有多个 partition
    val topicPartitionsList = getPartitionListForTopic(message)
    // 一条消息只会写到一个 partition，根据分区器分到一个分区编号
    val partitionIndex = getPartition(message.topic, message.partitionKey, topicPartitionsList)
    val brokerPartition = topicPartitionsList(partitionIndex)
    // postpone the failure until the send operation, so that requests for other brokers are handled correctly
    // 将失败推迟到发送操作，以便正确处理对其他代理的请求
    // 一个分区有副本，但写的时候只写到主副本所在的节点
    val leaderBrokerId = brokerPartition.leaderBrokerIdOpt.getOrElse(-1)
    // dataPerBroker 是每个 Broker 的数据，ret 是最后的返回值，包含每个 Broker 的数据
    var dataPerBroker: HashMap[TopicAndPartition, Seq[KeyedMessage[K,Message]]] = null
    ret.get(leaderBrokerId) match {
      case Some(element) =>
        dataPerBroker = element.asInstanceOf[HashMap[TopicAndPartition, Seq[KeyedMessage[K,Message]]]]
      // Broker 不存在里层 Map，创建一个新的 Map，并放入 ret 里
      case None =>
        dataPerBroker = new HashMap[TopicAndPartition, Seq[KeyedMessage[K,Message]]]
        ret.put(leaderBrokerId, dataPerBroker)
    }
    val topicAndPartition = TopicAndPartition(message.topic, brokerPartition.partitionId)
    // Broker 对应的消息集，相同的 Broker 下 topic-partition 不一定相同
    var dataPerTopicPartition: ArrayBuffer[KeyedMessage[K,Message]] = null
    dataPerBroker.get(topicAndPartition) match {
      case Some(element) =>
        dataPerTopicPartition = element.asInstanceOf[ArrayBuffer[KeyedMessage[K,Message]]]
      // 分区消息集不存在，创建一个列表，并放入这个 Broker 数据
      case None =>
        dataPerTopicPartition = new ArrayBuffer[KeyedMessage[K,Message]]
        dataPerBroker.put(topicAndPartition, dataPerTopicPartition)
    }
    // 真正将消息添加到集合中
    dataPerTopicPartition.append(message)
  }
  Some(ret)
}
```

- 在实际处理时要针对消息 KeyedMessage 的 Seq 集合封装成更高层的 MessageSet，groupMessagesToSet() 会将每个分区的消息集转换成 ByteBufferMessageSet

```java
// 将 KeyedMessage 序列转换成 ByteBufferMessageSet 对象
private def groupMessagesToSet(messagesPerTopicAndPartition: collection.mutable.Map[TopicAndPartition, Seq[KeyedMessage[K, Message]]]) = {
	val messagesPerTopicPartition = messagesPerTopicAndPartition.map {
	    case (topicAndPartition, messages) =>
	    // KeyedMessage 包括了 Key、Value，其中 message 就是 value 的原始数据
	    val rawMessages = messages.map(_.message)
	    (topicAndPartition, config.compressionCodec match {
	        case NoCompressionCodec => new ByteBufferMessageSet(NoCompressionCodec, rawMessages: _*)
	        case _ => new ByteBufferMessageSet(config.compressionCodec, rawMessages: _*)
	    )
  }
  Some(messagesPerTopicPartition)
}
```

- 旧版本的和新版本的分区器对有 key 的操作类似，相同 key 会被分配到同一个分区，没有 Key 的话旧版本是将消息发送到 sendPartitionPerTopicCache 缓存，缓存没有更新前相同主题会发往相同分区，只有刷新缓存的时候才可能被定位到其他分区，不是严格意义上的随机分配

```java
  private def getPartition(topic: String, key: Any, topicPartitionList: Seq[PartitionAndLeader]): Int = {
    val numPartitions = topicPartitionList.size
    if(numPartitions <= 0)
      throw new UnknownTopicOrPartitionException("Topic " + topic + " doesn't exist")
    val partition =
      if(key == null) {
        // If the key is null, we don't really need a partitioner
        // 如果键为空，我们实际上不需要分区器
        // So we look up in the send partition cache for the topic to decide the target partition
        // 因此，我们在发送分区缓存中查找主题，以确定目标分区
        val id = sendPartitionPerTopicCache.get(topic)
        id match {
          case Some(partitionId) =>
            // directly return the partitionId without checking availability of the leader,
            // since we want to postpone the failure until the send operation anyways
            partitionId
          case None =>
            // 存在副本的分区，类似于 Cluster 中的 availablePartitionsByTopic
            val availablePartitions = topicPartitionList.filter(_.leaderBrokerIdOpt.isDefined)
            if (availablePartitions.isEmpty)
              throw new LeaderNotAvailableException("No leader for any partition in topic " + topic)
            // 随机选择一个分区并放到缓存中，在缓存没有刷新时，相同主题只使用一个分区
            val index = Utils.abs(Random.nextInt) % availablePartitions.size
            val partitionId = availablePartitions(index).partitionId
            sendPartitionPerTopicCache.put(topic, partitionId)
            partitionId
        }
      } else
        partitioner.partition(key, numPartitions)
    partition
}
```

### 五、生产者使用阻塞通道发送请求

- 新版本的生产者客户端用选择器来维护多个节点的网络连接，旧版本使用连接池的方式(实际上就是一个 Map)，为每个节点创建一个 SyncProducer，根据目标节点编号，获取对应的 SyncProducer，使用阻塞通道 BlockingChannel 来发送请求和读取响应结果
- 客户端发送请求时用 requiredAcks 参数表示是否需要应答
- 如果需要应答，会读取服务端返回的响应内容，设置到 ProducerResponse 对象中
- 不需要应答，send() 方法会返回 null

```java
class SyncProducer(val config: SyncProducerConfig) extends Logging {
	private val blockingChannel = new BlockingChannel(config.host, config.port, BlockingChannel.UseDefaultBufferSize, config.sendBufferBytes, config.requestTimeoutMs)
	/**
   * Send a message. If the producerRequest had required.request.acks=0, then the
   * 发送一个信息。如果 producerRequest require.request.acks = 0，然后
   * returned response object is null
   * 返回的响应对象为空
   */
  def send(producerRequest: ProducerRequest): ProducerResponse = {
  	...
  	response = doSend(producerRequest, if(producerRequest.requiredAcks == 0) false else true)
  	if(producerRequest.requiredAcks != 0) {
      val producerResponse = ProducerResponse.readFrom(response.payload)
      producerRequestStats.getProducerRequestStats(config.host, config.port).throttleTimeStats.update(producerResponse.throttleTime, TimeUnit.MILLISECONDS)
      producerRequestStats.getProducerRequestAllBrokersStats.throttleTimeStats.update(producerResponse.throttleTime, TimeUnit.MILLISECONDS)
      producerResponse
    }
    else
      null
  }
  /**
   * Common functionality for the public send methods
   * 公共发送方法的通用功能
   */
  private def doSend(request: RequestOrResponse, readResponse: Boolean = true): NetworkReceive = {
  	// 准备 NetworkReceive，读取服务端响应
	var response: NetworkReceive = null
	// 向阻塞类型的连接通道发送请求
    blockingChannel.send(request)
    if(readResponse) {
      // 从阻塞通道读取响应
      response = blockingChannel.receive()
    }
  }
}
```

- 读写操作使用的阻塞通道都来自 SocketChannel，send 会发送一个完整的 Send 对象，receive 会读取一个完整的 NetworkReceive 对象

```java
/**
 *  A simple blocking channel with timeouts correctly enabled.
 *  正确启用超时的简单阻塞通道。
 *  阻塞通道表示客户端和目标节点建立的网络连接通道
 */
 class BlockingChannel(...) {
 	private var channel: SocketChannel = null
 	private var readChannel: ReadableByteChannel = null
	private var writeChannel: GatheringByteChannel = null
	def connect() = lock synchronized  {
		if(!connected) {
			channel = SocketChannel.open()
			channel.configureBlocking(true)
			channel.socket.connect(new InetSocketAddress(host, port), connectTimeoutMs)
			writeChannel = channel
			readChannel = Channels.newChannel(channel.socket().getInputStream)
		}
	}
	def send(request: RequestOrResponse): Long = {
	    val send = new RequestOrResponseSend(connectionId, request)
    	send.writeCompletely(writeChannel)// 写到通道中
    }
    def receive(): NetworkReceive = {
	    val response = readCompletely(readChannel)
	    response.payload().rewind()// 读取到 ByteBuffer，回到缓冲区最开始，便于读取
	    response// 返回响应，如果客户端需要应答，直接使用 response.payload
    }
    private def readCompletely(channel: ReadableByteChannel): NetworkReceive = {
	    val response = new NetworkReceive
	    while (!response.complete())
	      response.readFromReadableChannel(channel)// 从只读通道中读取数据
	    response
    }
 }
```

- 旧版本和新版本的 Kafka 通道功能类似，都和原始的通道操作有关，两个版本的生产者请求对象都继承来 Send 接口，读取响应的时候都使用来相同的 NetworkReceive 类来保存服务端的响应结果
