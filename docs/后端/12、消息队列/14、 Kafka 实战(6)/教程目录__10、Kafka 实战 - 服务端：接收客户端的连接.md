# 10、Kafka 实战 - 服务端：接收客户端的连接
- 来源：https://ddkk.com/zhuanlan/mq/kafka/6/10.html
- 分类：消息队列
- 分组：教程目录
> Kafka 是服务端的启动类，启动类会启动 KafkaServerStartable.startup() 方法来调用 KafkaServer.startup() 启动服务
>
>
> KafkaServer 是 kafka 服务端的主类，涉及网络层的服务组件是 SocketServer、KafkaApis、KafkaRequestHandlerPool

```java
/**
 * Represents the lifecycle of a single Kafka broker. Handles all functionality required
 * 表示单个Kafka代理的生命周期。处理所有需要的功能
 * to start up and shutdown a single Kafka node.
 * 启动和关闭单个Kafka节点。
 */
class KafkaServer(val config: KafkaConfig, time: Time = SystemTime, threadNamePrefix: Option[String] = None, kafkaMetricsReporters: Seq[KafkaMetricsReporter] = List()) extends Logging with KafkaMetricsGroup {
  /**
   * Start up API for bringing up a single instance of the Kafka server.
   * 启动API，以启动Kafka服务器的单个实例。
   * Instantiates the LogManager, the SocketServer and the request handlers - KafkaRequestHandlers
   * 实例化LogManager, SocketServer和请求处理程序- KafkaRequestHandlers
   */
  def startup() {
    // NIO 服务端
	socketServer = new SocketServer(config, metrics, kafkaMetricsTime)
	socketServer.startup()
	/* start processing requests 开始处理请求 */
	apis = new KafkaApis(socketServer.requestChannel, replicaManager, adminManager, groupCoordinator, kafkaController, zkUtils, config.brokerId, config, metadataCache, metrics, authorizer, quotaManagers, clusterId)
    // TODO 处理队列里面的请求
    requestHandlerPool = new KafkaRequestHandlerPool(config.brokerId, socketServer.requestChannel, apis, config.numIoThreads)
  }
}
```

- 完成一次请求处理的具体步骤
- 客户端发起的请求被接收器 Acceptor 转发给处理器 Processor 处理
- 处理器将请求放到请求通道 RequestChannel 的全局请求队列中
- KafkaRequestHandler 取出请求通道中的客户端请求
- 调用 KafkaApis 进行业务逻辑处理
- KafkaApis 将响应结果发送给给请求通道中与处理器对应的响应队列
- 处理器从对应的响应队列中取出响应结果
- 处理器将响应结果返回给客户端，客户端请求处理完成
- SocketServer 是一个 NIO 服务，它会启动一个接收器线程 Acceptor 和多个处理器 Processor，NIO 服务用一个接收器线程负责接收请求，并分发到不同的处理器处理，这是一个典型的 Reactor 模型
- 使用 Reactor 模型并结合选择器管理多个客户端的网络连接，可以减少线程之间上下文切换和资源的开销
- SocketServer 启动方法中先创建处理器再创建接收器，把创建好的处理器作为接收器类的参数，这样接收器就可以决定将连接转发到其中一个处理器处理

