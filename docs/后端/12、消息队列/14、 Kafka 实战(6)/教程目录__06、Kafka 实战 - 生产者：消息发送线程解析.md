# 06、Kafka 实战 - 生产者：消息发送线程解析
- 来源：https://ddkk.com/zhuanlan/mq/kafka/6/6.html
- 分类：消息队列
- 分组：教程目录
> 追加消息到 RecordAccumulator 的时候会根据对应的 topic 分区信息获取队列，然后将消息放到 batches 集合中，最后使用一个 Sender 线程迭代 batches 的每个分区

### Sender 发送线程的两种发送方式

- 按照分区直接发送：有多少个分区就要发送多少次请求
- 按照分区的目标节点发送：把属于同一个节点的所有分区放在一起发送，减少网络开销

### Sender 流程

- 消息被 RecordAccumulator 按照分区追加到队列的最后一个批记录中
- Sender 通过 ready() 从 RecordAccumulator 中找出已经准备好的服务端节点
- 如果节点已经准备好，但是客户端还没有和它们建立连接，通过 connect() 建立到服务端节点的连接
- Sender 通过 drain() 从 RecordAccumulator 获取按照节点整理好的每个分区的批记录
- Sender 得到每个节点的批记录后，为每个节点创建请求，并发送到服务端

### 从 RecordAccumulator 获取数据

- 追加到 RecordAccumulator 的消息按照分区放好，发送线程读取数据的时候，RecordAccumulator **按照节点将消息重新分组** 再交给 Sender
- batches 存储结构
- 分区存储 batches：ConcurrentMap
- 节点存储 batches：Map
- 从分区存储 batches 转为节点存储 batches 流程
- 迭代分区存储 batches 的每个分区，获取 TopicPartition 对应的节点 NodeId
- 获取分区存储的批记录队列中的第一个批记录 RecordBatch
- 将相同节点的所有批记录放在一起，放入 List 中，数据结构 Map

*Sender 代码截取*

```java
void run(long now) {
	// TODO 获取元数据
	// 第一次里面没有元数据，第二次进来就有元数据
	Cluster cluster = metadata.fetch();
	// get the list of partitions with data ready to send 获取准备发送数据的分区列表
	// 判断哪些 partition 有消息可以发送，然后获取到这个 partition 的 leader partition 对应的 broker 主机
	RecordAccumulator.ReadyCheckResult result = this.accumulator.ready(cluster, now);
	// remove any nodes we aren't ready to send to 删除我们不准备发送到的所有节点
	// readyNodes 可以发送消息的
	Iterator<Node> iter = result.readyNodes.iterator();
	while (iter.hasNext()) {
        Node node = iter.next();
        // TODO 检查与要发送数据的主机的网络是否已经建立好
        if (!this.client.ready(node, now)) {
            iter.remove();
        }
    }
	/**
	 * TODO 按照 broker 进行分组，同一个 broker 的 partition 为同一组
	 * create produce requests 创建生成请求
	 * 发送的 partition 有多个，可能有一些 leader partition 在同一台服务器上面
	 * 按照 broker 进行分组，同一个 broker 的 partition 为同一组
	 *  0:[p1,p2]
	 *  1:[p3,p4,p5]
	 */
	Map<Integer, List<RecordBatch>> batches = this.accumulator.drain(cluster,result.readyNodes,this.maxRequestSize,now);
	/**
	 * TODO 创建发送消息的请求
	 * 如果网络连接没有建立好，batches 还是为空，这里也不执行
	 * 创建请求
	 *      往 partition 上面发送消息的时候，有一些 partition 在同一台服务器上，如果一个个分区发送会浪费资源
	 *      发往同一个 broker 上面 partition
	 */
	List<ClientRequest> requests = createProduceRequests(batches, now);
	for (ClientRequest request : requests)
	    // TODO 发送请求
	    client.send(request, now);
}
```

### 创建生产者客户端请求

- 从 RecordAccumulator 获取到的 batches 已经按照节点分组，produceRequest() 方法会为每个节点创建客户端请求
- 由于每个节点的 batches 批记录对应一个分区，同一个节点有多个分区，所以需要把 batches 转成 Map``

```java
// run() -> createProduceRequests() -> produceRequest()
/**
 * Create a produce request from the given record batches
 * 从给定的记录批次创建一个生产请求
 */
private ClientRequest produceRequest(long now, int destination, short acks, int timeout, List<RecordBatch> batches) {
    Map<TopicPartition, ByteBuffer> produceRecordsByPartition = new HashMap<TopicPartition, ByteBuffer>(batches.size());
    final Map<TopicPartition, RecordBatch> recordsByPartition = new HashMap<TopicPartition, RecordBatch>(batches.size());
    for (RecordBatch batch : batches) {
        // 每一个 RecordBatch 都有唯一的 TopicPartition
        TopicPartition tp = batch.topicPartition;
        // RecordBatch 的 records 是 MemoryRecords，底层是 ByteBuffer
        produceRecordsByPartition.put(tp, batch.records.buffer());
        recordsByPartition.put(tp, batch);
    }
    // 构造生产者请求，最后封装为统一的客户端请求
    ProduceRequest request = new ProduceRequest(acks, timeout, produceRecordsByPartition);
    RequestSend send = new RequestSend(Integer.toString(destination),
                                       this.client.nextRequestHeader(ApiKeys.PRODUCE),
                                       request.toStruct());
    // 封装请求里面带一个回调函数，当客户端请求完成后，会调用回调函数
    RequestCompletionHandler callback = new RequestCompletionHandler() {
        public void onComplete(ClientResponse response) {
            // 回调函数执行的方法
            handleProduceResponse(response, recordsByPartition, time.milliseconds());
        }
    };
    return new ClientRequest(now, acks != 0, send, callback);
}
```

**注意**：Sender 并不是真正负责发送客户端请求的线程，只是获取数据并创建客户端请求，然后交给 NetworkClient 客户端网络对象去发送
