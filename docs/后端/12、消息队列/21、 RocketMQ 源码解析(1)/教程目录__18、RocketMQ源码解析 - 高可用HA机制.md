# 18、RocketMQ源码解析 - 高可用HA机制
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/1/18.html
- 分类：消息队列
- 分组：教程目录
HA主从同步的核心类图如图所示：

## 初始RocketMQ HA

HAService：主从同步核心实现类。

- AtomicInteger connectionCount：Master维护的连接数。（Slave的个数）。
- List`` connectionList：具体连接信息。
- AcceptSocketService acceptSocketService：服务端接收连接线程实现类。
- DefaultMessageStore defaultMessageStore：Broker存储实现。
- WaitNotifyObject waitNotifyObject：同步等待实现。
- AtomicLong push2SlaveMaxOffset：该Master所有Slave中同步最大的偏移量。
- GroupTransferService groupTransferService：判断主从同步复制是否完成。
- HAClient haClient：HA客户端实现，Slave端网络的实现类。

HAConnection：HA Master-Slave 网络连接对象。

- private final HAService haService：关联的AService实现类。
- SocketChannel socketChannel：网络通道。
- String clientAddr：客户端地址。
- WriteSocketService writeSocketService：HAConnection网络写封装。
- ReadSocketService readSocketService：HAConnection网络写封装。

RocketMQ HA机制大体可以分为如下三个部分。

- Master启动并监听Slave的连接请求。
- Slave启动，与Master建立链接。
- Slave发送待拉取偏移量待Master返回数据，持续该过程。

## 2、HAService实现原理剖析

### 2.1 Master启动流程（HAService）

```java
public void start() throws Exception {
    this.acceptSocketService.beginAccept();
    this.acceptSocketService.start();
    this.groupTransferService.start();
    this.haClient.start();
}
public void start() throws Exception {
    this.acceptSocketService.beginAccept();
    this.acceptSocketService.start();
    this.groupTransferService.start();
    this.haClient.start();
}
```

- 建立HA服务端监听服务，处理客户Slave客户端监听请求。
- 启动AcceptSocketService，处理监听逻辑。
- 启动GroupTransferService线程。
- 启动HA客户端线程。

不管是Master 还是 Slave 都将按照上述流程启动，在内部的实现会根据 Broker 配置来决定真正开启的流程。

#### 2.1.1 AcceptSocketService 实现原理

AcceptSocketService作为Master端监听Slave连接的实现类，作为HAService的内部类，其类图如图所示：

- SocketAddress socketAddressListen：Broker服务监听套接字(本地IP+端口号)。
- ServerSocketChannel serverSocketChannel：服务端Socket通道，基于NIO。
- Selector selector：事件选择器，基于NIO。

HAService `$` AcceptSocketService#beginAccept

```java
public void beginAccept() throws Exception {
    this.serverSocketChannel = ServerSocketChannel.open();
    this.selector = RemotingUtil.openSelector();
    this.serverSocketChannel.socket().setReuseAddress(true);
    this.serverSocketChannel.socket().bind(this.socketAddressListen);
    this.serverSocketChannel.configureBlocking(false);
    this.serverSocketChannel.register(this.selector, SelectionKey.OP_ACCEPT);
}
```

创建ServerSocketChannel、创建Selector、设置TCP reuseAddress、绑定监听端口、设置为非阻塞模式，并注册OP_ACCEPT(连接事件)。

HAService `$` AcceptSocketService#run

```java
this.selector.select(1000);
Set<SelectionKey> selected = this.selector.selectedKeys();
if (selected != null) {
 for (SelectionKey k : selected) {
       if ((k.readyOps() & SelectionKey.OP_ACCEPT) != 0) {
               SocketChannel sc = ((ServerSocketChannel) k.channel()).accept();
               if (sc != null) {
                      HAService.log.info("HAService receive new connection, "+ sc.socket().getRemoteSocketAddress());
                            try {
                             HAConnection conn = new HAConnection(HAService.this, sc);
                             conn.start();
                             HAService.this.addConnection(conn);
                      } catch (Exception e) {
                             log.error("new HAConnection exception", e);
                             sc.close();
                      }
                }
       } else {
            log.warn("Unexpected ops in select " + k.readyOps());
       }
  }
   selected.clear();
}
```

