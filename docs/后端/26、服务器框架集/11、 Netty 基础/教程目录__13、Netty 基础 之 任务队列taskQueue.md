# 13、Netty 基础 之 任务队列taskQueue
- 来源：https://ddkk.com/zhuanlan/server/netty/4/13.html
- 分类：服务器框架
- 分组：教程目录
## 一、任务队列

**1、** 用户程序自定义的普通任务；

**2、** 用户自定义定时任务；

**3、** 非当前Reactor线程调用Channel的各种方法；

例如在推送系统的业务线程里面，根据用户的标识，找到对应的Channel引用，然后调用Write类方法向该用户推送消息，就会进入到这种场景。最终的Write会提交到任务队列中后被异步消费。

## 二、使用场景

**1、** 比如在服务器端channelRead中有一个非常耗费时间的业务，我们要异步执行，把它提交到channel对应的NioEventLoopGroup的taskQueue中；

**2、** 每个NioEventLoop是一个单线程线程池，提交任务相当于还是它自己来做，只不过是它会根据你设定的ioradio参数来分配io事件和普通任务的时间；

## 三、方案1：用户程序自定义的普通任务

**1、** 改写服务器端Handler，为NettyChannelHandler2.java；

```java
package com.ddkk.netty.simple;
import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelInboundHandlerAdapter;
import io.netty.util.CharsetUtil;
/**
 * 说明
 * 1. 我们自定义一个Handler，需要继承netty规定好的某个HandlerAdapter（规范）
 * 2. 这时我们自定义一个Handler，才能称之为Handler
 * 
 */
public class NettyChannelHandler2 extends ChannelInboundHandlerAdapter {
	//读取数据的事件（这里我们可以读取客户端发送的消息）
	/*
	 * 1. ChannelHandlerContext ctx：上下文对象，含有管道pipeline，通道channel，地址
	 * 2. Object msg：就是客户端发送的数据，默认是Object
	 * 3. 通道读写数据，管道处理数据
	 */
	@Override
	public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
		//方案1：用户程序自定义的普通任务
		//会提交到当前channel关联的NioEventLoop里面的taskQueue执行
		//任务一
		ctx.channel().eventLoop().execute(new Runnable() {
			@Override
			public void run() {
				try {
					Thread.sleep(10 * 1000);
					ctx.channel().writeAndFlush(Unpooled.copiedBuffer("hello，客户端~", CharsetUtil.UTF_8));
				} catch (InterruptedException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}
		});
		//任务二
		ctx.channel().eventLoop().execute(new Runnable() {
			@Override
			public void run() {
				System.out.println("任务二...");
				ctx.channel().writeAndFlush(Unpooled.copiedBuffer("hello，客户端3~", CharsetUtil.UTF_8));
			}
		});
		ctx.channel().writeAndFlush(Unpooled.copiedBuffer("hello，客户端2~", CharsetUtil.UTF_8));
		//客户端
		//会收到：hello，客户端2~
		//再收到：hello，客户端~
		//再收到：hello，客户端3~
	}
	//数据读取完毕
	//这个方法会在channelRead读完后触发
	@Override
	public void channelReadComplete(ChannelHandlerContext ctx) throws Exception {
		//把数据写到缓冲区，并且刷新缓冲区，是write + flush
		//一般来讲，我们对这个发送的数据进行编码
		//ctx.channel().writeAndFlush(Unpooled.copiedBuffer("hello，客户端~", CharsetUtil.UTF_8));
	}
	//处理异常，一般是需要关闭通道
	@Override
	public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
		ctx.channel().close();
	}
}
```

**2、** 客户端执行结果；

```java
服务器回复的消息：hello，客户端2~
服务器的地址：/127.0.0.1:6668
服务器回复的消息：hello，客户端~
服务器的地址：/127.0.0.1:6668
服务器回复的消息：hello，客户端3~
服务器的地址：/127.0.0.1:6668
```

服务器端nioeventloop还是一个线程执行，taskQueue里是按照添加的顺序依次执行。

## 四、方案2：用户自定义定时任务

**1、** 该任务是提交到scheduleTaskQueue中；

