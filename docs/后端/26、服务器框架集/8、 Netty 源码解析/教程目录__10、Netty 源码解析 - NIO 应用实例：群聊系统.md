# 10、Netty 源码解析 - NIO 应用实例：群聊系统
- 来源：https://ddkk.com/zhuanlan/server/netty/1/10.html
- 分类：服务器框架
- 分组：教程目录
## 一、案例要求

**1、** 编写一个NIO群聊系统，实现服务器端和客户端之间的数据简单通讯（非阻塞）；

**2、** 实现多人群聊；

**3、** 服务器端：可以检测用户上线，离线，并实现消息转发功能；

**4、** 客户端：通过channel可以无阻塞发送消息给其它所有用户，同时可以接收其它用户发送的消息（由服务器转发得到）；

**5、** 目的：进一步理解NIO非阻塞网络编程机制；

## 二、代码演示

### 2.1 服务器端

```java
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

### 2.2 客户端

```java
public class GroupChatClient {
    // 定义相关的属性
    private final String HOST = "127.0.0.1";
    private final int PORT = 6667;
    private Selector selector;
    private SocketChannel socketChannel;
    private String username;
    // 构造器，完成初始化操作
    public GroupChatClient() throws IOException {
        selector = Selector.open();
        // 连接服务器
        socketChannel = SocketChannel.open(new InetSocketAddress(HOST,PORT));
        // 设置非阻塞
        socketChannel.configureBlocking(false);
        // 将 channel 注册到 selector
        socketChannel.register(selector, SelectionKey.OP_READ);
        // 得到 username
        username = socketChannel.getLocalAddress().toString().substring(1);
        System.out.println(username + " is ok...");
    }
    // 向服务器发送消息
    public void sendInfo(String info){
        info = username + " 说：" + info;
        try {
            socketChannel.write(ByteBuffer.wrap(info.getBytes()));
        }catch (IOException e){
            e.printStackTrace();
        }
    }
    // 读取从服务器端回复的消息
    public void readInfo(){
        try {
            int readChannels = selector.select();
            if(readChannels > 0){ // 有可以用的通道
                Iterator<SelectionKey> iterator = selector.selectedKeys().iterator();
                while (iterator.hasNext()){
                    SelectionKey key = iterator.next();
                    if(key.isReadable()){
                        // 得到相关的通道
                        SocketChannel sc = (SocketChannel)key.channel();
                        // 得到一个buffer
                        ByteBuffer buffer = ByteBuffer.allocate(1024);
                        // 读取
                        sc.read(buffer);
                        // 把读到的缓冲区的数据转成字符串
                        String msg = new String(buffer.array());
                        System.out.println(msg.trim());
                    }
                    iterator.remove(); // 删除当前的 selectionKey，防止重复操作
                }
            }else{
                //System.out.println("没有可以用的通道...");
            }
        }catch (IOException e){
            e.printStackTrace();
        }
    }
    public static void main(String[] args) throws IOException {
        // 启动客户端
        GroupChatClient chatClient = new GroupChatClient();
        // 启动一个线程，每隔3秒，读取从服务器端发送的数据
        new Thread(){
            public void run(){
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
        // 客户端发送数据给服务器端
        Scanner scanner = new Scanner(System.in);
        while (scanner.hasNextLine()){
            String s = scanner.next();
            chatClient.sendInfo(s);
        }
    }
}
```

## 三、效果展示
