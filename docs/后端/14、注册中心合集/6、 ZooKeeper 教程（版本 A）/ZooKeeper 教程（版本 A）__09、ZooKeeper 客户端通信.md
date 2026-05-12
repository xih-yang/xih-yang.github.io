# 09、ZooKeeper 客户端通信
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/d-1/9.html
- 分类：注册中心
- 分组：ZooKeeper 教程（版本 A）
## 继承关系

ServerCnxn代表服务端到客户端的一条连接

ServerCnxn实现了Stats和Watcher，所有具有查看ServerCnxn统计数据以及监听一些事件并进行处理的能力

## 属性

```java
// 连接创建时间
protected final Date established = new Date();
// packet接收数量
protected final AtomicLong packetsReceived = new AtomicLong();
// packet发送数量
protected final AtomicLong packetsSent = new AtomicLong();
// 最小延迟
protected long minLatency;
// 最大延迟
protected long maxLatency;
// 上一次操作
protected String lastOp;
// 上一次的cxid
protected long lastCxid;
// 上一次zxid
protected long lastZxid;
// 上一次响应时间
protected long lastResponseTime;
// 上一次延迟
protected long lastLatency;
// 数量
protected long count;
// 总的延迟
protected long totalLatency;
```

## 内部类

### CloseRequestException

请求关闭异常

```java
protected static class CloseRequestException extends IOException {
  private static final long serialVersionUID = -7854505709816442681L;
  public CloseRequestException(String msg) {
    super(msg);
  }
}
```

### EndOfStreamException

流结束异常

```java
protected static class EndOfStreamException extends IOException {
  private static final long serialVersionUID = -8255690282104294178L;
  public EndOfStreamException(String msg) {
    super(msg);
  }
  public String toString() {
    return "EndOfStreamException: " + getMessage();
  }
}
```

## 重要方法

### 抽象方法

```java
// 获取会话超时时间
abstract int getSessionTimeout();
// 关闭
abstract void close();
// 通知客户端session已关闭
abstract void sendCloseSession();
// 处理事件
public abstract void process(WatchedEvent event);
// 获取sessionId
public abstract long getSessionId();
// 设置sessionId
abstract void setSessionId(long sessionId);
// 输出缓冲
abstract void sendBuffer(ByteBuffer closeConn);
// 允许接收
abstract void enableRecv();
// 禁用接收
abstract void disableRecv();
// 设置会话的过期时间
abstract void setSessionTimeout(int sessionTimeout);
// 获取统计信息
protected abstract ServerStats serverStats();
```

### 具体方法

### sendReponse

发送响应结果

```java
public void sendResponse(ReplyHeader h, Record r, String tag) throws IOException {
  ByteArrayOutputStream baos = new ByteArrayOutputStream();
  // Make space for length
  BinaryOutputArchive bos = BinaryOutputArchive.getArchive(baos);
  try {
    // 写入4个0
    baos.write(fourBytes);
    // 写入header
    bos.writeRecord(h, "header");
    // 写入record
    if (r != null) {
      bos.writeRecord(r, tag);
    }
    baos.close();
  } catch (IOException e) {
    LOG.error("Error serializing response");
  }
  // 获取序列化后的响应
  byte b[] = baos.toByteArray();
  // 使用响应信息的大小更新系统状态
  serverStats().updateClientResponseSize(b.length - 4);
  // 将序列化后的响应结果以及长度放入buffer中
  ByteBuffer bb = ByteBuffer.wrap(b);
  bb.putInt(b.length - 4).rewind();
  // 发送
  sendBuffer(bb);
}
```

### 获取验证信息

```java
public List<Id> getAuthInfo() {
  return Collections.unmodifiableList(authInfo);
}
```

### 添加验证信息

```java
public void addAuthInfo(Id id) {
  // 不存在才添加
  if (authInfo.contains(id) == false) {
    authInfo.add(id);
  }
}
```

### 移除验证信息

```java
public boolean removeAuthInfo(Id id) {
  return authInfo.remove(id);
}
```

### 增加接收到的packet数量

