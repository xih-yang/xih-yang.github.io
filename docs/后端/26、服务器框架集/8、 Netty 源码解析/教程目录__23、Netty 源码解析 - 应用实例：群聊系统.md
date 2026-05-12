# 23、Netty 源码解析 - 应用实例：群聊系统
- 来源：https://ddkk.com/zhuanlan/server/netty/1/23.html
- 分类：服务器框架
- 分组：教程目录
## 一、实例要求

1、编写一个Netty群聊系统，实现服务器端和客户端之间的数据简单通讯（非阻塞）

2、实现多人聊天

3、服务器端：可以检测用户上线、离线，并实现消息转发功能

4、客户端：通过channel可以无阻塞发送消息给其它所有用户，同时可以接收其它用户发生的消息（由服务器转发得到）

5、目的：进一步理解Netty非阻塞网络编程机制

## 二、服务器端

**群聊系统服务器端：**

```java
public class GroupChatServer {
    private int port; // 监听端口
    public GroupChatServer(int port) {
        this.port = port;
    }
    // 编写run方法，处理客户端的请求
    public void run() throws InterruptedException {
        // 创建两个线程组
        EventLoopGroup bossGroup = new NioEventLoopGroup(1);
        EventLoopGroup workerGroup = new NioEventLoopGroup(); // 8个NioEventLoop
        try {
            ServerBootstrap bootstrap = new ServerBootstrap();
            bootstrap.group(bossGroup,workerGroup)
                    .channel(NioServerSocketChannel.class)
                    .option(ChannelOption.SO_BACKLOG,128)
                    .childOption(ChannelOption.SO_KEEPALIVE,true)
                    .childHandler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel ch) throws Exception {
                            // 获取到pipeline
                            ChannelPipeline pipeline = ch.pipeline();
                            // 向pipeline加入解码器
                            pipeline.addLast("decoder",new StringDecoder());
                            // 向pipeline加入编码器
                            pipeline.addLast("encoder",new StringEncoder());
                            // 加入自己的业务处理handler
                            pipeline.addLast(new GroupChatServerHandler());
                        }
                    });
            System.out.println("netty 服务器启动");
            ChannelFuture future = bootstrap.bind(port).sync();
            // 监听关闭事件
            future.channel().closeFuture().sync();
        }finally {
            bossGroup.shutdownGracefully();
            workerGroup.shutdownGracefully();
        }
    }
    public static void main(String[] args) throws InterruptedException {
        new GroupChatServer(7000).run();
    }
}
```

**群聊系统服务器端处理器：**

```java
public class GroupChatServerHandler extends SimpleChannelInboundHandler<String> {
    // 私聊解决方案，使用一个 HashMap 管理
    public static Map<String,Channel> channels = new HashMap<String,Channel>();
    // 定义一个 channel 组，管理所有的 channel
    // GlobalEventExecutor.INSTANCE：全局的事件执行器，是一个单例
    private static ChannelGroup channelGroup = new DefaultChannelGroup(GlobalEventExecutor.INSTANCE);
    SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
    // handlerAdded 表示连接建立，一旦连接，第一个被执行
    // 将当前 channel 加入到 channelGroup
    @Override
    public void handlerAdded(ChannelHandlerContext ctx) throws Exception {
        Channel channel = ctx.channel();
        // 将该客户端加入聊天的信息推送给其它在线的客户端
        /**
         * 该方法会将 channelGroup 中所有的 channel 遍历，并发送消息
         * 我们不需要自己遍历
         */
        channelGroup.writeAndFlush("[客户端]" + channel.remoteAddress() + " 加入聊天" + sdf.format(new Date()) + "\n");
        channelGroup.add(channel);
        channels.put("id100",channel);
    }
    // 断开连接，将 xx 客户端离开信息推送给当前在线的客户端
    @Override
    public void handlerRemoved(ChannelHandlerContext ctx) throws Exception {
        Channel channel = ctx.channel();
        channelGroup.writeAndFlush("[客户端]" + channel.remoteAddress() + " 离开了" + sdf.format(new Date()) + "\n");
        System.out.println("channelGroup size：" + channelGroup.size());
    }
    // 表示 channel 处于活动状态，提示 xx 上线了
    @Override
    public void channelActive(ChannelHandlerContext ctx) throws Exception {
        System.out.println(ctx.channel().remoteAddress() + " 上线了~");
    }
    // 表示 channel 处于非活动状态，提示 xx 离线了
    @Override
    public void channelInactive(ChannelHandlerContext ctx) throws Exception {
        System.out.println(ctx.channel().remoteAddress() + " 离线了");
    }
    // 读取数据
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, String msg) throws Exception {
        // 获取到当前chnanel
        Channel channel = ctx.channel();
        // 遍历 channelGroup，根据不同的情况，会送不同的消息
        channelGroup.forEach(ch -> {
            if (channel != ch) {
                ch.writeAndFlush("[客户端]" + channel.remoteAddress() + " 发送了消息" + msg + "\n");
            } else { // 回显自己发送的消息
                ch.writeAndFlush("[自己]发送了消息" + msg + "\n");
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

## 三、客户端

**群聊系统客户端：**

```java
public class GroupChatClient {
    // 属性
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
                            // 加入相关的handler
                            pipeline.addLast("decoder", new StringDecoder());
                            pipeline.addLast("encoder", new StringEncoder());
                            // 加入自定义的handler
                            pipeline.addLast(new GroupChatClientHandler());
                        }
                    });
            ChannelFuture future = bootstrap.connect(host, port).sync();
            // 得到 channle
            Channel channel = future.channel();
            System.out.println("-------" + channel.localAddress() + "-------");
            // 客户端需要输入信息，创建一个扫描器
            Scanner scanner = new Scanner(System.in);
            while (scanner.hasNextLine()) {
                String msg = scanner.nextLine();
                channel.writeAndFlush(msg + "\r\n");
            }
        } finally {
            group.shutdownGracefully();
        }
    }
    public static void main(String[] args) throws InterruptedException {
        new GroupChatClient("127.0.0.1",7000).run();
    }
}
```

**群聊系统客户端处理器：**

```java
public class GroupChatClientHandler extends SimpleChannelInboundHandler<String> {
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, String msg) throws Exception {
        System.out.println(msg.trim());
    }
}
```
