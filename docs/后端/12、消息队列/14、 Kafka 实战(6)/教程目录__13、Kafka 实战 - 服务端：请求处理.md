# 13、Kafka 实战 - 服务端：请求处理
- 来源：https://ddkk.com/zhuanlan/mq/kafka/6/13.html
- 分类：消息队列
- 分组：教程目录
> KafkaServer 会创建请求处理线程池 KafkaRequestHandlerPool，在请求处理线程池中会创建并启动多个请求处理线程 KafkaRequestHandler
>
>
> requestHandlerPool = new KafkaRequestHandlerPool(config.brokerId, socketServer.requestChannel, apis, config.numIoThreads)
> SocketServer 中全局的请求通道会传递给每个请求处理线程，这样就能共同消费一个请求通道中的客户端请求，最后都统一交给 KafkaApis 处理

```java
// 请求通道会传递给请求处理线程池的每个请求处理线程
class KafkaRequestHandlerPool(val brokerId: Int, val requestChannel:RequestChannel,val apis: KafkaApis,numThreads: Int){
  // 创建多个线程，numThreads 默认 8，生产里面一般都需要去设置
  for(i <- 0 until numThreads) {
    // 创建线程
    runnables(i) = new KafkaRequestHandler(i, brokerId, aggregateIdleMeter, numThreads, requestChannel, apis)
    threads(i) = Utils.daemonThread("kafka-request-handler-" + i, runnables(i))
    // 启动线程
    threads(i).start()
  }
}
/**
 * A thread that answers kafka requests.
 * 一个响应kafka请求的线程。
 * 每个请求处理线程共享一个请求通道 requestChannel，在获取到请求后交给 KafkaApis 处理
 */
class KafkaRequestHandler(id: Int, brokerId: Int,apis: KafkaApis){
  def run() {
    while(true) {
      var req : RequestChannel.Request = null
        while (req == null) {
          // TODO 获取 request 对象
          req = requestChannel.receiveRequest(300)
        }
        // 交给 KafkaApis 进行最终的处理
		apis.handle(req)
    }
  }
}
```

- 服务端和网络层相关组件
- 一个 Acceptor 接收器线程、多个 Processor 处理器，一个 RequestChannel 请求通道、一个 requestQueue 请求队列、多个 responseQueue 响应队列、一个 KafkaRequestHandlerPool 请求处理线程连接池、多个 KafkaRequestHandler 请求处理线程、一个 KafkaApis 服务端请求入口
- 服务端的请求处理入口
- 客户端请求通过请求处理器交给负责具体业务逻辑处理的 KafkaApis，KafkaApis 收到请求执行完业务逻辑，将请求对应的响应结果发送到请求通道的响应队列中
- KafkaApis.handler() 方法是服务端处理各种请求的入口

不仅是客户端，Kafka 服务端节点之间的通信也会走这个统一的入口

```java
/**
 * Logic to handle the various Kafka requests
 * 处理各种 kafka 请求的逻辑
 */
class KafkaApis(val requestChannel: RequestChannel,
                val replicaManager: ReplicaManager,
                val adminManager: AdminManager,
                val coordinator: GroupCoordinator,
                val controller: KafkaController,
                val zkUtils: ZkUtils,
                val brokerId: Int,
                val config: KafkaConfig,
                val metadataCache: MetadataCache,
                val metrics: Metrics,
                val authorizer: Option[Authorizer],
                val quotas: QuotaManagers,
                val clusterId: String) extends Logging {
  /**
   * Top-level method that handles all requests and multiplexes to the right api
   * 处理到正确api的所有请求和多路复用的顶级方法
   * 服务端处理各种请求的入口
   */
  def handle(request: RequestChannel.Request) {
    ApiKeys.forId(request.requestId) match {
      // TODO 生产者发送过来的请求
      case ApiKeys.PRODUCE => handleProducerRequest(request)
      // TODO 这个 follower 发送过来拉取数据的请求（同步数据）
      case ApiKeys.FETCH => handleFetchRequest(request)
      ....
    }
  }
}
```

- 服务端接收请求放入请求通道，再到发送响应放入请求通道的过程
- 处理器接收完从客户端发送过来的 NetworkReceive 对象，解析 NetworkReceive 的内容，再加上当前处理器编号包装成 RequestChannel.Request 对象，然后将 RequestChannel.Request 放入请求通道的请求队列中

客户端发送的请求对象是 ClientRequest，但是经过网络发送给服务端后包装成 Send 对象，服务端通过处理器轮询读取请求，得到的是 NetworkReceive 对象

请求处理线程从请求通道中获取请求，并交给 KafkaApis 去处理，处理完请求后，会创建响应对象 RequestChannel.Response 并放入请求通道中

响应对象也持有请求对象的引用，因为需要获取处理器编号，确保在同一个处理器中完成

```java
// 服务端处理器的运行方法在调用选择器的轮询后，处理已经完成的请求接收和响应发送
private def processCompletedReceives() {
  // 遍历每一个请求
  selector.completedReceives.asScala.foreach {
      receive =>
    val channel = selector.channel(receive.source)
    // 对于获取到到请求按照协议进行解析，解析出来的就是一个个 Request
    val req = RequestChannel.Request(processor = id, connectionId = receive.source, session = session, buffer = receive.payload, startTimeMs = time.milliseconds, securityProtocol = protocol)
  }
}
/**
 * Handle a produce request
 * 处理生产请求
 */
def handleProducerRequest(request: RequestChannel.Request) {
  // 获取到生产者发送过来的请求信息
  val produceRequest = request.body.asInstanceOf[ProduceRequest]
  // TODO 返回响应
  // 封装了一个 Response 对象，就是服务端返回给客户端的
  requestChannel.sendResponse(new RequestChannel.Response(request, new ResponseSend(request.connectionId, respHeader, respBody)))
}
```