该方法是标准的基于NIO的服务端程式实例，选择器每1s处理一次处理一次连接就绪事件。连接事件就绪后，调用ServerSocketChannel的accept()方法创建SocketChannel，与服务端数据传输的通道。然后为每一个连接创建一个HAConnection对象，该HAConnection将负责M-S数据同步逻辑。

#### 2.1.2 GroupTransferService实现原理

GroupTransferService同步主从同步阻塞实现，如果是同步主从模式，消息发送者将消息刷写到磁盘后，需要继续等待新数据被传输到从服务器，从服务器数据的复制是在另外一个线程HAConnection中去拉取，所以消息发送者在这里需要等待数据传输的结果，GroupTransferService就是实现该功能，该类的整体结构与同步刷盘实现类(CommitLog `$` GroupCommitService)类似，本节只关注该类的核心业务逻辑doWaitTransfer的实现。

```java
private void doWaitTransfer() {
synchronized (this.requestsRead) {
    if (!this.requestsRead.isEmpty()) {
        for (CommitLog.GroupCommitRequest req : this.requestsRead) {
            boolean transferOK = HAService.this.push2SlaveMaxOffset.get() >= req.getNextOffset();
            for (int i = 0; !transferOK && i < 5; i++) {
                 this.notifyTransferObject.waitForRunning(1000);
                 transferOK = HAService.this.push2SlaveMaxOffset.get() >= req.getNextOffset();
             }
            if (!transferOK) {
                 log.warn("transfer messsage to slave timeout, " + req.getNextOffset());
            }
                req.wakeupCustomer(transferOK);
        }
        this.requestsRead.clear();
   }
}
}
```

对requestsRead加锁，顺序处理消息发送者线程提交的【主从同步负责是否成功结束查询请求】，消息发送者线程提交该任务后将被阻塞直到GroupTransferService通知唤醒或超时。也就是GroupTransferService的职责就是判断主从同步是否结束。

判断主从同步是否完成的依据是：所有Slave中已成功复制的最大偏移量是否大于等于消息生产者发送消息后消息服务端返回下一条消息的起始偏移量，如果是则表示主从同步复制已经完成，唤醒消息发送线程，否则等待1s,再次判断，每一个任务在一批任务中循环判断5次。消息消费者返回有两种情况：如果等待超过5s或 GroupTransferService通知主从复制完成则返回。可以通过syncFlushTimeout来设置等待时间。

GroupTransferService通知主从复制的实现如下：

```java
public void notifyTransferSome(final long offset) {
    for (long value = this.push2SlaveMaxOffset.get(); offset > value; ) {
        boolean ok = this.push2SlaveMaxOffset.compareAndSet(value, offset);
        if (ok) {
            this.groupTransferService.notifyTransferSome();
            break;
        } else {
            value = this.push2SlaveMaxOffset.get();
        }
    }
}
```

该方法是在Master收到从服务器的拉取请求，拉取请求是slave下一次待拉取的消息偏移量，也可以认为是Slave的拉取偏移量确认信息，如果该信息大于push2SlaveMaxOffset，则更新push2SlaveMaxOffset，然后唤醒GroupTransferService线程，各消息发送者线程再判断push2SlaveMaxOffset与期望的偏移量进行对比。

#### 2.1.3 HAClient 实现原理

- private static final int READ_MAX_BUFFER_SIZE = 1024 * 1024 * 4：Socket读缓存区大小。
- AtomicReference`` masterAddress：master地址。
- ByteBuffer reportOffset = ByteBuffer.allocate(8)：Slave向Master发起主从同步的拉取偏移量，固定8个字节。
- SocketChannel socketChannel：网络传输通道。
- Selector selector：NIO事件选择器。
- long lastWriteTimestamp：上一下写入时间戳。
- long currentReportedOffset：反馈Slave当前的复制进度，commitlog文件最大偏移量。
- dispatchPostion：本次已处理读缓存区的指针。
- ByteBuffer byteBufferRead：读缓存区，大小为4M。
- ByteBuffer byteBufferBackup：读缓存区备份，与BufferRead进行交换。