```java
protected void packetReceived() {
  // 自增packetsReceived
  incrPacketsReceived();
  // 更新服务器统计值
  ServerStats serverStats = serverStats();
  if (serverStats != null) {
    serverStats().incrementPacketsReceived();
  }
}
```

### 增加发送packet数量

```java
protected void packetSent() {
  // 自增packetsSent
  incrPacketsSent();
  // 更新服务器统计值
  ServerStats serverStats = serverStats();
  if (serverStats != null) {
    serverStats.incrementPacketsSent();
  }
}
```

### 使用响应更新服务器状态

```java
protected synchronized void updateStatsForResponse(long cxid, long zxid,
            String op, long start, long end)
{
  // don't overwrite with "special" xids - we're interested
  // in the clients last real operation
  if (cxid >= 0) {
    lastCxid = cxid;
  }
  lastZxid = zxid;
  lastOp = op;
  lastResponseTime = end;
  long elapsed = end - start;
  lastLatency = elapsed;
  if (elapsed < minLatency) {
    minLatency = elapsed;
  }
  if (elapsed > maxLatency) {
    maxLatency = elapsed;
  }
  count++;
  totalLatency += elapsed;
}
```

## NIOServerCnxn

NIOServerCnxn是ServeCnxn的实现类，使用NIO来完成网络通信

也是每个客户端对应一个NIOServerCnxn

## 属性

```java
// 工厂
private final NIOServerCnxnFactory factory;
// 连接对应的channel
private final SocketChannel sock;
// selector线程
private final SelectorThread selectorThread;
// 关注的事件
private final SelectionKey sk;
// 是否初始化
private boolean initialized;
// 四个字节的缓冲区
private final ByteBuffer lenBuffer = ByteBuffer.allocate(4);
private ByteBuffer incomingBuffer = lenBuffer;
// 缓冲队列 
private final Queue<ByteBuffer> outgoingBuffers =
  new LinkedBlockingQueue<ByteBuffer>();
// 会话过期时间
private int sessionTimeout;
// 服务器对象
private final ZooKeeperServer zkServer;
/**
     * The number of requests that have been submitted but not yet responded to.
     */
// 提交了但是未收到响应的请求个数
private final AtomicInteger outstandingRequests = new AtomicInteger(0);
/**
     * This is the id that uniquely identifies the session of a client. Once
     * this session is no longer active, the ephemeral nodes will go away.
     */
// 会话id
private long sessionId;
private final int outstandingLimit;
```

## 内部类

### SendBufferWriter

主要的功能是对响应结果进行分块

```java
private class SendBufferWriter extends Writer {
  private StringBuffer sb = new StringBuffer();
  // 两种情况会返回true
  // 1. 强制发送force设置为true
  // 2. 待发送内容大于2048
  private void checkFlush(boolean force) {
    if ((force && sb.length() > 0) || sb.length() > 2048) {
      sendBufferSync(ByteBuffer.wrap(sb.toString().getBytes()));
      // clear our internal buffer
      sb.setLength(0);
    }
  }
  @Override
  public void close() throws IOException {
    if (sb == null) return;
    checkFlush(true);
    sb = null; // clear out the ref to ensure no reuse
  }
  @Override
  public void flush() throws IOException {
    checkFlush(true);
  }
  @Override
  public void write(char[] cbuf, int off, int len) throws IOException {
    sb.append(cbuf, off, len);
    checkFlush(false);
  }
}
```

## 重要方法

### 构造方法

```java
public NIOServerCnxn(ZooKeeperServer zk, SocketChannel sock,
                         SelectionKey sk, NIOServerCnxnFactory factory,
                         SelectorThread selectorThread) throws IOException {
  this.zkServer = zk;
  this.sock = sock;
  this.sk = sk;
  this.factory = factory;
  this.selectorThread = selectorThread;
  if (this.factory.login != null) {
    this.zooKeeperSaslServer = new ZooKeeperSaslServer(factory.login);
  }
  if (zk != null) {
    outstandingLimit = zk.getGlobalOutstandingLimit();
  } else {
    outstandingLimit = 1;
  }
  sock.socket().setTcpNoDelay(true);
  /* set socket linger to false, so that socket close does not block */
  sock.socket().setSoLinger(false, -1);
  InetAddress addr = ((InetSocketAddress) sock.socket()
                      .getRemoteSocketAddress()).getAddress();
  authInfo.add(new Id("ip", addr.getHostAddress()));
  this.sessionTimeout = factory.sessionlessCnxnTimeout;
}
```

