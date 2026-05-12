# 13、Netty 源码分析 - Netty 编码器
- 来源：https://ddkk.com/zhuanlan/server/netty/3/13.html
- 分类：服务器框架
- 分组：教程目录
上一篇我们讲解了解码器的相关知识，其中也提到了编码器的定义。

编码器就是用来把出站数据从一种格式转换到另外一种格式，因此它实现了`ChannelOutboundHandler`，类似于解码器，Netty 也提供了一组类来帮助开发者快速上手编码器，当然，这些类提供的是与解码器相反的方法，如下所示：

**1、** 编码从消息到字节（`MessageToByteEncoder`）；

**2、** 编码从消息到消息（`MessageToMessageEncoder`）；

## MessageToByteEncoder 抽象类

在上一篇文章中，我们知道了如何使用`ByteToMessageDecoder`来将字节转换成消息，现在可以使用`MessageToByteEncoder`实现相反的效果。

MessageToByteEncoder 核心代码如下：

```java
public abstract class MessageToByteEncoder<I> extends ChannelOutboundHandlerAdapter {
    private final TypeParameterMatcher matcher;
    private final boolean preferDirect;
    protected MessageToByteEncoder() {
        this(true);
    }
    protected MessageToByteEncoder(Class<? extends I> outboundMessageType) {
        this(outboundMessageType, true);
    }
    protected MessageToByteEncoder(boolean preferDirect) {
        this.matcher = TypeParameterMatcher.find(this, MessageToByteEncoder.class, "I");
        this.preferDirect = preferDirect;
    }
    protected MessageToByteEncoder(Class<? extends I> outboundMessageType, boolean preferDirect) {
        this.matcher = TypeParameterMatcher.get(outboundMessageType);
        this.preferDirect = preferDirect;
    }
    public boolean acceptOutboundMessage(Object msg) throws Exception {
        return this.matcher.match(msg);
    }
    public void write(ChannelHandlerContext ctx, Object msg, ChannelPromise promise) throws Exception {
        ByteBuf buf = null;
        try {
            if (this.acceptOutboundMessage(msg)) {
                I cast = msg;
                buf = this.allocateBuffer(ctx, msg, this.preferDirect);
                try {
                    this.encode(ctx, cast, buf);
                } finally {
                    ReferenceCountUtil.release(msg);
                }
                if (buf.isReadable()) {
                    ctx.write(buf, promise);
                } else {
                    buf.release();
                    ctx.write(Unpooled.EMPTY_BUFFER, promise);
                }
                buf = null;
            } else {
                ctx.write(msg, promise);
            }
        } catch (EncoderException var17) {
            throw var17;
        } catch (Throwable var18) {
            throw new EncoderException(var18);
        } finally {
            if (buf != null) {
                buf.release();
            }
        }
    }
    protected ByteBuf allocateBuffer(ChannelHandlerContext ctx, I msg, boolean preferDirect) throws Exception {
        return preferDirect ? ctx.alloc().ioBuffer() : ctx.alloc().heapBuffer();
    }
    protected abstract void encode(ChannelHandlerContext var1, I var2, ByteBuf var3) throws Exception;
    protected boolean isPreferDirect() {
        return this.preferDirect;
    }
}
```

在`MessageToByteEncoder`抽象类中，唯一要关注的是`encode`方法，该方法是开发者需要实现的唯一抽象方法。它与出站消息一起调用，将消息编码为`ByteBuf`，然后，将`ByteBuf`转发到`ChannelPipeline`中的下一个`ChannelOutboundHandler`。

以下是MessageToByteEncoder 的使用示例：

```java
public class ShortToByteEncoder extends MessageToByteEncoder<Short> {
    @Override
    protected void encode(ChannelHandlerContext ctx, Integer msg, ByteBuf out) throws Exception {
        out.writeShort(msg);//将Short转成二进制字节流写入ByteBuf中
    }
}
```

上述示例中，`ShortToByteEncoder`收到 `Short` 消息，编码它们，并把它们写入`ByteBuf`。然后，将`ByteBuf`转发到`ChannelPipeline`中的下一个`ChannelOutboundHandler`，每个 Short 将占有 ByteBuf 的两个字节。

实现`ShortToByteEncoder`主要分为以下两步：

**1、** 实现继承自`MessageToByteEncoder`；

**2、** 写Short到ByteBuf；

上述的例子处理流程图如下：

Netty 也提供了很多`MessageToByteEncoder`类的子类来帮助开发者实现自己的编码器，例如：

