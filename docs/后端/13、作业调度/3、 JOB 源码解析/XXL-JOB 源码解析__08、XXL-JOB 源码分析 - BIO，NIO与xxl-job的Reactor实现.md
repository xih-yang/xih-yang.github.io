# 08、XXL-JOB 源码分析 - BIO，NIO与xxl-job的Reactor实现
- 来源：https://ddkk.com/zhuanlan/job/xxljob/2/8.html
- 分类：作业调度
- 分组：XXL-JOB 源码解析
## 一、 JAVA Sever

讲到Netty不得不提它的历史，而他产生的历史又与Java IO有着密切的联系。

### BIO与NIO

什么是BIO和NIO？

> Block IO，顾名思义，这是一种阻塞的IO方式，IO的过程无非read和write，而这两个操作在执行过程中，执行线程需要被阻塞，这就是BIO。
>
> 对应的，NIO(NonBlock IO)就是非阻塞式read和write，数据的read和write都是从计算机中的一个区域到另一个区域，这个过程内核可以处理，不需要执行线程的参与。

什么是BIO网络模型？

> 同步且阻塞：服务器端，一个线程专属一个连接，即客户端有连接请求时服务器端就需要启动一个线程进行处理。

java中的BIO实现位于核心包的Java.io，这里的实现已经属于元老级。

#### BIO实现

（这里的图解形式纠结了好久，最后还是觉得贴代码最容易理解）

- 第一步，新建ServerSocket，绑定到8080端口
- 第二步，主线程死循环等待新连接到来
- 第三步，accept方法阻塞监听端口是否连接，这里的阻塞即前文解释的执行线程被阻塞。
- 第四步，对socket的数据进行read，write并执行业务逻辑，这里使用了线程池，因为read和write也是阻塞的，如果不使用额外的线程，主线程将被阻塞。

问题:
这里我们关系的几个阻塞点，accept，read，write，由于read和write已经由线程池处理，所以阻塞主线程的问题主要在accept。 `注意，这里提到的accept，read和write指的都是系统调用`

#### NIO实现

既然accept是阻塞的，那么我们使用NIO非阻塞的实现：

- 第一步，开启一个ServerSockt并绑定端口，同时设置Blocking为false开启非阻塞。
- 第二步，死循环，此处accept已经是非阻塞了（同时server对象的read/write也是非阻塞），所以可能拿到空，需要判断有连接时才存起来。
- 第三步，将保存起来的连接使用线程池进行分别处理，一对一进行读写及业务逻辑。

问题：NIO的问题仍然在accept()，如果同一段时间有大量客户端连接，那么程序需要每次轮询都对所有的连接进行判断是否有数据请求了。

如果此时10万个连接中只有1个连接在进行数据请求，系统资源将极大的浪费。

#### IO多路复用

- 多路复用

多路复用解决了上述问题，他在accept/read/write方法之前，先使用（select()/poll()/epoll()）方法进行Socket中是否有对应的数据请求的检测。有了系统调用，程序就只需要等待回调即可，回调告诉我们是accept就进行accpet，是read/write就进行相关数据处理。

- 上述select()/poll()/epoll()三个系统调用的作用在于： `允许程序同时在多个底层文件描述符（理解成连接即可）上，等待输入的到达或输出的完成。`

三个调用的区别见下图：
- 代码Demo
- 第一步，ServerSocket绑定端口，设置非阻塞
- 第二步，开启Selector，即使用上述三个系统调用。
- 第三步，SelectionKey即为action类型（accept动作还是其他），这里进行获取类型的判断，分别进行不同的处理
- 第四步，如果是accept类型，注册一个新的socketChannel（连接）并且监听他的read动作，write动作，准备接收客户端的新数据。
- 第五步，如果是读，把需要返还给客户端的数据给到socketChannel。
- 第六步，如果是写，从socketChannel中取出数据进行处理。

## 二、 执行器源码实现——Netty

多路复用也被称为Reactor，而Netty的设计正是基于Reactor。

我们接着昨天的【xxl-job源码阅读——（七）执行器启动与动态代码加载解读】继续往下看EmbedServer的start。

- EmbedServer.start()
- 第一步，声明了bossGroup和workGroup，这是两个Reactor（多路复用模型），前者负责监听连接，后者负责处理读写和业务逻辑处理。
- 第二步，声明了一个业务连接池，这和netty无关，稍后在了解。
- 第三步，声明一个ServerBootstrap，这是一个服务启动的引导器。
- 第四步，对引导器绑定group，SocketChannel以及各种handler，这其中EmbedHttpServerHandler是xxl-job业务自定义的处理器，这部分放在本文最后一章节。`另外IdleStateHandler主要是用来检测远端是否存活；HttpServerCodec和HttpObjectAggregator是netty对http请求数据的处理类。`
- 第五步，绑定端口，并以同步方式启动服务。
- 第六步，启动xxl-job执行器的注册线程。
- 第七步，让netty服务器线程不会关闭。
- EmbedHttpServerHandler.channelRead0()

channelRead0是SimpleChannelInboundHandler方法，netty调用Handler时将会调用该方法。
- 第一步，转换编码，拿到请求数据
- 第二步，从数据中解析出xxl的token
- 第三步，使用之前定义的业务线程池执行任务。

## 三、 EmbedHttpServerHandler.process()

- process()
- 第一步，方法类型校验与token校验
- 第二步，对访问路径判断，进行不同的方法调用。这里我们只看稍微复杂的run方法。
- ExecutorBizImpl.run()
- 第一步，获取任务所对应线程，`这里能够看出，一个类型的任务对应一个执行线程`。
- 第二步，Bean模式的处理，找到业务系统自定义的jobHandler Bean。
- 第三/四步，分别时Java动态加载和脚本语言的执行，前文已经解读过了。
- 第五步，对于已在执行的同一类型任务，选择丢弃最后的还是覆盖前一个，还是并行处理。
- 第六步，注册并启动执行线程进行任务执行。
- 第七步，将结果放入全局变量triggerQueue中，表示正在被运行。

写在最后： xxl-job源码系列到此完结，已经没有什么值得单独开章的点，以后有时间再与大家一起分享其他优秀的开源框架源码。