### sendBuffer

```java
public void sendBuffer(ByteBuffer bb) {
  if (LOG.isTraceEnabled()) {
    LOG.trace("Add a buffer to outgoingBuffers, sk " + sk
              + " is valid: " + sk.isValid());
  }
  // 将当前需要发送的ByteBuffer添加到队列中，等待异步发送
  outgoingBuffers.add(bb);
  // 
  requestInterestOpsUpdate();
}
```

### sendBuffer

```java
// 同步发送
void sendBufferSync(ByteBuffer bb) {
  try {
    if (bb != ServerCnxnFactory.closeConn) {
      if (sock.isOpen()) {
        // 配置为阻塞
        sock.configureBlocking(true);
        // 阻塞写出
        sock.write(bb);
      }
      // 更新统计值
      packetSent();
    }
  } catch (IOException ie) {
    LOG.error("Error sending data synchronously ", ie);
  }
}
```

### doIO

处理io

### 读

读总共分为如下几步：

**1、** 使用lenBuffer读取四个字节；

**2、** 判断四个字节是指令还是长度；

**3、** 如果是四个字节的指令，那么会执行指令；

**4、** 如果是长度，那么会为incomingBuffer分配指定大小的空间，然后读取接收剩余内容，解析成请求并处理；

```java
void doIO(SelectionKey k) throws InterruptedException {
  try {
    if (isSocketOpen() == false) {
      LOG.warn("trying to do i/o on a null socket for session:0x"
               + Long.toHexString(sessionId));
      return;
    }
    // 当前可读
    if (k.isReadable()) {
      // 将输入读取到incomingBuffer中
      int rc = sock.read(incomingBuffer);
      if (rc < 0) {
        throw new EndOfStreamException(
          "Unable to read additional data from client sessionid 0x"
          + Long.toHexString(sessionId)
          + ", likely client has closed socket");
      }
      // 接收输入的缓冲区已满
      if (incomingBuffer.remaining() == 0) {
        // 当前incomingBuffer中存放的是四个字母的command还是请求内容
        boolean isPayload;
        // 每次一个完整的读请求处理后，都会清空lenBuffer,并赋值给incomingBuffer
        // incomingBuffer标志一个完整读请求的开始
        if (incomingBuffer == lenBuffer) {
      // start of next request
          // 可读
          incomingBuffer.flip();
          // 从lenBuffer中读取整数
          // 如果代表的是长度，那么会为incomingBuffer分配指定长度空间，此时isPayLoad为true
          // 如果代表的是指令，那么此时isPayLoad为false，并且会使用CommandExecutor来执行指令
          isPayload = readLength(k);
          // 清空incomingBuffer
          incomingBuffer.clear();
        } else {
          // continuation
          isPayload = true;
        }
       	// 读取真实请求内容
        if (isPayload) {
      // not the case for 4letterword
          readPayload();
        }
        else {
          // four letter words take care
          // need not do anything else
          // 为四个字母的指令
          return;
        }
      }
    }
}
```

```java
private boolean readLength(SelectionKey k) throws IOException {
  // Read the length, now get the buffer
  // 从lenBuffer中读取一个整数
  int len = lenBuffer.getInt();
  // 判断是否是四字母的指令
  if (!initialized && checkFourLetterWord(sk, len)) {
    return false;
  }
  if (len < 0 || len > BinaryInputArchive.maxBuffer) {
    throw new IOException("Len error " + len);
  }
  if (!isZKServerRunning()) {
    throw new IOException("ZooKeeperServer not running");
  }
  // len不是四个字母的指令，而是请求内容的长度
  // 分配空间
  incomingBuffer = ByteBuffer.allocate(len);
  return true;
}
```

