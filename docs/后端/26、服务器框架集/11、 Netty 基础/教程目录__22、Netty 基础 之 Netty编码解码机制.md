# 22、Netty 基础 之 Netty编码解码机制
- 来源：https://ddkk.com/zhuanlan/server/netty/4/22.html
- 分类：服务器框架
- 分组：教程目录
## 一、编码和解码的基本介绍

**1、** 编写网络应用程序时，因为数据在网络中传输的都是二进制字节码数据，在发数据时就需要编码，接收数据时就需要解码；

**2、** codec（编解码器）的组成部分有两个：decoder（解码器）和encoder（编码器）encoder负责把业务数据转换成字节码数据，decoder负责把字节码数据转换成业务数据；

## 二、netty本身的编码解码的机制和问题分析

**1、** netty自身提供了一些codec（编解码器）；

**2、** netty提供的编码器；

StringEncoder：对字符串数据进行编码

ObjectEncoder：对Java对象进行编码

**3、** netty提供的解码器；

StringDecoder：对字符串数据进行解码

ObjectDecoder：对Java对象进行解码

**4、** netty本身自带的ObjectDecoder和ObjectEncoder可以用来实现POJO对象或各种业务对象的编码和解码，底层使用的仍是Java序列化技术，而Java序列化技术本身效率就不高，存在如下问题；

1、无法跨语言，客户端是Java写的，要求服务器端也要用Java，用Python就不可以

2、序列化后的体积太大，是二进制编码的5倍多

3、序列化性能太低

**5、** 新的解决方案Google的Protobuf；
