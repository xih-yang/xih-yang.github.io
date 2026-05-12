# 14、Netty 源码解析 - 线程模型三种实现
- 来源：https://ddkk.com/zhuanlan/server/netty/1/14.html
- 分类：服务器框架
- 分组：教程目录
## 一、单Reactor单线程

### 1.1 工作原理

### 1.2 NIO 群聊系统

```java
/**
 * @desc 群聊服务器端
 * @author yxs
 * @date 2022-02-06 16:50
 */
public class GroupChatServer {
    // 定义属性
    private Selector selector;
    private ServerSocketChannel listenChannel;
    private static final int PORT = 6667;
    // 构造器，完成初始化操作
    public GroupChatServer(){
        try {
            // 得到选择器
            selector = Selector.open();
            // 初始化 ServerSocketChannel
            listenChannel = ServerSocketChannel.open();
            // 绑定端口
            listenChannel.socket().bind(new InetSocketAddress(PORT));
            // 设置非阻塞模式
            listenChannel.configureBlocking(false);
            // 将 listenChannel 注册到 selector
            listenChannel.register(selector, SelectionKey.OP_ACCEPT);
        }catch (IOException e){
            e.printStackTrace();
        }
    }
    // 监听
    public void listen(){
        System.out.println("监听线程：" + Thread.currentThread().getName());
        try {
            // 循环处理
            while (true){
                int count = selector.select();
                if(count > 0){ // 有事件处理
                    // 遍历得到的 selectionKey 集合
                    Iterator<SelectionKey> iterator = selector.selectedKeys().iterator();
                    while (iterator.hasNext()){
                        // 取出 selectionKey
                        SelectionKey key = iterator.next();
                        // 监听到 accept 事件
                        if(key.isAcceptable()){
                            SocketChannel sc = listenChannel.accept();
                            sc.configureBlocking(false);
                            // 将 sc 注册到 selector 上
                            sc.register(selector,SelectionKey.OP_READ);
                            // 提示
                            System.out.println(sc.getRemoteAddress() + " 上线");
                        }
                        // 监听到 read 事件，即通道是可读的状态
                        if(key.isReadable()){
                            // 处理读（专门写方法...）
                            readData(key);
                        }
                        // 删除当前 key，防止重复处理
                        iterator.remove();
                    }
                }else{
                    System.out.println("等待....");
                }
            }
        }catch (IOException e){
            e.printStackTrace();
        }finally {
        }
    }
    // 读取客户端消息
    private void readData(SelectionKey key){
        // 定义一个 SocketChannel
        SocketChannel channel = null;
        try {
            // 获取到关联的 channel
            channel = (SocketChannel)key.channel();
            // 创建 buffer
            ByteBuffer buffer = ByteBuffer.allocate(1024);
            int count = channel.read(buffer);
            // 根据 count 的值做处理
            if(count > 0){
                // 把缓冲区的数据转成字符串
                String msg = new String(buffer.array());
                // 输出该消息
                System.out.println("from client：" + msg);
                // 向其它的客户端转发消息（去掉自己），专门写一个方法来处理
                sendInfoToOtherClients(msg,channel);
            }
        }catch (IOException e){
            if(channel != null){
                try {
                    System.out.println(channel.getRemoteAddress() + " 离线了");
                    // 取消注册
                    key.cancel();
                    // 关闭通道
                    channel.close();
                } catch (IOException ex) {
                    ex.printStackTrace();
                }
            }
        }
    }
    // 转发消息给其它的客户端（通道）
    private void sendInfoToOtherClients(String msg,SocketChannel self) throws IOException {
        System.out.println("服务器转发消息中...");
        System.out.println("服务器转发数据给客户端线程：" + Thread.currentThread().getName());
        // 遍历所有注册到 selector 上的 socketChannel，并排除 self
        for(SelectionKey key:selector.keys()){
            // 通过 key 取出对应的 SocketChannel
            Channel targetChannel = key.channel();
            // 排除自己，TODO
            if(targetChannel instanceof SocketChannel && targetChannel != self){
                // 转型
                SocketChannel dest = (SocketChannel) targetChannel;
                // 将 msg 存储到 buffer
                ByteBuffer buffer = ByteBuffer.wrap(msg.getBytes());
                // 将 buffer 的数据写入通道
                dest.write(buffer);
            }
        }
    }
    public static void main(String[] args) {
        // 创建服务器对象
        GroupChatServer chatServer = new GroupChatServer();
        chatServer.listen();
    }
}
```

### 1.3 方案说明

