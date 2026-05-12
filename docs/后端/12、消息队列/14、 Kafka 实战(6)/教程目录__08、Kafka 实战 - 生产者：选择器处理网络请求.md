# 08、Kafka 实战 - 生产者：选择器处理网络请求
- 来源：https://ddkk.com/zhuanlan/mq/kafka/6/8.html
- 分类：消息队列
- 分组：教程目录
> 涉及网络通信时，一般使用选择器模型，选择器使用 Java NIO 异步非阻塞方式管理连接和读写请求，好处就是单个线程就能管理多个网络连接通道，生产者只需要使用一个选择器就能同时和 Kafka 集群的多个服务端进行网络通信

### 一、Java NIO 的一些概念

- SocketChannel 客户端网络连接通道，底层的字节数据读写都发生在通道上，通道会和字节缓冲区一起使用(channel.read(buffer) / channel.write(buffer))
- Selector 选择器，发送在通道上的事件有读和写，选择器通过选择键的方式监听读写事件
- SelectionKey 选择键，将通道注册到选择器上，channel.register(selector) 返回选择键，读写事件发生时，通过选择键就可以得到对应的通道进行读写操作

### 二、客户端连接服务端并建立 Kafka 通道

- 选择器的 connect() 方法创建客户端到指定远程服务器的网络连接，使用的是 Java NIO 的 SocketChannel 对象完成
- 这里创建了更抽象的 KafkaChannel，并使用 SelectionKeys.attach(KafkaChannel) 将选择键和 KafkaChannel 关联起来
- 轮询的时候可以使用 SelectionKeys.attachment() 获取对应的 KafkaChannel
- 选择器还会维护一个节点编号和 KafkaChannel 的 Map，方便客户端根据节点编号获取 KafkaChannel
- 关系梳理
- SocketChannel 注册到 Selector 上返回 SelectionKeys，将 Selector 用于构建传输层，再把传输层用于构造 KafkaChannel
- 这样 KafkaChannel 和 SocketChannel 通过键进行了关联，本质上 KafkaChannel 就是对 SocketChannel 的一层封装

```java
/**
 * Begin connecting to the given address and add the connection to this nioSelector associated with the given id
 * number.
 * 开始连接到给定的地址，并将连接添加到与给定id号关联的nioSelector中。
 * <p>
 * Note that this call only initiates the connection, which will be completed on a future {@linkpoll(long)}
 * call. Check {@linkconnected()} to see which (if any) connections have completed after a given poll call.
 * 注意，此调用只启动连接，连接将在未来的{@linkpoll(long)}调用中完成。检查{@linkconnected()}，查看在给定的轮询调用之后完成了哪些连接(如果有)。
 */
@Override
public void connect(String id, InetSocketAddress address, int sendBufferSize, int receiveBufferSize) throws IOException {
    if (this.channels.containsKey(id))
        throw new IllegalStateException("There is already a connection for id " + id);
    // Java NIO 代码
    // 获取 SocketChannel
    SocketChannel socketChannel = SocketChannel.open();
    // 设置非阻塞
    socketChannel.configureBlocking(false);
    Socket socket = socketChannel.socket();
    socket.setKeepAlive(true);
    // 设置参数，Producer 里面有些默认值
    if (sendBufferSize != Selectable.USE_DEFAULT_BUFFER_SIZE)
        socket.setSendBufferSize(sendBufferSize);
    if (receiveBufferSize != Selectable.USE_DEFAULT_BUFFER_SIZE)
        socket.setReceiveBufferSize(receiveBufferSize);
    // 默认值是 false，代表要开启 Nagle 的算法，会把网络中小的数据包收集起来组成一个大的包再发送
    socket.setTcpNoDelay(true);
    boolean connected;
    try {
        // 尝试连接，立马成功返回 true，很久才成功会返回 false
        connected = socketChannel.connect(address);
    } catch (UnresolvedAddressException e) {
        socketChannel.close();
        throw new IOException("Can't resolve address: " + address, e);
    } catch (IOException e) {
        socketChannel.close();
        throw e;
    }
    // 注册 Selector
    SelectionKey key = socketChannel.register(nioSelector, SelectionKey.OP_CONNECT);
    // 封装一个 KafkaChannel
    KafkaChannel channel = channelBuilder.buildChannel(id, key, maxReceiveSize);
    // 把 key 和 KafkaChannel 关联起来
    key.attach(channel);
    // 缓存起来
    this.channels.put(id, channel);
    // 正常情况下，网络不能完成连接
    // 如果连接上了，取消前面的注册 OP_CONNECT 事件
    if (connected) {
        // OP_CONNECT won't trigger for immediately connected channels 对于立即连接的通道，不会触发OP_CONNECT
        log.debug("Immediately connected to node {}", channel.id());
        immediatelyConnectedKeys.add(key);
        key.interestOps(0);
    }
}
```

