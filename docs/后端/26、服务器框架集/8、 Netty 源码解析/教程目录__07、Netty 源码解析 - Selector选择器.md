# 07、Netty 源码解析 - Selector选择器
- 来源：https://ddkk.com/zhuanlan/server/netty/1/7.html
- 分类：服务器框架
- 分组：教程目录
## 一、Selector基本介绍

1、Java 的 NIO，用非阻塞的 IO 方式。可以用一个线程，处理多个客户端连接，就会使用到**Selector选择器**

2、Selector 能够检测多个注册的通道上是否有事件发生（注意：多个Channel以事件的方式可以注册到同一个Selector），如果有事件发生，就获取事件然后针对每个事件进行相应的处理。这样就可以只用一个单线程去管理多个通道，也就是管理多个连接和请求

3、只有在 连接/请求 真正有读写事件发生时，才会进行读写，就大大地减少了系统开销，并且不必为每个连接都创建一个线程，不用去维护多个线程

4、避免了多线程之间的上下文切换导致的开销

## 二、Selector特点说明

1、Netty 的 IO 线程 NioEventLoop 聚合了Selector（选择器，也叫多路复用器），可以同时并发处理成百上千个客户端连接。

2、当线程从某个客户端 Socket 通道进行读写数据时，若没有数据可用时，该线程可以进行其他任务。

3、线程通常将非阻塞IO的空闲时间用于在其他通道上执行 IO 操作，所以单独的线程可以管理多个输入和输出通道。

4、由于读写操作都是非阻塞的，这就可以充分提升 IO 线程的运行效率，避免由于频繁 IO 阻塞导致的线程挂起。

5、一个 IO 线程可以并发处理 N 个客户端连接和读写操作，这从根本上解决了传统 同步阻塞IO 一连接一线程模型，架构的性能、弹性伸缩能力和可靠性都得到了极大的提升。

## 三、Selector类和相关方法

**Selector 类是一个抽象类 public abstract class Selector implements Closeable，常见的方法和说明如下：**

方法
描述

public static Selector open()
得到一个选择器对象

public abstract int select(long timeout)
监控所有注册的通道，当其中有 IO 操作可以进行时，将对应的SelectionKey加入到内部集合中并返回，参数用来设置超时时间

public abstract Set selectedKeys()
从内部集合中得到所有的SelectionKey

**注意事项：**

1、NIO 中的 ServerSocketChannel 功能类似 ServerSocket，SocketChannel 功能类似 Socket

2、selector 相关方法说明

selector.select(); 阻塞

selector.select(1000); 阻塞1000毫秒，在1000毫秒后返回

selector.wakeup(); 唤醒selector

selector.selectNow();不阻塞，立马返回