##### 2.1.3.1 run方法详解

HAClient的run是HAClient整个工作机制的实现，接下来详细分析其运行流程。

HAService `$` HAClient#connectMaster

```java
private boolean connectMaster() throws ClosedChannelException {
    if (null == socketChannel) {
        String addr = this.masterAddress.get();
        if (addr != null) {
            SocketAddress socketAddress = RemotingUtil.string2SocketAddress(addr);
            if (socketAddress != null) {
                this.socketChannel = RemotingUtil.connect(socketAddress);
                if (this.socketChannel != null) {
                    this.socketChannel.register(this.selector, SelectionKey.OP_READ);
                }
            }
        }
        this.currentReportedOffset = HAService.this.defaultMessageStore.getMaxPhyOffset();
        this.lastWriteTimestamp = System.currentTimeMillis();
    }
    return this.socketChannel != null;
}
```

Step1：如果socketChannel为空，则尝试连接Master,如果master地址为空，返回false。如果master地址不为空，则建立到Master的TCP连接，然后注册OP_READ(网络读事件)，并初始化currentReportedOffset 为commitlog文件的最大偏移量、lastWriteTimestamp 上次写入时间戳为当前时间戳，并返回true，原来在Broker启动时，如果其角色为SLAVE时，将读取Broker配置文件中的haMasterAddress属性更新HAClient的masterAddrees,如果角色未SLAVE但haMasterAddress为空，启动不会报错，但不会执行主从复制，该方法最终返回是否成功连接上Master。

HAService `$` HAClient#isTimeToReportOffset

```java
private boolean isTimeToReportOffset() {
  long interval = HAService.this.defaultMessageStore.getSystemClock().now() - this.lastWriteTimestamp;
  boolean needHeart = interval > HAService.this.defaultMessageStore.getMessageStoreConfig().getHaSendHeartbeatInterval();
  return needHeart;
 }
```

Step2：判断是否需要向Master汇报已拉取消息偏移量。其依据为每次拉取间隔必须大于haSendHeartbeatInterval，默认5s。

HAService `$` HAClient#reportSlaveMaxOffset

```java
private boolean reportSlaveMaxOffset(final long maxOffset) {
            this.reportOffset.position(0);
            this.reportOffset.limit(8);
            this.reportOffset.putLong(maxOffset);
            this.reportOffset.position(0);
            this.reportOffset.limit(8);
            for (int i = 0; i < 3 && this.reportOffset.hasRemaining(); i++) {
                try {
                    this.socketChannel.write(this.reportOffset);
                } catch (IOException e) {
                    log.error(this.getServiceName()
                        + "reportSlaveMaxOffset this.socketChannel.write exception", e);
                    return false;
                }
            }
            return !this.reportOffset.hasRemaining();
        }
```

Step3：如果需要向Master反馈当前拉取偏移量，则向Master发送一个8字节的请求，请求包中包含的数据为当前Broker消息文件的最大偏移量。

这里RocketMQ的作者改成了一个基本的ByteBuffer操作示例：首先分别将ByteBuffer的position、limit设置为0与ByteBuffer的总长度，然后将偏移量写入到ByteBuffer中，然后需要将ByteBuffer的当前状态从写状态转换为读状态，以便将数据传入通道中。RocketMQ作者采用的方法是手段设置position指针为0，limit为ByteBuffer容易，其实这里可以通过调用ByteBuffer的flip()方法达到同样的目的，将一个ByteBuffer写入到通道，通常使用循环写入，判断一个ByteBuffer是否全部写入到通道的一个方法是调用ByteBuffer#hasRemaining()方法。如果返回false,表示在进行网络读写时发生了IO异常，此时会关闭与Master的连接。

HAService `$` HAClient#run

```java
this.selector.select(1000);
```

Step4：进行事件选择，其执行间隔为1s。

HAService `$` HAClient#processReadEvent

