# 01、Netty入门 - Netty介绍
- 来源：https://ddkk.com/zhuanlan/server/netty/2/1.html
- 分类：服务器框架
- 分组：教程目录
## Netty的介绍

**1、** Netty是由jboss提供的一个Java开源框架，现在Github上的独立项目；

**2、** Netty是一个异步的、基于事件驱动的网络应用框架，用以快速开发高性能、高可靠性的网络IO程序；

**3、** Netty主要针对在TCP协议下，面向clients端的高并发应用，或者Peer-to-Peer场景下的大量数据持续传输的应用；

**1、** Netty本质上是一个NIO框架，适用于服务器通讯相关的多种应用场景；

## Netty的应用场景

### 互联网行业

**1、** 互联网行业：在分布式系统中，各个节点之间需要远程服务调用，高性能的RPC框架必不可少，Netty作为异步高性能的通信框架，往往作为基础通信组件被这些RPC框架使用；

**2、** 典型的应用有：阿里分布式服务框架Dubbo的RPC框架使用Dubbo协议进行节点间的通信，Dubbo协议默认使用Netty作为基础通信组件，用于实现各进程节点之间的内部通信；

### 游戏行业

**1、** 无论是手游服务端还是大型的网络游戏，Java语言得到了越来越广泛的应用；

**2、** Netty作为高性能的基础通信组件，提供了TCP/UDP和HTTP协议栈，方便定制和开发私有协议栈，账号登录服务器；

**3、** 地图服务器之间可以方便的通过Netty进行高性能的通信；

### 大数据领域

**1、** 经典的Hadoop的高性能通信和序列化组件（AVRO实现数据文件共享）的RPC框架，默认采用Netty进行跨节点通信；

**2、** 它的NettyService基于Netty框架二次封装实现；

### 其他应用场景

网址：[https://netty.io/wiki/related-projects.html](https://netty.io/wiki/related-projects.html)

## Netty的学习参考资料
