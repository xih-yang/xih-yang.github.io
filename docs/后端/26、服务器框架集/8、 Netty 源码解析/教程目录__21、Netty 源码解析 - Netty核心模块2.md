# 21、Netty 源码解析 - Netty核心模块2
- 来源：https://ddkk.com/zhuanlan/server/netty/1/21.html
- 分类：服务器框架
- 分组：教程目录
## 一、ChannelHandlerContext

1、保存 Channel 相关的所有上下文信息，同时关联一个 ChannelHandler 对象

2、ChannelHandlerContext 中包含一个具体的事件处理器 ChannelHandler，同时 ChannelHandlerContext 中也绑定了对应的 Pipeline 和 Channel 的信息，方便对 ChannelHandler 进行调用

3、常用方法：

- ChannelFuture close()：关闭通道
- ChannelHandlerContext flush()：刷新
- ChannelFuture writeAndFlush(Object msg)：将数据写到 ChannelPipeline 中当前 ChannelHandler 的下一个 ChannelHandler 开始处理（出站）

## 二、ChannelOption

1、Netty 在创建 Channel 实例后，一般都需要设置 ChannelOption 参数。

2、ChannelOption 参数如下：

- ChannelOption.SO_BACKLOG：对应TCP/IP协议 listen 函数中的 backlog 参数，用来初始化服务器可连接队列大小。服务器处理客户端连接请求是顺序处理的，所以同一时间只能处理一个客户端连接。多个客户端来的时候，服务器将不能处理的客户端连接请求放在队列中等待处理，backlog 参数指定了队列的大小。
- ChannelOption.SO_KEEPALIVE：一直保持连接活动状态

## 三、EventLoopGroup

1、EventLoopGroup 是一组 EventLoop 的抽象，Netty 为了更好的利用多核 CPU 资源，一般会有多个 EventLoop 同时工作，每个 EventLoop 维护着一个 Selector 实例。

2、EventLoopGroup 提供 next 接口，可以从组里面按照一定规则获取其中一个 EventLoop 来处理任务。在 Netty 服务器编程中，一般都需要提供两个 EventLoopGroup ，例如：BossEventLoopGroup 和 WorkerEventLoopGroup。

3、通常一个服务器端口即一个 ServerSocketChannel 对应一个 Selector 和一个 EventLoop 线程。BossEventLoop 负责接收客户端的连接并将 SocketChannel 交给 WorkerEventLoopGroup 来进行 IO 处理。如下图所示：

**1、** BossEventLoopGroup通常是一个单线程的EventLoop，EventLoop维护着一个注册了ServerSocketChannel的Selector实例，BossEventLoop不断轮询Selector将连接事件分离出来；

**2、** 通常是OP_ACCEPT事件，然后将接收到的SocketChannel交给WorkerEventLoopGroup；

**3、** WorkerEventLoopGroup会由next选择其中一个EventLoop来将这个SocketChannel注册到其维护的Selector并对其后续的IO事件进行处理；

4、常用方法：

- public NioEventLoopGroup()：构造方法
- Future`` shutdownGracefully()：断开连接，关闭线程
