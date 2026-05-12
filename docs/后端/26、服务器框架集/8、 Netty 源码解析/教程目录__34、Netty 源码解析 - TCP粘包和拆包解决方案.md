# 34、Netty 源码解析 - TCP粘包和拆包解决方案
- 来源：https://ddkk.com/zhuanlan/server/netty/1/34.html
- 分类：服务器框架
- 分组：教程目录
## 一、解决方案

1、使用 自定义协议 + 编解码器 来解决

2、关键就是要解决 服务器端每次读取数据长度的问题，这个问题解决，就不会出现服务器多读或少读数据的问题，从而避免了 TCP粘包和拆包

## 二、应用实例

1、要求客户端发送 5 个 Message 对象，客户端每次发送一个 Message 对象

2、服务器端每次接收一个Message，分 5 次进行解码，每读取到一个Message，会回复一个Message对象给客户端

### 2.1 协议包

```java
public class MessageProtocol {
    private int len; // 关键
    private byte[] content;
    public int getLen() {
        return len;
    }
    public void setLen(int len) {
        this.len = len;
    }
    public byte[] getContent() {
        return content;
    }
    public void setContent(byte[] content) {
        this.content = content;
    }
}
```

### 2.2 编解码器

**编码器：**

```java
public class MyMessageEncoder extends MessageToByteEncoder<MessageProtocol> {
    @Override
    protected void encode(ChannelHandlerContext ctx, MessageProtocol msg, ByteBuf out) throws Exception {
        System.out.println("MyMessageEncoder encode 方法被调用");
        out.writeInt(msg.getLen());
        out.writeBytes(msg.getContent());
    }
}
```

**解码器：**

```java
public class MyMessageDecoder extends ReplayingDecoder<Void> {
    @Override
    protected void decode(ChannelHandlerContext ctx, ByteBuf in, List<Object> out) throws Exception {
        System.out.println("MyMessageDecoder decode 被调用");
        // 需要将得到的 二进制字节码 转换成 MessageProtocol 协议包（对象）
        int length = in.readInt();
        byte[] content = new byte[length];
        in.readBytes(content);
        // 封装成 MessageProtocol 对象，放到 out 中，传递给下一个handler进行业务处理
        MessageProtocol messageProtocol = new MessageProtocol();
        messageProtocol.setLen(length);
        messageProtocol.setContent(content);
        out.add(messageProtocol);
    }
}
```

### 2.3 客户端

**客户端启动类：**

```java
public class MyClient {
    public static void main(String[] args) throws InterruptedException {
        EventLoopGroup group = new NioEventLoopGroup();
        try {
            Bootstrap bootstrap = new Bootstrap();
            bootstrap.group(group)
                    .channel(NioSocketChannel.class)
                    .handler(new MyClientInitializer()); // 自定义一个初始化类
            ChannelFuture future = bootstrap.connect("127.0.0.1", 7000).sync();
            future.channel().closeFuture().sync();
        }finally {
            group.shutdownGracefully();
        }
    }
}
```

**客户端初始化类：**

```java
public class MyClientInitializer extends ChannelInitializer<SocketChannel> {
    @Override
    protected void initChannel(SocketChannel ch) throws Exception {
        ChannelPipeline pipeline = ch.pipeline();
        pipeline.addLast(new MyMessageEncoder()); // 编码器
        pipeline.addLast(new MyMessageDecoder()); // 解码器
        pipeline.addLast(new MyClientHandler());
    }
}
```

**客户端处理器：**

```java
public class MyClientHandler extends SimpleChannelInboundHandler<MessageProtocol> {
    private int count;
    @Override
    public void channelActive(ChannelHandlerContext ctx) throws Exception {
        // 使用客户端发送10条数据：今天天气冷，吃火锅 编号
        for (int i = 0; i < 5; i++) {
            String msg = "今天天气冷，吃火锅";
            byte[] content = msg.getBytes(Charset.forName("utf-8"));
            int length = content.length;
            // 创建协议包对象
            MessageProtocol messageProtocol = new MessageProtocol();
            messageProtocol.setContent(content);
            messageProtocol.setLen(length);
            ctx.writeAndFlush(messageProtocol);
        }
    }
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, MessageProtocol msg) throws Exception {
        int len = msg.getLen();
        byte[] content = msg.getContent();
        System.out.println("客户端接收到消息如下");
        System.out.println("长度=" + len);
        System.out.println("内容=" + new String(content, Charset.forName("utf-8")));
        System.out.println("客户端接收消息数量=" + (++this.count));
    }
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        System.out.println("异常消息=" + cause.getMessage());
        ctx.close();
    }
}
```

### 2.4 服务器端

**服务器端启动类：**

```java
public class MyServer {
    public static void main(String[] args) throws InterruptedException {
        EventLoopGroup bossGroup = new NioEventLoopGroup(1);
        EventLoopGroup workerGroup = new NioEventLoopGroup();
        try {
            ServerBootstrap bootstrap = new ServerBootstrap();
            bootstrap.group(bossGroup,workerGroup)
                    .channel(NioServerSocketChannel.class)
                    .childHandler(new MyServerInitializer()); // 自定义一个初始化类
            ChannelFuture future = bootstrap.bind(7000).sync();
            future.channel().closeFuture().sync();
        }finally {
            bossGroup.shutdownGracefully();
            workerGroup.shutdownGracefully();
        }
    }
}
```

**服务器端初始化类：**

```java
public class MyServerInitializer extends ChannelInitializer<SocketChannel> {
    @Override
    protected void initChannel(SocketChannel ch) throws Exception {
        ChannelPipeline pipeline = ch.pipeline();
        pipeline.addLast(new MyMessageDecoder());// 解码器
        pipeline.addLast(new MyMessageEncoder());// 编码器 
        pipeline.addLast(new MyServerHandler());
    }
}
```

**服务器端处理器：**

```java
public class MyServerHandler extends SimpleChannelInboundHandler<MessageProtocol> {
    private int count;
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, MessageProtocol msg) throws Exception {
        // 接收到数据，并处理
        int len = msg.getLen();
        byte[] content = msg.getContent();
        System.out.println("服务器接收到消息如下");
        System.out.println("长度=" + len);
        System.out.println("内容=" + new String(content, Charset.forName("utf-8")));
        System.out.println("服务器接收到消息包数量" + (++this.count));
        // 回复消息
        String resContent = UUID.randomUUID().toString();
        byte[] resContentBytes = resContent.getBytes(Charset.forName("utf-8"));
        int resLength = resContentBytes.length;
        // 构建协议包
        MessageProtocol messageProtocol = new MessageProtocol();
        messageProtocol.setLen(resLength);
        messageProtocol.setContent(resContentBytes);
        ctx.writeAndFlush(messageProtocol);
    }
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        System.out.println("异常消息=" + cause.getMessage());
        ctx.close();
    }
}
```

### 2.5 效果演示