```java
/**
 * An NIO socket server. The threading model is
 *   NIO 套接字服务器。线程模型
 *   1 Acceptor thread that handles new connections
 *   处理新连接的接受线程
 *   Acceptor has N Processor threads that each have their own selector and read requests from sockets
 *   Acceptor 有 N 个处理器线程，每个线程都有自己的选择器和从套接字读取请求
 *   M Handler threads that handle requests and produce responses back to the processor threads for writing.
 *   处理程序线程，处理请求并将响应返回给处理器线程进行写入。
 */
class SocketServer(val config: KafkaConfig, val metrics: Metrics, val time: Time) extends Logging with KafkaMetricsGroup {
  private val endpoints = config.listeners
  // 请求通道，与其他组件共享
  val requestChannel = new RequestChannel(totalProcessorThreads, maxQueuedRequests)
   private val processors = new Array[Processor](totalProcessorThreads)
   private[network] val acceptors = mutable.Map[EndPoint, Acceptor]()
   /**
    * Start the socket server
	* 启动套接字服务器
	*/
   def startup() {
     // 当前 broker 主机 id
     val brokerId = config.brokerId
     var processorBeginIndex = 0
     endpoints.values.foreach {
      endpoint =>
        val protocol = endpoint.protocolType
        // processorEndIndex = 0 + 3 = 3
        val processorEndIndex = processorBeginIndex + numProcessorThreads
        // 0 - 3，创建 三个 processor 线程，numProcessorThreads 配置
        for (i <- processorBeginIndex until processorEndIndex) {
          // 会创建 3个线程，默认是 3个
          // 搭建的时候会去配置这个参数
          processors(i) = newProcessor(i, connectionQuotas, protocol)
        }
        // Scala new 一个类，里面的主构造函数会去执行
        // 核心线程
        val acceptor = new Acceptor(endpoint, sendBufferSize, recvBufferSize, brokerId,
          processors.slice(processorBeginIndex, processorEndIndex), connectionQuotas)
        acceptors.put(endpoint, acceptor)
        // Utils 是一个工具类，newThread 这个方法就是用来启动线程
        Utils.newThread("kafka-socket-acceptor-%s-%d".format(protocol.toString, endpoint.port), acceptor, false).start()
        acceptor.awaitStartup()
        processorBeginIndex = processorEndIndex
      }
   }
}
```

- 接收器只管接受客户端的连接请求，并创建和客户端通信的 SocketChannel，具体发生的读写操作都和接收器无关，处理器全权负责这个通道上的操作

```java
private[kafka] class Acceptor(val endPoint: EndPoint,...){
  // 获取 Selector
  private val nioSelector = NSelector.open()
  val serverChannel = openServerSocket(endPoint.host, endPoint.port)
  def run() {
    // NIO 通信，将 serverChannel 注册在 Selector 的 OP_ACCEPT 事件上
    serverChannel.register(nioSelector, SelectionKey.OP_ACCEPT)
    startupComplete()
    var currentProcessor = 0
    // 服务不断循环
    while (isRunning) {
          // 是否有事件注册上来
          val ready = nioSelector.select(500)
          // 有事件
          if (ready > 0) {
            // 获取 key
            val keys = nioSelector.selectedKeys()
            // 遍历 key
            val iter = keys.iterator()
            while (iter.hasNext && isRunning) {
              try {
                val key = iter.next
                iter.remove()
                // 如果是客户端发送过来要进行网络连接的请求
                if (key.isAcceptable) {
                  // 处理请求，每个客户端连接通道交给不同的 Processor 处理
                  accept(key, processors(currentProcessor))
                } else
                  throw new IllegalStateException("Unrecognized key state for acceptor thread.")
                // round robin to the next processor thread
                // 循环到下一个处理器线程
                currentProcessor = (currentProcessor + 1) % processors.length
              } catch {
                case e: Throwable => error("Error while accepting connection", e)
              }
            }
          }
    }
  }
}
```

- 接收器线程启动的时候就注册 OP_ACCEPT 事件，Java 版本的生产者客户端调用 connect() 方法连接服务端时，接收器线程的选择器就会监听 OP_ACCEPT 事件
- 服务端对 OP_ACCEPT 事件处理，首先是获取绑定到选择键上的 ServerSocketChannel，调用 accept() 方法，在服务端生成一个和客户端连接的网络通道
- 从客户端建立连接到服务端接受连接的步骤
- 服务端的 ServerSocketChannel 向选择器注册 OP_ACCEPT 事件
- 客户端先选择器注册 OP_CONNECT 事件，并调用 SocketChannel.connect() 连接服务端
- 服务端的选择器监听到客户端的连接事件，接受客户端的连接
- 服务端使用 ServerSocketChannel.accept() 创建和客户端通信的 SocketChannel
- 客户端与服务端的其他事件类似操作
- 先注册相应的事件，然后选择器才有可能监听到某种类型的事件
- 客户端连接 OP_CONNECT 对应服务端接受 OP_ACCEPT，客户端 OP_WRITE 对应服务端 OP_READ，服务端写入 OP_WRITE 对应客户端 OP_READ