### 三、Kafka 通道和网络传输层

- 构建 Kafka 通道的传输层有多种实现，比如纯文本模式、sasl、ssl 加密模式，PlaintextTransportLayer 就是纯文本的传输层实现
- 传输层面向底层的字节缓冲区，操作的是字节流，KafkaChannel 的读写操作会利用传输层操作底层字节缓冲区，从而构造出 NetworkReceive 和 Send 对象
- Send 字节缓冲区表示要发送出去的数据，NetworkReceive 的 size 缓冲区表示数据的长度，buffer 缓冲区表示数据的内容
- 传输层对 SocketChannel 做了轻量级的封装，和 SocketChannel 一样都实现了 ScatteringByteChannel, GatheringByteChannel
- TransportLayer 作为 kafkaChannel 的成员变量，Selector 在调用 KafkaChannel read() 和 write() 时，最终会通过 NetworkReceive.readFrom() 和 Send.writeTo() 来调用 TransportLayer 底层的 SocketChannel read() write() 方法

### 四、Kafka 通道上的读写操作

**1. write 调用流程**

- NetworkClient.send() -> Selector.send() -> KafkaChannel.setSend() 这时候已经绑定了一个 OP_WRITE 事件，同时将 Send 设置为成员变量

```java
// NetworkClient.send()
public void send(ClientRequest request, long now) {
	......
	selector.send(request.request());
}
// Selector.send()
public void send(Send send) {
    // 获取到 KafkaChannel，往里面存放一个发送请求
    KafkaChannel channel = channelOrFail(send.destination());
    try {
        // setSend 绑定一个 OP_WRITE 事件
        channel.setSend(send);
    } catch (CancelledKeyException e) {
    	......
    }
}
// KafkaChannel.setSend()
public void setSend(Send send) {
    // 往KafkaChannel 里面绑定一个发送出去到请求
    this.send = send;
    // 往 Selector 上绑定一个 OP_WRITE 事件，绑定之后就可以发送请求了
    this.transportLayer.addInterestOps(SelectionKey.OP_WRITE);
}
```

- Selector.poll() 会轮询监听，监听到 write 事件会调用 KafkaChannel.write() -> KafkaChannel.send() 方法调用 Send.writeTo() 方法，最终使用 TransportLayer.write() 方法调用 SocketChannel.write 方法写数据
- 如果一次没有发送完，Selector.poll() 会循环继续发送，发送完了会取消写操作

```java
// Selector.poll() 里面调用到了 Selector.pollSelectionKeys()，这里是监听读写操作的方法
private void pollSelectionKeys(...) {
......
	/* if channel is ready write to any sockets that have space in their buffer and for which we have data */
	/**
	 * TODO 处理发送请求事件
	 * 如果通道已准备好，则写入缓冲区中有空间且有数据的任何套接字
	 * selector 已经注册了一个 OP_WRITE 事件
	 */
	if (channel.ready() && key.isWritable()) {
	    // 获取到要发送的那个网络请求，是这个句代码就往服务端发送数据了
	    // 消息被发送出去之后，移除 OP_WRITE
	    Send send = channel.write();
	    // 已经完成消息发送
	    if (send != null) {
	        this.completedSends.add(send);
	        this.sensors.recordBytesSent(channel.id(), send.size());
	    }
	}
......
}
// KafkaChannel.write()
public Send write() throws IOException {
    Send result = null;
    // TODO send 就是发送方法
    if (send != null && send(send)) {
        result = send;
        send = null;
    }
    return result;
}
// KafkaChannel.send()
private boolean send(Send send) throws IOException {
    // TODO 最终执行发送请求的代码
    send.writeTo(transportLayer);
    // 如果发送完成，移除 OP_WRITE
    if (send.completed())
        transportLayer.removeInterestOps(SelectionKey.OP_WRITE);
    return send.completed();
}
// Send.writeTo()
@Override
public long writeTo(GatheringByteChannel channel) throws IOException {
    long written = channel.write(buffers);
    remaining -= written;
    ......
    return written;
}
// TransportLayer.write() 
@Override
public long write(ByteBuffer[] srcs) throws IOException {
    return socketChannel.write(srcs);
}
```

