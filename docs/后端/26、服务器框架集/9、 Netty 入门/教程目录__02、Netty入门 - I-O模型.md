# 02、Netty入门 - I/O模型
- 来源：https://ddkk.com/zhuanlan/server/netty/2/2.html
- 分类：服务器框架
- 分组：教程目录
## I/O模型

## I/O模型基本说明

**1、** I/O模型简单的理解：就是用什么样的通道进行数据的发送和接收，很大程度上决定了程序通信的性能；

**2、** Java共支持3种网络编程模型I/O模式：BIO、NIO、AIO；

**3、** JavaBIO：同步并阻塞（传统阻塞型），服务器实现模式为一个连接一个线程，即客户端有连接请求时服务器端就需要启动一个线程进行处理，如果这个连接不做任何事情会造成不必要的线程开销；

**1、** JavaNIO：同步非阻塞，服务器实现模式为一个线程处理多个请求（连接），即客户端发送的连接请求都会注册到多路复用器上，多路复用器轮询到连接有I/O请求就进行处理；

**2、** JavaAIO（NIO.2）：异步非阻塞，AIO引入异步通道的概念，采用了Proactor模式，简化了程序编写，有效的请求才启动线程，它的特点是先由操作系统完成后才通知服务端程序启动线程去处理，一般适用于连接数较多且连接时间较长的应用（未得到广泛应用）；

## BIO、NIO、AIO适用场景分析

**1、** BIO方式适用于连接数目比较小且固定的架构，这种方式对服务器资源要求比较高，并发局限于应用中，JDK1.4以前的唯一选择，但程序简单易理解；

**2、** NIO方式适用于连接数目多且连接比较短（轻操作）的架构，比如聊天服务器，弹幕系统，服务器间通讯等编程比较复杂，JDK1.4开始支持；

**3、** AIO方式适用于连接数目多且连接比较长（重操作）的架构，比如相册服务器，充分调用OS参考并发操作，编程比较复杂，JDK7开始支持；

## BIO介绍及分析

### BIO基本介绍

**1、** JavaBIO就是传统的JavaIO编程，其相关的类和接口在java.io；

**2、** BIO（blockingI/O）：同步阻塞，服务器实现模式为一个连接一个线程，即客户端有连接请求时服务器端就需要启动一个线程进行处理，如果这个连接不做任何事情会造成不必要的线程开销，可以通过**线程池机制**改善；

**3、** BIO方式适用于连接数目比较小且固定的架构，这种方式对服务器资源要求比较高，并发局限于应用中，JDK1.4以前的唯一选择，但程序简单易理解；

### BIO工作机制

工作原理图如下所示。

BIO编程简单流程：

**1、** 服务器端启动一个ServerSocket；

**2、** 客户端启动Socket对服务器进行通信，默认情况下服务器端需要对每个客户端建立一个线程与之通信；

**3、** 客户端发出请求后，先咨询服务器是否有线程响应，如果没有则会等待，或者被拒绝；

**4、** 如果有响应，客户端线程会等待请求结束后，才继续执行；

### 应用示例

实例说明：

1、使用BIO模型编写一个服务器端，监听6666端口，当有客户端连接时，就启动一个线程与之通信。

2、要求使用线程池机制改善，可以连接多个客户端。

3、服务器端可以接收客户端发送的数据（telnet 方式即可）。

```java
public class BIOServer {
    public static void main(String[] args) throws IOException {
        // 线程池机制
        //思路
        //1.创建一个线程池
        //2.如果有客户端连接，就创建一个线程，与之通讯
        ExecutorService threadPool = Executors.newCachedThreadPool();
        // 创建ServerSocket
        ServerSocket serverSocket = new ServerSocket(6666);
        System.out.println("服务器启动了");
        while (true) {
            // 监听，等待客户端连接
            System.out.println("等待连接......");
            final Socket socket = serverSocket.accept();
            System.out.println("连接到一个客户端");
            // 就创建一个线程，与之通信
            threadPool.execute(new Runnable() {
                @Override
                public void run() {
                    //可以和客户端通讯
                    handler(socket);
                }
            });
        }
    }
    //编写一个handler方法，和客户端通信
    public static void handler(Socket socket) {
        try {
            System.out.println("线程信息 id=" + Thread.currentThread().getId() + "， 名字：" + Thread.currentThread().getName());
            byte[] bytes = new byte[1024];
            // 通过socket 获取输入流
            InputStream inputStream = socket.getInputStream();
            // 循环读取客户端发送的数据
            while (true) {
                System.out.println("线程信息 id=" + Thread.currentThread().getId() + "， 名字：" + Thread.currentThread().getName());
                System.out.println("read..........");
                int read = inputStream.read(bytes);
                if (read != -1) {
                    System.out.println(new String(bytes, 0, read, "utf-8"));
                } else {
                    break;
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            try {
                System.out.println("关闭和client连接");
                socket.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
}
```

