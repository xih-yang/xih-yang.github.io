# 17、Netty 源码解析 - taskQueue自定义任务
- 来源：https://ddkk.com/zhuanlan/server/netty/1/17.html
- 分类：服务器框架
- 分组：教程目录
任务队列中的Task有3种典型使用场景：

1、用户程序自定义的普通任务

```java
public class NettyServerHandlerTask01 extends ChannelInboundHandlerAdapter {
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        // 比如这里有一个非常耗时长的业务 -> 异步执行 -> 将业务提交到该 channel 对应的
        // NioEventLoop 的 taskQueue 中处理
        // 解决方案1：用户程序自定义的普通任务
        // 10秒后运行
        ctx.channel().eventLoop().execute(new Runnable() {
            @Override
            public void run() {
                try {
                    Thread.sleep(10 * 1000);
                    ctx.writeAndFlush(Unpooled.copiedBuffer("Hello，客户端222", CharsetUtil.UTF_8));
                }catch (Exception ex){
                    System.out.println("发生异常：" + ex.getMessage()    );
                }
            }
        });
        // 30秒后运行
        ctx.channel().eventLoop().execute(new Runnable() {
            @Override
            public void run() {
                try {
                    Thread.sleep(20 * 1000);
                    ctx.writeAndFlush(Unpooled.copiedBuffer("Hello，客户端222", CharsetUtil.UTF_8));
                }catch (Exception ex){
                    System.out.println("发生异常：" + ex.getMessage()    );
                }
            }
        });
        System.out.println("go on...");
    }
    @Override
    public void channelReadComplete(ChannelHandlerContext ctx) throws Exception {
        ctx.writeAndFlush(Unpooled.copiedBuffer("Hello，客户端1111",CharsetUtil.UTF_8));
    }
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        cause.printStackTrace();
        ctx.close();
    }
}
```

2、用户自定义定时任务

```java
public class NettyServerHandlerTask02 extends ChannelInboundHandlerAdapter {
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        // 用户自定义定时任务 -> 该任务提交到scheduleTaskQueue
        ctx.channel().eventLoop().schedule(new Runnable() {
            @Override
            public void run() {
                try {
                    Thread.sleep(5 * 1000);
                    ctx.writeAndFlush(Unpooled.copiedBuffer("Hello，客户端444", CharsetUtil.UTF_8));
                }catch (Exception ex){
                    System.out.println("发生异常：" + ex.getMessage()    );
                }
            }
        },5, TimeUnit.SECONDS);
        System.out.println("go on...");
    }
    @Override
    public void channelReadComplete(ChannelHandlerContext ctx) throws Exception {
        ctx.writeAndFlush(Unpooled.copiedBuffer("Hello，客户端",CharsetUtil.UTF_8));
    }
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        cause.printStackTrace();
        ctx.close();
    }
}
```

3、非当前Reactor线程调用Channel的各种方法

例如在**推送系统**的业务线程里面，根据**用户标识**，找到对应的**Channel引用**，然后调用Write方法向该用户推送消息，就会进入到这种场景。最终的Write会提交到任务队列中被**异步消费**。

思想：可以使用一个集合管理 SocketChannel，再推送消息时，可以将业务加入到各个 channel 对应的 NioEventLoop 的 taskQueue 或者 scheduleTaskQueue
