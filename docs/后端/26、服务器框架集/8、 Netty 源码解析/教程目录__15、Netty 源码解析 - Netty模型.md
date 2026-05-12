# 15、Netty 源码解析 - Netty模型
- 来源：https://ddkk.com/zhuanlan/server/netty/1/15.html
- 分类：服务器框架
- 分组：教程目录
Netty主要基于主从Reactors多线程模型做了一定的改进，其中主从Reactor多线程模型有多个Reactor。

## 一、Netty模型简单版

1、BossGroup 线程维护 Selector，只关注Accept事件

2、当接收到Accept事件，获取到对应的SocketChannel，封装成NIOSocketChannel，并注册到Worker线程（事件循环）进行维护

3、当Worker线程监听到Selector中注册的通道发生事件后，就进行处理（由Handler完成），注意：Handler已经加入到通道

## 二、Netty模型进阶版

## 三、Netty模型详细版

1、Netty抽象出两组线程池BossGroup专门负责接收客户端的连接，WorkerGroup专门负责网络的读写

2、BossGroup 和 WorkerGroup 类型都是 NioEventLoopGroup

3、NioEventLoopGroup 相当于一个事件循环组，这个组中含有多个事件循环，每一个事件循环都是 NioEventLoop

4、NioEventLoop 表示一个不断循环的执行处理任务的线程，每个 NioEventLoop 都有一个 selector ，用于监听绑定在其上的socket网络通讯

5、NioEventLoopGroup 可以有多个线程，即可以含有多个 NioEventLoop

6、每个BossGroup下的NioEventLoop循环执行的步骤有三步：

**1、** 轮询accept事件；

**2、** 处理accept事件，与client建立连接，生成NioSocketChannel，并将其注册到某个WorkerGroup下的NioEventLoop上的selector；

**3、** 处理任务队列的任务，即runAllTasks；

7、每个 WorkerGroup 下的NioEventLoop循环执行的步骤：

**1、** 轮询read、write事件；

**2、** 处理IO事件，即read、write事件，在对应的NioSocketChannel进行处理；

**3、** 处理任务队列的任务，即runAllTasks；

8、每个 WorkerGroup 下的NioEventLoop在处理业务时，会使用pipeline（管道），pipeline中包含了channel，即通过pipeline可以获取到对应通道，管道中维护了很多的处理器

9、NioEventLoop 内部采用串行化设计，从消息的读取->解码->处理->编码->发送，始终由IO线程 NioEventLoop 负责

- NioEventLoopGroup 下包含多个 NioEventLoop
- 每个 NioEventLoop 中包含有一个selector、一个taskQueue
- 每个 NioEventLoop 的 selector 上可以注册监听多个 NioChannel
- 每个 NioChannel 只会绑定在唯一的 NioEventLoop 上
- 每个 NioChannel 都绑定有一个自己的 ChannelPipeline
