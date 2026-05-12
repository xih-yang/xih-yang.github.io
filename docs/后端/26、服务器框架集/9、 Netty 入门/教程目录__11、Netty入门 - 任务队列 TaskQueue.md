# 11、Netty入门 - 任务队列 TaskQueue
- 来源：https://ddkk.com/zhuanlan/server/netty/2/11.html
- 分类：服务器框架
- 分组：教程目录
## 1.任务队列中的Task有3种典型使用场景

**1、** 用户程序自定义的普通任务；

**2、** 用户自定义定时任务；

**3、** 非当前Reactor线程调用Channel的各种方法；

例如，在**推送系统**的业务线程里面，根据**用户的标识**，找到对应的**Channel引用**，然后调用write类方法向该用户推送消息，就会进入到这种场景。最终的write会提交到任务队列中后被**异步消费**。

## 2.【用户程序自定义的普通任务】代码示例

## 2.1问题分析

首先我们 在 NettyServerHandler 的 channelRead() 方法中模拟一下耗时的业务：

```java
public class NettyServerHandler extends ChannelInboundHandlerAdapter {
    // 读取数据实现（这里我们可以读取客户端发送的消息）
    /**
     * 1. ChannelHandlerContext ctx：上下文对象，含有管道 pipeline，通道channel，地址
     * 2. Object msg：就是客户端发送的数据 默认Object
     */
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        // 比如这里有一个非常耗费时间的业务 -> 异步任务 -> 提交到该channel对应的 NIOEventLoop 的 taskQueue中
        Thread.sleep(10 * 1000);
        ctx.writeAndFlush(Unpooled.copiedBuffer("hello，客户端~ 喵2", CharsetUtil.UTF_8));
        System.out.println("go on........");
    }
    // 数据读取完毕
    @Override
    public void channelReadComplete(ChannelHandlerContext ctx) throws Exception {
        // writeAndFlush 是 write + flush
        // 将数据写入到缓存，并刷新
        // 一般讲，我们对这个发送的数据进行编码
        ctx.writeAndFlush(Unpooled.copiedBuffer("hello，客户端~", CharsetUtil.UTF_8));
    }
    // 处理异常，一般是需要关闭通道
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        ctx.close();
    }
}
```

**此时客户端必然是等待 10秒 后才能收到消息：hello，客户端~ 喵2；然后再收到消息：hello，客户端~。**

## 2.2解决方案一：用户程序自定义的普通任务

```java
@Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        // 比如这里有一个非常耗费时间的业务 -> 异步任务 -> 提交到该channel对应的 NIOEventLoop 的 taskQueue中
        // 解决方案1 用户程序自定义的普通任务
        ctx.channel().eventLoop().execute(new Runnable() {
            @Override
            public void run() {
                try {
                    Thread.sleep(10 * 1000);
                    ctx.writeAndFlush(Unpooled.copiedBuffer("hello，客户端~ 喵2", CharsetUtil.UTF_8));
                } catch (InterruptedException e) {
                    System.out.println("发生异常 " + e.getMessage());
                    e.printStackTrace();
                }
            }
        });
        System.out.println("go on........");
    }
```

这是我们启动程序发现：首先收到消息：**hello,客户端…**；然后过 5秒 收到消息：hello，客户端~ 喵2

验证也很简单，Debug查看：ctx --> pipeline --> channel --> eventLoop --> taskQueue，看一下 taskQueue 的size就行了。

## 2.3解决方案二：用户自定义定时任务

该任务是提交到 scheduleTaskQueue中

```java
@Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        // 比如这里有一个非常耗费时间的业务 -> 异步任务 -> 提交到该channel对应的 NIOEventLoop 的 taskQueue中
        // 解决方案2 用户自定义的定时任务 -> 该任务是提交到 scheduleTaskQueue 中
        ctx.channel().eventLoop().schedule(new Runnable() {
            @Override
            public void run() {
                try {
                    Thread.sleep(5 * 1000);
                    ctx.writeAndFlush(Unpooled.copiedBuffer("hello，客户端~ 喵4", CharsetUtil.UTF_8));
                } catch (InterruptedException e) {
                    System.out.println("发生异常 " + e.getMessage());
                    e.printStackTrace();
                }
            }
        }, 5, TimeUnit.SECONDS);
        System.out.println("go on........");
    }
```

验证也很简单，Debug查看：ctx --> pipline --> channel --> eventLoop --> scheduleTaskQueue，看一下 scheduleTaskQueue 的 size 就行了。

## 方案在说明

**1、** Netty抽象出两组**线程池**，BoosGroup专门负责接收客户端连接，WorkerGroup专门负责网络读写操作；

**2、** NioEventLoop表示一个不断循环执行处理任务的线程，每个NioEventLoop都有一个selector用于监听绑定在其上的socket网络通道；

**3、** NioEventLoop内部采用串行化设计，从消息的读取->解码->处理->编码->发送，始终由IO线程NioEventLoop负责；

- NioEventLoopGroup 下包含多个NioEventLoop
- 每个NioEventLoop中包含有一个Selector，一个taskQueue
- 每个NioEventLoop的Selector上可以注册监听多个NioChannel
- 每个NioChannel只会绑定在唯一的NioEventLoop上
- 每个NioChannel都绑定有一个自己的ChannelPipeline
