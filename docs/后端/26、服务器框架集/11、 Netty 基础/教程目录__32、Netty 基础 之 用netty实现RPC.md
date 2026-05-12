# 32、Netty 基础 之 用netty实现RPC
- 来源：https://ddkk.com/zhuanlan/server/netty/4/32.html
- 分类：服务器框架
- 分组：教程目录
## 一、需求说明

**1、** dubbo底层使用了netty作为网络通讯框架，要求使用netty实现一个简单的RPC框架；

**2、** 模仿dubbo，消费者和提供者约定接口和协议，消费者远程调用提供者的服务，提供者返回一个字符串，消费者打印提供者返回的数据底层网络通信使用netty4.x；

## 二、设计说明

**1、** 创建一个接口，定义抽象方法用于消费者和提供者之间的约定；

**2、** 创建一个提供者，该类需要监听消费者的请求，并按照约定返回数据；

**3、** 创建一个消费者，该类需要透明的调用自己不存在的方法，内部需要使用netty请求提供者返回数据；

## 三、代码

**1、** 接口；

HelloService.java

```java
package netty.dubborpc.publicinterface;
/**
 * 接口，服务提供方和服务消费方都需要
 * @author user
 *
 */
public interface HelloService {
	public String hello(String msg);
}
```

**2、** netty服务端；

NettyServer.java

