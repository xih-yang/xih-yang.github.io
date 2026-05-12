# 14、Netty 源码分析 - Netty 编解码器
- 来源：https://ddkk.com/zhuanlan/server/netty/3/14.html
- 分类：服务器框架
- 分组：教程目录
在前面文章中，我们分别对解码器和编码器进行了讨论，其实针对编码和解码，Netty 还提供了第三种方式，那就是编解码器。编解码器顾名思义，就是结合了编码和解码功能的程序。

编解码器能够把入站和出站的数据和信息转换都放在同一个类中，对于某些场景来说显得更实用。

## 编解码器概述

Netty 提供了抽象的编解码器类，能把一些成对的解码器和编码器组合在一起，以此来提供对字节和消息都相同的操作。这些类实现了`ChannelOutboundHandler`和`ChannelInboundHandler`接口。

Netty 的编解码器抽象类主要有以下两种：

1、实现从字节到消息的编解码（`ByteToMessageCodec`）。

2、实现从消息到消息的编解码（`MessageToMessageCodec`）。

## ByteToMessageCodec 抽象类

ByteToMessageCodec 抽象类用于将字节实时编码/解码为消息的编解码器，可以将其视为`ByteToMessageDecoder`和`MessageToByteEncoder`的组合。

需要注意的是，**ByteToMessageCodec 的子类绝不能使用 @Sharable 进行注释**。

ByteToMessageCodec 抽象类的核心源码如下：

```java
public abstract class ByteToMessageCodec<I> extends ChannelDuplexHandler {
    private final TypeParameterMatcher outboundMsgMatcher;
    private final MessageToByteEncoder<I> encoder;
    private final ByteToMessageDecoder decoder = new ByteToMessageDecoder() {
        @Override
        public void decode(ChannelHandlerContext ctx, ByteBuf in, List<Object> out) throws Exception {
            ByteToMessageCodec.this.decode(ctx, in, out);
        }
        @Override
        protected void decodeLast(ChannelHandlerContext ctx, ByteBuf in, List<Object> out) throws Exception {
            ByteToMessageCodec.this.decodeLast(ctx, in, out);
        }
    };
    protected ByteToMessageCodec() {
        this(true);
    }
    protected ByteToMessageCodec(Class<? extends I> outboundMessageType) {
        this(outboundMessageType, true);
    }
    protected ByteToMessageCodec(boolean preferDirect) {
        ensureNotSharable();
        outboundMsgMatcher = TypeParameterMatcher.find(this, ByteToMessageCodec.class, "I");
        encoder = new Encoder(preferDirect);
    }
    protected ByteToMessageCodec(Class<? extends I> outboundMessageType, boolean preferDirect) {
        ensureNotSharable();
        outboundMsgMatcher = TypeParameterMatcher.get(outboundMessageType);
        encoder = new Encoder(preferDirect);
    }
    public boolean acceptOutboundMessage(Object msg) throws Exception {
        return outboundMsgMatcher.match(msg);
    }
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        decoder.channelRead(ctx, msg);
    }
    @Override
    public void write(ChannelHandlerContext ctx, Object msg, ChannelPromise promise) throws Exception {
        encoder.write(ctx, msg, promise);
    }
    @Override
    public void channelReadComplete(ChannelHandlerContext ctx) throws Exception {
        decoder.channelReadComplete(ctx);
    }
    @Override
    public void channelInactive(ChannelHandlerContext ctx) throws Exception {
        decoder.channelInactive(ctx);
    }
    @Override
    public void handlerAdded(ChannelHandlerContext ctx) throws Exception {
        try {
            decoder.handlerAdded(ctx);
        } finally {
            encoder.handlerAdded(ctx);
        }
    }
    @Override
    public void handlerRemoved(ChannelHandlerContext ctx) throws Exception {
        try {
            decoder.handlerRemoved(ctx);
        } finally {
            encoder.handlerRemoved(ctx);
        }
    }
    protected abstract void encode(ChannelHandlerContext ctx, I msg, ByteBuf out) throws Exception;
    protected abstract void decode(ChannelHandlerContext ctx, ByteBuf in, List<Object> out) throws Exception;
    protected void decodeLast(ChannelHandlerContext ctx, ByteBuf in, List<Object> out) throws Exception {
        if (in.isReadable()) {
            decode(ctx, in, out);
        }
    }
    private final class Encoder extends MessageToByteEncoder<I> {
        Encoder(boolean preferDirect) {
            super(preferDirect);
        }
        @Override
        public boolean acceptOutboundMessage(Object msg) throws Exception {
            return ByteToMessageCodec.this.acceptOutboundMessage(msg);
        }
        @Override
        protected void encode(ChannelHandlerContext ctx, I msg, ByteBuf out) throws Exception {
            ByteToMessageCodec.this.encode(ctx, msg, out);
        }
    }
}
```