**2、** 改写服务器端Handler，为NettyChannelHandler3.java；

```java
package com.ddkk.netty.simple;
import java.util.concurrent.TimeUnit;
import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelInboundHandlerAdapter;
import io.netty.util.CharsetUtil;
/**
 * 说明
 * 1. 我们自定义一个Handler，需要继承netty规定好的某个HandlerAdapter（规范）
 * 2. 这时我们自定义一个Handler，才能称之为Handler
 * 
 */
public class NettyChannelHandler3 extends ChannelInboundHandlerAdapter {
	//读取数据的事件（这里我们可以读取客户端发送的消息）
	/*
	 * 1. ChannelHandlerContext ctx：上下文对象，含有管道pipeline，通道channel，地址
	 * 2. Object msg：就是客户端发送的数据，默认是Object
	 * 3. 通道读写数据，管道处理数据
	 */
	@Override
	public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
		//方案2：用户自定义定时任务
		ctx.channel().eventLoop().schedule(new Runnable() {
			@Override
			public void run() {
				try {
					Thread.sleep(10 * 1000);
					ctx.channel().writeAndFlush(Unpooled.copiedBuffer("hello，客户端~", CharsetUtil.UTF_8));
				} catch (InterruptedException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}
		}, 5, TimeUnit.SECONDS); //延迟5秒，然后执行
		ctx.channel().writeAndFlush(Unpooled.copiedBuffer("hello，客户端2~", CharsetUtil.UTF_8));
	}
	//数据读取完毕
	//这个方法会在channelRead读完后触发
	@Override
	public void channelReadComplete(ChannelHandlerContext ctx) throws Exception {
		//把数据写到缓冲区，并且刷新缓冲区，是write + flush
		//一般来讲，我们对这个发送的数据进行编码
		//ctx.channel().writeAndFlush(Unpooled.copiedBuffer("hello，客户端~", CharsetUtil.UTF_8));
	}
	//处理异常，一般是需要关闭通道
	@Override
	public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
		ctx.channel().close();
	}
}
```

**3、** 客户端执行结果；

```java
服务器回复的消息：hello，客户端2~
服务器的地址：/127.0.0.1:6668
服务器回复的消息：hello，客户端~
服务器的地址：/127.0.0.1:6668
```

## 五、方案3：服务器端要推送多个管道

**1、** 服务器端要推送到管道A、管道B、管道C，所以要找到它对应的channel；

**2、** 如何获取其他的channel；

1、在服务器端初始化`new ChannelInitializer()`对象时，把SocketChannel放入一个HashMap中，然后从HashMap里取。

2、在推送消息时，可以将业务加入到各个channel对应的NioEventLoop的taskQueue或者scheduleTaskQueue中。

**3、** 改写服务端，为NettyServer2.java；

```java
package com.ddkk.netty.simple;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelOption;
import io.netty.channel.ChannelPipeline;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;
/**
 * 可以传递一个集合保存SocketChannel的引用
 * @author user
 *
 */
public class NettyServer2 {
	public static void main(String[] args) throws Exception {
		//创建BossGroup和WorkerGroup
		//说明
		//1. 创建两个线程组bossGroup和workerGroup
		//2. bossGroup它只是处理连接请求，真正的与客户端业务处理会交给workerGroup去完成
		//3. 两个都是无限循环
		EventLoopGroup bossGroup = new NioEventLoopGroup(1);
		EventLoopGroup workerGroup = new NioEventLoopGroup(8);
		try {
			//创建服务器端的启动对象，配置启动参数
			ServerBootstrap bootstrap = new ServerBootstrap();
			//集合保存所有SocketChannel引用
			Map<Integer, SocketChannel> map = new ConcurrentHashMap<>();
			//使用链式编程来进行设置
			bootstrap.group(bossGroup, workerGroup) //设置两个线程组
				.channel(NioServerSocketChannel.class) //使用NioServerSocketChannel作为服务器的通道实现
				.childHandler(new ChannelInitializer<SocketChannel>() { //创建一个通道初始化对象
					//给pipeline设置处理器
					@Override
					protected void initChannel(SocketChannel ch) throws Exception {
						//将channel引用放入map
						map.put(ch.hashCode(), ch);
						ChannelPipeline pipeline = ch.pipeline();
						pipeline.addLast(new NettyChannelHandler4(map)); //向管道的最后增加一个处理器
					};
				}); //给我们的workerGroup的EventLoop对应的管道设置处理器
			//bossGroup参数
			bootstrap.option(ChannelOption.SO_BACKLOG, 1024); //设置线程队列等待连接的个数
			//workerGroup参数
			bootstrap.childOption(ChannelOption.SO_KEEPALIVE, true); //设置保持活动连接状态
			System.out.println("...服务器 is ready...");
			//绑定一个端口并且同步，生成了一个ChannelFuture对象
			//启动服务器并绑定端口
			ChannelFuture cf = bootstrap.bind(6668).sync();
			//对关闭通道进行监听
			cf.channel().closeFuture().sync();
		} catch (Exception e) {
			e.printStackTrace();
		} finally {
			System.out.println("Shutdown Netty Server...");
			//优雅的关闭
			workerGroup.shutdownGracefully();
			bossGroup.shutdownGracefully();
			System.out.println("Shutdown Netty Server Success!");
		}
	}
}
```

