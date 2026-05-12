# 11、Dubbo 实战 - 远程调用流程
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/4/11.html
- 分类：J2EE框架
- 分组：教程目录
默认协议的rpc 过程是比较复杂的，其中涉及到了各个方面，其余各协议实际上有对这个过程进行简化；因此看懂了默认协议的rpc 过程，其他协议就非常容易懂了。在讲Dubbo通信过程之前，可以先了解：[Java 远程通讯可选技术及原理](https://wenku.baidu.com/view/c5851a4502768e9951e738bb.html)

### 通信过程

我们可以通过如下7 点分析RPC 通信过程：

- 是基于什么协议实现的？
- 怎么发起请求？
- 怎么将请求转化为符合协议的格式的？
- 使用什么传输协议传输？
- 响应端基于什么机制来接收请求？
- 怎么将流还原为传输格式的？
- 处理完毕后怎么回应？

此时我们用默认协议来分析：

- 是基于什么协议实现的？

Dubbo 协议（通信使用netty 协议）

- 怎么发起请求？

请求内容封装在RpcInvocation 对象，利用netty 客户端发请求

- 怎么将请求转化为符合协议的格式的？

对象序列化（其实还包含编码及解码过程）

- 使用什么传输协议传输？

Netty（本质是NIO 及socket）

- 响应端基于什么机制来接收请求？

Netty 的响应机制

- 怎么将流还原为传输格式的？

反序列化

- 处理完毕后怎么回应？

回应内容封装为RpcResult 对象中，序列化后通过netty 传给客户端

这个流程可以通过下图表示：

要了解这一过程，最好的方式就是在各处设置断点，然后在consumer端和provider端debug几次。

### 序列化

在了解Dubbo的序列化之前，需要先了解Java序列化的基本概念及原理：

序列化：dubbo提供了一系列的序列化反序列化对象工具。

Serialization接口定义：

```java
/**
 * Serialization. (SPI, Singleton, ThreadSafe)
 */
@SPI("hessian2")
public interface Serialization {
    /**
     * get content type id
     *
     * @return content type id
     */
    byte getContentTypeId();
    /**
     * get content type
     *
     * @return content type
     */
    String getContentType();
    /**
     * create serializer
     *
     * @param url
     * @param output
     * @return serializer
     * @throws IOException
     */
    @Adaptive
    ObjectOutput serialize(URL url, OutputStream output) throws IOException;
    /**
     * create deserializer
     *
     * @param url
     * @param input
     * @return deserializer
     * @throws IOException
     */
    @Adaptive
    ObjectInput deserialize(URL url, InputStream input) throws IOException;
}
```

SPI注解指定了序列化的默认实现为hessian2。

Serialization依赖于JDK的OutputStream，InputStream，因为各具体的序列化工具依赖于OutputStream，InputStream。但为了屏蔽各个序列化接口对Dubbo侵入，Dubbo定义统一的DataOutput DataInput接口来适配各种序列化工具的输入输出。

我们用默认的序列化Hessian2Serialization来举例来说明

```java
public class Hessian2Serialization implements Serialization {
    public static final byte ID = 2;
    public byte getContentTypeId() {
        return ID;
    }
    public String getContentType() {
        return "x-application/hessian2";
    }
    public ObjectOutput serialize(URL url, OutputStream out) throws IOException {
        return new Hessian2ObjectOutput(out);
    }
    public ObjectInput deserialize(URL url, InputStream is) throws IOException {
        return new Hessian2ObjectInput(is);
    }
}
```

Hessian2Serialization构建基于Hessian的Dubbo 接口Output，Input实现， Dubbo是基于Output，Input接口操作不需要关心具体的序列化反序列化实现方式。

```java
/**
 * Hessian2 Object output.
 */
public class Hessian2ObjectOutput implements ObjectOutput {
    private final Hessian2Output mH2o;
    public Hessian2ObjectOutput(OutputStream os) {
        mH2o = new Hessian2Output(os);
        mH2o.setSerializerFactory(Hessian2SerializerFactory.SERIALIZER_FACTORY);
    }
    public void writeBool(boolean v) throws IOException {
        mH2o.writeBoolean(v);
    }
    public void writeByte(byte v) throws IOException {
        mH2o.writeInt(v);
    }
    public void writeShort(short v) throws IOException {
        mH2o.writeInt(v);
    }
    public void writeInt(int v) throws IOException {
        mH2o.writeInt(v);
    }
    public void writeLong(long v) throws IOException {
        mH2o.writeLong(v);
    }
    public void writeFloat(float v) throws IOException {
        mH2o.writeDouble(v);
    }
    public void writeDouble(double v) throws IOException {
        mH2o.writeDouble(v);
    }
    public void writeBytes(byte[] b) throws IOException {
        mH2o.writeBytes(b);
    }
    public void writeBytes(byte[] b, int off, int len) throws IOException {
        mH2o.writeBytes(b, off, len);
    }
    public void writeUTF(String v) throws IOException {
        mH2o.writeString(v);
    }
    public void writeObject(Object obj) throws IOException {
        mH2o.writeObject(obj);
    }
    public void flushBuffer() throws IOException {
        mH2o.flushBuffer();
    }
}
```

Hessian2ObjectInput读取Hessian序列化的数据使用方式同上面类似就不再贴代码了请自己翻看源代码。

实际上：1）序列化：读取对象字段，按照一定格式写入文件（当然也可以使其他媒介）；2）反序列化：利用反射机制生成类对象，从媒介中读取对象信息，将这些字段信息赋给对象。

### Encode和Decode

在dubbo协议的传输过程中，client并非只是单纯将RpcInvocation对象序列化后传递给server，同理server也不是将RpcResult对象反序列化后传递给client；其中涉及到编解码的过程。

这里我们看到NettyClient.java代码中（NettyServer.java也有类似）：

```java
    @Override
    protected void doOpen() throws Throwable {
        NettyHelper.setNettyLoggerFactory();
        bootstrap = new ClientBootstrap(channelFactory);
        // config
        // @see org.jboss.netty.channel.socket.SocketChannelConfig
        bootstrap.setOption("keepAlive", true);
        bootstrap.setOption("tcpNoDelay", true);
        bootstrap.setOption("connectTimeoutMillis", getTimeout());
        final NettyHandler nettyHandler = new NettyHandler(getUrl(), this);
        bootstrap.setPipelineFactory(new ChannelPipelineFactory() {
            public ChannelPipeline getPipeline() {
                NettyCodecAdapter adapter = new NettyCodecAdapter(getCodec(), getUrl(), NettyClient.this);
                ChannelPipeline pipeline = Channels.pipeline();
                pipeline.addLast("decoder", adapter.getDecoder());
                pipeline.addLast("encoder", adapter.getEncoder());
                pipeline.addLast("handler", nettyHandler);
                return pipeline;
            }
        });
    }
```

这里实际上是netty机制中会对channle中的内容进行编解码。

而我们看NettyCodecAdapter中，实际上处理编解码的是Codec2，这是一个接口，其具体的类在META-INF/dubbo/internal/com.alibaba.dubbo.remoting.Codec2文件中定义：

```java
dubbo=com.alibaba.dubbo.rpc.protocol.dubbo.DubboCountCodec
```

最后真正做编解码任务的是DubboCodec，除了对RpcInvocation和RpcResult序列化或者反序列化外，还会加入一些其他信息。
