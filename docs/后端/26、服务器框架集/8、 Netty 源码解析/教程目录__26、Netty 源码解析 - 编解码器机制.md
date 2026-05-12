# 26、Netty 源码解析 - 编解码器机制
- 来源：https://ddkk.com/zhuanlan/server/netty/1/26.html
- 分类：服务器框架
- 分组：教程目录
## 一、编码和解码基本介绍

1、编写网络应用程序时，因为数据在网络中传输的都是二进制字节码数据，在发送数据时就需要编码，接收数据时就需要解码。

2、codec（编解码器）的组成部分有两个：decoder（解码器）和encoder（编码器）。encoder负责把业务数据转换成字节码数据，decoder负责把字节码数据转换成业务数据。

## 二、Netty自带编解码器机制

1、StringEncoder和StringDecoder：对字符串数据进行编解码

2、ObjectEncoder和ObjectDecoder：对Java对象进行编解码

3、Netty 本身自带的 ObjectEncoder和ObjectDecoder 可以用来实现 POJO 对象或各种业务对象的编码和解码，底层使用的仍是Java序列化技术，而Java序列化技术本身效率就不高，存在如下问题：

**1、** 无法跨语言；

**2、** 序列化后的体积太大，是二进制编码的5倍多；

**3、** 序列化性能太低；

4、解决方案 ---------> Google Protobuf
