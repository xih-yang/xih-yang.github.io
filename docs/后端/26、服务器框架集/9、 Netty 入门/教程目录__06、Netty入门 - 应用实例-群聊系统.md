# 06、Netty入门 - 应用实例-群聊系统
- 来源：https://ddkk.com/zhuanlan/server/netty/2/6.html
- 分类：服务器框架
- 分组：教程目录
## 需求：

1、编写一个NIO群聊系统，实现服务器端和客户端之间的数据简单通讯（非阻塞）

2、实现多人群聊

3、服务器端：可以监测用户上线，离线，并实现消息转发功能

4、客户端：通过channel可以物阻塞发送消息给其他所有用户，同时可以接收其他用户发送的消息（有服务器转发得到）

5、目的：进一步理解NIO非阻塞网络编程机制

```java
/**
 * 服务端代码
 */
public class GroupChatServer {
    // 定义属性
    private Selector selector;
    private ServerSocketChannel listenChannel;
    private static final int PORT = 6667;
    // 构造器
    // 初始化工作
    public GroupChatServer() {
        try {
            // 得到选择器
            selector = Selector.open();
            // ServerSocketChannel
            listenChannel = ServerSocketChannel.open();
            // 绑定端口
            listenChannel.socket().bind(new InetSocketAddress(PORT));
            // 设置非阻塞模式
            listenChannel.configureBlocking(false);
            // 将该listenChannel 注册到 Selector
            listenChannel.register(selector, SelectionKey.OP_ACCEPT);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    // 监听
    public void listen() {
        try {
            // 循环处理
            while (true) {
                int count = selector.select();
                if (count > 0) { // 有事件处理
                    // 遍历得到的selectedkey集合
                    Iterator<SelectionKey> iterator = selector.selectedKeys().iterator();
                    while (iterator.hasNext()) {
                        SelectionKey key = iterator.next();
                        if (key.isAcceptable()) {// 监听到sccept
                            SocketChannel sc = listenChannel.accept();
                            sc.configureBlocking(false);
                            // 将该scoketChannel注册到Selector中
                            sc.register(selector, SelectionKey.OP_READ);
                            // 提示
                            System.out.println(sc.getRemoteAddress() + " 已上线.....");
                        }
                        if (key.isReadable()) {// 通道发生read事件，即通道是可读状态
                            // 处理读
                            readData(key);
                        }
                        // 当前的key删除，防止重复操作
                        iterator.remove();
                    }
                } else {
                    System.out.println("等待中......");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
        }
    }
    // 读取客户端消息
    private void readData(SelectionKey key) {
        // 定义一个SocketChannel
        SocketChannel channel = null;
        try {
            // 取得关联的channel
            channel = (SocketChannel) key.channel();
            // 创建buffer
            ByteBuffer buffer = ByteBuffer.allocate(1024);
            int count = channel.read(buffer);
            // 根据count的值做处理
            if (count > 0) {
                // 把缓冲区的数据转成字符串
                String msg = new String(buffer.array());
                // 输出该消息
                System.out.println("from 客户端： " + msg);
                // 向其他的客户端转发消息（排除自己）
                sendInfoToOtherClients(msg, channel);
            }
        } catch (IOException e) {
            try {
                System.out.println(channel.getRemoteAddress() +  "离线.......");
                // 取消注册
                key.cancel();
                // 关闭通道
                channel.close();
            } catch (IOException ex) {
                ex.printStackTrace();
            }
        }
    }
    // 转发消息给其他客户（通道）
    private void sendInfoToOtherClients(String msg, SocketChannel self) throws IOException {
        System.out.println("服务器转发消息中.......");
        // 遍历 所有注册到selector 上的SocketChannel，并排除自己
        for (SelectionKey key : selector.keys()) {
            // 通过 key 取出对应的 SocketChannel
            Channel targetChannel = key.channel();
            // 排除自己
            if(targetChannel instanceof SocketChannel && targetChannel != self){
                // 转型
                SocketChannel dest =  (SocketChannel)targetChannel;
                // 将msg 存储到buffer
                ByteBuffer buffer = ByteBuffer.wrap(msg.getBytes());
                // 将buffer数据写入到通道中
                dest.write(buffer);
            }
        }
    }
    public static void main(String[] args) {
        // 创建服务器对象
        GroupChatServer groupChatServer = new GroupChatServer();
        // 监听
        groupChatServer.listen();
    }
}
```

## 定义相关的属性

```java
/**
 * 客户端代码
 */
public class GroupChatClient {
    // 定义相关的属性
    // 服务器IP
    private final String HOST = "127.0.0.1";
    // 服务器端口
    private final int PORT = 6667;
    private Selector selector;
    private SocketChannel socketChannel;
    private String username;
    // 构造器
    public GroupChatClient() throws IOException {
        selector = Selector.open();
        // 连接服务器
        socketChannel = SocketChannel.open(new InetSocketAddress(HOST, PORT));
        // 设置非阻塞
        socketChannel.configureBlocking(false);
        // 将channel 注册到selector
        socketChannel.register(selector, SelectionKey.OP_READ);
        // 得到username
        username = socketChannel.getLocalAddress().toString().substring(1);
        System.out.println(username + " is ok......");
    }
    // 向服务器发送消息
    public void senInfo(String info) {
        info = username + " 说：" + info;
        try {
            socketChannel.write(ByteBuffer.wrap(info.getBytes()));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    // 读取从服务器端回复的消息
    public void readInfo() {
        try {
            int readChannel = selector.select();
            if (readChannel > 0) {// 即有可以用通道
                Set<SelectionKey> selectionKeys = selector.selectedKeys();
                Iterator<SelectionKey> iterator = selectionKeys.iterator();
                while (iterator.hasNext()) {
                    SelectionKey key = iterator.next();
                    if (key.isReadable()) {
                        SocketChannel channel = (SocketChannel) key.channel();
                        // 得到buffer
                        ByteBuffer buffer = ByteBuffer.allocate(1024);
                        // 读取
                        channel.read(buffer);
                        // 把读到的缓冲区的数据转成字符串
                        String msg = new String(buffer.array());
                        System.out.println(msg.trim());
                    }
                }
                // 删除当前的SelectionKey，防止重复操作
                iterator.remove();
            } else {
//                System.out.println("没有可用的通道.....");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    public static void main(String[] args) throws IOException {
        // 启动客户端
        GroupChatClient chatClient = new GroupChatClient();
        // 启动一个线程，每隔3秒读取从服务器端发送的数据
        new Thread(){
            @Override
            public void run() {
                while (true){
                    chatClient.readInfo();
                    try {
                        Thread.currentThread().sleep(3000);
                    }catch (InterruptedException e){
                        e.printStackTrace();
                    }
                }
            }
        }.start();
        // 发送数据给服务器端
        Scanner scanner = new Scanner(System.in);
        while (scanner.hasNextLine()){
            String str = scanner.next();
            chatClient.senInfo(str);
        }
    }
}
```

测试：启动服务端，启动多个客户端。
