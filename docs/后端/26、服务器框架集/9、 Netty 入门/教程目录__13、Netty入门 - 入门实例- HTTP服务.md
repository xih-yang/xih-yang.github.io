# 13、Netty入门 - 入门实例- HTTP服务
- 来源：https://ddkk.com/zhuanlan/server/netty/2/13.html
- 分类：服务器框架
- 分组：教程目录
## 1.案例需求

**1、** 使用Idea创建Netty项目；

**2、** Netty服务器在6668端口监听，浏览器发出请求“[http://localhost:6668/](http://localhost:6668/)”；

**3、** 服务器可以回复消息给客户端"Hello！我是服务器5"，并对特定请求资源进行过滤；

**4、** 目的：Netty可以做Http服务开发，并且理解Handler实例和客户端及其请求的关系；

## 2.代码实现

## 2.1总体思路

- 步骤一：创建两个线程组 BossGroup 和 WorkerGroup，他们的类型都是 NioEventLoopGroup。bossGroup 只处理连接请求，workerGroup 处理客户端业务。
- 步骤二：创建服务器端启动对象 ServerBootstrap ，并进行参数配置：
- 设置 BossGroup 和 WorkerGroup
- 设置使用 NioSocketChannel 作为服务器的通道实现
- 设置保持活动连接
- 创建一个 通道(pipline) 测试对象（匿名对象），并为 pipline设置一个 Handler
- 步骤三：绑定端口并且同步，启动服务器，生成并返回一个 ChannelFuture 对象
- 步骤四：设置对关闭通道事件进行监听

代码：

```java
public class TestServer {
    public static void main(String[] args) {
        NioEventLoopGroup bossGroup = new NioEventLoopGroup(1);
        NioEventLoopGroup workerGroup = new NioEventLoopGroup(8);
        try {
            // 2.创建服务器端启动对象，配置参数
            ServerBootstrap serverBootstrap = new ServerBootstrap();
            serverBootstrap.group(bossGroup, workerGroup)
                    .channel(NioServerSocketChannel.class)
                    .option(ChannelOption.SO_BACKLOG,128)// 设置线程队列得到连接个数
                    .childOption(ChannelOption.SO_KEEPALIVE,true)// 设置保持活动连接
                    .childHandler(new TestServerInitializer());
            System.out.println("服务器就绪...");
            ChannelFuture channelFuture = serverBootstrap.bind(8848).sync();
            // 给 cf 注册监听器，监控我们关心的事件
            channelFuture.addListener(new ChannelFutureListener() {
                @Override
                public void operationComplete(ChannelFuture channelFuture) throws Exception {
                    if (channelFuture.isSuccess()) {
                        System.out.println("监听端口 8848 成功");
                    } else {
                        System.out.println("监听端口 8848 失败");
                    }
                }
            });
            channelFuture.channel().closeFuture().sync();
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            bossGroup.shutdownGracefully();
            workerGroup.shutdownGracefully();
        }
    }
}
```

```java
public class TestServerInitializer extends ChannelInitializer<SocketChannel> {
    @Override
    protected void initChannel(SocketChannel ch) throws Exception {
        // 向管道加入处理器
        // 得到管道
        ChannelPipeline pipeline = ch.pipeline();
        // 加入一个netty提供的httpServerCodec codec => [coder - decoder]
        // HttpServerCodec 说明
        // 1. HttpServerCodec 是 netty 提供的处理 http 的 编-解码器
        pipeline.addLast("MyHttpServerCodec", new HttpServerCodec());
        // 2. 增加一个自定义的处理器
        pipeline.addLast("MyTestHttpServerHandler", new TestHttpServerHandler());
    }
}
```

```java
/**
 * 说明：
 * 1. SimpleChannelInboundHandler 是 ChannelInboundHandlerAdapter的子类
 * 2. HttpObject 客户端和服务器端相互通讯的数据封装成 HttpObject
 */
public class TestHttpServerHandler extends SimpleChannelInboundHandler<HttpObject> {
    // channelRead0 读取客户端数据
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, HttpObject msg) throws Exception {
        // 判断 msg 是不是 HttpRequest 请求
        if(msg instanceof HttpRequest){
            System.out.println("msg 类型=" + msg.getClass());
            System.out.println("客户端地址" + ctx.channel().remoteAddress());
            // 回复信息给浏览器[HTTP协议]
            ByteBuf content = Unpooled.copiedBuffer("hello，我是服务器.....", CharsetUtil.UTF_8);
            // 构造一个 http的响应，即httpResponse
            FullHttpResponse response = new DefaultFullHttpResponse(HttpVersion.HTTP_1_1, HttpResponseStatus.OK, content);
            response.headers().set(HttpHeaderNames.CONTENT_TYPE, "text/plain");
            response.headers().set(HttpHeaderNames.CONTENT_LENGTH, content.readableBytes());
            // 将构建好的 response 返回
            ctx.writeAndFlush(response);
        }
    }
}
```

## 2.2测试结果问题分析

- 首先启动程序
- 浏览器发送请求 [http://localhost:8848/](http://localhost:8848/)
- 查看控制台打印结果，我们发现服务端接收到了两次请求

问题分析：

我们打开浏览器控制台发现，其实浏览器发送了两次请求，因此我们需要对特定请求资源进行过滤

## 2.3问题解决：对特定请求资源进行过滤

我们只需要对 [http://localhost:8848/favicon.ico](http://localhost:8848/favicon.ico) 请求进行过滤即可。

```java
/**
 * 说明：
 * 1. SimpleChannelInboundHandler 是 ChannelInboundHandlerAdapter的子类
 * 2. HttpObject 客户端和服务器端相互通讯的数据封装成 HttpObject
 */
public class TestHttpServerHandler extends SimpleChannelInboundHandler<HttpObject> {
    // channelRead0 读取客户端数据
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, HttpObject msg) throws Exception {
        // 判断 msg 是不是 HttpRequest 请求
        if(msg instanceof HttpRequest){
            System.out.println("msg 类型=" + msg.getClass());
            System.out.println("客户端地址" + ctx.channel().remoteAddress());
            // 获取到
            HttpRequest httpRequest = (HttpRequest) msg;
            // 获取uri
            URI uri = new URI(httpRequest.uri());
            if ("/favicon.ico".equals(uri.getPath())) {
                System.out.println("请求了 favicon.ico，不做响应");
                return;
            }
            // 回复信息给浏览器[HTTP协议]
            ByteBuf content = Unpooled.copiedBuffer("hello，我是服务器.....", CharsetUtil.UTF_8);
            // 构造一个 http的响应，即httpResponse
            FullHttpResponse response = new DefaultFullHttpResponse(HttpVersion.HTTP_1_1, HttpResponseStatus.OK, content);
            response.headers().set(HttpHeaderNames.CONTENT_TYPE, "text/plain");
            response.headers().set(HttpHeaderNames.CONTENT_LENGTH, content.readableBytes());
            // 将构建好的 response 返回
            ctx.writeAndFlush(response);
        }
    }
}
```
