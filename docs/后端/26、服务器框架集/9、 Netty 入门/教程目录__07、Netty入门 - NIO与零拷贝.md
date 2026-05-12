# 07、Netty入门 - NIO与零拷贝
- 来源：https://ddkk.com/zhuanlan/server/netty/2/7.html
- 分类：服务器框架
- 分组：教程目录
## 零拷贝介绍

**1、** 零拷贝是网络编程的关键，很多性能优化都离不开；

**2、** 在Java程序中，常用的零拷贝有mmap（内存映射）和sendFile那么，他们在OS里，到底是怎么样的一个的设计？我们分析mmap和sendFile这两个零拷贝；

**3、** NIO中如何使用零拷贝；

## 传统IO

1、Java传统IO和网络编程的一段代码

```java
File file = new File("test.txt");
RandomAccessFile raf = new RandomAccessFile(file, "rw");
byte[] arr = new byte[(int)file.length()];
raf.read(arr);
Socket socket = new ServerSocket(8080).accept();
socket.getOutputStream().write(arr);
```

传统IO示意图

DMA：direct memory access（直接内存拷贝，不使用CPU）

## mmap优化

**1、** mmap通过内存映射，将文件映射到内核缓冲区，同时，用户空间可以共享内核空间的数据这样，在进行网络传输时，就可以减少内核空间到用户空间的拷贝次数；

**2、** mmap示意图；

## sendFile优化

**1、** Linux2.1版本提供了sendFile函数，其基本原理如下：数据根本不经过用户态，直接从内存缓冲区进入到SocketBuffer，同时，由于和用户态完全无关，就减少了一次上下文切换；

**2、** sendFile示意图；

提示：零拷贝是从操作系统角度，是没有CPU拷贝。

**1、** Linux在2.4版本中，做了一些修改，避免了从内核缓冲区拷贝到Socketbuffer的操作，直接拷贝到协议栈，从而再一次减少了数据拷贝，具体如下图所示；

这里其实有一次CPU拷贝，kernel buffer -> socket buffer 但是，拷贝的信息很少，比如length,offset,消耗低，可以忽略。

**零拷贝的再次理解**

1、我们说零拷贝，是从操作系统的角度来说的。因为内核缓冲区之间，没有数据是重复的（只有kernel buffer有一份数据）.

2、零拷贝不仅仅带来更少的数据复制，还能带来其他的性能优势，例如更少的上下文切换，更少的CPU缓存伪共享以及无CPU校验和计算。

## mmap和sendFile的区别

**1、** mmap适合小数据量读写，sendFile适合大文件传输；

**2、** mmap需要4次上下文切换，3次数据拷贝；sendFile需要3次上下文切换，最少2次数据拷贝；

**3、** snedFile可以利用DMA方式，减少CPU拷贝，mmap则不能（必须从内核拷贝到Socket缓冲区）；

## NIO零拷贝案例

需求：

1、使用传统的IO方法传递一个大文件。

2、使用NIO零拷贝方式传递（transferTo）一个大文件。

3、看看两种传递方式耗时时间分别是多少。

**传统IO代码块**

```java
/**
 * 传统IO服务端
 */
public class OldIOServer {
    public static void main(String[] args) throws IOException {
        ServerSocket serverSocket = new ServerSocket(7001);
        while (true){
            Socket socket = serverSocket.accept();
            DataInputStream dataInputStream = new DataInputStream(socket.getInputStream());
            byte[] byteArray = new byte[4096];
            while (true) {
                int readCount = dataInputStream.read(byteArray, 0, byteArray.length);
                if(-1 == readCount){
                    break;
                }
            }
        }
    }
}
```

```java
/**
 * 传统IO客户端
 */
public class OldIOClient {
    public static void main(String[] args) throws IOException {
        Socket socket = new Socket("localhost", 7001);
        String fileName = "chromedriver_win32.zip";
        FileInputStream inputStream = new FileInputStream(fileName);
        DataOutputStream dataOutputStream = new DataOutputStream(socket.getOutputStream());
        byte[] buffer = new byte[4096];
        long readCount;
        long total = 0;
        long startTime = System.currentTimeMillis();
        while ((readCount = inputStream.read(buffer)) >= 0){
            total += readCount;
            dataOutputStream.write(buffer);
        }
        System.out.println("发送总字节数：" + total + "，耗时：" + (System.currentTimeMillis() - startTime));
        dataOutputStream.close();
        socket.close();
        inputStream.close();
    }
}
```

测试结果

**NIO代码块**

```java
/**
 * 服务器端
 */
public class NewIOServer {
    public static void main(String[] args) throws IOException {
        InetSocketAddress address = new InetSocketAddress(7001);
        ServerSocketChannel serverSocketChannel = ServerSocketChannel.open();
        ServerSocket serverSocket = serverSocketChannel.socket();
        serverSocket.bind(address);
        // 创建buffer
        ByteBuffer byteBuffer = ByteBuffer.allocate(4096);
        while (true) {
            SocketChannel socketChannel = serverSocketChannel.accept();
            int readCount = 0;
            while (-1 != readCount) {
                try {
                    readCount = socketChannel.read(byteBuffer);
                }catch (Exception e){
                    e.printStackTrace();
                }
                // 倒带 position=0 mark作废
                byteBuffer.rewind();
            }
        }
    }
}
```

```java
/**
 * 客户端
 */
public class NewIOClient {
    public static void main(String[] args) throws IOException {
        SocketChannel socketChannel = SocketChannel.open();
        socketChannel.connect(new InetSocketAddress("localhost", 7001));
        String fileName = "chromedriver_win32.zip";
        // 得到一个文件的channnel
        FileChannel fileChannel = new FileInputStream(fileName).getChannel();
        // 准备发送
        long startTime = System.currentTimeMillis();
        // 在linux下一个transferTo 方法就可以完成传输
        // 在 windows下一个调用transferTo 只能发送8M，就需要分段传输文件，而且要注意传输位置
        long transferCount = fileChannel.transferTo(0, fileChannel.size(), socketChannel);
        System.out.println("发送的总的字节数 = " + transferCount + " 耗时：" + (System.currentTimeMillis() - startTime));
        // 关闭
        fileChannel.close();
    }
}
```

测试结果

## 零拷贝 AIO基本介绍

**1、** JDK7引入了AsynchronousI/O，即AIO在进行I/O编程中，常用到两种模式：Reactor和ProactorJava的NIO就是Reactor，当有事件触发时，服务器端得到通知，进行相应的处理；

**2、** AIO即NIO2.0，叫做异步不阻塞的IOAIO引入异步通道的概念，采用了Proactor模式，简化了程序编写，有效的请求才启动线程，它的特点是先由操作系统完成后才通知服务端程序启动线程去处理，一般适用于连接数较多且连接时间较长的应用；

**3、** 目前AIO还没有广泛应用，Netty也是基于NIO，而不是AIO，因此我们就不详解AIO了；

## BIO、NIO、AIO对比表

BIO

NIO

AIO

IO模型

同步阻塞

同步非阻塞（多路复用）

异步非阻塞

编程难度

简单

复杂

复杂

可靠性

差

好

好

吞吐量

低

高

高

举例说明：

1、同步阻塞：到理发店理发，就一直等理发师，直到轮到自己理发。

2、同步非阻塞：到理发店理发，发现前面有其他人理发，给理发师说下，先干其他事情，一会过来看是否轮到自己。

3、异步非阻塞：给理发师打电话，让理发师上门服务，自己干其他事情，理发师自己来家里给你理发。
