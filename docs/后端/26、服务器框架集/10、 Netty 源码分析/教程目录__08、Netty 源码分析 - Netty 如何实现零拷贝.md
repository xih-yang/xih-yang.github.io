# 08、Netty 源码分析 - Netty 如何实现零拷贝
- 来源：https://ddkk.com/zhuanlan/server/netty/3/8.html
- 分类：服务器框架
- 分组：教程目录
上一篇文章我们就零拷贝原理进行了分析，一文彻底弄懂零拷贝原理

本篇文章我们就来讲讲 Netty 的零拷贝，在这之前，我们先来了解一下 Java 是怎么实现零拷贝的。

## Java 实现零拷贝

Java 实现零拷贝是基于底层操作系统的。就目前而言，Java 支持两种零拷贝技术：`mmap/write`方式及`sendfile`方式。

### 1、Java提供 mmap/write 方式

Java NIO 提供的`MappedByteBuffer`，用于提供`mmap/write`方式。

Java NlO 中 的`Channel`(通道)就相当于操作系统中的内核缓冲区，有可能是读缓冲区，也有可能是网络缓冲区，而Buffer就相当于操作系统中的用户缓冲区。

以下是一个`MappedByteBuffer`的使用案例：

```java
File file = new File("jw.txt");
try {
    FileChannel fc = new RandomAccessFile(file, "rw").getChannel();
    MappedByteBuffer map = fc.map(FileChannel.MapMode.READ_WRITE, 0, file.length());
    map.put("jiangwang".getBytes());
    fc.position(file.length());
    map.clear();
    fc.write(map);
} catch (IOException e) {
    e.printStackTrace();
}
```

上述示例中，通过`FileChannel.map()`方法来创建`MappedByteBuffer`，该方法底层就是调用Linux的 `mmap()`实现的。

该方法将内核缓冲区的内存和用户缓冲区的内存做了一个地址映射。这种方式适合读取大文件，同时也能对文件内容进行更改，但是如果其后要通过`SocketChannel`发送，还是需要CPU进行数据的拷贝。

使用MappedByteBuffer，如果是小文件，执行效率不高；而且`MappedByteBuffer`只能通过调用`FileChannel`的`map()`取得，再没有其他方式。因此，Java 中设计`MappedByteBuffer`就是为大文件准备的。

### 2、Java 提供 sendfile 方式

Java `FileChannel.transferTo()` 底层实现就是通过 Linux 的 `sendfile`实现的。该方法直接将当前通道内容传输到另一个通道，没有涉及`Buffer`的任何操作。

以下是`FileChannel.transferTo()`的使用示例：

```java
//使用sendfile:读取磁盘文件，并网络发送
FileChannel sourceChannel = new RandomAccessFile(source, "rw").getChannel();
SocketChannel socketChannel = SocketChannel.open(sa);
sourceChannel.transferTo(0, sourceChannel.size(), socketChannel);
```

## Netty 实现零拷贝

Netty 中的零拷贝的实现是基于 Java 的，换言之，底层也是基于操作系统实现的。相对于 Java 中的零拷贝而言，Netty 的零拷贝更多的是偏向于优化数据操作的概念。

Netty 中的零拷贝体现在以下几个方面：

- Netty 提供了CompositeByteBuf类，它可以将多个ByteBuf合并为一个逻辑上的ByteBuf，避免了各个ByteBuf之间的复制。
- 通过wrap操作，可以将 byte [] 数组、ByteBuf、ByteBuffer等包装成一个 Netty ByteBuf 对象，进而避免了复制操作。
- ByteBuf支持slice操作，因此可以将ByteBuf分解为多个共享同一个存储区域的ByteBuf，避免了内存的复制。
- 通过FileRegion包装的FileChannel.transferTo()实现文件传输，可以直接将文件缓冲区的数据发送到目标Channel，避免了通过循环 while方式导致的内存复制问题。

从上面几个方法可以看出，前三个方法都是广义零拷贝，其实现方式都是为了减少不必要的数据复制，偏向于应用层数据优化操作。而第四个方法，`FileRegion`