- 一个完整的发送请求和对应的事件监听步骤
- 设置 Send 请求到 KafkaChannel -> 注册写操作 -> 发送请求 -> Send 请求发送完成 -> 取消写操作

**2. KafkaChannel write 具体步骤**

- 通过 KafkaChannel.setSend() 方法设置要发送的请求对象，并注册写事件
- 客户端轮询到写事件时，会取出 KafkaChannel 中的发送请求，并发送给网络通道
- 如果本次写操作没有全部完成，那么写事件依然存在，客户端还会再次轮询到写事件
- 客户端新的轮询会继续发送请求，发送完成后就取消写事件，并设置返回结果
- 请求发送完成后，加入到 completedSends 集合中，这个数据会被调用者使用
- 请求全部发送完成，send 对象会被重置为空，下一次新的请求才可以继续进行

**3. read 调用流程**

- 和 write 操作类似，一次没有 read 完，也会调用多次，只有缓冲区数据被填满了，才表示接收到一个完整的 NetworkReceive
- Selector.poll() 监听到 read 事件，调用 KafkaChannel.read() -> NetworkReceive.readFrom() 调用 TransportLayer.read() 方法
- 完成连接后会注册 OP_READ 事件，可以接收服务端发送回来的响应了

```java
// Selector.poll() 里面调用到了 Selector.pollSelectionKeys()，这里是监听读写操作的方法
private void pollSelectionKeys(...) {
......
	/* if channel is ready read from any connections that have readable data */
	// 如果通道就绪，则从具有可读数据的任何连接读取
	if (channel.ready() && key.isReadable() && !hasStagedReceive(channel)) {
	    NetworkReceive networkReceive;
	    // 接收服务端发送回来的响应（请求）
	    // networkReceive 服务端发送回来的响应
	    // 不断的读取数据，里面还设计粘包拆包问题
	    while ((networkReceive = channel.read()) != null)
	        // 这里迭代保证读取完整的响应，如果没有读取完整，就一直读
	        addToStagedReceives(channel, networkReceive);
	}
......
}
// KafkaChannel.read()
public NetworkReceive read() throws IOException {
    NetworkReceive result = null;
    if (receive == null) {
        receive = new NetworkReceive(maxReceiveSize, id);
    }
    // 一直在读取数据
    receive(receive);
    // 是否读完一个完整的响应消息
    if (receive.complete()) {
        receive.payload().rewind();
        result = receive;
        receive = null;
    }
    return result;
}
private long receive(NetworkReceive receive) throws IOException {
    return receive.readFrom(transportLayer);
}
// NetworkReceive.readFromReadableChannel()
public long readFrom(ScatteringByteChannel channel) throws IOException {
    return readFromReadableChannel(channel);
}
public long readFromReadableChannel(ReadableByteChannel channel) throws IOException {
    int read = 0;
    if (size.hasRemaining()) {
        // 先读取 4字节 数据，代表后面消息体大小，如果还有剩余空间会一直循环读取
        int bytesRead = channel.read(size);
        if (bytesRead < 0)
            throw new EOFException();
        read += bytesRead;
        // 一直读取到没有剩余空间，说明已经读取到一个 4字节 的 int 类型的数
        if (!size.hasRemaining()) {
            size.rewind();
            int receiveSize = size.getInt();
            if (receiveSize < 0)
                throw new InvalidReceiveException("Invalid receive (size = " + receiveSize + ")");
            if (maxSize != UNLIMITED && receiveSize > maxSize)
                throw new InvalidReceiveException("Invalid receive (size = " + receiveSize + " larger than " + maxSize + ")");
            // 分配一个内存大小空间，就是刚刚读出来的 4字节 int 大小
            this.buffer = ByteBuffer.allocate(receiveSize);
        }
    }
    if (buffer != null) {
        // 读取数据
        int bytesRead = channel.read(buffer);
        if (bytesRead < 0)
            throw new EOFException();
        read += bytesRead;
    }
    return read;
}
```

- 这里 NetworkReceive.readFrom() 会调用 NetworkReceive.readFromReadableChannel()，这个方法是一个处理粘包拆包问题的方法

**4. KafkaChannel read 具体步骤**

