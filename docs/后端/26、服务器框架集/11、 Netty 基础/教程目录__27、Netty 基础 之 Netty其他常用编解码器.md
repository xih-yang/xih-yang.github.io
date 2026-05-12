# 27、Netty 基础 之 Netty其他常用编解码器
- 来源：https://ddkk.com/zhuanlan/server/netty/4/27.html
- 分类：服务器框架
- 分组：教程目录
## 一、解码器-ReplayingDecoder

**1、** 函数声明；

`public abstract class ReplayingDecoder extends ByteToMessageDecoder`

**2、**`ReplayingDecoder`扩展了`ByteToMessageDecoder`类，使用这个类，我们不必调用`readableBytes()`方法参数S指定了用户状态管理的类型，其中Void代表不需要状态管理；

**3、** 使用ReplayingDecoder编写解码器，对前面的案例进行简化；

MyByteToLongDecoder2.java

```java
package netty.inboundhandlerAndOutboundhandler;
import java.util.List;
import io.netty.buffer.ByteBuf;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.ReplayingDecoder;
public class MyByteToLongDecoder2 extends ReplayingDecoder<Void> {
	@Override
	protected void decode(ChannelHandlerContext ctx, ByteBuf in, List<Object> out) throws Exception {
		System.out.println("MyByteToLongDecoder2 decode 被调用");
		//在ReplayingDecoder 不需要判断数据是否足够读取，它内部会进行处理和判断
		out.add(in.readLong());
	}
}
```

**4、** ReplayingDecoder使用方便，但它也有一些局限性；

1、并不是所有的ByteBuf操作都被支持，如果调用了一个不被支持的方法，将会抛出一个UnsupportedOperationException。

2、ReplayingDecoder在某些情况下可能稍慢于ByteToMessageDecoder，例如网络缓慢并且消息格式复杂时，消息会被拆成了多个碎片，速度变慢。

## 二、其他解码器

**1、** LineBasedFrameDecoder；

这个类在netty内部也有使用，它使用行尾控制字符（\n或者\r\n）作为分隔符来解析数据。

**2、** DelimiterBasedFrameDecoder；

使用自定义的字符作为消息的分隔符。

**3、** HttpObjectDecoder；

一个HTTP数据的解码器。

**4、** LengthFieldBasedFrameDecoder；

通过指定长度来标识整包消息，这样就可以自动的处理黏包和半包消息。

## 三、其他编码器

**1、** ObjectEncoder；

**2、** SocksMessageEncoder；

**3、** LzfEncoder；

**4、** ZlibEncoder；

**5、** Bzip2Encoder；
