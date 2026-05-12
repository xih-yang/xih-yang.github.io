# 08、Netty入门 - Netty概述
- 来源：https://ddkk.com/zhuanlan/server/netty/2/8.html
- 分类：服务器框架
- 分组：教程目录
## 原生NIO存在的问题

**1、** NIO的类库和API繁杂，使用麻烦：需要熟练掌握Selector、ServerSocketChannel、SocketChannel、ByteBuffer等；

**2、** 需要具备其他的额外技能：要熟悉Java多线程编程，因为NIO编程涉及到Reactor模式，你必须对多线程和网络编程非常熟悉，才能编写出高质量的NIO程序；

**3、** 开发工作量和难度都非常大：例如客户端面临断连重连、网络闪断、半包读写、失败缓存、网络拥塞和异常流的处理等等；

**4、** JDKNIO的Bug：例如臭名昭著EpollBug，它会导致Selector空轮询，最终导致CPU100%直到JDK1.7版本该问题仍然存在，没有被根本解决；

## Netty概述

### Netty官网说明

官网：[https://netty.io](https://netty.io)

**1、** Netty是由JBOSS提供的一个Java开源框架Netty提供异步的、基于事件驱动的网络应用程序框架，用以快速开发高性能、高可靠性的网络IO程序；

**2、** Netty可以帮助你快速、简单的开发出一个网络应用，相当于简化和流程化了NIO的开发过程；

**3、** Netty是目前最流行的NIO框架，Netty在互联网领域、大数据分布式计算领域、游戏行业、通信行业等获得了广泛的应用，知名的Elasticsearch、Dubbo框架内部都采用了Netty；

### Netty的优点

Netty对JDK自带的NIO的API进行了封装，解决了上述问题。

**1、** 设计优雅：适用于各种传输类型的统一API阻塞和非阻塞Socket；基于灵活且可扩展的事件模型，可以清晰地分离关注点；高度可定制的线程模型-单线程，一个或多个线程池；

**2、** 使用方便：详细记录的Javadoc，用户指南和示例；没有其他依赖项，JDK5（Netty3.X）或6（Netty4.X）就足够了；

**3、** 高性能、吞吐量更高；延迟更低；减少资源消耗；最小化不必要的内存复制；

**4、** 安全：完成的SSL/TLS和StartTLS支持；

**5、** 社区活跃、不断更新：社区活跃，版本迭代周期短，发现的Bug可以被及时修复，同时，更多的新功能会被加入；

### Netty版本说明

**1、** Netty版本分为netty3.x、netty4.x和netty5.x；

**2、** 因为Netty5出现重大Bug，已经被官网废弃了，目前推荐使用的是Netty4.x的稳定版本；

**3、** 目前官网可下载的版本netty3.x、netty4.0.x和netty4.1.x；

**4、** 本套资料讲解netty4.1.x版本；
