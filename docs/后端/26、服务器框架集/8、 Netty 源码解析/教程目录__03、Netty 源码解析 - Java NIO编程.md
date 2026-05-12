# 03、Netty 源码解析 - Java NIO编程
- 来源：https://ddkk.com/zhuanlan/server/netty/1/3.html
- 分类：服务器框架
- 分组：教程目录
## 一、NIO基本介绍

1、Java NIO 全称 java non-blocking IO，是值 JDK 提供的新API。从 JDK1.4 开始，Java 提供了一系列改进的输入/输出的新特性，被统称为 NIO（即 New IO），是**同步非阻塞**的。

2、NIO 相关类都被放在 java.nio 包及子包下，并且对原 java.io 包中的很多类进行改写。

3、NIO 有三大核心部分：**Channel（通道）** 、**Buffer（缓冲区）** 、**Selector（选择器）**

4、NIO 是**面向缓冲区或者面向块**编程的。数据读取到一个它稍后处理的缓冲区，需要时可在缓冲区中前后移动，这就增加了处理过程中的灵活性，使用它可以提供非阻塞式的高伸缩性网络。

5、Java NIO的非阻塞模式，一个线程从某通道发送请求读取数据，但是它仅能得到目前可用的数据，如果目前没有数据可用时，就什么都不会获取，而**不是保持线程阻塞**，所以直至数据变得可以读取之前，该线程可以继续做其他的事情。非阻塞写也是如此，一个线程请求写入一些数据到某通道，但不需要等待它完全写入，这个线程同时可以去做别的事情。

6、通俗理解：NIO是可以做到用一个线程来处理多个操作的。假设有10000个请求过来，根据实际情况，可以分配50或者100个线程来处理。不像之前的阻塞IO那样，非得分配10000个。

7、HTTP2.0使用了多路复用的技术，做到同一个连接并发处理多个请求，而且并发请求的数量比HTTP1.1大了好几个数量级。

## 二、Buffer代码

```java
public class BasicBuffer {
    public static void main(String[] args) {
        // 举例说明 Buffer 的使用（简单说明）
        // 创建一个 Buffer，大小为10，即可以存放10个int
        IntBuffer intBuffer = IntBuffer.allocate(10);
        // 向 Buffer 中存放数据
        /*intBuffer.put(10);
        intBuffer.put(11);
        intBuffer.put(12);
        intBuffer.put(13);
        intBuffer.put(14);
        intBuffer.put(15);
        intBuffer.put(16);
        intBuffer.put(17);
        intBuffer.put(18);
        intBuffer.put(19);*/
        for(int i = 0; i < intBuffer.capacity(); i++){
            intBuffer.put( i * 2 );
        }
        // 从 Buffer 读取数据
        intBuffer.flip(); // 将 Buffer 转换，读写切换(!!!)
        while (intBuffer.hasRemaining()){
            System.out.println(intBuffer.get());
        }
    }
}
```

### 三、NIO 和 BIO 的比较

1、BIO 以流的方式处理数据，而 NIO 以块的方式处理数据，块 I/O 的效率比 流 I/O 高很多。

2、BIO 是阻塞的，NIO 则是非阻塞的。

3、BIO 基于字节流和字符流进行操作，而 NIO 基于 Channel（通道）和 Buffer（缓冲区）进行操作，数据总是从通道读取到缓冲区中，或者从缓冲区写入到通道中。Selector（选择器）用于监听多个通道的事件（比如：连接请求、数据到达等），因此使用单个线程就可以监听多个客户端通道。

### 四、NIO 三大核心组件关系

**Selector、Channel和Buffer的关系图说明：**

**1、** 每个Channel都会对应一个Buffer；

**2、** Selector会对应一个线程，一个线程对应多个Channel（连接）；

**3、** 该图反映了有三个Channel注册到了Selector上；

**4、** 程序切换到哪个Channel是由事件（Event）决定的，Event是一个非常重要的概念；

**5、** Selector会根据不同的事件，在各个通道上切换；

**6、** Buffer就是一个内存块，底层是有一个数组的；

**7、** 数据的读取和写入是通过Buffer实现的，这个和BIO是有本质区别的，BIO中可以是输入流或者是输出流，不能是双向的，但是NIO的Buffer既可以是读，也可以是写，需要使用flip函数进行切换；

**8、** Channel是双向的，可以反映底层操作系统的情况，比如LINUX底层的操作系统通道就是双向的；
