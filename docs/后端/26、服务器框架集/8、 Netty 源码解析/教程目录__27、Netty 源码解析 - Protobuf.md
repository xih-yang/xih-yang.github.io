# 27、Netty 源码解析 - Protobuf
- 来源：https://ddkk.com/zhuanlan/server/netty/1/27.html
- 分类：服务器框架
- 分组：教程目录
## 一、基本介绍

1、Protobuf 是 Google 发布的开源项目，全称 Google Protocol Buffers，是一种轻便高效的结构化数据存储格式，可以用于结构化数据串行化，或者说序列化。它很适合做数据存储或 **RPC【远程过程调用 Remote Procedure Call】数据交换格式。**

2、参考文档：https://developers.google.com/protocol-buffers/docs/proto

3、Protobuf 是以 message 的方式来管理数据的。

4、支持跨平台、跨语言，即【客户端和服务器端可以是不同的语言编写的】（支持目前绝大多数语言，例如C++、C#、Java、Python等）

5、高性能、高可靠性

6、使用 Protobuf 编译器能自动生成代码，Protobuf 是将类的定义使用 .proto 文件进行描述。说明，在 idea 中编写 .proto 文件时，会自动提示是否**下载.proto编写插件**，可以让语法高亮。然后通过 protoc.exe 编译器根据 .proto 自动生成 .java 文件

## 二、Protobuf实例1：生成类

1、客户端可以发送一个 Student POJO 对象到服务器（通过Protobuf编码）

2、服务器能接收 Student POJO 对象，并显示信息（通过Protobu解码）

