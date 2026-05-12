# 07、Zookeeper 源码解析 - 通信协议
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/2/7.html
- 分类：注册中心
- 分组：教程目录
### 一、序列化和反序列化

ZooKeeper中的序列化和反序列化是通过Record，接口中有两个方法。

```java
public interface Record {
    //序列化
    void serialize(OutputArchive archive, String tag) throws IOException;
    //反序列化
    void deserialize(InputArchive archive, String tag) throws IOException;
}
```

ZooKeeper中就是通过这个接口来实现，请求数据的反序列以及文件快照和日志快照的序列化到本地，它具有很多的实现类，如下所示：

每一个实现类都是对当前的数据，需要进行相应数据格式的序列化和反序列化的实现，底层是通过DataOutputStream来实现。

### 二、通信协议

本文将从源码的角度去分析ZooKeeper的通信协议，通信一般法分为请求和响应。

**1、请求协议**

回到NIOServerCnxn的doIO方法，里边会调用socket的read方法如下：

```java
//传递一个ByteBuffer实例
int rc = sock.read(incomingBuffer);
```

incomingBuffer就是我们用来读取数据的缓冲区对象，我们来看看其初始化过程：

```java
private final ByteBuffer lenBuffer = ByteBuffer.allocate(4);
protected ByteBuffer incomingBuffer = lenBuffer;
```

所以，incomingBuffer默认是先读取四个字节的数据。此时会调用readLength(k)方法，这个方法就是读取当前缓冲区中的数据。刚好是一个int类型（int类型是四个字节），这个值表示接下来要读取的数据大小，得到数据大小后会重新按照读到的长度分配incomingBuffer容量，此时我们可以知道请求协议中头四个字节（一个int）是用来保存后续需要发送的数据大小。

接下来就是记性读取剩余的数据，此时分为两步走，一个是建立连接，调用readConnectRequest()，创建和保存session过程，也就是初始化当前会话。接下来就是建立请求调用readRequest()->processPacket()：

此时会通过RequestHeader来处理请求头，他是Record接口的一个实现类。查看其反序列化方法：

```java
  public void deserialize(InputArchive a_, String tag) throws java.io.IOException {
    a_.startRecord(tag);
    xid=a_.readInt("xid");
    type=a_.readInt("type");
    a_.endRecord(tag);
}
```

也就是请求头会包含两个值xid和type都是一个int类型，xid表示当前的会话请求的顺序值，type表示当前的需要执行的类型（create\ls\get等，在ZooDefs的OpCode中可以查看具体的请求类型比如create=1），剩下的就是请求体，每一种请求体都是一个Record的实现类。

所以，请求协议如下：

数据长度
请求头
请求体

四个字节
xid:四个字节，type:四个字节
n个字节

每一类请求体都会有对应的对象进行封装，接下来我们以创建一个节点为例：

在PrepRequestProcessor的pRequestHelper方法中会创建一个 CreateRequest对象，在pRequest2TxnCreate方法中会调用请求体的解析：

```java
ByteBufferInputStream.byteBuffer2Record(request.request, record);
```

此时的Record就是CreateRequest的实现，我们来看看其反序列化方法：

```java
public void deserialize(InputArchive a_, String tag) throws java.io.IOException {
//一个空的实现
a_.startRecord(tag);
//读取节点路径，String类型的读取，先读取当前需要读取的字符串长度，然后再根据长度读取字符串内容
path=a_.readString("path");
//读取节点内容，也是先读取长度再读取内容
data=a_.readBuffer("data");
{
     //读取当前的传递过来的权限验证，首先会读取当前的权限认证有多少个
      Index vidx1 = a_.startVector("acl");
      if (vidx1!= null) {
               acl=new java.util.ArrayList<org.apache.zookeeper.data.ACL>();
      //循环读取权限值，权限的读取又是通过ACL来实现
          for (; !vidx1.done(); vidx1.incr()) {
    org.apache.zookeeper.data.ACL e1;
    e1= new org.apache.zookeeper.data.ACL();
    a_.readRecord(e1,"e1");
            acl.add(e1);
          }
      }
    a_.endVector("acl");
    }
    //读取当前的参数值
    flags=a_.readInt("flags");
    a_.endRecord(tag);
}
```

