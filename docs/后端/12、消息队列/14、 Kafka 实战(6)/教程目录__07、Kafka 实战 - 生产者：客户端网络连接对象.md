# 07、Kafka 实战 - 生产者：客户端网络连接对象
- 来源：https://ddkk.com/zhuanlan/mq/kafka/6/7.html
- 分类：消息队列
- 分组：教程目录
> NetworkClient 管理了客户端和服务端之间的网络通信，包括建立、发送客户端请求、读取客户端响应
>
> 在Sender 线程中主要调用 NetworkClient 的几个方法，前两个属于准备阶段，第三个才会发送客户端请求
>
>
> ready()：从 RecordAccumulator 获取准备完毕的节点，并连接所有准备好的节点
> send()：为每个节点创建一个客户端请求后存储到节点对应的通道中
> poll()：轮询动作会真正执行网络请求，包括发送请求、处理响应

### 准备发送客户端请求

- ready() 首先会判断是否已经准备好，确保消息不会发送到没有准备好的节点，准备好的会调用 selector.connect() 方法建立到目标节点的网络连接
- 建立连接后，send() 方法先将请求加入 inFlightRequests 列表，然后调用 selector.send() 方法
- inFlightRequests 是存储存还没有收到响应的请求，默认里面最多存 5 个，里面包含一个双端队列的映射结构，准备发送时先添加到对应的队列中，收到响应再移除
- 注意：这一步只是暂存请求到对应的通道中，并没有请求，NetworkClient 有一个限制条件，上一个客户端请求还没有发送完成，新的客户端请求就不允许发送

```java
/**
 * Begin connecting to the given node, return true if we are already connected and ready to send to that node.
 * 开始连接到给定的节点，如果已经连接并准备发送到该节点，则返回true。
 */
@Override
public boolean ready(Node node, long now) {
    // 是否具备需要发送消息的条件
    if (isReady(node, now))
        return true;
    // 不具备发送条件，尝试创建连接
    if (connectionStates.canConnect(node.idString(), now))
        // if we are interested in sending to a node and we don't have a connection to it, initiate one
        // 如果我们有兴趣发送到一个节点，但我们没有到它的连接，启动一个
        // 建立连接前的初始化操作
        initiateConnect(node, now);
    return false;
}
/**
 * Initiate a connection to the given node
 * 初始化到给定节点的连接
 */
private void initiateConnect(Node node, long now) {
    String nodeConnectionId = node.idString();
    try {
        this.connectionStates.connecting(nodeConnectionId, now);
        //TODO 尝试建立连接
        selector.connect(nodeConnectionId,
                         new InetSocketAddress(node.host(), node.port()),
                         this.socketSendBuffer,
                         this.socketReceiveBuffer);
    } catch (IOException e) {
		......
    }
}
/**
 * Queue up the given request for sending. Requests can only be sent out to ready nodes.
 * 将给定的请求排队发送。请求只能发送到准备就绪的节点。
 */
@Override
public void send(ClientRequest request, long now) {
    String nodeId = request.request().destination();
    doSend(request, now);
}
private void doSend(ClientRequest request, long now) {
    request.setSendTimeMs(now);
    // 往 inFlightRequests 里面存还没有收到响应的请求，里面最多 5个 请求
    this.inFlightRequests.add(request);
    // TODO
    selector.send(request.request());
}
```

### 客户端轮询并调用回调函数

- poll() 关键是调用 selector.poll()，轮询之后会调用各种处理器来处理响应
- inFlightRequests 删除对应请求
- 如果客户端发送完请求不需要响应，handleCompletedSends 在处理已经完成的发送时会将对应请求从 inFlightRequests 中删除
- 如果客户端发送完请求需要响应，只有在 handleCompletedReceives 中删除对应的请求
- 不需要响应的流程
- 开始发送请求 -> 添加请求到队列 -> 发送请求 -> 请求发送成功 -> 删除队列中的请求 -> 构造客户端响应
- 需要响应的流程
- 开始发送请求 -> 添加请求到队列 -> 发送请求 -> 请求发送成功 -> 等待响应 -> 接收响应 -> 接收到完整的响应 -> 删除队列中的请求 -> 构造客户端响应

```java
// 在 Sender 线程的最后调用的是 client.poll()
/**
 * Do actual reads and writes to sockets.
 * 对套接字进行实际读取和写入。
 */
@Override
public List<ClientResponse> poll(long timeout, long now) {
    // 封装一个拉取元数据的请求
    long metadataTimeout = metadataUpdater.maybeUpdate(now);
    try {
        // TODO 发送网络请求操作，执行网络的 IO 操作
        this.selector.poll(Utils.min(timeout, metadataTimeout, requestTimeoutMs));
    } catch (IOException e) {
        log.error("Unexpected error during I/O", e);
    }
    // process completed actions 处理完成的动作
    long updatedNow = this.time.milliseconds();
    List<ClientResponse> responses = new ArrayList<>();
    // 完成发送的处理器，处理已经完成的发送
    handleCompletedSends(responses, updatedNow);
    // 完成接收的处理器，处理已经完成的接收
    handleCompletedReceives(responses, updatedNow);
    // 断开连接的处理器
    handleDisconnections(responses, updatedNow);
    // 处理连接的处理器
    handleConnections();
    // 处理超时的处理器
    handleTimedOutRequests(responses, updatedNow);
    // invoke callbacks
    for (ClientResponse response : responses) {
        if (response.request().hasCallback()) {
            try {
                // 调用响应里面之前发送出去的请求的回调函数
                response.request().callback().onComplete(response);
            } catch (Exception e) {
                log.error("Uncaught error in request completion:", e);
            }
        }
    }
    return responses;
}
```

### 客户端请求和客户端响应的关系

```java
public final class ClientRequest {
    private final RequestSend request;
    private final RequestCompletionHandler callback;
}
public class ClientResponse {
    private final ClientRequest request;
    private final Struct responseBody;
}
```

- ClientRequest 客户端请求 包含客户端发送的请求和回调处理器(回调函数)，ClientResponse 客户端响应 包含客户端请求对象和响应结果内容
- ClientResponse 包含 ClientRequest 的目的是 根据响应获取请求中的回调对象，在收到响应后调用回调函数
- ClientResponse 和 ClientRequest 生命周期都在 NetworkClient 里
- 对象之间的关联信息
- Sender 创建的 ClientRequest 包含请求本身的回调函数
- Sender 将 ClientRequest 交给 NetworkClient 并记录目标节点和 ClientRequest 的映射关系
- NetworkClient 的轮询得到发送请求，将 ClientRequest 发送到对应的服务端目标节点
- 服务端处理 ClientRequest，将客户端响应通过服务端的请求通道返回给客户端
- NetworkClient 的轮询得到响应结果，客户端收到服务端发送过来的请求处理结果
- 由于发送到的是不同节点，收到的结果也来自不同节点，通过目标节点和 ClientRequest 的映射关系得到对应的 ClientRequest 作为 ClientResponse 成员变量
- 调用 ClientResponse.ClientRequest.Callback.onComplete() 触发回调函数
- ClientRequest 的回调函数会使用 ClientResponse 的响应结果，调用生产者应用程序自定义的回调函数
- ClientRequest 对应的底层数据来源于 Sender，ClientResponse 对应的底层数据来源于 NetworkReceive
- NetworkClient 的底层网络操作都交给了 Selector 选择器
