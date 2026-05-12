# 16、Netty入门 - Netty心跳监测机制
- 来源：https://ddkk.com/zhuanlan/server/netty/2/16.html
- 分类：服务器框架
- 分组：教程目录
## 1.引入

在TCP 保持长连接的过程中，可能会出现断网等网络异常出现，异常发生的时候， client 与 server 之间如果没有交互的话，它们是无法发现对方已经掉线。

## 2.工作原理

在client 与 server 之间，一定时间内没有数据交互时, 即处于 idle 状态时, 客户端或服务器就会发送一个特殊的数据包给对方, 当接收方收到这个数据报文后, 也立即发送一个特殊的数据报文, 回应发送方, 此即一个 PING-PONG 交互。所以, 当某一端收到心跳消息后, 就知道了对方仍然在线, 这就确保 TCP 连接的有效性。

TCP实际上自带的就有长连接选项，本身也有心跳包机制，也就是 TCP 的选项：SO_KEEPALIVE。但是，TCP 协议层面的长连接灵活性不够。所以，一般情况下我们都是在应用层协议上实现自定义心跳机制的，也就是在 Netty 层面通过编码实现。通过 Netty 实现心跳机制的话，核心类是 IdleStateHandler 。

## 3.实现

在Netty中, 实现心跳机制的关键是 IdleStateHandler

```java
public IdleStateHandler(
            int readerIdleTimeSeconds,
            int writerIdleTimeSeconds,
            int allIdleTimeSeconds) {
        this(readerIdleTimeSeconds, writerIdleTimeSeconds, allIdleTimeSeconds,
             TimeUnit.SECONDS);
    }
```

**参数的含义：**

- **readerIdleTimeSeconds**: 读超时. 即当在指定的时间间隔内没有从 Channel 读取到数据时, 会触发一个 READER_IDLE 的 IdleStateEvent 事件.
- **writerIdleTimeSeconds**: 写超时. 即当在指定的时间间隔内没有数据写入到 Channel 时, 会触发一个 WRITER_IDLE 的 IdleStateEvent 事件.
- **allIdleTimeSeconds**: 读/写超时. 即当在指定的时间间隔内没有读或写操作时, 会触发一个 ALL_IDLE 的 IdleStateEvent 事件.

**这三个参数默认的时间单位是秒。**

## 4.案例

需求：

1、编写一个 Netty 心跳检测机制案例，当服务器超过3秒没有读时，就提示读空闲；

2、当服务器超过5秒没有写操作时，就提示写空闲；

3、实现当服务器超过7秒没有读或写操作时，就提示读写空闲。

服务器端代码：

```java
/**
 * 服务器端
 */
public class MyServer {
    public static void main(String[] args) throws InterruptedException {
        // 创建两个线程组
        NioEventLoopGroup bossGroup = new NioEventLoopGroup(1);
        NioEventLoopGroup workerGroup = new NioEventLoopGroup(8);
        try {
            ServerBootstrap serverBootstrap = new ServerBootstrap();
            serverBootstrap.group(bossGroup, workerGroup)
                    .channel(NioServerSocketChannel.class)
                    .handler(new LoggingHandler(LogLevel.INFO)) // 在bossgroup增加一个日志处理器
                    .childHandler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel ch) throws Exception {
                            ChannelPipeline pipeline = ch.pipeline();
                            // 加入 netty 提供的 IdleStateHandler
                            /**
                             * 说明
                             * 1. IdleStateHandler 是 netty 提供的处理空闲状态的处理器
                             * 2. readerIdleTime：表示多长时间没有读，就会发送一个心跳检测包，检测是否还是连接状态
                             * 3. writerIdleTime：表示多长时间没有写，就会发送一个心跳检测包，检测是否还是连接状态
                             * 4. allIdleTime：表示多长时间没有读写，就会发送一个心跳检测包，检测是否还是连接状态
                             * 5. 当 IdleStateEvent 触发后，就会传递给管道的下一个handler进行处理，通过调用（触发）下一个 handler 的userEventTrigged 方法，
                             * 在该方法中去处理 IdleStateEvent 事件
                             */
                            pipeline.addLast(new IdleStateHandler(3,5,7, TimeUnit.SECONDS));
                            // 加入一个对空闲检测进一步处理的handler（自定义）
                            pipeline.addLast(new MyServerHandler());
                        }
                    });
            ChannelFuture channelFuture = serverBootstrap.bind(7000).sync();
            channelFuture.channel().closeFuture().sync();
        }finally {
            bossGroup.shutdownGracefully();
            workerGroup.shutdownGracefully();
        }
    }
}
/**
 * 心跳处理器
 */
public class MyServerHandler extends ChannelInboundHandlerAdapter {
    /**
     *
     * @param ctx 上下文
     * @param evt 事件
     * @throws Exception 异常
     */
    @Override
    public void userEventTriggered(ChannelHandlerContext ctx, Object evt) throws Exception {
        if(evt instanceof IdleStateEvent){
            // 将 evt 向下转型
            IdleStateEvent event = (IdleStateEvent) evt;
            String eventType = null;
            switch (event.state()){
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
            System.out.println(ctx.channel().remoteAddress() + "--超时事件发生-->" + eventType);
            System.out.println("服务器做相应处理......");
        }
    }
}
```

客户端代码：

```java
/**
 * 客户端
 */
public class MyClient {
    private final String host;
    private final int port;
    public MyClient(String host, int port) {
        this.host = host;
        this.port = port;
    }
    public void run() throws InterruptedException {
        EventLoopGroup group = new NioEventLoopGroup();
        try {
            Bootstrap bootstrap = new Bootstrap();
            bootstrap.group(group)
                    .channel(NioSocketChannel.class)
                    .handler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel ch) throws Exception {
                            // 得到 pipeline
                            ChannelPipeline pipeline = ch.pipeline();
                            // 向 pipeline 加入一个解码器
                            pipeline.addLast("decoder", new StringDecoder());
                            // 向 pipeline 加入一个编码器
                            pipeline.addLast("encoder", new StringEncoder());
                            // 加入自己的业务处理 handler
                            pipeline.addLast(new GroupChatClientHandler());
                        }
                    });
            ChannelFuture channelFuture = bootstrap.connect(host, port).sync();
            // 得到channel
            Channel channel = channelFuture.channel();
            System.out.println("--------" + channel.localAddress() + "----------");
            // 客户端需要输入信息，创建扫描器 scanner
            Scanner scanner = new Scanner(System.in);
            while (scanner.hasNextLine()){
                String msg = scanner.nextLine();
                // 通过 channel 发送到服务器端
                channel.writeAndFlush(msg + "\r\n");
            }
        }finally {
            group.shutdownGracefully();
        }
    }
    public static void main(String[] args) {
        MyClient groupChatClient = new MyClient("127.0.0.1", 7000);
        try {
            groupChatClient.run();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
public class MyClientHandler extends SimpleChannelInboundHandler<String> {
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, String msg) throws Exception {
        System.out.println(msg.trim());
    }
}
```

测试：先启动服务器端，在启动客户端，测试结果如下。
