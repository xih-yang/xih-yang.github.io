# 13、Netty学习 - Netty 解码器
- 来源：https://ddkk.com/zhuanlan/server/netty/5/13.html
- 分类：服务器框架
- 分组：教程目录
编码和解码：数据从一种特定协议格式到另一种格式的转换。

处理编码和解码的程序通常被称为编码器和解码器。Netty 提供了一些组件，利用它们可以很容易地为各种不同协议编写编解码器。

## 编解码概述

> 编解码其实可以分为两块，即编码和解码。要知道，在网络中数据都是以字节码的形式来传输的，而我们只能识别文本、图片这些格式，因此编写网络应用程序不可避免地需要操作字节，将我们能够识别的数据转换成网络能够识别的程序，这个过程称之为编解码。

### 编解码器概述

**编码也称为序列化，它将对象序列化为字节数组，用于网络传输、数据持久化或者其他用途。**

**解码称为反序列化，它把从网络、磁盘等读取的字节数组还原成原始对象（通常是原始对象的拷贝），以方便后续的业务逻辑操作。**

实现编解码功能的程序也被称为**编解码器**，编解码器的作用就是将原始字节数组与目标程序数据格式进行互转。

编解码器由两部分组成：解码器（decoder）和编码器（encoder）。

大家可以想象发送`消息`的这个过程。`消息`是一个结构化的应用程序中的数据。编码器转换消息格式为适合传输的数据格式，而相应的解码器是将传输数据转换回程序中的消息格式。逻辑上来说，转换消息格式为适合传输的数据格式是当作操作出站（outbound）数据，而将传输数据转换回程序中的消息格式是处理入站（inbound）数据。

### Netty 内嵌的编码器

Netty 内嵌了众多的编解码器来简化开发。下图展示了Netty 的内嵌编解码器。

可以看出，Netty 的内嵌编解码器基本上囊括了网络编程中可能需要涉及的编解码工作，包括以下内容：

- 支持字节与消息的转换、Base64的转换、解压缩文件。
- 对HTTP、HTTP2、DNS、SMTP、STOMP、MQTT、Socks等协议的支持。
- 对XML、JSON 、Redis、 Memcached、Protobuf等流行格式的支持。

编码器和解码器的结构很简单，消息被编码、**解码后自动通过 ReferenceCountUtil.release(message)释放**。如果不想释放消息可以使用`ReferenceCountUtil.retain(message)`，主要区别是`retain`会使引用数量增加而不会发生消息，大多数时候不需要这么做。

## 解码器

解码器的主要职责是负责将入站数据从一种格式转换到另一种格式。Netty 提供了丰富的解码器抽象基类。方便开发者自定义解码器。

这些基类主要分为以下两类：

- 解码从字节到消息（ByteToMessageDecoder 和 ReplayingDecoder）。
- 解码从消息到消息（MessageToMessageDecoder）。

Netty 的解码器是`ChannelInboundHandler`的抽象实现。在实际应用中使用解码器很简单，**就是将入站数据转换格式后传递到ChannelPipeline中的下一个ChannelInboundHandler进行处理**。将解码器放在`ChannelPipeline`中，会使整个程序变得灵活，同时也能方便重用逻辑。

### ByteToMessageDecoder 抽象类

ByteToMessageDecoder 抽象类用于将字节转为消息（或其他字节序列）。`ByteToMessageDecoder` 继承自`ChannelInboundHandlerAdapter`。`ChannelInboundHandlerAdapter`以类似流的方法将字节从`ByteBuf`解码为另一种消息类型。

**1、** 常用方法；

在处理网络数据时，有时数据比较大，不能一次性发送完毕，会分配发送。那么又如何获知数据已经发送完毕了呢？这个`ByteToMessageDecoder`抽象类会缓存入站的数据，并提供了以下几个方法，方便开发者使用。

这些方法的核心源码如下：

```java
protected abstract void decode(ChannelHandlerContext ctx, ByteBuf in, List<Object> out) throws Exception;
protected void decodeLast(ChannelHandlerContext ctx, ByteBuf in, List<Object> out) throws Exception {
    if (in.isReadable()) {
        // Only call decode() if there is something left in the buffer to decode.
        // See https://github.com/netty/netty/issues/4386
        decodeRemovalReentryProtection(ctx, in, out);
    }
}
final void decodeRemovalReentryProtection(ChannelHandlerContext ctx, ByteBuf in, List<Object> out)
    throws Exception {
    decodeState = STATE_CALLING_CHILD_DECODE;
    try {
        decode(ctx, in, out);
    } finally {
        boolean removePending = decodeState == STATE_HANDLER_REMOVED_PENDING;
        decodeState = STATE_INIT;
        if (removePending) {
            fireChannelRead(ctx, out, out.size());
            out.clear();
            handlerRemoved(ctx);
        }
    }
}
```

对上述方法说明如下：

- decode()：这是必须要实现的唯一抽象方法。decode()方法被调用时将会传入一个包含了传入数据的ByteBuf，以及一个用来添加解码消息的List。**对这个方法的调用将会重复执行，直到确定没有新的元素被添加到该List，或者该ByteBuf中没有更多可读的字节时为止。然后，如果List不为空，那么它的内容将会被传递给ChannelPipeline中的下一个**ChannelInboundHandler。
- decodeLast()：Netty 提供的这个默认实现只是简单地调用了decode()方法。当Channel的状态变为非活泼时，这个方法会被调用一次。可以重写该方法以提供特殊的处理。

