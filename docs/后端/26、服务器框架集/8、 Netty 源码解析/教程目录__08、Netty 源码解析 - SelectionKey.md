# 08、Netty 源码解析 - SelectionKey
- 来源：https://ddkk.com/zhuanlan/server/netty/1/8.html
- 分类：服务器框架
- 分组：教程目录
## 一、NIO 非阻塞网络编程原理分析

NIO非阻塞网络编程相关的关系（Selector、SelectionKey、ServerSocketChannel和SocketChannel）梳理图：

1、当客户端连接时，会通过 ServerSocketChannel 得到 SocketChannel

2、Selector 会通过 select() 方法监听，返回有事件发生的通道的个数

3、将 SocketChannel 注册到 Selector 上，public final SelectionKey register(Selector sel, int ops)，一个 Selector 上可以注册多个 SocketChannel

4、注册后返回一个 SelectionKey，会和该 Selector 关联（集合）

5、进一步得到有事件发生的 SelectionKey

6、再通过 SelectionKey 反向获取 SocketChannel，方法时：public abstract SelectableChannel channel()

7、可以通过得到的 Channel，完成相应的业务处理

## 二、NIO 应用案例

### 2.1 NIO 非阻塞网络编程快速入门

**案例要求**

**1、** 编写一个NIO入门案例，实现服务器端和客户端之间的数据简单通讯（非阻塞）；

**2、** 目的：理解NIO非阻塞网络编程机制；

**3、** 代码演示；

```java
/**
 * @desc 服务端
 * @author yxs
 * @date 2022-02-05 9:43
 */
public class NIOServer {
    public static void main(String[] args) throws IOException {
        // 创建 ServerSocketChannel 类似于 ServerSocket
        ServerSocketChannel serverSocketChannel = ServerSocketChannel.open();
        // 得到一个 Selector 对象
        Selector selector = Selector.open();
        // 绑定端口6666，在服务器端监听
        serverSocketChannel.socket().bind(new InetSocketAddress(6666));
        // 设置为非阻塞
        serverSocketChannel.configureBlocking(false);
        // 把 ServerSocketChannel 注册到 Selector，关心的事件为：OP_ACCEPT
        serverSocketChannel.register(selector, SelectionKey.OP_ACCEPT);
        System.out.println("注册的 selectionKey 数量 = " + selector.keys().size()); // 返回 1
        // 循环等待客户端连接
        while (true) {
            // 这里我们等待1秒（可以设置为selectNow），如果没有事件发生，就继续
            if(selector.select(1000) == 0){
                System.out.println("服务器等待了1秒，无连接");
                continue;
            }
            // 如果返回的大于0，就获取到相关的 SelectionKey 集合
            // 1. 如果返回的大于0，表示已经获取到关注的事件
            // 2. selector.selectedKeys() 返回关注事件的集合
            //    通过 selectionKeys 反向获取通道
            Set<SelectionKey> selectionKeys = selector.selectedKeys();
            System.out.println("selectionKeys 数量 = " + selectionKeys.size());
            // 遍历 Set<SelectionKey>，使用迭代器遍历
            Iterator<SelectionKey> keyIterator = selectionKeys.iterator();
            while (keyIterator.hasNext()) {
                // 获取到 SelectionKey
                SelectionKey key = keyIterator.next();
                // 根据 key 对应的通道发生的事件做相应的处理
                if(key.isAcceptable()){ // 如果发生的事件为：OP_ACCEPT，有新的客户端连接
                    // 给该客户端生成一个 SocketChannel
                    SocketChannel socketChannel = serverSocketChannel.accept();
                    System.out.println("客户端连接成功 生成了一个 socketChannel " + socketChannel.hashCode());
                    // 将 SocketChannel 设置为非阻塞
                    socketChannel.configureBlocking(false);
                    // 将 SocketChannel 注册到 Selector，关心的事件为：OP_READ，同时给 SocketChannel
                    // 关联一个 Buffer
                    socketChannel.register(selector,SelectionKey.OP_READ, ByteBuffer.allocate(1024));
                    System.out.println("客户端连接后，注册的 selectionKey 数量 = " + selector.keys().size());// 2,3,4...
                }
                if(key.isReadable()){ // 如果是发生的事件为：OP_READ
                    // 通过 key 反向获取到对应的 channel
                    SocketChannel channel = (SocketChannel)key.channel();
                    // 获取到该channel关联的buffer
                    ByteBuffer buffer = (ByteBuffer) key.attachment();
                    channel.read(buffer);
                    System.out.println("from client："+new String(buffer.array()));
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
 * @desc 客户端
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/2/5 22:09
 */
public class NIOClient {
    public static void main(String[] args) throws IOException {
        // 得到一个网络通道
        SocketChannel socketChannel = SocketChannel.open();
        // 设置非阻塞
        socketChannel.configureBlocking(false);
        // 提供服务器端的 ip 和 端口
        InetSocketAddress inetSocketAddress = new InetSocketAddress("127.0.0.1", 6666);
        // 连接服务器
        if(!socketChannel.connect(inetSocketAddress)){
            while (!socketChannel.finishConnect()){
                System.out.println("因为连接需要时间，客户端不会阻塞，可以做其它工作");
            }
        }
        // 如果连接成功，就发送数据
        String str = "Hello，World！";
        // Wraps a byte array into a buffer.
        ByteBuffer buffer = ByteBuffer.wrap(str.getBytes());
        // 发送数据，将 buffer 数据写入 channel
        socketChannel.write(buffer);
        System.in.read();
    }
}
```

## 三、SelectionKey API

1、SelectionKey，表示 Selector 和网络通道的注册关系，共四种：

intOP_ACCEPT：有新的网络连接，值为16

intOP_CONNECT：代表连接已经连接，值为8

intOP_READ：代表读操作，值为1

intOP_WRITE：代表写操作，值为4

源码中：（位运算）

```java
public static final int OP_ACCEPT = 1 << 4;
public static final int OP_CONNECT = 1 << 3;
public static final int OP_READ = 1 << 0;
public static final int OP_WRITE = 1 << 2;
```

2、SelectionKey 相关方法

方法
描述

public abstract Selector selector()
得到与之关联的 Selector 对象

public abstract SelectableChannel channel()
得到与之关联的通道

public final Object attachment()
得到与之关联的共享数据

public abstract SelectionKey interestOps(int ops)
设置或改变监听事件

public final boolean isAcceptable()
是否可以 accept

public final boolean isReadable()
是否可以读

public final boolean isWritable()
是否可以写
