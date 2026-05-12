# 11、Netty 基础 之 Netty模型
- 来源：https://ddkk.com/zhuanlan/server/netty/4/11.html
- 分类：服务器框架
- 分组：教程目录
## 一、简单说明

**1、** 工作原理示意图；

netty主要基于主从Reactors多线程模型做了一定的改进，其中主从Reactor多线程模型有多个Reactor。

**2、** 说明；

1、BossGroup线程维护selector，只关注Accept事件。

2、当接收到Accept事件，获取到对应的socketChannel，进一步封装成NIOSocketChannel，并注册到Worker线程（事件循环），并进行维护。

3、当Worker线程监听到selector中的通道发生自己感兴趣的事件后，就进行处理（就由handler来完成）。注意handler已经加入到通道了。

## 二、详细说明

**1、** 工作原理图；

**2、** 说明；

1、netty抽象出两组线程池：BossGroup专门负责接收客户端的连接，WorkerGroup专门负责网络的读写。

2、BossGroup和WorkGroup类型都是NioEventLoopGroup。

3、NioEventLoopGroup相当于一个事件循环组，这个组中含有多个事件循环，每一个事件循环是NioEventLoop。

4、NioEventLoop表示一个不断循环的执行处理任务的线程，每个NioEventLoop都有一个selector，用于监听绑定在其上的socket网络通讯。

5、NioEventLoopGroup可以有多个线程，即可以含有多个NioEventLoop。

6、每个BossGroup下的NioEventLoop循环执行的步骤有3步：

**1、** 轮询accept事件；

**2、** 处理accept事件，与client建立连接，生成NioSocketChannel，并将其注册到某个workerNioEventLoop上的selector；

**3、** 处理任务队列的任务，即runAllTasks；

7、每个worker的NioEventLoop循环执行的步骤：

**1、** 轮询read，write事件；

**2、** 处理i/o事件，即read，write事件，对应的NioSocketChannel上处理；

**3、** 处理任务队列的任务，即runAllTasks；

8、每个Worker的NioEventLoop在处理业务时，会使用pipeline（管道），pipeline中包含了channel，即通过pipeline可以获取到对应的通道。

9、管道中维护了很多的处理器。