## MessageToMessageEncoder 抽象类

`MessageToMessageEncoder`抽象类用于**将出站数据从一种消息转换为另一种消息**。

核心源码如下：

```java
public abstract class MessageToMessageEncoder<I> extends ChannelOutboundHandlerAdapter {
    private final TypeParameterMatcher matcher;
    /**
     * Create a new instance which will try to detect the types to match out of the type parameter of the class.
     */
    protected MessageToMessageEncoder() {
        matcher = TypeParameterMatcher.find(this, MessageToMessageEncoder.class, "I");
    }
    /**
     * Create a new instance
     *
     * @param outboundMessageType   The type of messages to match and so encode
     */
    protected MessageToMessageEncoder(Class<? extends I> outboundMessageType) {
        matcher = TypeParameterMatcher.get(outboundMessageType);
    }
    /**
     * Returns {@code true} if the given message should be handled. If {@code false} it will be passed to the next
     * {@link ChannelOutboundHandler} in the {@link ChannelPipeline}.
     */
    public boolean acceptOutboundMessage(Object msg) throws Exception {
        return matcher.match(msg);
    }
    @Override
    public void write(ChannelHandlerContext ctx, Object msg, ChannelPromise promise) throws Exception {
        CodecOutputList out = null;
        try {
            if (acceptOutboundMessage(msg)) {
                out = CodecOutputList.newInstance();
                @SuppressWarnings("unchecked")
                I cast = (I) msg;
                try {
                    encode(ctx, cast, out);
                } finally {
                    ReferenceCountUtil.release(cast);
                }
                if (out.isEmpty()) {
                    throw new EncoderException(
                            StringUtil.simpleClassName(this) + " must produce at least one message.");
                }
            } else {
                ctx.write(msg, promise);
            }
        } catch (EncoderException e) {
            throw e;
        } catch (Throwable t) {
            throw new EncoderException(t);
        } finally {
            if (out != null) {
                try {
                    final int sizeMinusOne = out.size() - 1;
                    if (sizeMinusOne == 0) {
                        ctx.write(out.getUnsafe(0), promise);
                    } else if (sizeMinusOne > 0) {
                        // Check if we can use a voidPromise for our extra writes to reduce GC-Pressure
                        // See https://github.com/netty/netty/issues/2525
                        if (promise == ctx.voidPromise()) {
                            writeVoidPromise(ctx, out);
                        } else {
                            writePromiseCombiner(ctx, out, promise);
                        }
                    }
                } finally {
                    out.recycle();
                }
            }
        }
    }
    private static void writeVoidPromise(ChannelHandlerContext ctx, CodecOutputList out) {
        final ChannelPromise voidPromise = ctx.voidPromise();
        for (int i = 0; i < out.size(); i++) {
            ctx.write(out.getUnsafe(i), voidPromise);
        }
    }
    private static void writePromiseCombiner(ChannelHandlerContext ctx, CodecOutputList out, ChannelPromise promise) {
        final PromiseCombiner combiner = new PromiseCombiner(ctx.executor());
        for (int i = 0; i < out.size(); i++) {
            combiner.add(ctx.write(out.getUnsafe(i)));
        }
        combiner.finish(promise);
    }
    protected abstract void encode(ChannelHandlerContext ctx, I msg, List<Object> out) throws Exception;
}
```

同`MessageToByteEncoder`抽象类一样，`MessageToMessageEncoder`唯一要关注的也是`encode`方法，该方法是开发者需要实现的唯一抽象方法。对于使用`write()`编写的每条消息，都会调用该消息，以将消息编码为一个或多个新的出站消息，然后将编码后的消息转发。

下面是使用 `MessageToMessageEncoder` 的一个例子：

```java
public class IntegerToStringEncoder extends MessageToMessageEncoder <Integer> {
    @Override
    protected void encode(ChannelHandlerContext ctx, Integer msg, List<Object> out) throws Exception {
        out.add(String.ValueOf(msg));
    }
}
```

上述示例将 Integer 消息编码为 String 消息，主要分为两步：

**1、** 实现继承自`MessageToMessageEncoder`；

**2、** 将Integer转为String，并添加到MessageBuf；

上述例子的处理流程如下图所示：

## 总结

通过上述文章的讲解，我们对于编码器和解码器应该都有了一定的认识，其实针对编码和解码，Netty 还提供了第三种方式，那就是编解码器。下节我们就来讲解一下。
