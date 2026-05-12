# 15、Netty入门 - Netty应用实例-群聊系统
- 来源：https://ddkk.com/zhuanlan/server/netty/2/15.html
- 分类：服务器框架
- 分组：教程目录
## 群聊系统

需求：

1、编写一个 Netty 群聊系统，实现服务器端和客户端之间的数据简单通讯（非阻塞）；

2、实现多人群聊；

3、服务器端：可以监测用户上线，离线，并实现消息转发功能；

4、客户端：通过 channel 可以无阻塞发送消息给其它所有用户，同时可以接受其它用户发送的消息（有服务器转发得到）

5、目的：进一步理解 Netty 非阻塞网络编程机制。

服务器端代码：

```java
/**
 * 服务器端
 */
public class GroupChatServer {
    // 监听端口
    private int port;
    public GroupChatServer(int port) {
        this.port = port;
    }
    // 编写 run 方法处理客户端请求
    public void run() throws InterruptedException {
        // 创建两个线程组
        EventLoopGroup bossGroup = new NioEventLoopGroup(1);
        EventLoopGroup workerGroup = new NioEventLoopGroup(8);
        try {
            ServerBootstrap serverBootstrap = new ServerBootstrap();
            serverBootstrap.group(bossGroup, workerGroup)
                    .channel(NioServerSocketChannel.class)
                    .option(ChannelOption.SO_BACKLOG, 128)
                    .childOption(ChannelOption.SO_KEEPALIVE, true)
                    .childHandler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel ch) throws Exception {
                            // 获取到 pipeline
                            ChannelPipeline pipeline = ch.pipeline();
                            // 向 pipeline 加入一个解码器
                            pipeline.addLast("decoder", new StringDecoder());
                            // 向 pipeline 加入一个编码器
                            pipeline.addLast("encoder", new StringEncoder());
                            // 加入自己的业务处理 handler
                            pipeline.addLast(new GroupChatServerHandler());
                        }
                    });
            System.out.println("netty 服务器启动......");
            ChannelFuture channelFuture = serverBootstrap.bind(port).sync();
            // 监听关闭事件
            channelFuture.channel().closeFuture().sync();
        }finally {
            bossGroup.shutdownGracefully();
            workerGroup.shutdownGracefully();
        }
    }
    public static void main(String[] args) {
        try {
            GroupChatServer groupChatServer = new GroupChatServer(7000);
            groupChatServer.run();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
```

服务器端处理器代码：

```java
/**
 * 处理器
 */
public class GroupChatServerHandler extends SimpleChannelInboundHandler<String> {
    // 定义一个 channel 组，管理所有的 channel
    // GlobalEventExecutor.INSTANCE 是全局的事件执行器，是一个单例
    private static ChannelGroup channelGroup = new DefaultChannelGroup(GlobalEventExecutor.INSTANCE);
    SimpleDateFormat simpleDateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
    // handlerAdded 表示连接建立，一旦连接，第一个被执行
    @Override
    public void handlerAdded(ChannelHandlerContext ctx) throws Exception {
        // 将当前 channel 加入到 channelGroup
        Channel channel = ctx.channel();
        // 将该客户加入聊天的信息推送到给其他在线的客户端
        // 该方法会将 channelGroup 中所有的 channel 遍历，并发送消息，不需要自己遍历
        channelGroup.writeAndFlush("【客户端】" + channel.remoteAddress() + "加入聊天 " + simpleDateFormat.format(new Date()) + "\n");
        channelGroup.add(channel);
    }
    // 断开连接，将 xx客户离开信息推送给当前在线的客户
    @Override
    public void handlerRemoved(ChannelHandlerContext ctx) throws Exception {
        Channel channel = ctx.channel();
        channelGroup.writeAndFlush("【客户端】" + channel.remoteAddress() + "离线了~~~\n");
        System.out.println("channelGroup size: " + channelGroup.size());
    }
    // 表示 channel 处于活动状态，提示 xx上线
    @Override
    public void channelActive(ChannelHandlerContext ctx) throws Exception {
        System.out.println(ctx.channel().remoteAddress() + " 上线了~~~~");
    }
    // 表示 channel 处于非活动状态，提示 XX离线
    @Override
    public void channelInactive(ChannelHandlerContext ctx) throws Exception {
        System.out.println(ctx.channel().remoteAddress() + " 离线了~~~~");
    }
    // 读取数据
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, String msg) throws Exception {
        // 获取到当前 channel
        Channel channel = ctx.channel();
        // 这是遍历 channelGroup，根据不同的情况，回送不同的消息
        channelGroup.forEach(ch -> {
            if (channel != ch) {
                // 不是当前的 channel，直接转发消息
                ch.writeAndFlush("【客户】" + channel.remoteAddress() + " 发送了消息：" + msg + "\n");
            } else {
                ch.writeAndFlush("【自己】发送了消息：" + msg + "\n");
            }
        });
    }
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        // 关闭通道
        ctx.close();
    }
}
```

客户端代码：

```java
/**
 * 客户端
 */
public class GroupChatClient {
    private final String host;
    private final int port;
    public GroupChatClient(String host, int port) {
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
        GroupChatClient groupChatClient = new GroupChatClient("127.0.0.1", 7000);
        try {
            groupChatClient.run();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
```

客户端处理器代码：

```java
public class GroupChatClientHandler extends SimpleChannelInboundHandler<String> {
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, String msg) throws Exception {
        System.out.println(msg.trim());
    }
}
```

测试：先启动服务器端，再启动多个客户端，结果如下：
