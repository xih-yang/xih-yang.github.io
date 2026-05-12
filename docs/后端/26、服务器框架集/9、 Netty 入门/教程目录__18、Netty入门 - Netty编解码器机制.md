# 18、Netty入门 - Netty编解码器机制
- 来源：https://ddkk.com/zhuanlan/server/netty/2/18.html
- 分类：服务器框架
- 分组：教程目录
## 1.编码和解码的基本介绍

1、编写网络应用程序时，因为数据在网络中传输的都是二进制字节码数据，在发送数据时就需要编码，接收数据时就需要解码；

2、codec（编码器）的组成部分有两个：decoder（编码器）和encoder（编码器）。encoder负责把业务数据转换成字节码数据，decoder负责把字节码数据转换成业务数据；

## 2.Netty本身的编码解码的机制和问题分析

1、Netty 自身提供了一些codec （编解码器）

2、Netty 提供的编码器

- StringEncoder，对字符串数据进行编码
- ObjectEncoder，对 Java 对象进行编码
- ...

3、Netty 提供的解码器

- StringDecoder，对字符串数据进行解码
- ObjectDecoder，对 Java 对象进行解码
- ...

4、Netty 本身自带的 ObjectDecoder 和 ObjectEncoder 可以用来实现 POJO 对象或这种业务对象的编码和解码，底层使用的仍是 Java 序列化技术，而 Java 序列化技术本身效率就不高，存在如下问题

- 无法跨语言
- 序列化后的体积太大，是二进制编码的5倍多
- 序列化性能太低

由于这些问题的存在，引出新的解决方案【Google 的 Protobuf】

## 3. Protobuf

## 3.1 Protobuf基本介绍

1、Protobuf 是 Google 发布的开源项目，全称 Google Protocol Buffers，是一种轻便高效的结构化数据存储方式，可以用于数据化数据串行化，或者说序列化。它很适合做数据存储或 RPC（远程过程调用 remote procedure call） 数据交换格式；

目前很多公司 http+json -> tcp+protobuf