```java
package netty.dubborpc.netty;
import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelPipeline;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import io.netty.handler.codec.string.StringDecoder;
import io.netty.handler.codec.string.StringEncoder;
import io.netty.handler.logging.LogLevel;
import io.netty.handler.logging.LoggingHandler;
public class NettyServer {
	public static void startServer(String hostname, int port) {
		startServer0(hostname, port);
	}
	private static void startServer0(String hostname, int port) {
		EventLoopGroup bossGroup = new NioEventLoopGroup(1);
		EventLoopGroup workerGroup = new NioEventLoopGroup(8);
		try {
			ServerBootstrap bootstrap = new ServerBootstrap();
			bootstrap.group(bossGroup, workerGroup)
				.channel(NioServerSocketChannel.class)
				.handler(new LoggingHandler(LogLevel.DEBUG))
				.childHandler(new ChannelInitializer<SocketChannel>() {
					@Override
					protected void initChannel(SocketChannel ch) throws Exception {
						ChannelPipeline pipeline = ch.pipeline();
						pipeline.addLast(new StringDecoder());
						pipeline.addLast(new StringEncoder());
						pipeline.addLast(new NettyServerHandler()); //业务处理类
					}
				}); //自定义一个初始化类
			ChannelFuture cf = bootstrap.bind(7000).sync();
			System.out.println("服务提供方启动，开始监听了......");
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

NettyServerHandler.java

```java
package netty.dubborpc.netty;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelInboundHandlerAdapter;
import netty.dubborpc.provider.HelloServiceImpl;
public class NettyServerHandler extends ChannelInboundHandlerAdapter {
	@Override
	public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
		cause.printStackTrace();
		ctx.channel().close();
	}
	@Override
	public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
		//获取客户端发送的消息，并调用服务
		System.out.println("msg=" + msg);
		//客户端在调用服务器的api时，我们需要定义一个协议
		//比如我们要求，每次发消息时，都必须以某个字符串开头 "HelloService#hello#"
		if (msg.toString().startsWith("HelloService#hello#")) {
			//去除协议头
			//这里可以用反射生成处理类
			//还要考虑粘包拆包问题
			String result = new HelloServiceImpl().hello(msg.toString().substring(19));
			ctx.writeAndFlush(result);
		}
	}
}
```

**3、** netty客户端；

NettyClient.java

```java
package netty.dubborpc.netty;
import java.lang.reflect.Proxy;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import io.netty.bootstrap.Bootstrap;
import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelOption;
import io.netty.channel.ChannelPipeline;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioSocketChannel;
import io.netty.handler.codec.string.StringDecoder;
import io.netty.handler.codec.string.StringEncoder;
import io.netty.handler.logging.LogLevel;
import io.netty.handler.logging.LoggingHandler;
public class NettyClient {
	//创建线程池
	private static ExecutorService executor = Executors.newFixedThreadPool(10);
	private static NettyClientHandler client;
	//编写方法，使用代理模式获取代理对象
	public Object getBean(final Class<?> serviceClass, final String protocolHeader) {
		return Proxy.newProxyInstance(
				Thread.currentThread().getContextClassLoader(), 
				new Class<?>[] {serviceClass}, 
				//lambel表达式就是实现的接口InvocationHangler的invoke方法
				(proxy, method, args) -> {
					//这部分代码，客户端每调用一次hello，就会进入该代码块
					if (client == null) {
						initClient();
						initConnect();
					}
					//设置要发给服务器的信息
					//protocolHeader协议头，args[0]就是客户端调用api hello()里传的参数
					client.setParam(protocolHeader + args[0]);
					return executor.submit(client).get();
				});
	}
	//初始化客户端
	private static void initClient() {
		client = new NettyClientHandler();
	}
	//初始化连接
	private static void initConnect() {
		EventLoopGroup group = new NioEventLoopGroup();
		try {
			Bootstrap bootstrap = new Bootstrap();
			bootstrap.group(group) //设置线程组
				.channel(NioSocketChannel.class)
				.option(ChannelOption.TCP_NODELAY, true)
				.handler(new LoggingHandler(LogLevel.DEBUG))
				.handler(new ChannelInitializer<SocketChannel>() {
					@Override
					protected void initChannel(SocketChannel ch) throws Exception {
						ChannelPipeline pipeline = ch.pipeline();
						pipeline.addLast(new StringDecoder());
						pipeline.addLast(new StringEncoder());
						pipeline.addLast(client);
					}
				}); //自定义一个初始化对象
			ChannelFuture cf = bootstrap.connect("127.0.0.1", 7000).sync();
			//这里不能阻塞必须返回，因为后续代理还要调用call方法，所以不能closeFuture sync，但可以对closeFuture加一个listener回调
			//cf.channel().closeFuture().sync();
		} catch (Exception e) {
			e.printStackTrace();
		} finally {
			//这里也不能shutdown
			//group.shutdownGracefully();
		}
	}
}
```

NettyClientHandler.java

```java
package netty.dubborpc.netty;
import java.util.concurrent.Callable;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelInboundHandlerAdapter;
public class NettyClientHandler extends ChannelInboundHandlerAdapter implements Callable<Object> {
	//定义属性
	//感觉这三个变量都有并发问题？？？
	private ChannelHandlerContext context; //上下文
	private String result; //调用后返回的结果
	private String param; //客户端调用方法时，传入的参数
	/**
	 * Callable接口有一个非常重要的方法call()
	 * 被代理对象调用，发送数据给服务器 -> wait -> 等待被唤醒 -> 返回结果
	 * 一句话，就是客户端要自己控制什么时候发消息，channelActive不行，而且还要等待结果返回所以要wait，等channelRead返回后call再返回
	 */
	@Override
	public synchronized Object call() throws Exception {
		System.out.println("call 被调用 before");
		context.writeAndFlush(param); //把参数发过去
		//进行wait
		wait(); //等待channelRead方法获取到服务器的结果后，唤醒
		System.out.println("call 被调用 after");
		return result; //服务方返回的结果
	}
	/**
	 * 与服务器的连接创建成功后，就会被调用
	 */
	@Override
	public void channelActive(ChannelHandlerContext ctx) throws Exception {
		System.out.println("channelActive 被调用");
		if (context == null) {
			context = ctx; //因为在其他方法会使用到这个ctx
		}
	}
	/**
	 * 收到服务器的数据后，就会被调用
	 */
	@Override
	public synchronized void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
		System.out.println("channelRead 被调用");
		result = msg.toString();
		notify(); //唤醒等待的线程
	}
	@Override
	public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
		cause.printStackTrace();
		ctx.channel().close();
	}
	public void setParam(String param) {
		System.out.println("setParam 被调用");
		this.param = param;
	}
}
```

**4、** 服务提供者；

ServerBootstrap.java

```java
package netty.dubborpc.provider;
import netty.dubborpc.netty.NettyServer;
/**
 * ServerBootstrap会启动一个服务提供者，就是NettyServer
 * @author user
 *
 */
