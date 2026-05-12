# 03、RocketMQ 源码解析 - Remoting模块
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/3/3.html
- 分类：消息队列
- 分组：教程目录
## 版本声明

基于`rocketmq-all-4.3.1`版本；

## RemotingCommand

**1、**`RocketMQ`自定义的协议格式；

4字节
4字节
n字节
m字节

总长度(大端字节)
序列化类型(1个字节)+消息头长度(3个字节)
消息头数据
消息体数据

**2、** 消息头格式；

大小
2Byte
1Byte
2Byte
4Byte
4Byte
4Byte
4Byte

类型
int
byte
int
int
int
String
HashMap

字段
code
language
version
opaque
flag
remark
extFields

**3、** 消息头格式详解；

- code: 请求命令码(`ReqeustCode`)或响应命令码(`ResponseCode`)
- language: 调用语言实现. 对应`LanguageCode`枚举。
- version: 请求或响应的版本号, 对应RemotingCommand.version
- opaque: 请求发起方在同一连接上不同的请求标识代码，多线程连接复用使用.响应直接返回
- flag: 通信层标志, 比如标识是否为请求(偶数)还是响应(奇数),单向(2的倍数+2)还是双向
- remark: 请求的自定义文本信息或响应的错误描述信息
- extFields: 请求或响应自定义字段

### 编码和解码

**1、** 消息的编码和解码分别在`RemotingCommand`类的`encode`和`decode`方法中完成，数据在网络中传输是按照字节流的方式传输，所以需要把数据编码为字节`encode`方法将`RemotingCommand`转换为`ByteBuffer`；

```java
public ByteBuffer encode() {
    // 1> header length size
    int length = 4; //消息头长度4字节
    // 2> header data length  消息头数据长度
    byte[] headerData = this.headerEncode();
    length += headerData.length;
    // 3> body data length 消息体数据长度
    if (this.body != null) {
        length += body.length;
    }
    //消息总字节数=总长度(4字节)+序列化类型(1字节)+头长度(3字节)+消息头数据长度+消息体数据长度
    ByteBuffer result = ByteBuffer.allocate(4 + length);
    // length
    result.putInt(length);
    // header length
    result.put(markProtocolType(headerData.length, serializeTypeCurrentRPC));
    // header data
    result.put(headerData);
    // body data;
    if (this.body != null) {
        result.put(this.body);
    }
    result.flip();
    return result;
}
public static byte[] markProtocolType(int source, SerializeType type) {
    byte[] result = new byte[4];
    //序列化类型 24-32位
    result[0] = type.getCode();
    //右移16位 & 255 16-24位
    result[1] = (byte) ((source >> 16) & 0xFF);
    //右移8位 & 255  8-16位
    result[2] = (byte) ((source >> 8) & 0xFF);
    //8-0位
    result[3] = (byte) (source & 0xFF);
    return result;
}
```

**2、** 解码是将字节流转换为`RemotingCommand`对象的过程,解码是通过`decode`方法完成的；

```java
public static RemotingCommand decode(final ByteBuffer byteBuffer) {
    //总长度
    int length = byteBuffer.limit();
    //消息头长度(长度=rpc类型8位+头数据长度24位)
    int oriHeaderLen = byteBuffer.getInt();
    //前8位是rpc类型，后24位才是头数据的长度
    int headerLength = getHeaderLength(oriHeaderLen);
    byte[] headerData = new byte[headerLength];
    byteBuffer.get(headerData);
    RemotingCommand cmd = headerDecode(headerData, getProtocolType(oriHeaderLen));
    int bodyLength = length - 4 - headerLength;
    byte[] bodyData = null;
    if (bodyLength > 0) {
        bodyData = new byte[bodyLength];
        byteBuffer.get(bodyData);
    }
    cmd.body = bodyData;
    return cmd;
}   
```

## 批量消息

**1、** 发送单条消息是，消息体内容将保存在body中，发送批量消息时，需要将多个消息体的内容存储在body中将一批消息封装为MessageBatch，MessageBatch继承Message，内部持有`List`这样的好处就是批量消息和单条消息的流程完全一样，只需要判断如果是批量消息，则将消息体内容汇聚成字节数组；

```java
public class MessageBatch extends Message implements Iterable<Message> {
    private static final long serialVersionUID = 621335151046335557L;
    private final List<Message> messages;
		...省略...
}
```