```java
private boolean processReadEvent() {
int readSizeZeroTimes = 0;
while (this.byteBufferRead.hasRemaining()) {
    try {
        int readSize = this.socketChannel.read(this.byteBufferRead);
        if (readSize > 0) {
            lastWriteTimestamp = HAService.this.defaultMessageStore.getSystemClock().now();
            readSizeZeroTimes = 0;
            boolean result = this.dispatchReadRequest();
            if (!result) {
                log.error("HAClient, dispatchReadRequest error");
                return false;
            }
        } else if (readSize == 0) {
            if (++readSizeZeroTimes >= 3) {
                break;
            }
        } else {
            log.info("HAClient, processReadEvent read socket < 0");
            return false;
        }
    } catch (IOException e) {
        log.info("HAClient, processReadEvent read socket exception", e);      
        return false;
    }
}
return true;
}
```

Step5：处理网络读请求，也就是处理从Master传回的消息数据。同样RocketMQ的作者给出了一个处理网络读的NIO示例。循环判断readByteBuffer是否还有剩余空间，如果存在剩余空间，则调用SocketChannel#read(ByteBuffer readByteBuffer),将通道中的数据读入到读缓存区中。

- 如果读取到的字节数大于0，重置读取到0字节的次数，并更新最后一次写入时间戳（lastWriteTimestamp），然后调用dispatchReadRequest()转发该请求，处理消息的解析、入库。
- 如果连续3次从网络通道读取到0个字节，则结束本次读，返回true。
- 如果读取到的字节数小于0或发生IO异常，则返回false。

HAClient线程反复执行上述5个步骤，接下来讲解一下dispatchReadRequest()方法的实现。

##### 2.1.3.2 dispatchReadRequest方法详解

该方法主要从byteBufferRead中解析一条一条的消息，然后存储到commitlog文件并转发到消息消费队列与索引文件中。

需要解决如下情况：

- 如果判断byteBufferRead是否包含一条完整的消息。
- 如果不包含一条完整的信息，该如何处理。

带着上述问题，我们一起分析一下RocketMQ是如何解决上述问题的。

HAService `$` HAClient#dispatchReadRequest

```java
final int msgHeaderSize = 8 + 4; // phyoffset + size
int readSocketPos = this.byteBufferRead.position();
```

Step1：msgHeaderSize,头部长度，大小为12个字节，包括消息的物理偏移量与消息的长度，长度字节必须首先探测，否则无法判断byteBufferRead缓存区中是否包含一条完整的消息。readSocketPos：记录当前byteBufferRead的当前指针。

HAService `$` HAClient#dispatchReadRequest

```java
int diff = this.byteBufferRead.position() - this.dispatchPostion;
if (diff >= msgHeaderSize) {
     // ...
}
```

Step2：先探测byteBufferRead缓冲区中是否包含一条消息的头部，如果包含头部，则读取物理偏移量与消息长度，然后再探测是否包含一条完整的消息，如果不包含，则需要将byteBufferRead中的数据备份，以便更多数据到达再处理。

HAService `$` HAClient#dispatchReadRequest

```java
long masterPhyOffset = this.byteBufferRead.getLong(this.dispatchPostion);
int bodySize = this.byteBufferRead.getInt(this.dispatchPostion + 8);
long slavePhyOffset = HAService.this.defaultMessageStore.getMaxPhyOffset();
if (slavePhyOffset != 0) {
    if (slavePhyOffset != masterPhyOffset) {
         log.error("master pushed offset not equal the max phy offset in slave, SLAVE: "
                + slavePhyOffset + " MASTER: " + masterPhyOffset);
         return false;
    }
}
```

Step3：如果byteBufferRead中包含一则消息头部，则读取物理偏移量与消息的长度，然后获取Slave当前消息文件的最大物理偏移量，如果slave的最大物理偏移量与master给的偏移量不相等，则返回false，从后面的处理逻辑来看，返回false,将会关闭与master的连接，在Slave本次周期内将不会再参与主从同步了。

HAService `$` HAClient#dispatchReadRequest

