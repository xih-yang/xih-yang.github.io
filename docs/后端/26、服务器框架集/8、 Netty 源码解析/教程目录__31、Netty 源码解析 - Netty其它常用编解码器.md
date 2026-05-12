# 31、Netty 源码解析 - Netty其它常用编解码器
- 来源：https://ddkk.com/zhuanlan/server/netty/1/31.html
- 分类：服务器框架
- 分组：教程目录
## 一、解码器-ReplayingDecoder

1、继承父类

```java
public abstract class ReplayingDecoder<S> extends ByteToMessageDecoder
```

2、ReplayingDecoder 扩展了 ByteToMessageDecoder 类，使用这个类，我们不必调用 readableBytes() 方法。参数 S 指定了用户状态管理的类型，其中 Void 代表不需要状态管理

3、应用实例：使用 ReplayingDecoder 编写解码器：

```java
public class MyByteToLongDecoder2 extends ReplayingDecoder<Void> {
    @Override
    protected void decode(ChannelHandlerContext ctx, ByteBuf in, List<Object> out) throws Exception {
        System.out.println("MyByteToLongDecoder2 decode 被调用");
        // 在 ReplayingDecoder 不需要判断数据是否足够读取，内部会进行处理判断
        out.add(in.readLong());
    }
}
```

4、ReplayingDecoder 使用方便，但它也有一些局限性：

**1、** 并不是所有的ByteBuf操作都支持，如果调用了一个不被支持的方法，将会抛出一个UnsupportedOperationException；

**2、** ReplayingDecoder在某些情况下可能稍慢于ByteToMessageDecoder，例如网络缓慢并且消息格式复杂时，消息会被拆成多个碎片，速度变慢；

## 二、其它解码器

**1、** LineBasedFrameDecoder：这个类在Netty内部也有使用，它使用行尾控制字符（\n或者\r\n）作为分隔符来解析数据；

**2、** DelimiterBasedFrameDecoder：使用自定义的特殊字符作为消息的分隔符；

**3、** HttpObjectDecoder：一个HTTP数据的解码器；

**4、** LengthFieldBasedFrameDecoder：通过指定长度来标识整包信息，这样就可以自动的处理粘包和半包消息；

## 三、其它编码器