1、Select 是 I/O复用模型 的标准网络API，可以实现应用程序通过一个阻塞对象监听多路连接请求

2、Reactor 对象通过 Select 监听客户端请求事件，收到事件后通过 Dispatch 进行分发

3、如果是建立连接请求事件，则由 Acceptor 通过 Accept 处理连接请求，然后创建一个 Handler 对象处理连接完成后的后续业务处理

4、如果不是建立连接事件，则 Reactor 会分发调用连接对应的 Handler 来响应

5、Handler 会完成 Read->业务处理->Send 的完整业务流程

**结合案例：** 服务器端用一个线程通过多路复用搞定所有的IO操作（连接、读、写等），编码简单，清晰明了，但是如果客户端连接数量较多，将无法支撑。

### 1.4 优缺点

1、优点：模型简单，没有多线程、进程通信、竞争的问题，全部都在一个线程中完成

2、缺点：性能问题，只有一个线程，无法完全发挥多核 CPU 的性能。Handler 在处理某个连接上的业务时，整个进程无法处理其它连接事件，很容易导致性能瓶颈

3、缺点：可靠性问题，线程意外终止，或者进入死循环，会导致整个系统通信模块不可用，不能接收和处理外部消息，造成节点故障

4、适用场景：客户端的数量有限，业务处理非常快速，比如 Redis 在业务处理的时间复杂度 O(1) 的情况。

## 二、单Reactor多线程

### 2.1 工作原理

### 2.2 方案说明

1、Reactor 对象通过 Select 监听客户端请求事件，收到事件后通过 Dispatch 进行分发

2、如果是建立连接请求事件，则由 Acceptor 通过 Accept 处理连接请求，然后创建一个 Handler 对象处理连接完成后的后续业务处理

3、如果不是建立连接事件，则 Reactor 会分发调用连接对应的 Handler 来处理

4、Handler 只负责响应事件，不做具体的业务处理，通过 read 读取数据后，会分发给后面的worker线程池的某个线程处理业务

5、worker线程池会分配一个独立线程完成真正的业务，并将结果返回给 Handler

6、Handler 收到响应后，通过 send 将结果返回给 client

### 2.3 优缺点

1、优点：可以充分的利用多核 CPU 的处理能力（多线程）

2、缺点：多线程数据共享和访问比较复杂，Reactor 处理所有事件的监听和响应，并且Reactor 在单线程中运行，高并发场景下容易出现性能瓶颈

## 三、主从Reactor多线程

### 3.1 工作原理

### 3.2 方案说明

1、Reactor主线程 MainReactor 对象通过 select 监听连接事件，收到事件后，通过 Acceptor 处理连接事件

2、当 Acceptor 处理连接事件后，MainReactor 将连接分配给 SubReactor

3、SubReactor 将连接加入到连接队列进行监听，并创建 Handler 进行各种事件处理

4、当有新事件发生时，SubReactor 就会调用对应的 Handler 进行处理

5、Handler 通过 read 读取数据后，会分发给后面的worker线程池的某个线程处理业务

6、worker线程池会分配一个独立线程完成真正的业务，并将结果返回给 Handler

7、Handler 收到响应后，通过 send 将结果返回给 client

8、Reactor主线程 可以对应多个 Reactor子线程，即 MainReactor 可以关联多个 SubReactor

### 3.3 推荐参考

《Scalable IO In Java》对 Multiple Reactors的原理图解：

### 3.4 优缺点

1、优点：父线程与子线程的数据交互简单职责明确，父线程只需要接收新连接，子线程完成后续的业务处理

2、优点：父线程与子线程的数据交互简单，Reactor主线程只需要把新连接传给子线程，子线程无需返回数据

3、缺点：编程复杂度较高

结合实例：这种模型在许多项目中广泛使用，包括 Nginx 主从 Reactor 多进程模型、Memcached主从多线程、Netty主从多线程模型等等

## 四、Reactor模型总结

**3种模式用生活案例来理解：**

1、单Reactor单线程，前台接待员和服务员是同一个人，全程为顾客服务

2、单Reactor多线程，1个前台接待员，多个服务员，接待员只负责接待

3、主从Reactor多线程，多个前台接待员，多个服务员

**Reactor模式优点：**

1、响应快，不必为单个同步时间所阻塞，虽然Reactor本身是同步的

2、可以最大程度的避免复杂的多线程及同步问题，并且避免了多线程/进程的切换开销

3、扩展性好，可以方便的通过增加Reactor实例个数来充分利用CPU资源

4、复用性好，Reactor模型本身与具体事件处理逻辑无关，具有很高的复用性