2、参考文档：[https://developers.google.com/protocol-buffers/docs/proto](https://developers.google.com/protocol-buffers/docs/proto)

3、Ptorobuf 是以 message 的方式来管理数据的；

4、支持跨平台、跨语言，即[客户端和服务器端可以是不同的语言编写的]（支持目前绝大多数语言，例如 C++、C#、Java、Python 等）

5、高性能、高可靠性

6、使用 protobuf 编译器能自动生成代码，Protobuf 是将类的定义使用 .proto 文件进行描述。说明，在 idea 中编写 .proto 文件时，会自动提示是否下载 .proto 编写插件。可以让语法高亮。

7、然后通过 protoc.exe 编译器根据 .proto 自动生成 .java 文件；

8、protobuf 使用示意图

## 3.2 Protobuf 快速入门实例1

编写程序，使用 Protobuf 完成如下功能

1、客户端可以发送一个 Student Pojo 对象到服务器（通过 Protobuf 编码）；

2、服务端能接收 Student Pojo 对象，并显示信息（通过 Protobuf 解码）。

**代码实例**

1、在maven项目中引入 Protobuf 坐标，下载相关的jar包

```java
<dependency>
    <groupId>com.google.protobuf</groupId>
    <artifactId>protobuf-java</artifactId>
    <version>3.6.1</version>
</dependency>
```

2、编写Student.proto文件，内容如下：

```java
syntax = "proto3"; // 版本
option java_outer_classname = "StudentPOJO"; //生成的外部类名，同时也是文件名
// protobuf 使用 message 管理数据
message Student{// 会在 StudentPOJO 外部类生成一个内部类 Student，他是真正发送的 POJO对象
  int32 id = 1; // Studnet类中有一个属性 名字为id 类型为 int32 1表示属性序号，不是值
  string name = 2;
}
```

3、对Student.proto 进行编译，生成 StudentPOJO.java 文件。

4、将生成的 StudentPOJO.java 文件放入到项目中进行使用。

服务器端代码：

```java
public class NettyServer {
    public static void main(String[] args) throws InterruptedException {
        // 创建 BossGroup 和 WorkerGroup
        // 说明
        // 1.创建两个线程组 BossGroup 和 WorkerGroup
        // 2. BossGroup 只是处理连接请求，真正的和客户端业务处理，会交给 WorkerGroup 完成
        // 3. 两个都是无线循环
        // 4. bossGroup 和 workerGroup 含有的子线程(NioEventLoop)的个数
        // 默认 cpu的核数 * 2
        EventLoopGroup bossGroup = new NioEventLoopGroup(1);
        EventLoopGroup workerGroup = new NioEventLoopGroup(8);
        try {
            // 创建服务器端的启动对象，配置启动参数
            ServerBootstrap bootstrap = new ServerBootstrap();
            // 使用链式编程进行设置
            bootstrap.group(bossGroup, workerGroup) // 设置两个线程组
                    .channel(NioServerSocketChannel.class) // 使用 ioServerSocketChannel 作为服务器通道实现
                    .option(ChannelOption.SO_BACKLOG, 128) // 设置线程队列等待连接个数
                    .childOption(ChannelOption.SO_KEEPALIVE, true)  // 设置保持活动连接状态
                    .childHandler(new ChannelInitializer<SocketChannel>() {// 创建一个通道初始化对象（匿名对象）
                        // 给 pipeline 设置处理器
                        @Override
                        protected void initChannel(SocketChannel socketChannel) throws Exception {
                            ChannelPipeline pipeline = socketChannel.pipeline();
                            // 在 pipeline 加入 ProtobufDecoder
                            // 指定对那种对象进行解码
                            pipeline.addLast("decoder", new ProtobufDecoder(StudentPOJO.Student.getDefaultInstance()));
                            pipeline.addLast(new NettyServerHandler());
                        }
                    });  // 给我们的WorkerGroup 的 EventLoop 对应的管道设置处理器
            System.out.println(".....服务器 is ready.....");
            // 绑定一个端口，并且同步，生成一个ChannelFuture对象
            // 启动服务器
            ChannelFuture cf = bootstrap.bind(6668).sync();
            // 给 cf 注册监听器，监控我们关心的事件
            cf.addListener(new ChannelFutureListener() {
                @Override
                public void operationComplete(ChannelFuture future) throws Exception {
                    if (cf.isSuccess()) {
                        System.out.println("监听端口 6668 成功");
                    } else {
                        System.out.println("监听端口 6668 失败");
                    }
                }
            });
            // 对关闭通道进行监听
            cf.channel().closeFuture().sync();
        } finally {
            bossGroup.shutdownGracefully();
            workerGroup.shutdownGracefully();
        }
    }
}
/**
 * 说明：
 * 1.自定义一个 Handler 需要继承 netty 规定好的某个 handlerAdapter
 * 2.这是我们自定义的 Handler，才能称之为一个 handler
 */
public class NettyServerHandler extends ChannelInboundHandlerAdapter {
    // 读取数据实现（这里我们可以读取客户端发送的消息）
    /**
     * 1. ChannelHandlerContext ctx：上下文对象，含有管道 pipeline，通道channel，地址
     * 2. Object msg：就是客户端发送的数据 默认Object
     */
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        // 读取从客户端发送的 StudentPOJO.Student
        StudentPOJO.Student student = (StudentPOJO.Student) msg;
        System.out.println("客户端发送的数据 id=" + student.getId() + " 姓名：" + student.getName());
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

客户端代码：

```java
public class NettyClient {
    public static void main(String[] args) throws InterruptedException {
        // 客户端需要一个事件循环组
        EventLoopGroup group = new NioEventLoopGroup();
        try {
            // 创建客户端启动对象
            // 注意客户端使用的不是 ServerBootStrap 而是 BootStrap
            Bootstrap bootstrap = new Bootstrap();
            // 设置相关参数
            bootstrap.group(group) // 设置线程组
                    .channel(NioSocketChannel.class) // 设置客户端通道的实现类（反射）
                    .handler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel ch) throws Exception {
                            ChannelPipeline pipeline = ch.pipeline();
                            // 在 pipeline 中加入 protobuf 编码器
                            pipeline.addLast("encoder", new ProtobufEncoder());
                            pipeline.addLast(new NettyClientHandler());  // 加入自己的处理器
                        }
                    });
            System.out.println("客户端 ok....");
            // 启动客户端去连接服务端
            // 关于 ChannelFuture 要分析，涉及到 netty 的异步模型
            ChannelFuture channelFuture = bootstrap.connect("127.0.0.1", 6668).sync();
            // 给关闭通道进行监听
            channelFuture.channel().closeFuture().sync();
        } finally {
            group.shutdownGracefully();
        }
    }
}
public class NettyClientHandler extends ChannelInboundHandlerAdapter {
    // 当通道就绪，就会触发该方法
    @Override
    public void channelActive(ChannelHandlerContext ctx) throws Exception {
        // 发送 Student 对象到服务器
        StudentPOJO.Student student = StudentPOJO.Student.newBuilder().setId(1000).setName("张三").build();
        ctx.writeAndFlush(student);
    }
    // 当通道有读取事件时，会触发
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        ByteBuf byteBuf = (ByteBuf) msg;
        System.out.println("服务器回复的消息：" + byteBuf.toString(CharsetUtil.UTF_8));
        System.out.println("服务器的地址： " + ctx.channel().remoteAddress());
    }
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        cause.printStackTrace();
        ctx.close();
    }
}
```

## 3.3 Protobuf 快速入门实例2

编写程序，使用 Protobuf 完成如下功能

1、客户端可以随机发送 Student POJO / Worker POJO 对象到服务器（通过 Protobuf 编码）

2、服务端能接收 Student POJO / Worker POJO 对象（需要判断是哪种类型），并显示信息（通过 Protobuf 解码）

**代码实例**

1、在maven项目中引入 Protobuf 坐标，下载相关的jar包

```java
<dependency>
    <groupId>com.google.protobuf</groupId>
    <artifactId>protobuf-java</artifactId>
    <version>3.6.1</version>
