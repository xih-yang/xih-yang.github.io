# 15、Netty 基础 之 HTTP服务
- 来源：https://ddkk.com/zhuanlan/server/netty/4/15.html
- 分类：服务器框架
- 分组：教程目录
## 一、使用netty开发一个简单的http服务

**1、** netty服务器在6668端口监听，浏览器发出请求http://localhost:6668/；

在写netty的http server的例子过程中，发现浏览器使用端口号6668一直无法连接，报错ERR_UNSAFE_PORT。改成7000就可以了。

**2、** 服务器可以回复消息给客户端“hello，我是服务器”，并对特定请求资源进行过滤；

**3、** 目的：netty可以做http服务开发，并且理解handler实例和客户端及其请求的关系；

代码；

## 二、代码

**1、** HttpServer.java；

```java
package netty.http;
import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.ChannelFuture;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.nio.NioServerSocketChannel;
public class HttpServer {
	public static void main(String[] args) {
		EventLoopGroup bossGroup = new NioEventLoopGroup(1);
		EventLoopGroup workerGroup = new NioEventLoopGroup(8);
		try {
			ServerBootstrap bootstrap = new ServerBootstrap();
			bootstrap.group(bossGroup, workerGroup)
			.channel(NioServerSocketChannel.class)
			.childHandler(new HttpServerInitializer());
			ChannelFuture channelFuture = bootstrap.bind(7000).sync();
			channelFuture.channel().closeFuture().sync();
		} catch (Exception e) {
			e.printStackTrace();
		} finally {
			workerGroup.shutdownGracefully();
			bossGroup.shutdownGracefully();
		}
	}
}
```

**2、** HttpServerInitializer.java；

```java
package netty.http;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelPipeline;
import io.netty.channel.socket.SocketChannel;
import io.netty.handler.codec.http.HttpServerCodec;
public class HttpServerInitializer extends ChannelInitializer<SocketChannel>{
	@Override
	protected void initChannel(SocketChannel ch) throws Exception {
		//向管道加入处理器
		//得到管道
		ChannelPipeline pipeline = ch.pipeline();
		//加入一个netty提供的httpServerCodec（编解码器）
		//HttpServerCodec的说明
		//1. HttpServerCodec是netty提供的处理http的编解码器
		pipeline.addLast("MyHttpServerCodec", new HttpServerCodec());
		//增加一个自定义的Handler
		pipeline.addLast("MyHttpServerHandler", new HttpServerHandler());
	}
}
```

**3、** HttpServerHandler.java；

```java
package netty.http;
import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.handler.codec.http.DefaultFullHttpResponse;
import io.netty.handler.codec.http.FullHttpResponse;
import io.netty.handler.codec.http.HttpHeaderNames;
import io.netty.handler.codec.http.HttpObject;
import io.netty.handler.codec.http.HttpRequest;
import io.netty.handler.codec.http.HttpResponseStatus;
import io.netty.handler.codec.http.HttpVersion;
import io.netty.util.CharsetUtil;
//SimpleChannelInboundHandler继承了ChannelInboundHandlerAdapter
//HttpObject指定了客户端和服务器端，在处理的时候的数据类型
public class HttpServerHandler extends SimpleChannelInboundHandler<HttpObject> {
	//channelRead0：读取客户端数据
	@Override
	protected void channelRead0(ChannelHandlerContext ctx, HttpObject msg) throws Exception {
		//判断msg是不是HttpRequest请求
		if (msg instanceof HttpRequest) {
			System.out.println("msg 类型 = " + msg.getClass());
			System.out.println("客户端地址 = " + ctx.channel().remoteAddress());
			//回复信息给浏览器 [http协议]
			ByteBuf content = Unpooled.copiedBuffer("hello，我是服务器！", CharsetUtil.UTF_8);
			//构造一个http的响应，即httpResponse
			FullHttpResponse response = new DefaultFullHttpResponse(HttpVersion.HTTP_1_1, HttpResponseStatus.OK, content);
			response.headers().set(HttpHeaderNames.CONTENT_TYPE, "text/plain;charset=utf-8");
			response.headers().set(HttpHeaderNames.CONTENT_LENGTH, content.readableBytes());
			//将构建好的response返回
			ctx.writeAndFlush(response);
		}
	}
}
```

**4、** 执行结果；

```java
msg 类型 = class io.netty.handler.codec.http.DefaultHttpRequest
客户端地址 = /127.0.0.1:58715
msg 类型 = class io.netty.handler.codec.http.DefaultHttpRequest
客户端地址 = /127.0.0.1:58715
```

为什么请求了2次？？？

第二次请求是favicon.ico文件

## 三、过滤请求

**1、** 改写HttpServerHandler.java；

```java
package netty.http;
import java.net.URI;
import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.handler.codec.http.DefaultFullHttpResponse;
import io.netty.handler.codec.http.FullHttpResponse;
import io.netty.handler.codec.http.HttpHeaderNames;
import io.netty.handler.codec.http.HttpObject;
import io.netty.handler.codec.http.HttpRequest;
import io.netty.handler.codec.http.HttpResponseStatus;
import io.netty.handler.codec.http.HttpVersion;
import io.netty.util.CharsetUtil;
//SimpleChannelInboundHandler继承了ChannelInboundHandlerAdapter
//HttpObject指定了客户端和服务器端，在处理的时候的数据类型
public class HttpServerHandler extends SimpleChannelInboundHandler<HttpObject> {
	//channelRead0：读取客户端数据
	@Override
	protected void channelRead0(ChannelHandlerContext ctx, HttpObject msg) throws Exception {
		//判断msg是不是HttpRequest请求
		if (msg instanceof HttpRequest) {
			System.out.println("msg 类型 = " + msg.getClass());
			System.out.println("客户端地址 = " + ctx.channel().remoteAddress());
			//过滤信息
			HttpRequest httpRequest = (HttpRequest) msg;
			//获取uri
			URI uri = new URI(httpRequest.uri());
			if ("/favicon.ico".equals(uri.getPath())) {
				System.out.println("请求了favicon.ico，不做响应");
				return;
			}
			//回复信息给浏览器 [http协议]
			ByteBuf content = Unpooled.copiedBuffer("hello，我是服务器！", CharsetUtil.UTF_8);
			//构造一个http的响应，即httpResponse
			FullHttpResponse response = new DefaultFullHttpResponse(HttpVersion.HTTP_1_1, HttpResponseStatus.OK, content);
			response.headers().set(HttpHeaderNames.CONTENT_TYPE, "text/plain;charset=utf-8");
			response.headers().set(HttpHeaderNames.CONTENT_LENGTH, content.readableBytes());
			//将构建好的response返回
			ctx.writeAndFlush(response);
		}
	}
}
```

**2、** 执行结果；

## 四、每一个客户端是独享一个handler

因为每个浏览器request到服务器的时候在服务器这边对应一个channel，每个channel有自己的pipeline即一连串的handler。