```java
private void readPayload() throws IOException, InterruptedException {
  // 如果incomingBuffer还有空间，代表还未读取完毕
  if (incomingBuffer.remaining() != 0) {
      // have we read length bytes?
    // 继续读取
    int rc = sock.read(incomingBuffer); // sock is non-blocking, so ok
    if (rc < 0) {
      throw new EndOfStreamException(
        "Unable to read additional data from client sessionid 0x"
        + Long.toHexString(sessionId)
        + ", likely client has closed socket");
    }
  }
  // 如果incomingBuffer没有空间，代表读取完毕
  if (incomingBuffer.remaining() == 0) {
      // have we read length bytes?
    // 更新统计值
    packetReceived();
    // 可读
    incomingBuffer.flip();
    // 当前仍未初始化
    if (!initialized) {
      // 处理连接请求
      readConnectRequest();
    } else {
      // 从inputBuffer中读取请求，并处理请求
      readRequest();
    }
    // 清空lenBuffer，并将incomingBuffer重新设置为lenBuffer，标志此次读取操作完成
    lenBuffer.clear();
    incomingBuffer = lenBuffer;
  }
}
```

### 写

```java
if (k.isWritable()) {
  handleWrite(k);
  if (!initialized && !getReadInterest() && !getWriteInterest()) {
    throw new CloseRequestException("responded to info probe");
  }
}
```

```java
void handleWrite(SelectionKey k) throws IOException, CloseRequestException {
  if (outgoingBuffers.isEmpty()) {
    return;
  }
  // 分配直接缓冲
  ByteBuffer directBuffer = NIOServerCnxnFactory.getDirectBuffer();
  if (directBuffer == null) {
    // 直接缓冲为null，不使用直接缓冲
    ByteBuffer[] bufferList = new ByteBuffer[outgoingBuffers.size()];
    // Use gathered write call. This updates the positions of the
    // byte buffers to reflect the bytes that were written out.
    // 将outgoingBuffer中的多个write call产生的响应写出
    sock.write(outgoingBuffers.toArray(bufferList));
    // Remove the buffers that we have sent
    // 将已经发送出去的buffer从outgoingBuffers中移除
    ByteBuffer bb;
    while ((bb = outgoingBuffers.peek()) != null) {
      if (bb == ServerCnxnFactory.closeConn) {
        throw new CloseRequestException("close requested");
      }
      if (bb.remaining() > 0) {
        break;
      }
      packetSent();
      outgoingBuffers.remove();
    }
  } else {
    // 直接缓冲不为null,清空直接缓冲
    directBuffer.clear();
    for (ByteBuffer b : outgoingBuffers) {
      // 响应的大小大于直接缓冲的大小
      // 缩小响应缓冲大小
      if (directBuffer.remaining() < b.remaining()) {
        b = (ByteBuffer) b.slice().limit(
          directBuffer.remaining());
      }
      // 记录b当前位置
      int p = b.position();
      // 将b添加到直接缓冲，此时会修改b的position
      directBuffer.put(b);
      // 将b的position修改回去
      b.position(p);
      if (directBuffer.remaining() == 0) {
        break;
      }
    }
    // 使直接缓冲可读
    directBuffer.flip();
    // 记录发送量
    int sent = sock.write(directBuffer);
    ByteBuffer bb;
    // Remove the buffers that we have sent
    // 通过send将outgoingBuffer中已经发送的buffer移除
    while ((bb = outgoingBuffers.peek()) != null) {
      if (bb == ServerCnxnFactory.closeConn) {
        throw new CloseRequestException("close requested");
      }
      if (sent < bb.remaining()) {
        // 当前buffer只发送了部分，更新位置
        bb.position(bb.position() + sent);
        break;
      }
      packetSent();
      /* We've sent the whole buffer, so drop the buffer */
      sent -= bb.remaining();
      outgoingBuffers.remove();
    }
  }
}
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
