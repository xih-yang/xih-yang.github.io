# 30、Netty 基础 之 自定义协议解决TCP粘包拆包
- 来源：https://ddkk.com/zhuanlan/server/netty/4/30.html
- 分类：服务器框架
- 分组：教程目录
## 一、TCP粘包和拆包解决方案

**1、** 使用自定义协议+编解码器，来解决；

**2、** 关键就是要解决，服务器端每次读取数据长度的问题这个问题解决，就不会出现服务器多读或少读数据的问题，从而避免TCP粘包、拆包；

## 二、具体示例

**1、** 要求客户端发送5个message对象，客户端每次发送一个message对象；

**2、** 服务器端每次接收一个message，分5次进行解码，每读取到一个message，会回复一个message对象给客户端；

## 三、客户端发送给服务端

**1、** 编解码器和POJO类；

MessageProtocol.java

```java
package netty.tcpStickPackage2;
/**
 * 协议包对象类
 * @author user
 *
 */
public class MessageProtocol {
	//数据发送的长度
	private int len;
	//数据本体，一般是放在byte数组中
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

MyMessageDecoder.java

```java
package netty.tcpStickPackage2;
import java.util.List;
import io.netty.buffer.ByteBuf;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.ReplayingDecoder;
public class MyMessageDecoder extends ReplayingDecoder<Void> {
	@Override
	protected void decode(ChannelHandlerContext ctx, ByteBuf in, List<Object> out) throws Exception {
		System.out.println("MyMessageDecoder decode 被调用");
		//需要将二进制字节码转成MessageProtocol对象
		int len = in.readInt();
		//创建一个len长度的字节数组
		byte[] content = new byte[len];
		in.readBytes(content);
		//封装成MessageProtocol对象，放入out，传递给下一个handler处理
		MessageProtocol messageProtocol = new MessageProtocol();
		messageProtocol.setLen(len);
		messageProtocol.setContent(content);
		out.add(messageProtocol);
	}
}
```

MyMessageEncoder.java

```java
package netty.tcpStickPackage2;
import io.netty.buffer.ByteBuf;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.MessageToByteEncoder;
public class MyMessageEncoder extends MessageToByteEncoder<MessageProtocol> {
	@Override
	protected void encode(ChannelHandlerContext ctx, MessageProtocol msg, ByteBuf out) throws Exception {
		System.out.println("MyMessageEncoder encode 方法被调用");
		out.writeInt(msg.getLen());
		out.writeBytes(msg.getContent());
	}
}
```

**2、** 服务端；

NettyServer.java

```java
package netty.tcpStickPackage2;
import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.ChannelFuture;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import io.netty.handler.logging.LogLevel;
import io.netty.handler.logging.LoggingHandler;
public class NettyServer {
	public static void main(String[] args) {
		EventLoopGroup bossGroup = new NioEventLoopGroup(1);
		EventLoopGroup workerGroup = new NioEventLoopGroup(8);
		try {
			ServerBootstrap bootstrap = new ServerBootstrap();
			bootstrap.group(bossGroup, workerGroup)
				.channel(NioServerSocketChannel.class)
				.handler(new LoggingHandler(LogLevel.DEBUG))
				.childHandler(new NettyServerInitializer()); //自定义一个初始化类
			ChannelFuture cf = bootstrap.bind(7000).sync();
			cf.channel().closeFuture().sync();
		} catch (Exception e) {
			e.printStackTrace();
		} finally {
			bossGroup.shutdownGracefully();
			workerGroup.shutdownGracefully();
		}
	}
}
```

NettyServerInitializer.java

```java
package netty.tcpStickPackage2;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelPipeline;
import io.netty.channel.socket.SocketChannel;
public class NettyServerInitializer extends ChannelInitializer<SocketChannel> {
	@Override
	protected void initChannel(SocketChannel ch) throws Exception {
		ChannelPipeline pipeline = ch.pipeline();
		//加入解码器
		pipeline.addLast(new MyMessageDecoder());
		//加入一个自定义handler
		pipeline.addLast(new NettyChannelHandler());
	}
}
```

NettyChannelHandler.java

```java
package netty.tcpStickPackage2;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.util.CharsetUtil;
public class NettyChannelHandler extends SimpleChannelInboundHandler<MessageProtocol> {
	private int count;
	@Override
	protected void channelRead0(ChannelHandlerContext ctx, MessageProtocol msg) throws Exception {
		//接收到数据并处理
		int len = msg.getLen();
		byte[] content = msg.getContent();
		System.out.println("服务端接收到信息如下");
		System.out.println("长度：" + len);
		System.out.println("内容：" + new String(content, CharsetUtil.UTF_8));
		System.out.println("服务器接收到消息包数量：" + (++this.count));
		//回复消息
	}
	@Override
	public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
		cause.printStackTrace();
		ctx.channel().close();
	}
}
```

**3、** 客户端；

NettyClient.java

```java
package netty.tcpStickPackage2;
import io.netty.bootstrap.Bootstrap;
import io.netty.channel.ChannelFuture;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.nio.NioSocketChannel;
import io.netty.handler.logging.LogLevel;
import io.netty.handler.logging.LoggingHandler;
public class NettyClient {
	public static void main(String[] args) {
		EventLoopGroup group = new NioEventLoopGroup();
		try {
			Bootstrap bootstrap = new Bootstrap();
			bootstrap.group(group) //设置线程组
				.channel(NioSocketChannel.class)
				.handler(new LoggingHandler(LogLevel.DEBUG))
				.handler(new NettyClientInitializer()); //自定义一个初始化对象
			ChannelFuture cf = bootstrap.connect("127.0.0.1", 7000).sync();
			cf.channel().closeFuture().sync();
		} catch (Exception e) {
			e.printStackTrace();
		} finally {
			group.shutdownGracefully();
		}
	}
}
```

NettyClientInitializer.java

```java
package netty.tcpStickPackage2;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelPipeline;
import io.netty.channel.socket.SocketChannel;
public class NettyClientInitializer extends ChannelInitializer<SocketChannel> {
	@Override
	protected void initChannel(SocketChannel ch) throws Exception {
		ChannelPipeline pipeline = ch.pipeline();
		//加入编码器
		pipeline.addLast(new MyMessageEncoder());
		//加入一个自定义handler
		pipeline.addLast(new NettyClientHandler());
	}
}
```

NettyClientHandler.java

```java
package netty.tcpStickPackage2;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.util.CharsetUtil;
public class NettyClientHandler extends SimpleChannelInboundHandler<MessageProtocol> {
	//private int count;
	@Override
	protected void channelRead0(ChannelHandlerContext ctx, MessageProtocol msg) throws Exception {
	}
	@Override
	public void channelActive(ChannelHandlerContext ctx) throws Exception {
		//使用客户端发送5条数据
		for (int i=0; i<5; i++) {
			String msg = "今天天气冷，吃火锅";
			byte[] content = msg.getBytes(CharsetUtil.UTF_8);
			int length = content.length;
			//创建协议包
			MessageProtocol messageProtocol = new MessageProtocol();
			messageProtocol.setLen(length);
			messageProtocol.setContent(content);
			ctx.writeAndFlush(messageProtocol);
		}
	}
	@Override
	public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
		cause.printStackTrace();
		ctx.channel().close();
	}
}
```

## 四、执行结果

**1、** 服务端；

```java
MyMessageDecoder decode 被调用
服务端接收到信息如下
长度：27
内容：今天天气冷，吃火锅
服务器接收到消息包数量：1
MyMessageDecoder decode 被调用
服务端接收到信息如下
长度：27
内容：今天天气冷，吃火锅
服务器接收到消息包数量：2
MyMessageDecoder decode 被调用
服务端接收到信息如下
长度：27
内容：今天天气冷，吃火锅
服务器接收到消息包数量：3
MyMessageDecoder decode 被调用
服务端接收到信息如下
长度：27
内容：今天天气冷，吃火锅
服务器接收到消息包数量：4
MyMessageDecoder decode 被调用
服务端接收到信息如下
长度：27
内容：今天天气冷，吃火锅
服务器接收到消息包数量：5
```

**2、** 客户端；

```java
MyMessageEncoder encode 方法被调用
MyMessageEncoder encode 方法被调用
MyMessageEncoder encode 方法被调用
MyMessageEncoder encode 方法被调用
MyMessageEncoder encode 方法被调用
```

## 五、服务端回复消息给客户端

**1、** 修改服务端代码；

NettyChannelHandler.java

添加回复消息

```java
package netty.tcpStickPackage2;
import java.util.UUID;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.util.CharsetUtil;
public class NettyChannelHandler extends SimpleChannelInboundHandler<MessageProtocol> {
	private int count;
	@Override
	protected void channelRead0(ChannelHandlerContext ctx, MessageProtocol msg) throws Exception {
		//接收到数据并处理
		int len = msg.getLen();
		byte[] content = msg.getContent();
		System.out.println("服务端接收到信息如下");
		System.out.println("长度：" + len);
		System.out.println("内容：" + new String(content, CharsetUtil.UTF_8));
		System.out.println("服务器接收到消息包数量：" + (++this.count));
		//回复消息
		String response = UUID.randomUUID().toString();
		byte[] responseContent = response.getBytes(CharsetUtil.UTF_8);
		int responseLen = responseContent.length;
		//构建一个协议包
		MessageProtocol messageProtocol = new MessageProtocol();
		messageProtocol.setLen(responseLen);
		messageProtocol.setContent(responseContent);
		ctx.writeAndFlush(messageProtocol);
	}
	@Override
	public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
		cause.printStackTrace();
		ctx.channel().close();
	}
}
```

NettyServerInitializer.java

加入编码器

```java
package netty.tcpStickPackage2;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelPipeline;
import io.netty.channel.socket.SocketChannel;
public class NettyServerInitializer extends ChannelInitializer<SocketChannel> {
	@Override
	protected void initChannel(SocketChannel ch) throws Exception {
		ChannelPipeline pipeline = ch.pipeline();
		//加入解码器
		pipeline.addLast(new MyMessageDecoder());
		//加入编码器
		pipeline.addLast(new MyMessageEncoder());
		//加入一个自定义handler
		pipeline.addLast(new NettyChannelHandler());
	}
}
```

**2、** 修改客户端代码；

NettyClientHandler.java

添加接收服务端信息channelRead0接口

```java
package netty.tcpStickPackage2;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.util.CharsetUtil;
public class NettyClientHandler extends SimpleChannelInboundHandler<MessageProtocol> {
	private int count;
	@Override
	protected void channelRead0(ChannelHandlerContext ctx, MessageProtocol msg) throws Exception {
		int len = msg.getLen();
		byte[] content = msg.getContent();
		System.out.println("客户端接收到消息如下");
		System.out.println("长度：" + len);
		System.out.println("内容：" + new String(content, CharsetUtil.UTF_8));
		System.out.println("客户端接收到消息包数量：" + (++this.count));
	}
	@Override
	public void channelActive(ChannelHandlerContext ctx) throws Exception {
		//使用客户端发送5条数据
		for (int i=0; i<5; i++) {
			String msg = "今天天气冷，吃火锅";
			byte[] content = msg.getBytes(CharsetUtil.UTF_8);
			int length = content.length;
			//创建协议包
			MessageProtocol messageProtocol = new MessageProtocol();
			messageProtocol.setLen(length);
			messageProtocol.setContent(content);
			ctx.writeAndFlush(messageProtocol);
		}
	}
	@Override
	public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
		cause.printStackTrace();
		ctx.channel().close();
	}
}
```

NettyClientInitializer.java

添加解码器

```java
package netty.tcpStickPackage2;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelPipeline;
import io.netty.channel.socket.SocketChannel;
public class NettyClientInitializer extends ChannelInitializer<SocketChannel> {
	@Override
	protected void initChannel(SocketChannel ch) throws Exception {
		ChannelPipeline pipeline = ch.pipeline();
		//加入编码器
		pipeline.addLast(new MyMessageEncoder());
		//加入解码器
		pipeline.addLast(new MyMessageDecoder());
		//加入一个自定义handler
		pipeline.addLast(new NettyClientHandler());
	}
}
```

## 六、执行结果

**1、** 服务端；

```java
MyMessageDecoder decode 被调用
服务端接收到信息如下
长度：27
内容：今天天气冷，吃火锅
服务器接收到消息包数量：1
MyMessageEncoder encode 方法被调用
MyMessageDecoder decode 被调用
服务端接收到信息如下
长度：27
内容：今天天气冷，吃火锅
服务器接收到消息包数量：2
MyMessageEncoder encode 方法被调用
MyMessageDecoder decode 被调用
服务端接收到信息如下
长度：27
内容：今天天气冷，吃火锅
服务器接收到消息包数量：3
MyMessageEncoder encode 方法被调用
MyMessageDecoder decode 被调用
服务端接收到信息如下
长度：27
内容：今天天气冷，吃火锅
服务器接收到消息包数量：4
MyMessageEncoder encode 方法被调用
MyMessageDecoder decode 被调用
服务端接收到信息如下
长度：27
内容：今天天气冷，吃火锅
服务器接收到消息包数量：5
MyMessageEncoder encode 方法被调用
```

**2、** 客户端；

```java
MyMessageEncoder encode 方法被调用
MyMessageEncoder encode 方法被调用
MyMessageEncoder encode 方法被调用
MyMessageEncoder encode 方法被调用
MyMessageEncoder encode 方法被调用
MyMessageDecoder decode 被调用
客户端接收到消息如下
长度：36
内容：6a488e60-a67f-49ef-9783-cbcb048d82ea
客户端接收到消息包数量：1
MyMessageDecoder decode 被调用
客户端接收到消息如下
长度：36
内容：160ab489-09b9-4786-ac57-74b82aed7150
客户端接收到消息包数量：2
MyMessageDecoder decode 被调用
客户端接收到消息如下
长度：36
内容：d9fd2087-1d6f-474d-93d4-6af1c1ced736
客户端接收到消息包数量：3
MyMessageDecoder decode 被调用
客户端接收到消息如下
长度：36
内容：06b6b40e-6ab4-4374-9e5a-2fcaca8dbc4d
客户端接收到消息包数量：4
MyMessageDecoder decode 被调用
客户端接收到消息如下
长度：36
内容：40891ed6-a790-4660-962f-4e3ec9d3a99b
客户端接收到消息包数量：5
```

## 七、其他

**1、** 因为在encoder中先writeInt再writeByte，然后decoder中先readInt再readByte，这样每次接收数据的数据长度都是一个int+一个content的长度；

**2、** 这个decode如果发生拆包的现象的时候会抛出一个Relay的Error，然后等待下一个请求进来，只有长度符合之后才会进行read，源码的位置是ReplayingDecoder的388行左右；

**3、** 粘包就是通过定长来获取足够的字节码拆包就是通过readBytes的时候需要的length和in的长度进行比较，短了就抛出error；
