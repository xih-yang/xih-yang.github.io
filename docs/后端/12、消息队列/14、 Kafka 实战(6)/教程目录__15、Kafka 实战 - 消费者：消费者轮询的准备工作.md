# 15、Kafka 实战 - 消费者：消费者轮询的准备工作
- 来源：https://ddkk.com/zhuanlan/mq/kafka/6/15.html
- 分类：消息队列
- 分组：教程目录
> 在拉取消息前需要确保
>
>
>
> 客户端已经连接上协调者
>
>
>
> 消费者收到协调者分配给它的分区
>
>
>
> 消费者拉取消息的准备工作
>
>
>
> 连接协调者
>
>
>
> 向协调者发送请求加入消费组，从协调者获取分配的分区

### 一、消费者拉取消息前的顺序

- 消费者向协调者申请加入消费组
- 服务端存在管理消费者的协调者，协调者将消费者加入消费组
- 协调者为所有消费者分配分区
- 消费者从协调者获得分配给它的分区
- 消费者拉取分区的消息

### 二、发送请求并获取结果

- 每个消费者都要向协调者发送 JoinGroupRequest（加入消费组的请求），每个消费者从 JoinGroupResponse（加入消费组的响应）中获取分配的分区
- 流程伪代码如下，真实代码在 AbstractCoordinator 的 joinGroupIfNeeded 方法中

```java
// 消费者向协调者发送加入消费组的请求，并得到分配分区
// 发送 JoinGroup 请求
JoinGroupResponse joinResult = sendJoinGroupRequest();
// 获取分区
Assignment assignment = partitionAssignment(joinResult);
// 更新状态
subscriptions.assignFromSubscribed(assignment.partitions());
```

- 实际情况是要等待所有消费者都加入消费组后才能执行分配分区的算法，所以刚开始返回的是一个异步对象 Future

```java
// 在异步请求对象上轮询，如果没有完成，会一直循环
RequestFuture<JoinGroupResponse> future = sendJoinGroupRequest();
client.poll(future);
Assignment assignment = partitionAssignment(future.get());
```

### 三、消费者加入消费组

- 调用 ensureActiveGroup 加入消费者步骤
- 准备阶段的 onJoinPrepare
- 发起请求的 sendJoinGroupRequest
- 成功加入的 onJoinComplete

```java
// 进行加入前准备
onJoinPrepare(generation.generationId, generation.memberId);
// TODO 发送一个注册请求
joinFuture = sendJoinGroupRequest();
// 成功加入消费组
onJoinComplete(generation.generationId, generation.memberId, generation.protocol, future.value());
```

- 注意：发起请求时的成员编号是 UNKNOWN_MEMBER_ID，在第一次加入之后会返回一个实际的成员编号，后续再次加入或再平衡发生时，就需要指定实际的成员编号
- 消费者连接协调者、发送 “加入消费组” 的请求、获取分区的逻辑都在 AbstractCoordinator 中

```java
public abstract class AbstractCoordinator implements Closeable {
	// 准备加入消费组
	private boolean rejoinNeeded = true;
	// 是否需要重新加入消费组
	private boolean needsJoinPrepare = true;
	protected synchronized boolean needRejoin() {
        return rejoinNeeded;
    }
	public void ensurePartitionAssignment(){
		// 根据消费者订阅状态的变量，来判断是否需要执行重新加入消费组的逻辑
		if(subscriptions.partitionsAutoAssigned())
			ensureActiveGroup();
	}
	public void ensureActiveGroup(){
		if(!needRejoin()) return;
		if (needsJoinPrepare) {
		    // 进行加入前准备
		    onJoinPrepare(generation.generationId, generation.memberId);
		    needsJoinPrepare = false;
		}
		while (needRejoin() || rejoinIncomplete()) {
			// 再次判断是否已经确定好了 coordinator
			ensureCoordinatorReady();
			// TODO 发送加入消费者请求
			RequestFuture<ByteBuffer> future = sendJoinGroupRequest();
			client.poll(future);
			if (future.succeeded()) {
                needsJoinPrepare = true;
                // 成功加入消费组
                onJoinComplete(generation.generationId, generation.memberId, generation.protocol, future.value());
            }
		}
	}
}
```

- 确保分配到分区到执行流程
- 初始 needJoinPrepare 和 rejoinNeeded 都为 true，消费者启动时默认要加入消费组
- 满足 needRejoin()，先调用 onJoinPrepare() 做准备工作，比如提交偏移量等
- 准备工作完成后修改 needsJoinPrepare=false，防止加入消费组完成前多次执行准备工作
- 满足 needRejoin()，执行循环体：发送请求，调用一次客户端轮询尝试获取结果
- 消费者分配到分区，更新 rejoinNeeded 为 false， 并重置 needsJoinPrepare 为 true
- onJoinComplete() 方法在消费者成功加入消费组并分配到分区后，会更新订阅状态的 needsPartitionsAssigned 为 false，这个变量是判断是否要重新加入消费组
- 消费者启动的时候向 ZK 注册不同事件的监听器(比如分区变化、消费者成员变化、会话超时)，当注册的事件发生时会触发 ZKRebalanceListener 的再平衡操作
