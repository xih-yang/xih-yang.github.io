# 11、Kafka 实战 - 服务端：轮询处理网络请求
- 来源：https://ddkk.com/zhuanlan/mq/kafka/6/11.html
- 分类：消息队列
- 分组：教程目录
> 接收器采用 Round-Robin 也就是轮询的方式分配客户端的 SocketChannel 给多个处理器，每个处理器都会有多个 SocketChannel

- 服务端的处理器会为 SocketChannel 创建一个 Kafka 通道，configureNewConnections() 会为 SocketChannel 注册读事件，创建 Kafka 通道，并绑定到选择键上

```java
/**
 * Thread that processes all requests from a single connection. There are N of these running in parallel
 * 处理来自单个连接的所有请求的线程。有N个平行的
 * each of which has its own selector
 * 每一个都有自己的选择器
 */
private[kafka] class Processor(val id: Int,requestChannel: RequestChannel,...){
  private val newConnections = new ConcurrentLinkedQueue[SocketChannel]()
  private val inflightResponses = mutable.Map[String, RequestChannel.Response]()
  private val selector = new KSelector(..., "socket-server", ..., ChannelBuilders.create(...))
  /**
   * Queue up a new connection for reading
   * 为读取新连接排队
   * Acceptor 会把多个客户端的 SocketChannel 分配给一个 Processor，这里就需要一个队列来保存新的客户端连接通道
   */
  def accept(socketChannel: SocketChannel) {
    // 把获取到的 socketChannel 存放到队列里面
    newConnections.add(socketChannel)
    // 触发选择器开始轮询，原先的轮询因为没有事件到来而阻塞
    wakeup()
  }
  /**
   * Register any new connections that have been queued up
   * 注册已排队的任何新连接，往通道注册 OP_READ 事件
   */
  private def configureNewConnections() {
    while (!newConnections.isEmpty) {
      // 从队列里弹出 socketChannel，一个 SocketChannel 只会注册一次
      val channel = newConnections.poll()
      // 从通道中获取本地服务端和远程客户端的地址和端口，构造唯一的 ConnectionId
      val connectionId = ConnectionId(localHost, localPort, remoteHost, remotePort).toString
      // 往 selector 里面进行注册
      selector.register(connectionId, channel)
    }
  }
  // java 的 Selector 类
  // 选择器注册方法，为 SocketChannel 注册读事件，并创建 Kafka 通道
  public void register(String id, SocketChannel socketChannel) throws ClosedChannelException {
        // 往 selector 里面注册 OP_READ 事件，processor 线程就可以读取客户端发送过来的连接
        SelectionKey key = socketChannel.register(nioSelector, SelectionKey.OP_READ);
        // kafka 里面对 SocketChannel 进行来封装 KafkaChannel
        KafkaChannel channel = channelBuilder.buildChannel(id, key, maxReceiveSize);
        // key 和 channel
        key.attach(channel);
        // 服务端代码和客户端网络部分的代码是复用的，channels 里面维护来多个网络连接
        this.channels.put(id, channel);
    }
}
```

- 客户端的 NetworkClient 和服务端的处理器都使用相同的选择器类(Selector)进行轮询，发送请求和响应请求都是通过选择器的轮询才会触发
- 客户端和服务端在发送请求时，会将请求加入 inFlightRequests/inFlightResponse 队列

```java
// Processor 的 run 方法
// 服务端处理器的运行方法的处理方式和客户端的轮询类似
override def run() {
    while (isRunning) {
        // setup any new connections that have been queued up
        // 设置已排队的任何新连接，读取每个 SocketChannel，都往 Selector 里面注册 OP_READ 事件
        configureNewConnections()
        // register any new responses for writing
        // 记录任何新的回复
        // TODO 处理响应
        processNewResponses()
        // 读取和发送请求的代码
        poll()
        // TODO 处理接收到的请求
        processCompletedReceives()
        // TODO 处理我们发送出去的响应
        processCompletedSends()
        processDisconnected()
    }  
    // 关闭处理器
    shutdownComplete()
}
private def processNewResponses() {
    // 有多个 processor 线程，一个线程对应一个响应队列，这个 id 就是一个 processor 线程编号
    // TODO Response 对象
    var curr = requestChannel.receiveResponse(id)
    // 只要当前处理器还有响应要发送
    while (curr != null) {
        curr.responseAction match {
          case RequestChannel.NoOpAction =>
            // There is no response to send to the client, we need to read more pipelined requests
            // 没有响应发送到客户端，我们需要读取更多的流水线请求
            // that are sitting in the server's socket buffer
            // 它们位于服务器的套接字缓冲区中
            curr.request.updateRequestMetrics
            trace("Socket server received empty response to send, registering for read: " + curr)
            // 没有响应需要发送给客户端，需要读取更多的请求，添加 OP_READ
            selector.unmute(curr.request.connectionId)
          case RequestChannel.SendAction =>
            // 有响应要发送给客户端，注册写事件，下次轮询时要把响应发送给客户端
            // 绑定 OP_WRITE
            sendResponse(curr)
          // 关闭 Socket 通信
          case RequestChannel.CloseConnectionAction =>
            curr.request.updateRequestMetrics
            trace("Closing socket connection actively according to the response code.")
            close(selector, curr.request.connectionId)
        }
    }
}
```

- 选择器轮询操作最后会返回 completedReceives 和 completedSends，分别表示接收和发送

```java
  // 服务端处理器的运行方法在调用选择器的轮询后，处理已经完成的请求接收和响应发送
  private def processCompletedReceives() {
    // 遍历每一个请求
    selector.completedReceives.asScala.foreach {
      receive =>
      try {
        val channel = selector.channel(receive.source)
        val session = RequestChannel.Session(new KafkaPrincipal(KafkaPrincipal.USER_TYPE, channel.principal.getName),
          channel.socketAddress)
        // 对于获取到到请求按照协议进行解析，解析出来的就是一个个 Request
        val req = RequestChannel.Request(processor = id, connectionId = receive.source, session = session, buffer = receive.payload, startTimeMs = time.milliseconds, securityProtocol = protocol)
        // request 请求放入队列
        requestChannel.sendRequest(req)
        // 移除 OP_READ 事件，接收到响应后就不需要再读了
        selector.mute(receive.source)
      } catch {
        case e @ (_: InvalidRequestException | _: SchemaException) =>
          // note that even though we got an exception, we can assume that receive.source is valid. Issues with constructing a valid receive object were handled earlier
          error(s"Closing socket for ${receive.source} because of error", e)
          close(selector, receive.source)
      }
    }
  }
  private def processCompletedSends() {
    selector.completedSends.asScala.foreach {
      send =>
      // 移除数据结构里面的信息
      val resp = inflightResponses.remove(send.destination).getOrElse {
        throw new IllegalStateException(s"Send for ${send.destination} completed, but not in inflightResponses")
      }
      resp.request.updateRequestMetrics()
      // 添加 OP_READ 事件，继续读取客户端请求
      selector.unmute(send.destination)
    }
  }
```

- 客户端和服务端的交互都是通过各自的选择器轮询所驱动，完整的请求和响应过程串联起来的步骤
- 客户端完成请求的发送，服务端轮询到客户端发送的请求
- 服务端接受客户端发送的请求，进行业务处理，并准备好响应结果准备发送
- 服务端完成响应的发送，客户端轮询到服务端发送的响应
- 客户端接收完服务端发送的响应，整个流程结束
