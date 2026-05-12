# 05、Netty入门 - Selector介绍和原理
- 来源：https://ddkk.com/zhuanlan/server/netty/2/5.html
- 分类：服务器框架
- 分组：教程目录
## Selector（选择器）介绍

**1、** Java的NIO，用非阻塞的IO方式，可以用一个线程，处理多个的客户端连接，就会使用到Selector（选择器）；

**2、** Selector能够检测多个注册的通道上是否有事件发生（注意：多个Channel以事件的方式可以注册到同一个Selector），如果有事件发生，便获取事件然后针对每个事件进行相应的处理这样就可以只用一个单线程去管理多个通道，也就是管理多个连接和请求；

**3、** 只有在连接真正有读写事件发生时，才会进行读写，就大大地减少了系统开销，并且不必为每个连接都创建一个线程，不用去维护多个线程；

**4、** 避免了多线程之间的上下文切换导致的开销；

## Selector示意图和特点说明

Selector示意图如下所示。

特点再说明

**1、** Netty的IO线程NioEventLoop聚合了Selector（选择器，也叫多路复用器），可以同时并发处理成百上千个客户端连接；

**2、** 当线程从某客户端Socket通道进行读写数据时，若没有数据可用时，该线程可以进行其他任务；

**3、** 线程通常将非阻塞IO的空闲时间用于在其他通道上执行IO操作，所以单独的线程可以管理多个输入和输出通道；

**4、** 由于读写操作都是非阻塞的，这就可以充分提升IO线程的运行效率，避免由于频繁I/O阻塞导致的线程挂起；

**5、** 一个I/O线程可以并发处理N个客户端连接和读写操作，这从根本上解决了传统同步阻塞I/O一连接一线程模型，架构的性能、弹性伸缩能力和可靠性都得到了极大的提升；

## Selector类相关方法

Selector类是一个抽象类，常用方法和说明如下：

```java
public abstract class Selector implements Closeable {
    // 得到一个选择器对象    
    public static Selector open()
    // 监控所有注册的通道，当其中有IO操作可以进行时，将对应的SelectionKey加入到内部集合中并返回，参数用来设置超时时间
    public abstract int select(long timeout)
    // 从内部集合中得到所有的SelectionKey
    public abstract Set<SelectionKey> selectedKeys();
}
```

**注意事项**

1、NIO中的ServerSocketChannel功能类似ServerSocket，SocketChannel功能类似Socket

2、selector相关方法说明

```java
selector.select()    // 阻塞
selector.select(1000);    // 阻塞1000毫秒，在1000毫秒后返回
selector.wakeup();    // 唤醒selector
selector.selectNow();    // 不阻塞，立马返还
```

## NIO非阻塞 网络编程原理分析图

NIO非阻塞网络编程相关的（Selector、SelectionKey、ServerSocketChannel和SocketChannel）关系梳理图

上图说明：

1、当客户端连接时，会通过ServerSocketChannel得到SocketChannel；

2、Selector进行监听 select方法，返回有事件发生的通道的个数；

3、将SocketChannel注册到Selector上，register(Selector sel, int ops)，一个selector上可以注册多个SocketChannel；

4、注册后返回一个SelectionKey，会和该Selector关联（集合）；

5、进一步得到各个SelectionKey（有事件发生的）

6、在通过SelectionKey反向获取注册的SocketChannel channel()

7、可以通过 得到的channel，完成业务处理

### 快速入门案例

需求：

1、编写一个NIO入门案例，实现服务器端和客户端之间的数据简单通讯（非阻塞）

2、目的：理解NIO非阻塞网络编程机制

```java
/**
 * 服务端代码
 */
public class NIOServer {
    public static void main(String[] args) throws IOException {
        // 创建ServerSocketChannel -> ServerSocket
        ServerSocketChannel serverSocketChannel = ServerSocketChannel.open();
        // 得到一个Selector实例
        Selector selector = Selector.open();
        // 绑定一个端口6666，在服务器端监听
        serverSocketChannel.socket().bind(new InetSocketAddress(6666));
        // 设置为非阻塞
        serverSocketChannel.configureBlocking(false);
        // 把 serverSocketChannel 注册到Selector中，关心事件为 OP_ACCEPT
        serverSocketChannel.register(selector, SelectionKey.OP_ACCEPT);
        // 循环等待客户端连接
        while (true) {
            // 等待一秒钟，如果没有事件发生，返回
            if (selector.select(1000) == 0) {// 没有事件发生
                System.out.println("服务器等待了1秒，无连接");
                continue;
            }
            // 如果返回的>0，就获取到相关的SelectionKey集合
            // 1.如果返回的>0，表示已经获取到关注的事件
            // 2.selector.selectedKeys() 返回关注事件的集合
            // 通过selectionKeys反向获取通道
            Set<SelectionKey> selectionKeys = selector.selectedKeys();
            // 遍历集合Set<SelectionKey>
            Iterator<SelectionKey> keyIterator = selectionKeys.iterator();
            while (keyIterator.hasNext()) {
                // 获取到SelectionKey
                SelectionKey key = keyIterator.next();
                // 根据key对应的通道发生的事件做相应的处理
                if (key.isAcceptable()) {// 如果是 OP_ACCEPT，有新的客户端连接
                    // 给该客户端生成一个SocketChannel
                    SocketChannel socketChannel = serverSocketChannel.accept();
                    // 将SocketChannel 注册到selector，关注事件为OP_READ，同时给socketChannel关联一个Buffer
                    socketChannel.register(selector, SelectionKey.OP_READ, ByteBuffer.allocate(1024));
                }
                if(key.isReadable()){// 发生OP_READ
                    // 通过key反向获取到对应的channel
                    SocketChannel channel = (SocketChannel) key.channel();
                    // 获取到该channel关联的buffer
                    ByteBuffer buffer = (ByteBuffer) key.attachment();
                    int read = channel.read(buffer);
                    System.out.println("From 客户端 " + new String(buffer.array()));
                }
                // 手动从集合中移除当前的SelectionKey，防止重复操作
                keyIterator.remove();
            }
        }
    }
}
```