**4、** 改写服务端Handler，为NettyChannelHandler4.java；

```java
package com.ddkk.netty.simple;
import java.util.Map;
import io.netty.buffer.Unpooled;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelInboundHandlerAdapter;
import io.netty.channel.socket.SocketChannel;
import io.netty.util.CharsetUtil;
/**
 * 说明
 * 1. 我们自定义一个Handler，需要继承netty规定好的某个HandlerAdapter（规范）
 * 2. 这时我们自定义一个Handler，才能称之为Handler
 * 
 */
public class NettyChannelHandler4 extends ChannelInboundHandlerAdapter {
	private Map<Integer, SocketChannel> map;
	public NettyChannelHandler4(Map<Integer, SocketChannel> map) {
		this.map = map;
	}
	//读取数据的事件（这里我们可以读取客户端发送的消息）
	/*
	 * 1. ChannelHandlerContext ctx：上下文对象，含有管道pipeline，通道channel，地址
	 * 2. Object msg：就是客户端发送的数据，默认是Object
	 * 3. 通道读写数据，管道处理数据
	 */
	@Override
	public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
		System.err.println("channel的数量：" + map.size());
		//方案3：服务器端要推送到管道A、管道B、管道C。。。
		map.forEach((key, value) -> {  
            value.writeAndFlush(Unpooled.copiedBuffer("server向"+key+"发送消息", CharsetUtil.UTF_8));
        });
	}
	//数据读取完毕
	//这个方法会在channelRead读完后触发
	@Override
	public void channelReadComplete(ChannelHandlerContext ctx) throws Exception {
		//把数据写到缓冲区，并且刷新缓冲区，是write + flush
		//一般来讲，我们对这个发送的数据进行编码
		//ctx.channel().writeAndFlush(Unpooled.copiedBuffer("hello，客户端~", CharsetUtil.UTF_8));
	}
	//处理异常，一般是需要关闭通道
	@Override
	public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
		//客户端主动断开连接时会进到这里
		//移除集合
		map.remove(ctx.channel().hashCode());
		ctx.channel().close();
	}
}
```

## 六、netty模型方案再说明

**1、** netty抽象出两组线程池，BossGroup专门负责接收客户端连接，WorkerGroup专门负责网络读写操作；

**2、** NioEventLoop表示一个不断循环执行处理任务的线程，每个NioEventLoop都有一个selector，用于监听绑定在其上的socket网络通道；

**3、** NioEventLoop内部采用串行化设计，`从消息的读取->解码->处理->编码->发送`，始终由IO线程NioEventLoop负责；

**4、** NioEventLoopGroup下包含多个NioEventLoop；

1、每个NioEventLoop中包含有一个Selector，一个taskQueue。

2、每个NioEventLoop的Selector上可以注册监听多个NioChannel。

3、每个NioChannel只会绑定在唯一的NioEventLoop上。

4、每个NioChannel都绑定有一个自己的ChannelPipeline。
