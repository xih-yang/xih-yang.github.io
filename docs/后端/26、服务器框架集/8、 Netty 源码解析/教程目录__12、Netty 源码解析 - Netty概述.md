# 12、Netty 源码解析 - Netty概述
- 来源：https://ddkk.com/zhuanlan/server/netty/1/12.html
- 分类：服务器框架
- 分组：教程目录
## 一、原生NIO存在的问题

1、NIO的类库和API繁杂，使用麻烦：需要熟练掌握Selector、ServerSocketChannel、SocketChannel和ByteBuffer等。

2、需要具备其他的额外技能：要熟悉Java多线程编程，因为NIO编程涉及到Reactor模式，必须对多线程和网络编程非常熟悉，才能编写出高质量的NIO程序。

3、开发工作量和难度都非常大：例如客户端面临断连重连、网络闪断、半包读写、失败缓存、网络拥塞和异常流的处理等等。

4、JDK NIO 的 Bug：例如臭名昭著的 Epoll Bug，它会导致 Selector 空轮询，最终导致 CPU 100%，直到 JDK1.7 版本该问题仍旧存在，没有被根本解决。

## 二、Netty基本介绍

### 2.1 Netty官网说明

官网：https://netty.io/

Netty is an asynchronous event-driven network application framework

forrapid development of maintainable high performance protocol servers & clients.

1、Netty 是由 JBOSS 提供的一个 Java 开源框架。Netty 提供异步的、基于事件驱动的网络应用程序框架，用以快速开发高性能、高可靠性的网络 IO 程序。

2、Netty 可以帮助你快速、简单的开发出一个网络应用，相当于简化和流程化了 NIO 的开发过程。

3、Netty 是目前最流行的 NIO 框架，Netty 在互联网领域、大数据分布式计算领域、游戏行业、通信行业等获得了广泛的应用，知名的Elasticsearch、Dubbo框架内部都采用了Netty。

### 2.2 Netty优点

Netty 对 JDK 自带的 NIO 的 API 进行了封装，解决了 NIO 的一些问题。

1、设计优雅：适用于各种传输类型的统一API；阻塞和非阻塞Socket；基于灵活且可扩展的事件模型，可以清晰地分离关注点；高度可定制的线程模型 - 单线程、一个或多个线程池。

2、使用方便：详细记录的 JavaDoc，用户指南和示例；没有其他依赖项，JDK5（Netty 3.x）或JDK6（Netty 4.x）就足够了。

3、高性能、吞吐量更高：延迟更低；减少资源消耗；最小化不必要的内存复制。

4、安全：完整的 SSL/TLS 和 StartTLS 支持。

5、社区活跃、不断更新：社区活跃，版本迭代周期短，发现的 Bug 可以被及时修复，同时，更多的新功能会被加入。

### 2.3 Netty版本说明

1、Netty 版本分为：Netty3.x、Netty4.x和Netty5.x。

2、因为Netty5出现重大Bug，已经被官网废弃了，目前推荐使用的是Netty4.x的稳定版本。

3、目前在官网可下载的版本：Netty3.x、Netty4.0.x和Netty4.1.x。

4、Netty 下载地址：https://bintray.com/netty/downloads/netty