```java
/**
 * 客户端代码
 */
public class NIOClient {
    public static void main(String[] args) throws IOException {
        // 得到一个网络通道
        SocketChannel socketChannel = SocketChannel.open();
        // 设置非阻塞模式
        socketChannel.configureBlocking(false);
        // 提供服务器端的IP和端口
        InetSocketAddress socketAddress = new InetSocketAddress("127.0.0.1", 6666);
        // 连接服务器
        if(!socketChannel.connect(socketAddress)){
            while (!socketChannel.finishConnect()){
                System.out.println("因为连接需要时间，客户端不会阻塞，可以做其他工作......");
            }
        }
        // 如果连接成功就发送数据
        String str = "hello, 大家好....";
        ByteBuffer buffer = ByteBuffer.wrap(str.getBytes());
        // 发送数据，将buffer写入到channel中
        socketChannel.write(buffer);
        System.in.read();
    }
}
```

先启动服务端，在启动多个客户端，测试结果

## SelectionKey API

1、SelectionKey，表示Selector和网络通道的注册关系，共四种：

intOP_ACCEPT：有新的网络连接可以accept，值为16

intOP_CONNECT：代表连接已经建立，值为8

intOP_READ：代表读操作，值为1

intOP_WRITE：代表写操作，值为4

源码中：

```java
public static final int OP_ACCEPT = 1 << 4;
public static final int OP_CONNECT = 1 << 3;
public static final int OP_READ = 1 << 0;
public static final int OP_WRITE = 1 << 2;
```

2、SelectionKey相关方法

```java
public abstract class SelectionKey {
    public abstract Selector selector();// 得到与之关联的Selector对象
    public abstract SelectableChannel channel();// 得到与之关联的通道
    public final Object attachment();    // 得到与之关联的共享数据
    public abstract SelectionKey interestOps(int ops);    // 设置或改变监听事件
    public final boolean isAcceptable(); // 是否可以accept
    public final boolean isReadable(); // 是否可以读
    public final boolean isWritable(); // 是否可以写
}
```

## ServerSocketChannel API

1、ServerSocketChannel 在服务器端监听新的客户端Socket连接

2、相关方法如下

```java
public abstract class ServerSocketChannel
    extends AbstractSelectableChannel
    implements NetworkChannel{
    public static ServerSocketChannel open() // 得到一个ServerSocketChannel通道
    public final ServerSocketChannel bind(SocketAddress local) // 设置服务器端端口号
    public final SelectableChannel configureBlocking(boolean block) // 设置阻塞或非阻塞模式，取值false表示采用非阻塞模式
    public abstract SocketChannel accept() // 接受一个连接，返回代表这个连接的通道对象
    public final SelectionKey register(Selector sel, int ops, Object att) // 注册一个选择器并设置监听事件
}
```

## SocketChannel API

1、SocketChannel，网络IO通道，具体负责进行读写操作。NIO把缓冲区的数据写入通道，或者把通道里的数据读到缓冲区。

2、相关方法如下

```java
public abstract class SocketChannel
    extends AbstractSelectableChannel
    implements ByteChannel, ScatteringByteChannel, GatheringByteChannel, NetworkChannel
{
    public static SocketChannel open() // 得到一个SocketChannel通道
    public final SelectableChannel configureBlocking(boolean block) // 设置阻塞或非阻塞模式，取值false表示采用非阻塞模式
    public abstract boolean connect(SocketAddress remote) // 连接服务器
    public abstract boolean finishConnect() // 如果上面的方法连接失败，接下来就要通过该方法完成连接操作
    public abstract int write(ByteBuffer src) // 往通道里写数据
    public abstract int read(ByteBuffer dst) // 往通道里读数据
    public final SelectionKey register(Selector sel, int ops, Object att) // 注册一个选择器并设置监听事件，最后一个参数可以设置共享数据
    public final void close() // 关闭通道
}
```