**2、** 将字节转为整形的解码器示例；

> 该示例中，每次从入站的ByteBuf读取4个字节，解码成整形，并添加到一个List中。当不能再添加数据的List时，它所包含的内容就会被发送到下一个ChannelInboundHandler。

```java
public class ToIntegerDecoder extends ByteToMessageDecoder {
    @Override
   public void decode(ChannelHandlerContext ctx, ByteBuf in, List<Object> out) throws Exception {
    if (in.readableBytes() >= 4) {
        out.add(in.readInt());
    } }
}
```

在上述代码中，步骤如下：

**1、** 实现了继承`ByteToMessageDecoder`，用于将字节解码为消息；

**2、** 检查可读的字节是否至少有4个（一个int是4个字节长度）；

**3、** 从入站的`ByteBuf`读取int，添加到解码消息的`List`中；

整个例子的处理流程如下图所示：

对于编码器和解码器来说，整个过程非常简单。一旦一个消息被编码或者解码，它自动被`ReferenceCountUtil.release(message)`调用。如果不想释放消息可以使用`ReferenceCountUtil.retain(message)`。

### ReplayingDecoder 抽象类

`ReplayingDecoder`抽象类是`ByteToMessageDecoder`的一个子类，`ByteToMessageDecoder`解码读取缓冲区的数据之前**需要检查缓冲区是否有足够的字节**，使用`ReplayingDecoder`就无需自己检查；若ByteBuf中有足够的字节，则会正常读取；若没有足够的字节则会停止解码。

也正因为这样的包装使得`ReplayingDecode`带有一定的局限性。

- 不是所有的标准ByteBuf操作都被支持，如果调用一个不支持的操作会抛出UnReplayableOperationException。
- 性能上，使用ReplayingDecode要略慢与ByteToMessageDecoder。

如果你能忍受上面列出的限制，相比ByteToMessageDecoder，你可能更喜欢ReplayingDecoder。在满足需求的情况下推荐使用ByteToMessageDecoder，因为它的处理比较简单，没有`ReplayingDecoder`实现的那么复杂。

下面代码是`ReplayingDecoder`的实现：

```java
/**
 * Integer解码器,ReplayingDecoder实现
 */
public class ToIntegerReplayingDecoder extends ReplayingDecoder<Void> {
    @Override
    protected void decode(ChannelHandlerContext ctx, ByteBuf in, List<Object> out) throws Exception {
        out.add(in.readInt());
    }
}
```

### MessageToMessageDecoder 抽象类

`MessageToMessageDecoder`抽象类用于从一种消息解码为另外一种消息。

核心源码如下：

```java
public abstract class MessageToMessageDecoder<I> extends ChannelInboundHandlerAdapter {
    private final TypeParameterMatcher matcher;
    protected MessageToMessageDecoder() {
        matcher = TypeParameterMatcher.find(this, MessageToMessageDecoder.class, "I");
    }
    protected MessageToMessageDecoder(Class<? extends I> inboundMessageType) {
        matcher = TypeParameterMatcher.get(inboundMessageType);
    }
    public boolean acceptInboundMessage(Object msg) throws Exception {
        return matcher.match(msg);
    }
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        CodecOutputList out = CodecOutputList.newInstance();
        try {
            if (acceptInboundMessage(msg)) {
                @SuppressWarnings("unchecked")
                I cast = (I) msg;
                try {
                    decode(ctx, cast, out);
                } finally {
                    ReferenceCountUtil.release(cast);
                }
            } else {
                out.add(msg);
            }
        } catch (DecoderException e) {
            throw e;
        } catch (Exception e) {
            throw new DecoderException(e);
        } finally {
            try {
                int size = out.size();
                for (int i = 0; i < size; i++) {
                    ctx.fireChannelRead(out.getUnsafe(i));
                }
            } finally {
                out.recycle();
            }
        }
    }
    protected abstract void decode(ChannelHandlerContext ctx, I msg, List<Object> out) throws Exception;
}
```

**MessageToMessageDecoder的decode是需要实现的唯一抽象方法**。每个入站消息都被解码为另外一种格式，然后将解码后的消息传递给管道中的下一个`ChannelInboundHandler`。

以下是一个MessageToMessageDecoder 的使用示例：

```java
public class IntegerToStringDecoder extends MessageToMessageDecoder<Integer> {
    @Override
    public void decode(ChannelHandlerContext ctx, Integer msg List<Object> out) throws Exception {
        out.add(String.valueOf(msg));
    }
}
```

上述代码中，`IntegerToStringDecoder`继承自`MessageToMessageDecoder`，用于将 Integer 转为 String。分为两步：

- IntegerToStringDecoder继承自MessageToMessageDecoder。
- 通过tring.valueOf()转换 Integer 消息的字符串。

入站消息是按照在类定义中声明的参数（这里是Integer）而不是`ByteBuf`来解析的。在例子中，解码消息（这里是String）将被添加到`List`，并传递到下一个`ChannelInboundHandler`。

整个例子的处理流程图如下：

## 总结

上述我们重点讲解了 Netty 中的解码器相关知识。下节我们就来讲解一下编码器。