</dependency>
```

2、编写Student.proto文件，内容如下：

```java
syntax = "proto3"; // 版本
option optimize_for = SPEED;
option java_package = "com.zf.netty.codec2";
option java_outer_classname = "MyDataInfo"; //生成的外部类名，同时也是文件名
// protobuf 使用 message 管理数据
// protobuf 可以使用 message 管理其它的message
message MyMessage{
  // 定义一个枚举类型
  enum DataType{
    StudentType = 0; //在ptoto3 要求enum 的编号从0开始
    workerType = 1;
  }
  // 用data_type 来标识传的是哪一个枚举类型
  DataType data_type = 1;
  // 表示每次枚举类型最多只能出现其中的一个，节省空间
  oneof dataBody{
    Student student = 2;
    Worker worker = 3;
  }
}
message Student{// 会在 StudentPOJO 外部类生成一个内部类 Student，他是真正发送的 POJO对象
  int32 id = 1; // Studnet类中有一个属性 名字为id 类型为 int32 1表示属性序号，不是值
  string name = 2;
}
message Worker{
  string name = 1;
  int32 age = 2;
}
```

3、对Student.proto 进行编译，生成 MyDataInfo.java 文件。

4、将生成的 MyDataInfo.java 文件放入到项目中进行使用。

服务器端代码：

```java
public class NettyServer {
    public static void main(String[] args) throws InterruptedException {
        // 创建 BossGroup 和 WorkerGroup
        // 说明
        // 1.创建两个线程组 BossGroup 和 WorkerGroup
        // 2. BossGroup 只是处理连接请求，真正的和客户端业务处理，会交给 WorkerGroup 完成
        // 3. 两个都是无线循环
        // 4. bossGroup 和 workerGroup 含有的子线程(NioEventLoop)的个数
        // 默认 cpu的核数 * 2
        EventLoopGroup bossGroup = new NioEventLoopGroup(1);
        EventLoopGroup workerGroup = new NioEventLoopGroup(8);
        try {
            // 创建服务器端的启动对象，配置启动参数
            ServerBootstrap bootstrap = new ServerBootstrap();
            // 使用链式编程进行设置
            bootstrap.group(bossGroup, workerGroup) // 设置两个线程组
                    .channel(NioServerSocketChannel.class) // 使用 ioServerSocketChannel 作为服务器通道实现
                    .option(ChannelOption.SO_BACKLOG, 128) // 设置线程队列等待连接个数
                    .childOption(ChannelOption.SO_KEEPALIVE, true)  // 设置保持活动连接状态
                    .childHandler(new ChannelInitializer<SocketChannel>() {// 创建一个通道初始化对象（匿名对象）
                        // 给 pipeline 设置处理器
                        @Override
                        protected void initChannel(SocketChannel socketChannel) throws Exception {
                            ChannelPipeline pipeline = socketChannel.pipeline();
                            // 在 pipeline 加入 ProtobufDecoder
                            // 指定对那种对象进行解码
                            pipeline.addLast("decoder", new ProtobufDecoder(MyDataInfo.MyMessage.getDefaultInstance()));
                            pipeline.addLast(new NettyServerHandler());
                        }
                    });  // 给我们的WorkerGroup 的 EventLoop 对应的管道设置处理器
            System.out.println(".....服务器 is ready.....");
            // 绑定一个端口，并且同步，生成一个ChannelFuture对象
            // 启动服务器
            ChannelFuture cf = bootstrap.bind(6668).sync();
            // 给 cf 注册监听器，监控我们关心的事件
            cf.addListener(new ChannelFutureListener() {
                @Override
                public void operationComplete(ChannelFuture future) throws Exception {
                    if (cf.isSuccess()) {
                        System.out.println("监听端口 6668 成功");
                    } else {
                        System.out.println("监听端口 6668 失败");
                    }
                }
            });
            // 对关闭通道进行监听
            cf.channel().closeFuture().sync();
        } finally {
            bossGroup.shutdownGracefully();
            workerGroup.shutdownGracefully();
        }
    }
}
/**
 * 说明：
 * 1.自定义一个 Handler 需要继承 netty 规定好的某个 handlerAdapter
 * 2.这是我们自定义的 Handler，才能称之为一个 handler
 */