3、参考链接：[生成POJO对象](https://blog.csdn.net/yangxshn/article/details/114419244)

### 2.1 proto 文件

```java
syntax = "proto3"; // 版本
option java_outer_classname = "StudentPOJO"; // 生成的外部类名，同时也是文件名
// protobuf 是以 message 的形式管理数据
message Student { // 会在 StudentPOJO 外部类生成一个内部类 Student，它是真正发送的 POJO 对象
    int32 id = 1; // Student 类中有一个属性，名字为 id，类型为 int32（protobuf类型），1表示属性序号，不是值
    string name = 2;
}
```

### 2.2 服务器端

```java
public class NettyServer {
    public static void main(String[] args) throws InterruptedException {
        // 创建 BossGroup 和 WorkerGroup
        EventLoopGroup bossGroup = new NioEventLoopGroup(1);
        EventLoopGroup workerGroup = new NioEventLoopGroup();
        try {
            // 创建服务器端启动对象，配置参数
            ServerBootstrap bootstrap = new ServerBootstrap();
            // 使用链式编程来进行设置
            bootstrap.group(bossGroup, workerGroup)
                    .channel(NioServerSocketChannel.class)
                    .option(ChannelOption.SO_BACKLOG, 128)
                    .childOption(ChannelOption.SO_KEEPALIVE, true)
                    .childHandler(new ChannelInitializer<SocketChannel>() {
                        // 给pipeline设置处理器
                        @Override
                        protected void initChannel(SocketChannel ch) throws Exception {
                            ChannelPipeline pipeline = ch.pipeline();
                            // 在 pipeline 中加入 ProtoBufDecoder
                            // 指定对哪种对象进行解码
                            pipeline.addLast("decoder",new ProtobufDecoder(StudentPOJO.Student.getDefaultInstance()));
                            pipeline.addLast(new NettyServerHandler());
                        }
                    });
            System.out.println(".........server is ready.......");
            // 绑定一个端口并且同步处理，生成了一个 ChannelFuture 对象，已经启动了服务器（并绑定端口）
            ChannelFuture future = bootstrap.bind(6668).sync();
            // 给 future 注册监听器，监控关心的事件
            future.addListener(new ChannelFutureListener() {
                @Override
                public void operationComplete(ChannelFuture future) throws Exception {
                    if (future.isSuccess()) {
                        System.out.println("监听端口 6668 成功");
                    } else {
                        System.out.println("监听端口 6668 失败");
                    }
                }
            });
            // 对关闭通道进行监听
            future.channel().closeFuture().sync();
        } finally {
            bossGroup.shutdownGracefully();
            workerGroup.shutdownGracefully();
        }
    }
}
```

```java
public class NettyServerHandler extends ChannelInboundHandlerAdapter {
    // 读取数据的事件（可以读取客户端发送的消息）
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        // 读取从客户端发送的 StudentPOJO.Student
        StudentPOJO.Student student = (StudentPOJO.Student) msg;
        System.out.println("客户端发送的数据 id=" + student.getId() + " 名字=" + student.getName());
    }
    // 数据读取完毕
    @Override
    public void channelReadComplete(ChannelHandlerContext ctx) throws Exception {
        // 将数据写入到缓冲
        ctx.writeAndFlush(Unpooled.copiedBuffer("Hello，客户端", CharsetUtil.UTF_8));
    }
    // 处理异常，一般是需要关闭通道
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        cause.printStackTrace();
        ctx.close();
    }
}
```

### 2.3 客户端

```java
public class NettyClient {
    public static void main(String[] args) throws InterruptedException {
        // 客户端需要一个事件循环组
        EventLoopGroup group = new NioEventLoopGroup();
        try {
            // 创建客户端启动对象
            // 注意客户端使用的不是 ServerBootstrap，而是Bootstrap
            Bootstrap bootstrap = new Bootstrap();
            // 设置相关参数
            bootstrap.group(group)
                    .channel(NioSocketChannel.class)
                    .handler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel ch) throws Exception {
                            ChannelPipeline pipeline = ch.pipeline();
                            // 在 pipeline 中加入 ProtoBufEncoder
                            pipeline.addLast("encoder",new ProtobufEncoder());
                            pipeline.addLast(new NettyClientHandler()); // 加入自己的处理器
                        }
                    });
            System.out.println(".........client is ready.......");
            // 启动客户端，并连接服务器端
            ChannelFuture future = bootstrap.connect("127.0.0.1", 6668).sync();
            // 对关闭通道进行监听
            future.channel().closeFuture().sync();
        }finally {
            group.shutdownGracefully();
        }
    }
}
```

```java
public class NettyClientHandler extends ChannelInboundHandlerAdapter {
    // 当通道就绪就会触发该方法
    @Override
    public void channelActive(ChannelHandlerContext ctx) throws Exception {
        // 发送一个 Student 对象到服务器
        StudentPOJO.Student student = StudentPOJO.Student.newBuilder().setId(4).setName("豹子头 林冲").build();
        ctx.writeAndFlush(student);
    }
    // 当通道有读取事件时，会触发
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        ByteBuf buf = (ByteBuf)msg;
        System.out.println("服务器回复的消息：" + buf.toString(CharsetUtil.UTF_8));
        System.out.println("服务器地址：" + ctx.channel().remoteAddress());
    }
    // 处理异常，一般是需要关闭通道
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        cause.printStackTrace();
        ctx.close();
    }
}
```

## 三、Protobuf实例2：生成类

1、客户端可以随机发送 Student POJO/Worker POJO 对象到服务器（通过Protobuf编码）

2、服务端能接收 Student POJO/Worker POJO 对象（需要判断是哪种类型），并显示信息（通过Protobu解码）

### 3.1 proto 文件

```java
	syntax = "proto3";
option optimize_for = SPEED; // 快速解析
option java_package="com.u7007.netty.codec2"; // 指定生成到哪个包下
option java_outer_classname="MyDataInfo"; // 外部类名
// protobuf 可以使用 message 管理其它的 message
message myMessage {
    // 定义一个枚举类型
    enum DataType {
        StudentType = 0; // 在 proto3 中要求 enum 的编号从0开始
        WorkerType = 1;
    }
    // 用 data_type 来标识传的是哪一个枚举类型
    DataType data_type = 1;
    // 表示每次枚举类型最多只能出现其中的一个，节省空间
    oneof dataBody {
        Student student = 2;
        Worker worker = 3;
    }
}
message Student {
    int32 id = 1;
    string name = 2;
}
message Worker {
    string name = 1;
    int32 age = 2;
}
```

### 3.2 服务器端

```java
public class NettyServer {
    public static void main(String[] args) throws InterruptedException {
        // 创建 BossGroup 和 WorkerGroup
        EventLoopGroup bossGroup = new NioEventLoopGroup(1);
        EventLoopGroup workerGroup = new NioEventLoopGroup();
        try {
            // 创建服务器端启动对象，配置参数
            ServerBootstrap bootstrap = new ServerBootstrap();
            // 使用链式编程来进行设置
            bootstrap.group(bossGroup, workerGroup)
                    .channel(NioServerSocketChannel.class)
                    .option(ChannelOption.SO_BACKLOG, 128)
                    .childOption(ChannelOption.SO_KEEPALIVE, true)
                    .childHandler(new ChannelInitializer<SocketChannel>() {
                        // 给pipeline设置处理器
                        @Override
                        protected void initChannel(SocketChannel ch) throws Exception {
                            ChannelPipeline pipeline = ch.pipeline();
                            // 在 pipeline 中加入 ProtoBufDecoder
                            // 指定对哪种对象进行解码
                            pipeline.addLast("decoder",new ProtobufDecoder(MyDataInfo.MyMessage.getDefaultInstance()));
                            pipeline.addLast(new NettyServerHandler());
                        }
                    });
            System.out.println(".........server is ready.......");
            // 绑定一个端口并且同步处理，生成了一个 ChannelFuture 对象，已经启动了服务器（并绑定端口）
            ChannelFuture future = bootstrap.bind(6668).sync();
            // 给 future 注册监听器，监控关心的事件
            future.addListener(new ChannelFutureListener() {
                @Override
                public void operationComplete(ChannelFuture future) throws Exception {
                    if (future.isSuccess()) {
                        System.out.println("监听端口 6668 成功");
                    } else {
                        System.out.println("监听端口 6668 失败");
                    }
                }
            });
            // 对关闭通道进行监听
            future.channel().closeFuture().sync();
        } finally {
            bossGroup.shutdownGracefully();
            workerGroup.shutdownGracefully();
        }
    }
}
```

```java
public class NettyServerHandler extends SimpleChannelInboundHandler<MyDataInfo.MyMessage> {
    // 读取数据的事件（可以读取客户端发送的消息）
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, MyDataInfo.MyMessage msg) throws Exception {
        // 根据 dataType 来显示不同的信息
        MyDataInfo.MyMessage.DataType dataType = msg.getDataType();
        if (dataType == MyDataInfo.MyMessage.DataType.StudentType) {
            MyDataInfo.Student student = msg.getStudent();
            System.out.println("学生 id=" + student.getId() + " 学生名字=" + student.getName());
        } else if (dataType == MyDataInfo.MyMessage.DataType.WorkerType) {
            MyDataInfo.Worker worker = msg.getWorker();
            System.out.println("工人名字=" + worker.getName() + " 年龄=" + worker.getAge());
        } else {
            System.out.println("传输的类型不正确");
        }
    }
    // 数据读取完毕
    @Override
    public void channelReadComplete(ChannelHandlerContext ctx) throws Exception {
        // 将数据写入到缓冲
        ctx.writeAndFlush(Unpooled.copiedBuffer("Hello，客户端", CharsetUtil.UTF_8));
    }
    // 处理异常，一般是需要关闭通道
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        cause.printStackTrace();
        ctx.close();
    }
}
```

### 3.3 客户端

```java
public class NettyClient {
    public static void main(String[] args) throws InterruptedException {
        // 客户端需要一个事件循环组
        EventLoopGroup group = new NioEventLoopGroup();
        try {
            // 创建客户端启动对象
            // 注意客户端使用的不是 ServerBootstrap，而是Bootstrap
            Bootstrap bootstrap = new Bootstrap();
            // 设置相关参数
            bootstrap.group(group)
                    .channel(NioSocketChannel.class)
                    .handler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel ch) throws Exception {
                            ChannelPipeline pipeline = ch.pipeline();
                            // 在 pipeline 中加入 ProtoBufEncoder
                            pipeline.addLast("encoder",new ProtobufEncoder());
                            pipeline.addLast(new NettyClientHandler()); // 加入自己的处理器
                        }
                    });
            System.out.println(".........client is ready.......");
            // 启动客户端，并连接服务器端
            ChannelFuture future = bootstrap.connect("127.0.0.1", 6668).sync();
            // 对关闭通道进行监听
            future.channel().closeFuture().sync();
        }finally {
            group.shutdownGracefully();
        }
    }
}
```

```java
public class NettyClientHandler extends ChannelInboundHandlerAdapter {
    // 当通道就绪就会触发该方法
    @Override
    public void channelActive(ChannelHandlerContext ctx) throws Exception {
        // 随机的发送 Student 或者 Worker 对象
        int random = new Random().nextInt(3);
        MyDataInfo.MyMessage myMessage = null;
        System.out.println(random);
        if (0 == random) { // 发送 Student 对象
            myMessage = MyDataInfo.MyMessage.newBuilder().setDataType(MyDataInfo.MyMessage.DataType.StudentType)
                    .setStudent(MyDataInfo.Student.newBuilder().setId(5).setName("玉麒麟 卢俊义").build()).build();
        }else{ // 发送 Worker 对象
            myMessage = MyDataInfo.MyMessage.newBuilder().setDataType(MyDataInfo.MyMessage.DataType.WorkerType)
                    .setWorker(MyDataInfo.Worker.newBuilder().setAge(20).setName("老李").build()).build();
        }
        ctx.writeAndFlush(myMessage);
    }
    // 当通道有读取事件时，会触发
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        ByteBuf buf = (ByteBuf) msg;
        System.out.println("服务器回复的消息：" + buf.toString(CharsetUtil.UTF_8));
        System.out.println("服务器地址：" + ctx.channel().remoteAddress());
    }
    // 处理异常，一般是需要关闭通道
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        cause.printStackTrace();
        ctx.close();
    }
}
```