```java
int diff = this.byteBufferRead.position() - this.dispatchPostion;
if (diff >= (msgHeaderSize + bodySize)) {
     byte[] bodyData = new byte[bodySize];
     this.byteBufferRead.position(this.dispatchPostion + msgHeaderSize);
     this.byteBufferRead.get(bodyData);
     HAService.this.defaultMessageStore.appendToCommitLog(masterPhyOffset, bodyData);
     this.byteBufferRead.position(readSocketPos);
     this.dispatchPostion += msgHeaderSize + bodySize;
     if (!reportSlaveMaxOffsetPlus()) {
          return false;
     }
     continue;
}
```

Step4：dispatchPosition：表示byteBufferRead中已转发的指针。设置byteBufferRead的position指针为dispatchPosition+msgHeaderSize,然后读取bodySize个字节内容到byte[]字节数组中，并调用DefaultMessageStore#appendToCommitLog方法将消息内容追加到消息内存映射文件中，然后唤醒ReputMessageService实时将消息转发给消息消费队列与索引文件，更新dispatchPosition，并向服务端及时反馈当前已存储进度。将所读消息存入内存映射文件后重新向服务端发送slave最新的偏移量。

HAService `$` HAClient#dispatchReadRequest

```java
if (!this.byteBufferRead.hasRemaining()) {
    this.reallocateByteBuffer();
}
```

Step5：如果byteBufferRead中未包含一条完整的消息的处理逻辑，具体看一下reallocateByteBuffer的实现。

其核心思想是将readByteBuffer中剩余的有效数据先复制到readByteBufferBak,然后交换readByteBuffer与readByteBufferBak。

### 2.1.4 HAConnection实现原理分析

首先在Master端会在一个固定端口监听客户端的连接，当收到客户端的连接请求后，会接收连接并构建SocketChannel，然后将该SocketChannel封装成一个HAConnection连接实例，其职责是处理Master与Slave的读写相关的操作，HAConnection类图如图所示：

- HAService haService：HAService对象。
- SocketChannel socketChannel：网络socket通道。
- String clientAddr：客户端连接地址。
- WriteSocketService writeSocketService：服务端向从服务器写数据的服务类。
- ReadSocketService readSocketService：服务端从从服务器其读数据的服务类。
- long slaveRequestOffset：从服务器请求拉取数据的偏移量。
- long slaveAckOffset：从服务器反馈已拉取完成的数据偏移量。

##### 2.1.4.1 解析客户端拉取请求实现原理

服务端解析从服务器的拉取请求实现类为 HAConnection 的内部类 ReadSocketService，其类图如图所示：

- READ_MAX_BUFFER_SIZE:网络读缓存区大小，默认1M。
- Selector selector：NIO网络事件选择器。
- SocketChannel socketChannel：网络通道，用于读写的socket通道。
- ByteBuffer byteBufferRead：网络读写缓存区，默认为1M。
- int processPosition：
- volatile long lastReadTimestamp：上次读取数据的时间戳。

##### 2.1.4.2HAConnection $ ReadSocketService构造方法

```java
public ReadSocketService(final SocketChannel socketChannel) throws IOException {
    this.selector = RemotingUtil.openSelector();
    this.socketChannel = socketChannel;
    this.socketChannel.register(this.selector, SelectionKey.OP_READ);
    this.thread.setDaemon(true);
}
```

该方法主要是创建一个事件选择器，并将该网络通道注册在事件选择器上，并注册网络读事件。

##### 2.1.4.3 HAConnection $ ReadSocketService#run

```java
while (!this.isStopped()) {
    try {
           this.selector.select(1000);
           boolean ok = this.processReadEvent();
           if (!ok) {
                HAConnection.log.error("processReadEvent error");
                break;
            }
            long interval = HAConnection.this.haService.getDefaultMessageStore().getSystemClock().now() - this.lastReadTimestamp;
            if (interval > HAConnection.this.haService.getDefaultMessageStore().getMessageStoreConfig().getHaHousekeepingInterval()) {
                  log.warn("ha housekeeping, found this connection[" + HAConnection.this.clientAddr + "] expired, " + interval);
                  break;
             }
      } catch (Exception e) {
           HAConnection.log.error(this.getServiceName() + " service has exception.", e);
           break;
       }
}
```

run方法的核心实现就是每1s执行一次事件就绪选择，然后调用processReadEvent方法处理读请求，读取从服务器的拉取请求。

