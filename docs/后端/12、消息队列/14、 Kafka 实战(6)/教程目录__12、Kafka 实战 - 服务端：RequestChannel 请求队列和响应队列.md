# 12、Kafka 实战 - 服务端：RequestChannel 请求队列和响应队列
- 来源：https://ddkk.com/zhuanlan/mq/kafka/6/12.html
- 分类：消息队列
- 分组：教程目录
> 在KafkaServer 中，会将 SocketServer 的请求通道传给 Kafka 请求处理线程 KafkaRequestHandler 和 KafkaApis

- 请求通道就是处理器与请求处理线程和 KafkaApis 交换数据的地方
- 如果处理器往请求通道添加请求，请求处理器线程和 KafkaApis 都可以获取到请求通道中的请求
- 如果请求处理线程和 KafkaApis 往请求通达添加响应，处理器也可以从请求通道获取响应
- 处理器会将客户端发送的请求放到全局的请求队列（requestQueue）中，提供给请求处理线程获取，请求处理线程会将请求转发给 KafkaApis 处理，最后 KafkaApis 会将处理完的响应结果放到响应队列（responseQueue）中，供处理器获取后发送给客户端

```java
// 请求通道会保存全局的请求队列和每个处理器对应的响应队列
class RequestChannel(val numProcessors: Int, val queueSize: Int) extends KafkaMetricsGroup {
  private var responseListeners: List[(Int) => Unit] = Nil
  def addResponseListener(onResponse: Int => Unit) {
    responseListeners ::= onResponse
  }
  // queueSize 默认 500，全局的请求队列
  private val requestQueue = new ArrayBlockingQueue[RequestChannel.Request](queueSize)
  // 默认情况下有 3个 processor 线程，每个处理器都有一个响应队列
  private val responseQueues = new Array[BlockingQueue[RequestChannel.Response]](numProcessors)
  for(i <- 0 until numProcessors)
    responseQueues(i) = new LinkedBlockingQueue[RequestChannel.Response]()
  /** Get the next request or block until specified time has elapsed */
  // 获取下一个请求或块，直到经过指定的时间
  // 处理器从请求队列中取出请求，队列为空会阻塞，直到有处理器加入新的请求
  def receiveRequest(timeout: Long): RequestChannel.Request = {
    // 从队列里面获取 request 对象
    requestQueue.poll(timeout, TimeUnit.MILLISECONDS)
  }
  /** Send a request to be handled, potentially blocking until there is room in the queue for the request */
  // 发送一个待处理的请求，可能会阻塞，直到队列中有空间容纳该请求
  // 如果请求队列满了，这个方法会阻塞在这里，直到有处理器取走一个请求
  def sendRequest(request: RequestChannel.Request) {
    requestQueue.put(request)
  }
  /** Get a response for the given processor if there is one */
  // 获取给定处理器的响应(如果有的话)
  def receiveResponse(processor: Int): RequestChannel.Response = {
    // 获取对应线程的对应队列里面的响应对象
    val response = responseQueues(processor).poll()
    if (response != null)
      response.request.responseDequeueTimeMs = SystemTime.milliseconds
    response
  }
    /** Send a response back to the socket server to be sent over the network */
  // 将响应发送回要通过网络发送的套接字服务器
  // 发送响应给 SocketServer，并最终通过网络返回给客户端
  def sendResponse(response: RequestChannel.Response) {
    // 响应存入一个队列里面，先从数组里面先取出对应的 Processor 队列，然后把响应放到这个队列里面
    responseQueues(response.processor).put(response)
    for(onResponse <- responseListeners)
      onResponse(response.processor)
  }
}
```

- 请求通道保存了请求和响应两种类型的队列，它的各个方法中关于请求和响应的接收和发送是有顺序的
- 发送请求-接收请求-发送响应-接收响应
- sendRequest()：处理器接收到客户端请求后，将请求放入请求队列
- receiveRequest()：请求处理线程从队列中获取请求，并交给 KafkaApis 处理
- sendResponse()：KafkaApis 处理完，将响应结果放入响应队列
- receiveResponse()：处理器从响应队列中获取响应结果发送给客户端
- 由于一个 SocketServer 有多个处理器，每个处理器都负责一部分客户端的请求，如果请求 A 发送给处理器 A，那么对应的响应也只能发送给处理器 A
- 虽然请求队列是所有处理器全局共享的，但是最后 KafkaApis 会将请求的响应都放入处理器对应的响应队列中
- 处理器的 processCompletedReceives() 会往请求通道的请求队列添加请求，processNewResponses() 从请求通道的响应队列中获取响应