使用telnet进行测试。

1、cmd进入到命令行窗口，使用telnet进行连接

```java
telnet 127.0.0.1 6666
```

2、连接成功后，发送消息，使用快捷键 ctrl+]

### BIO 问题分析

**1、** 每个请求都需要创建独立的线程，与对应的客户端进行数据Read，业务处理，数据Write；

**2、** 当并发数较大时，需要创建大量线程来处理连接，系统资源占用较大；

**3、** 连接建立后，如果当前线程暂时没有数据可读，则线程就阻塞在Read操作上，造成线程资源浪费；

## NIO介绍及分析

### NIO基本介绍

**1、** NIO全称non-blockingIO，是指JDK提供的新API从JDK1.4开始，Java提供了一系列改进的输入/输出的新特性，被统称为NIO（即NewIO），是同步非阻塞的；

**2、** NIO相关类都被放在java.nio包及子包下，并且对原java.io包中的很多类进行改写；

**3、** NIO有三大核心部分：Channel（通道），Buffer（缓冲区），Selector（选择器）；

**1、** NIO是面向缓冲区，或者面向块编程的数据读取到一个它稍后处理的缓冲区，需要时可在缓冲区前后移动，这就增加了处理过程中的灵活性，使用它可以提供非阻塞式的高伸缩性网络；

**2、** JavaNIO的非阻塞模式，使一个线程从某通道发送请求或者读取数据，但是它仅能得到目前可用的数据，如果目前没有数据可用时，就什么都不会获取，而不是保持线程阻塞，所以直至数据变的可以读取之前，该线程可以继续做其他的事情非阻塞写也是如此，一个线程请求写入一些数据到某通道，但不需要等待它完全写入，这个线程同时可以去做别的事情；

**3、** 通俗理解：NIO是可以做到用一个线程来处理多个操作的假设有10000个请求过来，根据实际情况，可以分配50或者100个线程来处理不像之前的阻塞IO那样，非得分配10000个；

**4、** HTTP2.0使用了多路复用的技术，做到同一个连接并发处理多个请求，而且并发请求的数量比HTTP1.1大了好几个数量级；

### NIO中Buffer的基本使用

```java
public class BasicBuffer {
    public static void main(String[] args) {
        // 举例说明buffer的使用(简单说明)
        // 创建一个Buffer, 大小为5，即可以存放5个int
        IntBuffer intBuffer = IntBuffer.allocate(5);
        // 向buffer中存放数据
        for (int i = 0; i < intBuffer.capacity(); i++) {
            intBuffer.put(i * 2);
        }
        // 如何从buffer读取数据
        // 将buffer转换，读写切换
        intBuffer.flip();
        while (intBuffer.hasRemaining()){
            System.out.println(intBuffer.get());
        }
    }
}
```

### NIO和BIO的比较

**1、** BIO以流的方式处理数据，而NIO以块的方式处理数据，块I/O的效率比流I/O高很多；

**2、** BIO是阻塞的，NIO则是非阻塞的；

**3、** BIO基于字节流和字符流进行操作，而NIO基于Channel（通道）和Buffer（缓冲区）进行操作，数据总是从通道读取到缓冲区中，或者从缓冲区写入到通道中Selector（选择器）用于监听多个通道的事件（比如：连接请求，数据到达等），因此**使用单个线程就可以监听多个客户端**通道；

### NIO三大核心原理示意图

Selector、Channel和Buffer的关系说明：

**1、** 每个channel都会对应一个buffer；

**2、** selector对应一个线程，一个线程对应多个channel（连接）；

**3、** 上图反映了有3个channel注册到了该selector；

**4、** 程序切换到哪个channel，是由事件决定的，Event就是一个重要的概念；

**5、** selector会根据不同的事件，在各个通道上切换；

**6、** buffer就是一个内存块，底层是有一个数组；

**7、** 数据的读取写入是通过buffer，这个和BIO是不同的，BIO中要么是输入流，或者是输出流，不能双向，但是NIO的buffer是可以读也可以写，需要flip方法切换；

**8、** chennel是双向的，可以反映底层操作系统的情况，比如Linux，底层的操作系统通道就是双向的；