public class NettyServerHandler extends SimpleChannelInboundHandler<MyDataInfo.MyMessage> {
    // 读取数据实现（这里我们可以读取客户端发送的消息）
    /**
     * 1. ChannelHandlerContext ctx：上下文对象，含有管道 pipeline，通道channel，地址
     * 2. Object msg：就是客户端发送的数据 默认Object
     */
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
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, MyDataInfo.MyMessage msg) throws Exception {
        // 根据 dataType 来显示不同的信息
        MyDataInfo.MyMessage.DataType dataType = msg.getDataType();
        if(dataType == MyDataInfo.MyMessage.DataType.StudentType){
            MyDataInfo.Student student = msg.getStudent();
            System.out.println("学生id=" + student.getId() + " 学生名字=" + student.getName());
        }else if(dataType == MyDataInfo.MyMessage.DataType.workerType){
            MyDataInfo.Worker worker = msg.getWorker();
            System.out.println("工人age=" + worker.getAge() + " 学生名字=" + worker.getName());
        }else{
            System.out.println("传输的类型不正确");
        }
    }
}
```

客户端代码：

```java
public class NettyClient {
    public static void main(String[] args) throws InterruptedException {
        // 客户端需要一个事件循环组
        EventLoopGroup group = new NioEventLoopGroup();
        try {
            // 创建客户端启动对象
            // 注意客户端使用的不是 ServerBootStrap 而是 BootStrap
            Bootstrap bootstrap = new Bootstrap();
            // 设置相关参数
            bootstrap.group(group) // 设置线程组
                    .channel(NioSocketChannel.class) // 设置客户端通道的实现类（反射）
                    .handler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel ch) throws Exception {
                            ChannelPipeline pipeline = ch.pipeline();
                            // 在 pipeline 中加入 protobuf 编码器
                            pipeline.addLast("encoder", new ProtobufEncoder());
                            pipeline.addLast(new NettyClientHandler());  // 加入自己的处理器
                        }
                    });
            System.out.println("客户端 ok....");
            // 启动客户端去连接服务端
            // 关于 ChannelFuture 要分析，涉及到 netty 的异步模型
            ChannelFuture channelFuture = bootstrap.connect("127.0.0.1", 6668).sync();
            // 给关闭通道进行监听
            channelFuture.channel().closeFuture().sync();
        } finally {
            group.shutdownGracefully();
        }
    }
}
public class NettyClientHandler extends ChannelInboundHandlerAdapter {
    // 当通道就绪，就会触发该方法
    @Override
    public void channelActive(ChannelHandlerContext ctx) throws Exception {
        // 随机的发送 Student 或者 Worker 对象
        int random = new Random().nextInt(3);
        MyDataInfo.MyMessage myMessage = null;
        if(0 == random){// 发送一个学生
            myMessage = MyDataInfo.MyMessage.newBuilder().setDataType(MyDataInfo.MyMessage.DataType.StudentType)
                    .setStudent(MyDataInfo.Student.newBuilder().setId(100).setName("李四").build()).build();
        }else{ // 发送一个 worker 对象
            myMessage = MyDataInfo.MyMessage.newBuilder().setDataType(MyDataInfo.MyMessage.DataType.workerType)
                    .setWorker(MyDataInfo.Worker.newBuilder().setAge(20).setName("老李").build()).build();
        }
        ctx.writeAndFlush(myMessage);
    }
    // 当通道有读取事件时，会触发
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        ByteBuf byteBuf = (ByteBuf) msg;
        System.out.println("服务器回复的消息：" + byteBuf.toString(CharsetUtil.UTF_8));
        System.out.println("服务器的地址： " + ctx.channel().remoteAddress());
    }
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        cause.printStackTrace();
        ctx.close();
    }
}
```

测试结果如下。