public class ServerBootstrap {
	public static void main(String[] args) {
		NettyServer.startServer("127.0.0.1", 7000);
	}
}
```

HelloServiceImpl.java

```java
package netty.dubborpc.provider;
import netty.dubborpc.publicinterface.HelloService;
public class HelloServiceImpl implements HelloService {
	private int count = 0;
	@Override
	public String hello(String msg) {
		System.out.println("收到客户端消息：" + msg);
		//根据msg返回不同的结果
		if (msg != null) {
			return "你好客户端，我已经收到你的消息 [" + msg + "] 第" + (++count) + "次";
		} else {
			return "你好客户端，消息为空";
		}
	}
}
```

**5、** 服务消费者；

ClientBootstrap.java

```java
package netty.dubborpc.consumer;
import netty.dubborpc.netty.NettyClient;
import netty.dubborpc.publicinterface.HelloService;
public class ClientBootstrap {
	//这里定义协议头
	public static final String providerName = "HelloService#hello#";
	public static void main(String[] args) {
		//创建一个消费者
		NettyClient consumer = new NettyClient();
		for (int i=0; i<10; i++) {
			//创建代理对象
			HelloService helloService = (HelloService)consumer.getBean(HelloService.class, providerName);
			//通过代理对象调用服务提供者的方法
			String result = helloService.hello("你好 RPC~");
			System.out.println("调用结果 result：" + result);
			System.out.println("-------------------------");
		}
	}
}
```

## 四、执行结果

**1、** 服务端；

```java
服务提供方启动，开始监听了......
msg=HelloService#hello#你好 RPC~
收到客户端消息：你好 RPC~
msg=HelloService#hello#你好 RPC~
收到客户端消息：你好 RPC~
msg=HelloService#hello#你好 RPC~
收到客户端消息：你好 RPC~
msg=HelloService#hello#你好 RPC~
收到客户端消息：你好 RPC~
msg=HelloService#hello#你好 RPC~
收到客户端消息：你好 RPC~
msg=HelloService#hello#你好 RPC~
收到客户端消息：你好 RPC~
msg=HelloService#hello#你好 RPC~
收到客户端消息：你好 RPC~
msg=HelloService#hello#你好 RPC~
收到客户端消息：你好 RPC~
msg=HelloService#hello#你好 RPC~
收到客户端消息：你好 RPC~
msg=HelloService#hello#你好 RPC~
收到客户端消息：你好 RPC~
```

**2、** 客户端；

```java
channelActive 被调用
setParam 被调用
call 被调用 before
channelRead 被调用
call 被调用 after
调用结果 result：你好客户端，我已经收到你的消息 [你好 RPC~] 第1次
-------------------------
setParam 被调用
call 被调用 before
channelRead 被调用
call 被调用 after
调用结果 result：你好客户端，我已经收到你的消息 [你好 RPC~] 第1次
-------------------------
setParam 被调用
call 被调用 before
channelRead 被调用
call 被调用 after
调用结果 result：你好客户端，我已经收到你的消息 [你好 RPC~] 第1次
-------------------------
setParam 被调用
call 被调用 before
channelRead 被调用
call 被调用 after
调用结果 result：你好客户端，我已经收到你的消息 [你好 RPC~] 第1次
-------------------------
setParam 被调用
call 被调用 before
channelRead 被调用
call 被调用 after
调用结果 result：你好客户端，我已经收到你的消息 [你好 RPC~] 第1次
-------------------------
setParam 被调用
call 被调用 before
channelRead 被调用
call 被调用 after
调用结果 result：你好客户端，我已经收到你的消息 [你好 RPC~] 第1次
-------------------------
setParam 被调用
call 被调用 before
channelRead 被调用
call 被调用 after
调用结果 result：你好客户端，我已经收到你的消息 [你好 RPC~] 第1次
-------------------------
setParam 被调用
call 被调用 before
channelRead 被调用
call 被调用 after
调用结果 result：你好客户端，我已经收到你的消息 [你好 RPC~] 第1次
-------------------------
setParam 被调用
call 被调用 before
channelRead 被调用
call 被调用 after
调用结果 result：你好客户端，我已经收到你的消息 [你好 RPC~] 第1次
-------------------------
setParam 被调用
call 被调用 before
channelRead 被调用
call 被调用 after
调用结果 result：你好客户端，我已经收到你的消息 [你好 RPC~] 第1次
-------------------------
```

## 五、说明

**1、** netty客户端和服务端之间是长连接，如果要短连接用socket连服务端就好了，netty客户端做短连接不合适，EventLoopGroup每次创建销毁开销太大了；

**2、** NettyClientHandler类内部的调用顺序：第一个调用的channelActive（首次时），第二个调用的setParam，第三个调用的call，然后wait，第四个调用channelRead，然后notify，唤醒线程继续在call里执行；

**3、** NettyClientHandler类是所有请求共用的，它的成员变量有并发问题；

**4、** 客户端每调用一次，服务端都产生新的HelloServiceImpl对象（这个是自己new出来的）；

**5、** 客户端的channelActive只会在连接成功后被调用一次；

**6、** NettyClient类里其实不需要线程池，因为客户端就只有一个，顶多newSingleThreadExecutor如果真的起多个客户端notify唤醒谁？；

**7、** 用户线程想拿到结果需要等待react线程唤醒context.write方法是在用户线程调用，netty会把这个读封装成task任务丢到react线程最终发送到服务端，服务端返回结果，客户端在react线程读取；

**8、** 客户端NettyClient和NettyClientHandler只有一个实例，是自己new出来的；

## 六、问题

这里demo的客户端有并发和性能问题
