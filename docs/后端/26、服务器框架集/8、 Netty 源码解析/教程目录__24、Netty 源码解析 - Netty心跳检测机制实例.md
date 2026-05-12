# 24、Netty 源码解析 - Netty心跳检测机制实例
- 来源：https://ddkk.com/zhuanlan/server/netty/1/24.html
- 分类：服务器框架
- 分组：教程目录
## 一、实例要求

1、编写一个Netty心跳检测机制案例，当服务器超过3秒没有读时，就提示读空闲

2、当服务器超过5秒没有写操作时，就提示写空闲

3、实现当服务器超过7秒没有读或者写操作时，就提示读写空闲

## 二、服务器端

```java
public class MyServer {
    public static void main(String[] args) throws InterruptedException {
        // 创建两个线程组
        EventLoopGroup bossGroup = new NioEventLoopGroup(1);
        EventLoopGroup workerGroup = new NioEventLoopGroup(); // 8个NioEventLoop
        try {
            ServerBootstrap bootstrap = new ServerBootstrap();
            bootstrap.group(bossGroup,workerGroup)
                    .channel(NioServerSocketChannel.class)
                    .handler(new LoggingHandler(LogLevel.INFO)) // 在 bossGroup 增加一个日志处理器
                    .childHandler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel ch) throws Exception {
                            ChannelPipeline pipeline = ch.pipeline();
                            // 加入一个 netty 提供的 IdleStateHandler
                            /**
                             * 说明：
                             * 1. IdleStateHandler 是 netty 提供的处理空闲状态的处理器
                             * 2. long readerIdleTime：表示多长时间没有读，就会发送一个心跳检测包，检测是否是连接状态
                             * 3. long writerIdleTime：表示多长时间没有写，就会发送一个心跳检测包，检测是否是连接状态
                             * 4. long allIdleTime：表示多长时间没有读写，就会发送一个心跳检测包，检测是否是连接状态
                             * 5. Triggers an {@link IdleStateEvent} when a {@link Channel} has not performed read, write, or both operation for a while.
                             * 6. 当 IdleStateEvent 触发后，就会传递给管道的下一个handler去处理
                             *    通过调用（触发）下一个 handler 的 userEventTriggered，
                             *    在该方法中去处理 IdleStateEvent（读空闲、写空闲、读写空闲）
                             */
                            pipeline.addLast(new IdleStateHandler(13,5,2, TimeUnit.SECONDS));
                            // 加入一个对空闲检测进一步处理的handler（自定义）
                            pipeline.addLast(new MyServerHandler());
                        }
                    });
            // 启动服务器
            ChannelFuture future = bootstrap.bind(7000).sync();
            future.channel().closeFuture().sync();
        }finally {
            bossGroup.shutdownGracefully();
            workerGroup.shutdownGracefully();
        }
    }
}
```

```java
public class MyServerHandler extends ChannelInboundHandlerAdapter {
    /**
     * @param ctx 上下文
     * @param evt 事件
     * @throws Exception
     */
    @Override
    public void userEventTriggered(ChannelHandlerContext ctx, Object evt) throws Exception {
        if (evt instanceof IdleStateEvent) {
            // 将 event 向下转型 IdleStateEvent
            IdleStateEvent event = (IdleStateEvent) evt;
            String eventType = null;
            switch (event.state()) {
                case READER_IDLE:
                    eventType = "读空闲";
                    break;
                case WRITER_IDLE:
                    eventType = "写空闲";
                    break;
                case ALL_IDLE:
                    eventType = "读写空闲";
                    break;
            }
            System.out.println(ctx.channel().remoteAddress() + "--超时事件--" + eventType);
            System.out.println("服务器做相应的处理..");
            // 如果发生空闲，我们关闭通道
            // ctx.channel().close();
        }
    }
}
```