在上述代码中，重点关注以下方法：

1、`decode()`：这是必须要实现的抽象方法，将入站的 ByteBuf 转换为指定的消息格式，并将其转发到管道中的下一个`ChannelInboundHandler`。

2、`encode()`：该方法是开发者需要实现的抽象方法。对于每个被编码并写入出站 ByteBuf 的消息来说，这个方法都将会被调用。

3、`decodeLast()`：Netty 提供的这个默认实现只是简单地调用了`decode()`方法。当`Channel`的状态变为非活动时，这个方法将会被调用一次。可以重写该方法以提供特殊的处理。

## MessageToMessageCodec 抽象类

MessageToMessageCodec 抽象类用于将消息实时编码/解码为消息的编解码器，可以将其视为`MessageToMessageDecoder`和`MessageTo`MessageEncoder`的组合。

MessageToMessageCodec 抽象类的核心源码如下：

```java
public abstract class MessageToMessageCodec<INBOUND_IN, OUTBOUND_IN> extends ChannelDuplexHandler {
    private final MessageToMessageEncoder<Object> encoder = new MessageToMessageEncoder<Object>() {
        @Override
        public boolean acceptOutboundMessage(Object msg) throws Exception {
            return MessageToMessageCodec.this.acceptOutboundMessage(msg);
        }
        @Override
        @SuppressWarnings("unchecked")
        protected void encode(ChannelHandlerContext ctx, Object msg, List<Object> out) throws Exception {
            MessageToMessageCodec.this.encode(ctx, (OUTBOUND_IN) msg, out);
        }
    };
    private final MessageToMessageDecoder<Object> decoder = new MessageToMessageDecoder<Object>() {
        @Override
        public boolean acceptInboundMessage(Object msg) throws Exception {
            return MessageToMessageCodec.this.acceptInboundMessage(msg);
        }
        @Override
        @SuppressWarnings("unchecked")
        protected void decode(ChannelHandlerContext ctx, Object msg, List<Object> out) throws Exception {
            MessageToMessageCodec.this.decode(ctx, (INBOUND_IN) msg, out);
        }
    };
    private final TypeParameterMatcher inboundMsgMatcher;
    private final TypeParameterMatcher outboundMsgMatcher;
    protected MessageToMessageCodec() {
        inboundMsgMatcher = TypeParameterMatcher.find(this, MessageToMessageCodec.class, "INBOUND_IN");
        outboundMsgMatcher = TypeParameterMatcher.find(this, MessageToMessageCodec.class, "OUTBOUND_IN");
    }
    protected MessageToMessageCodec(
            Class<? extends INBOUND_IN> inboundMessageType, Class<? extends OUTBOUND_IN> outboundMessageType) {
        inboundMsgMatcher = TypeParameterMatcher.get(inboundMessageType);
        outboundMsgMatcher = TypeParameterMatcher.get(outboundMessageType);
    }
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        decoder.channelRead(ctx, msg);
    }
    @Override
    public void write(ChannelHandlerContext ctx, Object msg, ChannelPromise promise) throws Exception {
        encoder.write(ctx, msg, promise);
    }
    public boolean acceptInboundMessage(Object msg) throws Exception {
        return inboundMsgMatcher.match(msg);
    }
    public boolean acceptOutboundMessage(Object msg) throws Exception {
        return outboundMsgMatcher.match(msg);
    }
    protected abstract void encode(ChannelHandlerContext ctx, OUTBOUND_IN msg, List<Object> out)
            throws Exception;
    protected abstract void decode(ChannelHandlerContext ctx, INBOUND_IN msg, List<Object> out)
            throws Exception;
}
```

在上述代码中，重点关注以下几个方法：

1、`decode()`：这是必须要实现的抽象方法，将入站消息（INBOUND_IN类型）解码为消息，这些消息将转发到`ChannelPipeline`中的下一个`ChannelInboundHandler`。

2、`encode()`：该方法是开发者需要实现的抽象方法。将出站消息（OUTBOUND_IN类型）编码为消息，然后将消息转发到`ChannelPipeline`中的下一个`ChannelOutboundHandler`。

**请注意，如果消息是ReferenceCounted类型，则需要对刚刚通过的消息调用ReferenceCounted.ratain()。这个调用是必须的，因为MessageToMessageCodec将在编码/解码的消息上调用ReferenceCounted.ralease()。**

以下是MessageToMessageCodec 的示例，将 Integer 解码为 Long，然后将 Long 编码为 Integer。

```java
public class NumberCodec extends MessageToMessageCodec<Integer,Long> {
    @Override
    protected void decode(ChannelHandlerContext ctx, Integer msg, List<Object> out) throws Exception {
            out.add(msg.longValue());
    }
    @Override
    protected void encode(ChannelHandlerContext ctx, Long msg, List<Object> out) throws Exception {
            out.add(msg.intValue())
    }
}
```

## ChannelDuplexHandler 类

观察`ByteToMessageCodec`和`MessageToMessageCodec`的源码，发现他们都继承自`ChannelDuplexHandler`类。ChannelDuplexHandler 类是`ChannelHandler`的一个实现，表示 `ChannelInboundHandler`和 `ChannelOutboundHandler`的组合。如果`ChannelHandler`的实现需要拦截操作及状态更新，则这个 ChannelDuplexHandler 类会是一个很好的起点。

```java
public class ChannelDuplexHandler extends ChannelInboundHandlerAdapter implements ChannelOutboundHandler {
     ...}