此时，客户端如果严格按照这样的实现去发送请求就会创建相应的节点。

### 三、响应协议

服务端处理完请求之后，就会进行响应，这部分简单分析一下服务端响应的一个数据格式。

所有的请求最终都会落到FinalRequestProcessor中进行处理，服务端处理完请求之后，就会创建一个带有Response结尾的响应数据对象（Record），还是以创建节点为例：

服务端处理完请求之后，会创建一个new Create2Response(rc.path, rc.stat)。然后调用NIOServerCnxn实例的sendResponse方法进行返回：

```java
public int sendResponse(ReplyHeader h, Record r, String tag, String cacheKey, Stat stat, int opCode) {
    int responseSize = 0;
    try {
    //序列化返回对象
        ByteBuffer[] bb = serialize(h, r, tag, cacheKey, stat, opCode);
        responseSize = bb[0].getInt();
        bb[0].rewind();
        //发送响应数据
        sendBuffer(bb);
        decrOutstandingAndCheckThrottle(h);
    } catch (Exception e) {
        LOG.warn("Unexpected exception. Destruction averted.", e);
    }
    return responseSize;
}
```

此时序列化方法就是具体的响应协议的实现，如下所示：

```java
protected ByteBuffer[] serialize(ReplyHeader h, Record r, String tag,
                                 String cacheKey, Stat stat, int opCode) throws IOException {
    //序列化响应头，是通过ReplyHeader 实现
    byte[] header = serializeRecord(h);
    //得到响应体
    byte[] data = serializeRecord(r);
    //计算响应体数据长度
    int dataLength = data == null ? 0 : data.length;
    //总的数据长度
    int packetLength = header.length + dataLength;
    //设置当前响应的数据总长度
    ByteBuffer lengthBuffer = ByteBuffer.allocate(4).putInt(packetLength);
    lengthBuffer.rewind();
    int bufferLen = data != null ? 3 : 2;
    ByteBuffer[] buffers = new ByteBuffer[bufferLen];
    buffers[0] = lengthBuffer;
    //写入响应头
    buffers[1] = ByteBuffer.wrap(header);
    if (data != null) {
    //写入响应体
        buffers[2] = ByteBuffer.wrap(data);
    }
    return buffers;
}
```

也就是前四个字节写入当前响应数据的总长度，接下来就是响应头和响应体。

响应头ReplyHeader：

```java
public void serialize(OutputArchive a_, String tag) throws java.io.IOException {
a_.startRecord(this,tag);
//四个字节表示当前的xid
a_.writeInt(xid,"xid");
//八个字节表示事务id
a_.writeLong(zxid,"zxid");
//四个字节表示当前处理结果
a_.writeInt(err,"err");
a_.endRecord(this,tag);
}
```

响应体：

```java
public void serialize(OutputArchive a_, String tag) throws java.io.IOException {
a_.startRecord(this,tag);
//写入当前节点的路径
a_.writeString(path,"path");
//写入当前节点的状态值
a_.writeRecord(stat,"stat");
a_.endRecord(this,tag);
}
```

所以完整的响应协议如下：

数据长度
响应头
响应体

四个字节
xid:四个字节，zxid:八个字节，err:四个字节
n个字节

### 四、总结

ZooKeeper中通过Record接口实现数据序列化和反序列化过程，每一种事务请求都会有对应的Record的实现，以及相应的响应实现，这两种实现主要是来处理请求体和响应体，在了解完所有的这些实现，就可以自己编写属于自己的客户端api去连接ZooKeeper然后进行操作。

以上，有任何不对的地方，请留言指正，敬请谅解。