##### 2.1.4.4 HAConnection $ ReadSocketService#processReadEvent

HAConnection `$` ReadSocketService#processReadEvent

```java
int readSizeZeroTimes = 0;
if (!this.byteBufferRead.hasRemaining()) {
    this.byteBufferRead.flip();
    this.processPostion = 0;
}
```

Step1：如果byteBufferRead没有剩余空间，说明该positionlimitcapacity，调用byteBufferRead.flip()方法，其实这里调用clear()方法会更加容易理解，并设置processPostion为0，processPostion为byteBufferRead当前已处理数据的指针。

HAConnection `$` ReadSocketService#processReadEvent

```java
while (this.byteBufferRead.hasRemaining()) {
     // 处理网络读
    int readSize = this.socketChannel.read(this.byteBufferRead);
}
```

Step2：NIO网络读的常规方法，由于NIO是非阻塞的，一次网络读写的字节大小不确定，一般都会尝试多次读取。

HAConnection `$` ReadSocketService#processReadEvent

```java
if (readSize > 0) {
    readSizeZeroTimes = 0;
    this.lastReadTimestamp = HAConnection.this.haService.getDefaultMessageStore().getSystemClock().now();
    if ((this.byteBufferRead.position() - this.processPostion) >= 8) {
         int pos = this.byteBufferRead.position() - (this.byteBufferRead.position() % 8);
         long readOffset = this.byteBufferRead.getLong(pos - 8);
         this.processPostion = pos;
         HAConnection.this.slaveAckOffset = readOffset;
         if (HAConnection.this.slaveRequestOffset < 0) {
             HAConnection.this.slaveRequestOffset = readOffset;
             log.info("slave[" + HAConnection.this.clientAddr + "] request offset " + readOffset);
          }
            HAConnection.this.haService.notifyTransferSome(HAConnection.this.slaveAckOffset);
      }
}
```

Step3：如果读取的字节大于0并且本次读取到的内容大于等于8，表明收到从服务器一条拉取消息请求。读取从服务器已拉取偏移量，因为有新的从服务器反馈拉取进度，需要通知某些生产者以便返回，因为如果消息发送使用同步方式，需要等待将消息复制到从服务器，然后才返回，故这里需要唤醒相关线程去判断自己关注的消息是否已经传输完成。

HAConnection `$` ReadSocketService#processReadEvent

```java
if (readSize == 0) {
      if (++readSizeZeroTimes >= 3) {
           break;
      }
} else {
log.error("read socket[" + HAConnection.this.clientAddr + "] < 0");
return false;
}
```

Step4：如果读取到的字节数等于0，则重复三次，否则结束本次读请求处理；如果读取到的字节数小于0，表示连接被断开，返回false，后续会断开该连接。

##### 2.1.4.5 HAConnection $ WriteSocketService

该类主要负责将消息内容传输给从服务器，器类图如图所示：

- Selector selector：NIO网络事件选择器。
- SocketChannel socketChannel：网络socket通道。
- int headerSize：消息头长度，消息物理偏移量+消息长度。
- long nextTransferFromWhere：下一次传输的物理偏移量。
- SelectMappedBufferResult selectMappedBufferResult：根据偏移量查找消息的结果。
- boolean lastWriteOver：上一次数据是否传输完毕。
- long lastWriteTimestamp：上次写入的时间戳。

接下来重点分析WriteSocketService的实现原理。

HAConnection `$` WriteSocketService#run

```java
if (-1 == HAConnection.this.slaveRequestOffset) {
        Thread.sleep(10);
        continue;
}
```

Step1：如果slaveRequestOffset等于-1，说明Master还未收到从服务器的拉取请求，放弃本次事件处理。slaveRequestOffset在收到从服务器拉取请求时更新（HAConnection `$` ReadSocketService）。

HAConnection `$` WriteSocketService#run