```

## CombinedChannelDuplexHandler 类

CombinedChannelDuplexHandler 类是 ChannelDuplexHandler 类的子类，用于将`ChannelInboundHandler`和 `ChannelOutboundHandler`组合到一个`ChannelHandler`中去。

在前面的文章示例中，编码器和解码器都是分开实现的。在不动现有代码的基础上，可以使用`CombinedChannelDuplexHandler`类轻松实现一个编解码器，唯一要做的就是通过 `CombinedChannelDuplexHandler`类来对解码器和编码器进行组合。

例如，有一个解码器`ByteToCharDecoder`，代码如下：

```java
public class ByteToCharDecoder extends ByteToMessageDecoder {
    @Override
    protected void decode(ChannelHandlerContext ctx, ByteBuf in, List<Object> out) throws Exception {
        if(in.readableBytes() >= 2){
            out.add(in.readChar());
        }
    }
}
```

`ByteToCharDecoder`用于从 ByteBuf 中提取 2 个字节长度的字符，并将它们作为 char 写入到 List 中，将会被自动装箱为 Character 对象。

编码器`CharToByteEncoder`的代码如下：

```java
public class CharToByteEncoder extends MessageToByteEncoder<Character> {
    @Override
    protected void encode(ChannelHandlerContext ctx, Character msg, ByteBuf out) throws Exception {
        out.writeChar(msg);
    }
}
```

CharToByteEncoder 编码 char 消息到 ByteBuf。

现在有了编码器和解码器了，需要将它们组成一个编解码器。`CombinedByteCharCodec`代码如下：

```java
public class CombinedByteCharCodec extends CombinedChannelDuplexHandler<ByteToCharDecoder, CharToByteEncoder> {
    public CombinedByteCharCodec(){
        super(new ByteToCharDecoder(),new CharToByteEncoder());
    }
}
```

`CombinedByteCharCodec`的参数是解码器和编码器，通过父类的构造器函数使它们结合起来。用上述方式组合编码器和解码器，使程序更简单、更灵活，避免编写多个编解码器类。

当然，是否使用`CombinedByteCharCodec`取决于具体的项目风格，没有绝对的好坏。

## 总结

通过以上对于编解码器的分析，相信小伙伴们对于编码器、解码器以及编解码器都有所了解了，下节我们就自己来实现一个自定义的编解码器。
