# 19、Netty 源码解析 - Netty入门实例（HTTP）
- 来源：https://ddkk.com/zhuanlan/server/netty/1/19.html
- 分类：服务器框架
- 分组：教程目录
## 一、实例要求

1、使用IDEA创建Netty项目

2、Netty服务器在6668端口监听，浏览器发出请求：http://localhost:6668/

3、服务器可以回复消息给客户端：Hello！我是服务器，并对特定请求资源进行过滤

4、目的：Netty可以做Http服务开发，并且理解Handler实例和客户端及其请求的关系

## 二、代码演示

**Http服务器：**

```java
public class HttpServer {
    public static void main(String[] args) throws InterruptedException{
        EventLoopGroup bossGroup = new NioEventLoopGroup();
        EventLoopGroup workerGroup = new NioEventLoopGroup();
        try {
            ServerBootstrap servrBootstrap = new ServerBootstrap();
            servrBootstrap.group(bossGroup,workerGroup)
                    .channel(NioServerSocketChannel.class)
                    .childHandler(new HttpServerInitializer());
            ChannelFuture future = servrBootstrap.bind(1000).sync();
            future.channel().closeFuture().sync();
        }finally {
            bossGroup.shutdownGracefully();
            workerGroup.shutdownGracefully();
        }
    }
}
```

**Http服务器初始化类：**

```java
public class HttpServerInitializer extends ChannelInitializer<SocketChannel> {
    @Override
    protected void initChannel(SocketChannel ch) throws Exception {
        // 向管道加入处理器
        // 得到管道
        ChannelPipeline pipeline = ch.pipeline();
        // 加入 Netty 提供的HttpServerCodec -> [coder、decoder]
        // HttpServerCodec 说明：
        // 1. HttpServerCodec 是 Netty 提供的处理http的编解码器
        pipeline.addLast("myHttpServerCodec",new HttpServerCodec());
        // 2. 增加自定义处理器
        pipeline.addLast("myHttpServerHandler",new HttpServerHandler());
    }
}
```

**Http服务器处理器：**

```java
public class HttpServerHandler extends SimpleChannelInboundHandler<HttpObject> {
    // channelRead0 读取客户端数据
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, HttpObject msg) throws Exception {
        // 判断 msg 是不是 HttpRequst 请求
        if (msg instanceof HttpRequest){
            System.out.println("pipeline hashcode：" + ctx.pipeline().hashCode() +"，HttpServerHandler hashcode：" + this.hashCode());
            System.out.println("msg 类型：" + msg.getClass());
            System.out.println("客户端地址：" + ctx.channel().remoteAddress());
            // 获取到 HttpRequest
            HttpRequest httpRequest = (HttpRequest)msg;
            // 获取 uri，过滤指定的资源
            URI uri = new URI(httpRequest.uri());
            if("/favicon.ico".equals(uri.getPath())){
                System.out.println("请求了 favicon.ico，不做响应");
                return;
            }
            // 回复信息给浏览器[http协议]
            ByteBuf content = Unpooled.copiedBuffer("Hello！我是服务器", CharsetUtil.UTF_8);
            // 构造一个http的响应，即：HttpResponse
            FullHttpResponse response = new DefaultFullHttpResponse(HttpVersion.HTTP_1_1, HttpResponseStatus.OK, content);
            response.headers().set(HttpHeaderNames.CONTENT_TYPE,"text/plain");
            response.headers().set(HttpHeaderNames.CONTENT_LENGTH,content.readableBytes());
            // 将构建好的 response 返回
            ctx.writeAndFlush(response);
        }
    }
}
```