```java
if (-1 == this.nextTransferFromWhere) {
     if (0 == HAConnection.this.slaveRequestOffset) {
             long masterOffset = HAConnection.this.haService.getDefaultMessageStore().getCommitLog().getMaxOffset();
             masterOffset = masterOffset - (masterOffset % HAConnection.this.haService.getDefaultMessageStore().getMessageStoreConfig().getMapedFileSizeCommitLog());
            if (masterOffset < 0) {
                 masterOffset = 0;
            }
            this.nextTransferFromWhere = masterOffset;
      } else {
            this.nextTransferFromWhere = HAConnection.this.slaveRequestOffset;
      }
}
```

Step2：如果nextTransferFromWhere为-1表示初次进行数据传输，需要计算需要传输的物理偏移量，如果slaveRequestOffset为0，则从当前commitlog文件最大偏移量开始传输，否则根据从服务器的拉取请求偏移量开始传输。

HAConnection `$` WriteSocketService#run

```java
if (this.lastWriteOver) {
    long interval =
    HAConnection.this.haService.getDefaultMessageStore().getSystemClock().now() - this.lastWriteTimestamp;
    if (interval > HAConnection.this.haService.getDefaultMessageStore().getMessageStoreConfig().getHaSendHeartbeatInterval()) {
          // Build Header
          this.byteBufferHeader.position(0);
          this.byteBufferHeader.limit(headerSize);
          this.byteBufferHeader.putLong(this.nextTransferFromWhere);
          this.byteBufferHeader.putInt(0);
          this.byteBufferHeader.flip();
          this.lastWriteOver = this.transferData();
          if (!this.lastWriteOver)
              continue;
          }
     } else {
          this.lastWriteOver = this.transferData();
          if (!this.lastWriteOver)
               continue;
   }
```

Step3：判断上次写事件是否将信息已全部写入到客户端。

- 如果已全部写入，判断当前系统是与上次最后写入的时间间隔是否大于HA心跳检测时间，则需要发送一个心跳包，心跳包的长度为12个字节(从服务器待拉取偏移量+size),消息长度默认存0，表示本次数据包为心跳包，避免长连接由于空闲被关闭。HA心跳包发送间隔通过设置haSendHeartbeatInterval，默认值为5s。
- 如果上次数据未写完，则继续传输上一次的数据，然后再次判断是否传输完成，如果消息还是未全部传输，则结束此次事件处理，待下次写事件到底后，继续将未传输完的数据先写入消息从服务器。

HAConnection `$` WriteSocketService#run

```java
SelectMappedBufferResult selectResult =
        HAConnection.this.haService.getDefaultMessageStore().getCommitLogData(this.nextTransferFromWhere);
if (selectResult != null) {
       int size = selectResult.getSize();
       if (size > HAConnection.this.haService.getDefaultMessageStore().getMessageStoreConfig().getHaTransferBatchSize()) {
            size = HAConnection.this.haService.getDefaultMessageStore().getMessageStoreConfig().getHaTransferBatchSize();
       }
       long thisOffset = this.nextTransferFromWhere;
       this.nextTransferFromWhere += size;
       selectResult.getByteBuffer().limit(size);
       this.selectMappedBufferResult = selectResult;
      // Build Header
       this.byteBufferHeader.position(0);
       this.byteBufferHeader.limit(headerSize);
       this.byteBufferHeader.putLong(thisOffset);
       this.byteBufferHeader.putInt(size);
       this.byteBufferHeader.flip();
       this.lastWriteOver = this.transferData();
 } else {
       HAConnection.this.haService.getWaitNotifyObject().allWaitForRunning(100);
}
```

Step4：传输消息到从服务器。

- 根据消息从服务器请求的待拉取偏移量，RocketMQ首先获取该偏移量之后所有的可读消息，如果未查到匹配的消息，通知所有等待线程继续等待100ms。
- 如果匹配到消息，判断返回消息总长度是否大于配置的HA传输一次同步任务最大传输的字节数，则通过设置ByteBuffer的limit来设置只传输指定长度的字节，这就意味着HA客户端收到的信息会包含不完整的消息。HA一批次传输消息最大字节通过haTransferBatchSize来设置，默认值为32K。HA服务端消息的传输一直以上述步骤在循环运行，每次事件处理完成后等待1s。

RocketMQ HA主从同步机制就讲解到这里，其主要交互流程如图所示：