- 客户端轮询到读事件时，调用 KafkaChannel.read() 方法，如果网络接收对象不存在，就新建一个
- 客户端读取网络通道的数据，并将数据填充到网络连接对象
- 如果本次读操作没有全部完成，客户端还会再次轮询到读事件
- 客户端新的轮询会继续读取，如果读取完成，则返回结果
- 读取完成后，放到暂时完成的列表中，这个数据会被调用者使用
- 读取全部完成，重置网络接收对象为空，下一次新的读取请求才可以继续进行

### 五、选择器的轮询

- 选择器的轮询根据选择键读写，分别调用 KafkaChannel 的 read() 和 write()，通过不断注册事件、执行事件处理、取消事件，客户端才会发送请求给客户端，并从服务端读取响应结果
- 选择器在轮询到各种事件，要么被提前注册(CONNECT)，要么在处理事件的时候被注册(finishConnect() 注册 READ，setSend() 注册 WRITE)
- 都是交给 KafkaChannel 处理，通过底层网络连接通往的就是远程服务端节点，这就完成了服务端和客户端的通信
- 不同的注册事件在选择器的轮询下，会触发不同的事件处理
- 客户端建立连接时注册连接事件
- 发送请求时注册写事件

只有成功连接后，写事件才会被接着选择到

- 连接事件的会确认成功连接，并注册读事件
- 写事件发生时会将请求发送到服务端，接着客户端就开始等待服务端返回响应结果

```java
@Override
public void poll(long timeout) throws IOException {
    if (hasStagedReceives() || !immediatelyConnectedKeys.isEmpty())
        timeout = 0;
    // 从 Selector 上找到有多少个 key 注册了
    int readyKeys = select(timeout);
    if (readyKeys > 0 || !immediatelyConnectedKeys.isEmpty()) {
        pollSelectionKeys(this.nioSelector.selectedKeys(), false, endSelect);
        pollSelectionKeys(immediatelyConnectedKeys, true, endSelect);
    }
    // TODO 对 stagedReceives 里面的状态进行处理
    // 没有新的选择键，说明要读取的已经都读取完
    addToCompletedReceives();
    ......
}
private void pollSelectionKeys(Iterable<SelectionKey> selectionKeys,
                               boolean isImmediatelyConnected,
                               long currentTimeNanos) {
    // 遍历所有的 key
    Iterator<SelectionKey> iterator = selectionKeys.iterator();
    while (iterator.hasNext()) {
        SelectionKey key = iterator.next();
        iterator.remove();
        // 根据 key 找到对应的 KafkaChannel
        KafkaChannel channel = channel(key);
        try {
            /* complete any connections that have finished their handshake (either normally or immediately) */
            // 完成任何已经完成握手的连接(正常或立即)
            // OP_CONNECT
            if (isImmediatelyConnected || key.isConnectable()) {
                // TODO 最后完成网络连接
                // 完成连接会绑定 OP_READ 事件
                if (channel.finishConnect()) {
     ......}
            /* if channel is not ready finish prepare */
            // 如果通道没有准备好
            if (channel.isConnected() && !channel.ready())
                channel.prepare();
            /* if channel is ready read from any connections that have readable data */
            // 如果通道就绪，则从具有可读数据的任何连接读取
            if (channel.ready() && key.isReadable() && !hasStagedReceive(channel)) {
                NetworkReceive networkReceive;
                // 接收服务端发送回来的响应（请求）
                // networkReceive 服务端发送回来的响应
                // 不断的读取数据，里面还设计粘包拆包问题
                while ((networkReceive = channel.read()) != null)
                    // 这里迭代保证读取完整的响应，如果没有读取完整，就一直读
                    addToStagedReceives(channel, networkReceive);
            }
            /* if channel is ready write to any sockets that have space in their buffer and for which we have data */
            /**
             * TODO 处理发送请求事件
             * 如果通道已准备好，则写入缓冲区中有空间且有数据的任何套接字
             * selector 已经注册了一个 OP_WRITE 事件
             */
            if (channel.ready() && key.isWritable()) {
                // 获取到要发送的那个网络请求，是这个句代码就往服务端发送数据了
                // 消息被发送出去之后，移除 OP_WRITE
                Send send = channel.write();
                // 已经完成消息发送
                if (send != null) {
                    this.completedSends.add(send);
                    this.sensors.recordBytesSent(channel.id(), send.size());
                }
            }
        } catch (Exception e) {
        	......
        }
    }
}
```