包装的`FileChannel.transferTo()`，才是真正的零拷贝（狭义零拷贝）。

下面分别来看其每一种实现。

### 1、CompositeByteBuf 方式

CompositeByteBuf 将多个`ByteBuf`合并为一个逻辑上的`ByteBuf`，类似于用一个链表，把分散的多个`ByteBuf`通过引用连接起来。分散的多个`ByteBuf`在内存中可能是大小各异、互不相连的区域，通过链表串联起来，作为一块逻辑上的大区域。而在实际数据读取时，还是会去各自每一小块上读取。

下图展示了 CompositeByteBuf 的原理：

以下是CompositeByteBuf 使用的代码示例：

```java
ByteBuf header = ...
ByteBuf body = ...
CompositeByteBuf compositeBuffer = Unpooled.compositeBuffer();
compositeBuffer.addComponents(true, header,body);
```

### 2、wrap 方式

可以通过 wrap操作来实现零拷贝。

通过wrap 操作，可以将 byte [] 数组、ByteBuf、ByteBuffer等包装成一个 Netty ByteBuf 对象。

例如，通过 `Unpooled.wrappedBuffer`方法来将 bytes 包装成为一个`UnpooledHeapByteBuf`对象，而在包装的过程中，是不会有复制操作的。即最后生成的 ByteBuf 对象是和 bytes 数组共用了同一个存储空间，对 bytes 的修改也会反映到 ByteBuf 对象中。

以下是`Unpooled.wrappedBuffer`使用的代码示例：

```java
ByteBuf header = ...
ByteBuf body = ...
ByteBuf allByteBuf = Unpooled.wrappedBuffer(header,body);
```

### 3、slice 方式

可以通过 slice 方式实现零拷贝，原理图如下：

通过Slice 操作，将`ByteBuf`分解为多个共享同一个存储区域的`ByteBuf`。slice 恰好是将一整块区域，划分成逻辑上的独立小区域，在读取每个逻辑上的小区域时，实际会去按 `slice(int index,int length)`方法中的`index`和`length`去读取原内存 buffer 的数据。

以下是slice 使用的示例代码：

```java
ByteBuf bytebuf = ...
ByteBuf header = bytebuf.slice(0,5);
ByteBuf body = bytebuf.slice(5,10);
```

### 4、 FileRegion 方式

`FileRegion`底层包装的是 Java 的`FileChannel.transferTo()`实现文件传输，因此可以直接将文件缓冲区的数据发送到目标`Channel`。这种方式才是真正操作系统级别的零拷贝。

以下是`FileRegion`使用的代码示例：

```java
public void channelRead0(ChannelHandlerContext ctx, String msg) throws Exception {
    RandomAccessFile raf = null;
    long length = 0;
    try {
        //1.通过 RandomAccessFile 打开一个文件
        raf = new RandomAccessFile(msg, "r");
        length = raf.length();
    } catch (Exception e) {
        ctx.writeAndFlush("ERR:" + e.getClass() + ": " + e.getMessage());
        return;
    } finally {
        if (length < 0 & raf != null) {
            raf.close();
        }
    }
    ctx.write(raf.length());
    if (ctx.pipeline().get(SslHandler.class) == null) {
        //2.调用 raf.getChannel() 方法获取一个 FileChannel
        //3.将FileChannel封装成一个DefaultFileRegion
        ctx.write(new DefaultFileRegion(raf.getChannel(), 0, length));
    } else {
        ctx.write(new ChunkedFile(raf));
    }
    ctx.write("\n");
}
```

## 总结

通过以上的介绍，相信小伙伴们对于**Netty的零拷贝**机制原理也有了一定的了解，有没有思考一个问题，当我们向缓冲区写入数据时，如果写入的数据超过设置的容量（capacity）怎么办？其实Netty 提供了动态扩容机制，有兴趣的小伙伴们可以自己去了解一下。我们下节来讲讲Netty的引导程序的源码分析。
